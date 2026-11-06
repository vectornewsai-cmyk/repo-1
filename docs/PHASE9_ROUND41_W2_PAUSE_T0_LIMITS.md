# Phase 9 đợt 41, luồng W2 — Hoàn thiện sửa lỗi preview pause t=0 (nợ đợt 40 §5.7, V3) — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
KHÔNG code giả, KHÔNG binary hay dist vào repo, KHÔNG tự stage batch
paths (parent gộp). Chỉ sửa file thuộc luồng mình + 1 dòng exclude
trong `tsconfig.json` (file chung, theo mẫu các đợt trước). Mọi số
dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì ghi rõ, không
mạo nhận.

## 0. Kết luận ngắn

1. **DSF=2 + race (skip rồi retry) nay bắt TRỰC TIẾP trên browser.**
   Dưới 4 busy-loop CPU nền, clip 360p ở DSF=2: skip 2 → 5 rồi mới
   draw 1 ở 0,6 s, canvas hiện nội dung (mean 127,5), vòng lặp ngủ
   lại với `lastDrawn = 0`, bộ đếm cap reset về 0. Nợ "DSF=2 + race
   chưa bắt trực tiếp" của đợt 40 đã đóng.
2. **Media hỏng vĩnh viễn nay DỪNG, không tick rAF mãi.** Cap 600
   lần render pause bị skip liên tiếp: blob ngẫu nhiên 100 KB (không
   phải MP4) đi đúng đường render-retry, đếm lên đúng 600 sau ~10 s
   rồi `pauseRetryExhausted = true`, `sleeping = true`, ticks đứng
   yên ở 608 và skip đứng yên ở 600 suốt 90 s quan sát. Nợ "chưa đặt
   cap" của đợt 40 đã đóng, kèm đánh đổi ghi rõ ở §2.4.
3. **DPR phân số và 4K ở DPR > 1 đều đo được trên máy này.**
   DSF=1,25 → backing 890×295 đúng css×1,25; DSF=1,5 → 1069×354
   (713×1,5 = 1069,5 làm tròn xuống 1069, lệch ≤ 1 px do làm tròn
   số nguyên của canvas). 4K (testsrc2 3840×2160, 7,5 MB) ở cả DSF=1
   và DSF=2 đều vẽ được pause t=0 sau chuỗi skip dài (27 và 16),
   DSF=2 backing 1424×468 đúng trần min(dpr,2). Nợ "dpr phân số, 4K
   ở dpr > 1" đã đóng.
4. **Safari / máy thật: CHƯA ĐO.** Toàn bộ đối chứng trên Chromium
   Linux headed (Playwright chromium-1248, Xvfb :98, cờ
   `--force-device-scale-factor`), không có Safari hay thiết bị thật
   trong môi trường này — không mạo nhận kết quả cho 2 nền tảng đó.

## 1. Việc 1 — Bắt trực tiếp race DSF=2 (skip rồi retry)

Phương pháp mới so với đợt 40: harness poll mỗi 100 ms (thay vì
1 s) ngay từ khi app ready, để thấy được CHUỖI thay đổi của
`hold.skip`/`hold.draw`/`idle.pauseRetrySkipped`, không chỉ trạng
thái cuối. Clip testsrc2 640×360 3 s (313.311 byte, tự tạo bằng
ffmpeg, giống clip đợt 40), 4 busy-loop CPU nền (mỗi loop
`Math.sin` liên tục trên 1 tiến trình Node), DSF ép bằng cờ Chrome.

Chuỗi đo được (lượt DSF=2, tải 4 loop; mẫu 0,1–0,3 s là giai đoạn
app settle — ticks reset 3→4, `hold` chưa phơi — nên chuỗi race
tính từ 0,4 s):

| Thời điểm | mean | hold draw/skip | idle ticks / sleeping / pauseRetrySkipped |
|---|---|---|---|
| 0,4 s | 12,7 (nền đen) | 0 / 2 | 5 / false / 2 |
| 0,5 s | 12,7 | 0 / 5 | 8 / false / 5 |
| 0,6 s | 127,5 (nội dung) | 1 / 5 | 9 / true / 0 |
| đuôi 25 s | 127,5 | 1 / 5 | 9 / true / 0 |

Đọc: 2 lần render đầu bị skip (element chưa có frame — đúng race
của lỗi gốc), các tick vẽ lại tiếp tục skip tới 5, rồi 1 lần vẽ lại
vẽ được, canvas hiện nội dung, vòng lặp ngủ LẠI với frame và bộ đếm
cap reset về 0 (không cạn cap oan). Backing 1424×468 = css 712×234
nhân đúng 2 (trần min(dpr,2)). Verdict harness: `raceCaptured =
true, skipBeforeFirstDraw = 5, allPass = true`.

Bằng chứng này MẠNH HƠN đợt 40 ở chỗ: đợt 40 chỉ thấy trạng thái
cuối (skip 3 / draw 1 sau 15 mẫu 1 s); đợt này thấy từng bước skip
tăng rồi draw xuất hiện trong lúc vẫn pause, kèm bộ đếm cap chạy
đồng bộ với `hold.skip` (2 → 5 → reset 0).

## 2. Việc 2 — Cap cho media hỏng vĩnh viễn

### 2.1 Thiết kế (file mới `apps/web/src/lib/pauseDraw41W2.ts`)

- Hằng `PAUSE_RETRY_TICK_CAP = 600`.
- `pauseRetryAdvance(skipped, previous)`: vẽ được → đếm về 0, hết
  cạn; bị skip → đếm +1, cạn khi đếm >= 600.
- `pauseRetryMaySleep(exhausted, pendingSeek, lastRequested,
  playhead)`: chỉ đúng khi đã cạn, không seek bay, và lastRequested
  vẫn là playhead hiện tại.
- Bộ đếm đếm cả lần render trong `.then` của seek lẫn các tick vẽ
  lại sau đó, cùng một playhead t (cả hai đều là "lần render pause
  bị skip" như nhau; `.then` là lần skip đầu tiên của chuỗi).

### 2.2 Vì sao cap đếm TICK, không đếm GIÂY

Dưới tải, tick rAF giãn ra nên 600 tick cho element NHIỀU thời gian
tường hơn — hội tụ muộn vẫn kịp. Ở máy nhanh 600 tick chỉ ~10 s
(60 Hz) hoặc ~5 s (120 Hz) rồi ngủ. Bằng chứng đợt 40–41: đường
retry hội tụ sau 3 skip (tải nặng, 360p), 16–27 skip (4K, không tải)
— cap 600 gấp hơn 20 lần con số lớn nhất đã quan sát, nên không cắt
hội tụ thực tế nào; nếu tương lai có trường hợp cần > 600 skip thì
đó là tín hiệu để tăng cap kèm bằng chứng, không phải để bỏ cap.

### 2.3 Nối vào `apps/web/src/preview.tsx` (marker `// ROUND41-W2`)

- Biến closure `pauseRetrySkipped` / `pauseRetryExhausted` trong
  effect vòng lặp; `PreviewIdleDebug` thêm 2 trường tương ứng để
  harness đo được "vì sao ngủ" (ngủ thường vs ngủ vì cạn cap).
- `.then` của seek ở nhánh pause: vẽ được → reset đếm; skip → tăng
  đếm (lần skip đầu tiên của chuỗi).
- Tick vẽ lại: đã cạn cap thì KHÔNG render nữa, để `scheduleNext`
  cho ngủ; chưa cạn thì render như cũ + cập nhật đếm.
- `scheduleNext`: giữ nguyên đường ngủ thường, THÊM một đường ngủ
  mới (ngủ kiểu bỏ cuộc) qua `pauseRetryMaySleep` — không thay điều
  kiện cũ, không đụng nhánh playing, guard 2 s, `seekCompletedThisTick`.
- Reset cap ở cả 3 chỗ reset lastDrawn/lastRequested: nhánh
  request-seek mới, khối justPaused, khối redrawFlag. Nhờ đó scrub
  sang t khác, phát-tạm-dừng hay đổi nội dung đều vẽ lại bình
  thường sau khi đã cạn cap.

### 2.4 Đánh đổi ghi rõ (đọc kỹ trước khi dùng số này làm baseline)

- **Media chỉ CHẬM hơn cap thì không tự hiện frame.** Sau khi vòng
  lặp đã ngủ vì cạn cap, element sẵn sàng muộn không chạm store nên
  không có gì đánh thức vòng lặp; frame chỉ hiện khi user tác động
  (scrub sang t khác, bấm phát/tạm dừng, đổi nội dung). Đây là giá
  phải trả để media HỎNG không quay rAF mãi; với cap 600 tick,
  trường hợp "chậm hơn cap" thực tế chỉ xảy ra khi máy gần như đứng
  hình, lúc đó scrub lại cũng là hành vi user tự nhiên.
- **Scrub về ĐÚNG t đã bỏ cuộc mà không đổi playhead** (store không
  đổi giá trị nên không đánh thức vòng lặp) vẫn giữ nền đen cho tới
  lần tác động khác; scrub sang t khác thì seek mới reset cap.
- **Cap này CHỈ chặn vòng lặp vẽ lại (render-retry).** Media hỏng
  theo kiểu seek timeout / seek lỗi đi đường khác trong preview.tsx
  (reset lastRequested → tick sau request seek mới) và KHÔNG bị cap
  này chặn — xem nợ §6.2. Đừng claim cap này sửa mọi dạng media hỏng.

### 2.5 Bằng chứng browser: vòng lặp DỪNG (không chỉ mô hình)

Seed blob ngẫu nhiên 100 KB (không phải MP4, mime khai video/mp4,
manifest khai 640×360/3 s), DSF=1, không tải, poll 500 ms × 90 s:

| Thời điểm | hold skip | idle ticks / sleeping / pauseRetrySkipped / exhausted |
|---|---|---|
| 0,5 s | 35 | 43 / false / 35 / false |
| 5,0 s | 307 | 315 / false / 307 / false |
| 9,5 s | 579 | 587 / false / 579 / false |
| 10,0 s | 600 | 608 / **true** / 600 / **true** |
| 10,5–80,5 s (mỗi 10 s) | 600 (đứng yên) | 608 (đứng yên) / true / 600 / true |

Đọc: đếm tăng đều ~60/s (đúng nhịp rAF 60 Hz, khớp nhịp skip), chạm
đúng 600 sau ~10 s thì vòng lặp ngủ; suốt 80 s sau đó ticks và skip
đứng yên tuyệt đối — vòng lặp đã DỪNG, không còn render nền đen
nữa. Canvas giữ nền đen (mean 12,7) là đúng với media hỏng: cap
không tạo ra frame giả, chỉ dừng việc quay vô ích. Lỗi nhỏ gặp lúc
seed (lần chạy đầu): `crypto.getRandomValues` giới hạn 65.536
byte/lần gọi nên seed 100 KB bị `QuotaExceededError` — đã sửa
harness chia chunk 65.536 byte, không liên quan code sản phẩm.

## 3. Việc 3 — Đo thêm: DPR phân số, 4K ở DPR > 1

Cùng phương pháp §1 (clip testsrc2 tự tạo bằng ffmpeg, serve bằng
static server Node trên dist build từ code CÓ cap W2, KHÔNG bấm Phát
trước khi kết luận). Tiêu chí: mẫu pause cuối có nội dung (mean
khác nền 12,67 quá 2 đơn vị), `hold.draw ≥ 1`, vòng lặp ngủ, backing
đúng trần min(dpr,2) với sai số làm tròn ≤ 2 px.

| Lượt | DSF (dpr báo cáo) | CSS → backing | Pause t=0 | Kết quả |
|---|---|---|---|---|
| DPR phân số 1,25 | 1,25 | 712×236 → 890×295 (đúng css×1,25) | mean 127,6; draw 1 / skip 0; ngủ, ticks 11 | ĐẠT nội dung + backing (không có race vì không tải — `raceCaptured = false` ở đây là đúng, không phải lỗi; verdict `allPass` của harness đòi race nên báo false, đừng đọc nhầm thành fail) |
| DPR phân số 1,5 | 1,5 | 713×236 → 1069×354 (713×1,5 = 1069,5 làm tròn xuống 1069) | mean 127,9; draw 1 / skip 0; ngủ, ticks 9 | ĐẠT nội dung + backing (cùng lưu ý verdict như trên) |
| 4K, DSF=1 | 1 | 711×232 → 711×232 | skip 5→9→14→20→25→27 rồi draw 1 ở 0,7 s; mean 128,0; ngủ, ticks 33, đếm cap reset 0 | PASS — 4K tự nó đã đủ chậm để tạo race dài mà không cần tải |
| 4K, DSF=2 | 2 | 712×234 → 1424×468 (đúng trần min(2,2)) | skip 1→4→6→8→12→15→16 rồi draw 1 ở 0,8 s; mean 127,5; ngủ, ticks 22, đếm cap reset 0 | PASS — **4K ở DPR > 1 đo được** |

Ghi chú: css hơi khác nhau giữa các lượt (711–713 × 232–236) là
nhiễu layout của panel preview, không phải lỗi DPR; backing luôn
khớp css×min(dpr,2) trong sai số làm tròn. Chuỗi skip 4K dài nhất
(27) vẫn chỉ bằng 4,5% cap 600 — cap không cắt hội tụ 4K.

## 4. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (2 file):

- `apps/web/src/preview.tsx` — import `pauseDraw41W2` + biến closure
  đếm cap + 2 trường `PreviewIdleDebug` + 6 hunk marker
  `// ROUND41-W2` (§2.3). Không đụng vùng của luồng khác; không
  reformat file.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude
  `src/lib/pauseDraw41W2.test.ts` (theo mẫu mọi test file trong repo).

MỚI (2 file code + LIMITS này):

- `apps/web/src/lib/pauseDraw41W2.ts` — hằng cap + 2 hàm thuần (§2.1).
- `apps/web/src/lib/pauseDraw41W2.test.ts` — 13 test (§5).

KHÔNG ĐỔI: mọi code sản phẩm khác, paths-loop, build-loop-log.
Scratch ở `/tmp/round41-w2/` (dist build tạm, clip test tự tạo
`clip360.mp4` / `clip720.mp4` / `clip4k.mp4`, harness
`pause-t0-w2.mjs`, JSON kết quả `results/w2-*.json`) — không vào
batch. Lưu ý: `apps/web/dist/index.html` có mtime 13:15 trong lúc
đợt này chạy, nhưng luồng này build ra `/tmp/round41-w2/dist`
(`--outDir` tường minh) và không ghi vào `apps/web/dist` — mtime đó
nhiều khả năng do một luồng đợt 41 khác chạy song song; parent gộp
nên đối chiếu, đừng gán cho luồng này và đừng đưa dist vào batch.

## 5. Kiểm chứng gộp của luồng (số thật)

- Unit mới `pauseDraw41W2`: **13/13** (hàm thuần 8 + mô phỏng vòng
  lặp 5, gồm: hội tụ sau 3 skip kiểu đợt 40; hỏng → đủ 600 skip →
  ngủ, tick sau không render; không seek storm; reset khi scrub /
  justPaused / redrawFlag).
- Hồi quy chạy lại bằng `node --experimental-strip-types`:
  `pauseDraw40V3` **11/11**, `holdFrame` **13/13**, `seek` **15/15**,
  `reversePlaybackRound39T6` **10/10**, `reversePlaybackRound28L2`
  **17/17** — tổng cộng với test mới: **79/79, fail 0**.
- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build --outDir /tmp/round41-w2/dist` (không đụng
  `apps/web/dist`): **pass 40,69 s**, bundle có chứa code cap mới
  (grep thấy `pauseRetryExhausted`); cảnh báo chunk > 500 kB cũ.
- Đối chứng browser (§1–§3): 6 lượt Chromium headed, JSON tại
  `/tmp/round41-w2/results/` — DSF=2 tải 4 loop PASS (race), 1,25 +
  1,5 ĐẠT (nội dung + backing), 4K DSF=1 + DSF=2 PASS, broken 90 s
  DỪNG ở cap. Clip 720p đã tạo (1.175.015 byte) nhưng không cần dùng
  cho kết luận nào (360p + 4K đã đủ phủ 2 đầu phổ) — không mạo nhận
  đã đo 720p.

## 6. Nợ mở (không mạo nhận đã xong)

1. **Safari / máy thật chưa đo** (toàn bộ trên Chromium Linux headed,
   DSF ép bằng cờ) — cùng giới hạn như các đợt trước; DPR phân số
   và 4K trên Safari/máy thật vẫn là nợ.
2. **Seek-timeout / seek-lỗi với media hỏng vẫn chưa có cap.**
   Cap W2 chỉ chặn đường render-retry (seek đã xong nhưng không có
   frame — đúng dạng blob ngẫu nhiên đo được ở §2.5). Một biến thể
   hỏng khác (vd file có metadata nhưng frame không giải mã được,
   seek timeout 1200 ms rồi reset lastRequested) sẽ đi đường request
   seek mới lặp lại và chưa được đo hay chặn trong luồng này — cần
   một lượt riêng: seed biến thể đó, quan sát xem nó đi đường nào,
   rồi quyết cap cho đường seek (cẩn thận: seek retry là cơ chế hội
   tụ dưới tải, không được chặn bừa).
3. **Con số T6 17,808 ms → 6,886 ms vẫn không đo lại** (đường stepping
   không đổi trong luồng này; nợ cũ từ đợt 40 §6.2 giữ nguyên).
4. **Pool-miss và ảnh chưa load** vẫn giữ hành vi cũ của V3 (nợ cũ
   từ đợt 40 §6.4 giữ nguyên).
5. **Hành vi sau khi cạn cap** (media chậm hơn cap chỉ hiện lại khi
   user tác động, §2.4) là đánh đổi có chủ đích, không phải bug —
   nhưng nếu user phản ánh "scrub cùng t không hiện frame", đó chính
   là trường hợp này, đừng sửa bằng cách bỏ cap mà hãy cân nhắc cơ
   chế đánh thức nhẹ (vd poll chậm sau khi ngủ) ở đợt sau kèm đo.

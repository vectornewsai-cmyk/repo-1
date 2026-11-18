# PHASE9_ROUND111_M2_2MIB_LIMITS.md — M2: G6 §8.5c preload-before-seek + ring 8 MiB trên c8

> Luồng M2, Phase 9 đợt 111 (VCut Studio). Chạy: 2026-11-14 05:45Z –
> 06:14Z (14/11 12:45–13:14 +07). Boot #40 (73316ed9…, 05:16:36Z),
> gap #39→#40 ≈ 2h25'48" — KHÔNG phá sàn 19'07" (khoảng đã chứng nhận
> [19'07", 3h14'08"]). Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> ĐO LƯỜNG thuần túy — KHÔNG sửa file production nào.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c8 `~/workspace/round96-x1/clips-faststart/c8.mp4`
> (8.182.985 B, 32 s). Postboot-check PASS 05:38Z (đủ điều kiện WebKit).
> **Cấm:** TTS 39, birefnet, `.github/workflows/*`. Prereg:
> `hidden_files/round111-m2/prereg-m2.md` (viết TRƯỚC khi chạy, ngân sách
> 10 run — đã dùng 10/10: CTL2 P0-2 P2 R8-2 PT2; 0 run vô hiệu).

## Kết luận chính (TL;DR)

1. **Recount độc lập số liệu L2-A: KHỚP 100% (nhiệm vụ 1 phụ).** Code
   recount riêng (`m2_recount_111.py`, không import script L2): r1/r2
   mỗi run 14 spliced pulls, delta đúng +4.194.304, 0 OTHER, cùng 7
   req_off (9939/48426/66916/80895/97529/114176/126851). Đối chứng
   L2-F r2 cũng khớp (8 spliced +2.097.152, 0 OTHER).
2. **Preload-before-seek (G6 §8.5c) KHÔNG giảm/khử được splice
   (nhiệm vụ 2).** Cả 3 cách đọc đều đo và đều thất bại:
   - Đọc (a) "fetch đủ trước khi element tạo": blob-file ĐÃ làm vậy mà
     L2-A vẫn splice 2/2 — đã bị bác từ đợt 110, ghi nhận làm nền.
   - Đọc (b) "chờ element full buffer rồi play" (P0): **không đạt được**
     — WebKit chỉ buffer tới ~17,5 s rồi `suspend` khi paused
     (readyState 4 từ t≈0,7 s nhưng buffered kẹt [0,17,42]); chờ 20 s
     cũng không lên full. P0 thực tế đo "chờ 20 s paused rồi play":
     2/2 bogus (2 + 12 spliced pulls), không giảm so với CTL 1/2.
   - Đọc (b') "chờ rồi seek" (P): 1/2 bogus (14 pulls, đủ chữ ký L2-A)
     như CTL 1/2 — bar prereg (cả 2 run ≤1/4 CTL tương ứng) KHÔNG ĐẠT.
   - Đọc (c) "play-through hết clip rồi seek" (M2PT, khám phá post-hoc):
     cả 2 run đều splice (2 + 234 pulls) — ngay cả full buffer thật
     trước seek cũng không ngăn được splice.
   - Chi tiết quyết định: splice xảy ra **lúc scan khởi động pipeline**
     (P r1: 14 pull ở shim ms 806–808; P0 r1: 2 pull ở ms 665; PT r1:
     2 pull ở ms 23423 = pull đầu tiên), TRƯỚC mọi play/seek — chờ hay
     seek sau đó không chữa được. Và seek sau play-through tự nó tái
     hiện splice (PT r2: burst 234 pull trong 26 ms, toàn bộ vùng seek
     dịch +4 MiB).
3. **Ring 8 MiB trên c8: 0 splice cả 2 run (nhiệm vụ 3) — bar prereg ĐẠT,
   nhưng chưa chứng minh được.** Ring-only 8 MiB
   (L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608, J2 unset → max-size-bytes
   giữ mặc định 2097152, readback OK cả 2 run): 0 spliced, phủ hết wall
   (last pull ms 43991/35515). Phù hợp "ring > file tắt splice"
   (8.388.608 > 8.182.985). NHƯNG: cả 2 run đều ít flood (2,76/3,28 —
   cùng dải với mọi run sạch khác) + không restart (1 queue2/run) nên
   chưa tách được "ring 8 MiB tắt splice" khỏi "run ít flood thì sạch";
   Fisher gộp ring-4MiB c8 wall-30s (L2-A 2/2 + M2 CTL/P0/P 4/6 = 6/8)
   vs R8 0/2: **p≈0,13 (hai phía)** — chưa đạt <0,05 với n=2. Cần run
   R8 có flood cao / ép restart mới kết luận chặt (nợ mở).
4. **Đề xuất production (nhiệm vụ 4 — CHỈ ĐỀ XUẤT, CHỜ QUYẾT): KHÔNG đưa
   "chặn set-lại ring" thành sửa production — KIỂM CHỨNG LẠI, GIỮ NGUYÊN
   đề xuất L2.** Dữ liệu mới không mở ra đường nào mà L2 chưa xét:
   shim vẫn là LD_PRELOAD không ship được; repo vẫn không có API đổi
   ring của queue2 do WebKit tạo nội bộ; mitigation "ring > file"
   vẫn không có mức cố định phủ được video user (R8 chỉ phủ file
   ≤8 MiB); và không có chiến lược preload nào ở tầng element tránh
   được splice (P/P0/PT đều thất bại). Hướng production thực tế vẫn là:
   giữ fallback http hiện có (đã cứu phát lại sau mọi run bogus, kể cả
   seek lỗi ở PT r2) — không quyết hộ ở đây.
5. **Phát hiện phụ mạnh (gộp 10 run): flood tách sạch/bogus tuyệt đối.**
   8 run prereg (cùng wall 30 s): run sạch có APUSH 2,76–3,28 flood,
   run bogus có 5,49–6,64 flood — tách hoàn toàn, không chồng lấn.
   Khớp L2 (sạch 3,36 vs bogus 7,53 flood). Đây là bằng chứng gộp
   mạnh nhất từ trước tới nay cho giả thuyết "writer vượt reader hơn
   một vòng ring" — nhưng vẫn là tương quan (flood đếm cả run, không
   phải lag tức thời tại thời điểm splice); chưa đo trực tiếp lag
   push/take.

## 1. Prereg và tuân thủ

- Prereg viết trước mọi probe (`hidden_files/round111-m2/prereg-m2.md`):
  4 arm CTL/P0/P/R8 × 2 run + 2 run dự phòng; bar từng arm đăng ký
  trước (P/P0: cả 2 run ≤1/4 spliced của run CTL tương ứng; R8: 0
  spliced cả 2 run + phủ wall last-pull ≥25 s; M2PT là arm khám phá
  post-hoc, bar ghi vào progress TRƯỚC khi chạy).
- Thực hiện: 10/10 run hợp lệ (frames > 0 VÀ GST > 0 VÀ pull ≥ 100,
  theo thực hành J2/K2/L2), 0 run vô hiệu, 0 run cần chạy lại.
- Runner M2 = copy runner L2 (port 8941, Xvfb :198, OUT 111m2), thêm:
  opts page-eval `preloadWait` (chờ readyState 4 + buffered ≥
  duration−0,5 s, tối đa 20 s) + `seekAfterPreload` (seek rồi chờ
  'seeked' tối đa 10 s) + `wallAfterPlay` (wall 30 s tính từ lúc
  play() xong — để arm P/P0 không bị wall ngắn lại do thời gian chờ,
  tránh bias giảm splice giả tạo) + `playThroughThenSeek` (M2PT).
  Shim dùng lại `l2_queue2_probe.so` của L2, md5 `b208e8de…`
  (bản playbin3 + PULL_CAP 2000). Runner KHÔNG dùng vite (http server
  + esbuild riêng) nên không đua watcher ENOSPC, không cần vite.lock.
  Xvfb :198 đã kill sau khi xong; không có vite mồ côi (không vite nào
  được khởi động bởi luồng này).
- `media.ts` md5 `2c384ed13703809d5e999311147745e7`, mtime 2026-11-12 —
  KHÔNG đổi trong suốt lượt (đóng nợ L2 §7.4: ghi md5 media.ts).
  Bundle probe chỉ import `apps/web/src/media` (entry
  `webkit-blob-prefetch-entry.ts` dòng 4) nên đường media dưới probe
  giống hệt L2-A.
- **Cây đổi giữa chừng:** `preview.tsx` md5 đổi 9b27abe5 → c4198206
  (mtime 05:46:19Z) do luồng M1 đợt 111 sửa production cùng lúc (fix E4
  tail-ceiling, xem `round111-m1/md5-fixed.txt`). preview.tsx KHÔNG
  nằm trong bundle probe → không ảnh hưởng kết quả đo; nhưng mọi run
  M2 đều ghi previewMd5=c4198206 trong JSON env (ghi rõ để khỏi nhầm
  với 9b27abe5 của L2/L9).

## 2. Bảng quyết định (mọi con số offset từ `m2_recount_111.py`, đọc trực tiếp từ clip)

| Arm | Run | Bogus (spliced pulls, delta) | EXACT / PULL | APUSH floods | queue2 | Frames / finalCt | Verdict |
|---|---|---|---|---|---|---|---|
| CTL (L2-A lặp lại, J2=4 MiB) | r1 | NO (0) | 1240 / 1242 | 3,19 | 1 | 136 / 24,88 | Sạch |
| CTL | r2 | YES (16, +4.194.304) | 1300 / 1318 | 5,49 | 2 | 568 / 25,91 | Bogus, đủ chữ ký + req_off 9923 mới |
| P0 (chờ 20 s rồi play) | r1 | YES (2, +4.194.304) | 1514 / 1520 | 5,92 | 2 | 477 / 29,96 | preloadFull=FALSE |
| P0 | r2 | YES (12, +4.194.304) | 1506 / 1522 | 5,87 | 2 | 636 / 30,06 | preloadFull=FALSE |
| P (chờ 20 s + seek 16 s) | r1 | YES (14, +4.194.304) | 1096 / 1114 | 6,64 | 2 | 78 / 32 | seek OK (4,3 s) |
| P | r2 | NO (0) | 1080 / 1082 | 3,08 | 1 | 157 / 32 | seek OK (5,7 s) |
| R8 (ring-only 8 MiB) | r1 | NO (0) | 546 / 548 | 2,76 | 1 | 4 / 9,08 | Mỏng (play-timeout) nhưng hợp lệ |
| R8 | r2 | NO (0) | 1322 / 1324 | 3,28 | 1 | 45 / 26,33 | Sạch, phủ wall |
| M2PT (play-through + seek) | r1 | YES (2, +4.194.304) | 2628 / 2634 | 8,87 | 3 | 54 / 32 | Splice ở pull đầu (scan) |
| M2PT | r2 | YES (234, +4.194.304) | 3104 / 3342 | 5,48 | 1 + fallback | 233 / 32 | Seek lỗi → burst 234 pull → fallback http |

- Gộp ring 4 MiB c8 wall 30 s (cùng protocol): L2-A 2/2 + M2 CTL 1/2 +
  P0 2/2 + P 1/2 = **6/8 bogus**; R8 0/2; M2PT 2/2 bogus (protocol khác:
  wall dài hơn do play-through).
- Mọi spliced pull trong đợt này đều delta đúng +4.194.304, 0 OTHER,
  0 pull delta khác — quy luật offset=ring giữ tuyệt đối (kể cả burst
  234 pull của PT r2).
- Chữ ký splice: req_off 9939/48426/66916/80895/97529/114176/126851
  (7 vị trí L2-A, mỗi cái ×2 typefind+qtdemux0); CTL r2 thêm 9923
  (đầu atom `free`, 9923/8 — vị trí mới, vẫn cùng delta +4.194.304).

## 3. Nhiệm vụ 1 — Recount L2-A (kiểm lại bằng code riêng)

- `m2_recount_111.py` (viết mới, không import script L2): đọc trực tiếp
  byte clip, kiểm delta ứng viên +1.048.576/+2.097.152/+4.194.304/
  +8.388.608 rồi search toàn file; đếm APUSH + last-pull ms.
- Kết quả: L2-A r1 14 spliced +4.194.304 (602 EXACT, 4 nodata, 0 OTHER,
  APUSH 42.996.357 B ~5,25 flood, first/last pull ms 11916/36104);
  r2 14 spliced (740 EXACT, 5 nodata, 0 OTHER, APUSH 43.574.435 B
  ~5,33 flood, 11714/39352). **KHỚP 100% với L2 LIMITS §2 + L9 §2**
  (cả số pull, delta, req_off, 0 OTHER). Đối chứng L2-F r2: 8 spliced
  +2.097.152 (807 EXACT, 0 OTHER, ~7,53 flood) — khớp L2.
- Verdict: số liệu L2-A đứng vững; không có đính chính nào cho L2.

## 4. Nhiệm vụ 2 — Preload-before-seek (G6 §8.5c): KHÔNG giảm splice

### 4.1 P0 — chờ full buffer rồi play: tiền điều kiện KHÔNG đạt được

- Cả 2 run: `preloadWaitMs` = 20.070 / 20.032 (chạm trần 20 s),
  `preloadFull` = FALSE. Element đạt readyState 4 + `canplaythrough`
  từ t≈0,7 s nhưng `buffered` kẹt ở [0, 17,42] rồi `suspend` — WebKit
  không buffer tiếp khi paused. Chờ bao lâu cũng không lên full
  (đã chờ 20 s = 62% thời lượng clip).
- **Kết luận phụ (quan trọng, đo được lần đầu): "preload đầy đủ ở tầng
  element" là trạng thái KHÔNG TỒN TẠI trong WebKit blob playback khi
  paused — engine tự suspend ở ~17,5 s (~55% clip 32 s).** Mọi thiết kế
  mitigation dựa trên "chờ element buffer hết rồi mới play/seek" đều
  không thực thi được ở tầng này. Cách duy nhất có full data trước
  seek là fetch hết vào Blob bằng JS (blob-file đã làm — và vẫn splice).
- Kết quả P0 (đọc đúng là "chờ 20 s paused rồi play"): 2/2 bogus
  (2 + 12 spliced pulls, delta +4.194.304). So với CTL 1/2: không giảm.
  Bar prereg (≤1/4 CTL tương ứng): r1 2 vs 0, r2 12 vs 16 → KHÔNG ĐẠT.
  Lưu ý: cả 2 run P0 đều có 2 queue2 (restart) + flood ~5,9 — chờ
  paused dường như kéo theo restart/re-flood (tương quan, chưa chứng
  minh nhân quả).

### 4.2 P — chờ rồi seek: không giảm; splice xảy ra TRƯỚC seek

- Cả 2 run: preloadFull=FALSE (như P0); `seekedOk`=TRUE cả 2 (seek tới
  16 s: seeking→seeked 4,3 s / 5,7 s — seek chậm, ghi nhận phụ; sau
  seek buf [[0,32]] đầy). r1 BOGUS (14 spliced, đủ chữ ký L2-A),
  r2 SẠCH (0 spliced). Tỉ lệ 1/2 = CTL 1/2. Bar prereg: KHÔNG ĐẠT
  (r1 14 > 1/4×0; chỉ r2 đạt).
- **Chi tiết quyết định:** 14 pull splice của P r1 đều ở shim ms
  806–808 — ngay lúc scan khởi động pipeline, TRƯỚC seek (page
  t≈20–25 s) và TRƯỚC play. P0 r1 tương tự (2 pull ở ms 665).
  Splice không phải do seek gây ra ở các run này, và seek sau đó
  không chữa được — vì pipeline đã scan + flood ring ngay khi src
  được gán (preload=auto khởi động pipeline ngay, không đợi play()).

### 4.3 M2PT — play-through rồi seek (khám phá post-hoc): seek tự tái hiện splice

- Cả 2 run: `ptFull`=TRUE (play-through 52,4 s / 34,5 s — decode chậm
  do RAM khả dụng chỉ 1022/1420 MB lúc chạy).
- r1: play-through hoàn tất (ended, ct=32), seek 16 s OK; chỉ 2 spliced
  pulls (req_off=0 ×2, shim ms 23423 = pull đầu tiên lúc scan) — pha
  sau seek 0 splice. Bar M2PT: có splice → KHÔNG ĐẠT.
- r2: play-through sạch (0 splice trong pha 0→32); seek tới 16 s LỖI
  (seeking 36,32 → abort/emptied 36,59 + error-event, seekedOk=FALSE)
  → **burst 234 spliced pulls trong 26 ms** (shim ms 40577–40603,
  117 req_off 2.752.183–3.984.297, mỗi cái ×2 typefind+qtdemux0, toàn
  bộ delta +4.194.304) → pipeline fallback về http, replay 0→32 sạch.
  Gán bằng `l2_attrib_110.py`: toàn bộ 234 pull → blob-media-player-0
  (chain qtdemux0←parsebin0←urisourcebin0←uridecodebin3←blob-player-0);
  pipeline fallback regular-media-player-1/qtdemux1 0 splice.
  Diễn biến này xảy ra trong lúc load1 bùng tới 27,33 (sóng tải luồng
  khác) — ghi nhận, không loại trừ tải là yếu tố góp phần.
- **Kết luận M2PT:** ngay cả khi element đã phát hết clip một lượt
  (trạng thái "full buffer" thật duy nhất đạt được), seek sau đó vẫn
  tái hiện splice — lần này là burst toàn bộ vùng seek dịch +4 MiB.
  §8.5c thất bại ở cả dạng mạnh nhất của nó. (Và mitigation này vốn đã
  phi thực tế: phải phát hết clip trước khi seek.)

### 4.4 Tổng kết §8.5c

| Đọc §8.5c | Trạng thái | Kết quả |
|---|---|---|
| (a) Fetch đủ trước khi element tạo (blob-file) | Đã có từ L2-A | 2/2 bogus — bác |
| (b) Chờ element full buffer rồi play (P0) | Không đạt được (suspend ở ~17,5 s) | 2/2 bogus — bác |
| (b') Chờ rồi seek (P) | Seek OK, buffer kẹt | 1/2 bogus = CTL — bác |
| (c) Play-through rồi seek (M2PT) | Đạt full buffer thật | 2/2 bogus (2 + 234 pull) — bác |

## 5. Nhiệm vụ 3 — Ring 8 MiB trên c8: 0 splice, bar đạt kèm caveat

- Cấu hình: chỉ đổi ring (`L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`,
  J2 unset). L2Q2 cả 2 run đọc lại đúng: max-size-bytes=2097152
  (mặc định, không động vào) + ring-buffer-max-size=8388608 OK —
  tách biến sạch (khác L2-A: cả hai đều 4 MiB).
- r1: 0 spliced (546 EXACT, 548 PULL, last pull ms 43991, APUSH ~2,76
  flood, 1 queue2). Mỏng (4 frames, play-timeout-10s do metadata chậm
  tới t≈13,9 s, RAM 1435 MB) nhưng HỢP LỆ theo thực hành K2/L2-A
  (bằng chứng splice là byte đọc trực tiếp, không phụ thuộc frames).
- r2: 0 spliced (1322 EXACT, 1324 PULL, last pull ms 35515, APUSH
  ~3,28 flood, 1 queue2, 45 frames, playOk=true). Load lúc bắt đầu
  run này bùng 22,28 (sóng tải luồng khác) nhưng run vẫn sạch.
- Bar prereg: **ĐẠT** (0 splice cả 2 run + phủ hết wall).
- **Caveat bắt buộc (ghi trước khi ai trích dẫn quá mức):**
  (1) n=2. Fisher R8 0/2 vs gộp ring-4MiB c8 wall-30s 6/8: p≈0,13 hai
  phía (tự tính: [[0,2],[6,2]]); vs riêng M2 ring-4 (4/6): p≈0,43.
  Chưa đạt <0,05 — "ring 8 MiB tắt splice" là phù hợp với dữ liệu,
  chưa phải chứng minh.
  (2) Confound flood: cả 2 run R8 đều ít flood (2,76/3,28) + không
  restart. Chưa tách được "ring lớn tắt splice" khỏi "run ít flood
  thì sạch" (xem §6 — mọi run sạch đều ít flood). Cần run R8 ép
  restart / flood cao mới kết luận chặt.
  (3) Nếu "ring > file" đúng thì đây chỉ là mitigation cho file ≤8 MiB;
  không có mức cố định nào phủ được video user (xem §7).

## 6. Bằng chứng gộp: flood tách sạch/bogus tuyệt đối (8 run prereg)

| Run | Flood (APUSH/file) | queue2 | Bogus |
|---|---|---|---|
| CTL r1 | 3,19 | 1 | NO |
| CTL r2 | 5,49 | 2 | YES (16) |
| P0 r1 | 5,92 | 2 | YES (2) |
| P0 r2 | 5,87 | 2 | YES (12) |
| P r1 | 6,64 | 2 | YES (14) |
| P r2 | 3,08 | 1 | NO |
| R8 r1 | 2,76 | 1 | NO |
| R8 r2 | 3,28 | 1 | NO |

- Run sạch: 2,76–3,28 flood. Run bogus: 5,49–6,64 flood. Tách hoàn
  toàn, không chồng lấn. Khớp L2 (sạch 3,36 vs bogus 7,53 flood;
  L2-A bogus ~5,3 flood). (M2PT tách riêng vì wall dài hơn:
  r1 8,87 flood/bogus, r2 5,48 flood/bogus — cùng chiều.)
- Diễn giải: số flood ≈ số lần pipeline restart/re-flood toàn file.
  Mỗi restart là một cơ hội writer vượt reader hơn một vòng ring.
  Tương quan này là bằng chứng gộp mạnh nhất cho cơ chế ring-wrap —
  nhưng vẫn là tương quan trên tổng cả run, không phải lag tức thời
  tại thời điểm splice. Đừng trích dẫn như chứng minh nhân quả trực
  tiếp (cùng caveat L2 §5.8).
- Hệ quả thực hành cho probe sau: muốn tạo splice chắc chắn hơn thì
  ép restart/flood (wall dài, tải vừa); muốn run sạch thì tránh
  restart. Nhưng ép restart để đo R8 sẽ làm mất tính "tự nhiên" của
  run — cần prereg rõ khi làm.

## 7. Nhiệm vụ 4 — Có nên đưa chặn set-lại ring thành sửa production không: KHÔNG

Kiểm chứng lại đề xuất L2 bằng dữ liệu mới — verdict KHÔNG đổi, lý do:

1. **Shim không ship được.** Cơ chế chặn là LD_PRELOAD chặn
   `g_object_set`/`gst_element_factory_make` trong WebProcess — một
   web app không thể ship cơ chế này. Không có dữ liệu mới nào thay
   đổi được điểm này (đây là giới hạn kiến trúc, không phải số đo).
2. **Repo không có đường chạm ring.** queue2 do WebKit tạo nội bộ
   (playbin3); repo không có API nào đổi được ring-buffer-max-size
   của nó. M2 không phát hiện đường mới nào (không đụng code WebKit).
3. **"Ring > file" không có mức cố định.** R8 tắt splice trên c8
   (8,2 MB) nhưng video user có thể hàng trăm MB–GB. Muốn theo hướng
   này phải đổi ring ĐỘNG theo kích thước file — mà repo không có
   đường đổi (mục 2). Dữ liệu R8 (0/2, p≈0,13 gộp) cũng chưa đủ mạnh
   để đặt spec cho một thay đổi kiến trúc.
4. **Không có mitigation thay thế nào từ §8.5c.** P/P0/PT đều thất bại
   (xem §4) — không có chiến lược preload nào ở tầng repo tránh được
   splice, nên cũng không có gì để "đổi lấy" việc bỏ hướng ring.
5. **Fallback http vẫn là lưới an toàn production.** Mọi run bogus đợt
   này đều phát lại được sau splice (finalCt tới cuối clip; PT r2 seek
   lỗi → fallback http replay sạch 0→32). Tác hại user thấy chỉ là
   giật/lỗi thoáng qua rồi phát tiếp, không phải video hỏng.

Đề xuất giữ nguyên (chờ user/main-chat quyết): không đưa chặn set-lại
ring thành sửa production; giữ fallback http; nếu sau này có đường can
thiệp WebKit thì mục tiêu đúng phải là ring-buffer-max-size (không phải
max-size-bytes) và phải lớn hơn file lớn nhất — đã có bằng chứng R8
(ring-only 8 MiB tắt splice trên c8, max-size giữ 2 MiB mặc định).

## 8. Caveat bắt buộc + vận hành

1. **n nhỏ:** mỗi arm chỉ 2 run. Mọi verdict "0/2" chỉ là "phù hợp",
   không phải chứng minh — trừ verdict bác-bỏ bằng phản-ví-dụ (P/P0/PT
   bác "preload ngăn được splice"; R8 không bác được gì vì 0 splice).
2. **Đồng hồ khác nhau:** page-clock vs shim-clock (ms) vs GST-clock có
   gốc khác nhau, KHÔNG so trực tiếp được. Gán pha pull (scan vs seek)
   trong §4 dùng thứ tự tương đối + mốc sự kiện (first_pull_ms, ms
   splice so với ms tạo playbin trên cùng đồng hồ shim; seekMs trên
   page-clock chỉ dùng để biết seek xảy ra trước/sau play). Riêng PT r2:
   burst ms 40577–40603 (shim) so với playbin fallback tạo ms 41268
   (shim) → burst thuộc pipeline blob, chắc chắn (cùng đồng hồ shim).
3. **Tải máy + reboot:** reboot #40 lúc 05:16:36Z (trước lượt); sóng tải
   của luồng khác trong lượt (hog m3 lúc đầu; load1 bùng 22,28 lúc R8
   r2, 27,33 lúc PT r2). Các lượt hợp lệ đều bắt đầu lúc load1 ≤ ~6
   trừ R8 r2 (22,28) và PT r2 (27,33) — cả hai vẫn cho kết quả rõ ràng
   (R8 r2 sạch, PT r2 burst splice) nên tải không làm mất verdict,
   nhưng là yếu tố nhiễu ghi nhận.
4. **RAM thấp:** khả dụng 1022–3385 MB lúc chạy (thấp nhất PT r1:
   1022 MB — play-through chậm 52,4 s, ~0,6× realtime; R8 r1:
   play-timeout do metadata chậm). Số frames thấp ở vài run (R8 r1:
   4 frames; PT r1: 54 frames) không làm mất verdict vì bằng chứng
   splice là byte đọc trực tiếp (PULL ≥ 548 mọi run).
5. **Cây đổi giữa chừng (M1):** preview.tsx đổi md5 lúc 05:46:19Z
   (9b27abe5 → c4198206, fix E4 của M1). Không ảnh hưởng probe (bundle
   chỉ import media.ts, xem §1) nhưng mọi run M2 ghi previewMd5
   c4198206 — đừng so nhầm với 9b27abe5 khi đối chiếu JSON.
6. **PULL_CAP 2000:** không run nào chạm cap (PULL tối đa 3342/run
   nhưng chia nhiều instance; mỗi instance < 2000) nên "0 splice"
   không bị cắt cửa sổ. Nhóm R8 last pull ms 35515–43991 phủ hết wall.
7. **M2PT là post-hoc:** bar ghi vào progress TRƯỚC khi chạy M2PT
   (không phải sau khi thấy số liệu), nhưng arm này không có trong
   prereg gốc — trích dẫn thì ghi rõ "khám phá, n=2".
8. **Tên case duy nhất:** M2CTL/M2PRE0/M2PRE/M2R8/M2PT + run — không
   run nào ghi đè log thô của run khác (rút kinh nghiệm L2 E/G).

## 9. Nợ mở cho đợt sau

1. **Ring 8 MiB — tách flood khỏi ring:** chạy R8 với wall dài hơn /
   ép restart (vd loop 2 vòng c8, hoặc tải vừa làm chậm reader) để có
   run R8 flood cao; nếu vẫn 0 splice khi flood ≥5 thì "ring > file
   tắt splice" mới đứng vững. Prereg rõ trước khi chạy.
2. **Cơ chế flood→wrap:** đo trực tiếp lag push/take tại thời điểm
   splice (nâng PUSH cap / log đếm) thay vì dùng tổng APUSH cả run.
3. **Seek chậm 4–6 s (P arm) + seek lỗi sau play-through (PT r2):**
   điều tra riêng — seek latency/error có thể là vấn đề UX độc lập với
   splice (RAM thấp có thể là yếu tố).
4. **Sustained splice (PT r2, 234 pull):** burst toàn bộ vùng seek dịch
   +4 MiB — mẫu mới, khác chữ ký 14-pull. Cần tái hiện (seek sau
   play-through, tải vừa) để biết có phải dạng ổn định hay chỉ do sóng
   tải 27,33.
5. **Gán el1/el2 tuyệt đối** (nợ L2 §7.1): log phía page khi
   dropElement/videoFor tạo element mới — vẫn chưa làm.
6. Nợ đứng yên từ đợt 110 (xem LIMITS gộp đợt 110 §10): G1 + mù #22 +
   mù #28 chờ user quyết, cuộc đua tail-ceiling/restart-seek (M1 đợt
   111 đang làm), zombie lượt thứ 3 + quyết bracket/quy tắc loại stall
   + quyết bar CDP, điểm gãy tải, CDP timeout mẫu mới, EPERM probe #30
   + mù #29, bảo đảm mức pixel F6', phần C stale-module + 51 file
   clicktest "w", birefnet 0 lần thành công, TTS 39 CẤM kiểm lại,
   ci-security.yml 403, release gate.

## 10. Batch stage (KHÔNG push)

`phase9-round111-m2-2mib.txt` (4 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_111m2_2mib.mjs` (runner M2: copy
  runner L2, port 8941, Xvfb :198, OUT 111m2; thêm opts preloadWait /
  seekAfterPreload / wallAfterPlay / playThroughThenSeek + mode M2CTL /
  M2PRE0 / M2PRE / M2R8 / M2PT; 69.407 B — >37.768, cần
  `ENABLE_PRIVSEP=0` khi push)
- `benchmarks/render/m2_recount_111.py` (recount độc lập: đọc trực tiếp
  byte clip, kiểm delta +1.048.576/+2.097.152/+4.194.304/+8.388.608,
  đếm APUSH/flood, last-pull ms)
- `benchmarks/results/webkit-blob-flaky-111m2-2mib.json` (10 case:
  M2CTL2 M2PRE0-2 M2PRE2 M2R8-2 M2PT2; 45.195 B — >37.768, cần
  `ENABLE_PRIVSEP=0` khi push)
- `docs/PHASE9_ROUND111_M2_2MIB_LIMITS.md` (file này)

Không stage binary (`.so` dùng lại của L2 ở `hidden_files/round110-l2/`,
md5 b208e8de; c16 không dùng đợt này). Dữ liệu thô đầy đủ ở
`hidden_files/round111-m2/` (prereg, progress, recount, 5 log chạy,
pull/gst/dot/bundle từng run, xvfb198.log). KHÔNG push.

# Phase 9 đợt 97 — Y3: retry-play lỗi muộn >3s — TÁI HIỆN TRỰC TIẾP, CỨU ĐƯỢC, NỢ ĐÓNG

**Nợ gốc:** LIMITS gộp đợt 96 §4 mục 3 — retry-play lỗi muộn (>3 s) chưa tái
hiện trực tiếp lần nào (max đo được 2,16 s trong 128 case X3).
**Ngày:** 2026-11-12 (lượt cron 18:35 +07; làm việc ~11:37–12:20Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không sửa production.
Không đụng TTS 39, không đụng `.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐÃ ĐO — NỢ ĐÓNG. Retry-play cứu được lỗi muộn, đo trực tiếp tới
17,3 s sau play. Không cần mở rộng wall hay thêm watchdog cho error muộn.**

## 1. Kết luận ngắn

| | Kết quả |
|---|---|
| Lỗi muộn tái hiện trực tiếp? | **CÓ — 16/16 case** có error-event ở 8,4–17,3 s sau playCalled |
| Retry-play single-shot cứu được? | **12/12** retry95W2 bắn (LATEBAD4 8/8 + LATEBAD8 4/4); phát lại tiếp tục 12/12 |
| App-tick cứu được? | **4/4** (LATEBAD4TICK) — tick play lại trước retry, retry 0/4 (đúng như X3 §5) |
| Đối chứng delay-không-rác | 4/4 không lỗi, không retry — delay tự nó không gây lỗi |
| Đối chứng lỗi sớm (d=0) | 4/4 lỗi ở 0,8–2,4 s, retry cứu 4/4 |
| Sửa production? | **KHÔNG** — cơ chế retry không có timeout (arm ở error, bắn ở canplay) nên đã đủ; wall 20 s chỉ là cửa sổ đo của probe, không phải giới hạn code |

- **Error muộn nhất đo được: 17,29 s sau play** (LATEBAD8-c2-run1, delay 8 s +
  qtdemux parse rác ~9 s dưới tải cao). Retry bắn đúng tại canplay sau error
  (+0,0 s — retryAtS == canplayAfterErrT cả 4 case LATEBAD8 sau khi sửa
  artifact t0), phát lại tiếp tục (4 frame, ct 0,25 — xem §4 về cửa sổ đo).
- **Không có ngưỡng "quá muộn" nào lộ ra tới 17,3 s.** Error càng muộn thì
  phần phát còn lại trong wall càng ngắn, nhưng retry vẫn bắn và phát lại
  vẫn tiếp tục. Giới hạn thực tế là thời lượng clip còn lại, không phải
  retry-play.

## 2. Thiết kế thí nghiệm (probe-only, lỗi THẬT)

Probe mới `benchmarks/render/webkit_blob_flaky_97y3.mjs` (port 8905,
bundle production build mới từ `media.ts` hiện tại, WebKitGTK headed,
Xvfb claim 1 display cho cả lượt).

### 2a. Hai cách tiêm lỗi muộn đã thử — một thất bại, một thành công

**Thất bại — revoke blob đang phát (feas-revoke.mjs, R1/R2, 4 case):**
revokeObjectURL(blob) ở play+3,5 s, có và không có seek tới 15 s (vùng chưa
buffer). Seek xảy ra thật (seeking@5,81, seeked@7,22, ct=15) nhưng **0
error cả 4 case** — clip phát tới cuối (ct=24, 196 frame sau seek; run đối
chứng R1-run2: 409 frame, finalSrc blob). Kết luận: revoke không phá được
pipeline blob đã mở trong WebKit — webkitwebsrc giữ dữ liệu blob sau khi
mở, kể cả khi seek. Cách này KHÔNG dùng được để tiêm lỗi muộn; ghi lại để
đợt sau khỏi thử lại. (1/4 case lỗi sớm tự nhiên của blob flaky, retry cứu —
không liên quan tới revoke.)

**Thành công — trì hoãn + byte rác (LATEBAD):** server probe `/slow/<file>?d=N&mode=bad`
trì hoãn cả headers lẫn body N ms rồi mới trả 88 KB byte rác (bad.mp4).
Element (src http proxy) + prefetch fetch đều bị chặn N ms; `play()` gọi
NGAY như app thật (không chờ blob). Error event tới ở ~N + thời gian
qtdemux parse rác (0,8–4,2 s ở d=0; tới ~9 s ở d=8 s dưới tải cao).
Đường fallback về clip gốc + retry-play 95W2 là code production nguyên vẹn
(`media.ts`, marker "Đợt 95 W2") — không đụng code trong lượt này.

### 2b. Các mode

- `ERRBASE` (d=0, rác): đối chứng lỗi sớm — xác nhận byte rác gây error
  thật + retry cứu (W2 chưa từng chạy mode ERR: 0 case trong JSON 95w2).
- `LATEBAD4` (d=4000, rác): lỗi muộn mục tiêu ~4–5 s — thực tế tới ở
  8,4–9,2 s (delay 4 s + parse rác ~4,5 s dưới tải cao).
- `LATEBAD8` (d=8000, rác): lỗi muộn hơn — tới ở 16,7–17,3 s.
- `LATEGOOD4` (d=4000, byte thật): đối chứng chỉ-delay — không lỗi, không
  retry, phát tốt.
- `LATEBAD4TICK` (d=4000, rác + app-tick videoFor/play mỗi 500 ms):
  đường cứu trong app thật.

## 3. Số liệu chi tiết (24 case, 0 runError)

| Mode | n | errAfterPlayS | retry95 bắn | rescued* | frames | finalCt |
|---|---|---|---|---|---|---|
| ERRBASE | 4 | 0,79–2,40 | 4/4 | 4/4 | 65–198 | 8–18,0 |
| LATEBAD4 | 8 | **8,40–9,21** | 8/8 | 8/8 | 90–163 | 8–10,3 |
| LATEBAD8 | 4 | **16,71–17,29** | 4/4 | 3/4 | 4–25 | 0,25–1,79 |
| LATEGOOD4 | 4 | — (0 error) | 0/4 | 4/4 phát tốt | 60–181 | 8–14,2 |
| LATEBAD4TICK | 4 | 8,43–8,89 | 0/4 (tick cứu trước) | 4/4 | 59–174 | 8–10,9 |

\* `rescued` = error-event có + totalFrames > 0 + finalCt > 1 (tiêu chí X3).

- **LATEBAD4 (8/8):** error từ src http, code null (MEDIA_ERR_SRC_NOT_SUPPORTED,
  message rỗng — đúng chữ ký WebKit); play() reject "The operation is not
  supported."; canplay sau error +1,0–1,2 s; playing sau error +1,1–1,4 s;
  retry bắn tại canplay; finalSrc http cả 8 case.
- **LATEBAD8 (4/4 retry bắn, phát lại tiếp tục 4/4):** retryAtS ==
  canplayAfterErrT chính xác cả 4 case (18,20 / 18,21 / 18,51 / 19,18).
  Case c2-run1 chỉ đạt finalCt 0,25 / 4 frame vì wall 20 s đóng chỉ 0,73 s
  sau khi retry bắn (canplay@19,18, playing@19,27, samples cuối ct tăng
  0 → 0,25, frames 0 → 4) — **lỗi của cửa sổ đo, không phải của retry**
  (xem §4). 3 case còn lại finalCt 1,50–1,79.
- **LATEBAD4TICK (4/4):** retry95 = null cả 4 — tick app gọi play() lại
  trước khi listener canplay của retry kịp bắn (canplay và playing cùng
  timestamp, vd c6: canplay@9,30 = playing@9,30). Khớp đúng dự đoán X3 §5:
  trong app thật, tick mới là đường cứu chính, retry chỉ là dự phòng.
  Không có case nào tick và retry giẫm nhau (0 lần play thừa ghi nhận).
- **Timeline 1 case (LATEBAD4-c2-run1):** waiting/loadstart@0,21 →
  stalled@3,10 (đang chờ delay, chưa có data) → progress@4,55 (rác tới) →
  error@8,70 (qtdemux mất ~4,15 s mới kết luận rác không parse được) →
  emptied@8,70 (fallback đổi src về clip gốc) → canplay@9,73 →
  playing@9,80.
- **Thời gian parse rác tăng theo tải:** d=0: error sau play 0,8–2,4 s
  (loadavg 0,75–14,7); d=4 s: +~4,5 s sau khi rác tới (loadavg 6–19);
  d=8 s: +~8,7 s (loadavg 1–13). Không có ngưỡng parse cố định — đừng
  dùng errT tuyệt đối làm thước đo, chỉ dùng errAfterPlayS.
- **LATEGOOD4:** 0 error, 0 retry, 0 stall-watchdog trong cả 4 case —
  delay 4 s tự nó không gây lỗi; lỗi ở LATEBAD chỉ tới từ byte rác.
- Môi trường: boot 11:30:25Z (reboot #19); RAM khả dụng 1,2–3,2 GB;
  loadavg 1-phút 0,75–19,12 (cao do các luồng Y đợt 97 chạy song song);
  WebKitGTK 2.55.0 (UA Safari/605.1.15, Version/27.2). Không reboot trong
  lượt đo chính. media.ts mtime 09:56:43Z, không đổi trong lượt.

## 4. Hai artifact đo của chính Y3 (đã sửa / đã ghi rõ)

1. **`retryAtS cộng thêm t0 (~0,6–1,2 s) ở ERRBASE/LATEBAD4/LATEGOOD4`:**
   dataset `retryPlay95W2At` lưu `performance.now()` tuyệt đối, còn probe
   tính `retryAtS = At/1000` mà không trừ `t0` (performance.now() lúc
   evaluate bắt đầu). Hậu quả: retryAtS lớn hơn thời điểm bắn thật đúng
   một hằng số t0 mỗi case (vd ERRBASE-c2: canplay@3,37 nhưng retryAtS
   ghi 4,41). Probe đã sửa trước lượt LATEBAD8/TICK (trả thêm `t0ms`,
   `retryAtS = (At − t0ms)/1000`) — 8 case sau fix cho retryAtS ==
   canplayAfterErrT chính xác, chứng minh retry bắn đúng tại canplay.
   Các case trước fix: dùng canplayAfterErrT làm thời điểm retry (đã ghi
   trong JSON), không dùng retryAtS thô.
2. **Tiêu chí `rescued` (finalCt > 1) quá chặt khi error tới sát cuối wall:**
   LATEBAD8-c2-run1 bị tính "không cứu" dù retry đã bắn và phát lại đã
   tiếp tục (frames 0 → 4, ct 0 → 0,25 trong 0,73 s còn lại của wall).
   Wall 20 s là lựa chọn của probe, không phải giới hạn production — đừng
   trích "3/4" mà không kèm chú thích này.

## 5. Kiểm chứng hồi quy (không sửa production nên chỉ kiểm lại)

- `npx tsc --noEmit` apps/web: **0 lỗi**.
- `vite build`: **PASS** (25,93 s — chậm do tải máy cao).
- Unit test media (esbuild ESM, pattern X8): `media.blobPrefetch90R3`
  **25/25**; `media.retryPlay95W2` **7/7**; `media.retryPlay96X3` **7/7**;
  `media.stallWatchdog96X3` **9/9**.
- 0 xung đột file chung: Y3 không sửa file production nào (chỉ thêm probe
  + JSON + LIMITS này).

## 6. Nợ mở

1. **ĐÃ ĐÓNG — retry-play lỗi muộn >3 s:** đo trực tiếp tới 17,3 s,
   retry bắn 12/12 single-shot, phát lại tiếp tục 12/12, app-tick cứu
   4/4. Không cần mở rộng wall production (không có wall trong code
   retry — chỉ có wall 20 s của probe), không cần thêm watchdog cho
   error muộn.
2. **Revoke blob không phá được pipeline đang phát (mới):** revoke +
   seek vẫn 0 error — blob đã mở thì WebKit giữ dữ liệu. Nghĩa là đường
   "blob bị thu hồi giữa chừng" không phải nguồn lỗi muộn ngoài đời; các
   luồng sau đừng dùng revoke làm cách tiêm lỗi.
3. **Thời gian qtdemux kết luận rác không parse được dao động 0,8–9 s
   theo tải** — chưa có mô hình; chỉ ảnh hưởng tới thời điểm error tới,
   không ảnh hưởng tới việc retry có cứu được không.
4. **Đứng yên:** TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi;
   `.github/workflows/*.yml` 403; release gate không đổi.

## 7. File thay đổi (stage, KHÔNG push)

- `benchmarks/render/webkit_blob_flaky_97y3.mjs` — probe LATEBAD/TICK
  (mode ERRBASE/LATEBAD4/LATEBAD8/LATEGOOD4/LATEBAD4TICK, wall 20 s).
- `benchmarks/results/webkit-blob-flaky-97y3.json` — kết quả 24 case
  (0 runError).
- `docs/PHASE9_ROUND97_Y3_RETRY_LATE_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round97-y3-retry-late`
(`~/workspace/repo-1-push/paths-loop/phase9-round97-y3-retry-late.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y3.md`
(+ thư mục `round97-y3/`: feas-revoke, log chạy, tsc/build/test logs).

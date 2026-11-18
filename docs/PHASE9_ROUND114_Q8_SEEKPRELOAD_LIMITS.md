# PHASE9_ROUND114_Q8_SEEKPRELOAD_LIMITS.md — Q8: Seek/preload UX — vì sao element kẹt ở trần buffer khi paused

> Luồng Q8, Phase 9 đợt 114 (VCut Studio). Chạy: 2026-11-14 15:59Z –
> 16:35Z (22:59 – 23:35 +07). Prereg viết trên boot #45 (13:17:42Z);
> **reboot #46 xảy ra 15:44:49Z** (gap #45→#46 = 2h27'07" — trong
> khoảng đã chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn; số thứ tự
> vẫn TẠM THỜI) — giết driver Q8 lần 1 đang guard. Mọi phép đo (arm
> 16:00–16:35Z) chạy trên **boot #46** (id
> `7a0638c4-950a-45a0-a068-c290310fc0de`); postboot-b46-final của Q7:
> PASS GST + PASS apt (đủ 11 package) — "DU DIEU KIEN chay WebKit".
> Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag. KHÔNG sửa file production nào.**
> Chẩn đoán + đề xuất (mặc định theo prereg §5 — không đủ điều kiện sửa).
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu, vừa được
> Q7 repair apt xong lúc 15:04Z sau reboot #45), Playwright webkit, clip
> c8 `~/workspace/round96-x1/clips-faststart/c8.mp4` (8.182.985 B, 32 s).
> Prereg: `hidden_files/round114-q8/prereg-q8.md` — viết TRƯỚC khi đo
> (14:55Z). **Cấm:** TTS 39, birefnet, `.github/workflows/*`.

## Kết luận chính (TL;DR)

1. **Trần buffer khi paused là CÓ THẬT và xác định — nhưng chỉ trên
   ĐƯỜNG BLOB.** Element blob kẹt ở buffered ≈ **17,1–17,4 s (~53–54%
   clip 32 s)**: 17.421 s tái hiện đúng 3 lần (PAUSED r1/r3, PLAYING r2)
   + 17.081 s (PAUSED r4, pha blob) + M2 P0 r1 (17.421 s, đợt 111).
   Chờ 20 s không lên thêm; chờ bao lâu cũng vậy (M2/P2 đã chờ 20 s).
2. **Cơ chế (H1 — suspend → không còn nhu cầu kéo → buffer đóng băng):
   ĐƯỢC HỖ TRỢ về cơ chế, nhưng bar thời gian KHÔNG ĐẠT do tải** (xem
   §3). Bằng chứng cùng chiều: trần xác định 4 lần; pipeline im lặng
   19,7 s trong lúc chờ ở tải sạch (phân tích offline log P2SEEK);
   0 progress event sau suspend ở **12/12 run**; networkState = 1
   (IDLE) suốt lúc chờ; đường HTTP cùng clip đầy buffer trong 913 ms
   khi paused — trần không phải luật chung của element.
3. **H2 (range/server) BÁC:** cả file 8.182.985 B đã nằm trong adapter
   blob từ đầu scan (APUSH size=8.182.985) — không còn gì để fetch.
4. **H3-độc-lập (chỉ decoder) BÁC; H4 (sự kiện không bắn) ĐÓNG:**
   PULL/demux dừng cùng lúc với suspend (không chỉ decode); progress
   ngừng bắn VÌ fetch dừng (APUSH cũng dừng), không phải ngược lại.
5. **F1 play-then-pause KHÔNG viable:** trần chỉ dịch +2,5 s
   (17.421 → 19.911), dưới bar ≥5 s đã đăng ký. Không dùng làm
   chiến lược preload.
6. **F2 seek-không-chờ VIABLE — khuyến nghị duy nhất:** seek tới 16 s
   ngay (không chờ preload) mất **653/810 ms**, seekedOk TRUE 2/2,
   phát 243/296 frames, kết thúc sạch — ngang P2SEEK (0,44 s, có chờ
   20 s trước). **Chờ 20 s mua được 0 s.** Trong production hiện KHÔNG
   có bước chờ full-buffer trước seek (chờ 20 s chỉ tồn tại trong
   probe M2 §8.5c) nên không có code để sửa — đây là khuyến nghị
   thiết kế: đừng thêm bước chờ kiểu này; mọi mitigation dựa trên
   "chờ full buffer rồi seek" đều không thực thi được trên đường blob.
7. **Đính chính M2 §4.1:** "preload đầy đủ ở tầng element KHÔNG TỒN
   TẠI khi paused" — **chỉ đúng cho ĐƯỜNG BLOB.** Đường HTTP đạt full
   buffer [0,32] trong **913 ms** khi paused (Q8HTTP), và mọi lần
   "full" quan sát được ở arm blob đều đến từ **fallback HTTP sau khi
   blob lỗi** (PAUSED r4/r5, PLAYPAUSE r2). Trần là tính chất của
   pipeline blob/GStreamer, không phải của element nói chung.
8. **KHÔNG sửa production trong lượt này** (F1 fail bar; F2 không có
   code tương ứng để sửa; F3 không đo vì moot sau F1).

## 0. Sự cố env + sóng tải (ghi trung thực — ảnh hưởng trực tiếp tới số liệu)

- **WebKit không launch được lúc đầu (boot #45):** sau reboot #45 thiếu
  `libevent-2.1.so.7` hệ thống (postboot #45 FAIL apt replay — nợ đợt
  113). Q5 lần 1 fail 14:48Z vì lỗi này; Q7 chạy
  `vcut-webkit-postboot-check.sh --repair`, apt cài xong gói lúc
  ~15:04Z (libevent + gstreamer plugins + libavif16 + các lib còn
  thiếu). **Reboot #46 (15:44:49Z)** giết driver Q8 lần 1 đang guard
  (đó là "service restart" đã ghi trong q8-progress.md — đính chính:
  là reboot, không phải restart service); postboot #46 của Q7 PASS
  (apt đủ 11 package), gói apt repair giữ được qua reboot.
  Q8 chờ cờ Q5 tối đa 60 phút theo nhiệm vụ (hạn 15:35Z);
  cờ xuất hiện 15:59:50Z (Q5 chạy 3 lần: fail launch → q1 15:12–15:45
  → lần 3 tới ~15:59). Driver Q8 chạy lại detached
  (setsid+nohup) 15:49Z với guard mới (chờ cờ HOẶC hết tiến trình
  browser/vite Q5, tối đa 12×5 phút) — chỉ đổi thời điểm chạy, không
  đổi protocol đo.
- **Sóng tải Q3:** luồng Q3 chạy `yes` hogs + MiniBrowser song song
  trong khung 16:00–16:18Z (và lại từ 16:34Z). load1 lúc chạy arm blob
  lên tới **18–47** trên máy 2 vCPU (PAUSED r1 24,81; r2 45,98; r3
  17,95; PLAYPAUSE r1 47,45). Hậu quả trực tiếp: blobReady 5,0–9,5 s
  (P2SEEK: 0,15–0,34 s), `stalled` event, progress đến muộn 10–20 s,
  seek 12–17 s (P2SEEK: 0,44 s), play-timeout-10s, chỉ 4–8 frames/30 s
  (P2SEEK: 384), sample bufTrace thưa ~400 ms thay vì 100 ms. Các số
  THỜI GIAN của arm blob (r1–r3, PLAYING, PLAYPAUSE) đều bị kéo dài
  10–30× — chỉ dùng làm bằng chứng về GIÁ TRỊ trần và cơ chế, KHÔNG
  dùng làm số thời gian tuyệt đối. SEEKFAST/HTTP chạy lúc load1 ~1
  nên sạch.
- **Chạy lại lúc tải thấp:** PAUSED r4–r5 chạy 16:32–16:35Z lúc load1
  0,28–0,36 (backup run cho r1–r3 bị nhiễu tải, theo prereg §3).
  Sóng tải quay lại giữa chừng (16:34Z, load1 18,7) nhưng pha chờ của
  r4–r5 đã xong trước đó. Không chạy lại PLAYING (đối chứng "phát thì
  đầy buffer" đã có từ SEEKFAST/HTTP/r4–r5).
- `preview.tsx` md5 `03bf029f…` trước/sau — không đổi. `media.ts` md5
  `2c384ed1…` — không đổi. Shim `l2_queue2_probe.so` md5 `b208e8de…`
  (dùng lại của L2, không biên dịch lại). Runner Q8 = copy P2 + thêm
  bufTrace/seekImmediate/playPause (node --check OK); KHÔNG dùng vite
  (http server + esbuild, port 8944, Xvfb :199 — đã dọn sạch sau khi
  xong, không còn tiến trình nào). Không chạy tsc/vite build: không
  đổi production.

## 1. Prereg và tuân thủ

- Prereg viết trước mọi phép đo mới (14:55Z): 4 giả thuyết H1–H4 + bar
  B-Q8-1..5 + quy tắc sửa §5 (chỉ sửa nếu F1/F2 đạt bar với bằng
  chứng trước/sau, n≥2, tsc+build pass).
- Thực hiện: 12 run (PAUSED r1–r5, PLAYING r1–r2, PLAYPAUSE r1–r2,
  SEEKFAST r1–r2, HTTP r1). Mọi run đều có GST > 0 VÀ pull ≥ 100
  (theo luật run hợp lệ); PLAYING r1 0 frames nhưng vẫn giữ làm vết
  audit (error-event + play-timeout), không xóa.
- Phân tích offline log P2SEEK (trước khi đo mới, ghi ở
  `round114-q8/p2seek-offline-q8.txt`): pipeline im lặng 19,7–19,8 s
  trong lúc chờ paused (0 APUSH/ATAKE/PULL); APUSH đầu đã đẩy cả file
  8.182.985 B vào adapter blob.

## 2. Bảng quyết định (12 run)

load1 = loadavg[0] lúc bắt đầu case. C = median buffered.end 5 s cuối
cửa sổ chờ (tag wait/playpause); "trần blob" = giá trị cao nhất của
pha blob (trước fallback HTTP nếu có). Seek = issue→seeked (từ lúc
gán currentTime tới event seeked; số trong ngoặc = seeking→seeked).

| Arm | Run | load1 | blobReady | preloadWait / Full | Trần blob | Seek | Frames | Fail / finalSrc |
|---|---|---|---|---|---|---|---|---|
| PAUSED | r1 | 24,81 | 4.992 ms | 20.004 ms / FALSE | **17.421 s** | 19,82 s (16,61) / FALSE | 8 | ok / blob |
| PAUSED | r2 | 45,98 | 5.218 ms | 20.076 ms / FALSE | 0,0 s (đói scan) | 5,80 s / TRUE | 6 | ok / blob |
| PAUSED | r3 | 17,95 | 6.103 ms | 21.301 ms / FALSE | **17.421 s** | 13,80 s / FALSE | 6 | ok / blob |
| PAUSED | r4* | 0,36 | 1.925 ms | 6.684 ms / TRUE† | **17.081 s**† | 4,10 s / TRUE | 177 | ok / **http**† |
| PAUSED | r5* | 21,45 | 1.112 ms | 2.319 ms / TRUE† | — (lỗi trước khi sample)† | 1,50 s / TRUE | 211 | ok / **http**† |
| PLAYING | r1 | 0,63 | 2.605 ms | — | — (0 frames) | — | 0 | error-event / http |
| PLAYING | r2 | 21,47 | 6.015 ms | — | **17.421 s**‡ | — | 4 | stall-timeout / blob |
| PLAYPAUSE | r1 | 47,45 | 9.473 ms | — (pause ct=0,167) | **19.911 s** | — | 7 | stall-timeout / blob |
| PLAYPAUSE | r2 | 8,44 | 5.389 ms | — (pause ct=0) | — (fallback)† | — | 8 | error-event / http† |
| SEEKFAST | r1 | 0,77 | 168 ms | — | — | **0,65 s** / TRUE | 243 | ok / http§ |
| SEEKFAST | r2 | 0,96 | 562 ms | — | — | **0,81 s** / TRUE | 296 | ok / blob |
| HTTP | r1 | 2,11 | — | **913 ms / TRUE** | — (full [0,32]) | — | 698 | ok / http |

\* r4–r5: chạy lại lúc tải thấp. † preloadFull=TRUE của r4/r5 đến từ
**fallback HTTP sau error-event blob** (r4 lỗi 5,72 s; r5 lỗi 2,77 s;
src blob→http, finalSrcKind=http, poolInfoMode=skipped) — KHÔNG được
tính là blob đạt full. Pha blob của r4 kẹt ở 17.081 s rồi lỗi; pha
blob của r5 lỗi trước khi có sample buffered khác 0.
‡ PLAYING r2: firstSample buf [[0,17.421]] (ngay sau play, trước khi
phát tiếp).
§ SEEKFAST r1 có error-event 0,61 s rồi fallback HTTP, vẫn seek nhanh
và phát 243 frames.

## 3. B-Q8-1 (cơ chế H1) — KHÔNG ĐẠT bar theo đúng luật (do tải)

Bar đã đăng ký: PAUSED gộp 3 run: C < 31,5 s cả 3, flatness ≤0,1 s cả
3, T_c ≤ 2 s cả 3, im lặng GST ≥18 s cả 3, 0 progress sau suspend cả
3; VÀ PLAYING ≥1/2 run đạt full trong 20 s.

- **C < 31,5 s: ĐẠT 3/3** (17.421 / 0,0 / 17.421; r2 = 0 do đói scan,
  không phải trần). **0 progress sau suspend: ĐẠT 12/12 run.**
- **Flatness ≤0,1 s: KHÔNG ĐẠT** — r1 flat5s = 0,201 s (buffer creep
  nhẹ dưới tải); r3 flat5s = 17,421 s (5 s cuối chứa cú nhảy 0→17,421
  vì scan đến muộn); r2 = 0,0 s nhưng C = 0 (vô nghĩa).
- **T_c ≤ 2 s: KHÔNG ĐẠT** — r1 T_c = 21,53 s page-t (scan bị tải kéo
  dài ~16 s trong cửa sổ chờ); r3 T_c = null (nhảy muộn); r2 không
  có T_c. Ở tải sạch, M2 đo trần đạt từ t≈0,7 s — nhưng Q8 không đo
  lại được T_c sạch vì sóng tải.
- **Im lặng GST ≥18 s: KHÔNG ĐẠT** — im lặng trong cửa sổ chờ
  (phase-aligned, neo wholeFileAPUSH↔swapMs): r1 7.891 ms (43 event
  trong cửa sổ), r2 10.813 ms (48 event), r3 11.777 ms (47 event).
  Pipeline KHÔNG im hoàn toàn trong lúc chờ dưới tải — scan bò chậm
  suốt cửa sổ. Đối chứng tải sạch (P2SEEK offline): im lặng 19,7 s,
  0 event.
- **PLAYING đạt full: KHÔNG ĐẠT** — r1 0 frames (error-event +
  play-timeout), r2 4 frames (stall-timeout). Arm PLAYING hỏng cả 2
  do tải, không dùng được làm đối chứng.
- **Verdict B-Q8-1: KHÔNG ĐẠT — nhưng do dữ liệu bị nhiễu tải, không
  phải vì H1 sai.** Không có bằng chứng nào chống lại H1: trần xác
  định tái hiện 4 lần; suspend → ns=1 + 0 progress 12/12; pipeline
  im 19,7 s ở tải sạch; HTTP đối chứng đầy trong 913 ms. H1 được ghi
  là "được hỗ trợ về cơ chế, chưa đóng bar thời gian" — cần 1 lượt
  tải sạch để đóng bar (xem §8).

## 4. B-Q8-2 (H2 — range/server): BÁC

- APUSH đầu tiên trên adapter blob đã đẩy CẢ file 8.182.985 B
  (P2SEEK offline r1 ms 549; Q8 mọi run blob đều có APUSH
  size=8182985). Không còn byte nào để fetch qua mạng/blob — H2
  không thể là nguyên nhân cho arm blob.
- Arm HTTP cùng clip, cùng máy, chờ paused: preloadFull=TRUE trong
  913 ms, 698 frames, suspend 0,82 s (sau khi buffer đã đầy). Nếu
  range/server là nguyên nhân thì HTTP cũng phải kẹt — nó không kẹt.

## 5. B-Q8-3 (H3 — chỉ decoder) và B-Q8-4 (H4 — sự kiện): BÁC / ĐÓNG

- **H3-độc-lập BÁC:** PULL (nhu cầu kéo của qtdemux) dừng cùng lúc
  với suspend — stall nằm ở tầng kéo/demux, không chỉ ở decoder.
  P2SEEK offline: 0 PULL trong 19,7 s chờ. Q8: im lặng phase-aligned
  7,9–11,8 s trong lúc chờ (dưới tải); đối chứng SEEKFAST/HTTP: PULL
  liên tục, im lặng dài nhất chỉ 185/178 ms. Chuỗi nhân quả đúng là:
  paused → suspend → không decode → queue2 đầy → qtdemux ngừng kéo
  → buffered kẹt (H3 là mắt xích trong chuỗi H1, không phải nguyên
  nhân độc lập).
- **H4 ĐÓNG:** 0 progress event sau suspend ở 12/12 run, VÀ APUSH
  cũng dừng theo (P2SEEK offline + Q8 phase-aligned). Sự kiện phản
  ánh đúng fetch dừng, không phải sự kiện bị mất.

## 6. Fix candidates (B-Q8-5)

- **F1 play-then-pause: KHÔNG ĐẠT bar (≥5 s).** PLAYPAUSE r1:
  play tới ct=0,167 (cửa sổ play 10 s chỉ lên được 0,167 s vì
  load1 47,45), pause, chờ 20 s: buffer 19.414 → 19.911 s (C),
  phẳng 0,0 s ở 5 s cuối. Chênh vs trần paused-từ-đầu:
  19.911 − 17.421 = **+2,49 s < 5 s**. PLAYPAUSE r2 vô hiệu cho F1
  (pauseAtCt=0, playPauseFull=TRUE đến từ fallback HTTP sau lỗi
  23,2 s, không phải từ play-then-pause). Kết luận: trần gần như
  tuyệt đối (~17–20 s từ đầu clip), không dịch đáng kể theo playhead;
  play-then-pause không phải chiến lược preload.
- **F2 seek-không-chờ: ĐẠT bar.** SEEKFAST r1/r2: seekImm 653/810 ms
  (chênh +213/+370 ms so với P2SEEK 440 ms, trong ±500 ms đã đăng
  ký), seekedOk=TRUE 2/2, 243/296 frames, phát hết clip (ended,
  ct=32). Không cần chờ preload mà seek vẫn nhanh, phát vẫn tốt.
- **F3 (phát muted tốc độ cao): KHÔNG ĐO** — moot sau khi F1 fail
  (trần gần tuyệt đối; phát nhanh chỉ là M2PT rút gọn, đã biết phi
  thực tế).
- **Không sửa production:** F1 fail bar; F2 không có code tương ứng
  trong production (không có bước chờ full-buffer trước seek trong
  `preview.tsx`/`media.ts` — chờ 20 s chỉ tồn tại trong probe);
  F3 không đo. Quyết định: chẩn đoán + đề xuất, không sửa (đúng mặc
  định prereg §5).

## 7. Caveat bắt buộc

1. **Sóng tải là nhiễu lớn nhất của lượt này** (§0): mọi số thời gian
   của arm blob (seek 5,8–19,8 s issue→seeked, blobReady 5–9,5 s,
   play-timeout, 4–8 frames) đều là số dưới tải, KHÔNG phải số của
   engine lúc yên. Chỉ SEEKFAST/HTTP/r4–r5 (pha chờ) là gần sạch.
   Lưu ý (theo phát hiện Q3 đợt 114): **load1 trong cell này không
   đáng tin theo nghĩa đen** (load1 sụp về ~1 trong khi 40 hog vẫn
   sống — throttle cgroup) — kết luận "máy bị đói" ở đây dựa trên
   bằng chứng hành vi (blobReady/seek/frames/sample-interval so với
   P2SEEK tải sạch), không dựa một mình vào load1.
2. **Ánh xạ page-t ↔ shim-ms** qua neo wholeFileAPUSH↔swapMs có sai
   số ±giây dưới tải (browser launch + bundle load bị kéo dài 12–16 s
   trước t0); các cửa sổ im lặng phase-aligned dùng neo này.
3. **Phân tích byte KHÔNG kết luận được cơ chế byte của trần 17,421:**
   tổng ATAKE (double-count do re-take), max qtdemux req_off (probe
   EOF 8.183.001 B), frontier liên tục (take không tuần tự trên
   adapter blob) đều không cho đáp án — trần là 17,1–17,4 s theo
   THỜI GIAN, còn nó tương ứng bao nhiêu byte trong ring thì để mở.
4. **Blob error-event (code null) + fallback HTTP: 4/10 run arm blob**
   (PAUSED r4/r5, PLAYPAUSE r2, PLAYING r1) + SEEKFAST r1 (0,61 s).
   Trigger chưa xác định — tương quan với tải cao nhưng chưa chứng
   minh nhân quả. Sau fallback, HTTP phát bình thường và đầy buffer
   nhanh — đây là đường phục hồi đã có sẵn của media.ts, không phải
   hành vi mới.
5. **n nhỏ và không cân bằng:** PAUSED 5 (3 tải nặng + 2 fallback),
   PLAYING 2 (đều hỏng), PLAYPAUSE 2 (1 hỏng, 1 fallback), SEEKFAST
   2, HTTP 1. Không suy rộng quá n.
6. **Không chạy tsc / vite build / suite:** không đổi file production
   nào (chỉ runner copy + script phân tích + LIMITS này); kiểm chứng
   liên quan là recount + phân tích bufTrace/GST (đã chạy, §2–§5).
   Suite cây gộp thuộc luồng verify đợt 114.

## 8. Nợ mở cho đợt sau

1. **Bar B-Q8-1 cần 1 lượt tải sạch** (Tc ≤2 s, flatness ≤0,1 s, im
   lặng ≥18 s, PLAYING đạt full) — lượt này bị sóng tải Q3 phá;
   chạy lại PAUSED+PLAYING khi load1 < 3 ổn định, tránh khung Q3
   chạy hog.
2. **Cơ chế byte của trần 17,421 s:** ring-full 4.194.304 B + overhead?
   Hay biên sample? Cần hook đo frontier kéo của qtdemux (không dùng
   ATAKE totals — đã thử, không kết luận được).
3. **Blob error-event trigger** (4/10 run, code null): xác định nguyên
   nhân (tải? race blob-ready? GStreamer sau apt repair?) — vì nó
   quyết định đường fallback HTTP có được kích hoạt đúng lúc không.
4. **Nợ đứng yên từ đợt 113 (LIMITS gộp 113 §10):** G1 + mù #22/#28/
   #29/#30/#31/#32 chờ user quyết; E4 đóng có điều kiện, cần đợt xác
   nhận tải cao; zombie chẩn đoán cơ chế chuyển clip (P3 đã xác nhận
   giả thuyết freeze ở chuyển clip — xem LIMITS P3); điểm gãy tải;
   ngưỡng WebKit ≤60 ms cần 1 lượt yên; postboot #45 FAIL apt replay
   đã được Q7 repair (15:04Z) và **postboot #46 PASS** (đủ 11 package)
   — nợ apt coi như đóng ở #46, không cần chạy lại check #45;
   headroom inotify rơi (1507→1307); birefnet 0 lần thành công;
   TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user; release gate.

## 9. Batch stage (KHÔNG push)

`phase9-round114-q8-seekpreload.txt` (3 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_114q8_2mib.mjs` (runner Q8:
  copy P2 + bufTrace 100 ms + seekImmediate + playPause; port 8944,
  Xvfb :199, OUT 114q8; 78.151 B — >37.768, cần `ENABLE_PRIVSEP=0`
  khi push)
- `benchmarks/render/q8_analyze_114.py` (phân tích bufTrace + im lặng
  GST phase-aligned + bảng quyết định; 7.024 B)
- `docs/PHASE9_ROUND114_Q8_SEEKPRELOAD_LIMITS.md` (file này)

Không stage OUT JSON (`benchmarks/results/webkit-blob-flaky-114q8-seekpreload.json`,
165.951 B — theo lệnh: không stage `benchmarks/results/`). Dữ liệu thô
đầy đủ ở `hidden_files/round114-q8/` (prereg, p2seek-offline-q8.txt,
q8-progress.md, q8-driver.log, run-q8.sh, q8-analysis.txt (12 case),
q8-*.log 6 arm, pull/gst 12 run, bundle/dot). KHÔNG push.

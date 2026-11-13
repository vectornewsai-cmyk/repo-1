# Phase 9 đợt 91 — S2: Playhead/canvas sync — sawtooth dư WebKit sau seek (nợ LIMITS gộp đợt 90 §4 mục 2)

**Nợ gốc:** LIMITS gộp đợt 90 §4 mục 2 / R2 §5.1 — "Sawtooth dư ~0,5–0,8 s trên WebKit dưới tải
(độ trễ resume decode sau seek — cũng có ở baseline, không phải do pause của R2)".
**Ngày:** 2026-11-11 (lượt cron 00:35 +07 12/11). **Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** ĐÃ SỬA + ĐO LẠI — chu kỳ drift re-seek sau seek đã hết (0 re-seek / lượt đo, trước 3–4);
lag đỉnh còn lại 0,55–0,70 s là canvas stale dưới tải (tầng render, xem §5 mục 2), không còn là
playhead chạy trước media clock.

## 1. Vấn đề gốc — đo trước sửa (probe91s2, clip bóng GOP 250, 720p, 6 s)

Kịch bản như R2 (pause-seek có xác nhận tới t=5, rồi `setPlayhead(0.5)` + phát; sampler trong trang
100 ms ghi playhead store, element `__vcutMediaEls`, darkCx canvas → ballTime). Phân tích bằng
`analyze91s2-sawtooth.mjs` (chuỗi lag, đoạn element đứng yên, lần re-seek, đỉnh sawtooth).

| Biến thể | lagAfterMax | steadyLagMean | đỉnh lag sau seekDone | re-seek sau seekDone | stall element (>= 300 ms) |
|---|---|---|---|---|---|
| WebKit + tải (3× `yes` + luồng S6 chạy nền) | 0,781 s | 1,014 s | 0,781 / 0,992 / 1,201 s | 3 | 799 / 1697 / 1993 ms |
| WebKit "yên" (không `yes`; S6 vẫn chạy, loadavg 4,5 lúc bắt đầu) | 0,748 s | 0,793 s | 0,748 / 0,758 / 1,002 s | 4 | 815 / 1025 / 920 ms |

Cơ chế (khớp cả 2 lượt, rõ nhất ở lượt yên — sampler ~100–300 ms, không bị đói như lượt tải):

1. Seek hoàn tất → R2 nhả giữ (seeking=false) → syncMedia `play()` element trở lại.
2. **`currentTime` của element WebKit ĐỨNG YÊN ~0,8–1,0 s (yên) / ~0,7–1,7 s (tải) trong lúc
   `paused=false`, `seeking=false`** — decoder cần decode xuôi từ keyframe thưa (GOP 250, chỉ 1
   keyframe ở t=0 cho clip 6 s) tới điểm seek. Đây là resume-decode stall, KHÔNG phải bug code
   của ta: element đang phát nhưng media clock không chạy.
3. Trong lúc đó playhead chạy tiếp ~1× wall (+0,47–0,70 s mỗi stall) → drift vượt ngưỡng 0,35 s
   → drift re-seek → giữ R2 → snap lag về ~0,00 → chu kỳ lặp lại (4 re-seek / 3 s phát ở lượt
   yên; seek lại mất ~1 s mỗi lần, trong lúc đó playhead bị giữ nên lag không tăng thêm).
4. R2 giữ vẫn hoạt động đúng cả 2 lượt: playhead lúc seek xong = 0,5, lúc canvas đổi khung = 0,5
   (PASS cả 2 chỉ tiêu R2). Lag đỉnh là phần SAU khi nhả giữ, không phải lỗi chạy-trước lúc seek.

Ví dụ một chu kỳ (lượt yên, mẫu thô): seek xong 4314 ms (ph=1,267, elT=1,267, ball=1,275,
lag −0,008) → 4605 ms ph=1,567 elT=1,267 ĐÓNG BĂNG → 4826 ms ph=1,833 elT=1,267 → 5030 ms
re-seek tới 2,033 (lag 0,758) → 6017 ms seek xong, ball=2,031, lag 0,002 → lặp lại.

## 2. Sửa — giữ playhead vì resume-stall sau seek (grace 1500 ms)

**`apps/web/src/lib/playheadHold90R2.ts` (thêm, thuần, unit-test được):**
- `shouldHoldForResumeStall({playing, nowMs, watch, currentCt, frameDur})`: giữ khi đang phát +
  còn watch (seek vừa hoàn tất) + trong ân hạn `PLAYHEAD_RESUME_STALL_GRACE_MS = 1500` ms +
  `|Δ currentTime| < 1 frame`. Nhả khi currentTime tăng >= 1 frame (decoder đã resume), lùi
  >= 1 frame (seek mới đã đáp ở target khác — watch hết hạn, tick sau arm lại), hoặc quá ân hạn
  (trả về hành vi cũ: drift re-seek lo; decoder kẹt thật không đóng băng timeline mãi).
  Trừ epsilon 1e-9 s ở biên đúng-1-frame (test S2-R10 bắt được sai số float double:
  `(1,267 + 1/60) − 1,267` nhỏ hơn 1/60 thật một epsilon).
- Ân hạn 1500 ms: trên mọi stall đo được ở lượt yên (815/1025/920 ms — đoạn element đứng yên thật);
  lượt tải có đoạn tới ~1,7 s nhưng phần chạy tự do sau khi nhả giữ chỉ ~0,7 s.

**`apps/web/src/preview.tsx`:**
- Set mới `forwardSeekCompletedThisTick` (CHỈ nhánh forward, CHỈ video): tick vừa hoàn tất seek
  xuôi của clip video. Nhánh reverse KHÔNG ghi (clip reverse step-seek mỗi frame, currentTime
  lùi — arm vào đó sẽ giữ oan mỗi tick, đóng băng phát ngược).
- `syncMedia(..., playheadHeld, playheadHeldResume)`: khi giữ kiểu resume-stall thì VIDEO vẫn phát
  (pause thì currentTime không bao giờ tăng → giữ mãi tới hết ân hạn), chỉ AUDIO pause để khỏi
  chạy trước playhead đã đóng băng; video đã phát sẵn nên hết giữ không cần resume lại. Khi giữ
  kiểu R2 (seeking) thì pause mọi active như cũ (seek còn bay).
- Tick closure giữ `resumeWatches91S2` (mảng, nhiều element): dọn watch khi hết ân hạn / đã tăng
  >= 1 frame / element seek mới / dừng phát; chống trùng watch cùng element khi arm (seek nhanh
  hoàn tất trong 1 tick). Hook `__vcutPlayheadHold90R2` thêm `resumeTicks`/`resumeHolds`.
- Quyết định giữ TRƯỚC khi tăng playhead như R2 (cùng trễ tối đa 1 tick); khi giữ thì reset phần
  dư dt (không nhảy bù lúc nhả).

**Không đổi:** ngưỡng drift re-seek 0,35 s; trần giữ R2 15 s; hành vi seek Q5; phát ngược (watch
không arm); scrub lúc pause (Seeker).

## 3. Kết quả sau sửa (cùng probe, 2 biến thể WebKit)

| Biến thể | lagAfterMax | steadyLagMean | đỉnh lag | re-seek | stall-phase ph growth | max \|ph − elT\| |
|---|---|---|---|---|---|---|
| WebKit + tải | 0,454 s (trước 0,781) | 0,306 s (trước 1,014) | 0,697 s | **0 (trước 3)** | **0,000 s** | ~0,18 s |
| WebKit "yên" | 0,548 s (trước 0,748) | 0,204 s (trước 0,793) | 0,548 s | **0 (trước 4)** | **0,000 s** | ~0,21 s |

- **Chu kỳ drift re-seek đã hết:** sau seek đầu, không còn re-seek nào trong cả 2 lượt (trước 3–4).
  Mẫu thô lượt yên: seek xong 525 ms → ph ĐÓNG BĂNG ở 0,500 suốt 582 ms (elT=0,500,
  paused=false, lag −0,019) → 1358 ms elT=0,567 (>= 1 frame) → nhả, ph chạy lại 0,600 ở
  1601 ms. Lượt tải tương tự: giữ 604 ms, lag −0,019 trong suốt stall.
- **Playhead ↔ element nay bám sát:** max |ph − elT| ~0,18–0,21 s (dưới ngưỡng drift 0,35 s nên
  không re-seek) — trước sửa lag đỉnh tới 1,2 s và ph chạy tới cuối clip (6,0) trong khi element
  kẹt ở 3,869 (lượt tải trước sửa, mẫu cuối).
- **Kiểm chứng:** tsc web 0; vite build pass (6,86 s); `playheadHold90R2.test.ts` **25/25**
  (14 cũ + 11 mới S2-R1..R11); `seek.test.ts` 20/20; `seekSkipRender86N3` 9/9;
  click-test O8: Chromium **21/21**, WebKit **21/21** (chạy lại sau sửa, xem §4).

## 4. Chuyện bên lề khi đo (đã xử lý trong probe/luồng)

- **O8 click-test chạy lại sau sửa: Chromium 21/21, WebKit 21/21** (harness 87o8 mask-track;
  scratch riêng `hidden_files/round91-s2/o8-chromium` và `o8-webkit`, fixture copy từ round87-o8).
  Lần chạy đầu fail ở pre-check do trỏ `O8_SCRATCH` sang thư mục mới chưa có fixture — lỗi
  harness, không phải hồi quy; copy fixture rồi chạy lại xanh. S5(a2) trong O8 (mask bám track
  lúc đang phát — kịch bản play-after-seek): Chromium playhead local=0,9, blob x=0,441 vs kỳ
  vọng canvas 0,4411; WebKit playhead local=0,5, blob x=0,3789 vs kỳ vọng 0,3787 — pass cả 2
  engine, sửa resume-hold không phá kịch bản phát sau seek.
- **Lượt tải sau sửa lần 1 fail ở setup** (pause-seek t=5 không xác nhận sau 30 s: tElement=444 ms
  nhưng tCanvas=null — canvas không tới khung t=5): hiện tượng đã biết (R2 §4: canvas chậm hơn
  element tới > 30 s dưới tải cực đoan do các luồng đợt 91 khác đè) — **không phải hồi quy từ
  sửa này** (setup chạy trước khi đo, nhánh pause không bị động vào; retry sau đó pass ngay,
  seekDone 801 ms).
- **JSON probe lượt tải trước sửa đã bị ghi đè** (probe sau sửa dùng cùng thư mục scratch
  `probe-webkit-load-fixed`): số trước sửa còn trong console log lượt đó
  (`probe-webkit-load-console.log`: lagAfterMax 0,781, steadyLagMean 1,014) + phân tích đã in
  trong log luồng `hidden_files/round91-s2.md`. Lượt yên trước sửa còn nguyên JSON
  (`probe-webkit-fixed/` đã bị ghi đè bởi lượt yên SAU sửa — số trước sửa còn trong console log
  `probe-webkit-quiet-console.log` + log luồng). Bài học: lần sau đặt tên phase khác nhau cho
  trước/sau (vd `pre`/`post`) thay vì cùng `fixed`.
- **So sánh trước/sau không cân tải tuyệt đối:** các lượt chạy cách nhau ~20 phút, luồng sibling
  đợt 91 đến/đi nên load nền khác nhau (loadavg lúc bắt đầu: tải-trước 1,80; yên-trước 4,54;
  tải-sau và yên-sau xem console log). Chỉ tiêu chính (ph đóng băng 0,000 s trong lúc element
  stall; 0 re-seek) là hành vi giữ/không-giữ, không phụ thuộc tải — như R2 §5.6.
- **Số đo chỉ cho clip GOP 250, 6 s, 720p, 1 clip video** (o8-ball) và tải VM lúc đo.

## 5. Giới hạn còn lại (trung thực)

1. **Lag đỉnh còn lại 0,55–0,70 s là canvas stale dưới tải, KHÔNG còn là playhead chạy trước
   media clock.** Sau sửa, playhead ↔ element bám trong ~0,21 s, nhưng canvas (ballTime) tụt sau
   element tới ~0,7 s: vd lượt yên sau sửa, ball giữ 0,519 từ 525→1970 ms trong khi elT đã lên
   1,237 rồi mới nhảy lên 1,228 ở 2143 ms — canvas chỉ cập nhật mỗi ~300–500 ms dưới tải
   (renderFrame cadence, xem Q5 §6.2: canvas chậm hơn element dưới tải). Sửa triệt để thuộc tầng
   render (nhịp vẽ / `requestVideoFrameCallback` — cùng hướng với nợ R1 §5 mục 1), ngoài phạm vi
   luồng này (chỉ tiêu là playhead ↔ media clock, đã đạt).
2. **Ân hạn 1500 ms:** stall nào dài hơn 1500 ms (chưa đo được ở GOP 250; lượt tải có đoạn đứng
   yên 1,7–2,0 s nhưng phần lớn được giữ R2 che phủ, phần chạy tự do chỉ ~0,7 s) thì playhead sẽ
   nhả và drift re-seek cũ lo (hành vi trước sửa) thay vì chờ mãi. Đây là đánh đổi có chủ ý.
3. **Chỉ giữ khi seek XUÔI của clip VIDEO hoàn tất:** seek của audio-only không giữ (audio resume
   ngay); phát ngược không giữ (đúng như R2). Stall sau seek của clip reverse (step-seek) không
   được xử lý — clip reverse vốn seek từng frame nên không có cùng cơ chế stall sau seek.
4. **Khung stale trong lúc seek là tất yếu** (như R2 §5.3): canvas giữ khung cũ cho tới khi decoder
   xong; sửa này chỉ làm playhead "nói thật" về media clock, không làm frame mới tới sớm hơn.
5. **Số đo chỉ cho clip GOP 250** — clip GOP dày (keyframe mau) có thể stall ngắn hơn nhiều và
   sửa này ít tác dụng hơn (nhưng cũng không hại: watch nhả ngay khi currentTime tăng >= 1 frame).

## 6. Phần (b) — `previewLoop50F2.test.ts` chạy được bằng strip-types (cùng luồng)

- **Nguyên nhân:** `previewLoop50F2.ts` import extensionless `./pauseDraw41W2` và
  `./pauseSeekCap42X2` → `ERR_MODULE_NOT_FOUND` dưới `node --experimental-strip-types`
  (tái hiện trước sửa). `pauseDraw41W2.ts` / `pauseSeekCap42X2.ts` không có import
  extensionless nào khác.
- **Sửa:** thêm đuôi `.ts` cho 2 import trong `previewLoop50F2.ts` + `// @ts-ignore: TS5097`
  theo đúng mẫu có sẵn của repo (`nestedPreview.ts`, `previewEngine.ts`, `assetStore.ts` —
  tsconfig không bật `allowImportingTsExtensions`); cập nhật header comment của test (giờ chạy
  được bằng strip-types, cách esbuild bundle cũ vẫn chạy). Không đổi logic nào.
- **Kiểm chứng:** strip-types `previewLoop50F2.test.ts` **20/20**; tsc web 0; vite build pass.

## 7. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadHold90R2.ts` — `shouldHoldForResumeStall` thuần + grace 1500 ms.
- `apps/web/src/lib/playheadHold90R2.test.ts` — 11 test mới S2-R1..R11 (25/25).
- `apps/web/src/lib/previewLoop50F2.ts` — 2 import thêm đuôi `.ts` + `@ts-ignore` TS5097.
- `apps/web/src/lib/previewLoop50F2.test.ts` — cập nhật header comment (chạy được strip-types).
- `apps/web/src/preview.tsx` — `forwardSeekCompletedThisTick`, tham số `playheadHeldResume`,
  `resumeWatches91S2` + hook `resumeTicks`/`resumeHolds`.
- `apps/web/scripts/probe91s2-playhead-sawtooth.mjs` — probe đo sawtooth (bản sao R2, đổi scratch).
- `apps/web/scripts/analyze91s2-sawtooth.mjs` — phân tích stall / re-seek / đỉnh lag từ JSON probe.
- `docs/PHASE9_ROUND91_S2_PLAYHEAD_SAWTOOTH_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round91-s2-playhead-sawtooth` (`~/workspace/repo-1-push/paths-loop/phase9-round91-s2-playhead-sawtooth.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s2.md`.
Probe chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s2/probe-webkit-load-fixed/probe-results.json` (sau sửa, tải),
`.../probe-webkit-fixed/probe-results.json` (sau sửa, yên); console log trước sửa:
`probe-webkit-load-console.log`, `probe-webkit-quiet-console.log`.

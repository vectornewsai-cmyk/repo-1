# Phase 9 đợt 94 — V2: Trần stall re-arm cho stall thứ 2+ (nợ U3 §5)

**Nợ gốc:** LIMITS gộp đợt 93 §4 mục 3 = phát hiện mới U3 §5 —
trần 5000 ms chỉ bảo vệ stall ĐẦU TIÊN sau mỗi lần seek hoàn tất; stall
sau đó (không có seek mới) không được giữ (GOP 250 r1: stall 2 dài
486 ms, playhead +0,433 s; GOP 60 r1: stall 2 dài 306 ms, playhead
+0,367 s — cả 2 đều vượt ngưỡng drift 0,35 s).
**Ngày:** 2026-11-12 (lượt cron 09:35 +07; làm việc 02:35–03:25Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). **Không đụng
TTS 39, không đụng `.github/workflows`, không đưa binary vào batch.**
**Trạng thái:** ĐÃ SỬA + ĐÃ ĐO LẠI — **nợ GIẢM, CHƯA ĐÓNG HẲN**
(xem §1.3 + §5 mục 1): cơ chế re-arm đã chứng minh là arm + giữ được
ngoài đời, nhưng vẫn vào TRỄ ~1 tick rAF nên stall thứ 2+ NGẮN
(300–600 ms, đúng cỡ thường gặp) vẫn để playhead chạy +0,37–0,67 s
trước khi giữ kịp, và vẫn có thể tự kích drift re-seek.

## 1. Đo trước sửa — tái hiện được stall 2 không giữ

Probe `apps/web/scripts/probe94v2-stall-evidence.mjs` (copy probe93u3,
scratch `hidden_files/round94-v2/`, cửa sổ chờ nới `localPh>=3,5 → 5,0`
ở các lượt post — xem §4). Cùng kịch bản U3: pause-seek t=5 xác nhận →
`setPlayhead(0.5)` + phát, sampler 100 ms, phân tích bằng
`analyze92t3-canvas-stale.mjs` (cũ).

### 1.1 Pre-fix — WebKit + tải 3×`yes`

| Lượt | Stall sau seekDone | Playhead trong stall | Re-seek | lagEl max | lagPh max |
|---|---|---|---|---|---|
| GOP 250 r1 | 1: 2824 ms; **2: 603 ms;** 3: 3194 ms | 1: +0,000; **2: +0,367;** 3: +0,000 | 2 | 1,681 s | 1,648 s |
| GOP 30 r1 | 1: 2417 ms | 1: +0,000 | 0 | 2,246 s | 1,311 s |

- **Stall 2 pre-fix (GOP 250 r1, 4873→5476 ms, elT≈0,563): playhead
  0,500→0,867 (+0,367 s) — KHÔNG được giữ**, đúng phát hiện U3 §5.
  Hook `__vcutPlayheadHold90R2`: `resumeTicks` ĐÓNG BĂNG ở 5,
  `resumeHolds` vẫn 1 trong suốt stall 2; stall 1 giữ (resumeTicks
  0→4), stall 3 giữ (resumeTicks 5→9, resumeHolds=2) vì re-seek #1 ở
  6509 ms đã arm watch mới. Sau stall 2 là drift re-seek #1.
- GOP 30 r1 pre-fix chỉ có 1 stall (giữ +0,000), không bắt được stall 2
  (n=15 mẫu, rAF gap mean 647 ms, cửa sổ ngắn) — dùng GOP 250 r1 làm
  baseline chính cho stall 2.

### 1.2 Sửa — freeze detector re-arm theo từng stall

**`apps/web/src/lib/playheadHold90R2.ts`** (mới, thuần, unit-test được):
- `PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS = 300` — bằng định nghĩa stall
  của probe (>= 300 ms) và dưới ngưỡng drift 0,35 s.
- `nextResumeFreezeRearm(input)`: theo dõi `currentTime` của 1 element
  video xuôi đang phát. Chưa theo dõi → bắt đầu theo dõi; tăng
  >= 1 frame → cập nhật mốc tăng cuối + xóa `ceilingSpent`; đóng băng
  liên tục >= 300 ms mà chưa có watch → arm watch mới với
  `ctAtCompletion` = currentTime hiện tại, `completedAtMs` = mốc tăng
  cuối (tức lúc stall BẮT ĐẦU, không phải lúc phát hiện) — trần cứng
  5000 ms của `shouldHoldForResumeStall` tính từ đầu stall.
  Không phát / seeking / paused → dừng theo dõi; đã có watch hoặc đã
  chạm trần đợt này (`ceilingSpent`) → không arm trùng/lại.
- `shouldHoldForResumeStall` và trần 5000 ms **KHÔNG đổi** — watch arm
  lại được giữ/nhả đúng như watch sau seek.

**`apps/web/src/preview.tsx`:**
- Tập `forwardVideoActives94V2` (module-level, cạnh
  `forwardSeekCompletedThisTick`): syncMedia ghi clip video xuôi đang
  active mỗi tick; detector ở tick sau dùng tập này. Lý do: `spec`/
  `pool`/`mediaByName` chỉ được gán SAU khối quyết định giữ trong
  tick — lần thử đầu gọi `collectActives` trực tiếp ở detector đã bị
  tsc bắt `used before its declaration` (xem §4). Tín hiệu cũ 1 tick,
  cùng mẫu `prevSkipRenderSeeking` của giữ R2; rủi ro còn lại: tập cũ
  1 tick có thể giữ lại 1 element vừa hết active thêm 1 tick — element
  đó paused thì guard `paused` chặn arm.
- Map `resumeFreezeTracks94V2` (1 entry / element) + detector chạy
  TRƯỚC khối quyết định giữ trong cùng tick (để giữ kịp ngay tick phát
  hiện) + đếm `resumeRearms94V2` vào hook `__vcutPlayheadHold90R2`
  (chỉ đo — probe đọc cả object nên tự có trong JSON).
- Filter dọn watch đổi từ `.filter()` sang vòng `for` để khi watch chạm
  trần 5000 ms mà element vẫn đóng băng thì đánh dấu
  `track.ceilingSpent = true` — nếu không detector sẽ arm lại ngay cho
  cùng đợt đóng băng và trần cứng vô nghĩa. Cờ chỉ reset khi element
  tăng >= 1 frame (hoặc seek/pause dừng theo dõi). Dọn khi dừng phát
  (`resumeFreezeTracks94V2.clear()` cùng chỗ dọn watch).

### 1.3 Đo lại sau sửa — WebKit + tải (7 lượt)

| Lượt | Stall sau seekDone (playhead Δ) | Re-seek | lagEl max | Re-arm (`resumeRearms94V2`) |
|---|---|---|---|---|
| GOP 250 r1 (3×yes) | 1: 1400 ms (+0,000) | 0 | 0,802 s | 0 |
| GOP 250 r2 (3×yes) | 1: 1465 ms (+0,000) | 0 | 0,797 s | 0 |
| GOP 250 r3 (4×yes) | 1: 1000 ms (+0,000) | 0 | 1,334 s | 0 |
| GOP 30 r1 (3×yes) | 1: 2021 ms (+0,000) | 0 | 1,073 s | 0 |
| GOP 250 r4 (4×yes, cửa sổ dài) | 1: 1407 ms (+0,000) | 0 | 0,981 s | 0 |
| GOP 30 r2 (4×yes, cửa sổ dài) | 1: 1510 ms (+0,000); **2: 429 ms (+0,400); 3: 390 ms (+0,566)** | 0 | 1,481 s | **1** |
| GOP 250 r5 (4×yes, cửa sổ dài) | 1: 1915 ms (+0,000); **2: 1196 ms (+0,000); 3: 323 ms (+0,667)** | 2 | 0,948 s | **1** |

- **Không hồi quy stall đầu:** 7/7 lượt stall 1 giữ +0,000 (1000–
  2021 ms, có 2 lượt vượt ân hạn S2 1500 ms).
- **Re-arm ĐÃ kích hoạt ngoài đời:** `resumeRearms94V2` 0→1 ở cả 2
  lượt cửa sổ dài có stall 2+ (GOP 30 r2, GOP 250 r5). Nhưng **vào
  trễ ~1 tick rAF** (xem §2): GOP 30 r2 stall 2 — playhead đã chạy
  +0,400 s trước khi giữ kịp (giữ được phần đuôi stall: playhead đứng
  yên 5,267 ở 7991→8583 ms, `resumeTicks` 6→7, `resumeHolds` 1→2);
  stall 3 (+0,566) không được giữ lần nào (re-arm không kịp kích hoạt
  cho stall chỉ 390 ms). GOP 250 r5 stall 3 (+0,667) không được giữ →
  drift re-seek #2 ở 14624 ms.
- **GOP 250 r5 stall 2 (1196 ms) được giữ +0,000 NHƯNG bằng chứng hook
  (`resumeRearms94V2` = 0 suốt stall) cho thấy KHÔNG phải do re-arm
  mà do watch sau re-seek #1 còn sống** — khả năng là target của
  re-seek nằm trong 1 frame của điểm đóng băng (elT đóng băng ở 1,569
  trong khi watch ghi `ctAtCompletion` ≈ 1,54–1,57) nên filter chưa
  dọn watch. Không khẳng định chắc chắn được từ JSON (không có trường
  seek-target) — ghi đây là suy luận, không phải bằng chứng.
- **Re-seek sau sửa:** 0 ở 6/7 lượt; 2 ở GOP 250 r5 — #1 ở 5000 ms do
  chu kỳ resume-chậm → drift (U3 §2.3, đã biết, không phải do stall
  2), #2 ở 14624 ms do stall 3 (+0,667) vượt ngưỡng drift.
- **Trần 5000 ms giữ nguyên:** không có stall nào chạm trần (dài nhất
  sau sửa 2021 ms; dài nhất trước sửa 3194 ms) nên không có bằng chứng
  nào đòi đổi trần — đổi trần mà không có số đo sẽ là đoán.

## 2. Vì sao re-arm vẫn trễ 1 tick — giới hạn của quan sát theo tick

Truy vết mẫu GOP 30 r2 stall 2 (elT đóng băng ở 5,167; mẫu 7562→7991):
detector chỉ quan sát element MỖI tick rAF. Tick quan sát được element
vừa tăng tới điểm đóng băng (5,167) thì theo định nghĩa element KHÔNG
đóng băng ở thời điểm đó — detector cập nhật mốc tăng cuối, KHÔNG arm,
và playhead tăng theo đúng dt của tick đó (~0,4 s dưới tải). Chỉ ở
tick SAU (không thấy tăng thêm, đóng băng đã >= 300 ms) detector mới
arm → giữ. Tổng độ trễ không-giữ ≈ 1 gap rAF (300–600 ms dưới tải;
tối đa 1206 ms đo được pre-fix).

- Ngưỡng 300 ms KHÔNG phải nút thắt: với gap 300–600 ms, tick đầu
  tiên không-thấy-tăng đã có thời gian đóng băng >= 300 ms nên arm
  ngay ở tick đó — hạ ngưỡng xuống 100 ms cũng không arm sớm hơn được
  (không thể arm trước tick quan sát đầu tiên). Hạ ngưỡng chỉ có tác
  dụng khi gap 100–300 ms (máy nhẹ — lúc đó stall cũng hiếm).
- Hệ quả thực hành: stall 2+ dài nhiều tick (>= ~800 ms–1 s) sẽ được
  giữ phần còn lại sau tick đầu; stall 2+ ngắn (300–600 ms, đúng cỡ
  thường gặp: 306/390/429/486/603 ms trong các lượt đo) thường kết thúc
  trước hoặc đúng lúc giữ kịp — playhead vẫn chạy +0,37–0,67 s, đủ tự
  kích drift re-seek nếu element không đuổi kịp ngay sau đó.
- Hướng sửa tương lai (nợ, KHÔNG làm trong luồng này — cần đo riêng):
  (a) dự đoán stall bằng vận tốc advance (element tăng << 1× trong 1
  tick thì arm dự phòng) — suy đoán, decode bursty dưới tải cũng cho
  tick 0,4× rồi 1,6× nên dễ giữ oan; (b) khi re-arm vào trễ, khoan
  kích drift re-seek 1 tick để playhead đã giữ kịp đuổi theo element —
  đổi ngữ nghĩa drift, cần luồng riêng.

## 3. Kiểm chứng

- tsc web **0 lỗi** (chạy 2 lần: sau sửa, và sau khi luồng V4 sửa cùng
  file `preview.tsx` ở vùng khác — xem §4; cả 2 lần đều 0).
- vite build **PASS** (6,79 s).
- `playheadHold90R2.test.ts` **41/41** (31 cũ + 10 mới V2-R1..R10 —
  R8 mô phỏng đúng số stall 2 pre-fix GOP 250 r1: đóng băng từ
  4873 ms, arm, giữ tới 5476 ms, nhả quá trần 5000 ms).
- `seek.test.ts` **20/20**; `seekSkipRender86N3.test.ts` **9/9**;
  `previewLoop50F2.test.ts` **20/20**.
- Click-test O8 (đụng preview pipeline nên chạy cả 2 engine):
  Chromium **21/21**, WebKit **21/21** (Chromium Δx=0,112/0,113;
  WebKit Δx=0,194/0,197 — khớp kỳ vọng canvas từng engine sau sửa
  nhãn U7). Không hồi quy parity render: lag/stale các lượt post cùng
  bậc với pre-fix (stale 30–51% cửa sổ — vẫn là frame trình chiếu
  WebKit tụt, theo T3/U3 — không phải do sửa này).

## 4. Chuyện bên lề khi đo (đã xử lý)

1. **WebKit không launch được ở lượt đầu** (`libevent-2.1.so.7` thiếu
   sau reboot; `gstreamer-1.0/` còn 0 file) — khôi phục theo cách T9:
   `cp -an ~/workspace/tmp-q6r3-debroot/. /` → 269 plugin +
   `glib-compile-schemas` → `gschemas.compiled` 41.821 B. Các lượt sau
   chạy bình thường.
2. **Lần thử đầu gọi `collectActives` trong detector bị tsc bắt**
   (`spec`/`pool`/`mediaByName` used before declaration — chúng chỉ
   được gán sau khối quyết định giữ) — đổi sang tập
   `forwardVideoActives94V2` do syncMedia ghi, cùng mẫu tín hiệu cũ
   1 tick như `prevSkipRenderSeeking`. Không có hành vi nào bị đổi
   theo hướng này ngoài việc detector dùng active của tick trước.
3. **Các `yes` PID 6538–6540 lúc 02:46 là của probe V7** (round94-v7),
   KHÔNG phải của luồng này — để yên, không pkill (bài học U7).
4. **Luồng V4 sửa cùng `preview.tsx` trong lúc luồng này chạy**
   (marker "Đợt 94 V4" ở dòng ~1789, vùng khác với vùng V2 ở
   3797–5150): mọi marker V2 còn đủ (16 match `94V2`); tsc chạy lại
   sau đó vẫn 0. Parent gộp cần kiểm tra lại toàn bộ marker 2 luồng.
5. **4 lượt post-fix đầu không bắt được stall 2** (máy nhẹ dần: rAF
   gap mean 236–342 ms so với 400 ms pre-fix; RAM khả dụng lên
   ~1,6 GB) — đã nới cửa sổ probe `localPh>=3,5 → 5,0` + chạy thêm
   3 lượt load4 cửa sổ dài mới bắt được stall 2+ (2 lượt). Thay đổi
   cửa sổ chỉ ở bản copy probe94v2, không đụng probe gốc U3.
6. **Server scratch O8 WebKit (vite 5561 + bridge) còn chạy sau khi
   O8 xong** — luồng này đã kill (PID 24177/24186). Xvfb :188/:199
   để lại (display server, có thể dùng chung).

## 5. Giới hạn còn lại (trung thực)

1. **Re-arm vào trễ ~1 tick — nợ CHƯA ĐÓNG HẲN (mục chính):** stall
   2+ ngắn (300–600 ms) vẫn để playhead chạy +0,37–0,67 s trước khi
   giữ kịp (GOP 30 r2 stall 2/3, GOP 250 r5 stall 3); stall 3 ở r5
   đã tự kích drift re-seek. Chỉ stall 2+ dài (>= ~800 ms–1 s) mới
   được giữ phần còn lại. Xem §2 để biết vì sao và hướng sửa tương lai.
2. **Trần 5000 ms vẫn chưa được chứng minh hành vi nhả ngoài đời**
   (nợ cũ từ T3/U3 — stall dài nhất bắt được 3904 ms ở U3, 3194 ms ở
   lượt pre-fix này, 2021 ms post-fix; chưa có stall nào chạm 5000 ms).
3. **Chu kỳ resume-chậm → drift → re-seek dưới tải cực đoan** (U3
   §2.3) vẫn mở: GOP 250 r5 có re-seek #1 theo đúng cơ chế này (sau
   stall 1 giữ đúng, element resume chậm, drift vượt 0,35 s). Re-arm
   không sửa được đường này vì drift xảy ra SAU khi stall hết.
4. **Lag trình chiếu sau stall vẫn lớn** (lagEl max 0,80–1,48 s các
   lượt post; stale 30–51% cửa sổ) — là frame trình chiếu WebKitGTK
   tụt sau currentTime dưới tải (T3/U3), không phải playhead chạy
   trước; không đổi ở luồng này.
5. **Bằng chứng re-arm chỉ có 2 lượt** (GOP 30 r2, GOP 250 r5) và mỗi
   lượt chỉ 1 lần arm — chưa phải phân phối đầy đủ; stall 2+ là hiện
   tượng ngẫu nhiên theo tải (4/7 lượt post không có stall 2 nào).
   Suy luận "stall 2 ở r5 do watch sau re-seek" (§1.3) chưa kiểm chứng
   được từ JSON (thiếu trường seek-target).
6. **Độ phân giải sampler suy giảm dưới tải:** setInterval 100 ms chỉ
   bắn được ~2–3 mẫu/s ở các lượt load4 (rAF gap max 600–1206 ms) —
   biên khoảng stall thô ±~300–500 ms; giá trị lag tại thời điểm mẫu
   vẫn chính xác. Stall 323 ms ở r5 nằm gần giới hạn này.
7. **Probe tự nó thêm tải** (sampler `getImageData` toàn canvas) —
   như T3 §5 mục 7; trước/sau dùng cùng sampler nên so sánh tương đối
   vẫn hợp lệ, số tuyệt đối hơi bi quan.
8. **Số đo chỉ cho 1 clip video, 720p, 6 s** — GOP 30/60/250, WebKit
   là chính (Chromium không stall ở cùng tải nên không đo được stall 2
   trên Chromium; O8 Chromium/WebKit 21/21 chứng minh không hồi quy
   chức năng).

## 6. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadHold90R2.ts` — `nextResumeFreezeRearm` +
  `PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS = 300` + `ResumeFreezeTrack`
  (+ doc V2).
- `apps/web/src/lib/playheadHold90R2.test.ts` — 10 test mới V2-R1..R10
  (41/41).
- `apps/web/src/preview.tsx` — tập `forwardVideoActives94V2` (syncMedia
  ghi), map `resumeFreezeTracks94V2`, detector re-arm trước khối quyết
  định giữ, filter watch đánh dấu `ceilingSpent`, đếm
  `resumeRearms94V2` vào hook (file này cũng chứa sửa của luồng V4 đợt
  94 ở vùng khác — xem §4 mục 4; batch này stage toàn bộ file ở trạng
  thái hiện tại).
- `apps/web/scripts/probe94v2-stall-evidence.mjs` — probe đo stall/lag
  (copy probe93u3 + cửa sổ chờ `localPh>=5,0` + scratch round94-v2).
- `docs/PHASE9_ROUND94_V2_STALL_CEILING_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round94-v2-stall-ceiling`
(`~/workspace/repo-1-push/paths-loop/phase9-round94-v2-stall-ceiling.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v2.md`.
Dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round94-v2/probe-*/probe-results.json`
+ `analyze-*.txt` + `o8-chromium/` + `o8-webkit/` (`o8-clicktest-report.json`).
Clip GOP 30/60: fixture của T3 ở `round92-t3/clips/` (binary, KHÔNG stage).

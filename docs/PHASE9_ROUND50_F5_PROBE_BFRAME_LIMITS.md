# Phase 9 đợt 50, luồng F5 — Trần 1000 trên B-frame (flow mới) + vòng draw/toggle clip asset: trên UI thật — LIMITS

Ngày: 06/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ C6/Z5/A5/B5/D5/E5).

Đọc trước: `docs/PHASE9_ROUND49_E5_PROBE_LIMITS.md` §4 (trần 1000
B-frame: flow episode thất bại — seek demuxer "xong" ~1 s trong khi
frame thật không tới; §6.4 cần flow khác) + §6.7 (probe rAF-fallback
đóng seek sau 5–15 ms trên B-frame, 0 mẫu);
`docs/PHASE9_ROUND49_E3_SETTLE_LIMITS.md` §7.6 (vòng draw/toggle cho
clip asset: trên UI app thật chưa chứng minh, nợ B1 §6.4);
`docs/PHASE9_ROUND49_LIMITS.md` §3 mục 7–8.
Nợ đóng ở đây: E5 §6.4 (trần 1000 B-frame) + E5 §6.7 (fallback đóng
sớm) + E3 §7.6 / B1 §6.4 (draw/toggle asset: trên UI thật).

## 0. Kết luận ngắn

1. **Trần 1000 trên footage B-frame — ĐÃ ĐO ĐƯỢC, TRẦN GIỮ ĐÚNG:
   1000 mẫu giữ + 128 dropped.** Entry episode k=1 (target 5, B-frame,
   drip 64 KiB/s): giữ đúng 1000, dropped 128, tổng 1128, `capHit =
   true`. Trần giữ y hệt trên footage không B-frame (đối chứng noise
   cùng flow: S1 1000 + 16, episode 1000 + 1119). Xem §2.
2. **Flow mới F5b là điểm thắng:** probe vá thêm điều kiện
   `readyState>=2` cho fallback rAF (F5a chỉ đếm 30 tick vẫn chốt sớm
   — xem §1). Nhờ đó entry S1 B-frame tích được 318 mẫu + 0 dropped,
   sự kiện `seeked` thật bắn sau 55,9 s, frame vẽ được (readyState 3,
   lastDrawn=25); episode dài thành lập trên B-frame LẦN ĐẦU (E5:
   episode bị skip) — filmstrip 10/10, fingerprint `fingerprintOk =
   true` cũng chạy được trên B-frame. Xem §1–§2.
3. **Serve-nhanh (đề xuất trong task) đã đo và BỊ LOẠI bằng số đo,
   không phải lập luận:** B-frame serve nhanh → seek hoàn tất thật
   sau 632 ms, chỉ 21 mẫu, episode 43 entry tối đa 48 mẫu — cửa sổ
   seeking quá ngắn nên trần không thể chạm. Serve-nhanh chứng minh
   được "seek hoàn tất thật", không đo được trần. Xem §3.
4. **Vòng draw/toggle cho clip `asset:` trên UI app thật — ĐÃ CHỨNG
   MINH, click-test 9/9 × 2 lượt.** Mở file `.vcut.json` qua file
   input thật của ProjectMenu (tên → "F5-drawtoggle", bin có asset,
   timeline 1 clip); toggle GOP TẮT → phát ngược vẽ bằng đường
   element (draw +11, 4–5 hash canvas khác nhau, lastDrawn lùi,
   badge ngược ẨN); toggle GOP BẬT → phát ngược vẽ bằng đường
   WebCodecs (draw +3/+4, 6 hash khác nhau, badge "◀ NGƯỢC:
   WEBCODECS"); toggle decode-ahead off → running → off qua cổng S3
   thật; 0 lỗi console trong cả hai lượt. Không phát hiện bug sản
   phẩm nào nên KHÔNG sửa production code. Xem §4.
5. **Trần 1000 vẫn là cuộc đua thời gian seeking × tốc độ rAF**
   (như E5 đã kết luận trên noise), nay có số B-frame: S1 B-frame
   chỉ 318 mẫu vì rAF chạy ~6,6/s dưới tải nặng (loadBefore 14,20)
   trong khi seek hoàn tất sau 56 s; episode thắng vì seeking kéo
   dài hơn nhiều. Trần đứng như lưới an toàn, không phải giới hạn
   vận hành chắc chắn. Xem §2.4.
6. **KHÔNG đo WebCodecs/Safari/máy thật** — không có binary, ghi rõ
   là chưa đo, không claim. Baseline quiet vẫn chờ cửa sổ yên từ
   main chat — không ép đo.

## 1. Flow mới F5: từ F5a (thất bại có số đo) tới F5b (thành lập)

### 1.1 Cơ chế lỗi của E5 (đã biết) và cách F5 sửa

E5 §4: tick rAF đầu sau khi gán `currentTime` thấy `seeking=false` +
`currentTime=target` TRƯỚC KHI seek thật bắt đầu (cờ seeking chỉ lật
true khi task seek chạy trên main thread) nên fallback cũ chốt entry
sau 5–15 ms với 0 mẫu, trong khi element sau đó `seeking=true` hàng
chục giây.

**F5a — fallback cần xác nhận liên tiếp (30 tick):** chỉ chốt khi
điều kiện (seeking=false + ct=target) giữ liên tiếp đủ 30 tick;
tick nào seeking=true thì reset; `seekedAtMs` lấy mốc tick đầu tiên
của chuỗi positioned nên latency không lệch. Khóa bằng test Node
10/10 (gồm đỏ-trước: probe chưa vá F5 chốt ngay tick 1 với 0 mẫu).

**F5a CHẠY THẬT VẪN THẤT BẠI — nhưng thất bại có số đo chính xác**
(lượt `sync-bframe`, display :94, drip 64 KiB/s):

| Mốc | F5a B-frame |
|---|---|
| cap-wait break | `seeked-closed-samples-stalled`, waitSec 9,1, capHit false |
| Entry k=0 | 0 mẫu, 0 dropped, `fallbackConfirmTicks=30`, `fallbackConfirmed=true`, seekLatency 409,1 ms |
| Pool lúc 1–7 s | seeking=false, ct=25, readyState=0 |
| Pool lúc 9,1 s | **seeking=true**, ct=25, readyState=1 (quá muộn — entry đã chốt) |
| Range log | request dải 324599808–387572805 (mốc 25 s) phát lúc ~6 s sau scrub; moov (25 KB cuối file) đã về từ trước |

Cơ chế (suy từ số đo + range log): cửa sổ **tiền-seek dài ~8 s**,
không phải ~1 s — Chrome mất ~6 s mới phát range request cho mốc
target (sau khi đã lấy moov), và element báo seeking=false +
ct=target + readyState=0 suốt cửa sổ đó. 30 tick xác nhận chỉ
~1,6 s nên vẫn chốt sớm. F5a không vô ích: nó đo được chính xác cửa
sổ tiền-seek (409 ms latency, 30 tick, 0 mẫu) và range log chứng
minh Chrome chưa phát request — đó là dữ kiện để thiết kế F5b.

**F5b — đếm xác nhận CHỈ KHI `readyState>=2`:** bộ đếm chỉ tăng
khi (seeking=false + ct=target + readyState>=2, tức HAVE_CURRENT_DATA
— đã có frame tại mốc hiện tại); tick nào seeking=true, ct rời
target, hoặc readyState<2 thì reset về 0. Mốc `_fbFirstMs` (để
backdate `seekedAtMs`) vẫn lấy từ tick positioned đầu tiên (không
cần readyState) nên latency không lệch; khi seeking=true thì
`_fbFirstMs` reset (mốc tiền-seek không còn ý nghĩa vì seek thật
chưa bắt đầu — latency của entry có seeking-phase là thời gian tới
chuỗi positioned SAU seeking, xem test mô phỏng B-frame). Không đổi
định nghĩa seek/seeked/mẫu, không đổi trần 1000, không đổi cơ chế
supersede/flush. Test Node cập nhật 10/10 (thêm mô phỏng B-frame
đầy đủ + readyState flicker reset bộ đếm).

### 1.2 F5b thay đổi gì ở pha đo (script `per-seek-probe-sync-cap-run50-f5.mjs`)

- Sao chép script E5, giữ nguyên hạ tầng (server drip/hang, fake
  bridge, CDP pipe, seed blob stand-in, dist đóng băng C6,
  filmstrip release, S2d fingerprint). Chỉ đổi: probe vá F5b
  (`install({fps:30, fallbackConfirmTicks:30})`), pha S1 thành
  **CAP-WAIT** (scrub 25 rồi poll entry k=0 mỗi 2 s tới khi chạm trần
  / entry hoàn tất / seeked đã chốt mà mẫu ngừng tăng 3 poll / hết
  `--cap-wait-sec` 120 s — vòng lặp preview ngủ giữa chừng KHÔNG
  dừng poll, vì probe rAF độc lập với vòng lặp), snapshot entry thêm
  `seekedAtMs`/`firstDraw`/`fallbackConfirmTicks`, và `--proxy-mode
  drip|fast` cho đối chứng serve-nhanh (§3).
- Episode S2a/S2b + S2d của E5 giữ nguyên để đối chứng.

## 2. Trần 1000 trên B-frame — số đo (F5b, drip 64 KiB/s)

Fixture B-frame như E5 (encode lại từ noise: 630 B / 240 P / 29 I,
GOP 30, `has_b_frames=2`, 387572806 byte). Dist đóng băng C6
(`index-D4oCKuDp.js`), bridge 4296, app 4292.

### 2.1 Lượt B-frame F5b (`sync-bframe2`, display :95, loadBefore 14,20 — tải nặng, xem §2.4)

**Pha S1 cap-wait — entry k=0 (target 25): HOÀN TẤT, 318 mẫu + 0 dropped.**

| Mốc | Giá trị |
|---|---|
| break | `entry-completed`, waitSec 58,1, capHit false |
| Entry k=0 | status completed, samples **318**, dropped **0**, `seekLatencyMs` **55923,8 ms** qua sự kiện seeked THẬT (`seekedEvent=true`), firstDraw +106,4 ms sau seeked, `fallbackConfirmTicks=0` (fallback không hề can thiệp) |
| Cửa sổ tiền-seek | 0 mẫu tới 9,2 s (seeking=false, readyState=0) — F5b không chốt, đúng thiết kế |
| Tích mẫu | seeking=true từ ~9,2 s, readyState=1, ~5,5–6,6 mẫu/s (rAF chậm dưới tải nặng) |
| Cuối S1 | seeking=false, ct=25, **readyState=3**, lastDrawn=25 — frame B ĐÃ decode và vẽ được |

Đây là lần đầu có latency seek THẬT trên B-frame (E5 chỉ có artifact
fallback 5–15 ms): seek tới 25 s trên B-frame dưới drip 64 KiB/s
mất **~56 s** (demuxer + decode chuỗi tham chiếu I→P→B), so với
~46 s trên noise cùng flow (§2.2).

**Episode dài S2a/S2b — THÀNH LẬP trên B-frame lần đầu (E5: skip):**

| Mốc | Giá trị |
|---|---|
| S2a scrub 5 | entry k=1 tạo ngay (target 5, pending, seeking=true, 6 mẫu sau 0,5 s) — vòng lặp đã tỉnh vì S1 vẽ được |
| Entry k=1 (top) | status unresolved, **sampleCount=1000, droppedSeekingSamples=128, keptPlusDropped=1128, rafTicksWhileWaiting=1516** → **`capHit=true`** |
| Cuối episode | loop cạn cap (seekFailureCount=10, exhausted=true, kind=timeout, target 23) → drop → S2d tạo entry k=12 trên element mới (elementId 11, target 10, 379 mẫu, unresolved) |
| Filmstrip | chạy 10/10 (target 1,5–28,5, stack qua QT 58:45553) |
| Fingerprint | `fingerprintOk=true` (pool id 0 → 11, entry sau drop mang 11, endPool id 12 sau drop lần 2) |
| Tổng evidence | capHit=true, maxSamples=1000, maxDropped=128, counts {completed 1, unresolved 4, seeked-no-draw 8} |

**Kết luận B-frame: trần 1000 GIỮ ĐÚNG — giữ đúng 1000 mẫu, phần
vượt đếm dropped (128), không tràn, không vỡ.** Lần đầu tiên trần
được đo trực tiếp trên footage B-frame.

### 2.2 Đối chứng noise F5b (`sync-noise`, drip 64 KiB/s, loadBefore 1,28)

| Mốc | Noise F5b | B-frame F5b |
|---|---|---|
| S1 entry k=0 | **cap-hit: 1000 + 16 dropped lúc 42,1 s** (cuối phiên 1000 + 254); seekLatency 45955,7 ms qua seeked thật; seeked-no-draw (seeked bắn sau khi cap-wait đã break, loop đã chuyển sang target 5 nên frame 25 không được vẽ) | completed: 318 + 0; seekLatency 55923,8 ms qua seeked thật; frame vẽ được |
| Tốc độ mẫu S1 | ~30/s (62 mẫu/2 s ở đầu) | ~6,6/s |
| Episode entry k=1 | **1000 + 1119 dropped**, latency 37103,4 ms qua seeked thật, seeked-no-draw | **1000 + 128 dropped**, unresolved |
| Filmstrip | 10/10 | 10/10 |
| Fingerprint | `fingerprintOk=true` | `fingerprintOk=true` |

Trần giữ đúng ở cả hai footage, cả hai pha (S1 lẫn episode). Số
dropped khác nhau (16/254/1119 vs 128) chỉ phản ánh seeking kéo dài
bao lâu SAU khi chạm trần, không phải trần khác nhau.

### 2.3 Đối chứng serve-nhanh (§3)

B-frame serve nhanh: S1 chỉ 21 mẫu (xem §3) — trần không chạm vì
seeking quá ngắn, không phải vì trần vỡ. Đây là đối chứng âm cần
thiết: cùng probe F5b, cùng fixture, chỉ đổi tốc độ serve.

### 2.4 Vì sao S1 B-frame chỉ 318 mẫu (không chạm trần ở S1)

Trần là cuộc đua **thời gian seeking × tốc độ rAF** (E5 đã kết
luận trên noise; nay có số B-frame):

- Tốc độ rAF lượt B-frame chỉ ~6,6/s (preview ticks 391/58,1 s),
  do loadBefore **14,20** (luồng F6 đợt 50 đang chạy Chrome + vite
  build song song lúc lượt này bắt đầu; loadAfter 4,25). Lượt noise
  chạy sau khi máy yên hơn (loadBefore 1,28) nên rAF ~30/s.
- Thời gian seeking S1 B-frame ~48 s (9,2 → 58,1 s): 48 × 6,6 ≈
  317 ≈ 318 mẫu đo được — khớp. Nếu rAF chạy 30/s như lượt noise
  thì S1 B-frame đã chạm trần (~1440 mẫu tiềm năng).
- Episode thắng vì seeking kéo dài hơn nhiều (k=1 tích 1128 mẫu
  qua cả episode + chờ ngủ, rAF hồi phục dần khi tải giảm).

Không lấy 318 làm "B-frame chậm hơn noise": 318 là tích của tải
máy lúc đo, không phải đặc tính B-frame. Bằng chứng là episode
B-frame chạm trần ngay trong cùng lượt đó.

### 2.5 Giới hạn của phép đo trần

- Chỉ 1 fixture B-frame (720p noise, GOP 30, bf=3) + 1 fixture
  noise, drip 64 KiB/s, 1 lượt mỗi loại (F5a là lượt B-frame thứ
  hai nhưng với vá khác nên không gộp số).
- Load under-load, không phải quiet có điều phối: tốc độ rAF dao
  động theo lượt (6,6/s vs 30/s) nên số mẫu tuyệt đối không dùng
  làm baseline; chỉ kết luận "trần giữ đúng 1000" là vững (giữ
  đúng 1000 ở cả 3 entry chạm trần: B-frame episode, noise S1,
  noise episode).
- Ngữ nghĩa latency mới của F5b (ghi rõ): với entry đóng bằng
  fallback, `seekLatencyMs` là thời gian tới chuỗi positioned
  SAU seeking (khi đã có frame), không phải mức demuxer như
  fallback cũ; với entry đóng bằng sự kiện seeked thật thì latency
  là thời gian sự kiện bắn (không đổi). Đừng so latency fallback
  F5b với latency fallback E5 như cùng định nghĩa.

## 3. Đối chứng serve-nhanh: seek hoàn tất thật, trần không đo được

Lượt `sync-bframe-fast` (`--proxy-mode fast`, cùng fixture B-frame,
display :97, loadBefore 0,15):

| Mốc | B-frame serve-nhanh | B-frame drip (§2.1) |
|---|---|---|
| S1 entry k=0 | completed, **21 mẫu + 0 dropped**, seekLatency **632,4 ms** qua seeked THẬT, waitSec 2,2, lastDrawn=25 | completed, 318 + 0, latency 55923,8 ms |
| Episode | chạy đủ (không skip): **43 entry**, mẫu/entry 13–48, latency 215–1001 ms qua seeked thật, tối đa 48 mẫu | k=1: 1000 + 128 |
| Trần | **không chạm** (max 48 << 1000) | **chạm** (1000 + 128) |
| Filmstrip | 10/10 | 10/10 |

Đây là kiểm chứng trực tiếp đề xuất "serve nhanh để seek hoàn tất
thật rồi mới đo mẫu": seek HOÀN TẤT THẬT (632 ms, frame vẽ được,
lastDrawn=25 — nhanh hơn drip ~88×) nhưng cửa sổ seeking chỉ
~0,5–1 s/entry nên chỉ tích 13–48 mẫu — trần 1000 không thể chạm.
Serve-nhanh trả lời được "seek có hoàn tất thật không" (có), không
trả lời được "trần có giữ không" (cần seeking dài — chỉ drip mới
tạo ra). Flow F5b + drip là flow đúng cho câu hỏi trần; serve-nhanh
là đối chứng âm, không phải flow thay thế.

## 4. Vòng draw/toggle cho clip `asset:` trên UI app thật — 9/9 × 2 lượt

Harness mới `clicktest-50f5-drawtoggle-asset.mjs` (mẫu E6: vite
build mới ra scratch, static server cùng origin, CDP websocket,
Xvfb, Chrome headed). Fixture `y1-corrupt-gop30-360p-gop90-420s.mp4`
(69.861.131 byte, 640x360, GOP 90, GOP hỏng [900,990) ở 30–33 s —
vùng đo 100 s nằm ngoài GOP hỏng). Seed IDB + autosave bằng raw
indexedDB/localStorage trong page (mẫu E5 SEED_FN, không bundle
module app); assetId `a_e40641880f8e75dc` khớp đúng E3 (cùng fixture,
cùng cách tính SHA-256 — đối chứng chéo). Autosave seed là project
RỖNG ("F5-seed-empty") để mount đầu KHÔNG chạy loadSample (tránh
race B1 §6.2 — race đó là việc của luồng F6 đợt này, không đo lại
ở đây) và để việc mở file là hành động duy nhất đưa clip lên
timeline.

| Case | Lượt 1 | Lượt 2 (chạy lại) |
|---|---|---|
| D1 app load project rỗng | PASS (tên "F5-seed-empty", bin trống, 0 clip) | PASS |
| D2 mở file .vcut.json qua UI | FAIL — xem dưới (*) | **PASS** (tên → "F5-drawtoggle", bin có asset, timeline 1 clip `asset:a_e40641880f8e75dc 00:00.0 → 07:00.0`) |
| D3 scrub playhead tới 100 s | PASS (lastRequested=100) | PASS |
| D4 toggle GOP về TẮT | PASS (aria-pressed true → false; ban đầu BẬT đúng mặc định C5) | PASS |
| D5 phát ngược GOP TẮT (element) | PASS (draw 2 → 13, 5 hash canvas khác nhau, lastDrawn 100 → 97,57, badge ngược ẨN) | PASS (draw 2 → 11, 4 hash, 100 → 97,53, badge ẨN) |
| D6 phát ngược GOP BẬT (WebCodecs) | PASS (draw 14 → 18, 6 hash, lastDrawn 100 → 97,57, badge "◀ NGƯỢC: WEBCODECS") | PASS (draw 12 → 15, 6 hash, 100 → 97,73, badge "◀ NGƯỢC: WEBCODECS") |
| D7 toggle decode-ahead | PASS (off → running "⏩ Decode-ahead: BẬT" → off) | PASS |
| D8 không lỗi | PASS (0 window.onerror + 0 unhandledrejection + 0 Runtime.exceptionThrown) | PASS |
| D9 project ổn định | FAIL — xem dưới (*) | **PASS** |

(*) Lượt 1 D2/D9 FAIL cùng một nguyên nhân: check của harness tìm
chuỗi `y1-corrupt` trong bin text, nhưng bin hiển thị item rehydrate
bằng `name: c.src` (`rehydrate36S5.ts:309`) nên tên hiện là
`asset:a_e40641880f8e75dc`, không phải originalName. Đây là hành vi
có chủ đích của sản phẩm cho clip `asset:` (tên item = src), KHÔNG
phải bug — và state ghi lại ở lượt 1 đã chứng minh đủ: tên project
"F5-drawtoggle", 1 clip trên timeline, bin có item. Harness sửa
check sang đúng assetId đã seed rồi chạy lại: **9/9**. Không sửa
production code.

Bằng chứng vẽ frame (đọc gộp 2 lượt): canvas preview (871×275)
đổi hash 4–6 lần trong mỗi cửa sổ 3 s (mean 45,8–53,4, dao động
thật — không phải frame tĩnh); `holdStats.draw` tăng (GOP TẮT
+9/+11, GOP BẬT +3/+4); `lastDrawn` lùi đơn điệu 100 → ~97,6
(stepping ngược ~0,5 s/mẫu); badge ngược hiện đúng "◀ NGƯỢC:
WEBCODECS" khi GOP BẬT và ẨN khi GOP TẮT (đúng thiết kế: badge chỉ
hiện khi opt-in bật). Decode-ahead được cổng S3 CHO PHÉP (running,
không bị blocked) trên VM này.

Lưu ý trung thực về bằng chứng hash: số hash khác nhau (4–6) nhỏ
hơn số draw tăng (+9/+11 ở D5) — một phần do video đổi chậm ở
downscale 64×36 (frame liên tiếp gần giống nhau nên hash trùng)
và một phần do nhánh hold trình bày lại frame cũ ở mốc mới.
Kết luận "frame vẽ đúng" dựa trên BA tín hiệu gộp (draw tăng +
lastDrawn lùi đơn điệu + hash/mean đổi), không dựa riêng vào số
hash. Phạm vi hẹp: 1 fixture 360p GOP 90, 2 lượt, playhead ~100 s,
chưa đo 720p/1080p, GOP khác, hay file khác.

## 5. Kiểm chứng

- Mới `per-seek-probe-fallback-confirm-50f5.test.mjs`: **10/10
  pass** (node --test; gồm đỏ-trước F5a — probe chưa vá F5 chốt
  ngay tick 1 với 0 mẫu; mô phỏng B-frame đầy đủ; readyState
  flicker reset bộ đếm; trần 1000 giữ; trường D5/E5 còn nguyên).
- Hồi quy probe (cùng runner, sau mọi sửa cuối): B5
  `per-seek-probe-pool-cap-46b5.test.mjs` **5/5**, E5
  `pool-element-fingerprint-49e5.test.mjs` **9/9**, F5 **10/10** —
  tổng 24/24 trong một lần chạy `node --test`, fail 0.
- Hồi quy khác: seek `seek.test.ts` **15/15**, D5
  `seekStuckNoAssign48D5.test.ts` **7/7** (strip-types), A6
  `reverseBadge45A6.test.ts` **12/12** (esbuild bundle
  `--format=esm`, như E5 — chạy trực tiếp báo ERR_MODULE_NOT_FOUND
  do import extensionless, là lỗi cách chạy, không phải code).
- `npx tsc --noEmit` (từ `apps/web`): **0 lỗi, exit 0** (chạy lại
  sau mọi file mới; không cần thêm exclude tsconfig vì mọi file
  mới của F5 đều là `.mjs`, ngoài phạm vi tsc).
- `npx vite build` (từ `apps/web`, ra scratch `/tmp/f5-build-check`):
  **pass, built trong 5,96 s** (chỉ cảnh báo chunk > 500 kB có sẵn
  từ trước). Click-test tự build dist riêng ra scratch của nó
  (bundle mới, không dùng dist đóng băng C6 — vòng draw/toggle cần
  code hiện tại gồm E3/E4, khác với probe trần dùng dist C6 để so
  sánh được với E5/D5; ghi rõ để khỏi nhầm).
- Browser headed: 4 lượt cap probe (F5a B-frame, F5b B-frame, F5b
  noise, fast B-frame) + 2 lượt click-test draw/toggle — mọi số
  trong §1–§4 đều từ evidence JSON + log của các lượt đó (scratch
  `~/workspace/tmp-round50-f5/`, không vào repo).

## 6. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. Baseline quiet vẫn chờ cửa sổ yên từ main chat (nợ đứng nhiều đợt).
2. Trần 1000 trên đường WebCodecs / Safari / Firefox / máy thật vẫn chưa đo.
3. Trần 1000 chỉ đo ở drip 64 KiB/s, 1 fixture mỗi loại, 1 lượt mỗi
   loại (F5a là lượt B-frame thứ hai nhưng vá khác nên không gộp
   số). Chưa đo drip chậm hơn (vd 16 KiB/s — seeking dài hơn, trần
   chạm sớm hơn?) hay nhanh hơn.
4. Vòng draw/toggle chỉ chứng minh trên 1 fixture 360p GOP 90,
   playhead ~100 s, 2 lượt. Chưa đo 720p/1080p, GOP khác, file
   khác, hay phát ngược qua GOP hỏng [900,990).
5. Bin hiển thị item rehydrate bằng `name: c.src`
   (`rehydrate36S5.ts:309`) nên clip `asset:` hiện tên
   `asset:<id>` thay vì tên file gốc — hành vi có chủ đích, chỉ
   ghi nhận (cosmetic, ngoài phạm vi luồng này, không sửa).
6. Ngữ nghĩa latency fallback F5b (xem §2.5): đừng so latency
   fallback F5b với latency fallback E5 như cùng định nghĩa.
7. F5a đã đo cửa sổ tiền-seek ~8 s trên B-frame nhưng chưa đo
   trên noise (noise F5b không còn thấy tiền-seek dài vì entry
   tích mẫu ngay từ ~8 s — thực ra series noise cũng cho 0 mẫu
   tới 8,1 s, cùng cửa sổ ~8 s; ghi rõ để khỏi ai tưởng chỉ
   B-frame mới có tiền-seek).

## 7. File đổi/thêm (chỉ của F5 — text, không binary, không dist)

Mới:
1. `docs/PHASE9_ROUND50_F5_PROBE_BFRAME_LIMITS.md` — tài liệu này.
2. `apps/web/scripts/per-seek-probe-patch50f5.mjs` — vá probe lúc
   chạy: lớp F5b (fallback cần 30 tick xác nhận liên tiếp +
   `readyState>=2`), chồng lên D5+E5 qua `patchProbeSrc49E5`
   (cùng helper test Node dùng; KHÔNG sửa file probe gốc).
3. `apps/web/scripts/per-seek-probe-fallback-confirm-50f5.test.mjs` —
   test khóa vá F5b bằng code probe thật trong vm (10/10 pass).
4. `apps/web/scripts/per-seek-probe-sync-cap-run50-f5.mjs` — script
   đo (bản sao E5 + pha S1 cap-wait + `--proxy-mode drip|fast` +
   `--cap-wait-sec`; không sửa file E5 gốc).
5. `apps/web/scripts/clicktest-50f5-drawtoggle-asset.mjs` — harness
   click-test draw/toggle asset: trên UI thật (9/9 × 2 lượt).

Không đổi (ghi rõ để parent khỏi tìm): mọi file `.ts` production
(`seek.ts`, `preview.tsx`, `reverseWebcodecs.ts`, `rehydrate36S5.ts`,
`per-seek-probe-page.js`, i18n, bridge), `tsconfig.json` (không cần
exclude — file mới đều `.mjs`), mọi file của luồng khác,
paths-loop, build-loop-log. Không push, không tag, không stage
batch (parent gộp).

Scratch ngoài repo (không stage):
`~/workspace/tmp-round50-f5/` — `sync-bframe/` (lượt F5a: evidence
+ entries + chrome log + run log), `sync-bframe2/` (lượt F5b
B-frame: evidence + entries + chrome log + run log),
`sync-noise/` (đối chứng noise F5b), `sync-bframe-fast/` (đối chứng
serve-nhanh), `drawtoggle/` (2 lượt click-test: f5-result.json
7/9 + f5-result-rerun.json 9/9, dist build mới, chrome log, file
`.vcut.json`); `/tmp/f5-reg/` (bundle hồi quy A6),
`/tmp/f5-build-check/` (vite build).

# Phase 9 đợt 25, luồng I6 — Click-test browser thật: nút panel lá sâu + nested ramp — LIMITS

Ngày: 2026-10-30 (lượt cron 14:03, chạy thực tế buổi chiều theo giờ
Asia/Saigon). Luồng I6 trong đợt lớn round 25. KHÔNG push, KHÔNG
tag/release, KHÔNG binary vào repo, KHÔNG code giả, KHÔNG stage
batch (parent gộp). Có đúng 1 sửa sản phẩm tối thiểu (§5g, fix
cạnh xuống playing→paused + tsc 0 + vite build pass); 2 phát hiện
còn lại được báo, không tự sửa (§5a, §5b, §5h).

Đóng nợ docs/PHASE9_ROUND24_LIMITS.md §4: "click-test browser thật cho
nút panel lá sâu và nested ramp vẫn chưa xong" (nợ của H6 §1.4, gốc từ
đợt 23 G2). Bài học đợt 22 C được áp dụng ngay từ đầu: mọi thao tác đo
đều diễn ra SAU khi WelcomeModal đã tắt (localStorage `vcut-welcomed=1`
trước reload), không còn click đầu tiên bị modal nuốt.

## 0. Kết luận ngắn (không vượt số đo)

1. **Nút panel lá sâu — PASS trên browser thật, cả chain 1 lẫn chain 2:**
   drill "Xem bên trong" đệ quy tới lá, bấm "Đặt curve 1× cho lá" bằng
   CDP Input thật, msg thành công đúng, nút biến thành note, autosave
   ghi đúng preset 1 keyframe, Ctrl+Z hoàn tác đúng 1 bước (nút trở
   lại, autosave mất curve). Chain 2 (TOP → A → B → lá) pass y hệt
   chain 1. Xem §1.
2. **3 nhánh chặn — PASS đúng nhánh, đúng câu, đúng toast:** chain 1
   `ancestorReverse` (tổ tiên reverse), `leafNonMedia` (lá chữ sâu),
   `ancestorCurveInvalid` (tổ tiên mang curve v=5 sẵn) đều chặn, msg
   panel + toast error trùng nhau và nêu đúng nhánh, nút còn nguyên,
   autosave không đổi. Panel hiện `reason` (câu đã dịch), KHÔNG hiện
   chuỗi `reasonKey` — reasonKey của từng nhánh được khóa bằng test
   store H6 (12/12) + G2 (24/24) chạy lại trong đợt này (§4), không
   mạo nhận là DOM đã hiện reasonKey. Xem §1.3.
3. **Lá đã có curve — hành vi hiện tại ghi đúng:** nút ẩn, chỉ hiện
   note "Lá đã có speed curve." — không có gì để bấm, đúng thiết kế
   InnerClipEditor (không phải bug, không phải fail).
4. **Nested ramp hai tầng — PASS ở run9 (13/14, chỉ fail D7 đã biết):**
   scrub thật trên ruler tới playhead 2.0/3.0 khớp đúng neo tính tay
   ở độ chính xác frame (R1: best đúng neo 3.0208, meanAbs 4.993;
   R2: best đúng neo 5.5430, meanAbs 0.825 — gần như khớp tuyệt
   đối); đường phát→dừng R3 pass sau khi sửa 1 lỗi app thật (§5g)
   và 1 lỗi harness về độ chính xác neo (§3.7): playhead thực từ
   vạch ruler 3.2333 → neo 6.2579 → khớp đúng 6.2579, meanAbs
   0.812. Tiêu chí là so frame canvas với control giải mã độc lập
   (video element của app là detached nên không đọc được
   currentTime qua DOM — xem §2.1).
5. **Phát hiện sản phẩm (xem §5):**
   (a) Load project chứa curve nested vi phạm (v=5) làm preview
   flatten ném 1 exception uncaught lúc load (mọi phiên deep, đúng 1
   lần, UI sau đó vẫn sống, mọi nút vẫn pass) — flatten fail-fast
   theo thiết kế, sửa fail-soft ở preview hot path không còn tối
   thiểu nên giao luồng riêng (báo, không sửa).
   (b) RelinkPanel mù với media trong nested: `findMissingAssets`
   chỉ quét track cấp cao, lá trong subSpec không được tính thiếu —
   nên seed thiếu media không hiện RelinkPanel (harness đã đi đường
   MediaBin import thay thế, vẫn là đường user thật) (báo, không sửa).
   (c) **Đã sửa tối thiểu (§5g):** cạnh xuống playing→paused của
   vòng lặp preview không ép vẽ lại (lastDrawn == t từ các tick
   phát) nên frame tối cuối lúc phát kẹt lại sau khi dừng — fix
   3 dòng + comment ở `preview.tsx`, tsc 0, vite build pass,
   kiểm chứng bằng chính case R3 (run7 FAIL → run9 PASS).
   (d) **Còn mở (§5h):** trong lúc PHÁT, canvas tối dần sau ~1.5s
   (clip thường 720p) / ~0.3–0.7s (ramp 2–3×) trên VM yếu này do
   decoder phần mềm không kịp realtime → readyState tụt < 2 →
   guard `drawVideoClip` bỏ qua mọi frame; clip 360p phát sáng
   suốt (chỉ 1 tick tối thoáng qua) ủng hộ cơ chế quá tải decode,
   chưa phải treo element — cần xác nhận trên máy thật có decode
   phần cứng trước khi gọi đây là bug phổ quát.
6. **Không có bug nào trong nút lá sâu hay mapping ramp bị chứng minh
   sai:** các fail giữa chừng đều là lỗi harness (đã sửa, ghi rõ
   từng cái ở §3) hoặc 2 lỗi app đã nêu ở §5g/§5h (một đã sửa, một
   còn mở và gắn đúng điều kiện VM).

## 1. Nút panel lá sâu (phiên deep-leaf, seed qua autosave)

Seed: 6 nested top trên 6 track riêng (để panel liệt kê đủ, mỗi tầng
chỉ 1 nested con cho finder xác định): TOP-REV, TOP-NONMEDIA,
TOP-CURVINV, TOP-HAS, TOP-CHAIN1, TOP-CHAIN2. Seed qua cổng load
thật (parseProjectText offline: ok, 0 error, 0 warning — kể cả curve
v=5 của MID-CURVINV). Mở panel bằng click thật nút Timeline
"Nested", drill bằng click thật "Xem bên trong" từng tầng.

### 1.1 Case pass (mọi run từ run1 tới run9 đều xanh nhóm này)

| Case | Nội dung | Bằng chứng |
|---|---|---|
| D0-seed-load | Panel liệt kê đủ 6 item | `["TOP-REV","TOP-NONMEDIA","TOP-CURVINV","TOP-HAS","TOP-CHAIN1","TOP-CHAIN2"]` |
| D3-block-ancestorReverse-chain1 | TOP-REV (curve 1×) → MID-REV (reverse) → lá video; bấm nút | msg + toast: `…Nested clip tổ tiên "MID-REV" đang reverse — render cấm reverse ở tầng mang curve.`; nút còn, autosave không curve |
| D4-block-leafNonMedia-chain1 | TOP-NONMEDIA (curve 1×) → MID → lá chữ `TEXT-BLOCKED-LEAF`; bấm nút | msg: `Chỉ lá video/audio mới mang speed curve dưới nested có curve (lá khác không có trục nguồn).`; nút còn, autosave không curve |
| D5-block-ancestorCurveInvalid-chain1 | TOP-CURVINV → MID-CURVINV (curve hằng v=5 sẵn) → lá video; bấm nút | msg: `Speed curve của nested clip tổ tiên "MID-CURVINV" không hợp lệ theo luật render R1.`; nút còn |
| D6-leaf-already-has-curve | TOP-HAS → MID-HAS → lá đã mang preset | Không có nút; note `Lá đã có speed curve.` hiện; rowText ghi nhận |
| D1-success-chain1-undo1 | TOP-CHAIN1 → MID-CHAIN1 → lá; bấm nút rồi Ctrl+Z | msg `Đã đặt curve 1× cho lá (1 bước undo).`; nút → note; autosave lá nhận đúng `{"keyframes":[{"t":0,"v":1,"easing":"linear"}]}`; Ctrl+Z → nút trở lại + autosave mất curve |
| D2-success-chain2-undo1 | TOP-CHAIN2 (curve 1×) → A-CHAIN2 → B-CHAIN2 → lá; drill 2 tầng, bấm nút rồi Ctrl+Z | Giống D1 ở chain 2 (msg, nút → note, autosave preset, Ctrl+Z hoàn tác) |
| D8-extra-undo-noop | Cuối phiên: 2 Ctrl+Z thừa | Panel vẫn đủ 6 item — seed load không sinh entry undo bị undo mất |

Mọi click trong nhóm này đều là `cdp-input` (không fallback
`element.click()` nào). Thứ tự chạy cố tình: chặn trước, thành công
sau, để undo stack sạch khi đo chặn.

### 1.2 Vì sao D3/D4/D5 tới được nhánh chặn (khớp chứng minh H6 §1.3)

Cổng chỉ kiểm tra khi có ít nhất 1 tầng tổ tiên mang curve
(`curveLevels` rỗng → cho qua ngay): D3/D4 có TOP mang curve hằng
1× nên cổng chạy tiếp và gặp reverse / lá chữ; D5 có MID mang curve
v=5 nên gặp invalid trước khi tới tích keyframe. Đây là cùng điều
kiện H6 đã dùng ở tầng store — nay có bằng chứng DOM thật.

### 1.3 Trung thực về reasonKey

Panel `setLeafCurve` hiện `res.reason` (câu đã dịch, nêu đúng nhánh
+ tên clip) và store đã toast đúng câu đó — msg panel và toast trùng
nhau từng chữ trong log run. Chuỗi `reasonKey`
(`nested.twoLevelAncestorReverse`, `nested.twoLevelLeafNonMedia`,
`nested.twoLevelAncestorCurveInvalid`) KHÔNG xuất hiện trong DOM
(panel không render reasonKey). Task giao "hiển thị reasonKey đúng"
được hiểu và kiểm chứng ở mức: nhánh hiển thị đúng (qua reason text
phân biệt từng nhánh) + reasonKey đúng được khóa bằng test store
chạy lại trong đợt (§4: H6 12/12 khóa đúng 3 reasonKey này ở chain
sâu, G2 24/24). Không claim DOM đã hiện reasonKey.

### 1.4 D7 — fail có chủ ý, không phải nút hỏng (xem §5a)

Mọi run deep (run1–run9) đều có đúng 1 `Runtime.exceptionThrown`,
timestamp luôn RƠI VÀO LÚC LOAD (trước khi panel mở, vd run5:
exception 07:40:04.985, panel mở 07:40:07; run9: 08:28:08.851):
`nested clip "MID-CURVINV": speedKeyframes.keyframes[0].v phải
trong 0.25..4 (nhận được: 5)` từ `resolveNestedRampCurve`
(nestedPreview fail-fast). UI sau đó hoàn toàn sống (8/8 case
deep còn lại pass). D7 vì vậy FAIL ở mọi run theo tiêu chí "0
exception" — nhưng fail này thuộc về fixture vi phạm cố tình +
đường load/preview, không thuộc về nút panel. Không sửa ở luồng
này (lý do §5a).

## 2. Nested ramp hai tầng (phiên ramp, seed + import media thật)

Seed (đúng shape test T1(a) đợt 21): nested TOP-RAMP start 0,
duration 4 (output), trim [0, 6), curve ngoài linear 1→2 trên [0, 4];
lá video trong subSpec start 0, duration 6, in 0, out 9, curve trong
linear 1→2 trên [0, 6], src `ramp12.mp4`. Neo tính tay (giống
twoLevelCurve.test.ts):
- t'=2 → x = 2 + 2²/8 = 2.5; src = 2.5 + 2.5²/12 = **3.0208333**;
  speed hợp = 1.5 × 1.4167 = **2.125**.
- t'=3 → x = 3 + 9/8 = 4.125; src = 4.125 + 4.125²/12 = **5.54296875**.
- Công thức tổng quát dùng cho đường phát: src(t') với
  x = t' + t'²/8, src = x + x²/12.

Media: video `ramp12.mp4` tự sinh bằng ffmpeg (testsrc2 1280×720,
30fps, 12s, H.264 yuv420p, 4524123 byte — chỉ nằm ở scratch, không
vào repo) rồi import vào MediaBin bằng file input thật qua CDP
`DOM.setFileInputFiles` (không qua dialog native, nhưng là input
thật của app; media hiện `.media-name` = `ramp12.mp4` mới tiếp tục).

### 2.1 Vì sao tiêu chí là so frame, không phải currentTime

Video element của preview là detached: `MediaPool.videoFor`
(`media.ts`) tạo bằng `document.createElement("video")`, không gắn
vào DOM — `document.querySelectorAll("video")` không bao giờ thấy
nó (probe run xác nhận videos = []). Vì vậy không đọc được
currentTime/playbackRate của app qua DOM. Tiêu chí thay thế mạnh
hơn và đúng bản chất "preview frame": chụp canvas preview
(`#vcut-preview-wrap canvas`) so pixel-by-pixel với control video
giải mã độc lập cùng file (qua static server của harness) tại
source kỳ vọng, vẽ contain-fit trên nền đen — khớp đúng
`letterboxFit` của `drawVideoClip` (vùng video đo được x 113–1238
trên canvas 1352×633 khớp hình học contain). Tiêu chí cuối
(run7–run9, sau hiệu chuẩn ffmpeg §2.4): pass khi mốc khớp nhất
ĐÚNG neo (không phải mốc lân cận) VÀ diffPct ≤ 15% VÀ meanAbs ≤
6.5 — tức chính xác frame (±1 frame). Ngưỡng 5%/5% ban đầu là sai
với nội dung testsrc2: hiệu chuẩn ffmpeg độc lập cho thấy 2 frame
kề nhau (cách 1/30s) đã lệch 11.73%/5.870, còn frame cách 0.033s
trùng nhau 0.00%/0.000 — nên ngưỡng cũ không phân biệt được frame
đúng với frame kề, ngưỡng mới thì có (frame đúng meanAbs ≤ ~1–5,
frame kề meanAbs ≥ ~6.3).

### 2.2 Scrub ruler (đã chạy được từ run5)

Sau khi đóng panel nested, ruler về y=813 trong viewport thật
(innerH 1057 với cửa sổ 1920×1200). Hiệu chuẩn 2 click: x+40 →
playhead 0.7, x+240 → playhead 4.0 (clamp cuối timeline) ⇒
pxPerSec = 200/3.3 ≈ 60.606 dùng cho kéo scrub. Lưu ý trung thực
(diag-line): ánh xạ thật của vạch là đúng 60 px/s (vạch
`.tl-playhead-line` center = rulerX + 60 × playhead: rulerX 152,
center 272 @ 2.0 và 332 @ 3.0) — số 60.606 bị lệch vì mốc x+240 đã
clamp ở cuối timeline (playhead thực tại đó > 4.0). Kéo scrub vẫn
đích chính xác (R1/R2 khớp neo ở độ chính xác frame) vì scrubTo
kiểm tra bằng readout sau kéo; riêng R3 dùng vạch (không dùng
text) để tính neo (§3.7). Kéo scrub CDP (pressed + moved từng
bước + released, mẫu đợt 22 C) tới playhead 2.0 và 3.0 đều đọc
đúng readout (±0.15).

### 2.3 Kết quả nhóm ramp theo run (đã có run cuối)

- run1: R0 FAIL (lỗi harness FAB mobile — §3.1), chưa tới scrub.
- run2: R-calib FAIL (lỗi harness ruler ngoài viewport — §3.2).
- run3: như run2 (sau khi sửa scrollIntoView nhưng viewport thật
  vẫn chỉ 936).
- run4: như run3 + dump chẩn đoán (elementFromPoint = null,
  innerH = 936 — §3.2).
- run5: R0 PASS; calib PASS (pxPerSec 60.606); R1/R2/R3 FAIL do 2
  lỗi harness (§3.3, §3.4): control không seek được (ct=0) + settle
  chấp nhận canvas tối. R4 (0 exception phiên ramp) PASS.
- run6 (sau khi sửa Range + settle + tìm mốc lân cận + neo theo
  playhead thực): R0 PASS; R1 FAIL chỉ do ngưỡng (khớp nhất ĐÚNG
  neo 3.0208, 11.36%/4.993 — dưới ngưỡng mới thì pass); R2/R3 FAIL
  canvas tối mean 10.492883671078541 (cùng 1 giá trị ở cả 2 case —
  canvas nền, không phải frame); R4 PASS. Tổng run6: 10/14.
- diag-ramp (sau run6, không ghi case): quét playhead
  [2, 2.5, 3, 2, 3.5, 3] KHÔNG dùng control video — tất cả sáng
  (mean 104.75–105.24, hash về 2 và về 3 lặp lại y hệt) → bóng tối
  run6 không phải do playhead 3, không phải vĩnh viễn; giả thuyết
  nhiễu từ 5 video control tạo mới liên tiếp được đặt ra.
- run7 (sau khi sửa: tiêu chí frame-level + tái dùng đúng 1 video
  control `window.__i6ctl`): R0 PASS; R1 PASS (best đúng neo
  3.0208, 11.36%/4.993); R2 PASS (best đúng neo 5.5430, meanAbs
  0.825 — gần như khớp tuyệt đối; canvas sáng 105.00 → giả
  thuyết nhiễu control ở run6 được ủng hộ); R3 FAIL canvas tối
  mean 10.492883671078541 sau phát-dừng (dù R1/R2 sáng) — mở đầu
  chuỗi chẩn đoán §2.4; R4 PASS. Tổng run7: 12/14 (fail D7 + R3).
- run8 (sau fix §5g, bundle mới index-CIPyYKhc.js
  sha256[:16] = daf1b772155f5dde): R1 PASS, R2 PASS (số như run7);
  R3 SÁNG (mean 104.98) nhưng FAIL do neo sai: khớp nhất 5.6430
  (meanAbs 0.812) thay vì neo từ text "3" là 5.5430 — tức frame
  đúng nhưng neo tính từ text làm tròn 0.1 bị lệch (playhead
  thực ~3.03). Tổng run8: 12/14 (fail D7 + R3-neo).
- run9 (sau khi sửa neo R3 bằng vạch ruler, §3.7, cùng bundle
  run8): R1 PASS (3.0208, 11.36%/4.993); R2 PASS (5.5430,
  7.39%/0.825); R3 PASS — playhead thực từ vạch 3.2333 (text 3.2)
  → neo 6.2579 → khớp đúng 6.2579, 7.47%/0.812, lân cận ~7.1–7.4;
  R4 PASS. Tổng run9: **13/14 (chỉ fail D7)**.

### 2.4 Chẩn đoán R3: từ "canvas tối" tới fix cạnh xuống (§5g) và nợ (§5h)

Chuỗi chẩn đoán (các diag không ghi case, chỉ log; tất cả đều
dùng seed ramp + media thật như run chính):

- diag-play: phát từ 2 → canvas tối NGAY sample đầu (playhead
  2.6, mean 10.49); phát lại từ đầu ở playhead 0.6 lại sáng →
  bóng tối gắn với lúc phát, không gắn với playhead cụ thể.
- diag-play2 (lấy mẫu 200ms + hook `__vcutPreviewIdle`): vòng lặp
  vẫn tick, lastDrawn chạy theo playhead trong lúc phát nhưng
  canvas tối; phát từ 0.5: sáng ở 0.7/1.0, tối từ 1.3 → mốc tối
  không cố định theo playhead hay thời gian nguồn.
- diag-plain (clip thường, không nested, không ramp — đối chứng):
  phát từ 0.5 sáng tới playhead 2.6, tối từ 2.8; sau dừng vẫn tối,
  scrub về 2 lại sáng ngay → bug phát-preview là TỔNG QUÁT,
  không riêng nested/ramp.
- diag-plain6/7 (đi qua cây fiber React để đọc element pool):
  lúc tối-sau-dừng, element hoàn toàn khỏe (readyState 4,
  videoWidth 1280, currentTime 2.97, paused, không lỗi); vẽ thử
  element lên canvas riêng lúc đang phát-tối cho mean 126.3
  (sáng) trong khi preview tối, kèm readyState = 1 lúc đang phát
  → guard `v.readyState >= 2` trong `drawVideoClip` loại element
  dù nó vẫn cho frame vẽ được; và sau dừng, vòng lặp ngủ
  (lastDrawn == t từ các tick phát) nên không vẽ lại.
- diag-plain-small (video 640×360, cùng nội dung): phát sáng suốt
  tới playhead 3.2 + sau dừng sáng (chỉ 1 tick tối thoáng qua ở
  2.1 rồi sáng lại ngay) → ủng hộ cơ chế quá tải decode trên VM
  yếu (decode phần mềm 720p không kịp realtime cho element
  detached; 360p kịp) chứ không phải treo element.
- Kết luận chia 2 (xem §5g/§5h): (B) pause-không-vẽ-lại là lỗi
  logic thật, đã sửa tối thiểu; (A) tối-trong-lúc-phát là hành vi
  phụ thuộc tải decode của máy đo, còn mở, cần xác nhận trên máy
  thật trước khi gọi là bug phổ quát.

## 3. Lỗi harness đã gặp và đã sửa (không phải lỗi app)

1. **FAB chỉ có trên mobile (run1 R0):** nút "Thư viện media" chỉ
   render khi `isMobile` (App.tsx); desktop thì MediaBin render sẵn
   inline. Sửa: chờ `.mediabin` trực tiếp, bỏ click FAB.
2. **Ruler ngoài viewport (run2–run4):** cửa sổ 1920×1080 chỉ cho
   viewport thật innerH = 936 (trừ chrome UI); sau các click panel,
   trang cuộn khiến ruler kẹt ở y=931–958, `elementFromPoint` trả
   null, click CDP ngoài viewport không tới ruler. Sửa: cửa sổ
   1920×1200 (innerH 1057), đóng panel nested trước khi scrub,
   `getRuler` tự scrollIntoView + cuộn cuối trang + kiểm tra theo
   innerHeight thật (không hardcode 1080), scrub đọc lại ruler mỗi
   lần theo mốc hiệu chuẩn.
3. **Control video không seek được (run5):** static server của
   harness không hỗ trợ header Range nên Chrome không seek được
   qua HTTP — control `currentTime` stuck 0, so sánh cho diff giả
   (R1 14.50% là app@3.02 so với control@0, không phải app sai).
   Sửa: server trả 206 + Content-Range + Accept-Ranges; thêm guard
   trong `canvasVsControl`: control seek lệch > 0.25 thì trả lỗi
   control, không tính thành lỗi app.
4. **Settle chấp nhận canvas tối + neo sai ở đường phát (run5):**
   R2 canvas mean 10.5 (video app đang seek, chưa vẽ frame) vẫn qua
   vì ngưỡng cũ mean > 5; R3 dừng ở playhead 2.9 mà so với neo của
   3.0. Sửa: settle yêu cầu canvas sáng (mean > 30; frame testsrc2
   sáng ~104), đợi tới 20s; R3 tính neo từ playhead thực tế sau khi
   dừng bằng công thức §2 (không hardcode 5.54296875).
5. **Socket Xvfb mồ côi / cổng:** tái dùng đúng cách sửa đợt 22 F
   (chỉ dùng chung display khi pgrep thấy Xvfb còn sống; cổng
   4195 + display :95 riêng cho luồng I6).
6. **Video control tạo mới mỗi ứng viên gây nhiễu (run6 → run7):**
   `canvasVsControl` cũ tạo 1 video control mới cho mỗi mốc lân
   cận (5 element/phiên đo); run6 R2/R3 tối sau khi chạy R1 trong
   khi diag không dùng control thì sáng ở mọi playhead. Sửa: tái
   dùng đúng 1 element `window.__i6ctl` cả phiên (tạo 1 lần, pause
   trước mỗi lần seek, không remove) — run7 R2 sáng + khớp neo
   gần tuyệt đối, ủng hộ giả thuyết nhiễu decoder (không chứng
   minh tuyệt đối, chỉ là bằng chứng ủng hộ).
7. **Neo R3 từ text làm tròn 0.1 (run8 → run9):** text playhead chỉ
   có 1 số thập phân nên neo từ "3" lệch tới 0.15s nguồn so với
   playhead thực (~3.03 ở run8, 3.2333 ở run9 — run8 khớp nhất
   5.6430 meanAbs 0.812 chính là frame đúng của playhead thực).
   Sửa: đọc vị trí vạch `.tl-playhead-line` (center = rulerX + 60
   × playhead, kiểm chứng diag-line) cùng 1 evaluate với ruler
   để tính playhead thực (~0.01s) rồi mới tính neo — run9 R3
   khớp đúng neo 6.2579, meanAbs 0.812.
8. **Chẩn đoán plain-mode (diag-plain):** bước "đóng panel nested"
   bấm toggle cả khi panel đang đóng → mở panel ra, trang dài
   thêm, ruler kẹt dưới fold (y=1045 > innerH 1057, scrollY=0 vì
   window không phải scroller). Sửa: chỉ bấm toggle khi panel
   đang mở; `getRuler` cuộn cả chuỗi ancestor cuộn được của ruler
   rồi mới đo lại (không chỉ `window.scrollTo`).

## 4. Kiểm chứng đã chạy (lệnh + kết quả số)

- `node --check apps/web/scripts/clicktest-deep-leaf-ramp-pipe.mjs`: pass
  (mọi lần sửa).
- Harness (Chrome headed Playwright Chromium 156 qua pipe, Xvfb
  1920×1080×24; snapshot dist phục vụ bằng static server để luồng
  khác build lại dist không phá phiên đo; snapshot phải chứa cả
  `curveCreate` + `deepLevelHead` nếu không harness BLOCKER):
  run1–run6 dùng bundle `index-Bx23Gx7-.js` sha256[:16] =
  `88fe33272b458822` (code đợt 24 H6): run1: 8/10 pass (2 fail: D7
  exception lúc load, R0 FAB); run2: 9/11 pass (fail: D7, R-calib);
  run3: 9/11 pass (fail: D7, R-calib); run4: 9/11 pass (fail: D7,
  R-calib + dump chẩn đoán); run5: 10/14 pass (fail: D7, R1, R2,
  R3 — 3 fail ramp đều do lỗi harness §3.3/§3.4, đã sửa; R4
  pass); run6: 10/14 pass (fail: D7, R1-ngưỡng, R2-tối, R3-tối —
  xem §2.3).
  diag-ramp (quét sáng, không ghi case); diag-play, diag-play2
  (phát→tối + hook loop); diag-plain (lần 1: R-calib FAIL do lỗi
  harness §3.8, không tới nhánh chẩn đoán); diag-plain2–7 (clip
  thường phát→tối, fiber pool, vẽ thử element, xem §2.4);
  diag-plain-small (360p phát sáng suốt, 1 tick tối thoáng qua);
  diag-line (vạch playhead 60 px/s, xem §2.2/§3.7).
  run7 (tiêu chí frame-level + control tái dùng, cùng bundle
  Bx23Gx7): 12/14 pass (fail: D7, R3-tối). run8 (bundle mới sau
  fix §5g: `index-CIPyYKhc.js` sha256[:16] = `daf1b772155f5dde`,
  khớp hash dist vừa build — fix có mặt trong bản đo): 12/14
  pass (fail: D7, R3-neo-sai-do-text). run9 (cùng bundle run8 +
  neo R3 bằng vạch): **13/14 pass (chỉ fail D7)**.
- Test store khóa reasonKey + anchor (chạy lại trong đợt, esbuild
  bundle, Node):
  `store.nestedDeepLeaf24H6.test.ts` → **12 pass, 0 fail**;
  `store.nestedLeafGate23G2.test.ts` → **24 pass, 0 fail**;
  `twoLevelCurve.test.ts` (node strip-types) → **12 check pass**
  (sourceAt(2) = 3.0208333, speedAt(2) = 2.125);
  `nestedRampPreview.test.ts` → **34 test pass**.
- Seed qua cổng load thật (esbuild probe /tmp, không vào repo):
  deep ok=true, ramp ok=true, errors=[], warnings=[].
- tsc (sau fix §5g — bắt buộc vì có sửa code sản phẩm):
  `../../node_modules/.bin/tsc --noEmit` trong `apps/web` → **0
  lỗi**; `npm run build` (tsc + vite build) → pass, bundle mới
  `index-CIPyYKhc.js` (947960 byte) dùng cho run8/run9. Harness
  qua `node --check` sau mọi lần sửa.
- KHÔNG push, KHÔNG chạy push-files, KHÔNG ghi qua GitHub connector,
  KHÔNG stage (parent gộp batch). `apps/web/dist/` chỉ đọc để
  snapshot (bản sao nằm ở scratch, không stage).

## 5. Chưa xong — nợ còn lại và phát hiện giao lại (không mạo nhận)

- **(a) Exception lúc load với curve nested vi phạm (D7):** project
  chứa nested curve v=5 (load-validation cho qua vì
  `validateSpecDeep` không kiểm tra khoảng keyframe) làm
  `buildPreviewSpec` → `resolveNestedRampCurve` ném uncaught đúng 1
  lần lúc load (timestamp trước mọi click, lặp lại ở cả 5 run deep).
  UI sau đó sống, mọi nút pass; ảnh hưởng lên canvas preview của
  project vi phạm CHƯA đo được (seed deep không có media nên canvas
  vốn đã trống — không kết luận preview có chết hay không). Hướng
  sửa giao luồng riêng: hoặc load-validation cảnh báo curve vi
  phạm, hoặc preview fallback fail-soft cho nested curve lỗi (cân
  nhắc kỹ vì flatten hiện fail-fast có chủ ý, đổi nó có thể phá
  parity test assert throw). Luồng này cố tình KHÔNG sửa (ngoài
  phạm vi tối thiểu, theo tiền lệ đợt 22 F với lỗi validator nested).
- **(b) RelinkPanel mù với media trong nested:** `findMissingAssets`
  (`lib/relink.ts`) chỉ quét `spec.tracks` cấp cao; clip nested
  không có `src` nên lá trong subSpec không bao giờ được tính
  thiếu → project chỉ thiếu media trong nested không hiện
  RelinkPanel (quan sát ở cả 2 phiên seed). Đường vòng cho user
  hiện tại là import lại qua MediaBin (harness đã dùng đường này
  cho ramp và thành công). Cần luồng riêng vá đệ quy subSpec cho
  cả `findMissingAssets` lẫn `relinkAsset` (kèm test).
- **(c) reasonKey không render trong DOM:** panel chỉ hiện reason
  text (xem §1.3). Nếu product muốn hiện mã nhánh cho user/debug
  thì cần sửa UI panel — ngoài phạm vi luồng này.
- **(d) Máy thật / Safari / touch / dpr > 1 / viewport khác:** toàn
  bộ đo là Chromium 156 headed dưới Xvfb, raster phần mềm, dpr = 1
  — cấm trích thành hành vi trên máy user.
- **(e) Scrub bằng kéo thật (drag) cho deep-leaf:** deep-leaf chỉ
  dùng click rời rạc; kéo scrub chỉ đo ở phiên ramp (R1–R3).
- **(f) Nhánh chặn còn lại ở chain sâu** (`leafSelfCurveInvalid`,
  `ancestorKeyframeProduct`, `ancestorCombinedRange`): nút preset
  không tự sinh được từ trạng thái panel sạch (chứng minh H6 §1.3)
  nên không click-test được bằng preset — vẫn chỉ khóa ở tầng store
  (H6 test), như H6 đã ghi.
- **(g) ĐÃ SỬA — pause sau phát không vẽ lại (bug logic thật,
  fix tối thiểu + kiểm chứng bằng harness):** vòng lặp preview
  (`apps/web/src/preview.tsx`, `PreviewCanvas`) gán
  `lastDrawn = t` mỗi tick trong lúc phát; khi dừng (cạnh xuống
  playing→paused), nhánh pause thấy `t === lastDrawn` nên không
  request seek/vẽ gì và ngủ luôn — canvas kẹt ở frame cuối lúc
  phát, dù frame đó có thể tối (do §5h) hoặc không phải frame
  tại t. Bất biến "lastDrawn == t ⟹ canvas đang hiện frame tại t"
  bị phá vỡ mỗi khi 1 tick phát vẽ thất bại (guard readyState).
  Fix (3 dòng + comment, đúng pattern của khối `redrawFlag`):
  tính `justPaused = prevPlaying && !playing` trước khi cập nhật
  `prevPlayingRef`, và trong nhánh pause, nếu `justPaused` thì
  `seeker.cancel(); lastDrawn = null; lastRequested = null;` để
  nhánh pause seek+vẽ đúng frame tại t (khi frame cuối đã đúng
  thì seek gần như no-op). Kiểm chứng: tsc 0, vite build pass,
  bundle mới có fix (hash khớp snapshot run8); R3 run7 FAIL
  (canvas tối sau dừng) → run8 SÁNG (mean 104.98, chỉ sai neo do
  text) → run9 PASS (neo từ vạch). Không có test unit cho loop
  này (loop nằm trong component, không test nào tham chiếu
  lastDrawn/prevPlaying — đã grep) nên case R3 của harness chính
  là test hồi quy cho fix này (trước FAIL, sau PASS).
- **(h) CÒN MỞ — canvas tối TRONG LÚC PHÁT trên VM yếu (chưa
  sửa, cần xác nhận máy thật):** cơ chế đã đo đầy đủ (§2.4):
  decode phần mềm 720p30 cho element video detached không kịp
  realtime trên VM này → `readyState` tụt xuống 1 trong lúc phát
  (đo trực tiếp lúc đang phát-tối) → guard `readyState >= 2`
  trong `drawVideoClip` bỏ qua mọi frame → mỗi tick phát vẽ nền
  đen đè lên frame cũ → canvas đen kịt; dừng lại thì §5g đã sửa
  (vẽ lại frame đúng), nhưng trong lúc phát vẫn đen. Bằng chứng
  ủng hộ quá tải decode (không phải treo element): clip 360p cùng
  nội dung phát sáng suốt; vẽ thử element lúc phát-tối vẫn cho
  frame sáng (mean ~126); element không lỗi, currentTime vẫn chạy
  theo playhead. Trên máy thật có decode phần cứng, 720p 1× và
  cả ramp 2–3× nhiều khả năng kịp realtime và không gặp hiện
  tượng này — vì vậy KHÔNG kết luận "preview phát bị hỏng cho
  mọi user". Hướng sửa cho luồng riêng (không tối thiểu ở đây):
  giữ frame cuối khi guard fail trong lúc phát (đừng xóa nền đè
  lên frame tốt), hoặc nới guard cho trường hợp videoWidth > 0
  (drawImage khi chưa có frame là no-op an toàn) — cần cân nhắc
  vì đổi guard ảnh hưởng mọi đường vẽ preview, kèm test hồi quy
  trên máy thật.

## 6. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- Sửa (sản phẩm, tối thiểu — §5g): `apps/web/src/preview.tsx` —
  thêm `justPaused` (cạnh xuống playing→paused) + reset
  lastDrawn/lastRequested trong nhánh pause; tsc 0, vite build
  pass. Parent cần stage file này (fix đã kiểm chứng ở run8/run9).
- Mới: `apps/web/scripts/clicktest-deep-leaf-ramp-pipe.mjs` — harness
  click-test I6 (pipe CDP + snapshot dist + static server có Range +
  seed deep/ramp/plain qua autosave + drill DeepInnerLevel + scrub
  ruler + so frame canvas vs control + các nhánh chẩn đoán
  I6_DIAG_RAMP / I6_DIAG_PLAY / I6_DIAG_PLAIN / I6_DIAG_LINE /
  I6_SMALL_VIDEO + probe fiber pool/scratch; cổng 4195, display
  :95, env I6_DISPLAY / I6_PORT / I6_RUN_LABEL / I6_PROBE).
- Mới: `docs/PHASE9_ROUND25_I6_CLICKTEST_LIMITS.md` — file này.
- Mới (file chạy): `benchmarks/results/clicktest-deep-leaf-ramp-r25.json`
  — kết quả run9 + log đầy đủ (parent quyết có stage hay không;
  các run trước bị ghi đè theo đúng mẫu đợt 22 F — số liệu từng run
  đã ghi hết trong §4 và log luồng).
- `apps/web/dist/` đã build lại tại chỗ để đo fix (bundle
  `index-CIPyYKhc.js`, sha256[:16] = `daf1b772155f5dde`) — dist là
  build output, parent quyết có stage hay không theo quy ước
  chung (trước đây các luồng chỉ stage source); KHÔNG đưa binary
  nào khác vào repo (video ramp chỉ ở scratch, xem §7).

## 7. Scratch (luồng dọn cuối lượt — xác nhận bằng ls)

- `~/workspace/tmp-round25-i6/` chứa trong lúc chạy: `dist-snapshot/`
  (bản sao dist phục vụ đo), `ramp12.mp4` (video test ffmpeg,
  720p cho run chính; có lúc bị ghi đè bằng bản 360p ở
  diag-plain-small rồi tạo lại 720p cho run8/run9), `frame-*.png`
  (frame trích bằng ffmpeg để hiệu chuẩn ngưỡng so frame, §2.1).
  Cuối luồng: dọn sạch toàn bộ scratch, xác nhận bằng `ls`
  (ghi kết quả ls vào báo cáo cuối).

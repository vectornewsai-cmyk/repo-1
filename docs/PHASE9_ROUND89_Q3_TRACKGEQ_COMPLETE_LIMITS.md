# Phase 9 Đợt 89 — Luồng Q3: Trackgeq hoàn thiện (LIMITS)

- **Ngày:** 11/11/2026 (lượt cron 18:35 +07; làm việc 11:37–13:40 UTC).
- **Phạm vi:** Đóng nợ LIMITS gộp đợt 88 §4 mục 9 — "Trackgeq: harness O3
  chưa chạy lại nguyên vẹn; compound có trim/speed ở cửa sổ nested chưa
  test; transition khác fade chưa đo; chưa nối preview web".
- **Cây làm việc:** `~/workspace/repo-1` (không phải git repo). KHÔNG push,
  KHÔNG release/tag. Mọi số dưới đây là đo thật (pixel/frame), không ước lượng.
- **Harness:** `server/render/src/test_round87_o3_mask_track_geq.js` (O3,
  tái tạo sau sự cố — xem §7) và
  `server/render/src/test_round89_q3_trackgeq_complete.js` (mới, sections
  C1–C4/T1–T4/P).

## 1. Harness O3 chạy lại — XANH (21 pass, 0 fail, một lần chạy duy nhất)

Sau VM reboot ~13:21Z, harness O3 đã chạy **nguyên vẹn trong một lần chạy
`all` duy nhất: 21 pass, 0 fail** (log `/tmp/r89q3/o3-full-final.log`,
13:42–13:47Z, EXIT=0). Số đo khớp hệt O3 gốc đợt 87:

| Section | Số đo (lần chạy `all`) |
|---|---|
| A (trackgeq động, 720p 4s) | render 111.5s (1.08 fps); cx 351.8/640.1/928.1 (kỳ vọng 352/640/928); geq tĩnh+D3 cx 352/640/927.9; png tĩnh cx=640; feather 34px ở mọi mốc, cả 3 mode |
| C (tốc độ 3 mode) | trackgeq 1.08 fps; png tĩnh 16.41 fps (7.3s); geq tĩnh 1.76 fps (68.3s) |
| D (gradient + D3) | trackgeq meanLuma 4.99/9.14/13.31; geq tĩnh+D3 9.15/9.14/9.15 |
| E (track 20 điểm, 360p 2s) | render 9.7s (6.18 fps); cx=319.9 (kỳ vọng 320) |

Lịch sử: lần 1 (11:37–11:55) và lần 3 (12:12–12:23) chết giữa chừng do sóng
EPERM (D: frame extraction file 0 byte; ghi spec section D) — A+C xanh cả 2
lần với số giống hệt; D+E xanh 1 lần qua section `de` (5 pass, 0 fail). Harness
đã được chia section (`a|ac|d|e|de|all`, mẫu harness P4) và thêm retry EPERM
12×30s cho mọi bước ghi/render/ffmpeg trước khi chạy `all` thành công.
Toàn bộ số đo khớp hệt O3 gốc đợt 87 trên cây đã có fix cây if cân bằng của
P4 đợt 88.

## 2. Compound clip — trim/speed ở cửa sổ nested (trackgeq)

Media: đỏ/xanh lá/trắng 720p; mask ellipse + track. Cửa sổ nested 3s.
C1/C4 đã chạy lại sau reboot (log `/tmp/r89q3/q3-c-rerun.log`): C1 **5 pass,
0 fail**, C2 **3 pass, 0 fail**, C3 **3 pass, 0 fail**, C4 **5 pass, 0 fail** —
số đo giống hệt lần chạy trước reboot.

| Case | Kết quả | Số đo |
|---|---|---|
| C1: nested in=1.0 trim cửa sổ, leaf [1.5,4.0) nằm trọn trong cửa sổ | **xanh** | render 263.0s (0.34 fps), duration 3s; tâm mask t=1.0/2.0/2.9 → cx 409.5/716.8/993.3 (kỳ vọng 409.6/716.8/993.3, lệch ≤0.1px) |
| C2: nested speed=2 + leaf có track | **fail-fast đúng thiết kế** | exit 1, không tạo output; thông báo: "clip mang keyframes/track/karaoke/volumeKeyframes mà clip lồng nhau phát ở speed!= 1 — scale thời gian keyframe chưa được hỗ trợ" |
| C3: nested in=1.0 cắt trái leaf có track | **fail-fast đúng thiết kế** | exit 1, không tạo output; thông báo: "clip bị cắt bên trái mà mang keyframes/track/karaoke/volumeKeyframes — dịch thời gian keyframe chưa được hỗ trợ, không render sai lặng lẽ" |
| C4: nested duration=2 cắt phải leaf 4s + track | **xanh** | render 179.4s (0.33 fps), duration 2s; warning đúng từng chữ: "cắt phải bỏ 1 keyframe/điểm track/từ karaoke vượt quá duration mới 2s"; tâm t=0.5/1.5 → cx 351.8/544.0 (kỳ vọng 352/544, lệch ≤0.2px) |

Kết luận: leaf nằm trọn trong cửa sổ thì render đúng; speed≠1 hoặc cắt trái
leaf có track thì bị từ chối rõ ràng (không render sai lặng lẽ); cắt phải thì
render được + warning + bỏ điểm track thừa.

## 3. Transition khác fade — wipeleft + slideleft, mask+track, cả 2 mode

Setup: clip A đỏ 3s + clip B xanh lá 3s, transition window [2,3]s (B bắt đầu
sớm 1s, B local = t−2); track A 0.2→0.8/3s, track B 0.7→0.3/3s; render 720p
6s. Mỗi section **8 pass, 0 fail** với harness đã sửa kỳ vọng (xem §7).

| Section | Render | t=1.0 (A) | t=2.2 (giữa transition) | t=2.8 (gần hết transition) | t=4.9 (B) |
|---|---|---|---|---|---|
| T1 wipeleft/png | 54.7s (3.29 fps) | đỏ 511.9 (kỳ vọng 512) | đỏ bbox 624/1025, xanh lá 1026/1041 (biên wipe 1024) | đỏ n=0, xanh lá 759.5 (kỳ vọng 759.5) | xanh lá 401.3 (kỳ vọng 401.1) |
| T2 wipeleft/trackgeq | 136.7s (1.32 fps) | đỏ 511.8 | đỏ 624/1025, xanh lá 1026/1041 | đỏ n=0, xanh lá 759.5 | xanh lá 401.0 |
| T3 slideleft/png | 55.8s (3.22 fps) | đỏ 511.9 | đỏ 563.2 (kỳ vọng 563.2), xanh lá n=0 | đỏ x1=145 (kỳ vọng ~141), xanh lá 1014.4 (kỳ vọng 1015.5) | xanh lá 401.1 (kỳ vọng 401.1) |
| T4 slideleft/trackgeq | 246.1s (0.73 fps) | đỏ 511.8 | đỏ 563.3, xanh lá n=0 | đỏ x1=143, xanh lá 1014.3 | xanh lá 401.1 (kỳ vọng 401.1) |

Kết luận: **mask bám track đúng qua cả wipe và slide, ở cả 2 mode; số đo
trackgeq và png giống nhau trong ~1px ở mọi mốc** (wipe: 624/1025,
1026/1041, 759.5 giống hệt; slide: 563.2/563.3, 1014.4/1014.3). Mask áp
pre-xfade nên transition không phá mask — đúng như thiết kế.

## 4. Preview web + trackgeq — QUYẾT ĐỊNH: hướng (b), KHÔNG thêm cờ

**Lý do (đã đo, không chỉ lập luận):**

1. Không có cờ mask-mode nào ở bridge/desktop/web — grep chỉ thấy comment
   ở `preview.tsx`. App chỉ render png mặc định nên không có đường render
   trackgeq nào để preview khớp.
2. Preview đã theo đúng quy tắc hình học của trackgeq: tâm = track qua helper
   O1 `maskGeometryAtTrack`; P3 đợt 88 đã đo preview KHỚP render png
   (|Δcx| ≤ 0.0005).
3. Đo mới trong đợt này (spec trắng, mask w=0.4 h=0.5 feather 0, track
   0.3→0.7, §5): **preview khớp cả 2 mode render** — xem bảng dưới.
4. Thêm cờ preview sẽ làm preview lệch khỏi render thật (png) mà user nhận
   được — có hại cho WYSIWYG. Lệch duy nhất còn lại là case mask có
   keyframes w/h (trackgeq đóng băng w/h tĩnh) — giới hạn đã biết, parent
   quyết giữ nguyên ở LIMITS đợt 88 §3 mục 1; nay đo chính xác (xem §4.2).

Đã sửa comment stale ở `apps/web/src/preview.tsx:1794` (từng ghi sai "lệch
với render mặc định (png) vốn vẫn shift unit" — sai từ đợt 87 O2 khi render
png cũng bỏ shift D3 cho clip track+mask); comment mới ghi rõ quyết định đợt
89 Q3 + lý do không thêm cờ. Không đổi hành vi. `tsc --noEmit`: **0 lỗi**.
`npx vite build`: **pass** (26.81s).

### 4.1 Spec không keyframes (section P + CDP probe)

Render (720p 3s, đo bằng pixel thật): trackgeq 35.8s (2.51 fps) và png 9.2s
(9.78 fps) đều cho cx = **512/640/768 đúng tuyệt đối** ở t=0.5/1/1.5, bề rộng
512px (x0 257/385/513 trackgeq; 256/385/513 png — lệch 1px do tâm pixel).

Preview CDP (`probe88p3-mask-track-parity.cdp.mjs`, pause, threshold 128,
canvas 872×276, scale 0.38333): cx = 0.4007/0.5007/0.6008 → **512.9/640.9/
769.0 px**; w50 = 505.2/505.5/505.8 px.

→ |Δcx| preview–render ≈ **+0.9/+0.9/+1.0 px**, hệ thống, cùng chiều — đúng
mức lệch pixel-center của canvas preview (1 canvas px = 2.6 project px),
không phải lệch hình học. w50 preview ≈ 505–506 vs render 512: trong độ phân
giải đo của probe (cạnh ±2.6px mỗi bên). **Preview khớp cả trackgeq lẫn png
khi không có keyframes.**

### 4.2 Spec có keyframes w/h (giới hạn đã biết — nay đo cả 2 phía)

Spec: mask keyframes w 0.2→0.6, h 0.3→0.7 (t=0→2), track 0.3→0.7.

- Preview CDP: cx = 0.4009/0.5007/0.6008 → **512.9/640.9/769.0** (khớp render
  như case không keyframes); w50 = **379.8/505.5/636.3** (≈384/512/640 theo
  keyframes w=0.3/0.4/0.5); y-range 0.3043–0.6993 / 0.2536–0.75 /
  0.2029–0.8007 (≈h keyframes 0.4/0.5/0.6).
- Render trackgeq (40.7s, đo pixel thật): cx = **512/640/768**; bbox x
  257–767 / 385–895 / 513–1024 (rộng 511px), y 181–539 (cao 359px) ở **cả 3
  mốc** — **w/h đóng băng ở giá trị tĩnh w=0.4/h=0.5, không theo keyframes**.

→ Với mask có keyframes w/h: tâm vẫn khớp (|Δcx| ≈ 1px) nhưng **kích thước
lệch: Δw = −131/0/+125 px và Δh tới ±0.1 (phần project) ở t=0.5/1/1.5**
(Δw=0 đúng ở t=1 vì keyframes cắt đúng giá trị tĩnh). Đây là giới hạn đã
biết của trackgeq (đóng băng w/h tĩnh), không phải lỗi preview. Preview
hiển thị đúng keyframes; render trackgeq là phía lệch. Giữ nguyên theo quyết
định LIMITS đợt 88 §3 mục 1 (không sửa trackgeq trong đợt này).

## 5. Test khóa các case

- `server/render/src/test_round89_q3_trackgeq_complete.js` (mới, 439 dòng):
  sections C1/C2/C3/C4/T1/T2/T3/T4/P. T1–T4: **8 pass, 0 fail mỗi section**;
  P: **14 pass, 0 fail**. Chạy: `node src/test_round89_q3_trackgeq_complete.js
  [c1|c2|c3|c4|t1|t2|t3|t4|p|all]`.
- `server/render/src/test_round87_o3_mask_track_geq.js` (tái tạo + nâng cấp):
  retry EPERM 12×30s cho run()/render() + `writeFileEpermRetry` 12×30s cho
  ghi spec/measure.py; selector section `a|ac|d|e|de|all`. Nội dung đo (assert,
  kỳ vọng, ngưỡng) giữ nguyên bản gốc đợt 87.
- `apps/web/src/preview.tsx`: chỉ sửa comment (không đổi hành vi).
- `tsc --noEmit`: 0 lỗi. `npx vite build`: pass (26.81s).

## 6. Chưa đo / nợ còn lại

- O3 chưa hoàn thành trong một lần chạy duy nhất ở 2 lần thử đầu (chết do
  sóng EPERM) — nhưng lần chạy `all` sau reboot đã xanh 21/21 (xem §1).
  Harness nay có retry EPERM 12×30s cho mọi bước.
- Transition chỉ đo wipeleft + slideleft; chưa đo các loại khác (fade đã đo
  đợt trước; crosszoom/iris… chưa đo).
- Compound chỉ đo trim/speed ở cửa sổ nested với track; chưa đo compound có
  karaoke/volumeKeyframes (cùng fail-fast path, chưa verify riêng).
- Preview–render parity chỉ đo ở chế độ pause; chưa đo khi đang phát
  (motion blur) cho trackgeq.
- Mask keyframes w/h + trackgeq: lệch kích thước đã đo (§4.2), giữ nguyên
  theo quyết định đợt 88 — chưa có fix.
- Media tạm `apps/web/public/white720-q3.mp4` đã xóa sau khi đo xong, KHÔNG stage.

## 7. Môi trường: sóng EPERM, reboot VM, sự cố file 0-byte

- Sóng EPERM 1: ~11:55–12:12Z (~17 phút). Khoảng lặng 12:12–12:21Z. Sóng 2:
  ~12:21–12:55Z (~34 phút). Trong sóng, mọi lệnh ghi từ exec đều fail
  "Operation not permitted" (python write, dd 0 byte, ffmpeg frame write,
  `echo >> log`); chỉ ghi qua tool runtime (muse.write/edit) là không dính.
- **VM reboot lần 2 ~13:21Z** (uptime 1 phút lúc 13:22): /tmp bị xoá sạch —
  mất log watcher/O3-de/Q3-all, spec CDP, script watcher. File bền vững còn
  nguyên (harness O3/Q3, preview.tsx, media). Các số C1–C4/T1 (chạy trước
  reboot) được ghi lại từ output đã đọc trong phiên; T1–T4/P đã chạy lại sau
  reboot với log đầy đủ. Sau reboot ghi OK 3/3, RAM khả dụng ~1.35 GB.
- **Sự cố file 0-byte (12:44Z, lỗi của chính luồng này):** script python đổi
  budget retry bằng `open(f,"w")` từ exec đã truncate harness O3 thành 0
  byte rồi write dính EPERM — file gốc mất (không .git, không bản copy).
  Đã tái tạo toàn bộ từ bản đọc đầu phiên + các edit đã làm (321 dòng,
  `node --check` OK, nội dung đo giữ nguyên). Bài học: KHÔNG dùng
  `open(f,"w")` từ exec khi đang có sóng; mọi sửa file dùng muse.edit/
  muse.write.
- 2 fail T1 ban đầu là **lỗi kỳ vọng của harness, không phải lỗi product**:
  (a) đo B ở t=5.0 ra n=0 vì unit merge dài 5s, D=6s nên 1s cuối là nền đen
  — đã sửa thành t=4.9; (b) mép phải đỏ ở t=2.2 đo 1025 thay vì 1011 vì đuôi
  feather (~+14px) chạm biên wipe 1024 — đã sửa kỳ vọng thành x1≈1024 ±8.
  Sau sửa: T1 **8 pass, 0 fail**.
- Tốc độ render trackgeq 720p trong phiên: 0.33–2.51 fps tùy tải VM (các
  luồng round 89 khác chạy song song); png 3.29–9.78 fps.
- Vite dev chạy ở 127.0.0.1:5173 (khởi động lại sau reboot cho CDP probe);
  CDP probe dùng port 9227.

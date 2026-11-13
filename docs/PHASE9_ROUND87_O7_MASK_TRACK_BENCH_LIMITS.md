# PHASE9_ROUND87_O7 — Mask bám motion track: benchmark hiệu năng

> **Đo thật, không sửa production.** Mọi số trong file này đều đo bằng render /
> preview thật trên VM test ngày 11/11/2026. Không có số ước tính, không lấy số
> của luồng khác. Chi tiết thô: `benchmarks/results/round87-o7-mask-track.json`
> (render + sinh video mask) và `benchmarks/results/preview-fps-r87-o7-{control,
> static, tracked}.json` (preview FPS). Script đo:
> `benchmarks/render/bench_round87_o7_mask_track.js` → đổi tên `.cjs` (repo root
> là ESM, xem §7).

## 0. Phạm vi đo — đọc trước để khỏi trích sai

**"Tracked mask" ở đây đo bằng đường mask-video keyframe D4 có sẵn**
(`mask_anim.py` → video ffv1 gray → `movie+blend+alphamerge` trong
`buildMaskAnimChain`), với keyframes tay x 0.2 → 0.8 mô phỏng quỹ đạo track.
Lúc O7 chạy (sáng 11/11), **luồng O2 (đường mask-video theo track thật) chưa
stage gì** — không có file round87 nào trên đĩa lúc bắt đầu đợt — nên O7
**không đo được mask bám track thật từ output của O2**. Điều này vẫn đúng
cho kết luận hiệu năng vì: video mask được **tiền sinh hoàn toàn** trước khi
render; chi phí render + chi phí sinh video mask chỉ phụ thuộc vào
(hình học mask, số frame, độ phân giải), **không phụ thuộc keyframe đến từ
tay hay từ track**. O2 chỉ đổi *nguồn* keyframe, không đổi đường render.
Cái O7 chưa đo (và không claim): độ chính xác bám của track, chi phí *chạy
track* (OpenCV template/MIL) — đó là việc của O2/O3, không phải O7.

## 1. Điều kiện đo

| Hạng mục | Giá trị |
|---|---|
| Ngày đo | 11/11/2026, ~05:47–06:05 UTC (12:47–13:05 +07) |
| CPU lúc đo | **AMD EPYC 9D25**, 4 vCPU (xem §6: host lại đổi so với nhãn 9D64 ngày 10/11) |
| RAM | 7.934 MiB tổng; khả dụng lúc đo **~650–1.200 MiB** (VM vừa reboot, 9 luồng đợt 87 khác đang chạy) |
| GPU | Không có |
| FFmpeg | 8.1.2; Node v24.22.1; Chromium headless 1254 (preview) |
| Clip render | testsrc2 1280×720, 30 fps, 5 s = 150 frame, veryfast/CRF23, `render.js` thật |
| Mask | rect, w=0,4 h=0,4, feather=0,2; tracked: keyframes x 0,2 → 0,8 (t=0 → t=5) |
| Chạy | TUẦN TỰ, 1 render/lần; loadavg + RAM ghi kèm mỗi lần đo |

Load VM trong lúc đo: **3,7 → 9,1** (9 luồng đợt 87 khác chạy song song).
Số tuyệt đối vì thế **nhiễu mạnh** — xem §5. Chỉ tỉ lệ/hướng so sánh trong
cùng một lượt đo mới tương đối ổn định.

## 2. (a) Render fps — mask tĩnh PNG vs tĩnh geq vs tracked mask

Cùng clip, cùng shape (rect w=0,4 h=0,4 feather=0,2), 150 frame, fps = 150 / wall.

| Arm | n | Wall (s) | FPS | Ghi chú |
|---|---|---|---|---|
| B0 baseline (không mask) | 2 | 3,64 / 3,61 | **41,20 / 41,57** | đối chứng |
| B1 mask tĩnh, `--mask-mode png` | 2 | 4,41 / 4,30 | **34,01 / 34,84** | PNG vẽ 1 lần, loop vô hạn |
| B2 mask tĩnh, `--mask-mode geq` | 2 | 35,05 / 31,06 | **4,28 / 4,83** | geq từng pixel mỗi frame |
| B3 tracked mask (video mask D4) | 2 | 13,79 / 7,93 | **10,87 / 18,91** | gồm ~4,2 s sinh video mask (§3) |
| B4 tracked + denoise 0,5 | 1 | 9,18 | **16,34** | |
| B5 tracked + stabilize smoothing 10 | 1 | 13,57 | **11,05** | vidstab 2-pass |

Đọc đúng:

- **Tracked nhanh hơn geq ~2,4–4,4×** (10,87–18,91 vs 4,28–4,83 fps) và
  **chậm hơn mask tĩnh PNG ~2–3×** (34–35 fps). Phần lớn khoảng chậm so với
  PNG tĩnh là chi phí sinh video mask (~4,2 s, §3) + decode video mask qua
  `movie` trong graph — tách gần đúng: wall B3 trừ gen độc lập ≈ 9,6 s /
  3,7 s phần encode+decode (ước tính, gen trong render không được tách giờ
  riêng — đừng trích như số đo trực tiếp).
- **B3 dao động 74% giữa 2 lần lặp** (10,87 → 18,91 fps, load lúc đo 8,4–9,1)
  — đây là nhiễu tải VM, không phải đặc tính của mask. Đừng trích một số
  duy nhất cho tracked mask; khoảng 11–19 fps trên VM tải nặng này mới là
  con số trung thực.
- **B2 (geq) nhanh hơn hẳn baseline Phase 8 (0,97 fps, §7.1):** 4,28–4,83 fps
  ở đây. Khác máy (4 vCPU 9D25 thay cho 2 vCPU 7D13) + khác tải → **không so
  trực tiếp số tuyệt đối**. Hướng thì không đổi: geq vẫn là đường chậm nhất,
  chậm hơn PNG tĩnh ~8× trên cùng lượt đo này.
- **B4 (tracked + denoise) không chậm hơn B3** (16,34 vs 10,87–18,91 fps, n=1).
  Phù hợp phát hiện §9.1: trên testsrc2 nhiễu, hqdn3d khử nhiễu trước nên
  encoder nhẹ việc hơn chi phí filter. **Đừng kết luận "denoise miễn phí"** —
  n=1, tải VM khác nhau giữa các lần đo; trên nền phẳng + nhiễu thì denoise
  chậm hơn đối chứng (§9.1). Cần n≥2 mới kết luận.
- **B5 (tracked + stabilize) 11,05 fps, n=1** — cùng bậc với B3, không sụp.
  Vidstab 2-pass trên clip 5 s này không phải điểm nghẽn chính (mask video
  gen + encode mới là). Chưa đo stabilize trên clip dài / 1080p.

Kiểm chứng frame thật (numpy, so sánh frame PNG trích từ mp4 output):

| So sánh | mean | max | % pixel lệch >8 | Kết luận |
|---|---|---|---|---|
| tracked@2,5 vs static-png@2,5 (cùng hình học x=0,5) | 0,234 | 82 | 0,489% | **Khớp** — quỹ đạo đi qua đúng tâm lúc giữa clip |
| tracked@0,2 vs tracked@4,8 | 40,65 | 255 | 21,465% | **Mask di chuyển rõ** theo quỹ đạo |
| static png@2,5 vs static geq@2,5 (kiểm lại R2) | 0,251 | 115 | 0,464% | png ≈ geq (khớp R2) |

## 3. (b) Chi phí sinh video mask (`mask_anim.py` trực tiếp)

Vẽ từng frame PNG bằng PIL (`mask_png.render`) rồi encode ffv1 gray.
n=1 mỗi cấu hình (chi phí tuyến tính theo frame, xem dưới).

| Cấu hình | Frame | Wall | s/frame | .mkv tạm |
|---|---|---|---|---|
| 720p, 2 s, 2 keyframe | 60 | 1,79 s | 0,0298 | 530.021 B |
| 720p, 5 s, 2 keyframe | 150 | 4,21 s | 0,0281 | 1.326.129 B |
| 720p, 5 s, **11 keyframe** (mỗi 0,5 s, mô phỏng track dày) | 150 | 3,88 s | 0,0259 | 1.326.139 B |
| 720p, 10 s, 2 keyframe | 300 | 7,57 s | 0,0252 | 2.649.901 B |
| 1080p, 5 s, 2 keyframe | 150 | 9,99 s | 0,0666 | 3.013.114 B |

- **Chi phí tuyến tính theo số frame, ~0,025–0,030 s/frame ở 720p**
  (60 → 150 → 300 frame: 1,79 → 4,21 → 7,57 s). 1080p đắt hơn ~2,4×
  mỗi frame (0,0666 s/frame — gần đúng tỉ lệ số pixel 2,25×).
- **Mật độ keyframe không ảnh hưởng chi phí:** 11 keyframe (3,88 s) ≈
  2 keyframe (4,21 s) trên cùng 150 frame — chênh trong nhiễu tải VM.
  Track dày (keyframe mỗi frame) cũng không đắt hơn đáng kể vì nội suy
  là phép tính rẻ; chi phí nằm ở vẽ + encode từng frame. (Chưa đo keyframe
  mỗi frame thật — track 30 fps × 5 s = 150 keyframe; theo cơ chế thì
  tương đương, nhưng chưa có số.)
- **Dung lượng tạm nhỏ:** 1 frame PNG tạm 720p = 2.204 B, 1080p = 3.940 B
  (mask 2 màu, nén tốt) → đĩa tạm ≈ 331 KB (720p 150 frame) / 591 KB
  (1080p 150 frame), **xoá sau khi encode xong**. Video .mkv ffv1:
  ~8,8 KB/frame (720p), ~20 KB/frame (1080p) — clip 60 s 720p ≈ 16 MB tạm.
- **Video mask sinh lại mỗi lần render** (file tạm trong `os.tmpdir()`,
  dedup chỉ trong 1 lần render qua `maskAnimKey`). Render lại cùng spec =
  sinh lại ~4,2 s cho clip 5 s 720p. Cache video mask qua các lần render là
  hướng tối ưu rõ ràng nhưng **chưa làm, chưa đo**.

## 4. (c) Preview FPS khi preview clip có tracked mask — ĐÃ ĐO ĐƯỢC

Harness có sẵn trong repo: `apps/web/scripts/bench-preview-fps.mjs`
(`--serve` tự chạy vite dev, Chromium headless 1254, viewport 1440×900,
canvas preview 872×276, dpr=1, cửa sổ đo 6 s sau warmup 1 s).
Project mẫu "Dự án mẫu" (2 video webm 640×360 + 1 text, 8 s); cửa sổ đo
nằm trong clip đầu (mau-1.webm, 0–4 s) ở cả 3 arm — playhead chỉ tiến
~2,5 s trong 6 s wall ở cả 3 lần (decode-bound trên VM, xem caveat).
Seed tracked/static: sửa autosave đã dump, `seedLoaded=true` cả 2 lần.

| Arm (cùng project, cùng clip) | n | FPS trung bình | Frame | p50 frame | p95 frame | Giật >50 ms | CPU Chrome |
|---|---|---|---|---|---|---|---|
| Control: không mask | 1 | **21,48** | 130 | 40,1 ms | 91,2 ms | 41 | 64,5% |
| Static mask (rect x=0,5) | 1 | **13,15** | 80 | 75,5 ms | 184,7 ms | 62 | 76,2% |
| Tracked mask (x 0,2→0,8, 4 s) | 1 | **15,15** | 92 | 74,7 ms | 108,6 ms | 70 | 80,1% |

Đọc đúng:

- **Tracked ≈ static trong preview** (15,15 vs 13,15 fps; p50 gần như
  giống hệt 74,7 vs 75,5 ms) — chênh trong nhiễu chạy-lặp của VM (xem §5
  đã ghi phương sai lớn). **Việc bám track gần như không tốn thêm gì ở
  preview:** nội suy hình học (`interpolateMaskAt`) là vài phép tính số
  học; cái đắt là vòng lặp alpha từng pixel (`maskAlphaAt`,
  `previewEngine.ts:1189`) mà mask tĩnh cũng phải trả.
- **Cái mask tự nó tốn ~30–40% FPS preview** so với không mask (21,48 →
  13–15 fps; p50 40 → ~75 ms; CPU Chrome 64,5% → 76–80%). Cơ chế: preview
  áp mask bằng vòng lặp JS từng pixel trên canvas (không dùng GPU /
  `ctx.filter`). Đây là điểm nghẽn preview của mask nói chung — không
  riêng tracked mask — và là hướng tối ưu tiếp theo nếu cần (mask bằng
  canvas compositing thay cho vòng lặp pixel).
- **Caveat lớn — n=1 mỗi arm.** §5 đã chứng minh cùng project vừa trên
  cùng VM cho 1,43 / 4,09 / 4,59 fps ở 3 lần chạy. Ba số 21,48 / 13,15 /
  15,15 ở đây **không được trích như số ổn định**; chỉ hướng "tracked ≈
  static < không mask" là có cơ chế đỡ lưng (p50 gần trùng nhau) và đáng
  tin hơn số tuyệt đối. Cần n≥3 mỗi arm mới kết luận chặt.
- Playhead chỉ tiến ~2,5 s / 6 s wall ở cả 3 arm: rAF vẫn tick 13–21 fps
  nhưng **video phát chậm hơn realtime** trên VM này — FPS rAF không đồng
  nghĩa phát mượt. Đừng trích "preview 15 fps" thành "xem được 15 fps".

## 5. Độ tin cậy / nhiễu

- Render B3 dao động 74% giữa 2 lần lặp (load 8,4–9,1). Preview n=1/arm.
  Số tuyệt đối chỉ có ý nghĩa trong lượt đo này, trên VM tải nặng này.
- CPU host lại đổi (xem §6) — không so số tuyệt đối với §7.1 (2 vCPU 7D13)
  hay §9 (thế hệ 2) ngoài tỉ lệ trong cùng lượt.
- testsrc2 là nguồn tổng hợp (chi tiết cao, nén tốt sau mask); footage
  thật sẽ khác — đặc biệt denoise (B4) và kích thước output.
- Chỉ đo rect, feather 0,2. Ellipse chưa đo (biểu thức geq ellipse nặng
  hơn rect; đường video mask thì chi phí vẽ ellipse ≈ rect — chưa có số).
- Chỉ đo 720p render, 5 s. 1080p render tracked / clip dài chưa đo
  (chỉ có gen 1080p ở §3).
- Không đo chi phí chạy track (OpenCV) — ngoài phạm vi O7.

## 6. Nhãn máy — host lại đổi (đính chính)

`RESULTS.md` ghi thế hệ 4 (từ 10/11) là **EPYC 9D64**. Lúc O7 đo sáng
11/11, `/proc/cpuinfo` lại là **AMD EPYC 9D25** (cùng model với thế hệ 3
ngày 08–09/11). VM đã đổi host lần nữa trong đêm 10 → 11/11. Mọi số trong
file này ghi nhãn **9D25, 4 vCPU, 7,7 GB, đo 11/11** theo lúc đo — đừng
gộp với số 9D64 ngày 10/11 theo số tuyệt đối. Đã ghi đính chính vào
`RESULTS.md` (§ nhãn máy + §10).

## 7. Sự cố / ghi chú vận hành

- Script đo ban đầu viết `.js` thì Node báo `require is not defined`
  (repo root `package.json` có `"type": "module"`) — đổi sang `.cjs`,
  không đổi nội dung đo.
- RAM khả dụng lúc đầu đợt chỉ ~464 MiB (ghi trong task), lúc đo thực tế
  648–1.200 MiB — đủ cho render 720p tuần tự + Chromium headless; không
  gặp OOM. Không chạy song song (đúng luật task).
- Không đụng TTS 39, không đụng file workflow, không push (chỉ stage).

## 8. Kết luận (1 đoạn)

Tracked mask render ở mức **~11–19 fps cho clip 720p 5 s** trên VM 4 vCPU
tải nặng này — nhanh hơn geq tĩnh ~2,4–4,4×, chậm hơn PNG tĩnh ~2–3×
(chủ yếu do sinh video mask ~0,028 s/frame + decode video mask); sinh
video mask rẻ, tuyến tính theo frame, không nhạy mật độ keyframe; ở
preview, tracked mask **không đắt hơn** static mask (cùng ~13–15 fps vs
21,5 fps không mask — cái đắt là vòng lặp alpha từng pixel của mask nói
chung). Nợ mở: lặp lại preview n≥3, render 1080p tracked, ellipse,
clip dài, cache video mask qua các lần render, chi phí chạy track thật
(O2/O3).

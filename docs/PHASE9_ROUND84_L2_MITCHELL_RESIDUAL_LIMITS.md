# PHASE 9 — ĐỢT 84, LUỒNG L2: PHẦN DƯ MITCHELL (ĐÓNG NỢ K2 §7)

Ngày: 11/11/2026. Repo: `vectornewsai-cmyk/repo-1` (bản local `~/workspace/repo-1`, HEAD GitHub vẫn `5f548ef8`).
Phạm vi: đóng 6 nợ của K2 đợt 83 (`docs/PHASE9_ROUND83_K2_KERNEL_MITCHELL_AB_LIMITS.md` §7).
**Không sửa production, không push, không release/tag, không binary, không workflow.**
Bằng chứng: `hidden_files/round84-l2/` (JSON + log headed + media probe).

## 1. Kết luận (ngắn)

1. **Phần dư delta sqw4 (~2,5–2,8 MAD) — ĐÃ TÌM RA CƠ CHẾ, ĐÓNG.** Nó KHÔNG phải base-mismatch,
   KHÔNG phải kernel, KHÔNG phải gain/phase/blur tuyến tính. Cơ chế: đường plain của preview vẽ
   **video element trực tiếp dưới CTM** (`renderFrame`: `setTransform(vp.scale)` rồi
   `drawImage(video, 0,0,W,H)`, quality `"high"`), và **toán tử resample của nguồn video khác
   Mitchell** — tái tạo đúng hình học editor (scale 1,2638889, offX 271,0556) thì khớp snapshot
   plain tới **MAD 0,015–0,019** (mức làm tròn). Base VÔ TỘI: frame video Chrome giải mã ở
   native size **byte-identical với frame render** (MAD 0,000). Phần dư delta r ≈ −0,85·p_Mit + e
   là hệ quả cấu trúc: đường sharp đi qua effect canvas (≈ Mitchell), đường plain đi qua toán
   tử video — trừ chéo hai toán tử khác nhau thì −p_Mit hiện ra; e còn lại (~1,3–1,5 MAD) là
   chênh applySharpen-vs-ffmpeg-unsharp (clip chiếm đa số ở sharp10).
2. **Mitchell thắng mọi thang đã đo.** Thang ~2 sạch (ocean640, s=2,2639, không nhiễm downscale):
   delta tổng **Mitchell 2,303 < BC 2,346 < triangle 2,791** (sharp05 1,078/1,087/1,246;
   sharp10 1,225/1,259/1,545; cả ba KHỚP). Plain tuyệt đối ~5,3 cho cả ba kernel — bị chi phối
   bởi chênh toán tử video (mục 1), không xếp hạng được kernel ở thang này.
3. **Noise dưới Mitchell ở s=1,132: 6/6 KHỚP-THỐNG-KÊ** (trích từ `r78f6-analysis.json`,
   phương pháp `bc0.333-0.333`); Δcorr của Mitchell nhỏ nhất trong ba kernel. **MỚI: ở s≈2,26,
   noise G12 LỆCH-THỐNG-KÊ với CẢ BA kernel** (Δcorr R +0,126–0,136 / B +0,145–0,153 > 0,12;
   std/kurt vẫn đạt dưới Mitchell/BC) — nợ mới, xem §5.
4. **Lỗi nhãn K2 đã sửa** (`r83k2-mitchell-ab.mjs`: note "s=1,264" → "s=2,264 NHIỄM downscale
   nội bộ 1280→640"); chỉ sửa nhãn, không chạy lại A/B (số JSON/log dùng `rect.scale` nên đúng).
5. **Không có thay đổi production nào từ luồng này.** Quyết định K2 (Mitchell (1/3,1/3) làm kernel
   upscale) đứng vững; phần dư là khoảng cách MÔ HÌNH–preview, không phải lỗi sản phẩm.

## 2. Cơ chế phần dư (nhiệm vụ 1) — chuỗi bằng chứng

Nguồn: `r84l2-mitchell-residual.json`, `r84l2-base-probe.json`, `r84l2-ctm-probe.json`,
`r84l2-ctm-probe-analysis.json`. Nội dung sqw4/sqw8 (test-pattern), 2 run (D: 640, A2: 1280).

### 2.1 Base vô tội (B-probe, headed Chromium 1254)

Trang tối giản (không qua editor): `<video>` sqw4-640.mp4 (640×360 native) và sqw4-1280.mp4,
seek 1,0 s, `drawImage(video)` → canvas native-size → `getImageData` (B).
**B = R byte-identical: MAD 0,000, le8 1,0000, max 0** (cả hai run; frame 0 = frame 30 của
video tĩnh cũng MAD 0,000). Mọi giả thuyết "base lệch" (decode, ma trận bt601/bt709, chroma)
đều chết tại đây — p_Mit (MAD 2,44, không màu, mean ≈ 0) được tạo RA SAU frame video,
trong đường vẽ của preview.

### 2.2 Các giả thuyết đã loại (offline, tái tạo đúng số K2)

- **Kernel trực tiếp:** tri/BC/Mitchell/mip-trilinear (`resamplePlaneTrilinear` production)
  đều không khớp plain: sqw4-640 plain MAD tri 1,04 / Mit 2,44 / BC 2,65; mip-trilinear
  ≡ Mitchell (1,219–2,475 giống hệt số Mitchell) — LOD chọn level 0 ở các thang này.
- **Dịch nguyên (dx,dy):** quét −2..+2 trên cả hai run/kênh: tối thiểu rõ ràng ở (0,0)
  (Mit 2,466; tri 1,05); dịch ±1 px tệ hơn 6–14×. Hình học đúng.
- **Linear-sharpen khuếch đại base-mismatch (I3 E8, dạng tuyến tính): BÁC.** Hồi quy
  r vs p_Mit: gain **−0,856 / −0,805** (sharp05/10), corr −0,828/−0,799, varExp 0,658/0,636,
  MAD sau fit 1,448/1,255. Gain ÂM và KHÔNG tỉ lệ với amount (0,5→1,0 phải gấp đôi nếu tuyến
  tính); dự đoán r̂ = amount·highpass(p_Mit) làm MAD TỆ hơn (2,764→3,559; 2,538→4,373).
  Hồi quy r vs model-delta: gain 0,026/0,015 — không phải lỗi gain toàn cục.
- **Nhiễm downscale nội bộ (H3 run D): CHẾT.** sqw4-640.mp4 sinh NATIVE 640×360 (không
  downscale), và run A2 (1280, không thể nhiễm) cho cùng mẫu số.

### 2.3 Toán tử video — tái tạo đúng đường preview (CTM probe, headed)

Ma trận đo: nguồn {video, canvas} × quality {high, medium, low} × cách vẽ {CTM, explicit},
hình học đúng editor (canvas 1351×455 / 1991×815, scale 1,2638889 / 1,1319444).

| dump (sqw4-640) | vs snap_plain | vs Mitchell(R) |
|---|---|---|
| **CTM + offX 271,0556 + video, high** | **MAD 0,015, le8 1,0, max 8** | 2,456 |
| CTM + offX 271 + video, high | 0,682 | 2,325 |
| CTM + offX 270,5556 + video, high | 6,387 | 7,594 |
| explicit + video, high/medium/low | 0,341 | 2,352 |
| explicit + canvas, high | 2,441 | **0,000** |
| CTM + offX 271,0556 + canvas, high | 2,378 | 0,396 |
| CTM + offX 271 + canvas, high | 2,335 | 0,688 |

sqw4-1280 cho cùng mẫu: CTM + offX 271,0556 + video **MAD 0,019**; explicit + canvas, high
≡ Mitchell (0,001). Kết luận:

- **Đường plain thật = drawImage(video) dưới CTM với offX PHÂN SỐ** (`(cw − W·scale)/2`,
  cw=1351 → 271,0556; cw=1350 → 270,5556 cho MAD 6,4 — phân biệt dứt khoát, nên cw=1351).
  Chỉ sai offX 0,5 px đã hỏng (MAD 6,4) — đúng tính nhạy pha của sóng vuông 4 px.
- **Nguồn video resample KHÁC nguồn canvas, không phụ thuộc quality:** video cho cùng kết
  quả ở high/medium/low (0,341 explicit; 0,682 CTM-offX-nguyên); canvas thì high ≡ Mitchell
  chính xác (J2 xác nhận lại), medium ở giữa (≈ triangle), low ≡ toán tử video.
- Đường CTM cũng lệch khỏi đường explicit ngay cả với canvas (0,396–0,449 vs Mitchell):
  CTM là một toán tử riêng, không phải chỉ là explicit đổi tọa độ.

### 2.4 Toán tử video là gì? (fit offline — chưa đóng hẳn)

So với dump video (explicit-high-video), các kernel trực tiếp (h=1, cắt ở |x|≤1,5 rồi chuẩn
hóa lại — cùng quy ước K2): triangle 0,963/0,986; Mitchell 2,352/2,381; BC 2,557/2,617;
Catmull-Rom 3,849/3,933; B-spline 5,082/5,072; Lanczos-2 3,945/3,979; Lanczos-3 7,092/7,173;
triangle kéo giãn h=0,9/1,1 tệ hơn (1,66–1,79); triangle + blur nhị thức tệ hẳn (8,67).
**Tốt nhất: triangle với lệch pha δ=−0,03 px nguồn: MAD 0,495/0,490** (δ=0: 0,963; δ=−0,05:
0,70; δ=−0,08: 1,57). Còn cách sàn 0,34 — danh tính chính xác của toán tử video vẫn mở
(ứng viên: bilinear điểm cố định kiểu libyuv, hoặc kernel bất đối xứng; xem §6).

### 2.5 Phân rã phần dư delta (kết quả `r84l2-mitchell-residual.json`)

r = dp_prev − Mit(d_render), kênh R, sqw4-640: sharp05 MAD 2,764 (mean +1,023, RMS 3,633);
sharp10 MAD 2,538 (mean +0,289). r hoàn toàn không màu (MAD R=G=B bằng nhau).
- **Clip:** sharp10: clip 49,4%, clipMad 3,859 vs noclipMad 1,274 (sqw4-640); sqw8 sharp10:
  clip 24,7%, 3,835 vs 0,526. Clip giải thích phần lớn phần dư sharp10 (khớp cơ chế clamp
  trong `applySharpen`: clamp ở không gian Y limited-range trước khi tính delta).
- **Sharp05 (clip ~0,1%):** phần dư khóa theo cạnh — pixel delta-active (|dr|>8, 0,79%)
  MAD 3,070 vs flat 1,622 (sqw4-640); sqw8: 3,210 vs 0,332.
- Sau fit 2 biến tốt nhất, phần dư còn 1,66–1,83 MAD (sqw4) — trên sàn làm tròn 0,5.
- **Giải thích cấu trúc:** dp_prev = CTMcanvas(S1(B)) − CTMvideo(B); model delta =
  Mit(S2(R)) − Mit(R); B=R nên r ≈ [CTMcanvas(S1) − Mit(S2)] − p_Mit. Số hạng −p_Mit là
  chênh toán tử đường plain; số hạng đầu là chênh applySharpen-vs-ffmpeg-unsharp + lệch
  CTM-canvas khỏi Mitchell (~0,4 MAD). Hồi quy gain −0,85 (không phải −1,0) + e còn lại là
  do hai số hạng này tương quan một phần qua cạnh — không còn mâu thuẫn với lý thuyết
  unsharp tuyến tính nữa, vì p_Mit không phải là "base" mà là chênh toán tử.

## 3. Thang ~2 sạch trên nội dung tự nhiên (nhiệm vụ 2)

Headed 4/4 PASS (D1 plain 2× pixel-identical, D2 noise05 2× pixel-identical, D3 cùng-khung
hash `bda2cfb4` ct=1, H9 0 lỗi trang). Ocean640 native 640×360, project 640×360, cửa sổ
2560×1440 → rect 1449×815, **s=2,2639**, nguồn `ocean640-crf10.mp4` (sàn codec vs fullrgb
bt709: MAD 0,869/le8 0,9999/max 14; bản crf18 là 1,930 — đã dùng crf10).
Phân tích: `r84l2-clean-scale2-analysis.json` (tri/BC/Mitchell 2-pass độc lập + máy noise F6).

| metric (s=2,2639, ocean) | triangle | BC (0,25, 0,375) | Mitchell (1/3, 1/3) |
|---|---|---|---|
| plain tuyệt đối MAD | 5,318 | 5,350 | 5,340 |
| delta sharp05 MAD (KHỚP) | 1,246 | 1,087 | **1,078** |
| delta sharp10 MAD (KHỚP) | 1,545 | 1,259 | **1,225** |
| **tổng delta** | 2,791 | 2,346 | **2,303** |
| noise05 G12 | LỆCH | LỆCH | LỆCH |
| noise10 G12 | LỆCH | LỆCH | LỆCH |

- **Mitchell thắng delta ở thang ~2:** tổng 2,303, hơn BC 1,8%, hơn triangle 17%. Cùng với
  K2 (s=1,13–1,26: Mitchell thắng BC 15/18 ca delta test-pattern, tổng −1,3%): **Mitchell
  thắng mọi thang đã đo.**
- **Plain tuyệt đối ~5,3 cho cả ba kernel:** bị chi phối bởi chênh toán tử video trên nội
  dung tự nhiên nhiều HF (mục 2) — không xếp hạng được kernel; so với cửa sổ p640 nhiễm
  của F6 (tri 2,745/BC 2,699 ở s=1,264) thì số sạch ở s=2,264 lớn hơn vì thang lớn hơn
  khuếch đại chênh toán tử, không phải vì nhiễm.
- **Noise G12 ở s≈2,26 LỆCH với cả ba kernel** (Mitchell noise05: stdRatio [0,93, 1,18, 0,97],
  Δkurt R [0,02, 0,05, 0,11] đạt; **Δcorr R [0,131, 0,017, 0,150] — R và B vượt ngưỡng 0,12**;
  noise10 tương tự: Δcorr R [0,126, 0,020, 0,145]). Ở s=1,132 cùng máy này cho KHỚP
  (Δcorr ≤0,007) — chênh tương quan tăng theo thang. Cơ chế chưa tách (ứng viên: lệch
  CTM-canvas khỏi Mitchell tăng theo thang; chênh sinh noise). **Nợ mới — không phải hồi
  quy của K2** (K2 không đo noise ở thang ~2).

## 4. Noise Δkurt/Δcorr dưới Mitchell (nhiệm vụ 3)

Trích từ `hidden_files/round78-f6/r78f6-analysis.json`, phương pháp `bc0.333-0.333` (= Mitchell),
cửa sổ sạch w2560-p1280 (s=1,132), ngưỡng E9: |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12,
stdRatio ∈ [0,85, 1,18]. **6/6 KHỚP-THỐNG-KÊ:**

| nội dung | noise | Δkurt R | Δcorr R | stdRatio R |
|---|---|---|---|---|
| ocean | 05 | +0,12 | +0,002 | 0,99 |
| ocean | 10 | +0,21 | +0,003 | 0,98 |
| basgo | 05 | +0,14 | +0,007 | 1,00 |
| basgo | 10 | +0,11 | +0,003 | 1,00 |
| slovenska | 05 | +0,13 | +0,007 | 1,00 |
| slovenska | 10 | +0,20 | +0,004 | 1,01 |

Δcorr của Mitchell nhỏ nhất trong ba kernel (BC 0,014–0,025; tri 0,001–0,013); stdRatio
sát 1 nhất. **Thiếu:** noise test-pattern dưới `bc0.333-0.333` KHÔNG có trong file F6
(chỉ có tri/BC) — ghi nhận trung thực, không đo lại trong lượt này.

## 5. Nợ mở (sau đợt này)

1. **Danh tính toán tử resample nguồn video** (bound: triangle@phase−0,03 px, MAD 0,49;
   còn cách sàn 0,34): probe tiếp theo — đo đáp ứng xung trực tiếp (1 pixel/step qua
   `<video>`) và đối chiếu bilinear điểm cố định kiểu libyuv.
2. **Noise Δcorr ở thang ~2** (R/B +0,13–0,15, cả ba kernel; s=1,13 thì khớp): tách xem
   do lệch CTM-canvas khỏi Mitchell tăng theo thang hay do sinh noise — probe: dump noise
   qua CTM-canvas ở s≈2,26 so với mô hình Mitchell trên cùng B.
3. **Phần dư e sau −p_Mit (~1,3–1,5 MAD):** chênh applySharpen-vs-ffmpeg-unsharp; clip
   (sharp10) và cạnh (sharp05) đã tách — chưa có mô hình khớp từng pixel.
4. **lineart2px aliasing không đổi** (delta ~4,3 mọi kernel; nợ J7 từ K2, chưa chạm).
5. **Seek trong probe headed không chạy:** video phục vụ qua `python http.server` có
   `seekableEnd=0` (duration=4, readyState=4, currentTime kẹt 0) — dữ liệu vẫn đúng vì
   nội dung tĩnh (frame 0 = frame 30, MAD 0,000), nhưng probe sau cho nội dung động phải
   remux `-movflags +faststart` hoặc kiểm tra Range.
6. **Script phân tích B-probe (`r84l2-base-probe-analyze.mjs`) đã viết nhưng KHÔNG chạy:**
   B1/B3/B4 đã được trả lời bằng CTM probe chính xác hơn (B=R; CTM-video khớp snap) nên
   không chạy lại — script vẫn stage kèm chú thích này.
7. **Cạm bẫy ghi nhận:** (a) sau K2, `resampleRgb24Trilinear` KHÔNG còn là triangle thuần
   ở upscale (đã đọc Mitchell) — script đo phải dùng kernel 2-pass độc lập; (b) thang CTM
   phải lấy theo chiều thắng (`(ch−2·offY)/projH`), offX KHÔNG được làm tròn — sai 0,5 px
   là hỏng; (c) `chromeWeights1D(..., hOverride)` là độ kéo giãn, KHÔNG phải support của
   kernel — truyền 2 cho Mitchell sẽ kéo giãn kernel gấp đôi (đã mắc rồi sửa trong
   fit script, chỉ chạy ở /tmp).

## 6. Phạm vi & giới hạn đo

- Chỉ đo upscale đẳng hướng, nội dung grayscale test-pattern + 3 nội dung tự nhiên,
  Chrome 158 / Chromium 1254 trên VM này (SwiftShader/CPU, 4 vCPU EPYC 9D25).
- Mọi số MAD/le8/max ở trên đều là kênh R (hoặc trung bình 3 kênh khi R=G=B; phần dư đã
  kiểm là không màu). Delta tính trên float chưa làm tròn (quy ước I3 V0); model uint8
  theo K2.
- Headed run clean2: 4/4 PASS; B-probe + CTM probe: 3 lần chạy (lần 1 sai URL trang cũ —
  đã sửa và chạy lại; lần 2 thang CTM theo chiều rộng — đã sửa thành chiều cao; lần 3
  offX phân số — kết quả cuối).
- Không chạy lại A/B K2 (chỉ sửa nhãn); không đo lại noise F6 từ đầu (trích JSON có sẵn).

## 7. Tệp

Script (stage, text-only):
- `apps/web/scripts/r84l2-mitchell-residual.mjs` — phân rã phần dư (hồi quy/clip/profile)
- `apps/web/scripts/r84l2-base-probe-headed.mjs` — B-probe (frame video native)
- `apps/web/scripts/r84l2-base-probe-analyze.mjs` — phân tích B-probe (đã viết, chưa chạy — §5.6)
- `apps/web/scripts/r84l2-ctm-probe-headed.mjs` — CTM probe (ma trận nguồn×quality×cách vẽ + offX phân số)
- `apps/web/scripts/r84l2-ctm-probe-analyze.mjs` — phân tích CTM probe
- `apps/web/scripts/r84l2-clean-scale2-headed.mjs` — probe sạch thang ~2 (ocean640)
- `apps/web/scripts/r84l2-clean-scale2-analyze.mjs` — phân tích thang ~2 (tri/BC/Mitchell + noise G12)
- `apps/web/scripts/r83k2-mitchell-ab.mjs` — SỬA NHÃN (2 chỗ: header + note s=2,264)
- `docs/PHASE9_ROUND84_L2_MITCHELL_RESIDUAL_LIMITS.md` — tài liệu này

Bằng chứng (không stage, ở `hidden_files/round84-l2/`):
`r84l2-mitchell-residual.json`, `r84l2-base-probe.json`, `r84l2-ctm-probe.json`,
`r84l2-ctm-probe-analysis.json`, `r84l2-clean-scale2-analysis.json`,
`r84l2-headed-clean2.log`, `r84l2-base-probe.log`, `r84l2-ctm-probe*.log`,
`headed-w2560x1440-p640x360/` (snaps + report), `media/` (ocean640*.mp4, sqw4-*.mp4, probe html).

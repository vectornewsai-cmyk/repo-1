# PHASE9 ROUND83 K4 — Thí nghiệm codec VP9-vs-h264: kết quả + giới hạn

> Luồng K4, đợt 83 vòng lặp Phase 9 VCut Studio (lượt cron 00:35 +07,
> 11/11/2026). Nhiệm vụ: đóng nợ đợt 82 §4.4 — thí nghiệm codec
> VP9-vs-h264 mà J4 bị sóng EPERM cắt, chưa chạy (J4 LIMITS §3.5+§5).
> Test kiểm chứng: `node apps/web/scripts/test_round83_k4_vp9_vs_h264.mjs`
> — **ALL PASS (42/42)**.

## 0. Kết quả chính (headline — đọc phần này là đủ)

- **Codec KHÔNG làm lệch verdict. Nợ "codec không phải biến gây nhiễu"
  ĐÃ ĐÓNG.** Ở cùng bitrate + cùng tag màu, VP9 vs h264 cho
  |ΔresidStd_R| theo cặp chỉ **0,0025 (slov, n=10)** và **0,0055 (tp,
  n=10)** — nhỏ hơn ~400 lần so với lệch orig-vs-h264 (2,14) — và
  **0 lần lật verdict trong 40 cặp so sánh** (noD0 / fullD0 / R0 / G1 /
  G2 / G12, cả gate G1/G2/G12 đều 0 lần lật). Q4 = 0 ở cả 5 nhánh.
- **Giả thuyết (a) của J4 ở dạng "codec" đã BỊ BÁC.** Lệch lớn
  orig-vs-h264 (mean 2,1422) được tái lập gần như y hệt bởi đối chứng
  orig-vs-VP9-reenc (mean 2,1397; chênh 0,0025), trong khi
  VP9-reenc-vs-h264 chỉ 0,0025. Tức lệch thuộc về **re-encode và/hoặc
  tag màu** (webm gốc untagged vs bản transcode tag bt709), KHÔNG phải
  VP9-vs-h264. Bằng chứng độc lập ở tầng decode ffmpeg: MAD chéo
  orig-vs-reenc 1,7614 ≈ orig-vs-h264 1,8459, trong khi reenc-vs-h264
  chỉ 0,6436 (slov) / 0,2491 (tp).
- **Độ sắc cũng vậy:** tỉ số gradient preview/render ≈ 1,00 ở cả 4
  nhánh khớp bitrate/tag (h264 và VP9-reenc giống nhau tới 0,002);
  chỉ nhánh VP9-gốc là 0,93 (preview mềm hơn render ~7%) — lại là
  hiệu ứng của file gốc untagged, không phải codec.
- **Không sửa production.** Thí nghiệm chứng minh không cần sửa gì:
  không chuẩn hóa codec trong harness, không đổi luật gate. Hướng săn
  Q4 bằng "encode media bằng VP9" mà J4 đề xuất (§3.5) là **sai hướng**
  — Q4 cần nội dung untagged/re-encode-kiểu-gốc hoặc cơ chế khác, xem §5.
- Baseline tái lập: slov-vp9-orig residStd_R @w1920 = **2,9326** (F7:
  2,947; Δ=0,014) — chuỗi đo ổn định qua 2 đợt.

## 1. Thiết kế thí nghiệm (có kiểm soát)

Cùng nguồn, chỉ đổi codec. 5 nhánh, tất cả 1920×1080, 4 s, khung đo ở
t=1,0 s (slov @25fps → f25; tp @30fps → f30):

| Nhánh | Nguồn | Codec / encode | Bitrate đo được |
|---|---|---|---|
| slov-vp9-orig | slovenska.webm gốc (round67-u3) | VP9, **untagged** (color unknown) | 5.506.021 bps |
| slov-h264-1920 | transcode từ webm, **lệnh Y HỆT J4 §5** | libx264 crf 18, tag bt709, -g 25 | 8.243.094 bps |
| slov-vp9-1920 | transcode từ webm | libvpx-vp9 **2-pass, target = bitrate h264** (8243k), tag bt709, -g 25 | 8.227.886 bps (−0,18% vs target) |
| tp-h264-1920 | test-pattern 1280 upscale bicubic → 1920 | libx264 crf 18, tag bt709, -g 30 | 7.134.176 bps |
| tp-vp9-1920 | cùng upscale | libvpx-vp9 **2-pass, target = bitrate h264** (7134k), tag bt709, -g 30 | 7.201.330 bps (+0,94% vs target) |

Nhánh slov-vp9-1920 là **nhánh kiểm soát then chốt**: cùng codec VP9
nhưng cùng bitrate + cùng tag màu với nhánh h264 → tách "codec" khỏi
"re-encode / bitrate / tag màu". Nếu codec mới là biến gây nhiễu thì
nhánh này phải giống orig (resid ~2,9) và khác h264; nếu không thì nó
phải giống h264 — kết quả là vế sau.

- ffmpeg **8.1.2** (built gcc 13, Ubuntu 24.04). Lệnh VP9 2-pass:
  `ffmpeg -i <in> -t 4 -an -c:v libvpx-vp9 -b:v <B>k -deadline good
  -cpu-used 2 -row-mt 1 -color_primaries bt709 -color_trc bt709
  -colorspace bt709 -g <25|30> -pass 1 -passlogfile <log> -f null /dev/null`
  rồi `-pass 2` ra file. Lệnh h264 slov y hệt J4 §5 (xem
  `r83k4-media-build.mjs`).
- Đo: capture headed qua preview VCut (giao thức D1/D3/H9 của J4, 5
  cửa sổ w1280x800 / w1440x900 / w1920x1080 / w2240x1260 / w2880x1620,
  variants plain/plain2/noise05/noise10) → sweep delta0-harness (cả 2
  số học, dùng raw) → phân tích gộp theo cặp (cùng family + window +
  noise). Mỗi nhánh 10 case (5 window × 2 noise) → **VP9 30 case,
  h264 20 case, tổng 50 case**, đạt mục tiêu ≥20 case/codec.
- Render tham chiếu: decode khung N bằng ffmpeg (mp4: scale in/out
  bt709; webm: scale trơn — đúng quy ước F7/J4 để so được baseline),
  C3 trilinear 1920→1280 = plain; noise05/10 method F (yuv420p +
  noise alls 28/50).

## 2. Số đo chính (số học không-làm-tròn, 50 case)

### 2.1 Theo nhánh (n=10 mỗi nhánh)

| Nhánh | residStd_R mean [min, max] | median | d0std_R mean | ratio_R mean | plainMad mean | Q4 | Điểm 4 luật |
|---|---|---|---|---|---|---|---|
| slov-vp9-orig | 2,7511 [2,1251; 3,0834] | 2,9326 | 0,1964 | 0,0717 | 1,7210 | 0 | 10/10 cả 4 luật |
| slov-h264-1920 | 0,6088 [0,5915; 0,6195] | 0,6142 | 0,2429 | 0,3978 | 0,6061 | 0 | 10/10 cả 4 luật |
| slov-vp9-1920 | 0,6114 [0,5946; 0,6225] | 0,6176 | 0,2233 | 0,3641 | 0,5936 | 0 | 10/10 cả 4 luật |
| tp-h264-1920 | 0,9465 [0,8224; 1,1830] | 0,8967 | 3,7465 | 4,1467 | 3,0760 | 0 | 0/0 (10 unscored, cả-hai-LỆCH) |
| tp-vp9-1920 | 0,9496 [0,8236; 1,2019] | 0,8963 | 3,7332 | 4,1271 | 3,0835 | 0 | 0/0 (10 unscored, cả-hai-LỆCH) |

Verdict noD0/fullD0: 3 nhánh slov đều 10 KHỚP / 0 LỆCH; 2 nhánh tp
đều 0 KHỚP / 10 LỆCH (cả-hai-LỆCH — plainMad ~3,08 > 2,5 nên R0 từ
chối d0, verdict LỆCH ở cả hai phía; giống nhau giữa 2 codec).

residStd_R slov-vp9-orig theo window: 2,1251 (w1280) / 2,5709 (w1440)
 / 2,9326 (w1920) / 3,0433 (w2240) / 3,0834 (w2880) — tăng theo rect,
như kỳ vọng của mismatch đường resample. Các nhánh khớp bitrate/tag
gần như phẳng theo window (slov-h264: 0,59–0,62; tp: 0,82–1,20).

### 2.2 So sánh theo cặp (cùng family + window + noise, n=10 mỗi cặp)

| Cặp | \|ΔresidStd_R\| mean / max | \|Δratio_R\| mean | \|ΔplainMad\| mean | Lật verdict (noD0/fullD0/R0/G1/G2/G12) | Lật gate |
|---|---|---|---|---|---|
| slov VP9-gốc vs h264 (câu hỏi chính J4) | 2,1422 / 2,4640 | 0,3261 | 1,1149 | **0 / 0 / 0 / 0 / 0 / 0** | 0 / 0 / 0 |
| slov VP9-reenc vs h264 (tách codec) | **0,0025 / 0,0034** | 0,0337 | 0,0125 | **0 / 0 / 0 / 0 / 0 / 0** | 0 / 0 / 0 |
| slov VP9-gốc vs VP9-reenc (đối chứng) | 2,1397 / 2,4610 | 0,2924 | 1,1275 | **0 / 0 / 0 / 0 / 0 / 0** | 0 / 0 / 0 |
| tp h264 vs VP9-reenc | **0,0055 / 0,0189** | 0,0220 | 0,0075 | **0 / 0 / 0 / 0 / 0 / 0** | 0 / 0 / 0 |

Đọc: |Δresid| giữa 2 codec khớp bitrate/tag chỉ 0,0025–0,0055
(nhỏ hơn sai số làm tròn của chính metric ở 2 chữ số thập phân),
trong khi lệch orig-vs-h264 là 2,14 — và đối chứng cho thấy toàn bộ
2,14 đó đi theo **re-encode/tag**, không theo codec
(2,1397 ≈ 2,1422, chênh 0,0025). **0 lần lật verdict trong 40 cặp**
(4 cặp × 10) — kể cả cặp orig-vs-h264 có |Δresid| lớn: verdict slov
vẫn KHỚP cả hai phía vì d0std_R nhỏ (0,17–0,29) nên kurt/corr/stdRatio
không bị đẩy qua ngưỡng.

### 2.3 Độ sắc (gradient preview plain vs render plain, cùng rect)

| Nhánh | ratioH (preview/render) mean [min, max] | ratioV mean |
|---|---|---|
| slov-vp9-orig | 0,9333 [0,9275; 0,9398] | 0,9312 |
| slov-h264-1920 | 1,0040 [0,9988; 1,0068] | 1,0039 |
| slov-vp9-1920 | 1,0027 [0,9979; 1,0049] | 1,0021 |
| tp-h264-1920 | 1,0048 [0,9921; 1,0218] | 1,0152 |
| tp-vp9-1920 | 1,0040 [0,9915; 1,0201] | 1,0200 |

Cùng kết luận: 4 nhánh khớp bitrate/tag đều ≈ 1,00 (chênh nhau ≤
0,002 ở slov, ≤ 0,005 ở tp theo chiều V); chỉ VP9-gốc là 0,93 —
preview mềm hơn render ~7%, lại là hiệu ứng file gốc untagged.

### 2.4 Decode chéo native bằng ffmpeg (trước preview/render)

| Cặp (cùng khung, rgb24) | MAD | max |
|---|---|---|
| slov-vp9-orig vs slov-h264-1920 | 1,8459 | 15 |
| slov-vp9-orig vs slov-vp9-1920 | 1,7614 | 8 |
| slov-vp9-1920 vs slov-h264-1920 | 0,6436 | 12 |
| tp-h264-1920 vs tp-vp9-1920 | 0,2491 | 35 |

Mean RGB khung slov f25: orig [34,12; 33,26; 33,68] vs h264
[31,80; 32,03; 31,96] vs VP9-reenc [31,81; 32,03; 31,96] — **mean
của VP9-reenc trùng h264 tới 0,01**, lệch của orig đi theo tag
(untagged vs bt709), không theo codec. Gradient native: orig
meanAbsH ~0,97–0,99; h264 ~1,03–1,05 (+6%); reenc ~0,97–0,99
(= orig); tp hai codec gần như trùng (mean chênh ≤ 0,01, gradient
chênh < 1%). Z2: decode tp-1280 f30 vs fullrgb-plain.raw MAD = 0.
Motion: slov f25-vs-f40 MAD 24,504 (chuyển động thật).

## 3. Kết luận và hệ quả

1. **Codec không phải biến gây nhiễu cho các verdict G2/G12/Q4/độ
   sắc.** Không cần chuẩn hóa codec trong harness, không cần ghi chú
   codec vào LIMITS của các verdict liên quan — các verdict đo bằng
   media h264 hay VP9 (cùng bitrate/tag) là tương đương.
2. **Giả thuyết (a) của J4 được viết lại:** biến thật là **tag màu /
   thế hệ encode của file gốc**, không phải codec. Cơ chế làm việc
   (chưa chứng minh chi tiết): Chrome và ffmpeg không đồng ý về ma
   trận màu với file VP9 **untagged** (một bên bt601, một bên bt709
   hoặc khác nhau ở xử lý range), tạo resid hệ thống ~2,9 và làm mềm
   preview ~7%; file đã tag bt709 thì hai đường decode khớp nhau
   (resid ~0,6, tỉ số sắc ~1,00). Chứng minh chi tiết cần probe ma
   trận màu chuyên biệt (xem §5).
3. **Hướng săn Q4 "encode media bằng VP9" (J4 §3.5) là sai hướng.**
   VP9-reenc cho resid 0,61, không cao hơn h264. Muốn resid cao kiểu
   webm gốc thì cần giữ tính chất của file gốc (untagged và/hoặc
   encode gốc) — hoặc chấp nhận kết luận của K5 rằng Q4 đã dừng săn.
4. Không sửa production, không đổi luật gate, không đụng file chung.
   Không push/release/tag.

## 4. Kiểm chứng đã làm (xanh)

- EPERM probe đầu đợt (00:40 +07): bash 5/5, node 5/5, ffmpeg mp4 +
  VP9 đều ghi được — không sóng lúc bắt đầu.
- Media build: Z2 tp MAD=0; bitrate VP9 khớp target −0,18% (slov) /
  +0,94% (tp); motion slov MAD 24,504; tp f30-vs-f45 MAD 6,361 (xem
  §5.3 — tp có chuyển động, không phải still).
- Capture headed 5 cửa sổ, mỗi cửa **11/11 pass** (5 nguồn × D1 +
  D3 + H9 0 lỗi trang); proxyUsed=false ở cả 5 nguồn × 5 cửa sổ (đã
  kiểm trong 5 file snaps JSON).
- Sweep 25 lượt → 50 case, test `test_round83_k4_vp9_vs_h264.mjs`
  **ALL PASS 42/42**.
- `node --check` OK: `r83k4-media-build.mjs`,
  `r83k4-headed-capture.mjs`, `r83k4-sweep.mjs`,
  `r83k4-analyze.mjs`, `test_round83_k4_vp9_vs_h264.mjs`.
- Không chạy tsc (không đụng file .ts/.tsx nào — chỉ thêm script
  .mjs + doc .md).

## 5. Giới hạn trung thực / nợ mở

1. **Tag màu vs re-encode chưa tách được.** Nhánh kiểm soát VP9-reenc
   khác orig ở cả ba thứ cùng lúc (tag bt709 + re-encode thế hệ 2 +
   bitrate 8,2 vs 5,5 Mbps). Kết luận "không phải codec" là vững
   (VP9-reenc ≡ h264), nhưng chưa biết trong 3 yếu tố còn lại, yếu tố
   nào gây ra 2,14 của orig. Thí nghiệm tách tiếp (rẻ, chưa làm):
   encode VP9 **không tag màu** từ webm gốc ở cùng bitrate 8,2 Mbps
   → nếu resid về ~2,9 thì tag là biến chính; nếu về ~0,6 thì
   re-encode/bitrate mới là biến chính.
2. **Cơ chế ma trận màu chưa chứng minh chi tiết.** Cần probe: decode
   webm gốc trong Chrome vs ffmpeg với bt601/bt709 ép buộc từng bên,
   so MAD từng tổ hợp — mới khẳng định được "Chrome dùng X, ffmpeg
   dùng Y với file untagged".
3. **test-pattern.mp4 CÓ chuyển động — đính chính I4.** f30-vs-f31
   MAD 4,098, f30-vs-f45 MAD 6,476, f30-vs-f60 MAD 5,866 (max 255) —
   tp không phải still-loop như I4 §3.2 gọi "(still)". Không ảnh
   hưởng kết luận K4 (hai codec encode cùng nội dung chuyển động đó),
   nhưng mọi suy luận "tp still" trước đây cần đọc lại với lưu ý này;
   riêng check motion tp f30-vs-f45 MAD 6,361 của K4 là chuyển động
   thật, không phải lỗi build.
4. **Sóng EPERM TÁI PHÁT ~18:12–18:26 UTC 10/11** (01:12–01:26 +07):
   vite không load được config (`EPERM: operation not permitted,
   write` khi bundle config, lỗi trong <1 s) → 3 cửa sổ fail liên
   tiếp (w1440 app-mount timeout 240 s; w2240/w2880 vite không lên
   sau 120 s). Probe lại 18:26 UTC: vite ready trong 993 ms → sóng
   đã qua, chạy tiếp bình thường. Không cố lách: chỉ đợi sóng qua rồi
   chạy lại cùng thao tác. Các lần fail capture khác đều là flake
   harness, đều khỏi bằng retry: lần 1 w1920 lỗi X connection sau
   mount; w1440 lần retry lỗi "không lấy được page target CDP";
   w2880 lần 1 bị runtime restart cắt giữa chừng (kiểm đĩa xác nhận
   chưa có snaps JSON rồi chạy lại). Không mất dữ liệu.
5. **VM tải cao làm sweep chậm.** Load 10–14 lúc cao điểm (mksquashfs
   của luồng khác ~41%, ffmpeg khác ~18%, 2 tiến trình `yes` ~30%,
   r83k5 ~18%) → 25 sweep mất ~1,5 giờ; đã chia 3 shard song song
   sau khi shard tuần tự quá chậm. Số đo không bị ảnh hưởng (sweep
   là tính toán xác định trên snapshot đã capture).
6. **Phạm vi kết luận:** chỉ đúng trên Chromium (Chrome
   headed 1254) + ffmpeg 8.1.2, CPU/SwiftShader, 2 họ nội dung
   (slovenska thật + test-pattern), 5 cửa sổ, 50 case. Chưa đo trên
   Safari/WebKit thật, GPU thật, hay codec khác (AV1, VP8, HEVC).
   Q4 = 0 ở cả 5 nhánh nên kết luận "không lật verdict" là trên nền
   verdict hiện có (slov KHỚP, tp cả-hai-LỆCH), không phải trên case
   Q4 thật — nhưng vì |Δresid| và |Δratio| theo cặp đều nhỏ hơn xa
   khoảng cách tới mọi ngưỡng cổng, codec không thể tạo Q4 từ các
   nội dung này.
7. **Lỗi vận hành của K4 (đã sửa, ghi để đợt sau tránh):**
   (a) `tee` log media-build fail vì thư mục round83-k4 chưa tồn tại
   lúc tee chạy (script tự tạo thư mục con sau) — log build chỉ còn
   trong process log, JSON đầy đủ; (b) 2 lần `pkill -f` pattern chứa
   tên file config đã giết luôn shell của chính mình (SIGTERM) —
   từ đó chỉ dùng `kill $PID`; (c) script phân tích bản đầu đếm
   verdict bằng nhãn "KHỚP"/"LỆCH" trong khi harness trả
   "KHỚP-THỐNG-KÊ"/"LỆCH-THỐNG-KÊ" → phân bố verdict 0/0 (đã sửa,
   chạy lại, test 42/42; số lật verdict không bị ảnh hưởng vì so
   bằng đẳng thức trực tiếp).
8. **Không đụng production, không đổi luật gate.** delta0-harness.mjs
   không sửa; `delta0` vẫn chỉ là hiệu chỉnh đo lường trong harness.

## 6. File của đợt (stage, KHÔNG push)

Script mới trong `apps/web/scripts/` (text, stage được):
- `r83k4-media-build.mjs` — build 5 media + render C3 + decode chéo.
- `r83k4-headed-capture.mjs` — capture headed 5 nguồn × 5 cửa sổ
  (copy J4, cổng/display riêng 5580-5589/9680-9689/:180-189).
- `r83k4-sweep.mjs` — sweep 1 nguồn × 1 cửa sổ (copy J4, đường dẫn K4).
- `r83k4-analyze.mjs` — phân tích gộp theo cặp + độ sắc.
- `test_round83_k4_vp9_vs_h264.mjs` — test kiểm chứng 42 khẳng định.

Docs: `docs/PHASE9_ROUND83_K4_VP9_VS_H264_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round83-k4-vp9-vs-h264.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage — binary/JSON/log):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round83-k4/`
(log luồng `../round83-k4.md`; `r83k4-media-build.json`;
`r83k4-analysis.json`; `r83k4-sweep-*.json` 25 file;
`r83k4-snaps-*.json` + headed report 5 cửa sổ; `media/` 4 file
mp4/webm (slov-vp9-orig chỉ tham chiếu file gốc round67-u3, không
copy); `render/` *.raw/*.yuv; log capture/sweep/analysis).

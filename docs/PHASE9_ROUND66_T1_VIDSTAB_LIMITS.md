# LIMITS — Phase 9 đợt 66 T1 (CHẠY LẠI): điều tra vidstabtransform không xác định

Đợt 66 T1 — nợ đợt 65 S1 (docs/PHASE9_ROUND65_LIMITS.md §8 mục 1):
`vidstabtransform` không xác định, spread MAD 36–38% giữa các lần chạy
cùng file `.trf` byte-identical. Lượt cron 15:35 08/11 chết do daemon
restart (không checkpoint); lượt chạy lại 18:35–19:06 08/11 tiếp nối trên
đĩa, không làm lại từ đầu. Harness mới:
`server/render/src/test_round66_t1_vidstab.js` (399 dòng, C0 + E0–E14,
mỗi cấu hình ×3, cùng input + cùng `.trf` trừ khi ghi khác).

> Đã chốt số cuối — harness T1 chạy xong 10 pass / 0 fail (xem §5).

## 0. Kết quả — tóm tắt

| Thí nghiệm | Kết quả | Spread MAD | Spread F2_V5 |
|---|---|---|---|
| C0 decode-only ×3 (đối chứng) | XÁC ĐỊNH, 0/150 frame khác | 0,0% | 0,0% |
| E0 replicate S1: transform + x264 ×3 | KHÔNG XĐ, sha mp4 khác nhau | 19,9% (S1: 36,1%) | 61,3% (S1: 38,0%) |
| E1 transform → PNG mặc định ×3 | KHÔNG XĐ, 136/135 frame khác | 77,0% | 57,9% |
| E2 OMP_NUM_THREADS=1 ×3 | KHÔNG XĐ, 136/136 frame khác | 12,1% | 85,8% |
| E3 LD_PRELOAD srand(12345) ×3 | KHÔNG XĐ, 135/133 frame khác | 44,6% | 97,1% |
| E4 ffmpeg `-threads 1` ×3 | **XÁC ĐỊNH, 0/150 frame khác** | **0,0%** | **0,0%** |
| E5 `-filter_threads 1` ×3 | KHÔNG XĐ, 136/133 frame khác | 17,6% | 27,5% |
| E6 smoothing=0 ×3 | KHÔNG XĐ, 135/133 frame khác | 55,4% | 24,8% |
| E7 optalgo=avg ×3 | KHÔNG XĐ, 132/132 frame khác | 28,3% | 50,1% |
| E8 optalgo=opt ×3 | KHÔNG XĐ, 132/133 frame khác | 33,0% | 73,2% |
| E9 optzoom=0 ×3 | KHÔNG XĐ, 132/136 frame khác | 30,5% | 65,0% |
| E10 crop=black ×3 | KHÔNG XĐ, 132/89 frame khác | 78,5% | 120,5% |
| E11 trfB ×3 | KHÔNG XĐ, 133/133 frame khác | 46,1% | 26,7% |
| E14 crop=black + smoothing=0 ×3 | KHÔNG XĐ, 133/134 frame khác | 92,2% | 48,0% |
| E12 4 transform song song | KHÔNG XĐ, 133/133/133 frame khác | 50,2% | 79,5% |
| E13 debug=1 ×3 (so global_motions.trf) | **fit GIỐNG HỆT ×3 (xác định)** | — | — |

## Kết luận chung

- **Chỉ 2 cấu hình xác định trong 16 thí nghiệm: C0 (decode-only, đối
  chứng) và E4 (`-threads 1`).** Mọi cấu hình transform mặc định khác
  đều spread MAD 12–92% / F2_V5 25–121%, khác 89–150/150 frame.
- **Cách khử duy nhất tìm được: ffmpeg `-threads 1`** (đặt trước `-i`,
  tức decode đơn luồng). Không chậm hơn đáng kể (TB 34,8s/lần vs
  ~29s/lần mặc định ở E1) và cho output mịn hơn hẳn (MAD 2,3867 vs
  4,7–10,2).
- Fit toàn cục (`global_motions.trf`) xác định tuyệt đối ×3 — nguồn
  spread nằm ở hạ nguồn của fit, trong tầng warp/render của transform
  khi chạy cùng decoder đa luồng (xem §4).

## 1. Thiết lập đo (giống hệt S1, kiểm chứng trước khi đo)

- Input: `shakynoisy720.mp4` (5s, 1280×720, 30fps, 150 frame; sha
  `af87a113db26…`, khớp log S1 run3) + `.trf` detect-a
  (sha `4b35c5fd86c2…`, khớp log S1 run3) / detect-b
  (`48d9c496617c…`, chỉ E11). Lệnh transform chuẩn S1:
  `vidstabtransform=input='<trf>':smoothing=10:optalgo=gauss` trên đoạn
  `trim=start=0:end=5,setpts=PTS-STARTPTS`.
- Đo trên frame đã tách, downscale 320×180 gray (chuỗi đo của S1):
  MAD full-frame + F1/F2/F3_V5 (Farneback w25, crop giữa) + F2_V2
  cross-check + maxDm/wild8. Spread = (max−min)/mean ×3 lần.
  Đo bằng module `motion_metric.py` trích từ harness S1 (V0 cấm ở mức
  code, F5 đã bỏ). So pixel trực tiếp r1↔r2/r3 bằng `framediff.py`.
- Môi trường: ffmpeg 8.1.2 (libvidstab 1.1.0), 4 CPU, VM 8GB, không GPU.
  Tải nền cao trong lúc đo (loadavg 6–32 do các luồng đợt 66 khác chạy
  song song) — thời gian/lần chỉ tham khảo, spread mới là kết luận.

## 2. Kết luận từng thí nghiệm (số thật)

### C0 — decode-only ×3: XÁC ĐỊNH (đối chứng chuỗi đo sạch)
- MAD 12,3274 cả 3 lần; F2_V5 13,4033; F2_V2 13,2526; wild8 111.
  So pixel r1↔r2/r3: 0/150 frame khác, meanAbsDiff=0, max=0.
- Kết luận: decode + chuỗi đo (tách frame, downscale, metric) hoàn toàn
  xác định. Spread ở các thí nghiệm sau nằm trong transform, không phải
  trong decode hay phép đo.

### E0 — replicate S1 (transform + x264 veryfast crf23) ×3: KHÔNG XÁC ĐỊNH
- sha mp4 khác nhau cả 3 lần (765a9cf8… / be2e141d… / 80552db0…).
- MAD 6,5495 / 6,7773 / 5,5276 → spread 19,9% (S1 đo 36,1% trên 2 lần);
  F2_V5 1,6058 / 2,646 / 1,4755 → spread 61,3% (S1: 38,0%).
- So pixel (sau tách frame): r1↔r2 khác 150/150 frame (meanAbsDiff
  17,52, max 74,28); r1↔r3 khác 149/150 (19,08 / 67,64).
- Kết luận: tái lập được phát hiện của S1 — transform là nguồn spread,
  không phải encoder (xem E1).

### E1 — transform → PNG (không encoder) ×3: KHÔNG XÁC ĐỊNH
- MAD 6,3958 / 10,2263 / 4,745 → spread 77,0%; F2_V5 3,0476 / 3,913 /
  2,1546 → spread 57,9%; wild8 12 / 17 / 12.
- So pixel: r1↔r2 khác 136/150 (meanAbsDiff 39,79, max 88,22, frame
  khác đầu tiên 5, tệ nhất frame 118); r1↔r3 khác 135/150 (24,91 /
  58,54, đầu tiên 6, tệ nhất 120).
- Kết luận: bỏ encoder x264 vẫn spread lớn → encoder KHÔNG phải nguồn.
  Spread đo trên PNG còn lớn hơn trên mp4 (77% vs 19,9%) — encode x264
  làm mịn bớt chênh lệch pixel, không tạo ra nó.

### E2 — OMP_NUM_THREADS=1 ×3: KHÔNG XÁC ĐỊNH (luồng OpenMP không phải nguồn)
- MAD 5,7775 / 6,1493 / 6,5206 → spread 12,1%; F2_V5 2,3955 / 0,9214 /
  2,6184 → spread 85,8%; wild8 8 / 0 / 8.
- So pixel: 136/136 frame khác (36,52 / 17,40 meanAbsDiff).
- Kết luận: ép OpenMP đơn luồng không sửa được. Phù hợp phân tích mã
  nguồn: `GOMP_parallel` chỉ có 1 call site trong `calcTransFields`
  (detect), không nằm trong đường transform. Thời gian tăng vọt
  (49,8 / 52,8 / 96,6s) nhưng spread vẫn còn.

### E3 — LD_PRELOAD srand(12345) ×3: KHÔNG XÁC ĐỊNH (rand() không phải cơ chế)
- MAD 3,5422 / 4,9695 / 5,6464 → spread 44,6%; F2_V5 0,7899 / 2,2103 /
  1,3861 → spread 97,1%; wild8 3 / 10 / 4.
- So pixel: r1↔r2 khác 135/150 (15,73 / 35,31, đầu tiên 6, tệ nhất
  117); r1↔r3 khác 133/150 (21,54 / 46,69, đầu tiên 11, tệ nhất 40).
- Kiểm chứng độc lập (lượt chạy lại): framediff E3/r2↔r3 (2 lần chạy
  không bị đụng) = khác 136/150 frame, meanAbsDiff 13,5676, max 38,4228
  — khớp kết luận harness.
- Kết luận: khóa `srand()` cố định không giảm spread. Phù hợp phân tích
  mã nguồn: `rand()` glibc không seed cho cùng dãy số mỗi process mới,
  và bước fit đã được chứng minh xác định (xem §3). `rand()` trong
  `vsGradientDescent` KHÔNG phải cơ chế gây spread.
- Lưu ý: `.so` chỉ override `srand`; nếu vidstab dùng `random()` /
  `drand48()` thì thí nghiệm này không khóa được — nhưng bước fit đã
  chứng minh xác định bằng `debug=1` nên hướng này đã đóng (xem §3).

### E4 — ffmpeg `-threads 1` ×3: XÁC ĐỊNH (0 frame khác) ✓
- MAD 2,3867 cả 3 lần; F2_V5 0,538; F2_V2 0,9367; wild8 0; maxDm 1,4361
  — giống hệt tới 4 chữ số thập phân.
- So pixel: r1↔r2 và r1↔r3 đều khác **0/150 frame**, meanAbsDiff=0,
  max=0. Kiểm chứng độc lập (lượt chạy lại): sha256 của toàn bộ 150
  PNG mỗi lần chạy đều cho cùng hash tổng hợp
  `f4173e2b2ab87cf39aa4b5d2ec7e7a9b7964cdb2612a73600ee1750ba8e09060`
  — byte-identical cả 3 lần.
- Thời gian TB 34,8s/lần (không chậm hơn đáng kể so với mặc định
  ~29s/lần ở E1).
- Kết luận: **`-threads 1` (đặt trước `-i`, tức decode đơn luồng) khử
  hoàn toàn spread trên cấu hình đo này.** Đây là cách giảm spread đầu
  tiên tìm được. Cơ chế chính xác chưa rõ (xem §4 + kết quả E5/E6…);
  ứng viên hàng đầu là đường chạy đa luồng của ffmpeg (filter graph /
  decoder frame-threading) tương tác với state có nhớ của
  vidstabtransform, chứ không phải bản thân phép toán transform.
- Phát hiện phụ: không chỉ xác định hơn, output `-threads 1` còn MỊN
  hơn hẳn: MAD 2,3867 so với E1 mặc định 4,7–10,2 và E5-r1 6,0504
  (cùng thang đo 320×180 gray). Đường đa luồng mặc định cho kết quả
  tệ hơn VÀ không xác định — xem §4.

### E5 — ffmpeg `-filter_threads 1` ×3: KHÔNG XÁC ĐỊNH (phân biệt được cơ chế)
- MAD 6,0504 / 7,2004 / 6,4026 → spread 17,6%; F2_V5 2,0633 / 2,4878 /
  1,8967 → spread 27,5%; wild8 10 / 8 / 5.
- So pixel: r1↔r2 khác 136/150 (13,14 / 69,33, đầu tiên 5, tệ nhất 147);
  r1↔r3 khác 133/150 (16,43 / 67,33, đầu tiên 10, tệ nhất 147).
- Kết luận: ép filter-graph đơn luồng KHÔNG sửa được, trong khi E4
  (`-threads 1` đặt trước `-i`) sửa được hoàn toàn. Hai option tác động
  khác tầng: `-threads` trước `-i` đặt số luồng DECODE (frame threading
  của decoder h264); `-filter_threads` đặt số luồng của filter graph.
  Nguồn spread nằm ở phía decoder-threading (hoặc ở tương tác giữa
  decoder đa luồng và filter), KHÔNG nằm ở filter graph đa luồng.
  Đây là phân biệt quan trọng nhất sau E4.

### E6 — smoothing=0 ×3: KHÔNG XÁC ĐỊNH (smoothing không phải nguồn)
- MAD 7,6065 / 4,4 / 5,3445 → spread 55,4%; F2_V5 2,1555 / 1,6784 /
  1,9409 → spread 24,8%; wild8 6 / 4 / 5.
- So pixel: r1↔r2 khác 135/150 (17,98 / 71,21, đầu tiên 6, tệ nhất 76);
  r1↔r3 khác 133/150 (19,65 / 79,32, đầu tiên 11, tệ nhất 76).
- Kết luận: tắt hẳn smoothing (mỗi frame dùng transform riêng của nó)
  vẫn spread lớn → tầng `vsPreprocessTransforms`/smoothing KHÔNG phải
  nguồn (ít nhất không phải nguồn duy nhất). Kết hợp E4: spread tồn tại
  cả khi không có averaging theo thời gian.

### E7 — optalgo=avg ×3: KHÔNG XÁC ĐỊNH (gauss kernel không phải nguồn)
- MAD 5,3909 / 6,7766 / 7,2232 → spread 28,3%; F2_V5 1,3896 / 1,9668 /
  2,34 → spread 50,1%; wild8 2 / 4 / 10.
- So pixel: r1↔r2 khác 132/150 (18,63 / 86,73, đầu tiên 11, tệ nhất
  147); r1↔r3 khác 132/150 (38,12 / 128,27, đầu tiên 11, tệ nhất 143 —
  maxAbsDiff 128 là lớn nhất trong tất cả các thí nghiệm tới nay).
- Kết luận: đổi gaussian kernel sang simple averaging vẫn spread →
  kernel gauss trong `vsPreprocessTransforms` KHÔNG phải nguồn.

### E8 — optalgo=opt (L1) ×3: KHÔNG XÁC ĐỊNH (opt toàn cục không phải nguồn)
- MAD 5,228 / 6,3573 / 7,3039 → spread 33,0%; F2_V5 0,9447 / 2,1762 /
  2,2578 → spread 73,2%; wild8 1 / 8 / 12.
- So pixel: r1↔r2 khác 132/150 (21,40 / 84,72, đầu tiên 11, tệ nhất
  114); r1↔r3 khác 133/150 (12,66 / 87,82, đầu tiên 11, tệ nhất 147).
- Kết luận: thuật toán tối ưu đường camera toàn cục (L1) cũng không
  phải nguồn — cả 3 optalgo (gauss E1, avg E7, opt E8) đều spread.
  Thời gian không chậm hơn đáng kể (TB 32,4s/lần).

### E9 — optzoom=0 ×3: KHÔNG XÁC ĐỊNH (tối ưu zoom không phải nguồn)
- MAD 3,9994 / 4,2399 / 5,3866 → spread 30,5%; F2_V5 1,0204 / 1,1569 /
  1,9047 → spread 65,0%; wild8 7 / 7 / 10.
- So pixel: r1↔r2 khác 132/150 (meanAbsDiff chỉ 4,7246, max 17,8166 —
  nhỏ nhất trong các thí nghiệm, đầu tiên 11, tệ nhất 134); r1↔r3 khác
  136/150 (9,1993 / 25,7816, đầu tiên 6, tệ nhất 127).
- Kết luận: tắt tối ưu zoom vẫn spread → `optzoom` không phải nguồn.
  Thời gian tăng (TB 69,0s/lần, r2 tới 107,6s — tải nền cao lúc đo).

### E10 — crop=black ×3: KHÔNG XÁC ĐỊNH (vòng phản hồi destbuf không phải nguồn duy nhất)
- MAD 2,4523 / 5,5422 / 3,8196 → spread 78,5%; F2_V5 0,5588 / 2,3146 /
  1,498 → spread 120,5% (lớn nhất trong các thí nghiệm); wild8 0 / 12 / 9.
- So pixel: r1↔r2 khác 132/150 (11,43 / 62,92, đầu tiên 11, tệ nhất
  120); r1↔r3 khác **89/150** (7,05 / 21,71, đầu tiên **55**, tệ nhất 64)
  — cặp r1↔r3 khớp nhiều hơn hẳn các thí nghiệm khác.
- Kết luận: tắt vòng phản hồi destbuf của `crop=keep` (nền đen thay vì
  frame trước) vẫn spread → destbuf KHÔNG phải nguồn duy nhất. Nhưng
  r1↔r3 chỉ khác 89/150 và frame khác đầu tiên muộn tới 55 (so với 5–11
  ở các thí nghiệm khác) gợi ý vòng phản hồi có KHUẾCH ĐẠI chênh lệch
  sau khi nó đã xuất hiện — nó là bộ khuếch đại, không phải nguồn phát.
  Lưu ý thêm: E10-r1 MAD 2,4523 ≈ E4 (2,3867) — các lần chạy "tốt" cụm
  quanh MAD ~2,4 (xem §4).

### E11 — trfB (khác byte, cùng nội dung LM) ×3: KHÔNG XÁC ĐỊNH (thứ tự LM không ảnh hưởng)
- MAD 5,0932 / 4,2631 / 6,7333 → spread 46,1%; F2_V5 1,5231 / 1,4836 /
  1,9223 → spread 26,7%; wild8 7 / 4 / 8.
- So pixel: r1↔r2 khác 133/150 (12,10 / 38,46, đầu tiên 11, tệ nhất
  149); r1↔r3 khác 133/150 (11,04 / 47,27, đầu tiên 11, tệ nhất 40).
- Kết luận: dùng file `.trf` khác byte (chỉ khác thứ tự liệt kê LM,
  nội dung median giống hệt) vẫn spread tương tự E1 → thứ tự LM trong
  file không ảnh hưởng; detect đã được loại từ đợt 65, E11 đóng lại
  hướng này ở tầng transform.

### E14 — crop=black + smoothing=0 ×3 (transform tối thiểu): KHÔNG XÁC ĐỊNH
- MAD 5,1668 / 5,3578 / 12,1321 → spread **92,2%** (lớn nhất); F2_V5
  2,0619 / 1,8595 / 2,9609 → spread 48,0%; wild8 5 / 6 / 11.
- So pixel: r1↔r2 khác 133/150 (13,02 / 39,70, đầu tiên 11, tệ nhất
  123); r1↔r3 khác 134/150 (26,48 / 98,22, đầu tiên 10, tệ nhất 83).
- Kết luận: ngay cả transform tối thiểu (không smoothing, không vòng
  phản hồi destbuf, chỉ warp theo transform đã fit) vẫn spread mạnh.
  E14-r3 MAD 12,1321 ≈ đối chứng không-stabilize (12,3274) — có lần chạy
  gần như mất hết hiệu ứng stabilize. Nguồn spread nằm ở tầng warp cơ
  bản (`vsDoTransform`) hoặc ở cách frame được đưa vào filter, không
  nằm ở bất kỳ tầng tùy chọn nào (smoothing / optalgo / optzoom / crop).

### E12 — 4 transform mặc định chạy SONG SONG: KHÔNG XÁC ĐỊNH (tải không đổi bản chất)
- MAD 4,2307 / 4,5743 / 4,6444 / 6,7665 → spread 50,2%; F2_V5 1,4426 /
  1,015 / 2,1687 / 1,1751 → spread 79,5%; wild8 5 / 2 / 9 / 1.
- So pixel: r1↔r2/r3/r4 đều khác 133/150 (17,36 / 14,27 / 17,86).
- Kết luận: chạy 4 transform cùng lúc (44,3s cho 4 lần) spread tương tự
  chạy tuần tự E1 (77,0% / 57,9%) — tải hệ thống không phải yếu tố quyết
  định; spread là bản chất của đường chạy mặc định, không phải do máy bận.

### E13 — debug=1 ×3 (so global_motions.trf): FIT GIỐNG HỆT ×3 ✓
- Cả 3 lần chạy đều cho `global_motions.trf` sha `1eac131f45a8…` giống
  hệt nhau (khớp cả với kiểm chứng ×2 trước harness, cùng sha).
- Kết luận: bước fit transform toàn cục (`vsMotionsToTransform` →
  `vsGradientDescent`, kể cả `rand()` không seed trong đó) là XÁC ĐỊNH
  tuyệt đối. Nguồn spread nằm ở HẠ NGUỒN của fit — tầng warp/render
  của `vidstabtransform` khi chạy cùng decoder đa luồng (xem §4).

## 3. Phân tích mã nguồn + kiểm chứng fit xác định (làm trước harness)

- libvidstab 1.1.0 (VM, ffmpeg 8.1.2) đối chiếu master
  georgmartius/vid.stab: `.trf` CHỈ lưu local motions; mỗi lần transform
  đều FIT LẠI transform toàn cục từng frame qua `vsMotionsToTransform` →
  `vsGradientDescent`.
- `vsGradientDescent` là chỗ duy nhất gọi `rand()` trong 1.1.0 (kiểm
  chứng bằng objdump: 1 call site `rand@plt`, nằm trong
  `vsGradientDescent`). Upstream đã sửa (issue #111: đổi sang xen kẽ
  dấu bước xác định) nhưng 1.1.0 vẫn còn `rand()`.
- Kiểm chứng trực tiếp: transform với `debug=1` ×2, file
  `global_motions.trf` (transform đã fit) GIỐNG HỆT byte
  (sha `1eac131f…`) → **bước FIT LÀ XÁC ĐỊNH** (rand() glibc không seed
  cho cùng dãy mỗi process mới). Nguồn spread nằm ở HẠ NGUỒN của fit.
- So pixel 2 output transform cũ (frames-transform-1 vs
  frames-transform-2, đợt 65 S1): 149/150 frame khác, meanAbsDiff TB
  18,59 (max 45,35); chỉ frame 0 giống hệt; chênh lệch NHỎ ở frame đầu
  (0,06–0,4) rồi LỚN dần (35–45) — mẫu hình khuếch đại qua các frame.
  E10/E14 đã kiểm chứng: tắt destbuf (crop=black) và tắt smoothing vẫn
  spread → khuếch đại là hệ quả, không phải nguồn phát (xem §4).

## 4. Cơ chế gây spread — kết luận sau đủ 16 thí nghiệm

- Đã LOẠI (mỗi hướng 1 thí nghiệm ×3, xem §2): encoder x264 (E1),
  OpenMP (E2), `rand()`/fit (E3 + E13: fit byte-identical ×3), decode
  (C0), filter-graph threading (E5), smoothing (E6), gauss kernel (E7),
  optalgo L1 (E8), optzoom (E9), vòng phản hồi destbuf (E10), thứ tự LM
  trong `.trf` (E11), tải hệ thống (E12).
- Đã TÌM ĐƯỢC cách khử duy nhất: ffmpeg `-threads 1` (decode đơn
  luồng) → 0/150 frame khác, spread 0,0%, byte-identical cả 3 lần.
- Phân biệt quyết định: E4 (`-threads 1`, decode đơn luồng) sửa được
  nhưng E5 (`-filter_threads 1`, filter graph đơn luồng) không → nguồn
  nằm ở phía **decoder frame-threading** (hoặc tương tác giữa decoder
  đa luồng và filter), không phải ở filter graph đa luồng. Vì decode
  pixel đã chứng minh xác định (C0: 0 frame khác với threads mặc định),
  khác biệt phải nằm ở cách frame/timestamp/state được đưa vào
  `vidstabtransform` khi decoder chạy đa luồng — cơ chế chính xác trong
  libvidstab/ffmpeg chưa xác định được từ thí nghiệm đen hộp này
  (cần đọc code `vf_vidstabtransform.c` + `vsDoTransform` hoặc chạy
  dưới valgrind/thread-sanitizer mới kết luận được — nợ mở, xem §7).
- Bằng chứng có MỘT output "đúng" duy nhất: so chéo E4/r1 (xác định)
  với E10/r1 (lần chạy đa luồng "tốt" nhất, MAD 2,4523 ≈ E4 2,3867):
  chỉ khác 64/150 frame, meanAbsDiff **0,2478**, max 3,54, frame khác
  đầu tiên 78 (86 frame giống hệt byte) — gần hơn 50–160× so với các
  cặp đa luồng khác (meanAbsDiff 13–40). Tức `-threads 1` không tạo ra
  một output khác — nó tái lập đúng output mà các lần chạy đa luồng
  thỉnh thoảng đạt được một cách may mắn. Các lần chạy đa luồng còn lại
  lệch khỏi output đúng này với biên độ lớn và ngẫu nhiên.
- Hệ quả thực hành: **mọi đo stabilize / render stabilize cần số ổn
  định nên chạy với `-threads 1`** (đặt trước `-i` cho ffmpeg decode,
  hoặc tương đương trong `render.js`/`enhance.js` nếu được duyệt sửa
  code — xem §7 mục 2). Quy định "chạy ≥3 lần + báo spread" từ đợt 65
  vẫn giữ cho mọi đo stabilize CHƯA dùng `-threads 1`; với `-threads 1`
  thì 1 lần chạy đã đủ trên cấu hình đo này (nhưng khuyến nghị giữ 2–3
  lần cho tới khi sửa code xong và kiểm chứng lại trên footage thật).
- Lưu ý về thang đo: mọi số MAD/F2 trong đợt này đo trên frame
  320×180 gray (chuỗi đo S1) — so sánh tuyệt đối với số 720p full-frame
  của đợt 65 S1 (MAD 7,85 vs 5,45) không trực tiếp; chỉ spread % và
  kết luận xác định/không-xác-định mới so được ngang hàng.

## 5. Harness + kiểm chứng

- Harness T1: `server/render/src/test_round66_t1_vidstab.js` —
  **10 pass, 0 fail** (exit 0; summary JSON tại
  `~/workspace/.scratch-r66t1-4yeZid/summary.json`, log đầy đủ tại
  `hidden_files/round66-t1-run.log`). 10 assert: kiểm chứng sha input
  (3) + đủ 150 frame ×4 lần E12 (4) + có `global_motions.trf` ×3 E13 (3).
- Kiểm chứng độc lập (lượt chạy lại, ngoài harness):
  - E4 byte-identical: sha256 toàn bộ 150 PNG mỗi lần chạy cho cùng
    hash tổng hợp `f4173e2b2ab87cf39aa4b5d2ec7e7a9b7964cdb2612a73600ee1750ba8e09060`.
  - E3 không sửa được: framediff E3/r2↔r3 (2 lần không bị ghi đè) =
    khác 136/150, meanAbsDiff 13,5676, max 38,4228.
  - Có 1 output "đúng": framediff E4/r1↔E10/r1 = khác 64/150,
    meanAbsDiff 0,2478, max 3,5433 (đối chứng E4/r1↔E1/r3 = 134/150,
    13,2193).
- Hồi quy: harness motion-metric S1
  (`server/render/src/test_round65_s1_motion_metric.js`) chạy lại
  **27/27 pass, 0 fail, exit 0** (log
  `hidden_files/round66-t1-s1-harness.log`, scratch mới
  `.scratch-r65s1-gjUDuT`). Tái lập đúng kết quả S1 run3: transform ×2
  cùng `.trf` a cho sha khác nhau (fb66011a… vs 3cf435c6…), encode-only
  ×2 byte-identical (586cd77c…), detect ×3 khác byte nhưng median LM
  giống hệt (0/149 frame khác). Số đối chứng S0 tái lập tới 4 chữ số
  (MAD 11,8789; F2_V5 13,4624).
- tsc/vite build: không chạy (T1 không sửa code TS/web — chỉ thêm 1
  file test node + 1 file docs; không có gì để typecheck/build).
  Harness node chạy trực tiếp bằng `node`, không qua build.

## 6. Sự cố trong lượt chạy (ghi trung thực)

1. Lượt cron 15:35 08/11 chết do daemon restart, không checkpoint,
   không có file paths đã stage. Lượt chạy lại 18:35 tiếp nối trên đĩa:
   scratch `.scratch-r66t1-4yeZid` còn nguyên (C0/E0/E1/E2 + scripts
   `motion_metric.py`, `framediff.py`, `seed.c`, `seed.so`), log
   `round66-t1-run.log` còn nguyên tới đầu E3.
2. **Runner cũ (node harness PID 6981) vẫn sống sau daemon restart
   và tự chạy tiếp E3 → E4…** trong lúc lượt chạy lại khởi động runner
   riêng (script `run_e3_e6.sh`) — hai runner cùng ghi log + cùng thư
   mục E3/E4. Phát hiện kịp thời, đã kill runner mới (bash + ffmpeg)
   trước khi nó ghi đè thêm; chỉ E3/r1 bị ghi đè một phần (tới f0072)
   — số E3 trong log do harness cũ đo TRƯỚC khi bị ghi đè nên vẫn đúng,
   và đã kiểm chứng độc lập bằng framediff E3/r2↔r3 (136/150 khác).
   Bài học: sau daemon restart phải kiểm tra process còn sống
   (`ps aux | grep test_round66_t1`) TRƯỚC khi khởi động runner mới,
   không chỉ kiểm tra file trên đĩa.
3. Log có 1 dòng header E3 trùng do runner mới ghi trước khi bị kill
   (dòng `== E3. transform LD_PRELOAD srand(12345) x3 (kiem tra rand()
   khong seed) ==` cuối log, không kèm số liệu) — bỏ qua dòng đó, số
   E3 chuẩn là 3 dòng ngay sau header E3 đầu tiên của harness cũ.
4. Script `run_e3_e6.sh` của lượt chạy lại đã bỏ, không dùng nữa (harness
   node cũ bao phủ E3–E14 đầy đủ hơn). File còn nằm trong scratch, không
   stage (không phải file repo).

## 7. Nợ mở

1. Cơ chế chính xác trong code (vì sao decoder frame-threading làm
   `vidstabtransform` cho output khác nhau dù decode pixel giống hệt):
   cần đọc `vf_vidstabtransform.c` + `vsDoTransform` hoặc chạy dưới
   valgrind/thread-sanitizer. Đây là nợ điều tra sâu hơn, không chặn
   việc dùng `-threads 1` làm cách khử thực hành.
2. Chưa sửa code sản phẩm: quyết định có ép `-threads 1` cho stabilize
   trong `render.js`/`enhance.js` không (đánh đổi: decode đơn luồng có
   thể chậm hơn trên clip lớn — cần đo hiệu năng; và có áp cho mọi
   render hay chỉ stabilize), rồi kiểm chứng lại trên footage thật.
   Thuộc đợt sau, không làm trong T1 (T1 chỉ điều tra).
3. Mọi đo stabilize CHƯA dùng `-threads 1` vẫn chạy ≥3 lần + báo spread
   (nợ từ đợt 65, chưa đóng — chỉ nới lỏng khi cách khử đã vào code).
4. Chưa kiểm chứng trên ffmpeg/libvidstab phiên bản khác (chỉ có
   ffmpeg 8.1.2 / libvidstab 1.1.0 trên VM này) và chưa kiểm chứng
   `-threads 1` trên footage thật / clip dài hơn 5s — kết luận có thể
   không áp dụng cho bản khác / clip khác.
5. E14-r3 MAD 12,1321 ≈ đối chứng (gần như mất hiệu ứng stabilize) là
   outlier đáng theo dõi: có lần chạy đa luồng gần như không stabilize —
   chưa rõ có phải cùng cơ chế hay lỗi riêng (chỉ 1 mẫu trong 45 lần).

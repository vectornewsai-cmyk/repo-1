# PHASE9 ROUND82 J4 — G2 vs G12 Hunt: kết quả + giới hạn

> Luồng J4, đợt 82 vòng lặp Phase 9 VCut Studio (lượt cron 21:35 +07, 10/11/2026).
> Nhiệm vụ: săn case phân biệt G2 vs G12 đầu tiên (mở rộng sweep ra ngoài
> 77 case cũ: nội dung mới, motion thật, thang/chu kỳ chưa đo) + đào sâu
> 2 case sát corr LỆCH (0,1207/0,1208). Không đổi luật gate, không sửa
> production. Test kiểm chứng: `node apps/web/scripts/test_round82_j4_g2g12.mjs`
> — **ALL PASS (32/32)**.

## 1. Kết quả chính (headline)

- **G2 vs G12 vẫn 0 case phân biệt** sau 75 case sweep I4 + **6 case capture
  mới đợt 82** (3 media motion × n05/n10). G1 vs G2 cũng chỉ 1 case duy
  nhất (F7-w2240-n10, biên 0,0008, từ I4). Bound mới: **Q4-gate = 0/81
  case** (75 + 6); near-miss gần nhất vẫn là B1-w1280-ocean-n05 tiền-fix,
  plainMad 2,5426 — vượt ngưỡng 2,5 chỉ 0,0426.
- **2 case sát corr đã giải thích xong:** LỆCH chỉ do corr RG vượt ngưỡng
  0,12 một lượng 0,0007/0,0008; kurt qua (max 0,3102/0,2485 < 0,35);
  cơ chế là d0 G-dominated (d0std [~1,1; ~4,4; ~0,6]) kéo corr RG của
  preview +0,1501/+0,1266; trừ d0 xong corr về sát render (diff
  0,0294/0,0058). Verdict noD0 LỆCH là ĐÚNG theo thiết kế. Ngưỡng 0,12
  nằm ngay trong phân bố pull của tp (0,11–0,15) nên case tp nào LỆCH
  phụ thuộc offset corr phía render, không phụ thuộc luật.
- **resid là tính chất của ĐƯỜNG MEDIA, không phải của chuyển động hay
  độ chi tiết.** Mọi media h264 tự build đều có residStd_R ~0,60–0,75
  bất kể 1280 hay 1920, still hay motion — trong khi slovenska.webm
  (VP9, 1920) đo 2,947 và test-pattern (h264 1280) đo 4,46. Hai giả
  thuyết đã bị bác bằng đo trực tiếp (xem §3).
- **Giả thuyết còn sống duy nhất cho resid 2,95 của webm: (a) CODEC** —
  Chrome decode VP9 (webm, color untagged) vs h264 khác đường convert
  YUV→RGB so với render ffmpeg bt709. Giả thuyết (b) x264 crf 18 làm
  mượt chi tiết đã YẾU sau test detail @1920 (§3.3). **Thí nghiệm quyết
  định (transcode webm→h264-1920 + capture) CHƯA CHẠY ĐƯỢC — bị chặn
  bởi sóng EPERM tái phát (§5). Đây là nợ mở lớn nhất của đợt.**

## 2. Số đo chính (10/11/2026, rect 809×455, window w1920x1080)

| Media (capture mới) | plainMad | d0stdR | residStd_R | ratioR | Verdict (4 luật) |
|---|---|---|---|---|---|
| blend-motion-tp-slov-a88 (1280, motion) | 1,0823 | 2,3332 | 0,6486 | 3,5973 | KHÔNG-d0, 2/2 |
| slovenska-720p.mp4 (1280, đối chứng) | 0,6921 | 0,117 | 0,7493 | 0,1561 | KHÔNG-d0, 2/2 |
| blend-1920-tp-slov-a88 (1920, motion) | 1,0921 | 2,3416 | 0,6027 | 3,885 | KHÔNG-d0, 2/2 |
| F7 slovenska.webm (1920, VP9 — đối chiếu) | 1,819 | 0,207 | **2,947** | — | — |

- Capture nào cũng 3/3 pass (D1 plain pixel-identical, D3 cùng-khung
  hash+ct, H9 0 lỗi trang); proxyUsed=false. rawHash: a88-1280 `3286e9d1`,
  slov-720p `378003f0`, blend-1920 `95a589c3`.
- Điểm luật raw @0,35 trên 69 case chấm được (sweep I4): R0 61/69,
  G1 67/69, G2 68/69, G12 68/69.
- Corr decompose (6 case, `r82j4-corr-decompose.json`): Y2a RG noD0
  0,1207 → fullD0 0,0294, pull +0,1501; Y2b RG noD0 0,1208 → fullD0
  0,0058, pull +0,1266; đối chứng tp F7-w2240 pull +0,1099 diff 0,1025;
  G6-w2048 pull +0,1095 diff 0,1019; ocean D2 pull +0,0067; B1 ocean
  diff 0,2532 nhưng pull chỉ +0,0175 (LỆCH do mismatch tiền-fix).

## 3. Chẩn đoán resid — giả thuyết nào sống, giả thuyết nào chết

Định nghĩa nhắc lại: Q4 = `d0std_R > 2 ∧ ratio_R ≤ 1 ∧ plainMad ≤ 2,5`
(điều kiện CẦN để G2/G12 có thể phân biệt). Muốn Q4 cần residStd_R lớn
(≥ d0std_R ~2,3). Mô hình dự đoán resid đã sai 2 lần liên tiếp.

### 3.1 "Motion giết resid" — SAI (blend-motion 1280)
Dự đoán resid ≈ 2,61 (từ cha 1920), đo được **0,65**. Chẩn đoán: resid
là tính chất đường media — media 1920-native có preview 1-bước
(1920→viewport) vs render 2-bước (1920→1280 + trilinear) → resid 2,95;
media 1280-native cả hai 1-bước → resid 0,65–0,75 (đo trực tiếp:
slovenska-720p @809 resid 0,7493 vs webm 2,947, cùng nội dung/khung/
rect). Đối chứng plain slovenska-720p @w1920: resid 0,7493 — cùng nội
dung, cùng khung t=1,0s, cùng rect với F7 (2,947).

### 3.2 "Đường 1920" — SAI (blend-1920)
Dự đoán resid ≥ 2,6 (0,88 × 2,95), đo được **0,60**. Blend 1920 dùng
cùng phương pháp render C3 như F7 (đã kiểm chứng provenance: xem §4).
Mô hình "trộn tuyến tính resid" vỡ: resid(blend) ≈ 0,60 << √(0,12²·r_tp²
+ 0,88²·2,95²) ≈ 2,60 — nghĩa là resid KHÔNG cộng tuyến tính theo
nội dung, hoặc resid của webm không phải là tính chất của nội dung slov
mà của đường decode VP9.

### 3.3 "x264 crf 18 làm mượt chi tiết" — YẾU (test detail @1920)
So sánh frame 1920 native: blend-1920 f30 vs webm f25 (`r82j4-detail1920.mjs`):
frac>8 và mean|Δ| của thành phần slov BÊN TRONG blend (phân rã tuyến
tính với tp: (blend − 0,12·tp)/0,88) so với webm gốc — ratio per-kênh:
fracGt8H [1,12; 0,93; 0,86], fracGt8V [1,07; 0,84; 0,85],
meanAbsH [1,10; 1,04; 1,07], meanAbsV [1,11; 1,04; 1,09] — tức detail
tương đương, thậm chí cao hơn nhẹ. x264 crf 18 KHÔNG làm mượt chi tiết
tần số cao ở mức metric này. (Caveat: resid có thể nhạy với cấu trúc
mịn hơn mà frac>8/meanAbs không bắt được — ví dụ chroma HF hay phase
sub-pixel — nhưng gánh nặng chứng minh giờ thuộc về giả thuyết (b).)

### 3.4 "Tham chiếu C3/bicubic cũ làm phồng resid F7" — CHẾT
`fullrgb-slovenska-plain.raw` == file C3 (md5
`f633c5569e431cc014f40c2028b612f3`), khác C0/C1/C2. F7 đo 2,947 bằng
đúng tham chiếu C3 trilinear — cùng method với blend-1920 của J4.

### 3.5 Còn sống: (a) CODEC (VP9 vs h264) — chưa chứng minh
Ứng viên duy nhất còn đứng: Chrome decode VP9 (webm untagged
color_space=unknown) khác đường convert YUV→RGB so với h264 bt709-tagged,
tạo resid hệ thống ~2,9. Thí nghiệm quyết định: transcode webm→h264-1920
(cùng nội dung/khổ, khác codec) + capture @w1920 — resid rớt về ~0,6 thì
(a) đúng; giữ ~2,9 thì (a) sai, phải tìm cơ chế khác (vd: VP9
loop-filter/deblock khác, hoặc metadata color của webm). **Chưa chạy
được vì sóng EPERM (§5).** Nếu (a) đúng, hướng săn Q4 tiếp theo là:
encode media săn Q4 bằng VP9 (hoặc tìm codec/container khác cho resid
cao), KHÔNG phải blend/motion/chroma.

## 4. Kiểm chứng đã làm (xanh)

- Corr-decompose: 6 case, exit 0 (~4,4 phút).
- Media build 1280: 4 media (blend a88/a85, chroma s16/s12), exit 0
  (~7,3 phút). Chuỗi Z2 MAD=0; motion f30-vs-f45 MAD 17,5–23,3; blend
  check MAD 3,94/4,19 (YUV420-blend vs RGB-blend + encode — chênh
  phương pháp đã biết, không phải sai trọng số; đã xác nhận bằng mean
  frame); chroma check s16 stdCb ×9,37 / stdCr ×16,80, s12 ×7,30/×12,93.
- Screen motion: 4 media × 7 rect (~15 phút, exit 0). d0std_R trên
  frame decode: a88 2,31–2,34; a85 2,68–2,71; s16 2,15–2,20; s12 1,79–1,83.
- Build blend-1920 + render C3: exit 0; MOTION MAD 18,04; BLEND check
  MAD 3,53; plain C3 khớp blend 1280 ([22; 23,86; 23,52]).
- 3 phiên capture + sweep @w1920: mỗi phiên 3/3 pass; sweep JSON mỗi
  file 2 case, 4 luật 2/2.
- Provenance C3: md5 khớp như §3.4.
- Detail @1920: `r82j4-detail1920.mjs` — số liệu §3.3; test
  `test_round82_j4_g2g12.mjs` **ALL PASS 32/32** (corr 9 + capture 9 +
  bound I4 7 + detail 5 + tổng 2).
- `node --check` OK: `r82j4-headed-capture.mjs`, `r82j4-sweep.mjs`,
  `r82j4-detail1920.mjs`, `test_round82_j4_g2g12.mjs` (các script khác
  đã check OK trước đó).

## 5. Giới hạn trung thực / nợ mở

1. **Sóng EPERM TÁI PHÁT tối 10/11 (22:50–23:05 +07, 15:50–16:05 UTC)
   — chặn thí nghiệm quyết định.** ffmpeg ghi file thất bại liên tiếp:
   mp4 "Could not write header … Operation not permitted", mkv lỗi ở
   trailer, rawvideo lỗi ở packet, cả ghi ra pipe và /dev/shm; 13 lần
   thử transcode liên tiếp (15:50–16:01, gồm vòng 8 lần có sleep 15s)
   đều fail; node `writeFileSync` cũng fail rải rác (1 lần 15:53; JSON
   detail1920 fail 5/5 retry lúc ~16:02); `head` ghi file cũng EPERM
   lúc 15:59. Ngược lại bash `echo >`, `dd` 50 MB, và ghi qua
   muse.write vẫn qua ở các thời điểm xen kẽ (15:56 probe bash/dd/node
   đều OK). Sóng chập chờn theo giây, không theo đường dẫn hay
   filesystem (/tmp tmpfs và /home đều bị). Sóng này từng được ghi là
   "đã hết" 2 lần trong đợt 81 — nay tái phát. **Hậu quả trực tiếp:
   file `media/slovenska-1920-h264.mp4` còn 0 byte (đã xoá sau khi
   vòng retry kết thúc); transcode + render + capture slov-1920-h264
   chưa chạy; hướng (a) codec chưa được chứng minh hay bác bỏ.**
   Lệnh tái lập (chạy lại khi sóng hết):
   `ffmpeg -v error -y -i ../round67-u3/media/slovenska.webm -t 4 -an -c:v libx264 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -crf 18 -g 25 media/slovenska-1920-h264.mp4`
   rồi render frame 25 bằng C3 + noise05/10 (theo mẫu
   `r82j4-media-build1920.mjs`, đổi frame 30→25), rồi capture
   `R82J4_NAME=slovenska-1920-h264 R82J4_FILE=media/slovenska-1920-h264.mp4`
   + sweep. Nếu sóng còn kéo dài, cân nhắc encode bằng node (pipe) hoặc
   đợi lượt sau — không tự ý đổi crf/codec vì sẽ làm mất tính quyết định
   của test.
2. **Các capture còn lại trong kế hoạch cũ KHÔNG chạy** (s16 @w1920,
   a88/a85/s16 @w1440, s12 đối chứng): mô hình resid đã vỡ nên giá trị
   thấp; chỉ chạy lại nếu chẩn đoán (a) cho hướng mới. Media s16/s12/a85
   đã build xong vẫn nằm ở `hidden_files/round82-j4/media/` để dùng sau.
3. **Cb hụt khi chroma-scale bằng geq** (s16 stdCb ×9,37 thay vì ×16;
   s12 ×7,30 thay vì ×12; Cr đúng) — chưa phân biệt geq vs x264.
   Không ảnh hưởng kết luận J4 (chroma không được dùng để săn Q4 sau
   khi resid vỡ), nhưng ai dùng lại media s16/s12 cần biết.
4. **Screen JSON 4-media bị ghi đè** (`r82j4-screen-motion.json` hiện
   chỉ còn entry blend-1920): số 4 media gốc còn trong
   `r82j4-screen-motion.log`. Lỗi vận hành của J4 — script screen ghi
   đè thay vì append theo media. Không ảnh hưởng kết luận (số đã trích
   vào log luồng + test không phụ thuộc file này).
5. **2 case a65 thiếu trong sweep không-làm-tròn đợt 81** (snapshot bị
   ghi đè, xem I4 LIMITS §2.2) — vẫn thiếu, không ảnh hưởng kết luận J4.
6. **Bound "G2 vs G12 không phân biệt được" chỉ là bound thực nghiệm
   trên 81 case**, không phải chứng minh toán học: Q4 cần đồng thời
   d0std_R > 2, ratio_R ≤ 1, plainMad ≤ 2,5 — trong 81 case, điều kiện
   ratio ≤ 1 chỉ xảy ra khi plainMad > 2,5 (12 case tiền-fix ocean,
   gần nhất 2,5426) hoặc khi d0std_R ≤ 2. Nếu tồn tại nội dung cho
   resid lớn mà plainMad nhỏ (vd: codec VP9 — xem §3.5), Q4 vẫn có thể
   xuất hiện. Đừng đọc bound này như "G2 == G12 mãi mãi".
7. **delta0 chỉ là hiệu chỉnh đo lường trong harness**, KHÔNG nằm trong
   production. Không đổi luật gate, không sửa production trong đợt này.
   `delta0-harness.mjs` không sửa.

## 6. File của đợt (stage, KHÔNG push)

Script mới trong `apps/web/scripts/` (text, stage được):
- `r82j4-corr-decompose.mjs` — phân rã corr 2 case Y2 + 4 đối chứng.
- `r82j4-media-build.mjs` — build 4 media motion 1280.
- `r82j4-screen-motion.mjs` — screen d0std_R theo rect (đã sửa isBlend
  prefix `"blend-"`).
- `r82j4-media-build1920.mjs` — build blend 1920 + render C3.
- `r82j4-headed-capture.mjs` — capture headed (copy r81i4, đường dẫn
  → round82-j4, env `R82J4_NAME`/`R82J4_FILE`).
- `r82j4-sweep.mjs` — sweep (copy r81i4; tên JSON kèm window).
- `r82j4-detail1920.mjs` — so sánh detail @1920 + phân rã slov-in-blend.
- `test_round82_j4_g2g12.mjs` — test kiểm chứng 32 khẳng định, ALL PASS.

Docs: `docs/PHASE9_ROUND82_J4_G2G12_HUNT_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round82-j4-g2g12-hunt.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage — binary/JSON/log):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round82-j4/`
(log luồng `../round82-j4.md`; `r82j4-*.json`; `media/` 5 mp4; `render/`
`*.raw`/`*.yuv`; `headed-w1920x1080/`; snapshot backup `snaps-*.json`).

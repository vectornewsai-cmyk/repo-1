# PHASE9_ROUND88_P4 — Trackgeq với track nhiều điểm + combo chưa test (nợ O3)

- Đợt: 88, luồng P4. Ngày: 2026-11-11. VM: 4 vCPU EPYC 9D25, RAM khả dụng
  ~1–1,9 GB lúc đo, ffmpeg 8.1.2, node 24. **Tất cả render chạy trong lúc
  8+ luồng đợt 88 khác đang chạy song song** — fps dưới đây là cận dưới
  theo tải VM, không phải benchmark phòng sạch (xem O7 về độ dao động fps).
- Harness: `server/render/src/test_round88_p4_trackgeq_limits.js`
  (sections a-cal / a / b1 / b2 / b3 / b4 / depth) — **34 pass, 0 fail**.
- Không push. Không release/tag. Không đụng TTS 39, không đụng file workflow,
  không nối preview web (theo nhiệm vụ luồng — để riêng).

## 0. Tóm tắt

Nợ O3 (LIMITS gộp đợt 87 §4 mục 9) **ĐÃ ĐÓNG HẾT**:
(a) track 240 điểm render thật 720p — tâm mask khớp track tới ±0,1px;
(b) trackgeq + clip merged (cả 2 clip mask+track, đo cả trong vùng fade),
+ speed-ramp, + compound clip (nested), + ramp + minterpolate — tất cả
đúng, T của geq là thời gian output (clip-local).

**Phát hiện chính — LỖI THẬT, đã sửa:** trước đợt này, track >82 điểm làm
mọi render trackgeq **fail cứng** (exit 2), track >92 điểm làm mọi render
có D3-shift / sticker / text-track **fail cứng** — do bộ phân tích biểu
thức của ffmpeg giới hạn độ sâu lồng nhau (~100) mà `buildAxisExpr` sinh
chuỗi if lồng tuyến tính sâu = số điểm. Claim của O3 rằng "track 240 điểm:
ffmpeg chấp nhận (dry-run parse OK)" là **SAI** — dry-run của render.js
chỉ in filter graph, không đưa biểu thức qua ffmpeg. Đã sửa bằng cây if
cân bằng trong `buildAxisExpr` (cùng giá trị nội suy, độ sâu ~log2(N)+2),
có hồi quy đầy đủ (§2). Validator vẫn cho tối đa 240 điểm — nay 240 điểm
render được thật ở mọi đường dùng biểu thức.

## 1. Lỗi thật: giới hạn độ sâu biểu thức của ffmpeg (đo trước khi sửa)

Chuỗi if của `buildAxisExpr` (tracking.js, dùng chung cho geq động,
overlay D3, drawtext text-track, sticker-track) lồng sâu = số điểm.
ffmpeg 8.1.2 từ chối parse khi vượt ngưỡng (lỗi
`[Eval] Missing ')' or too many args in 'if(lt(...` → `Error initializing
filters`, render exit 2, output 0 byte).

Ngưỡng đo bằng probe nhị phân (1 frame nullsrc, biểu thức sinh từ code
thật — script probe ở /tmp, xem §8):

| Đường | N lớn nhất OK | N đầu tiên FAIL |
|---|---|---|
| axis expr trần trong geq | 94 | **95** |
| biểu thức mask geq đầy đủ (ellipse 720p) | 82 | **83** |
| overlay x (D3 / sticker) | 92 | **93** |

Render thật trước khi sửa (đều fail ở khởi tạo filter, exit 2):
- trackgeq, track 240 điểm, 360p 2s: fail, biểu thức 30.630 ký tự.
- D3 overlay, video clip track 100 điểm, không mask, 360p 2s: fail,
  output 0 byte (chứng minh lỗi không chỉ của geq — mọi đường dùng
  `buildAxisExpr` đều dính).

Hệ quả trước fix: spec hợp lệ theo validator (tối đa 240 điểm) vẫn crash
render — ở cả mode mặc định (clip track không mask dùng D3-shift) chứ
không riêng mode trackgeq.

## 2. Fix tối thiểu: cây if cân bằng trong `buildAxisExpr`

File: `server/render/src/tracking.js` (chỉ 1 hàm + self-test; không đụng
file khác, không đụng validator, không đổi semantics).

- Trước: chuỗi tuyến tính `if(lt(T,t1),seg0,if(lt(T,t2),seg1,...))` — độ sâu
  lồng = N (+2 if kẹp 2 đầu).
- Sau: cây cân bằng trên các đoạn — nút rẽ tại biên t của đoạn giữa
  (`lt(T, t_{mid+1})` → nửa trái, còn lại → nửa phải), lá = 1 đoạn lerp.
  Độ sâu ≈ log2(N)+2 (240 điểm → ~10; đo độ sâu ngoặc tối đa trong
  self-test: ≤30 cho cả biểu thức 240 điểm gồ ghề).
- Giá trị nội suy **giữ nguyên hệt**: cùng các đoạn lerp, cùng kẹp 2 đầu,
  chỉ đổi thứ tự rẽ nhánh. Tại đúng biên, nhánh phải cho p=0 → đúng giá
  trị điểm biên (hàm liên tục). Track 1 điểm vẫn là hằng số (không if);
  track 2 điểm vẫn 1 đoạn lerp + kẹp 2 đầu.

Kiểm chứng fix (không chỉ tin vào lý luận):
- `tracking.js --self-test` pass, gồm check mới: track gồ ghề 240 điểm
  (seed cố định) đánh giá bằng mini evaluator tại 9 mốc t (kẹp trái/phải,
  đúng biên, giữa đoạn) khớp nội suy JS trong 1e-4 — dung sai 1e-4 vì
  `ffNum` làm tròn hằng số về 6 chữ số thập phân (sai số có sẵn từ chuỗi
  cũ, ≈0,1px @1280), không phải do cây cân bằng; y hằng 0,5 khớp 1e-9.
- Probe parse sau fix: axis-geq / mask-geq / overlay đều **OK ở N=240**
  (harness section `depth`, 3/3).
- Render thật D3 100 điểm sau fix: exit 0, 1,5s, duration 2,0s (trước
  fix exit 2).
- Hồi quy: `test_d3_trackfollow.js` **22/22** (text+video bám track,
  render thật, tâm 239,5/399,5 vs kỳ vọng 240/400); `test_q5.js`
  **25/25** (sticker bám track + voice); `mask.js --self-test` pass;
  `tracking.js --self-test` pass. Không chạy lại toàn bộ harness O3
  (~11 phút) — đường geq 3 điểm của nó được bao bởi B2/B3 dưới đây
  (cùng `buildMaskTrackGeqExpr`/`buildAxisExpr`) + evaluator ở D3.

## 3. (a) Track 240 điểm render thật

Track tuyến tính 0,2→0,8, y=0,5, ellipse w=h=0,3, feather 0,2, nguồn đỏ
phẳng, `--mask-mode trackgeq`. Biểu thức geq ellipse 720p: **30.606 ký tự**
(O3 đo 30.638 — chênh do làm tròn, cùng bậc).

| Render | Wall | fps | t=0,5 | t=2,0 / 1,0 | t=3,5 / 1,5 |
|---|---|---|---|---|---|
| 360p 2s (hiệu chuẩn) | 20,7s | 2,90 | 224,0 (kỳ vọng 224) | 320,0 (320) | 415,9 (416) |
| **720p 4s** | 175,5s | **0,68** | 352,0 (352) | 640,0 (640) | 928,1 (928) |

Tâm mask khớp track tới **±0,1px** ở cả 3 thời điểm, cả 2 độ phân giải.
Không fail, không timeout (timeout render đặt 3600s). 720p chạy song song
với B1 + các luồng đợt 88 khác nên 0,68 fps là cận dưới theo tải; so với
O3 (3 điểm, chạy gần như một mình): 1,14 fps. Cây cân bằng không làm
240 điểm chậm hơn đáng kể so với 3 điểm — chi phí geq nằm ở đánh giá
biểu thức từng pixel nói chung, không phải số điểm (khác hẳn ngoại suy
~40 phút của O3, vốn giả định chuỗi if tuyến tính).

## 4. (b1) Trackgeq + clip merged — CẢ 2 clip mask+track (mở rộng O6 C6)

O6 C6 chỉ test clip đầu có mask+track, đo trước vùng fade. Luồng này:
c1 nguồn đỏ phẳng 4s, track 0,2→0,8; c2 nguồn xanh lá phẳng 4s, track
0,7→0,3; `transitionOut: fade 0,5s`; ellipse 0,3/feather 0,2 cả 2 clip.
Render 720p trackgeq: lần 1 **288,8s** (chạy song song với section A),
chạy lại **168,6s** (225 frame → 0,78–1,34 fps tùy tải). Duration output
**8s** — đúng (D = declaredEnd muộn nhất = 8s; unit merge dài 7,5s,
0,5s cuối là nền đen).

| Đo | Kỳ vọng | Đo được | Kết quả |
|---|---|---|---|
| A (đỏ) t=0,5 | 352 | 351,8 | ✅ −0,2px |
| A (đỏ) t=2,0 | 640 | 640,0 | ✅ 0,0px |
| **Trong fade t=3,75** (hợp 2 mask) | tâm ~920, rộng ~496 | tâm **919**, rộng **483**, [678, 1160] | ✅ |
| B (xanh lá) t=5,0 (local 1,5) | 704 | 704,0 | ✅ 0,0px |
| B (xanh lá) t=6,5 (local 3,0) | 512 | 512,0 | ✅ 0,0px |

Trong vùng fade, vệt sáng = **hợp của 2 mask** (A local 3,75 → 0,7625;
B local 0,25 → 0,675; hợp dự kiến [0,525, 0,9125] = [672, 1168], tâm
920, rộng 496) — đo được [678, 1160], tâm 919, rộng 483: hai biên thụt
vào ~6–8px do ngưỡng quét cắt phần feather mềm, đúng bản chất. Kết luận:
**mask của cả 2 clip đều bám đúng track của chính nó qua transition**,
kể cả trong vùng crossfade (xfade trộn 2 stream yuva420p đã mask đúng).

Lỗi harness của chính luồng này (đã sửa, ghi trung thực): lần chạy đầu
kỳ vọng duration 7,5s (nhầm duration unit merge với duration output) →
1 fail giả; kỳ vọng đúng là 8s (cùng kết luận O6 C6). Đã sửa harness và
chạy lại B1: **7/7 pass**.

## 5. (b2) Trackgeq + speed-ramp — T là thời gian output

Clip đỏ 720p 4s output, `speedKeyframes` linear 0,5x→2x trên [0,2] rồi
2x trên [2,4] (nguồn tiêu thụ ∫=6,5s ≤ 8s), track 0,2→0,8 theo thời gian
**output**. Nếu T là thời gian nguồn (sai) thì t=2,0 sẽ cho 0,575 (736px)
và t=3,5 sẽ cho kẹp 0,8 (1024px) — phân biệt rõ với kỳ vọng output.

Render 113,7s (1,06 fps), duration 4s đúng. Tâm đo: t=0,5 → **351,8**
(kỳ vọng 352); t=2,0 → **640,0** (640); t=3,5 → **928,1** (928).
**Kết luận: T của geq là thời gian output (clip-local), không phải thời
gian nguồn — ramp không làm lệch mask.** Mask áp sau concat+fps của
ramp nên timestamp đã là thời gian output, đúng như thiết kế.

## 6. (b3) Trackgeq + compound clip (nested sequence)

Leaf clip (đỏ 720p 4s, mask+track tuyến tính 0,2→0,8) trong subSpec của
clip nested đặt ở outer start=1, duration 4. Render 108,6s (1,11 fps),
duration output 5s đúng (1+4). Tâm đo tại timeline t=1,5/3,0/4,5 (local
0,5/2,0/3,5): **351,8 / 640,1 / 928,0** vs kỳ vọng 352/640/928 (lệch
≤0,2px). **Kết luận: flatten nested giữ nguyên mask+track của leaf clip,
thời gian track vẫn clip-local** — không bị dịch sai khi qua cửa sổ nested
(trường hợp này win.in=0, không trim; trường hợp trim/speed ở cửa sổ
nested chưa test — xem §9).

## 7. (b4) Trackgeq + speed-ramp + motion interpolation

Clip đỏ 360p 2s output, ramp 0,5x→2x (∫=3,25s ≤ 4s nguồn),
`motion: { interpolation: "minterpolate" }`, track 0,2→0,8 theo output.
Render 38,3s (1,57 fps), duration 2s đúng. Tâm đo: t=0,5 → **224,1**
(224); t=1,0 → **319,9** (320); t=1,5 → **415,9** (416).
**Kết luận: minterpolate sau ramp không làm lệch T — mask vẫn bám đúng
theo thời gian output.**

## 8. Ngưỡng & khuyến nghị (cho parent quyết)

- **Không cần giới hạn số điểm thực tế nữa:** 240 điểm (tối đa validator)
  render được thật ở mọi đường dùng biểu thức (geq, overlay, drawtext)
  sau fix. Khuyến nghị cũ của O3 (≤20 điểm) **hết hiệu lực về mặt đúng/
  sai** — chỉ còn là khuyến nghị hiệu năng (xem dưới). Validator giữ
  240, không cần đổi.
- **Tốc độ trackgeq vẫn chậm:** 720p ~0,7–1,1 fps dưới tải đợt này
  (3 điểm: 1,14 fps — O3; 240 điểm: 0,68 fps — cùng bậc). Đường PNG mặc
  định nhanh hơn ~10–19× (O7: tracked 10,9–18,9 fps). **Giữ nguyên khuyến
  nghị O3: KHÔNG đưa geq động vào production, KHÔNG làm mặc định** — giữ
  sau cờ `--mask-mode trackgeq` làm fallback khi `mask_anim.py` thất bại.
- **Preview web cho trackgeq: CHƯA nối** (theo nhiệm vụ luồng — để riêng,
  tránh xung đột). Preview hiện chỉ khớp đường png (O4).
- **Đính chính O3:** claim "track 240 điểm: ffmpeg chấp nhận (dry-run
  parse OK)" là sai — dry-run không parse biểu thức qua ffmpeg. Trước fix,
  240 điểm fail cứng. Số đo §1 thay thế claim đó.

## 9. Nợ mở

- Harness O3 đầy đủ (~11 phút) chưa chạy lại sau fix — đường geq 3 điểm
  của nó đã được bao bởi B2/B3 + evaluator D3 + self-test, nhưng chưa có
  lần chạy nguyên harness O3 trên cây đã sửa.
- Compound clip với cửa sổ nested có trim/speed (win.in>0, ramp): track
  của leaf clip có được remap đúng không — chưa test (B3 chỉ test
  win.in=0, không trim, không speed).
- Track + transition kiểu khác ngoài fade (wipe/slide/fx): B1 chỉ test
  fade; các kiểu xfade khác dùng chung đường mask pre-xfade nên kỳ vọng
  đúng, chưa đo.
- Preview web cho trackgeq chưa nối (xem §8).
- Probe nhị phân ngưỡng độ sâu (§1) là script chẩn đoán ở /tmp
  (`/tmp/r88p4-probe-depth.cjs`, có thể mất khi VM reset) — số liệu đã
  ghi ở §1; hồi quy bền vững nằm trong harness section `depth` + self-test
  tracking.js (độ sâu ngoặc ≤30 cho 240 điểm).

## 10. File đã đổi & kiểm chứng

- `server/render/src/tracking.js` — cây if cân bằng trong `buildAxisExpr`
  + self-test mới (evaluator + track gồ ghề 240 điểm + kiểm tra độ sâu).
- `server/render/src/test_round88_p4_trackgeq_limits.js` — harness mới
  (a-cal / a / b1 / b2 / b3 / b4 / depth).
- `docs/PHASE9_ROUND88_P4_TRACKGEQ_LIMITS.md` — file này.
- Không đụng `render.js`, `mask.js`, validator, preview, TTS 39, workflow.

Kiểm chứng tổng: harness P4 **34/34** (a-cal 4, a 5, b1 7, b2 5, b3 5,
b4 5, depth 3); `tracking.js --self-test` pass; `mask.js --self-test`
pass; `test_d3_trackfollow.js` 22/22; `test_q5.js` 25/25. Không chạy
`tsc`/`vite build` (không đụng code TS/web — chỉ sửa 1 file JS render +
thêm 1 file test JS + docs; `node --check` pass cho cả 2 file JS).

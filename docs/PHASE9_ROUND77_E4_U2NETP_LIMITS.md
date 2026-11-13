# LIMITS — Phase 9 đợt 77, luồng E4: u2netp end-to-end — KHÔNG thay u2net

Ngày: 10/11/2026 (lượt cron 03:35 +07; chạy 20:43–21:45). Đóng nợ đợt 76
D7 §5 mục 1 ("u2netp — test video rồi mới quyết"). KHÔNG push, KHÔNG
release/tag, KHÔNG binary, KHÔNG sửa production (`bgremove.py` giữ nguyên).
Mọi số dưới đây là số đo thật trên VM này (2 vCPU / 8 GB, trần cell 6,0 GiB).

## 0. Kết luận — tóm tắt

**u2netp KHÔNG thay được u2net làm fallback chính thức. Giữ u2net.**

u2netp nhanh hơn thật (1,5–2,4×) và nhẹ RAM hơn thật (đỉnh 0,65–0,73 GiB
so với 1,05–1,22 GiB), model chỉ 4,57 MB (MIT, cùng họ u2net) — nhưng
**mask khác xa u2net trên 2/3 clip**: IoU@128 chỉ 0,63 (chân dung) và
0,69 (cảnh bàn làm việc), MAD tới 0,13 (33/255), 25,8% pixel lệch >32
trên clip C. Chỉ cảnh đơn giản (cột đèn đêm, IoU 0,86) hai model mới
đồng thuận. Đối chiếu trực quan xác nhận lỗi thật của u2netp: trên ảnh
chân dung, u2netp **bỏ toàn bộ váy tối màu của người mẫu** (vùng đỏ
bất đồng = đúng cái váy; u2net bao trọn người). Đây là lỗi mất vùng
tiền cảnh, không phải "cắt gọn hơn". Vì vậy không nối u2netp vào bất
kỳ đường bgremove nào; u2net vẫn là fallback chính thức duy nhất.

| Tiêu chí thay thế (đặt trước khi đo) | Kết quả | Đạt? |
|---|---|---|
| Tốc độ u2netp ≥ u2net (cùng clip/độ phân giải) | 1,54× / 1,57× / 2,28× / 2,38× / 2,19× (mask A480, A640, B480, C480, alpha A480) | ✅ |
| Đỉnh RSS ≤ u2net | 0,65–0,73 GiB vs 1,05–1,22 GiB | ✅ |
| Mean IoU@128 ≥ 0,85 | 0,63 / 0,63 / 0,86 / 0,69 (chỉ clip B đạt) | ❌ |
| MAD ≤ 15/255 (0,0588) | 0,0745 / 0,0745 / 0,0057 / 0,130 (chỉ clip B đạt) | ❌ |
| fg% không lệch quá 8 điểm phần trăm | A: 19,0→11,9 (−7,1, vừa trong ngưỡng nhưng là mất váy); C: bg lệch 15,6 điểm (69,1→53,5) | ⚠️/❌ |
| Mask+alpha end-to-end qua suite chuẩn | test_bgremove.py --session u2netp: **TẤT CẢ TEST PASS, EXIT=0** (mask fg 11,8%, alpha rgba 86,8%/11,8%) — xem §5 | ✅ |

## 1. Phương pháp đo

- Test mới: `server/bgremove/test_round77_e4_u2netp.py` (+ phần 2
  `test_round77_e4_u2netp_part2.py` — phần 1 abort ở assert fg>10
  trên clip B, xem §4).
- Video mẫu 3 s / 90 frame, 640×640, ffmpeg `-loop 1` từ ảnh thật:
  - Clip A: `scratch-bgremove/person.jpg` (chân dung nữ ngồi ngược sáng,
    váy tối màu — cùng ảnh W1/D7).
  - Clip B: `scratch-bgremove/p_1.jpg` (cột đèn đường trong tuyết đêm —
    vật thể chung, KHÔNG phải chân dung).
  - Clip C: `scratch-bgremove/p_3.jpg` (bàn làm việc: túi da, tay, ly,
    điện thoại, tablet — cảnh phức tạp nhiều vật thể).
- Mỗi clip × mỗi session (u2net, u2netp) × max-side 480 và 640 (clip A),
  480 (clip B, C): chạy `bgremove.py --mode mask --temporal 0 --feather 0`
  (mask THÔ — tắt EMA/feather mặc định để so sánh công bằng đúng model).
  Thêm mode=alpha clip A @480 cả 2 session để so sánh kênh alpha
  LOSSLESS (alpha.mov PNG; mask.mp4 là x264 crf 18 nên có nhiễu nén nhỏ).
- Đo mỗi run: wall time, s/frame, fps, đỉnh RSS (wait4 rusage của đúng
  process con), loadavg + RAM trống đầu/cuối. So sánh từng frame:
  IoU@128, MAD (/255), % pixel |diff|>32, fg% (>200) / bg% (<55).
- Chuẩn bị model: copy `~/.rembg/models/u2netp/u2netp.onnx` (4.574.861
  byte, md5 8e83ca70e441ab06c318d82300c84806 — khớp checksum rembg) sang
  `~/.u2net/u2netp/u2netp.onnx` vì `bgremove.py --model-dir ~/.u2net`
  đặt U2NET_HOME làm rembg tìm model ở đó; model là cache ngoài repo,
  không stage, không sửa production.

## 2. Tốc độ và RAM — u2netp thắng rõ, nhưng số tuyệt đối nhiễu tải máy

10 run × 90 frame (900 frame mỗi session). Máy chạy song song 8–10
luồng đợt 77 (loadavg dao động 0,8–14,9 trong các run; có lúc E3 vidstab
chạy cùng) nên fps tuyệt đối KHÔNG phải baseline sạch — chỉ tỉ số
u2netp/u2net trong cùng điều kiện mới có ý nghĩa, và tỉ số này ổn định.

| Run (90 frame) | u2net | u2netp | Tỉ số |
|---|---|---|---|
| mask A @480 | 246,1 s → 0,37 fps, RSS 1,17 GiB | 158,6 s → 0,57 fps, RSS 0,65 GiB | **1,54×** |
| mask A @640 | 297,7 s → 0,30 fps, RSS 1,22 GiB | 189,6 s → 0,47 fps, RSS 0,73 GiB | **1,57×** |
| mask B @480 | 512,8 s → 0,18 fps, RSS 1,05 GiB | 221,1 s → 0,41 fps, RSS 0,73 GiB | **2,28×** |
| mask C @480 | 561,9 s → 0,16 fps, RSS 1,10 GiB | 235,0 s → 0,38 fps, RSS 0,73 GiB | **2,38×** |
| alpha A @480 | 569,8 s → 0,16 fps, RSS 1,16 GiB | 254,2 s → 0,35 fps, RSS 0,73 GiB | **2,19×** |

- u2net mask A @480 = 0,37 fps **khớp đúng baseline sạch W1 (0,37 fps)** —
  chứng tỏ pipeline u2net không hồi quy; các run 0,16–0,18 fps là do tải
  máy lúc chạy (load 7–15), không phải do code đổi. Cùng lý do, đừng lấy
  0,16 fps làm baseline mới của u2net.
- Single-image probe (đầu luồng, máy lặng hơn): u2netp predict 1,09 s,
  u2net 1,46 s; alpha u2netp mean 32,4 / >200=11,9% / <55=86,8% (khớp
  hệt D7 — model xác định, không ngẫu nhiên), maxrss 0,49 GiB;
  u2net alpha mean 49,6 / 19,0% / 79,9%, maxrss 0,85 GiB.
- Đỉnh RSS u2netp ổn định 0,65–0,73 GiB mọi run (video) — vừa thoải mái
  trong trần cell; u2net 1,05–1,22 GiB (khớp D7: 1,12 GiB).
- Về tốc độ/RAM, u2netp đạt cả 2 tiêu chí. Quyết định KHÔNG thay hoàn
  toàn do chất lượng mask (§3).

## 3. Chất lượng mask — u2netp KHÔNG tương đương u2net

So sánh từng frame (90 frame mỗi cặp; video tĩnh nên IoU min ≈ mean —
mask gần như không đổi giữa các frame, không phải flicker).

| Cặp so sánh | IoU@128 mean (min) | MAD mean (max) | \|diff\|>32 | fg% u2net → u2netp |
|---|---|---|---|---|
| mask A @480 | 0,6263 (0,6260) | 0,0745 (0,0746) | 8,6% | 19,0 → 11,9 |
| mask A @640 | 0,6269 (0,6267) | 0,0745 (0,0747) | 8,9% | 19,0 → 11,9 |
| mask B @480 | 0,8600 (0,8599) | 0,0057 (0,0057) | 1,1% | 3,8 → 3,5 |
| mask C @480 | 0,6898 (0,6868) | 0,1300 (0,1336) | 25,8% | 25,7 → 28,9 (bg 69,1 → 53,5) |
| alpha A @480 (lossless PNG) | 0,6262 (0,6257) | 0,0747 (0,0749) | 8,6% | 19,0 → 11,9 (opaque) |

- Alpha lossless khớp hệt mask-mode (IoU 0,6262 vs 0,6263) → **nhiễu
  nén x264 crf 18 không đáng kể**; khác biệt là của model, không phải
  của codec.
- Kết quả giống hệt ở @480 và @640 (fg 11,9% cả hai) → khác biệt là
  nội tại model, không phụ thuộc độ phân giải xử lý.
- Temporal coherence cả 2 model đều tốt (mean inter-frame diff 0,00–
  0,09 < 5,0) — video tĩnh, không flicker; không phải yếu tố phân biệt.

### 3.1 Đối chiếu trực quan clip A — u2netp mất váy tối màu

Ảnh đối chiếu `~/workspace/.tmp-r77e4/compare-A-480.png` (gốc | mask
u2net | mask u2netp; dưới-trái: đỏ = vùng 2 mask bất đồng >32):

- Người mẫu mặc **váy tối màu** (nửa dưới đen). Mask u2net bao trọn
  người kể cả váy. Mask u2netp chỉ có thân trên sáng màu (áo trắng,
  tóc, tay) và **bỏ toàn bộ váy** — vùng đỏ bất đồng phủ đúng cái váy
  cộng viền tóc. Đây là **mất vùng tiền cảnh**, không phải cắt gọn:
  váy tối bị lẫn với nền tối nên model nhẹ bỏ qua.
- Mask u2netp còn có vệt xám lạ ở góc trên-phải (vệt nắng) mà u2net
  không có.
- Hệ quả thực tế nếu đổi fallback: video người mặc đồ tối sẽ bị cắt
  mất phần thân dưới khi xoá nền — lỗi thấy được bằng mắt, không
  chấp nhận được cho fallback mặc định.

### 3.2 Clip C — hai model chọn vật thể khác nhau

Cảnh bàn làm việc nhiều vật thể: u2net fg 25,7% / bg 69,1%; u2netp
fg 28,9% / bg chỉ 53,5% (nhiều vùng xám trung gian hơn), MAD 0,13,
25,8% pixel lệch >32. Hai model không chỉ khác biên — chúng phân đoạn
cảnh phức tạp theo cách khác hẳn (khác vùng xám/vật thể được chọn).
Không có ground truth nên không kết luận bên nào "đúng" trên clip C,
nhưng **không thể coi u2netp là thay thế tương đương** khi mask khác
nhau tới mức này.

### 3.3 Clip B — trường hợp duy nhất đồng thuận

Cột đèn đêm trên nền đen: IoU 0,86, MAD 0,0057, fg 3,8% vs 3,5%.
Vật thể sáng, nhỏ, tương phản cao trên nền tối → hai model đồng thuận.
Chứng tỏ u2netp không phải lúc nào cũng sai — nó chỉ yếu ở (a) tiền
cảnh tối màu trên nền tối và (b) cảnh phức tạp nhiều vật thể. Đủ để
loại vai trò fallback chung, nhưng vẫn là ứng viên cho trường hợp
dùng hẹp (xem §6).

## 4. Sự cố trong lúc đo — assert fg>10 sai giả định (đã sửa)

- Phần 1 abort sau run mask B @480 (EXIT=1): assert `fg_pct > 10`
  (copy từ `test_bgremove.py`, giả định ảnh chân dung lấp khung hình)
  không đúng với clip B — ảnh cột đèn đêm có fg thật chỉ 3,8%
  (u2net) / 3,5% (u2netp). Không phải lỗi model, không phải lỗi
  pipeline: mask B vẫn có cả đen lẫn trắng, temporal diff 0,0.
- Đã sửa `test_round77_e4_u2netp.py`: ngưỡng fg>10 thành cảnh báo ghi
  log, chỉ assert mask không rỗng (fg>0,5, bg>10). Phần 2 chạy tiếp
  từ các file mask đã có trên đĩa (không chạy lại model), thêm clip C
  + alpha + ảnh đối chiếu, EXIT=0.
- Bài học cho test sau: ngưỡng fg>10 của `test_bgremove.py` chỉ đúng
  với ảnh chân dung mẫu `person.jpg`; test clip vật thể chung phải
  dùng ngưỡng riêng.

## 5. Suite chuẩn với session u2netp (mặc định production)

`test_bgremove.py --session u2netp --person .../person.jpg --keep`
(mặc định temporal 0,4 / feather 1 — đúng default production):

- **TẤT CẢ TEST PASS, EXIT=0** (chạy 21:45–21:53, log
  `~/workspace/.tmp-r77e4/test_bgremove_u2netp.log`):
  mask 90 frame, foreground(>200)=11,8%, background(<55)=86,7%,
  temporal coherence mean inter-frame diff = 0,00; alpha output
  pix_fmt=rgba, transparent=86,8%, opaque=11,8%.
- Các số khớp với đo thô ở §3 (fg 11,9% → 11,8% sau EMA/feather —
  smoothing mặc định không cứu được vùng váy đã mất; xem §3.1).
- Kết luận: u2netp chạy được end-to-end qua đúng đường production
  mặc định — vấn đề không phải "chạy được hay không" mà là mask
  khác xa u2net (§3), nên vẫn KHÔNG thay fallback.

## 6. Quyết định và nợ mở

**QUYẾT ĐỊNH (chốt, ghi vào gap analysis): u2netp KHÔNG thay u2net
làm fallback. `bgremove.py` giữ nguyên: mặc định `birefnet-general`
+ fallback `u2net`. Không nối u2netp vào bất kỳ đường bgremove nào.**

Lý do: tốc độ/RAM thắng (1,5–2,4×, −0,5 GiB) nhưng mask không tương
đương (IoU 0,63/0,69 trên 2/3 clip, mất váy tối màu — lỗi thấy được).
Fallback phải đúng trước, nhanh sau.

Nợ / hướng sau (không thuộc luồng này):
1. **u2netp chỉ nên xem xét cho đường dùng hẹp, có chọn lọc** — vd
   preview nhanh độ phân giải thấp khi biết trước chủ thể sáng màu /
   tương phản cao, hoặc làm "fast path" người dùng tự chọn (opt-in,
   ghi rõ mask có thể khác u2net). Cần đợt riêng + test thêm nhiều
   ảnh tối màu trước mọi đề xuất kiểu này.
2. **MediaPipe SelfieSegmenter** (ứng viên số 2 từ D7, Apache-2.0)
   vẫn chưa thử — chỉ xem xét nếu cần thêm ứng viên nhẹ; cần runtime
   TFLite mới.
3. **Birefnet vẫn ĐÓNG** (D7): không có số cho đến khi có máy RAM
   ≥ 12 GB. Không đo lại trong sandbox.
4. Baseline fps u2net sạch vẫn 0,37–0,43 fps (W1); các số 0,16–0,18
   fps đợt này là dưới tải song song nặng (load tới 14,9), không dùng
   làm baseline mới.

## 7. File đổi/thêm (batch phase9-round77-e4-u2netp, KHÔNG push)

- `docs/PHASE9_ROUND77_E4_U2NETP_LIMITS.md` — doc này (mới).
- `server/bgremove/test_round77_e4_u2netp.py` — test so sánh end-to-end
  (mới; 10 run, so mask từng frame, RSS/wall qua wait4).
- `server/bgremove/test_round77_e4_u2netp_part2.py` — phần 2: so lại từ
  đĩa + clip C + alpha lossless + ảnh đối chiếu (mới).
- KHÔNG đổi: `bgremove.py`, `test_bgremove.py`, requirements, venv,
  hay bất kỳ file production nào.
- Scratch không stage: `~/workspace/.tmp-r77e4/` (video/mask/alpha/
  results.json, run1.log, run2.log, test_bgremove_u2netp.log,
  compare-A-480.png), `~/.u2net/u2netp/u2netp.onnx` (model 4,57 MB,
  cache ngoài repo — binary, không stage).
- Stage file: `paths-loop/phase9-round77-e4-u2netp.txt`
  (NUL-delimited, verify read-back).

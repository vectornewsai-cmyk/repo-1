# Đợt 80 H6 — Tách nguyên nhân G8 MAD +0,099 sau G1: ĐÃ TÁCH XONG — KHÔNG PHẢI HỒI QUY

Ngày: 10/11/2026 (lượt cron 15:35 +07; đo headed 08:43–09:00 UTC,
tức 15:43–16:00 giờ VN). Máy đo: VM này (CPU-only, Chromium 158 qua
Xvfb + CDP; load 1-min dao động 0,7–16 trong đợt — 8–10 luồng
sibling đợt 80 chạy song song). Nợ: docs/PHASE9_ROUND79_G1_DEINT_FPS_LIMITS.md
§5.4 / §6.3 — G8 MAD 1,4826 (code cũ, F1) → 1,5817 (code mới, G1),
+0,099 chưa tách nguyên nhân.

## 1. Kết luận ngắn

- **Nguyên nhân là (a): thay đổi held-frame intermediate của G1 —
  ĐÃ CHỨNG MINH BẰNG A/B TRONG APP.** Chỉ revert đúng 1 dòng G1
  (`if (held) interInput = held.canvas;` → `if (false && held) …`),
  chạy lại E1 headed: G8 về **đúng 1,4826** (cũ), G2 về 0,6087,
  G7a về 0,6944, G7b về 0,0036 — khớp từng số F1 tới 4 chữ số.
  Khôi phục lại code G1 (md5 khớp backup), chạy lại E1: G8 lại
  **1,5817** đúng như cũ. Đây là thay đổi pixel XÁC ĐỊNH do đúng
  1 thay đổi code, không phải nhiễu.
- **NHƯNG ĐÂY KHÔNG PHẢI HỒI QUY — không sửa gì, giữ nguyên code
  G1.** Mọi chỉ số chất lượng đều Y HỆT nhau giữa 2 đường: R
  0,55 → 0,52 (cả cũ lẫn mới, cả 3 lần chạy mới); G8 vẫn PASS
  với biên lớn (MAD 1,58 > ngưỡng 0,3 gấp 5 lần); probe cùng-frame
  cho R A = B (0,46 = 0,46 / 0,61 = 0,61) và vgrad gần như y hệt
  (3,490 vs 3,492; 4,003 vs 3,880 — B thậm chí mịn hơn một chút ở
  hình học app). MAD không phải chỉ số chất lượng có đích — nó là
  ĐỘ LỚN hiệu ứng deint; +0,099 (+6,7%) chỉ nói hiệu ứng đo được
  lớn hơn một chút, không nói hình xấu đi. Không có bằng chứng nào
  cho thấy pixel mới tệ hơn pixel cũ. "Sửa cho G8 về gần mức cũ"
  đồng nghĩa hoàn lại G1 (mất lợi ích FPS — xem §5) hoặc đọc lại
  video lần nữa (đúng thứ G1 đã loại bỏ) — cả hai đều tệ hơn giữ
  nguyên. **Nợ G8 +0,099 ĐÓNG với kết luận: thay đổi pixel thật,
  xác định, do chuỗi resample khác — không phải hồi quy.**
- **Cơ chế (probe cùng-frame BBB):** đường mới vẽ video → held
  canvas RGB 720p rồi mới → intermediate 360p (2 bước RGB), đường
  cũ vẽ video → intermediate 360p trực tiếp (convert YUV→RGB +
  scale 1 bước). Trên testsrc2 tổng hợp (nền phẳng) 2 chuỗi lệch
  nhau chỉ MAD 0,016 (G1 probe); trên BBB thật (chi tiết ảnh dày)
  lệch **MAD 0,384–0,390, max 23–26/255** — gấp ~24 lần. Bất đẳng
  thức tam giác cho phép G8 dịch tối đa 0,39; dịch quan sát được
  +0,099 nằm trong đó; probe hình học app tái lập đúng chiều và
  cùng bậc (+0,055: B-vs-OFF 1,4800 − A-vs-OFF 1,4252).
- **(b) kernel BC (F6) và (c) ma trận bt709→bt601 (G5 đợt 79):
  LOẠI BẰNG CẤU TRÚC — cả hai không bao giờ chạy trong đường đo
  E1.** `chrome-resample.mjs` không được import bởi bất cứ file
  nào trong `apps/web/src/`, harness E1, các probe deint, hay
  `server/` (grep toàn repo = 0 tham chiếu); F6 chỉ stage script
  đó + script r78f6-* + docs. `r79g5-render-frames.mjs` (chỗ sửa
  bt601) chỉ được tham chiếu bởi chính nó và bản copy r80h3 của
  luồng khác — harness E1 không gọi. Cả hai đều là script phân
  tích offline, không load vào app headed.
- **(d) nhiễu đo: LOẠI.** G8 = 1,5817 giống hệt nhau ở 4 lần chạy
  code mới (2 lần G1 + 2 lần H6, tải 1-phút từ ~1 tới ~24) và
  1,4826 giống hệt nhau ở 2 lần chạy code cũ (F1 + H6 revert).
  Mọi số pixel G2/G7a/G7b/G8 đều ổn định tới 4 chữ số. Không có
  thành phần ngẫu nhiên nào trong +0,099.
- **Giả thuyết "held frame cũ" (a2): LOẠI CẢ BẰNG CODE LẪN SỐ.**
  Nhánh G1 chỉ chạy khi `srcEl` là video element — mà `srcEl`
  chỉ là video ở quyết định "draw" của đúng tick đó, và
  `storeHeldFrame` chạy trong cùng tick đó, trước pipeline deint
  (preview.tsx:1638 → :1820). Held canvas khi đó luôn là frame
  hiện tại. Về số: held lệch đúng 1 frame thật (arm m1f) cho
  MAD-vs-A 1,71–2,06; lệch 6 frame 4,49–5,75; lệch ±0,5s
  12,1–12,9 — gấp 4–30 lần MAD B-vs-A quan sát được (0,39). Nếu
  held cũ dù chỉ 1 frame, G8 đã dịch tới ~1,7 chứ không phải
  0,099. (Lưu ý: arm p1f cho số y hệt B — seek +1/60s rơi về
  đúng frame 1,0s, tức seek không tách được +1 frame; xem §5.3.)

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `apps/web/scripts/probe-80h6-bbb-sameframe.mjs` | **Mới**: probe tab trắng so cùng-frame BBB: A (video→inter) vs B (held→inter) vs OFF + các arm held lệch frame (m1f/p1f/m6f/p6f/m05s/p05s), ở 2 hình học (native 1280×720 như probe G1; app 1449×815 như headed E1, intermediate 1449×408). |
| `docs/PHASE9_ROUND80_H6_G8_ROOTCAUSE_LIMITS.md` | **Mới**: file này. |
| `apps/web/src/preview.tsx` | **KHÔNG ĐỔI SO VỚI ĐẦU LUỒNG** (md5 369025c10e44546c6f29b2dd27d8012a trước/sau như nhau). Chỉ revert tạm 1 dòng trong lúc đo A/B rồi khôi phục từ backup, verify bằng md5 + grep (không còn marker tạm). |

Không đụng `enhancePreview.ts`, spec/render/store/i18n (dict không
đổi), không đụng workflow. Không binary vào batch. `apps/web/dist/`
(KHÔNG stage — build kiểm chứng xong sẽ ghi ở §4 nếu chạy).

## 3. Số đo thật

### 3.1 Headed E1 — A/B trong app (cùng harness, cùng fixture, cùng ngày)

Cửa sổ 2560×1440, canvas backing 1991×815, scaleY 1,132, clip 1 =
interlaced720.mp4; G8 = BBB interlaced tại playhead 1,0 (pause).

| Lần chạy | Code | G2 MAD | G7a MAD | G7b MAD | G8 MAD | G8 R | G5 | Kết quả |
|---|---|---|---|---|---|---|---|---|
| F1 rerun (đợt 78) | cũ | 0,6087 | 0,6944 | 0,0036 | **1,4826** | 0,55→0,52 | 0,59× FAIL | 9/10 |
| G1 lần 1 (đợt 79) | mới | 0,6114 | 0,6985 | 0,0119 | **1,5817** | 0,55→0,52 | 1,51× PASS | 10/10 |
| G1 lần 2 (đợt 79) | mới | 0,6114 | 0,6985 | 0,0119 | **1,5817** | 0,55→0,52 | 1,03× PASS | 10/10 |
| **H6 run 1** | mới | 0,6114 | 0,6985 | 0,0119 | **1,5817** | 0,55→0,52 | 1,28× PASS | **10/10** |
| **H6 run 2 (revert G1)** | cũ | 0,6087 | 0,6944 | 0,0036 | **1,4826** | 0,55→0,52 | 1,20× PASS | **10/10** |
| **H6 run 3 (khôi phục)** | mới | 0,6114 | 0,6985 | 0,0119 | **1,5817** | 0,55→0,52 | 0,71× FAIL | **9/10** |

- Chênh mới − cũ (cùng ngày, cùng harness): G2 +0,0027; G7a
  +0,0041; G7b +0,0083; **G8 +0,0991**. Mọi chênh đều cùng chiều
  (+), và đều do đúng 1 thay đổi G1 — run revert là bằng chứng
  trực tiếp (không suy luận từ probe).
- R G8 y hệt nhau ở cả 6 lần chạy (0,55 → 0,52). G8 PASS cả 6 lần.
- **Dữ liệu G5 kèm theo (không phải nhiệm vụ chính của H6 nhưng
  đo được trong cùng 3 lần A/B — xem §5.2):** code mới 1,28× PASS
  rồi 0,71× FAIL trên CÙNG cây (cách nhau ~15 phút); code cũ
  1,20× PASS lúc VM lặng (load 1-phút 1,13). Gộp mọi lần đo từ
  trước tới nay: mới 1,51/0,83/1,03/1,28/0,71 (4/5 ≥ 0,75,
  mean ~1,07); cũ 0,59/0,58/0,55/1,20 (1/4 ≥ 0,75, mean ~0,73).
  Tách biệt theo mean vẫn còn, nhưng MỘT lần chạy đơn lẻ có thể
  lật cả 2 chiều — ngưỡng 0,75× nằm trong dải nhiễu của metric.

### 3.2 Probe cùng-frame BBB (tab trắng, pause 1,0s)

`probe-80h6-bbb-sameframe.mjs`, 08:48–08:49 UTC, load 15,8–18,6.
A2-vs-A = 0 ở cả 4 tổ hợp (xác định).

**bbb-interlaced720.mp4:**

| Hình học | R OFF / A / B | vgrad A / B | MAD A-vs-OFF | MAD B-vs-OFF | MAD B-vs-A (max) |
|---|---|---|---|---|---|
| native 1280×720 | 0,59 / 0,46 / 0,46 | 3,490 / 3,492 | 2,5529 | 2,4832 | **0,3841 (max 1)** |
| app 1449×815 | 0,55 / 0,61 / 0,61 | 4,003 / 3,880 | 1,4252 | 1,4800 | **0,3904 (max 23)** |

**bbb720.mp4 (đối chứng progressive):** native MAD B-vs-A 0,3826
(R 0,46 = 0,46, vgrad 3,605 vs 3,606); app MAD B-vs-A 0,3854
(R 0,62 vs 0,61, vgrad 4,178 vs 4,044). Cùng bậc với bản interlaced
— hiệu ứng là do chuỗi resample trên nội dung ảnh thật, không
riêng gì combing.

**Hiệu chuẩn held lệch frame (MAD-vs-A, hình học app, interlaced):**

| Arm | m1f (−1f) | p1f (+1f) | m6f | p6f | m05s | p05s |
|---|---|---|---|---|---|---|
| MAD-vs-A | 1,7146 | 0,3904* | 4,4852 | 4,8897 | 12,1019 | 12,3481 |
| MAD-vs-OFF | 2,4835 | 1,4800* | 5,0485 | 5,3032 | 12,5505 | 12,7197 |

\* p1f y hệt B tới 4 chữ số ở cả 4 tổ hợp — seek tới 1,0+1/60s
rơi về đúng frame 1,0s (xem §5.3), nên arm này KHÔNG phải 1 frame
lệch thật; chỉ arm m1f (và các arm xa hơn) là hiệu chuẩn thật.

- So sánh: MAD B-vs-A thật (0,39) chỉ bằng ~23% của held lệch
  1 frame thật (1,71) và ~3% của lệch 0,5s (12,1). Lệch frame
  không giải thích được +0,099.
- Probe tái lập chiều dịch G8: app MAD B-vs-OFF − A-vs-OFF =
  **+0,0548** (headed: +0,0991); native cho −0,0697 (đổi chiều —
  do hình học native khác app: final 1280×720 không upscale
  ngang, xem §5.3). Chỉ đọc hình học app khi so với headed.

### 3.3 Loại trừ (b) và (c) bằng cấu trúc

- (b) kernel BC: `grep -rn chrome-resample` trên `apps/web/src/`,
  harness E1, mọi probe deint (`probe-77e1`, `probe-78f1`,
  `probe-79g1`), và `server/` → **0 tham chiếu**. Batch F6
  (`phase9-round78-f6-kernel-bc.txt`, 7 entry) chỉ chứa
  `chrome-resample.mjs` + 5 script r78f6-* + docs — không có file
  nào app load. Kernel BC không thể ảnh hưởng số headed E1.
  (Lưu ý thời gian: F1 rerun G8 1,4826 đo lúc 23:41 09/11, trước
  khi F6 nối BC trong đợt 78 — nhưng vì file không được load nên
  trùng thời gian này không phải confounder.)
- (c) bt709→bt601: sửa nằm trong `r79g5-render-frames.mjs`
  (renderer ffmpeg offline cho phân tích full-pixel). `grep -rln`
  chỉ thấy chính file đó + `r80h3-render-frames.mjs` (bản copy của
  luồng đợt 80 khác, cùng mục đích offline). Harness E1 không gọi
  script này; preview headed dùng phép convert YUV→RGB của
  Chromium, không đổi.
- Kiểm tra thêm: `preview.tsx` là file production DUY NHẤT đổi
  giữa đợt 78 và 79 trong các batch đã stage (F1 đợt 78: chỉ thêm
  comment; G1 đợt 79: đúng thay đổi held-frame). Không có thay đổi
  production nào khác có thể gây +0,099.

## 4. Kiểm chứng (cây cuối — y hệt đầu luồng, chỉ thêm probe + docs)

| Kiểm chứng | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `vite build` (apps/web) | **pass** (1m10s; chỉ cảnh báo chunk >500kB có từ trước) |
| Unit `enhancePreview77E1.test.ts` vi | **11/11** |
| Unit `enhancePreview76D4.test.ts` vi | **10/10** |
| Unit `enhancePreview75C8.test.ts` vi | **14/14** |
| Headed E1 run 1 (cây cuối, code mới) | **10/10** (G8 1,5817; G5 1,28×) |
| Headed E1 run 2 (revert tạm G1) | **10/10** (G8 1,4826; G5 1,20×) — chứng minh A/B |
| Headed E1 run 3 (đã khôi phục G1) | **9/10** (G8 1,5817; chỉ G5 FAIL 0,71× — xem §5.2) |
| Probe cùng-frame BBB | xong (§3.2; B-vs-A 0,384–0,390, A2-vs-A = 0) |
| Khôi phục preview.tsx | md5 369025c10e44546c6f29b2dd27d8012a khớp backup, 0 marker tạm |
| Headed H9 (mọi lần chạy) | **0 lỗi trang** |

## 5. Giới hạn — đọc trước khi trích số

1. **+0,099 là thay đổi pixel thật, KHÔNG phải hồi quy.** Không có
   chỉ số chất lượng nào xấu đi (R, vgrad, mọi ngưỡng G8 đều giữ).
   Đừng trích "G8 xấu đi 0,099" hay "G1 làm lệch pixel BBB 0,099
   so với chuẩn" — không có chuẩn nào nói MAD 1,48 tốt hơn 1,58;
   MAD chỉ đo độ lớn hiệu ứng deint, và cả hai đều PASS gấp 5 lần
   ngưỡng. Đừng trích "nhanh hơn 12%" (đã cấm từ G1 §5.2).
2. **G5 (đóng ở đợt 79) MỎNG HƠN sau dữ liệu mới — ghi nhận, không
   tự mở lại.** Trên cùng cây cuối, H6 đo G5 1,28× PASS (run 1)
   rồi 0,71× FAIL (run 3); code cũ revert đo 1,20× PASS lúc VM
   lặng (run 2, load 1-phút 1,13 — trong khi run 1 load 10,25,
   run 3 bắt đầu ở load 15,98). Gộp 5 lần mới vs 4 lần cũ: mean
   1,07 vs 0,73, nhưng 1 lần chạy đơn lẻ lật được cả 2 chiều.
   Quyết định "G5 đóng hay mở lại" thuộc về parent/user, không
   phải H6 — H6 chỉ ghi datum mới này. Nếu cần củng cố G5: đo
   lại lúc VM thật sự yên tĩnh (không sibling) hoặc fixture dài
   hơn (nợ G1 §6.1, vẫn mở).
3. **Probe tab trắng có 2 giới hạn đo:**
   - (a) Hình học native cho chiều dịch G8 ngược (−0,0697) so với
     headed (+0,0991); chỉ hình học app (+0,0548) cùng chiều.
     Probe không tái lập chính xác tuyệt đối MAD headed (thiếu
     ~0,06–0,10: 1,4252 vs 1,4826; 1,4800 vs 1,5817) — do snapshot
     app lấy trên canvas letterbox 1991×815 (có viền đen + lưới
     lấy mẫu 64.874 pixel) còn probe đo full-bleed 1449×815.
     Kết luận nguyên nhân dựa vào A/B trong app (§3.1), probe chỉ
     là bằng chứng cơ chế.
   - (b) R của probe đi NGƯỢC headed ở hình học app (probe A/B
     R 0,61 > OFF 0,55; app ON R 0,52 < OFF 0,55) — cùng lý do
     lấy mẫu/khung hình trên; đừng dùng R của probe để kết luận
     về R trong app. Điều probe chứng minh được là MAD(B,A) và
     hiệu chuẩn lệch-frame, không phải R.
   - (c) Arm p1f không tách được +1 frame (seek rơi về frame cũ)
     — chỉ arm m1f trở đi là hiệu chuẩn lệch-frame thật. Seek
     ±1/60s không đáng tin để hiệu chuẩn lệch 1 frame theo chiều
     +; cần decode từng frame (vd `requestVideoFrameCallback`)
     nếu muốn hiệu chuẩn chính xác hơn — không cần cho kết luận
     này (m1f đã đủ loại a2).
4. **A/B revert chỉ đổi 1 dòng trong lúc đo (~4 phút), đã khôi phục
   và verify md5.** Trong cửa sổ đó, sibling đợt 80 nào đọc
   `preview.tsx` sẽ thấy bản revert — mtime file không đổi sau
   khôi phục (02:48, trước H6), không còn marker tạm; cây cuối
   y hệt đầu luồng về production.
5. **Chưa đo:** máy thật có GPU; Safari/WebKit thật; footage xen
   kẽ gốc từ camera; G5 lúc VM yên tĩnh (xem mục 2).
6. **Gap-mean (metric phụ) vẫn mâu thuẫn như G1 §5.2** — H6 không
   đo lại tick-time (không cần cho tách nguyên nhân G8); nợ khép
   gap-mean vẫn mở (G1 §6.1).

## 6. Nợ mở cho đợt sau

1. **G8 +0,099: ĐÓNG** (file này). Không cần làm gì thêm — trừ khi
   user/parent quyết định MAD cần về gần mức cũ bằng mọi giá, thì
   phương án duy nhất là hoàn lại G1 (mất lợi ích FPS) — không
   khuyến nghị.
2. G5: datum mới (mục 5.2) — parent quyết định có mở lại hay đo
   thêm lúc VM yên tĩnh (nợ G1 §6.1).
3. Gap-mean lúc VM yên tĩnh; harness FPS sửa lỗi start-poll
   (F1 §6.3); FPS combo deint + chroma/LUT/effects (G1 §6.4).
4. TTS 39 / pip-audit / Gradio: CẤM kiểm lại (lệnh luồng) — không
   đụng ở đây.

## 7. Cách chạy lại

```bash
# Probe cùng-frame BBB (~2 phút; log + JSON ở hidden_files/round80-h6/probe/):
H6_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round80-h6/probe \
  H6_DEV_PORT=5615 H6_DEBUG_PORT=9715 H6_DISPLAY=:215 \
  node apps/web/scripts/probe-80h6-bbb-sameframe.mjs
# Headed E1 trên cây hiện tại (~4 phút):
E1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round80-h6/headed-run1 \
  E1_DEV_PORT=5614 E1_DEBUG_PORT=9714 E1_DISPLAY=:214 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Unit test (vi):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview77E1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round80-h6/enhancePreview77E1.test.cjs \
  && node /tmp/round80-h6/enhancePreview77E1.test.cjs
```

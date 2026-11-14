# PHASE9_ROUND107_I8_BLUR_CLUSTERA_LIMITS.md — Blur cụm A stripes, đợt 107, luồng I8

**Ngày:** 13/11/2026. **Luồng:** I8 (Phase 9 đợt 107). **Chủ đề:** Blur cụm A
stripes — stimulus/phương pháp mới (nợ LIMITS gộp đợt 106 §7 mục 2–3).
**Bối cảnh:** docs/PHASE9_ROUND106_H4_BLUR_LIMITS.md (§4–§5),
docs/PHASE9_ROUND105_G7_BLUR_LIMITS.md, docs/PHASE9_ROUND103_E6_BLUR_LIMITS.md
(§1); prereg `hidden_files/round107-i8/prereg-i8.md` (viết TRƯỚC mọi lượt probe).

**Kết quả lớn nhất đợt này:**
- **E6 VẪN MỞ — probe không đủ dữ liệu để verdict (KHÔNG phải stimulus hỏng,
  KHÔNG phải phương pháp hỏng).** 3 lượt probe chạy xong (exit 0) nhưng chỉ
  thu được **35 cap / 19 blendTick** (so với 98–232 cap, 99–368 tick ở các
  lượt yên H4/G7) vì máy tải cực nặng trong lúc phát (load1 tới **27,9**;
  video chạy 0,4× realtime; draw 2/s thay vì ~100/s). Chỉ **2 sự kiện blend
  phân biệt** có đủ content, **0 sự kiện trong band A'** (bar cần ≥8) —
  không thể chứng minh hay bác E6. Prereg giới hạn tối đa 3 lượt nên DỪNG ở
  đây, không chạy thêm.
- **Stimulus mới `stripes-code.mp4` ĐẠT feasibility (cổng F1):** strip
  second-nearest MAD min/med = **30,9/46,6** trên file đã encode, 90/90
  frame ≥30 (bar G7 ≥30) — code band phá được tính tuần hoàn của stripes.
- **Strip ĐO ĐƯỢC content live (19/19 tick):** MAD tới frame đúng 0,3–0,6,
  tới frame nhì 36–59 — cùng chất lượng như stimulus noise của G7 (0,4 vs
  47). Phương pháp đã chứng minh xong; chỉ thiếu mẫu.
- **Phát hiện mới về nhãn dưới tải:** presented content TRỄ nhãn một cách hệ
  thống (trung vị −4 frame, dải −1..−6, 2 ca −14/−15 do kẹt ở frame cuối 89);
  ghost content thì SỚM hơn nhãn ghost +0..+4 (trung vị +3). Chỉ 2/19 tick có
  presented trong ±1 nhãn — bar F2 "trong ±1" (hiệu chuẩn trên lượt yên G7)
  KHÔNG áp được dưới tải nặng. Đây là nhiễu nhãn do tải, không phải lỗi strip.
- **Mô hình harmonic BỊ BÁC bằng tính trực tiếp (offline, trước probe):**
  triple liên tiếp trên stripes thuần chỉ cho g ≈0,333 hoặc ≈0,745 (bimodal,
  bền qua BILINEAR/NEAREST/full-res), không bao giờ ≈0,44; quét toàn bộ bộ
  3-frame trọng số đều cho 12 ca A của E6: **0 bộ nào vào [0,40, 0,50]**.
  Khẳng định E6 "9/13 ca chỉ khớp triple liên tiếp (pred 0,449)" dựa trên mô
  hình harmonic — mô hình này tính trực tiếp đã bác.
- **Lệch g triple +0,029 GIỮ NGUYÊN (kiểm chứng lại trên dữ liệu gộp):**
  union H4-48 + G7 decisive chr = 48 sự kiện (G7 5/5 trùng H4, 0 mới); thuần
  n=43: g_live 0,625 vs g_pred 0,596 → **+0,029**; pad-clone n=5: 0,769 vs
  0,741 → +0,028. Vẫn chưa giải thích được.
- **Giả thuyết thay thế H-alt-weights (post-hoc, chưa chứng minh):**
  w=(0,20, 0,35, 0,45) đưa 11/11 ca A labels-true vào band và dự đoán g
  triple noise 0,621 (đo 0,625). Trên sự kiện live duy nhất so được (n=1),
  trọng số đều khớp hơn (Δ0,024 so với Δ0,057) — KHÔNG đủ sức kết luận.

**Build:** probe chạy trên `ced42efd` cả 3 lượt (md5 không đổi; không sửa
production trong luồng này). F3 tap+relabel TẮT trong mọi lượt. Không push
GitHub, không release/tag, không TTS 39, không birefnet.

---

## §0. Bối cảnh chạy (tải nặng — nguyên nhân chính của dữ liệu mỏng)

- **Boot 63a52041** (reboot #33, 14:50:59Z) suốt lượt; KHÔNG có reboot trong
  lượt (reboot #34 dự báo ~16:51:58Z đã không xảy ra trong cửa sổ tới
  18:05Z). RAM khả dụng ~1,0–1,7 GB lúc phát.
- **Đủ 3 cờ phối hợp tải** (round107-i1/i3/i4-done) lúc 18:00Z — probe chạy
  ngay, không chờ timeout. Nhưng "đủ cờ" không có nghĩa là máy yên: lúc
  phát lượt r43, load1 = **27,15** (các luồng song song khác đang chạy
  probe + CPU hog `python3 -c while True: pass` có chủ đích); lượt r44
  load1 lúc phát 2,59 nhưng trung bình 15 phút vẫn 9,69 (psOther=27).
  Cổng "chờ yên 120s" của probe đã hết 120s mà load không xuống (r43:
  6,5→27,15; r44: 15,24→2,59) rồi vẫn phát theo thiết kế (ghi rõ load).
- **Cơ chế mất mẫu (đo được):** probe thoát vòng chờ khi playhead tới
  endPh (8,8s) bất kể mật độ lấy mẫu — dưới tải, video chỉ chạy 0,4×
  realtime (r43: playhead 4,27 sau 10,5s tường) và canvas chỉ vẽ ~2 lần/s
  (drawsTotal=42 so với 871 ở H4 r40 yên); pump capture mỗi snapshot mất
  200–400ms (capMs) nên frameIdx nhảy 14→38→56→84 (lấy mẫu ~1/20 frame).
  Kết quả: r43 15 cap/8 tick, r44 16 cap/11 tick, noblur 4 cap/0 tick.

| lượt | engine | config | nclips | cap | tick | load lúc phát | exit |
|---|---|---|---|---|---|---|---|
| chr-code-noblur-r43 | chr | stripes-code-noblur | 1 | 4 | 0* | 1,78 | 0 |
| chr-code-blur-r43 | chr | stripes-code-blur | 3 | 15 | 8 | 27,15 | 0 |
| chr-code-blur-r44 | chr | stripes-code-blur | 3 | 16 | 11 | 2,59 | 0 |

\* noblur không có đường blend nên không có blendTick (đúng thiết kế —
xem §1 về điều chỉnh F2). So sánh lượt yên: H4 r40 224 cap/316 tick
(load 1,67); G7 r37 232 cap/368 tick (load 2,80).

---

## §1. Feasibility: F1 ĐẠT (offline), F2 nửa đạt (live)

### F1 — strip trên file đã encode: ĐẠT

Stimulus `stripes-code.mp4` (stripes-scroll + code band G7 seed 30000+f,
khối 4 px, y∈[320,400] + số frame; generator
`apps/web/scripts/gen107i8-stripes-code.py`; 255.634 byte, 90 frame
1280×720@30, libx264 crf 16; file mp4 nhị phân KHÔNG stage):

| chỉ số | giá trị | bar |
|---|---|---|
| second-nearest MAD min / med / max | 30,9 / 46,6 / 61,5 | med ≥30 |
| số frame có second-nearest ≥30 | 90/90 | ≥80 |
| đạt quy tắc G7 (nearest < 0,5×second) | 90/90 | — |

So với stripes thuần (second-nearest med 0,00, 90/90 <30 — kiểm chứng lại
độc lập ở đợt này, khớp H4): code band phá hoàn toàn tính tuần hoàn.
**Band A' chốt [0,36, 0,48]** trên file đã encode (mode thấp triple liên
tiếp 0,387–0,45; labels-true 0,381–0,415; (6,5) 0,736–0,765 nằm ngoài band;
số đã encode dịch ≤0,001 so với mô phỏng pre-encode nên giữ band prereg).

### F2 — strip live: nhận diện ĐẠT, "trong ±1" FAIL do tải

**Điều chỉnh so với prereg (ghi rõ):** prereg viết F2 đo trên lượt noblur,
nhưng lượt noblur KHÔNG có blendTick (không có đường blend) nên F2 không
đo được ở đó. F2 được đo trên 2 lượt blur (nơi blendTick tồn tại) — cùng
nội dung kiểm tra (strip live nhận diện + presented trong ±1), chỉ đổi
nguồn dữ liệu.

| chỉ số live (gộp 2 lượt blur, rVFC) | giá trị | bar |
|---|---|---|
| tick rVFC có strip | 19 | — |
| presented strip nhận diện được | 19/19 (100%) | ≥80% |
| ghost nhận diện đủ cả 2 | 19/19 (100%) | — |
| MAD tới frame đúng / frame nhì | 0,3–0,6 / 36–59 | — |
| presented content trong ±1 nhãn | **2/19 (11%)** | ≥80% → **FAIL** |

- **Strip live hoạt động đúng chuẩn G7** (MAD 0,3–0,6 vs 36–59; G7 noise:
  0,4 vs 47). Phương pháp đo content đã được chứng minh trên stimulus mới.
- **"Trong ±1" fail vì nhãn lệch hệ thống dưới tải, không phải vì strip
  sai.** Phân bố off = pres_content − pres_label (19 tick): −1: 2, −2: 5,
  −3: 1, −4: 2, −5: 6, −6: 1, −14: 1, −15: 1 — trung vị **−4**, không ca
  nào dương. Ghost content thì ngược hướng: ghost content − ghost label =
  0..+4 (trung vị +3; vd (30→32), (53→56), (48→51), (33→36)).
  Giải thích nhất quán: pump ghi frameIdx lúc invoke nhưng chụp pixel
  200–400ms sau (capMs), video 0,4× tiến thêm ~2–5 frame → ghost content
  mới hơn nhãn +2/+3; canvas vẽ thưa (2/s) nên curPix giữ frame cũ trong
  khi nhãn presented đã chạy trước 1–6 frame. Hai ca −14/−15 là kẹt ở
  frame cuối 89 (pres 104/93, content 89 — bộ đếm probe chạy tiếp qua cuối
  video như E6 §5 đã ghi; loại 2 ca này vẫn chỉ 2/17 trong ±1).
- **Hệ quả phương pháp:** bar "presented trong ±1" (hiệu chuẩn trên lượt
  yên G7: chr presented = nhãn hoặc +1 ở 85% tick) KHÔNG áp được dưới tải
  nặng. Lượt sau chỉ tin phân tích nhãn khi load lúc phát thấp (đề xuất
  load1 <5), hoặc dùng content làm khóa chính thay vì nhãn.

---

## §2. Bar (a) — verdict E6: KHÔNG ĐẠT SỐ LƯỢNG, VẪN MỞ

- Sự kiện blend phân biệt có đủ content (rVFC, dedup như G7/H4): **2**
  (r43: 1, r44: 1). Cần ≥8 → **KHÔNG ĐẠT**.
- Trong band A' [0,36, 0,48] + label gap hiệu chỉnh 6: **0 sự kiện**.
  Label gap 6 (mọi band): **1 sự kiện** (E1 dưới đây).
- **E6: VẪN MỞ.** Không có dữ kiện nào để chứng minh hay bác (0/8 sự kiện
  quyết định). Đây là kết luận "không đủ dữ liệu", không phải "không có
  hiệu ứng".

### 2 sự kiện duy nhất thu được (chi tiết đầy đủ)

| # | lượt/clip | pres (nhãn→content) | ghosts (nhãn→content) | label gap | content gap | g_live | g_pred (đều) | loại |
|---|---|---|---|---|---|---|---|---|
| E1 | r43 c0 pres20 | 20→18 | (14→18), (14→18) | 6 | 0 | 1,006 | 1,000 | Khác (vòng kẹt: cả 3 content = 18) |
| E2 | r44 c1 pres46 | 46→45 | (22→22), (22→22) | 24 | 23 | 0,781 | 0,757 | Khác (pad-clone {22,22,45}) |

- **E1** là ca label-gap-6 duy nhất: ring chỉ giữ snapshot frame 18 (clone
  2 lần), nhãn presented chạy tới 20 trong khi content đứng yên 18 — vòng
  kẹt do pump thưa dưới tải, không phải cụm A (g≈1,0).
- **E2** là pad-clone {22,22,45} (ringSize=1, pool 1 ghost + pad-oldest
  clone) — đúng cơ chế pad C4, không liên quan cụm A.
- Baseline g live: **87,33** (chỉ 4 cap noblur c0: fi 0/42/72/80; c1/c2
  không có cap noblur nên dùng pooled baseline này làm fallback — ghi rõ,
  g của E2 là ước lượng theo baseline c0). Đối chiếu: stripes thuần live
  81,1 (round95-w3, n=161–170); offline refs stripes-code 60,59 (chênh
  do filter downscale live-vs-PIL như G7 §1.2 đã cảnh báo; tỉ số g bền
  vững qua filter — xem §4).

---

## §3. Bar (b) — kiểm tra chéo cơ chế blend: n=1, không kết luận được

Chỉ E2 so được (E1 có 1 content duy nhất nên loại): g_live 0,781 vs
g_pred trọng số đều **0,757** (|Δ|=0,024) vs g_pred H-alt w=(0,20, 0,35,
0,45) **0,724** (|Δ|=0,057). Trọng số đều khớp hơn trên ca duy nhất này,
nhưng **n=1 không có sức thống kê** — ghi là gợi ý yếu, không kết luận.
Lệch +0,024 cùng hướng với lệch triple noise +0,029 (§4) nhưng 1 ca
không chứng minh được gì.

## §4. Kết quả offline (trước probe — đăng ký trong prereg §0)

### 4.1. Mô hình harmonic BỊ BÁC bằng tính trực tiếp trên pixel

- Stripes thuần: frame lặp gần như chính xác sau 24 frame (full-frame MAD
  k=24 là 0,02) và hàng giữa lặp sau 5 frame — mọi phương pháp chỉ dùng
  pixel stripes đều không phân biệt được f với f+24; strip dài hơn/2D
  cũng chỉ đo pha cuộn (đã chứng minh, không cần thử).
- Tính trực tiếp (trung bình 3 frame đã giải mã, downscale 96×54): triple
  liên tiếp {f−2,f−1,f} cho g **chỉ ≈0,333 (49/75 f) hoặc ≈0,745 (26/75 f),
  0/75 trong [0,40, 0,50]** — bimodal bền vững qua BILINEAR / NEAREST /
  full-res (histogram giống hệt). Labels-true {f−12,f−6,f}: 0,333 (75/75).
  Bộ E6 liệt kê cho 12 ca A: 0,332–0,335.
- **Quét toàn bộ** bộ 3-frame trọng số đều cho 12 ca A (current = pres−k,
  k=0..12; offsets 1..14; ~1.365 bộ/ca): **0 bộ nào cho g∈[0,40, 0,50] ở
  bất kỳ ca nào (0/12)**.
- Hệ quả: khẳng định E6 "9/13 ca chỉ khớp triple liên tiếp (pred 0,449)"
  dựa trên mô hình harmonic — giá trị 0,449 **không hề xuất hiện** trong
  tính trực tiếp. Không có bộ nội dung 3-frame trọng số đều nào giải thích
  được g≈0,44 của cụm A trên stripes thuần. (Script: analyze107i8-a/b/c.)

### 4.2. Lệch g triple +0,029 — KIỂM CHỨNG LẠI, GIỮ NGUYÊN

Union dedup H4-48 + G7 decisive chr: **48 sự kiện (G7 5/5 chr decisive
trùng khớp H4 theo key + g, 0 sự kiện mới)** — "dữ liệu gộp" không thêm sự
kiện độc lập nào, nhưng tính lại độc lập xác nhận: triple thuần n=43:
g_live mean **0,625** (med 0,624, dải 0,614–0,640) vs g_pred BILINEAR 0,596
→ lệch **+0,029**; pad-clone n=5: 0,769 vs 0,741 → **+0,028**. Vẫn chưa
giải thích được. (Lưu ý: G7 decisive_corr chứa 1 sự kiện wk lặp 14 lần —
dedup của G7 đã xử lý; union chỉ dùng chr.)

### 4.3. Giả thuyết thay thế H-alt-weights (post-hoc — CHƯA chứng minh)

Quét trọng số w trên simplex (bước 0,05): với bộ labels-true
{p−12,p−6,p}, nhiều w đưa **11/11 ca A vào band [0,40, 0,50]**; vd
w=(0,20, 0,35, 0,45) (ghost cũ 0,20, ghost mới 0,35, current 0,45) đồng
thời dự đoán g triple noise = **0,621 (đo live 0,625)**, trong khi trọng
số đều dự đoán 0,596. Với bộ liên tiếp: KHÔNG có w nào đưa ≥6/11 ca vào
band. Trạng thái: ứng viên post-hoc, mâu thuẫn với code
(`motionBlurBlendPlan` chứng minh bằng quy nạp cho trung bình đều đúng
với weights [1,1,1]; H4 hồi quy pixel cho w≈[1/3,1/3,1/3] nhưng R² median
chỉ 0,156 — fit yếu, không loại được w lệch). Cần dữ liệu probe có content
đã xác nhận để kiểm — đợt này chỉ có n=1 (§3), chưa kiểm được.

---

## §5. Kiểm chứng (cây cuối, md5 ced42efd)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass (1m 16s)**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- Pad-oldest còn nguyên (marker `motionBlurPadGhostCount` +
  `lastDrawnPaddedGhosts`); `motionBlurBlendPlan` không đổi.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §6. Nợ còn lại

1. **E6: VẪN MỞ (luồng này).** Stimulus + phương pháp đã sẵn sàng (F1 đạt,
   strip live 19/19), chỉ thiếu mẫu do tải. **Đợt sau chạy lại probe
   stripes-code khi máy yên** (đề xuất: chỉ phát khi load1 <5; nếu cổng
   chờ yên 120s hết mà load vẫn cao thì HOÃN lượt thay vì phát — bài học
   đợt này: phát dưới load 27 cho dữ liệu gần như vô dụng). Cần ≥8 sự
   kiện band A' + label gap 6 theo bar prereg §3 (giữ nguyên thiết kế,
   không cần đổi stimulus).
2. **Bar "presented trong ±1" cần hiệu chuẩn lại theo tải:** dưới tải nặng
   nhãn lệch hệ thống (trung vị −4, ghost +3). Lượt sau báo offset nhãn
   theo load, hoặc dùng content làm khóa chính.
3. **Lệch g triple +0,029: VẪN MỞ** (giữ số §4.2). H-alt-weights vẫn là ứng
   viên post-hoc, chưa kiểm được (cần sự kiện có content đã xác nhận).
4. **Mâu thuẫn stripes-thuần vẫn còn:** không bộ 3-frame đều nào cho
   g≈0,44 (§4.1) — nếu đợt sau strip đo được content cụm A là triple
   (liên tiếp hay gap-6), g≈0,44 vẫn cần cơ chế riêng (trọng số? cap
   timing? blend nhiều hơn 3 frame?). Ghi là nợ mở, không suy đoán thêm.
5. Các nợ ngoài phạm vi I8 (giữ nguyên từ LIMITS gộp đợt 106 §7): G1
   deinterlace (chờ user quyết metric G5/M2), 2 MiB, ghost F8 (G1 đã land
   F8 đợt 105 — theo dõi), F5 Re-arm (chờ A/B RAM cao), EPERM probe #26 +
   khoảng mù #25, birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM
   kiểm lại), `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 107 I8)

- `apps/web/scripts/gen107i8-stripes-code.py` — generator stimulus
  stripes-code (stripes + code band G7 + số frame; tái sinh chính xác).
- `apps/web/scripts/probe107i8-frame-parity.mjs` — probe copy probe105g7
  (SCRATCH round107-i8; config mới stripes-code-blur/noblur; WITH_BLUR đã
  đúng cho config mới; `node --check` OK).
- `docs/PHASE9_ROUND107_I8_BLUR_CLUSTERA_LIMITS.md` — file này.
- `apps/web/public/stripes-code.mp4` (255.634 byte) — nhị phân, tạo bởi
  generator, KHÔNG stage (theo luật binary).
- Dữ liệu thô + analyzer nằm ngoài repo, tại `hidden_files/round107-i8/`
  (không stage): prereg-i8.md, driver107i8.sh/.log, poll107i8.sh,
  analyze107i8-a/b/c.py + .txt/.json, verify107i8-f1.py + .txt/.json,
  analyze107i8.py + .txt/.json, inspect107i8-ticks.py + .txt,
  events107i8-detail.py + .txt, ref-stripes/ (90 PNG), ref-code/ (90 PNG
  pre-encode), ref-code-decoded/ (90 PNG đã encode), 3 thư mục lượt probe.
- Không push GitHub, không release/tag (giữ release gate).

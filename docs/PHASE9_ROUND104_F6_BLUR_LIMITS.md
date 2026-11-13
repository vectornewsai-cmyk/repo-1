# PHASE9_ROUND104_F6_BLUR_LIMITS.md — Blur parity đợt 104, luồng F6

**Ngày:** 13/11/2026. **Luồng:** F6 (Phase 9 đợt 104). **Chủ đề:** Blur parity —
r7 strip-confirm + kiểm chứng B-band c0 đăng ký trước (nợ LIMITS gộp đợt 103
§4 mục 6; xem docs/PHASE9_ROUND103_LIMITS.md §1 E6,
docs/PHASE9_ROUND102_D4_BLUR_LIMITS.md, PHASE9_GAP_ANALYSIS.md §32 mục Blur).

**Kết quả lớn nhất đợt này:**
- **r7 VẪN MỞ — nhưng giả thuyết "nội dung gap 2" nay bị bác mạnh trên mọi
  trục đo được.** (1) **Strip dài hơn bị bác OFFLINE, không cần chạy probe:**
  trên đúng 90 frame tham chiếu, strip 96 mẫu / 2 hàng / 192 bit / luma /
  x0 khác nhau đều cho đúng **4 mẫu phân biệt**, cùng va chạm d=4 (28/86)
  và d=5 (71/85) — suy biến nằm ở bản thân video tuần hoàn chu kỳ ~5
  frame, không ở độ dài strip. (2) **Đo trực tiếp bằng timing (đăng ký
  trước, trên dữ liệu D4+E6 có sẵn): bar (a) KHÔNG ĐẠT — 0/13 ca A có
  content gap 2**; 8/10 ca A đường rVFC cho content gap đúng **6** (đồng hồ
  capture và đồng hồ blend đều khớp nhãn ±1); bar (b) đối chứng B ĐẠT
  (median content gap 6,0; 4/7 ca B trong {5,6,7}). (3) Hiệu chuẩn: nhãn
  − ctFrameIdx ∈ {−1,0,1} trên 520 capture event — **không có ca nào lệch
  4 frame**; cơ chế "callback rVFC trễ 4 frame làm nhãn cũ đi" không xuất
  hiện trong dữ liệu. Điểm mở duy nhất còn lại: 3 ca đường tick (B2
  snapCt null — pixels từ canvas, clock không pin được) + khả năng
  display-lag không đo được bằng clock hiện có. Bước quyết định tiếp theo
  (đề xuất, chưa làm): stimulus không tuần hoàn.
- **B-band c0 đăng ký trước: KHÔNG ĐỦ BẰNG CHỨNG — không đạt bar, do mẫu
  mới quá nhỏ.** Mẫu mới F6 chỉ có B n=38, trong đó c0 chỉ 5 cap:
  pair-like c0 0/5 (0%) vs c2 1/13 (7,7%); Fisher một phía p=1,0; hiệu số
  −7,7pp, 95% CI [−33,3pp, +36,2pp]; power chỉ 15%. CI quá rộng nên không
  loại trừ được gì — kết quả post-hoc cũ (p=0,0042, n=437) KHÔNG bị bác,
  cũng KHÔNG được xác nhận. Nợ này vẫn mở, cần mẫu mới lớn hơn nhiều.
- **D floor post-fix gộp: 0/1767** (C4 0/867 + D4 0/566 + E6 0/207 + F6
  0/127; Fisher p=4,77e-10 so với pre-fix 28/1547; 95% CI trên
  **0,170%**) — **đạt mục tiêu kéo CI dưới 0,183%** (mốc E6).
- Ca gap-6 mới (F6): 4 ca — 1 A ringSize=1 (r35 c2 fi48, g=0,435, dị
  thường: nhãn presented 54 vs clock 48) + 3 B (2 ca đo được bằng clock
  đều cho content gap 6).

**Build:** probe F6 chạy trên `ca378bbf` (ổn định suốt đợt; luồng F3 cùng
sửa preview.tsx nhưng md5 không đổi trong lúc F6 chạy; pad-oldest verify
còn nguyên + test 27/27). **Probe F6 TẮT F3 tap+relabel** (cờ do F3 cung
cấp cho baseline) để cùng chế độ nhãn với C4/D4/E6 — nếu không tắt, mẫu
mới không gộp được với mẫu cũ. **Không sửa production trong luồng này**
(chỉ thêm probe script + file LIMITS này).

---

## §0. Bối cảnh chạy

- **Reboot #29 (boot cff65e89) ~08:57Z** cắt ngang chr r36 lần đầu lúc
  đang chờ yên trước phát (60s, chưa phát, chưa có results.json). r35 đã
  xong trước reboot còn nguyên trên đĩa. Chạy lại 3 lượt còn lại bằng
  driver104f6b.sh (08:57:53Z, boot mới, load 1,91). Không mất dữ liệu.
- **4 lượt probe mới (đều exit 0, md5 ca378bbf, mtimeChanged=false mọi
  lượt, F3 tắt đã verify `{"tap":false,"relabel":false}`):**

| lượt | engine | điều kiện | cap thô | cap dùng | D |
|---|---|---|---|---|---|
| chr-blur-r35 | chr | yên (load lúc phát ~7,9–10,9) | 26 | 21 | 0 |
| chr-blur-r36 | chr | **sysload 2** (load 5,33) | 54 | 45 | 0 |
| wk-blur-r35 | wk | yên (load ~6,2; silentEngine, pumpN=0 — đường tick) | 34 | 34 | 0 |
| wk-blur-r36 | wk | **sysload 2** (load 1,79; silentEngine, pumpN=0) | 27 | 27 | 0 |
| **gộp F6** | | | **141** | **127** | **0** |

- r35 chỉ 26 cap thô (21 dùng được) vì load ~19 lúc phát, tick thưa —
  đây là nguyên nhân chính khiến mẫu B-band mới thiếu power (§3).
- **KHÔNG chạy blind probe** (theo nhiệm vụ F6). Cửa sổ mù chỉ ước lượng
  từ state100 như D4/E6 (§4).
- Dữ liệu thô + script: `hidden_files/round104-f6/` (`strip104f6-feasibility.py`,
  `timing104f6.py`, `identity104f6.py`, `analyze104f6.py`,
  `bband104f6-prereg.py`, `driver104f6*.sh/.log`, 4 thư mục lượt).
  Đăng ký trước: `hidden_files/round104-f6.md` §0–§3 (viết trước khi chạy
  phân tích timing / probe mới).

---

## §1. r7 — VẪN MỞ, nhưng "nội dung gap 2" bị bác trên mọi trục đo được

### 1.1. Strip dài hơn: BỊ BÁC OFFLINE (không chạy probe strip mới)

Thử nghiệm tính khả thi trên đúng 90 frame tham chiếu round97-y2
(`strip104f6-feasibility.py`): số mẫu phân biệt + va chạm h=0 ở d=4/d=5:

| strip | distinct / 90 | h=0 d=4 | h=0 d=5 | alias span-8 (mean/max) |
|---|---|---|---|---|
| (a) baseline 48-bit (hàng giữa, x 256–303, G>128) | 4 | 28/86 | 71/85 | 3,5 / 4 |
| (b) 96 mẫu (x 256–351) | 4 | 28/86 | 71/85 | 3,5 / 4 |
| (c) 2 hàng (giữa + giữa+180, 96 bit) | 4 | 28/86 | 71/85 | 3,5 / 4 |
| (d) 96 mẫu × 2 hàng (192 bit) | 4 | 28/86 | 71/85 | 3,5 / 4 |
| (e) 48-bit kênh luma | 4 | 28/86 | 71/85 | 3,5 / 4 |
| (f) 48-bit hàng giữa+180 | 4 | 28/86 | 71/85 | 3,5 / 4 |
| (g/h) 48-bit x0=0,5w / 0,8w | 4 | 28/86 | 71/85 | 3,5 / 4 |

- **Mọi variant đều cho đúng 4 mẫu, cùng va chạm.** Nguyên nhân: T1 —
  frame f vs f+5 có MAD < 1 ở **71/85** cặp (MAD trung bình 21,2; k=4:
  28/86 cặp MAD<1; k=9: 39/81; k=10: 54/80) — **bản thân video
  stripes-scroll đã tuần hoàn chu kỳ ~5 frame**. T3 — các hàng gần như
  giống hệt nhau (MAD giữa hàng giữa và hàng +180 là 0,004; hàng +90 là
  0,000), nên thêm hàng không thêm thông tin.
- **Kết luận: suy biến nằm ở stimulus, không ở độ dài strip.** Mọi phương
  pháp pixel (strip dài, 2 hàng, full-cap 96×54) đều đo cùng 1 pha cuộn
  4 trạng thái của pattern. Không sửa `sampleStripeStrip`, không chạy
  probe strip-confirm mới — quyết định này dựa trên đo offline, không
  phải suy đoán.

### 1.2. Đo trực tiếp bằng timing — ĐĂNG KÝ TRƯỚC, trên dữ liệu D4+E6 có sẵn

Phương pháp (không sửa production; dữ liệu đã có sẵn trong blendTick +
`__vcutRvfcPump`): content gap = presContent − ghostContent, với
presContent = floor((tick.currentTime + 1e-6)·30) (currentTime tươi lúc
blend) và ghostContent = ctFrameIdx của pump event đã capture snapshot đó
(currentTime lúc callback rVFC; pixels snapshot được vẽ từ element trong
cùng callback → content ≈ ctFrameIdx ± 1). Nối ghost → pump event bằng
(label == frameIdx, decision capture/reset-capture, seq ≤ lastPumpSeq,
mới nhất); strip pix chỉ kiểm tra phụ danh tính (pix_h = 0 mọi ca nối
được). Ghost đường tick (viaRvfc=0): B2 timing trong ghostPix (snapCt) —
nhưng snapCt null khi srcKind là canvas (xem dưới).

**Hiệu chuẩn (trước khi xem ca):** 520 capture event: (label frameIdx −
ctFrameIdx) = {−1: 12, 0: 350, 1: 158} — **không có ca nào lệch quá 1
frame**; lateMs median −3,2ms, p90 10,9ms, max 385,9ms. 1037 blend tick
(currentTime null: 0): (presCt − presented) = {−8: 1, −7: 1, −5: 4, −4: 1,
−3: 14, −2: 18, −1: 105, 0: 752, 1: 141}; (presCt − expected) = 0 ở cả
1037 tick. Nhiễu nền của 2 đồng hồ là ±1 (đuôi presented −2..−8 hiếm,
39/1037).

**Bar chốt r7 (đăng ký trước):** (a) ≥ 1 ca A có content gap == 2 VÀ (b)
đối chứng B có median content gap == 6 (±1), ≥ 4/7 ca B có content gap
trong {5,6,7}.

| ca | đường | presContent − pres | ghost[1] label → ctFrameIdx | content gap (ghost[1]) |
|---|---|---|---|---|
| r22 c0 fi63 (A) | rVFC | 0 | 57 → 57 | **6** |
| r22 c0 fi69 (A) | rVFC | 0 | 63 → 63 | **6** |
| r22 c1 fi15 (A) | rVFC | 0 | 9 → 9 | **6** |
| r22 c1 fi21 (A) | rVFC | 0 | 15 → 15 | **6** |
| r22 c2 fi11 (A) | rVFC | 0 | 5 → 4 | 7 |
| r23x c1 fi89 (A) | rVFC | −3 (pres=92 ngoài 90 frame) | 86 → 86 | 3 |
| r24 c0 fi87/61/76 (A) | tick | −2 / 0 / 0 | — (B2 snapCt null, không nối được pump) | không đo được |
| r24 c2 fi33 (A) | rVFC | 0 | 27 → 27 | **6** |
| r24 c2 fi81 (A) | rVFC | 0 | 75 → 75 | **6** |
| r33 c0 fi70 (A) | rVFC | 0 | 64 → 64 | **6** |
| r34 c0 fi42 (A) | rVFC | 0 | 36 → 36 | **6** |
| r20 fi36 / r22 fi29 / r24 fi66 / r34 fi13 (B) | rVFC | 0 / −1 / 0 / 0 | → content gap | 6 / 5 / 6 / 7 |
| r23x fi38 (B) | rVFC | −3 | → content gap | 3 |
| wk r29 fi82 / r31 fi53 (B) | tick | 0 / 0 | — (snapCt null) | không đo được |

- **Bar (a): KHÔNG ĐẠT — 0/13 ca A có content gap 2.** 8/10 ca A đường
  rVFC cho content gap đúng 6; 1 ca cho 7 (fi11, ct−label=−1, trong nhiễu
  ±1); 1 ca cho 3 (fi89, presented 92 ngoài dải tham chiếu — ca dị
  thường, không dùng để kết luận).
- **Bar (b): ĐẠT — đối chứng B: content gap [3, 5, 6, 6, 7], median 6,0;
  4/7 ca B trong {5,6,7}** (2 ca đường tick không đo được; 1 ca ở 3 là
  fi38 với presCt−pres=−3, cùng họ ngoại lệ presented như fi89).
- **Đọc đúng:** đồng hồ capture và đồng hồ blend đều nói ghost content
  == nhãn (±1) ở 10/10 ca A đo được — cơ chế "callback trễ 4 frame làm
  nhãn cũ đi" (nhãn pres−6, nội dung pres−2) KHÔNG xảy ra: không một
  capture nào trong 520 event có label−ct = −4 hay +4. Kết hợp strip E6
  (0/13 xác nhận gap 2; 2/13 bác gap 2 thẳng), giả thuyết "nội dung gap
  2" nay không còn trục đo nào ủng hộ. **r7 vẫn mở về mặt hình thức**
  (bar đăng ký trước không đạt) — vì 3 ca đường tick không đo được bằng
  clock và vì pixel-content vẫn chưa được đo độc lập khỏi clock (xem
  §1.3) — nhưng hướng giải thích đã đổi: cụm A nhiều khả năng là blend
  triple gap-6 thật với g≈0,44 (mô hình harmonic hiệu chuẩn trên pair dự
  đoán sai cho triple thưa), chứ không phải nội dung gap-2.

### 1.3. Follow-up khám phá (KHÔNG đăng ký trước): pixel-identity + mô phỏng g

Vì timing nói content == nhãn mà g live (0,44) không khớp dự đoán harmonic
cho triple gap-6 (0,62), F6 kiểm tra thêm trên frame tham chiếu
(`identity104f6.py`): đồng nhất pixel (MAD<1) trong triple content +
g_sim = std(mean(g0c,g1c,presc) ở 96×54)/std(presc).

- Đồng nhất MAD<1: g0==pres ở 3/10 ca A rVFC vs 3/5 ca B rVFC; g1==pres
  0/10 vs 1/5 — **không tách được A/B** (mẫu nhỏ, không có ý nghĩa).
- g_sim KHÔNG dự đoán được g live: fi81 (A) sim 0,751 mà live 0,442;
  fi66 (B) sim 0,334 mà live 0,773; fi53 (B) sim 0,332 mà live 0,784;
  fi13 (B) sim 0,334 mà live 0,769; fi29 (B) sim 0,999 mà live 0,762.
  Sim chỉ đúng hướng ở 3/7 ca B (sim ~0,74, live ~0,77).
- **Đọc đúng:** mô phỏng offline từ frame nguồn KHÔNG tái tạo được g
  live (đúng cảnh báo C4 §4: downscale/moiré + khác biệt decoder + 2 lần
  resample qua snapshot canvas). Kết quả này KHÔNG chứng minh pixels
  live sai frame — nó chỉ chứng minh sim offline không phải công cụ quyết
  định cho r7. Cơ chế tách A (0,44) khỏi B (0,77) khi triple content theo
  clock là như nhau **vẫn chưa giải thích được** — ghi là nợ mở, không
  suy thêm.
- **Bước quyết định đề xuất cho đợt sau (chưa làm): stimulus không tuần
  hoàn** — video test mới mà mỗi frame đều nhận diện được duy nhất bằng
  pixel (vd frame counter / pattern ngẫu nhiên), để strip/cap pin được
  content frame chính xác. Đây là thay đổi probe-spec (video mới +
  baseline mới), không phải thay đổi production. Mọi cách đo pixel trên
  stripes-scroll đều chạm trần 4-pha (§1.1).

### 1.4. Ca gap-6 mới của F6 (khám phá, cùng phương pháp timing)

| ca | band | ring | pres (nhãn) → presContent | ghost[1] label → ct | content gap |
|---|---|---|---|---|---|
| chr r35 c2 fi48 | **A** (g=0,435) | 1, skip 0 | 54 → 48 (−6!) | 48 → 48 (cả 2 ghost đều là clone của snapshot 48) | 0 |
| chr r36 c1 fi85 | B (0,774) | 3, skip 1 | 86 → 85 (−1) | 80 → 79 | 6 |
| chr r36 c2 fi60 | B (0,779) | 3, skip 0 | 60 → 60 | 54 → 54 | 6 |
| wk r36 c1 fi60 | B (0,783) | 3, skip 0 | 60 → 60 | 54 (đường tick, snapCt null) | không đo được |

- 2 ca B đo được đều cho content gap 6 — nhất quán với đối chứng D4+E6.
- **Dị thường mới fi48:** ca A duy nhất của F6, nhưng là ringSize=1
  (pad-clone: ghost[0]==ghost[1]==snapshot 48) — khác cụm A cũ
  (ringSize=3). Nhãn presented 54 lệch clock 48 tới **−6** (ngoài nhiễu
  ±1; chỉ 1/1037 tick hiệu chuẩn lệch −8, 4 tick lệch −5) — presented
  ngoại suy overshoot. Blend theo nhãn+clock là (48,48,48) — lẽ ra g≈1,0
  — nhưng đo được 0,435 (≈ dự đoán pad-triple gap-2 là 0,449). Mâu thuẫn
  này cho thấy **pixels snapshot 48 không phải frame 48** (hoặc current
  không phải 48): 1 trong 3 ảnh của blend không phải frame mà nhãn/clock
  nói. Ghi là dị thường mở, KHÔNG dùng ca này để suy cơ chế r7 (nối
  tick→cap có thể nhầm tick cùng key — caveat chung của phương pháp nối).
  Ca này cũng nhắc lại: nhãn presented ngoại suy có thể lệch nhiều frame
  trong ca hiếm — F3 anchor (luồng khác) có thể liên quan, nhưng F6 tắt
  F3 nên đây là hành vi của code gốc.

---

## §2. D floor — 0 cap D mới, gộp 0/1767, CI 0,170%

| lượt | engine | điều kiện | cap dùng | D |
|---|---|---|---|---|
| chr-blur-r35 | chr | yên (load ~7,9) | 21 | 0 |
| chr-blur-r36 | chr | **sysload 2** | 45 | 0 |
| wk-blur-r35 | wk | yên (silentEngine) | 34 | 0 |
| wk-blur-r36 | wk | **sysload 2** (silentEngine) | 27 | 0 |
| **gộp F6** | | | **127** | **0** |

- **D floor post-fix gộp: 0/1767** (C4 0/867 + D4 0/566 + E6 0/207 + F6
  0/127; 95% CI trên (rule of three) = **0,170%** (E6: 0,183%); Fisher
  một phía so với pre-fix 28/1547: **p=4,77e-10**). **Đạt mục tiêu đợt
  này: CI trên < 0,183%.**
- Pool=1 post-fix gộp (C4+D4+E6+F6): n=55, bands C 23 / B 15 / **A 17** /
  **D 0** (F6 riêng: n=13, A 5 / B 6 / C 2, D 0). A trong pool=1 tiếp tục
  tăng (12/42 → 17/55) — đúng dự đoán pad: chỉ cặp nội dung gap-2 mới
  cho A sau pad.
- Gộp mẫu chỉ hợp lệ vì cùng chế độ: post-fix pad-oldest (verify marker
  còn nguyên trên md5 ca378bbf) + F3 tap+relabel TẮT ở lượt F6 (cùng chế
  độ nhãn với C4/D4/E6 — F3 đang phát triển trên cùng cây, nếu bật thì
  mẫu mới không gộp được).

---

## §3. B-band c0 — kiểm chứng ĐĂNG KÝ TRƯỚC: KHÔNG ĐỦ BẰNG CHỨNG

Mẫu MỚI độc lập (chỉ lượt F6, không dùng lại C4/D4/E6 đã sinh ra
p=0,0042 post-hoc). Giả thuyết một phía đăng ký trước: tỉ lệ pair-like
[0,70–0,76) của clip c0 > clip c2. Bar: Fisher một phía p < 0,05.

| clip | B n | pair-like | tỉ lệ |
|---|---|---|---|
| c0 | 5 | 0 | 0,0% |
| c1 | 20 | 1 | 5,0% |
| c2 | 13 | 1 | 7,7% |
| **gộp F6** | **38** | **2** | **5,3%** |

- **Fisher một phía (c0 > c2): p=1,0** (hai phía tham khảo: p=1,0).
  Hiệu số tỉ lệ c0−c2: **−7,7pp, 95% CI Newcombe [−33,3pp, +36,2pp]**.
- **Power chỉ 15%** (hiệu ứng gốc 17,1% vs 6,1%, n=5/13, một phía
  α=0,05) — mẫu mới quá nhỏ, đặc biệt c0 chỉ 5 B-cap (do r35 chỉ 26 cap
  thô dưới load ~19; c0 nhận ít cap nhất trong 4 lượt).
- **Verdict: KHÔNG ĐỦ BẰNG CHỨNG — không đạt bar p<0,05.** Đây KHÔNG
  phải bằng chứng "không có hiệu ứng": CI rộng bao cả hiệu ứng gốc
  (+11pp) lẫn 0 lẫn chiều ngược. Phát hiện post-hoc cũ (c0 17,1% vs c2
  6,1%, p=0,0042, n=437) **không bị bác, cũng không được xác nhận**.
- B-band F6: n=38, mean 0,774, med 0,774, sd 0,007, dải 0,758–0,788;
  pair-like 2/38 (chr 0/19, wk 2/19) — trung bình không đổi so với E6
  (0,772).
- Nợ này vẫn mở. Lượt kiểm chứng sau cần mẫu mới lớn hơn nhiều (cần
  ~100 B-cap mỗi nhóm c0/c2 cho 80% power) — thực tế cần 6–8 lượt yên
  thay vì 4 lượt dưới tải, hoặc gộp F6 + các lượt mới SAU NÀY nếu đăng ký
  trước việc gộp trước khi chạy chúng (không gộp hồi tố sau khi thấy số
  F6). Không nới bar, không tính lại trên mẫu gộp cũ.

---

## §4. Cửa sổ mù wk — ước lượng từ state100 (KHÔNG chạy blind probe)

| lượt | engine | c1 (ms) | c2 (ms) | tốc độ phát gần biên |
|---|---|---|---|---|
| chr-blur-r35 (đối chứng) | chr | 552 | 2910 | 0,99× / — |
| chr-blur-r36 (đối chứng) | chr | 1185 | 458 | 0,22× / 0,91× |
| wk-blur-r35 | wk | 5781 | 835 | 0,22× / 0,66× |
| wk-blur-r36 | wk | 2323 | 1024 | 0,75× / 0,57× |

- wk c1: 2323–5781ms — trên dải yên Y5 (1018–1480ms), cùng bậc đuôi tải
  D4 (tới 8124ms); cả 2 lượt wk đều silentEngine (pumpN=0, đường tick)
  nên số này là ước lượng trên đường tick, không phải đường rVFC.
- wk c2: 835–1024ms (≈650–840ms sau khi trừ bias +180ms của D4 §3.3) —
  không về ~0 như E6 (303–304ms); đuôi memo c2 vẫn biến thiên lớn.
- chr đối chứng: c1 552–1185ms, c2 458–2910ms — chr không có cửa sổ mù
  thực sự; c2 r35 = 2910ms là ngoại lệ (rate không tính được — phCrossEst
  nhiễu khi ph không đơn điệu, không suy thêm).
- **Kết luận: KHÔNG thu hẹp được — giữ nguyên A5** ("blind = độ trễ khởi
  động element, watchdog đóng góp 0ms; đuôi memo c2 cần thêm lượt yên").
  Việc thu hẹp thật vẫn cần lượt blind yên — bị cấm trong nhiệm vụ này.

---

## §5. Dị thường + bài học harness

1. **Reboot #29 (~08:57Z, boot cff65e89)** cắt ngang chr r36 lần đầu lúc
   chờ yên (chưa phát). Rerun bằng driver104f6b.sh, 3/3 lượt còn lại exit
   0. Không mất dữ liệu (r35 còn nguyên). Bài học cũ vẫn đúng: driver
   ghi log từng lượt + results.json từng lượt thì reboot chỉ tốn lượt
   đang chạy, không tốn cả driver.
2. **WebKit chạy tốt ngay sau reboot #29** (wk r35/r36 exit 0, không thiếu
   lib — khác reboot #25 của C4). Không cần cài lại deps.
3. **Không có ENOSPC đợt này** (khác E6): watcher không cạn dù 9 luồng
   song song — có thể do reboot đã dọn sạch vite server cũ.
4. **wk silentEngine cả 2 lượt** (pumpN=0, blendTick qua đường tick) —
   cap vẫn đo thật và dùng được; nhưng blind wk F6 là trên đường tick,
   và ghost đường tick không pin được content bằng clock (§1.2, §1.4).
5. **Sibling F3 sửa preview.tsx trên cùng cây** (md5 ca378bbf ổn định
   suốt lượt F6; F3 tap+relabel được probe tắt cho baseline). Lượt sau
   phải kiểm tra lại md5 + chế độ F3 trước khi gộp mẫu — nếu F3 land và
   bật mặc định, mẫu mới thuộc chế độ nhãn khác và KHÔNG gộp được với
   C4/D4/E6/F6.
6. **Dị thường fi48** (§1.4): presented 54 vs clock 48; blend (48,48,48)
   theo nhãn+clock mà g=0,435. Nhắc lại caveat nối tick→cap (cùng key có
   thể có nhiều tick) và khả năng snapshot pixels cũ hơn nhãn.

---

## §6. Kiểm chứng (cây cuối, md5 ca378bbf, 09:07–09:09Z)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass 12,50s**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `scripts/test-preview-engine.sh` (apps/web/scripts/): **354 assertions pass**.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §7. Nợ còn lại

1. **r7 VẪN MỞ** — bar timing đăng ký trước không đạt (0/13 content gap
   2), nhưng "nội dung gap 2" đã bị bác trên mọi trục đo được (clock,
   strip, hiệu chuẩn 520 capture). Đóng hẳn r7 cần **stimulus không tuần
   hoàn** (video test mới, mỗi frame nhận diện duy nhất) hoặc đo pixel
   trực tiếp lúc capture — cả hai đều ngoài phạm vi luồng này. Giả thuyết
   dẫn đầu mới: cụm A là blend triple gap-6 thật, mô hình harmonic dự
   đoán sai cho triple thưa; cơ chế tách A/B vẫn chưa giải thích được.
2. **B-band c0:** kiểm chứng đăng ký trước thất bại do thiếu power
   (p=1,0, power 15%, CI [−33,3pp, +36,2pp]) — cần mẫu mới lớn hơn nhiều
   (6–8 lượt yên, ~100 B-cap/nhóm), đăng ký gộp trước khi chạy.
3. **Cửa sổ mù:** đuôi yên vẫn chưa chốt — cần lượt blind yên (A5) — bị cấm
   trong nhiệm vụ này.
4. **Dị thường fi48** (presented overshoot −6 + blend (48,48,48) mà
   g=0,435) chưa giải thích được; cùng họ với dị thường fi35/fi87 của E6
   (cùng tick, g khác xa).
5. Các nợ ngoài phạm vi F6 (giữ nguyên từ LIMITS gộp đợt 103 §4): G1
   deinterlace (chờ user quyết metric G5/M2), 2 MiB (chỉ còn probe ghi
   nội dung byte buffer đầu qtdemux), ghost F8 relabel snapshot (F3 đang
   làm — theo dõi, không can thiệp), zombie đường tick vẽ, re-arm
   (đóng-trần phẳng load4), EPERM probe #22 + khoảng mù #21, birefnet
   (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 104 F6)

- `apps/web/scripts/probe104f6-frame-parity.mjs` — probe mới (copy probe103e6;
  tắt F3 tap+relabel cho baseline; SCRATCH round104-f6; `node --check` OK).
- `docs/PHASE9_ROUND104_F6_BLUR_LIMITS.md` — file này.
- Không push GitHub, không release/tag (giữ release gate).

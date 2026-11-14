# PHASE9_ROUND109_K4_BLUR_CLUSTERA_LIMITS.md — Blur cụm A sysload nhẹ, đợt 109, luồng K4

**Ngày:** 13–14/11/2026. **Luồng:** K4 (Phase 9 đợt 109). **Chủ đề:** Blur cụm A
— chạy thêm lượt SYSLOAD NHẸ để đóng E6 (nợ LIMITS gộp đợt 108 §4 mục 7).
**Bối cảnh:** docs/PHASE9_ROUND108_J5_BLUR_CLUSTERA_LIMITS.md (toàn bộ),
hidden_files/round108-j5/prereg-j5.md + prereg-j5-addendum-r49.md,
hidden_files/round109-k4/prereg-k4.md (viết TRƯỚC mọi lượt probe) +
driver109k4.log / driver109k4x.log + analyze109k4.txt/.json.
**Build:** probe chạy trên `ced42efd` cả 7 lượt (md5 không đổi đầu–cuối;
không sửa production trong luồng này). F3 tap+relabel TẮT trong mọi lượt.
Không push GitHub, không release/tag, không TTS 39, không birefnet.

**Kết quả lớn nhất đợt này:**
- **E6 VẪN MỞ — thiếu đúng 1 sự kiện.** Thu thêm **1 sự kiện band A' mới**
  (r51 c0 pres11, g=0,460, Nhãn-đúng); gộp với 6 cũ thành **7/7 Nhãn-đúng,
  0 E6-ủng hộ, 0 Khác** — bar cần ≥8 nên chưa đủ verdict theo luật prereg
  I8 §3. Cả 6 lượt blur tối đa theo prereg đã dùng hết (r51–r56); r55/r56
  bị đói tick nặng do máy tải nặng (chỉ 20/16 tick) nên không thêm sự kiện.
- **H-alt-weights KHÔNG tái hiện trên dữ liệu mới.** Riêng K4 (n=155):
  median |Δg| trọng số đều **0,060**, H-alt **0,058** — gần như hoà, và
  H-alt không đóng lệch có hệ thống (+0,048 vs đều +0,054). Lợi thế gộp
  (n=958: 0,040 vs 0,064) hoàn toàn do dữ liệu J5 cũ. Quét w tối ưu trên
  dữ liệu gộp tìm ra **w=(0,70, 0,00, 0,30)** — khác hẳn H-alt, với w2=0
  phi lý về cơ chế và lệch signed −0,087 — xem §3.
- **Hiệu chuẩn "presented trong ±1" theo tải — thu hẹp được điểm gãy từ
  phía dưới và phát hiện điểm gãy mới:** bar giữ tới load ~3,65 (r51+r52:
  180/182 = 98,9% trong ±1, trung vị +0); r56 GÃY HOÀN TOÀN (trung vị −4,
  chỉ 2/16 = 12,5% trong ±1 — giống hệt I8 tải nặng load 27,9: trung vị
  −4, 11%) dù mức tải proxy của nó chỉ 4,77. Điểm gãy có thể nằm quanh
  load ~5 chứ không phải đâu đó giữa 2,5 và 27,9 — xem §5 (giả thuyết,
  chưa chứng minh vì tải thật lúc phát r56 không đo trực tiếp).
- **F2: ĐẠT** (350/350 tick nhận diện strip, 318/350 = 90,9% trong ±1)
  nhưng phải đọc theo tải: r51–r54 đạt 97,1%, r55/r56 đói tick chỉ 36%.
- **Lệch g triple không đổi:** gộp n=507: +0,051 (đều) / −0,008 (H-alt)
  — y hệt J5 (+0,051/−0,009, n=505); K4 riêng chỉ có 2 triple nên không
  đủ dữ liệu cập nhật.

---

## §0. Bối cảnh chạy (máy tải nặng, khác hẳn J5)

- **Boot #36** (reboot 2026-11-13 22:53:56Z theo `uptime -s`) ổn định
  suốt lượt; **KHÔNG có reboot** trong lượt (23:46Z–00:24Z).
- **Máy tải nặng do các luồng đợt 109 khác chạy song song:** load1 dao
  động **0,44–45,59** trong lượt (load5 lên tới 24,88 lúc r50 retry chờ
  vite). RAM khả dụng lúc viết prereg chỉ **645 MB**; lúc phát các lượt
  1355–3098 MB. Analyzer chạy lần 1 mất **10,5 phút** (bình thường ~1–2
  phút) vì CPU bị bóp (chỉ ~3,9% CPU cho tiến trình analyzer lúc load
  38,31).
- **Cổng vite (quy định mới đợt 109): 1 lần chờ ~5 phút.** r50 retry
  chờ vite luồng khác (pid 16237 rồi 26538, port 5580, config
  `/tmp/round104-f5/vite.r2.config.mjs`) từ 23:52:57Z tới ~23:58:00Z.
  Các lượt khác qua cổng vite ngay (0 s).
- **Cổng yên driver:** r50 attempt-1 chờ ~120 s (load1 12,42 → 4,89)
  rồi phát; các lượt sau phát ngay (load1 lúc gọi 1,76–3,65). Probe còn
  cổng yên nội bộ (load1 <2,0): r53 chờ 110 s (6,88 → 1,98), r55 chờ
  45 s (3,63 → 1,95) trước khi phát.
- **ENOSPC — 1 attempt fail, retry cứu được:** r50 attempt-1 vite chết
  `ENOSPC ... watch .../apps/web/scripts/templates.test.cjs` ngay sau
  "vite dev đã lên" → `ERR_CONNECTION_REFUSED`, exit 2 (giống hệt mẫu
  J5: vite chết lúc watch khi vite luồng anh em đang chạy). Retry sau
  180 s + chờ vite: exit 0. Tổng: 7 lượt probe thành công sau 1 attempt
  fail.

| lượt | engine | config | sysload | nclips | cap | tick | loadAtPlay | load cuối | mức tải proxy* | exit |
|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-noblur-r50 | chr | stripes-code-noblur | 0 | 1 | 78 | 0† | 1,98 | 1,76 | 1,98 | 0 (retry) |
| chr-code-blur-r51 | chr | stripes-code-blur | 1 | 3 | 108 | 103 | 1,84 | 3,64 | 3,64 | 0 |
| chr-code-blur-r52 | chr | stripes-code-blur | 1 | 3 | 83 | 79 | 2,80 | 3,65 | 3,65 | 0 |
| chr-code-blur-r53 | chr | stripes-code-blur | 1 | 3 | 51 | 46 | 1,98 | 1,42 | 1,98 | 0 |
| chr-code-blur-r54 | chr | stripes-code-blur | 1 | 3 | 92 | 86 | 1,00 | 0,72 | 1,00 | 0 |
| chr-code-blur-r55 | chr | stripes-code-blur | 1 | 3 | 25 | 20 | 1,95 | 1,29 | 1,95 | 0 |
| chr-code-blur-r56 | chr | stripes-code-blur | 1 | 3 | 20 | 16 | 0,90 | 4,77 | 4,77 | 0 |

\* Mức tải lượt = max(loadAtPlay, load cuối) theo quy ước J5/prereg K4 §2.
Hog sysload (1 node busy-loop) đã xác nhận BẬT trong lúc phát ở cả 6 lượt
blur (dòng `D4 sysload: đã đốt 1 CPU hog` trong frame-parity-log.txt).
† noblur không có đường blend nên không có blendTick (đúng thiết kế).
Tổng blur: **379 cap / 350 tick / 156 sự kiện phân biệt**. So với J5
(937 cap / 1044 tick / 804 sự kiện): ít hơn ~2,7× về tick — máy tải nặng
đã làm thưa capture (đặc biệt r55/r56 chỉ 20/16 tick, xem §6).

---

## §1. Bar (a) — verdict E6: VẪN MỞ (7/8, thiếu 1 sự kiện)

- Sự kiện blend phân biệt có đủ content (rVFC, dedup như G7/H4): **156
  mới (K4)** + 804 tái tính từ J5 = **960 gộp**.
- Label gap hiệu chỉnh 6 (mọi band): K4 mới **3**, gộp **12**. Trong band
  A' [0,36, 0,48]: **K4 mới 1, gộp 7 (bar ≥8 → KHÔNG ĐẠT)**.
- Phân loại band A': **Nhãn-đúng 7, E6-ủng hộ 0, Khác 0** (cả K4 mới lẫn
  gộp).

| # | lượt/clip | pres (nhãn→content) | ghosts (nhãn→content) | label gap | content gap | g_live | loại | nguồn |
|---|---|---|---|---|---|---|---|---|
| E1 | r45 c0 pres28 | 28→28 | (21→21), (22→22) | 6 | 6 | 0,473 | Nhãn-đúng | J5 |
| E2 | r45 c0 pres71 | 71→71 | (64→64), (65→65) | 6 | 6 | 0,462 | Nhãn-đúng | J5 |
| E3 | r49 c0 pres11 | 11→11 | (3→3), (5→5) | 6 | 6 | 0,462 | Nhãn-đúng | J5 |
| E4 | r49 c0 pres41 | 41→41 | (33→33), (35→35) | 6 | 6 | 0,472 | Nhãn-đúng | J5 |
| E5 | r49 c2 pres33 | 33→34 | (26→26), (27→27) | 6 | 7 | 0,463 | Nhãn-đúng | J5 |
| E6 | r49 c2 pres84 | 84→84 | (77→77), (78→78) | 6 | 6 | 0,460 | Nhãn-đúng | J5 |
| E7 | **r51 c0 pres11** | 11→11 | (2→2), (5→5) | 6 | 6 | 0,460 | Nhãn-đúng | **K4 mới** |

- **Verdict theo luật prereg (đăng ký trước): E6 VẪN MỞ.** Luật yêu cầu
  ≥7/8 sự kiện cùng loại mới verdict; chỉ có 7 sự kiện nên không ép
  verdict. Hướng bằng chứng vẫn một chiều: **7/7 Nhãn-đúng, 0/7
  E6-ủng hộ** — nếu 1 sự kiện tiếp theo cũng nhãn-đúng thì đạt 8/8 →
  bác E6. Không có sự kiện nào ủng hộ E6 trong cả 960 sự kiện phân biệt
  gộp (không chỉ trong band A').
- **Quy tắc loại sự kiện theo offset (prereg §2): không ảnh hưởng
  verdict.** Trung vị offset nhãn các lượt: r51 +0, r52 +0, r53 +0,
  r54 +0, r55 −0,5, r56 −4. Chỉ r56 vượt ngưỡng |off| >1 → sự kiện r56
  (nếu có) chỉ dùng cho Bar (d); nhưng r56 có **0 sự kiện phân biệt**
  nên không đổi số đếm nào. Sự kiện mới duy nhất (r51) có offset trung
  vị lượt +0 — hợp lệ đầy đủ.
- **Nhạy cảm theo mức tải (báo thêm, không phải verdict chính):** nếu
  chỉ tính các lượt trong dải tải proxy [2,0, 5,0] (r49 J5 + r51/r52/r56
  K4) thì gộp được **5 sự kiện** (4 của r49 + 1 của r51), vẫn 5/5
  Nhãn-đúng. Verdict chính theo prereg §4 gộp toàn bộ (7/8) — ghi rõ
  để đợt sau không nhầm.
- **Vì sao chỉ được 1 sự kiện mới dù chạy 6 lượt blur:** tỉ lệ sự kiện
  band A' trên tick của K4 là 1/350 (0,29%), thấp hơn J5 (6/1044 =
  0,57%). Hai lượt cuối r55/r56 bị đói tick nặng (20/16 tick so với mục
  tiêu ≥100 tick/lượt) vì máy tải nặng trong cửa sổ phát — pump chỉ
  capture được 22/21 lần (pumpN) so với 109 của r51. Prereg giới hạn
  tối đa 6 lượt blur nên dừng ở đây, không chạy thêm r57/r58; nợ 1 sự
  kiện chuyển sang đợt sau (xem §8).

## §2. F2 — strip live: ĐẠT (đọc theo mức tải)

Gộp 6 lượt blur K4 (rVFC): tick 350; presented strip nhận diện 350/350
(100%, bar ≥80%); trong ±1: 318/350 (90,9% của số nhận diện, bar ≥80%);
ghost nhận diện đủ cả 2: 350/350. **F2: ĐẠT.** Nhưng phải đọc theo tải
(xem §5): r51–r54 đạt 305/314 (97,1%) trong ±1, r55/r56 đói tick chỉ
13/36 (36,1%). F2 gộp 90,9% bị kéo xuống bởi 2 lượt đói — không phải
fail phương pháp, mà là hiệu chuẩn tải.

## §3. Bar (b) — kiểm tra chéo cơ chế blend: H-alt KHÔNG tái hiện trên dữ liệu mới

Với các sự kiện có ≥2 content phân biệt (strip-xác nhận):

| | n | median \|g_live − g_pred\| | mean signed |
|---|---|---|---|
| **K4 mới — trọng số đều [1,1,1]/3** | 155 | **0,060** | **+0,054** |
| **K4 mới — H-alt w=(0,20, 0,35, 0,45)** | 155 | **0,058** | **+0,048** |
| Gộp K4+J5 — trọng số đều | 958 | **0,064** | **+0,055** |
| Gộp K4+J5 — H-alt | 958 | **0,040** | **+0,017** |
| J5 cũ (đối chiếu) — đều / H-alt | 803 | 0,064 / 0,025 | +0,055 / +0,012 |

- **Kết luận: H-alt KHÔNG được củng cố bởi dữ liệu mới.** Trên dữ liệu
  K4 riêng, H-alt gần như không khác trọng số đều (0,058 vs 0,060) và
  KHÔNG đóng lệch có hệ thống (+0,048 vs +0,054 — vẫn lệch một chiều
  rõ rệt). Lợi thế gộp (0,040 vs 0,064) hoàn toàn do dữ liệu J5 cũ
  mang lại; thêm 155 sự kiện mới đã kéo median H-alt gộp từ 0,025 (J5)
  lên 0,040.
- Sự kiện band A' mới duy nhất (r51 c0 pres11, content [2, 5, 11]):
  g_live 0,460 vs g_pred(đều) 0,390 (|Δ|=0,070) vs g_pred(alt) 0,509
  (|Δ|=0,049) — H-alt gần hơn nhưng **vượt quá** (overshoot), cùng
  hướng với outlier gap-7 r49 (H-alt sai 0,213, đều sai 0,068).
- **Quét w tối ưu (nợ J5 §7 mục 2 — làm xong ở đây):** quét lưới
  w=(w1,w2,w3), tổng 1, bước 0,05, trên sự kiện gộp (n=958): w tối ưu
  theo median |Δg| là **w=(0,70, 0,00, 0,30), median 0,014, mean
  signed −0,087**. So với đều (0,064) và H-alt (0,040). Nhưng kết quả
  này **không đáng tin làm cơ chế**: (1) w2=0 nghĩa là frame giữa
  (ghost mới nhất) đóng góp 0 — phi lý về cơ chế blend 3-frame; (2)
  mean signed −0,087 cho thấy nó tối ưu median bằng cách chấp nhận
  lệch hệ thống lớn theo chiều ngược lại; (3) phân bố g_live bimodal
  (mode thấp ~0,46–0,48 và mode cao ~0,75) làm median-|Δ| thành
  objective kém — nó chọn w khớp mode đông hơn và bỏ qua mode còn
  lại. Quét này là mô tả post-hoc trên dữ liệu gộp (đã đăng ký trước
  trong prereg K4 §4), KHÔNG phải kiểm chứng mù.
- Hệ quả: cả H-alt lẫn w quét được đều không phải đáp án dứt khoát.
  Mâu thuẫn với code `motionBlurBlendPlan` (trung bình đều theo quy
  nạp) vẫn mở; cần kiểm chứng mù với trọng số đăng ký trước trên dữ
  liệu mới hoàn toàn, hoặc chấp nhận rằng g_live bimodal cần mô hình
  khác (vd hai chế độ blend). Ghi là nợ mở, không suy đoán thêm.

## §4. Bar (c) — lệch g triple: không đổi

- K4 riêng: chỉ **n=2** triple liên tiếp (dưới ngưỡng 3 của prereg) —
  lệch +0,039 (đều) / +0,013 (H-alt), **không đủ dữ liệu cập nhật**,
  giữ số J5.
- Gộp K4+J5: n=**507** triple; g_live mean 0,569 (med 0,476) vs
  g_pred đều mean 0,518 → lệch **+0,051**; vs g_pred H-alt mean 0,578
  → lệch **−0,008**. Y hệt J5 (+0,051/−0,009, n=505) — 2 triple mới
  không làm nhúc nhích số gộp. So với I8 (+0,029, n=43): lệch với
  trọng số đều vẫn lớn hơn trên stimulus mới, H-alt vẫn đóng lệch.
  (Lưu ý: lệch triple gộp và Bar (b) gộp cùng hướng — H-alt khớp tốt
  trên dữ liệu gộp cũ nhưng không tái hiện trên dữ liệu K4 mới, xem §3.)

## §5. Bar (d) — hiệu chuẩn "presented trong ±1" theo tải: giữ tới 3,65; GÃY ở r56

| lượt | load lúc phát | load cuối | mức tải proxy | n tick | pres off trung vị (dải) | trong ±1 | ghost off trung vị |
|---|---|---|---|---|---|---|---|
| r51 | 1,84 | 3,64 | 3,64 | 103 | +0 (−1..+2) | 102/103 (99,0%) | +0 |
| r52 | 2,80 | 3,65 | 3,65 | 79 | +0 (−2..+1) | 78/79 (98,7%) | +0 |
| r53 | 1,98 | 1,42 | 1,98 | 46 | +0 (−3..+1) | 42/46 (91,3%) | +0 |
| r54 | 1,00 | 0,72 | 1,00 | 86 | +0 (−2..+2) | 83/86 (96,5%) | +0 |
| r55 | 1,95 | 1,29 | 1,95 | 20 | −0,5 (−5..+1) | 11/20 (55,0%) | +0 |
| r56 | 0,90 | 4,77 | 4,77 | 16 | **−4 (−9..+1)** | **2/16 (12,5%)** | +0 |
| **r51+r52 gộp** | | | **3,64–3,65** | **182** | **+0** | **180/182 (98,9%)** | +0 |
| **r53+r54 gộp** | | | **1,00–1,98** | **132** | **+0** | **125/132 (94,7%)** | +0 |
| K4 gộp | | | | 350 | | 318/350 (90,9%) | +0 |

- **Hiệu chuẩn chốt (cập nhật):** bar "presented trong ±1" **giữ tới
  load proxy ~3,65** (98,9% trong ±1, trung vị +0) — thu hẹp từ phía
  dưới so với J5 (giữ tới 2,5). Đối chiếu: yên-sâu J5 (load <2):
  99,8%; tải nặng I8 (load 27,9): trung vị −4, 11% trong ±1.
- **r56 GÃY — phát hiện mới quan trọng nhất của Bar (d):** trung vị
  −4, chỉ 12,5% trong ±1, dải tới −9 — **gần như sao chép y hệt số I8
  tải nặng** (trung vị −4, 11%). Nhưng mức tải proxy của r56 chỉ 4,77
  (loadAtPlay 0,90 → load cuối 4,77; load5 lúc cuối 9,92). Tải thật
  trong cửa sổ phát r56 (00:23:08–00:24:25Z) không đo trực tiếp được
  bằng proxy 2 điểm — load1 đang tăng nhanh trong lúc phát (0,90 →
  4,77 trong ~77 s) và load5 ~10 — tải tức thời lúc phát có thể ~5–9.
  **Giả thuyết (chưa chứng minh): điểm gãy nằm quanh load ~5, không
  phải đâu đó giữa 2,5 và 27,9.** Cần đo mức tải trung gian có kiểm
  soát (vd giữ load ổn định ~5–8 trong suốt lượt phát) để xác nhận —
  ngoài phạm vi luồng này.
- **r55 đói (55%, trung vị −0,5, dải tới −5):** proxy chỉ 1,95 nhưng
  pump đói (25 cap/20 tick; playhead 7,83 sau 10,88 s tường ≈ 0,72×
  realtime). Load1 thấp nhưng load5 lúc phát ~12 — tải tức thời theo
  đợt (burst) từ luồng khác có thể đã bóp pump dù load1 trung bình
  thấp. Đây là bằng chứng rằng **load1 trung bình không đủ để mô tả
  tải lúc phát** khi máy có burst tải từ luồng khác.
- **Caveat phương pháp — proxy max() bị lệch (ghi rõ):** KHÔNG lượt nào
  trong 6 lượt blur rơi vào dải mục tiêu [2,0, 3,5] theo proxy:
  r51/r52 vừa trên (3,64/3,65), r53/r55 vừa dưới (1,98/1,95), r54 xa
  dưới (1,00), r56 trên (4,77). Nguyên nhân: (1) loadavg là trung bình
  trượt ~60 s, trong khi cửa sổ phát chỉ ~25–45 s nên hog (+1 tải) chưa
  kịp hiện hết vào load1 lúc lấy mẫu cuối; (2) tải nền từ luồng khác
  sụt nhanh trong phiên (load5 12,41 → 5,11 từ r50 tới r54) nên load1
  rơi nhanh hơn hog nâng lên. Hog BẬT đã xác nhận ở cả 6 lượt, nên
  "sysload nhẹ" đúng về phương pháp nhưng **mức tải proxy không đáng
  tin để phân nhóm chặt**. Đợt sau nên lấy mẫu loadavg mỗi 5 s trong
  lúc phát (sửa probe) để có tải trung bình thật trong cửa sổ phát
  thay cho max() 2 điểm.
- Theo luật loại lượt prereg §2 (mức tải <2,0 hoặc >5,0 loại khỏi nhóm
  sysload nhẹ): r53 (1,98), r54 (1,00), r55 (1,95) rơi ngoài dải theo
  proxy — nhưng như đã phân tích, proxy này lệch xuống, và sự kiện
  band A' duy nhất đến từ r51 (3,64, trong dải 2–5) nên verdict Bar (a)
  không bị ảnh hưởng. Ghi rõ để đợt sau không dùng proxy này làm căn
  cứ loại lượt một cách máy móc.

---

## §6. Sự cố hạ tầng trong lượt

- **ENOSPC — 1 attempt fail, retry cứu được:** r50 attempt-1 vite chết
  `ENOSPC ... watch .../templates.test.cjs` (vite-attempt1.log), exit 2.
  Retry sau 180 s + chờ cổng vite: exit 0. Cùng mẫu J5 (race lúc vite
  luồng anh em đang chạy/khởi động); tổng watch đếm được vẫn xa dưới
  max_user_watches — chưa giải thích, ghi là nợ hạ tầng.
- **Cổng vite chờ ~5 phút (r50 retry):** vite luồng khác port 5580
  (config round104-f5) chiếm từ 23:52:57Z tới ~23:58:00Z. Không lượt
  nào hoãn vì hết 20 phút chờ vite.
- **0 lượt hoãn vì cổng yên driver** (load1 <5 trong 120 s ở mọi lượt;
  r50 attempt-1 chờ đủ 120 s rồi phát lúc load 4,89).
- **r55/r56 đói tick:** pump chỉ 22/21 lần capture (pumpN) so với 109
  của r51; playhead r55 chỉ 0,72× realtime. Nguyên nhân: máy tải nặng
  (load5 9,92–12,51 trong cửa sổ phát) từ luồng khác, không phải lỗi
  probe hay sản phẩm. Hai lượt này vẫn hợp lệ để phân tích (dữ liệu
  thật, không loại), nhưng đóng góp ít (36 tick gộp, 4 sự kiện phân
  biệt, 0 sự kiện band A').
- **Lỗi nhỏ trong analyzer (đã sửa trước lần chạy cuối):** bộ lọc
  `K4_BLUR`/`J5_BLUR` dùng `"blur" in tag` nên cũng khớp tag noblur
  (`chr-code-noblur-r50` chứa chuỗi "blur") — chỉ gây ra dòng in thừa
  (F2/sự kiện 0 cho lượt noblur), không ảnh hưởng số liệu vì noblur
  không có blendTick. Đã sửa thành `startswith("chr-code-blur-")`
  trước lần chạy phân tích cuối.
- **Không có reboot trong lượt.** Boot #36 ổn định suốt.
- **Baseline nhất quán qua 2 boot:** baseline g live K4 (noblur r50,
  n=78 cap, chỉ c0) = **88,06** vs J5 (noblur r45, n=80 cap) = **88,11**
  — lệch 0,05%, chứng tỏ baseline ổn định, không phải nguồn nhiễu
  cho g_live.
- **cap g<0,35: 0/379** (tham khảo — band D stripes không áp cho
  stimulus mới).

## §7. Kiểm chứng (cây cuối, md5 ced42efd)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass (18,80 s)** — chậm hơn bình thường do máy tải nặng.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (chạy từ apps/web; lần đầu chạy sai cwd nên
  MODULE_NOT_FOUND — đã chạy lại đúng và pass).
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet. preview.tsx md5 cuối
  `ced42efd785724c8c0d1b16fc32c7341` — đúng md5 yêu cầu.

---

## §8. Nợ còn lại

1. **E6: VẪN MỞ (thiếu đúng 1 sự kiện band A').** 7/7 Nhãn-đúng, 0
   E6-ủng hộ. Đợt sau: chạy thêm lượt sysload nhẹ trong cửa sổ máy yên
   hơn (tránh r55/r56 đói tick) để lấy 1 sự kiện nữa → 8/8 bác E6. Lưu
   ý: prereg K4 giới hạn tối đa 6 lượt blur đã dùng hết — đợt sau cần
   prereg mới, không tự nối thêm lượt vào luồng này.
2. **H-alt-weights: KHÔNG tái hiện trên dữ liệu mới.** K4 riêng gần như
   hoà với trọng số đều (0,058 vs 0,060); quét w gộp tìm (0,70, 0,00,
   0,30) — khác H-alt, w2=0 phi lý. Cần: kiểm chứng mù với trọng số
   đăng ký trước trên dữ liệu mới hoàn toàn; hoặc mô hình hai chế độ
   cho g_live bimodal. Đừng dùng H-alt làm kết luận cho tới khi có
   kiểm chứng mù.
3. **Lệch g triple: +0,051 (đều) / −0,008 (H-alt), n=507 gộp — không
   đổi.** K4 riêng chỉ 2 triple, không đủ dữ liệu.
4. **Điểm gãy label-lag: giả thuyết mới quanh load ~5** (r56: trung vị
   −4, 12,5% trong ±1 ở proxy 4,77, giống I8 load 27,9). Cần đo mức tải
   trung gian có kiểm soát (giữ load ổn định ~5–8 suốt lượt phát) để
   xác nhận — và sửa probe lấy mẫu loadavg mỗi 5 s trong lúc phát thay
   cho proxy max() 2 điểm (proxy đã chứng minh lệch xuống khi tải nền
   biến động nhanh).
5. **ENOSPC race lúc vite song song:** vẫn chưa giải thích; đợt sau giữ
   quy định chờ cổng vite (đã có từ đợt 109).
6. Các nợ ngoài phạm vi K4 (giữ nguyên từ LIMITS gộp đợt 108 §4): G1
   deinterlace (chờ user quyết metric G5/M2), mù #22 (chờ user quyết),
   Re-arm A/B tắt E4, 2 MiB (thí nghiệm phân biệt queue2), Zombie gate
   (b), Blur B-band (p=0,3545), Ghost C3b chạy lại lúc yên, Harness E1
   (6/7), EPERM probe #28 + mù #27, birefnet (CẤM thử lại khi RAM chưa
   đổi), TTS 39 (CẤM kiểm lại), `ci-security.yml` 403 (chờ user),
   release gate giữ nguyên.

---

## File đổi/thêm (đợt 109 K4)

- `apps/web/scripts/probe109k4-frame-parity.mjs` — probe copy probe108j5
  (chỉ đổi SCRATCH sang round109-k4; không đổi logic/config).
- `docs/PHASE9_ROUND109_K4_BLUR_CLUSTERA_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round109-k4/` (không stage): prereg-k4.md,
  driver109k4.sh + driver109k4x.sh + .log, analyze109k4.py +
  .txt/.json, 7 thư mục lượt probe (chr-code-noblur-r50,
  chr-code-blur-r51/r52/r53/r54/r55/r56, mỗi thư mục có
  frame-parity-results.json + .log + vite-attempt*.log; r50 có thêm
  frame-parity-error.txt của attempt-1 fail).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).

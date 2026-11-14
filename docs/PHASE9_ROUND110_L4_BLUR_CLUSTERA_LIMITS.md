# PHASE9_ROUND110_L4_BLUR_CLUSTERA_LIMITS.md — Blur cụm A, đợt 110, luồng L4

**Ngày:** 14/11/2026. **Luồng:** L4 (Phase 9 đợt 110). **Chủ đề:** Blur cụm A
— kiếm sự kiện thứ 8 để đóng E6 + đo điểm gãy tải.
**Bối cảnh:** docs/PHASE9_ROUND109_K4_BLUR_CLUSTERA_LIMITS.md (toàn bộ),
docs/PHASE9_ROUND109_LIMITS.md §4 mục 6,
hidden_files/round110-l4/prereg-l4.md (viết TRƯỚC mọi lượt probe) +
addendum-prereg-l4.md + driver110l4.log + analyze110l4.txt/.json.
**Build:** probe chạy trên `9b27abe5` cả 7 lượt (md5 không đổi đầu–cuối;
**KHÔNG phải `ced42efd` của K4** — L1 đã sửa production trước lượt đầu,
xem §0; không sửa production trong luồng này). F3 tap+relabel TẮT trong
mọi lượt. Không push GitHub, không release/tag, không TTS 39, không birefnet.

**Kết quả lớn nhất đợt này:**
- **E6 BỊ BÁC — ĐÃ ĐÓNG.** Thu thêm **11 sự kiện band A' mới, cả 11
  Nhãn-đúng** (vượt xa 1 sự kiện còn thiếu); gộp với 7 cũ thành **18/18
  Nhãn-đúng, 0 E6-ủng hộ, 0 Khác** — vượt bar ≥7/8. Nhạy cảm (chỉ lượt
  có sampled mean [2,5]): 12/12 Nhãn-đúng. E6 không còn là nợ mở.
- **H-alt-weights KHÔNG tái hiện — lần thứ hai liên tiếp.** Kiểm chứng mù
  đăng ký trước trên dữ liệu L4 mới hoàn toàn (n=409): đều median 0,068
  vs H-alt 0,060 — cải thiện chỉ 0,008, DƯỚI ngưỡng đăng ký trước 0,010
  → **KHÔNG TÁI HIỆN** (K4 cũng không tái hiện: 0,060 vs 0,058). Lợi thế
  gộp (n=1367: 0,046 vs 0,065) vẫn hoàn toàn do dữ liệu J5 cũ.
- **Điểm gãy tải: KHÔNG đóng khoảng.** Cả 6 lượt blur đều GIỮ (trung vị
  off +0, trong ±1: 81–100%) — kể cả 2 lượt "trung gian" r62/r63, vì
  chúng **không đạt được tải lấy mẫu 5–8** (r62: 0,95; r63: 0,71 dù đốt
  3/5 hog). Phát hiện phương pháp: load1 là trung bình trượt ~60 s nên
  không kịp phản ánh tải hog mới đốt trong cửa sổ phát chỉ ~10–12 s;
  tải lấy mẫu vẫn lệch xuống khi tải được đốt đột ngột — xem §5.
- **F2: ĐẠT** ở mọi nhóm (671/671 tick nhận diện, 643/671 = 95,8%
  trong ±1; nhóm nhẹ 569/583 = 97,6%; nhóm "trung gian" 74/88 = 84,1%).
- **Lệch g triple không đổi:** L4 riêng n=29: +0,048 (đều) / −0,009
  (H-alt); gộp n=536: +0,051 / −0,008 — y hệt K4/J5.

---

## §0. Bối cảnh chạy (boot mới, build mới, máy tải nặng lúc đầu)

- **Boot đổi GIỮA lúc viết prereg và lúc chạy driver:** prereg viết trên
  boot 2026-11-14 02:24:45Z; driver start 02:57:11Z ghi boot mới
  `ce518c02-0368-46f4-8416-d61e7d042d84`, uptime_s 2026-11-14 02:50:48Z
  (xem addendum-prereg-l4.md). Không có reboot nào nữa trong lượt
  (boot này ổn định suốt 02:57–03:18Z).
- **L1 đã sửa production TRƯỚC lượt đầu:** file chia sẻ
  `round110-preview-md5.txt` xuất hiện 02:55:02Z:
  `9b27abe57975ec5b69ec2e21c3fa281c ... L1-fix`. md5 preview.tsx lúc
  driver start là `9b27abe5` (không còn `ced42efd` của K4). Toàn bộ 7
  lượt L4 chạy trên build mới `9b27abe5`, md5 không đổi trong bất kỳ
  lượt nào (mtimeChangedMidRun=false cả 7 lượt) — nên KHÔNG có lượt
  "lai", KHÔNG cần baseline phụ. Baseline r57 đo lại trên boot/build
  mới đúng như prereg §1/§3.
- **Máy tải nặng lúc đầu, yên dần về sau:** load1 lúc driver start
  29,13 (RAM khả dụng chỉ 1486 MB); lúc phát các lượt 0,63–6,34;
  load5 lúc phát 3,80–11,01 — tải nền từ luồng khác sụt dần trong
  phiên (load5 11,09 → 3,96 từ r57 tới r63).
- **Cổng vite: r57 chờ 240 s** (vite luồng khác pid 5127, port 5580,
  config round77-e1) **+ chờ lock 360 s** (L5-run30 lấy lock lúc
  03:01:19Z, chỉ vài giây SAU khi cổng pgrep của L4 vừa mở — minh họa
  race giữa cổng pgrep và lock: lock mới là chốt chặn thật). Các lượt
  sau qua cả hai cổng ngay (0 s).
- **ENOSPC — 0 attempt fail, 0 retry:** cả 7 lượt vite lên ngay attempt
  1 (vite config L4 có `server.watch.ignored: ["**/**"]`, CFG_DIR riêng
  /tmp/round110-l4). Đây là lần đầu tiên trong chuỗi blur không có
  attempt ENOSPC nào — phù hợp với giả thuyết watch.ignored loại bỏ
  inotify watch của vite (chưa chứng minh nhân quả chặt, chỉ ghi nhận
  tương quan: 7/7 attempt 1 lên ngay).
- **0 lượt hoãn** (vite/load), 0 lượt reboot cắt ngang, 0 lượt đói nặng
  tới mức loại (r62/r63 ít tick nhưng vẫn hợp lệ, xem §5).

| lượt | engine | config | sysload | nclips | cap | tick | sampled mean load1 (n) | proxy max | md5 | exit |
|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-noblur-r57 | chr | stripes-code-noblur | 0 | 1 | 87 | 0† | 2,08 (n=2) | — | 9b27abe5 | 0 |
| chr-code-blur-r58 | chr | stripes-code-blur | 1 | 3 | 155 | 182 | **2,63** (n=4) | 4,07 | 9b27abe5 | 0 |
| chr-code-blur-r59 | chr | stripes-code-blur | 1 | 3 | 108 | 120 | **3,19** (n=4) | 3,47 | 9b27abe5 | 0 |
| chr-code-blur-r60 | chr | stripes-code-blur | 1 | 3 | 168 | 197 | 1,75 (n=4) | 1,94 | 9b27abe5 | 0 |
| chr-code-blur-r61 | chr | stripes-code-blur | 1 | 3 | 87 | 84 | 1,59 (n=4) | 1,76 | 9b27abe5 | 0 |
| chr-code-blur-r62 | chr | stripes-code-blur | 3 | 3 | 42 | 36 | 0,95 (n=4) | 1,15 | 9b27abe5 | 0 |
| chr-code-blur-r63 | chr | stripes-code-blur | 5 | 3 | 57 | 52 | 0,71 (n=4) | 0,78 | 9b27abe5 | 0 |

† noblur không có đường blend nên không có blendTick (đúng thiết kế).
Tổng blur: **617 cap / 671 tick / 411 sự kiện phân biệt**. So với K4
(379 cap / 350 tick / 156 sự kiện): gần gấp đôi tick, gấp 2,6× sự kiện —
máy yên dần + build mới cho capture dày hơn (xem §6 về tỉ lệ sự kiện).

---

## §1. Bar (a) — verdict E6: BỊ BÁC (18/18 Nhãn-đúng)

- Sự kiện blend phân biệt có đủ content (rVFC, dedup như G7/H4): **411
  mới (L4)** + 156 tái tính từ K4 + 804 tái tính từ J5 = **1371 gộp**.
- Label gap hiệu chỉnh 6 (mọi band): L4 mới **18**, gộp **30**. Trong band
  A' [0,36, 0,48]: **L4 mới 11, gộp 18 (bar ≥8 → ĐẠT)**.
- Phân loại band A': **Nhãn-đúng 18, E6-ủng hộ 0, Khác 0** (cả L4 mới
  lẫn gộp). Không lượt L4 nào bị loại khỏi Bar (a): trung vị offset
  nhãn +0 ở cả 6 lượt, md5 ổn định cả 6 lượt.

| # | lượt/clip | pres (nhãn→content) | ghosts (nhãn→content) | label gap | content gap | g_live | loại | nguồn |
|---|---|---|---|---|---|---|---|---|
| E1–E6 | r45/r49 (J5) | — | — | 6 | 6–7 | 0,460–0,473 | Nhãn-đúng | J5 |
| E7 | r51 c0 pres11 | 11→11 | (2→2), (5→5) | 6 | 6 | 0,460 | Nhãn-đúng | K4 |
| E8 | **r58 c0 pres9** | 9→9 | (1→1), (3→3) | 6 | 6 | 0,473 | Nhãn-đúng | **L4 mới** |
| E9 | **r59 c0 pres51** | 51→51 | (42→42), (45→45) | 6 | 6 | 0,476 | Nhãn-đúng | **L4 mới** |
| E10 | **r59 c1 pres39** | 39→39 | (30→30), (33→33) | 6 | 6 | 0,463 | Nhãn-đúng | **L4 mới** |
| E11 | **r59 c1 pres45** | 45→46 | (33→33), (39→39) | 6 | 7 | 0,466 | Nhãn-đúng | **L4 mới** |
| E12 | **r59 c1 pres51** | 51→51 | (39→39), (45→45) | 6 | 6 | 0,463 | Nhãn-đúng | **L4 mới** |
| E13 | **r60 c1 pres64** | 64→64 | (55→55), (58→58) | 6 | 6 | 0,462 | Nhãn-đúng | **L4 mới** |
| E14 | **r63 c1 pres22** | 22→22 | (9→9), (16→16) | 6 | 6 | 0,473 | Nhãn-đúng | **L4 mới** |
| E15 | **r63 c1 pres43** | 43→43 | (26→26), (37→37) | 6 | 6 | 0,470 | Nhãn-đúng | **L4 mới** |
| E16 | **r63 c2 pres20** | 20→20 | (8→8), (14→14) | 6 | 6 | 0,457 | Nhãn-đúng | **L4 mới** |
| E17 | **r63 c2 pres29** | 29→29 | (20→20), (23→23) | 6 | 6 | 0,458 | Nhãn-đúng | **L4 mới** |
| E18 | **r63 c2 pres47** | 47→47 | (35→35), (41→41) | 6 | 6 | 0,473 | Nhãn-đúng | **L4 mới** |

- **Verdict theo luật prereg (đăng ký trước): E6 BỊ BÁC.** 18 sự kiện
  ≥ bar 8, 18/18 Nhãn-đúng ≥ bar 7/8 cùng loại. Không có sự kiện nào
  ủng hộ E6 trong cả 1371 sự kiện phân biệt gộp (không chỉ trong band A').
- **Nhạy cảm theo mức tải (báo thêm, không phải verdict chính):** chỉ
  tính các lượt L4 hợp lệ có sampled mean [2,5] (r58/r59) + sự kiện cũ
  thì gộp được **12 sự kiện, 12/12 Nhãn-đúng** — verdict không phụ thuộc
  vào việc có tính r60/r61 (dưới dải) hay r62/r63 ("trung gian") hay không.
- **Vì sao L4 được tới 11 sự kiện mới (K4 chỉ được 1):** tỉ lệ sự kiện
  band A' trên tick của L4 là 11/671 (1,64%), cao gấp ~5,6× K4 (1/350
  = 0,29%) và gấp ~2,9× J5 (6/1044 = 0,57%). Tỉ lệ sự kiện phân biệt
  trên tick cũng cao hơn: 411/671 = 61% (K4: 156/350 = 45%; J5:
  804/1044 = 77% — J5 vẫn cao nhất). Chưa rõ nguyên nhân: máy yên dần
  trong phiên L4 (capture dày: r58 182 tick, r60 197 tick — cao nhất
  chuỗi blur từ trước tới nay), build mới `9b27abe5` của L1 có thể đã
  đổi nhịp capture/frame, hoặc dao động ngẫu nhiên theo lượt. Ghi là
  quan sát, không suy đoán cơ chế — và không ảnh hưởng verdict vì mọi
  sự kiện đều strip-xác nhận content đầy đủ, phân loại độc lập với tỉ lệ.

## §2. F2 — strip live: ĐẠT (mọi nhóm)

Gộp 6 lượt blur L4 (rVFC): tick 671; presented strip nhận diện 671/671
(100%, bar ≥80%); trong ±1: 643/671 (95,8% của số nhận diện, bar ≥80%);
ghost nhận diện đủ cả 2: 671/671. **F2: ĐẠT.** Theo nhóm tải lấy mẫu:
nhóm nhẹ r58–r61: 583 tick, 569/583 = 97,6% trong ±1 — **ĐẠT**; nhóm
"trung gian" r62–r63: 88 tick, 74/88 = 84,1% trong ±1 — **ĐẠT**
(dù ít tick, vẫn trên bar 80%).

## §3. Bar (b) — kiểm chứng mù H-alt: KHÔNG TÁI HIỆN (lần 2 liên tiếp)

Trọng số H-alt w=(0,20, 0,35, 0,45) đăng ký tại prereg-l4 §4 TRƯỚC mọi
lượt probe; kiểm chứng chính trên dữ liệu L4 MỚI HOÀN TOÀN (n=409 sự
kiện, baseline r57). Tiêu chí đăng ký trước: H-alt "TÁI HIỆN" iff
median|Δg|_alt < median|Δg|_đều − 0,010 VÀ |mean_signed_alt| <
|mean_signed_đều|.

| | n | median \|g_live − g_pred\| đều | mean signed đều | median \|Δg\| H-alt | mean signed H-alt |
|---|---|---|---|---|---|
| **L4 mới (mù)** | 409 | **0,068** | **+0,063** | **0,060** | **+0,048** |
| L4 (hợp lệ — trùng mù, không lượt nào bị loại) | 409 | 0,068 | +0,063 | 0,060 | +0,048 |
| Gộp L4+K4+J5 (mô tả) | 1367 | 0,065 | +0,057 | 0,046 | +0,027 |
| K4 riêng (đối chiếu) | 155 | 0,060 | +0,054 | 0,058 | +0,048 |
| J5 cũ (đối chiếu) | 803 | 0,064 | +0,055 | 0,025 | +0,012 |

- **Kết luận: H-alt KHÔNG tái hiện trên dữ liệu mới.** Cải thiện median
  chỉ 0,008 (0,068 → 0,060), DƯỚI ngưỡng 0,010 đăng ký trước — điều
  kiện thứ nhất của tiêu chí mù KHÔNG đạt (điều kiện thứ hai đạt:
  |+0,048| < |+0,063|, nhưng tiêu chí là VÀ). H-alt vẫn không đóng
  lệch có hệ thống một cách thuyết phục trên dữ liệu mới.
- Đây là **lần thứ hai liên tiếp** một đợt dữ liệu mới hoàn toàn không
  tái hiện H-alt (K4: 0,060 vs 0,058 — gần như hoà; L4: 0,068 vs
  0,060 — cải thiện nhỏ, dưới ngưỡng). Lợi thế gộp (0,046 vs 0,065)
  vẫn hoàn toàn do dữ liệu J5 cũ mang lại; thêm 409 sự kiện L4 đã kéo
  median H-alt gộp từ 0,040 (K4) lên 0,046.
- Sự kiện band A' mới (11 sự kiện): g_pred H-alt thường VƯỢT quá
  g_live (vd r59 c0 pres51: live 0,476 vs alt 0,516; r63 c1 pres22:
  live 0,473 vs alt 0,515), trong khi đều thì THIẾU (0,403 / 0,399) —
  H-alt gần hơn về |Δ| trung bình nhưng sai theo hướng ngược lại, cùng
  mẫu với outlier gap-7 của K4.
- Outlier gap-7 tái hiện: r59 c1 pres45 (content gap 7): g_live 0,466
  vs g_pred(đều) 0,394 (|Δ|=0,072) vs g_pred(alt) 0,319 (|Δ|=0,147) —
  H-alt sai GẤP ĐÔI trọng số đều, cùng hướng với outlier gap-7 r49
  (H-alt sai 0,213, đều sai 0,068). Hai outlier gap-7 độc lập đều cho
  thấy H-alt tệ hơn đều — bằng chứng phụ chống lại H-alt, không phải
  kiểm chứng mù chính.
- **KHÔNG quét w tối ưu trong luồng này** (theo prereg-l4 §4 — quét
  post-hoc đã làm ở K4). Hệ quả: mâu thuẫn với code
  `motionBlurBlendPlan` (trung bình đều theo quy nạp) vẫn mở; với 2 lần
  kiểm chứng mù liên tiếp không tái hiện, giả thuyết H-alt nên được
  xem là ĐÃ YẾU — cần mô hình khác (vd hai chế độ cho g_live bimodal)
  hoặc một lần kiểm chứng mù thứ ba với tiêu chí đăng ký trước khác,
  thay vì tiếp tục dùng H-alt để diễn giải. Không dùng H-alt làm kết
  luận trong LIMITS này.

## §4. Bar (c) — lệch g triple: không đổi

- L4 riêng: n=**29** triple liên tiếp; g_live mean 0,520 (med 0,471) vs
  g_pred đều mean 0,472 → lệch **+0,048**; vs g_pred H-alt mean 0,528
  → lệch **−0,009**. Khớp sát mẫu K4/J5.
- Gộp L4+K4+J5: n=**536** triple; g_live mean 0,567 (med 0,476) vs
  g_pred đều mean 0,516 → lệch **+0,051**; vs g_pred H-alt mean 0,575
  → lệch **−0,008**. Y hệt K4 gộp (+0,051/−0,008, n=507) — 29 triple
  mới không làm nhúc nhích số gộp. (Lưu ý: lệch triple gộp và Bar (b)
  gộp cùng hướng — H-alt khớp tốt trên dữ liệu gộp cũ nhưng không tái
  hiện trên dữ liệu mới, xem §3.)

## §5. Bar (d) — hiệu chuẩn "presented trong ±1" theo tải LẤY MẪU: giữ tới 3,19; KHÔNG có điểm gãy

| lượt | sysload | sampled mean load1 (n) | proxy max | n tick | pres off trung vị (dải) | trong ±1 | phân loại* |
|---|---|---|---|---|---|---|---|
| r58 | 1 | 2,63 (n=4) | 4,07 | 182 | +0 (−1..+2) | 178/182 (97,8%) | GIỮ |
| r59 | 1 | 3,19 (n=4) | 3,47 | 120 | +0 (−2..+2) | 114/120 (95,0%) | GIỮ |
| r60 | 1 | 1,75 (n=4) | 1,94 | 197 | +0 (−1..+1) | 197/197 (100%) | GIỮ |
| r61 | 1 | 1,59 (n=4) | 1,76 | 84 | +0 (−2..+1) | 80/84 (95,2%) | GIỮ |
| r62 | 3 | 0,95 (n=4) | 1,15 | 36 | +0 (−3..+1) | 29/36 (80,6%) | GIỮ |
| r63 | 5 | 0,71 (n=4) | 0,78 | 52 | +0 (−2..+1) | 45/52 (86,5%) | GIỮ |
| **nhóm nhẹ [2,0–3,5]** | | | | **302** | **+0** | **292/302 (96,7%)** | GIỮ |

\* Phân loại đăng ký trước (prereg-l4 §4): "GIỮ" = trong ±1 ≥80% VÀ
trung vị off ∈ {−1, 0, +1}; "GÃY" = trong ±1 <50% VÀ trung vị off ≤ −2.

- **Hiệu chuẩn chốt (cập nhật):** bar "presented trong ±1" **giữ tới
  load lấy mẫu ~3,19** (nhóm nhẹ 96,7% trong ±1, trung vị +0) — thu
  hẹp từ phía dưới so với K4 (giữ tới proxy 3,65; nay đo bằng tải lấy
  mẫu thay vì proxy). Không có lượt nào GÃY.
- **Điểm gãy: CHƯA đóng khoảng.** Chỉ có điểm GIỮ (cao nhất 3,19),
  không có điểm GÃY nào ở mức tải lấy mẫu — khác hẳn giả thuyết "gãy
  quanh ~5" từ r56 K4. Điểm tham chiếu duy nhất còn lại là r56 K4
  (proxy 4,77, trung vị −4, 12,5% trong ±1) — KHÔNG có sampled load
  nên không dùng để đóng khoảng.
- **Vì sao 2 lượt "trung gian" không đạt tải 5–8 — phát hiện phương
  pháp quan trọng nhất của Bar (d):** r62 đốt 3 hog nhưng sampled mean
  chỉ 0,95; r63 đốt 5 hog nhưng sampled mean chỉ 0,71 — THẤP HƠN cả
  lượt nhẹ. Nguyên nhân chính: **load1 là trung bình trượt ~60 s**;
  hog chỉ đốt trong cửa sổ phát ~10–12 s nên load1 chưa kịp tăng
  (sau 10 s mới đi được ~15% quãng tới mức tải mới), trong khi tải nền
  đang sụt nhanh (load5 11,09 → 3,96 trong phiên) kéo load1 xuống
  nhanh hơn hog đẩy lên. Bằng chứng tải hog CÓ tác dụng thật dù load1
  không thấy: r62/r63 đói tick nặng (36/52 tick so với 84–197 của lượt
  nhẹ; pump chỉ 41/52 lần so với 161 của r58) — CPU thật bị tranh
  chấp, nhưng load1 không phản ánh được trong cửa sổ ngắn. **Kết luận:
  lấy mẫu load1 mỗi 5 s KHÔNG sửa được lệch của proxy khi tải được đốt
  đột ngột** — cả hai đều đo cùng một EMA 60 s; lấy mẫu chỉ hơn proxy
  ở chỗ đo đúng cửa sổ phát thay vì 2 điểm đầu–cuối. Đợt sau muốn đo
  điểm gãy phải đổi cách tạo tải: đốt hog TRƯỚC lượt phát ≥2 phút để
  load1 kịp lên mức mục tiêu rồi giữ ổn định trong lúc phát, hoặc đo
  áp lực CPU bằng chỉ số khác (vd tỉ lệ tick/giây, thời gian rAF,
  CPU time của tiến trình browser) thay vì loadavg.
- **Proxy max() so với sampled mean (đối chiếu):** proxy CAO HƠN
  sampled mean ở cả 6 lượt (vd r58: 4,07 vs 2,63; r63: 0,78 vs 0,71)
  — ngược hướng với K4 (proxy lệch xuống khi tải nền tăng nhanh). Lần
  này tải nền đang SỤT nên max() 2 điểm lấy điểm cao đầu phiên. Proxy
  max() lệch theo hướng biến động của tải nền — không đáng tin làm căn
  cứ phân nhóm chặt, đúng như K4 đã cảnh báo.
- **Caveat mẫu:** mỗi lượt chỉ có n=4 mẫu tải (khoảng 5 s trên cửa sổ
  phát ~10–12 s) — mean lấy mẫu có nhiễu lấy mẫu, nhưng là trung bình
  thật trong cửa sổ phát. r62 chỉ vừa đủ bar GIỮ (80,6%, trên ngưỡng
  80% đúng 0,6 điểm phần trăm) với n=36 tick — phân loại GIỮ của r62
  là biên, ghi rõ.

---

## §6. Sự cố hạ tầng trong lượt

- **Reboot giữa prereg và driver** (xem §0): boot đổi 02:24:45Z →
  02:50:48Z trước lượt đầu. Không reboot nào trong lượt.
- **L1 sửa production trước lượt đầu** (xem §0): md5 `ced42efd` →
  `9b27abe5` (L1-fix 02:55:02Z). Mọi lượt chạy trên build mới, md5 ổn
  định — không lượt "lai".
- **Cổng vite + lock:** r57 chờ vite 240 s + lock 360 s (L5-run30 lấy
  lock ngay sau khi cổng pgrep mở — race đã ghi ở §0). Các lượt sau
  qua ngay (0 s). Không lượt nào hoãn vì hết 20 phút chờ vite/lock.
- **0 lượt hoãn vì cổng yên driver** (load1 <5 trong 120 s ở mọi lượt;
  r58/r59 cổng yên nội bộ của probe hết 120 s rồi vẫn phát lúc load
  2,55 / ~5,14 — ghi rõ trong log).
- **ENOSPC — 0 lần:** 7/7 vite lên ngay attempt 1 với config
  `watch.ignored: ["**/**"]` (CFG_DIR riêng /tmp/round110-l4). Lần đầu
  tiên chuỗi blur không có attempt ENOSPC nào. Chưa chứng minh nhân
  quả chặt (cũng có thể do máy yên dần / vite nối tiếp qua lock), nhưng
  tương quan này ủng hộ việc giữ workaround cho các lượt sau.
- **r62/r63 đói tick:** pump chỉ 41/52 lần (so với 161 của r58);
  playhead r62 chỉ tới 8,63 sau 10,31 s tường (≈0,84× realtime).
  Nguyên nhân: hog 3/5 đốt trong lúc phát tranh CPU với browser
  (xem §5) — không phải lỗi probe hay sản phẩm. Hai lượt này vẫn hợp
  lệ để phân tích (dữ liệu thật, không loại), nhưng đóng góp ít
  (88 tick gộp, 37 sự kiện phân biệt, 5 sự kiện band A' — cả 5 đều
  Nhãn-đúng).
- **Baseline nhất quán qua 3 boot / 2 build:** baseline g live L4
  (noblur r57, n=87 cap, chỉ c0) = **87,94** vs K4 (r50) = **88,06** vs
  J5 (r45) = **88,11** — lệch tối đa 0,2%, chứng tỏ baseline ổn định,
  không phải nguồn nhiễu cho g_live; và L1-fix không làm lệch baseline.
- **cap g<0,35: 0/617** (tham khảo — band D stripes không áp cho
  stimulus mới).

## §7. Kiểm chứng (cây cuối, md5 9b27abe5)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass (9,11 s)**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass**.
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- Không sửa production trong luồng này (L1 sửa trước lượt đầu);
  không push GitHub; không release/tag; không TTS 39; không birefnet.
  preview.tsx md5 cuối `9b27abe57975ec5b69ec2e21c3fa281c` — đúng md5
  yêu cầu của lượt (build L1-fix).

---

## §8. Nợ còn lại

1. **E6: ĐÃ ĐÓNG (BỊ BÁC, 18/18 Nhãn-đúng).** Không còn là nợ mở —
   parent cập nhật LIMITS gộp đợt 109 §4 mục 6 cho đúng.
2. **H-alt-weights: KHÔNG tái hiện — lần thứ hai liên tiếp (K4+L4).**
   Lợi thế gộp vẫn do dữ liệu J5 cũ. Đề xuất: ngừng dùng H-alt để
   diễn giải; mâu thuẫn với code `motionBlurBlendPlan` (trung bình đều)
   vẫn mở — cần mô hình khác (vd hai chế độ cho g_live bimodal) hoặc
   một lần kiểm chứng mù thứ ba với tiêu chí đăng ký trước khác. Đừng
   quét w post-hoc rồi chọn w tốt nhất làm kết luận.
3. **Điểm gãy label-lag: VẪN MỞ, chưa đóng khoảng.** Giữ tới sampled
   mean 3,19; không có điểm GÃY nào ở mức tải lấy mẫu. Đợt sau muốn đo
   phải đổi cách tạo tải: đốt hog TRƯỚC lượt phát ≥2 phút để load1 kịp
   lên mức mục tiêu rồi giữ ổn định, hoặc đo áp lực CPU bằng chỉ số
   khác (tỉ lệ tick/giây, thời gian rAF, CPU time browser) thay vì
   loadavg. Lấy mẫu load1 mỗi 5 s đã chứng minh KHÔNG đủ khi tải đốt
   đột ngột (EMA 60 s).
4. **Lệch g triple: +0,051 (đều) / −0,008 (H-alt), n=536 gộp — không
   đổi.** L4 riêng n=29: +0,048/−0,009.
5. **Tỉ lệ sự kiện band A' của L4 cao bất thường (1,64%/tick vs 0,29%
   K4, 0,57% J5):** chưa rõ nguyên nhân (máy yên dần / build L1-fix /
   ngẫu nhiên). Ghi là quan sát; không ảnh hưởng verdict (mọi sự kiện
   đều strip-xác nhận). Đợt sau đối chiếu tỉ lệ này có giữ không.
6. Các nợ ngoài phạm vi L4 (giữ nguyên từ LIMITS gộp đợt 109 §4, trừ
   E6 đã đóng): G1 deinterlace (chờ user quyết metric G5/M2), mù #22
   (chờ user quyết), sửa E4 + A/B xác nhận, 2 MiB offset +4.194.304,
   zombie dạng mạnh lặp lại + stall chuyển clip 5 s, E1 gate load1 ≥
   ~8, EPERM probe #29 + mù #28, F6' lượt xác nhận lúc yên, ENOSPC
   vite nối tiếp bắt buộc (workaround watch.ignored có vẻ hiệu quả —
   giữ cho lượt sau), xử lý bền vững WebKit sau reboot, birefnet (CẤM
   thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 110 L4)

- `apps/web/scripts/probe110l4-frame-parity.mjs` — probe copy probe109k4
  (đổi SCRATCH sang round110-l4, CFG_DIR riêng /tmp/round110-l4, thêm
  `server.watch.ignored: ["**/**"]`, thêm sampler loadavg mỗi 5 s trong
  lúc phát → `result.loadSamples` + `loadSampleSummary`; không đổi
  logic/config đo).
- `docs/PHASE9_ROUND110_L4_BLUR_CLUSTERA_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round110-l4/` (không stage): prereg-l4.md,
  addendum-prereg-l4.md, driver110l4.sh + driver110l4.log,
  analyze110l4.py + .txt/.json + analyze110l4-run.log, 7 thư mục lượt
  probe (chr-code-noblur-r57, chr-code-blur-r58/r59/r60/r61/r62/r63,
  mỗi thư mục có frame-parity-results.json + .log + vite-attempt1.log).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).

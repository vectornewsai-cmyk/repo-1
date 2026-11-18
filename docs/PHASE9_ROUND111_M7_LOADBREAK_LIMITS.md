# PHASE9_ROUND111_M7_LOADBREAK_LIMITS.md — Điểm gãy tải (load-break), đợt 111, luồng M7

**Ngày:** 14/11/2026. **Luồng:** M7 (Phase 9 đợt 111). **Chủ đề:** Điểm gãy tải —
hiệu chuẩn presented quanh tải.
**Bối cảnh:** docs/PHASE9_ROUND110_L4_BLUR_CLUSTERA_LIMITS.md (toàn bộ —
E6 ĐÃ ĐÓNG 18/18; điểm gãy VẪN MỞ: giữ tới sampled mean 3,19, không có
điểm GÃY; phát hiện phương pháp: load1 EMA ~60 s không kịp phản ánh hog
đốt đột ngột trong cửa sổ phát ~10–12 s),
docs/PHASE9_ROUND110_L5_HARNESS_LIMITS.md (gate v2: load1 ≥ ~8 VÀ load5
≥ ~8 ở 2 mẫu 10 s liên tiếp; mẫu lỗi CDP page-target timeout dưới load1
28–49 — run26/run28; project-load timeout — run29/run30),
docs/PHASE9_ROUND110_L9_VERIFY_LIMITS.md §10 mục 4–6.
**Prereg:** hidden_files/round111-m7/prereg-m7.md (viết TRƯỚC mọi lượt probe)
+ addendum-prereg-m7.md (build đổi trước lượt đầu; r69 đổi thành control
không tải — xem §0).
**Build:** preview.tsx md5 **`c4198206cb916c0f1c6d8996330335a1`** TRƯỚC/SAU MỌI
lượt (KHÔNG phải `9b27abe5` của prereg — M1 sửa production trước M7, xem
§0; KHÔNG sửa production trong luồng này). **Boot:** reboot **#40**
`73316ed9-3823-4512-a52d-3cc5d455a6fd`, uptime_s 05:16:36Z, gap #39→#40
≈ 2h25'48" — không phá sàn 19'07"; KHÔNG có reboot nào trong lượt M7.
F3 tap+relabel TẮT trong mọi lượt. Chỉ chạy chromium (đường rVFC);
KHÔNG probe WebKit → không chạy vcut-webkit-postboot-check.sh (chỉ bắt
buộc trước probe WebKit sau reboot). Không push GitHub, không
release/tag, không TTS 39, không birefnet.

**Kết quả lớn nhất đợt này:**
- **Điểm gãy: VẪN MỞ — nhưng đã có điểm GIỮ sạch ở tải thấp.** Control
  r69 (không hog, máy yên, sampled mean load1 1,87): **282 blendTick,
  100% trong ±1 → GIỮ**. Cả 4 lượt blur có tải (sampled mean load1
  0,93 / 7,86 / 21,16 / 46,8) đều **TRUNG-GIAN** — không lượt nào GÃY
  (<50% trong ±1 VÀ trung vị ≤ −2). Giữ tới 1,87; không có điểm GÃY
  nên không đóng được khoảng.
- **Đói tick là do TẢI, không phải do build — đã chứng minh bằng r69:**
  r65–r68 chỉ có 17 / 36 / 30 / 8 blendTick, nhưng r69 trên CÙNG build
  `c4198206` cho **282 tick** (cao nhất từ trước tới nay trong chuỗi
  blur, vượt cả r60 của L4: 197). Tick rate sụp 29,65/s (r69, yên) →
  0,91/s (r68, load1 46,8): pump rVFC đói CPU dưới tải. Vì mọi lượt
  tải cao đều dưới ngưỡng hợp lệ 50 tick của prereg §4 nên không lượt
  nào dùng được một mình để đóng khoảng — **dụng cụ đo gãy trước khi
  hiện tượng gãy xuất hiện**: probe phụ thuộc mật độ tick rVFC, mà
  tick chính là thứ chết đầu tiên dưới tải.
- **Presented không trễ âm theo tải mà lệch DƯƠNG:** trung vị offset
  (nhãn − kỳ vọng) +2 / 0 / +1 / 0 — presented chạy TRƯỚC kỳ vọng
  (skip-stale-frame nhảy ahead), không phải trễ sau như giả thuyết
  gãy của K4 (r56: trung vị −4). Dạng gãy "trễ âm" không tái hiện ở
  bất kỳ mức tải nào tới 46,8.
- **Dial tải bằng hog KHÔNG điều khiển được load1:** throttle nhấp
  nháy — load1 vọt 0,16 → 28 trong ~2 phút với cùng 40 hog; r66/r67
  KHÔNG đạt 2 mẫu liên tiếp trong dải sau 300 s; r65 "ĐẠT" lúc dial
  nhưng load sụt 2,21 → sampled mean 0,93 lúc phát; r68 "ĐẠT" ở
  giây 290 (22,86) nhưng load vẫn chạy tiếp trong lúc phát (24,55 →
  40,39; sampled mean 46,8 — VƯỢT dải dial [15, 30]). "ĐẠT" lúc dial
  không giữ được tới lúc phát. Số hog không phải là điều khiển tải —
  chỉ có sampled mean TRONG LÚC PHÁT mới là số tải thật.
- **Gate v2 của L5 KHÔNG suy ra presented GIỮ:** điều kiện gate v2
  (load1 ≥ ~8 VÀ load5 ≥ ~8) đạt trong lúc phát ở r66/r67/r68, cả ba
  vẫn TRUNG-GIAN.
- **KHÔNG gặp mẫu lỗi CDP/project-load nào** (0/5 lượt), kể cả ở
  load1 sampled mean 46,8 — probe (playwright launch trực tiếp) sống
  sót nơi harness E1 chết ở load1 28–49. Không suy rộng sang E1.
- **r69 control (blur, không hog, máy yên): GIỮ, 282 tick, 100% trong ±1**
  (xem §7) — build `c4198206` được minh oan; đói tick là do tải.
- **H-alt: quan sát post-hoc TRÁI CHIỀU (không đăng ký trước cho M7):**
  trên dữ liệu mới M7 (n=201 sự kiện) H-alt cải thiện median 0,025
  (0,065 → 0,040), vượt ngưỡng 0,010 — trái với 2 lần kiểm chứng mù
  đăng ký trước (K4: +0,002; L4: +0,008) đều không tái hiện. Nhưng
  86% sự kiện M7 đến từ một lượt yên duy nhất (r69) và phép kiểm này
  không đăng ký trước cho M7 → KHÔNG lật kết luận của L4; cần kiểm
  chứng mù đăng ký trước lần 3 (xem §5).

---

## §0. Bối cảnh chạy (build đổi trước lượt đầu, lock tranh chấp)

- **M1 sửa production GIỮA lúc driver bắt đầu và lượt probe đầu
  (đính chính giờ):** prereg viết lúc md5 `9b27abe5`; lúc driver bắt
  đầu (05:42:35Z) md5 vẫn là `9b27abe5` (ghi trong driver111m7.log);
  M1 sửa lúc **05:46:19Z** (theo log M3) trong khi r64 đang chờ lock
  — M1 (round111-m1) sửa `preview.tsx` + thêm/sửa `playheadHold90R2.ts`
  + `playheadHold90R2.test.ts` (xem `round111-m1/md5-fixed.txt` +
  `round111-m1-status.md`). Mọi lượt probe M7 (r64–r69, từ 05:51:36Z)
  chạy trên `c4198206` ổn định trước/sau (mtimeChangedMidRun=false
  cả 6 lượt) — KHÔNG có lượt "lai". Kết quả M7 KHÔNG so trực tiếp được với L4/K4 về mức tuyệt
  đối (số tick, baseline g) — chỉ so được về HÌNH DẠNG phân loại
  (GIỮ/GÃY theo cùng định nghĩa).
- **Baseline g live riêng M7 (r64, noblur, 76 caps): 88,02** (tính bằng
  analyzer L4 tái dùng, xem §6) — vs K4 88,06 / J5 88,11 / L4 87,94:
  lệch tối đa 0,17. Build mới KHÔNG làm lệch baseline g.
- **Lock vite tranh chấp cả đợt:** r64 chờ lock M6 ~9 phút (M6 giữ từ
  05:41:20Z, vite :5599); M7 giữ lock suốt mỗi lượt dial+probe
  (r66–r68 ~6–7 phút mỗi lượt: 300 s dial + probe; r65 ~2 phút) —
  M3 ghi nhận bị BLOCKED 20 phút trong lúc r68 dial (xem
  `round111-m3/m3-progress.log`). Tổng thời gian driver 05:42→06:18Z
  cho 5 lượt; r69 chờ lock M5 ~9 phút nữa (06:32→06:41Z). Owner file
  trong lock được ghi đầy đủ (pid + M7-round111 + giờ bắt đầu) ở mọi
  lượt M7; lock nhả ngay sau mỗi lượt; driver kiểm ps sau mỗi lượt —
  không còn vite của M7 sót (vite của M1/M5 sau đó là của luồng khác,
  không phải M7).
- **ENOSPC — 0 lần:** vite config thêm `server.watch.ignored:
  ["**/**"]` + CFG_DIR riêng /tmp/round111-m7; mọi vite lên ngay
  attempt 1.
- **RAM thấp trong lúc phát nặng:** freeMB tối thiểu 544 (r66), 506
  (lúc phát r67), 761 (r68) — gần ngưỡng OOM; RAM khả dụng lúc viết
  prereg là 2330 MB. Không lần nào OOM hay dừng sớm vì RAM.
- **Tải nền của luồng đợt 111 khác:** M3 chạy load-test song song
  (run-m3.sh, 24-clip freeze run), M1/M5/M6/M8 dùng vite xen kẽ —
  tải sibling có trong sampled mean (đó là tải probe thực sự chịu;
  ghi rõ, không tách).

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0, offset nhãn − kỳ vọng)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | pump | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-noblur-r64 | stripes-code-noblur | 0 (không hog) | — | 3,27 (n=2) | 4 | 0† | 0 | 76 | — | — | baseline |
| chr-code-blur-r65 | stripes-code-blur | [2, 3,5] | ĐẠT 20 s (2,21) | **0,93** (n=4) | 21 | **17** | 22 | 23 | **+2** (0..+8) | 6/17 (35,3%) | TRUNG-GIAN |
| chr-code-blur-r66 | stripes-code-blur | [5, 8] | KHÔNG ĐẠT 300 s | **7,86** (n=4) | 13 | **36** | 41 | 43 | **0** (−1..+6) | 28/36 (77,8%) | TRUNG-GIAN |
| chr-code-blur-r67 | stripes-code-blur | [8, 15] | KHÔNG ĐẠT 300 s | **21,16** (n=4) | 18,2 | **30** | 33 | 35 | **+1** (−1..+7) | 20/30 (66,7%) | TRUNG-GIAN |
| chr-code-blur-r68 | stripes-code-blur | [15, 30] | ĐẠT 290 s (22,86) | **46,8** (n=7) | 50,3 | **8** | 16 | 16 | **0** (−1..+3) | 6/8 (75,0%) | TRUNG-GIAN |
| chr-code-blur-r69 | stripes-code-blur | control, không hog | — | **1,87** (n=4) | 4,5 | **282** | 208 | 200 | **0** (−1..+1) | 282/282 (100%) | **GIỮ** |

† noblur không có đường blend nên không có blendTick (đúng thiết kế).
**Tất cả 4 lượt blur CÓ TẢI (r65–r68) đều dưới ngưỡng 50 tick của
prereg §4** — không lượt nào dùng được một mình để đóng khoảng gãy.
Chỉ r69 (control, không tải) đủ tick (282).

## §2. Bar (a) — điểm gãy: KHÔNG ĐÓNG KHOẢNG, VẪN MỞ

- **Điểm GIỮ:** r69 (control, không hog): sampled mean load1 1,87,
  282 tick, trung vị offset 0 (dải −1..+1), 100% trong ±1 → **GIỮ**,
  cả theo offset nhãn − kỳ vọng lẫn offset content − nhãn (analyzer
  L4 tái dùng: 282/282 trong ±1, ghost +0). Đây là lượt blur hợp lệ
  duy nhất của M7 (n ≥ 50).
- **Không có điểm GÃY:** không lượt nào <50% trong ±1; trung vị
  offset thấp nhất là 0 (r66/r68). Theo luật prereg §3: chỉ có GIỮ
  (cao nhất 1,87), không có GÃY → **không đóng được khoảng (A, B]**.
  Điểm gãy (nếu có) nằm trên 1,87 — nhưng mọi lượt trên 1,87 đều đói
  tick dưới ngưỡng hợp lệ nên không đo được nó bằng probe này.
- **So với L4:** L4 giữ tới sampled mean 3,19 trên build `9b27abe5`
  (r58/r59, 182/120 tick). M7 giữ tới 1,87 trên build `c4198206`
  (r69, 282 tick) — điểm GIỮ thấp hơn vì M7 không có lượt blur nào
  khác đủ tick để giữ ở tải cao hơn, không phải vì build mới kém hơn
  (r69 cho 100% trong ±1, tốt hơn mọi lượt L4).
- **Dạng gãy "trễ âm" của K4 không tái hiện:** r56 K4 (proxy 4,77,
  trung vị −4, 12,5% trong ±1) vẫn là điểm tham chiếu duy nhất cho
  dạng trễ âm — KHÔNG có sampled load nên không dùng để đóng khoảng.
  Trên build mới, ở tải tới 46,8, presented lệch DƯƠNG (trung vị
  0..+2), không âm — trong khi r69 (cùng build, máy yên) cho trung vị
  0, dải −1..+1: build mới tự nó KHÔNG lệch dương. Lệch dương ở
  r65–r68 là hiệu ứng tải (skip-stale-frame khi pump đói — xem §5),
  không phải lệch hệ thống của build. Giả thuyết gãy quanh ~5 của K4
  (trễ âm) vẫn chưa tái hiện trên build mới ở bất kỳ mức tải nào.
- **Sự kiện band A' mới (mô tả thêm, không phải verdict M7):** 2 sự
  kiện (r66 c0 pres51, g=0,465; r69 c2 pres51, g=0,462 — cả hai đều
  Nhãn-đúng) — gộp toàn bộ J5+K4+L4+M7 thành **20/20 Nhãn-đúng**;
  E6 vẫn ĐÃ ĐÓNG, không mở lại.

## §3. Bar (b) — load1 EMA ~60 s có đủ để dự báo không: KHÔNG ĐỦ ĐỂ ĐIỀU KHIỂN; KHÔNG KẾT LUẬN ĐƯỢC VỀ DỰ BÁO

- **Bằng chứng điều khiển (mạnh):** dial hog KHÔNG đưa được load1
  vào dải mục tiêu một cách ổn định trong 300 s ở 2/3 lượt r66/r67
  (r68 đạt ở giây 290 nhưng không giữ được qua lúc phát — xem trên):
  load1 dao động 0,16 → 28,6 trong một lượt dial (r66: 0,16 lúc
  05:58:39 → 7,37 lúc 05:58:51 → 28,14 lúc 06:00:06 → 10,39 lúc
  06:01:51, với cùng 40 hog rồi giảm dần xuống 4 hog). Throttle
  nhấp nháy theo pha (bật/tắt trong ~2–3 phút), không phải trạng thái
  ổn định — cùng 40 hog cho ra cả load1 0,16 (throttle siết) lẫn
  28,6 (throttle nhả). "Ổn định 2 mẫu liên tiếp (20 s)" của prereg
  là KHÔNG ĐỦ: r65 đạt 2 mẫu ổn định ở 2,21 nhưng tới lúc phát
  (sau ~50 s vite boot + app boot) load đã sụt còn sampled mean 0,93.
- **Bằng chứng dự báo (không kết luận được):** tiêu chí prereg §3
  cần dải load1 của lượt GÃY tách biệt khỏi lượt GIỮ — nhưng chỉ có
  1 lượt GIỮ (r69, 1,87) và không có lượt GÃY nào, nên không kiểm
  được tiêu chí này. Điều duy nhất kết luận được: **sampled mean
  TRONG LÚC PHÁT là số tải duy nhất đáng tin** (load lúc phát / lúc
  dial đều lệch: r65 dial 2,21 vs phát 0,93; r67 dial cuối 24,10 vs
  phát 21,16; r68 phát 24,55 vs cuối 40,39 — tải chạy trong lúc
  phát, không đứng yên).
- **Hệ quả cho đợt sau:** muốn đo điểm gãy phải (a) chờ throttle
  đang ở pha "nhả" rồi phát ngay trong cửa sổ nhả (vài phút), thay
  vì ép tải lên từ lúc throttle siết; hoặc (b) đo tải bằng chỉ số
  tức thời hơn load1 (xem §4); hoặc (c) chạy nhiều lượt lặp ở cùng
  một dải và phân nhóm hậu kiểm theo sampled mean thật (như M7 đã
  làm) — nhưng cần lượt có đủ tick (≥50) mới phân loại được, mà các
  lượt tải cao không tích đủ tick (xem §5).

## §4. Bar (c) — metric thay thế: KHÔNG CÓ METRIC NÀO TÁCH ĐƯỢC (không có độ tương phản để kiểm)

- **threads-R:** KHÔNG phản ánh áp lực CPU dưới throttle. r65:
  threadsR trung bình 21 trong lúc phát nhưng load1 chỉ 0,93 (21
  hog sống nhưng bị throttle — runnable tức thời cao, EMA thấp);
  r68: threadsR 50,3 với load1 46,8. threadsR bám theo số hog đang
  sống, không bám theo CPU thật được cấp. Không đề xuất thay load1.
- **Tick rate (blendTick/giây tường):** r65 1,94 / r66 4,05 / r67
  3,22 / r68 0,91 — KHÔNG đơn điệu theo tải (r66 cao hơn r65 dù tải
  cao gấp ~8×). Tick rate thấp ở r65 (tải thấp nhất) là chưa giải
  thích được — có thể do sibling burst trong lúc phát r65 (build mới
  đã được r69 minh oan). Không đề xuất làm metric thay thế khi chưa
  có ≥2 lượt lặp cho thấy ngưỡng ổn định.
- **Playhead ratio (media/wall):** 1,025 / 1,014 / 0,966 / 1,026 —
  playhead vẫn chạy gần realtime ở mọi mức tải (kể cả 46,8). Không
  tách được gì; chỉ cho thấy media clock không phải là nơi gãy.
- **slot0Fps:** không đo trong luồng này (probe frame-parity không
  sinh slot0Fps) — không đề xuất thay thế nếu chưa đo cùng probe
  (giữ caveat prereg §5).
- **Kết luận Bar (c):** không đề xuất metric thay thế nào — không có
  bằng chứng tách dải trong dữ liệu M7, vì không có độ tương phản
  GIỮ/GÃY để mà tách.

## §5. Đói tick — quan sát trung tâm của đợt (đã rõ nguyên nhân: do tải)

- Tick/pump/caps theo lượt: r65 17/22/23; r66 36/41/43; r67 30/33/35;
  r68 8/16/16. So với L4 (r58–r63): 182/161, 120, 197, 84, 36, 52
  tick. Ngay cả lượt nhẹ nhất của M7 (r65) cũng chỉ bằng lượt đói
  nhất của L4 (r62: 36 tick).
- Pump decision `skip-stale-frame` chiếm đa số ở r65 (13/22 pump bị
  skip) — pump bỏ qua frame stale rồi presented nhảy ahead (offset
  dương). Đây là cơ chế sinh offset +2 của r65, không phải lỗi nhãn.
- **Nguyên nhân ĐÃ RÕ nhờ r69: đói tick là do tải, không phải build.**
  r69 trên CÙNG build `c4198206`, máy yên: 282 tick, pump 208, caps
  200, tick rate 29,65/s — cao nhất chuỗi blur từ trước tới nay
  (vượt r60 L4: 197 tick). Dưới tải, pump rVFC đói CPU: tick rate
  29,65/s (load1 1,87) → 4,05/s (7,86) → 3,22/s (21,16) → 0,91/s
  (46,8); riêng r65 chỉ 1,94/s dù load1 chỉ 0,93 (throttle + sibling
  burst trong lúc phát — xem §0). Build mới được minh oan hoàn toàn
  về nhịp tick; baseline g không đổi (88,02) cũng khớp.
- **F2 gộp (content-based, analyzer L4 tái dùng):** KHÔNG tính r69:
  90 tick, nhận diện 90/90 (100%), trong ±1 60/90 = 66,7% → FAIL bar
  ≥80%. CÓ tính r69: 372 tick, nhận diện 372/372 (100%), trong ±1
  342/372 = **92% → ĐẠT** (nhóm nhẹ r65+r66+r69: 335 tick, 95% →
  ĐẠT). F2 trên build mới là TỐT khi đủ tick; FAIL trước đó chỉ phản
  ánh đói tick dưới tải, không phải hỏng F2.
- **H-alt — quan sát post-hoc TRÁI CHIỀU (đọc kỹ caveat):** M7 KHÔNG
  đăng ký kiểm chứng H-alt trong prereg; số dưới đây do analyzer L4
  tái dùng tính lại, không phải verdict mù đăng ký trước. Trên dữ
  liệu mới M7 (n=201 sự kiện): median |Δg| đều 0,065 vs H-alt 0,040
  — cải thiện **0,025**, VƯỢT ngưỡng 0,010 của tiêu chí L4; mean
  signed +0,046 vs +0,009 (cũng đạt điều kiện thứ hai). Nhưng:
  (a) 172/201 sự kiện (86%) đến từ MỘT lượt yên duy nhất (r69);
  (b) hai kiểm chứng mù đăng ký trước (K4 n=155: cải thiện +0,002;
  L4 n=409: +0,008) đều KHÔNG tái hiện. Ba mẫu mù độc lập đều cho
  H-alt tốt hơn đều (+0,002 / +0,008 / +0,025 — đều dương), nhưng
  chỉ mẫu M7 vượt ngưỡng — và mẫu M7 không đăng ký trước. **Không
  lật kết luận "không tái hiện" của L4.** Giả thuyết mới cần kiểm:
  lợi thế H-alt có thể phụ thuộc lượt/mức tải (mạnh ở lượt yên nhiều
  tick, yếu dưới tải) — cần kiểm chứng mù đăng ký trước lần 3 trên
  dữ liệu mới độc lập, nhiều lượt yên, không dồn vào một lượt.

## §6. Bar (d) + (e) — quan hệ với gate v2 L5; mẫu lỗi CDP/project-load

- **Gate v2 (Bar d):** điều kiện gate v2 (load1 ≥ ~8 VÀ load5 ≥ ~8 ở
  2 mẫu liên tiếp) ĐẠT trong lúc phát ở r66 (sampled load1 7,86 /
  load5 9,53), r67 (21,16 / 14,54) và r68 (46,8 / 24,47) — cả ba đều
  TRUNG-GIAN, không GIỮ. Gate v2 là cổng liveness của harness E1
  (đo G4), không phải cổng chính xác presented — **đạt gate v2 không
  suy ra presented GIỮ**. Quan hệ là mô tả, không xác nhận/bác gate v2.
  (Lưu ý: gate v2 dùng mẫu 10 s; M7 xấp xỉ bằng 2 mẫu 5 s liên tiếp
  — xem analyzer; tải trong lúc phát đủ ổn định ở r67/r68 để xấp xỉ
  này đứng được, nhưng r66 tải đang decay nhanh nên xấp xỉ yếu hơn.)
- **Mẫu lỗi CDP/project-load (Bar e): 0 lần.** Không có CDP
  page-target timeout nào (L5 run26/run28 chết ở load1 28–49) và
  không có project-load timeout nào (L5 run29/run30), kể cả ở r68
  (load1 sampled mean 46,8, max 47,12; load lúc kết thúc 40,39).
  Probe frame-parity (playwright launch trực tiếp, không chờ CDP
  page target với deadline 60 s như harness E1) sống sót ở tải mà
  harness E1 chết — **không suy rộng sang E1**: khác harness, khác
  cửa chặn. Ghi nhận là giới hạn của phép đo này, không phải bằng
  chứng E1 đã hết lỗi CDP.

## §7. r69 control — GIỮ (build được minh oan; đói tick là do tải)

- **Chạy:** 06:41:21–06:43:46Z (chờ lock M5 ~9 phút rồi lấy lock;
  cổng yên nội bộ của probe chờ 105 s tới load1 1,92 rồi phát).
  Không hog, config stripes-code-blur, nclips 3, chromium.
- **Kết quả:** 282 blendTick, pump 208, caps 200; offset nhãn −
  kỳ vọng: trung vị 0, mean +0,16, dải −1..+1, **282/282 (100%)
  trong ±1 → GIỮ**; offset content − nhãn (analyzer L4 tái dùng):
  trung vị 0, dải −1..+1, 282/282 trong ±1, ghost +0 (n=564).
  Sampled mean load1 **1,87** (n=4, median 1,86, max 1,92),
  load5 mean 2,66, threadsR mean 4,5; tick rate 29,65/s; playhead
  ratio 0,946. md5 c4198206 ổn định; pageErrs 0.
- **Kết luận theo addendum §3:** r69 cho tick ~L4 trở lên (282 >
  197 cao nhất của L4) và offset GIỮ → **đói tick của r65–r68 là
  do tải/throttle, không phải do build**. Nhánh (a) thắng; nhánh (b)
  bị bác. Các lượt r65–r68 vẫn dùng được cho Bar điểm gãy (phân
  nhóm theo sampled mean thật) — nhưng tất cả đều dưới ngưỡng 50
  tick nên không lượt nào đóng khoảng một mình.
- **Sự kiện band A' mới từ r69:** 1 (c2 pres51, content 51,
  g=0,462, Nhãn-đúng) — xem §2.
- **Hệ quả phương pháp:** muốn đo điểm gãy trên build này, probe
  phải tích đủ tick dưới tải — vd kéo dài cửa sổ phát (nhiều clip
  hơn / phát lặp lại) để n tick vượt 50 ngay cả khi tick rate sụp
  còn ~1–4/s, hoặc đo presented bằng metric không phụ thuộc mật độ
  tick rVFC. Nếu không, mọi lượt tải cao sẽ mãi "không phân loại
  được" chứ không phải "không gãy".

## §8. Kiểm chứng (cây cuối, md5 c4198206)

- `tsc --noEmit` (apps/web): **0 lỗi** (06:27Z, trên build c4198206).
- `vite build`: **pass (16,26 s)** (06:27Z, trên build c4198206).
- Không sửa production trong luồng này (M1 sửa trước lượt đầu);
  không push GitHub; không release/tag; không TTS 39; không birefnet.
  preview.tsx md5 cuối `c4198206cb916c0f1c6d8996330335a1`.
- Probe copy `probe111m7-frame-parity.mjs`: node --check PASS trước
  lượt đầu; md5 script `8cfe3b9ad97491055717af76cb572152`.
- `tsc` / `vite build` chạy 06:27Z (giữa r68 và r69), trên cây cuối
  md5 c4198206 — không đổi production, chỉ kiểm chứng.

## §9. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** Đã có điểm GIỮ sạch
   ở sampled mean 1,87 (r69, 282 tick, 100% trong ±1); không có
   điểm GÃY nào (tải tới 46,8 vẫn không trễ âm). Mọi lượt tải cao
   đều đói tick (n<50) nên không phân loại được — dụng cụ đo gãy
   trước khi hiện tượng gãy xuất hiện. Đợt sau cần probe tích đủ
   tick dưới tải (phát dài hơn / nhiều clip hơn) rồi lặp nhiều lượt
   ở cùng dải sampled mean; chỉ phân loại lượt đủ tick (≥50).
2. **Dial tải bằng hog không điều khiển được load1 dưới throttle
   nhấp nháy.** Đợt sau: chờ pha throttle "nhả" rồi phát ngay trong
   cửa sổ nhả; hoặc đo bằng metric tức thời hơn; đừng tin "dial ĐẠT"
   — chỉ tin sampled mean TRONG LÚC PHÁT.
3. **H-alt: quan sát post-hoc trái chiều, chưa lật được kết luận L4.**
   Hai kiểm chứng mù đăng ký trước (K4, L4) không tái hiện; mẫu M7
   (n=201, không đăng ký trước, 86% sự kiện từ một lượt yên r69)
   cho cải thiện +0,025, vượt ngưỡng. Cần kiểm chứng mù đăng ký
   trước lần 3 trên dữ liệu mới độc lập, nhiều lượt yên. Tới lúc đó
   vẫn ngừng dùng H-alt để diễn giải (như L4 đã kết luận).
4. **F2 gộp M7 ĐẠT khi tính r69 (92% trong ±1, n=372); FAIL khi
   không tính r69 (66,7%, n=90).** F2 trên build mới là tốt khi đủ
   tick; FAIL trước đó chỉ phản ánh đói tick dưới tải.
5. **E6: vẫn ĐÃ ĐÓNG** (20/20 Nhãn-đúng gộp toàn bộ J5+K4+L4+M7, với 2 sự kiện mới r66 + r69).
6. Các nợ ngoài phạm vi M7 (giữ nguyên từ LIMITS gộp đợt 110 §10):
   G1 deinterlace (chờ user quyết), mù #22 (chờ user quyết), E4
   (cuộc đua tail-ceiling/restart-seek), 2 MiB offset +4.194.304
   (G6 preload-before-seek chưa đo), zombie gate (b) dạng mạnh +
   stall chuyển clip 5 s, EPERM probe #30 + mù #29, F6' (bảo đảm
   mức pixel), ENOSPC (vite nối tiếp bắt buộc; watch.ignored giữ),
   WebKit sau reboot (postboot-check), birefnet (CẤM thử lại khi RAM
   chưa đổi), TTS 39 (CẤM kiểm lại), ci-security.yml 403 (chờ user),
   release gate giữ nguyên.

---

## File đổi/thêm (đợt 111 M7)

- `apps/web/scripts/probe111m7-frame-parity.mjs` — probe copy probe110l4
  (đổi SCRATCH → round111-m7, CFG_DIR → /tmp/round111-m7, thêm cờ
  --skip-quiet, thêm threadsR vào loadSamples; không đổi logic/config đo).
- `docs/PHASE9_ROUND111_M7_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round111-m7/` (không stage): prereg-m7.md,
  addendum-prereg-m7.md, driver111m7.sh + driver111m7.log,
  run-r69.sh, analyze111m7.py + .txt/.json, analyze111m7-g.py +
  .txt/.json/.log (analyzer L4 tái dùng cho baseline g + F2 +
  H-alt mô tả), hog-load-chr-code-blur-r65/-r66/-r67/-r68.txt
  (sampler driver 5 s), 6 thư mục lượt probe r64–r69 (mỗi thư mục có
  frame-parity-results.json + .log + vite-attempt1.log), tsc.log,
  vite-build.log, run-r69.out.
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).

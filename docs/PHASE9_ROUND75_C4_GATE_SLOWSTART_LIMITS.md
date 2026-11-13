# Phase 9 đợt 75 — luồng C4: theo dõi thêm phiên FN + đo thật slow-start (cold start)

**Ngày:** 09/11/2026 (lượt cron 21:35 +07; đo 14:44–15:10 UTC).
**Trạng thái:** ĐO XONG — VERDICT: **GIỮ NGƯỠNG 30**; **FP re-gate ĐẦU TIÊN
xuất hiện (kiểm duyệt, session3, delta 4, dưới sóng tải 9,22)**; **không có
phiên FN chuẩn mới (0/3 phiên chuẩn, 0/7 slot mới)**; **slow-start đo được:
rs≥2 duy trì sau seek-0 mất +2 s → +20 s (3 lần diag), ngẫu nhiên theo lần
chạy, không quyết định bởi tải**; **cold start editor: vite lên ~1,9 s
(median), tới app mount ~19,3 s (median), tới gate xong ~26–29 s (phiên
chuẩn bình thường)**. Không sửa code production, không sửa launcher/
analyzer/harness gốc. Không push (chỉ stage); không release/tag.

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| Có thêm phiên FN chuẩn không? | **KHÔNG — 0/3 phiên chuẩn, 0/7 slot mới.** S1 (3,38/5,92/7,17 fps), S2 (22,42/6,06/20,54), S3 (chỉ slot 1: 4,31 fps — chậm nhưng ≥ 2 nên không FN theo tiêu chí). |
| Re-gate có bắt thêm FN nào không? | **Không có FN chuẩn mới nên không có thêm bằng chứng bắt.** Tỉ lệ bắt vẫn **2/3 phiên FN chuẩn** (Y3-S1 + A6-S1 bắt được; B8-S1 lọt). |
| Re-gate có FP không? | **CÓ — LẦN ĐẦU TIÊN (kiểm duyệt).** S3: slot 1 = 4,31 fps (không FN theo tiêu chí) nhưng re-gate delta **4 < 30 → FAIL → phiên chết**. FP kiểm duyệt 1/1 (chỉ slot 1 làm ground truth); FP ground-truth đầy đủ vẫn **0/9, Wilson [0%, 30%]** (đã hẹp từ [0%, 35%]). |
| Ngưỡng 30 còn đúng không? | **GIỮ NGUYÊN.** Cơ sở xem §3: không có delta khỏe chuẩn mới < 41 (mới: 44, 52); FP mới (delta 4) là dưới sóng tải 9,22 trong phiên vốn đã chậm sâu (gate 21, slot 4,31) — hạ ngưỡng để tránh nó (xuống ≤ 4) sẽ vô hiệu hóa cửa thứ hai; nâng ngưỡng sẽ giết thêm phiên khỏe 41/44. 30 vẫn là điểm cân bằng duy nhất đứng được. |
| Slow-start (cold start) đo được bao nhiêu? | **Thời gian tới rs≥2 duy trì sau seek-0: +2 s (diag2, tải ~1,5), +18 s (diag3, tải ~2–3, có tụt rs giữa chừng), +20 s (diag1, tải ~6–8).** Phạm vi 2–20 s, ngẫu nhiên theo lần chạy; tải cao làm tệ hơn nhưng tải thấp KHÔNG bảo đảm nhanh (B8 diag: +15 s ở tải 1,3–3,1). Xem §4. |
| Cold start editor (load → preview sẵn sàng) bao nhiêu? | **Vite lên median 1,87 s; vite lên → app mount median 17,60 s (mảnh tốn nhất); tổng vite spawn → app mount median 19,32 s; tổng → gate xong (phiên chuẩn bình thường) 26,44 / 29,09 s.** Ngoại lệ S3: mount 42,70 s + vite lên 7,77 s (xem §5). Xem §5. |
| FN kiểu nào re-gate bắt / lọt? | **Quan sát (không gộp, diag không chuẩn): diag2 FN lọt (delta 36 PASS); diag3 FN bị bắt (delta 14 FAIL).** Củng cố phân loại của B8: stall kéo dài → bắt; slow-start tự lành → lọt. Xem §4. |
| Resume-probe dưới tải thì sao? | **Stall đói-decoder kiểu Z3-S1 tái hiện 2/3 lần probe B trong C4** (S1: 0,86 fps, rs=1 42/50; S2: 0,69 fps, rs=1 27/50; diag2 khỏe 17,8 fps). Lần đầu stall probe B xuất hiện 2 phiên chuẩn liên tiếp. Xem §6. |

## 2. Kết quả đo thật — 3 phiên chuẩn + 3 phiên diag

Clip `long1080.mp4` 20 s (h264 1080p 30 fps, GOP ~1,97 s), canvas preview backing
871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB. Cửa thứ hai BẬT, ngưỡng 30
(mặc định, không đổi). Launcher + analyzer Z3 tái sử dụng NGUYÊN.

| Phiên | Gate 1a (delta / load) | Slot draw fps (rep 1/2/3) | Re-gate (delta / load) | Verdict |
|---|---|---|---|---|
| **S1** (bán lạnh, profile mới) | **47 PASS** (7,83 fps), load 1,56 | **3,38 / 5,92 / 7,17** (presented ~28–30) | **52 PASS** (8,67 fps), load 3,10 | Khỏe — không FN, không FP |
| **S2** (ấm) | **47 PASS** (7,83 fps), load 2,60 | **22,42 / 6,06 / 20,54** (presented ~29–30) | **44 PASS** (7,33 fps), load 1,90 | Khỏe — không FN, không FP |
| **S3** (ấm) | **21 PASS** (3,5 fps), load 0,56 | **4,31** (chỉ slot 1; presented 20,49) | **4 FAIL** (0,67 fps), load 9,22 → **PHIÊN CHẾT** | **FP re-gate (kiểm duyệt)** — slot 1 không FN |
| diag1 (gate 60 s, KHÔNG chuẩn) | 74/60 s (delta 74) | — (chết ở kiểm tra gate, xem §7) | — | Chỉ quan sát chuỗi DIAG-GATE |
| diag2 (gate 60 s, KHÔNG chuẩn) | 82/60 s | **0,80 / 1,08 / 5,06** (presented ~21–25) | **36 PASS** (6 fps), load 0,56 | **FN (quan sát), re-gate LỌT** |
| diag3 (gate 60 s, KHÔNG chuẩn) | 22/60 s | **0,19** (chỉ slot 1; presented 4,61) | **14 FAIL** (2,33 fps), load 1,33 → **PHIÊN CHẾT** | **FN (quan sát), re-gate BẮT ĐÚNG** |

**Gộp Y3+Z3+A6+B8+C4 (phiên chuẩn):** FN **4/35 slot** (Wilson 95% [5%, 26%]);
phiên FN **3/13**; re-gate bắt được **2/3**; re-gate FP (ground truth đầy đủ)
**0/9** phiên không FN (Wilson [0%, 30%]); FP kiểm duyệt (phiên chết ở
re-gate, chỉ slot 1) **1/1**.
**Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9):** FN **7/44 slot (16%)**,
Wilson 95% **[8%, 29%]** (trước C4: 7/37, 19%, [9%, 34%] — tỉ lệ điểm giảm
nhẹ, khoảng tin cậy hẹp lại).

**Đọc đúng bảng:**
- S1 và S2 có cùng gate delta 47 nhưng slot 1 khác nhau 6,6× (3,38 ↔ 22,42
  fps) — gate delta không dự đoán được slot draw. S2 slot 2 tụt xuống 6,06
  fps (gapP50 166,7 ms) trong khi slot 1/3 ~21–22 fps, tải lúc đó THẤP và
  đang hạ (1,9 → 1,3) — chậm là ngẫu nhiên theo từng cửa sổ 10 s, không
  gắn với tải, không gắn với phiên.
- S3 là phiên chậm toàn diện ngay từ đầu: vite lên 7,77 s (gấp ~4–6× các
  phiên khác), mount 42,70 s, gate delta 21 vừa qua ngưỡng 20, slot 1
  4,31 fps, rồi re-gate sụp xuống delta 4 đúng lúc sóng tải vọt lên 9,22
  (luồng đợt 75 khác). Phiên chết ở re-gate là đúng thiết kế; nhãn FP chỉ
  theo tiêu chí nhị phân slot < 2 fps — về bản chất phiên này gần như
  đóng băng (re-gate 0,67 fps, rs=1), nên "giết oan" ở đây là giết một
  phiên vốn đã không đo được gì tốt.
- Không có phiên lạnh thật trong đợt này: VM reboot 14:28 UTC, nhưng luồng
  đợt 75 khác (C9) đã chạy Chrome trước S1 (25 tiến trình chrome tồn tại
  lúc S3 bắt đầu; socket Xvfb X170/X175 mồ côi từ trước). S1 chỉ là "bán
  lạnh": 0 tiến trình chrome lúc bắt đầu + profile Chrome mới toanh
  (launcher rmSync), nhưng Chrome đã chạy sau reboot. FN lạnh vẫn chưa
  thêm dữ liệu (vẫn 2/3 phiên lạnh có số đo đầy đủ: V4-P1 FN, Z3-S1 không
  FN, A6-S1 FN).

## 3. Hiệu chuẩn ngưỡng re-gate: 30 GIỮ NGUYÊN

Dữ liệu hiệu chuẩn (delta re-gate, tất cả phiên chuẩn có JSON):

| Nhóm | n | Delta |
|---|---|---|
| Phiên FN | 3 | 18 (Y3-S1, stall do tải), 21 (A6-S1, rAF stall lạnh), 75 (B8-S1, cold-start slow-start) |
| Phiên không FN | 10 | **4 (C4-S3, FP kiểm duyệt, sóng tải 9,22)**, 41 (A6-S2), **44 (C4-S2)**, **52 (C4-S1)**, 82, 137, 149, 228, 244, 273 |

- **Chồng lấn càng nặng:** FN max 75 > khỏe min 4 (trước C4: khỏe min 41).
  Không còn ngưỡng nào tách sạch — đã biết từ B8, nay thêm một điểm khỏe
  cực thấp (4) ở phía dưới.
- **Giữ ngưỡng 30.** Cơ sở: (a) vẫn bắt được 2/3 FN chuẩn đã quan sát (kiểu
  stall kéo dài 18, 21 — đúng kiểu FN mà cửa thứ hai được thiết kế để
  bắt); (b) FP ground-truth đầy đủ vẫn 0/9, Wilson [0%, 30%] — đã hẹp hơn
  [0%, 35%]; (c) FP mới (delta 4) xảy ra dưới sóng tải 9,22 trong phiên
  vốn đã chậm sâu — hạ ngưỡng xuống ≤ 4 để tránh nó thì cửa thứ hai gần
  như không còn bắt được gì (phiên đóng băng hẳn cũng vẽ được 0–3 draws);
  (d) nâng ngưỡng lên ≥ 45 để bắt FN 75 thì giết oan phiên khỏe delta 41
  và 44; (e) hai delta khỏe mới (44, 52) đều nằm trên 30 với biên 14–22
  draws — 30 vẫn đứng được giữa vùng khỏe "bình thường" (41–52) và vùng
  FN stall (18–21).
- **KHÔNG sửa production.** Mặc định launcher vẫn 30 (không đổi). Không đổi
  ngưỡng, không đổi gate, không đổi harness.
- **CẢNH BÁO MỚI — FP đầu tiên đã xuất hiện, và nó đến từ tải, không phải
  từ ngưỡng:** re-gate đo cửa sổ 6 s nên một sóng tải ngắn (vọt 0,56 →
  9,22 trong ~40 s) có thể đè delta khỏe xuống 4. Dưới buổi đo có 8–10
  luồng song song, sóng tải kiểu này không hiếm. Ngưỡng 30 không bảo vệ
  được khỏi FP do tải — chỉ có thiết kế khác mới làm được (vd re-gate đo
  2 cửa sổ, hoặc hoãn re-gate khi tải vọt; ngoài phạm vi luồng này).
- **Quan sát không gộp (diag):** nếu gộp cả diag2 (FN delta 36) và diag3
  (FN delta 14) thì FN thành 18, 21, **14**, 36, 75 và bắt FN thành 3/5 —
  nhưng diag dùng gate 60 s không chuẩn nên KHÔNG gộp (theo luật từ B8).
  Chỉ ghi nhận: delta 36 cho thấy FN kiểu slow-start có thể lọt ở mọi
  ngưỡng ≥ 36 mà vẫn dưới khỏe min 41 — vùng 30–41 nay là vùng "FN lọt
  và khỏe suýt FP" chồng nhau.

## 4. Slow-start / cold start của preview — đo thật bằng diag 60 s

Ba lần diag (lấy mẫu mỗi 2 s sau seek-0, cửa sổ 60 s; timeline chỉ 24 s nên
mẫu sau +24 s là phẳng — xem §7):

| Lần diag | Tải trong cửa sổ | rs theo thời gian | Thời gian tới rs≥2 duy trì | Draw-rate |
|---|---|---|---|---|
| diag1 | 5,7–7,9 (cao) | rs=1 tới +18 s, blip rs=2 ở +6 s rồi tụt lại 1; rs=4 từ +20 s (đúng lúc ct chạm 20 = hết clip) | **+20 s** | ~1 fps tới +18 s; burst 21,5 fps ở +20–22 s rồi phẳng (hết timeline) |
| diag2 | 1,0–1,7 (thấp) | rs=4 ngay từ +2 s, giữ tới +20 s; tụt xuống 2 ở +22–30 s (sau khi hết timeline) | **+2 s** | 4–6,5 fps trong cửa sổ (draw 2→82); phẳng sau +22 s |
| diag3 | 1,3–3,1 (thấp–vừa) | rs=4 ở +2/+4 s, rồi TỤT XUỐNG 1 ở +6–10 s (ct ĐÓNG BĂNG ở 7,1 trong ~4–6 s, playhead chạy trước tới 13), blip rs=4 ở +12 s, tụt lại 1 ở +14–16 s, rs=4 từ +18 s | **+18 s** | ~0–1,5 fps cả cửa sổ (draw 2→24); không bao giờ đạt 10 fps |
| B8 diag (đợt 74) | 1,3–3,1 | rs=1 tới +10 s, rs=4 từ +15 s | ~+15 s | ~1 fps tới +10 s; 17–29 fps sau +20 s |

**Kết luận đo được:**
1. **Thời gian tới rs≥2 duy trì dao động +2 s → +20 s** (diag2 +2, B8 +15,
   diag3 +18, diag1 +20). Không có con số "slow-start là X giây" duy
   nhất — nó là phân phối, không phải hằng số.
2. **Tải cao làm tệ hơn nhưng tải thấp không bảo đảm nhanh:** diag1 (tải
   ~6–8) chậm nhất (+20 s); nhưng B8 diag và diag3 (tải ~1,3–3,1) vẫn
   chậm +15/+18 s, trong khi diag2 (tải ~1,5) nhanh ngay (+2 s). Tải là
   yếu tố làm nặng thêm, không phải nguyên nhân duy nhất — còn yếu tố
   ngẫu nhiên theo lần chạy (có thể là trạng thái decoder/cache của
   Chrome, hoặc code preview bị sửa giữa chừng — xem §7).
3. **rs CÓ THỂ TỤT XUỐNG giữa chừng (diag3):** element đã lên rs=4 rồi tụt
   về 1, ct đóng băng ở 7,1 trong ~4–6 s trong khi playhead chạy trước
   tới 13 (lệch 5,9 s). Đây là **stall giữa chừng do decoder đói
   (buffer underrun)**, khác với slow-start đầu cửa sổ (rs=1 từ đầu) và
   khác rAF stall (rs=4, presented tốt). Lần đầu bắt được rs tụt 4→1
   giữa chừng với mẫu dày 2 s.
4. **Slow-start tái diễn sau mỗi seek-0, warmup dài không cứu được:**
   diag2 là bằng chứng mạnh nhất — cửa sổ gate 60 s hoàn toàn khỏe
   (rs=4 từ +2 s), vậy mà slot 1 ngay sau đó vẫn FN (0,80 fps) và slot 2
   cũng FN (1,08 fps), ở tải thấp (0,56–0,85). Mỗi lần seek-0 là một lần
   khởi động lại decoder/buffer, và lần nào cũng có thể chậm — "ấm" theo
   phiên không bảo đảm "ấm" theo slot.
5. **Draw-rate trong cửa sổ gate luôn thấp hơn nhiều so với slot khỏe:**
   diag2 rs=4 suốt mà draw chỉ 4–6,5 fps (trong khi slot khỏe S2 đạt
   20–22 fps). Cửa sổ gate 6 s (chuẩn) đo đúng pha khởi động chậm nên
   delta gate/re-gate luôn bị bóp — đó là lý do re-gate delta khỏe chỉ
   41–52 trong khi slot khỏe 20–38 fps. Ngưỡng re-gate thực chất đang
   hiệu chuẩn trên "độ chậm khởi động", không phải "độ khỏe ổn định".

## 5. Cold start editor — breakdown đo thật (6 lần chạy)

Trích timestamp ISO từ `presented-fps.log` (vite spawn → vite lên → app mount
→ modal đóng → project mẫu → GATE xong). Median trên 6 lần chạy (S1/S2/S3 +
diag1/2/3; S3 là ngoại lệ, xem dưới):

| Mốc | S1 | S2 | S3 | diag1 | diag2 | diag3 | Median |
|---|---|---|---|---|---|---|---|
| vite spawn → vite lên | 1,14 s | 1,20 s | **7,77 s** | 2,27 s | 1,47 s | 2,40 s | **1,87 s** |
| vite lên → app mount | 13,94 s | 16,41 s | **42,70 s** | 16,11 s | 18,79 s | 22,31 s | **17,60 s** |
| app mount → modal đóng | 1,80 s | 1,79 s | 3,62 s | 2,30 s | 2,32 s | 2,04 s | 2,17 s |
| modal đóng → project mẫu sẵn | 0,00 s | 0,00 s | 0,02 s | 0,01 s | 0,01 s | 0,09 s | ~0 s |
| project mẫu → GATE xong (gồm 6 s phát) | 9,55 s | 9,68 s | 19,08 s | 67,00 s* | 69,11 s* | 72,87 s* | — |
| **TỔNG vite spawn → app mount** | **15,09 s** | **17,62 s** | **50,47 s** | **18,38 s** | **20,26 s** | **24,70 s** | **19,32 s** |
| **TỔNG vite spawn → GATE xong (phiên chuẩn)** | **26,44 s** | **29,09 s** | **73,18 s** | — | — | — | — |

\* diag: cửa sổ gate 60 s + ~7–13 s inject/seek/wait, không so sánh với chuẩn.

**Đọc đúng bảng:**
- **Mảnh tốn nhất là "vite lên → app mount" (median 17,60 s, chiếm ~91%
  tổng thời gian tới mount).** Mảnh này gồm: Chrome khởi động + tải trang
  + biên dịch/bundle JS lần đầu (vite dev, cold cache) + React mount +
  tải project mẫu 3 clip + hook `__vcutPreviewEnhance` sẵn sàng. Chưa tách
  được sâu hơn bằng log hiện tại (harness không ghi mốc tải trang riêng
  — nợ mở cho đợt sau: ghi performance timing của page).
- **Vite lên nhanh và ổn định (1,14–2,40 s, trừ S3).** Modal đóng ~2 s,
  project mẫu sẵn gần như tức thì sau modal (~0 s) — hai mảnh này không
  phải bottleneck.
- **S3 là ngoại lệ toàn diện:** vite lên 7,77 s (gấp ~4–6×), mount 42,70 s
  (gấp ~2,5× median), project → gate 19,08 s (inject/seek/wait ~12,7 s
  so với ~3,2 s bình thường), tổng tới gate 73,18 s. Lúc S3 bắt đầu có 25
  tiến trình chrome của luồng khác đang chạy — nghi ngờ cạnh tranh tài
  nguyên, nhưng tải 1-min lúc đó chỉ 0,95 nên chưa có bằng chứng nhân-quả
  chắc chắn. S3 cũng là phiên chậm toàn diện về sau (gate 21, slot 4,31,
  re-gate 4) — "chậm từ lúc khởi động" là dấu hiệu của phiên xấu, không
  phải nhiễu đo.
- **Số này là của vite DEV (chưa build production) trên VM 2 vCPU/8 GB,
  lần tải đầu sau mỗi lần spawn vite mới (profile Chrome mới).** Bản
  production build sẵn + máy thật sẽ nhanh hơn — nhưng thứ tự bottleneck
  (mount/bundle ≫ vite lên ≫ modal/project) vẫn có giá trị chỉ hướng tối
  ưu: muốn preview sẵn sàng nhanh hơn thì phải rút ngắn thời gian tới app
  mount, không phải thời gian khởi động vite.

## 6. Resume-probe — stall đói-decoder tái hiện 2/3

| Probe | Draw fps | Presented fps | rs chủ đạo | Seeking | shortPause |
|---|---|---|---|---|---|
| S1-A (pause dài) | 3,96 | 18,18 | 4 (50/50) | 0/50 | — |
| S1-B (pause ngắn ~1 s) | **0,86** | 24,03 | **1 (42/50)** | **42/50** | seeking=true, rs=1, pendingSeek=true, sleeping=false, lastDrawn=null |
| S2-A (pause dài) | 15,94 | 30,34 | 4 (50/50) | 0/50 | — |
| S2-B (pause ngắn ~1 s) | **0,69** | 16,25 | **1 (27/50)** | **27/50** | seeking=true, rs=1, pendingSeek=true, sleeping=false, lastDrawn=null |
| diag2-A | 16,98 | 30,42 | 4 (50/50) | 0/50 | — |
| diag2-B | 17,80 | 29,36 | 4 (50/50) | 0/50 | seeking=false, rs=4, pendingSeek=false, sleeping=true, lastDrawn=6,43 |

- **Probe B stall tái hiện 2/3 trong C4** (S1, S2) với đúng chữ ký Z3-S1:
  resume cắt ngang pause-seek chưa settle (shortPause seeking=true,
  pendingSeek=true, lastDrawn=null), element kẹt rs=1 + seeking phần lớn
  cửa sổ, draw < 1 fps, hold tăng (S1-B hold 6,36 fps). Cộng với Z3-S1,
  cơ chế này nay đã quan sát **3 lần** (Z3-S1 A+B tính là 1 phiên, C4-S1,
  C4-S2) — không còn là hiện tượng một lần.
- **Probe B stall không gắn chặt với tải:** S2-B stall khi tải lúc probe
  chỉ ~0,5–1,5 (máy gần như lặng), trong khi diag2-B khỏe khi tải lúc
  control vọt lên 9,05. Như slow-start, stall probe B cũng có yếu tố
  ngẫu nhiên theo lần chạy.
- Probe A (pause dài ~2,5 s, seek đã settle) khỏe cả 3 lần (3,96 / 15,94 /
  16,98 fps) — pause đủ dài để seek settle thì không stall. Điều này củng
  cố giả thuyết "resume cắt ngang pause-seek chưa xong" là cơ chế chính.
- **Đối chứng tab trắng bất thường ở S2:** presented 14,7 fps, rVFC 6,16,
  mediaRate 0,477×, dropped 74 — tệ nhất từ trước tới nay (các đối chứng
  trước: presented ~30, mediaRate ~1), mà tải lúc đó chỉ 0,49 (máy gần như
  lặng). Giả thuyết chưa chứng minh: decoder trong cùng tiến trình Chrome
  bị suy sau stall probe B ngay trước đó (cùng phiên), nên tab trắng mới
  cũng phát chậm. S1 đối chứng bình thường (presented 29,8) dù probe B
  cũng stall — nên giả thuyết này chưa vững; chỉ ghi nhận là quan sát lạ,
  cần thêm dữ liệu.

## 7. Sự cố trong đợt (ghi trung thực)

1. **Không có phiên lạnh thật:** VM reboot 14:28 UTC nhưng luồng đợt 75
   khác (C9) đã chạy Chrome trước S1; lúc S3 bắt đầu có 25 tiến trình
   chrome đang chạy. S1 chỉ "bán lạnh" (0 chrome lúc bắt đầu + profile
   mới). FN lạnh vẫn chưa thêm dữ liệu.
2. **Luồng đợt 75 khác sửa code trực tiếp trong cửa sổ đo** (như B8 đã
   gặp ở đợt 74): `codecProbe.ts` sửa 14:45:17 UTC — giữa slot 1 và slot
   2 của S1; `App.tsx` sửa 14:48:32 — giữa S1 và S2 (S2 tải bản App mới);
   `preview.tsx` sửa 14:53:52 — giữa cửa sổ gate của diag1 (mẫu +16 s →
   +18 s); `EnhancePanel.tsx` 14:54:11 — cũng trong diag1;
   `enhancePreview.ts` 14:52:10 — giữa probe B và đối chứng của S2.
   Diag2/diag3/S3 chạy sau 14:59 không còn file src nào bị sửa (chỉ file
   test/script). Vì vite dev phục vụ module theo yêu cầu, các phiên chạy
   sau mỗi lần sửa có thể đã đo trên code khác nhau — số slow-start mang
   nhiễu này; verdict về re-gate (harness không đổi) thì không bị ảnh
   hưởng.
3. **Diag1 chết ở kiểm tra gate (exit 2) do thiết kế diag, không phải do
   phiên xấu:** cửa sổ 60 s vượt quá timeline 24 s nên sau vòng lấy mẫu,
   `togglePlay` khởi động lại phát từ đầu và mẫu cuối là element vừa
   seek-0 (rs=1, ct=0) → kiểm tra gate throw dù delta 74. Đã sửa ở
   variant diag v2 (ghi log thay vì throw — xem §8); diag2/diag3 chạy v2
   đều hoàn tất. 30 mẫu DIAG-GATE của diag1 vẫn đầy đủ trong log.
4. **Sóng tải từ 8–10 luồng song song:** tải 1-min dao động 0,41 → 12,89
   trong đợt; S3 re-gate trúng sóng 9,22 (FP kiểm duyệt); S2 đối chứng
   trúng sóng 9,05 lúc control (nhưng S2 slot chạy lúc tải thấp). Mỗi
   phiên đều ghi tải từng mốc trong JSON/log nên có thể đối chiếu.
5. **Diag2 gate1a.rateFps SAI như B8 đã ghi:** delta 82 chia cho 6 trong
   khi cửa sổ là 60 s (đúng là 1,37 fps). Chỉ là số ghi trong JSON diag,
   không dùng để kết luận; diag không gộp thống kê.
6. **Sau khi hết timeline (playhead 24), element có hành vi lạ:** diag2
   qTotal tiếp tục tăng 234 → 600 trong khi draw đứng yên ở 82 và dropped
   vọt lên 323 — element vẫn giải mã mà canvas không vẽ. Diag1/diag3
   qTotal đứng yên sau khi hết timeline. Khác nhau chưa rõ nguyên nhân;
   không ảnh hưởng kết luận chính (cửa sổ đo slow-start là +0–24 s).

## 8. Thiết kế thử nghiệm C4 (để đợt sau tái hiện hoặc bác bỏ)

- Tái sử dụng launcher Z3 NGUYÊN (`apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`,
  ngưỡng mặc định 30, re-gate BẬT) + analyzer Z3 NGUYÊN
  (`apps/web/scripts/analyze-72z3-gate-fn2.mjs`): KHÔNG sửa file nào trong
  repo ngoài doc LIMITS này. Config vite pre-create bằng script trích đúng
  template harness gốc (`/tmp/round75-c4/gen-vite-config.mjs`, eval template
  literal + newline cuối — 1.726 byte, **md5 ca5b3c48afd54171d995e74cbadf7215,
  KHỚP A6/B8**); launcher ghi log "config vite đã có sẵn đúng nội dung, bỏ
  qua ghi" ở mọi lần chạy. Lưu ý đã làm rõ ở C4: file `.cjs` chứa NỘI DUNG
  ESM nguyên văn (không phải chuyển đổi CJS) — vite vẫn load được vì nó
  bundle config bằng esbuild; md5 1726 byte chính là md5 của template ESM.
- Dry-run launcher trước đo: 27 thay thế OK, variant 53.246 byte (khớp Z3/A6/B8).
- Analyzer: chạy bản copy trong /tmp có thêm thư mục A6/B8/C4
  (`/tmp/round75-c4/analyze-75c4.mjs`, chỉ đổi hằng DIR + nhãn + đọc
  notes `a6/b8/c4-notes.txt`, logic giữ nguyên). Chạy baseline trước khi có
  phiên C4 đã tái hiện đúng số B8 (FN 7/37, FP 0/7, bắt 2/3) rồi chạy lại
  sau khi có phiên C4 cho số gộp mới.
- Mỗi phiên chờ load 1-min < 3,0 trước khi chạy (luật Y3, tối đa 10 phút)
  — ngoại lệ: S1 chạy ngay khi load 1,17 (đã đủ thấp); S3 chạy ngay khi
  load 1,03 (không chờ vì đã thấp). S2 chờ ~4 phút (9,25 → 2,81); diag2
  chờ ~3 phút (5,40 → 2,39); diag3 chờ ~3 phút (5,40 → 2,33).
- **Variant diag** (`/tmp/round75-c4/variant-diag.mjs`, từ variant Z3
  dry-run): chỉ đổi `sleep(6000)` ở khối gate thành vòng lấy mẫu 2 s × 30
  (= 60 s), ghi `DIAG-GATE +Xs` (rs/ct/qTotal/draw/playhead/load). V2 (sau
  diag1): thêm vô hiệu hóa throw kiểm tra gate (ghi log thay vì throw)
  vì cửa sổ 60 s vượt timeline 24 s. Mọi bước khác (slot, re-gate, probe,
  đối chứng) giữ nguyên. Diag KHÔNG phải phiên chuẩn — không gộp thống kê.
- **Parser cold-start** (`/tmp/round75-c4/parse-coldstart.mjs`): trích
  timestamp ISO từ `presented-fps.log` (vite lên / app mount / modal đóng /
  project mẫu / GATE xong) + chuỗi DIAG-GATE (thời gian tới rs≥2 lần đầu
  và duy trì, tới draw-rate ≥ 10/20 fps) — chạy lại được trên mọi phiên
  trong `hidden_files/round75-c4/`.
- FN = gate1a PASS + slot draw < 2 fps (tiêu chí Y3/Z3, analyzer tự tính).
  Phiên chết ở re-gate chỉ còn slot 1 làm ground truth (kiểm duyệt, không
  gộp mù); FP kiểm duyệt tách riêng khỏi FP ground-truth đầy đủ.

## 9. Giới hạn (trung thực)

- **n vẫn nhỏ:** chỉ **3 phiên chuẩn** trong đợt này (0 FN, 2 khỏe hoàn
  chỉnh + 1 chết ở re-gate) + 3 phiên diag (không chuẩn). Bắt FN vẫn 2/3
  phiên chuẩn (không đổi); FP đầy đủ 0/9, Wilson [0%, 30%] — đã hẹp hơn
  [0%, 35%] nhưng vẫn rộng; FP kiểm duyệt 1/1 là dữ liệu mới nhưng chỉ
  dựa trên 1 slot duy nhất.
- **Ngưỡng 30 nay đứng trên dữ liệu chồng lấn cả hai phía:** FN max 75,
  khỏe min 4 (FP kiểm duyệt). 30 chỉ còn là "điểm cân bằng tốt nhất", và
  FP đầu tiên cho thấy sóng tải có thể đẩy delta khỏe xuống dưới mọi
  ngưỡng hợp lý — ngưỡng không sửa được vấn đề tải.
- **Không có phiên FN chuẩn mới** nên không kiểm chứng thêm được khả năng
  bắt FN của re-gate; hai quan sát diag (lọt delta 36, bắt delta 14)
  củng cố phân loại cơ chế nhưng không phải dữ liệu hiệu chuẩn chuẩn.
- **Slow-start chưa có nguyên nhân gốc:** đo được phân phối +2 → +20 s
  và 3 cơ chế khác nhau (rs=1 từ đầu; rs tụt 4→1 giữa chừng + ct đóng
  băng; rAF stall), nhưng chưa biết tại sao cùng một clip/cùng một máy
  lần thì +2 s lần thì +20 s. Nghi vấn còn mở: trạng thái decoder/cache
  Chrome, code preview bị sửa giữa chừng, sóng tải — chưa phân biệt được.
- **Cold-start breakdown chưa tách được mảnh "vite lên → app mount":**
  17,60 s median gồm Chrome khởi động + tải trang + biên dịch bundle +
  mount + tải project mẫu, nhưng harness không ghi mốc tải trang riêng
  nên chưa biết trong 17,6 s đó phần nào tốn nhất. Cần ghi performance
  timing ở đợt sau nếu muốn tối ưu mảnh này.
- **Nhiễu từ luồng đợt 75 khác:** code preview/media bị sửa trong cửa sổ
  đo (xem §7 mục 2); sóng tải 0,41 → 12,89; Chrome của luồng khác chạy
  song song (25 tiến trình lúc S3). Số slow-start/cold-start mang nhiễu
  này; số re-gate/FN/FP (harness không đổi) thì không.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb,
  clip long1080 20 s, canvas 871×275) trong buổi có sóng load từ 8–10
  luồng song song + 1 lần reboot buổi chiều. Số trên máy thật/khác clip
  sẽ khác — nhưng verdict về điểm mù re-gate và về tính ngẫu nhiên của
  slow-start là về THIẾT KẾ / HÀNH VI, không phải về con số tuyệt đối.
- **Không sửa gì trong production:** harness gốc không đổi; launcher +
  analyzer Z3 không đổi; gate 6 s không đổi; ngưỡng mặc định vẫn 30; không
  push (chỉ stage); không release/tag. Không thêm key i18n (dict vẫn 2405
  key — không đụng code nên không cần cập nhật vi/en.json hay test khóa
  số key). Không chạy tsc (không đụng code). File `.cjs` config vite,
  variant dry-run/diag, script gen config + parser + bản copy analyzer
  trong /tmp (mất khi reboot — không stage, không phải deliverable); ảnh
  `r8-presented-done.png` (binary) không stage.

## 10. File và log

- Doc này: `docs/PHASE9_ROUND75_C4_GATE_SLOWSTART_LIMITS.md`.
- Launcher (tái sử dụng, không sửa): `apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`
  — dry-run 27 thay thế OK, variant 53.246 byte; chạy 3 lần chuẩn (2 hoàn
  chỉnh + 1 chết ở re-gate).
- Variant diag (mới, trong /tmp, không stage):
  `/tmp/round75-c4/variant-diag.mjs` — chạy 3 lần (diag1 exit 2 do
  throw kiểm tra gate; diag2/diag3 exit 0/1 với fix v2).
- Script phân tích (tái sử dụng, không sửa): `apps/web/scripts/analyze-72z3-gate-fn2.mjs`
  — bản copy có thêm A6/B8/C4 trong `/tmp/round75-c4/analyze-75c4.mjs`
  (không stage); baseline tái hiện đúng số B8; pooled mới trong
  `/tmp/round75-c4/analyze-pooled.txt`.
- Parser cold-start (mới, trong /tmp, không stage):
  `/tmp/round75-c4/parse-coldstart.mjs` — trích breakdown từ log + chuỗi
  DIAG-GATE.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round75-c4.md`.
- Log đo: `hidden_files/round75-c4/session1/` (hoàn chỉnh:
  `presented-fps.json` 148.505 byte + đủ log/png/notes), `session2/`
  (hoàn chỉnh: 148.758 byte), `session3/` (chết ở re-gate: JSON 2.528
  byte + đủ log/png/notes), `diag1/` (30 mẫu DIAG-GATE trong
  `presented-fps.log`/`c4-run.log`, không JSON), `diag2/` (hoàn chỉnh:
  148.082 byte), `diag3/` (chết ở re-gate: JSON 2.541 byte).
  Kết quả phân tích gộp: `/tmp/round75-c4/analyze-pooled.txt` (tmpfs, mất
  khi reboot); baseline Y3+Z3+A6+B8: `/tmp/round75-c4/analyze-baseline.txt`.
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh
  `r8-presented-done.png` (binary), log luồng + log đo (goal workspace, không
  phải repo), script gen config + variant diag + parser + bản copy analyzer
  trong /tmp.

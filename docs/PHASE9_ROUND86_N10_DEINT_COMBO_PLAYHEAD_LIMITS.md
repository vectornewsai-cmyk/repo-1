# Đợt 86 N10 — Deint combo: dị thường playhead 1,3–1,6× TÁI HIỆN + tách được thành phần gây ra + fixture 60fps gộp n=8

Ngày: 11/11/2026 (lượt cron 09:35 +07; đo headed 02:44–03:37 UTC, tức
09:44–10:37 giờ VN). Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only,
Chromium qua Xvfb + CDP, `--disable-gpu`; VM reboot giữa lượt lúc
~03:25 UTC, uptime reset). Nợ: M1 §7.3–7.5 (đợt 85) — đo lại combo
≥3 lần; tách từng hook/cặp; đo headed fixture 60fps.

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT, N10 KHÔNG TỰ ĐÓNG G1

- **Dị thường playhead combo TÁI HIỆN MẠNH (3/3 lần, 11/15 slot ở
  1,42–1,62×; baseline kề 0,74–1,18×, không slot nào ≥1,3×).**
  Cơ chế M1 nay được TINH CHỈNH BẰNG SỐ (xem §3.3): slot combo
  KHÔNG chạy nhanh đều — nó chạy ~1,0× bình thường CỘNG 2 lần
  teleport +2,00s (dấu vân tay của trần clamp `PREVIEW_DT_CAP_S =
  2`): a.ph = 2,00–2,02 ngay khi bấm phát, rồi nhảy thêm +2,00
  trước mẫu trace đầu. Playhead nhanh hơn nghĩa là **frame bị bỏ
  qua** (forwardStep bước qua ~2s nội dung trong 1 tick, video
  seek tới thời gian mới — các frame ở giữa không bao giờ hiển
  thị), KHÔNG phải timestamp sai, KHÔNG phải đo sai.
- **ĐÃ TÁCH ĐƯỢC THÀNH PHẦN GÂY RA: lớp chroma/LUT/effects, KHÔNG
  phải enhance.** Enhance-only (cả 3 hook deint+denoise+stabilize,
  không chroma/LUT/effects): playhead tối đa 1,06×, 0/5 slot có
  teleport +2,00. Fx-only (chroma+LUT+2 effects, không enhance):
  3/5 slot có teleport, gồm 1 slot đúng dấu vân tay +2,00
  (a.ph=2,00, jump1=2,00). Từng hook riêng / từng cặp enhance đều
  sạch (tối đa 1,20×, trừ 2 slot lẻ 1,33× — xem §3.2).
- **Combo FPS gộp n=6 (L3+M1+N10): [0,69, 0,96, 0,29, 1,25, 0,45,
  0,94] → median 0,815, mean 0,763, SD 0,356, CI 95% [0,389;
  1,137], PASS 3/6.** Phân tán vẫn chi phối (0,29–1,25) — không
  có verdict combo. Số combo vẫn chỉ nói "chưa đo được chắc".
- **Fixture 60fps gộp n=8 (M1 5 + N10 3: 0,95 / 1,13 / 0,92) →
  median 0,930, mean 0,896, SD 0,158, CI 95% [0,764; 1,028],
  PASS 6/8 (75%).** CI cận dưới nay VƯỢT ngưỡng (+0,014; M1 ở
  n=5 là −0,110) nhưng tỉ lệ PASS vẫn 75% < 80%; cửa sổ 5 lần
  mới nhất [0,62, 0,73, 0,95, 1,13, 0,92] median 0,92, 3/5 PASS
  → luật (b) VẪN CHƯA ĐẠT theo tỉ lệ PASS. 60fps tốt hơn 30fps
  về median (0,93 so với 0,805) nhưng KHÔNG đóng được G1 theo
  tiêu chí tỉ lệ PASS. Cả 8 lần đều ở chế độ tải (baseline
  <5 fps) — câu hỏi chế độ yên VẪN MỞ.
- **Không sửa production.** Chỉ thêm 1 probe mới + file này.

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `apps/web/scripts/probe-86n10-config-fps.mjs` | **Mới**: probe tổng quát theo CONFIG (env `N10_CONFIG_JSON` + `N10_FIXTURE` + `N10_LABEL`), sao từ probe combo M1, cùng cơ chế slot xen kẽ 11 slot × 3s + trace playhead ~250ms. Thêm: kiểm tra config khớp generic (4 key), `jumpsGe1s` + tái dựng a.ph/steady trong report, pause fallback store (xem dưới). Probe thăm dò, không gate: exit 0 khi đủ 11 slot. |
| `docs/PHASE9_ROUND86_N10_DEINT_COMBO_PLAYHEAD_LIMITS.md` | **Mới**: file này. |
| `apps/web/src/preview.tsx`, `apps/web/src/lib/playheadPacing.ts` và mọi file production khác | **KHÔNG ĐỔI**. |

**Lỗi harness do chính N10 gây ra, đã sửa trong probe (ghi lại để
khỏi lặp):** bản fallback pause đầu tiên viết `st.setState(...)`
trong khi `STORE_FN` trả về `getState()` (state, không có
`setState`) → `TypeError: st.setState is not a function`, làm hỏng
lần denoise-only-run1 đầu tiên. Đã sửa thành
`window.__l3storeMod.useStore.setState({ playing: false })`.
**Lưu ý trung thực:** sau khi sửa, fallback KHÔNG được kích hoạt
lần nào trong 14 lần đo hoàn thành (0/154 slot) — bản sửa chỉ được
kiểm tra cú pháp (`node --check`), chưa được kiểm chứng bằng một
lần kích hoạt thật. M1 §6 vẫn coi pause-Space là nợ mở; fallback
này là đề xuất đã sửa code nhưng chưa có bằng chứng chạy.

## 3. Số đo thật

Tất cả các lần đo headed, cửa sổ 2560×1440, canvas backing
1991×815, scaleY 1,132, clip 1 = fixture (30fps cho tách hook,
60fps cho deint-only), 11 slot × ~3s xen kẽ [B,C,…]. Tải ghi là
loadavg 1-phút (đầu → cuối phần FPS). Đợt 86 có 8–10 luồng chạy
song song; tải 1-phút dao động 0,7–33,8 trong phiên, và VM reboot
giữa lượt (~03:25 UTC) làm chết 1 lần retry đang chạy.

### 3.1 Combo ×3 (N10) — dị thường playhead tái hiện

| Lần | Thời gian (UTC) | Tải 1-phút | Baseline mean | 5 tỉ lệ drift-corrected | Combo mean | Kết quả |
|---|---|---|---|---|---|---|
| run1 | 02:44–02:48 | 0,7 → 23,3 | 2,00 fps | 1,24 / 1,14 / 2,11 / 1,62 / 0,14 | **1,25×** | "ĐẠT" tham khảo, nhưng baseline sụp |
| run2 | 02:51–02:54 | 5,2 → 4,7 | 2,77 fps | 0,00 / 1,23 / 0,06 / 0,23 / 0,71 | **0,45×** | CHƯA ĐẠT, 2 slot đóng băng |
| run3 | 03:26–03:29 | 1,1 → 13,1 | 4,37 fps | 0,22 / 0,77 / 1,39 / 1,21 / 1,12 | **0,94×** | "ĐẠT" tham khảo |

Gộp combo (L3 0,69× + M1 0,96× / 0,29× + N10 1,25× / 0,45× /
0,94×): **n=6, median 0,815×, mean 0,763, SD 0,356, CI 95%
[0,389; 1,137], PASS 3/6.** Không verdict combo (SD 0,356, CI
rộng 0,75).

**Playhead slot combo (15 slot, 3 lần): 1,51 / 1,50 / 1,62 / 1,51 /
0,42 | 0,56 / 1,54 / 0,55 / 1,42 / 1,54 | 1,42 / 1,53 / 1,57 /
1,52 / 1,19** — 11/15 slot ở 1,42–1,62×; 3 slot đóng băng
(0,42–0,56, draw 0–0,27 fps); 1 slot 1,19×. Baseline kề (18
slot): 0,74–1,18×, không slot nào ≥1,3×. Dị thường tái hiện ở
cả 3 lần đo, không phải nhiễu 1 lần.

**Slot draw-fps từng lần (B = baseline, C = combo, fps):**

| Lần | B0 | C1 | B2 | C3 | B4 | C5 | B6 | C7 | B8 | C9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| run1 | 1,26 | 2,58 | 2,91 | 2,64 | 1,72 | 4,97 | 3,00 | 3,35 | 1,14 | 0,21 | 1,95 |
| run2 | 1,60 | 0,00 | 3,36 | 4,40 | 3,77 | 0,27 | 5,15 | 0,63 | 0,30 | 0,98 | 2,45 |
| run3 | 4,99 | 1,61 | 9,66 | 4,77 | 2,81 | 3,55 | 2,28 | 3,75 | 3,93 | 3,61 | 2,52 |

- **Run1:** tỉ lệ 1,25× bị phồng vì baseline sụp (2,00 fps) trong
  khi combo vẽ được 2,75 fps — cùng mẫu M1 run1 (slot combo
  2,11× vì baseline kề sụp). Đừng trích 1,25× như "combo nhanh
  hơn baseline".
- **Run2:** 2 slot combo đóng băng hoàn toàn (slot 1: 0,00 fps;
  slot 5: 0,27 fps) — tỉ lệ 0,00 / 0,06. Mean 0,45× là trung
  bình của 2 thái cực, như M1 run1.
- **Run3 (lần sạch nhất):** không slot đóng băng; tỉ lệ
  0,22–1,39; playhead 5/5 slot ≥1,19× (4/5 ở 1,42–1,57×).
  Đây là lần combo duy nhất từ trước tới nay vừa không đóng
  băng vừa tái hiện dị thường ở mọi slot.

**Pixel combo ổn định:** MAD combo-vs-baseline **25,6127
(86,28% đổi)** giống hệt nhau ở cả 3 lần N10. Lưu ý: khác nhẹ
so với L3/M1 (25,5939) — lệch +0,019, ổn định nội bộ N10; có
thể do thứ tự frame trước snapshot (stabilize smoothing 10 dùng
lịch sử frame) chứ không phải code đổi (preview.tsx không chạm).
Không ảnh hưởng kết luận (C1 PASS cả 3 lần, hook tap=true).

### 3.2 Tách hook — playhead theo từng config (fixture 30fps, 5 slot config/lần)

| Config | Tỉ lệ FPS (mean) | Baseline mean | Playhead 5 slot config | a.ph / jump1 (dấu vân tay) | Kết luận playhead |
|---|---|---|---|---|---|
| **combo đầy đủ** (×3) | 1,25 / 0,45 / 0,94 | 2,00 / 2,77 / 4,37 | 1,42–1,62 (11/15 slot) | a.ph=2,00–2,02; jump1=+2,00 (run1/run2, mọi slot không đóng băng) | **CÓ dị thường** |
| deint-only | 1,47× | 1,13 fps | 0,95 / 1,20 / 0,96 / 0,89 / 1,05 | a.ph 0,32–1,51; jump1 ≤1,08, không slot nào =2,00 | KHÔNG |
| denoise-only | 0,58× | 6,94 fps | 1,33 / 1,00 / 1,01 / 1,01 / 1,03 | 1 slot jump1=1,16 (s1c), còn lại ~0 | KHÔNG (1 slot lẻ 1,33×) |
| stabilize-only | 0,93× | 2,35 fps | 0,85 / 1,02 / 1,01 / 1,04 / 1,03 | a.ph 1,00–1,38; jump1 ≈0 | KHÔNG |
| deint+denoise | 1,03× | 2,32 fps | 1,08 / 1,06 / 1,03 / 1,04 / 1,33 | 1 slot jump1=1,32 (s9c); baseline kề s8b jump1=3,30 (xem dưới) | KHÔNG (1 slot lẻ 1,33×) |
| deint+stabilize | 1,33× | 6,83 fps | 1,00 / 1,02 / 0,98 / 0,89 / 0,98 | a.ph 1,11–1,26; jump1 ≈0 — sạch nhất | KHÔNG |
| denoise+stabilize | 0,62× | 5,93 fps | 1,06 / 1,12 / 1,10 / 1,02 / 0,95 | a.ph 0,91–1,31; jump1 ≈0 | KHÔNG |
| **enhance-only** (3 hook, không fx) | 0,71× | 7,11 fps | 0,98 / 0,97 / 1,01 / 0,90 / 1,06 | a.ph 1,08–1,28; jump1 −0,01–0,28 | **KHÔNG — quyết định** |
| **fx-only** (chroma+LUT+effects, không enhance) | 1,22× | 9,60 fps | 1,22 / 1,51 / 0,64 / 1,15 / 1,33 | s3c: a.ph=2,00, jump1=+2,00; s1c: a.ph=1,98; s9c: jump1=1,09 | **CÓ — quyết định** |

Đọc bảng: **chỉ combo đầy đủ và fx-only mới có dấu vân tay
+2,00** (a.ph ≈ 2,00 và/hoặc jump1 ≈ +2,00). Enhance-only —
cả 3 hook enhance cùng lúc, không có chroma/LUT/effects — hoàn
toàn sạch (tối đa 1,06×). Vậy **thành phần gây teleport nằm ở
lớp chroma/LUT/effects (hoặc tương tác của lớp đó với đường
pipeline), không phải ở deint/denoise/stabilize**. Chưa tách
được sâu hơn trong lớp fx (chroma vs LUT vs sharpen/noise riêng
lẻ) — cần luồng sau nếu parent muốn (xem §7.4).

**Ngoại lệ cần ghi rõ (đừng bỏ qua khi trích):**
- **Slot lẻ 1,33× ở denoise-only (s1c) và deint+denoise (s9c):**
  mỗi lần có đúng 1/5 slot config chạm 1,33× với jump1 1,16 /
  1,32 — teleport NHỎ HƠN, không chạm trần 2s. Đây là cùng họ
  cơ chế nhưng stall ngắn hơn (gap ~1,2–1,3s, chưa chạm clamp).
- **Baseline cũng teleport được khi stall đủ dài:** slot 8
  baseline ở lần deint+denoise: jump1=+3,30 (a.ph=0,77 →
  mẫu đầu 4,07), steady chỉ 0,31, draw 0,20 fps — slot gần
  đóng băng, playhead nhảy một phát +3,3s rồi gần như đứng
  yên. Chứng tỏ teleport là hàm của **độ dài stall**, không
  phải đặc quyền của combo: config nào gây stall ≥1,5s cũng
  teleport; combo/fx chỉ làm stall đó xảy ra thường xuyên
  (11/15 slot so với 0–1/5 ở các config enhance).
- **MAD từng config (C1, chứng minh áp thật):** deint-only
  0,5821 (6,69%); denoise-only 1,6451 (31,2%); stabilize-only
  6,6595 (13,16%); deint+denoise 1,9153 (31,34%);
  deint+stabilize 6,7235 (13,21%); denoise+stabilize 6,6114
  (32,87%); enhance-only 6,6862 (32,88%); fx-only 21,8253
  (86,28% — cùng tỉ lệ % đổi với combo). Mọi config đều PASS
  C1 (MAD > 0,05, state khớp config, hook tap đúng khi có
  deint). Lưu ý: MAD denoise+stabilize (6,6114) ≈ MAD
  stabilize-only (6,6595) — denoise gần như không đổi thêm
  pixel khi đã có stabilize ở playhead 1,0 (chỉ số snapshot
  1 điểm, không phải đo chất lượng denoise).

**FPS từng config — chỉ ghi số, KHÔNG verdict (mỗi config n=1,
chế độ tải khác nhau):** denoise xuất hiện trong cả 3 tỉ lệ thấp
nhất (denoise-only 0,58×; denoise+stabilize 0,62×; enhance-only
0,71×) trong khi deint-only 1,47× và stabilize-only 0,93× —
GỢI Ý denoise là hook enhance tốn kém nhất, nhưng chưa chứng
minh được: các lần đo ở chế độ tải khác nhau (baseline 1,13–
9,60 fps) và tỉ lệ là hàm của chế độ máy (L3 §3.2). Riêng
deint+stabilize 1,33× bị phồng bởi 1 slot config 21,93 fps
(tỉ lệ 3,06) — đừng trích. Fx-only 1,22× cũng nhiễu (tỉ lệ
3,86 / 1,53 / 0,09 / 0,38 / 0,26; baseline 9,60 fps, lần yên
nhất đợt — slot 8–10 baseline vọt 21–25 fps khi tải hạ cuối
phiên).

### 3.3 Cơ chế dị thường playhead — TINH CHỈNH TỪ M1 (bằng chứng trace)

M1 đã tìm ra teleport +2,00 do clamp dt 2s. N10 tái dựng thêm
2 đại lượng từ trace mỗi slot (a.ph = playhead lúc mẫu `a`,
tức ~0,8s sau khi bấm phát; steady = tốc độ trong cửa sổ trace;
jump1 = mẫu trace đầu − a.ph) và thấy mẫu HỆ THỐNG, không phải
nhiễu:

| | a.ph (mẫu a) | jump1 (a → mẫu trace đầu) | steady trong trace |
|---|---|---|---|
| Combo run1 (4 slot không đóng băng) | **2,00–2,02** (4/4) | **+1,98–+2,02** (4/4) | 0,96–1,06× |
| Combo run2 (3 slot không đóng băng) | **2,00** (3/3) | **+2,00** (3/3) | 0,93–1,00× |
| Combo run3 (5 slot) | 2,00–3,60 (s1c=3,60) | +1,64–+2,01 (4/5; s9c +0,66) | 0,93–1,37× |
| Baseline kề (18 slot, 3 lần) | 0,86–1,58 | −0,01–+0,47 (trừ s8b run2 +0,92) | 0,74–1,20× |
| Enhance-only (5 slot) | 1,08–1,28 | −0,01–+0,28 | 0,90–1,06× |
| Fx-only (5 slot) | 0,91–2,00 | +0,51–+2,00 (s3c +2,00) | 0,94–1,30× |

Giải thích khớp số, theo từng bước (đọc `preview.tsx` ~3609
`forwardStep` + `lib/playheadPacing.ts` `PREVIEW_DT_CAP_S = 2`,
`clampPreviewDt`):

1. **Teleport #1 ngay khi bấm phát:** sau `patchClip` + seek về
   0, main thread đã bận dựng frame nặng (lớp fx) nên tick rAF
   đầu tiên sau khi phát thấy gap ≥2s → dt bị clamp đúng 2s →
   `forwardStep` bước playhead +2,00s trong 1 tick. a.ph =
   2,00–2,02 ở 11/12 slot combo không đóng băng (run3 s1c
   a.ph=3,60: có thể 2 lần clamp cộng dồn trước khi mẫu `a`
   kịp đọc, hoặc gap >2s lặp lại — không phân biệt được từ
   trace này, ghi rõ).
2. **Teleport #2 trong ~0,3s đầu cửa sổ:** tick tiếp theo lại
   stall ≥2s (frame fx tiếp theo) → nhảy thêm +2,00 nữa, mẫu
   trace đầu đã ở ph ≈ 4,00. jump1 = +1,98–+2,02 ở 7/7 slot
   combo run1/run2.
3. **Sau đó chạy ~1,0× bình thường:** steady 0,93–1,06× ở hầu
   hết slot combo (run3 s7c/s9c steady 1,37×: còn teleport
   thêm trong cửa sổ trace — slot đó có nhiều stall).
4. **Slot đóng băng (0,42–0,64×) là mặt còn lại của cùng cơ
   chế:** stall dài tới mức KHÔNG CÓ tick nào chạy trong cửa
   sổ (trace chỉ 1 mẫu, draw 0–0,27 fps) → playhead gần như
   đứng yên, không kịp teleport. Cùng 1 nguyên nhân (stall),
   2 biểu hiện ngược nhau tùy stall dài bao nhiêu và tick nào
   chạy được.

**Trả lời trực tiếp câu hỏi của nhiệm vụ (playhead nhanh hơn
nghĩa là gì):**
- **Frame bị bỏ — ĐÚNG.** Playhead nhảy +2,00s trong 1 tick
  nghĩa là ~2s nội dung (60 frame ở 30fps) không bao giờ được
  vẽ; video seek thẳng tới thời gian mới. Người xem thấy phát
  lại nhảy cóc, không phải tua nhanh mượt.
- **Timestamp sai — KHÔNG.** Giá trị playhead tại mỗi mẫu đều
  nhất quán với cơ chế clamp (a.ph đúng 2,00; steady ~1,0);
  không có mẫu nào cho timestamp vô lý (âm, vượt timeline).
- **Đo sai — KHÔNG.** Tỉ lệ slot 1,5× là trung bình đúng của
  (2 teleport × 2s + ~3s chạy 1,0×) / ~3–5s cửa sổ; công thức
  (b.ph − a.ph)/dt là đúng, chỉ là nó gộp teleport vào tốc độ
  trung bình. Lỗi sẽ là nếu đọc 1,5× như "phát nhanh đều 1,5×"
  — số trace chứng minh không phải vậy.
- **Hệ quả đo:** slot combo đo khác nội dung với slot baseline
  kề (playhead đã qua biên clip 1 sang clip 2 trong cửa sổ —
  trace run1 slot 1 đi tới ph 7,27 trong khi clip 1 chỉ tới
  4s). Tỉ lệ FPS vẫn là lần vẽ / giây wall-clock, nhưng tính
  so sánh từng cặp slot bị giảm (giống M1 §3.2).

### 3.4 Fixture 60fps headed — N10 thêm 3 lần, gộp với M1 thành n=8

Fixture `interlaced720-60fps.mp4` (testsrc2 1280×720, 60fps, 5s,
h264). Deint-only vs baseline, slot xen kẽ [B,D,…].

| Lần | Thời gian (UTC) | Tải 1-phút | Baseline mean | 5 tỉ lệ drift-corrected | Deint mean | Kết quả |
|---|---|---|---|---|---|---|
| run1 | 03:12–03:14 | 10,7 → 10,3 | 4,93 fps | 1,29 / 1,23 / 0,97 / 0,56 / 0,70 | **0,95×** | PASS (a) |
| run2 | 03:14–03:16 | 10,3 → 3,4 | 2,05 fps | 1,04 / 0,94 / 1,74 / 1,05 / 0,87 | **1,13×** | PASS (a) |
| run3 | 03:16–03:18 | 3,4 → 0,9 | 1,37 fps | 0,84 / 1,16 / 0,74 / 0,99 / 0,88 | **0,92×** | PASS (a) |

Gộp 60fps (M1 [1,00, 0,88, 0,94, 0,62, 0,73] + N10 [0,95, 1,13,
0,92]): **n=8, median 0,930×, mean 0,896, SD 0,158, CI 95%
[0,764; 1,028], PASS 6/8 (75%).** Cửa sổ 5 lần mới nhất [0,62,
0,73, 0,95, 1,13, 0,92]: median 0,92, 3/5 PASS.

**So với fixture 30fps (pool 20, KHÔNG ĐỔI đợt này):** median
30fps 0,805 / mean 0,844 / CI [0,774; 0,914] / PASS 15/20 (75%).
60fps median cao hơn (+0,125), CI cận dưới nay vượt ngưỡng
(+0,014, M1 là −0,110), nhưng tỉ lệ PASS bằng nhau (75% <
80%). **Kết luận: 60fps KHÔNG cứu được verdict theo tiêu chí tỉ
lệ PASS** — giả thuyết J3 §6.5 vẫn không được ủng hộ theo luật
(b); theo tiêu chí CI thì 60fps nay đạt còn 30fps cũng đạt
(cận dưới +0,024) — hai tiêu chí lệch nhau, cần parent chọn
tiêu chí (như M1 §3.4). Đừng trích chỉ một tiêu chí.

- **D1 cả 3 lần N10: MAD deint-vs-baseline 0,3835 (5,77% đổi),
  hook tap=true** — giống hệt nhau 3/3 lần; khác MAD M1 trên
  cùng fixture (0,4167, 6,93%) — lệch nhỏ, ổn định nội bộ từng
  đợt; có thể do frame mẫu khác lúc snapshot (60fps có nhiều
  frame hơn để chọn). Chỉ chứng minh tap áp thật, không phải đo
  chất lượng khử răng cưa (như M1 §5.7).
- **Playhead deint-only 60fps (15 slot N10): 0,94–1,23×, không
  slot nào vượt 1,3×** — đối chứng sạch, giống M1 (0,85–1,17×).
  Dị thường playhead là đặc trưng của lớp fx/combo, không phải
  của deint, ở cả 30fps lẫn 60fps.
- **Cả 8 lần 60fps đều ở chế độ tải** (baseline 1,37–4,93 fps).
  Câu hỏi "verdict ở chế độ yên" (L3 §7.2) VẪN MỞ cho cả hai
  fixture.

### 3.5 Bảng tổng hợp verdict G1 — gom cho parent/user quyết

| Cửa sổ | Luật (a) 1 lần | Luật (b) median-5 + ≥4/5 | CI 95% mean | Ghi chú |
|---|---|---|---|---|
| Pool 30fps 20 lần (I5+J3+K3+L3) | 15/20 PASS | median 0,805, 15/20 (75%) → CHƯA ĐẠT | [0,774; 0,914], cận dưới +0,024 | không đổi đợt này |
| **60fps 8 lần (M1+N10)** | **6/8 PASS** | **median 0,930, 6/8 (75%) → CHƯA ĐẠT** | **[0,764; 1,028], cận dưới +0,014** | CI nay đạt, tỉ lệ PASS không |
| 60fps cửa sổ 5 mới nhất | 3/5 PASS | median 0,920, 3/5 → CHƯA ĐẠT | — | — |
| **Combo gộp (L3+M1+N10, n=6)** | **3/6 PASS** | **median 0,815 — SD 0,356, không đủ ổn** | **[0,389; 1,137]** | chỉ ghi số, không verdict |

Đề xuất verdict cho parent (N10 chỉ đề xuất, không tự đóng):
(a) **Giữ G1 MỞ** — cả pool 30fps lẫn gộp 60fps đều chưa đạt
luật (b) theo tỉ lệ PASS (cùng 75% < 80%), dù median và CI đều
vượt ngưỡng; (b) nếu parent muốn đóng theo CI thì cả hai cửa sổ
nay đều đủ điều kiện CI — nhưng đó là đổi tiêu chí, cần parent
chọn; (c) câu hỏi chế độ yên vẫn chưa có số (mọi lần N10 đều
baseline <10 fps).

## 4. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Headed hoàn thành (N10) | **14/14 lần có report đầy đủ** (combo ×3, 8 config tách hook, 60fps ×3); 4/4 cases mọi lần (C0/C1/C2/C3) |
| Headed H9 (mọi lần chạy hoàn thành) | **0 lỗi trang** |
| Pixel MAD từng config | giống hệt nhau tới 4 chữ số trong mỗi config (combo 25,6127 ×3; 60fps deint 0,3835 ×3) |
| Pool gộp tính lại (`analyze-n10.py`) | khớp số M1/L3 đã công bố (combo n=6, 60fps n=8) |
| `node --check probe-86n10-config-fps.mjs` | **OK** |
| `tsc --noEmit` | **không chạy** — không chạm file TS nào (chỉ thêm 1 script .mjs + docs) |
| `vite build` | **không chạy** — không đổi code sản phẩm |
| `preview.tsx` / `playheadPacing.ts` md5 | **không đổi** (không sửa production) |
| Lỗi harness trong phiên | CDP timeout 60s ×2, mount timeout 180s ×1, TypeError fallback ×1, VM reboot giết 1 lần retry (xem §6) |

## 5. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — N10 không tự đóng.** Cả hai cửa sổ đều: CI
   đạt, tỉ lệ PASS không (75% < 80%). Đừng trích chỉ một tiêu chí.
2. **Combo n=6, SD 0,356 — không có verdict combo.** Mean 0,763×
   là trung bình của 0,29 và 1,25; đừng trích "combo 0,76×" như
   tốc độ combo.
3. **Tách hook mỗi config n=1.** Kết luận "lớp fx gây teleport,
   enhance không" dựa trên 1 lần/config (5 slot/lần) — mẫu đủ
   để tách (0/5 vs 3–4/5 slot có dấu vân tay +2,00, ranh giới
   rõ), nhưng chưa đủ để định lượng tần suất teleport từng
   config. Chưa tách sâu trong lớp fx (chroma vs LUT vs
   sharpen/noise).
4. **FPS từng config n=1, chế độ tải khác nhau** (baseline
   1,13–9,60 fps). Đừng xếp hạng "hook nào tốn kém nhất" từ
   1 lần đo — gợi ý denoise tốn nhất (§3.2) là giả thuyết,
   chưa phải kết luận.
5. **Mọi lần N10 đều đo ở chế độ tải** (baseline 1,13–9,60 fps;
   loadavg 1-phút lên tới 33,8; 8–10 luồng sibling). Không có
   lần nào ở chế độ yên thật — kết luận về trần 0,65–0,70 ở chế
   độ yên vẫn chưa có số mới.
6. **Slot đóng băng làm mean tỉ lệ vô nghĩa theo từng lần**
   (combo run2: 0,00 và 1,23 trong cùng một lần). Khi trích,
   luôn kèm trung vị tỉ lệ và số slot đóng băng.
7. **Playhead teleport làm slot config đo khác nội dung với slot
   baseline kề** (nhảy qua biên clip). Tỉ lệ FPS vẫn là lần vẽ /
   giây, nhưng tính so sánh từng cặp slot bị giảm.
8. **MAD nhỏ lệch giữa các đợt** (combo 25,6127 vs 25,5939 L3/M1;
   60fps deint 0,3835 vs 0,4167 M1) — ổn định nội bộ từng đợt,
   lệch nhỏ giữa đợt; MAD chỉ chứng minh tap áp thật, không
   phải đo chất lượng khử răng cưa / chất lượng hiệu ứng.
9. **Số đo chỉ đúng trên VM này (CPU-only, 4 vCPU, Chrome
   `--disable-gpu`, Xvfb, 8–10 luồng sibling chạy song song).**
   Không suy ra máy khác; tải sibling là biến số lớn nhất
   (load 1-phút 0,7–33,8; VM reboot giữa lượt).

## 6. Đánh giá harness FPS (nợ M1 §6 + lỗi mới đợt này)

- **Pause fallback store (mới, §2):** bản đầu sai API
  (`st.setState` — state không có setState) → TypeError, hỏng 1
  lần denoise-only. Đã sửa thành `useStore.setState`; nhưng sau
  sửa fallback KHÔNG kích hoạt lần nào (0/154 slot) nên bản sửa
  CHƯA được kiểm chứng bằng chạy thật. Space pause hoạt động ở
  mọi slot hoàn thành đợt này — khác M1 (3 lần lỗi pause). Đề
  xuất giữ fallback (đã sửa) cho luồng sau, và kích hoạt thử
  có chủ đích 1 lần để kiểm chứng.
- **CDP.send timeout 60s (2 lần):** combo-run3 lần 1, deint-
  stabilize lần 1 — main thread starved >60s khi load 1-phút
  vọt (lên 33,8). Retry sau khi tải hạ thì xong. Giới hạn của
  harness dưới tải cực đoan, không phải lỗi sản phẩm.
- **Mount timeout 180s (1 lần):** combo-run3 lần 2 — project mẫu
  + hook không xuất hiện trong 180s lúc tải 1-phút 17,5 và VM
  sắp reboot. Không phải lỗi sản phẩm (lần 3 cùng code mount
  bình thường).
- **VM reboot giữa lượt (~03:25 UTC):** uptime reset, /tmp tmpfs
  bị xoá (vite cfg + TMPDIR của probe — probe tự tạo lại mỗi
  lần nên không mất gì), 1 lần retry denoise-only đang chạy bị
  giết (vite đã lên, chưa tới bước đo). Mọi dữ liệu đo nằm ở
  `hidden_files/` (persistent) nên không mất report nào. Sau
  reboot, tải hạ (1,1) và 5 lần final đều exit 0.
- **Slot đóng băng + roundtrip CDP chậm:** combo run2 slot 1/5
  (0,00 / 0,27 fps), fx-only slot 5 (1 mẫu) — cùng mẫu M1.
  Ghi kèm số slot đóng băng trong mọi verdict sau này (đã làm
  ở §3).
- **Chưa làm (nợ L3 §7.5 vẫn mở):** bọc lỗi trước-try + chống
  false-positive EADDRINUSE cho E1/verdict script. Không làm
  slot 6s / warmup (bằng chứng L3 §6 vẫn đứng).

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER** (xem §3.5,
   phương án (a)/(b)/(c)). N10 chỉ đưa số.
2. **Chế độ yên cần verdict riêng (L3 §7.2, vẫn mở):** cần một
   đợt median-5 mà cả 5 lần baseline ≥10fps (30fps và/hoặc
   60fps). Đợt này không đo được lần yên nào vì 8–10 luồng
   sibling chạy song song suốt phiên (chỉ fx-only-run1 chạm
   baseline 9,60 fps).
3. **Playhead teleport — hướng sửa (mới, §3.3):** lỗi sản phẩm
   thật dưới tải khi bật hiệu ứng nặng — nay đã biết chính xác
   lớp gây ra (chroma/LUT/effects) và dấu vân tay (+2,00s ×2
   đầu cửa sổ). Cần luồng riêng quyết hướng sửa (trần catch-up
   thấp hơn / đồng hồ element làm chủ / tách nhịp phát khỏi
   nhịp vẽ), có đo A/B trước–sau bằng đúng probe này (config
   combo + fx-only làm đối chứng). KHÔNG sửa lặng lẽ trong
   luồng đo.
4. **Tách sâu trong lớp fx (mới):** chroma-only, LUT-only,
   effects-only (sharpen/noise) — mỗi config ×1–2 lần — để
   biết chính xác tầng nào trong lớp fx gây stall ≥1,5s. Probe
   N10 dùng lại được nguyên vẹn (đổi `N10_CONFIG_JSON`).
5. **Harness:** kích hoạt thử pause fallback store 1 lần có chủ
   đích để kiểm chứng bản sửa §2; ghi số slot đóng băng kèm
   mọi verdict; bọc lỗi trước-try cho E1/verdict script
   (L3 §7.5).
6. **FPS từng hook:** mỗi config tách hook mới n=1 — nếu parent
   muốn xếp hạng chi phí từng hook thì đo lại mỗi config ×3
   trong cùng chế độ tải (hoặc chờ cửa sổ yên).
7. **R combing fixture 60fps:** MAD chỉ chứng minh tap áp thật;
   chất lượng khử răng cưa trên nội dung 60fps vẫn chưa đo.
8. TTS / gate / vidstab / kernel / G1-G2 / WebKit / GPU-Safari:
   nợ của các luồng khác — không thuộc N10.

## 8. Cách chạy lại

```bash
# Một config bất kỳ (mỗi lần ~2-4 phút; đổi N10_LABEL mỗi lần):
N10_LABEL=fx-only-run1 N10_FIXTURE=interlaced720.mp4 \
  N10_CONFIG_JSON='{"chromaKey":{"color":"#00FF00","similarity":0.3,"blend":0.1},"filter":{"lut":"vcut-cinematic"},"effects":[{"type":"sharpen","intensity":0.5},{"type":"noise","intensity":0.3}]}' \
  N10_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n10/fx-only-run1 \
  node apps/web/scripts/probe-86n10-config-fps.mjs
# Gộp số (đọc report JSON đã có, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n10/analyze-n10.py
# Chạy lại cả loạt (đã chạy xong — chỉ dùng khi cần đo thêm):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n10/run-all.sh
```

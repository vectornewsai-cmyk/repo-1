# PHASE9_ROUND101_C4_BLUR_LIMITS.md — Blur parity đợt 101, luồng C4

**Ngày:** 12–13/11/2026. **Luồng:** C4 (Phase 9 đợt 101). **Chủ đề:** B-band, D floor,
cap D r7, presented mislabel −1 (nợ LIMITS gộp đợt 100 §4 mục 6).

**Build:** pre-fix `a6e34691` (wk r21–r24 + chr r16; chr r15 lai 94ee64c0→a6e34691
giữa chừng); post-fix `07f56792` (chr r17–r19 + wk r25–r26, pad-oldest đã land).
**Kết quả lớn nhất đợt này:** fix pad-oldest đã triệt D floor trên mẫu mới
(pre 28/1547 → post 0/867, Fisher p=3,6e-06); B-band chốt không bimodal (n=180);
coupling ghost−1/presented−1 chốt ở mức ý nghĩa thống kê (Fisher p=0,0063) nhưng
hướng −1 (so với +4 alias) vẫn chỉ là suy luận cơ chế, không chứng minh được
bằng strip.

---

## §0. Bối cảnh chạy

- **Reboot #25 ~23:51Z 12/11** (boot 66fb273d → 3a12a7d3): WebKit mất 22 lib
  (`libevent-2.1.so.7` …), 4 run wk đầu tiên exit=2 sau ~7s. C4 cài lại deps
  (`install-deps webkit` sau `apt-get update` qua azure mirror): 22 → 4 lib thiếu
  (cùng 4 lib như B9: libwebkitgtk-6.0, libjavascriptcoregtk-6.0 trong bundle,
  libbacktrace, libjxl lazy/optional). Chạy lại wk r21–r24 exit 0.
- **chr r15 là run lai:** preview.tsx đổi md5 94ee64c0 → a6e34691 lúc 00:07:56Z
  giữa chừng (sibling chưa xác định); blend math + curPix markers đã verify còn
  nguyên trên a6e34691. r16 hoàn toàn a6e34691.
- **wk r26 lần 1 timeout** (EVAL_TIMEOUT_60000ms, playhead kẹt 90s, load 2,30);
  chạy lại exit 0, 91 caps. Kẹt playhead wk thỉnh thoảng xảy ra — theo dõi, chưa
  phải blocker.
- **KHÔNG chạy blind** (đúng nhiệm vụ C4; giữ nguyên kết luận A5 về cửa sổ mù).
- Dữ liệu thô + script: `hidden_files/round101-c4/` (`analysis101c4.txt/.json`,
  `analysis101c4-postfix.txt/.json`, `alias101c4.py`, `alias101c4b.py`,
  `background101c4.py`, `harmonic101c4.py`, `sim101c4.py`, `sim101c4b.py`,
  `driver101c4*.sh`, `driver101c4-postfix*.sh`).

---

## §1. B-band — KHÔNG bimodal (CHỐT mục 1)

WebKit gộp r4–r24: **n=180/671** (C4 thêm 48), mean 0,765, med 0,768, sd 0,015,
dải 0,714–0,788. Pair-like [0,70–0,76): n=75 (42%, mean 0,751); dc-like
[0,76–0,82]: n=105 (58%, mean 0,776). Histogram bin 0,005 liên tục dày ở
0,745–0,790, không có khe trống nào giữa hai nhóm. 2-means: cụm1 n=83 mean 0,752
sd 0,011 (0,714–0,764) vs cụm2 n=97 mean 0,777 sd 0,006 (0,765–0,788);
**khe giữa hai cụm 0,0005** (B4: 0,0019 — khe THU HẸP khi thêm dữ liệu, ngược
hướng bimodal), tách 1,66σ. **Kết luận: B-band không phải do 2 mode — chốt.**

- Tín hiệu một phía duy nhất còn đứng: **ringSize=1 → pair-like 15/15**
  (C4 thêm 3/3, mean 0,743; A5 3/3, B4 5/5). Không có ngoại lệ nào.
- Phase 4 → dc-like 20/31 (65%) — chết hẳn làm quy tắc (B4: 17/27 = 63%).
- Chromium đối chứng gộp r6–r16: B n=261, mean 0,770, med 0,773, sd 0,011;
  pair-like 43 / dc-like 218.
- Hậu pad-oldest (§2): wk B post-fix n=35, mean 0,771, med 0,772, sd 0,008
  (hẹp lại so với pre 0,015), pair-like 7/35 (20%, pre 42%); chr B post-fix
  n=210, mean 0,773, sd 0,008, pair-like 23/210 (11%, pre 16%). B-band trung
  bình không đổi (~0,77); đuôi pair-like hẹp lại sau khi pad gỡ nhóm
  pair-đói-ring — nhưng pair-like pre-fix chỉ 15/75 là ringSize=1 nên cấu
  trúc trong B-band CHƯA giải thích hết (nợ §6).

---

## §2. D floor — xác nhận 1,5% rồi TRIỆT bằng pad-oldest

### 2.1. Pre-fix: sàn 1,5% được xác nhận, pattern rõ

- Chromium: **D 13/876 = 1,48%** (B4: 12/783; C4 mới **1/93 = 1,1%**, mean
  0,305). WebKit: D 15/671 = 2,24%. A/C ổn định: chr A n=531 mean 0,439,
  C n=71 mean 1,000; wk A n=188 mean 0,439, C n=288 mean 0,998.
- Cap D mới duy nhất của C4: **chr-blur-r16 c2 fi=12, g=0,305, gap 5,
  ringSize=1, prev=−1, relPlay 8596** (đầu clip c2 — đói ring đầu clip).
- Pattern 13 ca D chr: **13/13 là pool=1** (ringSize=1 ×10; ringSize=2 +
  skipped=1 ×3); **10/13 prev=−1**; **10/13 fi≤19** (đói ring đầu clip);
  2 ca giữa clip dưới tải nặng (r13 c1 fi=69 + c2 fi=38, load 11,72 — pump
  đói); 1 ca r16 fi=12 đầu c2. **Pre-fix, pool=1 KHÔNG BAO GIỜ ra A: 0/44**
  (chr 0/15, wk 0/29) — pair blend của 2 khung khác nhau không thể ra A.
- Gaps các ca D: 2 ×4, 4 ×1, 5 ×1 (mới r16), 6 ×1 (r7), 7 ×1, 8 ×1, 10 ×1,
  14 ×2, 17 ×1. 8/13 là "dị thường" (gap≥4 hoặc pred lệch >0,05).

### 2.2. Cap D r7 — vẫn mở, nhưng đã thu hẹp

- r7 (chr-blur-r7 c0 fi=9, gap 6, ringSize=2, skipped=1, g=0,307; model
  harmonic gap 6 → 0,549): bảng harmonic mở rộng (a=1,41) cho thấy **không
  gap nhãn nào trong các ca D kiểu r11 (4, 7, 8, 10, 14, 17) dự đoán ra D**
  (pair gap 4 → 0,892; 7 → 0,375; 8 → 0,769; 10 → 0,715; 14 → 0,847;
  17 → 0,794) — nên các cap D đó KHÔNG giải thích được bằng gap nhãn.
- Alias ±5 cho ứng viên cặp nội dung: với r7, ghost 7/current 9 hoặc ghost
  3/current 5 đều cho gap 2 → D ✓ — nhưng **không có strip nào cho r7**
  (chạy trước khi có ghostPix/curPix instrumentation) nên không quyết được.
- Không thêm cap r11-style mới (gap≥7 vẫn 6 ca); không thêm cap gap-6 mới
  (r7 vẫn là ca duy nhất). r7 giữ nguyên trạng thái MỞ, nhưng nay đã rõ:
  nó là 1 ca duy nhất trong 876, không ảnh hưởng kết luận chung; chỉ còn
  cách chạy lại probe có instrumentation trên build cũ (không đáng — build
  cũ đã qua).

### 2.3. Cơ chế + fix pad-oldest (đã land)

- **Đọc alpha plan thật** (mục B4 ghi "chưa ai làm" — nay đã làm):
  `motionBlurBlendPlan(weights, ghostCount)` chuẩn hoá weights trên cửa sổ
  thực dùng; `compositeMotionBlurLayer` (preview.tsx): skipLatest khi
  `lastCaptured == presented`, plan từ `ghostPool.length`, `plan.length < 2`
  → null (vẽ trực tiếp); `presentedFrameIndex` ngoại suy từ
  `lastPresentedFrameIdx + floor((now − lastExpectedDisplayTime)/frameDur)`.
  Render: `server/render/src/motion.js` phát `tmix=frames=n:weights=...`
  thuần, KHÔNG pad đầu (tail fix chỉ khi có interpolation).
- **Thí nghiệm ffmpeg tmix (đo thật, /tmp/tmix101c4):** `tmix=frames=3`
  trên stripes-scroll 1280×720/30fps/90 frame: out[0] == F0 chính xác
  (MAD 0,00); out[1] == (2·F0+F1)/3; out[i≥2] == mean(F_{i−2},F_{i−1},F_i).
  **Render CLONE frame đầu để lấp cửa sổ, KHÔNG co lại thành pair** —
  preview cũ co cửa sổ chính là chỗ lệch preview/render ở đầu clip.
- **Fix (đợt 101 C4, đã land):** trong `compositeMotionBlurLayer`, khi
  `ghostPool` ngắn hơn `weights.length−1`, lặp snapshot CŨ NHẤT cho đủ
  frames−1 ghost (plan giữ nguyên triple — ghost cũ vẽ 2 lần, như tmix
  clone frame đầu). Dự đoán harmonic: cặp gap-2 {ghost,ghost,current} →
  0,449 (đúng dải A) thay vì pair 0,307 (dải D); gap 4/8/10/14/17 → 0,75–0,91
  (dải B); gap 7 → 0,486. Ring thật không đổi (ringSize ghi vẫn =
  `arr.length`); số ghost clone ghi vào stash/debug state mới
  `lastDrawnPaddedGhosts`. Pool rỗng giữ hành vi cũ (null → vẽ trực tiếp).
- **Code đổi:** `apps/web/src/preview.tsx` (pad trong
  `compositeMotionBlurLayer` + import `motionBlurPadGhostCount` + field
  `lastDrawnPaddedGhosts` trong `MotionBlurDebugState` + stash + 2 điểm
  khởi tạo), `apps/web/src/lib/previewEngine.ts` (hàm thuần mới
  `motionBlurPadGhostCount`), `apps/web/src/lib/previewEngine.test.ts`
  (2 test mới: pad count + plan pair→triple).
- **Kiểm chứng:** `previewEngine.test.ts` **27/27 pass** (2 test mới pass);
  `tsc --noEmit` (apps/web) **0 lỗi**; `vite build` **pass 6,05s**.
  md5 preview.tsx: a6e34691 → **07f56792**.

### 2.4. Post-fix: D floor bị triệt trên mẫu mới — CLAIM GIẢM

5 run trên build 07f56792 (mtimeChanged=False tất cả): chr r17–r19 + wk
r25–r26 (r26 chạy lại 1 lần sau timeout, exit 0):

| engine | cap dùng | D post | D pre | Fisher (một phía) |
|---|---|---|---|---|
| chr | 688 | **0/688 (0,00%)** | 13/876 (1,48%) | p=5,1e-04 |
| wk | 179 | **0/179 (0,00%)** | 15/671 (2,24%) | p=0,028 |
| gộp | **867** | **0/867** | 28/1547 | **p=3,6e-06** |

- 0/867 → 95% CI trên (rule of three) = **0,35%** — dưới xa sàn cũ 1,5%.
- Pool=1 post-fix: 14 ca (chr 8: B 7, C 1; wk 6: C 3, B 2, A 1), **D 0/14,
  A 1/14** (pre: D 9/44, A 0/44; Fisher D p=0,067 — mẫu nhỏ, không tự đứng;
  kết luận dựa vào D gộp). **ringSize=1 & band B post-fix: wk 2 ca, mean
  0,777, pair-like 0/2** (pre 15/15 pair-like) — tín hiệu pair-like của
  ring đói BIẾN MẤT, đúng cơ chế pad.
- A chỉ xuất hiện 1/14 pool=1 — đúng dự đoán: chỉ cặp nội dung gap-2 mới
  cho A sau pad; đa số ghost đói là gap lớn (4–17) nên pad triple rơi vào
  B/C (bảng pad-oldest §2.3). Không có cap ngoài dải nào post-fix.
- **Claim: D floor do cơ chế pair-đói-ring đã bị triệt trên mẫu mới
  (867 cap).** Dư địa: sàn D còn lại (nếu có, từ cơ chế khác chưa biết)
  <0,35% — cần mẫu post-fix lớn hơn để loại trừ hẳn (§6).

---

## §3. Presented mislabel −1 — chốt coupling, hướng −1 vẫn là suy luận

### 3.1. Coupling ghost−1 / presented−1: CÓ ý nghĩa thống kê (chốt)

Tiêu chí singleton (span-3), các ca GHOST-1 (5c2) gộp B4+C4, 48 ca:

- Quyết định được (singleton −1/+1/sạch): **23 ca: presented −1: 10,
  +1: 4, sạch: 9 → −1 = 43%.**
- Nền wk (mọi blend tick có curPix, n=467): singleton −1 49/467 = 10,5%
  (trong 656 tick gộp: −1 58, +1 74, sạch singleton 209, multi 81, khác 224,
  không khớp 10). Trong các tick nền quyết định được: −1 49/244 = 20%.
- **Fisher một phía (nhóm rời nhau): ghost−1 10/23 vs nền 39/221:
  p=0,0063** (B4 riêng: 5/12 vs nền, p=0,0495). → Coupling là thật ở mức
  ý nghĩa thống kê, không còn là p=0,067 như B4.
- Lưu ý: presented là nhãn tốt hơn trên chr (19/26 ca quyết định được,
  73% — giữ nguyên B4); mislabel là thật (nhãn thường vắng khỏi tập khớp),
  chỉ độ lớn/hướng của nó là vấn đề (§3.2).

### 3.2. Hướng −1 (so với +4 alias): strip KHÔNG quyết được

- Alias-aware (span-8) trên 48 ca (5c2): chỉ **3 ca pin −1 duy nhất**
  (wk-blur-r17 c0 fi=40, c2 fi=46; wk-blur-r24 c2 fi=22); **15 ca mơ hồ
  −1/+4**; 30 ca khác. Trong 15 ca "−1 THẬT" lỏng (span-3), 12 ca trở
  thành mơ hồ với pres+4 khi mở span-8.
- Strip 48-bit có chu kỳ ~5 (frame f và f+5 thường giống hệt: d=5, 71/85
  cặp h=0) — **strip không phân biệt được −1 với +4**. Hướng −1 (thay vì
  +4) chỉ suy từ tính hợp lý cơ chế: jitter presented↔currentTime là ±1–2
  (B2); lệch +4 (trình chiếu chạy trước nhãn 4 frame) là phi lý. Đây là
  giới hạn cứng của phương pháp strip 48-bit, không phải của dữ liệu.
- Ghost side cũng mơ hồ tương tự (tập span-8 của ghost thường 4–5 frame).

### 3.3. Đính chính ca r15 c1 fi=8 (B4 ghi là chr — SAI, là wk)

- Ca này là **wk-blur-r15 c1 fi=8** (A5 đợt 99), g=0,304, band D, ringSize=1,
  last=6, pres=8, gap 2 — KHÔNG phải chr như LIMITS B4 ghi (§1b/§5 của B4).
- Ghost strip (nhãn 6, 1280×720): span-3 khớp duy nhất **[5]** (h(nhãn 6)=24
  — nửa strip khác, loại trừ hẳn frame 6); span-8 khớp **[0, 5, 10, 14, 15]**
  (h=0 cho cả 5 frame). Nội dung ghost ≡0 (mod 5), gần nhãn nhất là 5 (−1).
- Probe A5 chưa ghi curPix cho tick này nên **presented−1 KHÔNG
  strip-chứng-minh được**; nhưng là suy luận duy nhất hợp lý: cặp nội dung
  (5,8) gap 3 → harmonic 0,586 (dải B), trong khi đo được D 0,304 — chỉ
  (5,7) gap 2 → 0,307 mới giải thích được D nếu ghost thật là 5. Lưu ý:
  cặp NHÃN (6,8) gap 2 cũng giải thích được D — ca này nhất quán với giả
  thuyết presented−1 nhưng không tự nó chứng minh giả thuyết.
- "thậtGhost=[5]" trong simulate.txt của A5 là suy luận mô phỏng offline,
  không phải đo strip — và mô phỏng offline đã được chứng minh không tái
  tạo được giá trị g live (§4), nên không dùng làm bằng chứng độc lập.

---

## §4. Caveat phương pháp: strip aliasing (chu kỳ ~5) + mô phỏng offline là ngõ cụt

- **Strip 48-bit mơ hồ:** hàng giữa, x 256–303, kênh G>128. Frame f và f+5
  rất thường có strip giống hệt (d=5: mean hamming 4,0, 71/85 cặp h=0;
  cả d=1: 15/89 h=0; d=4, 9, 10, 14, 15, 19, 20 đều có va chạm; 379 cặp
  h=0 với d≤20). Một match singleton trong cửa sổ ±3 KHÔNG pin được một
  frame — nội dung thật có thể là nhãn±5k. Mọi verdict "SẠCH / LỆCH THẬT"
  dùng tiêu chí singleton span-3 trước đây phải đọc lại: chúng quyết được
  "nhãn KHÔNG phải nội dung" (khi h(nhãn) lớn, vd h=24/48) nhưng KHÔNG
  quyết được nội dung chính xác là frame nào. **Quy tắc mới: mọi kết luận
  về frame-đích dùng span-8 + ghi rõ tập alias.**
- **Mô phỏng offline từ frame tham chiếu là ngõ cụt** (xác nhận lại A5):
  pair mean offline không tái tạo giá trị live (gap 3 offline 0,343 vs live
  0,586; gap 6 0,707 vs 0,549; gap 18 0,707 vs 0,965; pair g offline biến
  động rất lớn theo frame bắt đầu, sd tới 0,35, vs live D sd 0,001).
  Nghi do downscale/moiré + khác biệt decoder. Không dùng sim offline để
  suy ra ghost/presented thật nữa.

---

## §5. Alpha plan thật (đã đọc — mục B4 ghi "chưa ai làm")

- `motionBlurBlendPlan(weights, ghostCount)`: chuẩn hoá weights trên cửa sổ
  thực dùng (cửa sổ = `weights.length−1−ghosts` cuối, chuẩn hoá tổng 1;
  alpha chạy).
- `compositeMotionBlurLayer` (preview.tsx ~2507–2590): skipLatest khi
  `lastCaptured == presented` (bỏ snapshot mới nhất khỏi tập ghost); plan
  từ `motionBlurBlendPlan(weights, ghostPool.length)`; `plan.length < 2` →
  null (vẽ trực tiếp); ghost = `ghostPool` cuối (nay là `blendPool` đã
  pad-oldest); blend math đã verify còn nguyên trên cả 2 build đợt này.
- `presentedFrameIndex`: ngoại suy `lastPresentedFrameIdx +
  floor((now − lastExpectedDisplayTime)/frameDur)`; khi không có pump thì
  trả `frameIdx` (giải thích pres==exp trên wk, silentEngine=true).
- Đường plain-blend vẽ `snap ?? drawSrc`; `drawSrc` mặc định là video
  element khi không có effect/LUT/interpolation — frame "hiện tại" trong
  blend là frame video element đang trình chiếu.
- Render: `tmix=frames=n:weights=...` thuần, không pad đầu (tail fix chỉ
  khi có interpolation) — chính chỗ lệch đã vá bằng pad-oldest (§2.3).

---

## §6. Nợ còn lại

1. **D floor:** cần mẫu post-fix lớn hơn để loại trừ sàn dư <0,35%; cơ chế
   D khác (nếu có) chưa biết. Pad-oldest chỉ vá đúng cơ chế pair-đói-ring.
2. **r7:** vẫn mở — không có strip data (chạy trước instrumentation); là 1
   ca duy nhất trong 876, không ảnh hưởng kết luận chung.
3. **presented −1 vs +4:** strip 48-bit không phân biệt được; cần strip dài
   hơn (vd 96 mẫu hoặc 2 hàng) hoặc đo trực tiếp presented — chính là vấn
   đề B2 đang nghiên cứu. Hướng −1 hiện chỉ là suy luận cơ chế.
4. **B-band cấu trúc trong:** pair-like còn lại sau pad (wk 7/35, chr
   23/210) chưa giải thích hết; ringSize=1 chỉ giải thích 15/75 pair-like
   pre-fix.
5. **wk r26 lần 1 timeout** (playhead kẹt 90s) — chạy lại exit 0; theo dõi
   tần suất kẹt playhead wk.
6. Các nợ ngoài phạm vi C4 (giữ nguyên từ LIMITS gộp đợt 100 §4): G1
   deinterlace (chờ user quyết metric G5/M2), EPERM probe #20 + khoảng mù
   #19, birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), WebKit clip D / pre-pass keyframes /
   motion blur + mask / trackgeq / fallback / harness O8.

---

## File đổi/thêm (đợt 101 C4)

- `apps/web/src/preview.tsx` — pad-oldest trong `compositeMotionBlurLayer` +
  `lastDrawnPaddedGhosts` (md5 a6e34691 → 07f56792).
- `apps/web/src/lib/previewEngine.ts` — hàm thuần mới `motionBlurPadGhostCount`.
- `apps/web/src/lib/previewEngine.test.ts` — 2 test mới (27/27 pass).
- `apps/web/scripts/probe101c4-frame-parity.mjs` — probe copy (đợt 101).
- `docs/PHASE9_ROUND101_C4_BLUR_LIMITS.md` — file này.
- Không push GitHub, không release/tag (giữ release gate).

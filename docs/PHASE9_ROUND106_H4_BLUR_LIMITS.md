# PHASE9_ROUND106_H4_BLUR_LIMITS.md — Blur B-band c0, đợt 106, luồng H4 (late merge)

**Ngày:** 13/11/2026. **Luồng:** H4 (Phase 9 đợt 106). **Chủ đề:** Blur B-band c0
+ thành phần content cụm A stripes + lệch g triple.
**Bối cảnh:** xem docs/PHASE9_ROUND105_G7_BLUR_LIMITS.md (§2, §7 mục 1–3)
và prereg `hidden_files/round106-h4/round106-h4.md` (viết TRƯỚC mọi lượt probe).

**Luồng H4 gốc bị reboot #33 (14:50:59Z) cắt ngang trước khi viết LIMITS/batch,
nhưng dữ liệu thô ĐÃ CÓ trên đĩa. File này là late merge: mọi số B-band,
D floor, weights, strip dưới đây được tính lại ĐỘC LẬP từ dữ liệu gốc
(script `hidden_files/round106-h4/analyze106h4.py`, KHÔNG dùng lại
script/kết quả của H9) — và KHỚP 100% với headline H9 đã cứu được
(docs/PHASE9_ROUND106_H9_VERIFY_LIMITS.md §2.4), nên headline đó được
xác nhận, không phải copy mù.**

**Kết quả lớn nhất đợt này:**
- **B-band c0: VẪN MỞ — KHÔNG ĐẠT bar.** Gộp F6+G7+H4: c0 5/72 (6,9%) vs
  c2 2/54 (3,7%), Fisher một phía **p=0,3545** (hai phía p=0,6978) —
  tệ đi so với G7 (p=0,22): H4 thêm 31 B-cap c0 nhưng chỉ 1 pair-like,
  trong khi c2 thêm 18 B-cap với 1 pair-like. Hiệu số +3,2pp, 95% CI
  Newcombe [−6,4pp, +12,0pp] — vẫn bao 0. Còn thiếu **c0 43 / c2 61 B-cap**
  tới ~115/nhóm. Power tại hiệu ứng gốc (17,1% vs 6,1%): normal-approx
  59%, Fisher-exact (mô phỏng 20.000 lần) 53%; tại hiệu ứng quan sát chỉ
  18% — mẫu vẫn thiếu power để kết luận "không có hiệu ứng".
- **Cờ heterogeneity HẾT Ý NGHĨA.** c0-only vs c0 3-clip gộp G7+H4:
  4/39 vs 1/33, Fisher hai phía p=0,3662 (G7: 4/24 vs 0/17, p=0,13).
  H4 riêng: c0-only 0/15 vs c0 3-clip 1/16 — cờ G7 đã loãng hẳn, 2 thiết
  kế vẫn gộp được theo prereg.
- **D floor gộp: 0/2371** (0/2041 + H4 0/330); Fisher vs pre-fix 28/1547:
  p=4,32e-12; 95% CI trên (rule of three) 0,127%.
- **Cụm A stripes: KHÔNG ĐO ĐƯỢC bằng strip — vẫn mở.** Kiểm chứng
  feasibility offline: strip 48 byte G trên frame tham chiếu stripes
  (90 PNG) có second-nearest MAD min/med/max = 0,00/0,00/0,04 — **90/90
  frame có second-nearest < 30** (bar G7 ≥30), 968 cặp frame gần như
  trùng nhau (MAD<1): pattern stripes tuần hoàn, strip không nhận diện
  được frame. Bar (a) prereg (≥8 sự kiện blend phân biệt có content gap
  đo được) và bar (b) "trong ±1" đều KHÔNG áp được cho stripes. Giả
  thuyết dẫn đầu của E6 (triple liên tiếp khỏe mạnh + nhãn rải rác) vẫn
  CHƯA được chứng minh hay bác bằng strip; bằng chứng phụ duy nhất vẫn
  là F6 clock timing (10/10 ca A rVFC content gap 6).
- **Weights cụm A: KHÔNG giải thích được g≈0,44.** Hồi quy trọng số
  blend trên 48 triple phân biệt (noise r38, đường rVFC): w trung bình
  ≈ [1/3, 1/3, 1/3] ở mọi filter (BILINEAR [0,326, 0,336, 0,338],
  NEAREST [0,335, 0,327, 0,338], BOX [0,329, 0,333, 0,338]) nhưng fit
  YẾU — R² median 0,156 (BILINEAR) / −0,185 (NEAREST) / 0,096 (BOX).
  Tách riêng 43 triple thuần phân biệt: g_live 0,625 (dải 0,614–0,640)
  vs dự đoán triple đều 0,596 → lệch **+0,029**; 5 pad-clone {a,a,b}:
  g_live 0,769 vs dự đoán 0,741 → lệch +0,028, cùng hướng. Trọng số
  đều dự đoán g≈0,59–0,60 cho triple phân biệt — không phải 0,44 — nên
  weights KHÔNG phải lời giải cho cụm A; lệch g +0,03 vẫn chưa giải
  thích được (nhất quán G7 §4).

**Build:** probe chạy trên `8ae149a1` (lượt r39 đầu, trước khi H5 sửa
comment) rồi `ced42efd` (r39c0, r40c0, r40; md5 hiện tại vẫn `ced42efd`).
F3 tap+relabel TẮT trong mọi lượt (baseline C4/D4/E6/F6). **Không sửa
production trong luồng này** (chỉ thêm probe + analyzer + LIMITS này).
Không push GitHub, không release/tag, không TTS 39, không birefnet.

---

## §0. Bối cảnh chạy (late merge)

- **4/5 lượt probe theo prereg đã xong, đều exit 0; lượt 5 chết do
  reboot.** Boot lúc bắt đầu 75697729-9014-47e0-a0cc-c1aad4926fe5
  (14:31:52Z). Reboot #33 lúc **14:50:59Z** cắt ngang lượt r41c0 đúng
  lúc đang chờ yên trước phát (load1 5,3–8,5) — thư mục
  `chr-blur-r41c0/` chỉ còn `vite-attempt1.log`, **không có
  `frame-parity-results.json` → lượt này bị LOẠI hoàn toàn, không ước
  lượng bù, không chạy lại** (nhiệm vụ late merge cấm probe live mới).
  Lượt 6–7 prereg (r41, r42) không chạy. Boot hiện tại (sau #33):
  63a52041-cdb6-4824-bb17-32c8f5aba5ee.
- **Đổi build giữa lượt r39 (luồng H5):** `preview.tsx` đổi md5
  `8ae149a1` → `ced42efd` lúc 14:43:56Z, giữa lượt chr-blur-r39
  (`mtimeChanged=true`). Đây là sửa comment (H5, 0 dòng code — xem
  docs/PHASE9_ROUND106_H5_GHOST_LIMITS.md). Vẫn gộp theo prereg vì
  probe tắt F3 nên chế độ đo không đổi; ghi rõ là lượt "lai".
- **Tải lúc phát:** r39 load1 6,40 (chờ yên 120s không xuống — lượt
  này có thể nhiễm tải, ghi rõ); r39c0 1,92; r40c0 1,25; r40 1,67.
  Một luồng khác chạy probe104f5 webkit (F5) song song — các lượt H4
  chỉ dùng chromium để tránh tranh chấp engine.
- **Dữ liệu thô + script:** `hidden_files/round106-h4/` (prereg
  `round106-h4.md`; `driver106h4.sh/.log/.out`; `probe106h4` bản trong
  repo; `strip106h4-feasibility.py/.txt/.json`;
  `weights106h4.py/.txt/.json`; `analyze106h4.py` + `analysis106h4.json/.txt`
  — bản tính lại độc lập của late merge này).

| lượt | engine | config | cap thô | cap dùng* | pumpN | blendTickN | ghi chú |
|---|---|---|---|---|---|---|---|
| chr-blur-r39 | chr | scroll-blur | 98 | 80 | 99 | 99 | lai build (H5 sửa comment giữa lượt); load 6,40 |
| chr-blur-r39c0 | chr | scroll-blur, `--nclips 1` | 28 | 21 | 29 | 29 | toàn c0; load 1,92 |
| chr-blur-r40c0 | chr | scroll-blur, `--nclips 1` | 37 | 33 | 42 | 43 | toàn c0; load 1,25 |
| chr-blur-r40 | chr | scroll-blur | 224 | 196 | 231 | 316 | load 1,67 |
| chr-blur-r41c0 | chr | scroll-blur, `--nclips 1` | — | — | — | — | **chết do reboot #33, LOẠI** |

\* "cap dùng" = cap có baseline noblur cho (clip, frameIdx); cap còn lại
bị loại khỏi phân tích band (r39: 18, r39c0: 7, r40c0: 4, r40: 28) —
cùng quy tắc G7, không phải lỗi dữ liệu.

---

## §1. B-band c0 — kiểm chứng gộp: KHÔNG ĐẠT bar, còn thiếu nhiều mẫu

Phương pháp: ĐÚNG phương pháp G7 §B (baseline noblur W3/Z5 theo
(clip, frameIdx); g = std(cap px 96×54)/baseline; BANDS D [0,27–0,34],
A [0,40–0,50], B [0,70–0,82], C [0,95–1,05]; pair-like = B-cap có g
trong [0,70–0,76)). Gộp với số đã công bố F6+G7 (prereg §1).

| lượt | B n | c0 (n, pair-like) | c1 | c2 (n, pair-like) |
|---|---|---|---|---|
| F6+G7 (cũ, đã công bố) | 119 | 41 (4) | 42 (4) | 36 (1) |
| chr-blur-r39 (3-clip) | 17 | 5 (0) | 11 (2) | 1 (0) |
| chr-blur-r39c0 (1-clip) | 4 | 4 (0) | — | — |
| chr-blur-r40c0 (1-clip) | 11 | 11 (0) | — | — |
| chr-blur-r40 (3-clip) | 37 | 11 (1) | 9 (0) | 17 (1) |
| **H4 mới** | **69** | **31 (1)** | **20 (2)** | **18 (1)** |
| **Gộp F6+G7+H4** | **188** | **72 (5 = 6,9%)** | **62 (6)** | **54 (2 = 3,7%)** |

- **Fisher một phía (c0>c2) gộp: p=0,3545 — KHÔNG ĐẠT bar p<0,05**
  (hai phía tham khảo: p=0,6978). Tệ đi so với G7 (p=0,22): tỉ lệ
  pair-like c0 tụt từ 9,8% xuống 6,9% khi thêm mẫu mới — đúng hướng
  "hiệu ứng post-hoc thường co lại khi thêm mẫu", nhưng mẫu vẫn thiếu
  power nên KHÔNG kết luận "không có hiệu ứng": hiệu số +3,2pp, 95% CI
  Newcombe [−6,4pp, +12,0pp] bao cả 0 lẫn hiệu ứng gốc (+11pp).
- **Power:** tại hiệu ứng gốc post-hoc (17,1% vs 6,1%) với n=72/54:
  normal-approx **59%** (G7: 46%), Fisher-exact mô phỏng 20.000 lần
  (seed 20261113) **53%**. Tại hiệu ứng quan sát (6,9% vs 3,7%):
  normal-approx chỉ **18%**. Cỡ mẫu cần cho 80% power Fisher vẫn
  ~115/nhóm. **Còn thiếu: c0 43, c2 61 B-cap.** Với lượt c0-only
  (~15 B-cap c0/lượt đợt này — thấp hơn 24 của G7 do r39c0 chỉ 4 B)
  cần ~3 lượt nữa cho c0; c2 cần ~4 lượt 3-clip nữa (18 B/lượt đợt này).
- **Thiết kế c0-only:** r39c0 cho ít B hơn kỳ vọng (4 B/21 cap dùng,
  so với 24 B/78 cap của G7 r37c0) — biến thiên giữa lượt lớn; r40c0
  cho 11 B/33 cap. Trung bình 2 lượt c0-only đợt này: 7,5 B-cap/lượt,
  vẫn hơn lượt 3-clip về c0 (r39: 5, r40: 11 — r40 cao nhờ lấy mẫu dày,
  196 cap dùng).
- **Lưu ý:** chr-blur-r40 lấy mẫu rất dày (224 cap thô) nên band A
  phình to (155/196 = 79% A) — đó là triple liên tiếp khỏe mạnh
  (g≈0,449 stripes) khi tick dày, KHÔNG phải cụm A r7. Đừng đọc số A
  này như "cụm A tăng" (cùng cảnh báo G7 §2).

---

## §2. Cờ heterogeneity c0-only vs c0 3-clip — hết ý nghĩa

| pool | c0-only (pair-like/n) | c0 3-clip (pair-like/n) | Fisher hai phía |
|---|---|---|---|
| G7 (đã công bố) | 4/24 (16,7%) | 0/17 (0%) | p=0,13 |
| H4 riêng | 0/15 (0%) | 1/16 (6,3%) | p=1,0 |
| **Gộp G7+H4** | **4/39 (10,3%)** | **1/33 (3,0%)** | **p=0,3662** |

Lệch G7 lo ngại (c0-only giàu pair-like hơn) đã loãng hẳn khi thêm
mẫu H4 — H4 riêng thậm chí ngược hướng (0/15 vs 1/16). **Kết luận:
không còn dấu hiệu 2 thiết kế không hoán đổi được; vẫn gộp pool theo
prereg.** Theo dõi tiếp ở đợt sau, nhưng cờ này không còn là mối lo.

---

## §3. D floor — 0/2371, CI trên 0,127%

| nguồn | cap dùng | D |
|---|---|---|
| Post-fix trước H4 (C4+D4+E6+F6+G7 stripes) | 2041 | 0 |
| H4 stripes (r39+r39c0+r40c0+r40) | 330 | 0 |
| **Gộp post-fix** | **2371** | **0** |

- Fisher một phía vs pre-fix 28/1547: **p=4,32e-12**. 95% CI trên
  (rule of three): **0,127%** (G7: 0,147%). D floor vững hơn sau mỗi
  đợt; không có D nào trong 330 cap H4 (kể cả lượt r39 nhiễm tải).

---

## §4. Thành phần content thật cụm A stripes — KHÔNG ĐO ĐƯỢC bằng strip

### 4.1. Kiểm chứng feasibility offline: strip KHÔNG nhận diện được stripes

Strip 48 byte G trên frame tham chiếu round97-y2/frames-stripes (90 PNG),
tính lại từ `strip106h4-feasibility.json`:

| chỉ số | giá trị | bar G7 (noise) |
|---|---|---|
| second-nearest MAD min / med / max | 0,00 / 0,00 / 0,04 | min ≥30 |
| số frame có second-nearest < 30 | **90/90** | 0 vi phạm |
| số frame đạt quy tắc G7 (nearest < 0,5×second) | 2/90 | — |
| cặp frame gần như trùng nhau (MAD<1) | **968 cặp** | ~0 |
| strip std trung bình | 127,36 (min 126,76, max 127,50) | — |

Nguyên nhân: pattern stripes tuần hoàn mạnh — cùng 1 strip 48 byte xuất
hiện ở nhiều frame cách nhau 5/24/48 frame (phân bố |nearest − f| tập
trung ở 24 và 48; MAD theo khoảng cách k=5 chỉ 21,18, k=1 là 106,01 —
không đơn điệu theo khoảng cách). **Bar ≥30 KHÔNG ĐẠT → strip không
dùng được để nhận diện content stripes.** Đây là kết quả âm của phương
pháp, không phải lỗi dữ liệu: cùng script trên stimulus noise của G7
đạt second-nearest MAD 43–54.

### 4.2. Hệ quả cho bar prereg §3

- **Bar (a) (≥8 sự kiện blend phân biệt có content gap đo được):
  KHÔNG ĐO ĐƯỢC.** Không có sự kiện nào đo được content gap bằng strip
  trên stripes — không phải 0/8 mà là "không áp được thước đo". Giả
  thuyết dẫn đầu của E6 (triple liên tiếp khỏe mạnh + nhãn rải rác) vẫn
  CHƯA được chứng minh hay bác bằng strip.
- **Bar (b) control ("trong ±1"): KHÔNG ĐO ĐƯỢC** với cùng lý do —
  presented strip cũng không nhận diện được frame stripes.
- **Bằng chứng phụ duy nhất còn đứng:** F6 clock timing (10/10 ca A
  rVFC content gap 6, xem docs/PHASE9_ROUND104_F6_BLUR_LIMITS.md) —
  giữ nguyên, KHÔNG bịa số thay thế. Muốn đo content cụm A stripes cần
  stimulus/phương pháp khác (vd strip dài hơn, strip 2D, hoặc stimulus
  stripes không tuần hoàn) — ghi là nợ mở, không thử trong luồng này.

---

## §5. Lệch g triple +0,03..+0,05 — weights không giải thích được cụm A

Hồi quy trọng số blend live bằng least-squares trên cap px (96×54)
theo 3 frame content đã biết (ref downscale), trên các triple phân biệt
của noise r38 (G7, đường rVFC) — 48 sự kiện, tính lại từ
`weights106h4.json` (khớp với `weights106h4.txt`):

| filter | w trung bình | w median | R² median | R² mean | g_pred mean |
|---|---|---|---|---|---|
| BILINEAR | [0,326, 0,336, 0,338] | [0,330, 0,333, 0,334] | 0,156 | 0,158 | 0,596* |
| NEAREST | [0,335, 0,327, 0,338] | [0,333, 0,329, 0,336] | −0,185 | −0,186 | 0,606* |
| BOX | [0,329, 0,333, 0,338] | [0,331, 0,333, 0,337] | 0,096 | 0,095 | 0,609* |

\* g_pred mean gộp cả 5 pad-clone (dự đoán ~0,74) nên cao hơn mức
triple thuần; xem tách riêng dưới đây. Hiệu chuẩn filter downscale
(cap noblur r37 vs ref): NEAREST tốt nhất (std(cap)/std(ref) med 0,979;
BILINEAR 1,630; BOX 1,386) — nhưng R² của NEAREST lại âm, tức fit tệ
nhất; **không có filter nào vừa khớp scale vừa fit tốt — filter
mismatch (G7 §1.2) vẫn nhiễu phép hồi quy này.**

Tách 2 lớp multiplicity (g_live):

| lớp | n | g_live mean | g_live dải | g_pred (BILINEAR) | lệch |
|---|---|---|---|---|---|
| triple 3 frame phân biệt | 43 | 0,625 | 0,614–0,640 | 0,596 | **+0,029** |
| pad-clone {a,a,b} | 5 | 0,769 | — | 0,741 | **+0,028** |

- **Trọng số ≈ đều [1/3, 1/3, 1/3] ở mọi filter — nhưng fit YẾU**
  (R² median cao nhất chỉ 0,156; NEAREST âm) nên kết luận "trọng số
  đều" chỉ là bằng chứng yếu, không đủ sức loại trừ lệch trọng số nhỏ.
- **Dù lấy w = [1/3, 1/3, 1/3], g dự đoán cho triple phân biệt là
  ~0,59–0,60 — không phải 0,44.** Weights KHÔNG giải thích được cụm A
  stripes (g≈0,44, label gap 6). Lệch g +0,03 vẫn chưa giải thích được
  (nhất quán G7 §4: đã loại tương quan cặp frame, codec, filter
  downscale); nghi trọng số blend thực tế (current vẽ 2 lần?) hoặc
  thành phần chia sẻ chưa thấy — vẫn là nợ mở.
- Lưu ý phương pháp: weights đo trên stimulus **noise** r38, không phải
  stripes — không được dùng số này để kết luận trực tiếp về thành phần
  content stripes; nó chỉ loại trừ giả thuyết "trọng số lệch mạnh gây
  ra g≈0,44" ở mức fit yếu nêu trên.

---

## §6. Kiểm chứng (cây cuối, md5 ced42efd, late merge ~16:30Z)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass 9,53s**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- `node --check` probe106h4: **OK**.
- Pad-oldest còn nguyên (marker `motionBlurPadGhostCount` +
  `lastDrawnPaddedGhosts`); `motionBlurBlendPlan` không đổi.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §7. Nợ còn lại

1. **B-band c0: VẪN MỞ (luồng này).** p=0,3545, power 53–59% tại hiệu
   ứng gốc; còn thiếu 43 c0 + 61 c2 B-cap tới ~115/nhóm (~3 lượt c0-only
   + ~4 lượt 3-clip ở tốc độ đợt này). Cờ heterogeneity đã hết ý nghĩa
   (p=0,37) — đợt sau gộp bình thường, chỉ theo dõi.
2. **Cụm A stripes: VẪN MỞ.** Strip không nhận diện được stripes
   (feasibility FAIL 90/90); giả thuyết E6 chưa chứng minh/bác. Cần
   phương pháp đo content khác cho stripes (strip dài hơn / 2D /
   stimulus không tuần hoàn) — chưa thử.
3. **Lệch g triple +0,03: VẪN MỞ.** Weights ≈ đều nhưng fit yếu
   (R² med ≤0,16); lệch +0,029 trên triple thuần, +0,028 trên
   pad-clone — nhất quán, chưa giải thích được.
4. **r41c0 mất do reboot #33:** lượt c0-only này không có dữ liệu;
   không chạy bù trong luồng này (cấm probe live mới ở late merge).
   Đợt sau chạy lại 1 lượt c0-only nếu cần mẫu.
5. Các nợ ngoài phạm vi H4 (giữ nguyên từ LIMITS gộp đợt 105 §7):
   G1 deinterlace (chờ user quyết metric G5/M2), 2 MiB, ghost F8
   (G1 đã land F8 đợt 105 — theo dõi), F5 Re-arm (chờ A/B RAM cao),
   EPERM probe #25 + khoảng mù #22/#23, birefnet (CẤM thử lại khi RAM
   chưa đổi), TTS 39 (CẤM kiểm lại), `ci-security.yml` 403 (chờ user),
   release gate giữ nguyên.

---

## File đổi/thêm (đợt 106 H4, late merge)

- `apps/web/scripts/probe106h4-frame-parity.mjs` — probe copy
  probe105g7 (config `scroll-blur`, stimulus stripes-scroll.mp4,
  F3 tắt; `WITH_BLUR` đã đúng `scroll-blur || noise-blur`;
  SCRATCH round106-h4; `node --check` OK).
- `docs/PHASE9_ROUND106_H4_BLUR_LIMITS.md` — file này.
- `apps/web/public/stripes-scroll.mp4` — stimulus nhị phân, KHÔNG stage
  (theo luật binary).
- Dữ liệu thô + analyzer nằm ngoài repo, tại
  `hidden_files/round106-h4/` (không stage): prereg, driver, 4 lượt
  probe đã xong, `strip106h4-feasibility.*`, `weights106h4.*`,
  `analyze106h4.py` + `analysis106h4.json/.txt`.
- Không push GitHub, không release/tag (giữ release gate).

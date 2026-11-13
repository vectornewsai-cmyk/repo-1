# PHASE9_ROUND103_E6_BLUR_LIMITS.md — Blur parity đợt 103, luồng E6

**Ngày:** 13/11/2026. **Luồng:** E6 (Phase 9 đợt 103). **Chủ đề:** strip-confirm
cụm A gap-6 để chốt r7 + mở rộng mẫu D floor + B-band pair-like còn lại
(nợ LIMITS gộp đợt 102 §4 mục 6).

**Kết quả lớn nhất đợt này:**
- **r7 VẪN MỞ — strip-confirm KHÔNG chốt được nội dung gap 2 cho bất kỳ
  ca nào trong cụm A.** Trên 13 ca A (D4 11 + E6 mới 2): **0/13** strip
  xác nhận nội dung gap 2; **2/13 bác thẳng gap 2** (ghost strip khớp
  pres−6, loại pres−2 với h=24); **3/13 bác cả gap 2 lẫn gap 6**; **7/13
  mơ hồ hoàn toàn** (strip(pres−6) == strip(pres−2)); 1/13 ngoài tầm
  tham chiếu. Đối chứng B-band: 6/7 khớp gap 6 đúng như kỳ vọng — phương
  pháp không hỏng, nó chỉ không phân giải được cụm A.
- **Phát hiện mới (giới hạn cứng của strip 48-bit):** strip hàng giữa chỉ có
  **4 mẫu phân biệt trên 90 frame** (hamming chỉ nhận 0/24/48) — nó đo
  pha cuộn (chu kỳ ~5 frame), không bao giờ pin được 1 frame chính xác.
  Mọi verdict strip trước đây dùng tiêu chí "singleton span-3" phải đọc lại
  theo nghĩa này (C4 §4 đã cảnh báo alias ±5k; nay đo được mức suy biến
  đầy đủ: mỗi strip khớp ~22/90 frame).
- **Đính chính suy luận D4 §1.2:** 11 ca A có ringSize=3, pool=2 → **KHÔNG
  có pad-clone** (pad chỉ khi pool < frames−1 = 2) nên "khớp dự đoán
  pad-triple gap-2 (0,449)" là sai đối tượng. Số 0,449 cũng là dự đoán của
  triple liên tiếp khỏe mạnh {−2,−1,0} — và liệt kê strip+g cho thấy **9/13
  ca A chỉ khớp triple liên tiếp** (pred 0,449), không khớp bất kỳ bộ nào
  có gap 2 hay gap 6 (với current = pres). Giả thuyết "nhãn gap 6 / nội
  dung gap 2" không còn là suy luận duy nhất cho cụm A.
- **D floor post-fix gộp: 0/1640** (C4 0/867 + D4 0/566 + E6 0/207;
  Fisher p=1,43e-09 so với pre-fix 28/1547; 95% CI trên 0,183%).
- **B-band pair-like:** gộp post-fix n=437, pair-like 50/437 (11,4%).
  Tín hiệu ringSize=1 đã chết hẳn (Fisher p=1,0); gợi ý gap>2 đợt trước
  biến mất khi thêm dữ liệu E6 (p=0,177). Mẫu hình duy nhất còn đứng sau
  hiệu chỉnh: **clip c0 giàu pair-like hơn c2** (17,1% vs 6,1%,
  Fisher p=0,0042, OR 3,15 — tìm post-hoc, cần kiểm chứng đăng ký trước).
  Tải/phase/skipped không giải thích được (skipped p=0,024, wk p=0,019 —
  yếu, không qua Bonferroni).
- **Cửa sổ mù wk KHÔNG thu hẹp được** (vẫn theo D4, không chạy blind probe):
  ước lượng state100 E6: c1 1861–3129ms, c2 ~303–304ms (≈0 sau bias
  +180ms). Giữ nguyên kết luận A5.

**Build:** probe E6 chạy trên `110a51b9` (sibling đổi preview.tsx lúc
05:59Z; pad-oldest verify còn nguyên + test 27/27); kiểm chứng cuối trên
`03fab95d` (sibling đổi tiếp ~06:21Z; pad-oldest vẫn còn nguyên, 10
marker). **Không sửa production trong luồng này.**

---

## §0. Bối cảnh chạy

- **Boot 9576eac3** (reboot #27 ~05:26:18Z), RAM khả dụng ~1,2 GB lúc bắt
  đầu — birefnet KHÔNG chạy (theo lệnh).
- **Sự cố ENOSPC (lỗi hạ tầng, đã khắc phục bằng chạy lại):** driver đầu
  4/4 lượt fail trong 13–20s/lượt (exit=2, `page.goto: ERR_CONNECTION_REFUSED`):
  vite dev chết vì `ENOSPC: System limit for number of file watchers reached`
  khi chokidar quét `apps/web/src/lib/*.test.ts`. Giới hạn hệ thống
  `fs.inotify.max_user_watches = 63747`, **không nâng được** (`/proc/sys`
  read-only — `sysctl -w` bị từ chối). Lúc đo lại chỉ còn 1605 watcher
  đang dùng (2 vite server) — ENOSPC là nhất thời do các vite server của
  luồng song song giữ watcher rồi thoát. Chạy lại 1 lượt chr r33 pass
  ngay (06:08Z, exit 0, 38 cap), rồi driver B 3/3 pass (06:10–06:18Z).
  Bài học: khi nhiều luồng cùng chạy vite, ENOSPC nhất thời có thể xảy ra
  — chạy lại sau khi watcher được giải phóng, không sửa config/probe.
- **Sibling sửa preview.tsx 2 lần giữa đợt:** `ed260e62` (lúc bắt đầu) →
  `110a51b9` (05:59:24Z, trước lượt probe đầu) → `03fab95d` (~06:21Z,
  trong lúc kiểm chứng). Cả 4 lượt probe E6 chạy trên `110a51b9`
  (mtimeChanged=false mọi lượt). Pad-oldest verify còn nguyên trên cả hai
  md5 (marker `motionBlurPadGhostCount` + `lastDrawnPaddedGhosts` ×10;
  `previewEngine.test.ts` 27/27 trên cây cuối).
- **4 lượt probe mới (đều exit 0):** chr r33 yên (38 cap, load lúc phát
  1,98), chr r34 `--sysload 2` (115 cap, load 11,27), wk r33 yên (30 cap,
  load 8,37, silentEngine=true, pumpN=0 — đường tick), wk r34 `--sysload 2`
  (47 cap, load 1,91, silentEngine=true, pumpN=0). Tổng E6: **207 cap
  dùng được, 0 D, 0 cap ngoài dải.**
- **KHÔNG chạy blind probe** (theo nhiệm vụ E6). Cửa sổ mù chỉ ước lượng
  từ state100 như D4 (§4).
- Dữ liệu thô + script: `hidden_files/round103-e6/` (`strip103e6*.py/.txt/.json`,
  `analyze103e6.py`, `bband103e6.py`, `driver103e6*.sh/.log`, 4 thư mục lượt).

---

## §1. Strip-confirm r7 — KHÔNG chốt được, r7 VẪN MỞ

### 1.1. Phương pháp + giới hạn cứng mới của strip 48-bit

- Strip tham chiếu: frames round97-y2 f001..f090.png, hàng giữa, x 256–303,
  kênh G>128 → 48 bit (đúng quy tắc C4 §4). Strip live: `ghostPix`/`curPix`
  base64 trong `blendTick`. Nối tick với cap bằng
  (clipId, presented=pres, ringLast=last, ringPrev=prev, skippedLatest).
  Quy tắc quyết định đăng ký TRƯỚC khi chạy: nội dung gap 2 ⇔ ghost strip
  khớp lớp alias (pres−2) và KHÔNG khớp lớp (pres−6); ngược lại cho gap 6;
  khớp cả hai ⇒ mơ hồ.
- **Đo được: strip 48-bit chỉ có 4 mẫu phân biệt trên 90 frame tham chiếu.**
  Mọi hamming đo được đều là 0, 24 hoặc 48 — strip là sóng vuông chu kỳ
  50% (24 bit 0 + 24 bit 1), nó chỉ đo **pha cuộn** của pattern, với chu kỳ
  ~5 frame (4 pha trên 5 frame, có trượt). Mỗi strip live khớp đúng
  **~22/90 frame** (h=0). Hệ quả: strip KHÔNG BAO GIỜ pin được 1 frame —
  nó chỉ loại được các frame khác pha. Đây là giới hạn cứng của phương pháp,
  mạnh hơn cách diễn đạt "alias ±5k" của C4: trong cùng 1 lớp pha, các frame
  cách nhau 5k không phân biệt được, VÀ các frame cách nhau 4 cũng không
  phân biệt được trong ~1/2 trường hợp (ref_h(strip(pres−6), strip(pres−2))
  = 0 ở 10/19 cặp quyết định được).
- **Đính chính suy luận D4 §1.2 (quan trọng):** D4 viết 11 ca A "khớp dự đoán
  pad-triple gap-2 (0,449)". Các ca này có ringSize=3, pool sau skip = 2
  ghost = đúng frames−1 → `motionBlurPadGhostCount(3, 2) = 0`, **không có
  ghost clone nào** — blend là triple 3 frame phân biệt, không phải
  {ghost,ghost,current}. Số 0,449 trùng nhau giữa pad-clone gap-2
  {−2,−2,0} và triple liên tiếp khỏe mạnh {−2,−1,0} (mô hình harmonic,
  đã kiểm chứng lại bằng đọc `motionBlurBlendPlan`: alpha (1, 0,5, 1/3)
  qua source-over cho đúng trung bình đều 1/3). Nên g≈0,44 của cụm A
  KHÔNG suy ra được "nội dung gap 2" — nó cũng khớp triple liên tiếp khỏe
  mạnh. Suy luận "nhãn gap 6 / nội dung gap 2" của D4 là 1 trong ≥2 cách
  giải thích, không phải kết luận.

### 1.2. Kết quả strip trên 13 ca A (D4 11 + E6 2) + 7 đối chứng B

Bảng verdict cho ghost mới nhất (ghost[1] = ghost nhãn gap 6), theo strip:

| ca | pres | g | band | h(pres−6) | h(pres−2) | ref_h(pres−6,pres−2) | verdict strip |
|---|---|---|---|---|---|---|---|
| r22 c0 fi63 | 63 | 0,442 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| r22 c0 fi69 | 69 | 0,440 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| r22 c1 fi15 | 15 | 0,443 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| r22 c1 fi21 | 21 | 0,438 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| r22 c2 fi11 | 11 | 0,434 | A | 0 | 24 | 24 | **GAP 6 — bác gap 2** |
| r23x c1 fi89 | 92 | 0,437 | A | 0 | — | — | KHÔNG QUYẾT ĐƯỢC (pres−2=90 ngoài 90 frame tham chiếu) |
| r24 c0 fi87 | 89 | 0,447 | A | 24 | 48 | 24 | KHÔNG PHẢI CẢ HAI (nội dung pha pres) |
| r24 c0 fi61 | 61 | 0,445 | A | 24 | 48 | 24 | KHÔNG PHẢI CẢ HAI |
| r24 c0 fi76 | 76 | 0,444 | A | 24 | 24 | 0 | KHÔNG PHẢI CẢ HAI |
| r24 c2 fi33 | 33 | 0,446 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| r24 c2 fi81 | 81 | 0,442 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| **r33 c0 fi70 (E6 mới)** | 70 | 0,436 | A | 0 | 0 | 0 | MƠ HỒ (d=4) |
| **r34 c0 fi42 (E6 mới)** | 42 | 0,445 | A | 0 | 24 | 24 | **GAP 6 — bác gap 2** |
| r20 fi36 / r22 fi29 / r23x fi38 / r24 fi66 / wk r31 fi53 (B) | — | 0,76–0,78 | B | 0 | 24 | 24 | GAP 6 (đối chứng đúng kỳ vọng) |
| wk r29 fi82 (B) | 82 | 0,787 | B | 24 | 24 | 0 | KHÔNG PHẢI CẢ HAI |
| r34 c1 fi13 (E6 mới, B) | 13 | 0,769 | B | 0 | 24 | 24 | GAP 6 (đối chứng đúng kỳ vọng) |

- **Tổng kết A (13 ca): mơ hồ 7, gap-6 2, không phải cả hai 3, không quyết
  được 1. 0/13 xác nhận nội dung gap 2.** Đối chứng B (7 ca): gap-6 6/7,
  không phải cả hai 1/7 — phương pháp phân biệt được khi cặp ứng viên
  khác pha (ref_h=24), nên kết quả âm ở cụm A không phải do phương pháp hỏng.
- **curPix (frame hiện tại):** h(pres)=0 ở 11/12 ca A quyết định được
  (presented đúng); chỉ r24 fi87 cho h(pres−1)=0 (presented −1 — đúng
  hướng H2 của D4, nhưng là 1 ca duy nhất, không phải quy luật). H2
  (presented −1) bị bác cho 11/12 ca; H1 (nhãn ghost −4, presented đúng)
  thì curPix ủng hộ nhưng ghost strip không ủng hộ (xem bảng trên).
- **Ca tốt nhất fi81 (r24 c2):** strip tự nó mơ hồ (cả 75 và 79 đều h=0),
  nhưng liệt kê strip+g (mục 1.3) chỉ còn bộ gap-2 (72,79,81) với
  current = pres — là ứng viên duy nhất trong cụm A mà gap-2 khớp cả
  strip lẫn g. Tuy nhiên sự phân biệt này hoàn toàn dựa vào mô hình
  harmonic (pred 0,449 vs 0,620 cho gap-6), mà mô hình này suy biến ở
  các offset lớn (xem §1.3) — **không đủ chắc để đóng r7.**

### 1.3. Liệt kê strip+g (mô hình harmonic, weights đều 1/3 đã kiểm chứng)

Liệt kê mọi bộ nội dung (c0, c1, cc) khớp strip (trong [pres−14, pres+1],
c0≤c1≤cc, cc−c1≤6, c1−c0≤14) mà `window_pred` harmonic (a=1,41) khớp g đo
trong ±0,03. Weights đều 1/3 đã kiểm chứng từ code thật
(`motionBlurBlendPlan` alpha (1, 0,5, 1/3) qua source-over = trung bình đều).

- **9/13 ca A chỉ khớp triple liên tiếp** (pred 0,449), 0 bộ gap-2, 0 bộ
  gap-6 (với current = pres): fi63, fi69, fi15, fi21, fi61, fi76, fi33,
  r33 fi70, r34 fi42 (mỗi ca 2–3 bộ, cách nhau đúng 5 frame — alias).
  Vd fi63: (51,52,53) và (60,61,62); r34 fi42: (30,31,32), (35,36,37),
  (40,41,42) — bộ cuối có ghost1 = 41, current = 42 = pres.
- fi81: chỉ khớp gap-2 (67,79,81), (72,79,81) — xem §1.2.
- fi11: **0 bộ nào khớp g** (mọi ứng viên có thứ tự đều cho pred 0,333 /
  0,487 / 0,620 / 0,647 / 0,776, xa g=0,434) — ca này không giải thích
  được bằng bất kỳ bộ nội dung nào có thứ tự trong cửa sổ, kể cả gap 2
  lẫn gap 6. (Bộ (7,5,11) cho pred 0,449 nhưng đảo thứ tự ghost — loại.)
- fi87: 0 bộ khớp g (cùng tick với fi35 g=0,988 — xem dị thường §5).
- fi89: chỉ khớp gap-2 với current ≠ pres (84/89, pres=92 ngoài tham chiếu).
- Đối chứng B: labels-true cũng KHÔNG dự đoán đúng g (vd r20 labels-true
  {−9,−6,0} → 0,620 vs đo 0,777) — nhãn ghost sai là hiện tượng chung, không
  riêng cụm A.
- **Đọc đúng:** liệt kê này là bằng chứng phụ thuộc mô hình (harmonic suy
  biến: pred chỉ nhận các giá trị 0,333/0,449/0,62/0,776 lặp lại theo offset
  mod ~4,46 frame). Nó KHÔNG chứng minh nội dung là triple liên tiếp — nó
  chỉ cho thấy giả thuyết "nội dung gap 2" không phải là cách duy nhất (và
  với 9/13 ca thì không phải là cách nào khớp g). Nhãn ghost sai không đều
  (vd fi63 cần +9/+4/−1) hiện chưa có cơ chế giải thích — ghi là giả thuyết
  mở, không kết luận.

### 1.4. Verdict r7: VẪN MỞ

- Strip-confirm theo đúng nhiệm vụ (1 ca chốt nội dung gap 2) **không đạt**:
  không có ca A nào mà strip xác nhận gap 2 và loại gap 6; 2 ca bác gap 2
  thẳng bằng strip; 3 ca bác cả hai.
- Cơ chế r7 nay rõ hơn nhưng theo hướng khác với D4: **nhãn ghost sai là
  thật và phổ biến** (ghost strip loại nhãn ở nhiều ca; labels-true không
  dự đoán đúng g cả ở đối chứng B), nhưng **nội dung thật không phải gap 2
  một cách hệ thống** — cụm A g≈0,44 khớp cả triple liên tiếp khỏe mạnh.
  "Nhãn gap 6 / nội dung gap 2" chỉ còn là 1 giả thuyết trong số nhiều,
  và đã bị bác ở 2/13 ca.
- Đóng r7 cần **strip dài hơn** (vd 96 mẫu hoặc 2 hàng — phá vỡ suy biến
  4-pha) hoặc đo trực tiếp presented/ghost — cả hai đều cần thay đổi
  instrumentation production, ngoài phạm vi luồng này (không sửa production
  khi chưa có fix đo được). Ghi nợ cho đợt sau.

---

## §2. D floor — 0 cap D mới, gộp 0/1640

| lượt | engine | điều kiện | cap dùng | D |
|---|---|---|---|---|
| chr-blur-r33 | chr | yên (load 1,98) | 33 | 0 |
| chr-blur-r34 | chr | **sysload 2** (load 11,27) | 101 | 0 |
| wk-blur-r33 | wk | yên (load 8,37; silentEngine, pumpN=0) | 28 | 0 |
| wk-blur-r34 | wk | **sysload 2** (load 1,91; silentEngine, pumpN=0) | 45 | 0 |
| **gộp E6** | | | **207** | **0** |

- Cap gap-6 mới: 3 (r33 fi70 A; r34 fi42 A; r34 fi13 B) — đều đã strip-check
  ở §1.2 (r33 fi70 mơ hồ, r34 fi42 gap-6, r34 fi13 gap-6 đối chứng).
- **D floor gộp post-fix: 0/1640** (C4 0/867 + D4 0/566 + E6 0/207;
  95% CI trên (rule of three) = **0,183%** (D4: 0,209%); Fisher một phía
  so với pre-fix 28/1547: **p=1,43e-09**).
- Pool=1 post-fix gộp (C4+D4+E6): n=42, bands C 21 / B 9 / **A 12** / **D 0**
  (E6 riêng: n=11, B 3 / A 5 / C 3, D 0). A trong pool=1 tiếp tục tăng
  (1/14 → 7/31 → 12/42) — đúng dự đoán pad: chỉ cặp nội dung gap-2 mới
  cho A sau pad; đa số ghost đói là gap lớn nên rơi B/C.

---

## §3. B-band pair-like còn lại — chỉ còn 1 mẫu hình đứng (clip c0)

Gộp post-fix C4+D4+E6: n=1640 cap; B n=437 (chr 355, wk 82), mean 0,773,
med 0,772, sd 0,009, dải 0,747–0,790; pair-like [0,70–0,76): **50/437
(11,4%)** (E6 riêng: 3/47; chr 2/32, wk 1/15). B-band trung bình không đổi
sau pad (C4 0,773, D4 0,772, E6 0,772).

| tách | pair-like | Fisher hai phía |
|---|---|---|
| ringSize=1 vs khác | 1/9 vs 49/428 | **p=1,0 — tín hiệu chết hẳn** (pre-fix 15/15; C4 post-fix 0/2; nay 1/9) |
| gap ≤2 vs >2 | 32/315 vs 18/119 | p=0,177 — gợi ý p=0,042 của D4 **biến mất** khi thêm E6 (nhiễu) |
| skipped=1 vs 0 | 26/291 (8,9%) vs 24/143 (16,8%) | p=0,024 — yếu, không qua Bonferroni (α=0,01 cho 5 test); mean g chỉ lệch 0,002 |
| load1 ≥10 vs <5 | 7/55 vs 41/346 | p=0,82 — không có tín hiệu tải |
| phase fi%5 0–1 vs 2–4 | 22/165 vs 28/272 | p=0,35 — không có tín hiệu pha |
| **clip c0 vs c2** | **22/129 (17,1%) vs 10/163 (6,1%)** | **p=0,0042, OR 3,15 — qua Bonferroni** |
| wk vs chr | 16/82 (19,5%) vs 34/355 (9,6%) | p=0,019 — yếu, không qua Bonferroni; nhiễu với tải (wk chạy nặng hơn) |

- **Mẫu hình duy nhất còn đứng: clip c0 giàu pair-like hơn c2** (c0 17,1%
  > c1 12,4% > c2 6,1%, đơn điệu). Cơ chế giả thuyết (chưa chứng minh):
  đầu clip pump/ring mới khởi động, cadence capture không đều → ghost
  thưa hơn → đuôi g thấp nặng hơn; về cuối clip pump đã ổn định. Đây là
  phát hiện post-hoc (không đăng ký trước) — cần 1 lượt kiểm chứng đăng
  ký trước (so c0 vs c2 trên mẫu mới) mới được coi là chốt.
- Các tách còn lại không giải thích được pair-like: mean g giữa các nhóm
  chỉ lệch ≤0,002 — pair-like là **đuôi thấp của 1 phân bố liên tục**
  (C4 đã chốt B-band không bimodal), không phải 1 mode riêng. Nợ này thu
  hẹp còn: giải thích đuôi c0 (cơ chế warm-up?) + kiểm chứng đăng ký trước.

---

## §4. Cửa sổ mù wk — ước lượng từ state100 (KHÔNG chạy blind probe)

| lượt | engine | c1 (ms) | c2 (ms) | tốc độ phát gần biên |
|---|---|---|---|---|
| chr-blur-r33 (đối chứng) | chr | 587 | 1873 | 0,86×/1,67× |
| chr-blur-r34 (đối chứng) | chr | 177 | 199 | 0,82×/0,98× |
| wk-blur-r33 | wk | 3129 | 304 | 0,25×/0,62× |
| wk-blur-r34 | wk | 1861 | 303 | 0,24×/0,51× |

- wk c1: 1861–3129ms — trên dải yên Y5 (1018–1480ms) nhưng cùng bậc với
  đuôi tải D4 (tới 8124ms); wk r33/r34 đều silentEngine (pumpN=0, đường
  tick) nên số này là ước lượng trên đường tick, không phải đường rVFC.
- wk c2: ~303–304ms cả hai lượt (≈0 sau khi trừ bias +180ms của D4 §3.3)
  — memo c2 ~0 tái tạo được ở 2 lượt này (D4: chỉ 1/5 ≈ 0).
- chr đối chứng: 177–587ms (c1), 199–1873ms (c2) — chr không có cửa sổ mù
  thực sự; c2 r33 = 1873ms là ngoại lệ (rate 1,67×, phCrossEst nhiễu khi
  ph không đơn điệu — không suy thêm).
- **Kết luận: KHÔNG thu hẹp được — giữ nguyên A5** ("blind = độ trễ khởi
  động element, watchdog đóng góp 0ms; đuôi memo c2 cần thêm lượt yên").
  Việc thu hẹp thật vẫn cần lượt blind yên — bị cấm trong nhiệm vụ này.

---

## §5. Dị thường + bài học harness

1. **ENOSPC vite (§0):** 4/4 lượt driver đầu fail vì hết file watcher
   (giới hạn 63747, không nâng được). Chạy lại sau khi watcher giải phóng
   thì 4/4 pass. Không phải lỗi probe, không phải lỗi production.
2. **Cùng 1 tick, 2 cap g khác xa:** r24 c0 fi87 (g=0,447, A) và fi35
   (g=0,988, C) có dbg lastDrawn giống hệt nhau (last 83/prev 81/pres 89),
   cách nhau 287ms relPlay — cap px không được quyết định duy nhất bởi
   lastDrawn blend. Chưa giải thích được (có thể cap lấy mẫu canvas ở
   trạng thái khác giữa 2 lần draw mà dbg chưa cập nhật, hoặc đường draw
   khác). Ghi là dị thường mở, không dùng 2 ca này để suy luận thêm.
3. **Frame index vượt 89:** pres tới 90–94 trong state100 (r33) — bộ đếm
   frame của probe chạy tiếp qua cuối video 90 frame (loop/đếm tiếp).
   Strip tham chiếu chỉ có 0..89 nên cap pres>89 không strip-check được
   (ca r23x fi89). Cần quy ước rõ frame loop khi strip-check lượt sau.
4. **Sibling sửa preview.tsx 2 lần giữa đợt** (110a51b9 rồi 03fab95d):
   lượt probe chạy trên 110a51b9 (mtimeChanged=false), kiểm chứng cuối trên
   03fab95d; pad-oldest verify còn nguyên trên cả hai. Kết luận D không phụ
   thuộc lượt lai (tập con md5-ổn-định: r33+r34+wk r33+r34 đều chạy trên
   cùng 110a51b9).
5. **wk silentEngine (pumpN=0) ở cả 2 lượt wk E6:** blend qua đường tick,
   không phải rVFC — cap vẫn đo thật và dùng được; nhưng ước lượng blind wk
   E6 là trên đường tick, ghi rõ để đợt sau khỏi lẫn với đường rVFC.

---

## §6. Kiểm chứng (cây cuối, md5 03fab95d, 06:23Z)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass 19,61s**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `scripts/test-preview-engine.sh` (apps/web/scripts/): **354 assertions pass**.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §7. Nợ còn lại

1. **r7 VẪN MỞ** — strip-confirm không chốt được nội dung gap 2 (0/13 xác
   nhận; 2/13 bác gap 2; 3/13 bác cả hai; 7/13 mơ hồ). Đóng r7 cần strip
   dài hơn (96 mẫu / 2 hàng) hoặc đo trực tiếp presented/ghost — cần thay
   đổi instrumentation production, để lại cho đợt sau nếu parent đổi lệnh.
   Giả thuyết mới cần kiểm: cụm A là triple liên tiếp khỏe mạnh với nhãn
   sai không đều (chưa có cơ chế).
2. **B-band:** chỉ còn đuôi c0 (p=0,0042, post-hoc) + gợi ý yếu skipped/wk
   — cần lượt kiểm chứng đăng ký trước cho c0-vs-c2.
3. **Cửa sổ mù:** đuôi yên vẫn chưa chốt — cần lượt blind yên (A5) — bị cấm
   trong nhiệm vụ này.
4. **Dị thường fi35/fi87** (cùng tick, g 0,447 vs 0,988) chưa giải thích được.
5. Các nợ ngoài phạm vi E6 (giữ nguyên từ LIMITS gộp đợt 102 §4): G1
   deinterlace (chờ user quyết metric G5/M2), 2 MiB (chỉ còn probe ghi nội
   dung byte buffer đầu qtdemux), ghost F8 relabel snapshot (CHƯA thử),
   zombie đường tick vẽ, re-arm (D6-A bị bác), EPERM probe #22 + khoảng mù
   #21, birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 103 E6)

- `apps/web/scripts/probe103e6-frame-parity.mjs` — probe mới (copy probe102d4;
  SCRATCH round103-e6; `node --check` OK).
- `docs/PHASE9_ROUND103_E6_BLUR_LIMITS.md` — file này.
- Không push GitHub, không release/tag (giữ release gate).

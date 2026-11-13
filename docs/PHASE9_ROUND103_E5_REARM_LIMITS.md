# Phase 9 đợt 103 — luồng E5: Re-arm fail-open (nested) — FIX ĐÃ LAND + xác minh drift-gate C3

- **Ngày:** 2026-11-13 (probe pre-fix 05:42–06:16Z; fix land 06:19Z; probe post-fix 06:21–06:50Z; viết doc sau đó, giờ VN).
- **Nợ đóng:** LIMITS gộp đợt 102 §4 mục 5 — "gate bỏ qua khi không tìm được clip (fail-open, nested) vẫn mở từ C3".
- **Kết luận ngắn:**
  1. **Fail-open nested là rủi ro THẬT, đã đo được:** pre-fix, trên project nested thật (clip bóng bọc trong 1 nested clip), drift-gate **không chặn lần nào trong 8 lượt (0 lần)**, trong khi đuôi vẫn mở + luật burst-rate vẫn chặn (8 lần). **7 lần đuôi đóng ADV2 khi drift vượt / 8 lượt, 2 f4-like (1 kèm kẹt seek ~2,5 s)** — đúng chuỗi lỗi f4 mà C3 đã đóng trên clip phẳng.
  2. **FIX ĐÃ LAND (tối thiểu, preview.tsx):** bước đuôi nay dùng **spec phẳng của tick trước** (đã kiểm identity với spec gốc hiện tại) thay vì spec gốc thô — lá nested chỉ tồn tại ở spec phẳng nên helper mới tìm được clip. Không đổi luật gate, không đổi lib (`playheadHold90R2.ts` md5 `00cce1ac` không đổi).
  3. **Sau fix, nested ĐÃ ĐÓNG fail-open:** gate chặn **42 lần / 8 lượt**, đóng ADV2 khi drift vượt **7 → 0**, f4-like **2 → 0**.
  4. **Phẳng không hồi quy về luật:** gate vẫn chặn (87 lần / 12 lượt + 34 lần / 4 lượt xác nhận), **0 lần đóng ADV2 khi drift vượt** sau fix. Nhưng **tỉ lệ đóng-trần (CAP) + resync sau trên phẳng load4 TĂNG MẠNH so với mẫu pre-fix** (20 ca mang nhãn f4-like của analyzer / 9 lượt load4 post-fix, so với 0 / 6 lượt load4 pre-fix) — TẤT CẢ 20 ca đã kiểm tay đều là **đóng do TRẦN 5000 ms** (tuổi 5001–5313 ms), không ca nào là đóng ADV2. Đây là **đánh đổi đã ghi rõ của C3** (§2), không phải gate thất bại — NHƯNG nguyên nhân khiến decoder đóng băng lâu hơn (2,1–3,4 s so với 0,8–1,1 s pre-fix) **CHƯA XÁC ĐỊNH ĐƯỢC** (xem §6). Không được trích "f4-like 0/12" cho phẳng mà không kèm phân tích này.
  5. **Drift-gate C3 còn nguyên trên phẳng:** baseline 12 lượt j1–j12 (cùng ma trận C3/D6): f4-like 0 (theo nhãn analyzer), gate 53 lần, burst 16 lần, 0 seek kẹt theo nghĩa ADV2. Tuổi đuôi trung vị (velocityTicks): j 2102 ms vs h 1509 ms vs i 2400 ms — khác phiên đo, cùng code gate, không kết luận hồi quy (theo đúng D6 §4).
  6. **D6-A vẫn bị bác, có thêm bằng chứng:** 0/21 đuôi phẳng post-fix + 0/10 đuôi nested post-fix đạt đủ 3 tiêu chí ổn định-lệch (xem §5). **KHÔNG thử lại D6-A. KHÔNG hạ trần 5000 → 3000 ms.**
  7. Hồi quy: tsc 0, vite build PASS (6,71 s), Hold 75/75, Pacing 19/19, previewEngine 27/27 (chạy 2 lần: trên cây lúc land fix và trên cây cuối).

## §1. Project nested thật — cách dựng + kiểm chứng flatten

Probe mới `apps/web/scripts/probe103e5.mjs` (bản sao `probe102d6.mjs`, thêm cờ `--nested`): sau khi thêm clip bóng + cô lập như D6, bọc clip trong 1 nested clip thật rồi mới pause-seek + phát:

```js
{ kind: "nested", id: "n103e5", start: leaf.start, duration: leaf.duration, in: 0,
  tracks: [{ kind: "video", clips: [leaf] }] }  // leaf = object clip gốc đầy đủ
```

Kiểm chứng trong trang mỗi lượt nested (ghi vào `probe-results.json.nested`): `buildPreviewSpec(spec gốc)` phải trả lá video với `src` = clip bóng — **8/8 lượt đạt**: lá nằm trên track `__nested-video`, `start=0, duration=6`, `instKey="n103e5/<leaf-id>"`, trong khi spec gốc tầng ngoài chỉ có `topKinds=["nested"]`. Tức preview ĐANG phát lá nested, và helper C3 (nhận spec gốc) chắc chắn miss — fail-open được đo trên project nested thật, không phải mô phỏng.

Pause-seek tới t=5 trên project nested: **8/8 confirmed** (tElement 393 ms ở lượt thử n1); verdict probe (giữ playhead trong seek + canvas đổi khung) **PASS 20/20 lượt pre-fix hợp lệ, 20/20 lượt post-fix hợp lệ, 4/4 lượt xác nhận r**.

## §2. Pre-fix: fail-open đo được gì (n1–n8 + j1–j12, chưa đổi code)

Probe: WebKitGTK 27.2, clip bóng 720p 6 s, 1 instance/lượt, dọn process sau mỗi lượt; boot `9576eac3` suốt (reboot #27, không reboot trong đợt).

### 2.1 Nested n1–n8 (load3/4 × GOP30/250 — chế độ burst nặng)

| Chỉ số | n1–n8 pre-fix |
|---|---|
| Lượt hợp lệ / tổng chạy | 8/8 (+3 chạy lại lỗi harness, +3 chạy lại mtime-đổi — xem §7) |
| tailDriftGate (hook trực tiếp) | **0** |
| tailBursts (luật B3) | 8 |
| Đuôi (tổng / tuổi trung vị velocityTicks) | 18 / **1504 ms** (max 2703 ms) |
| Đuôi đóng khi drift vượt (>0,35, đã trừ tiếp quản) | **7 — TẤT CẢ là ADV2** (tuổi 691–2670 ms, adv_last=1, 0 ca đóng trần) |
| f4-like (đóng-drift-vượt + resync trong 2 tick sau) | **2 (kèm kẹt seek: 1)** |
| Đuôi đóng do watch mới arm tiếp quản | 9 |
| resyncsV tăng tổng (mọi đường) | 10 |

**Kiểm tay 2 ca f4-like (đều ở n1, load4 gop30):**
- Đuôi `endedAtMs=8695`: tuổi **892 ms** (xa trần 5000 ms), adv 0→1 với drift **+1,31 → +1,10** — advance #1 đã đếm khi drift +1,10 (gate phẳng đã chặn được ca này); đuôi đóng, resyncsV 1→2 ngay sau; **ph đóng băng ở 4,233 trong ~2,4 s (relMs 9789→~12500) trong lúc element seeking** (seek hoàn tất ~12500, ct chạy tiếp). Đúng chuỗi f4 (burst → đóng đuôi → seek kẹt).
- Đuôi `endedAtMs=15122`: tuổi **694 ms**, adv 0→1 drift +1,29 → +1,00, đóng → resyncsV 2→3, ph đóng băng 5,333 ~0,5 s.
- 5 ca đóng-drift-vượt còn lại (n2, n3, n5, n7, n8 — drift +0,50…+1,00) không có resync trong 2 tick sau: cửa sổ f4 mở nhưng resync chưa kịp bắn trong cửa sổ đo — vẫn là đóng ADV2 sai luật gate, không phải "an toàn".

Đối chiếu: pre-gate phẳng (C3 §1) là 6/7 lần đóng ADV2 khi drift vượt / 11 lượt, 1 f4-like; nested pre-fix là 7/7 lần đóng-drift-vượt là ADV2 / 8 lượt, 2 f4-like. **Fail-open nested tái hiện đúng tỉ lệ lỗi tiền-gate, thậm chí nặng hơn.**

### 2.2 Phẳng j1–j12 — baseline drift-gate C3 còn nguyên (nhiệm vụ 2)

Cùng ma trận với h1–h12 (C3) / i1–i12 (D6): load1–4 × GOP30/250.

| Chỉ số | C3 h1–h12 | D6 i1–i12 | **E5 j1–j12** |
|---|---|---|---|
| Lượt hợp lệ | 12/12 | 12/12 | **12/12** (+3 chạy lại: j9 mtime-đổi, j10/j12 lỗi harness) |
| Verdict probe | 12/12 PASS | 12/12 PASS | **12/12 PASS** |
| f4-like (nhãn analyzer) | 0 | 0 | **0** |
| tailDriftGate (hook trực tiếp) | 44 | 59 | **53** |
| tailBursts | 31 | 21 | **16** |
| Đuôi đóng khi drift vượt | 2 (đều đóng trần) | 1 (đóng trần) | **3 — đều KHÔNG phải đóng trần, KHÔNG phải ADV2 (xem dưới)** |
| Đuôi đóng do watch mới arm tiếp quản | 8 | 14 | **18** |
| resyncsV tăng tổng | — | 20 | **16** |
| Tuổi đuôi trung vị (velocityTicks) | 1509 ms | 2400 ms | **2102 ms** |
| Seeking kẹt ≥ 3 s (theo nghĩa ADV2) | 0 | 0 | **0** |

**Kiểm tay 3 ca "đóng khi drift vượt" (j8, j10, j12):** cả 3 đều có `adv_last=0`, drift ÂM (−1,50; −0,93; −1,10 — element CHẠY SAU playhead), tuổi 2001–3016 ms, lý do UNKNOWN theo script quỹ đạo (không REARM / không ADV2 / không CAP). Theo code lib (`nextResumeGraceTail97Y4` chỉ đóng khi `!playing` / `hasWatch` / quá trần / đủ 2 advance): các ca này đóng do `!playing` lúc probe dừng phát ở cuối lượt hoặc watch mới arm lần đầu (không tăng counter rearms nên analyzer không nhận là tiếp quản). **Không resync nào sau cả 3 ca** — không phải gate thất bại, không phải f4-like. Ghi rõ để không ai trích "3 ca đóng khi drift vượt" thành gate lỗi.

**Đọc trung vị 2102 vs 1509/2400 ms:** cùng phương pháp (velocityTicks), khác phiên đo; `playheadHold90R2.ts` md5 `00cce1ac` không đổi suốt pre-fix → không có hồi quy gate nào để quy kết. Chỉ số an toàn (f4-like 0) đứng yên.

## §3. Fix đã land — dùng spec phẳng tick trước (đợt 103 E5)

**Vấn đề:** bước đuôi ở `tickInner` chạy TRƯỚC khối flatten trong cùng tick, nên C3 truyền `st.spec` (spec gốc) cho helper. Lá nested chỉ tồn tại sau flatten → helper miss → gate bỏ qua.

**Phương án đã chọn (duy nhất được land):** nhớ spec phẳng của tick này để bước đuôi tick SAU dùng — flatten vốn đã chạy sẵn cho render nên **không tốn thêm lần flatten nào**:
- Ref mới `lastFlatSpec103E5Ref: { raw: VideoSpec; flat: VideoSpec } | null` (cạnh `lastCurveWarnKeyRef`).
- Cuối khối flatten: `lastFlatSpec103E5Ref.current = { raw: rawSpec, flat: spec }` (cả đường thành công lẫn đường catch `spec = rawSpec`).
- Bước đuôi: `specForTail103E5 = flat103E5 && flat103E5.raw === st.spec ? flat103E5.flat : st.spec` rồi truyền cho `driftTargetForTailElement101C3` thay vì `st.spec`.
- Cập nhật comment helper C3 + comment bước đuôi (nested không còn miss nữa).

**Vì sao không phải các phương án khác:**
- *Flatten lại đồng bộ trong bước đuôi khi lookup miss:* tốn 1 lần flatten mỗi tick trong lúc đuôi mở (~2 s × 60 fps) — đúng lúc decoder đang đói, không chấp nhận được.
- *Đệ quy helper xuyên nested trên spec gốc:* nhân đôi logic flatten (speed/curve/trim/instance-key) trong helper đo — rủi ro lệch mapping với `collectActives`, không cần thiết khi spec phẳng đã có sẵn.
- *Chỉ gate ở tick đóng (advances 1→2):* vẫn để advance #1 giả trong bộ đếm — C3 §2 đã loại.

**Bảo vệ của identity check:** user sửa project → store tạo spec object mới → `flat.raw !== st.spec` → fallback spec thô như cũ trong đúng 1 tick (fail-open 1 tick, đúng hành vi cũ). Tick đầu sau mount: ref null → fallback spec thô. Spec phẳng không có nested/adjustment thì `buildPreviewSpec` trả đúng object cũ → hành vi phẳng không đổi (đã chứng minh bằng Node — xem §3.1).

### 3.1 Chứng minh phẳng không đổi (Node, không cần browser)

Chạy `buildPreviewSpec` trực tiếp trên spec dạng probe dùng (video track + 1 clip video `start=0, duration=6, in=0, out=6`):
- Không adjustment: `flat === spec` → **true** (cùng object). Sample project thật (`apps/web/src/sample.ts`) có **0 `adjustmentLayers`, 0 nested clip** → trường hợp này đúng là trường hợp probe chạy.
- Có adjustment layer: trả object mới nhưng clip cắt đoạn giữ đúng mapping (`start/in` = 0/0, 2/2, 4/4 → target = `t` ở mọi đoạn) → `rampSourceTimeAt` cho cùng target như clip gốc.
- Kết luận: **drift mà gate tính trên phẳng sau fix bằng đúng drift trước fix** (theo cấu trúc, không chỉ theo số đo). Mọi khác biệt hành vi phẳng sau fix (xem §6) không thể đến từ phép tính drift của fix này.

### 3.2 Thay đổi code (chỉ `apps/web/src/preview.tsx`, marker "103E5" ×9)

- Ref `lastFlatSpec103E5Ref` + ghi ref ở cuối khối flatten + `specForTail103E5` ở bước đuôi + cập nhật 2 comment (helper C3, bước đuôi).
- **Không đổi:** `apps/web/src/lib/playheadHold90R2.ts` (md5 `00cce1ac`), ngưỡng drift 0,35 s, 2 tick xác nhận, trần đuôi 5000 ms, detector re-arm 300 ms, luật bò Z3, luật burst-rate B3, CANCELLED/ARM-HELD.
- **Không thử D6-A, không hạ trần** (xem §5).

## §4. Sau fix: nested đã đóng fail-open (p1–p8) + phẳng k1–k12

Probe post-fix: cùng script `probe103e5.mjs`, cùng ma trận; cây lúc land fix md5 `03fab95d` (sau đó sibling sửa tiếp thành `4e954101` lúc 06:28:22 và `c2251e39` lúc 06:38:03 — marker E5 ×9 còn nguyên cả hai lần, xem §7).

### 4.1 Nested p1–p8 (cùng ma trận n1–n8)

| Chỉ số | Pre-fix n1–n8 | **Post-fix p1–p8** |
|---|---|---|
| Lượt hợp lệ | 8/8 | **8/8** (0 chạy lại) |
| tailDriftGate | 0 | **42** (p1: 11, p6: 9, p7: 8, p3: 6, p2: 3, p8: 3, p5: 2, p4: 0) |
| tailBursts | 8 | **37** |
| Đuôi (tổng / tuổi trung vị) | 18 / 1504 ms | **12 / 2920 ms** (max 5101 ms) |
| Đuôi đóng khi drift vượt | 7 (tất cả ADV2) | **1 (p8, đóng TRẦN, xem dưới)** |
| f4-like | 2 (1 kẹt seek) | **0** |
| Đuôi đóng do watch mới arm tiếp quản | 9 | **7** |
| resyncsV tăng tổng | 10 | **8** |

**Kiểm tay ca đóng-drift-vượt duy nhất (p8):** tuổi **4924 ms** ở mẫu cuối có đuôi (đóng ở tick sau → tuổi thật ≈ 5000+ ms = đóng TRẦN), adv=1, drift +0,44, **không resync sau** — đúng mẫu đóng trần vô hại của D6 (i10). Không phải gate thất bại.
**Kết luận nested: fail-open ĐÃ ĐÓNG.** Gate chặn được đáp xa trên lá nested ngoài đời (42 lần), không còn đóng ADV2 khi drift vượt.

### 4.2 Phẳng k1–k12 + xác nhận r2/r3/r5/r8

| Chỉ số | Pre-fix j1–j12 | **Post-fix k1–k12** | **Xác nhận r (load4, cây cuối)** |
|---|---|---|---|
| Lượt hợp lệ | 12/12 | 12/12 (+2 chạy lại k6/k12 mtime-đổi) | **4/4** |
| tailDriftGate | 53 | **87** | **34** |
| tailBursts | 16 | **45** | **10** |
| Đuôi (tổng / tuổi trung vị) | 25 / 2102 ms | **26 / 5013 ms** (max 5313 ms) | — |
| Đuôi đóng khi drift vượt | 3 (đều adv=0, UNKNOWN) | **12** | **11** |
| f4-like (nhãn analyzer) | 0 | **9** | **11** |
| Đuôi đóng do watch mới arm tiếp quản | 18 | **12** | **7** |
| resyncsV tăng tổng | 16 | **24** | **16** |

**Kiểm tay toàn bộ 20 ca mang nhãn f4-like (9 k + 11 r): TẤT CẢ đều là đóng do TRẦN 5000 ms** (tuổi 5001–5313 ms, adv=0 ở 19/20 ca, adv=1 ở 1 ca k4-nhưng-tuổi-5179-ms-vẫn-là-trần), **0 ca là đóng ADV2**. Mẫu sự kiện giống hệt nhau ở cả 20 ca (xem 1 ca k4): element đóng băng ở ct cố định ~2,4 s trong lúc playhead bị giữ (hold R2) → đuôi sống tới trần → drift re-seek bắn (drift thật +0,4…+1,0, element đang kẹt) → element seeking 2,5–4,5 s trong lúc playhead tiếp tục bị giữ → seek HOÀN TẤT (seeking→False, ct chạy tiếp). Nhãn "kẹt seek" của analyzer chỉ đếm ph đóng băng ≥2,5 s — ở đây ph đóng băng là **hold-while-seeking theo thiết kế R2** (playhead vốn đã đứng yên từ trước khi close), không phải seek không bao giờ xong như f4 gốc (5,5 s+).
**Phân bố:** 0 ca trong 7 lượt ngoài cửa sổ đói (k1/k9/k7/k11/k10 + chạy lại k6/k12), 20 ca trong 9 lượt load4 (k2/k3/k4/k5/k8 + r2/r3/r5/r8). 2 lượt load4 post-fix (k5, r5) và 1 lượt (r8) không đạt localPh 5,0 trong 40 s (stopped=false) — phát chỉ đạt ~0,11× realtime.

## §5. D6-A vẫn bị bác — đo lại trên dữ liệu mới (không thử lại D6-A)

Chạy lại script `quantify-*-burst-vs-stable.py` của D6 (đủ 3 tiêu chí: blocks/s ≥ 4 + đóng băng 0% + biên drift ≤ 0,10 s) trên dữ liệu post-fix:
- Phẳng k (21 đuôi bị chặn): trung vị blocks/s **0,82** (kỳ vọng ổn định ~5/s), đóng băng trung vị **50%**, biên drift trung vị **0,367 s**, nhảy vọt Δct ≥ 0,30 s: **47/364** khoảng mẫu → **0/21 đuôi** đạt đủ 3 tiêu chí.
- Nested p (10 đuôi bị chặn): blocks/s trung vị **1,40**, đóng băng trung vị **14%**, biên drift trung vị **0,471 s**, nhảy vọt **40/103** → **0/10 đuôi** đạt đủ 3 tiêu chí.
- Mô phỏng D6-A trên dữ liệu mới vẫn "trông đẹp" (đóng sớm 7 đuôi phẳng / 7 đuôi nested) — đúng cái bẫy D6 §2 đã chỉ ra: mô phỏng trên drift tại mẫu probe không phân biệt được "ổn định" với "đáp lặp lại của burst". **Không land D6-A, không hạ trần** (lý do D6 §3 còn nguyên).

## §6. Nợ mở mới — tỉ lệ đóng-trần trên phẳng load4 tăng (CHƯA XÁC ĐỊNH NGUYÊN NHÂN)

**Hiện tượng (số đo thật, không giấu):** phẳng load4 pre-fix: 0 lần đóng trần / 6 lượt (tuổi đuôi max 4913 ms, element đóng băng tối đa 0,8–1,1 s). Phẳng load4 post-fix: **20 lần đóng trần kèm resync sau / 9 lượt** (tuổi 5001–5313 ms, element đóng băng tối đa 2,1–3,4 s). Tuổi đuôi trung vị phẳng: j 2102 ms → k 5013 ms.

**Đã loại trừ:**
- **Không phải gate tính sai drift sau fix:** §3.1 chứng minh drift phẳng sau fix bằng đúng drift trước fix (cùng object spec / cùng mapping). 0 lần đóng ADV2 khi drift vượt sau fix trên cả phẳng lẫn nested.
- **Không phải E4 làm lệch luật đuôi:** thay đổi của E4 lúc 06:28 (`driftConfirmSkip103E4.ts` — vị ngữ thuần + ghi pending-set trong `syncMedia`) chỉ quyết định **bỏ qua 1 lần vẽ** (renderFrame) ở tick xác nhận drift đầu tiên; nó không chạm decoder, `currentTime`, luật đuôi/grace, hay playhead. Không có đường cơ chế nào từ đó tới việc element đóng băng lâu hơn. (Ghi rõ: đây là loại trừ bằng đọc code, không phải bằng thí nghiệm A/B — xem dưới.)
- **Không phải lỗi harness mới:** verdict probe PASS ở mọi lượt hợp lệ; các lượt lỗi harness (pause-seek) là họ lỗi cũ đã biết.

**Còn mở (confound chưa tách được):**
- Cửa sổ đói 06:29–06:33 trùng với probe CDP của E3 (run-a2 06:29, run-b2 06:32, file JSON 2,7–3,1 MB) + E9 poll; nhưng 4 lượt xác nhận r (06:44–06:48, máy yên theo loadavg 0,72 trước đó) vẫn cho 11 ca — nên "E3 chen ngang" không giải thích hết.
- RAM khả dụng giảm dần trong đợt (E9 poll: 3062 MB lúc 06:10 → 1820 MB lúc 06:30 → 1291 MB lúc 06:50); 2 lượt load0 chạy kiểm chứng sau đó đều chết vì WebKit **"Target crashed"** tại `setInputFiles` khi RAM còn ~1,5 GB (xem §7) — môi trường cuối đợt đã yếu, có thể decoder GStreamer đói RAM chứ không chỉ đói CPU.
- Không có bản sao cây pre-fix để chạy A/B trực tiếp (không git trong `~/workspace/repo-1`); E5 không tự ý revert fix để thử nghiệm giữa đợt (sẽ làm lệch cây của các luồng khác + E9 đang poll md5).

**Đề xuất cho đợt sau (không tự làm trong lượt này):** chạy lại ma trận phẳng load4 trên máy yên (không luồng nào khác chạy probe song song, RAM khả dụng ≥ 2,5 GB) để xem tỉ lệ đóng-trần có về mức pre-fix không; nếu vẫn cao thì A/B có kiểm soát (tắt E5 bằng cờ hook tạm thời, hoặc tắt E4) mới được kết luận nguyên nhân. **Cho tới lúc đó: không trích "phẳng f4-like 0/12" — con số trung thực là "0 đóng ADV2; 20 đóng trần kèm resync (đánh đổi C3) / 9 lượt load4 post-fix".**

## §7. Nợ môi trường + sự cố trong lượt (ghi rõ, không giấu)

- **Boot 9576eac3 (reboot #27 ~05:26:18Z) suốt đợt, không reboot.** RAM khả dụng ~1,2 GB lúc bắt đầu lượt, ~1,5–1,9 GB lúc cuối (E9 poll: 1291 MB lúc 06:50).
- **Sibling sửa `preview.tsx` liên tục (chấp nhận được theo tiền lệ D6, nhưng làm lệch nhiều lượt):** E3 (F8 relabel) lúc 05:48:53 / 05:50:58 / 05:53:18 (md5 `ed260e62` → `96a17695` → `35e6dae4`); E4 (driftConfirmSkip) lúc 06:28:14 (+`driftConfirmSkip103E4.ts`) và 06:28:22 (md5 → `997cf9e0` → `4e954101`); 1 lần sửa không rõ luồng lúc 06:38:03 (md5 → `c2251e39`). Marker E5 ×9 + C3 ×12 còn nguyên sau mọi lần sửa (kiểm lại cuối lượt). Lượt nào mtime đổi giữa chừng thì **loại theo quy định** (pre-fix: n5/n6/n7, j9; post-fix: k6/k12) và chạy lại sạch. Vùng đuôi/grace/flatten của E5 không trùng vùng sửa của E3 (motion blur, dòng ~1249–3005) hay E4 (drift-confirm, dòng ~56–59, ~4787–4797, ~5302).
- **Lỗi harness pause-seek (họ cũ h9/i1/i7/i10):** "pause-seek tới t=5 không xác nhận được sau 30s" — pre-fix n6 ×2, n8 ×1, j10 ×2, j12 ×1; chạy lại PASS ngay. Không tính lượt lỗi vào số lượt hợp lệ.
- **Driver đọc nhầm file stale (tự gây ra, đã sửa):** lượt n6 chạy lại lần 2 exit=2 nhưng driver báo "mtime-đổi=CÓ" vì `probe-results.json` cũ (lượt 1) vẫn nằm trong thư mục. Từ đó driver xóa `probe-results.json` + `FAILED-MTIME.txt` cũ trước mỗi lượt (đã áp cho driver post-fix + chạy lại).
- **Load0 kiểm chứng bị chặn bởi môi trường:** s1 (2 lần: 1 lần chết lặng sau S0, 1 lần `page.setInputFiles: Target crashed`) + s2 (chết lặng) — WebKit target crash khi RAM khả dụng ~1,5 GB; không phải kết quả sản phẩm. Không cố chạy lại lần 3 (môi trường đã yếu + runtime restart giữa chừng làm gián đoạn lệnh nền — xem dưới).
- **Runtime restart giữa chừng:** lệnh nền chạy 2 lượt load0 bị gián đoạn bởi runtime restart (thông báo recovery lúc ~06:57Z); kiểm lại sau restart: không còn process probe/vite nào sống, repo + fix còn nguyên (md5 `c2251e39`, marker E5 ×9). Không lặp lại thao tác đã chạy mà không rõ kết quả (chỉ chạy lại s1 một lần sau khi đã kiểm trạng thái — vẫn crash như trên).
- **tsc "0 lỗi" chạy 2 lần** (lúc land fix + trên cây cuối) — đều 0, không có lỗi thoáng qua như D6.
- **G1 vẫn mở, chờ user quyết. TTS 39 và birefnet vẫn cấm. ci-security.yml vẫn 403** (chờ user).

## §8. Hồi quy (cây cuối `c2251e39`, sau mọi sửa đổi + kiểm chứng)

- `tsc` web: **0 lỗi** (chạy 2 lần: cây lúc land fix `03fab95d` + cây cuối `c2251e39`).
- `vite build`: **PASS** (6,71 s, trên cây lúc land fix).
- `playheadHold90R2.test.ts`: **75/75** (65 cũ + 10 C3-R1..R10 — không thêm test mới vì không đổi luật lib; helper `driftTargetForTailElement101C3` không export nên không có test đơn vị trực tiếp — kiểm chứng bằng probe live nested p1–p8, xem §4.1).
- `playheadPacing54K9.test.ts`: **19/19**; `previewEngine.test.ts`: **27/27** (chạy lại trên cây cuối, vẫn xanh).
- Không sửa production nào ngoài `preview.tsx` (vùng đuôi/grace/flatten); không đụng TTS 39, không thử birefnet, không đụng ci-security.yml, không push/tag/release.

## Phụ lục — file liên quan

- Fix: `apps/web/src/preview.tsx` (md5 lúc land `03fab95d`, md5 cây cuối `c2251e39` — chênh do sibling sửa vùng khác sau đó; marker 103E5 ×9, 101C3 ×12 còn nguyên). Không đổi: `apps/web/src/lib/playheadHold90R2.ts` (md5 `00cce1ac`).
- Probe + analyzer mới (E5, stage trong batch này): `apps/web/scripts/probe103e5.mjs` (bản sao probe102d6 + cờ `--nested` + kiểm chứng flatten), `apps/web/scripts/analyze103e5-tail-expiry.mjs` (bản sao analyze102d6, đổi nhãn kết luận).
- Phân tích số liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e5/` (`analyze-n-full.txt`, `analyze-j-full.txt`, `analyze-p-full.txt`, `analyze-k-full.txt`, `analyze-r-full.txt`, `analyze-*-traj.txt`, `quantify-k.txt`, `quantify-p.txt`, `run-e5-prefixed.log`, `run-e5-rerun.log`, `run-e5-postfix.log`, `retry-n6.log`, `retry-j10.log`, `retry-k6.log`, `retry-k12.log`, `confirm-r2/r3/r5/r8.log`, `confirm-s1.log`, `confirm-s1-retry.log`, `probe-webkit-load*-{n,j,p,k,r,s}*/probe-results.json` + `probe-log.txt` — 20 lượt pre-fix hợp lệ + 20 lượt post-fix hợp lệ + 4 lượt xác nhận r + 2 lượt load0 lỗi).
- Doc tiền lệ: `docs/PHASE9_ROUND102_D6_REARM_LIMITS.md` (§2 D6-A bị bác, §4 baseline i1–i12), `docs/PHASE9_ROUND101_C3_REARM_LIMITS.md` (§2 drift-gate + fail-open nested, §4.1 đóng trần, §6 caveat), `docs/PHASE9_ROUND102_LIMITS.md` §4 mục 5 (nợ gốc).
- Stage (không push): `~/workspace/repo-1-push/paths-loop/phase9-round103-e5-rearm.txt` (4 entry, NUL, read-back OK).

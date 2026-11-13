# Phase 9 — Đợt 92 — T4: Dời cổng fail fast lên trước pre-pass

**Đợt:** 92 — **Luồng:** T4 — **Ngày:** 2026-11-12 (giờ +07) — **VM đo:** 4 vCPU, 8 GB RAM, ffmpeg 8.1.2, Python 3.12.3, Node v24.22.1
**Nợ đóng:** LIMITS gộp đợt 91 §4 mục 4 (= S4 §3 mục 3) — pre-pass vẫn vẽ video mask ~10s trước khi cổng fail fast ném lỗi ở case S4-F.
**Phạm vi:** `server/render/src/render.js` (tách cổng thành hàm + gọi sớm) + 1 test mới + doc này. KHÔNG đụng TTS 39, không đụng workflow, không push.
**Kết quả tổng:** test mới **32/32** + S4 chạy lại **60/60** + P1 **30/30** + nested adjustment e2e **43 pass / 0 fail** (1 PENDING có sẵn) + adjustment render **39/39** + adjustment unit **46/46** + adjustment spec **21/21** + tsc web **0 lỗi** + vite build **PASS (11,36s)**.

---

## 1. Đã làm gì

### 1.1 Vấn đề (đo ở S4)

Cổng fail fast adjustment-layer tách clip nằm trong `buildFilterGraph` (bước 6) — SAU mọi pre-pass: vidstab detect (3b), GPU probe (3c), font (4), text SR PNG, mask PNG R2, mask anim D4. Job S4-F (layer 1–3s cắt clip 0–4s có mask keyframes) vẽ video mask xong rồi mới chết: exit 1 đúng, 0 warn, không MP4 — đúng hành vi, sai thời gian. Đo ngay trước sửa, lượt này: **5,1s** (S4 ghi 10,7s ở lượt 91 dưới tải nặng hơn).

### 1.2 Thay đổi (`server/render/src/render.js`, production duy nhất đổi ở đây)

Cổng chỉ đọc `spec` + `transitions` (thuần, không phụ thuộc output pre-pass nào) nên chạy sớm cho cùng kết quả, chỉ nhanh hơn:

1. **Tách cổng thành hàm thuần `checkAdjLayerSplitConflicts(spec, transitions)`** (mới, đặt ngay trước `buildFilterGraph`): lặp track video không hidden theo chỉ số track gốc (giống cũ — scope layer là chỉ số trong `spec.tracks` đã flatten), tính `mergeInvolved` từ transitions, `splitClipByLayers` từng clip, ném đúng 6 thông điệp cũ **nguyên văn 100%** (transition / speedKeyframes / animations / motion track / enhance.stabilize / mask keyframes) để test cũ và log bridge không đổi.
2. **`main()` gọi sớm ngay sau validateSpec + validateMedia (sau bước 3), trước bước 3b** (vidstab detect), 3c (GPU probe), 4 (font), text SR PNG, mask PNG R2, mask anim D4. Vị trí này giữ nguyên thứ tự lỗi với validate/plugin/media (2/2b/3 vẫn trước cổng, như cũ); chỉ các bước sau 3 mới bị cổng vượt mặt (xem §4 mục 3).
3. **`buildFilterGraph` gọi lại cổng ở đầu hàm** (phòng thủ khi dựng graph trực tiếp) và **bỏ khối cổng inline** trong vòng mở rộng clip — vòng đó nay chỉ split + expand, không kiểm tra lại. `mergeInvolved` vẫn tính trong vòng lặp vì bước chuẩn hoá sau đó còn dùng cho quyết định giữ kênh alpha.
4. Lỗi vẫn throw không catch — Node in stack ra stderr, exit 1, **giống hệt** hành vi cũ khi cổng ném trong `buildFilterGraph` (xem §4 mục 4 về việc chưa gọn hoá thông điệp).

Không đổi: `validate.js`, `adjustment.js`, `mask.js`, `mask_anim.py`, `mask_png.py`, mọi pre-pass, mọi wording cổng.

### 1.3 Các cổng được dời (cả 6, không chỉ mask keyframes)

| Cổng | Thông điệp | Pre-pass nào từng chạy thừa trước khi chết |
|---|---|---|
| Transition (xfade giao layer) | `adjustment layer giao với clip dính transition` | không đáng kể (không mask/vidstab) — dời để khóa chung |
| speedKeyframes | `…cắt giữa clip có speedKeyframes` | không đáng kể |
| animations | `…cắt giữa clip có animations keyframes` | không đáng kể |
| motion track | `…cắt giữa clip có motion track` | không đáng kể |
| enhance.stabilize | `…cắt giữa clip có enhance.stabilize` | **vidstabdetect bước 3b** (pass phân tích cả clip) |
| mask keyframes | `…cắt giữa clip có mask keyframes` | **mask anim D4** (vẽ từng frame, ~5–10s ở clip 4s) |

Chỉ 2 cổng cuối từng lãng phí thật; 4 cổng đầu dời cùng lúc vì chung 1 khối `if`, để pre-pass tương lai không tái gây lãng phí cho bất kỳ cổng nào.

---

## 2. Số đo thời gian tiết kiệm (render thật, 1280×720, 30fps, 4s)

Baseline "trước" đo ngay trước sửa, cùng VM/lượt (S4-F-only): **5,1s**. Con số 10,7s trong doc S4 là dưới tải nặng hơn ở lượt 91 — ghi để tham chiếu, không dùng làm baseline.

| Case | Trước | Sau (lượt này) | Tiết kiệm |
|---|---|---|---|
| S4-F / T4-F1 — mask keyframes bị cắt | 5,1s (10,7s ở lượt 91) | **0,2s / 0,3s / 0,3s** (3 lần: F1-only, S4 full, T4-F1) | **~4,8s** so với baseline cùng lượt |
| T4-F2 speedKeyframes | không đo riêng (vốn rẻ) | 0,6s | ~0 (khóa chung, xem §1.3) |
| T4-F3 animations | không đo riêng (vốn rẻ) | 0,3s | ~0 |
| T4-F4 motion track | không đo riêng (vốn rẻ) | 0,4s | ~0 |
| T4-F5 stabilize | không đo riêng trước/sau | 0,3s, **không log `.trf`** | chưa đo số (xem §4 mục 2) |
| T4-F6 transition | không đo riêng (vốn rẻ) | 0,4s | ~0 |
| T4-R1 đối chứng — layer bao trọn, render OK | — | 7,2s / 12,3s (2 lần, dao động theo tải) | — (render thật, không phải tiết kiệm) |

Bằng chứng quyết định (không phụ thuộc tải VM): ở T4-F1, stdout rỗng hoàn toàn, stderr chỉ còn warn audio có sẵn + stack trace của lỗi cổng — **không có log `mask anim "…" →`, không warn `mask anim "…": không vẽ được`, không log `mask anim fallback PNG t=0`, không `.mkv`**. Pre-pass D4 thực sự không chạy. Ở T4-F5 tương tự: **không log `stabilize "c1" → …trf`, không `.trf`** — vidstabdetect không chạy.

Lưu ý khi đọc số: ngưỡng assert `secs < 5s` trong test mới là ngưỡng an toàn dưới tải, không phải con số tiết kiệm — con số tiết kiệm là 5,1s → 0,2–0,3s đo trực tiếp ở trên.

---

## 3. Kiểm chứng

Test mới: `server/render/test_round92_t4_failfast_prepass.js` (32 assert, `T4_SECTIONS=F1|F2|F3|F4|F5|F6|R1`).

| Case | Assert | Kết quả |
|---|---|---|
| T4-F1 mask keyframes bị cắt | 7 | 7/7 — exit 1, đúng thông điệp, 0 warn `mask keyframes:`, không MP4, 0,2–1,3s, không log pre-pass D4, không `.mkv` |
| T4-F2 speedKeyframes bị cắt | 4 | 4/4 — exit 1, đúng thông điệp, không MP4, < 5s |
| T4-F3 animations bị cắt | 4 | 4/4 — như trên |
| T4-F4 motion track bị cắt | 4 | 4/4 — như trên |
| T4-F5 stabilize bị cắt | 6 | 6/6 — exit 1, đúng thông điệp, không MP4, < 5s, không log vidstabdetect/`.trf` |
| T4-F6 transition giao layer | 4 | 4/4 — exit 1, đúng thông điệp, không MP4, < 5s |
| T4-R1 layer bao trọn (đối chứng) | 3 | 3/3 — render OK ra MP4, log `mask anim` + `.mkv` có mặt, tâm mask t=2.0 x=0,5 y=0,5 (keyframes chạy thật) |
| **Tổng** | **32** | **32/32, 0 fail, 1 lần chạy** |

Tổng 32 = F1 7 + F2 4 + F3 4 + F4 4 + F5 6 + F6 4 + R1 3.

### 3.1 Hồi quy chạy lại trên cây đã sửa production

| Suite | Kết quả |
|---|---|
| `test_round91_s4_fallback_warn_ext.js` (S4, 60 assert) | **60/60** (S4-F nay 0,3s; S4-G warn đúng 1 lần, MAD=0,000; S4-H render OK) |
| `test_round88_p1_mask_fallback.js` (P1, nhánh tracked) | **30/30** |
| `test_nested_adjustment_e2e.js` (cổng qua nested flatten) | **43 PROVEN pass, 0 fail**, 1 PENDING có sẵn (không tính là pass — về scope preview vs render, không liên quan đợt này) |
| `test_adjustment_render.js` (đường split/expand) | **39/39** |
| `test_adjustment.js` (unit adjustment) | **46/46** |
| `test_adjustment_spec.js` | **21/21** |
| `node --check` render.js + test mới | OK |
| `tsc --noEmit` (apps/web — không đụng web, chạy lại cho chắc) | **0 lỗi** |
| `vite build` (apps/web) | **PASS 11,36s** (1 warning có sẵn về chunk > 500 kB — không phải lỗi, không do luồng này) |

### 3.2 Bẫy assert đã gặp và sửa (ghi để khỏi mở lại)

Lần chạy T4 đầu 31/32: assert F1 `/mask anim/` fail — không phải vì pre-pass chạy, mà vì **thông điệp cổng tự nó chứa "mask animation"** ("…mask keyframes (mask animation gắn theo thời gian clip…)") và stack trace in cả dòng source throw. Sửa assert thành `/mask anim ("|fallback)/` — chỉ khớp đúng dạng log pre-pass D4 (`mask anim "c1" →`, `mask anim "c1": không vẽ được…`, `mask anim fallback PNG t=0`). Sau sửa: 32/32.

---

## 4. Giới hạn / nợ mở (trung thực)

1. **Ngưỡng giây `< 5s` nhạy tải VM** (F1 đo được 0,2–1,3s qua 3 lần chạy). Assert quyết định là vắng mặt log pre-pass (§2), không phải ngưỡng giây; ngưỡng chỉ là lưới phụ.
2. **Tiết kiệm cho stabilize (F5) chưa đo trước/sau bằng số.** Chỉ khóa được vidstabdetect không chạy (không log `.trf`); số giây tiết kiệm thực tế phụ thuộc độ dài clip và chưa đo — không tuyên bố con số.
3. **Thứ tự lỗi đổi với spec xung đột kép sau bước 3.** Spec vừa dính cổng vừa lỗi ở bước 3b/3c/4 (vidstab detect fail, thiếu font, GPU probe fail…) trước đây báo lỗi bước đó trước, nay cổng báo trước. Cùng exit 1; spec chỉ 1 lỗi thì không đổi gì. Đây là đổi có chủ đích (fail fast cấu trúc trước), không phải hồi quy.
4. **Cổng vẫn throw không catch** — stderr có stack trace Node (dạng lỗi cũ giữ nguyên). Chưa gọn hoá thành 1 dòng `❌ …` + exit 1 như validate; nếu đợt sau làm thì phải cập nhật cả test S4-F/T4-F1 (hiện assert stderr chứa thông điệp — vẫn pass nếu giữ nguyên chuỗi thông điệp).
5. **Chỉ track video qua cổng** (giống cũ); track image không có adjustment split nên không dính cổng — không đổi, không mở rộng.
6. **Cổng chạy 2 lần mỗi render** (main + đầu buildFilterGraph) — lần 2 chỉ split lại, không pre-pass, chi phí ~ms. Đánh đổi để giữ phòng thủ khi dựng graph trực tiếp; không tối ưu thêm.
7. **Chưa đo:** clip dài hơn (mask anim 30s+ thì tiết kiệm lớn hơn nhiều — suy ra tuyến tính theo thời lượng clip, chưa đo số); `--dry-run` — cổng vẫn chặn trước khi in câu lệnh (suy ra từ vị trí gọi, chưa test riêng, không tuyên bố).
8. Không đụng: TTS 39, file workflow, `mask_anim.py`, `mask_png.py`, `mask.js`, `validate.js`, `adjustment.js`, `apps/web`.

## 5. Kết luận — nợ LIMITS gộp đợt 91 §4 mục 4: ĐÓNG HOÀN TOÀN

- Cổng fail fast nay chạy ngay sau validate (trước mọi pre-pass): S4-F 5,1s → 0,2–0,3s, **tiết kiệm ~4,8s**, exit 1 + thông điệp + 0 warn + không MP4 giữ nguyên, pre-pass D4 chứng minh không chạy bằng vắng mặt log.
- Cả 6 cổng cùng khối đều dời (transition / speedKeyframes / animations / track / stabilize / mask keyframes), mỗi cổng có test riêng; stabilize khóa thêm vidstabdetect không chạy.
- Hành vi đúng không đổi: layer bao trọn render OK + pre-pass vẫn chạy (T4-R1), mask tĩnh bị cắt render OK (S4-H), warn đúng 1 lần (S4-G), hồi quy không shim chạy video `.mkv` thật (S4-C).

## 6. File đổi/thêm (stage, không push)

- `server/render/src/render.js` (sửa — tách `checkAdjLayerSplitConflicts`, gọi sớm ở `main()`, gọi lại ở đầu `buildFilterGraph`, bỏ khối cổng inline)
- `server/render/test_round92_t4_failfast_prepass.js` (mới, 32 assert)
- `docs/PHASE9_ROUND92_T4_FAILFAST_PREPASS_LIMITS.md` (mới, file này)
- Batch stage: `phase9-round92-t4-failfast-prepass.txt` (3 file text).

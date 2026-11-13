# Phase 9 — Đợt 91 — S4: Mở rộng warn fallback keyframes (image + trackgeq + warn lặp)

**Đợt:** 91 — **Luồng:** S4 — **Ngày:** 2026-11-12 (giờ +07) — **VM đo:** 4 vCPU, 8 GB RAM, ffmpeg 8.1.2, Python 3.12.3, Node v24.22.1
**Nợ đóng:** LIMITS gộp đợt 90 §4 mục 4 — cả 3 nợ còn lại của R4 §3 (image clip + mask keyframes chưa đo riêng; warn geq-mode cho `--mask-mode trackgeq` không track chưa có test riêng; warn site in lặp theo số đoạn nếu clip bị adjustment layer tách).
**Phạm vi:** KHÔNG sửa production — chỉ 1 test mới + doc này. `server/render/src/render.js` không đổi (kết luận mục (c) là "không cần sửa", đã khóa bằng test). KHÔNG đụng TTS 39, không đụng workflow, không push.
**Kết quả tổng:** test mới **60/60 xanh trong 1 lần chạy** + P1 chạy lại **30/30** + tsc web **0 lỗi** + vite build **PASS (20.87s)**; mọi MAD = **0,000**.

---

## 1. Đã làm gì

### 1.1 (a) Image clip + mask keyframes: ĐÃ ĐO RIÊNG — hành vi giống hệt video (R4 §3 mục 1: ĐÓNG)

Image clip đi chung nhánh `maskChainForSite` (`render.js:950`, site image) và chung pre-pass D4 (vòng `video|image` ở `render.js:1762`), nên suy luận từ trước là "giống video" — nay đo thật cả 3 tầng:

| Case | Ép | Kết quả |
|---|---|---|
| S4-A (image, mask_anim fail → PNG t=0) | shim anim | warn pre-pass có; log `mask anim fallback PNG t=0` có; **KHÔNG warn site `mask keyframes:`** (mirror video R4-A); tâm tĩnh 0,3 ở mọi t; **MAD=0,000** vs image tĩnh x=0,3 |
| S4-B (image, cả 2 fail → geq t=0) | shim cả 2 | warn pre-pass `PNG fallback cũng thất bại` có; **warn site `mask keyframes: không vẽ được video mask (xem log pre-pass)` + `KHÔNG chạy keyframes` có**; tâm tĩnh 0,3; **MAD=0,000** vs image tĩnh geq x=0,3 |
| S4-C (image, hồi quy, không shim) | — | **KHÔNG warn fallback nào**; video `.mkv` chạy thật; tâm 0,35/0,5/0,65 theo keyframes |

### 1.2 (b) Warn geq-mode cho `--mask-mode trackgeq` không track: ĐÃ CÓ TEST RIÊNG (R4 §3 mục 2: ĐÓNG)

R4-D chỉ đo mode `geq`. Nay S4-D đo đúng mode `trackgeq` không track: warn site in đúng chữ `--mask-mode trackgeq không chạy keyframes → mask tĩnh tại t=0` (wording dùng `${ctx.maskMode}` nên tự đúng tên mode, không cần sửa code); KHÔNG warn `không vẽ được video mask`, KHÔNG log fallback PNG, không `.mkv` (pre-pass bị bỏ qua ở mode này); tâm tĩnh 0,3; **MAD=0,000** vs tĩnh geq x=0,3.

Thêm S4-E khóa nhánh đối xứng (không có trong nhiệm vụ gốc nhưng cùng 1 `if`): keyframes **CÓ track** + `--mask-mode trackgeq` → track LÁI mask theo thiết kế O3, keyframes bị bỏ qua — **KHÔNG có warn `mask keyframes:` nào** (cũng không có warn `mask bám track:` vì đường trackgeq không qua nhánh tracked png); tâm mask bám track đúng 0,425/0,5/0,575 tại t=1/2/3 (track 0,35 → 0,65 trong 4s).

### 1.3 (c) Warn site in lặp theo số đoạn khi clip bị adjustment layer tách: ĐÃ KIỂM TRA HÀNH VI THẬT — KHÔNG CẦN SỬA (R4 §3 mục 3: ĐÓNG)

Nghi ngờ ở R4 §3 mục 3 là: clip bị tách thành N đoạn thì `maskChainForSite` chạy N lần → warn in N lần. Đo thật cho thấy **không thể xảy ra** với mask keyframes, vì cổng fail fast chặn trước:

- **S4-F:** adjustment layer cắt giữa clip có mask keyframes (layer 1–3s trên clip 0–4s) → job **FAIL, exit 1**, stderr chứa đúng `adjustment layer cắt giữa clip có mask keyframes` (cổng `render.js:664`), **0 lần** warn site `mask keyframes:`, **không ra MP4**. Job chết ở bước dựng graph — trước cả khi `maskChainForSite` được gọi lần nào — nên warn không thể lặp.
- **S4-G:** cùng clip + layer **bao trọn** clip (0–4s, `parts == 1`, không tách) + shim cả 2 fail → render OK, warn site `mask keyframes:` xuất hiện **ĐÚNG 1 lần** (đếm bằng regex trên stderr), tâm tĩnh 0,3, **MAD=0,000** vs tĩnh geq cùng layer (brightness 20 áp cả 2 bên nên triệt tiêu trong MAD).
- **S4-H:** mask **tĩnh** (không keyframes) bị layer cắt thành 3 đoạn → render OK, **KHÔNG warn nào** — nhánh mask tĩnh không có warn nên đường tách đoạn tự nó không sinh warn lặp.

**Kết luận thiết kế (ghi rõ để khỏi mở lại):** warn site keyframes tối đa **1 lần / 1 clip có keyframes** — vì mọi clip có mask keyframes bị tách đều chết ở cổng fail fast trước khi warn có cơ hội in. Cùng luật áp cho nhánh tracked (cổng track ở `render.js:656`). Không sửa production; hành vi đã khóa bằng S4-F/G/H.

---

## 2. Kiểm chứng (render thật, 1280×720, 30fps, 4s)

Nguồn: video đỏ trơn 1280×720 4s + ảnh đỏ trơn 1280×720 (cache `~/workspace/q4-media-cache`, mẫu R4); mask ellipse w=0,3 h=0,5; keyframes x 0,3 → 0,7. Ép fail bằng shim `python3` trên PATH riêng của tiến trình render con (mẫu P1/Q4/R4).

Test mới: `server/render/test_round91_s4_fallback_warn_ext.js` (60 assert, `S4_SECTIONS=A|B|C|D|E|F|G|H`).

| Case | Assert | Kết quả |
|---|---|---|
| S4-A image PNG fallback | 13 | 13/13 — MAD=0,000 |
| S4-B image geq fallback | 11 | 11/11 — MAD=0,000 |
| S4-C image hồi quy | 7 | 7/7 — keyframes chạy thật |
| S4-D trackgeq không track | 10 | 10/10 — MAD=0,000 |
| S4-E trackgeq có track | 6 | 6/6 — track lái 0,425/0,5/0,575 |
| S4-F layer cắt keyframes | 4 | 4/4 — exit 1, 0 warn, không MP4 |
| S4-G layer bao trọn, đếm warn | 6 | 6/6 — warn đúng 1 lần, MAD=0,000 |
| S4-H mask tĩnh bị cắt 3 đoạn | 3 | 3/3 — render OK, 0 warn |
| **Tổng** | **60** | **60/60, 0 fail, 1 lần chạy** |

### 2.1 Chú thích đếm

Tổng 60 = A 13 + B 11 + C 7 + D 10 + E 6 + F 4 + G 6 + H 3. S4-A có 13 assert (thêm 1 probe điểm ngoài ellipse so với mẫu R4-A 12 assert — giữ 2 probe trong + ngoài để khóa hình học ellipse image).

### 2.2 Hồi quy chạy lại trên cây không đổi production

| Suite | Kết quả |
|---|---|
| `test_round88_p1_mask_fallback.js` (P1, nhánh tracked — không đổi code) | **30/30** (A 13 + B 10 + C 7; MAD=0,000 cả 2 cặp đối chiếu) |
| `tsc --noEmit` (apps/web) | **0 lỗi** (chạy lại trực tiếp, exit 0) |
| `vite build` (apps/web) | **PASS 20.87s** (2 warning có sẵn về chunk > 500 kB + dynamic import userLut — không phải lỗi, không do luồng này) |
| `node --check` test mới | OK |

Thời gian render dao động mạnh theo tải VM (lượt này: geq image S4-B 71,6s / đối chiếu geq 54,4s; trackgeq có track S4-E 51,2s; PNG image S4-A 11,3s) — số MAD và tâm mask ổn định tuyệt đối (0,000) qua mọi lượt, như R4 đã ghi. S4-F chỉ 10,7s vì job chết ở cổng fail fast trước khi encode (pre-pass mask anim vẫn chạy trước cổng — xem §3 mục 3).

---

## 3. Giới hạn / nợ mở (trung thực)

1. **Nguyên nhân fail là giả lập (shim PATH), không phải lỗi thật của `mask_anim.py`.** Đường code fallback + warn thì thật 100% (spawn thật, exit != 0 thật, nhánh warn thật), nhưng chưa có lần nào helper fail tự nhiên trên production. Như P1 §5.1 / R4 §3 mục 1.
2. **Chỉ kiểm chứng ellipse, keyframes x, 1280×720, 4s.** Chưa đo: image clip + mask keyframes + invert (video đã có R4-E; image invert suy ra cùng nhánh — chưa đo, không tuyên bố); keyframes w/h thay đổi trên image; `--mask-mode trackgeq` + image clip có track (đường trackgeq cho image chưa đo riêng).
3. **S4-F: pre-pass vẫn vẽ video mask trước khi cổng fail fast ném lỗi** (pre-pass ở `main()` chạy trước `buildFilterGraph`): job cắt keyframes tốn ~10s vẽ mask video rồi mới chết — lãng phí nhỏ nhưng không sai kết quả; nếu muốn fail nhanh hơn thì phải dời cổng kiểm tra lên trước pre-pass (đề xuất cho vòng sau, không tự làm trong luồng test-only này).
4. **Warn geq-mode in cho MỌI render keyframes ở mode geq/trackgeq** (kể cả khi người dùng chủ đích chọn geq) — chủ đích từ R4 (báo rõ thay vì lặng lẽ); nếu thấy ồn thì đợt sau có thể hạ xuống log thường. S4-D/E khóa hành vi hiện tại bằng test nên đổi wording sau này phải cập nhật cả test.
5. Không đụng: TTS 39, file workflow, `mask_anim.py`, `mask_png.py`, `mask.js`, pre-pass D4/O2, `render.js` (không đổi 1 dòng production).

## 4. Kết luận — nợ LIMITS gộp đợt 90 §4 mục 4: ĐÓNG HOÀN TOÀN

- (a) Image clip + mask keyframes đo riêng: hành vi fallback/warn **giống hệt** video ở cả 3 tầng (PNG / geq / hồi quy), MAD=0,000.
- (b) Warn geq-mode cho `--mask-mode trackgeq` không track nay có test riêng (S4-D); nhánh đối xứng có track cũng khóa bằng test (S4-E: track lái, không warn).
- (c) Warn site keyframes **không thể** in lặp theo số đoạn: cổng fail fast giết job trước khi warn có cơ hội in (S4-F: 0 warn, exit 1); layer bao trọn cho đúng 1 warn (S4-G); mask tĩnh bị cắt không sinh warn (S4-H). Không sửa production.

## 5. File đổi/thêm (stage, không push)

- `server/render/test_round91_s4_fallback_warn_ext.js` (mới, 60 assert)
- `docs/PHASE9_ROUND91_S4_FALLBACK_WARN_EXT_LIMITS.md` (mới, file này)
- Batch stage: `phase9-round91-s4-fallback-warn-ext.txt` (2 file text).

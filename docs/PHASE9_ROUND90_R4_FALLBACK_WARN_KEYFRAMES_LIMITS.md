# Phase 9 — Đợt 90 — R4: Warn cấp site cho nhánh keyframes fallback

**Đợt:** 90 — **Luồng:** R4 — **Ngày:** 2026-11-11 (UTC) — **VM đo:** 4 vCPU, 8 GB RAM, ffmpeg 8.1.2, Python 3.12.3, Node v24.22.1
**Nợ đóng:** LIMITS gộp đợt 89 §4 mục 4 — "Fallback warn cấp site cho keyframes" (quan sát 1 + quan sát 2 LIMITS Q4 §4).
**Phạm vi:** 1 file production (`server/render/src/render.js`, nhánh `maskChainForSite`) + 1 test mới + doc này. KHÔNG đụng TTS 39, không đụng workflow, không push.
**Kết quả tổng:** test mới **49/49 xanh trong 1 lần chạy** + P1 chạy lại **30/30** + Q4 spot-check D4+GEQ **46/46**; mọi MAD = **0,000**.

---

## 1. Đã làm gì

### 1.1 Quan sát 1 (Q4 §4.1) — warn site cho nhánh keyframes fallback: ĐÃ SỬA

Nhánh keyframes trong `maskChainForSite` (`server/render/src/render.js`) trước đây rơi về geq tĩnh t=0 **lặng lẽ** khi cả 2 helper đều thất bại — warn chỉ có ở log pre-pass (`mask anim "...": PNG fallback cũng thất bại`). Nay mirror đúng mẫu warn site của nhánh tracked:

```js
// mode png, cả 2 helper đều thất bại → geq tĩnh t=0:
⚠️  mask keyframes: không vẽ được video mask (xem log pre-pass) →
mask tĩnh tại t=0 (KHÔNG chạy keyframes, mask đứng yên theo thiết kế D4)
```

Đối chiếu nhánh tracked (không đổi):

```js
⚠️  mask bám track: không vẽ được video mask (xem log pre-pass) →
mask tĩnh tại t=0 (KHÔNG bám track, clip đứng yên theo thiết kế O2/O3)
```

**Quyết định thiết kế (ghi rõ để khỏi tranh cãi ở đợt sau):** tầng PNG fallback của nhánh keyframes **KHÔNG** có warn site — đúng mirror nhánh tracked (IMG-A / P1-A cũng chỉ có warn pre-pass ở tầng PNG, không có warn site). Lý do: PNG fallback vẫn là đường "nhanh, đúng pixel" (MAD=0 so với mask tĩnh); warn site chỉ dành cho tầng cuối geq — nơi mask rơi về đường chậm và là tín hiệu "cả 2 helper đều hỏng". Test R4-A assert rõ sự vắng mặt này (`KHÔNG có warn site 'mask keyframes:' ở tầng PNG`).

### 1.2 Quan sát 2 (Q4 §4.2) — keyframes "không chạy" ở mode geq: ĐÃ SỬA (nhỏ, có test)

Ở `--mask-mode geq` / `trackgeq`, pre-pass bị bỏ qua theo thiết kế nên mask keyframes luôn tĩnh tại t=0 mà trước đây không một dòng nào báo. Nay cùng nhánh keyframes in thêm warn riêng khi rơi về geq tĩnh vì lý do mode (không phải vì helper fail):

```js
⚠️  mask keyframes: --mask-mode geq không chạy keyframes →
mask tĩnh tại t=0 (hành vi theo thiết kế, xem LIMITS)
```

Wording cố tình **KHÔNG** chứa cụm "không vẽ được video mask" và "fallback PNG" để không phá các assert absence của Q4 GEQ-B (`KHÔNG warn 'không vẽ được video mask'`, `KHÔNG log fallback PNG`) — đã kiểm chứng bằng Q4 spot-check GEQ 46/46 (xem §3). `ctx.maskMode` luôn là một trong png|geq|trackgeq (mặc định `"png"`, validate ở `render.js` ~365–371) nên không có trường hợp in `undefined`.

---

## 2. Kiểm chứng (render thật, 1280×720, 30fps, 4s)

Nguồn: video đỏ trơn 1280×720 4s; mask ellipse w=0,3 h=0,5; keyframes x 0,3 → 0,7 (t=0: 0,3; t=0,5: 0,35; t=2,0: 0,5; t=3,5: 0,65). Ép fail bằng shim `python3` trên PATH riêng của tiến trình render con (mẫu P1/Q4 — chỉ fail khi argv chứa `mask_anim.py` / `mask_png.py`).

Test mới: `server/render/test_round90_r4_fallback_warn_keyframes.js` (49 assert, `R4_SECTIONS=A|B|C|D|E`).

| Case | Ép | Kết quả |
|---|---|---|
| R4-A (keyframes, mask_anim fail → PNG t=0) | shim anim | warn pre-pass có; log `mask anim fallback PNG t=0` có; **KHÔNG warn site `mask keyframes:`** (đúng thiết kế §1.1); tâm tĩnh 0,3 ở mọi t; **MAD=0,000** vs tĩnh x=0,3 |
| R4-B (keyframes, cả 2 fail → geq t=0) | shim cả 2 | warn pre-pass `PNG fallback cũng thất bại` có; **warn site MỚI `mask keyframes: không vẽ được video mask (xem log pre-pass)` + `KHÔNG chạy keyframes` có**; tâm tĩnh 0,3; **MAD=0,000** vs geq tĩnh x=0,3 |
| R4-C (hồi quy, không shim) | — | **KHÔNG warn fallback nào** (cả `không vẽ được video mask` lẫn `mask keyframes:`); video `.mkv` chạy thật; tâm 0,35/0,5/0,65 theo keyframes |
| R4-D (keyframes + `--mask-mode geq`, shim cả 2) | shim cả 2 | **warn site MỚI `--mask-mode geq không chạy keyframes` có**; KHÔNG warn `không vẽ được video mask`, KHÔNG log fallback PNG, không `.mkv`; tâm tĩnh 0,3; **MAD=0,000** vs geq tĩnh x=0,3 |
| R4-E (keyframes + invert, cả 2 fail → geq invert t=0) | shim cả 2 | warn site `mask keyframes:` có; centroid vùng đỏ (0,5262; 0,4992) ≈ kỳ vọng phần bù (0,527; 0,5); trong ellipse đen, ngoài đỏ; **MAD=0,000** vs invert tĩnh geq x=0,3 |

`node --check` cho cả `src/render.js` và test mới: OK.

### 2.1 Hồi quy chạy lại trên cây đã sửa

| Suite | Kết quả |
|---|---|
| `test_round88_p1_mask_fallback.js` (P1, nhánh tracked — không đổi code) | **30/30** |
| `test_round89_q4_mask_fallback_ext.js` với `Q4_SECTIONS=D4,GEQ` | **46/46** (D4 27 + GEQ 19 assert; GEQ-B vẫn giữ đúng các assert absence dù warn geq-mode mới xuất hiện) |

Thời gian render dao động mạnh theo tải VM (lượt này: R4-B 25,9s / đối chiếu geq 28,4s; Q4 D4-B 74,9s, GEQ-A 85,6s; cùng case Q4 trước đây 20,8s lúc VM nhẹ) — số MAD và tâm mask ổn định tuyệt đối (0,000) qua mọi lượt, như Q4 đã ghi.

---

## 3. Giới hạn / nợ mở (trung thực)

1. **Nguyên nhân fail là giả lập (shim PATH), không phải lỗi thật của `mask_anim.py`.** Đường code fallback + warn thì thật 100% (spawn thật, exit != 0 thật, nhánh warn thật), nhưng chưa có lần nào helper fail tự nhiên trên production. Như P1 §5.1.
2. **Chỉ kiểm chứng clip video + keyframes, mode png/geq.** Chưa đo riêng: image clip + mask keyframes (dùng chung nhánh `maskChainForSite` ở `render.js:931` nên suy ra giống — chưa đo, không tuyên bố); `--mask-mode trackgeq` không track + keyframes (warn sẽ in `--mask-mode trackgeq không chạy keyframes`, đúng chữ nhưng chưa có test riêng — R4-D chỉ đo mode geq).
3. **Warn site in 1 lần cho mỗi site gọi `maskChainForSite`.** Clip bị adjustment layer tách thành nhiều đoạn sẽ in warn lặp lại theo số đoạn — cùng hành vi với warn site của nhánh tracked, chấp nhận được (stderr, không phải lỗi).
4. **Warn geq-mode in cho MỌI render keyframes ở mode geq/trackgeq** (kể cả khi người dùng chủ đích chọn geq) — đây là chủ đích của quan sát 2 Q4 (báo rõ thay vì lặng lẽ), nhưng nếu thấy ồn thì đợt sau có thể hạ xuống log thường; không tự đổi trong luồng này.
5. Không đụng: TTS 39, file workflow, `mask_anim.py`, `mask_png.py`, `mask.js`, pre-pass D4/O2.

## 4. Kết luận — nợ LIMITS gộp đợt 89 §4 mục 4: ĐÓNG

- Nhánh keyframes fallback nay có warn cấp site mirror nhánh tracked (chỉ tầng geq, cả 2 helper fail); tầng PNG giữ nguyên chỉ warn pre-pass như tracked.
- Mode geq/trackgeq + keyframes nay warn rõ "không chạy keyframes → mask tĩnh tại t=0" thay vì lặng lẽ (quan sát 2 Q4).
- Render đúng pixel ở mọi tầng fallback (MAD=0,000); không warn thừa khi render bình thường (R4-C).

## 5. File đổi/thêm (stage, không push)

- `server/render/src/render.js` (sửa: warn site nhánh keyframes + comment đầu hàm)
- `server/render/test_round90_r4_fallback_warn_keyframes.js` (mới, 49 assert)
- `docs/PHASE9_ROUND90_R4_FALLBACK_WARN_KEYFRAMES_LIMITS.md` (mới, file này)
- Batch stage: `phase9-round90-r4-fallback-warn-keyframes.txt` (3 file text).

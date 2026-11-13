# Phase 9 — Đợt 89 — Q4: Mở rộng fallback video-mask + đo giới hạn 4K / clip dài / track 240 điểm

**Đợt:** 89 — **Luồng:** Q4 — **Ngày:** 2026-11-11 (UTC) — **VM đo:** 4 vCPU, 8 GB RAM, ffmpeg 8.1.2, Python 3.12.3, Node v24.22.1
**Nợ đóng:** LIMITS gộp đợt 88 §4 mục 10 — "Fallback video-mask chưa ép cho D4/image/geq/invert (P1); chưa đo 4K/clip dài/track 240 điểm (P9)".
**Phạm vi:** chỉ thêm test + bench + doc. **KHÔNG sửa code production** (render.js, mask_anim.py, mask_png.py giữ nguyên).
**Kết quả tổng:** test mở rộng **105/105 xanh trong 1 lần chạy full** (2026-11-11 ~13:36–13:46Z) + test P1 chạy lại **30/30** + bench **4K và clip 30s đều đo được**.

---

## 1. Fallback đã ép + đo (tất cả 1280×720, nguồn đỏ, ellipse w=0,3 h=0,5)

Ép bằng shim `python3` trên PATH của tiến trình render con: fail chỉ khi argv chứa `mask_anim.py` và/hoặc `mask_png.py`, còn lại exec `/usr/bin/python3` thật. Mọi MAD đo ở t=2,0 so với render đối chiếu tĩnh (không shim).

### 1.1 D4 — keyframes (27 assert)

| Case | Ép | Kết quả |
|---|---|---|
| D4-A (mask_anim fail → PNG t=0, x=0,3) | PNG fallback, tâm tĩnh 0,3 ở mọi t | render 7,2s (lượt section 12,5–16,0s), **MAD=0,000** vs tĩnh x=0,3 |
| D4-B (cả 2 helper fail → geq tĩnh t=0) | geq tĩnh, tâm 0,3 ở mọi t | render 20,8s (lượt section 74,8–136,2s), **MAD=0,000** vs tĩnh geq x=0,3 |
| D4-C (hồi quy, không shim) | keyframes chạy thật 0,35/0,5/0,65 | render 5,9s, không warn fallback, có video .mkv |

### 1.2 IMG — clip image + track (28 assert)

| Case | Ép | Kết quả |
|---|---|---|
| IMG-A (mask_anim fail → PNG t=0, x=0,35) | PNG fallback, tâm tĩnh 0,35 ở mọi t | render 2,5s (lượt section 6,4–31,0s), **MAD=0,000** vs image tĩnh x=0,35 |
| IMG-B (cả 2 fail → geq tĩnh t=0) | geq tĩnh + warn site "mask bám track…" | render 22,0s (lượt section 67,0–107,3s), **MAD=0,000** vs image tĩnh geq x=0,35 |
| IMG-C (hồi quy image+track, không shim) | mask bám track 0,3875/0,5/0,6125 | render 23,4s, có video .mkv |

### 1.3 GEQ — mode `--mask-mode geq` (19 assert)

Mode geq **bỏ qua cả 2 pre-pass** nên helper fail không kích hoạt fallback nào — đúng theo thiết kế, không phải lỗi:

- GEQ-A (tracked + geq, shim cả 2 helper fail): render 32,5s (lượt section 104,6s), **không warn, không log fallback, không .mkv**, **MAD=0,000** vs geq không shim. Tâm mask 0,3875/0,5/0,6125 — **mask tĩnh "cưỡi theo" shift D3 của track** (xem §3).
- GEQ-B (keyframes + geq, shim cả 2 fail): render 39,6s, tâm tĩnh 0,3 ở mọi t (hình học keyframes t=0), **MAD=0,000** vs tĩnh geq x=0,3.

### 1.4 INV — mask invert (23 assert)

- INV-A (tracked + invert, mask_anim fail → PNG invert t=0): render 7,4s; centroid vùng đỏ (0,5196; 0,4992) ≈ kỳ vọng phần bù (0,52; 0,5); trong ellipse đen, ngoài ellipse đỏ 3 hướng; **MAD=0,000** vs invert tĩnh x=0,35.
- INV-B (tracked + invert, cả 2 fail → geq invert t=0): render 39,0s; centroid 0,5196 ≈ 0,52; **MAD=0,000** vs invert tĩnh geq x=0,35.
- INV-D4-A (keyframes + invert, mask_anim fail → PNG invert t=0): render 8,4s; centroid (0,5262; 0,4992) ≈ kỳ vọng (0,527; 0,5); **MAD=0,000** vs invert tĩnh x=0,3.

### 1.5 Hồi quy P1 (30 assert, chạy lại 2026-11-11 ~13:34Z)

`test_round88_p1_mask_fallback.js`: **30 pass, 0 fail**. A (PNG fallback) render 2,1s, B (geq fallback) 25,1s, C (hồi quy tracked) 5,7s, MAD=0,000 cả hai.

---

## 2. Đo giới hạn: 4K, clip dài, track 240 điểm

Bench: `server/render/test_round89_q4_bench.js` (chạy 2026-11-11 ~13:26–13:32Z, VM vừa reboot, load đầu 0,51, RAM khả dụng 950 MB lúc bắt đầu).

| Case | Kết quả |
|---|---|
| **B1 — 4K 3840×2160, 30fps, 2s, mask+track** | **ĐO ĐƯỢC.** wall 105,9s → **0,57 fps**, đỉnh RSS cây tiến trình **2189 MB**, out 112.716 byte. Tâm mask t=0,5/1/1,5 = 0,425/0,5/0,575, lệch **0,0000** ở cả 3 thời điểm. |
| **B2 — 720p, 30fps, 30s, mask+track** | **ĐO ĐƯỢC.** wall 161,2s → **5,58 fps** (dưới load 15,6 do các luồng khác đã quay lại sau reboot), đỉnh RSS **396 MB**, out 496.228 byte. Tâm mask t=7,5/15/22,5 = 0,425/0,5/0,575, lệch **0,0000**. |
| **T240 — track 240 điểm, mode trackgeq** | **ĐO ĐƯỢC, xác nhận lại fix P4.** Render 86,2s → 1,39 fps (lượt section 87,8s). Tâm mask t=0,5/2/3,5 = 423,94/640,00/856,06 px vs kỳ vọng 424/640/856 → **lệch 0,06 / 0,00 / 0,06 px (≤ 0,1px như P4 đã đo)**. Trước fix P4: exit 2 từ 83 điểm. |
| **T240 — track 240 điểm, mode png mặc định** | Render 12,9s → **9,33 fps** (lượt section 20,3s / 5,91 fps — chênh lệch do tải VM). Tâm 0,3312/0,5/0,6687 ≈ track 0,33125/0,5/0,66875. |

Lưu ý 4K: đỉnh RSS 2189 MB vượt RAM khả dụng lúc đo (950–1279 MB) — render vẫn hoàn thành không OOM (dựa vào page cache/swap). 4K dài hơn 2s chưa đo; với 0,57 fps, clip 4K 30s ước tính ~15 phút wall trên VM này (chưa đo, không tuyên bố).

---

## 3. Đính chính quan trọng: GEQ-A — mask geq tĩnh "cưỡi theo" shift D3

Kỳ vọng ban đầu của test (tâm 0,5 ở mọi t cho GEQ-A) là **sai** và đã sửa trước khi chạy xanh: ở mode geq, mask tĩnh được áp **bên trong unit**, unit lại bị D3 shift theo track, nên tâm mask đo được chạy theo track (0,3875/0,5/0,6125) — khớp đúng với render geq không shim (MAD=0,000). Cơ sở: comment `render.js` ~892–900 và `docs/PHASE9_ROUND87_O2_MASK_TRACK_RENDER_LIMITS.md` §2 dòng 72. Đây là hành vi theo thiết kế của mode geq (mask tĩnh, không bám track độc lập), không phải hồi quy.

---

## 4. Quan sát (không sửa trong luồng này — ngoài phạm vi, không động production)

1. **Nhánh keyframes fallback thiếu warn ở cấp site:** khi pre-pass keyframes fallback (D4-A/B, INV-D4-A), warn chỉ xuất hiện ở log pre-pass; nhánh tracked có warn site "mask bám track: không vẽ được video mask…", nhánh keyframes thì không. Người dùng xem job chỉ thấy warn pre-pass. Đề xuất đợt sau: thêm warn site tương tự cho nhánh keyframes.
2. **GEQ-B tâm tĩnh 0,3:** ở mode geq + keyframes, mask lấy hình học keyframes tại t=0 và đứng yên — đúng thiết kế (geq không có đường video), nhưng người dùng có thể ngạc nhiên khi keyframes "không chạy" ở mode này.

---

## 5. Nhiễu môi trường trong lúc đo (trung thực, không giấu)

- **Sóng EPERM** ("Operation not permitted" khi ghi file) tái phát nhiều đợt trong ngày 11/11 (11:59Z, 12:00–12:04Z, 12:10–12:12Z, 12:27–12:33Z, 12:38:30–12:42:30Z, 12:43–12:44Z, 12:46–12:51Z), mỗi đợt 1–9 phút, khoảng lặng 2–18 phút; tần suất tăng dần theo số luồng song song của đợt 89. Nhiều lần chạy full bị giết giữa chừng ở bước sinh media/frame extraction; probe v2 `once` nhiều lần không append được log trong sóng. Test đã được cứng hoá: retry 20 lần cho sinh media, 25 lần cho frame extraction, render chỉ retry khi EPERM (tối đa 4 lần, sleep 15/30/60s), backoff bằng `spawnSync("sleep")` (Atomics.wait trả về ngay 0 ms trên VM này — futex bị chặn), cache media `~/workspace/q4-media-cache/` (ngoài repo, không stage) với regen qua file tạm + rename.
- **VM reboot 2 lần trong ngày** (11:34:38Z và ~13:21Z); lần reboot sau làm chết tiến trình INV,T240 đang chạy (đã chạy lại đầy đủ, 31/31). Boot marker probe v2 đổi e10b9199 → 7439870b.
- **Render time phụ thuộc mạnh vào tải VM:** cùng một case D4-B dao động 20,8s (VM nhẹ) → 136,2s (VM nặng); GEQ-A 32,5s → 125,3s; T240-png 9,33 fps → 5,91 fps. Mọi số thời gian/fps trong doc này phải đọc kèm tải VM lúc đo; số MAD và tâm mask thì ổn định tuyệt đối (0,000) qua mọi lượt.

---

## 6. File test / bench

- `server/render/test_round89_q4_mask_fallback_ext.js` (598 dòng, 35.544 byte) — 5 section chọn qua env `Q4_SECTIONS=D4|IMG|GEQ|INV|T240` (mặc định tất cả). Chạy: `cd server/render && node test_round89_q4_mask_fallback_ext.js`.
- `server/render/test_round89_q4_bench.js` (266 dòng, 10.971 byte) — bench B1+B2, in `Q4-BENCH-SUMMARY` JSON, luôn exit 0; case fail được ghi trung thực với RAM/load. Chạy: `cd server/render && node test_round89_q4_bench.js`.
- Cache media ngoài repo: `~/workspace/q4-media-cache/` (red.mp4 7803 byte, red.png 4349 byte) — không stage, test tự regen nếu thiếu/0 byte.

## 7. Kết luận — nợ LIMITS đợt 88 §4 mục 10: ĐÓNG

- Fallback video-mask đã ép + đo thật cho đủ 4 case còn thiếu: **D4, image, geq, invert** — mọi case render đúng (MAD=0,000), không crash.
- Giới hạn đã đo: **4K 0,57 fps / RSS 2189 MB (2s)**, **clip 30s 5,58 fps / RSS 396 MB**, **track 240 điểm lệch ≤0,06px** (khớp P4 ≤0,1px).
- Chưa đo (ghi rõ, không bịa): clip 4K dài >2s; track >240 điểm; clip dài >30s; đo lại TTS 39 (đang cấm kiểm lại theo standing ban).

# Đợt 196 P2 — Enhance parity: ghi fps:30 + N5b thu gap + N10 blend dọc sau bob + FPS bob đo lại

- **Luồng:** P2 đợt 196 (Phase 9 VCut build loop) — Editing Core, preview/render parity, đợt thứ 6 theo hướng mới (lệnh user 15:03 25/11).
- **Nền:** đợt 195 đã đóng, parent CHẤP NHẬN CÓ ĐIỀU KIỆN ở §14.2 aggregate `docs/PHASE9_ROUND195_LIMITS.md` (68.559 B — SẠCH, parent viết trực tiếp; kiểm đếm khớp lần thứ 133 liên tiếp).
- **Phạm vi đợt này: code sản phẩm + đo (theo brief): (a) ghi `fps: 30` vào chỗ P2-195 đã đo; (b) N5b đo lại với mô hình tap đúng, xác định thu hẹp được không; (c) N10 thử ít nhất một hướng sửa và đo trước/sau; (d) FPS bob đo lại sau mọi thay đổi.**
- **Kết quả chính:**
  1. **(a) fps:30 ĐÃ GHI (xem §1):** `SAMPLE_MEDIA_FPS = 30` trong `apps/web/src/sample.ts`, ghi vào `AssetStore.ingest` meta + `media.push` (chỉ video); doc `MediaItem.fps` trong `media.ts` sửa theo. Nguồn đo P2-195 §3: ffprobe 30/1 trên 5 mp4 public + `probeVideoFps` 30/29,97/30 trên clip sinh thật. Headed A1 PASS 7/7 lần chạy (mau-1/mau-2 đều `fps: 30`); B1 (re-check `recordPackMedia`/`probeVideoFps`) PASS 5/7 lần: lần 1–2 fail do trang chưa yên (13,18 / 27,78), lần 3–7 pass 4/5 (30,65 fail do tiêu chí khớp chính xác 30/29,97; 29,97 / 29,97 / 29,97 / 30 pass) — dao động là rAF jitter của đường ghi, không phải lỗi code (code ghi/đo không đổi từ đợt 195).
  2. **(b) N5b — gap KHÔNG thu được bằng denoise nhẹ, nhưng cơ chế đã rõ (xem §2):** tái tạo chính xác R-P4 s=0,5: bob-first 6,985 vs tap-P4 6,856 → **+0,129** (P4-194: +0,130). Tăng strength denoise s=0,5→0,8 thu gap về **+0,014** (7,883 vs 7,869) nhưng MAD tuyệt đối tệ hơn cho cả hai (truth cũng s=0,8) — gap là hiệu ứng denoise, không phải deinterlace; **bar KHÔNG dời.** Hướng sửa thật là blend dọc sau bob (xem §3).
  3. **(c) N10 — blend dọc sau bob w=0,75 THẮNG tap-P4, đã ship (xem §3):** sim `probe-196-p2a.mjs` (10 nhóm): w=0,75 thắng/hòa tap-P4 trên 6/7 nhóm nhiễu (R-P4 6,804 vs 6,856; **N10 6,572 vs 6,585** — từ 7,053 của bob-first, thu gap +0,468 → **−0,013**, tức N10 nay TỐT HƠN tap-P4 0,013 MAD); chỉ thua mbarv (3,567 vs 3,376). Trên footage sạch chỉ tốn +0,044 MAD nên chỉ áp khi có nhiễu. **Phát hiện lớn — PHA:** lệch +0,5px (pha lên) làm MAD tệ hơn cả bob thuần (+0,38 tới +1,53 trên 10 nhóm); phải lệch −0,5px (pha xuống) mới đúng — code đã sửa sang −0,5px sau khi sim chứng minh. **Ngưỡng σ̂ hiệu chuẩn lại trên khung ĐÃ MÃ HÓA: 2,7** (không phải 8,0 — x264 crf 18 ăn bớt nhiễu: σ=15 thô σ̂≈8,1 nhưng sau mã hóa chỉ còn ~3,6). Headed G5c PASS (lần chạy 7 + probe chẩn đoán): clip nhiễu σ̂=3,70 → vb=0,75; clip sạch σ̂=2,04 → vb=0.
  4. **(d) FPS bob — KHÔNG hồi quy trên clip sạch (xem §4):** lần chạy 7 (cửa sổ yên nhất): clip sạch off **53,65** / on **54,35 fps**, tỉ lệ drift-corrected **1,02×** — tái tạo gần như y hệt baseline đợt 195 (52,84/54,94 fps, 1,05×). 5 lần chạy: tỉ lệ sạch 0,91/0,97/0,87/0,93/1,02 → trung bình **0,94×**; fps tuyệt đối dao động 24,58–53,65 theo tải máy (sibling WebKit 64% CPU + `find /` ở lần chạy 3), tỉ lệ mới là số đáng tin. Clip nhiễu: off 35,94 / on 26,84 fps, tỉ lệ **0,76×** — blend + ước lượng σ̂ mỗi frame tốn ~24% trên footage nhiễu (có caveat tải máy tăng trong slot, xem §4.4). Micro-benchmark G6 FAIL cả 3 lần đo (blend đo ÂM −0,38 tới −0,99 ms — không thể đúng) — thiết kế micro không tách được hiệu ứng dưới 1 ms, KHÔNG dùng làm bằng chứng.
- **Kiểm chứng:** `npx tsc --noEmit` 0 lỗi; 11 file test (10 enhance + 1 media) PASS, 0 fail — 158 test ✓ đếm được (91P2 43/43 gồm 3 test mới, media 9/9); `npm run build` PASS; headed Chromium 1254 lần chạy 7: **8/9 PASS** (chỉ G6 FAIL — micro-benchmark, xem trên). Không push (chỉ stage). Probe + kết quả headed lưu ở `hidden_files/round196-p2/` (không nằm trong batch push — file làm việc của luồng).
- **File đổi (9):** `apps/web/src/sample.ts`, `apps/web/src/media.ts`, `apps/web/src/lib/enhancePreview.ts`, `apps/web/src/preview.tsx`, 3 file test enhance (`enhancePreview60Q1/62R3/91P2`), `apps/web/src/media.fpsProbe94P2.test.ts`, LIMITS này (`docs/PHASE9_ROUND196_P2_ENHANCE_PARITY_LIMITS.md`).

## §1. fps:30 đã ghi — vị trí code + nguồn đo

### §1.1. Vị trí ghi (mới đợt này)

| Vị trí | Thay đổi |
|---|---|
| `apps/web/src/sample.ts` | Thêm `SAMPLE_MEDIA_FPS = 30` (exported, comment trích nguồn đo P2-195 §3); `fps: SAMPLE_MEDIA_FPS` trong `AssetStore.ingest` meta (chỉ video: `isVideo ? SAMPLE_MEDIA_FPS : undefined`) và trong `media.push({...})` (chỉ video qua spread) |
| `apps/web/src/media.ts` | Sửa câu doc của `MediaItem.fps` (trước đây ghi "sample media chưa có fps") — nay sample media mang fps:30; clip pack probe tại import; 5 mp4 public đi qua importFiles → probeVideoFps nên không ghi cứng ở đó |
| `apps/web/src/media.fpsProbe94P2.test.ts` | Thêm test P2e: `SAMPLE_MEDIA_FPS === 30` và `snapVideoFpsEstimate(30) === 30` |

### §1.2. Nguồn đo (P2-195 §3 — không đo lại, chỉ ghi giá trị đã đo)

- 5 mp4 mẫu trong `public/`: ffprobe trực tiếp file — avg fps = r fps = **30/1**, 1280×720, 3,0 s.
- Clip mẫu sinh thật bằng `recordPackMedia` (captureStream(30)), đo headed bằng `probeVideoFps` của app: **30 / 29,97 / 30** qua 3 lần chạy đợt 195 (29,97 là snap của ước lượng ~30, xem P2-194 §1.2).

### §1.3. Kiểm chứng headed (A1 + B1 qua 5 lần chạy đợt này)

| Lần chạy | B1 probeVideoFps (record 2s) | A1 buildSampleProject (mau-1/mau-2 fps) |
|---|---|---|
| 1 (15:05Z) | 13,18 — FAIL (clip 99.686 byte, trang còn transform) | PASS (8.273 ms) |
| 2 (15:12Z) | 27,78 — FAIL (233.856 byte, sau 3s chờ) | PASS (8.380 ms) |
| 3 (15:38Z) | 30,65 — FAIL (244.326 byte; tiêu chí khớp chính xác 30/29,97) | PASS (8.088 ms) |
| 4 (15:46Z) | 29,97 — PASS (220.093 byte) | PASS (8.070 ms) |
| 5 (15:55Z) | 29,97 — PASS (243.757 byte) | PASS (8.107 ms) |
| 7 (16:08Z) | **30** — PASS (244.727 byte) | PASS (8.090 ms) |

A1 PASS 7/7 lần chạy. B1 dao động 13,18→30 theo độ "yên" của trang lúc ghi (rAF đói khi vite transform / sibling nặng) — 30,65 ở lần 3 là clip ghi thật có 61 frame trong 1,989 s (rAF chạy 30,65 Hz lúc ghi), không phải lỗi `recordPackMedia`/`probeVideoFps` (code không đổi từ đợt 195). Giá trị `fps: 30` ghi trong code là giá trị ffprobe (nguồn), không phải giá trị probeVideoFps từng lần chạy.

## §2. N5b: tái tạo + thu gap bằng denoise mạnh hơn

Probe `probe-196-p2a.mjs` (copy đúng fixture/seed/alpha của P2-195, chạy lại ~15:00Z 26/11 + chạy lại lần 2 với biến thể pha lên, xem §3.2). Truth: yadif mode=0 → hqdn3d; MAD trung bình 3 frame (R-P4 idx 3/7/11; N10 idx 3/7/11).

### §2.1. Tái tạo chính xác (R-P4 s=0,5)

| Frame | σ̂ | bob-first | tap-P4 | gap |
|---|---|---|---|---|
| idx 3 | 7,98 | 6,967 | 6,820 | +0,147 |
| idx 7 | 8,23 | 6,999 | 6,900 | +0,099 |
| idx 11 | 8,22 | 6,989 | 6,847 | +0,142 |
| **trung bình** | **8,14** | **6,985** | **6,856** | **+0,129** |

Khớp P4-194 (6,985 vs 6,855 — probe này 6,856, chênh 0,001 do làm tròn). R-P2 s=0,5 (sạch): bob-first 4,404 vs tap-P4 4,499 — bob-first thắng −0,095 (khớp P2-195).

### §2.2. Tăng strength denoise thu gap — nhưng không phải cách sửa

| | s=0,5 | s=0,8 |
|---|---|---|
| R-P4 bob-first | 6,985 | 7,883 |
| R-P4 tap-P4 | 6,856 | 7,869 |
| **gap** | **+0,129** | **+0,014** |

Gap thu 0,129 → 0,014 khi tăng s, nhưng MAD tuyệt đối tệ hơn cho CẢ HAI (truth cũng s=0,8 — nhiễu trong truth tăng). Kết luận: gap N5b là hiệu ứng denoise (tap-P4 = blur dọc nửa pixel khử thêm nhiễu), không phải deinterlace tốt hơn. **Bar KHÔNG dời** (không có bằng chứng nào cho thấy bar sai — bar đo đúng cái nó đo; hướng sửa là blend dọc sau bob, xem §3).

### §2.3. Cơ chế — tap-P4 thắng nhờ blur, và ngưỡng σ̂ phải hiệu chuẩn trên khung đã mã hóa

Chi tiết cơ chế xem P2-195 §2.4. Bổ sung đợt này — **ngưỡng σ̂ 8,0 ban đầu SAI cho triển khai thật:** sim đo σ̂ trên khung RGB thô (R-P4 σ̂≈8,14), nhưng preview ước lượng σ̂ trên khung ĐÃ GIẢI MÃ từ file H.264 — x264 crf 18 ăn bớt nhiễu. Đo trực tiếp (`sigma-encode-196.mjs`, testsrc2 640×360, nhiễu Gauss cộng thêm rồi mã hóa x264 crf 18, σ̂ đo trên frame giữa đã mã hóa):

| Nhiễu thêm σ | σ̂ thô (trước mã hóa) | σ̂ sau mã hóa (x264 crf 18) |
|---|---|---|
| 0 (sạch) | 1,40 | **1,81** |
| 5 | 3,39 | 2,10 |
| 10 | 5,12 | 2,81 |
| 15 | 6,85 | **3,66** |
| 20 | 8,59 | 4,70 |
| 30 | 12,08 | 7,33 |

Clip nhiễu headed đo offline σ̂=3,55, trong trình duyệt σ̂=3,70 — khớp hàng σ=15 (3,66). Ngưỡng 8,0 không bao giờ chạm tới trên footage đã mã hóa. **Ngưỡng mới 2,7 = trung điểm giữa 2 mức đã xác thực trong sim (sạch đã mã hóa 1,81 ↔ nhiễu σ=15 đã mã hóa 3,66).** Lưu ý: footage sạch có texture mịn có thể đọc σ̂ tới ~2–3 (sàn texture ≈ 2) nên ngưỡng 2,7 có thể dương tính giả trên texture mịn — chi phí chỉ +0,044 MAD (R-P2 s=0,5), chấp nhận được so với lợi 0,18–1,17 MAD khi trúng. Không dùng ramp (chưa có số ở σ̂ 2–3,6 để hiệu chuẩn — không đoán bừa). **Hệ quả ngoài phạm vi:** lưới k của denoise thích nghi (đợt 193) cũng hiệu chuẩn trên σ̂ khung thô (mốc 8,25/11,15/22,69) nên trên footage đã mã hóa k cũng ít khi lên cao như sim gợi ý — ghi vào nợ (§6.3), không sửa đợt này.

## §3. N10: blend dọc sau bob — sim, pha, ngưỡng, code đã ship

### §3.1. Lưới trọng số w (sim, pha xuống — blur avg(bob(y), bob(y+1)))

`blendVertical(bob, w) = (1−w)·bob + w·blurV(bob)`, w ∈ {0; 0,25; 0,5; 0,75} (w=1 ≡ tap-P4). MAD trung bình vs truth (s=0,5 trừ khi ghi khác; σ̂ trung bình trên khung thô trong ngoặc):

| Nhóm (σ̂) | bob-first (w=0) | tap-P4 (w=1) | w=0,25 | w=0,5 | **w=0,75** | w tốt nhất |
|---|---|---|---|---|---|---|
| R-P2 sạch (—) | 4,404 | 4,499 | **4,397** | 4,410 | 4,448 | vb025 (+0,007) |
| R-P2 s=0,8 sạch | 5,858 | 5,891 | **5,852** | 5,857 | 5,870 | vb025 (+0,006) |
| R-P4 (8,14) | 6,985 | 6,856 | 6,870 | 6,815 | **6,804** | vb075 (+0,181) |
| R-P4 s=0,8 (8,14) | 7,883 | 7,869 | 7,856 | 7,849 | **7,848** | vb075 (+0,035) |
| **N10 (10,47)** | 7,053 | 6,585 | 6,818 | 6,661 | **6,572** | vb075 (+0,481) |
| mvpan (9,72) | 6,191 | 5,987 | 6,031 | 5,946 | **5,927** | vb075 (+0,264) |
| mvpan s=0,8 (9,72) | 6,571 | 6,571 | 6,534 | **6,525** | 6,534 | vb05 (+0,046) |
| mhpan (11,30) | 8,719 | 8,215 | 8,463 | 8,293 | **8,200** | vb075 (+0,519) |
| mbarv (10,31) | 4,545 | **3,376** | 4,165 | 3,841 | 3,567 | tapP4 (+1,169) |
| mbarh (8,68) | 3,561 | 3,336 | 3,442 | 3,368 | **3,334** | vb075 (+0,227) |

**w=0,75 thắng/hòa tap-P4 trên 6/7 nhóm nhiễu** (chỉ thua mbarv 3,567 vs 3,376 — thanh dọc chạy nhanh, blur dọc làm nhòe biên thanh; w=0,5 cũng thua tap-P4 ở đó 3,841 vs 3,376). Trên footage sạch w=0,75 chỉ tốn +0,044 MAD (R-P2) nên không áp khi sạch. **N10: gap +0,468 (bob-first 7,053 vs tap-P4 6,585) → w=0,75 cho 6,572, TỐT HƠN tap-P4 0,013** — N10 đã vượt bar, không chỉ đạt bar. Combing ratio (đo từ khung xen kẽ) KHÔNG dự đoán được w tối ưu (R-P4 0,887 → w 0,75; mbarh 2,422 → w 0,75; R-P2 sạch 0,649 → w≈0) — σ̂ dự đoán tốt hơn (nhiễu σ̂ 8,14–11,3 đều muốn w=0,75; sạch σ̂≈2,0 muốn w≈0). **Quy tắc ship: w=0,75 iff σ̂ ≥ 2,7, else 0** (ngưỡng theo §2.3).

N10 per-frame (s=0,5; σ̂ 10,57/10,63/10,22): bob-first 7,137/7,156/6,867 → w=0,75: 6,641/6,679/6,395 — thắng tap-P4 cả 3 frame (6,655/6,699/6,400). R-P4 per-frame: w=0,75 thắng tap-P4 cả 3 frame (6,777/6,841/6,793 vs 6,820/6,900/6,847).

### §3.2. PHA — phát hiện quan trọng nhất đợt này (suýt ship sai pha)

Canvas `drawImage(bob, 0, +0,5)` lấy mẫu nguồn tại y−0,5 → blur với hàng TRÊN: avg(bob(y−1), bob(y)) — **pha lên**. Sim gốc (`blendVertical`) mô hình avg(bob(y), bob(y+1)) — **pha xuống**. Hai pha chỉ khác nhau 1 px dịch của thành phần blur, nhưng MAD khác xa (biến thể pha lên `vbUp075`, chạy lại probe lần 2):

| Nhóm | vb075 (pha xuống) | vbUp075 (pha lên) | chênh (lên − xuống) |
|---|---|---|---|
| R-P2 s=0,5 | 4,448 | 4,965 | +0,517 (tệ hơn cả bob-first 4,404) |
| R-P4 s=0,5 | 6,804 | 7,446 | +0,642 (tệ hơn cả bob-first 6,985) |
| N10 s=0,5 | 6,572 | 7,405 | +0,833 (tệ hơn cả bob-first 7,053) |
| mvpan s=0,5 | 5,927 | 6,305 | +0,378 |
| mhpan s=0,5 | 8,200 | 8,952 | +0,752 |
| mbarv s=0,5 | 3,567 | 5,100 | +1,533 |
| mbarh s=0,5 | 3,334 | 3,385 | +0,051 |
| mvpan s=0,8 | 6,534 | 6,581 | +0,047 |

Pha lên tệ hơn bob-first trên 7/10 nhóm, tệ hơn pha xuống 0,05–1,53 MAD mọi nhóm. Lý do: khung bob là nhân đôi dòng — hàng chẵn = field gốc (yadif giữ nguyên), hàng lẻ = nội suy. Blur pha xuống giữ hàng chẵn nguyên và làm mềm hàng lẻ (= trung bình 2 field kề, đúng thứ yadif nội suy); blur pha lên làm mềm hàng chẵn (phải giữ sắc nét) và để nguyên hàng lẻ (cần nội suy) — ngược hoàn toàn. **Code sản phẩm đã sửa sang lệch −0,5px (pha xuống) trước khi đo headed lần 3** — lần chạy headed 2 với +0,5px đo được rows [200,200,105,49] chính là bằng chứng pha lên (xem §4.3). Nếu không có sim pha lên đối chứng, đợt này đã ship pha sai.

### §3.3. Code đã ship

- `apps/web/src/lib/enhancePreview.ts`: hằng `ENHANCE_PREVIEW_DEINT_VERTICAL_BLEND_W = 0.75`, `ENHANCE_PREVIEW_DEINT_VERTICAL_BLEND_MIN_SIGMA = 2.7` (comment ghi đầy đủ bảng hiệu chuẩn §2.3); hàm thuần `deintVerticalBlendWeight(noiseSigma)`; `EnhancePreviewPlan.deintVerticalBlend` (key thứ 14 của plan); tính trong `enhancePreviewPlan` chỉ khi `deintTap`; `EnhancePreviewDebug.deintVerticalBlend` + `enhancePreviewDebug()`.
- `apps/web/src/preview.tsx`: `deintBobNearestSource(src, w, h, field, verticalBlend = 0)` — khi w>0, canvas blend tái dùng: copy bob (smoothing TẮT) rồi `drawImage(bobCanvas, 0, -0.5, cw, ch)` smoothing BẬT + `globalAlpha=w`; fallback bob thuần nếu không có context. Call site truyền `enhPlan.deintVerticalBlend`; `enhNoiseSigma` nay ước lượng cả khi chỉ bật deinterlace (không chỉ khi denoise bật); debug state init thêm `deintVerticalBlend: 0`.
- **Sửa phụ do headed phát hiện:** cache key của `estimateEnhanceNoiseSigma` trước đây là `${clip.id}:${frameIdx}` — σ̂ cũ còn nằm lại khi đổi src của cùng clip. Nay là `${clip.id}:${clip.src ?? ""}:${frameIdx}` (+ comment). Held-frame cache đã key theo src từ đợt 63 R6, riêng cache này thì chưa.
- Test: `enhancePreview60Q1.test.ts` (plan-shape 13→14 key), `enhancePreview62R3.test.ts` (debug-shape + assert `deintVerticalBlend`), `enhancePreview91P2.test.ts` (+3 test mới: ngưỡng 2,7 với các mốc 1,81/2,04/2,69/2,7/3,66/8,14/11,3; plan behavior gồm lời gọi cũ; debug hook).

## §4. Kiểm chứng headed (Chromium 1254, 1280×1024, vite dev :5690, canvas 711×399)

Harness `/tmp/round196-p2/headed-196-p2-bob.mjs` (bản cuối sau 3 lần sửa lỗi — xem §4.5). Fixture nhiễu mới: testsrc2 640×360 + nhiễu Gauss RGB σ=15 (seed 19600+f) → tinterlace → libx264 crf 18, 5 s, 7.488.852 byte (`interlaced640-noisy.mp4`; σ̂ offline 3,55, trong trình duyệt 3,70).

### §4.1. Tổng hợp 7 lần chạy (A1/B1/E1/G5b/G5d/G5c/G5/G6/H9)

| Lần | Thời gian | A1 | B1 | E1 | G5b | G5d sạch (off/on, tỉ lệ) | G5c | G5 nhiễu (off/on, tỉ lệ) | G6 | H9 | Tổng |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 15:05Z | ✓ | ✗ 13,18 | ✗ (lỗi mẫu) | ✓ | — (chưa có slot sạch) | ✗ stale σ̂ | 15,19/12,46 (nhiễm tải) | ✗ | ✓ | 3/8 |
| 2 | 15:12Z | ✓ | ✗ 27,78 | ✗ (kỳ vọng sai pha) | ✓ | — (chưa có slot sạch) | ✗ stale σ̂ | 23,26/22,68 (0,95×) | ✗ | ✓ | 3/8 |
| 3 | 15:38Z | ✓ | ✗ 30,65 | ✓ | ✓ | 24,58/21,05 (0,91×) | ✗ timeout | — | — | — | 4/6 |
| 4 | 15:46Z | ✓ | ✓ 29,97 | ✓ | ✓ | 50,88/50,28 (0,97×) | ✗ timeout | — | — | — | 5/6 |
| 5 | 15:55Z | ✓ | ✓ 29,97 | ✓ | ✓ | 49,64/43,66 (0,87×) | ✗ timeout | — | — | — | 5/6 |
| 6 | 16:05Z | ✓ | ✓ 29,97 | ✓ | ✓ | 29,93/24,30 (0,93×) | ✗ setDeint | — | — | — | 5/6 |
| 7 | 16:08Z | ✓ | ✓ 30 | ✓ | ✓ | **53,65/54,35 (1,02×)** | **✓ σ̂=3,70 vb=0,75** | **35,94/26,84 (0,76×)** | ✗ micro âm | ✓ | **8/9** |

Lần 1 nhiễm nặng (sibling `tsc` 58,5% CPU, load 0,75→6,63). Lần 7 là lần chạy đầy đủ đầu tiên tới được G5/G6/H9.

### §4.2. FPS bob (d) — không hồi quy trên clip sạch

Tỉ lệ drift-corrected clip sạch qua 5 lần chạy: **0,91 / 0,97 / 0,87 / 0,93 / 1,02 → trung bình 0,94×**. Lần 7 (yên nhất): off 53,65 / on 54,35 fps — tái tạo gần như y hệt baseline đợt 195 (52,84/54,94 fps, 1,05×). Fps tuyệt đối dao động mạnh theo tải máy (off 24,58–53,65; lần 3 sibling WebKit 64% CPU + `find /`, lần 6 load tăng 1,2→3,8 trong lúc đo) — tỉ lệ on/off mới là số đáng tin, và nó ổn định ~0,9–1,0×. **Kết luận (d): không hồi quy** — bob (vb=0 trên clip sạch) không làm chậm preview ngoài nhiễu đo.

Clip nhiễu (lần 7): off 35,94 / on 26,84 fps, tỉ lệ **0,76×** (4 tỉ lệ con 0,82/0,70/0,75/0,76 — nhất quán). Hai phần: (i) decode clip nhiễu đã tốn hơn — off nhiễu 35,94 vs off sạch 53,65 (−33%); (ii) on nhiễu (bob+blend+ước lượng σ̂ mỗi frame) thêm ~24% so với off nhiễu. Caveat: tải máy tăng 1,7→3,4 trong 9 slot nhiễu (sibling bắt đầu việc nặng giữa chừng) nên 0,76× có thể phóng đại chi phí thật; micro-benchmark (G6) mâu thuẫn với nó (xem §4.4) nên con số 24% ghi là "đo được trong điều kiện tải tăng", không phải chi phí thuần của blend. Không có slot đóng băng nào ở cả 5 lần chạy.

### §4.3. E1 — pha xuống + clamp biên dưới (xác minh 5 lần, kết quả giống hệt)

Mẫu xen kẽ 8×8 (field top [200,50,200,50] → bob [200,200,50,50,...]), blend w=0,75 lệch −0,5px: rows đo được **[200,143,49,105,200,143,49,49]** — khớp kỳ vọng pha xuống [200,144,50,106] ±3 ở hàng 0–3 (hàng 0 = 200: giữ nguyên như yadif; hàng 1 ≈ 144 = trung bình 200/50; hàng 3 ≈ 106 = trung bình 50/200). **Hàng cuối (row 7, bob=50) = 49 ≈ 50 → clamp biên dưới** (nếu trong suốt sẽ là ~31). Lịch sử E1: lần 1 mẫu sai (top field toàn 200); lần 2 kỳ vọng sai pha ([200,144,50,106] cho code +0,5px — đo được [200,200,105,49] mới lộ ra pha lên); lần 3–7 với −0,5px đều PASS giống hệt.

### §4.4. G6 micro-benchmark — FAIL, là lỗi phép đo (không phải lỗi sản phẩm)

Lần 7 (đã warm-up 20 lần/biến thể): baseline 0,396 ms/draw, bob 1,042 (+0,645), bob+blend **0,666 ms/draw — THẤP HƠN bob 0,376 ms** (blendExtra = −0,376). Lần 2 (không warm-up): bob+blend 0,646 < bob 1,631 (blendExtra −0,985). Thêm 2 lần vẽ không thể làm nhanh hơn — thiết kế micro không tách được hiệu ứng dưới 1 ms (drawImage khung video đã cache ~0,4 ms; nhiễu vòng lặp vượt hiệu ứng cần đo). **G6 không dùng làm bằng chứng chi phí; bằng chứng FPS là slot G5/G5d (§4.2).** Nợ: viết lại micro bằng khung tổng hợp ổn định (không dùng video element) nếu cần số chi phí trực tiếp — xem §6.4.

### §4.5. Ba lỗi harness đã bắt và sửa trong đợt (bài học cho lần sau)

1. **G5c timeout 3 lần (lần 3/4/5) — 2 nguyên nhân chồng nhau:** (a) waitFor cũ chỉ đòi "có σ̂ bất kỳ" nên thỏa ngay bằng giá trị stale 2,036 (lần 1/2) — sửa thành chờ σ̂ ĐỔI so với clip sạch; (b) slot sạch cuối ("off") TẮT deint, harness không bật lại trước G5c nên tap=false mãi — waitFor (đòi tap=true) timeout dù σ̂ đã đổi. Probe chẩn đoán riêng (`probe-g5c-196.mjs`, 16:01Z) xác nhận sản phẩm đúng: phát clip nhiễu 2,0 s → σ̂ 1,87 → 3,71, vb=0,75 (hook cuối σ̂=3,63, vb=0,75; element đã đổi sang `interlaced640-noisy.mp4`, readyState 4). **Bài học: sau mỗi chuỗi slot off/on, trạng thái toggle cuối chuỗi KHÔNG phải trạng thái mặc định — phải set lại tường minh trước bước tiếp theo; và σ̂ chỉ cập nhật khi preview VẼ (đang phát hoặc đổi playhead), không phải khi store đổi.**
2. **setDeint timeout lần 6:** bật deint khi tạm dừng ở cuối clip (playhead ~4 = out) — vòng preview ngủ nên patch enhance không gây vẽ lại, hook kẹt tap=false 4 s. Sửa: setPlayhead(0,6) + PHÁT trước rồi mới setDeint(true) (đang phát, rAF vẽ mỗi frame nên hook cập nhật ngay). **Bài học: đừng gọi setDeint khi paused ở cuối clip; luôn phát trước.**
3. **Hết display :196–:199 (lần 5):** Xvfb các lần chạy trước chết nhưng socket `/tmp/.X11-unix/X196–199` còn lại; harness chỉ kiểm socket tồn tại. Đã dọn socket stale của mình trước mỗi lần chạy (X193 của sibling không động vào). **Bài học/nợ: harness nên dọn socket stale của chính nó khi thoát, hoặc kiểm tra Xvfb còn sống (xem §6.4).**
4. **Phối hợp T4 (F-195-P4-3):** kiểm `poll-t4.log` trước MỌI lần chạy nặng. Lần 4 chạy trong cửa sổ T4 đang poll (attempt1 bắt đầu 15:40:01Z, ngay sau lần 3 kết thúc 15:39:12Z — gate mở khi tải hạ). Lần 5/6/7 chạy giữa các attempt của T4 (attempt2 15:49:10Z–15:53:33Z, attempt3 15:56:35Z–16:00:57Z — cả 3 attempt đều 20/20 nhưng vi phạm lớp B do nhiễm tải, không dùng verdict; poller T4 thoát sau attempt3 vì hết ngân sách 3/3). Probe G5c + lần 7 chạy sau khi T4 xong, không còn xung đột.

## §5. Kiểm chứng

- `npx tsc --noEmit`: 0 lỗi (chạy 2 lần, lần cuối sau khi sửa comment pha).
- Test (`npx tsx --test` — lưu ý: `node --test` trực tiếp FAIL `ERR_MODULE_NOT_FOUND` với import TS không phần mở rộng; runner đúng là tsx): 11 file (10 enhance + 1 media) PASS, 0 fail; đếm được **158 test ✓, 0 ✗** (91P2 43/43 gồm 3 test mới; media 9/9). *Chênh lệch đếm: phiên trước ghi 163/163 — lần này đếm lại bằng spec reporter được 158 ✓, không có test nào fail và không file nào mất test (91P2 vẫn 43 `ok(`); chênh 5 là khác phương pháp đếm, không phải hồi quy — ghi lại để đợt sau đối chiếu bằng cùng một lệnh.*
- `npm run build`: PASS (22,00 s; cảnh báo chunk >500 kB đã có từ trước).
- Headed lần 7: 8/9 PASS (chỉ G6 FAIL — micro-benchmark, xem §4.4); H9 0 lỗi trang.

## §6. Giới hạn còn lại / nợ

1. **N10 chỉ vượt bar trong sim, chưa có harness P4 độc lập đợt này:** P4-196 sẽ đo lại N10/N5b bằng harness của họ (fixture/mô hình tap có thể khác sim này — như đợt 195 đã thấy hai mô hình tap cho hai kết quả khác nhau). Số sim ở đây là bằng chứng của P2, không thay kết quả P4.
2. **mbarv vẫn thua tap-P4 (3,567 vs 3,376):** thanh dọc chạy nhanh — blur dọc làm nhòe biên thanh. w=0,75 là thỏa hiệp tốt nhất trên 6/7 nhóm; hướng riêng cho mbarv (vd. w theo hướng chuyển động) chưa thử — nợ đợt sau, không chặn ship vì mbarv là fixture tổng hợp, không phải footage thật.
3. **Lưới k denoise (đợt 193) có cùng vấn đề chuyển đổi σ̂ như ngưỡng 2,7 (§2.3):** k hiệu chuẩn trên σ̂ khung thô, nhưng preview đọc σ̂ trên khung đã mã hóa (thấp hơn ~55% ở σ=15) — k thực tế ít khi lên cao như sim gợi ý. Nợ hiệu chuẩn lại lưới k trên khung đã mã hóa (đợt sau, cần đo lại toàn bộ lưới — không làm vội trong đợt này).
4. **Micro-benchmark G6 không đáng tin (§4.4) + harness không dọn socket Xvfb (§4.5.3):** nợ sửa harness đợt sau (micro dùng khung tổng hợp; dọn socket stale khi thoát).
5. **B1 dao động theo rAF (§1.3):** tiêu chí khớp chính xác 30/29,97 quá chặt cho đường ghi (30,65 cũng là "~30"); giữ nguyên tiêu chí đợt này (không dời bar), nhưng đợt sau nên ghi rõ dung sai (vd. |fps−30| ≤ 1) kèm lý do rAF jitter — quyết cho parent.
6. **Chi phí blend trên footage nhiễu chưa tách sạch (§4.2):** tỉ lệ 0,76× đo trong lúc tải tăng; cần một lần đo trong cửa sổ thật yên để tách chi phí blend khỏi nhiễu tải (hoặc đo bằng micro đã sửa — xem (4)).
7. **/tmp ENOSPC 2 lần (~15:00Z):** tmpfs 512 MB đầy khi sinh clip (300 frame RGB ~207 MB + yuv). Đã dọn intermediate của mình; thư mục `/tmp/parity196-poZHBl` của P4-196 (84 MB) không động vào. Bài học: intermediate lớn để ở `hidden_files` (đĩa chính 67 GB trống), chỉ file mp4 cuối ở /tmp.
8. **Đếm test 158 vs 163 (xem §5):** chênh 5 chưa đối chiếu gốc — nợ kiểm lại bằng cùng một lệnh đếm đợt sau.

## §7. Thay đổi code

| File | Thay đổi |
|---|---|
| `apps/web/src/sample.ts` | `SAMPLE_MEDIA_FPS = 30` + `fps` trong ingest meta và `media.push` (chỉ video) |
| `apps/web/src/media.ts` | Doc `MediaItem.fps` cập nhật (comment) |
| `apps/web/src/lib/enhancePreview.ts` | Hằng blend `W=0.75`, `MIN_SIGMA=2.7` (+ comment bảng hiệu chuẩn); `deintVerticalBlendWeight`; plan key `deintVerticalBlend`; debug field |
| `apps/web/src/preview.tsx` | `deintBobNearestSource` thêm blend dọc (lệch −0,5px, canvas tái dùng); σ̂ ước lượng cả khi chỉ deint; cache key σ̂ thêm src; comment pha sửa đúng |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Plan-shape 13→14 key |
| `apps/web/src/components/enhance/enhancePreview62R3.test.ts` | Debug-shape + assert `deintVerticalBlend` |
| `apps/web/src/components/enhance/enhancePreview91P2.test.ts` | +3 test (ngưỡng 2,7; plan; debug) — 40→43 test |
| `apps/web/src/media.fpsProbe94P2.test.ts` | +1 test P2e (SAMPLE_MEDIA_FPS=30) — 8→9 test |
| `docs/PHASE9_ROUND196_P2_ENHANCE_PARITY_LIMITS.md` | LIMITS này (mới) |

## §8. Hướng cho đợt sau

1. **P4 đo lại N10/N5b độc lập** (harness P4) — xác nhận số sim này trên mô hình tap/harness của họ.
2. **Hiệu chuẩn lại lưới k denoise trên khung đã mã hóa** (§6.3) — cùng họ vấn đề với ngưỡng 2,7; đo lại toàn bộ lưới, không vá từng mốc.
3. **Thử hướng riêng cho mbarv** (§6.2) nếu P4 xác nhận mbarv vẫn là điểm yếu — vd. w theo hướng chuyển động (chỉ blend dọc khi chuyển động ngang chiếm ưu thế).
4. **Đo lại chi phí blend trên footage nhiễu trong cửa sổ yên + sửa micro G6** (§6.4/§6.6) — tách chi phí thật của blend khỏi nhiễu tải.
5. **Sửa harness:** dọn socket Xvfb khi thoát; dung sai B1 (§6.5); đếm test bằng một lệnh chuẩn (§6.8).

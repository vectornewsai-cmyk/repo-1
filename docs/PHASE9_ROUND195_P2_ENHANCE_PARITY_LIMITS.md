# Đợt 195 P2 — Enhance parity: N5b bob-first vs tap trên fixture chuyển động + fps sample media + FPS bob khung nhỏ

- **Luồng:** P2 đợt 195 (Phase 9 VCut build loop) — Editing Core, preview/render parity, đợt thứ 5 theo hướng mới (lệnh user 15:03 25/11).
- **Nền:** đợt 194 đã đóng, parent CHẤP NHẬN toàn bộ ở §14.2 aggregate `docs/PHASE9_ROUND194_LIMITS.md` (56.089 B — NGUỒN GỐC CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18; kiểm đếm khớp lần thứ 128 liên tiếp).
- **Phạm vi đợt này: CHỈ probe + đo, KHÔNG đổi code sản phẩm** (theo brief: (a) N5b probe trên fixture chuyển động, (b) fps cho sample media, (c) đo lại fps bob ở khung nhỏ hơn/nền yên hơn). Sharpen YUV-native HOÃN theo quyết (a3)-194 — không làm pipeline WebCodecs decode xuôi mới, ghi vào nợ backlog (xem §6.4).
- **Kết quả chính:**
  1. **N5b — MÂU THUẪN ĐÃ GIẢI, bob-first GIỮ (xem §1–§2):** cả hai số gốc đều đúng — nhưng hai luồng đo HAI MÔ HÌNH TAP KHÁC NHAU. Tái tạo chính xác từng số: P2-193 (tap = dịch khung xen kẽ +0,5px): tap 4,679 → bob-first 4,261; P4-194 (tap = dịch khung đã bob +0,5px): bob-first 6,985 vs tap 6,855. Trên 4 fixture chuyển động mới (pan dọc/ngang, thanh chạy dọc/ngang + nhiễu σ=15), bob-first thắng tap-P2 mọi ô (9/9 nhóm, −0,24 tới −4,72 MAD) nhưng THUA tap-P4 ở s=0,5 (5/5 nhóm, +0,20 tới +1,17 MAD). Cơ chế: tap-P4 là blur dọc nửa pixel trên khung đã bob — giúp khi nhiễu/chuyển động mạnh, mất tác dụng khi denoise mạnh hơn (s=0,8: hòa 6,571 = 6,571) hoặc footage sạch (R-P2: bob-first thắng cả hai mô hình tap). Mô hình tap của code cũ thật (T-OLD: intermediate nửa cao smoothing-ON + tap) THUA bob-first mọi ô, tệ nhất (−3,50 tới −4,72 trên thanh chạy). **Quyết: GIỮ bob-first đã ship; KHÔNG đưa tap lại.**
  2. **fps sample media — ĐO XONG (xem §3):** 5 mp4 mẫu trong `public/` đều **30fps** (ffprobe: avg = r = 30/1, 1280×720, 3,0 s); clip mẫu sinh thật bằng `recordPackMedia` (captureStream(30)) đo headed bằng `probeVideoFps` của app: **30 / 29,97 / 30** qua 3 lần chạy (29,97 là snap của ước lượng ~30, xem P2-194 §1.2). Giá trị ghi cho đợt sau: **`fps: 30`** cho mọi media mẫu (mau-* + 5 mp4 public) — code chưa đổi đợt này (probe-only).
  3. **FPS bob khung nhỏ — ĐO XONG, không hồi quy (xem §4):** canvas **711×399** (283k px, nhỏ gấp 5,7× so với 1991×815 đợt 194), project 640×360 native, clip interlaced640.mp4: bob **TẮT 52,84 fps / BẬT 54,94 fps**, tỉ lệ drift-corrected 1,01/1,13/1,03/1,03 → **mean 1,05×** — không đo được hồi quy FPS (hiệu ứng thật −3% chìm dưới nhiễu slot ±5%). Micro-benchmark tách trực tiếp được chi phí: bob thêm **+0,556 ms/draw** (baseline 0,513 → bob 1,069 ms @711×399, 200 lần) — ~3% khung hình ~19 ms.
- **Kiểm chứng:** `npx tsc --noEmit` 0 lỗi; 11 suite enhance **160/160 pass**; test media **4/4 file PASS**; `npm run build` PASS (8,24 s); headed Chromium 1254: B1 + G5 + G6 + H9 = **4/4 PASS** (xem §4–§5). Không đổi code sản phẩm nên không có hồi quy mới.
- **File đổi (1):** LIMITS này (`docs/PHASE9_ROUND195_P2_ENHANCE_PARITY_LIMITS.md`). Không push (chỉ stage). Probe + kết quả headed lưu ở `hidden_files/round195-p2/` (không nằm trong batch push — file làm việc của luồng).

## §1. N5b: tách biến mâu thuẫn — tái tạo chính xác cả hai số gốc

### §1.1. Hai pipeline gốc khác nhau ở 2 chỗ (không phải 1)

| | P2-193 §3.2 (probe-193-p2c C2) | P4-194 §2.5 (N5b) |
|---|---|---|
| Fixture | testsrc2 30fps → `tinterlace`, **KHÔNG nhiễu** | testsrc2 30fps + nhiễu Gauss RGB **σ=15** (JS, seed 19100+f) → `interlace` filter |
| Mô hình tap | **T-P2:** dịch khung **xen kẽ** +0,5px (trung bình 2 hàng kề) rồi blend | **T-P4:** bob-nearest trước, rồi dịch khung **đã bob** +0,5px (bilinear) rồi blend |
| Truth | yadif mode=0 → hqdn3d (s=0,5: 12:9:12:9; s=0,8: 19,2:14,4:19,2:14,4) | yadif mode=0 → hqdn3d s=0,5 (12:9:12:9) |
| Alpha | cố định 0,486 (s=0,5) / 0,806 (s=0,8) | thích nghi: σ̂ trên khung nguồn xen kẽ, k lưới, warm-up frame 3 → α ≈ 0,485 |
| Kết quả | tap 4,679 → bob-first 4,261 (f3, s=0,5) | bob-first 6,985 vs tap 6,855 (trung bình 3 frame) |

Thêm mô hình thứ 3 (**T-OLD**): tái tạo đúng code cũ trước đợt 193 — intermediate nửa chiều cao smoothing-ON (mỗi hàng = trung bình 2 hàng nguồn kề) + tap +0,5px trong không gian nửa chiều cao + upscale bilinear (xem `enhancePreview.ts` comment + `deintHalfResSim` của harness P4). Cả 3 mô hình tap + bob-first đều chạy trên CÙNG fixture, CÙNG alpha, CÙNG truth trong probe này (`probe-195-p2a.mjs`).

### §1.2. Tái tạo: khớp từng chữ số (xác minh pipeline probe đúng)

**R-P2** (tái tạo P2-193, idx 2/6/10 = f3/f7/f11, alpha cố định):

| | s=0,5 idx2 | s=0,5 idx6 | s=0,5 idx10 | s=0,5 trung bình | s=0,8 trung bình |
|---|---|---|---|---|---|
| bob-first | **4,261** | 4,588 | 4,363 | **4,404** | **5,858** |
| tap-P2 | 4,679 | 5,114 | 4,835 | 4,876 | 6,188 |
| tap-P4 | 4,314 | 4,685 | 4,497 | 4,499 | 5,891 |
| tap-OLD | 5,139 | 5,662 | 5,488 | 5,430 | 6,605 |

Ô s=0,5 idx2 khớp Y HỆT số P2-193 (tap 4,679 → bob-first 4,261). Bob-first thắng tap-P2 cả 3/3 frame ở cả hai strength; thắng tap-P4 3/3 (s=0,5) và 2/3 (s=0,8, idx2 hòa 5,648 vs 5,647 — chênh 0,001).

**R-P4** (tái tạo P4-194, idx 3/7/11, s=0,5, alpha thích nghi frameIndex=3):

| Frame | σ̂ | k | α | bob-first | tap-P2 | tap-P4 | tap-OLD |
|---|---|---|---|---|---|---|---|
| idx 3 | 7,98 | 0,998 | 0,485 | 6,967 | 7,357 | 6,820 | 7,450 |
| idx 7 | 8,23 | 0,998 | 0,485 | 6,999 | 7,495 | 6,900 | 7,637 |
| idx 11 | 8,22 | 0,998 | 0,485 | 6,989 | 7,379 | 6,847 | 7,488 |
| **trung bình** | **8,14** | — | — | **6,985** | 7,410 | **6,856** | 7,525 |

Khớp Y HỆT số P4-194 (bob-first 6,985 vs tap 6,855 — probe này 6,856, chênh 0,001 do làm tròn; σ̂ trung bình 8,14 vs ~8,15 của P4). **Cả hai số gốc đều đúng — mâu thuẫn là do mô hình tap khác nhau, không phải do ai đo sai.**

## §2. N5b: fixture chuyển động — tap-P4 thắng ở s=0,5, hòa khi denoise mạnh hơn

### §2.1. Fixture chuyển động (mới)

Tất cả 320×180, 32 frame progressive → tinterlace → 16 frame xen kẽ, + nhiễu Gauss RGB σ=15 (JS, seed 19300+f), truth yadif→hqdn3d s=0,5 (mvpan thêm s=0,8). Độ chuyển động = mean |Δ| luma giữa 2 frame progressive liên tiếp / giữa 2 frame tạo thành 1 khung xen kẽ:

| Fixture | Nội dung | meanAbsFrameDelta | meanAbsFieldPairDelta |
|---|---|---|---|
| mvpan | pan dọc 4px/frame (testsrc2 320×360 crop y=4n) | 2,304 | 2,313 |
| mhpan | pan ngang 6px/frame (testsrc2 640×180 crop x=6n) | 8,992 | 9,000 |
| mbarv | thanh trắng chạy dọc 6px/frame | 14,578 | 15,300 |
| mbarh | thanh trắng chạy ngang 6px/frame (= interbar) | 9,562 | 9,562 |
| (đối chiếu) testsrc2 R-P2/R-P4 | chuyển động vừa của testsrc2 | 3,062 | 3,050 |

### §2.2. Kết quả tổng hợp (MAD trung bình vs truth yadif→hqdn3d; le8 trong ngoặc)

| Fixture / s | bob-first | tap-P2 | tap-P4 | tap-OLD | BF − tapP4 |
|---|---|---|---|---|---|
| mvpan s=0,5 (5 frame) | 6,191 (67,5%) | 6,847 (63,4%) | **5,987** (71,5%) | 6,617 (70,0%) | **+0,204** |
| mvpan s=0,8 (5 frame) | **6,571** (72,0%) | 6,810 (72,2%) | **6,571** (73,2%) | 6,742 (74,9%) | **0,000** |
| mhpan s=0,5 (5 frame) | 8,719 (61,5%) | 10,669 (58,0%) | **8,215** (66,1%) | 10,183 (65,7%) | **+0,504** |
| mbarv s=0,5 (5 frame) | 4,545 (87,2%) | 9,266 (84,3%) | **3,376** (90,6%) | 8,498 (88,0%) | **+1,169** |
| mbarh s=0,5 (5 frame) | 3,561 (91,4%) | 7,490 (89,1%) | **3,336** (93,5%) | 7,058 (92,0%) | **+0,225** |
| R-P2 s=0,5 (sạch, 3 frame) | **4,404** (78,4%) | 4,876 | 4,499 | 5,430 | −0,095 |
| R-P4 s=0,5 (nhiễu, 3 frame) | 6,985 (70,9%) | 7,410 | **6,856** (72,7%) | 7,525 | +0,129 |

Đọc: **bob-first thắng tap-P2 ở 9/9 nhóm** (mọi frame trong mọi nhóm — chênh −0,24 tới −4,72 MAD). **Tap-P4 thắng bob-first ở 5/5 nhóm CÓ NHIỄU tại s=0,5** (mọi frame: mvpan 0/5, mhpan 0/5, mbarv 0/5, mbarh 0/5 frame bob-first thắng) nhưng **thua trên fixture sạch** (R-P2: bob-first thắng 3/3 ở s=0,5) và **hòa khi denoise mạnh hơn** (mvpan s=0,8: 6,571 = 6,571, bob-first thắng 3/5 frame). **Tap-OLD thua bob-first ở 9/9 nhóm** (−0,54 tới −4,72 MAD) — tệ nhất trên thanh chạy (mbarv −3,95; mbarh −3,50).

### §2.3. Từng frame (s=0,5; MAD bob-first / tap-P2 / tap-P4 / tap-OLD)

mvpan (σ̂ 9,4–10,0; k 0,78–0,85; α 0,38–0,41): idx2 6,302/7,098/6,012/6,865; idx5 5,743/6,290/5,455/5,969; idx8 5,683/6,244/5,510/6,014; idx11 6,515/7,173/6,322/6,922; idx14 6,710/7,431/6,636/7,316.
mhpan (σ̂ 11,0–11,7; k 0,60–0,65; α 0,29–0,31): idx2 8,969/11,160/8,436/10,745; idx5 8,960/11,112/8,407/10,624; idx8 8,300/10,300/7,856/9,851; idx11 8,458/10,152/7,969/9,609; idx14 8,910/10,619/8,409/10,085.
mbarv (σ̂ 10,8–10,9; k 0,66–0,67; α 0,32–0,33 — trừ idx14): idx2 4,894/10,091/3,640/9,361; idx5 4,759/9,877/3,463/9,072; idx8 4,727/9,795/3,409/8,972; idx11 4,710/9,751/3,390/8,914; idx14 3,636/6,815/2,980/6,169 (σ̂ 8,22, α 0,485 — thanh đã chạy gần hết khỏi khung nên texture/nhiễu ước lượng thấp hơn; mẫu vẫn giữ hướng verdict).
mbarh (σ̂ 8,7; k 0,94; α 0,46): idx2 3,721/7,800/3,562/7,435; idx5 3,557/7,507/3,345/7,082; idx8 3,518/7,405/3,279/6,956; idx11 3,504/7,375/3,247/6,916; idx14 3,504/7,365/3,246/6,903.

### §2.4. Cơ chế — tap-P4 thắng nhờ blur, không phải nhờ khử răng cưa

- Tap-P4 = dịch khung đã bob +0,5px bằng nội suy bilinear = trung bình 2 hàng kề = **blur dọc [0,5; 0,5]** trên khung đã bob. Nó làm mềm bậc thang line-doubling của bob trên cạnh ngang đang chuyển động (lợi lớn nhất ở mbarv: cạnh ngang của thanh chạy dọc — +1,169 MAD) và khử thêm nhiễu (truth hqdn3d cũng đã khử nhiễu nên blur thêm đưa preview lại gần truth hơn).
- Bằng chứng nó là hiệu ứng denoise chứ không phải deinterlace: (i) trên fixture SẠCH (R-P2) tap-P4 thua bob-first; (ii) tăng strength denoise lên s=0,8 (blend đã blur đủ) thì lợi thế biến mất hoàn toàn (hòa 6,571 = 6,571); (iii) le8 của tap-P4 luôn cao hơn bob-first trên fixture nhiễu (vd mhpan 66,1% vs 61,5%) — đúng dấu hiệu blur thêm, không phải nội suy field tốt hơn.
- Tap-P2 thua mọi nơi vì dịch khung XEN KẼ trộn 2 field khác thời điểm (ghosting/combing) — không denoise nào cứu được. Tap-OLD tệ nhất vì intermediate smoothing-ON đã trộn field rồi mới tap — code cũ thật sự kém trên chuyển động, đúng như quyết bỏ tap đợt 193.
- Tier không đổi: mọi MAD đều tier XẤP XỈ (cần ≤2 & le8 ≥99% mới KHỚP); bob không bao giờ đạt KHỚP vì chỉ giữ 1 field — nợ yadif thật trong preview vẫn đứng (xem §6).

### §2.5. Kết luận N5b + khuyến nghị

- **GIỮ bob-first đã ship. KHÔNG đưa tap lại.** Bob-first thắng mô hình tap của P2 mọi nơi, thắng mô hình tap của code cũ thật (T-OLD) mọi nơi, và chỉ thua mô hình tap-P4 trên fixture nhiễu ở s=0,5 với chênh lệch 0,13–1,17 MAD (2–26%) — chênh lệch này nằm trong biên điều chỉnh denoise (tăng strength đã hòa), không phải bằng chứng tap khử răng cưa tốt hơn.
- **Nợ follow-up (không làm đợt này):** probe "blend dọc [0,5; 0,5] sau bob-nearest" như một tính năng denoise riêng (không gọi là tap): nếu blend nhẹ sau bob cải thiện MAD trên fixture nhiễu mà không hại fixture sạch thì đó mới là sửa đúng chỗ — giao P2 đợt sau, vì nó chạm `enhancePreviewPlan`/alpha thích nghi, cần probe riêng. F-194-P4-3 (mâu thuẫn P2-193/P4-194) ĐÓNG theo kết luận này.
- Lưu ý cho P4: ô N5b đợt sau nên đo cả 3 mô hình tap (hoặc ghi rõ mô hình nào) — verdict "tap thắng/thua" không có nghĩa nếu không nêu mô hình tap.

## §3. fps cho sample media — đo xong, giá trị ghi là 30

### §3.1. 5 mp4 mẫu trong `public/` (ffprobe — đo trực tiếp file)

| File | Kích thước | fps (avg = r) | Duration |
|---|---|---|---|
| frames-noise.mp4 | 1280×720 | 30/1 | 3,000 s |
| stripes-code.mp4 | 1280×720 | 30/1 | 3,000 s |
| stripes-nonperiodic.mp4 | 1280×720 | 30/1 | 3,000 s |
| stripes-scroll.mp4 | 1280×720 | 30/1 | 3,000 s |
| stripes-static.mp4 | 1280×720 | 30/1 | 3,000 s |

### §3.2. Clip mẫu sinh thật (headed Chromium 1254 — đo bằng `probeVideoFps` của app)

`recordPackMedia("fps-probe-195.webm", "16:9", 2, 0, ...)` (captureStream(30), ghi realtime 2 s) rồi `probeVideoFps` trên chính File sinh ra — 3 lần chạy trong 2 phiên headed:

| Lần chạy | Size | Type | Duration | probeVideoFps |
|---|---|---|---|---|
| headed lần 1 (09:56Z) | 247.526 byte | video/webm | 1,992 s | **30** |
| headed lần 2 (09:59Z) | 220.587 byte | video/webm | 1,958 s | **29,97** |
| headed lần 3 (09:04Z) | 246.833 byte | video/webm | 1,995 s | **30** |

29,97 là snap của ước lượng ~29,9x (quy tắc snap P2-194 §1.2: 29,9 → 29,97) — cùng họ 30fps với 30, không phải fps khác. Size khác nhau giữa các lần là bình thường (MediaRecorder ghi realtime, rAF cadence dao động nhẹ).

### §3.3. Giá trị ghi + vị trí code (đợt sau làm, đợt này KHÔNG đổi code)

- **Giá trị: `fps: 30`** cho mọi media mẫu: 2 clip mau-* của project mẫu (`sample.ts` `loadSample` → `media.push({...})` — hiện chưa có field `fps`; clip ghi bằng `recordPackMedia` 640×360, captureStream(30)) và 5 mp4 public trên (nơi nào dựng `MediaItem` cho chúng thì gán `fps: 30`).
- Cơ chế bền qua reload đã có sẵn từ đợt 194 (`MediaItem.fps` → `IngestMeta.fps` → `AssetManifest.fps` → `rehydrate36S5` khôi phục) — chỉ cần gán fps lúc tạo media mẫu thì bob luân phiên sẽ đúng trên clip mẫu (hiện tại thiếu fps nên bob luôn top field trên clip mẫu — nợ P2-194 §8.3 nay đã có số để điền).
- Lưu ý trung thực: fps đo được là fps GHI (MediaRecorder) — nếu máy user yếu, rAF thưa có thể làm fps ghi thực tế thấp hơn 30 ở một số clip; `probeVideoFps` lúc import (đã ship đợt 194) sẽ đo lại và thắng giá trị ghi sẵn nếu khác — giá trị 30 ở đây là mặc định đúng cho máy bình thường, không phải cam kết cứng.

## §4. FPS bob ở khung nhỏ — không hồi quy; chi phí trực tiếp +0,56 ms/draw

Harness `headed-195-p2-bob.mjs` (bản sao ở `hidden_files/round195-p2/`): vite dev :5590 + Xvfb + CDP Chromium 1254, cửa sổ **1280×1024**, project **640×360** native, clip **interlaced640.mp4** (testsrc2 640×360 tinterlace, libx264 crf 18, 30fps, 5 s), canvas **711×399** (S = 1,108 ≥ 0,9 → tap áp), slot xen kẽ [off,on,off,on,off,on,off,on,off] × 4 s, draw fps qua `__vcutHoldStats.draw`, tỉ lệ drift-corrected như E1 G5. Load lúc chạy 1,0–3,5 (nền yên — xem §4.2).

| slot | 0 off | 1 on | 2 off | 3 on | 4 off | 5 on | 6 off | 7 on | 8 off |
|---|---|---|---|---|---|---|---|---|---|
| draw fps | 50,65 | 48,04 | 44,75 | 54,51 | 51,81 | 57,13 | 59,29 | 60,07 | 57,68 |
| hook tap (giữa slot) | false | true | false | true | false | true | false | true | false |

**Tắt mean 52,84 fps / Bật mean 54,94 fps; tỉ lệ 1,01/1,13/1,03/1,03 → mean 1,05×; không slot đóng băng (<0,5 fps); 0 lỗi trang.** Hook tap đúng mọi slot.

### §4.1. Đọc số đúng mức

- FPS on/off **không tách được chi phí bob**: khung hình ~19 ms (53 fps); micro-benchmark (§4.3) đo chi phí bob là +0,56 ms ≈ 3% khung hình — nhỏ hơn nhiễu slot (±5–13% giữa các tỉ lệ; tỉ lệ 1,13 ở slot 3 là outlier do tải). Tỉ lệ mean 1,05× (on nhanh hơn off) ngược dấu với hiệu ứng thật (−3%) nên chỉ đọc được là **không có hồi quy FPS đo được**, không đọc được là "bob làm nhanh hơn".
- Hai slot cuối ở 57–60 fps chạm trần rAF 60 Hz — trần này nén tỉ lệ về 1,00, càng khó tách. Muốn tách bằng FPS cần khung hình nhỏ hơn nữa hoặc bỏ trần rAF — không làm trong đợt này vì micro-benchmark đã tách được trực tiếp.
- So với đợt 194 (canvas 1991×815, 11,06/11,10 fps, tỉ lệ 1,02×): khung nhỏ hơn 5,7× diện tích cho fps cao gấp ~5× (53 vs 11) — chi phí vẽ tỉ lệ gần đúng với diện tích canvas, đúng kỳ vọng; cả hai đợt đều kết luận không hồi quy FPS đo được.

### §4.2. Bẫy harness đã bắt được (2 lần — bài học cho lần sau)

- **Lần 1 (cửa sổ 1024×768, project 640×360):** canvas 455×143, S = 0,397 < 0,9 → harness dừng đúng (không đo được đường bob). Không phải lỗi sản phẩm — cổng scaleY 0,9 làm đúng việc (preview downscale mạnh thì răng cưa đã bị giấu).
- **Lần 2 (cửa sổ 1024×768, project 256×144 + clip interlaced720.mp4):** S = 0,993 ≥ 0,9 nhưng `setDeint(true)` không về đích (hook tap=false dù store đã bật `deinterlace: true`). Nguyên nhân: `drawScaleY = (dh/mh) × S` — clip 1280×720 trong project 256×144 có dh/mh = 0,2 nên drawScaleY thật = 0,2 × 0,993 ≈ 0,20 < 0,9 (S của STATE_FN chỉ là min(Wc/W, Hc/H), KHÔNG phải drawScaleY). **Bài học: clip đo bob PHẢI native với project (dh/mh = 1) thì drawScaleY mới = S.** Lần 3 dùng clip 640×360 native với project 640×360 nên qua cổng ngay (S = 1,108, hook tap đúng mọi slot).
- T4-195: kiểm `poll-t4.log` trước mỗi lần đo nặng (poll #9/#17/#21/#28/#31 đều lock=khong, chưa attempt trong các cửa sổ đo; load 1,0–3,5). Sim ffmpeg/node là số xác định nên không nhiễm tải; FPS headed chạy trong cửa sổ yên.

### §4.3. Micro-benchmark chi phí vẽ bob (tách trực tiếp ~1 ms)

Trong cùng phiên headed, trên canvas 711×399 thật, video interlaced640.mp4 seek 1 s, 200 lần lặp: baseline (1 lần `drawImage` video → full) **0,513 ms/draw**; bob (half smoothing-off + upscale nearest lên full) **1,069 ms/draw**; **thêm +0,556 ms/draw**. So với P2-193 §4 (hai bước ≤0,57 ms/frame @640×360): khớp — chi phí bob ~0,56 ms, không đổi theo diện tích canvas trong khoảng này vì phần lớn là chi phí cố định 2 lần gọi vẽ + decode frame. Kết luận: **chi phí bob ≈ 0,56 ms/draw (~3% khung hình 19 ms @53fps; ~0,6% ngân sách 90 ms @11fps đợt 194)** — quá nhỏ để thấy bằng FPS, đo được bằng micro-benchmark.

## §5. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** (không đổi code — cây giữ nguyên sau đợt 194).
- 11 suite enhance: **160/160 pass** (59P8 21/21, 60Q1 16/16, 61R3 7/7, 62R3 10/10, 63R3 8/8, 75C8 14/14, 76D4 10/10, 77E1 11/11, 91P2 40/40, 61R2 9/9, 64R2 14/14 — chạy lại bằng esbuild bundle như hướng dẫn trong file test).
- Test media (`run-media-tests.mjs`): **4/4 file PASS** (fpsProbe94P2 8/8 — snap/fps/probe/fileToMediaItem vẫn xanh).
- `npm run build` (apps/web): **PASS** (8,24 s; cảnh báo chunk >500 kB có sẵn, không liên quan).
- Probe sim: `/tmp/round195-p2` (probe-195-p2a.mjs + fixture sinh bằng ffmpeg 8.1.2 + truth yadif→hqdn3d; JSON `parity-195-p2a.json`); bản sao probe + script/kết quả headed ở `~/workspace/goals/capcut-clone-video-editor/hidden_files/round195-p2/`. Số đo bằng ffmpeg 8.1.2 / node 24.22.1 / Chromium 1254.

## §6. Giới hạn còn lại / nợ

1. **Deint vẫn tier XẤP XỈ:** MAD bob-first 3,4–8,7 trên fixture chuyển động có nhiễu, le8 61–94% (cần ≤2 & ≥99% mới KHỚP). Bob giữ 1 field nên không bao giờ đạt KHỚP; hơn nữa cần yadif thật trong preview (nợ lớn).
2. **fps VFR:** probe cho fps trung bình cửa sổ đầu video; footage VFR mạnh có thể lệch field ở đoạn fps khác trung bình — chưa đo (nợ P2-194 §8.2, giữ nguyên).
3. **Sample media fps — CHỜ GHI CODE:** giá trị `fps: 30` đã đo xong (§3) nhưng chưa gán vào `sample.ts`/`MediaItem` đợt này (probe-only) — giao đợt sau (1 dòng mỗi chỗ tạo media mẫu + 5 mp4 public; kiểm lại bằng test `fpsProbe94P2`-style hoặc headed B1).
4. **Sharpen YUV-native — HOÃN (quyết (a3)-194, ghi vào backlog):** chỉ làm lại khi có đường WebCodecs decode xuôi thật (hoặc rVFC trả metadata YUV — hiện không có). Giữ `applySharpen` như cũ (MAD ~1,5–2,5 ở t=0,5–1,0 trên nội dung nhiễu — giới hạn đứng từ đợt 193 §2.2).
5. **Tap-P4 follow-up:** blend dọc [0,5; 0,5] sau bob-nearest như một tính năng denoise riêng — probe riêng đợt sau (xem §2.5); không đưa tap lại dưới tên cũ.
6. **FPS bob:** FPS on/off không tách được chi phí ~0,56 ms (nhiễu slot ±5–13% + trần rAF 60 Hz); micro-benchmark là cách đo đúng cho chi phí này — các đợt sau muốn tách chi phí vẽ nhỏ thì dùng micro-benchmark trong trang, không dùng FPS slot.
7. **P4-195 lưu ý:** N5b nay đã ngã ngũ theo §2 (giữ bob-first); N5 @60fps mode 1 kỳ vọng vẫn MAD ~2,30 / le8 ~95% (luân phiên, P2-194); số `fps: 30` cho sample media sẽ làm bob luân phiên đúng trên clip mẫu sau khi ghi code (§6.3).

## §7. Thay đổi code

**KHÔNG đổi code sản phẩm đợt này** (probe + đo theo brief). File mới duy nhất trong repo: LIMITS này. Probe + harness headed + JSON kết quả nằm ở `hidden_files/round195-p2/` (file làm việc của luồng, không stage lên push).

## §8. Hướng cho đợt sau

- P2-196 (nếu tiếp tục enhance parity): (a) ghi `fps: 30` cho media mẫu (§6.3) + kiểm lại headed B1; (b) probe blend dọc [0,5; 0,5] sau bob như tính năng denoise riêng trên fixture nhiễu + sạch (§2.5); (c) sharpen YUV-native CHỈ khi có đường WebCodecs decode xuôi — không làm nửa vời (§6.4).
- P4-195: N5b đã ngã ngũ (giữ bob-first); khi kiểm lại N5b thì đối chiếu cả 3 mô hình tap trong LIMITS này, không dùng verdict "tap thắng/thua" chung chung.

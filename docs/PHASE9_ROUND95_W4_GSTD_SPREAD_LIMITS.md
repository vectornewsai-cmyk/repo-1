# PHASE9_ROUND95_W4_GSTD_SPREAD_LIMITS — điều tra gStd spread rVFC pump + parity MAD F/C

> Luồng W4, đợt 95, lượt cron 12:35 +07 12/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
> W4 KHÔNG sửa code repo (chỉ thêm LIMITS này + script chờ đo + JSON thô ngoài repo).
> **Kết quả chính: giả thuyết ring-fill BÁC; "61" không phải mức vật lý;
> spread do presented-frame lệch currentTime ở đường vẽ — xem §1 + §4.**

## 0. Môi trường đo

- Boot 06a92916-d915-4220-9e96-f7dc42f916ae (reboot #15 ~05:18Z, sau đợt 94).
  Uptime 36' lúc W4 bắt đầu (05:54Z). RAM khả dụng 651 MB (05:39Z) → 1,65–2,0 GB
  lúc đo (dao động theo Chrome của W6). 2 vCPU chia sẻ với 8 luồng W1–W9.
- Vite dev 5173 của W4 (pid 12602, log `~/workspace/round95-w4/out/vite-5173.log`),
  HTTP 200 từ 05:56Z. Chrome headless Playwright chromium-1254 (probe tự spawn).
- `apps/web/src/preview.tsx` mtime **03:07:45Z trước/sau MỌI lượt đo** (W2 sửa
  `media.ts`, W5 chưa sửa `preview.tsx` trong lượt W4) — không lượt nào nhiễm
  do sửa code. Log luồng: `hidden_files/round95-w4.md`.
- Loadavg 1-phút theo lượt: assert95 5,66→10,03 (NHIỄM); parity F 3,39→3,58;
  parity C 2,78→6,37; lúc chờ assert95b lên tới 10,80 (tsc của W9 + chrome
  e1-run5 của W6). Xem §5 về assert95b.

## 1. Kết quả chính (đọc trước)

### 1.1 Ring-fill BÁC — ring giống hệt nhau ở cả 2 mức gStd

Trong file assert2 (guard đã siết), spec B có **44 nhóm cửa sổ đã vẽ bimodal**
(cùng 1 nhóm chứa cả mẫu 37,5 lẫn 84,6); ở **44/44 nhóm, 2 mức có cùng
(ring, lastFrame, prevFrame) đọc tại thời điểm đo** — ring=2 (đầy) cả hai mức,
không nhóm nào khác nhau. Tương tự ở file assert (xem §2). Nếu spread do
ring-fill (1/2/3 snapshot) thì 2 mức phải tách nhau theo ring — không tách.
**Giả thuyết ring-fill trong LIMITS gộp đợt 94 §4 mục 4 bị bác bằng dữ liệu.**

### 1.2 "61" không phải mức vật lý — chỉ là median của nhóm bimodal

Quét toàn bộ dữ liệu thô assert + assert2 (4 spec B–E × 2 file, ~5.400 mẫu play):
**không có mẫu nào có gStd trong [60, 62] (n=0 ở cả 8 tổ hợp).** "3 mức rời rạc
37,5/61/84,6" thực chất là **2 mức vật lý (37,5 và 84,6)** + median 61 của nhóm
chứa ~nửa mẫu mỗi mức (vd nhóm (19,18,19): 5×37,5 + 5×84,6 → median 61,05).
Mọi bảng "gStdMed 61" trong LIMITS cũ đều là median bimodal, không phải mức đo được.

### 1.3 Hai mức thật là 2 cửa sổ blend khác nhau — định danh bằng frame thật

Weights tmix spec B là [1,1,1] (frames=3). Blend offline trên frame thật của
`stripes-scroll.mp4` (ffmpeg, frame 17–20, vùng core trong mask — xem §3):

| cửa sổ blend | gStd offline / gStd frame đơn | dự đoán giải tích | đo trong app |
|---|---|---|---|
| triple liên tiếp {K-2,K-1,K} (hoặc {K-1,K,K+1}) | 29,8 / 89,3 = **0,334** | 1/3 = 0,333 | **37,5** (37,5/112 = 0,335) |
| {K-1,K,K} (current trùng ghost mới nhất) | 67,4 / 89,3 = **0,755** | √5/3 = 0,745 | **84,6** (84,6/112 = 0,755) |
| pair {K-1,K} (ring chỉ 1 ghost) | 64,1 / 89,3 = **0,718** | 1/√2 = 0,707 | **~79** (hiếm, n=2–5/spec) |
| frame đơn (vẽ trực tiếp, ring rỗng) | 89,3 / 89,3 = 1 | 1 | **112** |

Tỉ lệ khớp tới ~1% (sai số còn lại do sóng vuông + resample khi vẽ xuống canvas
872×276; thang tuyệt đối offline 89,3 vs app 112 do hình học core khác nhau,
tỉ lệ mới là đại lượng so được). **37,5 = triple liên tiếp; 84,6 = current
bị đếm 2 lần ({K-1,K,K}).**

### 1.4 Phân biệt 2 mức theo PHA trong frame — presented frame lệch currentTime

Pha = phần lẻ của vt×30 (0 = đầu frame video, 1 = cuối frame). Phân bố pha
theo mức gStd (mẫu play không đóng băng, cả 2 file assert/assert2):

| file | spec | 37,5-cluster: n / pha median | 84,6-cluster: n / pha median |
|---|---|---|---|
| assert | B | 180 / **0,79** | 379 / **0,28** |
| assert | C | 137 / **0,77** | 412 / **0,31** |
| assert | D | 188 / **0,71** | 372 / **0,26** |
| assert | E | 184 / **0,67** | 359 / **0,26** |
| assert2 | B | 185 / **0,69** | 379 / **0,25** |
| assert2 | C | 127 / **0,71** | 408 / **0,32** |
| assert2 | D | 189 / **0,69** | 371 / **0,23** |
| assert2 | E | 201 / **0,62** | 354 / **0,24** |

Mẫu 37,5 tập trung ở **nửa sau frame** (pha 0,62–0,79), mẫu 84,6 ở **nửa đầu
frame** (pha 0,23–0,32). Cơ chế (xem §4): `frameIdx` của tick lấy từ
`currentTime` (`videoFrameIndex(srcEl.currentTime, fps)`, preview.tsx:2862),
nhưng frame hiện tại đưa vào blend là frame **đang trình chiếu** mà
`drawImage(video)` trả về — frame này lật sang K+1 trước khi `currentTime`
vượt qua mốc K+1 (trình chiếu chạy trước đồng hồ media tới ~10 ms).
- Đầu frame: presented = K = frameIdx; ring đã có [K-1,K] (pump capture K ngay
  khi trình chiếu) → blend {K-1,K,K} → 84,6.
- Cuối frame: presented = K+1 trong khi frameIdx vẫn K → blend {K-1,K,K+1}
  (triple liên tiếp) → 37,5. Nhãn (frameIdx,prev,last) vẫn ghi (K,K-1,K) —
  nhãn không ghi lại frame trình chiếu thật nên 2 cửa sổ khác nhau mang
  cùng 1 nhãn, spread trong nhóm lên tới 47,1.

### 1.5 Parity MAD spec F + C trên cây hiện tại (đã có memo)

| spec | đo mới đợt 95 (W4) | số cũ | kết luận |
|---|---|---|---|
| F (`f-feather-invert.json`) | **MAD=0, maxAbs=0, diffFrac=0, gt1Frac=0** trên 240.672 px (06:01–06:03Z) | MAD=0 pre-memo (00:01 đợt 93) | memo **không đổi pixel nào** |
| C (`c-blur.json`) | **MAD=0, maxAbs=0** trên 240.672 px (06:03–06:05Z) | **không có số cũ** (tra toàn bộ docs/out: chưa từng đo parity C) | **lần đầu đo C; MAD=0** |

Cả hai đều so đường mask mới (canvas alpha cache) với đường cũ (CPU
getImageData) trên cùng frame pause t=1.0. Ở trạng thái pause, cùng frameIdx
+ cùng hình học mask nên memo hit chính xác — không có dư địa lệch pixel.
File: `~/workspace/round95-w4/out/mask-parity-f95.json`,
`mask-parity-c95.json`.

### 1.6 Hệ quả chưa ai nói rõ: preview blur YẾU HƠN render ở đa số tick

Render tmix frames=3 cho frame K là trung bình {K-2,K-1,K} → gStd 37,5.
Preview ở đa số tick (~2/3 mẫu: 84,6-cluster n≈360–410/spec vs 37,5-cluster
n≈130–200/spec) lại blend {K-1,K,K} → gStd 84,6 — **mờ chỉ bằng ~44% độ mờ
đúng** (84,6/37,5 ≈ 2,25× độ tương phản còn lại). Tick muộn cho đúng biên độ
37,5 nhưng lệch cửa sổ +1 ({K-1,K,K+1} = cửa sổ tmix của frame K+1, vẽ sớm
1 frame). **Không mức nào là tmix đúng của frame K.** Đây là lệch
preview-vs-render thật trong đường motion blur (proxy gStd trên clip sọc,
chưa phải so render đầy đủ) — xem nợ mở §6 mục 1.

## 2. Số liệu gốc (phân tích lại assert + assert2 đợt 93)

Nhóm theo cửa sổ ĐÃ VẼ (khóa T2: lastDrawnFrameIdx/prevFrame/lastFrame,
ring≥1, drawnStable, lastDrawnFrameIdx==frameIdx). Spread median cũ để đối chiếu:

| file | spec | spreadMed | spreadMax | nGroups | bimodal | chỉ-37,5 | chỉ-84,6 |
|---|---|---|---|---|---|---|---|
| assert | B | 45,5 | 47,1 | 71 | 45 | 2 | 45 |
| assert | C | 29,4 | 47,2 | 95 | 44 | 1 | 69 |
| assert | D | 45,5 | 47,7 | 76 | 44 | 3 | 46 |
| assert | E | 45,4 | 47,1 | 77 | 44 | 1 | 59 |
| assert2 | B | 45,4 | 47,1 | 78 | 44 | 1 | 52 |
| assert2 | C | 29,5 | 47,2 | 94 | 44 | 0 | 66 |
| assert2 | D | 45,8 | 47,7 | 74 | 45 | 0 | 47 |
| assert2 | E | 45,5 | 47,1 | 70 | 45 | 1 | 33 |

- Nhóm bimodal chiếm ~44–45/spec ở cả 2 file — spread là hệ thống, không phải
  nhiễu pass lẻ. Nhóm chỉ-84,6 nhiều (33–69) vì tick đầu frame (84,6) phổ biến
  hơn tick cuối frame (37,5); nhóm chỉ-37,5 gần như không có (0–3).
- Giá trị gStd thô (spec B, assert): 37,4–37,7 (n=179), 82,7–84,6 (n≈390),
  111,4–112,4 (n=81, vẽ trực tiếp), 78,5–80 (n=4). Không có giá trị nào ở 60–62.
- Trong nhóm (19,18,19) assert: 10 mẫu (5 pass × 2) — mẫu 84,6 có vt 0,6407–
  0,6446 (pha 0,22–0,34), mẫu 37,5 có vt 0,6562–0,6640 (pha 0,69–0,92);
  ph 0,600–0,633 vs 0,633–0,667; mọi field dbg khác giống hệt (ring=2,
  last=19, prev=18, rvfcCaptures bằng nhau trong cùng pass, rvfcActive=true).
  Mẫu 37,5 luôn là mẫu MUỘN HƠN trong cùng pass (sau mẫu 84,6 đúng ~1 tick rAF).

## 3. Kiểm chứng blend bằng frame thật (offline, không qua app)

- Clip `apps/web/public/stripes-scroll.mp4` (1280×720, 30fps, 90 frame).
  Trích frame 17–20 bằng ffmpeg (`-pix_fmt gray`), vùng core x 512–768,
  y 300–420 (ánh xạ từ cửa sổ gStd_core của harness: canvas 872×276,
  scale 0,38333, mask ellipse x=0,5/w=0,4 → core nằm gọn trong mask).
- Kết quả (xem bảng §1.3): tỉ lệ triple 0,334 ≈ 1/3; {K-1,K,K} 0,755 ≈ √5/3
  (sai 1,3%); pair 0,718 ≈ 1/√2 (sai 1,6%). Công thức giải tích: sọc chu kỳ
  4 frame (48 px, 12 px/frame) → pha mỗi frame lệch 90°; biên độ blend =
  |Σ w·e^{iφ}| với weights [1,1,1]/3: triple liên tiếp |1+i−1|/3=1/3;
  {K-1,K,K} |1−2i|/3=√5/3; pair |1+i|/2=1/√2.
- Lưu ý: thang tuyệt đối offline (frame đơn 89,3) khác app (112) do hình học
  core + green-channel + resample; chỉ tỉ lệ là so được — và tỉ lệ khớp.
  Script tính: chạy trực tiếp bằng python3/numpy trong out (không lưu script
  riêng; frame trích `out/f17-20.gray`, 3.686.400 byte, ngoài repo).
- Mức ~79 hiếm (n=2–5/spec, pha 0,62–0,97, muộn): pair-blend khi ring chỉ có
  1 ghost (vừa refill sau clear) — ring-fill CÓ xảy ra nhưng <1% mẫu, không
  giải thích được spread 45,5.

## 4. Phân tích cơ chế (vì sao các giả thuyết cũ sai)

- **Mislabel của guard (V1 §6):** guard siết 1,5/fps → 1/fps+0,5ms không đổi
  spread (B 45,5→45,4) — đúng là không đổi, nhưng lý do không phải ring-fill:
  guard chặn ở bước CAPTURE (snapshot gán nhãn K), còn lệch nằm ở bước VẼ
  (frame hiện tại đưa vào blend là presented frame, không qua guard nào).
  Comment trong code preview.tsx:1612 ("callback trễ lọt qua ngưỡng → snapshot
  nhãn K chứa pixels K+1") mô tả sai tầng: snapshot K chứa đúng pixels K
  (guard + eps đã đảm bảo); cái chứa pixels K+1 là **frame hiện tại của blend**,
  không phải snapshot.
- **Ring-fill (LIMITS gộp đợt 94 §4 mục 4):** BÁC — §1.1 (44/44 nhóm cùng ring).
  Ring ở đây luôn đầy (2/2) khi blend; số snapshot không phải biến phân biệt.
- **Vì sao nhãn (frameIdx,prev,last) không đủ:** nhãn ghi frameIdx từ
  currentTime + 2 snapshot mới nhất, nhưng blend còn dùng frame trình chiếu
  hiện tại — đại lượng thứ 4 không được ghi. Hai lần vẽ cùng nhãn có thể
  blend 2 cửa sổ khác nhau ({K-1,K,K} vs {K-1,K,K+1}). Harness T2
  (drawnStable) chỉ loại được trường hợp nhãn ĐỔI giữa lúc đo pixel, không
  loại được trường hợp nhãn giống nhau nhưng presented frame khác nhau —
  vì nhãn không chứa presented frame ngay từ đầu.
- **Vì sao spread của C thấp hơn (29,4 vs 45,5):** C có mask bám track — cửa sổ
  blend giống B nhưng tỉ lệ nhóm bimodal/đơn mức khác (chỉ-84,6: 69 nhóm ở C
  vs 45 ở B trong assert) nên median spread thấp hơn; cơ chế 2 mức vẫn y hệt
  (pha median 0,77 vs 0,31). Không phải C "ổn định hơn" về bản chất.
- **Vì sao A spread ≈ 0,2:** A là nguồn tĩnh, blurExpected=false — không blend
  (vẽ trực tiếp, gStd 112 mọi khung); không có cửa sổ blend nên không có spread.

## 5. Đo mới đợt 95 của W4 — kết quả theo từng lượt

| lượt | file | điều kiện | kết quả |
|---|---|---|---|
| assert95 | `out/preview-abcde-assert95.json` | 5 pass, cases a–e, --assert; loadavg 5,66→10,03 (W6 e1 + tsc W9) | **NHIỄM TẢI, không dùng làm baseline sạch:** chỉ 7–32 khung rAF/pass (lúc yên ~130+); gStdSpreadDrawn nGroups=1/spec → spread median 0/0,4 VÔ NGHĨA (assert tự bỏ qua khi nGroups<5); EXIT=1 với 4 fail về SỐ MẪU (a t=0,5/t=1 nG=1; e t=0,5 nG=0), không fail spread. Chữ ký bimodal vẫn tái hiện: B t=0,5 gStdMin 37,5/max 84, med 38; B t=1 med 61,3 (min 38,2/max 112,4); C t=0,5 min 36,8/max 83,7/med 60,6. |
| assert95b | `out/preview-abcde-assert95b.json` | waiter bắt cửa sổ yên 06:13:12Z (load1=1,36); loadavg vọt 15–16 giữa lượt | **VÔ HIỆU — LOẠI BỎ, không dùng:** W5 sửa `preview.tsx` lúc **06:15:41Z giữa lượt** (marker "Đợt 95 W5" ×11 sau đó) → HMR giữa chừng: 28 assert fail gồm giá trị vô lý (spec A gStd play 29,3 vs baseline 111,8 — đo nhầm pixels lúc app reload; edgeR median 117,6; trailMax=55; ring đo null; pass 2 kẹt 1500 khung rAF không qua ph>2,2). SpreadDrawn nGroups=1/spec. File JSON giữ lại làm bằng chứng nhiễm, không phân tích. |
| assert95c | `out/preview-abcde-assert95c.json` | 5 pass, cases b–e, --assert; mtime ỔN ĐỊNH (06:15:41 trước/sau) nhưng loadavg 0,60→10,46 giữa lượt (luồng khác bắt đầu việc nặng ~06:21Z) | **NHIỄM TẢI, không dùng làm baseline sạch:** chỉ 6–17 khung rAF/pass; nGroups=1/spec; EXIT=1, 13 fail. Pha tách bị nhiễu tải làm đảo ngược ở C/E (C: 37,5 med 0,01 n=16 vs 84,6 med 0,00 n=5 — n quá nhỏ + ring không liên tiếp khi capture thưa) — trái với dữ liệu yên cũ, nên không dùng để kết luận pha. Chữ ký 2 mức vẫn có mặt (B: 9×37,5 + 16×84,6; D: 30×37,5 + 11×84,6). |
| parity F95 | `out/mask-parity-f95.json` | loadavg 3,39→3,58 | **MAD=0, maxAbs=0** (240.672 px) — giống hệt pre-memo. EXIT=0. |
| parity C95 | `out/mask-parity-c95.json` | loadavg 2,78→6,37 | **MAD=0, maxAbs=0** (240.672 px) — lần đầu đo C. EXIT=0. |

### 5.1 Ba lần chạy lại assert — kết luận về điều kiện đo

- Waiter `out/wait-quiet-assert95b.sh` bắt được cửa sổ yên 06:13:12Z (load1=1,36,
  không `yes`, không tsc) rồi chạy assert95b — nhưng W5 sửa `preview.tsx` giữa
  lượt (06:15:41Z) làm vô hiệu; assert95c chạy lại lúc yên (load1=0,60) thì
  tải vọt lên 10,46 giữa lượt do luồng khác. **VM với 9 luồng song song không
  giữ được cửa sổ yên đủ 2,5 phút cho 1 lượt assert.** W4 dừng ở 3 lần thử:
  kết luận spread/pha dựa vào dữ liệu yên cũ (assert/assert2 đợt 93,
  loadavg 0,5–1,6, ~650 mẫu/spec, 2 file độc lập khớp nhau) + kiểm chứng
  blend offline — đủ mạnh, không cần thêm lần chạy nhiễm thứ 4.
- Bài học cho đợt sau: assert spread chỉ chạy khi (a) không luồng nào còn sửa
  `preview.tsx` (W5 xong hẳn), (b) các luồng nặng khác tạm nghỉ — nếu không
  thì mọi lượt đều nhiễm như 3 lượt đợt này.

### 5.2 Hiện tượng phụ lúc tải nặng (không phải nguyên nhân spread lúc yên)

- Trong assert95, dbg cuối pass của B có prevFrame cách lastFrame tới 24 frame
  (vd last 76/prev 52): rVFC thưa khi tải nặng → capture nhảy cóc, ring chứa
  snapshot KHÔNG liên tiếp. Blend với ghost cách nhau 24 frame (= 6 chu kỳ sọc
  → cùng pha) cho gStd khác triple liên tiếp. Chỉ gặp lúc tải nặng; lúc yên
  capture dày (mọi frame) nên không xảy ra. Không confund với spread lúc yên.

## 6. Nợ mở

1. **Preview blur lệch render (mới, từ §1.6 — ƯU TIÊN):** đa số tick blend
   {K-1,K,K} thay vì {K-2,K-1,K}. Hướng sửa (chưa làm, cần luồng riêng):
   khi blend, nếu snapshot mới nhất == frame hiện tại thì dùng 2 snapshot
   TRƯỚC current làm ghost (loại current khỏi tập ghost; ring vẫn giữ K cho
   frame sau); và/hoặc key blend theo presented frame (mediaTime rVFC) thay
   vì currentTime. Cần đo lại assert sau sửa (spread phải về ~0 VÀ gStd
   median về 37,5, không chỉ spread về 0) + so render thật.
2. **Harness thiếu presented frame:** `MotionBlurDebugState` cần thêm trường
   ghi frame trình chiếu thật đã dùng ở lần blend cuối (vd `lastDrawnPresentedFrame`)
   để nhóm spread theo cửa sổ THẬT. Hiện tại harness không thể phân biệt
   {K-1,K,K} với {K-1,K,K+1} — đây là lỗ hổng đo, không phải lỗi sản phẩm.
3. **Register-first dưới tải nặng có kiểm soát:** CHƯA ĐO (VM không có cửa sổ
   yên để đặt tải nền có kiểm soát lên trên; thêm `yes` của mình lúc load đã
   10 là vô nghĩa + gây nhiễu cho luồng khác). V1 đã đo lúc tải vừa: trung
   tính (0,958–0,986 cả hai chiều). Giữ mở cho đợt sau.
4. **Baseline sạch spec C với guard siết:** CHƯA CÓ (pump-c 3 pass lúc yên;
   C lần 1/2 đợt 94 đều nhiễm). Cần cửa sổ yên thật (cả `ps` lẫn loadavg).
5. **Parity pixel rVFC WebKit:** vẫn cần harness đồng bộ theo frame (nợ §4
   mục 3 LIMITS gộp đợt 94 — W3 đợt 95 đang làm).
6. **Mức ~79 (pair-blend) hiếm:** chỉ gặp sau refill ring; chưa rõ tần suất
   lúc yên thật (n=2–5/spec trong dữ liệu cũ, pha muộn). Không ưu tiên.

## 7. Verdict từng mục (nhiệm vụ W4)

| mục | verdict |
|---|---|
| 1. Điều tra gStd spread 3 mức: ring-fill? | **XONG — ring-fill BÁC.** 2 mức vật lý 37,5/84,6 (61 là median bimodal, n=0 thô); 44/44 nhóm bimodal cùng (ring,last,prev); phân biệt theo pha trong frame (median 0,69–0,79 vs 0,23–0,32); định danh blend bằng frame thật (tỉ lệ 0,334/0,755/0,718 khớp giải tích). Cơ chế: presented frame lệch currentTime ở bước vẽ. |
| 2. Đo lại parity MAD F + C trên cây gộp | **XONG.** F MAD=0 (giống hệt pre-memo); C MAD=0 (lần đầu đo C — không có số cũ). Memo không đổi pixel nào. |
| 3. Register-first dưới tải nặng + baseline sạch C | **CHƯA LÀM — giữ mở.** VM không có cửa sổ đo kiểm soát được: 3 lần chạy assert đều nhiễm (tải vọt 0,6→10,5 giữa lượt; HMR của W5 giữa lượt). Thêm `yes` của mình lên trên tải nền dao động của 8 luồng khác sẽ cho số không phân biệt được tác dụng register-first với nhiễu sibling — không đo còn hơn đo sai. V1 đã có A/B lúc tải vừa (trung tính). Baseline sạch C (pump-c 3 pass lúc yên) vẫn chưa có từ đợt 94. |
| 4. Kiểm tra mtime preview.tsx trước/sau mỗi lượt đo | **XONG — file không đổi (03:07:45Z)** trong cả 3 lượt đo (assert95, parity F, parity C). Không lượt nào vô hiệu do sửa code; assert95 chỉ nhiễm tải. |

## 8. File W4 tạo/sửa (batch stage)

W4 không sửa code repo. File duy nhất thêm vào repo là LIMITS này.
Dữ liệu đo thô (JSON assert/parity + log + script chờ + frame trích) ở
`~/workspace/round95-w4/out/` (ngoài repo, không đưa vào batch push):

- `docs/PHASE9_ROUND95_W4_GSTD_SPREAD_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round95-w4-gstd-spread.txt`
(1 file text, verify bằng read-back, 0 binary, 0 workflow).

# PHASE9_ROUND119_T5_GHOSTFRAME23_LIMITS — Event ghost frame 23: CHẨN ĐOÁN XONG — họ P4, KHÔNG hồi quy (cơ chế: desync clock/display sau seek vòng lặp)

> Luồng T5, đợt 119, lượt cron 06:35 +07 16/11/2026 (làm việc 23:40–00:0xZ 15/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> Nợ #3 đợt 118 (LIMITS gộp §10 mục 3; quyết parent §12 mục 4): chẩn đoán
> event ghost frame 23 (T4 attempt8 đợt 118) — cơ chế gì, có phải họ P4
> không, có hồi quy không.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — chỉ
> CHẨN ĐOÁN (pháp y offline trên JSON đã đo + đọc code). Không chạy lượt
> yên mới (lý do xem §5).

## 0. Kết quả chính (6 ý)

1. **Event 23 TÁI HIỆN ĐẦY ĐỦ cơ chế, tick-by-tick, từ 2 đường đo độc
   lập khớp nhau:** đường log tick của app (`curPix`/`ghostPix` trong
   blendTick) VÀ đường đọc canvas riêng của probe (gStd/pixHash mỗi
   khung rAF) đều cho cùng một trình tự (xem §1). Không phải artifact
   của một analyzer.
2. **Cơ chế: desync clock/display của video element sau seek vòng lặp
   (loop-wrap), 2 pha (xem §2):**
   - **Pha 1 — đồng hồ đứng yên, hình chạy:** `currentTime` đóng băng
     ở frame 13 (~350 ms) trong khi frame hiển thị chạy 14→23 với tốc
     độ ~30fps.
   - **Pha 2 — đồng hồ đuổi kịp, hình đứng yên:** `currentTime` chạy
     14→23 trong khi frame hiển thị đóng băng ở 23 (~333 ms).
   - Snapshot nào capture trong pha 2 cũng mang pixels frame 23 với
     nhãn lấy từ đồng hồ đang chạy (14/16/18/21) → lag +5..+9, 6
     occurrence = event 23. Nhãn snapshot ĐÚNG theo đồng hồ lúc
     capture; pixels ĐÚNG theo hình hiển thị lúc capture — lỗi nằm ở
     chỗ **đồng hồ và hình của element lệch nhau tới ~270 ms**, không
     phải ở logic gán nhãn của app.
3. **Event 23 LÀ họ P4 (event rõ thứ 6 trong họ):** cùng cấu trúc 2 pha,
   cùng vị trí (0–810 ms sau seek đầu pass), cùng dải tham số — frame
   đóng băng 23 (họ: 23/26/28/31/35), lag max ghost +9 (họ: +9..+14;
   display-lag tới +17), thời lượng 229 ms (họ: 197–421 ms), 6 occurrence
   (họ: 4–10). Frame đóng băng BIẾN THIÊN theo từng episode (R6 đóng băng
   2 lần cùng frame 31 là trùng hợp, không phải hằng số) — giả thuyết
   "frame cố định" đã bị bác từ T5 đợt 118, nay càng yếu.
4. **KHÔNG có hồi quy:** tần suất ~1 event rõ / lượt 20 pass, ổn định
   từ đợt 113 → 118 (6 rõ / 7 lượt); lag max ghost đợt 118 (+9/+11/+9)
   THẤP HƠN kỷ lục họ (+14, R6); display-lag max đợt 118 (+10/+12/+14)
   cũng thấp hơn kỷ lục display (+17, R6); thời lượng đợt 118 (197–229 ms)
   NGẮN HƠN P4 gốc (421 ms). Event 23 không vượt bất kỳ biên nào của họ.
5. **KHÔNG phải Q5-68 (seek-stale):** Q5-68 là snapshot TRƯỚC seek
   (pixels frame 68, cuối pass trước) sống sót với nhãn 0 SAU seek —
   lỗi vòng đời ring; còn họ P4 là snapshot TƯƠI (capture sau seek,
   labelCt 0,50–0,72 s) nhưng pixels lệch vì display chạy trước đồng
   hồ. Hai họ tách nhau cả về cơ chế lẫn điều kiện (P4-type xảy ra cả
   trên lượt yên; seek-stale cần tải — H-D đã đóng đợt 118).
6. **Không chạy lượt yên mới đợt này** (quyết định có lý do, §5): pháp
   y offline đã đủ mạnh (5 lượt độc lập, cùng chữ ký); T1 đang chạy
   chân B của A/B H3f — probe WebKit cạnh tranh sẽ nhiễm phép đo
   headline của đợt. Câu hỏi còn mở duy nhất (bước nào trong
   element làm đồng hồ đứng yên ở pha 1) KHÔNG trả lời được bằng cách
   chạy lại cùng probe — cần instrumentation mới (đề xuất §6).

## 1. Pháp y event 23 — tái hiện đầy đủ

Dữ liệu: `hidden_files/round118-t4/preview-b-f3-flip-webkit-t4-attempt8.json`
(cây `03bf029f`, lượt yên ĐẠT lớp B, median tickCost 40,0 ms).
Script pháp y mới: `hidden_files/round119-t5/ghost23-forensic.py`
(match pixel từng ghost/curPix về GT frame, 0-bit = khớp chắc; đối
chứng top-4 khoảng cách) + `displaylag.py` (độ lệch hiển thị
M(curPix) − floor(ct·30) từng tick).

### 1.1 Trình tự tick seq 465–485 (pass 19; pass bắt đầu seq 468, tBlend 69562)

| seq | tBlend | pres | ct·30 | skp | ring | ghosts (nhãn→pixels) | curPix |
|---|---|---|---|---|---|---|---|
| 465 | 68362 | 61 | 61,0 | 0 | 3 | 56→57; 58→60 | 63 |
| 466 | 68435 | 64 | 64,0 | 0 | 3 | 58→60; 61→63 | 65 |
| 467 | 68520 | 68 | 68,0 | 0 | 3 | 61→63; 64→65 | 67 |
| 468 | 69562 | 13 | 13,0 | 0 | 1 | 0→0; 0→0 | 13 |
| 469 | 69631 | 13 | 13,0 | 1 | 2 | 0→0; 0→0 | 14 |
| 470 | 69683 | 13 | 13,0 | 1 | 2 | 0→0; 0→0 | 16 |
| 471 | 69749 | 13 | 13,0 | 1 | 2 | 0→0; 0→0 | 17 |
| 472 | 69818 | 13 | 13,0 | 1 | 2 | 0→0; 0→0 | 20 |
| 473 | 69872 | 13 | 13,0 | 1 | 2 | 0→0; 0→0 | 21 |
| 474 | 69936 | 13 | 13,3 | 1 | 2 | 0→0; 0→0 | 23 |
| 475 | 69981 | 14 | 15,0 | 0 | 2 | 0→0; 13→13 | 23 |
| **476** | **70040** | **16** | **16,7** | 0 | 3 | 13→13; **14→23** | **23** |
| **477** | **70129** | **18** | **18,8** | 0 | 3 | **14→23; 16→23** | **23** |
| **478** | **70203** | **21** | **21,5** | 0 | 3 | **16→23; 18→23** | **23** |
| **479** | **70269** | **23** | **23,7** | 0 | 3 | **18→23; 21→23** | **23** |
| 480 | 70339 | 25 | 25,0 | 0 | 3 | 21→23; 23→23 | 25 |
| 481 | 70413 | 26 | 26,0 | 0 | 3 | 23→23; 25→25 | 26 |
| 482 | 70485 | 27 | 27,0 | 0 | 3 | 25→25; 26→26 | 28 |
| 483 | 70552 | 31 | 31,0 | 0 | 3 | 26→26; 27→28 | 30 |

Đọc bảng:
- **Bình thường (465–467):** ghost lệch nhãn +1..+2 frame (56→57,
  58→60, 61→63, 64→65) — đây là baseline: snapshot luôn mang pixels
  đi trước nhãn ~1–2 frame (khớp phân phối lag (b) median 1f của T4).
- **Loop-wrap (468):** presented 68→13, ring reset (ringSize 1,
  ringPrev 0, ghost 0→0), gap tBlend 1042 ms (seek + chờ).
- **Pha 1 (469–474, ~350 ms):** presented/ct đóng băng ở 13 (ct
  13,0→13,3), skp=1, ring giữ nguyên 0→0 — nhưng curPix chạy
  14→16→17→20→21→23 (~2 frame/tick ≈ 30fps). Đồng hồ đứng yên, hình
  chạy.
- **Pha 2 (475–479):** ct chạy 15,0→23,7; curPix ĐÓNG BĂNG ở 23
  (tBlend 69936–70269, ~333 ms). 4 snapshot capture trong pha 2:
  nhãn 14 (labelCt 0,4999, snapMs 69981), 16 (0,5568, 70040), 18
  (0,6253, 70128), 21 (0,7175, 70203) — TẤT CẢ pixels frame 23
  (match 0 bit; ứng viên kế 11 bit — khớp chắc chắn tuyệt đối).
  Snapshot nhãn 23 (labelCt 0,7889, snapMs 70269) pixels 23: đúng
  trở lại — đồng hồ đã đuổi kịp hình.
- **Hồi phục (480+):** curPix 25/26/28, ghost lệch về 0..+1 — bình
  thường trở lại. Event chỉ tồn tại trong cửa sổ pha 2.

### 1.2 Đường đo độc lập thứ hai: probe tự đọc canvas (rAF frames pass 19)

Probe đọc preview canvas bằng `getImageData` riêng (không qua log
tick của app) — khớp hoàn toàn:

| rAF frame | ph | vt (currentTime) | gStd_core | pixHash | kết luận |
|---|---|---|---|---|---|
| [0]–[9] | 0→0,433 | 0 → 0,4333 (nhảy ở [7]) | 116,9 không đổi | 177372188 không đổi | canvas đóng băng ~10 khung sau seek (cả đồng hồ lẫn hình đều đứng) |
| [10]–[16] | 0,433 | **0,4338–0,4444 đóng băng** | 99→75,9→88→86,5→94,1→78,8→81,3 (đổi mỗi khung) | đổi mỗi khung | **pha 1 độc lập:** canvas đổi nội dung trong khi currentTime đứng yên |
| [17]–[18] | 0,467–0,533 | 0,4999–0,5568 | 67,8; 83,5 | đổi | chuyển pha |
| [19]–[21] | 0,6–0,767 | 0,6253→0,7889 (chạy) | **114,5 không đổi** | **752086156 không đổi** | **pha 2 độc lập:** canvas đóng băng trong khi currentTime chạy |
| [22]+ | 0,833+ | 0,8333+ | 95,6; 54,9… | đổi | bình thường trở lại |

Lưu ý: cờ `frozen` của probe KHÔNG bắt được pha 2 ([19]–[21] ghi
frz=0 vì playhead vẫn chạy) — chỉ pixHash giống hệt nhau mới lộ ra.
Hai đường đo (app tick log + probe canvas read) đồng thuận 100% về
trình tự 2 pha; không còn chỗ cho giả thuyết "artifact analyzer".

### 1.3 Vì sao snapshot pha 1 không vào ring, pha 2 thì có

Gate snapshot của app (R1): chỉ thêm snapshot mới khi `frameIdx`
(nhãn từ đồng hồ) đổi. Pha 1 đồng hồ đóng băng ở 13 → không snapshot
mới nào được thêm (ring giữ 0→0 từ lúc seek; skp=1 suốt pha 1). Pha 2
đồng hồ chạy trở lại → mỗi tick thêm 1 snapshot mới, nhãn chạy theo
đồng hồ (14/16/18/21) nhưng pixels lấy từ hình đang đóng băng (23).
Mỗi snapshot tồn tại trong cửa sổ blend 2 ghost × 2 tick liên tiếp →
4 snapshot pha 2 cho 6 occurrence lag ≥+5 (seq 476: 14; 477: 14+16;
478: 16+18; 479: 18 — occurrence (479,21) chỉ lag +2 nên không đếm).
Đây cũng là lý do event "đạt tiêu chí ≥3 ghost liên tiếp" đúng bằng
độ dài pha 2: pha 2 càng dài, event càng nhiều occurrence.

### 1.4 Hai event dưới ngưỡng cùng lượt (frame 19/22, pass 18)

Cùng lượt attempt8, pass 18 (bắt đầu seq 442, tBlend 66550) có episode
chỉ-pha-1: ct đóng băng ở 14 (seq 442–444), curPix 19→20→22, rồi đồng
hồ chạy lại ngay (seq 445: ct 16,5) — hình KHÔNG đóng băng (curPix
tiếp tục 22→22 rồi chạy). Snapshot 14→19, 16→22, 18→22: mỗi frame chỉ
2 occurrence → dưới ngưỡng ≥3. **Phân loại rõ: event đầy đủ ⟺ có
pha 2 đủ dài (≥3 tick); chỉ pha 1 ⟺ lag rải rác dưới ngưỡng.** Đây
là cùng một transient, khác nhau ở chỗ pha 2 có kịp hình thành không.

## 2. Cơ chế đầy đủ — transient resync sau seek vòng lặp

Trình tự sau mỗi lần seek về 0 đầu pass (tổng hợp từ 5 lượt, §3):

| giai đoạn | đồng hồ (currentTime) | hình hiển thị (drawImage) | ghost quan sát được |
|---|---|---|---|
| **0. Stall sau seek** (~0,4 s playhead) | 0 (đứng) | 0 / frame cũ (đứng) | không có (ring vừa reset) |
| **0b. Nhảy đồng hồ** | nhảy 0→~0,43 (đuổi kịp playhead) | vẫn đứng ở frame cũ | lag ÂM nếu snapshot capture lúc này (pixels 0, nhãn ~14 — xem P4 seq 314–315: M=0 nhãn 15, lag −15) |
| **1. Đồng hồ đứng, hình chạy** (~300–550 ms) | đóng băng (~0,43) | chạy ~30fps (14→23/26/31/35) | chưa có snapshot mới (gate frameIdx); chỉ curPix lộ |
| **2. Đồng hồ đuổi, hình đứng** (~200–800 ms) | chạy (~1,0–1,2×) | đóng băng ở frame đỉnh pha 1 | snapshot nhãn chạy + pixels đóng băng = **event P4-type** |
| **3. Đồng bộ lại** | chạy bình thường | chạy bình thường | lag về 0..+2 |

Điểm mấu chốt: **nhãn snapshot luôn đúng theo đồng hồ, pixels luôn
đúng theo hình hiển thị — hai thứ đó lệch nhau tới ~270 ms trong
transient.** App không gán nhãn sai; element (WebKitGTK/GStreamer)
trả `currentTime` và `drawImage` không đồng bộ với nhau sau seek.
Bằng chứng phân biệt với lỗi app: (i) probe đọc canvas độc lập cũng
thấy cùng desync (§1.2); (ii) `anchorSrc=frameIdx` ở mọi tick event
(presented rơi về frameIdx vì không có anchor tươi — presented cũng
chỉ là ảnh của đồng hồ, nên presented đóng băng cùng đồng hồ là hệ
quả, không phải nguyên nhân); (iii) snapshot `srcKind=canvas` — pixels
đi qua canvas trung gian drawSrc, nhưng canvas đó được vẽ lại mỗi tick
từ video element nên vẫn phản ánh hình hiển thị thật (curPix cùng
nguồn cũng cho kết quả y hệt).

Vì sao frame đóng băng biến thiên: nó là frame mà hình đạt tới cuối
pha 1 = (độ dài pha 1) × (tốc độ decode/burst) — phụ thuộc tải và tốc
độ decoder lúc đó, không phải hằng số. R6 đóng băng 2 lần cùng frame
31 là trùng hợp trong cùng một lượt (cùng điều kiện tải), không phải
quy luật — 5 lượt còn lại cho 5 frame khác nhau (23/26/28/35 + 31).

## 3. So sánh họ P4 — event 23 là thành viên thứ 7

### 3.1 Độ lệch hiển thị (displayLag = M(curPix) − floor(ct·30)) trên 5 lượt

Baseline mọi lượt: 0..+4 (median ~+2; riêng P4 có thêm 11 tick lag
âm −5..−15 — xem §3.3). Tick ≥+5 chỉ tập trung ở 1–2 pass/lượt:

| lượt | tick ≥+5 | pass chứa episode | max displayLag | frame đóng băng |
|---|---|---|---|---|
| P4 (r113, q1) | 14 | p5 (episode) + 5 singleton +5 rải rác | **+13** | 26 |
| R6 (r115, att5) | 23 | p3 + p12 (2 episode) | **+17** | 31, 31 |
| T5a2 (r118) | 8 | p6 | +12 | 35 |
| T5a3 (r118) | 8 | p13 (+1 singleton p10) | +14 | 28 |
| T4a8 (r118) | 10 | p12 (chỉ pha 1) + p13 | +10 | 22 (dưới ngưỡng), 23 |

**Mọi episode đầy đủ đều nằm trong 0–810 ms sau seek đầu pass:**
P4 192–676 ms; R6 0–810 ms và 144–695 ms; T5a2 118–607 ms; T5a3
248–733 ms; T4a8 0–220 ms (pha 1) và 256–567 ms (event 23). Các
singleton +5 ở 833–1979 ms sau pass-start (P4/R6/T5a3) là hiện tượng
nhẹ khác (1 tick, giữa pass, clock 27–59) — không phải episode
post-seek, không thành event.

### 3.2 Bảng họ P4-type (event rõ: ≥3 ghost liên tiếp cùng 1 frame; lag max = ghost lag)

| event | lượt | frame | occurrence | thời lượng (ghost) | lag max | seq (tBlend) |
|---|---|---|---|---|---|---|
| P4 | r113 | 26 | 6 | 421 ms | +12f | 220–223 (48440–48861) |
| R6-ev2 | r115 | 31 | 10 | 367 ms | +14f | ~213–219 (36050–36417) |
| R6-ev3 | r115 | 31 | 8 | 316 ms | +14f | ~435–440 (65461–65777) |
| R6-ev1 (nhỏ) | r115 | 19 | 2 | 90 ms | +5f | ~213 (35960–36050) |
| T5a2 | r118 | 35 | 6 | 225 ms | +11f | 308–311 (47381–47606) |
| T5a3 | r118 | 28 | 4 | 197 ms | +9f | 418–420 (64482–64679) |
| **T4a8-23** | **r118** | **23** | **6** | **229 ms** | **+9f** | **476–479 (70040–70269)** |

Tally sau đợt 119 (đếm lại từ nguồn gốc — đính chính số học ở T5
đợt 118 §5, "6 rõ / 6 lượt" cộng sai: 1+0+2+0+2 = 5 rõ trước T4a8):
**6 rõ + 3 dưới ngưỡng / 7 lượt** (P4 1 + Q5 0 + R6 2 rõ + 1 nhỏ +
S6att1 0 + T5 2 rõ + T4a8 1 rõ + 2 dưới ngưỡng). R6-ev2/ev3 có cùng
cấu trúc tick-by-tick với event 23 (đã pháp y seq 205–217: pha 1 ct
đóng băng 14, curPix 19→31; pha 2 snapshot 17→31, 19→31, 22→31,
24→31 — y hệt event 23, chỉ khác frame đỉnh). **Kết luận: event 23
LÀ họ P4, không phải loại mới.** (Lưu ý phân biệt 2 metric: lag max
ghost +9..+14; display-lag max +9..+17 — display-lag luôn ≥ ghost-lag
vì nó đo ở thời điểm hình chạy nhanh nhất, trước khi snapshot kịp
capture.)

### 3.3 Mặt âm của cùng transient (lag âm) — biến thiên giữa các lượt

- P4 (r113): 11 tick ghost lag −10..−15 (vd seq 314–315: M=0 nhãn 15;
  seq 226–228: M=27 nhãn 38/40) — giai đoạn 0b: đồng hồ đã nhảy
  trước, hình còn đứng ở frame cũ.
- Q5 (r114): 24 tick displayLag −5..−18.
- Đợt 118 (T4a8/T5a2/T5a3): **0 tick lag âm** — nhảy đồng hồ và hình
  bắt đầu gần như đồng thời.
Đây là cùng một transient resync, dấu của độ lệch ở giai đoạn 0b
phụ thuộc thời điểm tương đối giữa "đồng hồ nhảy" và "hình bắt đầu
chạy" — biến thiên theo lượt, không phải cơ chế riêng. Không có ý
nghĩa hồi quy hay cải thiện; chỉ ghi nhận để đợt sau khỏi ngạc nhiên
khi lag âm tái xuất.

### 3.4 Đối chiếu Q5-68 (seek-stale) — khác họ, đã đóng H-D

Q5 event (r114, `lag5-detail.txt`): seq 282–285, **nhãn HẰNG 0**,
M=68, 7 occ, 327 ms, lag +68. Snapshot pixels frame 68 = frame cuối
pass trước (curPix seq 281 = 68, clock 63 — hình đang ở 68 ngay trước
seek). Cơ chế: snapshot TRƯỚC seek sống sót trong ring với nhãn 0
SAU seek (vòng đời ring sau seek). Khác họ P4 ở 3 điểm: (i) nhãn
không chạy theo đồng hồ (0 hằng vs 14→21); (ii) pixels là frame
trước-seek, không phải hình sau-seek; (iii) cần tải để bộc lộ (H-D:
yên 0/60 vs nhiễm 5/40, p=0,0087 — ĐÃ ĐÓNG đợt 118). Họ P4 xảy ra cả
trên lượt yên (dissociation đã ghi ở T5 §5) — không cùng điều kiện
tải, không cùng cơ chế, không gộp chung.

## 4. Hồi quy? KHÔNG — 3 trục đều trong biên họ

1. **Tần suất:** ~1 event rõ / lượt 20 pass, ổn định r113→r118
   (1, 0, 2, 0, 1, 1, 1 rõ mỗi lượt). Đợt 118 có 3 event rõ / 3 lượt
   yên — đúng nhịp lịch sử, không tăng.
2. **Mức độ:** lag max ghost đợt 118 (+9/+11/+9) ≤ kỷ lục họ (+14, R6);
   display-lag max đợt 118 (+10/+12/+14) ≤ kỷ lục display (+17, R6);
   thời lượng đợt 118 (197/225/229 ms) ≤ P4 gốc (421 ms); occurrence
   (4/6/6) trong dải họ (4–10).
3. **Frame đóng băng:** 23 là frame mới (23/26/28/31/35 đều khác
   nhau) — đúng kỳ vọng của cơ chế biến thiên (§2), không phải dấu
   hiệu frame xấu mới xuất hiện.
**Verdict: event 23 không phải hồi quy. Nợ chẩn đoán #3 đợt 118 ĐÓNG
về mặt phân loại + cơ chế; phần còn mở là bước element-level gây ra
pha 1 (§6).**

## 5. Vì sao không chạy lượt yên mới đợt này (quyết định)

Cân nhắc trước khi quyết (ghi rõ để parent/T10 đối chiếu):

- **Ủng hộ chạy:** task cho phép 1–2 lượt yên; thêm 1 mẫu nữa cho
  tần suất; kiểm tra H3f (vừa apply) có đổi hành vi ghost không.
- **Chống chạy — thắng:**
  1. **Pháp y offline đã đủ mạnh để trả lời cả 3 câu hỏi được giao**
     (cơ chế §2, họ P4 §3.2, hồi quy §4): 5 lượt độc lập, cùng chữ ký
     2 pha; event 23 tái hiện tick-by-tick từ 2 đường đo độc lập khớp
     nhau; tally 7 event/7 lượt. Lượt thứ 6 chỉ thêm 1 mẫu tần suất,
     không đổi kết luận nào.
  2. **T1 đang chạy chân B của A/B H3f** (cờ `round119-t1-applied`
     đã có lúc ~00:00Z; leg B `chr-mixedalt-h3f-B-fr4` bắt đầu ngay
     sau đó). Probe WebKit + vite của T5 (cổng 5188, ~90 s tải) sẽ
     tranh CPU/vite-lock với phép đo headline của đợt — nhiễm A/B là
     cái giá thật, lợi ích là 1 mẫu ghost phụ. Không đáng.
  3. **Câu hỏi còn mở không trả lời được bằng cách chạy lại cùng
     probe:** pha 1 cần biết trạng thái element (`seeking`,
     `readyState`, `seekable`, event `seeked`/`canplay`) trong cửa sổ
     đóng băng — probe hiện tại không ghi các trường này. Chạy lại
     chỉ lặp lại chữ ký đã biết.
- **Điều kiện đã kiểm (không chạy mà vẫn ghi):** cờ T7
  `round119-t7/POSTBOOT_PASS` TỒN TẠI (ghi 23:47Z, boot 27c8b1d9);
  cờ T1 `round119-t1-applied` TỒN TẠI (lúc ~00:00Z); cây lúc chẩn
  đoán: preview.tsx `5be5a250…` (H3f ĐÃ apply — T1 làm, không phải
  T5; dữ liệu pháp y dùng cây `03bf029f` đợt 118, ghi rõ để khỏi lẫn).
  Boot hiện tại 27c8b1d9 (bắt đầu 23:33:34Z 15/11; số thứ tự chờ T6
  đếm lại mù #37 — không tự đặt số).
- **Không chạy tsc/vite-build trong luồng này:** T1 đang sở hữu cây
  cho A/B chân B; kiểm hồi quy cây patch thuộc về chân B của T1 +
  suite gộp của T10. T5 không sửa production (md5 đổi 03bf029f →
  5be5a250 là do T1 apply H3f, đã đối chiếu đúng md5 patch T2 dự
  báo).

## 6. Nợ mở + đề xuất

1. **(Mở, nhỏ) Bước element-level của pha 1:** vì sao `currentTime`
   đóng băng ~350 ms trong khi sink vẫn trình chiếu? Cần probe
   instrument mới (probe-only, không sửa production): trong vòng rAF
   của probe, mỗi khung ghi thêm `el.seeking`, `el.readyState`,
   `el.networkState`, `el.currentTime` (độ phân giải ~80 ms hiện tại
   là đủ — pha 1 dài 300–550 ms) + lắng nghe event `seeking`/
   `seeked`/`canplay`/`waiting` với timestamp. Phân biệt được 2 giả
   thuyết: (a) seek chưa xong (`seeking=true` suốt pha 1 — GStreamer
   seek async); (b) seek xong nhưng pipeline clock stall sau seek
   (`seeking=false` mà currentTime vẫn đứng). Đề xuất 1 lượt yên có
   instrument ở đợt sau, khi không đụng A/B của luồng khác.
2. **(Đề xuất, chưa làm) Hướng mitigation cho app (để đợt sau thiết
   kế + test, không tự làm ở đây):** app không sửa được desync của
   element, nhưng có thể PHÁT HIỆN transient và loại snapshot nhiễm:
   tín hiệu rẻ nhất đã có sẵn trong tick — `currentTime` không đổi
   qua ≥3 tick liên tiếp trong lúc đang phát (pha 1), tiếp theo là
   đuổi kịp nhanh (pha 2). Snapshot capture trong pha 2 (nhãn chạy
   nhanh bất thường sau 1 quãng đóng băng) là ứng viên loại/đánh dấu.
   Chưa chứng minh (cần đo false-positive trên lượt bình thường:
   baseline displayLag 0..+4, pha 1 cho +5..+17 — ngưỡng tách khá
   rõ, nhưng chưa đo tỷ lệ báo động giả). KHÔNG đề xuất sửa ngay;
   chỉ ghi hướng để luồng sau cân nhắc cùng với hướng H-A đang mở
   (gán nhãn theo frame thực sự được yield).
3. **(Đứng yên) Theo dõi tiếp ở các lượt yên sau:** đếm episode
   post-seek (displayLag ≥+5 trong 1 s đầu pass) như metric thường
   kỳ — nếu tần suất vượt >2 episode/lượt hoặc lag max vượt +17 thì
   mở lại nợ. Script `displaylag.py` + `ghost23-forensic.py` đã để
   sẵn trong `hidden_files/round119-t5/` để tái dùng.
4. **Nợ khác không đổi theo LIMITS gộp đợt 118 §10:** E4 lô đo lớn
   (T9 đợt 119); H3f apply + A/B (T1 đợt 119, đang chạy chân B);
   điểm gãy tải (T3 đợt 119); mù #37 + probe #38 (T6 đợt 119); G1 +
   mù #22/#28–#31/#35 chờ user; birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml 403 chờ user; release gate không đổi.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND119_T5_GHOSTFRAME23_LIMITS.md` — file này. **File
  duy nhất trong repo mà T5 thay đổi** (probe/analyzer/dữ liệu đều ở
  hidden_files; không sửa production).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round119-t5-ghostframe23.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round119-t5/`
  (ghost23-forensic.py [match pixel từng ghost/curPix, top-4 khoảng
  cách], displaylag.py [displayLag M(curPix)−floor(ct·30) theo pass],
  forensic-t4a8-seq465-485.txt [event 23 đầy đủ],
  forensic-t4a8-seq442-447.txt [event 19/22 dưới ngưỡng],
  forensic-r6-seq205-217.txt [episode R6-1 đối chiếu],
  displaylag-t4a8.txt + displaylag-t5a2.txt + displaylag-t5a3.txt +
  displaylag-p4.txt + displaylag-r6a5.txt + displaylag-q5.txt
  [phân phối displayLag 6 lượt]).
- Cờ xong: `hidden_files/round119-t5.done` (tạo SAU KHI LIMITS +
  batch xong).

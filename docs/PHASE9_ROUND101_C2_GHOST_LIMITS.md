# PHASE9_ROUND101_C2_GHOST_LIMITS — đo lại jitter mẫu lớn + F5 bị bác + ngoại suy presented chết ở seek đầu tiên

> Luồng C2, đợt 101, lượt cron 06:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ LIMITS gộp đợt 100 §4 mục 4: "Ghost residual — phase jitter presented-frame↔currentTime
> (±1, thỉnh thoảng ±2) là thủ phạm; fix A2 không hiệu quả; cần fix mới theo hướng jitter".
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
> KHÔNG SỬA PRODUCTION trong luồng này — mọi kết luận dưới đây là đo + phân tích code,
> không có fix nào được land (xem §6: vì sao fix ứng viên đơn giản chết, và tap rVFC là
> hướng tiếp theo duy nhất còn đứng).
>
> **Kết quả chính (4 ý):**
> 1. **Jitter được xác nhận trên mẫu lớn hơn B2 gấp ~2–3 lần, ổn định qua 3 mẫu độc lập:**
>    clean chỉ **44–49%** (B2 n=71: 49%; D1 n=163: 44%; D1b n=114: 46%; flip-baseline n=151:
>    45%); offset ±1/±2 rải đều hai chiều; P2 (frame thật == floor(rawCt·30)) **44–46% ≈
>    đúng bằng baseline "cứ đoán nhãn"** — rawCt không hơn gì nhãn, lần thứ hai.
> 2. **Fix hiệu chuẩn pha F5 BỊ BÁC bằng counterfactual:** không có hằng số δ* nào (theo run
>    hay theo pass) đẩy tỉ lệ clean lên trên 46% — δ* tốt nhất luôn là +0 (tức không dịch).
>    δ KHÔNG phải pha ổn định theo phiên/pass.
> 3. **δ-tracking cũng không đáng tin:** tự tương quan lag-1 của offset là **53% vs 28%
>    chance ở D1 nhưng 27% vs 29% ở D1b** — hai run mâu thuẫn nhau; không thể dựa vào
>    δ ổn định hay trôi chậm để thiết kế fix.
> 4. **Thí nghiệm flip-protocol CHỨNG MINH fix ngoại suy đơn giản chết ở seek đầu tiên:**
>    sau khi tắt rVFC giữa run, gap presented−expected giữ trong ±3 đúng 2 giây đầu (32/32),
>    rồi vọt lên **+80 ở seek đầu tiên (+2905ms) và tăng thêm ~73–80 mỗi seek sau đó**
>    (158, 233, …, 1028 ở seek cuối) — |gap|≤3 còn 0% sau 5 giây. Nhãn theo presented
>    estimate ngoại suy từ metadata pump đã chết sẽ sai hoàn toàn sau 1 seek; chỉ có tap
>    rVFC độc lập (resync sau mỗi seek) mới cứu được hướng này — và tap không có trên
>    WebKit (nơi đường tick là đường duy nhất).

## 0. Môi trường đo

- Boot 3a12a7d3-4230-4835-800b-5f34e015c7eb — **reboot #25 ~23:51–23:52Z 12/11**
  (aa3f2b67 → 3a12a7d3) giết vite C2 giữa phiên; vite khởi động lại từ `apps/web`
  (chạy từ repo root crash ENOSPC file watchers — nó watch cả `server/caption/.venv`).
- Lượt chạy 23:44Z 12/11 – 00:25Z 13/11. RAM khả dụng 457 MB – 1,9 GB (dao động theo
  luồng khác). Load rất thất thường do 8–10 luồng đợt 101 chạy song song (0,64 – 14,03).
- Vite riêng C2 trên 5173 (verify serve code trước probe: `tickLabelCtx` ×5, `labelMs` ×2,
  md5 `94ee64c0525c8d34f14ba9a579d516ef` khớp cuối đợt 100).
- **Xung đột luồng:** ~00:07Z, giữa lúc flip probe đang chạy, luồng **C3 (đợt 101)** sửa
  `preview.tsx` (md5 → `a6e3469133d91d0407935ad86794f1f6`, marker "Đợt 101 C3" ×5 ở
  ~4504/~5738/~5942/~6157/~6216 — vùng drift-gate đuôi/re-arm, KHÔNG đụng vùng
  ring/blend/pump/snapshot/nhãn của C2). D1/D1b chạy trên 94ee64c0; flip chạy trên
  a6e34691 (vite reload module mới). Đo gap presented−expected không phụ thuộc vùng C3.
- Probe: `probe101c2-ghost.cdp.mjs` (copy probe100b2 + option `--flip-rvfc-after-pass N` mới).
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
- **WebKit: KHÔNG chạy được** (như B2 — không có driver; chỉ có minibrowser không lái
  được qua CDP). Mọi kết luận nhân quả chỉ đo trên Chromium.

## 1. Đo lại jitter — D1 + D1b (mẫu lớn hơn B2)

### 1.1 Hai run --disable-rvfc, 20 pass, case B

| | D1 | D1b ("quiet") | B2 run T (đợt 100, để so) |
|---|---|---|---|
| Thời gian | 23:52–23:54Z | 00:02–00:04Z | 20:48–20:50Z |
| Load | 2,21 → 5,90 | 0,64 → 5,12 (10s đầu) → 14,03 | 4,8–11,4 |
| Blend tick | 1439 (72/pass) | 401 (20/pass) | 118 (12/pass) |
| Khung play đo được | 1343 | 448 | — |
| tickCost totalMs trung vị | 7,3ms | 32,6ms | 93,5ms |
| rawMs trung vị | 0,0ms | 0,1ms | 0,1ms |
| Assert | 1 fail (spread 47, nGroups=109) | **ASSERT PASS** (spread 14,8, nGroups=12) | ASSERT PASS |
| Snapshot distinct | 224 (det n=163) | — (det n=114) | 95 (det n=71) |

- D1 KHÔNG phải run idle sạch như mục tiêu (load tăng suốt run do luồng khác khởi động
  lại sau reboot #25) — ghi là "trung bình → tải vừa", không mạo nhận idle.
- D1b đặt tên "quiet" nhưng cửa sổ yên chỉ kéo dài ~10 giây (load 0,64 → 5,12); cuối
  run load 14,03, chỉ 401 blend tick (thưa do máy bị chiếm) — spread 14,8 trên nGroups=12
  là mẫu nhỏ, KHÔNG dùng để kết luận spread đã tốt (D1 với nGroups=109 cho spread 47).
- Assert spread fail ở D1/flip là KỲ VỌNG ở đường tick (assert này thiết kế cho đường
  rVFC: cùng nhãn cửa sổ đã vẽ phải cho cùng gStd; ở đường tick nhãn sai ±1 ngẫu nhiên
  nên cùng nhãn vẫn cho cửa sổ thật khác nhau → spread lớn). Các assert khác đều xanh
  (trail 0, mép, cx, blur, ring=3, skippedDuplicate>0).

### 1.2 Q1 — phân bố offset (trueRes − predRawRes), snapshot phân biệt

| Run | 0 (khớp) | +1 | +2 | −1 | −2 |
|---|---|---|---|---|---|
| B2 (n=71) | 35 (49%) | 15 | 8 | 9 | 4 |
| **D1 (n=163)** | **72 (44%)** | 34 | 16 | 25 | 16 |
| **D1b (n=114)** | **52 (46%)** | 23 | 17 | 11 | 11 |
| Flip-baseline (n=151, §4) | 68 (45%) | — | — | — | — |

- Phân bố ổn định qua 3 mẫu độc lập: chỉ ~44–49% khớp, còn lại rải đều ±1/±2 hai chiều.
  Jitter không phải nhiễu mẫu nhỏ của B2.
- Bucket inRaw nhanh nhất [0;16,7ms): D1 mislabeled 84/151 = **56%**; D1b 47/90 = **52%**
  (B2: 57%) — tick nhanh vẫn mislabel hơn nửa; không phải advance-trong-tick. Đây là
  lần thứ hai (sau B2) và thứ ba (D1b) cùng kết luận này, trên tickCost totalMs trung vị
  chỉ 7,3ms (D1) — tick nhanh gấp ~13 lần B2 mà tỉ lệ mislabel không đổi.

### 1.3 Q4 — P2 kiểm lại: rawCt không hơn gì nhãn

- D1: hit **72/163 = 44,2%** vs label-baseline 72/163 = 44,2% (B2: 49,3% vs 47,9%).
- D1b: hit **52/114 = 45,6%** vs baseline 45,6%.
- Fix A2 ("đọc lại currentTime ngay trước drawImage") tiếp tục bị bác: frame thật
  không dự đoán được từ bất kỳ mốc currentTime nào trong tick.

### 1.4 Q3 — tương quan gap / inRaw: yếu và không nhất quán giữa 2 run

- Gap blend-tick (delta tBlend): D1 — [0,60ms): mislabel 48% (n=123); [60,150ms): **82%**
  (n=38); signed offset ở gap dài hơi lệch + (1:12, 2:7 vs −1:8, −2:4). D1b — [0,60):
  59% (n=22); [60,150): 50% (n=62); [150,400): 63% (n=27) — KHÔNG có xu hướng.
  Kết luận: tương quan gap↔mislabel (nếu có) yếu, không tái lập được giữa 2 run;
  không dùng làm cơ sở fix.
- inRaw: cả D1/D1b đều cho mislabel ~52–56% ngay ở bucket nhanh nhất — xem §1.2.

## 2. Verdict 1 — F5 (hiệu chuẩn pha hằng số) BỊ BÁC bằng counterfactual

- Phương pháp: với mỗi snapshot đơn-nghĩa, tính tỉ lệ clean nếu dịch nhãn mọi snapshot
  theo hằng số δ* ∈ {−2,−1,0,+1,+2} (theo toàn run, rồi theo từng pass).
- Kết quả (toàn run): B2/D1/D1b/flip đều cho δ* tốt nhất = **+0** với clean **44–46%**;
  δ*=+1 chỉ 20–21%, δ*=−1 chỉ 10–15%, δ*=±2 chỉ 10–17%.
- Theo từng pass (D1): δ* nhảy loạn xạ giữa các pass (+0 ở pass 0–1, +1 ở pass 2–3,
  +2 ở pass 4, −2 ở pass 5, +1 ở pass 8–9, −1 ở pass 10–13, −2 ở pass 17–19) với
  n nhỏ (4–12) và clean share tối đa theo pass chỉ 33–71% — không có δ* nào của pass
  đạt ngưỡng 85% đã đăng ký; phần lớn pass δ* tốt nhất vẫn ≤60%.
- **Kết luận: không tồn tại pha hằng số (theo phiên hay theo pass) để hiệu chuẩn.
  Mọi fix dạng "học δ một lần rồi áp" đều chết.** Đây là thí nghiệm quyết định đã
  đăng ký trước trong boot.log, và nó trả lời KHÔNG.

## 3. Verdict 2 — δ-tracking (trôi chậm) KHÔNG đáng tin: D1 vs D1b mâu thuẫn

- Phương pháp: sắp xếp snapshot phân biệt theo thứ tự xuất hiện đầu tiên (tBlend),
  tính lag-1 agreement của offset và run-length, so với chance = Σ p_k².
- **D1:** lag-1 agreement **86/162 = 53,1% vs chance 28,1%**; lag-1 (cặp cách <300ms)
  62,6%; run-length trung bình 2,12 (iid kỳ vọng 1,39), max run **49**; cặp 0→0: 59
  (kỳ vọng độc lập 31,6). → Tương quan thời gian MẠNH.
- **D1b:** lag-1 agreement **31/113 = 27,4% vs chance 29,0%**; lag-1 (<300ms) 25,4%;
  run-length 1,37 (iid 1,41), max run 9; cặp 0→0: 24 (kỳ vọng 23,5). → KHÔNG tương quan.
- Diễn giải thận trọng: tương quan ở D1 bị chi phối bởi khối clean dài đầu run
  (pass 0–1: 64/74 clean = 86%, trong đó pass 1 là 34/34 = 100%) rồi sụp đổ ở các
  pass sau (pass 2–19: 8/89 clean = 9%) — nhưng khối clean đầu run này KHÔNG tái lập
  ở D1b (pass 0–1: 18/31 = 58%; pass 2–19: 34/83 = 41%, không có xu hướng thời gian).
  Cơ chế dedup theo (label, pix) cũng làm nhiễu phân tích theo pass (xem §5.3):
  pass sau chỉ còn đóng góp các biến thể nhãn chưa từng thấy — chủ yếu là mislabeled.
- **Kết luận: không có bằng chứng vững cho δ trôi chậm; hai run mâu thuẫn nhau.
  Không thiết kế fix dựa trên δ ổn định/trôi chậm.**

## 4. Verdict 3 — flip-protocol: ngoại suy presented CHẾT ở seek đầu tiên (chứng minh)

### 4.1 Phương pháp

- Probe mới: `--flip-rvfc-after-pass 5` — 5 pass đầu pump sống (rVFC bật), sau pass 5
  đặt `window.__vcutDisableRvfc = true` (ghi `flipWallMs`), 15 pass sau chạy đường tick
  với metadata trình chiếu đóng băng. Không sửa production.
- Câu hỏi đăng ký trước: gap `presented − expected` (từ blend-tick log) có giữ trong ±3
  qua các seek hậu flip không? Nếu có → fix ngoại suy đơn giản còn khả thi. Nếu phân kỳ
  → fix đơn giản chết, chỉ còn hướng tap rVFC.

### 4.2 Số liệu — gap presented−expected hậu flip (n=824 tick)

| Hậu flip | n | Gap trung vị | Min–max | \|gap\|≤3 |
|---|---|---|---|---|
| [0, 2000)ms | 32 | 0,0 | −1…+3 | **32/32 (100%)** |
| [2000, 5000)ms | 33 | 80,0 | −2…+84 | 9/33 (27%) |
| [5000, 15000)ms | 154 | 306,0 | 81…383 | **0/154 (0%)** |
| [15000ms+) | 605 | 730,0 | 380…1031 | **0/605 (0%)** |

- Gap tại mỗi seek hậu flip (expected reset về 0): +2905ms → **80**; +5587ms → **158**;
  +8022ms → **233**; +10437ms → **306**; …; +34527ms → **1028**. Tăng đúng ~73–80
  (một độ dài pass) mỗi seek. 10 gap cuối: 1028–1030.
- Cơ chế (đọc code, khớp số đo): `rvfcKillPump`/`stale` không xoá pump khỏi `rvfcPumps`
  nên `presentedFrameIndex` tiếp tục ngoại suy từ `lastExpectedDisplayTime` đóng băng;
  mỗi seek (setPlayhead(0)) reset `expected` về 0 trong khi ngoại suy cứ đếm tiếp —
  gap tăng đúng một pass mỗi lần seek. Guard |presented − frameIdx| ≤ 3 (đề xuất ở §6)
  sẽ rơi về frameIdx vĩnh viễn ngay sau seek đầu tiên và không bao giờ hồi phục
  (không còn callback nào làm tươi anchor).
- 25/140 pump event là `skip-stale-frame` (18%) và 36/140 capture có `ctMismatch`
  (mediaTime ≠ currentTime) — ngay cả đường pump cũng thấy hai đồng hồ lệch nhau.
- Bonus — baseline cho A/B tap sau này: snapshot đường tick hậu flip+2000ms: distinct
  213, đơn-nghĩa n=151, clean **68/151 = 45,0%** — khớp D1/D1b/B2 (44–49%).
- Assert flip run: 17/18 xanh; chỉ spread fail (median 46,8, nGroups=78 — kỳ vọng ở
  đường tick, xem §1.1).

### 4.3 Kết luận phần flip

- **Claim ĐÃ ĐƯỢC CHỨNG MINH: nhãn theo presented estimate ngoại suy từ metadata pump
  đã chết là không khả thi** — nó chỉ đúng trong ~2 giây đầu sau khi pump chết (cửa sổ
  stale, chain callback còn sống) rồi sai hoàn toàn sau 1 seek. Mọi fix chỉ dựa vào
  ngoại suy (không có nguồn resync) đều chết theo cùng cách.

## 5. Verdict 4 — W-shift: test dịch cửa sổ ±1/±2 KHÔNG có lực phân biệt (đối chứng)

- Trên 6 ca không khớp cũ+mới (5 A2 run B + 1 B2 P20), dịch cửa sổ nguyên/chi-P/chi-ghost
  ±1/±2 giải thích được **6/6** — nhưng đối chứng cho thấy cửa sổ NGẪU NHIÊN trong lân
  cận ±3 cũng khớp đo với tỉ lệ cao:
  - 4 ca lật mức 37↔84: cửa sổ ngẫu nhiên khớp **35,1–56,7%** → test dịch "6/6" là
    rỗng đối với các ca này (gStd chỉ có ~4 mức rời rạc 37/83/84/112 nên hầu như dịch
    nào cũng trúng một mức).
  - 2 ca đơn-frame ~112 (P=44, P=72): cửa sổ ngẫu nhiên chỉ khớp **5,0–6,4%** — các
    dịch khớp ở đây (chi-P−2/chi-ghost−2 cho P=44; chi-P±2/chi-ghost+2 cho P=72) hơi
    có ý nghĩa, nhưng mỗi ca vẫn có 2–3 dịch ứng viên khác nhau, không chốt được dịch nào.
- **Kết luận: không dùng gStd để kết luận cửa sổ thật lệch ±1.** Muốn phân biệt cửa sổ
  thật cần metric mịn hơn gStd (vd pha sọc — nhưng pha cũng đã bị bác làm chuẩn chính
  ở A2 §5.5) hoặc đo trực tiếp pixels từng frame trong cửa sổ (đã có ghostPix/curPix —
  hướng này đã cho kết quả ở A2 §5.2: cửa sổ thật giải thích 95,5%).

## 6. Fix đã xét — KHÔNG land fix nào (và vì sao)

| Fix ứng viên | Trạng thái | Bằng chứng |
|---|---|---|
| F5 hiệu chuẩn pha hằng số (học δ từ pump, áp cho tick) | **BÁC** | Counterfactual §2: δ* tốt nhất = +0, clean ≤46% trên cả 3 mẫu |
| A2 "đọc lại currentTime trước drawImage" | **BÁC (lần 2–3)** | P2 ≈ baseline ở D1 (44,2%) + D1b (45,6%), như B2 |
| Nhãn theo presented estimate ngoại suy (không tap) | **BÁC** | Flip §4: gap +80 ở seek đầu, +1028 ở seek cuối; guard ±3 rơi vĩnh viễn |
| δ-tracking liên tục (theo dõi δ trôi chậm) | **KHÔNG ĐÁNG TIN** | Tự tương quan mâu thuẫn D1 vs D1b (§3) |
| F6 dung sai ±1 ở skipLatest | **CHƯA THỬ** — phân tích cho thấy nó đổi một lỗi lấy lỗi khác (skip snapshot P−1 thật thì mất ghost → blend pair; không skip snapshot mislabel thì double-count). Cần pixel-verified skipLatest (so strip snapshot mới nhất với curPix) mới có cơ sở — đó là build riêng, chưa làm trong luồng này |
| **Tap rVFC độc lập (đề xuất cho đợt sau)** | **HƯỚNG DUY NHẤT CÒN ĐỨNG** | Xem §7 — cần build riêng, không làm vội |

- Không sửa `preview.tsx` trong luồng này (md5 cuối D1/D1b là 94ee64c0; flip chạy trên
  a6e34691 do C3 sửa — xem §0; C2 không sửa file này).
- Quy tắc land đã đăng ký trước được tôn trọng: không có fix nào đạt bar đo thật nên
  không land gì cả.

## 7. Nợ mở + đề xuất cho đợt sau (tap rVFC độc lập)

**Spec tap (để luồng sau làm, không làm ở đây):**
- Mục đích: giữ anchor trình chiếu (`lastPresentedFrameIdx`, `lastExpectedDisplayTime`)
  luôn tươi cho đường tick, kể cả sau khi pump chết và sau mỗi seek — bằng MỘT đăng ký
  rVFC riêng, chỉ cập nhật anchor (không capture pixels, không động ring).
- Vòng đời: chạy khi clip video đang phát + có ghostWeights + đường tick đang nuôi
  snapshot (`!snapshotsViaRvfc`); dừng khi pump sống lại / clip dừng / element đổi chủ
  (tái dùng như MediaPool — cần xử lý zombie như `rvfcKillZombiePumpsOnElement`).
  Không bị gate bởi `rvfcDeadClips` hay `__vcutDisableRvfc` (hai cái đó gate PUMP,
  không gate tap); nhưng cần hook test riêng để tắt tap khi đo baseline
  (vd `window.__vcut101c2PresentedTap = false`).
- A/B (dùng flip-protocol đã xây sẵn ở đây): baseline (tap tắt) vs fix (tap bật),
  flip sau pass 5, 20 pass, case B; metric = tỉ lệ clean của snapshot đường tick
  distinct hậu flip+2000ms (baseline đo được ở đây: **45,0%**, n=151). Bar land đề xuất:
  clean ≥ 70% VÀ hơn baseline ≥ 20 điểm, n≥40 mỗi bên; đồng thời không hồi quy assert
  khác (trail/mép/cx/blur/ring) + tsc 0 + vite build pass + ghostBlend 15/15 +
  previewEngine 25/25.
- Giới hạn đã biết trước: tap VÔ DỤNG trên WebKit (rVFC không bao giờ bắn — nơi đường
  tick là đường duy nhất). Trên WebKit, mislabel đường tick vẫn là bài toán mở; hướng
  còn lại duy nhất là F6' pixel-verified skipLatest (không cần rVFC) — cũng cần build
  riêng + A/B bằng window-check trên dữ liệu tick (xem §5).
- Nợ khác (đứng yên theo LIMITS gộp đợt 100 §4): B9 đã xong trong đợt 100 (đính chính:
  không còn là nợ); G1 chờ user quyết metric G5/M2; 2 MiB handoff typefind; re-arm burst
  dài-gap; blur B-band; zombie early-return; EPERM probe #20 + khoảng mù #19 (bắt đầu
  sau reboot #24, và nay thêm reboot #25 ~23:51Z — EPERM thread tự cập nhật); birefnet
  0 lần (chỉ thử khi RAM đổi); TTS 39 CẤM kiểm lại; ci-security.yml 403; release gate
  không đổi.

## 8. Kiểm chứng

- `tsc` apps/web: **0** (trên cây a6e34691 đã gồm C3).
- `vite build`: **PASS 21,04 s**.
- `ghostBlend.probe.test.ts`: **15/15 PASS** (`node --experimental-strip-types --test`).
- `previewEngine` test: **25/25 PASS** (cùng lệnh).
- Probe assert: D1 1 fail (spread — kỳ vọng ở đường tick); D1b **ASSERT PASS**;
  flip 17/18 (chỉ spread fail).
- Không sửa production; không sửa file Y2/Z2/A2/B2; không đụng drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / B3 / B4 / C3.

## 9. File C2 tạo/sửa (batch stage)

- `docs/PHASE9_ROUND101_C2_GHOST_LIMITS.md` — file này (DUY NHẤT trong batch).
- Scratch đo (không vào batch):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c2/`
  (`boot.log`, `probe101c2-ghost.cdp.mjs` (copy probe100b2 + flip option),
  `preview-b-norvfc-c2-idle.json`, `preview-b-norvfc-c2-quiet.json`,
  `preview-b-flip-c2.json`, `assert101c2-*.log`, `analyze-c2.py` (Q1–Q4 + CF),
  `analyze-c2w.py` + `analyze-c2w-control.py` (W-shift + đối chứng),
  `analyze-c2-autocorr.py` (tự tương quan offset),
  `analyze-c2-flip.py` (gap hậu flip + baseline A/B tap),
  `analyze-c2*.txt`, `vite-5173-c2.log`,
  `analyze-b2.py`/`analyze-b2b.py` (bản sao để tái dùng).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round101-c2-ghost.txt`
  (NUL-delimited, 1 entry). KHÔNG push GitHub; user tự push sau từ main chat.

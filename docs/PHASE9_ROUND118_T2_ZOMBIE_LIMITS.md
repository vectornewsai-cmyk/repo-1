# Đợt 118 T2 — Chẩn đoán Zombie H3f: tách riêng storeHeldFrame (LIMITS)

Ngày: 15/11/2026 (lượt cron 18:35 +07). Boot #54. Baseline `apps/web/src/preview.tsx`
md5 `03bf029f09b8890b285eacc10a02172b` — **không đổi trước/sau lượt** (luồng này KHÔNG
sửa cây production; patch H3f chỉ chuẩn bị dạng file diff, xem §5).
Prereg: `hidden_files/round118-t2/prereg-t2.md` (viết trước khi đo, ngưỡng quyết định
đăng ký trước ở §5 của prereg — verdict ở §5 dưới đây áp đúng ngưỡng đó).

## 0. Tóm tắt verdict

**H3f ĐÁNG LÀM.** Lần đọc video đầu tiên trong tick — `storeHeldFrame` — chiếm
**trung vị 60% thời gian tick chậm** (S_store = 0,601, p90 0,951, n=39 tick held-first;
S_first = 0,375, p90 0,935, n=51 tick có first video draw). Lần đọc video đầu tiên
đi vào held canvas ở 39/51 tick chậm (76%). Tỉ số đọc frame mới / đọc lại frame cũ
R_new/same = 4,10 — ủng hộ giả thuyết tick block chờ decoder ở lần đọc frame mới.
`samplePlainCurrentPixStrip` RẺ (đọc từ canvas, không phải video — xem §3) nên không
phải bottleneck; residual 0,88 trên tick chậm chủ yếu là lần đọc video đầu tiên này.

**Nhưng:** patch H3f phải bỏ **cả hai** lần đọc video trong tick nóng (phát hiện M10,
§4) — chỉ bỏ storeHeldFrame thì decoder wait dời sang lần đọc `plainNativeSource`.
Và hiệu quả H3f **chưa đo** — patch chỉ chuẩn bị cho đợt 119 apply + đo A/B (§5).

## 1. Giả thuyết, phương pháp, điều kiện đo

### 1.1 Giả thuyết (đợt 117 §1.3)

Tick block chờ decoder ở **lần đọc video đầu tiên** trong tick (storeHeldFrame —
lần đọc duy nhất H3e giữ lại); các lần đọc sau cùng frame đã rẻ. Residual 0,94–0,95
trên tick chậm đợt 117 được cho là 2 drawImage full-res ngoài blend: storeHeldFrame
+ samplePlainCurrentPixStrip. Lượt này tách riêng 3 thành phần: storeHeldFrame,
samplePlainCurrentPixStrip, và thời gian decode (qua ctChanged new/same).

### 1.2 Probe và spec đo

- Probe: `apps/web/scripts/probe118t2-storeheld-diag.mjs` (72.600 B, build bằng
  `hidden_files/round118-t2/build-probe.py`, `node --check` OK) — kế thừa probe117t2
  + wrapper đo `performance.now()` quanh **mọi** drawImage (ghi tAbs/srcKind/srcId/
  dstId/dstCreator/dstW/dstH/args/ct/rs/ctChanged vào `W3.drawCosts`, ring 20000) +
  wrap `document.createElement` gắn creator cho canvas + wrap `getImageData` nhẹ +
  drain 5s. Driver `hidden_files/round118-t2/run-t2.sh` (lock v2-only port 5590),
  analyzer `hidden_files/round118-t2/analyze-t2-diag.py` (+ mục DRAWIMAGE-DECOMPOSE
  và DIAG-VERDICT theo prereg §5), pháp y offline `hidden_files/round118-t2/diag-forensic.py`.
- Spec: `--engine chromium --config scroll-mixed-alt --nclips 24 --freeze-run
  --sysload 0`, video stripes-scroll.mp4 1280×720, 24 clip × 3s, hog cố định N=4
  (chuẩn baseline đợt 117).
- Lock: phối hợp với T3 đợt 118 (2 lượt dial s79r1+s79r2, mỗi lượt giữ lock ~34').
  Attempt 1 lấy lock 12:02:10Z, probe exit=2 cả 2 lần (lỗi regex, xem §6), nhả lock
  12:04:59Z (giữ 169s). Rerun 12:07Z lấy lock ngay, chạy xong, nhả lock 12:12:14Z
  (giữ 308s). Tag: `chr-mixedalt-t2diag-fr4`, boot #54, 12:07–12:12Z 15/11/2026.
- Điều kiện hiệu lực lượt đo (prereg §5): stall tái hiện — longtask ≥200ms n ≥ 50,
  draws-gap >300ms n ≥ 20, tick chậm n ≥ 30. **Đạt cả 3** (xem §2).

### 1.3 Nhiễu tải — phải báo rõ

Probe band-wait đủ 120s (loadBand1AtPlay=61,55, bandWaitedS=120) rồi vẫn phát theo
prereg ("TRƯỢT DẢI"). LOAD-TSV: **load1 med 42,02 [12,25–62,39], load5 med 27,22**
— do **T3 s79r2 đang dial 56 hog đồng thời** (mục tiêu của T3 là load1 [25,40]).
Điều kiện dự kiến chỉ 4 hog. Hệ quả: **số tuyệt đối (longtask, gap) KHÔNG so được
với B1** (load1 med 7,69); các **share trong-tick** và **tỉ số R_new/same** là bằng
chứng chẩn đoán chính (chúng không phụ thuộc mức tải tuyệt đối).

## 2. Kết quả đo chính (lượt chẩn đoán chr-mixedalt-t2diag-fr4)

- **Stall tái hiện, DIAG-GATE ĐẠT**: longtask ≥200ms n=145, tổng 44.996 ms (tất cả
  378 cái / 73.100 ms); draws-gap >300ms tổng 104 (31 straddle biên, tổng 51.451 ms,
  biên 16.607 ms); tick chậm (loopMs ≥ 100ms) n=63/366 (p50 loopMs 26,1, p90 117,3,
  max 917,6); renderTicks n=358, skipped 72; draws/s ~7,2; pageErrs 0.
- **DECOMPOSE tick chậm**: S_render 0,99, blend 0,12, residual 0,88, S_pre 0,46,
  S_post 0,00; pump capMs med 70,75 (n=76).
- **DIAG-VERDICT (analyzer, theo prereg §5)**: S_store=0,0 (do creator-tag hỏng,
  xem §3) nhưng S_first=0,3747 ≥ 0,35 → **"H3f ĐÁNG LÀM"**. Với số pháp y (§3),
  S_store thực = 0,601 ≥ 0,25 → kết luận càng vững.
- CROSS-CHECK sumDrawImage/tickCost.total trên tick chậm: med 0,751 (n=9 — nhỏ vì
  tickCost chỉ có ở tick blend).

## 3. Creator-tag hỏng và pháp y offline

### 3.1 Creator-tag hỏng

Mọi canvas tạo trong lúc phát đều ghi creator="evaluate" (64 canvas, 300×150 lúc
tạo) thay vì storeHeldFrame/samplePlainCurrentPixStrip/updateMotionBlurSnapshots —
nguyên nhân có thể là frame của Playwright eval wrapper (`UtilityScript.evaluate`)
khớp trước trong `creatorFromStack`; **chưa xác định chắc chắn**. Hậu quả: analyzer
chính cho S_store=0,0 / S_strip=0,0 / S_snapshot=0,0 (**sai**). Đã khắc phục bằng
pháp y offline theo usage-pattern (`diag-forensic.py` → `chr-mixedalt-t2diag-fr4-forensic.txt`)
— **KHÔNG cần chạy lại probe**. Nợ mở: nếu đợt sau cần đo lại bằng creator-tag, phải
sửa `creatorFromStack` (bỏ qua frame `UtilityScript.evaluate`).

### 3.2 Bản đồ canvas (tự nhất quán)

- id=2: main render target 1280×720 (286 video draws, durTot 5.762,7 ms, med 4,2;
  nguồn cho display-copy 188 + strip 98).
- id=3: display canvas 872×476 (`.preview-canvas`; 286 canvas draws vào: 188 từ
  id=2 + 98 từ id=6; nguồn cho 280 samplerCap 96×54).
- id=6: blend layer (286 canvas draws vào, 98 lần làm nguồn → id=3; đúng bằng
  tickCost n=98).
- id=7: strip canvas plainCurPixCanvas (98 canvas draws vào từ id=2 + 98 lần
  getImageData 48×1) — **strip đọc từ CANVAS (id=2), KHÔNG phải video → strip RẺ**,
  bác một nửa giả thuyết §1.3 đợt 117 (residual không phải storeHeldFrame + strip).
- Held canvases: 24 cái = đúng 24 clip (ids 1,10,11,15,16,20,21,25,26,30,31,35,36,
  40,41,45,46,50,51,55,56,61,62,68), mỗi cái 7–21 video draws trong ~1 clip 3s,
  nAsSrc=0 (khớp: 0 tick held trong run này — renderTicks held=true 0/358), không
  strip-read. id=1: held canvas clip c0 (8 video draws, chỉ 3s đầu).
- Snapshot canvases: 40 cái, mỗi cái 1–3 video draws, nAsSrc 1–15 (đọc làm ghost).
- id=4: sampler offscreen 96×54.

### 3.3 Kết luận chẩn đoán (số liệu pháp y)

- Video draws/tick chậm: med 1; phân bố {0: 12, 1: 34, 2: 14, 3: 3} (n=63 tick).
- First video draw trong tick chậm đi vào **HELD canvas ở 39/51 tick (76%)**,
  snapshot 11/51, main 1/51. First-draw dur med 79,3 ms, p90 130,5, max 264,5.
- **S_store (held-first ticks): med 0,601, p90 0,951 (n=39)** — storeHeldFrame
  chiếm ~60% tick chậm. **S_first (mọi first draw): med 0,375, p90 0,935 (n=51).**
  S_allVideoDraws/tick chậm: med 0,601, p90 0,980. S_first theo dstId: id=11: 0,832;
  id=40: 0,954; id=55: 0,903; id=61: 0,778.
- **R_new/same = 4,10** (video draws: ctChanged=TRUE new-frame n=334 durMed 16,0 ms
  p90 87,6; FALSE same-frame n=313 durMed 3,9 ms p90 72,2) — ủng hộ chờ decoder ở
  lần đọc frame mới. Theo từng dstId R dao động 0,17–192 (mẫu nhỏ, nhiễu).
- Tổng video-draw toàn lượt theo vai trò: held (storeHeldFrame) 286 draws / 9.266 ms
  (med 12,5); snapshot (pump rVFC) 76 draws / 3.620 ms (med 23,35; đúng bằng rvfcCost
  n=76); main direct 286 draws / 5.763 ms (med 4,2).
- Strip: 98 draws canvas→canvas (id=2→id=7), tổng dur nhỏ (nằm trong canvasFromMain:
  384 draws / 36,9 ms toàn lượt); getImageData trên strip med 0,2 ms (max 73,1 một
  lần — outlier do contention).

### 3.4 Caveat — H3f không sửa được hết tick chậm

- **12/63 tick chậm có ZERO video draw** (loopMs med 115,5) — chậm do contention/
  scheduling, H3f không sửa được. Trần cải thiện của H3f < 100% tick chậm.
- **Second video draw trong tick: med 75 ms (n=17), 13/17 cùng ct với draw đầu
  (ctChanged=False)** — dị thường: draw cùng frame vẫn đắt trong tick chậm →
  contention cũng làm phình mọi drawImage trong tick chậm, không chỉ decoder wait.
  Caveat cho thiết kế H3f (§5): tiết kiệm thực tế có thể thấp hơn S_store đo được.

## 4. Phát hiện M10 — mỗi tick có HAI lần đọc video

Khi media ≤ letterbox và drawSrc còn là video thô, drawSrc đi qua
`plainNativeSource(video, mw, mh)` thành canvas native 1:1 (id=2)
(`preview.tsx:4287–4295`). Hệ quả:

- Mỗi tick có **HAI lần đọc video**: storeHeldFrame (video→held, đọc đầu, đắt)
  + plainNativeSource (video→native id=2, đọc sau cùng frame, rẻ med 4,2 ms) —
  và mọi thứ downstream (blend/strip/snapshot/direct/display) đều đọc từ canvas
  id=2.
- Vì vậy **H3f chỉ bỏ storeHeldFrame thì decoder wait sẽ DỜI sang lần đọc native**
  — patch H3f phải bỏ/thay thế **CẢ HAI** lần đọc video trong tick nóng (dùng held +
  native canvas của tick trước, hoặc refresh từ frame pump rVFC đã decode). Thiết
  kế patch ở §5 làm đúng điều này.
- Strip đọc từ id=2 (canvas) nên không tốn thêm lần đọc video nào (§3.2).

## 5. Verdict H3f + patch chuẩn bị (CHƯA apply)

### 5.1 Verdict

**H3f ĐÁNG LÀM** — ngưỡng prereg §5: ĐÁNG LÀM nếu S_store ≥ 0,25 HOẶC S_first ≥ 0,35
(trung vị trên tick chậm loopMs ≥ 100ms). Đo được **S_store = 0,601** và
**S_first = 0,375** — cả hai đều vượt ngưỡng. Điều kiện hiệu lực lượt đo đạt (§1.2).

### 5.2 Patch `hidden_files/round118-t2/h3f.patch` (108 dòng, 5 hunks)

- Baseline `preview.tsx` md5 `03bf029f…`; bản sau patch md5
  `5be5a250a552357c50cc189de9a9c08a` (chỉ trên bản copy `/tmp`, **KHÔNG apply lên
  cây thật**). Verify: `git apply --check` rc=0 trên bản copy sạch; bản copy áp
  dụng đủ 6 identifier mới; số lượng ngoặc baseline = sau patch (không lệch delimiter).
  Sinh bằng `hidden_files/round118-t2/build-h3f-patch.py` (mỗi anchor assert đúng 1 lần).
- Thiết kế (xem prereg-t2 §6): guard tick-nóng (loopMs tick trước ≥ 100ms) + skip
  cùng-frame (ct không đổi) cho **CẢ** storeHeldFrame (`preview.tsx` ~3988) **VÀ**
  plainNativeSource refresh (~4287–4295); giới hạn staleness (tối đa 3 tick skip liên
  tiếp), ép refresh khi đổi clip/seek nhảy frame (|ct − lastCt| > 0,2s); downstream
  không đổi vì đã đọc drawSrc=canvas id=2. Cờ `h3fSkipThisTick` (local của
  drawVideoClip, đặt ở nhánh draw, đọc ở khối M10) đảm bảo 2 lần đọc cùng bỏ hoặc
  cùng vẽ; `h3fSkip.lastLoopMs` ghi ở `finally` của loop.
- Điều kiện áp dụng (đợt 119): apply patch lên đúng baseline md5 `03bf029f…`
  (patch sẽ fail nếu cây đã đổi), rồi **đo A/B** cùng spec/hog với lượt này và so
  sánh: longtask ≥200ms, draws-gap >300ms, tick chậm n, và S_store sau patch.
  Kỳ vọng: tick chậm có video draw giảm mạnh; 12 tick zero-video-draw (§3.4) sẽ
  còn nguyên — đó là trần của H3f.
- Giới hạn phạm vi: đường LUT/effects/chroma vẫn đọc video trong pipeline của nó
  (ngoài phạm vi patch — chỉ đường plain mới bỏ hết được 2 lần đọc). Nếu clip có
  hiệu ứng, H3f chỉ tiết kiệm được lần đọc store, không phải cả hai.

### 5.3 Những gì KHÔNG làm trong luồng này

- KHÔNG apply patch lên production (tránh nhiễm lượt dial của T3 — bài học đợt 117:
  sửa cây giữa lúc T3 dial làm s80 VOID). KHÔNG chạy tsc/vite build lên cây thật
  (vite đang phục vụ live). KHÔNG push. KHÔNG kiểm lại TTS 39. KHÔNG thử birefnet.

## 6. Sự cố trong lượt + bài học vận hành

- **Attempt 1 lỗi regex (12:02–12:04Z, probe exit=2, 2 lần):** regex
  `/at ([^\s(]+) \(/g` trong INSTALL_SAMPLER (JS template literal) bị lược backslash
  khi literal evaluate → `SyntaxError: Invalid regular expression: /at ([^s(]+) (/g`.
  Đã sửa build-probe.py (backslash kép trong file), regenerate, kiểm chứng bằng
  `/tmp/test-sampler-syntax.mjs` (eval INSTALL_SAMPLER: chuỗi chứa đúng `[^\s(]+) \(`,
  không SyntaxError). Thư mục attempt 1 lỗi đã archive thành
  `chr-mixedalt-t2diag-fr4-attempt1-regexbug/`; prereg addendum §9 ghi lại. Bài học:
  mọi regex trong JS template literal của probe phải viết backslash kép trong file.
- Exec session bị SIGKILL ~900s wall-clock — driver dài PHẢI chạy detached
  (nohup + disown), chỉ poll log file.
- Load1/load5 trên VM méo bởi trần CFS quota 1,5 CPU; draws/s + số hog cố định mới
  là thước so sánh đáng tin. Tải nền từ luồng anh em (đặc biệt T3 dial 56 hog) có
  thể nhiễm lượt đo dù lock đã serialize phần vite — hogs của T3 chạy trong lúc
  dial, trước khi lấy lock.

## 7. File liên quan

- Prereg: `hidden_files/round118-t2/prereg-t2.md` (+ addendum §8 timeout lock
  1500s → 3600s; §9 lỗi regex attempt 1).
- Probe: `apps/web/scripts/probe118t2-storeheld-diag.mjs` (72.600 B);
  build: `hidden_files/round118-t2/build-probe.py`.
- Driver: `hidden_files/round118-t2/run-t2.sh`; analyzer:
  `hidden_files/round118-t2/analyze-t2-diag.py`; pháp y:
  `hidden_files/round118-t2/diag-forensic.py`.
- Dữ liệu: `hidden_files/round118-t2/chr-mixedalt-t2diag-fr4/` (results.json
  21.467.300 B, drawimage-drain.jsonl 288.298 B, getimagedata-drain.jsonl 24.415 B,
  tickcost/loopms/rvfccost-drain.jsonl, cdp-samples.jsonl, render-ticks.jsonl,
  worker-ticks.jsonl, load.tsv, frame-parity-log.txt) +
  `chr-mixedalt-t2diag-fr4-analysis.txt` + `chr-mixedalt-t2diag-fr4-forensic.txt`.
- Patch: `hidden_files/round118-t2/h3f.patch` + `hidden_files/round118-t2/build-h3f-patch.py`.
- LIMITS đợt 117 (giả thuyết gốc): `docs/PHASE9_ROUND117_T2_ZOMBIE_LIMITS.md`.

## 8. Nợ mở cho đợt 119

1. Apply `h3f.patch` lên đúng baseline md5 `03bf029f…` rồi đo A/B cùng spec/hog
   (kỳ vọng giảm longtask ≥200ms / draws-gap >300ms / tick chậm; 12 tick
   zero-video-draw sẽ còn nguyên).
2. Sửa `creatorFromStack` trong probe (bỏ qua frame `UtilityScript.evaluate`) nếu
   đợt sau cần đo lại bằng creator-tag thay vì pháp y offline.
3. ci-security.yml vẫn 403 chờ user (nợ chung các đợt). TTS 39 cấm kiểm lại.
   Birefnet chỉ thử lại khi RAM đổi (u2net là fallback chính thức).

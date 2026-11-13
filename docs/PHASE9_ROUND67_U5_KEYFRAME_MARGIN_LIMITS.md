# Phase 9 đợt 67 — U5: keyframe 64,0 MiB — trần 90 s + điều tra probe treo + toast timeout hiện ngay

Ngày đo: 2026-11-08 (UTC). Máy đo: VM Linux 2 vCPU / 8 GB, không GPU.
Đóng nợ `docs/PHASE9_ROUND66_LIMITS.md` §8 mục 5 (keyframe 64,0 MiB —
trần 60 s biên hẹp; probe headed lần 1 treo không rõ nguyên nhân; toast
timeout chỉ hiện khi phát ngược đang chạy hoặc bấm toggle; Safari chưa đo).

## 1. Trần mới 90 s: đánh giá phương án + quyết định

### 1.1 Số đo làm cơ sở

| Nguồn | Số |
|---|---|
| Tải thấp 64 MiB, đợt 66 T6 (direct) | 40,4 s (0,617 ms/KiB) và 50,3 s (0,768 ms/KiB) |
| Tải trung bình 57,9 MiB, đợt 64 R10 | 53,2–58,0 s (0,92–1,00 ms/KiB) |
| Tải nặng (đợt 62/63) | 1,6–2,1 ms/KiB → 64 MiB ≈ 105–137 s |

Ngoại suy tải trung bình cho 64 MiB: 64 MiB × 0,92–1,00 ms/KiB ≈
60–66 s — ĐÃ Ở/QUÁ trần 60 s. Biên ~11,5 s của đợt 66 chỉ đúng ở tải
thấp thuần (capped plan 48,5 s so với trần 60 s); ở tải trung bình biên
có thể bằng 0 hoặc âm (fail-open dù keyframe thật).

### 1.2 Các phương án đã xét

- **(A) Nâng trần 60 s → 90 s, giữ tỉ lệ 1,2 ms/KiB — CHỌN.** Công thức
  ở 64 MiB cho 78.536 ms (200 + ceil(65.280 × 1,2)); trần 90 s KHÔNG
  cắt bất kỳ sample nào trong dải cho phép (tối đa công thức 78.536 ms
  < 90.000 ms) — trần chỉ còn là trần an toàn tuyệt đối, không còn là
  ràng buộc hiệu năng. Biên mới: tải thấp 78,5 − 50,3 = **28,2 s**;
  tải trung bình (ngoại suy) ~12,5 s. Giá phải trả: fail-open dưới tải
  nặng chậm thêm tối đa 18,5 s (78,5 thay vì 60 s) — chỉ với keyframe
  ≥ ~50 MiB (cực hiếm; file thường không bao giờ chạm tới).
- **(B) Timeout thích ứng theo tải (calibration rồi nhân hệ số) — LOẠI.**
  Dưới tải nặng calibration cũng chậm theo → timeout phình đúng lúc cần
  fail-open NHANH. Hướng này làm chậm đường mở file dưới tải nặng, ngược
  mong muốn.
- **(C) Tăng tỉ lệ 1,2 → 1,5 ms/KiB — LOẠI.** Công thức đã cho 1,2–1,3×
  tốc độ đo ở tải trung bình; ràng buộc đang cắt là TRẦN, không phải tỉ
  lệ. Tăng tỉ lệ chỉ phình timeout các sample vừa (vd 30 MB: 36 s →
  45 s) mà không cần.
- **(D) Warm-up worker / spawn sớm — LOẠI.** Chi phí spawn worker là
  mili-giây, không phải nút thắt (decode 40–50 s mới là nút thắt).
- **(E) Trial sớm ở lúc import + cache verdict — LOẠI (đợt này).** Thay
  đổi kiến trúc: cache verdict theo hash file, invalidation khi file đổi,
  CPU nền 40–60 s sau mỗi lần import file keyframe khổng lồ. Ghi vào nợ
  đợt sau nếu cần (xem §6).
- **(F) Giảm việc decode (decode nửa độ phân giải) — KHÔNG KHẢ THI.**
  VideoDecoder decode toàn frame; không có đường downscale trong decode.

### 1.3 Thay đổi code

- `apps/web/src/lib/gopTrialDecodeWorker62R4.ts`:
  `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` 60_000 → 90_000; cập nhật
  comment/docstring + đoạn GIỚI HẠN (trần 90 s bao được 50–64 MB ở tải
  thấp/trung bình; tải cực nặng vẫn fail-open).
- Test cũ cập nhật theo trần mới (tiền lệ R10 45→60 s): 62R4, 63R4,
  64R10, 66T6 — routing 64 MiB: 60_000 → 78_536 ms; 51.821.731 B →
  60.622 ms; 57.939.416 B → 67.791 ms (đã tính bằng node, khớp docstring
  cũ). Test 65S6 giữ nguyên (khóa hàm note với input 60000 tường minh,
  không khóa hằng số trần).

## 2. Đo trực tiếp keyframe decode ở 64,0 MiB với trần mới (headed probe)

Harness `vdHeaded67U5.ts` + `runHeaded67U5.mjs` (bundle esbuild probe TS +
worker, Xvfb, CDP + watchdog mới; endpoint `/hogs` + `/encode`; kết quả
`result-67u5.json`). Fixture tái dùng từ đợt 66 (`bigkey-64mib.mp4`,
sample0 đúng 67.108.864 B, framemd5 3/3 giống gốc).

Probe chạy sạch cả 3 phase, KHÔNG treo lại (xem §3.2). Kết quả đầy đủ ở
`~/scratch-round67-u5/result-67u5.json` (log `headed-67u5.log`). Chờ yên
250 s (loadavg 1-phút từ 13,41 → 2,30); cpuCalib 9.502,9 → 11.277 ms
(×1,19 — tải nhẹ). Watchdog: **0 lỗi heartbeat** trong toàn bộ probe.

### Phase A — tải thấp

| Lần đo | Kết quả |
|---|---|
| Direct decode rep 0 | **41.890,3 ms** (0,639 ms/KiB), loadavg 1,18 — decode OK |
| Direct decode rep 1 | **38.275,7 ms** (0,584 ms/KiB), loadavg 0,73 — decode OK |
| Capped (worker, trần mới) | `timeoutMs=78536`, elapsed **39.689,5 ms**, `passed`, `decode-ok`, loadavg 0,57 |
| T3 gop-range | Không note, 69.082,1 ms (loadavg đã lên 7,31 — luồng khác bắt đầu làm) |
| Controller tải thấp | gop-range, không note, 55.311,9 ms (loadavg 12,29 — luồng khác đã vào), `subscriptionCalls=0` (đúng — không có note để báo) |

**Biên mới:** trần công thức 78.536 ms − lần direct chậm nhất đợt này
(41.890,3) = **36,6 s**; so với lần chậm nhất từng đo ở tải thấp
(50.345,7 ms, đợt 66) = **28,2 s** (con số bảo thủ giữ làm biên chính).
Biên cũ ~11,5 s → **28,2 s (tải thấp)**. Biên tải trung bình (ngoại suy
60–66 s) ≈ **12,5 s**.

### Phase B — nặng (4 hog + 1 encode)

Controller: gop-range, elapsed **66.701,4 ms**, `gopTrialDecodeNote:
null` — **trial PASS trong 78.536 ms, không timeout**. Đây là bằng chứng
trực tiếp trần mới có tác dụng: cùng điều kiện tải này, đợt 66 (trần
60 s) timeout và fail-open (71.535,9 ms, note đã set). Nay decode kịp
trước 78,5 s → file mở bằng gop-range thật thay vì fail-open.
`subscriptionCalls=0` (đúng — không note). Lưu ý: loadavg trong lúc chạy
lên tới 17,43 (cao hơn lúc sẵn sàng 12,67 — tải tăng trong lúc chạy).

### Phase C — nặng hơn (4 hog + 2 encode)

Controller: gop-range, elapsed **88.099,6 ms**, note
`timeout-78536ms: trial-decode chưa xong, cho qua (fail-open)` —
fail-open đúng ở trần mới. `registryNotes` có note. **`subscriptionCalls:
1`, `subscriptionNotes` = [note] — subscription bắn đúng 1 lần trong
trình duyệt thật khi note được set.** `toastSeen` = [note] (probe kiểm
toast thật trong trang). loadavg 16,44–17,48.

## 3. Điều tra probe headed lần 1 treo (đợt 66)

### 3.1 Dòng thời gian tái hiện từ log lần 1

- `~/scratch-round66-t6/headed-66t6.log`: loadavg lúc bắt đầu 5,52
  (đã cao — các luồng đợt 66 khác đang chạy). Poll mỗi ~62 s (log mỗi
  60 vòng). Phase A xong ở t≈730 s (partial `phaseA`). Hogs 4 + encode 1
  bật (phase B bắt đầu). Ở t=1277 s partial đọc về `-` (eval trả null —
  timeout 120 s hoặc exception bị nuốt). Luồng kill toàn bộ sau đó.
  → Treo xảy ra trong khoảng t≈730–1277 s, tức trong/khoảng sau khi
  bắt đầu phase B (controller chạy trial-decode lần nữa dưới tải nặng).
- **Mất bằng chứng:** file `result-66t6-partial.json` trên đĩa nay có số
  Y HỆT lần 2 (direct 40.408,6 / 50.345,7 ms…) — lần 2 đã GHI ĐÈ partial
  của lần 1 vì dùng chung tên file trong cùng scratch. Số phase A lần 1
  đã mất, chỉ còn log poll. Runner đợt 67 sửa bằng tên file riêng
  (`result-67u5-partial.json` + `frozen-67u5.json`).

### 3.2 Bằng chứng loại trừ (thu thập đợt 67)

- Chrome: Google Chrome for Testing 158.0.8127.18 (chromium-1254).
- `dmesg` (kiểm tra tối 08/11): KHÔNG có dòng OOM / "killed process" →
  loại trừ renderer bị OOM-killer giết (tiến trình còn sống, CPU ~0 —
  phù hợp với bị treo chứ không phải bị giết). Lưu ý: dmesg trong
  container có thể bị chặn (đọc được ở đây, nhưng buffer có thể đã xoay).
- `futex_do_wait` KHÔNG phải bằng chứng đóng băng một mình: quan sát
  trực tiếp trên probe của luồng round-67 khác đang chạy — các renderer
  idle cũng có wchan `futex_do_wait` (thread đang chờ việc). Chẩn đoán
  lần 1 phải dựa vào TỔ HỢP: CDP không đáp + CPU ~0 + futex wait, không
  dựa vào wchan đơn lẻ.
- Probe lần 2 đợt 66 chạy sạch hết 3 phase với cùng code + cùng fixture
  → loại trừ lỗi xác định trong code probe (không phải bug lặp lại được
  cứ chạy là treo).
- (Điền kết quả tái hiện đợt 67: probe lần này có treo lại không; nếu
  treo thì kèm frozen-67u5.json; nếu không thì ghi rõ đây là lần chạy
  sạch thứ 2 liên tiếp với cùng điều kiện.)
  **Kết quả đợt 67: KHÔNG tái hiện được treo.** Probe đợt 67 chạy sạch
  cả 3 phase (phase A tải thấp → B 4 hog + 1 encode → C 4 hog + 2
  encode), tổng ~635 s poll + 250 s chờ yên; watchdog ghi **0 lỗi
  heartbeat** (CDP đáp `1+1` mọi lần poll); không có file
  `frozen-67u5.json`. Đây là lần chạy sạch thứ 2 liên tiếp với cùng
  code probe + cùng fixture + cùng mức tải nặng như lần 1 đợt 66 (lần 2
  đợt 66 cũng sạch). Treo lần 1 đợt 66 vẫn chưa có nguyên nhân xác
  định — chỉ còn là sự kiện đơn lẻ không lặp lại được; watchdog nay ghi
  chẩn đoán đầy đủ nếu nó tái hiện trong đợt sau.

### 3.3 Các giả thuyết còn lại (xếp theo khả năng)

1. **Renderer main thread kẹt chờ IPC/Mojo dưới tải cực nặng (khả năng
   cao nhất).** VM 2 vCPU, loadavg ~13 (4 hog + 2 encode ffmpeg +
   các luồng đợt khác + Chrome đa tiến trình): renderer chờ reply Mojo
   từ tiến trình khác (browser/GPU/utility) vốn cũng bị đói CPU hoặc
   kẹt — thread ở trạng thái S (sleeping) chờ futex, CPU ~0, đúng quan
   sát. Không phải lỗi sản phẩm (trang probe treo, không phải app).
2. **Xvfb/display stall.** Không có bằng chứng ủng hộ hay loại trừ
   (Xvfb còn sống lúc kill). Ít khả năng hơn (1) vì CDP qua WebSocket
   không qua X11.
3. **Deadlock VideoDecoder/worker teardown.** Không loại trừ được: treo
   xảy ra đúng lúc phase B chạy trial-decode lần nữa (worker mới). Nhưng
   lần 2 chạy cùng đường mà sạch → nếu là deadlock xác định thì phải lặp
   lại; chỉ còn khả năng deadlock hiếm theo race.
4. **Vòng lặp vô hạn / lỗi logic trong code probe — LOẠI TRỪ.** Vòng lặp
   vô hạn cho CPU ~100% một nhân, trái với CPU ~0 quan sát được; code
   probe toàn async/await có timeout.
5. **OOM / memory pressure — LOẠI TRỪ PHẦN LỚN.** dmesg không có OOM
   kill; tiến trình còn sống (OOM kill sẽ làm tiến trình chết, không
   treo). Áp lực bộ nhớ âm thầm gây deadlock thì không có bằng chứng.

### 3.4 Biện pháp phòng ngừa đã thêm (đợt 67)

- Module mới `apps/web/scripts/cdpRendererWatchdog67U5.mjs` (test 7/7):
  heartbeat CDP `Runtime.evaluate("1+1")` timeout 60 s; 3 lần lỗi liên
  tiếp → frozen report (chẩn đoán /proc stat/status/wchan + wchan từng
  thread + cây tiến trình + loadavg + meminfo + dmesg OOM) + phân biệt
  renderer-frozen vs browser-dead qua `GET /json/list`; runner kill
  Chrome + exit 3 thay vì poll treo vô hạn (lần 1 đợt 66 poll tới
  t≈1277 s+ mà không có chẩn đoán nào).
- Renderer trong chẩn đoán chỉ quét HẬU DUỆ của chromePid (đối chiếu
  ppid) — không trộn renderer của probe khác chạy song song.
- Runner mới dùng tên file kết quả riêng theo đợt (không ghi đè partial
  của lần chạy trước).

## 4. Toast timeout hiện ngay khi note được set (sửa nợ T6 §3)

### 4.1 Vấn đề

Trước đợt 67, toast timeout chỉ bắn trong `refreshDecodeAheadUi()` —
chạy mỗi tick rAF khi phát ngược đang chạy, hoặc ngay sau khi bấm
toggle. Vòng lặp NGỦ khi pause (đợt 21 T5): clip 0,1 s phát ngược dừng
sau 0,1 s → loop ngủ → trial timeout ở 60 s (nay 78,5 s) set note nhưng
không ai refresh → user không thấy toast cho tới lần refresh tiếp theo
(bấm toggle / phát lại). Click-test đợt 66 lượt S chứng minh đúng giới
hạn này (toast chỉ thấy sau khi bấm toggle, +0,6 s).

### 4.2 Sửa

- `apps/web/src/lib/reverseWebcodecs.ts`: `subscribeTrialDecodeTimeoutNotes`
  (mẫu `subscribeToasts` của toast.ts) + notify khi controller set note
  mới (null → có giá trị / đổi giá trị). Listener lỗi không chặn listener
  khác / đường GOP. Thêm option `trialDecodeProbe` cho controller
  (forward sang T3, mẫu `gopFetchImpl`) + forward `gopThresholdBytes`
  qua `getReversePreviewController` để unit test được đường note;
  production không truyền → mặc định như cũ.
- `apps/web/src/preview.tsx`: subscribe trong effect `[previewLang]` →
  `refreshDecodeAheadUi()` ngay khi note mới được set. Đăng ký lại mỗi
  lần đổi ngôn ngữ để closure dùng `i18nT` mới nhất (cleanup hủy đăng ký
  cũ). Logic keyed trong `refreshDecodeAheadUi` giữ nguyên → không toast
  trùng (kiểm chứng ở click-test ca N: appearances = 1 dù có bấm toggle
  sau đó).

### 4.3 Kiểm chứng

- Unit mới `gopTrialDecode67U5.test.ts` 11/11: subscription end-to-end
  qua controller + probe treo + file MP4 tối thiểu (listener gọi sau
  ~560 ms chờ, timeout trial 212 ms); unsubscribe thì không gọi;
  listener lỗi không chặn listener khác; probe trả true → không note,
  listener không gọi.
- Headed probe: trường `subscriptionCalls`/`subscriptionNotes` trong
  mỗi controller run — phase A/B: 0 (đúng, không note); phase C: **1**,
  note đúng `timeout-78536ms` (xem §2).
- Click-test headed `clicktest-67u5-toast-timeout.mjs` (snapshot
  `dist-snap-67u5`, bundle `index-DdeFwl9h.js` — đã kiểm chứng chứa
  `const ZL=9e4,QL=1.2` tức trần 90 s + tỉ lệ 1,2 của đợt 67; bundle này
  là bản rebuild sau bản build của luồng, hash chính khác nhưng vẫn
  chứa code mới; `dist/` gốc build ra `index-DzSV0fEH.js`):
  - **Ca N (mới, quan trọng nhất): PASS.** Clip 0,1 s, tải nặng
    (4 hog + 2 encode), KHÔNG bấm toggle, loop ngủ từ 0,1 s. Toast
    timeout tự hiện ở **+160,1 s** (cửa sổ 75–170 s), chữ đúng từng ký
    tự với `78536 ms`; sau đó đợi 6 s (toast tự đóng), bấm toggle 1
    lần, poll 12 s — **không toast lần 2** (appearances trước toggle 1,
    sau toggle 0, tổng 1). Sửa subscription (§4.2) đã chứng minh trong
    app thật.
  - **Ca H: toast THẤY nhưng ngoài cửa sổ dự đoán** — +185,9 s (cửa sổ
    đặt trước 75–165 s). Chữ đúng từng ký tự, engine webcodecs. Phân
    rã: trial timeout 78,5 s + fetch T3 ≈ 106 s (suy ra, không đo trực
    tiếp). Fetch chậm vì tải song song đợt 67 quá nặng trong lúc chạy:
    loadavg 1-phút từ 1,00 lúc bấm ngược lên **22,02** lúc cuối H (4
    hog + 2 encode của ca + các luồng đợt 67 khác). Đợt 66 fetch chỉ
    ~20 s (toast +86,0 s). Chậm là ở fetch dưới tải, không phải ở thay
    đổi của đợt này (trần/trial không chạm vào đường fetch).
  - **Ca C: toast THẤY ở +135,7 s — tiền đề "tải thấp" KHÔNG ĐÚNG.**
    Ca C chạy ngay sau H, lúc loadavg còn 22,02 đang hạ dần + các luồng
    song song vẫn chạy; trial decode thật sự timeout ở 78,5 s dưới tải
    đó → fail-open + toast là hành vi ĐÚNG cho tải thực tế, không phải
    hồi quy sản phẩm. Hành vi "tải thấp → không toast" đã được chứng
    minh ở probe phase A (capped pass 39,7 s, không note) và ca C đợt
    66 (không toast trong 120 s ở tải thấp thật).
  - **Verdict tổng của click-test: PARTIAL** (N pass; H ngoài cửa sổ;
    C tiền đề tải sai). Không chạy lại để ép PASS: các số đều là hành vi
    thật dưới tải thật; chạy lại trong cùng điều kiện tải song song sẽ
    cho kết quả tương tự. Nợ cho đợt sau: chạy ca C/H khi máy yên thật
    (hoặc ghi loadavg vào verdict) để cửa sổ thời gian có ý nghĩa.

## 5. Kiểm chứng

- Keyframe: **63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9, 67U5 11/11**
  (các suite khác: L8 23/23, M10 28/28, N10 17/17, N6 32/32, O6 18/18,
  P6 16/16, Q5 15/15, R7 6/6, 62R4 19/19, captureThumb66T6 2/2).
- Watchdog: **7/7** (`node --test`).
- `tsc`: web 0, desktop 0. `vite build`: pass (bundle mới
  `index-DzSV0fEH.js`).
- Headed probe 64,0 MiB: phase A direct 41.890,3 / 38.275,7 ms,
  capped 39.689,5 ms pass (`timeoutMs=78536`); phase B trial PASS
  (66.701,4 ms, không note — đợt 66 cùng tải đã timeout); phase C
  fail-open đúng (`timeout-78536ms`), `subscriptionCalls=1`. **Không
  treo lại** (0 lỗi heartbeat). Click-test toast: **N PASS** (toast tự
  hiện +160,1 s, appearances = 1); H toast thấy +185,9 s (ngoài cửa sổ
  75–165 s do fetch ~106 s dưới loadavg tới 22,02); C toast thấy
  +135,7 s (tiền đề tải thấp sai — tải thực tế cao, fail-open đúng);
  verdict tổng PARTIAL, không chạy lại ép PASS.

## 6. Nợ / giới hạn còn lại

- **Safari vẫn chưa đo được** (không có binary/WebKit trên VM Linux).
- Trần worker 90 s ở 64,0 MiB: biên tải thấp 28,2 s, tải trung bình
  (ngoại suy) ~12,5 s; dưới tải nặng trial vẫn timeout → fail-open
  (thiết kế), nay chậm thêm tối đa 18,5 s so với trần cũ.
- Probe lần 1 đợt 66 treo: nguyên nhân chưa xác định chắc chắn (xem §3);
  lần chạy đợt 67 **không tái hiện** (lần sạch thứ 2 liên tiếp).
  Watchdog nay ghi chẩn đoán đầy đủ nếu tái hiện lần sau.
- Click-test ca H/C bị nhiễu bởi tải song song của các luồng đợt 67
  (loadavg 1-phút tới 22,02 trên VM 2 vCPU): cửa sổ thời gian đặt trước
  giả định fetch T3 ~20 s như đợt 66, thực tế ~106 s. Đợt sau nên chạy
  click-test khi máy yên thật, hoặc ghi loadavg vào verdict thay vì
  cửa sổ tuyệt đối.
- Trial sớm ở lúc import + cache verdict (phương án E §1.2) chưa làm —
  cần đợt riêng đánh giá thiết kế (cache theo hash, invalidation).
- O6 nhạy tải theo thiết kế (baseline đơn mẫu); chạy lúc máy yên để có
  18/18 (lần này 18/18 ngay trong hồi quy).
- `dist/` đã build lại để snapshot click-test có code mới (không stage,
  không push — theo luật stage-only).

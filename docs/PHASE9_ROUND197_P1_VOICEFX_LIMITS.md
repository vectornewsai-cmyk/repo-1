# LIMITS — Đợt 197 P1: PSOLA −12 (two-stage + chặn fallback) + thống nhất render sang PSOLA
(Editing Core — preview/render parity, đợt thứ 7 theo hướng mới)

- **Luồng:** P1 đợt 197 (Phase 9 VCut). **Ngày:** 26/11/2026.
- **Nhiệm vụ (quyết (a2)-196):** (1) chặn n = −12 về fallback shifter 2-delay
  cũ; (2) sửa lõi PSOLA cho −12 — thử dither pha mark trước, nếu không được
  thì cửa sổ bất đối xứng; đo lại lưới đầy đủ, nếu dither thành công thì bỏ
  chặn; (3) thống nhất render sang PSOLA (bỏ rubberband); (4) mọi lưới cao độ
  báo CẢ HAI thước (band + toàn phổ) — bài học F-196-P1-3.
- **Kết quả chung:** **(1) CHẶN ĐÃ TRIỂN KHAI + VERIFY HEADED** —
  `PSOLA_MINUS12_USE_FALLBACK = true` (mặc định) trong `previewVoiceFx.ts`:
  n ≈ −12 đi đường 2-delay cũ, các n khác vẫn PSOLA; headed bản ship:
  −12 dịch đúng cả hai thước 10/10 (5 harmonic + 5 sine), `twoStageRenders = 0`.
  **(2) DITHER FAIL ĐO THẬT; cửa sổ bất đối xứng KHÔNG THỬ — chứng minh được
  nó không thể sửa lock (xem §4). Cách sửa ĐÃ TÌM RA: TWO-STAGE** (dịch 2 lần
  r1 = √0,5 ≈ 0,7071, mỗi lần −6 st): core/render PASS 10/10 cả hai thước ở
  −12 (errSt ≤ 0,06); nhưng ở PREVIEW (worklet nối tiếp) chỉ 7/10 thước toàn
  phổ — hài 3 trội ở 3 điểm (xem §1.3) — nên chặn VẪN BẬT ở preview theo đúng
  lệnh task ("chỉ bỏ chặn nếu dither thành công" — dither fail). Flip 1 cờ
  `setPsolaMinus12Fallback(false)` để bật two-stage ở preview; parent quyết
  ở §14.2-197 (bảng so sánh ở §1.4). **(3) RENDER ĐÃ THỐNG NHẤT SANG PSOLA:**
  `server/render/src/psolaPitch.js` mới (dùng CHUNG `psola.ts`, không copy
  code) + tiền xử lý trong `render.js`; dry-run KHÔNG còn `rubberband`;
  render E2E −12/+7/−7 đều errSt ≤ 0,02 cả hai thước. **(4) Mọi lưới dưới đây
  báo cả hai thước.** Telephone ĐẠT bar (max |Δ| = 1,78 dB, không đổi).
  **KHÔNG làm lại "sửa sampleAt NaN"** (đã xong đợt 196, F-196-P4-4);
  **KHÔNG đổi W = 0,08** (quyết (a2)-195 GIỮ).

## 1. Headed (Chrome 158, OfflineAudioContext, bundle từ cây hiện tại) — verdict

Phương pháp đúng P1-195/196 (render 4 s, cửa sổ [1,0, 3,5)s, FFT zero-pad
2^18 + nội suy parabol log-mag; AM = (max−min)/(max+min) của RMS khối 5 ms).
**Cả hai thước ở mọi lưới:** `peak`/`errSt` = đỉnh trội trong band hẹp
[0,8×target, 1,25×target]; `peakWide`/`errStWide` = đỉnh trội toàn phổ
[50, 3000] Hz. Một điểm chỉ ĐẠT cao độ khi cả hai đều ≤ 0,40 st.
Hai lần chạy headed: **(A) two-stage** (cờ chặn TẮT tạm để đo, 21:10Z,
2 repeat) và **(B) bản SHIP** (cờ chặn BẬT — mặc định, 21:15Z, 1 repeat).
Worklet upgrade thành công 97/97 lần render mỗi repeat, 0 lần fail.

### 1.1 Bản SHIP (chặn BẬT — trạng thái giao) — 21:15Z, 1 repeat

| Lưới | Band | Toàn phổ | AM ≤ 0,35 | Ghi chú |
|---|---|---|---|---|
| Sine 40 điểm | **40/40** | **40/40** | 35/40 (tệ nhất 0,72) | AM fail: 4× +12 (0,36–0,47, như 196) + (440,−12) fallback 0,72 |
| Harmonic 40 điểm | **40/40** | 35/40 | 36/40 (tệ nhất 0,51) | Toàn phổ fail: 5× −7 (ghi chú âm sắc, như 196); AM fail: 3× −12 fallback + (220,−1) 0,37 |
| Telephone 9 điểm | — | — | max \|Δ\| = **1,78 dB @100 Hz — ĐẠT bar** | Khớp y hệt 193/194/195/196 từng số |
| Latency | pitch−12 onset **30 ms**, xcorr 38,6 ms (đường fallback) | pitch+12 onset 40 ms | — | −12 về lại trễ ~40 ms của shifter cũ (không còn 85 ms của two-stage) |

- **−12 (bản ship, fallback): cả hai thước 10/10.** Harmonic:
  (220) −0,40/−0,40 AM 0,51; (330) +0,26/+0,26 AM 0,34; (440) −0,40/−0,40
  AM 0,50; (550) 0,00/0,00 AM 0,33; (660) +0,26/+0,26 AM 0,46.
  Sine: (220) −0,40/−0,40 AM 0,16; (330) +0,26/+0,26 AM 0,28;
  (440) −0,40/−0,40 AM **0,72**; (550) 0,00/0,00 AM 0,10;
  (660) +0,26/+0,26 AM 0,33. Các số này TRÙNG Y HỆT spec `fallbackM12`
  chạy cùng lần (đo độc lập đường fallback) — bằng chứng chặn định tuyến
  đúng, không phải PSOLA trá hình. `twoStageRenders = 0`.
- **Giá của chặn:** AM ở −12 tệ hơn two-stage (xem §1.4): sine (440,−12)
  AM 0,72 (two-stage: ≤ 0,08) — shifter cũ vốn AM xấu ở một số f0 (tiền lệ
  195: AM 0,534 @440 harmonic); harmonic −12 AM 0,33–0,51 (two-stage:
  0,17–0,46). Cao độ thì fallback đúng cả hai thước ở mọi f0 — đó là lý do
  parent chọn chặn (quyết (a2)-196: "im-lặng-sai tệ hơn dịch được dù AM xấu").

### 1.2 Two-stage ở preview (chặn TẮT tạm — đo trước khi chặn) — 21:10Z, 2 repeat

| Lưới | Band | Toàn phổ | AM ≤ 0,35 |
|---|---|---|---|
| Sine 40 điểm | r1 39/40, r2 **40/40** | r1 38/40, r2 39/40 | 36/40 cả hai repeat (tệ nhất 0,47) |
| Harmonic 40 điểm | **40/40** cả hai repeat | 33/40 cả hai repeat | 37/40 cả hai repeat (tệ nhất 0,46) |

- **−12 two-stage (preview): band 10/10 cả hai repeat** (errSt −0,04…+0,07) —
  lock đã hết, cao độ CÓ ở target mọi f0. **Toàn phổ chỉ 7/10:** harmonic
  (440,−12) peakWide 660,2 Hz (3×target, errStWide +19,03) và (660,−12)
  992,2 Hz (+19,06) — ỔN ĐỊNH cả hai repeat; sine (660,−12) 990,9 Hz
  (+19,04) — ổn định cả hai repeat. Ba điểm còn lại (220/330/550 harmonic,
  220/330/440/550 sine) PASS cả hai thước. `twoStageRenders = 11` mỗi repeat
  (5 sine + 5 harmonic + 1 latency −12).
- **Flake mới:** sine (220,−12) r1 fail cả hai thước (peak 128,9 Hz,
  errSt +2,74; wide 221,1 Hz = f0 gốc) nhưng r2 PASS hoàn toàn — mẫu
  repeat-1-fail / repeat-2-pass, cùng họ với flake (550,+7) harmonic đợt 196
  (không lặp lại đợt này — cả hai repeat đều PASS). Nghi worklet warmup ở
  lần render đầu của page; theo dõi đợt sau, chưa kết luận.
- **+12 sine AM vẫn fail 4 điểm như 196** (0,40/0,47/0,36/0,36 — y hệt số
  196, trừ 660: 0,37 → 0,36 do làm tròn): vấn đề của worklet đơn tầng, không
  liên quan đợt này (code worklet không đổi).
- **Latency two-stage:** pitch−12 onset 85/80 ms (r1/r2), xcorr 93,4/120 ms —
  gấp đôi single-stage (LAG 2048 mẫu × 2 node ≈ 85 ms). Chỉ có hiệu lực khi
  parent flip cờ bật two-stage ở preview.

### 1.3 Vì sao two-stage preview fail thước toàn phổ ở 3 điểm −12 (F-197-P1-3)

- Hiện tượng: ở (440/660,−12) harmonic và (660,−12) sine, đỉnh band vẫn ở
  target (errSt ≤ 0,07 — cao độ CÓ, đúng) nhưng đỉnh trội toàn phổ ở
  **3×target** (660/992 Hz). Tức hài 3 của target trội hơn hài cơ bản trong
  output của worklet nối tiếp.
- **Core offline KHÔNG có hiện tượng này:** cùng two-stage, core PASS cả hai
  thước 10/10 ở −12 (sim-197 §3) — nên đây là artifact của đường
  streaming/cascade (ước lượng chu kỳ nhân quả + đặt mark trên tín hiệu đã
  qua 1 tầng PSOLA), không phải lỗi của thuật toán two-stage. Cơ chế chính
  xác chưa chứng minh (nghi mark neo lệch làm hài 3 cộng hưởng — giả thuyết,
  chưa xác minh); ghi nhận trung thực, không khẳng định quá.
- **Ghi chú về thước đo:** theo lý luận §1.1-196 (đã chấp nhận cho −7), cao
  độ CẢM NHẬN vẫn đúng target vì các hài cách nhau đúng target (hiệu ứng
  missing-fundamental) — band 10/10 + khoảng cách hài đúng là bằng chứng.
  Thước toàn phổ ở đây đo "thành phần nào trội nhất", không phải "cao độ
  cảm nhận". Nhưng vì parent đã đặt bar "cả hai thước ≤ 0,40 st" từ đợt 196,
  3 điểm này vẫn ghi là CHƯA ĐẠT theo bar — không nới bar để cho qua.
- **−7 toàn phổ fail 5/5 harmonic (cả hai bản):** như 196 — hài 2 ≈ hài cơ
  bản (đỉnh trội ở 2×target, errStWide +12,01; riêng (330,−7) ở 3×target
  +19,04). Đây là ghi chú âm sắc đã chấp nhận từ 196, KHÔNG phải fail cao
  độ, không đổi đợt này. Core sim-197 chỉ còn (220,−7) fail wide — worklet
  và core khác nhau ở điểm này (worklet fail 5/5, core fail 1/5), cùng họ
  khác biệt harmonic-balance như §1.3 trên.

### 1.4 Bảng quyết cho parent — preview −12: fallback (đang ship) vs two-stage

| Tiêu chí (headed, −12, 5 f0 × 2 lưới) | Fallback (ship) | Two-stage (cờ tắt) |
|---|---|---|
| Cao độ band (errSt ≤ 0,40) | **10/10** | **10/10** |
| Cao độ toàn phổ (errStWide ≤ 0,40) | **10/10** | 7/10 (3 điểm hài 3 trội) |
| AM ≤ 0,35 | harmonic 2/5, sine 4/5 (tệ nhất 0,72 @440 sine) | harmonic 3/5, sine 5/5 (tệ nhất 0,46) |
| Latency | ~30–40 ms | ~80–85 ms |
| Bật/tắt | Mặc định (`PSOLA_MINUS12_USE_FALLBACK = true`) | `setPsolaMinus12Fallback(false)` — 1 dòng |

- Đề xuất của P1 (để parent quyết ở §14.2-197): **GIỮ CHẶN** (trạng thái
  hiện tại) cho tới khi có cách sửa hài-3-trội ở worklet, vì bar hiện hành
  tính cả hai thước và fallback là lựa chọn duy nhất đạt 10/10 cả hai thước
  ở preview. Render không bị ảnh hưởng (dùng core two-stage, 10/10).

## 2. Node sim — thí nghiệm sửa lock + lưới đầy đủ (core `psola.ts`)

### 2.1 Thí nghiệm 4 chế độ ở −12 (`exp-m12.mjs`, `exp-m12-197.json`)

Lưới −12 (5 f0) × 2 fixture (harmonic + sine), cả hai thước + AM:

| Chế độ | Harmonic band / wide / AM | Sine band / wide / AM | Kết luận |
|---|---|---|---|
| `none` (baseline) | 4/5 / **0/5** / 5/5 | 4/5 / **0/5** / 5/5 | Lock — xác nhận lại (đỉnh trội = f0 gốc) |
| `dither` (±T0/4 xen kẽ) | **0/5** / **0/5** / 5/5 | **0/5** / **0/5** / 5/5 | **FAIL — tệ hơn cả baseline** (xem §4) |
| `twostage` (√r × 2) | **5/5 / 5/5** / 4/5 (tệ nhất 0,424) | **5/5 / 5/5** / 5/5 | **THẮNG — chọn làm mặc định core** |
| `detune` δ = 0,02/0,05/0,1/0,2 st | 5/5 / **0/5** / 5/5 | 5/5 / **0/5** / 5/5 | **FAIL** — band "pass" là sidelobe (xem §4) |

- Dither chi tiết: đỉnh band rơi vào 0,75f0/1,25f0 (errSt +2,2…+3,6); đỉnh
  toàn phổ ở 0,75f0 (errStWide +7,04) hoặc 2,5×target (+15,87). AM tệ nhất
  0,344 (harmonic 220). Đúng như phân tích lý thuyết §4 — không phải do
  implement sai.
- Detune chi tiết: band PASS 5/5 (có năng lượng ở target) nhưng đỉnh trội
  toàn phổ VẪN ở f0 gốc (errStWide +12,05…+12,08 ở mọi δ, cả hai lưới) —
  lệch pha chậm không dời được đỉnh trội. Band 5/5 ở đây là false-pass kiểu
  F-196-P1-3 (sidelobe trong band tìm) — bằng chứng nữa cho việc thước band
  không được dùng một mình.
- Two-stage chi tiết: errSt và errStWide ≤ 0,06 ở cả 10 điểm; AM chỉ fail
  1 điểm harmonic (220,−12) = 0,424 (vượt bar 0,074 — cascade nhân AM ở f0
  thấp; xem §7.3).

### 2.2 Lưới đầy đủ với mặc định mới (`sim-197.mjs`, `sim-197.json`)

- **Harmonic 40 điểm: band 40/40, toàn phổ 39/40, AM 39/40** (196: band
  35/40, toàn phổ 29–30/40, AM 39/40). Fail còn lại: toàn phổ (220,−7)
  +12,01 (ghi chú âm sắc §1.3); AM (220,−12) 0,424.
- **Sine 40 điểm: band 40/40, toàn phổ 39/40, AM 40/40** (tệ nhất 0,143)
  (196: band 35/40, toàn phổ 35/40, AM 36/40 — 4 điểm +12 AM 0,36–0,47
  ở WORKLET, core không hề fail; xem F-197-P1-1). Fail còn lại: toàn phổ
  (660,−7) +12,01 (cùng họ −7).
- **Voice thật** (wav vieneu, median tỉ lệ f0 từng khung khớp, conf ≥ 0,7):
  n=−12: **0,506 (kỳ vọng 0,500, errSt +0,20, 48 khung)** — ĐÃ DỊCH (196:
  1,008 — không dịch); n=−7: 0,672 (+0,11); n=+7: 1,506 (+0,09);
  n=+12: 2,006 (+0,05) — cả ba trong bar. AM toàn clip 0,899 → 0,84–0,89
  (envelope lời nói, không phải artifact).

## 3. Thiết kế đã triển khai

- **`apps/web/src/lib/psola.ts`** — thêm `PsolaOptions.integerRatioMode`
  (`"none" | "dither" | "twostage" | "detune"`, mặc định `"twostage"`),
  `integerRatioDetuneSt` (mặc định 0,05 st), `isIntegerRatioHalf()` (ngưỡng
  |r − 0,5| < 0,01), và logic trong `psolaPitchShift`: twostage đệ quy 2 lần
  r1 = √r (mode `"none"` ở tầng trong để không kích hoạt lại); detune dùng
  r' = r·2^(δ/12); dither dịch tâm trích hạt xen kẽ ±T0/4 theo từng hạt.
  Các chế độ chỉ kích hoạt khi |r − 0,5| < 0,01 — mọi tỉ lệ khác
  bit-identical với mode `"none"` (có test khóa). Sửa chú thích đầu file:
  điểm (ii) về cửa sổ T0+T_s ở tỉ lệ nguyên (đợt 196) là SAI — đã đính chính.
- **`apps/web/src/lib/previewVoiceFx.ts`** — chuỗi worklet thành mảng
  `psolaNodes` + `buildPsolaChain()` (1 node thường / 2 node nối tiếp khi
  two-stage, mỗi node √ratio qua `processorOptions`); `setParams` dựng lại
  chuỗi đồng bộ khi chế độ không khớp tỉ lệ mới (thất bại → rơi về shifter
  cũ); `postPsolaRatio()` gửi √ratio tới cả hai node; `resetPitchState()` /
  `dispose()` áp cho mọi node; `isPsolaTwoStage()` mới (để headed khẳng
  định đường đi). **Chặn −12:** `PSOLA_MINUS12_USE_FALLBACK = true` (mặc
  định) + `setPsolaMinus12Fallback()` + `psolaEffectiveTwoStage()` — khi
  chặn bật, tỉ lệ ≈ −12 đi đường 2-delay cũ dù PSOLA đã active, và chuỗi
  không dựng two-stage (tránh tạo node thừa + tránh rebuild mỗi frame).
- **`server/render/src/psolaPitch.js`** (mới, zero-deps, CJS) — tiền xử lý
  pitch render: `require()` TRỰC TIẾP `psola.ts` qua type-stripping Node 24
  (đã kiểm chứng — không copy thuật toán); decode ffmpeg → shift từng kênh
  → ghi WAV PCM16; cache trong tiến trình theo (file, pitch);
  `collectPitchPreprocess()` quét đúng các clip mà `buildFilterGraph` sẽ
  dựng chain cho (audio không muted + video inherit không muted, có audio
  stream, mode ≠ detach); CLI + self-test (sine 440/−12 → đỉnh 220 Hz).
- **`server/render/src/voicefx.js`** — `buildVoiceFilters(voice, opts)`:
  `opts.pitchDone` thì BỎ `rubberband` (pitch đã xong ở pre-process), giữ
  robot/telephone/echo; mặc định (không opts) vẫn ra `rubberband` như cũ để
  không phá caller trực tiếp. Self-test thêm 4 assert pitchDone.
- **`server/render/src/audioroute.js`** — `buildAudioEffectsFilters(fx, opts)`
  truyền opts xuống `buildVoiceFilters`.
- **`server/render/src/render.js`** — require `psolaPitch`; trước bước 5
  (đăng ký input) chạy `collectPitchPreprocess()` (fail → dừng render với
  lỗi rõ, không lặng lẽ rơi về rubberband); đăng ký wav tạm làm input riêng;
  `buildFilterGraph` nhận ctx `psolaAudio` (map key → input index);
  `audioStreamRefFor()` chọn `[psolaIdx:a]` + `pitchDone` cho clip có pitch
  đã tiền xử lý; `buildAudioChain()` thêm tham số `pitchDone`.
- **KHÔNG đổi:** `psolaWorkletSource.ts` (processor không cần sửa — nối
  tiếp tái dùng y hệt), hằng số voicefx (W / SAW_GAIN_COMP /
  TELEPHONE_WET_GAIN_COMP), `preview.tsx`, GAP, aggregate (việc T10),
  MEMORY.md, build-loop-log.md. **Cảnh báo cho P4-197/T10:** các assert
  `rubberband` trong `parityHarness191/192/193.ts` nay chỉ kiểm đường legacy
  của `buildVoiceFilters` khi gọi trực tiếp (không `pitchDone`); đường render
  thật đã dùng PSOLA — harness parity pitch cần cập nhật kỳ vọng ở đợt sau,
  không phải P1-197 sửa file của P4.

## 4. Vì sao dither / detune / cửa sổ bất đối xứng (không) sửa được lock

- **Lock tỉ lệ nguyên (chứng minh ngắn):** ở r = 0,5, lưới mark tổng hợp
  (cách T_s = 2T0) commensurate với lưới phân tích (cách T0); với MỌI cửa sổ
  cố định w, hạt k là w(t−s_k)·x(t) (mark phân tích ≈ mark tổng hợp) nên
  y(t) = x(t)·Σ_k w(t−s_k); chuẩn hoá theo Σw cho y(t) = x(t) — ĐÚNG tín
  hiệu gốc. Cửa sổ dài/ngắn hay bất đối xứng đều không đổi kết luận này
  (chỉ đổi Σw) — **vì vậy cửa sổ bất đối xứng KHÔNG ĐƯỢC THỬ**: nó đã bị
  chứng minh là vô ích trước khi viết code (bản thân brief cũng xếp nó sau
  dither). Đây là lý do P1-197 chọn two-stage thay vì làm theo đúng thứ tự
  dither → cửa sổ trong brief — ghi rõ để parent xét.
- **Dither ±T0/4 xen kẽ (đã thử, FAIL):** hai loại hạt xen kẽ làm phổ output
  có các vạch ở f0 ± m·f0/4; vạch ở f0/2 triệt tiêu do đối xứng phản tuần
  hoàn (B(t+2T0) = −B(t) chỉ cho m lẻ), còn hài 2 của input (e^{±iπ} = −1 ở
  cả hai loại hạt) cộng hưởng ở 2f0 — đo thật: đỉnh trội 0,75f0/1,25f0
  (errStWide +7,04) hoặc 2,5×target (+15,87). Dither không dời được năng
  lượng về target.
- **Detune (đã thử 4 mức δ, FAIL):** lệch pha lưới trôi chậm (~0,44 Hz ở
  δ = 0,05 st) tạo sideband yếu ở target (đủ cho thước band "pass") nhưng
  đỉnh trội toàn phổ vẫn ở f0 gốc (errStWide +12,05…+12,08) — vì phổ hạt
  tại f0 (ŵ(0), cực đại cửa sổ) lớn gấp ~6× phổ tại f0/2 (ŵ(−f0/2)).
- **Two-stage (THẮNG):** mỗi tầng r1 = 0,7071 đều không nguyên nên không
  bước nào lock; tầng 1 dịch f0 → 0,7071·f0, tầng 2 dịch tiếp → 0,5·f0.
  Track chu kỳ tầng 2 ước lượng trên tín hiệu đã dịch (vẫn tuần hoàn, T1 =
  1,414·T0) nên không cần thay đổi estimator.

## 5. Render thống nhất sang PSOLA — đo parity render-vs-preview

- **Dry-run:** spec pitch −12 → graph KHÔNG chứa `rubberband`, CÓ input wav
  PSOLA tạm; spec control (không pitch) → không input PSOLA, không rubberband.
- **Render thật** (fixture harmonic 440 Hz 4 s, video màu 640×360, cùng
  thước đo preview — `render-e2e-197.mjs`):

| n | Render peak / wide | errSt / errStWide | AM | Thời gian |
|---|---|---|---|---|
| −12 | 220,1 / 220,1 Hz | +0,01 / +0,01 | 0,171 | 1.619 ms render |
| −7 | 294,0 / 294,0 Hz | +0,02 / +0,02 | 0,212 | 1.328 ms |
| +7 | 660,0 / 660,0 Hz | +0,02 / +0,02 | 0,120 | 1.136 ms |

- **Parity render-vs-preview** (fixture harmonic 440 Hz, cùng điểm):

| n | Render (core two-stage) | Preview headed (bản ship) | Nhận xét |
|---|---|---|---|
| −12 | 220,1/220,1; errSt +0,01/+0,01; AM 0,171 | 215/215; errSt −0,40/−0,40; AM 0,50 | Cùng target (lệch nhau 0,41 st — trong bar); khác cơ chế (render PSOLA, preview fallback) nên AM khác — P4-197 đo parity cần ghi rõ cơ chế khác nhau này, không phải hồi quy |
| −7 | 294/294; +0,02/+0,02; AM 0,212 | band 293,5 (−0,01), wide 882,1 (+19,04); AM 0,18 | Render (core) PASS cả hai thước ở (440,−7), preview (worklet) fail wide — cùng khác biệt worklet-vs-core như §1.3; cao độ cảm nhận cả hai đều đúng (band + khoảng hài) |
| +7 | 660/660; +0,02/+0,02; AM 0,12 | 660,4/660,4; +0,03/+0,03; AM 0,17 | Khớp nhau trong 0,01 st — parity tốt |

- **Thay đổi thứ tự effect (ghi nhận trung thực):** pitch tiền xử lý chạy
  TRƯỚC bass/treble/reverb trong chain (rubberband cũ chạy sau reverb,
  trước volume). Với fixture chỉ có pitch thì không ảnh hưởng số đo parity;
  với spec có cả EQ + pitch thì cao độ cuối vẫn là cao độ đã dịch, chỉ khác
  màu tiếng vi mô (reverb/EQ tác động lên tín hiệu đã dịch thay vì chưa
  dịch). Giữ đúng thứ tự cũ đòi hỏi tách audio chain (pre-process từng
  đoạn sau reverb) — nợ P1 sau đánh giá nếu cần.

## 6. Hai đính chính tìm được trong đợt

### F-197-P1-1 — §4-196 "core KHÔNG dịch được sine thuần" là SAI

- Dữ liệu 196 tự mâu thuẫn: `sim-psola2-196.json` (chạy trên core ĐÃ sửa
  xong) cho sine band errSt 0,02–0,03 ở MỌI tỉ lệ không nguyên, chỉ 5 điểm
  −12 fail wide (lock) — tức core dịch được sine, chỉ lock ở −12 như mọi
  tín hiệu khác. Kết luận "core không dịch sine" trong §4-196 dựa trên lần
  sim đầu (trước các sửa decimate/parabola) và đã khái quát hoá sai từ
  riêng điểm −12. **Đính chính: core dịch được sine ở mọi tỉ lệ không
  nguyên; worklet và core KHÔNG khác nhau trên sine** (cả hai đều band
  40/40, wide 39/40 ở sim-197; worklet headed sine band 40/40).
  Hệ quả: "nghịch lý sine" §4-196 không còn — render dùng core trên sine
  là hợp lệ (đã verify E2E §5).

### F-197-P1-2 — Thước band "pass" giả của detune (xem §2.1)

- Detune cho band 5/5 nhưng wide 0/5 — cùng mẫu false-pass như F-196-P1-3
  (sidelobe trong band tìm). Bài học đứng: thước band KHÔNG BAO GIỜ dùng
  một mình để kết luận "đã dịch" — mọi lưới đợt này đều báo cả hai thước.

## 7. Còn fail / nợ — hướng sửa đợt sau (KHÔNG giấu)

1. **Preview −12 đang chặn về fallback (có chủ đích, theo quyết (a2)-196).**
   Giá: AM sine (440,−12) 0,72; harmonic −12 AM 0,33–0,51. Mở chặn
   (`setPsolaMinus12Fallback(false)`) khi parent chấp nhận trade-off §1.4
   hoặc khi có cách sửa hài-3-trội ở worklet.
2. **Worklet two-stage hài 3 trội ở −12** (F-197-P1-3): harmonic (440/660,−12),
   sine (660,−12) fail wide ở 3×target; core không có. Hướng: chẩn đoán mark
   neo / ước lượng chu kỳ tầng 2 trên tín hiệu đã dịch; hoặc thử grain dài
   hơn ở tầng 2. Flake sine (220,−12) r1 (pass r2) theo dõi cùng.
3. **(220,−12) harmonic AM 0,424** (core + worklet two-stage đều có; render
   (440,−12) AM 0,171 — chỉ f0 thấp bị). Hướng: hạt dài hơn ở f0 thấp /
   tầng 2, hoặc chuẩn hoá envelope riêng cho cascade.
4. **Sine +12 AM 0,36–0,47 ở worklet** (4 điểm, y hệt 196 — pre-existing,
   không phải hồi quy đợt này). Core không fail. Hướng: như (2) — khác biệt
   worklet-vs-core ở AM tầng đơn.
5. **−7 toàn phổ fail ở worklet (5/5)** — ghi chú âm sắc từ 196, chưa sửa
   (hài 2 ≈ hài cơ bản). Core chỉ fail 1/5. Không ảnh hưởng cao độ cảm nhận.
6. **Thứ tự effect render đổi** (pitch trước EQ/reverb — xem §5): nợ đánh
   giá nếu cần giữ đúng thứ tự cũ.
7. **Parity harness 191/192/193 assert `rubberband`** — nay chỉ còn đúng
   cho đường legacy gọi trực tiếp; P4 cần cập nhật kỳ vọng khi đo parity
   pitch (xem §3).
8. Firefox/WebKit: chưa đo đợt này (như 196). T4-197 chưa mở attempt nào
   trong cửa sổ đo của P1 (gate0 chưa đạt cả phiên) nên không có số WebKit
   để đối chiếu.

## 8. Kiểm chứng sau đo

- `npx tsc --noEmit` (apps/web) → **0 lỗi** (chạy 2 lần: sau sửa core +
  sau thêm chặn).
- `npm run build` (apps/web: tsc + vite build) → **PASS, built in 7,82 s**
  (cảnh báo chunk > 500 kB có từ trước, không phải do đợt này).
- `psola.test.ts` → **16 pass, 0 fail** (mới: sine −12 dịch được với
  twostage; mode `"none"` vẫn lock; harmonic −12 đúng cả 5 f0; twostage
  không đổi tỉ lệ khác — bit-identical với mode none ở n=−7;
  `isIntegerRatioHalf`).
- `previewVoiceFx.test.ts` → **37 pass, 0 fail** (mới: 2 helper + cờ chặn
  mặc định true + nhánh A chặn bật (upgrade 0,5 → 1 node, −12 đi legacy) +
  nhánh B cờ tắt (2 node √0,5, đổi n dựng lại chuỗi, tắt pitch giữ chuỗi)).
- `audioEngineVoiceFx.test.ts` → **8 pass, 0 fail**;
  `bash apps/web/scripts/test-audioengine.sh` → **56 pass, 0 fail**.
- `node server/render/src/voicefx.js --self-test` → **pass** (thêm 4 assert
  pitchDone); `node server/render/src/psolaPitch.js --self-test` → **pass**
  (sine 440/−12 → đỉnh 220 Hz, round-trip WAV, cache).
- Đo headed 3 lần (2 repeat two-stage 21:10Z + 1 repeat bản ship 21:15Z):
  telephone KHỚP Y HỆT cả 3 lần; harmonic chỉ khác ở các điểm −12 (do đổi
  cơ chế) + flake sine (220,−12) r1; sine +12 AM khớp y hệt 196.
  Node sim chạy trên core cuối (mặc định twostage) — số ở §2.2.
- **Kỷ luật pha đo yên:** kiểm poll T4 trước MỌI lần đo nặng. Poll log tóm
  tắt `round197-t4-poll.log` KHÔNG cập nhật từ 20:44Z (mtime cũ) — P1 đọc
  log sống `round197-t4/poll-t4.log` thay thế: poll #29 (21:05:44Z, trước
  render E2E), #33 (21:08:45Z, trước headed lần 1), #41 (21:14:47Z, trước
  headed lần 2), #43 (21:16:17Z, trước vite build) đều `lock=khong`,
  `gate0=khong-dat` — **T4-197 KHÔNG mở attempt nào trong suốt cửa sổ đo
  của P1** (20:51–21:16Z). **0 lần đo nặng chồng pha (b) T4.**
- Hạ tầng đo: `hidden_files/round197-p1/` (exp-m12-197.json,
  sim-197.json, render-e2e-197.json,
  chrome-2026-11-26T21-10-04-592Z.json (two-stage, 2 repeat),
  chrome-2026-11-26T21-15-57-485Z.json (bản ship, 1 repeat),
  harness/ 17 file (page-measure.mjs + cdp-driver.mjs + sim/experiment +
  voicefx-bundle.mjs đã build lại 2 lần + ref.wav fixture, không stage).
  Script chẩn đoán /tmp không còn (đợt này không dùng /tmp cho số liệu).

## 9. File đổi (stage trong paths-loop)

- `apps/web/src/lib/psola.ts` — chế độ integerRatio (twostage mặc định) +
  đính chính chú thích lock.
- `apps/web/src/lib/psola.test.ts` — test mới (twostage / lock mode none /
  bit-identical / isIntegerRatioHalf).
- `apps/web/src/lib/previewVoiceFx.ts` — chuỗi worklet 1–2 node + chặn −12.
- `apps/web/src/lib/previewVoiceFx.test.ts` — test chặn (nhánh A/B) +
  helper two-stage.
- `server/render/src/psolaPitch.js` — tiền xử lý pitch PSOLA cho render (mới).
- `server/render/src/voicefx.js` — `buildVoiceFilters` opts pitchDone.
- `server/render/src/audioroute.js` — truyền opts pitchDone.
- `server/render/src/render.js` — tiền xử lý + đăng ký wav tạm + chọn stream.
- `docs/PHASE9_ROUND197_P1_VOICEFX_LIMITS.md` — file này.

**KHÔNG đổi:** `psolaWorkletSource.ts` (processor tái dùng y hệt),
hằng số voicefx (W / SAW_GAIN_COMP / TELEPHONE_WET_GAIN_COMP),
`audioEngine.ts` (gọi upgrade như cũ — fire-and-forget, không cần đổi),
`preview.tsx`, GAP, aggregate (việc của T10), MEMORY.md, build-loop-log.md.
**Không chạm file chung nào khác — không có xung đột để T10 phải kiểm.**
Script đo + fixture chỉ nằm ở hidden_files, KHÔNG stage vào repo (theo
tiền lệ 193/194/195/196). Wav tạm của render nằm ở os.tmpdir (tên theo pid,
không stage).

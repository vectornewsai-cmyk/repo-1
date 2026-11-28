# PHASE9 ROUND197 P4 — PARITY VERIFY LIMITS (kiểm chứng độc lập)

Luồng P4 đợt 197 — harness parity render-vs-preview + kiểm chứng độc lập quy tắc S2 của P3 (theo quyết (a1)/(a2)/(a4)-196, aggregate 196 §14.2 bản parent-đã-đính-chính). Chỉ sửa harness/fixture/test của mình; không sửa code sản phẩm P1/P2/P3. KHÔNG push.

## §0. Verdict tóm tắt

- **Harness lần 3 (final, 21:12:09Z): 48/53 ĐẠT, 5 CHƯA ĐẠT, 8 GHI NHẬN (61 record).** Lần 1 (code 196): 45/48, 3 CHƯA, 12 GHI NHẬN. Lần 2 (21:05Z): 47/53 — N5d CHƯA do P2 đổi w 0,75→0,8; lần 3 sau khi cập nhật bar N5d theo số đo P2: 48/53.
- **S2 ĐÃ ĐƯỢC XÁC MINH — longB ĐẠT.** Tái tính độc lập từ JSON waveform thô 196 (code viết mới từ định nghĩa, không copy P3/P4): S2 max longB 0,481 s (196) / 0,419 s (197) — dưới bar 0,5 s. S2 là phép đo hợp lệ, không phải cherry-picking (§1). Thước S2 làm thước verdict chính từ đợt 197 (harness đã đổi).
- **N10 VẪN CHƯA ĐẠT — nhưng chỉ còn R_rel.** MAD preview 6,240 nay THẮNG tap 6,243 (−0,003); R_rel tệ nhất 0,155 > 0,15. Phát hiện mới: **chính tap cũng 0,155 ở frame f11** — bar 0,15 thấp hơn cái tap đạt được trên fixture này; không phải lỗi blend (§2.1, quyết (d2) cho parent).
- **PSOLA −12 (twostage): đỉnh cao độ DỊCH ĐÚNG cả hai thước, nhưng N12a VẪN CHƯA ĐẠT theo thước harness đứng** (tỉ số mag ngắn-cửa-sổ 1,7–2,7 < 10 do tàn dư gốc không ổn định tần số). P1 KHÔNG chặn −12 về fallback 2-delay như chữ (a2) mà sửa lõi bằng twostage — parent phán xem có thỏa ý (a2) không (§2.2, quyết (d3)).
- **N11b: đổi cửa sổ ĐẠT (20/24/88/90 ms từ cache), cửa sổ đầu VẪN CHƯA cả hai clip** (longA 5.414 ms, longB 6.314 ms > 5.000 ms) — cần decode từng phần thật, nợ đợt 198.
- **F-197-P4-1 (mới): sampleAt NaN VẪN CÒN** — đính chính (r)-196: fix NaN chưa xong trong đợt 196 (P1-196 LIMITS không hề nhắc sampleAt/NaN; F-196-P4-4 chỉ giao việc).
- **P1-197/P2-197 LIMITS CHƯA XUẤT BẢN lúc P4 đóng (21:12Z)** → các record headed-voice (N1/N2/N2c/N9b/N12) + N13 ở GHI NHẬN; đối chiếu headed-voice chưa xong — nợ T10 ghi nhận, không chặn verdict sim/probe (đã khớp từng số).
- Kiểm chứng: `npx tsc --noEmit` 0 lỗi; test harness **23/23 PASS** (22 cũ + 1 S2 mới; 2 test cũ cập nhật theo hành vi mới có chủ đích: w 0,8 + twostage −12 dịch — §2.5). T4 yên: 0 attempt nào mở trong lúc P4 đo (poll log: gate0 chưa bao giờ đạt; 0 chồng pha). TMPDIR đặt trên scratch đĩa (F-196-P4-1: /tmp tmpfs 512 MB).

## §1. Kiểm chứng độc lập quy tắc S2 — VERIFIED

### 1.1. Phương pháp (không tin mù)
Viết lại code tính từ định nghĩa trong LIMITS P3-196 §1.4 + probe 196 (`scratch/s2-verify.py`, `s2-verify2.py` — không copy code P3/P4): drift = wrap(t_audio − playhead mod 10) về [−5,5], t_audio = ((peakHz−300)/270) mod 10; chỉ tính mẫu sau lần đầu rms>0 và rms>0. Chạy trên JSON waveform thô 196 `audio-waveform-196-{longA,longB}.json`. S1 = quy tắc cũ (peak đóng băng + playhead chạy ≥0,2 s); S2 = S1 + lag-peak (|Δpeak| ≤ 24 Hz + playhead chạy ≥0,15 s).

### 1.2. Số đo 196 (khớp từng số P3/P4-196, trừ 1 đính chính)
| | longA | longB |
|---|---|---|
| max thô | 0,485 s (idx190, mẫu chuyển restart) | 0,993 s (idx349) |
| max S1 (đã sửa epsilon float) | 0,485 s | **0,537 s** (idx39) |
| max S2 | 0,485 s | **0,481 s** (idx409) |
| mẫu lọc S1 / S2 | — | 85/456 / 111/456 |
| median S1 → S2 | — | 0,137 → 0,141 |
| p90 S1 → S2 | — | 0,259 → 0,263 (P3 ghi khoảng 0,263–0,270; chênh 0,011 < 1 bin đo 0,089 s, không đáng kể) |
| drift duy trì (sustained) | 0,415 s (idx168–169) | ~0,437 s (idx171–172, 2 mẫu liên tiếp) |
| cap drift | −0,356 / −0,415 | −0,174 / −0,370 / −0,248 (khớp P3) |

**Đính chính claim của P3:** P3 viết "S1 cũ max 0,737 s" — đó là S1 **CHƯA sửa lỗi epsilon float** (bug: idx40 291,7−291,5 = 0,19999999999998863 < 0,2 nên lọt). Ba thước đúng: **S1-buggy 0,737 / S1-đã-sửa 0,537 / S2 0,481**. P4-196 đã dùng đúng 0,537; chỉ lời P3 ghi 0,737 là lẫn bản buggy.

### 1.3. Bằng chứng idx40 là nhiễu analyser (không phải drift thật)
Peak đóng băng 883 (idx38) → 904 (idx39, Δpeak 21 Hz < 24 → S2 bắt, S1 bỏ qua vì peak đã đổi) → 904 (idx40, S1+S2 đều bắt) → idx41 restartExact 8→9, drift −0,237: vị trí audio không thể nhảy 0,97 s trong 0,25 s — bất khả thi vật lý. **idx409 (max S2 −0,481) là mẫu thật được giữ:** Δpeak −43 Hz (> 24, không phải lag), playhead đứng yên (micro-hold), mẫu sau −0,281 — dip 1 mẫu, không duy trì.

### 1.4. S2 không phải cherry-picking — 3 lý do
1. **Cơ sở vật lý:** chirp quét 270 Hz/s → playhead chạy ≥0,15 s thì peak thật phải dịch ≥ ~40 Hz; dịch ≤24 Hz (1 bin FFT @48k/2048) là không thể với audio thật. Ngưỡng 0,15 s có nguyên tắc (dưới khoảng lấy mẫu 0,25 s; 0,25 s sẽ đòi playhead chạy hơn 1 khoảng mẫu — quá chặt).
2. **Nhạy ngưỡng ổn định:** max S2 = 0,481 s với run-threshold 0,10 và 0,15 × Δpeak 24/36/48 Hz. Chỉ khi run ≥ 0,20 mà KHÔNG có epsilon thì idx40 lọt (0,737) — thuần lỗi float; có epsilon thì run ≥ 0,20 cũng cho 0,481.
3. **Lọc không thiên vị drift lớn:** S2 lọc cả mẫu drift nhỏ (72/111 mẫu lọc có |drift| ≤ 0,3; median |drift| mẫu lọc 0,204) — tiêu chí chỉ xét peakHz/playhead, không xét độ lớn drift.

### 1.5. Phán cuối S2 + caveat
**S2 VERIFIED — quy tắc đo hợp lệ. longB ĐẠT dưới S2 (0,481 s đợt 196; 0,419 s đợt 197).** Caveat: biên 196 chỉ 0,019 s < 1 bin đo (0,089 s) → "ĐẠT sát nút, trong giới hạn phân giải đo"; max là dip 1 mẫu, drift duy trì ~0,437 s. Đợt 197 biên dày hơn (0,081 s). **S1 kém ổn định qua các đợt: max longB 0,537 (196) → 0,963 (197)** trong khi S2 ổn định 0,481 → 0,419 — thêm lý do dùng S2 làm thước chính.

## §2. Harness 197 — kết quả theo record

### 2.1. N10 — MAD thắng tap, R_rel thua vì bar thấp hơn tap (CHƯA ĐẠT)
MAD preview **6,240 vs tap 6,243 (−0,003)** — lần đầu preview thắng tap (196: +0,013). Theo frame: f3 6,311/6,316; f7 6,376/6,381; f11 6,033/6,031. **R_rel tệ nhất 0,155 > 0,15 → CHƯA ĐẠT.** w blend nay 0,8 (xem §2.5); ép w=0,75 cho avg 6,256 (khớp P2 sweep).
**Phát hiện bar/fixture:** probe P2-197 (`probe-197-p2a.json`, 20:47Z) cho thấy **tap tự thân R_rel = 0,155 ở f11** (tapRrel f11 = 0,155; w=1,0 tức preview=tap cũng cho R_rel 0,155). Bar 0,15 thấp hơn cái tap đạt được trên frame này — dù blend hoàn hảo cũng không qua. Đây là vấn đề bar/fixture, không phải lỗi blend: đừng bắt P2 tune blend thêm (w=1,0 cho cùng 0,155). **Quyết (d2) cho parent: đổi bar (vd 0,16) hay đổi frame fixture f11.**
N5b ĐẠT: 6,803 vs 6,855 (−0,052; 196: 6,804/−0,052), R_rel 0,107. N5c ĐẠT (−0,815 vs top-only). S1/S2/S3/S4/S5/S6/S7/S8/N3/N4/N5/N5b/N5c/N9a/N2b: ĐẠT, không hồi quy (số chi tiết trong `parity197-report.json`).

### 2.2. N12a — PSOLA −12 twostage: dịch đúng cao độ, thua thước tỉ số (CHƯA ĐẠT)
P1-197 làm: `integerRatioMode` ("none"|"dither"|"twostage"|"detune"), mặc định **"twostage"** (hai tầng −6, mỗi tầng r=√0,5) cả offline (`psola.ts`) lẫn worklet (`previewVoiceFx.ts`: 2 node nối tiếp, mỗi node √r; hỏng build mới fallback 2-delay). **Lệch chữ (a2)-196:** P1 KHÔNG chặn −12 về fallback 2-delay mà sửa lõi bằng twostage; 2-delay chỉ khi build chain lỗi. Comment trong `psola.ts` vẫn ghi mặc định "none" (stale — P1 sửa).
**Tái tạo P1 đúng từng số:** dùng fixture + Hann FFT `measure.mjs` của P1, số của P4 khớp `exp-m12-197.json` digit-for-digit (sine twostage đỉnh 110,4/165,3/220,3/275,3/330,5 Hz; errW 0,02–0,06; AM 0,036–0,080). `sim-197.json`: harmonic band 40/40, wide 39/40 (chỉ trượt 220/−7 wide — fundamental yếu, peakWide ở harmonic 2), AM 39/40 (chỉ trượt 220/−12 AM 0,424 > 0,35); sine band 40/40, wide 39/40 (chỉ 660/−7), AM 40/40. Dither FAIL (wide err +7,04/+15,88), detune FAIL (wide err ~+12) — P1 đã thử, P4 không cần lặp lại.
**Đo độc lập của P4 (Goertzel/Hann-FFT riêng, cửa sổ dài [1,0;3,5) trên tone 4 s):** tone đích ổn định ~110,4 Hz (case 220), mag ~0,24 (input 0,5); tàn dư gốc **không ổn định tần số** (~0,10 trong cửa sổ 0,5 s, triệt còn ~0,014 trên 2,5 s); harmonic 3 mạnh (~0,21, ngang tone đích — đổi âm sắc, cao độ vẫn rõ ở 110 Hz); tỉ số magT/magO trượt 0,5 s ổn định 2,1–2,7 suốt [0,2;3,5) — không phải transient khởi động; không nhạy phase (0/π/2/π/3π/2/−0,1 s giống nhau tới 2 chữ số).
**Bẫy đo đã gỡ:** kết quả Goertzel cửa sổ ngắn + cửa sổ chữ nhật ban đầu (twostage wide 0/5, đỉnh harmonic 3) là artifact — Goertzel tại tần số danh nghĩa trên cửa sổ 2,5 s rơi đúng bin null (tone 110,4 Hz cao hơn danh nghĩa 110,0 đúng 1 bin 0,4 Hz; diag: G(220,0)=0,0244 vs G(220,4)=0,4953). Phương pháp đúng: Hann FFT hoặc Goertzel tại đúng đỉnh đo được.
**Harness N12a (thước đứng, cửa sổ 0,5 s, magT ≥ 10×magO):** worst_err_st 19,02; worst_err_harm_st 0,098; AM tệ nhất 0,188; **not_shifted 5/20 (toàn −12), pitch_shifted 15/20**; nan_samples_max 2 (F-197-P4-1). Theo điểm −12: domFreq tại đích 220→109 Hz (errHarm −0,158), 440→219 (−0,079), 660→329 (−0,053); 330→495 Hz và 550→825 Hz là **harmonic 3 của đích** (errHarm +7,02 vì thước chỉ thử k∈{1,2} — artifact thước, không phải lỗi cao độ); tỉ số magT/magO: 220: 0,448/0,178 = 2,51; 330: 0,395/0,208 = 1,90; 440: 0,440/0,169 = 2,61; 550: 0,380/0,218 = 1,74; 660: 0,436/0,164 = 2,65 — đều < 10. **Lập trường P4: giữ N12a CHƯA ĐẠT theo thước đứng** (harness là công cụ verdict — không âm thầm đổi thước để cho qua), trình cả hai thước + cơ chế tàn dư để parent/T10 phán (quyết (d3)). AM harmonic 220/−12 = 0,424 > 0,35 (số của P1, 1/10 trượt) — ghi nhận thêm.
N2a CHƯA ĐẠT (không đổi, đúng kỳ vọng): fallback 2-delay, AM tệ nhất 0,534 @440. N2b/N9a ĐẠT.

### 2.3. N11a — drift 197: longA 0,333 s / longB 0,419 s, cả hai ĐẠT (S2)
| | longA | longB | chirp-70s |
|---|---|---|---|
| S2 max (bar 0,5 s) | **0,333** (196: 0,485) | **0,419** (196: 0,481) | 0,371 — GHI NHẬN |
| median / p90 S2 | 0,059 / 0,148 | 0,104 / 0,233 | 0,162 / 0,320 |
| S1 max / thô | 0,333 / 0,333 | 0,963 / 1,344 | 0,371 / 0,371 |
| inPass / tổng | 119/200 | 455/480 | 122/130 |
| stale S1 / lag S2 | 10 / 23 | 82 / 108 | 26 / 34 |
| holdCapStop Δ / playFalse | 2 / 0 | 1 / 2 | 0 / 0 |
longB: restartExact 20 (196: 81 — hold ngắn hơn, không phải hồi quy), windowRebuilds 4, playOk 291. **playFalse = 2 là F-197-P3-1** (P3 đã ghi: race 1 tick ở biên đổi cửa sổ thứ 3/4, RMS tại 2 mẫu vẫn có tiếng 0,2876/0,3341 — không hở tiếng nghe được; P4 xác nhận số). Chirp GHI NHẬN theo (a4)-196 (không phải fixture bar; bin 0,606 s > bar; cap không kích hoạt lần nào).

### 2.4. N11b — đổi cửa sổ ĐẠT, cửa sổ đầu CHƯA (cả hai clip)
| | longA | longB | chirp |
|---|---|---|---|
| headed cửa sổ đầu (bar 5.000 ms) | **5.414 — CHƯA (+414)** | **6.314 — CHƯA (+1.314)** | 981 — ĐẠT |
| headed lần gần nhất | 5.414 | **90** (cache) | 981 |
| probe riêng P3 (3 lần) | 4.876,5 / 3.908 / 5.025,9 | 1.666,1 / 1.399,1 / 1.321,9 | 181,4 / 148,1 / 144,1 |
| ffmpeg audio-only (tham chiếu) | 0,788 s | 0,718 s | 0,176 s |
Đổi cửa sổ longB từ cache: **20/24/88/90 ms (4/4, Δcached=4)** — nhanh hơn 196 (~55–400 lần), lần chậm nhất chỉ 1,8% bar kể cả dưới load 6,6. Cửa sổ đầu vẫn decode toàn file nên cache không giúp; bar cửa sổ đầu vốn sát giới hạn vật lý (probe longA lần 1 khi máy rảnh: 4.877 ms, biên chỉ 123 ms). Nợ đợt 198: decode từng phần thật (P3 đã nhận).

### 2.5. N5d + cập nhật test theo hành vi mới có chủ đích
P2-197 đổi `ENHANCE_PREVIEW_DEINT_VERTICAL_BLEND_W` 0,75→0,8 (`enhancePreview.ts:259`). Có số đo: w-sweep `probe-197-p2a.json` (20:47Z) — N10 avg MAD 6,256 (w=0,75) → **6,240 (w=0,8)**, w=0,85: 6,237; P4 đo độc lập khớp từng số (N10 6,240; N5b 6,803 ≈ 6,804 đợt 196). Bar N5d cập nhật 0,75→0,8 (khóa LITERAL trong test + record — đổi lặng lần nữa sẽ FAIL và bắt cập nhật có ý thức); N5d **ĐẠT** ở lần 3. Ngưỡng σ̂≥2,7 giữ nguyên; cổng tap + hành vi bước nhảy giữ nguyên.
2 test cập nhật theo hành vi mới có chủ đích (P1/P2-197): `deintVerticalBlendWeight` (0,75→0,8) và `psolaShiftSim` (440/−12 nay DỊCH về 220, errHarm < 0,5 st — khóa cũ F-196-P4-3 đã được sửa; `pitchShifted` vẫn false theo thước tỉ số). Test 23/23 PASS, tsc 0 lỗi.

### 2.6. Các record còn lại
- **N13-fps-source-media: GHI NHẬN** — `fps_field_in_media_ts=1` (P2-197 LIMITS chưa xuất bản nên chưa đối chiếu claim fps:30/B1-settle; P2-197 đã ghi fps:30 theo MEMORY đợt 196 — chờ LIMITS P2 để khóa).
- **N1/N2/N2c/N9b/N12 (headed-voice): GHI NHẬN** — `headed-voice197.json` chưa xuất bản lúc P4 đóng; không đo lại bằng số bịa. Đối chiếu sim/probe của P1 (§2.2) đã đủ mạnh để verdict N12a; headed-voice chỉ còn là xác nhận cuối.
- **S6b-reverse-video-boundary: GHI NHẬN** — worst MAD 33,19, offset 1 frame (như 196; không phải verdict).
- S6/S6a/S6b-headed-seek/S6-reverse-speed2/S7/S7b/S7c/S7d/N7/N6/S8/S8-decode-ahead-gate/S8-cadence-tracker/S8-proxy-direction/N11b-window-logic: ĐẠT.

## §3. Đối chiếu P1/P2/P3 — khớp từng số ở record chung
| Nguồn | Kết quả đối chiếu |
|---|---|
| P3-197 LIMITS | **Khớp digit-for-digit mọi số:** decode đầu 5.414/6.314/981 ms; đổi cửa sổ 20/24/88/90; drift S2 0,333/0,419; median/p90; stale 10/82; lag 23/108; cap Δ 2/1; playFalse 0/2; restartExact 0/20; windowRebuilds 0/4; RMS sounding 0,3198/0,3223; avail cuối pass. P3 tự kết luận "N11b ĐẠT một nửa" — P4 đồng ý: đổi cửa sổ xong, cửa sổ đầu chưa. |
| P2 probe-197-p2a.json | **Khớp digit-for-digit:** N10 MAD w=0,8: 6,311/6,376/6,033; w=0,75: 6,328/6,391/6,049; R_rel tệ nhất 0,155; tapRrel f11 = 0,155. N5b MAD khớp 6,803. |
| P1 exp-m12-197.json + sim-197.json | **Tái tạo đúng digit-for-digit** bằng fixture + Hann FFT của P1 (§2.2). Số P1 trung thực. Dither/detune FAIL theo đúng số P1. |
| P1-197 / P2-197 LIMITS | **CHƯA XUẤT BẢN lúc P4 đóng 21:12Z** → headed-voice + N13/fps chưa đối chiếu được. Nợ T10 ghi nhận; không chặn verdict (sim + probe + P3-LIMITS đã khớp). |

## §4. F-numbers đợt 197 (P4)
- **F-197-P4-1 (MỚI, BUG): sampleAt NaN VẪN CÒN — fix chưa xong.** Đo trực tiếp (`scratch/nan-check-197.mjs`, 3 lần chạy ổn định, psola.ts không có Math.random): output `psolaPitchShift` vẫn chứa NaN gần đuôi — 440/−12: 2 NaN (idx 33590–33591); −7/+7/+12: 1 mỗi cái (idx 33568–33584, KHÔNG phải mẫu cuối 33599). Nguyên nhân: `sampleAt()` trong `psola.ts` chỉ return sớm khi `frac===0` ở mẫu cuối; khi `i0 = length−1, frac>0` vẫn đọc `samples[length]` = undefined → NaN. **Đính chính ghi chú (r)-196** ("fix sampleAt NaN đã xong đợt 196"): SAI — P1-196 LIMITS không hề nhắc sampleAt/NaN; F-196-P4-4 chỉ giao việc. Harness sanitize NaN→0 trước khi phân tích nên số pitch không nhiễm. **Giao P1-198: clamp đúng trong sampleAt.**
- **F-197-P3-1 (của P3, P4 xác nhận số):** playFalse = 2 ở biên đổi cửa sổ longB — race 1 tick, không hở tiếng (RMS 0,2876/0,3341). Không phải bug nghe được; theo dõi.
- F-196-P4-2 (vách σ̂ 8,0): ĐÃ SỬA từ 196 (ngưỡng 2,7 giữ nguyên đợt này). F-196-P4-3 (PSOLA không dịch r=0,5): **ĐÃ ĐƯỢC SỬA bằng twostage** (đỉnh tại đích — §2.2); chỉ còn thước tỉ số chưa qua. F-196-P4-4 (giao fix NaN): P1 chưa làm xong → F-197-P4-1. F-196-P4-1 (/tmp tmpfs): P4-197 đã tránh bằng TMPDIR scratch đĩa.

## §5. File stage + quyết cho parent/T10
**File stage đợt này (6 file text):** `docs/PHASE9_ROUND197_P4_PARITY_VERIFY_LIMITS.md` (file này, 19.875 B — dưới trần 37.768 B); `apps/web/src/lib/parityHarness197.ts` (**195.901 B — VƯỢT trần push, cần ENABLE_PRIVSEP=0 lúc push**; harness tích lũy qua các đợt: 191: 65 KB → 196: 190.192 B → 197: 195.901 B); `apps/web/src/lib/parityHarness197.test.ts` (14.073 B); `scripts/parity197-run.mjs`; `scripts/parity197-run-test.mjs`; `apps/web/tsconfig.json` (exclude test mới). Report JSON: `hidden_files/parity197/parity197-report.json` (lần 3, 21:12:09Z — không stage, chỉ tham chiếu). Scratch kiểm chứng S2/−12/NaN: `hidden_files/parity197/scratch/` (không stage).
**Quyết cần parent (T10 ghi vào §quyết):**
- **(d1) S2 verified → longB ĐẠT** (196: 0,481 s; 197: 0,419 s); S2 là thước verdict chính từ đợt 197.
- **(d2) N10 R_rel:** tap tự thân 0,155 ở f11 → đổi bar 0,15→~0,16 hay đổi frame fixture? Đừng bắt P2 tune blend thêm.
- **(d3) Twostage −12:** giữ N12a CHƯA ĐẠT theo thước đứng (đề xuất P4) hay chấp nhận twostage đã sửa xong theo bằng chứng cửa sổ dài? Và (a2)-196 chữ "chặn về fallback" — twostage có thỏa ý (a2) không (ý là không bao giờ pitch sai lặng lẽ)? Nếu parent chấp nhận, thước N12a đợt 198 nên đổi sang peak-location / tỉ số cửa sổ dài.
- **(d4) F-197-P4-1 NaN → P1-198.**
- **(d5) N11b cửa sổ đầu → nợ decode từng phần thật đợt 198 (P3).**
- **(d6) P1/P2 LIMITS chưa xuất bản lúc P4 đóng** — T10 ghi nhận; headed-voice cross-check dời sang đợt 198 nếu P1 xuất bản muộn.
**Nợ đứng P4 mang sang 198:** headed-voice197.json (N1/N2/N2c/N9b/N12); LIMITS P2-197 (fps:30 + B1 settle + N10 claim cuối); AM harmonic 220/−12 = 0,424 > 0,35 (P1 sim — 1/10 trượt); doc comment `psola.ts` "default none" stale.

## §6. Phương pháp + tái tạo
Harness `parityHarness197.ts` (isLaggingPeak S2 export mới) + runner `scripts/parity197-run.mjs` (đọc JSON waveform thô P3-197 + decode-probe-197.json, tính lại độc lập; ffmpeg 8.1.2 đo proxy audio-only). S2 verify: `scratch/s2-verify.py`/`s2-verify2.py` (code viết mới từ định nghĩa). −12 verify: `scratch/m12-verify*.mjs`, `m12-diag*.mjs` (Goertzel/Hann-FFT riêng). NaN: `scratch/nan-check-197.mjs`. Chạy test: `TMPDIR=<scratch> node scripts/parity197-run-test.mjs` → 23/23 PASS; `npx tsc --noEmit` (apps/web) → 0 lỗi. Harness lần 3: `TMPDIR=<scratch> node scripts/parity197-run.mjs` → 48/53 ĐẠT. T4 yên: kiểm `round197-t4-poll.log` trước mọi đo nặng — gate0 chưa bao giờ đạt, 0 attempt mở, 0 chồng pha.

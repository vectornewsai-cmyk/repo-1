# Đợt 203 P4 — Kiểm chứng độc lập: parity harness (N12a-wide, longA, biên keyframe, tách harness)

**Nhiệm vụ (quyết (a4)/(a5)/(a6)/(r)-202):** (1) chạy lại N12a-wide trên
headed JSON P1-202; (2) phán longA-201 theo luật cụm ĐÃ SỬA (a5)-202;
(3) xác nhận giả thuyết biên keyframe cho longA-202; (4) harness lại
N10/N5b (cap 1,05), N11a/N11b trên dữ liệu P3-203; (5) rút gọn
parityHarness202.ts dưới trần push nếu có thể.
**Verdict: harness 54/55 ĐẠT (CHƯA chỉ N2a, đợt thứ 7 liên tiếp); 11 GHI
NHẬN. N12a-wide 20/20 trên headed JSON P1-202 (caveat: 2 run giống hệt
— bằng chứng độc lập thực chất 10 điểm). longA-201 ĐẠT theo luật cụm
đã sửa; longA-202 CHƯA — biên keyframe XÁC NHẬN ở mức biên GOP.
longA-203 (probe mới của P3): ĐẠT SẠCH, max drift 0,470 s — stall đợt
202 không tái diễn (nhưng tải nhẹ, xem §3.3). Harness đã tách thành
10 file, tất cả dưới trần push, số đo giống hệt bản đơn (trừ 4 timing
ffmpeg đo lại + 1 sửa S5, xem §5).**

## §0. Tóm tắt số đo

| Hạng mục | Đợt 202 | Đợt 203 | Thay đổi |
|---|---|---|---|
| Harness tổng | 54/55 ĐẠT | **54/55 ĐẠT** | y hệt (CHƯA chỉ N2a) |
| CHƯA ĐẠT | N2a | **N2a** | đợt thứ 7 liên tiếp |
| GHI NHẬN | 11 | 11 | không đổi |
| N10 (cap ship) | 6,101 / 0,074 | **6,101 / 0,074** | y hệt (m 1,05/1,05/1,05) |
| N5b (cap ship) | 6,810 / 0,109 | **6,810 / 0,109** | y hệt (m 1,012/1,0/1,0) |
| N12a autocorr tệ nhất | 0,054 st | **0,054 st** | y hệt, gate_fail 0/20 |
| N12a-wide | 55/60 (dữ liệu 199) | **20/20 (headed JSON P1-202)** | đã có JSON mới |
| N11a longA-201 | CHƯA (luật cũ) | **ĐẠT (luật cụm đã sửa)** | flip do luật (a5)-202 |
| N11a longA-202 | CHƯA | **CHƯA** | 55 mẫu / 6 cụm, không đổi |
| N11a longA-203 (probe mới) | — | **ĐẠT, max 0,470 s** | lần đầu đo trên probe-203 |
| N11b decode tệ nhất (harness) | 3.720 ms | **3.720 ms** | dữ liệu waveform vẫn 200 |

- Runner harness 203 (bản tách): exit 1 (đúng kỳ vọng — 1 CHƯA),
  report `hidden_files/parity203/parity203-report.json` tạo
  2026-11-28T00:39:37Z (bản đơn Phase A tạo 00:12:50Z, 54/55 y hệt).
- `npx tsc --noEmit` (apps/web): **0 lỗi** (chạy sau tách, ~00:40Z).
  Test harness 203: **29/29 PASS**.
- P1-203/P2-203 chưa có `.done` hay LIMITS lúc viết LIMITS này
  (~00:55Z 28/11) — số P1/P2 dưới đây chỉ dùng dữ liệu đã publish
  tới lúc đó; P3-203 đã publish probe JSON (chưa có `.done`).

## §1. N12a — autocorr ĐẠT; wide 20/20 trên headed JSON P1-202

### 1.1 Autocorr (sim, dữ liệu sẵn có)

N12a-psola-sim **ĐẠT**: autocorr tệ nhất ở −12 là **0,054 st** (bar
0,1 st), gate_fail **0/20**, nan 0, weak_fundamental 3/20. Y hệt
199/200/201/202 — sim ổn định qua 5 đợt.

### 1.2 Wide — 20/20 trên headed JSON P1-202 (quyết (a4)-202: chạy lại)

- File dùng: `hidden_files/round202-p1/chrome-2026-11-27T21-26-29-540Z.json`
  (31.157 B, P1-202 publish 21:26Z 27/11). P1-203 tới lúc viết chưa
  publish headed JSON mới (chỉ có `scratch/`, `ab203/`,
  `frames203.json`, `harness/`) — wide trên JSON P1-203 vẫn là nợ
  sang đợt 204. Script: `hidden_files/round203-p4/scratch/wide-rederive-203.mjs`
  (quét 203-p1 trước, fallback 202→201→200→199).
- Kết quả: **KẾT HỢP 20/20 | band 20/20 | WIDE 20/20**; mỗi run 10/10
  (run1 và run2 đều 10/10, minus12Fallback=false). Gate wide 10/10
  theo (a4)-199 ĐẠT cả 2 run. Max |errSt| 0,06; max |errStWide| 0,06;
  max AM 0,4.
- **Caveat trung thực:** 2 run có pitchCurve/harmonicCurve giống hệt
  từng số (đã verify bằng python: `pitchCurve identical: True`,
  `harmonicCurve identical: True`); chỉ khác counters tích lũy
  (psolaUpgraded 80 vs 160, twoStageRenders 10 vs 20, elapsedMs
  25424 vs 25412). Bằng chứng độc lập thực chất là **10 điểm, không
  phải 20** — con số 20/20 ghi đúng theo luật đếm của harness, nhưng
  parent đọc cần biết 2 run không độc lập.

## §2. Harness 203 — 54/55; N10/N5b cap 1,05; N2a CHƯA lần 7

- **N10 ĐẠT** 6,101/0,074 (m 1,05/1,05/1,05); đối chiếu cap-1,12:
  6,126/0,082. Cap 1,05 đã ship: đã verify
  `DENOISE_MOTION_MULTIPLIER_MAX = 1.05` tại
  `apps/web/src/lib/enhancePreview.ts:531`. **N5b ĐẠT** 6,810/0,109
  (m 1,012/1,0/1,0).
- **N2a CHƯA** (worst_err_st 0,398, AM 0,534) — đợt thứ 7 liên tiếp,
  không đổi từ đợt 197. Không ai nhận sửa N2a trong các đợt gần đây.
- R_rel theo σ: 0,149/0,095/0,109. N11a longA-200 **ĐẠT** (4 mẫu,
  1 cụm, playhead 300,4 s); longB 0 vượt bar. 11 GHI NHẬN.
- Dữ liệu harness vẫn waveform-200: P3-203 chưa publish
  `audio-waveform-203-*.json` (chỉ có `audio-probe-203-*.json`, xem
  §3.3) nên sectionDriftCeiling203 fallback về waveform-200 như
  thiết kế. Harness N11a trên dữ liệu P3-203 thực sự chỉ có qua
  re-derive độc lập ở §3.3.

## §3. longA — 201 ĐẠT, 202 CHƯA, 203 ĐẠT (probe mới)

### 3.1 longA-201: ĐẠT theo luật cụm ĐÃ SỬA (quyết (a5)-202)

Script `hidden_files/round203-p4/scratch/probe203-n11.mjs` (verdict
`n11aVerdict203`: ĐẠT nếu maxS2 ≤ 0,5 HOẶC đúng 1 cụm + cùng
playhead; BỎ yêu cầu "bắt đầu ở đầu pass"). Output
`hidden_files/round203-p4/probe201-202-n11.json`; số đo tái hiện
đúng từng số P4-202.

- Dense: 32 mẫu vượt bar, **1 cụm** từ idxInPass 10, cùng playhead
  300,3 s, THO 0,119/0,437/0,678, drift −0,519/−0,596/−0,678/−0,530.
  Thinned 100 ms: 4 mẫu, 1 cụm từ idx 2 → **ĐẠT**. Luật cũ 201:
  CHƯA (cụm không bắt đầu ở đầu pass) — flip này là DO LUẬT, không
  phải do dữ liệu mới.
- N11b decode 6.401 ms > bar 5.000 ms (dưới tải nặng 3,3–4,4) —
  ghi nhận, không verdict N11b ở đây (bar chỉ áp tải thường theo
  (a6)-202).
- Chirp-201/202: GHI NHẬN, decode 1.840 / 3.974 ms ĐẠT.

### 3.2 longA-202: CHƯA — biên keyframe XÁC NHẬN (mức biên GOP)

- 55 mẫu vượt bar, 6 cụm, tất cả playhead 290,4 s; THO
  0,159/0,537/0,696; decode 11.902 ms (tải 7–8). **CHƯA ĐẠT** cả
  2 luật (cũ và mới).
- Media: `/home/hatch/workspace/tmp-round195-p3/longA-300s-gop300-720p.mp4`
  (60.176.543 B): h264 1280×720, 30 fps, duration 300,619271 s,
  9000 frames. ffprobe `-skip_frame nokey`: **30 keyframe, đều đặn
  mỗi 10,021354 s**; keyframe cuối 290,619271 s. Danh sách tại
  `hidden_files/round203-p4/scratch/longA-keyframes.txt`.
- Cả 55 mẫu vượt bar có playhead thô EXACTLY 290,433333…
  (= 8713/30, lưới frame 30 fps danh nghĩa); đóng băng 5,5 s wall
  (t 39758→45258 ms); 6 cụm, mỗi cụm trùng đúng 1 lần tăng
  holdLoopRestart (4→10); sau đó playhead tiếp tục giảm
  290,333→290,267.
- **Playhead đóng băng nằm 0,186 s DƯỚI keyframe 290,619271**
  (0,185938 s ≈ 5,6 frame) — KHÔNG trùng đúng timestamp keyframe.
  Kết luận: xác nhận ở **mức biên GOP** (stall đúng chỗ chuyển GOP
  cuối → GOP trước; pass chỉ vượt đúng 1 biên keyframe trong toàn
  bộ 298,4→281,2 s), kèm caveat 0,186 s này.
- Đối chứng 201: cùng biên vượt trong 5,18 s wall, ph bước đều,
  max |drift| 0,448, KHÔNG stall; 202 mất 10,07 s để vượt 291→290.
  **Biên là điều kiện cần, không đủ — tải quyết định** (202 tải
  7–8 vs 201 tải 3,3–4,4).
- Cơ chế (đọc code, không sửa): `ph` = `ra.lastPlayheadSec` trong
  `reverseAudioWiring.ts` tick(); hold đếm khi playhead giống hệt;
  C3-loop lặp đoạn 0,5 s mỗi hold. Comment `reversePlayback.ts`
  xác nhận seek khởi động lại decode từ keyframe (~0,5–1 s trên
  GOP thưa). Playhead 201 đóng băng: 300,2666… và 300,3333…
  (transient khởi động ở đầu stream).
- **Điểm căng (không tự quyết):** về vật lý là 1 lần đóng băng
  5,5 s duy nhất, nhưng luật đếm cụm cho 6 sự kiện → CHƯA theo
  (a5)-202 như đã viết. Muốn "1 freeze = 1 event" thì parent phải
  sửa luật lần nữa. C3-loop không sửa drift này (quyết (a5)-202) —
  chỉ xác nhận nguyên nhân, không giao sửa bằng C3.

### 3.3 longA-203 (probe mới của P3): ĐẠT SẠCH

P3-203 publish `audio-probe-203-longA-300s-gop300-720p.json` và
`audio-probe-203-chirp-70s.json` (00:13/00:20Z 28/11). Re-derive
độc lập bằng cùng script `probe203-n11.mjs` → output
`hidden_files/round203-p4/probe203-n11.json`:

- **longA-203: ĐẠT.** Dense: inPass 1225/1402, ph 300,4→271,4,
  THO median 0,115 / p90 0,289 / max **0,470**; S2 y hệt; **0 mẫu
  vượt bar, 0 cụm** (cả dense lẫn thinned-100ms: n=316, inPass
  279, max 0,470). N11b: decode đầu 2.798 ms / cuối 3.119 ms →
  **ĐẠT** (bar 5.000 ms, tải thường). CountersEnd: tick 1226,
  holdStop 603, holdKeep 473, holdCapStop 0, holdLoopRestart 15,
  holdMaxSec 1,698 s, windowRebuilds 1, restart 50, restartExact
  20, playOk 86, playFalse 0.
- **Chirp-203: GHI NHẬN**, max drift 0,426, decode 380 ms ĐẠT.
  Counters: tick 811, holdStop 407, holdKeep 393, restartExact 19,
  playOk 51.
- **Tải nhẹ là caveat chính:** load1 lúc probe longA-203 chỉ
  ~1,06→1,11 (202: tải 7–8; 201: 3,3–4,4). Stall 202 không tái
  diễn, nhưng KHÔNG chứng minh nguyên nhân biên keyframe đã hết —
  phù hợp với kết luận §3.2 "biên cần, tải quyết định". Đừng đọc
  longA-203 ĐẠT thành "đã sửa xong stall biên keyframe".
- **F-203-P4-2 — P3 báo max drift 1,611, P4 đo 0,470 (cùng file):**
  log P3 (`probe-203-longA-300s-gop300-720p-rerun.log`) ghi max
  1,611. Nguyên nhân đã xác minh: P3 filter sounding chỉ
  `rms > 0,05` (không kiểm peakHz) nên tính cả **3 mẫu đầu pass
  có peakHz = 0** (ph 300,5 / 300,47 / 300,43 — analyser chưa
  khóa lúc khởi động; drift từ peakHz=0 là vô nghĩa). Script P4
  và harness đều loại mẫu peakHz ≤ 0 (luật in-pass từ trước) →
  max 0,470. Median/p90 khớp nhau từng số (0,115/0,289); chirp
  khớp tuyệt đối (0,130/0,259/0,426) vì không có mẫu peakHz=0.
  Đây là khác biệt PHƯƠNG PHÁP, không phải khác biệt dữ liệu —
  verdict ĐẠT đứng theo luật đã có. Đề nghị P3-204 thêm điều
  kiện peakHz > 0 vào filter sounding của `analyze203.py`.
- P3 còn chạy longA attempt 1 (log 00:16:21Z): max 0,619,
  holdMaxSec 2,801 s, load cuối spike 9,97, ph 300,17→280,4.
  File attempt 1 đã bị rerun ghi đè (cùng tên file) nên P4 không
  kiểm chứng độc lập được — chỉ ghi nhận từ log P3, không dùng
  làm số chính.

## §4. Sim P3-203 — sửa F-201-P3-2 đã xác nhận trong sim

Spot-check `hidden_files/round203-p3/sim203-summary.json` vs
sim202 (cùng input chirp-201, 789 records, headedCounters giống
hệt):

- C3-real-adv: 7 gap (320,1 ms; 112,5 ms trừ startup) → **1 gap
  (207,6 ms startup)**; C3-real-hold: 5 gap (256,2 ms; 48,6 ms trừ
  startup) → **1 gap**. Mọi gap nối đoạn 8,3–31,5 ms BIẾN MẤT —
  sửa F-201-P3-2 (restart-exact 0,05→0,12 s + C3 lặp sớm) **ĐÃ XÁC
  NHẬN trong sim** (restartExact 3→9 / 4→7, holdLoopRestart 3→6 /
  2→6, playOk 28→34).
- Caveat: chỉ là sim replay, chưa phải probe headed mới lúc so —
  nay probe-203 headed (§3.3) đã cho longA ĐẠT, nhưng đó là drift
  tổng, không phải đo trực tiếp gap nối đoạn 8–32 ms. Hai claim
  không gộp: sửa gap nối đoạn xác nhận bằng sim; longA-203 ĐẠT
  xác nhận bằng probe headed dưới tải nhẹ.
- File WAV sim 945.382 B mỗi file — binary, KHÔNG stage.

## §5. Tách parityHarness203.ts — 10 file, tất cả dưới trần push

- Bản đơn: 233.618 B / 3.677 dòng (sau patch203 + fix TS6133) —
  VƯỢT trần push 37.768 B. Đã tách bằng
  `hidden_files/round203-p4/scratch/split203.py` (đọc từ bản đơn
  backup `hidden_files/round203-p4/parityHarness203-single-backup.ts`;
  script có guard chống chạy lại trên file đã tách).
- 10 file (đều < 37.768 B): core 16.535 B (state chung + helper
  thuần + helper drift S1/S2/verdict/m112); denoise 27.071 B;
  voice 28.581 B; reverse 36.682 B (sát trần nhất); deint 28.419 B
  (sims + deintFixture() memoized + sectionDeint N5/N5b/N5c);
  deint-motion 18.661 B (N10+N5d); headed 16.541 B; drift 36.056 B
  (sectionDriftCeiling203); psola 25.581 B; entry 12.151 B
  (header + main + re-export). Tổng ~246 KB (bản đơn 233.618 B +
  header/import lặp ~12 KB).
- Thiết kế: sectionDeint tách fixture thành `deintFixture()`
  memoized dùng chung cho sectionDeint + sectionDeintMotion
  (ffmpeg testsrc2 + interlace là xác định nên gọi lại cho cùng
  file); main() gọi sectionDeint() rồi sectionDeintMotion() liên
  tiếp; entry re-export helper thuần để
  `parityHarness203.test.ts` không đổi. Interface dùng chung
  HeadedVoiceJson chuyển sang core (headed + psola cùng dùng);
  WaveformJson203/ProbeJson203 chuyển sang drift.
- **Kiểm chứng sau tách:** `npx tsc --noEmit` **0 lỗi**; test
  **29/29 PASS**; harness đầy đủ **54/55 ĐẠT** (exit 1 đúng kỳ
  vọng). Diff report JSON bản đơn Phase A vs bản tách: chỉ khác
  `generatedAt` + 4 timing `ffmpeg_audio_only_decode_s` đo lại
  (0,631→0,374; 2,475→1,219; 1,602→1,354; 1,682→1,485 s —
  wall-clock, vẫn ĐẠT bar 5 s) + 1 sửa S5 (dưới đây). Mọi số xác
  định giống hệt.
- **Sửa S5 do tách gây ra:** sau tách, `discoverVoicePreviewModules()`
  nhận nhầm `parityHarness203-voice.ts` làm module voice sản phẩm
  (tên file khớp /voice/i) → candidate_modules 1→2, ghi "LỖI no
  createVoiceChain export" (verdict S5 vẫn ĐẠT, 35/35 tham số).
  Đã sửa: loại file `parityHarness*` khỏi danh sách ứng viên (chỉ
  tìm module sản phẩm) — sau sửa candidate_modules về 1, note S5
  giống hệt bản đơn.
- `parityHarness202.ts` KHÔNG đụng (đợt đã đóng); file 202 vẫn
  vượt trần — cần ENABLE_PRIVSEP=0 lúc push, ghi rõ để T10 khỏi
  quên. Tách chỉ áp dụng lineage từ 203 trở đi.

## §6. Phối hợp T4 — F-203-P4-1 (tsc chạy trong lúc W1-ACTIVE)

- **F-203-P4-1 (P4 tự báo):** `npx tsc --noEmit` (~30 s, ~00:26Z
  28/11, không ghi file vì --noEmit) chạy trong lúc file
  `round203-t4/W1-ACTIVE` còn tồn tại — lệnh kiểm W1 và lệnh tsc
  nằm chung một exec nên kiểm xong vẫn chạy tiếp; lỗi quy trình
  của P4. T4 attempt2 đang chạy lúc đó (done 00:26Z). Các lệnh
  nặng khác (tsc Phase A ~00:11Z, harness run 00:12Z/00:39Z, test)
  đều kiểm W1 trước trong exec riêng và sạch. Từ sau vụ này, P4
  kiểm W1 bằng exec riêng trước MỌI lệnh nặng.
- T4-203: cả 3 attempt đều không hợp lệ (attempt3: 20/20 + LOP B
  5/5 NHƯNG tickCost median 117,0 ms > 60) — poller thoát
  00:33:38Z, không còn cửa W1 mới sau đó. Phân loại vi phạm
  F-203-P4-1 do parent quyết (P4 tự báo, không tự xử).
- Không ghi file nào vào vùng W1 trong lúc W1 active; chỉ có 1
  lần tsc trên (đọc + type-check, không ghi).

## §7. Phát hiện mới / nợ sang đợt 204

1. **N12a-wide trên headed JSON P1-203** — chờ P1-203 publish
   (hiện wide dùng JSON P1-202, 20/20 với caveat 10 điểm độc lập).
2. **Harness N11a trên waveform-203** — chờ P3-203 publish
   `audio-waveform-203-*.json` (hiện fallback waveform-200;
   probe-203 đã re-derive độc lập ở §3.3).
3. **Điểm căng 1 freeze / 6 cụm (longA-202)** — chờ parent quyết
   luật đếm (xem §3.2). Không tự sửa luật.
4. **N2a CHƯA 7 đợt liên tiếp** — chưa có luồng nào nhận sửa.
5. **P3-204: thêm peakHz > 0 vào filter sounding** của
   `analyze203.py` (F-203-P4-2) để max drift không còn bị 3 mẫu
   khởi động peakHz=0 thổi lên 1,611.
6. **P1-203/P2-203 chưa đóng cờ** lúc viết LIMITS này — nếu 2
   luồng này publish dữ liệu mới sau 00:55Z, P4-204 chạy lại
   wide/harness trên dữ liệu đó.
7. File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`
   vẫn chưa quyết số phận (nợ đứng từ trước, không thuộc P4).

## §8. File / bằng chứng

- Harness tách: `apps/web/src/lib/parityHarness203*.ts` (10 file) +
  `apps/web/src/lib/parityHarness203.test.ts` + `scripts/parity203-run.mjs`
  + `scripts/parity203-run-test.mjs` + `apps/web/tsconfig.json`
  (thêm test vào exclude).
- Report: `hidden_files/parity203/parity203-report.json`
  (bản đơn Phase A lưu tại
  `hidden_files/round203-p4/parity203-report-phaseA.json`).
- Wide: `hidden_files/round203-p4/scratch/wide-rederive-203.mjs` (+ `.log`).
- longA: `hidden_files/round203-p4/scratch/probe203-n11.mjs` (+ `.log`),
  `probe201-202-n11.json`, `probe203-n11.json`,
  `scratch/longA-keyframes.txt`, `scratch/parity203-run*.log`.
- Tách: `hidden_files/round203-p4/scratch/split203.py`,
  `parityHarness203-single-backup.ts` (bản đơn).
- Dữ liệu: headed JSON P1-202
  `hidden_files/round202-p1/chrome-2026-11-27T21-26-29-540Z.json`;
  probe 203 `hidden_files/round203-p3/audio-probe-203-*.json`.

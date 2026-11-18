# Đợt 122 T3 — H3f: MỘT A/B CÓ KIỂM SOÁT, verdict TRUNG TÍNH → ĐÃ GỠ PATCH THẬT (LIMITS)

Ngày: 16/11/2026 (lượt cron 18:35 +07; đo 11:41–12:01Z). Boot `#64?` (số tạm
— T5 đợt 122, boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`, btime
11:05:18Z). Hạn cứng đóng đợt ~13:45Z — luồng xong 12:03Z, trong hạn.
Prereg: `hidden_files/round122-t3/prereg-t3.md` (viết TRƯỚC khi đo, 11:40Z).
KHÔNG push. KHÔNG release/tag. KHÔNG code giả.

## 0. Tóm tắt verdict — đọc trước

**Verdict: TRUNG TÍNH. Patch H3f ĐÃ GỠ THẬT khỏi cây lúc 12:02:56Z
(theo quyết parent đợt 121 §12.2 + prereg-t3 §3–§4).**

- Chân A gộp (baseline 03bf029f, A1+A2): tick chậm **58/896 = 6,47%**;
  longtask ≥200ms trung bình/run **21.799 ms** (n=167); gap >300ms trung
  bình/run **16.650 ms** (n=85).
- Chân B gộp (H3f 5be5a250, B1+B2): tick chậm **49/938 = 5,22%**;
  longtask trung bình/run **21.605 ms** (n=155); gap trung bình/run
  **18.731 ms** (n=91).
- Tick chậm: **−19,3%** (tỉ số 0,807; 95% CI 0,552–1,180, chứa 1,0) —
  KHÔNG đạt bar −25%. Longtask trung bình/run: **−0,9%** — KHÔNG đạt bar
  −20%. Cần CẢ HAI bar mới giữ "GIÚP" → **không giữ được**. Gap tệ hơn
  +12,5%. Không phải HẠI (không chỉ số nào vượt ngưỡng hại §3; pageErrs 0
  mọi run; skipped B chỉ +1,7 điểm so với A).
- Pháp y cũng không ủng hộ patch: S_store trung vị các run B (0,606 /
  0,508) không thấp hơn các run A (0,273 / 0,512); tỉ lệ tick chậm
  zero-draw A 22,4% vs B 20,4% — gần như nhau. Hiệu ứng cơ chế mà patch
  nhắm tới (bỏ lần đọc video đầu trên tick nóng) không xuất hiện trong số
  đo.
- Tải hai chân CÂN BẰNG theo PSI (đuôi avg60 trung bình A 79,4% vs B
  77,4%; trung vị cả run A ~71% vs B ~71%) — verdict không bị confound
  bởi tải. Ngược lại, load1 nói ngược hoàn toàn (A 6,50 vs B 1,34) dù
  cùng hog N=4 và cùng PSI — thêm một bằng chứng trực tiếp load1 vô hiệu.
- **Hệ quả đã thực hiện:** `patch --batch -R -p1` lúc 12:02:56Z, verify
  md5 preview.tsx = `03bf029f09b8890b285eacc10a02172b`; `tsc + vite build`
  trên cây baseline PASS (rc=0, 7,33 s, 12:03:29Z). File h3f.patch được
  GIỮ NGUYÊN — apply lại chỉ cần
  `patch -p1 < hidden_files/round118-t2/h3f.patch` + verify md5 5be5a250.
- **Cảnh báo cho T10/parent (§5):** lúc gỡ (12:02:56Z) các luồng T1/T2/T4/
  T5/T9 vẫn đang chạy (chỉ T6/T7/T8 đã xong). Mọi phép đo của họ chạy SAU
  thời điểm này đều trên cây BASELINE, không còn H3f. T10 phải ghi rõ điều
  này khi đóng đợt (đặc biệt T1 E4 lượt 3, T2 E4 lượt 4 và T4 leg B — cả ba
  đều đo trên preview.tsx).

## 1. Kết quả đầy đủ — 5 run cùng boot 3fe7e89e, xen kẽ ABAB

| Run | Chân (md5) | Tick chậm (n/tổng, tỉ lệ) | Longtask ≥200ms (n / tổng ms) | Gap >300ms (n / tổng ms) | loopMs p50/p90/max | load1 med | draws/s | preMs med / renderMs med | skipped | PSI tail avg60 |
|---|---|---|---|---|---|---|---|---|---|---|
| W (warm-up, bỏ) | H3f 5be5a250 | 37/409, 9,0% | 117 / 31.458 | 71 / 27.983 | 27,1 / 99,1 / 519,0 | 5,17 | 9,2 | 82,6 / 21,5 | 47/388 (12,1%) | 79,0% |
| A1 | base 03bf029f | 42/433, 9,7% | 108 / 29.014 | 62 / 24.914 | 22,5 / 99,4 / 481,4 | 6,61 | 9,9 | 78,0 / 18,9 | 62/417 (14,9%) | 83,3% |
| B1 | H3f 5be5a250 | 32/435, 7,4% | 94 / 26.836 | 54 / 23.839 | 25,4 / 96,7 / 1169,3 | 1,55 | 9,5 | 72,0 / 21,6 | 62/423 (14,7%) | 80,5% |
| A2 | base 03bf029f | 16/463, 3,5% | 59 / 14.584 | 23 / 8.385 | 20,1 / 88,4 / 391,2 | 6,38 | 12,3 | 38,3 / 17,5 | 48/469 (10,2%) | 75,5% |
| B2 | H3f 5be5a250 | 17/503, 3,4% | 61 / 16.373 | 37 / 13.623 | 18,8 / 90,8 / 1485,5 | 1,12 | 11,1 | 33,9 / 16,1 | 69/506 (13,6%) | 74,2% |

Tất cả run: probe exit=0, pageErrs=0, cùng boot `3fe7e89e` trong suốt run,
md5 đúng chân trước/sau, cây trả về H3f sau mỗi run A (RESTORE log) —
**hợp lệ theo prereg §2**. Không run nào retry (probe exit=0 ngay lần đầu
cả 5 run). Lock giữ mỗi run 138–236 s, không quá 400 s. Không reboot giữa
chừng (boot trước = sau mọi run).

### 1.1 So sánh gộp (tỉ lệ + trung bình/run — cách đúng, theo prereg §3)

| So sánh B vs A | Tick chậm (tỉ lệ, thay đổi) | 95% CI tỉ số | Longtask TB/run | Gap TB/run |
|---|---|---|---|---|
| **B gộp vs A gộp — CHÍNH** | 5,22% vs 6,47% → **−19,3%** (bar −25%: KHÔNG ĐẠT) | 0,552–1,180 | 21.605 vs 21.799 → **−0,9%** (bar −20%: KHÔNG ĐẠT) | 18.731 vs 16.650 → **+12,5%** |
| Cặp 1 (A1 vs B1) | 7,36% vs 9,70% → −24,1% | — | 26.836 vs 29.014 → −7,5% | 23.839 vs 24.914 → −4,3% |
| Cặp 2 (A2 vs B2) | 3,38% vs 3,46% → −2,3% | — | 16.373 vs 14.584 → +12,3% | 13.623 vs 8.385 → +62,5% |

Đọc: cặp 1 có vẻ ủng hộ B (sát bar tick chậm), cặp 2 gần như bằng nhau
(tick chậm −2,3%, longtask TỆ hơn +12,3%). Gộp cả hai cặp, hiệu ứng ròng
nhỏ và không đạt bar nào. Đây chính là điều thiết kế xen kẽ ABAB sinh ra
để bắt: một cặp đơn (như đợt 119, n=1 mỗi chân) có thể cho −53,7% chỉ vì
rút thăm thuận lợi; hai cặp xen kẽ cho thấy hiệu ứng thực (nếu có) nhỏ hơn
nhiều so với bar.

### 1.2 Điều kiện hiệu lực (prereg §2, áp cho mỗi chân gộp)

Chân A: longtask n=167 ≥ 50 ✓, gap n=85 ≥ 20 ✓, tick chậm n=58 ≥ 30 ✓.
Chân B: longtask n=155 ≥ 50 ✓, gap n=91 ≥ 20 ✓, tick chậm n=49 ≥ 30 ✓.
Cả hai chân ĐẠT hiệu lực — không cần run bù A3/B3 (luật dừng §2: không
chạy thêm). Stall tái hiện rõ mọi run.

## 2. Pháp y cơ chế — không có tín hiệu H3f làm việc

| Run | S_store held-first (med, n) | S_first (med, n) | Zero-draw tick chậm | Second-draw med (n) |
|---|---|---|---|---|
| W (H3f) | 0,487 (21) | 0,443 (28) | 9/37 (24%) | 74,9 ms (14) |
| A1 (base) | 0,273 (25) | 0,273 (33) | 9/42 (21%) | 83,5 ms (14) |
| B1 (H3f) | 0,606 (18) | 0,508 (25) | 7/32 (22%) | 71,3 ms (13) |
| A2 (base) | 0,512 (9) | 0,502 (12) | 4/16 (25%) | 73,6 ms (9) |
| B2 (H3f) | 0,508 (12) | 0,613 (14) | 3/17 (18%) | 38,7 ms (6) |

- S_store trên chân B (0,606 / 0,508) KHÔNG thấp hơn chân A (0,273 /
  0,512) — lần đọc video đầu vào held canvas vẫn chiếm ~50% tick chậm dù
  có patch. Nếu patch bỏ được lần đọc này trên tick nóng, S_store chân B
  phải giảm rõ; nó không giảm.
- Tỉ lệ tick chậm zero-draw: A gộp 13/58 = 22,4%, B gộp 10/49 = 20,4% —
  gần như nhau; trần 119 §3 (tick không đọc video thì patch không sửa
  được) không giải thích được sự vắng mặt của hiệu ứng, vì ~80% tick chậm
  CÓ đọc video mà patch vẫn không cải thiện chúng.
- Lưu ý: n pháp y mỗi run nhỏ (9–25), trung vị S_store dao động 0,273–
  0,606 ngay trong cùng chân A — đây là bằng chứng phụ, không phải verdict
  chính. Verdict chính đứng trên §1.1.

## 3. Tải — PSI cân bằng hai chân, load1 nói ngược (bằng chứng trực tiếp)

- PSI cpu.some avg60: lúc bắt đầu run 12,08–50,61% (avg60 còn chứa thời
  gian idle trước khi bật hog — ramp lên trong run, như kỳ vọng); trung vị
  cả run 66,8–75,2%; đuôi 30 s cuối (đã hội tụ, theo cách tính của T2
  pilot) W 79,0% · A1 83,3% · B1 80,5% · A2 75,5% · B2 74,2%.
  Trung bình đuôi: chân A 79,4%, chân B 77,4% — chênh 2 điểm, cùng dải
  Vừa–Nặng theo DEF v0.1 (Vừa 30–80%, Nặng >80%). KHÔNG có lệch band hệ
  thống giữa hai chân → không cần caveat confound tải (prereg §1).
- load1 med (trong probe): A1 6,61 · A2 6,38 (TB 6,50) vs B1 1,55 · B2 1,12
  (TB 1,34) — chênh 4,9× giữa hai chân DÙ cùng hog N=4, cùng PSI, cùng
  boot, xen kẽ nhau. Đây là bằng chứng trực tiếp mới rằng load1 không đo
  tải thật (nối tiếp phát hiện đợt 120 T2 + pilot PSI đợt 121 T2). Mọi
  kết luận trong file này dùng PSI, không dùng load1.
- Snapshot tải anh em trước mỗi run: hog python lạ = 0/4 run (không luồng
  nào chạy hog đồng thời — lock serialize đúng như thiết kế); vite lạ = 0
  (trừ 1 tiến trình vite lúc W/A1, không rõ nguồn, đã ghi log — không ảnh
  hưởng vì W là warm-up và A1 vẫn trong dải số chung); node-probe lạ = 0.
  Replay apt của T5 vẫn chạy nền trong suốt đợt (POSTBOOT_FAIL 11:37Z,
  wrapper pid 834) — tải nền chung cho cả hai chân, xen kẽ ABAB cân bằng
  nó.

## 4. Nhiễu giữa các run — vẫn còn, nhưng nhỏ hơn đợt 121 và đã được thiết kế bắt

- Tick chậm mỗi run: W 37 · A1 42 · B1 32 · A2 16 · B2 17. Trong chân A:
  42 vs 16 (gấp 2,6×); trong chân B: 32 vs 17 (gấp 1,9×). Nhiễu vẫn còn
  (cặp 2 yên hẳn so với cặp 1 ở CẢ hai chân — trôi dạt theo thời gian,
  không phải hiệu ứng chân), nhưng đã nhỏ hơn đợt 121 (19→133, gấp ~7×)
  và thiết kế xen kẽ đã cân bằng nó: cặp 1 và cặp 2 mỗi cặp đều có 1 A +
  1 B liền nhau, nên trôi dạt cặp 1→cặp 2 ảnh hưởng đều hai chân.
- Warm-up W (37) nằm trong dải cặp 1 (42/32) — hiệu ứng lạnh đầu-boot
  không còn rõ trên boot #64 này sau W (hoặc W đã hấp thụ nó, đúng mục
  đích prereg §1).

## 5. Gỡ patch — hành động đã thực hiện + cảnh báo cho đợt

- 12:02:56Z: `patch --batch -R -p1` với `hidden_files/round118-t2/h3f.patch`,
  verify md5 preview.tsx = `03bf029f09b8890b285eacc10a02172b` (đúng baseline).
  12:03:29Z: `npm run build` (tsc + vite build) trên cây baseline rc=0,
  built in 7,33 s — cây baseline build được, không hỏng do gỡ patch.
  Không sửa file nào khác. `media.ts` không đổi suốt đợt (2c384ed1).
- File patch GIỮ NGUYÊN tại `hidden_files/round118-t2/h3f.patch`.
  Apply lại (nếu parent/user quyết): `cd ~/workspace/repo-1 &&
  patch -p1 < ~/workspace/goals/capcut-clone-video-editor/hidden_files/round118-t2/h3f.patch`
  rồi verify md5 = 5be5a250a552357c50cc189de9a9c08a.
- **Cảnh báo:** lúc gỡ, T1 (E4 lượt 3), T2 (E4 lượt 4), T4 (leg B), T5, T9
  vẫn đang
  chạy (chỉ T6/T7/T8 có cờ .done). Mọi phép đo của họ SAU 12:02:56Z chạy
  trên cây baseline. T10 khi đóng đợt PHẢI ghi rõ cây đã đổi giữa đợt
  (preview.tsx 5be5a250 → 03bf029f lúc 12:02:56Z) và kiểm tra từng luồng
  đo sau mốc này có bị ảnh hưởng không — đặc biệt T1 E4 lượt 3, T2 E4 lượt 4
  và T4 leg B (đo startup trên preview.tsx). Đây là hệ quả
  trực tiếp của quyết parent "TRUNG TÍNH → GỠ", không phải lỗi vận hành
  của luồng này; prereg §4 đã đăng ký trước hành động này.

## 6. Phương pháp (y hệt đợt 119/121, trừ điểm ghi ở prereg-t3 §1)

- Probe: bản copy `apps/web/scripts/probe122t3-h3f-ab.mjs` từ
  `probe121t8-h3fext-ab.mjs` — diff đúng 3 dòng (header, SCRATCH, CFG_DIR
  round121-t8 → round122-t3); `node --check` OK. Không đổi logic đo. Spec:
  `--engine chromium --config scroll-mixed-alt --nclips 24 --freeze-run
  --sysload 0`, stripes-scroll.mp4 1280×720, 24 clip × 3 s, hog cố định
  N=4, lock v2-only port 5590.
- Driver `hidden_files/round122-t3/run-t3.sh` (copy run-t8.sh + leg A|B|W
  + đổi cây bằng patch trong lock + sampler PSI 10 s/mẫu). Lock copy đóng
  băng md5 `cd0c05c1` (= production). Chạy detached (nohup). Giữ lock mỗi
  run 138–236 s. Lock trống khi xong; cooldown 15 s giữa các run.
- Đổi chân: A = `patch --batch -R` (verify 03bf029f) TRONG lock, trả lại
  H3f (`patch --batch`, verify 5be5a250) TRƯỚC khi release lock (trap +
  restore cuối driver). Kiểm tra sẵn sàng trước khi đo: vòng patch đi-về
  11:41:51Z (5be5a250 → 03bf029f → 5be5a250, cả hai md5 đúng).
- Analyzer `analyze-t2-diag.py` + pháp y `diag-forensic.py` + `s-store.py`
  (copy đợt 121, không sửa). Creator-tag vẫn hỏng như đợt 118–121 nên dùng
  pháp y — xem §2.
- Cây: preview.tsx md5 `5be5a250…` trước mọi run B/W, `03bf029f…` trong mọi
  run A, trả về `5be5a250…` sau mỗi run A; `media.ts` `2c384ed1…` không đổi.
  Sau gỡ patch: cây ở `03bf029f…` (có chủ đích, §5). Lock script md5 sau
  mỗi run = cd0c05c1 (không đổi).
- W: lock 11:41:58Z, xong 11:44:49Z. A1: lock 11:45:30Z, xong 11:48:22Z.
  B1: lock 11:49:40Z, xong 11:53:15Z. A2: lock 11:53:41Z, xong 11:55:56Z.
  B2: lock 11:57:44Z, xong 12:01:38Z. Không run nào retry.

## 7. Nợ mở / đề xuất cho đợt sau

1. **H3f ĐÃ GỠ — không còn nợ A/B H3f.** Nếu user/parent muốn thử lại
   patch với thiết kế khác (vd bộ đếm skip `window.__h3fStats` — nợ từ
   đợt 119 §7, vẫn chưa làm), đó là quyết mới, không phải tiếp nối A/B
   này. Dữ liệu này (cùng boot, xen kẽ, PSI cân bằng) là bằng chứng mạnh
   nhất tới nay rằng H3f không giúp trên protocol này.
2. **Cây hiện ở baseline 03bf029f — T10/PHẢI ghi nhận khi đóng đợt 122**
  (xem §5). Các batch đã stage trước 12:02:56Z đo trên cây H3f; các batch
  sau mốc này (nếu có) đo trên baseline. Đừng gộp nhầm.
3. **load1 lại nói ngược (§3)** — các luồng sau tiếp tục dùng PSI
   (DEF v0.1) làm trục tải, không dùng load1 để hiệu chỉnh hay loại run.
4. `creatorFromStack` trong probe vẫn hỏng (nợ T2 đợt 118 §8 mục 2).
   Driver retry không bật lại hogs (nợ cũ). ci-security.yml vẫn 403 chờ
   user. TTS 39 cấm kiểm lại. Birefnet chỉ thử lại khi RAM đổi (u2net là
   fallback chính thức).

## 8. Những gì KHÔNG làm trong luồng này

- KHÔNG push, KHÔNG release/tag. KHÔNG sửa production ngoài đổi cây
  A/B đã đăng ký + gỡ patch theo quyết parent (§5). KHÔNG kiểm lại TTS 39.
  KHÔNG thử birefnet. KHÔNG loại run xấu khỏi số gộp (W bỏ theo prereg
  vì là warm-up, không phải vì số xấu). KHÔNG chạy run bù A3/B3 (cả hai
  chân đã đủ n≥30). KHÔNG đo thêm run ngoài luật dừng prereg §2.

## 9. File liên quan

- Prereg: `hidden_files/round122-t3/prereg-t3.md`
- Probe: `apps/web/scripts/probe122t3-h3f-ab.mjs` (75.292 B — oversize,
  cần `ENABLE_PRIVSEP=0` khi push; cùng mẫu đợt 119/121)
- Driver/analyzer/pháp y/S-store/lock copy: `hidden_files/round122-t3/
  run-t3.sh`, `analyze-t2-diag.py`, `diag-forensic.py`, `s-store.py`,
  `vcut-vite-lock-v2.sh` (md5 cd0c05c1)
- Dữ liệu thô (KHÔNG stage, ~130 MB): `hidden_files/round122-t3/
  chr-mixedalt-h3f-{W,A1,B1,A2,B2}-fr4/` (results.json + drains +
  analysis/forensic/sstore/load.tsv/psi.tsv) + `driver-t3.log`
- LIMITS: `docs/PHASE9_ROUND122_T3_H3F_AB_LIMITS.md` (file này)
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round122-t3-h3f-ab.txt`
  (NUL-delimited; chỉ LIMITS + probe copy)
- Cờ: `hidden_files/round122-t3.done`

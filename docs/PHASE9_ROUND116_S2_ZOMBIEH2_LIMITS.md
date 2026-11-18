# Phase 9 — Đợt 116, luồng S2: Zombie hướng sửa H2 — giới hạn tần suất capture + chốt attribution longtask (VERDICT: BỎ)

> **Kết quả gọn:** Đã thử H2 — giới hạn tần suất capture motion-blur ở tối đa
> 1 capture/250 ms/clip, đồng hồ chung cho cả đường pump (rVFC) lẫn đường
> tick. **KHÔNG giữ.** Throttle ràng thật (captures −86%, 190 lần
> rate-limited ở cặp mini sạch) nhưng capMs median KHÔNG đổi (+2,1%, bar
> −40%) và không đo được longtask ≥200 ms nào để giảm (0/0 ở cặp mini sạch)
> — đúng như cảnh báo trước ở prereg-s2 §3.1: bar (b) không khớp cơ chế H2.
> Cặp A/B 24-clip chính BỊ NHIỄM (holder 2 lượt đi ngược nhau: baseline
> xả hog 4→0, fix tăng hog 4→8; fix chạy ở 9 draws/s, tick 200 ms) nên
> KHÔNG dùng để quyết — cặp mini 6-clip không-hog, cùng chế độ tải, là
> bằng chứng quyết định. **Thu hoạch chính của luồng này không phải H2 mà
> là attribution: LoAF chốt được nửa longtask chưa rõ nguồn — đó là hàm
> `loop` của chính preview.tsx (rAF), KHÔNG phải GC** (100% longtask lớn
> không khớp pump có LoAF chồng lấn; script `loop` chiếm áp đảo; phần dư
> không giải thích được chỉ 0,04 ở lượt nhanh). Cây đã revert về đúng
> 03bf029f; fix giữ lại dạng patch để parent quyết.

## 0. Bối cảnh và nhiệm vụ

- Đợt 114 Q2 tìm được cơ chế freeze ở chuyển clip: cổng bỏ vẽ E4+N3 ở mọi
  biên + main-thread stall (longtask đơn 200–800 ms; ~1/2 khớp pump capture,
  nửa còn lại chưa rõ — nghi GC). Đợt 115 R2 thử H1 (cap snapshot 1280×720
  → 640×360) và BỎ: capMs median chỉ −13,7% (bar −40%), longtask khớp
  pump/giây TĂNG 65% (bar −20%); giả thuyết "chi phí pixel drawImage là nút
  cổ chai" bị bác.
- Nhiệm vụ đợt 116 S2 (nợ #2 đợt 115; tiếp nối R2 verdict BỎ + Q2): (1) thử
  H2 — giới hạn tần suất capture (giảm SỐ LẦN kích hoạt chi phí hạ nguồn
  thay vì kích thước mỗi lần); (2) chốt attribution nửa longtask chưa rõ
  nguồn bằng Long Animation Frame API và/hoặc Chrome tracing.
- Prereg viết TRƯỚC khi sửa: `hidden_files/round116-s2/prereg-s2.md`
  (H2 + tham số 250 ms + bar Y HỆT R2 + luật LAI + kế hoạch LoAF + phối hợp
  cây). Tôi là luồng DUY NHẤT được sửa production trong đợt 116.
- **Chốt chặn round-in-progress.md — CỜ CŨ, đã xóa theo đúng chỉ dẫn trong
  nó:** file tồn tại lúc tôi bắt đầu (tạo 20:42:13Z 14/11, "main chat đang
  hoàn tất R10 verify đợt 115; xóa khi parent verify xong và đã báo cáo").
  Điều kiện xóa ĐÃ THỎA: parent lượt cron 03:35 +07 15/11 đã gộp muộn R10
  xong (9/9 verify, cây xanh 27/27) và báo cáo trong build-loop-log, rồi mở
  đợt 116 (10 luồng S1–S10) và spawn chính tôi; các luồng anh em đã làm việc
  từ 21:03–21:06Z (S5 có probe + run-s5.sh, S7 có prereg-s7.md, S8 có
  postboot log). Tôi đã xóa file và ghi lý do vào prereg-s2 §0. Nếu parent
  main-chat vẫn đang verify (trái với log), việc xóa này cần kiểm lại.

## 1. Tham số H2 — chọn từ dữ liệu thô, không chọn mò

- Tính lại từ dữ liệu thô R2-baseline (n=118 khoảng giữa 2 capture liên
  tiếp): median 225 ms, p25 113 ms, p75 418 ms; <66 ms: 1%, <100 ms: 8%,
  <150 ms: 29%, <250 ms: 52%, <333 ms: 65%. (Fix run R2: median 202 ms,
  <250 ms: 61%.)
- → Mốc 66 ms trong prereg-R2 §1 chỉ ràng ~1% số capture — KHÔNG PHẢI một
  phép thử của giả thuyết tần suất. **Mốc chọn: 250 ms** (tối đa 4
  capture/s/clip; kỳ vọng cắt ~40–50% số capture). Ring 3 snapshot nay
  trải ~750 ms video thay vì ~450–675 ms — ghost thưa hơn, suite
  ghostBlend 15/15 sẽ phán.

## 2. Fix đã thử (H2 — throttle capture 250 ms/clip, đồng hồ chung 2 đường)

- `apps/web/src/preview.tsx` (+54 dòng net, md5 sau sửa
  `9b724e693a1b2a9df757f1fef7100741`; diff kiểm: chỉ thêm, 0 dòng xóa/sửa
  ngoài 1 literal khởi tạo debug state):
  - Thêm `MOTION_BLUR_CAPTURE_MIN_INTERVAL_MS = 250` +
    `motionBlurLastCaptureMs: Map<clipId, number>` (đồng hồ chung) +
    helper `motionBlurCaptureThrottled()` / `motionBlurNoteCapture()`.
  - Đường pump `rvfcCaptureFrame`: sau check duplicate, SAU nhánh
    reset-capture (reset vẫn xoá ring ngay, tránh bóng cũ sau seek) — nếu
    chưa đủ 250 ms thì trả decision mới `"rate-limited"`, đếm
    `dbg.rvfcRateLimited++`, KHÔNG đụng ring, KHÔNG cập nhật
    `motionBlurLastFrameIndex` (frame được thử lại ở callback sau).
  - Đường tick `updateMotionBlurSnapshots`: cùng đồng hồ chung, cùng mốc
    250 ms — sau nhánh xoá ring khi nhảy lùi, TRƯỚC khi cập nhật
    lastFrameIndex (frame được thử lại ở tick sau); đường không gate theo
    frame (frameIndex < 0) cũng throttle. Đếm `tickRateLimited`.
  - Khi capture thành công (cả 2 đường): ghi vào đồng hồ chung.
  - Thêm 2 field `rvfcRateLimited` / `tickRateLimited` vào
    `MotionBlurDebugState` + cả 2 literal khởi tạo.
  - KHÔNG đụng: skip-gate E4 (diff kiểm 0 dòng combineSkipRender/
    skipRenderSeeking/driftConfirm), pump lifecycle/kill, F3 tap, blend
    plan/weights, mask, seek, decode, snapshot cap (H1 đã bỏ).
- Vì sao phải chặn CẢ 2 đường: 2 đường chia sẻ `motionBlurLastFrameIndex`
  (đường nào capture frame trước thì đường kia thấy duplicate và bỏ qua).
  Chỉ chặn pump thì đường tick sẽ capture bù đúng các frame pump bỏ —
  tổng số drawImage không giảm, phép thử vô hiệu. (Thực tế đường tick chỉ
  chạy khi pump không sở hữu snapshot — `!snapshotsViaRvfc` — nên 2 đường
  loại trừ nhau theo từng tick; đồng hồ chung có ý nghĩa ở lúc chuyển giao
  pump↔tick.)
- Patch của fix (đã revert khỏi cây): `hidden_files/round116-s2/
  s2-throttle-250ms.patch` (114 dòng, unified diff) + bản sao đầy đủ
  `preview.tsx.fix-9b724e69` (md5 9b724e69) và `preview.tsx.baseline-03bf029f`.

## 3. Phương pháp đo A/B

- Probe copy probe115r2 → `apps/web/scripts/probe116s2-frame-parity.mjs`
  (diff kiểm: chỉ đổi SCRATCH/CFG_DIR/tên driver global + thêm LoAF
  observer, xem §6; `node --check` OK). Driver copy run-r2.sh →
  `hidden_files/round116-s2/run-s2.sh` (đổi sang **lock v2 DUY NHẤT**,
  `VITE_LOCK_AGING_S=600`, thread s2, + sampler tải nền ghi load1/load5/
  load15 mỗi 10 s vào `<tag>-load.tsv` phục vụ luật LAI). Holder copy
  load-holder-r2.sh → load-holder-s2.sh. Analyzer mới
  `hidden_files/round116-s2/analyze-s2.py` (kế thừa analyze-r2.py +
  rate-limited + captures/giây + load5/load1 median từ load.tsv + phân rã
  LoAF + luật LAI + verdict; smoke-test trên dữ liệu thô R2 tái hiện đúng
  bảng A/B R2: capMs −13,7%, pump-match +65,1%/giây).
- 2 lượt chính cùng spec: `--engine chromium --config scroll-mixed-alt
  --nclips 24 --freeze-run --sysload 0`, 4 hog python, dải load5 [3,8]:
  - **BASELINE** `chr-mixedalt-s2base-fr4`, cây 03bf029f, boot #48.
  - **FIX** `chr-mixedalt-s2fix-fr4`, cây 9b724e69, boot #48.
  - Chạy LIỀN NHAU (baseline xong 21:20:19Z → fix bắt đầu 21:20:35Z).
- **Cặp mini đối chứng** (sau khi cặp chính bị nhiễm — xem §4): cùng spec
  nhưng `--nclips 6`, KHÔNG holder (0 hog), chạy trực tiếp qua
  `run-attempt` lock v2 (mỗi lượt ~54 s):
  - **MINI-BASELINE** `chr-mixedalt-s2base6-fr4`, cây 03bf029f.
  - **MINI-FIX** `chr-mixedalt-s2fix6-fr4`, cây 9b724e69.
- **Reboot #48 = 2026-11-14 19:43:46Z** (uptime -s trực tiếp; boot_id
  `0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0`). Không reboot nào xảy ra trong lúc
  S2 đo (cả 4 lượt cùng boot #48). Reboot kế dự kiến ~21:43Z — không cắt
  lượt nào của S2.

## 4. Cặp A/B 24-clip chính — BỊ NHIỄM, không dùng để quyết

| Chỉ số | BASELINE (03bf029f) | FIX (9b724e69) | Δ |
|---|---|---|---|
| load5 median (load.tsv) | 4,9 | 3,9 | −20% |
| load1 median (load.tsv) | 7,03 | 1,98 | −72% |
| load5 lúc phát (band) | 4,55 | 4,29 | — |
| draws/s | 59,8 | 9,3 | −84% |
| draws-gap >300 ms | 0 | 37 (max 887 ms) | — |
| tick spacing median | 17 ms | 200 ms | +1077% |
| tick skipped | 72 | 55 | — |
| pump invokes | 659 | 144 | −78% |
| captures | 606 | 82 | −86% |
| rate-limited | 0 | 34 | — |
| **capMs median** | **4,8 ms** | **74,3 ms** | **+1448%** |
| capMs p90 | 16,1 | 97,0 | +503% |
| longtask ≥200 ms (n) | 8 | 117 | +1363% |
| longtask ≥200 ms tổng | 2.473 ms | 33.394 ms | +1250% |
| **longtask khớp pump (13 ms) / giây phát** | **17,3 ms/s** | **205,3 ms/s** | **+1087%** |
| longtask KHÔNG khớp pump / giây phát | 14,7 ms/s | 208,1 ms/s | +1316% |
| seek median | 32,5 ms | 133 ms | +309% |
| L3 analysis | 0 draws-gap >300 ms; load5 median 4,87, 15/15 snap trong dải — TRONG DẢI | 37 draws-gap >300 ms, gate (b) dạng mạnh 6 gap; load5 median 3,75, 16/16 snap trong dải — TRONG DẢI | — |

- **Vì sao nhiễm:** holder 2 lượt đi NGƯỢC NHAU hoàn toàn. Baseline:
  load1 đọc CAO (8,47–8,69) → holder xả hog 4→0 trong lúc phát; draws/10s
  leo 178→941 khi hog rời đi. Fix: load1 đọc THẤP và GIẢM ĐƠN ĐIỆU
  4,60→0,79 (đường cong decay mượt, đúng dạng load1 khi nguồn tải biến
  mất) → holder tăng hog 4→8 trong lúc phát; draws/10s phẳng lì ~74–108
  ngay từ cửa sổ 10 s ĐẦU TIÊN (80) — chậm ngay từ đầu, không phải suy
  thoái giữa lượt. Hai lượt chạy ở 2 chế độ tải khác hẳn nhau (0 hog vs
  8 hog lúc phát trên cell 1,5 CPU) dù load5 cả hai đều "trong dải".
- **Luật LAI prereg-s2 §3.2 (chỉ dùng load5) nói "KHÔNG LAI"** (|4,9−3,9| =
  1,0 ≤ 2,0; cả hai trong [3,8]) — nhưng luật này KHÔNG bắt được trường hợp
  này: load1 median lệch −72% (7,03 vs 1,98) và draws/s lệch −84% cho thấy
  chế độ tải THỰC khác hẳn. **Tôi tuyên bố cặp chính LAI theo TINH THẦN
  của luật (cùng chế độ tải), dù không chạm ngưỡng load5 đã đăng ký — và
  ghi rõ đây là phán quyết ngoài chữ của luật, để parent kiểm lại.** Cặp
  chính KHÔNG dùng để quyết GIỮ/BỎ; mọi số của nó dưới đây chỉ dùng làm
  đối chứng nhiễm.
- **Nghịch lý load1 (ghi rõ, chưa giải thích được):** test đối chứng sau
  lượt đo (21:25Z, 4 hog busy-loop, máy yên): load1 ĐÁP ỨNG BÌNH THƯỜNG
  (2,11 → 6,25 sau 45 s). Vậy trong lúc fix chạy, 4→8 hog ĐÁNG LẼ phải đẩy
  load1 lên ~8–10, nhưng load1 lại decay mượt về 0,79. Các hog vẫn SỐNG
  lúc dọn (5 thông báo "Killed" lúc cleanup) nhưng dường như không đốt
  CPU. Giả thuyết chưa kiểm chứng: khi cell chạm trần CPU quota (1,5 CPU)
  với quá nhiều tiến trình bận, các task bị throttle khỏi runqueue nên
  không còn được đếm vào loadavg — loadavg rơi trong khi tiến trình đói.
  Test hog 4-tiến-trình không tái hiện được (chưa đủ tải để chạm trần).
  Đây là nợ đo, không phải kết luận. S5 (luồng anh em) chỉ poll gate trong
  cửa sổ này (không chạy probe nặng) nên không phải nguồn nhiễm từ S5;
  RAMavail 363–511 MB lúc baseline, 2.440 MB lúc fix — RAM không giải
  thích được fix chậm hơn.
- **Fix KHÔNG THỂ gây ra sụp đổ này theo cơ chế:** throttle chỉ BỚT việc
  (bỏ drawImage capture) và thêm ~0 công việc (1 Map.get + performance.now
  mỗi callback); đường tick không chạy khi pump sở hữu snapshot; không có
  đường blend nào đắt hơn khi ring thưa (ring rỗng → vẽ trực tiếp, rẻ
  hơn). Tick 200 ms + drawImage 74 ms là chữ ký của đói CPU hệ thống,
  không phải của code throttle. Cặp mini §5 xác nhận điều này.

## 5. Cặp mini 6-clip (0 hog, cùng chế độ tải) — BẰNG CHỨNG QUYẾT ĐỊNH

| Chỉ số | MINI-BASE (03bf029f) | MINI-FIX (9b724e69) | Δ | Bar prereg §3 |
|---|---|---|---|---|
| load lúc phát (load1/load5) | 3,19 / 3,15 | 2,85 / 3,15 | load5 bằng nhau | — |
| draws/s | 94,0 | 80,9 | −13,9% | ≥ −10% ✗ (xem chú thích) |
| draws-gap >300 ms | 0 | 0 | — | — |
| tick spacing median | 17 ms | 17 ms | 0% | ≤ +10% ✓ |
| tick skipped | 14 | 10 | −29% | — |
| pump invokes | 242 | 232 | −4,1% | — |
| captures | 238 | 33 | −86,1% | (chẩn đoán H2) |
| rate-limited | 0 | 190 | — | throttle ràng thật ✓ |
| captures / giây phát | 12,8 | 1,79 | −86,0% | — |
| **capMs median** | **4,8 ms** | **4,9 ms** | **+2,1%** | **≤ −40% ✗** |
| capMs p90 | 11,9 | 11,6 | −2,5% | — |
| capMs max | 45,6 | 49,4 | +8,3% | — |
| longtask ≥200 ms (n) | 0 | 0 | — | — |
| longtask tổng | 2.409 ms | 2.640 ms | +9,6% | — |
| **longtask khớp pump / giây phát** | **0,0 ms/s** | **0,0 ms/s** | — | **≤ −20%: KHÔNG ĐÁNH GIÁ ĐƯỢC** |
| seek median | 17 ms | 6 ms | −65% (nhanh hơn) | ✓ |
| LoAF entries | 13 | 20 | — | — |

- **Chú thích draws/s −13,9%:** KHÔNG phải render chậm đi — tick spacing
  giữ nguyên 17 ms, tick skipped GIẢM (14→10), seek NHANH hơn. "draws"
  của probe đếm MỌI drawImage video bất kể đích (kể cả drawImage capture
  vào snapshot). Captures pump giảm 205 (238→33) ≈ đúng phần lớn mức giảm
  draws (1.748→1.491 = 257); ~52 còn lại phù hợp với captures đường tick
  bị cắt (đường tick cũng throttle — NHƯNG: tickRateLimited KHÔNG được
  probe export — xem §8 nợ đo — nên phần này là suy luận, không phải số
  đo trực tiếp). Kết luận: vòng render khỏe như cũ; draws/s thấp hơn là
  hệ quả cơ học của việc ít capture drawImage hơn, không phải hồi quy
  render.
- **(b) KHÔNG ĐẠT một cách sạch sẽ:** capMs median +2,1% ở cặp mini
  (cùng tải, 0 hog) — đúng như cảnh báo prereg-s2 §3.1: H2 thay đổi SỐ LẦN
  capture, không thay đổi chi phí mỗi lần drawImage, nên capMs median kỳ
  vọng ~không đổi. Bar (b) −40% là bar của H1, không khớp cơ chế H2.
- **(a) KHÔNG ĐÁNH GIÁ ĐƯỢC ở cặp mini:** không có longtask ≥200 ms nào
  ở cả 2 lượt (máy nhanh, tải nhẹ) nên matched ms/giây = 0/0. Ở cặp chính
  thì (a) là +1087% nhưng cặp đó nhiễm (xem §4). Tóm lại: KHÔNG có bằng
  chứng nào cho thấy H2 giảm stall; cũng không có cặp sạch nào có stall
  để đo. Verdict BỎ không dựa vào (a) mà dựa vào (b) + nguyên tắc prereg
  (GIỮ đòi (a) VÀ (b) cùng đúng).
- **H2 làm đúng việc nó được thiết kế để làm — nhưng việc đó không đủ:**
  throttle ràng thật (190 rate-limited, captures −86%), pump vẫn khỏe
  (invokes −4,1%), capMs mỗi lần không đổi, không hồi quy render. Chỉ là
  "ít capture hơn" không dịch thành "ít stall hơn" trong điều kiện đo
  được — và vì không có stall nào ở cặp sạch nên cũng không chứng minh
  được hướng ngược lại. Giả thuyết "mỗi capture kích hoạt chi phí hạ
  nguồn cố định" KHÔNG được xác nhận cũng KHÔNG bị bác bởi dữ liệu này.

## 6. Chốt attribution nửa longtask chưa rõ nguồn — LoAF (THÀNH CÔNG)

- Probe thêm `PerformanceObserver('long-animation-frame')` (feature-detect;
  Chromium 158.0.8127.18 hỗ trợ: `loafSupported: True` ở cả 4 lượt). Mỗi
  LoAF entry ghi: start, dur, scripts[] (invoker, invokerType, sourceURL,
  sourceFunctionName, dur), styleAndLayoutStart, renderStart. Analyzer
  phân rã mỗi longtask ≥200 ms theo các LoAF entry chồng lấn: scripts-tổng
  / style+layout / render / PHẦN DƯ.
- **Kết quả (cặp 24-clip; cặp mini không có longtask lớn để phân rã):**

| | BASELINE (8 big, 3 unmatched) | FIX (117 big, 62 unmatched) |
|---|---|---|
| LoAF chồng lấn | 3/3 (100%) | 62/62 (100%) |
| script-dominated (scripts ≥50% dur) | 3 | 54 |
| resid-dominated (phần dư ≥50%) | 0 | 0 |
| hỗn hợp | 0 | 8 |
| resid-share median | 0,04 | 0,30 |
| Top script | `loop` @ preview.tsx, invoker FrameRequestCallback: 949 ms (x4) + `loop` @ MixerMeter.tsx: 53 ms | `loop` @ preview.tsx, invoker FrameRequestCallback: **13.028 ms (x102)**; `VideoFrameRequestCallback` @ preview.tsx: 453 ms; `TimerHandler:setInterval`: 412 ms; `performWorkUntilDeadline` (React scheduler): 199 ms; `PerformanceObserverCallback`: 90 ms |

- **Phán quyết attribution: nửa longtask "chưa rõ nguồn" LÀ HÀM `loop`
  CỦA CHÍNH preview.tsx (rAF render loop) — KHÔNG phải GC.** Tiêu chí
  thành công prereg-s2 §5 (≥80% longtask lớn không khớp pump có LoAF phân
  rã + thành phần trội được nêu tên) ĐẠT: 100% (65/65) ở cả 2 lượt, thành
  phần trội nêu tên được (`loop`, preview.tsx).
  - Ở lượt nhanh (baseline): 3/3 unmatched là `loop`, phần dư chỉ 0,04 —
    gần như toàn bộ longtask là script `loop`, không còn chỗ cho GC.
  - Ở lượt đói CPU (fix, nhiễm): `loop` vẫn áp đảo (13.028 ms); phần dư
    median 0,30 (max 0,81) — GC/compositor nội bộ có thể chiếm một phần
    nhỏ trong chế độ đói, nhưng không phải thành phần trội; và chính
    `loop` bị kéo dài ra bởi đói CPU (mỗi vòng loop tốn 200 ms+ thời gian
    tường vì main thread chỉ được ~1/8 CPU).
- **Caveat:** LoAF gán nhãn theo hàm JS chứa công việc đồng bộ — `loop`
  bao gồm mọi thứ nó gọi (drawImage, getImageData, React work...), nên
  kết quả này nói "stall nằm trong công việc đồng bộ của render loop",
  KHÔNG nói "dòng nào trong loop chậm". Muốn tách tiếp phải profile trong
  loop (vd: đo từng thành phần draw/blend/mask trong tick — đã có
  recordTickCost) hoặc Chrome tracing với category `v8`/`disabled-by-
  default-v8.gc` để đo GC trực tiếp. GC major KHÔNG bị bác hoàn toàn với
  tư cách thành phần PHỤ (phần dư 0,30 ở lượt đói), nhưng giả thuyết "GC
  là nguồn chính của nửa chưa rõ" thì BỊ BÁC.
- **Hệ quả cho hướng sửa sau:** vì stall nằm trong chính `loop` (và một
  phần nhỏ trong rVFC callback + timer + React scheduler), hướng sửa đáng
  thử tiếp theo KHÔNG phải throttle capture (H2 — đã thử, §5) mà là giảm
  chi phí đồng bộ TRONG loop (tách công việc nặng khỏi tick, đo recordTickCost
  để tìm thành phần con đắt nhất trong loop) — hoặc chấp nhận stall là giá
  của đói CPU và tập trung vào giảm tải hệ thống. Đây là đề xuất, không
  phải việc của luồng này.

## 7. Suite trên cây fix (md5 9b724e69) — XANH, không hồi quy

- Chạy qua lock v2 `run-attempt` (thread s2, giữ 40 s, nhả sạch):
  tsc web **0**; vite build **PASS** (9,20 s); ghostBlend.probe **15/15**
  (10 + 15 kiểm chứng xanh); driftConfirmSkip103E4 (E4) exit 0, fail 0
  (17 ✓ subtests theo spec reporter — R2 ghi "5/5" theo cách đếm case
  top-level; cùng file test, cùng kết quả); playheadHold90R2 **93
  passed**; playheadPacing54K9 **19 pass, 0 fail**; seekSkipRender86N3
  **9/9**; previewEngine 18 + 27 test passed; test-preview-engine.sh
  **354 assertions pass**. (Log: `hidden_files/round116-s2/suites-fix.log`.)
- Tiêu chí (c) prereg §3: ĐẠT trên cây fix (suite xanh; mini pair: tick
  spacing không đổi, seek nhanh hơn; draws/s −13,9% đã giải thích ở §5
  là hệ quả cơ học của ít capture drawImage hơn).

## 8. Phán quyết: BỎ (theo tiêu chí prereg §3, đăng ký TRƯỚC khi đo)

- **(b) KHÔNG ĐẠT:** capMs median +2,1% ở cặp mini sạch (bar ≤ −40%).
  Như đã cảnh báo trước ở prereg-s2 §3.1, bar này không khớp cơ chế H2 —
  nhưng verdict vẫn tuân theo bar đã đăng ký; tôi KHÔNG tự đổi bar giữa
  chừng, KHÔNG tự giữ fix trên bar khác.
- **(a) KHÔNG ĐẠT / KHÔNG ĐÁNH GIÁ ĐƯỢC:** 0/0 longtask lớn ở cặp mini
  sạch (không có stall để đo); +1087% ở cặp chính nhưng cặp đó nhiễm
  (holder đi ngược nhau, §4). Không có bằng chứng giảm stall.
- **(c) ĐẠT** (suite xanh, §7) nhưng không đủ để giữ: prereg yêu cầu
  (a) VÀ (b) cùng đúng.
- **Đã revert:** preview.tsx về đúng 03bf029f09b8890b285eacc10a02172b
  (md5 kiểm lại 21:31:05Z). Cờ cây = NO-CHANGE.
- **Ghi chú cho parent (quyết bar cho lần sau, không phải việc luồng này
  tự làm):** nếu vẫn muốn đánh H2, bar riêng cho H2 nên là: captures/giây
  ≤ −30% (mini pair đạt −86%) + longtask khớp pump/giây ≤ −20% ĐO Ở CHẾ
  ĐỘ CÓ STALL (cần tải đủ nặng để có longtask ≥200 ms — cặp mini 0-hog
  quá nhẹ nên không đo được (a); cặp 24-clip thì holder feedback làm lệch
  chế độ tải). Và phải khóa số hog CỐ ĐỊNH cho cả 2 lượt (không để holder
  feedback tự chỉnh — xem §9.1), nếu không LAI sẽ lặp lại.

## 9. Nợ mở và bài học vận hành

1. **Holder feedback là nguồn LAI mới (quan trọng nhất):** holder điều
   chỉnh số hog theo load1; khi load1 đọc lệch giữa 2 lượt (cao ở lượt
   này → xả; thấp ở lượt kia → tăng), 2 lượt chạy ở 2 chế độ hog khác
   hẳn (0 vs 8) dù load5 đều "trong dải". Luật LAI chỉ dùng load5 KHÔNG
   bắt được. Đề xuất đợt sau: khóa số hog CỐ ĐỊNH cho cả cặp A/B (vd 4
   hog suốt cả 2 lượt, holder chỉ giám sát, không chỉnh), hoặc mở rộng
   luật LAI sang load1 (vd |load1 median diff| > 2,0 → LAI) + draws/s
   (chênh >2× → LAI). R2 đã gặp biến thể của vấn đề này (R3 xen vào);
   lần này là holder tự gây ra.
2. **Nghịch lý load1 (chưa giải thích):** load1 decay mượt 4,60→0,79
   trong lúc hog tăng 4→8; test đối chứng sau đó cho thấy load1 đáp ứng
   bình thường với hog. Giả thuyết chưa kiểm: throttle CPU quota của cell
   làm task bị loại khỏi runqueue nên loadavg rơi. Cần 1 lượt đo chuyên
   (vd: đếm hog thật sự chạy bằng /proc/<pid>/stat utime trong lúc phát)
   nếu parent muốn chốt.
3. **Tick-path throttle counts không được export:** probe không đọc
   `rvfcRateLimited`/`tickRateLimited` từ `__vcutMotionBlurSnapshots`
   (snap100 chỉ đọc ring/lastFrame/caps/fb/...). Pump-path có 190
   rate-limited (mini-fix) nhưng tick-path thì không có số — phần draws
   còn lại ~52 ở §5 chỉ là suy luận. Đợt sau nếu đo throttle thì thêm 2
   field này vào snap100/dbgFinal.
4. **LoAF đã đủ để chốt attribution; không cần Chrome tracing cho câu
   hỏi này nữa** (100% coverage, thành phần trội nêu tên). Tracing chỉ
   cần nếu muốn tách thành phần con trong `loop` hoặc đo GC trực tiếp.
5. **H2 không cần thử lại với mốc khác:** mốc 250 ms đã ràng mạnh (−86%
   captures) mà capMs không đổi và không có stall để giảm ở tải nhẹ. Mốc
   lớn hơn (vd 500 ms) chỉ làm ghost thưa hơn, không đổi được capMs.
   Hướng sửa tiếp theo nên là chi phí TRONG `loop` (xem §6), không phải
   tần suất capture.
6. **Lock v2 hoạt động tốt:** acquire 0 s chờ ở cả 4 lượt đo + 1 suite
   run-attempt; release sạch; không BLOCKED; cooldown 15 s giữa 2 lượt
   liền nhau không gây chậm đáng kể (baseline nhả 21:20:19 → fix lấy
   21:20:35). Một `sleep 10` con của sampler tải nền còn sót lại sau khi
   driver fix thoát làm exec báo output-drain-timeout — vô hại (tự thoát
   sau ≤10 s), nhưng driver nên kill cả process group của sampler để
   sạch (nợ nhỏ).
7. **Cờ round-in-progress.md cũ đã xóa** (xem §0) — parent kiểm lại rằng
   không còn đợt main-chat nào đang chạy trước khi mở đợt 117.

## 10. File và dữ liệu

- LIMITS này: `docs/PHASE9_ROUND116_S2_ZOMBIEH2_LIMITS.md`
- Prereg: `hidden_files/round116-s2/prereg-s2.md`
- Probe (copy probe115r2 + LoAF): `apps/web/scripts/probe116s2-frame-parity.mjs`
  (64.284 byte — > 37.768 byte, cần `ENABLE_PRIVSEP=0` khi push)
- Driver/holder/analyzer: `hidden_files/round116-s2/run-s2.sh`,
  `load-holder-s2.sh`, `analyze-s2.py`, `run-suites-fix.sh`
- Patch fix (đã revert, giữ để parent quyết):
  `hidden_files/round116-s2/s2-throttle-250ms.patch` (114 dòng) +
  `preview.tsx.fix-9b724e69` + `preview.tsx.baseline-03bf029f`
- Dữ liệu thô (KHÔNG stage): `hidden_files/round116-s2/
  chr-mixedalt-s2base-fr4/` (results.json 102,5 MB, render-ticks.jsonl,
  worker-ticks.jsonl, cdp-samples.jsonl, analysis txt, load.tsv) và
  `chr-mixedalt-s2fix-fr4/` (results.json 23,8 MB, cùng bộ file);
  `chr-mixedalt-s2base6-fr4/` + `chr-mixedalt-s2fix6-fr4/` (cặp mini);
  `s2-ab-analysis.txt`, `s2-ab-mini-analysis.txt`, `suites-fix.log`,
  `driver-s2.log`, `holder-s2.log`
- Cờ: `hidden_files/round116-tree` (NO-CHANGE, md5 03bf029f);
  `hidden_files/round116-s2-done` khi xong
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round116-s2-zombieh2.txt`
  (NUL-delimited; LIMITS + probe; KHÔNG binary, KHÔNG workflow .yml)

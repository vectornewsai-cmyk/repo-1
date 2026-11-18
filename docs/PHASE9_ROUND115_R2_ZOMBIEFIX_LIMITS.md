# Phase 9 — Đợt 115, luồng R2: Zombie hướng sửa — cap snapshot pump (VERDICT: BỎ)

> **Kết quả gọn:** Đã thử hướng sửa "snapshot nhỏ hơn" (cap snapshot
> motion-blur 1280×720 → 640×360, 4× ít pixel, cả đường pump lẫn đường
> tick). **KHÔNG giữ.** capMs chỉ giảm 14% median / 10% p90 (bar −40%
> không đạt); longtask khớp pump tính trên mỗi giây phát TĂNG 65%
> (bar −20% không đạt); số gap giảm (36 → 11) giải thích được bằng
> chế độ tải đổi (baseline trượt dải load5 14,97 → fix trong dải 7,72),
> không quy được cho fix. Cơ chế "chi phí pixel của drawImage là nút
> cổ chai" **bị bác** trong điều kiện đo này — longtask 200–800 ms
> không nằm trong drawImage. Cây đã revert về đúng 03bf029f; fix giữ
> lại dạng patch để đợt sau quyết.

## 0. Bối cảnh và nhiệm vụ

- Đợt 114 Q2 tìm được cơ chế freeze ở chuyển clip: cổng bỏ vẽ E4+N3 ở
  mọi biên + main-thread stall (longtask đơn 200–800 ms; ~1/2 khớp
  pump capture invoke, nửa còn lại chưa rõ — nghi GC). Nhiệm vụ đợt
  115 R2: chuyển từ chẩn đoán sang HƯỚNG SỬA — đánh giá đưa capture
  của pump ra khỏi main thread / snapshot nhỏ hơn / giới hạn thời lượng
  capture.
- Prereg viết TRƯỚC khi sửa: `hidden_files/round115-r2/prereg-r2.md`
  (giả thuyết H1/H2/H3 + tiêu chí GIỮ/BỎ §3 + phối hợp cây).
- Tôi là luồng DUY NHẤT được sửa production trong đợt 115. Cờ cây
  `hidden_files/round115-r2-tree` = NO-CHANGE, md5
  03bf029f09b8890b285eacc10a02172b, tạo 18:27:43Z (trong deadline 90
  phút). R1 (E4) đang chờ cờ này để chạy lại tsc+test trên cây cuối
  rồi mới đo lượt đầu tiên.

## 1. Đọc lại dữ liệu Q2 trước khi sửa (tính lại từ dữ liệu thô)

- Snapshot pump là **1280×720** (probe 1280×720, clip KHÔNG mask →
  pump mode "letterbox" → snapshot = dw×dh; blend non-mask vẽ snapshot
  1:1 vào layer 1280×720). Ring giữ tối đa 3 snapshot/clip blur.
- **capMs (drawImage capture): R1 median 4,3 ms / p90 10,3 ms; R2
  (tải nặng) median 18,6 ms / p90 92,4 ms.** Con số "60–85 ms" trong
  LIMITS Q2 §3.5 là của P3, không phải Q2.
- **Longtask KHÔNG PHẢI task của chính callback pump:** tInvoke đo ở
  đầu callback; longtask start nằm SAU tInvoke 0–13 ms (task chứa
  callback phải start ≤ tInvoke). Cũng KHÔNG PHẢI task tick: 0/17 (R1)
  và 1/121 (R2) longtask ≥200 ms bắt đầu trong 5 ms của 1 tick start.
  CDP eval đã được Q2 loại trừ. Ứng viên còn lại: GC major bị capture
  kích hoạt, hoặc task nội bộ sau present — **chưa chứng minh**.
  Prereg đã ghi rõ điểm mù này TRƯỚC khi sửa.
- F3 tap chỉ đọc metadata (không drawImage); recordRvfcPump chỉ push
  object (rẻ); sampleStripeStrip là getImageData 48×1 (rẻ nhưng ép
  flush canvas sau drawImage — chưa đo riêng).

## 2. Fix đã thử (H1 — snapshot cap)

- `apps/web/src/preview.tsx` (+14 dòng net, md5 sau sửa
  `a419ae058a0db508c4be7ff5842b27a5`):
  - Thêm `MOTION_BLUR_SNAPSHOT_MAX_DIM = 640` +
    `motionBlurSnapshotCap(w, h)` (giữ tỉ lệ, cap chiều dài nhất 640).
  - Áp trong `rvfcCaptureFrame` (snapshot pump) và
    `updateMotionBlurSnapshots` (snapshot đường tick) để ring đồng nhất
    hình học. Letterbox 1280×720 → 640×360; mode "unit" đã ≤640×360
    nên không đổi.
  - KHÔNG đụng: skip-gate E4 (combineSkipRender/skipRenderSeeking —
    diff kiểm 0 dòng), pump lifecycle/kill, F3 tap, blend plan/weights,
    mask, seek, decode.
- H2 (giới hạn tần suất capture) và H3 (OffscreenCanvas trong worker)
  KHÔNG làm trong lượt này: H2 chỉ xem xét nếu H1 cho capMs giảm mà
  longtask không giảm; H3 bị bác cho lượt này vì video element không
  drawImage được từ worker, createImageBitmap round-trip phá ngữ nghĩa
  đồng bộ của ring (xem prereg §1).
- Patch của fix (đã revert khỏi cây): `hidden_files/round115-r2/
  r2-snapshot-cap.patch` (56 dòng, unified diff) — giữ để parent
  quyết đợt sau.

## 3. Phương pháp đo A/B

- Probe copy probe114q2 → `apps/web/scripts/probe115r2-frame-parity.mjs`
  (diff kiểm: chỉ đổi SCRATCH/CFG_DIR/tên driver global + comment;
  `node --check` OK). Driver/holder/lock copy từ Q2
  (`hidden_files/round115-r2/run-r2.sh`, `load-holder-r2.sh`,
  `vcut-vite-lock-frozen.sh` md5 fd21193c… đã kiểm). Analyzer mới
  `hidden_files/round115-r2/analyze-r2.py` (capMs + longtask khớp pump
  + gap + tick + seek, chuẩn hoá theo giây phát). Classifier tái dùng
  `round114-q2/classify-q2.py`; analyzer L3 tái dùng
  `round110-l3-analyze.py`.
- 2 lượt cùng spec: `--engine chromium --config scroll-mixed-alt
  --nclips 24 --freeze-run --sysload 0`, 4 hog python, dải mục tiêu
  load5 [3,8]:
  - **BASELINE** `chr-mixedalt-r2base-fr4`, cây 03bf029f, boot #47.
  - **FIX** `chr-mixedalt-r2fix-fr4`, cây a419ae05, boot #47.
- **Reboot #47 = 2026-11-14 17:45:50Z** (uptime -s trực tiếp; boot_id
  `5578af38-911d-4f3b-93b0-383a1664f225`), gap #46→#47 = 2h01'01"
  (trong dải chứng nhận [19'07", 3h14'08"], không phá sàn). Số #47
  vẫn tạm thời (mù #33 mở). Reboot xảy ra TRƯỚC khi driver baseline
  chạy (17:54:50Z) nên không giết lượt nào của R2; R1 xác nhận tsc+test
  của họ chạy xong trước reboot trên cùng cây 03bf029f.
- **Nhiễu tải lớn (caveat chính):** R3 (điểm gãy tải) chạy 40 hog node
  + probe 197 clip trong lúc baseline đo → baseline TRƯỢT DẢI
  (load5 median 12,89; 0/16 snap trong dải — LOẠI khỏi bar dạng mạnh
  theo luật Q2). Fix run chạy sau khi R3 xong, hog đã chết → TRONG
  DẢI (load5 median 7,72; 15/15 snap trong dải). **Hai lượt ở hai chế
  độ tải khác nhau** — so sánh gap-count trực tiếp bị nhiễu; verdict
  dựa vào chỉ số per-event (capMs, longtask khớp pump / giây phát)
  + đối chứng lịch sử Q2-R1 (trong dải) và Q2-R2 (load5 7,23 nhưng
  nhiễm tải đồng thời nặng).

## 4. Kết quả A/B

| Chỉ số | BASELINE (load5 14,97, trượt dải) | FIX (load5 7,83, trong dải) | Δ | Bar prereg §3 |
|---|---|---|---|---|
| draws/s | 11,3 | 15,6 | +38% | ≥ −10% ✓ (nhưng theo tải nhẹ hơn) |
| draws-gap >300 ms | 36 | 11 | −69% | — (nhiễu tải, không quy cho fix) |
| gap biên (max) | 10 (max 1301 ms) | 6 (max 430 ms) | — | — (nhiễu tải) |
| gap >1000 ms | 2 (1301, 1158) | 0 | — | — (nhiễu tải) |
| tick spacing median | 166 ms | 116 ms | −30% | ≤ +10% ✓ (theo tải) |
| tick skipped | 70 | 47 | −33% | — |
| captures | 119 | 156 | +31% | — (máy nhanh hơn → rVFC bắn dày hơn) |
| **capMs median** | **14,6 ms** | **12,6 ms** | **−13,7%** | **≤ −40% ✗** |
| **capMs p90** | **88,5 ms** | **79,7 ms** | **−9,9%** | — |
| capMs max | 270,8 ms | 161,5 ms | −40% | — |
| capMs ≥50 ms | 48/119 (40%) | 57/156 (37%) | — | — |
| longtask ≥200 ms (n) | 79 | 63 | −20% | — |
| longtask ≥200 ms tổng | 25.907 ms | 16.741 ms | −35% | — |
| longtask ≥200 ms / giây phát | 307,1 | 215,8 | −30% | — (theo tải) |
| **longtask khớp pump (13 ms) / giây phát** | **100,3 ms/s** | **165,6 ms/s** | **+65%** | **≤ −20% ✗** |
| longtask khớp pump (13 ms) n | 30 | 47 | +57% | — |
| longtask khớp pump median dur | 265 ms | 274 ms | +3% | — |
| seek median | 174 ms | 111 ms | −36% | (theo tải; không chậm hơn ✓) |
| seek max | 1779 ms | 209 ms | −88% | — |

- Đối chứng lịch sử cùng load5: Q2-R2 (load5 7,87, nhiễm tải đồng
  thời) capMs median 18,6 / p90 92,4; fix (load5 7,83) median 12,6 /
  p90 79,7 → median −32%, p90 −14% so với R2. Vẫn xa kỳ vọng ~4×
  của giả thuyết pixel.
- Classifier: baseline M1 0 / M2 23 / MIX 13 / UNK 0 (36 gap); fix
  M1 1 / M2 5 / MIX 5 / UNK 0 (11 gap). Boundary gap fix: 6, trong
  đó 1 gap M1 thuần (lần đầu có M1 thuần ở biên trong các lượt Q2/R2
  — n=1, nhiễu, không kết luận).
- Suite trên cây fix (md5 a419ae05, 18:05–18:09Z): tsc web 0,
  vite build PASS, ghostBlend.probe 15/15, driftConfirmSkip103E4
  5/5, playheadHold90R2 93 passed, playheadPacing54K9 19/19,
  seekSkipRender86N3 9/9, previewEngine 27 passed, seek 21 passed,
  test-preview-engine.sh 354 assertions pass — KHÔNG hồi quy nào.
  (Log: `hidden_files/round115-r2/suites-fix.log`.)

## 5. Phán quyết: BỎ (theo tiêu chí prereg §3, đăng ký TRƯỚC khi đo)

- **(b) KHÔNG ĐẠT:** capMs median chỉ −13,7% so với baseline (bar
  −40%); p90 chỉ −9,9%. So với đối chứng R2 cùng load5: median −32%,
  p90 −14% — vẫn xa 4×. Chi phí pixel của drawImage KHÔNG phải phần
  chi phối của capture dưới tải; capMs bị chi phối bởi tải/cạnh
  tranh hơn là số pixel.
- **(a) KHÔNG ĐẠT:** longtask khớp pump / giây phát TĂNG 65%
  (100,3 → 165,6 ms/s; bar −20%). Số longtask khớp pump tăng 30 →
  47 dù tổng longtask lớn giảm 79 → 63. Một phần tăng có thể là
  artifact cửa sổ đo (capture nhanh hơn → task kế sau callback bắt
  đầu sớm hơn, dễ rơi vào cửa sổ 13 ms hơn), nhưng dù trừ artifact
  này cũng KHÔNG có bằng chứng giảm stall nào. Tổng longtask lớn /
  giây phát giảm 30% theo đúng chiều tải nhẹ đi, không quy được cho
  fix.
- **Gap-count giảm (36 → 11, max 1301 → 430 ms) KHÔNG dùng để giữ
  fix:** hai lượt khác chế độ tải (trượt dải → trong dải) và khác
  tải đồng thời (baseline nhiễm 40 hog R3 + apt replay sau reboot;
  fix chạy lúc máy yên). Q2-R2 (load5 7,23, nhiễm tải đồng thời)
  có 38 gap — nhiều hơn fix (11) ở cùng load5 — cho thấy gap-count
  nhạy với tải đồng thời hơn là với fix.
- **(c) Không hồi quy** nhưng không đủ để giữ: prereg yêu cầu (a)
  VÀ (b) cùng đúng; cả hai đều trượt.
- **Đã revert:** preview.tsx về đúng 03bf029f09b8890b285eacc10a02172b
  (md5 kiểm lại 18:27:43Z). Cờ cây = NO-CHANGE.

## 6. Cơ chế — đính chính sau A/B

- Giả thuyết "snapshot nhỏ hơn → capture rẻ đi → stall biên giảm"
  **bị bác trong điều kiện đo này.** drawImage 1280×720 → 640×360
  chỉ cắt được ~10–30% capMs dưới tải, không cắt được longtask
  200–800 ms — vì longtask không nằm trong drawImage (xem §1:
  longtask start sau tInvoke; không phải task tick; không phải CDP).
- Hướng giải thích còn lại cho nửa longtask khớp pump: mỗi lần
  capture/present kích hoạt công việc hạ nguồn (GC major do bản copy
  frame tạm, hoặc công việc present/compositor sau callback) mà
  kích thước snapshot không quyết định. Fix run có NHIỀU capture hơn
  (156 vs 119) và NHIỀU longtask khớp pump hơn — phù hợp với "mỗi
  capture kích hoạt một chi phí hạ nguồn gần như cố định", nhưng
  đây vẫn là suy đoán, chưa chứng minh.
- Nửa longtask KHÔNG khớp pump vẫn mở (nghi GC — như Q2 §3.5).

## 7. Bước tiếp theo đề xuất (cho đợt sau, không phải luồng này)

1. **Chốt nửa longtask chưa rõ nguồn bằng Long Animation Frame API**
   (`PerformanceObserver('long-animation-frame')` với scripts
   attribution) hoặc Chrome tracing — Q2 §6 đã đề xuất; longtask
   attribution API đã chứng minh không đủ. Không chạy thêm lượt
   freeze-run kiểu cũ để đo gap-count (mẫu đã đủ).
2. **Nếu vẫn muốn đánh hướng sửa:** thử H2 (giới hạn tần suất
   capture, vd bỏ capture nếu <66 ms từ lần trước) — giảm SỐ LẦN
   kích hoạt chi phí hạ nguồn thay vì kích thước mỗi lần. Cần A/B
   cùng chế độ tải (chạy 2 lượt liền nhau, tránh R3/hog xen vào),
   và bar phải dùng chỉ số per-event (capMs + longtask khớp pump /
   giây phát), không dùng gap-count.
3. **OffscreenCanvas/worker (H3)** vẫn cần vòng prototype riêng
   (video element không drawImage được từ worker).
4. **Nợ vận hành:** đợt này cho thấy 2 lượt A/B chạy cách nhau một
   lượt R3 dài (197 clip) thì chế độ tải đổi hẳn — đợt sau nên xếp
   baseline + fix liền nhau, hoặc chấp nhận chỉ so per-event với đối
   chứng lịch sử.

## 8. File và dữ liệu

- LIMITS này: `docs/PHASE9_ROUND115_R2_ZOMBIEFIX_LIMITS.md`
- Prereg: `hidden_files/round115-r2/prereg-r2.md`
- Probe (copy Q2, chỉ đổi đường dẫn): `apps/web/scripts/probe115r2-frame-parity.mjs`
  (62.660 byte — > 37.768 byte, cần `ENABLE_PRIVSEP=0` khi push)
- Driver/holder/lock copy: `hidden_files/round115-r2/run-r2.sh`,
  `load-holder-r2.sh`, `vcut-vite-lock-frozen.sh` (md5 fd21193c…),
  `driver-r2.log`, `holder-q2.log`, `driver-r2-base.out`,
  `driver-r2-fix.out`
- Analyzer A/B: `hidden_files/round115-r2/analyze-r2.py`
- Patch fix (đã revert, giữ để đợt sau quyết):
  `hidden_files/round115-r2/r2-snapshot-cap.patch` (56 dòng)
- Bản sao cây gốc: `hidden_files/round115-r2/preview.tsx.baseline-03bf029f`
  (md5 03bf029f, khớp cây hiện tại sau revert)
- Dữ liệu thô (KHÔNG stage): `hidden_files/round115-r2/
  chr-mixedalt-r2base-fr4/` (results.json 29,4 MB, render-ticks.jsonl,
  worker-ticks.jsonl, cdp-samples.jsonl, analysis txt,
  classify json) và `chr-mixedalt-r2fix-fr4/` (results.json 36,2 MB,
  cùng bộ file); `suites-fix.log`
- Cờ: `hidden_files/round115-r2-tree` (NO-CHANGE, md5 03bf029f);
  `hidden_files/round115-r2-done` khi xong
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round115-r2-zombiefix.txt`
  (NUL-delimited; LIMITS + probe; KHÔNG binary, KHÔNG workflow .yml)

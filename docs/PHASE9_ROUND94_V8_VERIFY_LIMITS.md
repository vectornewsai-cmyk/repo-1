# Phase 9 đợt 94 — V8: kiểm chứng độc lập (thay U9 đợt 93)

> Luồng V8, 12/11/2026. Kiểm chứng độc lập trên cây đã gộp của đợt 94 (V1–V7), chạy lại
> bằng tay từ đĩa — không sửa code luồng khác, không push, không đụng TTS 39 / workflows.
> Chi tiết chạy: `hidden_files/round94-v8/verify.log`, `verify2.log`, `verify3-o8.log`,
> `verify3-o8-chromium2.log`. Log luồng: `hidden_files/round94-v8.md`.

## 1. Kết quả tổng — luồng nào XÁC NHẬN / chưa về

| Luồng | Chủ đề | Trạng thái V8 |
|---|---|---|
| V1 | rVFC pump nối tiếp U1 (đo baseline sạch) | **XÁC NHẬN** (đo + tsc/build; O8 chưa chạy lúc V1 — V8 chạy lại, xem §2) |
| V2 | Trần stall re-arm | **XÁC NHẬN** (test 41/41 chạy lại) |
| V3 | Blob-load flaky 42% | **XÁC NHẬN** (đối chiếu số từ JSON thô; xem §5) — về lúc 03:44Z (V3b sau reboot #14) |
| V4 | rVFC WebKitGTK 0 callback + fallback | **XÁC NHẬN** (test + O8 cả 2 engine chạy lại) |
| V5 | G1 evidence v6 | **XÁC NHẬN VỀ SỐ** — JSON gộp tự nhất quán với LIMITS; không chạy lại đo (ghi rõ §4) |
| V6 | EPERM probe #13 + quét writeFileSync | **XÁC NHẬN VỀ HỒ SƠ** — không chạy lại `once` (probe chỉ chạy đúng 1 lần); scratch quét còn đủ |
| V7 | Tiêu chí canvasOk | **XÁC NHẬN** (`node --check` + đối chiếu số trong LIMITS với JSON thô) |

## 2. Kiểm chứng chạy lại được (V8 tự chạy, 03:30–03:37 UTC)

- **tsc web 0 lỗi** (exit 0); **tsc desktop 0 lỗi** (exit 0); **vite build PASS** (6,39 s;
  chỉ cảnh báo chunk >500 kB có sẵn từ trước).
- `playheadHold90R2.test.ts` **41/41** (31 cũ + 10 mới V2-R1..R10) — khớp claim V2/V4.
- `previewEngine.test.ts` **25** — khớp claim V4.
- `seek.test.ts` **20/20**; `seekSkipRender86N3.test.ts` **9/9**;
  `previewLoop50F2.test.ts` **20/20** — khớp claim V2/V4.
- `cssClasses60Q2.test.ts` **60/60**; `cssClasses61R4.test.ts` **60/60** — khớp closing đợt 93.
- **Audit P7** (`i18nAudit59P7.test.ts`) **8/8**; **orphans** (`i18nOrphans60Q4.test.ts`)
  **17/17** — chạy bằng esbuild bundle theo đúng hướng dẫn ghi trong file test.
  Lưu ý: chạy trực tiếp bằng `node --experimental-strip-types` FAIL
  `ERR_MODULE_NOT_FOUND` (`./nestedPreview`, `./projectRepo` import không đuôi `.ts`)
  — đây là lỗi runner của V8 lúc đầu, KHÔNG phải hồi quy; đã chạy lại đúng cách và xanh.
- **r6-i18n-check PASS** — vi=en=2767 key, literal 642, key mới R6: 741.
- `node --check apps/web/scripts/probe89q5-seek-latency.mjs` pass (V7).
- **U4 fail-fast 141/141** (chạy lại từ `server/render`, fixture cũ đã có sẵn ở
  `hidden_files/round93-u4/work/` do parent tái tạo đợt 93; C2d-mkf60-dry:
  OLD 45,491 s → NEW 0,194 s, tiết kiệm ~45,3 s).
- **O8 21/21 cả 2 engine — V8 chạy lại sau sửa V2+V4:**
  - WebKit **21/21 pass, 0 fail** (S7 Δx=0,194, khớp kỳ vọng canvas 0,194).
  - Chromium **21/21 pass, 0 fail** (S7 Δx=0,112, khớp kỳ vọng canvas 0,112).
  - Lần chạy Chromium đầu của V8 fail `thiếu fixture trong SCRATCH` (exit 2) vì V8
    dùng scratch mới trống — lỗi setup của V8, không phải lỗi sản phẩm; copy 3
    fixture (o8-track-35-65.json + 2 clip mp4) từ scratch `round94-v4/o8-chromium`
    rồi chạy lại thì 21/21. Ghi rõ để luồng sau khỏi lặp lại: script O8 kiểm tra
    fixture TRƯỚC khi mkdir scratch nên scratch mới luôn fail lần đầu.

## 3. Đối chiếu batch đã stage (6 batch / 16 entry, kiểm 03:27 UTC)

Read-back OK **16/16** (mọi file đều tồn tại trong repo, đúng đường dẫn trong file
paths), **0 binary, 0 workflow**:

- V1: 1 entry (chỉ LIMITS — V1 KHÔNG sửa code repo).
- V2: 5 entry (`playheadHold90R2.ts`, `playheadHold90R2.test.ts`, `preview.tsx`,
  `probe94v2-stall-evidence.mjs`, LIMITS).
- V4: 5 entry (`preview.tsx`, `probe94v4-rvfc-webkit.mjs`,
  `probe94v4-rvfc-fallback.mjs`, `analyze94v4-rvfc-fallback.mjs`, LIMITS).
- V5: 2 entry (`benchmarks/results/g1-evidence-v6-94v5.json`, LIMITS).
- V6: 1 entry (LIMITS).
- V7: 2 entry (`probe89q5-seek-latency.mjs`, LIMITS).
- `preview.tsx` có mặt ở cả batch V2 + V4 (file chung): kiểm tra marker — V2
  (`94V2`, nhiều match: `forwardVideoActives94V2`, `resumeRearmCount94V2`, …) và
  V4 (`Đợt 94 V4`, fast-path "rVFC im lặng" + memo engine) đều còn đủ; không
  phát hiện mất marker do ghi đè lẫn nhau. Không phát hiện xung đột nội dung
  (V2 sửa vùng playhead-hold/re-arm, V4 sửa vùng pump rVFC — vùng khác nhau).

## 4. Số nào chỉ "tin LIMITS + chưa chạy lại" (ghi rõ, không mạo nhận)

- **V5 G1 v6:** không chạy lại đo (mỗi lượt đo tốn nhiều phút, VM vừa reboot).
  Đã đối chiếu JSON gộp với LIMITS: pool 30fps n=38 median 0,950 PASS 31/38
  (82%); pool 60fps n=27 median 0,960 PASS 25/27 (93%); quiet-30fps n=8 median
  0,805 PASS 4/8 (50%), values `[0.93, 0.68, 0.65, 0.68, 1.04, 0.67, 0.94, 1.02]`
  khớp median 0,805; deint-only 30+60 n=65 median 0,950 PASS 56/65 (86%).
  Khuyến nghị trong JSON/LIMITS nhất quán: **KHÔNG đóng G1 toàn vẹn** (phương án
  A mạnh hơn U6 nhưng quiet-30fps vẫn trượt 2/3 tiêu chí chặt, pool 30fps chỉ
  còn biên 1 lần FAIL). Quyết định thuộc parent/user.
- **V6 probe #13:** không chạy lại `once` (thiết kế probe: checklist chỉ chạy
  ĐÚNG 1 lần). Tin LIMITS: status DEAD/STALE → probe #13 boot 9968199e ok=2
  fail=0, exit 0; khoảng mù #12 ~178' + reboot #13 02:34:42Z. Scratch quét còn
  đủ (`hidden_files/round94-v6/`: scan-wfs.sh, wfs-*.txt, scan-meta.txt).
  **Phát hiện mới của V8 (xem §6): reboot #14 ~03:25Z rơi vào khoảng mù #13.**
- **V1 pump:** V1 claim tsc 0 + vite build pass (V8 chạy lại tsc/build trên cây
  gộp và xanh — xem §2); các số coverage/capture/dup trong LIMITS V1 là số đo
  probe của V1, V8 không đo lại pump (VM không yên: 8 luồng song song + reboot).
- **V7 seek GOP:** không chạy lại probe seek-latency (tốn thời gian, 2 engine ×
  6 tổ hợp); đã đọc JSON thô trong `hidden_files/round94-v7/probe-*-load-gop*/`
  — các trial confirmed đều `sawChange=true`, thứ tự GOP ở t=5 giữ nguyên
  (250 > 60 > 30) cả 2 engine, đúng như LIMITS V7 §3. Artifact WebKit GOP250
  trial 4 (`already-at-target`, tiêu chí cũ sẽ PASS nhầm với tCanvas ≈ 100 ms)
  được ghi trong LIMITS — V8 không xác minh độc lập trial này.

## 5. V3 — ĐÃ VỀ, XÁC NHẬN (V3b xong 03:44Z; V8 đối chiếu 03:53–03:57Z)

- V3 gốc: probe V3 viết xong, MATRIX runs 1–3 (36 case) + MATRIX2 run 1 (16 case)
  + MATRIX3 runs 4–5 dở (9 case) = **61 case trong
  `benchmarks/results/webkit-blob-flaky-94v3.json`** (ghi 03:25:19Z, ngay trước
  reboot). Log `.md` đứng yên từ 03:08Z; **reboot #14 ~03:25Z giết process V3**
  lúc đang chạy MATRIX3 (dừng sau Lc6-blobA-run4).
- **V3b (parent spawn lại ~03:32Z):** khôi phục môi trường sau reboot
  (`cp -an ~/workspace/tmp-q6r3-debroot/. /` → libevent-2.1.so.7 + 269 plugin
  gstreamer; `glib-compile-schemas`; Xvfb :199 mới); chạy lại MATRIX3
  (Q6_START=4, runs=2, 16 case, EXIT=0, 03:34–03:37Z); dedupe JSON giữ bản mới
  nhất → 64 case trong `benchmarks/results/webkit-blob-flaky-94v3.json`;
  bản đầy đủ: `hidden_files/round94-v3/analysis-cases.json` (68 case, trường
  `_batch`).
- **Đối chiếu batch V3:** 3/3 entry read-back OK
  (`benchmarks/render/webkit_blob_flaky_94v3.mjs`,
  `benchmarks/results/webkit-blob-flaky-94v3.json`, LIMITS), 0 binary,
  0 workflow.
- **Đối chiếu số V8 tự tính từ `analysis-cases.json` (68 case) — KHỚP HẾT với
  LIMITS V3 §1** (chữ A–E là hậu tố `blobA`…`blobE` trong `_name`, không phải
  trường `variant` — V8 lúc đầu nhóm sai theo `variant` và tưởng lệch, đã sửa):
  A (prod) **11/24 = 46%** (error-event 11, stall-timeout 2); B (preload-none)
  **6/12 = 50%** (err 5, stall 1); C (reset-swap) **2/4**; D (fresh-element)
  **2/4**; E (blob-direct) **8/12 = 67%** (err 4); prog **12/12 = 100%**.
  Tổng: ok 41, error-event 23, stall-timeout 4.
- **Delta swap→error V8 tính lại từ `errEvents[0].t − swapMs`: min 128 ms,
  max 1126 ms, median 430 ms — KHỚP CHÍNH XÁC claim LIMITS V3.**
  `finalSrcKind`: error-event 23/23 = http; stall-timeout 4/4 = blob — khớp
  claim "fail về http / stall lặng ở blob".
- **Quyết định V3: CHỈ chẩn đoán, KHÔNG sửa production** (không biến thể nào có
  bằng chứng sửa được flaky; E tốt nhất 67% nhưng vẫn fail 1/3 mà không có
  swap nào — fail KHÔNG do swap gây ra). **Vì vậy cây đã gộp mà V8 kiểm chứng
  ở §2 không bị V3 thay đổi** — mọi số §2 vẫn đứng sau khi V3 về.
- Chưa đối chiếu độc lập: phân tích GST (bogus CẦN cho fail nhưng CHƯA ĐỦ —
  6 pass vẫn có bogus; giá trị bogus = đúng 4 byte big-endian tại offset
  2 MiB của từng clip; moov ở cuối file; 0 lần "blob" trong 52 log GST) —
  V8 chỉ đọc lại từ LIMITS V3 §5–§6, chưa grep lại log GST (52 file).
  Đây là phần duy nhất của V3 còn "tin LIMITS".

## 6. Phát hiện mới của V8 (không phải lỗi code luồng khác)

1. **Reboot #14 ~03:25Z, boot 0597b689** (boot-id theo log V3b; V8 tự thấy
   uptime 0' lúc 03:25:38Z, RAM khả dụng ~1,99 GB sau reboot). Không probe nào
   ghi nhận lúc xảy ra: V6 probe #13 chốt reboot #13 (02:34:42Z, boot
   9968199e); khoảng mù #13 (bắt đầu 02:39:01Z) nay chứa thêm reboot #14.
   Khoảng mù #13 vẫn mở cho đến khi probe #14 chạy (nợ đợt sau). Đề xuất cron
   riêng 10 phút vẫn chờ user quyết (như mọi đợt trước).
2. **Poll nền của V8 bị SIGTERM kill lúc ~03:24Z** (910 s của sleep 1200 s) —
   cùng thời điểm reboot #14; V8 kiểm tra trực tiếp bằng lệnh mới sau reboot,
   không mất dữ liệu (hidden_files + repo-1 đều bền qua reboot).
3. **Không phát hiện lỗi thật nào** trong code V1/V2/V3/V4/V5/V6/V7 đã gộp
   (tsc/build/test/O8 đều xanh khi chạy lại; số V3 đối chiếu khớp hết). Các lưu
   ý nhỏ đã ghi ở §2 (lỗi runner P7/orphans của chính V8; lỗi fixture O8 lần
   đầu của chính V8; lần nhóm sai trường `variant` khi đối chiếu V3 của chính
   V8, đã sửa) — đều là lỗi thao tác của V8, không phải hồi quy.

## 7. Giới hạn kiểm chứng

- V8 chỉ chạy lại những gì liệt kê ở §2 trong khung ~100 phút (02:38–04:18Z);
  không đo lại pump V1, G1 V5, probe EPERM V6, seek-latency V7 (lý do ở §4).
- V3 đã về và được đối chiếu đầy đủ về số (§5); chỉ còn phân tích GST là
  "tin LIMITS" (52 file log, chưa grep lại).
- O8 chạy lại trên cây gộp V2+V4 (V3 không sửa code nên không ảnh hưởng).
- Không đụng TTS 39, không đụng `.github/workflows`, không binary vào batch,
  không push, không release/tag.

## 8. Batch đã stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round94-v8-verify.txt` — 1 entry
(LIMITS này), verify read-back OK, 0 binary, 0 workflow. HEAD vẫn 5f548ef8.
KHÔNG push.

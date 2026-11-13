# Phase 9 đợt 95 — W9: kiểm chứng độc lập (thay V8 đợt 94 / U9 đợt 93)

> Luồng W9, 12/11/2026. Kiểm chứng độc lập trên cây đã gộp của đợt 95 (W1–W8), chạy lại
> bằng tay từ đĩa — không sửa code luồng khác, không push, không đụng TTS 39 / workflows /
> birefnet. Chi tiết chạy: `hidden_files/round95-w9/verify.log` (phần 1, 07:22–07:25Z),
> `verify-u4.log` (chạy lại U4), `verify-o8-webkit.log`, `verify-o8-chromium-nofixture.log`,
> `verify-o8-chromium.log`. Log luồng: `hidden_files/round95-w9.md` + `round95-w9/poll.log`.

## 1. Kết quả tổng — luồng nào XÁC NHẬN / chưa về lúc hết hạn

| Luồng | Chủ đề | Trạng thái W9 |
|---|---|---|
| W1 | Clip faststart — giả thuyết qtdemux 2 MiB BỊ BÁC | **XÁC NHẬN** (đối chiếu số từ JSON thô; xem §5) |
| W2 | Retry-play sau error-fallback (media.ts) | **XÁC NHẬN** (test 7/7 + 25/25 chạy lại bằng esbuild ESM; đối chiếu JSON thô §5; O8 chạy lại §2) |
| W3 | Harness parity pixel đồng bộ theo frame | **XÁC NHẬN VỀ HỒ SƠ + PHƯƠNG PHÁP** — về muộn (~07:23Z, sau khi poll W9 hết hạn 07:20Z); không chạy lại 14 lượt headed (xem §4) |
| W4 | gStd spread ring-fill + parity MAD F/C | **XÁC NHẬN** (đối chiếu số thô assert/assert2 + JSON parity F/C §5) |
| W5 | Re-arm trễ 1 tick — hướng (b) | **XÁC NHẬN** (test 17/17 + 41/41 chạy lại; đối chiếu trace re-arm p3b từ JSON thô + analyzer §5; O8 chạy lại §2) |
| W6 | G1 evidence v7 | **XÁC NHẬN VỀ SỐ** — JSON gộp tự nhất quán với LIMITS; không chạy lại đo (ghi rõ §4) |
| W7 | EPERM probe #14 + quét writeFileSync | **XÁC NHẬN VỀ HỒ SƠ** — không chạy lại `once` (probe chỉ chạy đúng 1 lần); log probe + heartbeat đọc lại khớp §5 |
| W8 | Sửa 5 nợ harness (Xvfb lock, canvasOk, T2, tên case V3, O8 fixture) | **XÁC NHẬN** (lock test 8/8 + seek 21/21 chạy lại; sửa O8 fixture kiểm chứng trực tiếp bằng scratch mới §2) |

**Cả 8 luồng đều hạ cánh** (W3 về muộn nhất, LIMITS mtime 07:23:31Z — sau poll cuối của W9
lúc 07:20:27Z nhưng trước reboot #16; parent gộp không cần spawn lại luồng nào).

## 2. Kiểm chứng chạy lại được (W9 tự chạy, 07:22–07:37 UTC)

- **tsc web 0 lỗi** (exit 0); **tsc desktop 0 lỗi** (exit 0); **vite build PASS** (11,23 s;
  chỉ cảnh báo chunk >500 kB có sẵn từ trước). Chạy 07:22–07:23Z trên cây đã gồm mọi sửa
  production của đợt (media.ts 06:00Z, playheadPacing.ts 06:13Z, preview.tsx 06:15:41Z,
  seek.test.ts W8); W3 chỉ thêm script .mjs/.py + LIMITS (không có file .ts production)
  nên việc LIMITS W3 ghi xong lúc 07:23:31Z — giữa lượt chạy của W9 — không ảnh hưởng
  kết quả tsc/build.
- `playheadHold90R2.test.ts` **41/41** ✓; `playheadPacing54K9.test.ts` **17/17** (11 cũ +
  6 mới W5-R1..R6) ✓; `previewEngine.test.ts` **25** ✓ (18 là tổng phụ giữa file, không
  phải tổng cuối); `seek.test.ts` **21/21** ✓ (20 cũ + 1 test đối chứng mới của W8);
  `seekSkipRender86N3.test.ts` **9/9** ✓; `previewLoop50F2.test.ts` **20/20** ✓;
  `cssClasses60Q2.test.ts` **60/60** ✓; `cssClasses61R4.test.ts` **60/60** ✓.
- `media.retryPlay95W2.test.ts` **7/7** ✓ và `media.blobPrefetch90R3.test.ts` **25/25** ✓ —
  chạy bằng **esbuild bundle `--format=esm`** (xem lưu ý runner ở §6, mục 2).
- **Audit P7** (`i18nAudit59P7.test.ts`) **8/8** ✓; **orphans** (`i18nOrphans60Q4.test.ts`)
  **17/17** ✓ — chạy bằng esbuild bundle theo đúng hướng dẫn trong file test.
- **r6-i18n-check PASS** — vi=en=2767 key, literal 642, key mới R6: 741 (không đổi so với đợt 94).
- `node --check` pass cả 8 script: probe89q5-seek-latency.mjs, xvfb-display.mjs,
  test-xvfb-display-lock.mjs, clicktest-87o8-*.mjs (cả 2), webkit_blob_flaky_95w1_faststart.mjs,
  webkit_blob_flaky_95w2.mjs, webkit_blob_flaky_94v3.mjs.
- **Xvfb lock test** (`test-xvfb-display-lock.mjs`) **PASS 8/8** ✓ (A thu hồi lock mồ côi;
  B 3 claim song song 3 display khác nhau; C claim lúc giữ trả null, nhả xong claim lại được).
- **U4 fail-fast 141/141** ✓ (chạy lại từ `server/render`, fixture cũ ở
  `hidden_files/round93-u4/work/`; C2d-mkf60-dry: OLD 86,795 s → NEW 0,503 s, tiết kiệm
  ~86,3 s — số tuyệt đối khác V8 (OLD 45,491 s → NEW 0,194 s) do tải máy lúc đo khác nhau,
  verdict fail-fast không đổi).
- **O8 21/21 cả 2 engine — W9 chạy lại trên cây gộp W2+W5:**
  - WebKit **21/21 pass, 0 fail** (scratch MỚI `round95-w9/o8-webkit`, không cần copy fixture —
    sửa của W8 có tác dụng: script tự mkdir scratch trước khi check fixture; S7 Δx=0,194,
    bóng Δx=0,197, khớp kỳ vọng canvas 0,194).
  - Chromium **21/21 pass, 0 fail** (S7 Δx=0,112, bóng Δx=0,113, khớp kỳ vọng canvas 0,112).
  - **Kiểm chứng trực tiếp sửa O8 của W8:** chạy Chromium với scratch mới TRỐNG trước —
    exit 2 nhưng **thư mục scratch đã được tạo và `o8-clicktest-report.json` đã ghi
    `harnessError` nêu rõ thư mục + 3 file thiếu + nguồn copy** (trước sửa thì thư mục còn
    chưa tồn tại, không có report). Copy 3 fixture từ `round95-w5/o8-chromium` rồi chạy lại
    thì 21/21. Bẫy "scratch mới luôn fail lần đầu" của V8 nay chỉ còn là "fail lần đầu CÓ
    report rõ ràng" — vẫn cần copy fixture, nhưng không còn mù.

## 3. Đối chiếu batch đã stage (8 batch / 33 entry, kiểm 07:29–07:30 UTC)

Read-back OK **33/33** (mọi file đều tồn tại trong repo, đúng đường dẫn trong file paths),
**0 binary, 0 workflow**:

- W1: 4 entry (probe faststart + script gen clip + JSON 24 case + LIMITS).
- W2: 7 entry (`media.ts`, test retry-play mới, probe MATRIX A + JSON 48 case, probe
  flip-flop app + JSON 10 run, LIMITS).
- W3: 4 entry (probe frame-parity + 2 analyzer + LIMITS).
- W4: 1 entry (chỉ LIMITS — W4 KHÔNG sửa code repo).
- W5: 6 entry (`playheadPacing.ts`, test pacing mới, `preview.tsx`, probe velocity +
  analyzer, LIMITS).
- W6: 2 entry (JSON g1-evidence-v7 + LIMITS).
- W7: 1 entry (chỉ LIMITS).
- W8: 8 entry (xvfb-display mới + test lock mới, probe89q5, 2 script O8, seek.test.ts,
  probe V3, LIMITS).
- **33 entry = 33 file duy nhất** (không file nào xuất hiện ở 2 batch trong đợt này —
  khác đợt 94 khi `preview.tsx` nằm ở cả V2+V4).
- Marker trong file chung: `media.ts` có "Đợt 95 W2" ×3, `95W2` ×20 (chỉ W2 sửa file này);
  `preview.tsx` có "Đợt 95 W5" ×5, `95W5` ×6 (chỉ W5 sửa file này); marker đợt 94 vẫn còn
  đủ (`94V2` ×16, "Đợt 94 V4" ×6) — không mất marker do ghi đè lẫn nhau. W2 và W5 sửa
  2 file khác nhau (media.ts vs preview.tsx/playheadPacing.ts) nên không có xung đột nội
  dung; W5 đã ghi nhận va chạm thời gian với W4 (sửa preview.tsx 06:15:41Z làm vô hiệu
  1 lượt assert95b của W4 — xem §6 mục 4).

## 4. Số nào chỉ "tin LIMITS + chưa chạy lại" (ghi rõ, không mạo nhận)

- **W3 frame parity:** không chạy lại 14 lượt headed (mỗi lượt ~1–2 phút + cần cửa sổ tải
  yên; VM vừa reboot, sibling đã xong nên điều kiện đã khác lúc W3 đo). Đã đọc LIMITS W3
  đầy đủ + kiểm tra file dữ liệu tồn tại (14 thư mục lượt + 8 thư mục VOID/loadsuspect +
  3 file analysis-*.json trong `hidden_files/round95-w3/`). Các claim chính có thể đối
  chiếu chéo nội bộ: static chr×chr MAD 0,0 / chr×wk MAD đúng 1,9 mọi frame; blur
  windowMatched chỉ 1/cặp (frame 0 direct) — W3 tự kết luận KHÔNG verdict được parity
  blur bằng MAD (trung thực, không thổi phồng). Chưa đối chiếu độc lập: số MAD từng cặp
  trong analysis-*.json (W9 chưa chạy lại pool script trên dữ liệu thô).
- **W6 G1 v7:** không chạy lại đo (12 lượt đo, ~35 phút). Đã đối chiếu JSON gộp với LIMITS
  (xem §5): pool 30fps n=45 median 0,950 PASS 36/45 (80%); pool 60fps n=32 median 0,970
  PASS 30/32 (94%); quiet-30 n=8 values khớp median 0,805; 12 lần W6 mới khớp từng tỉ lệ
  (E1 1,82/0,88/1,05/1,01/0,91/0,74/0,69; N10 1,09/0,98/1,09/1,10/0,75). Khuyến nghị
  "KHÔNG đóng G1 toàn vẹn" + đính chính số học (4 PASS nữa chỉ đưa yên-30 lên 8/12 = 67%,
  cần 12 PASS liên tiếp mới 16/20 = 80%) đã đối chiếu đúng từ số trong JSON.
- **W7 probe #14:** không chạy lại `once` (thiết kế probe: checklist chỉ chạy ĐÚNG 1 lần).
  Tin LIMITS + đọc lại log probe append-only (`eperm-probe-v2.log` tail: `probe#14
  boot=06a92916 tmp+ws ok=2 fail=0` 05:39:27Z; `boot changed 9968199e -> 06a92916`) và
  heartbeat (`n=14, ts=05:39:27Z, boot=06a92916-...`) — khớp LIMITS W7 §1.
- **W1/W2/W4/W5 số đo:** W9 không đo lại probe (VM không yên: 9 luồng song song + reboot);
  đã đối chiếu số từ JSON thô (xem §5) — khớp hết với LIMITS của họ.

## 5. Đối chiếu số thô (W9 tự tính từ JSON trên đĩa — KHỚP HẾT)

- **W1 faststart** (`webkit-blob-flaky-95w1-faststart.json`, 24 case): c2 blob **0/6**, c8 blob
  **4/6**, prog **12/12**; cả 8 fail đều error-event. Khớp LIMITS W1 §4.1/§4.2.
  (W9 chưa grep lại 12 log GST để đối chiếu bogus size tại offset 2 MiB — phần này vẫn
  "tin LIMITS", như V8 với GST của V3.)
- **W2 retry-play** (`webkit-blob-flaky-95w2.json`, 48 case, trường pass đúng là `framesOk`,
  không phải `playOk` — case rescued có `playOk=false` nhưng `framesOk=true`): BEFORE blob
  **6/12** loose / **3/12** strict (finalCt ≥ 1 s); AFTER blob **10/12** loose / **8/12**
  strict; prog 12/12 cả 2 phía. Rescued đúng 2 case (`Lc2-blobA-run4`: 6 frame, ct 3,96,
  `retryPlay95W2Fired=1`; `Lc2-blobA-run5`: 9 frame, ct 3,33, fired=1). AFTER fail đúng 2:
  Lc8-run4 error-event, Lc8-run5 stall-timeout. Khớp hết LIMITS W2 §1/§4. Lưu ý: W9 lúc
  đầu nhóm sai theo `playOk` và tưởng AFTER chỉ 8/12 — đã sửa sau khi đọc đúng trường
  (bài học giống V8 nhóm sai `variant` ở V3).
- **W4 gStd spread:** quét lại 2 file thô đợt 93 (`round93-u1/out/preview-abcde-assert.json`
  + `preview-abcde-assert2.json`, 6986 mẫu gStd): mẫu thô tụ ở 37,5 (1433), ~79–84,6
  (3467), ~112 (2063); **21 giá trị trong [60, 62] đều là `gStdMed` (median gộp), không
  có mẫu thô nào** — khớp chính xác claim W4 §1.2 ("61 chỉ là median của nhóm bimodal").
  Parity JSON W4 (`round95-w4/out/mask-parity-{f,c}95.json`): F MAD=0, maxAbs=0, 240672 px;
  C MAD=0, maxAbs=0, 240672 px — khớp LIMITS W4 §1.5.
- **W5 re-arm:** đối chiếu `analyze-post-p1p2p3bp4.txt` + JSON p3b: analyzer ghi
  "re-arm relMs=13227 rearms 0→1" và re-seek sau đó ở relMs=13914 (trễ đúng 1 tick) —
  khớp trace LIMITS W5 §3.1. JSON p3b có `velocityTicks` (43 entry) + `rafSamples` (69);
  W9 chưa truy vết từng tick rAF thủ công.
- **W6 G1 v7:** xem §4 (đối chiếu JSON gộp khớp hết; 12 tỉ lệ từng lần khớp LIMITS §3).

## 6. Phát hiện mới của W9 (không phải lỗi code luồng khác)

1. **Reboot #16 ~07:25–07:28Z, boot adcef40a** (boot-id theo W9 đo trực tiếp lúc 07:28:05Z,
   uptime 0'). Không probe nào ghi nhận lúc xảy ra: W7 probe #14 chốt reboot #15
   (05:17:47Z, boot 06a92916); khoảng mù #14 (bắt đầu 05:39:27Z) nay chứa reboot #16.
   Reboot giết lượt chạy verify.sh của W9 giữa chừng (đang ở bước U4, step 10) — W9 chạy
   lại U4 sau reboot và xanh 141/141. Chu kỳ reboot nay là **16 lần trong ~35h**
   (từ ~20:18Z 10/11 tới ~07:27Z 12/11). Khoảng mù #14 vẫn mở cho đến khi probe #15 chạy
   (nợ đợt sau). Đề xuất cron riêng 10 phút vẫn chờ user quyết (như mọi đợt trước).
   Trong lượt này KHÔNG có reboot nào khác: boot 06a92916 giữ nguyên từ lúc spawn 05:39Z
   qua cả 10 poll (05:50–07:20Z) tới 07:25Z.
2. **Poll W9 kết thúc 07:20:27Z với W3 chưa về** (LIMITS=0, batch=0; driver extension đã
   xong 07:05:14Z, analysis cuối 07:07:48Z, log .md đứng yên từ 06:46:05Z, không còn
   process probe W3 chạy lúc 07:21Z). W3 về lúc 07:23:31Z (LIMITS mtime) — tức là W3
   KHÔNG bị reboot giết (reboot #16 xảy ra sau khi W3 xong); chỉ là W3 viết LIMITS/batch
   chậm hơn hạn poll của W9. Bài học: hạn poll ~100' của luồng kiểm chứng có thể hết
   trước khi luồng đo dài nhất viết xong LIMITS — parent gộp nên chờ thêm hoặc kiểm tra
   đĩa lần cuối trước khi kết luận (W9 đã làm: kiểm tra lại đĩa 07:29Z và thấy W3 đã về).
3. **Runner cho 2 test media.* — lỗi thao tác của W9 lúc đầu, đã sửa, không phải hồi quy:**
   chạy `media.retryPlay95W2.test.ts` / `media.blobPrefetch90R3.test.ts` bằng
   `node --experimental-strip-types` FAIL (`ERR_MODULE_NOT_FOUND` do import `"./media"`
   không đuôi; `ERR_UNSUPPORTED_DIR_IMPORT` do `media.ts` import `"./lib"` dạng thư mục)
   — cùng họ lỗi runner như V8 gặp ở P7/orphans. Chạy lại bằng **esbuild bundle
   `--format=esm`** (CJS fail do top-level await trong test) thì 7/7 và 25/25. Ghi rõ để
   luồng sau khỏi lặp lại: 2 test này KHÔNG chạy được bằng lệnh strip-types chuẩn như các
   test khác trong `src/lib/`; W2 đã đổi import test từ `"./media.ts"` sang `"./media"`
   (để qua tsc) nên càng không chạy trực tiếp được. Nợ nhỏ cho đợt sau: thống nhất runner
   (hoặc sửa import về `"./media.ts"` + sửa `media.ts` import `"./lib"` → `"./lib.ts"` nếu
   an toàn, hoặc ghi rõ lệnh esbuild ESM trong đầu file test).
4. **Va chạm W5→W4 (đã ghi trong LIMITS cả hai bên):** W5 sửa `preview.tsx` lúc 06:15:41Z
   giữa lượt assert95b của W4 → HMR, 28 fail vô lý, lượt đó VÔ HIỆU (W4 dùng dữ liệu yên
   cũ thay thế). Đúng bài học đợt 94 §2 — probe phải kiểm tra mtime trước/sau lượt chạy;
   luồng sửa file chung nên báo trước cho luồng đang đo cùng file.
5. **Không phát hiện lỗi thật nào** trong code W1/W2/W3/W4/W5/W6/W7/W8 đã gộp (tsc/build/
   test/O8 đều xanh khi chạy lại; số đối chiếu khớp hết). Các lưu ý nhỏ đã ghi ở §2/§5/§6
   (lỗi runner của chính W9; lần nhóm sai trường `playOk` khi đối chiếu W2 của chính W9,
   đã sửa) — đều là lỗi thao tác của W9, không phải hồi quy.
6. **Process mồ côi:** sau reboot #16 + sau các lượt O8 của W9, `ps` không còn Xvfb/vite/
   chrome/webkit/`yes` nào (O8 tự dọn; vite 5173 của W4 chết theo reboot). Xvfb :199/:201
   của W1/W2 cũng chết theo reboot. Không còn process nào của đợt 95 chạy.

## 7. Giới hạn kiểm chứng

- W9 chỉ chạy lại những gì liệt kê ở §2 trong khung ~07:22–07:37Z (cộng poll đĩa
  05:39–07:20Z); không đo lại pump/faststart W1, MATRIX W2, 14 lượt headed W3, assert W4,
  G1 W6, probe EPERM W7, seek-latency W8 (lý do ở §4/§5).
- W3 đã về và được đối chiếu về hồ sơ + phương pháp (§4); số MAD từng cặp trong
  analysis-*.json chưa đối chiếu độc lập.
- W1: phân tích GST (bogus size tại offset 2 MiB của file faststart) chưa đối chiếu độc
  lập (12 log) — tin LIMITS.
- O8 chạy lại trên cây gộp W2+W5 (W3 không sửa code production nên không ảnh hưởng).
- Không đụng TTS 39, không đụng `.github/workflows`, không binary vào batch, không push,
  không release/tag.

## 8. Batch đã stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round95-w9-verify.txt` — 1 entry
(LIMITS này), verify read-back OK, 0 binary, 0 workflow. HEAD vẫn 5f548ef8.
KHÔNG push.

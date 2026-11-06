# Phase 9 đợt 40, luồng V6 — Cổng CPU (chuẩn bị khóa, KHÔNG khóa) + probe per-seek v2 — LIMITS

Ngày: 03/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo,
KHÔNG tạo batch paths-loop (parent gộp). Luồng này CHỈ đụng file
của mình (§7); không sửa preview.tsx, controller GOP, solo runner,
assetStore, harness N2, hay khung cpuGate39T6.ts. Mọi claim dưới
đây đều có test/số đo thật kèm theo; chỗ nào chưa đo thì ghi rõ,
không mạo nhận.

## 0. Kết luận ngắn (không vượt số đo)

1. **Cổng CPU VẪN CHƯA KHÓA — và luồng này không khóa.**
   `PROPOSED_CPU_GATE.locked` vẫn `false`, `cpuGate39T6.ts` không
   đổi một chữ, không harness nào import module mới. Việc làm ở đây
   chỉ là CHUẨN BỊ cho phiên quiet sau: tách 2 tiêu chí Node thành
   module chẩn đoán riêng, đo được, log được lý do trượt từng tiêu
   chí, cấu hình/tắt riêng từng tiêu chí.
2. **Không tìm thấy bug cụ thể ở tầng Node.** Đọc code sampler
   (`cdp-cpu-sample.mjs`, `sampleCpuTree`: delta tick /proc chia
   wall-time, đúng công thức) + chạy lại sampler nguyên bản trên
   máy lúc này: busy-loop 96,3% / idle 4,5% — sampler đo đúng khi
   máy không bị tải nền đè. Số 39,4% lặp lại của đợt 39 vì vậy
   KHÔNG quy được về bug sampler; nó phù hợp với trần tải nền
   (4 vCPU, RAM ~88%, 13 Chrome khác lúc T6 đo), nhưng "phù hợp
   với" vẫn chưa phải bằng chứng nguyên nhân — chỉ phiên quiet có
   điều phối mới kết luận được. Không sửa sampler, không nới ngưỡng.
3. **Probe per-seek v2 đã cài thật, mặc định TẮT như v1.**
   Mỗi entry có thêm `elementId` + mẫu `decodedSamplesWhileSeeking`
   lấy TRONG lúc seeking (không chỉ sau seeked) + ảnh chụp src/
   readyState lúc read() flush. 17 trường spec §3.3 giữ nguyên tên
   + ngữ nghĩa; entry v1 (không trường v2) vẫn validate đạt;
   `mechanismLabel` không đổi nên nhãn cơ chế cũ tái tạo được từ
   dữ liệu v2. Test mới 8/8, test cũ T2 10/10 giữ nguyên.

## 1. Chuẩn bị khóa cổng CPU: module chẩn đoán Node riêng

### 1.1 Vấn đề của khung T6 (đợt 39 §5, nhắc lại để khỏi đọc lệch)

- Tầng CDP phân biệt 3/3 cả 2 lần hiệu chuẩn (H1 ≤ 2,7%,
  H2 ≥ 92,2%, gap ≥ 91,2).
- Tầng Node trượt cả 2 lần ở đúng MỘT tiêu chí: busy (lần 1:
  39,9/39,4/39,4; lần 2: 77,4/39,4/39,5; ngưỡng > 50). Tiêu chí
  idle (< 20) đạt cả 2 lần (toàn 0,0). Khung T6 gộp 2 tiêu chí
  thành 2 boolean nên phiên sau không nhìn được vòng nào trượt,
  trượt bao nhiêu, phẳng hay rải — module mới sinh ra để trả lời
  đúng 3 câu đó, từng tiêu chí một.

### 1.2 Module mới `cpuGateNodeDiag40V6.ts` (thuần, không I/O)

- `diagnoseNodeLayer(rounds, config?)` → chẩn đoán từng tiêu chí:
  `passed`, `failingRoundIndices` + `failingValues`, min/max/
  median, `margin` (busy: min − ngưỡng; idle: ngưỡng − max; âm
  khi trượt), `pattern`, và `detail` là chuỗi lý do đầy đủ để log.
  Pattern chỉ mô tả HÌNH DẠNG số, không suy nguyên nhân:
  `all-pass` | `all-fail-flat` (mọi vòng trượt, rải ≤ 5 điểm %) |
  `all-fail-spread` | `mixed` (có vòng đạt, có vòng trượt) |
  `disabled` | `no-data`.
- Verdict tầng Node: `pass` | `fail-busy` | `fail-idle` |
  `fail-both` | `disabled` | `insufficient-rounds` (chưa đủ
  vòng lấn át kết quả tiêu chí, nhưng detail từng tiêu chí vẫn
  đầy đủ). Tiêu chí bị tắt KHÔNG tính là trượt.
- Cấu hình riêng: `NodeGateConfig { busyEnabled, idleEnabled,
  busyMin, idleMax, minRounds }`, mặc định = ngưỡng T6
  (50/20/3). Phiên quiet có thể tắt riêng busy hoặc idle, hoặc
  thử ngưỡng khác, mà không đụng `PROPOSED_CPU_GATE`.
- `evaluateGateWithNodeDecision(rounds, nodeConfig?)` → trả lời
  "NẾU quyết theo cấu hình Node này thì cổng ra sao": `cdpPass`
  (cùng tiêu chí evaluateCpuGate gốc), `node` (chẩn đoán),
  `nodeExcluded` (có tiêu chí nào bị tắt không),
  `gateableUnderNodeDecision`, và `note` LUÔN ghi "CHƯA KHÓA"
  + phần đã loại. Trường này cố tình không tên `lockable` để
  không ai đọc nhầm thành quyết định khóa.
- Module CỐ TÌNH không import `cpuGate39T6.ts` (lý do kỹ thuật
  ghi trong comment đầu file: file nguồn import không đuôi theo
  bundler, test strip-types không phân giải được import không
  đuôi, còn import có đuôi .ts thì tsc TS5097). Ngưỡng CDP +
  Node được mirror bằng số tường minh, và test khóa chúng bằng
  `PROPOSED_CPU_GATE` gốc — nếu T6 đổi ngưỡng thì test này đỏ
  và báo drift, không lặng lẽ lệch.

### 1.3 Chẩn đoán trên số thật under-load (U4 + T6, chỉ để khóa hàm)

| Bộ số | busy | idle | Verdict Node | Đọc |
|---|---|---|---|---|
| T6 lần 1 (39,9/39,4/39,4) | TRƯỢT, `all-fail-flat`, margin −10,6 | đạt | `fail-busy` | Mọi vòng trượt cùng mức phẳng — hình dạng phù hợp trần tải, chưa chứng minh nguyên nhân |
| T6 lần 2 (77,4/39,4/39,5) | TRƯỢT, `mixed` (vòng 0 đạt) | đạt | `fail-busy` | Không phải trần phẳng tuyệt đối: có 1 vòng vượt ngưỡng |
| U4 (41,4/55,0/58,9) | TRƯỢT, `mixed` (vòng 0 trượt) | đạt (median 0,5) | `fail-busy` | Cùng mẫu: chỉ 1 vòng trượt cũng đủ chặn cổng "mọi vòng" |
| Quiet giả định (95/96/94) | đạt | đạt | `pass` | Hàm đúng; đây là số GIẢ ĐỊNH, không phải quyết định |

Kết luận giữ nguyên từ T6: **tiêu chí trượt duy nhất, trong cả
3 bộ số thật, là busy > 50; idle chưa từng trượt.** Vì vậy phiên
quiet chỉ cần tập trung vào câu hỏi busy — giữ, sửa ngưỡng, hay
loại tiêu chí busy — chứ không cần mở lại toàn bộ cổng. Nhưng
quyết đó thuộc về phiên quiet, không thuộc luồng này.

### 1.4 Kiểm tra sampler tầng Node: không phải bug (bằng chứng)

- Đọc code `sampleCpuTree`: đọc `/proc/<pid>/stat` đầu + cuối
  cửa sổ, delta tick / CLK_TCK / wall-time thực đo — công thức
  đúng; cây tiến trình qua ppid; busy-loop `node -e` không có
  con nên không bị tính thiếu/thừa cây.
- Chạy lại sampler NGUYÊN BẢN (không sửa) trong scratch, cửa sổ
  2000 ms, song song busy + idle như probe U4: **busy 96,3%
  (delta 193 tick, wall 2,004 s, tck 100), idle 4,5%.**
- Suy ra: sampler cho ~100% đúng kỳ vọng khi máy không bị đè.
  Số 39,4% của T6 không phải lỗi công thức đo. Nó cũng KHÔNG
  chứng minh được là "do tải nền" — chỉ là phù hợp với giả thuyết
  đó. Ghi rõ để phiên quiet không đọc thành kết luận.
- Lưu ý: lần kiểm tra này chạy cùng lúc với các luồng đợt 40
  khác (máy không yên) nhưng vẫn ra 96,3% — tức tải lúc này nhẹ
  hơn lúc T6 đo, hoặc trần tải lúc đó là tạm thời. Càng không
  được dùng 96,3% này làm "hiệu chuẩn mới": nó chỉ là kiểm tra
  sampler, không phải 3 vòng hiệu chuẩn theo protocol U4, không
  có tầng CDP đi kèm, không thay thế phiên quiet.

## 2. Probe per-seek v2 cho harness N2

### 2.1 Cái gì đổi (mặc định TẮT — harness không sửa)

- `per-seek-probe-page.js` (VERSION `per-seek-v2`):
  - `elementId`: WeakMap gán theo element, element đầu tiên = 0,
    cùng element giữ nguyên id qua các seek, element mới không
    tái dùng id cũ. Đóng gap T2 §4.3 (entry 16 vs 17: khác id thì
    là hai element khác nhau, không phải seek bị bỏ).
  - `decodedSamplesWhileSeeking`: mỗi tick rAF mà `seeking=true`
    và entry chưa seeked thì push `{ tMs, decoded, dropped }`
    (tMs tuyệt đối = performance.now()). Trần
    `maxSeekingSamples` (mặc định 1000, ~16 s ở 60 fps, cấu hình
    qua `install({ maxSeekingSamples })`); vượt thì đếm vào
    `droppedSeekingSamples`, không tràn bộ nhớ trang.
  - Lúc `read()` flush: entry chưa xong được ghi thêm
    `flushElementSrc` (currentSrc || src) +
    `flushElementReadyState` để đối chiếu entry unresolved thuộc
    element nào (ví dụ thumbnail bị gỡ src). Entry đã hoàn tất
    trước read() giữ null — không bịa.
- `per-seek-probe.mjs` (PERSEEK_VERSION `per-seek-v2`):
  - `PERSEEK_V2_EXTRA_FIELDS` liệt kê 5 trường v2 riêng khỏi
    spec và extra v1.
  - `validatePerSeekEntry` vẫn đạt cho entry v1; trường v2 chỉ
    kiểm tra khi có mặt (elementId nguyên ≥ 0, mẫu mảng với
    tMs đơn điệu và ≥ requested, decoded/dropped nguyên ≥ 0).
  - `analyzeSeekingSamples(entry)` (mới, bằng chứng thô, không
    thay nhãn): `rising` (decoded tăng trong lúc seeking),
    `flat` (đứng yên suốt lúc seeking), `unknown` (không mẫu /
    decoded null / không đơn điệu). `mechanismLabel` KHÔNG đổi.
- Harness N2 KHÔNG sửa: nó chỉ đọc `perSeekRaw.entries` thô +
  `version` từ probe rồi ghi vào forward-hold.json, nên entry v2
  chảy qua không cần đổi code; `version` tự thành `per-seek-v2`.
  Khi tắt (`N2_PERSEEK` không đặt), harness không evaluate code
  probe — đường đo mặc định không đổi, như v1.

### 2.2 Probe v2 lấy mẫu được gì (test VM, không phải số Chrome thật)

- Seek với 3 tick seeking, decoded 100 → 105 → 110 → 115 rồi
  seeked ở 120: 3 mẫu đúng [105, 110, 115], tMs đơn điệu và ≥
  requested, tick draw sau seeked không thêm mẫu;
  `analyzeSeekingSamples` → `rising`, delta +15.
- Seek decoded đứng yên ở 50 suốt 2 tick seeking: 2 mẫu,
  `flat`, delta 0 — đúng tín hiệu cần để tách decode stall khỏi
  seek-scheduling trong phiên headed sau (v1 không tách được:
  chỉ biết decoded tăng 10–29 frame từ gán tới seeked, không
  biết tăng lúc nào trong lúc chờ).
- Trần mẫu: `maxSeekingSamples: 2` với 4 tick seeking → 2 mẫu +
  `droppedSeekingSamples: 2`.
- Chưa đo: phiên headed thật với probe v2 (máy đang chạy nhiều
  luồng đợt 40, số sẽ under-load — không chạy chen để lấy số
  giả baseline). Phiên solo quiet sau này là nơi đo thật đầu
  tiên của v2; tới lúc đó v2 mới có số Chrome thật.

### 2.3 Tương thích (ghi rõ để luồng sau không đọc lệch)

- 17 trường spec §3.3: giữ nguyên tên + ngữ nghĩa; test cũ T2
  10/10 không sửa kỳ vọng nào.
- `firstDrawAfterSeekAtMs` vẫn là "đủ điều kiện vẽ" qua rAF
  (không phải bằng chứng canvas đã vẽ) — v2 không sửa điểm này;
  muốn bằng chứng draw thật vẫn cần hook trong drawVideoClip
  (thuộc luồng sở hữu preview, như T2 §6 đã ghi).
- `holdCountAtSeek`/`holdCountAtFirstDraw` vẫn là bộ đếm toàn
  cục, không theo element — v2 không sửa; muốn hold theo element
  thì elementId giúp lọc entry, không giúp tách hold.
- Đường WebCodecs reverse vẫn mù với probe (không gán
  currentTime) — v2 không sửa, như T2 §5.4(c).

## 3. Kiểm chứng đã chạy (số thật)

- `node --check` pass: probe trang v2, module phân tích v2,
  test probe v2.
- Test probe mới: **18/18** (`node --test
  per-seek-probe.test.mjs`): 10 test gốc T2 giữ nguyên + 8 test
  v2 (version + đủ trường, elementId ổn định/khác element,
  mẫu seeking tăng đều + dừng sau seeked, flat, trần mẫu,
  flush src/readyState, tương thích ngược v1, validate bắt mẫu
  sai). Lỗi trung gian duy nhất: deepEqual mảng từ realm VM
  (đã gặp ở T2 với counts) — sửa bằng `Array.from` về realm host,
  không sửa logic probe.
- Test cổng: `cpuGateNodeDiag40V6` **17/17** (gồm test khóa
  ngưỡng module khớp PROPOSED_CPU_GATE + test locked=false),
  `cpuGate39T6` cũ **8/8**.
- Hồi quy liên quan: gate v3 **13/13**, solo runner **16/16**
  (tổng 29/29 lúc chạy — cao hơn 24/24 thời T2 vì file test đã
  có thêm 5 test của luồng V1 đợt 40 đang chạy song song; luồng
  này không đụng 2 file đó, tất cả đều xanh).
- `tsc --noEmit`: **0 lỗi toàn cây** ở lần chạy cuối (lưu ý: ở
  lần chạy giữa, tsc từng báo lỗi ở file của luồng khác đang
  sửa dở — `reverseWebcodecs.ts` trùng identifier,
  `preview.tsx` biến thừa, `pauseDraw40V3.test.ts` chưa exclude
  — các luồng đó đã sửa xong trước lần chạy cuối; không phải
  lỗi của V6 và V6 không đụng các file đó).
- `vite build` ra thư mục tạm ngoài repo
  (`~/workspace/tmp-round40-v6/dist-test`): **pass 27,71 s**,
  cảnh báo chunk > 500 kB cũ; `apps/web/dist` trong repo không
  bị đụng (không có index.html mới, build không ghi vào đó).

## 4. Chưa làm / không làm (trung thực)

- KHÔNG khóa cổng CPU (đúng giao: chuẩn bị khóa, không khóa).
  Không đổi ngưỡng đề xuất, không nối module mới vào harness.
- KHÔNG sửa sampler tầng Node (đo lại thấy đo đúng; không có
  bug cụ thể để sửa).
- KHÔNG chạy phiên headed thật với probe v2, KHÔNG chạy phiên
  hiệu chuẩn CPU 3 vòng mới, KHÔNG chạy phiên solo quiet —
  tất cả đều cần máy yên + điều phối, không chạy chen trong
  lượt cron nhiều luồng này.
- KHÔNG sửa chuỗi hardcode "absent…" trong solo runner và
  không truyền cờ qua Q6/solo (đó là việc của luồng sở hữu
  solo runner, T2 §5.1–5.2; probe v2 chỉ sẵn sàng để họ dùng).
- KHÔNG đổi `mechanismLabel` theo mẫu seeking mới — nhãn cũ
  giữ nguyên để hồi quy không lệch; khi nào phiên quiet có đủ
  số v2 thì luồng sau mới quyết có cần nhãn mới không.

## 5. File đổi/thêm (chỉ của V6 — text, không binary, không dist)

MỚI (2 file code + 1 LIMITS):

- `apps/web/src/lib/cpuGateNodeDiag40V6.ts` (chẩn đoán Node
  riêng + kết hợp "nếu… thì…" — chưa khóa, chưa nối harness).
- `apps/web/src/lib/cpuGateNodeDiag40V6.test.ts` (17/17).
- `docs/PHASE9_ROUND40_V6_CPU_PERSEEK_LIMITS.md` (file này).

SỬA (3 file probe + 1 dòng tsconfig):

- `apps/web/scripts/per-seek-probe-page.js` (v2: elementId,
  mẫu decoded trong lúc seeking, flush src/readyState).
- `apps/web/scripts/per-seek-probe.mjs` (v2: validate tương
  thích ngược, `analyzeSeekingSamples`, version v2).
- `apps/web/scripts/per-seek-probe.test.mjs` (10 cũ + 8 mới).
- `apps/web/tsconfig.json` (thêm 1 dòng exclude cho test mới;
  dòng exclude của luồng V3 xuất hiện do luồng đó chạy song
  song — parent gộp, V6 không đụng).

KHÔNG ĐỔI: `cpuGate39T6.ts` (locked:false nguyên vẹn),
`clicktest-round31-n2-reverse-fps-pipe.mjs` (harness N2),
`seek-ab-gate-v3.test.mjs`, `seek-ab-solo-run.test.mjs`,
`preview.tsx`, controller GOP, solo runner, assetStore, mọi
file của luồng khác. Không push, không tag. Scratch ở
`~/workspace/tmp-round40-v6/` (script kiểm tra sampler, kết
quả kiểm tra, build tạm) — không vào batch.

## 6. Nợ mở (cho parent / phiên sau)

1. **Phiên quiet có điều phối mới được khóa cổng CPU** (nợ 6
   đợt 39, vẫn mở): chạy probe U4 3 vòng lúc máy yên, ghi rõ
   loadavg/RAM; dùng `diagnoseNodeLayer` để đọc từng tiêu chí.
   Nếu busy vẫn trượt lúc yên thì quyết sửa ngưỡng hay loại
   tiêu chí busy (module đã cho tắt riêng + thử ngưỡng); nếu
   cả 2 tiêu chí đạt thì khóa theo `evaluateCpuGate`. Cấm khóa
   từ dữ liệu under-load — kể cả số 96,3% kiểm tra sampler ở
   §1.4 (không phải hiệu chuẩn protocol).
2. **Phiên headed/solo quiet đầu tiên với probe v2**: chạy N2
   (hoặc solo khô) với `N2_PERSEEK=1`, đọc
   `decodedSamplesWhileSeeking` + `analyzeSeekingSamples` để
   tách seek-scheduling khỏi decode stall trên số thật; đối
   chiếu entry unresolved bằng `elementId` + `flushElementSrc`.
3. **Solo runner dùng được probe** (T2 §5.1–5.2, vẫn mở): sửa
   chuỗi hardcode "absent…" trong `seek-ab-solo-run.mjs`,
   xác nhận `N2_PERSEEK=1` chảy qua solo→Q6→N2 bằng 1 lượt khô
   — thuộc luồng sở hữu solo runner, không phải V6.
4. **Nhãn cơ chế từ mẫu seeking**: khi đã có số v2 thật, luồng
   sau quyết có cần nhãn mới (ví dụ "decode-flat-during-seek")
   hay `analyzeSeekingSamples` đã đủ — V6 cố tình chưa thêm
   nhãn để khỏi lệch hồi quy.

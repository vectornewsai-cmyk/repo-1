# LIMITS — Phase 9 đợt 65, luồng S6: keyframe 58–64 MiB đo trực tiếp + lý do fail-open timeout hiện cho user

Ngày: 08/11/2026 (lượt cron 15:35 +07). Đóng nợ #6, LIMITS R10 đợt 64
§8.6 + §1/§4 (luồng R4/R10): (a) keyframe 58–64 MiB chưa đo trực tiếp;
(b) lý do fail-open timeout chưa hiển thị cho user; (c) Safari chưa đo.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Keyframe High-profile 58–64 MiB ĐÃ ĐO TRỰC TIẾP (lần đầu):** 8 fixture
   High 53,1–63,5 MiB (testsrc2 8K + noise, libx264, yuv420p) — decode qua
   worker ở tải thấp cần **11–22 s (0,17–0,37 ms/KiB)**, tức trần 60 s có
   headroom 3–5× lúc yên; ở tải nặng (4 hog + 2 encode 8K) fixture 63,5 MiB
   cần **58,5 s** (vừa đủ trần) rồi **timeout ở lần tải nặng hơn**
   (elapsed 68,4 s) — trần 60 s chỉ bị chạm ở dải tải nặng, đúng như
   ngoại suy R10 (0,86–1,03 ms/KiB ở tải trung bình → 63,5 MiB cần ~56–67 s).
   Tỉ lệ 1,2 ms/KiB + trần 60 s GIỮ NGUYÊN — không có cơ sở đổi trần từ
   đợt này (xem §3).
2. **Lý do fail-open timeout NAY HIỂN THỊ CHO USER (đã kiểm chứng headed
   với timeout thật):** T3 gắn `trialDecodeNote` vào outcome gop-range khi
   trial-decode hết timeout; controller giữ qua getter `gopTrialDecodeNote`
   + hàm registry `reverseTrialDecodeTimeoutNotes()`; preview toast 1 lần
   (keyed, mẫu warnKey decode-ahead). Chuỗi qua key mới
   `gop.trial.timeoutNote` (fragment round65-s6, parent gộp sau); trước
   khi gộp, lookup trả đúng key nên code rớt về lý do timeout đã localize
   (`gop.trial.timeout`) — cả hai đường đều đã kiểm chứng (Node vi/en +
   headed fallback VI). Xem §1 + §4.
3. **Safari VẪN CHƯA ĐO ĐƯỢC** (không có trên VM — Linux x86_64, không
   binary Safari, không WebKit trong Playwright cache; chỉ có Chromium +
   Firefox). Ghi rõ, không bịa số. Xem §5.
4. **Test Node mới 15/15; hồi quy GOP xanh trừ O6 16/18 là flake thời
   gian do tải (chạy lại lúc yên: 18/18 — xem §6.3); tsc web/desktop 0;
   vite build pass.**

## 1. Thay đổi code (đợt này)

| File | Đổi | Nội dung |
|---|---|---|
| `apps/web/src/lib/gopTrialDecode55L8.ts` | Thêm | `isTrialDecodeTimeoutReason(reason)`: nhận biết lý do timeout qua tiền tố `timeout-<ms>ms` (mọi lý do timeout đều có tiền tố này, cả fallback VI lẫn giá trị dict `gop.trial.timeout` vi/en; các lý do fail-open khác không có). |
| `apps/web/src/lib/gopRangeFetch39T3.ts` | Thêm/sửa | `trialDecodeTimeoutNote(lookup, trialReason, timeoutMs, sampleBytes)`: soạn ghi chú timeout qua key `gop.trial.timeoutNote` (fragment round65-s6); lookup chưa có key (trả đúng key, đúng hợp đồng `t()`) hoặc vắng thì rớt về `trialReason` — lý do timeout đã localize sẵn. Không dùng `trKey` cho key này (key chưa vào dict nên trKey sẽ bị test P7 báo TRKEY-UNKNOWN-KEY — mẫu fragment R8 đợt 64). Thêm `trialDecodeNote?: string` vào outcome gop-range (chỉ khi timeout; spread có điều kiện để không thêm trường `undefined` làm vỡ deepEqual test cũ). Cả 2 mode (stream + all) đều gán khi `trial.skipped && isTrialDecodeTimeoutReason(trial.reason)`. |
| `apps/web/src/lib/reverseWebcodecs.ts` | Thêm | Controller giữ `gopTrialDecodeNoteValue` từ outcome (null khi không timeout / fallback / dispose); getter `gopTrialDecodeNote`; hàm registry `reverseTrialDecodeTimeoutNotes()` (khử trùng giữa các controller, mẫu `reverseDecodeAheadWarnings` đợt 37 T2). |
| `apps/web/src/preview.tsx` | Thêm | `refreshDecodeAheadUi`: toast keyed 1 lần mỗi khi tập ghi chú timeout đổi (mẫu warnKey decode-ahead ngay trên nó; chuỗi T3 đã localize, hiển thị nguyên văn). Toast chỉ bắn khi đang phát ngược (hàm này chạy mỗi tick) vì trial-decode chỉ chạy ở đường GOP phát ngược. |
| `apps/web/src/i18n/fragments/round65-s6.json` | Mới | 1 key `gop.trial.timeoutNote`, vi + en, placeholder `{size}` `{timeout}` khớp, vi khác en. Parent gộp vào dict sau (lúc đó P7/orphans cập nhật 2283 → 2284 — luồng này KHÔNG sửa vi.json/en.json để tránh collision với 9 luồng song song). |
| `apps/web/src/lib/gopTrialDecode65S6.test.ts` | Mới | 15 test (§6.1). |
| `apps/web/tsconfig.json` | Sửa | Thêm 1 dòng exclude cho test mới (tiền lệ J6/K8/…/R4/R10). |
| `docs/PHASE9_ROUND65_S6_LIMITS.md` | Mới | Tài liệu này. |

Chuỗi mới (fragment round65-s6):
- vi: `Keyframe đầu ({size} MiB) chưa kiểm chứng kịp trong {timeout} ms — file vẫn mở bình thường, chỉ là bước kiểm tra keyframe chưa xong.`
- en: `First keyframe ({size} MiB) could not be verified within {timeout} ms — the file still opens normally; only the keyframe check did not finish.`

Phạm vi ghi chú (quyết có chủ đích, theo đúng brief): CHỈ timeout
fail-open mới có ghi chú. `no-decoder` (không có VideoDecoder),
`unsupported-config` (decoder không hỗ trợ profile), `probe-error` là
trạng thái môi trường — không phải "chưa kịp kiểm chứng" — nên không
ghi chú, không toast. Sample > 64 MiB bỏ qua trial-decode từ trước (cap
Q5) nên cũng không có ghi chú (không có timeout nào xảy ra).

## 2. Đo trực tiếp keyframe 58–64 MiB (Chromium 158, headed)

Harness `~/scratch-round65-s6/` (runHeaded65S6.mjs + vdHeaded65S6.ts;
runHeaded65S6b/c.mjs + vdHeaded65S6b/c.ts; Xvfb :204/:205/:206, cổng
8947/8949/8951, debug 9441/9443/9445). Fixture gen bằng ffmpeg từ
testsrc2 8K + noise (công thức trong `gen-65s6.log` / `gen2/3/4/5-65s6.log`).

### 2.1 Gen fixture — bài học profile (quan trọng, đã thử sai)

- `crf 0` (lossless) → x264 chuyển sang **High 4:4:4 Predictive** dù đã
  `-pix_fmt yuv420p` (3 fixture 56,3 / 58,1 / 59,7 MiB).
- `-preset ultrafast` → **Constrained Baseline** (ultrafast dùng CAVLC,
  không CABAC): 61,9 / 63,6 MiB; alls=70/85 vọt 69,0 / 72,0 MiB (vượt
  trần trial 64 MiB, loại).
- Muốn **High 4:2:0 đúng chuỗi R10**: dùng `crf 1` + preset superfast /
  veryfast / medium, tăng nhiễu bằng **noise 2 tầng**
  (`noise=alls=100,noise=alls=N`) hoặc tăng chiều rộng lên 8192.
  Kết quả High (sample 0, đo bằng ffprobe packet đầu):
  53,10 / 54,57 / 57,52 / 58,94 / 59,56 / 62,56 / 63,14 / 63,54 MiB.
- **Điểm phụ profile khác (ghi rõ, KHÔNG trộn vào chuỗi High):**
  Baseline decode nhanh hơn hẳn (~0,05–0,06 ms/KiB, xem §2.2) — số
  Baseline/4:4:4 không dùng để kết luận về High.

### 2.2 Run a — direct RTD không trần + capped 60 s + T3 (tải thấp)

loadavgStart 0,26; cpuCalib 3410,6 → 1697,6 (yên dần trong lúc đo).
Direct = workerProbe trực tiếp, watchdog 240 s, 2 rep. Capped = qua
`planTrialDecodeCall` (trần worker 60 s). T3 = `fetchVideoTrackByGopRange`
stream-mode, probe mặc định.

| Fixture (High) | sample 0 | Direct rep 0 | Direct rep 1 | ms/KiB (rep 1) | Capped 60 s | T3 |
|---|---|---|---|---|---|---|
| vf-crf1-noise2x | 53,10 MiB | 17,800 s | 19,912 s | 0,366 | 16,262 s decode-ok | 11,166 s gop-range |
| med-crf1-noise2x | 54,57 MiB | 15,579 s | 15,368 s | 0,275 | 13,266 s decode-ok | 11,064 s gop-range |
| sf-noise100-30 | 57,52 MiB | 15,117 s | 11,412 s | 0,194 | 10,912 s decode-ok | 11,494 s gop-range |
| 8192-sf-crf1 | 58,94 MiB | 16,065 s | 11,258 s | 0,187 | 11,267 s decode-ok | 11,687 s gop-range |
| sf-noise100-50 | 59,56 MiB | 21,459 s | 11,909 s | 0,195 | 11,196 s decode-ok | 11,965 s gop-range |
| sf-noise100-90 | 62,56 MiB | 16,182 s | 11,596 s | 0,181 | 11,571 s decode-ok | 11,923 s gop-range |
| sf-noise2x | 63,14 MiB | 21,213 s | 11,258 s | 0,174 | 15,882 s decode-ok | 17,938 s gop-range |
| 8192-noise100-50 | 63,54 MiB | 16,448 s | 12,103 s | 0,186 | 11,642 s decode-ok | 12,477 s gop-range |

Điểm phụ (không phải High):
| Fixture | sample 0 | Direct rep 0 / rep 1 | Capped | T3 |
|---|---|---|---|---|
| sf-crf0 (High 4:4:4) | 59,71 MiB | 15,401 / 11,565 s | 21,803 s decode-ok | 29,510 s gop-range |
| uf-alls50 (Baseline) | 63,64 MiB | 3,304 / 4,081 s (0,051–0,063 ms/KiB) | 3,593 s decode-ok | 5,118 s gop-range |

Đọc số:
- **Ở tải thấp, 58–64 MiB High decode chỉ 11–22 s** — mọi lần đo đều
  decode-ok, không lần nào chạm trần 60 s. Rep 0 thường chậm hơn rep 1
  (decoder lạnh — cùng mẫu R10: direct 47,1 ms vs capped 39,8 ms ở
  49,7 MB); vf là ngoại lệ (rep 1 chậm hơn rep 0: 19,9 vs 17,8 s —
  nhiễu tải lúc đo, không phải quy luật).
- **Baseline nhanh hơn High ~3–4×** (3,3–4,1 s vs 11–21 s cùng cỡ) —
  đúng kỳ vọng CAVLC vs CABAC; đây là lý do số Baseline không được
  trộn vào chuỗi High.
- **Chênh không giải thích được:** fixture 4:4:4 capped 21,8 s / T3
  29,5 s, chậm hơn hẳn direct (15,4 / 11,6 s) trong khi các fixture
  khác capped/T3 ≈ direct rep 1. Ghi nhận là phương sai chưa giải
  thích, không bịa nguyên nhân (có thể do đường decode yuv444 của
  Chromium hoặc GC — chưa đo tách).
- Codec string xác nhận: High `avc1.64003C`, 4:4:4 `avc1.F4003C`,
  Baseline `avc1.42C03C`; 8192×4320 decode được bình thường
  (không unsupported-config).

### 2.3 Run b — controller (poll đúng) 0 hog + 4 hog

Run a đo controller SAI (xem §7.1) nên chạy lại với poll đúng (chờ
`gopMode === "gop-range"` hoặc `gopFallbackReason !== null`, tối đa
200 s; chỉ dispose sau khi đọc note):
- 8/8 fixture High, 0 hog: **gop-range, note null, elapsed 14,0–32,7 s**
  (T3 trial + fetch + setup) — đúng: decode-ok thì không có ghi chú,
  không toast. `registryNotes` rỗng, `toastSeen` rỗng.
- Fixture lớn nhất (63,54 MiB) chạy lại với **4 hog** (VM lúc đó yên,
  hogs mới bật 2 s): **gop-range sau 42,6 s, note null** — KHÔNG timeout
  (xem §2.4 để biết vì sao lần này chưa đủ tải).

### 2.4 Run c + d — ép timeout thật bằng tải nặng

- **Run c** (4 hog + 1 encode 8K chạy nền, loadavg lúc bắt đầu 0,77):
  controller 63,54 MiB **58.508,7 ms, gop-range, note null** — vừa đủ
  trần 60 s (headroom 1,03×). Tốc độ lúc này ≈ 0,90 ms/KiB.
- **Run d** (4 hog + 2 encode 8K chạy nền, loadavg lúc bắt đầu 4,29):
  controller 63,54 MiB **elapsed 68.410,9 ms → timeout-60000ms**,
  `gopTrialDecodeNote = "timeout-60000ms: trial-decode chưa xong, cho
  qua (fail-open)"`, `registryNotes = [note]`, `toastSeen = [note]`.
  **Chuỗi timeout → note → registry → toast đã chạy headed với timeout
  thật.** Note lúc này là chuỗi fallback VI (probe không truyền lookup —
  đúng hành vi tiền-gộp; đường chuỗi thân thiện vi/en đã kiểm chứng ở
  Node, xem §6.1).

## 3. Quyết chính sách trần: giữ 60 s + 1,2 ms/KiB (bằng số)

- **Không đổi trần:** ở tải thấp, 63,5 MiB cần tối đa 21,2 s (headroom
  2,8×); ở tải trung bình theo R10 (0,86–1,03 ms/KiB), 63,5 MiB cần
  ~56–67 s — trần 60 s bao được nửa dưới dải đó; ở tải nặng (run c/d),
  58,5 s vừa đủ rồi timeout — trần 60 s đúng là điểm cân bằng giữa
  "đủ bao tải trung bình" và "không bắt user chờ vô hạn". Kéo lên 70 s
  chỉ thêm được dải tải nặng một phần mà vẫn fail-open ở tải cực nặng
  (R10: 90–118 s cho 57,9 MB) — không đổi.
- **Tỉ lệ 1,2 ms/KiB giữ nguyên:** tốc độ decode đo được lúc nặng nhất
  có verdict thật là ~0,90 ms/KiB (run c) — 1,2 ≈ 1,33×; lúc yên
  0,17–0,37 ms/KiB. Không có số nào đòi sửa tỉ lệ.
- **Ngoại suy 64 MiB:** fixture lớn nhất đo được là 63,54 MiB (trần
  trial-decode 64 MiB của Q5 chặn sample lớn hơn); 64 MiB đầy đủ ngoại
  suy ~11–22 s lúc yên / ~57–68 s tải trung bình — không claim đã đo
  đúng 64,0 MiB.

## 4. Kiểm chứng đường hiển thị timeout (tóm tắt theo tầng)

| Tầng | Kiểm chứng | Kết quả |
|---|---|---|
| T3 gắn note khi timeout | Node: probe treo + timeout 60 ms, stream + all-mode | gop-range + note đúng chuỗi (cả fallback lẫn lookup vi/en) — 15/15 |
| T3 KHÔNG gắn note khi decode-ok / probe null / decode-failed | Node, cùng file test | decode-ok/probe-null → không có trường `trialDecodeNote`; decode-failed → full-file fallback (không phải ghi chú) |
| Controller giữ note | Node: getter null khi no-decoder; Headed run b: gop-range + note null khi decode-ok | đúng |
| Controller + registry + toast với timeout THẬT | Headed run d (tải nặng) | note + registry + toastSeen đều là chuỗi timeout-60000ms (§2.4) |
| Toast trong app thật (preview.tsx) | Chưa click-test app thật | Chỉ kiểm chứng bằng tsc + đọc code (call site keyed, mẫu warnKey đã headed-test ở các đợt trước) — **nợ còn lại, xem §6.5** |

## 5. Safari — chưa đo được (ghi rõ, không bịa số)

- VM này: Linux `htch-runtime 7.0.0-43-generic x86_64`.
- `which safari / Safari / webkit`: không có; `find / -maxdepth 4
  -iname "*safari*"`: không có.
- Playwright cache `~/.cache/ms-playwright/`: chỉ có
  `chromium-1187`, `chromium-1254`, `chromium_headless_shell-1187/1254`,
  `ffmpeg-1011/1013`, `firefox-1572` — **không có webkit**.
- Kết luận: không thể đo trial-decode/keyframe trên Safari từ VM này.
  Firefox đã đo ở đợt 63 (xem LIMITS đó), không đo lại ở đây.

## 6. Kiểm chứng gộp của luồng

### 6.1 Test Node mới `gopTrialDecode65S6.test.ts` — 15/15

- `isTrialDecodeTimeoutReason`: chỉ nhận đúng lý do timeout (9 case,
  gồm cả `timeout-60000ms: ...` vi/en, loại `no-decoder` /
  `decode-failed` / `unsupported-config` / `probe-error` / rỗng /
  `timeout-ms` thiếu số); `runTrialDecode` + probe treo → reason
  timeout, helper nhận ra.
- `trialDecodeTimeoutNote`: lookup vi từ fragment → `Keyframe đầu
  (59.7 MiB) chưa kiểm chứng kịp trong 60000 ms...`; lookup en →
  `First keyframe (63.6 MiB) could not be verified within 60000 ms...`;
  lookup tiền-gộp (trả đúng key) → rớt về lý do timeout; không lookup
  → rớt về lý do timeout.
- Fragment: đúng 1 key `gop.trial.timeoutNote`, placeholder
  `{size}`/`{timeout}` khớp vi/en, vi khác en.
- T3 stream-mode (fixture MP4 thật qua HTTP server, probe treo +
  timeout 60 ms): gop-range + note đúng chuỗi fallback; + lookup vi/en
  → note thân thiện đúng locale; decode-ok / probe null → KHÔNG có
  trường `trialDecodeNote`; decode-failed → full-file.
- T3 all-mode: probe treo → gop-range + note.
- Controller (Node): gop-range ở Node (không có VideoDecoder → skip
  no-decoder, không timeout) → `gopTrialDecodeNote` null,
  `reverseTrialDecodeTimeoutNotes()` rỗng.
- LƯU Ý thời gian: lần đo T3 timeout trong test Node là 700 ms / 1205 ms
  end-to-end (2 lần chạy) trong khi timeout chỉ 60 ms — đã điều tra
  bằng probe thời gian riêng (`timing-probe`): fetch thô HEAD+1KB đã
  107–191 ms trên VM tải nặng, T3 làm 4+ fetch nối tiếp nên phí fetch
  chiếm phần lớn; timer trial vẫn đúng 60 ms (lý do ghi `timeout-60ms`).
  Không phải trial-decode chậm.

### 6.2 Hồi quy

- Chạy lại (script `~/scratch-round65-s6/run-regression-65s6.sh` +
  `run-regression-65s6b.sh`): U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10, E2blob
  8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18, reversePlayback
  10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11, D4 3/3, B6 8/8,
  Z6 10/10, saveToast31 15/15, structuredNotes32 12/12, errorDetail34Q4
  35/35, L8 23/23, M10 28/28, N10 17/17, N6 32/32, **O6 16/18 (xem
  §6.3)**, P6 16/16, Q5 15/15, R7 6/6, R4 19/19, R4-63 13/13, R10-64
  11/11, **S6-65 15/15**, P7 8/8, orphans 16/16, diagnostic61R6 22/22,
  i18nRound57N4 14/14, validationErrors63R5 8/8, bridgeErrors62R5 9/9.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (apps/web, outDir scratch
  `~/scratch-round65-s6/build`): **pass trong 10,55 s**; worker chunk
  `gopTrialDecodeWorker62R4.worker-DvsAAzGW.js` emit; bundle chứa `6e4`
  (trần 60 s). Chỉ cảnh báo chunk > 500 kB có sẵn.

### 6.3 O6 16/18 — flake thời gian do tải, KHÔNG phải hồi quy code

- 3 lần chạy O6 đều 16/18 nhưng **tập test đỏ khác nhau mỗi lần**:
  lần 1: probe-false verdictMs −662 ms, all-mode wait 725 ms,
  probe-true 1198 ms; lần 2: probe-true 994 ms + 1; lần 3: probe-false
  verdictMs −693 ms, all-mode wait 621 ms (tổng 1803 ms, baseline
  1182 ms). **Chạy lại lúc VM yên: 18/18.**
- Nguyên nhân: O6 đo thời gian chờ bằng hiệu (lượt probe treo − lượt
  probe-true baseline đơn mẫu). Test tự ghi phí fetch/demux ~400–700 ms
  và "dao động lượt chạy ~±100 ms" — nhưng trên VM lúc này (10 luồng
  đợt 65 + ffmpeg encode song song, loadavg 1-phút tới 8,74), phí
  fetch/demux mỗi lượt dao động ±700 ms (đo riêng: fetch thô HEAD+1KB
  đã 107–191 ms, T3 làm 4+ fetch nối tiếp) nên baseline đơn mẫu lệch
  hẳn, verdictMs âm / waitMs hụt ngưỡng.
- Vì sao không phải do code đợt này: 3 test đỏ đều nằm ở đường
  probe-true / probe-false-500ms — code mới chỉ chạy SAU verdict và
  chỉ khi `trial.skipped` (regex + 1 lookup, ~µs); đường probe-true
  (`skipped=false`) không chạm code mới chút nào; verdict (mode +
  lý do) của cả 3 test đều ĐÚNG, chỉ cửa sổ thời gian vỡ. R10 đợt 64
  chạy O6 18/18 trên VM yên hơn.
- Ghi nhận trung thực: O6 là test nhạy tải theo thiết kế (baseline đơn
  mẫu); đợt sau chạy hồi quy nên canh cửa sổ yên hoặc ghi rõ mức ô
  nhiễm như ở đây.

### 6.4 VM restart giữa chừng (09:04 UTC 08/11)

- VM/container restart lúc ~09:04 UTC: tiến trình systemd khởi động
  lại; 2 job nền nohup CHẾT theo — gen3 (encode vf-crf1-noise2x bị
  giết giữa chừng, để lại file 48 byte không moov — đã xoá, encode lại
  ở gen4) và regression phần 1 (dừng sau P6). Đã chạy lại: gen4 (vf /
  med / 8192 / noise100-30) + regression-b (từ Q5, xanh hết trừ O6
  §6.3). Không mất code (file repo còn nguyên). Ghi lại để đợt sau
  khỏi tưởng job nền sống qua restart.

## 7. Sự cố trong lúc làm (đã xử lý, ghi để đợt sau khỏi lặp lại)

### 7.1 Poll sai ở harness headed lần 1 — dữ liệu controller lần 1 VÔ GIÁ TRỊ

- Probe lần 1 poll `c.gopMode !== "off"` để kết luận T3 xong. Sai:
  `gopAttempted` được gán **đồng bộ** ngay khi T3 bắt đầu (trong
  `ensureWindowForTime`, trước `await fetchVideoTrackByGopRange`), nên
  getter `gopMode` trả `"full-file-fallback"` (attempted + chưa active)
  chỉ sau 0,3–1,6 ms — trong khi T3 còn đang decode 11–18 s. Probe đọc
  note lúc đó (null) rồi `dispose()` hủy luôn lần thử đang bay.
- Hậu quả: toàn bộ cột controller ở run a (8 fixture, gopMode
  full-file-fallback, elapsed ~1 ms, fallbackReason null) là **số đo
  của bug harness, không phải của code** — đã loại khỏi mọi kết luận,
  chỉ giữ cột direct/capped/T3 của run a (3 cột đó đo độc lập, không
  qua controller).
- Sửa ở lần 2 (vdHeaded65S6b.ts): poll tới khi `gopMode ===
  "gop-range"` (T3 xong + GOP bật) HOẶC `gopFallbackReason !== null`
  (T3 đã trả full-file/exception); chỉ dispose sau khi đọc note. Đây
  cũng là lưu ý cho harness sau này: `gopMode` không phân biệt "đang
  thử" với "thử xong mà fallback" — phải poll bằng cặp điều kiện trên.
  (Đây là ngữ nghĩa getter có sẵn, không phải bug sản phẩm: UI chỉ đọc
  `gopMode` sau khi setup xong nên không bị ảnh hưởng.)

### 7.2 pkill tự giết shell của mình

- `pkill -f load-loop.sh` khớp luôn dòng lệnh của chính exec đang chạy
  (chuỗi pattern nằm trong command) → exec bị SIGTERM. Sửa bằng pattern
  tự loại trừ `load-loop[.]sh`. Không mất dữ liệu (chỉ là job tải nền).

## 8. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Toast trong app thật chưa click-test:** đường registry → pushToast
   đã chạy headed (run d), call site trong `refreshDecodeAheadUi` mới
   chỉ kiểm chứng bằng tsc + đọc code (mẫu keyed giống toast warnKey đã
   headed-test). Cần 1 click-test phát ngược file keyframe lớn trong
   editor thật để thấy toast hiện.
2. **Trần 60 s vẫn fail-open ở tải nặng:** 63,5 MiB cần 58,5 s (1 encode
   nền) → timeout (2 encode nền). Đây là giới hạn có chủ đích, không
   phải bug (xem §3). Tải cực nặng (R10: 90–118 s cho 57,9 MB) vẫn vượt
   xa trần.
3. **64,0 MiB đầy đủ chưa đo trực tiếp:** fixture lớn nhất 63,54 MiB
   (trần trial-decode 64 MiB của Q5 chặn sample lớn hơn); 64 MiB ngoại
   suy từ đường cong §2.2, không claim đã đo.
4. **Phương sai chưa giải thích:** fixture 4:4:4 capped 21,8 s / T3
   29,5 s vs direct 15,4 / 11,6 s (§2.2); rep 0 vs rep 1 dao động lớn
   (11–21 s cùng fixture). Cần đo tách khi có cửa sổ yên.
5. **O6 nhạy tải theo thiết kế** (§6.3): baseline đơn mẫu; chạy hồi quy
   lúc VM bận sẽ đỏ giả — không phải hồi quy code, nhưng test nên được
   làm robust hơn ở đợt sau (vd baseline trung vị 3 lần).
6. **Safari chưa đo** (§5) — cần máy macOS / WebKit thật; không đo được
   từ VM này.
7. **Nợ cũ giữ nguyên (không đụng trong luồng này):** sample > 64 MiB
   vẫn bỏ qua trial-decode (Q5); keyframe thật bị đục lỗ giữa KHÔNG bắt
   chắc được (Q5 §6.3, O6 §6.1); `.github/workflows/ci-security.yml`
   403 chưa lên GitHub (repo vẫn chưa có CI chạy thật).

## 9. Môi trường chạy

- VM này, 4 vCPU / 8 GB (restart 1 lần lúc ~09:04 UTC giữa đợt, xem
  §6.4). Chromium playwright 1254 (Chrome 158.0.8127.18) headed qua
  Xvfb display riêng (:204/:205/:206), TMPDIR riêng; cổng HTTP
  8947/8949/8951, debug 9441/9443/9445.
- Lệnh chạy (từ gốc repo): esbuild bundle test rồi `node` trực tiếp
  (mẫu Q5/R4). Headed: `TMPDIR=.../tmp node runHeaded65S6*.mjs` trong
  `~/scratch-round65-s6/`.
- Tải nặng điều khiển bằng node busy-loop (endpoint `/hogs?count=N`
  của runner) + vòng lặp encode 8K (`load-loop.sh`, 1–2 tiến trình
  ffmpeg superfast crf 1 song song); loadavg + cpuCalib ghi kèm từng
  bước — đọc số kèm tải, không tin nhãn mức tải một cách mù.
- Fixture lớn chỉ làm mẫu đo, KHÔNG đưa vào batch: 8 fixture High
  53,1–63,5 MiB + 5 fixture profile khác (4:4:4 / Baseline) — công thức
  gen trong `gen-65s6.log`, `gen2/3/4/5-65s6.log`.

## 10. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI:

- `apps/web/src/lib/gopTrialDecode65S6.test.ts` — 15 test (§6.1).
- `apps/web/src/i18n/fragments/round65-s6.json` — 1 key `gop.trial.timeoutNote` (vi/en).
- `docs/PHASE9_ROUND65_S6_LIMITS.md` — LIMITS này.

ĐỔI:

- `apps/web/src/lib/gopTrialDecode55L8.ts` — thêm `isTrialDecodeTimeoutReason`.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — `trialDecodeTimeoutNote` + trường `trialDecodeNote` ở outcome gop-range (cả 2 mode).
- `apps/web/src/lib/reverseWebcodecs.ts` — getter `gopTrialDecodeNote` + `reverseTrialDecodeTimeoutNotes()`.
- `apps/web/src/preview.tsx` — toast keyed cho ghi chú timeout trong `refreshDecodeAheadUi`.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới.

KHÔNG ĐỔI: `vi.json`/`en.json` (key mới nằm trong fragment, parent gộp
sau — tránh collision với 9 luồng song song), `gopTrialDecodeWorker62R4.ts`
(trần 60 s + tỉ lệ 1,2 giữ nguyên), `gopTrialDecodeWorker62R4.worker.ts`,
mọi file production khác. Scratch + log ở `~/scratch-round65-s6/`
(probe headed run a/b/c/d, regression, build; file MP4 lớn chỉ làm
fixture đo, KHÔNG đưa vào batch).

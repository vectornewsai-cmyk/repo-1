# Đợt 81 I6 — ETA thật cho job AI dài (gap §9 / N4) — HOÀN THÀNH

Ngày: 10/11/2026 (lượt cron 18:35 +07). Nợ: `PHASE9_GAP_ANALYSIS.md`
§2.7 hàng N4 — "ước lượng thời gian vẫn chưa có" (sau đợt 80 H8 đã có
tiến trình + hủy thật cho caption/TTS/bgremove/scene/reframe).

## 1. Kết luận ngắn

Pipeline ETA đã có từ đợt 80 H8 (bridge `EtaTracker` → `etaSeconds`
trong event `progress` → `formatAiJobEta` → `AiJobProgress`), nhưng kiểm
chứng thực tế cho thấy còn 4 lỗ hổng — đợt này đóng cả 4, không bịa ETA:

1. **Không có trạng thái "đang ước lượng"**: khi `etaSeconds = null`
   (job mới chạy, < 2 sample trong cửa sổ 8s, hoặc tốc độ = 0),
   `formatAiJobEta` trả `""` và UI để trống — user không phân biệt được
   "ETA sắp có" với "ETA hỏng". Nay `AiJobProgress` hiện
   "Đang ước lượng thời gian còn lại…" (key mới `aiJob.etaEstimating`)
   mỗi khi job đang chạy mà chưa có ETA. Component chỉ render khi job
   đang chạy (mọi caller đều render có điều kiện theo busy/running/
   working) nên nhãn này không bao giờ hiện khi job không chạy.
2. **ETA > 1 giờ hiện dạng phút dài**: job dài (bgremove/reframe video
   dài, 0,43 fps) có ETA vượt 1 giờ, format cũ hiện "còn ~125 phút 30
   giây". Nay thêm nhánh giờ `aiJob.etaHours` ("còn ~1 giờ 5 phút").
3. **TTS mẫu trong TemplatePackModal không có progress/ETA/hủy**:
   `makeTts` gọi `readAiJobStream(res)` không handlers nên bỏ qua mọi
   event progress — user chỉ thấy nút "đang tạo" mà không biết còn bao
   lâu, và không hủy được. Nay nối `AiJobProgress` (% chunk thật + ETA)
   + nút Hủy thật (AbortController → bridge kill subprocess như
   TtsButton); hủy báo "Đã huỷ job." chứ không hiện "❌ AbortError".
4. **EtaTracker trả `null` thay vì `0` khi job xong quá nhanh**: nếu mọi
   progress event dồn trong cùng 1 ms (`dWall = 0`), check cũ trả `null`
   trước khi xét `remain <= 0` — event cuối (progress = 1) mang ETA
   null. Nay xét `remain <= 0 → 0` TRƯỚC `dWall/dDone` (sửa
   `server/bridge/src/aiProgress.js`, có unit test biên).
5. **E2E trước đây chỉ assert key `etaSeconds` tồn tại**, không assert
   giá trị thật (event có thể mang toàn `null` mà vẫn xanh). Nay assert
   **ETA hữu hạn > 0 giữa chừng + ETA 0 lúc xong** cho caption,
   translate, TTS, bgremove; reframe là ngoại lệ có lý do (xem §4.3).

- **i18n: +2 key `aiJob.etaEstimating` + `aiJob.etaHours`** (vi/en,
  dict 2461 → **2463** key lá lúc đo); pin số lượng dict ở 16 file test
  bump 2461 → 2463 kèm lý do trong comment (mẫu các đợt trước; số này
  là snapshot — các luồng đợt 81 khác còn thêm key, parent gộp sẽ chốt
  lại — xem §5.6). P7 8/8, orphans 16/16, r6-i18n-check PASS.
- **Không push/tag/binary.** `apps/web/dist/` KHÔNG stage.

## 2. Thay đổi code

### 2.1 Web — ETA hiển thị

| File | Đổi gì |
|---|---|
| `apps/web/src/components/AiJobProgress.tsx` | Khi `etaText` rỗng → hiện `i18nT("aiJob.etaEstimating")` thay vì để trống (job đang chạy, ETA sẽ có sau ≥2 sample). Không đổi props — cả 4 caller cũ (CaptionModal, TtsButton, BgRemovePanel, ExportPanel) tự hưởng, không sửa file caller. |
| `apps/web/src/lib/aiJobStream.ts` | `formatAiJobEta`: thêm nhánh `s >= 3600` → key `aiJob.etaHours` (`{hours}` giờ `{minutes}` phút). `""` khi null/NaN như cũ. |
| `apps/web/src/i18n/vi.json`, `en.json` | +2 key `aiJob.etaEstimating` ("Đang ước lượng thời gian còn lại…" / "Estimating remaining time…") + `aiJob.etaHours` ("còn ~{hours} giờ {minutes} phút" / "about {hours}h {minutes}m left"). File chung — xem §5.7. |

### 2.2 Web — TemplatePackModal (TTS mẫu)

| File | Đổi gì |
|---|---|
| `apps/web/src/components/onboarding/TemplatePackModal.tsx` | State `ttsJobProgress` + `ttsAbortRef`; `makeTts` tạo AbortController, fetch `/api/tts` kèm `signal`, `readAiJobStream(res, { onProgress })`, tải download kèm `signal`; render `AiJobProgress` khi `ttsBusy` (+ nút Hủy); outer catch: `AbortError`/`AiJobCancelledError` → `aiJob.cancelled` (mẫu TtsButton); `finally` reset `ttsBusy` + ref + progress. Escape vẫn bị chặn khi `ttsBusy` (pin Q10 giữ nguyên — user hủy bằng nút Hủy, `finally` mở lại modal). |

### 2.3 Bridge — EtaTracker

| File | Đổi gì |
|---|---|
| `server/bridge/src/aiProgress.js` | `EtaTracker.etaSeconds`: xét `remain <= 0 → 0` TRƯỚC check `dWall/dDone`. Trước đây job xong trong cùng 1 ms thì event cuối mang ETA `null`; nay luôn `0`. Không đổi cửa sổ 8s / ngưỡng ≥2 sample. |

### 2.4 Test — mới / sửa

| File | Đổi gì |
|---|---|
| `server/bridge/test/test-ai-progress-cancel.cjs` | [2] EtaTracker +4 biên: tốc độ 0 → null; 2 sample cùng timestamp (dWall=0) → null; đã xong (done=total, kể cả cùng timestamp) → 0; done vượt total → 0. [3] `createProgressSender` +1: event cuối done=total mang ETA 0. Tổng 59 → **64**. |
| `server/bridge/test/test-ai-progress-e2e.cjs` | +11 assertion ETA thật: caption/translate/TTS/bgremove mỗi job +2 (giữa chừng có ETA hữu hạn > 0; event cuối ETA 0); reframe +3 (giữa chừng > 0; progress cuối = 0.99; ETA cuối nhỏ > 0 và < 5 — xem §4.3). Tổng 37 → **48**. |
| `apps/web/src/lib/aiJobStream.test.ts` | `formatAiJobEta` +4 case giờ: 3599 → 59m59s; 3600 → 1h0m; 3661 → 1h1m; 7320 → 2h2m. Tổng vẫn **8** test (gộp trong 1 case). |
| 16 file test pin dict | Bump số lượng dict 2461 → 2463 (assert + comment chuỗi lịch sử ở `ProjectMenu.i18n55L1`, `codecProbeDebts76D8`, `errorDetail34Q4`, `speedWarnTooShortDead63R10`, `i18nModals80H7`, `i18nOrphans60Q4`, `i18nModals79G9`). Chỉ đổi số/comment, không đổi logic test. |

## 3. Số đo thật (kiểm chứng)

Máy đo: VM này (4 vCPU EPYC 9D25, CPU-only, Node 24). Stub thay model
thật — kiểm chứng cơ chế ETA, KHÔNG phải tốc độ model.

| Kiểm chứng | Lệnh | Kết quả |
|---|---|---|
| Bridge unit | `node server/bridge/test/test-ai-progress-cancel.cjs` | **64/64 pass** (59 cũ + 5 mới: tốc độ 0 → null, cùng timestamp → null, xong → 0, vượt total → 0, sender event cuối ETA 0) |
| Bridge E2E (HTTP thật, cổng 18798) | `node server/bridge/test/test-ai-progress-e2e.cjs` | **48/48 pass** (37 cũ + 11 mới; ETA giữa chừng > 0 ở cả 5 job, ETA cuối = 0 ở 4 job, reframe = 0.99 + ETA nhỏ > 0) |
| Web unit | esbuild `aiJobStream.test.ts` → node | **8/8 pass** (gồm 4 case giờ mới) |
| P7 i18n audit | esbuild `i18nAudit59P7.test.ts` → node | **8/8 pass** (dict vi==en==2463 key lá, 0 orphan) |
| Orphans Q4 | esbuild `i18nOrphans60Q4.test.ts` → node | **16/16 pass** |
| r6-i18n-check | `node apps/web/scripts/r6-i18n-check.cjs` | **PASS** (vi=2463 en=2463; 606 literal key; lưu ý: path đúng là `apps/web/scripts/`, không phải `scripts/` như LIMITS H8 ghi) |
| Pin modal (hồi quy) | esbuild → node | **captionModal60Q3 23/23, modalClasses59P4 33/33, modalCard58O4 24/24** |
| Pin TemplatePackModal | esbuild → node | **escapeForms60Q10 15/15, i18nAudit55L2 20/20, i18nAudit56M3 13/13, recordPackMedia61R5 8/8, templateContentLocale56M7 10/10, importProgress41W3 4/4** |
| Pin dict 2463 | esbuild → node | **saveToast31 15/15, structuredNotes32 12/12, i18nRound57N4 14/14, codecProbeUi75C6 16/16, i18nModals79G9 9/9, i18nModals80H7 13/13, reverseBadge46B6 8/8, reverseCompat44Z6 10/10, reversePlaybackI18n49E2 3/3, reverseToggleI18n48D4 3/3, ProjectMenu.i18n55L1 6/6, codecProbeDebts76D8 14/14, errorDetail34Q4 35/35, speedWarnTooShortDead63R10 5/5** |
| Reframe pin (kẹp 99) | `node server/bridge/test/test-reframe.cjs` | **20 assertions pass** (100% → clamp 99 giữ nguyên) |
| tsc web | `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| vite build | `npx vite build` (apps/web) | **pass** (built 44,61s) |
| Headed / click-test | — | **SKIP** (xem §5.8): Playwright Chromium download thất bại các đợt trước; VM browser không tới được 127.0.0.1:5173. |

## 4. Ma trận job: ETA có gì / chưa có gì

| Job | ETA THẬT | Ghi chú |
|---|---|---|
| Caption (`/api/caption`) | ✅ giữa chừng > 0, cuối = 0 (E2E) | Hiện ở CaptionModal qua `AiJobProgress` ("còn ~Xs" / "Đang ước lượng…" lúc đầu) |
| Translate (`/api/caption/translate`) | ✅ như caption | Cùng modal + cùng `jobProgress` state với caption |
| TTS (`/api/tts`) | ✅ chunk 4/4, ETA cuối = 0 (E2E) | TtsButton + TemplatePackModal (mới nối đợt này) |
| TTS clone (`/api/tts/clone`) | ✅ cùng route TTS (chung `streamTtsResponse` + `sendProgress`) | Chưa có E2E riêng cho clone (kế thừa từ H8 — route chung, không assert riêng) |
| Bgremove (`/api/bgremove`) | ✅ frame 9/9, ETA cuối = 0 (E2E) | BgRemovePanel |
| Reframe (`/api/reframe`) | ⚠️ ETA thật nhưng **không bao giờ = 0** | Xem §4.3 |
| Scene (`/api/scene`) | ❌ **không ETA** (không có progress thật — ffmpeg blocking; không bịa) | Chỉ có phase `scan` + spinner; ngoài phạm vi đợt này, giữ như H8 |

### 4.3 Reframe kẹp 99% — giữ nguyên, ghi rõ

`progressFromLine` của reframe (`server/bridge/src/reframe.js:71`)
kẹp pct tối đa **99** (`Math.min(99, ...)`), pin ở
`test-reframe.cjs:41` ("parse 100% → clamp 99") — chủ ý để 100% chỉ
hiện khi có event `done` (file MP4 chưa ghi xong khi frame cuối xử lý
xong). Hệ quả: progress cuối = 0.99, còn 1 đơn vị → ETA cuối là số nhỏ
> 0 (≈0,03s với stub, E2E assert < 5s), không phải 0. UI lúc đó hiện
"99% · còn ~0 giây" rồi event `done` tới ngay — không gây hiểu lầm
thực tế. Đợt này KHÔNG đổi kẹp 99 (đổi sẽ vỡ pin có chủ ý + thay đổi
ngữ nghĩa "100% = file đã ghi xong"); E2E assert đúng hành vi thật
thay vì ép ETA 0.

## 5. Giới hạn (trung thực)

### 5.1 ETA là ước lượng, không phải cam kết (kế thừa H8 §5.2)

`EtaTracker`: cửa sổ trượt 8s, cần ≥2 sample; tốc độ thay đổi (model
warmup, frame khó/dễ) thì ETA nhảy. Tính từ sample đầu → cuối cửa sổ
nên job có tốc độ tăng dần (warmup xong chạy nhanh hơn) thì ETA đầu
ước cao hơn thực tế. UI hiện "~" (dấu xấp xỉ) là đúng bản chất.

### 5.2 Cửa sổ 8s + sample cũ không bị loại hẳn

`push()` chỉ loại sample cũ khi còn > 2 sample (`while (length >
ETA_MIN_SAMPLES && samples[0].at < cut)`) — job stall > 8s giữa 2
event progress (vd bgremove frame khó, model swap) thì ETA tính từ
sample đầu đã cũ, tốc độ đo được thấp hơn thực tế lúc chạy lại. Chưa
đo stall thật trên model thật (stub đều đều 300–400ms/event).

### 5.3 Scene không có ETA — ngoài phạm vi, không bịa

Scene detection chạy ffmpeg blocking, không có nguồn progress thật nên
không có tốc độ để ước lượng. Muốn ETA cho scene phải đổi `scene.py`
sang stream progress (đọc frame/timecode từ ffmpeg stderr) — việc
riêng, không làm trong đợt ETA này.

### 5.4 TTS clone chưa có E2E riêng

Clone dùng chung `streamTtsResponse` + `sendProgress` với TTS thường
nên ETA đi cùng đường code; E2E đợt này chỉ assert TTS thường. Muốn
chắc chắn tuyệt đối thì thêm section E2E cho `/api/tts/clone` (stub
clone chưa có) — nợ nhỏ.

### 5.5 onboardingOt56M8 đỏ 1 check — CÓ SẴN, không phải của luồng này

`onboardingOt56M8.test.ts` chạy 6/7: check `ot(): trả đúng từng chữ
fragment` fail ở `vi pack.back` — `ot("pack.back")` trả chính key vì
`vi.json`/`en.json` **không có key `pack.back`** (fragment
`round56-m8.json` có, mtime 07/11 — từ đợt 56, không phải do đợt này).
Key này không caller nào dùng (chỉ xuất hiện trong test) nên nhiều
khả năng đã bị dọn như key mồ côi ở một đợt orphan-cleanup trước, làm
vỡ test M8. Luồng này KHÔNG sửa (thêm key mồ côi vào dict chỉ để test
xanh sẽ bị orphan audit dọn lại; việc thuộc về luồng i18n / parent).
Ghi rõ để parent xử lý: hoặc nối `pack.back` vào dict (và pin orphans
chấp nhận), hoặc sửa test M8 bỏ key chết này.

### 5.6 Pin dict 2463 là snapshot — luồng song song đợt 81 còn thêm key

Lúc luồng này đo, dict = 2463 (2461 + 2 key của luồng này). Các luồng
đợt 81 khác đang sửa cùng `vi.json`/`en.json` song song (thấy trên đĩa
lúc stage: file clicktest-81i7/81i8, 81i4, 81i10, 81i1…) nên số cuối sau
parent gộp sẽ lớn hơn 2463; pin 2463 trong batch này chỉ đúng với
snapshot của riêng luồng này. Parent gộp phải bump lại pin theo dict
cuối (mẫu các đợt trước).

### 5.7 vi.json/en.json là file chung

2 key mới của luồng này nằm trong file chung mà nhiều luồng cùng sửa.
Batch stage liệt kê `vi.json`/`en.json` với trạng thái lúc stage (chứa
key của luồng này + mọi key đã có lúc đó); parent gộp phải hợp nhất
dict, không lấy nguyên file của một luồng đè lên luồng khác.

### 5.8 Headed / click-test chưa làm

Playwright Chromium download thất bại các đợt trước; VM browser không
tới được 127.0.0.1:5173. Chưa click-test nhãn "Đang ước lượng…" /
"còn ~Xs" / nút Hủy TTS mẫu trên browser thật. Kiểm chứng thay thế:
E2E HTTP thật (48/48 — ETA số thật qua wire) + unit (64/64 + 8/8) +
tsc + vite build. Tầng UI chỉ còn rủi ro wiring (AiJobProgress render
có điều kiện theo busy — đã qua tsc, chưa qua tay người bấm).

### 5.9 MCP không được hưởng ETA mới

Như H8 §5.7: MCP gọi trực tiếp Python script, không qua bridge HTTP —
tool MCP vẫn chạy đồng bộ như cũ, không có progress/ETA. Chỉ web UI
(qua bridge) được hưởng.

### 5.10 Desktop không đụng

Không đổi code `apps/desktop`; desktop dùng web UI nên tự hưởng UI mới
khi build lại, không cần kiểm chứng riêng đợt này.

## 6. Tương thích ngược

- Không đổi format NDJSON, không thêm event mới, không đổi route nào:
  `etaSeconds` đã có trong event `progress` từ H8; đợt này chỉ dùng
  nó đầy đủ hơn ở UI + sửa 1 thứ tự check trong `EtaTracker`.
- `formatAiJobEta` thêm nhánh giờ cho `s >= 3600` — hành vi với ETA <
  1 giờ giữ nguyên từng chữ (test cũ vẫn xanh).
- `AiJobProgress` hiện thêm nhãn ước lượng khi `etaText` rỗng — chuỗi
  status dài hơn 1 đoạn ("… · Đang ước lượng thời gian còn lại…");
  không đổi layout (cùng 1 dòng `<p>`, cùng nút Hủy).
- TemplatePackModal: `makeTts` thêm AbortController + progress state;
  hành vi thành công giữ nguyên (cùng file WAV, cùng toast done);
  hủy giữa chừng nay báo "Đã huỷ job." thay vì chạy nền tới cùng
  (trước đây đóng modal/Esc bị chặn nhưng job vẫn chạy nền — xem
  comment Q10 trong file; nay user hủy được thật).

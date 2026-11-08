# LIMITS — Phase 9 đợt 66: GỘP PARENT (merge + kiểm chứng + stage)

Đợt 66: 10 luồng T1–T10, chạy cron 18:35 08/11/2026, chủ đề "đóng 9 nợ mở
của đợt 65" (docs/PHASE9_ROUND65_LIMITS.md §8). Cả 10 luồng đều xong, batch
+ LIMITS + log đầy đủ trên đĩa (kiểm chứng trực tiếp, không tin handoff).
Parent gộp ngay, không chờ. KHÔNG push.

## 0. Kết quả gộp — số thật

| Hạng mục | Số |
|---|---|
| Dict i18n sau gộp | **vi = en = 2326 key lá, 0 lệch tập key, 0 orphan** (trước gộp 2297) |
| Fragment gộp | T7 27 + T8 2 = **29 key**, 0 collision, placeholder khớp |
| Key vi==en giống hệt nhau | **52** (trước gộp 51; +1 `legacyAdopt.noHash`) |
| Batch luồng | **80 entry** (t1 2, t2 2, t3 1, t4 5, t5 7, t6 5, t7 11, t8 9, t9 35, t10 3) |
| Batch closing (parent) | `phase9-round66-closing.txt` (15 entry: dict + 12 snapshot + LIMITS gộp) |
| Tổng chờ push sau đợt 66 | **1431 entry / 160 file batch** (đếm trực tiếp, xem §6) |
| GitHub HEAD | vẫn **e2cb35e1** (đợt 50). KHÔNG push (lệnh đứng). |

## 1. Tóm tắt từng luồng (số của luồng, parent kiểm chứng lại ở §5)

- **T1 — vidstabtransform không xác định: TÌM RA CÁCH KHỬ.** Harness mới
  `server/render/src/test_round66_t1_vidstab.js` (C0 + E0–E14, mỗi cấu hình
  ×3, cùng input + cùng `.trf`). Loại trừ: encoder x264, OpenMP, rand/fit
  (`.trf` byte-identical ×3), decode, filter-graph threading, smoothing,
  gauss kernel, optalgo, optzoom, destbuf, thứ tự LM, tải hệ thống.
  **E4 `ffmpeg -threads 1` là cách khử duy nhất: XÁC ĐỊNH tuyệt đối — 0/150
  frame khác, spread MAD 0,0% / F2_V5 0,0%, byte-identical cả 3 lần** (sha
  tổng hợp `f4173e2b…09060`), MAD 2,3867 (mịn hơn mặc định 4,7–10,2), TB
  34,8s/lần. Mọi cấu hình khác KHÔNG xác định (spread MAD 12–92%).
  Phân biệt quyết định: E4 sửa được nhưng E5 (`-filter_threads 1`) không →
  nguồn nằm ở **decoder frame-threading**, không phải filter graph.
  Harness **10/10**, hồi quy S1 **27/27**. **Chưa sửa code sản phẩm** —
  quyết định ép `-threads 1` trong render/enhance thuộc đợt sau (cần đo
  hiệu năng decode đơn luồng trên clip lớn + footage thật/clip dài).
- **T2 — whip-pan thật + b_large:** footage koncert CC BY 4.0 (50fps,
  16,6–20,0 px/f sau chuẩn hoá 25fps, giữ phơi sáng 1/50s) + pan tổng hợp
  có motion blur quang học mô phỏng (~180°, tmix 4 sub-frame). **Ghost
  KHÔNG tăng theo tốc độ, dù có hay không có blur, tới ~49 px/f** (chênh
  blur vs không-blur +0,006→+0,021; pan thật vượt @0,7 = 0,331/0,337 trong
  dải chung 0,057–0,094). Cảnh báo denoise ≥0,7 giữ nguyên, mở rộng tới
  ~49 px/f cả khi có blur. **Quyết định metric: GIỮ b_small làm chính;
  b_large chỉ làm chỉ báo phụ** (tách 3,16–3,90× trong lab có kiểm soát
  nhưng CV=0,43 trên footage thật, gấp đôi b_small 0,23, không theo độ
  phẳng). Harness mới **119/119** (run 2, exit 0; run 1 112/3 fail do 1
  assert kiểm blur sai tiền đề, đã vá).
- **T3 — resample viewport noise: CHƯA KHỚP toàn diện (kết luận trung
  thực).** Trong 24 tổ hợp (3 cửa sổ × 2 mức nhiễu × 4 phép resample),
  chỉ **3/24 KHỚP-THỐNG-KÊ — cả 3 đều chrome-rgb** (noise05 w1920, noise10
  w1920, noise10 w2560); chrome-yuv / ffmpeg-bilinear / ffmpeg-lanczos:
  0/18. Preview đã dùng phép khớp nhất (Chrome canvas `drawImage`,
  `imageSmoothingQuality="high"`); render dùng FFmpeg `scale` mặc định
  bilinear. Đính chính tiền đề giao việc: "noise10 chrome-rgb KHỚP ở cả
  2 cỡ" là sai — nó LỆCH ở w1440 (std G 0,76 < 0,85). Node-sim: full-res
  KHỚP cả 2 mức (model N3 vẫn đúng) nhưng không tái tạo vết lõm std w1440
  → phần dư nằm ở bộ lọc Chrome thật ở s≈0,38, không kernel đơn nào fit
  được. **Không sửa code** (không flag FFmpeg nào tái tạo bộ lọc Chrome;
  chỉnh N3 để bù resample sẽ phá khớp full-res). Batch chỉ 1 entry (LIMITS).
- **T4 — sharpen HYB4 + kCb/kCr: ĐÓNG nợ sharpen XẤP XỈ ở full-res.**
  Hybrid theo kênh (excess_est > 4 → direct từ R0_est, ngược lại
  delta-add), hằng số riêng sharpen kCb/kCr = 1,04/1,09 (noise giữ
  1,04/1,12). **Full-res pre-encode, code production thật: KHỚP 8/8**
  (testsrc2 0,070/99,8% + 0,095/99,7%; slovenska, basgo, ocean 99,7–100%;
  S7 cũ 98,3%). Headed vẫn XẤP XỈ (le8 tốt nhất 98,5% w1920 sharp05):
  nguyên nhân là **sàn decode Chrome-vs-ffmpeg** (plain 1,165 MAD ngay
  cả khi không resample), nhánh direct khuếch đại nó; MAD 0,72 < sàn plain
  1,17 nên dưới ngưỡng thấy được. kCb/kCr trên nội dung tự nhiên thật
  (slovenska/basgo/ocean): hồi quy pooled U 1,010 / V 1,024 → **giữ
  1,04/1,12, không hiệu chỉnh theo nội dung**. Unit **15/15**, parity
  **15/15**, tsc 0, vite build pass, headed 7/7 × 4 cỡ.
- **T5 — FPS 1080p + backport bug n=0:** sửa gốc rễ bug n=0 trong
  `clicktest-64r3-fps-long.mjs` + backport sang các harness FPS tương tự.
  Presented 1080p trong app, tải nặng (3 rep × 10 s): **mean 18,24 fps
  (13,25–23,78, std 4,32)**, rep tốt nhất 23,78; rVFC 9,54 vs presented
  17,88 ở tab trắng (rVFC đếm thiếu hệ thống). Presented 1080p lúc lặng
  CHƯA ĐO ĐƯỢC (2 lần thử chết vì tải VM vọt; harness từ chối ghi số rác
  đúng thiết kế). Knob mới `R8_PRES_RES` (720|1080, mặc định 720). FPS GPU
  thật vẫn chưa đo (VM không có GPU).
- **T6 — keyframe đúng 64,0 MiB + toast timeout click-test:** fixture
  `bigkey-64mib.mp4` sample0 đúng 67.108.864 B (framemd5 3/3 giống gốc).
  Tải thấp: direct 40,4s (0,617 ms/KiB) và 50,3s (0,768 ms/KiB) — **dưới
  trần 1,2 ms/KiB và 60 s (biên ~11,5 s), không chạm trần**. Tải nặng:
  trial timeout 60 s, fail-open đúng (note + toast đã set). Click-test
  toast trong app thật **PASS (H/C/S)**: toast đúng từng ký tự ở +85.970
  ms dưới tải nặng. **Blocker phát hiện + sửa thật:** import clip 64 MiB
  treo >240 s vì `captureVideoThumb()` chờ `onloadeddata` không timeout —
  nay timeout 5 s (đồng bộ `LOAD_TIMEOUT_MS`), import còn 7,9–10,4 s.
  Test: 63R4 13/13, 64R10 11/11, 65S6 15/15, 66T6 9/9, captureThumb 2/2,
  O6 18/18, tsc web/desktop 0, vite build pass. Safari vẫn chưa đo.
- **T7 — UI nhận mảnh legacy thủ công:** modal mới
  `LegacyHistoryAdoptModal.tsx` (mỗi mục hiện đủ bằng chứng: nguồn, loại,
  tên, hash nhúng, hash đang mở, số version, mốc đầu/cuối, lý do mơ hồ;
  Nhận/Bỏ qua từng mục + Nhận/Bỏ qua tất cả). Nối autosave-restore
  (App.tsx, chạy nền sau `replaceProject`) + nhập archive. "Bỏ qua" bền
  theo id chuỗi qua localStorage (dữ liệu kho không xóa). Fragment riêng
  27 key `legacyAdopt.*` (parent gộp, xem §2). Unit mới **16/16**, hồi quy
  S9 **43/43**, projectHistory 15/15, projectId 27/27, tsc 0, vite build
  pass, **headed thật 7/7** (modal hiện 2 mục → Nhận mảnh → Bỏ qua con
  trỏ → reload không hiện lại; 0 lỗi trang). Lưu ý: modal hiện key thô
  cho tới khi gộp fragment (đúng tiền lệ đợt 65).
- **T8 — resume job + nút ngôn ngữ TopBar:** mở lại ExportPanel nối job
  `running`/`queued` mới nhất qua `GET /api/render` (đúng job id,
  progress/ETA/queue/note, poll tiếp 1s); job `error`/`interrupted` →
  trạng thái lỗi + note phục hồi + nút "Render lại từ đầu" (endpoint retry
  đã có). Gốc rễ nút cờ: `.topbar` z-index 30 tạo stacking context, kẹt
  dưới backdrop z 400 → bỏ z-index `.topbar`, nút cờ class riêng
  `.topbar-lang-btn` z 401 (dưới tour-card 450/toasts 500). Unit mới
  **26/26**, hồi quy S10 13/13, R8 19/19, tsc 0, vite build pass, **headed
  8/8** (resume đúng job id, nút cờ bấm được desktop + mobile 390px,
  SIGKILL → interrupted → retry → running; 0 lỗi trang). Fragment riêng
  2 key (parent gộp, xem §2).
- **T9 — rà soát test spawn bridge:** quét toàn repo, **vá 32 file
  test/script chưa cách ly (35 site)** + 1 thay đổi production duy nhất:
  `serviceManager.js` suy ra `BRIDGE_RATE_PERSIST_PATH` từ `userDataDir`
  (test desktop mkdtemp tự cách ly; app thật vẫn persist qua restart;
  tách app desktop khỏi bridge dev vốn chia sẻ file mặc định). Test hồi
  quy mới `test-bridge-persist-audit.cjs` (tĩnh): **76/76 lúc quét xong**.
  Kiểm chứng: **4 suite e2e chạy song song 165/165 + 40/40 + 170/170 +
  25/25** (trước đợt 65 chỉ riêng e2e đã tụt 165→128); unit 142/142 +
  108/108; shell suite liên quan xanh hết. Sửa thêm 3 lỗi test-only phát
  hiện lúc kiểm chứng (literal lệch cli-proxy, race khởi động bridge
  ~4,2s → poll `/api/health` 30s, bridge-queue đọc 2 curl riêng).
  Xem §3: audit bắt đúng 1 file T8 tạo sau lúc quét — parent đã vá.
- **T10 — ci-security.yml + docs trạng thái:** rà soát, KHÔNG sửa workflow
  (không lệch: 2 job, 3 lockfile + 5 requirements pin `==` khớp repo;
  vẫn LOCAL-ONLY do 403, không thử push, không có trong batch). **Quét
  CVE local thật (lần đầu chạy được cho Python):** caption/reframe/
  tracking sạch; **tts 39 lỗ hổng** (toàn bộ Pillow 12.3.0 transitive qua
  cây vieneu, fix 13.0.0); **bgremove 66 lỗ hổng** (rembg 2.0.60: 4, fix
  2.0.75/2.0.82; Pillow 10.2.0 pin trực tiếp: 62 dòng, fix 10.3.0–13.0.0).
  **Chưa bump pin** — cần đợt riêng verify pipeline bgremove/TTS; job
  pip-audit trong workflow sẽ ĐỎ ở lần chạy CI đầu tiên. `npm audit` vẫn
  bị chặn 403 `policy_denied`; OSV API không bị chặn (đính chính SECURITY.md
  §2.6). Cập nhật `SECURITY.md` + `docs/FEATURE_STATUS.md` (i18n 2297 key
  lúc đó, GPU probe fallback, rate limiter global cap, trần GOP 60s,
  presented FPS, registry legacy 43/43; đính chính noise/sharpen, FPS
  blend, nút ngôn ngữ TopBar).

## 2. Gộp fragment — chi tiết

- Nguồn: 2 fragment `round66-t7.json` (27 key `legacyAdopt.*`),
  `round66-t8.json` (2 key `exportPanel.resumedJob`/`retryRender`).
  **Không có collision** (key chưa từng có trong dict), vi==en cùng tập
  key từng fragment, placeholder khớp.
- Sau gộp: vi == en == **2326 lá**, cùng tập key, 0 mismatch, 0 orphan
  (P7 8/8, orphans 16/16). Key vi==en giống hệt: **52** (trước gộp 51;
  +1 `legacyAdopt.noHash`).
- Script gộp của parent: `hidden_files/round66-merge-i18n.cjs` (deep-merge
  có assert: key đã tồn tại → fail; vi/en lệch → fail; placeholder lệch
  → fail). Đính chính: lần đếm đầu của parent bằng script node một dòng
  cho 260 là **sai do bug script** (đếm lại độc lập bằng Python: 52,
  khớp dự tính 51+1 và khớp assert P7/orphans sau khi cập nhật).
- Snapshot số key 2297 → 2326 ở 13 file (12 test web + 1 cjs server);
  comment lịch sử giữ nguyên số 2297 (chỉ dòng assert/tên test/mô tả
  trạng thái hiện tại mới đổi — bài học đợt 64 §7). Đồng thời cập nhật
  assert số key giống hệt 51 → 52 ở P7 + orphans (kèm comment ghi rõ
  +1 key nào, từ fragment nào).

## 3. Sửa đỏ do gộp + vá chéo luồng (parent làm, đã xanh lại hết)

1. **Audit T9 75/76 — file T8 tạo sau lúc quét:** T8 tạo
   `apps/web/scripts/clicktest-66t8-resume-job-headed.mjs` (spawn bridge
   dòng 397, thiếu persist) sau khi T9 quét xong; bridge của T8 đã tạo
   `~/.cache/vcut/rate-limit.json` lúc 12:09. Parent vá: thêm
   `BRIDGE_RATE_PERSIST_PATH: path.join(workDir, \`rate-limit-${process.pid}.json\`)`
   vào `startBridge` (cả 2 bridge instance trong script dùng chung file —
   đúng vì cùng 1 lượt test) + đăng ký file vào INVENTORY của audit test.
   Chạy lại audit: **78/78** (76 cũ + T8 + 1 site quét thấy thêm).
   File persist mặc định sót đã xóa sau khi không còn bridge nào chạy.
2. **Không có đỏ do gộp nào khác:** tsc web/desktop 0 ngay lần đầu sau
   gộp; vite build pass; mọi suite ở §5 xanh ngay lần đầu (trừ gop test
   cần `--format=esm` — lỗi cách gọi, không phải lỗi code; xem §7).
3. **File parent sửa thêm ngoài snapshot:** `server/bridge/test/
   test-error-detail-structured.cjs` (snapshot 2297→2326) và
   `test-bridge-persist-audit.cjs` (inventory +1) — cả hai đã nằm trong
   batch T9 (35 entry) nên bản cuối đã được bao phủ, không liệt kê lại
   ở batch closing; `clicktest-66t8-resume-job-headed.mjs` đã nằm trong
   batch T8 (9 entry), tương tự.

## 4. Căng thẳng đã giải quyết trong đợt (ghi nhận trung thực)

- **T1↔S1 (stabilize):** E4 `-threads 1` cho output xác định tuyệt đối,
  MAD 2,3867 mịn hơn hẳn mặc định — mọi đo stabilize trước đây (chạy đa
  luồng, spread 36–38%) đều bị nhiễu run-to-run lớn hơn hiệu ứng thật.
  Quyết định ép `-threads 1` vào render/enhance chưa làm (cần đo hiệu
  năng decode đơn luồng trước) — mọi đo stabilize chưa dùng `-threads 1`
  vẫn chạy ≥3 lần + báo spread.
- **T2↔S2/S3 (ghost):** b_large bị giáng cấp xuống chỉ báo phụ (không ổn
  định trên footage thật); cảnh báo denoise ≥0,7 nay có bằng chứng tới
  ~49 px/f cả khi có motion blur quang học.
- **T3↔S7 (noise):** resample viewport KHÔNG khớp toàn diện — preview đã
  dùng phép khớp nhất, phần dư nằm ở bộ lọc Chrome ở downscale mạnh, không
  có sửa nhỏ chắc chắn. Nợ này ở lại cho đợt 67.
- **T4↔S7 (sharpen):** HYB4 đóng nợ sharpen XẤP XỈ ở full-res (8/8 KHỚP);
  headed vẫn XẤP XỈ do sàn decode, không phải do estimator.

## 5. Kiểm chứng parent trên cây đã gộp

- tsc web **0** / desktop **0**; vite build **pass** (6,59s).
- P7 **8/8**, orphans **16/16**, r6-i18n-check **PASS**, saveToast31
  **15/15**, structuredNotes32 **12/12**, i18nRound57N4 **14/14**,
  reverseToggle **3/3**, reverseBadge **8/8**, reverseCompat **10/10**,
  reversePlayback **3/3**, ProjectMenu L1 **6/6**, speedWarn **5/5**,
  errorDetail34Q4 **35 pass**, validationErrors63R5 **8/8**,
  bridgeErrors62R5 **9/9**, error-detail-structured **170/170**,
  bridge-error-protocol unit **142/142**, error-detail-ui **52/52**,
  rate-limit unit **108/108**, bridge-error e2e **165/165**,
  rate-limit-global e2e **40/40**, persist-audit **78/78**,
  effectCanvas **15/15** + parity **15/15**, captureThumb66T6 **2/2**
  (qua runner), gopTrialDecode 63R4 **13/13** + 64R10 **11/11** + 65S6
  **15/15** + 66T6 **9/9** (qua esbuild `--format=esm`).
- Luồng (chạy lại bởi parent): T7 legacyAdopt **16/16**, S9 registry
  **43/43**, T8 resumeJob **26/26**.
- Lấy số từ log trên đĩa (không chạy lại toàn bộ harness render dài):
  T1 harness **10/10** + S1 **27/27**, T2 harness run2 **119/119**,
  T3 compare-report 3/24 KHỚP, T4 headed 7/7 × 4 cỡ, T5 presented 1080p
  (log luồng), T6 headed toast + keyframe 64 MiB (log luồng), T7 headed
  7/7, T8 headed 8/8, T10 pip-audit (log luồng).
- Chưa chạy lại trong đợt gộp: T2/T6 headed dài, T5 headed đầy đủ
  clicktest-64r3-fps-long sau backport (theo LIMITS luồng).

## 6. Tổng chờ push (đếm trực tiếp)

1336 sau đợt 65 + 80 entry luồng đợt 66 + 15 entry closing = **1431 entry /
160 file batch đang chờ** (đếm trực tiếp 2 cách khớp nhau: tổng thư mục
3329 − 1913 entry của 53 file đợt 1–50 đã push = 1416 trước closing;
1416 + 15 closing = 1431; số "1325" trong log T4 là đếm bằng cách khác,
không dùng). HEAD vẫn e2cb35e1. KHÔNG push.

## 7. Sự cố trong lúc gộp (đã xử lý)

- **Daemon restart giết 3 lượt subagent:** T1 lượt 1 + T3 lượt 1 chết
  (không checkpoint); T3 lượt 2 (chạy lại) chết lần nữa. T1 chạy lại
  tiếp nối trên đĩa (LIMITS + harness đã có, chỉ còn stage). T3 chạy
  lại lần 3 với phạm vi chốt ngắn (chỉ tổng hợp từ dữ liệu đã đo, không
  đo lại dài) và xong. Bài học: luồng đo dài nên ghi checkpoint giữa
  chừng; luồng chạy lại nên dặn tiếp nối trên đĩa ngay từ đầu.
- Handoff lượt chạy báo thiếu luồng (tiền lệ đợt 63/64/65): parent kiểm
  chứng trên đĩa — cả 10 batch + 10 LIMITS + 10 log luồng đều có đủ mới
  gộp. Riêng T5 handoff chỉ nói "đã báo cáo đầy đủ ở trên" — nội dung
  đầy đủ nằm trong `round66-t5.md` + build-loop-log + batch đã stage.
- Lần đếm key vi==en giống hệt đầu tiên của parent cho 260 là sai do
  bug script node một dòng; đếm lại độc lập bằng Python: 52 (xem §2).
- File `~/.cache/vcut/rate-limit.json` mặc định do bridge T8 tạo lúc
  12:09 đã xóa sau khi xác nhận không còn bridge nào chạy (ps trống).
- `/tmp` còn 476M trống lúc gộp (dưới ngưỡng 256MB của bridge thì bridge
  trả 507 — các luồng đã tự dọn scratch của mình; T4 còn dùng ~245M lúc
  chạy song song, đã dọn sau đó).

## 8. Nợ mở cho đợt 67 (tổng hợp từ §1 + LIMITS các luồng)

1. Ép `ffmpeg -threads 1` vào render/enhance để khử spread stabilize:
   đo hiệu năng decode đơn luồng trên clip lớn + footage thật/clip dài
   trước khi quyết (T1).
2. Noise headed vẫn LỆCH ở w1440 + noise05 w2560 sát nút: bộ lọc Chrome
   ở s≈0,38 chưa xác định (cần probe 2D/theo trục/GPU-vs-CPU); hướng áp
   nhiễu sau downscale chưa đánh giá thiết kế (T3).
3. Sharpen headed vẫn XẤP XỈ (sàn decode Chrome-vs-ffmpeg 1,165 MAD) —
   cần tách sàn decode khỏi estimator khi đo headed (T4).
4. Presented 1080p lúc lặng chưa đo được; mediaRate app (1,0x) vs tab
   trắng (0,579x) chưa giải thích; chạy lại headed đầy đủ
   clicktest-64r3-fps-long sau backport n=0 (T5).
5. Keyframe 64,0 MiB: trần 60 s chỉ còn biên ~11,5 s ở tải thấp; probe
   headed lần 1 treo không rõ nguyên nhân; toast timeout chỉ hiện khi
   phát ngược đang chạy hoặc bấm toggle (T6). Safari vẫn chưa đo.
6. "Bỏ qua" mảnh legacy chưa có UI mở lại; nhận tay không xác nhận lần
   2/không hoàn tác; archive chỉ nhận chuỗi đã có trên máy này; chưa
   headed đường nhập archive (T7).
7. Job `done` mở lại vẫn idle (cần UI lịch sử job); panel đang mở mà
   bridge restart thì poll chưa có nhánh `interrupted`; upload đang bay
   thì đóng panel không resume được (T8).
8. Bump Pillow/rembg + verify pipeline bgremove/TTS (tts 39 + bgremove
   66 lỗ hổng — pip-audit sẽ ĐỎ ở lần chạy CI đầu tiên); `npm audit`
   local vẫn bị chặn; README.md stale từ Phase 8 (T10).
9. `ci-security.yml` vẫn chờ quyền workflows (từ Phase 6).

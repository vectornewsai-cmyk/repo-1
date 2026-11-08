# LIMITS — Phase 9 đợt 66, luồng T10: tổng hợp + đóng nợ tài liệu (docs + ci-security.yml)

Ngày: 08/11/2026 (lượt cron 18:35 +07). Nhiệm vụ: tổng hợp + đóng nợ tài
liệu theo `docs/PHASE9_ROUND65_LIMITS.md` §8 mục 9 (`ci-security.yml` vẫn
chờ quyền workflows, từ Phase 6) + các nợ tài liệu khác. KHÔNG push,
KHÔNG release/tag, KHÔNG binary. Chỉ sửa file text trong
`~/workspace/repo-1`.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **`ci-security.yml` KHÔNG lệch — KHÔNG sửa file này.** YAML parse đúng,
   2 job (npm-audit 5 step + pip-audit 8 step), 3 lockfile + 5 requirements
   pin `==` đều khớp repo hiện tại; không có requirements/lockfile mới ở
   đợt 63–65. File vẫn LOCAL-ONLY (403 workflows từ Phase 6) và **không
   có trong batch stage** — đúng mẫu các đợt trước.
2. **Quét CVE local lần đầu chạy được thật cho Python:** `pip-audit`
   2.10.1 (venv tạm `/tmp`, OSV API) quét cả 5 requirements —
   caption/reframe/tracking SẠCH; **tts 39 lỗ hổng** (toàn bộ Pillow 12.3.0
   transitive, fix 13.0.0); **bgremove 66 lỗ hổng** (rembg 2.0.60: 4, fix
   2.0.75/2.0.82; Pillow 10.2.0 pin trực tiếp: 62 dòng, fix 10.3.0/
   12.2.0/12.3.0/13.0.0). **Chưa bump pin trong đợt này** — cần đợt riêng
   verify lại pipeline bgremove/TTS. Hệ quả: job pip-audit trong workflow
   sẽ ĐỎ ở lần chạy CI đầu tiên (thiết kế fail khi có BẤT KỲ lỗ hổng nào).
3. **`npm audit` local vẫn bị chặn** (403 `policy_denied`, policy registry
   nội bộ — verify lại 08/11). Nhưng **OSV API KHÔNG bị chặn** — đính
   chính SECURITY.md §2.6 (cũ ghi cả hai đều bị chặn, sai một nửa).
4. **FEATURE_STATUS.md cập nhật 6 điểm đợt 63–65** (i18n 2297 key, GPU
   probe fallback, rate limiter global cap, trần trial-decode 60 s,
   presented FPS, registry legacy) + 2 đính chính kèm theo (noise/sharpen
   S7, nút ngôn ngữ TopBar khi modal Export mở). Mọi số đều đối chiếu
   trên đĩa hoặc trích LIMITS luồng có kiểm chứng (xem §4).
5. **SECURITY.md sửa 3 chỗ stale:** pin bgremove (rembg 2.0.38→2.0.60,
   numpy 2.5.4→2.2.6, thêm onnxruntime 1.23.2 — đổi từ ROUND53-J8, tài
   liệu chưa theo kịp), "4 file" → "5 file" (§3.3), thêm §3.5 mới ghi
   kết quả pip-audit + §4.1 ghi chú rà lại đợt 66 T10.
6. **Không đụng code sản phẩm** nên không chạy lại tsc/vite build (không
   có gì để build — chỉ sửa 2 file `.md` + thêm LIMITS này). Kiểm chứng
   của đợt này là: đếm i18n trên đĩa, YAML parse, pip-audit thật, đối
   chiếu file/code cho từng điểm docs (xem §4).

## 1. ci-security.yml — rà soát (không sửa)

File: `.github/workflows/ci-security.yml` (local-only, chưa bao giờ lên
GitHub do 403 — KHÔNG thử push, đúng lệnh đứng).

| Hạng mục kiểm tra | Kết quả |
|---|---|
| YAML parse (`python3 -c yaml.safe_load`) | ✅ Đúng; jobs `npm-audit` (5 step) + `pip-audit` (8 step) |
| npm audit — root workspaces | ✅ Khớp: root `package-lock.json` bao 6 workspace (`apps/web`, `apps/desktop`, `packages/video-spec`, `packages/plugin-api`, `server/bridge`, `server/render` — kiểm bằng key `packages` trong lockfile) |
| npm audit — mcp-server / cli | ✅ Khớp: `mcp-server/package-lock.json` + `cli/package-lock.json` đều tồn tại; không có lockfile thứ 4 nào (file `server/tts/.venv2/.../package-lock.json` nằm trong venv gradio, không phải lockfile dự án) |
| pip-audit — 5 requirements | ✅ Khớp: cả 5 file tồn tại, mọi pin đều `==` (caption `faster-whisper==1.2.1`; tts `vieneu==3.8.3`, `numpy==2.5.4`; reframe `opencv-python-headless==5.0.0.93`, `numpy==2.5.4`; bgremove `rembg[cpu]==2.0.60`, `onnxruntime==1.23.2`, `opencv-python-headless==5.0.0.93`, `numpy==2.2.6`, `Pillow==10.2.0`; tracking `numpy==2.5.4`, `opencv-python-headless==5.0.0.93`) |
| Requirements/lockfile mới đợt 63–65 | ✅ Không có: `find server -name '*.py' -newermt 2026-11-07` (trừ venv) trả rỗng; grep `requirements` trong LIMITS đợt 64/65 chỉ trỏ về file đã có; không workflow mới (vẫn 5 file `.github/workflows/`) |
| Comment header workflow | ✅ Còn đúng: "5 requirements", "3 lockfile", tracking thêm ở đợt 63 R10 |
| Lệch duy nhất còn lại | Không có lệch nào về coverage. Ghi nhận quan sát (không sửa): step `pip install pip-audit` không pin version — CI sẽ kéo bản mới nhất; theo tinh thần pin-everything của K4 thì nên pin, nhưng đó là quyết định của parent (file local-only, chưa chạy thật lần nào) |

**Không sửa `ci-security.yml`.** Lý do: không lệch so với repo. Pin bgremove
đổi từ ROUND53-J8 (rembg 2.0.38→2.0.60, numpy 2.5.4→2.2.6, thêm
onnxruntime 1.23.2) nhưng workflow không pin version Python nào nên không
cần sửa workflow — chỉ SECURITY.md §3.3 là stale (đã sửa, xem §3).

## 2. Quét CVE local — số thật (pip-audit 2.10.1, 08/11/2026)

### 2.1 Cách chạy

- `pip-audit` chưa có sẵn trên máy: system pip bị chặn PEP 668
  (`externally-managed-environment`); cài vào venv tạm
  `/tmp/pip-audit-venv` (`python3 -m venv` + `pip install pip-audit` →
  2.10.1). Venv tạm này nằm ngoài repo, không đưa vào batch.
- `npm audit --audit-level=high` ở root: **bị chặn** —
  `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick
  - policy_denied` (policy `zz_managed_internal_spaces_package_registries`).
  Giống hệt ghi chú SECURITY.md §2.6. CVE npm vẫn chưa có số mới.
- Mỗi `pip-audit --requirement <file>` chạy riêng, output đầy đủ ghi file
  `/tmp/audit-tts.txt`, `/tmp/audit-bgremove.txt` (3 file còn lại in
  "No known vulnerabilities found"). Lưu ý vận hành: lần chạy đầu theo
  vòng lặp `| tail -12` đã **che mất exit code thật** (`$?` là của `tail`,
  luôn 0) và cắt output — lần chạy tts đầu tiên timeout 120 s không ra
  output (cây vieneu resolve lâu); đã chạy lại đầy đủ không timeout, lấy
  exit code trực tiếp của pip-audit (exit 1 = có lỗ hổng).

### 2.2 Kết quả

| Requirements | pip-audit exit | Kết quả |
|---|---|---|
| `server/caption/requirements.txt` | 0 | ✅ Sạch — "No known vulnerabilities found" |
| `server/tts/requirements.txt` | 1 | 🔴 **39 lỗ hổng, 1 package: Pillow 12.3.0** — toàn bộ fix 13.0.0 (18 PYSEC-2026-4326…4343 + 20 CVE-2026-11239x/11289x/11290x + CVE-2026-96638/96640/96778 + GHSA-78g4-xqwv-q3g8). Pillow là dep **transitive** qua cây vieneu (không có trong requirements trực tiếp). |
| `server/reframe/requirements.txt` | 0 | ✅ Sạch |
| `server/bgremove/requirements.txt` | 1 | 🔴 **66 lỗ hổng, 2 package** (xem §2.3) |
| `server/tracking/requirements.txt` | 0 | ✅ Sạch |

### 2.3 Chi tiết bgremove (66)

- **rembg 2.0.60 — 4 dòng:** PYSEC-2026-2274 ×2 (trùng ID do alias),
  GHSA-55v6-g8pm-pw4c, CVE-2026-115924. Fix: 2.0.75 (3 dòng đầu),
  2.0.82 (CVE-2026-115924).
- **Pillow 10.2.0 (pin trực tiếp) — 62 dòng** (có trùng ID do alias,
  số advisory phân biệt ít hơn): theo fix version — 2 dòng fix 10.3.0,
  4 dòng fix 12.2.0, 23 dòng fix 12.3.0, 33 dòng fix 13.0.0. Trong đó
  nhóm PYSEC-2026-4326…4343 + CVE-2026-11239x/11289x/11290x (fix 13.0.0)
  trùng với nhóm ở tts — cùng một đợt CVE Pillow 2026.
- Tổng 2 file đỏ: 39 + 66 = **105 dòng advisory** (số advisory phân biệt
  ít hơn do trùng alias; không đếm trùng làm số khác).

### 2.4 Đánh giá + quyết định không bump trong đợt này

- Mức độ thực tế: VCut là app local; Pillow chỉ đọc/ghi ảnh do user tự
  mở (không parse ảnh từ mạng); rembg chạy như library, không bật server
  (`rembg s` — xem SECURITY.md §3.4). Rủi ro thực tế thấp hơn con số 105
  gợi ý, nhưng KHÔNG coi là "không sao": CVE Pillow 2026 chủ yếu là lỗi
  parse ảnh (file ảnh độc hại có thể crash/lộ bộ nhớ).
- **Không bump pin:** Pillow 10.2.0 → 13.0.0 và rembg 2.0.60 → 2.0.75+
  đều cần verify lại pipeline thật (BiRefNet session ở 2.0.60 là lý do
  pin này tồn tại — ROUND53-J8; chưa biết 2.0.75/2.0.82 còn giữ session
  đó và còn chạy trên Python 3.10 không; cây vieneu/TTS chưa biết có
  tương thích Pillow 13 không). Bump không verify sẽ vi phạm luật trung
  thực. Ghi thành nợ mở (§6) + ghi vào SECURITY.md §3.5 mới.
- Hệ quả trước mắt: job `pip-audit` trong workflow fail khi có BẤT KỲ lỗ
  hổng nào (thiết kế có chủ ý, chặt hơn high/critical) nên **job này sẽ
  ĐỎ ở lần chạy CI đầu tiên** cho tới khi bump pin xong. Không được nới
  lỏng job thành `continue-on-error` im lặng (workflow đã ghi rõ).
- Đính chính SECURITY.md §2.6: OSV API **không** bị chặn (pip-audit vừa
  chạy qua OSV thành công); chỉ endpoint `npm audit` bị chặn. Câu cũ
  "npm audit và OSV API bị chặn" sai một nửa — đã sửa.

## 3. SECURITY.md — đã sửa

1. **§3.3 (pin bgremove stale từ ROUND53-J8):** rembg 2.0.38 → **2.0.60**,
   numpy 2.5.4 → **2.2.6**, thêm `onnxruntime==1.23.2` tường minh, kèm lý
   do (2.0.38 không có session BiRefNet thật; 2.0.60 là bản đầu tiên có
   BiRefNetSessionGeneral; numpy 2.5.4 yêu cầu Python ≥3.12 trong khi
   venv bgremove chạy Python 3.10; bộ pin đã verify chạy thật trên VM).
   Thêm dòng tracking (`numpy==2.5.4`, `opencv-python-headless==5.0.0.93`).
   Sửa "cả 4 file" → "cả 5 file".
2. **§2.6:** đính chính OSV không bị chặn (pip-audit 2.10.1 chạy được
   08/11); `npm audit` vẫn bị chặn (403 policy_denied, verify lại 08/11).
3. **§3.5 mới:** bảng kết quả pip-audit 5 file + đánh giá mức độ + quyết
   định chưa vá + hệ quả job CI sẽ đỏ.
4. **§4.1:** thêm ghi chú rà lại đợt 66 T10 (YAML đúng, 3 lockfile + 5
   requirements khớp, không lệch; pip-audit local tts 39 + bgremove 66).

## 4. FEATURE_STATUS.md — đã cập nhật (đợt 63–65)

Thêm khối "Cập nhật 08/11/2026 — đợt 64–65 + đợt 66 T10 (docs-only)" ở
đầu file + cập nhật các điểm sau. Mọi số đều có nguồn kiểm chứng — đối
chiếu trên đĩa hoặc trích LIMITS luồng:

| Điểm | Trước (cũ) | Sau (mới) | Nguồn số |
|---|---|---|---|
| i18n key lá | 2146 (đợt 63 R10) ở 3 chỗ: khối cập nhật đợt 62/63, note 10, mục "Số lượng type/kho" | **2297** (2146 → 2275 đợt 63 closing → 2283 đợt 64 → 2297 đợt 65; +14 key S2 1 + S4 10 + S6 1 + S8 2, 0 collision, 0 lệch; key vi==en giống hệt 51) | Đếm lại trên đĩa 08/11: `vi leaves: 2297, en leaves: 2297, same key set: True` + `docs/PHASE9_ROUND65_LIMITS.md` §0/§2 |
| Key `speed.warnTooShort` | Note 10 ghi "còn trong dict chờ parent xóa lúc gộp" | Đã xóa ở đợt 64 closing (cùng `jobNote.recoveredRestart`) — đóng nợ | `docs/PHASE9_ROUND64_LIMITS.md` / log build-loop đợt 64 |
| Export MP4 — GPU probe fallback | Không nhắc | Thêm: encoder GPU cache lỗi → render lại đúng 1 lần libx264 + xóa cache; `GET /api/gpu-probe` + `POST /api/gpu-probe/reprobe`; nút "Probe lại GPU" trong ExportPanel; fallback 18/18, bridge 13/13, lib UI 9/9, hồi quy R1 30/30; chưa test GPU thật | `docs/PHASE9_ROUND65_S4_LIMITS.md` + đối chiếu code: `server/bridge/src/gpuProbe.js` tồn tại, endpoint ở `server/bridge/src/index.js:713`, nút ở `apps/web/src/ExportPanel.tsx:35,385` |
| Bridge rate limiter | Không có mục | Mục mới "Bridge rate limiter — global cap + persist (đợt 65 S5)": global cap mặc định 600/cửa sổ (`BRIDGE_RATE_GLOBAL`, 0 = tắt), header `X-RateLimit-Global-Remaining`, persist `~/.cache/vcut/rate-limit.json`, unit 108/108, e2e 40/40 ×3, hồi quy R7 165/165; bài học `BRIDGE_RATE_PERSIST_PATH` riêng cho test spawn bridge | `docs/PHASE9_ROUND65_S5_LIMITS.md` + đối chiếu code: `server/bridge/src/rateLimit.js:17,22,79,90`, `server/bridge/src/index.js:150-151,159,299` (default 600) |
| Trần trial-decode GOP | Không có mục (trần 45 s cũ không còn ghi ở đâu trong file này) | Mục mới "GOP trial-decode — trần 60 s (đợt 64 R10 + đợt 65 S6)": `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` 45.000 → 60.000 ms, tỉ lệ 1,2 ms/KiB giữ nguyên; đo 58–64 MiB (tải thấp 11–22 s; tải nặng 63,54 MiB chạm timeout 60 s); timeout fail-open hiện toast 1 lần (key `gop.trial.timeoutNote`); test 15/15; 64,0 MiB đầy đủ + Safari chưa đo | `docs/PHASE9_ROUND64_R10_KEYFRAME_CAP_LIMITS.md` + `docs/PHASE9_ROUND65_S6_LIMITS.md` + đối chiếu code: `apps/web/src/lib/gopTrialDecodeWorker62R4.ts:88` = `60_000` |
| FPS meter — presented | Không có mục | Mục mới "FPS meter — dòng presented thật (đợt 65 S8)": `PerfOverlay` có dòng presented qua `getVideoPlaybackQuality`; decode 720p lúc lặng presented mean 26,23 fps vs rVFC 16,02 (số R64 15,54 fps chỉ dùng rVFC đánh giá thấp tốc độ thật); unit 12/12 + 8/8, headed 4/4; FPS GPU thật chưa đo | `docs/PHASE9_ROUND65_S8_LIMITS.md` + đối chiếu code: `apps/web/src/lib/presentedFps.ts`, `apps/web/src/lib/perfPresented65R8.ts` + test tồn tại |
| Registry tên project | Save/Load chỉ ghi "sổ tham chiếu liên project R7 28/28" | Thêm: nhận chuỗi legacy cần bằng chứng hash nội dung + tự nhận chuỗi phân mảnh ≤200 chuỗi, test 43/43 (trước sửa 28 pass/12 fail); mảnh mơ hồ chưa có UI nhận thủ công | `docs/PHASE9_ROUND65_S9_LIMITS.md` + đối chiếu code: `apps/web/src/lib/projectNameRegistry64R6.ts`, `adoptLegacyHistoryChain` trong `projectHistory.ts`/`openProjectFlow.ts` |
| Video effects — noise/sharpen | "headed vẫn LỆCH do codec x264 làm mượt nhiễu" (theo LIMITS đợt 63 R8) | Đính chính theo đợt 64 R9 + đợt 65 S7: x264 chỉ ~7–8%, chính là resampler + kẹp chroma-rail + Chrome-high; cơ chế lệch là chiếu gamut; noise KHỚP-THỐNG-KÊ ở full-res pre-encode (lần đầu, 4/4 seed); noise headed vẫn LỆCH, phần dư là resample; sharpen XẤP XỈ (MAD 0,194→0,161; le8 tốt nhất 98,3%); glitch chạy noise trên plane RGB (đã sửa `applyGlitch`) | `docs/PHASE9_ROUND64_R9_YUV_NOISE_X264_LIMITS.md` + `docs/PHASE9_ROUND65_S7_LIMITS.md` |
| Enhance — FPS blend + cảnh báo | "FPS blend cần đo lại lúc VM yên" (đợt 62 R3) | Đo lại ở đợt 64 R3: thang piecewise KHỚP, maxErr 1,5; denoise clip 20 s: 720p 0,46× / 1080p 0,433×; cảnh báo denoise ≥0,7 áp với mọi mức đo được, không cổng theo tốc độ (đợt 65 S2+S3, tới ~49 px/f); S2 harness 87/87 + R2 36/36; S3 harness 96/96 | `docs/PHASE9_ROUND64_LIMITS.md` §1 R3 + `docs/PHASE9_ROUND65_S2_LIMITS.md` / `S3` (theo LIMITS gộp đợt 65) |
| Modal/Escape — nút ngôn ngữ TopBar | Không nhắc | Thêm phát hiện đợt 65 S10: nút ngôn ngữ TopBar không bấm được khi modal Export mở (`.modal-backdrop` z 400 phủ TopBar z 30); đường đổi locale thực tế là menu native desktop hoặc đóng modal rồi bấm cờ (headed H7 PASS) | `docs/PHASE9_ROUND65_S10_LIMITS.md` (dòng 33–35, 47, 83) |
| Preview đầy đủ (mục "Những gì CHƯA có") | "preview chưa áp enhance (render-only)" — mâu thuẫn với hàng Enhance (đã áp xấp xỉ từ đợt 60 Q1) | Sửa thành "preview áp enhance chỉ ở mức xấp xỉ (đợt 60 Q1, không phải đường render thật)" | Tự mâu thuẫn trong chính file (hàng Enhance đã ghi đúng từ đợt 60 Q1) |
| CI/CD (mục "Những gì CHƯA có") | Ghi đợt 63 R10 rà lại: "3 lockfile + 4 requirements khớp; LỆCH duy nhất thiếu tracking" | Cập nhật đợt 66 T10: YAML đúng, 2 job, 3 lockfile + 5 requirements khớp, không lệch; npm audit local vẫn bị chặn 403; pip-audit local tts 39 + bgremove 66 (xem §2); job pip-audit sẽ ĐỎ khi lên GitHub; file vẫn LOCAL-ONLY | Kiểm chứng trực tiếp đợt này (§1–§2) |

ARCHITECTURE.md: grep `trạng thái|status|GPU|rate.limit|presented|registry`
trả rỗng — không có mục trạng thái nên không sửa. README.md: bảng "Tính
năng chính" còn số cũ từ trước Phase 9 (43 font, 56 text preset, 58
transitions, 104 LUT, 7 video FX, 948 SFX, 203 sticker — trong khi
FEATURE_STATUS đã đếm lại 08/11: font 59, preset 96, transitions 81, LUT
174, FX 16, sound 1043, sticker 244). Đây là nợ từ Phase 8, KHÔNG phải
đợt 63–65 nên KHÔNG sửa trong đợt này (ghi nợ §6) — tránh sửa ngoài phạm
vi brief khi các số kho cần đếm lại độc lập.

## 5. Không đụng / không làm

- **Không sửa `ci-security.yml`** (không lệch, xem §1) và **không đưa file
  này vào batch stage** (local-only do 403, đúng mẫu các đợt trước).
- **Không bump pin Python** (Pillow/rembg — xem §2.4).
- **Không sửa code sản phẩm** — chỉ 2 file `.md` (FEATURE_STATUS.md,
  SECURITY.md) + LIMITS này. Vì vậy không chạy lại tsc/vite build/test
  suite (không có code nào đổi; vite build pass gần nhất ở đợt 65 gộp:
  5,92 s — xem `docs/PHASE9_ROUND65_LIMITS.md` §5).
- **Không sửa README.md** (số cũ từ Phase 8, ngoài phạm vi đợt 63–65 —
  xem §4 cuối).
- Không kiểm chứng lại trong đợt này (ghi nợ, không mạo nhận): Mask E1
  (note 6 FEATURE_STATUS ghi "chưa làm" trong khi đợt 1 Phase 9 có "mask
  PNG nhanh 9.1×" — chưa đối chiếu có đóng E1 không); TTS voice cloning
  "chưa expose UI/bridge" (note 7 — đợt 1 có "TTS clone" nhưng chưa đối
  chiếu đã expose chưa); server/desktop 253 literal chưa kiểm kê
  (ROUND60 §5.6, note 10 giữ nguyên).

## 6. Nợ mở cho đợt sau

1. **Bump Pillow + rembg + verify pipeline (nợ bảo mật mới, §2):**
   Pillow 10.2.0 → 13.0.0 (bgremove pin trực tiếp) và rembg 2.0.60 →
   2.0.75+ (CVE-2026-115924 cần 2.0.82); kiểm tra 2.0.75/2.0.82 còn
   BiRefNet session + còn chạy Python 3.10 không; cây vieneu/TTS với
   Pillow 13 (Pillow 12.3.0 transitive). Sau khi bump + verify mới chạy
   lại pip-audit để job CI xanh. (Nguồn: §2.2–§2.4.)
2. **`ci-security.yml` vẫn chờ quyền workflows** (403 từ Phase 6 — nợ gốc
   của luồng này, §8 mục 9 đợt 65). Khi user cấp quyền + push lần đầu:
   theo dõi log CI (job pip-audit sẽ đỏ cho tới khi xong nợ 1; job
   npm-audit chưa biết trạng thái vì chưa chạy được local).
3. **`npm audit` local vẫn bị chặn** (403 policy registry nội bộ) — CVE
   npm chưa có số mới kể từ audit 20/10. Cần chạy trên GitHub (khi có CI)
   hoặc môi trường khác.
4. **README.md bảng "Tính năng chính" stale từ Phase 8** (font 43→59,
   preset 56→96, transitions 58→81, LUT 104→174, FX 7→16, SFX 948→1043,
   sticker 203→244) — cần đợt docs riêng đếm lại độc lập trên đĩa rồi
   sửa một lần.
5. **Đối chiếu 2 điểm FEATURE_STATUS còn nghi ngờ** (§5): Mask E1 vs
   "mask PNG nhanh 9.1×" đợt 1; TTS voice cloning đã expose UI/bridge
   chưa.
6. Các nợ đợt 66 khác (§8 LIMITS gộp đợt 65): vidstabtransform spread
   36–38%, whip-pan thật >14 px/f, resample viewport noise/sharpen,
   FPS GPU thật, keyframe 64,0 MiB, UI nhận mảnh legacy mơ hồ, resume
   job, rà soát test spawn bridge (`BRIDGE_RATE_PERSIST_PATH`).

## 7. Batch stage (KHÔNG push)

File stage: `~/workspace/repo-1-push/paths-loop/phase9-round66-t10-docs-ci.txt`
(NUL-delimited, text only, verify read-back — xem log luồng):

- `docs/FEATURE_STATUS.md` (sửa)
- `docs/PHASE9_ROUND66_T10_DOCS_CI_LIMITS.md` (mới — file này)
- `SECURITY.md` (sửa)

**KHÔNG có trong batch:** `.github/workflows/ci-security.yml` (không sửa
+ local-only do 403 — đúng mẫu các đợt trước; chỉ stage khi parent
quyết). Venv tạm `/tmp/pip-audit-venv` và file `/tmp/audit-*.txt` nằm
ngoài repo, không stage. Log chi tiết luồng:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round66-t10.md`.

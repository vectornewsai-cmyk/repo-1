# Phase 9 đợt 67 — LIMITS gộp (đóng 9 nợ mở đợt 66 §8)

Ngày: 08/11/2026. Máy đo: VM Linux 2 vCPU / 8 GB, không GPU (trừ khi ghi khác).
Đợt 67 đóng 9 nợ mở của `docs/PHASE9_ROUND66_LIMITS.md` §8. 9 luồng U1–U9 chạy
song song tối 08/11; 8 luồng stage batch đúng hạn, U8 về đích muộn (file đã có
trên đĩa, chưa stage — xem §6). Parent gộp muộn (đợt 68, 09/11): gộp fragment
i18n U6/U7 vào dict (2326 → 2369 key lá, 0 collision, vi==en), cập nhật 12 file
test khóa số key 2326 → 2369. KHÔNG push (lệnh đứng).

> Số đo trong doc này là số thật đo trên VM này. Chỗ nào chưa đủ mẫu sẽ ghi rõ,
> không bịa số.

## 0. Kết quả — tóm tắt

| Luồng | Nợ đóng | Kết quả chính | Batch |
|---|---|---|---|
| U1 | Ép `-threads 1` cho vidstabtransform | Ép vào code sản phẩm (chỉ bước transform) + CLI `--no-stab-single-thread` + env `VCUT_STAB_SINGLE_THREAD=0`; dry-run harness xác nhận vị trí cờ đúng | 5 entry |
| U2 | Noise w1440 / bộ lọc Chrome s≈0,38 | Mô hình 2-stage; w1440 noise05 chỉ còn lệch Δcorr R-G 0,199; ngưỡng halve 0,45–0,63 chưa đo | 3 entry |
| U3 | Sàn decode sharpen headed | Sharpen headed thực chất KHỚP — MAD = 0,000, le8 = 100% trong chính decoder của preview (4 cảnh × 2 mức); giữ HYB4 | 4 entry |
| U4 | Presented 1080p lúc lặng | VẪN CHƯA ĐO ĐƯỢC (3 lần chết ở warmup gate, drawDelta 4/2/4 cần ≥20); phát hiện gate harness vs clicktest cho kết quả trái ngược | 3 entry |
| U5 | Trần keyframe 60 s biên hẹp | Trần 60 s → 90 s (công thức 78.536 ms ở 64 MiB); probe treo đợt 66 không tái hiện; watchdog ghi chẩn đoán | 12 entry |
| U6 | UI mở lại mảnh legacy | Modal nhận mảnh legacy + hoàn tác 1 mức; fragment 28 key (parent gộp muộn) | 15 entry |
| U7 | UI lịch sử job | Lịch sử job + resume khi mở ExportPanel; fragment 15 key (parent gộp muộn) | 7 entry |
| U8 | Bump Pillow/rembg (T10) | bgremove pip-audit 66 → 0 (rembg 2.0.87 + Pillow 13.0.0, venv rebuild Python 3.12); TTS chứng minh KHÔNG bump được (gradio kẹp pillow<13); verify pipeline chưa xong — xem §6 | chưa stage |
| U9 | ci-security.yml + docs trạng thái | Workflow không lệch, vẫn local-only (403); pip-audit TTS 39 + bgremove 66 (trước bump U8); SECURITY.md + FEATURE_STATUS.md cập nhật | 4 entry |

Tổng stage đợt 67: **53 entry / 8 file batch** (read-back 53/53 tồn tại, text-only,
0 binary). Parent gộp muộn thêm batch đóng: dict vi/en.json + 12 file test khóa
số key + LIMITS gộp này.

## 1. U1 — ép `-threads 1` vào code sản phẩm

- `server/render/src/render.js` / `enhance.js` / `trfCache.js`: `-threads 1` chỉ
  cho bước transform của stabilize; retry fallback GPU mang theo cờ.
- Harness mới `server/render/src/test_round67_u1_threads1.js`: dry-run có đúng
  1 lần `-threads 1` ngay trước `-i` của file media stabilize; với
  `--no-stab-single-thread`: 0 lần `-threads`.
- Chi tiết + số đo: `docs/PHASE9_ROUND67_U1_THREADS1_LIMITS.md`.

## 2. U2 — noise Chrome: mô hình 2-stage

- Dữ liệu đích `hidden_files/round66-t3/render/`; tiêu chí KHỚP-THỐNG-KÊ:
  tỉ lệ std từng kênh ∈ [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12.
- Kết quả: với đích 2-stage, std+kurt pass ở w1440 noise05; chỉ còn lệch
  Δcorr R-G 0,199. Dư ±16 theo pha của chặng 2 chưa xác định (chu kỳ ~2 pha).
- Không sửa code production (chỉ script `apps/web/scripts/chrome-resample.mjs`
  + test).
- Chi tiết: `docs/PHASE9_ROUND67_U2_NOISE_CHROME_FILTER_LIMITS.md`.

## 3. U3 — sharpen headed KHỚP trong decoder

- Chứng cứ quyết định (cửa sổ scale đúng 1,0, không resample): áp production
  `applySharpen` lên screenshot plain của preview rồi so với screenshot sharp
  của preview cho **MAD = 0,000, le8 = 100,00% trên cả 4 cảnh, cả 2 mức**.
- Trên số trừ sàn theo lân cận: testsrc2 + slovenska KHỚP-trừ-sàn mọi cỡ/mức;
  basgo KHỚP trừ sharp10 ở w1440/1:1; ocean XẤP XỈ ở sharp10 (texture cao tần,
  sàn plain tới 2,45 MAD). Biến thể S7/BLEND8 không thắng HYB4 — giữ HYB4.
- Không đổi code production (chỉ harness/script đo + LIMITS).
- Chi tiết: `docs/PHASE9_ROUND67_U3_SHARPEN_DECODE_FLOOR_LIMITS.md`.

## 4. U4 — presented 1080p lúc lặng: VẪN CHƯA ĐO ĐƯỢC

- 3 lần thử đều chết ở GATE warmup của `measure-65r8-presented-fps.mjs`
  (drawDelta 4 / 2 / 4, cần ≥20), harness exit 2, 0 slot lặng hợp lệ.
  Element vẫn phát được (ct 5,9–6,7 s sau 6 s warmup, dropped 0) — chỉ vòng
  VẼ gãy (draw ~0,3–0,7 fps trong warmup). Harness dừng đúng thiết kế,
  không ghi số rác.
- Phát hiện mới: gate của harness presented và gate của clicktest cho kết quả
  TRÁI NGƯỢC ở cùng clip 1080p (2–4 vs 48–50 draws/6 s) — cần điều tra đợt sau.
- Probe mới: `measure-67u4-mediarate-probe.mjs` (tab trắng) +
  `measure-67u4-app-rvfc-probe.mjs`.
- Chi tiết: `docs/PHASE9_ROUND67_U4_FPS_IDLE_LIMITS.md`.

## 5. U5 — trần keyframe 90 s

- Quyết định: nâng trần 60 s → 90 s, giữ tỉ lệ 1,2 ms/KiB (phương án A).
  Công thức ở 64 MiB cho 78.536 ms < 90.000 ms — trần chỉ còn là trần an toàn
  tuyệt đối. Biên mới: tải thấp 28,2 s; tải trung bình (ngoại suy) ~12,5 s.
  Giá: fail-open dưới tải nặng chậm thêm tối đa 18,5 s (chỉ keyframe ≥ ~50 MiB).
- Đổi: `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` 60_000 → 90_000
  (`apps/web/src/lib/gopTrialDecodeWorker62R4.ts`); cập nhật test 62R4/63R4/
  64R10/66T6 + test mới 67U5; watchdog CDP `cdpRendererWatchdog67U5.mjs`.
- Probe treo đợt 66 lần 1: **không tái hiện** (lần sạch thứ 2 liên tiếp);
  giả thuyết mạnh nhất: renderer main thread kẹt chờ IPC/Mojo dưới tải cực
  nặng (loadavg ~13). Watchdog nay ghi chẩn đoán đầy đủ nếu tái hiện.
- Chi tiết: `docs/PHASE9_ROUND67_U5_KEYFRAME_MARGIN_LIMITS.md`.

## 6. U6/U7 — UI legacy + job history (fragment gộp muộn)

- U6: modal nhận mảnh legacy thủ công (`LegacyHistoryAdoptModal.tsx`,
  27 key `legacyAdopt.*` mới + projectMenu/structuredNotes), hoàn tác chỉ
  1 mức (lần nhận gần nhất). Headed click-test qua `data-testid`.
- U7: lịch sử job + resume khi mở lại ExportPanel; nút cờ TopBar bấm được
  khi modal mở (z 401); fragment `jobHistory.*` 15 key.
- Cả hai fragment đều chưa có trong dict lúc stage — parent gộp muộn
  (09/11): deep-merge `fragments/round67-u6.json` + `fragments/round67-u7.json`
  vào `vi.json`/`en.json`: 2326 → **2369 key lá**, 0 collision, vi==en parity;
  cập nhật 12 file test khóa số key 2326 → 2369 (+43 key fragment đợt 67:
  U6 28 + U7 15 trong comment kế toán ở `i18nOrphans60Q4.test.ts` /
  `errorDetail34Q4.test.ts`).
- Chi tiết: `docs/PHASE9_ROUND67_U6_LEGACY_REOPEN_LIMITS.md`,
  `docs/PHASE9_ROUND67_U7_JOB_HISTORY_LIMITS.md`.

## 7. U8 — bump Pillow/rembg: bgremove SẠCH, TTS KHÔNG bump được, verify dở dang

Trạng thái theo log `hidden_files/round67-u8.md` (luồng về muộn, không kịp
viết LIMITS riêng hay stage batch — gộp vào đợt 68 V1):

- Baseline pip-audit chạy lại 08/11 (pip-audit 2.10.1): tts **39 dòng**
  (toàn Pillow 12.3.0, fix 13.0.0); bgremove **66 dòng** (Pillow 10.2.0:
  2 fix 10.3.0 / 4 fix 12.2.0 / 23 fix 12.3.0 / 33 fix 13.0.0; rembg 2.0.60:
  3 fix 2.0.75 / 1 CVE-2026-115924 fix 2.0.82). Khớp hoàn toàn số đợt 66 T10.
- Blocker 1 — bgremove: Python 3.10 chặn mọi bản vá (rembg ≥2.0.75 và Pillow 13
  đều requires_python ≥3.11); rembg 2.0.82 còn kẹp `pillow<13.0.0` nên mâu
  thuẫn với Pillow 13 — chỉ rembg ≥2.0.87 mới cho Pillow 13.
- Đã làm: rebuild venv bgremove tại chỗ lên Python 3.12.3
  (`server/bgremove/.venv`), rembg 2.0.87 + Pillow 13.0.0 + numpy 2.5.4 +
  opencv 5.0.0.93 + onnxruntime 1.23.2; `import rembg` OK; `requirements.txt`
  đã sửa (ghi rõ lý do 3.12 + lịch sử pin). pip-audit sau bump:
  **"No known vulnerabilities found", exit 0 — 66 → 0**.
- Blocker 2 — TTS: vieneu 3.8.3 requires gradio ≥5.49.1; mọi gradio 5.49.1→
  6.31.0 đều kẹp `pillow<13.0` → `vieneu==3.8.3 + Pillow==13.0.0` cho
  `ResolutionImpossible` (chứng minh bằng dry-run pip). Thêm pin Pillow 13
  vào requirements TTS sẽ làm file không cài được → KHÔNG bump. TTS giữ
  Pillow 12.3.0, tồn dư 39 advisory tới khi gradio nới cap hoặc vieneu bỏ
  dep gradio. TTS verify thật: 25 giọng, inference "Hải Đăng" 86 ký tự →
  WAV 422.444 byte / 4,40 s, synth thuần 8,1 s = **0,543× realtime**
  (trong baseline 0,12–0,75×).
- npm audit local: tái hiện chính xác 403 policy
  (`zz_managed_internal_spaces_package_registries`, POST
  `/-/npm/v1/security/audits/quick`); quét thay thế qua OSV API **thất bại**
  (ReadTimeout tới api.osv.dev sau 180 s, exit 1) — chưa có số CVE npm mới.
- Dở dang: test pipeline bgremove u2net (test lần 1 chết do ảnh mẫu Wikimedia
  trả HTTP 400 HTML; chạy lại với ảnh picsum thật nhưng log dừng giữa chừng,
  chưa có checkpoint kết thúc); backup venv cũ `.venv-py310-bak` 706 MB vẫn
  còn trên đĩa (chỉ xóa sau khi verify xong); `SECURITY.md` + `README.md` đã
  sửa trên đĩa lúc 16:26–16:27 UTC 08/11 (chưa xác nhận nội dung vào batch);
  KHÔNG có LIMITS riêng, KHÔNG có paths file.
- Tổng sau U8 (theo log): 105 → 39 advisory (bgremove 0, tts 39).

## 8. U9 — ci-security.yml + docs trạng thái

- `ci-security.yml` không lệch, vẫn local-only (403 quyền workflows:write
  từ Phase 6). Khi user thêm tay qua web hoặc cấp quyền xong: theo dõi log
  CI lần đầu (pip-audit sẽ đỏ tới khi xong nợ bump; npm-audit chưa có số).
- `scripts/ci-local.sh` (chạy CI cục bộ); SECURITY.md + FEATURE_STATUS.md
  cập nhật trạng thái.
- Chi tiết: `docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md`.

## 9. Nợ mở cho đợt 68

1. **U8 chưa xong (ưu tiên cao):** verify pipeline bgremove end-to-end sau
   bump (u2net test với ảnh thật) + chạy lại OSV npm audit tới khi có số +
   viết LIMITS U8 + stage batch U8 (requirements.txt, SECURITY.md, README.md
   nếu đổi thật, LIMITS) + xóa backup `.venv-py310-bak` 706 MB sau verify.
2. **UI toggle stabilize single-thread** (U1 §7 mục 1): chỉ có CLI/env,
   chưa có toggle trên UI (bridge preset whitelist).
3. **Cơ chế vidstab chưa rõ** (U1 §7 mục 2): vì sao decoder frame-threading
   làm output khác nhau dù decode pixel giống hệt; vì sao threads1 khử hết
   ở 720p nhưng chỉ cải thiện ở 1080p h264 (lệch từ frame ~1500) và không
   cải thiện trên VP9 thật (lệch từ frame 2).
4. **Ngưỡng halve Chrome 0,45–0,63 chưa đo** (U2 §7 mục 1, ưu tiên cao);
   dư ±16 theo pha chặng 2; w1440 noise05 Δcorr R-G 0,199.
5. **Presented 1080p lúc lặng vẫn chưa đo được** (U4); mâu thuẫn gate
   harness vs clicktest (2–4 vs 48–50 draws/6 s) cần điều tra.
6. **Toast timeout keyframe** (U5 §6): chỉ hiện khi phát ngược đang chạy
   hoặc bấm toggle; click-test H/C bị nhiễu tải song song (loadavg tới
   22,02) — chạy lại khi máy yên, ghi loadavg vào verdict.
7. **Hoàn tác legacy adopt nhiều mức** (U6 §5 mục 2): hiện chỉ 1 mức, lần
   nhận gần nhất; cần stack bản ghi nếu muốn undo nhiều mức.
8. **Sharpen floor còn lại** (U3 §8): ocean sharp10 XẤP XỈ, basgo sharp10
   w1440/1:1 chưa KHỚP-trừ-sàn.
9. **Electron exportDest persist theo jobId** (U7 §5 mục 1, nợ cũ T8 §5.2)
   + kiểm tra download được trước khi hiện nút tải (U7 §5 mục 2).
10. **Safari vẫn chưa đo được** (U5 §6; không binary/WebKit trên VM Linux).
11. **ci-security.yml vẫn 403** — chờ user thêm tay qua web GitHub hoặc cấp
    quyền workflows cho App (U9 §9 mục 2); 4 workflow còn lại cũng local-only.
12. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

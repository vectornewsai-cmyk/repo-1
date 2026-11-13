# LIMITS gộp — Phase 9 đợt 77: đóng nợ đợt 76 §4 (10 mục, 9 luồng)

Ngày: 10/11/2026 (lượt cron 03:35 +07 → gộp parent ~22:30 +07).
9 luồng song song E1–E9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 77: **9/9 luồng xong + stage** (E1 và E3 không có báo cáo cuối —
> parent kiểm chứng trên đĩa: batch + LIMITS + log đều đủ).
> Tổng chờ push sau đợt 77: **580 entry / 106 file batch / 363 file duy nhất**
> (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
> đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
> đợt 77: 40/10 — xem §3). Đính chính parent (đợt 78): tổng duy nhất
> sau đợt 76 là **329** (đếm lại bằng set trên đĩa, kiểm 2 lần) — số
> 323 trong bản gộp này là sai: parent đợt 77 đã lấy 363 − 40 entry =
> 323, nhưng 6/40 entry đợt 77 là file đã có từ trước (gap analysis,
> parity-66t3-compare.mjs, enhancePreview.ts, gopRangeFetch39T3.ts,
> preview.tsx, tsconfig.json) nên chỉ có 34 file mới: 329 + 34 = 363.
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 76 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| E1 | §4.1 FPS deint-only | **KHÔNG đạt — quay về half-res.** 4 ứng viên đều không chứng minh được nhanh hơn: inline-shift không giảm R ở s=1.13; tap2 fail 1:1 (R 0,67 > 0,55); blur(1px) quá mềm (vgrad 20–41%); divisor 4 đạt chất lượng (R 0,74 → 0,50) nhưng FPS 0,83× rồi 0,64× (gộp 0,735) không tách khỏi half-res, lại G7b FAIL hệ thống (mask MAD 0,64). Cây cuối = hành vi D4 (divisor 2, hằng mới `ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR`). Ngưỡng 0,75× giữ nguyên. | E1 11/11; xác minh quay về 10/10 |
| E2 | §4.2 Gate giết oan | **Luật mới: GIẾT ⟺ re-gate FAIL (delta < 30) ∧ slot 1 là FN (draw < 2 fps).** Ngưỡng 30/20/2 fps giữ nguyên. (a) load-aware và (b) nâng ngưỡng bị loại bằng số (FP xảy ra ở tải thấp; delta FN/khỏe chồng lấn hoàn toàn). FP kiểm duyệt 1 → 0 (hồi quy lịch sử 3/12 → 0/12), bắt FN không đổi 3/4. Cái giá: FN bắt *sớm* giảm (S1 FN thật nhưng slot 1 không FN nên được tha — chỉ tốn thêm ~40 s, FN không mất khỏi dữ liệu). Chưa quan sát lần giết thật đầu tiên của luật mới. | E2 10/10 |
| E3 | §4.3 "Ai free" fix | **KHÔNG sửa production — giữ `copy`.** Hướng sửa vòng đời decoder từ CLI đã chứng minh không khả thi bằng source. SPLIT chưa đủ bằng chứng (Fisher p=1,0/0,48). **Đính chính B7 §3.2: NEEDS_WRITABLE CÓ chạm được race** (copy frame 0..147 → `td->src` cấp ngay từ frame 0) — suy luận từ source, chưa đo thực nghiệm; cần build ffmpeg riêng + stress lại. Nợ B7 §2.4 (mẫu crash vòng xuôi có regs) ĐÃ ĐÓNG (A-r14 + F-r2). Phát hiện phương pháp: tỉ lệ crash nhạy với SETUP (tracker + showinfo + -v info), không chỉ tải. | stress F 7/10 crash |
| E4 | §4.4 u2netp | **u2netp KHÔNG thay được u2net.** Nhanh hơn 1,5–2,4×, RAM nhẹ hơn (0,73 vs ~1,1 GiB) nhưng mask kém xa: IoU chân dung 0,626 (tiêu chí ≥ 0,85), bỏ toàn bộ váy tối màu; clip C hai model chọn vật thể khác nhau. Giữ u2net, `bgremove.py` không đổi. | suite bgremove PASS |
| E5 | §4.5 TTS 39 + npm | **TTS 39 CVE Pillow KHÔNG ĐỔI** (lần thứ 4 liên tiếp, tập ID y hệt; Pillow 13.0.0 đã vá cả 39 nhưng Gradio vẫn kẹp pillow<13). **npm audit LẦN ĐẦU TIÊN CÓ SỐ** — đường mới GitHub Advisory DB REST (OSV POST bị chặn toàn bộ; npm audit 403): quét đủ 447/447 cặp lockfile → **5 advisory / 4 CVE, high 2, medium 3, critical 0**: multer CVE-2026-113872 (high 7,5, fix 2.5.0), body-parser CVE-2026-111181 (high 7,5, fix 1.20.9), vite CVE-2026-118662 (medium, dev-only), minimatch CVE-2026-118764 (medium). Nợ bump 5 CVE chuyển đợt sau. | GHSA audit complete:true |
| E6 | §4.6 G12 vào harness | **G12 đã vào code đo** (`delta0-harness.mjs` dùng chung — không sửa production). G12 đúng **20/20** case D2 + **3/3** case mới capture headed thật (tổng 23/23; R0 cũ 20/23). G1 vs G2 vẫn chưa phân biệt được (đồng ý 23/23). | E6 7/7 |
| E7 | §4.7 Keyframe lớn | **Quét zero-run AVCC đã nối vào cả 2 đường trial-decode** (main-thread + worker). Keyframe zero-giữa bắt được trong 520–2914 ms thay vì timeout fail-open. **Đính chính gap analysis:** cap stream-mode thực tế là **64 MiB** (không phải 8 MiB); claim "trial-decode không bắt zero-giữa" sai với VideoDecoder (bắt 2/2, chỉ chậm). Dị thường: Hi444 lossless 8K 50,2 MiB decode ~4,4–6,4 s, nhanh hơn lossy High 8K 10–17× — chưa giải thích được. | E7 24/24; hồi quy GOP 45/47 (O6 flake đã biết) |
| E8 | §4.8 GPU/Safari thật | **Không có GPU thật, không có Safari thật trên VM này.** 4 encode phần cứng thử đều 0 frame (lỗi -22). **WebKit thật ĐO ĐƯỢC LẦN ĐẦU** (Playwright webkit-2388): phát 5/5 codec nhờ GStreamer hệ thống — không phải Safari thật. Phát hiện: WebKitGTK này KHÔNG CÓ `MediaRecorder`; `canPlayType` lạc quan (probably cho mọi codec). VM nay là **4 vCPU EPYC 9D25** (RESULTS.md ghi 2 vCPU 7D13 — số tuyệt đối cũ mang nhãn máy cũ). | probe WebKit/Chromium |
| E9 | §4.9 (kề) Effects parity | **Sharpen/noise parity KHỚP ở cả 3 cửa sổ** (full-pixel + G12): sharpen abs ~0,58–0,63, noise Δkurt ≤ 0,34. Noise w2560 lệch kurt-only là **lỗi mô hình đo** (kernel upscale thật của Chrome là BC-cubic B≈0,25, C≈0,375 — dưới kernel này đều KHỚP). Đóng nợ X6 §10(a): dư Δkurt R 0,45–0,49 ở w1440 là artefact lấy mẫu step-4. Kernel mới **chưa nối** vào `chrome-resample.mjs` (cần kiểm chứng nội dung khác). Sửa harness đo (bt601→bt709), không sửa production. | effectCanvas 15/15 + 15/15; V14 21 KHỚP / 0 LỆCH |

## 1. Ghi chú parent merge

1. **E1/E3 không có báo cáo cuối — đã kiểm chứng trên đĩa.** E1: batch
   6 entry + LIMITS + log `round77-e1.md` đầy đủ (kết quả âm trung thực,
   đã quay về divisor 2). E3: batch 4 entry + LIMITS + log `round77-e3.md`
   đầy đủ (giữ `copy`, đính chính B7 §3.2). Mẫu handoff thiếu quen thuộc
   (đợt 68/71/72/74/75/76) — luôn kiểm tra đĩa trước khi kết luận.
2. **Parent fix: P7 7/8 → 8/8.** E7 thêm 9 literal tiếng Việt (chuỗi
   `reason` chẩn đoán trong `scanAvccZeroRun`) làm P7 scan đỏ. Chuỗi
   `reason` là log/fallback, không phải UI — file này vốn dùng mã
   tiếng Anh (`no-decoder`, `decode-ok`, `timeout-<ms>ms`). Parent đổi
   9 chuỗi sang tiếng Anh trong `gopTrialDecode55L8.ts` (không đổi
   logic, không đổi test — E7 chạy lại 24/24). File này đã nằm trong
   batch E7 nên không thêm entry mới.
3. **Không xung đột file chung.** 38 entry đợt 77 không trùng nhau
   (preview.tsx chỉ E1, tsconfig chỉ E7, test_v14_parity.js chỉ E9,
   vi/en.json không luồng nào đụng, render.js không luồng nào đụng
   production). Dict giữ **2419/2419**.
4. **Vite build lần đầu chạy sai lệnh của parent** (chạy từ gốc repo với
   `--config apps/web/vite.config.ts` → lỗi Rollup parse) — chạy lại
   đúng từ `apps/web` thì **pass 6,40 s**. Lỗi là do lệnh parent, không
   phải code.
5. **E5: script GHSA audit chưa vào repo.** `r77-e5-ghsa-audit.py` hiện
   ở `hidden_files/` với đường dẫn hardcode tới đó — đợt sau nên port
   vào repo (đường dẫn tương đối) rồi mới stage, không stage bản
   hardcode.
6. **Không EPERM trong lượt này.** Xvfb + Chrome headed chạy được
   (E1/E7/E9 click-test/capture headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0**.
- vite build: **pass** (6,40 s, từ `apps/web`).
- r6-i18n-check: **PASS** (dict 2419).
- P7 i18n audit: **8/8** (sau parent fix §1.2). i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- Suite luồng: E1 enhancePreview77E1 **11/11**; E2 regateConfirm
  **10/10**; E6 g12 **7/7**; E7 keyframeLarge **24/24**; E9 effectCanvas
  **15/15** + effectCanvas.parity **15/15**.
- Chưa chạy lại: E3 stress (tin LIMITS E3), E4 bgremove suite (tin
  LIMITS E4), E5 audit (tin LIMITS E5), E8 probe (tin LIMITS E8),
  E9 headed/V14 (tin LIMITS E9).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round77-e1-deint-fps.txt` (6), `e2-gate-regate.txt` (4),
  `e3-vidstab-aifree-fix.txt` (4), `e4-u2netp.txt` (3),
  `e5-tts39-npm.txt` (1), `e6-delta0-g12.txt` (5),
  `e7-keyframe-large.txt` (6), `e8-gpu-safari.txt` (3),
  `e9-effects-parity.txt` (6),
  `phase9-round77-closing.txt` (2: LIMITS gộp + gap analysis).
- Tổng đợt 77: **40 entry / 10 file**. Tổng chờ push sau đợt 77:
  **580 entry / 106 file batch / 363 file duy nhất** (đếm lại trực tiếp
  từ đĩa: 329 sau đợt 76 + 34 file mới đợt 77; 6/40 entry đợt 77 là
  file đã có từ trước nên không cộng đủ 40).
  HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 78 (§8)

1. **FPS deint-only (E1):** G5 vẫn mở — mọi đường 2 lần vẽ đều ~0,7–0,8×
   trong nhiễu đo hiện tại. Hướng sau: đo lúc VM yên tĩnh / đo thời
   gian tick trực tiếp thay vì đếm draw/3s / giảm chi phí cố định tick
   (decode). Không tự nới ngưỡng 0,75×.
2. **Gate (E2):** luật confirm mới chưa quan sát lần giết thật đầu
   tiên; cần ≥10 phiên E2 nữa trước khi đổi ngưỡng; nâng launcher E2
   thành harness chuẩn thay Z3 (giữ cờ `E2_REGATE_CONFIRM=0` để A/B).
3. **"Ai free" (E3):** cần build ffmpeg riêng với patch
   NEEDS_WRITABLE + stress lại đúng setup F (tracker + showinfo +
   -v info), n≥15/arm + control NOCOPY 720p/360p; quyết định triển
   khai ffmpeg tự build thuộc về đợt sau/user.
4. **npm 5 CVE (E5):** bump multer 2.4.0→2.5.0, body-parser
   1.20.8→1.20.9, vite 6.4.4→6.4.5, minimatch 9.0.9/10.2.6→11.0.1
   (đo lại sau bump); port script GHSA audit vào repo.
5. **TTS 39 CVE (E5):** vẫn chờ Gradio gỡ kẹp pillow<13 (Pillow
   13.0.0 đã vá cả 39).
6. **Kernel upscale BC(0,25, 0,375) (E9):** kiểm chứng trên nội dung
   khác trước khi nối vào `chrome-resample.mjs`; cổng G12 step-4
   không trùng full-pixel; noise10 w1920 Δkurt R 0,34 sát nút — đo
   lặp lại ở capture khác.
7. **G1/G2 (E6):** vẫn chưa phân biệt được (đồng ý 23/23); chưa đo
   post-fix basgo/slovenska và ocean w1600/w1760/w2240/w2880.
8. **Keyframe (E7):** protocol worker chỉ mang boolean → lý do
   `zero-run` bị mất ở đường worker (về T3 thành `decode-failed`
   chung); sample >64 MiB vẫn skip theo thiết kế; Safari/Firefox
   chưa đo; dị thường lossless 8K decode nhanh hơn lossy 10–17×
   chưa giải thích được.
9. **GPU thật / Safari thật (E8):** vẫn chưa đo (cần máy macOS/iOS
   thật / máy có GPU); số RESULTS.md mang nhãn máy cũ (2 vCPU 7D13,
   nay 4 vCPU EPYC 9D25).
10. **u2netp (E4):** chỉ xem xét đường dùng hẹp, opt-in (preview
    nhanh, chủ thể sáng/tương phản cao) — cần đợt riêng; MediaPipe
    SelfieSegmenter vẫn chưa thử; birefnet vẫn ĐÓNG (chờ máy RAM ≥
    12 GB).
11. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App).
12. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

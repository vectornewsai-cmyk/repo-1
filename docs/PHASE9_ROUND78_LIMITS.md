# LIMITS gộp — Phase 9 đợt 78: đóng nợ đợt 77 §4 (12 mục, 10 luồng)

Ngày: 10/11/2026 (lượt cron 06:35 +07 → worker báo cáo 09:19 +07,
nói 8/10 luồng, F5/F8 chưa về — parent kiểm đĩa đính chính).
10 luồng song song F1–F10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 78: **10/10 luồng xong + stage** (F5/F8 đã stage đủ, worker
> báo cáo sai — xem §1). Parent gộp: không cần bump snapshot (không
> luồng nào đổi dict, vẫn 2419). Tổng chờ push sau đợt 78: **628 entry
> / 117 file batch / 403 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
> đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
> đợt 77: 40/10; đợt 78: 48/11 — xem §3).
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 77 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| F1 | §4.1 FPS deint-only | **G5 VẪN MỞ.** Đo lại lúc VM yên + probe tick-time mới: intermediate "high" → "medium" pixel Y HỆT (R 0,74 → 0,51) nhưng KHÔNG nhanh hơn (intermediate median ~250 ms/call; gap 0,86 → 0,77; draw-fps 0,58 → 0,55) → đã hoàn lại "high". Production cuối y hệt trước F1 ngoài comment ghi thí nghiệm. Ngưỡng 0,75× giữ nguyên. | Harness E1 9/10; probe tick-time |
| F2 | §4.2 Gate giết oan | **Lần giết thật đầu tiên của luật mới: CHƯA XẢY RA.** 5 phiên chuẩn hoàn chỉnh (session5–9), 0 phiên FN (0/5), re-gate đều pass. Harness chuẩn mới thay Z3 launcher (`measure-78f2-gate-harness.mjs`). Cần ≥10 phiên nữa (nợ §4.2 còn mở). | F2 harness 10/10 |
| F3 | §4.3 Build ffmpeg NEEDS_WRITABLE | **Build ffmpeg riêng THÀNH CÔNG** (patch 1 dòng vào `vf_vidstabtransform.c:278`, build ~17 phút, binary 8.1.2 chạy đúng, sha khớp ground truth). **Patch CÓ chạm được race** — output bản patch ổn định tuyệt đối, trùng đúng đường non-direct (SPLIT/COPY) ở cả 3 kích thước; stock NOCOPY lệch sha 15/15 ở 720p/360p (Fisher p ≈ 1×10⁻⁸). **Nhưng KHÔNG CÓ BẰNG CHỨNG giảm crash** — 0 crash trên cả 90 lần chạy, kể cả arm control (control NOCOPY 1080p 0/15, không tái hiện tỉ lệ lịch sử 7/10 của F, Fisher p=0,00025). **Chưa đủ bằng chứng để triển khai ffmpeg tự build** — nên thử SPLIT trước (rẻ hơn, không cần build riêng). | Stress 0/15 vs 0/15 |
| F4 | §4.4 npm 5 CVE | **ĐÃ ĐÓNG — 4/4 CVE đã vá.** multer 2.4.0 → 2.5.0, body-parser 1.20.8 → 1.20.9, vite 6.4.4 → 6.4.5, minimatch 9.0.9+10.2.6 → 11.0.1. **Audit GHSA chạy lại toàn lockfile: 447/447 package, 0 advisory, 0 CVE** (trước bump: 5 advisory / 4 CVE). Lưu ý push: `package-lock.json` 219 KB cần `ENABLE_PRIVSEP=0`. | GHSA audit 447/447 |
| F5 | §4.5 TTS 39 | **39 CVE Pillow KHÔNG ĐỔI** — tập ID y hệt 39/39 so với đợt 77 E5, lần thứ **5 liên tiếp** y hệt (74 B6 = 75 C5 = 76 D1 = 77 E5 = 78 F5). Gradio stable vẫn 6.31.0, kẹp pillow<13. **MỚI: Gradio dev `7.0.0.dev0` (upload 2026-11-09) đã gỡ kẹp: `pillow<14.0,>=8.0`** — lần đầu tiên upstream nới cap; chỉ là bản dev, chưa dùng được cho production. | pip-audit 39 |
| F6 | §4.6 Kernel upscale BC | **ĐÃ NỐI kernel BC(0,25, 0,375) làm nhánh upscale trong `resamplePlaneTrilinear`** (`apps/web/scripts/chrome-resample.mjs`, duy nhất 1 file production đổi). BC khớp trên 4 nội dung ở thang upscale 1,132 (**19/20 verdict KHỚP**, so với tam giác 15/20); downscale không đổi (bit-identical, kiểm chứng lại bằng E9 + 67u2). | Verdict 19/20 |
| F7 | §4.7 G1/G2 post-fix | **G1 vs G2 PHÂN BIỆT ĐƯỢC lần đầu tiên — ở mức verdict, trên đúng 1 case: `F7-sweep-w2880-testpattern-n05` (G2 đúng, G1 sai).** Chỉ sửa harness đo; `delta0-harness.mjs` không đổi, không sửa production (luật delta0 không nằm trong production — xem D2). | F7 7/7 |
| F8 | §4.8 Keyframe protocol | **Protocol worker ĐÃ SỬA — lý do `zero-run` về tới T3.** Worker nay kèm `reason: "zero-run: ..."` trong message `result`; main thread chuyển thành structured failure `{ failed: true, reason }`; `runTrialDecode` giữ nguyên văn tới T3. Headed Chromium: z9m/z19m (đường worker) → full-file với reason `zero-run: zero-run 1048576 bytes at offset ...` (đợt 77: `decode-failed` chung). Tương thích ngược cả 2 chiều. **Sample >64 MiB vẫn skip theo thiết kế — đã đo và khóa.** | F8 12/12; E7 24/24; hồi quy GOP 46/48 (O6/P6 flake đã biết) |
| F9 | §4.10 u2netp opt-in | **KHÔNG triển khai đường u2netp opt-in hẹp — bằng chứng không đủ** (phạm vi hẹp "chủ thể sáng/tương phản cao": u2netp chỉ đạt 2/4 clip, cần ≥ 3/4). **MediaPipe SelfieSegmenter: chạy được, license sạch (Apache-2.0), nhanh, nhưng chưa đạt IoU** — không tích hợp trong luồng này (cần dep mediapipe ~130 MB + runtime mới). Birefnet vẫn ĐÓNG. | Suite bgremove PASS |
| F10 | §4.9 + §4.11 Nhãn máy | **Nhãn máy đã sửa xong** ở 4 file sống (`benchmarks/RESULTS.md`, `benchmarks/BENCH_LIMITS.md`, `docs/FEATURE_STATUS.md`, `docs/DESKTOP.md`): thêm bảng 4 thế hệ máy; mọi số tuyệt đối giờ mang nhãn thế hệ máy; **không sửa bất kỳ số đo nào**. Hai nhãn cũ được đính chính là SAI ("trên VM này (2 vCPU, không GPU)" ở §9.3 TTS và "2vCPU/8GB" ở DESKTOP.md — thực tế 4 vCPU thế hệ 2). | Kiểm tra 10/11 |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — F5/F8 đã stage.** Handoff nói F5/F8
   "đang chạy, chưa có LIMITS/log/batch" — trên đĩa có đủ batch (F5
   2 entry lúc 00:21, F8 6 entry lúc 00:45), LIMITS doc, md log.
   Đợt 78 thực tế **10/10 luồng xong + stage**. Mẫu handoff stale
   quen thuộc (đợt 68, 71, 72, 74, 76) — luôn kiểm tra đĩa trước khi
   kết luận một luồng thiếu.
2. **Log: các luồng tự ghi entry riêng, chưa có entry gộp.** Log có
   2 entry riêng của F8 và F1 (với tổng chờ push tăng dần theo lúc
   stage: F8 600/110/378, F1 603/111/380) — các số này đúng ở thời
   điểm chúng stage, nhưng chưa phải tổng cuối đợt. Parent viết entry
   gộp này (xem §3 + log) — các entry riêng giữ nguyên làm hồ sơ.
3. **Dict không đổi: 2419/2419, 0 mismatch** — không luồng nào thêm
   key, không cần bump snapshot.
4. **Xung đột file chung: gộp sạch.** preview.tsx (F1), tsconfig.json
   (F8), chrome-resample.mjs (F6 — duy nhất 1 file production đổi
   trong đợt), package.json/package-lock.json (F4), gopTrialDecode*
   (F8) — tsc web **0**, desktop **0**, vite build **pass**.
   Không binary, không workflow. `package-lock.json` 219 KB (text)
   cần `ENABLE_PRIVSEP=0` khi push (như mọi file >37.768 byte).
5. **Không EPERM trong lượt này.** Xvfb + Chrome headed chạy được
   (F1/F8 click-test headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 79 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (F6 đã build pass sau khi nối kernel BC; F8 đã
  build pass; chỉ md/json đổi sau đó).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2419).
- Suite luồng: F2 gate harness **10/10** (chạy trực tiếp bằng node —
  bản bundle CJS gãy ở `import.meta.url`, lỗi cách chạy, không phải
  code); F8 keyframe protocol **12/12** (format esm — file có
  top-level await, CJS không build được); F3 needswritable stress
  **0/15 vs 0/15** (Fisher p=1 — đúng như LIMITS: không có crash để
  đo); F7 g1g2 **7/7**.
- Chưa chạy lại: F1/F4/F5/F6/F9/F10 (tin LIMITS từng luồng: F1 harness
  E1 9/10 + probe tick-time; F4 GHSA 447/447 0 advisory; F5 pip-audit
  39; F6 verdict 19/20; F9 suite bgremove PASS; F10 kiểm tra 10/11).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round78-f1-deint-fps.txt` (3),
  `f2-gate-e2.txt` (3), `f3-ffmpeg-needswritable.txt` (4),
  `f4-npm-cve.txt` (6), `f5-tts39.txt` (2),
  `f6-kernel-bc.txt` (7), `f7-g1g2-postfix.txt` (5),
  `f8-keyframe-protocol.txt` (6), `f9-u2netp-optin.txt` (4),
  `f10-bench-labels.txt` (6),
  `phase9-round78-closing.txt` (2: LIMITS gộp + gap analysis).
- Tổng đợt 78: **48 entry / 11 file**. Tổng chờ push sau đợt 78:
  **628 entry / 117 file batch / 403 file duy nhất** (đợt 67: 68/9;
  đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
  đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9;
  đợt 76: 67/10; đợt 77: 40/10; đợt 78: 48/11). HEAD GitHub vẫn
  `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 79 (§8)

1. **FPS deint-only (F1):** G5 vẫn mở — mọi đường 2 lần vẽ đều ~0,7–0,8×
   (intermediate "medium" không nhanh hơn "high"); cần hướng khác
   (đọc frame nhanh hơn / bỏ intermediate / GPU).
2. **Gate (F2):** luật confirm mới chưa có lần giết thật đầu tiên —
   cần ≥10 phiên chuẩn nữa (đã có 5).
3. **NEEDS_WRITABLE (F3):** patch chạm race (sha, Fisher p≈1e-8)
   nhưng chưa có bằng chứng giảm crash — thử SPLIT trước (rẻ hơn,
   không cần build ffmpeg riêng) đúng setup có power; quyết định
   triển khai ffmpeg tự build thuộc về đợt sau/user.
4. **TTS 39 (F5):** vẫn chờ Gradio stable — tín hiệu mới: dev
   7.0.0.dev0 đã nới cap pillow<14; theo dõi khi nào stable 7.x ra.
5. **Kernel BC (F6):** đã nối vào production — cần kiểm chứng nội dung
   khác (không chỉ 4 nội dung đã đo) + đo lại verdict toàn bộ sau khi
   nối (E9 + 67u2 đã pass, nhưng cần sweep rộng hơn).
6. **G1/G2 (F7):** mới phân biệt được trên 1 case — cần sweep thêm
   case để xem G1/G2 khác nhau ở điều kiện nào.
7. **u2netp/MediaPipe (F9):** cả hai đều chưa đạt IoU — u2net vẫn là
   fallback duy nhất; MediaPipe cần dep ~130 MB nếu muốn thử sâu.
8. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium/WebKitGTK).
9. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
10. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

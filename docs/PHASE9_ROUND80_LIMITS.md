# LIMITS gộp — Phase 9 đợt 80: đóng nợ đợt 79 §4 (10 mục, 10 luồng)

Ngày: 10/11/2026 (lượt cron 15:35 +07 → worker báo cáo 17:22 +07
nói "không có báo cáo thực thi" — parent kiểm đĩa đính chính).
10 luồng song song H1–H10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 80: **10/10 luồng xong + stage** (worker báo cáo sai — xem §1).
> Parent gộp: sửa 2 lỗi batch (xóa file TEST rỗng, thêm NUL cuối H10)
> + sửa 2 suite css60/css61 đỏ do class mới H9 (xem §1). Dict
> 2425 → **2461** (H7 đã tự bump snapshot). Tổng chờ push sau đợt 80:
> **806 entry / 138 file batch / 511 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
> đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
> đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11 —
> xem §3). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 79 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| H1 | §4.3 vidstab taskset | **Taskset KHÔNG khôi phục được crash — 0/60 lần chạy** (NC 0/20, SP 0/20, CP 0/20; Fisher p=1,0). Cửa sổ thiếu power cho endpoint crash — **lần thứ 3 liên tiếp** sau F3/G3. **COPY-vs-SPLIT head-to-head: HÒA tuyệt đối ở mức sha** (cả hai 10/10 = ground truth ở 1080p và 720p). Không cần ffmpeg tự build; crash vẫn chưa đo được ở bất kỳ đường nào. | Stress 0/60 |
| H2 | §4.2 Gate A/B | **Đối chứng A/B luật cũ live lần đầu: luật cũ giết thật 3/3 phiên KHỎE** (C2/C3/C4, slot1 3,53/3,85/3,66 fps, không FN) — FP của luật cũ được quan sát trực tiếp lần đầu. **Cặp ghép đôi sạch:** luật mới THA đúng những phiên luật cũ giết oan (S2 vs C2, S3 vs C3 — cùng burner, cùng re-gate FAIL). Luật mới bắt FN sớm 0/3 (luật cũ 2/3) — đánh đổi đã biết và đã chấp nhận ở E2 (FN vẫn đo đầy đủ, chỉ mất giết sớm); FP kiểm duyệt luật mới = 0. **Độ sắc ngưỡng FN 2 fps: VẪN CHƯA kiểm chứng được.** | A/B 6 phiên |
| H3 | §4.5 Kernel BC probes | **(a) Xung vuông: Chrome KHÔNG dùng BC** — kernel là tam giác (bilinear); nhưng BC vẫn giữ vì bù lệch đường sharp. **(b) Noise LỆCH ở project 640: nguyên nhân = ma trận màu bt709-vs-bt601, KHÔNG phải chroma — ĐÃ SỬA production** (4/4 nội dung × 2 mức × 2 kernel LỆCH → KHỚP). | Probes |
| H4 | §4.6 G1/G2 Q4 | **G1 vs G2: CÓ 1 case phân biệt verdict, nhưng CHỈ ở số học không-làm-tròn (biên 0,0008).** Case `F7-sweep-w2240-testpattern-n10` [fullD0]: maxKurt chưa làm tròn = 0,3508 > 0,35 → LỆCH; G1 áp d0 (d0std_R 1,15 ≤ 2) → sai; G2 từ chối (ratio_R 1,16 > 1) → KHỚP, đúng. Harness hiện tại làm tròn kurt 2 chữ số nên báo KHỚP cả hai — trong số học của harness, G1 = G2 vẫn chưa phân biệt được. **G2 vs G12: VẪN CHƯA phân biệt được** (23 frame sàng + 4 case capture thật). Săn Q4 thất bại ở phía resid (residStd_R sụp khi blend). | Sweep 23 + 4 |
| H5 | §4.7 WebKit loop | **Workaround `ended → seek(0) + play()` SỬA được loop trên WebKitGTK — đã kiểm chứng headed** (clip H.264 2 s / 3 s và VP9). Module mới `webkitLoopRestart80H5.ts` + test 11 check. | H5 11/11 |
| H6 | §4.1 G8 +0,099 | **ĐÃ TÁCH XONG — KHÔNG PHẢI HỒI QUY.** Nguyên nhân là (a): thay đổi held-frame intermediate của G1 — **ĐÃ CHỨNG MINH BẰNG A/B TRONG APP** (revert đúng 1 dòng G1 → G8 về đúng 1,4826 cũ; khôi phục → lại 1,5817, khớp từng số F1 tới 4 chữ số). Không sửa gì, giữ nguyên code G1 (độ lệch pixel là chi phí đã biết của đường đọc nhanh). | A/B headed |
| H7 | §4.10 Modals i18n N2 | **N2 thu hẹp về đúng 1 rò rỉ UI thật còn lại — nay đã wire xong.** 3/4 chuỗi cảnh báo cổng phát ngược (`reversePreviewGate`) hiện nguyên văn tiếng Việt trong toast + title badge decode-ahead ở locale en — nay đã wire qua `warningKeys` (4 key `reverseGate.*`) + dịch tại `preview.tsx`. Thêm 6 key `rehydrate.*` (`reasonKey` song song lý do skipped) + nối `lookup` cho tên mặc định của `serializeProject`. Dict +10 key H7 (+9 H10 +17 aiJob = **2461**). | H7 13/13 |
| H8 | §4.8 AI progress/cancel | **Tiến trình + hủy AI đã nối xong (bridge + web).** Bridge unit **59/59**, E2E HTTP thật **37/37**, web unit **8/8**, P7 **8/8** (dict 2461/side, 0 orphan). Hồi quy pin-test do refactor UI — đã sửa (khôi phục nút Hủy trần + key `bgremove.cancel` trong CaptionModal, gỡ check `!res.body` thừa trong SceneModal, cập nhật pin captionModal60Q3 58 → 59). Sau sửa: captionModal60Q3 **23/23**, modalClasses59P4 **33/33**, modalCard58O4 **24/24**. | Bridge 59/59; E2E 37/37 |
| H9 | §4.9 Click-test core | **Bộ N9 (đợt 57) chạy lại nguyên vẹn làm hồi quy trên cây hiện tại + bộ mới H9 cho responsive + PWA.** Sửa sản phẩm: pill FPS của `PerfOverlay` dời sang góc dưới-trái trên timeline ở ≤768px (`useIsMobile`) — trước đây ở 390px nó che tay cầm trim + clip lane video; thêm class `perf-fps-btn` / `perf-fps-panel` làm hook harness. Headed/click-test SKIP ở phần H8 (Playwright download thất bại; VM browser không tới 127.0.0.1:5173) — H9 chạy được (xem LIMITS H9). | N9 + H9 |
| H10 | §4.10 Social presets | **Preset xuất bản mạng xã hội 1 chạm (S4, gap §2.6):** preset theo nền tảng (TikTok/Reels/Shorts) với khổ/fps/codec/CRF/trần bitrate/audio riêng + safe-area theo nền tảng (trước đây chỉ có preset MP4 chung chung, TikTok gộp chung Reels/Shorts, không có trần bitrate, safe-area chỉ TikTok/YouTube/Instagram-feed). Dict +9 key. | Preset tests |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — đợt 80 đã chạy đủ.** Handoff nói "không có
   báo cáo thực thi: không tìm thấy log, paths stage, hay kết quả kiểm
   chứng" — trên đĩa có đủ: 10 batch (121 entry), 10 LIMITS doc,
   10 md log, 15 dòng log vòng lặp (entry riêng từng luồng). Đợt 80
   thực tế **10/10 luồng xong + stage**. Đây là lần đầu worker báo
   "không có gì" trong khi mọi thứ đều có — mẫu handoff stale quen
   thuộc, nhưng ở mức nặng hơn (toàn bộ lượt bị báo mất). Luôn kiểm
   tra đĩa trước khi kết luận một lượt trống.
2. **Sửa 2 lỗi batch:**
   - `phase9-round80-h4-g1g2-q4-TEST.txt` là **file rỗng 0 byte, 0
     entry** (tàn dư thử nghiệm của luồng H4) — **đã xóa**, không tính
     là batch.
   - `phase9-round80-h10-social-presets.txt` **thiếu NUL cuối** (17
     entry) — **đã thêm NUL**, 17 entry nguyên vẹn.
3. **Sửa 2 suite css60/css61 đỏ do class mới H9** (log H8 đã ghi nhận
   đỏ nhưng chưa sửa): H9 thêm class `perf-fps-btn` /
   `perf-fps-panel` vào `PerfOverlay.tsx` làm hook harness, style bằng
   inline (btnStyle/panelStyle + override vị trí mobile qua
   `useIsMobile` — động nên không thể là rule CSS tĩnh). Parent KHÔNG
   refactor component vừa được kiểm chứng headed ở 390px; thay vào đó
   đăng ký 2 class làm ngoại lệ đã biết trong cả 2 test, kèm khóa
   chúng phải đi kèm inline `style=` (để ngoại lệ chỉ đúng khi chúng
   còn là hook inline-styled). Đồng thời bump check i18n TtsButton
   trong css60: H8 thêm 3 key `aiJob.*` (17 key → 20 key, 20 → 26
   call site — 3 key mới + 3 call site key cũ dùng lại trong nhánh
   tiến trình/hủy). Sau sửa: css60 **59/59**, css61 **60/60**.
4. **Dict: H7 đã tự gộp, parent không cần bump.** Dict **2461/2461,
   0 mismatch**; 16 file test assert 2461; 4 file còn nhắc 2425 đều là
   comment lịch sử đúng (ProjectMenu dòng 187, codecProbeDebts dòng
   17/20, i18nModals79G9 dòng 103 — chuỗi thành phần đầy đủ tới H7/H10/
   aiJob). Tên test orphans đã khớp thành phần mới.
5. **Xung đột file chung: gộp sạch.** preview.tsx (H3+H5+H7),
   tsconfig.json (H5), vi/en.json (H7+H8+H10), ExportPanel.tsx
   (H8+H10), server/bridge index.js (H8+H10), render.js (H10) —
   tsc web **0**, desktop **0**, vite build **pass** (theo worker;
   parent không build lại — xem §2). Không binary, không workflow.
6. **Không EPERM trong lượt này.** Xvfb + Chrome headed chạy được
   (H5/H6/H9 click-test headed thành công; H8 skip headed do Playwright
   download thất bại — giới hạn VM, không phải lỗi code).

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 81 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (worker báo pass 41,69 s; chỉ md/test đổi sau đó).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59** (sau parent fix §1.3).
  cssClasses61R4: **60/60** (sau parent fix §1.3).
- r6-i18n-check: **PASS** (dict nay 2461; 2 lỗi `nested.*` mà log H8
  ghi nhận đã hết — H7 đã sửa trong lúc gộp).
- Suite luồng: H7 modals **13/13** (format esm — file có top-level
  await); H5 webkit **11/11**.
- Chưa chạy lại: H1/H2/H3/H4/H6/H8/H9/H10 (tin LIMITS từng luồng:
  H1 stress 0/60; H2 A/B 6 phiên; H3 probes; H4 sweep 23 + 4;
  H6 A/B headed; H8 bridge 59/59 + E2E 37/37; H9 N9 + H9; H10
  preset tests).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round80-h1-vidstab-taskset.txt` (2),
  `h2-gate-ab.txt` (3), `h3-kernel-bc-probes.txt` (14),
  `h4-g1g2-q4.txt` (13), `h5-webkit-loop.txt` (8),
  `h6-g8-rootcause.txt` (2), `h7-modals-i18n.txt` (27),
  `h8-ai-progress-cancel.txt` (30), `h9-clicktest-core.txt` (5),
  `h10-social-presets.txt` (17),
  `phase9-round80-closing.txt` (2: LIMITS gộp + gap analysis).
- Tổng đợt 80: **123 entry / 11 file**. Tổng chờ push sau đợt 80:
  **806 entry / 138 file batch / 511 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
  đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
  đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11).
  HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 81 (§8)

1. **Vidstab crash (H1):** 0/60 lần thứ 3 liên tiếp — crash vẫn chưa
   đo được ở bất kỳ đường nào; cần setup mạnh hơn nữa (tải cao hơn,
   clip dài hơn, hoặc chấp nhận crash không tái hiện được trên VM này).
2. **Gate (H2):** độ sắc ngưỡng FN 2 fps VẪN CHƯA kiểm chứng được
   (dải 1,5–2,5 fps thiếu mẫu); luật mới bắt FN sớm 0/3 — đánh đổi đã
   chấp nhận, nhưng cần theo dõi thêm phiên FN.
3. **Kernel BC (H3):** Chrome không dùng BC ở xung vuông — cần hiểu
   vì sao BC vẫn bù lệch đường sharp (mở nợ mới §5); noise 640 đã sửa
   (bt709-vs-bt601).
4. **G1/G2 (H4):** phân biệt chỉ ở số học không-làm-tròn (biên
   0,0008) — harness làm tròn 2 chữ số nên vẫn báo khớp cả hai; G2 vs
   G12 vẫn chưa phân biệt được; săn Q4 thất bại ở phía resid.
5. **WebKit loop (H5):** workaround `ended → seek(0) + play()` đã
   sửa loop trên WebKitGTK — cần đo Safari thật (WebKitGTK không phải
   Safari thật).
6. **TTS 39:** vẫn chờ Gradio stable 7.x (dev 7.0.0.dev0 đã nới cap
   pillow<14 từ đợt 78 F5) — **CẤM kiểm lại mỗi đợt** (đã kiểm 6 lần
   liên tiếp không đổi; chỉ kiểm khi có tín hiệu stable mới).
7. **FPS deint-only (G1):** đã đóng đợt 79 — theo dõi hồi quy (G8
   +0,099 là chi phí đã biết, không phải hồi quy).
8. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium/WebKitGTK).
9. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
10. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

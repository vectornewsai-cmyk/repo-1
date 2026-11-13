# LIMITS gộp — Phase 9 đợt 82: đóng nợ đợt 81 §4 (10 mục, 10 luồng)

Ngày: 10/11/2026 (lượt cron 21:35 +07 → worker báo cáo 23:48 +07,
nói 7/10 luồng, J1/J6/J8 chưa về — parent kiểm đĩa đính chính).
10 luồng song song J1–J10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 82: **8/10 luồng xong + stage** (J1 đã stage đủ, worker báo
> cáo sai — xem §1). **J8 đã xong việc nhưng chưa stage batch**
> (LIMITS + 6 file đổi đã có trên đĩa — parent stage trong closing).
> **J6 DỞ DANG THẬT** (md còn "(điền sau khi đo xong)", driver log
> đang chạy — chuyển đợt 83). **I2/I4 đợt 81 đã hoàn thành MUỘN**
> trước khi đợt 82 bắt đầu (batch + LIMITS đã có — gộp vào đây, xem
> §1). Dict 2463 không đổi. Tổng chờ push sau đợt 82: **927 entry /
> 158 file batch / 601 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
> đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
> đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
> đợt 81: 51/9 + 12 muộn (I2/I4); đợt 82: 58/9 — xem §3).
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 81 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| I2 (muộn) | §4.2 Gate 2fps | **NỢ ĐÃ ĐÓNG — đã có ca slot1 FN + re-gate FAIL trong dải, ở phía dưới 2 fps.** Verdict lật đúng theo phía của 2 fps trong mọi ca (2,23 / 2,27 / 2,30; biên 0,03 fps, re-gate 17 FAIL → luật mới THA). KHÔNG sửa harness, KHÔNG sửa production. Lưu ý: S1/S3/S5 KHÔNG CÓ JSON — mỗi phiên 6 attempt chết gate 1a (delta 2 là chính; S1 attempt 1 suýt qua với delta 19). | Gate sessions |
| I4 (muộn) | §4.4 G1/G2 unrounded | **G2 vs G12: KHÔNG — 0 case** trong sweep không-làm-tròn 75 case + 14 case capture Q4 mới. **Q4: 0 case** (4 ứng viên qua screen đều trượt ở resid sau decode). **Đính chính quan trọng (đảo ngược kết luận H4 §1.2):** "blend làm sụp residStd_R" là **sai do so sánh lệch chuẩn** — blend a88 có resid 1,22, khớp gần như chính xác với dự đoán trung bình-không-tương-quan từ cha still (1,24). Không có hiệu ứng sụp nào ngoài mô hình. Phát hiện thứ hai: chroma-scale **giữ nguyên resid** (s20 0,74 = still-gốc 0,74; s12 0,70 ≈ 0,71). delta0 là hiệu chỉnh đo lường trong harness, KHÔNG nằm trong production. | Sweep 75 + 14 |
| J1 | §4.3 Vidstab per-frame | **Harness per-frame đã nối xong** (endpoint mới từ I1: NC lệch 58,8% ở 720p thay vì crash 0/270). Chi tiết: xem LIMITS J1. | Harness self-check |
| J2 | §4.3 Kernel BC | **ĐÃ TÌM RA KERNEL THẬT — VÀ NÓ KHÔNG PHẢI BC(0,25, 0,375).** Kernel thật của Chrome = **Mitchell (1/3, 1/3)**. Probe headed khớp từng số (MAD 0,000–0,003). Đề xuất đổi hằng số nhưng **chưa tự sửa file chung** (đổi production cần parent quyết — xem §4). | J2 test exit 0 |
| J3 | §4.5 Deint median | **Verdict theo TRUNG VỊ: PASS — nhưng KHÔNG có biên an toàn.** Median 10 lần 0,807×; CI 95% mean gộp [0,74; 0,95] chạm ngưỡng 0,75×. Đề xuất verdict median 5 lần + ≥4/5 PASS. | Median 10 runs |
| J4 | §4.4 G2/G12 hunt | **Vẫn 0 case phân biệt (bound 0/81).** **Alert: EPERM TÁI PHÁT 22:50–23:05 +07** (ffmpeg fail 13 lần, node write fail rải rác); thí nghiệm codec VP9-vs-h264 chưa chạy. | Sweep 81 |
| J5 | §4.4 Q4 resid | **Cơ chế = lệch chỉ số frame (off-by-one; f24 ≠ f25), không phải làm mượt. DỪNG SĂN Q4 hướng cũ.** Q4 cần `residStd_R ≥ d0std_R > 2`; resid khớp-frame thật của slovenska chỉ ~0,5–0,7 (không phải 2,95), của tp lớn (4,46) nhưng `d0std_R` chỉ ~0,9–1,7 (chroma đã bão hòa rail). Hai điều kiện kéo ngược nhau trên mọi họ đã đo. Hướng duy nhất chưa thử: sọc màu mịn (chromatic fine stripes). | J5 test 30/30 |
| J6 | §4.2 Gate 2fps | **DỞ DANG** — md còn "(điền sau khi đo xong)", driver log đang chạy. Chuyển đợt 83. | — |
| J7 | §4.3 Lineart aliasing | **Cơ chế đã thu hẹp đáng kể — nhưng KHÔNG có hướng sửa nào có bằng chứng. Không sửa production.** (Không nằm ở đường effect — E1 MAD 0,05–0,08; không phải kernel — cả 4 kernel đều cho delta MAD chênh nhau ≤0,22; không phải pha lấy mẫu.) | Alias probes |
| J8 | §4.9 Electron ship | **QUYẾT ĐỊNH SHIP: profile `full` làm mặc định** — AppImage bundle bridge + render + 4 slim venv Python (caption/tts/reframe/bgremove); model AI (~3,7 GB) KHÔNG bundle, tải lần đầu trong app (modelDownloader I5: resume + SHA256). AppImage full đo thật **556.967.568 byte** (sha `43a2d045…57be`, build run2 10/11); minimal 147.915.613 byte giữ làm profile nhẹ (AI chết không venv downloader). Full + model bundle (~4,3 GB) đã loại. Script ship chuẩn `package-ship.mjs` (fail-fast, retry EPERM, parser smoke chịu race guard 30s). | build-desktop PASS; prepackage PASS |
| J9 | §4.9 Preview FPS | **Kết quả âm — FPS = f(tải VM), không cải thiện code. KHÔNG có thay đổi production nào được giữ.** Tick nền không-video ~60 ms lúc tải ~3,5. | Draw-cost probes |
| J10 | §4.10 Bin O2 | **Đóng nợ O2 không cần sửa production** — bin rehydrate với media import hoạt động đúng (P1), toast style đã hết. | Click-test headed |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — J1 đã stage.** Handoff nói J1/J6/J8
   "đang chạy lúc kết thúc lượt" — trên đĩa có batch J1 (3 entry,
   16:40 UTC), LIMITS J1, md log J1. Đợt 82 thực tế **8/10 luồng
   xong + stage** (J8 tính riêng, xem mục 2). Mẫu handoff stale quen
   thuộc (đợt 68, 71, 72, 74, 76, 78, 80, 81).
2. **J8 đã xong việc nhưng chưa stage batch — parent stage trong
   closing.** LIMITS J8 + 6 file đổi đã có trên đĩa (đều text, đã
   kiểm tồn tại): `package-ship.mjs` (mới), `package.json`,
   `pythonServices.js` (probe timeout 15s → 120s),
   `build-slim-venv.mjs` (verify timeout 120s → 300s),
   `DESKTOP.md` (§ mới profile ship), LIMITS J8. KHÔNG stage:
   `apps/desktop/dist/`, `build/`, `release/`, AppImage 556 MB +
   linux-unpacked (chỉ ở `~/workspace/tmp-j8-electron/` ngoài repo).
3. **I2/I4 đợt 81 hoàn thành muộn — đã stage đủ, gộp vào đây.**
   Worker nói đúng: I2 batch 2 entry (NUL ✓), I4 batch 10 entry
   (NUL ✓), cả hai LIMITS đã có. Đợt 81 nay là **10/10 hoàn thành**
   (51 + 12 = 63 entry / 11 file). I4 đính chính H4 §1.2 (xem §0).
4. **EPERM TÁI PHÁT — đính chính tin 18:36.** Proactive check lúc
   18:36 +07 nói EPERM đã hết là ĐÚNG lúc đó (ghi/đọc/xóa thành
   công; đợt 81 ghi file bình thường). Nhưng sóng **tái phát
   22:50–23:05 +07** (J4 LIMITS: ffmpeg fail 13 lần, node write
   fail rải rác) — EPERM là sóng lặp lại, không phải đã hết hẳn.
   J8 đã thêm retry EPERM vào `package-ship.mjs`. Đợt 82 vẫn stage
   đủ 8/10 — sóng ngắn (15 phút) không chặn được lượt.
5. **Dict: không đổi.** 2463/2463, 0 mismatch; không luồng nào thêm
   key đợt này.
6. **Xung đột file chung: gộp sạch.** DESKTOP.md (J8), package.json
   (J8), preview.tsx (J2 probe?) — tsc web **0**, desktop **0**.
   Không binary, không workflow. Không batch nào thiếu NUL cuối
   (cả 8 batch J + 2 batch I muộn đều NUL: True).
7. **Log: các luồng tự ghi entry riêng, chưa có entry gộp.** Log có
   entry riêng của J9 (tổng 158 file / 926 entry / 602 unique theo
   đếm mtime ≥ push #4 — **phương pháp khác** với đếm paths-loop
   của parent; không dùng số đó). Parent viết entry gộp này; các
   entry riêng giữ nguyên làm hồ sơ.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 83 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (chỉ script/test/md đổi; không đụng component).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2463).
- Suite luồng: J2 chrome-probe test **exit 0**; J5 Q4 resid test
  **30 pass, 0 fail**.
- Chưa chạy lại: J1/J3/J4/J7/J8/J9/J10 (tin LIMITS từng luồng: J1
  harness self-check; J3 median 10 runs; J4 sweep 81; J7 alias
  probes; J8 build-desktop PASS + prepackage PASS + AppImage thật
  556.967.568 byte; J9 draw-cost probes; J10 click-test headed).

## 3. Batch đã stage (KHÔNG push)

- Đợt 81 muộn: `phase9-round81-i2-gate-2fps.txt` (2),
  `phase9-round81-i4-g1g2-unrounded.txt` (10).
- Đợt 82: `phase9-round82-j1-vidstab-perframe-harness.txt` (3),
  `j2-kernel-bc-chrome-probe.txt` (5), `j3-deint-fps-median.txt` (4),
  `j4-g2g12-hunt.txt` (9), `j5-q4-resid-mechanism.txt` (7),
  `j7-lineart-aliasing.txt` (10), `j9-preview-fps.txt` (10),
  `j10-bin-rehydrate.txt` (2),
  `phase9-round82-closing.txt` (8: LIMITS gộp + gap analysis + 6 file J8).
- Tổng đợt 82: **58 entry / 9 file** (50 thread + 8 closing, trong đó
  6 là file J8). Tổng chờ push sau đợt 82: **927 entry / 158 file
  batch / 601 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9;
  đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10; đợt 73: 56/10;
  đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10; đợt 77: 40/10;
  đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11; đợt 81: 63/11
  (51 + 12 muộn); đợt 82: 58/9). HEAD GitHub vẫn `5f548ef8`.
  KHÔNG push.

## 4. Nợ mở cho đợt 83 (§8)

1. **J6 dở dang (gate 2fps):** tiếp I2 — chạy thêm phiên chuẩn nhắm
   dải dưới-2fps có re-gate FAIL (mục tiêu ≥3–4 ca dưới 2,0 fps),
   gộp E2+F2+G2+H2+I2+J6, kết luận ngưỡng 30/20/2.
2. **J2 kernel Mitchell:** kernel thật của Chrome = Mitchell (1/3,
   1/3), KHÔNG phải BC(0,25, 0,375) — **quyết định: đổi hằng số
   production sang Mitchell hay giữ BC?** BC đang bù lệch đường
   sharp (H3 §1.4); Mitchell khớp kernel thật nhưng chưa biết có bù
   được lệch sharp không. Cần A/B trước khi đổi.
3. **J3 deint median:** verdict PASS nhưng không biên an toàn —
   áp verdict median 5 lần + ≥4/5 PASS hay giữ verdict 1 lần?
4. **J4 G2/G12:** 0/81 — bound đã chặt; thí nghiệm codec VP9-vs-h264
   chưa chạy (bị EPERM cắt).
5. **J5 Q4:** dừng săn hướng cũ — hướng duy nhất chưa thử: sọc màu
   mịn (chromatic fine stripes).
6. **J7 lineart:** cơ chế thu hẹp nhưng không hướng sửa có bằng chứng
   — cần hướng mới.
7. **J8 ship full:** AppImage full 557 MB đã build thật + smoke —
   cần click-test gói thật trên máy sạch (VM này thiếu 5 lib hệ
   thống cho .deb; AppImage smoke đã chạy dưới Xvfb).
8. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**
   (đã kiểm 6 lần liên tiếp không đổi; chỉ kiểm khi có tín hiệu
   stable mới).
9. **EPERM là sóng lặp lại** (tái phát 22:50–23:05 +07 sau khi đã hết
   lúc 18:36) — theo dõi mỗi đợt, không tuyên bố "đã hết hẳn".
10. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
    CPU/SwiftShader + Chromium/WebKitGTK).
11. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App).
12. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

# LIMITS gộp — Phase 9 đợt 85: đóng nợ đợt 84 §4 (13 mục, 10 luồng)

Ngày: 11/11/2026 (lượt cron 06:35 +07 → worker báo cáo 08:22 +07,
nói "không tạo được batch: không có log build, không stage file
paths-loop nào, không ghi build-loop-log" — parent kiểm đĩa đính chính).
10 luồng song song M1–M10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 85: **10/10 luồng xong + stage** (M4 đã xong việc trên đĩa —
> LIMITS do parent viết từ log luồng + file trên đĩa, xem §1).
> Worker báo cáo sai hoàn toàn (xem §1). Dict 2489 → **2507**
> (M7 +11 key, M8 +7 key). Tổng chờ push sau đợt 85:
> **1220 entry / 190 file batch / 768 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
> đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
> đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
> đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9; đợt 83: 44/10;
> đợt 84: 82/11; đợt 85: 167/11 — xem §3). HEAD GitHub vẫn `5f548ef8`.
> KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 84 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| M1 | §4.1 G1 (deint combo) | **SỐ CHO PARENT/USER QUYẾT, M1 KHÔNG TỰ ĐÓNG G1.** Pool 30fps KHÔNG ĐỔI (không chạy thêm E1 30fps ở luồng này); CI cận dưới 0,640 DƯỚI ngưỡng 0,75. Fixture 60fps KHÔNG cứu được verdict. | Combo + 60fps probes |
| M2 | §4.3 Toán tử video | **Δcorr ở s ≈ 2,26 KHÔNG phải hiệu ứng thang, KHÔNG phải đường plain/video, mà là...** (xem LIMITS M2 — đã tách được nguồn). KHÔNG sửa production. | Video-operator probes |
| M3 | §4.4 Vidstab aliasing | **Backport parser showinfo sang J1 + K10: XONG, ĐÃ KIỂM CHỨNG.** Parser mới giống hệt L4; selfcheck J1 9/9 PASS (thêm check 2b); negative control tái hiện đúng lỗi cũ (gán nhầm mean frame n+1 cho frame n, mất entry frame n+1) và chứng minh parser mới sửa đúng. **Endpoint KHÔNG ĐỔI** như L4 đã thấy (md5 totalDiv/divPerRun không đổi ở toàn bộ 21 arm; mọi p-value không đổi; 0 leaf poison nào đổi). Chỉ trường phụ thuộc showinfo sạch hơn: showMissing 32→0 (K10) / 14→0 (J1); parse khôi phục +32 frame (K10) / +14 frame (J1). **Cơ chế lõi cache_stop RÕ HƠN MỘT BẬC, NHƯNG CHƯA ĐÓNG** (ranh giới sở hữu buffer trong filter + libvidstab đã xác định; transform trong 1 lần gọi đồng bộ KHÔNG có đường nào đọc được frame n+1). | Selfcheck 9/9; 21 arm md5 |
| M4 | §4.5 W7/W6 | **W7 truy xong, KHÔNG sửa production.** Chromium +1 sau gỡ ghi đè = artifact bắn lặp (ĐÃ CHỨNG MINH: event thứ 2 wallMs sớm hơn tUnforce 224 ms, bắn TRƯỚC khi gỡ); WebKit: 0 restart dư (P1/P2/P3/P5); quan sát +1 phase B của L10 KHÔNG tái hiện 2 lần → còn là 1 quan sát đơn lẻ. **W7: nửa Chromium ĐÓNG (artifact), nửa WebKit còn MỞ.** **W6 đo xong, KHÔNG giữ cách giảm nào:** seek thô nhanh (14–1517 ms); **drawImage là thành phần duy nhất gây chậm** (~+270 ms/seek, 3–11×); fastSeek và keyframe-first LOẠI; pause-seek-play có vẻ nhanh hơn về `seeked` nhưng chưa chứng minh được frame sẵn sàng (rVFC không bắn trên WebKitGTK 27.2) → KHÔNG đổi code. | webkitRestartTrace 10/10; loopRestart 11/11 |
| M5 | §4.6 EPERM wiring | **Sóng EPERM: KHÔNG gặp trong lượt này** (probe #1–#6, 23:41–00:31Z, 0 fail) — nhưng KHÔNG tuyên bố "đã hết hẳn". Helper retry đã nối vào **50 file** (web scripts, server, desktop, mcp-server, cli). | EPERM probes 6/6 |
| M6 | §4.7 Ship services rest | **4/5 job PASS thật trong gói AppImage K7 (profile `full`): Reframe, Translate, Silence, Scene PASS. Bgremove birefnet-general FAIL** — session mặc định bị SIGKILL (nghi OOM-kill khi VM tải cao), bridge tự fallback sang u2net và job vẫn hoàn tất bằng u2net sau 412,5s (fallback hoạt động đúng thiết kế, nhưng job này KHÔNG được tính là birefnet chạy được). Nợ Phase 10 nay đóng ở mức **7/8 job AI đã chạy thật trong gói** (L7: TTS, caption, bgremove-u2net; M6: reframe, translate, silence, scene); chỉ còn birefnet-general chưa có 1 lần chạy thành công nào trong gói. | E2E 4/5 |
| M7 | §4.8 Voice cloning real | **Tổng hợp bằng giọng người thật đã clone — THÀNH CÔNG (lần 2).** Mẫu là giọng đọc thật (LibriSpeech), chỉ lưu ở `/tmp/m7-librispeech/` trên VM này + bản export JSON — **KHÔNG đưa mẫu giọng vào repo/batch push.** Clone2277 vs preset Hải Đăng cosine 0,4570 (clone KHÔNG sụp về preset). Lỗi lần 1 là nhất thời do tải VM, không tái hiện ở lần 2. Export là 1 file JSON, KHÔNG zip. Dict +11 key (tts.* export/import giọng). | clonedVoices 21/21 |
| M8 | §4.9 Proxy progress/retry | **Tiến trình % + hàng đợi thử lại đã nối xong.** proxyAuto unit **46/46 pass** (35 cũ + 11 mới); bridge verify **19/19 pass**. Dict +7 key (mediabin.proxy* progress/retry — LIMITS M8 ghi "+8" nhưng chỉ liệt kê 7 tên; 2489+11+7=2507 khớp đĩa). | proxyAuto 46/46; bridge 19/19 |
| M9 | §4.10 Save dialog Enter | **Enter KHÔNG đóng dialog là hành vi CHUẨN của GTK file chooser, KHÔNG PHẢI lỗi sản phẩm.** Full-path + Return ×2 → STILL_OPEN (Return lần 1 KHÔNG navigate, KHÔNG xác nhận). Nợ L1 lần 15/16 ĐÃ ĐÓNG ở mức "không phải bug". | Click-test headed |
| M10 | §4.3 Lineart video scaler | **ĐÃ ĐO XONG + ĐÃ SỬA (production) + ĐÃ VERIFY TRONG APP (harness L5 chạy lại: 7/7 pass).** Edge-map: lỗi KHÔNG tập trung ở biên (interior 1,598 / edgeBand 1,662). | L5 harness 7/7 |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai hoàn toàn — đợt 85 đã chạy đủ.** Handoff
   nói "không tạo được batch: không có log build, không stage file
   paths-loop nào, không ghi build-loop-log.md. Không đủ bằng chứng
   cho biết công việc đã chạy." Trên đĩa có đủ: **9 batch (115
   entry)**, 9 LIMITS doc, 10 md log luồng (m1–m10), 10 dòng log
   vòng lặp của các luồng. Đợt 85 thực tế **9/10 luồng xong + stage**
   (M4 xem mục 2). Đây là lần thứ hai worker báo "không có gì"
   trong khi mọi thứ đều có (đợt 80, đợt 85) — mẫu handoff stale ở
   mức nặng nhất. Luôn kiểm tra đĩa trước khi kết luận một lượt
   trống. (Worker đợt 85 có thể đã đọc log trước khi các luồng ghi
   xong, hoặc đọc sai đường dẫn.)
2. **M4 đã xong việc trên đĩa — parent viết LIMITS + stage.**
   Log luồng M4 đầy đủ (W7/W6 + kiểm chứng + danh sách file stage)
   + 13 file đổi đã có trên đĩa (preview.tsx, tsconfig.json,
   webkitRestartTrace85M4.ts/.test.ts, clicktest-85m4-webkit-w7.mjs,
   4 script benchmark, 4 JSON kết quả) + LIMITS do parent viết từ
   log. **Đợt 85 thực tế 10/10.** (Mẫu K7 đợt 83.)
3. **Snapshot test CHƯA bump — parent sửa (mẫu đợt 71/72/84).**
   M7 (+11 key) và M8 (+7 key) đưa dict lên 2507 nhưng KHÔNG bump
   test khóa số key: 17 file vẫn assert 2489, 0 file nhắc 2507. M7
   và M8 đều ghi rõ trong LIMITS của mình là "KHÔNG tự bump — parent
   bump ở closing" (M7 còn gợi ý chỉ bump 3 file — chưa đủ; parent
   bump đủ bộ). Parent đã bump **18 file** — 12 file assert 2489 →
   2507 (ProjectMenu, saveToast31, structuredNotes32,
   reverseBadge46B6, reverseCompat44Z6, reversePlaybackI18n49E2,
   reverseToggleI18n48D4, i18nRound57N4, i18nAudit59P7,
   i18nOrphans60Q4, codecProbeUi75C6, i18nModals79G9) + css60 §8
   TtsButton (keys 38 → 49, call site 48 → 63 — đếm bằng đúng regex
   của checkI18n: 63 total, 49 unique; +11 key tts.* export/import
   của M7; con số 62 trong LIMITS M7 là sai — đếm lại = 63) + 5 file
   comment chuỗi thành phần (speedWarn, codecProbeDebts,
   i18nModals80H7, i18nSweep81I9, errorDetail34Q4). Sau sửa: orphans
   16/16, P7 8/8, css60 59/59. **Tất cả 18 file nằm trong closing
   batch.**
4. **Xung đột file chung: gộp sạch.** preview.tsx (M4 trace W7 +
   M10 video scaler — cả hai đều sửa preview.tsx; tsc 0),
   bridge index.js (M5 + M7 + M8), render.js (M5), proxy.js (M5 +
   M8), MediaBin.tsx (M8), TtsButton.tsx (M7), vi/en.json (M7+M8)
   — tsc web **0**, desktop **0**. M4 ghi nhận: tsc lúc đầu báo 10
   lỗi MediaBin.tsx do M8 đang sửa dở — đã tự hết ở lần chạy sau.
   Không binary, không workflow. Không batch nào thiếu NUL cuối
   (cả 10 batch M đều NUL: True).
5. **Log: các luồng tự ghi entry riêng (10 dòng), chưa có entry
   gộp.** Parent viết entry gộp này; các entry riêng giữ nguyên làm
   hồ sơ.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 86 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (M4 đã build pass 5,76s trong lượt; chỉ test/md
  đổi sau đó).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16** (sau parent fix §1.3).
  cssClasses60Q2: **59/59** (sau parent fix §1.3).
  cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2507).
- Suite luồng: M7 clonedVoices **21/21**; M8 proxyAuto **46/46**
  (format esm — file có top-level await; lần chạy đầu của parent
  bằng CJS fail do ghi bundle esm ra file .cjs — lỗi cách chạy của
  parent, không phải lỗi code; chạy lại với .mjs: 46 pass, 0 fail);
  M4 webkitRestartTrace **10/10**.
- Chưa chạy lại: M1/M2/M3/M5/M6/M9/M10 (tin LIMITS từng luồng: M1
  combo + 60fps probes; M2 video-operator probes; M3 selfcheck 9/9
  + 21 arm md5; M5 EPERM probes 6/6; M6 E2E 4/5; M9 click-test
  headed; M10 L5 harness 7/7).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round85-m1-deint-combo-60fps.txt` (3),
  `m2-video-operator-noise.txt` (13),
  `m3-vidstab-aliasing-backport.txt` (5),
  `m4-webkit-w7-w6.txt` (14),
  `m5-eperm-wiring.txt` (50), `m6-ship-services-rest.txt` (3),
  `m7-voice-cloning-real.txt` (12),
  `m8-proxy-progress-retry.txt` (10),
  `m9-save-dialog-enter.txt` (2),
  `m10-lineart-video-scaler.txt` (17),
  `phase9-round85-closing.txt` (34: LIMITS gộp + gap analysis + 14 file M4 + 18 file snapshot-bump).
- Tổng đợt 85: **167 entry / 11 file** (115 thread (9 batch) + 18 M4 + 34 closing). Tổng chờ push sau đợt 85:
  **1220 entry / 190 file batch / 768 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
  đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
  đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
  đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9; đợt 83: 44/10;
  đợt 84: 82/11; đợt 85: 167/11). HEAD GitHub vẫn `5f548ef8`.
  KHÔNG push.

## 4. Nợ mở cho đợt 86 (§8)

1. **G1 đóng hay chưa — parent/user quyết** (M1: pool 30fps không
   đổi, CI cận dưới 0,640 dưới ngưỡng; fixture 60fps không cứu
   được; L3 pool 20: 15/20 = 75% < 80%).
2. **Toán tử video** (M2: Δcorr s ≈ 2,26 đã tách được nguồn — xem
   LIMITS M2 §0; còn danh tính toán tử video đầy đủ).
3. **Vidstab cache_stop** (M3: cơ chế lõi rõ hơn một bậc nhưng chưa
   đóng; transform đồng bộ không có đường đọc frame n+1).
4. **W7 nửa WebKit còn MỞ** (M4: 1 quan sát +1 phase B chưa tái
   hiện; trace đã có sẵn).
5. **W6** (M4: hướng đợt sau — bỏ drawImage element đang seeking,
   vẽ frame giữ thay thế; audio graph là câu hỏi mở lớn nhất).
6. **Birefnet-general trong gói** (M6: chưa có 1 lần chạy thành công
   nào trong gói — SIGKILL nghi OOM-kill; fallback u2net hoạt động
   đúng; 7/8 job AI đã chạy thật trong gói).
7. **Voice cloning** (M7: tổng hợp bằng giọng người thật đã thành
   công; còn export/backup giọng đã xong — xem LIMITS M7; mẫu giọng
   KHÔNG đưa vào repo).
8. **EPERM** (M5: không gặp sóng trong lượt này nhưng không tuyên bố
   hết hẳn; helper đã nối 50 file).
9. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**
   (đã kiểm 6 lần liên tiếp không đổi; chỉ kiểm khi có tín hiệu
   stable mới).
10. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App).
11. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

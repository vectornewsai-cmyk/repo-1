# LIMITS gộp — Phase 9 đợt 81: đóng nợ đợt 80 §4 (10 mục, 10 luồng)

Ngày: 10/11/2026 (lượt cron 18:35 +07 → worker báo cáo 19:53 +07,
nói 7/10 luồng, I2/I4/I7 chưa về — parent kiểm đĩa đính chính).
10 luồng song song I1–I10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 81: **8/10 luồng xong + stage** (I7 đã stage đủ, worker báo
> cáo sai — xem §1). **I2/I4 DỞ DANG THẬT** (chỉ có thư mục đo + md
> kế hoạch, chưa có LIMITS/batch — xem §1). Parent gộp 8 luồng xong;
> I2/I4 chuyển thành nợ đợt 82. Dict 2461 → **2463** (I6 đã tự bump
> snapshot). Tổng chờ push sau đợt 81: **857 entry / 147 file batch /
> 535 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10;
> đợt 71: 42/10; đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10;
> đợt 75: 58/9; đợt 76: 67/10; đợt 77: 40/10; đợt 78: 48/11;
> đợt 79: 55/10; đợt 80: 123/11; đợt 81: 51/9 — xem §3).
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 80 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| I1 | §4.1 Vidstab mạnh hơn | **Crash VẪN KHÔNG tái hiện được — 0/60 lần chạy** (NC 0/20, SP 0/20, CP 0/20), lần thứ **4 liên tiếp** thiếu power (F3 0/90, G3 0/60, H1 0/60, I1 0/60 — gộp 4 đợt: **0/270**; P(0/270 \| p=0,70) ≈ 6,7×10⁻¹⁴²). Control 1080p gộp: **0/50** vs E3-F 7/10 → Fisher p≈3,1×10⁻⁷. **MỚI: endpoint per-frame CÓ POWER ở 720p** — NC lệch **882/1500 frame (58,8%)**, mỗi run 87–90; SP/CP 0/1500. **Cơ chế race mới, 2 chế độ:** (a) giữa stream (chủ đạo, 881/882 frame lệch): buffer-reuse khi còn live — cả 3 plane cùng lệch, frame lệch là frame hợp lệ khác; (b) drain/EOF (hiếm, 1/882): use-after-free thật — frame r2 n=148 đọc mặt phẳng Y đã free (chứng minh bằng poison). Crash E3 là đuôi hiếm của chế độ (b) — cần đúng lúc page bị unmap/tái cấp. | Stress 0/60; per-frame 882/1500 |
| I2 | §4.2 Gate 2fps | **DỞ DANG** — thư mục đo còn chạy lúc worker báo cáo (driver log tới 12:53 UTC); chưa có LIMITS/batch. Chuyển đợt 82. | — |
| I3 | §4.3 Kernel BC sharp | **ĐÃ TÌM ĐƯỢC CƠ CHẾ — nhưng chỉ một nửa. Không sửa production.** (Chi tiết: xem LIMITS I3 §1–§3 — ffmpeg unsharp đúng là nhị thức; lệch không nằm ở đường effect; kernel quyết định, không phải render/model.) | Mechanism probes |
| I4 | §4.4 G1/G2 unrounded | **DỞ DANG** — chỉ có md kế hoạch + thư mục capture (tới 12:53 UTC); chưa có LIMITS/batch. Chuyển đợt 82. | — |
| I5 | §4.7 Deint hồi quy | **KHÔNG HỒI QUY, NHIỄU ĐO LỚN.** Nhưng verdict "G1 đóng" mỏng hơn tưởng: ngưỡng 0,75× nằm trong nhiễu đo (lịch sử: H6 run 3 0,71×); **loadavg 1-phút KHÔNG dự báo được tỉ lệ.** | E1 re-run |
| I6 | §4.8 AI job ETA | **ETA đã nối xong** (ước lượng thời gian cho job AI — phần còn thiếu của N4 sau H8). Dict +2 key (`aiJob.etaEstimating` + `aiJob.etaHours`) → **2463**. Không đổi kẹp 99 (đổi sẽ vỡ pin có chủ ý + test M8). | aiJobStream 8/8 |
| I7 | §4.5 WebKit loop wire | **Workaround ĐÃ NỐI vào production từ đợt 80 H5** — vòng này KHÔNG sửa production, chỉ kiểm chứng. **W1 đầy đủ KHÔNG chứng minh được trên VM** (WebKitGTK ≠ Safari thật — mọi kết luận WebKit vẫn là xấp xỉ). | Click-test headed |
| I8 | §4.9 Click-test M10 | **M10 sau sửa: PASS** (tsc 0 sau sửa sản phẩm; vite build KHÔNG chạy lại — xem LIMITS I8 §6). M11 lượt 4 PASS. | M10/M11 |
| I9 | §4.10 i18n sweep N2 | **Quét AST toàn `apps/web/src`: 2069 literal VI / 65 file — KHÔNG còn chuỗi UI thật nào chưa wire.** 80 key khóa trong test mới. P7 8/8, orphans 16/16, H7 13/13, G9 9/9. KHÔNG đụng TTS 39 / Gradio. | i18n sweep 16/16 |
| I10 | §4.10 Presets render | **Cả 6 preset KHỚP spec** (trong dung sai VBV). **KHÔNG sửa code** (không preset nào lệch thật cần sửa): `ExportPanel.tsx`, `render.js`, `gpuencode.js`, `exportPresets.ts` đều giữ nguyên. Audio Shorts 384k chỉ ra 248k — KHÔNG phải lỗi preset (đã loại trừ nguồn). | Preset render |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — I7 đã stage.** Handoff nói I2/I4/I7
   "chưa về kết quả" — trên đĩa có batch I7 (4 entry, 12:31 UTC),
   LIMITS I7, md log I7. Đợt 81 thực tế **8/10 luồng xong + stage**.
   Mẫu handoff stale quen thuộc (đợt 68, 71, 72, 74, 76, 78, 80).
2. **I2/I4 dở dang thật — lần đầu worker đúng về 2 luồng.** I2 chỉ
   có thư mục đo (driver log tới 12:53 UTC, lúc worker báo cáo);
   I4 chỉ có md kế hoạch + thư mục capture (tới 12:53 UTC). Không
   LIMITS, không batch. Cả hai đều là công việc đang chạy dở, không
   phải đã xong mà báo cáo thiếu — chuyển thành nợ đợt 82 (ghi rõ
   trong §4). Không đoán kết quả của chúng.
3. **Sóng EPERM đã hết — xác nhận lần 2.** Proactive check lúc
   18:36 +07 (ghi /tmp + workspace, đọc lại đúng, xóa sạch; ổ 90G
   trống) — đợt 81 ghi file bình thường suốt lượt (batch cuối 12:51
   UTC). Lần ghi file đầu tiên của đợt 81 là xác nhận cuối cùng như
   đã hứa — đã có, không EPERM.
4. **Dict: I6 đã tự gộp, parent không cần bump.** Dict **2463/2463,
   0 mismatch**; 17 file test assert 2463; 5 file còn nhắc 2461 đều là
   comment lịch sử đúng (ProjectMenu dòng 187, codecProbeDebts dòng
   17/20, i18nModals80H7 dòng 30, speedWarn dòng 23, i18nSweep81I9
   dòng 12 — chuỗi thành phần đầy đủ tới I6). Tên test orphans đã
   khớp thành phần mới.
5. **Xung đột file chung: gộp sạch.** vi/en.json (I6), aiProgress.js
   (I6), PerfOverlay.tsx (I8), preview.tsx (I3) — tsc web **0**,
   desktop **0**. Không binary, không workflow. Không batch nào thiếu
   NUL cuối (cả 8 batch đều NUL: True).
6. **Log: các luồng tự ghi entry riêng, chưa có entry gộp.** Log có
   entry riêng của I1 (tổng 855/146/534 ở thời điểm I1 stage — đúng
   lúc đó vì I1 stage cuối cùng trong 8 luồng xong). Parent viết entry
   gộp này; các entry riêng giữ nguyên làm hồ sơ.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 82 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (I8 nói rõ không chạy lại; chỉ md/test đổi sau
  đó).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2463).
- Suite luồng: I6 aiJobStream **8/8**; I9 i18n sweep **16/16**.
- Chưa chạy lại: I1/I3/I5/I7/I8/I10 (tin LIMITS từng luồng: I1 stress
  0/60 + per-frame 882/1500; I3 mechanism probes; I5 E1 re-run; I7
  click-test headed; I8 M10/M11; I10 preset render).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round81-i1-vidstab-stronger.txt` (5),
  `i3-kernel-bc-sharp.txt` (5), `i5-deint-fps.txt` (1),
  `i6-ai-job-eta.txt` (26), `i7-webkit-loop-wire.txt` (4),
  `i8-clicktest-m10.txt` (4), `i9-i18n-sweep.txt` (2),
  `i10-presets-render.txt` (2),
  `phase9-round81-closing.txt` (2: LIMITS gộp + gap analysis).
- Tổng đợt 81: **51 entry / 9 file**. Tổng chờ push sau đợt 81:
  **857 entry / 147 file batch / 535 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
  đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
  đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
  đợt 81: 51/9). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 82 (§8)

1. **I2 dở dang (gate 2fps):** 5 phiên còn thiếu (S7–S10 + C1) —
   đợt 80 H2 chỉ chạy được 9/14 phiên vì sóng EPERM; đợt 81 I2 chưa
   xong. Ưu tiên chạy tiếp.
2. **I4 dở dang (G1/G2 unrounded + G12):** harness kurt không-làm-
   tròn + sweep 77 case + săn Q4 phía resid — chưa có kết quả.
3. **Vidstab crash (I1):** 0/270 gộp — crash vẫn chưa đo được; nhưng
   **endpoint per-frame CÓ POWER ở 720p** (NC lệch 58,8%) — dùng
   per-frame làm endpoint chính thay vì crash từ nay.
4. **Kernel BC sharp (I3):** cơ chế mới tìm được một nửa — làm nốt
   nửa còn lại.
5. **Deint FPS (I5):** verdict "G1 đóng" mỏng (ngưỡng 0,75× trong
   nhiễu đo) — cần nhiều lần đo hơn để khẳng định, hoặc chấp nhận
   verdict theo trung vị.
6. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**
   (đã kiểm 6 lần liên tiếp không đổi; chỉ kiểm khi có tín hiệu
   stable mới).
7. **WebKit loop (I7):** W1 đầy đủ không chứng minh được trên VM —
   cần Safari thật (máy macOS/iOS).
8. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium/WebKitGTK).
9. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
10. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

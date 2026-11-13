# LIMITS gộp — Phase 9 đợt 75: đóng nợ đợt 74 §4 (12 mục, 9 luồng)

Ngày: 09/11/2026 (lượt cron 21:35 +07 → timeout 3h, worker báo cáo
00:36 +07 10/11). 9 luồng song song C1–C9; C5 dở dang do timeout.
KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 75: **8/9 luồng xong + stage** (C1–C4, C6–C9); **C5 dở dang
> thật** (không LIMITS/log/stage — xem §1). Parent gộp: không cần bump
> snapshot (C6 đã bump 2405 → 2413); cập nhật gap analysis O1/O4 đã
> đóng. Tổng chờ push sau đợt 75: **473 entry / 86 file batch / 289
> file duy nhất** (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9;
> đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10; đợt 73: 56/10;
> đợt 74: 85/10; đợt 75: 58/9 — xem §3). HEAD GitHub vẫn `5f548ef8`.
> KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 74 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| C1 | §4.1 Sửa rò plain ocean | **ĐÃ ĐÓNG — Δkurt G 1,12 → 0,08 (≤0,35 ĐẠT).** Sửa rò plain ở preview (delta0 full-pixel + cùng-khung). Phát hiện phụ: **luật delta0 giờ kích hoạt sai (Δkurt R 0,45)** — ghi nợ đợt 76. | Analyze + FPS scripts |
| C2 | §4.2 Model dị hướng | **Model M4 (geo-mean LOD) exact 346.112 ô**; verdict w1920/w2560 **24/25 y hệt B2**. **Bác Mitchell tách trục bằng số đo thật.** | Lưới 2D dị hướng |
| C3 | §4.3 SEGFAULT phân tích regs+maps | **Frame lỗi xác định: n=148 plane Y, dest munmap toàn bộ.** Crasher tổng hợp + test **31/31 + 13/13**; free-hunt **0/24 crash**. **"Ai free" vẫn mở** — tracker v2 lock-free đợt sau. | regs-maps 31/31; free-track 13/13 |
| C4 | §4.4 Gate + slow-start đo thật | **Giữ ngưỡng 30** (FP kiểm duyệt đầu tiên **1/1** dưới sóng tải); slow-start **+2..+20 s**; cold start median **19,3 s** (mount 17,6 s). | Gate sessions |
| C5 | §4.5 TTS 39 + npm audit | **DỞ DANG (timeout).** pip-audit **39 CVE Pillow** (không đổi, CAP gradio vẫn giữ pillow<13), 4 package Python khác = **0 CVE**. npm audit **403 policy_denied**; OSV fallback timeout **10/10 chunk**, chưa có số npm. Chưa viết LIMITS/log/stage — đợt 76 làm tiếp. | (chưa có) |
| C6 | §4.7 Nối codecProbe vào UI | **Xong — badge bền + modal + toast gộp + rehydrate probe.** Dict **+8 key** `mediabin.codec*` → **2413**; headed **19/19**; test UI **16/16**. C6 tự bump 12 snapshot 2405 → 2413. | codecProbeUi 16/16; headed 19/19 |
| C7 | §4.8 Nối preset 4:5 vào ExportPanel | **Flow đã nối sẵn từ A9/B5 — chứng minh E2E 20/20 MP4 1080×1350.** Không sửa code sản phẩm mới (chỉ harness E2E + LIMITS). | E2E 20/20 |
| C8 | §4.1 (kề) Enhance preview deint | **Deinterlace tap dọc +0,5px ngưỡng ≥0,9, R 0,74→0,54.** **FPS deint-only 0,65–0,71× FAIL (ghi thật)** — tap nội tuyến khi chỉ có deint chưa đủ nhanh. | enhancePreview 14/14; Q1 16/16; R3 10/10 |
| C9 | §4.9 (kề) Gap O1/O4 | **O1/O4 ĐÃ ĐÓNG từ trước** (đợt 59 P2/P4 + đợt 60 Q10) — C9 chỉ kiểm chứng lại độc lập sau gộp: test tĩnh + click-test headed mới **9/9**. Không sửa file sản phẩm nào. Gap analysis § nợ mở đã cập nhật (parent). | Headed 9/9 |

## 1. Ghi chú parent merge

1. **C5 dở dang thật (không phải handoff stale).** Không có batch,
   LIMITS, md log nào của C5 trên đĩa (chỉ có LIMITS C5 của đợt 13/47
   cũ — không liên quan). Worker báo cáo đúng lần này. Nợ C5 (LIMITS +
   log + stage + số npm) để đợt 76.
2. **Dict: C6 đã tự gộp, parent không cần bump.** Dict **2413/2413,
   0 mismatch**; 13 file test assert 2413; 2 file còn nhắc 2405 đều là
   comment (ProjectMenu dòng 187 — ghi chú lịch sử đúng; codecProbeUi
   dòng 58 — "2405 → 2413"). Tên test orphans đã khớp thành phần mới
   ("2400 sau đợt 73 A9 + 4 key B9 + 1 key B3 + 8 key C6").
3. **Gap analysis O1/O4 đã cập nhật (parent).** § "Nợ mở lớn nhất còn
   lại" vẫn ghi O1/O4 như nợ mở dù §0.2 đã ghi đợt 59 đóng — parent đã
   sửa cả 2 mục thành "ĐÃ ĐÓNG (đợt 59 P2/P4; kiểm chứng lại đợt 75
   C9, headed 9/9)", stage cùng closing batch.
4. **Xung đột file chung: gộp sạch.** preview.tsx (C1 + C8),
   vi/en.json (C6 + C8 — C8 không thêm key mới, chỉ dùng key enhance.*
   đã có), store.ts (C6) — tsc web **0**, vite build **pass** (lần
   này parent không chạy lại vite vì các luồng đã build pass + chỉ đổi
   md/json sau đó; tsc 0 là đủ).
5. **Không EPERM trong lượt này.** Xvfb + Chrome headed chạy được
   (C6/C9 click-test headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 76 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (các luồng đã build pass; chỉ md/json đổi sau đó).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2413).
- Suite luồng: C6 codecProbeUi **16/16**; C8 enhancePreview **14/14**,
  Q1 **16/16**, R3 **10/10**; C3 regs-maps **31/31**, free-track
  **13/13**, free-hunt **0/24 crash**, hunt exit 0.
- Chưa chạy lại: C1/C2 headed (tin LIMITS từng luồng: C1 Δkurt G 0,08;
  C2 346.112 ô exact); C4 gate sessions (tin LIMITS C4); C7 E2E
  (tin LIMITS C7: 20/20).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round75-c1-ocean-plain-fix.txt` (4),
  `c2-resample-aniso-model.txt` (5), `c3-vidstab-regs-maps.txt` (7),
  `c4-gate-slowstart.txt` (1), `c6-codec-probe-ui.txt` (24),
  `c7-preset45-export.txt` (2), `c8-enhance-preview.txt` (11),
  `c9-escape-classes.txt` (2),
  `phase9-round75-closing.txt` (2: LIMITS gộp + gap analysis O1/O4).
- Tổng đợt 75: **58 entry / 9 file**. Tổng chờ push sau đợt 75:
  **473 entry / 86 file batch / 289 file duy nhất** (đợt 67: 68/9;
  đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
  đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9).
  HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 76 (§8)

1. **C5 — TTS 39 + npm audit (ưu tiên):** viết LIMITS + log + stage;
   npm audit OSV retry chunk nhỏ hơn (10/10 chunk timeout lần này);
   pip-audit 39 vẫn chờ upstream.
2. **Hiệu chỉnh luật delta0 (C1):** luật delta0 giờ kích hoạt sai
   (Δkurt R 0,45) sau khi sửa rò plain — cần hiệu chỉnh lại ngưỡng/
   điều kiện.
3. **"Ai free" (C3):** frame lỗi n=148 plane Y đã xác định, dest
   munmap toàn bộ — tracker v2 lock-free để tìm ai free.
4. **FPS deint-only (C8):** 0,65–0,71× FAIL — tap nội tuyến khi chỉ
   có deint chưa đủ nhanh; đo tap ở tỉ lệ 0,75, footage interlaced
   thật, tap+mask/SR/motion-blur ở tỉ lệ ≥ 0,9, Safari/Firefox.
5. **Gate (C4):** giữ ngưỡng 30; slow-start +2..+20 s, cold start
   median 19,3 s (mount 17,6 s) — theo dõi thêm phiên FN.
6. **Resample dị hướng (C2):** M4 geo-mean LOD exact 346.112 ô — nối
   M4 vào production (hiện chỉ đo, chưa sửa code) rồi đo lại verdict.
7. **Birefnet fps:** hết hướng giảm RAM — đo trên máy RAM tổng ≥ 12 GB
   hoặc chấp nhận không có số (u2net vẫn là fallback).
8. **Keyframe:** trần 90 s không ràng buộc; Safari codec-probe đã nối
   UI (C6).
9. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium).
10. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App).
11. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

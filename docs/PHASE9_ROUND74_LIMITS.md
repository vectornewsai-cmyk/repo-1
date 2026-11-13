# LIMITS gộp — Phase 9 đợt 74: đóng nợ đợt 73 §4 (11 mục, 9 luồng)

Ngày: 09/11/2026 (lượt cron 18:35 +07 → worker báo cáo 21:05 +07,
nói 8/9 luồng, B3 chưa về — parent kiểm đĩa đính chính). 9 luồng song
song B1–B9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 74: **9/9 luồng xong + stage** (B3 đã stage đủ 25 entry, worker
> báo cáo sai — xem §1). Parent gộp: không cần bump snapshot (B3 đã
> bump 2404 → 2405). Tổng chờ push sau đợt 74: **415 entry / 77 file
> batch / 258 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9;
> đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10; đợt 73: 56/10;
> đợt 74: 85/10 — xem §3). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 73 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| B1 | §4.1 Ocean w1440 (cơ chế phương sai thừa) | **Tìm ra cơ chế rò plain:** corr **0,993**; giao thức cùng-khung **11/11**; **Δkurt G 0,02 ở s cao**. Ocean không còn là "lệch thật không rõ nguyên nhân" — rò plain đã đo được. | 5 script probe/analyze + followup |
| B2 | §4.6 Resample dẹt + verdict w1920/w2560 | **Dị hướng: cả 2 model đều sai.** NEW tệ hơn OLD **5/6**; w1920 **1 verdict lật thật**, w2560 không đổi. Blend-at-end (A1) đúng ở thang vuông nhưng chưa đủ ở thang dẹt — cần model dị hướng riêng. | Lưới 2D dị hướng + control đẳng hướng |
| B3 | §4.7 Safari codec-probe | **Xong.** `codecProbe.ts` mới (probe codec Safari thật); test **19/19**; dict **+1 key** `mediabin.codecUnsupported` → **2405**; **B3 tự bump 12 snapshot 2404 → 2405** + cập nhật tên test orphans + comment/assert ProjectMenu (2405). | codecProbe 19/19; i18nOrphans 16/16 |
| B4 | §4.8 render.js spawnSync không timeout | **Xong — spawnSync có timeout + fallback.** Self-test **66/66 pass** (handoff ghi 13/13 là số scenario, không phải số check). | test_round74_b4_render_timeout 66/66 |
| B5 | §4.9 Preset 4:5 chưa render MP4 thật | **Xong — render MP4 thật 1080×1350, 90 frame, duration 3,000 s**; click-test CDP **22/22**; safe-area hiệu chỉnh (TikTok **11%/27%**, IG 4:5 **18%**). Render test **17/17**. | test_export_preset45 17/17; CDP 22/22 |
| B6 | §4.3 TTS 39 | **Vẫn mở (lần 6).** pip-audit **39** không đổi; 4 req Python khác **0**; **npm audit nợ mới** (chưa đo được số — xem LIMITS B6). | pip-audit 39 |
| B7 | §4.4 SEGFAULT chờ crash dưới handler mới | **3/45 crash**; chữ ký **plane Y offset n−128 khớp nhau** (cùng frame lỗi A2 đã xác định — `vsFrameCopyPlane` fast path). Handler mới (regs+maps) đã có dữ liệu crash để phân tích tiếp. | Stress 45 lần; test stress |
| B8 | §4.5 Gate giữ ngưỡng 30 | **Giữ ngưỡng 30.** Re-gate **lọt FN đầu tiên (delta 75)** — lần đầu re-gate lọt sau khi bắt 2/2 ở A6; **FP 0/7**. Ngưỡng 30 vẫn đứng (FN lọt là 1/3, chưa đủ đổi ngưỡng). Nghi slow-start ~10–15 s liên quan B3/B9 sửa preview/media — chưa đo, nợ đợt 75. | Gate sessions |
| B9 | §4.9 Preset 4:5 (karaoke) + dict | **3 template karaoke + SRT/VTT; dict +4 key** (2400 → 2404, rồi B3 +1 → 2405); render thật **21/21**, headed **6/6**; karaoke test **10/10**, alpha **8/8**, modal **23/23**. | captionKaraoke 10/10; karaoke_alpha 8/8 |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — B3 đã stage.** Handoff nói B3 "chưa về,
   đang chờ handoff cuối" — trên đĩa có đủ batch B3 (25 entry, stage
   12:02), LIMITS doc, md log. Đợt 74 thực tế **9/9 luồng xong +
   stage**. Mẫu handoff stale quen thuộc (đợt 68 V4, đợt 71 W9,
   đợt 72 Z7) — luôn kiểm tra đĩa trước khi kết luận một luồng thiếu.
2. **Dict: B3 đã tự gộp, parent không cần bump.** B9 +4 key (2400 →
   2404), B3 +1 key `mediabin.codecUnsupported` (2404 → 2405) và tự
   bump 12 snapshot 2404 → 2405 + cập nhật tên test orphans
   ("2400 sau đợt 73 A9 + 4 key karaoke style đợt 74 B9 + 1 key
   mediabin.codecUnsupported đợt 74 B3") + comment/assert ProjectMenu
   (2405). Dict nay **2405/2405, 0 mismatch**. Khác đợt 71/72 (Y5/Z5
   quên bump) — lần này luồng tự làm đúng.
3. **Xung đột file chung: gộp sạch.** preview.tsx (B9 + B3),
   validate.js + render.js (B4 + B9), store.ts/media.ts/sampleMime.ts/
   sample.ts/sampleMedia.ts/templatePack.ts/templateContentLocale.ts
   (B3), tsconfig.json (B3 + B9) — tsc web **0**, vite build **pass**,
   không lỗi cú pháp hay mâu thuẫn. Không binary, không workflow.
4. **Cảnh báo gộp của worker (đã xem):** (1) B5 `pkill -f` có thể
   chạm server vite của B1 (cổng 5570) — chỉ là harness, kết quả B1
   đã stage đủ, không ảnh hưởng code; (2) B8 nghi slow-start ~10–15 s
   liên quan B3/B9 sửa preview/media — chưa đo, ghi nợ đợt 75, không
   chặn gộp (vite build 5,89 s, tsc 0).
5. **Không EPERM trong lượt này.** Xvfb + Chrome headed chạy được
   (B1/B5/B9 click-test headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 75 chưa bắt đầu, cây yên).
- vite build: **pass** (5,89 s).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2405).
- Suite luồng: B3 codecProbe **19/19**; B4 render-timeout **66/66**;
  B5 preset45 render **17/17**; B9 karaoke **10/10**, karaoke_alpha
  **8/8**, captionModal **23/23**, ProjectMenu i18n **6/6**.
- Chưa chạy lại: B7 stress (45 lần vidstab render, chậm — tin LIMITS
  B7: 3/45 crash, chữ ký plane Y offset n−128); B1/B2/B5 headed
  (tin LIMITS từng luồng: B1 11/11, B5 CDP 22/22).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round74-b1-ocean-w1440.txt` (7),
  `b2-resample-aniso.txt` (3), `b3-safari-codec-probe.txt` (25),
  `b4-render-timeout.txt` (11), `b5-preset45-render.txt` (6),
  `b6-tts39.txt` (1), `b7-vidstab-stress.txt` (2),
  `b8-gate-fn.txt` (1), `b9-caption-karaoke.txt` (28),
  `phase9-round74-closing.txt` (1: LIMITS gộp).
- Tổng đợt 74: **85 entry / 10 file**. Tổng chờ push sau đợt 74:
  **415 entry / 77 file batch / 258 file duy nhất** (đợt 67: 68/9;
  đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
  đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10).
  HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 75 (§8)

1. **Ocean w1440 (B1):** cơ chế rò plain đã rõ (corr 0,993) — sửa
   rò plain ở preview (delta0 full-pixel + cùng-khung) rồi đo lại
   Δkurt G (kỳ vọng ≤ 0,35).
2. **Resample dị hướng (B2):** blend-at-end đúng ở thang vuông nhưng
   sai ở thang dẹt — cần model dị hướng riêng; w1920 1 verdict đã lật
   thật, w2560 chưa đổi.
3. **SEGFAULT vidstab (B7):** 3/45 crash, chữ ký plane Y offset
   n−128 — phân tích regs+maps từ handler mới để tìm frame lỗi chính
   xác; `copy` vẫn giữ.
4. **Gate (B8):** re-gate lọt FN đầu tiên (delta 75) — theo dõi thêm
   phiên FN; ngưỡng 30 vẫn đứng. **Slow-start ~10–15 s** nghi liên
   quan B3/B9 sửa preview/media — đo thật (cold start) ở đợt 75.
5. **TTS 39 CVE (B6):** vẫn chờ upstream (lần 6); npm audit nợ mới —
   đo số CVE npm (lần trước 403).
6. **Birefnet fps:** hết hướng giảm RAM — đo trên máy RAM tổng ≥ 12 GB
   hoặc chấp nhận không có số (u2net vẫn là fallback).
7. **Safari codec-probe (B3):** đã có `codecProbe.ts` — nối vào UI
   (báo user khi codec không hỗ trợ) thay vì chỉ probe.
8. **Preset 4:5 (B5):** đã render MP4 thật — nối preset vào ExportPanel
   flow chính (hiện chỉ có test + CDP).
9. **Keyframe:** trần 90 s không ràng buộc; Safari codec-probe đã có.
10. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
    CPU/SwiftShader + Chromium).
11. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App).
12. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

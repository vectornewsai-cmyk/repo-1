# Phase 9 đợt 55 — LIMITS tổng hợp (parent gộp, 07/11/2026)

Đợt 55: 9 luồng song song (L1–L9), lượt cron 09:35 +07 07/11. Chủ đề:
Electron desktop polish vòng 2 — đóng các nợ mở lớn nhất của đợt 54
(i18n M19, GTK save D2a, rebuild đo lại P7/D4c, undo sau new-project,
audio drift gốc, menubar M8/M18–M26, trial-decode GOP, TTS đo lặp).
Cả 9 luồng đều hoàn thành có LIMITS + tự stage batch riêng (52 entry).
KHÔNG push — chờ user nhắn "push đi".

## 1. Tóm tắt từng luồng (số thật, xem LIMITS riêng từng luồng)

- **L1 — i18n ProjectMenu + TopBar** (`..._L1_I18N_PROJECTMENU_TOPBAR_LIMITS.md`):
  đóng bug M19 đợt 54 K3. Thêm 24 key (21 `projectMenu.*` + 3
  `topbar.welcome*`); vi == en == 1011, 0 key mồ côi. ProjectMenu thêm
  `useLang()`, toàn bộ 7 nút + title + autosave + prompt Lưu thành…
  sang `t()`; TopBar "👋 Bắt đầu" sang `t()`. Test mới 6/6 (đỏ-trước
  1/6); headed vite dev 5/5 (EN hết literal VI, dirty "● Unsaved").
  Cập nhật snapshot 987 → 1011 ở 4 test cũ. Nợ: chưa đo lại M19 trên
  AppImage (chỉ vite dev); tên project mặc định + panel khác vẫn VI.
- **L2 — audit literal VI toàn app** (`..._L2_I18N_AUDIT_LIMITS.md`):
  quét toàn `apps/web/src`: **2362 literal** (617 UI-needs-key / 30
  file, 43 `ot()`, 643 DATA-content, 527 NON-UI-internal, 396
  UNVERIFIED-lib, 120 error-swallowed, 12 symbol, 3 log, 1 artifact).
  Sửa trực tiếp 37 điểm / 9 file chỉ dùng lại key có sẵn (store.ts 9,
  ExportPanel 5, BeatSyncModal 3, CaptionModal 6, SilenceModal 7,
  TemplatePicker 3, EnhancePanel 1, HistoryPanel 1, TemplatePackModal 2).
  Đề xuất **514 key mới** trong
  `hidden_files/round55-l2-keys.json` (phủ 614/617 literal UI; 3 còn
  lại là tên giọng proper noun). Test mới 20/20 (đỏ-trước 19/20).
  Nợ: 617 literal UI còn chờ key mới; 396 UNVERIFIED-lib chưa xác minh
  sink; 643 DATA-content cần thiết kế localize riêng.
- **L3 — GTK save dialog gõ path** (`..._L3_GTK_SAVE_TYPING_LIMITS.md`):
  nguyên nhân gốc là **bug harness, không phải bug sản phẩm**: Return
  KHÔNG BAO GIỜ submit dialog GTK trên Xvfb này (0/6 variant); gõ đè
  tên mặc định giữ hậu tố `.json`; validation M4/M5/M7/D1 không bóc
  envelope `{spec}` nên đọc sai file ghi đúng; finder nút dialog
  minGap=6 gộp Cancel/Save thành 1 cột. Sửa harness
  (`click-test-menu.mjs`: `gtkTypePath` mới + `clickGtkDialogRightButton`
  + bóc envelope). Đo lại AppImage cũ: verify flow 5/5 PASS; menu
  24/7 (trước 13/18), M4/M5/M7 PASS; dclick 6/2, **D2a PASS**.
  Nợ: D1/D2b chỉ fail bước kiểm tra TÊN (AppImage cũ chưa có fix K1);
  Return trên máy thật có WM chưa đo.
- **L4 — rebuild AppImage + đo lại** (`..._L4_REBUILD_REMEASURE_LIMITS.md`):
  AppImage mới sha `bff19724…`, 576.688.069 byte, build 02:59 UTC
  07/11, bundle `index-CkcceBnb.js`, `dist/main.js` đúng sha K4;
  build vào `apps/desktop/release-round55-l4/` riêng, bản cũ
  `release/` không đụng tới. Chứa fix K1/K2/K4; KHÔNG chứa fix i18n
  L1 (0 hit 24 key mới trong bundle). **P7 argv PASS 2/2, P7 Recent
  PASS 2/2, D4c PASS 2/2 (cả 2 instance exit 0, không còn dialog
  discard-confirm), D4 7/7, menu M19–M26 43/45 + 42/45** (M19 fail
  đúng chữ ký cũ vì chưa có L1; M26 thu nhỏ fail do Xvfb không WM;
  M22 flake 1 lần, rerun P5 20/20). Diag 12/12, K1 unit 7/7. Nợ K1 §6
  đã đóng. Nợ: M19 sau fix L1 cần rebuild mới + đo lại; M26 cần máy
  thật/WM.
- **L5 — undo sau "Dự án mới"** (`..._L5_UNDO_AFTER_NEW_LIMITS.md`):
  nguyên nhân gốc: `newProject()` gọi `clearHistory()` → xóa sạch
  undo stack → Undo no-op. Sửa: `CommandStack.resetWithTransition()`
  + `newProject()` ghi 1 entry chuyển đổi before→after (chỉ khi spec
  cũ còn clip). Undo 1 lần khôi phục đủ clip + timeline + selection;
  redo về project trống. Test mới 10/10 (đỏ-trước 2/8); headed M9–M15
  đều PASS (M10 khôi phục 3 clip đúng labels). Nợ: undo không khôi
  phục media bin; `replaceProject` (mở file) vẫn xóa history; undo
  qua nhiều lần new-project chỉ lùi 1 bước (thiết kế).
- **L6 — audio drift gốc** (`..._L6_AUDIO_DRIFT_ROOT_LIMITS.md`):
  nguyên nhân gốc đo thật (sampler 50 ms + AudioContext thăm dò độc
  lập, 9 lượt): **đồng hồ audio Chromium chạy CHẬM ĐỀU ~0,47–0,57×
  wall-clock dưới tải CPU** trên VM (AudioContext độc lập cũng
  0,47–0,53× — cùng đồng hồ bị đói CPU); lag tăng đều ~0,44–0,47 s/s,
  0 cơn đóng băng ≥ 150 ms — **bác bỏ suy luận "spike thoáng qua"
  của K9**. Giữ lại playbackRate catch-up (drift (0,08, 0,35] → rate
  = speed × (1 + min(0,5; drift×1,5)), trần 1,5×; chỉ AUDIO): audio
  re-seek trung bình **7,7 → 6,0 (−22%)**, tốc độ audio 0,51 → 0,64×,
  lag max 0,434 → 0,354, video re-seek 1,25/lượt (không phá),
  tickErrorDelta 0. Seek-with-lead đã thử, đã revert (không giảm +
  landing âm). Test mới 12/12; K9 11/11 giữ xanh. Nợ: drift gốc là
  môi trường (chưa đo máy thật); chưa đo cảm nhận rate 1,15–1,5× trên
  nhạc/lời thật; sàn mới là độ dài seek.
- **L7 — menubar M8 + M18–M26** (`..._L7_MENUBAR_M18_M26_LIMITS.md`):
  "zombie window" là **cửa sổ dialog native GTK của
  `window.confirm`** còn sót lại sau khi CDP `handleJavaScriptDialog`
  đã trả lời (title "(không tên)", 430x83@0,0, `overrideRedirect=1`,
  che vùng trái menu bar → bands 1 thay vì 5; vô hình với CDP).
  Cách dọn đúng duy nhất: X11 click nút trên zombie. Sửa harness
  (11 marker ROUND55-L7): `answerDiscardDialog` nhánh `cdp-stale`
  dọn zombie + đo lại bands; guard dọn zombie trước check
  `topIndex >= bands.length` trong `openTopMenu` (sửa bug thứ tự làm
  M10–M25 chết theo sau zombie M9); M18 viết lại theo tiêu chí đo
  được; M19 sửa check sai (`/Export/` → `/Publish/ && /Cut
  silence/`). Menu full v2: **24/7** (baseline K4 verify4: 24/19);
  **M8 PASS 5 lần liên tiếp; M18, M19, M20, M22, M23, M24, M25, M26
  PASS 3/3 lượt v2**. M21 FAIL 3/3 (giới hạn Xvfb không WM); M19b
  FAIL 3/3 trên AppImage cũ (L1 đã sửa ở source, cần rebuild đo
  lại). Nợ: M4/M5/M7 flake theo trạng thái M4; M18 geometry / M21
  cần WM/máy thật.
- **L8 — trial-decode GOP T3** (`..._L8_GOP_TRIAL_DECODE_LIMITS.md`):
  module mới `gopTrialDecode55L8.ts` — interface inject
  `GopTrialDecodeProbe` + `createBrowserTrialDecodeProbe()` (VideoDecoder
  thật) + `runTrialDecode` fail-open, timeout 200 ms. T3 chạy
  trial-decode sample 0 SAU lớp K8 + kiểm AVCC, cả 2 mode (stream-mode
  chỉ khi sample 0 ≤ 256 KiB; all-mode luôn). Chỉ decoder báo lỗi
  thật mới fallback `full-file` lý do `trial-decode: ...`. Không sửa
  logic K8, không sửa test K8; caller production không cần sửa. Chi
  phí đo headed thật: median **82,9 ms** trên máy tải nặng (7 lần
  25,1–169,7 ms; K8 máy yên 15,5 ms) — chỉ trả 1 lần khi mở file,
  chặn bởi timeout 200 ms. Test mới 23/23 (đỏ-trước 20/23); headed:
  file giả (sample 0 H.264-rác, moov nguyên vẹn) bị chặn cả 2 mode,
  cùng file với probe null thì lọt (chứng minh K8+AVCC một mình bỏ
  lọt). Hồi quy GOP 25/27 suite xanh (2 fail do snapshot 987 — xem
  §2). Nợ: false-positive profile lạ (vd High 4:4:4); moov giả sửa
  timestamp (stts) vẫn lọt; sample 0 > 256 KiB ở stream-mode bị bỏ
  qua; chưa đo Safari/Firefox.
- **L9 — TTS P13 đo lặp + kiểm chứng chéo** (`..._L9_TTS_REPEAT_XCHECK_LIMITS.md`):
  P13 vs M3 Trúc Ly **GIỮ VỮNG, biên nới rộng**: P13 gộp 13,2896 vs
  M3 12,7052 ký tự/giây → **+0,5844 (+4,60%), 9/9 cặp** P13 nhanh
  hơn (K6: +0,3722, 7/9). Gộp K6+L9 (n=6): +0,4787. Nút φ P13 KHÔNG
  đổi (φ gộp 4 giọng 0,9626, chênh −0,0054 so với nút khóa 0,968 —
  trong SE ≈ 0,02, giữ nút; test khóa dung sai nút ±0,01). Transfer
  M6 dải 1,42–1,58 GIỮ VỮNG (L9: 1,4363 / 1,5731 / 1,4584 / 1,5251;
  mean 1,4982); **mới: Trúc Ly transfer 1,5102** (giọng thứ 5).
  Synth 0,03–0,54×, median 0,16×. Verify WAV 16/16. Kiểm chứng chéo:
  L1 6/6, L5 10/10, L8 23/23 đều xanh. Test H1 13/13, H2 16/16
  (tăng nhờ test mới). Đính chính: log `compute54k6.py` ghi transfer
  Hải Đăng 1,4276 là sai (dùng nhầm hệ số); giá trị khóa đúng là
  1,5230. Nợ: φ(P13) Trúc Ly giảm dần theo đợt (J7 0,997 → K6 0,979
  → L9 0,969) chỉ là quan sát; driver chết lặng giữa T05 (nghi
  SIGKILL/OOM, chưa rõ gốc).

## 2. Việc parent gộp đã làm

1. **Đối chiếu đĩa**: 9 batch đợt 55 (52 entry) — mọi file tồn tại,
   toàn text, NUL cuối. LIMITS L1–L9 đủ.
2. **Xung đột file chung**:
   - `click-test-menu.mjs`: đủ marker L3 (`gtkTypePath`,
     `clickGtkDialogRightButton`, bóc envelope) + 11 marker L7
     (`ROUND55-L7`); `node --check` pass (L3/L7 tự kiểm).
   - `store.ts`: đủ hunk L5 (`resetWithTransition` trong
     `commands.ts` + `store.ts`) + hunk L2 (`i18nT(...)` 20 chỗ,
     gồm `timeline.histMove` ở :1298/:1327).
   - `tsconfig.json` (apps/web): đủ 2 dòng exclude mới (L6
     `playheadPacing55L6`, L8 `gopTrialDecode55L8`).
   - i18n: vi == en == **1011**, diff 0 (đếm flatten bằng script).
3. **Sửa snapshot sót — Z6**: L8 phát hiện `reverseCompat44Z6`
   fail `1011 !== 987`; L1 đã cập nhật 4 test khác, L2 cập nhật E2,
   chỉ Z6 còn kẹt 987. Parent cập nhật Z6 987 → 1011 theo đúng
   comment trong chính test đó ("parent gộp cập nhật lại số này theo
   tổng thực tế"). Z6 nằm trong batch đóng đợt (xem §5).
4. **Quyết định về 514 key đề xuất của L2**: KHÔNG nhét vào
   vi/en.json trong đợt này — 514 key chưa có `t()` nào gọi tới sẽ
   thành key mồ côi, và việc nối `t()` cho 30 file là một đợt riêng.
   File `hidden_files/round55-l2-keys.json` giữ nguyên làm đầu vào
   cho đợt 56 (i18n wiring). Ghi rõ để đợt sau không làm lại audit.
5. **Kiểm chứng parent (chạy lại trên cây đã gộp, số thật)**:
   - `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
   - `vite build` apps/web: **pass** (6,03 s).
   - Test mới chạy lại (esbuild bundle + node; L1/L2 phải bundle
     `--format=cjs` vì ESM ném "Dynamic require of stream" từ
     react-dom/server — ghi nhớ cho đợt sau): L1 6/6, L2 20/20,
     L5 10/10, L6 12/12, L8 23/23.
   - Test snapshot i18n chạy lại: Z6 10/10 (sau sửa parent), E2 3/3,
     D4 3/3, B6 8/8; L9 H1 13/13, H2 16/16.
   - KHÔNG chạy lại ở bước gộp: mọi phép đo headed/TTS WAV/AppImage/
     menu full-run của các luồng, phiên solo thật, đo IDB thật,
     Safari/máy thật/GPU thật. Parent không sửa logic luồng nào
     (ngoài snapshot Z6 ở §2.3).
6. **Số đếm tổng chờ push — đính chính**: các luồng báo số khác nhau
   do đếm ở thời điểm khác nhau (L9: 383, L4: 386, L2: 398) và L3
   báo "90 file / 2298 entry" là **sai** (đếm cả các đợt 1–50 đã push
   xong). Số đúng: **350 sau đợt 54 + 52 đợt 55 + 2 batch đóng = 404
   entry, 42 file paths**. Các đợt 1–50 đã push xong (HEAD e2cb35e1).

## 3. Nợ mở / chưa làm được (trung thực)

1. **M19 trên AppImage**: L1 sửa ở source + đo vite dev 5/5; L4 build
   trước khi L1 hạ cánh nên chưa đo được. Cần rebuild mới + đo lại
   M19/M19b (L4 + L7 đều ghi).
2. **D2a**: L3 sửa harness (D2a PASS trên AppImage cũ) nhưng L4 đo
   trên harness cũ hơn vẫn ghi D2a fail. Hai nửa đã đủ — cần một lượt
   đo D2a bằng harness mới + build mới để khóa.
3. **D1/D2b tên**: chỉ còn fail bước kiểm tra TÊN trên AppImage cũ;
   L4 đã đo P7/D4c tên đúng trên build mới — D1/D2b cần đo lại trên
   build mới.
4. **M21 thu nhỏ / M26 geometry**: giới hạn Xvfb không WM — cần máy
   thật hoặc WM thật.
5. **514 key i18n của L2** chờ đợt wiring riêng (đợt 56): nối `t()`
   cho 30 file theo `round55-l2-keys.json`; 396 literal
   UNVERIFIED-lib cần thread follow-up xác minh sink; 643 literal
   DATA-content cần thiết kế localize nội dung riêng.
6. **L6**: drift gốc là môi trường VM (chưa đo máy thật); chưa đo cảm
   nhận rate 1,15–1,5× trên nhạc/lời thật; sàn mới là độ dài seek.
7. **L8**: false-positive profile lạ; moov giả sửa stts vẫn lọt;
   sample 0 > 256 KiB ở stream-mode bị bỏ qua; chi phí cần đo lại
   trên máy yên.
8. **L9**: φ(P13) Trúc Ly giảm dần theo đợt — xem lại nút φ nếu đợt
   sau vượt ±0,01 cùng hướng; driver chết lặng giữa T05 chưa rõ gốc.
9. **Nợ cũ còn nguyên**: `.github/workflows/ci-security.yml` 403
   chưa lên GitHub (repo vẫn chưa có CI chạy thật); `.deb` biến mất
   khỏi `release/`; AppImage runtime flaky (K2 §5.4).

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- Đợt 55 (9 file / 52 entry): `phase9-round55-l1-i18n-projectmenu-topbar.txt` (12),
  `phase9-round55-l2-i18n-audit.txt` (12),
  `phase9-round55-l3-gtk-save-typing.txt` (2),
  `phase9-round55-l4-rebuild-remeasure.txt` (3),
  `phase9-round55-l5-undo-after-new.txt` (5),
  `phase9-round55-l6-audio-drift-root.txt` (6),
  `phase9-round55-l7-menubar-m18-m26.txt` (2),
  `phase9-round55-l8-gop-trial-decode.txt` (5),
  `phase9-round55-l9-tts-repeat-xcheck.txt` (5).
- Batch đóng đợt: `phase9-round55-closing.txt` (2 entry — LIMITS tổng
  hợp này + `reverseCompat44Z6.test.ts` đã sửa snapshot 987 → 1011).
- **Tổng chờ push: 42 file paths / 404 entry** (350 trước đợt 55 + 52
  đợt 55 + 2 batch đóng). Các đợt 1–50 đã push xong (HEAD e2cb35e1).
- AppImage mới của L4 (`apps/desktop/release-round55-l4/`, sha
  `bff19724…`) KHÔNG stage (binary) — để trên đĩa cho luồng sau dùng.

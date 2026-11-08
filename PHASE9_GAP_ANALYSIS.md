# Phase 9 — Phân tích khoảng cách so với CapCut thật

> Ngày: 2026-10-24. Người viết: agent phân tích (chỉ đọc, KHÔNG sửa code, KHÔNG push).
> Nguồn hiện trạng: `docs/FEATURE_STATUS.md` (đã cũ, 19/10 — chỉ dùng làm nền),
> `benchmarks/RESULTS.md` (đo thật 20/10 + refresh Phase 8 24/10),
> các file `*_LIMITS.md` / `Q*_LIMITS.md` mới nhất (Q1–Q8, Phase 8),
> và grep trực tiếp code `apps/web/src`, `server/`, `packages/video-spec/src`.
> Mọi số CapCut đều là **ước tính từ hiểu biết công khai** (CapCut không công bố
> số lượng kho hay benchmark chính thức) — không trích dẫn như số đo.
> Nguyên tắc của dự án vẫn giữ: **local-first**, license sạch (MIT/CC0/CC-BY/OFL),
> không API trả phí, không model đóng.

## 0. Ảnh chụp hiện trạng (đã kiểm chứng trong repo)

> Cập nhật 07/11/2026 (đợt 59 P10, docs-only): các hàng i18n, Modal/Escape,
> GOP trial-decode, Media mẫu, Dịch caption, Enhance, LUT, Preview FPS đã
> cập nhật theo LIMITS đợt 51–58; các hàng còn lại giữ nguyên mốc 24/10,
> chưa đo lại. Mọi số CapCut trong file này vẫn là **ước tính**, không đổi.
>
> Cập nhật 08/11/2026 (đợt 60 Q9, docs-only): đếm lại toàn bộ kho trên đĩa
> (xem `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md` §0); đính chính số TTS theo
> đính chính 06/11 (0,12–0,75×, median 0,32×/0,44×, 72 lần đo); Transition
> 67 → **81** (V3 thêm 14 custom-expr từ đợt 10 chưa từng ghi vào file
> này); thêm mục §0.2 trạng thái sau đợt 59 + nợ mở cho đợt 61. Các hàng
> còn lại giữ nguyên mốc 24/10–07/11, chưa đo lại.

| Hạng mục | VCut hiện tại |
|---|---|
| Timeline đa track, trim/split/ripple, undo/redo, multiselect, copy/paste | Có, click-test thật 9/9 (Q2) |
| Keyframes (x/y/opacity/scale/rotation) + graph editor | Có (render + preview, trừ typewriter+SR) |
| Speed curve easing + reverse từng clip | Có render + preview (reverse preview giật từng frame, audio reverse mute khi phát) |
| Mask rect/ellipse/feather + invert | Có render + preview |
| Transition | **81** (58 xfade native + 23 custom-expr: 9 P5 + 14 V3 — đếm lại 08/11 từ `TRANSITION_TYPES`; mốc 24/10 ghi 67 vì V3 chưa được ghi nhận); 21 file GLSL không dùng được (thiếu `gltransition`) |
| LUT | 174 (`.cube` tự chế + WebGL LUT thật ở preview + CSS approx fallback, RMSE held-out trung bình 15.98 sau fit Q1); đếm lại 08/11: vẫn 174 file `.cube` trong `assets/filters/`; test `webglLut.test.ts` chạy được 7/7 từ đợt 58 O7 (esbuild cjs bundle; Node type-stripping vẫn không chạy được suite này) |
| Video effects | 16 (render đủ; preview có đường vẽ cho cả 16 type, `previewEngine.ts:471-490`; sharpen/noise chưa kiểm chứng lại parity) |
| Text preset | 96; template project | 50; sticker | 244; font | 59 family (67 file `.ttf` trên đĩa = 59 + 8 biến thể bold); sound | 1043 khai báo — xem chú thích (*) |
| Auto-caption | faster-whisper local, word timestamps có sẵn, caption bám trim/move/speed/silence/copy-paste (Q3) |
| Dịch caption | Chỉ sang tiếng Anh (Whisper `translate` task); không có engine MT khác. Track dịch nay nhận diện song ngữ: recognition khớp cả hai tiền tố "Phụ đề"/"Subtitles", key `captions.translatedTrack` ("Phụ đề ({code})" / "Subtitles ({code})") — đợt 58 O5, test 12/12 |
| TTS | VieNeu-TTS 0.5B Apache-2.0, 25 giọng preset; voice cloning có trong engine nhưng **chưa expose UI/bridge** |
| Xoá nền | rembg u2net + birefnet-general (fallback tự động); birefnet OOM trên RAM ≤ 8GB; ~0.43 fps trên CPU 2 vCPU; không temporal smoothing |
| Motion tracking | Sticker bám track (OpenCV template→MIL); text/video/mask chưa bám track; track chạy CLI ngoài editor |
| Beat sync | BPM/beat từ numpy+FFmpeg (119.76 vs thật 120, ≤19ms); cắt theo beat có review; không downbeat, không hiểu cấu trúc bài |
| Voice effects | pitch/robot-vibrato/telephone-bandpass/echo-1-tap (render-only, preview chưa có) |
| Enhance | stabilize (vidstab 2-pass), denoise (hqdn3d), deinterlace — **đã có UI từ Phase 9 R2**: `EnhancePanel` mount trong Inspector (`inspector.secEnhance`, 16 key `enhance.*` đã có trong vi/en), khử răng cưa/chống rung/khử nhiễu nối `clip.enhance`; **chỉ tác dụng khi render, preview chưa áp enhance** (ghi trong header `EnhancePanel.tsx`). (Ghi chú 07/11: brief đợt 59 P10 ghi "Enhance chưa có UI" — kiểm chứng code cho thấy panel đã có từ R2; xem `docs/PHASE9_ROUND59_P10_DOCS_LIMITS.md` §4.) |
| Proxy workflow | Có (480p/720p, badge PROXY, export luôn dùng file gốc) — nhưng chỉ tạo tay khi còn giữ `File` gốc |
| Mobile | Mobile-web responsive + PWA + touch (test 58/58); **không app native**, chưa test điện thoại thật |
| Cloud/collab | Không có server (đúng chủ trương local); chỉ có version history local + share page HTML tĩnh + tài liệu giao thức sync |
| Benchmark | Render 1080p ~8.6–12.5 fps (2 vCPU, không GPU); mask 720p **0.97 fps**; caption 0.30–0.44x realtime; **TTS 0,12–0,75× realtime (median 0,32× đợt 49 / 0,44× đợt 50, 72 lần đo, infer thuần sau warmup, chưa tính nạp model ~10–12,5 s — đính chính 06/11, số cũ ~1,5–2,5× đã bị bác bỏ)**; bgremove 0.43 fps; enhance 720p (đợt 59 P9): denoise ~12 fps, stabilize ~6,8 fps, deinterlace ~24,7 fps, combo ~3,5 fps (số tuyệt đối dao động theo tải VM, xem RESULTS §9) |
| Preview FPS trên browser thật | **Đã đo lần đầu (đợt 52 I9, 06–07/11)**: ~1,4–4,6 fps khi phát (project nhẹ/vừa/nặng), ~20 fps khi tạm dừng, ~32 fps trang trống; clip 1080p trơn 7–10 fps; proxy 720p 9,8/10,5 fps so với gốc 1080p 7,0/8,2 fps — vẫn xa 30 fps. Xem `docs/PHASE9_ROUND52_I9_PREVIEW_FPS_LIMITS.md`. |
| i18n (vi/en) — mới 07/11 | `vi.json` == `en.json` == **1957 key lá** (đếm lại 08/11; 1942 → 1957 ở đợt 59: P1 +4, P8 +11, P3 ghi đè 1 key), cùng tập key, placeholder khớp. Dict tăng 1011 (đợt 55 L1) → 1722 (đợt 56, +711 key) → 1937 (đợt 57, +215) → 1942 (đợt 58, +5) → 1957 (đợt 59, +15). Chính tả nút Hủy thống nhất thành "Huỷ": 141 occurrence / 50 file (đợt 58 O8; giữ 7 chỗ có chủ đích). |
| Modal / Escape — mới 07/11 | Escape đóng WelcomeModal (đợt 58 O1, test 9/9 + headed 3/3). SilenceModal hết tràn viewport (đợt 57 N1, re-probe headed PASS sau gộp). BeatSyncModal + SceneModal dùng class `modal` đã định nghĩa (đợt 58 O4, 24/24 + headed 4/4). Còn thiếu: TourCard/TemplatePackModal/TemplatePicker chưa đóng bằng Escape; class `caption-modal`, `modal-x`/`modal-label`/`modal-hint`/`modal-err` chưa định nghĩa (đợt 58 §6). |
| GOP trial-decode / probe — mới 07/11 | Stream-mode sample tới 8 MiB, chunked fetch 512 KiB (đợt 57 N10, 17/17). Timeout trial-decode scale theo kích thước: 0,3 ms/KiB trên 256 KiB, trần 2500 ms (đợt 58 O6, 18/18); keyframe 4K nhiễu 4,1 MiB decode-ok 662,7 ms thay vì fail-open ở 200 ms. Còn lọt: sample >8 MiB stream-mode vẫn bỏ qua; keyframe zero-giữa; chưa đo Safari/Firefox. |
| Media mẫu / autosave — mới 07/11 | Reload sạch KHÔNG tái hiện mất media mẫu (đợt 58 O2): bin trống sau reload là đúng thiết kế rehydrate theo spec (autosave mang spec đã xóa clip), manifest IndexedDB vẫn đủ. Bug thật kề bên đã sửa: media mẫu thiếu `file` trong phiên đầu → export bị chặn tới khi reload (sửa 1 dòng `sample.ts`, headed 5/5, rehydrate 27/27). Nợ: media import rồi xóa hết clip khỏi timeline cũng biến mất khỏi bin sau reload. **Đợt 59 P1 đã đóng một phần:** autosave nay mang manifest bin (`binMedia`); media chỉ rời bin khi user xóa chủ đích bằng nút ✕ (confirm + chặn khi còn clip dùng); toast style lặp đã sửa tại nguồn (clip thiếu `italic`). |

> (*) **Sound 1043 — đọc đúng:** `assets/sounds/index.json` khai báo
> `total_sounds: 1043` (= kenney 12 + uisfx 936 + vcut-synth 95) và mảng
> `sounds` nay liệt kê đủ **1043** mục (đợt 61 R10 đã bổ sung 30 mục
> vcut-synth gen3 — trước đó chỉ 1013 mục, thiếu 30); trên đĩa chỉ có
> **107 file .ogg** trong `assets/audio/` (12 kenney + 95 vcut-synth);
> **936 file uisfx không có trên đĩa** — chỉ lấy được qua
> `assets/sounds/fetch_sounds.sh`. Vì vậy "1043" là tổng khai báo theo
> nguồn, không phải số file dùng được ngay trên đĩa. Đếm lại 08/11, xem
> `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md` §0. Tương tự, sticker manifest
> (`sticker-manifest.json`) nay đủ **244** mục, khớp đĩa (đợt 61 R10 đã
> bổ sung 30 sticker gốc batch 1+2 — trước đó chỉ 214).

## 0.1. Trạng thái sau đợt 51–58 (cập nhật 07/11/2026, đợt 59 P10)

> Tóm tắt từ `docs/PHASE9_ROUND51_LIMITS.md` … `docs/PHASE9_ROUND58_LIMITS.md`
> và log vòng lặp. Mọi con số đều có nguồn là file LIMITS tương ứng;
> không có số nào đo mới trong đợt docs-only này (trừ đếm lại 1942 key i18n).

**Chủ đề các đợt 51–58 (06–07/11):** TTS calibration theo giọng (51 H1/H2,
52 I1); Electron reliability + ship services (51 H7/H8, 52 I4/I5, 53 J1/J2,
54 K1/K2/K4, 55 L4/L5/L7); GOP trial-decode (51 H4, 52 I6, 55 L8, 56 M10,
57 N6/N10, 58 O6); i18n wiring toàn app (55 L1/L2, 56 M1–M8, 57 N2/N5/N7/N8,
58 O5/O8); modal/Escape (57 N1/N3, 58 O1/O4); autosave/media mẫu (58 O2);
failsoft surface (57 N4, 58 O3); test webglLut (58 O7).

**Đã đóng trong 51–58 (số có nguồn):**

- **i18n:** dict 1011 (đợt 55 L1) → 1722 (đợt 56, +711 key) → 1937 (đợt 57,
  +215) → 1942 (đợt 58, +5); vi == en, cùng tập key, placeholder khớp
  (ROUND56 §2.1, ROUND57 §0, ROUND58 §0; đếm lại 07/11: 1942/1942).
  Audit literal VI toàn app: 2362 literal phân loại xong (đợt 55 L2).
  Hàng N2 §2.7 ("~15 sub-panel hardcode") đã thu hẹp nhiều nhưng **chưa
  có claim "i18n xong 100%"** trong bất kỳ LIMITS nào — không ghi ở đây.
- **Preview FPS đã đo lần đầu** (đợt 52 I9): ~1,4–4,6 fps khi phát,
  7–10 fps clip 1080p trơn, proxy 720p giúp ~25–40% nhưng vẫn xa 30 fps.
- **SilenceModal tràn viewport** (nợ đợt 56 §4.1) đã sửa (đợt 57 N1) và
  re-probe headed PASS sau gộp; **Escape đóng WelcomeModal** (đợt 58 O1);
  **BeatSync/SceneModal** dùng class `modal` đã định nghĩa (đợt 58 O4).
- **Captions track song ngữ** (đợt 58 O5, 12/12); **GOP timeout theo kích
  thước + stream 8 MiB** (đợt 57 N10 17/17, đợt 58 O6 18/18);
  **webglLut.test.ts chạy 7/7** (đợt 58 O7); **chính tả Huỷ thống nhất**
  141 occurrence / 50 file (đợt 58 O8); **media mẫu thiếu `file` → export
  chặn** đã sửa 1 dòng `sample.ts` (đợt 58 O2, headed 5/5).
- **TTS:** mô hình đường cong theo giọng thay ngưỡng nhị phân 13%
  (đợt 51 H1); đo lặp hệ số TTS cho các giọng n = 1 (đợt 51 H2, đợt 52 I1).
  Số RT 0,12–0,75× (median 0,32×/0,44×, 72 lần đo) là của đợt 49–50, không
  phải 51–58 — hàng Benchmark §0 đã cập nhật số này ở đợt 60 Q9
  (08/11, xem §0.2).
- **Electron:** pidfile + dọn bridge mồ côi lúc khởi động (đợt 51 H7);
  ship services vào app đóng gói (đợt 51 H8); flow GTK "Lưu thành…" xanh
  6/6 + 5/5 AppImage thật (đợt 53 J1); probe menu M10–M26 26/26 PASS
  (đợt 53 J2); `loadProject` đọc `meta.name` (đợt 54 K1). Phase 10 Electron
  app + Linux packaging đã stage từ 06/11 (63 entry, chưa push).
- **Tổng chờ push sau đợt 58: 656 entry** (ROUND58 §7: 561 sau đợt 57 +
  81 đợt 58 + 14 đóng đợt; các đợt 1–50 đã push xong, HEAD e2cb35e1).

**Nợ mở lớn nhất còn lại (từ ROUND58 §6 — nguyên văn ý, không thêm số):**

1. **O2 — thiết kế bin theo spec:** media import rồi xóa hết clip khỏi
   timeline biến mất khỏi bin sau reload; cần quyết định đổi thiết kế
   rehydrate mới giữ được. Toast "đã điền style mặc định…" lặp lại mỗi
   lần reload (chưa điều tra).
2. **O1 — Escape chưa thống nhất:** TourCard / TemplatePackModal /
   TemplatePicker cũng chưa đóng bằng Escape.
3. **O3 — failsoft surface chưa đủ:** `skippedReasons` chỉ sinh khi có
   layer adjustment; chuỗi lý do effect không nêu tên type (key N4
   `unknownEffectType` thiếu var `{type}`); đường vẽ từng frame vẫn chỉ
   `console.warn`.
4. **O4 — class chưa định nghĩa còn sót:** `caption-modal` (CaptionModal),
   `modal-x`/`modal-label`/`modal-hint`/`modal-err` (SilenceModal);
   `<p className="error">` top-level của BeatSyncModal vẫn không có style.
5. **O5 — chưa click-test headed** nhãn "Subtitles (EN)" + xuất SRT/VTT;
   false-positive track user tự đặt tên trùng tiền tố (giới hạn có sẵn).
6. **O6 — sample >8 MiB stream-mode vẫn bỏ qua**; chưa đo Safari/Firefox;
   keyframe thật bị zero 1 MiB giữa vẫn decode OK (trial-decode không bắt).
7. **O7 — Node type-stripping vẫn không chạy được suite webglLut** (cần
   `allowImportingTsExtensions` hoặc vitest — ngoài phạm vi đợt 58).
8. **O8 — bản copy build (`release/*`, `dist-web/`) còn "Hủy" cũ** (tái sinh
   khi build, không sửa tay); docs lịch sử `PHASE9_ROUND5*.md` giữ nguyên
   "Hủy" như hồ sơ.
9. **Nợ cũ giữ nguyên quyết định:** N6 hoán đổi delta stts vẫn lọt (quyết
   định không thêm kiểm hình dạng); N5 bản dịch EN template chưa qua người
   bản ngữ.

**Nợ lớn từ gap gốc (§2) chưa đụng trong 51–58:** trong các LIMITS đợt
51–58 không ghi việc đóng E1/P2 (mask 0,97 fps), P1 (GPU encode chưa test
phần cứng thật), C1 (kho nội dung nhỏ hơn hàng chục lần), M1 (app native),
P3 đã đo một phần (I9) nhưng chưa sửa. Các hướng KHÔNG làm ở §4
(cloud/collab, AI avatar/video-gen model đóng, nhạc có bản quyền) vẫn giữ
nguyên — không có batch 51–58 nào đi vào các hướng đó.

## 0.2. Trạng thái sau đợt 59 (cập nhật 08/11/2026, đợt 60 Q9)

> Tóm tắt từ `docs/PHASE9_ROUND59_LIMITS.md` (parent gộp 10 luồng P1–P10)
> và các LIMITS luồng P1–P9. Mọi con số đều có nguồn là file LIMITS tương
> ứng; không có số nào đo mới trong đợt docs-only này (trừ đếm lại kho
> §0 và i18n 1957 key).

**Chủ đề đợt 59 (07/11):** đóng nợ đợt 58 (§6 LIMITS tổng hợp đợt 58) +
Enhance theo gap E3 — với đính chính giữa đợt: Enhance UI ĐÃ CÓ SẴN từ
Phase 9 R2, gap E3 "không có UI" đã cũ; P8 đổi hướng sang kiểm chứng +
hoàn thiện panel hiện có, P9 giữ nguyên kiểm chứng render. Khoảng cách
thật còn lại của Enhance là preview chưa áp enhance.

**Đã đóng trong đợt 59 (số có nguồn):**

- **Bin bền qua reload (P1):** autosave mang manifest `binMedia`; nút ✕
  xóa media có confirm + chặn khi còn clip dùng; toast "đã điền style"
  không lặp — nguyên nhân gốc là clip mẫu/mới thiếu `italic`, sửa tại
  nguồn. Test 17/17, headed 9/9, rehydrate 27/27.
- **Escape thống nhất (P2):** TourCard / TemplatePackModal / TemplatePicker
  đóng bằng Escape (pattern O1). Test 26/26, headed 5/5.
- **skippedReasons (P3):** nêu tên type + sinh cả khi không có layer; lý
  do skip đường vẽ từng frame ra badge + toast (giữ `console.warn`).
  Test 16/16, headed 2 lượt PASS.
- **Class chưa định nghĩa (P4):** CaptionModal `caption-modal`,
  SilenceModal `modal-x/label/hint/err`, BeatSyncModal `<p class="error">`
  → class đã định nghĩa. Test 33/33, headed 6/6.
- **Captions headed (P5):** nhãn "Subtitles (EN)" + xuất SRT/VTT
  byte-exact; bug thật: tên project tiếng Việt làm file xuất luôn thành
  "download" → chuẩn hoá ASCII. Test 7/7 vi+en, headed 5/5.
- **Trial-decode (P6):** cap stream-mode 8 → 32 MiB (chunked fetch,
  ≤64 chunk); rác 12 MiB verdict false thật; sample 9,7 MiB decode-ok
  ~1,9 s. Test 16/16, hồi quy GOP xanh. Xem RESULTS §9.
- **i18n (P7):** kiểm toán hậu-gộp (test-only): dict 1942 khớp lúc đó;
  41 key mồ côi; 26 mẫu tồn đọng diagnostic (fragment KHÔNG gộp).
- **Enhance UI (P8):** preset 1 chạm + chỉ báo trạng thái (dòng "Đang
  bật" + badge ✨ timeline); kiểm chứng từng control R2 qua click thật,
  khớp `validateEnhance` 0 lỗi. Test 21/21 vi+en, headed 6/6.
- **Enhance render (P9):** cả 3 enhance render thật (hqdn3d/yadif/vidstab
  đúng flag); FPS 720p: baseline 47,86 → denoise 12,05 / stabilize 6,82
  / deinterlace 24,70 / combo 3,49. Harness 52/52 (chạy lại lúc gộp:
  52/52; FPS baseline 53,23 → denoise 14,68 / stabilize 20,45 /
  deinterlace 48,42 / combo 7,06 — hướng khớp, số tuyệt đối lệch do tải
  VM). Xem RESULTS §9.
- **Docs (P10):** gap analysis 160 → 247 dòng + FEATURE_STATUS mục bổ
  sung 07/11; phát hiện Enhance UI đã có từ R2.
- **Gộp (parent):** đối chiếu đĩa hợp 10 batch = 55 file duy nhất, khớp
  chính xác (0 file lạ, 0 file thiếu); dict gộp 1942 → **1957 key**
  (P1 +4, P8 +11, P3 ghi đè 1 key; fragment P7 KHÔNG gộp); tsc
  web/desktop 0, vite build pass; kiểm chứng gộp chạy lại độc lập:
  **45/45 suite xanh**.
- **Tổng chờ push sau đợt 59: 732 entry** (656 sau đợt 58 + 60 đợt 59 +
  16 closing; các đợt 1–50 đã push xong, HEAD e2cb35e1).

**Nợ mở cho đợt 61 (từ ROUND59 §6 — nguyên văn ý, không thêm số):**

1. **P4:** còn 30 class thật chưa định nghĩa ngoài phạm vi (SpeedPanel 12,
   `preview.tsx` 9 badge, Timeline 3, HistoryPanel/MediaBin/ExportPanel/
   TrackPanel 1 mỗi cái, TtsButton 2) + class scoped dùng ngoài tổ tiên
   (`.error`, `.muted`, `.warn`, `.small`, `.dim`).
2. **P4/P5:** nút text CaptionModal dùng `.tbtn` tràn/chồng chữ; modal
   CaptionModal cao hơn viewport 900px (nút "Start generating" bị cắt).
3. **P1:** quyết định thiết kế — media import rồi xóa khỏi bin thì bytes
   IDB mồ côi có dọn không; race debounce 5 s khi replaceProject.
4. **P7:** 41 key mồ côi (28 key `projectRepo.*` chết thật — nối thật hay
   xóa); 26 key fragment diagnostic GOP chờ wiring (không gộp đợt 59).
5. **P3:** `skippedReasons` tầng lib vẫn rỗng với spec phẳng (muốn đủ 100%
   phải bỏ early-return, vỡ khóa O3 §B'); decoder tụt thì helper frame
   vẫn liệt kê effect.
6. **P6:** keyframe thật ≳16 MiB vẫn timeout → fail-open (trần 2500 ms);
   sample >32 MiB vẫn bỏ qua; T3 vẫn fetch remainder cả khi probe null;
   chưa đo Safari/Firefox; keyframe đục lỗ giữa vẫn decode OK (nợ O6).
7. **P5:** đường dịch whisper qua bridge chưa chạy headed (media mẫu
   không có lời thoại); các helper tải file khác chưa kiểm chứng headed
   có mất tên như SRT/VTT không; false-positive track tên trùng tiền tố
   (giới hạn D6).
8. **P2:** Escape khi focus trong input/select của form Picker + khi
   PackModal đang busy chưa đo headed (chỉ lập luận parity); Escape bước 2
   TemplatePicker về gallery (nếu muốn đóng hẳn thì sửa 1 nhánh `if`).
9. **P8/P9:** preview chưa áp enhance (render-only) — khoảng cách thật
   còn lại của E3; preset không chặn stabilize khi có speedKeyframes
   (chỉ cảnh báo); chưa đo render MP4 cho đúng combo preset; chưa đo FPS
   stabilize/deinterlace lặp lại, enhance ở 1080p.
10. **P10:** ma trận FEATURE_STATUS vẫn mốc 19/10 (nhiều hàng lỗi thời từ
    trước đợt 56); hàng Benchmark trong gap analysis còn số TTS cũ
    (~0,44x) so với đính chính 06/11 (0,12–0,75×); số lượng kho chưa đếm
    lại sau đợt 58. → **ĐÃ ĐÓNG ở đợt 60 Q9** (ma trận lên mốc 08/11,
    số TTS đã đính chính, kho đếm lại — xem §0 và
    `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md`).
11. **Nợ cũ chưa đụng:** N6 hoán đổi delta stts vẫn lọt (quyết định giữ
    nguyên); N5 bản dịch EN template chưa qua người bản ngữ; Node
    type-stripping vẫn không chạy được suite webglLut (cần
    `allowImportingTsExtensions` hoặc vitest); `ci-security.yml` 403 chưa
    lên GitHub (repo vẫn không có CI chạy thật).

## 1. Cách xếp hạng

- **Tác động cảm nhận (người dùng thấy ngay khi mở app):** Cao = mở app lên là thấy
  thiếu/khác CapCut; Trung bình = thấy khi dùng sâu; Thấp = chỉ dân chuyên để ý.
- **Khả thi local:** **A** = làm thật được local bằng FFmpeg/OpenCV/Whisper/model mở
  license sạch; **B** = chỉ gần đúng local (ghi rõ sai số); **C** = bắt buộc
  cloud/API trả phí hoặc model đóng (đề xuất loại hoặc thay thế).
- **Độ khó:** Nhỏ (≤ 1 agent-batch) / Vừa (1–2 batch, có test render thật) /
  Lớn (kiến trúc mới hoặc model nặng).

## 2. Bảng khoảng cách

### 2.1. Tính năng edit còn thiếu

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| E1 | **Mask render 0.97 fps** (geq từng pixel mỗi frame, chậm ~35× baseline) | Chậm tới mức không dùng được cho clip dài trên máy yếu | Mask gần như realtime nhờ GPU | Cao | A | Vừa | Pre-render alpha mask 1 lần thành PNG (hoặc video alpha) rồi overlay, thay vì `geq` mỗi frame. Đã được Q8 đề xuất đúng hướng này. |
| E2 | **Preview chưa pixel-perfect** (LUT CSS approx RMSE ~16; transition chỉ mô phỏng fade; 6 effect mới + sharpen/noise không hiển thị; SR+transition lệch render) | Preview "gần đúng" | Preview ≈ export (GPU pipeline chung) | Cao | B | Vừa–Lớn | WebGL 3D LUT (đọc `.cube`, trilinear trong shader) là cách duy nhất đạt pixel-perfect cho LUT; transition preview cần mô phỏng xfade bằng canvas/WebGL theo từng loại. Không bao giờ đạt 100% bằng CSS. |
| E3 | **Enhance: UI đã có, preview chưa áp** (stabilize/denoise/deinterlace đã có `EnhancePanel` từ Phase 9 R2 + preset 1 chạm đợt 59 P8; chỉ tác dụng khi render, preview chưa áp enhance) | Người dùng bấm được, nhưng không thấy trước kết quả | 1 nút Stabilize/Denoise trong panel + xem trước | Cao | A | Nhỏ | Đính chính 07/11 (đợt 59 P10): gap cũ "không có UI" đã sai. Việc còn lại: áp enhance vào preview (canvas/WebGL xấp xỉ) hoặc ít nhất báo rõ "chỉ có tác dụng khi render" — panel đã báo. Test render đã có sẵn từ P2/Q8 + P9 (52/52). |
| E4 | **Không có nested sequence / compound clip / adjustment layer** | Timeline phẳng | Dự án lớn dùng nested + adjustment layer thường xuyên | Trung bình | A | Lớn | Cần mở rộng video-spec (clip chứa project con; layer áp filter cho mọi clip dưới nó) + render đệ quy. Đụng kiến trúc, làm sau khi E1–E3. |
| E5 | **Text/video/mask chưa bám motion track** (chỉ sticker) | Track xong nhưng chỉ 1 loại clip dùng được | Bất kỳ layer nào cũng bám được | Trung bình | A | Vừa | Mở rộng pipeline overlay của text (PNG SR) và video sang cùng biểu thức nội suy quỹ đạo như sticker; mask bám track cần mask động theo frame (khó hơn). |
| E6 | **Tracking chưa tự phát hiện vật thể, chưa xử lý che khuất, tối đa 240 điểm, vật phẳng/không vân thì fail** | Khoanh bbox tay, mất track là dừng | Auto-detect + re-detect sau che khuất | Trung bình | B | Lớn | Detector mở: YOLO qua ONNX Runtime (cẩn thận license — Ultralytics code AGPL; cân nhắc model SSD/MobileNet qua OpenCV DNN hoặc YOLO weights với runtime tự viết). Re-detect + Kalman smoothing là phần khó. |
| E7 | **Không có audio ducking, mixer UI có meter, markers/chapter** | Track volume + fade + normalize có; ducking không; marker không thấy trong code | Ducking tự động, marker, mixer trực quan | Trung bình | A | Nhỏ–Vừa | Ducking = FFmpeg `sidechaincompress` (có sẵn); markers = thêm field vào spec + UI timeline; mixer meter = Web Audio AnalyserNode. |
| E8 | **Không có frame interpolation / motion blur / slow-mo mượt** | Speed ramp cắt-ghép segment, không nội suy frame | Optical flow slow-mo là tính năng khoe nhiều | Trung bình | B | Lớn | RIFE (code MIT, weights cần kiểm tra license từng bản) chạy local nhưng chậm trên CPU (nội suy từng frame); motion blur = FFmpeg `minterpolate`/`tmix` xấp xỉ được. |
| E9 | **21 transition GLSL không dùng được; transition preview chỉ có fade** | 67 transition nhưng thiếu nhóm 3D/glitch cao cấp | Hàng trăm transition, nhiều loại 3D | Thấp–TB | B | Vừa | `gltransition` không có trong FFmpeg mainline — không biên dịch lại FFmpeg chỉ vì nó. Thay thế: viết thêm custom-expr xfade (đã làm 9 cái ở P5) + mô phỏng preview bằng canvas. |
| E10 | **Chưa có auto-reframe thông minh thật sự** (Haar chỉ bắt mặt chính diện; trajectory liên tục qua cut; crop cứng) | Có auto-reframe nhưng yếu mặt nghiêng/thiếu sáng | Theo chủ thể + nhận diện nhiều vật | Trung bình | B | Vừa | MediaPipe Face Detection (Apache-2.0) thay Haar; thêm scene-cut reset trajectory (scene detect đã có sẵn); padding blur khi chủ thể sát mép. |
| E11 | **Reverse preview giật từng frame, audio reverse mute; không có shuttle ngược toàn cục** | Đúng vị trí nhưng không mượt | Phát ngược mượt | Thấp | B | Vừa | Muốn mượt cần pre-render đoạn ngược thành clip tạm (tốn đĩa/thời gian) hoặc WebCodecs decode ngược — đều là xấp xỉ, không có phát ngược "miễn phí" trên `<video>`. |
| E12 | **Không có HDR/4K workflow hoàn chỉnh** (4K render 2.71 fps; không thấy HDR10 pipeline) | 4K chậm, SDR-only | 4K/HDR là chuẩn khoe | Thấp | A | Vừa | HDR10 qua x265 + metadata (FFmpeg có sẵn); 4K nhanh lên chủ yếu nhờ GPU encode (xem P1). Không ưu tiên trước khi P1 xong. |

### 2.2. AI (caption, TTS, bgremove, tracking…)

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| A1 | **Caption chưa có karaoke highlight / style template / xuất SRT-VTT** (word timestamps đã có trong `caption.py` nhưng chưa dùng để highlight; không thấy UI xuất SRT) | Caption tĩnh, ít style | Caption là tính năng viral nhất của CapCut: nhiều style, highlight từng từ, 1 chạm | Cao | A | Vừa | ASS karaoke (`\k`) cho render + canvas highlight theo word timestamps cho preview; xuất SRT/VTT là chuyển đổi chuỗi thuần túy. |
| A2 | **Dịch caption chỉ sang tiếng Anh** | Whisper `translate` task (thiết kế chỉ ra EN) | Dịch đa ngôn ngữ | Trung bình | B | Vừa | Argos Translate (MIT) hoặc MarianMT Helsinki-NLP (kiểm tra license từng model trước khi dùng) chạy local; chất lượng vi↔en ở mức khá, không bằng dịch vụ cloud. Q3 đã xác minh: môi trường hiện tại chưa có engine MT nào sẵn — cần tải model + verify chất lượng. |
| A3 | **TTS chưa expose voice cloning; chưa có word timestamps, SSML, chỉnh tốc độ/cảm xúc** | Engine VieNeu có cloning từ mẫu 3–5s nhưng UI/bridge chỉ có 25 preset; giới hạn 2000 ký tự/lần | Nhiều giọng, clone giọng, điều chỉnh cảm xúc | Cao | A | Nhỏ–Vừa | Expose cloning đã có trong engine (thêm bridge endpoint + UI upload mẫu); word timestamps cần engine hỗ trợ alignment (chưa chắc VieNeu có — kiểm tra trước khi hứa). |
| A4 | **Bgremove chậm + OOM + không temporal smoothing** (0.43 fps CPU; birefnet OOM ≤8GB; mask từng frame độc lập, viền cứng) | Dùng được cho clip ngắn, máy khỏe | Xóa nền video gần realtime, viền mượt | Cao | A | Vừa | (1) onnxruntime-gpu khi có GPU; (2) temporal smoothing (trung bình mask liên frame + guided filter/feather) — thuần OpenCV, rẻ; (3) chạy ở độ phân giải thấp rồi upscale mask. RVM/MatAnyone chất lượng cao hơn nhưng **license cấm thương mại — không dùng**. |
| A5 | **Voice changer AI (giọng nhân vật/ca sĩ) không có** | Chỉ có pitch/vibrato/bandpass/echo xấp xỉ | Voice changer AI là tính năng hút user | Trung bình | C | Lớn | Model voice conversion tốt hầu hết license hạn chế hoặc cần GPU lớn; hướng mở (kNN-VC, RVC) nặng + chất lượng không ổn định trên CPU. Đây là nhóm **C** — không nên đuổi theo. |
| A6 | **Không có AI avatar / AI video generator / script-to-video tự động** | Không có | CapCut đẩy mạnh nhóm này | Trung bình | C | Lớn | Cần model video diffusion hoặc avatar — toàn bộ đều là cloud hoặc GPU hạng nặng + license hạn chế. Script-to-video **bán-local** thì làm được (TTS + template + caption tự động), nhưng "AI tự sinh video" thì không. |
| A7 | **Beat sync chưa hiểu cấu trúc nhạc** (không downbeat, không verse/chorus/drop, tempo 40–240 BPM, nhạc phức tạp dễ sai quãng 8) | Cắt cơ học theo beat | Cắt theo đoạn nhạc/cảm xúc | Thấp | B | Vừa–Lớn | Downbeat = onset + meter estimation (tự viết trên spectral flux đã có); phân đoạn verse/chorus cần phân tích cấu trúc (self-similarity matrix) — làm được local nhưng độ chính xác vừa phải. |
| A8 | **Scene detect là heuristic FFmpeg, không hiểu ngữ nghĩa; silence detect theo năng lượng (thì thầm bị cắt nhầm, thở/quạt bị giữ)** | Có nhưng dễ sai | Ít được khoe, nhưng auto-cut dựa vào đó | Thấp | B | Vừa | Scene: thêm color-pass đã có (P6) + ngưỡng thích ứng; silence: VAD thật (Silero VAD — MIT) thay cho ngưỡng dB, chạy local nhẹ. |
| A9 | **Caption quality tiếng Việt chưa verify trên giọng thật đa dạng; model whisper small cố định** | Đã test trên giọng TTS, chưa test giọng thật ồn/nhiều người | Caption đa giọng, diarization | Trung bình | A | Vừa | faster-whisper `medium`/`large-v3` (MIT) + VAD filter đã có; diarization (pyannote — cần token HF, license hạn chế cho thương mại) thì cân nhắc kỹ. Nâng model = đổi chất lượng lấy tốc độ. |

### 2.3. Kho nội dung (số lượng và chất lượng)

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| C1 | **Kho nhỏ hơn vài chục lần và toàn đồ tự chế** (template 50, effect 16, transition 81, LUT 174, sticker 244, font 59 family, sound 1043 khai báo — xem chú thích (*) ở §0: index nay liệt kê đủ 1043, trên đĩa 107 file .ogg) | Đủ dùng, thiếu chiều sâu theo chủ đề | Hàng nghìn template/effect/filter theo trend, cập nhật liên tục | Cao | A | Lớn (theo số lượng) | Đây là **hào sâu nhất của CapCut** và không lấp bằng một đợt. Hướng duy nhất bền vững: (a) tiếp tục gen tự động theo lô có kiểm chứng (mẫu Q4), (b) cho user import/tạo + chia sẻ kho (community), (c) template theo chủ đề hot thay vì tăng số lượng mù. Không copy asset CapCut. |
| C2 | **Không có nhạc có bản quyền / nhạc trend** (chỉ có sound CC0 + tự tổng hợp) | Không nhạc nền "nghe là biết" | Thư viện nhạc licensed khổng lồ | Cao | C | — | **Không có cách local hợp pháp** để có nhạc thương mại: cần mua license hoặc dùng nhạc CC0/public-domain. Đây là giới hạn cấu trúc — chấp nhận, hoặc làm nhạc gen AI local (MusicGen — license Meta, cần kiểm tra; chất lượng trên CPU thấp). |
| C3 | **Không có stock footage/ảnh** | User tự import 100% | Kho stock tích hợp, kéo là dùng | Cao | B | Vừa | Pexels/Pixabay API (cần internet + API key, không phải local thuần) hoặc bundle ảnh CC0 (Openverse) có attribution. Onboarding sẽ khác hẳn nếu có 20–50 clip mẫu CC0 kèm sẵn. |
| C4 | **Template chưa "dùng ngay"** (template có placeholder nhưng không kèm media mẫu đẹp; render test dùng testsrc2/PNG tổng hợp) | Template chạy được nhưng chưa đẹp mắt ngay | Bấm template → video đẹp trong 1 phút | Cao | A | Vừa | Đóng gói template + media mẫu CC0 + preset caption/TTS thành "one-click pack"; trang preview template (ảnh tĩnh từng template) để user chọn bằng mắt trước khi áp. |
| C5 | **Text preset render FFmpeg chỉ port được một phần** (rotate/clip-path/skew trong CSS không có tương đương drawtext) | Preview đẹp hơn render ở nhiều preset | Text animation khớp preview–export | Trung bình | B | Vừa | Port preset sang ASS (libass hỗ trợ rotate/clip tốt hơn drawtext) cho nhóm animation phức tạp; hoặc đánh dấu rõ preset nào "preview-only". |

### 2.4. Hiệu năng

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| P1 | **Chưa có GPU encode/decode thật** (chỉ detect + fallback, chưa test trên phần cứng thật; VM không có GPU) | CPU-only: 1080p ~8.6–12.5 fps | GPU encode là lý do CapCut render nhanh hơn realtime | Cao | A | Nhỏ–Vừa (code) | Code detect NVENC/QSV/VAAPI đã có (P2); việc còn lại là **test trên máy có GPU thật** + preset theo GPU. Không có GPU thì không đo được — cần máy test, không phải code thêm. |
| P2 | **Mask 0.97 fps** (xem E1) | — | — | Cao | A | Vừa | Như E1: PNG mask pre-render. |
| P3 | **Preview FPS trên browser thật chưa đo; preview dùng canvas full-res + `ctx.filter`** | Không biết preview có giữ 30fps không | 30–60 fps | Cao | A | Nhỏ (đo) → Vừa (sửa) | Chạy `benchmarks/preview/bench_preview.js` trên browser thật với project mẫu; sau đó: giảm phân giải canvas preview, dùng proxy (đã có Q8) làm nguồn preview mặc định, WebCodecs nếu cần. |
| P4 | **AI chậm trên CPU** (caption 0.3–0.44x, TTS ~0.44x tổng thể, bgremove 0.43 fps; cold-start model ~30s–3 phút) | Chờ lâu, dễ tưởng app treo | Cloud/GPU gần tức thì | Cao | A | Vừa | Giữ model sống trong bridge (đã làm một phần cho caption/TTS qua job queue — bgremove vẫn spawn process mới mỗi request, xem BGREMOVE_LIMITS); batch theo đoạn; progress bar thời gian thực + hủy job (bridge hiện không nhận signal hủy — cần sửa). |
| P5 | **Proxy chưa tự động** (chỉ tạo tay khi còn giữ `File` gốc; mở lại project từ file thì không tạo được) | Project nặng là preview giật | Proxy tự động, trong suốt | Trung bình | A | Nhỏ–Vừa | Tự tạo proxy khi import video >720p (hỏi user 1 lần, ghi nhớ lựa chọn) + lưu proxy sidecar theo hash file để mở lại project vẫn dùng được. |
| P6 | **Render 4K chậm (2.71 fps), không có render queue ưu tiên / render nền thật sự** | Queue FIFO có, nhưng chưa có pause/priority | Render nền + queue linh hoạt | Thấp | A | Vừa | Queue đã persist (P7); thêm pause/resume (cần FFmpeg chạy tách tiến trình + checkpoint — khó) hoặc ít nhất là ưu tiên job + ước lượng thời gian còn lại. |

### 2.5. Mobile

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| M1 | **Không có app native** (chỉ mobile-web + PWA; chưa test điện thoại thật) | Dùng được trên trình duyệt điện thoại | App mobile là sản phẩm chính của CapCut | Cao | A (nhưng lớn) | Lớn | Capacitor/Tauri Mobile bọc web app hiện tại (giữ 1 codebase) là đường rẻ nhất; app native thật (Swift/Kotlin) = viết lại. Bridge local trên điện thoại là vấn đề riêng (không có localhost:8787 như desktop) — cần kiến trúc lại AI/render cho mobile. |
| M2 | **Mobile-web chưa test thật + thiếu thao tác cảm ứng sâu** (pinch bắt đầu trên clip thì không zoom; box-select suy giảm; chưa test Safari iOS/Android thật) | Dùng được ở mức cơ bản | Cảm ứng là trải nghiệm chính | Trung bình | A | Vừa | Test trên điện thoại thật là bước bắt buộc trước khi claim; sửa gesture conflict (clip drag vs pinch) bằng vùng pinch riêng ở ruler. |
| M3 | **Offline mobile chỉ là UI shell** (media/IndexedDB/bridge không cache; render/AI bắt buộc bridge local) | Mở app xem được, edit thì cần máy tính chạy bridge | App mobile xử lý on-device | Trung bình | B | Lớn | On-device thật trên mobile cần WASM (ffmpeg.wasm, whisper WASM) — khả thi nhưng chậm và tốn pin; hoặc giữ mô hình "điện thoại là remote cho máy tính". Chọn mô hình trước khi làm. |

### 2.6. Xuất bản / chia sẻ / cộng tác

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| S1 | **Không có đăng trực tiếp lên TikTok/YouTube** (chỉ xuất file MP4 + trang HTML tĩnh) | Xuất file rồi đăng tay | 1 nút đăng kèm caption/hashtag | Cao | C | Vừa | Bắt buộc OAuth + API của nền tảng (cần internet, tài khoản, duyệt app) — không phải local. Làm được về kỹ thuật nhưng đi ngược chủ trương local và tốn công duy trì API. |
| S2 | **Không có cộng tác nhiều người** (không server, không tài khoản, 2 tab cùng sửa còn ghi đè nhau) | Làm 1 mình | Team edit, comment, cloud project | Trung bình | C | Lớn | Cần server + auth + CRDT/OT cho timeline — là sản phẩm khác, không phải tính năng lẻ. **Trái chủ trương local-first.** |
| S3 | **Chia sẻ = gửi file** (HTML tĩnh + MP4; video >100MB không nhúng được; không link công khai, không đếm lượt xem) | Xem được nhưng thô | Link chia sẻ đẹp, nhúng được | Trung bình | A–B | Nhỏ–Vừa | Cải thiện trong phạm vi local: nén preview nhẹ cho share page, QR code cho file, xuất GIF/thumbnail; link công khai thì bắt buộc phải có server (C). |
| S4 | **Xuất bản thiếu preset mạng xã hội hoàn chỉnh** (có export presets nhưng chưa rõ đủ 9:16/1:1/4:5 + bitrate từng nền tảng + safe-area guide) | Xuất MP4 chung chung | Preset TikTok/Reels/Shorts 1 chạm | Trung bình | A | Nhỏ | Thêm preset theo nền tảng + overlay safe-area (vùng bị che bởi nút/caption của app) lên preview; toàn bộ là config + UI. |

### 2.7. Trải nghiệm người mới (onboarding)

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| N1 | **Không có onboarding** (mở app là editor trống; project mẫu load chậm ~11s bằng MediaRecorder/canvas; không tour, không template-first) | Người mới không biết bắt đầu từ đâu | Mở app → template đẹp → video đầu tiên trong phút | Cao | A | Nhỏ–Vừa | Màn hình chào: 3 template nổi bật + nút "thử ngay với video mẫu" (media mẫu CC0 đóng gói sẵn, không gen bằng canvas lúc load); tour 5 bước bằng overlay; project mẫu lưu sẵn thay vì gen lúc chạy. |
| N2 | **i18n chưa xong** (Inspector/Timeline chính xong 113 key; ~15 sub-panel vẫn hardcode tiếng Việt; thông báo drop vẫn tiếng Việt) | User quốc tế gặp tiếng Việt lẫn lộn | Đầy đủ ngôn ngữ | Trung bình | A | Nhỏ | Quét chuỗi cứng còn lại trong các panel liệt kê ở Q2_LIMITS §6, đưa qua hệ i18n sẵn có. |
| N3 | **Chưa có click-test bao phủ thao tác cốt lõi** (trim mép, split, delete, box-select, undo/redo sau kéo, responsive/PWA chưa test) | Hồi quy UI dễ lọt | — (nội bộ) | Trung bình | A | Nhỏ–Vừa | Mở rộng bộ click-test Playwright của Q2 (script đã có, chỉ cần thêm case); chạy trong CI khi workflow lên được GitHub (đang bị chặn 403 quyền workflows). |
| N4 | **Thông báo lỗi / tiến trình AI còn thô** (bgremove đồng bộ không progress thật, không hủy job; caption/TTS load model chậm không báo rõ) | User tưởng app treo | Progress + ước lượng thời gian | Trung bình | A | Vừa | Bridge streaming progress (SSE) cho job dài + nút hủy thật (cần bridge nhận signal hủy — hiện chưa có); ước lượng từ độ dài media. |

## 3. Top 10 hướng nên làm tiếp theo (xếp theo tác động/khó)

| Hạng | Hướng | Vì sao lên top | Khả thi / Khó |
|---|---|---|---|
| 1 | **N1 — Onboarding + template dùng ngay** (màn chào, media mẫu CC0, project mẫu lưu sẵn, tour 5 bước) | Tác động cảm nhận lớn nhất với công sức nhỏ nhất: biến "mở app là editor trống" thành "phút đầu tiên đã ra video". Mọi tính năng khác đều vô nghĩa nếu người mới bỏ đi ở phút đầu. | A / Nhỏ–Vừa |
| 2 | **E3 — Áp enhance vào preview** (stabilize/denoise/deinterlace: UI + render đã có, chỉ thiếu preview) | Tính năng đã chạy thật khi render, chỉ thiếu thấy trước kết quả — khép khoảng cách preview–render còn lại của Enhance. | A / Nhỏ–Vừa |
| 3 | **E1/P2 — Mask render nhanh bằng PNG mask pre-render** | Sửa điểm nghẽn hiệu năng tệ nhất (0.97 fps) mà không cần GPU hay model mới. | A / Vừa |
| 4 | **P1+P3 — Đo preview FPS thật + test GPU encode trên máy có GPU** | Hai con số chưa đo đang chặn mọi kết luận hiệu năng; không đo thì mọi tối ưu sau đó đều mù. | A / Nhỏ (đo) |
| 5 | **A1 — Karaoke highlight + style caption + xuất SRT/VTT** | Caption là tính năng viral nhất của CapCut; word timestamps đã có sẵn, chỉ thiếu lớp hiển thị. | A / Vừa |
| 6 | **A3 — Expose voice cloning + cải thiện TTS** (endpoint clone, chunk text dài tự động) | Engine đã có cloning, chỉ thiếu đường ra UI; TTS là 1 trong 3 AI trụ cột. | A / Nhỏ–Vừa |
| 7 | **E2 — WebGL 3D LUT preview** (đưa `.cube` tới browser, trilinear trong shader) | Khép khoảng cách preview–render lớn nhất còn lại mà CSS không bao giờ làm được. | B / Vừa–Lớn |
| 8 | **P5 — Proxy tự động khi import + sidecar theo hash file** | Biến proxy từ tính năng "phải biết mới dùng" thành mặc định trong suốt; cứu preview trên project nặng. | A / Nhỏ–Vừa |
| 9 | **C4 — One-click template pack** (template + media mẫu + caption/TTS mẫu) | Kết hợp C1 + N1: kho nhỏ nhưng mỗi template đều "bấm là đẹp", thay vì tăng số lượng mù. | A / Vừa |
| 10 | **N2+N3 — Xong i18n sub-panel + mở rộng click-test** (trim/split/delete/box-select/undo) | Rẻ, giảm hồi quy, mở cửa user quốc tế; là nền để mọi đợt sau tự tin hơn. | A / Nhỏ–Vừa |

## 4. Ba hướng KHÔNG nên làm (lý do)

| Hướng | Lý do không làm |
|---|---|
| **1. Cộng tác nhiều người / cloud project / link chia sẻ công khai (S2)** | Cần server + auth + đồng bộ timeline thời gian thực — là một sản phẩm khác, đi ngược chủ trương local-first mà user vừa khẳng định lại (24/10). Version history local + share page tĩnh đã đủ cho nhu cầu "làm 1 mình, gửi cho người khác xem". |
| **2. Voice changer AI / AI avatar / AI video generator (A5, A6)** | Toàn bộ đều bắt buộc model đóng, license hạn chế, hoặc GPU hạng nặng; chất lượng local trên CPU không đủ để khoe. Đuổi theo nhóm này sẽ đốt nhiều tháng mà vẫn thua bản cloud của CapCut — đúng vào điểm yếu của mình, không phải điểm mạnh. |
| **3. Nhạc thương mại / nhạc trend có bản quyền (C2)** | Không có cách hợp pháp nào để "local hóa" nhạc có bản quyền: hoặc mua license (đắt, theo bài), hoặc vi phạm. Hướng thay thế duy nhất là nhạc gen AI local hoặc CC0 — chất lượng khác hẳn, nên chấp nhận đây là giới hạn cấu trúc thay vì cố lấp. |

## 5. Kết luận một câu

VCut hiện đã **ngang CapCut ở khung edit cốt lõi** (timeline, keyframes, mask,
speed curve, tracking, beat sync) và **hơn ở điểm local/offline + agent layer**,
nhưng **thua rõ ở 3 chỗ người dùng cảm nhận ngay**: phút đầu tiên dùng app
(onboarding/template dùng ngay), kho nội dung (nhỏ hơn hàng chục lần, không
nhạc trend, không stock), và hiệu năng (mask 0.97 fps, chưa có GPU, preview
chưa đo). Phase 9 nên đánh vào 3 chỗ đó theo thứ tự top 10 ở §3 — toàn bộ đều
làm được local, không cần cloud, không cần model đóng.

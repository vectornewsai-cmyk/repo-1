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
| Motion tracking | Sticker bám track (OpenCV template→MIL); text/video ĐÃ bám track từ Phase 9 D3 (cùng field `clip.track`); mask chưa bám track (đợt 87 đang làm); track chạy CLI ngoài editor |
| Beat sync | BPM/beat từ numpy+FFmpeg (119.76 vs thật 120, ≤19ms); cắt theo beat có review; không downbeat, không hiểu cấu trúc bài |
| Voice effects | pitch/robot-vibrato/telephone-bandpass/echo-1-tap (render-only, preview chưa có) |
| Enhance | stabilize (vidstab 2-pass), denoise (hqdn3d), deinterlace — **đã có UI từ Phase 9 R2**: `EnhancePanel` mount trong Inspector (`inspector.secEnhance`, 16 key `enhance.*` đã có trong vi/en), khử răng cưa/chống rung/khử nhiễu nối `clip.enhance`; **chỉ tác dụng khi render, preview chưa áp enhance** (ghi trong header `EnhancePanel.tsx`). (Ghi chú 07/11: brief đợt 59 P10 ghi "Enhance chưa có UI" — kiểm chứng code cho thấy panel đã có từ R2; xem `docs/PHASE9_ROUND59_P10_DOCS_LIMITS.md` §4.) |
| Proxy workflow | Có (480p/720p, badge PROXY, export luôn dùng file gốc) — nay TỰ ĐỘNG khi import video >720p (cơ bản từ R3, đóng nốt đợt 84 L9; click-test headed đợt 86 N9 24/24) |
| Mobile | Mobile-web responsive + PWA + touch (test 58/58); **không app native**, chưa test điện thoại thật |
| Cloud/collab | Không có server (đúng chủ trương local); chỉ có version history local + share page HTML tĩnh + tài liệu giao thức sync |
| Benchmark | Render 1080p ~8.6–12.5 fps (2 vCPU, không GPU); mask 720p **0.97 fps**; caption 0.30–0.44x realtime; **TTS 0,12–0,75× realtime (median 0,32× đợt 49 / 0,44× đợt 50, 72 lần đo, infer thuần sau warmup, chưa tính nạp model ~10–12,5 s — đính chính 06/11, số cũ ~1,5–2,5× đã bị bác bỏ)**; bgremove 0.43 fps; enhance 720p (đợt 59 P9): denoise ~12 fps, stabilize ~6,8 fps, deinterlace ~24,7 fps, combo ~3,5 fps (số tuyệt đối dao động theo tải VM, xem RESULTS §9) |
| Preview FPS trên browser thật | **Đã đo lần đầu (đợt 52 I9, 06–07/11)**: ~1,4–4,6 fps khi phát (project nhẹ/vừa/nặng), ~20 fps khi tạm dừng, ~32 fps trang trống; clip 1080p trơn 7–10 fps; proxy 720p 9,8/10,5 fps so với gốc 1080p 7,0/8,2 fps — vẫn xa 30 fps. Xem `docs/PHASE9_ROUND52_I9_PREVIEW_FPS_LIMITS.md`. |
| i18n (vi/en) — mới 07/11 | `vi.json` == `en.json` == **1957 key lá** (đếm lại 08/11; 1942 → 1957 ở đợt 59: P1 +4, P8 +11, P3 ghi đè 1 key), cùng tập key, placeholder khớp. Dict tăng 1011 (đợt 55 L1) → 1722 (đợt 56, +711 key) → 1937 (đợt 57, +215) → 1942 (đợt 58, +5) → 1957 (đợt 59, +15). Chính tả nút Hủy thống nhất thành "Huỷ": 141 occurrence / 50 file (đợt 58 O8; giữ 7 chỗ có chủ đích). |
| Modal / Escape — mới 07/11, đính chính 10/11 (đợt 79 G9) | Escape đóng WelcomeModal (đợt 58 O1, test 9/9 + headed 3/3). SilenceModal hết tràn viewport (đợt 57 N1, re-probe headed PASS sau gộp). BeatSyncModal + SceneModal dùng class `modal` đã định nghĩa (đợt 58 O4, 24/24 + headed 4/4). **O1 + O4 ĐÃ ĐÓNG (đợt 59 P2/P4, kiểm chứng lại đợt 75 C9 + đợt 79 G9: escapeModals59P2 26/26, escapeForms60Q10 15/15, modalClasses59P4 33/33, css60 59/59, css61 60/60)** — câu "Còn thiếu" ở hàng này trước đây là lỗi thời (G9 §5.2). i18n modals: +6 key (5 openProject.archiveHistory* + 1 captions.trackLabel), dict 2419 → 2425 (đợt 79 G9, test 9/9). |
| GOP trial-decode / probe — mới 07/11 | Stream-mode sample tới 64 MiB (cap 64 MiB từ đợt 59 P6 / 60 Q5 — đính chính E7 đợt 77: gap cũ ghi 8 MiB là lỗi thời), chunked fetch 512 KiB (đợt 57 N10, 17/17). Timeout trial-decode scale theo kích thước: 0,3 ms/KiB trên 256 KiB, trần 2500 ms (đợt 58 O6, 18/18); keyframe 4K nhiễu 4,1 MiB decode-ok 662,7 ms thay vì fail-open ở 200 ms. Keyframe zero-giữa: quét zero-run AVCC (`scanAvccZeroRun`, đợt 77 E7) bắt được trong 520–2914 ms (không decode). Còn lọt: sample >64 MiB stream-mode skip theo thiết kế; chưa đo Safari/Firefox (WebKitGTK đo được đợt 77 E8, không phải Safari thật). |
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
2. **O1 — Escape chưa thống nhất: ĐÃ ĐÓNG (đợt 59 P2; kiểm chứng lại
   đợt 75 C9, headed 9/9).** TourCard / TemplatePackModal /
   TemplatePicker đã đóng bằng Escape theo pattern O1 (đợt 59 P2:
   test 26/26, headed 5/5; đợt 60 Q10 đổi quyết định Escape bước 2
   của TemplatePicker). Đợt 75 C9 kiểm chứng lại độc lập sau gộp:
   toàn bộ test tĩnh + click-test headed mới 9/9 đều xanh, không sửa
   file sản phẩm nào.
3. **O3 — failsoft surface chưa đủ:** `skippedReasons` chỉ sinh khi có
   layer adjustment; chuỗi lý do effect không nêu tên type (key N4
   `unknownEffectType` thiếu var `{type}`); đường vẽ từng frame vẫn chỉ
   `console.warn`.
4. **O4 — class chưa định nghĩa còn sót: ĐÃ ĐÓNG (đợt 59 P4; kiểm
   chứng lại đợt 75 C9, headed 9/9).** `caption-modal` (CaptionModal),
   `modal-x`/`modal-label`/`modal-hint`/`modal-err` (SilenceModal) đã
   được định nghĩa (đợt 59 P4: test 33/33, headed 6/6);
   `<p className="error">` top-level của BeatSyncModal đã có style.
   Đợt 75 C9 kiểm chứng lại độc lập sau gộp: css60/css61 giữ nguyên
   expected list/count, toàn bộ test tĩnh + click-test headed mới 9/9
   đều xanh.
5. **O5 — chưa click-test headed** nhãn "Subtitles (EN)" + xuất SRT/VTT;
   false-positive track user tự đặt tên trùng tiền tố (giới hạn có sẵn).
6. **O6 — sample >64 MiB stream-mode skip theo thiết kế** (đính chính E7
   đợt 77: cap là 64 MiB, không phải 8 MiB như gap cũ ghi); chưa đo
   Safari/Firefox; keyframe zero-giữa **ĐÃ BẮT ĐƯỢC** bằng quét zero-run
   AVCC (đợt 77 E7, 520–2914 ms, không decode).
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
| E1 | **Mask render 0.97 fps — ĐÃ ĐÓNG (Phase 9 R2)** (số 0,97 fps là mốc đo trước R2; nay pre-render alpha mask 1 lần thành PNG rồi overlay bằng đường movie+blend nhanh, không còn `geq` từng pixel mỗi frame — `buildMaskPngChain`/`maskPng` trong `server/render/src/render.js`, `packages/video-spec/src/mask.ts` ghi "dùng chung đường movie+blend nhanh của R2, KHÔNG dùng geq chậm"; số fps đo lại sau R2: không rõ trong nguồn) | Đã có đường nhanh, không còn chậm ~35× baseline theo thiết kế | Mask gần như realtime nhờ GPU | Cao | A | Vừa | Đã làm xong ở R2 (xem cột đầu); còn lại: đo lại fps mask thật sau R2 để thay số 0,97 fps cũ. |
| E2 | **Preview chưa pixel-perfect — LUT ĐÃ XONG, còn transition/effect** (WebGL 3D LUT thật ở preview: `apps/web/src/lib/webglLut.ts`, lưới 3D + trilinear 8 tap, test 7/7 từ đợt 58 O7 — phần LUT của gap này đã đóng; còn lại: transition preview chỉ mô phỏng fade; 6 effect mới + sharpen/noise chưa hiển thị đúng; SR+transition lệch render) | Preview "gần đúng" ở transition/effect | Preview ≈ export (GPU pipeline chung) | Cao | B | Vừa–Lớn | LUT: đã xong bằng WebGL 3D LUT (không còn CSS approx RMSE ~16 cho LUT). Transition preview cần mô phỏng xfade bằng canvas/WebGL theo từng loại. Không bao giờ đạt 100% bằng CSS. |
| E3 | **Enhance: UI đã có, preview ĐÃ ÁP (đợt 60–77)** (stabilize/denoise/deinterlace đã có `EnhancePanel` từ Phase 9 R2 + preset 1 chạm đợt 59 P8; preview nay áp enhance xấp xỉ qua `apps/web/src/lib/enhancePreview.ts` — `enhancePreviewPlan` dùng trong `preview.tsx`, test `enhancePreview60Q1`…`enhancePreview77E1`; còn lại: preset không chặn stabilize khi có speedKeyframes (chỉ cảnh báo); chưa đo render MP4 đúng combo preset; enhance ở 1080p chưa đo) | Người dùng bấm được và thấy trước kết quả xấp xỉ | 1 nút Stabilize/Denoise trong panel + xem trước | Cao | A | Nhỏ | Đính chính 07/11 (đợt 59 P10): gap cũ "không có UI" đã sai; đính chính 11/11 (đợt 87 O9): gap "preview chưa áp enhance" cũng đã cũ — preview đã áp từ đợt 60. Việc còn lại xem cột đầu. Test render đã có sẵn từ P2/Q8 + P9 (52/52). |
| E4 | **Không có nested sequence / compound clip / adjustment layer** | Timeline phẳng | Dự án lớn dùng nested + adjustment layer thường xuyên | Trung bình | A | Lớn | Cần mở rộng video-spec (clip chứa project con; layer áp filter cho mọi clip dưới nó) + render đệ quy. Đụng kiến trúc, làm sau khi E1–E3. |
| E5 | **Text/video ĐÃ BÁM motion track (Phase 9 D3); chỉ còn mask chưa bám** (text và video gắn được quỹ đạo qua cùng field `clip.track` như sticker — `packages/video-spec/src/index.ts`, `apps/web/src/components/sticker/TrackPanel.tsx:41`; mask bám track vẫn chưa làm — đợt 87 đang làm; còn lại: text typewriter/karaoke không bám track ở render (ASS không có biểu thức theo frame); video dính transition không bám track — xem `docs/FEATURE_STATUS.md:289`) | Track xong, text/video dùng được | Bất kỳ layer nào cũng bám được | Trung bình | A | Vừa | Text/video: đã xong ở D3. Mask bám track cần mask động theo frame (khó hơn) — đang làm đợt 87. |
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
| A1 | **Caption karaoke / style template / xuất SRT-VTT — ĐÃ XONG** (ASS karaoke `\k` cho render: `server/render/src/render.js:484-488`; highlight từng từ ở preview: `karaokeActiveWordIndex` trong `apps/web/src/lib/captions.ts`; style template karaoke có tên: đợt 74 B9, key `caption.karaokeStyle*`; xuất/nhập SRT + WebVTT: `apps/web/src/lib/subtitles.ts` (Phase 9 R4), kiểm chứng headed đợt 59 P5 7/7 vi+en; còn lại: karaoke/typewriter không bám track ở render — xem E5) | Caption có karaoke highlight + style + xuất SRT/VTT | Caption là tính năng viral nhất của CapCut: nhiều style, highlight từng từ, 1 chạm | Cao | A | Vừa | Đã xong (xem cột đầu); word timestamps đã có trong `caption.py` và đã dùng để highlight. |
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
| P2 | **Mask 0.97 fps — ĐÃ ĐÓNG (Phase 9 R2, xem E1)** (số fps đo lại sau R2: không rõ trong nguồn) | — | — | Cao | A | Vừa | Như E1: PNG mask pre-render đã làm xong ở R2. |
| P3 | **Preview FPS trên browser thật chưa đo; preview dùng canvas full-res + `ctx.filter`** | Không biết preview có giữ 30fps không | 30–60 fps | Cao | A | Nhỏ (đo) → Vừa (sửa) | Chạy `benchmarks/preview/bench_preview.js` trên browser thật với project mẫu; sau đó: giảm phân giải canvas preview, dùng proxy (đã có Q8) làm nguồn preview mặc định, WebCodecs nếu cần. |
| P4 | **AI chậm trên CPU** (caption 0.3–0.44x, TTS ~0.44x tổng thể, bgremove 0.43 fps; cold-start model ~30s–3 phút) | Chờ lâu, dễ tưởng app treo | Cloud/GPU gần tức thì | Cao | A | Vừa | Giữ model sống trong bridge (đã làm một phần cho caption/TTS qua job queue — bgremove vẫn spawn process mới mỗi request, xem BGREMOVE_LIMITS); batch theo đoạn; progress bar thời gian thực + hủy job (bridge hiện không nhận signal hủy — cần sửa). |
| P5 | **Proxy ĐÃ TỰ ĐỘNG (cơ bản từ R3, đóng nốt đợt 84 L9)** (tự tạo proxy khi import video >720p, chọn 480/720p, thông báo khi mất file gốc — đợt 84 L9 đóng 3 khoảng trống còn lại; click-test headed đợt 86 N9: 24/24 Chromium; còn lại: chưa test trên WebKitGTK trong đợt 86; N4 qua đường user thật + export UI end-to-end chưa kiểm chứng) | Project nặng preview đỡ giật nhờ proxy tự động | Proxy tự động, trong suốt | Trung bình | A | Nhỏ–Vừa | Đã xong (xem cột đầu); sidecar theo hash file đã có từ R3. |
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
| S4 | **Preset mạng xã hội 1 chạm — ĐÃ XONG (đợt 80 H10)** (preset TikTok/Reels/Shorts theo nền tảng: khổ/fps/codec/CRF/trần bitrate/audio riêng + safe-area theo nền tảng; dict +9 key) | Preset theo nền tảng | Preset TikTok/Reels/Shorts 1 chạm | Trung bình | A | Nhỏ | Đã xong đợt 80; còn lại: đo render thật từng preset trên footage thật. |

### 2.7. Trải nghiệm người mới (onboarding)

| # | Khoảng cách | Hiện trạng VCut | CapCut (tham chiếu) | Tác động | Khả thi | Khó | Công nghệ / ghi chú |
|---|---|---|---|---|---|---|---|
| N1 | **Không có onboarding** (mở app là editor trống; project mẫu load chậm ~11s bằng MediaRecorder/canvas; không tour, không template-first) | Người mới không biết bắt đầu từ đâu | Mở app → template đẹp → video đầu tiên trong phút | Cao | A | Nhỏ–Vừa | Màn hình chào: 3 template nổi bật + nút "thử ngay với video mẫu" (media mẫu CC0 đóng gói sẵn, không gen bằng canvas lúc load); tour 5 bước bằng overlay; project mẫu lưu sẵn thay vì gen lúc chạy. |
| N2 | **i18n gần xong — chỉ còn 1 rò rỉ UI thật (đợt 80 H7 đã wire)** (Inspector/Timeline chính xong 113 key; sub-panel đã quét qua hệ i18n; 3/4 chuỗi cảnh báo cổng phát ngược từng hiện nguyên văn tiếng Việt ở locale en — nay đã wire qua `warningKeys` 4 key `reverseGate.*` + 6 key `rehydrate.*`; dict 2461) | User quốc tế gặp tiếng Việt lẫn lộn | Đầy đủ ngôn ngữ | Trung bình | A | Nhỏ | Quét chuỗi cứng còn lại trong các panel liệt kê ở Q2_LIMITS §6, đưa qua hệ i18n sẵn có. |
| N3 | **Click-test thao tác cốt lõi — ĐÃ CÓ bao phủ (đợt 80 H9)** (bộ N9 đợt 57 chạy lại nguyên vẹn làm hồi quy trên cây hiện tại + bộ mới H9 cho responsive + PWA; pill FPS từng che clip ở 390px đã dời) | Hồi quy UI dễ lọt | — (nội bộ) | Trung bình | A | Nhỏ–Vừa | Mở rộng bộ click-test Playwright của Q2 (script đã có, chỉ cần thêm case); chạy trong CI khi workflow lên được GitHub (đang bị chặn 403 quyền workflows). |
| N4 | **Tiến trình/hủy AI — ĐÃ CÓ (đợt 80 H8)** (bridge streaming progress + nút hủy thật cho caption/TTS/bgremove/scene/reframe; bridge unit 59/59, E2E 37/37; ước lượng thời gian vẫn chưa có) | User tưởng app treo | Progress + ước lượng thời gian | Trung bình | A | Vừa | Bridge streaming progress (SSE) cho job dài + nút hủy thật (cần bridge nhận signal hủy — hiện chưa có); ước lượng từ độ dài media. |

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

## 6. Cập nhật sau đợt 77 (10/11/2026 — xem docs/PHASE9_ROUND77_LIMITS.md)

- **u2netp KHÔNG thay u2net** (E4): nhanh hơn 1,5–2,4× nhưng IoU chân dung
  chỉ 0,626, bỏ váy tối màu; chỉ xem xét đường dùng hẹp, opt-in. Birefnet
  vẫn ĐÓNG (chờ máy RAM ≥ 12 GB).
- **npm audit lần đầu CÓ SỐ** (E5, đường GitHub Advisory DB REST): 5
  advisory / 4 CVE (multer + body-parser high 7,5; vite + minimatch
  medium) — nợ bump chuyển đợt 78. TTS 39 CVE Pillow không đổi; Pillow
  13.0.0 đã vá cả 39 nhưng Gradio vẫn kẹp pillow<13.
- **Luật delta0 G12 đã vào code đo** (E6, 23/23); **quét zero-run AVCC**
  đã nối vào trial-decode (E7); **sharpen/noise parity KHỚP** 3 cửa sổ
  (E9) — kernel upscale thật của Chrome là BC(0,25, 0,375), chưa nối vào
  `chrome-resample.mjs`.
- **"Ai free" giữ `copy`** (E3): sửa vòng đời decoder từ CLI không khả
  thi; NEEDS_WRITABLE có chạm được race (suy luận từ source) — cần build
  ffmpeg riêng + stress lại. **Gate luật confirm mới** (E2): giết ⟺
  re-gate FAIL ∧ slot 1 là FN; FP kiểm duyệt 3/12 → 0/12.
- **Deint FPS vẫn FAIL** (E1): mọi đường nhanh đều không chứng minh được
  nhanh hơn half-res; đã quay về divisor 2. **GPU/Safari thật vẫn chưa
  đo** (E8); WebKitGTK đo được lần đầu (phát 5/5 codec, không có
  MediaRecorder) — không phải Safari thật. VM nay là 4 vCPU EPYC 9D25
  (số tuyệt đối cũ trong RESULTS.md mang nhãn máy 2 vCPU 7D13).
- Nợ mở cho đợt 78: xem ROUND77_LIMITS §4 (12 mục).

## 7. Cập nhật sau đợt 78 (10/11/2026 — xem docs/PHASE9_ROUND78_LIMITS.md)

- **npm 5 CVE ĐÃ ĐÓNG** (F4): multer 2.5.0, body-parser 1.20.9, vite
  6.4.5, minimatch 11.0.1 — audit GHSA toàn lockfile 447/447, 0
  advisory. `package-lock.json` 219 KB cần `ENABLE_PRIVSEP=0` khi push.
- **Kernel upscale BC(0,25, 0,375) ĐÃ NỐI vào production** (F6, nhánh
  upscale trong `resamplePlaneTrilinear`): 19/20 verdict KHỚP (tam giác
  15/20); downscale bit-identical. Đính chính câu "chưa nối vào" ở §6.
- **G1 vs G2 phân biệt được lần đầu** (F7, 1 case w2880 testpattern:
  G2 đúng, G1 sai). **Keyframe protocol** (F8): lý do `zero-run` về
  tới T3 (trước đây chỉ `decode-failed` chung); sample >64 MiB vẫn skip
  theo thiết kế.
- **NEEDS_WRITABLE chạm được race** (F3, build ffmpeg riêng thành công,
  sha Fisher p≈1e-8) nhưng 0 crash trên 90 lần chạy nên chưa có bằng
  chứng giảm crash — chưa triển khai ffmpeg tự build; thử SPLIT trước.
- **TTS 39 không đổi lần thứ 5 liên tiếp** (F5); tín hiệu mới: Gradio
  dev 7.0.0.dev0 (2026-11-09) đã nới cap pillow<14 — chờ stable 7.x.
- **u2netp opt-in KHÔNG triển khai** (F9, 2/4 clip); MediaPipe
  SelfieSegmenter chạy được, license sạch (Apache-2.0), nhưng chưa đạt
  IoU — chưa tích hợp (cần dep ~130 MB). Birefnet vẫn ĐÓNG.
- **Nhãn máy đã sửa** (F10): 4 file sống mang nhãn 4 thế hệ máy; 2 nhãn
  cũ "2 vCPU" là SAI (thực tế 4 vCPU thế hệ 2) — số đo không đổi.
- **Deint FPS vẫn FAIL** (F1): intermediate "medium" không nhanh hơn
  "high". **Gate luật mới chưa có lần giết thật đầu tiên** (F2, 0/5
  phiên FN) — cần ≥10 phiên nữa.
- Nợ mở cho đợt 79: xem ROUND78_LIMITS §4 (10 mục).

## 8. Cập nhật sau đợt 79 (10/11/2026 — xem docs/PHASE9_ROUND79_LIMITS.md)

- **G5 ĐÃ ĐÓNG — FPS deint-only** (G1): intermediate deint đọc từ
  canvas held-frame đã vẽ cùng tick; draw-fps 1,51× / 0,83× / 1,03×
  trong 3 lần chạy headed độc lập, cả 3 ≥ 0,75× (code cũ
  0,59×/0,58×/0,55×). Pixel không lệch (MAD 0,0162/0,0133).
- **Gate luật mới: lần giết thật đầu tiên** (G2, 2 lần — S2/S4 slot1
  FN + re-gate FAIL). Gộp E2+F2+G2 (19 phiên): bắt FN sớm 2/4, FP
  kiểm duyệt 0, tha oan 2. Ngưỡng 30/20/2 giữ nguyên.
- **SPLIT = NEEDS_WRITABLE ở mức sha** (G3): SPLIT 30/30 = ground
  truth, NOCOPY lệch 19/30; crash 0/60 cả hai đường — crash vẫn chưa
  chứng minh được. KHÔNG thay đổi production (giữ `copy`), KHÔNG
  cần ffmpeg tự build.
- **TTS 39 không đổi lần thứ 6 liên tiếp** (G4); Gradio stable vẫn
  6.31.0, dev mới nhất vẫn 7.0.0.dev0 — chờ stable 7.x. CẤM kiểm lại
  cho tới khi upstream đổi.
- **Kernel BC giữ (0,25, 0,375)** (G5): sweep nội dung mới hòa
  31/80 vs tam giác 32/80; lưới (B,C) không có điểm vượt trội.
- **G1/G2 vẫn chưa phân biệt được** (G6): gộp harness-hiện-tại 73
  case, G1 = G2 = G12 = 66/67. Đính chính: case phân biệt duy nhất
  của F7 (w2880-n05) KHÔNG còn đứng sau khi F6 nối kernel BC.
- **u2netp/MediaPipe KHÔNG tích hợp** (G7, lần 2): MediaPipe 1/5
  đạt, u2netp 4/9 clip đạt, không có discriminator tách được
  đạt/rớt. Giữ u2net.
- **GPU thật/Safari thật vẫn chưa đo** (G8): không GPU lần 4; nhãn
  WebGL "Apple GPU" trên WebKitGTK là GIẢ; WebKitGTK loop video kẹt
  sau đúng 1 vòng (W3, chưa có workaround kiểm chứng); MediaRecorder
  vẫn vắng; WebGPU không dùng được. Safari thật vẫn cần máy macOS/iOS.
- **Modals/i18n** (G9): Escape/class ĐÃ ĐÓNG từ đợt 59/60 (kiểm lại
  26/26, 15/15, 33/33, css60 59/59, css61 60/60); +6 key i18n,
  dict 2419 → 2425. Đính chính hàng §0 Modal/Escape (câu "Còn thiếu"
  là lỗi thời).
- Nợ mở cho đợt 80: xem ROUND79_LIMITS §4 (10 mục).

## 9. Cập nhật sau đợt 80 (10/11/2026 — xem docs/PHASE9_ROUND80_LIMITS.md)

- **S4 ĐÃ XONG — preset mạng xã hội 1 chạm** (H10): preset TikTok/
  Reels/Shorts theo nền tảng (khổ/fps/codec/CRF/trần bitrate/audio
  riêng + safe-area theo nền tảng); dict +9 key.
- **N2 thu hẹp — i18n modals đã wire** (H7): chuỗi cảnh báo cổng phát
  ngược + lý do rehydrate đã dịch (4 key `reverseGate.*` + 6 key
  `rehydrate.*`); dict 2425 → 2461 (10 H7 + 9 H10 + 17 aiJob).
- **N3 đã có bao phủ click-test** (H9): bộ N9 chạy lại làm hồi quy +
  bộ mới cho responsive + PWA; pill FPS dời khỏi clip ở 390px (thêm
  class `perf-fps-btn` / `perf-fps-panel` làm hook harness).
- **N4 đã có tiến trình/hủy AI** (H8): bridge streaming progress + nút
  hủy thật (bridge unit 59/59, E2E 37/37); ước lượng thời gian vẫn
  chưa có.
- **Vidstab crash 0/60 lần thứ 3 liên tiếp** (H1, taskset 2 core):
  crash vẫn chưa đo được ở bất kỳ đường nào; COPY-vs-SPLIT hòa tuyệt
  đối ở mức sha — không cần ffmpeg tự build.
- **Gate A/B luật cũ live lần đầu** (H2): luật cũ giết thật 3/3 phiên
  KHỎE (FP quan sát trực tiếp lần đầu); luật mới tha đúng những phiên
  luật cũ giết oan; bắt FN sớm 0/3 (đánh đổi đã chấp nhận); độ sắc
  ngưỡng FN 2 fps vẫn chưa kiểm chứng được.
- **Kernel BC** (H3): Chrome KHÔNG dùng BC ở xung vuông (kernel là tam
  giác) nhưng BC vẫn giữ vì bù lệch đường sharp; noise 640 đã sửa
  (nguyên nhân bt709-vs-bt601, không phải chroma).
- **G1/G2** (H4): 1 case phân biệt verdict nhưng CHỈ ở số học không-
  làm-tròn (biên 0,0008); harness làm tròn 2 chữ số nên vẫn báo khớp
  cả hai; G2 vs G12 vẫn chưa phân biệt được.
- **G8 +0,099 đã tách xong — không phải hồi quy** (H6): nguyên nhân là
  held-frame intermediate của G1, chứng minh bằng A/B trong app
  (revert 1 dòng → G8 về đúng 1,4826); giữ nguyên code.
- **WebKit loop đã sửa** (H5): workaround `ended → seek(0) + play()`
  sửa được loop trên WebKitGTK (kiểm chứng headed).
- **TTS 39: CẤM kiểm lại mỗi đợt** — đã kiểm 6 lần liên tiếp không đổi;
  chỉ kiểm khi có tín hiệu stable Gradio 7.x mới.
- Nợ mở cho đợt 81: xem ROUND80_LIMITS §4 (10 mục).

## 10. Cập nhật sau đợt 81 (10/11/2026 — xem docs/PHASE9_ROUND81_LIMITS.md)

- **Vidstab: endpoint per-frame CÓ POWER ở 720p** (I1) — NC lệch
  882/1500 frame (58,8%), SP/CP 0/1500. Cơ chế race 2 chế độ: (a)
  buffer-reuse khi còn live (881/882 frame lệch); (b) use-after-free
  thật lúc drain/EOF (1/882, frame r2 n=148, chứng minh bằng poison).
  Crash E3 là đuôi hiếm của (b). Crash gộp 0/270 — từ nay dùng
  per-frame làm endpoint chính thay vì crash.
- **Gate 2fps (I2) và G1/G2 unrounded (I4) DỞ DANG** — chuyển đợt 82.
- **Kernel BC sharp: cơ chế mới tìm được một nửa** (I3) — làm nốt nửa
  còn lại; không sửa production.
- **Deint FPS: verdict "G1 đóng" mỏng** (I5) — ngưỡng 0,75× nằm trong
  nhiễu đo (H6 run 3 0,71×); loadavg không dự báo được tỉ lệ.
- **AI job ETA đã nối xong** (I6): ước lượng thời gian cho job AI —
  phần còn thiếu của N4; dict +2 key → 2463.
- **WebKit loop: workaround đã nối từ H5** (I7) — chỉ kiểm chứng;
  W1 đầy đủ không chứng minh được trên VM.
- **i18n sweep: KHÔNG còn chuỗi UI thật nào chưa wire** (I9): quét AST
  2069 literal VI / 65 file; 80 key khóa trong test mới.
- **Cả 6 preset KHỚP spec** (I10, render thật): không sửa code;
  Audio Shorts 384k → 248k không phải lỗi preset.
- **Sóng EPERM đã hết** — đợt 81 ghi file bình thường suốt lượt.
- Nợ mở cho đợt 82: xem ROUND81_LIMITS §4 (10 mục).

## 11. Cập nhật sau đợt 82 (10/11/2026 — xem docs/PHASE9_ROUND82_LIMITS.md)

- **Đợt 81 nay 10/10 hoàn thành** (I2/I4 về muộn trước đợt 82):
  I2 **độ sắc ngưỡng 2 fps ĐÃ ĐÓNG** — verdict lật đúng theo phía
  của 2 fps trong mọi ca; I4 **G2 vs G12: 0 case** (75 case không-
  làm-tròn + 14 case capture Q4 mới) + **đính chính H4 §1.2**:
  "blend làm sụp residStd_R" là sai do so sánh lệch chuẩn (blend a88
  resid 1,22 ≈ dự đoán 1,24 từ cha still).
- **Kernel thật của Chrome = Mitchell (1/3, 1/3), KHÔNG phải
  BC(0,25, 0,375)** (J2, probe headed MAD 0,000–0,003) — chưa đổi
  production (cần A/B: Mitchell khớp kernel thật nhưng chưa biết có
  bù được lệch đường sharp như BC không).
- **Deint FPS: verdict theo trung vị PASS** (J3, median 10 lần
  0,807×) nhưng KHÔNG có biên an toàn (CI 95% [0,74; 0,95] chạm
  ngưỡng).
- **G2/G12: vẫn 0 case (bound 0/81)** (J4); thí nghiệm VP9-vs-h264
  chưa chạy (bị EPERM cắt).
- **Q4: DỪNG SĂN hướng cũ** (J5) — cơ chế = lệch chỉ số frame
  (off-by-one; f24 ≠ f25), không phải làm mượt; hai điều kiện kéo
  ngược nhau trên mọi họ đã đo; hướng duy nhất chưa thử: sọc màu mịn.
- **Lineart aliasing: cơ chế thu hẹp nhưng không hướng sửa có bằng
  chứng** (J7) — không sửa production.
- **Ship Electron: profile `full` làm mặc định** (J8) — AppImage
  556.967.568 byte (sha `43a2d045…57be`), bundle bridge + render +
  4 slim venv; model 3,7 GB tải lần đầu (resume + SHA256); minimal
  147.915.613 byte giữ làm profile nhẹ.
- **Preview FPS: kết quả âm** (J9) — FPS = f(tải VM), không cải thiện
  code; không giữ thay đổi production nào.
- **Bin O2 ĐÃ ĐÓNG** (J10) — rehydrate với media import hoạt động
  đúng, không sửa production.
- **Gate 2fps (J6) DỞ DANG** — chuyển đợt 83.
- **EPERM TÁI PHÁT 22:50–23:05 +07** (ffmpeg fail 13 lần) — sóng
  lặp lại, không phải đã hết hẳn (tin 18:36 chỉ đúng lúc đó).
- Nợ mở cho đợt 83: xem ROUND82_LIMITS §4 (12 mục).

## 12. Cập nhật sau đợt 83 (11/11/2026 — xem docs/PHASE9_ROUND83_LIMITS.md)

- **Gate 2fps: MỤC TIÊU ĐÃ ĐẠT** (K1) — 3 ca slot1 dưới 2,0 fps
  trong dải có re-gate FAIL; ngưỡng 30/20/2 giữ nguyên (gộp
  E2+F2+G2+H2+I2+J6+K1, n=11 ca FAIL trong dải).
- **Kernel production ĐÃ ĐỔI sang Mitchell (1/3, 1/3)** (K2, A/B:
  4 verdict KHỚP tăng thêm, 0 verdict mất đi; suite 18/18).
- **Deint FPS: CHỐT luật verdict median-5 + ≥4/5 PASS** (K3) —
  PASS ổn định, có biên (gộp 15 lần median 0,840×, CI cận dưới 0,787).
- **Codec VP9 vs h264 KHÔNG làm lệch verdict** (K4) — 0 lần lật
  verdict trong 40 cặp; nợ đóng.
- **Q4: DỪNG SĂN** (K5) — sọc màu mịn (hướng cuối cùng chưa thử)
  tái hiện pattern ở mức cổng (2 case) nhưng full verdict 0/12
  phân biệt được G1 vs G2 (stdRatio ~1,48 vượt ngưỡng).
- **Lineart: 5 hướng mới đều KHÔNG thắng baseline** (K6) — không sửa
  production.
- **Ship full: AppImage mới 556.967.608 byte, probe AI 8/8,
  orphan-relaunch PASS 2 lần, click-test 8/9** (K7) — race orphan
  (J8 §5.2) và smoke lần 2 timeout (J8 §5.1) đã hết; K7 export UI
  FAIL do hộp thoại lưu native không xử lý được bằng XTEST (K7b
  fallback render smoke PASS).
- **EPERM hardening: helper retry + nối 4 điểm** (K8, test 16/16);
  sóng EPERM vẫn xuất hiện nhiều lần trong lượt (K1/K2/K4/K7/K10).
- **GPU thật: KHÔNG (xác nhận lần 4); WebKitGTK KHÔNG KHỞI ĐỘNG
  ĐƯỢC — HỒI QUY** (K9, kernel VM 7.0.0-43→44, GStreamer biến mất,
  thiếu lib) — số WebKit cũ chỉ còn hồ sơ.
- **Vidstab: tpad 1 frame và NEEDS_WRITABLE đều 0/1500** (K10) —
  không sửa production; chế độ (b) UAF không tái hiện nhưng không
  bác bỏ được (4/54 gộp có n=148 poison-like).
- **VM reboot 2 lần trong lượt** (K1, K7) — config vite tái tạo md5
  khớp.
- Nợ mở cho đợt 84: xem ROUND83_LIMITS §4 (9 mục).

## 12. Cập nhật sau đợt 83 (11/11/2026 — xem docs/PHASE9_ROUND83_*_LIMITS.md)

- **Gate 2fps ĐÃ ĐÓNG ở mức quan sát** (K1, hoàn thành J6): 3 ca slot1 dưới 2,0 fps re-gate FAIL đều GIẾT; cặp sát nhất giết 1,96 / tha 2,03; luật mới 9 lần giết thật, FP 0. Ngưỡng 30/20/2 giữ nguyên.
- **Kernel production ĐÃ ĐỔI sang Mitchell (1/3, 1/3)** (K2, A/B 3 cánh): trực tiếp 27/27, sharp 15/18, tự nhiên +4 khớp / 0 mất; hybrid (BC sharp + Mitchell plain) tệ hơn. `chrome-resample.mjs` đã đổi.
- **Deint FPS: verdict MEDIAN-5 PASS ổn định lần đầu có biên** (K3): pool 15 lần median 0,84×, CI cận dưới 0,787 — nhưng luật (b) trên cửa sổ 5 lần vẫn lật được giữa các đợt (J3 vs K3); cần +5 lần lên pool 20.
- **Codec KHÔNG làm lệch verdict — nợ ĐÃ ĐÓNG** (K4): VP9 vs h264 |ΔresidStd_R| 0,0025–0,0055, 0 lần lật trong 40 cặp; lệch orig-vs-h264 do re-encode/tag màu.
- **Q4 CHÍNH THỨC DỪNG SĂN** (K5): 2 case thỏa cổng nhưng full verdict 0/12 phân biệt G1 vs G2; 8 hướng đã loại trừ; cơ chế d0 do chroma, resid do luma.
- **Lineart: không hướng mới nào thắng baseline** (K6) — không sửa production; ứng viên còn lại duy nhất: probe đọc trực tiếp effect canvas.
- **EPERM: helper `eperm-retry.mjs` mới + test 16/16** (K8), nối 4 điểm; sóng tái phát ~18:10–18:26 UTC (probe nền #5 fail 2/2) — sóng lặp lại, không tuyên bố hết hẳn.
- **GPU thật / Safari thật: kết quả âm lần 4** (K9): không GPU, nhãn WebGL "Apple GPU" giả; checklist Safari cho đợt sau có máy Mac.
- **Vidstab race: họ (b) giữ ref/copy ĐƯỢC ỦNG HỘ** (K10): copy/NW/tpad 0 lệch; TPAD1 khử cả mid-stream; thành phần hoạt động chưa tách (probe đợt sau: tpad clone stop_duration=0; tpad add stop_duration=0,034).
- **K7 DỞ DANG — chuyển đợt 84:** ship AppImage mới 556.967.608 byte (sha `0326dccb…`), probe AI 8/8 available:true (false-negative bgremove J8 đã đóng), race orphan §5.1/§5.2 đã hết trong lần chạy 2; click-test 8/9 bước (K7 export qua UI kẹt hộp thoại lưu file native); orphan-kill9-relaunch chưa chạy lại; LIMITS chưa viết; chưa stage.
- **Tổng chờ push sau đợt 83: 962 entry / 167 file batch / 630 file duy nhất.** HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 84: xem build-loop-log mục gộp đợt 83 (10 mục).

## 13. Cập nhật sau đợt 84 (11/11/2026 — xem docs/PHASE9_ROUND84_*_LIMITS.md)

- **K7 HOÀN THÀNH** (L1): click-test gói thật 8/8 PASS hai lần liên tiếp (lần 18+19, đích native 484.316 byte, 8,0s); orphan-kill9-relaunch 4 lần liên tiếp ALL GREEN; race J8 §5.1/§5.2 đã hết. Chẩn đoán dialog GTK: tên WM_NAME rỗng, Enter không đóng, phải bấm nút Save + nút "Tải xuống MP4" sau render.
- **Phần dư sqw4: tìm ra cơ chế, ĐÃ ĐÓNG** (L2): base byte-identical; plain = drawImage(video) dưới CTM (tái tạo khớp MAD 0,015–0,019); phần dư do trừ chéo hai toán tử + clip. Thang ~2 sạch: Mitchell thắng mọi thang. Noise dưới Mitchell s=1,132: 6/6 khớp thống kê.
- **Deint pool 20: median 0,805×, CI [0,774; 0,914], PASS 15/20 — luật (b) CHƯA ĐẠT** (L3): 5 lần mới lật ngược so với K3; tỉ lệ phụ thuộc chế độ tải (baseline <10fps 14/16 PASS vs ≥10fps 1/4 PASS); deint tốn đúng 1 khung rAF thêm. Quyết định "G1 đóng hay chưa" thuộc parent/user.
- **Vidstab: thành phần hoạt động của tpad là `cache_stop` ref** (L4, loại trừ): pull p=0,81, frame EOF p=0,71; tpad-clone-1 replicate 0/1500. Endpoint 1080p gray-identity bị bác; artifact nội suy bilinear tất định của libvidstab; parser showinfo đã sửa (147 → 150/150).
- **Lineart: effect canvas + composite ĐÓNG hoàn toàn (MAD 0)** (L5); delta còn lại ở khâu upscale VIDEO của đường plain; lỗi hình học model J7/K6 đã sửa trong model; `applySharpen` bt709 ĐÚNG — nợ H3 §5.2 đã đóng.
- **EPERM TÁI PHÁT trong lượt** (L6): probe #2 20:58Z ghi /tmp ra 0 byte lặng; #3–#9 sau đó đều OK; đã nối helper vào 6 điểm; quét 0-byte: không file dữ liệu nào 0 byte.
- **Ship services E2E: cả 3 job AI chạy được thật trong AppImage profile `full`** (L7): TTS/caption/bgremove đều có output thật đã verify — nợ mở Phase 10 "app đóng gói chưa chạy đủ services" đã đóng ở mức E2E (thời gian đo dưới tải cao).
- **TTS voice cloning: giọng đã clone LƯU LẠI ĐƯỢC** (L8): kho `~/.vcut/cloned-voices/` (tối đa 20 giọng) + UI tạo/nghe thử/xóa; cosine giống giọng 0,9024; dict 2465 → 2489.
- **Proxy tự động: đóng 3 khoảng trống còn lại** (L9): chọn 480/720p, thông báo khi mất file gốc; auto-proxy cơ bản đã có từ R3; dict +2 key.
- **WebKit loop W1 ĐÃ CHỨNG MINH ĐƯỢC ĐẦY ĐỦ** (L10): loop 10/10 vòng trên cả 6 clip, 0 kẹt; app-level ép `ended` 3/3 PASS cả hai engine; MediaRecorder vẫn `undefined` trên WebKitGTK 27.2 (lần 5); hồi quy "không khởi động được" của K9 đã hết; phát hiện mới W7 (+1 restart dư).
- **Tổng chờ push sau đợt 84: 1053 entry / 179 file batch / 681 file duy nhất; dict 2489 key.** HEAD vẫn 5f548ef8. KHÔNG push. (Đính chính closing đợt 87: số cũ 1033/178/680 là số worker báo trước khi đếm lại từ đĩa.)
- Nợ mở cho đợt 85: xem build-loop-log mục gộp đợt 84 (10 mục).

## 14. Cập nhật sau đợt 85 (11/11/2026 — xem docs/PHASE9_ROUND85_*_LIMITS.md)

- **G1: M1 KHÔNG TỰ ĐÓNG** (M1) — pool 30fps không đổi (không chạy thêm E1 30fps ở luồng này); CI cận dưới 0,640 dưới ngưỡng 0,75; fixture 60fps không cứu được verdict. Số cho parent/user quyết.
- **Toán tử video: Δcorr s ≈ 2,26 đã tách được nguồn** (M2) — không phải hiệu ứng thang, không phải đường plain/video; không sửa production.
- **Vidstab: backport parser showinfo sang J1 + K10 XONG, ĐÃ KIỂM CHỨNG** (M3) — selfcheck J1 9/9; endpoint không đổi trên 21 arm; showMissing 32→0 (K10) / 14→0 (J1); parser khôi phục +32/+14 frame. Cơ chế lõi cache_stop rõ hơn một bậc nhưng **chưa đóng**.
- **W7: nửa Chromium ĐÓNG (artifact), nửa WebKit còn MỞ** (M4) — Chromium +1 sau gỡ ghi đè = artifact bắn lặp (đã chứng minh); WebKit 0 restart dư (P1/P2/P3/P5); quan sát +1 phase B của L10 không tái hiện 2 lần → còn là 1 quan sát đơn lẻ. **W6 đo xong, KHÔNG giữ cách giảm nào** — drawImage là thành phần duy nhất gây chậm (~+270 ms/seek, 3–11×); fastSeek và keyframe-first loại; pause-seek-play chưa chứng minh được frame sẵn sàng.
- **EPERM: không gặp sóng trong lượt** (M5, probe #1–#6, 0 fail) — nhưng không tuyên bố hết hẳn; helper retry đã nối vào 50 file.
- **Ship services: 4/5 job PASS thật trong gói** (M6: Reframe/Translate/Silence/Scene PASS; birefnet-general FAIL — SIGKILL nghi OOM-kill, fallback u2net hoàn tất sau 412,5s). Nay **7/8 job AI đã chạy thật trong gói** (L7: TTS, caption, bgremove-u2net; M6: 4 job còn lại); chỉ còn birefnet-general chưa có 1 lần chạy thành công nào trong gói.
- **Voice cloning bằng giọng người thật ĐÃ THÀNH CÔNG** (M7) — mẫu LibriSpeech dev-clean (CC-BY 4.0), speaker 2277 nữ 19,335s; mẫu KHÔNG đưa vào repo. Tạo giọng PASS (131,8s); synth lần 2 PASS 5,92s. Cosine ref × clone **0,7618** (thang cùng người 0,82–0,96; sàn khác giọng 0,34–0,46; mẫu tổng hợp L8 0,9024); clone vs preset Hải Đăng 0,4570 — không sụp về preset. Export/import JSON round-trip PASS; cosine sau import 0,7408. Dict +11 key tts.* (đo lúc ~00:30: 2489 → 2500; closing recount 2507).
- **Proxy: tiến trình % + hàng đợi thử lại đã nối xong** (M8) — proxyAuto 46/46, bridge verify 19/19; dict +7 key.
- **Enter không đóng dialog là hành vi CHUẨN của GTK file chooser, KHÔNG PHẢI bug** (M9) — probe 6 biến thể phím, tất cả STILL_OPEN; dialog là Electron showSaveDialog native, app không lắng nghe được phím bên trong. Click-test gói thật lần 20 (harness đã sửa, AppImage K7 sha 0326dccb…): **8/8 PASS**. Nợ L1 lần 15/16 đóng ở mức "không phải bug".
- **Lineart video scaler: ĐÃ ĐO XONG + ĐÃ SỬA (production) + ĐÃ VERIFY TRONG APP** (M10) — L5 harness chạy lại 7/7.
- **Clip D (bổ sung M4 sau closing): TÁI HIỆN ỔN ĐỊNH, không phải kẹt nhất thời** — loop W1 đầy đủ WebKit 50/60; D 0/10 rồi 0/10 lần nữa (tổng 0/40 vòng + 0 ended/12 s no-poll); đối chứng A 10/10 cùng session. Đã loại trừ chờ canplay/canplaythrough, bỏ vòng poll 100 ms. Cơ chế gốc còn mở.
- **Tổng chờ push sau đợt 85: 1220 entry / 190 file batch / 768 file duy nhất; dict 2507 key** (đợt 85: 167/11 — 163 lúc closing + 4 entry muộn của M4, xem §15). HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 86: xem ROUND85_LIMITS §4 (11 mục).

## 15. Cập nhật sau đợt 86 (11/11/2026 — xem docs/PHASE9_ROUND86_*_LIMITS.md)

- **Toán tử video ĐÃ ĐÓNG** (N7) — drawImage(video) = tam giác + vị trí 1/16 + trunc; verify3 **86/87 case MAD đúng 0** (73 upscale + 6 CTM + 7/8 downscale). Phần dư duy nhất: sqw4-mid s=0,6 (16 pixel tại S=k+0,5). Lưu ý: `chrome-resample.mjs` nay 39.167 byte (> giới hạn push-files 37.768 — khi push cần ENABLE_PRIVSEP=0).
- **Vidstab cache_stop: cơ chế lõi ĐÃ ĐÓNG** (N6) — race nhịp reuse buffer pool ở tầng decoder/scheduler, không phải trong transform (transform đồng bộ không có đường nào đọc frame n+1; đường float `#ifdef TESTING` không có trong binary đang chạy). Probe DUAL 0/1500 lệch; NC-SHIM 882/1500 lệch nhưng 0 frame lệch trước frame writable đầu tiên; CP-BLACK byte-identical với CP-KEEP.
- **W7 nửa WebKit ĐÓNG ở mức quan sát** (N2) — không tái hiện sau 5 lần chạy độc lập (cộng M4: tổng 5 lần, 0 lần tái hiện +1 của L10). **Phát hiện phụ lớn: GST_PLUGIN_SYSTEM_PATH sửa crash 100%** — sau reboot, mọi trang có media crash WebProcess WebKitGTK 100% (4/4) do libgstreamer chỉ quét plugin trong thư mục không tồn tại; launch với `GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` đã chứng minh 2/2 lần; harness N2 đã thêm biến này.
- **WebKit clip D: cơ chế kẹt = race khởi động/preroll của pipeline GStreamer với nguồn HTTP progressive** (N1) — file buffered đầy [0,4] ngay từ đầu, không phải đói buffer mạng; watchdog seek-cứu thất bại A/B (0/5), không sửa production. Đã loại trừ playsInline, listener ended, viewport, fps, GOP, moov, codec, duration.
- **W6: bỏ renderFrame khi seeking ĐÃ VÀO PRODUCTION** (N3) — WebKit GOP 30 playing: draw 902 ms → skip 120 ms (~7,5×); vẽ frame giữ mỗi tick 902 ms — không cải thiện; chi phí nằm ở drawImage lặp lại mỗi tick trong lúc seek. Audio graph không ảnh hưởng seek — câu hỏi mở lớn nhất của M4 đã đóng. seekSkipRender 9/9.
- **Birefnet-general VẪN CHƯA chạy thành công lần nào trong gói — 0/4 attempt đợt này** (N4; tổng 6 lần chết liên tiếp cùng chữ ký tính M6 đợt 85 + 2 chẩn đoán standalone). **Tiến triển thật:** tắt ONNX arena + memory pattern cho session birefnet đã giảm đỉnh RSS **4,74 → 2,62 GB (−45%)**, sống lâu hơn (~4,5–5,5 → ~6,5 phút) nhưng vẫn chưa đủ qua được trên VM trong giờ vòng lặp. Fallback u2net hoàn tất 17/17 frame đúng thiết kế. 7/8 job AI trong gói giữ nguyên.
- **G1: SỐ CHO PARENT/USER QUYẾT, N5 KHÔNG TỰ ĐÓNG** (N5) — pool 30fps mới n=24 **median 0,845, PASS 19/24 (79%)**, thiếu đúng 1 lần để đạt 80%; tách chế độ: tải n=20 median 0,895, 18/20 (90%) PASS ổn định; yên n=4 không đổi (median 0,680, 1/4). Khuyến nghị: đóng có điều kiện theo chế độ tải. **Deint combo 60fps** (N10): n=8 median 0,930, PASS 6/8 (75%) — luật (b) vẫn chưa đạt. Playhead combo 1,42–1,62× do teleport +2,00s (dấu vân tay trần clamp `PREVIEW_DT_CAP_S = 2`); đã tách được thành phần gây ra: lớp chroma/LUT/effects, enhance không.
- **EPERM: không gặp sóng trong lượt** (N8, probe #1–#4, 0 fail) — nhưng không tuyên bố hết hẳn. Helper retry đã nối **1.211 lần gọi ghi / 533 file**; writeFileSync còn lại **126 (−90%)**.
- **Proxy click-test headed 24/24 Chromium** (N9) — không sửa code sản phẩm; WebKitGTK không chạy được trong đợt này (dep apt mất sau reboot, apt lock bị giữ).
- **ĐÍNH CHÍNH SỐ TỔNG: worker báo 1765 là SAI, đúng là 1805.** Parent đếm lại trực tiếp từ đĩa theo từng đợt: đợt 67–84 = 1053/179/681; đợt 85 nay = 167/11; đợt 86 thread = 582/10; sau closing = **1805 entry / 201 file batch / 1107 file duy nhất**. Con số 1765 của worker thiếu 40 entry.
- **Đợt 85 +4 entry MUỘN (phát hiện khi đếm đợt 86):** file `phase9-round85-m4-webkit-w7-w6.txt` bị sửa lúc 02:07 UTC (09:07 +07) — SAU khi parent gộp xong đợt 85 (closing lúc 01:31 UTC). Một tiến trình M4 chạy muộn đã thêm 4 script loop-D (`webkit_loop_d_rerun_85m4.mjs`, `webkit_loop_d_waitcanplay_85m4.mjs`, `webkit_loop_d_waitcanplaythrough_85m4.mjs`, `webkit_loop_d_nopoll_85m4.mjs`) — cả 4 đều có trên đĩa, đúng mẫu đặt tên M4, đúng mảng loop-D (liên quan N1 đợt 86) nên giữ nguyên trong batch M4. Đợt 85 nay là **167 entry / 11 file** (không phải 163); tổng sau đợt 85 là **1220/190/768**. Parent đã sửa số tổng trong `docs/PHASE9_ROUND85_LIMITS.md` (5 chỗ) và đưa file đó vào closing batch đợt 86. Bài học: batch file của một đợt có thể bị tiến trình muộn sửa sau khi gộp — khi đếm tổng ở đợt sau, đếm lại từng đợt, đừng cộng dồn số cũ.
- **Tổng chờ push sau đợt 86: 1805 entry / 201 file batch / 1107 file duy nhất; dict 2507 key.** HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 87: xem ROUND86_LIMITS §4 (9 mục).

## 16. Cập nhật sau đợt 87 (11/11/2026 — xem docs/PHASE9_ROUND87_LIMITS.md)

- **E5 ĐÃ ĐÓNG HOÀN TOÀN — mask bám motion track** (O1–O8): tâm mask = vị trí track, đo bằng pixel thật ở cả render (png mặc định + trackgeq) lẫn preview, click-test 21/21 trên cây đã gộp. Text/video đã bám từ Phase 9 D3; nay mask cũng bám — mọi loại clip đều bám track.
- **Render chính (O2):** keyframes suy từ quỹ đạo → video mask ffv1 qua đường D4; tâm khớp điểm track sai số <0,0001; tracked vs tĩnh tại t=2,0 MAD 0,023; mask tĩnh không hồi quy (MAD 0,0); render tracked 11,2s vs tĩnh 10,5s (720p 120f).
- **Geq động (O3): KHÔNG vào production** — chạy đúng (centroid lệch ≤0,2px) nhưng chỉ 1,14 fps vs PNG 12,14 fps; giữ sau cờ `--mask-mode trackgeq` làm đường thử nghiệm/fallback. Bẫy double-shift (tâm cuối = 2·track − 0,5) đã tìm ra + sửa ở cả 3 mode.
- **Preview (O4):** khớp render png + trackgeq lệch ≤0,0005 (≤0,64px @1280). Không có cờ mask-mode nên preview lệch với render `--mask-mode geq` (đã đo, chấp nhận — mặc định là png).
- **Hành vi đổi có chủ ý, GIỮ:** clip track+mask tĩnh nay đứng yên, chỉ mask di chuyển (trước đây clip dịch theo track). Fallback khi sinh video mask thất bại: mask tĩnh tại hình học track t=0 + warn.
- **Warning transition nói sai về mask — ĐÃ SỬA ở closing:** mask vẫn bám track qua transition (O6 C6 + parent verify png: tâm 0,275/0,499/0,649) vì mask chain áp theo unit, trước xfade; chỉ shift D3 của unit bị bỏ qua. Validator + TrackPanel + MaskPanel đã sửa (key mới `motionTrack.maskStillFollows`).
- **EPERM (O10 + closing):** nối thêm 16 điểm (O10) + 9 dòng closing; không còn đường ghi production nào chưa nối (theo phân loại M5/N8/O10). Probe nền N8 đã CHẾT sau #5 — lần thứ 3 liên tiếp probe nền chết không rõ lý do; cần cơ chế probe bền hơn.
- **Benchmark (O7):** tracked (video mask) 10,9–18,9 fps 720p, nhanh hơn geq ~2,4–4,4×, chậm hơn PNG tĩnh ~2–3×; preview tracked 15,15 fps ≈ static 13,15 fps; sinh video mask ~0,025–0,030 s/frame 720p.
- **i18n:** dict 2507 → **2515** (7 key O5 + 1 key closing `motionTrack.maskStillFollows`); click-test O8 chạy lại sau gộp: 21/21 (b1/b4 lật PASS).
- **Tổng chờ push sau đợt 87: 1894 entry / 212 file batch / 1144 file duy nhất; dict 2515 key.** HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 88: xem build-loop-log mục gộp đợt 87 (13 mục — G1, birefnet, WebKit clip D, EPERM probe nền, TTS 39 CẤM kiểm lại, ci-security 403).

## 17. Cập nhật sau đợt 88 (11/11/2026 — xem docs/PHASE9_ROUND88_LIMITS.md)

- **E5 hoàn thiện — đóng nốt nợ còn lại của mask bám motion track** (P1–P6, P9): fallback video-mask ép kích hoạt end-to-end (MAD 0,000 cả 2 tầng); pre-pass R2 hết vẽ PNG thừa cho clip tracked (1 dòng `continue`, MAD trước/sau 0,0); parity keyframes+track preview vs render png khớp (Δ ≤ 0,0005), feather/SR/transition khớp; trackgeq 240 điểm render được thật sau khi sửa lỗi fail cứng (xem dưới); click-test WebKit 21/21 sau gộp i18n; warn validator image+track+mask sửa đúng; preview O4 refactor sang helper O1 không đổi hành vi.
- **Lỗi thật đã sửa — track dày làm render fail cứng (P4):** `buildAxisExpr` sinh if lồng tuyến tính sâu = số điểm, vượt giới hạn parse ffmpeg (~100): mask-geq fail từ 83 điểm, overlay từ 93. Sửa bằng cây if cân bằng (độ sâu ~log2(N)+2). Render thật track 240 điểm: tâm lệch ≤0,1px; merged/fade, speed-ramp, compound đều đúng (harness 34/34). Khuyến nghị O3 "≤20 điểm" hết hiệu lực về đúng/sai; trackgeq vẫn chậm (~0,7 fps 720p) nên giữ sau cờ, KHÔNG làm mặc định.
- **Preview image+track+mask — LỆCH RENDER ĐÃ SỬA Ở CLOSING:** render làm mask ảnh bám track từ đợt 87 O2, preview giữ mask tĩnh vì call site image không truyền `clip.track` + type `ImageClip` thiếu field `track` + `normalizeImageClip` làm rơi track qua chuẩn hoá. Closing thêm field vào type, giữ track qua chuẩn hoá (cả `.ts` lẫn mirror `.js`), truyền `clip.track` ở `drawImageClip`. Probe pixel closing (ảnh trắng 720p): tâm preview **0.4007/0.5007/0.6007** @0.5/1.0/1.5s, khớp số probe video của O4 và kỳ vọng track.
- **Lệch còn lại, đã đo (P3):** render trackgeq đóng băng w/h keyframes (Δw = 0,0992, ~127px @1280) — giữ nguyên, ghi là giới hạn đã biết của đường thử nghiệm trackgeq (mode png canonical đã khớp). Motion blur + mask: preview vệt ~12–16px, render MAD 0,0 (tmix áp trước mask, nguồn trơn → vô hình) — chưa quyết hướng xử lý, đợt 89 đo lại với footage thật có vân.
- **Birefnet RAM guard (P7):** ngưỡng 6 GB (`MemAvailable`, có `--min-ram-mb`/env/`--no-ram-guard`); dưới ngưỡng thì chuyển u2net ngay, không thử birefnet. Chạy thật: chặn ở avail 1609 MB, u2net 17/17 frame, RSS đỉnh 1091 MB. **Birefnet-general vẫn 0 lần chạy thành công trong gói** — guard chỉ tránh đợi-chết, vẫn cần cửa sổ yên ≥ 6 GB ~7 phút hoặc máy nhiều RAM.
- **EPERM probe v2 (P8):** `scripts/probe-eperm-v2.sh` (once/loop/status, heartbeat nguyên tử, boot marker). Quét lại writeFileSync: 81 dòng code (số 99 cũ đếm trùng .sh); không còn đường ghi production nào chưa nối. **Lần đầu tiên một cái chết của probe có nguyên nhân được ghi nhận:** loop P8 chết do **VM reboot 09:21:17Z** (`status` báo DEAD/STALE, log `boot changed d473b560 -> e10b9199`); probe #6 trên boot mới ok=2 fail=0. Giả thuyết GC cho 4 lần chết trước vẫn chưa loại trừ được. Đề xuất cron riêng 10 phút — parent không tự tạo, chờ user quyết.
- **Benchmark (P9):** tracked render 720p 5,60–6,83 fps (thấp hơn O7 10,87–18,91 do VM tải nặng, hướng vẫn khớp); preview tracked 15,48 ≈ static 14,80 fps; sinh video mask 0,043–0,078 s/frame. Verify độc lập 61/61: tâm mask 0,275/0,499/0,725 ở cả 2 đường render, mask bám qua transition cả 2 mode.
- **i18n:** dict 2515 → **2516** (1 key P6 `TRACK_IMAGE_MASK`); 2 test pin dict 2463 đỏ sẵn từ đợt 84 đã bump về 2516; regex `TRACK_TRANSITION` stale từ closing đợt 87 đã đồng bộ lại.
- **Tổng chờ push sau đợt 88: 1955 entry / 222 file batch / 1177 file duy nhất; dict 2516 key** (đợt 88: 61/10 — 55 luồng + 6 closing; đếm lại trực tiếp từ đĩa theo từng đợt). HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 89: xem LIMITS gộp đợt 88 §4 (12 mục — G1, birefnet, WebKit clip D, cron probe EPERM, TTS 39 CẤM kiểm lại, ci-security 403, pre-pass keyframes, motion blur + mask, trackgeq, fallback, harness O8).

## 18. Cập nhật sau đợt 89 (11/11/2026 — xem docs/PHASE9_ROUND89_LIMITS.md)

- **Lượt 18:35 spawn 9 luồng xong thì parent chết do sandbox reset / VM reboot 13:21:06Z**
  (boot 7439870b → 62b088d2); closing đợt 89 do lượt cron 21:35 thực hiện (verify lại
  từ đĩa + chạy lại test chọn lọc). Bài học vận hành: trạng thái quan trọng chỉ để
  trong ~/workspace, không để /tmp hay /usr.
- **Pre-pass R2 hết thừa PNG cho mask keyframes (Q1)** — 1 dòng `continue`, MAD trước/sau 0.0.
- **Motion blur + mask: lệch do PREVIEW, không phải render (Q2)** — render blur nội dung thật
  (gStd 127→43–96) + mép mask luôn sắc ≤1.9px; preview snapshot theo tick (~60fps) gây vệt
  tới 145px dưới tải. Hướng sửa (iii) snapshot theo frame video + mask 1 lần sau blend —
  parent chốt làm ở đợt 90.
- **Trackgeq hoàn thiện (Q3)** — C1–C4 fail-fast 5/5, 3/3, 3/3, 5/5; O3 `all` 21/21 sau
  reboot; render trackgeq cx đúng tuyệt đối; preview khớp cả 2 mode. Quyết định: KHÔNG thêm
  cờ mask-mode cho preview (hướng b). Đóng băng w/h keyframes là giới hạn đã biết của đường
  thử nghiệm.
- **Fallback mở rộng (Q4)** — 105/105 (D4/IMG/GEQ/INV/T240); 4K 0.57 fps, RSS đỉnh 2189 MB;
  720p 30s 5.58 fps. P1 re-run 30/30.
- **Harness seek O8 (Q5)** — xác nhận seek thật (4 tín hiệu) + `SEEK_TIMEOUT_EXTENSIONS = 5`
  (ngân sách 7.2s/attempt); click-test Chromium 21/21 (×2), WebKit 21/21 (lần 3 sau reboot).
  Nợ sản phẩm: playhead chạy trước canvas lúc phát sau seek (lệch tới nhiều giây) → đợt 90.
- **WebKit clip D (Q6)** — KHÔNG fix dứt điểm (F1 0/5, F2 0/5, F3 3/5, F4 blob 2/2 + N1 P6 5/5
  = 7/7, F5 1/5). Hướng tiếp: prefetch blob cho clip proxy nhỏ → đợt 90.
- **G1 (Q7)** — bằng chứng mới, KHÔNG tự đóng; khuyến nghị đóng một phần (30fps-tải, phương án A,
  4 điều kiện) để user quyết. 60fps 75%, cần thêm lần đo.
- **EPERM (Q8 + closing)** — probe v2 loop chết do reboot 13:21:06Z (lần đầu có nguyên nhân rõ
  cho cái chết này); khoảng mù 09:41–11:37Z là không có observer, không phải loop chết.
  Probe #8 ok=2 fail=0. writeFileSync: 102 dòng code (20 là bản copy build output) + 61 mẫu docs;
  async `fs.writeFile(` production: 0 ngoài helper. Cron riêng 10 phút vẫn chờ user quyết.
- **Birefnet trong AppImage mới (Q9)** — K7 không chứa guard P7 nên build lại AppImage full
  (557.008.461 byte, sha 9680cef1…); e2e guard **PASS** (bridge thật, u2net fallback, 17/17 frame).
  Birefnet-general vẫn **0 lần chạy thành công trong gói** — cần cửa sổ yên ≥ 6 GB ~7 phút.
- **Tổng chờ push sau đợt 89: 1984 entry / 232 file batch / 1199 file duy nhất; dict 2516 key.**
  HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 90: xem ROUND89_LIMITS §4 (12 mục — motion blur preview, playhead/canvas sync,
  WebKit clip D blob prefetch, fallback warn keyframes, AppImage mới smoke/orphan, G1, birefnet,
  EPERM probe, TTS 39 CẤM kiểm lại, ci-security 403).

## 19. Cập nhật sau đợt 90 (11/11/2026 — xem docs/PHASE9_ROUND90_LIMITS.md)

- **Chủ đề: preview playback correctness** — 9 luồng R1–R9, tất cả đều về. R2/R8 hoàn
  thành trên đĩa nhưng handoff kết thúc không tới được parent — parent đọc trực tiếp từ
  đĩa và gộp như bình thường. **VM reboot ~15:29Z giữa lượt** (boot 62b088d2 → 0799d357,
  reboot thứ 8 trong ~18h); /tmp bị wipe, dep GStreamer mất; R1/R3 khôi phục và chạy lại.
- **Motion blur + mask preview ĐÃ ĐÓNG (R1)** — hướng (iii) snapshot theo frame video +
  mask 1 lần sau blend: trail = 0 trên 383 khung play, mép sắc như pause (1.2–2.1px),
  tâm bám track ±0.001, blur nội dung thật (gStd 37–83 vs baseline ~112). Click-test O8
  21/21 cả 2 engine.
- **Playhead/canvas sync ĐÃ ĐÓNG (R2)** — đóng băng playhead khi seeking + ở tick bấm play:
  playhead lúc seek xong 0.6/1.1/1.4/4.1 → 0.5 cả 4 biến thể; lag ổn định 0.20/1.53/2.69/
  2.92 → 0.13/0.18/0.46/0.68s. Click-test O8 21/21 cả 2 engine.
- **WebKit clip D blob prefetch ĐÃ ĐÓNG (R3)** — clip D 1.3 MB loop 8/8 pass (baseline 1/3,
  Q6 0/5); ngưỡng chốt **8 MiB**; `buffered.end(0) >= duration` không dự đoán pass
  (7/20 run buffered đầy mà vẫn fail).
- **Fallback warn site keyframes ĐÃ ĐÓNG (R4)** — test mới 49/49 (MAD 0.000); P1 30/30;
  Q4 spot D4/GEQ 46/46.
- **AppImage mới ĐÃ ĐÓNG (R5)** — smoke + orphan PASS 2/2 lần, probe AI 8/8; click-test
  gói thật 8/8 (K7 export MP4 qua UI pass ngay lần 1); u2net spot-check PASS (MOV byte
  giống hệt Q9). Birefnet-general vẫn **0 lần chạy thành công trong gói**.
- **G1 evidence v2 (R6)** — harness sửa xong (phân biệt EPERM vs port conflict, ghi slot
  đóng băng, bọc try/finally); 60fps 3/3 PASS, pool n=11 median 0.940, PASS 9/11 (82%)
  — lần đầu cả ba tiêu chí chặt cùng đạt ở 60fps; 30fps n=28, 82%. **G1 vẫn MỞ** —
  khuyến nghị phương án A có điều kiện, để user quyết. Cửa sổ yên không xuất hiện
  (đợt thứ 5 liên tiếp).
- **EPERM (R7)** — probe #9 ok=2 fail=0, ALIVE; **sóng EPERM ~11:55–12:11Z đã xảy ra
  trong khoảng mù 11:37–14:44Z** — khoảng mù đầu tiên được chứng minh là có chứa sóng.
  writeFileSync 179 dòng, async writeFile production 0 ngoài helper. Cron riêng 10 phút
  vẫn chờ user quyết.
- **Kiểm chứng độc lập (R8)** — cả 4 luồng R1–R4 xác nhận bằng chạy lại (assert A/B/C,
  unit, O8 21/21 cả 2 engine, O2 render 25/25, tsc 0/0, vite build pass); không phát hiện
  lỗi thật nào trong code R1–R4.
- **i18n (R9)** — dict giữ nguyên **2516** (vi=en, 0 mồ côi); 2 nợ văn bản có sẵn
  (TrackPanel hardcode, MaskPanel tham chiếu lặp) để đợt 91.
- **Tổng chờ push sau đợt 90: 2018 entry / 242 file batch / 1223 file duy nhất; dict 2516 key.**
  (34 entry đợt 90 nhưng chỉ +24 file duy nhất — 10 entry trùng file đã stage đợt trước.)
  HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 91: xem ROUND90_LIMITS §4 (12 mục — requestVideoFrameCallback, sawtooth
  WebKit, clip D khoảng 1.3–10 MB, fallback warn, i18n văn bản, G1, birefnet, EPERM probe,
  TTS 39 CẤM kiểm lại, ci-security 403).

## 20. Cập nhật sau đợt 91 (11–12/11/2026 — xem docs/PHASE9_ROUND91_LIMITS.md)
- **Motion blur preview rVFC ĐÃ ĐÓNG (S1)** — pump requestVideoFrameCallback
  vào production; assert A/B/C/D/E 100/100, trail = 0 trên 1626 khung;
  spread baseline tick 29.1 → rVFC 0.0. Combo D (mask+SR+blur) và E
  (feather+blur) khớp lý thuyết. Mép phải 3.6px là pha sub-pixel, không
  sửa code. Nợ còn lại: chi phí tick main-thread (rVFC chỉ capture ~1/3
  frame dưới tải), WebKitGTK rVFC chưa đo pixel, render canonical D/E.
- **Playhead/canvas sawtooth ĐÃ ĐÓNG (S2)** — nguyên nhân: element WebKit
  đứng yên 0,7–1,7 s sau seek trong lúc decoder decode xuôi từ keyframe
  thưa; sửa bằng grace giữ playhead 1500 ms khi resume-stall (chỉ audio
  pause). Re-seek 0/0 (trước 3/4), lag mean 0,15–0,19 s (trước 0,65–0,79
  s). `previewLoop50F2.test.ts` chạy được bằng strip-types: 20/20.
  Click-test O8 21/21 cả 2 engine (S9 chạy thay).
- **WebKit clip D ĐÃ ĐO XONG (S3)** — không có cliff theo kích thước
  (blob eligible 15/20 vs progressive 20/20; loop rút gọn 0/8 vs 8/8);
  fail ở tầng swap pipeline WebKit (qtdemux `atom has bogus size
  570402281` là marker race teardown lúc swap, nổ cả khi chưa gọi
  play()). **Phát hiện mới: src flip-flop blob↔http ~10 Hz trong app
  thật** (29 lần đổi trên cùng element; phát lại sau pause dùng http) —
  nợ ưu tiên đợt 92. Error handler nợ P5 **ĐÃ ĐÓNG** (bad.mp4 → blob →
  error → http 5/5, phát lại 192 frame). Không sửa production.
- **Fallback warn mở rộng ĐÃ ĐÓNG (S4)** — test-only, 60/60; P1 30/30;
  image+mask keyframes, warn trackgeq không track, warn site đúng 1 lần
  khi layer bao trọn clip (không lặp). Đề xuất: dời cổng fail-fast lên
  trước pre-pass.
- **i18n văn bản ĐÃ ĐÓNG (S5)** — TrackPanel dùng key mới
  `motionTrack.title`, MaskPanel xóa tham chiếu lặp; dict **vi=en=2517
  key** (bump pin ở 17 file test). StickerPanel hardcode còn lại để đợt
  92.
- **G1 evidence v3 (S6)** — 60fps n=14, median 0,970×, PASS 12/14
  (86%); 30fps n=30, median 0,935×, PASS 24/30 (80% đúng vạch); lần yên
  60fps đầu tiên (baseline 19,01 fps, 0,99×, n=1). Chuỗi "cổng bị chiếm?"
  cũ trong probe 78f1/79g1 đã sửa; nhánh port-conflict đã kích hoạt bằng
  fail thật, nhánh EPERM vẫn chưa. **G1 vẫn MỞ** — để user quyết.
- **EPERM (S7)** — probe #10 ok=2 fail=0, boot đổi 62b088d2 →
  182a689e; **khoảng mù #9 dài ~168 phút** với 2 reboot đã xác nhận
  (15:29Z và 17:24Z — reboot thứ 8 và 9); 87 phút cuối khoảng mù không
  có bản ghi nào — không kết luận được về sóng. Quét writeFileSync với
  loại trừ chuẩn mới (loại release*/** + build/**): 169 dòng (source 88
  + docs 81); async writeFile production 0 ngoài helper. Cron riêng 10
  phút vẫn chờ user quyết.
- **Birefnet (S8)** — RAM khả dụng chỉ 535–1629 MB (trung vị 740 MB)
  nên **KHÔNG chạy** (cần ≥ 6 GB ~7 phút); vẫn **0 lần chạy thành công
  trong gói**. RAM guard kiểm tra lại vẫn chặn đúng (unit 8/8).
- **Kiểm chứng độc lập (S9)** — cả 6 luồng S1–S6 xác nhận bằng chạy
  lại (assert A–E 100/100, unit, O8 21/21 cả 2 engine, O2 render 25/25,
  tsc 0/0, vite build pass); 1 hồi quy P7 7/8 do literal console mới
  của S1 — parent sửa ở closing (đổi sang tiếng Anh, P7 lại 8/8).
- **Tổng chờ push sau đợt 91: 2071 entry / 252 file batch / 1245 file duy nhất; dict 2517 key.**
  (50 entry đợt 91 nhưng chỉ +21 file duy nhất — 29 entry trùng file đã
  stage đợt trước; closing +3 entry / +1 file duy nhất — LIMITS gộp mới +
  css60 parent sửa ở closing.) HEAD vẫn
  5f548ef8. KHÔNG push.
- Nợ mở cho đợt 92: xem ROUND91_LIMITS §4 (12 mục — flip-flop src
  videoFor ƯU TIÊN, chi phí tick main-thread, canvas stale, cổng
  fail-fast, StickerPanel hardcode, G1, birefnet, EPERM probe, TTS 39
  CẤM kiểm lại, ci-security 403).

## 21. Cập nhật sau đợt 92 (12/11/2026 — xem docs/PHASE9_ROUND92_LIMITS.md)
- **Flip-flop src ĐÃ ĐÓNG (T1)** — latch `srcLatch` trong `media.ts`
  khóa src theo item+want; đổi kind blob↔http 22 → 1/lượt phát
  (upgrade prefetch có chủ đích), lần gán src 23 → 2, phát lại sau
  pause dùng blob 3/3 (trước: http 3/3); unit 25/25, O8 21/21 cả 2
  engine. Nợ còn lại: blob-load flaky ~25% chưa chứng minh giảm nhờ
  fix; cửa sổ bấm phát <400 ms chưa đo.
- **Chi phí tick main-thread ĐÃ ĐÓNG (T2)** — cache canvas alpha mask
  + destination-in; tick B 73–85 ms → 4,5–4,8 ms, C 33–39 ms →
  8,2–9,2 ms; parity pixel MAD=0; assert A–E 100/100; watchdog rVFC
  giết oan đã sửa (đếm miss theo thời gian). Blocker rVFC nay là
  scheduling/capture (ratio 0,56–0,66), không còn là tick.
- **Canvas stale / stall >1500 ms ĐÃ ĐÓNG (T3)** — stall >1500 ms là
  thường gặp do CPU đói, KHÔNG do GOP thưa (GOP 30 stall 2829 ms dài
  hơn GOP 250); sửa bằng trần giữ 5000 ms — 0 re-seek/5 lượt post,
  lag đỉnh 1,5–1,9 s → 0,65–0,85 s (còn lại là frame trình chiếu
  WebKit tụt). rVFC WebKitGTK không bao giờ bắn callback dù
  supported=true. Trần 5000 ms chưa có bằng chứng ngoài đời (chưa
  bắt được stall >1500 ms ở lượt post).
- **Cổng fail-fast trước pre-pass ĐÃ ĐÓNG (T4)** — tách thành hàm
  thuần `checkAdjLayerSplitConflicts` (6 cổng), gọi sớm sau
  validate; S4-F 5,1 s → 0,2–0,3 s, exit 1 + thông điệp + 0 warn giữ
  nguyên; test mới 32/32, S4 60/60, P1 30/30.
- **i18n StickerPanel ĐÃ ĐÓNG (T5)** — key mới `sticker.title`, dict
  **vi=en=2518 key** (bump pin ở 17 file + phát hiện thêm pin
  vi==en 60 → 61 ở 4 file); css60 §8 không có khối StickerPanel nên
  không bump gì thêm. Nợ: nhãn sticker trong
  `packages/video-spec/src/sticker.ts` hardcode tiếng Việt.
- **G1 evidence v4 (T6)** — 5 lần đo mới đều PASS; pool 60fps n=17,
  median 0,990×, PASS 15/17 (88%); 30fps n=32, median 0,945×, PASS
  26/32 (81%); lần yên 30fps PASS đầu tiên. **G1 vẫn MỞ** — để user
  quyết. Nhánh EPERM của E1 đã kích hoạt bằng fail thật (LD_PRELOAD
  shim — vite chết vì không ghi được file tạm `*.timestamp-*.mjs`);
  regex EADDRINUSE đã sửa khớp cả thông báo vite.
- **Birefnet (T7)** — RAM khả dụng max 1707 MB (27,8% ngưỡng 6 GB)
  nên **KHÔNG chạy**; vẫn **0 lần chạy thành công trong gói**. RAM
  guard vẫn chặn đúng (unit 8/8, biên 6143/6144 MB). **Quyết định
  parent: từ đợt 93 chỉ thử lại khi có tín hiệu RAM thay đổi.**
- **EPERM (T8)** — probe #11 ok=2 fail=0, boot đổi 182a689e →
  14e10da9; **khoảng mù #10 dài ~180 phút** với 1 reboot đã xác nhận
  (19:22:48Z — reboot thứ 10, **không ai ghi nhận lúc xảy ra**);
  62 phút cuối khoảng mù không có bản ghi nào. Quét writeFileSync
  chuẩn mới: 186 dòng (source 92 + docs 94); async writeFile
  production 0 ngoài helper. Cron riêng 10 phút vẫn chờ user quyết.
- **Kiểm chứng độc lập (T9)** — cả 8 luồng T1–T8 xác nhận bằng chạy
  lại (O2 25/25, O8 21/21 cả 2 engine, tsc 0/0, vite build pass);
  không phát hiện lỗi thật nào, không sửa production. **Phát hiện
  mới: VM reboot lần 11 ~21:35:58Z** (→ 09e8d2af…), cũng không ai
  ghi nhận lúc xảy ra; khoảng mù #11 bắt đầu 20:38:56Z.
- **Tổng chờ push sau đợt 92: 2124 entry / 262 file batch / 1265 file duy nhất; dict 2518 key.**
  (51 entry đợt 92 nhưng chỉ +19 file duy nhất — 32 entry trùng file đã
  stage đợt trước; closing +2 entry / +1 file batch / +1 file duy nhất —
  LIMITS gộp mới; gap analysis đã stage từ các đợt trước.) HEAD vẫn
  5f548ef8. KHÔNG push.
- Nợ mở cho đợt 93: xem ROUND92_LIMITS §4 (12 mục — rVFC
  scheduling/capture, đối chứng blob sau fix T1, trần 5000 ms, G1,
  birefnet chỉ thử khi RAM đổi, EPERM probe #12, TTS 39 CẤM kiểm lại,
  ci-security 403).

## 22. Cập nhật sau đợt 93 (12/11/2026 — xem docs/PHASE9_ROUND93_LIMITS.md)
- **Flip-flop src đối chứng (U2)** — sau fix T1: flip-flop trong app thật 0
  (10/10 run); blob-load flaky 42% không giảm — vấn đề riêng, không do
  latch. Kết luận fix T1 đứng.
- **Canvas stall ngoài đời (U3)** — bắt được 8 stall 1,6–3,9 s, playhead
  đứng yên Δ=0,000 trong mọi stall — trần 5000 ms giữ đúng. Phát hiện
  mới: trần chỉ bảo vệ stall ĐẦU TIÊN sau mỗi lần seek hoàn tất; stall
  sau đó (không seek mới) không được giữ — nợ đợt 94. rVFC WebKitGTK
  0 callback (phát 20 s, 81 frame, vẫn 0) dù supported=true.
- **Fail-fast đo tiết kiệm (U4)** — cổng sớm tiết kiệm stabilize 51–78 s
  ở clip 60 s; thứ tự lỗi đổi đúng dự báo T4 (cổng báo trước, cùng
  exit 1, không MP4) — đổi có chủ ý, không phải hồi quy. Test đo mới
  141/141; parent chạy lại 141/141 sau khi tái tạo fixture bản sao cũ
  theo đúng cách U4 ghi.
- **i18n sticker data layer ĐÃ ĐÓNG (U5)** — 5 `sticker.cat.*` + 244
  `sticker.item.*` qua `labelKey`, dict 2518 → 2767 key lá mỗi bên;
  css60 thêm khối checkI18n StickerPanel (59 → 60 check, xanh 60/60).
  r6 báo thừa 249 key vì key dùng động ngoài cây quét — parent sửa
  closing: thêm `sticker.cat.`/`sticker.item.` vào `dynamicPrefixes`
  (theo tiền lệ `scene.phase.` đợt 65); r6 lại PASS.
- **G1 evidence v5 (U6)** — 60fps pool n=22 median 0,960× PASS 20/22
  (91%); 30fps pool n=35 PASS 28/35 (80%). **G1 vẫn MỞ — chờ user quyết.**
- **Harness O8/Q5 (U7)** — sửa nhãn kỳ vọng S7, seek GOP 30/60/250
  35/36; quyết định KHÔNG sửa `seek.test.ts`; bẫy probe v1 đã bắt +
  sửa trước khi kết luận.
- **EPERM probe #12 (U8)** — ok=2 fail=0, boot 88ebef2e; khoảng mù #11
  ~182 phút, reboot #12 23:33:21Z không ai ghi nhận; quét writeFileSync
  206 dòng (source 96 + docs 110); RAM 1,1 GB.
- **U1 rVFC pump/scheduling CHƯA XONG** — instrumentation (`window.__vcutRvfcPump`,
  `rvfcCaptureFrame` → decision string) + harness
  `probe93u1-rvfc-pump.cdp.mjs` + parity feather/invert MAD=0 đã có trên
  đĩa, đo pump chưa có baseline sạch (VM đói CPU); không LIMITS, không
  batch, không stage — nợ ưu tiên đợt 94. U9 kiểm chứng độc lập chưa
  chạy (chờ U1).
- **Tổng chờ push sau đợt 93: 2170 entry / 270 file batch / 1286 file duy nhất; dict 2767 key.**
  (43 entry đợt 93 + closing 3 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 94: xem ROUND93_LIMITS §4 (11 mục — U1 pump/scheduling
  ƯU TIÊN, U9 kiểm chứng, trần stall chỉ giữ lần đầu, G1, birefnet chỉ
  thử khi RAM đổi, EPERM probe #13, TTS 39 CẤM kiểm lại, ci-security 403).

## 23. Cập nhật sau đợt 94 (12/11/2026 — xem docs/PHASE9_ROUND94_LIMITS.md)
- **rVFC pump (V1)** — không sửa code: stack fix đã có từ đợt 93; eps
  +1µs là fix quyết định (duplicate 0,33→0); register-first trung tính
  lúc yên (A/B mới: cap 0,958–0,986 cả hai chiều); memo tiết kiệm ~3,2
  ms/dup tick. Phát hiện mới: assert2 BÁC giả thuyết mislabel của guard
  (gStd spread B 45,5→45,4 sau khi siết guard) — nợ điều tra ring-fill.
- **Trần stall re-arm (V2)** — đã sửa + đo lại: re-arm kích hoạt ngoài
  đời nhưng vào trễ ~1 tick rAF; stall 2+ ngắn (300–600 ms) vẫn để
  playhead +0,37–0,67 s, có thể tự kích drift re-seek. Nợ GIẢM, CHƯA ĐÓNG
  HẲN. O8 21/21 cả 2 engine, playheadHold90R2 41/41.
- **Blob-load flaky (V3/V3b)** — chẩn đoán xong, KHÔNG sửa production:
  68 case, không biến thể nào sửa được (prod 46%, blob-direct tốt nhất
  67%, prog 100%). Phát hiện mới: qtdemux `bogus size` là byte thật của
  file tại đúng offset 2 MiB; moov ở cuối file (không faststart); 0 lần
  "blob" trong GST log. Fail ⇒ bogus, bogus ⇏ fail. Đề xuất đợt sau:
  test clip faststart (ưu tiên cao nhất) + retry-play sau fallback.
- **rVFC WebKitGTK (V4)** — xác nhận lần 3: 0 callback (4/4 chuỗi).
  Fast-path "rVFC im lặng" (1000 ms) + memo engine (2 clip): cửa sổ mù
  từ ~2–3 s/clip xuống ~1,0–1,5 s, từ clip 3 không còn mù. Parity pixel
  CHƯA chứng minh được (MAD bị pha sọc chi phối) — cần harness đồng bộ
  theo frame.
- **G1 evidence v6 (V5)** — 60fps pool n=27 median 0,960× PASS 25/27
  (93%); 30fps pool n=38 median 0,950× PASS 31/38 (82%); chân yên 30fps
  median 0,805 lần đầu vượt 0,75 nhưng PASS chỉ 4/8 (50%). **G1 vẫn MỞ
  — parent giữ mở, phương án A (đóng một phần) để user quyết khi về.**
- **EPERM probe #13 (V6)** — ok=2 fail=0, boot 9968199e; khoảng mù #12
  ~178 phút; reboot #13 02:34:42Z. Quét writeFileSync 222 dòng, khớp tuyệt
  đối với phương pháp cũ (222+25=247). **Reboot #14 ~03:25Z (boot
  0597b689) rơi vào khoảng mù #13** — khoảng mù #13 vẫn mở, chờ probe #14
  đợt 95. EPERM không tuyên bố đã hết.
- **Harness canvasOk (V7)** — tiêu chí mới (sawChange ≥0,01) bắt sống
  artifact ngoài đời (WebKit GOP250 trial 4 → already-at-target); 33/36
  confirmed; kết luận U7/T3 còn đứng.
- **Kiểm chứng độc lập (V8)** — tsc web+desktop 0, vite build PASS, toàn
  bộ test xanh (41/41, 25, 20/20, 9/9, 20/20, css60/61 60/60, Audit P7
  8/8, orphans 17/17, r6 PASS 2767 key, U4 141/141), O8 21/21 cả 2 engine
  chạy lại trên cây gộp; marker V2+V4 đầy đủ trong preview.tsx.
- **Reboot #14** giết V3 giữa MATRIX3; resume không tác dụng → spawn V3b
  làm tiếp từ đĩa. V2/V4 "interrupted" nhưng file đã đủ trên đĩa → tính
  hạ cánh.
- **Tổng chờ push sau đợt 94: 279 batch / 2192 entry / 1302 file duy nhất
  (đợt 67–94).** HEAD vẫn 5f548ef8. KHÔNG push. Dict i18n 2767 key.
- Nợ mở cho đợt 95: xem ROUND94_LIMITS §4 (9 mục — test clip faststart
  ƯU TIÊN, retry-play sau fallback, parity rVFC theo frame, gStd spread,
  re-arm trễ 1 tick, G1 chờ user, EPERM probe #14, harness Xvfb/canvasOk,
  đứng yên TTS 39/birefnet/ci-security 403).

## 24. Cập nhật sau đợt 95 (12/11/2026 — xem docs/PHASE9_ROUND95_LIMITS.md)
- **Blob faststart (W1)** — giả thuyết moov BỊ BÁC: clip faststart 4/12 = 33% vs baseline 5/12 = 42%, prog 12/12; bogus size vẫn đúng bằng 4 byte tại offset 2 MiB dù moov đã ở đầu file. Phát hiện mới: 1 fail không có bogus (`failed to find fragment defaults`) — "fail ⇒ bogus" nay chỉ 31/32.
- **Retry-play (W2)** — đã sửa media.ts + đo: MATRIX A BEFORE loose 6/12 / strict 3/12 → AFTER loose 10/12 / strict 8/12; cứu trực tiếp 2/3 case error-event. Hồi quy xanh hết (unit 7/7, tsc 0, build PASS, flip-flop app 0/10, O8 21/21 cả 2 engine). Stall lặng + error đến muộn vẫn mở.
- **Parity frame (W3)** — frame sắc nét ĐÃ CHỨNG MINH (chr×chr MAD 0,0; chr×wk MAD đúng 1,9 mọi frame — chênh chuyển đổi decoder); blur KHÔNG kết luận được bằng MAD (cùng-engine đã 43–47). Cửa sổ mù clip 1–2 ~1,2–2,0 s (tới ~3,6 s khi tick ~1/s); từ clip 3 memo ~0,1 s (xác nhận lần 4). Kill oan/memo oan Chromium 0 lần. Nghi rAF throttle WebKit ĐÃ BÁC.
- **gStd spread (W4)** — ring-fill BÁC; "61" không phải mức vật lý (median nhóm bimodal); cơ chế thật: presented frame lệch currentTime ở bước vẽ. **Phát hiện mới: preview đa số tick blend {K-1,K,K} thay vì tmix đúng {K-2,K-1,K} — blur yếu hơn render ~2,25× độ tương phản còn lại** (nợ ưu tiên đợt 96). Parity MAD spec F = 0, spec C = 0 (memo không đổi pixel).
- **Re-arm (W5)** — hướng (a) vận tốc BÁC bằng đo (giữ oan 17–47%); hướng (b) ân hạn drift re-seek 1 tick ĐÃ SỬA + ĐO (kích hoạt ngoài đời 1 lần, chưa hủy được re-seek nào). Nợ giảm, chưa đóng. Phát hiện phụ: chu kỳ stall dài → nhảy dt rAF 1,0–1,7 s/tick → drift re-seek → seek kẹt 6–9 s.
- **G1 evidence v7 (W6)** — 60fps pool n=32 median 0,970 PASS 30/32 (94%), luật (b) PASS lần 6 liên tiếp; 30fps pool n=45 median 0,950 PASS 36/45 (80%) — đúng vạch, biên 0; chân yên 30fps 0 mẫu mới (vẫn 4/8 = 50%). **Đính chính: cần 12 lần PASS liên tiếp (16/20), không phải 4 lần như V5 nói sai.** **G1 vẫn MỞ — parent giữ mở, phương án A hỗn hợp, quyết thuộc user.**
- **EPERM probe #14 (W7)** — ok=2 fail=0, boot 06a92916; khoảng mù #13 ~180' chứa 2 reboot (#14 ~03:25Z, #15 05:17:47Z). Quét writeFileSync 245 dòng/86 file, khớp tuyệt đối với chuẩn cũ (245+25=270). RAM max ~1,68 GB, mẫu thấp nhất 695 MB — birefnet KHÔNG chạy. EPERM không tuyên bố hết.
- **Harness (W8)** — cả 5 nợ đều sửa + kiểm chứng: lock display Xvfb (test 8/8), hiệu chuẩn ngưỡng canvasOk tự động (0,012, 6/6 confirmed), T2 đếm re-arm (seek 21/21, 10/10 dưới tải), probe V3 hết trùng tên case, O8 mkdir trước check fixture (21/21 cả 2 engine).
- **Kiểm chứng độc lập (W9)** — tsc web+desktop 0, vite build PASS, toàn bộ test xanh (41/41, 17/17, 25, 21/21, 9/9, 20/20, css60/61 60/60, Audit P7 8/8, orphans 17/17, r6 PASS 2767 key, U4 141/141), O8 21/21 cả 2 engine chạy lại trên cây gộp; batch 33/33 read-back OK. **Reboot #16 ~07:25–07:28Z (boot adcef40a)** giết lượt verify giữa bước U4 — chạy lại xanh.
- **Tổng chờ push sau đợt 95: 289 batch / 2228 entry / 1330 file duy nhất (đợt 67–95).** HEAD vẫn 5f548ef8. KHÔNG push. Dict i18n 2767 key.
- Nợ mở cho đợt 96: xem ROUND95_LIMITS §4 (9 mục — giả thuyết 2 MiB mới, blend sai tập ghost ƯU TIÊN, retry-play mở rộng, re-arm ân hạn, blur parity, G1 chờ user, EPERM probe #15, harness, đứng yên TTS 39/birefnet/ci-security 403).

## 25. Cập nhật sau đợt 96 (12/11/2026 — xem docs/PHASE9_ROUND96_LIMITS.md)
- **Reboot #18 09:24:17Z (boot 04b83831)** giữa lượt — giết X1/X9 sạch, X4/X5/X6 resume ngắn rồi mới dừng; spawn 5 luồng nối tiếp X1b/X4b/X5b/X6b/X9b, tất cả hạ cánh. **EPERM probe #15 (X7)** — ok=2 fail=0, boot a3a13d5a; khoảng mù #14 (~181') chứa reboot #16 + #17 (08:01:15Z chính xác từng giây). Quét writeFileSync 269 dòng/94 file, khớp tuyệt đối lần 3 liên tiếp. RAM thấp nhất từng ghi 507 MB — birefnet KHÔNG chạy. EPERM không tuyên bố hết.
- **Ghost-blend (X2)** — sửa xong ở mức median: preview nay blend đúng tmix {K-2,K-1,K}, median gStd 37,5 mọi case B–E; cụm double-count 84 còn ~19–25% (capture mislabel, presented lệch). **Retry-play (X3)** — 7/7 error-event cứu ở wall 20 s; blob-lỗi không proxy 2/8 → 6/8; watchdog stall lặng cứu 1 ca thật; "pass marginal" là do cửa sổ đo. **Blob 2 MiB (X1/X1b)** — bogus tái hiện 8/12 với probe nhẹ (đúng giá trị W1), 0/36 với probe GST nặng — hiệu ứng thiết bị đo; cơ chế vẫn mở, fail⇒bogus 39/42 = 93%.
- **Re-arm (X4/X4b)** — kẹp dt 0,35 s/tick BỊ BÁC bằng đo; ân hạn 1 tick 0 lần hủy / 3 lần kích hoạt; trần 5000 ms 0 bằng chứng nhả. **Blur parity (X5/X5b)** — cụm D = pair cách-2 {K-2,K} (0,305–0,307); mô hình sóng vuông harmonic khớp A/B/D ±0,006; **QUYẾT ĐỊNH: KHÔNG triển khai tự hồi memo** (0 arm oan, 2 thí nghiệm âm tính); phát hiện mới: watchdog đóng băng (element kẹt ph=3,033 chặn frame-advance) + zombie pump. **G1 (X6/X6b)** — chân yên 30fps 6 mẫu mới đều PASS → n=14 median 0,955 PASS 10/14 (71%), cần 6 PASS yên liên tiếp nữa (16/20); pool 30fps 44/53 = 83% biên 2; pool 60fps 35/37 = 95%; metric M2 đã cài song song, G5 vẫn là chuẩn chính thức — **G1 VẪN MỞ, chờ user quyết**. **Harness (X8)** — thresholdNoiseLimited chứng minh không gặp được; runner media.* thống nhất (run-media-tests.mjs); register-first chưa kết luận được; 4 case MATRIX-r1 không khôi phục được.
- **Kiểm chứng độc lập (X9b)** — tsc web+desktop 0, vite build PASS, toàn bộ test xanh (44/44, 19/19, 25, 21/21, 9/9, 20/20, css60/61 60/60, Audit P7 8/8, orphans 17/17, r6 PASS 2767 key, U4 141/141), O8 21/21 cả 2 engine; đối chiếu số headline KHỚP hết (4 lỗi doc nhỏ đã đính chính trong LIMITS gộp).
- **Tổng chờ push sau đợt 96: 299 batch / 2269 entry / 1356 file duy nhất (đợt 67–96, gồm closing).** HEAD vẫn 5f548ef8. KHÔNG push. Dict i18n 2767 key.
- Nợ mở cho đợt 97: xem ROUND96_LIMITS §4 (13 mục — 2 MiB, ghost double-count, lỗi muộn >3 s, re-arm 0 CANCELLED, blur fix-3, watchdog đóng băng, memo c2 blind 0,4–0,5 s, G1 chờ user, EPERM probe #16, zombie pump, harness, đứng yên TTS 39/birefnet/ci-security 403).

## 26. Cập nhật sau đợt 97 (12/11/2026 — xem docs/PHASE9_ROUND97_LIMITS.md)
- **Reboot #19 11:30:25Z chính xác từng giây (boot d8dc09fe)** ngay trước lượt; không reboot mới trong lượt. **EPERM probe #16 (Y8)** — ok=2 fail=0; khoảng mù #15 (~177') đã đóng, chứa reboot #18 + #19. Quét writeFileSync 294 dòng/100 file, khớp tuyệt đối lần 4 liên tiếp. Phát hiện mới: 33 dòng "sóng EPERM đã tắt" là dương tính giả (in mặc định của launcher). EPERM không tuyên bố hết.
- **Blob 2 MiB (Y1)** — tách biến thành công: logging GST nặng ức chế bogus (cùng matrix X1, chỉ đổi log nhẹ đi thì bogus về 8/18); tải vô tội. Cơ chế tinh chỉnh: pull nhảy +2 MiB trong vài atom đầu, không nhất thiết atom 1 (2 giá trị bogus mới xác minh byte trực tiếp trong file). Fail⇒bogus 56/63 = 89%.
- **Ghost double-count (Y2)** — giả thuyết BỊ BÁC: cụm 84 là triple đúng {K−2,K−1,K} đo ở pha sọc K mod 6 ∈ {3,4} (mô phỏng pixels thật khớp 39,7 pha thấp / 88–90 pha cao; triple(P) khớp 86,2% vs double-count 10,5%). Fix X2 đúng, chỉ sai diễn giải mức 84. Residual mở 13,8% (71/515 mẫu ngược mức dù nhãn hoàn hảo) — ứng viên race pixels lúc capture, chưa chứng minh.
- **Retry-play lỗi muộn (Y3)** — ĐÃ ĐÓNG: error muộn tái hiện trực tiếp (8,4–17,3 s sau play), retry cứu 8/8 (LATEBAD4) và 4/4 (LATEBAD8, error tới 17,29 s). Không sửa production.
- **Re-arm (Y4)** — analyzer nới Δct < 1,5 frame bắt thêm 1 ca (b1); ca b5 vẫn sót do bộ lọc seeking-window ±600 ms. Đuôi ân hạn 97Y4 sống 11 tick, 2 tick grace-bật, CANCELLED vẫn 0. **Phát hiện mới: detector mù với stall "bò"** (element tăng ~1 frame/tick, 0,055× realtime → drift re-seek, kẹt seek 1,63 s).
- **Watchdog đóng băng (Y5)** — freeze-kill đã implement nhưng 0 lần bắn trong 17 lượt (advance-path cũ luôn bắn trước); fault-injection giữ pause thất bại 8/8. Memo c2 blind 13/14 lượt ≈ 0 ms, 1/14 = 485 ms do element khởi động chậm.
- **Blur parity (Y6)** — D fix-3 xác nhận ~1% (3/457 = 0,7%, giảm từ 13%); B-band wk tách được ở mức quần thể (pair 15 vs dc 21, n=36) nhưng không sạch từng mẫu; D tồn tại trên WebKit (n=3/107) — lần đầu có bằng chứng.
- **Zombie pump (Y7)** — ĐÃ SỬA + ĐÃ ĐO: kill-on-element-reuse, zombie capture +27/lần đổi clip → 0–1 (giảm ~98–100%), pixel parity đứng.
- **Harness (Y9)** — cap mainDraws/draws 400→2000 + tóm tắt timing live (trước mất 62% draws đầu lượt); timeout 2 fetch E1 còn lại (fault-injection: treo 45 s → exit 2 trong 20,6 s chẩn đoán đúng); nhiễu slot máy yên do lượng tử hoá ±1 draw — verdict 1 lần dùng được khi mean cách ngưỡng ≥0,15–0,2.
- **Kiểm chứng độc lập (Y10)** — tsc web+desktop 0, vite build PASS, toàn bộ test xanh (50/50, 19/19, 25, 21/21, 9/9, 20/20, css60/61 60/60, Audit P7 8/8, orphans 17/17, r6 PASS 2767 key, U4 141/141), O8 21/21 cả 2 engine; đối chiếu số headline KHỚP hết. **Phát hiện: 5/9 batch đợt 97 là newline-delimited thay vì NUL — parent đã chuẩn hoá sang NUL, verify read-back 33/33.**
- **Tổng chờ push sau đợt 97: 310 batch / 2304 entry / 1379 file duy nhất (đợt 67–97, gồm closing).** HEAD vẫn 5f548ef8. KHÔNG push. Dict i18n 2767 key.
- Nợ mở cho đợt 98: xem ROUND97_LIMITS §4 (11 mục — 2 MiB basesrc, ghost residual race pixels, re-arm stall "bò", watchdog freeze in vivo, blur B-band từng mẫu, zombie clip-kế-không-blur, EPERM probe #17, harness /json/list 450 s, G1 chờ user, đứng yên TTS 39/birefnet/ci-security 403).

## 27. Cập nhật sau đợt 98 (12/11/2026 — xem docs/PHASE9_ROUND98_LIMITS.md)
- **Blob basesrc (Z1)** — giả thuyết "basesrc:5 nhẹ" BỊ BÁC: basesrc:5
  ỨC CHẾ bogus. Logging nặng vẫn là yếu tố ức chế; cần 1 run bogus có
  `basesrc` log để phân biệt — vẫn mở.
- **Ghost residual (Z2)** — race pixels lúc capture BỊ BÁC làm cơ chế
  chính của residual 13,8%; kết luận mức gStd Y2 vẫn đứng. KHÔNG sửa
  production.
- **Re-arm stall bò (Z3)** — bò KHÔNG reset đồng hồ đóng băng 300 ms;
  hook mới `__vcutResumeFreezeCrawl98Z3` + luật bò trong
  `nextResumeFreezeRearm`. Định nghĩa đóng băng theo tốc độ đã làm.
- **Watchdog freeze ĐÃ ĐÓNG (Z4)** — freeze-kill ("no-callback-frozen")
  ĐÃ BẮN in vivo 2 lần bằng deepstub (lần đầu; trước đó 0 lần trong
  17 lượt). Kết luận: pipeline WebKitGTK/GStreamer tự lật `paused`
  về false — cần xác nhận thêm bằng log/strace.
- **Blur B-band (Z5)** — B-band wk n=61, D ~1%; định nghĩa "định"
  trong brief KHÔNG thỏa, ghi rõ không ép kết luận. 15/16 lượt wk
  ≈ 0 ms, 1/16 = 485 ms.
- **Zombie clip-kế-không-blur ĐÃ DIỆT (Z6)** — hook kill ở draw path +
  syncMedia: zombie capture/đổi clip biên blur→noblur +6 → 0; độ trễ
  kill +3 ms / 0 ms / +1 ms (so với +124–224 ms của Y7 fix2). Tàn dư
  0–1 capture straggler tiền-seek, không rút ngắn thêm được.
- **EPERM probe #17 (Z7)** — ok=2 fail=0, boot 65bc5fb6; khoảng mù
  #16 ĐÃ ĐÓNG (reboot #20 13:24:41Z). Quét writeFileSync: KHÔNG còn
  đường ghi production nào chưa nối helper.
- **Harness (Z8)** — quy tắc verdict: mean 5 tỉ lệ ≥ 0,9 PASS chắc,
  ≤ 0,6 FAIL chắc, vùng xám 0,6–0,9; slot `/json/list` 5 s; bucket
  trừ `playT0rel`. test-preview-engine.sh SỬA XONG (tsc include +
  sed rewrite + mktemp -d): 354 assertions pass.
- **G1 evidence v9 (Z9)** — chân yên 30fps TIẾN SÁT ĐÍCH: 4 mẫu yên
  mới đều PASS → 14/18 (78%), còn thiếu 2 PASS liên tiếp. **G1 vẫn
  MỞ — chờ user quyết.**
- **Z10 kiểm chứng độc lập CHƯA XONG** — U4 dry-run checks xong
  (C2c-mkf4-dry OLD 3,986s → NEW 0,192s), O8 chromium có fixture,
  webkit còn trống; không LIMITS, không batch — nợ đợt 99.
- **Tổng chờ push sau đợt 98: 2337 entry / 320 file batch / 1401 file duy nhất; dict 2767 key.**
  (31 entry đợt 98 + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 99: xem ROUND98_LIMITS §4 (13 mục — Z10 kiểm chứng,
  2 MiB basesrc, ghost residual, re-arm CANCELLED, watchdog `paused`,
  blur B-band, zombie straggler, G1, EPERM probe #18, TTS 39 CẤM kiểm
  lại, ci-security 403).

## 28. Cập nhật sau đợt 99 (13/11/2026 — xem docs/PHASE9_ROUND99_LIMITS.md)
- **2 MiB basesrc (A1)** — ghi đĩa BỊ LOẠI là yếu tố ức chế (run tmpfs
  bogus 2/12 = Z1 ghi đĩa); giá trị bogus mới 541230788 có log basesrc;
  thành phần đặt ra 2 MiB ĐÃ XÁC ĐỊNH: `SMALL_MEDIA_RESOURCE_MAX_SIZE`
  trong `WebKitWebSourceGStreamer.cpp`. Điểm nối chính xác vẫn mở.
- **Ghost residual (A2)** — cơ chế MỚI ở đường tick: snapshot đường
  tick bị gán sai nhãn hệ thống (chỉ 119/251 = 47,4% sạch); đường rVFC
  sạch 867/872 = 99,4%; dự đoán gStd theo cửa sổ thật khớp ±5 ở
  127/133 = 95,5%; lệch curPix giàu ở outlier có ý nghĩa (Fisher
  p = 0,0031).
- **Re-arm CANCELLED (A3)** — CANCELLED hẹp = 0 là đúng theo thiết kế;
  phân loại rộng ARM-HELD đếm được 1 ca chặn seek thật/18 lượt; chuỗi
  grace bị chặn 8, lọt 0; arm-vì-bò lần đầu ngoài đời 4 ca. Nợ mới:
  f4 tail-expiry (burst +1,16 s lừa luật tail, seek kẹt 5,5 s+).
- **Watchdog `paused` ĐÃ ĐÓNG (A4)** — đính chính Z4: lật `paused` là
  do app tự gọi `play()` từ `syncMedia` mỗi tick qua wrapper instance
  (r2 17/17, r3 11/11 flip ghép 1:1); giả thuyết pipeline tự lật BỊ BÁC.
- **Blur B-band (A5)** — B-band wk n=96, vẫn không khe bimodal;
  ringSize=1 ⇒ pair-like đứng 7/7; strip ghost wk lần đầu: 25/39
  mislabel (64%) nhưng không tách pair/dc; D chr 1,3% (sàn ~1% đứng);
  r7 vẫn mở.
- **Zombie straggler ĐÃ ĐÓNG (A6)** — check clip-active trong
  `rvfcCallback`: fault-injection phơi zombie +25, check chặn về 0
  (bắt đúng 1 straggler frameIdx 89); 0/13 biên có capture tiền-seek
  lọt cửa sổ clip kế.
- **G1 evidence v10 (A7)** — chân yên 30fps 17/21 = 81%, mốc 16/20
  đạt, chuỗi 15; pool 30fps 57/66 (86%), 60fps 44/47 (94%); phương án
  A đủ điều kiện 4 chân nhưng **G1 vẫn MỞ — chờ user quyết**.
- **G1 metric (A9)** — đồng thuận G5/M2 63/69 (91,3%), 6 ca bất đồng
  đều G5 PASS → M2 FAIL; khuyến nghị giữ G5 đến khi khung 16/20 khép
  rồi chuyển M2 — nhưng dưới M2 khung 16/20 không đạt được (tối đa
  15/20). Quyết metric + đóng G1 thuộc về user.
- **EPERM probe #18 (A8)** — ok=2 fail=0, boot 99338d31; khoảng mù
  #17 ĐÃ ĐÓNG (reboot #21 + #22 17:25:39Z); quét writeFileSync 356
  dòng/115 file chênh 0 lần thứ sáu liên tiếp.
- **A10 kiểm chứng độc lập** — 9/9 về đủ, cây gộp toàn xanh (tsc 0,
  vite build PASS, 24/24 suite, test-preview-engine.sh 354 assertions,
  O8 21/21 cả 2 engine); đối chiếu headline 9/9 KHỚP (4 đính chính nhỏ).
- **Tổng chờ push sau đợt 99: 332 batch / 2365 entry / 1426 file duy nhất.**
  (25 entry đợt 99 + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 100: xem ROUND99_LIMITS §4 (12 mục — G1 + metric chờ
  user quyết, 2 MiB điểm nối, ghost đường tick, f4 tail-expiry, blur
  B-band/D r7, zombie khe early-return, EPERM probe #19, TTS 39 CẤM
  kiểm lại, ci-security 403, harness Space-toggle).

## 29. Cập nhật sau đợt 100 (13/11/2026 — xem docs/PHASE9_ROUND100_LIMITS.md)
- **2 MiB (B1)** — điểm nối chưa chứng minh được nhưng thu hẹp: splice
  đúng 2.097.152 byte; giả thuyết pause/resume 2019 BỊ BÁC hai lần
  (code không còn `SMALL_MEDIA_RESOURCE_MAX_SIZE`, thay bằng
  HIGH/LOW_QUEUE_THRESHOLD 20 MiB / 2 MiB; runtime 0 dòng stop/restart
  trong 4 run bogus); `webkitwebsrc.create` loại trừ; handoff
  typefind↔webkitwebsrc là điểm nối hẹp nhất. Đính chính A1 §3.1.
- **Ghost tick (B2)** — cơ chế trễ trong-tick BỊ BÁC ở dạng mạnh; thủ
  phạm là phase jitter presented-frame↔currentTime (±1, thỉnh thoảng
  ±2); fix A2 không hiệu quả.
- **Tail-expiry (B3) — FIX ĐÃ LAND** — luật đuôi chỉ đếm lần tăng
  LÀNH (rate ≤ 1,5× playbackRate); offline 65/65; live 6 lượt
  WebKitGTK: f4-like 0/6, burst chặn 3 lần ngoài đời, grace chặn 6 /
  lọt 0, ARM-HELD §6 = 2. Chưa triệt để: burst trải gap rAF dài
  (> ~770 ms) vẫn lọt (2 ca g2/g5, không gây hại) — cửa sổ f4 còn mở
  cho burst dài-gap đáp xa (> ~1,5 s).
- **Blur (B4)** — B-band n=96→132, không bimodal; curPix đường
  thường 317/317 tick, presented ±1 ở ~58% tick; D chr 12/783 = 1,5%
  sàn ~1%; r7 vẫn mở.
- **Zombie early-return (B5)** — khe early-return ngoài đời KHÔNG
  quan sát được (37 biên, 0 ca); đối chứng dương bắn 6/6.
- **EPERM probe #19 (B6)** — ok=2 fail=0, boot 66fb273d; khoảng mù
  #18 ĐÃ ĐÓNG (reboot #23 20:30:14Z); reboot #16 kẹp ~4' chưa chốt;
  writeFileSync chênh 0 lần thứ bảy. **Reboot #24 ~21:41:50Z
  (boot 66fb273d → aa3f2b67)** — giết poller B9 cũ, khởi động lại
  21:42Z. VM hiện tại boot aa3f2b67.
- **Harness (B7)** — Space-toggle fix land, 9/9 E1 0 abort; quy tắc
  slot-tải-đầu cài; chân yên 30fps còn 16/20 = 80% vẫn đủ mốc.
- **play()/set_state (B8)** — cơ chế hấp thụ ở WebKit (5 cửa chặn)
  + đính chính A4 (0 dòng already in state → WebKit chưa gọi thừa);
  thí nghiệm quyết định: GST log ghi MỌI lần gọi `set_state`.
- **B9 kiểm chứng độc lập CHƯA XONG** — poll dừng 21:52Z ở 7/8
  (B8 hạ cánh sau đó); không LIMITS, không batch — nợ đợt 101.
- **Tổng chờ push sau đợt 100: 2390 entry / 341 file batch / 1442 file duy nhất; dict 2767 key.**
  (23 entry đợt 100 + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 101: xem ROUND100_LIMITS §4 (12 mục — B9 kiểm chứng,
  G1 metric G5/M2, 2 MiB handoff typefind, ghost jitter, re-arm
  burst dài-gap, blur B-band, zombie early-return, EPERM probe #20,
  TTS 39 CẤM kiểm lại, ci-security 403).

## 30. Cập nhật sau đợt 101 (13/11/2026 — xem docs/PHASE9_ROUND101_LIMITS.md)
- **2 MiB (C1) — CHƯA XONG** — chỉ có dữ liệu đo thô (webKitWebSrcCreate
  3236 dòng, typefind 327 dòng; queue-size [32, 128, 1069987, 2070341,
  2111301, 2139973]); không LIMITS, không batch — nợ đợt 102.
- **Ghost residual (C2) — KHÔNG LAND FIX** — fix hiệu chuẩn pha F5
  BỊ BÁC bằng counterfactual (không có hằng số δ* nào); mọi kết luận
  nhân quả chỉ đo trên Chromium.
- **Re-arm drift-gate (C3) — FIX ĐÃ LAND** — luật đuôi thứ hai: lần
  tăng chỉ đếm khi element đáp trong ngưỡng drift 0,35 s; offline
  75/75; live 12 lượt: f4-like 0/12, drift-gate chặn 44 lần ngoài đời,
  burst-rate chặn thêm 31 lần, ADV2 với drift vượt 6/7 → 0/5, grace
  chặn 11 / lọt 0, ARM-HELD 1/12. Đánh đổi: tuổi đuôi trung vị +45%
  (1339 → 1942 ms), 2 đuôi đóng do trần 5000 ms. Rate không phân biệt
  được g5 (lành max ~1,2× vs g5 1,14×) — điểm đáp mới phân biệt được
  (g2 +1,07…+1,60; g5 +0,93…+1,40 vs ngưỡng 0,35). CANCELLED hẹp
  h11-7863 là artifact pause-seek của probe.
- **Blur (C4) — D floor TRIỆT bằng pad-oldest** (post-fix md5
  07f56792; chr r17–r19 + wk r25–r26). B-band không phải do 2 mode —
  chốt (tách 1,66σ). Không chạy blind (giữ nguyên kết luận A5).
- **Zombie early-return (C5) — ĐÃ QUAN SÁT ngoài đời qua seek-across.**
  R5 có sibling sửa preview.tsx giữa lượt (md5 94ee64c0 → a6e34691)
  nhưng kết luận không phụ thuộc vào sửa đó (R3 build sạch cho cùng
  mẫu 12/12). Harness mới probe101c5-frame-parity.mjs.
- **EPERM probe #20 (C6)** — ok=2 fail=0; khoảng mù #19 ĐÃ ĐÓNG.
  **Giờ từng giây reboot #16 KHÔNG chốt được** (đã thử nguồn mới) —
  chờ parent/user quyết. **Reboot #25 ~23:52:16Z** (boot aa3f2b67 →
  3a12a7d3).
- **G1 (C7)** — thêm chứng cứ M2 16/20 phụ thuộc khung; KHÔNG tự đóng
  G1, không đổi metric — **G1 vẫn MỞ, chờ user quyết metric G5/M2.**
- **Harness (C8)** — đường retry/fallback Space-toggle bắn thật +
  N10 chờ-trạng-thái chiều PHÁT; đường retry/fallback N10 chiều PHÁT
  chưa bắn thật (44/44 toggle "space"); vòng lặp fallback thứ 2 của
  E1 chưa bắn thật.
- **C9 kiểm chứng độc lập CHƯA XONG** — poll dừng 01:22Z ở 6/8
  (C4 hạ cánh sau đó); O8 webkit trống — nợ đợt 102.
- **Tổng chờ push sau đợt 101: 2412 entry / 350 file batch / 1455 file duy nhất; dict 2767 key.**
  (19 entry đợt 101 + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 102: xem ROUND101_LIMITS §4 (12 mục — C1 2 MiB + C9
  kiểm chứng, G1 metric G5/M2, ghost F5, re-arm drift-gate, blur r7,
  zombie seek-across, EPERM probe #21, TTS 39 CẤM kiểm lại,
  ci-security 403).

## 31. Cập nhật sau đợt 102 (13/11/2026 — xem docs/PHASE9_ROUND102_LIMITS.md)
- **2 MiB (D1) — KẾT LUẬN MỚI** — điểm nối hẹp nhất nay là luồng byte
  blob→qtdemux trước pull đầu của qtdemux (tái hiện qua instance
  webkitwebsrc+typefind mới tinh; không tái hiện trên http thuần cùng
  file; chuỗi event typefind:5 giống hệt nhau giữa bogus và sạch).
  Ức chế bởi logging TRACE xác nhận định lượng: C1 0/4 bogus vs nhẹ
  16/18 (Fisher p = 0,0021 tính lại bởi D9; D1 ghi 0,0029). Disassembly
  CHỐT cả hai ngưỡng: HIGH 0x1400000 (20.971.520), LOW 0x200000
  (2.097.152). Đính chính summary-c1.txt: 0 lần stop/restart thật
  ("download already active" 1065–1089 lần/run). Không seek nào tới
  đúng 2 MiB. Bước duy nhất còn lại: probe ghi nội dung byte của
  buffer đầu tiên qtdemux nhận (B1 §8.4).
- **Ghost residual (D2) — tap rVFC độc lập F7 KHÔNG LAND** — tap sửa
  được anchor (gap hậu flip trung vị 1,0, |gap|≤3 94–96%) nhưng không
  sửa được clean/spread (52,4%/53,8% < bar 70%) vì nhãn snapshot lấy
  từ currentTime; production đã revert hoàn toàn (0 marker D2). Hướng
  mới: F8 relabel snapshot bằng anchor tap (CHƯA thử) + siết ngưỡng
  tươi anchor 500ms → ~50ms. Mọi kết luận nhân quả chỉ đo trên
  Chromium.
- **Zombie early-return (D3) — FIX ĐÃ LAND** — kill đồng bộ khi
  playhead nhảy + guard skip-seeking + gate tạo pump (ngưỡng 0,35 s):
  0 skip-clip-inactive ở 6 lượt post-fix (114 biên seek-across + 23
  biên thường); đối chứng tắt owner-kill vẫn 0/12. Lib mới
  `rvfcClipWindow.ts` + test 21/21. Nợ mới: đường tick vẽ 1 frame
  stale ở tick đầu sau nhảy (d3x2, cap frame 90).
- **Blur (D4) — 0 cap D mới trên 566 cap; r7 VẪN MỞ** nhưng cơ chế đã
  bị pad-oldest trung hòa (11/566 cap nhãn gap 6 rơi vào dải A, nội
  dung gap 2). D floor post-fix gộp 0/1433 (Fisher p=9,5e-09; CI trên
  0,209%). Cửa sổ mù wk KHÔNG thu hẹp được (c1 median 1152ms đúng
  dải Y5; đuôi tải tới 8124ms) — giữ nguyên kết luận A5; không chạy
  blind.
- **Re-arm drift-gate (D6) — GIỮ NGUYÊN, KHÔNG SỬA** — D6-A
  "stable-offset close" BỊ BÁC bằng dữ liệu (0/24 đuôi đạt tiêu chí
  ổn định-lệch; "drift giống nhau" là điểm đáp của burst lặp lại).
  Baseline mới i1–i12: f4-like 0/12, gate chặn 59, burst 21, 0 seek
  kẹt. Hạ trần 5000 → 3000 ms không làm. Tuổi đuôi trung vị
  velocityTicks h 1509 ms → i 2400 ms (khác phiên đo, không kết luận
  hồi quy).
- **EPERM probe #21 (D5)** — ok=2 fail=0; khoảng mù #20 ĐÃ ĐÓNG
  (2 reboot #25 23:51:21Z + #26 02:12:10Z, cả hai đều có giờ từng
  giây). **Đính chính giờ reboot #25: 23:51:21Z** (không phải
  ~23:52:16Z như §30 đã ghi — đó là giờ C8 ước lượng). WFS chuẩn mới
  431 dòng / 132 file, đối chiếu chéo 456, chênh 0 (lần thứ tám liên
  tiếp). **Giờ từng giây reboot #16 KHÔNG chốt được** (kẹp ~4') —
  chờ parent/user quyết. Cron riêng 10 phút vẫn chờ user quyết.
- **Harness (D7)** — N10 retry/fallback chiều PHÁT + E1 vòng fallback
  thứ 2 ĐÃ bắn thật (lần đầu): N10 retry lật sau 69ms, N10 fallback
  lật sau 158ms, E1 FB2 lật sau 112ms; 0 abort (4 lần fault, 44 slot,
  88 toggle). Code fault-injection đã land vào harness thật (E1
  md5 mới 4ba1d86c…, N10 9ca985cd…). O8 21/21 cả 2 engine (S5 Δx
  chr 0,112 / wk 0,194 — khớp đợt 101).
- **G1 (D8)** — thêm chứng cứ M2 16/20 phụ thuộc khung; KHÔNG tự đóng
  G1, không đổi metric — **G1 vẫn MỞ, chờ user quyết metric G5/M2.**
  Khung (a) tối đa 15/20; (b) trượt 19/20; (c) tích lũy 23–24/29
  (lần yên tiếp theo là quyết định); khung mới (f) 10/10, (g) hậu-A9
  11/11; (h) không kiểm được; (i) đệm 3 lần FAIL liên tiếp. Pool v12:
  30fps n=91, 60fps n=59; đồng thuận G5/M2 112/118 (94,9%).
- **D9 kiểm chứng độc lập — XONG** — 8/8 luồng về đủ; cây gộp xanh
  (tsc 0/0, vite build PASS 6,28s, 26/26 mục suite exit 0 lần đầu,
  354 assertions); O8 21/21 cả 2 engine ngay lần đầu trên cây gộp
  cuối (đã có fix D3). Không reboot trong đợt (boot 249407b6 suốt).
- **Tổng chờ push sau đợt 102: 2436 entry / 361 file batch / 1474 file duy nhất; dict 2767 key.**
  (20 entry đợt 102 + D9 1 entry + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 103: xem ROUND102_LIMITS §4 (12 mục — G1 metric
  G5/M2, 2 MiB probe byte-buffer, ghost F8, zombie tick stale-frame,
  re-arm, blur r7 + cửa sổ mù, EPERM probe #22, harness, birefnet,
  TTS 39 CẤM kiểm lại, ci-security 403).

## 32. Cập nhật sau đợt 103 (13/11/2026 — xem docs/PHASE9_ROUND103_LIMITS.md)
- **G1 (E1) — LẦN YÊN QUYẾT ĐỊNH ĐÃ PASS** — E1 run1 yên (baseline
  23,19 fps) G5/M2 0,91× PASS; khung tích lũy (c) nay 24–25/30 =
  80,0%–83,3%, kịch bản xấu đúng mốc 80,0% (lần đầu tiên). Khung (b)
  trượt 19/20, (f) 10/10, (g) hậu-A9 12/12; khung (a) vẫn trần cứng
  15/20. Đồng thuận G5/M2 126/132 (95,5%); quy luật "G5 ≥ 1,00 không
  bao giờ lật" mở rộng 66 lần, 0 lần lật. **G1 vẫn MỞ, chờ user quyết
  metric G5/M2** — câu hỏi mới Q5: mốc 80,0% đúng chóc có đủ không,
  hay cần đệm (1 lần yên FAIL nữa kéo kịch bản xấu xuống 24/31 =
  77,4%)? G4 flake lần đầu tiên (E1 run8, harness 9/10).
- **2 MiB (E2) — CHỨNG MINH BẰNG NỘI DUNG BYTE: SPLICE TRONG ADAPTER
  webkitwebsrc PULL** — typefind chỉ proxy (26/26 pull spliced trùng
  khớp từng mili-giây); luồng byte `[0..3179] ++ [2 MiB+3179 .. EOF]
  ++ [42821..]`, đoạn sai duy nhất 39.642 byte; đường PUSH sạch
  (2.280 buffer); 1.728 pull đếm lại, 0 OTHER; ức chế bởi TRACE xác
  nhận lại (nhẹ 10/10 vs TRACE 0/4, p=0,0010; gộp p=1,5e-06). Vì sao
  đúng 2.097.152 VẪN MỞ (0 stop/restart trong 36 run gộp) + cơ chế
  dataReceived/refill nào tạo đoạn sai (catch-22: TRACE ghi được thì
  ức chế bogus).
- **Ghost residual (E3) — F8 KHÔNG LAND** — relabel bằng anchor tap
  đúng cơ chế khi anchor tươi (78–92% clean) nhưng headline trượt
  bar vì độ phủ anchor thấp (34% → 49,5% clean; 74% → 58,1%; 97%
  hậu flip → 89,5%). Đã revert hoàn toàn (marker E3 = 0 trên cây
  cuối). Hướng còn đứng: F8b nhãn bằng frame anchor THÔ khi anchor
  cũ (CHƯA thử) + F6' pixel-verified skipLatest cho WebKit (chỉ
  phác). Quy ước mới: báo PHÂN BỐ spread, không báo median (median
  là artifact lưỡng đỉnh).
- **Zombie tick stale-frame (E4) — FIX v2 ĐÃ LAND** — gate mở rộng
  (overCount ≥ 1 mà seek không phát): 0 stale tick 0/21 + 0 stale
  draws 0/46; kill latency trực tiếp trung vị 0,10–0,20 ms (nhanh
  hơn C5 gián tiếp 23–123 ms ~100–600×). Test mới
  driftConfirmSkip103E4 12/12. Nợ mới: gate (b) có thể giữ canvas
  đóng băng tới trần grace 5000 ms nếu playhead không bị giữ (chưa
  quan sát được).
- **Re-arm fail-open nested (E5) — FIX ĐÃ LAND** — nested: gate 0 →
  42/8 lượt, đóng ADV2 khi drift vượt 7 → 0, f4-like 2 → 0. Phẳng
  không hồi quy luật (gate 87/12 lượt, 0 đóng ADV2). **NỢ MỚI: tỉ lệ
  đóng-trần phẳng load4 TĂNG MẠNH post-fix** — 20 ca đóng trần kèm
  resync / 9 lượt load4 (vs 0/6 pre-fix), tuổi đuôi trung vị phẳng
  2102 → 5013 ms; tất cả 20 ca kiểm tay đều là đóng trần (không phải
  ADV2) nhưng nguyên nhân decoder đóng băng lâu hơn (2,1–3,4 s vs
  0,8–1,1 s) CHƯA xác định. Không trích "phẳng f4-like 0/12" mà
  không kèm phân tích này. D6-A vẫn bị bác (0/21 phẳng + 0/10 nested
  post-fix).
- **Blur (E6) — r7 VẪN MỞ** — strip-confirm không chốt được nội dung
  gap 2 (0/13 xác nhận; 2/13 bác gap 2; 3/13 bác cả hai; 7/13 mơ hồ);
  giới hạn cứng strip 48-bit (chỉ 4 mẫu phân biệt / 90 frame — đo pha
  cuộn, không pin được 1 frame); đính chính D4 §1.2 (11 ca A
  ringSize=3/pool=2 → KHÔNG có pad-clone; 0,449 cũng là dự đoán
  triple liên tiếp khỏe mạnh). D floor post-fix gộp 0/1640 (Fisher
  p=1,43e-09; CI trên 0,183%). B-band: chỉ còn mẫu hình c0 giàu
  pair-like hơn c2 (17,1% vs 6,1%, p=0,0042, post-hoc — cần kiểm
  chứng đăng ký trước). Cửa sổ mù wk KHÔNG thu hẹp được — giữ nguyên
  kết luận A5; không chạy blind.
- **EPERM probe #22 (E7)** — ok=2 fail=0; **khoảng mù #21 CHƯA ĐÓNG
  HOÀN TOÀN** (lỗ 17'23" 03:57:19Z–04:14:42Z có thể chứa đúng 1
  reboot trung gian — khoảng mù đầu tiên kể từ #8 không đóng được
  bằng lập luận sàn). Reboot #27 05:26:18Z (khoảng cách #26→#27 =
  3h14'08", dài nhất từng ghi). WFS chuẩn mới 443 dòng / 132→138
  file, đối chiếu chéo 468, chênh 0 (lần thứ chín liên tiếp). **Giờ
  từng giây reboot #16 KHÔNG chốt được** (kẹp ~4') — chờ parent/user
  quyết. Cron riêng 10 phút vẫn chờ user quyết.
- **Harness (E8)** — D6 recheck KHỚP HOÀN TOÀN (chạy lại 2 script
  quantify, diff rỗng — E9 chạy lại độc lập lần nữa, diff rỗng; nợ
  này nay ĐÃ ĐÓNG hoàn toàn); mơ hồ N10 fallback lần 2 ĐÃ TRIỆT
  (DELAY=20000: fallback #1 lật sau 88ms, redispatch hẹn ~9,1 giây
  sau và đã bị cleanup hủy); keydown chậm tự nhiên VẪN MỞ (22 lần
  chạy / 638 toggle, wait chậm nhất 804ms, 0 retry/fallback); O8
  21/21 cả 2 engine (S5 Δx chr 0,112 / wk 0,194 — khớp đợt 101/102);
  0 abort (5 lần fault gộp D7, 55 slot, 110 toggle).
- **Reboot #28 lúc 06:56:44Z (giữa đợt 103, E9 ghi)** — 9576eac3 →
  8c1c5131, khoảng cách #27→#28 = 1h30'26"; giết probe s2 đang chạy
  của E5 + làm gián đoạn runtime/poller E9 (khôi phục 06:58:31Z, E5
  vẫn về đủ 8/8). Chu kỳ nay 28 lần / ~58h39' ≈ 2h06'/lần. Reboot
  tiếp theo dự kiến ~09:03Z. RAM cuối đợt xuống ~690 MB (E5 gặp
  WebKit "Target crashed" ở RAM ~1,5 GB — lỗi môi trường).
- **E9 kiểm chứng độc lập — XONG** — 8/8 luồng về đủ; cây gộp xanh
  (tsc 0/0, vite build PASS 7,80s, 27/27 mục suite exit 0 lần đầu,
  354 assertions — thêm test mới driftConfirmSkip103E4 12/12; đếm
  đúng rvfcClipWindow102D3 là 13+21=34 test, D9 ghi 21 là shorthand);
  O8 21/21 cả 2 engine ngay lần đầu trên cây gộp cuối (đã có fix
  E4+E5). Không reboot trong lúc verify (boot 8c1c5131).
- **Tổng chờ push sau đợt 103: 2460 entry / 371 file batch / 1494 file duy nhất; dict 2767 key.**
  (21 entry đợt 103 + E9 1 entry + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 104: xem ROUND103_LIMITS §4 (12 mục — G1 metric
  G5/M2 + Q5 mới, 2 MiB dataReceived shim, ghost F8b/F6', zombie trần
  skip, re-arm đóng-trần phẳng load4 tăng, blur r7 + B-band c0,
  EPERM probe #23 + mù #21 chưa đóng, harness keydown tự nhiên + G4
  flake, birefnet, TTS 39 CẤM kiểm lại, ci-security 403).

## 33. Cập nhật sau đợt 104 (13/11/2026 — xem docs/PHASE9_ROUND104_LIMITS.md)
- **GỘP MỘT PHẦN:** chỉ 3/9 luồng về đủ (F2/F6/F7). F5 phân tích +
  đo live xong nhưng chờ watcher A/B RAM cao; F1/F3/F4/F8/F9 chỉ có
  dữ liệu đo thô — nợ đợt 105. **Đính chính báo cáo worker:** F7 đã
  về đủ (probe #23, mù #22 đóng hoàn toàn) — worker nói chưa về là
  sai; F5 có LIMITS đã viết — chỉ còn chờ A/B RAM cao.
- **2 MiB (F2) — HOÀN THÀNH:** refill tạo đoạn sai đã xác định —
  dataReceived của Range cuối cùng trước pull đầu tiên (R5/R6);
  adapter webkitwebsrc vô tội ở thời điểm pull; đoạn sai nằm trong
  cache push-phase nội bộ typefind. Shim không ức chế bogus (10/12
  run). Vì sao đúng 2.097.152 vẫn mở (run4 seek thật tới đúng
  2097152 lần đầu trong 48 run gộp).
- **Re-arm (F5) — CHƯA XONG, phân tích xong:** tái hiện độc lập
  đúng 20/20 ca CAP; đóng băng TRONG LÚC ĐUÔI MỞ là chỉ số phân biệt
  (pre-fix 1179 ms vs post-fix 4847/4901 ms — toàn bộ pipeline
  stall, "decoder đói"); RAM là biến phân tách mạnh nhất (pre-fix
  2173–2843 MB 0 CAP/6 lượt; post-fix 1471–2344 MB 20 CAP/10 lượt);
  load không phân tách; E5 fix không thể là nguyên nhân trên phẳng
  (chứng minh cấu trúc); E4 fix vẫn là nghi phạm chưa loại được
  (confound hoàn hảo); E3 CDP là confound thứ ba. Đo live máy yên:
  5/6 lượt hợp lệ, 14 CAP / 5 lượt = 2,80 CAP/lượt — máy yên KHÔNG
  làm giảm CAP, giả thuyết "tải song song" BỊ BÁC. Đang chờ watcher
  A/B RAM cao (f6r gop250 + f7 gop30 khi RAM ≥ 2400 MB). Reboot #29
  ~08:56Z (boot 8c1c5131 → cff65e89) cắt ngang driver lần 1.
- **Blur (F6) — HOÀN THÀNH:** r7 VẪN MỞ — strip dài hơn bị bác
  offline (stimulus tuần hoàn ~5 frame); đo timing đăng ký trước:
  0/13 ca A content gap 2, 8/10 ca rVFC content gap đúng 6 — bác
  mạnh "nội dung gap 2", đề xuất stimulus không tuần hoàn. B-band c0
  không đủ bằng chứng (p=1,0, power 15%). D floor gộp 0/1767
  (CI trên 0,170%).
- **EPERM (F7) — HOÀN THÀNH:** probe #23 + khoảng mù #22 ĐÃ ĐÓNG
  HOÀN TOÀN (05:40:24Z → 08:39:02Z, 2h58'38", đúng 2 reboot, giờ
  chính xác từng giây).
- **Tổng chờ push sau đợt 104: 2470 entry / 375 file batch / 1503 file duy nhất; dict 2767 key.**
  (8 entry đợt 104 + closing 2 entry.) HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 105: xem ROUND104_LIMITS §4 (11 mục — F1/F3/F4/
  F5/F8/F9, G1 metric G5/M2, 2 MiB, ghost F8b, blur r7, EPERM
  probe #24, TTS 39 CẤM kiểm lại, ci-security 403).

## 34. Cập nhật sau đợt 105 (13/11/2026 — xem docs/PHASE9_ROUND105_LIMITS.md)

- **Ghost (G1) — HOÀN THÀNH, F8 LAND:** `preview.tsx` ca378bbf → f0b9e496 (tap rVFC độc lập + gate anchor tươi 50 ms + relabel snapshot). Bar đăng ký trước đạt cả hai chân: B 70,8% / B2 76,1% / B3 87,2% vs baseline A 45,7%; flip C 73,6% vs D 48,6%. **F8b BỊ BÁC** (rawAnchor 70,4% ≈ fallback 70,0%, xa tap 97,9%) — nấc rawAnchor đã gỡ. Tự đính chính phương pháp: số "rawAnchor 0/30 clean" cũ là artifact dedup (21/47 cặp bị gán sai labelSrc); các LIMITS distinct cũ chịu bias này ở breakdown theo labelSrc. Caveat: headline clean phụ thuộc độ phủ (tải nặng E3 phủ 34% → clean ~50%); spread đuôi lỏng max ~75 không đổi.
- **Zombie (G2) — HOÀN THÀNH:** zombie Δ = 0 ở 12/12 biên × 2 lượt, 0 capture clip lẻ 24/24, pixel parity đứng. Gate (b) vẫn chưa quan sát được: spread 0/267 gap, dense-freeze 0/19. Đính chính drawsgap cũ: 62 ca "UNHELD+SKIPS" rút về 0 (dph thổi phồng bởi seek-landing). Draws-check 8/46 "stale" danh nghĩa → 0/46 sau giám định. Đề xuất guard bracket ≤300 ms.
- **Harness (G3) — HOÀN THÀNH:** D6 recheck khớp lần 3 (3 diff rỗng), 0/24 đuôi đạt tiêu chí ổn định-lệch, D6-A vẫn bị bác. **G4 flake TÁI HIỆN** (F1 E1 run2 FAIL G4, 11,50 s): gộp mọi lần E1 2/21 (9,5%). Keydown chậm tự nhiên vẫn mở: 40 lần chạy / 1122 toggle, wait chậm nhất 1004 ms, 0 retry/fallback/abort. O8 được F9 bao phủ (21/21 cả 2 engine trên cây ca378bbf).
- **Re-arm (G4) — HOÀN THÀNH (finalize F5):** watcher A/B RAM cao KHÔNG bắt được cửa sổ — 50 check × 45 s, 0/50 đạt ngưỡng 2.400.000 kB (cao nhất 2.301,7 MB, thiếu ~42 MB); `run-f5-hiram.sh` chưa chạy lần nào, 0 lượt f6r/f7. LIMITS F5 đã điền xong §10b. Bài học: chạy watcher NGAY sau reboot, trước mọi driver khác. A/B RAM cao vẫn mở; RAM vẫn là nghi phạm số 1.
- **G1 decision (G5) — HOÀN THÀNH:** kiểm chứng lại số F1 khớp 100% (khung (c) 26–27/32, xấu nhất 81,25%; đồng thuận 140/146). Khuyến nghị M2 + khung (c), đóng G1 có điều kiện tự mở lại nếu 1 lần yên FAIL tương lai. **G1 vẫn mở — chờ user quyết metric G5/M2** (6 câu hỏi Q1–Q6 trong file quyết định).
- **2 MiB (G6) — HOÀN THÀNH:** 2097152 nằm giữa sample 187 (không phải ranh giới file); seek/Range tới đó không phải điều kiện cần (0/8 run, 5/5 bogus vẫn splice đúng 2097152). Hằng số 2 MiB duy nhất: `queue2.max-size-bytes = 2097152` — chưa chứng minh nhân quả. Typefind scan URI không extension: 40 lần đọc trước caps vs 1 lần với đuôi `.mp4`. Probe phân biệt: **blob-direct KHÔNG giảm bogus** (first-atom 2/3 vs 2/3, p=1,0) — swap http→blob bị bác làm nguyên nhân.
- **Blur (G7) — HOÀN THÀNH:** **r7 ĐÓNG với giả thuyết "nội dung gap 2"** — stimulus không tuần hoàn mới cho strip nhận diện gần hoàn hảo (MAD 0,4 chr / 1,7 wk); 5/5 sự kiện blend phân biệt content gap == label gap 6, 0 ca content gap 2. Phát hiện: `blendTick.ringLast` là `ringPrev` khi `skippedLatest=1` (tương quan 100%). B-band c0: 4/41 vs 1/36, p=0,22 — chưa đạt bar, còn thiếu 74+79 B-cap. D floor gộp 0/2041 (CI trên 0,147%).
- **EPERM (G8) — HOÀN THÀNH:** probe #24 ok=2 fail=0; mù #23 ĐÃ ĐÓNG HOÀN TOÀN (08:39:02Z→11:38:22Z, 2h59'20", đúng 3 reboot). **Đính chính lớn: 11:26:40Z là reboot #31, không phải #30; #30 = 10:54:53Z; sàn reboot mới 31'47".** Hệ quả: mù #22 mức tin cậy HẠ (chỉ còn bằng chứng hoạt động, cửa sổ lý thuyết ≤30 s) — chờ user quyết giữ "đóng" hay "đóng có điều kiện". Quét writeFileSync chênh 0 lần thứ 11 liên tiếp. Dự báo #32 ~13:28:49Z.
- **Verify (G9) — HOÀN THÀNH:** 8/8 về đủ; cây gộp XANH (tsc 0/0, vite build PASS 6,19 s, 27/27 suite exit 0, test-preview-engine 354 assertions, O8 21/21 cả 2 engine trên cây đã land F8 f0b9e496, Δx khớp từng chữ). Đối chiếu headline 8/8 KHỚP.
- **Tổng chờ push sau đợt 105: 2492 entry / 387 file batch / 1523 file duy nhất** (đợt 67–104: 2473/377/1506; đợt 105: 17 entry luồng + closing 2 entry). HEAD vẫn 5f548ef8. KHÔNG push.
- Nợ mở cho đợt 106: xem ROUND105_LIMITS §4 (13 mục — G1 + mù #22 chờ user quyết, A/B RAM cao, 2 MiB queue2, zombie gate (b), blur A/B-band, ghost độ phủ + sửa comment rawAnchor, G4 flake, EPERM probe #25, birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security 403, release gate).

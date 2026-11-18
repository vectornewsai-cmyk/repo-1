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

## 35. Cập nhật sau đợt 106 (13/11/2026 — xem docs/PHASE9_ROUND106_LIMITS.md)

- **Reboot #33 phá sàn:** gap #32→#33 chỉ 19'07" (sàn cũ 31'47"); #32 = 14:31:52Z, #33 = 14:50:59Z. Reboot cắt ngang khiến chỉ H5/H6/H9 về đúng hạn; H1/H2/H3/H4/H7 về muộn bằng late merge từ dữ liệu thô; H8 mất trắng. Bài học: chia lượt probe dài thành lượt nhỏ + lưu sớm + đóng băng file production trước khi probe.
- **Re-arm (H1) — VẪN MỞ:** watcher 4 check, trigger ĐẠT ở check 4 (RAM 2.425.576 kB, load 3,98); f6r 3 CAP, f7 2 CAP — nhưng cả 2 lượt đều LOẠI vì H5 sửa `preview.tsx` giữa lượt → 0 lượt A/B hợp lệ.
- **2 MiB (H2) — VẪN MỞ:** 3/3 run lỗi ở `page.evaluate` (browser đóng trước khi media chạy, WebKitWebProcess vắng mặt); GST log 0 byte nên "0 chuỗi queue2" vô nghĩa về chứng cứ — không có bằng chứng queue2 theo hướng nào; H2EXT/H2C8 + mitigation `.mp4` chưa đo.
- **Zombie (H3) — VẪN MỞ:** y1 seek-across 23/23 (driver đã sửa); zombie Δ=0 ở 12/12 biên; capture clip lẻ 0/12. **Kill latency trực tiếp lần đầu đo được: n=12, median 0,20 ms** (chỉ seek lẻ/clip blur). Gate (b) vẫn chưa quan sát được (lượt thứ 5 liên tiếp). Confound: y1 đo trên cây đổi giữa lượt (md5 e5e1d292 → ced42efd).
- **Blur (H4) — VẪN MỞ:** B-band c0 5/72 vs c2 2/54, Fisher p=0,3545 (tệ đi so với p=0,22); còn thiếu c0 43 / c2 61 B-cap. D floor 0/2371. Cụm A stripes không đo được bằng strip (feasibility FAIL); weights [1/3,1/3,1/3] không giải thích g≈0,44.
- **Ghost (H5) — HOÀN THÀNH:** sửa 6 comment "0/30 clean" sai trong `preview.tsx` (f0b9e496 → ced42efd, chỉ comment); analyzer distinct sửa theo (label, pix, labelSrc) hết bias (rawAnchor B 0/11 → 20/31 = 64,5%). **Flip-leg đo lại trên cây land KHÔNG đạt bar dưới tải nặng** (C2 68,5%, C2b 63,0% vs bar ≥70%) — verdict phụ thuộc tải, land F8 không bị lật; cần đo lại lúc máy yên.
- **Harness (H6) — HOÀN THÀNH:** E1 run4–10 7/7 PASS, 0 flake mới; gộp 2/28 = 7,1%; harness đã thêm log chẩn đoán enhance giữa G3→G4. Keydown chậm gộp 49 lần/1342 toggle, max 1004 ms. Đính chính giờ reboot #29 trong LIMITS G3 (08:56:39Z đúng).
- **EPERM (H7) — HOÀN THÀNH:** probe #25 ok=2 fail=0. **Mù #24 KHÔNG ĐÓNG HOÀN TOÀN** — lỗ không-bản-ghi 2h03'11" (12:28:41Z→14:31:52Z); số thứ tự #32/#33 là tạm thời. Hệ quả sàn mới: mù #22 cửa sổ lý thuyết nay ≤78 s (trước ≤30 s) — vẫn chờ user quyết. Quét writeFileSync chênh 0 lần thứ 12 liên tiếp. Dự báo #34 ~16:51:58Z.
- **Verify (H9) — HOÀN THÀNH:** 2/8 về đúng hạn; cây gộp XANH (tsc 0/0, vite build PASS 8,74 s, 27/27 suite exit 0, test-preview-engine 354 assertions, O8 21/21 cả 2 engine trên cây ced42efd). Đối chiếu headline H5/H6 KHỚP toàn bộ.
- **Production đổi đợt này (đúng 1 file):** `apps/web/src/preview.tsx` (H5 sửa comment, f0b9e496 → ced42efd).
- **Tổng chờ push sau đợt 106: 2513 entry / 396 file batch / 1540 file duy nhất** (đợt 67–106; đợt 106: 19 entry luồng + closing 2 entry). HEAD vẫn a7308ee9. KHÔNG push.
- Nợ mở cho đợt 107: xem ROUND106_LIMITS §4 (14 mục — G1 + mù #22 chờ user quyết, re-arm, 2 MiB, zombie gate (b), blur B-band + cụm A, ghost flip-leg lúc máy yên, G4 flake dưới tải nặng, EPERM probe #26 + mù #25, birefnet 0 lần, TTS 39 CẤM, ci-security 403, release gate, quy trình chia lượt nhỏ + đóng băng production).

## 36. Cập nhật sau đợt 107 (13–14/11/2026 — xem docs/PHASE9_ROUND107_LIMITS.md)

- **Đợt đầu tiên từ đợt 105 không có reboot cắt ngang: 9/9 luồng về đủ đúng hạn, 0 late merge, 0 mất.** Reboot #34 vẫn chưa xảy ra tới 19:04:11Z (boot 63a52041 từ 14:50:59Z) — gap #33→#34 >3h14'08", phá trần dải dự báo H7 lần đầu. Phối hợp tải mới (nhóm yên đo trước, nhóm nặng chờ 3 cờ) hoạt động một phần — nhưng có lỗi cờ: I1 tạo cờ ngay sau C3, luồng nặng tràn vào giữa lượt lặp C3b.
- **Ghost (I1) — FLIP-LEG ĐÓNG:** C3 đạt bar lúc máy yên 81,6% (80/98) vs D 48,6%; verdict H5 "flip-leg phụ thuộc tải" xác nhận cả hai chiều; land F8 không bị lật. C3b 61,4% là lượt nhiễm tải, không bác C3 — cần chạy lại lúc máy yên. Spread đuôi lỏng max ~75 vẫn mở.
- **Re-arm (I2) — TIẾN TRIỂN LỚN:** lần đầu 2/2 lượt A/B hợp lệ (f8r 1 CAP, f9 3 CAP; 2,00 CAP/lượt vs baseline 2,80) — nhánh "RAM bị loại" theo tiêu chí đăng ký trước, kèm caveat treatment RAM không giữ trong cửa sổ đo (trung vị 1182 MB lúc tải-nền-bật). Bước tiếp theo: A/B tắt E4.
- **2 MiB (I3) — TIẾN TRIỂN LỚN:** nguyên nhân lỗi H2 đã tìm ra — thiếu `GST_PLUGIN_PATH` (lỗi môi trường probe, không phải lỗi sản phẩm). Queue2 HIỆN DIỆN (7,6–7,8k dòng/run, ring-buffer-max-size=2097152, sau typefind trước parsebin) nhưng nhân quả chưa chứng minh (0/3 bogus). H2EXT + mitigation `.mp4` đã đo 1 run mỗi loại; H2C8 chưa chạy.
- **Zombie (I4) — TIẾN TRIỂN:** y3 23/23 seek trên cây đóng băng (không confound build); zombie Δ=0 ở 12/12 biên; kill blur median 0,20 ms lặp lại y1; **kill clip không-blur ĐÓNG bằng đo + đọc code** (kill entry không thể tồn tại cho clip không-blur theo thiết kế). Gate (b) vẫn chưa quan sát được (lượt thứ 6); state100 dày chỉ đạt một phần (median gap 56 ms vs interval 10 ms — main thread là nút thắt).
- **Blur B-band (I5) — VẪN MỞ:** gộp c0 7/83 vs c2 3/57, Fisher p=0,3584 (gần như không đổi so với 0,3545); còn thiếu c0 32 / c2 58. Chỉ thêm 19 B-cap — đói dữ liệu do sóng tải 26–28 + ENOSPC vite crash (retry cứu đủ). D floor gộp 0/2429.
- **Blur cụm A (I8) — VẪN MỞ:** mô hình harmonic BỊ BÁC bằng tính trực tiếp (0/75 triple stripes thuần vào band [0,40, 0,50]); E6 chưa chứng minh/bác. Stimulus mới đạt cổng F1 offline (MAD 30,9/46,6) nhưng probe đói dữ liệu (load tới 27,9; 2 sự kiện, 0 trong band A'). Phát hiện mới: nhãn lệch hệ thống dưới tải (presented trễ trung vị −4 frame). Lệch g triple +0,029 giữ nguyên.
- **Harness (I6) — VẪN MỞ:** E1 tải nặng 0 flake / 6 lần hoàn thành (run14 chết trước G4 do harness timeout); gộp 2/34 = 5,9%. Keydown chậm kỷ lục mới 2197 ms (gộp 55/737/1474). G3→G4 kéo dài 4,00–8,30 s dưới tải.
- **EPERM (I7) — MÙ #25 ĐÓNG HOÀN TOÀN:** probe #26 ok=2 fail=0; mù #25 (3h00'42") đúng 1 reboot (#33). Mù đầu tiên đóng hoàn toàn kể từ mù #23. Dự báo #34 trượt ≥48'24" (lượt thứ 3 liên tiếp lệch >48 phút) — mô hình dự báo cần làm lại. Quét writeFileSync chênh 0 lần thứ 13 liên tiếp. Mù #26 bắt đầu 17:40:22Z.
- **Verify (I9) — HOÀN THÀNH:** 8/8 headline KHỚP 100% (tính lại độc lập); cây gộp XANH (tsc 0/0, vite build PASS 7,48 s, 27/27 suite exit 0, test-preview-engine 354 assertions, O8 21/21 cả 2 engine trên cây ced42efd).
- **Hạ tầng mới:** ENOSPC inotify watchers (63747) là điểm nghẽn khi nhiều vite song song — cân nhắc tăng ở cấp hệ thống.
- **Production đổi đợt này: 0 file** (preview.tsx giữ nguyên ced42efd cả đợt).
- **Tổng chờ push thật sau đợt 107: 19 batch / 42 entry / 41 file duy nhất + 1 file oversize** (đợt 106: 9/21/21; đợt 107: 9/19/19; closing 107: 1/2/1 mới). HEAD vẫn a7308ee9. KHÔNG push.
- Nợ mở cho đợt 108: xem ROUND107_LIMITS §4 (16 mục — G1 + mù #22 chờ user quyết, A/B tắt E4, thí nghiệm phân biệt queue2, zombie gate (b) + sampler ngoài main thread, B-band cửa yên, cụm A chạy lại lúc yên, C3b chạy lại, E1 tải nặng đủ ≥7 lần, EPERM probe #27 + mù #26, ENOSPC, birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security 403, release gate, quy định cờ done mới).

## 37. Cập nhật sau đợt 108 (13–14/11/2026 — xem docs/PHASE9_ROUND108_LIMITS.md)
- **Re-arm (J1) — KHÔNG KẾT LUẬN:** A/B tắt E4: CAP/lượt on 2,00 vs off 0,50 nhưng CAP/tick 0,0165 vs 0,0135, Fisher p=1,0; CAP vẫn xảy ra khi E4 tắt (tuổi 5.337 ms, dài nhất chuỗi). E4 vẫn là nghi phạm chưa loại dứt khoát. Bước tiếp: lặp A/B 4+4, lấy CAP/tick làm chỉ số chính.
- **2 MiB (J2) — NHÂN QUẢ queue2 → splice ĐÃ CHỨNG MINH:** offset splice dời đúng theo ring buffer (2 MiB → +2.097.152; 1 MiB → +1.048.576; 4 MiB → 0 splice). Mitigation ".mp4 cho blob URL" bị loại bằng cả đo lẫn đọc code. Nợ mở lớn nhất: yếu tố nào là điều kiện cần của bogus; H2C8 chưa chạy.
- **Zombie (J3) — gate (b) QUAN SÁT ĐƯỢC lần đầu sau 6 lượt (dạng yếu, 3/4 lượt, chỉ dưới tải nặng):** f4y3 hoàn thành lần đầu. J9 đính chính: CDP đúng R0 7 / R1 5 (không phải 8/6 — sentinel e4skip=-1); trusted-ĐC gộp 22/33; bar ±50 ms không đạt lượt nào. Vẫn mở: cần lượt chuyên đo với dial tải load5 trong [3, 8].
- **Blur B-band (J4) — ĐẠT BAR lần đầu:** Fisher một phía gộp p=0,02655; c0 22/184 vs c2 5/108; +190 B-cap mới; D floor 0/3143. Đóng ở cấp luồng.
- **Blur cụm A (J5) — E6 VẪN MỞ (6/6 Nhãn-đúng, cần 2 sự kiện nữa → 8/8 để bác):** H-alt-weights khớp hơn ~2,6×. Phát hiện phương pháp: lượt sysload nhẹ cho 4/6 sự kiện; hiệu chuẩn presented ±1 theo tải (điểm gãy giữa load 2,5 và 27,9).
- **Ghost (J6) — C3b lúc yên ĐẠT bar 78,7%:** flip-leg trên code land xác nhận độc lập cả hai chiều (C3 81,6% + C3b-quiet 78,7%). Spread đuôi lỏng max ~75 là THẬT. F6' vẫn mở.
- **Harness (J7) — bar ≥7 lần CHƯA ĐẠT (vẫn 6):** run18–20 chết ENOSPC (vite J3 thắng cuộc đua watcher); run21 G4 PASS trong log nhưng chết do reboot #35, không report; run22–23 không chạy (timeout chờ cờ j3-done không bao giờ xuất hiện). G4 flake gộp 2/35 = 5,7%. Keydown gộp giữ 55/737/1474, max 2197 ms.
- **EPERM (J8) — probe #27 ok=2 fail=0; mù #26 KHÔNG ĐÓNG HOÀN TOÀN (3h00'06", lỗ 1h13'58"):** bỏ dự báo điểm, chỉ dùng dải chứng nhận [19'07", 3h14'08"]. Reboot #34 = 20:34:17Z (gap #33→#34 5h43'18"), #35 = 21:42:41Z (gap 1h08'24"), #36 = 22:53:56Z (gap 1h11'15"). Dị thường: "reboot" là restart cell — tiến trình cũ bị dọn ~30 s sau boot mới. Quét writeFileSync chênh 0 lần thứ 14 liên tiếp.
- **Verify (J9) — đã làm xong, chưa viết LIMITS/batch:** J1/J2/J4/J5/J6/J8 KHỚP 100% (tính lại độc lập); J3 KHỚP với 3 đính chính; J7 kiểm một phần; cây gộp XANH (tsc 0/0, vite 7,85 s, 27/27 suite exit 0, test-preview-engine 354, O8 21/21 cả 2 engine). Parent gộp từ poll.log + recount scripts + logs của J9; nếu J9 về muộn thì stage batch verify vào đợt 109.
- **Hạ tầng mới:** ENOSPC inotify watchers 63747 là điểm nghẽn khi nhiều vite song song (J3 thắng cuộc đua watcher); ENOSPC tái diễn dù watch đếm được chỉ ~1600 — nghi race lúc 2 vite khởi động cùng lúc.
- **Production đổi đợt này: 0 file** (preview.tsx giữ nguyên ced42efd cả đợt; J1 toggle đã khôi phục).
- **Tổng chờ push thật sau đợt 108: 28 batch / 58 entry / 56 file duy nhất + 1 file oversize** (đợt 106: 9/21/21; đợt 107: 9/19/19; closing 107: 1/2/1 mới; đợt 108: 8/14/14; closing 108: 1/2/1 mới). HEAD vẫn a7308ee9. KHÔNG push.
- Nợ mở cho đợt 109: xem ROUND108_LIMITS §4 (16 mục — G1 + mù #22 chờ user quyết, A/B tắt E4 lặp 4+4, điều kiện cần của bogus, zombie gate (b) dial tải [3, 8], cụm A sysload nhẹ, spread đuôi ~75, E1 tải nặng đủ ≥7 lần, EPERM probe #28 + mù #27, ENOSPC, birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security 403, release gate, quy định cờ done mới).

## 38. Cập nhật sau đợt 109 (13–14/11/2026 — xem docs/PHASE9_ROUND109_LIMITS.md)

- **Đợt 9/9 luồng về đủ đúng hạn, 0 late merge, 0 mất.** Reboot #37 = 00:55:42Z (gap #36→#37 = 2h01'46", trong dải chứng nhận), cắt giữa k1off và k2off (K1) và trong lúc K3 viết LIMITS — không mất dữ liệu. Verify K9 khớp 8/8 headline (kèm đính chính nhỏ).
- **Re-arm (K1) — E4 CÓ ĐÓNG GÓP (theo điều khoản prereg "0 CAP", kèm caveat Fisher p=0,0924):** on 6 CAP/284 ticks (0,0211) vs off 0/159; span dài on 6/6 thành CAP, off 0/2 (được re-arm cứu: 5.209/4.910 ms), Fisher p=0,0357; frzMax on 5,0–20,1 s vs off 2,6–3,6 s. Bước tiếp: sửa E4 + unit test + A/B xác nhận độc lập 2+2 trên cây đã sửa.
- **2 MiB (K2) — error-event BỊ BÁC làm điều kiện cần; ring 4 MiB tắt chuỗi (gộp 3/3); chặn set-lại ring ở 8 MiB giữ được (2/2, tầng probe):** restart là hậu quả + khuếch đại (splice trước restart mọi run kiểm được); H2C8 offset +2.097.152 như c2; dự đoán +4.194.304 chưa kiểm chứng (cần lag reader > 4 MiB); mitigation "teardown sạch trước swap" bị bác (2/2 bogus).
- **Zombie (K3) — DẠNG MẠNH QUAN SÁT ĐƯỢC LẦN ĐẦU (1/7 lượt toàn chuỗi):** R2 gap 330 ms, ph 69,17→70,00, distinct_strict=2, trusted, 3 sampler đồng thuận — caveat bracket 614 ms (>300 ms theo định nghĩa cũ J3). Dial tải [3,8] giữ được 3/3 lượt (49/50 snap). CDP bar 0/3 lượt — kém nhạy ở tải vừa. Zombie Δ trên pause-burst R0 của J3: 0/12 biên — đóng về mặt phân tích. Hog spin không nâng được load5 khi máy yên — dải giữ được bằng tải sibling.
- **Blur cụm A (K4) — E6 VẪN MỞ, 7/8 (thiếu đúng 1 sự kiện):** r51 c0 pres11 g=0,460 Nhãn-đúng là sự kiện mới duy nhất (7 lượt, 379 cap / 350 tick). H-alt KHÔNG tái hiện trên dữ liệu mới (K4 riêng đều 0,060 vs H-alt 0,058). Điểm gãy hiệu chuẩn presented quanh load ~5 (r56 gãy dù proxy chỉ 4,77). Lệch g triple không đổi +0,051/−0,008.
- **Harness (K5) — bar ≥7 lần VẪN 6/7:** run23–25 đều chết trước G4 (run23 ENOSPC do vite K1 bật giữa chừng; run24/25 mount timeout). Flake gộp 2/35 = 5,7%. Phát hiện: dial gate có lỗ hổng — load5 đạt trên số cũ trong khi load1 sống chỉ 1,82; đợt sau gate cần thêm load1 ≥ ~8.
- **EPERM (K6) — MÙ #27 ĐÓNG HOÀN TOÀN (3h00'15", 2 reboot #35/#36):** probe #28 ok=2 fail=0. Mù đầu tiên đóng hoàn toàn kể từ #25. Dải chứng nhận [19'07", 3h14'08"] còn dùng được; gap đơn n=21, trung vị 1h58'47". Quét writeFileSync chênh 0 lần thứ 15. Đính chính phương pháp: lỗ mtime 53'48" là ảo; "đồng hồ boot cũ chạy nhanh" thực chất là tiến trình cũ sống sót 28,9 s sau reboot.
- **Ghost WebKit (K7) — F6' MỞ MỘT PHẦN:** driver ghost port sang Playwright WebKit chạy được thật lần đầu; bar số 78/78 = 100% cả nhãn lẫn pixel, nhưng lượt nhiễm tải — cần đúng 1 lượt xác nhận lúc máy yên (script run-k7-quiet.sh đã sẵn). Clean distinct WebKit 43,1% vs Chromium 78,7%. Workaround ENOSPC: `server.watch.ignored: ["**/**"]` — vite 0 inotify FD, đã kiểm chứng.
- **Đính chính + ENOSPC (K8) — 7/7 điểm J9 xác nhận; ENOSPC không phải race mà là trần đã cạn:** headroom đo trực tiếp chỉ ~2.538 watch, ~61.218 watch bị giữ ngoài cell; 1 vite = 1.578 watch, 2 vite = 3.156 > 2.538 → vite thứ hai chết chắc. Trần 63756 không tăng được (Read-only fs, host). Addendum: docs/PHASE9_ROUND108_LIMITS_ADDENDUM_J9.md.
- **Verify (K9) — HOÀN THÀNH:** 8/8 headline KHỚP (tính lại độc lập); cây gộp XANH (tsc 0/0, vite build PASS 6,36 s, 27/27 suite exit 0, test-preview-engine 354 assertions, O8 21/21 cả 2 engine trên cây ced42efd).
- **Hạ tầng sau reboot #37:** WebKit không launch (wrapper MiniBrowser ghi đè LD_LIBRARY_PATH + thiếu libevent) và plugin GStreamer hệ thống mất — K1 đã vá tạm (wrapper còn, symlink ephemeral); cần xử lý bền vững. O8 WebKit nên tự đặt `LD_LIBRARY_PATH` debroot.
- **Production đổi đợt này: 0 file** (preview.tsx giữ nguyên ced42efd cả đợt; K1 toggle đã khôi phục).
- **Tổng chờ push thật sau đợt 109: 39 batch / 76 entry / 73 file duy nhất + 1 file oversize** (đợt 106: 9/21/21; đợt 107: 9/19/19; closing 107: 1/2/1 mới; đợt 108: 10/17/17; đợt 109: 9/15/15; closing 109: 1/2/1 mới). HEAD vẫn a7308ee9. KHÔNG push.
- Nợ mở cho đợt 110: xem ROUND109_LIMITS §4 (15 mục — G1 + mù #22 chờ user quyết, sửa E4 + A/B xác nhận, 2 MiB offset +4.194.304, zombie dạng mạnh lặp lại + stall chuyển clip 5 s, E6 thiếu 1 sự kiện, E1 gate load1 ≥ ~8, EPERM probe #29 + mù #28, F6' lượt xác nhận lúc yên, ENOSPC vite nối tiếp bắt buộc, xử lý bền vững WebKit sau reboot, birefnet 0 lần, TTS 39 CẤM, ci-security 403, release gate, quy định mới: vite log append theo lượt + kết luận "lỗ" phải đọc nội dung log append).

## 39. Cập nhật sau đợt 110 (14/11/2026 — xem docs/PHASE9_ROUND110_LIMITS.md)

- **Đợt 9/9 luồng về đủ (L3 về muộn bằng giao lại sau reboot #39).** Reboot #38 = 02:24:45Z, #39 = 02:50:48Z (gap #38→#39 = 26'03", chưa chứng nhận — KHÔNG phá sàn 19'07"); #39 giết luồng L6 đầu + L3 đầu, cả hai đều được giao lại và xong. L9 verify 7/8 luồng có dữ liệu (L3 = 0 lúc L9 đóng; L3-retry về sau, parent kiểm trên đĩa).
- **Re-arm (L1) — SỬA E4 XONG, KHÔNG ĐÓNG:** cơ chế pause-deadlock đã xác định và diệt tận gốc bằng tách tín hiệu (`combineSkipRender()`: `skipRender` = N3||E4, `skipRenderSeeking` = chỉ N3; md5 mới 9b27abe5). A/B 2+2 trên cây đã sửa: 1 CAP/179 ticks = 0,0056 (Fisher vs K1-on p=0,2571); 0/60 mẫu paused, 3/4 đuôi dài được cứu. CAP còn lại (l1f3, 5.191 ms) là cơ chế mới: cuộc đua tail-ceiling 5000 ms vs restart-ended seek ở biên cuối clip.
- **2 MiB (L2) — OFFSET +4.194.304 TRÊN C8 ĐÃ XÁC NHẬN:** 2/2 run, 14 spliced pulls, delta đúng tuyệt đối; ring-buffer-max-size quyết định offset (S2: max-size=4 MiB + ring=1 MiB → delta +1.048.576); fresh-element gán được cho từng playbin, KHÔNG tránh được splice; WebKit dùng GstPlayBin3 cho blob URL (shim cũ bỏ sót, đã vá). Đề xuất: KHÔNG đưa chặn set-lại ring thành sửa production (shim LD_PRELOAD không ship được).
- **Zombie (L3) — DẠNG MẠNH LẶP LẠI ĐƯỢC 2/2 LƯỢT (gộp 3/9):** R1 3 gap (2 freeze sạch + 1 stall 2669 ms qua bar theo đúng chữ), R2 1 gap freeze sạch; theo bracket cũ J3 (≤300 ms): 0 gap (bracket nhỏ nhất 402 ms). Stall 5 s biên 60 s KHÔNG tái hiện (0/2); stall mới 2669 ms giữa clip c15 (handoff seek→draw, nguyên nhân gây seek chưa xác định). Dial tải độc lập THẤT BẠI có bằng chứng (python ×6: load1 0,13→0,08). Ring draws 2000→8000 ĐÓNG. Đề xuất bỏ bar CDP (gộp 0/5 lượt).
- **Blur cụm A (L4) — E6 BỊ BÁC, ĐÃ ĐÓNG:** 11 sự kiện mới, cả 11 Nhãn-đúng; gộp 18/18 Nhãn-đúng, 0 E6-ủng hộ. H-alt KHÔNG tái hiện lần 2 liên tiếp (cải thiện 0,008 < ngưỡng prereg 0,010) — ngừng dùng để diễn giải. Điểm gãy tải vẫn mở (load1 EMA ~60 s không đủ).
- **Harness (L5) — BAR ≥7 LẦN ĐÃ ĐẠT:** run31 QUALIFYING (lần thứ 7 tới G4, 0 flake trên 7 lần; G4 R=0,51, G5 3,24×). Gate v2 (load1 sống ≥ ~8 + load5 ≥ ~8 ở 2 mẫu 10 s) vá lỗ hổng load5-số-cũ. Flake gộp 2/36 = 5,6%. Mẫu lỗi mới: CDP page-target timeout dưới load1 28–49.
- **EPERM (L6) — probe #29 ok=2 fail=0; MÙ #28 KHÔNG ĐÓNG HOÀN TOÀN (lỗ thật 23'39", khe 4'32" không loại trừ được — chờ user quyết):** gap #36→#37 = 2h01'46" ĐƯỢC chứng nhận → tập gap đơn n=22; gap #37→#38 = 1h29'03" KHÔNG chứng nhận. Quét writeFileSync lần 16 chênh 0. Sóng EPERM 0 thật.
- **Ghost WebKit (L7) — F6' ĐÓNG:** lượt yên thật (load 0,31/1,78, poll 45): nhãn 53/53 = 100% + pixel-verified 53/53 = 100%, n=53, trên cây 9b27abe5. Ngưỡng WebKit median ≤100 ms ĐƯỢC GIỮ (tickCost yên 40,5 ms). Trễ nhãn–pixel: median 8 frame (267 ms), max 16 frame. Caveat: pixel-verified lại 0 ứng viên — chưa phải bằng chứng pixel độc lập mạnh.
- **Hạ tầng (L8) — WebKit sau reboot CÓ ĐƯỜNG BỀN VỮNG:** không cần cài tay — chờ apt replay ~17 phút (boot #39, 170 package, plugin GST đủ 10/10) + script `vcut-webkit-postboot-check.sh`. O8 WebKit 21/21 sau sửa. watch.ignored: vite gốc 1585 watch vs ignored 0 watch. Headroom boot #39: 248/1854; ngoài cell ~61,8k watch.
- **Verify (L9) — HOÀN THÀNH:** 7/8 headline KHỚP (kèm đính chính nhỏ); cây gộp XANH (tsc 0/0, vite build PASS 6,46 s, 27/27 suite exit 0, O8 21/21 cả 2 engine trên cây 9b27abe5).
- **Production đổi đợt này: 1 luồng duy nhất (L1)** — preview.tsx ced42efd → 9b27abe5 + `lib/driftConfirmSkip103E4.ts` + test E4 mới.
- **Tổng chờ push thật sau đợt 110: 49 batch / 98 entry / 93 file duy nhất + 1 file oversize** (đợt 106: 9/21/21; đợt 107: 9/19/19; closing 107: 1/2/1 mới; đợt 108: 10/17/17; đợt 109: 9/15/15; closing 109: 1/2/1 mới; đợt 110: 9/20/20; closing 110: 1/2/1 mới). HEAD vẫn a7308ee9. KHÔNG push.
- Nợ mở cho đợt 111: xem ROUND110_LIMITS §4 (15 mục — G1 + mù #22 + mù #28 chờ user quyết, cuộc đua tail-ceiling/restart-seek, gán el1/el2 + preload trước seek, zombie lượt thứ 3 + quyết bracket/quy tắc loại stall + quyết bar CDP, điểm gãy tải, CDP timeout mẫu mới, EPERM probe #30 + mù #29, bảo đảm mức pixel F6', phần C stale-module + 51 file clicktest "w", birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security 403, release gate, quy định mới: luồng bị reboot giết thì GIAO LẠI NGAY).

## 40. Cập nhật sau đợt 111 (14/11/2026 — xem docs/PHASE9_ROUND111_LIMITS.md)

- M1 E4: fix endedClosed đã vào production (preview.tsx c4198206); A/B 2+2 = 1 CAP/157 ticks (m1f4, 5197 ms) → E4 KHÔNG ĐÓNG theo prereg (Fisher vs K1-on p=0,4297, vs L1-fix p=1,0); pause-deadlock đã chết; CAP còn lại là cuộc đua tail-ceiling 5000 ms vs restart-ended seek ở biên cuối clip (freeze 1 frame trước cuối, `ended` không bao giờ đúng — khác l1f3).
- M2 2 MiB: preload không giảm splice; ring 8 MiB 0/0 spliced cả 2 lượt (bar đạt, n=2) nhưng Fisher chưa đạt (p=0,1333 vs gộp ring-4M); offset +4.194.304 đã xác nhận lại 100%.
- M3 Zombie lượt 3: 3/3 trong dải, dạng mạnh 1/3 (R2, 4 gap freeze sạch); gộp 4/12; CDP 0/3 trong dải → điều kiện chữ prereg §6 THỎA MÃN, đề xuất BỎ bar CDP làm bar song song; stall 5 s 0/3 (gộp L3+M3 0/5).
- M4 EPERM: probe #30 ok=2 fail=0 (boot #40); mù #29 KHÔNG ĐÓNG HOÀN TOÀN (lỗ thật 13'33", khe 79 s không loại trừ được).
- M5 F6' pixel: bằng chứng pixel độc lập lần đầu — (b) unique-match 648/648, 484/484, 314/314, nomatch 0; "capture lag max 16f" của L7 là alias, trễ dương thật max +4f; đề xuất ngưỡng WebKit ≤60 ms (cần 1 lượt yên thật trên fixture mới để chốt); F6' vẫn đứng.
- M6 ENOSPC phần C đo xong: vite thường V2 ≤2 s, vite ignored STALE@32s; headroom ~1655 watch; trade-off stale-module vẫn mở.
- M7 Điểm gãy tải VẪN MỞ: 4 lượt blur đều TRUNG-GIAN (tick <50); r69 control GIỮ 282 tick → đói tick do tải, không phải build; H-alt không tái hiện lần 3; E6 vẫn ĐÃ ĐÓNG (20/20).
- M8 Infra: postboot PASS 5/5, WebKit launch 3/3; lock vite đã chuẩn hóa (script vcut-vite-lock.sh; đã sửa 1 bug port_serving); không sửa lock script khi có acquire đang chạy.
- M9 Verify 8/8 khớp: cây gộp XANH trên boot #41 (tsc 0, vite build PASS 6,18 s, 27/27 suite, O8 21/21 cả 2 engine). preview.tsx md5 c4198206 suốt đợt.
- Đính chính: LIMITS gộp đợt 111 là 634 dòng (không phải 570 như log parent ghi); tổng chờ push trong log parent tính trước PUSH #6 nên đã cũ — sau PUSH #6 chỉ còn đợt 111 chờ push.

## 41. Cập nhật sau đợt 112 (14/11/2026 — xem docs/PHASE9_ROUND112_LIMITS.md)

- **Đợt 8/8 luồng về đủ đúng hạn, 0 late merge, 0 mất.** Reboot #42 = 08:05:10Z (gap #41→#42 = 1h11'44", trong dải chứng nhận), #43 = 08:53:37Z (gap #42→#43 = 48'27", không phá sàn 19'07"); #43 giết run N2 + driver N5 + poller N8 giữa chừng, đều chạy lại đủ. N8 verify 7/7 headline KHỚP (kèm đính chính nhỏ).
- **E4 (N1) — ĐÓNG CÓ ĐIỀU KIỆN:** fix steady-close đã vào production (preview.tsx c4198206 → 03bf029f, đếm lần tăng lành liên tiếp qua B3, đủ 4 thì đóng đuôi); A/B 2+2 trên cây đã sửa: 0 CAP/180 tick, 4 steady-close đã xác minh (1393/1902/2396/1614 ms) + 1 ended-close M1 bắn thật lần đầu (807 ms). Fisher vs K1-on p=0,0862 ≥ 0,05 (n nhỏ, tải đo thấp hơn baseline) nên chưa tuyên bố đóng đầy đủ — cần 1 đợt xác nhận tải cao. Đính chính cơ chế m1f4: freeze ở 5,9667 là DO PROBE PAUSE (element dừng vì bị pause trước khi ct chạm 6,0), không phải quirk WebKit.
- **Ring 8 MiB (N2) — Fisher ĐẠT lần đầu (p=0,0040):** gộp 0/8 splice vs control ring-4MiB 7/10; tách flood khỏi ring đạt (LOOP flood 6,00/6,47 vẫn 0 splice); preload el1 + seek fresh el2 KHÔNG ngăn splice (2/2 bogus). Gán el1/el2 tuyệt đối đạt. Đề xuất production không đổi: không đưa chặn set-lại ring thành sửa production.
- **Zombie (N3) — dạng mạnh 1/3 lượt (R1, 2 gap freeze sạch), gộp 5/15:** giả thuyết freeze tập trung ở chuyển clip KHÔNG KẾT LUẬN (2/2 straddle nhưng n=2 < 5 theo prereg). **QUYẾT CDP (parent chốt đợt này): BỎ bar CDP làm bar song song** — N3 kiểm chứng độc lập từ dữ liệu thô đồng ý với M3 (gộp dải chặt 0/10 lượt, mọi lượt 0/11); giữ in-page làm bar chính + CDP giám định từng gap. Stall 5 s biên 60 s 0/8 gộp; stall giữa clip kiểu c15 1/8 gộp.
- **F6' WebKit (N4) — ngưỡng ≤60 ms GIỮ (biên mỏng):** lượt yên Q1 trên fixture mới median 58,0 ms (n=537, p90 79,0); series 6 lượt: yên 40,5/50,0/58,0 vs tải 66,0/86,0/167,0 — ≤60 tách đúng 3 yên / chặn đúng 3 tải. Caveat: tải trôi lên giữa lượt (kết thúc load1 4,11), biên chỉ 2 ms — cần 1 lượt yên xác nhận ở vòng sau. Label-at-capture LÀM XẤU nhãn (−56,3 điểm % lag==0) → KHÔNG đề xuất; bar F6' không cần định nghĩa lại. (b) 126/126 + 532/532, nomatch 0; F6' vẫn đứng.
- **Điểm gãy tải (N5) — VẪN MỞ, biên GIỮ 1,87 → 9,59:** s71 GIỮ ở load1 9,59 (283 tick, 84,1%); s70 TRUNG-GIAN ở 18,2; phát dài (20 clip/60 s) tích đủ tick tới ~18, hết hiệu lực ở ~28 (s72 chỉ 30 tick, cần ~70 clip mới đủ 50). Dị thường s73 TRUNG-GIAN ở tải thấp 0,91 chưa giải thích dứt khoát (cần 1 lượt control trên build 03bf029f). Load1 không dự báo được phân loại. Lệch DƯƠNG dưới tải, trễ âm K4 r56 vẫn không tái hiện.
- **EPERM (N6) — probe #31 ok=2 fail=0; MÙ #30 KHÔNG ĐÓNG HOÀN TOÀN (3 cửa sổ mở tổng 30'50", tối đa 2 reboot ẩn):** số thứ tự #41/#42/#43 vẫn tạm thời. Quét writeFileSync chênh 0 lần thứ 18 liên tiếp. Sóng EPERM 0 thật. Đính chính: poller M9 exit bình thường 06:49:11Z, không bị #41 cắt như log parent đợt 111 viết.
- **Hạ tầng (N7) — postboot boot #42 PASS toàn bộ; O8 tự copy fixture đã sửa + kiểm chứng md5 3/3; spec đóng băng lock đã viết; stale-recovery PASS 3/3:** headroom boot #42 chỉ 1534 watch (< 1586 của 1 vite thường) — đợt này chỉ dùng vite tạm watch.ignored. Đính chính: N7 lặp lại sai lầm sàn "26'03"" — sàn vẫn 19'07".
- **Verify (N8) — HOÀN THÀNH:** 7/7 headline KHỚP; cây gộp XANH (tsc 0/0, vite build PASS 6,69 s, 27/27 suite exit 0, playheadHold90R2 93 passed, test-preview-engine 354 assertions, O8 WebKit 21/21 trên cây 03bf029f). **O8 Chromium exit=2 — BỊ CHẶN BỞI ENOSPC HẠ TẦNG, không phải lỗi sản phẩm:** vite thường của script Chromium (không có watch.ignored) chết 8/8 lần thử vì headroom boot #43 chỉ 1511 watch; script WebKit có workaround L8 nên PASS. Chưa sửa script Chromium (ngoài phạm vi verify) — đợt sau mirror watch.ignored vào config tạm của script Chromium.
- **Production đổi đợt này: 1 luồng duy nhất (N1)** — preview.tsx c4198206 → 03bf029f + `lib/playheadHold90R2.ts` + test E4 mới (9 test, 93 passed).
- **Tổng chờ push thật sau đợt 112: 18 batch / 41 entry / 37 file duy nhất + 1 file oversize** (đợt 111: 10/21/21; đợt 112: 8/20/20; trùng 4 file: preview.tsx, playheadHold90R2.ts, playheadHold90R2.test.ts, vcut-webkit-postboot-check.sh). HEAD vẫn a8f26d48. KHÔNG push. Đính chính: số "67 batch / 139 entry / 127 file" trong LIMITS gộp N8 là đếm gộp cả đợt 106–110 ĐÃ PUSH trong PUSH #6 — không phải số chờ push thật.
- Nợ mở cho đợt 113: xem ROUND112_LIMITS §10 (15 mục — G1 + mù #22/#28/#29 chờ user quyết; E4 xác nhận tải cao để đóng đầy đủ; quyết CDP đã chốt — áp dụng từ đợt sau; giả thuyết chuyển clip cần tích tới n≥5 gap; ngưỡng WebKit ≤60 ms cần 1 lượt yên xác nhận; điểm gãy cần ~70 clip ở tải ~28 + sửa dụng cụ trích kết quả + control trên build 03bf029f; EPERM probe #32 + mù #31; fix O8 Chromium watch.ignored; postboot-check cập nhật tham chiếu lên #43; ENOSPC headroom ~1511–1534; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security 403; release gate).

## 42. Cập nhật sau đợt 113 (14/11/2026 — xem docs/PHASE9_ROUND113_LIMITS.md)

- **Đợt 8/8 luồng về đủ, 0 late merge, 0 mất.** Reboot #44 = 10:53:31Z (gap #43→#44 = 1h59'54", trong dải chứng nhận), #45 = 13:17:42Z (gap #44→#45 = 2h24'11", không phá sàn 19'07"); #45 giết suite P8 đúng 40 s sau khi xong, không mất dữ liệu. P8 verify 7/7 headline KHỚP (1 kèm đính chính nhỏ: s75 "98,2%" là làm tròn kép, đúng 1165/1187 = 98,1%).
- **Zombie (P3) — giả thuyết freeze ở chuyển clip ĐƯỢC XÁC NHẬN:** gộp N3+P3 n=5, 5/5 gap freeze sạch straddle biên clip (biên 6/9/12/15/18), p Poisson-binomial = 4,2e-05 < 0,01, tỉ lệ 100% ≥ 80% — đủ cả 3 điều kiện prereg §3.2. Dạng mạnh gộp 6/16 lượt. Chỉ-P3: 3/3, p=0,0028. Câu hỏi tiếp theo chuyển từ "có tập trung ở chuyển clip không" sang "TẠI SAO" — cần luồng chẩn đoán cơ chế (pump lifecycle/seek/decode quanh biên 3 s), không tích mẫu nữa. Stall 5 s 0/9 gộp; stall c15 1/9 gộp.
- **E4 (P1) — vẫn ĐÓNG CÓ ĐIỀU KIỆN, xác nhận tải cao KHÔNG đạt được:** 0/8 lượt đạt tải cao (hog `yes` làm browser đói — rAF 1200–8106 ms, 2 attempt vô hiệu — phải đổi sang 0 hog + tải nền thật); 0 CAP/484 play-tick, Fisher gộp 0/664 p=0,000696 nhưng chỉ trên tải thấp nên KHÔNG được đọc thành đóng tải cao. 2 steady-close + 2 ended-close đã xác minh; đuôi 5002 ms chạm trần theo đồng hồ sampler (lệch pha 2 ms); decoder chùm (6/8 lượt) làm steady đặt lại 0 — fix chỉ cứu decoder đều. Stall-watch cửa sổ rộng 0 stall. Quirk frame cuối: element ngồi ct=5,9 trong 4915 ms lúc đang phát — ct=5,9 là 3 khung trước cuối clip, ended=false là đúng (decoder kẹt 0,1 s trước cuối clip, không phải lỗi báo ended).
- **Ring lag (P2) — đo trực tiếp lag push/take tại splice:** push_lag 7–86 ms, residence 7–65 ms, splice_delay 0–21 ms, take_freshness 0–3 ms (take không kẹt); lag KHÔNG phân biệt được theo luật prereg (chồng lấn 100%) — lag là dấu vết burst, không phải nguyên nhân. Kiểm chứng wrap trực tiếp: 33/38 pull spliced có byte take kể từ lúc byte đúng được load VƯỢT wrap 4.194.304; gần-miss sạch ở 3,76 MB (89,7%) — ngưỡng nằm giữa 3,76 MB và 4,00 MB. Ring 8 MiB 0 splice cả 4 run; seek 0,44 s. Đề xuất production không đổi. Caveat: P2CTL r6 clean không đáng tin (354/729 vi phạm attribution, 48,6%) — nợ mới gán elem→adap tuyệt đối qua L2BINADD.
- **F6' WebKit (P4) — lượt yên xác nhận KHÔNG đạt điều kiện yên:** P3 bắt đầu chạy giữa cửa sổ đo (vi phạm lớp B theo chữ prereg) — tickCost median 61,0 ms (n=509), vượt bar đúng 1 ms; hậu flip median 58,0 y hệt N4. Ngưỡng ≤60 ms giữ nguyên "GIỮ nhưng MỎNG". (b) có 1 sự kiện mới: 6 occurrence lag ≥+5f (max +12f) ở skp=0, cùng 1 event seq 220–223 (ghost match frame 26 trong khi presented 17→27, pixels đứng yên ~0,42 s). F6' 72/72 + 250/250, vẫn ĐÃ ĐÓNG. **QUYẾT PARENT (đợt này): sửa định nghĩa lớp B từ đợt 114** — cửa sổ đo = tick đầu→tick cuối; chỉ phân tích nặng/tải mới vi phạm, ghi file nhẹ không vi phạm (P3 chỉ ghi file trong cửa sổ P4, hog spawn sau khi probe thoát, chồng lấn 0 tick).
- **Điểm gãy tải (P5) — VẪN MỞ, biên GIỮ giữ 9,59:** dụng cụ trích kết quả ĐÃ SỬA XONG (chunked 5 đợt + snapshot 60 s + stuck watcher; 4/4 lượt 0 chunk lỗi; lát px tốn 46,2 s — eval cũ 60 s suýt thua). Control s75 trên build 03bf029f GIỮ (1187 tick, 98,1%) → dị thường s73 KHÔNG phải hiệu ứng build N1. Lượt dài s76 (70 clip) KHÔNG CHẠY ĐƯỢC — DEFERRED 2 lần do P1 giữ vite lock liên tục ~35 phút (pattern đói lock mới: holder nên nhả lock giữa các lượt). Playhead kẹt biên 21,0 s KHÔNG TÁI HIỆN (0/2; kiểm chứng độc lập: cửa sổ 30 s nào playhead cũng tiến ≥10,7 s). 0 lượt GÃY.
- **EPERM (P6) — probe #32 ok=2 fail=0 (boot #44, 11:37:14Z); MÙ #31 KHÔNG ĐÓNG HOÀN TOÀN (1 cửa sổ mở 8'55", tối đa 1 reboot ẩn):** log probe v2 86 → 88 dòng (dòng DEAD bị dedupe, baseline lượt sau là 88). **QUYẾT PARENT (đợt này): CHẤP NHẬN chứng nhận gap #42→#43 = 48'27" xuyên mù** — khoảng (08:05:10Z, 08:53:37Z) không chứa cửa sổ mở nào (đoạn C mù #30 đóng + đoạn A mù #31 đóng); CERT n=22 → 23 (mean 1h49'19", median 1h58'47"). Quét writeFileSync chênh 0 lần thứ 19 liên tiếp (637/187). Sóng EPERM 0 thật. Mù #31 chưa đóng → số thứ tự #43/#44/#45 vẫn tạm thời.
- **Hạ tầng (P7) — cả 3 việc PASS:** O8 Chromium 21/21 trên boot #44 (headroom 1507) sau khi mirror watch.ignored vào config vite tạm — chặn ENOSPC đợt 112 đã hết, cả 2 engine O8 đều chạy được trên boot headroom thấp. Postboot boot #44 PASS toàn bộ ngay lần đầu (tham chiếu cập nhật #42 → #44). Poll mẫu M5/L7 đã vá (bracket trick; đính chính N4: L7 cũ KHÔNG tự đếm nhờ `grep -v grep`). Headroom boot #44: 1507 (thấp hơn #43: 1511, #42: 1534).
- **Verify (P8) — HOÀN THÀNH:** 7/7 KHỚP; cây gộp XANH (tsc 0/0, vite build PASS, 27/27 suite exit 0, hold 93, test-preview-engine 354 assertions, U4 141/141, O8 Chromium 21/21 + WebKit 21/21 trên cây 03bf029f, boot #45). **Sự cố mới: postboot #45 FAIL 8 lần/43 phút vì apt replay KHÔNG chạy** (0 tiến trình apt/dpkg; `--repair` vá được symlink GST → debroot nhưng apt FAIL do package lists trống); O8 WebKit PASS nhờ debroot, postboot vẫn FAIL về apt/libs. Headroom rơi 1507 → 1401 → 1307 qua các boot. Đợt 114 cần quyết có cho `apt-get update` trong `--repair` không + cập nhật tham chiếu postboot #44 → #45.
- **Production đổi đợt này: 0 luồng** — preview.tsx md5 03bf029f không đổi suốt đợt (chỉ probe/script/lock-doc đổi).
- **Tổng chờ push thật sau đợt 113: 28 batch / 60 entry / 52 file duy nhất + 1 file oversize** (đợt 111: 10/21/21; đợt 112: 9/21/21; đợt 113: 8/17/17; closing 113: 1/1/0 mới — gap file đã có trong batch trước; trùng chéo: postboot-check ×3, preview.tsx ×2, playheadHold90R2 ×2, clicktest ×2, gap file ×3). HEAD vẫn a8f26d48. KHÔNG push.
- Nợ mở cho đợt 114: xem ROUND113_LIMITS §10 (12 mục — E4 xác nhận tải cao cần nguồn tải thật không đói browser; zombie chẩn đoán cơ chế TẠI SAO ở biên clip; ngưỡng WebKit ≤60 ms cần lượt yên thật (định nghĩa lớp B mới); điểm gãy: lượt dài 70 clip + đói lock giữa các luồng + element chết format error s77; EPERM probe #33 + mù #32 (đã chứa #45); postboot #45/apt replay + headroom rơi; G1 + mù #22/#24/#26/#28/#29/#30/#31 chờ user quyết; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security 403; release gate).

## 43. Cập nhật sau đợt 114 (14/11/2026 — xem docs/PHASE9_ROUND114_LIMITS.md)

- Q1 E4: xác nhận tải cao — 3 lượt hợp lệ, 0 CAP/160 play-tick (load1 play-mean 12,25/14,21/19,17); gộp N1+P1+Q1 0/824 p=0,000273 → ĐÓNG ĐẦY ĐỦ qua gộp (quyết parent 15/11 theo prereg §7 đăng ký trước; caveat: bằng chứng tải cao trực tiếp chỉ 0/160, p=0,0919).
- Q2 Zombie: cơ chế freeze ở chuyển clip ĐÃ TÌM ĐƯỢC — cổng bỏ vẽ E4+N3 (mọi biên) + main-thread stall (longtask đơn, ~1/2 là pump capture); seek ~100–300 ms, decoder chạy, ring không tràn, pump kill không phải nguyên nhân.
- Q3 Điểm gãy tải: s76 ĐÃ CHẠY (47 tick, thiếu 3 so với 50) → VẪN MỞ, biên GIỮ 9,59; tickRate 0,09/s, skip-stale 44,26% → dự báo KHÔNG-GIỮ; playhead kẹt 0/3.
- Q4 Lock fairness: helper v2 xong (FIFO ticket, priority lượt dài + aging, cooldown 15 s), test 9/9 PASS ×2; migration đợt 115 (quyết parent 15/11).
- Q5 F6' WebKit ≤60 ms: lượt yên lần 3 liên tiếp KHÔNG chốt được (replay apt cài package suốt cửa sổ đo, theo định nghĩa lớp B mới); ngưỡng GIỮ nhưng MỎNG, tickCost median 70,0 (n=479); sự kiện ghost stale sau seek mới seq 282–285 (+68f); F6' 67/67 + 218/218 vẫn ĐÃ ĐÓNG.
- Q6 EPERM: probe #33 ok=2 fail=0; mù #32 ĐÓNG HOÀN TOÀN (mù đầu tiên đóng hoàn toàn kể từ #27, cắt chuỗi 4 mù không đóng #28–#31); gap #44→#45 = 2h24'11" ĐƯỢC CHỨNG NHẬN (CERT n=24, quyết parent 15/11); mù #31 KHÔNG ĐÓNG ĐƯỢC — đã thử hết nguồn (2 reboot chốt + tối đa 1 ẩn); wfs lần 20 chênh 0.
- Q7 Hạ tầng: postboot #45 PASS sau --repair; khoảng replay #46 kẹp được (1'23", 7'08"]; headroom #46 1300→1207; O8 boot #46 21/21 cả 2 engine.
- Q8 Seek/preload: trần buffer blob 17,1–17,4 s; H1 được hỗ trợ về cơ chế nhưng bar thời gian KHÔNG ĐẠT do tải; H2 BÁC; F1 fail (+2,49 < 5 s); F2 VIABLE (seek 653/810 ms, 243/296 frames); HTTP đầy buffer 913 ms.
- Q9 Verify 8/8 khớp (5 sạch + 3 đính chính phương pháp/số: Q1 Poisson 0,0340 là xấp xỉ, nhị thức đúng 0,0328; Q2 viết sai "mù #32 mở"; Q3 claim cửa sổ 10 s sai theo phương pháp P8). Cây gộp XANH trên boot #46 (tsc 0, vite build PASS 6,51 s, 27/27 suite, O8 21/21 cả 2 engine). preview.tsx md5 03bf029f không đổi.

## 44. Cập nhật sau đợt 115 (14–15/11/2026 — xem docs/PHASE9_ROUND115_LIMITS.md; gộp muộn lượt 03:35 + bổ sung parent main chat §12)

- R1 E4: số liệu CAP ĐÃ ĐỦ (0/184 tick tải cao hợp lệ; gộp tải cao thuần Q1+R1 0/344, p=0,0083 — caveat lực mẫu đợt 114 ĐÃ HẾT) NHƯNG verdict KHÔNG ĐÓNG: 1 stall sau steady-close (r1f3 att2, tải thấp 0,92, steady-close 2497 ms, re-seek kẹt ≥5771 ms, ct đóng băng 2,4667) → E4 quay về ĐÓNG CÓ ĐIỀU KIỆN (quyết parent 15/11, cả hai parent đều đồng ý). Dial tải chậm tệ hơn (150–275 s; retry 120 s không đủ; luật hogs ≥90 s đã hoạt động đúng).
- R2 Zombie hướng sửa: cap snapshot pump VERDICT BỎ — capMs chỉ −14% median/−10% p90 (bar −40%); longtask KHÔNG PHẢI task của chính callback pump (cũng không phải task tick); cây đã revert về 03bf029f. Đính chính parent: "longtask khớp pump" tính bằng |start−invoke| trong khi prereg ghi "sau" (có hướng) — đúng chữ là −13,2% (vẫn trượt bar); suy luận §6 mất bằng chứng.
- R3 Điểm gãy tải: s77c SẠCH, GIỮ ở tải 19,63 (2231 tick, 88,7% ±1); biên GIỮ dời 9,59 → 19,63 (chế độ hog nice -n 19); chuẩn tải cho bar (a) = hog nice -n 19 (quyết parent); điểm gãy VẪN MỞ; bar (c) vùng xám lần 2 (tickRate 3,37/s, skipStale 29,73%).
- R4 Lock v2: pilot chạy thật, tìm + vá 5 lỗi (T6 flaky → 12/12 PASS sau vá); chế độ hỗn hợp ĐÃ CHỨNG MINH làm waiter v2 thiệt thòi (thua race 2/2, chờ 1204 s → TIMEOUT) → migration phải NGUYÊN TỬ theo đợt: đợt 116 v2-only, VITE_LOCK_AGING_S=600 (quyết parent).
- R5 F6' WebKit ≤60 ms: lần thứ 4 liên tiếp KHÔNG chạy được lượt yên hoàn chỉnh (attempt2 chạy 9/20 pass rồi kẹt 17'50" ở pass 10, WebKit target chết vì RAM); ngưỡng GIỮ nhưng MỎNG; RAM là nút thắt (median poller đúng 736 MB — LIMITS ghi sai 724; dải load-mid đúng 247–1429 MB; CPU/RSS không có dữ liệu đối chiếu).
- R6 Ghost seek: event Q5 (seq 282–285) KHÔNG tái hiện 0/20 (gộp Q5+R6 1/40 = 2,5%); event kiểu P4 TÁI HIỆN (20 occ lag ≥+5f, 3 event, tất cả skp=0, pixels đóng băng frame 31 ~367 ms, label chạy 17→26) — cơ chế tổng quát rõ hơn (video yield frame đi trước currentTime tới +14f); H-B yếu thêm; H-C dạng tổng quát bị bác.
- R7 EPERM: probe #34 ok=2 fail=0; mù #33 ĐÓNG HOÀN TOÀN (2h55'39"); gap #45→#46 = 2h27'07" ĐƯỢC CHỨNG NHẬN (CERT n=25, FULL n=40, quyết parent); WFS lần 21 chênh 0 (680/196, R7B 705/213, copies 25/17).
- R8 Seek/preload: trigger blob error-event ĐÃ TÌM ĐƯỢC — cuộc đua ring-wrap ở pull đầu (pull req_off=0 đôi khi trả byte ở file offset 4.194.304 → qtdemux bogus atom size → pipeline chết → error-event → fallback HTTP); B-Q8-1 KHÔNG ĐẠT vì tiền đề không xảy ra (pha blob không giữ được 20 s); F2 chưa tái xác nhận đầy đủ theo bar chữ (gộp 6 SEEKFAST median 802 ms, 4/6 ≤940 ms); HTTP đối chứng sạch (full [0,32] trong 543 ms). Đính chính parent: các số đếm 9/9→8/8, 7/7→6/6, 3/5→3/6, 14/23→16/23 (70%); bogus size không duy nhất (4002606236 tại ring+32).
- R9 Hạ tầng: postboot #47 PASS lúc 27,7' (bracket (22,6', 27,7']); replay #47 đã kẹp; headroom rơi tiếp 1092 (#47) → 1073 (cuối đợt); reboot KHÔNG hồi headroom (lần 2 liên tiếp); watcher v2 early-run live; đề xuất (b) ĐÃ DUYỆT làm luật đứng (luồng infra đầu tiên sau mỗi reboot chạy watcher v2 ngay; phương án (a) sửa thân cron KHÔNG duyệt).
- R10 verify: gộp muộn lượt 03:35 (suite 27/27 exit 0 trên boot #48) + bổ sung parent main chat (recount độc lập 7/7 — 0 KHÔNG KHỚP, 7/7 KHỚP kèm đính chính; O8 boot #48 21/21 cả 2 engine; postboot #48 PASS). preview.tsx md5 03bf029f không đổi. Reboot #47 (17:45:50Z) + #48 (19:43:46Z), gap 2h01'01" + 1h57'56", trong dải chứng nhận. Mù #34 đã mở (từ 17:45:02Z, chứa #47/#48).

## 45. Cập nhật sau đợt 116 (15/11/2026 — xem docs/PHASE9_ROUND116_LIMITS.md; gộp 8/9 bởi lượt 03:35, S1 chết không dữ liệu)

- S1 E4 stall: phân tích offline XONG, tái hiện CHƯA ĐO — A/B không hề chạy (chờ cờ cây S2, watch-tree flip 21:32:37Z xong không chạy, agent chết sau 3 reboot #49/#50/#51, không có dữ liệu probe). Phát hiện: stall r1f3 att2 KHÔNG phải cơ chế zombie Q2 (không biên clip, main thread không stall) — là drift re-seek chậm/kẹt của decoder (seeking=True, ct đóng băng 2,4667, readyState=4, ≥5771 ms). **ĐÍNH CHÍNH QUAN TRỌNG: r1f4 (lượt HỢP LỆ tải cao) cũng stall sau steady-close (≥2408 ms, ct=3,667 đóng băng) — kết luận R1 "stall-watch sạch trên tập hợp lệ" là SAI; đường "loại r1f3att2 ngoài dải để tuyên E4 ĐÓNG ĐẦY ĐỦ" bị chính r1f4 đóng lại.** E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN (quyết parent 15/11). Tái hiện có kiểm soát (lượt A gop250 loadN=0, lượt B gop30 loadN=0, cửa sổ seek 60 s) dời sang đợt 117. LIMITS S1 tạm đã có trên đĩa (18.598 B).
- S2 Zombie H2: VERDICT BỎ. Throttle capture tối đa 1/250 ms/clip: captures 238→33 (−86,1%) nhưng capMs median 4,8→4,9 (+2,1%, bar −40%); cặp A/B 24-clip chính BỊ NHIỄM (holder 2 lượt đi ngược nhau) nên không dùng để quyết. Cây revert về 03bf029f; fix giữ dạng patch. Đính chính S10: resid-share median 0,0/0,0 (không phải 0,04/0,30).
- S3 Điểm gãy tải: s78b SẠCH, GIỮ ở tải 21,07 (1957 blendTick, 80,9% ±1, ≤−2: 2 tick; load1 mean 21,07, median 11,73, max 58,17) — **biên GIỮ dời 19,63 → 21,07** (hog nice -n 19); caveat: GIỮ SÁT NGƯỠNG (80,9% so với 80%, chỉ hơn ~17 tick) + tải HAI ĐỈNH; điểm gãy VẪN MỞ, bar (c) vùng xám lần 4.
- S4 Lock v2: migration nguyên tử xong trong đợt (mặc định VITE_LOCK_AGING_S 1800→600 ở 3 chỗ trong vcut-vite-lock-v2.sh; test suite 3 lần liên tiếp 9/9; v1 frozen fd21193c nguyên vẹn). Verdict: CHƯA ĐỦ ĐIỀU KIỆN quyết v2 làm mặc định đợt 117+ (3 điều kiện: mẫu waiter thật còn mỏng; vá C chưa đo dưới tải hog; 1 waiter chờ >600 s để quan sát aging). V2-only trong đợt vẫn tiếp tục.
- S5 WebKit ≤60 ms: **XÁC NHẬN LẦN 5 — CHỐT ĐƯỢC NGƯỠNG.** Attempt3 chạy đủ 20/20 pass (21:32:42–21:36:02Z, cây 03bf029f, lớp B mới gồm B5 RAM-mid 5/5): tickCost n=570 median 49,5 ms p90 75,0 ms; hậu flip+2000 ms n=412 median 49,5 ms. Ngưỡng GIỮ. F6' xác nhận lại 100,0%/100,0% (n=71). Nợ 5 lượt ĐÃ ĐÓNG.
- S6 Ghost seek: event seek Q5 TÁI HIỆN 4 LẦN trong 1 lượt nhiễm tải (4/19 snapshot label-0 stale, 21,1%; 4/20 seek) — không còn là quan sát đơn lẻ. Gộp toàn chuỗi 5/60 (8,3%), tất cả 5 lần đều trên lượt NHIỄM TẢI; lượt YÊN vẫn 0/20. H-D chưa bị bác (p=0,12). Nợ ≥80 seek dời sang đợt 117 (cần lượt yên thứ hai).
- S7 EPERM: probe #35 (21:04:50Z, boot #48) ok=2 fail=0; **mù #34 ĐÓNG HOÀN TOÀN (mù thứ 3 liên tiếp)**; WFS lần 22 chênh 0. Mù #35 đã mở (từ 21:04:50Z, chứa #49/#50/#51).
- S8 Hạ tầng: postboot #48 PASS (21:03:02Z, boot ~79' tuổi, GST 269, apt 11/11); replay #48 kẹp bằng dpkg.log (0'40", 2'44"] — nhanh nhất trong 3 boot kẹp được; watcher v2 try#1 PASS lúc boot 83,3' nhưng không có lần FAIL live. **Headroom inotify boot #48: 969 → 961** (rơi tiếp so với 1073 cuối #47); vite thường ENOSPC (chết khi watch MediaBin.tsx); vite tạm watch.ignored vẫn là đường duy nhất. Stale vite.lock: KHÔNG CÓ lock nào sót trên đĩa.
- S9 Seek/preload: BỎ cả hai fix, KHÔNG sửa production — V1 `preload-none` FAILED 3/5 (tệ hơn control 2/5), V2 `reset-swap` FAILED 2/5 (bằng control); bar FIX không đạt; media.ts không đổi (md5 2c384ed1…). B-Q8-1 dời sang đợt 117 với hướng khác, hoặc chấp nhận race + fallback.
- S10 verify: 9/9 gộp (S2–S9 + closing), suite 27/27 exit 0, O8 21/21 cả 2 engine. preview.tsx md5 03bf029f không đổi. Reboot #49 (9c6b5543), #50 (6c1a704a, ~02:17Z), #51 (d2ee7500, ~04:31Z); probe #35 chưa ghi nhận #49/#50 (heartbeat dừng ở boot #48).

## 46. Cập nhật sau đợt 117 (15/11/2026 — xem docs/PHASE9_ROUND117_LIMITS.md; gộp 9/9 bởi T10, không late merge)

- T1 E4 stall: tái hiện CÓ KIỂM SOÁT (lượt A gop250, lượt B gop30, cửa sổ seek 60 s) KHÔNG tái hiện được — 3 lượt VOID (0 steady-close), 1 retry DEFER-LOCK (TIMEOUT 902 s, hàng đợi t4-hold 630 s + t3 70 s + t2). Drift recount khớp từng số (t1b 8 lần vượt 0,35 tại tick 12/14/16/18/20/22/26/31, 0 cặp liên tiếp → luật xác nhận 2 tick không bao giờ thỏa). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN. Parent chọn 1 trong 3: (a) giữ chờ lô đo lớn, (b) điều tra phương sai ì decoder, (c) quyết theo phân tích cơ chế S1.
- T2 Zombie H3e: VERDICT BỎ. Cặp (B1, F1) cùng boot #53: longtask ≥200 ms tổng −2,6% (bar −30%), số lượng 196→198; draws-gap straddle biên 24→21 (−12,5%, bar −30%); seek median tệ hơn 174→205 ms. Cả 3 bar không đạt; cây revert về 03bf029f, fix giữ dạng patch. Chẩn đoán mới: residual 0,94–0,95 KHÔNG phải capture/blend — là 2 drawImage full-res trong total ngoài blend (storeHeldFrame + samplePlainCurrentPixStrip); giả thuyết H3f: tick block chờ decoder ở lần đọc video ĐẦU TIÊN. Parent quyết: A chấp nhận stall ~200–800 ms ở biên dưới tải, hay B cho làm H3f sau bước chẩn đoán storeHeldFrame.
- T3 Điểm gãy tải: s79 TRUNG GIAN 79,7% @26,98 (1757 tick, 1401 trong ±1 — thiếu GIỮ đúng ~5 tick); s80b TRUNG GIAN 64,4% @12,03 (1697 tick, 1093 trong ±1) — tải THẤP NHẤT cho offset TỆ NHẤT: liều–đáp ứng KHÔNG đơn điệu, load1 mean không dự báo được offset. **Biên GIỮ lùi 21,07 → 19,63; vùng chuyển tiếp (21,07, 26,98].** Bar (c) TUYÊN BỐ KHÔNG ÁP DỤNG cho chế độ hog nice -n 19 (xám lần 5+6, tickRate 1,96–1,98/s, skipStale 27–33%). s80 VOID (T2 apply H3e giữa lúc dial + reboot #53 cắt ở ph 110,8/750). Luật dial mới ĐẠT 3/3 (lũy kế 5/5) — đề xuất thành luật đứng; nhưng dial ĐẠT không khóa được tải trong lúc phát (s80b 38,26 → mean 12,03). Kẽ hở phối hợp dial–sửa cây (mới). Bar (b) playhead kẹt 0/8.
- T4 Lock v2: **CẢ 3 ĐIỀU KIỆN ĐỔI SPEC ĐỀU ĐẠT** — (a) 44 ticket/38 acquired/6 TIMEOUT, 5 waiter chờ >600 s rồi giữ được lock, 0 STALE-TICKET; (b) vá C: waiter B timeout 300 s → 301 s tường (giãn 1,003×, trước vá 1,34×) — caveat tải >15 chỉ 62% mẫu, đoạn liên tục dài nhất 189 s (load1 dao động chu kỳ ~5 phút, giả thuyết quota CPU burst); (c) aging 600: waiter C chờ 702 s, key lật 1→0 đúng quanh created+600 s (snapshot 09:12:04Z vs 09:12:25Z). Khuyến nghị đổi `VCUT_VITE_LOCK_FREEZE_SPEC` sang v2 ở đợt 117/118; v1 frozen fd21193c nguyên vẹn.
- T5 F6' WebKit ≤60 ms: KHÔNG chạy được lượt yên nào — gate 0 FAIL mọi lần (replay #53 đình trệ, 0 hoạt động apt 65+ phút). Ngưỡng GIỮ nguyên trạng thái S5. Analyzer dry-run tái tạo đúng S5 (median 49,5 / p90 75,0, n=570). Nợ lượt yên theo dõi chuyển tiếp sang đợt 118.
- T6 Ghost seek: 0 seek mới (vẫn 60/80) — attempt1 kill (renderer bò), attempt2 hoãn gate A, attempt3 chết theo reboot #53, attempt4 không launch (replay đình trệ). Gộp 5/60 stale (8,3%), nhiễm 5/40 vs yên 0/20, Fisher p=0,1205 — H-D chưa phân biệt được; nợ lượt yên thứ hai dời nguyên vẹn.
- T7 EPERM: probe #36 ok=2 fail=0 (boot 22536366). **Mù #35 KHÔNG ĐÓNG HOÀN TOÀN** — 3 cửa sổ mở tổng 6h49'50", tối đa 24 reboot ẩn danh nghĩa; chuỗi 3 mù đóng liên tiếp (#32/#33/#34) đứt. **Gap #48→#49 = 2h03'00" ĐƯỢC CHỨNG NHẬN (CERT n=27→28, toàn chuỗi n=42→43).** Mù #36 mới mở (từ probe #36, 08:42:46Z), chứa #53. WFS lần 23 chênh 0 (722/203, R7b 747/220, copies 25/17). RAM max trong mù #35: 3.681 MB (60% guard); birefnet 0 lần. Đính chính prereg: đoạn A đóng nhờ đọc boot tươi của poller S10 #1, không phải nhờ sàn.
- T8 Hạ tầng: postboot #52 PASS; replay #52 kẹp (6'28", 8'44"] (khởi động muộn +6'28", cửa sổ cài 2'16"). Watcher v2 try#2 không kẹp được FAIL live (replay xong trước 83 s — độ trễ spawn subagent ~2,5' nuốt trọn cửa sổ). **Headroom boot #52 mới: 948→934→925 — reboot KHÔNG hồi (lần 2 liên tiếp).** Vite thường ENOSPC; vite tạm 200 + 0 inotify FD. postboot-check.sh f443dc5f→32a214bb (chỉ đổi tham chiếu #48→#52). #50/#51 chưa từng có postboot-check, log đã mất. Đề xuất R9 (a) vẫn mở — nhắc lần 3.
- T9 Seek/preload: bar FIX "đạt theo chữ" nhưng KHÔNG có ý nghĩa nhân quả (RING8 FAILED 0/5, CTL FAILED 1/5, Fisher p=1,0000; 0 wrap pull trong 14 run — cuộc đua không xảy ra ở cả 2 arm). **B-Q8-1 KHÔNG ĐẠT** (PAUSED 5/5 với trần 9,22 s; PLAYING 0/2 — chỉ tới [0,23,4]/[0,24,6] trong 20 s). Phát hiện mới: trần buffer bám theo max-size-bytes (9,22 s vs 17,421 s), không phải ring — ring 8 MiB đổi một bar lấy một bar khác. Mode lỗi không-do-wrap tái hiện lần 3 (CTL r3, 2 qtdemux cùng chết). Fallback HTTP 8/8. media.ts không đổi. **Đính chính T10: LIMITS T9 §0 viết preview.tsx 03bf029f "không đổi trước/sau mọi leg" là SAI với leg playing-clean — leg này chạy trên cây H3e af4d5753 (ổn định trước/sau leg); verdict không đổi.**
- T10 verify: **9/9 luồng về, 9/9 khớp số headline, 1 đính chính (T9 §0).** Suite cây gộp 27/27 exit 0 (boot #53, lock v2, RAM 922 MB); O8 Chromium 21/21 exit 0; **O8 WebKit exit=2 — BỊ CHẶN BỞI HẠ TẦNG** (replay #53 đình trệ → thư mục GST hệ thống không tồn tại; WebKit launch được, vite + bridge OK). preview.tsx 03bf029f không đổi. Reboot #53 (09:47:08Z, gap 1h17'56", trong dải chứng nhận) — giết poller T10 #1 + sleep session + driver T3 s80 + attempt3 T6 + launch F1 T2 (đều hồi phục/xong). Replay #53 đình trệ là nợ hạ tầng mới — parent quyết chính sách --repair (T5 §6: boot mới mà replay không tới trong ~15' thì luồng hạ tầng chạy --repair có kiểm soát).
- Chờ push thật sau đợt 117 (gồm closing): **67 batch / 130 entry / 111 file duy nhất** + 1 oversize 6,4 MB (benchmarks/results/webkit-blob-flaky-96x3.json). Đợt 117: 9 batch / 14 entry / 14 file duy nhất (0 thiếu, 0 binary, 0 workflow); 5 file oversize >37.768 B (probe117t2 68.311 B, probe117t3 48.898 B, webkit_blob_flaky_117t9_2mib.mjs 79.321 B, LIMITS T3 59.600 B, LIMITS T7 66.715 B).

## 47. Cập nhật sau đợt 118 (15–16/11/2026 — xem docs/PHASE9_ROUND118_LIMITS.md; T10 chết trước phase 2, parent đóng thay)

- T1 Lock v2: **đổi spec sang v2 XONG** (doc VCUT_VITE_LOCK_FREEZE_SPEC.md viết lại theo v2; script v2 chỉ đổi comment header, không đổi code hành vi; v1 frozen fd21193c làm sao lưu). Smoke live xanh; suite 8/9 hai lần (T7 FAIL B1=6 B2=6 — nhiễu môi trường theo T1, không liên quan đổi spec; theo dõi đợt 119).
- T2 Zombie H3f: chẩn đoán XONG — **H3f ĐÁNG LÀM** (S_store med 0,601, p90 0,951; R_new/same 4,10; first draw vào HELD 39/51 = 76%). Phát hiện M10: mỗi tick có HAI lần đọc video (storeHeldFrame + plainNativeSource) — H3f phải bỏ cả hai. Patch chuẩn bị (108 dòng, 5 hunks), CHƯA apply — đợt 119 apply + đo A/B. Caveat: 12/63 tick chậm zero video draw.
- T3 Điểm gãy tải: s79r1 GIỮ 83,5% @13,22; s79r2 TRUNG GIAN 79,0% @27,75 (tái hiện gần đúng s79 gốc 79,7% @26,98) — **vùng chuyển tiếp (21,07, 26,98] củng cố ở đầu trên; điểm gãy VẪN MỞ, GIỮ vững 19,63**. Nhiễu giữa các lượt ở tải ~12–13 lên tới 19,1 điểm (s79r1 83,5% vs s80b 64,4%). Giả thuyết throttle (load1 thấp = main thread đói) chưa chứng minh. Bar (b) kẹt 0/10.
- T4 WebKit ≤60 ms: lượt yên attempt8 (boot #55) 20/20 pass, **median 40,0 ms, p90 64,7 ms — tốt nhất trong các lượt yên**; lớp B 5/5; ngưỡng GIỮ. F6' 100%/100% (nTick=65), vẫn đóng. **Phát hiện event ghost frame 23 MỚI** (6 occ, 229 ms, lag max +9f) — luồng riêng chẩn đoán đợt 119. Attempt7 chết theo reboot #55 ở pass 12/20.
- T5 Ghost seek: **H-D ĐƯỢC ỦNG HỘ — ĐÓNG** (yên 0/60 vs nhiễm 5/40, Fisher một phía p=0,0087; tổng 100 seek — nợ ≥80 seek ĐÃ ĐÓNG). 2 event P4-type mới.
- T6 EPERM: probe #37 ok=2 fail=0; **mù #36 ĐÓNG HOÀN TOÀN**; **phát hiện GIÂY NHÁY — đồng hồ VM nhảy lùi 17–21 phút tại #54** (gap #53→#54 theo đồng hồ VM 1h01'18" là SAI, chứng nhận theo khoảng); WFS lần 24 chênh 0. Mù #37 đã mở (chứa #55 + các reboot sau).
- T7 Hạ tầng: replay #54 tới muộn, bracket (47'14", 52'30"]; postboot #54 PASS (không --repair); **headroom 804** (rơi tiếp, reboot không hồi). #50/#51 chưa từng có postboot-check, log đã mất.
- T8 Seek/preload: **trần bám max-size-bytes** (MSB4RB8 C=17,421 s = CTL; RING8 9,22 s là do max-size 2 MiB, không phải ring; ngoại lệ 1/3 run lên 27,02 s). **F2 thực chất là khởi động pipeline** (seeking→seeked 0,0 s; chế độ nhanh 539/627 ms trong bar cũ). Fallback n=1: hồi phục 0,94 s, 0 byte fetch lại. **Chromium 6/6 sạch — race blob đặc thù WebKitGTK.**
- T9 E4: **lô đo lớn ĐÃ ĐĂNG KÝ (10 lượt, 5 A + 5 B)**; lượt 1 ĐỂ TRỐNG, attempt 2 DEFER-LOCK (T3 giữ 1055 s); lô 0/10. E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN (hướng (a)).
- T10 verify: phase 1 xong (suite 27/27 exit 0, O8 Chromium 21/21 + WebKit 21/21 exit 0, boot #55) nhưng **chết trước phase 2** (không file mới sau 13:20Z; phiên chết theo reboot sau đó) — parent đóng thay: recount lại (9/16/16), tsc 0/0, vite build PASS 6,28 s. Phase-1 recount đếm thiếu (7 batch vì t4/t5 chưa stage). Reboot #55 (12:51:56Z, gap 2h03'30", trong dải). Chốt chặn không được tạo bởi lượt 15:35 lẫn 18:35 — parent tạo lại tay cả hai lần.

## 48. Cập nhật sau đợt 119 (16/11/2026 — xem docs/PHASE9_ROUND119_LIMITS.md; T10 chết vì timeout cron, parent đóng thay)

- T1 H3f: **apply + A/B XONG — H3f GIÚP, patch ĐƯỢC GIỮ** (preview.tsx 03bf029f→5be5a250; tick chậm 41→19 −53,7%, longtask-tổng −52,3% 131→67, draws-gap-tổng −58,0% 84→38; không hồi quy parity). Caveat chân B n=19 < n≥30 — parent CHẤP NHẬN (ngưỡng đo chính biến kết quả; hai chỉ báo còn lại đạt với biên).
- T2 E4: **lượt 2 (B, gop30) VOID** (0 steady-close/360 tick) — lô 1/10 (1 VOID, 0 CAUGHT). H1/H3 chưa phân định. E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN.
- T3 Điểm gãy: s79r3 GIỮ SÁT VẠCH 80,1% @24,80 vs s79r4 TRUNG GIAN 56,9% @27,35 — **nhiễu 23,2 điểm, lớn nhất từ trước; điểm gãy VẪN MỞ, GIỮ vững 19,63**. Bar (b) kẹt 0/12. **Quyết parent: TẠM DỪNG lặp s79 đơn lẻ** — đợt 120 điều tra nguồn nhiễu (giả thuyết throttle, đo cgroup) trước; nếu chạy s79 thì chạy lô ≥3 lấy trung vị.
- T4 WebKit: **0 lượt yên** (2 reboot + replay không cài GST; postboot FAIL 25/25 rồi 15/15). Ngưỡng GIỮ. Nợ hạ tầng mới: replay tới nhưng THIẾU GST chưa có luật xử lý.
- T5 Ghost frame 23: **chẩn đoán XONG — họ P4, KHÔNG hồi quy** (desync clock/display sau seek vòng lặp). Nợ chẩn đoán ĐÃ ĐÓNG.
- T6 EPERM: probe #38 ok=2 fail=0; **mù #37 KHÔNG ĐÓNG (B/C mở, 12h05'27")**; **gap #54→#55 = 2h03'30" ĐƯỢC CHỨNG NHẬN (CERT n=31, FULL n=46)**; **#56 ~20:17Z chỉ là ước lượng** (0 exec-log) — gap #55→#56 và #56→#57 KHÔNG vào FULL. WFS lần 25 chênh 0. RAM max trong mù 4.811 MB (78% guard, cao nhất từng thấy). EPERM 0 sóng thật.
- T7 Hạ tầng: boot 27c8b1d9, **replay NHANH (2'05", 7'34"]**, postboot PASS ×3, **headroom 670** (rơi tiếp); **chính sách repair 15' KHÔNG kích hoạt lần đầu áp dụng** (replay tới đúng hạn — hoạt động đúng thiết kế).
- T8 Bar F2: **định nghĩa mới tách hai pha ĐÃ ĐĂNG KÝ nhưng CHƯA CÓ VERDICT** (leg B dở 3/6, cần ≥6) — parent CHẤP NHẬN định nghĩa, CHƯA ÁP NGƯỠNG. Follow-up MSB4RB8 27,02 s dở dang (thiếu GST).
- T9 Lock v2: **suite T7 chạy lại 9/9 HAI LẦN — T7 FAIL đợt 118 là nhiễu môi trường, KHÔNG hồi quy**; **"KHÔNG NHẢ — owner '?'" là release thừa vô hại** (rc=1, không đổi trạng thái, lock vẫn trống đúng) — KHÔNG SỬA production, chỉ cải tiến thông báo đợt 120. Hai nợ theo dõi đợt 118 ĐÃ ĐÓNG.
- T10 verify: phase 1 xong (suite 27/27 exit 0, O8 Chromium 21/21 exit 0 ×2, WebKit exit=2 ×2 hạ tầng thiếu GST; recount 9/15/15) nhưng **chết vì timeout cron 02:35Z** (poller ghi cuối 02:29:33Z) — parent đóng thay: kiểm lại 9/9 headline, tsc 0/0, vite build PASS 8,15 s. Khung LIMITS gộp viết sẵn 02:26:33Z (bài học đợt 118 đã áp dụng). Reboot #58 00:53:41Z + #59 01:47:49Z. Chốt chặn ĐÃ TẠO lúc mở đợt 119 (khắc phục lỗi đợt 118); lượt 09:35 sẽ bỏ qua theo chốt chặn.

## 49. Cập nhật sau đợt 120 (16/11/2026 — xem docs/PHASE9_ROUND120_LIMITS.md; T10 đóng trong phiên, 9/9 — T3 về muộn 07:32Z, gộp muộn từ đĩa trước closing batch)
- T1 E4: lượt 3 (A, gop250) DEFER-POSTBOOT — 0 lượt đo được (chờ cờ T7 60', replay #60 không cài GST); lô vẫn 1/10 (1 VOID, 0 CAUGHT). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.
- T2 s79 nhiễu: **load1 KHÔNG đo tải thật trong cell này** (thí nghiệm hog: load1 0,45→0,30 trong khi PSI 1%→83,5%); tách rời load1↔threadsR trong mọi lượt dài cũ (9/9); load1 là sóng ~8,5 phút; **giả thuyết throttle BỊ BÁC cả hai chiều**. GIỮ vững 19,63 kèm caveat trục gãy. Hệ quả cho bar F2 chờ parent quyết (§12 LIMITS gộp).
- T3 bar F2: VỀ MUỘN 07:32Z, ĐÃ GỘP (9/9) — leg B ĐỦ 6 valid → VERDICT KHÔNG ĐẠT (chế độ chậm): T_startup 2 chế độ (nhanh 0,45/0,45/0,49 s; chậm 1,42/1,98/2,39 s); pha (a) KHÔNG ĐẠT, pha (b) seek thuần ĐẠT (T_seek 0,00 s 6/6; gộp 16/16 SEEKFAST); MSB4RB8 overshoot không tái hiện 0/3 (tần suất gộp 1/29). Mọi đo trên boot #61; boot #60: 0 run. Caveat: bộ 6 khác boot.
- T4 WebKit: 0 lượt yên hợp lệ; 1 lượt dở dang trên boot #61 (17/20 pass, kẹt writePartial — `await pwEval` không timeout, lỗ hổng thiết kế probe); lớp B vi phạm B5 (RAM 1012→440 MB). Ngưỡng ≤60 ms GIỮ. Số dở dang median 40,0 ms KHÔNG dùng để chốt ngưỡng.
- T5 EPERM: probe #39 ok=2 fail=0; **mù #38 KHÔNG ĐÓNG (G mở, lỗ 2h03'49")**; **PHÁT HIỆN MỚI: BƯỚC NHẢY CLOCK tại reboot #58** — clock bước lùi X ∈ [32, 332]s; **gap #57→#58 thành KHOẢNG [1h20'07", 1h25'39"] (mid 1h22'53"), CERT [4807, 5139]s**; gap #58→#59 = 54'08" CHỨNG NHẬN; CERT n=31→33, FULL n=46→48; gap #59→#60 và #60→#61 chỉ là SPAN. EPERM 0 sóng thật.
- T6 lock msg: chỉ sửa TEXT (cmd_release tách 2 nhánh in), guard/return 1 giữ nguyên; v2 5cac10af→cd0c05c1; T9 kiểm độc lập cả 2 bản. Nợ thông báo lock ĐÃ ĐÓNG.
- T7 Hạ tầng: boot #60? replay CHẠM MÀ KHÔNG CÀI (dpkg 2 dòng, 0/9 GST, watcher 60/60 FAIL, im 1h09'29"); postboot FAIL; headroom 545 (rơi tiếp, lần 5); đề xuất luật GST thiếu + nhắc R9 (a) lần 6. T7 sửa postboot script (vá K1, bash -n OK). **Boot #61 (06:50:58Z, gap #60→#61 2h05'09" SPAN): replay CHẠY NHANH (bracket (0'40", 5'41"], 1509 dòng), postboot PASS** — chế độ lỗi không ổn định theo boot.
- T8 G1: evidence #11 — chân yên 30fps n=40 PASS 36/40 (90%), median 0,950×, chuỗi PASS yên 34 (dài nhất); M2 chỉ còn khung (a) không đạt được (20 lần đầu cố định, tối đa 15/20); mọi khung khác đã đạt. Harness mirror workaround L8 (watch.ignored) vào 2 file, pixel khớp lịch sử 13/13. G1 VẪN MỞ, chờ user quyết khung (a).
- T9 Lock v2: 0 zombie, 0 cổng lắng nghe, lock TRỐNG sau boot #60, kiểm cả 2 bản lock script. KHỎE.
- T10 verify: suite 27/27 exit 0; **O8 Chromium 21/21 + WebKit 21/21 exit 0** (WebKit xanh lại nhờ postboot PASS boot #61); đếm lại cuối đợt 120 = 10 batch / 18 entry / 18 file (gồm T3 gộp muộn + closing); lũy kế 111–120 = 97 batch / 183 entry / 154 file + 1 oversize 6,4 MB. Reboot #61 giết poller + phiên T10 (SIGTERM ~06:51Z); T10 chạy lại 06:52Z (RESTART), phase 2 ngay trong phiên, đóng trước hạn cứng 07:45Z. Chốt chặn đã xóa khi đóng đợt.

## 50. Cập nhật sau đợt 121 (16/11/2026 — xem docs/PHASE9_ROUND121_LIMITS.md; T10 đóng trong phiên, 9/9 — reboot #63 giữa đợt, T2 gộp từ đĩa)
- T1 E4: lượt 4 (B, gop30) DEFER-POSTBOOT — 0 lượt đo được. **Đính chính T10:** postboot thực tế ĐÃ PASS từ 09:27:19Z (T5 ghi POSTBOOT_PASS 09:28Z); T1 chờ sai đường cờ — prereg đăng ký cờ trong `round121-t7/` (hạ tầng đợt 120), đợt 121 hạ tầng là T5, cờ ở `round121-t5/`. Lô vẫn 1/10 (1 VOID, 0 CAUGHT). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN. Lượt 3 + lượt 4 đều treo — chờ quyết parent (chạy bù lượt 3 hay bỏ; thứ tự).
- T2 PSI: **định nghĩa trục tải PSI v0.1 ĐÃ VIẾT + pilot xong.** PSI cpu.some avg60 phân biệt được mức tải (0 hog ~11% · 2 hog 72,2% · 6 hog 91,1% · 12 hog 94,9%), bão hòa trên ~6 hog; load1 nói ngược (6 hog → 0,07). Band tạm thời: Yên <30% · Vừa 30–80% · Nặng >80%. Leg B chạy tiếp theo DEF mới từ đợt 122 (prereg template đã stage).
- T3 WebKit: **sửa probe writePartial xong (timeout 30 s, giữ tickCost cuối) + 1 lượt yên HỢP LỆ: 20/20 pass, lớp B 5/5, median 52,0 ms, p90 80,0 ms.** Ngưỡng ≤60 ms GIỮ (lượt yên lần 3: 49,5 / 40,0 / 52,0). Nợ probe kẹt đợt 120 ĐÃ ĐÓNG.
- T4 EPERM: probe #40 ok=2 fail=0; **mù #39 I ĐÓNG, J MỞ, K ĐÓNG — KHÔNG ĐÓNG** (2h56'14"); **gap #60→#61 = 2h05'09" ĐƯỢC CHỨNG NHẬN; gap #61→#62 = 1h34'49" chỉ SPAN; CERT n=33→34, FULL n=48→49; mù #38 G thử cuối — VẪN MỞ, không thử lại nữa. PHÁT HIỆN MỚI: BƯỚC NHẢY CLOCK tại reboot #63** (lần thứ 3: #54, #58, #63); gap #62→#63 = 27'18" SPAN, chưa chứng nhận (mù #40).
- T5 Hạ tầng: boot #62? replay chạy xong 08:52:06Z (1509 dòng) rồi reboot 08:53:05Z; boot #63? replay chết dạng (B) → **luật replay-chết §8.2 kích hoạt LẦN ĐẦU + `--repair` chạy sống LẦN ĐẦU: PASS** (09:14:14Z→09:26:57Z, exit 0; POSTBOOT_PASS "nhờ repair" xác nhận độc lập 5 lần); **headroom hồi 0 → 5436**. Postboot script vá K1.
- T6 lock: **KHỎE** sau boot #62 — 0 zombie, 0 tiến trình sót, 0 cổng lắng nghe, lock trống, 0 ticket + 38 cooldown; housekeeping cooldown 38 file / 532 byte (chỉ đo, không prune).
- T7 F2 pha (a): **chế độ chậm KHÔNG TÁI HIỆN trên boot #63 (0/8 run nhanh, T_startup 0,421–0,911 s, median 0,527)**; pha (b) vẫn ĐẠT (24/24 run T_seek ≤ 1 ms). H1 không được ủng hộ, H2 không tương quan (|r| ≤ 0,23), H3/H4 bị loại, H5 xác nhận là nhiễu đo (~0,14 s), H6 không tương quan. **Nguyên nhân gốc vẫn CHƯA PHÂN ĐỊNH ĐƯỢC** (độ trải dải nhanh 0,42–0,91 s, gấp 2,2×). Verdict KHÔNG ĐẠT đợt 120 vẫn đứng. Không có fix.
- T8 H3f: **verdict "GIÚP" KHÔNG còn đứng → TRUNG TÍNH.** Chân B gộp 122/1377 = 8,9% vs A 41/391 = 10,5% → −15,5%, không đạt bar −25% (CI 0,59–1,20 chứa 1,0); longtask −20,6% (vừa đủ bar, biên mỏng). Gộp 5 run +79,7% nhưng trộn 3 boot + tải anh em — không đọc là hại. **Phát hiện chính: nhiễu giữa các lượt nuốt chửng hiệu ứng** (tick chậm/run: 19, 74, 29, 133, 131; SD 48,4). Patch vẫn giữ trên cây — chờ quyết parent (giữ/gỡ/đo thêm).
- T9 Vite harness: **mirror L8 cho 140/140 file** (mỗi file 1 dòng đổi), node --check 140/140 PASS; smoke 132 PASS + 7 thiếu fixture + 1 timeout (vite đã lên) → vite lên 133/140, **0 ENOSPC**. Đối chứng: config thường chết ENOSPC, có mirror thì VITE ready 1688 ms. Đường đo không đổi (4 lần chạy đầy đủ khớp lịch sử). 25 harness config mặc định chưa mirror được — nợ.
- T10 verify: suite 27/27 exit 0; **O8 Chromium 21/21 + WebKit 21/21 exit 0** (WebKit xanh nhờ postboot PASS sau repair); đếm cuối đợt 121 = 10 batch / 159 entry / 159 file (gồm closing); lũy kế 111–121 = 107 batch / 342 entry / 311 file + 1 oversize 6,4 MB. **Reboot #63 (08:53:05Z, gap #62→#63 27'18" SPAN)** giết poller + phiên T10; T10 chạy lại 08:54:31Z (RESTART), phase 2 ngay trong phiên, đóng trước hạn cứng 10:45Z. Chốt chặn đã xóa khi đóng đợt.

## 51. Cập nhật sau đợt 122 (16/11/2026 — xem docs/PHASE9_ROUND122_LIMITS.md; T10 đóng trong phiên, 9/9 — reboot #65 giữa đợt, T4 về muộn 13:46Z trong cửa chờ recount; false-trigger poller 11:40Z đã sửa)
- T1 E4: lượt 3 (A, gop250) att2 DEFER-POSTBOOT — chờ đủ 60' (11:39–12:39Z), không cờ PASS nào; 0 lượt đo. Lô vẫn 1/10. T2/lượt 4 cần quyết parent trước khi đo (cây đã đổi).
- T2 E4: lượt 4 (B, gop30) att2 KHÔNG ĐẾM — att1 bị reboot #65 giết giữa lúc chờ cờ; att2 tự STOP exit 4 ở cổng md5 (cây baseline 03bf029f ≠ H3f 5be5a250 kỳ vọng). 0 phép đo. Lô vẫn 1/10. Cần quyết parent: đo trên baseline hay apply lại H3f.
- T3 H3f: **A/B có kiểm soát TRUNG TÍNH → ĐÃ GỠ PATCH THẬT khỏi cây 12:02:56Z** (theo quyết parent đợt 121 §12.2). A gộp 58/896 = 6,47% vs B gộp 49/938 = 5,22% → −19,3% (CI 0,552–1,180), longtask −0,9% — không đạt bar nào; pháp y không ủng hộ patch (S_store B không thấp hơn A); tải cân bằng theo PSI, load1 nói ngược (A 6,50 vs B 1,34). h3f.patch giữ nguyên để apply lại nếu parent quyết. Cây hiện baseline 03bf029f.
- T4 leg B: **DEFER-POSTBOOT, 0 run** — gate không qua cả 2 boot (#64 postboot FAIL 11:37–12:52Z; #65 replay 2→599 dòng rồi kẹt từ ~13:27Z, postboot FAIL tới poll #25 13:44:01Z; chờ gate ~2 giờ, 46 poll). Bộ đo DEF v0.1 dựng xong + validate trên dữ liệu đợt 121; 6 attempt còn nguyên. Verdict KHÔNG ĐẠT đợt 120 vẫn đứng.
- T5 Hạ tầng: boot #64? replay khởi động muộn +30'21" rồi **KẸT ở apt-get update 64+ phút — CHẾ ĐỘ LỖI MỚI (C) "sống nhưng kẹt"** (dpkg.log đóng băng 2 dòng, lists 111 file, partial im từ 11:41:39Z; mirror khỏe HTTP 200). Luật §8.2 KHÔNG kích hoạt (apt còn sống) → KHÔNG repair; postboot FAIL suốt lượt. **Headroom 4440 → 4552** (giảm ~900 so với #63? 5436).
- T6 lock: **KHỎE** sau boot #64 — 0 zombie, 0 ticket + 42 cooldown; suite /tmp 9/9 PASS lần thứ 4 liên tiếp; script không đổi.
- T7 EPERM: probe #41 ok=2 fail=0 (11:38:49Z, boot 3fe7e89e); **mù #40 A ĐÓNG, B MỞ, C ĐÓNG — KHÔNG ĐÓNG** (2h58'04"); **gap #62→#63 = [27'18", 30'33"] ĐƯỢC CHỨNG NHẬN DẠNG KHOẢNG** (nhân chứng thứ hai cho bước nhảy clock tại #63); **CERT n=34→35, FULL n=49→50**; gap #63→#64 = 2h12'13" chỉ SPAN; mù #39 J kiểm lại VẪN MỞ. Không sóng EPERM thật (sóng gần nhất ~11:55–12:11Z 11/11). Quét writeFileSync lần 28: chênh 0 (lần thứ 28 liên tiếp).
- T8 Vite harness: **mirror L8 cho 25/25 harness config mặc định còn lại** (node --check 25/25, smoke 25/25 PASS); config mirror sao y hệt production + chỉ thêm `watch: { ignored: ["**/**"] }`, KHÔNG thêm `hmr: false`; vite mặc định giữ 1.613 watch vs mirror 0. **Đính chính:** trên boot #64 ENOSPC không tái hiện (headroom hồi ~63.733) — mirror là phòng ngừa.
- T9 WebKit: **lượt yên #4 KHÔNG CHẠY ĐƯỢC** (chặn hạ tầng 2 boot: #64 37 poll + #65 10 poll, gate 0 không bao giờ đạt). Ngưỡng ≤60 ms GIỮ (3 lượt yên hợp lệ trước vẫn đứng: 49,5 / 40,0 / 52,0).
- T10 verify: suite 27/27 exit 0; **O8 Chromium 21/21 exit 0 + WebKit exit=2** (kẹt sau S2 do hạ tầng — postboot FAIL boot #65, GST thiếu; T10 kill sau 8' không tiến triển, không retry). Đếm cuối đợt 122 = 10 batch / 40 entry / 40 file (gồm closing); lũy kế 111–122 = 117 batch / 382 entry / 349 file + 1 oversize 6,4 MB. **Reboot #65 (12:53:25Z, gap #64→#65 ~1h48')** giết poller + phiên T10; T10 chạy lại 12:54:31Z (RESTART). **Sự cố false-trigger 11:40Z:** poller còn sót ngưỡng số 1015 → kích hoạt phase 1 ở 0/9; đã kill, sửa 1015→1345, khởi động lại. Phase 1 kích hoạt bằng tay 13:42:10Z lúc 8/9 (sau kiểm đĩa: T4 vắng thật); T4 về 13:46Z trong cửa chờ recount → đủ 9/9. Chốt chặn đã xóa khi đóng đợt; cờ round122-t10.done ĐÃ TẠO.

## 52. Cập nhật sau đợt 123 (16/11/2026 — xem docs/PHASE9_ROUND123_LIMITS.md; T10 đóng trong phiên, 9/9 — reboot #67 giữa đợt, poller viết mới không false-trigger; WebKit O8 21/21 lần đầu sau nhiều đợt)
- T1 E4: lượt 3 att3 (A, gop250) VOID (đếm được) trên baseline — lượt đếm ĐẦU TIÊN trên baseline. Probe 14:50:14–14:50:48Z exit 0, velTicks=428, tailSteadyClosed=0, drift >0,35 sau seek: 0 lần (max 0,1475). Lô → 2/10. Postboot PASS #66 14:48:41Z (boot +23m58). Reboot 14:52:19Z xảy ra SAU lượt.
- T2 E4: lượt 4 att5 (B, gop30) VOID (đếm được) trên baseline; att4 KILLED-REBOOT. Probe 15:00:28–15:01:03Z exit 0, velTicks=447, tailSteadyClosed=0, drift >0,35: 0 lần (max 0,1102). Lô → 3/10 (0 CAUGHT, 3 VOID). Cặp A+B baseline đều VOID — H1/H3 vẫn chưa có cặp CAUGHT-RESEEK. **Luật STALE mới:** cờ postboot chỉ tính khi chứa đúng boot_id hiện tại (vá trong run-t2.sh, verify sống; T4 áp dụng cùng luật).
- T3 mù #39 J: **VẪN MỞ, lần kiểm sâu thứ 3** (10 góc mới: birth/atime/ctime/dir-mtime/.git/syslog/lịch sử cron scheduler/đối chiếu mù đã đóng; quét v2 605.910 file, mtime/atime/ctime/birth trong đuôi J đều 0; session chạm đuôi 0/264). 2 lượt cron trong đuôi J đều là skip phía scheduler, không dấu vết trên VM. repo-1 KHÔNG có .git; system log boot #61 đã mất. **Đề nghị ĐỂ MỞ** như #35/#37, không kiểm lại từ trong VM nữa — chờ quyết parent.
- T4 leg B: **6/6 VALID trên cây baseline, boot #67, bar F2 ĐẠT trên bộ này** (median T_startup 0,337 s, p90 0,656 s; T_seek max 0,001 s; band Yên avg60 4,38–13,14%). **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (khác cây với bộ verdict — luật (i) đòi cùng boot + cùng cây). Cần quyết parent: 3 cửa (a) giữ verdict / (b) xét lại theo luật (ii) / (c) leg mới trên cây H3f. DEF v0.2: ngưỡng Yên <30% GIỮ; tickRate chỉ báo đói. 2 lỗi sửa trước khi đo (psi_avg60 grep sai, PASS SAI sau reboot).
- T5 Hạ tầng: **#66? PASS 14:48:41Z (boot +23m58) rồi CHẾT sau 27p36** (reboot 14:52:19Z); **#67? replay NHANH, PASS +7m00 (14:59:19Z)**, đang sống. Replay boot #65? KHÔNG tự hoàn thành (dừng 14:01:09Z). **Luật repair dạng (C) đánh giá lần đầu: KHÔNG kích hoạt** (cả 2 replay đều tiến triển). Headroom 4447 → 2830 → 4533. postboot-check.sh cập nhật 2 lần.
- T6 lock: **KHỎE** — 0 zombie, 0 ticket + 44 cooldown (616 B); log +24 dòng khớp từng con số; suite /tmp 9/9 PASS lần thứ 5 liên tiếp; script không đổi.
- T7 EPERM: probe #42 ok=2 fail=0 (14:44:29Z, boot 9bbda390); **mù #41 (11:38:49Z → 14:44:29Z, 3h05'40") ĐÓNG HOÀN TOÀN**; **gap #64→#65 = [1h48'17", 1h50'17"] CHỨNG NHẬN DẠNG KHOẢNG**; **gap #65→#66 = 1h31'18" CHỨNG NHẬN DẠNG ĐIỂM**; gap #63→#64 VẪN SPAN (mù #40 B kiểm lại VẪN MỞ); **CERT n=35→37, FULL n=50→52**; gap #66→#67 danh nghĩa 27'36" thuộc mù #42, chờ probe #43. Không sóng EPERM thật (sóng gần nhất ~122h41' trước probe #42). Quét writeFileSync lần 29: chênh 0 (lần thứ 29 liên tiếp).
- T8 Vite harness: **mirror L8 còn nguyên 25/25 md5 khớp**; phủ nốt 4 file chỉ tiêu thụ config khác (2 thừa hưởng + 68v2 mirror tay config ngoài repo — không stage được + 57n9 thêm khối tự ghi config mirror); smoke sweep mẫu 13/13 PASS; **kiểm kê lại: 201/201 harness vite dev đã phủ mirror**. **Đính chính:** headroom thật chỉ ~2.830 watch (probe trực tiếp T5 trên cả 2 boot), không phải 63.733 — mirror là điều kiện để chạy được, không chỉ phòng ngừa.
- T9 WebKit: **lượt yên #5 KHÔNG CHẠY ĐƯỢC** (gate A không mở — RAM host bị ghim ~474–576 MB, 3 attempt, 30 poll). Ngưỡng ≤60 ms GIỮ (3 lượt yên hợp lệ trước vẫn đứng: 49,5 / 40,0 / 52,0). Gate 0 boot #67 ĐẠT sau khi sửa dương tính giả (0c) sang pgrep -x. Nợ chuyển đợt 124.
- T10 verify: suite 27/27 exit 0; **O8 Chromium 21/21 exit 0 + WebKit 21/21 exit 0** (WebKit FULL PASS lần đầu sau nhiều đợt — nhờ postboot PASS boot #67). Đếm cuối đợt 123 = 10 batch / 15 entry / 15 file (gồm closing); lũy kế 111–123 = 127 batch / 397 entry / 362 file + 1 oversize 6,4 MB. **Reboot #67 (14:52:19Z, gap #66→#67 27'36")** giết poller + phiên T10; T10 chạy lại 14:53:21Z (RESTART). **Poller viết mới từ đầu, chỉ trigger 9/9 — KHÔNG false-trigger.** Phase 1 kích hoạt tự động 9/9 lúc 15:43:21Z. **Đính chính batch T9:** file batch ban đầu ghi đường dẫn tuyệt đối — T10 đã sửa về tương đối trước recount cuối. Chốt chặn đã xóa khi đóng đợt; cờ round123-t10.done ĐÃ TẠO.

## 53. Cập nhật sau đợt 124 (16/11/2026 — xem docs/PHASE9_ROUND124_LIMITS.md; T10 đóng trong phiên, 9/9 — không reboot trong đợt, poller viết mới không false-trigger; WebKit O8 21/21 lần thứ hai liên tiếp)
- T1 E4: lượt 5 att2 (A, gop250) VOID (đếm được) trên baseline; att1 KILLED-HARNESS (probe exit=2, pause-seek tCanvas=null sau 30 s — cùng dạng lỗi lượt 1 att1 đợt 118). Probe 17:48:37–17:49:20Z exit 0, velTicks=293, tailSteadyClosed=0, drift >0,35 sau seek: 0 lần (max 0,2375). Pause-seek 1423/1473 ms — chậm nhất từ trước tới nay, vẫn confirmed. Lô → 4/10. Tải lúc att1 vọt load 6,62 đúng lúc T3 quét toàn workspace song song (tương quan, không chứng minh nhân quả).
- T2 E4: lượt 6 att1 (B, gop30) VOID (đếm được) trên baseline. Probe 17:53:54–17:54:30Z exit 0, velTicks=433, tailSteadyClosed=0, drift >0,35: 0 lần (max 0,2288). Pause-seek 524/578 ms — nhanh nhất trên baseline từ trước tới nay. Sự kiện MỚI: resyncsV + restartV đổi thêm ở tick 74 cuối clip (ct=ph=5,9, drift 0) — resync/restart cuối clip, không phải re-seek, không đổi verdict. Lô → 5/10 (0 CAUGHT, 5 VOID). Cặp A+B đợt 124 đều VOID — H1/H3 vẫn chưa có cặp CAUGHT-RESEEK. Lượt tiếp theo: lượt 7 (A, gop250, e4a7).
- T3 mù #40 B: **VẪN MỞ, lần kiểm tra thứ 3** (9 góc mới: birth/atime/ctime/dir-mtime/lịch sử cron scheduler/nội dung file JSON 10:42:19Z/2 thư mục tool-output/log probe v2/nhật ký memory/danh sách đông lạnh; quét v2 606.207 file, mtime/atime/ctime trong đuôi đều chỉ 1 file JSON đã biết, birth 0, session chạm đuôi 0/294). Chi tiết mới duy nhất: 2 thư mục tool-output rỗng dirmtime 10:42:19.785/.788Z — quan sát cuối dời +0,37 s, đuôi còn 1.378,2 s > sàn. Gap #63→#64 VẪN SPAN. **Khuyến nghị ĐỂ MỞ** như #35/#37/#39, không kiểm lại từ trong VM nữa — chờ quyết parent.
- T4 leg tải F2: **Vừa 6/6 VALID + Nặng 6/6 VALID trên cây baseline, boot #68, 12/12 run, 0 VOID** (gate ĐẠT poll #1). T_startup median Vừa 1,843 s (6/6 chậm) / Nặng 2,219 s (6/6 chậm) vs Yên đợt 123 median 0,337 s (0/6 chậm) — **chế độ chậm TÁCH THEO BAND** (ranh giới nằm giữa avg60 ~13% và ~66%, chưa xác định chính xác). tickRate mean Yên 71,50 / Vừa 18,54 / Nặng 16,77 — **tách 2 mức (nhàn ~70+ vs đói ~15–20), KHÔNG tách Vừa↔Nặng**; gộp 3 band (n=18): r(avg60,tickRate)=−0,97, r(avg60,T_startup)=+0,87, r(avg60,threadsR)=+0,98. T_seek max 0,000 s ở cả 18 run — miễn nhiễm với tải. Ngưỡng band v0.1 ĐỨNG. **Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** (cửa (a)). Dữ liệu đã đủ viết DEF v0.2 — chờ quyết parent.
- T5 Hạ tầng: **boot #68? replay NHANH, PASS +8m12 (17:42:03Z)** — nhanh thứ 3 từ trước tới nay; 0 reboot giữa lượt (lượt đầu tiên kể từ đợt 121 không phải xử lý reboot giữa chừng). **2 gói từng thiếu ở #65? (plugins-bad + libav) ĐỀU ĐƯỢC CÀI — nợ đóng theo hướng một lần duy nhất.** **Luật repair dạng (C) đánh giá lần 2: KHÔNG kích hoạt** (replay đã xong trước khi T5 bắt đầu). Headroom 4438 → 4430 → 4415 (ổn định ~4430). RAM dao động mạnh 1017–3540 MB, không ghim phẳng. postboot-check.sh sửa 1 lần (chỉ tham chiếu boot, md5 f684bb6b→457fdec7). Số thứ tự #68? CHƯA CHẮC.
- T6 lock: **KHỎE** — 0 zombie, 0 ticket + 48 cooldown (672 B); log 512 dòng lúc kiểm, 147/147 cặp ACQUIRED→RELEASED, 0 đang giữ; 10 chu kỳ đợt 123 sau snapshot đều sạch (round 123 khép lại sạch trên lock); 0 TIMEOUT/STALE-LOCK mới từ đợt 120; 0 sự kiện "KHÔNG NHẢ" trên lock thật đợt 120/121/122/123/124 (tới 17:44Z); suite /tmp 9/9 PASS lần chạy 2 (lần 1 T7 flaky 8/9 — tính flaky đã biết, ghi rõ cả hai lần).
- T7 EPERM: probe #43 ok=2 fail=0 (17:43:19Z, boot 69359761); **mù #42 KHÔNG ĐÓNG HOÀN TOÀN (A + C đóng, B mở, 2h58'50", tối đa 3 ẩn)** — đoạn A đóng bằng cửa sổ sàn RỖNG (470 s < sàn 1.147 s) + poller/gate0-wait; đoạn C đóng bằng uptime trực tiếp; đoạn B mở (đuôi 4.503 s trống hoàn toàn). **Gap #66→#67 = [27'06", 28'28"] CHỨNG NHẬN DẠNG KHOẢNG** (cận nhảy X ∈ (−30, +52) s, 0 nhân chứng nhảy; caveat F67 chưa kiểm + quy ước cận trên cần parent xác nhận); **CERT n=37→38, FULL n=52→53**; **mù #43 MỚI MỞ (gap #67→#68 = 2h41'32" VẪN SPAN)**. **RAM max 4.576 MB (76% guard, CAO NHẤT TỪ TRƯỚC)** — birefnet KHÔNG chạy (vẫn dưới guard 6 GB; cần parent quyết có thử lại không). Quét writeFileSync lần 30: chênh 0 (lần thứ 30 liên tiếp). Không sóng EPERM thật (sóng gần nhất ~11:55–12:11Z 11/11).
- T8 Vite harness: **68v2 ĐÃ SỬA BỀN VỮNG (tự ghi config mirror, +7/−2 dòng, md5 5f74da1e…)** — nợ đợt 123 ĐÃ ĐÓNG; **kiểm lại 201/201 harness vite dev đã phủ mirror (199 tự ghi + 2 thừa hưởng + 0 config ngoài repo)**; mirror L8 25/25 còn nguyên sau reboot #68; smoke sweep 14/14 PASS (0 watch, 0 ENOSPC).
- T9 WebKit: **lượt yên #5: 0 LƯỢT YÊN HỢP LỆ** — attempt2 chạy 20/20 nhưng lớp B VI PHẠM (B1 load5 cuối 4,62 + B2 load1 max 7,82; median tickCost 107,0 ms — lượt NHIỄM TẢI do thí nghiệm tải Lc8-f2s của T4 chạy song song); attempt1/3 gate A không mở (load chặn; RAM đa số poll ≥1024 MB — vấn đề đã chuyển từ RAM sang LOAD). Ngưỡng ≤60 ms GIỮ (3 lượt yên hợp lệ trước vẫn đứng: 49,5 / 40,0 / 52,0). **Điều tra RAM ghim 30' đầu lượt: XONG — tiến trình ghim KHÔNG nhìn được từ trong VM → DỪNG** (RAM dao động 882–3431 MB, áp lực host-level ngoài cell; cgroup memory.pressure = 0,00). Nợ lượt yên lần 5 CHUYỂN TIẾP sang đợt 125.
- T10 verify: suite 27/27 exit 0; **O8 Chromium 21/21 exit 0 + WebKit 21/21 exit 0** (WebKit FULL PASS lần thứ hai liên tiếp — nhờ postboot PASS boot #68). Đếm cuối đợt 124 = 10 batch / 15 entry / 15 file (gồm closing); lũy kế 111–124 = 137 batch / 412 entry / 375 file + 1 oversize 6,4 MB. **Không reboot trong đợt** — poller + waiter T10 không cần RESTART (lần đầu tiên kể từ đợt 121). **Poller viết mới từ đầu, chỉ trigger 9/9 — KHÔNG false-trigger.** Phase 1 kích hoạt tự động 9/9 lúc 18:31:47Z (poll #10). Chốt chặn đã xóa khi đóng đợt; cờ round124-t10.done ĐÃ TẠO.
## 54. Cập nhật sau đợt 125 (16/11/2026 — xem docs/PHASE9_ROUND125_LIMITS.md; T10 đóng trong phiên, 9/9 — 2 reboot: #68→#69 lúc mở đợt, #69→#70 giữa lượt 20:54:19Z; WebKit O8 21/21 lần thứ ba liên tiếp)
- T1 E4: lượt 7 att2 (A, gop250) VOID (đếm được) trên baseline, boot #70. Probe 20:59:51–21:00:51Z exit 0, velTicks=292, tailSteadyClosed=0. Pause-seek 1806/1871 ms — chậm nhất từ trước tới nay, vẫn confirmed. Drift >0,35 sau seek ban đầu lần đầu trên baseline: 14 lần (tick 12–34, max 0,6068 ở tick 17, 3 tick liên tiếp cùng vượt 12–14) — KHÔNG phải re-seek (không đổi resyncsV, không sampler seeking run sau run ban đầu), là playhead tụt sau currentTime ~4,5 s đầu phát; sau tick 35 drift lắng. att1 KILLED-REBOOT trên boot #69 (không đếm). Lô → 6/10.
- T2 E4: lượt 8 att2 (B, gop30) VOID (đếm được) trên baseline, boot #70. Probe 21:11:54–21:12:27Z exit 0, velTicks=480 (nhiều nhất trên baseline), tailSteadyClosed=0. Pause-seek 266/315 ms — nhanh nhất trên baseline từ trước tới nay (lượt 7 att2 chậm nhất 1806/1871 ms — cùng boot #70, cách nhau ~11 phút). Drift >0,35: 0 lần (max 0,1139) — cụm drift 14 lần của lượt 7 KHÔNG lặp lại, không phải đặc tính hệ thống. Sự kiện resync/restart cuối clip lượt 6 tick 74 KHÔNG lặp lại. att1 KILLED-REBOOT trên boot #69 (không đếm). Lô → 7/10 (0 CAUGHT, 7 VOID). H1/H3 vẫn chưa có cặp CAUGHT-RESEEK. Lượt tiếp theo: lượt 9 (chờ quyết parent — quyết đợt 124 chỉ duyệt tới lượt 7).
- T3 scheduler: 2 lượt thiếu CÓ THẬT (HB 17:50:50 + DR 18:00 +07 16/11); mẫu hệ thống HB thiếu 36/136 slot, DR thiếu 38/138 slot (+1 mới DR 03:00+07 17/11). Nguyên nhân khả dĩ nhất: drop phía scheduler — VM down không giải thích được (cả 2 job đều có bản ghi chạy trong gap VM-down đã chốt); giả thuyết VM bận BỊ BÁC (0/38 + 0/36 lượt thiếu trùng build-loop đang active, nền 37/100); feed-pulse 0 thiếu, vcut-build-loop 0 slot thiếu. Nợ: cơ chế drop chi tiết cần bằng chứng ngoài VM; không điều tra tiếp từ trong VM bằng cùng phương pháp.
- T4 DEF v0.2 + leg GAP: DEF v0.2 XONG (280 dòng, giữ ngưỡng 3 band; tickRate = chỉ báo đói 2 mức; ranh giới chưa xác định, khoảng trống avg60 13–66%). Leg trung gian 6/6 VALID trên boot #70: 2 hog, dial TARGET-MISS 25,98%, run means avg60 52,75–53,99% (mean 53,19% — browser/vite cộng thêm ~27 điểm so với dial). T_startup median 1,2635 s, p90 1,421 s, chậm 4/6, nhanh 2/6 → TRỘN → ranh giới chuyển NẰM NGAY QUANH ~53% (dải, không phải đường sắc). tickRate ở ~53% là 28,07–29,47 (mean 28,52) — mức THỨ BA, tách rõ khỏi nhàn ~71,5 và đói ~15–20 → quy tắc "2 mức" của v0.2 KHÔNG còn đúng, cần DEF v0.3 (≥3 mức). Tương quan gộp n=24: r(avg60,tickRate)=−0,959; r(avg60,T_startup)=+0,864; r(avg60,threadsR)=+0,979; trong GAP phẳng. Pha (b) T_seek max 0,001 s — miễn nhiễm giữ ở n=24. Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.
- T5 Hạ tầng: boot #69? (670c07f6, btime 20:35:11Z) CHẾT replay sau ~19–20' — dpkg.log đóng băng 2 dòng suốt đời boot, postboot FAIL 14/14, chế độ "chạm mà không cài" giống #60? lần thứ 2. Reboot giữa lượt ~20:54:19Z sang boot #70? (310f07e4, btime 20:54:19Z): replay CHẠY, PASS +5m02 (20:59:21Z), dpkg 2→1509 dòng, 2 gói từng thiếu ở #65? đều được cài. Luật repair dạng (C) đánh giá lần 3: KHÔNG KÍCH HOẠT. Headroom 4318→3645; RAM khả dụng 1140→1788 MB (tất cả < 6 GB guard — birefnet không thử). Postboot-check sửa 2 lần (chỉ tham chiếu boot).
- T6 lock: KHỎE — đợt 124 khép sạch 18/18/18 (log 512→577 dòng, ghép cặp 165/165, 0 đang giữ, 0 TIMEOUT/STALE-LOCK mới từ đợt 120); 0 zombie, 0 ticket + 52 cooldown; 0 sự kiện "KHÔNG NHẢ" thật đợt 120–124. Suite /tmp 9/9 ×2 lần chạy — lần đầu từ đợt 120 không có lần T7 flaky ở lần 1. Đề xuất luật prune cooldown (xóa file mtime >7 ngày mỗi lượt; trần mềm 100 file) — chờ quyết parent, KHÔNG tự xóa. Tuân thủ lock đợt 125 chưa kiểm được lúc 20:46Z (chưa luồng nào dùng lock thật) — T6 đợt 126 kiểm tiếp.
- T7 EPERM: probe #44 ok=2 fail=0 (20:45:03Z, boot 670c07f6). Mù #44 MỚI (17:43:19Z→20:45:03Z, 3h01'44"): KHÔNG ĐÓNG HOÀN TOÀN (D mở, E đóng, tối đa 5 ẩn); đoạn D đuôi 5.899 s sau mốc cuối 18:56:52Z, 0 session bắc qua cắt D-hi, 0 file trong đuôi ở cả 4 phạm vi; đoạn E đóng bằng uptime trực tiếp. Gap #68→#69 = 3h01'20" VẪN SPAN. CERT giữ n=38, FULL giữ n=53. Mâu thuẫn brief: nhiệm vụ kiểm sâu mù #42 đoạn B trùng mù #43 đã chấp nhận để mở (quyết §12.4 đợt 124) — T7 tuân luật cứng, KHÔNG kiểm lại; chờ quyết parent giữ §12.4 hay quyết mới ghi đè. Reboot #70 giữa phiên (20:54:19Z) không ảnh hưởng mù #44; gap #69→#70 danh nghĩa 1.148 s — chỉ hơn sàn 1 s. Mù #45 MỚI MỞ (từ probe #44). EPERM sweep 0 sóng thật (sóng gần nhất ~11:55–12:11Z 11/11). WFS lần 31 chênh 0. RAM max trong mù #44: 3.431 MB (57% guard) — birefnet KHÔNG chạy.
- T8 Vite harness: 4/4 ĐÓNG — 82j3 check config xong (+4 dòng, kiểm chứng 2 chiều); 7 harness EXIT:2 đợt 121 → 7/7 exit 0 (76d8 11/11, r80h4 3/3, r81i4 3/3, 81i7/84l10/85m4/86n2 chromium exit 0); libevent ĐÃ HẾT (replay #70 cài libevent-2.1-7t64); 68v2 8/8 pass (sửa TMPDIR → /tmp/round68-v2/tmp do socket path >108 ký tự + sửa selector hint H1). 25 file config mặc định chưa mirror — chờ quyết parent. Nợ: chạy 84l10/85m4/86n2 nhánh webkit với GST env + display mới.
- T9 WebKit: lượt yên #5 — 1 LƯỢT YÊN HỢP LỆ, ĐÃ ĐÓNG NỢ (attempt1 20/20 pass, tickCost median 47,5 ms, p90 70,0, n=614; lớp B 5/5 ĐẠT; ngưỡng ≤60 ms GIỮ; lượt yên hợp lệ thứ 4: 49,5 / 40,0 / 52,0 / 47,5). Reboot cắt giữa chừng 20:54:19Z (gate0-wait + poller chết theo boot cũ); khởi động lại trên boot #70, gate A mở poll 4 (21:08:29Z), probe 21:08:29–21:11:52Z exit 0; T4 chờ cờ T9 đúng hẹn — cửa yên sạch, khác đợt 124. Đo RAM baseline idle (ngoại lệ một lần): trang preview idle ~800 MB (WebKit ~689–728 MB + vite ~99 MB); nợ đợt 120 §9.4 ĐÓNG. Nợ sửa sampler ĐÃ SỬA + VERIFY (dừng ~1 s sau node thoát, không mẫu hậu đo).
- T10 verify: suite 27/27 exit 0 (21:42:05–21:45:54Z); O8 Chromium 21/21 exit 0 (21:47:21Z) + WebKit 21/21 exit 0 (21:48:11Z) — WebKit FULL PASS lần thứ ba liên tiếp. Không reboot trong lúc đóng. Đếm cuối đợt 125 = 10 batch / 17 entry / 17 file (gồm closing); lũy kế 111–125 = 147 batch / 429 entry / 389 file + 1 oversize 6,4 MB. Phương pháp đếm chốt tại LIMITS gộp §9.2 (entry NUL trong file paths theo đợt + dedup) — ba số 807 / 811 / 8.706 trong đợt dùng phương pháp khác nhau, đã ghi rõ, chỉ số 147/429/389 là chính thức. Chốt chặn đã xóa khi đóng đợt; cờ round125-t10.done ĐÃ TẠO.

## 55. Cập nhật sau đợt 126 (17/11/2026 — xem docs/PHASE9_ROUND126_LIMITS.md; T10 đóng trong phiên, 9/9 — reboot #70→#71 giữa đợt 125 đóng và lượt này, 23:25:41Z; WebKit O8 21/21 lần thứ tư liên tiếp)
- T1 E4: lượt 9 att1 (A, gop250) **CAUGHT-NO-RESEEK — lượt bắt được ĐẦU TIÊN của lô** (lượt 1–8: 0 CAUGHT) trên baseline, boot #71. Probe 23:45:50–23:46:43Z exit 0, velTicks=196, tailSteadyClosed cuối=1 (0→1 ở tick 17, t=3078 ms, drift 0,4985; giữ 1 tới tick cuối 195). Pause-seek 1296/1362 ms. KHÔNG có drift re-seek sau steady-close (resyncsV giữ 1 sau tick 2, restartV cuối=0, sampler chỉ 1 seeking run — seek ban đầu); drift đóng ở tick 35 vì ph NHẢY LÊN (+0,2667 trong 1 tick), không phải seek. Ứng viên re-seek tick 35 của analyzer là dương tính giả của heuristic |ct−ph|; bar H1/H3 không áp được; chỉ số chính VẮNG — lượt này KHÔNG quyết H1/H3. **Caveat: drift >0,35 sau seek ban đầu 14 lần, trong đó 10 tick SAU steady-close (19–33) vẫn vượt 0,35 mà không có re-seek** — chưa có cơ chế giải thích. Lô → 8/10.
- T2 E4: lượt 10 att1 (B, gop30) VOID (đếm được) trên baseline, boot #71. Probe 00:01:06–00:01:40Z exit 0, velTicks=441, tailSteadyClosed=0. Pause-seek 143/193 ms — nhanh nhất trên baseline từ trước tới nay (lượt 8: 266/315 ms, lượt 9: 1296/1362 ms, lượt 7 att2: 1806/1871 ms chậm nhất). Drift >0,35: 0 lần (max 0,1602). Đối chiếu độc lập bằng analyze-t2.py trên probe-results.json của T1 — tái hiện đúng CAUGHT-NO-RESEEK lượt 9. **LÔ KHÉP 10/10 (1 CAUGHT-NO-RESEEK, 9 VOID). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN** — H1/H3 không phân định; không còn lượt E4 nào trong lô, chờ quyết parent.
- T3 scheduler: 3 slot thiếu MỚI (HB 05:20:50 + HB 05:50:50 + DR 06:00 +07 17/11); lũy kế HB 38/142, DR 40/141; vcut-build-loop 0 slot thiếu; không bằng chứng mới về cơ chế drop (cả 3 slot thiếu nằm trong gap #70→#71 nhưng trong cùng gap có slot chạy bình thường; không có build-loop nào active tại giờ thiếu).
- T4 DEF v0.3 + leg 45–55%: **DEF v0.3 XONG** (dải chuyển ~45–60%, tickRate ≥3 mức, dial bằng browser ấm §4.7). Leg 45–55% 6/6 VALID trên boot #71: 2 hog, dial ấm TARGET-HIT warm-up #1 (W = 45,74%), run means 39,47–48,00% (mean 45,98%); T_startup median 1,227 s, p90 1,403 s, chậm 3/6 TRỘN → **dải chuyển mới ~46–53%** (vùng trộn quan sát được). tickRate ở ~46% là 31,32–33,36 (mean 32,01) — mức trung gian tái hiện + mở rộng, đường cong 5 điểm (n=30): 71,5 @ ~7% → 32,0 @ ~46% → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91%. **Dial ấm THÀNH CÔNG VƯỢT TIÊU CHÍ: sai số 0,24 điểm** (tiêu chí ≤5; dial lạnh đợt 125 sai ~27 điểm). **Caveat: chậm/nhanh xen kẽ hoàn hảo từng run (p ngẫu nhiên ≈3%)** — không loại trừ nhiễu xen kẽ. Pha (b) T_seek max 0,001 s — ĐẠT. Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.
- T5 Hạ tầng: boot #71? (ff7afbbb, btime 23:25:41Z) **PASS +18m17s** — replay khởi động muộn +9m59s nhưng xong nhanh +12m05s, trọn vẹn (dpkg 2→1509 dòng, 217 installs). Postboot PASS 10/10, 0 FAIL. **Luật §8.2 dạng (B) ngưỡng 10' áp dụng lần đầu: đánh giá 8/8 poll, KHÔNG kích hoạt** (điều kiện thời gian ĐẠT từ poll 3 nhưng postboot PASS + replay xong — luật không bắn nhầm). 2 gói từng thiếu ở #65? đều được cài. Headroom 3451→3434 (xu hướng giảm dài hạn tiếp tục: 4438→4318→3645→3451→3434). RAM thấp nhất mới 834 MB (poll 1) — dưới mức 987 MB đợt 125. Postboot-check sửa 1 lần (chỉ tham chiếu boot). Số thứ tự #71? CHƯA CHẮC. R9 (a) nhắc lần 12.
- T6 lock: **KHỎE** — 0 zombie, 0 ticket; 12 chu kỳ mới sau snapshot đợt 125 đều sạch (178/178 cặp, 0 đang giữ); tuân thủ lock đợt 125 sạch — ĐÓNG NỢ. **Luật prune cooldown áp dụng lần đầu: xóa 0 file** (không file nào >7 ngày; file cũ nhất mới ~2,2 ngày tuổi), còn 57 file/798 B. **Caveat: đếm thô lúc mở "60 file" vs đếm chính xác 56 — chênh 4 chưa giải thích.** Mù #37 vẫn mở (gap #70?→#71 VẪN SPAN, đuôi mù 1h29'50" không quan sát).
- T7 EPERM: probe #45 ok=2 fail=0 (23:42:06Z, boot ff7afbbb). **Mù #44 đoạn D kiểm sâu MỘT LẦN DUY NHẤT với 5 góc mới VẪN MỞ — 0 quan sát mới thật → ĐỂ MỞ theo quyết parent, KHÔNG kiểm lại nữa.** **Mù #45 MỚI (20:45:03Z→23:42:06Z, 2h57'03"): F đóng, G1 mở, G2 đóng; tối đa 4 ẩn.** **Gap #69→#70 = 1.148 s CHỨNG NHẬN DẠNG ĐIỂM; CERT n=38→39, FULL n=53→54** (gap chứng nhận ngắn nhất từ trước tới nay, chỉ hơn sàn 1 s). Gap #70→#71 = 9.082 s VẪN SPAN. **Mù #46 MỚI MỞ.** #71 tới TRONG dải cơ học p10–p90 (lần đầu sau 2 lần ngoài dải liên tiếp). Không sóng EPERM thật (sóng gần nhất ~11:55–12:11Z 11/11, ~131h47' trước probe #45). WFS lần 32 chênh 0. RAM max 2.240 MB (37% guard) — birefnet KHÔNG chạy.
- T8 Vite harness: **84l10/85m4/86n2 nhánh webkit 3/3 exit 0 — ĐÃ ĐÓNG NỢ đợt 125** (Xvfb mới :196 + GST env; không kẹt W2, không crash "Target crashed" như đợt 125). Fixture /tmp tạo lại, md5 khớp đợt 125 (8 ký tự đầu). **Mirror 25/25 còn nguyên sau reboot #71; kiểm kê 237 file, 0 mới, 0 mất; phủ 201/201 harness.** tsc-web exit 0, vite build exit 0. 25 file config mặc định KHÔNG LÀM GÌ theo quyết parent đợt 125 §12(d).
- T9 WebKit: **lượt yên #6 — 1 LƯỢT YÊN HỢP LỆ (attempt2 20/20 pass, tickCost median 44,0 ms, p90 71,6, n=615; lớp B 5/5 ĐẠT) — lượt yên hợp lệ thứ 5: 49,5 / 40,0 / 52,0 / 47,5 / 44,0. Ngưỡng ≤60 ms GIỮ.** Attempt1 gate A không mở sau 10 poll (T8 giữ lock + load5 2,19–3,83). Cờ mở leg T4 touch 00:09:01Z, T4 warm-up #1 00:11:13Z — phối hợp đúng hẹn. **Event lag ≥+5f MỚI: 1 event (seq 276–279, frame 27, lag tới +10f) — KHÔNG khớp event cũ, chuyển T5 chẩn đoán; (c2) lệch nhãn +1f tái hiện lần thứ 3 liên tiếp.** Nợ gate0-wait 60 phút ĐÃ SỬA (30 poll × 2 phút); gate 0 đạt ở poll #2.
- T10 verify: suite 27/27 exit 0 (00:31:11–00:35:03Z, RAMavail 459 MB); **O8 Chromium 21/21 exit 0 (00:36:41Z) + WebKit 21/21 exit 0 (00:37:34Z) — WebKit FULL PASS lần thứ tư liên tiếp.** Không reboot trong lúc đóng. Ghi chú: script verify copy từ đợt 125 còn trỏ LOG về file đợt 125 — T10 đã trích đúng đoạn suite đợt 126 sang file log đợt 126 và sửa đường dẫn; số đo không ảnh hưởng. Đếm cuối đợt 126 = 10 batch / 15 entry / 15 file (gồm closing); lũy kế 111–126 = 157 batch / 444 entry / 404 file + 1 oversize 6,4 MB. Chốt chặn đã xóa khi đóng đợt; cờ round126-t10.done ĐÃ TẠO.
## 56. Cập nhật sau đợt 127 (17/11/2026 — xem docs/PHASE9_ROUND127_LIMITS.md; T10 đóng trong phiên, 9/9 — 2 reboot: #71→#72 lúc mở đợt 02:10:17Z, #72→#73 giữa đợt 03:04:25Z; WebKit O8 21/21 lần thứ năm liên tiếp)
- T1 E4: phân tích bàn giấy lượt 9 (KHÔNG đo mới) — **CÙNG KIỂU: 10 tick sau-đóng vượt 0,35 (19–21, 23, 25, 29–33) cùng kiểu "tụt-rồi-đuổi-kịp" như tick 35** (4 đợt đóng tick 22, 24, 26, 34 + đóng cuối tick 35; Δct đóng 0,0333–0,0763, Δph 0,2000–0,2667 bình thường, resyncsV không đổi, sampler seeking=False; tick mở drift Δct 0,3220–0,4333, tách bimodal sạch). Lượt 7 đối chiếu 9/9 cùng kiểu — **tổng 14/14, 0 SEEK, 0 kiểu khác**. **Đính chính cơ chế đợt 126:** "ph NHẢY LÊN" → "ct chững lại sau burst, ph đuổi kịp ở tốc độ bình thường". Verdict **giữ ĐÓNG CÓ ĐIỀU KIỆN** (H1/H3 không phân định); phân loại CAUGHT-NO-RESEEK được LÀM MẠNH. Nhưng chú thích prereg §2 ("drift sau steady-close không bao giờ vượt 0,35 xác nhận 2 tick liên tiếp") là **SAI SỰ THẬT** — drift vượt 10 tick gồm 2 đợt 2+ tick liên tiếp; đề nghị parent đính chính (§12(a)).
- T2 DEF: **DEF v0.3.1 XONG** (32.555 B; không probe đo mới, không sửa production; v0.3 nguyên vẹn md5 bc596806…). Dải chuyển ~45–60% → **vùng trộn quan sát được ~46–53%**; tickRate mức trung gian ~28,5 → **khoảng ~28–33** (32,01 @ ~46% + 28,52 @ ~53%); **dial bằng browser ấm lên protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH** (sai số 0,24 điểm; dial lạnh đợt 125 sai ~27 điểm); caveat xen kẽ hoàn hảo MỚI (S-F-S-F-S-F, p ≈3%); hold 90 s làm run 1 leo dốc — khuyến nghị hold ngắn hơn. Verdict KHÔNG ĐẠT đợt 120 VẪN ĐỨNG.
- T3 leg kiểm tra xen kẽ: **12/12 VALID — XEN KẼ KHÔNG LẶP LẠI** (dãy con dial S-F-F-S-F-S; run 2 nhanh → run 4 nhanh liên tiếp; tính run 4 là chậm vẫn S-F-S-S-F-S — không xen kẽ hoàn hảo). **Tỉ lệ chậm: dial 3/6, Yên 0/6.** Nhóm dial TRỘN ở run means 30,83–41,48% (mean 35,99%; W chỉ 32,36%, TARGET-MISS-LOW trên boot mới) — **vùng trộn quan sát được MỞ RỘNG thành ~31–53%** (run 6 CHẬM 1,702 s @ 31,52% vs run 4 NHANH 1,195 s @ 31,67%). Ngưỡng Yên <30% ĐỨNG. **Dial ấm sai số 3,63 điểm (ĐẠT, tiêu chí ≤5)** trên mean cả leg; biến thể chỉ run ổn định cho 7,92 điểm (KHÔNG ĐẠT). **Hold 30 s CÓ TÁC DỤNG** (run 1 mean 41,40%, không leo dốc). tickRate dial 31,68–33,01 (mean 32,44) tái hiện; Yên 70,54–72,80 (mean 71,57). Tương quan gộp n=36: r(avg60,tickRate)=−0,906; r(avg60,threadsR)=+0,967. Reboot #72 chết giữa đợt giết gatewaiter + watcher; gate ĐẠT poll #14 (03:46:46Z); driver 03:47:15–04:08:13Z trên boot #73, exit 0. Caveat: cờ round127-t9-done KHÔNG phải lượt yên hợp lệ — chỉ mở leg tải.
- T4 EPERM: probe #46 ok=2 fail=0 (02:41:09Z, boot 81464315). **Mù #46 MỚI (23:42:06Z 16/11 → 02:41:09Z 17/11, 2h59'03"): A mở, B đóng; tối đa 4 ẩn.** Đoạn A MỞ (đuôi 4.793 s sau mốc cuối 00:50:24Z, 0 file trong đuôi ở cả 4 phạm vi); đoạn B ĐÓNG (uptime trực tiếp + dấu boot tươi). **Gap #71→#72 = 9.876 s VẪN CHỈ LÀ SPAN; CERT n=39 / FULL n=54 KHÔNG ĐỔI.** #72 tới TRONG dải cơ học p10–p90 (lần thứ hai liên tiếp trong dải). **Replay #72 KHÁC HÌNH DẠNG: dpkg.log chỉ 350 dòng** (trước đây 1.509), bắt đầu +25m22 sau boot, kết thúc cùng gói gstreamer1.0-tools — giao T5 xem lại. Prereg lỗi số học gap (~8.910 s là độ dài đoạn A; gap thật 9.876 s) — sửa công khai, verdict không đổi. Không sóng EPERM thật (sóng gần nhất ~11:55–12:11Z 11/11, ~134h46' trước probe #46). **WFS lần 33 chênh 0** (850 dòng / 238 file; R7b 875/255; copies 25/17). RAM max 2.551 MB (42% guard) — birefnet KHÔNG chạy. **Mù #47 MỚI MỞ** (từ probe #46) — việc của đợt 128; #73 thật 03:04:25Z đã nằm trong dải cơ học [02:42:25Z, 05:01:21Z].
- T5 Hạ tầng: **boot #72? CHẾT dạng (A) sau 54m08s** (replay muộn +25m22s, installs chỉ 48/217, lists `noble` gốc KHÔNG VỀ → dep closure vỡ; §8.2 dạng (A) đủ 5/5 lúc 03:03:30Z; --repair 03:04:31Z bị CELL REBOOT ~03:04:3xZ giết giữa chừng; không có cờ PASS cho #72?). **Boot #73? PASS +5m51s** (btime 03:04:25Z; replay xong +4m57s, 1509 dòng, 217 installs; try1 PASS 03:10:16Z; cờ POSTBOOT_PASS 03:11:16Z). §8.2 (B) + luật (C) đánh giá mỗi poll cả 2 boot, không kích hoạt sai. **Chẩn đoán event lag seq 276–279 + (c2):** renderer khỏe (presented==expected, ct real-time); strip đông cứng ở pixels frame 27 (Hamming 0) 6 tick (275–280) trong khi nhãn tiến 17→30; **(c2) +1f GIẢI THÍCH ĐƯỢC** (nhãn gán lúc đọc currentTime, pixels lấy mẫu muộn hơn median 38 ms ≈1,1 frame; phân phối pix−label: 0:265, +1:175, +2:175); chi tiết "frame tương lai" chưa giải thích được — giữ event làm case theo dõi, không phải hồi quy sản phẩm. Headroom #73? 3317→3315 (chuỗi giảm dài hạn 4438→3315; ngưỡng báo user <~1.800). RAM thấp nhất mới 547 MB. R9 (a) nhắc lần 13.
- T6 lock: **KHỎE** — 0 zombie, 0 stale, 0 cổng nghe; ghép cặp 195/195, 0 đang giữ; cửa sổ R120: 117=117=117; round 126 khép sạch (14 chu kỳ, hold dài nhất t8 250s). **Prune cooldown lần 2: xóa 0 file** (0 ứng viên >7 ngày; **số chính thức 63 file/882 B**). **Mù #37 vẫn mở** (gap #71→#72 SPAN, đuôi 1h25'10").
- T7 scheduler: **2 slot thiếu MỚI, đều DR** (08:00 + 09:00+07 17/11); **HB 0 thiếu mới** (6/6 có). Lũy kế **HB 38/148, DR 42/145** (đính chính mẫu số DR đợt 126 141→142). **HB 08:20:50 muộn kỷ lục +1251 s** (phá mẫu "muộn ~:35:38 trước vcut dispatch" — start thực 01:41:41Z, không lượt vcut nào gần đó; dị thường dispatch, không phải slot thiếu). vcut-build-loop 0 slot thiếu; không build-loop nào active tại giờ thiếu — giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác. Không bằng chứng mới về cơ chế drop.
- T8 Vite harness: **84l10/85m4/86n2 nhánh webkit: 2/3 exit 0** (84l10 + 86n2 PASS trên boot #73); **85m4 TIMEOUT 124** — P1/P2 PASS rồi **kẹt ở P3, không một dòng log nào từ 03:14:45Z tới lúc bị kill** (15 phút, vượt cả worst-case lý thuyết ~10 phút); nguyên nhân chưa chứng minh được (RAM lúc kẹt ~325–361 MB là nghi phạm, chưa chứng minh). Boot #72: 0/3 ở cả 2 lần chạy (thiếu lib hệ thống: libevent/libavif; lỗi hạ tầng, không phải lỗi sản phẩm). **Mirror 25/25 còn nguyên sau cả 2 reboot; kiểm kê 237 file, 0 mới, 0 mất; phủ 201/201 harness.** tsc-web exit 0, vite build exit 0 (mỗi boot một lần).
- T9 WebKit: **lượt yên #7 — KHÔNG CHẠY ĐƯỢC, 0 probe** (3/3 attempt gate A không mở: attempt1 T8 giữ lock vite + RAM 790→253 MB; attempt2 RAM 187–871 MB; attempt3 RAM kẹt 500–684 MB suốt 10 phút, không lần nào ≥1024 MB). **Ngưỡng ≤60 ms GIỮ** (5 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0). Nợ lượt yên lần 7 chuyển tiếp đợt 128. Cờ mở leg T3 touch 03:46:18Z (chỉ mở leg tải, không phải lượt yên hợp lệ). (c2)/event lag: KHÔNG CÓ DỮ LIỆU đợt này (0 probe).
- T10 verify: suite 27/27 exit 0 (04:22:18–04:26:05Z, RAMavail 483 MB, boot #73); **O8 Chromium 21/21 exit 0 (04:28:00–04:28:53Z, sau 1 lần rerun vì Xvfb :197 còn sót của T3 — lần 1 exit=2) + WebKit 21/21 exit 0 (04:26:16–04:27:11Z) — WebKit FULL PASS lần thứ năm liên tiếp.** Không reboot trong lúc đóng. Bài học: script verify copy giữa các đợt phải sửa cả đường dẫn LOG bên trong — T10 đã kiểm trước khi chạy, không ghi nhầm file đợt cũ. Đếm cuối đợt 127 = 10 batch / 15 entry / 15 file (gồm closing); lũy kế 111–127 = 167 batch / 459 entry / 419 file + 1 oversize 6,4 MB. Chốt chặn đã xóa khi đóng đợt; cờ round127-t10.done ĐÃ TẠO.

## 57. Cập nhật sau đợt 128 (17/11/2026 — xem docs/PHASE9_ROUND128_LIMITS.md; T10 đóng trong phiên, 9/9 — reboot #73→#74 giữa đợt 127 đóng và lượt này, 04:55:04Z; WebKit O8 21/21 lần thứ sáu liên tiếp)
- T1 DEF: **DEF v0.4 XONG** (42.715 B; theo quyết parent đợt 127 §12(b); không leg đo mới, không sửa production; v0.3.1 nguyên vẹn md5 02fe8218…). **Dải chuyển ~46–53% → vùng trộn quan sát được ~31–53%** (trộn đã quan sát ngay tại ~31%: run 6 CHẬM 1,702 s @ 31,52% vs run 4 NHANH 1,195 s @ 31,67%); **xen kẽ KHÔNG lặp lại (S-F-F-S-F-S)** — nhiễu trình tự đo đã loại trừ; tickRate trung gian ~28–33 tái hiện lần thứ ba (32,44 @ ~36%); **hold 30 s sau warm-up là protocol CHUẨN**; **caveat dial ấm ambient-thấp MỚI** (sai số toàn-leg 3,63 điểm ĐẠT nhưng run ổn định 7,92 điểm KHÔNG ĐẠT); ngưỡng Yên <30% ĐỨNG kèm lưu ý biên mỏng 0,83 điểm; khoảng (53%, 65,75%) CHƯA CÓ DỮ LIỆU. Đính chính kèm: §11 v0.3.1 ghi "TRỘN 3/3" — số đúng là **TRỘN 3/6** (file cũ giữ nguyên). Verdict F2 đợt 120 VẪN KHÔNG ĐẠT. DEF v0.5 chỉ viết khi có dữ liệu mới.
- T2 EPERM: probe #47 ok=2 fail=0 (05:42:21Z, boot c279cf46). **Mù #47 ĐÓNG HOÀN TOÀN (A+B+C) — mù đóng hoàn toàn đầu tiên kể từ mù #41:** 02:41:09Z → 05:42:21Z (3h01'12"), 2 reboot đã chốt giờ (#73 03:04:25Z + #74 04:55:04Z) + 0 ẩn. **Gap #72→#73 = [3.238 s, 3.258 s] + gap #73→#74 = [6.629 s, 6.649 s] CHỨNG NHẬN DẠNG KHOẢNG** (biên ±10 s của T5, vì F73 chưa từng đo trực tiếp). **CERT n=39 → n=41 / FULL n=54 → n=56.** #73 và #74 đều tới TRONG dải cơ học (lần thứ ba và thứ tư liên tiếp trong dải). Prereg dự báo đoạn B "có thể mở" là SAI — thực tế B đóng nhờ 3 quan sát muộn không lường trước (file đóng đợt: LIMITS gộp 127, prereg-e4batch.md đính chính, build-loop-log.md). **Mù #48 MỚI MỞ** (từ probe #47) — việc của đợt 129. **Replay #74 trở lại 1.509 dòng → #72 (350 dòng) là NGOẠI LỆ MỘT LẦN** — nợ theo dõi §12(i) đợt 127 ĐÓNG. **Quét writeFileSync lần 34: 856 dòng / 240 file, chênh 0 (lần thứ 34 liên tiếp).** Sóng EPERM gần nhất vẫn ~11:55–12:11Z 11/11 (~137h47' trước probe #47); EPERM vẫn KHÔNG được tuyên bố là đã hết. RAM max trong mù #47: 2.558 MB (42% guard); birefnet KHÔNG chạy.
- T3 85m4 webkit: **chạy lại exit 0, P3 KHÔNG kẹt (06:06:44–06:08:58Z, boot #74, 134 s)** — P1/P2/P3/P4×3/P5 đều PASS, report JSON ok=true, consoleErrs=[]. **Nợ đợt 127 ĐÓNG.** Nhưng heartbeat hb128 chưa được thử lửa (không lần chờ nào vượt 5 s); **nguyên nhân kẹt đợt 127 VẪN CHƯA CHỨNG MINH** — một lần chạy sạch chỉ loại trừ "kẹt tất định". RAM lúc chạy 1.145–1.988 MB (rộng hơn hẳn cửa sổ kẹt đợt 127: ~325–361 MB) — tương quan PHÙ HỢP giả thuyết RAM nhưng KHÔNG PHẢI bằng chứng. Xếp lịch lệch đúng hẹn: chờ cờ T4 (06:06:25Z) mới chạy harness. Bản hb128 mới (33.777 B, chỉ thêm heartbeat, file gốc không sửa) giữ lại làm công cụ chẩn đoán. Fixture tạo lại sau reboot, md5 khớp đủ 32 ký tự.
- T4 WebKit: **lượt yên #7 chạy lại — VẪN KHÔNG CÓ LƯỢT YÊN HỢP LỆ (đợt thứ hai liên tiếp).** Attempt1 median 75,0 ms (lớp B vi phạm — T2 chạy phân tích mù chồng lên cửa sổ đo); attempt2 median 63,0 ms (lớp B vi phạm — chỉ 1 mẫu load1 4,18 do chính stack đo); attempt3 DỞ DANG 16/20 pass-timeout (median dở dang 55,0 ms, lớp B 5/5 ĐẠT, rAF kẹt 120 s). **Ngưỡng ≤60 ms GIỮ** (5 lượt yên xác nhận, trung bình 46,6 ms). Nợ lượt yên lần 7 chuyển đợt 129. **B2 (load1 ≤4) là điểm nghẽn thực tế** — parent xem xét lại định nghĩa (§12(a) LIMITS gộp). **(c2) +1f tái hiện 3 lần** (seq 364, 102, 295 — cùng chữ ký cũ) — dữ liệu mới cho T5 đợt 129. **Event lag ≥+5f: 0 occurrence** — event seq 276–279 không tái hiện. F6' vẫn ĐÃ ĐÓNG. Gate 0 ĐẠT poll #1; gate A mở poll 1 cả 3 attempt. tsc apps/web exit 0.
- T5 hạ tầng: boot #73 CHẾT trong khung (04:28:53Z, 04:55:04Z] (tuổi 1h24m28s–1h50m39s); **boot #74 PASS +47m52s** (replay 1.509 dòng, 217 installs, lists noble đầy đủ, postboot PASS 4/4, cờ POSTBOOT_PASS 05:42:56Z). §8.2 (B) + luật (C) đánh giá mỗi poll, KHÔNG kích hoạt. **R9 (a) vẫn chờ user (nhắc lần 14).** Headroom 3.214 → 3.203 → 3.205 trong lượt; RAM 1.071–1.535 MB. Sửa postboot-check.sh 1 lần (md5 c9e2f827… → b3e35169…, chỉ đổi tham chiếu boot).
- T6 lock: **KHỎE** — trống sau boot #74; 0 zombie, 0 stale, 0 cổng nghe; ghép cặp 216/216, 0 đang giữ; cửa sổ R120: 138=138=138. **Round 127 khép sạch trên lock** (24 TICKET = 24 ACQUIRED = 24 RELEASED, 0 TIMEOUT/STALE-LOCK; 85m4 hold 900 s — hold dài nhất từng ghi — vẫn nhả sạch qua trap). **Prune cooldown lần 3: xóa 0 file** (0 ứng viên >7 ngày; **số chính thức 67 file/938 B** lúc 05:41Z; file cũ nhất đủ 7 ngày ~21/11 18:38Z). **Xvfb :197 sót đợt 127 đã mất theo reboot #74** (không phải do driver dọn); luật đứng "mỗi driver tự kill Xvfb của mình" đã có trong code driver T4 (cleanup SIGKILL) và ý thức phòng ngừa của T10.
- T7 scheduler: **1 slot thiếu MỚI, DR 12:00+07 17/11 (05:00Z)**; **HB 0 thiếu mới** (6/6 có). Lũy kế **HB 38/154, DR 43/148** (tỉ lệ 24,7% / 29,1%). Slot thiếu nằm giữa hai lượt vcut, không trùng build-loop đang active; trong cùng giờ thiếu heartbeat vẫn chạy bình thường — giả thuyết "VM bận / build-loop chiếm slot" vẫn bị bác. Không bằng chứng mới về cơ chế drop.
- T8 kiểm chứng độc lập: **PASS** — đính chính prereg §2 đúng quyết parent đợt 127 §12(a) (khớp từng điểm; câu cũ chỉ còn dạng trích dẫn gắn nhãn SAI SỰ THẬT); mọi số DEF v0.3.1 truy được về dữ liệu gốc (30 run, khớp chính xác); F1/F2 siêu thay do dữ liệu leg T3 (DEF v0.4 đã xử lý); **F3 sai số nhỏ: mean avg60 nhóm Yên-127 đúng 10,10% (T3 ghi 10,27%)** — không đổi kết luận nào; T1 đã dùng ~10% trong DEF v0.4 nên không mâu thuẫn. Verdict E4 ĐÓNG CÓ ĐIỀU KIỆN không mâu thuẫn với phân tích T1 (tính lại từ JSON thô khớp hoàn toàn; lượt 7 không bao giờ steady-close — chỉ là đối chiếu).
- T9 headroom: **3.212** (đo lặp 3.211) — tiếp tục giảm từ 3.315 cuối đợt 127 (−103, −3,1%); chuỗi dài hạn 4.438 → 3.212 (−27,6%). **Chưa tới ngưỡng báo user (< ~1.800)**, còn 1.412; gấp ~2,0 lần số watch vite thường cần. RAM max quan sát 1.557 MB; **birefnet KHÔNG chạy** (guard 6 GB không đạt, chỉ bằng ~25%). 0 ENOSPC ngoài lần dừng có chủ đích của probe K8.
- T10 verify: suite 27/27 exit 0 (06:13:25–06:18:04Z, RAMavail 983 MB, boot #74); **O8 Chromium 21/21 exit 0 (lần đầu, không rerun — display :197 trống) + WebKit 21/21 exit 0 (06:19:09–06:20:05Z) — WebKit FULL PASS lần thứ sáu liên tiếp (đợt 123–128).** Không reboot trong lúc đóng. Lock TRỐNG lúc đóng (0 ticket + 69 cooldown, 966 B). Socket sót X193/X194/X195 (0 process) đã dọn tay lúc đóng. Đếm cuối đợt 128 = 10 batch / 14 entry / 14 file (gồm closing); **lũy kế 111–128 = 177 batch / 473 entry / 427 file duy nhất** (dedup toàn cục; đã tái kiểm 111–127 = 167/459/415 khớp đính chính đợt 127 §12.2(j) — KHÔNG phải 419). Chốt chặn không tồn tại (không còn để xóa); cờ round128-t10.done ĐÃ TẠO.

## 58. Cập nhật sau đợt 129 (17/11/2026 — xem docs/PHASE9_ROUND129_LIMITS.md; T10 đóng trong phiên, 9/9 — reboot #75→#76 GIỮA LUỘT lúc 09:02:12Z, lần đầu tiên; WebKit O8 21/21 lần thứ bảy liên tiếp)
- T1 kiểm chứng độc lập đợt 128: **mọi claim lớn PASS** (DEF v0.4 dải ~31–53% truy được về JSON thô; đính chính TRỘN 3/3 → 3/6 đúng; mù #47 ĐÓNG HOÀN TOÀN; gap #72→#73 = [3.238 s, 3.258 s] + #73→#74 = [6.629 s, 6.649 s]; CERT n=41 / FULL n=56; đếm cuối 177/473/427; T3 85m4 exit 0; T5 boot #74 PASS +47m52s; T4 lượt yên #7 a1 75,0 / a2 63,0 / a3 dở dang 55,0). **3 sai số nhỏ mới (F-129-1/2/3), không đổi verdict:** F-129-1 mean Yên-127 10,27% vẫn còn trong DEF v0.4 §3 (số đúng 10,10% — DEF v0.5 ghi 10,10%, không sửa v0.4); F-129-2 script đếm double-count khi chạy lại verbatim sau khi file closing tồn tại (178/475 thay vì 177/473 — T10 đợt 129 đã sửa glob loại `*-closing.txt`); F-129-3 LIMITS gộp đợt 128 bị sửa sau khi đóng (58.942 B vs 57.018 B ghi trong §10.3, mtime 06:24:30Z sau cờ t10.done — không mâu thuẫn nội dung).
- T2 EPERM: probe #48 ok=2 fail=0 (08:39:55Z, boot 475406f6). **Mù #48 KHÔNG ĐÓNG HOÀN TOÀN (A mở, B đóng, tối đa 2 ẩn)** — đoạn A mở (đuôi 2.941 s > sàn 1.147 s, 0 quan sát trong đuôi ở cả 4 phạm vi); đoạn B đóng (uptime trực tiếp). **Gap #74→#75 = 8.307 s (2h18'27") VẪN SPAN; CERT giữ n=41 / FULL giữ n=56.** Replay #75 đủ 1.509 dòng (217 installs) — baseline giữ 3 boot liên tiếp. **Mù #49 MỚI MỞ.** Quét writeFileSync lần 35 chênh 0 (863/242; R7b 888/259). Không sóng EPERM thật (sóng gần nhất ~11:55–12:11Z 11/11, ~140h45' trước probe #48). RAM max trong mù #48: 2.687 MB (44% guard); birefnet KHÔNG chạy. Prereg sai 2 điểm, ghi công khai: dự báo đoạn A "có thể đóng" (thực tế A MỞ) + số học gap trong prereg 6.507 s (số đúng 8.307 s — 6.507 s là số T6 theo đuôi sau mốc cuối đợt 128, hai số đo hai khoảng khác nhau).
- T3 cải tiến probe lượt yên: **blendTick tăng dần + heartbeat [HB129]** (file `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`, md5 dccb8f4c… → 920a5122…, 942 → 997 dòng, diff 67 dòng; KHÔNG đổi bar/ngưỡng/logic đo). Kiểm chứng thật: dry-run kill giữa chừng, partial có blendTick n=106 + analyzer chạy được; pwEval treo 12 s → 2 dòng [HB129] rồi reject đúng timeout. **Probe mới chỉ dùng từ đợt 130** — T4 đợt 129 vẫn dùng probe cũ.
- T4 WebKit: **lượt yên #7 ĐÃ ĐÓNG — attempt1 duy nhất 20/20, median 54,0 ms, lớp B 5/5 ĐẠT.** Ngưỡng ≤60 ms GIỮ; 6 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 (trung bình 47,8 ms). (c2) +1f tái hiện 2 lần (seq 136, 181); event lag ≥+5f = 0; F6' vẫn đóng. Xếp lịch đúng hẹn (load1 max 1,48, thấp nhất gần đây) — chứng minh quyết parent đợt 128 §12.3(a) đúng: B2 đạt được khi xếp lịch đúng, không cần nới bar. check-classb nay in verdict tổng `LOP-B-TONG: DAT 5/5` (bản copy đợt này; cần mang vào bản gốc). Cờ `.done` 09:01:41Z — trước reboot 09:02:12Z 31 giây; reboot không giết attempt nào.
- T5 hạ tầng: boot #74 CHẾT trong khung (06:20:05Z, 07:13:31Z]; **boot #75 replay khởi động MUỘN NHẤT (+1h22m12s) nhưng XONG HẲN 1.509 dòng, PASS +1h29m34s**, cờ POSTBOOT_PASS 08:43:05Z. **Reboot GIỮA LUỘT lần đầu tiên:** #75 CHẾT trong khung (08:59:16Z, 09:02:12Z]; boot #76 replay dạng (B), §8.2(B) TRIGGER=YES lúc 09:13:06Z, `--repair` 1 lần thành công (09:15:07Z), **cờ POSTBOOT_PASS MỚI 09:32:15Z**. (c2) chẩn đoán: +1f tái hiện thêm 2 lần (tổng 5 lần, đều đúng chữ ký cũ); **modal +1/+2 KHÔNG giữ nguyên dạng ngay cả trên lượt yên hợp lệ** (47,3% → 33,9%; 0 thành mode 37,7%); snap−label KHÔNG dự báo lag; giả thuyết seek-latency desync CHƯA CHỨNG MINH — đề xuất instrumentation (log draw rawUnitSource + chuỗi drawSrc) chờ parent quyết. R9 (a) vẫn chờ user (nhắc lần 15).
- T6 lock: **KHỎE** — trống sau boot #75; 0 zombie, 0 stale, 0 cổng nghe; ghép cặp 221/221, 0 đang giữ; round 128 khép sạch (24=24=24). **Prune cooldown lần 4: xóa 0 file** (0 ứng viên >7 ngày; **số chính thức 69 file/966 B** lúc 08:41Z; file cũ nhất đủ 7 ngày ~21/11 18:38Z). **Đính chính nhỏ:** `-mtime +7` chỉ khớp file ≥192h (8 ngày), không phải >7 ngày đúng nghĩa — parent quyết có chỉnh phương pháp đếm hay không. **Mù #37 không đổi** (A+D đóng, B+C mở, tối đa 29 ẩn; parent đã chấp nhận để mở). Gap #74→#75 danh nghĩa 6.507 s theo đuôi sau mốc cuối đợt 128 VẪN SPAN (số T6 — khác số boot-to-boot 8.307 s của T2, xem LIMITS gộp §6).
- T7 scheduler: **3 slot thiếu MỚI** (HB 13:50:50+07, DR 14:00+07, DR 15:00+07 17/11); lũy kế **HB 39/160, DR 45/151**; **2 dị thường muộn HB mức kỷ lục (+1.252 s, +889 s)** — chỉ ghi nhận; vcut-build-loop 0 slot thiếu.
- T8 Vite harness: **84l10/85m4/86n2 nhánh webkit 3/3 exit 0 trên boot #76** (chạy lại sau reboot giữa lượt + cờ POSTBOOT_PASS mới; lần chạy trên #75 bị reboot giết giữa 85m4 — không phải fail sản phẩm). **Heartbeat HB128 lần đầu thử lửa thật** (2 dòng `waitForPlaySync` trong lúc chờ đồng bộ thật >5 s: P4-lần1 6,5 s, P4-lần3 5,2 s). P3 KHÔNG kẹt (lần chạy sạch thứ hai liên tiếp — nguyên nhân kẹt đợt 127 vẫn chưa chứng minh). Đồng bộ chậm hơn đợt 128 (P4 5–6,5 s vs 1,3–1,8 s) trùng cửa sổ RAM tối thiểu 511 MB — chỉ tương quan. P5 seek kẹt dài nhất 3 mẫu (~0,6 s) ở cả 85m4/86n2 — theo dõi đợt sau. **Mirror 25/25 còn nguyên sau reboot; kiểm kê 238 file, 0 mới, 0 mất; phủ 201/201 harness.** tsc exit 0, vite build exit 0.
- T9 headroom: **3.079** (đo lặp 3.086) — tiếp tục giảm từ 3.212 cuối đợt 128 (−133, −4,1%); chuỗi dài hạn 4.438 → 3.079 (−30,6%). **Chưa tới ngưỡng báo user (< ~1.800)**, còn 1.279; gấp ~1,95 lần số watch vite thường cần. RAM 908–1.339 MB; **birefnet KHÔNG chạy** (guard 6 GB không đạt, chỉ bằng ~22%).
- T10 verify: suite 27/27 exit 0 (09:49:38–09:56:28Z, RAMavail 943 MB, boot #76); **O8 Chromium 21/21 exit 0 (lần đầu, không rerun) + WebKit 21/21 exit 0 (09:57:37–09:58:53Z) — WebKit FULL PASS lần thứ bảy liên tiếp (đợt 123–129).** Không reboot trong lúc đóng. Lock TRỐNG lúc đóng (0 ticket + 71 cooldown, 994 B). Socket sót X193/X194/X195 (0 process) đã dọn tay lúc đóng (xuất hiện trong lúc chạy suite, không phải sót từ luồng khác). Đếm cuối đợt 129 = 10 batch / 13 entry / 13 file (gồm closing); **lũy kế 111–129 = 187 batch / 486 entry / 437 file duy nhất** (dedup toàn cục; đã tái kiểm 111–128 = 177/473/427 khớp số công bố đợt 128 — KHÔNG phải 178/475 của bản chạy verbatim chưa sửa F-129-2). Chốt chặn đã xóa khi đóng đợt; cờ round129-t10.done ĐÃ TẠO.

## 59. Cập nhật sau đợt 130 (17/11/2026 — xem docs/PHASE9_ROUND130_LIMITS.md; T10 đóng trong phiên, 9/9 + T5b + T8b, T4b hủy — reboot #77→#78? GIỮA LUỘT lần thứ hai liên tiếp; WebKit O8 21/21 lần thứ tám liên tiếp)
- T1 kiểm chứng độc lập đợt 129: **mọi claim lớn PASS** (đếm cuối 187/486/437; mù #48 không đóng hoàn toàn; gap #74→#75 = 8.307 s SPAN; CERT n=41 / FULL n=56; T4 lượt yên #7 a1 20/20 median 54,0 ms; T5 boot #75 PASS +1h29m34s; T8 85m4 exit 0; T9 headroom 3.079). **6 sai số nhỏ mới (F-130-1 → F-130-6), không đổi verdict:** F-130-1 LIMITS gộp đợt 129 bị sửa sau khi đóng (53.775 B vs 49.749 B ghi §10.3, mtime 10:04:23Z — nội dung thêm là §12.3 quyết parent, có chủ đích); F-130-2 giải thích sai nguồn gốc số 6.507 s (06:20:05Z → 07:13:31Z = 3.206 s; 6.507 s là lỗi trừ nhẩm prereg T2 đã thừa nhận); F-130-3 "T4 attempt2 bị giết bởi reboot" sai (T4 đợt 129 chỉ 1 attempt, cờ trước reboot 31 giây); F-130-4 rawMs−labelMs median đợt 129 a1 = 9 ms không phải 10 ms; F-130-5 headroom "3.085" không có nguồn (T5 3.089 / T9 3.086); F-130-6 khung chết #74: T7 dùng 06:25:09Z (cron finish) hẹp hơn 39 s so với 06:24:30Z (mtime file cuối) của T2/T6 — hai loại bằng chứng, đều ghi rõ.
- T2 EPERM: probe #49 ok=2 fail=0 (11:38:21Z, boot 86538084). **Mù #49 KHÔNG ĐÓNG HOÀN TOÀN (A đóng, B mở, C đóng; tối đa 1 ẩn)** — đoạn A đóng (135 mốc, lỗ max 128 s); đoạn B mở (lỗ gộp 2.252 s > sàn 1.147 s); đoạn C đóng bằng uptime. **Gap #75→#76 = [6.511 s, 6.531 s] CHỨNG NHẬN DẠNG KHOẢNG (mới) → CERT n=42 / FULL n=57.** Gap #76→#77 = 6.859 s VẪN SPAN. **Mù #50 MỚI MỞ.** Snapshot proactivity 10:41:55Z thu hẹp đuôi B 3.127 s → 876 s, tối đa ẩn 2 → 1 (lần đầu quan sát ngoài cây làm đổi số tối đa ẩn). Quét writeFileSync lần 36 chênh 0 (871/244; R7b 896). Không sóng EPERM thật (sóng gần nhất ~11:55–12:11Z 11/11, ~143h43' trước probe #49). RAM max trong mù #49: 2.749 MB (45% guard); birefnet KHÔNG chạy.
- T3 phân phối (c2) qua 6 lượt yên hợp lệ (n=4174): **bin 0 là mode ỔN ĐỊNH (35,8–38,6%, trung bình 37,7%, SD 1,0pp); +1/+2 gộp KHÔNG ổn định (33,9–52,7%, SD 7,0pp); +3 càng không (3,8–18,3%, SD 5,3pp).** Giả thuyết mới: hình dạng phân phối xếp thứ tự theo median tickCost (Spearman ±1,000) + dự báo falsifiable cho lượt #8 (median ~40 ms → +3 ≈ 4%, +1/+2 ≈ 50–53%). (c2) thuần +1f: 28/4174 (0,67%), tất cả lag +1f. **Thống nhất interface analyzer: 12/12 script** (5 analyzer lượt yên canonical mới trong `benchmarks/render/` + 7 F2 analyzer nay nhận `tag=path`), dry-run 20/20 PASS. Giả thuyết seek-latency desync VẪN CHƯA chứng minh; DEF v0.5 KHÔNG viết.
- T4 WebKit: **lượt yên #8 ĐÃ ĐÓNG — attempt3 20/20, median 40,0 ms, lớp B 5/5 ĐẠT.** Ngưỡng ≤60 ms GIỮ; 7 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 (trung bình 46,7 ms). Attempt1 6/20 + attempt2 10/20 dở dang pass-timeout (HB129 bắn 23 + 33 dòng trong stall thật — thử lửa lần đầu; partial giữ được blendTick n=159/253 + tickCost n=193/314 nhờ probe mới). **(c2) +1f tái hiện 6 lần trên lượt hợp lệ a3** (seq 161, 263, 315, 341, 441, 484) + 1 trên partial a2 = 7 occurrence đợt này, tất cả skp=0, đều +1f. Event lag ≥+5f: 0. F6' ĐÓNG (nTick skp=1 = 56, 100%/100%). Gate A mở cửa sổ 4 sau 34 phút chờ RAM host (~500 MB, balloon virtio). **Reboot GIỮA LUỘT lần thứ hai:** #77 chết trong khung (13:02:42Z, 13:04:14Z] theo T4 (T8/T5b ghi (13:02:16Z, 13:02:41Z] — chênh 1 s, ghi cả hai); attempt3 hoàn tất TRƯỚC reboot 3 giây nên lượt yên giữ nguyên.
- T5 hạ tầng: boot #76? CHẾT trong khung (10:02:05Z, 10:56:31Z]; **boot #77? replay dạng (B), §8.2(B) TRIGGER=YES poll 9 (11:46:21Z, dpkg im 641s, đủ 5/5) — luật 10 phút kiểm chứng thực tế lần thứ 2; `--repair` 1 lần có giám sát THÀNH CÔNG** (dpkg 2→759 dòng, 109 installs; RE-CHECK libs/GST/apt PASS đủ); **cờ POSTBOOT_PASS 12:01:24Z.** **(c2) instrumentation log draw ĐÃ LÀM** (quyết parent đợt 129 §12.3(a)): đúng 2 điểm log, cờ window.__vcutC2DrawLog mặc định TẮT, chỉ 2 vòng loop sau wrap, trần 10.000 entry, chẩn đoán-only; tsc/build exit 0; preview.tsx md5 03bf029f → 805409f0 (đổi có chủ đích). Headroom 2971 → 2957; RAM 473–3302 MB. R9 (a) nhắc lần 16.
- T5b postboot boot mới #78? (luồng khôi phục): boot #77? CHẾT (13:02:16Z, 13:02:41Z]; **boot #78? replay CHẠY ĐẦY ĐỦ 1.509 dòng / 217 installs lúc 13:37:37Z, KHÔNG cần --repair** (khác dạng (B) của #76?/#77?); **§8.2(B) TRIGGER=NO cả 23 poll; cờ POSTBOOT_PASS mới 13:39:13Z.** postboot-check.sh sửa 1 lần (md5 f5c6a411 → 0b73b3bc, chỉ tham chiếu boot). preview.tsx KHÔNG ĐỔI (805409f0); media.ts không đổi. Headroom 2952 → 2954; RAM 510–1187 MB.
- T6 lock: **KHỎE** — trống sau boot #77; 0 zombie, 0 stale, 0 cổng nghe; log 796 dòng (763 + 33 = 10 chu kỳ mới, 1 acquire chết theo reboot đã STALE-LOCK dọn đúng luật); round 129 khép sạch (24=24=24). **Prune cooldown lần 5: xóa 0 file** (0 ứng viên >7 ngày; **số chính thức 71 file/994 B** lúc 11:37Z; file cũ nhất đủ 7 ngày ~21/11 18:38Z). **Chú thích ngữ nghĩa find -mtime (≥192h/≥72h) đã ghi vào luật prune** (`docs/PHASE9_ROUND125_LIMITS.md` dòng 480–487 — nợ ĐÓNG theo quyết parent đợt 129 §12.3(e)). **Mù #37 không đổi** (A+D đóng, B+C mở, tối đa 29 ẩn; parent đã chấp nhận để mở). Số boot #77?/#78? TẠM, chờ T6 chốt mù #37 đợt sau.
- T7 scheduler: **2 slot thiếu MỚI** (HB 17:50:50+07, DR 18:00+07 17/11); lũy kế **HB 40/166, DR 46/154**; **HB +1.252 s BẰNG kỷ lục đợt 129** (lần thứ hai liên tiếp đúng mức này, tới từng giây) + HB +888 s (thấp hơn kỷ lục +889 s đúng 1 s) — chỉ ghi nhận; vcut-build-loop 0 slot thiếu.
- T8 Vite harness: **gốc BỊ CHẶN 0/3** (reboot giết session T4 trước khi touch cờ — báo cáo "session T4 đã chết" này SAU ĐÓ SAI: T4 gốc hoàn tất lúc 13:12–13:13Z, LIMITS + cờ đều có trên đĩa; T4b spawn rồi hủy kịp thời, không xung đột). **T8b chạy lại 3/3 exit 0 trên boot #78?** (13:40–13:48Z, sau đủ 2 cờ T4 + POSTBOOT_PASS mới): 84l10 exit 0 (W1×3/W2/E4 PASS); 85m4 exit 0 (P1–P5 PASS, **P3 KHÔNG kẹt — lần sạch thứ 3 liên tiếp**, P4 1,3/1,3/1,3 s, P5 seek kẹt 0 mẫu); 86n2 exit 0 (P1–P5 PASS, P4 1,9/1,8/1,7 s, P5 0 mẫu). HB128: 19 dòng sampleFor, 0 waitForPlaySync. Fixture md5 khớp đợt 126; mirror 25/25; kiểm kê 238 file, diff 0 so với đợt 129; tsc/build exit 0. **Số (c2)=0 của T8 trên attempt3 là SAI** (đọc nhầm mục skippedLatest=1 — xem T10).
- T9 headroom: **2.963** (đo lặp 2.974) — tiếp tục giảm từ 3.079 cuối đợt 129 (−116, −3,8%); chuỗi dài hạn 4.438 → 2.963 (−33,2%). **Chưa tới ngưỡng báo user (< ~1.800)**, còn 1.163; gấp ~1,9 lần số watch vite thường cần. RAM 688–1.246 MB; **birefnet KHÔNG chạy** (guard 6 GB không đạt, chỉ bằng ~20,3%).
- T10 verify: **mâu thuẫn (c2) T4 ×6 vs T8 tính lại 0 — T10 chạy lại analyzer trong phiên: T4 ĐÚNG** (output byte-identical với file T4: skp=0 (c2)=6 seq 161/263/315/341/441/484; T8 đọc nhầm mục skp=1 n=112). **Dự báo falsifiable T3 §4.3 ĐÚNG cả hai dải trên lượt #8 thực tế** (T10 chạy lại histogram bằng đúng phương pháp T3: n=718 ghost, +3 = 4,6% so với dự báo ~4%, +1/+2 = 52,4% so với dự báo 50–53%; hai lượt median 40,0 ms cho phân phối gần như giống nhau) — giả thuyết thứ tự theo tick vượt phép thử ngoài mẫu đầu tiên (7/7 lượt xếp đúng thứ tự); cơ chế seek-latency desync VẪN CHƯA chứng minh. Suite 27/27 exit 0 (13:54:39–13:59:45Z, RAMavail 598 MB, boot #78?); **O8 Chromium 21/21 exit 0 (lần đầu, không rerun) + WebKit 21/21 exit 0 (14:01:10–14:02:08Z) — WebKit FULL PASS lần thứ tám liên tiếp (đợt 123–130).** Không reboot trong lúc đóng. Lock TRỐNG lúc đóng (0 ticket + 73 cooldown, 1022 B). Socket sót X193/X194/X195 (0 process) đã dọn tay lúc đóng. Đếm cuối đợt 130 = 11 batch / 28 entry / 27 file (gồm closing); **lũy kế 111–130 = 198 batch / 514 entry / 453 file duy nhất** (dedup toàn cục; đã tái kiểm 111–129 = 187/486/437 khớp số công bố đợt 129). Chốt chặn đã xóa khi đóng đợt; cờ round130-t10.done ĐÃ TẠO.
## 60. Cập nhật sau đợt 131 (17/11/2026 — xem docs/PHASE9_ROUND131_LIMITS.md; T10 đóng trong phiên, 9/9, không luồng khôi phục — reboot #79?→#80? GIỮA LUỘT lần thứ tư liên tiếp; WebKit O8 21/21 lần thứ chín liên tiếp)
- T1 kiểm chứng độc lập đợt 130: **mọi claim lớn PASS** (đếm cuối đợt 130 = 11 batch / 28 entry / 27 file; lũy kế 111–130 = 198/514/453; lượt yên #8 attempt3 20/20 median 40,0 ms; (c2)=6 đúng; dự báo T3 đúng cả hai dải; suite 27/27; O8 21/21 + 21/21; gap #75→#76 = [6.511 s, 6.531 s] CERT n=42/FULL n=57; POSTBOOT_PASS #78 13:39:13Z, replay 1.509/217). **3 sai số nhỏ mới (F-131-1 → F-131-3), không đổi verdict:** F-131-1 LIMITS gộp đợt 130 hiện 67.500 B (+4.357 B vs 63.143 B lúc đóng, §12.3 chỉ giải thích 4.324 B — còn 33 B chưa đối chiếu, không có snapshot lúc đóng; T10 đợt này lưu sha256 lúc đóng); F-131-2 HB129 attempt1 thực tế 33 dòng (23 play pass 7 + 10 writePartial), không phải 23 — tổng đúng 66 dòng; F-131-3 "T4 xong attempt3 trước reboot 3 giây" chỉ đúng theo khung T4 (13:02:42Z), theo btime boot mới (13:02:41Z) chỉ cách 2 giây; file T4 gốc không viết "3 giây".
- T2 EPERM: probe #50 ok=2 fail=0 (14:46:56Z, boot f868abad). **Mù #50 ĐÓNG HOÀN TOÀN (A+B+C, 0 ẩn) — mù đóng hoàn toàn đầu tiên kể từ mù #47.** A: 277 mốc float hai cây / 165 mốc gộp 4 phạm vi, lỗ lớn nhất 895 s / 461 s; B: 180 / 124 mốc, lỗ lớn nhất 738 s (đuôi, mốc cuối LIMITS gộp 130 lúc 14:14:23Z); C: đóng bằng uptime trực tiếp. 2 reboot chốt giờ (#78? 13:02:41Z + #79? 14:26:41Z, trong dải cơ học lần thứ 8 + 9 liên tiếp) + 0 ẩn. **2 gap CHỨNG NHẬN DẠNG KHOẢNG (mới): #77→#78? = [7.560 s, 7.580 s], #78?→#79? = [5.030 s, 5.050 s] → CERT n=42 → n=44 / FULL n=57 → n=59** (cross-check N6/P6/Q6 tái hiện 100% trước khi cộng). **Mù #49 đoạn B kiểm lại: VERDICT KHÔNG ĐỔI** (vẫn mở, tối đa 1 ẩn); gap #76→#77 giữ SPAN. **Mù #51 MỚI MỞ.** EPERM 0 sóng thật (sóng gần nhất ~11:55–12:11Z 11/11, ~146h51' trước probe #50). WFS lần 37 chênh 0 (878/245; R7b 903/262; copies 25/17). RAM max trong mù 3.317 MB (55% guard); birefnet KHÔNG chạy. Reboot #80? 15:01:30Z giữa phiên T2 (sau khi mọi đo mù #50 xong, không ảnh hưởng verdict).
- T3 (c2): dự báo đăng ký 14:47Z TRƯỚC khi T4 đo (pool 7 lượt n=4892; hồi quy +1/+2 slope −1,334 pp/ms, Pearson −0,998, residual tối đa 0,85pp; dự báo 4 dải median + (c2) thuần +1f: 2–8 lần). **VERDICT: giả thuyết thứ tự theo tick BỊ BÁC trên lượt #9** — +1/+2 quan sát 43,1% lệch +11,8pp (6,5σ, SE nhị thức 1,81pp) so với ngoại suy hồi quy (31,3%), +5,1pp so với biên dải gần nhất (vượt ngưỡng bác >5pp); thứ tự đơn điệu phá vỡ ở cả hai dải (Spearman +1/+2 −0,991 → −0,850; +3 +0,991 → +0,970). +3 (13,0%) vẫn trong dải dự báo — ĐÚNG. Bin 0 (33,8%) sát biên (dưới dải 1,2pp). **(c2): ĐÚNG** — thuần +1f = 8 (đúng biên trên dải 2–8), skp=1 (c2)=0, lag ≥+5f = 0; tổng (c2) skp=0 = 9, gồm 1 occurrence +3f đầu tiên (seq 421, 19/16 — cụm 2 tick 420–421, nhãn đứng 1 tick rồi bắt kịp ngay ở seq 422). Log draw KHÔNG đối chiếu được trực tiếp tại các seq (c2) (cửa sổ log chỉ phủ pre-flip seq 0–42; 0/9 seq (c2) trong cửa sổ); trong cửa sổ quan sát được, drawSrc không bao giờ trễ sau ct (53/53). DEF v0.5 chưa viết. Reboot lần thứ 3 liên tiếp giết waiter T3 (~15:02Z, SIGTERM); T3 khôi phục bằng kiểm đĩa, dữ liệu T4 nguyên vẹn.
- T4 WebKit: **lượt yên #9 ĐÃ ĐÓNG ngay attempt1 — 20/20, exit 0, tickCost median 56,0 ms (p90 81,0, n=557), lớp B 5/5 ĐẠT.** Ngưỡng ≤60 ms GIỮ; 8 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 (trung bình 47,9 ms). Lưu ý: median 56,0 là cao nhất từ trước, biên chỉ còn 4,0 ms. **Log draw lần đầu có dữ liệu thật** (cờ runtime, không sửa file): c2DrawLog n=103 (drawSrc 53 / rawUnit 50; loop 1: 53 / loop 2: 50); frameIdx 0–67, ct 0–2,233 s, seeking False 103/103, readyState 4 103/103, 1 wrap. **(c2) 9 occurrence** (8× +1f + 1× +3f đầu tiên seq 421); lag ≥+5f: 0; F6' ĐÓNG (nTick skp=1 = 61, 100%/100%). Gate 0 đạt poll #2 (14:50:27Z; POSTBOOT_PASS 14:50:18Z khớp boot f868abad, dpkg 1.509 dòng — replay đầy đủ, không cần --repair). Gate A mở ngay poll 1 (RAM 1.178 MB). 0 dòng HB129 (lượt sạch). **REBOOT SAU KHI ĐO XONG (lần thứ ba liên tiếp):** f868abad chết trong khung (15:00:06Z, 15:01:30Z]; boot mới ad1327ef (btime 15:01:30Z). Verdict GIỮ NGUYÊN (attempt1 + phân tích + cờ xong trước reboot).
- T5 hạ tầng: **boot2 ad1327ef DẠNG (B) thuần + --repair 1 lần THÀNH CÔNG** (configure 15:02:19Z rồi im hoàn toàn; §8.2(B) TRIGGER=YES poll 7 15:13:12Z, dpkg im 654s, đủ 5/5; --repair 15:15:22Z, install xong 15:29:55Z, dpkg 2→759 dòng, 109 installs y hệt #76?/#77?; RE-CHECK libs/GST/apt PASS đủ). **Cờ POSTBOOT_PASS boot2 15:31:20Z (poll 25, boot +29m50s) — ghi tay** vì watcher b80 gặp `FLAG_EXISTS already` (cờ boot1 còn đó; bài học: watcher làm lại phải xóa cờ STALE trước). Lists boot2: 68 file / 61 noble (1 mirror). Headroom boot2 2851→2849; RAM cuối 461 MB (thấp nhất từng ghi). **PHA 2 (c2) ĐÃ XONG:** đối chiếu trực tiếp từng event (c2) với log draw là KHÔNG THỂ (cửa sổ log wallMs 10382–17223, seq ~0–43, tiền-flip; không phủ cửa sổ đo seq 112–439, post-flip; (c2) xảy ra 19,4–61,6 s sau khi log kết thúc — thiếu sót thiết kế instrumentation, cần log phủ post-flip ở lượt sau). Trong cửa sổ log, drawSrc KHÔNG BAO GIỜ trễ so với ct (0/103 entry lag ≥+1); rawUnit khớp drawSrc 50/50; wrap sạch → LÀM YẾU desync dạng đơn giản (giới hạn: log thưa median 104 ms, không phân giải lệch 33 ms). DẤU (c2) ngược dự đoán desync (presented MỚI HƠN label +1f ×8, +3f ×1). Cơ chế thay thế có bằng chứng mạnh hơn: **ghost sampler freeze + skew snap/label** — 9/9 (c2) trong ±1 tick của run-end (đối chứng 18,6%, kỳ vọng 1,7; p ~ 3×10⁻⁷); labelMs đóng băng 100–800 ms tại 2 freeze lớn (seq 154–161, 417–420); snap−label median 44 ms (≈1,3 frame). Cơ chế seek-latency desync VẪN CHƯA chứng minh.
- T6 lock: **KHỎE** — log 833 dòng, 241/241 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 mất dấu, 0 TIMEOUT mới từ đợt 120; 11 chu kỳ mới tất cả sạch (t4 attempt1 lượt #9 acquire 14:52:24Z → release 14:55:53Z, hold 209 s, cờ --c2-draw-log đã bật). Suite 9/9 ×2 (lần xanh thứ 13 liên tiếp). **Prune cooldown lần 6: xóa 0 file** (0 ứng viên ≥192h; 73 lúc prune → 74 file/1036 B lúc đóng). **Chuỗi boot tương đối CHỐT (#57→#79), số tuyệt đối VẪN TẠM (giữ "?")** (mù #37 tối đa 29 ẩn + mù #38 G mở tối đa 6 + mù #29/30/31 +4; mù #49 B mở tối đa 1 ẩn; mù #50 đoạn B nay ĐÃ ĐÓNG). **F-131-T6-1: ngày mù #37 là 15/11, không phải 16/11.** Khung chết #78? hẹp hơn: (14:14:23Z, 14:26:41Z] (T7 cho (14:15:34Z, 14:26:41Z] — hẹp hơn nữa ở đầu dưới). Xvfb socket X193 sót lúc 14:54Z (0 process) nhưng đã được dọn trước 15:04Z — bằng chứng live tích cực đầu tiên cho luật "mỗi driver tự kill Xvfb". 0 zombie.
- T7 scheduler: **0 slot thiếu mới** (HB 6/6, DR 3/3, vcut 0 thiếu); 0 dị thường muộn; **kỷ lục +1.252 s KHÔNG tái hiện lần thứ ba** (chuỗi dừng ở 2 lần). Lũy kế HB 40/172, DR 46/157. Khung boot trước chết (14:15:34Z, 14:26:41Z] (dấu vết HB 21:20:50 started 14:15:34Z).
- T8 Vite harness: **gốc 0/3 "KHÔNG CHẠY"** — reboot lần thứ tư liên tiếp giết boot f868abad trong khung (15:01:22Z, 15:01:30Z] (T4 ghi (15:00:06Z, 15:01:30Z] — ghi cả hai), đúng giữa rebuild fixture xong và driver mở; /tmp bị xóa sạch nên cả 3 harness exit=2 "không thấy clip" trong 1 s. Không phải fail. **Chạy lại 3/3 exit 0 trên boot mới ad1327ef** (15:35:53–15:43:51Z, sau cờ POSTBOOT_PASS mới 15:31:20Z): 84l10 exit 0 (W1×3/W2/E4 PASS); 85m4 exit 0 (P1–P5 PASS, **P3 KHÔNG kẹt — lần chạy sạch thứ 4 liên tiếp**, P4 1,4/1,4/2,0 s, P5 seek kẹt 0 mẫu; HB128 18 dòng sampleFor, 0 waitForPlaySync); 86n2 exit 0 (P1–P5 PASS, P4 1,3/1,9/1,8 s, P5 0 mẫu). Fixture md5 khớp đợt 126–130; kiểm kê 238 file diff 0; mirror 25/25; tsc/build exit 0. RAM 628–1.438 MB. Lưu ý: T8 nói "T4 chưa viết LIMITS" là nhận định lỗi thời (file 29.236 B đã có trên đĩa từ 15:10Z — T10 đối chiếu).
- T9 headroom: **2.846** (đo lặp 2 lần giống hệt, probe dừng ở i=2846 cả hai lần, errno=28) — tiếp tục giảm từ 2.963 đợt 130 (−117); **chưa tới ngưỡng báo < ~1.800, còn 1.046**; trong một boot đứng yên tuyệt đối (2.846 → 2.846 trong ~155 giây). Trần max_user_watches = 63.747 (không đổi). RAM 502–546 MB; balloon virtio 6.443.824 kB đứng yên; **birefnet KHÔNG THỬ** (max 546 MB = 8,9% guard 6 GB); u2net là fallback chính thức. 0 ENOSPC ngoài probe.
- T10 verify: **suite cây gộp 27/27 exit 0, 0 rerun** (15:52:30–15:57:21Z, RAMavail 499 MB, boot ad1327ef); **O8 Chromium 21/21 + WebKit 21/21 exit 0, 0 rerun** (15:57:50–15:59:48Z) — **WebKit FULL PASS lần thứ chín liên tiếp (đợt 123–131).** Cây không đổi trong lúc đóng (preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093). **Kiểm chứng độc lập (e): T10 tính lại histogram lượt #9 bằng code riêng — khớp 100% số T3** (n=656; 0: 33,8%; +1/+2: 43,1%; +3: 13,0%; snap median 44; raw median 9) **+ hồi quy khớp** (slope −1,334 pp/ms, Pearson −0,998, residual tối đa 0,85pp, dự báo 56 ms = 31,3%, lệch +11,8pp = 6,5σ theo SE nhị thức 1,81pp) — **giả thuyết thứ tự theo tick BỊ BÁC, ĐỨNG.** **Cờ POSTBOOT_PASS boot2 ghi tay HỢP LỆ** (poll 24/25 postboot_exit=0 + WATCHER_END done_pass_stable_2polls poll=25 + final confirm 15:32:55Z đều có trên đĩa; chỉ bước ghi file bị chặn bởi FLAG_EXISTS). **Khung chết #78? hai bản ghi** (T2 (14:14:23Z, …] vs T7 (14:15:34Z, …] — lấy khung hẹp nhất làm chuẩn) **+ khung chết #79? hai bản ghi** (T4 (15:00:06Z, …] vs T8 (15:01:22Z, …] — khung T8 nằm trong khung T4) — ghi cả hai. **Lock TRỐNG lúc đóng** (0 ticket + 75 cooldown); 0 process sót; /tmp/.X11-unix/ trống lúc đóng (3 socket X193/X194/X195 do chính suite tạo ra, 0 process, đã dọn tay 16:01Z). Không reboot trong lúc đóng. **Đếm cuối đợt 131 = 10 batch / 12 entry / 12 file duy nhất (gồm closing); lũy kế 111–131 = 208 batch / 526 entry / 463 file duy nhất** (dedup toàn cục; đã tái kiểm 111–130 = 198/514/453 khớp số công bố đợt 130). **sha256 LIMITS gộp lúc đóng: 680e00fe0a20aeaf40a7df1685969442a5f0308b8ce3ef6bc96d1687f7ca4580** (53.291 B, mtime 16:05:17Z — lưu trong hidden_files/round131-t10/t10-closing-sha256.txt + cờ round131-t10.done + build-loop log; F-131-1 đã xử lý). Chốt chặn đã xóa khi đóng đợt; cờ round131-t10.done ĐÃ TẠO. Oversize đợt này: T2 58.440 B, T5 57.548 B, T6 42.246 B, LIMITS gộp 53.291 B, GAP 283.910 B (+ 6,4 MB JSON chưa lên từ trước).

## 61. Cập nhật sau đợt 132 (17/11/2026 — xem docs/PHASE9_ROUND132_LIMITS.md; T10 đóng trong phiên, 9/9 + T5b, T3 chỉ prereg — reboot #81?→boot mới GIỮA LUỘT lần thứ sáu liên tiếp; lượt yên #10 KHÔNG đo được do gate A kẹt RAM; WebKit O8 21/21 lần thứ mười liên tiếp)
- T1 kiểm chứng độc lập đợt 131: **mọi claim lớn PASS** (đếm cuối đợt 131 = 10 batch / 12 entry / 12 file; lũy kế 111–131 = 208/526/463; lượt yên #9 attempt1 20/20 median 56,0 ms; (c2)=9 đúng; giả thuyết thứ tự theo tick BỊ BÁC, ĐỨNG — hồi quy 7 lượt slope −1,3342 pp/ms, Pearson −0,9985, dự báo 56 ms = 31,3%, lệch +11,8pp = 6,53σ; suite 27/27; O8 21/21 + 21/21; gap #77→#78? = [7.560 s, 7.580 s] và #78?→#79? = [5.030 s, 5.050 s] CERT n=44/FULL n=59; POSTBOOT_PASS #80? 15:31:20Z, replay 1.509/217). **4 sai số nhỏ mới (F-132-1 → F-132-4), không đổi verdict:** F-132-1 LIMITS gộp vùng trước §12.3 chỉ còn 53.098 B, ngắn hơn lúc đóng 193 B — thêm §12.3 không phải pure append; byte thay không khôi phục được (chỉ có sha snapshot); F-132-2 §12.3(g) viết "sha lúc đóng khớp đúng bản hiện tại (680e00fe…)" là sai — sha hiện tại là 71d02fce…; F-132-3 script histogram của T10 crash (AttributeError ở block POOL không có nGhost) và không chứa code hồi quy — các giá trị hồi quy §10.1(e) không tái tạo được từ code đã lưu (số liệu thì T1 tính lại đúng hết); F-132-4 §10.3 ghi GAP 283.910 B là số cũ; lúc đóng GAP đã 295.763 B.
- T2 EPERM: probe #51 ok=2 fail=0 (17:46:50Z, boot b379ecd7 #81?). **Mù #51 (14:46:56Z → 17:46:50Z, 2h59'54") KHÔNG ĐÓNG HOÀN TOÀN — A đóng (85 mốc, lỗ lớn nhất 96 s), B mở tối đa 3 ẩn (194 mốc, lỗ lớn nhất 4.392 s chính là đuôi 16:10:55Z → 17:24:08Z; 0 session chạm đuôi B, 0 file trong đuôi B), C đóng bằng uptime + probe #51.** Ranh giới #80?/#81? sạch (0 file trong +10 s sau btime); cận |X80?| < 6 s (chặt nhất từ trước). **Gap mới CHỨNG NHẬN DẠNG KHOẢNG: #79?→#80? = [2.079 s, 2.099 s] (mid 2.089 s) → CERT n=44 → n=45 / FULL n=59 → n=60** (cross-check tái hiện T2-131 100% trước khi cộng; caveat F80? chưa đo). Gap #80?→#81? = 8.558 s GIỮ SPAN (B mở). #81? trong dải cơ học từ #80? lần thứ 11 liên tiếp; #80? trong dải lần thứ 10. **Khung chết #80?: (16:10:55Z, 17:24:08Z]** (4.393 s) — T6-132 độc lập cho cùng khung; T7-132 cho khung scheduler (16:00:00Z, 17:24:08Z] (rộng hơn, chứa khung đĩa). **Mù #49 đoạn B kiểm lại: VERDICT KHÔNG ĐỔI — lần thứ hai giống hệt** (A 116 s đóng, B 2.252 s mở tối đa 1 ẩn, C 2.363 s đóng bằng uptime); T2 đề nghị parent xem xét bỏ mục kiểm lại thường lệ này khỏi brief T2 các đợt sau. EPERM 0 sóng thật (sóng gần nhất ~11:55–12:11Z 11/11, ~149h52' trước probe #51). WFS lần 38 chênh 0 (883/246; R7b 908/263; copies 25/17). RAM max trong mù 3.145 MB (52% guard); birefnet KHÔNG chạy. **Mù #52 MỚI MỞ.**
- T3 (c2): **bước 1 prereg xong 17:46Z** (dự báo ghost-freeze/skew P1–P5/P7 — cơ chế thay thế có bằng chứng mạnh hơn từ lượt #9: 9/9 (c2) trong ±1 tick của run-end, p ~3×10⁻⁷; labelMs đóng băng 100–800 ms tại 2 freeze lớn seq 154–161, 417–420; snap−label median 44 ms). **Bước 2 KHÔNG THỂ** — T4 không đo được lượt #10 nên không có dữ liệu để kiểm chứng; prereg ĐỨNG nguyên cho đợt 133, KHÔNG spawn T3b. Không có file LIMITS T3 / batch T3 đợt này. DEF v0.5 chưa viết.
- T4 WebKit: **lượt yên #10 KHÔNG ĐO ĐƯỢC — 0 attempt, 0 JSON, 0 (c2), 0 log draw.** Gate A kẹt RAM 420–552 MB (cần ≥1024 MB), 8 lần timeout 10 phút trên 2 boot, 75 poll gate A; gate 0 ĐẠT cả hai boot (b379ecd7 poll #23 18:35:08Z; 07da9c50 poll #6 19:48:04Z). T4 chờ gate A ~1h36m mà không đo được pass nào — **RAM thấp kéo dài là nút thắt, không phải cờ postboot.** Không có verdict ngưỡng mới; ngưỡng ≤60 ms GIỮ theo 8 lượt yên đã xác nhận. Probe re-arm log draw phủ post-flip ĐÃ XONG + dry-run PASS, sẵn sàng cho đợt 133. Cờ round132-t4.done tạo 20:15:10Z theo lệnh parent (sau deadline waiter 20:10Z của T8 — xem T8).
- T5 hạ tầng: **boot #80? (ad1327ef) chết trong khung (16:07Z, 17:24:08Z]** (tuổi thọ 1h05m30s–2h22m38s) — reboot giữa đợt đóng/lượt mở lần thứ 5 liên tiếp. Boot mới b379ecd7. **Replay chạy đầy đủ, KHÔNG phải dạng (B): 1.551 dòng / 222 installs** (khác baseline 1509/217 — hơn 5 gói), gói cuối gstreamer1.0-tools 18:19:43Z. **Thiếu đúng 1 gói `gstreamer1.0-gl`** (replay không bao giờ thử cài — 0 dòng trong dpkg.log/history.log); §8.2(B) TRIGGER=NO cả 49 poll — **khoảng trống proxy C4** (watcher tính dạng (A) = GST<100 file, trong khi GST=268 file). Kiểm chứng độc lập 5/5 → **--repair 1 lần có giám sát 18:32:59Z THÀNH CÔNG** (RE-CHECK 4/4 PASS). **Cờ POSTBOOT_PASS 18:35:45Z do chính watcher v5 ghi (ghi đè), KHÔNG cần ghi tay.** Nhánh archive v5 chưa kích hoạt live trên thư mục mới (log NO_FLAG_AT_START). **PHA 2 KHÔNG LÀM ĐƯỢC** (T4 chưa bao giờ xong lượt #10 — 0 attempt). **REBOOT 19:34:15Z — GIỮA LUỘT lần thứ 6 liên tiếp:** b379ecd7 CHẾT trong khung (19:33:56Z, 19:34:15Z] (19 s — khung hẹp nhất từng kẹp), giết session T4 + timer chờ của T5. Script pha 2 đã sẵn (py_compile OK) — dùng lại đợt 133.
- T5b postboot boot mới 07da9c50: **replay 1.545 dòng / 221 installs** (baseline khác cả 1509/217 lẫn 1551/222 — baseline trôi theo từng boot); **gstreamer1.0-gl đã cài bởi replay** (19:35:28Z) — KHÔNG cần --repair. **Cờ t5b 19:43:36Z + cờ gate-visible 19:46:27Z** (watcher b83 trong `round132-t5/`; **nhánh archive v5 kích hoạt LIVE lần đầu** — STALE_FLAG_ARCHIVED 19:45:27Z; gate0-wait của T4 chỉ đọc `round132-t5/`, không đọc `round132-t5b/`). T4 gate 0 ĐẠT poll #6 19:48:04Z nhờ cờ này. **PHA 2 KHÔNG CÓ DỮ LIỆU** (T4 kẹt gate A từ 19:48Z, 0 attempt) — chuyển đợt 133. R9 (a) vẫn chờ user (nhắc lần 16).
- T6 lock: **KHỎE** — log chính thức 847 dòng, 245/245 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 mất dấu, 0 TIMEOUT mới từ đợt 120. Suite 9/9 ×2 (lần xanh thứ 14 liên tiếp). **Prune cooldown lần 7: xóa 0 file** (lần thứ 7 liên tiếp; 75 file / 1050 B lúc đóng; file cũ nhất đủ 7 ngày ~21/11 18:38Z). **CHỐT SỐ BOOT: chuỗi tương đối CHỐT #57→#81 (25 boot), số tuyệt đối VẪN TẠM (giữ "?")** (mù #37 tối đa 29 ẩn + mù #49 B mở tối đa 1 ẩn + mù #51 chưa có verdict lúc T6 đóng). **Khung chết #80? hẹp hơn: (16:10:55Z, 17:24:08Z]**; gap #80?→#81? = 8.558 s, SPAN. **F-132-T6-1:** lần chạy repro đầu dùng sai biến môi trường nên chạy trên lock thật (6 dòng ghi vào log thật dòng 848–853 + 2 file cooldown thật) — đã dọn (xóa 2 file cooldown, queue về đúng 75; log append-only để nguyên; loại 6 dòng khỏi mọi số đếm chính thức; chạy lại repro đúng trên /tmp, A/B/C xanh). Số chính thức: 847 dòng / 245 cặp (file thật 853 dòng). 0 zombie, 0 Xvfb, /tmp/.X11-unix/ trống.
- T7 scheduler: **cửa KHÔNG sạch — gãy sau cửa sạch đợt 131.** HB 2 slot thiếu MỚI (23:20:50, 23:50:50+07), DR 1 slot thiếu MỚI (00:00+07 18/11); **HB 00:20:50+07 muộn +887 s** (cùng họ +888/+889 s); **kỷ lục +1.252 s KHÔNG tái hiện lần thứ ba.** Lũy kế HB 42/178, DR 47/160. Cả 3 slot thiếu mới đều rơi vào khung chết boot #80? (16:07Z, 17:24:08Z]. vcut-build-loop 0 thiếu (đợt 131 `succeeded` 16:08:59Z; đợt 132 đang `running`, jitter 0 s).
- T8 Vite harness: **BLOCKED 0/3 — không chạy harness nào** (không có cờ T4; cờ T4 chỉ tạo 20:15Z, sau deadline waiter 20:10Z của T8). 8 lần thử mở gate A đều hết 10 phút. **Lỗi do T8 gây ra — đã sửa:** sed đổi deadline tạo `date -d '2026-11-17 2026-11-17 19:45:00 UTC'` → invalid → DEADLINE rỗng → waiter #1 không bao giờ tự hết hạn (reboot giết bằng SIGTERM sau 113 poll); waiter #2 chạy 19:36:35–20:10:35Z (35 poll), hết hạn 20:10Z, exit 3, GATE NOT MET. Kết quả harness gần nhất vẫn là đợt 131 chạy lại: 3/3 exit 0 trên boot ad1327ef — không có số đo WebKit mới nào từ đợt 132.
- T9 headroom: **2.738** (2 lần: 2.745 → 2.738, chênh −7 trong-boot) — tiếp tục giảm từ 2.846 đợt 131 (−108, −3,8%); chuỗi dài hạn 4.438 → 2.738 (−38,3%). **Còn 938 trên ngưỡng báo < ~1.800** (~8–9 đợt nữa mới chạm nếu đà giữ nguyên — chỉ là phép chia). Trần max_user_watches = 63.747 (không đổi). **RAM khả dụng 857–1.095 MB, rơi ~238 MB trong ~2 phút** — balloon virtio phình 5.763.684 → 6.021.740 kB (+258 MB) trong lúc apt replay chạy apt-get update; balloon ~5,88 GB (~74,1% tổng RAM). **Birefnet KHÔNG THỬ** (max 1.095 MB = 17,8% guard 6 GB); u2net là fallback chính thức.
- T10 verify: **suite cây gộp 27/27 exit 0, 0 rerun** (20:16:54–20:20:39Z, RAMavail 535 MB lúc bắt đầu, boot 07da9c50; 354 assertions pass); **O8 Chromium 21/21 + WebKit 21/21 exit 0, 0 rerun** (20:20:50–20:22:35Z, giữ lock 105 s; 42 dòng PASS, 0 FAIL) — **WebKit FULL PASS lần thứ mười liên tiếp (đợt 123–132).** Cây không đổi trong lúc đóng (preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093). Lock TRỐNG lúc đóng (0 ticket + 76 cooldown); 0 process sót; /tmp/.X11-unix/ trống lúc đóng (3 socket X193/X194/X195 do chính suite tạo ra, 0 process, đã dọn tay 20:22Z). Không reboot trong lúc đóng. **Đếm cuối đợt 132 = 10 batch / 13 entry / 12 file duy nhất (gồm closing); lũy kế 111–132 = 218 batch / 539 entry / 473 file duy nhất** (dedup toàn cục; đã tái kiểm 111–131 = 208/526/463 khớp số công bố đợt 131). **Verdict đóng: CHẤP NHẬN CÓ ĐIỀU KIỆN** (9/9 + T5b; thiếu lượt yên #10 + T3 bước 2 — cả hai do RAM kẹt, không phải lỗi quy trình). Chốt chặn đã xóa khi đóng đợt; cờ round132-t10.done ĐÃ TẠO.

## 62. Cập nhật sau đợt 133 (17/11/2026 — xem docs/PHASE9_ROUND133_LIMITS.md; T10 đóng trong phiên, 9/9 — lượt yên WebKit #10 ĐO XONG HỢP LỆ lần đầu sau 2 đợt (median 39,5 ms, thấp nhất 9 lượt); mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ; mù #52 ĐÓNG HOÀN TOÀN; reboot #82?→#83? GIỮA LUỘT lần thứ bảy liên tiếp (sau khi 8/9 luồng đã xong); WebKit O8 21/21 lần thứ mười một liên tiếp)
- T1 kiểm chứng độc lập đợt 132: **mọi claim lớn PASS** (đếm cuối đợt 132 = 10 batch / 13 entry / 12 file; lũy kế 111–132 = 218/539/473; lượt yên #10 0 attempt (75 poll gate A, RAM 427–552 MB) đúng; suite 27/27; O8 21/21 + 21/21; WebKit FULL PASS lần thứ 10 liên tiếp (123–132) đúng; reboot giữa lượt lần thứ 6 + khung chết 19 s đúng; mù #51/gap [2.079, 2.099] s CERT n=45/FULL n=60/mù #49 B kiểm lại lần 2 giống hệt đúng; headroom 2.738 đúng). **5 sai số nhỏ mới (F-133-1 → F-133-5), không đổi verdict:** F-133-1 brief nói RAM gate A "420–552 MB", đo trực tiếp là 427–552 MB; F-133-2 lỗ đuôi B mù #51 ghi 4.392 s vs 4.393 s thật (lệch quy ước biên 1 s); F-133-3 T8 viết "8 lần thử đều hết 10 phút" nhưng lần 6 chỉ chạy 5 poll rồi bị reboot giết (đúng: 7 timeout + 1 lần bị giết); F-133-4 brief nói prereg T3 đăng ký 17:46Z nhưng file ghi 17:45Z; F-133-5 nhãn "reboot lần thứ N liên tiếp" dùng cho hai chuỗi đếm khác nhau.
- T2 EPERM: probe #52 ok=2 fail=0 (20:42:56Z, boot 07da9c50 #82?). **Mù #52 (17:46:50Z → 20:42:56Z, 10.566 s) ĐÓNG HOÀN TOÀN — A đóng (merged 162 mốc, lỗ lớn nhất 419 s), B đóng (merged 113 mốc, lỗ lớn nhất 469 s + uptime trực tiếp), 0 ẩn — mù đóng hoàn toàn đầu tiên kể từ #50; lần đầu merged đảo verdict hai cây (hai cây riêng tưởng MỞ do artifact mtime ghi-đè-cuối).** **Gap mới CHỨNG NHẬN DẠNG KHOẢNG: #81?→#82? = [7.797 s, 7.817 s] (mid 7.807 s; F81? và F82? đều đo trực tiếp) → CERT n=45 → n=46 / FULL n=60 → n=61.** Gap #80?→#81? = 8.558 s GIỮ SPAN. **Mù #51 B kiểm lại lần thứ 3: VERDICT KHÔNG ĐỔI** (lỗ lớn nhất 4.393 s, tối đa 3 ẩn). **Mù #49 B: KHÔNG kiểm lại đợt này** theo quyết parent 132 §12.3(d). Khung chết #81? hai bản ghi: (19:33:56Z, 19:34:15Z] (19 s) và (19:34:00Z, 19:34:15Z] (15 s, session T2) — khung hẹp nhất làm chuẩn. EPERM 0 sóng thật (sóng gần nhất ~11:55–12:11Z 11/11, ~152h48' trước probe #52). WFS lần 39 chênh 0 (887/247; R7b 912/264; copies 25/17). RAM max trong mù 3.111 MB (50,7% guard); birefnet KHÔNG chạy. **Mù #53 MỚI MỞ.**
- T3 bước 2 (c2): **MÔ HÌNH GHOST-FREEZE/SKEW ĐƯỢC CỦNG CỐ — phép thử ngoài mẫu đầu tiên đạt cả 3 phép thử chính trên attempt1 hợp lệ duy nhất của T4** (20/20 pass, median 39,5 ms): **P1 ĐÚNG 5/5** (c2) trong ±1 tick run-end (baseline 9,6%, p = 8,0×10⁻⁶); **P3 ĐÚNG 5/5** đóng băng labelMs tại tick (baseline 20,3%, p = 3,4×10⁻⁴; 0 tick bắt kịp); **P2 ĐÚNG** (0 lag âm); **P4 ĐÚNG** (thuần +1f = 5, tổng = 5, skp=1 = 0, lag ≥+5f = 0). Cộng dồn 2 lượt gần nhất: P1 14/14, P3 13/14. **P5 2/4** (snap 35 ms ✓, raw 8 ms ✓; label-floor +1 76,5% vượt dải ≤76% một chút; run ≥3 tick 12, thiếu 1 so với 13–22) — ghi rõ, không bác mô hình. **P6 trong khoảng cả ba** (bin 0 34,4% / +1/+2 52,3% / +3 3,1%). **P7 KHÔNG KIỂM ĐƯỢC lần thứ ba liên tiếp (0/5):** log draw kết thúc 10.119 ms TRƯỚC flip, 0/376 tick post trong ±500 ms — desync seek-latency VẪN chưa được kiểm. DEF v0.5 vẫn chưa viết.
- T4 WebKit: **lượt yên #10 ĐO XONG, HỢP LỆ — attempt1 20/20 pass, exit 0, tickCost total median 39,5 ms (THẤP NHẤT trong 9 lượt yên hợp lệ), lớp B 5/5 ĐẠT; ngưỡng ≤60 ms GIỮ, biên 20,5 ms (rộng nhất từ trước).** 9 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 (trung bình 46,9 ms). **Cơ chế chờ RAM mới HOẠT ĐỘNG:** poll dày 45 s; gate 0 đạt khi cờ T5 xuất hiện 20:50:22Z; cửa mở poll #3 20:50:45Z (RAM 1168 MB), chớp ngay. Cửa sổ lần này KHÔNG phải cửa sổ vàng sau boot (boot đã 76 phút tuổi) mà là đợt hồi RAM giữa lượt (479 → 1549 MB; nguyên nhân chưa xác định — tương quan T7/T9 done 20:45Z). **(c2)=5** (seq 166/218/293/323/394, đều lag 1f); F6' tái xác nhận ĐÓNG (62/62); histogram n=752 ghost: bin 0 34,4%, +1/+2 52,3% (cao nhất), +3 3,1% (thấp nhất), snap median 35 ms. **Log draw 0/5 — re-arm THẤT BẠI, nguyên nhân xác định ở code:** `preview.tsx` loop-gate dòng 705 chỉ ghi loop 1–2 + re-enable xóa mảng (dòng 700); 7 lần re-arm vet +0. **KHÔNG attempt2** (quyết T4 có căn cứ). JSON 3.274.496 B, sha256 e3ca1ac5….
- T5 hạ tầng: **widen trigger §8.2(B) v6 (A2) XONG** (quyết parent đợt 132 §12.3(b)): replay xong (installs>0, 0 proc) + postboot FAIL + log poll ghi thiếu ≥1 gói đích → trigger --repair 1 lần có giám sát; kiểm chứng khô /tmp **8/8 ca đúng** (hình dạng b379ecd7 GST=268 thiếu gstreamer1.0-gl → A2/yes; đối chiếu v5 → -/no, đúng khoảng trống proxy); md5 watcher 6a04a364… → 1946b2d0…; **nhánh A2 chưa kích hoạt live** (chỉ kiểm chứng khô). **Postboot boot 07da9c50 PASS:** poll0 20:48Z exit 0; watcher b84 2 poll, TRIGGER=NO; **cờ gate-visible `round133-t5/POSTBOOT_PASS` viết 20:50:22Z** (boot +1h16m07s); final confirm 21:04Z exit 0; KHÔNG --repair. dpkg 1545/221, gstreamer1.0-gl đã cài bởi replay, GST 269, lists 37. **PHA 2 (c2) XONG:** P1/P3 ĐÚNG, P2 ĐÚNG, P4 ĐÚNG, P5 2/4, P6 trong khoảng, **P7 KHÔNG KIỂM ĐƯỢC** (log 0/5) — **mô hình ĐƯỢC CỦNG CỐ** (khớp độc lập verdict T3). postboot-check.sh sửa 1 lần (md5 0d412c35… → 55f6b3df…, chỉ tham chiếu boot). Headroom 2625 → 2623; RAM 475–1574 MB. R9 (a) nhắc lần 16.
- T6 lock: **KHỎE** — log chính thức 864 dòng, 250/250 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 mất dấu, 0 TIMEOUT mới, 0 STALE-LOCK mới; 5 chu kỳ mới đều sạch (t10-round132 hold 105 s + t4 lượt yên #10 attempt1 hold 206 s + t8-round133 ×3 hold 65/129/230 s). Suite 9/9 ×2 (lần xanh thứ 9 liên tiếp). Repro message chạy đúng trên /tmp, **không lặp lại F-132-T6-1**. **Prune cooldown lần 8: xóa 0 file** (lần thứ 8 liên tiếp; 77 file / 1078 B lúc đóng; file cũ nhất đủ 7 ngày ~21/11 18:38Z). **CHỐT SỐ BOOT: chuỗi tương đối CHỐT #57→#83 (27 boot), số tuyệt đối VẪN TẠM (giữ "?")** (mù #37 tối đa 29 ẩn + mù #49 B mở tối đa 1 ẩn + mù #51 B mở tối đa 3 ẩn; mù #52 đóng hoàn toàn nhưng không làm neo được). Gap #81?→#82? CERTIFIED [2h09'57", 2h10'17"]; gap #82?→#83? danh nghĩa 2h07'25" SPAN. **F-133-T6: không có sai số mới.** 0 zombie, 0 Xvfb, /tmp/.X11-unix/ trống.
- T7 scheduler: **cửa SẠCH — 0 slot thiếu mới** (HB 6/6, DR 3/3, vcut 0 thiếu); lũy kế **HB 42/184, DR 47/163**. **Dị thường started_at lượt vcut +7.135 s (lần thứ 3 liên tiếp, lớn nhất từ trước)** — lượt đợt 132 ghi started_at 19:34:46Z dù T7 đợt 132 đã thấy cùng run_id running lúc 17:40Z; chỉ ghi nhận mốc. Không reboot mới giữa lượt trong cửa kiểm của T7.
- T8 Vite harness: **3/3 exit 0 trên boot 07da9c50** (84l10/85m4/86n2, 21:15:30–21:23:09Z, Xvfb :199, lock t8-round133) — gate mở 21:10:33Z (waiter poll 28; cờ T4 + POSTBOOT_PASS 20:50:22Z). **P3 không kẹt lần thứ năm liên tiếp** (đếm theo các đợt CÓ chạy harness); P5 seek kẹt dài nhất 0 mẫu ở cả hai nhánh; HB128 19 dòng sampleFor. Fixture rebuild 6/6 md5 khớp đợt 125–132. Deadline waiter gõ tay trực tiếp (1794956400, kiểm chứng trước khi chạy) — lỗi sed đợt 132 không tái diễn. Dọn sạch: 0 process sót, socket X199 + lock đã unlink.
- T9 headroom: **2.632** (2 lần đo giống hệt, chênh 0 trong-boot) — tiếp tục giảm từ 2.738 đợt 132 (−106, −3,9%); chuỗi dài hạn 4.438 → 2.632 (−40,7%). **Còn 832 trên ngưỡng báo < ~1.800** (~7–8 đợt nữa mới chạm nếu đà giữ nguyên — chỉ là phép chia). Trần max_user_watches = 63.747 (không đổi). **RAM khả dụng 433–512 MB — thấp nhất T9 từng đo trực tiếp** (min 433 MB < min đợt 131 là 502 MB); **balloon virtio đứng yên tuyệt đối 6.443.824 kB** (~79,3% tổng RAM), đúng bằng mức đợt 131. **Birefnet KHÔNG THỬ** (max 512 MB = 8,3% guard 6 GB); u2net là fallback chính thức. 0 ENOSPC ngoài probe.
- T10 verify: **suite cây gộp 27/27 exit 0, 0 rerun** (21:57:12–22:02:06Z, RAMavail 606 MB lúc bắt đầu, boot mới 3e7a7b51; 354 assertions pass); **O8 Chromium 21/21 + WebKit 21/21 exit 0, 0 rerun** (22:02:37–22:04:37Z, giữ lock 120 s; 42 dòng PASS, 0 FAIL) — **WebKit FULL PASS lần thứ mười một liên tiếp (đợt 123–133).** Cây không đổi trong lúc đóng (preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093). Lock TRỐNG lúc đóng (0 ticket + 78 cooldown, 1092 B; recount độc lập: file thật 873 dòng, chính thức 867 dòng, 251/251 cặp, 0 đang giữ). 0 process sót; /tmp/.X11-unix/ trống lúc đóng (3 socket X193/X194/X195 do chính suite tạo ra, 0 process, đã dọn tay 22:05Z). **REBOOT GIỮA LUỘT lần thứ 7 liên tiếp (07da9c50 → 3e7a7b51, btime 21:41:40Z)** — sau khi 8/9 luồng đã xong (muộn nhất T8 21:27Z), không luồng nào mất việc; khung chết #82? hai bản ghi: chính (21:28:35Z, 21:41:40Z] (mốc 21:28:35Z nay chỉ còn trong hồ sơ T6 — mtime file đã bị ghi đè bởi mục T6 của parent lúc 21:52Z) + hẹp nhất (21:29:47Z, 21:41:40Z] (thư mục exec-logs trống, không quy trách nhiệm được — T10 kiểm lại trực tiếp). Replay boot mới #83? xong 21:56:14Z (1.545 dòng / 221 installs, gói cuối gstreamer1.0-tools — T10 quan sát trực tiếp; T5-134 xác nhận chính thức). **3 sai số mới (F-133-6 → F-133-8), không đổi verdict:** F-133-6 T2-133 §0 gọi reboot #81?→#82? là "lần thứ 7" trong khi chuỗi gộp của T10/T1 đếm là sự kiện thứ 6 (thứ 7 là #82?→#83?) — từ đợt 134 dùng MỘT định nghĩa duy nhất (chuỗi gộp §10.2 LIMITS gộp); F-133-7 T2-133 §0 viết khung chết #81? "khung 19 s vẫn là chuẩn" mâu thuẫn chính §2.2/§4 của T2 + quyết parent (chuẩn đúng: khung hẹp nhất 15 s); F-133-8 RAM min giữa lượt yên #10: T4 ghi 636 MB, T5 ghi 622 MB lúc 20:52:07Z (chênh lấy mẫu 14 MB, B5 vẫn ĐẠT). **Đếm cuối đợt 133 = 10 batch / 12 entry / 12 file duy nhất (gồm closing); lũy kế 111–133 = 228 batch / 551 entry / 483 file duy nhất** (dedup toàn cục; đã tái kiểm 111–132 = 218/539/473 khớp số công bố đợt 132 — lần tái kiểm độc lập thứ tám liên tiếp). **Verdict đóng: CHẤP NHẬN.** Chốt chặn đã xóa khi đóng đợt; cờ round133-t10.done ĐÃ TẠO.

## 63. Cập nhật sau đợt 134 (17–18/11/2026 — xem docs/PHASE9_ROUND134_LIMITS.md; T10 đóng 02:02Z 18/11, 9/9 — lượt yên WebKit #11 KHÔNG ĐO ĐƯỢC (0 attempt, 4 reboot giết gate); nhánh A2 kích hoạt LIVE lần đầu + repair thành công; started_at lượt 134 BỊ VIẾT LẠI lần thứ 5 liên tiếp (+6.967 s, xác nhận giả thuyết scheduler ghi lại sau reboot); 5 reboot giữa lượt — nhiều nhất một đợt; WebKit O8 21/21 lần thứ mười hai liên tiếp)
- T1 kiểm chứng độc lập đợt 133: **mọi claim lớn PASS** (đếm cuối đợt 133 = 10 batch / 12 entry / 12 file; lũy kế 111–133 = 228/551/483; lượt yên #10 attempt1 20/20 median 39,5 ms; (c2)=5 đúng 5 seq; P1 5/5 p=8,046×10⁻⁶; P3 5/5 p=3,419×10⁻⁴ — khớp 100% từ JSON gốc; LIMITS gộp 133 lúc đóng 38.006 B sha e9cf1773…90316e017 khớp bản copy lúc đóng). **2 sai số nhỏ mới (F-134-T1-1, F-134-T1-2), không đổi verdict:** F-134-T1-1 LIMITS T4-133 viết prereg T3 "17:46Z" hai lần, file ghi 17:45Z; F-134-T1-2 harness kiểm chứng khô widen v6 của T5 chỉ nằm trong /tmp/t5v6-test/, đã mất sau reboot (T1 kiểm lại 8/8 từ code đã ship).
- T2 EPERM: probe #53 ok=2 fail=0 (23:46:54Z, boot d2e66749 #84?). **Mù #53 (20:42:56Z → 23:46:54Z, 3h03'58") KHÔNG ĐÓNG HOÀN TOÀN — A đóng (merged 120 mốc, lỗ lớn nhất 822 s), B MỞ tối đa 3 ẩn (merged 59 mốc, lỗ lớn nhất 4.227 s = đuôi (22:16:31Z, 23:26:58Z], 0 session chạm đuôi B), C đóng (uptime + luật lỗ, 28 mốc).** **Gap mới CHỨNG NHẬN DẠNG KHOẢNG: #82?→#83? = [7.635 s, 7.655 s] (mid 7.645 s) → CERT n=46 → n=47 / FULL n=61 → n=62** (caveat: F83? chưa từng đo trực tiếp — cùng lớp các gap trước). Gap #83?→#84? = 6.318 s GIỮ SPAN. Khung chết #83? (22:16:31Z, 23:26:58Z] (4.227 s). **T2 QUYẾT nhận bản hẹp khung chết #82? (21:29:47Z, 21:41:40Z] (713 s) làm chuẩn** (tiền lệ quyết parent 130 §12.3(f)/131 §12.3(c)/132 §12.3(c)); bản chính (21:28:35Z, 21:41:40Z] vẫn ghi đầy đủ. **Reboot #84?→#85? NGOÀI dải cơ học** (sớm hơn cận dưới 412 s) — đứt chuỗi 14 lần INSIDE liên tiếp (lần ngoài dải đầu tiên kể từ #70, đợt 125). EPERM 0 sóng thật; WFS lần 40 chênh 0 (891/248; R7b 916/265; copies 25/17). RAM max trong mù 1.903 MB (31,0% guard). Prereg T2 có 2 dự báo verdict SAI (B đóng — thực tế B mở; gap #83?→#84? chứng nhận được — thực tế giữ SPAN). **Mù #54 MỚI MỞ.**
- T3 (c2): **sửa instrumentation xong 23:47Z** — preview.tsx 805409f0 → 530e10a7 (loop-gate nới: ghi mọi loop ≥1, mặc định không giới hạn, `window.__vcutC2DrawLogMaxLoop = N`; re-enable KHÔNG xóa mảng/KHÔNG reset loopNo, chỉ reset khi `window.__vcutC2DrawLogReset === true`; log vẫn mặc định tắt); tsc 0 lỗi; vite build PASS (13,01 s, 290 modules). **Bước 2 KHÔNG CÓ DỮ LIỆU MỚI** — script gốc crash TypeError dòng 92 vì flip.wallMs=None (không có nhánh xử lý JSON partial — F-134-T3-2); phân tích partial bằng script riêng: JSON partial 257.631 B sha b402b3f3…76bc6, passes=2, blendTick n=23, tickCost n=27 median 58 ms (chỉ pre-flip, KHÔNG dùng làm verdict), c2DrawLog n=53 toàn loop 1, 0 wrap — khớp 100% T4. **P1–P7 đều KHÔNG KIỂM ĐƯỢC. KHÔNG REVERT trong đợt này** — điều kiện revert theo quyết parent đợt 133 §12.1(a) là "revert SAU KHI ĐO" nhưng đợt này chưa đo được lượt nào; bản gốc 805409f0 còn nguyên tại round134-t3/preview.tsx.orig-805409f0. T3 + T4 + T5 đề xuất GIỮ fix cho đợt 135. Các sai số T3: F-134-T3-1 (nhãn cutoff sai: log "22:30:00Z 17/11" nhưng epoch 1794965400 = 01:30:00Z 18/11), F-134-T3-3 (wait-script chỉ chạy 1 poll rồi bị reboot #1 giết), F-134-T3-4 (đếm dòng diff 60 vs 36 vs 34), F-134-T3-5 (passesDone đọc ở results.b được None — trường nằm ở top-level, giá trị 2; T5 §8.1 xác nhận độc lập).
- T4 WebKit: **lượt yên #11 KHÔNG ĐO ĐƯỢC — 0 attempt hợp lệ.** Gate 0 + gate A MỞ ĐÚNG 1 LẦN ở poll #1 (23:50:17Z, boot d2e66749, RAM 2037 MB, cờ T5 POSTBOOT_PASS 23:49:21Z) — cửa sổ vàng sau boot; attempt1 bị reboot giết giữa pass 3/20 (passesDone=2, JSON partial 257.631 B, flip chưa tới, heartbeat kẹt elapsed=100s). Sau đó 3 reboot nữa (tổng 4 reboot trong cửa sổ 23:50Z–01:00Z); cờ T5 mới KHÔNG BAO GIỜ xuất hiện cho 3 boot sau; postboot check-only exit=1 suốt; RAM kẹt 451–710 MB. Tổng 82 poll (1+23+4+54), chỉ 1 lần cửa mở. Hết hạn 01:00Z, poller dừng exit 5. **Ngưỡng ≤60 ms GIỮ NGUYÊN, không có số mới** (9 lượt hợp lệ: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms, trung bình 46,9 ms). Log draw partial n=53 toàn loop 1, 0 wrap — fix CHƯA ĐƯỢC KIỂM CHỨNG runtime; P7 không kiểm được lần thứ tư liên tiếp.
- T5 hạ tầng: **NHÁNH A2 KÍCH HOẠT LIVE LẦN ĐẦU** trên boot cc1f9de0: replay xong (1730 dòng / 252 installs — NHIỀU HƠN baseline 221/1545; seed list boot này lớn hơn; baseline replay không còn giá trị tuyệt đối) nhưng postboot FAIL chỉ vì thiếu đúng **1 gói đích gstreamer1.0-plugins-bad** (10/11 package đủ) → C4=A2(yes) từ poll 39; silent vượt 600 s → TRIGGER=YES poll 49 (silent 633 s) + poll 50 (693 s); kiểm chứng độc lập 5/5 ĐẠT → **--repair 1 lần (once-only) 01:11:39Z THÀNH CÔNG** (apt-get update OK + cài plugins-bad, RE-CHECK 4/4 PASS, exit 0, <90 s); **cờ POSTBOOT_PASS viết 01:13:56Z (poll 53)**, GST 120 → 269 file (plugins-bad thêm đúng 149 file — trùng baseline 269). Nguyên nhân gốc replay bỏ qua gói này chưa xác định (apt-get 7121 download ~14 phút rồi biến mất, không có entry history.log cho chính gói đó). Boot 81335571: replay KHÔNG CHẠY (dạng (B)) → TRIGGER=YES dạng (B) poll 6 → --repair bắt đầu 00:06:20Z thì **reboot giết giữa update** (bị gián đoạn, không phải thất bại). Boot 52ca5d6d: không watcher nào chạy. Boot 1d2e984d: replay đang chạy mạnh (dpkg 729 lúc chết). **PHA 2 KHÔNG CÓ DỮ LIỆU — P1–P7 đều KHÔNG KIỂM ĐƯỢC** (khớp 100% số T3); cộng dồn P1 14/14, P3 13/14 GIỮ NGUYÊN. **F-134-T5-1:** §2 viết "đợt 133 (07da9c50 sống — chuỗi đứt 1 đợt)": SAI theo định nghĩa gộp (đợt 133 CÓ reboot giữa lượt #82?→#83?, sự kiện gộp #7). R9 (a) nhắc lần 17.
- T6 lock: **KHỎE** (1 caveat) — trống lúc mở/đóng1/đóng2 (0 ticket + 78 cooldown); log chính thức **869 dòng / 251 cặp ACQUIRED→RELEASED**, 1 "đang giữ" = t4 reboot-kill (trap release ghi cooldown TRƯỚC khi ghi log RELEASED — reboot cắt ngang giữa hai bước; **ca mất dòng RELEASED do reboot ĐẦU TIÊN, F-134-T6-2** — log giữ mãi 1 ACQUIRED không cặp; đổi thứ tự ghi hoặc fsync cần quyết parent); 0 TIMEOUT/STALE-LOCK mới; "KHÔNG NHẢ" trên lock thật: 0; suite 9/9 ×2 (lần thứ 10 liên tiếp; suite xanh lần thứ 16 liên tiếp). **Prune lần 9: xóa 0 file** (lần thứ 9 liên tiếp; queue 78 file / 1092 B). **Chuỗi boot tương đối CHỐT #57→#85 (29 boot); số tuyệt đối VẪN TẠM (giữ "?")** (mù #37 tối đa 29 ẩn + mù #49 B mở tối đa 1 ẩn + mù #51 B mở tối đa 3 ẩn + dị thường đồng hồ #84?→#85?). Gap #83?→#84? 6.318 s SPAN; #84?→#85? 1.579 s SPAN. **F-134-T6-1:** T5 đếm nhãn reboot lệch 1 so với định nghĩa gộp xuyên suốt §2 (#84?→#85? gọi "#8", đúng ra sự kiện gộp #9; các reboot sau cũng lệch −1).
- T7 scheduler: **cửa BẨN — 2 slot thiếu MỚI** (HB 22:50:50Z + DR 23:00Z, cả hai trong khung chết reboot); HB 6/7 có, DR 2/3 có; lũy kế **HB 43/191 (22,5%), DR 48/166 (28,9%)**. HB muộn +887 s (slot 23:20:50Z, start 23:35:37Z) — **lần thứ 5 đúng mẫu ":35:37Z, 14 s trước vcut dispatch"** (đợt 127/129/130/132/134). **Dị thường started_at lượt vcut đợt 134 BỊ VIẾT LẠI: +6.967 s (lần thứ 5 liên tiếp) — T10 kiểm lại lúc đóng: run 19a360f1 nay ghi started_at 01:31:58Z = btime boot mới 01:31:18Z + 40 s (T7 lúc 23:53Z thấy started 23:35:51Z, jitter 0 s) — GIẢ THUYẾT "scheduler ghi lại started_at khi hồi phục sau reboot" ĐƯỢC XÁC NHẬN** (chuỗi started−btime: 46 s, 31 s, 36 s, 40 s). F-134-T7-1 (quyết định biên cửa sổ về slot HB 23:50:50Z → mẫu số 191; nếu giữ quy ước cũ thì 43/190 — verdict không đổi).
- T8 Vite harness: **2/3 exit 0 (84l10 trên cc1f9de0; 85m4 trên 8ae55060), 1 timeout (86n2 trên 8ae55060, exit 124).** 84l10 exit 0 (01:15:24–01:16:31Z, W1×3/W2/E4 PASS). 85m4 chạy 1 KẸT P1-phaseA — sampler HB128 176 dòng, TẤT CẢ n=0/100 trong 881 s, bị **reboot #5** (cc1f9de0 → 8ae55060, btime 01:31:18Z) giết trước timeout 900 s; RAM avail tụt 1226 → 491 MB. Retry trên boot mới (gate thay thế: check-only postboot trực tiếp exit 0 lúc 01:34:51Z — cờ T5 cho boot mới không tồn tại vì watcher b87 chết theo cc1f9de0): **86n2 exit 124** (P1/P2/P3/P4-lần1 PASS, kẹt P4-lần2 im lặng ~13,7 phút); **85m4 retry exit 0** (~2m09s, P1/P2/P3/P4×3/P5 PASS, HB128 19 dòng — KHÔNG tái hiện kẹt P1-phaseA). **P3 không kẹt lần thứ sáu liên tiếp** có chạy tới P3. Hai lần kẹt đều là "treo không trả mẫu" ở 2 pha/2 boot khác nhau — không kết luận hồi quy. **F-134-T8-1:** header run-webkit-summary.txt ghi "btime 00:17:46Z", lệch +10 s so với btime thật 00:17:36Z (LIMITS §1 ghi đúng). **F-134-T8-2:** §0 viết "preview.tsx 530e10a7 suốt lượt": SAI — lúc T8 mở 23:45Z cây còn 805409f0, fix T3 chỉ áp lúc 23:48:59Z (mọi lần chạy harness đều trên 530e10a7 nên không đổi kết quả).
- T9 headroom: **2.505** (2 lần: 2.515 → 2.505, chênh −10 trong boot; giảm −127 so với 2.632 đợt 133, −4,8%); còn **705 trên ngưỡng báo < ~1.800**; gấp ~1,59 lần nhu cầu vite (~1.578 watch); trần inotify 63.747 không đổi. RAM khả dụng theo sampler T9: **min 460 MB → max 2.438 MB** (đỉnh chớp 23:49:01Z — đợt hồi RAM lớn giữa lượt, KHÔNG phải cửa sổ vàng sau boot). **Balloon virtio KHÔNG đứng yên — xả mạnh 6.371.088 → 4.276.284 kB** (ròng −2.094.804 kB ≈ −2,05 GB trong ~4,5 phút); lúc đóng cửa sổ ~52,7% tổng RAM (đợt 133: ~79,3%). **Birefnet KHÔNG THỬ** (max 2.438 MB = 39,7% guard 6 GB). Các sai số T9: F-134-T9-1 (brief mở ~1.295 MB vs T9 đo 460 MB), F-134-T9-2 (đỉnh 2.438 MB là chớp ngắn), F-134-T9-3 (mốc bắt đầu đợt hồi không xác định chính xác).
- T10 verify: **suite cây gộp 27/27 exit 0, 0 rerun** (01:44:12–01:48:07Z, boot 8ae55060, cây preview.tsx 530e10a7, RAMavail 439 MB lúc bắt đầu; 354 assertions pass; caveat: chạy song song với retry 86n2 của T8 lúc đó đang kẹt-im — node 86n2 CPU 0,4% idle, loadavg 0,13); **O8 Chromium 21/21 + WebKit 21/21 exit 0, 0 rerun** (01:57:43–01:59:31Z, giữ lock 108 s; 42 dòng PASS, 0 FAIL) — **WebKit FULL PASS lần thứ mười hai liên tiếp (đợt 123–134).** Cây lúc đóng: preview.tsx **530e10a7 (fix T3, KHÔNG revert — chờ quyết parent §12.1(a))**, media.ts 2c384ed1, vite.config.ts ee80d093. Lock TRỐNG lúc đóng (0 ticket + 80 cooldown); 0 process sót; /tmp/.X11-unix/ trống lúc đóng (3 socket X193/X194/X195 do chính suite tạo ra, 0 process, đã dọn tay 02:00Z). **REBOOT TRONG PHIÊN ĐÓNG (cc1f9de0 → 8ae55060, btime 01:31:18Z, sự kiện gộp #13)** — reboot giữa lượt thứ 5 của đợt (6 boot, nhiều nhất một đợt); boot không đổi sau 01:32Z tới lúc đóng. **Đếm cuối đợt 134 = 10 batch / 12 entry / 12 file duy nhất (gồm closing); lũy kế 111–134 = 238 batch / 563 entry / 493 file duy nhất** (dedup toàn cục; đã tái kiểm 111–133 = 228/551/483 khớp số công bố đợt 133 — lần tái kiểm độc lập thứ chín liên tiếp). **sha256 LIMITS gộp lúc đóng: 8346baccc72b487c8961f698380e1f43082cec2a584780371ae70f54df5c1f89** (29.922 B — lưu trong hidden_files/round134-t10/PHASE9_ROUND134_LIMITS.closing-copy.md + cờ round134-t10.done + build-loop log). **Verdict đóng: CHẤP NHẬN** (9/9 cờ; đóng xong 02:02Z — trễ 2 phút so với hạn cứng 02:00Z do retry T8 xong 01:53Z + O8 chạy 01:57–01:59Z). Chốt chặn đã xóa khi đóng đợt; cờ round134-t10.done ĐÃ TẠO. Oversize đợt này: T2 58.271 B, T6 50.224 B, T5 49.794 B, LIMITS gộp 29.922 B (dưới ngưỡng), GAP ~318 KB (+ 6,4 MB JSON chưa lên từ trước).

## 64. Cập nhật sau đợt 135 (18/11/2026 — xem docs/PHASE9_ROUND135_LIMITS.md; T10 đóng 04:10Z 18/11, 9/9 — lượt yên WebKit #12 ĐO ĐƯỢC HỢP LỆ (median 40,0 ms, logger nới kiểm chứng runtime loop 1–22, P7 kiểm được lần đầu); T3 ĐÃ REVERT preview.tsx về 805409f0 sau khi đo; T6 thực hiện xong đổi thứ tự ghi log lock; mù #54 ĐÓNG HOÀN TOÀN; started_at lượt 135 BỊ VIẾT LẠI lần thứ 6 liên tiếp (+36 s sau btime); 1 reboot giữa lượt (sau khi T8 xong việc); WebKit O8 21/21 lần thứ mười ba liên tiếp)
- T1 kiểm chứng độc lập đợt 134: **mọi claim lớn PASS** (đếm cuối đợt 134 = 10 batch / 12 entry / 12 file; lũy kế 111–134 = 238/563/493; lượt yên #10 attempt1 20/20 median 39,5 ms; (c2)=5 đúng 5 seq; P1 5/5 p=8,046×10⁻⁶; P3 5/5 p=3,419×10⁻⁴ — khớp 100% từ JSON gốc; LIMITS gộp 134 lúc đóng 29.922 B sha 8346bacc…c1f89 khớp bản copy lúc đóng). **1 sai số mới (F-135-T1-1), không đổi verdict:** các kiểm đầu lúc đóng của T10-134 (§10.2) không còn file bằng chứng riêng, chỉ còn 1 dòng VERIFY DONE — T10-135 đã sửa theo đề nghị (mọi output kiểm lúc đóng đợt này đều lưu file thật trong round135-t10/).
- T2 EPERM: probe #54 ok=2 fail=0 (02:45:23Z, boot 78b55838 #90?). **Mù #54 (23:46:54Z 17/11 → 02:45:23Z 18/11, 2h58'29") ĐÓNG HOÀN TOÀN, 7/7 đoạn, tối đa 0 ẩn** — lần đầu một mù đóng hoàn toàn kể từ mù #52. Merged 350 mốc; lỗ lớn nhất 718 s (đuôi F) < sàn 1.147 s. **6 gap MỚI CHỨNG NHẬN DẠNG KHOẢNG** (lần đầu một đợt chứng nhận nhiều hơn 1 gap): #84?→#85? = [1.569 s, 1.589 s]; #85?→#86? = [1.168 s, 1.188 s]; #86?→#87? = [45 s, 65 s]; #87?→#88? = [216 s, 236 s]; #88?→#89? = [4.412 s, 4.432 s]; #89?→#90? = [3.359 s, 3.379 s] → **CERT n=47→53 / FULL n=62→68** (caveat: 4 gap giữa có F CHƯA ĐO ở CẢ HAI ĐẦU — lớp bằng chứng mới, yếu hơn). Gap #83?→#84? = 6.318 s GIỮ SPAN. Khung chết 6 boot mới (chặt): #84? (23:52:41Z, 23:53:17Z] (36 s); #85? (00:12:49Z, 00:12:55Z] (6 s); #86? (00:13:12Z, 00:13:50Z] (38 s); #87? (00:17:35Z, 00:17:36Z] (1 s — chặt nhất từ trước tới nay); #88? (01:28:02Z, 01:31:18Z] (196 s); #89? (02:15:29Z, 02:27:27Z] (718 s). **Dải cơ học: #86?/#87?/#88? NGOÀI DẢI liên tiếp (sớm 812 s / 1.935 s / 1.764 s)** — sau khi #85? đã đứt chuỗi 14 lần INSIDE (đợt 134); #89?/#90? TRỞ LẠI TRONG DẢI. Dải mới cho #91? (p10–p90 FULL68): [02:54:47Z, 04:53:38Z]. EPERM 0 sóng thật; WFS lần 41 chênh 0 (896/249; R7b 921/266; copies 25/17). RAM max trong mù 2.350 MB (38,3% guard). Prereg T2 KHÔNG có dự báo verdict SAI. Các sai số T2: F-135-T2-1 (dải cơ học prereg lệch 1 s do cắt float), F-135-T2-2 (blind54-merged.py lỗi IndexError lần chạy đầu — đoạn C chỉ 1 mốc), F-135-T2-3 (nhãn "blind#53" sót trong lần chạy đầu — số liệu không sai). **Mù #55 MỚI MỞ.**
- T3 (c2): **bước 2 CÓ DỮ LIỆU MỚI — lượt yên #12 ĐO ĐƯỢC (1 attempt hợp lệ, 20/20 pass). P1–P7 KIỂM ĐƯỢC ĐẦY ĐỦ, TẤT CẢ ĐÚNG:** P1 7/7 (p=1,9e-07), P2 ĐÚNG (0 lag âm), P3 7/7 (p=2,1e-05), P4 ĐÚNG (thuần +1f=7, skp=1=0, lag ≥+5f=0), P5 ĐÚNG (snap 35 ms, raw 8 ms, label-floor +1=74,9%, run ≥3=15), P6 trong khoảng thực nghiệm, **P7 KIỂM ĐƯỢC LẦN ĐẦU (coverage 7/7, 0 drawSrc trễ — LÀM YẾU desync)**. **Logger đã nới ĐƯỢC KIỂM CHỨNG RUNTIME LẦN ĐẦU: c2DrawLog n=1325, loop 1–22, loop ≥3 = 1196 entry, 21 wrap.** Cộng dồn P1 21/21, P3 20/21. Ngưỡng ≤60 ms GIỮ (median 40,0 ms). **REVERT ĐÃ THỰC HIỆN 03:47–03:48Z:** preview.tsx về bản gốc md5 805409f0 (khôi phục từ file .orig, diff với bản gốc = RỖNG — chính xác từng byte); tsc 0; vite build PASS (6,86 s). Fix 530e10a7 đã hoàn thành nhiệm vụ chẩn đoán và đã được gỡ theo quyết parent đợt 134 §12.3(a). T4 + T5 đề xuất GIỮ — quyết cuối thuộc parent (§12.1(a)); khôi phục fix bằng diff đã lưu (1 bước). Các sai số T3: F-135-T3-1 (tie ±27 ms ở seq 251 — T3/T5 chọn +27, T4 chọn −27; coverage không đổi), F-135-T3-2 (4 ghost occ bin −11/−9 là artifact aliasing), F-135-T3-3 (script bước 2 thiếu thống kê loopNo ở nhánh đầy đủ). F-134-T3-2 ĐÃ SỬA (script chịu được JSON partial).
- T4 WebKit: **lượt yên #12 ĐO ĐƯỢC — 1 attempt hợp lệ (attempt1, 20/20 pass, không reboot trong lúc đo). tickCost total median 40,0 ms (n=682, p90 65,0, max 101, min 28) — DƯỚI ngưỡng ≤60 ms, ngưỡng GIỮ NGUYÊN. (c2)=7, coverage log draw 7/7. Lớp B 5/5 ĐẠT. F6' ĐÓNG** (0 vi phạm thật / 75 tick, pixel-verified 100%). Gate 0 ĐẠT 02:45:13Z (cờ T5 b88 poll 2); gate A mở 2 lần — lần 1 (02:46:33Z, RAM 1031 MB) bị **F-135-T4-1** (poller gọi nhầm run-attempt-134.sh, exit 127, 0 attempt chạy; đã sửa trong 1 phút), lần 2 (02:50:57Z, RAM 1632 MB — hồi mạnh 974→1632 MB trong 45 s) → attempt1 chạy thành công. Chuỗi 10 lượt yên hợp lệ: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 ms, trung bình 46,6 ms. **P7 KIỂM ĐƯỢC LẦN ĐẦU SAU 4 LƯỢT** (coverage 7/7 + log phủ toàn bộ hậu-flip).
- T5 hạ tầng: **POSTBOOT boot mới PASS NGAY — cờ viết 02:45:13Z (poll 2).** Boot 78b55838: replay ĐÃ XONG lúc mở (dpkg 1545 dòng / 221 installs — TRÙNG baseline; GST 269 file; plugins-bad ĐÃ CÀI 1.24.2-1ubuntu4); watcher b88 v6 2 poll đều exit 0, TRIGGER=NO cả 2 → **--repair: 0 lần. A2 KHÔNG kích hoạt đợt này — ĐÚNG.** **NỢ ĐỢT 134 §11 — ĐIỀU TRA XONG PHẦN CƠ CHẾ:** replay cài từng gói một bằng apt-get riêng; gói nào install FAIL thì chỉ đếm failures+=1 rồi bỏ qua, tiếp tục gói sau, KHÔNG retry trong lượt (best-effort CÓ CHỦ Ý); apt-get 7121 chết ở pha download (không có entry history.log; dpkg đóng băng 729/107; cache 77M→84M; %CPU 3,3→0,1) — kích hoạt cụ thể (timeout? hash mismatch? connection reset?) CHƯA xác định được (text lỗi nằm ngoài cell). **PHA 2 CÓ DỮ LIỆU ĐẦY ĐỦ: P1–P5, P7 ĐỀU ĐÚNG** (script riêng; khớp 100% T3/T4); cộng dồn P1 21/21, P3 20/21; **đồng ý đề xuất GIỮ fix 530e10a7**. 0 reboot trong phiên T5 (02:41–03:11Z). Headroom theo T5: 2393→2389. **R9 (a) số đếm VẪN LÀ 16** (không viết số 17).
- T6 lock: **ĐÃ THỰC HIỆN đổi thứ tự ghi log RELEASED/cooldown** (quyết parent đợt 134 §12.3(b), sửa F-134-T6-2): script v2 md5 cd0c05c1 → 520b8baa (cmd_release mới: hold_s → rmdir → log RELEASED → ghi cooldown); spec freeze thêm §3.1. **Kiểm chứng cắt ngang:** script CŨ tái hiện đúng F-134-T6-2 (0 RELEASED, 1 đang giữ, cooldown CÓ); script MỚI: 1 RELEASED/1 cặp/0 đang giữ, chỉ mất file cooldown. **Lock KHỎE** — trống lúc mở/đóng (0 ticket + 80 cooldown); log chính thức **886 dòng, 256/256 cặp**, 1 "đang giữ" = t4 F-134-T6-2 cũ (giữ nguyên lịch sử); 0 TIMEOUT/STALE-LOCK mới; suite 9/9 ×2 (lần thứ 11 liên tiếp). **Prune lần 10: xóa 0 file** (lần thứ 10 liên tiếp). **Chuỗi boot tương đối CHỐT #57→#90; số tuyệt đối VẪN TẠM.** Gap #89?→#90? = 3369 s SPAN (khớp khoảng chứng nhận của T2). Khung chết #89?: (02:15:29Z, 02:27:27Z] (718 s) + bản hẹp (02:16:54Z, 02:27:27Z] (633 s). **F-135-T6-1: KHÔNG CÓ sai số mới.**
- T7 scheduler: **CỬA SẠCH — 0 slot thiếu MỚI (HB 7/7, DR 4/4).** Ba lần kiểm khớp hoàn toàn. **Mẫu muộn HB +887 s KHÔNG tái hiện** (dừng ở 5 lần). **Dị thường started_at — kiểm thứ 6:** đợt 134 KHÔNG bị viết lại lần 2; lượt 133 đứng yên qua 6 reboot; lượt 135 jitter 0 s tới 03:25Z. **QUYẾT DỨT slot HB 23:50:50Z (F-134-T7-1): thuộc cửa 134** — lũy kế HB giữ 43/191 làm gốc. Cập nhật lũy kế: **HB 43/198, DR 48/170** (số thiếu +0 cả hai). **F-135-T7: KHÔNG CÓ sai số mới.**
- T8 Vite harness: **3/3 exit 0 sau 1 retry (84l10 chạy 1 TIMEOUT 124 kẹt W1-lần2, retry exit 0; 85m4 exit 0; 86n2 exit 0).** Gate đủ 03:00:50Z (waiter poll 18, cờ T5 tới nhanh ~18 phút sau boot). **P3 không kẹt lần thứ bảy liên tiếp.** Hai kẹt đợt 134 KHÔNG tái hiện. **Reboot 1 lần SAU khi mọi harness đã xong (~03:32–03:35Z)** — giết lệnh giám sát của T8, khôi phục bằng đọc lại đĩa (F-135-T8-2). Fixture rebuild 6/6 md5 khớp. **F-135-T8-1:** 84l10 kẹt W1-lần2 (pha kẹt MỚI, im lặng ~886 s, RAM tụt 1437→349 MB; không tái hiện ở retry dù RAM lúc bắt đầu retry chỉ 652 MB). F-135-T8-3 (label "swap_used" sai, lặp lại từ đợt 128), F-135-T8-4 (report l10 trên đĩa là của lần RETRY).
- T9 headroom: **2.395** (2.403 → 2.395, chênh −8 trong boot; giảm −110 so với 2.505 đợt 134, −4,4%); còn **595 trên ngưỡng báo < ~1.800**; gấp ~1,52 lần nhu cầu vite. RAM khả dụng theo sampler T9: **844–1.734 MB** (đợt hồi RAM giữa lượt lần thứ ba liên tiếp; đỉnh 1.734 MB là chớp ngắn). **Balloon xả −619.348 kB** (~−0,59 GB trong ~3,5 phút; lúc đóng ~66,4% tổng RAM). **Birefnet KHÔNG THỬ** (max 1.734 MB = 28,2% guard). Các sai số T9: F-135-T9-1 (brief mở ~1.177 MB vs T9 đo 1.004 MB), F-135-T9-2 (đỉnh chớp ngắn), F-135-T9-3 (mốc bắt đầu đợt hồi không xác định chính xác), F-135-T9-4 (balloon xả không đơn điệu).
- T10 verify: **suite cây gộp 27/27 exit 0, 0 rerun** (03:52:14–03:56:06Z, boot bcc71e61, cây preview.tsx 805409f0 đã revert, RAMavail 475 MB; 354 assertions pass); **O8 Chromium 21/21 + WebKit 21/21 exit 0** (03:56:20–03:58:03Z, lock t10-round135 giữ 103 s; 42 dòng PASS, 0 fail) — **WebKit FULL PASS lần thứ mười ba liên tiếp (đợt 123–135).** Cây lúc đóng: preview.tsx **805409f0 (T3 đã revert)**, media.ts 2c384ed1, vite.config.ts ee80d093. Lock TRỐNG lúc đóng (0 ticket + 82 cooldown); 0 process sót; /tmp/.X11-unix/ trống lúc đóng (3 socket X193/X194/X195 do chính suite tạo ra, 0 process, đã dọn tay). **REBOOT TRONG PHIÊN ĐÓNG (78b55838 → bcc71e61, btime 03:35:20Z, sự kiện gộp #15)** — boot 78b55838 sống 4.073 s; gap #90?→#91? = 4.073 s NẰM TRONG dải cơ học T2 dự báo [02:54:47Z, 04:53:38Z]; khung chết #90?: (03:32:23Z, 03:35:20Z] (177 s). **started_at lượt 135 BỊ VIẾT LẠI lần thứ 6 liên tiếp: run f2fa4088 nay ghi 03:35:56Z = btime + 36 s** (T7 lúc 02:41Z thấy started 02:35:51Z, jitter 0 s) — chuỗi offset sau btime: 46 / 31 / 36 / 40 / 36 s. **Đếm cuối đợt 135 = 10 batch / 15 entry / 15 file duy nhất (gồm closing); lũy kế 111–135 = 248 batch / 578 entry / 503 file duy nhất** (dedup toàn cục; đã tái kiểm 111–134 = 238/563/493 khớp số công bố đợt 134 — lần tái kiểm độc lập thứ mười một liên tiếp). **sha256 LIMITS gộp lúc đóng: 316ee3565f6ae9d074149b08f66d09411a5049bf8a8ead5e0e09db935f02d7f9** (54016 B — lưu trong hidden_files/round135-t10/PHASE9_ROUND135_LIMITS.closing-copy.md + cờ round135-t10.done + build-loop log). **Verdict đóng: CHẤP NHẬN** (9/9 cờ; đóng xong 04:10Z — TRƯỚC hạn cứng 05:00Z). Chốt chặn đã xóa khi đóng đợt; cờ round135-t10.done ĐÃ TẠO. Oversize đợt này: T2 58.437 B, T6 47.396 B, T5 41.249 B, LIMITS gộp 54.016 B (chỉ stage paths, không push).

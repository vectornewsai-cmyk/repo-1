# Feature Status Matrix — VCut Studio

> **Mục đích:** Bảng trạng thái tập trung cho mọi tính năng, dựa trên CODE THẬT
> đang có trong repo (không phải tài liệu cũ hay lời hứa).
>
> **Mốc kiểm chứng:** 08/11/2026 (đợt 60 Q9, docs-only — cập nhật đợt 64–65
> + đợt 66 T10 docs-only + đợt 67 docs-only 09/11) — ma trận dưới đã cập nhật toàn bộ theo code thật
> trên đĩa + các file `*_LIMITS.md` đợt 51–59. Mốc cũ 19/10/2026 (commit
> `1844e2cc`) giữ lại trong lịch sử ở cuối file. Mọi số kho đếm lại 08/11
> bằng script (xem `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md` §0). Đợt 61 R10
> (08/11) thêm 6 hàng nested/adjustment/motion track/karaoke/ducking/downbeat
> theo LIMITS các đợt 1–10 + đồng bộ sounds index (1013 → 1043) và sticker
> manifest (214 → 244); xem `docs/PHASE9_ROUND61_R10_DOCS_INDEX_LIMITS.md`.
>
> **Cập nhật 09/11/2026 — đợt 67 (docs-only, luồng V9 đợt 68):** ma trận dưới
> cập nhật theo LIMITS đợt 67 (U1–U9, xem `docs/PHASE9_ROUND67_LIMITS.md`);
> đối chiếu trên đĩa ở luồng V9 đợt 68 (xem
> `docs/PHASE9_ROUND68_V9_DOCS_CI_LIMITS.md`). Đổi so với mốc đợt 66 T10:
> i18n **2297 → 2369 key lá** (đợt 67 U6 +28 key + U7 +15 key, parent gộp
> muộn 09/11, 0 collision, vi==en; đếm lại trên đĩa 09/11: vi == en ==
> 2369). Trần trial-decode GOP **60 s → 90 s** (đợt 67 U5: công thức
> 78.536 ms ở 64 MiB; probe treo đợt 66 không tái hiện). Sharpen headed
> nay **KHỚP trong chính decoder của preview** (đợt 67 U3: MAD 0,000,
> le8 100%, 4 cảnh × 2 mức; còn lại ocean sharp10 XẤP XỈ, basgo sharp10
> w1440/1:1 chưa KHỚP-trừ-sàn). Noise Chrome mô hình 2-stage (đợt 67 U2:
> w1440 noise05 chỉ còn lệch Δcorr R-G 0,199; ngưỡng halve 0,45–0,63 chưa
> đo). Stabilize ép `-threads 1` vào code + CLI/env (đợt 67 U1). Save/Load
> thêm modal nhận mảnh legacy thủ công + lịch sử job/resume (đợt 67 U6/U7).
> **Mask E1 đã làm xong** (đường PNG pre-render mặc định từ Phase 9 R2 —
> đính chính note 6 cũ ghi "chưa làm"; số 0,97 fps là đường geq cũ, chưa đo
> lại đường PNG). **TTS voice cloning ĐÃ expose UI + bridge** (Phase 9 R4:
> checkbox clone trong TtsButton + `POST /api/tts/clone`, test clone thật
> 24/10 — đính chính note 7 cũ ghi "chưa expose"; còn thiếu clone +
> đa-chunk kết hợp). Thêm hàng mới: **app desktop Electron Linux**
> (Phase 10, G6 43/43). Số audit CVE (tts 39 / bgremove 66) trong mục
> "Những gì CHƯA có" CHƯA cập nhật trong đợt này — V1 đợt 68 sở hữu số
> audit (U8 đã bump bgremove sạch 66 → 0, xem ghi chú trong LIMITS V9 §5);
> không tự sửa số audit ở đây.
>
> **Cập nhật 08/11/2026 — đợt 64–65 + đợt 66 T10 (docs-only):** ma trận dưới
> cập nhật theo LIMITS đợt 64 (R1–R10) và đợt 65 (S1–S10), xem
> `docs/PHASE9_ROUND64_LIMITS.md` và `docs/PHASE9_ROUND65_LIMITS.md`;
> rà soát + đối chiếu trên đĩa ở đợt 66 T10 (xem
> `docs/PHASE9_ROUND66_T10_DOCS_CI_LIMITS.md`). Đổi so với mốc đợt 63 R10:
> i18n **2146 → 2275** (đợt 63 closing: +131 key, −2 key xóa) → **2283**
> (đợt 64: +8) → **2297 key lá** (đợt 65: +14 key S2 1 + S4 10 + S6 1 +
> S8 2, 0 collision, 0 lệch tập key; đếm lại trên đĩa 08/11: vi == en ==
> 2297); key `speed.warnTooShort` đã xóa ở đợt 64 closing (đóng nợ note 10).
> Export thêm fallback GPU probe (đợt 65 S4: encoder GPU cache lỗi →
> render lại đúng 1 lần bằng libx264 + xóa cache; `GET /api/gpu-probe` +
> `POST /api/gpu-probe/reprobe`; nút "Probe lại GPU" trong ExportPanel;
> fallback 18/18, bridge 13/13, lib UI 9/9, hồi quy R1 30/30; chưa test
> GPU thật). Bridge rate limiter thêm global cap 600/cửa sổ + persist JSON
> qua restart + header `X-RateLimit-Global-Remaining` (đợt 65 S5: unit
> 108/108, e2e bridge thật 40/40 ×3, hồi quy R7 165/165). Trần trial-decode
> GOP **45 s → 60 s** (đợt 64 R10: đo trực tiếp High-profile 49,7–57,9 MB;
> tỉ lệ 1,2 ms/KiB giữ nguyên) + đo thêm keyframe 58–64 MiB ở đợt 65 S6
> (tải thấp 11–22 s; tải nặng 63,54 MiB chạm timeout 60 s; timeout
> fail-open nay hiện toast cho user, test 15/15; 64,0 MiB đầy đủ chưa đo;
> Safari chưa đo). FPS meter thêm dòng presented thật (đợt 65 S8: presented
> mean 26,23 fps lúc lặng 720p vs rVFC 16,02 — số R64 15,54 fps chỉ dùng
> rVFC đánh giá thấp tốc độ trình chiếu thật; unit 12/12 + 8/8, headed
> 4/4; FPS GPU thật chưa đo). Registry tên project: nhận chuỗi legacy nay
> cần bằng chứng hash (đợt 65 S9: test 43/43, trước sửa 28 pass/12 fail;
> tự nhận chuỗi phân mảnh ≤200 chuỗi). Video effects đính chính (đợt 64 R9
> + đợt 65 S7): x264 KHÔNG phải nguyên nhân chính gây lệch noise headed
> (chỉ ~7–8%; chính là resampler + kẹp chroma-rail + Chrome-high); cơ chế
> lệch là chiếu gamut; noise KHỚP-THỐNG-KÊ ở full-res pre-encode (lần đầu,
> 4/4 seed); noise headed vẫn LỆCH, phần dư là resample; sharpen vẫn
> XẤP XỈ (le8 tốt nhất 98,3%). Enhance: FPS blend đo lại ở đợt 64 R3
> (thang piecewise KHỚP, maxErr 1,5; denoise clip 20 s: 720p 0,46× /
> 1080p 0,433×); cảnh báo denoise ≥0,7 nay áp với mọi mức đo được, không
> cổng theo tốc độ (đợt 65 S2+S3, mở rộng tới ~49 px/f).
>
> **Định nghĩa status** (theo Master Plan §0.2):
> - **VERIFIED:** Có test/kiểm thử tái lập chứng minh chạy được trong luồng tích hợp thật.
> - **IMPLEMENTED-PARTIAL:** Có code nhưng thiếu tích hợp, thiếu test, chỉ chạy trong demo riêng, hoặc có giới hạn quan trọng.
> - **NOT IMPLEMENTED:** Chưa thấy giải pháp làm việc trong repo.

> **Cập nhật 08/11/2026 — đợt 61 R10 (docs + kho index):** thêm 6 hàng mới
> (nested/compound, adjustment layer, motion track, karaoke, audio ducking,
> beat sync + downbeat/phân đoạn nhạc) theo LIMITS các đợt 1–10; sounds
> index nay liệt kê đủ 1043 mục (đã bổ sung 30 vcut-synth gen3); sticker
> manifest nay đủ 244 mục (đã bổ sung 30 sticker gốc batch 1+2); i18n
> đính chính 1957 → **1972 key lá** (đếm lại trên đĩa; dict tăng ở đợt 60
> closing, xem `docs/PHASE9_ROUND60_LIMITS.md` §0).
>
> **Cập nhật 08/11/2026 — đợt 62 closing + đợt 63 R10 (docs):** ma trận
> dưới cập nhật theo LIMITS đợt 62 (đã kiểm xong, xem
> `docs/PHASE9_ROUND62_LIMITS.md` §4) + quyết định đợt 63 R10 (xem
> `docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md`). Đổi so với mốc
> đợt 61: Transitions MCP nay kiểm xong 82/82 (đợt 62 R8); Enhance nay
> có preview xấp xỉ (đợt 60 Q1 — trước đây ghi "preview chưa áp"); i18n
> **1972 → 2146 key lá** (parent gộp 3 fragment đợt 62: R2 2 + R5 91 +
> R7 9); M3 nay xanh 13/13 (trước đây ghi đỏ 7/13); 30 class CSS chưa
> định nghĩa đã sửa ở đợt 60 Q2 (trước đây ghi "còn 30 class"); Save/Load
> thêm sổ tham chiếu liên project 28/28 (đợt 62 R7); Proxy thêm đo nút
> bấm thật 2509 ms (đợt 62 R10); Speed bỏ nhánh cảnh báo "clip quá ngắn"
> (nhánh chết qua UI, đợt 63 R10 §1). Video effects (đợt 63 R8):
> sharpen XẤP XỈ (công thức đúng ở full-res; `imageSmoothingQuality`
> high trên ctx chính: delta MAD 0.99→0.50 ở downscale 2.6×, tỉ lệ std
> ~1.0 ở 1.58×, gần như không đổi khi upscale); noise nay theo không
> gian YUV (parity Node KHỚP thống kê yuv420p — tỉ lệ std 1.01,
> Δcorr ≤0.007, Δkurt ≤0.09; headed vẫn LỆCH-THỐNG-KÊ do codec x264
> làm mượt nhiễu render, không phải do mô hình màu — xem LIMITS đợt 63
> R8). Số kho khác không đổi (template 50, text preset 96, sticker 244,
> font 59, sound 1043, LUT 174, transitions 81, MCP 29 tools).
>
> **Cập nhật 08/11/2026 — đợt 60 Q9 (docs-only):** ma trận dưới đã cập nhật
> toàn bộ lên mốc 08/11 (xem `docs/PHASE9_ROUND60_Q9_DOCS_LIMITS.md`).
> Những gì đổi so với mốc 19/10: Transitions 13 → **81** (58 xfade +
> 23 custom-expr), LUT 10 → **174**, Video effects 7 → **16**,
> MCP 6 → **29 tools**, Auto-caption có UI đầy đủ (CaptionModal),
> StickerPanel đã mount, TTS / xoá nền AI / Mask / Enhance / Save-Load /
> Export MP4 đã có (xem các hàng mới). Số kho đếm lại 08/11: template 50,
> text preset 96, sticker 244, font 59 family (67 file .ttf = 59 + 8 biến
> thể bold), sound 1043 khai báo (index liệt kê 1013; trên đĩa chỉ 107
> file .ogg — 936 uisfx chưa fetch, xem LIMITS §0). i18n vi == en ==
> **1957 key lá** (đợt 59). Các hàng i18n / Modal-Escape / GOP
> trial-decode / Media mẫu đã ghi trong mục bổ sung 07/11 vẫn đúng, nay
> gộp vào ma trận chính; mục bổ sung 07/11 chuyển xuống cuối file làm
> lịch sử.

## Ma trận trạng thái

| Feature | Schema | UI | Preview | Render | MCP | Tests | Status |
|---|---|---|---|---|---|---|---|
| Timeline (multi-track) | ✅ TrackKind video/audio/text/sticker | ✅ Timeline.tsx | ✅ Canvas vẽ clip | ✅ overlay theo track | ⚠️ add_clip (chưa đủ kind) | Manual | **VERIFIED** |
| Trim / Split | ✅ in/out/duration | ✅ store.ts | ✅ speed đã áp (P0-07 đã sửa: sourceTimeAt + playbackRate) | ✅ trim filter | ❌ | Manual | **VERIFIED**¹ |
| Text overlay | ✅ TextClip | ✅ Inspector | ✅ drawtext tương đương | ✅ drawtext | ✅ add_text | Demo MP4 | **VERIFIED** |
| Transitions (81) | ✅ transitions.ts (58 xfade + 23 custom-expr) | ✅ TransitionPanel đã mount | ✅ mô phỏng canvas theo từng loại (parity đợt 12–15) | ✅ buildXfadeFilter + custom-expr | ✅ apply_transition 82/82 qua tool thật (81 type + none, đợt 62 R8) | demo_transitions.js 12/12 + harness V11–V14 + MCP R8 19/19 (hồi quy lại 19/19 + roundtrip 130/130 đợt 63 R8) | **VERIFIED** |
| Keyframes (x/y/opacity/scale/rotation) | ✅ keyframes.ts | ✅ KeyframePanel + graph editor | ✅ text x/y/opacity + video (công thức overlay) | ✅ scale/rotation text + opacity video (Phase 6 K1); SR bỏ qua cho clip dính transition (có cảnh báo) | ❌ | self-test 13 nhóm + preview-engine 80 assert | **VERIFIED**² |
| Speed / Reverse | ✅ speed.ts + speed curve | ✅ SpeedPanel đã mount | ✅ speed ramp + playbackRate đồng bộ (reverse vẫn giật từng frame) | ✅ buildSpeedFilter | ❌ | speed-demo.js 7/7 + R10 E1–E6 headed vi/en (warnOverlap/warnResetOverlap/warnNoGap đo thật; nhánh cảnh báo "clip quá ngắn" đã XÓA ở đợt 63 R10 vì chết qua UI — xem LIMITS R10 §1) | **VERIFIED** |
| Chroma key | ✅ chroma.ts | ✅ ChromaPanel đã mount | ✅ pixel shader canvas (xấp xỉ YUV) | ✅ buildChromaFilter | ❌ | demo_chroma.js (pixel-level) + preview-engine | **VERIFIED** |
| LUT (174) | ✅ lut.ts | ✅ LutPicker đã mount | ✅ WebGL LUT thật (`applyWebglLut`, preview.tsx:1389) + CSS approx fallback (RMSE ~16) | ✅ buildLutFilter (lut3d) | ❌ | demo_lut.js 3/3 + webglLut.test.ts 7/7 | **VERIFIED** |
| Video effects (16) | ✅ effects.ts (7 gốc + 9 Q4) | ✅ EffectPanel đã mount | ✅ đường vẽ cho cả 16 type (previewEngine.ts:471-490); sharpen: đợt 65 S7 XẤP XỈ (MAD 0,194→0,161; le8 tốt nhất 98,3% < 99%) — đợt 67 U3 đính chính: sharpen headed KHỚP trong chính decoder của preview (MAD 0,000, le8 100%, 4 cảnh × 2 mức); còn lại ocean sharp10 XẤP XỈ, basgo sharp10 w1440/1:1 chưa KHỚP-trừ-sàn; noise: parity Node KHỚP thống kê yuv420p (đợt 63 R8: tỉ lệ std 1.01, Δcorr ≤0.007); noise KHỚP-THỐNG-KÊ ở full-res pre-encode (đợt 65 S7, lần đầu, 4/4 seed — cơ chế lệch là chiếu gamut, không phải kẹp plane); noise headed vẫn LỆCH, phần dư là resample (x264 chỉ ~7–8%, xem LIMITS đợt 64 R9) — đợt 67 U2 mô hình 2-stage: w1440 noise05 chỉ còn lệch Δcorr R-G 0,199, ngưỡng halve 0,45–0,63 chưa đo; glitch render thật chạy noise trên plane RGB (đã sửa `applyGlitch`, đợt 65 S7) | ✅ buildEffectsChain | ❌ | demo_effects.js + preview-engine | **VERIFIED** |
| Sticker overlay | ✅ sticker.ts | ✅ StickerPanel **đã mount** (Inspector.tsx:122, 486) | ✅ vị trí/tỉ lệ/xoay/opacity | ✅ buildStickerOverlay | ❌ | demo_sticker.js + preview-engine | **VERIFIED**³ |
| Audio waveform | n/a | ✅ waveform.ts + ClipWaveform | ✅ (trên timeline) | n/a | n/a | 16/16 test | **VERIFIED** |
| Auto-caption (faster-whisper) | ✅ caption track JSON | ✅ CaptionModal (App.tsx:586) + track dịch song ngữ | ✅ track phụ đề trên timeline | ✅ pipeline local (bridge /api/caption) | ❌ | O5 12/12 + P5 7/7 vi+en, headed SRT/VTT byte-exact | **VERIFIED**⁴ |
| MCP tools (29) | ✅ schema theo kịp video-spec qua 23 tool Batch I | n/a | n/a | ✅ via render_video | ✅ 29 tools (6 gốc + 23 Batch I) | demo 28/28 (6 gốc) + roundtrip tests | **VERIFIED**⁵ |
| Mask (rect/ellipse/feather/invert) | ✅ mask.ts | ✅ MaskPanel đã mount (video + image) | ✅ mask + keyframes (Phase 7 P4) | ✅ đường PNG pre-render mặc định (Phase 9 R2: `maskMode: "png"`, vẽ PNG 1 lần bằng `mask_png.py`, fallback geq khi vẽ lỗi; xem note 6) — số 0,97 fps là đường geq cũ (RESULTS §7.1), chưa đo lại đường PNG | ❌ | render thật MP4 + mask.js self-test | **IMPLEMENTED-PARTIAL**⁶ |
| TTS tiếng Việt (VieNeu 0.5B, 25 giọng) | ✅ TTS bridge + preset giọng | ✅ TtsButton (Inspector.tsx:315) | n/a | ✅ bridge /api/tts (job queue, giữ model sống) | ✅ ai tools | F3 đợt 50: 72 lần đo | **IMPLEMENTED-PARTIAL**⁷ |
| Xoá nền AI (rembg u2net + birefnet) | ✅ bgremove bridge | ✅ BgRemovePanel (Inspector.tsx:361) | ❌ (chưa có preview mask) | ✅ 0.43 fps CPU; birefnet OOM ≤8GB; không temporal smoothing | ✅ ai tools | BGREMOVE_LIMITS | **IMPLEMENTED-PARTIAL**⁸ |
| Enhance (stabilize/denoise/deinterlace) | ✅ clip.enhance | ✅ EnhancePanel từ Phase 9 R2 + preset 1 chạm (đợt 59 P8) | ✅ xấp xỉ ở preview (denoise→blend/blur, stabilize→zoom crop, bật mặc định — đợt 60 Q1; render vẫn đường thật); cảnh báo denoise ≥0,7 áp với mọi mức đo được, không cổng theo tốc độ (đợt 65 S2+S3, mở rộng tới ~49 px/f) | ✅ hqdn3d/yadif/vidstab (P9: 52/52) | ❌ | P9 harness 52/52 + Q1 16/16 vi+en; FPS blend đo lại đợt 64 R3 (thang piecewise KHỚP, maxErr 1,5; denoise clip 20 s: 720p 0,46× / 1080p 0,433×); S2 harness 87/87 + R2 36/36; S3 harness 96/96 | **IMPLEMENTED-PARTIAL**⁹ |
| i18n (vi/en) | ✅ vi.json/en.json | ✅ các panel chính đã nối key | ✅ | ✅ | n/a | dict parity + audit L2/M2/N8 | **IMPLEMENTED-PARTIAL**¹⁰ |
| Save / Load project (.vcut.json + autosave + history) | ✅ projectRepo envelope | ✅ TopBar/menu + dialog native (Phase 10 G4) | n/a | n/a | ❌ | projectRepo 10/10, rehydrate 27/27, loadProject K1 + sổ tham chiếu liên project R7 28/28 (lib) + headed 5/5; registry tên project (đợt 65 S9): nhận chuỗi legacy cần bằng chứng hash nội dung + tự nhận chuỗi phân mảnh ≤200 chuỗi, test 43/43 (trước sửa 28 pass/12 fail); mảnh mơ hồ nay có UI nhận thủ công (đợt 67 U6: `LegacyHistoryAdoptModal`, 27 key `legacyAdopt.*`, hoàn tác 1 mức); lịch sử job + resume khi mở ExportPanel (đợt 67 U7: fragment `jobHistory.*` 15 key) | **VERIFIED** |
| Export MP4 từ UI | ✅ ExportPanel preset | ✅ ExportPanel.startRender → bridge /api/render | n/a | ✅ render worker qua bridge (retry/download); fallback GPU probe (đợt 65 S4: encoder GPU cache lỗi → render lại đúng 1 lần bằng libx264 + xóa cache; `GET /api/gpu-probe` + `POST /api/gpu-probe/reprobe`; nút "Probe lại GPU" trong ExportPanel; fallback 18/18, bridge 13/13, lib UI 9/9, hồi quy R1 30/30; chưa test GPU thật); lịch sử job + resume khi mở lại ExportPanel (đợt 67 U7) | ✅ render_video | render tests | **VERIFIED** |
| Proxy workflow | ✅ proxy sidecar | ✅ badge PROXY + checkbox tự tạo | ✅ proxy 720p nhanh hơn ~25–40% | ✅ export luôn dùng file gốc | ❌ | Q8 + R3 §8.3, I9 + nút proxy bấm thật headed (đợt 62 R10: tạo proxy 720p sau 2509 ms, ffprobe 1280×720 đúng) | **VERIFIED** |
| Mobile-web / PWA | ✅ responsive + touch | ✅ layout mobile | ✅ | n/a | n/a | Q6 58/58 | **IMPLEMENTED-PARTIAL**¹¹ |
| Desktop app (Electron, Linux) | ✅ Electron shell + preload | ✅ menu vi/en + dialog native | ✅ editor thật render trong app | n/a (dùng chung render worker qua bridge) | n/a | G6 harness 43/43, smoke production ok:true | **IMPLEMENTED-PARTIAL**¹⁹ |
| Modal / Escape | n/a | ✅ Escape đóng WelcomeModal, TourCard, TemplatePackModal/Picker (đợt 58–59) | n/a | n/a | n/a | O1 9/9, P2 26/26, headed | **IMPLEMENTED-PARTIAL**¹² |
| Nested / compound clip | ✅ nested.ts (kind "nested", subSpec, sâu tối đa 8, chặn vòng lặp) | ✅ NestedClipPanel (Timeline) — gom/rã qua execCommand (undo/redo) | ✅ flatten + preview (nestedPreview 44/44) | ✅ flatten + render MP4 thật (N2 24/24) | ❌ | N1 37/37, N2 24/24, N5 14/14, R7 unify 55/55 + E2E 43 PROVEN | **VERIFIED**¹³ |
| Adjustment layer | ✅ adjustment.ts (`spec.adjustmentLayers`, scope `tracks?`) | ✅ AdjustmentLayerPanel (Timeline) + normalize legacy → layer chuẩn | ✅ áp layer theo trackStack (nestedPreview 44/44) | ✅ tách clip theo biên layer + adjChain (R1 39/39 pixel-verified) | ❌ | R1 39/39, N3 46/46, R7 unify 55/55 | **VERIFIED**¹⁴ |
| Motion track (sticker/text/video bám quỹ đạo) | ✅ tracking.ts (`TrackAttachment`, tối đa 240 điểm) | ✅ TrackPanel (Inspector, cho cả 3 loại clip) | ✅ nội suy quỹ đạo (previewEngine, cùng luật sticker) | ✅ biểu thức track cho overlay/drawtext (D3 22/22, sai số ≤1px) | ❌ | Q5 test_track.py (sai số TB 0.0035 khung hình), D3 22/22 | **VERIFIED**¹⁵ |
| Karaoke (tô sáng từng từ) | ✅ TextClip.karaoke (`KaraokeWord[]`, highlightColor) | ✅ CaptionModal (tick karaoke + chọn màu, từ Whisper word timestamps) | ✅ karaokeLayout/drawKaraokeWords (tô cả từ) | ✅ buildKaraokeAss (ASS `\k`, R4 4/4 pixel-verified) | ❌ | R4 4/4 + subtitles 14/14, D6 11/11 (karaoke theo speed curve) | **VERIFIED**¹⁶ |
| Audio ducking | ✅ audio.ts (`DuckingSettings`, voiceTrackId) | ✅ DuckingSection (AudioFxPanel: chọn track giọng + 5 slider) | ❌ preview chưa áp ducking | ✅ sidechaincompress (nhạc −4.99/−5.02 dB khi có giọng) | ❌ | test_ducking 15/15 | **IMPLEMENTED-PARTIAL**¹⁷ |
| Beat sync + downbeat / phân đoạn nhạc | ✅ beat.py + structure.py (numpy-only) | ✅ BeatSyncModal (Inspector:470; nhịp/downbeat/đoạn + checkbox chỉ cắt ở downbeat) | n/a | ✅ /api/beats/analyze trả kèm `structure` | ❌ | test_beat.py PASS (119.76 BPM, miss 1/16), test_structure.py PASS (downbeat 31/32) | **IMPLEMENTED-PARTIAL**¹⁸ |

### Ghi chú

1. **Trim/Split:** P0-07 đã sửa — preview dùng `sourceTimeAt` /
   `rampSourceTimeAt` + đồng bộ `playbackRate` theo speed (preview.tsx
   R1-013, Q1 Phase 8). VERIFIED ở mọi speed, không chỉ speed=1.
2. **Keyframes:** scale/rotation render thật cho clip chữ + opacity keyframe
   cho video (Phase 6 K1). Ngoại lệ duy nhất: clip dính transition (gộp
   thành unit xfade) thì SR bị bỏ qua kèm cảnh báo từ `validate.js`
   (render.js:457-459). Typewriter ASS + SR vẫn bỏ qua.
3. **Sticker:** khoảng trống duy nhất ở mốc 19/10 (StickerPanel chưa mount)
   **đã đóng** — panel mount tại `Inspector.tsx:122` và `:486`.
4. **Auto-caption:** đã có UI đầy đủ từ Phase 8/Q3 — CaptionModal mount
   tại `App.tsx:586`; track dịch nhận diện song ngữ "Phụ đề"/"Subtitles"
   (đợt 58 O5, 12/12); xuất SRT/VTT byte-exact + đúng tên file ASCII
   (đợt 59 P5, headed 5/5). Dịch vẫn chỉ sang tiếng Anh.
5. **MCP:** 29 tools — 6 gốc (`create_project`, `add_clip`, `add_text`,
   `apply_transition`, `get_project`, `render_video`, demo 28/28) + 23 tool
   Batch I (`mcp-server/TOOLS.md`, "Tổng: 29 tools"; đếm lại 08/11:
   6 `server.tool(` trong index.ts + 23 trong `tools/*.ts`). REST bridge:
   `/api/render`, `/api/tts`, `/api/proxy`, `/api/luts`, `/api/health`,
   `/api/openapi.json` (+ route AI caption/bgremove/reframe/…).
6. **Mask:** render đúng nhưng đường geq cũ quá chậm (0.97 fps ở 720p 5s, RESULTS §7.1)
   vì `geq` tính alpha từng pixel mỗi frame. **E1 ĐÃ LÀM từ Phase 9 R2**
   (đính chính dòng cũ ghi "chưa làm"): render nay mặc định vẽ PNG mask 1 lần
   (`maskMode: "png"` ở `render.js:206`, `mask_png.py` vẽ theo shape/x/y/w/h/feather,
   `movie=` + `format=gray` thay cho `geq`; fallback geq khi vẽ lỗi, không fail job;
   mask keyframes có đường video mask riêng qua `mask_anim.py`, xem `render.js:1570-1610`
   + `mask.js:240-310`; `mask.js --self-test` pass 09/11). **Chưa đo lại fps đường
   PNG** — không mạo nhận đã nhanh hơn; 0,97 fps chỉ còn đúng cho đường geq cũ.
   Chưa đạt VERIFIED vì chưa có số fps mới + chưa đo clip dài.
7. **TTS:** VieNeu-TTS 0.5B v3 Turbo, 25 giọng preset
   (`server/bridge/src/tts.js:22-24`); tốc độ **0,12–0,75× realtime,
   median 0,32× (đợt 49) / 0,44× (đợt 50), 72 lần đo** — đính chính 06/11,
   số cũ ~1,5–2,5× đã bị bác bỏ (xem RESULTS §3 + §9). Voice cloning **ĐÃ expose
   UI + bridge** (đính chính dòng cũ ghi "chưa expose"): engine `tts.py`
   hỗ trợ `--ref-audio` (clone qua `encode_reference`), bridge
   `POST /api/tts/clone` (`server/bridge/src/index.js:1634`, multipart
   `refAudio` + `text`), UI checkbox "🎭 Clone giọng từ file mẫu (local)"
   trong `TtsButton.tsx:48-88` (chọn file mẫu → clone → đưa vào media pool);
   test clone thật 24/10 (Phase 9 R4, xem `apps/web/src/lib/R4_LIMITS.md`
   §3.5: mẫu mono 2,64 s → JSON `cloned: true`, tổng hợp 5,3 s). Còn thiếu:
   clone + đa-chunk cùng lúc chưa test kết hợp; chất lượng clone phụ thuộc
   mẫu (mẫu nhiễu/ngắn <3 s cho giọng kém, engine không báo lỗi).
8. **Xoá nền AI:** rembg u2net + birefnet-general fallback tự động; 0.43 fps
   (máy thế hệ 1: CPU 2 vCPU 7D13, đo 20/10 — xem RESULTS.md §4); birefnet OOM trên RAM ≤8GB; không temporal smoothing, viền
   cứng (gap A4). Chưa đạt VERIFIED vì chậm + OOM + thiếu smoothing.
9. **Enhance:** UI đã có từ Phase 9 R2 (đính chính brief E3 đợt 59 P10);
   preset 1 chạm + badge ✨ timeline thêm ở đợt 59 P8 (headed 6/6);
   render thật cả 3 enhance, FPS 720p: baseline 47,86 → denoise 12,05 /
   stabilize 6,82 / deinterlace 24,70 / combo 3,49 (đợt 59 P9; chạy lại
   lúc gộp: 53,23 / 14,68 / 20,45 / 48,42 / 7,06 — số tuyệt đối dao động
   theo tải VM, xem RESULTS §9). Preview nay ÁP enhance ở mức xấp xỉ
   (đợt 60 Q1: denoise→blend/blur ≤1.2px, stabilize→zoom crop,
   deinterlace không đổi pixel; Q1 16/16 vi+en; đợt 62 R3 chuyển denoise
   preview sang blend; FPS blend đo lại ở đợt 64 R3: thang piecewise
   KHỚP, maxErr 1,5 — không sửa code; denoise clip 20 s ×3: 720p 0,46× /
   1080p 0,433×). Cảnh báo denoise ≥0,7 nay áp với mọi mức đo được,
   không cổng theo tốc độ (đợt 65 S2+S3, mở rộng tới ~49 px/f; cổng
   FAST=6,0/MEDIUM=4,0 chỉ còn là thông tin hiển thị). Stabilize đợt 67 U1:
   ép `-threads 1` chỉ cho bước transform của vidstab (code `render.js` /
   `enhance.js` / `trfCache.js` + CLI `--no-stab-single-thread` + env
   `VCUT_STAB_SINGLE_THREAD=0`; dry-run harness xác nhận vị trí cờ đúng);
   chưa có toggle trên UI; cơ chế vì sao threads1 khử hết lệch ở 720p nhưng
   chỉ cải thiện ở 1080p h264 / không cải thiện trên VP9 thật vẫn chưa rõ.
   Còn thiếu:
   preview enhance chỉ là xấp xỉ (không phải đường render thật).
10. **i18n:** `vi.json` == `en.json` == **2369 key lá** (đếm lại trên đĩa
    đợt 68 V9 09/11; 2297 ở đợt 65 → 2326 sau gộp đợt 67 closing (fragment
    U6/U7 chưa vào dict) → 2369 sau khi parent gộp muộn fragment U6 28 key
    + U7 15 key vào dict (+43 key, 0 collision, key vi==en giống hệt — xem
    `docs/PHASE9_ROUND67_LIMITS.md` §0/§6). 41 key mồ côi đợt 59 + 26 key
    diagnostic GOP đã đóng ở đợt 60 Q4 (nối thật/xóa, 0 key mồ côi sau
    gộp). `i18nAudit56M3.test.ts` nay xanh **13/13** (chạy lại đợt 63
    R10 — đính chính dòng cũ "đỏ sẵn 7/13"). Chưa đạt VERIFIED: bản dịch
    EN template chưa qua người bản ngữ (N5 — đợt 57 sửa 5 giá trị, đợt 63
    R10 review vòng 2 sửa thêm 3 giá trị; vẫn KHÔNG claim "chuẩn bản ngữ",
    xem LIMITS R10 §2); server/desktop 253 literal chưa kiểm kê (ROUND60
    §5.6).
11. **Mobile-web/PWA:** responsive + PWA + touch, test Q6 58/58; **không app
    native**, chưa test điện thoại thật (gap M1/M2).
12. **Modal/Escape:** Escape đóng WelcomeModal (O1 9/9 + headed 3/3),
    TourCard/TemplatePackModal/TemplatePicker (P2 26/26 + headed 5/5);
    SilenceModal hết tràn viewport (N1); BeatSync/SceneModal dùng class
    `modal` (O4 24/24). 30 class CSS thật chưa định nghĩa đã SỬA ở đợt
    60 Q2 (bắt 1 bug cascade `.tts-box`; đính chính dòng cũ "còn 30
    class"); 53 class scoped-only kiểm chứng xong ở đợt 61 R4 (188/190
    covered + 2 ca biên). `.tbtn-label` (nhãn nút toolbar) đo headed ở
    đợt 62 R10: 1280 ẩn 9/9, 1440 hiện 9/9, biên đúng 1360 ẩn / 1361
    hiện. Đợt 65 S10 phát hiện: nút ngôn ngữ TopBar không bấm được khi
    modal Export đang mở (`.modal-backdrop` z 400 phủ TopBar z 30; bấm
    vào vùng đó sẽ đóng modal thay vì đổi locale — đường đổi locale
    thực tế là menu native desktop, hoặc đóng modal rồi bấm cờ TopBar,
    headed H7 PASS). Còn thiếu: nút text CaptionModal dùng `.tbtn`
    tràn/chồng chữ (ROUND59 §6.2 — chưa đo lại ở đợt 62–63, không mạo
    nhận đã hết); modal cao hơn viewport 900px (ROUND59 §6.2).
13. **Nested/compound:** spec N1 37/37 (kind `"nested"`, subSpec, trim +
    speed, sâu tối đa 8, chặn vòng lặp, project cũ tương thích); render N2
    24/24 (flatten + MP4 thật 6.5s khớp project phẳng); preview N5 14/14
    (flatten + áp adjustment); UI N4 10/10 (gom/rã compound qua execCommand
    nên undo/redo hoạt động); thống nhất ngữ nghĩa đợt 7 (U1–U6: adjustment
    25/25, nested 49/49, unify 55/55, E2E 43 PROVEN + 1 PENDING, click-test
    12/15 + 3 SKIP); nested đệ quy 2–3 cấp + two-level curve ở các đợt
    15–21. Còn thiếu: transition qua biên nested chưa hỗ trợ (cả render
    lẫn preview); opacity trên nested clip không nhân vào clip lá
    (preview) / render từ chối field `opacity` trên nested; UI chưa sửa
    được trong timeline con, không nest lồng ở tầng UI; nested mang
    `reverse`/`speedKeyframes`/`animations`/`mask`/`filter`/`effects`/
    `enhance`/`chromaKey`/`audioEffects` thì render fail-fast (xem
    `docs/NESTED_ROUND_LIMITS.md`, `docs/PHASE9_ROUND7_NESTED_UNIFY_LIMITS.md`).
14. **Adjustment layer:** spec R2 (`VideoSpec.adjustmentLayers`, shape
    `{id, start, duration, filters}`, scope `tracks?` tùy chọn từ đợt 7);
    render R1 nối vào render.js thật (tách clip theo biên layer,
    `test_adjustment_render.js` 39/39 pixel-verified: trong layer lệch
    ~77/kênh, ngoài layer ≤0,92 do nhiễu encoder); preview N5 áp layer
    theo đúng thứ tự track; UI legacy (`kind: "adjustment"`) được
    normalize thành layer chuẩn ở cả preview (U3) và render (U2). Còn
    thiếu: layer không phân biệt track khi thiếu field `tracks` (áp mọi
    clip video giao nhau); chỉ áp clip video (không image/sticker/text);
    chỉ 3 họ filter (LUT/color/effects); layer trong subSpec chưa có test
    liên phía riêng; preview/render khác nhau ở layer chồng LUT (preview:
    layer trên thắng; render: nối tuần tự); fail-fast khi layer giao
    transition / cắt giữa speedKeyframes/animations/motion track/mask
    keyframes/stabilize (xem `server/render/src/ADJUSTMENT_LIMITS.md`).
15. **Motion track:** tracker OpenCV `server/tracking/track.py` (Phase 8
    Q5; test ground truth tổng hợp: sai số trung bình 0.0035 khung hình,
    xem header `track.py` + `test_track.py`); D3 mở rộng từ sticker sang
    text + video (render thật 640x360, sai số ≤1px ở mọi mẫu,
    `test_d3_trackfollow.js` 22/22); TrackPanel gắn quỹ đạo cho cả 3 loại
    clip (Inspector.tsx:488, 495); render.js dùng `tracking.js`
    (`buildAxisExpr`); preview dùng cùng hàm nội suy. Còn thiếu: mask bám
    track chưa làm; text typewriter/karaoke không bám track ở render (ASS
    không có biểu thức theo frame); video dính transition không bám track;
    preview chưa click-test trên browser thật; track không tự re-time khi
    trim/split (mảnh sau bắt đầu lại từ điểm t=0); nạp trajectory JSON
    thủ công (xem `server/render/src/D3_LIMITS.md`).
16. **Karaoke:** spec R4 (`TextClip.karaoke`, `highlightColor`); render
    ASS `\k` (`buildKaraokeAss`, `test_r4_karaoke.js` 4/4 pixel-verified:
    t=0.4s vàng 950/trắng 4101, t=3.6s vàng 4959/trắng 0); preview tô sáng
    cả từ (`karaokeLayout`/`drawKaraokeWords`); CaptionModal tick karaoke
    từ Whisper word timestamps; D6 karaoke chính xác dưới speed curve
    (map media → timeline, `d6.test.ts` 11/11). Còn thiếu: preview tô cả
    từ trong khi render quét từng ký tự (chỉ khớp mức "từ nào đang hát");
    typewriter thắng karaoke; karaoke không áp cho clip có scale/rotation
    keyframes (ASS không làm được SR); dịch caption mất karaoke; karaoke
    chỉ có từ Whisper, SRT/VTT nhập vào không có (xem
    `apps/web/src/lib/R4_LIMITS.md`, `apps/web/src/lib/D6_LIMITS.md`).
17. **Audio ducking:** spec `DuckingSettings` (`audio.ts`); render tách
    voice mix/music mix rồi `sidechaincompress` (test 15/15: nhạc trong
    cửa sổ có giọng giảm 4.99/5.02 dB, giọng Δ ~0 dB, cửa sổ lặng Δ 0 dB;
    fallback y hệt khi track giọng missing; ratio=99 fail-fast); UI
    `DuckingSection` (AudioFxPanel: checkbox, chọn track giọng, 5 slider).
    Chưa đạt VERIFIED: đây là compressor sidechain, không phải ducking
    theo envelope (giọng dưới ngưỡng không kéo nhạc xuống);
    `duckAmountDb` chỉ là trần xấp xỉ (đặt 12 dB ra ~5 dB); chỉ 1 track
    giọng duy nhất; audio kế thừa của video luôn thuộc nhánh nhạc; preview
    chưa áp ducking; đổi ducking trong UI chưa qua history undo (xem
    `server/render/src/DUCKING_LIMITS.md`).
18. **Beat sync + downbeat/phân đoạn:** beat Q5 (`beat.py`: 119.76 BPM,
    miss 1/16, chạy lại PASS đợt 61 R10) + cấu trúc D5 (`structure.py`,
    numpy-only: downbeat 31/32 ô nhịp trong ±0.15s, sai số TB 0.008s;
    biên đoạn 15.999/31.997/47.996s so với thật 16/32/48s, nhãn A/B/A/C
    đúng; `test_structure.py` chạy lại PASS đợt 61 R10); BeatSyncModal
    hiển thị nhịp/downbeat/đoạn + checkbox "Chỉ giữ điểm cắt ở downbeat";
    bridge `/api/beats/analyze` trả kèm `structure` không cần sửa. Chưa
    đạt VERIFIED: heuristic, không hiểu nhạc — chỉ tin được trên nhạc có
    beat rõ, nhịp đều; meter chỉ thử 4/4 và 3/4; mọi số đều đo trên nhạc
    tổng hợp, chưa kiểm chứng nhạc thật; chưa click-test BeatSyncModal;
    combo downbeat-only + clip có speed curve dùng công thức tốc độ 1
    (xem `server/beats/D5_LIMITS.md`).
19. **Desktop app (Electron, Linux — Phase 10, 06/11):** shell thật
    (`apps/desktop`): main process TS, single instance, window-state persist,
    preload contextIsolation + sandbox, menu tiếng Việt, load production qua
    scheme `app://vcut/` (giữ secure context cho IndexedDB/crypto), dev load
    Vite :5173; app tự khởi động/tắt bridge (G2 8/8), bridge URL động qua
    preload (chọn 8788 khi 8787 bận); file native `.vcut` (dialog hệ thống,
    recent 1 nguồn `settings.json`), import/export dialog; đóng gói Linux
    AppImage 128.102.744 byte + .deb 103.006.396 byte (xem
    `docs/PHASE10_LIMITS.md` §2); harness G6 **43/43 PASS** trên cây đã gộp
    + gói rebuild; CORS `app://vcut` OK. Chưa đạt VERIFIED: app đóng gói
    CHƯA tự chạy đủ services (bridge/render/Python AI không nằm trong gói —
    render/caption/TTS/bgremove trong app đóng gói chưa chạy được); bridge
    mồ côi khi app bị kill -9/crash (thoát bình thường thì sạch); .deb chưa
    chạy được binary đã cài trên VM này (thiếu 5 lib hệ thống — giới hạn VM);
    chưa click-test menu/dialog, chưa test double-click `.vcut`, chưa có
    macOS/Windows/arm64. Chạy: `npm run dev:desktop` / `npm run start:desktop`
    (xem `docs/DESKTOP.md`).

## Chi tiết tích hợp đã kiểm chứng (mốc 08/11/2026)

### render.js — các module đã import VÀ sử dụng (mốc 19/10, vẫn đúng;
### số lượng type đã tăng — xem ma trận)
- `buildXfadeFilter` (transitions) — dòng 38, dùng tại dòng 264
- `buildSpeedFilter` (speed) — dòng 39, dùng tại dòng 222, 398
- `buildTextExprs`, `buildOverlayExprs` (keyframes) — dòng 40, dùng tại dòng 300, 342
- `buildChromaFilter` (chroma) — dòng 42, dùng tại dòng 225
- `buildTextAnimExpr` (textfx) — dòng 43
- `buildLutFilter` (lut) — dòng 45, dùng tại dòng 228
- `buildEffectsChain` (effects) — dòng 46, dùng tại dòng 229
- `buildStickerOverlay` (sticker) — dòng 47, dùng tại dòng 310-322

### validate.js — tất cả 8 module đã được validate
- `isSupportedTransition`, `SPEED_MIN/MAX`, `validateAnimations`,
  `validateChroma`, `isTextFxAnimation`, `validateVideoFilter`,
  `validateEffects`, `validateSticker` — dòng 16-23
- Track kind `"sticker"` được chấp nhận (dòng kiểm tra kind)

### packages/video-spec/src/index.ts — tất cả 8 module đã export
- `transitions`, `speed`, `keyframes`, `chroma`, `textfx`, `lut`, `effects`,
  `sticker` — dòng 16-25
- `TrackKind` bao gồm `"sticker"`; `Clip` union bao gồm `StickerClip`

### Số lượng type/kho đếm lại 08/11 (nguồn: script đếm trực tiếp)
- Transitions: **81** thật (82 entry gồm `"none"`): 58 xfade native +
  9 custom-expr P5 + 14 custom-expr V3 — `TRANSITION_TYPES`,
  `packages/video-spec/src/transitions.ts`. 21 file GLSL trong
  `assets/transitions/` không dùng được (thiếu `gltransition`).
- LUT: **174** file `.cube` trong `assets/filters/` (bản sao trong
  `apps/desktop/release*/…` và `build/bundled-server` cũng 174 — cùng
  một bộ, không đếm trùng).
- Video effects: **16** — `EFFECT_TYPES`, `packages/video-spec/src/effects.ts`.
- Text preset: **96** file `.css` trong `assets/text-presets/`.
- Template: **50** file `.json` trong `assets/templates/` + 50 entry
  `TEMPLATES` trong `apps/web/src/lib/templates.ts` (sinh tự động).
- Sticker: **244** file `.png` trong `assets/stickers/` (manifest
  `sticker-manifest.json` nay đủ **244**, đã đồng bộ đợt 61 R10: bổ sung
  30 sticker gốc VCut batch 1+2 — trước đó manifest chỉ liệt kê 214).
- Font: **59 family** — `assets/fonts/catalog.json` (`count: 59`) và
  `apps/web/src/lib/fonts.ts` (59 entry `family:`); trên đĩa 67 file
  `.ttf` = 59 + 8 biến thể bold (`bold_file` trong catalog).
- Sound: **1043 khai báo** — `assets/sounds/index.json`
  (`total_sounds: 1043` = kenney 12 + uisfx 936 + vcut-synth 95); index
  nay liệt kê đủ **1043** mục (đã bổ sung 30 vcut-synth gen3, đợt 61
  R10 — trước đó chỉ 1013 mục, thiếu 30); trên đĩa chỉ
  **107 file .ogg** trong `assets/audio/` (12 kenney + 95 vcut-synth);
  **936 file uisfx không có trên đĩa** — chỉ lấy được qua
  `assets/sounds/fetch_sounds.sh` (xem LIMITS §0). Đợt 63 R8 đã kiểm
  chứng thật cơ chế fetch-on-demand: `--pack=minimal` tải đúng 78/78
  file (0 lỗi, ffprobe 0 lỗi, decode đủ 78/78, codec Opus 48kHz mono,
  SHA256 manifest đủ 78 mục); đường lỗi: host sai → 78 WARN +
  "0 mới, 0 đã có, 78 lỗi", không sót file/.tmp; pack sai → exit 2.
  **Bug đã sửa trong đợt này:** dạng `--pack <tên>` (đúng như hướng
  dẫn trong script) bị parse sai nên lặng lẽ tải toàn bộ 936 file thay
  vì 1 pack — nay parse đúng cả `--pack=X` lẫn `--pack X`, tham số lạ
  exit 2 (xem LIMITS đợt 63 R8 §5). Chưa có code nào trong app đọc kho
  sound này (không UI picker, không đường render) — file thiếu không gây
  lỗi runtime ở đâu, chỉ là kho chưa được nối.
- i18n: **2369 key lá** vi == en (đếm trực tiếp đợt 68 V9 09/11; 2297 ở đợt 65
  → 2369 đợt 67, xem `docs/PHASE9_ROUND67_LIMITS.md` §0/§6).
- MCP: **29 tools** (6 trong `mcp-server/src/index.ts` + 23 trong
  `mcp-server/src/tools/*.ts`; `mcp-server/TOOLS.md`).

### apps/web/src/Inspector.tsx — các panel đã mount (mốc 08/11)
- ✅ TransitionPanel, SpeedPanel, KeyframePanel, ChromaPanel, TextAnimPicker,
  LutPicker, EffectPanel
- ✅ StickerPanel (`:122`, `:486`) — đã mount, đóng nợ 19/10
- ✅ MaskPanel (`:393-395` video, `:498-501` image)
- ✅ EnhancePanel (`:398-400`, Section `inspector.secEnhance`)
- ✅ BgRemovePanel (`:361`)
- ✅ TtsButton (`:315`)
- ✅ CaptionModal mount tại `App.tsx:586`

### GOP trial-decode (phát ngược) — trần 90 s (đợt 64 R10 + đợt 65 S6 + đợt 67 U5)
- Trần worker `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` **45.000 → 60.000 ms**
  (`apps/web/src/lib/gopTrialDecodeWorker62R4.ts:88`); tỉ lệ 1,2 ms/KiB
  giữ nguyên. Lý do: đo trực tiếp High-profile 49,7–57,9 MB — 57,9 MB
  fail-open cả 2 rep dưới trần 45 s cũ (xem
  `docs/PHASE9_ROUND64_R10_KEYFRAME_CAP_LIMITS.md`); test 11/11 + hồi quy
  62R4 19/19 + 63R4 13/13.
- **Đợt 67 U5 nâng trần 60 s → 90 s** (công thức ở 64 MiB cho 78.536 ms <
  90.000 ms — trần chỉ còn là trần an toàn tuyệt đối; biên mới: tải thấp
  28,2 s; tải trung bình ngoại suy ~12,5 s; giá: fail-open dưới tải nặng
  chậm thêm tối đa 18,5 s, chỉ keyframe ≥ ~50 MiB). Probe treo đợt 66 không
  tái hiện (lần sạch thứ 2 liên tiếp); watchdog nay ghi chẩn đoán đầy đủ
  nếu tái hiện. Xem `docs/PHASE9_ROUND67_U5_KEYFRAME_MARGIN_LIMITS.md`.
- Đo thêm keyframe 58–64 MiB (đợt 65 S6): 8 fixture High 53,1–63,5 MiB —
  tải thấp decode 11–22 s (0,17–0,37 ms/KiB), không chạm trần 60 s; tải
  nặng 63,54 MiB chạm timeout 60 s (58,5 s vừa đủ trần, rồi timeout ở lần
  tải nặng hơn). Trần 60 s + tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN. Test mới 15/15.
- Timeout fail-open nay hiện toast 1 lần cho user (key
  `gop.trial.timeoutNote`, kiểm chứng headed với timeout thật). Chưa đo:
  64,0 MiB đầy đủ (lớn nhất 63,54 MiB); Safari (VM Linux, không binary).

### FPS meter — dòng presented thật (đợt 65 S8)
- `PerfOverlay` đã có dòng presented qua `getVideoPlaybackQuality`
  (`apps/web/src/lib/presentedFps.ts`): "Frame trình chiếu (element):
  19,2" khi đang phát, "…" khi đứng yên/dừng. Unit 12/12 + 8/8, headed
  4/4.
- Decode 720p lúc lặng (tab trắng, 5 rep × 3 seek × 10 s, n=15): presented
  **mean 26,23 fps** (18,71–30,75), rVFC mean 16,02 — rVFC đếm thiếu hệ
  thống ~10 fps; số 15,54 fps của đợt 64 R3 (chỉ rVFC) đánh giá thấp tốc
  độ trình chiếu thật. Rep lặng tốt nhất 29,93 fps. Bác bỏ giả thuyết
  element tách DOM làm totalVideoFrames đứng yên (lúc lặng presented
  30,04 fps). Dropped ≈ 0 nhưng frame vẫn mất do decoder skip. FPS máy
  GPU thật chưa đo được (VM không GPU; harness đã viết sẵn).

### Bridge rate limiter — global cap + persist (đợt 65 S5)
- Global cap mặc định **600 req/cửa sổ** (`BRIDGE_RATE_GLOBAL`, 0 = tắt;
  gấp 5× budget general per-IP 120); header mới
  `X-RateLimit-Global-Remaining`; request bị chặn bởi global cap không ghi
  mốc vào bucket của nó. 4 env số còn lại siết qua `parseRateLimitInt`.
- Persist JSON `~/.cache/vcut/rate-limit.json` qua restart (ghi tạm +
  rename, lưu 5 s khi dirty + flush lúc tắt graceful). Bài học vận hành:
  mọi test spawn bridge phải đặt `BRIDGE_RATE_PERSIST_PATH` riêng (không
  thì mốc limiter rò giữa các instance trong cùng test — đã gặp ở R7 e2e
  đợt 65, xem `docs/PHASE9_ROUND65_LIMITS.md` §3).
- Unit **108/108**, e2e bridge thật **40/40 ×3**, hồi quy R7 165/165.
  Số đo thật: `GENERAL=1000, GLOBAL=5` → 5 health qua, health #6 → 429,
  `Global-Remaining=0`, `Retry-After=12`.

## Những gì CHƯA có (trung thực, mốc 08/11)

- **Export MP4 từ UI:** ✅ ĐÃ CÓ — ExportPanel `startRender` nối tới
  bridge `/api/render` (kèm retry/download; Phase 10 G4 hỏi đích `.mp4`
  trước khi render trong Electron).
- **Save/Load project:** ✅ ĐÃ CÓ — `.vcut.json` (projectRepo),
  autosave + version history local, bin manifest bền qua reload (đợt 59 P1).
- **Preview đầy đủ:** preview.tsx đã parity với render.js ở nhiều mặt —
  letterbox, composite video → image → sticker → text, WebGL LUT thật +
  CSS approx fallback, effect mới có đường vẽ, chroma key pixel shader,
  sticker, image track, text animation + keyframes, speed ramp. Còn thiếu:
  preview áp enhance chỉ ở mức xấp xỉ (đợt 60 Q1, không phải đường render
  thật), reverse preview giật từng frame, transition preview là mô phỏng
  (parity đo ở đợt 12–15, không pixel-perfect 100%), LUT CSS fallback
  RMSE ~16 khi không dùng WebGL. Xem `apps/web/src/lib/PREVIEW_LIMITS.md`.
- **TTS tiếng Việt:** ✅ ĐÃ CÓ (VieNeu-TTS, 25 giọng, UI + bridge) — nhưng
  **chậm: 0,12–0,75× realtime** (median 0,32×/0,44×, 72 lần đo); voice
  cloning chưa expose UI/bridge.
- **Tách nền AI:** ✅ ĐÃ CÓ (rembg + birefnet) — nhưng chậm (0.43 fps),
  birefnet OOM ≤8GB, không temporal smoothing.
- **Masking:** ✅ ĐÃ CÓ (rect/ellipse/feather/invert, render + preview) —
  E1 (đường PNG pre-render) đã làm từ Phase 9 R2 (mặc định `maskMode: "png"`,
  fallback geq); số 0,97 fps là đường geq cũ (RESULTS §7.1), chưa đo lại
  đường PNG nên chưa kết luận tốc độ mới.
- **CI/CD:** ❌ VẪN CHƯA CÓ — 5 file workflow tồn tại local
  (`.github/workflows/ci-build.yml`, `ci-e2e.yml`, `ci-integration.yml`,
  `ci-security.yml`, `release.yml`) nhưng **chưa lên được GitHub**
  (403 "Resource not accessible by integration" — App thiếu quyền
  workflows:write); repo hiện không có CI nào chạy thật. Đợt 66 T10 rà
  lại `ci-security.yml` local (xem
  `docs/PHASE9_ROUND66_T10_DOCS_CI_LIMITS.md`): YAML parse đúng, 2 job
  (npm-audit 5 step + pip-audit 8 step), 3 lockfile + 5 requirements pin
  `==` đều khớp, không lệch (không có requirements/lockfile mới ở đợt
  63–65; bgremove đổi pin ở đợt 53-J8 nhưng workflow không pin version
  nên không cần sửa workflow). Quét local 08/11: `npm audit` vẫn bị chặn
  bởi policy registry nội bộ (403 policy_denied, đúng như SECURITY.md
  §2.6); `pip-audit` 2.10.1 chạy local được qua OSV — caption/reframe/
  tracking SẠCH, **tts 39 lỗ hổng** (toàn bộ ở Pillow 12.3.0 transitive,
  fix 13.0.0), **bgremove 66 lỗ hổng** (rembg 2.0.60: 4, fix 2.0.75/
  2.0.82; Pillow 10.2.0 pin trực tiếp: 62, fix 10.3.0/12.2.0/12.3.0/
  13.0.0). Hệ quả: job pip-audit trong workflow sẽ ĐỎ khi lên GitHub cho
  tới khi bump pin (chưa bump trong đợt này — cần đợt riêng verify lại
  pipeline tts/bgremove). File vẫn LOCAL-ONLY, vẫn chờ user cấp quyền
  workflows.
- **App desktop Electron (Linux):** ✅ ĐÃ CÓ (Phase 10 — xem hàng mới trong
  ma trận + note 19; AppImage + .deb, G6 43/43; app đóng gói chưa tự chạy đủ
  services, bridge mồ côi khi kill -9). **App mobile native:** vẫn không có
  theo chủ trương (mobile-web/PWA dùng được, chưa test máy thật).
- **Cloud / collab nhiều người / nhạc có bản quyền / AI avatar:** vẫn không có
  theo chủ trương (xem gap analysis §4 — các hướng không làm).

## Lịch sử mốc cũ (giữ làm hồ sơ, không dùng làm trạng thái hiện tại)

### Mốc 19/10/2026 (commit `1844e2cc` — `Phase 3c: render.js`)

Ma trận gốc kiểm chứng bằng cách đọc trực tiếp `render.js`, `validate.js`,
`packages/video-spec/src/index.ts`, `apps/web/src/Inspector.tsx`,
`apps/web/src/preview.tsx`, `mcp-server/src/index.ts`. Các hàng khi đó:
Timeline VERIFIED; Trim/Split VERIFIED (chỉ speed=1, P0-07);
Text overlay VERIFIED; Transitions (13) VERIFIED; Keyframes (x/y/opacity)
VERIFIED — scale/rotation lưu trong spec nhưng render bỏ qua; Speed/Reverse
VERIFIED (preview chưa áp speed); Chroma key VERIFIED; LUT (10 filter)
VERIFIED; Video effects (7) VERIFIED (preview 5/7); Sticker overlay
VERIFIED nhưng StickerPanel chưa mount (khoảng trống duy nhất);
Audio waveform VERIFIED; Auto-caption IMPLEMENTED-PARTIAL (chỉ CLI);
MCP tools (6) VERIFIED (schema lạc hậu, P0-10). Chưa có: Export MP4 từ UI
(chỉ xuất `.videospec.json`), Save/Load (in-memory), TTS, tách nền AI,
Masking, CI/CD.

### Bổ sung 07/11/2026 — đợt 56–58 (đợt 59 P10, docs-only)

Ma trận khi đó vẫn giữ mốc 19/10; các hàng trong ma trận KHÔNG sửa trong
lần bổ sung này vì không có bằng chứng đợt 56–58 nào đổi trạng thái của
một hàng (đợt 56–58 làm i18n wiring, GOP trial-decode, modal/Escape,
captions track, test webglLut, chính tả — xem
`docs/PHASE9_ROUND58_LIMITS.md`). Những điểm đã kiểm chứng được đợt 56–58,
liên quan tới ma trận, ghi dưới đây để lần cập nhật toàn bộ ma trận sau
dùng làm nguồn:

- **i18n (chưa có hàng trong ma trận):** `vi.json` == `en.json` ==
  1942 key lá (đếm lại 07/11), cùng tập key, placeholder khớp; dict tăng
  1011 (đợt 55) → 1722 (đợt 56) → 1937 (đợt 57) → 1942 (đợt 58).
  Các panel chính đã nối key dịch (M1–M5, N8). Ma trận vẫn chưa có hàng
  i18n — cần thêm khi cập nhật toàn bộ.
- **Auto-caption:** đợt 58 O5 — recognition track phụ đề khớp cả hai
  tiền tố "Phụ đề"/"Subtitles", key `captions.translatedTrack`; test
  12/12. Hàng "chỉ CLI" trong ma trận đã lỗi thời từ trước đợt 56
  (caption đã có UI từ Phase 8/Q3) nhưng trạng thái UI caption đầy đủ
  chưa được kiểm chứng lại trong đợt 56–58 nên hàng này giữ nguyên cho
  tới lần cập nhật toàn bộ — không sửa nửa vời.
- **Modal/Escape (chưa có hàng trong ma trận):** Escape đóng
  WelcomeModal (O1, 9/9 + headed 3/3); SilenceModal hết tràn viewport
  (N1 đợt 57, re-probe headed PASS); BeatSyncModal + SceneModal dùng
  class `modal` đã định nghĩa (O4, 24/24 + headed 4/4).
- **Test webglLut:** `webglLut.test.ts` chạy được 7/7 từ đợt 58 O7
  (esbuild cjs bundle; Node type-stripping vẫn không chạy được suite
  này).
- **Chính tả:** "Hủy" → "Huỷ" thống nhất 141 occurrence / 50 file
  (đợt 58 O8; giữ 7 chỗ có chủ đích).
- **Media mẫu / export:** media mẫu thiếu `file` trong phiên đầu →
  export bị chặn tới khi reload; đã sửa 1 dòng `sample.ts` (đợt 58 O2,
  headed 5/5, rehydrate 27/27).
- Nguồn chi tiết: `docs/PHASE9_ROUND56_LIMITS.md`,
  `docs/PHASE9_ROUND57_LIMITS.md`, `docs/PHASE9_ROUND58_LIMITS.md`,
  `docs/PHASE9_ROUND59_P10_DOCS_LIMITS.md`.

# Feature Status Matrix — VCut Studio

> **Mục đích:** Bảng trạng thái tập trung cho mọi tính năng, dựa trên CODE THẬT
> đang có trong repo (không phải tài liệu cũ hay lời hứa).
>
> **Mốc kiểm chứng:** commit `1844e2cc8b98a22ad01d8d321ce83b2f32d99561`
> (`Phase 3c: render.js — LUT/effects/sticker integration`, 19/10/2026).
> Kiểm chứng bằng cách đọc trực tiếp `render.js`, `validate.js`,
> `packages/video-spec/src/index.ts`, `apps/web/src/Inspector.tsx`,
> `apps/web/src/preview.tsx`, `mcp-server/src/index.ts`.
>
> **Định nghĩa status** (theo Master Plan §0.2):
> - **VERIFIED:** Có test/kiểm thử tái lập chứng minh chạy được trong luồng tích hợp thật.
> - **IMPLEMENTED-PARTIAL:** Có code nhưng thiếu tích hợp, thiếu test, chỉ chạy trong demo riêng, hoặc có giới hạn quan trọng.
> - **NOT IMPLEMENTED:** Chưa thấy giải pháp làm việc trong repo.

## Ma trận trạng thái

| Feature | Schema | UI | Preview | Render | MCP | Tests | Status |
|---|---|---|---|---|---|---|---|
| Timeline (multi-track) | ✅ TrackKind video/audio/text/sticker | ✅ Timeline.tsx | ✅ Canvas vẽ clip | ✅ overlay theo track | ⚠️ add_clip (chưa đủ kind) | Manual | **VERIFIED** |
| Trim / Split | ✅ in/out/duration | ✅ store.ts | ⚠️ chưa áp speed (P0-07) | ✅ trim filter | ❌ | Manual | **VERIFIED**¹ |
| Text overlay | ✅ TextClip | ✅ Inspector | ✅ drawtext tương đương | ✅ drawtext | ✅ add_text | Demo MP4 | **VERIFIED** |
| Transitions (13) | ✅ transitions.ts | ✅ TransitionPanel đã mount | ⚠️ chỉ fade (alpha) | ✅ buildXfadeFilter | ⚠️ apply_transition (tập type cũ) | demo_transitions.js 12/12 | **VERIFIED** |
| Keyframes (x/y/opacity) | ✅ keyframes.ts | ✅ KeyframePanel đã mount | ❌ | ✅ buildTextExprs/buildOverlayExprs | ❌ | self-test 13 nhóm | **VERIFIED**² |
| Speed / Reverse | ✅ speed.ts | ✅ SpeedPanel đã mount | ❌ (P0-07) | ✅ buildSpeedFilter | ❌ | speed-demo.js 7/7 | **VERIFIED** |
| Chroma key | ✅ chroma.ts | ✅ ChromaPanel đã mount | ❌ | ✅ buildChromaFilter | ❌ | demo_chroma.js (pixel-level) | **VERIFIED** |
| LUT (10 filter) | ✅ lut.ts | ✅ LutPicker đã mount | ⚠️ CSS minh họa gần đúng | ✅ buildLutFilter (lut3d) | ❌ | demo_lut.js 3/3 | **VERIFIED** |
| Video effects (7) | ✅ effects.ts | ✅ EffectPanel đã mount | ❌ | ✅ buildEffectsChain | ❌ | demo_effects.js | **VERIFIED** |
| Sticker overlay | ✅ sticker.ts | ⚠️ StickerPanel tồn tại nhưng **chưa mount** vào Inspector | ❌ | ✅ buildStickerOverlay | ❌ | demo_sticker.js | **IMPLEMENTED-PARTIAL**³ |
| Audio waveform | n/a | ✅ waveform.ts + ClipWaveform | ✅ (trên timeline) | n/a | n/a | 16/16 test | **VERIFIED** |
| Auto-caption (faster-whisper) | ✅ caption track JSON | ❌ (chỉ CLI) | n/a | n/a (pipeline riêng) | ❌ | Manual (tiếng Việt) | **IMPLEMENTED-PARTIAL**⁴ |
| MCP tools (6) | ⚠️ schema MCP lạc hậu (P0-10) | n/a | n/a | ✅ via render_video | ✅ 6 tools | npm run demo 28/28 | **VERIFIED**⁵ |

### Ghi chú

1. **Trim/Split:** VERIFIED ở speed=1. Khi clip có speed ≠ 1, `store.ts` tính
   `out = in + duration` (chỉ đúng khi speed=1) — xem P0-07 trong Master Plan.
2. **Keyframes:** Chỉ x/y/opacity được render. `scale`/`rotation` lưu trong spec
   nhưng render bỏ qua (xem KEYFRAMES_LIMITS.md). Preview chưa áp dụng keyframes.
3. **Sticker:** Render đã tích hợp đầy đủ (`render.js` dòng 310-322,
   `validate.js` chấp nhận track kind `"sticker"`). Tuy nhiên `StickerPanel.tsx`
   tồn tại trong `apps/web/src/components/sticker/` nhưng **chưa được import/mount**
   vào `Inspector.tsx` — user chưa thể thêm sticker từ UI. Đây là khoảng trống
   duy nhất ngăn sticker đạt VERIFIED.
4. **Auto-caption:** `server/caption/caption.py` chạy local với faster-whisper,
   transcribe tiếng Việt đã kiểm chứng. Chưa có nút "Tạo phụ đề" trong UI editor
   (chỉ chạy CLI thủ công).
5. **MCP:** 6 tools (`create_project`, `add_clip`, `add_text`, `apply_transition`,
   `get_project`, `render_video`) đã demo 28/28 pass. Tuy nhiên schema MCP chưa
   theo kịp video-spec mới (thiếu sticker kind, speed, keyframes, LUT, effects)
   — xem P0-10.

## Chi tiết tích hợp đã kiểm chứng (tại commit 1844e2cc)

### render.js — tất cả 8 module đã được import VÀ sử dụng
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

### apps/web/src/Inspector.tsx — 7/8 panel đã mount
- ✅ TransitionPanel, SpeedPanel, KeyframePanel, ChromaPanel, TextAnimPicker,
  LutPicker, EffectPanel
- ❌ StickerPanel — **chưa mount** (file tồn tại, chưa được import)

## Những gì CHƯA có (trung thực)

- **Export MP4 từ UI:** ExportPanel chỉ xuất `.videospec.json`, chưa nối tới render worker (P0-01)
- **Save/Load project:** Store là in-memory, chưa có persistence (P0-02)
- **Preview đầy đủ:** preview.tsx chỉ hỗ trợ fade transition cơ bản; chưa có keyframes, speed, LUT, effects, chroma, sticker (P0-08)
- **TTS tiếng Việt:** Chưa implement (Phase 2)
- **Tách nền AI:** Chưa implement — chỉ có chroma key (key theo màu), không phải AI segmentation (Phase 2)
- **Masking:** Chưa có
- **CI/CD:** Chưa có `.github/workflows` (P0-13)

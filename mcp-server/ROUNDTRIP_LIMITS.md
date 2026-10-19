# MCP Round-trip — Giới hạn và trạng thái (R1-020, P0-10)

Ngày: 2026-10-19 | Commit kiểm chứng: (local, chưa push)

## Đã hỗ trợ (61/61 test pass)

### Track kinds
- ✅ `video`, `audio`, `text`, `sticker`, `image` — đầy đủ 5 kinds

### VideoClip fields
- ✅ Cơ bản: id, src, start, duration, in, out, opacity
- ✅ `speed` (0.25–4), `reverse` (boolean)
- ✅ `transitionIn`/`transitionOut` — cả 13 loại (none, fade, fadeblack, fadewhite, wipeleft/right/up/down, slideleft/right, dissolve, circleopen, radial)
- ✅ `animations` (keyframes): x, y, opacity, scale, rotation; easing linear/ease-in/ease-out; tối đa 128 keyframes/prop
- ✅ `chromaKey`: color (#rrggbb), similarity (0..1), blend (0..1)
- ✅ `filter`: lut (10 LUT ids)
- ✅ `effects`: 7 loại (blur, sharpen, grayscale, sepia, vignette, noise, brightness), intensity 0..1, không trùng loại

### AudioClip fields
- ✅ Cơ bản: id, src, start, duration, in, out, volume (0..2), fadeIn, fadeOut
- ✅ `speed` (0.25–4), `reverse` (boolean)

### TextClip fields
- ✅ Cơ bản: id, text, start, duration, style
- ✅ `style.animation`: cả 8 loại (none, fadeUp, fadeIn, slideInLeft, slideInRight, slideUp, bounce, typewriter)

### StickerClip fields
- ✅ id, src, start, duration, x (0..1), y (0..1), scale (>0), opacity (0..1), rotation

### ImageClip fields
- ✅ id, src, start, duration, fit (contain/cover)

### Round-trip
- ✅ spec → validateVideoSpec → JSON.stringify → JSON.parse → validateVideoSpec → JSON giống hệt nhau (không mất field)

## Chưa hỗ trợ / Giới hạn

1. **Keyframe scale/rotation**: MCP validate chấp nhận nhưng render worker chưa render (theo KEYFRAMES_LIMITS.md) — field được giữ nguyên qua round-trip, không mất.

2. **TextClip animations (keyframes)**: MCP validate hiện không xử lý `animations` cho TextClip (chỉ VideoClip). Field sẽ bị loại bỏ nếu đi qua validateTextClip. Cần bổ sung.

3. **Duration invariant với speed**: MCP validate KHÔNG kiểm tra `duration == (out - in) / speed`. Spec sai invariant vẫn pass MCP validate (render worker có thể từ chối sau). Nên thêm check như `validateSpeedFields` trong video-spec.

4. **MCP demo (examples/agent-demo.js) đang FAIL**: không phải do thay đổi này — render worker fail vì file test `clip1.mp4`/`clip2.mp4` không có audio stream nhưng filtergraph vẫn reference `[0:a]`/`[1:a]`. Bug có sẵn của render worker (audio handling), ngoài phạm vi R1-020.

5. **Spec version**: MCP server và render worker hiện chấp nhận `0.1.0` và `0.2.0`. Migration 0.1.0 → 0.2.0 do `packages/video-spec/src/migrations.ts` đảm nhiệm (không phải MCP).

6. **Zod schemas vs validate.ts**: cả hai đã được đồng bộ (track kinds, transition types, text animations, clip fields). Nếu thêm field mới vào video-spec, phải cập nhật cả hai.

## Test
- `mcp-server/src/roundtrip.test.ts`: 61 assertions, 61 pass, 0 fail
- Chạy: `npm run build && node dist/mcp-server/src/roundtrip.test.js`
- `npx tsc --noEmit`: 0 lỗi
- `npm run demo`: FAIL (do bug render worker #4, không liên quan MCP validate)

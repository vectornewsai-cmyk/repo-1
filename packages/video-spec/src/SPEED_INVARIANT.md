# SPEED INVARIANT — Bất biến tốc độ/thời gian (R1-013, R1-014, P0-07)

> Cập nhật: 19/10/2026. Áp dụng cho mọi nơi dùng speed/reverse: spec, store, preview, render, MCP.

## 1. Bất biến cốt lõi

Mỗi clip video/audio có đoạn nguồn `[in, out)` (giây của file gốc) và tốc độ `speed`:

```
sourceDuration   = out - in              (giây nguồn, không đổi khi đổi speed)
timelineDuration = (out - in) / speed    (giây timeline = clip.duration)
```

**`clip.duration` PHẢI bằng `timelineDuration`** (sai số 1e-6).
Đổi speed → cập nhật duration. Trim → cập nhật in/out theo speed.

## 2. Hàm dùng chung duy nhất: `sourceTimeAt(clip, timelineT)`

```ts
import { sourceTimeAt } from "@repo-1/video-spec/speed";

// timelineT: giây trên timeline (thường trong [start, start+duration])
// trả về: giây nguồn trong [in, out]
```

Công thức:
```
localT = timelineT - clip.start
offset = localT * speed
reverse = false → in + offset
reverse = true  → out - offset
```

**Mọi nơi phải dùng hàm này**, không tự tính `in + (t - start)`:

| Nơi | Dùng cho |
|-----|----------|
| `store.ts` trim trái | `trimLeftTo(clip, newStart)` |
| `store.ts` trim phải | `trimRightTo(clip, newDuration)` |
| `store.ts` split | `splitSourceAt(clip, t)` |
| `preview.tsx` seek | `sourceTimeAt(clip, t)` + `playbackRate = speed` |
| `render.js` | `trim=start=in:end=in+duration*speed` (đã đúng) |

## 3. Trim với reverse (R1-014)

Reverse đảo chiều phát: đầu timeline ↔ cuối nguồn (`out`).

- **Trim trái** (kéo dài/thu hẹp đầu timeline):
  - xuôi: dịch `in` → `newIn = sourceTimeAt(clip, newStart)`
  - ngược: dịch `out` → `newOut = out - shift*speed`
- **Trim phải** (đổi duration):
  - xuôi: dịch `out` → `newOut = sourceTimeAt(clip, newEnd)`
  - ngược: dịch `in` → `newIn = sourceTimeAt(clip, newEnd)`

Giới hạn:
- xuôi: `in >= 0`, `out <= mediaDuration`
- ngược: `out <= mediaDuration` (trim trái), `in >= 0` (trim phải)

Dùng `maxTrimLeft(clip, mediaDuration)` và `maxTrimRightDuration(clip, mediaDuration)`.

## 4. Split với reverse (R1-014)

`splitSourceAt(clip, t)` trả về `{ leftIn, leftOut, rightIn, rightOut }`.
Điểm cắt = `sourceTimeAt(clip, t)` — đúng với cả hai chiều vì hàm đã đảo.

Phần trái/phải giữ nguyên speed/reverse, duration mỗi phần = `(out - in) / speed`.

Keyframe khi split: giữ nguyên keyframe theo local-time (chưa implement — xem LIMITS).

## 5. Preview (P0-07)

- Seek: `el.currentTime = sourceTimeAt(clip, t)` — đúng khi pause/scrub.
- Phát: `el.playbackRate = clip.speed`, `preservesPitch = true` (giữ cao độ như `atempo` của render).
- **Giới hạn**: HTMLVideoElement không phát ngược. Khi `reverse=true` và đang phát,
  preview chạy xuôi (sai hướng). Chỉ khi pause/scrub mới seek đúng.
  Render MP4 vẫn đúng (FFmpeg `reverse` filter).

## 6. Render (đã đúng từ trước)

`server/render/src/render.js`:
```
trim=start={in}:end={in + duration*speed} → speed/reverse filter
```
Khớp invariant: đoạn nguồn `[in, in + duration*speed)` = `[in, out)`.

## 7. Test

Chạy: `node packages/video-spec/test_speed_map.mjs` (hoặc `npm run test:unit`)

Các case:
- `sourceTimeAt` ở 0.5x, 1x, 2x, 4x (xuôi + ngược)
- `trimLeftTo`/`trimRightTo` ở 2x (xuôi + ngược)
- `splitSourceAt` ở 0.5x + reverse
- Invariant `duration = (out-in)/speed` sau mọi phép biến đổi

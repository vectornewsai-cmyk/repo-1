# PHASE9_ROUND87_O4_MASK_TRACK_PREVIEW_LIMITS.md — Mask bám motion track ở preview (đợt 87, luồng O4)

Ngày: 11/11/2026. Chủ đề đợt 87: mask bám motion track (phần còn lại của gap E5).
Luồng O4: preview canvas + parity preview–render. KHÔNG push. KHÔNG release/tag.

## 1. Kết quả chính — parity preview–render (số đo thật)

Clip test (cả 2 đường dùng cùng clip): video trắng 1280×720, 3s, 30fps
(`color=white`, H.264 yuv420p); 1 clip video `start=0, duration=3, in=0, out=3`;
mask ellipse tĩnh tâm **(0.3, 0.5)**, `w=0.4, h=0.5, feather=0` (cố tình
đặt tâm tĩnh ≠ 0.5 để phân biệt các ngữ nghĩa — xem §2); track tuyến tính
2 điểm `(0, 0.3, 0.5) → (2, 0.7, 0.5)` (thời gian clip-local).

Đo tâm = centroid pixel sáng (ngưỡng > 128, không trọng số) trên frame thật.
Render: `render.js` trực tiếp + `ffmpeg select` trích frame `n=15/30/45`
(= 0.5/1.0/1.5s) + đo bằng `measure-blob.mjs`. Preview: app thật qua CDP
(Chromium 1254 headless, `vite dev`, `importFiles` + `replaceProject` +
`setPlayhead` qua store, đọc pixel canvas preview thật) — harness
`apps/web/scripts/probe87o4-mask-track-preview.cdp.mjs`. Canvas preview
872×276, project letterbox vào đó: `dx=190.67, dw=490.67` (fit 1280×720
vào 872×276, scale 0.38333) — mọi số preview dưới đây ĐÃ đổi về hệ project
`cx_proj = (cx_canvas·872 − 190.67) / 490.67` (y không cần đổi: project lấp
đủ chiều cao canvas). `cy` preview 0.5014, render 0.5007 (lệch 0.7px @720,
do yuv420p + làm tròn — không đáng kể).

| t (s) | track x | render png (mặc định, O2) | render trackgeq (O3) | render geq | preview MỚI (O4) | preview CŨ (baseline) |
|---|---|---|---|---|---|---|
| 0.5 | 0.4 | 0.4004 | 0.4004 | 0.2004 | **0.4006** | 0.2008 |
| 1.0 | 0.5 | 0.5004 | 0.5004 | 0.3004 | **0.5007** | 0.3006 |
| 1.5 | 0.6 | 0.6004 | 0.6004 | 0.4004 | **0.6007** | 0.4007 |

- **Preview MỚI khớp render png + trackgeq: |lệch| ≤ 0.0005 (≤ 0.64px @1280).**
- Preview CŨ (revert tạm 3 sửa đổi O4, đo đối chứng cùng harness) khớp
  render `--mask-mode geq`: |lệch| ≤ 0.0004. Harness phân biệt được rõ 2
  ngữ nghĩa (cách nhau 0.2 = 256px) nên số parity trên không phải trùng cờ.
- Bbox ellipse (rộng): preview MỚI @1.0s: `x1−x0` project = 0.3974 (lý
  tưởng 0.4, hẹp ~0.7% do viền mềm sau upscale từ intermediate 640px —
  xem §4); render: 0.3992. Tâm không bị ảnh hưởng (viền mềm đối xứng).
- Đếm pixel sáng: preview ~21.243–21.250 (diện tích ellipse thu theo
  `(490/1280)²` so với render 144.705 — tỉ lệ khớp tới 0.2%).
- Sau khi khôi phục file O4 (byte-identical với bản đã đo), chạy lại probe
  ở t=1.0s: `cx` canvas 0.5004 → project 0.5007, giống hệt lần đo đầu.

## 2. Ngữ nghĩa đã chốt (và vì sao phải bỏ shift D3)

Render (đã có sẵn khi O4 làm việc — O2 đường png, O3 đường trackgeq):

- **png (mặc định)**: clip mask+track → video mask animation vẽ bằng
  `mask_anim.py`, keyframes suy ra từ quỹ đạo qua
  `trackPointsToMaskKeyframes` (O1: track thắng x/y, keyframes thắng w/h);
  clip **đứng yên** (bỏ shift D3 ở bước đặt timeline, `render.js:900`).
- **trackgeq**: geq động, tâm mask = track(T); clip đứng yên
  (`render.js:900`); keyframes bị **bỏ qua hoàn toàn** ở mode này.
- **geq**: hành vi cũ — mask tĩnh cưỡi theo shift D3
  (tâm cuối = tâm tĩnh + (track − 0.5)).

Preview O4 mirror đúng 2 mode mới (png + trackgeq), **không mirror geq**:

1. `maskedUnitSource` (`preview.tsx`, marker "đợt 87 O4"): thêm tham số
   `track?`; `effMask = { ...keyframeInterpolated, ...interpolateTrackPoints(track.points, localT) }`
   — track thắng x/y, keyframes thắng w/h/feather (khớp helper O1),
   shape/feather/invert giữ nguyên.
2. `drawVideoClip`: clip vừa có mask vừa có track → `trackShift = null`,
   `trackCenter = null` ngay sau khi tính (mirror `render.js:900`). Mọi
   nhánh vẽ dưới (mask SR / mask thường / motion-blur blend / vignette)
   đều đọc 2 biến này nên video đứng yên, mask chạy trong unit tĩnh.
   Giữ shift sẽ double-shift: tâm cuối = 2·track − 0.5 (O3 đã đo ở render;
   test logic khóa công thức này, xem §5).
3. Call site video truyền `clip.track`; call site image KHÔNG truyền
   (render mặc định bỏ qua track cho ảnh, overlay 0:0 — khớp).

**Lệch có chủ đích, cần parent quyết:** preview không có cờ mask-mode như
render. Với clip mask+track, preview nay LUÔN theo ngữ nghĩa mới (tâm cuối
= track) và **lệch với render `--mask-mode geq`** (tâm cuối = tâm tĩnh +
(track − 0.5), đã đo §1: 0.2004/0.3004/0.4004). Trước O4, preview khớp geq.
Đây là hệ quả của việc tính năng mới không có cờ chuyển mode ở preview —
nếu parent muốn giữ parity với geq thì cần thêm cờ tương đương ở preview
(nợ mở §6).

**Lệch thứ hai (keyframes + track):** preview theo luật parent/O1
(keyframes thắng w/h/feather), còn render trackgeq bỏ qua keyframes
(w/h tĩnh). Harness lần này dùng mask KHÔNG keyframes nên lệch này
**chưa được đo** — clip mask vừa có keyframes vừa có track sẽ lệch
preview–render ở mode trackgeq đúng bằng (w/h keyframes − w/h tĩnh).
Ở mode png (mặc định), O2 dùng cùng helper O1 nên khớp. Cần parent/O1/O3
chốt: hoặc preview bỏ keyframes khi có track (theo O3), hoặc O3 nhận
w/h keyframes (theo O1).

## 3. Text typewriter/karaoke — đã kiểm chứng, KHÔNG sửa

- Render: text `typewriter` / `karaoke` / parity-animation vẽ bằng ASS
  (`subtitles` filter), không dùng track (`render.js:953-1090`).
- Preview: `preview.tsx:934` đã bỏ qua track khi
  `animation === "typewriter" || hasKaraoke || isParityTextAnimation`
  (comment D3 ghi rõ). Khớp render — không đổi gì, không tự ý khác.
- Text clip không có field `mask` trong video-spec nên không có đường
  mask cho text ở cả 2 phía.

## 4. Giới hạn đã biết (không giấu)

- **Intermediate scale 640px (G7b):** `maskedUnitSource` áp mask trên
  canvas unit ≤ 640px rồi upscale lên khung hình (comment `preview.tsx:523`).
  Viền ellipse mềm hơn render ~2px @720p (bbox hẹp 0.7%, §1); tâm không
  lệch. Feather > 0 sẽ cộng thêm độ mềm này — chưa đo riêng (harness dùng
  feather=0).
- **Image clip + track:** preview bỏ qua track cho mask ảnh (khớp render
  mặc định); render trackgeq sẽ làm mask ảnh chạy theo track — nhưng
  validator chỉ cho track ở clip video ("Chỉ dùng cho video clip", báo lỗi
  ở track khác) nên spec đó không render được; lệch này không tới được
  người dùng.
- **Transition (unit đã merge):** render bỏ qua track cho unit merge;
  preview không biết trạng thái merge (nợ D3 cũ, xem `D3_LIMITS.md`). Với
  mask+track trong đoạn chuyển cảnh, preview nay cho mask chạy + video
  đứng yên; render png/trackgeq cũng cho mask chạy (mask video/geq theo
  track) + video đứng yên (không shift vì merged) nên thực tế KHỚP nhau
  ở trường hợp này — nhưng chưa đo bằng clip có transition (harness không
  có transition).
- **SR (scale/rotation) + mask + track:** code đi nhánh SR dùng
  `trackCenter ?? pl.centerX` → nay dùng `pl.centerX` (video đứng yên,
  SR quanh tâm placement). Chưa đo pixel cho trường hợp SR (harness không
  có SR) — logic cùng một chỗ null nên rủi ro thấp, nhưng chưa có số đo.
- **Motion blur + mask + track:** nhánh blend dùng `trackShift ?? 0` → nay
  0 (snapshot = unit đã mask, không dịch). Chưa đo pixel riêng.
- **Harness cần setup tay:** cần `vite dev` + file mp4 trắng trong
  `apps/web/public/` (tạo bằng ffmpeg, xem header script) + Chromium ở
  `~/.cache/ms-playwright/chromium-1254/`. Không chạy được bằng `vite
  preview` (cần import `/src/store.ts` — chỉ dev server mới serve).
  Trong lúc đo, phát hiện `replaceProject` reset `media: []`
  (`store.ts:3148`) nên harness phải import SAU replace (đã ghi trong
  script); `__vcutMediaState`/`__vcutMediaEls` chỉ cập nhật ở nhánh đang
  phát nên khi pause chúng rỗng — không phải lỗi media.
- **Không đụng:** TTS 39, file workflow, các luồng khác. Chỉ sửa file
  trong phạm vi O4 (xem §7).

## 5. Kiểm chứng đã chạy (số thật)

- Test logic mới `apps/web/src/maskTrackPreview87O4.test.ts` (esbuild +
  node): **12/12 xanh** — track thắng x/y, keyframes thắng w/h, kẹp ngoài
  khoảng, không track giữ hành vi D4 cũ, công thức double-shift đối chứng.
- Test cũ chạy lại còn xanh: `lib/maskTrack.test.ts` **22 pass, 0 fail**
  (gồm test mirror O1); `lib/maskKeyframes.test.ts` **14 pass, 0 fail**;
  `lib/previewEngine.test.ts` **14 passed**.
- `npx tsc --noEmit` apps/web: **0 lỗi từ file O4**. Còn 4 lỗi ở file của
  luồng song song O5 (`components/mask/maskTrackUi87O5.test.ts` 3× TS2352,
  `components/sticker/TrackPanel.tsx` 1× TS18048) — không phải của O4,
  không sửa (parent gộp/O5 sửa). Vì vậy `npm run build` (tsc && vite
  build) hiện FAIL ở bước tsc do O5; `npx vite build` riêng **PASS**
  (27.29s, `dist/assets/index-Bmsg63Y9.js`).
- Harness parity: xem §1 (preview MỚI + baseline CŨ + render 3 mode,
  3 mốc thời gian, mỗi mốc đo tới khi tâm ổn định 2 lần liên tiếp).

## 6. Nợ mở cho parent

1. Preview có cần cờ mask-mode (để parity với render geq) hay chấp nhận
   preview luôn theo ngữ nghĩa mới (§2)? Quyết định này đổi cả hành vi
   mặc định của clip mask+track không có keyframes.
2. Keyframes + track: chốt 1 luật cho cả preview lẫn render trackgeq
   (preview giữ w/h keyframes, O3 bỏ keyframes — lệch chưa đo, §2).
3. Đo bổ sung (chưa làm): mask+track+SR, mask+track+motion blur,
   mask+track+transition, mask feather > 0 (độ mềm viền).
4. `tsc` còn 4 lỗi của O5 — cần O5 sửa hoặc parent xử lý khi gộp; không
   chặn vite build nhưng chặn `npm run build`.
5. `docs/PHASE9_ROUND87_O2_MASK_TRACK_RENDER_LIMITS.md` và O3_LIMITS được
   code render.js/mask.js nhắc tới nhưng **chưa có trên đĩa** lúc O4 viết
   file này (chỉ có `PHASE9_ROUND87_O9_GAP_BACKFILL_LIMITS.md` + log
   `round87-o8/o9`) — O2/O3 có thể viết sau; số đo O4 tự đứng được.

## 7. File đổi (stage, KHÔNG push)

- `apps/web/src/preview.tsx` — 3 chỗ marker "đợt 87 O4" (maskedUnitSource
  + call site video + null trackShift/trackCenter). Không đụng marker
  luồng khác.
- `apps/web/src/maskTrackPreview87O4.test.ts` — mới, test logic 12 check.
- `apps/web/scripts/probe87o4-mask-track-preview.cdp.mjs` — mới, harness
  CDP đo parity (đã chạy thật 4 lần: MỚI ×2 mốc, CŨ ×3 mốc, khôi phục
  ×1 mốc).
- `docs/PHASE9_ROUND87_O4_MASK_TRACK_PREVIEW_LIMITS.md` — file này.
- Không stage binary: mp4 trắng test + các mp4 render + frame đo nằm ở
  `/tmp/round87-o4/` (fixture `white720.mp4`, spec
  `spec-mask-track.json`, `measure-blob.mjs`,
  `render-default.mp4` (png mặc định) / `render-trackgeq.mp4` /
  `render-geq.mp4`).
  File `white720-o4.mp4` tạm trong `apps/web/public/` đã xóa sau khi đo.
- Log luồng: `workspace/goals/capcut-clone-video-editor/hidden_files/round87-o4.md`.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round87-o4-mask-track-preview.txt`.

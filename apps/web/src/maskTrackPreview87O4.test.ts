// maskTrackPreview87O4.test.ts — Phase 9 đợt 87, luồng O4: mask bám motion
// track ở preview (mirror render --mask-mode trackgeq của O3).
// Phase 9 đợt 88 P6: maskedUnitSource nay dùng helper O1 maskGeometryAtTrack
// (preview.tsx) thay cho bản inline của O4 — test này chuyển sang gọi helper
// thật (§1–§5 giữ nguyên 12 check) và khóa parity helper == công thức inline
// cũ trên sweep (§6). Bản thân maskedUnitSource cần DOM canvas nên không chạy
// được ở Node; helper là toàn bộ phần hình học của nó (applyMask chỉ đọc
// shape/x/y/w/h/feather/invert — xem previewEngine.maskAlphaAt).
//
// Quy tắc hình học khóa ở đây (luật parent chốt, helper O1): tâm mask (x, y)
// = vị trí track tại localT (nội suy tuyến tính, kẹp ngoài khoảng); shape /
// size / feather giữ nguyên; mask vừa có keyframes vừa có track → track
// thắng x/y, keyframes thắng w/h/feather.
//
// Chạy bằng esbuild bundle (mẫu enhancePreview75C8.test.ts, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/maskTrackPreview87O4.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round88-p6/maskTrackPreview87O4.test.cjs \
//     && node /tmp/round88-p6/maskTrackPreview87O4.test.cjs
import { interpolateMaskAt, maskGeometryAtTrack } from "@repo-1/video-spec";
import { interpolateTrackPoints } from "./lib/previewEngine";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  cwd: () => string;
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
};

let pass = 0;
function ok(cond: boolean, label: string, extra?: unknown) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ FAIL: ${label}`, extra === undefined ? "" : JSON.stringify(extra));
    process.exitCode = 1;
  }
}
function approx(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

type Mask = {
  shape: string;
  x: number;
  y: number;
  w: number;
  h: number;
  feather: number;
  invert?: boolean;
  keyframes?: Array<{ t: number; x: number; y: number; w: number; h: number }>;
};
type Track = { points: Array<{ t: number; x: number; y: number }> } | null | undefined;

/**
 * Đợt 88 P6: effMask nay = helper O1 thật (như maskedUnitSource sau refactor).
 */
function effMaskTracked(mask: Mask, track: Track, localT: number) {
  return maskGeometryAtTrack(mask as never, track ?? null, localT);
}

/**
 * Công thức inline cũ của O4 (đã gỡ khỏi preview.tsx ở P6) — chỉ dùng để
 * đối chứng parity ở §6, không phải code production nữa.
 */
function effMaskInlineOld(mask: Mask, track: Track, localT: number) {
  const base = mask.keyframes?.length
    ? { ...mask, ...interpolateMaskAt(mask as never, localT) }
    : mask;
  return track ? { ...base, ...interpolateTrackPoints(track.points, localT) } : base;
}

// Track tuyến tính 2 điểm (0, 0.3, 0.5) → (2, 0.7, 0.5), dùng chung cho
// cả test logic lẫn harness parity pixel (clip test 720p, mask ellipse).
const TRACK = { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] };
const MASK_STATIC = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 };

// 1. Mask tĩnh + track: tâm = track tại localT, w/h/feather giữ nguyên.
{
  const e0 = effMaskTracked(MASK_STATIC, TRACK, 0);
  ok(approx(e0.x, 0.3) && approx(e0.y, 0.5), "tĩnh+track @0s: tâm = (0.3, 0.5)", e0);
  const e1 = effMaskTracked(MASK_STATIC, TRACK, 1);
  ok(approx(e1.x, 0.5) && approx(e1.y, 0.5), "tĩnh+track @1s: tâm = (0.5, 0.5)", e1);
  const e2 = effMaskTracked(MASK_STATIC, TRACK, 2);
  ok(approx(e2.x, 0.7) && approx(e2.y, 0.5), "tĩnh+track @2s: tâm = (0.7, 0.5)", e2);
  ok(e1.w === 0.4 && e1.h === 0.5 && e1.feather === 0, "tĩnh+track: w/h/feather giữ nguyên", e1);
}

// 2. Kẹp ngoài khoảng track (hold điểm đầu/cuối, khớp interpolateTrackPoints).
{
  const eNeg = effMaskTracked(MASK_STATIC, TRACK, -0.5);
  ok(approx(eNeg.x, 0.3), "track kẹp trái: localT=-0.5 → x=0.3", eNeg);
  const eOver = effMaskTracked(MASK_STATIC, TRACK, 3);
  ok(approx(eOver.x, 0.7), "track kẹp phải: localT=3 → x=0.7", eOver);
}

// 3. Mask có keyframes + track: track thắng x/y, keyframes thắng w/h.
//    Keyframes: t=0 {x .2, y .2, w .3, h .4} → t=2 {x .8, y .8, w .5, h .6}.
//    @1s nội suy keyframes = (.5, .5, .4, .5) nhưng x/y bị track ghi đè (.5, .5).
{
  const kfMask = {
    ...MASK_STATIC,
    keyframes: [
      { t: 0, x: 0.2, y: 0.2, w: 0.3, h: 0.4 },
      { t: 2, x: 0.8, y: 0.8, w: 0.5, h: 0.6 },
    ],
  };
  const e = effMaskTracked(kfMask, TRACK, 1);
  ok(approx(e.x, 0.5) && approx(e.y, 0.5), "kf+track @1s: x/y = track (0.5, 0.5)", e);
  ok(approx(e.w, 0.4) && approx(e.h, 0.5), "kf+track @1s: w/h = keyframes (0.4, 0.5)", e);
}

// 4. Không track → hành vi cũ: keyframes nội suy đủ x/y/w/h (D4 giữ nguyên).
{
  const kfMask = {
    ...MASK_STATIC,
    keyframes: [
      { t: 0, x: 0.2, y: 0.2, w: 0.3, h: 0.4 },
      { t: 2, x: 0.8, y: 0.8, w: 0.5, h: 0.6 },
    ],
  };
  const e = effMaskTracked(kfMask, null, 1);
  ok(approx(e.x, 0.5) && approx(e.y, 0.5) && approx(e.w, 0.4) && approx(e.h, 0.5),
    "không track: keyframes nội suy đủ 4 trường (hành vi D4 cũ)", e);
  const es = effMaskTracked(MASK_STATIC, null, 1);
  ok(es.x === 0.5 && es.y === 0.5 && es.w === 0.4, "không track, mask tĩnh: giữ nguyên", es);
}

// 5. Tâm cuối trên khung (preview, sau khi bỏ shift D3): = vị trí track.
//    Trước O4 (giữ shift): tâm cuối = track + (track - 0.5) = 2*track - 0.5
//    → @0s: 0.1, @2s: 0.9 — double-shift mà O3 đã đo ở render. Khóa công thức.
{
  const finalCenter = (trackX: number) => trackX; // O4: bỏ shift, tâm cuối = track
  const doubleShift = (trackX: number) => 2 * trackX - 0.5; // hành vi cũ nếu quên bỏ shift
  ok(approx(finalCenter(0.3), 0.3) && approx(finalCenter(0.7), 0.7),
    "O4: tâm cuối trên khung = track (0.3 / 0.7)", null);
  ok(approx(doubleShift(0.3), 0.1) && approx(doubleShift(0.7), 0.9),
    "đối chứng: giữ shift sẽ ra double-shift 0.1 / 0.9 (sai)", null);
}

// 6. Đợt 88 P6 — parity helper O1 == công thức inline cũ của O4 trên sweep.
//    So đủ 7 trường applyMask đọc (shape/x/y/w/h/feather/invert); keyframes
//    không so (helper bỏ keyframes, inline giữ — applyMask không đọc nó).
{
  const TS = [-1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3, 5];
  const MASKS: Mask[] = [
    MASK_STATIC,
    { shape: "rect", x: 0.2, y: 0.8, w: 0.6, h: 0.3, feather: 0.4, invert: true },
    {
      ...MASK_STATIC,
      keyframes: [
        { t: 0, x: 0.2, y: 0.2, w: 0.3, h: 0.4 },
        { t: 2, x: 0.8, y: 0.8, w: 0.5, h: 0.6 },
      ],
    },
    {
      shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.2,
      keyframes: [{ t: 0, x: 0.1, y: 0.9, w: 0.2, h: 0.2 }],
    },
  ];
  const TRACKS: Track[] = [
    TRACK,
    { points: [{ t: 1, x: 0.25, y: 0.75 }] }, // 1 điểm
    { points: [{ t: 2, x: 0.7, y: 0.5 }, { t: 0, x: 0.3, y: 0.5 }] }, // chưa sort
    null,
    undefined,
  ];
  const FIELDS = ["shape", "x", "y", "w", "h", "feather", "invert"] as const;
  let pairs = 0;
  for (const m of MASKS) {
    for (const tr of TRACKS) {
      pairs++;
      let worst = 0;
      let worstT = 0;
      for (const t of TS) {
        const a = effMaskTracked(m, tr, t) as unknown as Record<string, unknown>;
        const b = effMaskInlineOld(m, tr, t) as unknown as Record<string, unknown>;
        for (const f of FIELDS) {
          const av = (a[f] as number | string | boolean | undefined) ?? (f === "invert" ? false : undefined);
          const bv = (b[f] as number | string | boolean | undefined) ?? (f === "invert" ? false : undefined);
          if (typeof av === "number" && typeof bv === "number") {
            const d = Math.abs(av - bv);
            if (d > worst) { worst = d; worstT = t; }
          } else if (av !== bv) {
            worst = Infinity;
            worstT = t;
          }
        }
      }
      ok(worst <= 1e-9, `parity helper==inline cũ: mask#${MASKS.indexOf(m)} track#${TRACKS.indexOf(tr)} (lệch max ${worst} @t=${worstT})`, { worst, worstT });
    }
  }
  ok(pairs === 20, `sweep parity chạy đủ 20 cặp mask×track`, { pairs });
  // Ngoại lệ 1 — keyframes: helper bỏ khỏi kết quả, inline giữ lại.
  // Không ảnh hưởng pixel (applyMask không đọc keyframes) — khóa để khỏi
  // ai đó "sửa" helper cho giống inline mà không hiểu vì sao.
  {
    const kfMask: Mask = {
      ...MASK_STATIC,
      keyframes: [{ t: 0, x: 0.2, y: 0.2, w: 0.3, h: 0.4 }],
    };
    const h = effMaskTracked(kfMask, TRACK, 1) as unknown as Record<string, unknown>;
    const o = effMaskInlineOld(kfMask, TRACK, 1) as unknown as Record<string, unknown>;
    ok(h["keyframes"] === undefined && Array.isArray(o["keyframes"]),
      "helper bỏ keyframes khỏi kết quả, inline cũ giữ lại (không ảnh hưởng applyMask)", { helperKf: h["keyframes"] });
  }
  // Ngoại lệ 2 — track rỗng (spec không hợp lệ, validator báo lỗi): helper
  // fallback về hình học tĩnh, inline cũ ép tâm (0.5, 0.5). Helper khớp
  // render (CJS maskGeometryAtTrack) và đúng hơn — khóa hành vi này.
  {
    const empty = { points: [] as Array<{ t: number; x: number; y: number }> };
    const h = effMaskTracked(MASK_STATIC, empty, 1);
    const o = effMaskInlineOld(MASK_STATIC, empty, 1);
    const s = effMaskTracked(MASK_STATIC, null, 1);
    ok(approx(h.x, 0.5) && approx(h.y, 0.5) && approx(h.x, s.x) && approx(h.y, s.y),
      "track rỗng: helper fallback hình học tĩnh (0.5, 0.5)", h);
    ok(approx(o.x, 0.5) && approx(o.y, 0.5),
      "đối chứng: inline cũ cũng ra (0.5, 0.5) ở mask này — lệch chỉ lộ khi tâm tĩnh ≠ 0.5", o);
    const off: Mask = { shape: "ellipse", x: 0.3, y: 0.7, w: 0.4, h: 0.5, feather: 0 };
    const hOff = effMaskTracked(off, empty, 1);
    const oOff = effMaskInlineOld(off, empty, 1);
    ok(approx(hOff.x, 0.3) && approx(hOff.y, 0.7) && approx(oOff.x, 0.5) && approx(oOff.y, 0.5),
      "track rỗng + tâm tĩnh (0.3, 0.7): helper giữ (0.3, 0.7), inline cũ ép (0.5, 0.5)", { helper: hOff, inlineOld: oOff });
  }
}

console.log(`\nmaskTrackPreview87O4 (+P6 parity): ${pass} check xanh${process.exitCode ? " (CÓ FAIL)" : ""}`);

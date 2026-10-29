// nestedUnify.test.ts — Luồng U5, đợt 7 VCut (Phase 9 round 7: thống nhất
// ngữ nghĩa nested/adjustment). Test THUẦN LOGIC, không phụ thuộc component
// UI, không cần browser/bundler.
//
// Chạy bằng Node type-stripping (cùng quy ước với nestedPreview.test.ts):
//   node --experimental-strip-types src/lib/nestedUnify.test.ts
// (chạy từ thư mục apps/web)
//
// Cách đếm — đọc kỹ trước khi trích số:
//   - PROVEN: assert trên hành vi hiện có của nestedPreview.ts; fail thì
//     process.exitCode = 1. Một số assert KHÓA hành vi hiện tại dù hành vi
//     đó là PHÂN KỲ (preview khác render) — chúng chứng minh phân kỳ đang
//     tồn tại, không phải chứng minh ngữ nghĩa đã thống nhất.
//   - PENDING: chỉ in ra (⏳), KHÔNG assert, KHÔNG tính vào pass. Đó là
//     các điểm entry/API thống nhất chưa có, luồng khác khớp sau rồi mới
//     được đổi thành assert PROVEN. File này xanh KHÔNG có nghĩa là đợt 7
//     đã thống nhất xong.
//
// Nội dung:
//   §1. Normalize / unify (PROVEN, phía preview):
//      1.1 clip nested dạng chuẩn render (subSpec) được preview nhận diện
//          VÀ phẳng đúng (không rơi thành clip lá).
//      1.2 preview ĐỌC `trim` { in, out } của nested clip, cho cùng
//          outerStart/duration như ngữ nghĩa render (nested.js).
//      1.3 adjustment không có thông tin track -> fallback legacy: áp mọi clip.
//      1.4 layer dạng danh sách spec (field `filters` mảng) KHÔNG được
//          preview đọc khi nằm trên track adjustment (chỉ đọc `filter`/
//          `effects` đơn) — filter/effects ra undefined. (Đường track-clip
//          legacy này khác đường layer chuẩn `filters` của U3.)
//      1.5 `spec.adjustmentLayers` (danh sách cấp project) ĐƯỢC
//          buildPreviewSpec gộp vào clip (cắt đoạn + gộp filter).
//   §2. Ngữ nghĩa scope chuẩn `scopeTracks` của preview (U3, PROVEN):
//      layer áp khi nestedPath là tiền tố và track của clip ở đúng level
//      nằm trong scopeTracks (vắng = mọi track). Luật R4 cũ ("track trên
//      áp xuống") đã bị thay trong lúc U5 chạy — xem ghi chú song song.
//   §3. PENDING (in ra, không assert): scope track phía render, hội tụ
//      luật scope R4/scopeTracks, remap layer của subSpec phía render.
//
// LƯU Ý VỀ CHẠY SONG SONG (trung thực): bản đầu của file này viết §1.1/
// §1.2/§1.5 theo hành vi TRƯỚC đợt 7 (subSpec không nhận diện, trim bị bỏ,
// adjustmentLayers bị bỏ qua). Trong lúc U5 chạy, luồng U3 đã đẩy normalize
// (normalizeNestedClip + convertCanonicalLayer) vào nestedPreview.ts nên
// 3 assert đó fail — KHÔNG phải do code U5 sai mà do code đích đổi giữa
// chừng. U5 đã probe lại hành vi mới bằng script độc lập (subSpec phẳng
// đúng, trim cho 11/4, adjustmentLayers gộp đoạn) rồi mới sửa §1 thành
// assert theo hành vi mới đã kiểm chứng. Không sửa code của luồng khác.
import assert from "node:assert/strict";
import {
  adjustmentAppliesToClip,
  applyAdjustmentPreview,
  buildPreviewSpec,
  flattenForPreview,
  isNestedClip,
  type AdjustmentWindow,
  type LeafClipInput,
} from "./nestedPreview.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
function pend(name: string, detail: string): void {
  console.log(`  ⏳ PENDING (không tính là pass): ${name} — ${detail}`);
}

function video(
  id: string,
  start: number,
  duration: number,
  extra: Record<string, unknown> = {},
): LeafClipInput {
  return {
    kind: "video", id, start, duration, in: 0, out: duration, ...extra,
  } as LeafClipInput;
}
/** Đọc filter của 1 clip bất kể kiểu Clip của video-spec. */
function filt(c: unknown): Record<string, unknown> | undefined {
  const f = (c as Record<string, unknown>)["filter"];
  return f && typeof f === "object" ? (f as Record<string, unknown>) : undefined;
}
function colorOf(c: unknown): Record<string, unknown> | undefined {
  const f = filt(c);
  const col = f?.["color"];
  return col && typeof col === "object" ? (col as Record<string, unknown>) : undefined;
}
type PreviewSpecParam = Parameters<typeof buildPreviewSpec>[0];
const asSpec = (s: unknown): PreviewSpecParam => s as PreviewSpecParam;

console.log("== §1. Normalize / unify — phía preview (PROVEN) ==");
ok("1.1 clip nested dạng chuẩn (subSpec) được preview nhận diện VÀ phẳng đúng", () => {
  const renderStyle = {
    kind: "nested", id: "n1", start: 0, duration: 2,
    subSpec: { tracks: [{ kind: "video", clips: [video("leaf", 0, 2)] }] },
  };
  assert.equal(isNestedClip(renderStyle), true);
  const r = flattenForPreview({
    tracks: [{ kind: "video", clips: [renderStyle] }],
  });
  assert.equal(r.clips.length, 1);
  assert.deepEqual(r.clips[0].nestedPath, ["n1"]);
  assert.equal(r.clips[0].sourceId, "leaf");
  assert.equal(r.clips[0].outerStart, 0);
  assert.equal(r.clips[0].outerDuration, 2);
  assert.deepEqual(r.skipped, []);
});

ok("1.2 preview ĐỌC trim { in, out } của nested clip (khớp render)", () => {
  // trim in=2: inner clip 3-7 giao cửa sổ [2,7) -> ngoài 11-15
  // (start 11, duration 4) — đúng ngữ nghĩa render (nested.js).
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "n1", start: 10, duration: 5,
        trim: { in: 2, out: 7 },
        tracks: [{ kind: "video", clips: [video("inner", 3, 4)] }],
      }],
    }],
  });
  assert.equal(r.clips.length, 1);
  assert.equal(r.clips[0].outerStart, 11);
  assert.equal(r.clips[0].outerDuration, 4);
});

ok("1.3 adjustment không có thông tin track -> fallback legacy áp mọi clip", () => {
  assert.equal(
    adjustmentAppliesToClip({}, { nestedPath: [], trackStack: [0] }),
    true,
  );
  assert.equal(
    adjustmentAppliesToClip(
      { nestedPath: [] },
      { nestedPath: ["n1"], trackStack: [0, 0] },
    ),
    true,
  );
});

ok("1.4 layer dạng danh sách spec (field `filters` mảng) không được preview đọc", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "adjustment",
      clips: [{
        kind: "adjustment", id: "adj", start: 1, duration: 2,
        filters: [{ color: { brightness: 60 } }],
      }],
    }],
  });
  assert.equal(r.adjustments.length, 1);
  assert.equal(r.adjustments[0].filter, undefined);
  assert.equal(r.adjustments[0].effects, undefined);
});

ok("1.5 spec.adjustmentLayers (cấp project) ĐƯỢC buildPreviewSpec gộp vào clip", () => {
  const clip = video("c1", 0, 6);
  const input = {
    version: "0.2.0",
    meta: { name: "u5", width: 320, height: 240, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [clip] }],
    adjustmentLayers: [{
      id: "adj", start: 2, duration: 2,
      filters: [{ color: { brightness: 60 } }],
    }],
  };
  const out = buildPreviewSpec(asSpec(input));
  // Không còn trả object cũ: clip bị cắt thành 3 đoạn, đoạn giữa gộp filter.
  assert.notEqual(out, input as unknown);
  const vTrack = out.tracks.find((t) => t.id === "v1");
  assert.ok(vTrack);
  assert.equal(vTrack.clips.length, 3);
  const mid = vTrack.clips[1] as unknown;
  assert.equal((mid as { start: number }).start, 2);
  assert.equal((mid as { duration: number }).duration, 2);
  assert.equal(colorOf(mid)?.["brightness"], 60);
  assert.equal(colorOf(vTrack.clips[0]), undefined);
  assert.equal(colorOf(vTrack.clips[2]), undefined);
});

console.log("== §2. Scope chuẩn scopeTracks của preview (U3, PROVEN) ==");
// Luật hiện tại (đã thay luật R4 \"track trên áp xuống\" trong lúc U5
// chạy — xem ghi chú chạy song song ở đầu file): layer chỉ áp khi
// (a) nestedPath của layer là tiền tố của nestedPath clip, và
// (b) scopeTracks vắng (= mọi track) hoặc chứa track của clip ở đúng
// level đó (trackStack[level]). trackIndex/trackStack chỉ còn là
// provenance, KHÔNG dùng để xét áp nữa.
ok("2.1 không scope -> áp mọi track; scope liệt kê -> chỉ áp track trong danh sách", () => {
  const clip = { nestedPath: [], trackStack: [0] };
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [] }, clip), true);
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], trackStack: [1] }, clip), true);
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], scopeTracks: [0] }, clip), true);
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], scopeTracks: [1] }, clip), false);
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], scopeTracks: [] }, clip), false);
  assert.equal(
    adjustmentAppliesToClip(
      { nestedPath: [], scopeTracks: [0, 2] },
      { nestedPath: [], trackStack: [2] }), true);
});

ok("2.2 layer tầng ngoài xét track tầng ngoài của leaf trong nested", () => {
  const leaf = { nestedPath: ["n1"], trackStack: [1, 0] };
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [] }, leaf), true);
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], scopeTracks: [1] }, leaf), true);
  assert.equal(
    adjustmentAppliesToClip({ nestedPath: [], scopeTracks: [0] }, leaf), false);
});

ok("2.3 layer trong nested KHÔNG áp cho clip tầng ngoài", () => {
  assert.equal(
    adjustmentAppliesToClip(
      { nestedPath: ["n1"], scopeTracks: [0] },
      { nestedPath: [], trackStack: [0] }), false);
});

ok("2.4 trackIndex/trackStack cũ bị bỏ qua; scopeTracks sai thì throw", () => {
  // Provenance-only: trackIndex/trackStack không còn quyết định gì.
  assert.equal(
    adjustmentAppliesToClip(
      { nestedPath: [], trackIndex: 1, trackStack: [1] },
      { nestedPath: [], trackStack: [0] }), true);
  assert.throws(
    () => adjustmentAppliesToClip(
      { nestedPath: [], scopeTracks: [1.5] },
      { nestedPath: [], trackStack: [0] }),
    /scopeTracks/,
  );
  assert.throws(
    () => adjustmentAppliesToClip(
      { nestedPath: [], scopeTracks: "0" as unknown as number[] },
      { nestedPath: [], trackStack: [0] }),
    /scopeTracks/,
  );
});

ok("2.5 adjustment trong nested được remap về timeline ngoài (preview)", () => {
  const r = flattenForPreview({
    tracks: [{
      kind: "video",
      clips: [{
        kind: "nested", id: "n1", start: 10, duration: 5, in: 0,
        tracks: [
          { kind: "video", clips: [video("inner", 0, 5)] },
          {
            kind: "adjustment",
            clips: [{
              kind: "adjustment", id: "adj-in", start: 1, duration: 2,
              filter: { color: { brightness: 60 } },
            }],
          },
        ],
      }],
    }],
  });
  assert.equal(r.adjustments.length, 1);
  assert.equal(r.adjustments[0].start, 11);
  assert.equal(r.adjustments[0].duration, 2);
  assert.deepEqual(r.adjustments[0].nestedPath, ["n1"]);
  assert.deepEqual(r.adjustments[0].trackStack, [0, 1]);
  assert.equal(r.clips.length, 1);
  assert.equal(r.clips[0].outerStart, 10);
});

ok("2.6 applyAdjustmentPreview có scopeTracks: trong danh sách -> active, ngoài -> inactive", () => {
  const layerIn: AdjustmentWindow = {
    id: "adj", start: 2, duration: 2,
    filter: { color: { brightness: 60 } }, scopeTracks: [0],
  };
  const layerOut: AdjustmentWindow = { ...layerIn, scopeTracks: [1] };
  const layerAny: AdjustmentWindow = { ...layerIn, scopeTracks: undefined };
  const clip = video("c1", 0, 6);
  const scope = { nestedPath: [], trackStack: [0] };
  const on = applyAdjustmentPreview(clip, [layerIn], 3, scope);
  assert.equal(on.adjustmentActive, true);
  assert.deepEqual(on.activeLayerIds, ["adj"]);
  assert.equal(on.color?.brightness, 60);
  const off = applyAdjustmentPreview(clip, [layerOut], 3, scope);
  assert.equal(off.adjustmentActive, false);
  assert.deepEqual(off.activeLayerIds, []);
  const any = applyAdjustmentPreview(clip, [layerAny], 3, scope);
  assert.equal(any.adjustmentActive, true);
  // Không truyền scope -> mọi layer chồng thời gian đều áp (hành vi cũ).
  const legacy = applyAdjustmentPreview(clip, [layerOut], 3);
  assert.equal(legacy.adjustmentActive, true);
});

ok("2.7 buildPreviewSpec: layer adjustment-track áp clip bất kể thứ tự track", () => {
  // Luật scopeTracks (vắng scope = mọi track): thứ tự track không còn
  // quyết định như luật R4 cũ — cả 2 thứ tự đều cắt+gộp như nhau.
  const mk = (tracks: unknown[]) => buildPreviewSpec(asSpec({
    version: "0.2.0",
    meta: { name: "u5", width: 320, height: 240, fps: 30 },
    tracks,
  }));
  const adjTrack = {
    id: "adj1", kind: "adjustment",
    clips: [{
      kind: "adjustment", id: "adj", start: 2, duration: 2,
      filter: { color: { brightness: 60 } },
    }],
  };
  const vidTrack = { id: "v1", kind: "video", clips: [video("c1", 0, 6)] };
  for (const order of [[vidTrack, adjTrack], [adjTrack, vidTrack]]) {
    const out = mk(order);
    const vTrack = out.tracks.find((t) => t.id === "v1");
    assert.ok(vTrack);
    assert.equal(vTrack.clips.length, 3);
    const mid = vTrack.clips[1] as unknown;
    assert.equal((mid as { start: number }).start, 2);
    assert.equal((mid as { duration: number }).duration, 2);
    assert.equal(colorOf(mid)?.["brightness"], 60);
    assert.equal(out.tracks.some((t) => t.id === "adj1"), false);
  }
});

console.log("== §3. PENDING (không assert, chỉ ghi nhận cho đợt 7 khớp sau) ==");
pend("đối chiếu liên phía: không gian chỉ số scope preview vs render",
  "preview scopeTracks là chỉ số theo LEVEL chứa layer, render tracks là " +
  "chỉ số theo SPEC PHẲNG cuối (E2E case A1/J đã chứng minh từng phía " +
  "riêng lẻ: preview remap §2.5, render remap + scope pixel case D/J). " +
  "Hai không gian chỉ trùng nhau khi không có nested — cần một test liên " +
  "phía (cùng project, đo cả preview-spec lẫn render) để khẳng định " +
  "scope của layer trong subSpec cho cùng một tập track lá");
pend("ducking vào project con + opacity+src kèm subSpec (nợ R6)",
  "ngoài phạm vi file này: theo brief đợt 7, 2 case đó vẫn là nợ mở, " +
  "không được claim ở đây");

console.log(`\n== KẾT QUẢ: ${pass} PROVEN pass (PENDING không tính) ==`);

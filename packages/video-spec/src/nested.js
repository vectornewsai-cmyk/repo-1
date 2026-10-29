/**
 * nested.js — JS mirror của nested.ts (xem DEVELOPER.md §4: mỗi domain ship
 * cả TS module và JS mirror để render worker zero-dependency require() được).
 * Mirror này được viết tay và giữ khớp với nested.ts; khi sửa nested.ts
 * phải sửa mirror tương ứng (không có bước build tự động cho video-spec).
 *
 * Nested sequence / compound clip (Phase 9, luồng N1: SPEC): một clip chứa
 * một VideoSpec con, có trim in/out riêng và tốc độ riêng, dùng lại được
 * nhiều lần. Xem nested.ts để đọc đầy đủ quy ước thời gian và giới hạn.
 *
 * ĐỢT 7 (Phase 9 round 7, luồng U1): mirror này bổ sung normalizeNestedClip
 * viết tay, khớp logic normalizeNestedClip() trong nested.ts (shape cũ
 * tracks trực tiếp → shape chuẩn subSpec; fail fast khi cả hai cùng có mà
 * khác nhau; không bịa meta). Xem nested.ts và U1_LIMITS.md.
 *
 * ĐỢT 20 R3: mirror thêm validateNestedSpeedCurveShape + nhánh curve trong
 * validateNestedRec (duration là thời gian output, trim.out = in + ∫curve),
 * khớp nested.ts; import runtime duy nhất là speedcurve.js (không vòng lặp:
 * speedcurve.js không import gì).
 */

import {
  integrateSpeed,
  normalizeSpeedKeyframes,
} from "./speedcurve.js";

/** Độ sâu lồng nhau tối đa (clip nested ngoài cùng = tầng 1). */
export const MAX_NESTED_DEPTH = 8;

/** Dải tốc độ cho phép của nested clip (giống VideoClip.speed). */
export const NESTED_MIN_SPEED = 0.25;
export const NESTED_MAX_SPEED = 4;

/** Sai số chấp nhận khi so duration với nestedDuration() (giây). */
export const NESTED_DURATION_EPSILON = 1e-6;

function isRecord(v) {
  return typeof v === "object" && v !== null;
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/** Guard nông: object có kind "nested" (validate đầy đủ bằng validateNestedClip). */
export function isNestedClip(v) {
  return isRecord(v) && v["kind"] === "nested";
}

/**
 * Độ dài timeline của một VideoSpec = clip kết thúc muộn nhất
 * (cùng định nghĩa với projectDuration() ở index.ts, viết lại tại đây để
 * tránh import runtime vòng tròn).
 */
export function nestedSourceDuration(subSpec) {
  let max = 0;
  for (const t of subSpec.tracks) {
    for (const c of t.clips) {
      const end = c.start + c.duration;
      if (Number.isFinite(end)) max = Math.max(max, end);
    }
  }
  return max;
}

/** Tốc độ hiệu dụng của nested clip (mặc định 1). */
export function nestedEffectiveSpeed(clip) {
  return clip.speed ?? 1;
}

/** Cửa sổ trim hiệu dụng (mặc định phát toàn bộ subSpec). */
export function nestedEffectiveTrim(clip) {
  return clip.trim ?? { in: 0, out: nestedSourceDuration(clip.subSpec) };
}

/**
 * Độ dài hiển thị của nested clip = (trim.out − trim.in) / speed.
 * Hàm thuần, KHÔNG throw: gọi trên clip chưa validate có thể trả Infinity
 * (speed = 0) hoặc NaN — caller phải validateNestedClip() trước.
 */
export function nestedDuration(clip) {
  const trim = nestedEffectiveTrim(clip);
  return (trim.out - trim.in) / nestedEffectiveSpeed(clip);
}

/**
 * Validate một nested clip (kể cả đệ quy toàn bộ subSpec của nó).
 * Trả về danh sách lỗi (rỗng = hợp lệ). KHÔNG throw với input xấu.
 * Xem nested.ts để đọc đầy đủ danh sách kiểm tra và giới hạn.
 */
/**
 * Đợt 20 R3: validate hình dạng speedKeyframes của nested clip theo đúng
 * luật validator clip ramp thường (render đợt 18 §1.2) — mirror của
 * validateNestedSpeedCurveShape() trong nested.ts. Trả về danh sách lỗi.
 */
function validateNestedSpeedCurveShape(curve, duration, label) {
  const where = `${label}.speedKeyframes`;
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    return [`${where} phải là object { keyframes: [...] }`];
  }
  const arr = curve["keyframes"];
  if (arr.length === 0) {
    return [`${where}.keyframes: mảng rỗng — cần ít nhất 1 keyframe`];
  }
  if (arr.length > 128) {
    return [`${where}.keyframes: quá 128 keyframe`];
  }
  const errors = [];
  const EASINGS = ["linear", "ease-in", "ease-out", "bezier"];
  for (let i = 0; i < arr.length; i++) {
    const kf = arr[i];
    const w = `${where}.keyframes[${i}]`;
    if (!isRecord(kf)) {
      errors.push(`${w} phải là object { t, v, easing }`);
      continue;
    }
    const t = kf["t"];
    const v = kf["v"];
    const easing = kf["easing"];
    if (
      typeof t !== "number" || !Number.isFinite(t) || t < 0 ||
      (isFiniteNumber(duration) && t > duration + 1e-6)
    ) {
      errors.push(`${w}.t phải trong [0, ${duration}] (nhận được: ${JSON.stringify(t)})`);
    }
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0.25 || v > 4) {
      errors.push(`${w}.v phải trong 0.25..4 (nhận được: ${JSON.stringify(v)})`);
    }
    if (typeof easing !== "string" || !EASINGS.includes(easing)) {
      errors.push(`${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(easing)})`);
    }
    if (easing === "bezier") {
      const b = kf["bezier"];
      if (
        !Array.isArray(b) || b.length !== 4 ||
        !b.every((x) => typeof x === "number" && Number.isFinite(x)) ||
        b[0] < 0 || b[0] > 1 ||
        b[2] < 0 || b[2] > 1
      ) {
        errors.push(`${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do`);
      }
    }
  }
  return errors;
}

export function validateNestedClip(clip) {
  return validateNestedRec(clip, 1, new Set(), "nested clip");
}

function validateNestedRec(clip, depth, ancestors, label) {
  if (!isRecord(clip) || clip["kind"] !== "nested") {
    return [`${label} phải là nested clip (kind "nested")`];
  }
  const errors = [];
  const rec = clip;
  const id = rec["id"];
  const idLabel =
    typeof id === "string" && id.trim() !== "" ? `nested clip "${id}"` : label;

  if (typeof id !== "string" || id.trim() === "") {
    errors.push(`${label}.id phải là chuỗi không rỗng`);
  }
  if (rec["name"] !== undefined && typeof rec["name"] !== "string") {
    errors.push(`${idLabel}.name phải là chuỗi`);
  }
  if (!isFiniteNumber(rec["start"]) || rec["start"] < 0) {
    errors.push(`${idLabel}.start phải là số >= 0`);
  }
  if (!isFiniteNumber(rec["duration"]) || rec["duration"] <= 0) {
    errors.push(`${idLabel}.duration phải là số > 0`);
  }
  const speed = rec["speed"];
  if (
    speed !== undefined &&
    (!isFiniteNumber(speed) ||
      speed < NESTED_MIN_SPEED ||
      speed > NESTED_MAX_SPEED)
  ) {
    errors.push(
      `${idLabel}.speed phải trong [${NESTED_MIN_SPEED}, ${NESTED_MAX_SPEED}]`,
    );
  }

  const subSpec = rec["subSpec"];
  if (!isRecord(subSpec)) {
    errors.push(`${idLabel}.subSpec phải là một VideoSpec`);
    return errors;
  }
  const meta = subSpec["meta"];
  if (!isRecord(meta)) {
    errors.push(`${idLabel}.subSpec.meta phải là một object`);
    return errors;
  }
  for (const f of ["width", "height", "fps"]) {
    if (!isFiniteNumber(meta[f]) || meta[f] <= 0) {
      errors.push(`${idLabel}.subSpec.meta.${f} phải là số > 0`);
    }
  }
  const tracks = subSpec["tracks"];
  if (!Array.isArray(tracks)) {
    errors.push(`${idLabel}.subSpec.tracks phải là một mảng`);
    return errors;
  }

  if (depth > MAX_NESTED_DEPTH) {
    errors.push(`${idLabel} vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH}`);
    return errors;
  }
  if (ancestors.has(subSpec)) {
    errors.push(`${idLabel} tạo vòng lặp tham chiếu subSpec (đã có trong chuỗi tổ tiên)`);
    return errors;
  }

  const sourceDuration = nestedSourceDuration(subSpec);
  // Đợt 20 R3: validate curve TRƯỚC khối trim/duration — mirror nested.ts.
  const curveRaw = rec["speedKeyframes"];
  let curveInfo = null;
  if (curveRaw !== undefined) {
    const shapeErrors = validateNestedSpeedCurveShape(
      curveRaw,
      rec["duration"],
      idLabel,
    );
    errors.push(...shapeErrors);
    if (shapeErrors.length === 0 && isFiniteNumber(rec["duration"])) {
      const norm = normalizeSpeedKeyframes(curveRaw["keyframes"]);
      const isConstant = norm.every((k) => Math.abs(k.v - norm[0].v) <= 1e-12);
      curveInfo = {
        isConstant,
        constantV: norm[0].v,
        totalConsumed: integrateSpeed({ keyframes: norm }, 0, rec["duration"]),
      };
    }
  }
  const trim = rec["trim"];
  if (trim !== undefined) {
    if (!isRecord(trim)) {
      errors.push(`${idLabel}.trim phải là một object { in, out }`);
    } else {
      if (!isFiniteNumber(trim["in"]) || trim["in"] < 0) {
        errors.push(`${idLabel}.trim.in phải là số >= 0`);
      }
      if (
        !isFiniteNumber(trim["out"]) ||
        trim["out"] <= (isFiniteNumber(trim["in"]) ? trim["in"] : 0)
      ) {
        errors.push(`${idLabel}.trim.out phải là số > trim.in`);
      } else if (trim["out"] > sourceDuration + NESTED_DURATION_EPSILON) {
        errors.push(
          `${idLabel}.trim.out (${trim["out"]}) vượt quá độ dài subSpec (${sourceDuration})`,
        );
      }
    }
  }
  if (isFiniteNumber(rec["duration"])) {
    if (curveInfo !== null) {
      // Nhánh curve: trim.out (nếu ghi đủ in/out hữu hạn và out > in)
      // phải khớp in + ∫curve (render đợt 18 §1.3).
      if (
        isRecord(trim) &&
        isFiniteNumber(trim["in"]) &&
        isFiniteNumber(trim["out"]) &&
        trim["out"] > trim["in"]
      ) {
        const expectedOut = curveInfo.isConstant
          ? trim["in"] + rec["duration"] * curveInfo.constantV
          : trim["in"] + curveInfo.totalConsumed;
        const tol = curveInfo.isConstant ? NESTED_DURATION_EPSILON : 1e-4;
        if (Math.abs(trim["out"] - expectedOut) > tol) {
          errors.push(
            `${idLabel}.trim.out (${trim["out"]}) không khớp trim.in + ` +
              (curveInfo.isConstant
                ? `duration × ${curveInfo.constantV}`
                : `∫speedKeyframes trên duration`) +
              ` = ${expectedOut} (nested mang speedKeyframes: duration là thời gian output, xem render đợt 18 §1.3)`,
          );
        }
      }
      // Không trim → không kiểm tra gì thêm.
    } else if (curveRaw === undefined) {
      const expected = nestedDuration(clip);
      if (
        Number.isFinite(expected) &&
        Math.abs(rec["duration"] - expected) > NESTED_DURATION_EPSILON
      ) {
        errors.push(
          `${idLabel}.duration (${rec["duration"]}) không khớp (trim.out − trim.in) / speed = ${expected}`,
        );
      }
    }
    // curveRaw có mặt nhưng shape lỗi → đã báo lỗi shape ở trên.
  }
  if (sourceDuration <= 0) {
    errors.push(`${idLabel}.subSpec rỗng (không có clip nào, độ dài = 0)`);
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(subSpec);
  tracks.forEach((track, ti) => {
    if (!isRecord(track) || !Array.isArray(track["clips"])) {
      errors.push(`${idLabel}.subSpec.tracks[${ti}].clips phải là một mảng`);
      return;
    }
    track["clips"].forEach((child, ci) => {
      const childLabel = `${idLabel}.subSpec.tracks[${ti}].clips[${ci}]`;
      if (!isRecord(child) || typeof child["kind"] !== "string") {
        errors.push(`${childLabel} phải là một clip có kind`);
        return;
      }
      if (
        !isFiniteNumber(child["start"]) ||
        child["start"] < 0 ||
        !isFiniteNumber(child["duration"]) ||
        child["duration"] <= 0
      ) {
        errors.push(`${childLabel} phải có start >= 0 và duration > 0`);
      }
      if (child["kind"] === "nested") {
        if (depth + 1 > MAX_NESTED_DEPTH) {
          errors.push(
            `${childLabel} vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH}`,
          );
        } else {
          errors.push(
            ...validateNestedRec(child, depth + 1, nextAncestors, childLabel),
          );
        }
      }
    });
  });
  return errors;
}

/**
 * Mở phẳng một nested clip thành danh sách clip lá kèm vị trí tuyệt đối
 * trên timeline NGOÀI. Fail fast (throw Error) khi input không phải nested
 * clip, speed/trim không hợp lệ, độ sâu vượt 8, hoặc vòng lặp tham chiếu.
 * Clip lá bị trim ngoài cắt hết thì bị bỏ (không có entry).
 * Xem nested.ts / FlatClip: hàm này KHÔNG viết lại nội dung clip lá.
 */
export function flattenNested(clip) {
  if (!isNestedClip(clip)) {
    throw new Error("flattenNested: clip phải là nested clip (kind \"nested\")");
  }
  const speed = nestedEffectiveSpeed(clip);
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new Error(`flattenNested: speed không hợp lệ (${String(clip.speed)})`);
  }
  const trim = nestedEffectiveTrim(clip);
  if (!Number.isFinite(trim.in) || !Number.isFinite(trim.out) || trim.out <= trim.in) {
    throw new Error(
      `flattenNested: trim không hợp lệ (in=${trim.in}, out=${trim.out})`,
    );
  }
  if (!Array.isArray(clip.subSpec["tracks"])) {
    throw new Error("flattenNested: subSpec.tracks phải là một mảng");
  }
  const out = [];
  flattenInto(
    clip,
    clip.start,
    trim.in,
    1 / speed,
    trim.in,
    trim.out,
    1,
    new Set(),
    [],
    out,
  );
  return out;
}

function flattenInto(
  nested,
  mapP,
  mapQ,
  mapK,
  winLo,
  winHi,
  depth,
  ancestors,
  path,
  out,
) {
  if (depth > MAX_NESTED_DEPTH) {
    throw new Error(
      `flattenNested: vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH} tại nested clip "${nested.id}"`,
    );
  }
  if (ancestors.has(nested.subSpec)) {
    throw new Error(
      `flattenNested: vòng lặp tham chiếu subSpec tại nested clip "${nested.id}"`,
    );
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(nested.subSpec);
  const leafPath = [...path, nested.id];

  for (const track of nested.subSpec.tracks) {
    if (!track || !Array.isArray(track.clips)) continue;
    for (const child of track.clips) {
      if (!isRecord(child) || typeof child.kind !== "string") {
        throw new Error(
          `flattenNested: clip con không hợp lệ trong subSpec của "${nested.id}"`,
        );
      }
      if (!Number.isFinite(child.start) || !Number.isFinite(child.duration)) {
        throw new Error(
          `flattenNested: clip "${child.id}" có start/duration không hữu hạn`,
        );
      }
      const childStart = child.start;
      const childEnd = child.start + child.duration;
      const visStart = Math.max(childStart, winLo);
      const visEnd = Math.min(childEnd, winHi);
      if (visEnd <= visStart) continue; // bị trim ngoài cắt hết → bỏ

      if (isNestedClip(child)) {
        const childSpeed = nestedEffectiveSpeed(child);
        if (!Number.isFinite(childSpeed) || childSpeed <= 0) {
          throw new Error(
            `flattenNested: nested clip con "${child.id}" có speed không hợp lệ`,
          );
        }
        const childTrim = nestedEffectiveTrim(child);
        if (
          !Number.isFinite(childTrim.in) ||
          !Number.isFinite(childTrim.out) ||
          childTrim.out <= childTrim.in
        ) {
          throw new Error(
            `flattenNested: nested clip con "${child.id}" có trim không hợp lệ`,
          );
        }
        const winLoPrime = Math.max(
          childTrim.in,
          childTrim.in + (visStart - childStart) * childSpeed,
        );
        const winHiPrime = Math.min(
          childTrim.out,
          childTrim.in + (visEnd - childStart) * childSpeed,
        );
        if (winHiPrime <= winLoPrime) continue;
        flattenInto(
          child,
          mapP + (childStart - mapQ) * mapK,
          childTrim.in,
          mapK / childSpeed,
          winLoPrime,
          winHiPrime,
          depth + 1,
          nextAncestors,
          leafPath,
          out,
        );
      } else {
        out.push({
          clip: child,
          absoluteStart: mapP + (visStart - mapQ) * mapK,
          absoluteDuration: (visEnd - visStart) * mapK,
          path: leafPath,
          depth,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Đợt 15 T3 — composeNestedLeafWindow: hợp cửa sổ đệ quy cho 1 clip lá sâu
// (mirror của nested.ts — giữ đồng bộ tay, xem header file).
// ---------------------------------------------------------------------------

function findChildInSubSpec(subSpec, id) {
  if (!Array.isArray(subSpec.tracks)) return undefined;
  for (const track of subSpec.tracks) {
    if (!track || !Array.isArray(track.clips)) continue;
    for (const c of track.clips) {
      if (c.id === id) return c;
    }
  }
  return undefined;
}

export function composeNestedLeafWindow(top, chain, leaf) {
  if (!isNestedClip(top)) {
    throw new Error("composeNestedLeafWindow: top phải là nested clip (kind \"nested\")");
  }
  if (!Array.isArray(chain)) {
    throw new Error("composeNestedLeafWindow: chain phải là một mảng");
  }
  const topSpeed = nestedEffectiveSpeed(top);
  if (!Number.isFinite(topSpeed) || topSpeed <= 0) {
    throw new Error(`composeNestedLeafWindow: top speed không hợp lệ (${String(top.speed)})`);
  }
  const topTrim = nestedEffectiveTrim(top);
  if (!Number.isFinite(topTrim.in) || !Number.isFinite(topTrim.out) || topTrim.out <= topTrim.in) {
    throw new Error(
      `composeNestedLeafWindow: top trim không hợp lệ (in=${topTrim.in}, out=${topTrim.out})`,
    );
  }
  if (!Array.isArray(top.subSpec.tracks)) {
    throw new Error("composeNestedLeafWindow: top.subSpec.tracks phải là một mảng");
  }
  if (!isRecord(leaf) || typeof leaf.kind !== "string") {
    throw new Error("composeNestedLeafWindow: leaf phải là một clip có kind");
  }
  if (!Number.isFinite(leaf.start) || !Number.isFinite(leaf.duration)) {
    throw new Error("composeNestedLeafWindow: leaf có start/duration không hữu hạn");
  }

  const ancestors = new Set();
  ancestors.add(top.subSpec);
  let curSpec = top.subSpec;
  let mapP = top.start;
  let mapQ = topTrim.in;
  let mapK = 1 / topSpeed;
  let winLo = topTrim.in;
  let winHi = topTrim.out;
  let depth = 1;
  const path = [top.id];

  for (const step of chain) {
    if (depth + 1 > MAX_NESTED_DEPTH) {
      throw new Error(
        `composeNestedLeafWindow: vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH} tại nested clip "${step.id}"`,
      );
    }
    const found = findChildInSubSpec(curSpec, step.id);
    if (!found || !isNestedClip(found)) {
      throw new Error(
        `composeNestedLeafWindow: chain không khớp cây — không tìm thấy nested clip "${step.id}" trong tầng hiện tại`,
      );
    }
    const m = found;
    if (ancestors.has(m.subSpec)) {
      throw new Error(
        `composeNestedLeafWindow: vòng lặp tham chiếu subSpec tại nested clip "${m.id}"`,
      );
    }
    const mSpeed = nestedEffectiveSpeed(m);
    if (!Number.isFinite(mSpeed) || mSpeed <= 0) {
      throw new Error(
        `composeNestedLeafWindow: nested clip "${m.id}" có speed không hợp lệ`,
      );
    }
    const mTrim = nestedEffectiveTrim(m);
    if (!Number.isFinite(mTrim.in) || !Number.isFinite(mTrim.out) || mTrim.out <= mTrim.in) {
      throw new Error(
        `composeNestedLeafWindow: nested clip "${m.id}" có trim không hợp lệ`,
      );
    }
    if (!Number.isFinite(m.start) || !Number.isFinite(m.duration)) {
      throw new Error(
        `composeNestedLeafWindow: nested clip "${m.id}" có start/duration không hữu hạn`,
      );
    }
    const visStart = Math.max(m.start, winLo);
    const visEnd = Math.min(m.start + m.duration, winHi);
    if (visEnd <= visStart) return null;
    const winLoPrime = Math.max(mTrim.in, mTrim.in + (visStart - m.start) * mSpeed);
    const winHiPrime = Math.min(mTrim.out, mTrim.in + (visEnd - m.start) * mSpeed);
    if (winHiPrime <= winLoPrime) return null;
    mapP = mapP + (m.start - mapQ) * mapK;
    mapQ = mTrim.in;
    mapK = mapK / mSpeed;
    winLo = winLoPrime;
    winHi = winHiPrime;
    ancestors.add(m.subSpec);
    curSpec = m.subSpec;
    depth += 1;
    path.push(m.id);
  }

  const foundLeaf = findChildInSubSpec(curSpec, leaf.id);
  if (!foundLeaf) {
    throw new Error(
      `composeNestedLeafWindow: không tìm thấy clip lá "${leaf.id}" trong tầng chứa nó`,
    );
  }
  if (isNestedClip(foundLeaf)) {
    throw new Error(
      `composeNestedLeafWindow: "${leaf.id}" là nested clip, không phải clip lá`,
    );
  }
  const leafStart = foundLeaf.start;
  const leafEnd = leafStart + foundLeaf.duration;
  const visStart = Math.max(leafStart, winLo);
  const visEnd = Math.min(leafEnd, winHi);
  if (visEnd <= visStart) return null;
  return {
    visibleStart: visStart - leafStart,
    visibleEnd: visEnd - leafStart,
    absoluteStart: mapP + (visStart - mapQ) * mapK,
    absoluteDuration: (visEnd - visStart) * mapK,
    path,
    depth,
    cumulativeSpeed: 1 / mapK,
  };
}

// ---------------------------------------------------------------------------
// Đợt 7 — normalizeNestedClip: shape cũ (tracks trực tiếp) → shape chuẩn.
// Logic khớp nested.ts (viết tay, không qua tsc — xem header file).
// ---------------------------------------------------------------------------

function normalizeDeepEqual(a, b) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return null;
  }
}

function normalizeMetaOf(rec, opts) {
  if (opts.meta !== undefined) return opts.meta;
  const m = rec["meta"];
  if (
    isRecord(m) &&
    typeof m["name"] === "string" &&
    isFiniteNumber(m["width"]) &&
    isFiniteNumber(m["height"]) &&
    isFiniteNumber(m["fps"])
  ) {
    return m;
  }
  return null;
}

/**
 * Chuẩn hoá một nested clip (cũ hoặc chuẩn) về shape NestedClip mang
 * subSpec. Xem nested.ts để đọc đầy đủ quy tắc và giới hạn. Không throw
 * với input xấu — mọi lỗi trả { ok: false, reason }.
 */
export function normalizeNestedClip(clip, opts = {}) {
  return normalizeNestedRec(clip, opts, new Set(), "nested clip");
}

function normalizeNestedRec(clip, opts, ancestors, label) {
  if (!isRecord(clip) || clip["kind"] !== "nested") {
    return { ok: false, reason: `${label} phải là nested clip (kind "nested")` };
  }
  const id = clip["id"];
  if (typeof id !== "string" || id.trim() === "") {
    return { ok: false, reason: `${label}.id phải là chuỗi không rỗng` };
  }
  if (!isFiniteNumber(clip["start"]) || clip["start"] < 0) {
    return { ok: false, reason: `${label}.start phải là số >= 0` };
  }
  if (!isFiniteNumber(clip["duration"]) || clip["duration"] <= 0) {
    return { ok: false, reason: `${label}.duration phải là số > 0` };
  }
  const speedRaw = clip["speed"];
  if (
    speedRaw !== undefined &&
    (!isFiniteNumber(speedRaw) || speedRaw <= 0)
  ) {
    return { ok: false, reason: `${label}.speed phải là số > 0` };
  }

  const hasSubSpec = isRecord(clip["subSpec"]);
  const hasTracks = Array.isArray(clip["tracks"]);
  if (!hasSubSpec && !hasTracks) {
    return {
      ok: false,
      reason: `${label} không có subSpec cũng không có tracks — không biết sequence con ở đâu`,
    };
  }

  const warnings = [];
  let rawTracks;
  let subSpecBase = null;

  if (hasSubSpec && hasTracks) {
    const subTracks = clip["subSpec"]["tracks"];
    if (!Array.isArray(subTracks)) {
      return {
        ok: false,
        reason: `${label}.subSpec.tracks phải là một mảng (để so với tracks trực tiếp)`,
      };
    }
    const eq = normalizeDeepEqual(subTracks, clip["tracks"]);
    if (eq === null) {
      return {
        ok: false,
        reason: `${label} có cả subSpec.tracks và tracks nhưng không so sánh được (tham chiếu vòng?) — fail fast, không tự chọn`,
      };
    }
    if (!eq) {
      return {
        ok: false,
        reason: `${label} có cả subSpec.tracks và tracks mà nội dung khác nhau — fail fast, không tự chọn một bên`,
      };
    }
    warnings.push(`${label}: bỏ field tracks trùng lặp với subSpec.tracks, giữ subSpec`);
    rawTracks = subTracks;
    subSpecBase = clip["subSpec"];
  } else if (hasSubSpec) {
    const subTracks = clip["subSpec"]["tracks"];
    if (!Array.isArray(subTracks)) {
      return { ok: false, reason: `${label}.subSpec.tracks phải là một mảng` };
    }
    rawTracks = subTracks;
    subSpecBase = clip["subSpec"];
  } else {
    rawTracks = clip["tracks"];
  }

  if (ancestors.has(rawTracks)) {
    return {
      ok: false,
      reason: `${label} tạo vòng lặp tham chiếu tracks/subSpec (đã có trong chuỗi tổ tiên)`,
    };
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(rawTracks);
  if (hasSubSpec) {
    nextAncestors.add(clip["subSpec"]);
  }

  let resolvedMeta = null;
  let resolvedVersion;
  if (subSpecBase !== null) {
    const m = subSpecBase["meta"];
    if (
      isRecord(m) &&
      typeof m["name"] === "string" &&
      isFiniteNumber(m["width"]) &&
      isFiniteNumber(m["height"]) &&
      isFiniteNumber(m["fps"])
    ) {
      resolvedMeta = m;
    }
    if (typeof subSpecBase["version"] === "string") {
      resolvedVersion = subSpecBase["version"];
    }
  } else {
    resolvedMeta = normalizeMetaOf(clip, opts);
    if (resolvedMeta === null) {
      return {
        ok: false,
        reason: `${label} dạng tracks trực tiếp nhưng thiếu meta — truyền opts.meta (project ngoài) để dựng subSpec, không bịa width/height/fps`,
      };
    }
    resolvedVersion =
      opts.version ??
      (typeof clip["version"] === "string" ? clip["version"] : "0.2.0");
  }
  const childOpts = {
    ...opts,
    meta: resolvedMeta ?? opts.meta,
    version: resolvedVersion ?? opts.version,
  };

  const normTracks = [];
  for (let ti = 0; ti < rawTracks.length; ti++) {
    const track = rawTracks[ti];
    const trackLabel = `${label}.tracks[${ti}]`;
    if (!isRecord(track) || !Array.isArray(track["clips"])) {
      return { ok: false, reason: `${trackLabel} phải là một object có clips là mảng` };
    }
    const trackId =
      typeof track["id"] === "string" && track["id"] !== ""
        ? track["id"]
        : `track-${ti}`;
    if (trackId === `track-${ti}`) {
      warnings.push(`${trackLabel}: thiếu id → gán "${trackId}"`);
    }
    const trackKind =
      typeof track["kind"] === "string" && track["kind"] !== ""
        ? track["kind"]
        : "video";
    if (trackKind === "video" && track["kind"] !== "video") {
      warnings.push(`${trackLabel}: thiếu kind → mặc định "video"`);
    }
    const normClips = [];
    for (let ci = 0; ci < track["clips"].length; ci++) {
      const child = track["clips"][ci];
      const childLabel = `${trackLabel}.clips[${ci}]`;
      if (isRecord(child) && child["kind"] === "nested") {
        const r = normalizeNestedRec(child, childOpts, nextAncestors, childLabel);
        if (!r.ok) return r;
        warnings.push(...r.warnings);
        normClips.push(r.clip);
      } else {
        normClips.push(child);
      }
    }
    normTracks.push({
      ...track,
      id: trackId,
      kind: trackKind,
      clips: normClips,
    });
  }

  let trim;
  const trimRaw = clip["trim"];
  if (trimRaw !== undefined) {
    if (
      !isRecord(trimRaw) ||
      !isFiniteNumber(trimRaw["in"]) ||
      !isFiniteNumber(trimRaw["out"])
    ) {
      return { ok: false, reason: `${label}.trim phải là một object { in, out } là số` };
    }
    trim = { in: trimRaw["in"], out: trimRaw["out"] };
  }
  const inRaw = clip["in"];
  if (inRaw !== undefined) {
    if (!isFiniteNumber(inRaw)) {
      return { ok: false, reason: `${label}.in phải là một số` };
    }
    if (trim !== undefined) {
      if (Math.abs(trim.in - inRaw) > NESTED_DURATION_EPSILON) {
        return {
          ok: false,
          reason: `${label} có cả trim.in (${trim.in}) và in (${inRaw}) mà khác nhau — fail fast, không tự chọn`,
        };
      }
      warnings.push(`${label}: bỏ field in trùng trim.in, giữ trim`);
    } else {
      const speed = clip["speed"] ?? 1;
      trim = {
        in: inRaw,
        out: inRaw + clip["duration"] * speed,
      };
      warnings.push(
        `${label}: field in legacy đã chuyển thành trim { in: ${trim.in}, out: ${trim.out} }`
      );
    }
  }

  for (const extra of ["opacity", "transitionIn", "transitionOut"]) {
    if (clip[extra] !== undefined) {
      warnings.push(
        `${label}: field "${extra}" chỉ có ở shape preview, không mang sang shape chuẩn (spec chưa có field này)`
      );
    }
  }

  const subSpec = {
    ...(subSpecBase ?? {}),
    version: resolvedVersion ?? "0.2.0",
    meta: resolvedMeta ?? (subSpecBase !== null ? subSpecBase["meta"] : undefined),
    tracks: normTracks,
  };
  if (subSpec["meta"] === undefined) {
    delete subSpec["meta"];
  }

  const out = {
    kind: "nested",
    id: clip["id"],
    start: clip["start"],
    duration: clip["duration"],
    subSpec,
  };
  if (trim !== undefined) out["trim"] = trim;
  if (clip["speed"] !== undefined) out["speed"] = clip["speed"];
  if (clip["name"] !== undefined) out["name"] = clip["name"];
  return { ok: true, clip: out, warnings };
}

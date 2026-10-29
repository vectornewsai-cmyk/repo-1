/**
 * nested.js — Làm phẳng nested sequence (clip chứa project con) thành spec
 * phẳng mà render.js hiện tại đã hiểu. Phase 9 luồng N2.
 *
 * HÌNH DẠNG CLIP LỒNG NHAU (do luồng N1 định nghĩa ở video-spec; worker này
 * KHÔNG phụ thuộc build TypeScript nên tự nhận dạng bằng cấu trúc JSON):
 *   clip trên một track bất kỳ, có `subSpec` (hoặc bí danh `nested`) là một
 *   object có `tracks: [...]` (mảng track theo đúng dạng video-spec), kèm:
 *     - id, start, duration: vị trí của clip lồng nhau trên timeline ngoài.
 *     - in (mặc định 0): điểm bắt đầu trong timeline con (giây, gốc 0).
 *     - speed (mặc định 1): tốc độ phát timeline con (0.25..4, như speed
 *       thường). `out` nếu có phải bằng in + duration*speed, nếu không
 *       throw (mơ hồ — không đoán).
 *   Các field của clip lồng nhau ngoài những field trên (src, reverse,
 *   animations, track, mask, filter, effects, enhance,
 *   chromaKey, audioEffects...) đều throw: chúng không có ngữ nghĩa
 *   rõ ràng khi áp cho cả một nhóm clip, và im lặng bỏ qua chúng sẽ render
 *   sai. Xem NESTED_RENDER_LIMITS.md. NGOẠI LỆ từ R3: `opacity` (0..1)
 *   được phép — nhân vào từng clip lá (xem applyNestedLeafVisual), và
 *   `transitionIn`/`transitionOut` type "fade" được phép — nối qua biên
 *   bằng fade opacity (xem resolveTrackBoundaries). NGOẠI LỆ từ đợt 18:
 *   `speedKeyframes` được phép — xem docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md
 *   (ánh xạ phi tuyến qua τ, lá media thành clip ramp tổng hợp).
 *
 * NGỮ NGHĨA ÁNH XẠ (đã kiểm chứng bằng test, xem test_nested_render.js):
 *   Clip lồng nhau chiếm timeline ngoài [S, S+D) và phát đoạn timeline con
 *   [in, in + D*speed). Một clip con [s, s+d) giao với cửa sổ đó ở
 *   [vs, ve) sẽ thành clip phẳng:
 *     start'    = S + (vs - in) / speed
 *     duration' = (ve - vs) / speed
 *   Clip media (video/audio, có in/out/speed riêng):
 *     in'    = in_gốc + (vs - s) * speed_gốc   (phần con bị cắt bên trái)
 *     speed' = speed_gốc * speed               (chỉ đặt khi speed != 1)
 *     out'   = in' + duration' * speed' (capped ở out gốc)
 *   Clip text/sticker/image không có trục nguồn: chỉ đổi start/duration.
 *   Clip con nằm ngoài cửa sổ hoàn toàn thì bị bỏ (không render gì ở đó).
 *   ĐỢT 18 — CLIP LỒNG NHAU CÓ speedKeyframes: duration là thời gian
 *   OUTPUT, cửa sổ con là [in, in + ∫₀ᴰ s) với s là curve; ánh xạ dùng
 *   τ = nghịch đảo của tích phân (xem mapChildOffset): start' =
 *   S + τ(vs − in), duration' = τ(ve − in) − τ(vs − in); lá media tốc
 *   độ hằng c thành clip ramp với curve = slice của curve lồng nhau
 *   trên đoạn output của lá, nhân v với c. Curve hằng (mọi keyframe
 *   cùng v) gộp chính xác về tốc độ hằng v. Chi tiết + các trường hợp
 *   bị từ chối: docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md.
 *
 * ĐỆ QUY: clip lồng nhau trong project con được làm phẳng trước (theo gốc
 * thời gian của project con), rồi mới ánh xạ qua cửa sổ của clip cha — nên
 * hợp thành của nhiều cấp là đúng. Giới hạn độ sâu NESTED_MAX_DEPTH và phát
 * hiện vòng lặp theo identity của object subSpec trên đường đi hiện tại
 * (cùng một subSpec dùng ở hai clip ANH EM không phải vòng lặp — được phép,
 * id clip trùng nhau khi đó sẽ được đổi tên, xem bên dưới).
 *
 * TRACK ĐÍCH: mỗi track con thành MỘT track phẳng mới, chèn ngay sau track
 * chứa clip lồng nhau (giữ thứ tự composite: track dưới vẫn dưới, track
 * trên vẫn trên). Không gộp nhiều track con vào một track ngoài — hai track
 * con là hai lớp phủ khác nhau, gộp lại sẽ vi phạm luật "không chồng lấn"
 * của validator và mất lớp. Track mới:
 *   id     = "<nestedId>__<subTrackId>" (thêm hậu tố khi đụng id đã có)
 *   hidden = hidden ngoài OR hidden con, muted = muted ngoài OR muted con
 *   volume = volume ngoài * volume con (khi cả hai có; chỉ dùng cho gain
 *            audio kế thừa / audio track, giống ngữ nghĩa track.volume).
 *   Track ngoài sau khi bỏ clip lồng nhau được GIỮ LẠI (kể cả khi rỗng) để
 *   id track và thứ tự không đổi.
 *
 * ID CLIP: giữ nguyên id clip con khi chưa đụng id nào khác trong spec phẳng;
 * khi đụng (cùng subSpec dùng 2 lần), đổi thành "<nestedId>:<clipId>" (+ hậu
 * tố) và viết lại captionOf.clipId trong cùng đợt mở rộng để liên kết phụ đề
 * không trỏ sai. Transition trong project con được giữ nguyên trường
 * transitionIn/Out trên clip (validator phẳng tự ghép cặp lại từ đó).
 *
 * CÁC TRƯỜNG HỢP FAIL FAST (throw, không render sai lặng lẽ):
 *   - vòng lặp subSpec, vượt quá độ sâu, cửa sổ không hợp lệ (duration <= 0,
 *     in < 0, speed ngoài 0.25..4, reverse; từ đợt 18 speedKeyframes ở clip
 *     lồng nhau ĐƯỢC hỗ trợ theo spec đợt 18, nhưng curve không hợp lệ,
 *     out không khớp in + ∫curve, lá reverse / lá có attachment thời gian
 *     (không tính curve riêng) dưới clip lồng nhau có curve, hoặc tích tốc
 *     độ lá × curve vượt [0.25, 4] đều fail — xem spec đợt 18 §5. Từ đợt
 *     20 R1, lá video/audio mang curve riêng dưới nested có curve ĐƯỢC
 *     HỢP hai tầng (không còn fail) — xem khối đợt 20 R1 trong file này
 *     và docs/PHASE9_ROUND20_R1_TWO_LEVEL_LIMITS.md.
 *   - clip con bị cắt bên trái (left trim) hoặc phát ở speed != 1 mà mang
 *     "đồ gắn theo thời gian": animations keyframes, track, speedKeyframes,
 *     karaoke — vì thời gian keyframe/điểm track tính từ đầu clip, dịch
 *     chuyển/scale chúng cần nội suy lại, chưa làm (xem LIMITS).
 *   - clip media có reverse mà bị cắt (trái/phải) — thứ tự đảo làm công thức
 *     in' ở trên sai.
 *   - transition qua biên KHÔNG phải "fade" (wipe/slide/...): chỉ "fade" mới
 *     nối được bằng fade opacity (xem resolveTrackBoundaries); loại khác
 *     throw thay vì render sai.
 *   - clip lồng nhau vừa có transition qua biên ở cả hai đầu (in + out),
 *     clip phẳng bị dịch bởi transition qua biên mà còn dính transition
 *     khác, clip phẳng đầu trái cặp biên mà đã có transition phẳng với clip
 *     kề trước — các tổ hợp này tạo gap/pop không sửa được bằng fade
 *     (xem resolveTrackBoundaries).
 *   - clip lá ở biên transition mà mang keyframes opacity sẵn, transition
 *     trong project con, kind image/sticker (render không áp opacity
 *     keyframes cho 2 kind này), hoặc bị cửa sổ cắt trái (với fade-in),
 *     hoặc ngắn hơn thời gian transition.
 *
 * TRANSITION QUA BIÊN (R3, Phase 9 — xem resolveTrackBoundaries):
 *   Cặp biên là cặp (A, B) trên cùng track ngoài mà một đầu là clip lồng
 *   nhau: A.transitionOut và/hoặc B.transitionIn (cùng duration, cùng
 *   type "fade"). Vì sau khi phẳng, hai đầu không còn cùng track nên
 *   không dùng được xfade của render.js; thay vào đó dùng fade opacity:
 *   - B là clip lồng nhau: mọi clip lá của B dịch sớm T giây (nội dung giữ
 *     nguyên, chỉ phát sớm — giống ngữ nghĩa xfade "nội dung B bắt đầu
 *     sớm T giây") và clip lá ở biên (bắt đầu đúng đầu cửa sổ) nhận
 *     keyframes opacity 0→effOp trong T giây đầu (local time), phủ lên
 *     clip A còn đang phát bên dưới → dissolve thật. Clip lá không ở
 *     biên không fade (chúng xuất hiện sau cửa sổ fade).
 *   - B là clip phẳng: B dịch sớm T giây (cùng ngữ nghĩa) và clip lá ở
 *     biên cuối của A (kết thúc đúng cuối cửa sổ) nhận keyframes opacity
 *     effOp→0 trong T giây cuối, lộ dần B bên dưới (B nằm dưới vì track
 *     lá chèn sau track ngoài) → dissolve thật.
 *   - A lồng nhau, B lồng nhau: chỉ B fade-in (lá của B nằm trên lá của
 *     A nên fade một phía đã đủ dissolve; fade cả hai phía sẽ làm tối
 *     giữa — xem LIMITS).
 *   - Clip phẳng bị dịch (đầu phải cặp biên) không được dính transition
 *     khác: validator phẳng yêu cầu kề nhau nên mọi cặp khác đều vỡ.
 *   - Clip phẳng đầu trái cặp biên mà đã có transition phẳng với clip kề
 *     trước cũng bị chặn: unit phẳng kết thúc sớm T_f nên cửa sổ fade
 *     luôn dính đoạn đen cuối (gap của xfade phẳng) → pop.
 *   - Cặp biên trên track không phải video: cảnh báo + bỏ qua (giữ hành
 *     vi cũ — field biến mất cùng clip lồng nhau, không throw để không
 *     vỡ project cũ chỉ có field thừa).
 *
 * OPACITY KẾ THỪA (R3): opacity trên clip lồng nhau (0..1) nhân vào từng
 * clip lá hình (video/image/text/sticker): opacity tĩnh nhân trực tiếp,
 * keyframes opacity nhân từng giá trị v. Clip audio bỏ qua (không có
 * khái niệm opacity). Lồng nhiều cấp thì nhân dồn (0.5 × 0.5 = 0.25).
 * Fade biên dùng effOp = opacity lá × opacity lồng nhau làm đầu/cuối ramp
 * nên opacity lồng nhau và fade không nhân đôi.
 * CÁC TRƯỜNG HỢP CẮT NHẸ (strip + warning, không fail):
 *   - cặp transition bị cửa sổ phá vỡ (một đầu bị bỏ hoặc bị cắt): bỏ
 *     transitionIn/Out của đầu còn lại, render hard cut + warning.
 *   - keyframe/điểm track/karaoke word vượt quá duration mới sau khi cắt
 *     bên phải: bỏ phần vượt quá + warning (phần còn lại giữ nguyên).
 *   - fadeIn/fadeOut audio sau khi cắt: rút ngắn theo phần bị cắt
 *     (fadeIn' = max(0, fadeIn - cắt trái), fadeOut' = max(0, fadeOut - cắt phải)).
 *
 * KHÔNG HỖ TRỢ (xem NESTED_RENDER_LIMITS.md): transition qua biên loại
 * khác "fade", ducking trỏ vào trong project con (voiceTrackId không được
 * remap), mask/effect áp cho toàn bộ sequence.
 *
 * ĐÃ HỖ TRỢ TỪ R3: transition qua biên type "fade" (fade opacity, xem
 * resolveTrackBoundaries) và opacity trên clip lồng nhau (nhân vào clip lá,
 * xem applyNestedLeafVisual).
 *
 * ADJUSTMENT LAYER TRONG PROJECT CON (đợt 7, luồng U2 — xem U2_LIMITS.md):
 * trước đợt 7, field adjustmentLayers của project con bị bỏ qua lặng lẽ
 * khi chỉ lấy flatSub.tracks. Từ đợt 7, flattenInner thu thập chúng:
 *   - thời gian: giao cửa sổ nested rồi ánh xạ như clip (start' =
 *     win.start + (vs - win.in) / win.speed, duration' = (ve - vs) / win.speed);
 *     layer nằm ngoài cửa sổ hoàn toàn thì bỏ + warning (không render sai);
 *   - scope: layer không scope trong project con chỉ áp cho track lá sinh
 *     ra từ chính clip lồng nhau đó (không lan sang clip ngoài); layer có
 *     scope tracks (chỉ số trong project con) được dịch qua lineage track
 *     id rồi về chỉ số track trong spec phẳng cuối (xem flattenSpecForRender);
 *   - thứ tự áp: layer trong trước, layer ngoài sau (layer của level cha
 *     nối sau layer thu thập từ project con).
 *   - fail fast (không render sai lặng lẽ): trùng id layer giữa project con
 *     và ngoài, scope tracks vượt quá số track của project con, layer sai
 *     shape (qua validateAdjustmentLayer). Các xung đột khác (layer giao
 *     clip dính transition, cắt giữa clip gắn thời gian) do cổng fail fast
 *     sẵn có của render.js bắt sau khi flatten, vì layer thu thập vẫn đi
 *     qua đúng đường đó.
 *
 * Zero dependency, Node >= 20. File này không có side effect khi require.
 */
"use strict";

// Đợt 7 U2: validate layer thu thập từ project con bằng cùng validator với
// validate.js (adjustment.js không phụ thuộc nested.js nên không tạo vòng).
const { validateAdjustmentLayer } = require("./adjustment");
// Đợt 18: toán ramp dùng trực tiếp engine của speedramp.js (speedAt /
// integrateSpeed / normalizeSpeedKeyframes — cùng engine với clip ramp
// thường nên không có 2 công thức song song; speedramp chỉ phụ thuộc
// speed.js + motion.js nên không tạo vòng với nested.js).
const { speedAt, integrateSpeed, normalizeSpeedKeyframes } = require("./speedramp");

const EPS = 1e-6;
/** Độ sâu lồng nhau tối đa (clip lồng nhau cấp 1 = depth 1). */
const NESTED_MAX_DEPTH = 8;
const SPEED_MIN = 0.25;
const SPEED_MAX = 4;

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

/**
 * Clip có phải clip lồng nhau không: có `subSpec` (hoặc bí danh `nested`)
 * là object có mảng tracks. kind === "nested" mà không có project con thì
 * coi là clip lồng nhau hỏng (throw ở bước validate, không lặng lẽ bỏ).
 */
function isNestedClip(clip) {
  if (typeof clip !== "object" || clip === null || Array.isArray(clip)) return false;
  if (clip.kind === "nested") return true;
  for (const key of ["subSpec", "nested"]) {
    const v = clip[key];
    if (typeof v === "object" && v !== null && !Array.isArray(v) &&
        Array.isArray(v.tracks)) return true;
  }
  return false;
}

function nestedSubSpec(clip) {
  for (const key of ["subSpec", "nested"]) {
    const v = clip[key];
    if (typeof v === "object" && v !== null && !Array.isArray(v) &&
        Array.isArray(v.tracks)) return v;
  }
  return null;
}

/** Spec (hoặc project con) có chứa clip lồng nhau ở cấp ngoài cùng không. */
function hasNestedClips(spec) {
  if (typeof spec !== "object" || spec === null || !Array.isArray(spec.tracks)) return false;
  return spec.tracks.some((t) => t && Array.isArray(t.clips) &&
    t.clips.some((c) => isNestedClip(c)));
}

function fail(where, msg) {
  throw new Error(`nested ${where}: ${msg}`);
}

/** Sai số cho phép khi so out với in + ∫curve (tích phân số với bezier;
 * vẫn ≪ 1 frame ở 30fps). Tốc độ hằng giữ EPS 1e-6 như cũ. */
const RAMP_OUT_TOL = 1e-4;

/**
 * Validate speedKeyframes của clip lồng nhau theo đúng luật validator
 * clip ramp thường (validate.js validateSpeedKeyframes): object
 * { keyframes }, 1–128 keyframe, t trong [0, duration], v trong
 * [0.25, 4], easing hợp lệ, bezier có x1, x2 trong [0, 1].
 * Trả về curve đã chuẩn hoá (sort + gộp keyframe trùng t, lấy cái sau —
 * đúng normalizeSpeedKeyframes của speedramp.js).
 */
function validateNestedRamp(kfs, duration, where) {
  if (typeof kfs !== "object" || kfs === null || !Array.isArray(kfs.keyframes))
    fail(where, "speedKeyframes phải là object { keyframes: [...] }");
  const arr = kfs.keyframes;
  if (arr.length === 0)
    fail(where, "speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe");
  if (arr.length > 128)
    fail(where, "speedKeyframes.keyframes: quá 128 keyframe");
  arr.forEach((kf, i) => {
    const w = `speedKeyframes.keyframes[${i}]`;
    if (typeof kf !== "object" || kf === null)
      fail(where, `${w} phải là object { t, v, easing }`);
    if (!isFiniteNumber(kf.t) || kf.t < 0 || kf.t > duration + EPS)
      fail(where, `${w}.t phải trong [0, ${duration}] (nhận được: ${kf.t})`);
    if (!isFiniteNumber(kf.v) || kf.v < SPEED_MIN || kf.v > SPEED_MAX)
      fail(where, `${w}.v phải trong ${SPEED_MIN}..${SPEED_MAX} (nhận được: ${kf.v})`);
    if (!["linear", "ease-in", "ease-out", "bezier"].includes(kf.easing))
      fail(where, `${w}.easing phải là linear | ease-in | ease-out | bezier ` +
        `(nhận được: ${JSON.stringify(kf.easing)})`);
    if (kf.easing === "bezier") {
      const b = kf.bezier;
      if (!Array.isArray(b) || b.length !== 4 || !b.every((x) => isFiniteNumber(x)) ||
          b[0] < 0 || b[0] > 1 || b[2] < 0 || b[2] > 1)
        fail(where, `${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], ` +
          `y1, y2 tự do (nhận được: ${JSON.stringify(b)})`);
    }
  });
  return { keyframes: normalizeSpeedKeyframes(arr) };
}

/**
 * Validate cửa sổ của một clip lồng nhau.
 * Trả về { start, duration, in, speed, opacity } và, khi có curve,
 * thêm { isRamp: true, speedKeyframes: <curve đã chuẩn hoá> }.
 * Curve hằng (mọi keyframe cùng v) gộp chính xác về tốc độ hằng v
 * (xem spec đợt 18 §2) nên không đặt isRamp. warnings (nếu truyền mảng)
 * nhận warning "speed bị curve lấn át" khi có cả speed và curve.
 */
function nestedWindow(clip, where, warnings) {
  if (typeof clip.id !== "string" || clip.id.length === 0)
    fail(where, "clip lồng nhau thiếu id (chuỗi khác rỗng)");
  if (!isFiniteNumber(clip.start) || clip.start < 0)
    fail(where, `start phải là số >= 0, nhận được: ${clip.start}`);
  if (!isFiniteNumber(clip.duration) || clip.duration <= 0)
    fail(where, `duration phải là số > 0, nhận được: ${clip.duration}`);
  // Parent merge (Phase 9 đợt nested): shape chuẩn của spec N1 dùng
  // trim: { in, out }; shape cũ của luồng render dùng in/out trực tiếp.
  // Chấp nhận cả hai, trim thắng khi cả hai cùng có mặt.
  let winIn = 0;
  let winOut;
  if (clip.trim !== undefined) {
    if (typeof clip.trim !== "object" || clip.trim === null || Array.isArray(clip.trim) ||
        !isFiniteNumber(clip.trim.in) || !isFiniteNumber(clip.trim.out) ||
        clip.trim.in < 0 || clip.trim.out <= clip.trim.in)
      fail(where, `trim không hợp lệ (cần { in >= 0, out > in }), nhận được: ${JSON.stringify(clip.trim)}`);
    winIn = clip.trim.in;
    winOut = clip.trim.out;
  } else {
    winIn = clip.in === undefined ? 0 : clip.in;
    if (!isFiniteNumber(winIn) || winIn < 0)
      fail(where, `in phải là số >= 0, nhận được: ${clip.in}`);
    winOut = clip.out;
  }
  const speed = clip.speed === undefined ? 1 : clip.speed;
  if (!isFiniteNumber(speed) || speed < SPEED_MIN || speed > SPEED_MAX)
    fail(where, `speed phải trong khoảng ${SPEED_MIN}..${SPEED_MAX}, nhận được: ${clip.speed}`);
  // Đợt 18: speedKeyframes trên clip lồng nhau — ngữ nghĩa ở spec đợt 18.
  // Duration là thời gian OUTPUT; out (nếu ghi) phải khớp in + ∫curve.
  // Curve hằng gộp chính xác về tốc độ hằng (không đặt isRamp).
  let ramp = null;
  if (clip.speedKeyframes !== undefined) {
    ramp = validateNestedRamp(clip.speedKeyframes, clip.duration, where);
    const allSameV = ramp.keyframes.every((k) => Math.abs(k.v - ramp.keyframes[0].v) <= 1e-12);
    if (allSameV) {
      // speedAt hằng = v với mọi t (kể cả bezier overshoot, vì
      // (b.v − a.v) = 0 triệt tiêu easing) nên gộp là đẳng thức.
      // Curve vẫn thắng speed hằng (như §1.5) nên speed khác v thì
      // warning, giống trường hợp curve không hằng bên dưới.
      if (clip.speed !== undefined && clip.speed !== ramp.keyframes[0].v &&
          Array.isArray(warnings))
        warnings.push(`${where}: có cả speed và speedKeyframes — render dùng ` +
          "speedKeyframes, speed hằng bị bỏ qua");
      return finishWindow(clip, where, winIn, winOut, ramp.keyframes[0].v, null);
    }
    if (clip.speed !== undefined && Array.isArray(warnings))
      warnings.push(`${where}: có cả speed và speedKeyframes — render dùng ` +
        "speedKeyframes, speed hằng bị bỏ qua");
  }
  return finishWindow(clip, where, winIn, winOut, speed, ramp);
}

/**
 * Phần cuối của nestedWindow sau khi đã biết tốc độ/curve hiệu dụng.
 * ramp = null → đường tốc độ hằng cũ; ramp ≠ null → đường curve.
 */
function finishWindow(clip, where, winIn, winOut, speed, ramp) {
  if (winOut !== undefined) {
    const expected = ramp
      ? winIn + integrateSpeed(ramp, 0, clip.duration)
      : winIn + clip.duration * speed;
    const tol = ramp ? RAMP_OUT_TOL : EPS;
    if (!isFiniteNumber(winOut) || Math.abs(winOut - expected) > tol)
      fail(where, ramp
        ? `out (${winOut}) không khớp in + ∫speedKeyframes trên duration ` +
          `(${expected}) — clip lồng nhau mơ hồ, không đoán (đổi duration ` +
          `theo chế độ duration-cố-định hoặc trim-cố-định, xem spec đợt 18 §2)`
        : `out (${winOut}) không khớp in + duration*speed ` +
          `(${winIn + clip.duration * speed}) — clip lồng nhau mơ hồ, không đoán`);
  }
  if (clip.reverse === true)
    fail(where, "reverse ở clip lồng nhau chưa được hỗ trợ (đảo timeline con)");
  if (clip.src !== undefined)
    fail(where, "clip lồng nhau vừa có subSpec vừa có src — mơ hồ, không đoán");
  for (const f of ["animations", "track", "mask", "filter", "effects",
    "enhance", "chromaKey", "audioEffects"]) {
    if (clip[f] !== undefined)
      fail(where, `field "${f}" ở clip lồng nhau chưa được hỗ trợ ` +
        "(chỉ áp cho clip phẳng, không áp cho cả sequence)");
  }
  // R3: opacity trên clip lồng nhau ĐƯỢC hỗ trợ — nhân vào từng clip lá
  // khi làm phẳng (xem applyNestedLeafVisual). Chỉ nhận 0..1.
  let nestedOpacity = 1;
  if (clip.opacity !== undefined) {
    if (!isFiniteNumber(clip.opacity) || clip.opacity < 0 || clip.opacity > 1)
      fail(where, `opacity phải là số trong khoảng 0..1, nhận được: ${clip.opacity}`);
    nestedOpacity = clip.opacity;
  }
  const win = { start: clip.start, duration: clip.duration, in: winIn, speed, opacity: nestedOpacity };
  if (ramp) { win.isRamp = true; win.speedKeyframes = ramp; }
  return win;
}

/** Clip có "đồ gắn theo thời gian" không (keyframe/track/ramp/karaoke). */
function hasTimeAttachments(clip) {
  if (clip.speedKeyframes !== undefined) return true;
  if (clip.track && Array.isArray(clip.track.points) && clip.track.points.length > 0) return true;
  if (Array.isArray(clip.karaoke) && clip.karaoke.length > 0) return true;
  if (clip.animations && typeof clip.animations === "object") {
    for (const v of Object.values(clip.animations)) {
      if (v && typeof v === "object" && Array.isArray(v.keyframes) && v.keyframes.length > 0)
        return true;
    }
  }
  if (clip.volumeKeyframes !== undefined) return true;
  return false;
}

/** Cắt keyframe/điểm track vượt quá duration mới; trả về số phần tử đã bỏ. */
function trimTimedFields(clip, newDuration, warnings, where) {
  let dropped = 0;
  if (clip.animations && typeof clip.animations === "object") {
    for (const [key, v] of Object.entries(clip.animations)) {
      if (v && typeof v === "object" && Array.isArray(v.keyframes)) {
        const kept = v.keyframes.filter((k) => k && isFiniteNumber(k.t) && k.t <= newDuration + EPS);
        dropped += v.keyframes.length - kept.length;
        if (kept.length === 0) delete clip.animations[key];
        else v.keyframes = kept;
      }
    }
    if (Object.keys(clip.animations).length === 0) delete clip.animations;
  }
  if (clip.track && Array.isArray(clip.track.points)) {
    const kept = clip.track.points.filter((p) => p && isFiniteNumber(p.t) && p.t <= newDuration + EPS);
    dropped += clip.track.points.length - kept.length;
    if (kept.length === 0) delete clip.track;
    else clip.track.points = kept;
  }
  if (Array.isArray(clip.karaoke)) {
    const kept = clip.karaoke.filter((w) => w && isFiniteNumber(w.end) && w.end <= newDuration + EPS);
    dropped += clip.karaoke.length - kept.length;
    if (kept.length === 0) delete clip.karaoke;
    else clip.karaoke = kept;
  }
  if (dropped > 0)
    warnings.push(`${where}: cắt phải bỏ ${dropped} keyframe/điểm track/từ karaoke ` +
      `vượt quá duration mới ${newDuration}s`);
  return dropped;
}

/* ==========================================================================
 * Đợt 18 — toán ramp cho clip lồng nhau (xem spec đợt 18).
 * mapChildOffset / mapChildInterval là trung tâm: với tốc độ hằng chúng
 * rút gọn đúng về công thức tuyến tính cũ, với curve chúng dùng τ =
 * nghịch đảo tích phân. sliceNestedRampKeyframes là port của
 * sliceSpeedKeyframes (packages/video-spec/src/speedcurve.js, bản H3):
 * linear đúng hệt, bezier đúng hệt (de Casteljau), ease-in/ease-out
 * đúng hệt (bezier nâng bậc từ bậc 2) — nếu đổi thuật toán ở đây thì
 * phải đối chiếu lại với bên kia bằng test đánh giá slice (§ test đợt 18).
 * ========================================================================== */

/** Tổng nguồn con tiêu thụ trên toàn bộ duration của clip lồng nhau có curve. */
function rampTotalConsumed(win) {
  return integrateSpeed(win.speedKeyframes, 0, win.duration);
}

/**
 * Thời gian output (tương đối so với win.start) ứng với vị trí con cách
 * đầu cửa sổ `offset` giây (offset = childTime − win.in).
 * Tốc độ hằng: offset / speed. Curve: nghiệm của ∫₀^τ s = offset
 * (chia đôi; s ≥ 0.25 nên đơn điệu ngặt). Ngoài [0, tổng tiêu thụ] thì
 * ngoại suy tuyến tính theo tốc độ biên — chỉ dùng để phát hiện cắt và
 * tính fade audio, không dùng cho ánh xạ đoạn khả kiến (đoạn đó đã giao
 * cửa sổ nên offset luôn trong [0, tổng]).
 */
function mapChildOffset(win, offset) {
  if (!win.isRamp) return offset / win.speed;
  const curve = win.speedKeyframes;
  const total = rampTotalConsumed(win);
  if (offset <= 0) return offset / speedAt(curve, 0);
  if (offset >= total) return win.duration + (offset - total) / speedAt(curve, win.duration);
  let lo = 0;
  let hi = win.duration;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (integrateSpeed(curve, 0, mid) < offset) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Đoạn con [s, e) (thời gian timeline con) → { start, duration } thời gian output tương đối. */
function mapChildInterval(win, s, e) {
  const a = mapChildOffset(win, s - win.in);
  const b = mapChildOffset(win, e - win.in);
  return { start: a, duration: b - a };
}

function segmentEasingAtNested(ks, x) {
  let easing = "linear";
  for (const k of ks) {
    if (k.t <= x + 1e-9) easing = k.easing;
    else break;
  }
  return easing;
}

function lerpPtNested(a, b, s) {
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
}

function splitCubicAtNested(pts, s) {
  const [p0, p1, p2, p3] = pts;
  const a = lerpPtNested(p0, p1, s);
  const b = lerpPtNested(p1, p2, s);
  const c = lerpPtNested(p2, p3, s);
  const d = lerpPtNested(a, b, s);
  const e = lerpPtNested(b, c, s);
  const f = lerpPtNested(d, e, s);
  return [[p0, a, d, f], [f, e, c, p3]];
}

function solveBezierXNested(x1, x2, target) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const sampleX = (s) => ((ax * s + bx) * s + cx) * s;
  const sampleDX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  const c = Math.min(1, Math.max(0, target));
  if (c === 0) return 0;
  if (c === 1) return 1;
  let s = c;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(s) - c;
    if (Math.abs(err) < 1e-9) return s;
    const d = sampleDX(s);
    if (Math.abs(d) < 1e-9) break;
    s -= err / d;
  }
  let lo = 0;
  let hi = 1;
  s = c;
  while (hi - lo > 1e-9) {
    if (sampleX(s) < c) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
  }
  return s;
}

function subdivideBezierNested(bezier, pLo, pHi) {
  if (!(pLo >= 0 && pHi <= 1 && pHi > pLo)) return null;
  const [x1, y1, x2, y2] = bezier;
  let controls = [[0, 0], [x1, y1], [x2, y2], [1, 1]];
  const sLo = pLo <= 0 ? 0 : solveBezierXNested(x1, x2, pLo);
  const sHi = pHi >= 1 ? 1 : solveBezierXNested(x1, x2, pHi);
  if (!(sHi > sLo)) return null;
  if (sLo > 0) controls = splitCubicAtNested(controls, sLo)[1];
  if (sHi < 1) {
    const u = (sHi - sLo) / (1 - sLo);
    controls = splitCubicAtNested(controls, u)[0];
  }
  const [l0, l1, l2, l3] = controls;
  const dx = l3[0] - l0[0];
  const dy = l3[1] - l0[1];
  if (Math.abs(dx) < 1e-12 || Math.abs(dy) < 1e-12) return null;
  return [
    (l1[0] - l0[0]) / dx,
    (l1[1] - l0[1]) / dy,
    (l2[0] - l0[0]) / dx,
    (l2[1] - l0[1]) / dy,
  ];
}

function quadraticPortionBezierNested(easing, pA, pB) {
  if (!(pB > pA && pA >= 0 && pB <= 1)) return null;
  if (easing === "ease-in") {
    const s = pA + pB;
    if (s <= 0) return null;
    return [1 / 3, (2 * pA) / (3 * s), 2 / 3, (3 * pA + pB) / (3 * s)];
  }
  const d = 2 - pA - pB;
  if (d <= 0) return null;
  return [1 / 3, (2 * (1 - pA)) / (3 * d), 2 / 3, (4 - 3 * pA - pB) / (3 * d)];
}

/**
 * Cắt đoạn [from, to) của curve (thời gian output của clip lồng nhau)
 * và rebase về 0; hai đầu luôn có điểm (chèn điểm biên với v = speedAt
 * nếu không có keyframe đúng tại biên). Port của sliceSpeedKeyframes
 * bên speedcurve.js — xem chú thích đầu khối. Trả về mảng keyframes
 * (rỗng khi đoạn suy biến).
 */
function sliceNestedRampKeyframes(kfs, from, to) {
  const SLICE_EPS = 1e-9;
  if (!kfs || kfs.length === 0) return [];
  const lo = Math.max(0, from);
  if (!(to > lo)) return [];
  const norm = normalizeSpeedKeyframes(kfs);
  const curve = { keyframes: norm };
  const atStart = norm.find((k) => Math.abs(k.t - lo) <= SLICE_EPS);
  const atEnd = norm.find((k) => Math.abs(k.t - to) <= SLICE_EPS);
  const out = [];
  if (atStart) out.push({ ...atStart, t: 0 });
  else {
    out.push({
      t: 0,
      v: speedAt(curve, lo),
      easing: segmentEasingAtNested(norm, lo),
    });
  }
  for (const k of norm) {
    if (k.t > lo + SLICE_EPS && k.t < to - SLICE_EPS) out.push({ ...k, t: k.t - lo });
  }
  if (atEnd) out.push({ ...atEnd, t: to - lo });
  else {
    out.push({ t: to - lo, v: speedAt(curve, to), easing: "linear" });
  }
  const segContaining = (x) => {
    for (let i = norm.length - 2; i >= 0; i--) {
      if (norm[i].t < x - SLICE_EPS && norm[i + 1].t > x + SLICE_EPS) {
        return { seg: norm[i], next: norm[i + 1] };
      }
    }
    return null;
  };
  const segLo = atStart ? null : segContaining(lo);
  const segTo = atEnd ? null : segContaining(to);
  if (segLo && segLo.seg.easing === "bezier" && segLo.seg.bezier) {
    const spanLo = segLo.next.t - segLo.seg.t;
    const pLo = (lo - segLo.seg.t) / spanLo;
    const sameSeg = segTo !== null && segTo.seg === segLo.seg;
    const sub = sameSeg
      ? subdivideBezierNested(segLo.seg.bezier, pLo, (to - segLo.seg.t) / spanLo)
      : subdivideBezierNested(segLo.seg.bezier, pLo, 1);
    out[0].easing = "bezier";
    out[0].bezier = sub ?? segLo.seg.bezier;
  }
  if (segTo && segTo.seg.easing === "bezier" && segTo.seg.bezier) {
    const sameSeg = segLo !== null && segTo.seg === segLo.seg;
    if (!sameSeg) {
      const pt = out.find((p) => Math.abs(p.t - (segTo.seg.t - lo)) <= 1e-9);
      if (pt) {
        const spanTo = segTo.next.t - segTo.seg.t;
        const sub = subdivideBezierNested(segTo.seg.bezier, 0, (to - segTo.seg.t) / spanTo);
        pt.easing = "bezier";
        pt.bezier = sub ?? segTo.seg.bezier;
      }
    }
  }
  if (segLo && (segLo.seg.easing === "ease-in" || segLo.seg.easing === "ease-out")) {
    const spanQ = segLo.next.t - segLo.seg.t;
    const dvQ = segLo.next.v - segLo.seg.v;
    const sameQ = segTo !== null && segTo.seg === segLo.seg;
    if (spanQ > 0 && Math.abs(dvQ) > 1e-12 && (segLo.seg.easing === "ease-in" || sameQ)) {
      const pLoQ = (lo - segLo.seg.t) / spanQ;
      const pHiQ = sameQ ? (to - segLo.seg.t) / spanQ : 1;
      const qb = quadraticPortionBezierNested(segLo.seg.easing, pLoQ, pHiQ);
      if (qb) {
        out[0].easing = "bezier";
        out[0].bezier = qb;
      }
    }
  }
  if (segTo && segTo.seg.easing === "ease-out") {
    const sameQ = segLo !== null && segTo.seg === segLo.seg;
    if (!sameQ) {
      const spanQ = segTo.next.t - segTo.seg.t;
      const dvQ = segTo.next.v - segTo.seg.v;
      if (spanQ > 0 && Math.abs(dvQ) > 1e-12) {
        const pt = out.find((p) => Math.abs(p.t - (segTo.seg.t - lo)) <= 1e-9);
        if (pt) {
          const qb = quadraticPortionBezierNested("ease-out", 0, (to - segTo.seg.t) / spanQ);
          if (qb) {
            pt.easing = "bezier";
            pt.bezier = qb;
          }
        }
      }
    }
  }
  return normalizeSpeedKeyframes(out);
}

/**
 * Nhân mọi v của curve đã slice với tốc độ hằng của lá. Fail khi tích
 * vượt [0.25, 4] (validator phẳng cũng sẽ từ chối, nhưng fail ở đây nói
 * rõ nguyên nhân là tích tốc độ lá × tốc độ lồng nhau).
 */
function scaleRampKeyframes(kfs, factor, where) {
  const scaled = kfs.map((k) => ({ ...k, v: k.v * factor }));
  for (const k of scaled) {
    if (!isFiniteNumber(k.v) || k.v < SPEED_MIN || k.v > SPEED_MAX)
      fail(where, `tốc độ lá × tốc độ clip lồng nhau = ${k.v} vượt khoảng ` +
        `${SPEED_MIN}..${SPEED_MAX} (tốc độ lá ${factor} × tốc độ curve ${k.v / factor}) ` +
        "— giảm tốc độ lá hoặc biên độ curve rồi render lại");
  }
  return scaled;
}

/* ==========================================================================
 * Đợt 20 R1 — hợp curve hai tầng (đóng nợ đợt 19 G2 §1c/§3 + spec đợt 18
 * §5/§6). Ngữ nghĩa ĐÚNG bằng tích phân, không nhân easing:
 *
 *   Lá video/audio mang speedKeyframes riêng s_i(x) (x = thời gian con
 *   tính từ đầu lá) nằm dưới nested có curve s_o(T) (T = thời gian
 *   output tính từ đầu nested). Với đoạn khả kiến [vs, ve) của lá trong
 *   timeline con, đặt T_start = τ_o(vs − in), T_end = τ_o(ve − in),
 *   leftCut = vs − s_lá. Thời gian nguồn của lá tại thời gian output
 *   ngoài t' ∈ [0, T_end − T_start) là HỢP của hai ánh xạ:
 *     x(t') = leftCut + ∫_{T_start}^{T_start+t'} s_o
 *     src(t') = lá.in + ∫₀^{x(t')} s_i
 *   tức tốc độ hợp c(t') = s_o(T_start+t') · s_i(x(t')) (quy tắc dây
 *   chuyền: d(src)/dt' = s_i(x) · s_o(T)). Mọi tích phân đều dùng đúng
 *   engine speedramp.js (integrateSpeed/speedAt), không viết lại công
 *   thức tích phân.
 *
 *   Mã hoá c(t') thành speedKeyframes cho clip phẳng: c nói chung KHÔNG
 *   thuộc họ speedKeyframes (tích của hai easing không còn là một
 *   easing), nên mã hoá là XẤP XỈ có kiểm soát, không claim đúng hệt:
 *   chia đoạn tại mọi điểm gãy (knot ngoài + ảnh ngược τ của knot
 *   trong) rồi chia nhỏ tối đa 0.25s, mỗi đoạn con dùng MỘT keyframe
 *   bezier Hermite với x1=1/3, x2=2/3 (khi đó X(t)=t nên Y(t) là đa thức
 *   Hermite bậc 3 đúng nghĩa: khớp giá trị và đạo hàm hai đầu). Hệ quả:
 *   linear×linear cho c là đa thức bậc 3 nên Hermite tái tạo ĐÚNG HỆT
 *   (Sai số chỉ còn sai số solver bezier ~1e-6); easing khác thì sai số
 *   O(h⁴) với h ≤ 0.25s. Hai ngoại lệ ĐÚNG HỆT, không qua Hermite:
 *   (1) curve trong hằng v_i → slice curve ngoài × v_i (đường đợt 18);
 *   (2) tốc độ ngoài hằng v_o (kể cả curve ngoài hằng đã gộp ở
 *   nestedWindow) → slice curve trong rồi chia thời gian cho v_o, nhân
 *   v với v_o (đổi biến tuyến tính giữ nguyên easing).
 *   Keyframe của curve hợp bị giới hạn 128 (validator phẳng); vượt thì
 *   fail rõ ràng thay vì render sai. Tốc độ hợp tại keyframe mẫu vượt
 *   [0.25, 4] thì fail rõ ràng (tích hai tốc độ có thể vượt khoảng dù
 *   mỗi tầng đều hợp lệ).
 *   Phạm vi: chỉ lá video/audio, không reverse, không attachment thời
 *   gian khác (animations/track/karaoke/volumeKeyframes) — các trường
 *   hợp đó vẫn fail-fast như cũ.
 * ========================================================================== */

/** Curve hằng không (mọi keyframe cùng v, sai số 1e-12)? */
function isConstantCurve(curve) {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) return false;
  return ks.every((k) => Math.abs(k.v - ks[0].v) <= 1e-12);
}

/** Clip có attachment thời gian KHÁC speedKeyframes không. */
function hasNonCurveAttachments(clip) {
  if (clip.track && Array.isArray(clip.track.points) && clip.track.points.length > 0) return true;
  if (Array.isArray(clip.karaoke) && clip.karaoke.length > 0) return true;
  if (clip.animations && typeof clip.animations === "object") {
    for (const v of Object.values(clip.animations)) {
      if (v && typeof v === "object" && Array.isArray(v.keyframes) && v.keyframes.length > 0)
        return true;
    }
  }
  if (clip.volumeKeyframes !== undefined) return true;
  return false;
}

/** Đạo hàm của easing theo p (p ∈ [0, 1]): d(easing(p))/dp. */
function easingDerivativeAtNested(easing, p, bezier) {
  if (easing === "linear") return 1;
  if (easing === "ease-in") return 2 * p;
  if (easing === "ease-out") return 2 * (1 - p);
  if (easing === "bezier") {
    const b = bezier ?? [0.25, 0.1, 0.25, 1];
    const s = solveBezierXNested(b[0], b[2], p);
    const dx = 3 * (1 - s) * (1 - s) * b[0] + 6 * (1 - s) * s * (b[2] - b[0]) +
      3 * s * s * (1 - b[2]);
    const dy = 3 * (1 - s) * (1 - s) * b[1] + 6 * (1 - s) * s * (b[3] - b[1]) +
      3 * s * s * (1 - b[3]);
    if (Math.abs(dx) < 1e-12) return 0;
    return dy / dx;
  }
  return 1;
}

/**
 * Đạo hàm của speedAt theo thời gian output. Tại điểm gãy (t trùng
 * keyframe trong), đạo hàm trái/phải có thể khác nhau nên `side`
 * ("left" | "right") chọn phía; trong đoạn thì hai phía bằng nhau.
 * Ngoài khoảng keyframe (tốc độ hằng do clamp) đạo hàm = 0.
 */
function speedAtDerivative(curve, t, side) {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length <= 1) return 0;
  const first = ks[0];
  const last = ks[ks.length - 1];
  if (t < first.t) return 0;
  if (t > last.t) return 0;
  if (t === first.t && side === "left") return 0;
  if (t === last.t && side === "right") return 0;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t < a.t || t > b.t) continue;
    // t trùng đầu phải của đoạn mà chưa phải đoạn cuối: phía phải thuộc
    // đoạn kế tiếp, phía trái thuộc đoạn này.
    if (t === b.t && i < ks.length - 2 && side === "right") continue;
    const span = b.t - a.t;
    if (span <= 0) return 0;
    const p = (t - a.t) / span;
    return ((b.v - a.v) / span) * easingDerivativeAtNested(a.easing, p, a.bezier);
  }
  return 0;
}

/**
 * Hàm hợp hai tầng ĐÚNG (tích phân) cho một lá dưới nested có curve.
 * win: cửa sổ ramp đã validate (isRamp). innerCurve: curve của lá đã
 * validate + chuẩn hoá ({ keyframes }). leaf: clip lá (dùng start/in).
 * vs/ve: đoạn khả kiến của lá trong timeline con.
 * Trả về { tStart, tEnd, duration, leftCut, in, consumed, out,
 *   breakpoints, speedAt(t'), sourceAt(t'), derivativeAt(t', side) }.
 * breakpoints là các điểm gãy trên trục t' (gồm 0 và duration).
 */
function twoLevelExact(win, innerCurve, leaf, vs, ve) {
  const outerCurve = win.speedKeyframes;
  const tStart = mapChildOffset(win, vs - win.in);
  const tEnd = mapChildOffset(win, ve - win.in);
  const duration = tEnd - tStart;
  const leftCut = vs - leaf.start;
  const visibleChild = ve - vs;
  const inPrime = leaf.in + integrateSpeed(innerCurve, 0, leftCut);
  const consumed = integrateSpeed(innerCurve, leftCut, leftCut + visibleChild);
  const childElapsed = (tp) => {
    if (tp <= 0) return 0;
    return integrateSpeed(outerCurve, tStart, tStart + tp);
  };
  const innerArg = (tp) => leftCut + childElapsed(tp);
  const speedAtFn = (tp) => {
    const T = tStart + tp;
    return speedAt(outerCurve, T) * speedAt(innerCurve, innerArg(tp));
  };
  const sourceAtFn = (tp) => leaf.in + integrateSpeed(innerCurve, 0, innerArg(tp));
  const derivativeAtFn = (tp, side) => {
    const T = tStart + tp;
    const x = innerArg(tp);
    const so = speedAt(outerCurve, T);
    const si = speedAt(innerCurve, x);
    return speedAtDerivative(outerCurve, T, side) * si +
      so * so * speedAtDerivative(innerCurve, x, side);
  };
  // Điểm gãy: knot ngoài trong (tStart, tEnd) + ảnh ngược τ của knot
  // trong trong (leftCut, leftCut + visibleChild).
  const pts = [0, duration];
  for (const k of normalizeSpeedKeyframes(outerCurve.keyframes)) {
    if (k.t > tStart && k.t < tEnd) pts.push(k.t - tStart);
  }
  for (const k of normalizeSpeedKeyframes(innerCurve.keyframes)) {
    if (k.t > leftCut && k.t < leftCut + visibleChild) {
      const target = (vs - win.in) + (k.t - leftCut);
      const T = mapChildOffset(win, target);
      if (T > tStart && T < tEnd) pts.push(T - tStart);
    }
  }
  pts.sort((a, b) => a - b);
  const breakpoints = [];
  for (const p of pts) {
    if (breakpoints.length === 0 || Math.abs(p - breakpoints[breakpoints.length - 1]) > 1e-9)
      breakpoints.push(p);
  }
  return {
    tStart, tEnd, duration, leftCut, in: inPrime, consumed,
    out: inPrime + consumed, breakpoints,
    speedAt: speedAtFn, sourceAt: sourceAtFn, derivativeAt: derivativeAtFn,
  };
}

/**
 * Mã hoá tốc độ hợp c(t') thành speedKeyframes (Hermite, xem khối chú
 * thích đợt 20 R1). Trả về { keyframes }. Fail khi: điểm gãy đã > 128
 * (không thể mã hoá trong giới hạn validator), hoặc tốc độ hợp tại
 * điểm mẫu vượt [0.25, 4].
 */
function encodeTwoLevelCurve(exact, where) {
  const duration = exact.duration;
  if (!(duration > 0)) fail(where, "hợp curve hai tầng: duration của lá sau ánh xạ phải > 0");
  if (exact.breakpoints.length > 128)
    fail(where, `hợp curve hai tầng cần ${exact.breakpoints.length} điểm gãy, ` +
      "vượt giới hạn 128 keyframe của clip ramp — giảm số keyframe của curve ngoài/trong rồi render lại");
  // Chia nhỏ mỗi khoảng gãy tối đa 0.25s; nếu vượt 128 keyframe thì nới
  // bước (giữ lại toàn bộ điểm gãy) cho tới khi vừa, tối đa 5 vòng.
  let step = 0.25;
  let points = null;
  for (let iter = 0; iter < 6; iter++) {
    const pts = [];
    const bp = exact.breakpoints;
    for (let i = 0; i < bp.length - 1; i++) {
      const a = bp[i];
      const b = bp[i + 1];
      const n = Math.max(1, Math.ceil((b - a) / step - 1e-12));
      for (let j = 0; j < n; j++) pts.push(a + (j * (b - a)) / n);
    }
    pts.push(duration);
    const dedup = [];
    for (const p of pts) {
      if (dedup.length === 0 || Math.abs(p - dedup[dedup.length - 1]) > 1e-9) dedup.push(p);
    }
    points = dedup;
    if (points.length <= 128) break;
    step *= 1.5;
  }
  if (points.length > 128) {
    // Giữ điểm gãy + lấy mẫu đều phần còn lại cho vừa 128 (trường hợp
    // hiếm: nhiều điểm gãy + duration dài). Độ chính xác giảm theo bước
    // lớn hơn — ghi rõ trong LIMITS, không lặng lẽ vượt validator.
    const bpSet = new Set(exact.breakpoints.map((p) => Math.round(p * 1e9)));
    const extra = points.filter((p) => !bpSet.has(Math.round(p * 1e9)));
    const keep = Math.max(0, 128 - exact.breakpoints.length);
    const stride = keep > 0 ? extra.length / keep : Infinity;
    const chosen = new Set(exact.breakpoints);
    for (let i = 0; i < extra.length && chosen.size < 128; i++) {
      if (Math.floor(i / stride) !== Math.floor((i - 1) / stride) || i === 0) chosen.add(extra[i]);
    }
    points = [...chosen].sort((a, b) => a - b);
  }
  // Điểm mẫu: { t, v, dLeft, dRight }.
  const mkPoint = (t) => ({
    t,
    v: exact.speedAt(t),
    dLeft: exact.derivativeAt(t, "left"),
    dRight: exact.derivativeAt(t, "right"),
  });
  let sample = points.map(mkPoint);
  // Đoạn có Δv ≈ 0 nhưng đạo hàm ≠ 0 (đỉnh/vực trong đoạn): chẻ đôi cho
  // tới khi hai đầu khác nhau (Hermite mới biểu diễn được), tối đa
  // 200 lần chẻ và không vượt 128 điểm.
  for (let iter = 0; iter < 200; iter++) {
    let splitAt = -1;
    for (let i = 0; i < sample.length - 1; i++) {
      const a = sample[i];
      const b = sample[i + 1];
      if (Math.abs(b.v - a.v) <= 1e-12 &&
          (Math.abs(a.dRight) > 1e-9 || Math.abs(b.dLeft) > 1e-9) &&
          b.t - a.t > 1e-6) {
        splitAt = i;
        break;
      }
    }
    if (splitAt < 0 || sample.length >= 128) break;
    const a = sample[splitAt];
    const b = sample[splitAt + 1];
    sample.splice(splitAt + 1, 0, mkPoint((a.t + b.t) / 2));
  }
  // Kiểm tra khoảng tốc độ tại điểm mẫu (tiêu chí validator: keyframe v).
  for (const p of sample) {
    if (!isFiniteNumber(p.v) || p.v < SPEED_MIN - 1e-9 || p.v > SPEED_MAX + 1e-9)
      fail(where, `tốc độ hợp hai tầng = ${p.v} vượt khoảng ` +
        `${SPEED_MIN}..${SPEED_MAX} tại t'=${p.t} — tích tốc độ ngoài × tốc độ ` +
        "trong vượt khoảng dù mỗi tầng đều hợp lệ; giảm biên độ một trong hai curve rồi render lại");
    if (p.v < SPEED_MIN) p.v = SPEED_MIN;
    if (p.v > SPEED_MAX) p.v = SPEED_MAX;
  }
  const keyframes = sample.map((p, i) => {
    const kf = { t: p.t, v: p.v, easing: "linear" };
    if (i < sample.length - 1) {
      const q = sample[i + 1];
      const span = q.t - p.t;
      const dv = q.v - p.v;
      if (Math.abs(dv) > 1e-12) {
        const y1 = (span * p.dRight) / (3 * dv);
        const y2 = 1 - (span * q.dLeft) / (3 * dv);
        kf.easing = "bezier";
        kf.bezier = [1 / 3, y1, 2 / 3, y2];
      }
    }
    return kf;
  });
  keyframes[0].t = 0;
  keyframes[keyframes.length - 1].t = duration;
  return { keyframes: normalizeSpeedKeyframes(keyframes) };
}

/**
 * Ánh xạ một clip con phẳng qua cửa sổ clip lồng nhau.
 * Trả về clip phẳng mới, hoặc null khi clip con nằm ngoài cửa sổ hoàn toàn.
 * Throw khi gặp tổ hợp chưa hỗ trợ (xem header).
 */
function mapClip(clip, win, warnings) {
  const where = `clip "${clip.id}" trong project con`;
  if (!isFiniteNumber(clip.start) || !isFiniteNumber(clip.duration) || clip.duration <= 0)
    fail(where, `start/duration không hợp lệ (start=${clip.start}, duration=${clip.duration})`);
  const s = clip.start;
  const e = s + clip.duration;
  const winStart = win.in;
  const winEnd = win.isRamp ? win.in + rampTotalConsumed(win) : win.in + win.duration * win.speed;
  const vs = Math.max(s, winStart);
  const ve = Math.min(e, winEnd);
  if (ve - vs <= EPS) return null; // nằm ngoài cửa sổ hoàn toàn
  const leftCut = vs - s; // theo thời gian timeline con
  const rightCut = e - ve;
  // Ánh xạ qua τ (đợt 18): với tốc độ hằng τ(w) = w / speed nên đúng
  // công thức cũ; với curve τ là nghịch đảo tích phân.
  const outer = mapChildInterval(win, vs, ve);
  const newStart = win.start + outer.start;
  const newDuration = outer.duration;
  const trimmed = leftCut > EPS || rightCut > EPS;
  const timeAttached = hasTimeAttachments(clip);
  // Đợt 20 R1: tách curve riêng của lá khỏi attachment khác. Lá media
  // mang speedKeyframes riêng (không attachment khác, không reverse) thì
  // ĐƯỢC HỢP hai tầng (xem khối đợt 20 R1 ở trên), không còn fail; lá
  // phi-media mang curve vẫn fail như cũ (không có trục nguồn để hợp).
  const isMediaLeaf = (clip.kind === "video" || clip.kind === "audio") &&
    typeof clip.src === "string" && isFiniteNumber(clip.in) && isFiniteNumber(clip.out);
  const leafHasCurve = clip.speedKeyframes !== undefined;
  const otherAttached = hasNonCurveAttachments(clip);
  if (win.isRamp) {
    if (clip.reverse === true)
      fail(where, "clip lồng nhau có speedKeyframes mà clip con reverse — " +
        "đảo + ramp chưa được hỗ trợ");
    if (otherAttached)
      fail(where, "clip lồng nhau có speedKeyframes mà clip con mang " +
        "keyframes/track/karaoke/volumeKeyframes — nội suy attachment qua τ phi tuyến " +
        "chưa được hỗ trợ, không render sai lặng lẽ");
    if (leafHasCurve && !isMediaLeaf)
      fail(where, "clip lồng nhau có speedKeyframes mà clip con (không phải video/audio) " +
        "mang speedKeyframes — hợp curve chỉ hỗ trợ lá video/audio có trục nguồn");
    // Lá media mang curve riêng: hợp hai tầng ở nhánh isMedia bên dưới.
    // Lá không curve mà mang attachment khác đã bị chặn ở trên; lá không
    // curve không attachment thì đi đường ramp đợt 18 như cũ.
  } else {
    if (otherAttached && leftCut > EPS)
      fail(where, "clip bị cắt bên trái mà mang keyframes/track/karaoke/volumeKeyframes — " +
        "dịch thời gian keyframe chưa được hỗ trợ, không render sai lặng lẽ");
    if (otherAttached && win.speed !== 1)
      fail(where, "clip mang keyframes/track/karaoke/volumeKeyframes mà clip lồng nhau " +
        "phát ở speed != 1 — scale thời gian keyframe chưa được hỗ trợ");
    if (leafHasCurve && !isMediaLeaf && (leftCut > EPS || win.speed !== 1))
      fail(where, "clip con (không phải video/audio) mang speedKeyframes mà clip lồng nhau " +
        "phát ở speed != 1 hoặc bị cắt trái — hợp curve chỉ hỗ trợ lá video/audio");
    if (leafHasCurve && clip.reverse === true)
      fail(where, "clip con mang speedKeyframes mà reverse=true — " +
        "đảo + ramp chưa được hỗ trợ (validator phẳng cũng cấm speedKeyframes + reverse)");
    if (clip.reverse === true && trimmed)
      fail(where, "clip reverse bị cắt bởi cửa sổ clip lồng nhau — thứ tự đảo " +
        "làm công thức in' sai, chưa được hỗ trợ");
  }
  // timeAttached giữ lại cho đường trimTimedFields bên dưới (chỉ còn ý
  // nghĩa khi rightCut > EPS và clip không bị chặn ở trên).
  void timeAttached;

  const out = { ...clip, start: newStart, duration: newDuration };
  // Deep-copy các object con có thể bị trim bên dưới để không đụng input
  // (input đã được structuredClone ở flattenSpecForRender, nhưng giữ an toàn
  // khi mapClip được gọi trực tiếp từ test).
  if (out.animations) out.animations = JSON.parse(JSON.stringify(out.animations));
  if (out.track) out.track = JSON.parse(JSON.stringify(out.track));
  if (Array.isArray(out.karaoke)) out.karaoke = JSON.parse(JSON.stringify(out.karaoke));

  const isMedia = (clip.kind === "video" || clip.kind === "audio") &&
    typeof clip.src === "string" && isFiniteNumber(clip.in) && isFiniteNumber(clip.out);
  if (isMedia) {
    const clipSpeed = clip.speed === undefined ? 1 : clip.speed;
    if (win.isRamp && leafHasCurve) {
      // Đợt 20 R1 — hợp hai tầng dưới nested có curve. Curve trong được
      // validate đúng luật ramp thường trước khi hợp (t trong
      // [0, duration lá], v trong [0.25, 4], ≤ 128 keyframe).
      const innerCurve = validateNestedRamp(clip.speedKeyframes, clip.duration, where);
      if (isConstantCurve(innerCurve)) {
        // (c) Curve trong hằng v_i: hợp ĐÚNG HỆT về slice curve ngoài
        // × v_i (đường đợt 18, chỉ đổi hệ số từ speed hằng sang v_i).
        const vInner = innerCurve.keyframes[0].v;
        const sliced = sliceNestedRampKeyframes(
          win.speedKeyframes.keyframes, outer.start, outer.start + outer.duration);
        if (sliced.length === 0)
          fail(where, "không slice được speedKeyframes của clip lồng nhau cho " +
            "đoạn output của clip con — đoạn suy biến, không đoán");
        out.speedKeyframes = { keyframes: scaleRampKeyframes(sliced, vInner, where) };
        delete out.speed;
        const newIn = clip.in + leftCut * vInner;
        let newOut = newIn + vInner * (ve - vs);
        if (newOut > clip.out + EPS) newOut = clip.out;
        out.in = newIn;
        out.out = newOut;
      } else {
        // Hợp tổng quát: tốc độ hợp = tích hai tốc độ theo quy tắc dây
        // chuyền; mã hoá Hermite (xem khối đợt 20 R1). in'/out' theo
        // đúng tích phân hợp, không theo công thức tốc độ hằng.
        const exact = twoLevelExact(win, innerCurve, clip, vs, ve);
        out.speedKeyframes = encodeTwoLevelCurve(exact, where);
        delete out.speed;
        let newOut = exact.out;
        if (newOut > clip.out + EPS) newOut = clip.out;
        out.in = exact.in;
        out.out = newOut;
      }
    } else if (!win.isRamp && leafHasCurve) {
      // Đợt 20 R1 — tốc độ ngoài hằng v_o (kể cả curve ngoài hằng đã
      // gộp ở nestedWindow): hợp ĐÚNG HỆT bằng slice curve trong rồi
      // đổi biến tuyến tính t' = y / v_o, v' = v · v_o (easing giữ
      // nguyên vì p không đổi qua đổi biến tuyến tính).
      const innerCurve = validateNestedRamp(clip.speedKeyframes, clip.duration, where);
      const sliced = sliceNestedRampKeyframes(
        innerCurve.keyframes, leftCut, leftCut + (ve - vs));
      if (sliced.length === 0)
        fail(where, "không slice được speedKeyframes của clip con cho " +
          "đoạn khả kiến — đoạn suy biến, không đoán");
      const vo = win.speed;
      const scaled = sliced.map((k) => ({ ...k, t: k.t / vo, v: k.v * vo }));
      for (const k of scaled) {
        if (!isFiniteNumber(k.v) || k.v < SPEED_MIN || k.v > SPEED_MAX)
          fail(where, `tốc độ hợp hai tầng = ${k.v} vượt khoảng ` +
            `${SPEED_MIN}..${SPEED_MAX} (tốc độ ngoài hằng ${vo} × tốc độ trong) ` +
            "— giảm tốc độ ngoài hoặc biên độ curve trong rồi render lại");
      }
      scaled[scaled.length - 1].t = newDuration;
      out.speedKeyframes = { keyframes: normalizeSpeedKeyframes(scaled) };
      delete out.speed;
      const newIn = clip.in + integrateSpeed(innerCurve, 0, leftCut);
      let newOut = newIn + integrateSpeed(innerCurve, leftCut, leftCut + (ve - vs));
      if (newOut > clip.out + EPS) newOut = clip.out;
      out.in = newIn;
      out.out = newOut;
    } else if (win.isRamp) {
      const newIn = clip.in + leftCut * clipSpeed;
      // Lá thành clip ramp tổng hợp (spec đợt 18 §3): tốc độ hiệu dụng
      // theo thời gian output là c·s(t) nên curve lá = slice của curve
      // lồng nhau trên đoạn output của lá, nhân v với c. ∫ của curve lá
      // trên duration' bằng đúng c·(ve − vs) theo định nghĩa của τ nên
      // render ramp thường cho đúng đoạn nguồn; speed hằng bị xóa vì
      // curve đã chứa c (giữ lại chỉ gây warning ở validator).
      const leafOuterStart = outer.start;
      const leafOuterEnd = outer.start + outer.duration;
      const sliced = sliceNestedRampKeyframes(
        win.speedKeyframes.keyframes, leafOuterStart, leafOuterEnd);
      if (sliced.length === 0)
        fail(where, "không slice được speedKeyframes của clip lồng nhau cho " +
          "đoạn output của clip con — đoạn suy biến, không đoán");
      out.speedKeyframes = { keyframes: scaleRampKeyframes(sliced, clipSpeed, where) };
      delete out.speed;
      let newOut = newIn + clipSpeed * (ve - vs);
      if (newOut > clip.out + EPS) newOut = clip.out; // không vượt quá đoạn nguồn gốc
      out.in = newIn;
      out.out = newOut;
    } else {
      const newIn = clip.in + leftCut * clipSpeed;
      const newSpeed = clipSpeed * win.speed;
      let newOut = newIn + newDuration * newSpeed;
      if (newOut > clip.out + EPS) newOut = clip.out; // không vượt quá đoạn nguồn gốc
      out.in = newIn;
      out.out = newOut;
      if (win.speed !== 1) out.speed = newSpeed;
    }
    // Audio fade rút ngắn theo phần bị cắt (giữ hình dạng fade, không
    // scale — như cũ; phần cắt đo bằng thời gian output qua τ nên với
    // tốc độ hằng rút gọn đúng về leftCut/speed cũ).
    if (clip.kind === "audio") {
      const leftOut = outer.start - mapChildOffset(win, s - win.in);
      const rightOut = mapChildOffset(win, e - win.in) - (outer.start + outer.duration);
      if (isFiniteNumber(clip.fadeIn) && clip.fadeIn > 0)
        out.fadeIn = Math.max(0, clip.fadeIn - leftOut);
      if (isFiniteNumber(clip.fadeOut) && clip.fadeOut > 0)
        out.fadeOut = Math.max(0, clip.fadeOut - rightOut);
    }
  }
  // Cắt phải: bỏ keyframe/điểm/track word vượt quá duration mới.
  if (rightCut > EPS) trimTimedFields(out, newDuration, warnings, where);
  return out;
}

/** Type transition duy nhất nối được qua biên clip lồng nhau (R3). */
const BOUNDARY_TRANSITION_TYPE = "fade";

/**
 * Đọc 1 field transition của clip: null khi vắng, type "none", hoặc
 * duration <= EPS (trường hợp này coi như không có transition, khớp
 * validator phẳng — cặp chỉ hình thành khi duration > EPS).
 */
function transField(clip, key) {
  const v = clip[key];
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  if (typeof v.type !== "string" || v.type === "none") return null;
  if (!isFiniteNumber(v.duration) || v.duration <= EPS) return null;
  return { type: v.type, duration: v.duration };
}

/** Clip có phải adjustment layer không (không tham gia transition). */
function isAdjustmentLike(clip) {
  return typeof clip === "object" && clip !== null && !Array.isArray(clip) &&
    (clip.kind === "adjustment" ||
      (typeof clip.adjustment === "object" && clip.adjustment !== null &&
        !Array.isArray(clip.adjustment)));
}

/**
 * R3: resolve transition qua biên trên MỘT track.
 *
 * Một "cặp biên" là cặp (A, B) kề nhau trên track mà ít nhất một đầu là
 * clip lồng nhau, định nghĩa bởi A.transitionOut và/hoặc B.transitionIn.
 * Cặp phẳng (cả hai đầu đều là clip phẳng) KHÔNG đụng tới — validator +
 * xfade của render.js xử lý, kể cả khi cặp phẳng đó nằm cạnh cặp biên.
 *
 * Quy tắc (vi phạm → throw, trừ trường hợp ghi rõ là warning):
 *  - Hai đầu cùng khai: duration phải bằng nhau (EPS) và type phải bằng
 *    nhau, nếu không throw (mơ hồ — không đoán đầu nào thắng).
 *  - Type hiệu dụng phải là "fade": fade opacity là cơ chế duy nhất nối
 *    được qua biên (hai đầu không còn cùng track nên không xfade được).
 *  - T <= duration của cả hai đầu (clip lồng nhau tính theo duration ngoài).
 *  - Clip lồng nhau vừa là đầu phải vừa là đầu trái của cặp biên → throw
 *    (dịch sớm + fade-out trên cùng sequence tạo gap/fade không trọn).
 *  - Clip phẳng là đầu phải của cặp biên (bị dịch sớm T) mà còn dính bất
 *    kỳ cặp nào khác (làm đầu trái của cặp biên/phẳng, hoặc đầu phải của
 *    cặp phẳng) → throw: validator phẳng yêu cầu kề nhau nên cặp khác vỡ,
 *    và cửa sổ fade dính gap.
 *  - Clip phẳng là đầu trái của cặp biên mà đã là đầu phải của cặp phẳng
 *    với clip kề trước → throw: unit phẳng kết thúc sớm T_f nên cửa sổ
 *    fade luôn dính đoạn đen cuối (gap của xfade phẳng) → pop.
 *  - Không có clip kề trước nhưng có transitionIn: warning + bỏ qua (khớp
 *    validator phẳng cho clip đầu track). Clip kề trước tồn tại nhưng
 *    không kề (gap) → throw (transition yêu cầu nối tiếp nhau).
 *  - Track không phải video: warning + bỏ qua toàn bộ cặp biên (giữ hành
 *    vi cũ — field biến mất cùng clip lồng nhau, không throw để không vỡ
 *    project cũ chỉ có field thừa). Opacity thì không bị chặn ở đây (áp
 *    theo lá, xem applyNestedLeafVisual).
 *
 * Trả về:
 *  - nestedInfo: Map clip lồng nhau → { shiftIn, fadeIn, fadeOut } (giây,
 *    thời gian timeline ngoài): shiftIn/fadeIn cho đầu phải lồng nhau
 *    (dịch sớm + fade-in), fadeOut cho đầu trái lồng nhau khi đầu phải
 *    là clip phẳng (fade-out; đầu phải lồng nhau thì chỉ fade-in phía
 *    trên là đủ dissolve nên đầu trái không fade).
 *  - plainShift: Map clip phẳng (đầu phải cặp biên) → T (giây dịch sớm).
 *  - stripOut: Set clip phẳng (đầu trái cặp biên) mà transitionOut đã bị
 *    cặp biên tiêu thụ — caller phải xóa field để validator phẳng không
 *    ghép nhầm với clip kề sau trên track ngoài.
 *  - warnings: mảng warning (clip đầu track, track không phải video).
 * Hàm này KHÔNG sửa clip (trừ việc đọc): mọi mutation do caller áp.
 */
function resolveTrackBoundaries(track, label) {
  const nestedInfo = new Map();
  const plainShift = new Map();
  const stripOut = new Set();
  const warnings = [];
  const clips = Array.isArray(track.clips) ? track.clips : [];
  const hasWindow = (c) => typeof c === "object" && c !== null &&
    !Array.isArray(c) && isFiniteNumber(c.start) &&
    isFiniteNumber(c.duration) && c.duration > 0;
  const tw = `${label} / track "${track.id}"`;
  if (track.kind !== "video") {
    // Cảnh báo khi transition nằm trên clip lồng nhau hoặc kề nó (tức là
    // cặp biên tiềm năng): cặp biên trên track này bị bỏ qua, còn field
    // trên clip phẳng không kề nested thì không liên quan nên không báo.
    for (const c of clips) {
      if (!isNestedClip(c) || !isFiniteNumber(c.start) ||
          !isFiniteNumber(c.duration)) continue;
      const own = transField(c, "transitionIn") || transField(c, "transitionOut");
      const prevHas = clips.some((o) => o !== c && isFiniteNumber(o.start) &&
        isFiniteNumber(o.duration) &&
        Math.abs(o.start + o.duration - c.start) <= EPS &&
        transField(o, "transitionOut"));
      const nextHas = clips.some((o) => o !== c && isFiniteNumber(o.start) &&
        Math.abs(o.start - (c.start + c.duration)) <= EPS &&
        transField(o, "transitionIn"));
      if (own || prevHas || nextHas)
        warnings.push(`${tw}: clip lồng nhau "${c.id}" có transition qua biên ` +
          "nhưng track không phải video — bỏ qua transition qua biên (chỉ hỗ trợ track video)");
    }
    return { nestedInfo, plainShift, stripOut, warnings };
  }
  const pairs = [];
  const flatPairs = [];
  for (const b of clips) {
    if (!hasWindow(b) || isAdjustmentLike(b)) continue;
    const inB = transField(b, "transitionIn");
    const prevCands = clips.filter((c) => c !== b && hasWindow(c) &&
      Math.abs(c.start + c.duration - b.start) <= EPS);
    const outPs = prevCands.map((c) => transField(c, "transitionOut"))
      .filter((t) => t !== null);
    if (!inB && outPs.length === 0) continue;
    if (prevCands.length > 1)
      fail(tw, `nhiều clip kết thúc đúng lúc clip "${b.id}" bắt đầu — ` +
        "không xác định được đầu trái của transition (clip chồng lấn nhau)");
    if (prevCands.length === 0) {
      const hasEarlier = clips.some((c) => c !== b && hasWindow(c) &&
        c.start + c.duration < b.start - EPS);
      if (hasEarlier)
        fail(tw, `clip "${b.id}" có transition nhưng clip kề trước không kết ` +
          `thúc đúng lúc ${b.start}s — transition yêu cầu 2 clip nối tiếp nhau`);
      warnings.push(`${tw}: clip "${b.id}" có transitionIn nhưng là clip đầu ` +
        "track — transition bị bỏ qua");
      continue;
    }
    const prev = prevCands[0];
    if (isAdjustmentLike(prev)) continue;
    const outP = outPs[0] || null;
    if (!isNestedClip(prev) && !isNestedClip(b)) {
      flatPairs.push({ from: prev, to: b });
      continue; // cặp phẳng — validator + xfade xử lý, không đụng
    }
    if (inB && outP) {
      if (Math.abs(inB.duration - outP.duration) > EPS)
        fail(tw, `transitionOut (${outP.duration}s) của clip "${prev.id}" và ` +
          `transitionIn (${inB.duration}s) của clip "${b.id}" không khớp nhau ` +
          "— chỉ đặt một trong hai, hoặc đặt bằng nhau");
      if (inB.type !== outP.type)
        fail(tw, `transitionOut (${outP.type}) của clip "${prev.id}" và ` +
          `transitionIn (${inB.type}) của clip "${b.id}" không khớp type ` +
          "— transition qua biên yêu cầu cùng type");
    }
    const eff = inB || outP;
    if (eff.type !== BOUNDARY_TRANSITION_TYPE)
      fail(tw, `transition qua biên clip lồng nhau ("${prev.id}" → "${b.id}") ` +
        `chỉ hỗ trợ type "fade", nhận được: "${eff.type}" — dùng "fade" hoặc bỏ transition`);
    const T = eff.duration;
    if (T > prev.duration + EPS)
      fail(tw, `transition (${T}s) dài hơn clip "${prev.id}" (${prev.duration}s)`);
    if (T > b.duration + EPS)
      fail(tw, `transition (${T}s) dài hơn clip "${b.id}" (${b.duration}s)`);
    pairs.push({ from: prev, to: b, T });
  }
  // Kiểm tra chéo giữa các cặp.
  const asFrom = new Map();
  for (const p of pairs) asFrom.set(p.from, p);
  for (const p of pairs) {
    const n = p.to;
    if (isNestedClip(n) && asFrom.has(n))
      fail(tw, `clip lồng nhau "${n.id}" vừa có transition qua biên ở cả ` +
        "hai đầu (in + out) — chưa hỗ trợ 2 transition qua biên trên cùng một clip lồng nhau");
    if (!isNestedClip(n) &&
        (asFrom.has(n) || flatPairs.some((fp) => fp.from === n || fp.to === n)))
      fail(tw, `clip "${n.id}" bị dịch sớm ${p.T}s bởi transition qua biên ` +
        "nên không giữ được transition khác — chưa hỗ trợ 2 transition liên tiếp qua biên");
  }
  for (const p of pairs) {
    const a = p.from;
    if (isNestedClip(a)) continue;
    const ppCands = clips.filter((c) => c !== a && hasWindow(c) &&
      Math.abs(c.start + c.duration - a.start) <= EPS);
    if (ppCands.length !== 1) continue;
    const pp = ppCands[0];
    if (isNestedClip(pp)) continue; // trường hợp này đã chặn ở vòng trên
    if (flatPairs.some((fp) => fp.from === pp && fp.to === a))
      fail(tw, `clip "${a.id}" đã có transition phẳng với clip kề trước ` +
        "nên transition qua biên của nó luôn dính đoạn đen cuối (gap của xfade " +
        "phẳng) — bỏ transition phẳng hoặc transition qua biên");
  }
  // Áp dụng vào bản đồ (caller mới sửa clip).
  for (const p of pairs) {
    if (!isNestedClip(p.from) && transField(p.from, "transitionOut"))
      stripOut.add(p.from);
    if (!isNestedClip(p.to)) {
      plainShift.set(p.to, p.T);
    } else {
      const cur = nestedInfo.get(p.to) || { shiftIn: 0, fadeIn: 0, fadeOut: 0 };
      cur.shiftIn = p.T;
      cur.fadeIn = p.T;
      nestedInfo.set(p.to, cur);
    }
    if (isNestedClip(p.from) && !isNestedClip(p.to)) {
      const cur = nestedInfo.get(p.from) || { shiftIn: 0, fadeIn: 0, fadeOut: 0 };
      cur.fadeOut = p.T;
      nestedInfo.set(p.from, cur);
    }
  }
  return { nestedInfo, plainShift, stripOut, warnings };
}

/**
 * R3: áp opacity kế thừa + fade transition qua biên cho 1 clip lá đã ánh xạ
 * qua cửa sổ (m đã có start/duration ngoài, CHƯA dịch shiftIn — keyframes
 * tính theo thời gian local nên dịch start không ảnh hưởng).
 *
 * @param {object} m clip lá đã map (sẽ bị sửa: opacity/animations).
 * @param {object} orig clip lá gốc trước khi map (để tính cắt trái).
 * @param {object} win cửa sổ clip lồng nhau ({ start, duration, in, opacity }).
 * @param {object} info { shiftIn, fadeIn, fadeOut } của clip lồng nhau này.
 * @param {string} where nhãn lỗi.
 * @returns {boolean} true khi đã áp gì đó (để caller đếm lá hình).
 *
 * Quy tắc:
 *  - Audio: bỏ qua hoàn toàn (không có khái niệm opacity; transition video
 *    không crossfade audio — khớp hành vi transition phẳng).
 *  - Fade-in (đầu phải lồng nhau, lá bắt đầu đúng đầu cửa sổ): keyframes
 *    opacity local [{0, 0}, {T, effOp}]. Lá bị cửa sổ cắt trái → throw
 *    (dịch sớm sẽ lộ nội dung trước cửa sổ). Lá kind image/sticker →
 *    throw (render không áp opacity keyframes cho 2 kind này nên fade sẽ
 *    thành cắt cứng — fail fast thay vì giả vờ blend). Lá mang keyframes
 *    opacity sẵn, transition trong project con, hoặc ngắn hơn T → throw.
 *  - Fade-out (đầu trái lồng nhau, đầu phải phẳng, lá kết thúc đúng cuối
 *    cửa sổ): keyframes local [{d-T, effOp}, {d, 0}] (d = duration lá).
 *    Lá bị cắt phải vẫn fade được (nội dung đuôi đã hiện sẵn) nên không
 *    chặn cắt phải.
 *  - Không fade: opacity lồng nhau < 1 thì nhân vào opacity tĩnh và từng
 *    giá trị keyframes opacity (nếu có). effOp = opacity lá × opacity
 *    lồng nhau; fade dùng effOp làm đầu/cuối ramp nên không nhân đôi.
 */
function applyNestedLeafVisual(m, orig, win, info, where) {
  if (m.kind === "audio") return false;
  const isFadeIn = info.fadeIn > EPS && Math.abs(m.start - win.start) <= EPS;
  const isFadeOut = !isFadeIn && info.fadeOut > EPS &&
    Math.abs((m.start + m.duration) - (win.start + win.duration)) <= EPS;
  const leafStatic = isFiniteNumber(m.opacity) ? m.opacity : 1;
  const nestedOp = win.opacity === undefined ? 1 : win.opacity;
  const effOp = leafStatic * nestedOp;
  const hasOpKf = m.animations && typeof m.animations === "object" &&
    m.animations.opacity && typeof m.animations.opacity === "object" &&
    Array.isArray(m.animations.opacity.keyframes);
  if (isFadeIn || isFadeOut) {
    const T = isFadeIn ? info.fadeIn : info.fadeOut;
    if (m.kind !== "video" && m.kind !== "text")
      fail(where, `clip lá "${m.id}" (kind ${m.kind}) nằm ở biên transition ` +
        "qua biên nhưng render không áp opacity keyframes cho kind này — " +
        "transition qua biên chỉ hỗ trợ clip lá video/text ở biên");
    if (hasOpKf)
      fail(where, `clip lá "${m.id}" vừa có keyframes opacity vừa dính ` +
        "transition qua biên — chưa hỗ trợ gộp fade biên với keyframes opacity sẵn có");
    if (m.duration < T - EPS)
      fail(where, `clip lá "${m.id}" dài ${m.duration}s, ngắn hơn transition ` +
        `qua biên ${T}s — transition phải <= độ dài clip lá ở biên`);
    if (transField(m, "transitionIn") || transField(m, "transitionOut"))
      fail(where, `clip lá "${m.id}" vừa có transition trong project con vừa ` +
        "dính transition qua biên — chưa hỗ trợ gộp 2 transition trên cùng clip lá");
    if (isFadeIn) {
      const leftCut = Math.max(0, win.in - orig.start);
      if (leftCut > EPS)
        fail(where, `clip lá "${m.id}" bị cửa sổ clip lồng nhau cắt trái nên ` +
          "không giữ được transition qua biên — dời clip lá về đúng đầu cửa sổ hoặc bỏ transition");
      m.animations = { ...(m.animations || {}),
        opacity: { keyframes: [{ t: 0, v: 0, easing: "linear" },
          { t: T, v: effOp, easing: "linear" }] } };
    } else {
      const d = m.duration;
      m.animations = { ...(m.animations || {}),
        opacity: { keyframes: [{ t: d - T, v: effOp, easing: "linear" },
          { t: d, v: 0, easing: "linear" }] } };
    }
    m.opacity = effOp;
    return true;
  }
  if (nestedOp < 1 - EPS) {
    if (hasOpKf) {
      // Keyframes thắng tuyệt đối static (khớp render.js + validator):
      // chỉ scale giá trị keyframes, giữ nguyên static (đang bị bỏ qua).
      for (const kf of m.animations.opacity.keyframes) {
        if (kf && isFiniteNumber(kf.v)) kf.v = kf.v * nestedOp;
      }
    } else {
      m.opacity = effOp;
    }
    return true;
  }
  return false;
}

/**
 * Làm phẳng một spec (đã clone) — hàm đệ quy nội bộ.
 * ancestors: Set các object subSpec trên đường đi hiện tại (phát hiện vòng lặp).
 */
function flattenInner(spec, depth, ancestors, warnings, stats, usedClipIds, usedTrackIds, label, maxDepth, seenLayerIds) {
  if (depth > maxDepth)
    fail(label, `vượt quá độ sâu lồng nhau tối đa ${maxDepth}`);
  if (typeof spec !== "object" || spec === null || !Array.isArray(spec.tracks))
    fail(label, "project con phải là object có mảng tracks");
  // Đợt 7 U2: layer thu thập của level này, theo thứ tự áp (trong trước,
  // ngoài sau). Mỗi layer mang thêm field nội bộ _scopeTrackIds: null =
  // mọi track của level nó sinh ra, hoặc mảng track id (lineage) mà nó áp;
  // flattenSpecForRender đổi field này thành tracks (chỉ số) ở cuối.
  const levelLayers = [];
  // Lineage: track id của level này → tập track id phẳng sinh ra từ nó
  // (chính nó + mọi track lá từ clip lồng nhau trên nó). Dùng để dịch
  // scope tracks của layer level này (xem cuối hàm).
  const lineage = new Map();
  const outTracks = [];
  for (const track of spec.tracks) {
    if (typeof track !== "object" || track === null || !Array.isArray(track.clips)) {
      outTracks.push(track);
      if (typeof track.id === "string") lineage.set(track.id, new Set([track.id]));
      continue;
    }
    if (typeof track.id === "string") lineage.set(track.id, new Set([track.id]));
    const plainClips = [];
    const nestedClips = [];
    for (const clip of track.clips) {
      if (isNestedClip(clip)) nestedClips.push(clip);
      else plainClips.push(clip);
    }
    // Track ngoài giữ lại (kể cả khi rỗng) — id và thứ tự không đổi.
    outTracks.push({ ...track, clips: plainClips });
    for (const clip of plainClips) {
      if (typeof clip.id === "string") usedClipIds.add(clip.id);
    }
    if (typeof track.id === "string") usedTrackIds.add(track.id);

    // R3: transition qua biên trên track này (chỉ track video mới có cặp
    // biên; track khác chỉ cảnh báo). Clip phẳng ở đây là clone của spec
    // gốc nên sửa trực tiếp được (shift start, strip field đã tiêu thụ).
    const boundary = resolveTrackBoundaries(track, label);
    for (const w of boundary.warnings) warnings.push(w);
    for (const clip of boundary.stripOut) {
      if (clip.transitionOut) delete clip.transitionOut;
    }
    for (const [clip, shift] of boundary.plainShift) {
      clip.start -= shift;
      if (clip.transitionIn) delete clip.transitionIn;
    }

    for (const nested of nestedClips) {
      const where = `${label} / track "${track.id}" / clip lồng nhau "${nested.id}"`;
      const sub = nestedSubSpec(nested);
      if (!sub) fail(where, 'kind "nested" nhưng không có subSpec/nested chứa tracks');
      if (ancestors.has(sub))
        fail(where, "vòng lặp: project con chứa chính nó (theo object identity)");
      const win = nestedWindow(nested, where, warnings);
      // R3: thông tin biên (shift/fade) của clip lồng nhau này trên track ngoài.
      const bInfo = boundary.nestedInfo.get(nested) ||
        { shiftIn: 0, fadeIn: 0, fadeOut: 0 };
      // Đếm clip lá để cảnh báo khi opacity không áp được cho lá nào.
      let totalLeaves = 0;
      let visualLeaves = 0;
      stats.nestedClips += 1;
      const nextAncestors = new Set(ancestors);
      nextAncestors.add(sub);
      // Làm phẳng project con trước (theo gốc thời gian của nó), rồi mới
      // ánh xạ qua cửa sổ của clip cha — hợp thành nhiều cấp là đúng.
      const flatSubResult = flattenInner(sub, depth + 1, nextAncestors, warnings,
        stats, new Set(), new Set(), `${where} (project con)`, maxDepth, seenLayerIds);
      const flatSub = flatSubResult.spec;
      const subLayers = flatSubResult.layers;
      // Đợt 7 U2: bản đồ track phẳng của project con → track phẳng mới do
      // clip lồng nhau này sinh ra, và danh sách track mới đó (dùng để
      // dịch scope của layer thu thập, xem sau vòng lặp subTrack).
      const trackIdMap = new Map();
      const expansionTrackIds = [];
      // usedClipIds/usedTrackIds của spec ngoài được dùng chung để phát hiện
      // đụng id giữa các đợt mở rộng; flatSub dùng set riêng vì các track
      // con sẽ được đổi id trước khi gộp (không đụng track ngoài).
      for (const subTrack of flatSub.tracks) {
        if (typeof subTrack !== "object" || subTrack === null ||
            !Array.isArray(subTrack.clips)) continue;
        // Ánh xạ từng clip con qua cửa sổ.
        const mapped = [];
        for (const c of subTrack.clips) {
          const m = mapClip(c, win, warnings);
          if (m) mapped.push(m);
          else stats.droppedClips += 1;
        }
        if (mapped.length === 0) continue; // track con trống sau khi cắt → bỏ
        // Sửa transition bị cửa sổ phá vỡ: cặp chỉ còn nguyên khi cả hai đầu
        // còn đó, không bị cắt, và vẫn kề nhau sau ánh xạ (ánh xạ qua τ
        // liên tục nên cặp nguyên vẹn tự kề nhau). Đầu còn lại của cặp vỡ
        // thì strip transition + warning (hard cut thay vì crossfade).
        const origById = new Map();
        for (const c of subTrack.clips) origById.set(c.id, c);
        const mappedById = new Map();
        for (const m of mapped) mappedById.set(m.id, m);
        for (let i = 0; i + 1 < subTrack.clips.length; i++) {
          const a = subTrack.clips[i];
          const b = subTrack.clips[i + 1];
          const hasPair = (a.transitionOut && a.transitionOut.type !== "none") ||
            (b.transitionIn && b.transitionIn.type !== "none");
          if (!hasPair) continue;
          const ma = mappedById.get(a.id);
          const mb = mappedById.get(b.id);
          // "Không bị cắt" = mapped khớp đúng ánh xạ của toàn bộ clip gốc
          // (dùng mapChildInterval nên đúng cả tốc độ hằng lẫn ramp).
          const expA = mapChildInterval(win, a.start, a.start + a.duration);
          const expB = mapChildInterval(win, b.start, b.start + b.duration);
          const aCut = ma && (Math.abs(ma.start - (win.start + expA.start)) > EPS ||
            Math.abs(ma.duration - expA.duration) > EPS);
          const bCut = mb && (Math.abs(mb.start - (win.start + expB.start)) > EPS ||
            Math.abs(mb.duration - expB.duration) > EPS);
          const adjacent = ma && mb &&
            Math.abs(mb.start - (ma.start + ma.duration)) <= EPS;
          if (ma && mb && !aCut && !bCut && adjacent) {
            // Cặp nguyên vẹn: đổi thời lượng transition sang thời gian
            // output. Tốc độ hằng: / speed (như cũ). Ramp: T' =
            // τ(X) − τ(X − T) với X = biên con (đầu clip B) — vì render
            // phẳng dịch B sớm T' giây và ∫ curve trên đoạn dịch đó bằng
            // đúng T giây con (xem spec đợt 18 §4). Mỗi field tự tính
            // theo duration của nó để lệch cặp (nếu có) vẫn lộ ra ở
            // validator phẳng thay vì bị giấu.
            if (win.isRamp) {
              const xOff = b.start - win.in;
              for (const [m, key] of [[ma, "transitionOut"], [mb, "transitionIn"]]) {
                if (m[key] && isFiniteNumber(m[key].duration)) {
                  const tOut = mapChildOffset(win, xOff) -
                    mapChildOffset(win, xOff - m[key].duration);
                  m[key] = { ...m[key], duration: tOut };
                }
              }
            } else if (win.speed !== 1) {
              for (const [m, key] of [[ma, "transitionOut"], [mb, "transitionIn"]]) {
                if (m[key] && isFiniteNumber(m[key].duration))
                  m[key] = { ...m[key], duration: m[key].duration / win.speed };
              }
            }
            continue;
          }
          for (const m of [ma, mb]) {
            if (!m) continue;
            if (m.transitionOut) delete m.transitionOut;
            if (m.transitionIn) delete m.transitionIn;
          }
          warnings.push(`${where}: transition giữa "${a.id}" và "${b.id}" bị cửa sổ ` +
            "clip lồng nhau phá vỡ → bỏ transition, render hard cut");
        }
        // R3: opacity kế thừa + fade transition qua biên cho từng clip lá.
        // Chạy SAU khi strip cặp vỡ: clip lá còn transition sau strip mới
        // tính là dính transition trong (cặp đã vỡ thì fade được). Dịch
        // shiftIn áp sau khi tính fade (keyframes theo local time nên
        // không bị ảnh hưởng bởi dịch start).
        for (const m of mapped) {
          const orig = origById.get(m.id);
          if (orig) {
            totalLeaves += 1;
            if (m.kind !== "audio") visualLeaves += 1;
            applyNestedLeafVisual(m, orig, win, bInfo, where);
          }
          if (bInfo.shiftIn > EPS) m.start -= bInfo.shiftIn;
        }
        // Đổi id clip khi đụng id đã có (cùng subSpec dùng 2 lần).
        const rename = new Map();
        for (const m of mapped) {
          if (usedClipIds.has(m.id)) {
            let base = `${nested.id}:${m.id}`;
            let cand = base;
            let k = 2;
            while (usedClipIds.has(cand)) cand = `${base}:${k++}`;
            rename.set(m.id, cand);
          }
        }
        for (const m of mapped) {
          if (rename.has(m.id)) m.id = rename.get(m.id);
          usedClipIds.add(m.id);
        }
        // Viết lại captionOf trỏ trong cùng đợt mở rộng.
        if (rename.size > 0) {
          for (const m of mapped) {
            if (m.captionOf && typeof m.captionOf.clipId === "string" &&
                rename.has(m.captionOf.clipId)) {
              m.captionOf = { ...m.captionOf, clipId: rename.get(m.captionOf.clipId) };
            }
          }
        }
        // Track phẳng mới, chèn ngay sau track ngoài.
        let newTrackId = `${nested.id}__${subTrack.id}`;
        {
          let cand = newTrackId;
          let k = 2;
          while (usedTrackIds.has(cand)) cand = `${newTrackId}:${k++}`;
          newTrackId = cand;
        }
        usedTrackIds.add(newTrackId);
        // Đợt 7 U2: ghi bản đồ track con → track mới (dịch scope layer)
        // và lineage của track ngoài chứa clip lồng nhau này.
        trackIdMap.set(subTrack.id, newTrackId);
        expansionTrackIds.push(newTrackId);
        if (typeof track.id === "string" && lineage.has(track.id))
          lineage.get(track.id).add(newTrackId);
        const volOuter = track.volume;
        const volSub = subTrack.volume;
        const newVolume = (isFiniteNumber(volOuter) && isFiniteNumber(volSub))
          ? volOuter * volSub
          : (isFiniteNumber(volOuter) ? volOuter : volSub);
        const newTrack = {
          ...subTrack,
          id: newTrackId,
          clips: mapped,
          hidden: Boolean(track.hidden) || Boolean(subTrack.hidden),
          muted: Boolean(track.muted) || Boolean(subTrack.muted),
        };
        if (newVolume !== undefined) newTrack.volume = newVolume;
        else delete newTrack.volume;
        if (subTrack.label !== undefined) newTrack.label = subTrack.label;
        outTracks.push(newTrack);
      }
      // Đợt 7 U2: thu thập adjustment layer của project con. Thứ tự:
      // layer trong nối TRƯỚC layer của level này (level này nối sau, ở
      // cuối flattenInner) nên layer trong áp trước, layer ngoài áp sau.
      // Thời gian giao cửa sổ nested rồi ánh xạ như clip (qua τ từ đợt
      // 18 — với tốc độ hằng τ tuyến tính nên đúng công thức cũ); scope
      // thu hẹp về đúng track lá do clip này sinh ra (layer không scope
      // trong project con = mọi track lá của chính clip này, KHÔNG lan
      // sang clip ngoài — clip ngoài không nằm trong expansionTrackIds).
      for (const layer of subLayers) {
        const ls = layer.start;
        const le = layer.start + layer.duration;
        const winStart = win.in;
        const winEnd = win.isRamp ? win.in + rampTotalConsumed(win) : win.in + win.duration * win.speed;
        const vs = Math.max(ls, winStart);
        const ve = Math.min(le, winEnd);
        if (ve - vs <= EPS) {
          stats.droppedLayers += 1;
          warnings.push(`${where}: adjustment layer "${layer.id}" trong project con ` +
            "nằm ngoài cửa sổ clip lồng nhau — bỏ qua (không áp cho clip nào)");
          continue;
        }
        let scopeIds;
        if (layer._scopeTrackIds === null) {
          scopeIds = [...expansionTrackIds];
        } else {
          scopeIds = layer._scopeTrackIds
            .map((id) => trackIdMap.get(id)).filter((id) => id !== undefined);
        }
        if (scopeIds.length === 0) {
          stats.droppedLayers += 1;
          warnings.push(`${where}: adjustment layer "${layer.id}" trong project con ` +
            "chỉ áp cho track đã bị cửa sổ cắt hết — bỏ qua");
          continue;
        }
        const { _scopeTrackIds, ...rest } = layer;
        const layerOuter = mapChildInterval(win, vs, ve);
        levelLayers.push({
          ...rest,
          start: win.start + layerOuter.start,
          duration: layerOuter.duration,
          _scopeTrackIds: scopeIds,
        });
      }
      if (win.opacity < 1 && totalLeaves > 0 && visualLeaves === 0)
        warnings.push(`${where}: opacity=${win.opacity} trên clip lồng nhau ` +
          "không áp được cho clip lá nào (chỉ có clip audio) — opacity chỉ có tác dụng với clip hình");
    }
  }
  // Đợt 7 U2: layer của chính level này, nối SAU layer trong (áp sau = ở
  // ngoài cùng). Scope tracks (chỉ số trong spec.tracks của level) đổi
  // thành lineage track id: track đó cộng mọi track lá sinh ra từ clip
  // lồng nhau trên chính track đó, nên layer áp cả clip phẳng lẫn nội
  // dung nested trên cùng track — khớp ngữ nghĩa "layer áp cho track này".
  if (spec.adjustmentLayers !== undefined) {
    if (!Array.isArray(spec.adjustmentLayers))
      fail(label, "adjustmentLayers phải là một mảng (nếu có)");
    for (const layer of spec.adjustmentLayers) {
      const errs = validateAdjustmentLayer(layer);
      if (errs.length > 0)
        fail(label, `adjustment layer "${layer && layer.id}": ${errs.join("; ")}`);
      if (seenLayerIds.has(layer.id))
        fail(label, `trùng id adjustment layer "${layer.id}" — id layer phải ` +
          "duy nhất trong toàn bộ project (kể cả project con)");
      seenLayerIds.add(layer.id);
      let scopeIds = null;
      if (layer.tracks !== undefined) {
        scopeIds = [];
        for (const ti of layer.tracks) {
          if (ti >= spec.tracks.length)
            fail(label, `adjustment layer "${layer.id}": tracks chứa chỉ số ${ti} ` +
              `vượt quá số track của level này (${spec.tracks.length})`);
          const tid = spec.tracks[ti] && spec.tracks[ti].id;
          if (typeof tid !== "string" || tid.length === 0)
            fail(label, `adjustment layer "${layer.id}": track ${ti} không có id ` +
              "— scope theo track yêu cầu track có id");
          const lin = lineage.get(tid);
          if (lin) {
            for (const id of lin) if (!scopeIds.includes(id)) scopeIds.push(id);
          } else {
            scopeIds.push(tid);
          }
        }
      }
      const { tracks, ...rest } = layer;
      levelLayers.push({ ...rest, _scopeTrackIds: scopeIds });
    }
  }
  return { spec: { ...spec, tracks: outTracks }, layers: levelLayers };
}

/**
 * Làm phẳng một video-spec có clip lồng nhau thành spec phẳng.
 * Input không bị sửa (clone sâu trước khi xử lý).
 * @returns {{ spec: object, warnings: string[], stats: { nestedClips: number,
 *   outputClips: number, droppedClips: number, newTracks: number,
 *   droppedLayers: number } }}
 *   (outputClips/newTracks đếm trên spec phẳng cuối; nestedClips/droppedClips
 *   cộng dồn qua các cấp mở rộng. Đợt 7 U2: spec phẳng cuối mang
 *   adjustmentLayers đã gộp — layer trong project con (offset thời gian,
 *   scope thu hẹp về track lá) nối TRƯỚC layer ngoài; droppedLayers đếm
 *   layer trong bị cửa sổ cắt hết hoặc mất hết track đích. Field
 *   _scopeTrackIds nội bộ bị lược bỏ trước khi trả về: layer không scope
 *   thì không có field tracks, layer có scope thì tracks là chỉ số trong
 *   spec phẳng cuối này — đúng thứ tự render.js dựng graph.)
 * @throws Error khi gặp vòng lặp, quá sâu, hoặc tổ hợp chưa hỗ trợ.
 */
function flattenSpecForRender(spec, opts = {}) {
  const maxDepth = opts.maxDepth === undefined ? NESTED_MAX_DEPTH : opts.maxDepth;
  if (!isFiniteNumber(maxDepth) || maxDepth < 1)
    throw new Error(`nested: maxDepth phải là số >= 1, nhận được: ${maxDepth}`);
  if (typeof spec !== "object" || spec === null || !Array.isArray(spec.tracks))
    throw new Error("nested: spec phải là object có mảng tracks");
  // Clone sâu để không sửa spec gốc của caller (và để mapClip sửa tự do).
  // structuredClone (không phải JSON round-trip) để spec có vòng lặp object
  // in-memory vẫn clone được và bị phát hiện tường minh ở bước sau, thay vì
  // chết bằng lỗi "Converting circular structure" khó hiểu.
  const cloned = structuredClone(spec);
  const warnings = [];
  const stats = { nestedClips: 0, outputClips: 0, droppedClips: 0, newTracks: 0, droppedLayers: 0 };
  const usedClipIds = new Set();
  const usedTrackIds = new Set();
  // flattenInner tự đăng ký id khi đi qua từng track; nhưng để phát hiện
  // đụng id giữa clip phẳng ngoài và clip con, cần seed trước toàn bộ id
  // clip phẳng ngoài (không tính clip lồng nhau vì chúng biến mất).
  for (const t of cloned.tracks) {
    if (!t || !Array.isArray(t.clips)) continue;
    for (const c of t.clips) {
      if (!isNestedClip(c) && typeof c.id === "string") usedClipIds.add(c.id);
    }
  }
  // Seed cả id track ngoài: track mới "${nested}__${sub}" không được đụng
  // id của track ngoài xử lý SAU track chứa clip lồng nhau.
  for (const t of cloned.tracks) {
    if (t && typeof t.id === "string") usedTrackIds.add(t.id);
  }
  const seenLayerIds = new Set();
  const flatResult = flattenInner(cloned, 1, new Set(), warnings, stats,
    usedClipIds, usedTrackIds, "spec gốc", maxDepth, seenLayerIds);
  const flat = flatResult.spec;
  // Stats phản ánh SPEC PHẲNG CUỐI (không cộng dồn qua các cấp đệ quy):
  // outputClips = tổng clip trong spec cuối; newTracks = track cuối mà id
  // không có trong spec gốc (track host của project con bị bỏ không tính).
  // nestedClips (số clip lồng nhau đã mở) và droppedClips (số clip con bị
  // cửa sổ bỏ) giữ dạng cộng dồn vì spec cuối không còn dấu vết của chúng.
  const origTrackIds = new Set(
    cloned.tracks.map((t) => (t && t.id)).filter((id) => typeof id === "string"));
  stats.outputClips = flat.tracks.reduce(
    (n, t) => n + (t && Array.isArray(t.clips) ? t.clips.length : 0), 0);
  stats.newTracks = flat.tracks.filter(
    (t) => t && typeof t.id === "string" && !origTrackIds.has(t.id)).length;
  // Đợt 7 U2: đổi scope lineage track id → chỉ số track trong spec phẳng
  // cuối (thứ tự này mới là thứ tự render.js dựng graph). Layer không
  // scope thì không có field tracks (= mọi track). Layer có scope nhưng
  // không còn track đích nào sau khi phẳng thì bỏ + warning (phòng thủ —
  // đường thu thập ở flattenInner đã bỏ trường hợp này trước đó).
  const finalLayers = [];
  for (const layer of flatResult.layers) {
    if (layer._scopeTrackIds === null) {
      const { _scopeTrackIds, ...rest } = layer;
      finalLayers.push(rest);
      continue;
    }
    const scopeSet = new Set(layer._scopeTrackIds);
    const indices = [];
    flat.tracks.forEach((t, i) => {
      if (t && typeof t.id === "string" && scopeSet.has(t.id)) indices.push(i);
    });
    if (indices.length === 0) {
      stats.droppedLayers += 1;
      warnings.push(`adjustment layer "${layer.id}" không còn track đích nào ` +
        "sau khi làm phẳng — bỏ qua");
      continue;
    }
    const { _scopeTrackIds, ...rest } = layer;
    finalLayers.push({ ...rest, tracks: indices });
  }
  if (finalLayers.length > 0) flat.adjustmentLayers = finalLayers;
  return { spec: flat, warnings, stats };
}

module.exports = {
  EPS,
  NESTED_MAX_DEPTH,
  isNestedClip,
  hasNestedClips,
  flattenSpecForRender,
  // Export cho test (không phải API công khai của render worker).
  _mapClip: mapClip,
  _nestedWindow: nestedWindow,
  _mapChildOffset: mapChildOffset,
  _mapChildInterval: mapChildInterval,
  _sliceNestedRampKeyframes: sliceNestedRampKeyframes,
  // Đợt 20 R1: hàm hợp hai tầng (cho test, không phải API render worker).
  _twoLevelExact: twoLevelExact,
  _encodeTwoLevelCurve: encodeTwoLevelCurve,
  _speedAtDerivative: speedAtDerivative,
  _isConstantCurve: isConstantCurve,
};

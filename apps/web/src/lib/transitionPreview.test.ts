/**
 * transitionPreview.test.ts — Test thật cho mô tả hình học transition
 * preview (Phase 9 đợt 10, luồng V1).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/transitionPreview.test.ts
 *
 * Chỉ test logic thuần trong transitionPreview.ts (không DOM/store).
 * Module này không import tương đối nên chạy được bằng Node trực tiếp;
 * phần transitionClipVisual (previewEngine.ts) test qua route biên dịch
 * trong apps/web/scripts/preview-engine.test.cjs (mục V1).
 * Theo mẫu harness của captionFollow.test.ts.
 */
import {
  barsFadePixelIsBar,
  describeTransition,
  dissolveHash,
  radialGradientWeight,
  radialSoftWeight,
  type ClipRegion,
} from "./transitionPreview.ts";
import {
  dissolvePixelIsB,
  ffmpegDissolveFrand,
} from "./dissolveFrand.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.log(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function approx(a: number, b: number, eps: number, msg: string): void {
  assert(
    Math.abs(a - b) <= eps,
    `${msg} (nhận ${a}, muốn ~${b} ±${eps})`,
  );
}

function rectOf(r: ClipRegion | null): { x: number; y: number; w: number; h: number } {
  assert(r !== null && r.kind === "rect", `muốn rect, nhận ${JSON.stringify(r)}`);
  return r as { x: number; y: number; w: number; h: number };
}

function rectsOf(r: ClipRegion | null): Array<{ x: number; y: number; w: number; h: number }> {
  assert(r !== null && r.kind === "rects", `muốn rects, nhận ${JSON.stringify(r)}`);
  return (r as { rects: Array<{ x: number; y: number; w: number; h: number }> }).rects;
}

function circleOf(r: ClipRegion | null): { cx: number; cy: number; r: number } {
  assert(
    r !== null && (r.kind === "circle" || r.kind === "circle-inverted"),
    `muốn circle, nhận ${JSON.stringify(r)}`,
  );
  return r as { cx: number; cy: number; r: number };
}

const W = 100;
const H = 100;

// --- 1. wipeleft ở p=0.5: cột ngưỡng thuộc A (đo thật đợt 13 C6) ---
// Ở W=100, p=0.5: ngưỡng ti = 50, A = 51 cột (0..50), B = 49 cột
// (51..99) trong không gian tâm điểm: A rộng 51.5, B bắt đầu 51.5
// rộng 48.5. Bản cũ (A/B chia đúng 50/50) sai 1 cột so với render
// FFmpeg built-in (biên strict-gt) — test cũ ghim hình học sai đó,
// nay sửa theo số đo render (1920x1080: lệch đúng 1 cột ở mọi p).
test("wipeleft p=0.5: cột ngưỡng thuộc A, B = 49 cột phải", () => {
  const v = describeTransition("wipeleft", 0.5, W, H);
  assert(v.geometric, "wipeleft phải có hình học");
  const b = rectOf(v.b.region);
  const a = rectOf(v.a.region);
  approx(b.x, 51.5, 1e-9, "B bắt đầu x=51.5 (cột ngưỡng 50 thuộc A)");
  approx(b.w, 48.5, 1e-9, "B rộng 48.5");
  approx(a.x, 0, 1e-9, "A bắt đầu x=0");
  approx(a.w, 51.5, 1e-9, "A rộng 51.5");
  approx(b.x + b.w, W, 1e-9, "B chạm mép phải");
});

// --- 2. circlecrop: bán kính vòng tròn của B tăng đơn điệu theo p ---
test("circlecrop: bán kính B tăng đơn điệu theo p", () => {
  const ps = [0, 0.25, 0.5, 0.75, 1];
  const rs = ps.map((p) => circleOf(describeTransition("circlecrop", p, W, H).b.region).r);
  for (let i = 1; i < rs.length; i++) {
    assert(rs[i] >= rs[i - 1] - 1e-9, `bán kính B giảm tại p=${ps[i]}: ${rs[i]} < ${rs[i - 1]}`);
  }
  approx(rs[0], 0, 1e-9, "p=0 → B chưa hiện");
  approx(rs[4], Math.hypot(50, 50), 1e-9, "p=1 → B phủ hết (r = rMax)");
  // Nửa đầu A co dần (bán kính A giảm đơn điệu), khớp hành vi "đi qua đen".
  const ra = ps.map((p) => circleOf(describeTransition("circlecrop", p, W, H).a.region).r);
  for (let i = 1; i < ra.length; i++) {
    assert(ra[i] <= ra[i - 1] + 1e-9, `bán kính A tăng tại p=${ps[i]}`);
  }
  approx(ra[2], 0, 1e-9, "p=0.5 → A co về 0 (điểm đen giữa)");
});

// --- Đợt 13 C1 + hiệu chuẩn đợt 14 R4: circleopen/circleclose vẽ
// gradient smoothstep thật (không phải cosin như đợt 13 tưởng) ---
function radialOf(r: ClipRegion | null): {
  cx: number; cy: number; rMax: number; mid: number; inverted: boolean;
} {
  assert(
    r !== null && r.kind === "radial-gradient",
    `muốn radial-gradient, nhận ${JSON.stringify(r)}`,
  );
  return r as { cx: number; cy: number; rMax: number; mid: number; inverted: boolean };
}

test("radialGradientWeight: đường smoothstep theo mid, khớp probe FFmpeg", () => {
  // P=0.5 (mid=0.5): w(0)=1, w(0.5)=0.5, w(1)=0 — như cosin tại 3
  // điểm này, nhưng khác ở giữa dải (đợt 14: cosin lệch tới 0.0103).
  approx(radialGradientWeight(0.5, 0), 1, 1e-9, "mid=0.5 rho=0");
  approx(radialGradientWeight(0.5, 0.5), 0.5, 1e-9, "mid=0.5 rho=0.5");
  approx(radialGradientWeight(0.5, 1), 0, 1e-9, "mid=0.5 rho=1");
  // Giữa dải smoothstep ≠ cosin: S(t)=3t²-2t³ (đo thật đợt 14, từng bin).
  // P=0.5, rho=0.25: g=0.25, S=0.15625 → w=0.84375 (cosin cho 0.8536).
  // P=0.5, rho=0.75: g=0.75, S=0.84375 → w=0.15625 (cosin cho 0.1464).
  approx(radialGradientWeight(0.5, 0.25), 0.84375, 1e-9, "mid=0.5 rho=0.25");
  approx(radialGradientWeight(0.5, 0.75), 0.15625, 1e-9, "mid=0.5 rho=0.75");
  // P=0.25 (mid=-0.25): tâm 0.15625 (cosin cũ 0.1464), biên 0.
  approx(radialGradientWeight(-0.25, 0), 0.15625, 1e-9, "mid=-0.25 rho=0");
  approx(radialGradientWeight(-0.25, 0.5), 0, 1e-9, "mid=-0.25 rho=0.5");
  // P=0.75 (mid=1.25): góc 0.84375 (cosin cũ 0.8536).
  approx(radialGradientWeight(1.25, 1), 0.84375, 1e-9, "mid=1.25 rho=1");
  // Clamp ngoài dải: luôn 1 bên trong / 0 bên ngoài.
  approx(radialGradientWeight(2, 0), 1, 1e-9, "mid=2 rho=0");
  approx(radialGradientWeight(-1, 1), 0, 1e-9, "mid=-1 rho=1");
});

test("circleopen: vùng radial-gradient mid=3p-1, A=1-w, B=w", () => {
  const rMax = Math.hypot(50, 50);
  for (const [p, mid] of [[0, -1], [0.25, -0.25], [0.5, 0.5], [0.75, 1.25], [1, 2]] as Array<[number, number]>) {
    const v = describeTransition("circleopen", p, W, H);
    assert(v.geometric, `circleopen p=${p} phải có hình học`);
    const b = radialOf(v.b.region);
    const a = radialOf(v.a.region);
    approx(b.mid, mid, 1e-9, `circleopen p=${p} mid B`);
    approx(a.mid, mid, 1e-9, `circleopen p=${p} mid A`);
    assert(b.inverted === false, `circleopen p=${p}: B dùng w`);
    assert(a.inverted === true, `circleopen p=${p}: A dùng 1-w`);
    approx(b.cx, 50, 1e-9, "cx");
    approx(b.cy, 50, 1e-9, "cy");
    approx(b.rMax, rMax, 1e-9, "rMax");
  }
});

// Đợt 14 R4: tâm/rMax vùng radial-gradient lấy theo phép cắt nguyên
// của FFmpeg — tại kích thước lẻ (73×45) tâm là (36, 22), không phải
// (36.5, 22.5); tại kích thước chẵn hai quy ước trùng nhau (test trên).
test("circleopen/circleclose: tâm cắt nguyên tại kích thước lẻ", () => {
  for (const type of ["circleopen", "circleclose"] as const) {
    const v = describeTransition(type, 0.5, 73, 45);
    const b = radialOf(v.b.region);
    const a = radialOf(v.a.region);
    approx(b.cx, 36, 1e-9, `${type} 73x45 cx`);
    approx(b.cy, 22, 1e-9, `${type} 73x45 cy`);
    approx(b.rMax, Math.hypot(36, 22), 1e-9, `${type} 73x45 rMax`);
    approx(a.cx, 36, 1e-9, `${type} 73x45 cx A`);
    approx(a.cy, 22, 1e-9, `${type} 73x45 cy A`);
    approx(a.rMax, Math.hypot(36, 22), 1e-9, `${type} 73x45 rMax A`);
  }
});

test("circleclose: vùng radial-gradient mid=2-3p, ảnh gương của circleopen", () => {
  for (const [p, mid] of [[0, 2], [0.25, 1.25], [0.5, 0.5], [0.75, -0.25], [1, -1]] as Array<[number, number]>) {
    const v = describeTransition("circleclose", p, W, H);
    assert(v.geometric, `circleclose p=${p} phải có hình học`);
    const b = radialOf(v.b.region);
    const a = radialOf(v.a.region);
    approx(b.mid, mid, 1e-9, `circleclose p=${p} mid B`);
    approx(a.mid, mid, 1e-9, `circleclose p=${p} mid A`);
    assert(b.inverted === true, `circleclose p=${p}: B dùng 1-w`);
    assert(a.inverted === false, `circleclose p=${p}: A dùng w`);
  }
  // Đồng nhất thức gương thời gian: w_close(rho,P) = 1 - w_open(rho,1-P).
  // Lớp B của close = 1-w(mid=2-3P); lớp B của open tại 1-P = w(mid=2-3P).
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    for (const rho of [0, 0.25, 0.5, 0.75, 1]) {
      const closeB = 1 - radialGradientWeight(2 - 3 * p, rho);
      const openB = radialGradientWeight(3 * (1 - p) - 1, rho);
      approx(closeB, 1 - openB, 1e-9, `gương p=${p} rho=${rho}`);
    }
  }
});

// --- Đợt 12 T2: 14 type V3 có hình học (trước đó fallback fade) ---
test("V3: diamondclose/squareopen/squareclose đúng hình học expr", () => {
  // diamondclose p=0.5: A là thoi r = (1-p)*(W+H)/2 = 50, 4 đỉnh.
  const dc = describeTransition("diamondclose", 0.5, W, H);
  assert(dc.geometric, "diamondclose phải có hình học");
  const dcPoly = dc.b.region;
  assert(dcPoly !== null && dcPoly.kind === "polygon-inverted", "diamondclose B là polygon-inverted");
  // squareopen p=0.5: B là vuông, cận lte đóng 2 đầu: chỉ số X từ
  // ceil(25)=25 tới floor(75)=75 → 51 cột, rect tâm điểm từ 25.5
  // (xem khối V3).
  const so = describeTransition("squareopen", 0.5, W, H);
  assert(so.geometric, "squareopen phải có hình học");
  const soB = rectOf(so.b.region);
  approx(soB.x, 25.5, 1e-9, "squareopen B x=25.5");
  approx(soB.w, 51, 1e-9, "squareopen B rộng 51");
  // squareclose p=0.5: A là vuông 51, B là phần bù.
  const sc = describeTransition("squareclose", 0.5, W, H);
  assert(sc.geometric, "squareclose phải có hình học");
  approx(rectOf(sc.a.region).w, 51, 1e-9, "squareclose A rộng 51");
  // p=0/1 ở biên: diamondclose p=0 → A đầy khung, p=1 → A rỗng;
  // squareopen p=0 → B chỉ còn đúng pixel tâm (1×1, lte với s=0),
  // p=1 → B phủ khung (rect tràn 2 biên, canvas cắt khung).
  assert(describeTransition("diamondclose", 0, W, H).b.region !== null, "diamondclose p=0 có B");
  approx(rectOf(describeTransition("squareopen", 0, W, H).b.region).w, 1, 1e-9, "squareopen p=0 → B 1 cột tâm");
  approx(rectOf(describeTransition("squareopen", 1, W, H).b.region).w, 101, 1e-9, "squareopen p=1 → B rộng 101 (tràn khung)");
});

test("V3: checker-alt/split/barn đúng luật expr", () => {
  // checker-alt p=0.5: ô chẵn B (p>0.25), ô lẻ A → 32/64 ô B.
  const chk = describeTransition("checker-alt", 0.5, W, H);
  assert(chk.geometric, "checker-alt phải có hình học");
  assert(rectsOf(chk.b.region).length === 32, `checker-alt p=0.5 → 32 ô, nhận ${rectsOf(chk.b.region).length}`);
  // p=0.25: ô chẵn chưa hiện (gt strict) → 0 ô; p=1: tất cả 64 ô.
  assert(rectsOf(describeTransition("checker-alt", 0.25, W, H).b.region).length === 0, "checker-alt p=0.25 → 0 ô");
  assert(rectsOf(describeTransition("checker-alt", 1, W, H).b.region).length === 64, "checker-alt p=1 → 64 ô");
  // split-h p=0.5: B = 2 rect (trên-trái + dưới-phải).
  const sh = describeTransition("split-h", 0.5, W, H);
  assert(sh.geometric, "split-h phải có hình học");
  assert(rectsOf(sh.b.region).length === 2, "split-h: 2 rect B");
  approx(rectsOf(sh.b.region)[0].w, 50, 1e-9, "split-h: nửa trên B rộng 50");
  // Nửa dưới B: X>W-P*W=50 → X>=51 rồi +0.5 → x=51.5 (xem khối V3).
  approx(rectsOf(sh.b.region)[1].x, 51.5, 1e-9, "split-h: nửa dưới B từ x=51.5");
  const sv = describeTransition("split-v", 0.5, W, H);
  assert(rectsOf(sv.b.region).length === 2, "split-v: 2 rect B");
  // barn-h p=0.5: B = 2 dải mép rộng 25; A = dải giữa rộng 50.
  const bh = describeTransition("barn-h", 0.5, W, H);
  assert(rectsOf(bh.b.region).length === 2, "barn-h: 2 dải B");
  approx(rectsOf(bh.b.region)[0].w, 25, 1e-9, "barn-h: dải mép rộng 25");
  // A giữa: X>=25 và X<=75 → [25.5, 76.5) rộng 51 (xem khối V3).
  approx(rectOf(bh.a.region).x, 25.5, 1e-9, "barn-h: A giữa từ x=25.5");
  approx(rectOf(bh.a.region).w, 51, 1e-9, "barn-h: A giữa rộng 51");
  const bv = describeTransition("barn-v", 0.5, W, H);
  assert(rectsOf(bv.b.region).length === 2, "barn-v: 2 dải B");
  approx(rectOf(bv.a.region).h, 51, 1e-9, "barn-v: A giữa cao 51");
});

test("V3: blinds-diag/rings/corners quét hàng, star/clock-ccw/spiral polygon", () => {
  for (const type of ["blinds-diag", "rings", "corners"]) {
    const v = describeTransition(type, 0.5, W, H);
    assert(v.geometric, `${type} phải có hình học`);
    const b = rectsOf(v.b.region);
    const a = rectsOf(v.a.region);
    assert(b.length > 0 && a.length > 0, `${type} p=0.5: cả A và B đều có rect`);
    // Số rect B tăng đơn điệu theo p (mở dần).
    const counts = [0.25, 0.5, 0.75].map((p) => rectsOf(describeTransition(type, p, W, H).b.region).length);
    assert(counts[0] <= counts[1] && counts[1] <= counts[2], `${type}: số rect B không đơn điệu: ${counts}`);
  }
  // rings p=0 → B rỗng; p=1 → B phủ khung, A chỉ còn dải vụn nửa
  // pixel ở biên do dịch +0.5 (không chứa tâm pixel nào).
  assert(rectsOf(describeTransition("rings", 0, W, H).b.region).length === 0, "rings p=0 → B rỗng");
  const ringsA1 = rectsOf(describeTransition("rings", 1, W, H).a.region);
  assert(ringsA1.every((q) => q.w <= 0.5 + 1e-9), `rings p=1: A chỉ còn dải vụn <=0.5, nhận ${JSON.stringify(ringsA1.slice(0, 3))}`);
  // star p=0.5: B là polygon 96 đỉnh trong khung.
  const star = describeTransition("star", 0.5, W, H);
  assert(star.geometric, "star phải có hình học");
  const starPoly = star.b.region;
  assert(starPoly !== null && starPoly.kind === "polygon", "star B là polygon");
  // p=0.5 sao tràn khung nên đỉnh bị cắt bớt; mọi đỉnh còn lại phải
  // nằm trong khung. Số đỉnh gốc 96 kiểm tra ở p=0.2 (sao nằm trọn
  // trong khung 100×100: bán kính max = 0.2*rMax*2.333 ≈ 33 < 50).
  const starPts = (starPoly as { points: Array<readonly [number, number]> }).points;
  assert(starPts.length >= 3, `star p=0.5: polygon suy biến, nhận ${starPts.length} đỉnh`);
  for (const [x, y] of starPts) {
    assert(x >= -1e-9 && x <= W + 1e-9 && y >= -1e-9 && y <= H + 1e-9, `star: điểm (${x},${y}) ngoài khung`);
  }
  const starSmall = describeTransition("star", 0.2, W, H).b.region;
  assert(starSmall !== null && starSmall.kind === "polygon", "star p=0.2 B là polygon");
  assert((starSmall as { points: Array<readonly [number, number]> }).points.length === 96, "star p=0.2: đủ 96 đỉnh gốc");
  // clock-ccw p=0.5: quạt từ góc 0 tới PI (y-down: nửa dưới khung).
  const ccw = describeTransition("clock-ccw", 0.5, W, H);
  assert(ccw.geometric, "clock-ccw phải có hình học");
  const ccwPoly = ccw.b.region;
  assert(ccwPoly !== null && ccwPoly.kind === "polygon", "clock-ccw B là polygon");
  for (const [x, y] of (ccwPoly as { points: Array<readonly [number, number]> }).points) {
    assert(y >= 50 - 1e-9, `clock-ccw p=0.5: điểm (${x},${y}) lấn lên nửa trên`);
  }
  // spiral: p=0 → B rỗng, p=1 → B đầy, giữa có polygon.
  assert(describeTransition("spiral", 0, W, H).geometric, "spiral p=0 vẫn geometric");
  approx(rectOf(describeTransition("spiral", 0, W, H).b.region).w, 0, 1e-9, "spiral p=0 → B rỗng");
  assert(describeTransition("spiral", 1, W, H).b.region === null, "spiral p=1 → B đầy khung");
  const sp = describeTransition("spiral", 0.5, W, H).b.region;
  assert(sp !== null && sp.kind === "polygon", "spiral p=0.5 B là polygon");
});

// --- 3. slide offset tuyến tính theo p (yêu cầu bắt buộc) ---
test("slideleft: offset tuyến tính theo p", () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const v = describeTransition("slideleft", p, W, H);
    approx(v.b.dx, (1 - p) * W, 1e-9, `B dx tại p=${p}`);
    approx(v.a.dx, -p * W, 1e-9, `A dx tại p=${p}`);
  }
  assert(describeTransition("slideleft", 0.5, W, H).b.region === null, "slide không cắt vùng");
});

// --- 4. dissolve (đợt 14 R2): vùng dissolve-noise từng pixel, không còn lưới 20×12 ---
test("dissolve: vùng dissolve-noise mang đúng p, hình học bật", () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const v = describeTransition("dissolve", p, W, H);
    assert(v.geometric, "dissolve phải có hình học");
    assert(
      v.b.region !== null && v.b.region.kind === "dissolve-noise",
      `lớp B phải là dissolve-noise, nhận ${JSON.stringify(v.b.region)}`,
    );
    assert(
      v.a.region !== null && v.a.region.kind === "dissolve-noise",
      `lớp A phải là dissolve-noise, nhận ${JSON.stringify(v.a.region)}`,
    );
    assert(
      (v.b.region as { p: number }).p === p,
      `p vùng phải = ${p}, nhận ${(v.b.region as { p: number }).p}`,
    );
    // A và B ngược invert: A hiện khi frand >= p, B hiện khi frand < p.
    assert(
      (v.a.region as { invert: boolean }).invert === true,
      "lớp A dissolve phải invert=true",
    );
    assert(
      (v.b.region as { invert: boolean }).invert === false,
      "lớp B dissolve phải invert=false",
    );
  }
});

test("dissolve: số pixel B (qua dissolveFrand) tăng đơn điệu theo p", () => {
  const ps = [0, 0.25, 0.5, 0.75, 1];
  const counts = ps.map(
    (p) => {
      let c = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) if (dissolvePixelIsB(x, y, p)) c++;
      return c;
    },
  );
  for (let i = 1; i < counts.length; i++) {
    assert(counts[i] >= counts[i - 1], `số pixel B giảm tại p=${ps[i]}`);
  }
  assert(counts[0] === 0, "p=0 → không pixel nào hiện");
  assert(counts[4] === W * H, `p=1 → tất cả ${W * H} pixel hiện, nhận ${counts[4]}`);
  // Tỉ lệ B ≈ p (sai số mẫu 100×100, ±0.02).
  for (let i = 0; i < ps.length; i++) {
    const frac = counts[i] / (W * H);
    assert(
      Math.abs(frac - ps[i]) <= 0.02,
      `tỉ lệ B tại p=${ps[i]} phải ≈ p, nhận ${frac}`,
    );
  }
});

test("ffmpegDissolveFrand: ổn định, trong [0,1), đúng giá trị kiểm chứng", () => {
  assert(ffmpegDissolveFrand(0, 0) === 0, "frand(0,0) = fract(sin 0) = 0");
  assert(
    ffmpegDissolveFrand(3, 7) === ffmpegDissolveFrand(3, 7),
    "frand cùng tọa độ phải giống nhau",
  );
  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 12; y++) {
      const v = ffmpegDissolveFrand(x, y);
      assert(v >= 0 && v < 1, `frand ngoài [0,1): ${v} tại (${x},${y})`);
    }
  }
  // Giá trị kiểm chứng từ render thật (xem LIMITS đợt 14 R2):
  // pixel (13,0) có frand 0.029296875 < 1/30 nên chuyển sang B ngay
  // frame transition đầu tiên (frame 31) của khung 72×45; ngược lại
  // pixel (1,0) có frand 0.94140625 nên chuyển muộn (gần cuối).
  assert(
    ffmpegDissolveFrand(13, 0) === 0.029296875,
    `frand(13,0) phải = 0.029296875, nhận ${ffmpegDissolveFrand(13, 0)}`,
  );
  assert(
    ffmpegDissolveFrand(1, 0) === 0.94140625,
    `frand(1,0) phải = 0.94140625, nhận ${ffmpegDissolveFrand(1, 0)}`,
  );
});

test("dissolveHash ổn định và trải đều 0..1", () => {
  assert(dissolveHash(3, 7) === dissolveHash(3, 7), "hash cùng ô phải giống nhau");
  let inside = 0;
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 12; j++) {
      const v = dissolveHash(i, j);
      assert(v >= 0 && v < 1, `hash ngoài [0,1): ${v}`);
      if (v < 0.5) inside++;
    }
  }
  assert(inside > 60 && inside < 180, `hash phải trải đều, số ô <0.5 là ${inside}/240`);
});

// --- 5. type lạ fallback fade, không crash (yêu cầu bắt buộc) ---
test("type lạ: fallback fade, không throw", () => {
  for (const weird of ["kiểu-lạ", "", "wipe-mega", "fade2"]) {
    const v = describeTransition(weird, 0.5, W, H);
    assert(!v.geometric, `${weird} phải fallback (không hình học)`);
    approx(v.b.alpha, 0.5, 1e-9, `${weird}: alpha B = p`);
    approx(v.a.alpha, 0.5, 1e-9, `${weird}: alpha A = 1-p`);
  }
  // p NaN / khung suy biến cũng không throw.
  const nan = describeTransition("wipeleft", Number.NaN, W, H);
  assert(nan.p === 0, "p NaN → clamp về 0");
  const zero = describeTransition("wipeleft", 0.5, 0, 0);
  assert(!zero.geometric, "khung suy biến → không hình học");
});

// --- Bổ sung: các họ còn lại ---
test("wipe dọc + vert/horz open-close đúng hình học", () => {
  const up = describeTransition("wipeup", 0.5, W, H);
  const bUp = rectOf(up.b.region);
  approx(bUp.y, 50, 1e-9, "wipeup: B từ y=50");
  approx(bUp.h, 50, 1e-9, "wipeup: B cao 50");
  const down = describeTransition("wipedown", 0.5, W, H);
  approx(rectOf(down.b.region).h, 50, 1e-9, "wipedown: B cao 50 từ trên");
  const vo = describeTransition("vertopen", 0.5, W, H);
  const band = rectOf(vo.b.region);
  approx(band.x, 25, 1e-9, "vertopen: dải dọc giữa từ x=25");
  approx(band.w, 50, 1e-9, "vertopen: dải rộng 50");
  const ho = describeTransition("horzopen", 0.5, W, H);
  approx(rectOf(ho.b.region).h, 50, 1e-9, "horzopen: dải ngang cao 50");
  const vc = describeTransition("vertclose", 0.5, W, H);
  approx(rectOf(vc.a.region).w, 50, 1e-9, "vertclose: A còn dải dọc rộng 50");
  const hc = describeTransition("horzclose", 0.5, W, H);
  approx(rectOf(hc.a.region).h, 50, 1e-9, "horzclose: A còn dải ngang cao 50");
});

test("diag: đa giác nằm trong khung, B tăng theo p", () => {
  for (const type of ["diagtl", "diagtr", "diagbl", "diagbr"]) {
    for (const p of [0, 0.5, 1]) {
      const v = describeTransition(type, p, W, H);
      assert(v.geometric, `${type} phải có hình học`);
      const poly = v.b.region;
      assert(poly !== null && poly.kind === "polygon", `${type} B phải là polygon`);
      for (const [x, y] of (poly as { points: Array<readonly [number, number]> }).points) {
        assert(x >= -1e-9 && x <= W + 1e-9 && y >= -1e-9 && y <= H + 1e-9, `${type} p=${p}: điểm (${x},${y}) ngoài khung`);
      }
    }
  }
  // diagtl p=0 → B suy biến về điểm gốc (0,0).
  const p0 = describeTransition("diagtl", 0, W, H).b.region;
  assert(p0 !== null && p0.kind === "polygon", "diagtl p=0 → B là polygon");
  for (const [x, y] of (p0 as { points: Array<readonly [number, number]> }).points) {
    assert(Math.hypot(x, y) < 1e-6, `diagtl p=0: điểm (${x},${y}) phải suy biến về gốc`);
  }
});

test("smooth = slide cùng offset (viền gradient chưa mô hình hoá)", () => {
  const s = describeTransition("smoothleft", 0.5, W, H);
  approx(s.b.dx, 50, 1e-9, "smoothleft B dx = 50 như slideleft");
  approx(s.a.dx, -50, 1e-9, "smoothleft A dx = -50 như slideleft");
});

test("cover/reveal: chỉ 1 phía chuyển động", () => {
  const cov = describeTransition("coverleft", 0.5, W, H);
  approx(cov.a.dx, 0, 1e-9, "coverleft: A tĩnh");
  approx(cov.b.dx, 50, 1e-9, "coverleft: B từ phải vào");
  const rev = describeTransition("revealleft", 0.5, W, H);
  approx(rev.b.dx, 0, 1e-9, "revealleft: B tĩnh");
  approx(rev.a.dx, -50, 1e-9, "revealleft: A trượt sang trái");
});

test("custom-expr: blinds/bars/checker/diamond/plus/grid/clock đúng luật expr", () => {
  const blinds = describeTransition("blinds-h", 0.5, W, H);
  assert(rectsOf(blinds.b.region).length === 8, "blinds-h: 8 dải B");
  approx(rectsOf(blinds.b.region)[0].h, 6.25, 1e-9, "blinds-h: mỗi dải B cao p*H/8 = 6.25");
  const bars = describeTransition("bars-v", 0.5, W, H);
  assert(rectsOf(bars.b.region).length === 8, "bars-v: 8 dải B");
  approx(rectsOf(bars.b.region)[0].w, 6.25, 1e-9, "bars-v: mỗi dải B rộng p*W/8 = 6.25");
  // checker p=0.5: ô hiện khi (i+j)%4 < 2 → 32/64 ô.
  const chk = describeTransition("checker", 0.5, W, H);
  assert(rectsOf(chk.b.region).length === 32, `checker p=0.5 → 32 ô, nhận ${rectsOf(chk.b.region).length}`);
  // diamond p=0.5: 4 đỉnh thoi tại r = 50.
  const dia = describeTransition("diamond", 0.5, W, H).b.region;
  assert(dia !== null && dia.kind === "polygon", "diamond B là polygon");
  // plus p=0.5: 2 rect (dọc + ngang), t = 25. Đợt 15 T6: biên lte
  // đóng → dải dọc phủ X nguyên 25..75 = 51 pixel, không phải 50
  // (giá trị 50 cũ là sai số tie-break đã gây XẤP XỈ ở khung nhỏ).
  const plus = describeTransition("plus", 0.5, W, H);
  assert(rectsOf(plus.b.region).length === 2, "plus: 2 rect");
  approx(rectsOf(plus.b.region)[0].w, 51, 1e-9, "plus: dải dọc rộng 51 (X nguyên 25..75)");
  // grid p=0.5 (đợt 15 T2): mỗi ô có đúng 1 rect B là ô vuông ở
  // góc trên-trái ô (không phải chữ L như trước). W=H=100, s=12.5:
  // ô (0,0) cho B là pixel 0..6 (7x7), ô (1,0) bắt đầu ceil(12.5)=13.
  const grid = describeTransition("grid", 0.5, W, H);
  assert(rectsOf(grid.b.region).length === 64, `grid: 64 ô × 1 rect = 64, nhận ${rectsOf(grid.b.region).length}`);
  approx(rectsOf(grid.b.region)[0].x, 0, 1e-9, "grid: ô (0,0) bắt đầu x=0");
  approx(rectsOf(grid.b.region)[0].w, 7, 1e-9, "grid: ô (0,0) rộng 7 (pixel 0..6, floor(6.25)+1)");
  approx(rectsOf(grid.b.region)[0].h, 7, 1e-9, "grid: ô (0,0) cao 7 (ô vuông, không phải chữ L)");
  assert(rectsOf(grid.b.region).some((r) => r.x === 13 && r.y === 0 && r.w === 6), "grid: ô (1,0) bắt đầu ceil(12.5)=13, rộng 6");
  assert(rectsOf(grid.a.region).length === 128, `grid: A = 64 ô × 2 rect (phải + dưới) = 128, nhận ${rectsOf(grid.a.region).length}`);
  // clock p=0.5: quét nửa vòng trên (góc -PI → 0, y-down) — đa giác sau
  // khi cắt khung chính là nửa trên khung (cung rMax đi qua đúng 2 góc
  // trên), nên số điểm ít nhưng phải phủ đủ 2 góc trên và không lấn
  // xuống nửa dưới.
  const clock = describeTransition("clock", 0.5, W, H).b.region;
  assert(clock !== null && clock.kind === "polygon", "clock B là polygon");
  const pts = (clock as { points: Array<readonly [number, number]> }).points;
  for (const [x, y] of pts) {
    assert(x >= -1e-9 && x <= W + 1e-9 && y >= -1e-9 && y <= H + 1e-9, `clock: điểm (${x},${y}) ngoài khung`);
    assert(y <= 50 + 1e-9, `clock p=0.5: điểm (${x},${y}) lấn xuống nửa dưới`);
  }
  const xs = pts.map(([x]) => x);
  assert(Math.min(...xs) <= 1e-9 && Math.max(...xs) >= W - 1e-9, "clock p=0.5: phủ đủ chiều ngang khung");
});

test("đợt 15 T6: circle-soft dùng mô hình mềm radial-soft", () => {
  // Trọng số: trong đĩa = 1, ngoài viền = 0, giữa viền tuyến tính.
  approx(radialSoftWeight(0.5, 0.15, 0.4), 1, 1e-9, "soft: rho < center → 1");
  approx(radialSoftWeight(0.5, 0.15, 0.5), 1, 1e-9, "soft: rho = center → 1");
  approx(radialSoftWeight(0.5, 0.15, 0.575), 0.5, 1e-9, "soft: giữa viền → 0.5");
  approx(radialSoftWeight(0.5, 0.15, 0.65), 0, 1e-9, "soft: rho = center+width → 0");
  approx(radialSoftWeight(0.5, 0.15, 0.9), 0, 1e-9, "soft: ngoài viền → 0");
  const v = describeTransition("circle-soft", 0.5, W, H);
  assert(v.geometric, "circle-soft phải có hình học");
  assert(v.b.region !== null && v.b.region.kind === "radial-soft", `circle-soft B phải là radial-soft, nhận ${JSON.stringify(v.b.region)}`);
  const b = v.b.region as { center: number; width: number; inverted: boolean; cx: number; cy: number };
  approx(b.center, 0.5, 1e-9, "circle-soft: center = p");
  approx(b.width, 0.15, 1e-9, "circle-soft: width = 0.15 (viền mềm expr)");
  assert(b.inverted === false, "circle-soft: lớp B không inverted");
  assert(v.a.region !== null && v.a.region.kind === "radial-soft", "circle-soft A cũng là radial-soft");
  assert((v.a.region as { inverted: boolean }).inverted === true, "circle-soft: lớp A inverted");
  approx(b.cx, W / 2 + 0.5, 1e-9, "circle-soft: tâm expr W/2 dịch +0,5 sang tâm điểm (canvas lấy mẫu tại tâm pixel)");
});

// Đợt 15 T6: đối chứng toàn khung — preview lấy mẫu tại tâm pixel
// phải khớp chính xác luật expr nguyên của FFmpeg cho blinds-h, plus,
// checker ở khung 192x108 (H/8 = 13,5 không nguyên — trường hợp lệch
// trước sửa). Không cần FFmpeg ở đây: luật expr được viết trực tiếp
// từ literal trong server/render/src/transitions.js.
test("đợt 15 T6: blinds-h/plus/checker lấy mẫu tâm khớp luật expr nguyên", () => {
  const TW = 192;
  const TH = 108;
  const inRects = (region: ClipRegion | null, x: number, y: number): boolean => {
    if (!region || region.kind !== "rects") return false;
    const px = x + 0.5;
    const py = y + 0.5;
    return region.rects.some((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);
  };
  for (const p of [0.25, 0.5, 0.75]) {
    // blinds-h: if(lt(mod(Y,H/8),P*H/8),B,A), Y nguyên.
    const blinds = describeTransition("blinds-h", p, TW, TH);
    let bad = 0;
    for (let y = 0; y < TH; y++) {
      const wantB = (y % (TH / 8)) < p * (TH / 8);
      if (inRects(blinds.b.region, 0, y) !== wantB) bad++;
    }
    assert(bad === 0, `blinds-h p=${p}: ${bad} hàng lệch luật expr nguyên`);
    // checker: if(gt(P*4,mod(floor(X/(W/8))+floor(Y/(H/8)),4)),B,A).
    const chk = describeTransition("checker", p, TW, TH);
    bad = 0;
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const cell = (Math.floor(x / (TW / 8)) + Math.floor(y / (TH / 8))) % 4;
        const wantB = 4 * p > cell;
        if (inRects(chk.b.region, x, y) !== wantB) bad++;
      }
    }
    assert(bad === 0, `checker p=${p}: ${bad} pixel lệch luật expr nguyên`);
    // plus: if(lte(min(abs(X-W/2),abs(Y-H/2)),P*min(W,H)/2),B,A).
    const plus = describeTransition("plus", p, TW, TH);
    bad = 0;
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const wantB = Math.min(Math.abs(x - TW / 2), Math.abs(y - TH / 2)) <= (p * Math.min(TW, TH)) / 2;
        if (inRects(plus.b.region, x, y) !== wantB) bad++;
      }
    }
    assert(bad === 0, `plus p=${p}: ${bad} pixel lệch luật expr nguyên`);
  }
  // Vị trí dịch +0,5 ghim trực tiếp (tránh hồi quy về quy ước cũ).
  const blinds0 = rectsOf(describeTransition("blinds-h", 0.5, W, H).b.region);
  approx(blinds0[0].y, 0.5, 1e-9, "blinds-h: dải đầu dịch +0,5 theo y");
  const chk0 = rectsOf(describeTransition("checker", 0.5, W, H).b.region);
  assert(chk0.some((r) => r.x === 0.5 && r.y === 0.5), "checker: ô (0,0) dịch +0,5 cả 2 trục");
  const plus0 = rectsOf(describeTransition("plus", 0.5, W, H).b.region);
  approx(plus0[0].x, 25.5, 1e-9, "plus: dải dọc bắt đầu ceil(cx-t)+0,5");
  approx(plus0[0].w, 51, 1e-9, "plus: dải dọc rộng floor(cx+t)-ceil(cx-t)+1 (biên lte đóng)");
});

test("đợt 15 T2: grid là ô vuông theo luật expr nguyên, bars-fade là kind riêng", () => {
  // grid: luật expr nguyên max(mod(X,s),mod(Y,s)) <= p*s, s=12.5,
  // p=0.5 → thr=6.25. Kiểm tra toàn khung bằng luật tâm pixel.
  const inRects = (region: ClipRegion | null, x: number, y: number): boolean => {
    if (!region || region.kind !== "rects") return false;
    const px = x + 0.5;
    const py = y + 0.5;
    return region.rects.some((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);
  };
  for (const p of [0.25, 0.5, 0.75]) {
    const s = Math.min(W, H) / 8;
    const grid = describeTransition("grid", p, W, H);
    let bad = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const wantB = Math.max(x % s, y % s) <= p * s;
        if (inRects(grid.b.region, x, y) !== wantB) bad++;
        if (inRects(grid.a.region, x, y) === wantB) bad++;
      }
    }
    assert(bad === 0, `grid p=${p}: ${bad} pixel lệch luật expr nguyên (ô vuông, không phải chữ L)`);
  }
  // bars-fade: cả 2 lớp mang kind bars-fade với p + bandW, và
  // helper dải đúng luật mod float tại chỉ số nguyên.
  const bf = describeTransition("bars-fade", 0.5, W, H);
  assert(bf.geometric, "bars-fade phải có hình học");
  assert(bf.a.region !== null && bf.a.region.kind === "bars-fade", "bars-fade A phải là kind bars-fade");
  assert(bf.b.region !== null && bf.b.region.kind === "bars-fade", "bars-fade B phải là kind bars-fade");
  approx((bf.a.region as { bandW: number }).bandW, W / 8, 1e-9, "bars-fade bandW = W/8");
  approx((bf.b.region as { p: number }).p, 0.5, 1e-9, "bars-fade p giữ nguyên");
  assert(barsFadePixelIsBar(0, 12.5, 0.5), "bars-fade: X=0 là dải");
  assert(barsFadePixelIsBar(6, 12.5, 0.5), "bars-fade: mod 6 < 6.25 là dải");
  assert(!barsFadePixelIsBar(7, 12.5, 0.5), "bars-fade: mod 7 >= 6.25 là nền");
  assert(barsFadePixelIsBar(13, 12.5, 0.5), "bars-fade: X=13 (mod 0.5) là dải");
  assert(!barsFadePixelIsBar(5, 9.125, 0.5), "bars-fade: bandW phân số, X=5 (mod 5 >= 4.5625) là nền");
  assert(barsFadePixelIsBar(10, 9.125, 0.5), "bars-fade: bandW phân số, X=10 (mod 0.875) là dải");
  assert(!barsFadePixelIsBar(0, 12.5, 0), "bars-fade: p=0 không có dải");
});

test("slices: 8 dải trượt đều cùng hướng", () => {
  const hl = describeTransition("hlslice", 0.5, W, H);
  assert(rectsOf(hl.b.region).length === 8, "hlslice: 8 dải B");
  approx(rectsOf(hl.b.region)[0].x, 50, 1e-9, "hlslice: dải B chiếm nửa phải");
  const vd = describeTransition("vdslice", 0.5, W, H);
  approx(rectsOf(vd.b.region)[0].h, 50, 1e-9, "vdslice: dải B cao nửa trên");
});

test("fade family: alpha đúng, hblur fallback fade", () => {
  approx(describeTransition("fade", 0.25, W, H).b.alpha, 0.25, 1e-9, "fade B alpha = p");
  approx(describeTransition("fadefast", 0.5, W, H).b.alpha, 0.75, 1e-9, "fadefast B alpha = 1-(1-p)^2");
  approx(describeTransition("fadeslow", 0.5, W, H).b.alpha, 0.25, 1e-9, "fadeslow B alpha = p^2");
  assert(!describeTransition("hblur", 0.5, W, H).geometric, "hblur → fallback fade");
  approx(describeTransition("distance", 0.25, W, H).b.alpha, 1, 1e-9, "distance: B phủ từ p=0.25 (4p)");
});

test("toàn bộ catalog render không throw + p=0/1 ở biên đúng", () => {
  const types = [
    "none", "fade", "fadeblack", "fadewhite", "wipeleft", "wiperight",
    "wipeup", "wipedown", "slideleft", "slideright", "dissolve",
    "circleopen", "radial", "smoothleft", "smoothright", "smoothup",
    "smoothdown", "slideup", "slidedown", "circleclose", "circlecrop",
    "rectcrop", "pixelize", "hblur", "distance", "vertopen", "horzopen",
    "diagtl", "vertclose", "horzclose", "diagtr", "diagbl", "diagbr",
    "hlslice", "hrslice", "vuslice", "vdslice", "fadegrays", "wipetl",
    "wipetr", "wipebl", "wipebr", "squeezeh", "squeezev", "zoomin",
    "fadefast", "fadeslow", "hlwind", "hrwind", "vuwind", "vdwind",
    "coverleft", "coverright", "coverup", "coverdown", "revealleft",
    "revealright", "revealup", "revealdown", "blinds-h", "bars-v",
    "checker", "diamond", "plus", "grid", "clock", "circle-soft",
    "bars-fade",
    // V3 (đợt 12 T2 có hình học, trước đó fallback fade):
    "diamondclose", "squareopen", "squareclose", "checker-alt",
    "blinds-diag", "split-h", "split-v", "barn-h", "barn-v", "rings",
    "corners", "star", "clock-ccw", "spiral",
  ];
  assert(types.length === 82, `catalog phải có 82 type, nhận ${types.length}`);
  for (const type of types) {
    for (const p of [0, 0.5, 1]) {
      const v = describeTransition(type, p, W, H);
      assert(v.p === p, `${type}: p phải giữ nguyên`);
      assert(v.a.alpha >= 0 && v.a.alpha <= 1, `${type}: alpha A ngoài [0,1]`);
      assert(v.b.alpha >= 0 && v.b.alpha <= 1, `${type}: alpha B ngoài [0,1]`);
    }
    // p=1: B phủ đầy (alpha 1 hoặc vùng đầy khung) — kiểm tra lỏng:
    // với họ alpha thì b.alpha = 1; với họ hình học thì B không rỗng.
    const end = describeTransition(type, 1, W, H);
    assert(
      end.b.alpha === 1 || end.b.region === null || regionNonEmpty(end.b.region),
      `${type}: p=1 mà B vẫn rỗng`,
    );
  }
});

function regionNonEmpty(r: ClipRegion): boolean {
  switch (r.kind) {
    case "rect":
      return r.w > 0 && r.h > 0;
    case "rects":
      return r.rects.some((q) => q.w > 0 && q.h > 0);
    case "circle":
      return r.r > 0;
    case "circle-inverted":
      return r.r < Math.hypot(50, 50);
    case "polygon":
      return r.points.length >= 3;
    case "polygon-inverted":
      return true;
    case "radial-gradient":
      // Gradient phủ khắp khung với alpha biến thiên (không rỗng).
      return true;
  }
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (failedNames.length > 0) console.log(`Failed: ${failedNames.join(", ")}`);
process.exitCode = fail > 0 ? 1 : 0;

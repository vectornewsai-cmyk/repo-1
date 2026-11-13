// enhancePreview60Q1.test.ts — Phase 9 đợt 60, luồng Q1: enhance vào preview
// (đóng nợ đợt 59 §6.9 + gap E3 phần còn lại: EnhancePanel chỉ tác dụng khi
// render, preview chưa áp enhance).
//
// Chạy bằng esbuild bundle (mẫu P8 đợt 59, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview60Q1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round60-q1/enhancePreview.test.cjs \
//     && node /tmp/round60-q1/enhancePreview.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round60-q1/enhancePreview.test.cjs
//
// Test này khóa (logic THUẦN trong apps/web/src/lib/enhancePreview.ts):
//  1. denoise → blend với bản mờ: composite = (1-a)·gốc + a·blur(3.0px),
//     a = strength 0..1 (đợt 62 R3 thay thang blur thuần đợt 61 vì blur
//     Chromium bị lượng tử hóa — mức hiệu quả nhỏ nhất đã -60%, vùng
//     chết s<~0.27; xem enhancePreview62R3.test.ts + LIMITS đợt 62 R3 §2).
//     Bán kính blur cố định 3.0px; alpha = strength, clamp [0,1].
//  2. stabilize → zoom crop gợi ý: smoothing 1..100 → 1.0203..1.05, mặc định
//     smoothing 10 → 1.023; không stabilize → zoom 1.
//  3. enhancePreviewPlan: toggle tắt → không áp gì, mọi tính năng đang bật
//     đều vào notApproximated; toggle bật → denoise/stabilize vào applied,
//     deinterlace vào applied CHỈ khi tap được áp (đợt 75 C8: truyền
//     drawScaleY ≥ 0.9 — không truyền tỉ lệ thì mặc định 0, deinterlace
//     vẫn vào notApproximated như cũ); needsOffscreen chỉ true khi alpha > 0
//     hoặc zoom != 1 (đợt 76 D4: tap đơn lẻ KHÔNG cần offscreen enhanceCanvas
//     nữa — preview.tsx đưa qua half-res intermediate dw×dh/2; tap đi kèm
//     denoise/stabilize vẫn qua offscreen).
//     Clip có speedKeyframes → stabilize bị chặn (đợt 62 R3, xem
//     enhancePreview62R3.test.ts).
//  4. Không thêm shape spec: plan chỉ dùng field đã có trong ClipEnhance.
//  5. Fragment round60-q1: đúng 3 key, parity vi/en, nội dung đúng từng chữ;
//     sau parent gộp: t()/enhanceT trả chuỗi theo locale (khối post-merge).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setLang, t } from "../../i18n";
import type { ClipEnhance } from "@repo-1/video-spec";
import {
  ENHANCE_PREVIEW_BLUR_RADIUS_PX,
  ENHANCE_PREVIEW_ZOOM_MAX,
  denoiseBlendAlpha,
  denoiseBlurPx,
  denoiseStrengthOf,
  enhancePreviewPlan,
  stabilizeZoomOf,
} from "../../lib/enhancePreview";
import { enhanceT } from "./presets";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  cwd: () => string;
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
};

const LANG = (process.env.VCUT_TEST_LANG === "en" ? "en" : "vi") as "vi" | "en";
const VI = LANG === "vi";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  // +1: 1 assert pre-merge chạy inline trong main() trước deepMerge, ngoài queue (mẫu P8).
  console.log(`Q1 enhance preview round 60 [lang=${LANG}]: ${pass}/${queue.length + 1} pass`);
}

/** So sánh số thực với sai số làm tròn (tránh 0.1 + 0.2 != 0.3). */
function approx(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `kỳ vọng ${expected}, thực tế ${actual}`,
  );
}

// --- Denoise → blend với bản mờ (đợt 63 R3: piecewise, xem 63R3 test) -----
ok("denoise: strength 0..1 → alpha piecewise (0.195/0.486/0.806/0.981), bán kính blur cố định 3.0px", () => {
  approx(denoiseBlendAlpha(0), 0);
  approx(denoiseBlendAlpha(0.5), 0.486);
  approx(denoiseBlendAlpha(0.3), 0.195);
  approx(denoiseBlendAlpha(1), 0.981);
  assert.equal(ENHANCE_PREVIEW_BLUR_RADIUS_PX, 3.0);
  // Bán kính: 0 khi không denoise, 3.0 khi strength > 0 (không còn thang
  // tuyến tính theo strength — alpha mới mang strength).
  approx(denoiseBlurPx(0), 0);
  approx(denoiseBlurPx(0.3), 3.0);
  approx(denoiseBlurPx(0.5), 3.0);
  approx(denoiseBlurPx(1), 3.0);
});

ok("denoise: strength ngoài [0,1] bị clamp, không âm/không vượt 0.981", () => {
  approx(denoiseBlendAlpha(-0.2), 0);
  approx(denoiseBlendAlpha(1.5), 0.981);
  approx(denoiseBlendAlpha(NaN), 0);
  approx(denoiseBlurPx(-0.2), 0);
  approx(denoiseBlurPx(1.5), 3.0);
  approx(denoiseBlurPx(NaN), 0);
});

ok("denoiseStrengthOf: true → 0.5 mặc định render, object → strength, thiếu/lỗi → null", () => {
  assert.equal(denoiseStrengthOf(undefined), null);
  assert.equal(denoiseStrengthOf({}), null);
  assert.equal(denoiseStrengthOf({ denoise: true }), 0.5);
  assert.equal(denoiseStrengthOf({ denoise: { strength: 0.3 } }), 0.3);
  assert.equal(denoiseStrengthOf({ denoise: { strength: 0 } }), 0);
  assert.equal(denoiseStrengthOf({ denoise: false } as ClipEnhance), null);
});

// --- Stabilize → zoom --------------------------------------------------------
ok("stabilize: không stabilize → zoom 1; smoothing 10 → 1.023; 100 → 1.05", () => {
  approx(stabilizeZoomOf(undefined), 1);
  approx(stabilizeZoomOf({}), 1);
  approx(stabilizeZoomOf({ stabilize: {} }), 1.023);
  approx(stabilizeZoomOf({ stabilize: { smoothing: 10 } }), 1.023);
  approx(stabilizeZoomOf({ stabilize: { smoothing: 100 } }), 1.05);
  approx(stabilizeZoomOf({ stabilize: { smoothing: 1 } }), 1.0203);
  assert.equal(ENHANCE_PREVIEW_ZOOM_MAX, 1.05);
});

ok("stabilize: smoothing ngoài [1,100] bị clamp về biên zoom", () => {
  approx(stabilizeZoomOf({ stabilize: { smoothing: 200 } }), 1.05);
  approx(stabilizeZoomOf({ stabilize: { smoothing: 0 } }), 1.0203);
  // NaN → clamp về lo (= smoothing 1) theo clampNum trong enhancePreview.ts.
  approx(stabilizeZoomOf({ stabilize: { smoothing: NaN } }), 1.0203);
});

// --- Plan --------------------------------------------------------------------
ok("plan: không enhance → hasEnhance false, không áp gì", () => {
  const p = enhancePreviewPlan(undefined, true);
  assert.equal(p.hasEnhance, false);
  assert.equal(p.enabled, true);
  approx(p.denoiseBlurPx, 0);
  approx(p.stabilizeZoom, 1);
  assert.equal(p.needsOffscreen, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, []);
});

ok("plan: toggle tắt → blur 0, zoom 1, mọi tính năng đang bật đều notApproximated", () => {
  const enh: ClipEnhance = {
    deinterlace: true,
    stabilize: { smoothing: 20 },
    denoise: { strength: 0.8 },
  };
  const p = enhancePreviewPlan(enh, false);
  assert.equal(p.enabled, false);
  assert.equal(p.hasEnhance, true);
  approx(p.denoiseBlurPx, 0);
  approx(p.stabilizeZoom, 1);
  assert.equal(p.needsOffscreen, false);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace", "stabilize", "denoise"]);
});

ok("plan: denoise đơn lẻ → applied [denoise], blur 3.0 + alpha 0.486, needsOffscreen true", () => {
  const p = enhancePreviewPlan({ denoise: true }, true);
  assert.deepEqual(p.applied, ["denoise"]);
  assert.deepEqual(p.notApproximated, []);
  approx(p.denoiseBlurPx, 3.0);
  approx(p.denoiseBlendAlpha, 0.486);
  approx(p.stabilizeZoom, 1);
  assert.equal(p.needsOffscreen, true);
});

ok("plan: stabilize đơn lẻ → applied [stabilize], zoom 1.023, blur 0", () => {
  const p = enhancePreviewPlan({ stabilize: { smoothing: 10 } }, true);
  assert.deepEqual(p.applied, ["stabilize"]);
  assert.deepEqual(p.notApproximated, []);
  approx(p.denoiseBlurPx, 0);
  approx(p.stabilizeZoom, 1.023);
  assert.equal(p.needsOffscreen, true);
});

ok("plan: deinterlace đơn lẻ, KHÔNG truyền tỉ lệ vẽ (mặc định 0) → applied rỗng, notApproximated [deinterlace], KHÔNG offscreen", () => {
  const p = enhancePreviewPlan({ deinterlace: { mode: 1 } }, true);
  assert.deepEqual(p.applied, []);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  approx(p.denoiseBlurPx, 0);
  approx(p.stabilizeZoom, 1);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: cả ba, KHÔNG truyền tỉ lệ vẽ (mặc định 0) → applied [stabilize, denoise], notApproximated [deinterlace]", () => {
  const p = enhancePreviewPlan(
    { deinterlace: true, stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
    true,
  );
  assert.deepEqual(p.applied, ["stabilize", "denoise"]);
  assert.deepEqual(p.notApproximated, ["deinterlace"]);
  approx(p.denoiseBlurPx, 3.0);
  approx(p.denoiseBlendAlpha, 0.806);
  approx(p.stabilizeZoom, 1.026);
  assert.equal(p.needsOffscreen, true);
});

ok("plan: denoise strength 0 → blur 0 + alpha 0 nên needsOffscreen false dù denoise đang bật", () => {
  const p = enhancePreviewPlan({ denoise: { strength: 0 } }, true);
  assert.deepEqual(p.applied, ["denoise"]);
  approx(p.denoiseBlurPx, 0);
  approx(p.denoiseBlendAlpha, 0);
  assert.equal(p.needsOffscreen, false);
});

ok("plan: không thêm shape spec — đúng 10 key đã khai (đợt 75 C8 thêm deinterlaceTap)", () => {
  const p = enhancePreviewPlan({ denoise: true }, true);
  assert.deepEqual(Object.keys(p).sort(), [
    "applied",
    "deinterlaceTap",
    "denoiseBlendAlpha",
    "denoiseBlurPx",
    "enabled",
    "hasEnhance",
    "needsOffscreen",
    "notApproximated",
    "stabilizeBlockedBySpeedRamp",
    "stabilizeZoom",
  ].sort());
});

// --- Fragment round60-q1 ------------------------------------------------------
function findFragment(): string {
  const rel = "goals/capcut-clone-video-editor/hidden_files/round60-q1-fragment.json";
  const candidates = [
    join(process.cwd(), "..", rel),
    join(process.cwd(), "..", "..", rel),
    join("/home/hatch/workspace", rel),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(`không tìm thấy fragment round60-q1 (đã thử: ${candidates.join(" | ")})`);
}

function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookupAt(raw: Record<string, unknown>, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}

const FRAG = JSON.parse(readFileSync(findFragment(), "utf8")) as {
  vi: Record<string, unknown>;
  en: Record<string, unknown>;
};

const EXPECTED_VI: Record<string, string> = {
  "enhance.previewApprox":
    "Bản xem trước chỉ là xấp xỉ — khử nhiễu là mờ nhẹ, chống rung là crop/scale gợi ý, khử răng cưa chỉ hiện khi xem gần full-res (trung bình nửa dòng dọc); ở cỡ nhỏ thì thu nhỏ đã giấu răng cưa; bản render mới chính xác.",
  "enhance.previewToggle": "Xem trước enhance (xấp xỉ)",
  "enhance.previewOffNote":
    "Đã tắt xem trước enhance — bản xem trước hiện khung gốc, bản render vẫn áp enhance.",
};
const EXPECTED_EN: Record<string, string> = {
  "enhance.previewApprox":
    "Preview is only an approximation — denoise is a light blur, stabilize is a suggested crop/scale, deinterlace only shows near full-res (half-line vertical average); at small sizes downscaling already hides combing; the render is exact.",
  "enhance.previewToggle": "Preview enhance (approximate)",
  "enhance.previewOffNote":
    "Enhance preview is off — the preview shows the original frame, the render still applies enhance.",
};

ok("fragment: đúng 3 key, parity vi/en, nội dung đúng từng chữ", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(FRAG.vi, "", viKeys);
  flatten(FRAG.en, "", enKeys);
  assert.equal(viKeys.size, 3, `fragment vi phải có đúng 3 key, thực tế ${viKeys.size}`);
  assert.deepEqual([...enKeys].sort(), [...viKeys].sort(), "vi/en trong fragment phải cùng tập key");
  assert.deepEqual([...viKeys].sort(), Object.keys(EXPECTED_VI).sort());
  for (const k of Object.keys(EXPECTED_VI)) {
    assert.equal(lookupAt(FRAG.vi, k), EXPECTED_VI[k], `vi ${k} sai chữ`);
    assert.equal(lookupAt(FRAG.en, k), EXPECTED_EN[k], `en ${k} sai chữ`);
  }
});

async function main(): Promise<void> {
  setLang(LANG);
  // Import động sau setLang (mẫu M4/O5/P8).
  const i18n = await import("../../i18n");
  const viDict = (await import("../../i18n/vi.json")).default as Record<string, unknown>;
  const enDict = (await import("../../i18n/en.json")).default as Record<string, unknown>;

  // --- Post-merge (parent đã gộp fragment Q1 cuối đợt 60: +3 key →
  // dict 2044 sau parent gộp đợt 61 (+72 key; lúc viết test là 1972): t() trả chuỗi theo locale, enhanceT không cần fallback.
  try {
    assert.equal(
      t("enhance.previewToggle"),
      VI ? "Xem trước enhance (xấp xỉ)" : "Preview enhance (approximate)",
      "post-merge: t() phải trả chuỗi theo locale khi key đã gộp",
    );
    assert.equal(
      enhanceT("enhance.previewToggle", "Xem trước enhance (xấp xỉ)"),
      VI ? "Xem trước enhance (xấp xỉ)" : "Preview enhance (approximate)",
      "post-merge: enhanceT trả chuỗi theo locale",
    );
    pass++;
    console.log("  ✓ post-merge: t()/enhanceT trả chuỗi theo locale khi key đã gộp");
  } catch (e) {
    console.error(`  ✗ post-merge: ${(e as Error).message}`);
    process.exitCode = 1;
  }

  // Mô phỏng bước merge của parent: deep-merge fragment vào đúng object dict
  // mà i18n/index.ts đang dùng (cùng module instance trong bundle).
  function deepMerge(target: Record<string, unknown>, src: Record<string, unknown>): void {
    for (const [k, v] of Object.entries(src)) {
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        const cur = target[k];
        if (typeof cur === "object" && cur !== null) deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>);
        else target[k] = JSON.parse(JSON.stringify(v));
      } else target[k] = v;
    }
  }
  deepMerge(viDict, FRAG.vi as Record<string, unknown>);
  deepMerge(enDict, FRAG.en as Record<string, unknown>);

  // --- Post-merge: t() + enhanceT trả chuỗi theo locale -------------------
  queue.push({
    name: "post-merge: t() + enhanceT trả chuỗi theo locale",
    fn: () => {
      if (VI) {
        assert.equal(i18n.t("enhance.previewToggle"), "Xem trước enhance (xấp xỉ)");
        assert.equal(
          enhanceT("enhance.previewApprox", "?"),
          "Bản xem trước chỉ là xấp xỉ — khử nhiễu là mờ nhẹ, chống rung là crop/scale gợi ý, khử răng cưa chỉ hiện khi xem gần full-res (trung bình nửa dòng dọc); ở cỡ nhỏ thì thu nhỏ đã giấu răng cưa; bản render mới chính xác.",
        );
      } else {
        assert.equal(i18n.t("enhance.previewToggle"), "Preview enhance (approximate)");
        assert.equal(
          enhanceT("enhance.previewApprox", "?"),
          "Preview is only an approximation — denoise is a light blur, stabilize is a suggested crop/scale, deinterlace only shows near full-res (half-line vertical average); at small sizes downscaling already hides combing; the render is exact.",
        );
      }
      assert.equal(
        enhanceT("enhance.previewOffNote", "?"),
        VI
          ? "Đã tắt xem trước enhance — bản xem trước hiện khung gốc, bản render vẫn áp enhance."
          : "Enhance preview is off — the preview shows the original frame, the render still applies enhance.",
      );
    },
  });

  runAll();
}

main();

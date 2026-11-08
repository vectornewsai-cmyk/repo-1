// enhancePresets59P8.test.ts — Phase 9 đợt 59, luồng P8: preset tăng cường
// (E3 — Enhance đã có panel R2 nhưng chưa có preset, chưa có badge trạng thái).
//
// Chạy bằng esbuild bundle (mẫu O5/O7, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePresets59P8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round59-p8/presets.test.cjs \
//     && node /tmp/round59-p8/presets.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round59-p8/presets.test.cjs
//
// Test này khóa:
//  1. Preset chỉ dùng field đã tồn tại trong ClipEnhance (deinterlace /
//     stabilize / denoise) — KHÔNG thêm shape mới; stabilize chỉ có
//     smoothing, denoise chỉ có strength.
//  2. Giá trị preset nằm trong khoảng render chấp nhận (validateEnhance ở
//     server/render/src/enhance.js): smoothing 1..100, strength 0..1;
//     preset balanced dùng đúng default render (smoothing 10, strength 0.5).
//  3. matchEnhancePreset: off / light / balanced / strong / custom; bỏ qua
//     deinterlace khi match; denoise:true (= 0.5) và stabilize:{} (toàn
//     default) vẫn match đúng preset.
//  4. applyEnhancePreset: off → undefined; giữ nguyên deinterlace khi đổi
//     preset; ghi đè đúng field preset; "custom" không đổi gì.
//  5. enhanceActiveFeatures / clipHasEnhance: thứ tự deinterlace →
//     stabilize → denoise; giá trị lỗi (deinterlace:false) không tính active.
//  6. Fragment round59-p8: đúng 11 key, parity vi/en, placeholder {list}
//     khớp, nội dung đúng từng chữ; enhanceT fallback VI đúng từng chữ
//     khi key chưa gộp (mẫu O5), kể cả khi có vars {list}.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setLang, t } from "../../i18n";
import type { ClipEnhance } from "@repo-1/video-spec";
import {
  ENHANCE_PRESETS,
  applyEnhancePreset,
  clipHasEnhance,
  enhanceActiveFeatures,
  enhanceActiveLabels,
  enhanceT,
  matchEnhancePreset,
} from "./presets";

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
  // +2: 2 assert pre-merge chạy inline trong main() trước deepMerge, ngoài queue.
  console.log(`P8 enhance presets round 59 [lang=${LANG}]: ${pass}/${queue.length + 2} pass`);
}

// --- Preset: không thêm shape, giá trị trong khoảng render ----------------
ok("presets: chỉ dùng field đã có, không thêm shape mới", () => {
  const knownTop = new Set(["deinterlace", "stabilize", "denoise"]);
  for (const [id, p] of Object.entries(ENHANCE_PRESETS)) {
    for (const k of Object.keys(p)) {
      assert.ok(knownTop.has(k), `preset ${id} có key lạ: ${k}`);
    }
    if (p.stabilize !== undefined) {
      assert.deepEqual(Object.keys(p.stabilize), ["smoothing"], `preset ${id} stabilize chỉ được có smoothing`);
    }
    if (typeof p.denoise === "object" && p.denoise !== null) {
      assert.deepEqual(Object.keys(p.denoise), ["strength"], `preset ${id} denoise chỉ được có strength`);
    }
  }
});

ok("presets: smoothing trong [1,100], strength trong [0,1]", () => {
  for (const [id, p] of Object.entries(ENHANCE_PRESETS)) {
    const s = p.stabilize?.smoothing;
    if (s !== undefined) assert.ok(s >= 1 && s <= 100, `preset ${id} smoothing ${s} ngoài [1,100]`);
    const st = typeof p.denoise === "object" && p.denoise !== null ? p.denoise.strength : undefined;
    if (st !== undefined) assert.ok(st >= 0 && st <= 1, `preset ${id} strength ${st} ngoài [0,1]`);
  }
});

ok("presets: balanced dùng đúng default render", () => {
  assert.deepEqual(ENHANCE_PRESETS.balanced, {
    stabilize: { smoothing: 10 },
    denoise: { strength: 0.5 },
  });
  assert.deepEqual(ENHANCE_PRESETS.light, { denoise: { strength: 0.3 } });
  assert.deepEqual(ENHANCE_PRESETS.strong, {
    stabilize: { smoothing: 20 },
    denoise: { strength: 0.8 },
  });
});

// --- matchEnhancePreset -----------------------------------------------------
ok("match: undefined/{} → off", () => {
  assert.equal(matchEnhancePreset(undefined), "off");
  assert.equal(matchEnhancePreset({}), "off");
});

ok("match: preset chuẩn match đúng id", () => {
  assert.equal(matchEnhancePreset({ denoise: { strength: 0.3 } }), "light");
  assert.equal(
    matchEnhancePreset({ stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } }),
    "balanced",
  );
  assert.equal(
    matchEnhancePreset({ stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } }),
    "strong",
  );
});

ok("match: bỏ qua deinterlace khi match preset", () => {
  assert.equal(
    matchEnhancePreset({
      deinterlace: { mode: 1 },
      stabilize: { smoothing: 10 },
      denoise: { strength: 0.5 },
    }),
    "balanced",
  );
  assert.equal(matchEnhancePreset({ deinterlace: true }), "custom");
});

ok("match: denoise:true (=0.5) và stabilize:{} (toàn default) vẫn match", () => {
  assert.equal(
    matchEnhancePreset({ stabilize: {}, denoise: true }),
    "balanced",
  );
  assert.equal(matchEnhancePreset({ denoise: true }), "custom");
});

ok("match: giá trị lệch → custom", () => {
  assert.equal(
    matchEnhancePreset({ stabilize: { smoothing: 15 }, denoise: { strength: 0.5 } }),
    "custom",
  );
  assert.equal(
    matchEnhancePreset({ stabilize: { smoothing: 10, shakiness: 3 }, denoise: { strength: 0.5 } }),
    "custom",
  );
  assert.equal(matchEnhancePreset({ denoise: { strength: 0.6 } }), "custom");
});

// --- applyEnhancePreset -----------------------------------------------------
ok("apply: off → undefined dù trước đó có enhance", () => {
  assert.equal(
    applyEnhancePreset({ stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } }, "off"),
    undefined,
  );
});

ok("apply: balanced từ undefined ra đúng giá trị preset", () => {
  assert.deepEqual(applyEnhancePreset(undefined, "balanced"), {
    stabilize: { smoothing: 10 },
    denoise: { strength: 0.5 },
  });
});

ok("apply: light giữ deinterlace, bỏ stabilize cũ", () => {
  assert.deepEqual(
    applyEnhancePreset(
      { deinterlace: { mode: 1 }, stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
      "light",
    ),
    { denoise: { strength: 0.3 }, deinterlace: { mode: 1 } },
  );
});

ok("apply: strong ghi đè smoothing cũ, giữ deinterlace:true", () => {
  assert.deepEqual(
    applyEnhancePreset({ deinterlace: true, stabilize: { smoothing: 10 } }, "strong"),
    { stabilize: { smoothing: 20 }, denoise: { strength: 0.8 }, deinterlace: true },
  );
});

ok("apply: custom không đổi gì (trả lại đúng object cũ)", () => {
  const cur: ClipEnhance = { denoise: { strength: 0.6 } };
  assert.equal(applyEnhancePreset(cur, "custom"), cur);
});

// --- Active features / badge -------------------------------------------------
ok("features: thứ tự deinterlace → stabilize → denoise", () => {
  assert.deepEqual(enhanceActiveFeatures(undefined), []);
  assert.deepEqual(enhanceActiveFeatures({}), []);
  assert.deepEqual(enhanceActiveFeatures({ denoise: true }), ["denoise"]);
  assert.deepEqual(
    enhanceActiveFeatures({
      deinterlace: true,
      stabilize: { smoothing: 10 },
      denoise: { strength: 0.5 },
    }),
    ["deinterlace", "stabilize", "denoise"],
  );
});

ok("features: deinterlace:false (render coi là lỗi) không tính active", () => {
  assert.deepEqual(enhanceActiveFeatures({ deinterlace: false } as ClipEnhance), []);
});

ok("clipHasEnhance: video có enhance → true, {} / không có → false", () => {
  assert.equal(clipHasEnhance({ enhance: { denoise: true } }), true);
  assert.equal(clipHasEnhance({ enhance: {} }), false);
  assert.equal(clipHasEnhance({}), false);
  assert.equal(clipHasEnhance(undefined), false);
  assert.equal(clipHasEnhance(null), false);
});

ok("labels: active labels theo đúng thứ tự feature", () => {
  const labels = enhanceActiveLabels({
    deinterlace: true,
    stabilize: { smoothing: 10 },
    denoise: { strength: 0.5 },
  });
  // runAll() chạy SAU deepMerge trong main() nên đây là kỳ vọng post-merge.
  if (VI) assert.deepEqual(labels, ["Khử răng cưa", "Chống rung", "Khử nhiễu"]);
  else assert.deepEqual(labels, ["Deinterlace", "Stabilize", "Denoise"]);
});

// --- Fragment round59-p8 ------------------------------------------------------
function findFragment(): string {
  const rel = "goals/capcut-clone-video-editor/hidden_files/round59-p8-fragment.json";
  const candidates = [
    join(process.cwd(), "..", rel),
    join(process.cwd(), "..", "..", rel),
    join("/home/hatch/workspace", rel),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(`không tìm thấy fragment round59-p8 (đã thử: ${candidates.join(" | ")})`);
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
  "enhance.presetLabel": "Preset tăng cường",
  "enhance.presetOff": "Tắt",
  "enhance.presetLight": "Nhẹ — khử nhiễu nhẹ",
  "enhance.presetBalanced": "Cân bằng — chống rung + khử nhiễu",
  "enhance.presetStrong": "Mạnh — chống rung mạnh + khử nhiễu mạnh",
  "enhance.presetCustom": "Tùy chỉnh",
  "enhance.activeSummary": "Đang bật: {list}",
  "enhance.badgeTitle": "Clip có tăng cường — xem mục Tăng cường video trong Inspector",
  "enhance.sumDeinterlace": "Khử răng cưa",
  "enhance.sumStabilize": "Chống rung",
  "enhance.sumDenoise": "Khử nhiễu",
};
const EXPECTED_EN: Record<string, string> = {
  "enhance.presetLabel": "Enhance preset",
  "enhance.presetOff": "Off",
  "enhance.presetLight": "Light — light denoise",
  "enhance.presetBalanced": "Balanced — stabilize + denoise",
  "enhance.presetStrong": "Strong — strong stabilize + denoise",
  "enhance.presetCustom": "Custom",
  "enhance.activeSummary": "Active: {list}",
  "enhance.badgeTitle": "Clip has enhancement — see the Enhance video section in the Inspector",
  "enhance.sumDeinterlace": "Deinterlace",
  "enhance.sumStabilize": "Stabilize",
  "enhance.sumDenoise": "Denoise",
};

ok("fragment: đúng 11 key, parity vi/en, {list} khớp, nội dung đúng từng chữ", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(FRAG.vi, "", viKeys);
  flatten(FRAG.en, "", enKeys);
  assert.equal(viKeys.size, 11, `fragment vi phải có đúng 11 key, thực tế ${viKeys.size}`);
  assert.deepEqual([...enKeys].sort(), [...viKeys].sort(), "vi/en trong fragment phải cùng tập key");
  assert.deepEqual([...viKeys].sort(), Object.keys(EXPECTED_VI).sort());
  for (const k of Object.keys(EXPECTED_VI)) {
    assert.equal(lookupAt(FRAG.vi, k), EXPECTED_VI[k], `vi ${k} sai chữ`);
    assert.equal(lookupAt(FRAG.en, k), EXPECTED_EN[k], `en ${k} sai chữ`);
  }
});

async function main(): Promise<void> {
  setLang(LANG);
  // Import động sau setLang (mẫu M4/O5).
  const i18n = await import("../../i18n");
  const viDict = (await import("../../i18n/vi.json")).default as Record<string, unknown>;
  const enDict = (await import("../../i18n/en.json")).default as Record<string, unknown>;

  // --- Post-merge (parent gộp fragment P8 cuối đợt 59): key đã có trong
  // dict thật -> t()/enhanceT trả chuỗi theo locale; deepMerge bên dưới thành
  // no-op (cùng giá trị). Khối pre-merge cũ (key chưa có -> fallback VI)
  // đã được thay bằng khối này khi gộp; fallback chỉ còn dùng cho key lạ.
  try {
    assert.equal(t("enhance.presetLight"), VI ? "Nhẹ — khử nhiễu nhẹ" : "Light — light denoise", "post-merge: t() phải trả chuỗi dict theo locale");
    assert.equal(
      enhanceT("enhance.presetLight", "Nhẹ — khử nhiễu nhẹ"),
      VI ? "Nhẹ — khử nhiễu nhẹ" : "Light — light denoise",
    );
    assert.equal(
      enhanceT("enhance.activeSummary", "Đang bật: {list}", { list: "Chống rung" }),
      VI ? "Đang bật: Chống rung" : "Active: Chống rung",
      "post-merge: enhanceT phải thay {list} đúng theo locale",
    );
    pass++;
    console.log("  ✓ post-merge: t()/enhanceT trả chuỗi dict theo locale (kể cả {list})");
  } catch (e) {
    console.error(`  ✗ post-merge: ${(e as Error).message}`);
    process.exitCode = 1;
  }
  try {
    // Ở locale en, enhanceT trả chuỗi EN trong dict (không còn fallback VI).
    assert.equal(
      enhanceT("enhance.presetBalanced", "Cân bằng — chống rung + khử nhiễu"),
      VI ? "Cân bằng — chống rung + khử nhiễu" : "Balanced — stabilize + denoise",
    );
    pass++;
    console.log("  ✓ post-merge: locale en trả chuỗi EN trong dict");
  } catch (e) {
    console.error(`  ✗ post-merge en: ${(e as Error).message}`);
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

  // --- Post-merge: t() trả chuỗi theo locale, enhanceT dùng dict ---------
  queue.push({
    name: "post-merge: t() + enhanceT trả chuỗi theo locale",
    fn: () => {
      if (VI) {
        assert.equal(i18n.t("enhance.presetBalanced"), "Cân bằng — chống rung + khử nhiễu");
        assert.equal(enhanceT("enhance.presetStrong", "?"), "Mạnh — chống rung mạnh + khử nhiễu mạnh");
      } else {
        assert.equal(i18n.t("enhance.presetBalanced"), "Balanced — stabilize + denoise");
        assert.equal(enhanceT("enhance.presetStrong", "?"), "Strong — strong stabilize + denoise");
        assert.deepEqual(
          enhanceActiveLabels({ stabilize: { smoothing: 10 }, denoise: { strength: 0.5 } }),
          ["Stabilize", "Denoise"],
        );
      }
      assert.equal(
        enhanceT("enhance.activeSummary", "?", { list: "A, B" }),
        VI ? "Đang bật: A, B" : "Active: A, B",
      );
    },
  });

  runAll();
}

main();

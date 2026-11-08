// enhanceSpeedBlock61R2.test.ts — Phase 9 đợt 61, luồng R2: chặn preset
// stabilize ở UI khi clip có speedKeyframes (đóng nợ đợt 60 §5.2, mục D).
//
// Bối cảnh: render chặn HẲN preset Cân bằng/Mạnh trên clip có speedKeyframes
// (validateSpec + render.js, exit 1, không MP4 — Q8 §4 đã đo thật), nhưng
// panel trước đây vẫn cho user bật preset rồi chỉ cảnh báo bằng chữ. Quyết
// định (hướng (i)): chặn ngay ở UI — disable option preset Cân bằng/Mạnh +
// disable checkbox chống rung (chỉ khi đang tắt) + dòng cảnh báo rõ; KHÔNG
// làm render fallback tự bỏ stabilize (phá hợp đồng trung thực của render).
//
// Chạy bằng esbuild bundle (mẫu P8, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/components/enhance/enhanceSpeedBlock61R2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round61-r2/speedblock.test.cjs \
//     && node /tmp/round61-r2/speedblock.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round61-r2/speedblock.test.cjs
//
// Test này khóa:
//  1. isEnhancePresetSpeedBlocked: chỉ balanced/strong bị chặn khi có speed
//     curve; off/light không bao giờ bị chặn; không có speed curve thì
//     không preset nào bị chặn.
//  2. isStabilizeToggleDisabled: clip có speed curve + stabilize đang TẮT
//     → checkbox bị vô hiệu (không bật mới được); stabilize đang BẬT →
//     checkbox vẫn mở để user TẮT đi sửa trạng thái lỗi cũ; không có speed
//     curve → checkbox luôn mở.
//  3. Fragment round61-r2: đúng 3 key, parity vi/en, nội dung đúng từng chữ;
//     sau khi parent gộp fragment vào dict ở đợt 61 thì t()/enhanceT trả chuỗi
//     theo locale (khối pre-merge cũ đã đổi thành post-merge ở bước gộp).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setLang, t } from "../../i18n";
import {
  enhanceT,
  isEnhancePresetSpeedBlocked,
  isStabilizeToggleDisabled,
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
  console.log(`R2 speed-block round 61 [lang=${LANG}]: ${pass}/${queue.length + 2} pass`);
}

// --- 1. isEnhancePresetSpeedBlocked ------------------------------------------
ok("preset bị chặn: chỉ balanced/strong khi có speed curve", () => {
  assert.equal(isEnhancePresetSpeedBlocked("balanced", true), true);
  assert.equal(isEnhancePresetSpeedBlocked("strong", true), true);
  assert.equal(isEnhancePresetSpeedBlocked("off", true), false);
  assert.equal(isEnhancePresetSpeedBlocked("light", true), false);
});

ok("preset không bị chặn khi clip không có speed curve", () => {
  for (const p of ["off", "light", "balanced", "strong"] as const) {
    assert.equal(isEnhancePresetSpeedBlocked(p, false), false, `preset ${p} không được chặn khi không có ramp`);
  }
});

// --- 2. isStabilizeToggleDisabled --------------------------------------------
ok("checkbox chống rung: có speed curve + đang tắt → bị vô hiệu (không bật mới)", () => {
  assert.equal(isStabilizeToggleDisabled(false, true), true);
});

ok("checkbox chống rung: có speed curve + đang bật → vẫn mở để tắt sửa lỗi cũ", () => {
  assert.equal(isStabilizeToggleDisabled(true, true), false);
});

ok("checkbox chống rung: không có speed curve → luôn mở", () => {
  assert.equal(isStabilizeToggleDisabled(false, false), false);
  assert.equal(isStabilizeToggleDisabled(true, false), false);
});

// --- 3. Fragment round61-r2 ---------------------------------------------------
function findFragment(): string {
  const rel = "goals/capcut-clone-video-editor/hidden_files/round61-r2-fragment.json";
  const candidates = [
    join(process.cwd(), "..", rel),
    join(process.cwd(), "..", "..", rel),
    join("/home/hatch/workspace", rel),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(`không tìm thấy fragment round61-r2 (đã thử: ${candidates.join(" | ")})`);
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
  "enhance.presetSpeedBlocked":
    "⚠️ Clip có speed curve nên preset Cân bằng/Mạnh bị tắt — chống rung không dùng chung được với speedKeyframes. Dùng preset Nhẹ (chỉ khử nhiễu) hoặc bỏ speed curve rồi bật lại.",
  "enhance.presetSpeedTitle":
    "Preset Cân bằng/Mạnh bị tắt vì clip có speed curve — chống rung không dùng chung được với speedKeyframes",
  "enhance.stabilizeSpeedTitle":
    "Chống rung không dùng chung được với speed curve của clip này",
};
const EXPECTED_EN: Record<string, string> = {
  "enhance.presetSpeedBlocked":
    "⚠️ This clip has a speed curve, so the Balanced/Strong presets are disabled — stabilize can't be combined with speed keyframes. Use the Light preset (denoise only), or remove the speed curve first.",
  "enhance.presetSpeedTitle":
    "Balanced/Strong presets are disabled because this clip has a speed curve — stabilize can't be combined with speed keyframes",
  "enhance.stabilizeSpeedTitle":
    "Stabilize can't be combined with this clip's speed curve",
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

// --- Post-merge: t()/enhanceT trả chuỗi theo locale (chạy trong queue, sau deepMerge)
ok("post-merge: enhanceT trả chuỗi theo locale cho 3 key mới", () => {
  assert.equal(
    enhanceT("enhance.presetSpeedBlocked", "?"),
    VI ? EXPECTED_VI["enhance.presetSpeedBlocked"] : EXPECTED_EN["enhance.presetSpeedBlocked"],
  );
  assert.equal(
    enhanceT("enhance.stabilizeSpeedTitle", "?"),
    VI ? EXPECTED_VI["enhance.stabilizeSpeedTitle"] : EXPECTED_EN["enhance.stabilizeSpeedTitle"],
  );
});

async function main(): Promise<void> {
  setLang(LANG);
  // Import động sau setLang (mẫu M4/O5).
  const i18n = await import("../../i18n");
  const viDict = (await import("../../i18n/vi.json")).default as Record<string, unknown>;
  const enDict = (await import("../../i18n/en.json")).default as Record<string, unknown>;

  // --- Post-merge (parent đã gộp fragment R2 vào dict ở đợt 61): t() trả
  // chuỗi dict theo locale, enhanceT cũng trả chuỗi dict (không còn fallback).
  // Chạy inline trước deepMerge mô phỏng, ngoài queue.
  try {
    assert.equal(
      t("enhance.presetSpeedBlocked"),
      VI ? EXPECTED_VI["enhance.presetSpeedBlocked"] : EXPECTED_EN["enhance.presetSpeedBlocked"],
      "post-merge: t() trả chuỗi dict theo locale",
    );
    assert.equal(
      enhanceT("enhance.presetSpeedBlocked", EXPECTED_VI["enhance.presetSpeedBlocked"]),
      VI ? EXPECTED_VI["enhance.presetSpeedBlocked"] : EXPECTED_EN["enhance.presetSpeedBlocked"],
      "post-merge: enhanceT trả chuỗi dict",
    );
    assert.equal(
      enhanceT("enhance.stabilizeSpeedTitle", EXPECTED_VI["enhance.stabilizeSpeedTitle"]),
      VI ? EXPECTED_VI["enhance.stabilizeSpeedTitle"] : EXPECTED_EN["enhance.stabilizeSpeedTitle"],
      "post-merge: enhanceT trả chuỗi dict (stabilize title)",
    );
    pass++;
    console.log("  ✓ post-merge: t()/enhanceT trả chuỗi dict cho key mới");
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

  // Post-merge qua t() trực tiếp (key đã có trong dict sau deepMerge).
  try {
    assert.equal(
      i18n.t("enhance.presetSpeedTitle"),
      VI ? EXPECTED_VI["enhance.presetSpeedTitle"] : EXPECTED_EN["enhance.presetSpeedTitle"],
      "post-merge: t() trả chuỗi dict theo locale",
    );
    pass++;
    console.log("  ✓ post-merge: t() trả chuỗi dict theo locale cho key mới");
  } catch (e) {
    console.error(`  ✗ post-merge: ${(e as Error).message}`);
    process.exitCode = 1;
  }

  runAll();
}

main();

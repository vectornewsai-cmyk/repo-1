// speedCurveBlock62R2.test.ts — Phase 9 đợt 62, luồng R2: chặn bật speed
// curve ở UI khi clip đang có stabilize (đóng nợ đợt 61 §5.2, mục "cảnh báo
// ở SpeedPanel" — hiện chỉ chặn từ phía EnhancePanel).
//
// Bối cảnh: render chặn HẲN tổ hợp stabilize + speedKeyframes (validateSpec
// + render.js, exit 1, không MP4 — Q8 §4 đã đo thật), và đợt 61 R2 đã chặn
// từ phía EnhancePanel (disable preset Cân bằng/Mạnh + disable checkbox
// chống rung khi đang tắt). Nhưng phía SpeedPanel vẫn cho user bật speed
// curve trên clip đang có stabilize — trạng thái lỗi được tạo ra từ phía
// SpeedPanel, chỉ hiện cảnh báo sau khi đã tạo (speed.warnStabilizeRamp).
// Quyết định: thống nhất 2 phía theo hướng (i) — disable nút "Bật đường
// cong tốc độ" khi clip đang bật stabilize, kèm tooltip + dòng cảnh báo rõ
// ngay từ trước khi bật. Đường sửa vẫn mở: tắt stabilize trong panel Tăng
// cường rồi quay lại bật curve. Trạng thái lỗi CŨ vẫn sửa được (checkbox
// chống rung trong EnhancePanel vẫn mở để tắt khi đang bật; nút "Tắt đường
// cong" không bị chặn).
//
// Chạy bằng esbuild bundle (mẫu P8/R2-61, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/components/speed/speedCurveBlock62R2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round62-r2/speedblock.test.cjs \
//     && node /tmp/round62-r2/speedblock.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round62-r2/speedblock.test.cjs
//
// Test này khóa:
//  1. isSpeedCurveEnableBlocked: clip đang bật stabilize → nút bật curve bị
//     vô hiệu (không tạo trạng thái lỗi mới); không có stabilize → luôn mở.
//  2. Fragment round62-r2: đúng 2 key, parity vi/en, nội dung đúng từng chữ.
//  3. Post-merge thật (parent gộp đợt 62: fragment đã vào vi.json/en.json):
//     t() trả chuỗi dict theo locale, speedT trả chuỗi dict (không còn
//     fallback). Trước gộp, khối này assert t() trả lại key (xem LIMITS).
//  4. Post-merge mô phỏng (deep-merge fragment vào dict như parent làm):
//     t()/speedT trả chuỗi theo locale.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setLang, t } from "../../i18n";
import { isSpeedCurveEnableBlocked, speedT } from "./speedCurveBlock";

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
  console.log(`R2 speed-curve-block round 62 [lang=${LANG}]: ${pass}/${queue.length + 2} pass`);
}

// --- 1. isSpeedCurveEnableBlocked --------------------------------------------
ok("nút bật curve: clip đang bật stabilize → bị vô hiệu (không tạo lỗi mới)", () => {
  assert.equal(isSpeedCurveEnableBlocked(true), true);
});

ok("nút bật curve: clip không có stabilize → luôn mở", () => {
  assert.equal(isSpeedCurveEnableBlocked(false), false);
});

// --- 2. Fragment round62-r2 ---------------------------------------------------
function findFragment(): string {
  const rel = "goals/capcut-clone-video-editor/hidden_files/round62-r2-fragment.json";
  const candidates = [
    join(process.cwd(), "..", rel),
    join(process.cwd(), "..", "..", rel),
    join("/home/hatch/workspace", rel),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(`không tìm thấy fragment round62-r2 (đã thử: ${candidates.join(" | ")})`);
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
  "speed.curveStabBlocked":
    "⚠️ Clip đang bật chống rung nên không bật được speed curve — chống rung không dùng chung được với speedKeyframes. Tắt chống rung trong panel Tăng cường rồi bật lại.",
  "speed.curveStabTitle":
    "Không bật được speed curve vì clip đang bật chống rung — chống rung không dùng chung được với speedKeyframes",
};
const EXPECTED_EN: Record<string, string> = {
  "speed.curveStabBlocked":
    "⚠️ This clip has stabilization on, so the speed curve can't be enabled — stabilize can't be combined with speedKeyframes. Turn off stabilization in the Enhance panel first, then enable the curve.",
  "speed.curveStabTitle":
    "Speed curve can't be enabled because this clip has stabilization on — stabilize can't be combined with speedKeyframes",
};

ok("fragment: đúng 2 key, parity vi/en, nội dung đúng từng chữ", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(FRAG.vi, "", viKeys);
  flatten(FRAG.en, "", enKeys);
  assert.equal(viKeys.size, 2, `fragment vi phải có đúng 2 key, thực tế ${viKeys.size}`);
  assert.deepEqual([...enKeys].sort(), [...viKeys].sort(), "vi/en trong fragment phải cùng tập key");
  assert.deepEqual([...viKeys].sort(), Object.keys(EXPECTED_VI).sort());
  for (const k of Object.keys(EXPECTED_VI)) {
    assert.equal(lookupAt(FRAG.vi, k), EXPECTED_VI[k], `vi ${k} sai chữ`);
    assert.equal(lookupAt(FRAG.en, k), EXPECTED_EN[k], `en ${k} sai chữ`);
  }
});

// --- 3. Pre-merge: kiểm trong khối inline của main() (TRƯỚC deepMerge mô
// phỏng) — không đưa vào queue, vì queue chạy SAU khi dict đã merge mô
// phỏng nên speedT lúc đó trả chuỗi dict theo locale, không còn là fallback.
// (Lỗi thứ tự này từng làm 1 check fail ở lần chạy đầu: EN trả chuỗi EN.)

async function main(): Promise<void> {
  setLang(LANG);
  // Import động sau setLang (mẫu M4/O5).
  const i18n = await import("../../i18n");
  const viDict = (await import("../../i18n/vi.json")).default as Record<string, unknown>;
  const enDict = (await import("../../i18n/en.json")).default as Record<string, unknown>;

  // --- Post-merge thật (parent đã gộp fragment vào dict): t() trả chuỗi
  // dict theo locale, speedT trả chuỗi dict. Chạy inline trước deepMerge mô
  // phỏng, ngoài queue (deepMerge dưới đây nay là idempotent).
  try {
    assert.equal(
      t("speed.curveStabBlocked"),
      VI ? EXPECTED_VI["speed.curveStabBlocked"] : EXPECTED_EN["speed.curveStabBlocked"],
      "post-merge thật: t() trả chuỗi dict theo locale",
    );
    assert.equal(
      speedT("speed.curveStabBlocked", EXPECTED_VI["speed.curveStabBlocked"]),
      VI ? EXPECTED_VI["speed.curveStabBlocked"] : EXPECTED_EN["speed.curveStabBlocked"],
      "post-merge thật: speedT trả chuỗi dict theo locale",
    );
    pass++;
    console.log("  ✓ post-merge thật: t()/speedT trả chuỗi dict theo locale cho key mới");
  } catch (e) {
    console.error(`  ✗ post-merge thật: ${(e as Error).message}`);
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

  // --- Post-merge mô phỏng: t()/speedT trả chuỗi theo locale.
  try {
    assert.equal(
      i18n.t("speed.curveStabTitle"),
      VI ? EXPECTED_VI["speed.curveStabTitle"] : EXPECTED_EN["speed.curveStabTitle"],
      "post-merge: t() trả chuỗi dict theo locale",
    );
    assert.equal(
      speedT("speed.curveStabBlocked", "?"),
      VI ? EXPECTED_VI["speed.curveStabBlocked"] : EXPECTED_EN["speed.curveStabBlocked"],
      "post-merge: speedT trả chuỗi dict theo locale",
    );
    pass++;
    console.log("  ✓ post-merge (mô phỏng): t()/speedT trả chuỗi dict theo locale cho key mới");
  } catch (e) {
    console.error(`  ✗ post-merge (mô phỏng): ${(e as Error).message}`);
    process.exitCode = 1;
  }

  runAll();
}

main();

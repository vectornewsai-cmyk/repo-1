// stabSingleThread68V2.test.ts — Phase 9 đợt 68, luồng V2: UI toggle
// bật/tắt stabilize single-thread decode (đóng nợ đợt 67 U1 §7 mục 1).
//
// Tầng lib (hàm thuần + kho inject được, test ở đây):
//   - load/saveStabSingleThread: persist localStorage, mặc định BẬT,
//     thiếu key / giá trị lạ → BẬT; "1"/"true" → bật, "0"/"false" → tắt.
//   - stabSingleThreadStrings: chuỗi từ fragment round68-v2 (đọc trực
//     tiếp, không chờ gộp dict — mẫu jobHistory67U7), không bao giờ trả
//     key thô; thiếu key en → rớt vi, thiếu cả hai → "".
// Tầng nối UI (kiểm chứng tĩnh): ExportPanel có toggle (data-testid),
// đọc trạng thái lúc mount, ghi mỗi lần đổi, gửi `stabSingleThread`
// trong preset JSON của POST /api/render; bridge parsePreset whitelist
// + spawnJob chỉ push `--no-stab-single-thread` khi false (kiểm tĩnh
// file bridge).
// Tầng dry-run/render (test_round68_v2_stab_toggle.js): vị trí
// `-threads 1` trước `-i` input stabilize; tầng headed
// (clicktest-68v2-stab-toggle-headed.mjs) bấm toggle 2 chiều thật.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/stabSingleThread68V2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round68-v2/v2.test.cjs \
//     && node /tmp/round68-v2/v2.test.cjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  STAB_SINGLE_THREAD_DEFAULT,
  STAB_SINGLE_THREAD_KEY,
  STAB_SINGLE_THREAD_KEYS,
  STAB_SINGLE_THREAD_LEAF_KEYS,
  loadStabSingleThread,
  saveStabSingleThread,
  stabSingleThreadString,
  stabSingleThreadStrings,
  stabSingleThreadTable,
  type StabStore,
} from "./stabSingleThread68V2";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { cwd: () => string; exitCode: number | undefined };

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
  console.log(`stab toggle round 68 V2: ${pass}/${queue.length} pass`);
}

/** Cwd của esbuild bundle là gốc repo (chạy từ gốc repo như header ghi). */
function resolveFromCwd(...parts: string[]): string {
  return resolve(process.cwd(), ...parts);
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round68-v2.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { exportPanel: Record<string, string> };
  en: { exportPanel: Record<string, string> };
};

const EXPORT_PANEL_PATH = resolveFromCwd(
  "apps", "web", "src", "ExportPanel.tsx",
);
const exportPanelSrc = readFileSync(EXPORT_PANEL_PATH, "utf8");

const BRIDGE_PATH = resolveFromCwd(
  "server", "bridge", "src", "index.js",
);
const bridgeSrc = readFileSync(BRIDGE_PATH, "utf8");

/** Kho giả trong bộ nhớ (Map) — thay localStorage dưới node. */
function fakeStore(seed: Record<string, string> = {}): StabStore {
  const m = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
  };
}

// --- 1. Fragment: key 1:1, không rỗng, vi khác en -------------------------
ok("fragment round68-v2: đúng 2 key exportPanel.* ở cả vi/en, không rỗng, vi≠en", () => {
  assert.deepEqual(Object.keys(frag.vi.exportPanel).sort(), [...STAB_SINGLE_THREAD_LEAF_KEYS].sort());
  assert.deepEqual(Object.keys(frag.en.exportPanel).sort(), [...STAB_SINGLE_THREAD_LEAF_KEYS].sort());
  for (const k of STAB_SINGLE_THREAD_LEAF_KEYS) {
    assert.ok(frag.vi.exportPanel[k].length > 0, `vi thiếu chuỗi ${k}`);
    assert.ok(frag.en.exportPanel[k].length > 0, `en thiếu chuỗi ${k}`);
    assert.notEqual(frag.vi.exportPanel[k], frag.en.exportPanel[k], `${k}: vi phải khác en`);
  }
  assert.deepEqual(
    [...STAB_SINGLE_THREAD_KEYS].sort(),
    STAB_SINGLE_THREAD_LEAF_KEYS.map((k) => `exportPanel.${k}`).sort(),
    "STAB_SINGLE_THREAD_KEYS phải khớp 1:1 key lá trong fragment",
  );
});

ok("fragment: không trùng key với fragment khác (scan thư mục fragments)", () => {
  // Mẫu failsoftSurface58O3: key mới không được trùng bất kỳ fragment nào khác.
  const dir = resolveFromCwd("apps", "web", "src", "i18n", "fragments");
  const flatten = (d: Record<string, unknown>, prefix = ""): Set<string> => {
    const out = new Set<string>();
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === "string") out.add(prefix + k);
      else if (v && typeof v === "object") {
        for (const kk of flatten(v as Record<string, unknown>, prefix + k + ".")) out.add(kk);
      }
    }
    return out;
  };
  for (const f of readdirSync(dir)) {
    if (f === "round68-v2.json") continue;
    const other = JSON.parse(readFileSync(resolve(dir, f), "utf8")) as Record<string, unknown>;
    const otherKeys = new Set([...flatten(other.vi as Record<string, unknown>), ...flatten(other.en as Record<string, unknown>)]);
    for (const k of STAB_SINGLE_THREAD_KEYS) {
      assert.ok(!otherKeys.has(k), `fragment ${f} đã có key ${k} — trùng!`);
    }
  }
});

ok("fragment: key chưa gộp vào dict (pre-merge phải vắng hoặc đúng giá trị)", () => {
  // Mẫu failsoftSurface58O3 merge-proof: dict chưa gộp thì key vắng;
  // nếu parent đã gộp thì giá trị phải đúng fragment.
  const flatten = (d: Record<string, unknown>, prefix = ""): Map<string, string> => {
    const out = new Map<string, string>();
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === "string") out.set(prefix + k, v);
      else if (v && typeof v === "object") {
        for (const [kk, vv] of flatten(v as Record<string, unknown>, prefix + k + ".")) out.set(kk, vv);
      }
    }
    return out;
  };
  const viDict = flatten(JSON.parse(readFileSync(resolveFromCwd("apps", "web", "src", "i18n", "vi.json"), "utf8")));
  const enDict = flatten(JSON.parse(readFileSync(resolveFromCwd("apps", "web", "src", "i18n", "en.json"), "utf8")));
  for (const k of STAB_SINGLE_THREAD_KEYS) {
    const leaf = k.slice("exportPanel.".length);
    const dv = viDict.get(k);
    const de = enDict.get(k);
    assert.ok(dv === undefined || dv === frag.vi.exportPanel[leaf], `vi.json có key ${k} nhưng lệch fragment`);
    assert.ok(de === undefined || de === frag.en.exportPanel[leaf], `en.json có key ${k} nhưng lệch fragment`);
  }
});

// --- 2. Chuỗi lib: đọc fragment, fallback, không trả key thô --------------
ok("strings vi/en: label + hint đúng fragment, không rỗng, không phải key thô", () => {
  const vi = stabSingleThreadStrings("vi");
  const en = stabSingleThreadStrings("en");
  assert.equal(vi.label, frag.vi.exportPanel.stabSingleThread);
  assert.equal(vi.hint, frag.vi.exportPanel.stabSingleThreadHint);
  assert.equal(en.label, frag.en.exportPanel.stabSingleThread);
  assert.equal(en.hint, frag.en.exportPanel.stabSingleThreadHint);
  assert.ok(!vi.label.includes("exportPanel."), "label vi không được là key thô");
  assert.ok(!en.label.includes("exportPanel."), "label en không được là key thô");
  assert.ok(vi.hint.length > 20 && en.hint.length > 20, "hint phải là câu giải thích đầy đủ");
});

ok("strings: thiếu key en → rớt vi; thiếu cả hai → \"\" (không lộ key)", () => {
  const table = { vi: { stabSingleThread: "VI nhãn", stabSingleThreadHint: "VI gợi ý" }, en: {} };
  assert.equal(stabSingleThreadString("stabSingleThread", "en", table), "VI nhãn");
  assert.equal(stabSingleThreadString("stabSingleThreadHint", "en", table), "VI gợi ý");
  const empty = { vi: {}, en: {} };
  assert.equal(stabSingleThreadString("stabSingleThread", "vi", empty), undefined);
  const s = stabSingleThreadStrings("vi", empty);
  assert.equal(s.label, "");
  assert.equal(s.hint, "");
});

ok("table: đọc đúng namespace exportPanel từ fragment import trực tiếp", () => {
  const t = stabSingleThreadTable();
  assert.equal(t.vi.stabSingleThread, frag.vi.exportPanel.stabSingleThread);
  assert.equal(t.en.stabSingleThreadHint, frag.en.exportPanel.stabSingleThreadHint);
});

// --- 3. Persist localStorage ----------------------------------------------
ok("load: thiếu key / kho null → mặc định BẬT (true, giữ hành vi U1)", () => {
  assert.equal(STAB_SINGLE_THREAD_DEFAULT, true);
  assert.equal(loadStabSingleThread(fakeStore({})), true);
  assert.equal(loadStabSingleThread(null), true);
});

ok("load: \"1\"/\"true\" → bật, \"0\"/\"false\" → tắt, giá trị lạ → BẬT", () => {
  assert.equal(loadStabSingleThread(fakeStore({ [STAB_SINGLE_THREAD_KEY]: "1" })), true);
  assert.equal(loadStabSingleThread(fakeStore({ [STAB_SINGLE_THREAD_KEY]: "true" })), true);
  assert.equal(loadStabSingleThread(fakeStore({ [STAB_SINGLE_THREAD_KEY]: "0" })), false);
  assert.equal(loadStabSingleThread(fakeStore({ [STAB_SINGLE_THREAD_KEY]: "false" })), false);
  assert.equal(loadStabSingleThread(fakeStore({ [STAB_SINGLE_THREAD_KEY]: "yes" })), true);
  assert.equal(loadStabSingleThread(fakeStore({ [STAB_SINGLE_THREAD_KEY]: "" })), true);
});

ok("save/load round-trip: ghi \"1\"/\"0\" đúng key, đọc lại khớp", () => {
  const store = fakeStore({});
  saveStabSingleThread(false, store);
  assert.equal(store.getItem(STAB_SINGLE_THREAD_KEY), "0");
  assert.equal(loadStabSingleThread(store), false);
  saveStabSingleThread(true, store);
  assert.equal(store.getItem(STAB_SINGLE_THREAD_KEY), "1");
  assert.equal(loadStabSingleThread(store), true);
});

ok("save/load: kho lỗi (throw) → không crash, load về mặc định BẬT", () => {
  const bad: StabStore = {
    getItem: () => { throw new Error("kho hỏng"); },
    setItem: () => { throw new Error("kho hỏng"); },
    removeItem: () => { throw new Error("kho hỏng"); },
  };
  assert.equal(loadStabSingleThread(bad), true);
  saveStabSingleThread(false, bad); // không throw
});

// --- 4. Tầng nối UI (tĩnh): ExportPanel ------------------------------------
ok("ExportPanel có toggle stabilize single-thread (data-testid) + chuỗi fragment", () => {
  assert.ok(exportPanelSrc.includes('data-testid="export-stab-single-thread-toggle"'), "thiếu toggle data-testid");
  assert.ok(exportPanelSrc.includes("stabSingleThreadStrings"), "toggle phải dùng chuỗi từ lib fragment");
  assert.ok(exportPanelSrc.includes("loadStabSingleThread()"), "phải đọc trạng thái persist lúc mount");
  assert.ok(exportPanelSrc.includes("saveStabSingleThread("), "phải ghi trạng thái mỗi lần user đổi");
});

ok("ExportPanel gửi stabSingleThread trong preset JSON của POST /api/render", () => {
  const idx = exportPanelSrc.indexOf('form.append("preset"');
  assert.ok(idx >= 0, "thiếu form.append preset trong startRender");
  const block = exportPanelSrc.slice(idx, idx + 600);
  assert.ok(block.includes("stabSingleThread"), "preset JSON phải kèm stabSingleThread");
});

ok("ExportPanel toggle mặc định checked theo state persist, disable khi đang render", () => {
  const idx = exportPanelSrc.indexOf('data-testid="export-stab-single-thread-toggle"');
  assert.ok(idx >= 0, "thiếu toggle");
  const block = exportPanelSrc.slice(Math.max(0, idx - 1200), idx + 600);
  assert.ok(block.includes("checked={stabSingleThread}"), "toggle phải bind checked theo state");
  assert.ok(block.includes('renderStatus === "uploading"') || block.includes('renderStatus === "rendering"'), "toggle phải disable khi đang upload/render (như normalize)");
});

// --- 5. Tầng nối bridge (tĩnh): parsePreset whitelist + spawnJob ----------
ok("bridge parsePreset: default stabSingleThread=true, chỉ nhận boolean thật", () => {
  assert.ok(bridgeSrc.includes("stabSingleThread: true"), "parsePreset defaults phải có stabSingleThread: true");
  assert.ok(bridgeSrc.includes('typeof p.stabSingleThread === "boolean"'), "chỉ nhận boolean thật");
  const idx = bridgeSrc.indexOf('typeof p.stabSingleThread === "boolean"');
  const block = bridgeSrc.slice(idx, idx + 200);
  assert.ok(block.includes("out.stabSingleThread = p.stabSingleThread"), "boolean thật phải ghi vào preset đã sanitize");
});

ok("bridge spawnJob: chỉ push --no-stab-single-thread khi preset là false rõ ràng", () => {
  const idx = bridgeSrc.indexOf("spawnJob(job)");
  assert.ok(idx >= 0, "thiếu spawnJob");
  const block = bridgeSrc.slice(idx, idx + 2200);
  assert.ok(block.includes('if (preset.stabSingleThread === false) args.push("--no-stab-single-thread")'), "spawnJob phải push cờ tắt chỉ khi false");
  assert.ok(block.includes("stabSingleThread: true"), "fallback preset khi recover phải có stabSingleThread: true");
});

ok("bridge: KHÔNG thêm mã lỗi mới (catalog 102 khóa của bridgeErrors62R5 giữ nguyên)", () => {
  assert.ok(!bridgeSrc.includes("PRESET_STAB_SINGLE_THREAD"), "không được thêm mã PRESET_STAB_SINGLE_THREAD_* (phá lock 102 mã — xem LIMITS V2 §2)");
  assert.ok(!readFileSync(resolveFromCwd("server", "bridge", "src", "errorCodes.js"), "utf8").includes("PRESET_STAB_SINGLE_THREAD"), "errorCodes.js không được thêm mã mới");
});

runAll();

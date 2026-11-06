/**
 * textStyle32O6D7.test.ts — Điều tra D7 (Phase 9 đợt 32, luồng O6):
 * "autosave sau load vẫn không gắn style vào clip top-level"
 * (nợ đứng từ đợt 30 M5, đợt 31 §3.9: M5 đo trên browser thật
 * localStorage sau reload vẫn topHasStyle=false, nhưng không quy kết
 * chắc chắn cho một lớp code cụ thể).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu textStyle27K1):
 *   node apps/web/src/lib/textStyle32O6D7.test.ts
 *
 * Phương pháp truy vết (từng lớp tách riêng, không đoán):
 *  (1) cổng load: parseProjectText có gắn style cho top-level không?
 *  (2) lớp ghi autosave: autosaveNow(spec đã load) có giữ style khi
 *      serialize không?
 *  (3) lớp "autosave sau load" đúng nghĩa M5 đo: seed localStorage
 *      bằng project thiếu style → loadAutosave() (đường App.tsx lúc
 *      khôi phục) → đọc LẠI localStorage thô: style đã vào file
 *      autosave bền vững chưa, hay chỉ nằm trong spec bộ nhớ?
 * Lớp (3) là lớp M5 đã đo (script M5 đọc localStorage, không đọc
 * spec trong store). Trước fix đợt 32 O6, (1) và (2) pass nhưng (3)
 * FAIL: loadAutosave trả spec đã chuẩn hóa nhưng không ai ghi lại
 * localStorage; App.tsx lúc khôi phục chỉ replaceProject + markSaved,
 * còn subscribe autosave chỉ chạy khi spec THAY ĐỔI sau đó (effect
 * đăng ký sau effect khôi phục nên lần replace đầu không kích
 * autosave). File autosave bền vững vì vậy vẫn là seed cũ.
 * Fix: loadAutosave ghi lại spec đã chuẩn hóa khi K1 thực sự sửa
 * (textStyleFixes.length > 0) — đúng một choke point, chỉ caller duy
 * nhất là App.tsx lúc khôi phục; đường mở file (ProjectMenu) vốn đã
 * autosave lại sau mở nên không cần đụng.
 */
import {
  AUTOSAVE_KEY,
  autosaveNow,
  loadAutosave,
  parseProjectText,
} from "./projectRepo.ts";

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
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/** localStorage giả tối thiểu (Node không có localStorage thật). */
function installMockStorage(): Map<string, string> {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  return store;
}

function seedJson(): string {
  return JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-10-31T00:00:00.000Z",
    name: "d7-seed",
    spec: {
      version: "0.2.0",
      meta: { name: "d7-seed", width: 1080, height: 1920, fps: 30 },
      tracks: [
        {
          id: "t-d7-top",
          kind: "text",
          label: "top",
          clips: [
            { kind: "text", id: "D7-TOP", text: "D7-TOP-NOSTYLE", start: 0, duration: 4 },
          ],
        },
        {
          id: "t-d7",
          kind: "video",
          label: "nested",
          clips: [
            {
              kind: "nested",
              id: "nest-d7",
              start: 0,
              duration: 6,
              subSpec: {
                version: "0.2.0",
                meta: { name: "inner", width: 1080, height: 1920, fps: 30 },
                tracks: [
                  {
                    id: "it1",
                    kind: "text",
                    label: "inner",
                    clips: [
                      { kind: "text", id: "leaf-text-d7", text: "TEXT-BLOCKED-LEAF", start: 0, duration: 3 },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  });
}

function persistedTopClip(store: Map<string, string>): Record<string, any> | null {
  const raw = store.get(AUTOSAVE_KEY);
  if (!raw) return null;
  const spec = (JSON.parse(raw) as Record<string, any>).spec;
  const track = (spec.tracks as Record<string, any>[]).find((t) => t.id === "t-d7-top");
  return (track?.clips as Record<string, any>[] | undefined)?.[0] ?? null;
}

function persistedLeaf(store: Map<string, string>): Record<string, any> | null {
  const raw = store.get(AUTOSAVE_KEY);
  if (!raw) return null;
  const spec = (JSON.parse(raw) as Record<string, any>).spec;
  const find = (clips: unknown[]): Record<string, any> | null => {
    for (const c of clips as Record<string, any>[]) {
      if (c.id === "leaf-text-d7") return c;
      if (c.subSpec) {
        for (const t of c.subSpec.tracks as Record<string, any>[]) {
          const f = find(t.clips as unknown[]);
          if (f) return f;
        }
      }
    }
    return null;
  };
  const all: unknown[] = [];
  for (const t of spec.tracks as Record<string, any>[]) all.push(...(t.clips as unknown[]));
  return find(all);
}

console.log("textStyle32O6D7 (D7 autosave sau load):");

test("lớp (1) cổng load: top-level thiếu style load xong có style", () => {
  const res = parseProjectText(seedJson());
  assert(res.ok, `load phải ok, errors=${JSON.stringify(res.errors)}`);
  const clip = (res.spec as any).tracks[0].clips[0];
  assert(clip.style !== undefined, "clip top-level sau load phải có style");
  assert(clip.style.animation === "none", `animation mặc định phải "none", nhận ${clip.style.animation}`);
  assert(res.textStyleFixes.length >= 1, "textStyleFixes phải ghi ít nhất clip top-level");
});

test("lớp (2) ghi autosave: autosaveNow(spec đã load) giữ style", () => {
  const store = installMockStorage();
  const res = parseProjectText(seedJson());
  assert(res.ok && res.spec, "load phải ok");
  autosaveNow(res.spec, res.name);
  const top = persistedTopClip(store);
  assert(top !== null, "autosave phải ghi được");
  assert(top!.style !== undefined, "autosave ghi từ spec đã load phải giữ style");
  assert(top!.style.fontSize === 64, `fontSize mặc định phải 64, nhận ${top!.style.fontSize}`);
});

test("lớp (3) KHÓA D7: loadAutosave() phải ghi lại style vào file autosave bền vững", () => {
  const store = installMockStorage();
  store.set(AUTOSAVE_KEY, seedJson());
  const auto = loadAutosave();
  assert(auto !== null, "loadAutosave phải khôi phục được seed");
  assert(
    (auto!.spec.tracks[0].clips[0] as Record<string, any>).style !== undefined,
    "spec trong bộ nhớ sau khôi phục phải có style (lớp K1)",
  );
  // Đây mới là điều M5 đo: file autosave bền vững sau lần khôi phục.
  const top = persistedTopClip(store);
  assert(top !== null, "file autosave sau khôi phục phải còn đó");
  assert(
    top!.style !== undefined,
    "BUG D7: file autosave sau loadAutosave vẫn thiếu style ở clip top-level (chỉ spec bộ nhớ có style)",
  );
  assert(top!.style.animation === "none", `animation trong autosave phải "none", nhận ${top!.style.animation}`);
});

test("lớp (3b) nested: loadAutosave() cũng ghi lại style cho leaf nested", () => {
  const store = installMockStorage();
  store.set(AUTOSAVE_KEY, seedJson());
  const auto = loadAutosave();
  assert(auto !== null, "loadAutosave phải khôi phục được seed");
  const leaf = persistedLeaf(store);
  assert(leaf !== null, "leaf nested phải còn trong autosave");
  assert(leaf!.style !== undefined, "BUG D7 (nested): file autosave sau loadAutosave vẫn thiếu style ở leaf");
});

test("không ghi thừa: seed đã đủ style thì loadAutosave không đổi savedAt", () => {
  const store = installMockStorage();
  const good = JSON.parse(seedJson()) as Record<string, any>;
  good.spec.tracks[0].clips[0].style = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 64,
    color: "#ffffff",
    bold: true,
    italic: false,
    x: 0.5,
    y: 0.5,
    animation: "none",
  };
  // Leaf vẫn thiếu style ở seed này? Không — điền luôn để seed "sạch" hoàn toàn.
  good.spec.tracks[1].clips[0].subSpec.tracks[0].clips[0].style = {
    ...good.spec.tracks[0].clips[0].style,
  };
  good.savedAt = "2026-10-31T00:00:00.000Z";
  store.set(AUTOSAVE_KEY, JSON.stringify(good));
  const auto = loadAutosave();
  assert(auto !== null, "loadAutosave phải khôi phục được seed sạch");
  const raw = store.get(AUTOSAVE_KEY)!;
  assert(
    (JSON.parse(raw) as Record<string, any>).savedAt === "2026-10-31T00:00:00.000Z",
    "seed đã sạch thì loadAutosave không được ghi đè (giữ savedAt gốc)",
  );
});

test("hồi quy: không có autosave thì loadAutosave trả null", () => {
  installMockStorage();
  assert(loadAutosave() === null, "không có autosave phải trả null");
});

console.log(`textStyle32O6D7: ${pass} pass, ${fail} fail${fail ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;

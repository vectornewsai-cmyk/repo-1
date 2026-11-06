// reverseToggleI18n48D4.test.ts — Phase 9 đợt 48, luồng D4: key i18n
// cho toggle GOP trên TopBar (đóng nợ C5 §7.3).
//
// Chạy bằng esbuild bundle (mẫu A4/B4/C5/B6, chạy từ gốc repo; bundle
// ra scratch ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseToggleI18n48D4.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/d4.test.mjs \
//     && node <scratch>/d4.test.mjs
//
// Test này ĐỌC i18n JSON THẬT (vi.json/en.json) — khóa parity toàn
// file + nội dung 3 key mới topbar.reverseWebcodecs*, không mô phỏng
// bằng fake dict. Phạm vi Node: dict thật — KHÔNG mạo nhận là browser
// thật hay app thật (toggle trên app thật nằm ở harness headed
// gopHeaded48D4.mjs, script pipe riêng).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
  console.log(`D4 i18n toggle GOP: ${pass}/${queue.length} pass`);
}

// --- Dict thật + lookup, như i18n/index.ts ---------------------------
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookup(raw: Record<string, unknown>, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}
function dict(lang: "vi" | "en"): Record<string, unknown> {
  return JSON.parse(
    readFileSync(`apps/web/src/i18n/${lang}.json`, "utf8"),
  ) as Record<string, unknown>;
}

const NEW_KEYS = [
  "topbar.reverseWebcodecs",
  "topbar.reverseWebcodecsOn",
  "topbar.reverseWebcodecsOff",
] as const;

// --- 1. i18n: key mới + parity toàn file ------------------------------
ok("i18n: vi/en parity toàn file, đủ 3 key mới topbar.reverseWebcodecs*", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(dict("vi"), "", viKeys);
  flatten(dict("en"), "", enKeys);
  assert.equal(viKeys.size, enKeys.size);
  for (const k of viKeys) assert.ok(enKeys.has(k), `en thiếu key ${k}`);
  for (const k of enKeys) assert.ok(viKeys.has(k), `vi thiếu key ${k}`);
  for (const k of NEW_KEYS) {
    assert.ok(viKeys.has(k), `vi thiếu ${k}`);
    assert.ok(enKeys.has(k), `en thiếu ${k}`);
  }
  // Snapshot tại thời điểm D4: 968 (B6) + 3 key mới = 971 mỗi bên.
  // ROUND49-E2: +2 key nút Phát ngược K4 (topbar.reversePlayback*) -> 973 mỗi bên.
  // Nếu luồng khác cùng đợt cũng thêm key, parent gộp cập nhật số
  // này — parity (bằng nhau + đủ key mới) mới là khóa cứng.
  assert.equal(viKeys.size, 973);
  assert.equal(enKeys.size, 973);
});

ok("i18n: nội dung 3 key mới đúng từng chữ dict thật, vi khác en", () => {
  const vi = dict("vi");
  const en = dict("en");
  assert.equal(
    lookup(vi, "topbar.reverseWebcodecs"),
    "Phát ngược WebCodecs (GOP)",
  );
  assert.equal(
    lookup(en, "topbar.reverseWebcodecs"),
    "Reverse playback WebCodecs (GOP)",
  );
  assert.equal(
    lookup(vi, "topbar.reverseWebcodecsOn"),
    "Phát ngược WebCodecs (GOP) đang BẬT — file video lớn phát ngược bằng Range theo GOP thay vì tải toàn file. Bấm để tắt (về đường element-seek cũ).",
  );
  assert.ok(
    lookup(en, "topbar.reverseWebcodecsOn").includes("is ON"),
    "en On phải nói rõ trạng thái BẬT",
  );
  assert.ok(
    lookup(en, "topbar.reverseWebcodecsOn").includes("per-GOP Range"),
    "en On phải nói rõ Range theo GOP",
  );
  assert.equal(
    lookup(vi, "topbar.reverseWebcodecsOff"),
    "Phát ngược WebCodecs (GOP) đang TẮT — phát ngược dùng đường element-seek cũ (tải toàn file). Bấm để bật (file lớn dùng GOP Range).",
  );
  assert.ok(
    lookup(en, "topbar.reverseWebcodecsOff").includes("is OFF"),
    "en Off phải nói rõ trạng thái TẮT",
  );
  assert.ok(
    lookup(en, "topbar.reverseWebcodecsOff").includes("legacy element-seek"),
    "en Off phải nói rõ đường element-seek cũ",
  );
  for (const k of NEW_KEYS) {
    assert.notEqual(lookup(vi, k), lookup(en, k), `${k}: vi phải khác en`);
    assert.ok(!lookup(vi, k).includes("{"), `${k} vi không còn placeholder`);
    assert.ok(!lookup(en, k).includes("{"), `${k} en không còn placeholder`);
  }
});

ok("i18n: TopBar.tsx dùng đúng 3 key mới, không còn chuỗi Việt trực tiếp của toggle GOP", () => {
  const src = readFileSync("apps/web/src/TopBar.tsx", "utf8");
  for (const k of NEW_KEYS) {
    assert.ok(
      src.includes(`t("${k}")`),
      `TopBar.tsx phải gọi t("${k}")`,
    );
  }
  // Chuỗi title cũ của C5 đã dời vào vi.json — TopBar không còn giữ
  // bản sao trực tiếp (tránh lệch 2 nơi). Nút "Phát ngược" K4 vẫn
  // hardcode — ngoài phạm vi D4, không khóa ở đây.
  assert.ok(
    !src.includes("đang BẬT — file video lớn phát ngược bằng Range"),
    "TopBar.tsx không còn chuỗi title On trực tiếp",
  );
  assert.ok(
    !src.includes("đang TẮT — phát ngược dùng đường element-seek cũ"),
    "TopBar.tsx không còn chuỗi title Off trực tiếp",
  );
  assert.ok(
    src.includes('data-testid="reverse-webcodecs-toggle"'),
    "toggle GOP vẫn giữ data-testid cho harness headed",
  );
});

runAll();

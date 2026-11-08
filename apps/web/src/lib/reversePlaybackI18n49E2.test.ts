// reversePlaybackI18n49E2.test.ts — Phase 9 đợt 49, luồng E2: key i18n
// cho nút "Phát ngược" toàn cục K4 trên TopBar (đóng nợ D4 §6.3).
//
// Chạy bằng esbuild bundle (mẫu D4, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reversePlaybackI18n49E2.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/e2i18n.test.mjs \
//     && node <scratch>/e2i18n.test.mjs
//
// Test này ĐỌC i18n JSON THẬT (vi.json/en.json) — khóa parity toàn
// file + nội dung 2 key mới topbar.reversePlayback*, không mô phỏng
// bằng fake dict. Phạm vi Node: dict thật — KHÔNG mạo nhận là browser
// thật hay app thật (nút trên app thật nằm ở harness headed
// gopHeaded49E2.mjs, script pipe riêng).
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
  console.log(`E2 i18n nút Phát ngược K4: ${pass}/${queue.length} pass`);
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
  "topbar.reversePlayback",
  "topbar.reversePlaybackHint",
] as const;

// --- 1. i18n: key mới + parity toàn file ------------------------------
ok("i18n: vi/en parity toàn file, đủ 2 key mới topbar.reversePlayback*", () => {
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
  // Snapshot tại thời điểm E2: 971 (D4) + 2 key mới = 973 mỗi bên.
  // Parent gộp đợt 51: Phase 10 thêm 9 key -> 982 mỗi bên (vi == en, 0 key mồ côi).
  // Parent gộp đợt 53: J4 thêm 5 key -> 987 mỗi bên (vi == en, 0 key mồ côi).
  // Đợt 55 L1: ProjectMenu/TopBar thêm 24 key -> 1011 mỗi bên (L1 khóa 1011).
// Parent gộp đợt 56: +711 key (683 fragment M1–M8 + 28 đề xuất M6) -> 1722 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 57: +215 key (11 N4 + 180 label N5 + 1 N7 + 23 N8; 5 key EN N5 ghi đè, không tính thêm) -> 1937 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 58: +5 key (4 O3 preview.*Skipped* + 1 O5 captions.translatedTrack) -> 1942 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 59: +15 key (4 P1 mediabin/store + 11 P8 enhance.*) -> 1957 mỗi bên (vi == en); P3 ghi đè 1 key nested.failsoft.unknownEffectType (thêm {type}), không tăng số key; đợt 60 Q4: −14 key mồ côi +26 key fragment P7 → 1969 mỗi bên; parent gộp đợt 60: +3 key Q1 → 1972 mỗi bên; parent gộp đợt 61: +72 key (R2 3 + R5 1 + R6 50 + R9 18) → 2044 mỗi bên; parent gộp đợt 62: +102 key (R2 2 + R5 91 + R7 9) → 2146 mỗi bên.
  // Parent gộp đợt 63: +131 key fragment (R1 5 + R5 123 + R7 2 + R9 1) − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI → 2275 mỗi bên (vi == en, 0 key mồ côi); parent gộp đợt 64: +7 key fragment (R2 6 + R8 1) + 1 key parent (projectHistory.migrateVersionsNeedsProjectId) → 2283 mỗi bên.
  // Nếu luồng khác cùng đợt cũng thêm key, parent gộp cập nhật số
  // này — parity (bằng nhau + đủ key mới) mới là khóa cứng.
  assert.equal(viKeys.size, 2326);
  assert.equal(enKeys.size, 2326);
});

ok("i18n: nội dung 2 key mới đúng từng chữ dict thật, vi khác en", () => {
  const vi = dict("vi");
  const en = dict("en");
  // Giá trị vi của aria-label GIỮ NGUYÊN "Phát ngược" như bản hardcode
  // cũ — selector harness [aria-label="Phát ngược"] không đổi.
  assert.equal(lookup(vi, "topbar.reversePlayback"), "Phát ngược");
  assert.equal(lookup(en, "topbar.reversePlayback"), "Reverse playback");
  assert.equal(
    lookup(vi, "topbar.reversePlaybackHint"),
    "Phát ngược (phím J) — playhead chạy lùi từng frame, không có audio đồng bộ",
  );
  assert.ok(
    lookup(en, "topbar.reversePlaybackHint").includes("J key"),
    "en Hint phải nói rõ phím J",
  );
  assert.ok(
    lookup(en, "topbar.reversePlaybackHint").includes("no synced audio"),
    "en Hint phải nói rõ không có audio đồng bộ",
  );
  for (const k of NEW_KEYS) {
    assert.notEqual(lookup(vi, k), lookup(en, k), `${k}: vi phải khác en`);
    assert.ok(!lookup(vi, k).includes("{"), `${k} vi không còn placeholder`);
    assert.ok(!lookup(en, k).includes("{"), `${k} en không còn placeholder`);
  }
});

ok("i18n: TopBar.tsx dùng đúng 2 key mới, không còn chuỗi Việt trực tiếp của nút K4", () => {
  const src = readFileSync("apps/web/src/TopBar.tsx", "utf8");
  for (const k of NEW_KEYS) {
    assert.ok(
      src.includes(`t("${k}")`),
      `TopBar.tsx phải gọi t("${k}")`,
    );
  }
  // Chuỗi title cũ của K4 đã dời vào vi.json — TopBar không còn giữ
  // bản sao trực tiếp (tránh lệch 2 nơi). So khớp theo dòng thuộc
  // tính JSX (bắt đầu dòng bằng title=/aria-label=) để comment nhắc
  // selector harness [aria-label="Phát ngược"] không làm nhiễu.
  assert.ok(
    !/^\s*title="Phát ngược \(phím J\)/m.test(src),
    "TopBar.tsx không còn title hardcode của nút K4",
  );
  assert.ok(
    !/^\s*aria-label="Phát ngược"/m.test(src),
    "TopBar.tsx không còn aria-label hardcode của nút K4",
  );
});

runAll();

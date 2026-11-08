// reverseBadge46B6.test.ts — Phase 9 đợt 46, luồng B6: i18n badge
// failed (key mới) + badge từng track (thiết kế + chứng minh chưa tách).
//
// Chạy bằng esbuild bundle (mẫu A6, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseBadge46B6.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/b6.test.mjs \
//     && node <scratch>/b6.test.mjs
//
// Khác test A6: test này ĐỌC i18n JSON THẬT (vi.json/en.json) và
// dựng t() từ dict thật — khóa nội dung key mới, không mô phỏng
// bằng fake dict. Phạm vi Node: logic thuần + dict thật — KHÔNG mạo
// nhận là browser thật hay app thật (headed nằm ở script pipe riêng).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  collectReverseTrackBadges,
  renderSingleBadgeFromTracks,
} from "./reverseBadge46B6.ts";
import {
  resolveReverseEngineBadge45A6,
  reverseEngineBadgeDisplay45A6,
} from "./reverseBadge45A6.ts";

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
  console.log(`B6 compat: ${pass}/${queue.length} pass`);
}

// --- Dict thật + t() thật (lookup + thay {name}, như i18n/index.ts) --
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
function realT(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const raw = dict(lang);
  return (key: string, vars?: Record<string, string>) => {
    const s = lookup(raw, key);
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}

const WC = { engine: "webcodecs", reason: "webcodecs-ok" } as const;
const MISSING = {
  engine: "element",
  reason: "missing-video-decoder",
} as const;

// --- 1. i18n: key mới + parity toàn file ------------------------------
ok("i18n: vi/en parity toàn file, đủ 2 key mới badgeElementFailed/titleElementFailed", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(dict("vi"), "", viKeys);
  flatten(dict("en"), "", enKeys);
  assert.equal(viKeys.size, enKeys.size);
  for (const k of viKeys) assert.ok(enKeys.has(k), `en thiếu key ${k}`);
  for (const k of enKeys) assert.ok(viKeys.has(k), `vi thiếu key ${k}`);
  for (const k of [
    "reverseEngine.badgeElementFailed",
    "reverseEngine.titleElementFailed",
  ]) {
    assert.ok(viKeys.has(k), `vi thiếu ${k}`);
    assert.ok(enKeys.has(k), `en thiếu ${k}`);
  }
  // Snapshot: 966 (Z6) + 2 key B6 + 3 key D4 (topbar.reverseWebcodecs*) + 2 key E2 (topbar.reversePlayback*) = 973 mỗi bên.
  // Parent gộp đợt 51: Phase 10 thêm 9 key -> 982 mỗi bên (vi == en, 0 key mồ côi).
  // Parent gộp đợt 53: J4 thêm 5 key -> 987 mỗi bên (vi == en, 0 key mồ côi).
  // L1 đợt 55: +24 key i18n ProjectMenu/TopBar -> 1011 mỗi bên.
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

ok("i18n: nội dung key mới đúng từng chữ dict thật, vi khác en, không còn placeholder {api}", () => {
  const vi = dict("vi");
  const en = dict("en");
  assert.equal(
    lookup(vi, "reverseEngine.badgeElementFailed"),
    "◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)",
  );
  assert.equal(
    lookup(en, "reverseEngine.badgeElementFailed"),
    "◀ REVERSE: ELEMENT (WebCodecs decode failed)",
  );
  assert.ok(
    lookup(vi, "reverseEngine.titleElementFailed").includes("không decode được"),
  );
  assert.ok(
    lookup(en, "reverseEngine.titleElementFailed").includes("could not decode"),
  );
  assert.ok(
    !lookup(vi, "reverseEngine.badgeElementFailed").includes("{api}"),
  );
  assert.ok(
    !lookup(en, "reverseEngine.badgeElementFailed").includes("{api}"),
  );
  assert.ok(
    !lookup(vi, "reverseEngine.titleElementFailed").includes("{api}"),
  );
  assert.ok(
    !lookup(en, "reverseEngine.titleElementFailed").includes("{api}"),
  );
});

// --- 2. Display nhánh failed nay qua key mới (dict thật) --------------
ok("display failed: text/title đúng dict thật vi/en, nền amber, khác hẳn key element-missing cũ", () => {
  const b = resolveReverseEngineBadge45A6(WC, true, true)!;
  assert.equal(b.kind, "element-failed");
  const vi = reverseEngineBadgeDisplay45A6(b, realT("vi"));
  const en = reverseEngineBadgeDisplay45A6(b, realT("en"));
  assert.equal(vi.text, "◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)");
  assert.equal(en.text, "◀ REVERSE: ELEMENT (WebCodecs decode failed)");
  assert.equal(vi.title, lookup(dict("vi"), "reverseEngine.titleElementFailed"));
  assert.equal(en.title, lookup(dict("en"), "reverseEngine.titleElementFailed"));
  assert.equal(vi.bg, "rgba(140,90,0,0.92)");
  // Không còn là câu "thiếu …" của key cũ.
  assert.ok(!vi.text.includes("thiếu"));
  assert.ok(!en.text.includes("missing"));
});

ok("display cũ không đổi qua dict thật: webcodecs + element-missing giữ nguyên", () => {
  const wc = resolveReverseEngineBadge45A6(WC, true, false)!;
  assert.equal(reverseEngineBadgeDisplay45A6(wc, realT("vi")).text, "◀ NGƯỢC: WEBCODECS");
  assert.equal(reverseEngineBadgeDisplay45A6(wc, realT("en")).text, "◀ REVERSE: WEBCODECS");
  const miss = resolveReverseEngineBadge45A6(MISSING, true, false)!;
  assert.equal(
    reverseEngineBadgeDisplay45A6(miss, realT("vi")).text,
    "◀ NGƯỢC: ELEMENT (thiếu VideoDecoder)",
  );
  assert.equal(
    reverseEngineBadgeDisplay45A6(miss, realT("en")).text,
    "◀ REVERSE: ELEMENT (missing VideoDecoder)",
  );
});

ok("display failed đổi lang không cần tick: cùng badge, t() vi -> vi, t() en -> en", () => {
  const b = resolveReverseEngineBadge45A6(WC, true, true)!;
  const vi = reverseEngineBadgeDisplay45A6(b, realT("vi"));
  const en = reverseEngineBadgeDisplay45A6(b, realT("en"));
  assert.notEqual(vi.text, en.text);
  assert.notEqual(vi.title, en.title);
});

// --- 3. Badge từng track: collect tách được, render đơn sụp đổ --------
ok("per-track: 2 clip chồng nhau tại playhead -> collect ra 2 badge, kind khác nhau theo từng track", () => {
  const per = collectReverseTrackBadges([
    { trackId: "t0", trackIndex: 0, clipId: "c0", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: false },
    { trackId: "t1", trackIndex: 1, clipId: "c1", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: true },
  ]);
  assert.equal(per.length, 2);
  assert.equal(per[0].badge.kind, "webcodecs");
  assert.equal(per[1].badge.kind, "element-failed");
  assert.equal(per[1].trackId, "t1");
});

ok("per-track: render đơn hiện tại chỉ giữ entry đầu -> track failed thứ hai vô hình (nợ còn mở, không claim tách)", () => {
  const per = collectReverseTrackBadges([
    { trackId: "t0", trackIndex: 0, clipId: "c0", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: false },
    { trackId: "t1", trackIndex: 1, clipId: "c1", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: true },
  ]);
  const single = renderSingleBadgeFromTracks(per)!;
  assert.equal(single.trackId, "t0");
  assert.equal(single.badge.kind, "webcodecs");
  // Entry failed của t1 không xuất hiện ở render đơn — đây chính là
  // lý do badge toàn cục hiện tại chưa phải badge từng track.
  assert.ok(!per.slice(1).some((e) => e.trackId === single.trackId));
  assert.equal(renderSingleBadgeFromTracks([]), null);
});

ok("per-track: clip không tại playhead / không stepping bị loại, thứ tự theo trackIndex dù input đảo thứ tự", () => {
  const per = collectReverseTrackBadges([
    { trackId: "t1", trackIndex: 1, clipId: "c1", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: true },
    { trackId: "t0", trackIndex: 0, clipId: "c0", atPlayhead: false, stepping: true, detailed: WC, controllerFailed: true },
    { trackId: "t2", trackIndex: 2, clipId: "c2", atPlayhead: true, stepping: false, detailed: WC, controllerFailed: true },
    { trackId: "t3", trackIndex: 3, clipId: "c3", atPlayhead: true, stepping: true, detailed: WC, controllerFailed: false },
  ]);
  assert.deepEqual(per.map((e) => e.trackId), ["t1", "t3"]);
});

runAll();

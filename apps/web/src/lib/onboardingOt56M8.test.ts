// onboardingOt56M8.test.ts — Phase 9 đợt 56, luồng M8: ot() đọc fragment
// i18n/fragments/round56-m8.json (45 literal VI/EN dời khỏi onboardingCopy.ts).
//
// Chạy bằng esbuild bundle (mẫu L1/L2, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/onboardingOt56M8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m8/m8.test.cjs \
//     && node /tmp/round56-m8/m8.test.cjs
//
// Kiểm chứng: (1) fragment đủ 45 key mỗi bên, vi==en, không rỗng, vi khác en;
// (2) ot() trả đúng từng chữ fragment cho cả 45 key, cả vi lẫn en;
// (3) vài chuỗi khóa cứng từng chữ (chống fragment bị sửa lén);
// (4) fallback key lạ → trả chính key; (5) render thật 3 caller
// (WelcomeModal/TourCard/TemplatePackModal) bằng react-dom/server, cả 2 ngôn
// ngữ, chuỗi ot() hiện đúng trong HTML.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setLang } from "../i18n";
import { ot } from "./onboardingCopy";
import { WelcomeModal } from "../components/onboarding/WelcomeModal";
import { TourCard } from "../components/onboarding/TourCard";
import { TemplatePackModal } from "../components/onboarding/TemplatePackModal";

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
  console.log(`M8 ot() fragment round 56: ${pass}/${queue.length} pass`);
}

// --- Fragment thật trên đĩa -------------------------------------------
function flatten(o: unknown, prefix: string, out: Map<string, string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.set(q, rec[k] as string);
  }
}
const frag = JSON.parse(
  readFileSync("apps/web/src/i18n/fragments/round56-m8.json", "utf8"),
) as { vi: unknown; en: unknown };
const fragVi = new Map<string, string>();
const fragEn = new Map<string, string>();
flatten(frag.vi, "", fragVi);
flatten(frag.en, "", fragEn);

ok("fragment: 45 key vi == 45 key en, nhóm welcome/tour/pack", () => {
  // Đính chính số đếm: nhiệm vụ ghi 43 theo audit đợt 55 L2, nhưng đếm thật
  // trong onboardingCopy.ts là 45 (welcome 14 + tour 16 + pack 15).
  assert.equal(fragVi.size, 45);
  assert.equal(fragEn.size, 45);
  for (const k of fragVi.keys()) assert.ok(fragEn.has(k), `en thiếu key ${k}`);
  for (const k of fragEn.keys()) assert.ok(fragVi.has(k), `vi thiếu key ${k}`);
  for (const g of ["welcome", "tour", "pack"]) {
    assert.ok(
      (frag.vi as Record<string, unknown>)[g],
      `vi thiếu nhóm ${g}`,
    );
    assert.ok(
      (frag.en as Record<string, unknown>)[g],
      `en thiếu nhóm ${g}`,
    );
  }
});

ok("fragment: không chuỗi rỗng, vi khác en ở mọi key", () => {
  for (const [k, v] of fragVi) {
    assert.ok(v.trim().length > 0, `${k}: vi rỗng`);
    assert.ok(fragEn.get(k)!.trim().length > 0, `${k}: en rỗng`);
    assert.notEqual(v, fragEn.get(k), `${k}: vi phải khác en`);
  }
});

ok("ot(): trả đúng từng chữ fragment cho cả 45 key, cả vi lẫn en", () => {
  setLang("vi");
  for (const [k, v] of fragVi) assert.equal(ot(k), v, `vi ${k}`);
  setLang("en");
  for (const [k, v] of fragEn) assert.equal(ot(k), v, `en ${k}`);
  setLang("vi");
});

ok("ot(): vài chuỗi khóa cứng từng chữ (chống fragment sửa lén)", () => {
  setLang("vi");
  assert.equal(ot("welcome.title"), "👋 Chào mừng tới VCut Studio");
  assert.equal(ot("welcome.later"), "Để sau");
  assert.equal(ot("tour.done"), "Xong, bắt đầu làm!");
  assert.equal(ot("pack.close"), "Đóng");
  assert.equal(
    ot("pack.ttsHint"),
    "Giọng đọc tạo bằng VieNeu-TTS chạy local qua bridge (127.0.0.1:8787). Nếu bridge chưa chạy, nút này sẽ báo lỗi rõ — không có audio giả.",
  );
  setLang("en");
  assert.equal(ot("welcome.title"), "👋 Welcome to VCut Studio");
  assert.equal(ot("welcome.later"), "Later");
  assert.equal(ot("tour.done"), "Done, let's edit!");
  assert.equal(ot("pack.close"), "Close");
  setLang("vi");
});

ok("ot(): key lạ fallback về chính key", () => {
  setLang("vi");
  assert.equal(ot("welcome.nope"), "welcome.nope");
  setLang("en");
  assert.equal(ot("pack.nope"), "pack.nope");
  setLang("vi");
});

const noop = (): void => {};

ok("render VI: 3 caller hiện đúng chuỗi ot()", () => {
  setLang("vi");
  const welcome = renderToStaticMarkup(
    React.createElement(WelcomeModal, {
      onClose: noop,
      onOpenTour: noop,
      onOpenPack: noop,
    }),
  );
  assert.ok(welcome.includes("Chào mừng tới VCut Studio"), "WelcomeModal thiếu welcome.title vi");
  assert.ok(welcome.includes("Tạo video 1 chạm"), "WelcomeModal thiếu welcome.pack vi");
  assert.ok(welcome.includes("Để sau"), "WelcomeModal thiếu welcome.later vi");
  const tour = renderToStaticMarkup(
    React.createElement(TourCard, { onClose: noop }),
  );
  assert.ok(tour.includes("Bước 1 — Thêm media"), "TourCard thiếu tour.step1Title vi");
  assert.ok(tour.includes("Bỏ qua"), "TourCard thiếu tour.skip vi");
  const pack = renderToStaticMarkup(
    React.createElement(TemplatePackModal, { onClose: noop }),
  );
  assert.ok(pack.includes("Template pack 1 chạm"), "TemplatePackModal thiếu pack.title vi");
  assert.ok(pack.includes("Tạo ngay"), "TemplatePackModal thiếu pack.create vi");
});

ok("render EN: 3 caller hiện đúng chuỗi ot()", () => {
  setLang("en");
  const welcome = renderToStaticMarkup(
    React.createElement(WelcomeModal, {
      onClose: noop,
      onOpenTour: noop,
      onOpenPack: noop,
    }),
  );
  assert.ok(welcome.includes("Welcome to VCut Studio"), "WelcomeModal thiếu welcome.title en");
  assert.ok(welcome.includes("One-click video"), "WelcomeModal thiếu welcome.pack en");
  assert.ok(welcome.includes("Later"), "WelcomeModal thiếu welcome.later en");
  const tour = renderToStaticMarkup(
    React.createElement(TourCard, { onClose: noop }),
  );
  assert.ok(tour.includes("Step 1 — Add media"), "TourCard thiếu tour.step1Title en");
  assert.ok(tour.includes("Skip"), "TourCard thiếu tour.skip en");
  const pack = renderToStaticMarkup(
    React.createElement(TemplatePackModal, { onClose: noop }),
  );
  assert.ok(pack.includes("One-click template pack"), "TemplatePackModal thiếu pack.title en");
  assert.ok(pack.includes("Create now"), "TemplatePackModal thiếu pack.create en");
  setLang("vi");
});

runAll();

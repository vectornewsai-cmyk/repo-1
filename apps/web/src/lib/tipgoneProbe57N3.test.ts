// tipgoneProbe57N3.test.ts — Phase 9 đợt 57, luồng N3: đóng nợ LIMITS đợt 56
// §4.3 — nhánh tipGone của EnhancePanel là nhánh chết qua UI thật (đợt 56 M9
// đo headed: ghost selection → Inspector render ProjectInfo, không có
// tipGone trong DOM, vì Inspector.tsx gate `if (!track || !clip)` chặn
// trước khi EnhancePanel render).
//
// Luồng này mở ĐƯỜNG ĐO dev-only: chỉ khi URL có ?vcut-probe=enhance-tipgone
// thì gate mới render EnhancePanel trực tiếp (nhánh !track || !clip của
// EnhancePanel → t("keyframe.tipGone")); không có param → hành vi cũ
// (ProjectInfo). KHÔNG sửa vi.json/en.json trực tiếp; KHÔNG đụng panel khác.
//
// Chạy bằng esbuild bundle (mẫu L1/L2/M3, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs:
//   ./node_modules/.bin/esbuild apps/web/src/lib/tipgoneProbe57N3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round57-n3/n3.test.cjs \
//     && node /tmp/round57-n3/n3.test.cjs
//
// Test này chỉ khóa ở mức source + dict. Nhánh tipGone qua UI thật được đo
// bằng probe headed ~/scratch-round57-n3/clicktest-57n3-tipgone.mjs
// (bằng chứng tại hidden_files/round57-n3/).
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
  console.log(`N3 tipGone probe round 57: ${pass}/${queue.length} pass`);
}

function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
function dict(lang: "vi" | "en"): Record<string, unknown> {
  return JSON.parse(readFileSync(`apps/web/src/i18n/${lang}.json`, "utf8")) as Record<string, unknown>;
}
function lookup(raw: Record<string, unknown>, key: string): unknown {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur;
}

ok("source: Inspector gate có đường probe dev-only cho tipGone", () => {
  const src = readSrc("Inspector.tsx");
  const gate = src.indexOf("if (!track || !clip)");
  assert.ok(gate >= 0, "không tìm thấy gate if (!track || !clip)");
  const probe = src.indexOf('get("vcut-probe")');
  assert.ok(probe > gate, "probe phải nằm SAU gate if (!track || !clip)");
  assert.ok(src.includes('"enhance-tipgone"'), "thiếu giá trị probe enhance-tipgone");
  assert.ok(src.includes('data-probe="enhance-tipgone"'), "thiếu marker data-probe để harness assert");
  const retProject = src.indexOf("return <ProjectInfo />;", probe);
  assert.ok(retProject > probe, "sau probe vẫn phải return <ProjectInfo /> (hành vi mặc định giữ nguyên)");
  const probeBlock = src.slice(probe, retProject);
  assert.ok(probeBlock.includes("<EnhancePanel />"), "khối probe phải render <EnhancePanel /> trực tiếp");
  // Khối probe chỉ render EnhancePanel, không đụng panel khác.
  for (const other of ["<MaskPanel", "<MotionPanel", "<KeyframePanel", "<SpeedPanel", "<ChromaPanel", "<BgRemovePanel", "<EffectPanel", "<TransitionPanel", "<LutPicker", "<ColorAdjustPanel", "<AudioFxPanel", "<TrackPanel"]) {
    assert.ok(!probeBlock.includes(other), `khối probe đụng panel khác: ${other}`);
  }
  // Chỉ có đúng 2 chỗ render EnhancePanel: section video cũ + khối probe.
  const count = src.split("<EnhancePanel />").length - 1;
  assert.equal(count, 2, `phải có đúng 2 <EnhancePanel /> (section + probe), thấy ${count}`);
});

ok("source: EnhancePanel giữ nhánh tipGone qua t(), không literal cứng", () => {
  const src = readSrc("components/enhance/EnhancePanel.tsx");
  assert.ok(src.includes('t("keyframe.tipGone")'), "EnhancePanel phải gọi t(keyframe.tipGone)");
  assert.ok(!src.includes('"Clip không còn tồn tại."'), "EnhancePanel còn literal VI cứng");
  assert.ok(!src.includes('"The clip no longer exists."'), "EnhancePanel còn literal EN cứng");
});

ok("dict: keyframe.tipGone đúng từng chữ cả 2 ngôn ngữ", () => {
  assert.equal(lookup(dict("en"), "keyframe.tipGone"), "The clip no longer exists.");
  assert.equal(lookup(dict("vi"), "keyframe.tipGone"), "Clip không còn tồn tại.");
});

ok("source: key keyframe.tipGone còn được KeyframePanel dùng chung (không được xóa key)", () => {
  const src = readSrc("components/keyframes/KeyframePanel.tsx");
  assert.ok(
    src.includes('keyframe.tipGone'),
    "KeyframePanel phải còn dùng keyframe.tipGone — key này dùng chung, nhánh chết chỉ ở EnhancePanel không đủ lý do xóa key",
  );
});

runAll();

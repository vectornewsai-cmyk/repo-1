// resumeRenderJob66T8.test.ts — Phase 9 đợt 66, luồng T8: resume job
// render khi mở lại ExportPanel + nút ngôn ngữ TopBar bấm được khi modal
// Export mở (đóng nợ đợt 65 S10 / ROUND65_LIMITS §8.7).
//
// Tầng lib (hàm thuần, test ở đây):
//   - pickResumeCandidate: job active (running/queued) mới nhất thắng;
//     không có active thì job retryable (error/interrupted) mới nhất;
//     còn lại null → panel mở idle như cũ (done/cancelled/không có job).
//   - resumeJobStrings: chuỗi từ fragment round66-t8 (đọc trực tiếp,
//     không chờ gộp dict — mẫu gpuProbe65S4), không bao giờ trả key thô.
// Tầng nối UI (kiểm chứng tĩnh, mẫu jobNote65S10): ExportPanel mount
// fetch GET /api/render rồi áp job qua pollStatus; nút "Render lại"
// POST /api/render/:id/retry; TopBar + styles.css cho nút ngôn ngữ
// thoát lên trên backdrop (z 401 > 400) mà không nâng cả TopBar.
// Tầng headed (clicktest-66t8-resume-job-headed.mjs) đo thật trên trình
// duyệt: đóng/mở lại panel giữa lúc render, SIGKILL bridge + restart,
// bấm nút cờ bằng chuột thật khi modal mở (desktop + mobile).
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/resumeRenderJob66T8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round66-t8/t8.test.cjs \
//     && node /tmp/round66-t8/t8.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RESUME_JOB_KEYS,
  findResumableJob,
  findRetryableJob,
  isActiveRenderStatus,
  isRetryableRenderStatus,
  pickResumeCandidate,
  resumeJobString,
  resumeJobStrings,
  type ResumableRenderJob,
} from "./resumeRenderJob66T8";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5/R8/S10). */
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
  console.log(`T8 resume job round 66: ${pass}/${queue.length} pass`);
}

/** Tìm file từ cwd (gốc repo hoặc apps/web), mẫu modalSheet63R1/R8/S10. */
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    resolve(process.cwd(), ...parts),
    resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round66-t8.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { exportPanel: Record<string, string> };
  en: { exportPanel: Record<string, string> };
};

const EXPORT_PANEL_PATH = resolveFromCwd(
  "apps", "web", "src", "ExportPanel.tsx",
);
const exportPanelSrc = readFileSync(EXPORT_PANEL_PATH, "utf8");

const STYLES_PATH = resolveFromCwd("apps", "web", "src", "styles.css");
const stylesSrc = readFileSync(STYLES_PATH, "utf8");

const TOPBAR_PATH = resolveFromCwd("apps", "web", "src", "TopBar.tsx");
const topbarSrc = readFileSync(TOPBAR_PATH, "utf8");

function job(id: string, status: string, createdAt = 1000): ResumableRenderJob {
  return { id, status, createdAt };
}

// --- 1. Phân loại trạng thái ---
ok("isActiveRenderStatus: chỉ running/queued là active", () => {
  assert.equal(isActiveRenderStatus("running"), true);
  assert.equal(isActiveRenderStatus("queued"), true);
  for (const s of ["done", "error", "cancelled", "interrupted", "", null, undefined]) {
    assert.equal(isActiveRenderStatus(s), false, `${s} không phải active`);
  }
});

ok("isRetryableRenderStatus: chỉ error/interrupted retry được (đúng jobQueue.retry)", () => {
  assert.equal(isRetryableRenderStatus("error"), true);
  assert.equal(isRetryableRenderStatus("interrupted"), true);
  for (const s of ["done", "running", "queued", "cancelled", "", null, undefined]) {
    assert.equal(isRetryableRenderStatus(s), false, `${s} không retry được`);
  }
});

// --- 2. findResumableJob: job active mới nhất ---
ok("findResumableJob: rỗng/null → null (panel mở idle)", () => {
  assert.equal(findResumableJob([]), null);
  assert.equal(findResumableJob(null), null);
  assert.equal(findResumableJob(undefined), null);
});

ok("findResumableJob: chỉ done/cancelled/interrupted/error → null", () => {
  assert.equal(findResumableJob([job("a", "done")]), null);
  assert.equal(findResumableJob([job("a", "cancelled")]), null);
  assert.equal(findResumableJob([job("a", "interrupted")]), null);
  assert.equal(findResumableJob([job("a", "error")]), null);
});

ok("findResumableJob: running và queued đều nối được", () => {
  assert.equal(findResumableJob([job("a", "running")])?.id, "a");
  assert.equal(findResumableJob([job("a", "queued")])?.id, "a");
});

ok("findResumableJob: job active mới nhất thắng (createdAt desc)", () => {
  const jobs = [job("old", "running", 1000), job("new", "running", 2000)];
  assert.equal(findResumableJob(jobs)?.id, "new");
  assert.equal(findResumableJob([...jobs].reverse())?.id, "new");
});

ok("findResumableJob: job done mới hơn không át job running cũ hơn", () => {
  const jobs = [job("run", "running", 1000), job("done", "done", 9000)];
  assert.equal(findResumableJob(jobs)?.id, "run");
});

ok("findResumableJob: thiếu createdAt → giữ thứ tự list (server đã sort mới nhất trước)", () => {
  const a = { id: "a", status: "running" };
  const b = { id: "b", status: "running" };
  assert.equal(findResumableJob([a, b])?.id, "a");
  assert.equal(findResumableJob([b, a])?.id, "b");
});

ok("findResumableJob: bỏ qua job không có id", () => {
  const bad = { id: "", status: "running", createdAt: 9999 } as ResumableRenderJob;
  assert.equal(findResumableJob([bad, job("good", "running", 1000)])?.id, "good");
  assert.equal(findResumableJob([bad]), null);
});

// --- 3. findRetryableJob: job lỗi/gián đoạn mới nhất ---
ok("findRetryableJob: interrupted/error mới nhất; done/cancelled → null", () => {
  assert.equal(findRetryableJob([job("i", "interrupted", 1000)])?.id, "i");
  assert.equal(findRetryableJob([job("e", "error", 1000)])?.id, "e");
  assert.equal(findRetryableJob([job("d", "done", 9000), job("e", "error", 1000)])?.id, "e");
  assert.equal(findRetryableJob([job("c", "cancelled")]), null);
  assert.equal(findRetryableJob([job("d", "done")]), null);
});

// --- 4. pickResumeCandidate: thứ tự ưu tiên ---
ok("pickResumeCandidate: active thắng retryable dù retryable mới hơn", () => {
  const jobs = [job("err", "error", 9000), job("run", "running", 1000)];
  const c = pickResumeCandidate(jobs);
  assert.ok(c && c.kind === "active" && c.job.id === "run");
});

ok("pickResumeCandidate: không active → retryable (hiện lỗi + nút Render lại)", () => {
  const c = pickResumeCandidate([job("d", "done", 9000), job("i", "interrupted", 1000)]);
  assert.ok(c && c.kind === "retryable" && c.job.id === "i");
});

ok("pickResumeCandidate: done/cancelled/không job → null (panel mở idle)", () => {
  assert.equal(pickResumeCandidate([job("d", "done")]), null);
  assert.equal(pickResumeCandidate([job("c", "cancelled")]), null);
  assert.equal(pickResumeCandidate([]), null);
});

// --- 5. Chuỗi fragment: đủ key, vi≠en, không trả key thô ---
ok("fragment round66-t8: đủ 2 key vi+en, không rỗng, vi khác en", () => {
  for (const k of ["resumedJob", "retryRender"]) {
    const vi = frag.vi.exportPanel[k];
    const en = frag.en.exportPanel[k];
    assert.ok(typeof vi === "string" && vi.length > 0, `thiếu vi ${k}`);
    assert.ok(typeof en === "string" && en.length > 0, `thiếu en ${k}`);
    assert.notEqual(vi, en, `${k}: vi phải khác en`);
  }
  assert.deepEqual([...RESUME_JOB_KEYS].sort(), ["exportPanel.resumedJob", "exportPanel.retryRender"].sort());
});

ok("resumeJobStrings: vi/en ra đúng chuỗi fragment", () => {
  assert.equal(resumeJobStrings("vi").resumedJob, frag.vi.exportPanel.resumedJob);
  assert.equal(resumeJobStrings("en").resumedJob, frag.en.exportPanel.resumedJob);
  assert.equal(resumeJobStrings("vi").retryRender, frag.vi.exportPanel.retryRender);
  assert.equal(resumeJobStrings("en").retryRender, frag.en.exportPanel.retryRender);
});

ok("resumeJobString: thiếu key → undefined (không bao giờ in key thô ra UI)", () => {
  assert.equal(resumeJobString("khongCoKeyNay", "vi"), undefined);
  assert.equal(resumeJobString("khongCoKeyNay", "en"), undefined);
  // Thiếu en thì rớt về vi (đúng quy ước i18n/index.ts).
  const table = { vi: { resumedJob: "VI" }, en: {} as Record<string, string> };
  assert.equal(resumeJobString("resumedJob", "en", table), "VI");
});

// --- 6. Tầng nối UI (tĩnh): ExportPanel mount resume + retry ---
ok("ExportPanel mount fetch GET /api/render rồi pickResumeCandidate", () => {
  assert.ok(
    exportPanelSrc.includes('fetch(`${BRIDGE_URL}/api/render?limit=10`)'),
    "mount effect phải GET /api/render?limit=10",
  );
  assert.ok(
    exportPanelSrc.includes("pickResumeCandidate("),
    "mount effect phải chọn ứng viên qua pickResumeCandidate",
  );
  assert.ok(
    exportPanelSrc.includes('fetch(`${BRIDGE_URL}/api/render/${candidate.job.id}?detail=1`)'),
    "resume phải lấy chi tiết ?detail=1 (errorDetail chỉ có ở đó)",
  );
});

ok("ExportPanel resume job active → rendering + pollStatus(job.id)", () => {
  assert.ok(
    exportPanelSrc.includes('if (job.status === "running" || job.status === "queued")'),
    "resume phải nối job running/queued",
  );
  assert.ok(
    exportPanelSrc.includes("pollStatus(job.id)"),
    "resume job active phải poll tiếp bằng pollStatus(job.id)",
  );
});

ok("ExportPanel resume job lỗi/gián đoạn → error + note, không poll", () => {
  const idx = exportPanelSrc.indexOf("const applyResumedJob");
  assert.ok(idx >= 0, "thiếu applyResumedJob");
  const block = exportPanelSrc.slice(idx, idx + 2600);
  assert.ok(block.includes('setRenderStatus("error")'), "job error/interrupted resume về trạng thái error");
  assert.ok(block.includes("resolveJobNote(job.noteCode, job.note, getLang())"), "resume phải resolve note theo locale hiện tại");
});

ok("ExportPanel nút Render lại POST /api/render/:id/retry rồi poll tiếp", () => {
  assert.ok(
    exportPanelSrc.includes('fetch(`${BRIDGE_URL}/api/render/${jobId}/retry`, { method: "POST" })'),
    "retryRender phải POST /api/render/:id/retry",
  );
  assert.ok(
    exportPanelSrc.includes("resumeStrings.retryRender"),
    "nút retry phải dùng chuỗi fragment resumeStrings.retryRender",
  );
});

ok("ExportPanel bắt đầu render mới thì xoá jobId cũ (không retry/tải nhầm job cũ)", () => {
  const idx = exportPanelSrc.indexOf("const startRender");
  assert.ok(idx >= 0, "thiếu startRender");
  const head = exportPanelSrc.slice(idx, idx + 700);
  assert.ok(head.includes("setJobId(null);"), "startRender phải xoá jobId cũ trước mọi early-return");
  assert.ok(head.includes("activeJobIdRef.current = null;"), "startRender phải xoá ref job cũ");
});

ok("ExportPanel resume thì cuộn tới khối tiến trình/banner lỗi (không khuất dưới fold)", () => {
  assert.ok(
    exportPanelSrc.includes('document.querySelector(".render-progress")'),
    "effect resume phải cuộn tới .render-progress khi nối lại job đang chạy",
  );
  assert.ok(
    exportPanelSrc.includes('document.querySelector(".mp4-export .valid-banner.bad")'),
    "effect resume phải cuộn tới banner lỗi khi nối lại job lỗi/gián đoạn",
  );
  const idx = exportPanelSrc.indexOf("if (!resumedJob) return;");
  assert.ok(idx >= 0, "thiếu effect auto-scroll khi resumedJob");
  const eff = exportPanelSrc.slice(Math.max(0, idx - 1200), idx + 400);
  assert.ok(eff.includes("scrollIntoView"), "effect phải gọi scrollIntoView");
  assert.ok(eff.includes("[resumedJob]"), "effect chỉ chạy khi resumedJob đổi (không cuộn lại vô cớ)");
});

ok("ExportPanel khối progress mang data-job-id + nhãn resume (điểm bám headed)", () => {
  assert.ok(
    exportPanelSrc.includes('<div className="render-progress" data-job-id={jobId ?? undefined}>'),
    "khối progress phải mang data-job-id để headed đối chiếu đúng job",
  );
  assert.ok(
    exportPanelSrc.includes("resumeStrings.resumedJob"),
    "khối progress/lỗi phải hiện nhãn resume khi job được nối lại",
  );
});

ok("ExportPanel trạng thái lỗi hiện note phục hồi (.render-note) khi có", () => {
  assert.ok(
    exportPanelSrc.includes('{renderStatus === "error" && renderNote && ('),
    "trạng thái lỗi phải hiện .render-note khi job có note (vd phục hồi sau restart)",
  );
});

// --- 7. Tầng nối UI (tĩnh): nút ngôn ngữ thoát lên trên backdrop ---
ok("TopBar nút ngôn ngữ mang class topbar-lang-btn", () => {
  assert.ok(
    topbarSrc.includes('className="tbtn topbar-lang-btn"'),
    "nút ngôn ngữ TopBar phải mang class topbar-lang-btn",
  );
});

ok("styles.css: .topbar KHÔNG z-index; .topbar-lang-btn z 401 > backdrop 400", () => {
  const topbarRule = stylesSrc.match(/\.topbar \{[^}]*\}/s);
  assert.ok(topbarRule, "thiếu rule .topbar");
  // Bỏ comment trong rule trước khi kiểm (comment giải thích có nhắc
  // "z-index: 30" cũ — đó không phải khai báo).
  const topbarDecls = topbarRule[0].replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(
    !/z-index\s*:/.test(topbarDecls),
    ".topbar KHÔNG được có z-index (tạo stacking context kẹt nút ngôn ngữ)",
  );
  const langZ = stylesSrc.match(/\.topbar-lang-btn \{[^}]*z-index:\s*(\d+)/s);
  assert.ok(langZ, "thiếu rule .topbar-lang-btn");
  assert.equal(Number(langZ[1]), 401, ".topbar-lang-btn phải z 401");
  const backdropZ = stylesSrc.match(/\.modal-backdrop \{[^}]*z-index:\s*(\d+)/s);
  assert.ok(backdropZ && Number(backdropZ[1]) === 400, ".modal-backdrop phải giữ z 400");
  assert.ok(
    Number(langZ[1]) > Number(backdropZ[1]),
    "nút ngôn ngữ (401) phải trên backdrop (400) mới bấm được khi modal mở",
  );
});

runAll();

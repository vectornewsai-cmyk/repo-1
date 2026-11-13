// measure-70x2-gate-window-launcher.mjs — Phase 9 đợt 70, luồng X2.
// Launcher chạy BẢN VARIANT của measure-65r8-presented-fps.mjs mà KHÔNG
// ghi file variant ra đĩa và KHÔNG sửa harness gốc.
// Mục đích: THỬ NGHIỆM gate mở rộng (cửa sổ 2: giây 6–16, delta ≥ 20) để kiểm
// chứng giả thiết A1 của W8 đợt 69 — xem docs/PHASE9_ROUND69_W8_GATE_WINDOW_LIMITS.md.
//   - Gate 1 (6 s, delta ≥ 20) GIỮ NGUYÊN 100%, không hạ chuẩn, không sửa.
//   - Thêm cửa sổ 2: sau gate 1 PASS, phát TIẾP từ vị trí dừng (KHÔNG seek lại)
//     thêm 10 s, đo RIÊNG delta2 = drawAt16 − drawAt6 (ngủ yên, không lấy mẫu
//     giữa chừng — cùng phương pháp với gate 1, tránh overhead CDP làm méo số).
//     Gate2 FAIL KHÔNG dừng lần đo: vẫn chạy đủ 3 slot để đối chiếu verdict
//     với slot draw thật (ground truth cho false-negative/false-positive).
//   - Thêm time-course: sau 3 slot, phát liên tục 16 s từ seek-0, mẫu draw 1 s
//     — phân biệt "sụp do phát lâu" vs "sụp do seek" (A1 có thể sai theo cơ chế
//     seek). Mẫu 1 s có overhead CDP như probe A/B đợt 68 → chỉ dùng TỈ LỆ
//     trong cùng probe, không so tốc độ tuyệt đối với gate/slot.
//   - Kết quả gate mở rộng + time-course được ghi thêm vào presented-fps.json
//     (trường gateExtended, timeCourse). Harness gốc KHÔNG đổi.
// Phần chuẩn bị môi trường kế thừa V4 (đợt 68): hardcode cổng, config vite .cjs
// pre-create, pickDisplay không dùng execSync, mở log fd trước spawn, ghi cuối
// best-effort — để né lỗi EPERM hệ thống (xem LIMITS V4 §5).
// Cách chạy (từ repo root), mỗi phiên một R8_SCRATCH riêng:
//   R8_PRES_RES=1080 R8_PRES_REPEATS=3 \
//   R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x2/session1 \
//   node apps/web/scripts/measure-70x2-gate-window-launcher.mjs
// Yêu cầu trước khi chạy:
//   - Config vite đã có sẵn tại /tmp/round70-x2/vite.x2-presented.config.cjs
//     (pre-create bằng file-tool; nội dung = template vite config của harness gốc).
//   - Cổng 5560 (vite) và 9660 (debug) trống (kiểm tra bằng `ss -ltn`).
//   - Đặt X2_DEV_PORT/X2_DEBUG_PORT nếu cần đổi cổng.
import fs from "node:fs";

const SRC = "/home/hatch/workspace/repo-1/apps/web/scripts/measure-65r8-presented-fps.mjs";

const HELPERS = [
  "// V4 (đợt 68): ghi file chịu lỗi EPERM môi trường — thử 1 lần, lỗi thì",
  "// cảnh báo qua log và tiếp tục (không ném). Dữ liệu đo vẫn có trong log console.",
  "function writeBestEffort(p, data) {",
  "  try { fs.writeFileSync(p, data); return true; }",
  "  catch (e) { log(`cảnh báo: không ghi được ${p} (${e.code || e.message}) — dữ liệu vẫn có trong log console`); return false; }",
  "}",
  "// V4: ghi config vite — KHÔNG ghi đè khi file đã có sẵn với đúng nội dung",
  "// cần (config được pre-create bằng file-tool trước khi chạy, vì ghi từ",
  "// tiến trình exec hay dính EPERM sau bind/spawn).",
  "function writeConfigBestEffort(p, content) {",
  "  try { if (fs.existsSync(p) && fs.readFileSync(p, \"utf8\") === content) { log(`config vite đã có sẵn đúng nội dung, bỏ qua ghi (${p})`); return true; } } catch {}",
  "  return writeBestEffort(p, content);",
  "}",
].join("\n");

const REPS = [
  // 1. Header: ghi rõ đây là variant X2, gate 1 + logic đo giữ nguyên.
  [" * measure-65r8-presented-fps.mjs — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8):",
   " * measure-70x2-gate-window.mjs — Phase 9 đợt 70, luồng X2: BẢN VARIANT THỬ NGHIỆM gate mở rộng của measure-65r8-presented-fps.mjs. Gate 1 (6 s, delta ≥ 20) + logic đo slot GIỮ NGUYÊN 100%; chỉ thêm: (a) cửa sổ 2 sau gate 1 (phát tiếp 10 s, không seek, đo riêng delta2 ≥ 20, FAIL không dừng đo — để đối chiếu với slot), (b) time-course 16 s mẫu 1 s sau slot (phân biệt sụp-do-phát-lâu vs sụp-do-seek). Phần chuẩn bị môi trường kế thừa V4 đợt 68 (hardcode cổng, config vite .cjs pre-create, pickDisplay không execSync, mở log fd trước spawn, ghi cuối best-effort). Gốc (đợt 65 S8):"],
  // 2. Đổi thư mục config vite sang /tmp/round70-x2.
  ['const VITE_CFG_DIR = "/tmp/round65-r8";', 'const VITE_CFG_DIR = "/tmp/round70-x2";'],
  ['const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8-presented.config.mjs");', 'const VITE_CFG = path.join(VITE_CFG_DIR, "vite.x2-presented.config.cjs"); // X2: .cjs để vite dùng nhánh CJS (biên dịch trong bộ nhớ, KHÔNG ghi temp file — nhánh ESM ghi .vite-temp và dính EPERM, xem LIMITS V4 §5).'],
  ['const TMPDIR = "/tmp/round65-r8/tmp";', 'const TMPDIR = "/tmp/round70-x2/tmp";'],
  // 3. Hardcode cổng (đã kiểm tra trống bằng ss trước khi chạy), bỏ pickFreePort.
  ["const DEV_PORT = Number(process.env.R8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));",
   "const DEV_PORT = Number(process.env.X2_DEV_PORT || 0) || 5560;"],
  ["const DEBUG_PORT = Number(process.env.R8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));",
   "const DEBUG_PORT = Number(process.env.X2_DEBUG_PORT || 0) || 9660;"],
  // 4. Chèn helpers sau dòng const logLines.
  ["const logLines = [];", "const logLines = [];\n" + HELPERS],
  // 5. pickDisplay: bỏ execSync, kiểm tra liveness bằng connect socket Unix.
  ['      const { execSync } = await import("node:child_process");',
   "      // X2 (kế thừa V4): bỏ execSync (spawn con làm độc ghi file) — kiểm tra liveness bằng connect socket Unix."],
  ['          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }',
   '          try { alive = await new Promise((res) => { const s = net.createConnection(sock); s.once("connect", () => { s.end(); res(true); }); s.once("error", () => res(false)); setTimeout(() => { try { s.destroy(); } catch {} res(false); }, 2000); }); } catch { alive = false; }'],
  // 6. Ghi config vite qua helper (bỏ qua khi đã có sẵn đúng nội dung).
  ["    fs.writeFileSync(VITE_CFG, ", "    writeConfigBestEffort(VITE_CFG, "],
  // 7. Mở chromeLogFd cùng lúc với viteLogFd (trước mọi spawn).
  ['    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");',
   "    // X2 (kế thừa V4): chromeLogFd đã mở cùng viteLogFd ở trên (trước mọi spawn)."],
  ['    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");',
   '    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");\n    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");'],
  // 8. Ghi JSON/log cuối best-effort (không ném nếu EPERM — số đo vẫn có trong log console).
  ['    fs.writeFileSync(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));',
   '    writeBestEffort(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));'],
  ['    fs.writeFileSync(path.join(SCRATCH, "presented-fps.log"), logLines.join("\\n") + "\\n");',
   '    writeBestEffort(path.join(SCRATCH, "presented-fps.log"), logLines.join("\\n") + "\\n");'],
  // 9. X2: khai báo biến giữ kết quả gate mở rộng + time-course (dùng ở report JSON).
  ['    // ---- GATE warmup (như R64): element clip dài THẬT SỰ phát được ----',
   '    let gateExt = null; let timeCourse = null;\n    // ---- GATE warmup (như R64): element clip dài THẬT SỰ phát được ----'],
  // 10. X2: cửa sổ 2 ngay sau khi gate 1 PASS (trong khối gate, sau log GATE warmup OK).
  ['      log("GATE warmup OK: element clip dài phát được, vào vòng đo presented");',
   `      log("GATE warmup OK: element clip dài phát được, vào vòng đo presented");
      // X2 (đợt 70): cửa sổ 2 — phát TIẾP từ vị trí dừng (KHÔNG seek lại) thêm 10 s.
      // Đo RIÊNG delta2 (không gộp với gate 1 — tích lũy sẽ bị 6 s đầu "gánh", xem LIMITS W8 §4).
      // Gate2 FAIL KHÔNG dừng lần đo: vẫn chạy đủ 3 slot để đối chiếu verdict với slot draw thật.
      {
        const elAt6 = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE)).catch(() => null);
        const ctAt6 = elAt6?.el?.ct ?? null;
        const drawAt6b = (await cdp.evalJs(STATE_FN)).hold?.draw ?? 0;
        await togglePlay(cdp);
        await sleep(10000);
        await togglePlay(cdp);
        await sleep(400);
        const st16 = await cdp.evalJs(STATE_FN);
        const drawAt16 = st16.hold?.draw ?? 0;
        const el16 = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE)).catch(() => null);
        const delta2 = drawAt16 - drawAfter;
        const rate2 = delta2 / 10;
        const guardOk = typeof ctAt6 === "number" ? ctAt6 <= 10 : false;
        const g2pass = delta2 >= 20;
        const verdict = !guardOk ? "INCONCLUSIVE" : g2pass ? "PASS" : "FAIL";
        gateExt = { delta1: drawDelta, draw0, drawAt6: drawAfter, drawAt6b, drawAt16, delta2,
          rate2Fps: +rate2.toFixed(2), rate1Fps: +(drawDelta / 6).toFixed(2),
          ctAt6, ctAt16: el16?.el?.ct ?? null, elRs16: el16?.el?.rs ?? null,
          qAt6: elAt6?.el?.q?.total ?? null, qAt16: el16?.el?.q?.total ?? null,
          presentedRate2Fps: elAt6?.el?.q && el16?.el?.q ? +((el16.el.q.total - elAt6.el.q.total) / 10).toFixed(2) : null,
          clipGuardOk: guardOk, gate2Pass: g2pass, verdict,
          collapseRatio: drawDelta > 0 ? +(rate2 / (drawDelta / 6)).toFixed(2) : null };
        log(\`GATE2 (X2, cửa sổ 6-16s): draw \${drawAfter} → \${drawAt16} (delta2 \${delta2}, cần ≥20, rate2 \${rate2.toFixed(2)} fps), presented \${elAt6?.el?.q?.total} → \${el16?.el?.q?.total} (rate \${gateExt.presentedRate2Fps} fps), ct \${ctAt6} → \${el16?.el?.ct}, drawAt6b=\${drawAt6b}, guard \${guardOk} → \${verdict}\`);
        log(\`GATE-EXTENDED VERDICT (X2, thử nghiệm): gate1 delta \${drawDelta} PASS + gate2 \${verdict} — KHÔNG dừng khi gate2 FAIL, vẫn đo slot để đối chiếu\`);
      }`],
  // 11. X2: time-course 16 s mẫu 1 s, chèn trước đối chứng tab trắng (sau vòng slot).
  ['    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------',
   `    // X2 (đợt 70): time-course phát liên tục 16 s, mẫu 1 s — phân biệt "sụp do phát lâu"
    // vs "sụp do seek" (giả thiết A1). Mẫu 1 s qua CDP có overhead (như probe A/B đợt 68)
    // nên chỉ dùng TỈ LỆ trong cùng probe, không so tốc độ tuyệt đối với gate/slot.
    {
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, "time-course seek 0");
      const tcSamples = [];
      const tcD0 = (await cdp.evalJs(STATE_FN)).hold?.draw ?? 0;
      tcSamples.push({ t: 0, draw: tcD0, ct: 0, rs: null });
      await togglePlay(cdp);
      for (let s = 1; s <= 16; s++) {
        await sleep(1000);
        const smp = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE)).catch(() => null);
        tcSamples.push({ t: s, draw: smp?.draw ?? null, ct: smp?.el?.ct ?? null, rs: smp?.el?.rs ?? null, qTotal: smp?.el?.q?.total ?? null });
      }
      await togglePlay(cdp);
      await sleep(400);
      const tcBuckets = [];
      for (let b = 0; b < 8; b++) {
        const a = tcSamples[b * 2], c = tcSamples[b * 2 + 2];
        tcBuckets.push({ from: b * 2, to: b * 2 + 2, rate: a?.draw != null && c?.draw != null ? +((c.draw - a.draw) / 2).toFixed(2) : null });
      }
      const tcFirst6 = tcSamples[0]?.draw != null && tcSamples[6]?.draw != null ? (tcSamples[6].draw - tcSamples[0].draw) / 6 : null;
      const tcAfter6 = tcSamples[6]?.draw != null && tcSamples[16]?.draw != null ? (tcSamples[16].draw - tcSamples[6].draw) / 10 : null;
      timeCourse = { samples: tcSamples, buckets: tcBuckets,
        rateFirst6Fps: tcFirst6 != null ? +tcFirst6.toFixed(2) : null,
        rateAfter6Fps: tcAfter6 != null ? +tcAfter6.toFixed(2) : null,
        afterOverBefore: tcFirst6 && tcAfter6 != null ? +(tcAfter6 / tcFirst6).toFixed(2) : null };
      log(\`TIME-COURSE (X2, phát liên tục 16s, mẫu 1s): buckets 2s = \${tcBuckets.map((x) => x.from + "-" + x.to + "s:" + x.rate).join(" ")}; 0-6s \${timeCourse.rateFirst6Fps} fps, 6-16s \${timeCourse.rateAfter6Fps} fps, sau/trước \${timeCourse.afterOverBefore}x\`);
    }
    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------`],
  // 12. X2: ghi gateExtended + timeCourse vào report JSON.
  ["      clip: LONG_FILE, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,",
   "      clip: LONG_FILE, gateExtended: gateExt, timeCourse, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,"],
];

let src = fs.readFileSync(SRC, "utf8");
let n = 0;
for (const [search, replacement] of REPS) {
  if (!src.includes(search)) {
    console.error(`KHÔNG TÌM THẤY chuỗi cần thay (#${n + 1}): ${JSON.stringify(search.slice(0, 120))}`);
    process.exit(2);
  }
  src = src.replace(search, replacement);
  n++;
}
// X2 launcher: import.meta.url không dùng được qua data: URL → hardcode ROOT.
const ROOT_SEARCH = 'const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");';
if (!src.includes(ROOT_SEARCH)) { console.error("KHÔNG TÌM THẤY dòng ROOT"); process.exit(2); }
src = src.replace(ROOT_SEARCH, 'const ROOT = "/home/hatch/workspace/repo-1"; // X2 launcher: hardcode vì import qua data: URL.');
n++;
if (src.startsWith("#!")) src = src.slice(src.indexOf("\n") + 1); // bỏ shebang (data: URL)
console.log(`LAUNCHER X2: ${n} thay thế OK, import variant qua data: URL (${src.length} byte)`);
const b64 = Buffer.from(src).toString("base64");
await import(`data:text/javascript;base64,${b64}`);

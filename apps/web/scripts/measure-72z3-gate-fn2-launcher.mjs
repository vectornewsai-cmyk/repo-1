// measure-72z3-gate-fn2-launcher.mjs — Phase 9 đợt 72, luồng Z3.
// Nối re-gate của Y3 vào harness đo presented-FPS như CỬA KIỂM TRA THỨ HAI
// (đợt 71 §5 mục 3): phiên chết nếu gate1a HOẶC re-gate FAIL — TẠM THỜI,
// có cờ bật/tắt rõ ràng (Z3_REGATE_GATE=0 → chế độ quan sát như Y3).
// Ngưỡng re-gate qua env Z3_REGATE_THRESHOLD (mặc định 30 — hiệu chuẩn đợt 72,
// xem LIMITS: delta FN max 18, delta khỏe min 82, ngưỡng 30 trong khoảng (18, 82]).
// Kế thừa toàn bộ launcher Y3 (variant của measure-65r8-presented-fps.mjs,
// import qua data: URL, harness gốc KHÔNG sửa); chỉ thêm:
//   (a) re-gate FAIL + cửa BẬT → break khỏi vòng slot, bỏ qua resume-probe
//       + đối chứng tab trắng, vẫn ghi presented-fps.json (slot 1 là ground
//       truth duy nhất của phiên chết) + cờ z3.killedByRegate trong JSON;
//   (b) sửa quirk Y3 §6: probe B nay ghi đủ pauseRetryExhausted /
//       seekFailureExhausted vào summary (không chỉ trong samples);
//   (c) Z3_DRY_RUN=1: chỉ sinh variant, in số byte, không chạy đo
//       (Z3_DRY_RUN_FILE=<path> để ghi variant ra file kiểm tra).
// Burner-control kế thừa nguyên từ Y3 (Y3_BURNER=1, không chạy mặc định).
//
// Cách chạy (từ repo root), mỗi phiên một R8_SCRATCH riêng:
//   R8_PRES_RES=1080 R8_PRES_REPEATS=3 \
//   R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z3/session1 \
//   node apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs
// Yêu cầu trước khi chạy:
//   - Config vite đã có sẵn tại /tmp/round72-z3/vite.z3-presented.config.cjs
//     (pre-create bằng file-tool; nội dung = template vite config của harness
//     gốc, chuyển sang CJS).
//   - Cổng 5572 (vite) và 9672 (debug) trống (kiểm tra bằng `ss -ltn`).
//   - Đặt Z3_DEV_PORT/Z3_DEBUG_PORT nếu cần đổi cổng.
import fs from "node:fs";

const SRC = "/home/hatch/workspace/repo-1/apps/web/scripts/measure-65r8-presented-fps.mjs";

const HELPERS = [
  "// Y3 (kế thừa V4/X2): ghi file chịu lỗi EPERM môi trường — thử 1 lần, lỗi thì",
  "// cảnh báo qua log và tiếp tục (không ném). Dữ liệu đo vẫn có trong log console.",
  "function writeBestEffort(p, data) {",
  "  try { fs.writeFileSync(p, data); return true; }",
  "  catch (e) { log(`cảnh báo: không ghi được ${p} (${e.code || e.message}) — dữ liệu vẫn có trong log console`); return false; }",
  "}",
  "// Y3: ghi config vite — KHÔNG ghi đè khi file đã có sẵn với đúng nội dung",
  "// cần (config được pre-create bằng file-tool trước khi chạy, vì ghi từ",
  "// tiến trình exec hay dính EPERM sau bind/spawn).",
  "function writeConfigBestEffort(p, content) {",
  "  try { if (fs.existsSync(p) && fs.readFileSync(p, \"utf8\") === content) { log(`config vite đã có sẵn đúng nội dung, bỏ qua ghi (${p})`); return true; } } catch {}",
  "  return writeBestEffort(p, content);",
  "}",
].join("\n");

// Z3 (đợt 72): re-gate làm CỬA KIỂM TRA THỨ HAI — phiên chết nếu gate1a
// HOẶC re-gate FAIL. TẠM THỜI, thu thập dữ liệu: tắt bằng Z3_REGATE_GATE=0
// (chế độ quan sát như Y3: re-gate FAIL không dừng đo).
// Ngưỡng re-gate qua env Z3_REGATE_THRESHOLD (mặc định 30 — hiệu chuẩn đợt 72:
// delta FN quan sát được max 18, delta khỏe min 82; 30 nằm trong khoảng (18, 82],
// bắt FN tới delta 29, cách min khỏe 52 draws; TẠM THỜI, xem lại khi có thêm FN).
const Z3_CONSTANTS = [
  "// Z3 (đợt 72): re-gate làm CỬA KIỂM TRA THỨ HAI — phiên chết nếu gate1a HOẶC re-gate FAIL.",
  "// TẠM THỜI, thu thập dữ liệu: tắt bằng Z3_REGATE_GATE=0 (chế độ quan sát như Y3).",
  "// Ngưỡng re-gate qua env Z3_REGATE_THRESHOLD (mặc định 30 — hiệu chuẩn đợt 72, xem LIMITS).",
  "const Z3_REGATE_GATE = process.env.Z3_REGATE_GATE !== \"0\";",
  "const Z3_REGATE_THRESHOLD = Math.max(1, Number(process.env.Z3_REGATE_THRESHOLD || 30) || 30);",
  "let z3KilledByRegate = false;",
].join("\n");
const PROBE_FN_DEF = [
  "// Y3: mẫu dày resume-probe — toàn bộ __vcutPreviewIdle (mọi trường) +",
  "// __vcutHoldStats + element pool (rs/ct/paused/seeking/networkState/error/",
  "// getVideoPlaybackQuality) + playing/playhead + bộ đếm syncReseeks.",
  "const PROBE_FN = (fileName) => `(() => {",
  "  const idle = window.__vcutPreviewIdle ? { ...window.__vcutPreviewIdle } : null;",
  "  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;",
  "  const st = window.__r3storeMod ? window.__r3storeMod.useStore.getState() : null;",
  "  const rec = (window.__vcutMediaEls || []).find((e) => (e.el.currentSrc || \"\").includes(${JSON.stringify(fileName)}));",
  "  let el = null;",
  "  if (rec) {",
  "    const e = rec.el;",
  "    const q = typeof e.getVideoPlaybackQuality === \"function\" ? e.getVideoPlaybackQuality() : null;",
  "    el = { rs: e.readyState, ct: +e.currentTime.toFixed(3), paused: e.paused, seeking: e.seeking,",
  "      w: e.videoWidth, net: e.networkState, err: e.error ? (e.error.code || 0) : null,",
  "      mark: e.__r8mark || null,",
  "      q: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames, corrupted: q.corruptedVideoFrames } : null };",
  "  }",
  "  return { wall: performance.now(), playing: st ? st.playing : null, ph: st ? st.playhead : null,",
  "    draw: hold ? hold.draw : null, holdN: hold ? hold.hold : null, skip: hold ? hold.skip : null,",
  "    maxHoldAge: hold ? hold.maxHoldAgeSec : null, stale: hold ? hold.stale : null,",
  "    ticks: idle ? idle.ticks : null, sleeping: idle ? idle.sleeping : null,",
  "    lastDrawn: idle ? idle.lastDrawn : null, lastRequested: idle ? idle.lastRequested : null,",
  "    pendingSeek: idle ? idle.pendingSeek : null, redrawFlag: idle ? idle.redrawFlag : null,",
  "    pauseRetrySkipped: idle ? idle.pauseRetrySkipped : null, pauseRetryExhausted: idle ? idle.pauseRetryExhausted : null,",
  "    pauseRetryWallExhausted: idle ? idle.pauseRetryWallExhausted : null,",
  "    seekFailureCount: idle ? idle.seekFailureCount : null, seekFailureExhausted: idle ? idle.seekFailureExhausted : null,",
  "    seekFailureKind: idle ? idle.seekFailureKind : null, seekFailureTarget: idle ? idle.seekFailureTarget : null,",
  "    seekElementRecreated: idle ? idle.seekElementRecreated : null, seekRecreatedSeeking: idle ? idle.seekRecreatedSeeking : null,",
  "    decoderErrorRecovered: idle ? idle.decoderErrorRecovered : null,",
  "    decoderErrorRecoveredPlaying: idle ? idle.decoderErrorRecoveredPlaying : null,",
  "    tickErrors: idle ? idle.tickErrors : null,",
  "    syncReseeks: window.__vcutSyncReseeks ?? null, syncReseeksVideo: window.__vcutSyncReseeksVideo ?? null,",
  "    el };",
  "})()`;",
].join("\n");

const GATE1B_BLOCK = [
  "      if (rep === 2 && !gate1b) {",
  "        // Z3: re-gate — đo lại gate 1 (seek-0, phát 6 s) sau slot 1, nay là CỬA KIỂM TRA",
  "        // THỨ HAI (đợt 72): FAIL + cửa BẬT → phiên chết (break khỏi vòng slot, bỏ qua",
  "        // slot 2-3 + probe + đối chứng; slot 1 là ground truth duy nhất). Cửa TẮT",
  "        // (Z3_REGATE_GATE=0) → chế độ quan sát như Y3: không dừng, slot 2-3 làm ground truth.",
  "        await setEnhCheckbox(cdp, \"enhance-denoise-toggle\", \"denoise\", false, firstClipId);",
  "        await setEnhCheckbox(cdp, \"enhance-stabilize-toggle\", \"stabilize\", false, firstClipId);",
  "        await setEnhCheckbox(cdp, \"enhance-deinterlace-toggle\", \"deinterlace\", false, firstClipId);",
  "        await cdp.evalJs(SET_PLAYHEAD_FN(0));",
  "        await waitIdle(cdp, \"re-gate seek 0\");",
  "        const draw0b = (await cdp.evalJs(STATE_FN)).hold?.draw ?? 0;",
  "        await togglePlay(cdp);",
  "        await sleep(6000);",
  "        await togglePlay(cdp);",
  "        await sleep(400);",
  "        const stGateB = await cdp.evalJs(STATE_FN);",
  "        const drawAfterB = stGateB.hold?.draw ?? 0;",
  "        const delta1b = drawAfterB - draw0b;",
  "        const elGateB = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE)).catch(() => null);",
  "        gate1b = { delta: delta1b, draw0: draw0b, drawAfter: drawAfterB, rateFps: +(delta1b / 6).toFixed(2),",
  "          ct: elGateB?.el?.ct ?? null, elRs: elGateB?.el?.rs ?? null,",
  "          qTotal: elGateB?.el?.q?.total ?? null, verdict: delta1b >= Z3_REGATE_THRESHOLD ? \"PASS\" : \"FAIL\",",
  "          threshold: Z3_REGATE_THRESHOLD, gateMode: Z3_REGATE_GATE ? \"second-gate\" : \"observe\", load: loadAvg() };",
  "        log(`RE-GATE (Z3, sau slot 1): draw ${draw0b} → ${drawAfterB} (delta ${delta1b}, cần ≥${Z3_REGATE_THRESHOLD}, ${gate1b.rateFps} fps), ct=${gate1b.ct}, rs=${gate1b.elRs} → ${gate1b.verdict}; cửa thứ hai ${Z3_REGATE_GATE ? \"BẬT\" : \"TẮT (quan sát)\"}; load ${gate1b.load}`);",
  "        if (y3burners.length) { for (const b of y3burners) { try { b.kill(\"SIGKILL\"); } catch {} } y3burners = []; log(\"Y3-BURNER: đã tắt sau re-gate\"); }",
  "        if (gate1b.verdict === \"FAIL\" && Z3_REGATE_GATE) {",
  "          z3KilledByRegate = true;",
  "          log(`Z3-SECOND-GATE: re-gate FAIL (delta ${delta1b} < ngưỡng ${Z3_REGATE_THRESHOLD}) → PHIÊN CHẾT ở cửa kiểm tra thứ hai (slot 2-3 + resume-probe + đối chứng bị bỏ qua; slot 1 là ground truth duy nhất)`);",
  "          break;",
  "        }",
  "      }",
].join("\n");

const RESUME_PROBE_BLOCK = [
  "    // Y3 (đợt 71): resume-probe — điều tra vì sao resume-từ-pause làm draw đóng băng",
  "    // trong khi presented vẫn chạy (nợ X2 §4). Phát 6 s như gate → pause 1,5 s (mẫu dày,",
  "    // bắt justPaused seek) → resume 10 s (mẫu dày 200 ms) → pause. Không dừng khi draw thấp.",
  "    {",
  "      await setEnhCheckbox(cdp, \"enhance-denoise-toggle\", \"denoise\", false, firstClipId);",
  "      await setEnhCheckbox(cdp, \"enhance-stabilize-toggle\", \"stabilize\", false, firstClipId);",
  "      await setEnhCheckbox(cdp, \"enhance-deinterlace-toggle\", \"deinterlace\", false, firstClipId);",
  "      await cdp.evalJs(SET_PLAYHEAD_FN(0));",
  "      await waitIdle(cdp, \"resume-probe seek 0\");",
  "      const probeSamples = [];",
  "      const probeSample = async (phase) => {",
  "        const s = await cdp.evalJs(PROBE_FN(LONG_FILE)).catch(() => null);",
  "        if (s) probeSamples.push({ phase, ...s });",
  "        return s;",
  "      };",
  "      await togglePlay(cdp);",
  "      await sleep(6000);",
  "      await togglePlay(cdp);",
  "      for (let i = 0; i < 10; i++) { await probeSample(\"pause\"); await sleep(150); }",
  "      const probeBase = await probeSample(\"resume-0\");",
  "      const probeWall0 = probeBase?.wall ?? 0;",
  "      await togglePlay(cdp);",
  "      for (let i = 0; i < 50; i++) { await probeSample(\"resume\"); await sleep(200); }",
  "      await togglePlay(cdp);",
  "      await sleep(400);",
  "      const probeEnd = await probeSample(\"after\");",
  "      const probeWall1 = probeEnd?.wall ?? probeWall0;",
  "      const rafProbe = await cdp.evalJs(RAF_STATS_TIME_FN(probeWall0, probeWall1));",
  "      const rs = probeSamples.filter((s) => s.phase === \"resume\");",
  "      const d0 = rs[0], d1 = rs[rs.length - 1];",
  "      const wallSecs = d0 && d1 ? (d1.wall - d0.wall) / 1000 : null;",
  "      const rate = (a, b) => (a != null && b != null && wallSecs ? +((b - a) / wallSecs).toFixed(2) : null);",
  "      const rsHist = {}; let seekingN = 0; let pausedN = 0;",
  "      for (const s of rs) { const k = s.el?.rs ?? \"null\"; rsHist[k] = (rsHist[k] || 0) + 1; if (s.el?.seeking) seekingN++; if (s.el?.paused) pausedN++; }",
  "      resumeProbe = { samples: probeSamples, wallSecs: wallSecs != null ? +wallSecs.toFixed(2) : null,",
  "        nResume: rs.length,",
  "        drawRateFps: d0 && d1 ? rate(d0.draw, d1.draw) : null,",
  "        holdRateFps: d0 && d1 ? rate(d0.holdN, d1.holdN) : null,",
  "        skipRateFps: d0 && d1 ? rate(d0.skip, d1.skip) : null,",
  "        presentedRateFps: d0?.el?.q && d1?.el?.q && wallSecs ? +((d1.el.q.total - d0.el.q.total) / wallSecs).toFixed(2) : null,",
  "        ticksRateFps: d0 && d1 ? rate(d0.ticks, d1.ticks) : null,",
  "        rsHist, seekingFrac: rs.length ? +(seekingN / rs.length).toFixed(2) : null,",
  "        pausedFrac: rs.length ? +(pausedN / rs.length).toFixed(2) : null,",
  "        rafStats: rafProbe, ct0: d0?.el?.ct ?? null, ct1: d1?.el?.ct ?? null,",
  "        syncReseeks0: d0?.syncReseeks ?? null, syncReseeks1: d1?.syncReseeks ?? null,",
  "        syncReseeksVideo0: d0?.syncReseeksVideo ?? null, syncReseeksVideo1: d1?.syncReseeksVideo ?? null,",
  "        pauseRetryExhausted: d1?.pauseRetryExhausted ?? null, seekFailureExhausted: d1?.seekFailureExhausted ?? null,",
  "        seekElementRecreated0: d0?.seekElementRecreated ?? null, seekElementRecreated1: d1?.seekElementRecreated ?? null,",
  "        decoderErrorRecoveredPlaying0: d0?.decoderErrorRecoveredPlaying ?? null,",
  "        decoderErrorRecoveredPlaying1: d1?.decoderErrorRecoveredPlaying ?? null,",
  "        sleepingAny: probeSamples.some((s) => s.sleeping), tickErrors1: d1?.tickErrors ?? null };",
  "      log(`RESUME-PROBE (Y3): draw ${resumeProbe.drawRateFps} fps, hold ${resumeProbe.holdRateFps} fps, skip ${resumeProbe.skipRateFps} fps, presented ${resumeProbe.presentedRateFps} fps, ticks ${resumeProbe.ticksRateFps}/s, rs ${JSON.stringify(rsHist)}, seeking ${seekingN}/${rs.length}, paused ${pausedN}/${rs.length}, ct ${resumeProbe.ct0} → ${resumeProbe.ct1}, syncReseeks ${resumeProbe.syncReseeks0} → ${resumeProbe.syncReseeks1} (video ${resumeProbe.syncReseeksVideo0} → ${resumeProbe.syncReseeksVideo1}), sleepingAny=${resumeProbe.sleepingAny}, pauseRetryExh=${resumeProbe.pauseRetryExhausted}, seekFailExh=${resumeProbe.seekFailureExhausted}`);",
  "      // Y3b: probe B — pause NGẮN (~1 s, như X2: resume ngay khi pause-seek vừa xong/chưa xong hẳn),",
  "      // để thử tái hiện đóng băng draw của X2 S4. Probe A ở trên pause dài (~2,5 s, seek đã settle + ngủ).",
  "      await cdp.evalJs(SET_PLAYHEAD_FN(0));",
  "      await waitIdle(cdp, \"resume-probe-B seek 0\");",
  "      const probeSamplesB = [];",
  "      const probeSampleB = async (phase) => {",
  "        const s = await cdp.evalJs(PROBE_FN(LONG_FILE)).catch(() => null);",
  "        if (s) probeSamplesB.push({ phase, ...s });",
  "        return s;",
  "      };",
  "      await togglePlay(cdp);",
  "      await sleep(6000);",
  "      await togglePlay(cdp);",
  "      await sleep(400);",
  "      const shortPauseSample = await probeSampleB(\"shortpause\");",
  "      await togglePlay(cdp);",
  "      for (let i = 0; i < 50; i++) { await probeSampleB(\"resume\"); await sleep(200); }",
  "      await togglePlay(cdp);",
  "      await sleep(400);",
  "      const probeEndB = await probeSampleB(\"after\");",
  "      const rsB = probeSamplesB.filter((s) => s.phase === \"resume\");",
  "      const d0B = rsB[0], d1B = rsB[rsB.length - 1];",
  "      const wallSecsB = d0B && d1B ? (d1B.wall - d0B.wall) / 1000 : null;",
  "      const rateB = (a, b) => (a != null && b != null && wallSecsB ? +((b - a) / wallSecsB).toFixed(2) : null);",
  "      const rsHistB = {}; let seekingNB = 0; let pausedNB = 0;",
  "      for (const s of rsB) { const k = s.el?.rs ?? \"null\"; rsHistB[k] = (rsHistB[k] || 0) + 1; if (s.el?.seeking) seekingNB++; if (s.el?.paused) pausedNB++; }",
  "      resumeProbeB = { samples: probeSamplesB, wallSecs: wallSecsB != null ? +wallSecsB.toFixed(2) : null,",
  "        nResume: rsB.length,",
  "        shortPause: shortPauseSample ? { seeking: shortPauseSample.el?.seeking ?? null, rs: shortPauseSample.el?.rs ?? null, pendingSeek: shortPauseSample.pendingSeek, sleeping: shortPauseSample.sleeping, lastDrawn: shortPauseSample.lastDrawn, lastRequested: shortPauseSample.lastRequested, draw: shortPauseSample.draw } : null,",
  "        drawRateFps: d0B && d1B ? rateB(d0B.draw, d1B.draw) : null,",
  "        holdRateFps: d0B && d1B ? rateB(d0B.holdN, d1B.holdN) : null,",
  "        skipRateFps: d0B && d1B ? rateB(d0B.skip, d1B.skip) : null,",
  "        presentedRateFps: d0B?.el?.q && d1B?.el?.q && wallSecsB ? +((d1B.el.q.total - d0B.el.q.total) / wallSecsB).toFixed(2) : null,",
  "        ticksRateFps: d0B && d1B ? rateB(d0B.ticks, d1B.ticks) : null,",
  "        rsHist: rsHistB, seekingFrac: rsB.length ? +(seekingNB / rsB.length).toFixed(2) : null,",
  "        pausedFrac: rsB.length ? +(pausedNB / rsB.length).toFixed(2) : null,",
  "        ct0: d0B?.el?.ct ?? null, ct1: d1B?.el?.ct ?? null,",
  "        syncReseeks0: d0B?.syncReseeks ?? null, syncReseeks1: d1B?.syncReseeks ?? null,",
  "        syncReseeksVideo0: d0B?.syncReseeksVideo ?? null, syncReseeksVideo1: d1B?.syncReseeksVideo ?? null,",
  "        pauseRetryExhausted: d1B?.pauseRetryExhausted ?? null, seekFailureExhausted: d1B?.seekFailureExhausted ?? null,",
  "        sleepingAny: probeSamplesB.some((s) => s.sleeping) };",
  "      log(`RESUME-PROBE-B (Y3, pause ngắn ~1s): draw ${resumeProbeB.drawRateFps} fps, hold ${resumeProbeB.holdRateFps} fps, skip ${resumeProbeB.skipRateFps} fps, presented ${resumeProbeB.presentedRateFps} fps, ticks ${resumeProbeB.ticksRateFps}/s, rs ${JSON.stringify(rsHistB)}, seeking ${seekingNB}/${rsB.length}, paused ${pausedNB}/${rsB.length}, ct ${resumeProbeB.ct0} → ${resumeProbeB.ct1}, syncReseeksVideo ${resumeProbeB.syncReseeksVideo0} → ${resumeProbeB.syncReseeksVideo1}, shortPause=${JSON.stringify(resumeProbeB.shortPause)}`);",
  "    }",
].join("\n");

const Y3_VERDICT_BLOCK = [
  "    {",
  "      const fnSlots = slots.filter((s) => s.valid && s.drawFps != null && s.drawFps < 2);",
  "      const fn = gate1a && gate1a.verdict === \"PASS\" && fnSlots.length > 0;",
  "      const caught = fn && gate1b && gate1b.verdict === \"FAIL\";",
  "      const fpRegate = !fn && gate1b && gate1b.verdict === \"FAIL\";",
  "      const rp = resumeProbe;",
  "      log(`Y3-VERDICT: gate1a ${gate1a?.verdict} (delta ${gate1a?.delta}) | slot<2fps: ${fnSlots.map((s) => `rep${s.rep}:${s.drawFps}`).join(\", \") || \"không có\"} | FN(gate1a PASS + slot<2) = ${fn} | re-gate ${gate1b?.verdict} (delta ${gate1b?.delta}) | FN bị bắt = ${caught} | re-gate FP = ${fpRegate}`);",
  "      log(`Y3-RESUME: draw ${rp?.drawRateFps} fps vs presented ${rp?.presentedRateFps} fps, ticks ${rp?.ticksRateFps}/s, rs ${JSON.stringify(rp?.rsHist)}, seekingFrac=${rp?.seekingFrac}, pausedFrac=${rp?.pausedFrac}`);",
  "      const rpb = resumeProbeB;",
  "      log(`Y3-RESUME-B: draw ${rpb?.drawRateFps} fps vs presented ${rpb?.presentedRateFps} fps, ticks ${rpb?.ticksRateFps}/s, rs ${JSON.stringify(rpb?.rsHist)}, seekingFrac=${rpb?.seekingFrac}, shortPause=${JSON.stringify(rpb?.shortPause)}`);",
  "    }",
].join("\n");

const REPS = [
  // 1. Header.
  [" * measure-65r8-presented-fps.mjs — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8):",
   " * measure-72z3-gate-fn2.mjs — Phase 9 đợt 72, luồng Z3: BẢN VARIANT re-gate-làm-cửa-thứ-hai của measure-65r8-presented-fps.mjs (kế thừa Y3). Gate 1a (6 s, delta ≥ 20) + logic đo slot GIỮ NGUYÊN 100%; chỉ thêm: (a) re-gate sau slot 1 thành CỬA KIỂM TRA THỨ HAI — phiên chết nếu re-gate FAIL và cửa BẬT (Z3_REGATE_GATE, mặc định BẬT; tắt bằng =0), ngưỡng qua Z3_REGATE_THRESHOLD (mặc định 30, hiệu chuẩn đợt 72), (b) resume-probe lấy mẫu dày sau slot, (c) burner-control tùy chọn qua Y3_BURNER=1 (kế thừa Y3). Phần chuẩn bị môi trường kế thừa V4/X2. Gốc (đợt 65 S8):"],
  // 2. Đổi thư mục config vite sang /tmp/round72-z3.
  ['const VITE_CFG_DIR = "/tmp/round65-r8";', 'const VITE_CFG_DIR = "/tmp/round72-z3";'],
  ['const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8-presented.config.mjs");', 'const VITE_CFG = path.join(VITE_CFG_DIR, "vite.z3-presented.config.cjs"); // Z3: .cjs để vite dùng nhánh CJS (biên dịch trong bộ nhớ, KHÔNG ghi temp file — nhánh ESM ghi .vite-temp và dính EPERM, xem LIMITS V4 §5).'],
  ['const TMPDIR = "/tmp/round65-r8/tmp";', 'const TMPDIR = "/tmp/round72-z3/tmp";'],
  // 3. Hardcode cổng (đã kiểm tra trống bằng ss trước khi chạy), bỏ pickFreePort.
  ["const DEV_PORT = Number(process.env.R8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));",
   "const DEV_PORT = Number(process.env.Z3_DEV_PORT || 0) || 5572;"],
  ["const DEBUG_PORT = Number(process.env.R8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));",
   "const DEBUG_PORT = Number(process.env.Z3_DEBUG_PORT || 0) || 9672;"],
  // 4. Chèn helpers + hằng Z3 sau dòng const logLines.
  ["const logLines = [];", "const logLines = [];\n" + HELPERS + "\n" + Z3_CONSTANTS],
  // 5. pickDisplay: bỏ execSync, kiểm tra liveness bằng connect socket Unix.
  ['      const { execSync } = await import("node:child_process");',
   "      // Y3 (kế thừa V4/X2): bỏ execSync (spawn con làm độc ghi file) — kiểm tra liveness bằng connect socket Unix."],
  ['          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }',
   '          try { alive = await new Promise((res) => { const s = net.createConnection(sock); s.once("connect", () => { s.end(); res(true); }); s.once("error", () => res(false)); setTimeout(() => { try { s.destroy(); } catch {} res(false); }, 2000); }); } catch { alive = false; }'],
  // 6. Ghi config vite qua helper (bỏ qua khi đã có sẵn đúng nội dung).
  ["    fs.writeFileSync(VITE_CFG, ", "    writeConfigBestEffort(VITE_CFG, "],
  // 7. Mở chromeLogFd cùng lúc với viteLogFd (trước mọi spawn).
  ['    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");',
   "    // Y3 (kế thừa V4/X2): chromeLogFd đã mở cùng viteLogFd ở trên (trước mọi spawn)."],
  ['    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");',
   '    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");\n    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");'],
  // 8. Ghi JSON/log cuối best-effort (không ném nếu EPERM — số đo vẫn có trong log console).
  ['    fs.writeFileSync(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));',
   '    writeBestEffort(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));'],
  ['    fs.writeFileSync(path.join(SCRATCH, "presented-fps.log"), logLines.join("\\n") + "\\n");',
   '    writeBestEffort(path.join(SCRATCH, "presented-fps.log"), logLines.join("\\n") + "\\n");'],
  // 9. Y3: khai báo biến giữ kết quả re-gate + resume-probe + burner (dùng ở report JSON).
  ['    // ---- GATE warmup (như R64): element clip dài THẬT SỰ phát được ----',
   '    let gate1a = null; let gate1b = null; let resumeProbe = null; let resumeProbeB = null; let y3burners = [];\n    // ---- GATE warmup (như R64): element clip dài THẬT SỰ phát được ----'],
  // 10. Y3: ghi số gate 1a + bật burner-control (nếu Y3_BURNER=1) sau khi gate 1a PASS.
  ['      log("GATE warmup OK: element clip dài phát được, vào vòng đo presented");',
   `      log("GATE warmup OK: element clip dài phát được, vào vòng đo presented");
      gate1a = { delta: drawDelta, draw0, drawAfter, rateFps: +(drawDelta / 6).toFixed(2),
        ct: elGate?.el?.ct ?? null, elRs: elGate?.el?.rs ?? null,
        qTotal: elGate?.el?.q?.total ?? null, verdict: "PASS", load: loadAvg() };
      if (process.env.Y3_BURNER === "1") {
        const { spawn: spawnBurner } = await import("node:child_process");
        for (let i = 0; i < 2; i++) y3burners.push(spawnBurner(process.execPath, ["-e", "while(true){Math.sqrt(Math.random());}"], { stdio: "ignore" }));
        log(\`Y3-BURNER: đã bật 2 vòng busy-loop (đốt CPU sau gate 1a, tắt sau re-gate); load \${loadAvg()}\`);
      }`],
  // 11. Y3: chèn khối re-gate vào đầu vòng slot (trước rep 2).
  ["    for (let rep = 1; rep <= REPEATS; rep++) {\n      const mark = `r8-rep${rep}`;",
   "    for (let rep = 1; rep <= REPEATS; rep++) {\n" + GATE1B_BLOCK + "\n      const mark = `r8-rep${rep}`;"],
  // 12. Y3: định nghĩa PROBE_FN trước khối MARK_EL_FN.
  ["// Đánh dấu element pool hiện tại (gọi ở đầu slot, trước khi phát).",
   PROBE_FN_DEF + "\n\n// Đánh dấu element pool hiện tại (gọi ở đầu slot, trước khi phát)."],
  // 13. Z3: resume-probe + verdict, chèn trước đối chứng tab trắng (sau vòng slot).
  // Bỏ qua cả hai khi phiên đã chết ở re-gate (cửa kiểm tra thứ hai).
  ['    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------',
   "    if (!z3KilledByRegate) {\n" + RESUME_PROBE_BLOCK + "\n" + Y3_VERDICT_BLOCK + "\n    } // Z3: bỏ qua resume-probe + verdict khi phiên chết ở re-gate\n    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------"],
  // 14. Z3: ghi gate1a + gate1b + resumeProbe + cờ cửa thứ hai vào report JSON.
  ["      clip: LONG_FILE, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,",
   "      clip: LONG_FILE, gate1a, gate1b, resumeProbe, resumeProbeB, z3: { regateGate: Z3_REGATE_GATE, regateThreshold: Z3_REGATE_THRESHOLD, killedByRegate: z3KilledByRegate }, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,"],
  // 15. Z3: bọc đối chứng tab trắng trong if (!z3KilledByRegate) — mở khối.
  // blankTarget/bcdp/ctrl khai báo NGOÀI khối if (let): dòng drainErrors(bcdp)
  // và report controlBlankTab ở sau khối vẫn tham chiếu được — const trong khối
  // if sẽ gây ReferenceError khi khối không chạy (lỗi gặp ở S1 lần 1).
  ['    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------',
   "    let blankTarget = null, bcdp = null, ctrl = null; // Z3: khai báo ngoài khối if (xem chú thích trên)\n    if (!z3KilledByRegate) {\n    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------"],
  // 18–20. Z3: gán vào let ngoài khối thay vì const trong khối (xem #15).
  ["    const blankTarget = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: \"PUT\" })).json();",
   "    blankTarget = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: \"PUT\" })).json();"],
  ["    const bcdp = new CDP(blankTarget.webSocketDebuggerUrl);",
   "    bcdp = new CDP(blankTarget.webSocketDebuggerUrl);"],
  ["    const ctrl = await bcdp.evalJs(DECODE_FPS_FN(MEDIA_URL(LONG_FILE), 0, SAMPLE_SECS));",
   "    ctrl = await bcdp.evalJs(DECODE_FPS_FN(MEDIA_URL(LONG_FILE), 0, SAMPLE_SECS));"],
  // 16. Z3: đóng khối đối chứng + chỉ drain bcdp khi đối chứng đã chạy.
  ["    await drainErrors(cdp);\n    await drainErrors(bcdp).catch(() => {});",
   "    } // Z3: hết khối đối chứng tab trắng (bỏ qua khi phiên chết ở re-gate)\n    await drainErrors(cdp);\n    if (!z3KilledByRegate) { await drainErrors(bcdp).catch(() => {}); }"],
  // 17. Z3: controlBlankTab có điều kiện — ctrl chỉ tồn tại khi đối chứng đã chạy
  // (const trong khối if); phiên chết ghi { skipped, load } thay vì tham chiếu ctrl.
  ["      slots, aggregate: agg, controlBlankTab: { ...ctrl, load: loadAvg() },",
   "      slots, aggregate: agg, controlBlankTab: z3KilledByRegate ? { skipped: \"phiên chết ở re-gate (cửa kiểm tra thứ hai)\", load: loadAvg() } : { ...ctrl, load: loadAvg() },"],
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
// Y3 launcher: import.meta.url không dùng được qua data: URL → hardcode ROOT.
const ROOT_SEARCH = 'const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");';
if (!src.includes(ROOT_SEARCH)) { console.error("KHÔNG TÌM THẤY dòng ROOT"); process.exit(2); }
src = src.replace(ROOT_SEARCH, 'const ROOT = "/home/hatch/workspace/repo-1"; // Z3 launcher: hardcode vì import qua data: URL.');
n++;
if (src.startsWith("#!")) src = src.slice(src.indexOf("\n") + 1); // bỏ shebang (data: URL)
console.log(`LAUNCHER Z3: ${n} thay thế OK, import variant qua data: URL (${src.length} byte)`);
if (process.env.Z3_DRY_RUN === "1") {
  console.log(`LAUNCHER Z3 DRY-RUN: variant ${src.length} byte — không chạy đo`);
  const dryFile = process.env.Z3_DRY_RUN_FILE || "";
  if (dryFile) {
    try { fs.writeFileSync(dryFile, src); console.log(`LAUNCHER Z3 DRY-RUN: đã ghi variant ra ${dryFile}`); }
    catch (e) { console.log(`LAUNCHER Z3 DRY-RUN: không ghi được variant ra ${dryFile} (${e.code || e.message})`); }
  }
  process.exit(0);
}
const b64 = Buffer.from(src).toString("base64");
await import(`data:text/javascript;base64,${b64}`);

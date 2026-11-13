// measure-71y3-gate-fn-launcher.mjs — Phase 9 đợt 71, luồng Y3.
// Launcher chạy BẢN VARIANT của measure-65r8-presented-fps.mjs mà KHÔNG
// ghi file variant ra đĩa và KHÔNG sửa harness gốc. Đóng nợ đợt 70 §4 mục 3
// (gate 6 s FN 3/9 vẫn chưa bắt được; X2 đã bác A1 + gate cửa sổ 2).
//
// (a) ỨNG VIÊN MỚI — RE-GATE: đo lại gate 1 (seek-0, phát 6 s, delta ≥ 20)
//     sau slot 1 (tức là lần đo seek-0 thứ 2, cách lần 1 ~10 s sau khi gate 1a
//     kết thúc + 1 slot 10 s ở giữa). Không dừng khi re-gate FAIL — slot 2-3
//     làm ground truth. Verdict: FN = gate1a PASS + slot < 2 fps; re-gate bắt
//     được FN iff re-gate FAIL đúng phiên FN; re-gate an toàn iff PASS ở phiên
//     không FN (không FP). Nếu không phiên nào xuất hiện FN tự nhiên thì
//     "bắt được FN" vẫn CHƯA CHỨNG MINH — chỉ báo cáo phía FP.
// (b) RESUME-PROBE: sau slot, phát 6 s như gate → pause 1,5 s (lấy mẫu dày,
//     bắt justPaused seek) → resume 10 s (lấy mẫu dày 200 ms: draw/hold/skip,
//     ticks, sleeping, lastDrawn/lastRequested, pendingSeek, cap W2/X2,
//     syncReseeks, element rs/ct/paused/seeking/q.total) → pause. Phân biệt:
//     ticks đóng băng (rAF/vòng lặp) vs rs<2 kéo dài (decoder) vs seeking kẹt
//     vs element bị drop/tạo lại (mark) vs hold tăng (holdFrame giữ khung cũ).
//     Probe B (thêm sau phiên 1): pause NGẮN ~1 s như X2 (resume ngay khi
//     pause-seek vừa xong/chưa xong hẳn) — probe A pause dài ~2,5 s, seek đã
//     settle + ngủ, không tái hiện được đóng băng của X2 S4.
// (c) BURNER-CONTROL (chỉ khi Y3_BURNER=1): 2 vòng busy-loop bật sau gate 1a,
//     tắt sau re-gate — kiểm tra độ nhạy của re-gate với "máy chậm dần sau
//     gate" (mô phỏng mẫu FN: gate nhanh, sau đó chậm). Đây là control về
//     tải, KHÔNG phải bằng chứng FN tự nhiên — ghi rõ khi báo cáo.
//
// Gate 1a + logic slot + đối chứng tab trắng GIỮ NGUYÊN 100%. Phần chuẩn bị
// môi trường kế thừa V4/X2 (hardcode cổng, config vite .cjs pre-create,
// pickDisplay không dùng execSync, mở log fd trước spawn, ghi cuối
// best-effort). Cách chạy (từ repo root), mỗi phiên một R8_SCRATCH riêng:
//   R8_PRES_RES=1080 R8_PRES_REPEATS=3 \
//   R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round71-y3/session1 \
//   node apps/web/scripts/measure-71y3-gate-fn-launcher.mjs
// Yêu cầu trước khi chạy:
//   - Config vite đã có sẵn tại /tmp/round71-y3/vite.y3-presented.config.cjs
//     (pre-create bằng file-tool; nội dung = template vite config của harness
//     gốc, chuyển sang CJS).
//   - Cổng 5570 (vite) và 9670 (debug) trống (kiểm tra bằng `ss -ltn`).
//   - Đặt Y3_DEV_PORT/Y3_DEBUG_PORT nếu cần đổi cổng.
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

// Hàm lấy mẫu dày cho resume-probe: toàn bộ hook đo + trạng thái element
// trong 1 evaluate (wall khớp nhau). PROBE_FN nhận fileName như SLOT_SAMPLE_FN.
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
  "        // Y3: re-gate — đo lại gate 1 (seek-0, phát 6 s) sau slot 1: ứng viên bắt FN",
  "        // của gate 6 s (nợ X2 §4 / W8 §6). Không dừng khi FAIL — slot 2-3 làm ground truth.",
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
  "          qTotal: elGateB?.el?.q?.total ?? null, verdict: delta1b >= 20 ? \"PASS\" : \"FAIL\", load: loadAvg() };",
  "        log(`RE-GATE (Y3, sau slot 1): draw ${draw0b} → ${drawAfterB} (delta ${delta1b}, cần ≥20, ${gate1b.rateFps} fps), ct=${gate1b.ct}, rs=${gate1b.elRs} → ${gate1b.verdict}; load ${gate1b.load}`);",
  "        if (y3burners.length) { for (const b of y3burners) { try { b.kill(\"SIGKILL\"); } catch {} } y3burners = []; log(\"Y3-BURNER: đã tắt sau re-gate\"); }",
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
   " * measure-71y3-gate-fn.mjs — Phase 9 đợt 71, luồng Y3: BẢN VARIANT THỬ NGHIỆM re-gate + resume-probe của measure-65r8-presented-fps.mjs. Gate 1a (6 s, delta ≥ 20) + logic đo slot GIỮ NGUYÊN 100%; chỉ thêm: (a) re-gate sau slot 1 (seek-0, 6 s, FAIL không dừng), (b) resume-probe lấy mẫu dày sau slot, (c) burner-control tùy chọn qua Y3_BURNER=1. Phần chuẩn bị môi trường kế thừa V4/X2. Gốc (đợt 65 S8):"],
  // 2. Đổi thư mục config vite sang /tmp/round71-y3.
  ['const VITE_CFG_DIR = "/tmp/round65-r8";', 'const VITE_CFG_DIR = "/tmp/round71-y3";'],
  ['const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8-presented.config.mjs");', 'const VITE_CFG = path.join(VITE_CFG_DIR, "vite.y3-presented.config.cjs"); // Y3: .cjs để vite dùng nhánh CJS (biên dịch trong bộ nhớ, KHÔNG ghi temp file — nhánh ESM ghi .vite-temp và dính EPERM, xem LIMITS V4 §5).'],
  ['const TMPDIR = "/tmp/round65-r8/tmp";', 'const TMPDIR = "/tmp/round71-y3/tmp";'],
  // 3. Hardcode cổng (đã kiểm tra trống bằng ss trước khi chạy), bỏ pickFreePort.
  ["const DEV_PORT = Number(process.env.R8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));",
   "const DEV_PORT = Number(process.env.Y3_DEV_PORT || 0) || 5570;"],
  ["const DEBUG_PORT = Number(process.env.R8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));",
   "const DEBUG_PORT = Number(process.env.Y3_DEBUG_PORT || 0) || 9670;"],
  // 4. Chèn helpers sau dòng const logLines.
  ["const logLines = [];", "const logLines = [];\n" + HELPERS],
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
  // 13. Y3: resume-probe + verdict, chèn trước đối chứng tab trắng (sau vòng slot).
  ['    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------',
   RESUME_PROBE_BLOCK + "\n" + Y3_VERDICT_BLOCK + "\n    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------"],
  // 14. Y3: ghi gate1a + gate1b + resumeProbe vào report JSON.
  ["      clip: LONG_FILE, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,",
   "      clip: LONG_FILE, gate1a, gate1b, resumeProbe, resumeProbeB, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,"],
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
src = src.replace(ROOT_SEARCH, 'const ROOT = "/home/hatch/workspace/repo-1"; // Y3 launcher: hardcode vì import qua data: URL.');
n++;
if (src.startsWith("#!")) src = src.slice(src.indexOf("\n") + 1); // bỏ shebang (data: URL)
console.log(`LAUNCHER Y3: ${n} thay thế OK, import variant qua data: URL (${src.length} byte)`);
const b64 = Buffer.from(src).toString("base64");
await import(`data:text/javascript;base64,${b64}`);

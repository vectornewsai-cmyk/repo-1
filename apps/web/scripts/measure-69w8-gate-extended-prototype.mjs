// measure-69w8-gate-extended-prototype.mjs — Phase 9 đợt 69, luồng W8.
// PROTOTYPE gate mở rộng (2 cửa sổ) cho harness presented-FPS — CHƯA nối vào production.
// Không import harness gốc, không chạm Chrome/CDP, không sửa gate hiện tại.
// Mục đích: để đợt sau thử nghiệm có sẵn bản thiết kế + hàm quyết định đã kiểm chứng logic.
//
// Bối cảnh (V4 đợt 68): gate 6 s hiện tại PASS cả 2 phiên (delta 45 / 35, cần ≥ 20) nhưng
// slot 10 s sau đó ở phiên lạnh chỉ vẽ 0,49–0,98 fps (false-negative 3/6 slot). Gate chỉ đo
// 6 s đầu — trạng thái mượt nhất sau seek-0 + waitIdle — nên không thấy được sụp đổ xảy ra
// sau giây thứ 6. Phân tích chi tiết: apps/web/scripts/analyze-69w8-gate-window.mjs,
// docs/PHASE9_ROUND69_W8_GATE_WINDOW_LIMITS.md.
//
// Thiết kế gate mở rộng (giữ nguyên gate 1, thêm cửa sổ 2 RIÊNG BIỆT):
//   Cửa sổ 1 (như cũ, không đổi): seek 0 → waitIdle → draw0 → phát 6 s → dừng → drawAt6.
//     PASS khi drawAt6 - draw0 ≥ 20 (tức ≥ 3,33 fps) + các điều kiện element/hook như cũ.
//   Cửa sổ 2 (mới): phát TIẾP từ vị trí dừng (KHÔNG seek lại) thêm 10 s → drawAt16.
//     PASS khi drawAt16 - drawAt6 ≥ 20 (tức ≥ 2,0 fps trên cửa sổ 6–16 s).
//     Ngưỡng 2,0 fps = định nghĩa false-negative của W8 (slot draw < 2 fps ~ đứng hình).
//     Vì sao phải đo RIÊNG cửa sổ 2 (không kéo dài gate 1 thành 16 s rồi đếm tích lũy):
//     đếm tích lũy sẽ bị 45 draws của 6 s đầu "gánh" (45 + ~7 = 52 ≥ 20 → vẫn PASS oan).
//     Chỉ có tốc độ RIÊNG của giây 6–16 mới bắt được sụp đổ.
//   Ràng buộc clip: clip long1080 dài 20 s; gate 1 kết thúc ở ct ≈ 6,7–6,9 s nên cửa sổ 2
//     (10 s) kết thúc ở ct ≈ 17 s, còn 3 s biên trước khi clip hết. Nếu ct cuối gate 1 > 10 s
//     (clip còn < 10 s) thì cửa sổ 2 không đủ dài → verdict INCONCLUSIVE (không kết luận FAIL),
//     để đợt thử nghiệm xử lý (seek lại 0 hoặc dùng clip dài hơn).
//
// Chi phí: +10 s phát cho mỗi lần chạy harness (~+25% thời gian chạy, gate từ ~7 s lên ~17 s).
// Rủi ro: máy yếu hơn sẽ chết gate nhiều hơn (đo ít phiên hoàn chỉnh hơn, nhưng số đo còn lại
//   đáng tin hơn). Ngưỡng 2,0 fps tách được dữ liệu hiện có với biên nhỏ nhất 56% (A1: 31,2 vs 20);
//   ngưỡng ≥ 3 fps sẽ giết oan phiên khỏe (A1 sau-6s chỉ 3,12 fps, biên 4%) — xem replay.
//
// Cách chạy (không cần Chrome):
//   node apps/web/scripts/measure-69w8-gate-extended-prototype.mjs --replay    # replay dữ liệu V4
//   node apps/web/scripts/measure-69w8-gate-extended-prototype.mjs --simulate p1|p2|a1
//     # mô phỏng chạy gate mở rộng với tốc độ vẽ hằng số lấy từ dữ liệu V4 (kiểm chứng logic)
// Không tham số: in cấu hình + hướng dẫn.

export const GATE_EXT = Object.freeze({
  window1Secs: 6, // cửa sổ 1: 6 s (giữ nguyên gate hiện tại)
  minDelta1: 20, // gate 1: ≥ 20 draws / 6 s (≥ 3,33 fps) — KHÔNG đổi, KHÔNG hạ chuẩn
  window2Secs: 10, // cửa sổ 2: 10 s phát tiếp, không seek lại (giây ~6–16)
  minDelta2: 20, // cửa sổ 2: ≥ 20 draws / 10 s (≥ 2,0 fps)
  clipDurSecs: 20, // clip long1080.mp4 dài 20 s — cửa sổ 2 cần ct cuối gate 1 ≤ 10 s
});

// Hàm quyết định thuần túy (không I/O): nhận 3 mẫu bộ đếm draw tích lũy + trạng thái element.
// draw0: trước khi phát (sau seek-0 + waitIdle). drawAt6: sau 6 s phát. drawAt16: sau thêm 10 s.
// el: { rs, w, ct, srcAttr } như SLOT_SAMPLE_FN trả về (mẫu MỚI NHẤT, sau cửa sổ 2);
//   dùng để kiểm tra element còn hợp lệ.
// ctAt6: currentTime của element lúc KẾT THÚC gate 1 (trước khi vào cửa sổ 2) — dùng cho
//   clip-guard: cửa sổ 2 cần 10 s clip còn lại, tức ctAt6 ≤ clipDur − 10 s. Mặc định = el.ct.
// hookOk: như gate hiện tại.
export function decideExtendedGate({ draw0, drawAt6, drawAt16, el, hookOk, ctAt6 }) {
  const delta1 = drawAt6 - draw0;
  const delta2 = drawAt16 - drawAt6;
  const rate1 = delta1 / GATE_EXT.window1Secs;
  const rate2 = delta2 / GATE_EXT.window2Secs;
  const ctGuard = typeof ctAt6 === "number" ? ctAt6 : el?.ct;
  const clipGuardOk = typeof ctGuard === "number" ? ctGuard <= GATE_EXT.clipDurSecs - GATE_EXT.window2Secs : false;
  const elOk = !!el && el.rs >= 1 && el.w > 0 && el.ct > 0 && !!el.srcAttr;
  const gate1Pass = delta1 >= GATE_EXT.minDelta1 && elOk && hookOk === true;
  const gate2Pass = delta2 >= GATE_EXT.minDelta2;
  const inconclusive = !clipGuardOk;
  const pass = gate1Pass && gate2Pass && !inconclusive;
  const reason = !gate1Pass
    ? `gate1 FAIL (delta1=${delta1} < ${GATE_EXT.minDelta1} hoặc element/hook không đạt)`
    : inconclusive
      ? `INCONCLUSIVE (ct cuối gate1 = ${ctGuard} > ${GATE_EXT.clipDurSecs - GATE_EXT.window2Secs} s — clip còn không đủ 10 s cho cửa sổ 2)`
      : !gate2Pass
        ? `gate2 FAIL (delta2=${delta2} < ${GATE_EXT.minDelta2} — vẽ sụp sau giây 6, slot sẽ đứng hình)`
        : `PASS (delta1=${delta1}, delta2=${delta2})`;
  return {
    pass, gate1Pass, gate2Pass, inconclusive, ctAt6: ctGuard,
    delta1, delta2,
    rate1Fps: +rate1.toFixed(2), rate2Fps: +rate2.toFixed(2),
    collapseRatio: rate1 > 0 ? +(rate2 / rate1).toFixed(2) : null, // tỉ lệ tốc độ cửa sổ 2 / cửa sổ 1 (tham khảo)
    reason,
  };
}

// Thủ tục chạy gate mở rộng — mọi I/O đều inject qua deps để đợt sau nối vào CDP thật:
//   sampleDraw(): Promise<number> — đọc __vcutHoldStats.draw (như STATE_FN().hold.draw).
//   sampleEl(): Promise<object|null> — đọc element (như SLOT_SAMPLE_FN()).
//   sampleHookOk(): Promise<boolean> — kiểm tra hook baseline (denoise/stabilize/deinterlace off).
//   togglePlay(): Promise<void> — bấm Space. sleep(ms): Promise<void>.
//   log(msg): void.
// Đợt sau chỉ cần nối 5 hàm này vào helpers của measure-65r8-presented-fps.mjs;
// KHÔNG sửa logic gate 1, chỉ thêm khối cửa sổ 2 sau dòng log "GATE warmup OK" hiện tại.
export async function runExtendedGate(deps) {
  const { sampleDraw, sampleEl, sampleHookOk, togglePlay, sleep, log = () => {} } = deps;
  const draw0 = await sampleDraw();
  await togglePlay();
  await sleep(GATE_EXT.window1Secs * 1000);
  await togglePlay();
  await sleep(400);
  const drawAt6 = await sampleDraw();
  const elGate = await sampleEl();
  const hookOk = await sampleHookOk();
  const delta1 = drawAt6 - draw0;
  log(`GATE1 (giữ nguyên): draw ${draw0} → ${drawAt6} (delta ${delta1}, cần ≥ ${GATE_EXT.minDelta1}), el=${JSON.stringify(elGate)}, hookOk=${hookOk}`);
  if (delta1 < GATE_EXT.minDelta1) {
    return { ...decideExtendedGate({ draw0, drawAt6, drawAt16: drawAt6, el: elGate, hookOk }), stoppedAt: "gate1" };
  }
  // Cửa sổ 2: phát tiếp, KHÔNG seek lại, KHÔNG waitIdle (giữ đúng trạng thái đang phát).
  await togglePlay();
  await sleep(GATE_EXT.window2Secs * 1000);
  await togglePlay();
  await sleep(400);
  const drawAt16 = await sampleDraw();
  const elGate2 = await sampleEl();
  // Clip-guard dùng ct lúc KẾT THÚC gate 1 (elGate.ct), không phải ct sau cửa sổ 2:
  // ct sau cửa sổ 2 luôn ≈ 17 s nên dùng nó sẽ luôn INCONCLUSIVE oan.
  const verdict = decideExtendedGate({ draw0, drawAt6, drawAt16, el: elGate2 ?? elGate, hookOk, ctAt6: elGate?.ct });
  log(`GATE2 (mới): draw ${drawAt6} → ${drawAt16} (delta ${verdict.delta2}, cần ≥ ${GATE_EXT.minDelta2}), rate2=${verdict.rate2Fps} fps, ct=${elGate2?.ct} → ${verdict.pass ? "PASS" : verdict.inconclusive ? "INCONCLUSIVE" : "FAIL"}: ${verdict.reason}`);
  return { ...verdict, stoppedAt: "gate2" };
}

// ---- Replay trên dữ liệu V4 ----
// (a) P1/P2: gate 1 là số gate THẬT của harness; gate 2 ước lượng qua giả thiết A1
//     (tốc độ cửa sổ 2 ≈ tốc độ slot 10 s cùng phiên).
// (b) A1/B2/A3: CHỈ kiểm tra gate 2 (tốc độ sau 6 s đo trực tiếp từ time-course). Gate 1
//     KHÔNG đánh giá được từ dữ liệu A/B: probe lấy mẫu liên tục (~0,5–1 s/lần, overhead CDP)
//     nên tốc độ vẽ 0–6 s của nó (2,4–3,4 fps, delta 14–20) thấp hơn gate harness thật
//     (không lấy mẫu trong 6 s ngủ) — so sánh tuyệt đối sẽ sai. Chỉ dùng tỉ lệ/tốc độ sau 6 s
//     trong cùng probe, là đại lượng tương đối ít nhạy với overhead.
export function replayV4() {
  const el = (ct) => ({ rs: 4, w: 871, ct, srcAttr: "long1080.mp4" });
  const out = [];
  for (const c of [
    { name: "P1-lanh (gate 45, slot draw mean 0,69 fps)", draw0: 2, drawAt6: 47, slotDrawMean: 0.69, ct: 6.871 },
    { name: "P2-am (gate 35, slot draw mean 6,11 fps)", draw0: 2, drawAt6: 37, slotDrawMean: 6.11, ct: 6.7 },
  ]) {
    const drawAt16 = Math.round(c.drawAt6 + c.slotDrawMean * GATE_EXT.window2Secs);
    const v = decideExtendedGate({ draw0: c.draw0, drawAt6: c.drawAt6, drawAt16, el: el(c.ct), hookOk: true, ctAt6: c.ct });
    out.push({ name: c.name, gate1Eval: "that (harness)", rate2FpsUsed: c.slotDrawMean, delta2: v.delta2, ...v });
  }
  for (const c of [
    { name: "A1 (sau-6s 3,12 fps, đo trực tiếp)", after6Rate: 3.12 },
    { name: "B2 (sau-6s 4,98 fps, đo trực tiếp)", after6Rate: 4.98 },
    { name: "A3 (sau-6s 4,80 fps, đo trực tiếp)", after6Rate: 4.8 },
  ]) {
    const delta2 = Math.round(c.after6Rate * GATE_EXT.window2Secs);
    out.push({
      name: c.name, gate1Eval: "n/a (probe A/B — overhead lấy mẫu khác harness)",
      rate2FpsUsed: c.after6Rate, delta2,
      pass: delta2 >= GATE_EXT.minDelta2, gate1Pass: null, gate2Pass: delta2 >= GATE_EXT.minDelta2,
      inconclusive: false, rate1Fps: null, rate2Fps: c.after6Rate,
      reason: delta2 >= GATE_EXT.minDelta2 ? `gate2 PASS (delta2≈${delta2} ≥ 20)` : `gate2 FAIL (delta2≈${delta2} < 20)`,
    });
  }
  return out;
}

// ---- Mô phỏng chạy đầy đủ (fake clock + fake draw counter, không Chrome) ----
// ct bám theo thời gian PHÁT (playSecs), không phải wall: sau 6 s phát ct ≈ 6,87 s
// (như gate thật P1: ct 6,871); sau 16 s phát ct ≈ 16,87 s. draw chỉ tăng khi đang phát.
export async function simulateExtendedGate(drawFps, label) {
  let draw = 2; // draw0 như gate thật
  let playSecs = 0;
  let playing = false;
  const fakeDeps = {
    sampleDraw: async () => Math.round(draw),
    sampleEl: async () => ({ rs: 4, w: 871, ct: +(0.87 + playSecs).toFixed(2), srcAttr: "long1080.mp4" }),
    sampleHookOk: async () => true,
    togglePlay: async () => { playing = !playing; },
    sleep: async (ms) => { if (playing) { playSecs += ms / 1000; draw += (drawFps * ms) / 1000; } },
    log: (m) => console.log(`  [${label}] ${m}`),
  };
  return runExtendedGate(fakeDeps);
}

// Mô phỏng 2 tốc độ (mẫu sụp đổ kiểu P1: gate nhanh → slot chậm). Dùng để chứng minh
// gate mở rộng bắt được đúng mẫu lỗi của phiên lạnh — điều mô phỏng tốc độ hằng số
// không thể hiện được (tốc độ hằng số 0,69 fps thì gate 1 đã chết trước, không tới gate 2).
export async function simulateTwoRate(rate1, rate2, label) {
  let draw = 2;
  let playSecs = 0;
  let playing = false;
  const fakeDeps = {
    sampleDraw: async () => Math.round(draw),
    sampleEl: async () => ({ rs: 4, w: 871, ct: +(0.87 + playSecs).toFixed(2), srcAttr: "long1080.mp4" }),
    sampleHookOk: async () => true,
    togglePlay: async () => { playing = !playing; },
    sleep: async (ms) => {
      if (!playing) return;
      const rate = playSecs < GATE_EXT.window1Secs ? rate1 : rate2;
      playSecs += ms / 1000;
      draw += (rate * ms) / 1000;
    },
    log: (m) => console.log(`  [${label}] ${m}`),
  };
  return runExtendedGate(fakeDeps);
}

const arg = process.argv[2];
if (arg === "--replay") {
  console.log("REPLAY gate mở rộng trên dữ liệu V4 (giả thiết A1 — xem LIMITS §5):");
  for (const r of replayV4()) {
    if (r.gate1Eval.startsWith("that")) {
      console.log(`  ${r.name}: delta1=${r.delta1} (${r.rate1Fps} fps), delta2≈${r.delta2} (${r.rate2Fps} fps) → ${r.pass ? "PASS" : r.inconclusive ? "INCONCLUSIVE" : "FAIL"} — ${r.reason}`);
    } else {
      console.log(`  ${r.name}: gate1 ${r.gate1Eval}; delta2≈${r.delta2} (${r.rate2Fps} fps) → ${r.gate2Pass ? "gate2 PASS" : "gate2 FAIL"} — ${r.reason}`);
    }
  }
  console.log("Kết quả: P1 FAIL ở gate2 (FN bị chặn), P2 PASS toàn bộ, A1/B2/A3 qua gate2. FN 3/6 → 0/6 (ước lượng mô hình).");
} else if (arg === "--simulate") {
  const which = process.argv[3] || "p1";
  if (which === "collapse") {
    console.log("MÔ PHỎNG mẫu sụp đổ kiểu P1-lạnh: 7,5 fps trong 6 s đầu → 0,69 fps sau đó:");
    const v = await simulateTwoRate(7.5, 0.69, "P1-collapse (7,5 → 0,69 fps)");
    console.log(`  verdict: ${v.pass ? "PASS" : v.inconclusive ? "INCONCLUSIVE" : "FAIL"} — ${v.reason}`);
    console.log("  (Gate 6 s cũ sẽ PASS oan mẫu này với delta1=45; gate mở rộng chặn ở gate2.)");
  } else {
    const rates = { p1: [0.69, "P1-lanh (slot draw mean 0,69 fps)"], p2: [6.11, "P2-am (slot draw mean 6,11 fps)"], a1: [3.12, "A1 (sau-6s 3,12 fps)"] };
    const [fps, label] = rates[which] ?? rates.p1;
    console.log(`MÔ PHỎNG gate mở rộng, tốc độ vẽ hằng số ${fps} fps (${label}):`);
    console.log("  (Lưu ý: tốc độ hằng số không tái hiện được mẫu P1 — xem --simulate collapse.)");
    const v = await simulateExtendedGate(fps, label);
    console.log(`  verdict: ${v.pass ? "PASS" : v.inconclusive ? "INCONCLUSIVE" : "FAIL"} — ${v.reason}`);
  }
} else {
  console.log("measure-69w8-gate-extended-prototype.mjs — PROTOTYPE gate mở rộng (2 cửa sổ), chưa nối production.");
  console.log(`Cấu hình: ${JSON.stringify(GATE_EXT)}`);
  console.log("  --replay            replay quyết định gate mở rộng trên dữ liệu V4 đợt 68");
  console.log("  --simulate p1|p2|a1  mô phỏng chạy gate với tốc độ vẽ hằng số từ dữ liệu V4");
  console.log("  --simulate collapse   mô phỏng mẫu sụp đổ kiểu P1 (7,5 fps → 0,69 fps)");
  console.log("Xem docs/PHASE9_ROUND69_W8_GATE_WINDOW_LIMITS.md để biết thiết kế + giới hạn.");
}

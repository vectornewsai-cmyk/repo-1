#!/usr/bin/env node
/**
 * test-p7-queue-persist.cjs — Test Phase 7 P7: bridge queue bền vững (job.json).
 *
 * Không cần bridge thật, không cần ffmpeg: dùng RenderJobService với
 * spawnJob giả (EventEmitter). Kiểm tra:
 *  [1] enqueue ghi job.json (status queued, giữ id/preset/totalDuration).
 *  [2] _start ghi job.json (status running).
 *  [3] Giả lập restart (service mới + recover cùng workRoot):
 *      - queued  → xếp hàng lại, giữ nguyên id, recovered=true.
 *      - running → "interrupted" (terminal, retry được), output dở dang bị xóa,
 *        KHÔNG tự render lại (spawn không được gọi cho job này).
 *      - done    → khôi phục nguyên trạng, không render lại (attempts giữ nguyên).
 *      - error   → khôi phục nguyên trạng, retry được.
 *      - dir không có job.json/spec.json → bỏ qua.
 *      - dir legacy (spec + output + media đã prune) → khôi phục "done".
 *      - dir legacy (spec + media, không output) → xếp hàng lại (hành vi cũ).
 *  [4] retry từ "interrupted" được phép; retry từ "done" → BAD_STATE.
 *  [5] recover() vẫn trả về số (tương thích test cũ) + recoverStats chi tiết.
 *
 * Cách chạy: node test/test-p7-queue-persist.cjs  (chạy từ server/bridge/)
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { EventEmitter } = require("events");
const { RenderJobService } = require("../src/jobQueue");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function tmpWork() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p7-"));
}
function fakeProc() {
  const p = new EventEmitter();
  p.pid = 999999; // không kill thật (chỉ dùng cho isAlive guard — pid không tồn tại)
  p.kill = () => {};
  p.stderr = new EventEmitter();
  p.stdout = new EventEmitter();
  return p;
}
function writeJobJson(dir, state) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "job.json"), JSON.stringify(state));
}
function writeSpec(dir, duration) {
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });
  fs.writeFileSync(path.join(dir, "spec.json"),
    JSON.stringify({ meta: { duration }, tracks: [] }));
}
const JID = (c) => c.repeat(16); // id hex 16 ký tự: "a"*16, "b"*16...

console.log("== [1] enqueue + _start ghi job.json ==");
{
  const w = tmpWork();
  const svc = new RenderJobService({
    enableQA: false, maxConcurrent: 1,
    spawnJob: () => fakeProc(), // không bao giờ close → job ở running
  });
  const dir = path.join(w, JID("a"));
  const job = svc.enqueue({ id: JID("a"), dir, totalDuration: 7,
    preset: { crf: 20, x264Preset: "medium", audioBitrate: "128k" } });
  const saved = JSON.parse(fs.readFileSync(path.join(dir, "job.json"), "utf8"));
  ok(saved.status === "running", "job.json sau _start ghi status=running (slot trống → chạy ngay)");
  ok(saved.id === JID("a") && saved.totalDuration === 7, "job.json giữ id + totalDuration");
  ok(saved.preset && saved.preset.crf === 20, "job.json giữ preset");
  svc.shutdown();
  fs.rmSync(w, { recursive: true, force: true });
}
{
  // maxConcurrent=0 → job ở queued, job.json ghi queued.
  const w = tmpWork();
  const svc = new RenderJobService({
    enableQA: false, maxConcurrent: 0, spawnJob: () => fakeProc(),
  });
  const dir = path.join(w, JID("b"));
  svc.enqueue({ id: JID("b"), dir, totalDuration: 3 });
  const saved = JSON.parse(fs.readFileSync(path.join(dir, "job.json"), "utf8"));
  ok(saved.status === "queued", "job.json ghi status=queued khi chưa có slot");
  svc.shutdown();
  fs.rmSync(w, { recursive: true, force: true });
}

console.log("== [2] recover sau restart: queued/running/done/error/legacy ==");
{
  const w = tmpWork();
  // Q: queued + spec
  const dq = path.join(w, JID("1"));
  writeJobJson(dq, { id: JID("1"), status: "queued", progress: 0, totalDuration: 5,
    attempts: 0, createdAt: 1000, note: "q" });
  writeSpec(dq, 5);
  // R: running + spec + output dở dang
  const dr = path.join(w, JID("2"));
  writeJobJson(dr, { id: JID("2"), status: "running", progress: 0.4, totalDuration: 9,
    attempts: 1, createdAt: 2000, startedAt: 2100 });
  writeSpec(dr, 9);
  fs.writeFileSync(path.join(dr, "output.mp4"), Buffer.alloc(1234));
  // D: done + spec + output, KHÔNG có media (đã prune theo R1-040)
  const dd = path.join(w, JID("3"));
  writeJobJson(dd, { id: JID("3"), status: "done", progress: 1, totalDuration: 4,
    attempts: 1, createdAt: 3000, outputName: "vcut-x.mp4", outputSize: 4242 });
  fs.writeFileSync(path.join(dd, "spec.json"), JSON.stringify({ meta: { duration: 4 }, tracks: [] }));
  fs.writeFileSync(path.join(dd, "output.mp4"), Buffer.alloc(4242));
  // E: error + spec
  const de = path.join(w, JID("4"));
  writeJobJson(de, { id: JID("4"), status: "error", progress: 0.2, totalDuration: 6,
    attempts: 1, createdAt: 4000, error: "lỗi cũ" });
  writeSpec(de, 6);
  // X: không có job.json/spec.json → bỏ qua
  fs.mkdirSync(path.join(w, "junk"), { recursive: true });
  // L (legacy done): spec + output, không có media, không có job.json
  const dl = path.join(w, JID("5"));
  fs.mkdirSync(dl, { recursive: true });
  fs.writeFileSync(path.join(dl, "spec.json"), JSON.stringify({ meta: { duration: 2 }, tracks: [] }));
  fs.writeFileSync(path.join(dl, "output.mp4"), Buffer.alloc(777));
  // L2 (legacy queued): spec + media, không output, không job.json
  const dl2 = path.join(w, JID("6"));
  writeSpec(dl2, 3);

  let spawned = 0;
  const svc = new RenderJobService({
    enableQA: false, maxConcurrent: 0, // giữ queued ở queued để khẳng định trạng thái
    spawnJob: () => { spawned++; return fakeProc(); },
  });
  const n = svc.recover(w);
  const st = svc.recoverStats;
  ok(n === 6, `recover() trả về 6 (nhận ${n})`);
  ok(st.queued === 1 && st.interrupted === 1 && st.restored === 2 && st.legacy === 2,
    `recoverStats đúng {queued:1, interrupted:1, restored:2, legacy:2} (nhận ${JSON.stringify(st)})`);
  ok(spawned === 0, "recover với maxConcurrent=0 không spawn job nào");
  const q = svc.get(JID("1"));
  ok(q && q.status === "queued" && q.recovered === true, "queued → xếp hàng lại, giữ id, recovered=true");
  ok(q && q.createdAt === 1000, "queued giữ nguyên createdAt đã lưu");
  const r = svc.get(JID("2"));
  ok(r && r.status === "interrupted", "running → interrupted (không giả vờ chạy tiếp)");
  ok(r && /restart/.test(r.error || ""), "interrupted có error nêu rõ do restart");
  ok(!fs.existsSync(path.join(dr, "output.mp4")), "output dở dang của job interrupted bị xóa");
  const rj = JSON.parse(fs.readFileSync(path.join(dr, "job.json"), "utf8"));
  ok(rj.status === "interrupted", "job.json đã ghi đè running → interrupted (bền vững)");
  const d = svc.get(JID("3"));
  ok(d && d.status === "done" && d.outputSize === 4242 && d.attempts === 1,
    "done → khôi phục nguyên trạng, không render lại");
  ok(fs.existsSync(path.join(dd, "output.mp4")), "output của job done được giữ (phục vụ download)");
  const e = svc.get(JID("4"));
  ok(e && e.status === "error" && e.error === "lỗi cũ", "error → khôi phục nguyên trạng");
  ok(!svc.get("junk"), "dir không có job.json/spec.json → bỏ qua");
  const l = svc.get(JID("5"));
  ok(l && l.status === "done" && l.outputSize === 777, "legacy done (output + media prune) → khôi phục done");
  // Legacy re-enqueue không giữ id cũ (hành vi cũ: sinh id mới) → tìm theo dir.
  const l2 = svc.list().find((j) => j.dir === dl2);
  ok(l2 && l2.status === "queued", "legacy có spec + media → xếp hàng lại (hành vi cũ)");
  svc.shutdown();
  fs.rmSync(w, { recursive: true, force: true });
}

console.log("== [3] done không bao giờ bị spawn lại + retry từ interrupted ==");
{
  const w = tmpWork();
  const dd = path.join(w, JID("7"));
  writeJobJson(dd, { id: JID("7"), status: "done", progress: 1, totalDuration: 2,
    attempts: 1, createdAt: 5000, outputName: "vcut-y.mp4", outputSize: 99 });
  fs.writeFileSync(path.join(dd, "spec.json"), JSON.stringify({ meta: { duration: 2 }, tracks: [] }));
  fs.writeFileSync(path.join(dd, "output.mp4"), Buffer.alloc(99));
  const dr = path.join(w, JID("8"));
  writeJobJson(dr, { id: JID("8"), status: "interrupted", progress: 0.3, totalDuration: 2,
    attempts: 1, createdAt: 6000, error: "Bị gián đoạn do bridge restart" });
  writeSpec(dr, 2);
  let spawned = 0;
  const svc = new RenderJobService({
    enableQA: false, maxConcurrent: 2,
    spawnJob: () => { spawned++; return fakeProc(); },
  });
  svc.recover(w);
  ok(spawned === 0, "recover không spawn job done/interrupted dù còn slot trống");
  svc.maxConcurrent = 0; // khóa slot để retry dừng ở queued (khẳng định trạng thái)
  const rt = svc.retry(JID("8"));
  ok(rt.status === "queued", "retry từ interrupted → queued");
  let threw = null;
  try { svc.retry(JID("7")); } catch (err) { threw = err; }
  ok(threw && threw.code === "BAD_STATE", "retry từ done → BAD_STATE");
  svc.shutdown();
  fs.rmSync(w, { recursive: true, force: true });
}

console.log("== [4] job done thật → job.json done, restart khôi phục done ==");
{
  const w = tmpWork();
  const dir = path.join(w, JID("9"));
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });
  fs.writeFileSync(path.join(dir, "spec.json"), JSON.stringify({ meta: { duration: 1 }, tracks: [] }));
  const svc = new RenderJobService({
    enableQA: false, maxConcurrent: 1,
    spawnJob: () => fakeProc(),
  });
  const job9 = svc.enqueue({ id: JID("9"), dir, totalDuration: 1 });
  ok(job9.status === "running", "job bắt đầu chạy (slot trống)");
  // Handler close đã gắn trong _start → emit đồng bộ là _onDone chạy ngay
  // (nhánh enableQA=false không có await trước _onDone).
  fs.writeFileSync(path.join(dir, "output.mp4"), Buffer.alloc(512));
  job9.proc.emit("close", 0, null);
  const done = svc.get(JID("9"));
  ok(done && done.status === "done", "job chạy xong → done");
  const saved = JSON.parse(fs.readFileSync(path.join(dir, "job.json"), "utf8"));
  ok(saved.status === "done" && saved.outputSize === 512, "job.json ghi done + outputSize");
  // Service mới = process mới: recover phải thấy done, không render lại.
  let spawned = 0;
  const svc2 = new RenderJobService({
    enableQA: false, maxConcurrent: 2,
    spawnJob: () => { spawned++; return fakeProc(); },
  });
  svc2.recover(w);
  const d2 = svc2.get(JID("9"));
  ok(d2 && d2.status === "done" && spawned === 0, "restart: done khôi phục nguyên trạng, không spawn lại");
  svc.shutdown(); svc2.shutdown();
  fs.rmSync(w, { recursive: true, force: true });
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail ? 1 : 0);

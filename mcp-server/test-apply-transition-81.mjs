#!/usr/bin/env node
/**
 * test-apply-transition-81.mjs — Phase 9 đợt 62, luồng R8: đóng nợ đợt 61 §5.10(a).
 *
 * Kiểm chứng MCP `apply_transition` chấp nhận đủ 81 type thật trong
 * TRANSITION_TYPES (58 xfade native + 23 custom-expr; cộng "none" thành
 * 82 entry) qua MCP THẬT
 * (stdio JSON-RPC, SDK client gọi tool — đi qua cả zod schema ở index.ts
 * lẫn validate.ts), và từ chối type lạ với lỗi rõ ràng, không crash.
 *
 * Chạy (từ thư mục mcp-server, sau `npx tsc -p tsconfig.json`):
 *   node test-apply-transition-81.mjs
 * Exit 0 khi: schema tool liệt kê đúng 82 enum + 82/82 apply_transition
 * pass + mọi type lạ bị từ chối (isError) + server còn sống sau đó +
 * add_clip với transitionIn type mới pass. Dọn project test sau khi chạy.
 * KHÔNG push/tag/binary. KHÔNG sửa code sản phẩm trong script này.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_JS = path.join(HERE, "dist", "mcp-server", "src", "index.js");
const PROJECTS_DIR = path.join(HERE, "projects");

// 82 entry — copy từ TRANSITION_TYPES (packages/video-spec/src/transitions.ts),
// đếm độc lập ở đây để test tự bắt được nếu 2 nguồn lệch nhau.
// "81 type" trong đề bài = 81 type thật (58 xfade native + 23 custom-expr);
// cộng thêm "none" (không hiệu ứng) thành 82 entry — MCP phải chấp nhận
// cả "none" (duration 0) lẫn 81 type thật.
const EXPECTED = [
  "none", "fade", "fadeblack", "fadewhite",
  "wipeleft", "wiperight", "wipeup", "wipedown",
  "slideleft", "slideright", "dissolve", "circleopen", "radial",
  "smoothleft", "smoothright", "smoothup", "smoothdown",
  "slideup", "slidedown", "circleclose", "circlecrop", "rectcrop",
  "pixelize", "hblur", "distance", "vertopen", "horzopen", "diagtl",
  "vertclose", "horzclose", "diagtr", "diagbl", "diagbr",
  "hlslice", "hrslice", "vuslice", "vdslice", "fadegrays",
  "wipetl", "wipetr", "wipebl", "wipebr", "squeezeh", "squeezev",
  "zoomin", "fadefast", "fadeslow", "hlwind", "hrwind", "vuwind", "vdwind",
  "coverleft", "coverright", "coverup", "coverdown",
  "revealleft", "revealright", "revealup", "revealdown",
  "blinds-h", "bars-v", "checker", "diamond", "plus", "grid", "clock",
  "circle-soft", "bars-fade",
  "diamondclose", "squareopen", "squareclose", "checker-alt",
  "blinds-diag", "split-h", "split-v", "barn-h", "barn-v", "rings",
  "corners", "star", "clock-ccw", "spiral",
];

let pass = 0;
let fail = 0;
function ok(name) { pass++; console.log(`  ✓ ${name}`); }
function bad(name, detail) { fail++; console.error(`  ✗ ${name}: ${detail}`); }

const createdProjects = [];
async function call(client, name, args) {
  const r = await client.callTool({ name, arguments: args });
  const text = (r.content ?? []).map((c) => c.text ?? "").join("");
  return { isError: !!r.isError, text };
}

async function main() {
  assert.equal(EXPECTED.length, 82, `danh sách kỳ vọng phải có 82 entry (81 type thật + "none"), đang ${EXPECTED.length}`);
  assert.equal(EXPECTED.filter((t) => t !== "none").length, 81, "phải có đúng 81 type thật (không tính \"none\")");
  assert.equal(new Set(EXPECTED).size, 82, "danh sách kỳ vọng không được trùng type");
  if (!fs.existsSync(SERVER_JS)) {
    console.error(`BLOCKER: chưa build MCP server — chạy: npx tsc -p tsconfig.json (thiếu ${SERVER_JS})`);
    process.exitCode = 2;
    return;
  }

  // Đếm độc lập TRANSITION_TYPES trong source (không qua dist) để khóa
  // số 82 entry từ 2 phía: source video-spec và schema MCP.
  const tsSrc = fs.readFileSync(
    path.join(HERE, "..", "packages", "video-spec", "src", "transitions.ts"), "utf8");
  const block = tsSrc.slice(tsSrc.indexOf("export const TRANSITION_TYPES = ["),
    tsSrc.indexOf("] as const;"));
  const fromSource = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (fromSource.length === 82 && EXPECTED.every((t) => fromSource.includes(t))) {
    ok(`TRANSITION_TYPES trong source có đúng 82 entry (81 type thật + "none"), khớp danh sách kỳ vọng`);
  } else {
    bad(`TRANSITION_TYPES trong source`, `đếm được ${fromSource.length}, lệch: ${EXPECTED.filter((t) => !fromSource.includes(t)).join(",") || "—"} / thừa: ${fromSource.filter((t) => !EXPECTED.includes(t)).join(",") || "—"}`);
  }

  const transport = new StdioClientTransport({
    command: process.execPath, args: [SERVER_JS], stderr: "pipe",
  });
  let serverStderr = "";
  transport.stderr?.on("data", (d) => { serverStderr += d.toString(); });
  const client = new Client({ name: "r62-r8-test", version: "0.1.0" }, { capabilities: {} });
  try {
    await client.connect(transport);

    // (1) Schema tool liệt kê đúng 82 enum.
    const tools = await client.listTools();
    const apply = tools.tools.find((t) => t.name === "apply_transition");
    if (!apply) { bad("tools/list có apply_transition", "không thấy tool"); }
    else {
      const enumVals = apply.inputSchema?.properties?.type?.enum ?? [];
      if (enumVals.length === 82 && EXPECTED.every((t) => enumVals.includes(t))) {
        ok(`schema apply_transition.type liệt kê đúng 82 enum`);
      } else {
        bad(`schema apply_transition.type`, `đếm được ${enumVals.length} enum`);
      }
      // add_clip cũng dùng chung transitionSchema — kiểm tra schema lồng.
      const addClip = tools.tools.find((t) => t.name === "add_clip");
      const clipEnum = addClip?.inputSchema?.properties?.clip?.anyOf
        ?.find((s) => s.properties?.transitionIn)?.properties?.transitionIn?.properties?.type?.enum ?? [];
      if (clipEnum.length === 82) ok(`schema add_clip clip.transitionIn.type cũng có 82 enum`);
      else bad(`schema add_clip transitionIn`, `đếm được ${clipEnum.length} enum (kỳ vọng 82)`);
    }

    // (2) Tạo project + 2 clip video.
    const created = await call(client, "create_project",
      { name: "r62-r8-transition81", width: 1280, height: 720, fps: 30 });
    if (created.isError) { bad("create_project", created.text.slice(0, 300)); throw new Error("không tạo được project"); }
    const projectId = JSON.parse(created.text).project_id;
    createdProjects.push(projectId);
    ok(`create_project ok (id=${projectId})`);
    for (const [id, start] of [["c1", 0], ["c2", 4]]) {
      const r = await call(client, "add_clip", {
        project_id: projectId, track_kind: "video",
        clip: { kind: "video", id, src: "clip1.mp4", start, duration: 4, in: 0, out: 4 },
      });
      if (r.isError) bad(`add_clip ${id}`, r.text.slice(0, 300));
      else ok(`add_clip ${id} ok`);
    }

    // (3) apply_transition đủ 82 entry qua MCP thật.
    let nPass = 0;
    const failedTypes = [];
    for (const type of EXPECTED) {
      const r = await call(client, "apply_transition", {
        project_id: projectId, clip_id: "c1", direction: "in",
        type, duration: type === "none" ? 0 : 0.5,
      });
      if (r.isError) { failedTypes.push(`${type}: ${r.text.slice(0, 160)}`); continue; }
      let parsed;
      try { parsed = JSON.parse(r.text); } catch { failedTypes.push(`${type}: trả về không phải JSON`); continue; }
      if (parsed.transition?.type === type && parsed.transition?.duration === (type === "none" ? 0 : 0.5)) nPass++;
      else failedTypes.push(`${type}: trả về sai transition ${r.text.slice(0, 160)}`);
    }
    if (nPass === 82) ok(`apply_transition 82/82 entry pass qua MCP thật (81 type thật + "none")`);
    else bad(`apply_transition`, `${nPass}/82 pass; lỗi: ${failedTypes.slice(0, 3).join(" || ")}`);

    // (4) Hướng "out" + get_project xác nhận state lưu thật.
    const outR = await call(client, "apply_transition", {
      project_id: projectId, clip_id: "c1", direction: "out", type: "spiral", duration: 0.75,
    });
    if (!outR.isError && JSON.parse(outR.text).transition?.type === "spiral") ok(`apply_transition direction=out (spiral, 0.75s) pass`);
    else bad("apply_transition direction=out", outR.text.slice(0, 300));
    const got = await call(client, "get_project", { project_id: projectId });
    if (!got.isError) {
      const spec = JSON.parse(got.text).spec;
      const clip = spec.tracks.flatMap((t) => t.clips).find((c) => c.id === "c1");
      if (clip?.transitionIn?.type === "spiral" && clip?.transitionOut?.type === "spiral") {
        ok(`get_project: transitionIn+transitionOut của c1 đều là spiral (type cuối cùng đã apply)`);
      } else {
        bad("get_project state", `transitionIn=${JSON.stringify(clip?.transitionIn)} transitionOut=${JSON.stringify(clip?.transitionOut)}`);
      }
    } else bad("get_project", got.text.slice(0, 300));

    // (5) add_clip với transitionIn type mới (đường schema thứ 2).
    const r3 = await call(client, "add_clip", {
      project_id: projectId, track_kind: "video",
      clip: { kind: "video", id: "c3", src: "clip1.mp4", start: 8, duration: 4, in: 0, out: 4,
        transitionIn: { type: "checker-alt", duration: 0.5 } },
    });
    if (!r3.isError) ok(`add_clip với transitionIn checker-alt pass`);
    else bad("add_clip transitionIn checker-alt", r3.text.slice(0, 300));

    // (6) Type lạ phải bị từ chối với lỗi rõ ràng, server không crash.
    const invalids = [
      ["glitch-3d", "type chưa từng tồn tại"],
      ["FADE", "sai hoa/thường (phân biệt chữ hoa)"],
      ["", "chuỗi rỗng"],
      ["fade ", "thừa khoảng trắng"],
      ["circle_open", "gạch dưới thay gạch ngang"],
      [123, "không phải chuỗi"],
      [null, "null"],
    ];
    let nReject = 0;
    for (const [badType, why] of invalids) {
      const r = await call(client, "apply_transition", {
        project_id: projectId, clip_id: "c1", direction: "in", type: badType, duration: 0.5,
      });
      const msg = r.text || "";
      if (r.isError && /type/i.test(msg)) { nReject++; ok(`từ chối type lạ ${JSON.stringify(badType)} (${why}) — lỗi rõ ràng`); }
      else bad(`từ chối type lạ ${JSON.stringify(badType)}`, `isError=${r.isError}, text=${msg.slice(0, 200)}`);
    }
    // Type lạ trong add_clip cũng phải bị từ chối.
    const rBadClip = await call(client, "add_clip", {
      project_id: projectId, track_kind: "video",
      clip: { kind: "video", id: "c-bad", src: "clip1.mp4", start: 12, duration: 4, in: 0, out: 4,
        transitionIn: { type: "nope", duration: 0.5 } },
    });
    if (rBadClip.isError) { nReject++; ok(`từ chối add_clip transitionIn type lạ "nope"`); }
    else bad("từ chối add_clip type lạ", "không báo lỗi");

    // (7) Server còn sống sau loạt lỗi: gọi hợp lệ vẫn pass.
    const alive = await call(client, "apply_transition", {
      project_id: projectId, clip_id: "c1", direction: "in", type: "fade", duration: 0.5,
    });
    if (!alive.isError) ok(`server còn sống sau ${invalids.length} lỗi (apply fade vẫn pass, không crash)`);
    else bad("server còn sống sau lỗi", alive.text.slice(0, 300));

    console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail (82 entry + ${invalids.length + 1} từ chối + schema/state)`);
    if (serverStderr.trim()) console.log(`(server stderr: ${serverStderr.trim().slice(0, 500)})`);
    process.exitCode = fail === 0 ? 0 : 1;
  } finally {
    try { await client.close(); } catch { /* bỏ qua */ }
    // Dọn project test. (Không pkill: client.close() đã tắt đúng server
    // con mà transport đã spawn; pkill theo đường dẫn có thể giết nhầm
    // server MCP khác đang chạy cho main chat.)
    for (const pid of createdProjects) {
      try { fs.rmSync(path.join(PROJECTS_DIR, pid), { recursive: true, force: true }); } catch { /* bỏ qua */ }
    }
  }
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`);
  process.exitCode = 2;
});

#!/usr/bin/env node
/**
 * test-error-codes-63r9.mjs — Phase 9 đợt 63, luồng R9: mã lỗi ổn định
 * tới được client MCP thật (stdio JSON-RPC, SDK client gọi tool).
 *
 * Kiểm chứng end-to-end: ValidationError ném trong validate.ts /
 * store.ts / tool handler tới client dưới dạng text
 * `LỖI: [MÃ] message` (isError=true), message tiếng Việt giữ nguyên.
 * Zod chặn trước validate thì KHÔNG có mã (giữ nguyên hành vi cũ) —
 * test này chỉ dùng input qua được zod nhưng rớt validate.
 *
 * Chạy (từ thư mục mcp-server, sau `npx tsc -p tsconfig.json`):
 *   node test-error-codes-63r9.mjs
 * Exit 0 khi mọi case pass. Dọn project test sau khi chạy.
 * KHÔNG push/tag/binary.
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

let pass = 0;
let fail = 0;
function ok(name) { pass++; console.log(`  ✓ ${name}`); }
function bad(name, detail) { fail++; console.error(`  ✗ ${name}: ${detail}`); }

async function call(client, name, args) {
  const r = await client.callTool({ name, arguments: args });
  const text = (r.content ?? []).map((c) => c.text ?? "").join("");
  return { isError: !!r.isError, text };
}

async function main() {
  if (!fs.existsSync(SERVER_JS)) {
    console.error(`BLOCKER: chưa build MCP server — chạy: npx tsc -p tsconfig.json (thiếu ${SERVER_JS})`);
    process.exitCode = 2;
    return;
  }
  const transport = new StdioClientTransport({
    command: process.execPath, args: [SERVER_JS], stderr: "pipe",
  });
  let serverStderr = "";
  transport.stderr?.on("data", (d) => { serverStderr += d.toString(); });
  const client = new Client({ name: "r63-r9-test", version: "0.1.0" }, { capabilities: {} });
  const createdProjects = [];
  try {
    await client.connect(transport);

    // (1) Tạo project thật để các tool sau có project_id hợp lệ.
    const created = await call(client, "create_project", {
      name: "R63R9 codes", width: 1280, height: 720, fps: 30,
    });
    if (created.isError) { bad("create_project", created.text.slice(0, 200)); throw new Error("không tạo được project"); }
    const pid = JSON.parse(created.text).project_id;
    createdProjects.push(pid);
    ok("create_project pass (chuẩn bị)");

    // (2) apply_transition duration 0 + type fade: qua zod (duration
    // nonnegative cho 0 qua) rồi rớt validate -> TRANSITION_DURATION_ZERO.
    const t0 = await call(client, "apply_transition", {
      project_id: pid, clip_id: "c1", direction: "in", type: "fade", duration: 0,
    });
    // clip c1 chưa tồn tại — tool kiểm tra clip trước hay validate
    // duration trước? Bất kể thứ tự, kết quả phải là lỗi CÓ MÃ.
    if (t0.isError && /\[TRANSITION_DURATION_ZERO\]|\[NOT_FOUND\]/.test(t0.text)) {
      ok(`apply_transition duration=0 -> lỗi có mã (${(t0.text.match(/\[[A-Z_]+]/) || ["?"])[0]})`);
    } else {
      bad("apply_transition duration=0", `isError=${t0.isError}, text=${t0.text.slice(0, 200)}`);
    }

    // (3) add_clip với clip.out <= clip.in: zod không kiểm tra quan hệ
    // in/out nên tới được validate -> OUT_NOT_AFTER_IN, message giữ nguyên.
    const badClip = await call(client, "add_clip", {
      project_id: pid, track_kind: "video",
      clip: { kind: "video", id: "bad1", src: "x.mp4", start: 0, duration: 2, in: 2, out: 1 },
    });
    if (badClip.isError && badClip.text.includes("[OUT_NOT_AFTER_IN]") &&
        badClip.text.includes("clip.out (1) phải > clip.in (2)")) {
      ok("add_clip out<=in -> [OUT_NOT_AFTER_IN], message giữ nguyên");
    } else {
      bad("add_clip out<=in", `isError=${badClip.isError}, text=${badClip.text.slice(0, 200)}`);
    }

    // (4) add_clip với id sai định dạng ("a b"): reqId -> ID_INVALID.
    const badId = await call(client, "add_clip", {
      project_id: pid, track_kind: "video",
      clip: { kind: "video", id: "a b", src: "x.mp4", start: 0, duration: 2, in: 0, out: 2 },
    });
    if (badId.isError && badId.text.includes("[ID_INVALID]")) {
      ok("add_clip id sai -> [ID_INVALID]");
    } else {
      bad("add_clip id sai", `isError=${badId.isError}, text=${badId.text.slice(0, 200)}`);
    }

    // (5) get_project với project không tồn tại -> NOT_FOUND.
    const gone = await call(client, "get_project", { project_id: "khong-ton-tai-63r9" });
    if (gone.isError && gone.text.includes("[NOT_FOUND]")) {
      ok("get_project không tồn tại -> [NOT_FOUND]");
    } else {
      bad("get_project không tồn tại", `isError=${gone.isError}, text=${gone.text.slice(0, 200)}`);
    }

    // (6) Server còn sống sau các lỗi (create/add_clip hợp lệ vẫn pass).
    const alive = await call(client, "add_text", {
      project_id: pid, text: "sau lỗi", start: 0, duration: 1,
    });
    if (!alive.isError) ok("server còn sống sau các lỗi (add_text pass)");
    else bad("server còn sống", alive.text.slice(0, 200));
  } catch (e) {
    console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`);
    fail++;
  } finally {
    try { await client.close(); } catch { /* bỏ qua */ }
    for (const pid of createdProjects) {
      try { fs.rmSync(path.join(PROJECTS_DIR, `${pid}.json`), { force: true }); } catch { /* bỏ qua */ }
    }
  }
  console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
  if (serverStderr && fail > 0) console.error(`(server stderr: ${serverStderr.slice(-500)})`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main();

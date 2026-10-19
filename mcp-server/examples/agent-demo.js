#!/usr/bin/env node
/**
 * agent-demo.js — Mô phỏng một AI agent dùng MCP server để tạo video.
 *
 * Đây KHÔNG phải fake: script này chạy MCP server thật qua stdio
 * (đúng như Claude Code/Codex kết nối), gọi tuần tự các tools,
 * render ra MP4 thật, rồi tự kiểm chứng bằng ffprobe.
 *
 * Chạy:  npm run demo   (từ thư mục mcp-server, sau khi npm run build)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_JS = path.resolve(HERE, "..", "dist", "mcp-server", "src", "index.js");

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✅ ${name}`);
  } else {
    failures++;
    console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`);
  }
}

function parseText(res) {
  const t = res?.content?.[0]?.text ?? "";
  try {
    return JSON.parse(t);
  } catch {
    return { _raw: t };
  }
}

async function main() {
  console.log("== [1] Kết nối MCP server qua stdio (như Claude Code/Codex) ==");
  const transport = new StdioClientTransport({ command: process.execPath, args: [SERVER_JS] });
  const client = new Client({ name: "agent-demo", version: "0.1.0" });
  await client.connect(transport);
  console.log("  ✅ đã kết nối");

  console.log("== [2] Liệt kê tools ==");
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  console.log("  tools:", names.join(", "));
  for (const want of ["create_project", "add_clip", "add_text", "apply_transition", "get_project", "render_video"])
    check(`có tool ${want}`, names.includes(want));

  console.log("== [3] Agent tạo project 10s ==");
  let r = await client.callTool({
    name: "create_project",
    arguments: { name: "agent-demo", width: 1280, height: 720, fps: 30 },
  });
  check("create_project không lỗi", !r.isError, JSON.stringify(r).slice(0, 200));
  const projectId = parseText(r).project_id;
  check("trả về project_id", typeof projectId === "string" && projectId.length > 0, String(projectId));
  console.log("  project_id:", projectId);

  console.log("== [4] Agent thêm 2 clip video + transition fade ==");
  r = await client.callTool({
    name: "add_clip",
    arguments: {
      project_id: projectId,
      track_kind: "video",
      clip: { kind: "video", id: "c1", src: "clip1.mp4", start: 0, duration: 5, in: 0, out: 5 },
    },
  });
  check("add_clip c1 ok", !r.isError, JSON.stringify(r).slice(0, 200));

  r = await client.callTool({
    name: "apply_transition",
    arguments: { project_id: projectId, clip_id: "c1", direction: "out", type: "fade", duration: 1 },
  });
  check("apply_transition fade 1s cho c1", !r.isError, JSON.stringify(r).slice(0, 200));

  r = await client.callTool({
    name: "add_clip",
    arguments: {
      project_id: projectId,
      track_kind: "video",
      clip: { kind: "video", id: "c2", src: "clip2.mp4", start: 5, duration: 5, in: 2, out: 7 },
    },
  });
  check("add_clip c2 ok", !r.isError, JSON.stringify(r).slice(0, 200));

  console.log("== [5] Agent thêm chữ + nhạc nền ==");
  r = await client.callTool({
    name: "add_text",
    arguments: {
      project_id: projectId,
      text: "AI agent tự tạo video này!",
      start: 1,
      duration: 4,
      style: { fontFamily: "Noto Sans", fontSize: 64, color: "#ffffff", bold: true, x: 0.5, y: 0.35, animation: "fadeUp" },
    },
  });
  check("add_text ok", !r.isError, JSON.stringify(r).slice(0, 200));

  r = await client.callTool({
    name: "add_clip",
    arguments: {
      project_id: projectId,
      track_kind: "audio",
      clip: { kind: "audio", id: "a1", src: "music.m4a", start: 0, duration: 10, in: 0, out: 10, volume: 0.5, fadeIn: 1, fadeOut: 2 },
    },
  });
  check("add_clip audio ok", !r.isError, JSON.stringify(r).slice(0, 200));

  console.log("== [6] Agent kiểm tra project trước khi render ==");
  r = await client.callTool({ name: "get_project", arguments: { project_id: projectId } });
  const proj = parseText(r);
  check("get_project ok", !r.isError);
  check("tổng thời lượng ≈ 10s", Math.abs((proj.total_duration_sec ?? 0) - 10) < 0.01, String(proj.total_duration_sec));

  console.log("== [7] Test lỗi: input sai phải bị từ chối rõ ràng ==");
  r = await client.callTool({
    name: "add_clip",
    arguments: {
      project_id: projectId,
      track_kind: "video",
      clip: { kind: "video", id: "bad", src: "clip1.mp4", start: 0, duration: 5, in: 6, out: 5 },
    },
  });
  check("clip out<in bị từ chối", r.isError === true, "đáng lẽ phải lỗi");
  r = await client.callTool({ name: "get_project", arguments: { project_id: "nope" } });
  check("project_id sai bị từ chối", r.isError === true, "đáng lẽ phải lỗi");
  r = await client.callTool({
    name: "render_video",
    arguments: { project_id: projectId, out_path: "../../evil.mp4" },
  });
  check("path traversal bị chặn", r.isError === true, "đáng lẽ phải lỗi");

  console.log("== [8] Agent render video ==");
  const t0 = Date.now();
  r = await client.callTool({
    name: "render_video",
    arguments: { project_id: projectId, out_path: "agent-demo.mp4" },
  });
  console.log(`  render mất ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  check("render_video không lỗi", !r.isError, JSON.stringify(r).slice(0, 500));
  const mp4Path = parseText(r).mp4_path;
  check("trả về mp4_path", typeof mp4Path === "string", String(mp4Path));

  console.log("== [9] Kiểm chứng MP4 bằng ffprobe (độc lập, không qua server) ==");
  const p = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-show_entries",
      "stream=codec_type,codec_name,width,height,avg_frame_rate", "-of", "json", mp4Path],
    { encoding: "utf8", timeout: 30000 }
  );
  check("ffprobe chạy được", p.status === 0, String(p.stderr).slice(0, 200));
  const info = JSON.parse(p.stdout);
  const v = (info.streams || []).find((s) => s.codec_type === "video") || {};
  const a = (info.streams || []).find((s) => s.codec_type === "audio") || {};
  const dur = Number(info.format?.duration ?? 0);
  check("video codec h264", v.codec_name === "h264", String(v.codec_name));
  check("độ phân giải 1280x720", v.width === 1280 && v.height === 720, `${v.width}x${v.height}`);
  check("fps = 30", String(v.avg_frame_rate).startsWith("30/"), String(v.avg_frame_rate));
  check("thời lượng ≈ 10s", Math.abs(dur - 10) < 0.6, String(dur));
  check("có track audio (aac)", a.codec_name === "aac", String(a.codec_name));

  await client.close();
  console.log("");
  if (failures === 0) {
    console.log(`🎉 DEMO PASS — AI agent đã tạo video thật: ${mp4Path}`);
  } else {
    console.log(`💥 DEMO FAIL — ${failures} kiểm tra không đạt`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("💥 DEMO CRASH:", e);
  process.exit(1);
});

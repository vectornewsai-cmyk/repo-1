#!/usr/bin/env node
/**
 * index.ts — vcut CLI: điều khiển VCut Studio từ terminal.
 *
 * AI agent và power user dùng được editor mà không cần mở browser.
 * Mọi thao tác đều đi qua video-spec JSON đã validate.
 */
import { cmdAddClip } from "./commands/addClip.js";
import { cmdAddText } from "./commands/addText.js";
import { cmdApplyFilter } from "./commands/applyFilter.js";
import { cmdApplyTransition } from "./commands/applyTransition.js";
import { cmdCaption } from "./commands/caption.js";
import { cmdCreate } from "./commands/create.js";
import { cmdInfo } from "./commands/info.js";
import { cmdRender } from "./commands/render.js";
import { cmdSetSpeed } from "./commands/setSpeed.js";
import { cmdTts } from "./commands/tts.js";
import { cmdValidate } from "./commands/validate.js";
import { CliError, parseArgs } from "./args.js";
import { LUT_IDS } from "../../packages/video-spec/src/lut.js";
import { TRANSITION_TYPES } from "../../packages/video-spec/src/transitions.js";
import { TEXT_ANIMATIONS } from "../../packages/video-spec/src/textfx.js";
import { PRESETS } from "./commands/render.js";

const VERSION = "0.1.0";

function printHelp(): void {
  console.log(`vcut v${VERSION} — Command-line interface cho VCut Studio
`);
  console.log(`Cách dùng:
  vcut <lệnh> [tùy chọn]
`);
  console.log(`Lệnh:
  create             Tạo project mới (trống)
  add-clip           Thêm clip video/audio/image
  add-text           Thêm clip chữ
  apply-transition   Gắn transition vào clip video
  apply-filter       Gắn bộ lọc màu LUT vào clip video
  set-speed          Đặt tốc độ phát cho clip
  caption            Auto-caption (faster-whisper, local) → thêm track phụ đề
  tts                Tổng hợp giọng nói (VieNeu-TTS, local) → thêm audio clip
  render             Validate rồi render thành MP4
  validate           Kiểm tra project hợp lệ không
  info               Tóm tắt project
  list-transitions   Liệt kê các loại transition
  list-luts          Liệt kê các bộ lọc LUT
  list-voices        Liệt kê giọng TTS (cần model)
  help               Hiện trợ giúp này
`);
  console.log(`Ví dụ:
  vcut create --name "My Video" --width 1920 --height 1080 --out proj.json
  vcut add-clip --project proj.json --src clip.mp4 --start 0 --duration 5
  vcut add-text --project proj.json --text "Xin chào" --start 1 --duration 3
  vcut render --project proj.json --preset 1080p --output out.mp4
`);
  console.log(`Xem chi tiết từng lệnh: vcut help <lệnh>`);
}

function printCommandHelp(cmd: string): void {
  const helps: Record<string, string> = {
    create: `vcut create --name "Tên" [--width 1920] [--height 1080] [--fps 30] [--out proj.json]`,
    "add-clip": `vcut add-clip --project proj.json --src video.mp4 --start 0 --duration 5
  [--kind video|audio|image] [--in 0] [--out 5]`,
    "add-text": `vcut add-text --project proj.json --text "Hello" --start 1 --duration 3
  [--font-size 48] [--color "#ffffff"] [--bg "#000000"] [--font "Noto Sans"]
  [--x 0.5] [--y 0.5] [--animation fadeUp] [--bold] [--italic]`,
    "apply-transition": `vcut apply-transition --project proj.json --clip <id> --type fade
  [--duration 0.5] [--side in|out|both]   (mặc định: out)`,
    "apply-filter": `vcut apply-filter --project proj.json --clip <id> --lut vcut-warm`,
    "set-speed": `vcut set-speed --project proj.json --clip <id> --speed 2
  (0.25..4; duration tự cập nhật theo invariant)`,
    caption: `vcut caption --project proj.json --src video.mp4 [--lang vi]
  [--max-chars 42] [--max-dur 7]
  Chạy faster-whisper local, thêm track phụ đề vào project.`,
    tts: `vcut tts --project proj.json --text "Xin chào" [--voice hai_dang] [--start 0]
  Tổng hợp giọng nói local, copy WAV vào ./media, thêm audio clip.`,
    render: `vcut render --project proj.json --output out.mp4
  [--preset 1080p] [--media-dir ./media] [--crf 20] [-y] [-q]
  Preset: ${Object.keys(PRESETS).join(", ")}`,
    validate: `vcut validate --project proj.json`,
    info: `vcut info --project proj.json`,
  };
  const h = helps[cmd];
  if (h) console.log(h);
  else {
    console.error(`Không có trợ giúp cho lệnh: ${cmd}`);
    process.exitCode = 1;
  }
}

async function listVoices(): Promise<void> {
  const { spawnSync } = await import("node:child_process");
  const { TTS_PY, PYTHON_BIN } = await import("./paths.js");
  const r = spawnSync(PYTHON_BIN, [TTS_PY, "--list-voices"], { encoding: "utf8", timeout: 120000 });
  if (r.status !== 0) {
    console.error("Không liệt kê được giọng (model TTS chưa tải?)");
    process.exitCode = 1;
    return;
  }
  process.stdout.write(r.stdout);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // vcut help / vcut --help / vcut help <lệnh>
  if (args.command === "" || args.command === "help" || args.flags["help"] === true || args.flags["h"] === true) {
    if (args.command === "help" && args.positional.length > 0) printCommandHelp(args.positional[0]);
    else printHelp();
    return;
  }
  if (args.flags["version"] === true || args.flags["v"] === true) {
    console.log(`vcut v${VERSION}`);
    return;
  }

  try {
    switch (args.command) {
      case "create": await cmdCreate(args); break;
      case "add-clip": await cmdAddClip(args); break;
      case "add-text": await cmdAddText(args); break;
      case "apply-transition": await cmdApplyTransition(args); break;
      case "apply-filter": await cmdApplyFilter(args); break;
      case "set-speed": await cmdSetSpeed(args); break;
      case "caption": await cmdCaption(args); break;
      case "tts": await cmdTts(args); break;
      case "render": await cmdRender(args); break;
      case "validate": await cmdValidate(args); break;
      case "info": await cmdInfo(args); break;
      case "list-transitions":
        console.log((TRANSITION_TYPES as readonly string[]).join("\n"));
        break;
      case "list-luts":
        console.log((LUT_IDS as readonly string[]).join("\n"));
        break;
      case "list-animations":
        console.log((TEXT_ANIMATIONS as readonly string[]).join("\n"));
        break;
      case "list-voices":
        await listVoices();
        break;
      default:
        console.error(`Lệnh không rõ: ${args.command}\nChạy "vcut help" để xem danh sách lệnh.`);
        process.exitCode = 1;
    }
  } catch (e) {
    if (e instanceof CliError) {
      console.error(`Lỗi: ${e.message}`);
    } else {
      console.error(`Lỗi không mong đợi: ${e instanceof Error ? e.message : String(e)}`);
    }
    process.exitCode = 1;
  }
}

main();

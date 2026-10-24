// Q6 (Phase 8) — kiểm chứng touch thật trên editor mobile bằng CDP.
//
// DÙNG KHI: muốn tái kiểm chứng scrub 1 ngón + pinch 2 ngón trên timeline
// ở viewport điện thoại, không cần cài Playwright (chỉ cần binary Chromium
// trong ~/.cache/ms-playwright/ và preview server đang chạy).
//
// CHẠY:
//   cd apps/web
//   npx vite preview --port 4173 --host 127.0.0.1
//   node scripts/mobile-touch-check.mjs
//
// TẠI SAO KHÔNG DÙNG synthesizePinchGesture / dispatchEvent(PointerEvent):
// cả hai đều KHÔNG tới được handler React trong headless Chrome (cái đầu
// chỉ lái compositor page-zoom, cái sau React không xử lý) và cho kết quả
// "fail" giả. Script này dùng Input.dispatchTouchEvent (trusted touch),
// gần nhất với ngón tay thật. Xem src/MOBILE_LIMITS.md.
//
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.CDP_PORT || 9227);
const PREVIEW_URL = process.env.PREVIEW_URL || "http://127.0.0.1:4173/";
const CHROME =
  process.env.CHROME_BIN ||
  join(homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
if (!existsSync(CHROME)) {
  console.error("Không tìm thấy Chromium tại:", CHROME);
  console.error("Đặt CHROME_BIN trỏ tới binary Chromium của bạn.");
  process.exit(2);
}
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws,
  nextId = 1;
const pending = new Map();
function send(method, params = {}) {
  const id = nextId++;
  return new Promise((res) => {
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(e) {
  const r = await send("Runtime.evaluate", {
    expression: e,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
}
let failures = 0;
try {
  let targets;
  for (let i = 0; i < 30; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      break;
    } catch {
      await sleep(500);
    }
  }
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d.result);
      pending.delete(d.id);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await send("Page.navigate", { url: PREVIEW_URL });
  for (let i = 0; i < 240; i++) {
    const ready = await ev(
      "!document.querySelector('.splash') && !!document.querySelector('.tl-clip')",
    );
    if (ready) break;
    await sleep(500);
  }
  const geom = await ev(
    "(() => { const r = document.querySelector('.tl-ruler').getBoundingClientRect(); return { x: r.left + 100, y: r.top + r.height / 2, x2: r.left + 200 }; })()",
  );
  const ph0 = await ev("document.querySelector('.tl-timecode').textContent");
  // Trusted touch: 1 ngón kéo trên ruler (scrub)
  await send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: geom.x, y: geom.y, id: 1 }],
  });
  await send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: geom.x2, y: geom.y, id: 1 }],
  });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
  const ph1 = await ev("document.querySelector('.tl-timecode').textContent");
  // Trusted touch: 2 ngón pinch-out trên ruler (tăng zoom)
  const z0 = await ev(
    "Number(document.querySelector('.tl-zoom input[type=range]').value)",
  );
  const cx = geom.x + 50;
  await send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: cx - 40, y: geom.y, id: 1 },
      { x: cx + 40, y: geom.y, id: 2 },
    ],
  });
  for (let i = 1; i <= 5; i++) {
    await send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: cx - 40 - i * 12, y: geom.y, id: 1 },
        { x: cx + 40 + i * 12, y: geom.y, id: 2 },
      ],
    });
    await sleep(50);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
  const z1 = await ev(
    "Number(document.querySelector('.tl-zoom input[type=range]').value)",
  );
  console.log(JSON.stringify({ ph0, ph1, zoomBefore: z0, zoomAfterTouchPinch: z1 }));
  if (ph1 === ph0) {
    failures++;
    console.log("TRUSTED SCRUB: FAIL");
  } else console.log("TRUSTED SCRUB: PASS");
  if (!(z1 > z0)) {
    failures++;
    console.log("TRUSTED PINCH: FAIL");
  } else console.log("TRUSTED PINCH: PASS");
} finally {
  try {
    ws.close();
  } catch {}
  chrome.kill();
}
process.exit(failures ? 1 : 0);

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
import { fileURLToPath } from "node:url";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";
import { distManifest, verifyDistManifest } from "./cdp-dist-freeze.mjs";

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
// Phase 9 đợt 34 Q5 — timeout cho send() + kỷ luật snapshot treo CDP.
// Trước đợt này send() không có timeout, không có reject: nếu Chrome
// treo thì script treo vô hạn không snapshot (nợ từ đợt 32 O2/P3).
// QUYẾT ĐỊNH timeout: 60000ms, bằng mọi harness CDP khác (O3/P2/P5,
// bench/check-proxy). Lệnh touch/CDP bình thường trả lời <1s; 60s đủ
// rộng để không false-positive trên VM chậm, nhưng hữu hạn nên treo
// thật sẽ ghi snapshot rồi reject thay vì treo vô hạn. Tham số
// timeoutMs tùy chọn (mặc định 60000) nên mọi lệnh gọi cũ không đổi.
// LƯU Ý lan truyền lỗi: khối try chính không có catch — reject
// timeout thoát qua finally (đóng ws, kill Chrome) rồi tiến trình
// kết thúc với mã lỗi (unhandled rejection ở top-level module),
// KHÔNG treo lặng. Bundle null chỉ khi không xác định được dist
// (vite dev / dist thiếu) — snapshot ghi bundle.status =
// "not-captured" (xem cdp-snapshot.mjs), nghĩa là "không ghi lại
// được bundle đang đo", không phải "không có bundle chạy"; khi đo
// trên vite preview mặc định thì HANG_BUNDLE (đợt 35 R5) ghi bundle
// thật + dist. outDir bền ngoài repo, ngoài /tmp (mẫu đợt 32 O2).
const CDP_HANG_OUT_DIR = join(homedir(), "workspace", "vcut-cdp-hang-snapshots", "mobile-touch-check");
// Phase 9 đợt 35 R5 — snapshotDist riêng cho harness WS (nợ đợt 34 §3
// mục 5): script đo trên vite preview (mặc định cổng 4173) nên bundle
// đang chạy là apps/web/dist. MOBILE_TOUCH_DIST_DIR cho phép trỏ dist
// khác; nếu không đặt và PREVIEW_URL vẫn là mặc định 4173 và dist
// mặc định có index.html thì dùng dist đó; còn lại (vite dev / dist
// thiếu) giữ bundle null → snapshot ghi "not-captured" như cũ, không
// bịa hash. Bundle tính MỘT LẦN lúc khởi động (trước khi serve đo),
// hash của file entry trong index.html — xem cdp-bundle.mjs. Nếu dist
// bị build đè sau lúc khởi động thì snapshot vẫn giữ hash lúc đầu;
// ghi rõ giới hạn này trong LIMITS R5, không claim "đóng băng dist".
const DEFAULT_DIST_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist");
const HANG_DIST_DIR =
  process.env.MOBILE_TOUCH_DIST_DIR ||
  (PREVIEW_URL === "http://127.0.0.1:4173/" && existsSync(join(DEFAULT_DIST_DIR, "index.html")) ? DEFAULT_DIST_DIR : null);
const HANG_BUNDLE = snapshotBundleFromDist(HANG_DIST_DIR);
if (HANG_BUNDLE) console.log(`[mobile-touch] bundle đang đo: ${HANG_BUNDLE.bundle} sha256[:16]=${HANG_BUNDLE.sha} dist=${HANG_BUNDLE.dist} (source=${HANG_BUNDLE.source})`);
else console.log("[mobile-touch] không xác định được bundle đang đo (vite dev hoặc dist thiếu) — snapshot treo sẽ ghi not-captured");
// Phase 9 đợt 37 T4 — đóng băng dist cho mobile (nợ §3.6 đợt 36: S6
// chưa nối vì "dist không cố định"). Nay điều kiện đã đủ: HANG_DIST_DIR
// chỉ khác null khi (a) operator đặt MOBILE_TOUCH_DIST_DIR, hoặc
// (b) PREVIEW_URL mặc định 4173 và dist mặc định có index.html — tức
// đúng trường hợp vite preview serve dist đó. Khi đó tính manifest
// lúc khởi động, đối chiếu lúc kết thúc (xem cuối file): lệch →
// FROZEN INVALID, kết quả bị loại (failures++, exit 1) như bench
// (exit 3) / seek-o3 (exit 2) theo quy ước riêng của script này.
// CAVEAT như bench: manifest này chỉ là "dist đang đo" khi
// PREVIEW_URL thật sự serve đúng HANG_DIST_DIR đó; khi operator đặt
// MOBILE_TOUCH_DIST_DIR trỏ dist khác với thứ preview đang serve thì
// manifest ghi ra chỉ là "dist trên đĩa lúc bắt đầu đo".
const FROZEN_START = HANG_DIST_DIR ? distManifest(HANG_DIST_DIR) : null;
if (FROZEN_START) console.log(`[mobile-touch] dist đóng băng: ${HANG_DIST_DIR} files=${FROZEN_START.fileCount} manifest=${FROZEN_START.manifestSha256}`);
else console.log("[mobile-touch] frozenDist UNVERIFIED: không xác định được dist (vite dev hoặc dist thiếu) nên không đóng băng được — không claim cùng dist.");
// Phase 9 đợt 35 R5 — timeout cho vòng fetch /json + chờ ws.onopen
// (nợ đợt 34: trước đây fetch không có AbortSignal nên một kết nối
// kẹt có thể treo cả vòng lặp, và ws.onopen chờ vô hạn không có
// onerror/timeout). Mặc định giữ nguyên nhịp vòng lặp cũ (30 lần ×
// ngủ 500ms) và chỉ chặn từng lần fetch tối đa 5000ms (đủ cho
// /json nội bộ, chỉ cắt kết nối kẹt thật); timeout mở socket mặc
// định 30000ms. Cả hai đều chỉnh được qua biến môi trường, và lệnh
// gọi send() cũ không đổi (timeoutMs tùy chọn đã có từ đợt 34 Q5).
const CDP_JSON_ATTEMPT_TIMEOUT_MS = Number(process.env.CDP_JSON_ATTEMPT_TIMEOUT_MS || 5000);
const CDP_WS_OPEN_TIMEOUT_MS = Number(process.env.CDP_WS_OPEN_TIMEOUT_MS || 30000);
function send(method, params = {}, timeoutMs = 60000) {
  const id = nextId++;
  return new Promise((res, rej) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({ proc: chrome, pendingCount: pending.size, method, timeoutMs, outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE, extra: { transport: "websocket", port: PORT, ...(HANG_BUNDLE ? { distDir: HANG_BUNDLE.dist } : {}) } });
          if (hangSnap.file) console.log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else console.log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { console.log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        rej(new Error("cdp timeout " + method));
      }
    }, timeoutMs);
    pending.set(id, { resolve: (v) => { clearTimeout(timer); res(v); }, reject: (e) => { clearTimeout(timer); rej(e); } });
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
      // R5: mỗi lần fetch có AbortSignal riêng — fetch kẹt (server nhận
      // kết nối nhưng không trả) trước đây treo cả vòng lặp vô hạn;
      // nay bị cắt sau CDP_JSON_ATTEMPT_TIMEOUT_MS rồi thử lại như
      // lỗi kết nối thường. Nhịp 30 lần × 500ms giữ nguyên.
      const ctrl = new AbortController();
      const attemptTimer = setTimeout(() => ctrl.abort(), CDP_JSON_ATTEMPT_TIMEOUT_MS);
      try {
        targets = await (await fetch(`http://127.0.0.1:${PORT}/json`, { signal: ctrl.signal })).json();
      } finally {
        clearTimeout(attemptTimer);
      }
      break;
    } catch {
      await sleep(500);
    }
  }
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  // R5: chờ mở socket có timeout + onerror — trước đây chỉ gán
  // onopen nên socket lỗi/không bao giờ mở sẽ treo script vô hạn
  // không snapshot. Hết timeout thì reject lỗi rõ ràng; khối try
  // chính không có catch nên lỗi thoát qua finally (đóng ws, kill
  // Chrome) như hành vi timeout send() từ đợt 34 Q5.
  await new Promise((resolve, reject) => {
    const openTimer = setTimeout(() => reject(new Error("ws open timeout " + CDP_WS_OPEN_TIMEOUT_MS + "ms")), CDP_WS_OPEN_TIMEOUT_MS);
    ws.onopen = () => { clearTimeout(openTimer); resolve(); };
    ws.onerror = (e) => { clearTimeout(openTimer); reject(new Error("ws open error: " + (e?.message || "WebSocket error"))); };
  });
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const entry = pending.get(d.id);
      pending.delete(d.id);
      // R5 (d): CDP trả d.error thì REJECT với lỗi gốc verbatim
      // (JSON.stringify(d.error)), như các harness WS khác (seek-o3,
      // seek-p2, bench, check-proxy) đã làm từ trước. Trước đây
      // mobile resolve(d.result) bất kể d.error nên caller nhận
      // undefined lặng — ví dụ ev() sau đó đọc r.exceptionDetails
      // trên undefined và ném TypeError che mất lỗi CDP gốc.
      if (d.error) entry.reject(new Error(JSON.stringify(d.error)));
      else entry.resolve(d.result);
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
  // Phase 9 đợt 38 U5 — đóng màn chào lần đầu trước khi đo touch.
  // Nguyên nhân FAIL đợt 37 (đã chẩn đoán bằng probe đếm sự kiện,
  // xem docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md §1): trên profile
  // Chrome mới, WelcomeModal (.modal-backdrop) mở sẵn và che toàn bộ
  // điểm chạm trên ruler — elementFromPoint tại điểm scrub trả về
  // DIV.btn-row của modal, pointerdown của CDP/mouse đều không tới
  // ruler (rulerPd=0), còn handler ruler thì lành (PointerEvent JS
  // trực tiếp trên ruler vẫn scrub được). Đây là điều kiện tiên
  // quyết của harness, không phải lỗi handler touch hay CDP: phải
  // đóng modal thì phép đo mới đo đúng ruler. Click backdrop bằng
  // JS (chỉ là bước chuẩn bị, không phải gesture đang đo — scrub /
  // pinch bên dưới vẫn dùng Input.dispatchTouchEvent trusted).
  // Nếu không có modal thì bỏ qua, hành vi cũ không đổi.
  const modalDismissed = await ev(
    "(() => { const b = document.querySelector('.modal-backdrop'); if (!b) return false; b.click(); return true; })()",
  );
  if (modalDismissed) {
    for (let i = 0; i < 60; i++) {
      const gone = await ev("!document.querySelector('.modal-backdrop')");
      if (gone) break;
      await sleep(500);
    }
    console.log("[mobile-touch] đã đóng WelcomeModal trước khi đo touch");
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
// Đợt 37 T4 — đối chiếu đóng băng dist lúc kết thúc (mọi đường đi,
// kể cả đường lỗi: dist đổi giữa chừng thì kết quả bị loại).
if (FROZEN_START) {
  const checked = verifyDistManifest(HANG_DIST_DIR, FROZEN_START);
  console.log(JSON.stringify({ frozenDist: { validity: checked.valid ? "VALID" : "INVALID", valid: checked.valid, problems: checked.problems, distDir: HANG_DIST_DIR, manifestBefore: FROZEN_START.manifestSha256, manifestAfter: checked.manifest.manifestSha256, fileCountBefore: FROZEN_START.fileCount, fileCountAfter: checked.manifest.fileCount, servesDistAssumption: "Manifest này chỉ là dist đang đo khi PREVIEW_URL serve đúng distDir này (vite preview 4173 mặc định hoặc dist do MOBILE_TOUCH_DIST_DIR chỉ định)." } }));
  if (!checked.valid) {
    failures++;
    console.log("FROZEN INVALID: dist đổi giữa chừng — kết quả bị loại");
  }
} else {
  console.log(JSON.stringify({ frozenDist: { validity: "UNVERIFIED", note: "Không xác định được dist nên không đóng băng; kết quả không claim cùng dist." } }));
}
process.exit(failures ? 1 : 0);

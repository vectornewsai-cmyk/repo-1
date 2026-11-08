#!/usr/bin/env node
/**
 * import-1080p-for-bench.mjs — Đợt 52 I9: chuẩn bị asset 1080p cho so sánh FPS proxy on/off.
 *
 * - Mở app (prod 4173) bằng Chrome headless với profile bench CHUNG (/tmp/vcut-fps-r52-profile).
 * - Bước A (proxy ON): bật auto-proxy (localStorage vcut-auto-proxy="1"), import
 *   /tmp/clip1080p.mp4, chờ badge "✓ PROXY 720p", đọc manifest IndexedDB.
 * - Bước B (proxy OFF): tắt auto-proxy ("0"), reload, import /tmp/clip1080p-orig.mp4
 *   (cùng nội dung, tên khác -> asset riêng), chờ item xuất hiện, xác nhận KHÔNG có proxyUrl.
 * - Ghi 2 seed autosave (1 video clip 8s, src = tên file) ra /tmp/vcut-fps-r52-seeds/:
 *   autosave-fps-1080p-proxy.json / autosave-fps-1080p-orig.json.
 * - KHÔNG spawn bridge/vite: giả định bridge 8787 + prod 4173 đã chạy (kiểm tra trước).
 * - KHÔNG đưa file nào vào repo: clip 1080p chỉ nằm ở /tmp, seed chỉ nằm ở /tmp.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const URL = arg("--url", "http://127.0.0.1:4173");
const PROFILE = arg("--profile", "/tmp/vcut-fps-r52-profile");
const SEEDS_DIR = "/tmp/vcut-fps-r52-seeds";
const CHROME = process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const FILES = {
  proxy: "/tmp/clip1080p.mp4",
  orig: "/tmp/clip1080p-orig.mp4",
};

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.addEventListener("message", (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  ready() {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("ws open timeout 30000ms")), 30000);
      this.ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
      this.ws.addEventListener("error", (e) => { clearTimeout(t); reject(e); }, { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(res.exceptionDetails)}`);
    return res.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

const READ_MANIFESTS = `new Promise((res, rej) => {
  const req = indexedDB.open('vcut-studio-assets', 1);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(['manifests'], 'readonly');
    const all = tx.objectStore('manifests').getAll();
    // Manifest KHONG co field name/proxyUrl: ten file la originalName,
    // proxyUrl chi song trong store bo nho (xem measure-1080p-proxy.mjs).
    all.onsuccess = () => res(all.result.map(m => ({ assetId: m.assetId, originalName: m.originalName, kind: m.kind, width: m.width, height: m.height, duration: m.duration })));
    all.onerror = () => rej(all.error);
  };
  req.onerror = () => rej(req.error);
})`;

function makeSeed(template, projectName, fileName) {
  const s = JSON.parse(JSON.stringify(template));
  s.name = projectName;
  if (s.spec?.meta) s.spec.meta.name = projectName;
  s.spec.tracks = [{
    kind: "video", id: "v1",
    clips: [{ kind: "video", id: "c_1080p", src: fileName, start: 0, duration: 8, in: 0, out: 8 }],
  }];
  s.savedAt = Date.now();
  return s;
}

async function main() {
  for (const f of Object.values(FILES)) if (!fs.existsSync(f)) { console.error(`Thiếu file: ${f}`); process.exit(2); }
  if (!fs.existsSync(CHROME)) { console.error(`Thiếu Chromium: ${CHROME}`); process.exit(2); }
  const template = JSON.parse(fs.readFileSync("/tmp/vcut-fps-r52-autosave-light.json", "utf8"));
  const dbgPort = 19000 + (process.pid % 1000);
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
    "--autoplay-policy=no-user-gesture-required", "--window-size=1440,900",
    `--remote-debugging-port=${dbgPort}`, `--user-data-dir=${PROFILE}`], { stdio: "ignore" });
  let cdp = null;
  try {
    let targets = [];
    for (let i = 0; i < 30 && targets.length === 0; i++) {
      await sleep(1000);
      try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); } catch { /* chưa lên */ }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Không lấy được target page.");
    cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: URL + "/" });
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Editor chưa sẵn sàng sau 90s.");

    async function importFile(filePath, autoProxyOn) {
      await cdp.evaluate(`localStorage.setItem('vcut-auto-proxy', '${autoProxyOn ? "1" : "0"}')`);
      await cdp.send("Page.navigate", { url: URL + "/" });
      // Đợt 52 I9: chờ MediaBin mount xong (trước đây sleep cố định 1.5s
      // nên query input thất bại vì panel chưa render).
      let mounted = false;
      for (let i = 0; i < 30 && !mounted; i++) {
        await sleep(1000);
        mounted = await cdp.evaluate(`!!document.querySelector('.mediabin') && !!document.querySelector('.tbtn.play')`);
      }
      if (!mounted) throw new Error("MediaBin chưa mount sau 30s.");
      const checked = await cdp.evaluate(
        `[...document.querySelectorAll('label')].find(l => l.textContent.includes('Tự tạo proxy'))?.querySelector('input')?.checked ?? null`);
      console.log(`[import] auto-proxy=${autoProxyOn} checkbox=${checked} file=${path.basename(filePath)}`);
      const doc = await cdp.send("DOM.getDocument", { depth: 0 });
      const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type='file']" });
      if (!q.nodeId) throw new Error("Không tìm thấy input file của MediaBin.");
      await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [filePath] });
      return path.basename(filePath);
    }

    // Bước A: proxy ON
    const nameA = await importFile(FILES.proxy, true);
    let okA = false;
    for (let i = 0; i < 60 && !okA; i++) {
      await sleep(2000);
      const text = await cdp.evaluate(`document.body.innerText || ''`);
      if (text.includes("✓ PROXY 720p")) okA = true;
      else if (text.includes("Proxy lỗi")) throw new Error("Proxy lỗi khi tạo cho clip1080p.mp4");
    }
    if (!okA) throw new Error("Hết 120s vẫn chưa thấy PROXY 720p cho clip1080p.mp4");
    let manifests = await cdp.evaluate(READ_MANIFESTS);
    const mA = manifests.find((m) => m.originalName === nameA);
    console.log(`[import] A manifest: ${JSON.stringify(mA)}`);
    if (!mA) throw new Error("Manifest A không có.");
    // Proxy KHÔNG nằm trong manifest: xác nhận qua badge DOM đã thấy ở trên.
    const seedA = makeSeed(template, "FPS-1080p-proxy", nameA);
    fs.writeFileSync(path.join(SEEDS_DIR, "autosave-fps-1080p-proxy.json"), JSON.stringify(seedA));
    console.log(`[import] seed A ghi: ${path.join(SEEDS_DIR, "autosave-fps-1080p-proxy.json")}`);

    // Bước B: proxy OFF — file tên khác để thành asset riêng
    const nameB = await importFile(FILES.orig, false);
    let seenB = false;
    for (let i = 0; i < 30 && !seenB; i++) {
      await sleep(1000);
      const text = await cdp.evaluate(`document.body.innerText || ''`);
      if (text.includes(nameB)) seenB = true;
    }
    if (!seenB) throw new Error("Không thấy item clip1080p-orig.mp4 sau 30s.");
    await sleep(8000); // chờ settle: nếu auto-proxy vô tình bật thì badge proxy sẽ hiện
    manifests = await cdp.evaluate(READ_MANIFESTS);
    const mB = manifests.find((m) => m.originalName === nameB);
    console.log(`[import] B manifest: ${JSON.stringify(mB)}`);
    if (!mB) throw new Error("Manifest B không có.");
    // Proxy OFF: xác nhận qua nút Proxy của item B KHÔNG hiện "✓ PROXY".
    const badgeB = await cdp.evaluate(`(() => { const b = document.querySelector('[aria-label="Tạo proxy cho ${nameB}"]'); return b ? b.textContent.trim() : null; })()`);
    if (badgeB && badgeB.includes("✓ PROXY")) throw new Error("Item B có proxy dù auto-proxy đã tắt.");
    const seedB = makeSeed(template, "FPS-1080p-gốc", nameB);
    fs.writeFileSync(path.join(SEEDS_DIR, "autosave-fps-1080p-orig.json"), JSON.stringify(seedB));
    console.log(`[import] seed B ghi: ${path.join(SEEDS_DIR, "autosave-fps-1080p-orig.json")}`);
    console.log("[import] XONG: proxy A ok, orig B ok.");
  } catch (e) {
    console.error(`[import] LỖI: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  } finally {
    try { cdp?.close(); } catch { /* noop */ }
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
  }
}
main();

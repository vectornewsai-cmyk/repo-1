#!/usr/bin/env node
/**
 * clicktest-ship-full.mjs — Phase 9 đợt 83, luồng K7: CLICK-TEST GÓI
 * AppImage VCut Studio THẬT (profile full) dưới Xvfb, qua CDP.
 *
 * Khác smoke của package-ship.mjs (chỉ mount UI + bridge healthy + quit):
 * luồng này lái UI thật bằng chuột/CDP: mở app → UI mount → import 1 clip
 * mẫu → thêm vào timeline → preview play → export MP4 qua UI → thoát sạch.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/desktop/scripts/clicktest-ship-full.mjs
 * Env: K7_APPIMAGE (mặc định ~/workspace/tmp-j8-electron/ship/ship-full/
 *   vcut-studio-0.1.0-x86_64.AppImage), K7_WORK (mặc định
 *   ~/workspace/tmp-k7-clicktest), K7_CLIP (mặc định
 *   server/render/examples/media/clip1.mp4 — h264 1280x720, 8s),
 *   K7_CDP_PORT (mặc định 9222), K7_BRIDGE_PORT (mặc định 8787).
 * Exit 0 mọi case PASS, 1 có FAIL. Report JSON + screenshot ở K7_WORK.
 *
 * Mẫu CDP (WebSocket global của Node, click chuột thật, setFileInputFiles)
 * kế thừa apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs (J10)
 * nhưng KHÔNG dùng vite/store import (gói production không có /src/*):
 * đọc state qua DOM + localStorage autosave (vcut-studio:autosave:v1).
 * Export verify độc lập từ Node: GET /api/render/:id?detail=1 rồi GET
 * /api/render/:id/download → ffprobe file thật (không bấm nút tải MP4
 * của UI vì trên Electron nó có thể mở dialog native).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../web/scripts/eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const HOME = os.homedir();
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WORK = process.env.K7_WORK || path.join(HOME, "workspace", "tmp-k7-clicktest");
const APPIMAGE = process.env.K7_APPIMAGE
  || path.join(HOME, "workspace", "tmp-j8-electron", "ship", "ship-full", "vcut-studio-0.1.0-x86_64.AppImage");
const CLIP = process.env.K7_CLIP || path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
const CLIP_NAME = path.basename(CLIP);
const CDP_PORT = Number(process.env.K7_CDP_PORT || 9222);
const BRIDGE_PORT = Number(process.env.K7_BRIDGE_PORT || 8787);
// ROUND85-M9: cổng bridge THẬT đọc từ bridge.pid.json ở K3 (serviceManager
// bỏ qua env BRIDGE_PORT — chỉ đọc opts.preferredPort || 8787 rồi scan
// 8787..8796 khi bận; luồng khác giữ 8787 thì bridge rơi xuống 8788+).
// Mọi URL render/download sau K3 đều dùng bridgePort, không dùng hằng số.
let bridgePort = BRIDGE_PORT;
const MODELS_DIR = path.join(HOME, "workspace", "tmp-j8-electron", "ship", "models");
const SHOTS = path.join(WORK, "shots");
const USERDATA = path.join(WORK, "userdata");
const TMP_RUN = path.join(WORK, "tmp-run");
const K7_DISPLAY_NUM = Number(process.env.K7_DISPLAY || 97);
const EXPORT_DEST = path.join(WORK, "export-ui.mp4");
// ROUND83-K7 (lần chạy 12): XTEST typer — gõ đường dẫn đích vào hộp
// thoại lưu file NATIVE của Electron (GTK save dialog) mà CDP không
// chạm tới được. Dùng libX11/libXtst qua ctypes (có sẵn trên VM, đã
// kiểm chứng).
// ROUND84-L1 (chẩn đoán bằng probe dialog 11/11): dialog GTK là cửa sổ
// top-level MỚI, map=Viewable, ~1124x822, NHƯNG XFetchName trả "" (title
// nằm ở _NET_WM_NAME, không phải WM_NAME) — chọn cửa sổ theo TÊN nên
// lần 12–14 toàn gõ nhầm vào cửa sổ tiện ích "vcut-studio" 2x2/Unmapped
// → XSetInputFocus BadMatch, phím gõ đi lạc, không job nào chạy (ảnh
// xshot-after-click đã thấy dialog mở với tên file "Du an mau.mp4").
// Từ nay: lệnh "tree" liệt kê kèm map_state + kích thước; chỉ gõ vào
// cửa sổ MỚI, Viewable, rộng ≥400px; "type" kiểm tra lại focus thật
// bằng XGetInputFocus, focus sai thì KHÔNG gõ mù mà báo FOCUS_FAIL.
const XTEST_DIALOG_PY = `import sys, time, os, ctypes
from ctypes import c_void_p, c_int, c_ulong, c_char_p, POINTER, byref
x11 = ctypes.CDLL("libX11.so.6")
# ROUND85-M9: libXtst.so.6 KHONG co san he thong tren VM nay (ldconfig
# khong thay; apt khong tim thay goi libxtst6) — dong CDLL chet ngay voi
# OSError nen khong go duoc dialog. Fallback: dung ban libXtst bundle
# trong chinh AppImage (usr/lib/libXtst.so.6; deps libX11/libXext cua no
# deu co san he thong) qua env XTST_LIB do harness trich ra o K1 bang
# --appimage-extract.
try:
    xtst = ctypes.CDLL("libXtst.so.6")
except OSError:
    _xtst_path = os.environ.get("XTST_LIB")
    if not _xtst_path: raise
    print(f"XTST_FALLBACK {_xtst_path}")
    xtst = ctypes.CDLL(_xtst_path)
x11.XOpenDisplay.restype = c_void_p; x11.XOpenDisplay.argtypes = [c_char_p]
x11.XStringToKeysym.restype = c_ulong; x11.XStringToKeysym.argtypes = [c_char_p]
x11.XKeysymToKeycode.restype = ctypes.c_ubyte; x11.XKeysymToKeycode.argtypes = [c_void_p, c_ulong]
x11.XFetchName.restype = c_int; x11.XFetchName.argtypes = [c_void_p, c_ulong, POINTER(c_char_p)]
x11.XQueryTree.restype = c_int
x11.XSetInputFocus.restype = c_int; x11.XSetInputFocus.argtypes = [c_void_p, c_ulong, c_int, c_ulong]
x11.XGetInputFocus.restype = c_int; x11.XGetInputFocus.argtypes = [c_void_p, POINTER(c_ulong), POINTER(c_int)]
class XWindowAttributes(ctypes.Structure):
    _fields_ = [("x", c_int), ("y", c_int), ("width", c_int), ("height", c_int),
        ("border_width", c_int), ("depth", c_int), ("visual", c_void_p), ("root", c_ulong),
        ("class", c_int), ("bit_gravity", c_int), ("win_gravity", c_int), ("backing_store", c_int),
        ("backing_planes", c_ulong), ("backing_pixel", c_ulong), ("save_under", c_int),
        ("colormap", c_ulong), ("map_installed", c_int), ("map_state", c_int),
        ("all_event_masks", c_ulong), ("your_event_mask", c_ulong),
        ("do_not_propagate_mask", c_ulong), ("override_redirect", c_int), ("screen", c_void_p)]
x11.XGetWindowAttributes.restype = c_int
x11.XGetWindowAttributes.argtypes = [c_void_p, c_ulong, POINTER(XWindowAttributes)]
d = x11.XOpenDisplay(sys.argv[1].encode())
if not d: print("XOPEN_FAIL"); sys.exit(2)
# ROUND84-L1: chặn handler lỗi mặc định của Xlib (in BadWindow ra stderr)
# — cửa sổ dialog bị huỷ sau khi bấm Save là trạng thái ĐÓNG bình thường,
# không phải lỗi; handler im lặng để stderr không lẫn lỗi giả.
ERR_HANDLER = ctypes.CFUNCTYPE(c_int, c_void_p, c_void_p)(lambda disp, err: 0)
x11.XSetErrorHandler.restype = c_void_p; x11.XSetErrorHandler.argtypes = [c_void_p]
x11.XSetErrorHandler(ERR_HANDLER)
root = x11.XDefaultRootWindow(d)
MAP = {0: "Unmapped", 1: "Unviewable", 2: "Viewable"}
def list_windows():
    r, p, ch, n = c_ulong(), c_ulong(), POINTER(c_ulong)(), c_int()
    x11.XQueryTree(d, root, byref(r), byref(p), byref(ch), byref(n))
    out = []
    for i in range(n.value):
        w = ch[i]; name = c_char_p()
        nm = ""
        if x11.XFetchName(d, w, byref(name)) and name.value:
            nm = name.value.decode("utf-8", "replace"); x11.XFree(name)
        attr = XWindowAttributes()
        ms, xx, yy, ww, hh = "?", 0, 0, 0, 0
        if x11.XGetWindowAttributes(d, w, byref(attr)):
            ms = MAP.get(attr.map_state, "?"); xx = attr.x; yy = attr.y; ww = attr.width; hh = attr.height
        out.append((w, nm, ms, xx, yy, ww, hh))
    if ch: x11.XFree(ch)
    return out
if sys.argv[2] == "snapshot":
    for w, nm, ms, xx, yy, ww, hh in list_windows(): print(f"WIN {w} {nm}")
    sys.exit(0)
if sys.argv[2] == "tree":
    for w, nm, ms, xx, yy, ww, hh in list_windows(): print(f"WIN {w} map={ms} x={xx} y={yy} w={ww} h={hh} name={nm}")
    sys.exit(0)
winid, text = int(sys.argv[3]), sys.argv[4]
x11.XSetInputFocus(d, winid, 2, 0); x11.XFlush(d); time.sleep(0.5)
focus = c_ulong(); revert = c_int()
x11.XGetInputFocus(d, byref(focus), byref(revert))
if focus.value != winid:
    print(f"FOCUS_FAIL focus={focus.value} want={winid}"); sys.exit(3)
# ROUND84-L1: XStringToKeysym KHÔNG đổi được ký tự dấu câu đơn lẻ
# ("/", "-", ".", "_" đều trả keysym 0x0 → keycode 204 vô nghĩa → phím
# rơi lặng; bằng chứng: lần chạy 15 gõ "/home/.../export-ui.mp4" thành
# "homehatchworkspacetmpk7clicktestexportuimp4.mp4" — mất hết "/" và "-").
# Map dấu câu sang TÊN keysym ("slash", "minus"...) thì XKeysymToKeycode
# mới trả đúng keycode (slash=61, minus=20, period=60).
KEYSYM_NAMES = {"/": "slash", "-": "minus", ".": "period", "_": "underscore",
    ":": "colon", ";": "semicolon", ",": "comma", "=": "equal", "+": "plus",
    " ": "space", "(": "parenleft", ")": "parenright", "[": "bracketleft",
    "]": "bracketright", "{": "braceleft", "}": "braceright", "'": "apostrophe",
    '"': "quotedbl", "\\\\": "backslash", "|": "bar", "<": "less", ">": "greater",
    "?": "question", "!": "exclam", "@": "at", "#": "numbersign", "$": "dollar",
    "%": "percent", "^": "asciicircum", "&": "ampersand", "*": "asterisk",
    "~": "asciitilde"}
def keysym(s): return x11.XStringToKeysym(KEYSYM_NAMES.get(s, s).encode())
def press(ks):
    kc = x11.XKeysymToKeycode(d, ks)
    xtst.XTestFakeKeyEvent(d, kc, 1, 0); x11.XFlush(d); time.sleep(0.02)
    xtst.XTestFakeKeyEvent(d, kc, 0, 0); x11.XFlush(d); time.sleep(0.02)
# ROUND84-L1 (lần chạy 16): Enter trong ô Name/location KHÔNG đóng
# dialog GTK (đã đo: gõ đúng path rồi mà dialog vẫn mở, panel không đổi).
# ROUND85-M9 (probe 6 biến thể, mỗi biến thể 1 instance app thật, kèm cây
# X + ảnh chụp màn hình thật): Enter KHÔNG đóng dialog trong MỌI trường
# hợp — tên-file + Return, full-path + Return (lặp L1 lần 16), full-path
# + Tab + Return, full-path + Tab x12 + Space, full-path + Ctrl+S,
# full-path + Return x2 — tất cả STILL_OPEN (ô Name vẫn focus, text gõ
# đúng, không job nào chạy; sau 12 Tab focus vẫn ở ô Name). Đây là hành
# vi CHUẨN của GTK file chooser, KHÔNG PHẢI lỗi app: dialog là Electron
# showSaveDialog native (main.ts), app không có cách nào lắng nghe phím
# bên trong dialog. Luồng đúng DUY NHẤT là click nút Save (đã có bên
# dưới); phím Return ở đây chỉ là no-op vô hại, giữ lại để ghi rõ đã thử.
# Trình tự mới: Ctrl+A chọn hết tên mặc định (kẻo ".mp4" cũ còn sót thành
# "export-ui.mp4.mp4") → gõ full path → Enter → CLICK nút Save bằng
# XTest (nút ở góc dưới-phải dialog: đo thật 3 lần đều 1124x822 tại
# (0,0), nút Save tâm ≈ (rộng-33, cao-23) tính từ góc dialog). Xong
# kiểm tra dialog đã đóng chưa (map_state) mới báo TYPED_OK.
x11.XWarpPointer.restype = c_int; x11.XWarpPointer.argtypes = [c_void_p, c_ulong, c_ulong, c_int, c_int, c_int, c_int, c_int, c_int]
xtst.XTestFakeButtonEvent.restype = c_int; xtst.XTestFakeButtonEvent.argtypes = [c_void_p, c_int, c_int, c_ulong]
ctrl = keysym("Control_L")
kc = x11.XKeysymToKeycode(d, ctrl)
xtst.XTestFakeKeyEvent(d, kc, 1, 0); x11.XFlush(d)
press(keysym("a"))
xtst.XTestFakeKeyEvent(d, kc, 0, 0); x11.XFlush(d)
time.sleep(0.3)
for ch in text: press(keysym(ch))
press(keysym("Return"))
time.sleep(0.5)
attr = XWindowAttributes()
if x11.XGetWindowAttributes(d, winid, byref(attr)):
    sx, sy = attr.x + attr.width - 40, attr.y + attr.height - 23
    x11.XWarpPointer(d, 0, root, 0, 0, 0, 0, sx, sy); x11.XFlush(d); time.sleep(0.3)
    xtst.XTestFakeButtonEvent(d, 1, 1, 0); x11.XFlush(d); time.sleep(0.1)
    xtst.XTestFakeButtonEvent(d, 1, 0, 0); x11.XFlush(d); time.sleep(1.0)
    print(f"SAVE_CLICK x={sx} y={sy}")
else:
    print("SAVE_CLICK_FAIL no-geometry")
time.sleep(0.5)
attr2 = XWindowAttributes()
ok2 = x11.XGetWindowAttributes(d, winid, byref(attr2))
# Cửa sổ đã bị huỷ (GetWindowAttributes trả 0 / BadWindow) = dialog ĐÃ
# đóng sau khi bấm Save — đó là thành công, không phải "vẫn mở" (lỗi
# logic ở lần chạy 17: helper báo sai khiến harness thử lại vô ích).
closed = (not ok2) or MAP.get(attr2.map_state, "?") != "Viewable"
print("TYPED_OK" if closed else "DIALOG_STILL_OPEN"); x11.XCloseDisplay(d)
`;
const XTEST_PY = path.join(WORK, "xtest-dialog.py");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

async function httpJson(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, text }; }
  } finally { clearTimeout(t); }
}

async function portFree(port) {
  return new Promise((res) => {
    const s = net.createServer();
    s.once("error", () => res(false));
    s.once("listening", () => s.close(() => res(true)));
    s.listen(port, "127.0.0.1");
  });
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
      }
      // ROUND83-K7 (sửa sau lần chạy 5): THIẾU khối này nên mọi send()
      // đều timeout 60s dù browser đã trả lời — response tới nhưng không
      // ai resolve pending. Khối này kế thừa từ J10 (mẫu CDP gốc).
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async setFileInput(files, selectors) {
    await this.send("DOM.enable");
    const doc = await this.send("DOM.getDocument", { depth: -1 });
    for (const sel of selectors) {
      const q = await this.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: sel });
      if (q.nodeId) {
        await this.send("DOM.setFileInputFiles", { files, nodeId: q.nodeId });
        return sel;
      }
    }
    throw new Error(`không tìm thấy input file (đã thử: ${selectors.join(" | ")})`);
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x: Math.round(x), y: Math.round(y), ...extra });
  }
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code) {
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyUp" });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileEpermRetry(path.join(SHOTS, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__k7errors = [];
  window.addEventListener("error", (e) => { try { window.__k7errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__k7errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__k7errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__k7errors.push("unhandledrejection: <?>"); } });
  window.__k7boot = Math.random().toString(36).slice(2);
})()`;

// State thật qua DOM + autosave localStorage (không import store —
// gói production không có /src/* như vite dev).
const STATE_FN = `(() => {
  const raw = localStorage.getItem("vcut-studio:autosave:v1");
  let auto = null;
  try { auto = raw ? JSON.parse(raw) : null; } catch (e) { auto = { error: String(e) }; }
  let clipCount = 0; let srcs = [];
  if (auto && auto.spec && Array.isArray(auto.spec.tracks)) {
    for (const t of auto.spec.tracks) for (const c of t.clips || []) { clipCount++; if (c.src) srcs.push(c.src); }
  }
  const binMedia = auto && Array.isArray(auto.binMedia) ? auto.binMedia.map((e) => e.name) : null;
  return {
    rootChildren: document.querySelector("#root") ? document.querySelector("#root").children.length : -1,
    textLen: document.body ? document.body.innerText.length : 0,
    title: document.title, url: location.href,
    bridgeUrl: typeof window.__VCUT_BRIDGE_URL__ === "string" ? window.__VCUT_BRIDGE_URL__ : null,
    mediaNames: [...document.querySelectorAll(".media-card .media-name")].map((e) => e.textContent),
    mediaCards: document.querySelectorAll(".media-card").length,
    tlClips: document.querySelectorAll(".tl-clip").length,
    clipCount, srcs, binMedia,
    timeDisplay: (document.querySelector(".time-display") || {}).textContent || null,
    playing: (document.querySelector(".tbtn.play") || {}).getAttribute ? document.querySelector(".tbtn.play").getAttribute("aria-pressed") : null,
    videos: [...document.querySelectorAll("video")].map((v) => ({ t: +v.currentTime.toFixed(3), paused: v.paused, src: (v.currentSrc || "").slice(0, 60) })),
    errors: (window.__k7errors || []).slice(),
  };
})()`;

const CARD_BTN_FN = (name, cls) => `(() => {
  const cards = [...document.querySelectorAll(".media-card")];
  const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === ${JSON.stringify(name)});
  if (!card) return null;
  const btn = card.querySelector(${JSON.stringify(cls)});
  if (!btn) return null;
  btn.scrollIntoView({ block: "nearest" });
  const b = btn.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, name: ${JSON.stringify(name)} };
})()`;

const BTN_BY_TEXT_FN = (text) => `(() => {
  const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes(${JSON.stringify(text)}));
  if (!b) return null;
  b.scrollIntoView({ block: "nearest" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim().slice(0, 80), disabled: b.disabled, title: b.title || null };
})()`;

const CLICK_SELECTOR_FN = (selector) => `(() => {
  const b = document.querySelector(${JSON.stringify(selector)});
  if (!b) return null;
  b.scrollIntoView({ block: "nearest" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: !!b.disabled };
})()`;

async function main() {
  const results = [];
  const EXPECTED_STEPS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8"];
  let fatalError = null;
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(TMP_RUN, { recursive: true });
  // ROUND84-L1: xoá đích export cũ trước mỗi lần chạy — kẻo dialog GTK
  // hỏi "Replace?" (hộp xác nhận thứ hai) khi file đã tồn tại.
  fs.rmSync(EXPORT_DEST, { force: true });
  if (!fs.existsSync(APPIMAGE)) { console.error(`không thấy AppImage ${APPIMAGE}`); process.exit(2); }
  if (!fs.existsSync(CLIP)) { console.error(`không thấy clip mẫu ${CLIP}`); process.exit(2); }
  const clipSize = fs.statSync(CLIP).size;
  const appSha = (await import("node:crypto")).createHash("sha256").update(fs.readFileSync(APPIMAGE)).digest("hex");
  log(`AppImage: ${APPIMAGE} (${fs.statSync(APPIMAGE).size} byte, sha256 ${appSha.slice(0, 16)}…)`);
  log(`Clip mẫu: ${CLIP} (${clipSize} byte)`);

  let app = null;
  let appLog = "";
  const pidfile = () => {
    const p = path.join(USERDATA, "bridge.pid.json");
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
  };
  const pidAlive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch { return false; } };
  const killAppGroup = (sig) => { try { if (app && app.pid) process.kill(-app.pid, sig); } catch { /* đã chết */ } };

  const cleanup = () => { try { if (app && pidAlive(app.pid)) killAppGroup("SIGKILL"); } catch {} try { if (xvfb && pidAlive(xvfb.pid)) xvfb.kill("SIGKILL"); } catch {} };
  process.on("exit", cleanup);
  let xvfb = null;

  try {
    // ---- K1: mở app thật qua CDP ----
    // ROUND83-K7 (lần chạy 12): chạy Xvfb CỐ ĐỊNH (:97) thay cho
    // xvfb-run -a — để helper XTEST biết DISPLAY nào mà gõ phím vào
    // hộp thoại lưu file native.
    writeFileEpermRetry(XTEST_PY, XTEST_DIALOG_PY);
    // ROUND85-M9: trích libXtst.so.6 từ chính AppImage (fallback khi hệ
    // thống thiếu libXtst — VM này thiếu; xem đầu XTEST_DIALOG_PY). Chỉ
    // trích 1 file (không giải nén cả AppImage), đặt tại
    // WORK/squashfs-root/usr/lib/libXtst.so.6; python thử lib hệ thống
    // trước, chỉ dùng file này khi CDLL hệ thống lỗi.
    let xtstLib = null;
    try {
      spawnSync(APPIMAGE, ["--appimage-extract", "usr/lib/libXtst.so.6"], { encoding: "utf8", timeout: 120000, cwd: WORK });
      const cand = path.join(WORK, "squashfs-root", "usr", "lib", "libXtst.so.6");
      if (fs.existsSync(cand)) { xtstLib = cand; log(`libXtst fallback: ${xtstLib}`); }
      else log("libXtst: --appimage-extract không tạo file (sẽ dùng lib hệ thống nếu có)");
    } catch (e) { log(`libXtst: trích từ AppImage thất bại (${e.message}) — sẽ dùng lib hệ thống nếu có`); }
    const xtestEnv = () => ({ ...process.env, ...(xtstLib ? { XTST_LIB: xtstLib } : {}) });
    fs.rmSync(USERDATA, { recursive: true, force: true });
    if (!(await portFree(CDP_PORT))) throw new Error(`cổng CDP ${CDP_PORT} đang bận trước khi mở app`);
    xvfb = spawn("Xvfb", [`:${K7_DISPLAY_NUM}`, "-screen", "0", "1920x1080x24"], { stdio: "ignore" });
    for (let i = 0; i < 30; i++) { if (fs.existsSync(`/tmp/.X${K7_DISPLAY_NUM}-lock`)) break; await sleep(1000); }
    if (!fs.existsSync(`/tmp/.X${K7_DISPLAY_NUM}-lock`)) throw new Error(`Xvfb :${K7_DISPLAY_NUM} không lên sau 30s`);
    app = spawn(APPIMAGE, [`--user-data-dir=${USERDATA}`, "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`], {
      detached: true,
      env: { ...process.env, DISPLAY: `:${K7_DISPLAY_NUM}`, APPIMAGE_EXTRACT_AND_RUN: "1", VCUT_MODELS_DIR: MODELS_DIR, TMPDIR: TMP_RUN },
    });
    app.stdout.on("data", (d) => { appLog += String(d); });
    app.stderr.on("data", (d) => { appLog += String(d); });
    log(`đã spawn AppImage pid=${app.pid} (Xvfb :${K7_DISPLAY_NUM}), chờ CDP ${CDP_PORT}…`);
    const t0 = Date.now();
    let version = null;
    while (Date.now() - t0 < 240000) {
      try { const r = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/version`, 3000); if (r.json && r.json.Browser) { version = r.json; break; } } catch { /* chưa lên */ }
      if (app.exitCode !== null) throw new Error(`app thoát sớm (code ${app.exitCode}) trước khi CDP lên; log: ${appLog.slice(-2000)}`);
      await sleep(2000);
    }
    if (!version) { fail("K1 mở app + CDP lên", `CDP ${CDP_PORT} không trả /json/version sau 240s; appLog đuôi: ${appLog.slice(-1500)}`); throw new Error("K1 fail"); }
    const targets = (await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 5000)).json;
    const page = (targets || []).find((x) => x.type === "page" && (x.url || "").startsWith("app://vcut"));
    if (!page || !page.webSocketDebuggerUrl) { fail("K1 mở app + CDP lên", `không tìm thấy page app://vcut trong ${(targets || []).length} target: ${JSON.stringify((targets || []).map((x) => x.url))}`); throw new Error("K1 fail"); }
    pass("K1 mở app + CDP lên", `Browser ${version.Browser}, page ${page.url}, CDP sau ${Math.round((Date.now() - t0) / 1000)}s`);
    const cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.ready;
    // ROUND83-K7 (sửa sau lần chạy 2): Page.enable từng timeout 60s khi
    // VM tải cao (renderer bận load UI + deep probe) — thử lại tối đa 3
    // lần, cách nhau 10s, thay vì chết ngay lần đầu.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await cdp.send("Page.enable");
        await cdp.send("Runtime.enable");
        break;
      } catch (e) {
        log(`CDP enable lần ${attempt}/3 fail: ${e.message}`);
        if (attempt === 3) throw e;
        await sleep(10000);
      }
    }
    await cdp.evalJs(INJECT_ERRORS).catch(() => {});

    // ROUND83-K7 (sửa sau lần chạy 7): modal chào mừng có thể hiện MUỘN
    // (sau K2) nên chỉ đóng 1 lần sau K2 là không đủ — lần chạy 7: modal
    // vẫn mở ở K4, click "+ Thêm" ở K5 rơi vào backdrop (đóng modal thay
    // vì thêm clip) → timeout .tl-clip. Từ nay gọi ensureNoModal() trước
    // MỖI bước tương tác (K4/K5/K6/K7), kiểm tra modal thật sự biến mất.
    const ensureNoModal = async () => {
      for (let i = 0; i < 5; i++) {
        const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`).catch(() => false);
        if (!open) return true;
        await cdp.evalJs(`(() => {
          const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Để sau");
          if (b) { b.click(); return "de-sau"; }
          const x = document.querySelector(".welcome-modal .icon-btn, .modal-backdrop .icon-btn");
          if (x) { x.click(); return "x"; }
          const bd = document.querySelector(".modal-backdrop");
          if (bd) { bd.click(); return "backdrop"; }
          return null;
        })()`).catch(() => {});
        await sleep(800);
      }
      const stillOpen = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`).catch(() => false);
      return !stillOpen;
    };
    const dismissModal = ensureNoModal;

    // ---- K2: UI mount ----
    try {
      const st = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(STATE_FN);
        return s.rootChildren > 0 && s.textLen > 300 ? s : null;
      }, "UI mount (#root>0, textLen>300)", 120000);
      await dismissModal();
      await cdp.shot("k7-k2-mounted.png");
      pass("K2 UI mount", `#root ${st.rootChildren} con, textLen=${st.textLen}, title="${st.title}", url=${st.url}`);
    } catch (e) { await cdp.shot("k7-k2-fail.png").catch(() => {}); fail("K2 UI mount", String(e.message || e)); throw e; }

    // ---- K3: bridge healthy từ renderer ----
    // ROUND83-K7 (sửa sau lần chạy 6): K3 cũ check bridge NGAY sau khi UI
    // mount (~9s sau spawn) — bridge mới spawn xong, chưa healthy (manager
    // còn chờ health + deep probe) → fetch fail oan. Từ nay poll Node GET
    // /api/health tới 180s TRƯỚC, rồi mới fetch từ renderer.
    try {
      const t0h = Date.now();
      // ROUND85-M9: đọc cổng bridge THẬT từ bridge.pid.json (app ghi sau
      // khi spawn bridge). Lần trước check cứng 8787 trong khi bridge
      // thật ở 8788 (8787 bị luồng khác giữ) → K3 fail oan sau 180s.
      let pfPort = null;
      while (Date.now() - t0h < 120000 && !pfPort) {
        const pf = pidfile();
        if (pf && pf.port) { pfPort = Number(pf.port); log(`K3: bridge.pid.json — bridge pid=${pf.pid} port=${pfPort}`); }
        else await sleep(2000);
      }
      if (!pfPort) throw new Error("không đọc được bridge.pid.json sau 120s (bridge chưa spawn?)");
      bridgePort = pfPort;
      let nodeHealth = null;
      while (Date.now() - t0h < 300000) {
        const r = await httpJson(`http://127.0.0.1:${bridgePort}/api/health`, 5000).catch(() => null);
        if (r && r.json && r.json.ok === true) { nodeHealth = r; break; }
        await sleep(2000);
      }
      if (!nodeHealth) throw new Error(`bridge không healthy sau 300s (Node GET /api/health, port ${bridgePort})`);
      const b = await cdp.evalJs(`(async () => {
        const base = (typeof window.__VCUT_BRIDGE_URL__ === "string" && window.__VCUT_BRIDGE_URL__) || ${JSON.stringify(`http://127.0.0.1:${bridgePort}`)};
        try { const r = await fetch(base + "/api/health"); const j = await r.json(); return { base, ok: j.ok === true, status: r.status }; }
        catch (e) { return { base, ok: false, error: String(e && e.message || e) }; }
      })()`);
      if (b.ok) pass("K3 bridge healthy từ renderer", `bridge healthy sau ${Math.round((Date.now() - t0h) / 1000)}s; fetch ${b.base}/api/health → ok:true (HTTP ${b.status}); Node GET cũng ok=true`);
      else { fail("K3 bridge healthy từ renderer", `renderer fetch → ${JSON.stringify(b)}; Node GET → ok=true sau ${Math.round((Date.now() - t0h) / 1000)}s`); throw new Error("K3 fail"); }
    } catch (e) { if (!results.find((r) => r.name.startsWith("K3"))) fail("K3 bridge healthy từ renderer", String(e.message || e)); throw e; }

    // ---- K4: import clip mẫu thật ----
    const stBefore = await cdp.evalJs(STATE_FN);
    try {
      await ensureNoModal();
      const sel = await cdp.setFileInput([CLIP], [".mediabin input[type=file]", ".media-panel input[type=file]", "input[type=file]"]);
      log(`K4: set file input qua selector ${sel}`);
      const st = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(STATE_FN);
        const inBin = (s.mediaNames || []).includes(CLIP_NAME);
        const inAuto = (s.binMedia || []).includes(CLIP_NAME);
        return inBin && inAuto ? s : null;
      }, `import xong: bin có ${CLIP_NAME} (card + autosave binMedia)`, 120000);
      await cdp.shot("k7-k4-imported.png");
      pass("K4 import clip mẫu", `${CLIP_NAME} (${clipSize} byte) vào bin: media ${st.mediaNames.join(", ")}; autosave binMedia ${JSON.stringify(st.binMedia)}`);
    } catch (e) { await cdp.shot("k7-k4-fail.png").catch(() => {}); fail("K4 import clip mẫu", `${e.message}; state trước import: media=${JSON.stringify(stBefore.mediaNames)} binMedia=${JSON.stringify(stBefore.binMedia)}`); throw e; }

    // ---- K5: thêm clip vào timeline ----
    // ROUND83-K7 (sửa sau lần chạy 7): thử click tối đa 2 lần — lần 1 có
    // thể rơi vào backdrop modal (đóng modal thay vì thêm clip); nếu sau
    // 10s .tl-clip chưa tăng thì đóng modal rồi bấm lại.
    try {
      const tlBefore = (await cdp.evalJs(STATE_FN)).tlClips;
      let added = null;
      for (let attempt = 1; attempt <= 2 && !added; attempt++) {
        await ensureNoModal();
        const addBtn = await cdp.evalJs(CARD_BTN_FN(CLIP_NAME, ".media-add"));
        if (!addBtn) throw new Error(`không tìm thấy nút ＋ Thêm (.media-add) trên card ${CLIP_NAME}`);
        await cdp.click(addBtn.x, addBtn.y);
        try {
          added = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(STATE_FN);
            return s.tlClips > tlBefore ? s : null;
          }, `timeline thêm 1 clip (.tl-clip tăng), lần ${attempt}`, attempt === 1 ? 10000 : 60000);
        } catch (e) {
          if (attempt === 1) { log(`K5: lần 1 chưa thêm được (có thể click rơi vào modal) — đóng modal, bấm lại`); continue; }
          throw e;
        }
      }
      const st = added;
      await cdp.shot("k7-k5-timeline.png");
      pass("K5 thêm clip vào timeline", `.tl-clip ${tlBefore} → ${st.tlClips}; autosave clipCount=${st.clipCount}; srcs=${JSON.stringify(st.srcs.slice(0, 4))}`);
    } catch (e) { await cdp.shot("k7-k5-fail.png").catch(() => {}); fail("K5 thêm clip vào timeline", String(e.message || e)); throw e; }

    // ---- K6: preview play thật ----
    try {
      await ensureNoModal();
      const t0p = await cdp.evalJs(STATE_FN);
      const playBtn = await cdp.evalJs(CLICK_SELECTOR_FN(".tbtn.play"));
      if (!playBtn) throw new Error("không tìm thấy nút phát .tbtn.play ở TopBar");
      await cdp.click(playBtn.x, playBtn.y);
      await sleep(2500);
      const t1p = await cdp.evalJs(STATE_FN);
      await sleep(1500);
      const t2p = await cdp.evalJs(STATE_FN);
      await cdp.shot("k7-k6-playing.png");
      const timeAdvanced = t0p.timeDisplay !== t2p.timeDisplay;
      const videoAdvanced = (t1p.videos || []).some((v, i) => (t2p.videos[i] ? t2p.videos[i].t > v.t : false));
      // Dừng lại để export không dính trạng thái đang phát.
      const pauseBtn = await cdp.evalJs(CLICK_SELECTOR_FN(".tbtn.play")).catch(() => null);
      if (pauseBtn && t2p.playing === "true") await cdp.click(pauseBtn.x, pauseBtn.y);
      if (timeAdvanced || videoAdvanced) {
        pass("K6 preview play", `time-display "${t0p.timeDisplay}" → "${t2p.timeDisplay}" (đổi=${timeAdvanced}); video currentTime đổi=${videoAdvanced} ${JSON.stringify(t2p.videos)}; playing aria-pressed=${t2p.playing}`);
      } else {
        fail("K6 preview play", `time-display không đổi ("${t0p.timeDisplay}" → "${t2p.timeDisplay}"); videos=${JSON.stringify(t2p.videos)}; playing=${t2p.playing}`);
        throw new Error("K6 fail");
      }
    } catch (e) { await cdp.shot("k7-k6-fail.png").catch(() => {}); if (!results.find((r) => r.name.startsWith("K6"))) fail("K6 preview play", String(e.message || e)); throw e; }

    // ---- K7: export MP4 qua UI + verify file thật từ bridge ----
    let jobId = null;
    try {
      await ensureNoModal();
      const exportBtn = await cdp.evalJs(CLICK_SELECTOR_FN('[data-tour="export"]'));
      if (!exportBtn) throw new Error("không tìm thấy nút export [data-tour=export] ở TopBar");
      await cdp.click(exportBtn.x, exportBtn.y);
      // Nút bắt đầu render: button.primary, title "Xuất MP4".
      // ROUND83-K7 (sửa sau lần chạy 9): modal export CUỘN ĐƯỢC, nút Xuất
      // nằm dưới nếp gấp — lần chạy 9 đo rect mà KHÔNG scrollIntoView nên
      // click rơi ngoài viewport (không có tác dụng, không job nào chạy).
      // Từ nay scroll vào tầm nhìn trước khi đo, và sau click kiểm tra
      // trạng thái đổi (progress HOẶC banner lỗi); nếu 15s không đổi thì
      // bấm lại 1 lần.
      const startBtn = await cdp.waitFor(async () => {
        const b = await cdp.evalJs(`(() => {
          const btns = [...document.querySelectorAll("button.primary")].filter((x) => (x.title || "") === "Xuất MP4");
          if (btns.length === 0) return null;
          const b = btns[0];
          b.scrollIntoView({ block: "nearest" });
          const r = b.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, text: b.textContent.trim().slice(0, 60) };
        })()`);
        return b && !b.disabled ? b : null;
      }, "nút Xuất MP4 (startRender) hiện + enable", 60000);
      log(`K7: nút export "${startBtn.text}"`);
      // ROUND84-L1: dialog GTK là cửa sổ MỚI, map=Viewable, rộng ≥400px
      // (đo thật ở probe: 1124x822 tại (0,0); tên WM_NAME rỗng nên
      // không chọn theo tên). Chụp cây X trước/sau click, lấy cửa sổ
      // mới thỏa điều kiện; thử lại 1 lần sau 3s nếu dialog chưa map.
      const xwinTree = () => {
        const t = spawnSync("python3", [XTEST_PY, `:${K7_DISPLAY_NUM}`, "tree"], { encoding: "utf8", timeout: 15000, env: xtestEnv() });
        const wins = [];
        for (const line of String(t.stdout || "").split("\n")) {
          const m = /^WIN (\d+) map=(\S+) x=(-?\d+) y=(-?\d+) w=(\d+) h=(\d+) name=(.*)$/.exec(line.trim());
          if (m) wins.push({ id: Number(m[1]), map: m[2], x: Number(m[3]), y: Number(m[4]), w: Number(m[5]), h: Number(m[6]), name: m[7] });
        }
        return wins;
      };
      const typeExportDest = async (winsBefore) => {
        const beforeIds = new Set(winsBefore.map((w) => w.id));
        for (let attempt = 1; attempt <= 2; attempt++) {
          await sleep(attempt === 1 ? 4000 : 3000); // chờ dialog native hiện
          const after = xwinTree();
          const fresh = after.filter((w) => !beforeIds.has(w.id) && w.map === "Viewable" && w.w >= 400);
          log(`K7 XTEST dialog lần ${attempt}: trước=${winsBefore.length} sau=${after.length} mới Viewable≥400px=${JSON.stringify(fresh)}`);
          if (fresh.length === 0) continue;
          const dlg = fresh.sort((a, b) => (b.w * b.h) - (a.w * a.h))[0]; // dialog lớn nhất
          const t = spawnSync("python3", [XTEST_PY, `:${K7_DISPLAY_NUM}`, "type", String(dlg.id), EXPORT_DEST], { encoding: "utf8", timeout: 30000, env: xtestEnv() });
          const out = String(t.stdout || "").trim().replace(/\n/g, " / ");
          log(`K7 XTEST gõ vào dialog win ${dlg.id} (${dlg.w}x${dlg.h} tại ${dlg.x},${dlg.y}): ${out} ${t.stderr ? "ERR:" + String(t.stderr).slice(0, 200) : ""}`);
          if (out.includes("TYPED_OK")) return true;
          log("K7: gõ lần này chưa được (focus fail?) — thử lại 1 lần với snapshot mới");
          winsBefore = after;
        }
        log("K7: không gõ được đích vào dialog sau 2 lần — vẫn chờ panel đổi trạng thái, sẽ thử lại ở bước retry");
        return false;
      };
      // ROUND85-M9: nút Xuất nằm dưới nếp gấp của modal cuộn được —
      // probe A lần 1 click TRƯỢT vì scrollIntoView "nearest" + rect đo
      // trước bị lệch ~60px sau khi layout dịch (click rơi vào ô info
      // text, dialog không mở). Từ nay: mỗi lần thử scroll nút về GIỮA
      // modal, đo LẠI rect ngay trước click, tối đa 3 lần cho tới khi
      // gõ được đích vào dialog.
      const measureStartBtn = async () => cdp.evalJs(`(() => {
        const btns = [...document.querySelectorAll("button.primary")].filter((x) => (x.title || "") === "Xuất MP4");
        if (btns.length === 0) return null;
        const b = btns[0];
        b.scrollIntoView({ block: "center" });
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, text: b.textContent.trim().slice(0, 60), top: r.top, bottom: r.bottom, vh: window.innerHeight };
      })()`);
      let typed = false;
      for (let attempt = 1; attempt <= 3 && !typed; attempt++) {
        const wb = xwinTree();
        const btn = await measureStartBtn();
        if (!btn || btn.disabled) { log(`K7: không đo được nút Xuất MP4 lần ${attempt}: ${JSON.stringify(btn)}`); break; }
        log(`K7: click Xuất lần ${attempt}: nút y=${Math.round(btn.y)} (top=${Math.round(btn.top)} bottom=${Math.round(btn.bottom)} vh=${Math.round(btn.vh)})`);
        await cdp.click(btn.x, btn.y);
        typed = await typeExportDest(wb);
        if (!typed) log(`K7: lần ${attempt} chưa gõ được đích vào dialog — thử lại`);
      }
      if (!typed) log("K7: XTEST chưa gõ được đích sau 3 lần (không thấy dialog?) — vẫn chờ panel đổi trạng thái, sẽ thử lại ở bước retry");
      // Xác nhận click có tác dụng (tiến trình HOẶC lỗi hiện ra); nếu
      // không, bấm lại 1 lần sau khi scroll lại.
      const clickedOk = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(`(() => ({
          progress: !!document.querySelector(".render-progress[data-job-id]"),
          err: !!(document.querySelector(".valid-banner.bad") || document.querySelector(".render-progress")),
        }))()`);
        return (s.progress || s.err) ? s : null;
      }, "panel export đổi trạng thái sau click Xuất", 15000).catch(() => null);
      if (!clickedOk) {
        log("K7: click lần 1 chưa đổi trạng thái panel — bấm lại sau khi scroll");
        const startBtn2 = await cdp.evalJs(`(() => {
          const btns = [...document.querySelectorAll("button.primary")].filter((x) => (x.title || "") === "Xuất MP4");
          if (btns.length === 0) return null;
          const b = btns[0]; b.scrollIntoView({ block: "center" });
          const r = b.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled };
        })()`);
        if (startBtn2 && !startBtn2.disabled) { const wb = xwinTree(); await cdp.click(startBtn2.x, startBtn2.y); await typeExportDest(wb); }
      }
      const job = await cdp.waitFor(async () => {
        const j = await cdp.evalJs(`(() => { const el = document.querySelector(".render-progress[data-job-id]"); return el ? el.getAttribute("data-job-id") : null; })()`);
        return j || null;
      }, "job render xuất hiện (.render-progress[data-job-id])", 120000);
      jobId = job;
      log(`K7: jobId=${jobId}, chờ bridge render xong…`);
      const t0r = Date.now();
      let detail = null;
      while (Date.now() - t0r < 600000) {
        const r = await httpJson(`http://127.0.0.1:${bridgePort}/api/render/${jobId}?detail=1`, 10000).catch(() => null);
        detail = r && r.json ? (r.json.job || r.json) : null;
        if (detail && (detail.status === "done" || detail.status === "error" || detail.status === "failed")) break;
        await sleep(5000);
      }
      if (!detail) throw new Error(`không đọc được trạng thái job ${jobId} sau 600s`);
      if (detail.status !== "done") throw new Error(`job ${jobId} kết thúc với status=${detail.status} (error=${JSON.stringify(detail.error || detail.message || null)})`);
      const dl = await fetch(`http://127.0.0.1:${bridgePort}/api/render/${jobId}/download`);
      if (!dl.ok) throw new Error(`GET download job ${jobId} → HTTP ${dl.status}`);
      const buf = Buffer.from(await dl.arrayBuffer());
      const outMp4 = path.join(WORK, "export.mp4");
      writeFileEpermRetry(outMp4, buf);
      const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size", "-of", "default=nw=1", outMp4], { encoding: "utf8" });
      const dur = /duration=([0-9.]+)/.exec(probe.stdout || "")?.[1] || "?";
      // ROUND84-L1: file đích native chỉ được ghi khi user bấm nút tải
      // ("⬇ Tải xuống MP4") sau khi render xong — app KHÔNG tự lưu
      // (downloadMp4 → saveExportNative → main stream ra đích). K7 chỉ
      // PASS khi file đã về đúng đích đã chọn ở dialog, không chỉ tải
      // được qua bridge. Lần chạy 17 cho thấy download 484316 byte PASS
      // nhưng đích native chưa hề tồn tại (harness chưa bấm nút tải).
      const dlBtn = await cdp.evalJs(`(() => {
        const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Tải xuống MP4") || (x.textContent || "").includes("Download MP4"));
        if (!b) return null;
        b.scrollIntoView({ block: "nearest" });
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim().slice(0, 40) };
      })()`);
      if (!dlBtn) throw new Error("render xong nhưng không thấy nút tải MP4 (Tải xuống MP4/Download MP4)");
      await cdp.click(dlBtn.x, dlBtn.y);
      log(`K7: đã bấm nút tải "${dlBtn.text}" — chờ file về đích native ${EXPORT_DEST}…`);
      let destSize = 0;
      const t0d = Date.now();
      while (Date.now() - t0d < 60000) {
        if (fs.existsSync(EXPORT_DEST)) { destSize = fs.statSync(EXPORT_DEST).size; if (destSize > 0) break; }
        await sleep(1000);
      }
      const destProbe = destSize > 0 ? spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size", "-of", "default=nw=1", EXPORT_DEST], { encoding: "utf8" }) : null;
      const destDur = destProbe ? (/duration=([0-9.]+)/.exec(destProbe.stdout || "")?.[1] || "?") : "?";
      await cdp.shot("k7-k7-exported.png");
      if (buf.length > 0 && Number(dur) > 0 && destSize > 0 && Number(destDur) > 0) {
        pass("K7 export MP4 qua UI", `job ${jobId} done sau ${Math.round((Date.now() - t0r) / 1000)}s; download ${buf.length} byte → ${outMp4}; ffprobe duration=${dur}s; đích native ${EXPORT_DEST} = ${destSize} byte, duration=${destDur}s`);
      } else {
        fail("K7 export MP4 qua UI", `download ${buf.length} byte duration=${dur}; đích native ${EXPORT_DEST} = ${destSize} byte duration=${destDur} (nút tải "${dlBtn.text}" đã bấm)`);
        throw new Error("K7 fail");
      }
    } catch (e) {
      await cdp.shot("k7-k7-fail.png").catch(() => {});
      // Fallback K7b — render smoke qua bridge với spec TỐI GIẢN chỉ chứa
      // clip1.mp4 (ghi rõ là đường fallback, KHÔNG tính là export qua UI).
      // ROUND83-K7 (sửa sau lần chạy 9): lần 9 gửi NGUYÊN spec autosave —
      // spec còn trỏ 2 clip mẫu mau-1/mau-2.webm (file sinh trong bộ nhớ
      // của app, harness không có byte để upload) → job lỗi MISSING_ASSET.
      // Từ nay fallback dựng spec 1 clip duy nhất (clip1.mp4, 0–8s,
      // 1280×720@30) + chỉ upload file đó.
      try {
        log(`K7 UI fail (${e.message}) — thử fallback K7b render smoke qua bridge…`);
        const specRaw = await cdp.evalJs(`localStorage.getItem("vcut-studio:autosave:v1")`);
        const autoSpec = JSON.parse(specRaw).spec;
        const clipEntry = (autoSpec.tracks || []).flatMap((t) => (t.clips || []).map((c) => ({ ...c, trackKind: t.kind })))
          .find((c) => (c.src || "").includes(CLIP_NAME));
        const clipDur = clipEntry && clipEntry.duration > 0 ? Math.min(clipEntry.duration, 8) : 8;
        const spec = {
          version: autoSpec.version || "0.2.0",
          meta: { ...(autoSpec.meta || {}), name: "k7-fallback", width: 1280, height: 720, fps: 30 },
          tracks: [{ id: "v1", kind: "video", clips: [{ id: "c1", kind: "video", src: CLIP_NAME, start: 0, duration: clipDur, in: 0, out: clipDur }] }],
        };
        const form = new FormData();
        form.append("spec", JSON.stringify(spec));
        form.append("preset", JSON.stringify({ crf: 23, x264Preset: "veryfast", audioBitrateKbps: 128 }));
        form.append("media", new Blob([fs.readFileSync(CLIP)]), CLIP_NAME);
        const res = await fetch(`http://127.0.0.1:${bridgePort}/api/render`, { method: "POST", body: form });
        if (!res.ok) throw new Error(`POST /api/render → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
        const { jobId: jid } = await res.json();
        const t0b = Date.now(); let det = null;
        while (Date.now() - t0b < 600000) {
          const r = await httpJson(`http://127.0.0.1:${bridgePort}/api/render/${jid}?detail=1`, 10000).catch(() => null);
          det = r && r.json ? (r.json.job || r.json) : null;
          if (det && (det.status === "done" || det.status === "error" || det.status === "failed")) break;
          await sleep(5000);
        }
        if (!det || det.status !== "done") throw new Error(`job fallback ${jid} status=${det && det.status}`);
        const dl = await fetch(`http://127.0.0.1:${bridgePort}/api/render/${jid}/download`);
        const buf = Buffer.from(await dl.arrayBuffer());
        const outMp4 = path.join(WORK, "export-fallback.mp4");
        writeFileEpermRetry(outMp4, buf);
        const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size", "-of", "default=nw=1", outMp4], { encoding: "utf8" });
        const dur = /duration=([0-9.]+)/.exec(probe.stdout || "")?.[1] || "?";
        if (buf.length > 0 && Number(dur) > 0) pass("K7b render smoke qua bridge (FALLBACK — UI export fail)", `job ${jid} done sau ${Math.round((Date.now() - t0b) / 1000)}s; ${buf.length} byte; ffprobe duration=${dur}s; UI export fail: ${e.message}`);
        else throw new Error(`fallback tải về ${buf.length} byte, duration=${dur}`);
      } catch (e2) { fail("K7b render smoke qua bridge (FALLBACK)", String(e2.message || e2)); }
      fail("K7 export MP4 qua UI", String(e.message || e));
    }

    // ---- K8: thoát sạch ----
    try {
      const pfBefore = pidfile();
      const bridgePid = pfBefore && pfBefore.pid;
      // ROUND85-M9: doi ten de khoi shadow bien module bridgePort (cong
      // that da doc o K3); gia tri giong nhau khi pidfile con (port that).
      const bridgePortK8 = (pfBefore && pfBefore.port) || bridgePort;
      await cdp.send("Browser.close").catch(() => {});
      const t0c = Date.now();
      while (pidAlive(app.pid) && Date.now() - t0c < 60000) await sleep(1000);
      if (pidAlive(app.pid)) { log("K8: Browser.close chưa thoát app — SIGTERM cả nhóm"); killAppGroup("SIGTERM"); await sleep(5000); }
      if (pidAlive(app.pid)) { log("K8: SIGTERM chưa thoát — SIGKILL cả nhóm"); killAppGroup("SIGKILL"); await sleep(3000); }
      const appDead = !pidAlive(app.pid);
      const bridgeDead = !pidAlive(bridgePid);
      const pfGone = !pidfile();
      const portFreeNow = await portFree(bridgePortK8);
      await sleep(1000);
      if (appDead && bridgeDead && pfGone) pass("K8 thoát sạch", `app pid ${app.pid} chết, bridge pid ${bridgePid} chết, bridge.pid.json đã xoá, cổng ${bridgePortK8} trống=${portFreeNow}`);
      else fail("K8 thoát sạch", `appDead=${appDead} bridgeDead=${bridgeDead} (bridge pid ${bridgePid}) pidfileGone=${pfGone} portFree=${portFreeNow}`);
    } catch (e) { fail("K8 thoát sạch", String(e.message || e)); }
  } catch (e) {
    // ROUND83-K7 (sửa sau lần chạy 2): lỗi chết GIỮA các bước (vd CDP
    // timeout trước K2) trước đây không ghi fail nào → report vẫn
    // allPass:true với chỉ 1 bước (exit 0 giả). Từ nay lỗi chết ghi rõ
    // vào bước đang làm dở (hoặc bước kế tiếp chưa chạy).
    fatalError = e;
    const doneNames = new Set(results.map((r) => r.name.slice(0, 2)));
    const next = EXPECTED_STEPS.find((n) => !doneNames.has(n)) || "K?";
    fail(`${next} (lỗi chết trước/khi chạy bước)`, String(e.message || e));
    log(`lỗi chết: ${e.message}`);
  } finally {
    cleanup();
    await sleep(1500);
    // Bridge còn sống sau khi app chết = mồ côi — ghi rõ, không giấu.
    const pf = pidfile();
    if (pf && pidAlive(pf.pid)) log(`CẢNH BÁO: bridge pid ${pf.pid} VẪN SỐNG sau cleanup (mồ côi) — sẽ kill để dọn`);
    if (pf && pidAlive(pf.pid)) { try { process.kill(-pf.pid, "SIGKILL"); } catch { try { process.kill(pf.pid, "SIGKILL"); } catch {} } }
  }

  const report = {
    appImage: APPIMAGE, appImageSha256: appSha, clip: CLIP, clipBytes: clipSize,
    cdpPort: CDP_PORT, bridgePort, work: WORK,
    finishedAt: new Date().toISOString(),
    steps: results,
    // ROUND83-K7: allPass chỉ khi đủ 8 bước K1–K8 VÀ mọi bước ok (K7b
    // fallback — nếu có — cũng phải ok; thiếu bước nào cũng là fail).
    allPass: EXPECTED_STEPS.every((n) => results.some((r) => r.name.startsWith(n) && r.ok)) && results.every((r) => r.ok),
    fatalError: fatalError ? String(fatalError.message || fatalError) : undefined,
  };
  writeFileEpermRetry(path.join(WORK, "clicktest-report.json"), JSON.stringify(report, null, 2));
  writeFileEpermRetry(path.join(WORK, "clicktest.log"), logLines.join("\n") + "\n");
  const nPass = results.filter((r) => r.ok).length;
  console.log(`[k7-clicktest] ${nPass}/${results.length} PASS — report ${path.join(WORK, "clicktest-report.json")}`);
  process.exit(report.allPass ? 0 : 1);
}

main().catch((e) => { console.error(`[k7-clicktest] LỖI CHẾT: ${e && e.message ? e.message : e}`); process.exit(2); });

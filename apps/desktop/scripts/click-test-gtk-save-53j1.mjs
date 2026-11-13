// click-test-gtk-save-53j1.mjs — J1, đợt 53 (Phase 9 VCut Studio).
// Bản CHẨN ĐOÁN tách từ click-test-menu.mjs (H9, đợt 51/52) để KHÔNG đụng
// file dùng chung với J2/J3: chỉ giữ client X11/CDP + helpers, thay toàn
// bộ các phase bằng các thử nghiệm dialog GTK "Lưu dự án" (E1–E5).
// Nhiệm vụ: xác định dứt điểm vì sao gõ path qua dialog GTK không ghi
// file (M4/M5/D2a đợt 52) — chụp dialog sau khi gõ, thử XSetInputFocus,
// thử click nút Save thay Return, đọc log showSaveDialog ở main process.
//
// Cách chạy (từ repo):
//   xvfb-run -a -s "-screen 0 1600x1000x24" node apps/desktop/scripts/click-test-gtk-save-53j1.mjs [--source]
//   --source: chạy electron từ repo (dist mới build, có log dialog) thay
//   vì AppImage. Không spawn Xvfb tay — dùng DISPLAY do xvfb-run cấp.
// Target .vcut nằm trong hidden_files/h9/j1/ (đĩa persistent, không /tmp).
// Báo cáo JSON: hidden_files/h9/h9-report-gtk-save-53j1.json (không đè
// h9-report.json của harness chung). Screenshot: hidden_files/h9/shots/j1-*.
import { spawn, execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { writeFileEpermRetryAsync } from "../../web/scripts/eperm-retry.mjs";
import net from "node:net";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";

const REPO = path.resolve(os.homedir(), "workspace/repo-1");
const DESK = path.join(REPO, "apps/desktop");
const APPIMAGE_DEFAULT = path.join(DESK, "release/vcut-studio-0.1.0-x86_64.AppImage");
// Cho phép trỏ sang bản copy đã verify sha (tránh luồng khác rebuild
// release/ giữa chừng làm đổi artifact dưới chân harness).
const APPIMAGE = process.argv.includes("--appimage") ? path.resolve(process.argv[process.argv.indexOf("--appimage") + 1]) : APPIMAGE_DEFAULT;
const LAUNCH_BIN = process.argv.includes("--binary") ? path.resolve(process.argv[process.argv.indexOf("--binary") + 1]) : APPIMAGE;
const USING_UNPACKED = LAUNCH_BIN !== APPIMAGE;
const DEB = path.join(DESK, "release/vcut-studio_0.1.0_amd64.deb");
const OUT = process.argv.includes("--out") ? path.resolve(process.argv[process.argv.indexOf("--out") + 1]) : path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/h9");
const SHOTS = path.join(OUT, "shots");
// ROUND53-J3: fixture .vcut lưu ở thư mục bền vững (hidden_files/h9),
// KHÔNG phải /tmp (tmpfs mất sau reboot — đợt 52 §5.3). Fixture được
// harness tự tạo + fail-fast khi thiếu (xem ensureFixtures()).
const H9DIR = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/h9");
const FIXTURE_DIR = path.join(H9DIR, "fixtures");
const TESTDIR = process.argv.includes("--testdir") ? path.resolve(process.argv[process.argv.indexOf("--testdir") + 1]) : "/tmp/h9-test";
const USERDATA = process.argv.includes("--userdata") ? path.resolve(process.argv[process.argv.indexOf("--userdata") + 1]) : "/tmp/h9-j1-userdata";
// ROUND53-J1: chạy dưới xvfb-run -a nên DISPLAY đã có sẵn — lấy số display
// từ env thay vì mặc định :137 (tránh nối nhầm Xvfb của luồng khác).
// --display vẫn thắng env khi truyền tường minh.
const DISPLAY_NUM = process.argv.includes("--display") ? parseInt(process.argv[process.argv.indexOf("--display") + 1], 10) : (process.env.DISPLAY ? parseInt(process.env.DISPLAY.replace(/^:/, ""), 10) : 137);
const DISPLAY = `:${DISPLAY_NUM}`;
const SCREEN = { h: 1000, w: 1600 };
let CDP_PORT = 9235; // J1 riêng (tránh đụng 9231/9241 của harness chung J2/J3); fallback 9236
// ROUND53-J1: chạy electron từ repo (dist mới build) thay vì AppImage.
const J1_SOURCE = process.argv.includes("--source") || process.env.J1_SOURCE === "1";
const ELECTRON_BIN = path.join(REPO, "node_modules", "electron", "dist", "electron");
const TMPDISK = path.join(os.homedir(), "workspace/.tmp-h9");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024, timeout: opts.timeoutMs ?? 120000, cwd: opts.cwd ?? REPO, env: { ...process.env, ...(opts.env ?? {}) } }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout: String(stdout ?? ""), stderr: String(stderr ?? ""), timedOut: !!err && err.killed });
    });
  });
}
async function httpJson(url, timeoutMs = 3000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeoutMs);
  try { const r = await fetch(url, { signal: c.signal }); const txt = await r.text(); try { return { status: r.status, json: JSON.parse(txt) }; } catch { return { status: r.status, text: txt.slice(0, 300) }; } }
  catch (e) { return { error: String(e.message ?? e) }; } finally { clearTimeout(t); }
}

// ---------------- Báo cáo ----------------
const report = { startedAt: new Date().toISOString(), cases: [], notes: [] };
function note(s) { report.notes.push(s); console.log("  note: " + s); }
function record(name, ok, detail = "") {
  report.cases.push({ detail: String(detail).slice(0, 800), name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + String(detail).slice(0, 280) : ""}`);
  return !!ok;
}

// ---------------- CRC32 + PNG (cho screenshot GetImage) ----------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function rgbaToPng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) { raw[y * (1 + w * 4)] = 0; rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4); }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

// ---------------- Client X11 thuần (socket, không xdotool) ----------------
// Chỉ implement đúng các request cần: QueryExtension, InternAtom,
// GetProperty, QueryTree, GetGeometry, QueryPointer, GetImage,
// GetKeyboardMapping, XTestFakeInput, SendEvent (ClientMessage).
class X11 {
  constructor(displayNum) { this.displayNum = displayNum; this.seq = 0; this.buf = Buffer.alloc(0); this.packetWaiters = []; }
  // ROUND53-J1: đọc cookie MIT-MAGIC-COOKIE-1 trong $XAUTHORITY cho đúng
  // display (xvfb-run chạy Xvfb với -auth nên setup không kèm cookie bị
  // server từ chối "Authorization required, but no authorization protocol
  // specified"). Trả null khi không có file/cookie → setup không auth
  // (như Xvfb spawn tay không -auth của harness gốc).
  static async readXAuthCookie(displayNum) {
    try {
      const f = process.env.XAUTHORITY || path.join(os.homedir(), ".Xauthority");
      const buf = await fs.readFile(f).catch(() => null);
      if (!buf) return null;
      let off = 0;
      const wantNum = String(displayNum);
      while (off + 2 <= buf.length) {
        const family = buf.readUInt16BE(off); off += 2;
        if (off + 2 > buf.length) break;
        const addrLen = buf.readUInt16BE(off); off += 2;
        if (off + addrLen > buf.length) break;
        off += addrLen;
        if (off + 2 > buf.length) break;
        const numLen = buf.readUInt16BE(off); off += 2;
        if (off + numLen > buf.length) break;
        const num = buf.toString("latin1", off, off + numLen); off += numLen;
        if (off + 2 > buf.length) break;
        const nameLen = buf.readUInt16BE(off); off += 2;
        if (off + nameLen > buf.length) break;
        const name = buf.toString("latin1", off, off + nameLen); off += nameLen;
        if (off + 2 > buf.length) break;
        const dataLen = buf.readUInt16BE(off); off += 2;
        if (off + dataLen > buf.length) break;
        const data = Buffer.from(buf.subarray(off, off + dataLen)); off += dataLen;
        if (num === wantNum && name === "MIT-MAGIC-COOKIE-1") return data;
        void family;
      }
    } catch {}
    return null;
  }
  async connect() {
    this.sock = net.connect(`/tmp/.X11-unix/X${this.displayNum}`);
    await new Promise((res, rej) => { this.sock.once("connect", res); this.sock.once("error", rej); });
    this.sock.on("data", (d) => { this.buf = Buffer.concat([this.buf, d]); this.drain(); });
    this.sock.on("error", () => {});
    const cookie = await X11.readXAuthCookie(this.displayNum);
    const authName = cookie ? Buffer.from("MIT-MAGIC-COOKIE-1") : Buffer.alloc(0);
    const authData = cookie ?? Buffer.alloc(0);
    const pad4 = (n) => (n + 3) & ~3;
    const setup = Buffer.alloc(12 + pad4(authName.length) + pad4(authData.length));
    setup[0] = 0x6c; setup[2] = 11; setup[3] = 0;
    setup.writeUInt16LE(authName.length, 6);
    setup.writeUInt16LE(authData.length, 8);
    authName.copy(setup, 12);
    authData.copy(setup, 12 + pad4(authName.length));
    this.sock.write(setup);
    const head = await this.readExact(8);
    if (head[0] !== 1) {
      // Đọc nốt lý do (failure reply: byte1 = độ dài reason) để báo rõ.
      let reason = "";
      try {
        const restLen = head.readUInt16LE(6) * 4;
        const rest = await this.readExact(restLen);
        reason = rest.toString("latin1").replace(/\0.*$/, "").trim();
      } catch {}
      throw new Error(`X11 setup thất bại, status=${head[0]}${reason ? `: ${reason}` : " (có thể Xvfb chưa lên)"}`);
    }
    const restLen = head.readUInt16LE(6) * 4;
    const rest = await this.readExact(restLen);
    const full = Buffer.concat([head, rest]);
    // Setup reply: 8 byte head + 32 byte fixed (release, rid-base, rid-mask,
    // motion-buffer, vendor-len@24, max-req-len@26, roots-len@28,
    // pixmap-formats-len@29, byte-order@30, bit-order@31, scanline-unit@32,
    // scanline-pad@33, min-keycode@34, max-keycode@35, pad 4) = 40 byte,
    // rồi vendor (padded), pixmap formats (8 byte/cái), rồi roots.
    this.minKeycode = full[34];
    this.maxKeycode = full[35];
    const vendorLen = full.readUInt16LE(24);
    const nFormats = full[29];
    const vendorPadded = (vendorLen + 3) & ~3;
    const rootsOff = 40 + vendorPadded + nFormats * 8;
    // Root struct 40 byte: window@0, colormap@4, white@8, black@12,
    // input-masks@16, width-px@20, height-px@22, ...
    this.root = full.readUInt32LE(rootsOff);
    this.rootWidth = full.readUInt16LE(rootsOff + 20);
    this.rootHeight = full.readUInt16LE(rootsOff + 22);
    this.errors = [];
  }
  readExact(n) {
    return new Promise((resolve) => {
      const tryRead = () => {
        if (this.buf.length >= n) { const out = this.buf.subarray(0, n); this.buf = this.buf.subarray(n); resolve(Buffer.from(out)); return; }
        this.packetWaiters.push(tryRead);
      };
      tryRead();
    });
  }
  drain() { const w = this.packetWaiters.splice(0); for (const f of w) f(); }
  // Đọc 1 gói reply/error (32 byte header + length*4), bỏ qua event xen giữa.
  async readReply(wantSeq) {
    for (;;) {
      const head = await this.readExact(32);
      const type = head[0];
      if (type === 1) {
        const len = head.readUInt32LE(4) * 4;
        const extra = len ? await this.readExact(len) : Buffer.alloc(0);
        const seq = head.readUInt16LE(2);
        if (seq === wantSeq) return { extra, head };
        continue; // reply của request khác (không xảy ra khi gọi tuần tự, vẫn bỏ qua an toàn)
      }
      if (type === 0) {
        const seq = head.readUInt16LE(2);
        const err = { code: head[1], major: head[10], minor: head.readUInt16LE(8), seq, value: head.readUInt32LE(4) };
        this.errors.push(err);
        if (seq === wantSeq) throw new Error(`X11 error code=${err.code} major=${err.major} minor=${err.minor} value=${err.value}`);
        continue;
      }
      // event (32 byte) — bỏ qua
    }
  }
  // body = toàn bộ request sau 4 byte đầu (opcode, byte1, length).
  // byte1 là minor-opcode với extension, hoặc byte dữ liệu đầu tiên
  // của request thường (vd: InternAtom only-if-exists, GetImage format).
  sendRequest(opcode, byte1, body) {
    this.seq = (this.seq + 1) & 0xffff;
    const len = (4 + body.length + 3) >> 2;
    const buf = Buffer.alloc(len * 4);
    buf[0] = opcode; buf[1] = byte1; buf.writeUInt16LE(len, 2);
    body.copy(buf, 4);
    this.sock.write(buf);
    return this.seq;
  }
  async request(opcode, byte1, body) {
    const seq = this.sendRequest(opcode, byte1, body);
    return this.readReply(seq);
  }
  async queryExtension(name) {
    const nb = Buffer.from(name, "ascii");
    const body = Buffer.alloc(4 + ((nb.length + 3) & ~3));
    body.writeUInt16LE(nb.length, 0); nb.copy(body, 4);
    const { head } = await this.request(98, 0, body);
    return { firstError: head[11], firstEvent: head[10], major: head[9], present: head[8] === 1 };
  }
  async internAtom(name, onlyIfExists = false) {
    const nb = Buffer.from(name, "ascii");
    const body = Buffer.alloc(4 + ((nb.length + 3) & ~3));
    body.writeUInt16LE(nb.length, 0); nb.copy(body, 4);
    const { head } = await this.request(16, onlyIfExists ? 1 : 0, body);
    return head.readUInt32LE(8);
  }
  async getProperty(win, prop, type = 0, longLength = 4096) {
    const body = Buffer.alloc(20);
    body.writeUInt32LE(win, 0); body.writeUInt32LE(prop, 4); body.writeUInt32LE(type, 8);
    body.writeUInt32LE(0, 12); body.writeUInt32LE(longLength, 16);
    const { extra, head } = await this.request(20, 0, body);
    return { bytesAfter: head.readUInt32LE(12), format: head[1], type: head.readUInt32LE(8), value: extra, valueLen: head.readUInt32LE(16) };
  }
  async queryTree(win) {
    const body = Buffer.alloc(4); body.writeUInt32LE(win, 0);
    const { extra, head } = await this.request(15, 0, body);
    const n = head.readUInt16LE(16);
    const children = [];
    for (let i = 0; i < n; i++) children.push(extra.readUInt32LE(i * 4));
    return { children, parent: head.readUInt32LE(12), root: head.readUInt32LE(8) };
  }
  async getGeometry(win) {
    const body = Buffer.alloc(4); body.writeUInt32LE(win, 0);
    const { head } = await this.request(14, 0, body);
    return { border: head.readUInt16LE(20), depth: head[1], height: head.readUInt16LE(18), root: head.readUInt32LE(8), width: head.readUInt16LE(16), x: head.readInt16LE(12), y: head.readInt16LE(14) };
  }
  async queryPointer(win) {
    const body = Buffer.alloc(4); body.writeUInt32LE(win, 0);
    const { head } = await this.request(38, 0, body);
    return { child: head.readUInt32LE(12), mask: head.readUInt16LE(24), rootX: head.readInt16LE(16), rootY: head.readInt16LE(18), sameScreen: head[1], winX: head.readInt16LE(20), winY: head.readInt16LE(22) };
  }
  async getImage(win, x, y, w, h) {
    const body = Buffer.alloc(16);
    body.writeUInt32LE(win, 0);
    body.writeInt16LE(x, 4); body.writeInt16LE(y, 6);
    body.writeUInt16LE(w, 8); body.writeUInt16LE(h, 10);
    body.writeUInt32LE(0xffffffff, 12); // plane-mask: tất cả plane
    const { extra, head } = await this.request(73, 2 /* ZPixmap */, body);
    const depth = head[1];
    if (depth !== 24 && depth !== 32) throw new Error(`GetImage depth=${depth}, chỉ hỗ trợ 24/32`);
    // little-endian 32bpp: B,G,R,X
    const rgba = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = extra[i * 4 + 2]; rgba[i * 4 + 1] = extra[i * 4 + 1]; rgba[i * 4 + 2] = extra[i * 4]; rgba[i * 4 + 3] = 255;
    }
    return { data: rgba, depth, height: h, width: w };
  }
  async getWindowAttributes(win) {
    const body = Buffer.alloc(4); body.writeUInt32LE(win, 0);
    const { head } = await this.request(3, 0, body);
    // map-state @[26]: 0=Unmapped, 1=Unmapped?, 2=Viewable (theo X11: 0 Unmapped, 1 Unmapped, 2 Viewable — thực tế 0/2).
    return { backingStore: head[1], class: head.readUInt16LE(12), mapState: head[26], overrideRedirect: head[25], visual: head.readUInt32LE(8) };
  }
  mapWindow(win) {
    this.seq = (this.seq + 1) & 0xffff;
    const buf = Buffer.alloc(8);
    buf[0] = 8; buf[1] = 0; buf.writeUInt16LE(2, 2); buf.writeUInt32LE(win, 4);
    this.sock.write(buf);
  }
  // Diag H9 (run 17): dời / ẩn / hủy một cửa sổ X11 (không cần reply).
  // Dùng để xác định cửa sổ 200x200 "vcut-studio" có chặn menubar không.
  unmapWindow(win) {
    this.seq = (this.seq + 1) & 0xffff;
    const buf = Buffer.alloc(8);
    buf[0] = 10; buf[1] = 0; buf.writeUInt16LE(2, 2); buf.writeUInt32LE(win, 4);
    this.sock.write(buf);
  }
  destroyWindow(win) {
    this.seq = (this.seq + 1) & 0xffff;
    const buf = Buffer.alloc(8);
    buf[0] = 4; buf[1] = 0; buf.writeUInt16LE(2, 2); buf.writeUInt32LE(win, 4);
    this.sock.write(buf);
  }
  moveWindow(win, x, y) {
    this.seq = (this.seq + 1) & 0xffff;
    const buf = Buffer.alloc(20);
    buf[0] = 12; buf[1] = 0; buf.writeUInt16LE(5, 2); buf.writeUInt32LE(win, 4);
    buf.writeUInt16LE(0x0003, 8); // value-mask: X | Y
    buf.writeInt32LE(x, 12); buf.writeInt32LE(y, 16);
    this.sock.write(buf);
  }
  async getKeyboardMapping() {
    const first = 8; const count = this.maxKeycode - first + 1;
    const body = Buffer.alloc(2); body[0] = first; body[1] = count;
    const { extra, head } = await this.request(101, 0, body);
    const per = head[1];
    this.keysymToKeycode = new Map();
    for (let k = 0; k < count; k++) {
      for (let j = 0; j < per; j++) {
        const sym = extra.readUInt32LE((k * per + j) * 4);
        if (sym !== 0 && !this.keysymToKeycode.has(sym)) this.keysymToKeycode.set(sym, { keycode: first + k, shift: j > 0 });
      }
    }
    return this.keysymToKeycode;
  }
  // XTestFakeInput — request 36 byte, length=9. Layout đã kiểm chứng bằng
  // QueryPointer (xem H9-VERIFY trong LIMITS): type@4, detail@5, time@8,
  // root@12, rootX@24, rootY@26.
  // QUAN TRỌNG: mỗi FakeInput cũng là 1 request nên cũng tiêu thụ 1 số
  // sequence của server — phải tăng this.seq, nếu không mọi readReply
  // sau đó chờ sai seq và treo vĩnh viễn (bug gặp thật 06/11).
  fakeInput(type, detail, rootX = 0, rootY = 0) {
    this.seq = (this.seq + 1) & 0xffff;
    const buf = Buffer.alloc(36);
    buf[0] = this.xtestMajor; buf[1] = 2; buf.writeUInt16LE(9, 2);
    buf[4] = type; buf[5] = detail;
    buf.writeUInt32LE(0, 8); // CurrentTime
    buf.writeUInt32LE(this.root, 12);
    buf.writeInt16LE(rootX, 24); buf.writeInt16LE(rootY, 26);
    this.sock.write(buf);
  }
  async mouseMove(x, y) { this.fakeInput(6, 0, x, y); await sleep(60); }
  async click(x, y, button = 1) {
    await this.mouseMove(x, y);
    this.fakeInput(4, button, x, y); await sleep(90);
    this.fakeInput(5, button, x, y); await sleep(120);
  }
  async keyDown(keycode) { this.fakeInput(2, keycode); await sleep(40); }
  async keyUp(keycode) { this.fakeInput(3, keycode); await sleep(40); }
  async keyPress(keycode) { await this.keyDown(keycode); await this.keyUp(keycode); }
  keycodeFor(keysym) {
    const hit = this.keysymToKeycode.get(keysym);
    if (!hit) throw new Error(`không có keycode cho keysym 0x${keysym.toString(16)}`);
    return hit;
  }
  async pressKeysym(keysym) {
    const { keycode, shift } = this.keycodeFor(keysym);
    let shiftCode = null;
    if (shift) { shiftCode = this.keycodeFor(0xffe1).keycode; await this.keyDown(shiftCode); }
    await this.keyPress(keycode);
    if (shiftCode !== null) await this.keyUp(shiftCode);
  }
  async typeText(text) {
    for (const ch of text) await this.pressKeysym(ch.codePointAt(0));
  }
  async ctrlKeysym(keysym) {
    const ctrl = this.keycodeFor(0xffe3).keycode;
    const { keycode } = this.keycodeFor(keysym);
    await this.keyDown(ctrl); await this.keyPress(keycode); await this.keyUp(ctrl);
  }
  async pressEscape() { await this.pressKeysym(0xff1b); await sleep(150); }
  async pressReturn() { await this.pressKeysym(0xff0d); await sleep(150); }
  // XSetInputFocus (opcode 42): đặt focus bàn phím trực tiếp cho một cửa
  // sổ — cần thiết trên Xvfb KHÔNG có window manager: sau khi dialog GTK
  // đóng, focus có thể kẹt ở cửa sổ đã chết và _NET_ACTIVE_WINDOW (cần WM)
  // không có tác dụng. Dùng trong openTopMenu khi lần click đầu không mở
  // được popup (nghi focus lạc). Revert-to: 0=None.
  setInputFocus(win) {
    this.seq = (this.seq + 1) & 0xffff;
    const buf = Buffer.alloc(12);
    buf[0] = 42; buf[1] = 0; buf.writeUInt16LE(3, 2);
    buf.writeUInt32LE(win, 4); buf.writeUInt32LE(0, 8);
    this.sock.write(buf);
  }
  // _NET_ACTIVE_WINDOW để khôi phục cửa sổ bị thu nhỏ.
  async activateWindow(win) {
    this.seq = (this.seq + 1) & 0xffff; // SendEvent cũng tiêu thụ 1 seq
    const buf = Buffer.alloc(44);
    buf[0] = 25; buf[1] = 0; buf.writeUInt16LE(11, 2);
    buf.writeUInt32LE(this.root, 8); buf.writeUInt32LE(0x300000, 12);
    buf[16] = 33; buf[17] = 32;
    buf.writeUInt32LE(win, 20); buf.writeUInt32LE(this.netActiveWindow, 24);
    buf.writeUInt32LE(1, 28); buf.writeUInt32LE(0, 32); buf.writeUInt32LE(win, 36);
    this.sock.write(buf);
  }
  close() { try { this.sock.destroy(); } catch {} }
}

// ---------------- Phân tích ảnh: tìm dải chữ (menu bar / popup / dialog) ----------------
// Nền = màu xuất hiện nhiều nhất trong vùng (lấy mẫu); pixel chữ = lệch
// khỏi nền đủ xa. Trả về các dải (band) theo trục x hoặc y.
function textBands(img, { axis, from, to, max = null, minGap = 3, minSize = 4, minPixels = 6 }) {
  const { data, height, width } = img;
  // axis "x": quét theo cột, from/to là khoảng hàng (y). axis "y": ngược lại.
  const lo = from ?? 0;
  const hi = to ?? (axis === "x" ? height : width);
  const axisLen = axis === "x" ? width : height;
  const scanLimit = max ?? axisLen;
  // Ước lượng màu nền CHỈ trong vùng đang quét (menu bar sáng nằm trên
  // nền app tối — lấy nền toàn ảnh sẽ nhầm cả thanh menu thành chữ).
  const counts = new Map();
  if (axis === "x") {
    for (let y = lo; y < hi; y += 2) for (let x = 0; x < width; x += 5) {
      const i = (y * width + x) * 4;
      const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  } else {
    for (let y = 0; y < height; y += 5) for (let x = lo; x < hi; x += 2) {
      const i = (y * width + x) * 4;
      const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let bg = 0; let bgN = -1;
  for (const [k, n] of counts) if (n > bgN) { bgN = n; bg = k; }
  const br = (bg >> 16) & 0xff; const bgG = (bg >> 8) & 0xff; const bb = bg & 0xff;
  const isText = (x, y) => {
    const i = (y * width + x) * 4;
    return Math.abs(data[i] - br) + Math.abs(data[i + 1] - bgG) + Math.abs(data[i + 2] - bb) > 90;
  };
  const proj = new Array(axisLen).fill(0);
  if (axis === "x") {
    for (let x = 0; x < scanLimit; x++) for (let y = lo; y < hi; y++) if (isText(x, y)) proj[x]++;
  } else {
    for (let y = 0; y < scanLimit; y++) for (let x = lo; x < hi; x++) if (isText(x, y)) proj[y]++;
  }
  const bands = [];
  let start = -1;
  for (let i = 0; i <= axisLen; i++) {
    const on = i < axisLen && proj[i] > 0;
    if (on && start === -1) start = i;
    if (!on && start !== -1) {
      // Nhìn trước minGap: nếu có chữ lại trong minGap thì coi như cùng dải.
      let j = i; let resume = false;
      while (j < Math.min(axisLen, i + minGap)) { if (proj[j] > 0) { resume = true; break; } j++; }
      if (resume) continue;
      const end = i - 1;
      const total = proj.slice(start, i).reduce((a, b) => a + b, 0);
      if (end - start + 1 >= minSize && total >= minPixels) bands.push({ center: (start + end) / 2, end, start, total });
      start = -1;
    }
  }
  return bands;
}

// Độ lệch chuẩn độ sáng (lấy mẫu thưa) — ảnh trơn ~0 = cửa sổ chưa vẽ xong.
function imageStddev(img) {
  const { data, height, width } = img;
  let n = 0; let sum = 0; let sum2 = 0;
  for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) {
    const i = (y * width + x) * 4;
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    n++; sum += l; sum2 += l * l;
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return Math.sqrt(Math.max(0, sum2 / n - mean * mean));
}

// ---------------- CDP client (WebSocket toàn cục, mẫu G6) ----------------
class Cdp {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.events = []; this.dialogs = []; }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; setTimeout(() => rej(new Error("ws timeout")), 15000); });
    this.ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id && this.pending.has(m.id)) { const p = this.pending.get(m.id); this.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return; }
      this.events.push(m);
      if (m.method === "Page.javascriptDialogOpening") {
        this.dialogs.push({ message: m.params.message, type: m.params.type });
        const promptText = this.nextPromptText ?? "H9 Doubleclick";
        this.nextPromptText = null;
        void this.send("Page.handleJavaScriptDialog", { accept: true, promptText }).catch(() => {});
      }
      // Diag H9: slice 1200 (không phải 300) để message "prompt() is not
      // supported" — nằm trong exception.description sau stackTrace — còn
      // thấy được trong-run (run 17: slice 300 chỉ thấy tới callFrame đầu).
      if (m.method === "Runtime.exceptionThrown") this.events.push({ method: "__exception__", detail: JSON.stringify(m.params.exceptionDetails).slice(0, 1200) });
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") this.events.push({ method: "__consoleError__", detail: JSON.stringify(m.params.args).slice(0, 300) });
    };
  }
  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = ++this.id; this.pending.set(id, { rej, res });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error("cdp timeout " + method)); } }, 20000);
    });
  }
  async evaluate(expression, awaitPromise = false) {
    const r = await this.send("Runtime.evaluate", { awaitPromise, expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error("evaluate exception: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

// ---------------- Phiên chạy app ----------------
class AppSession {
  constructor(x11) { this.x11 = x11; this.child = null; this.xvfb = null; this.cdp = null; }
  async startXvfb() {
    // ROUND53-J1: KHÔNG spawn Xvfb tay — script chạy dưới `xvfb-run -a`
    // nên X server đã có sẵn ở $DISPLAY. Chỉ nối client X11 vào display
    // đó + kiểm chứng XTEST/chuột như bản gốc. this.xvfb giữ null để
    // stopXvfb không giết server của xvfb-run.
    if (!process.env.DISPLAY) throw new Error("J1: cần chạy dưới xvfb-run -a (không có $DISPLAY)");
    // Chờ X server sẵn sàng: xvfb-run chạy client ngay sau khi spawn Xvfb
    // nên nối quá sớm có thể nhận setup status=0 (server chưa init xong).
    // Chờ socket xuất hiện + ngủ 800ms như startXvfb gốc (không spawn).
    {
      const sockDeadline = Date.now() + 10000;
      while (Date.now() < sockDeadline && !(await exists(`/tmp/.X11-unix/X${DISPLAY_NUM}`))) await sleep(200);
      await sleep(800);
    }
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        this.x11 = new X11(DISPLAY_NUM);
        await this.x11.connect();
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        note(`startXvfb: nối X11 lần ${attempt} thất bại (${e.message}) — thử lại sau 1s`);
        await sleep(1000);
      }
    }
    if (lastErr) throw lastErr;
    if (this.x11.rootWidth !== SCREEN.w || this.x11.rootHeight !== SCREEN.h) {
      throw new Error(`X server nhầm: root ${this.x11.rootWidth}x${this.x11.rootHeight}, kỳ vọng ${SCREEN.w}x${SCREEN.h} (xvfb-run -s "-screen 0 1600x1000x24")`);
    }
    const xt = await this.x11.queryExtension("XTEST");
    if (!xt.present) throw new Error("XTEST extension không có trên Xvfb — không click được");
    this.x11.xtestMajor = xt.major;
    await this.x11.getKeyboardMapping();
    // Intern các atom cần dùng.
    this.x11.netWmName = await this.x11.internAtom("_NET_WM_NAME");
    this.x11.utf8 = await this.x11.internAtom("UTF8_STRING");
    this.x11.wmName = await this.x11.internAtom("WM_NAME");
    this.x11.netWmState = await this.x11.internAtom("_NET_WM_STATE");
    this.x11.netWmStateHidden = await this.x11.internAtom("_NET_WM_STATE_HIDDEN");
    this.x11.netActiveWindow = await this.x11.internAtom("_NET_ACTIVE_WINDOW");
    // Kiểm chứng XTestFakeInput thật: di chuyển chuột rồi đọc lại vị trí.
    await this.x11.mouseMove(400, 300);
    const p = await this.x11.queryPointer(this.x11.root);
    if (Math.abs(p.rootX - 400) > 3 || Math.abs(p.rootY - 300) > 3) {
      throw new Error(`XTestFakeInput không di chuyển được chuột (QueryPointer=${p.rootX},${p.rootY})`);
    }
    note(`X11 OK (xvfb-run ${DISPLAY}): root=0x${this.x11.root.toString(16)} ${this.x11.rootWidth}x${this.x11.rootHeight}, XTEST major=${xt.major}, chuột di chuyển thật tới (400,300)`);
  }
  async launchAppImage({ argvFiles = [], label = "app" }) {
    // Vệ sinh trước khi khởi động lại: instance cũ (nếu còn) phải chết
    // thật — nếu không, AppImage mới bị single-instance chặn hoặc tranh
    // cổng CDP 9231 và không bao giờ có page target (run 7, phaseDclick).
    if (this.cdp) { try { this.cdp.close(); } catch {} this.cdp = null; }
    if (this.child && this.child.exitCode === null) {
      try { process.kill(-this.child.pid, "SIGKILL"); } catch { try { this.child.kill("SIGKILL"); } catch {} }
      const d = Date.now() + 15000;
      while (Date.now() < d && this.child.exitCode === null) await sleep(250);
      if (this.child.exitCode === null) {
        // Dự phòng: pkill theo argv (mẫu [r] để không tự khớp chính lệnh này).
        await run("pkill", ["-f", `[r]emote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 }).catch(() => null);
        const d2 = Date.now() + 5000;
        while (Date.now() < d2 && this.child.exitCode === null) await sleep(250);
      }
      note(`launchAppImage: instance cũ đã ${this.child.exitCode !== null ? "chết" : "VẪN SỐNG sau SIGKILL+pkill"} trước khi spawn ${label}`);
    }
    // Chờ cổng CDP thật sự trống. Nếu sau 15s vẫn bị giữ (tiến trình lạ
    // từ lượt chạy trước chưa chết), đổi sang cổng dự phòng 9232 thay vì
    // tranh cổng — run 8 chết ở đây: app mới không bind được 9231 nên
    // không bao giờ có page target (trong khi khởi động tay cùng bản
    // AppImage lên CDP chỉ sau ~10s).
    {
      let busy = false;
      const d = Date.now() + 15000;
      while (Date.now() < d) {
        const probe = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 1000);
        if (!probe.json) break;
        busy = true;
        await sleep(500);
      }
      if (busy) {
        const probe2 = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 1000);
        if (probe2.json) { CDP_PORT = 9236; note(`launchAppImage: cổng CDP 9235 vẫn bị giữ sau 15s — đổi sang 9236 cho lần launch ${label}`); }
      }
    }
    let lastErr = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await fs.mkdir(TMPDISK, { recursive: true });
        await fs.mkdir(TESTDIR, { recursive: true });
        // ROUND53-J1: --source chạy electron từ repo: binary là electron,
        // arg đầu là "." (cwd DESK) để load dist/main.js + dist-web mới
        // build (có log dialog-save-project); còn lại như AppImage.
        const args = J1_SOURCE ? [".", `--user-data-dir=${USERDATA}`, `--remote-debugging-port=${CDP_PORT}`, "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox", ...argvFiles] : [`--user-data-dir=${USERDATA}`, `--remote-debugging-port=${CDP_PORT}`, "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox", ...argvFiles];
        const logPath = `/tmp/h9-j1-${label}.log`;
        const logStream = (await import("node:fs")).createWriteStream(logPath);
        this.child = spawn(J1_SOURCE ? ELECTRON_BIN : LAUNCH_BIN, args, {
          cwd: DESK, detached: true,
          env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: "1", DISPLAY, ELECTRON_DISABLE_SANDBOX: "1", TMPDIR: TMPDISK },
          stdio: ["ignore", "pipe", "pipe"],
        });
        this.child.stdout.pipe(logStream); this.child.stderr.pipe(logStream);
        this.logPath = logPath;
        // Chờ CDP page target (300s: giải nén AppImage 148MB dưới tải nặng
        // của 2 builder song song có thể mất >60s — run 8 timeout 120s oan).
        const deadline = Date.now() + 300000;
        let page = null;
        while (Date.now() < deadline) {
          if (this.child.exitCode !== null) throw new Error(`AppImage thoát sớm code=${this.child.exitCode} (xem ${logPath})`);
          const list = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 2000);
          const pages = Array.isArray(list.json) ? list.json.filter((t) => t.type === "page") : [];
          page = pages.find((t) => /app:\/\/|file:|localhost|127\.0\.0\.1/.test(t.url));
          if (page) break;
          await sleep(1000);
        }
        if (!page) throw new Error("không thấy CDP page target sau 600s");
        this.cdp = new Cdp(page.webSocketDebuggerUrl);
        await this.cdp.connect();
        await this.cdp.send("Runtime.enable");
        await this.cdp.send("Page.enable");
        // Chờ React mount + project mẫu load (textLen > 300 như smoke G6).
        const mountDeadline = Date.now() + 60000;
        let info = null;
        while (Date.now() < mountDeadline) {
          info = await this.cdp.evaluate(`JSON.stringify({rootChildren: document.querySelector("#root") ? document.querySelector("#root").children.length : -1, textLen: document.body ? document.body.innerText.length : 0, title: document.title, url: location.href})`).then((s) => JSON.parse(s)).catch(() => null);
          if (info && info.rootChildren > 0 && info.textLen > 300) break;
          await sleep(1000);
        }
        if (!info || info.rootChildren <= 0 || info.textLen <= 300) throw new Error("renderer không mount kịp: " + JSON.stringify(info));
        this.mountInfo = info;
        await this.installProbes();
        return info;
      } catch (e) {
        lastErr = e;
        note(`launchAppImage (${label}) lần ${attempt} thất bại: ${e.message}`);
        if (this.cdp) { try { this.cdp.close(); } catch {} this.cdp = null; }
        if (this.child && this.child.exitCode === null) {
          try { process.kill(-this.child.pid, "SIGKILL"); } catch { try { this.child.kill("SIGKILL"); } catch {} }
          const d = Date.now() + 10000;
          while (Date.now() < d && this.child.exitCode === null) await sleep(250);
        }
        if (attempt === 2) throw lastErr;
        await sleep(2000); // chờ cổng CDP nhả trước khi thử lại
      }
    }
    throw lastErr;
  }
  async installProbes() {
    await this.cdp.evaluate(`(() => {
      window.__h9 = { actions: [], langs: [], openFiles: [] };
      if (window.vcutDesktop) {
        window.vcutDesktop.onMenuAction((a) => window.__h9.actions.push(a));
        window.vcutDesktop.onOpenFile((p) => window.__h9.openFiles.push(p));
        window.vcutDesktop.onLanguageChanged((l) => window.__h9.langs.push(l));
      }
      return !!window.vcutDesktop;
    })()`);
  }
  async h9() { return this.cdp.evaluate(`window.__h9 ? JSON.stringify(window.__h9) : "null"`).then((s) => JSON.parse(s)); }
  async bodyText() { return this.cdp.evaluate(`document.body ? document.body.innerText : ""`); }
  async projectName() {
    return this.cdp.evaluate(`(() => {
      const inputs = [...document.querySelectorAll("input")].map((i) => i.value).filter((v) => v && v.length > 0 && v.length < 80);
      return JSON.stringify({ inputs: inputs.slice(0, 6), textHas: null });
    })()`).then((s) => JSON.parse(s));
  }
  async currentPath() { return this.cdp.evaluate(`window.vcutDesktop ? window.vcutDesktop.getCurrentProjectPath() : Promise.resolve(null)`, true); }
  async clipInfo() {
    return this.cdp.evaluate(`JSON.stringify({count: document.querySelectorAll(".tl-clip").length, labels: [...document.querySelectorAll(".tl-clip .clip-label")].map((e) => e.textContent).slice(0, 8), selected: document.querySelectorAll(".tl-clip.selected").length})`).then((s) => JSON.parse(s));
  }
  async listWindows() {
    const { children } = await this.x11.queryTree(this.x11.root);
    const out = [];
    for (const id of children) {
      let geo = null; try { geo = await this.x11.getGeometry(id); } catch { continue; }
      let title = "";
      try {
        const p = await this.x11.getProperty(id, this.x11.netWmName, this.x11.utf8, 256);
        if (p.valueLen > 0 && p.value.length > 0) title = p.value.toString("utf8").replace(/\0.*$/, "");
      } catch {}
      if (!title) {
        try {
          const p = await this.x11.getProperty(id, this.x11.wmName, 0, 256);
          if (p.valueLen > 0 && p.value.length > 0) title = p.value.toString("latin1").replace(/\0.*$/, "");
        } catch {}
      }
      out.push({ geo, id, title });
    }
    return out;
  }
  async findWindow(titlePart) {
    const wins = await this.listWindows();
    return wins.find((w) => w.title.includes(titlePart)) ?? null;
  }
  async mainWindow() {
    const wins = await this.listWindows();
    return wins.find((w) => w.title.startsWith("VCut Studio")) ?? wins.find((w) => w.geo && w.geo.width >= 1024) ?? null;
  }
  async shotWindowRaw(win) {
    let img = null; let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { img = await this.x11.getImage(win.id, 0, 0, win.geo.width, win.geo.height); break; }
      catch (e) { lastErr = e; await sleep(400); }
    }
    if (!img) throw lastErr;
    return img;
  }
  async shotRoot(file) {
    const img = await this.x11.getImage(this.x11.root, 0, 0, this.x11.rootWidth, this.x11.rootHeight);
    await fs.mkdir(SHOTS, { recursive: true });
    await writeFileEpermRetryAsync(file, rgbaToPng(img.width, img.height, img.data));
    return img;
  }
  async shotWindow(win, file) {
    const img = await this.shotWindowRaw(win);
    await fs.mkdir(SHOTS, { recursive: true });
    await writeFileEpermRetryAsync(file, rgbaToPng(img.width, img.height, img.data));
    return img;
  }
  // Chụp tới khi 2 frame liên tiếp giống hệt nhau (cùng kích thước + cùng
  // bytes) VÀ không trơn: popup vẽ xong, không rách. Run 9 chứng minh
  // frame đầu tiên không-trơn vẫn có thể rách (m3-saveas.png chỉ có 5/8
  // dòng, rộng 222 thay vì 250). Run 10 chứng minh 2 frame trơn giống nhau
  // cũng "ổn định" giả (m5/m8/m9 stddev 0.0, nền 246,245,244 — popup chưa
  // vẽ) → bắt buộc stddev > 5 mới tính.
  async shotWindowStable(win, file, timeoutMs = 6000) {
    const deadline = Date.now() + timeoutMs;
    let prev = null; let img = null; let stable = false;
    while (Date.now() < deadline) {
      try { img = await this.shotWindowRaw(win); } catch { await sleep(300); continue; }
      if (imageStddev(img) <= 5) { prev = null; await sleep(400); continue; } // chưa vẽ — không tính
      if (prev && prev.width === img.width && prev.height === img.height && Buffer.compare(prev.data, img.data) === 0) { stable = true; break; }
      prev = img;
      await sleep(400);
    }
    if (!img) throw new Error("không chụp được cửa sổ");
    if (!stable && imageStddev(img) <= 5) throw new Error("popup không vẽ xong (ảnh trơn) sau 6s");
    await fs.mkdir(SHOTS, { recursive: true });
    await writeFileEpermRetryAsync(file, rgbaToPng(img.width, img.height, img.data));
    return { img, stable };
  }
  async closeAppClean() {
    try { await this.cdp.evaluate(`window.close()`); } catch {}
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline && this.child.exitCode === null) await sleep(250);
    if (this.child.exitCode === null) {
      try { process.kill(-this.child.pid, "SIGTERM"); } catch {}
      const d2 = Date.now() + 8000;
      while (Date.now() < d2 && this.child.exitCode === null) await sleep(250);
      if (this.child.exitCode === null) { try { process.kill(-this.child.pid, "SIGKILL"); } catch {} await sleep(1000); }
    }
    if (this.cdp) { this.cdp.close(); this.cdp = null; }
    const leftover = await run("pgrep", ["-f", `remote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 });
    return { exited: this.child.exitCode !== null, exitCode: this.child.exitCode, orphan: leftover.code === 0 };
  }
  async stopXvfb() {
    if (this.x11) { this.x11.close(); this.x11 = null; }
    if (this.xvfb) { try { this.xvfb.kill("SIGKILL"); } catch {} this.xvfb = null; await sleep(500); }
  }
}

// ---------------- Helper thao tác menu/dialog ----------------
async function menuBarBands(session, shotName = "menubar.png") {
  const main = await session.mainWindow();
  if (!main) throw new Error("không tìm thấy cửa sổ chính");
  const img = await session.shotWindow(main, path.join(SHOTS, shotName));
  // Chiều cao thanh menu: hàng sáng liên tục từ y=0 (menu GTK nền sáng,
  // cao ~28px). Quét lố xuống vùng nội dung tối bên dưới sẽ biến cả
  // thanh thành 1 dải (bug gặp thật run 4).
  const bi = (5 * img.width + 5) * 4;
  const bg = [img.data[bi], img.data[bi + 1], img.data[bi + 2]];
  let bottom = 28;
  for (let y = 0; y < 60; y++) {
    let same = 0; let n = 0;
    for (let x = 0; x < img.width; x += 4) {
      const i = (y * img.width + x) * 4; n++;
      if (Math.abs(img.data[i] - bg[0]) + Math.abs(img.data[i + 1] - bg[1]) + Math.abs(img.data[i + 2] - bg[2]) < 30) same++;
    }
    if (same / n > 0.8) bottom = y + 1;
    else if (y > 10) break;
  }
  let bands = textBands(img, { axis: "x", from: 2, minGap: 4, to: bottom });
  // Gộp các mảnh của cùng một nhãn: khoảng trắng trong nhãn ~6px, khoảng
  // cách giữa 2 nhãn ~14px — ngưỡng gộp 12px tách đúng 5 nhóm.
  const merged = [];
  for (const b of bands) {
    const last = merged[merged.length - 1];
    if (last && b.start - last.end < 12) {
      last.end = b.end; last.center = (last.start + last.end) / 2; last.total += b.total;
    } else merged.push({ ...b });
  }
  bands = merged;
  return { bands, bottom, img, main };
}
// Mở menu top-level (theo thứ tự dải chữ trên menu bar), trả về popup + các dòng chữ.
async function openTopMenu(session, topIndex, shotName) {
  const { bands, main } = await menuBarBands(session, shotName ?? "menubar.png");
  if (topIndex >= bands.length) return { bands, ok: false, reason: `menu bar chỉ có ${bands.length} dải, cần ${topIndex}` };
  const band = bands[topIndex];
  // Click mở popup — thử 2 lần: lần 2 đặt focus về cửa sổ chính trước
  // (XSetInputFocus; Xvfb không có WM nên focus có thể kẹt ở dialog GTK
  // vừa đóng — nghi ngờ sau D3/D4). Nếu cả 2 lần đều không thấy popup thì
  // ghi lại vị trí chuột + danh sách cửa sổ để chẩn đoán.
  let popup = null;
  for (let clickAttempt = 0; clickAttempt < 2 && !popup; clickAttempt++) {
    if (clickAttempt === 1) {
      await session.x11.pressEscape(); await sleep(400);
      const mainNow = await session.mainWindow().catch(() => null);
      if (mainNow) {
        try { session.x11.setInputFocus(mainNow.id); } catch {}
        await sleep(400);
      }
    }
    const before = (await session.listWindows()).map((w) => w.id);
    const geo = clickAttempt === 1 ? ((await session.mainWindow().catch(() => null))?.geo ?? main.geo) : main.geo;
    await session.x11.click(geo.x + band.center, geo.y + 15);
    await sleep(600);
    popup = await waitNewWindow(session, before, 3000);
    if (popup && clickAttempt === 1) note(`openTopMenu: popup chỉ mở được ở lần click thứ 2 (sau SetInputFocus) — lần 1 không mở được, nghi focus lạc sau dialog GTK (Xvfb không có WM)`);
  }
  if (!popup) {
    const ptr = await session.x11.queryPointer(session.x11.root).catch(() => null);
    note(`openTopMenu: không thấy popup sau 2 lần click (topIndex=${topIndex}, click tại ${main.geo.x + Math.round(band.center)},${main.geo.y + 15}; chuột hiện tại ${ptr ? `${ptr.rootX},${ptr.rootY}` : "?"}) — cửa sổ lúc đó: ${(await session.listWindows()).map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ")}`);
    return { bands, ok: false, reason: "không thấy popup menu sau click" };
  }
  // Chờ popup vẽ xong và ỔN ĐỊNH (2 frame giống nhau) rồi mới đọc dòng.
  let shot = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { shot = await session.shotWindowStable(popup, path.join(SHOTS, shotName ?? "popup.png"), 4000); } catch { shot = null; }
    if (shot && shot.stable) break;
    if (shot && !shot.stable) note(`openTopMenu: popup ${shotName ?? ""} không ổn định sau 4s — dùng frame cuối (có thể rách)`);
    if (attempt === 0) {
      // Mở lại: Escape đóng menu cũ (nếu còn), đặt focus về cửa sổ chính
      // (XSetInputFocus — Xvfb không có WM nên focus có thể kẹt ở dialog
      // GTK vừa đóng), rồi click lại nhãn.
      await session.x11.pressEscape(); await sleep(400);
      const mainNow = await session.mainWindow().catch(() => null);
      if (mainNow) {
        try { session.x11.setInputFocus(mainNow.id); } catch {}
        await sleep(400);
      }
      const before2 = (await session.listWindows()).map((w) => w.id);
      const band = bands[topIndex];
      const geo = mainNow ? mainNow.geo : main.geo;
      await session.x11.click(geo.x + band.center, geo.y + 15);
      await sleep(600);
      popup = await waitNewWindow(session, before2, 3000);
      if (!popup) {
        const ptr = await session.x11.queryPointer(session.x11.root).catch(() => null);
        note(`openTopMenu: lần 2 vẫn không thấy popup (topIndex=${topIndex}, click tại ${geo.x + Math.round(band.center)},${geo.y + 15}; chuột hiện tại ${ptr ? `${ptr.rootX},${ptr.rootY}` : "?"}) — cửa sổ lúc đó: ${(await session.listWindows()).map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ")}`);
        return { bands, ok: false, reason: "không thấy popup menu sau click (lần 2)" };
      }
    }
  }
  if (!shot) return { bands, ok: false, reason: "không chụp được popup menu" };
  let img = shot.img;
  // Geometry có thể đã cũ (popup vừa đổi kích thước/vị trí sau khi chụp)
  // — lấy lại geometry tươi; nếu kích thước khác ảnh vừa chụp thì chụp lại
  // 1 lần và tính lại dòng (run 10: m3 rộng 222 thay vì 250, dòng lệch).
  {
    const fresh = (await session.listWindows()).find((w) => w.id === popup.id);
    if (fresh) {
      popup.geo = fresh.geo;
      if (fresh.geo.width !== img.width || fresh.geo.height !== img.height) {
        note(`openTopMenu: popup đổi kích thước sau khi chụp (${img.width}x${img.height} → ${fresh.geo.width}x${fresh.geo.height}) — chụp lại`);
        try {
          const shot2 = await session.shotWindowStable(popup, path.join(SHOTS, shotName ?? "popup.png"), 4000);
          img = shot2.img;
          const fresh2 = (await session.listWindows()).find((w) => w.id === popup.id);
          if (fresh2) popup.geo = fresh2.geo;
        } catch (e) { note(`openTopMenu: chụp lại thất bại: ${e.message}`); }
      }
    }
  }
  const rows = textBands(img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img.height });
  return { bands, img, ok: true, popup, rows, stable: shot.stable };
}
async function waitNewWindow(session, beforeIds, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const wins = await session.listWindows();
    const nw = wins.find((w) => !beforeIds.includes(w.id) && w.geo.width < 700 && w.geo.height < 700);
    if (nw) return nw;
    await sleep(200);
  }
  return null;
}
// Chờ cửa sổ có tiêu đề chứa titlePart xuất hiện (poll).
async function waitWindow(session, titlePart, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const w = await session.findWindow(titlePart);
    if (w) return w;
    await sleep(300);
  }
  return null;
}
// Chờ bất kỳ cửa sổ dialog nào mới xuất hiện (không phụ thuộc tiêu đề):
// dialog GTK có thể mang tiêu đề khác dự đoán ("Lưu dự án" vs tên file…).
// Loại trừ cửa sổ chính (1440x900) và các cửa sổ phụ 10x10 của Chromium.
async function waitAnyDialog(session, beforeIds, timeoutMs = 10000, minSize = 20) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const wins = await session.listWindows();
    const dlg = wins.find((w) => !beforeIds.includes(w.id) && w.geo.width >= minSize && w.geo.height >= minSize && w.geo.width < 1200 && w.geo.height < 850);
    if (dlg) return dlg;
    await sleep(300);
  }
  return null;
}
// Prompt native của window.prompt (Electron/GTK): cửa sổ mới ~200x200,
// tiêu đề = tên app ("vcut-studio"), CDP KHÔNG báo Page.javascriptDialogOpening
// (run 15: cdp.dialogs=[] dù action đã tới renderer). Trả lời bằng bàn phím:
// click vào giữa (ô nhập), Ctrl+A, gõ tên, Enter.
async function answerNativePrompt(session, win, name, shotName) {
  await session.shotRoot(path.join(SHOTS, shotName ?? "prompt-root.png")).catch(() => {});
  await sleep(500);
  await session.x11.click(win.geo.x + Math.round(win.geo.width / 2), win.geo.y + Math.round(win.geo.height / 2));
  await sleep(300);
  await session.x11.ctrlKeysym(0x61); // Ctrl+A: chọn hết tên mặc định
  await sleep(200);
  await session.x11.typeText(name);
  await sleep(200);
  await session.x11.pressReturn();
  const gone = await waitWindowGone(session, win.id, 5000);
  return { gone, title: win.title, w: win.geo.width, h: win.geo.height };
}
async function dumpWindows(session, tag) {
  const wins = await session.listWindows();
  note(`${tag}: ${wins.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ")}`);
  return wins;
}
async function waitWindowGone(session, winId, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const wins = await session.listWindows();
    if (!wins.some((w) => w.id === winId)) return true;
    await sleep(200);
  }
  return false;
}
// Click một mục trong popup đã mở (theo thứ tự dòng chữ, bỏ separator —
// separator không có chữ nên không tạo dải).
async function clickPopupRow(session, popup, img, rows, rowIndex) {
  if (rowIndex >= rows.length) return { ok: false, reason: `popup chỉ có ${rows.length} dòng, cần ${rowIndex}` };
  const row = rows[rowIndex];
  // Lấy geometry tươi ngay trước click — popup có thể đã di chuyển sau
  // khi chụp (run 10, mode B: click theo tọa độ cũ trượt khỏi mục).
  const fresh = (await session.listWindows()).find((w) => w.id === popup.id);
  const geo = fresh ? fresh.geo : popup.geo;
  if (!fresh) note("clickPopupRow: popup không còn trong tree lúc click — dùng geometry cũ");
  await session.x11.click(geo.x + Math.round(img.width / 2), geo.y + Math.round(row.center));
  await sleep(450);
  return { ok: true, row };
}
// Click mục menu: mở top menu rồi click dòng item.
async function clickMenuItem(session, topIndex, itemIndex, shotName) {
  const opened = await openTopMenu(session, topIndex, shotName);
  if (!opened.ok) return opened;
  const clicked = await clickPopupRow(session, opened.popup, opened.img, opened.rows, itemIndex);
  if (!clicked.ok) { await session.x11.pressEscape(); return { ...opened, ...clicked }; }
  return { ...opened, ...clicked };
}
// Liệt kê cửa sổ con của một cửa sổ (submenu có thể là con của popup,
// không phải con của root — waitNewWindow chỉ quét root thì sẽ miss).
async function listChildWindows(session, parentId) {
  try {
    const { children } = await session.x11.queryTree(parentId);
    const out = [];
    for (const id of children) {
      let geo = null; try { geo = await session.x11.getGeometry(id); } catch { continue; }
      let title = "";
      try {
        const p = await session.x11.getProperty(id, session.x11.netWmName, session.x11.utf8, 256);
        if (p.valueLen > 0 && p.value.length > 0) title = p.value.toString("utf8").replace(/\0.*$/, "");
      } catch {}
      out.push({ geo, id, title });
    }
    return out;
  } catch { return []; }
}
// Hover mục trong popup để mở submenu, rồi click dòng trong submenu.
// ROUND53-J3 (điều tra M7 đợt 52): hover từng bước (3 nấc, mỗi nấc 250ms)
// thay vì nhảy thẳng — XTest motion 1 lần có thể không sinh đủ sự kiện
// hover trên Xvfb; chờ submenu tới 5s; nếu không thấy cửa sổ mới ở root
// thì kiểm tra cả cửa sổ con của popup; dump toàn bộ cửa sổ + chụp root
// để làm bằng chứng phân biệt bug sản phẩm vs harness.
async function clickSubmenuItem(session, topIndex, itemIndex, subIndex, shotName) {
  const opened = await openTopMenu(session, topIndex, shotName);
  if (!opened.ok) return opened;
  if (itemIndex >= opened.rows.length) { await session.x11.pressEscape(); return { ...opened, ok: false, reason: `popup chỉ có ${opened.rows.length} dòng` }; }
  const row = opened.rows[itemIndex];
  const before = (await session.listWindows()).map((w) => w.id);
  const targetX = opened.popup.geo.x + Math.round(opened.img.width / 2);
  const targetY = opened.popup.geo.y + Math.round(row.center);
  const ptr0 = await session.x11.queryPointer(session.x11.root).catch(() => null);
  // Hover từng bước từ vị trí chuột hiện tại tới giữa dòng mục.
  const steps = 3;
  for (let s = 1; s <= steps; s++) {
    const x = Math.round((ptr0?.rootX ?? targetX) + ((targetX - (ptr0?.rootX ?? targetX)) * s) / steps);
    const y = Math.round((ptr0?.rootY ?? targetY) + ((targetY - (ptr0?.rootY ?? targetY)) * s) / steps);
    await session.x11.mouseMove(x, y);
    await sleep(250);
  }
  await sleep(800);
  let sub = await waitNewWindow(session, before, 3000);
  let subViaChild = null;
  if (!sub) {
    // Thử hover lại ở mép phải dòng (vùng mũi tên submenu) + giữ lâu hơn.
    await session.x11.mouseMove(opened.popup.geo.x + opened.img.width - 12, targetY);
    await sleep(1500);
    sub = await waitNewWindow(session, before, 2000);
  }
  if (!sub) {
    // Submenu có thể là cửa sổ con của popup (không phải con root).
    const kids = await listChildWindows(session, opened.popup.id);
    subViaChild = kids.find((w) => w.geo.width >= 20 && w.geo.height >= 20) ?? null;
    if (subViaChild) note(`clickSubmenuItem: submenu là cửa sổ CON của popup (id=0x${subViaChild.id.toString(16)} "${subViaChild.title}" ${subViaChild.geo.width}x${subViaChild.geo.height}) — waitNewWindow (root) đã miss`);
  }
  if (!sub && !subViaChild) {
    const winsNow = await session.listWindows();
    const kidsNow = await listChildWindows(session, opened.popup.id);
    note(`clickSubmenuItem: KHÔNG thấy submenu sau hover (mục dòng ${itemIndex}, hover tới ${targetX},${targetY}, chuột hiện tại ${ptr0 ? `${ptr0.rootX},${ptr0.rootY}` : "?"}); cửa sổ root lúc đó: ${winsNow.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ")}; con của popup: ${kidsNow.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}`).join(" | ") || "(không có)"}`);
    await session.shotRoot(path.join(SHOTS, (shotName ?? "popup.png").replace(".png", "-no-sub-root.png"))).catch(() => {});
    await session.x11.pressEscape(); return { ...opened, ok: false, reason: "không thấy submenu sau hover" };
  }
  sub = sub ?? subViaChild;
  let shot2 = null;
  try { shot2 = await session.shotWindowStable(sub, path.join(SHOTS, (shotName ?? "popup.png").replace(".png", "-sub.png")), 4000); } catch {}
  if (!shot2) { await session.x11.pressEscape(); return { ...opened, ok: false, reason: "không chụp được submenu" }; }
  const img2 = shot2.img;
  const rows2 = textBands(img2, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img2.height });
  const clicked = await clickPopupRow(session, sub, img2, rows2, subIndex);
  if (!clicked.ok) { await session.x11.pressEscape(); return { ...opened, ...clicked }; }
  return { ...opened, ok: true, sub, subRows: rows2.length };
}
async function closeAnyMenu(session) {
  await session.x11.pressEscape();
  await sleep(300);
}
// Click nút trong dialog native: dòng nút cuối cùng ở đáy dialog, chọn nút
// theo thứ tự từ phải sang (0 = nút phải nhất, thường là "Đóng").
async function clickDialogButton(session, win, fromRight = 0, shotName = "dialog.png") {
  const img = await session.shotWindow(win, path.join(SHOTS, shotName));
  // Hàng nút nằm sát đáy dialog (GTK: ~12px đệm) — chỉ quét 55px cuối để
  // không nhầm với chữ detail có thể tràn xuống.
  const rows = textBands(img, { axis: "y", from: Math.max(0, img.height - 55), minGap: 3, minSize: 5, to: img.height });
  if (rows.length === 0) return { ok: false, reason: "không thấy dòng nút ở đáy dialog" };
  const row = rows[rows.length - 1];
  const cols = textBands(img, { axis: "x", from: Math.round(row.start), minGap: 6, to: Math.round(row.end) + 1 });
  if (fromRight >= cols.length) return { ok: false, reason: `chỉ thấy ${cols.length} nút, cần nút thứ ${fromRight} từ phải` };
  const col = cols[cols.length - 1 - fromRight];
  await session.x11.click(win.geo.x + Math.round(col.center), win.geo.y + Math.round(row.center));
  await sleep(500);
  return { cols: cols.length, ok: true };
}
// Gõ đường dẫn vào dialog GTK (Ctrl+L → gõ path → Enter). Trả về true
// khi cửa sổ dialog biến mất trong timeout. Run 18: kích hoạt (raise +
// focus) dialog TRƯỚC khi click — dialog GTK có thể mở SAU cửa sổ chính
// nên click thẳng vào tọa độ của nó sẽ rơi xuống cửa sổ chính (run 17 M4:
// dialog "Lưu dự án" mở nhưng gõ path không có tác dụng, dialog không đóng).
async function gtkTypePath(session, win, filePath, timeoutMs = 8000) {
  await session.x11.activateWindow(win.id);
  await sleep(500);
  await session.x11.click(win.geo.x + Math.round(win.geo.width / 2), win.geo.y + Math.round(win.geo.height / 2));
  await sleep(300);
  await session.x11.ctrlKeysym(0x6c); // Ctrl+L: ô location
  await sleep(400);
  await session.x11.typeText(filePath);
  await sleep(300);
  await session.x11.pressReturn();
  const gone = await waitWindowGone(session, win.id, timeoutMs);
  return gone;
}
async function settingsJson() {
  const p = path.join(USERDATA, "settings.json");
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return null; }
}

// ---------------- Fixture .vcut tự tạo + fail-fast (ROUND53-J3) ----------------
// Nội dung spec copy từ hidden_files/h9/make-fixture.mjs (VideoSpec 0.2.0,
// cùng cấu trúc project mẫu, chỉ đổi meta.name + id clip cố định).
// Đợt 52 §5.3: fixture ở /tmp bị reboot xóa → M5/D1/D2b chạy mù. Nay
// harness tự tạo fixture vào FIXTURE_DIR bền vững trước mọi phase, đọc
// lại + JSON.parse để verify, và FAIL-FAST (throw) nếu tạo/verify lỗi —
// không chạy mù nữa. File fixture thiếu trong phase cũng được kiểm tra
// lại bằng requireFixture() trước case dùng nó.
function fixtureSpec(name) {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1", kind: "video", label: "Video 1",
        clips: [
          { kind: "video", id: "c-h9-1", src: "mau-1.webm", start: 0, duration: 4, in: 0, out: 4, transitionOut: { type: "fade", duration: 0.6 } },
          { kind: "video", id: "c-h9-2", src: "mau-2.webm", start: 4, duration: 4, in: 0, out: 4 },
        ],
      },
      {
        id: "t1", kind: "text", label: "Chữ 1",
        clips: [
          { kind: "text", id: "c-h9-3", text: "Xin chào! Đây là VCut Studio", start: 0.5, duration: 5,
            style: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 72, color: "#ffffff", bold: true, x: 0.5, y: 0.32, animation: "fadeUp" } },
        ],
      },
    ],
  };
}
async function ensureFixtures() {
  await fs.mkdir(FIXTURE_DIR, { recursive: true });
  const wanted = [
    { file: FIXTURE1, name: "H9 Doubleclick" },
    { file: FIXTURE2, name: "H9 Second" },
  ];
  for (const { file, name } of wanted) {
    let ok = false;
    try {
      const j = JSON.parse(await fs.readFile(file, "utf8"));
      ok = j?.meta?.name === name && Array.isArray(j.tracks) && j.tracks.length > 0;
    } catch { ok = false; }
    if (!ok) {
      await writeFileEpermRetryAsync(file, JSON.stringify(fixtureSpec(name), null, 2));
      const j = JSON.parse(await fs.readFile(file, "utf8"));
      if (j?.meta?.name !== name || !Array.isArray(j.tracks) || j.tracks.length === 0) {
        throw new Error(`fixture ${file} ghi xong nhưng đọc lại không khớp (meta.name/tracks)`);
      }
      note(`ensureFixtures: đã (tạo lại) fixture ${path.basename(file)} — meta "${name}"`);
    }
  }
  const sizes = [];
  for (const { file } of wanted) sizes.push(`${path.basename(file)}=${(await fs.stat(file)).size} byte`);
  return sizes.join(", ");
}
async function requireFixture(file) {
  // Kiểm tra lại ngay trước case dùng fixture — fail-fast có ghi nhận,
  // không chạy mù. Trả true khi fixture hợp lệ.
  try {
    const j = JSON.parse(await fs.readFile(file, "utf8"));
    if (typeof j?.meta?.name === "string" && Array.isArray(j.tracks) && j.tracks.length > 0) return true;
  } catch {}
  return false;
}

// ---------------- main (J1, chẩn đoán dialog GTK "Lưu dự án") ----------------
// Chạy dưới: xvfb-run -a -s "-screen 0 1600x1000x24" node <script> [--source]
//   --source (hoặc J1_SOURCE=1): chạy electron từ repo (dist mới build,
//   có log dialog-save-project) thay vì AppImage.
// Không spawn Xvfb tay: dùng DISPLAY do xvfb-run cấp (startXvfb của bản
// copy này đã sửa thành nối vào DISPLAY sẵn có — xem AppSession.startXvfb).
// Target .vcut nằm trong hidden_files/h9/j1/ (đĩa persistent, không /tmp).
const J1DIR = path.join(OUT, "j1");
const J1_E1 = path.join(J1DIR, "J1-E1-baseline.vcut");
const J1_E2 = path.join(J1DIR, "J1-E2-focus.vcut");
const J1_E3 = path.join(J1DIR, "J1-E3-clicksave.vcut");
const J1_E4 = path.join(J1DIR, "J1-E4-noclick-clicksave.vcut");
const J1_E5 = path.join(J1DIR, "J1-E5-nameonly-clicksave.vcut");
const SOURCE_MODE = process.argv.includes("--source") || process.env.J1_SOURCE === "1";

/** Đọc các dòng log dialog-save-project từ log stdout của app. */
async function readDialogLog(session) {
  try {
    const txt = await fs.readFile(session.logPath, "utf8");
    return txt.split("\n").filter((l) => l.includes("dialog-save-project"));
  } catch { return []; }
}

/** File .vcut lạ xuất hiện ở $HOME hoặc apps/desktop (dialog submit nhầm đường mặc định). */
async function strayVcut(knownSet) {
  const found = [];
  for (const dir of [os.homedir(), DESK]) {
    try {
      for (const f of await fs.readdir(dir)) if (f.endsWith(".vcut") || f.endsWith(".vcut.json")) found.push(path.join(dir, f));
    } catch {}
  }
  return found.filter((f) => !knownSet.has(f));
}

/** Đóng welcome modal nếu đang mở (trả true nếu đã bấm Để sau). */
async function closeWelcomeIfOpen(session) {
  try {
    const t = await session.bodyText();
    if (!t.includes("Chào mừng tới VCut Studio")) return false;
    await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
    await sleep(1000);
    return true;
  } catch { return false; }
}

/**
 * Một lần thử Lưu thành… qua dialog GTK.
 * opts: { focusFirst, submit: "return"|"click-save", centerClick: true,
 *         typeMode: "full-path"|"name-only" }
 * Khác gtkTypePath ở chỗ: chụp ảnh dialog SAU khi gõ, TRƯỚC khi submit
 * (xem location bar có path không) + đọc log main + kiểm tra file lạ.
 */
async function runSaveAsExperiment(session, tag, target, opts) {
  const { centerClick = true, clickNameField = false, focusFirst = false, submit = "return", typeMode = "full-path" } = opts;
  await fs.rm(target, { force: true });
  const strayBefore = new Set(await strayVcut(new Set()));
  const excBefore = session.cdp.events.filter((e) => e.method === "__exception__").length;
  await closeWelcomeIfOpen(session);
  // Đặt focus về cửa sổ chính trước khi mở menu (giảm flake focus lạc
  // sau dialog — xem note openTopMenu ở E2/E4).
  try { const mw = await session.mainWindow(); if (mw) session.x11.setInputFocus(mw.id); await sleep(300); } catch {}
  const winsBefore = (await session.listWindows()).map((w) => w.id);
  const r = await clickMenuItem(session, 0, 5, `${tag}-menu.png`);
  await sleep(1500);
  let dlg = await session.findWindow("Lưu dự án");
  if (!dlg) dlg = await waitAnyDialog(session, winsBefore, 3000);
  if (!dlg) {
    record(`${tag}: dialog "Lưu dự án" mở sau click Lưu thành…`, false, r.ok ? "không thấy dialog" : `click thất bại: ${r.reason ?? "?"}`);
    return { dialogOpened: false, ok: false };
  }
  await session.shotWindow(dlg, path.join(SHOTS, `${tag}-dialog-open.png`)).catch(() => {});
  if (tag === "j1-e1") await dumpWindows(session, "J1-E1 lúc dialog mở");
  if (focusFirst) { session.x11.setInputFocus(dlg.id); await sleep(300); }
  await session.x11.activateWindow(dlg.id);
  await sleep(500);
  if (clickNameField) {
    // Click thẳng vào ô Name (y≈27) + Ctrl+A: bảo đảm ô Name có focus
    // thật trước khi gõ (loại trừ nghi ngờ focus sau click giữa/click list).
    await session.x11.click(dlg.geo.x + Math.round(dlg.geo.width / 2), dlg.geo.y + 27);
    await sleep(300);
    await session.x11.ctrlKeysym(0x61); // Ctrl+A: chọn hết tên mặc định
    await sleep(200);
  } else if (centerClick) {
    await session.x11.click(dlg.geo.x + Math.round(dlg.geo.width / 2), dlg.geo.y + Math.round(dlg.geo.height / 2));
    await sleep(300);
  }
  await session.x11.ctrlKeysym(0x6c); // Ctrl+L: ô location
  await sleep(400);
  await session.x11.typeText(typeMode === "name-only" ? path.basename(target) : target);
  await sleep(300);
  await session.shotWindow(dlg, path.join(SHOTS, `${tag}-typed.png`)).catch(() => {});
  let closedBy = "none";
  if (submit === "return") {
    await session.x11.pressReturn();
    await sleep(500);
    await session.shotWindow(dlg, path.join(SHOTS, `${tag}-after-submit.png`)).catch(() => {});
    if (await waitWindowGone(session, dlg.id, 8000)) closedBy = "return";
  } else if (submit === "click-save") {
    // ROUND53-J1: dùng finder đã sửa (clickDialogButton gốc của harness
    // chung luôn fail "không thấy dòng nút" trên dialog 1124x822 — xem
    // findDialogSaveButton). Không sửa file harness chung trong lượt này.
    const cb = await clickDialogSaveButton(session, dlg);
    if (cb.ok && (await waitWindowGone(session, dlg.id, 8000))) closedBy = "click-save";
    else closedBy = cb.ok ? "click-save-no-close" : `click-save-fail:${cb.reason ?? "?"}`;
    await session.shotWindow(dlg, path.join(SHOTS, `${tag}-after-submit.png`)).catch(() => {});
  }
  if (closedBy === "none" || closedBy === "click-save-no-close") {
    await session.x11.pressEscape(); await sleep(800);
    const stillThere = (await session.listWindows()).some((w) => w.id === dlg.id);
    if (!stillThere) closedBy = closedBy === "none" ? "escape-cleanup" : "escape-after-click";
  }
  await sleep(1000);
  const saved = await exists(target);
  let valid = false; let metaName = "?"; let trackCount = -1;
  if (saved) {
    try {
      const j = JSON.parse(await fs.readFile(target, "utf8"));
      const spec = j?.spec ?? j;
      valid = typeof spec?.meta?.name === "string" && Array.isArray(spec.tracks) && spec.tracks.length > 0;
      metaName = spec?.meta?.name ?? "?"; trackCount = Array.isArray(spec.tracks) ? spec.tracks.length : -1;
    } catch {}
  }
  const cur = await session.currentPath().catch(() => null);
  const after = await session.h9().catch(() => ({ actions: [] }));
  const actionSeen = (after.actions ?? []).includes("save-project-as");
  const newExc = session.cdp.events.filter((e) => e.method === "__exception__").slice(excBefore);
  const dlgLog = await readDialogLog(session);
  const stray = await strayVcut(strayBefore);
  const body = await session.bodyText().catch(() => "");
  const toast = /Không ghi được file/.test(body) ? "toast LỖI ghi file" : (/Đã lưu|Lưu thành công|saveDone/i.test(body) ? "toast đã lưu" : "không thấy toast lưu/lỗi");
  const ok = !!dlg && closedBy === submit && saved && valid && cur === target;
  record(`${tag}: Lưu thành… + gõ path + submit(${submit}) → file ghi + currentPath`, ok,
    `click Lưu thành…: ${r.ok ? "đúng mục" : "THẤT BẠI: " + (r.reason ?? "?")}; action save-project-as: ${actionSeen}; dialog đóng bởi: ${closedBy}; main log: ${dlgLog.length ? dlgLog.map((l) => l.replace("[vcut-desktop] ", "")).join(" | ").slice(0, 300) : "(không có dòng dialog-save-project)"}; file: ${saved ? `CÓ (meta "${metaName}", ${trackCount} tracks, JSON hợp lệ: ${valid})` : "không có"}; currentPath=${cur}; ${toast}; exception mới: ${newExc.length}; file .vcut lạ ở $HOME/DESK: ${stray.length ? stray.join(",") : "không"}`);
  return { closedBy, cur, dialogOpened: true, dlgLog, ok, saved, stray, valid };
}

/**
 * Tìm nút Save (phải nhất, hàng nút cuối) trong dialog GTK — bản sửa cho
 * clickDialogButton của harness chung: hàm gốc gọi textBands(axis "y",
 * from=height-55, to=height) nhưng với axis "y" thì from/to là khoảng X,
 * không phải khoảng Y, nên trên dialog 1124x822 nó quét dải x∈[767,822)
 * (vùng trống) và luôn trả "không thấy dòng nút". Bản này quét toàn chiều
 * rộng, lấy hàng chữ cuối cùng (= hàng nút), rồi lấy cột phải nhất.
 */
async function findDialogSaveButton(session, dlg) {
  const img = await session.shotWindow(dlg, path.join(SHOTS, "j1-savebtn-scan.png")).catch(() => null);
  if (!img) return { ok: false, reason: "không chụp được dialog" };
  const rows = textBands(img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img.width });
  if (rows.length === 0) return { ok: false, reason: "không thấy hàng chữ nào trong dialog" };
  const row = rows[rows.length - 1];
  // ROUND53-J1: cột nút Cancel/Save cách nhau chỉ ~4px (chữ trong nút),
  // minGap lớn gộp 2 nút thành 1 band → click rơi vào khe giữa 2 nút
  // (vòng 8: 1 cột [944–1117], tâm 1030.5, dialog không đóng). minGap=3
  // tách được: Cancel [944–1028] + Save [1033–1117], tâm Save ≈ (1075, 799)
  // (đã chứng minh offline trên j1-savebtn-scan.png).
  const cols = textBands(img, { axis: "x", from: Math.round(row.start), minGap: 3, to: Math.round(row.end) + 1 });
  if (cols.length === 0) return { ok: false, reason: "không thấy cột nút ở hàng cuối" };
  const col = cols[cols.length - 1];
  return { colCenter: col.center, cols: cols.length, ok: true, rowCenter: row.center, rows: rows.length };
}

async function clickDialogSaveButton(session, dlg) {
  const found = await findDialogSaveButton(session, dlg);
  if (!found.ok) return found;
  await session.x11.click(dlg.geo.x + Math.round(found.colCenter), dlg.geo.y + Math.round(found.rowCenter));
  await sleep(500);
  return { ...found };
}

/**
 * Mở dialog Lưu dự án bằng phím tắt Ctrl+Shift+S (accelerator của mục
 * "Lưu dự án thành…") — bypass hoàn toàn click popup (loại trừ nghi ngờ
 * click sai hàng sau khi vòng 2 F1–F3 không thấy dialog dù popup mở đúng).
 * CHỜ RIÊNG tiêu đề "Lưu dự án" tới 15s (không dùng waitAnyDialog — vòng
 * 3 nó trả về cửa sổ phụ electron 200x200 trước khi dialog GTK kịp mở).
 */
async function openSaveDialogByShortcut(session) {
  const mw = await session.mainWindow().catch(() => null);
  if (mw) {
    session.x11.setInputFocus(mw.id);
    await sleep(300);
    // Click thanh tiêu đề để chắc chắn cửa sổ chính có focus bàn phím.
    await session.x11.click(mw.geo.x + Math.round(mw.geo.width / 2), mw.geo.y + 12);
    await sleep(300);
  }
  const t0 = Date.now();
  const excBefore = session.cdp.events.filter((e) => e.method === "__exception__").length;
  const errBefore = session.cdp.events.filter((e) => e.method === "__consoleError__").length;
  const ctrl = session.x11.keycodeFor(0xffe3).keycode;
  const shift = session.x11.keycodeFor(0xffe1).keycode;
  const s = session.x11.keycodeFor(0x53).keycode;
  await session.x11.keyDown(ctrl);
  await session.x11.keyDown(shift);
  await session.x11.keyPress(s);
  await session.x11.keyUp(shift);
  await session.x11.keyUp(ctrl);
  let dlg = null;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    dlg = await session.findWindow("Lưu dự án");
    if (dlg) break;
    await sleep(500);
  }
  const actions = await session.h9().catch(() => ({ actions: [] }));
  const newExc = session.cdp.events.filter((e) => e.method === "__exception__").slice(excBefore);
  const newErr = session.cdp.events.filter((e) => e.method === "__consoleError__").slice(errBefore);
  return { actions: actions.actions ?? [], dlg, newErr, newExc, openMs: dlg ? Date.now() - t0 : -1 };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(SHOTS, { recursive: true });
  await fs.mkdir(J1DIR, { recursive: true });
  for (const f of [J1_E1, J1_E2, J1_E3, J1_E4, J1_E5]) await fs.rm(f, { force: true }).catch(() => {});
  await fs.rm(USERDATA, { recursive: true, force: true });
  note("J1 main: đã xóa user-data-dir cũ + target cũ — chạy với profile mới");

  // Preflight: đúng binary đang test + (source mode) dist có log mới.
  if (SOURCE_MODE) {
    const mainJs = await fs.readFile(path.join(DESK, "dist", "main.js"), "utf8").catch(() => "");
    record("J1-PRE source mode: dist/main.js có log dialog-save-project (ROUND53-J1)", mainJs.includes("dialog-save-project: canceled="),
      mainJs.includes("dialog-save-project: canceled=") ? "log có trong dist" : "KHÔNG thấy log trong dist — build lại desktop trước khi chạy");
    const el = await exists(path.join(REPO, "node_modules", "electron", "dist", "electron"));
    record("J1-PRE electron binary có sẵn", el, el ? "node_modules/electron/dist/electron" : "không tìm thấy electron");
  } else {
    const sha = await run("sha256sum", [APPIMAGE], { timeoutMs: 30000 });
    const appImageSha = sha.stdout.split(/\s+/)[0];
    const shaRel = await run("sha256sum", [APPIMAGE_DEFAULT], { timeoutMs: 30000 });
    const releaseSha = shaRel.stdout.split(/\s+/)[0];
    const aiStat = await fs.stat(APPIMAGE);
    record("J1-PRE AppImage được test đúng là bản release hiện tại", appImageSha === releaseSha,
      `test sha=${appImageSha.slice(0, 16)}… (${aiStat.size} byte); release/ sha=${releaseSha.slice(0, 16)}…`);
  }

  const session = new AppSession(null);
  try {
    await session.startXvfb();
    const info = await session.launchAppImage({ label: "j1" });
    note(`J1 launch: ${JSON.stringify(info)}`);

    // SETUP: chờ project mẫu load + đóng welcome modal (như M0/W0).
    // Chờ tới 120s (máy tải nặng do J2/J3/J4 chạy song song — vòng 7 cũ
    // fail SETUP ở 60s vì sample chưa kịp sinh).
    let sampleLoaded = false;
    {
      const deadline = Date.now() + 120000;
      while (Date.now() < deadline) {
        const t = await session.bodyText().catch(() => "");
        if (t.includes("mau-1")) { sampleLoaded = true; break; }
        await sleep(2000);
      }
    }
    const clip0 = await session.clipInfo().catch(() => ({ count: -1, labels: [] }));
    record("J1-SETUP Project mẫu load xong (MediaBin có mau-1, timeline có clip)", sampleLoaded && clip0.count >= 3,
      `sampleLoaded=${sampleLoaded}; clip count=${clip0.count}; labels=${JSON.stringify(clip0.labels)}`);
    await closeWelcomeIfOpen(session);

    // Vòng 8 (J1–J2) — ĐÃ RÕ NGUYÊN NHÂN các lượt 2–7 fail: bundle web bị
    // J4 rebuild giữa chừng (21:07 UTC, copy sang dist-web 21:18) — flow
    // Lưu thành… nay hỏi tên qua RenameProjectDialog TRONG APP trước khi
    // mở dialog GTK (thay window.prompt). Các lượt trước không biết dialog
    // này nên flow dừng ở đó (chờ nhập tên), không phải bug sản phẩm.
    // Vòng 8 xác nhận bằng DOM probe rồi ĐI TRỌN flow mới: xác nhận dialog
    // đổi tên (Enter) → dialog GTK mở → click nút Save → file ghi.
    const J1_G1 = path.join(J1DIR, "J1-G1-shortcut-save.vcut");
    const HOME_TARGET = path.join(os.homedir(), path.basename(J1_G1));
    await fs.rm(J1_G1, { force: true }).catch(() => {});
    await fs.rm(HOME_TARGET, { force: true }).catch(() => {});
    // J1: gửi Ctrl+Shift+S, chờ dialog đổi tên trong DOM (tới 10s).
    const mw8 = await session.mainWindow().catch(() => null);
    if (mw8) { session.x11.setInputFocus(mw8.id); await sleep(300); }
    const ctrl8 = session.x11.keycodeFor(0xffe3).keycode;
    const shift8 = session.x11.keycodeFor(0xffe1).keycode;
    const s8 = session.x11.keycodeFor(0x53).keycode;
    await session.x11.keyDown(ctrl8);
    await session.x11.keyDown(shift8);
    await session.x11.keyPress(s8);
    await session.x11.keyUp(shift8);
    await session.x11.keyUp(ctrl8);
    let renameInfo = null;
    {
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        renameInfo = await session.cdp.evaluate(`(() => { const d = document.querySelector('[data-testid="rename-project-dialog"]'); if (!d) return null; const inp = document.querySelector('[data-testid="rename-project-input"]'); return JSON.stringify({ inputValue: inp ? inp.value : null, present: true }); })()`).then((s) => (s ? JSON.parse(s) : null)).catch(() => null);
        if (renameInfo) break;
        await sleep(500);
      }
    }
    const actions8 = await session.h9().catch(() => ({ actions: [] }));
    record("J1-J1 Ctrl+Shift+S mở dialog đổi tên trong app (RenameProjectDialog, thay window.prompt)", !!renameInfo,
      `action save-project-as tới renderer: ${(actions8.actions ?? []).includes("save-project-as")}; dialog đổi tên trong DOM: ${renameInfo ? `có (input=${JSON.stringify(renameInfo.inputValue)})` : "KHÔNG thấy sau 10s"}`);
    let j2 = { ok: false };
    if (renameInfo) {
      await session.shotRoot(path.join(SHOTS, "j1-j1-rename-dialog.png")).catch(() => {});
      // Xác nhận tên bằng Enter (input đang focus) → flow tiếp tới dialog GTK.
      await session.x11.pressReturn();
      let dlg = null;
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        dlg = await session.findWindow("Lưu dự án");
        if (dlg) break;
        await sleep(500);
      }
      record("J1-J2 Sau khi xác nhận tên (Enter): dialog GTK Lưu dự án mở", !!dlg,
        dlg ? `dialog "${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}` : "KHÔNG thấy dialog GTK sau 15s");
      if (dlg) {
        await session.shotWindow(dlg, path.join(SHOTS, "j1-j2-dialog-open.png")).catch(() => {});
        // Click ô Name + Ctrl+A + gõ CHỈ tên file + click nút Save.
        await session.x11.click(dlg.geo.x + Math.round(dlg.geo.width / 2), dlg.geo.y + 27);
        await sleep(300);
        await session.x11.ctrlKeysym(0x61);
        await sleep(200);
        await session.x11.typeText(path.basename(J1_G1));
        await sleep(300);
        await session.shotWindow(dlg, path.join(SHOTS, "j1-j2-typed.png")).catch(() => {});
        const cb = await clickDialogSaveButton(session, dlg);
        let closedBy = "none";
        if (cb.ok && (await waitWindowGone(session, dlg.id, 8000))) closedBy = "click-save";
        else if (cb.ok) closedBy = "click-save-no-close";
        else closedBy = `click-save-fail:${cb.reason ?? "?"}`;
        if (closedBy === "none" || closedBy === "click-save-no-close") {
          await session.x11.pressEscape(); await sleep(800);
          if (!(await session.listWindows()).some((w) => w.id === dlg.id)) closedBy += "+escape-cleanup";
        }
        await sleep(1000);
        const savedHome = await exists(HOME_TARGET);
        let valid = false; let metaName = "?"; let trackCount = -1;
        if (savedHome) {
          try {
            const j = JSON.parse(await fs.readFile(HOME_TARGET, "utf8"));
            const spec = j?.spec ?? j;
            valid = typeof spec?.meta?.name === "string" && Array.isArray(spec.tracks) && spec.tracks.length > 0;
            metaName = spec?.meta?.name ?? "?"; trackCount = Array.isArray(spec.tracks) ? spec.tracks.length : -1;
            // Lưu bản copy làm bằng chứng vào J1DIR rồi dọn file ở $HOME.
            await fs.copyFile(HOME_TARGET, J1_G1);
            await fs.rm(HOME_TARGET, { force: true });
          } catch {}
        }
        const cur = await session.currentPath().catch(() => null);
        const dlgLog = await readDialogLog(session);
        j2 = { closedBy, cur, ok: closedBy === "click-save" && savedHome && valid && cur === HOME_TARGET, savedHome, valid };
        record("J1-J2 Lưu thành… trọn flow mới (đổi tên + click Save): file ghi + currentPath", j2.ok,
          `nút Save tìm được: ${cb.ok ? `có (${cb.cols} cột, hàng ${Math.round(cb.rowCenter)})` : "KHÔNG: " + (cb.reason ?? "?")}; dialog đóng bởi: ${closedBy}; main log: ${dlgLog.length ? dlgLog.map((l) => l.replace("[vcut-desktop] ", "")).join(" | ").slice(0, 300) : "(không có dòng dialog-save-project)"}; file ở $HOME: ${savedHome ? `CÓ (meta "${metaName}", ${trackCount} tracks, JSON hợp lệ: ${valid}; đã copy về J1DIR)` : "không có"}; currentPath=${cur}`);
      }
    }
    note(`J1 kết quả vòng 8: J1 rename-dialog=${!!renameInfo}; J2 save-click-save=${j2.ok}`);
  } finally {
    if (session.child && session.child.exitCode === null) await session.closeAppClean().catch(() => {});
    await session.stopXvfb();
  }
  // Copy log app về OUT (persistent — /tmp mất sau reboot).
  try {
    const logTxt = await fs.readFile("/tmp/h9-j1-j1.log", "utf8").catch(() => null);
    if (logTxt) await writeFileEpermRetryAsync(path.join(OUT, "h9-j1-app.log"), logTxt);
  } catch {}

  report.finishedAt = new Date().toISOString();
  report.passed = report.cases.filter((c) => c.ok).length;
  report.failed = report.cases.filter((c) => !c.ok).length;
  await writeFileEpermRetryAsync(path.join(OUT, "h9-report-gtk-save-53j1.json"), JSON.stringify(report, null, 2));
  console.log(`\nJ1 SUMMARY: ${report.passed} passed, ${report.failed} failed — report: ${path.join(OUT, "h9-report-gtk-save-53j1.json")}`);
  process.exit(report.failed ? 1 : 0);
}

main().catch((e) => {
  console.error("J1 HARNESS ERROR:", e);
  process.exit(2);
});

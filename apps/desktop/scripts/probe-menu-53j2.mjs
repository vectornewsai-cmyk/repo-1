// click-test-menu.mjs — H9, đợt 51 (Phase 10 VCut Studio / Electron).
// Click-test THẬT menu + dialog native + double-click .vcut trên AppImage
// đã build (apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage).
//
// Cách chạy (từ repo): node apps/desktop/scripts/click-test-menu.mjs
//   [--appimage <đường dẫn>] [--skip-deb] [--only <phase>]
//   [--display <n>] [--out <dir>] [--userdata <dir>] [--testdir <dir>]
// phase: menu | dclick | deb | cross | diag | d4 (mặc định chạy hết,
// trừ diag/d4 chỉ chạy khi chỉ định --only).
// ROUND53-J3: --out/--userdata/--testdir để các luồng J1/J2/J3 chạy song
// song không giẫm report/user-data/testdir của nhau; fixture luôn ở
// hidden_files/h9/fixtures (dùng chung, tự tạo, không đổi theo --out).
// Kết thúc exit 0 khi mọi case PASS, 1 khi có FAIL. Báo cáo JSON +
// screenshot ghi vào ~/workspace/goals/capcut-clone-video-editor/hidden_files/h9/
//
// KHÔNG dùng xdotool (không có trên VM): client X11 thuần viết tay qua
// socket /tmp/.X11-unix (XTEST FakeInput để click/gõ phím thật, QueryTree
// để thấy cửa sổ/dialog, GetImage để chụp màn hình thật). Không npm
// install, không deps mới — chỉ dùng node:net / node:zlib / WebSocket
// toàn cục (mẫu theo apps/desktop/scripts/verify-desktop.mjs của G6).
// KHÔNG push, KHÔNG stage binary, KHÔNG sửa code production (trừ khi
// click-test phát hiện bug thật — xem LIMITS H9).
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
const USERDATA = process.argv.includes("--userdata") ? path.resolve(process.argv[process.argv.indexOf("--userdata") + 1]) : "/tmp/h9-userdata";
const DISPLAY_NUM = process.argv.includes("--display") ? parseInt(process.argv[process.argv.indexOf("--display") + 1], 10) : 137;
const DISPLAY = `:${DISPLAY_NUM}`;
const SCREEN = { h: 1000, w: 1600 };
let CDP_PORT = 9237; // let: launchAppImage có thể đổi sang 9241 nếu 9231 bị tiến trình lạ giữ (H8 dùng 9233/9234 cho smoke)
const TMPDISK = path.join(os.homedir(), "workspace/.tmp-h9-j2");

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
  async connect() {
    this.sock = net.connect(`/tmp/.X11-unix/X${this.displayNum}`);
    await new Promise((res, rej) => { this.sock.once("connect", res); this.sock.once("error", rej); });
    this.sock.on("data", (d) => { this.buf = Buffer.concat([this.buf, d]); this.drain(); });
    this.sock.on("error", () => {});
    const setup = Buffer.alloc(12); setup[0] = 0x6c; setup[2] = 11; setup[3] = 0;
    this.sock.write(setup);
    const head = await this.readExact(8);
    if (head[0] !== 1) throw new Error(`X11 setup thất bại, status=${head[0]} (có thể Xvfb chưa lên)`);
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
  // Timeout 30s: readExact không reject khi X server chết (socket close bị
  // nuốt) nên không có timeout probe kẹt vô hạn — đã xảy ra 21:35 khi Xvfb
  // :141 chết giữa chừng. Timeout ném lỗi để main ghi report + dọn dẹp.
  async readReply(wantSeq) {
    const deadline = Date.now() + 30000;
    const timeoutErr = () => new Error(`X11 readReply timeout 30s (seq=${wantSeq}) — X server có thể đã chết`);
    for (;;) {
      const remain = deadline - Date.now();
      if (remain <= 0) throw timeoutErr();
      const head = await Promise.race([this.readExact(32), sleep(remain).then(() => { throw timeoutErr(); })]);
      const type = head[0];
      if (type === 1) {
        const len = head.readUInt32LE(4) * 4;
        const extra = len ? await Promise.race([this.readExact(len), sleep(Math.max(1000, deadline - Date.now())).then(() => { throw timeoutErr(); })]) : Buffer.alloc(0);
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
    // Dọn socket/lock cũ (Xvfb bị SIGKILL để lại lock → lần spawn sau
    // thất bại âm thầm và client có thể nối nhầm server cũ).
    // ROUND53-J3: xóa cả /tmp/.tX<N>-lock (xkbcomp lock — đợt 52 §7:
    // startXvfb cũ không xóa nên Xvfb mới đôi khi exit 1 do xkb race).
    await run("rm", ["-f", `/tmp/.X${DISPLAY_NUM}-lock`, `/tmp/.tX${DISPLAY_NUM}-lock`, `/tmp/.X11-unix/X${DISPLAY_NUM}`], { timeoutMs: 15000 }).catch(() => {});
    this.xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", `${SCREEN.w}x${SCREEN.h}x24`], { stdio: "ignore" });
    // Chờ socket xuất hiện + tiến trình Xvfb còn sống.
    const sockDeadline = Date.now() + 10000;
    while (Date.now() < sockDeadline) {
      if (this.xvfb.exitCode !== null) throw new Error(`Xvfb thoát sớm code=${this.xvfb.exitCode} (display ${DISPLAY} có thể đã bị chiếm)`);
      if (await exists(`/tmp/.X11-unix/X${DISPLAY_NUM}`)) break;
      await sleep(200);
    }
    await sleep(800);
    this.x11 = new X11(DISPLAY_NUM);
    await this.x11.connect();
    if (this.x11.rootWidth !== SCREEN.w || this.x11.rootHeight !== SCREEN.h) {
      throw new Error(`X server nhầm: root ${this.x11.rootWidth}x${this.x11.rootHeight}, kỳ vọng ${SCREEN.w}x${SCREEN.h} (có thể nối nhầm Xvfb khác)`);
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
    note(`X11 OK: root=0x${this.x11.root.toString(16)} ${this.x11.rootWidth}x${this.x11.rootHeight}, XTEST major=${xt.major}, chuột di chuyển thật tới (400,300)`);
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
        if (probe2.json) { CDP_PORT = 9247; note(`launchAppImage: cổng CDP 9237 vẫn bị giữ sau 15s — đổi sang 9247 cho lần launch ${label}`); }
      }
    }
    let lastErr = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await fs.mkdir(TMPDISK, { recursive: true });
        await fs.mkdir(TESTDIR, { recursive: true });
        const args = [`--user-data-dir=${USERDATA}`, `--remote-debugging-port=${CDP_PORT}`, "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox", ...argvFiles];
        const logPath = `/tmp/h9-${label}-d${DISPLAY_NUM}.log`;
        const logStream = (await import("node:fs")).createWriteStream(logPath);
        this.child = spawn(LAUNCH_BIN, args, {
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
// Lái dialog nhập tên trong app (ROUND53-J4): Lưu thành… trên desktop
// mở RenameProjectDialog TRƯỚC khi tới dialog lưu native. newName = tên
// mới cần gõ (null = giữ nguyên tên đã điền sẵn, chỉ bấm Lưu). Trả về
// { present, inputBefore, confirmed } — present=false khi dialog không
// xuất hiện trong 5s (bản app cũ chưa có dialog → đỏ-trước ở M3).
// Gõ bằng native setter + event input (input React controlled — gán
// .value trực tiếp không cập nhật state React nên phải đi qua setter
// của prototype + dispatch input event).
async function driveRenameDialog(session, newName) {
  const deadline = Date.now() + 5000;
  let present = false;
  while (Date.now() < deadline) {
    try {
      present = await session.cdp.evaluate(`!!document.querySelector('[data-testid="rename-project-dialog"]')`);
      if (present) break;
    } catch {}
    await sleep(300);
  }
  if (!present) return { confirmed: false, inputBefore: null, present: false };
  const inputBefore = await session.cdp.evaluate(`(document.querySelector('[data-testid="rename-project-input"]') || {}).value ?? null`).catch(() => null);
  if (typeof newName === "string") {
    await session.cdp.evaluate(`(() => {
      const el = document.querySelector('[data-testid="rename-project-input"]');
      if (!el) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(el, ${JSON.stringify(newName)});
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    })()`).catch(() => false);
    await sleep(300);
  }
  const clicked = await session.cdp.evaluate(`(() => { const b = document.querySelector('[data-testid="rename-project-save"]'); if (!b) return false; b.click(); return true; })()`).catch(() => false);
  const d2 = Date.now() + 3000;
  let gone = false;
  while (Date.now() < d2) {
    try {
      gone = !(await session.cdp.evaluate(`!!document.querySelector('[data-testid="rename-project-dialog"]')`));
      if (gone) break;
    } catch { gone = true; break; }
    await sleep(200);
  }
  await sleep(400);
  return { confirmed: clicked && gone, inputBefore, present: true };
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

// ============ PROBE J2 — ROUND53 (menu actions M10–M26) ============
// Snapshot nền: click-test-menu.mjs lúc 21:02 06/11 (đã gồm sửa J3/J4 tới
// thời điểm đó). Chỉ dùng phần infra X11/CDP/AppSession + helper menu;
// mọi phase diag/menu/dclick/deb/cross/main cũ đã cắt bỏ (dòng 1149+).
// Mục tiêu: xác định dứt điểm vì sao menu action M10–M26 không tới
// renderer sau M9 (đợt 52 §5.2). Phương pháp:
//   E1: mở từng menu theo đúng cách harness cũ làm (live bands) để tái hiện.
//   E2: mở lại bằng tọa độ sạch (clean centers đo lúc cửa sổ còn sạch) +
//       click từng hàng + đọc __h9.actions NGAY sau mỗi click (IPC?).
//   E3: load lại sample project (launch mới) trước các case cần clip.
//   E4: pháp y vùng đen trên menubar (strip analysis + danh sách cửa sổ
//       đầy đủ + thử unmap/dời cửa sổ 200x200 nghi phạm).
// Chạy: xvfb-run -a node apps/desktop/scripts/probe-menu-53j2.mjs
//   --display 141 --out ~/workspace/goals/capcut-clone-video-editor/hidden_files/h9/j2
//   --userdata /tmp/h9-j2-userdata --testdir /tmp/h9-j2-test
//   [--appimage <bản copy đã verify sha>]
// Display :141 + CDP 9237 để không đụng J1 (xvfb-run -a riêng) / J4
// (:139 + CDP 9231). KHÔNG push, KHÔNG release/tag, KHÔNG sửa production
// trong file này (chỉ probe; nếu phát hiện bug thật thì sửa ở file khác
// sau khi có bằng chứng). Ảnh chụp là bằng chứng trong OUT, KHÔNG stage
// vào batch push (binary).
const FIXTURE1 = path.join(FIXTURE_DIR, "H9-Fixture.vcut");
const FIXTURE2 = path.join(FIXTURE_DIR, "H9-SecondInstance.vcut");
const MENU_NAMES = ["Tệp", "Chỉnh sửa", "Xem", "Cửa sổ", "Trợ giúp"];
// Thứ tự hàng theo apps/desktop/src/menu.ts + i18n-desktop.ts (tiếng Việt).
const MENU_ROWS_VI = [
  ["Dự án mới", "Mở dự án…", "Thêm media…", "Mở gần đây", "Lưu dự án", "Lưu dự án thành…", "Xuất video…", "Thoát"],
  ["Hoàn tác", "Làm lại", "Cắt", "Sao chép", "Dán", "Nhân bản clip", "Xóa", "Chọn tất cả"],
  ["Tải lại", "Tải lại (xóa cache)", "Công cụ nhà phát triển", "Mức thu phóng mặc định", "Phóng to", "Thu nhỏ", "Toàn màn hình", "Ngôn ngữ"],
  ["Thu nhỏ", "Đóng cửa sổ"],
  ["Giới thiệu VCut Studio", "Phím tắt", "Tài liệu hướng dẫn", "Báo lỗi…", "VCut Studio trên GitHub"],
];
let CLEAN_CENTERS = null; // centers x đo được lúc cửa sổ còn sạch (P0)
let CLEAN_GEO = null;

// Phân tích dải menubar trên ảnh cửa sổ chính: màu nền modal, các khoảng
// đen thuần (0,0,0) theo trục x (vùng chưa vẽ/bị che — thủ phạm làm
// menuBarBands gộp sai dải, xem đợt 52 m10-undo.png: đen 0–322 → 1 dải).
function stripAnalysis(img, bottom) {
  const { data, width } = img;
  const counts = new Map();
  for (let y = 2; y < bottom; y++) for (let x = 0; x < width; x += 3) {
    const i = (y * width + x) * 4;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bg = 0; let bgN = -1;
  for (const [k, n] of counts) if (n > bgN) { bgN = n; bg = k; }
  const blackCols = [];
  for (let x = 0; x < width; x++) {
    let n = 0;
    for (let y = 2; y < bottom; y++) { const i = (y * width + x) * 4; if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) n++; }
    if (n >= (bottom - 2) * 0.8) blackCols.push(x);
  }
  const ranges = [];
  for (const x of blackCols) {
    const last = ranges[ranges.length - 1];
    if (last && x - last[1] <= 2) last[1] = x; else ranges.push([x, x]);
  }
  return { bg: `#${bg.toString(16).padStart(6, "0")}`, bgCount: bgN, blackRanges: ranges };
}

// Danh sách cửa sổ đầy đủ thuộc tính (mapState/overrideRedirect) để pháp y.
async function windowsFull(session) {
  const wins = await session.listWindows();
  const out = [];
  for (const w of wins) {
    const at = await session.x11.getWindowAttributes(w.id).catch(() => null);
    out.push({ ...w, mapState: at ? at.mapState : null, overrideRedirect: at ? at.overrideRedirect : null });
  }
  return out;
}
function fmtWins(wins) {
  return wins.map((w) => `${w.title || "(không tên)"} 0x${w.id.toString(16)} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y} map=${w.mapState} ovr=${w.overrideRedirect}`).join(" | ");
}
async function closePopup(session) {
  await session.x11.pressEscape();
  await sleep(500);
  const wins = await session.listWindows();
  const small = wins.filter((w) => w.geo.width < 700 && w.geo.height < 700 && !/clipboard/i.test(w.title));
  if (small.length > 0) note(`closePopup: sau Escape vẫn còn cửa sổ nhỏ: ${fmtWins(small)}`);
  return small.length === 0;
}
async function verifyBridge(session) {
  const r = await session.cdp.evaluate(`JSON.stringify({hasApi: !!window.vcutDesktop, onMenuAction: typeof window.vcutDesktop?.onMenuAction, onOpenFile: typeof window.vcutDesktop?.onOpenFile, onLanguageChanged: typeof window.vcutDesktop?.onLanguageChanged, h9: !!window.__h9, h9actions: Array.isArray(window.__h9?.actions)})`).then((s) => JSON.parse(s)).catch(() => null);
  return r;
}
async function waitSample(session, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const t = await session.bodyText().catch(() => "");
    if (t.includes("mau-1")) return true;
    await sleep(2000);
  }
  return false;
}
async function closeWelcomeModal(session) {
  const modalOpen = async () => (await session.bodyText()).includes("Chào mừng tới VCut Studio");
  let appeared = await modalOpen();
  if (!appeared) {
    const d = Date.now() + 30000;
    while (Date.now() < d && !(appeared = await modalOpen())) await sleep(2000);
  }
  if (!appeared) return { appeared: false, gone: true };
  await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
  await sleep(1000);
  const gone = !(await modalOpen());
  return { appeared, gone };
}

// Mở một top menu và GHI LẠI MỌI THỨ: bands live, vùng đen, tọa độ click,
// mọi cửa sổ mới theo thứ tự xuất hiện (kèm mapState + thử GetImage +
// textBands từng cái). Khác harness cũ ở 2 điểm quyết định: (1) không dừng
// ở cửa sổ mới đầu tiên (first-match có thể là cửa sổ phụ 200x200
// unmapped); (2) menubar shot và popup shot ghi ra 2 file khác nhau
// (harness cũ ghi đè cùng file nên shot lỗi để lại ảnh cửa sổ chính và
// trông như "popup là cửa sổ chính").
async function openMenuProbe(session, topIndex, tag, useClean, customCenters) {
  const before = await windowsFull(session);
  const beforeIds = before.map((w) => w.id);
  const mb = await menuBarBands(session, `j2-menubar-${tag}.png`);
  const strip = stripAnalysis(mb.img, mb.bottom);
  const liveBands = mb.bands.map((b) => Math.round(b.center));
  const centers = customCenters ?? ((useClean && CLEAN_CENTERS) ? CLEAN_CENTERS : liveBands);
  const clickX = centers[topIndex];
  const res = {
    bands: liveBands, blackRanges: strip.blackRanges, candidates: [], cleanCenters: CLEAN_CENTERS,
    clickX, clickY: mb.main.geo.y + 15, img: null, mainGeo: mb.main.geo, menu: MENU_NAMES[topIndex],
    ok: false, popup: null, reason: "", rows: [], stripBg: strip.bg, tag, topIndex, useClean: !!useClean,
  };
  if (clickX === undefined) {
    res.reason = `không có band cho topIndex ${topIndex} (live ${liveBands.length} dải: [${liveBands}])`;
    note(`openMenuProbe ${tag}: ${res.reason}; black=${JSON.stringify(strip.blackRanges)}`);
    return res;
  }
  const seen = new Map(); // id -> window + firstSeenMs (giữ thứ tự xuất hiện)
  const t0 = Date.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt === 1) {
      await session.x11.pressEscape(); await sleep(400);
      const mainNow = await session.mainWindow().catch(() => null);
      if (mainNow) { try { session.x11.setInputFocus(mainNow.id); } catch {} await sleep(400); }
    }
    const geo = attempt === 1 ? ((await session.mainWindow().catch(() => null))?.geo ?? mb.main.geo) : mb.main.geo;
    await session.x11.click(geo.x + clickX, geo.y + 15);
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const wins = await windowsFull(session);
      for (const w of wins) if (!beforeIds.includes(w.id) && !seen.has(w.id)) seen.set(w.id, { ...w, firstSeenMs: Date.now() - t0 });
      await sleep(200);
    }
    if (seen.size > 0) break;
    res[`attempt${attempt}NoWindow`] = true;
  }
  for (const [id, w] of seen) {
    let shot = null;
    try {
      const img = await session.shotWindowRaw(w);
      const sd = imageStddev(img);
      const rows = sd > 5 ? textBands(img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img.height }) : [];
      shot = { h: img.height, ok: true, rowCenters: rows.map((r) => Math.round(r.center)), rows: rows.length, stddev: +sd.toFixed(1), w: img.width };
    } catch (e) { shot = { error: String(e.message ?? e).slice(0, 120), ok: false }; }
    res.candidates.push({ firstSeenMs: w.firstSeenMs, geo: w.geo, id: `0x${id.toString(16)}`, mapState: w.mapState, overrideRedirect: w.overrideRedirect, shot, title: w.title });
  }
  const withRows = res.candidates
    .filter((c) => c.shot.ok && c.shot.rows > 0 && c.geo.width < 700 && c.geo.height < 700)
    .sort((a, b) => (b.shot.rows - a.shot.rows) || (a.firstSeenMs - b.firstSeenMs));
  if (withRows.length > 0) {
    const pick = withRows[0];
    const winObj = { geo: pick.geo, id: parseInt(pick.id, 16), title: pick.title };
    try {
      const s = await session.shotWindowStable(winObj, path.join(SHOTS, `j2-popup-${tag}.png`), 4000);
      // Tính lại rows trên frame ổn định cuối (geometry có thể đã đổi).
      const rows2 = textBands(s.img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: s.img.height });
      res.popup = pick;
      res.rows = rows2.map((r) => Math.round(r.center));
      res.img = s.img;
      res.ok = true;
      res.firstMatchId = res.candidates[0]?.id ?? null;
      res.firstMatchIsPopup = res.candidates[0]?.id === pick.id;
      res.rowsFromStable = rows2.length;
    } catch (e) { res.reason = `popup ứng viên ${pick.id} (${pick.geo.width}x${pick.geo.height}) nhưng shotWindowStable thất bại: ${String(e.message ?? e).slice(0, 150)}`; }
  } else {
    res.reason = "không có cửa sổ mới nào có dòng chữ (popup không mở, hoặc chỉ có cửa sổ phụ/unmapped — xem candidates)";
  }
  note(`openMenuProbe ${tag}: menu=${res.menu} useClean=${res.useClean} liveBands=[${liveBands}] clickX=${clickX} black=${JSON.stringify(strip.blackRanges)} candidates=${res.candidates.length} ok=${res.ok} rows=${res.rows.length} ${res.reason}`);
  return res;
}

// Click một hàng trong popup đã mở; đọc __h9.actions NGAY sau click để
// phân biệt: click trượt (popup còn mở) / click trúng nhưng IPC gãy
// (popup đóng, không action) / IPC tốt (popup đóng + action tới).
async function clickRowProbe(session, opened, rowIndex, tag, expectAction) {
  const label = MENU_ROWS_VI[opened.topIndex]?.[rowIndex] ?? `hàng ${rowIndex}`;
  const res = { expectAction, label, ok: false, popupGone: false, reason: "", rowIndex, tag };
  if (!opened.ok || rowIndex >= opened.rows.length) {
    res.reason = !opened.ok ? `popup không mở: ${opened.reason}` : `popup chỉ có ${opened.rows.length} dòng, cần ${rowIndex} ("${label}")`;
    record(`J2 ${tag}: ${label} → ${expectAction ? `action ${expectAction}` : "click trúng hàng (role)"}`, false, res.reason);
    return res;
  }
  const before = (await session.h9().catch(() => null)) ?? { actions: [] };
  const excBefore = session.cdp.events.filter((e) => e.method === "__exception__").length;
  const clipsBefore = (await session.clipInfo().catch(() => null)) ?? { count: -1, selected: -1 };
  const rowY = opened.rows[rowIndex];
  const fresh = (await session.listWindows()).find((w) => w.id === parseInt(opened.popup.id, 16));
  const geo = fresh ? fresh.geo : opened.popup.geo;
  const cx = geo.x + Math.round(opened.img.width / 2);
  const cy = geo.y + Math.round(rowY);
  res.clickAt = { imgH: opened.img.height, imgW: opened.img.width, popupGeo: geo, x: cx, y: cy };
  await session.x11.click(cx, cy);
  await sleep(700);
  const afterWins = await session.listWindows();
  res.popupGone = !afterWins.some((w) => w.id === parseInt(opened.popup.id, 16));
  const after = (await session.h9().catch(() => null)) ?? { actions: [] };
  res.newActions = (after.actions ?? []).slice((before.actions ?? []).length);
  const clipsAfter = (await session.clipInfo().catch(() => null)) ?? { count: -1, selected: -1 };
  res.clips = { after: clipsAfter.count, before: clipsBefore.count, selectedAfter: clipsAfter.selected };
  res.excDelta = session.cdp.events.filter((e) => e.method === "__exception__").length - excBefore;
  // expectAction null = mục role (tải lại/zoom/...) không gửi vcut:menu-action;
  // chỉ kiểm tra click làm popup đóng (không trượt) — hiệu ứng đo riêng ở caller.
  res.ok = expectAction ? (res.popupGone && res.newActions.includes(expectAction)) : res.popupGone;
  if (!res.ok) res.reason = `popupGone=${res.popupGone} newActions=${JSON.stringify(res.newActions)} (kỳ vọng "${expectAction}")`;
  await session.shotRoot(path.join(SHOTS, `j2-after-${tag}.png`)).catch(() => {});
  record(`J2 ${tag}: ${label} → ${expectAction ? `action ${expectAction}` : "click trúng hàng (role)"}`, res.ok,
    res.ok ? `popup đóng${expectAction ? ", action tới renderer" : ""}; clips ${res.clips.before}→${res.clips.after} (selected ${res.clips.selectedAfter}) exc+${res.excDelta}`
      : `${res.reason}; clips ${res.clips.before}→${res.clips.after} (selected ${res.clips.selectedAfter}) exc+${res.excDelta}; click tại (${cx},${cy}) popup ${geo.width}x${geo.height}@${geo.x},${geo.y}`);
  if (!res.popupGone) await closePopup(session);
  return res;
}

// Hover từng nấc tới một hàng (mở submenu) — theo mẫu cải tiến J3.
async function hoverSubmenuProbe(session, opened, itemIndex, tag) {
  const res = { itemIndex, label: MENU_ROWS_VI[opened.topIndex]?.[itemIndex] ?? `hàng ${itemIndex}`, ok: false, reason: "", sub: null, subRows: [] };
  if (!opened.ok || itemIndex >= opened.rows.length) {
    res.reason = !opened.ok ? `popup cha không mở: ${opened.reason}` : `popup cha chỉ có ${opened.rows.length} dòng`;
    return res;
  }
  const rowY = opened.rows[itemIndex];
  const fresh = (await session.listWindows()).find((w) => w.id === parseInt(opened.popup.id, 16));
  const geo = fresh ? fresh.geo : opened.popup.geo;
  const x = geo.x + Math.round(opened.img.width / 2);
  const y = geo.y + Math.round(rowY);
  const beforeIds = (await session.listWindows()).map((w) => w.id);
  const startY = geo.y + 10;
  for (let step = 1; step <= 3; step++) {
    await session.x11.mouseMove(x, Math.round(startY + (y - startY) * step / 3));
    await sleep(250);
  }
  await sleep(700);
  const deadline = Date.now() + 3000;
  let sub = null;
  while (Date.now() < deadline && !sub) {
    const wins = await session.listWindows();
    sub = wins.find((w) => !beforeIds.includes(w.id) && w.geo.width < 700 && w.geo.height < 700) ?? null;
    if (!sub) await sleep(200);
  }
  if (!sub) { res.reason = "không thấy submenu sau hover 3 nấc"; await closePopup(session); return res; }
  try {
    const s = await session.shotWindowStable(sub, path.join(SHOTS, `j2-sub-${tag}.png`), 4000);
    const rows = textBands(s.img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: s.img.height });
    res.sub = { geo: sub.geo, id: `0x${sub.id.toString(16)}`, title: sub.title };
    res.subRows = rows.map((r) => Math.round(r.center));
    res.subImg = s.img;
    res.ok = true;
  } catch (e) { res.reason = `submenu ${sub.geo.width}x${sub.geo.height} nhưng chụp thất bại: ${String(e.message ?? e).slice(0, 120)}`; }
  return res;
}

async function clickSubRowProbe(session, subProbe, subIndex, tag, expectAction, expectLang) {
  const res = { expectAction, ok: false, reason: "", subIndex, tag };
  if (!subProbe.ok || subIndex >= subProbe.subRows.length) {
    res.reason = !subProbe.ok ? `submenu không mở: ${subProbe.reason}` : `submenu chỉ có ${subProbe.subRows.length} dòng, cần ${subIndex}`;
    record(`J2 ${tag}: submenu hàng ${subIndex} → ${expectAction}`, false, res.reason);
    return res;
  }
  const before = await session.h9().catch(() => ({ actions: [], langs: [] }));
  const rowY = subProbe.subRows[subIndex];
  const fresh = (await session.listWindows()).find((w) => w.id === parseInt(subProbe.sub.id, 16));
  const geo = fresh ? fresh.geo : subProbe.sub.geo;
  const cx = geo.x + Math.round(subProbe.subImg.width / 2);
  const cy = geo.y + Math.round(rowY);
  await session.x11.click(cx, cy);
  await sleep(1000);
  const after = await session.h9().catch(() => ({ actions: [], langs: [] }));
  res.newActions = (after.actions ?? []).slice((before.actions ?? []).length);
  res.newLangs = (after.langs ?? []).slice((before.langs ?? []).length);
  res.ok = expectLang ? res.newLangs.includes(expectLang) : res.newActions.includes(expectAction);
  if (!res.ok) res.reason = `newActions=${JSON.stringify(res.newActions)} newLangs=${JSON.stringify(res.newLangs)} (kỳ vọng ${expectLang ? `lang ${expectLang}` : `action ${expectAction}`})`;
  record(`J2 ${tag}: submenu hàng ${subIndex} → ${expectLang ? `lang ${expectLang}` : expectAction}`, res.ok,
    res.ok ? `submenu đóng, ${expectLang ? `lang ${expectLang} tới renderer` : `action tới renderer`}` : `${res.reason}; click tại (${cx},${cy}) submenu ${geo.width}x${geo.height}@${geo.x},${geo.y}`);
  return res;
}

// Ctrl+Z bằng phím XTEST thật (không phải CDP Input): trên app desktop,
// Phase 10 G5 cố tình để DOM handler bỏ qua Ctrl+Z (menu accelerator xử
// lý qua IPC) nên phím CDP không bao giờ tới được undo — đó là artifact
// của probe, không phải bug sản phẩm. Phím XTEST thật đi đúng đường user:
// menu accelerator → vcut:menu-action → renderer.
async function keyboardCtrlZ(session, tag) {
  const clipsBefore = await session.clipInfo().catch(() => ({ count: -1 }));
  const main = await session.mainWindow();
  if (main) { try { session.x11.setInputFocus(main.id); } catch {} await sleep(400); }
  await session.x11.ctrlKeysym(0x7a); // 'z'
  await sleep(1000);
  const clipsAfter = await session.clipInfo().catch(() => ({ count: -1 }));
  const h9 = await session.h9().catch(() => null);
  const undoSeen = !!h9 && (h9.actions ?? []).includes("undo");
  const ok = clipsAfter.count > clipsBefore.count;
  record(`J2 ${tag}: Ctrl+Z phím thật (XTEST → menu accelerator) khôi phục clip`, ok, `clips ${clipsBefore.count} → ${clipsAfter.count}; action undo tới renderer: ${undoSeen}`);
  return { clipsAfter: clipsAfter.count, clipsBefore: clipsBefore.count, ok };
}

// ---------------- Các phase probe ----------------
async function phaseP0(session) {
  const info = await session.launchAppImage({ label: "j2-p0" });
  note(`J2 P0 launch OK: ${info.url} textLen=${info.textLen}`);
  await sleep(1500);
  note(`J2 P0 cửa sổ lúc khởi động: ${fmtWins(await windowsFull(session))}`);
  const sampleOk = await waitSample(session);
  const clips0 = await session.clipInfo().catch(() => ({ count: -1, labels: [] }));
  record("J2 P0 sample load (mau-1, 3 clip)", sampleOk && clips0.count >= 3,
    `sample=${sampleOk} clips=${clips0.count} labels=${JSON.stringify(clips0.labels)}`);
  const wm = await closeWelcomeModal(session);
  record("J2 P0 đóng welcome modal", wm.gone, wm.appeared ? "modal đã xuất hiện và đã đóng bằng nút Để sau" : "modal không xuất hiện");
  const bridge = await verifyBridge(session);
  record("J2 P0 bridge renderer: vcutDesktop.onMenuAction đã đăng ký", !!bridge && bridge.onMenuAction === "function" && bridge.h9 === true, JSON.stringify(bridge));
  const mb0 = await menuBarBands(session, "j2-menubar-clean.png");
  const strip0 = stripAnalysis(mb0.img, mb0.bottom);
  if (mb0.bands.length === 5) { CLEAN_CENTERS = mb0.bands.map((b) => Math.round(b.center)); CLEAN_GEO = mb0.main.geo; }
  record("J2 P0 menubar sạch: 5 dải (clean centers)", mb0.bands.length === 5,
    `bands=[${mb0.bands.map((b) => Math.round(b.center))}] black=${JSON.stringify(strip0.blackRanges)} bg=${strip0.bg}; main ${mb0.main.geo.width}x${mb0.main.geo.height}@${mb0.main.geo.x},${mb0.main.geo.y}`);
  if (!CLEAN_CENTERS) { CLEAN_CENTERS = [16, 70, 125, 171, 228]; note("J2 P0: menubar đã bị che ngay từ đầu — dùng centers M1 đợt 52 làm fallback, sẽ verify bằng popup Tệp ở P1"); }
}

// E1: mở từng menu đúng cách harness cũ (live bands), 2 vòng để thấy vùng
// đen tiến triển sau mỗi lần mở/đóng popup. Không click hàng nào.
async function phaseP1(session) {
  for (let round = 0; round < 2; round++) {
    for (let top = 0; top < 5; top++) {
      const tag = `p1-r${round}-m${top}`;
      const opened = await openMenuProbe(session, top, tag, false);
      const expected = MENU_ROWS_VI[top].length;
      const candStr = opened.candidates.map((c) => `${c.id} "${c.title}" ${c.geo.width}x${c.geo.height}@${c.geo.x},${c.geo.y} map=${c.mapState} first=${c.firstSeenMs}ms shot=${c.shot.ok ? `rows=${c.shot.rows} sd=${c.shot.stddev}` : "ERR:" + c.shot.error}`).join(" | ");
      const rightMenu = opened.ok && opened.rows.length === expected;
      record(`J2 P1 r${round} menu ${MENU_NAMES[top]} harness-way: popup đúng menu (${expected} hàng)`, rightMenu,
        opened.ok
          ? `rows=${opened.rows.length} (kỳ vọng ${expected}); firstMatchIsPopup=${opened.firstMatchIsPopup}; liveBands=[${opened.bands}] black=${JSON.stringify(opened.blackRanges)}; candidates: ${candStr}`
          : `popup không mở/chụp được: ${opened.reason}; liveBands=[${opened.bands}] black=${JSON.stringify(opened.blackRanges)}; candidates: ${candStr}`);
      if (opened.ok) await closePopup(session);
      else { await session.x11.pressEscape(); await sleep(400); }
      await sleep(400);
    }
  }
}

// E2: biên M9→M10 — Dự án mới (clean) rồi Hoàn tác / Làm lại (clean).
async function phaseP2(session) {
  {
    const opened = await openMenuProbe(session, 0, "p2-file", true);
    await clickRowProbe(session, opened, 0, "p2-new", "new-project");
    const clips = await session.clipInfo();
    record("J2 P2 sau Dự án mới: timeline về 0 clip", clips.count === 0, `clips=${clips.count}`);
  }
  {
    const opened = await openMenuProbe(session, 1, "p2-edit", true);
    await clickRowProbe(session, opened, 0, "p2-undo", "undo");
    const clips = await session.clipInfo();
    record("J2 P2 Hoàn tác sau Dự án mới: clip khôi phục về 3", clips.count >= 3, `clips=${clips.count} labels=${JSON.stringify(clips.labels)}`);
  }
  {
    const opened = await openMenuProbe(session, 1, "p2-edit-redo", true);
    await clickRowProbe(session, opened, 1, "p2-redo", "redo");
    const clips = await session.clipInfo();
    record("J2 P2 Làm lại: clip về 0", clips.count === 0, `clips=${clips.count}`);
  }
}

// E3: launch mới (sample tươi 3 clip) rồi quét toàn bộ hàng Chỉnh sửa.
async function phaseP3(session) {
  await session.closeAppClean();
  const info = await session.launchAppImage({ label: "j2-p3" });
  note(`J2 P3 relaunch OK: ${info.url} textLen=${info.textLen}`);
  await sleep(1500);
  const sampleOk = await waitSample(session);
  const clips = await session.clipInfo().catch(() => ({ count: -1 }));
  record("J2 P3 relaunch: sample mới 3 clip (loại cascade timeline trống)", sampleOk && clips.count >= 3, `sample=${sampleOk} clips=${clips.count}`);
  await closeWelcomeModal(session);
  const bridge = await verifyBridge(session);
  record("J2 P3 bridge sau relaunch", !!bridge && bridge.onMenuAction === "function" && bridge.h9 === true, JSON.stringify(bridge));
  {
    const mb = await menuBarBands(session, "j2-menubar-clean-p3.png");
    const strip = stripAnalysis(mb.img, mb.bottom);
    if (mb.bands.length === 5) { CLEAN_CENTERS = mb.bands.map((b) => Math.round(b.center)); note(`J2 P3 clean centers mới: [${CLEAN_CENTERS}]`); }
    else note(`J2 P3 menubar sau relaunch chỉ có ${mb.bands.length} dải (black=${JSON.stringify(strip.blackRanges)}) — giữ centers cũ [${CLEAN_CENTERS}]`);
  }
  const runSweep = async (steps) => {
    for (const [row, action, tag, expectClips] of steps) {
      const opened = await openMenuProbe(session, 1, tag, true);
      await clickRowProbe(session, opened, row, tag, action);
      if (expectClips !== null) {
        const c = await session.clipInfo();
        record(`J2 ${tag}: clips kỳ vọng ${expectClips}`, c.count === expectClips, `clips=${c.count} (selected ${c.selected})`);
      }
      await sleep(300);
    }
  };
  await runSweep([
    [7, "select-all", "p3-selectall-1", null],
    [3, "copy", "p3-copy", null],
    [4, "paste", "p3-paste", 6],
    [0, "undo", "p3-undo-paste", 3],
    [7, "select-all", "p3-selectall-2", null],
    [5, "duplicate", "p3-duplicate", 6],
    [0, "undo", "p3-undo-dup", 3],
    [7, "select-all", "p3-selectall-3", null],
    [2, "cut", "p3-cut", 0],
  ]);
  // E6: undo bằng bàn phím (không qua menu chuột) sau khi cắt.
  await keyboardCtrlZ(session, "p3-kb-undo-cut");
  await runSweep([
    [7, "select-all", "p3-selectall-4", null],
    [6, "delete", "p3-delete", 0],
    [0, "undo", "p3-undo-delete", 3],
    [1, "redo", "p3-redo", 0],
  ]);
}

// P4: menu Xem — Tải lại (role), zoom, toàn màn hình, DevTools, Ngôn ngữ.
async function phaseP4(session) {
  // M16: Tải lại (role — không gửi action; kiểm bằng marker mất + remount).
  {
    await session.cdp.evaluate(`window.__h9ReloadMarker = "truoc-reload"`);
    const opened = await openMenuProbe(session, 2, "p4-view", true);
    const r = await clickRowProbe(session, opened, 0, "p4-reload", null);
    let info = null; let markerGone = false;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      try {
        info = await session.cdp.evaluate(`JSON.stringify({marker: typeof window.__h9ReloadMarker === "undefined" ? null : window.__h9ReloadMarker, rootChildren: document.querySelector("#root") ? document.querySelector("#root").children.length : -1, textLen: document.body ? document.body.innerText.length : 0})`).then((s) => JSON.parse(s));
        if (info && info.rootChildren > 0 && info.textLen > 300) { markerGone = info.marker === null; break; }
      } catch {}
      await sleep(1000);
    }
    const alive = !!info && info.rootChildren > 0 && info.textLen > 300;
    if (alive) await session.installProbes();
    record("J2 P4 Tải lại (role reload): trang reload thật, editor mount lại", r.popupGone && alive && markerGone,
      `click trúng hàng: ${r.popupGone}; marker sau reload: ${info?.marker ?? "?"} (mất = reload thật); rootChildren=${info?.rootChildren}, textLen=${info?.textLen}; probes cài lại: ${alive}`);
  }
  // M17: Phóng to (hàng 4) rồi Đặt lại (hàng 3).
  {
    const w0 = await session.cdp.evaluate(`window.innerWidth`);
    const o1 = await openMenuProbe(session, 2, "p4-zoomin", true);
    const r1 = await clickRowProbe(session, o1, 4, "p4-zoomin", null);
    await sleep(800);
    const w1 = await session.cdp.evaluate(`window.innerWidth`);
    const o2 = await openMenuProbe(session, 2, "p4-zoomreset", true);
    const r2 = await clickRowProbe(session, o2, 3, "p4-zoomreset", null);
    await sleep(800);
    const w2 = await session.cdp.evaluate(`window.innerWidth`);
    record("J2 P4 Phóng to / Đặt lại mức thu phóng (role zoom)", r1.popupGone && r2.popupGone && w1 < w0 && Math.abs(w2 - w0) <= 2,
      `innerWidth ${w0} → phóng to ${w1} → reset ${w2}; click trúng: ${r1.popupGone}/${r2.popupGone}`);
  }
  // M18: Toàn màn hình bật/tắt.
  {
    const main0 = await session.mainWindow();
    const o1 = await openMenuProbe(session, 2, "p4-fs", true);
    const r1 = await clickRowProbe(session, o1, 6, "p4-fs", null);
    await sleep(1000);
    const main1 = await session.mainWindow();
    const isFs = main1 && main1.geo.width === SCREEN.w && main1.geo.height === SCREEN.h;
    const o2 = await openMenuProbe(session, 2, "p4-fs-off", true);
    const r2 = await clickRowProbe(session, o2, 6, "p4-fs-off", null);
    await sleep(1000);
    const main2 = await session.mainWindow();
    const back = main2 && main2.geo.width === main0.geo.width && main2.geo.height === main0.geo.height;
    record("J2 P4 Toàn màn hình: bật/tắt, geometry đổi thật", r1.popupGone && r2.popupGone && isFs && back,
      `trước ${main0.geo.width}x${main0.geo.height} → FS ${main1?.geo.width}x${main1?.geo.height} → về ${main2?.geo.width}x${main2?.geo.height}`);
  }
  // M20: Công cụ nhà phát triển (role).
  {
    const opened = await openMenuProbe(session, 2, "p4-devtools", true);
    const r = await clickRowProbe(session, opened, 2, "p4-devtools", null);
    await sleep(1500);
    const list = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 3000);
    const dt = Array.isArray(list.json) ? list.json.find((t) => /devtools/i.test(t.url ?? "") || t.title === "DevTools") : null;
    let closed = false;
    if (dt) {
      try {
        const cdp2 = new Cdp(dt.webSocketDebuggerUrl); await cdp2.connect();
        await cdp2.send("Target.closeTarget", { targetId: dt.id }).catch(() => {});
        cdp2.close();
      } catch {}
      await sleep(1000);
      const list2 = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 3000);
      closed = !Array.isArray(list2.json) || !list2.json.some((t) => t.id === dt.id);
    }
    record("J2 P4 Công cụ nhà phát triển: DevTools mở thật, đóng được", r.popupGone && !!dt && closed,
      `click trúng hàng: ${r.popupGone}; DevTools target: ${dt ? dt.url.slice(0, 60) : "không thấy"}; đóng xong: ${closed}`);
  }
  // M19: Ngôn ngữ EN → về VI (submenu).
  {
    const opened = await openMenuProbe(session, 2, "p4-lang-en", true);
    const sub = await hoverSubmenuProbe(session, opened, 7, "p4-lang-en");
    record("J2 P4 Ngôn ngữ: submenu mở", sub.ok, sub.ok ? `submenu ${sub.sub.geo.width}x${sub.sub.geo.height}, ${sub.subRows.length} dòng` : sub.reason);
    if (sub.ok) {
      const r = await clickSubRowProbe(session, sub, 1, "p4-lang-en-click", null, "en");
      await sleep(1200);
      const textEn = await session.bodyText();
      const webEn = /Export/.test(textEn) && !/Xuất/.test(textEn);
      const mbEn = await menuBarBands(session, "j2-menubar-en.png");
      record("J2 P4 Ngôn ngữ English: web + menu đổi sang tiếng Anh", r.ok && webEn,
        `lang en tới renderer: ${r.ok}; web có chữ tiếng Anh: ${webEn}; menu bar EN ${mbEn.bands.length} dải centers=[${mbEn.bands.map((b) => Math.round(b.center))}]`);
      // Về VI: dùng live bands tiếng Anh vừa đo (centers VI không còn đúng).
      const enCenters = mbEn.bands.length === 5 ? mbEn.bands.map((b) => Math.round(b.center)) : null;
      const opened2 = await openMenuProbe(session, 2, "p4-lang-vi", false, enCenters);
      const sub2 = await hoverSubmenuProbe(session, opened2, 7, "p4-lang-vi");
      if (sub2.ok) {
        const r2 = await clickSubRowProbe(session, sub2, 0, "p4-lang-vi-click", null, "vi");
        await sleep(1200);
        const textVi = await session.bodyText();
        const backVi = /Xuất/.test(textVi) && !/Export/.test(textVi);
        const mbVi = await menuBarBands(session, "j2-menubar-back-vi.png");
        if (mbVi.bands.length === 5) CLEAN_CENTERS = mbVi.bands.map((b) => Math.round(b.center));
        record("J2 P4 Ngôn ngữ về Tiếng Việt", r2.ok && backVi, `lang vi tới renderer: ${r2.ok}; web về tiếng Việt: ${backVi}; menubar VI ${mbVi.bands.length} dải`);
      } else {
        record("J2 P4 Ngôn ngữ về Tiếng Việt", false, `submenu Ngôn ngữ không mở lại: ${sub2.reason}`);
        await closePopup(session);
      }
    } else {
      await closePopup(session);
    }
  }
}

// P5: menu Trợ giúp — dialog About/Shortcuts/ReportBug + openExternal.
async function phaseP5(session) {
  const dialogCase = async (rowIndex, titlePart, tag, label) => {
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const opened = await openMenuProbe(session, 4, tag, true);
    const r = await clickRowProbe(session, opened, rowIndex, tag, null);
    let dlg = r.popupGone ? await waitWindow(session, titlePart, 6000) : null;
    if (r.popupGone && !dlg) dlg = await waitAnyDialog(session, winsBefore, 3000);
    let ok = false; let detail = r.popupGone ? "" : `click trượt: ${r.reason}`;
    if (dlg) {
      const btn = await clickDialogButton(session, dlg, 0, `j2-dlg-${tag}.png`);
      const gone = await waitWindowGone(session, dlg.id, 5000);
      ok = btn.ok && gone;
      detail = `dialog "${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}, nút Đóng click được: ${btn.ok}, dialog đóng: ${gone}`;
    } else if (r.popupGone) detail = `không thấy dialog "${titlePart}"`;
    record(`J2 P5 ${label}: dialog native xuất hiện, Đóng đóng được`, r.popupGone && ok, detail);
  };
  await dialogCase(0, "Giới thiệu", "p5-about", "Giới thiệu");
  await dialogCase(1, "Phím tắt", "p5-shortcuts", "Phím tắt");
  await dialogCase(3, "Báo lỗi", "p5-reportbug", "Báo lỗi");
  for (const [row, tag, label] of [[2, "p5-docs", "Tài liệu hướng dẫn"], [4, "p5-github", "VCut Studio trên GitHub"]]) {
    const opened = await openMenuProbe(session, 4, tag, true);
    const r = await clickRowProbe(session, opened, row, tag, null);
    await sleep(1500);
    const alive = session.child.exitCode === null;
    const text = await session.bodyText().catch(() => "");
    record(`J2 P5 ${label}: openExternal không crash app`, r.popupGone && alive && text.length > 300,
      `click trúng hàng: ${r.popupGone}; app còn chạy: ${alive}; textLen=${text.length}`);
  }
}

// P6: menu Cửa sổ — Thu nhỏ rồi Đóng cửa sổ (app thoát; chạy CUỐI trên instance này).
async function phaseP6(session) {
  {
    const main0 = await session.mainWindow();
    const opened = await openMenuProbe(session, 3, "p6-window", true);
    const r = await clickRowProbe(session, opened, 0, "p6-min", null);
    await sleep(1000);
    const st = await session.x11.getWindowAttributes(main0.id).catch(() => null);
    const unmapped = st ? st.mapState !== 2 : false;
    session.x11.mapWindow(main0.id);
    await sleep(1200);
    const st2 = await session.x11.getWindowAttributes(main0.id).catch(() => null);
    const viewable = st2 ? st2.mapState === 2 : false;
    const main2 = await session.mainWindow();
    record("J2 P6 Thu nhỏ cửa sổ: Unmapped thật, XMapWindow hiện lại", r.popupGone && unmapped && viewable && !!main2,
      `click trúng hàng: ${r.popupGone}; sau Thu nhỏ map-state=${st?.mapState} (2=Viewable); sau XMapWindow map-state=${st2?.mapState}, cửa sổ còn trong tree: ${!!main2}`);
  }
  {
    const opened = await openMenuProbe(session, 3, "p6-window-close", true);
    const r = await clickRowProbe(session, opened, 1, "p6-close", null);
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && session.child.exitCode === null) await sleep(250);
    const exited = session.child.exitCode !== null;
    const leftover = await run("pgrep", ["-f", `remote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 });
    record("J2 P6 Đóng cửa sổ (role close): app thoát, không mồ côi", r.popupGone && exited && leftover.code !== 0,
      `click trúng hàng: ${r.popupGone}; exitCode=${session.child.exitCode}; pgrep còn tiến trình: ${leftover.code === 0}`);
    if (session.cdp) { session.cdp.close(); session.cdp = null; }
  }
}

// P7: launch với fixture argv + seed recent qua noteProjectOpened + hover Mở gần đây (M7).
async function phaseP7(session) {
  const okFx = await requireFixture(FIXTURE1);
  record("J2 P7 fixture H9-Fixture.vcut tồn tại + hợp lệ", okFx, FIXTURE1);
  if (!okFx) return;
  const info = await session.launchAppImage({ argvFiles: [FIXTURE1], label: "j2-p7" });
  note(`J2 P7 launch OK: ${info.url} textLen=${info.textLen}`);
  await sleep(2500);
  const after = await session.h9();
  const nameInputs = (await session.projectName()).inputs;
  const cur = await session.currentPath();
  record("J2 P7 argv .vcut: project load đúng", after.openFiles.includes(FIXTURE1) && nameInputs.includes("H9 Doubleclick") && cur === FIXTURE1,
    `onOpenFile: ${after.openFiles.includes(FIXTURE1)}; tên trong ô nhập: ${JSON.stringify(nameInputs)} (kỳ vọng "H9 Doubleclick"); currentPath=${cur}`);
  await closeWelcomeModal(session);
  // Seed recent: gọi thẳng bridge noteProjectOpened (main: settings.addRecent + rebuild menu).
  const noted = await session.cdp.evaluate(`window.vcutDesktop ? window.vcutDesktop.noteProjectOpened(${JSON.stringify(FIXTURE1)}).then((r) => JSON.stringify(r)).catch((e) => "ERR:" + e.message) : "NO-API"`, true).catch((e) => "ERR:" + e.message);
  await sleep(1200);
  const settings = await settingsJson();
  note(`J2 P7 noteProjectOpened: ${noted}; recentProjects: ${JSON.stringify(settings?.recentProjects ?? null)}`);
  record("J2 P7 seed recent: fixture có trong recentProjects", Array.isArray(settings?.recentProjects) && settings.recentProjects.includes(FIXTURE1),
    `recent=${JSON.stringify(settings?.recentProjects ?? null)}`);
  const opened = await openMenuProbe(session, 0, "p7-file", true);
  const sub = await hoverSubmenuProbe(session, opened, 3, "p7-recent");
  record("J2 P7 Mở gần đây: submenu mở", sub.ok, sub.ok ? `submenu ${sub.sub.geo.width}x${sub.sub.geo.height}, ${sub.subRows.length} dòng` : sub.reason);
  if (sub.ok && sub.subRows.length > 0) {
    const before = await session.h9();
    const nBefore = before.openFiles.filter((p) => p === FIXTURE1).length;
    const rowY = sub.subRows[0];
    const fresh = (await session.listWindows()).find((w) => w.id === parseInt(sub.sub.id, 16));
    const geo = fresh ? fresh.geo : sub.sub.geo;
    await session.x11.click(geo.x + Math.round(sub.subImg.width / 2), geo.y + Math.round(rowY));
    await sleep(1500);
    const after2 = await session.h9();
    const nAfter = after2.openFiles.filter((p) => p === FIXTURE1).length;
    const nameInputs2 = (await session.projectName()).inputs;
    record("J2 P7 click entry gần đây: onOpenFile nhận lại file + load đúng", nAfter > nBefore && nameInputs2.includes("H9 Doubleclick"),
      `onOpenFile ${FIXTURE1}: ${nBefore} → ${nAfter} lần; tên trong ô nhập: ${JSON.stringify(nameInputs2)}`);
  }
  await closePopup(session);
}

// ---------------- main ----------------
async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(SHOTS, { recursive: true });
  await fs.mkdir(TESTDIR, { recursive: true });
  await fs.rm(USERDATA, { recursive: true, force: true });
  note("J2 main: đã xóa user-data-dir cũ — chạy với profile mới");
  const sha = await run("sha256sum", [APPIMAGE], { timeoutMs: 30000 });
  const appImageSha = sha.stdout.split(/\s+/)[0];
  const shaRel = await run("sha256sum", [APPIMAGE_DEFAULT], { timeoutMs: 30000 });
  const releaseSha = (shaRel.stdout.split(/\s+/)[0] ?? "").trim();
  // Bản da2b85d5… (đợt 52) đã bị luồng J4 rebuild xóa khỏi release/ lúc
  // ~21:08–21:15; probe chạy trên bản build mới của J4 (package 21:25,
  // 401.060.440 byte, bundle web index-CwcDTNVS.js, có dialog nhập tên
  // trong app thay window.prompt — M3/D3 thuộc phạm vi J4). Menu M10–M26
  // không đổi theo bản build này: menu.ts mtime 08:56, preload.ts 18:27
  // (cùng đợt 52); desktop.ts chỉ đổi ở flow Lưu thành… (J4).
  const knownFresh = "d5cbe6fe8eb27ea8539ed76de27af197b1c1573db3a1e4cc360ccb503c69dac5";
  const size = (await fs.stat(APPIMAGE)).size;
  const sameAsRelease = releaseSha !== "" && appImageSha === releaseSha;
  const isKnownFresh = appImageSha === knownFresh;
  record("J2 PRE AppImage: bản test đã xác minh (build mới J4 21:25, 401MB)", sameAsRelease || isKnownFresh,
    `test sha=${appImageSha.slice(0, 16)}… (${size} byte); release/ sha=${releaseSha ? releaseSha.slice(0, 16) + "…" : "(không còn AppImage)"}; knownFresh=${isKnownFresh}`);
  if (!sameAsRelease && !isKnownFresh) throw new Error("AppImage test không khớp release/ lẫn bản fresh đã verify — dừng để không test nhầm bản");
  const fx = await ensureFixtures();
  note(`J2 PRE fixtures: ${fx}`);
  const session = new AppSession();
  try {
    // Xvfb đôi khi exit 1 ngay do xkbcomp race (đợt 52 §7) — thử lại tối
    // đa 4 lần, mỗi lần dọn lock + kill Xvfb cũ của display này trước.
    let xvfbOk = false;
    for (let a = 1; a <= 4 && !xvfbOk; a++) {
      try {
        await session.startXvfb();
        xvfbOk = true;
      } catch (e) {
        note(`J2 startXvfb lần ${a} thất bại: ${e.message} — dọn và thử lại sau 3s`);
        await run("pkill", ["-f", `[X]vfb :${DISPLAY_NUM}`], { timeoutMs: 15000 }).catch(() => {});
        await sleep(3000);
      }
    }
    if (!xvfbOk) throw new Error("startXvfb thất bại sau 4 lần thử (xkbcomp race?)");
    const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
    if (only === "p8") {
      await phaseP8(session);
    } else if (only === "p4567") {
      await phaseP0(session);
      await phaseP4(session);
      await phaseP5(session);
      await phaseP6(session);
      await phaseP7(session);
    } else {
      await phaseP0(session);
      await phaseP1(session);
      await phaseP2(session);
      await phaseP3(session);
      await phaseP4(session);
      await phaseP5(session);
      await phaseP6(session);
      await phaseP7(session);
    }
  } catch (e) {
    record("J2 probe: crash giữa chừng (xem log)", false, String(e?.message ?? e));
    note("J2 probe crash: " + (e?.stack ?? String(e)).slice(0, 800));
  } finally {
    if (session.child && session.child.exitCode === null) await session.closeAppClean().catch(() => {});
    await session.stopXvfb();
    try {
      const tmpFiles = await fs.readdir("/tmp").catch(() => []);
      for (const f of tmpFiles.filter((x) => x.startsWith("h9-j2-") && x.endsWith(".log"))) {
        await fs.copyFile(path.join("/tmp", f), path.join(OUT, f)).catch(() => {});
      }
      const sj = await fs.readFile(path.join(USERDATA, "settings.json"), "utf8").catch(() => null);
      if (sj) await writeFileEpermRetryAsync(path.join(OUT, "settings-after.json"), sj);
    } catch {}
  }
  report.finishedAt = new Date().toISOString();
  report.passed = report.cases.filter((c) => c.ok).length;
  report.failed = report.cases.filter((c) => !c.ok).length;
  await writeFileEpermRetryAsync(path.join(OUT, "h9-report-j2.json"), JSON.stringify(report, null, 2));
  console.log(`\nJ2 SUMMARY: ${report.passed} passed, ${report.failed} failed — report: ${path.join(OUT, "h9-report-j2.json")}`);
  process.exit(report.failed ? 1 : 0);
}

main().catch((e) => {
  console.error("J2 PROBE ERROR:", e);
  process.exit(2);
});

// P8: GTK dialog có tạo vùng đen trên menubar → làm lệch bands → click
// trượt (giả thuyết nhân quả cho M10–M26 đợt 52)? Mở/đóng dialog "Mở
// dự án…" rồi đo lại bands + thử mở Chỉnh sửa theo cách harness cũ.
// Chỉ chạy với --only p8 (sau lượt P0–P7).
async function phaseP8(session) {
  await phaseP0(session);
  // Baseline: Chỉnh sửa harness-way + click Chọn tất cả (IPC tốt trước dialog?).
  {
    const opened = await openMenuProbe(session, 1, "p8-base-edit", false);
    const r = await clickRowProbe(session, opened, 7, "p8-base-selectall", "select-all");
    const c = await session.clipInfo();
    record("J2 P8 baseline trước dialog: Chọn tất cả tới renderer", r.ok && c.selected === 3, `click trúng: ${r.popupGone}; selected=${c.selected}`);
  }
  for (let round = 0; round < 2; round++) {
    // Mở dialog GTK "Mở dự án…" (Tệp hàng 1) bằng tọa độ sạch.
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const opened = await openMenuProbe(session, 0, `p8-open-${round}`, true);
    const r = await clickRowProbe(session, opened, 1, `p8-open-${round}`, null); // Mở dự án… không gửi action (mở dialog ở main)
    let dlg = r.popupGone ? await waitWindow(session, "Mở dự án", 6000) : null;
    if (r.popupGone && !dlg) dlg = await waitAnyDialog(session, winsBefore, 3000);
    record(`J2 P8 v${round} dialog Mở dự án mở`, r.popupGone && !!dlg, dlg ? `dialog "${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}` : "không thấy dialog");
    if (dlg) {
      // Đo menubar NGAY khi dialog đang mở (dialog che cửa sổ chính).
      const mbDuring = await menuBarBands(session, `j2-menubar-p8-during-${round}.png`);
      const stripDuring = stripAnalysis(mbDuring.img, mbDuring.bottom);
      await session.x11.pressEscape(); await sleep(1000);
      const dlgGone = !(await session.listWindows()).some((w) => w.id === dlg.id);
      // Đo lại sau khi dialog đóng.
      const mbAfter = await menuBarBands(session, `j2-menubar-p8-after-${round}.png`);
      const stripAfter = stripAnalysis(mbAfter.img, mbAfter.bottom);
      record(`J2 P8 v${round} menubar sau dialog: bands + vùng đen`, dlgGone,
        `dialog đóng: ${dlgGone}; lúc mở: bands=[${mbDuring.bands.map((b) => Math.round(b.center))}] black=${JSON.stringify(stripDuring.blackRanges)}; sau đóng: bands=[${mbAfter.bands.map((b) => Math.round(b.center))}] black=${JSON.stringify(stripAfter.blackRanges)}`);
      // Thử mở Chỉnh sửa theo cách harness cũ NGAY sau dialog.
      const opened2 = await openMenuProbe(session, 1, `p8-edit-after-${round}`, false);
      const rightMenu = opened2.ok && opened2.rows.length === 8;
      record(`J2 P8 v${round} Chỉnh sửa harness-way sau dialog: popup đúng menu`, rightMenu,
        opened2.ok ? `rows=${opened2.rows.length}; liveBands=[${opened2.bands}] black=${JSON.stringify(opened2.blackRanges)}; clickX=${opened2.clickX}` : `không mở được: ${opened2.reason}; liveBands=[${opened2.bands}] black=${JSON.stringify(opened2.blackRanges)}`);
      if (opened2.ok) {
        const r2 = await clickRowProbe(session, opened2, 0, `p8-undo-after-${round}`, "undo");
        record(`J2 P8 v${round} Hoàn tác sau dialog: action tới renderer`, r2.ok, r2.ok ? "popup đóng, action undo tới" : r2.reason);
      } else {
        await session.x11.pressEscape(); await sleep(400);
      }
      // Thử khắc phục: unmap cửa sổ 200x200 rồi đo lại bands.
      const wins = await windowsFull(session);
      const w200 = wins.find((w) => w.geo.width === 200 && w.geo.height === 200);
      if (w200) {
        session.x11.unmapWindow(w200.id);
        await sleep(600);
        const mbFixed = await menuBarBands(session, `j2-menubar-p8-unmap-${round}.png`);
        const stripFixed = stripAnalysis(mbFixed.img, mbFixed.bottom);
        record(`J2 P8 v${round} unmap 200x200: menubar hồi không`, mbFixed.bands.length === 5,
          `sau unmap: bands=[${mbFixed.bands.map((b) => Math.round(b.center))}] black=${JSON.stringify(stripFixed.blackRanges)}`);
        // Không map lại — cửa sổ phụ unmapped là vô hại (D6 đợt 52).
      }
    }
  }
  // P8b: fullscreen (M18) ẩn thanh menu — có thoát được bằng F11 không?
  // Lượt full P0–P7: click Toàn màn hình làm menu biến mất (bands [591,685])
  // và mọi menu sau đó trượt theo. Thử F11 (phím XTEST thật) rồi Escape.
  {
    const o1 = await openMenuProbe(session, 2, "p8b-fs-on", true);
    const r1 = await clickRowProbe(session, o1, 6, "p8b-fs-on", null);
    await sleep(1000);
    const mbFs = await menuBarBands(session, "j2-menubar-p8b-fs-on.png");
    const menuGone = mbFs.bands.length !== 5;
    record("J2 P8b fullscreen bật: thanh menu biến mất (bands khác 5)", r1.popupGone && menuGone,
      `click trúng: ${r1.popupGone}; bands sau FS-on: [${mbFs.bands.map((b) => Math.round(b.center))}]`);
    let recovered = false; let how = "không";
    // F11 (keysym 0xffc8) — phím tắt chuẩn thoát fullscreen của Chromium.
    await session.x11.pressKeysym(0xffc8); await sleep(1200);
    const mbF11 = await menuBarBands(session, "j2-menubar-p8b-after-f11.png");
    if (mbF11.bands.length === 5) { recovered = true; how = "F11"; }
    if (!recovered) {
      await session.x11.pressEscape(); await sleep(1200);
      const mbEsc = await menuBarBands(session, "j2-menubar-p8b-after-esc.png");
      if (mbEsc.bands.length === 5) { recovered = true; how = "Escape"; }
    }
    record("J2 P8b thoát fullscreen: thanh menu hiện lại", recovered,
      `khôi phục bằng: ${how}; bands sau F11: [${mbF11.bands.map((b) => Math.round(b.center))}]`);
    if (recovered) {
      const o2 = await openMenuProbe(session, 1, "p8b-edit-after", false);
      const r2 = await clickRowProbe(session, o2, 0, "p8b-undo-after", "undo");
      record("J2 P8b sau thoát fullscreen: menu Chỉnh sửa mở + Hoàn tác tới renderer", o2.ok && r2.ok,
        o2.ok ? (r2.ok ? "popup đúng, action undo tới" : r2.reason) : `popup không mở: ${o2.reason}`);
    }
  }
}

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
let CDP_PORT = process.argv.includes("--cdp-port") ? parseInt(process.argv[process.argv.indexOf("--cdp-port") + 1], 10) : 9231; // let: launchAppImage có thể đổi sang 9241 nếu 9231 bị tiến trình lạ giữ (H8 dùng 9233/9234 cho smoke). ROUND53-J4: --cdp-port để các luồng chạy song song không tranh cổng CDP (đợt 53: J3 giữ 9231, CDP nối nhầm sang app của luồng khác → không thấy cửa sổ trên display của mình).
const TMPDISK = path.join(os.homedir(), "workspace/.tmp-h9");
// ROUND54-K2 (nguyên nhân gốc D4 exit 127): AppImage EXTRACT_AND_RUN
// giải nén vào $TMPDIR/appimage_extracted_<md5-nội-dung-AppImage> — các
// bản AppImage CÙNG content dùng chung MỘT thư mục này (md5 tính trên
// nội dung file, không phải đường dẫn), và runtime nào thoát cũng XÓA
// thư mục (exit-cleanup). Hậu quả đo được (lượt K2 07/11): D4b launch
// fail "Failed to run .../AppRun: No such file or directory" → runtime
// trả 127; thí nghiệm đối chứng: instance 2 thoát code 0 xong thư mục
// giải nén BIẾN MẤT ngay, instance 1 đang chạy mất file → thoát 127 khi
// đóng sạch. Tách TMPDIR theo display (mỗi luồng một display) + tách
// riêng instance thứ hai để lần thoát của nó không xóa thư mục của
// instance 1. LƯU Ý: TMPDIR phải NGẮN — SingletonSocket của Chromium
// giới hạn 108 ký tự (TMPDIR dài từng làm app FATAL "Socket path too
// long" ở thí nghiệm bản 1); đường dẫn dưới đây chỉ ~40 ký tự.
const TMPDIR_RUN = path.join(TMPDISK, `d${DISPLAY_NUM}`);
const TMPDIR_SECOND = path.join(TMPDIR_RUN, "second");

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
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.events = []; this.dialogs = []; this.autoAcceptDialogs = true; }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; setTimeout(() => rej(new Error("ws timeout")), 15000); });
    this.ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id && this.pending.has(m.id)) { const p = this.pending.get(m.id); this.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return; }
      this.events.push(m);
      if (m.method === "Page.javascriptDialogOpening") {
        this.dialogs.push({ at: Date.now(), message: m.params.message, type: m.params.type });
        // ROUND54-K4: ghi log lựa chọn — nhưng CHỈ ghi "auto-accept" khi
        // thật sự gửi handle (probe tắt auto-accept thì event vẫn tới mà
        // không được trả lời; log sai sẽ che mất dialog treo).
        if (!this.autoAcceptDialogs) {
          note(`CDP dialog thấy nhưng KHÔNG auto-accept (probe đang tắt): ${m.params.type} "${String(m.params.message ?? "").slice(0, 80)}"`);
          return;
        }
        note(`CDP dialog auto-accept: ${m.params.type} "${String(m.params.message ?? "").slice(0, 80)}"`);
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
    // Thử lại tối đa 3 lần: xkb race có thể đánh sập lần spawn đầu ngay
    // cả khi đã xóa lock (đợt 53 lượt 2: Xvfb exit 1 ở lần đầu dù lock
    // đã xóa; lần sau lên bình thường). Mỗi lần thử lại đều xóa lock
    // stale trước (xkbcomp của lần chết để lại .tX<N>-lock).
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.startXvfbOnce();
        if (attempt > 1) note(`startXvfb: lên được ở lần thử ${attempt} (xkb race ở các lần trước — xem LIMITS đợt 52 §7)`);
        return;
      } catch (e) {
        lastErr = e;
        note(`startXvfb: lần thử ${attempt} thất bại: ${e.message}`);
        if (this.x11) { try { this.x11.close(); } catch {} this.x11 = null; }
        if (this.xvfb) { try { this.xvfb.kill("SIGKILL"); } catch {} this.xvfb = null; }
        await sleep(1000);
      }
    }
    throw lastErr;
  }
  async startXvfbOnce() {
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
        if (probe2.json) { CDP_PORT = 9241; note(`launchAppImage: cổng CDP 9231 vẫn bị giữ sau 15s — đổi sang 9241 cho lần launch ${label}`); }
      }
    }
    let lastErr = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await fs.mkdir(TMPDISK, { recursive: true });
        await fs.mkdir(TMPDIR_RUN, { recursive: true });
        await fs.mkdir(TMPDIR_SECOND, { recursive: true });
        await fs.mkdir(TESTDIR, { recursive: true });
        const args = [`--user-data-dir=${USERDATA}`, `--remote-debugging-port=${CDP_PORT}`, "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox", ...argvFiles];
        const logPath = `/tmp/h9-${label}-d${DISPLAY_NUM}.log`;
        const logStream = (await import("node:fs")).createWriteStream(logPath);
        this.child = spawn(LAUNCH_BIN, args, {
          cwd: DESK, detached: true,
          env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: "1", DISPLAY, ELECTRON_DISABLE_SANDBOX: "1", TMPDIR: TMPDIR_RUN },
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
    await fs.writeFile(file, rgbaToPng(img.width, img.height, img.data));
    return img;
  }
  async shotWindow(win, file) {
    const img = await this.shotWindowRaw(win);
    await fs.mkdir(SHOTS, { recursive: true });
    await fs.writeFile(file, rgbaToPng(img.width, img.height, img.data));
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
    await fs.writeFile(file, rgbaToPng(img.width, img.height, img.data));
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
  let { bands, main } = await menuBarBands(session, shotName ?? "menubar.png");
  // ROUND55-L7: guard dọn zombie PHẢI chạy trước khi kiểm tra topIndex —
  // check cũ `topIndex >= bands.length` đứng trước guard nên với bands=1
  // mọi topIndex>=1 đều fail-fast mà KHÔNG dọn zombie (lượt menu-run1:
  // M10–M25 chết theo sau zombie của M9, chỉ M26 topIndex=0 được dọn
  // rồi pass). Nay: dọn + chụp lại trước, chỉ fail-fast topIndex khi
  // bands đã qua guard mà vẫn thiếu.
  // ROUND53-J3: fail-fast khi menu bar không đủ 5 nhóm (đợt 53 lượt 1:
  // menu bar biến mất sau cú click nhầm Toàn màn hình ở M8 → bands
  // thành rác (centers 591/685) → M9–M26 click nhầm dây chuyền. Thà
  // fail rõ lý do còn hơn click theo tọa độ rác).
  // NHƯNG thử lại trước khi fail: trạng thái menu bar CHẬP CHỜN theo
  // từng lần chụp (r53j3c: M8 guard kích hoạt nhưng M9 ngay sau đó lại
  // mở menu bình thường; M10+ mới hỏng hẳn) — chụp lại 2 lần cách nhau
  // 600ms để loại trừ glitch thoáng qua. Nếu vẫn sai sau 3 lần chụp thì
  // chụp thêm ảnh ROOT (màn hình composited thật) để phân biệt: menu
  // bar mất thật trên màn hình (bug sản phẩm/môi trường) vs XGetImage
  // của cửa sổ chính trả về backing store cũ (artifact harness).
  if (bands.length !== 5) {
    // ROUND54-K4: menu bar chỉ còn 1 dải thường là do dialog
    // discard-confirm đang mở (đợt 53: dialog treo từ M7 tới M26) —
    // trả lời dialog TRƯỚC khi chụp lại, để lần chụp sau thấy menu bar.
    // (Dialog GTK lưu/mở 1124x822 và popup menu không lọt qua bộ lọc
    // của answerDiscardDialog nên không bị đụng nhầm.)
    const dlg = await answerDiscardDialog(session, { accept: true, tag: `openTopMenu(${shotName ?? ""})` }).catch((e) => ({ handled: false, via: "error", detail: `lỗi khi xử lý dialog: ${e.message}` }));
    if (dlg.handled) note(`openTopMenu: ${dlg.detail} — chụp lại menu bar`);
    for (let r = 0; r < 2 && bands.length !== 5; r++) {
      await sleep(600);
      const retry = await menuBarBands(session, shotName ?? "menubar.png");
      bands = retry.bands; main = retry.main;
      note(`openTopMenu: chụp lại menuBarBands lần ${r + 1}: ${bands.length} dải (kỳ vọng 5)`);
    }
  }
  if (bands.length !== 5) {
    // ROUND55-L7: zombie có thể xuất hiện sau lần quét đầu của guard
    // (hoặc lần quét đầu miss do XGetImage thoáng qua) — thử trả lời/dọn
    // dialog thêm 1 lần (đường answerDiscardDialog đã dọn zombie ở
    // nhánh cdp-stale) rồi chụp lại 1 lần cuối trước khi fail.
    const dlg2 = await answerDiscardDialog(session, { accept: true, tag: `openTopMenu-retry(${shotName ?? ""})` }).catch((e) => ({ handled: false, via: "error", detail: `lỗi khi xử lý dialog: ${e.message}` }));
    if (dlg2.handled) {
      note(`openTopMenu: ${dlg2.detail} — chụp lại menu bar lần cuối`);
      await sleep(600);
      const retry2 = await menuBarBands(session, shotName ?? "menubar.png");
      bands = retry2.bands; main = retry2.main;
      note(`openTopMenu: chụp lại lần cuối: ${bands.length} dải (kỳ vọng 5)`);
    }
  }
  if (bands.length !== 5) {
    await session.shotRoot(path.join(SHOTS, (shotName ?? "popup.png").replace(".png", "-menubar-gone-root.png"))).catch(() => {});
    note(`openTopMenu: menu bar chỉ có ${bands.length} dải sau các lần chụp lại (kỳ vọng 5: Tệp/Chỉnh sửa/Xem/Cửa sổ/Trợ giúp), centers x=${bands.map((b) => Math.round(b.center)).join(",")} — menu bar có thể đã biến mất (fullscreen?) hoặc detection lỗi; KHÔNG click mù (đã chụp root để đối chiếu)`);
    return { bands, ok: false, reason: `menu bar chỉ có ${bands.length} dải (kỳ vọng 5) sau các lần chụp lại — không click theo tọa độ rác` };
  }
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
// ---------------- ROUND54-K4: dialog discard-confirm `window.confirm` ----------------
// Bối cảnh (đợt 53 J3 §5): dialog "Có thay đổi chưa lưu thành file. Bỏ thay
// đổi và tiếp tục?" còn mở nguyên từ M7 tới M26 — menu bar chỉ còn 1 dải,
// guard fail-fast đúng thiết kế, nhưng 19 case chết theo 1 dialog.
// Electron hiện window.confirm bằng dialog NATIVE (GTK), và bằng chứng run 15
// (cho window.prompt) cho thấy CDP KHÔNG báo Page.javascriptDialogOpening
// cho dialog native — auto-handler CDP không thấy nó. Ảnh r53j3d
// m8-export-menubar-gone-root.png: dialog ~410x85 ở góc trên-trái, 2 nút
// [Ok][Cancel] — Ok bên TRÁI, Cancel bên PHẢI (clickDialogButton tính từ
// phải nên Ok = fromRight 1, Cancel = fromRight 0; probe dialogprobe kiểm
// chứng thứ tự này bằng kết quả confirm trả về).
// Cơ chế: phát hiện (CDP dialogs + cửa sổ X11 nhỏ có đúng 2 nút ở đáy) rồi
// trả lời có chủ đích (accept=true → Ok cho flow mở file chạy tiếp;
// accept=false → Cancel giữ project), ghi log lựa chọn. Không thấy dialog
// thì trả handled=false (bình thường khi project sạch) chứ không phải lỗi.

// Evaluate có giới hạn thời gian — trả null khi timeout (renderer có thể
// đang kẹt trong dialog). Nuốt rejection muộn để Node không crash vì
// UnhandledPromiseRejection (Cdp.send timeout 20s).
async function evaluateSoon(session, expression, timeoutMs = 3000) {
  let timer = null;
  try {
    return await Promise.race([
      session.cdp.evaluate(expression).catch(() => null),
      new Promise((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

// Renderer còn trả lời evaluate không (false = đang kẹt trong dialog modal).
async function rendererResponsive(session, timeoutMs = 3000) {
  return (await evaluateSoon(session, "1+1", timeoutMs)) === 2;
}

const DISCARD_MSG_PART = "thay đổi chưa lưu";
// Số entry discard-confirm CDP đã thấy kể từ lần check trước (watermark trên
// session — auto-handler accept ngay khi dialog mở nên entry cũ không tính
// lại; dialog native không có entry CDP nên hàm này trả 0 cho nó).
function freshCdpDiscardCount(session) {
  const mark = session._discardCdpMark ?? 0;
  const fresh = session.cdp.dialogs.filter((d, i) => i >= mark && (d.message ?? "").includes(DISCARD_MSG_PART));
  session._discardCdpMark = session.cdp.dialogs.length;
  return fresh.length;
}

// Đếm số nút ở hàng cuối dialog (như clickDialogButton nhưng chỉ đếm, không click).
// Dòng cuối = hàng nút (xem chú thích ở clickDialogButton về from/to trục "y").
async function dialogButtonCount(session, win, shotName = "discard-inspect.png") {
  const img = await session.shotWindow(win, path.join(SHOTS, shotName)).catch(() => null);
  if (!img) return null;
  const rows = textBands(img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img.width });
  if (rows.length === 0) return null;
  const row = rows[rows.length - 1];
  // Cắt 3px ở 2 đầu dòng nút như clickDialogButton (đường phân cách/viền
  // dưới chạy hết chiều rộng sẽ gộp mọi cột thành 1).
  const trim = (row.end - row.start + 1) > 10 ? 3 : 0; // textBands không trả field size
  const cols = textBands(img, { axis: "x", from: Math.round(row.start) + trim, minGap: 6, to: Math.round(row.end) + 1 - trim });
  return cols.length;
}

// Cửa sổ dialog có thể còn nằm trong cây X một lúc sau khi đã đóng
// (probe r54k4 P2: confirm đã trả về nhưng id còn liệt kê >1.2s sau
// handle) — poll tới khi id biến mất hoặc thành 1x1@-1,-1 (xác đã hủy).
async function windowGone(session, win, timeoutMs = 3000) {
  const t0 = Date.now();
  for (;;) {
    const wins = await session.listWindows().catch(() => []);
    const cur = wins.find((w) => w.id === win.id);
    if (!cur) return true;
    if (cur.geo.width <= 1 && cur.geo.height <= 1) return true;
    if (Date.now() - t0 > timeoutMs) return false;
    await sleep(400);
  }
}

// Tìm cửa sổ dialog discard-confirm NATIVE: nhỏ (rộng 200–700, cao 30–260),
// không phải cửa sổ chính (>=1024 rộng), không phải popup menu (~250x300),
// không phải cửa sổ phụ 200x200/10x10 của Chromium, và có đúng 2 nút ở đáy
// (About có 1 nút, Báo lỗi có 4 nút, dialog GTK lưu/mở 1124x822 — đều loại).
// Ngưỡng rộng dưới 200 (không phải 250): dialog ngắn (message probe ngắn)
// chỉ rộng ~160 — nhưng dialog thật (message tiếng Việt dài) rộng ~410;
// ngưỡng 200 vẫn loại được submenu Mở gần đây (~195 rộng) nhờ thêm điều
// kiện đúng 2 nút ở đáy.
async function findDiscardDialogWindow(session) {
  const wins = await session.listWindows();
  const cands = wins.filter((w) =>
    w.geo.width >= 200 && w.geo.width <= 700 &&
    w.geo.height >= 30 && w.geo.height <= 260 &&
    !(w.geo.width === 200 && w.geo.height === 200));
  for (const cand of cands) {
    let cols = await dialogButtonCount(session, cand);
    if (cols === null) {
      // Chụp XGetImage thoáng qua có thể lỗi (probe r54k4 gặp "?" rải rác) — thử lại 1 lần.
      await sleep(300);
      cols = await dialogButtonCount(session, cand);
    }
    if (cols === 2) return { cand, cands, win: cand, wins };
    note(`findDiscardDialogWindow: ứng viên "${cand.title || "(không tên)"}" ${cand.geo.width}x${cand.geo.height} có ${cols ?? "?"} nút ở đáy (cần đúng 2) — bỏ qua`);
  }
  return { cands, win: null, wins };
}

// Phát hiện + trả lời dialog discard-confirm một cách CHỦ ĐỘNG.
// accept=true → Ok ("Bỏ thay đổi và tiếp tục" — cho flow mở file chạy tiếp);
// accept=false → Cancel (giữ project hiện tại). Thứ tự thử:
// (0) Tìm cửa sổ dialog trước: entry CDP chỉ chứng minh event đã tới,
//     không chứng minh dialog đã đóng (đợt 53: auto-handler gửi handle kèm
//     promptText có thể lỗi mà không ai biết) — chỉ kết luận "CDP đã trả
//     lời" khi không còn cửa sổ dialog VÀ renderer trả lời lại.
// (1) Không còn cửa sổ + CDP thấy entry mới + renderer trả lời → CDP auto.
//     Nếu renderer vẫn kẹt → handle trực tiếp (không promptText).
// (2) Còn cửa sổ → click nút thật qua X11 ([Ok][Cancel], Ok = fromRight 1);
// (3) click theo vị trí ước lượng (nửa trái = Ok, nửa phải = Cancel);
// (4) Escape — CHỈ khi dismiss (Escape của dialog GTK = Cancel; dùng cho
// accept sẽ trả lời ngược ý định nên không dùng).
// Trả về {handled, via, detail}. handled=false khi không thấy dialog nào.
async function answerDiscardDialog(session, { accept, tag }) {
  const want = accept ? "Ok (tiếp tục, bỏ thay đổi)" : "Cancel (giữ project)";
  const cdpFresh = freshCdpDiscardCount(session);
  const autoOn = session.cdp.autoAcceptDialogs !== false;
  // Tìm cửa sổ dialog TRƯỚC khi kết luận CDP đã trả lời: entry CDP chỉ
  // chứng minh event đã tới, không chứng minh dialog đã đóng (đợt 53:
  // auto-handler gửi handle kèm promptText có thể lỗi mà không ai biết).
  const found = await findDiscardDialogWindow(session);
  if (!found.win) {
    if (cdpFresh > 0) {
      // CDP thấy dialog mới. Nếu auto-accept bật và renderer đã trả lời
      // lại thì dialog đã được trả lời — ghi nhận. Nếu renderer vẫn kẹt
      // (auto-accept tắt ở probe, hoặc handle trước đó thất bại) thì thử
      // handle trực tiếp KHÔNG promptText (nghi ngờ promptText làm handle
      // confirm lỗi — xem probe P2).
      const responsive = await rendererResponsive(session);
      if (autoOn && responsive) {
        const detail = `${tag}: dialog discard-confirm đã được CDP auto-accept (${cdpFresh} entry mới) và renderer đã trả lời lại — chọn ${want} qua CDP`;
        note(detail);
        return { handled: true, via: "cdp-auto", detail };
      }
      const r = await session.cdp.send("Page.handleJavaScriptDialog", { accept }).catch((e) => ({ error: e.message }));
      await sleep(800);
      const responsive2 = await rendererResponsive(session);
      if (!r.error && responsive2) {
        const detail = `${tag}: dialog discard-confirm (CDP thấy ${cdpFresh} entry, auto-accept ${autoOn ? "bật nhưng renderer vẫn kẹt" : "tắt (probe)"}) — handleJavaScriptDialog trực tiếp (không promptText) đã trả lời; chọn ${want} qua CDP-trực-tiếp`;
        note(detail);
        return { handled: true, via: "cdp-direct", detail };
      }
      return { handled: false, via: "stuck", detail: `${tag}: CDP thấy ${cdpFresh} entry nhưng không tìm được cửa sổ dialog; handle trực tiếp ${r.error ? "lỗi: " + r.error : "đã gọi nhưng renderer vẫn kẹt (responsive: " + responsive2 + ")"} — dialog có thể còn mở` };
    }
    return { handled: false, via: "none", detail: `${tag}: không thấy dialog discard-confirm (CDP: 0 entry mới; cửa sổ nhỏ 2-nút: 0) — project có thể đã sạch, chạy tiếp` };
  }
  const win = found.win;
  const geo = `${win.geo.width}x${win.geo.height}@${win.geo.x},${win.geo.y}`;
  // Cửa sổ có thể còn liệt kê sau khi dialog đã được CDP trả lời (probe
  // r54k4 P2: confirm đã trả về nhưng id còn trong cây X >3s sau handle).
  // window.confirm modal chặn renderer — nếu renderer trả lời được thì
  // dialog đã đóng rồi, cửa sổ chỉ là xác cũ: KHÔNG click mù (click sẽ
  // rơi xuống app bên dưới) — NHƯNG phải dọn xác cũ này, vì nó che menu
  // bar (ROUND55-L7 Z2: bands=1, M8 fail) và KHÔNG tự biến mất (Z3: còn
  // nguyên sau 15s). Hủy từ ngoài (XDestroyWindow/UnmapWindow) KHÔNG đủ:
  // probe Z4/Z5 cho thấy bands có hồi nhưng menu vẫn chết (Electron vẫn
  // tưởng dialog đang mở). Cách đúng là click nút trên zombie qua X11 —
  // đường GTK response để Electron tự dọn (probe Z2-C: cửa sổ biến mất,
  // bands=5, popup mở lại được). Nút click theo `accept` (Ok = fromRight
  // 1, Cancel = fromRight 0); JS đã trả về rồi nên giá trị response
  // không còn ảnh hưởng flow.
  if (await rendererResponsive(session)) {
    const btn = await clickDialogButton(session, win, accept ? 1 : 0, "discard-zombie-cleanup.png").catch(() => ({ ok: false }));
    await sleep(500);
    const gone = await waitWindowGone(session, win.id, 5000);
    let bandsAfter = -1;
    if (gone) {
      const b = await menuBarBands(session, "discard-zombie-menubar.png").catch(() => ({ bands: [] }));
      bandsAfter = b.bands.length;
    }
    const cleaned = gone && bandsAfter === 5;
    const detail = `${tag}: dialog discard-confirm "${win.title || "(không tên)"}" ${geo} còn liệt kê nhưng renderer đã trả lời lại (dialog đã được CDP trả lời, cửa sổ là xác cũ) — click nút ${accept ? "Ok" : "Cancel"} qua X11 để dọn zombie (click: ${btn.ok}, thấy ${btn.cols ?? "?"} nút): cửa sổ ${gone ? "đã biến mất" : "VẪN CÒN"}, bands sau=${bandsAfter}; chọn ${want} qua CDP-xác-cũ`;
    note(detail);
    return { handled: true, via: cleaned ? "cdp-stale-cleaned" : "cdp-stale", detail };
  }
  // (2) Click nút thật: Ok = fromRight 1 ([Ok][Cancel]), Cancel = fromRight 0.
  const fromRight = accept ? 1 : 0;
  const btn = await clickDialogButton(session, win, fromRight, "discard-answer.png").catch(() => ({ ok: false }));
  await sleep(500);
  let gone = await waitWindowGone(session, win.id, 4000);
  if (gone) {
    const detail = `${tag}: dialog discard-confirm "${win.title || "(không tên)"}" ${geo} — click nút ${accept ? "Ok" : "Cancel"} (thấy ${btn.cols ?? "?"} nút, click: ${btn.ok}) → đã đóng; chọn ${want} qua X11`;
    note(detail);
    return { handled: true, via: "x11-click", detail };
  }
  // (3) Click theo vị trí ước lượng: dialog ~410 rộng, 2 nút chia đôi —
  // nửa trái = Ok, nửa phải = Cancel; hàng nút ở ~20px cuối dialog.
  const cx = win.geo.x + Math.round(win.geo.width * (accept ? 0.25 : 0.75));
  const cy = win.geo.y + win.geo.height - 20;
  await session.x11.click(cx, cy);
  await sleep(500);
  gone = await waitWindowGone(session, win.id, 4000);
  if (gone) {
    const detail = `${tag}: dialog discard-confirm "${win.title || "(không tên)"}" ${geo} — click nút thật thất bại (thấy ${btn.cols ?? "?"} nút, click: ${btn.ok}) nhưng click vị trí ước lượng (${cx},${cy}) đã đóng; chọn ${want} qua X11-ước-lượng`;
    note(detail);
    return { handled: true, via: "x11-guess", detail };
  }
  // (4) Escape — chỉ cho dismiss.
  if (!accept) {
    await session.x11.activateWindow(win.id);
    await session.x11.pressEscape();
    await sleep(500);
    gone = await waitWindowGone(session, win.id, 4000);
    if (gone) {
      const detail = `${tag}: dialog discard-confirm "${win.title || "(không tên)"}" ${geo} — click thất bại, Escape đã đóng; chọn ${want} qua Escape`;
      note(detail);
      return { handled: true, via: "escape", detail };
    }
  }
  // Hết cách mà dialog vẫn còn — kiểm tra lại CDP (event có thể tới muộn),
  // nhưng CHỈ kết luận CDP đã trả lời khi cửa sổ thật sự biến mất.
  const cdpLate = freshCdpDiscardCount(session);
  if (cdpLate > 0) {
    const stillThere = (await session.listWindows()).some((w) => w.id === win.id);
    if (!stillThere) {
      const detail = `${tag}: dialog discard-confirm "${win.title || "(không tên)"}" ${geo} — click không đóng được nhưng cửa sổ đã biến mất và CDP báo ${cdpLate} entry mới (dialog đã được trả lời muộn); chọn ${want} qua CDP-muộn`;
      note(detail);
      return { handled: true, via: "cdp-late", detail };
    }
  }
  const responsive = await rendererResponsive(session);
  const detail = `${tag}: dialog discard-confirm "${win.title || "(không tên)"}" ${geo} VẪN MỞ sau mọi cách thử (click nút: ${btn.ok}, thấy ${btn.cols ?? "?"} nút; renderer trả lời evaluate: ${responsive}) — các case sau có thể cascade như đợt 53`;
  note(detail);
  return { handled: false, via: "stuck", detail };
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
  // Hàng nút là dòng chữ CUỐI CÙNG của dialog (nút luôn ở đáy). LƯU Ý:
  // textBands trục "y" dùng from/to làm khoảng X (không phải Y) nên KHÔNG
  // được truyền from=height-55 (code cũ làm vậy → chỉ quét dải X hẹp
  // [height-55, height], vớ phải dòng message thay vì dòng nút — probe
  // r54k4: dialog discard 430x83 bị đếm thành 1 nút). Quét toàn bộ chiều
  // rộng (from=0, to=width) rồi lấy dòng cuối cùng là đúng.
  const rows = textBands(img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img.width });
  if (rows.length === 0) return { ok: false, reason: "không thấy dòng nút ở đáy dialog" };
  const row = rows[rows.length - 1];
  // Cắt 3px ở 2 đầu của dòng nút khi chiếu cột: dải nút luôn dính 2 đường
  // ngang chạy hết chiều rộng dialog — đường phân cách (đầu dải) và viền
  // dưới của dialog (cuối dải, y=82 trong ảnh 430x83) — mỗi đường cộng 1
  // vào MỌI cột nên toàn bộ hàng bị gộp thành 1 cột duy nhất (probe
  // r54k4: 430x83 đếm ra 1 cột 0–429). Cắt 3px bỏ 2 đường đó, giữ lại
  // phần giữa (chữ nút + viền nút) để tách đúng 2 cột Ok/Cancel.
  const trim = (row.end - row.start + 1) > 10 ? 3 : 0; // textBands không trả field size
  const cols = textBands(img, { axis: "x", from: Math.round(row.start) + trim, minGap: 6, to: Math.round(row.end) + 1 - trim });
  if (fromRight >= cols.length) return { ok: false, reason: `chỉ thấy ${cols.length} nút, cần nút thứ ${fromRight} từ phải` };
  const col = cols[cols.length - 1 - fromRight];
  await session.x11.click(win.geo.x + Math.round(col.center), win.geo.y + Math.round(row.center));
  await sleep(500);
  return { cols: cols.length, ok: true };
}
// Click nút phải nhất (Save / Mở) của dialog GTK lớn (1124x822).
// ROUND55-L3: dùng minGap=3 khi tách cột — chữ "Cancel" và "Save" cách
// nhau chỉ ~4px nên minGap=6 của clickDialogButton gộp 2 nút thành 1 cột,
// click rơi vào khe giữa 2 nút, dialog không đóng (J1 đợt 53 §5.2, đã
// chứng minh offline; V4/R1–R3 đợt 55 pass với finder này). Chỉ dùng cho
// dialog GTK lưu/mở (gtkTypePath); các dialog nhỏ khác vẫn dùng
// clickDialogButton như cũ.
async function clickGtkDialogRightButton(session, win) {
  const img = await session.shotWindow(win, path.join(SHOTS, "gtk-dialog-savebtn.png"));
  const rows = textBands(img, { axis: "y", from: 0, minGap: 3, minSize: 5, to: img.width });
  if (rows.length === 0) return { ok: false, reason: "không thấy hàng chữ nào trong dialog" };
  const row = rows[rows.length - 1];
  const cols = textBands(img, { axis: "x", from: Math.round(row.start), minGap: 3, to: Math.round(row.end) + 1 });
  if (cols.length === 0) return { ok: false, reason: "không thấy cột nút ở hàng cuối" };
  const col = cols[cols.length - 1];
  await session.x11.click(win.geo.x + Math.round(col.center), win.geo.y + Math.round(row.center));
  await sleep(500);
  return { cols: cols.length, ok: true };
}
// Gõ đường dẫn vào dialog GTK rồi submit bằng CLICK nút phải nhất
// (Save / Mở), KHÔNG dùng Enter. Trả về true khi cửa sổ dialog biến mất
// trong timeout. Run 18: kích hoạt (raise + focus) dialog TRƯỚC khi click
// — dialog GTK có thể mở SAU cửa sổ chính nên click thẳng vào tọa độ của
// nó sẽ rơi xuống cửa sổ chính (run 17 M4: dialog "Lưu dự án" mở nhưng gõ
// path không có tác dụng, dialog không đóng).
// ROUND55-L3 — sửa 2 bug harness (đã chứng minh bằng 9 variant đối chứng
// trên AppImage sha 2a15ea90…, xem docs/PHASE9_ROUND55_L3_GTK_SAVE_TYPING_LIMITS.md):
// (1) Return KHÔNG submit dialog GTK trên Xvfb này (6/6 variant Return
//     fail: V0/V1/V3/V5/V6/V7 — dialog ở nguyên, chỉ Escape mới đóng, main
//     log canceled=true; kể cả gõ chậm, Return 2 lần, hay chỉ gõ tên file).
//     Đây là quirk GTK/Xvfb, KHÔNG phải bug sản phẩm: click nút Save/Mở
//     ghi/mở file đúng. Nên submit bằng click nút thay cho Return.
// (2) Tên mặc định "Du an mau.vcut.json" chỉ chọn phần "Du an mau.vcut":
//     gõ đè giữ lại hậu tố ".json" → dialog trả path + ".json" (V2: file
//     ghi ra .vcut.json, currentPath lệch; paste qua clipboard để lại
//     ".vcut" — V8). Nên click thẳng ô Name + Ctrl+A trước khi gõ để chọn
//     hết tên mặc định. Chỉ áp dụng cho dialog Lưu (có ô Name); dialog Mở
//     không có tên mặc định nên chỉ Ctrl+L + gõ như cũ. Đã verify: 3 lần
//     Lưu thành… liên tiếp pass (R1–R3) + 1 lần Mở pass (R4) qua đúng
//     đường menu của D2a/M5.
async function gtkTypePath(session, win, filePath, timeoutMs = 8000) {
  await session.x11.activateWindow(win.id);
  await sleep(500);
  const isSave = /Lưu/.test(win.title ?? "");
  if (isSave) {
    // Click thẳng vào ô Name (y≈27) + Ctrl+A: chọn hết tên mặc định.
    await session.x11.click(win.geo.x + Math.round(win.geo.width / 2), win.geo.y + 27);
    await sleep(300);
    await session.x11.ctrlKeysym(0x61); // Ctrl+A
    await sleep(200);
  } else {
    await session.x11.click(win.geo.x + Math.round(win.geo.width / 2), win.geo.y + Math.round(win.geo.height / 2));
    await sleep(300);
    await session.x11.ctrlKeysym(0x6c); // Ctrl+L: ô location
    await sleep(400);
  }
  await session.x11.typeText(filePath);
  await sleep(300);
  // Submit bằng click nút phải nhất (Save / Mở) — xem (1) ở trên.
  const btn = await clickGtkDialogRightButton(session, win);
  if (!btn.ok) return false;
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
      await fs.writeFile(file, JSON.stringify(fixtureSpec(name), null, 2));
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

// ---------------- Phase DIAG (chỉ chạy với --only diag) ----------------
// Chẩn đoán cửa sổ 200x200 "vcut-studio" + cascade M3→M26 (run 17):
// 1. welcome modal có chặn menubar không (M2 pass khi modal mở → kỳ vọng không);
// 2. sau click Lưu thành… (prompt ném lỗi) menubar có chết không;
// 3. cửa sổ 200x200 là gì (map-state, override-redirect, loại cửa sổ,
//    transient-for) và nó có nuốt click ở vùng trái menubar không
//    (nút "Tệp" nằm trong vùng 0–200, "Trợ giúp" nằm ngoài);
// 4. dời/ẩn cửa sổ đó thì menubar có hồi không.
async function phaseDiag(session) {
  const modalOpen = async () => (await session.bodyText()).includes("Chào mừng tới VCut Studio");
  // D0 — baseline: cửa sổ lúc khởi động + welcome modal.
  {
    const wins = await session.listWindows();
    const w200 = wins.find((w) => w.geo.width === 200 && w.geo.height === 200);
    record("D0 diag baseline: cửa sổ lúc khởi động, welcome modal", true,
      `cửa sổ: ${wins.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ")}; welcome modal mở: ${await modalOpen()}; cửa sổ 200x200 đã có từ đầu: ${!!w200}`);
  }
  // D1 — đóng welcome modal bằng click DOM (nút "Để sau"), kiểm chứng modal biến mất.
  {
    const had = await modalOpen();
    let gone = !had;
    if (had) {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
      await sleep(1000);
      gone = !(await modalOpen());
    }
    record("D1 diag đóng welcome modal (nút Để sau)", gone, `modal mở lúc đầu: ${had}; sau click: ${gone ? "đã đóng" : "VẪN MỞ"}`);
  }
  // D2 — menubar baseline sau khi đóng modal: mở popup Tệp.
  {
    const o = await openTopMenu(session, 0, "diag-file.png");
    record("D2 diag menubar sau khi đóng modal: popup Tệp mở được", o.ok, o.ok ? `rows=${o.rows.length}` : (o.reason ?? ""));
    await closeAnyMenu(session);
    // Probe ROUND52-I3: cửa sổ 200x200 xuất hiện từ lúc nào? Chạy 19:11
    // cho thấy nó đã có TRƯỚC click Lưu thành… (D3 không thấy cái mới).
    const w200d2 = (await session.listWindows()).find((w) => w.geo.width === 200 && w.geo.height === 200) ?? null;
    note(`D2 probe: cửa sổ 200x200 sau khi mở/đóng popup Tệp: ${w200d2 ? `CÓ id=0x${w200d2.id.toString(16)} "${w200d2.title}"` : "không có"}`);
  }
  // D3 — click Lưu thành… với dialog nhập tên TRONG APP (ROUND53-J4,
  // thay window.prompt — bug D3 đợt 51): dialog nhập tên mở trước, xác
  // nhận tên rồi dialog lưu native mới mở. Kỳ vọng: 0 exception mới +
  // KHÔNG còn cửa sổ 200x200 + dialog nhập tên xuất hiện + dialog "Lưu
  // dự án" xuất hiện rồi Escape hủy được. (Đợt 52: fix try/catch bỏ qua
  // bước đổi tên — dialog lưu mở thẳng; nay có thêm bước nhập tên.)
  let w200 = null;
  {
    const excBefore = session.cdp.events.filter((e) => e.method === "__exception__").length;
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const r = await clickMenuItem(session, 0, 5, "diag-saveas.png");
    await sleep(1200);
    const renamed = await driveRenameDialog(session, "D3 Doi ten");
    await sleep(800);
    const newExc = session.cdp.events.filter((e) => e.method === "__exception__").slice(excBefore);
    let dlg = await session.findWindow("Lưu dự án");
    if (!dlg) dlg = await waitAnyDialog(session, winsBefore, 3000);
    const wins = await session.listWindows();
    w200 = wins.find((w) => !winsBefore.includes(w.id) && w.geo.width === 200 && w.geo.height === 200) ?? null;
    const excDetail = newExc.length > 0 ? (newExc[0].detail ?? "").slice(0, 400) : "(không có exception mới)";
    let dlgGone = true;
    if (dlg) {
      await session.x11.pressEscape(); await sleep(800);
      dlgGone = !(await session.listWindows()).some((w) => w.id === dlg.id);
    }
    record("D3 diag Lưu thành… dialog nhập tên: 0 exception, dialog nhập tên + dialog lưu mở, không còn cửa sổ 200x200", r.ok && newExc.length === 0 && renamed.present && renamed.confirmed && !w200 && !!dlg && dlgGone,
      `click: ${r.ok ? "đúng mục" : "THẤT BẠI: " + (r.reason ?? "?")}; dialog nhập tên trong app: ${renamed.present ? `xuất hiện (input điền sẵn ${JSON.stringify(renamed.inputBefore)}, xác nhận: ${renamed.confirmed})` : "KHÔNG xuất hiện"}; exception mới: ${newExc.length} — ${excDetail}; dialog lưu native: ${dlg ? `"${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}, Escape đóng: ${dlgGone}` : "KHÔNG thấy"}; cửa sổ 200x200 mới: ${w200 ? `VẪN CÓ id=0x${w200.id.toString(16)}` : "không còn"}; toàn bộ cửa sổ: ${wins.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}`).join(" | ")}`);
    await session.x11.pressEscape(); await sleep(500);
  }
  // D3b — cửa sổ 200x200 BẤT KỲ sau Lưu thành… (không chỉ mới xuất hiện):
  // D2 probe đã xác định nó xuất hiện khi mở/đóng popup menu (KHÔNG phải
  // từ Lưu thành…): cửa sổ phụ của Electron/Chromium cho popup menu, còn
  // sót lại sau khi popup đóng. Tiêu chí PASS: không có, HOẶC có nhưng
  // UNMAPPED (mapState != 2 — không nhận click, không che menubar; D6
  // đo được mapState=0 ở cả 3 lượt). Chỉ FAIL khi nó MAPPED (Viewable) —
  // lúc đó mới là vấn đề thật.
  {
    const wins = await session.listWindows();
    const any200 = wins.find((w) => w.geo.width === 200 && w.geo.height === 200) ?? null;
    if (any200) w200 = any200; // để D6/D7/D8 đọc thuộc tính + dời/ẩn nó
    let mapState = null;
    if (any200) {
      const at = await session.x11.getWindowAttributes(any200.id).catch(() => null);
      mapState = at ? at.mapState : null;
    }
    const harmless = !any200 || mapState === 0;
    record("D3b diag: cửa sổ 200x200 (nếu còn) phải UNMAPPED — không chặn menubar", harmless,
      any200 ? `cửa sổ 200x200: id=0x${any200.id.toString(16)} "${any200.title}" ${any200.geo.width}x${any200.geo.height}@${any200.geo.x},${any200.geo.y}; mapState=${mapState} (${mapState === 0 ? "Unmapped — còn sót vô hại, xem D6" : mapState === 2 ? "VIEWABLE — chặn menubar thật!" : "?"})` : "không còn cửa sổ 200x200 nào");
  }
  // D4 — menubar sau save-as: mở popup Tệp (nút nằm trong vùng 0–200).
  {
    const o = await openTopMenu(session, 0, "diag-file-after.png");
    record("D4 diag menubar sau Lưu thành…: popup Tệp mở được", o.ok, o.ok ? `rows=${o.rows.length}` : (o.reason ?? ""));
    await closeAnyMenu(session);
  }
  // D5 — nút "Trợ giúp" (nằm NGOÀI vùng 0–200): mở được thì blocker chỉ ở vùng trái.
  {
    const o = await openTopMenu(session, 4, "diag-help.png");
    record("D5 diag nút Trợ giúp (ngoài vùng 200x200): popup mở được", o.ok, o.ok ? `rows=${o.rows.length}` : (o.reason ?? ""));
    await closeAnyMenu(session);
  }
  // D6 — thuộc tính cửa sổ 200x200 (w200 có thể đến từ D3 hoặc D3b).
  // Nếu không có cửa sổ này → PASS (không còn gì để đọc thuộc tính);
  // nếu có → đọc map-state/override-redirect/loại để biết nó có chặn
  // menubar không (mapState=0 Unmapped thì không nhận click).
  {
    if (!w200) { record("D6 diag thuộc tính cửa sổ 200x200", true, "không còn cửa sổ 200x200 sau Lưu thành… (bug D3 đã sửa — không còn gì để đọc thuộc tính)"); }
    else {
      const at = await session.x11.getWindowAttributes(w200.id).catch(() => null);
      let typeName = "?"; let transient = "?";
      try {
        const typeAtom = await session.x11.internAtom("_NET_WM_WINDOW_TYPE");
        const t = await session.x11.getProperty(w200.id, typeAtom, 4 /* ATOM */, 8);
        if (t.valueLen > 0) {
          const a = t.value.readUInt32LE(0);
          const candidates = ["_NET_WM_WINDOW_TYPE_DIALOG", "_NET_WM_WINDOW_TYPE_NORMAL", "_NET_WM_WINDOW_TYPE_UTILITY", "_NET_WM_WINDOW_TYPE_MENU", "_NET_WM_WINDOW_TYPE_POPUP_MENU", "_NET_WM_WINDOW_TYPE_TOOLTIP", "_NET_WM_WINDOW_TYPE_SPLASH", "_NET_WM_WINDOW_TYPE_NOTIFICATION", "_NET_WM_WINDOW_TYPE_TOOLBAR", "_NET_WM_WINDOW_TYPE_DROPDOWN_MENU"];
          for (const c of candidates) { if ((await session.x11.internAtom(c)) === a) { typeName = c; break; } }
          if (typeName === "?") typeName = `atom số ${a} (không khớp loại đã biết)`;
        }
      } catch {}
      try {
        const trAtom = await session.x11.internAtom("WM_TRANSIENT_FOR");
        const tr = await session.x11.getProperty(w200.id, trAtom, 33 /* WINDOW */, 1);
        if (tr.valueLen > 0) transient = `0x${tr.value.readUInt32LE(0).toString(16)}`;
      } catch {}
      record("D6 diag thuộc tính cửa sổ 200x200", !!at,
        `id=0x${w200.id.toString(16)} "${w200.title}"; mapState=${at ? at.mapState : "?"} (2=Viewable); overrideRedirect=${at ? at.overrideRedirect : "?"} (1=override, không qua WM); class=${at ? at.class : "?"} (1=InputOutput, 2=InputOnly); _NET_WM_WINDOW_TYPE=${typeName}; WM_TRANSIENT_FOR=${transient}`);
    }
  }
  // D7 — dời cửa sổ 200x200 ra khỏi màn hình rồi thử lại menubar.
  // Sau fix không còn cửa sổ này → PASS luôn (không cần dời).
  {
    if (!w200) { record("D7 diag dời cửa sổ 200x200 rồi mở lại popup Tệp", true, "không còn cửa sổ 200x200 để dời — menubar mở được ở D4, không còn gì để kiểm tra"); }
    else {
      session.x11.moveWindow(w200.id, -1000, -1000);
      await sleep(600);
      const o = await openTopMenu(session, 0, "diag-file-moved.png");
      record("D7 diag dời cửa sổ 200x200 rồi mở lại popup Tệp", o.ok, o.ok ? `rows=${o.rows.length} — menu mở được sau khi dời cửa sổ` : (o.reason ?? "") + " — dời cửa sổ KHÔNG hồi menubar");
      await closeAnyMenu(session);
    }
  }
  // D8 — nếu vẫn chết: ẩn (unmap) cửa sổ 200x200 rồi thử lại.
  // Sau fix không còn cửa sổ này → PASS luôn (không cần ẩn).
  {
    if (!w200) { record("D8 diag ẩn cửa sổ 200x200 rồi mở lại popup Tệp", true, "không còn cửa sổ 200x200 để ẩn — menubar mở được ở D4, không còn gì để kiểm tra"); }
    else {
      const o0 = await openTopMenu(session, 0, "diag-file-before-unmap.png").catch(() => ({ ok: false }));
      await closeAnyMenu(session);
      if (o0.ok) { record("D8 diag ẩn cửa sổ 200x200 rồi mở lại popup Tệp", true, "menu đã mở được ở D7 — không cần ẩn (bỏ qua)"); }
      else {
        session.x11.unmapWindow(w200.id);
        await sleep(600);
        const o = await openTopMenu(session, 0, "diag-file-unmapped.png");
        record("D8 diag ẩn cửa sổ 200x200 rồi mở lại popup Tệp", o.ok, o.ok ? `rows=${o.rows.length} — menu mở được sau khi ẩn cửa sổ` : (o.reason ?? "") + " — ẩn cửa sổ KHÔNG hồi menubar");
        await closeAnyMenu(session);
      }
    }
  }
  await session.shotRoot(path.join(SHOTS, "diag-root.png")).catch(() => {});
  await dumpWindows(session, "diag cuối");
}

// ---------------- Phase MENU ----------------
// Thứ tự mục (tiếng Việt, theo menu.ts): Tệp[0..7] = Dự án mới, Mở dự
// án…, Thêm media…, Mở gần đây, Lưu dự án, Lưu dự án thành…, Xuất
// video…, Thoát. Chỉnh sửa[0..7] = Hoàn tác, Làm lại, Cắt, Sao chép,
// Dán, Nhân bản clip, Xóa, Chọn tất cả. Xem[0..7] = Tải lại, Tải lại
// (xóa cache), Công cụ nhà phát triển, Phóng to, Thu nhỏ, Đặt lại mức
// thu phóng, Toàn màn hình, Ngôn ngữ. Cửa sổ[0..1] = Thu nhỏ, Đóng cửa
// sổ. Trợ giúp[0..4] = Giới thiệu, Phím tắt, Tài liệu, Báo lỗi, GitHub.
const VCUT1 = path.join(TESTDIR, "H9-Doubleclick.vcut");
const VCUT2 = path.join(TESTDIR, "H9-Second.vcut");
// Fixture .vcut viết sẵn (cùng cấu trúc project mẫu) — để M5/M7/M12/D1/D2b
// test đường Mở/Recent/Double-click mà KHÔNG phụ thuộc Lưu thành….
// ROUND53-J3: fixture sống trong FIXTURE_DIR bền vững (hidden_files/h9),
// harness tự tạo ở ensureFixtures() trước khi chạy phase nào; VCUT1/VCUT2
// vẫn là file output app tự ghi nên ở TESTDIR (/tmp) và bị xóa đầu lượt.
const FIXTURE1 = path.join(FIXTURE_DIR, "H9-Fixture.vcut");
const FIXTURE2 = path.join(FIXTURE_DIR, "H9-SecondInstance.vcut");
let OPENED_FILE = null; // file M5 thực sự mở (VCUT1 nếu M4 ghi được, else fixture) — M7/M12/D1 dùng chung

async function phaseMenu(session) {
  // Project mẫu sinh async (Canvas + MediaRecorder) — chờ "mau-1" xuất
  // hiện trong MediaBin tối đa 60s; nếu không load thì các case cần clip
  // sẽ fail trung thực (ghi rõ), không test trên project rỗng rồi ngộ nhận.
  let sampleLoaded = false;
  {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const t = await session.bodyText().catch(() => "");
      if (t.includes("mau-1")) { sampleLoaded = true; break; }
      await sleep(2000);
    }
  }
  const clip0 = await session.clipInfo().catch(() => ({ count: -1, labels: [] }));
  record("M0 Project mẫu load xong (MediaBin có mau-1, timeline có clip)", sampleLoaded && clip0.count >= 3,
    `sampleLoaded=${sampleLoaded}; clip count=${clip0.count}; labels=${JSON.stringify(clip0.labels)}`);
  note(`M0: sampleLoaded=${sampleLoaded}, clips=${clip0.count}`);
  const text0 = await session.bodyText();
  const sampleName = (await session.projectName()).inputs[0] ?? "";
  note(`project mẫu lúc mở: name input=${JSON.stringify(sampleName)}, textLen=${text0.length}`);

  // W0 — đóng welcome modal ("Chào mừng tới VCut Studio") nếu nó xuất hiện.
  // Modal là onboarding lần đầu, xuất hiện MUỘN (sau khi sample load — diag
  // D0: chưa có ở 1.5s sau launch; run 17: đã mở ở M3). Người dùng thật sẽ
  // bấm "Để sau" trước khi dùng menu, nên harness cũng đóng nó để các case
  // menu chạy trên editor sạch. Diag D2/D4: menubar chạy tốt khi modal đóng.
  {
    const modalOpen = async () => (await session.bodyText()).includes("Chào mừng tới VCut Studio");
    let appeared = await modalOpen();
    if (!appeared) {
      const d = Date.now() + 30000;
      while (Date.now() < d && !(appeared = await modalOpen())) await sleep(2000);
    }
    let gone = !appeared;
    if (appeared) {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
      await sleep(1000);
      gone = !(await modalOpen());
    }
    record("W0 Đóng welcome modal (nút Để sau) trước khi test menu", gone,
      appeared ? (gone ? "modal đã xuất hiện sau M0 và đã đóng bằng nút Để sau" : "modal xuất hiện nhưng bấm Để sau KHÔNG đóng được — các case menu có thể bị ảnh hưởng") : "modal không xuất hiện trong 30s sau M0 — chạy tiếp trên editor sạch");
  }

  // M1 — menu bar có đủ 5 nhóm.
  {
    const { bands } = await menuBarBands(session, "m1-menubar.png");
    record("M1 menu bar: 5 nhóm Tệp/Chỉnh sửa/Xem/Cửa sổ/Trợ giúp", bands.length === 5,
      `thấy ${bands.length} dải chữ, centers x=${bands.map((b) => Math.round(b.center)).join(",")}`);
  }

  // M2 — popup Tệp có đủ 8 mục chữ.
  {
    const opened = await openTopMenu(session, 0, "m2-file.png");
    record("M2 popup Tệp: 8 mục chữ (2 separator không chữ)", opened.ok && opened.rows.length === 8,
      opened.ok ? `rows=${opened.rows.length}` : opened.reason);
    await closeAnyMenu(session);
  }

  // M3 — Lưu thành… với dialog nhập tên TRONG APP (ROUND53-J4): thay
  // window.prompt (nổ trong renderer sandbox — bug D3 đợt 51) bằng
  // RenameProjectDialog. Case kiểm chứng: click đúng mục → dialog nhập
  // tên xuất hiện (input điền sẵn tên hiện tại) → gõ tên mới "M3 Doi ten"
  // + bấm Lưu → tên project đổi thật (ô .project-name) → dialog lưu
  // native mở → Escape hủy, KHÔNG file nào được ghi. 0 exception mới.
  // currentPath vẫn null cho M4 (dialog lưu fallback khi chưa có path).
  {
    const excBefore = session.cdp.events.filter((e) => e.method === "__exception__").length;
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const r = await clickMenuItem(session, 0, 5, "m3-saveas.png");
    await sleep(1200); // chờ flow chạy + dialog nhập tên mở
    const renamed = await driveRenameDialog(session, "M3 Doi ten");
    await sleep(800); // chờ dialog lưu native mở sau khi xác nhận tên
    const newExc = session.cdp.events.filter((e) => e.method === "__exception__").slice(excBefore);
    const promptExc = newExc.find((e) => /prompt/i.test(e.detail ?? ""));
    let dlg = await session.findWindow("Lưu dự án");
    if (!dlg) dlg = await waitAnyDialog(session, winsBefore, 3000);
    await session.shotRoot(path.join(SHOTS, "m3-root.png")).catch(() => {});
    await dumpWindows(session, "M3 sau click");
    const main = await session.mainWindow().catch(() => null);
    if (main) await session.shotWindow(main, path.join(SHOTS, "m3-main.png")).catch(() => {});
    // Hủy dialog bằng Escape rồi kiểm tra dialog đóng thật.
    let dlgGone = true;
    if (dlg) {
      await session.x11.pressEscape(); await sleep(800);
      dlgGone = !(await session.listWindows()).some((w) => w.id === dlg.id);
    } else {
      await session.x11.pressEscape(); await sleep(600);
    }
    await dumpWindows(session, "M3 sau Escape");
    const after = await session.h9();
    const actionSeen = after.actions.includes("save-project-as");
    const nameInputs = (await session.projectName()).inputs;
    const renamedOk = nameInputs.includes("M3 Doi ten");
    const saved = await exists(VCUT1);
    const ok = r.ok && actionSeen && newExc.length === 0 && renamed.present && renamed.confirmed && renamedOk && !!dlg && dlgGone && !saved;
    const detail = `click Lưu thành…: ${r.ok ? "đúng mục" : "THẤT BẠI: " + (r.reason ?? "?")}; action save-project-as tới renderer: ${actionSeen}; dialog nhập tên trong app: ${renamed.present ? `xuất hiện (input điền sẵn ${JSON.stringify(renamed.inputBefore)}, xác nhận: ${renamed.confirmed})` : "KHÔNG xuất hiện (bản app cũ — đỏ-trước)"}; tên project sau đổi: ${JSON.stringify(nameInputs)} (kỳ vọng chứa "M3 Doi ten": ${renamedOk}); exception mới sau click: ${newExc.length}${promptExc ? ` (prompt: ${(promptExc.detail ?? "").slice(0, 200)})` : ""}; dialog GTK: ${dlg ? `"${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}, Escape đóng: ${dlgGone}` : "KHÔNG thấy"}; file ${VCUT1} trên đĩa: ${saved ? "CÓ (bất ngờ — hủy mà vẫn ghi?)" : "không có (đúng: hủy thì không ghi)"}; JS dialog CDP: ${JSON.stringify(session.cdp.dialogs.slice(-3))}.`;
    record("M3 Lưu thành… dialog nhập tên trong app: đổi tên thật + dialog lưu mở + Escape hủy, không ghi file", ok, detail);
  }

  // M4 — Lưu dự án (CHƯA có current path): app rơi vào nhánh dialog lưu
  // (desktop.ts saveProjectDesktop(false), !target → saveProjectDialog,
  // KHÔNG qua dialog nhập tên — chỉ Lưu thành… mới hỏi tên). Kỳ vọng:
  // dialog GTK "Lưu dự án" mở, gõ path VCUT1 → file do app tự ghi (meta
  // = tên project hiện tại — sau M3 là "M3 Doi ten" nếu M3 đổi tên xong,
  // đọc động từ ô .project-name thay vì hardcode "Dự án mẫu").
  // VCUT1 để trống từ đầu run nên không có dialog xác nhận ghi đè.
  {
    const st1 = await fs.stat(VCUT1).catch(() => null);
    if (st1) { record("M4 Lưu dự án: dialog lưu fallback + file do app tự ghi", false, "VCUT1 đã tồn tại trước M4 — không dám ghi đè (tránh dialog xác nhận ghi đè), bỏ qua"); }
    else {
    const expectName = (await session.projectName()).inputs[0] ?? "Dự án mẫu";
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const r = await clickMenuItem(session, 0, 4, "m4-save.png");
    let dlg = r.ok ? await waitWindow(session, "Lưu dự án", 6000) : null;
    if (r.ok && !dlg) { dlg = await waitAnyDialog(session, winsBefore, 3000); if (dlg) note(`M4: dialog lưu bằng tiêu đề không thấy, dùng dialog mới "${dlg.title}"`); }
    if (!dlg) {
      record("M4 Lưu dự án: dialog lưu fallback + file do app tự ghi", false, r.ok ? "không thấy dialog Lưu dự án (kỳ vọng dialog fallback khi chưa có current path)" : `click Lưu dự án thất bại: ${r.reason ?? "?"}`);
    } else {
      let typed = await gtkTypePath(session, dlg, VCUT1);
      // Run 18: nếu dialog không đóng sau khi gõ path thì Escape để dọn —
      // dialog modal còn mở sẽ chặn toàn bộ menubar các case sau (run 17).
      let cleanup = "";
      if (!typed) {
        await session.x11.pressEscape(); await sleep(800);
        const stillThere = (await session.listWindows()).some((w) => w.id === dlg.id);
        cleanup = stillThere ? "; Escape dọn dialog: KHÔNG đóng được (dialog vẫn còn)" : "; Escape đã đóng dialog kẹt";
        if (!stillThere) typed = true; // dialog đã đóng (dù không phải do gõ path) — ghi rõ trong detail
      }
      await sleep(1000);
      const st2 = await fs.stat(VCUT1).catch(() => null);
      let valid = false;
      // ROUND55-L3: file app ghi là envelope {spec} (format vcut-project)
      // — đọc meta/tracks qua spec như D2a (dòng cũ đọc j.meta/j.tracks
      // ở top-level nên valid luôn false dù file ghi đúng).
      if (st2) { try { const j = JSON.parse(await fs.readFile(VCUT1, "utf8")); const spec = j?.spec ?? j; valid = spec?.meta?.name === expectName && Array.isArray(spec.tracks) && spec.tracks.length > 0; } catch {} }
      const after = await session.h9();
      const actionSeen = after.actions.includes("save-project");
      const cur = await session.currentPath();
      record("M4 Lưu dự án: dialog lưu fallback + file do app tự ghi", r.ok && actionSeen && !!st2 && valid && cur === VCUT1,
        `dialog "${dlg.title}" đóng: ${typed}${cleanup}; action save-project: ${actionSeen}; file ghi: ${!!st2} (${st2 ? st2.size + " byte" : "?"}), JSON hợp lệ + meta "${expectName}" + có tracks: ${valid}; currentPath=${cur}`);
    }
    }
  }

  // M5 — Mở dự án… qua dialog GTK: mở VCUT1 (M4 vừa ghi) hoặc fixture
  // H9-Fixture.vcut nếu M4 thất bại — M5 không phụ thuộc M3/M4. Tên
  // project nằm trong ô input (value, KHÔNG có trong innerText) nên kiểm
  // bằng projectName() + meta.name đọc từ chính file trên đĩa.
  // ROUND53-J3: fail-fast nếu fixture thiếu (ensureFixtures đã tạo ở
  // main, đây là kiểm tra lại ngay trước case).
  {
    if (!(await exists(FIXTURE1)) || !(await requireFixture(FIXTURE1))) {
      record("M5 Mở dự án… qua dialog GTK: file load đúng, recent + current path đúng", false, `FAIL-FAST: fixture thiếu/hỏng: ${FIXTURE1} — không chạy mù (đợt 52 §5.3)`);
    } else {
    const target = (await exists(VCUT1)) ? VCUT1 : FIXTURE1;
    let expectName = "H9 Doubleclick";
    // ROUND55-L3: target có thể là VCUT1 do app ghi (envelope {spec}) —
    // đọc tên qua spec như D2a (dòng cũ đọc j.meta nên expectName kẹt
    // "H9 Doubleclick" dù tên thật trong file là "M3 Doi ten").
    try { const j = JSON.parse(await fs.readFile(target, "utf8")); const spec = j?.spec ?? j; if (spec?.meta?.name) expectName = spec.meta.name; } catch {}
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const r = await clickMenuItem(session, 0, 1, "m5-open.png");
    let dlg = r.ok ? await waitWindow(session, "Mở dự án", 6000) : null;
    if (r.ok && !dlg) { dlg = await waitAnyDialog(session, winsBefore, 3000); if (dlg) note(`M5: dialog mở bằng tiêu đề không thấy, dùng dialog mới "${dlg.title}"`); }
    let detail = r.ok ? "" : (r.reason ?? "");
    let loaded = false;
    if (dlg) {
      const typed = await gtkTypePath(session, dlg, target);
      await sleep(1500);
      // ROUND54-K4: mở file khi project đang dirty sẽ mở dialog
      // discard-confirm sau khi chọn file — trả lời Ok trước khi đọc kết quả.
      const dlgM5 = await answerDiscardDialog(session, { accept: true, tag: "M5" });
      try {
        const after = await session.h9();
        const nameInputs = (await session.projectName()).inputs;
        const clips = await session.clipInfo();
        const cur = await session.currentPath();
        const settings = await settingsJson();
        loaded = after.openFiles.includes(target) && nameInputs.includes(expectName) && cur === target && clips.count >= 3;
        if (loaded) OPENED_FILE = target;
        detail = `mở file: ${target} (kỳ vọng tên "${expectName}"); dialog đóng: ${typed}; dialog discard-confirm: ${dlgM5.detail}; onOpenFile nhận path: ${after.openFiles.includes(target)}; tên trong ô nhập: ${JSON.stringify(nameInputs)}; currentPath=${cur}; clips=${clips.count}; recent[0]=${settings?.recentProjects?.[0] ?? "?"}`;
      } catch (e) {
        // ROUND54-K4: renderer kẹt (dialog chưa trả lời được → evaluate
        // timeout) — ghi FAIL rõ lý do thay vì crash cả phaseMenu như
        // baseline r54k4 (M5 chết ở h9() sau khi confirm mở).
        detail = `mở file: ${target}; dialog GTK đóng: ${typed}; dialog discard-confirm: ${dlgM5.detail}; đọc trạng thái sau mở LỖI: ${e.message} (renderer có thể đang kẹt trong dialog chưa trả lời được)`;
      }
    } else if (!r.ok) detail = `click Mở dự án… thất bại: ${r.reason ?? "?"}`;
    else detail = "không thấy dialog Mở dự án";
    record("M5 Mở dự án… qua dialog GTK: file load đúng, recent + current path đúng", loaded, detail);
    }
  }

  // M6 — Thêm media…: dialog xuất hiện, Escape hủy, không import gì.
  // ROUND53-J3 (điều tra M6 đợt 52: Escape không đóng dialog): dialog
  // GTK "Thêm media vào dự án" (main.ts:530, title đầy đủ — waitWindow
  // khớp substring "Thêm media").
  // PHÁT HIỆN ĐỢT 53 (bằng chứng m6-dialog.png + m6-media.png + menu.ts):
  // M6 bấm NHẦM mục — code cũ clickMenuItem(0, 3) nhưng theo menu.ts thì
  // dòng 2 mới là Thêm media…, dòng 3 là Mở gần đây (comment cũ ghi
  // ngược). Cú click cũ mở submenu Mở gần đây (cửa sổ 195x40) thay vì
  // dialog; waitAnyDialog fallback vớ phải popup Tệp còn mở (250x298,
  // title rỗng) rồi Escape đóng popup → PASS GIẢ. Đợt 52 fail cũng vì
  // cùng nhầm lẫn này (Escape không tới đúng cửa sổ). Nay: click đúng
  // dòng 2; chỉ chấp nhận dialog tìm bằng title HOẶC fallback có
  // width >= 400 (dialog GTK ~1124x822; popup menu chỉ ~250 — loại
  // trừ false pass cũ); focus dialog TRƯỚC khi Escape; nếu Escape vẫn
  // không đóng thì click nút Hủy (thứ 2 từ phải: [Hủy][Mở]).
  {
    const before = await session.h9();
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const r = await clickMenuItem(session, 0, 2, "m6-media.png"); // Thêm media… là dòng 2 (dòng 3 là Mở gần đây)
    let dlg = r.ok ? await waitWindow(session, "Thêm media", 8000) : null;
    let foundBy = dlg ? "title" : null;
    if (r.ok && !dlg) {
      const cand = await waitAnyDialog(session, winsBefore, 3000);
      // Chỉ chấp nhận cửa sổ đủ lớn mới là dialog GTK — popup menu
      // (~250px, title rỗng) không được tính là dialog (chống PASS GIẢ).
      if (cand && cand.geo.width >= 400) { dlg = cand; foundBy = "fallback-lớn"; note(`M6: dialog thêm-media bằng tiêu đề không thấy sau 8s, dùng dialog mới "${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}@${dlg.geo.x},${dlg.geo.y}`); }
      else if (cand) note(`M6: fallback chỉ thấy cửa sổ nhỏ "${cand.title}" ${cand.geo.width}x${cand.geo.height} — KHÔNG tính là dialog (có thể là popup menu còn mở)`);
    }
    let ok = false; let detail = r.ok ? "" : (r.reason ?? "");
    if (dlg) {
      await dumpWindows(session, "M6 dialog lúc tìm thấy");
      await session.shotWindow(dlg, path.join(SHOTS, "m6-dialog.png")).catch(() => {});
      // Focus dialog trước khi Escape (xem chú thích đầu block).
      await session.x11.activateWindow(dlg.id);
      try { session.x11.setInputFocus(dlg.id); } catch {}
      await sleep(500);
      await session.x11.pressEscape();
      let gone = await waitWindowGone(session, dlg.id, 5000);
      let closedBy = gone ? "Escape (sau focus)" : null;
      if (!gone) {
        // Fallback: click nút Hủy (thứ 2 từ phải: [Hủy][Mở]).
        const btn = await clickDialogButton(session, dlg, 1, "m6-dialog-cancel.png").catch(() => ({ ok: false }));
        await sleep(800);
        gone = await waitWindowGone(session, dlg.id, 5000);
        if (gone) closedBy = `nút Hủy (thấy ${btn.cols ?? "?"} nút, click: ${btn.ok})`;
        else note(`M6: Escape (sau focus) KHÔNG đóng + click nút Hủy cũng KHÔNG đóng (thấy ${btn.cols ?? "?"} nút, click: ${btn.ok}) — dialog "${dlg.title}" ${dlg.geo.width}x${dlg.geo.height} vẫn còn; cửa sổ lúc đó: ${(await session.listWindows()).map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}`).join(" | ")}`);
      }
      const after = await session.h9();
      ok = gone && after.openFiles.length === before.openFiles.length;
      detail = `dialog tìm bằng: ${foundBy} ("${dlg.title}" ${dlg.geo.width}x${dlg.geo.height}@${dlg.geo.x},${dlg.geo.y}); đóng bằng: ${closedBy ?? "KHÔNG đóng được"}; không file nào được mở thêm: ${after.openFiles.length === before.openFiles.length}`;
    } else if (!r.ok) detail = `click Thêm media… thất bại: ${r.reason ?? "?"}`;
    else detail = "không thấy dialog Thêm media (cả title lẫn fallback)";
    record("M6 Thêm media…: dialog xuất hiện, Escape hủy sạch", ok, detail);
  }

  // M7 — Mở gần đây (submenu): hover mở submenu, click entry vừa mở (M5).
  // ROUND53-J3 (điều tra M7 đợt 52: submenu không mở sau hover):
  // PHÁT HIỆN — code cũ hover NHẦM dòng: clickSubmenuItem(0, 2, ...) nhưng
  // theo menu.ts thì dòng 2 là Thêm media… (KHÔNG có submenu), dòng 3 mới
  // là Mở gần đây. Bằng chứng: m7-recent-no-sub-root.png cho thấy chuột
  // đang highlight "Thêm media…", không có submenu nào — hover đúng chỗ
  // nhưng sai mục. Nay hover đúng dòng 3.
  // M7 nay KHÔNG phụ thuộc M5: main() đã seed recentProjects=[FIXTURE1]
  // vào settings.json trước khi launch, nên submenu luôn có ít nhất 1
  // entry thật; target = recent[0] lúc chạy M7 (file M5 vừa mở nếu M5
  // pass, else fixture đã seed).
  {
    const settingsBefore = await settingsJson();
    note(`M7: recentProjects trước hover: ${JSON.stringify(settingsBefore?.recentProjects ?? null)}; OPENED_FILE=${OPENED_FILE ?? "(chưa có)"}`);
    const target = settingsBefore?.recentProjects?.[0] ?? OPENED_FILE ?? VCUT1;
    let expectName = "H9 Doubleclick";
    // ROUND55-L3: target có thể là file app ghi (envelope {spec}) — đọc
    // tên qua spec như D2a.
    try { const j = JSON.parse(await fs.readFile(target, "utf8")); const spec = j?.spec ?? j; if (spec?.meta?.name) expectName = spec.meta.name; } catch {}
    const r = await clickSubmenuItem(session, 0, 3, 0, "m7-recent.png"); // Mở gần đây là dòng 3 (dòng 2 là Thêm media…)
    // ROUND54-K4: click entry Recent khi project đang dirty sẽ mở dialog
    // discard-confirm (window.confirm) — trả lời Ok TRƯỚC khi poll tên.
    // Đợt 53 không làm bước này nên dialog treo từ M7 tới M26, cascade
    // fail toàn bộ menu sau đó. Accept = cho flow mở file chạy tiếp.
    const dlgM7 = await answerDiscardDialog(session, { accept: true, tag: "M7" });
    // ROUND53-J3: poll tên project tới 10s thay vì đọc 1 lần sau 1,5s —
    // đường open-file là async (đọc file qua IPC + rehydrate); r53j3c
    // đo được onOpenFile=true nhưng tên vẫn "Dự án không tên" ở 1,5s,
    // chưa phân biệt được "load chậm" vs "load hỏng". Poll sẽ cho biết:
    // tên đổi thành expectName muộn = load chậm (harness chờ chưa đủ);
    // tên kẹt ở "Dự án không tên" sau 10s = load hỏng (bug sản phẩm).
    let nameInputs = [];
    let ok = false;
    let pollError = null;
    const pollDeadline = Date.now() + 10000;
    while (Date.now() < pollDeadline) {
      try {
        const after = await session.h9();
        nameInputs = (await session.projectName()).inputs;
        if (r.ok && after.openFiles.includes(target) && nameInputs.includes(expectName)) { ok = true; break; }
      } catch (e) {
        // ROUND54-K4: renderer có thể đang kẹt trong dialog confirm chưa
        // được trả lời (evaluate timeout sau 20s) — ghi lại thay vì crash
        // cả phaseMenu (đợt 53: poll không có try/catch).
        pollError = e.message;
        break;
      }
      await sleep(500);
    }
    const after = await session.h9().catch(() => null);
    record("M7 Mở gần đây: submenu mở, click entry load lại project", ok,
      r.ok ? `submenu rows=${r.subRows}, target=${target}; dialog discard-confirm: ${dlgM7.detail}; onOpenFile: ${after ? after.openFiles.includes(target) : "(không đọc được — renderer kẹt?)"}, tên trong ô nhập: ${JSON.stringify(nameInputs)} (kỳ vọng "${expectName}")${pollError ? `; poll lỗi: ${pollError}` : ""}` : (r.reason ?? ""));
  }

  // M8 — Xuất video…: panel export mở trong DOM.
  {
    const before = await session.h9();
    const textBefore = await session.bodyText();
    const r = await clickMenuItem(session, 0, 6, "m8-export.png");
    await sleep(1200);
    const after = await session.h9();
    const text = await session.bodyText();
    const actionSeen = after.actions.includes("export-video");
    const panelOpen = /Xuất video/i.test(text) && Math.abs(text.length - textBefore.length) > 100;
    record("M8 Xuất video…: action tới renderer + panel export mở", r.ok && actionSeen && panelOpen,
      `action export-video: ${actionSeen}; textLen ${textBefore.length} → ${text.length}`);
    // Đóng panel bằng Escape (nếu là modal) để các case sau sạch.
    await session.x11.pressEscape(); await sleep(500);
  }

  // M9 — Dự án mới: project reset (clip timeline 3 → 0).
  {
    const before = await session.clipInfo();
    const r = await clickMenuItem(session, 0, 0, "m9-new.png");
    await sleep(1200);
    const after = await session.h9();
    const clips = await session.clipInfo();
    const ok = r.ok && after.actions.includes("new-project") && before.count >= 3 && clips.count === 0;
    record("M9 Dự án mới: project reset (clip timeline về 0)", ok,
      `action new-project: ${after.actions.includes("new-project")}; clips ${before.count} → ${clips.count}`);
  }

  // M10 — Hoàn tác: khôi phục project vừa bỏ (clip 0 → 3).
  {
    const r = await clickMenuItem(session, 1, 0, "m10-undo.png");
    await sleep(1200);
    const after = await session.h9();
    const clips = await session.clipInfo();
    const ok = r.ok && after.actions.includes("undo") && clips.count >= 3;
    record("M10 Hoàn tác sau Dự án mới: khôi phục project (clip về lại 3)", ok,
      `action undo: ${after.actions.includes("undo")}; clips=${clips.count}; labels=${JSON.stringify(clips.labels)}`);
  }

  // M11 — Làm lại: quay lại project mới trống (clip 3 → 0).
  {
    const r = await clickMenuItem(session, 1, 1, "m11-redo.png");
    await sleep(1200);
    const after = await session.h9();
    const clips = await session.clipInfo();
    const ok = r.ok && after.actions.includes("redo") && clips.count === 0;
    record("M11 Làm lại: quay lại project mới trống (clip về 0)", ok,
      `action redo: ${after.actions.includes("redo")}; clips=${clips.count}`);
  }

  // M12 — Chọn tất cả + Xóa trên project có clip: clip 3 → 0, undo → 3.
  // Setup: sau M11 (redo → project mới trống), một lần Hoàn tác quay lại
  // project có clip — KHÔNG mở lại qua Recent (project đang dirty nên
  // confirmDiscardProject sẽ mở dialog confirm native và chặn flow; đường
  // Recent đã được M7 kiểm chứng; confirm() mở dialog native thật, chỉ
  // prompt() là ném lỗi — thí nghiệm dialog 06/11).
  {
    const r0 = await clickMenuItem(session, 1, 0, "m12-undo-setup.png"); // Hoàn tác
    await sleep(1200);
    const full = await session.clipInfo();
    if (full.count < 3) note(`M12 setup: Hoàn tác sau M11 chỉ khôi phục được ${full.count} clip (kỳ vọng >=3) — case có thể fail ở bước kiểm tra`);
    const r1 = await clickMenuItem(session, 1, 7, "m12-selectall.png");
    await sleep(800);
    const sel = await session.clipInfo();
    const r2 = await clickMenuItem(session, 1, 6, "m12-delete.png");
    await sleep(1200);
    const afterDelete = await session.clipInfo();
    const after = await session.h9();
    const sawSelectAll = after.actions.includes("select-all");
    const sawDelete = after.actions.includes("delete");
    // Undo để khôi phục cho các case sau.
    await clickMenuItem(session, 1, 0, "m12-undo.png");
    await sleep(1000);
    const restored = await session.clipInfo();
    const ok = r1.ok && r2.ok && sawSelectAll && sawDelete && full.count >= 3 && sel.selected === full.count && afterDelete.count === 0 && restored.count === full.count;
    record("M12 Chọn tất cả + Xóa: clip 3 → 0 (đã chọn hết trước khi xóa), undo khôi phục", ok,
      `select-all: ${sawSelectAll} (đã chọn ${sel.selected}/${full.count}), delete: ${sawDelete}; clips ${full.count} → ${afterDelete.count} → undo ${restored.count}`);
  }

  // M13 — Sao chép + Dán: nhân bản clip (3 → 6); rồi undo 1 lần.
  {
    const before = await session.clipInfo();
    await clickMenuItem(session, 1, 7, "m13-selectall.png"); // chọn tất cả
    await sleep(600);
    await clickMenuItem(session, 1, 3, "m13-copy.png"); // sao chép
    await sleep(600);
    const r = await clickMenuItem(session, 1, 4, "m13-paste.png"); // dán
    await sleep(1200);
    const afterPaste = await session.clipInfo();
    const after = await session.h9();
    const ok = r.ok && after.actions.includes("copy") && after.actions.includes("paste") && before.count >= 3 && afterPaste.count === before.count * 2;
    record("M13 Sao chép + Dán: clip nhân đôi (3 → 6)", ok,
      `copy: ${after.actions.includes("copy")}, paste: ${after.actions.includes("paste")}; clips ${before.count} → ${afterPaste.count}`);
    await clickMenuItem(session, 1, 0, "m13-undo.png"); await sleep(800); // undo lần dán
  }

  // M14 — Cắt: chọn tất cả + cắt → clip 3 → 0; undo khôi phục.
  {
    const before = await session.clipInfo();
    await clickMenuItem(session, 1, 7, "m14-selectall.png");
    await sleep(600);
    const r = await clickMenuItem(session, 1, 2, "m14-cut.png");
    await sleep(1200);
    const afterCut = await session.clipInfo();
    const after = await session.h9();
    const ok = r.ok && after.actions.includes("cut") && before.count >= 3 && afterCut.count === 0;
    record("M14 Cắt: clip bị cắt khỏi timeline (3 → 0)", ok,
      `cut: ${after.actions.includes("cut")}; clips ${before.count} → ${afterCut.count}`);
    await clickMenuItem(session, 1, 0, "m14-undo.png"); await sleep(800);
  }

  // M15 — Nhân bản clip: clip 3 → 6.
  {
    const before = await session.clipInfo();
    await clickMenuItem(session, 1, 7, "m15-selectall.png");
    await sleep(600);
    const r = await clickMenuItem(session, 1, 5, "m15-duplicate.png");
    await sleep(1200);
    const afterDup = await session.clipInfo();
    const after = await session.h9();
    const ok = r.ok && after.actions.includes("duplicate") && before.count >= 3 && afterDup.count === before.count * 2;
    record("M15 Nhân bản clip: clip nhân đôi (3 → 6)", ok,
      `duplicate: ${after.actions.includes("duplicate")}; clips ${before.count} → ${afterDup.count}`);
    await clickMenuItem(session, 1, 0, "m15-undo.png"); await sleep(800);
  }

  // M16 — Xem > Tải lại: trang reload thật (marker JS mất sau reload), probe cài lại.
  {
    await session.cdp.evaluate(`window.__h9ReloadMarker = "truoc-reload"`);
    const r = await clickMenuItem(session, 2, 0, "m16-reload.png");
    await sleep(2500);
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
    record("M16 Tải lại (role reload): trang reload thật (marker mất), editor mount lại", r.ok && alive && markerGone,
      `click Tải lại: ${r.ok}; marker sau reload: ${info?.marker ?? "?"} (mất = reload thật); rootChildren=${info?.rootChildren}, textLen=${info?.textLen}`);
  }

  // M17 — Zoom: phóng to → clientWidth CSS giảm; đặt lại → về như cũ.
  {
    const w0 = await session.cdp.evaluate(`window.innerWidth`);
    const r1 = await clickMenuItem(session, 2, 4, "m17-zoomin.png"); // Phóng to là dòng 4 (dòng 3 là Đặt lại zoom)
    await sleep(800);
    const w1 = await session.cdp.evaluate(`window.innerWidth`);
    const r2 = await clickMenuItem(session, 2, 3, "m17-zoomreset.png"); // Đặt lại zoom là dòng 3
    await sleep(800);
    const w2 = await session.cdp.evaluate(`window.innerWidth`);
    const ok = r1.ok && r2.ok && w1 < w0 && Math.abs(w2 - w0) <= 2;
    record("M17 Phóng to / Đặt lại mức thu phóng (role zoom)", ok, `innerWidth ${w0} → phóng to ${w1} → reset ${w2}`);
  }

  // M18 — Toàn màn hình: bật → menu ẩn (Electron tự ẩn menu khi vào FS),
  // tắt bằng F11 → menu hiện lại + geometry về cũ.
  // ROUND55-L7 (đổi tiêu chí theo fsprobe F0–F4, 8/8 PASS): tiêu chí cũ
  // "geometry thành kích thước màn hình" KHÔNG đo được trên Xvfb không WM
  // — click bật làm menu ẩn (bands 5→2, centers 591,685) nhưng geometry
  // vẫn 1440x900 và _NET_WM_STATE=[] (không có WM nào resize cửa sổ hay
  // set _NET_WM_STATE_FULLSCREEN). Tiêu chí cũ còn gây cascade: click
  // tắt bằng menu là bất khả khi menu đã ẩn → M19–M26 chết theo (lượt
  // menu-fix1). Tiêu chí mới đo đúng cái menu item điều khiển được:
  // toggle trạng thái FS (menu ẩn/hiện) + thoát sạch bằng F11 (phím chuẩn
  // của Chromium; K3 P8b cũng dùng F11). Geometry ghi trong detail như
  // giới hạn môi trường — cần máy thật/WM mới kiểm chứng được resize.
  {
    const main0 = await session.mainWindow();
    const r1 = await clickMenuItem(session, 2, 6, "m18-fs.png");
    await sleep(1000);
    const main1 = await session.mainWindow();
    const { bands: bandsFs } = await menuBarBands(session, "m18-fs-on.png");
    const state1 = main1 ? await wmStateNames(session, main1.id) : [];
    const menuHidden = bandsFs.length !== 5;
    // Thoát bằng F11 (menu đã ẩn nên không click menu để tắt được).
    await session.x11.pressKeysym(0xffc8);
    await sleep(1200);
    const main2 = await session.mainWindow();
    const { bands: bandsBack } = await menuBarBands(session, "m18-fs-off.png");
    const back = bandsBack.length === 5 && !!main2 && main2.geo.width === main0.geo.width && main2.geo.height === main0.geo.height;
    record("M18 Toàn màn hình: bật (menu ẩn), tắt bằng F11 (menu hiện lại)", r1.ok && menuHidden && back,
      `click bật: ${r1.ok ? "đúng mục" : "THẤT BẠI: " + (r1.reason ?? "?")}; sau bật: geometry ${main0.geo.width}x${main0.geo.height} → ${main1?.geo.width}x${main1?.geo.height} (màn hình ${SCREEN.w}x${SCREEN.h}); _NET_WM_STATE=[${state1.join(", ")}]; bands=${bandsFs.length} (menu ẩn: ${menuHidden}); sau F11: bands=${bandsBack.length}, về ${main2?.geo.width}x${main2?.geo.height} (về đúng: ${back}); GIỚI HẠN MÔI TRƯỜNG: geometry không thành kích thước màn hình vì Xvfb không có WM resize cửa sổ — chỉ kiểm chứng được toggle trạng thái + thoát sạch`);
  }

  // M19 — Ngôn ngữ: Xem > Ngôn ngữ > English → web + menu đổi sang tiếng Anh, rồi về vi.
  // ROUND55-L7 (sửa check sai của đợt trước theo K3 §4): nút EN KHÔNG
  // phải "Export" mà là "Publish", và nhóm literal ProjectMenu vẫn giữ
  // tiếng Việt ở chế độ EN (nợ i18n thật của sản phẩm — đo riêng ở M19b).
  // Check cũ `/Export/ && !/Xuất/` sai cả hai chiều: "Export" không bao
  // giờ xuất hiện, "/Xuất/" thì gộp cả literal ProjectMenu nên M19 không
  // bao giờ pass dù cơ chế menu→IPC→renderer hoạt động đúng. Check mới:
  // web đổi EN = TopBar đã i18n hoá chuyển thật ("Publish" + "Cut
  // silence" theo K3 §4: VI 0 → EN 1).
  {
    const r1 = await clickSubmenuItem(session, 2, 7, 1, "m19-lang-en.png");
    await sleep(1500);
    const after = await session.h9();
    const textEn = await session.bodyText();
    const { bands: bandsEn } = await menuBarBands(session, "m19-menubar-en.png");
    const langSeen = after.langs.includes("en");
    const webEn = /Publish/.test(textEn) && /Cut silence/.test(textEn);
    const menuEn = bandsEn.length === 5;
    const r2 = await clickSubmenuItem(session, 2, 7, 0, "m19-lang-vi.png");
    await sleep(1500);
    const after2 = await session.h9();
    const textVi = await session.bodyText();
    const backVi = after2.langs.includes("vi") && /Xuất/.test(textVi) && !/Export/.test(textVi);
    record("M19 Ngôn ngữ English ↔ Tiếng Việt: menu + web đổi theo thật", r1.ok && r2.ok && langSeen && webEn && menuEn && backVi,
      `lang en tới renderer: ${langSeen}; web EN (Publish + Cut silence): ${webEn}; menu bar EN ${bandsEn.length} dải (đủ 5: ${menuEn}); về vi: ${backVi}`);
    // M19b — nợ i18n thật (K3 §4): ProjectMenu dùng literal tiếng Việt
    // cứng + không useLang(), "Bắt đầu" literal ở TopBar — nhóm này vẫn
    // tiếng Việt ở chế độ EN. Đo riêng để M19 (cơ chế menu) không bị
    // gộp với nợ sản phẩm; case này FAIL cho tới khi có luồng i18n hoá
    // ProjectMenu + "Bắt đầu".
    const literals = ["Mới", "Lưu thành…", "Xuất bản nén", "Nhập bản nén", "Lịch sử", "Chưa lưu", "Bắt đầu"].filter((s) => textEn.includes(s));
    record("M19b ProjectMenu literal tiếng Việt còn sót ở chế độ EN (nợ i18n — xem LIMITS đợt 54 K3 §4)", literals.length === 0,
      literals.length === 0 ? "không còn literal tiếng Việt trong bodyText ở chế độ EN" : `còn tiếng Việt ở chế độ EN: ${literals.map((s) => JSON.stringify(s)).join(", ")} (ProjectMenu.tsx literal cứng + không useLang(); TopBar.tsx "Bắt đầu")`);
  }

  // M20 — Công cụ nhà phát triển: target DevTools xuất hiện, đóng được.
  {
    const r = await clickMenuItem(session, 2, 2, "m20-devtools.png");
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
    record("M20 Công cụ nhà phát triển: cửa sổ DevTools mở thật, đóng được", r.ok && !!dt && closed,
      `DevTools target: ${dt ? dt.url.slice(0, 60) : "không thấy"}; đóng xong: ${closed}`);
  }

  // M21 — Thu nhỏ cửa sổ: map-state Unmapped (Xvfb không có WM nên
  // _NET_WM_STATE_HIDDEN không bao giờ được set — kiểm chứng bằng
  // GetWindowAttributes), rồi XMapWindow hiện lại.
  {
    const main = await session.mainWindow();
    const r = await clickMenuItem(session, 3, 0, "m21-min.png");
    await sleep(1000);
    const st = await session.x11.getWindowAttributes(main.id).catch(() => null);
    const unmapped = st ? st.mapState !== 2 : false;
    session.x11.mapWindow(main.id);
    await sleep(1200);
    const st2 = await session.x11.getWindowAttributes(main.id).catch(() => null);
    const viewable = st2 ? st2.mapState === 2 : false;
    const main2 = await session.mainWindow();
    record("M21 Thu nhỏ cửa sổ: Unmapped thật, XMapWindow hiện lại", r.ok && unmapped && viewable && !!main2,
      `sau Thu nhỏ map-state=${st?.mapState} (2=Viewable); sau XMapWindow map-state=${st2?.mapState}, cửa sổ còn trong tree: ${!!main2}`);
  }

  // M22 — Giới thiệu: message box xuất hiện, click Đóng.
  {
    const r = await clickMenuItem(session, 4, 0, "m22-about.png");
    const dlg = r.ok ? await waitWindow(session, "Giới thiệu", 6000) : null;
    let ok = false; let detail = r.ok ? "" : (r.reason ?? "");
    if (dlg) {
      const btn = await clickDialogButton(session, dlg, 0, "m22-about-dlg.png");
      const gone = await waitWindowGone(session, dlg.id, 5000);
      ok = btn.ok && gone;
      detail = `dialog "Giới thiệu VCut Studio" xuất hiện (${dlg.geo.width}x${dlg.geo.height}), nút Đóng click được: ${btn.ok}, dialog đóng: ${gone}`;
    } else detail = "không thấy dialog Giới thiệu";
    record("M22 Giới thiệu: dialog native xuất hiện, Đóng đóng được", ok, detail);
  }

  // M23 — Phím tắt: message box 1 nút Đóng.
  {
    const r = await clickMenuItem(session, 4, 1, "m23-shortcuts.png");
    const dlg = r.ok ? await waitWindow(session, "Phím tắt", 6000) : null;
    let ok = false; let detail = r.ok ? "" : (r.reason ?? "");
    if (dlg) {
      const btn = await clickDialogButton(session, dlg, 0, "m23-shortcuts-dlg.png");
      const gone = await waitWindowGone(session, dlg.id, 5000);
      ok = btn.ok && gone;
      detail = `dialog "Phím tắt" xuất hiện, nút Đóng click được: ${btn.ok}, dialog đóng: ${gone}`;
    } else detail = "không thấy dialog Phím tắt";
    record("M23 Phím tắt: dialog native xuất hiện, Đóng đóng được", ok, detail);
  }

  // M24 — Báo lỗi…: message box 4 nút, click Đóng (phải nhất).
  {
    const r = await clickMenuItem(session, 4, 3, "m24-reportbug.png");
    const dlg = r.ok ? await waitWindow(session, "Báo lỗi", 6000) : null;
    let ok = false; let detail = r.ok ? "" : (r.reason ?? "");
    if (dlg) {
      const btn = await clickDialogButton(session, dlg, 0, "m24-reportbug-dlg.png");
      const gone = await waitWindowGone(session, dlg.id, 5000);
      ok = btn.ok && gone;
      detail = `dialog "Báo lỗi" xuất hiện, thấy ${btn.cols ?? "?"} nút, Đóng click được: ${btn.ok}, dialog đóng: ${gone}`;
    } else detail = "không thấy dialog Báo lỗi";
    record("M24 Báo lỗi…: dialog native xuất hiện, Đóng đóng được", ok, detail);
  }

  // M25 — Tài liệu hướng dẫn: openExternal (không có trình duyệt trên VM) — app phải còn sống.
  {
    const r = await clickMenuItem(session, 4, 2, "m25-docs.png");
    await sleep(1500);
    const alive = session.child.exitCode === null;
    const wins = await session.listWindows();
    const text = await session.bodyText().catch(() => "");
    record("M25 Tài liệu hướng dẫn: openExternal không crash app", r.ok && alive && text.length > 300,
      `app còn chạy: ${alive}; cửa sổ hiện có: ${wins.map((w) => w.title || "(không tên)").join(" | ").slice(0, 200)}`);
  }

  // M26 — Thoát: app thoát sạch, không mồ côi.
  {
    const r = await clickMenuItem(session, 0, 7, "m26-exit.png");
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && session.child.exitCode === null) await sleep(250);
    const exited = session.child.exitCode !== null;
    const leftover = await run("pgrep", ["-f", `remote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 });
    record("M26 Thoát: app thoát, không còn tiến trình Electron", r.ok && exited && leftover.code !== 0,
      `click Thoát: ${r.ok}; exitCode=${session.child.exitCode}; pgrep còn tiến trình: ${leftover.code === 0}`);
    if (session.cdp) { session.cdp.close(); session.cdp = null; }
  }
}

// ---------------- Phase DOUBLE-CLICK .vcut ----------------
async function phaseDclick(session) {
  // D1 — khởi động AppImage với đường dẫn .vcut làm argv (đúng code path
  // mà .desktop Exec / double-click dùng: findProjectPathInArgv). File là
  // file M5 đã mở (VCUT1 do app tự ghi, hoặc fixture nếu M4 thất bại).
  // ROUND53-J3: fail-fast nếu file target không tồn tại (đợt 52: D1 chạy
  // mù với file đã bị reboot xóa → app đọc ENOENT, probe miss event).
  // NHƯNG app vẫn phải launch (không argv) để D2a/D2b/D3/D4 còn app để
  // chạy — đợt 53 lượt 1: D1 fail-fast bỏ luôn launch làm D2a crash
  // "Cannot read properties of null (reading 'events')" vì session.cdp
  // null. Nay: launch luôn, chỉ bỏ qua bước KIỂM CHỨNG D1 khi thiếu file.
  const target = OPENED_FILE ?? VCUT1;
  // ROUND53-J3 (sau reboot 06/11 21:55 UTC: /tmp bị xóa, testdir trống):
  // nếu target là VCUT1 mặc định mà thiếu (chạy --only dclick, hoặc menu
  // phase không chạy / M5 không mở file nào), tự tạo lại từ fixture chuẩn
  // FIXTURE1 (cùng nội dung "H9 Doubleclick", verify bằng JSON.parse) để
  // D1/D3 có file thật trên đĩa. Chỉ áp dụng cho VCUT1 mặc định; file do
  // M5 mở (OPENED_FILE) thì KHÔNG tự tạo — fail-fast giữ nguyên để không
  // che bug M5.
  if (!OPENED_FILE && !(await exists(target))) {
    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(FIXTURE1, target);
      const back = JSON.parse(await fs.readFile(target, "utf8"));
      if (back?.meta?.name !== "H9 Doubleclick") throw new Error("fixture copy verify: meta.name sai");
      note(`D1: tự tạo lại ${target} từ fixture chuẩn (testdir bị xóa)`);
    } catch (e) {
      note(`D1: không tạo lại được ${target} từ fixture: ${e.message} — fail-fast như cũ`);
    }
  }
  const targetExists = await exists(target);
  if (!targetExists) {
    record("D1 Double-click .vcut (argv): project load đúng, current path + recent đúng", false,
      `FAIL-FAST: file target không tồn tại: ${target} — không chạy mù (đợt 52 §5.3); app vẫn launch không argv để D2a/D2b/D3/D4 chạy tiếp`);
    note(`D1 fail-fast: ${target} không tồn tại lúc bắt đầu phaseDclick`);
  }
  const info = await session.launchAppImage({ argvFiles: targetExists ? [target] : [], label: "dclick" });
  if (!targetExists) {
    // App đã launch không argv — D1 không có gì để kiểm chứng, các case
    // sau dùng app đang chạy này.
  } else {
  let expectName = "H9 Doubleclick";
  // ROUND55-L3: target có thể là file app ghi (envelope {spec}) — đọc tên
  // qua spec như D2a.
  try { const j = JSON.parse(await fs.readFile(target, "utf8")); const spec = j?.spec ?? j; if (spec?.meta?.name) expectName = spec.meta.name; } catch {}
  await sleep(2500); // chờ open-file flow chạy xong (async rehydrate)
  // ROUND54-K4: launch mới với project mẫu có thể dirty → confirm mở
  // sau khi open-file chạy; trả lời Ok trước khi đọc kết quả.
  const dlgD1 = await answerDiscardDialog(session, { accept: true, tag: "D1" });
  const after = await session.h9();
  const nameInputs = (await session.projectName()).inputs;
  const cur = await session.currentPath();
  const settings = await settingsJson();
  // ROUND54-K4: onOpenFile của probe KHÔNG còn là tiêu chí pass cho
  // event queued lúc khởi động — hàng đợi preload giao event queued CHỈ
  // cho subscriber đầu tiên (web bridge, đăng ký ở mount), probe đăng ký
  // sau nên đúng ra không thấy (xem openFileQueue.ts). Ground truth là
  // file đã load thật: tên + currentPath + recent[0] đều đúng. onOpenFile
  // của probe chỉ còn là bằng chứng phụ (ghi trong detail).
  const ok = nameInputs.includes(expectName) && cur === target && settings?.recentProjects?.[0] === target;
  record("D1 Double-click .vcut (argv): project load đúng, current path + recent đúng", ok,
    `url=${info.url}; target=${target}; dialog discard-confirm: ${dlgD1.detail}; onOpenFile (probe — bằng chứng phụ, có thể miss event queued): ${after.openFiles.includes(target)}; tên trong ô nhập: ${JSON.stringify(nameInputs)} (kỳ vọng "${expectName}"); currentPath=${cur}; recent[0]=${settings?.recentProjects?.[0] ?? "?"}`);
  // ROUND54-K4 — D1-argv: tách "argv có tới được renderer không" khỏi
  // "tên project có áp dụng không" (tên kẹt "Dự án không tên" là bug
  // loadProject riêng, đợt 53 J3 §4.2). Ground truth cho argv là
  // currentPath + recent (main ghi khi mở file thành công); onOpenFile
  // của probe có thể miss event trước mount (probe đăng ký sau web
  // bridge) nên chỉ là bằng chứng phụ.
  record("D1-argv Double-click .vcut: event argv tới renderer (currentPath + recent đúng)", cur === target,
    `onOpenFile (probe — có thể miss event trước mount): ${after.openFiles.includes(target)}; currentPath=${cur} (kỳ vọng ${target}); recent[0]=${settings?.recentProjects?.[0] ?? "?"}; dialog discard-confirm: ${dlgD1.detail}`);
  note(`D1 settings.json: ${JSON.stringify(settings)}`);
  }

  // D2a — tạo file thứ hai bằng Lưu thành… với dialog nhập tên TRONG
  // APP (ROUND53-J4): click đúng mục → dialog nhập tên mở → xác nhận
  // giữ nguyên tên (null) → dialog lưu native mở, gõ path VCUT2 → file
  // do app tự ghi (JSON hợp lệ, meta = tên project đang mở, có tracks),
  // currentPath đổi sang VCUT2. (Đợt 52: fix try/catch bỏ qua bước đổi
  // tên — dialog lưu mở thẳng; nay có thêm bước nhập tên.)
  {
    await fs.rm(VCUT2, { force: true });
    const excBefore = session.cdp.events.filter((e) => e.method === "__exception__").length;
    const winsBefore = (await session.listWindows()).map((w) => w.id);
    const r = await clickMenuItem(session, 0, 5, "d2-saveas2.png");
    await sleep(1200);
    const renamed = await driveRenameDialog(session, null);
    await sleep(800);
    const newExc = session.cdp.events.filter((e) => e.method === "__exception__").slice(excBefore);
    const promptExc = newExc.find((e) => /prompt/i.test(e.detail ?? ""));
    let dlg = await session.findWindow("Lưu dự án");
    if (!dlg) dlg = await waitAnyDialog(session, winsBefore, 3000);
    let typed = false;
    if (dlg) {
      typed = await gtkTypePath(session, dlg, VCUT2);
      if (!typed) {
        // Run 18: dialog không đóng sau khi gõ path thì Escape để dọn.
        await session.x11.pressEscape(); await sleep(800);
        typed = !(await session.listWindows()).some((w) => w.id === dlg.id);
      }
    }
    await sleep(1000);
    const saved2 = await exists(VCUT2);
    let valid2 = false; let metaName2 = "?";
    if (saved2) {
      try {
        const j = JSON.parse(await fs.readFile(VCUT2, "utf8"));
        const spec = j?.spec ?? j; // envelope { spec } hoặc spec trần
        valid2 = typeof spec?.meta?.name === "string" && Array.isArray(spec.tracks) && spec.tracks.length > 0;
        metaName2 = spec?.meta?.name ?? "?";
      } catch {}
    }
    const cur2 = await session.currentPath();
    const ok = r.ok && renamed.present && renamed.confirmed && newExc.length === 0 && !!dlg && typed && saved2 && valid2 && cur2 === VCUT2;
    record("D2a Tạo file .vcut thứ hai bằng Lưu thành… (sau fix): dialog + file ghi + current path", ok,
      `click: ${r.ok ? "đúng mục" : "THẤT BẠI: " + (r.reason ?? "?")}; dialog nhập tên trong app: ${renamed.present ? `xuất hiện (input điền sẵn ${JSON.stringify(renamed.inputBefore)}, xác nhận: ${renamed.confirmed})` : "KHÔNG xuất hiện"}; exception mới: ${newExc.length}${promptExc ? ` (prompt: ${(promptExc.detail ?? "").slice(0, 160)})` : " (0 exception prompt)"}; dialog lưu: ${dlg ? `"${dlg.title}", gõ path đóng: ${typed}` : "KHÔNG thấy"}; file ${VCUT2}: ${saved2 ? "CÓ" : "không có"}; JSON hợp lệ + meta "${metaName2}" + có tracks: ${valid2}; currentPath=${cur2}`);
    await session.x11.pressEscape(); await sleep(500);
  }

  // D2b — second-instance (KHÔNG phụ thuộc D2a): khởi động instance thứ
  // hai với fixture H9-SecondInstance.vcut trong lúc instance đầu đang
  // chạy — instance 2 phải tự thoát (single-instance) và chuyển file cho
  // instance đầu. Dùng LAUNCH_BIN (binary đã giải nén, khởi động nhanh)
  // thay vì AppImage (giải nén lại tree vcut-server rất chậm).
  // ROUND53-J3: fail-fast nếu fixture FIXTURE2 thiếu/hỏng.
  {
    if (!(await requireFixture(FIXTURE2))) {
      record("D2b Second-instance: instance 2 thoát nhanh, file chuyển cho instance 1 và load đúng", false,
        `FAIL-FAST: fixture thiếu/hỏng: ${FIXTURE2} — không chạy mù (đợt 52 §5.3)`);
    } else {
    const logPath = "/tmp/h9-second-instance.log";
    const logStream = (await import("node:fs")).createWriteStream(logPath);
    const child2 = spawn(LAUNCH_BIN, [`--user-data-dir=${USERDATA}`, "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox", FIXTURE2], {
      cwd: DESK, detached: true,
      // ROUND54-K2: TMPDIR riêng cho instance 2 (xem TMPDIR_RUN) — nó
      // giải nén lạnh (~30–60s) nên chờ tới 120s thay vì 20s.
      env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: "1", DISPLAY, ELECTRON_DISABLE_SANDBOX: "1", TMPDIR: TMPDIR_SECOND },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child2.stdout.pipe(logStream); child2.stderr.pipe(logStream);
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline && child2.exitCode === null) await sleep(250);
    const exitedFast = child2.exitCode !== null;
    // ROUND54-K4: instance 1 nhận file khi project đang dirty → confirm
    // mở; trả lời Ok trước khi poll (như M7 — nếu không dialog treo).
    const dlgD2b = await answerDiscardDialog(session, { accept: true, tag: "D2b" });
    // ROUND53-J3: poll tên project tới 10s thay vì đọc 1 lần sau 2s —
    // cùng lý do như M7 (r53j3c: onOpenFile=true nhưng tên kẹt "Dự án
    // không tên" ở 2s; cần biết là load chậm hay load hỏng).
    let nameInputs2 = [];
    let cur2 = null;
    let after2 = await session.h9();
    let pollError2 = null;
    const pollDeadline = Date.now() + 10000;
    while (Date.now() < pollDeadline) {
      try {
        after2 = await session.h9();
        nameInputs2 = (await session.projectName()).inputs;
        cur2 = await session.currentPath();
      } catch (e) {
        // ROUND54-K4: như M7 — renderer kẹt trong dialog thì ghi lại thay vì crash phase.
        pollError2 = e.message;
        break;
      }
      if (after2.openFiles.includes(FIXTURE2) && nameInputs2.includes("H9 Second") && cur2 === FIXTURE2) break;
      await sleep(500);
    }
    const forwarded = after2.openFiles.includes(FIXTURE2) && nameInputs2.includes("H9 Second") && cur2 === FIXTURE2;
    record("D2b Second-instance: instance 2 thoát nhanh, file chuyển cho instance 1 và load đúng", exitedFast && forwarded,
      `instance 2 exitCode=${child2.exitCode} (thoát trong 120s: ${exitedFast}); dialog discard-confirm: ${dlgD2b.detail}; onOpenFile nhận ${FIXTURE2}: ${after2.openFiles.includes(FIXTURE2)}; tên trong ô nhập: ${JSON.stringify(nameInputs2)} (kỳ vọng "H9 Second"); currentPath=${cur2}${pollError2 ? `; poll lỗi: ${pollError2}` : ""}`);
    if (child2.exitCode === null) { try { process.kill(-child2.pid, "SIGKILL"); } catch {} }
    }
  }

  // D3 — xdg-open: ghi nhận thực tế (không kỳ vọng association vì
  // .desktop chưa cài trên VM này — chỉ kiểm chứng hành vi, không ép).
  {
    const xdg = await run("which", ["xdg-open"], { timeoutMs: 15000 });
    let detail;
    if (xdg.code !== 0) detail = "xdg-open không có trên VM này — không thử được đường xdg-open";
    else {
      const res = await run("xdg-open", [VCUT1], { timeoutMs: 20000 });
      await sleep(2000);
      const after3 = await session.h9();
      detail = `xdg-open exit=${res.code}, stdout=${res.stdout.slice(0, 200) || "(rỗng)"}, stderr=${res.stderr.slice(0, 200) || "(rỗng)"}; app đang chạy có nhận thêm open-file: ${after3.openFiles.filter((p) => p === VCUT1).length} lần`;
    }
    record("D3 xdg-open .vcut: ghi nhận hành vi thực tế (không ép association)", true, detail);
    note("D3: " + detail);
  }

  // D4 — Cửa sổ > Đóng cửa sổ: cửa sổ đóng, app thoát.
  {
    const r = await clickMenuItem(session, 3, 1, "d4-close.png");
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && session.child.exitCode === null) await sleep(250);
    const exited = session.child.exitCode !== null;
    record("D4 Đóng cửa sổ (role close): app thoát", r.ok && exited, `click: ${r.ok}; exitCode=${session.child.exitCode}`);
    if (session.cdp) { session.cdp.close(); session.cdp = null; }
  }
}

// ---------------- Phase D4 — EXIT CODE (ROUND53-J4) ----------------
// Đo lại exitCode=127 đợt 51 khi app SỐNG bình thường: thoát sạch qua
// menu Thoát (D4a) và qua Cửa sổ > Đóng cửa sổ (D4b) — kỳ vọng exit 0;
// double-click .vcut khi app đang chạy (D4c): instance 2 tự thoát nhanh
// (single-instance, kỳ vọng exit 0) và file chuyển cho instance 1.
// Mỗi case launch AppImage mới (launchAppImage dọn instance cũ).
async function phaseD4(session) {
  // Đóng welcome modal nếu xuất hiện (DOM overlay — không chặn menubar
  // native nhưng che màn hình, cứ đóng cho sạch như W0).
  const closeWelcome = async () => {
    try {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
    } catch {}
    await sleep(800);
  };
  const waitExit = async (child, timeoutMs = 20000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline && child.exitCode === null) await sleep(250);
    return child.exitCode;
  };
  // ROUND55-L4: con Chromium (zygote/gpu/renderer) mang flag
  // remote-debugging-port trong cmdline có thể còn sống vài giây sau khi
  // main exit — pgrep 1 lần ngay sau exit sẽ bắt nhầm "mồ côi". Poll tới
  // khi sạch (tối đa 30s, mỗi giây 1 lần) và ghi số giây dọn sạch; chỉ
  // FAIL khi sau 30s vẫn còn tiến trình (mồ côi thật). Trả số giây đã
  // chờ tới khi sạch, hoặc null nếu hết 30s vẫn còn.
  const waitNoLeftover = async (timeoutMs = 30000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const r = await run("pgrep", ["-f", `remote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 });
      if (r.code !== 0) return Math.round((Date.now() - start) / 100) / 10;
      await sleep(1000);
    }
    return null;
  };

  // D4a — Tệp > Thoát: app thoát sạch, exitCode?
  {
    await session.launchAppImage({ label: "d4a" });
    await sleep(3000);
    await closeWelcome();
    const r = await clickMenuItem(session, 0, 7, "d4a-exit.png");
    const code = await waitExit(session.child);
    const clearedInS = await waitNoLeftover();
    record("D4a Thoát qua menu Tệp: app thoát sạch, exitCode=0", r.ok && code === 0 && clearedInS !== null,
      `click Thoát: ${r.ok}; exitCode=${code} (kỳ vọng 0 — đợt 51 đo được 127); pgrep sạch sau: ${clearedInS === null ? "VẪN CÒN sau 30s (mồ côi thật)" : clearedInS + "s"}`);
    if (session.cdp) { session.cdp.close(); session.cdp = null; }
  }
  // D4b — Cửa sổ > Đóng cửa sổ: app thoát sạch, exitCode?
  {
    await session.launchAppImage({ label: "d4b" });
    await sleep(3000);
    await closeWelcome();
    const r = await clickMenuItem(session, 3, 1, "d4b-close.png");
    const code = await waitExit(session.child);
    const clearedInS = await waitNoLeftover();
    record("D4b Đóng cửa sổ: app thoát sạch, exitCode=0", r.ok && code === 0 && clearedInS !== null,
      `click Đóng cửa sổ: ${r.ok}; exitCode=${code} (kỳ vọng 0); pgrep sạch sau: ${clearedInS === null ? "VẪN CÒN sau 30s (mồ côi thật)" : clearedInS + "s"}`);
    if (session.cdp) { session.cdp.close(); session.cdp = null; }
  }
  // D4c — double-click .vcut khi app đang chạy: instance 2 thoát nhanh
  // (single-instance) + file chuyển cho instance 1 và load đúng; rồi
  // thoát instance 1 sạch qua menu Thoát và ghi exitCode của nó.
  {
    if (!(await requireFixture(FIXTURE1)) || !(await requireFixture(FIXTURE2))) {
      record("D4c Double-click .vcut khi app sống: instance 2 thoát nhanh + file chuyển đúng", false,
        `FAIL-FAST: fixture thiếu/hỏng — không chạy mù (đợt 52 §5.3)`);
    } else {
      await session.launchAppImage({ label: "d4c" });
      await sleep(3000);
      await closeWelcome();
      const logPath = "/tmp/h9-d4c-second-instance.log";
      const logStream = (await import("node:fs")).createWriteStream(logPath);
      const child2 = spawn(LAUNCH_BIN, [`--user-data-dir=${USERDATA}`, "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox", FIXTURE2], {
        cwd: DESK, detached: true,
        // ROUND54-K2: TMPDIR riêng cho instance 2 (xem TMPDIR_RUN) — nó
        // giải nén lạnh (~30–60s) nên chờ tới 120s thay vì 20s.
        env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: "1", DISPLAY, ELECTRON_DISABLE_SANDBOX: "1", TMPDIR: TMPDIR_SECOND },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child2.stdout.pipe(logStream); child2.stderr.pipe(logStream);
      const code2 = await waitExit(child2, 120000);
      const exitedFast = code2 !== null;
      await sleep(2000);
      // ROUND54-K2: instance 1 nhận file khi project đang dirty → confirm
      // mở; trả lời Ok trước khi đọc (như D2b — nếu không renderer kẹt,
      // CDP evaluate timeout 20s rồi crash phase). Helper của K4.
      const dlgD4c = await answerDiscardDialog(session, { accept: true, tag: "D4c" });
      let after2 = { openFiles: [] };
      let nameInputs2 = [];
      let cur2 = null;
      let readError2 = null;
      try {
        after2 = await session.h9();
        nameInputs2 = (await session.projectName()).inputs;
        cur2 = await session.currentPath();
      } catch (e) {
        readError2 = e.message;
      }
      const forwarded = after2.openFiles.includes(FIXTURE2) && nameInputs2.includes("H9 Second") && cur2 === FIXTURE2;
      // Thoát instance 1 sạch qua menu Thoát, ghi exitCode của nó.
      const r = await clickMenuItem(session, 0, 7, "d4c-exit.png");
      const code1 = await waitExit(session.child);
      if (session.cdp) { session.cdp.close(); session.cdp = null; }
      record("D4c Double-click .vcut khi app sống: instance 2 thoát nhanh + file chuyển đúng + instance 1 thoát sạch", exitedFast && code2 === 0 && forwarded && r.ok && code1 === 0,
        `instance 2 exitCode=${code2} (thoát trong 120s: ${exitedFast}, kỳ vọng 0); dialog discard-confirm: ${dlgD4c.detail}; onOpenFile nhận ${FIXTURE2}: ${after2.openFiles.includes(FIXTURE2)}; tên trong ô nhập: ${JSON.stringify(nameInputs2)} (kỳ vọng "H9 Second"); currentPath=${cur2}${readError2 ? `; LỖI ĐỌC sau forward: ${readError2}` : ""}; instance 1 Thoát: click ${r.ok}, exitCode=${code1} (kỳ vọng 0)`);
      if (child2.exitCode === null) { try { process.kill(-child2.pid, "SIGKILL"); } catch {} }
    }
  }
  // D4d — Mở .vcut qua argv (KHÔNG second-instance) rồi Thoát: tách
  // biệt "đã load project" khỏi "đã nhận forward second-instance".
  // Kỳ vọng: exitCode=0. Tên sau load được GHI NHẬN (kỳ vọng
  // "H9 Doubleclick" sau fix K1 đợt 54; không tính vào verdict của
  // case đo exit code này).
  {
    if (!(await requireFixture(FIXTURE1))) {
      record("D4d Mở .vcut qua argv rồi Thoát: exitCode=0", false,
        `FAIL-FAST: fixture thiếu/hỏng — không chạy mù (đợt 52 §5.3)`);
    } else {
      const info = await session.launchAppImage({ argvFiles: [FIXTURE1], label: "d4d" });
      await sleep(3000);
      await closeWelcome();
      // ROUND54-K4: như D1 — trả lời confirm nếu có trước khi poll currentPath.
      const dlgD4d = await answerDiscardDialog(session, { accept: true, tag: "D4d" });
      const d = Date.now() + 20000;
      let cur = null;
      while (Date.now() < d) { try { cur = await session.currentPath(); if (cur === FIXTURE1) break; } catch {} await sleep(1000); }
      const nameInputs = (await session.projectName()).inputs;
      const r = await clickMenuItem(session, 0, 7, "d4d-exit.png");
      const code = await waitExit(session.child);
      if (session.cdp) { session.cdp.close(); session.cdp = null; }
      record("D4d Mở .vcut qua argv rồi Thoát: exitCode=0", r.ok && cur === FIXTURE1 && code === 0,
        `url=${info.url}; currentPath=${cur} (kỳ vọng ${FIXTURE1}); dialog discard-confirm: ${dlgD4d.detail}; tên trong ô nhập: ${JSON.stringify(nameInputs)} (ghi nhận — tên kỳ vọng "H9 Doubleclick" sau fix K1 đợt 54); Thoát: click ${r.ok}, exitCode=${code} (kỳ vọng 0)`);
    }
  }
  // D4e — App sống 30s (sample load + bridge chạy, KHÔNG mở file ngoài,
  // KHÔNG second-instance) rồi Thoát: tách biệt "sống lâu + bridge chạy"
  // khỏi "đã load file / đã nhận forward".
  {
    await session.launchAppImage({ label: "d4e" });
    await sleep(3000);
    await closeWelcome();
    await sleep(30000); // chờ sample load + bridge lên hẳn
    const alive = session.child.exitCode === null;
    const r = await clickMenuItem(session, 0, 7, "d4e-exit.png");
    const code = await waitExit(session.child);
    const clearedInS = await waitNoLeftover();
    if (session.cdp) { session.cdp.close(); session.cdp = null; }
    record("D4e App sống 30s rồi Thoát: exitCode=0", alive && r.ok && code === 0 && clearedInS !== null,
      `app còn sống trước Thoát: ${alive}; click Thoát: ${r.ok}; exitCode=${code} (kỳ vọng 0); pgrep sạch sau: ${clearedInS === null ? "VẪN CÒN sau 30s (mồ côi thật)" : clearedInS + "s"}`);
  }
}

// ---------------- Phase DIALOGPROBE (ROUND54-K4, chỉ chạy với --only dialogprobe) ----------------
// Đo bản chất dialog discard-confirm `window.confirm`:
// (1) CDP có nhận Page.javascriptDialogOpening không (auto-handler có thấy?);
// (2) renderer có bị chặn khi dialog mở không (Runtime.evaluate có trả lời?);
// (3) dialog là cửa sổ X11 nào (title, geometry, hàng nút);
// (4) cơ chế nào trả lời được nó: CDP handleJavaScriptDialog / click nút X11 / Escape —
//     và kết quả confirm trả về (true=Ok, false=Cancel) cho từng cơ chế.
// Probe gọi window.confirm TRỰC TIẾP (không qua openProjectFromPath) nên
// không phụ thuộc project dirty — nhưng vẫn làm project dirty trước để
// trung thực với flow thật (dialog chỉ mở khi dirty).
async function phaseDialogProbe(session) {
  const closeWelcome = async () => {
    try {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
    } catch {}
    await sleep(800);
  };
  const info = await session.launchAppImage({ label: "dlgprobe" });
  await sleep(3000);
  await closeWelcome();

  // P0 — làm project dirty bằng cách đổi tên (native setter + input event,
  // như driveRenameDialog): ô input đầu tiên là tên project.
  let dirty = false;
  {
    const before = (await session.projectName()).inputs;
    const curName = before[0] ?? "";
    let renamed = false;
    if (curName) {
      renamed = await session.cdp.evaluate(`(() => {
        const el = [...document.querySelectorAll("input")].find((i) => i.value === ${JSON.stringify(curName)});
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(el, "H9 Probe Dirty");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      })()`).catch(() => false);
    }
    await sleep(1000);
    const afterName = (await session.projectName()).inputs;
    const text = await session.bodyText().catch(() => "");
    dirty = renamed && afterName.includes("H9 Probe Dirty") && /Chưa lưu/.test(text);
    record("P0 probe setup: project dirty (đổi tên, badge Chưa lưu)", dirty,
      `tên trước: ${JSON.stringify(curName)}; đổi tên: ${renamed}; tên sau: ${JSON.stringify(afterName)}; badge "Chưa lưu": ${/Chưa lưu/.test(text)}${dirty ? "" : " — probe vẫn chạy (confirm gọi trực tiếp, không cần dirty)"}`);
  }

  // Tắt auto-accept CDP để quan sát dialog thô (bật lại ở cuối phase).
  session.cdp.autoAcceptDialogs = false;
  // Message probe = đúng message discard thật (để dialog rộng ~410 như
  // thật — message ngắn chỉ rộng ~160 và lọt khỏi bộ lọc cửa sổ) + tag
  // bước trong ngoặc để phân biệt các dialog trong log CDP.
  const DISCARD_PROBE_MSG = (tag) => `Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục? [${tag}]`;
  try {
    // P1 — mở confirm, QUAN SÁT (không trả lời vội): CDP event? renderer?
    // cửa sổ X11 nào? Rồi trả lời bằng answerDiscardDialog (đường production).
    let p1 = null;
    {
      const winsBefore = (await session.listWindows()).map((w) => w.id);
      const dlgBefore = session.cdp.dialogs.length;
      let result = "(chưa trả về)";
      session.cdp.evaluate(`window.confirm(${JSON.stringify(DISCARD_PROBE_MSG("P1"))})`)
        .then((v) => { result = v; return v; })
        .catch(() => null);
      await sleep(2000);
      const cdpSeen = session.cdp.dialogs.slice(dlgBefore);
      const responsive = await rendererResponsive(session);
      const found = await findDiscardDialogWindow(session);
      const newWins = (await session.listWindows()).filter((w) => !winsBefore.includes(w.id));
      await session.shotRoot(path.join(SHOTS, "dlgprobe-root.png")).catch(() => {});
      const win = found.win;
      const btnCols = win ? await dialogButtonCount(session, win, "dlgprobe-dialog.png") : null;
      const answered = await answerDiscardDialog(session, { accept: true, tag: "probe-P1" });
      await sleep(800);
      p1 = { cdpSeen: cdpSeen.length, responsive, win, btnCols };
      record("P1 dialog confirm mở: CDP event? renderer còn trả lời? cửa sổ X11? (rồi trả lời bằng answerDiscardDialog)", true,
        `CDP Page.javascriptDialogOpening mới: ${cdpSeen.length} ${cdpSeen.length ? JSON.stringify(cdpSeen) : "(KHÔNG có — dialog native không qua CDP)"}; renderer trả lời evaluate (1+1) trong 3s khi dialog mở: ${responsive}; cửa sổ mới: ${newWins.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ") || "(không có)"}; ứng viên dialog 2-nút: ${win ? `"${win.title || "(không tên)"}" ${win.geo.width}x${win.geo.height}@${win.geo.x},${win.geo.y}, ${btnCols ?? "?"} nút` : "(không tìm thấy)"}; confirm trả về: ${JSON.stringify(result)}; answerDiscardDialog: ${answered.detail}`);
    }

    // Mở 1 confirm mới rồi trả lời bằng đúng 1 cơ chế — đo riêng từng cơ chế.
    async function probeOne(tag, { accept, via }) {
      // Dialog kẹt từ bước trước sẽ chặn confirm mới (renderer bị block) —
      // dọn trước rồi mới mở dialog cho bước này.
      if (!(await rendererResponsive(session))) {
        const c = await answerDiscardDialog(session, { accept: true, tag: `probe-${tag}-pre` });
        note(`probe-${tag}: renderer kẹt trước bước — dọn trước: ${c.detail}`);
        await sleep(800);
      }
      const dlgBefore = session.cdp.dialogs.length;
      let result = "(chưa trả về)"; let error = null;
      session.cdp.evaluate(`window.confirm(${JSON.stringify(DISCARD_PROBE_MSG(tag))})`)
        .then((v) => { result = v; return v; })
        .catch((e) => { error = e.message; return null; });
      await sleep(1500);
      const cdpSeen = session.cdp.dialogs.slice(dlgBefore);
      const found = await findDiscardDialogWindow(session);
      const win = found.win;
      const opened = !!win || cdpSeen.length > 0;
      let applied = "";
      if (via === "cdp") {
        const r = await session.cdp.send("Page.handleJavaScriptDialog", { accept }).catch((e) => ({ error: e.message }));
        applied = r.error ? `CDP handle lỗi: ${r.error}` : `CDP handleJavaScriptDialog({accept:${accept}}) đã gọi`;
      } else if (via === "x11") {
        if (!win) applied = "X11: không thấy cửa sổ dialog để click";
        else {
          const btn = await clickDialogButton(session, win, accept ? 1 : 0, `dlgprobe-${tag}.png`).catch(() => ({ ok: false }));
          applied = `X11 click nút ${accept ? "Ok" : "Cancel"} (thấy ${btn.cols ?? "?"} nút, click: ${btn.ok})`;
        }
      } else if (via === "escape") {
        if (!win) applied = "Escape: không thấy cửa sổ dialog";
        else {
          await session.x11.activateWindow(win.id);
          await session.x11.pressEscape();
          applied = "Escape sau khi focus dialog";
        }
      }
      await sleep(1200);
      // Cửa sổ có thể còn liệt kê một lúc sau khi đã đóng (xem windowGone).
      const stillOpen = win ? !(await windowGone(session, win)) : false;
      const dismissed = opened && !stillOpen && result === accept;
      let cleanup = "";
      if (!dismissed) {
        // Dọn dialog kẹt để bước sau còn chạy (không để nó treo như đợt 53).
        const c = await answerDiscardDialog(session, { accept: true, tag: `probe-${tag}-cleanup` });
        cleanup = `; dọn sau bước: ${c.detail}`;
        await sleep(800);
      }
      return {
        applied, cdpSeen: cdpSeen.length, cleanup, dismissed, result, stillOpen,
        detail: `mở dialog: ${opened ? `CÓ (${win ? `"${win.title || "(không tên)"}" ${win.geo.width}x${win.geo.height}@${win.geo.x},${win.geo.y}` : "chỉ CDP thấy"})` : "KHÔNG thấy dialog"}; CDP event mới: ${cdpSeen.length}; ${applied}; dialog còn mở: ${stillOpen}; confirm trả về: ${JSON.stringify(result)} (kỳ vọng ${accept})${error ? `; lỗi evaluate: ${error}` : ""}${cleanup}`,
      };
    }

    // P2 — CDP handle có/không promptText: auto-handler gửi kèm promptText
    // cho mọi loại dialog; nghi ngờ promptText làm handle confirm lỗi
    // (đợt 53: event tới nhưng dialog vẫn treo). Thử cả hai trên cùng 1 dialog.
    let p2 = null;
    {
      if (!(await rendererResponsive(session))) {
        const c = await answerDiscardDialog(session, { accept: true, tag: "probe-P2-pre" });
        note(`probe-P2: renderer kẹt trước bước — dọn trước: ${c.detail}`);
        await sleep(800);
      }
      const dlgBefore = session.cdp.dialogs.length;
      let result = "(chưa trả về)"; let error = null;
      session.cdp.evaluate(`window.confirm(${JSON.stringify(DISCARD_PROBE_MSG("P2"))})`)
        .then((v) => { result = v; return v; })
        .catch((e) => { error = e.message; return null; });
      await sleep(1500);
      const cdpSeen = session.cdp.dialogs.slice(dlgBefore);
      const found = await findDiscardDialogWindow(session);
      const win = found.win;
      const opened = !!win || cdpSeen.length > 0;
      // Thử 1: handle KÈM promptText (y hệt auto-handler hiện tại).
      const r1 = await session.cdp.send("Page.handleJavaScriptDialog", { accept: true, promptText: "H9 Doubleclick" }).catch((e) => ({ error: e.message }));
      await sleep(1200);
      let stillOpen = win ? !(await windowGone(session, win)) : false;
      // window.confirm modal chặn renderer — renderer trả lời lại là bằng
      // chứng dialog đã đóng, kể cả khi cửa sổ X còn liệt kê (xác cũ, xem
      // probe r54k4 P2: confirm trả về nhưng id còn trong cây X >3s).
      const resp1 = await rendererResponsive(session);
      const withPrompt = opened && result === true && (!stillOpen || resp1);
      let applied = `handle KÈM promptText: ${r1.error ? "lỗi: " + r1.error : "đã gọi (không lỗi trả về)"} → dialog còn mở: ${stillOpen}, renderer trả lời: ${resp1}, confirm trả về: ${JSON.stringify(result)} (kỳ vọng true)`;
      // Thử 2 (chỉ khi thử 1 không đóng được): handle KHÔNG promptText.
      let withoutPrompt = null;
      if (!withPrompt && opened) {
        const r2 = await session.cdp.send("Page.handleJavaScriptDialog", { accept: true }).catch((e) => ({ error: e.message }));
        await sleep(1200);
        stillOpen = win ? !(await windowGone(session, win)) : false;
        const resp2 = await rendererResponsive(session);
        withoutPrompt = result === true && (!stillOpen || resp2);
        applied += `; handle KHÔNG promptText: ${r2.error ? "lỗi: " + r2.error : "đã gọi (không lỗi trả về)"} → dialog còn mở: ${stillOpen}, renderer trả lời: ${resp2}, confirm trả về: ${JSON.stringify(result)}`;
      }
      const dismissed = withPrompt || withoutPrompt === true;
      let cleanup = "";
      if (!dismissed && opened) {
        const c = await answerDiscardDialog(session, { accept: true, tag: "probe-P2-cleanup" });
        cleanup = `; dọn sau bước: ${c.detail}`;
        await sleep(800);
      }
      p2 = { dismissed, withPrompt, withoutPrompt,
        detail: `mở dialog: ${opened ? `CÓ (${win ? `"${win.title || "(không tên)"}" ${win.geo.width}x${win.geo.height}@${win.geo.x},${win.geo.y}` : "chỉ CDP thấy"})` : "KHÔNG thấy dialog"}; CDP event mới: ${cdpSeen.length}; ${applied}${error ? `; lỗi evaluate: ${error}` : ""}${cleanup}` };
      record("P2 CDP handleJavaScriptDialog: promptText có làm handle confirm lỗi không", dismissed, p2.detail);
    }
    // P3 — X11 click nút Ok (accept). Kiểm chứng thứ tự nút [Ok][Cancel]:
    // fromRight=1 phải cho kết quả true thì mapping mới đúng.
    const p3 = await probeOne("P3", { accept: true, via: "x11" });
    record("P3 trả lời confirm bằng X11 click nút Ok (fromRight=1)", p3.dismissed, p3.detail);
    // P4 — Escape (kỳ vọng = Cancel → confirm trả false).
    const p4 = await probeOne("P4", { accept: false, via: "escape" });
    record("P4 trả lời confirm bằng Escape (kỳ vọng Cancel → false)", p4.dismissed, p4.detail);
    // P5 — X11 click nút Cancel (dismiss path).
    const p5 = await probeOne("P5", { accept: false, via: "x11" });
    record("P5 trả lời confirm bằng X11 click nút Cancel (fromRight=0)", p5.dismissed, p5.detail);

    // P6 — tổng kết: cơ chế nào trả lời được dialog native.
    const working = [];
    if (p2.dismissed) working.push("CDP handleJavaScriptDialog");
    if (p3.dismissed) working.push("X11 click Ok");
    if (p4.dismissed) working.push("Escape (=Cancel)");
    if (p5.dismissed) working.push("X11 click Cancel");
    record("P6 tổng kết: cơ chế trả lời được dialog confirm native", working.length > 0,
      `CDP event khi dialog mở: ${p1.cdpSeen} (0 = dialog native không qua CDP); renderer trả lời evaluate khi dialog mở: ${p1.responsive}; dialog: ${p1.win ? `"${p1.win.title || "(không tên)"}" ${p1.win.geo.width}x${p1.win.geo.height}@${p1.win.geo.x},${p1.win.geo.y}, ${p1.btnCols ?? "?"} nút` : "(không tìm thấy)"}; cơ chế trả lời ĐƯỢC: ${working.join(", ") || "(không có — dialog kẹt)"}; CDP handle KÈM promptText: ${p2.withPrompt ? "ĐƯỢC (promptText không phải thủ phạm)" : "KHÔNG đóng được"}; CDP handle KHÔNG promptText: ${p2.withoutPrompt === true ? "ĐƯỢC (promptText LÀ thủ phạm — auto-handler cần sửa)" : p2.withoutPrompt === false ? "KHÔNG" : "(không cần thử — kèm promptText đã được)"}; X11 click Ok: ${p3.dismissed ? "ĐƯỢC" : "KHÔNG"}; Escape: ${p4.dismissed ? "ĐƯỢC (=Cancel)" : "KHÔNG"}; X11 click Cancel: ${p5.dismissed ? "ĐƯỢC" : "KHÔNG"}`);
  } finally {
    session.cdp.autoAcceptDialogs = true;
  }
}

// ---------------- Phase ZOMBIEPROBE (ROUND55-L7, chỉ chạy với --only zombieprobe) ----------------
// Điều tra M8 (đợt 54 K4 §3.2): sau khi CDP handleJavaScriptDialog trả lời
// window.confirm, cửa sổ dialog native (~403x83@0,0) vẫn còn liệt kê +
// Viewable trên X — "zombie window" che menu bar, menuBarBands chỉ thấy
// 1 dải thay vì 5 nên guard openTopMenu từ chối click mù → M8 fail.
// Probe này tái hiện đúng đường M7 thật (auto-accept CDP BẬT, message
// discard thật) rồi đo, theo thứ tự:
//   Z1 mở confirm + để CDP auto-accept trả lời (không click X11);
//   Z2 dump NGAY lúc renderer trả lời lại: CDP targets (/json/list —
//     zombie có target CDP không?), toàn bộ cửa sổ X11, thuộc tính của
//     zombie (mapState, override-redirect, _NET_WM_WINDOW_TYPE,
//     WM_TRANSIENT_FOR), ảnh root + ảnh cửa sổ chính, menuBarBands;
//   Z3 vòng đời zombie: poll 15s — nó có tự biến mất không, sau bao lâu,
//     bands có tự hồi 5 không (quyết định fix = chờ/retry hay dọn tay);
//   Z4 dọn bằng UnmapWindow: bands có hồi không;
//   Z5 confirm mới + dọn bằng DestroyWindow: bands? app còn khỏe không?
//     rồi chạy luôn flow M8 (Tệp > Xuất video…) để chứng minh đầu-cuối;
//   Z6 cơ chế Toàn màn hình (M18): geometry + _NET_WM_STATE sau click;
//   Z7 cơ chế Thu nhỏ (M21): map-state sau click (bằng chứng giới hạn
//     Xvfb không WM).
// Chạy trên AppImage release hiện tại, display/CDP/userdata/TMPDIR riêng
// (xem lệnh chạy trong LIMITS đợt 55 L7).
async function wmStateNames(session, winId) {
  try {
    const stateAtom = await session.x11.internAtom("_NET_WM_STATE");
    const p = await session.x11.getProperty(winId, stateAtom, 4 /* ATOM */, 32);
    const known = ["_NET_WM_STATE_FULLSCREEN", "_NET_WM_STATE_HIDDEN", "_NET_WM_STATE_MAXIMIZED_VERT", "_NET_WM_STATE_MAXIMIZED_HORZ", "_NET_WM_STATE_MINIMIZED", "_NET_WM_STATE_ABOVE", "_NET_WM_STATE_BELOW"];
    const names = [];
    for (let i = 0; i < p.valueLen; i++) {
      const a = p.value.readUInt32LE(i * 4);
      let nm = `atom ${a}`;
      for (const c of known) if ((await session.x11.internAtom(c)) === a) { nm = c; break; }
      names.push(nm);
    }
    return names;
  } catch (e) { return [`(lỗi: ${e.message})`]; }
}
async function windowTypeName(session, winId) {
  try {
    const typeAtom = await session.x11.internAtom("_NET_WM_WINDOW_TYPE");
    const t = await session.x11.getProperty(winId, typeAtom, 4 /* ATOM */, 8);
    if (t.valueLen === 0) return "(không có _NET_WM_WINDOW_TYPE)";
    const a = t.value.readUInt32LE(0);
    const candidates = ["_NET_WM_WINDOW_TYPE_DIALOG", "_NET_WM_WINDOW_TYPE_NORMAL", "_NET_WM_WINDOW_TYPE_UTILITY", "_NET_WM_WINDOW_TYPE_MENU", "_NET_WM_WINDOW_TYPE_POPUP_MENU", "_NET_WM_WINDOW_TYPE_TOOLTIP", "_NET_WM_WINDOW_TYPE_SPLASH", "_NET_WM_WINDOW_TYPE_NOTIFICATION", "_NET_WM_WINDOW_TYPE_TOOLBAR", "_NET_WM_WINDOW_TYPE_DROPDOWN_MENU"];
    for (const c of candidates) if ((await session.x11.internAtom(c)) === a) return c;
    return `atom số ${a} (không khớp loại đã biết)`;
  } catch (e) { return `(lỗi: ${e.message})`; }
}
async function phaseZombieProbe(session) {
  const ZMSG = (tag) => `Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục? [${tag}]`;
  const closeWelcome = async () => {
    try {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
    } catch {}
    await sleep(800);
  };
  const info = await session.launchAppImage({ label: "zombie" });
  await sleep(3000);
  await closeWelcome();
  // Chờ project mẫu load (như M0) để app ở trạng thái ổn định trước khi đo.
  let sampleLoaded = false;
  {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const t = await session.bodyText().catch(() => "");
      if (t.includes("mau-1")) { sampleLoaded = true; break; }
      await sleep(2000);
    }
  }
  record("Z0 probe setup: app launch + sample load + welcome modal đóng", sampleLoaded,
    `launch: ${info.url} textLen=${info.textLen}; sampleLoaded=${sampleLoaded}`);

  // Z0b — baseline menubar: phải đủ 5 dải trước khi mở dialog.
  let baseBands = -1;
  {
    const { bands } = await menuBarBands(session, "z-menubar-base.png");
    baseBands = bands.length;
    const wins = await session.listWindows();
    record("Z0b baseline: menu bar đủ 5 dải trước khi mở confirm", baseBands === 5,
      `bands=${baseBands}, centers x=${bands.map((b) => Math.round(b.center)).join(",")}; cửa sổ: ${wins.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ")}`);
  }

  // Làm project dirty (đổi tên như P0) cho trung thực với flow M7 thật.
  {
    const before = (await session.projectName()).inputs;
    const curName = before[0] ?? "";
    let renamed = false;
    if (curName) {
      renamed = await session.cdp.evaluate(`(() => {
        const el = [...document.querySelectorAll("input")].find((i) => i.value === ${JSON.stringify(curName)});
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(el, "H9 Zombie Dirty");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      })()`).catch(() => false);
    }
    await sleep(1000);
    const afterName = (await session.projectName()).inputs;
    note(`Z-dirty: đổi tên ${JSON.stringify(curName)} → ${JSON.stringify(afterName)} (renamed=${renamed})`);
  }

  // Hàm mở 1 confirm (fire-and-forget, không await — renderer bị chặn)
  // rồi chờ tới khi renderer trả lời lại (confirm đã được CDP auto-accept).
  async function openConfirmAndWaitAnswered(tag, timeoutMs = 15000) {
    const dlgBefore = session.cdp.dialogs.length;
    let result = "(chưa trả về)";
    session.cdp.evaluate(`window.confirm(${JSON.stringify(ZMSG(tag))})`)
      .then((v) => { result = v; return v; })
      .catch(() => null);
    const t0 = Date.now();
    let sawDialog = false; let sawWindow = null;
    while (Date.now() - t0 < timeoutMs) {
      if (session.cdp.dialogs.length > dlgBefore) sawDialog = true;
      const f = await findDiscardDialogWindow(session).catch(() => ({ win: null }));
      if (f.win) sawWindow = f.win;
      if (sawDialog && await rendererResponsive(session)) break;
      await sleep(400);
    }
    const responsive = await rendererResponsive(session);
    return { cdpNew: session.cdp.dialogs.length - dlgBefore, result, responsive, sawDialog, sawWindow, waitedMs: Date.now() - t0 };
  }
  // Dump đầy đủ trạng thái lúc zombie đang hiện: CDP targets + X11 + attrs + shots + bands.
  async function dumpZombieState(tag) {
    const targets = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 3000);
    const targetList = Array.isArray(targets.json)
      ? targets.json.map((t) => `${t.type}:${(t.title ?? "").slice(0, 30)}:${(t.url ?? "").slice(0, 60)}`).join(" | ")
      : `(không đọc được /json/list: ${targets.error ?? targets.status})`;
    const wins = await session.listWindows();
    const f = await findDiscardDialogWindow(session).catch(() => ({ win: null }));
    const z = f.win;
    let attrs = "(không thấy zombie)";
    if (z) {
      const at = await session.x11.getWindowAttributes(z.id).catch(() => null);
      const type = await windowTypeName(session, z.id);
      let transient = "?";
      try {
        const trAtom = await session.x11.internAtom("WM_TRANSIENT_FOR");
        const tr = await session.x11.getProperty(z.id, trAtom, 33 /* WINDOW */, 1);
        if (tr.valueLen > 0) transient = `0x${tr.value.readUInt32LE(0).toString(16)}`;
      } catch {}
      const main = await session.mainWindow().catch(() => null);
      attrs = `zombie id=0x${z.id.toString(16)} "${z.title || "(không tên)"}" ${z.geo.width}x${z.geo.height}@${z.geo.x},${z.geo.y}; mapState=${at ? at.mapState : "?"} (2=Viewable); overrideRedirect=${at ? at.overrideRedirect : "?"}; class=${at ? at.class : "?"}; type=${type}; transient-for=${transient} (main=0x${main ? main.id.toString(16) : "?"})`;
    }
    await session.shotRoot(path.join(SHOTS, `${tag}-root.png`)).catch(() => {});
    const main = await session.mainWindow().catch(() => null);
    if (main) await session.shotWindow(main, path.join(SHOTS, `${tag}-main.png`)).catch(() => {});
    const { bands } = await menuBarBands(session, `${tag}-menubar.png`);
    return { bands: bands.length, centers: bands.map((b) => Math.round(b.center)).join(","), targetList, wins: wins.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | "), attrs, zombie: z };
  }

  // Z1 — mở confirm, để CDP auto-accept (đường M7 thật) trả lời.
  const z1 = await openConfirmAndWaitAnswered("Z1");
  record("Z1 confirm mở + CDP auto-accept trả lời (renderer trả lời lại)", z1.sawDialog && z1.responsive,
    `CDP event mới: ${z1.cdpNew}; cửa sổ dialog thấy lúc mở: ${z1.sawWindow ? `"${z1.sawWindow.title || "(không tên)"}" ${z1.sawWindow.geo.width}x${z1.sawWindow.geo.height}@${z1.sawWindow.geo.x},${z1.sawWindow.geo.y}` : "(không thấy)"}; renderer trả lời lại: ${z1.responsive}; confirm trả về: ${JSON.stringify(z1.result)}; chờ ${z1.waitedMs}ms`);

  // Z2 — dump trạng thái NGAY sau khi confirm được trả lời (M8 tái hiện?).
  let zombieId = null;
  {
    const d = await dumpZombieState("z2-zombie");
    zombieId = d.zombie ? d.zombie.id : null;
    const reproduced = !!d.zombie && d.bands !== 5;
    record("Z2 zombie sau CDP handle: cửa sổ dialog còn đó + menu bar mất dải (M8 tái hiện)", reproduced,
      `CDP targets lúc fail: ${d.targetList}; zombie: ${d.attrs}; menuBarBands=${d.bands} (kỳ vọng 5, centers ${d.centers}); cửa sổ: ${d.wins}`);
    note(`Z2: zombie id=0x${zombieId ? zombieId.toString(16) : "?"} — ${d.attrs}`);
  }

  // Z3 — vòng đời zombie: poll 15s, nó có tự biến mất không? bands tự hồi không?
  let clearedAtMs = null; let bandsRecoveredAtMs = null;
  {
    const t0 = Date.now();
    let lastBands = -1;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const wins = await session.listWindows().catch(() => []);
      const stillThere = zombieId !== null && wins.some((w) => w.id === zombieId);
      if (!stillThere && clearedAtMs === null) clearedAtMs = Date.now() - t0;
      if (i % 4 === 3) {
        const { bands } = await menuBarBands(session, "z3-menubar.png").catch(() => ({ bands: [] }));
        lastBands = bands.length;
        if (bands.length === 5 && bandsRecoveredAtMs === null) bandsRecoveredAtMs = Date.now() - t0;
      }
      if (clearedAtMs !== null && bandsRecoveredAtMs !== null) break;
    }
    const gone = clearedAtMs !== null;
    record("Z3 vòng đời zombie 15s: có tự biến mất không, bands có tự hồi 5 không", true,
      `zombie tự biến mất: ${gone ? `CÓ sau ${clearedAtMs}ms` : "KHÔNG (còn nguyên sau 15s)"}; bands hồi 5: ${bandsRecoveredAtMs !== null ? `CÓ sau ${bandsRecoveredAtMs}ms` : `KHÔNG (bands cuối=${lastBands})`}`);
    if (gone) zombieId = null;
  }

  // Z4 — dọn bằng UnmapWindow (nếu zombie còn): bands có hồi không?
  {
    if (zombieId === null) {
      record("Z4 dọn zombie bằng UnmapWindow", true, "zombie đã tự biến mất ở Z3 — không còn gì để unmap (xem Z3)");
    } else {
      const before = (await menuBarBands(session, "z4-before.png").catch(() => ({ bands: [] }))).bands.length;
      session.x11.unmapWindow(zombieId);
      await sleep(600);
      const at = await session.x11.getWindowAttributes(zombieId).catch(() => null);
      const { bands } = await menuBarBands(session, "z4-after.png").catch(() => ({ bands: [] }));
      const responsive = await rendererResponsive(session);
      record("Z4 dọn zombie bằng UnmapWindow: menu bar hồi 5 dải", bands.length === 5,
        `bands trước unmap=${before} → sau=${bands.length}; mapState sau unmap=${at ? at.mapState : "?"} (0=Unmapped); renderer vẫn trả lời: ${responsive}; zombie id còn trong tree: ${(await session.listWindows()).some((w) => w.id === zombieId)} (unmap chỉ ẩn, không hủy)`);
      // Dọn hẳn zombie đã unmap để Z5 đo trên zombie mới sạch (tránh
      // findDiscardDialogWindow vớ lại xác cũ).
      session.x11.destroyWindow(zombieId);
      await sleep(600);
      const gone = !(await session.listWindows()).some((w) => w.id === zombieId);
      note(`Z4 dọn hẳn zombie cũ bằng DestroyWindow sau khi đo unmap: ${gone ? "đã biến mất khỏi tree" : "VẪN CÒN trong tree"}`);
      zombieId = null;
    }
  }

  // Z5 — confirm MỚI + dọn bằng DestroyWindow: bands? app khỏe không? rồi chạy flow M8.
  {
    const z5 = await openConfirmAndWaitAnswered("Z5");
    const d = await dumpZombieState("z5-zombie");
    const z5id = d.zombie ? d.zombie.id : null;
    let destroyOk = false; let bandsAfter = -1; let m8ok = false; let m8detail = "";
    if (z5id) {
      session.x11.destroyWindow(z5id);
      await sleep(600);
      destroyOk = !(await session.listWindows()).some((w) => w.id === z5id);
      const b = await menuBarBands(session, "z5-after-destroy.png").catch(() => ({ bands: [] }));
      bandsAfter = b.bands.length;
    }
    const responsive = await rendererResponsive(session);
    const textLen = (await session.bodyText().catch(() => "")).length;
    if (bandsAfter === 5) {
      const before = await session.h9();
      const textBefore = await session.bodyText();
      const r = await clickMenuItem(session, 0, 6, "z5-m8-export.png");
      await sleep(1200);
      const after = await session.h9();
      const text = await session.bodyText();
      const actionSeen = after.actions.includes("export-video");
      const panelOpen = /Xuất video/i.test(text) && Math.abs(text.length - textBefore.length) > 100;
      m8ok = r.ok && actionSeen && panelOpen;
      m8detail = `click menu: ${r.ok ? "đúng mục" : "THẤT BẠI: " + (r.reason ?? "?")}; action export-video: ${actionSeen}; panel mở: ${panelOpen} (textLen ${textBefore.length} → ${text.length})`;
      await session.x11.pressEscape(); await sleep(500);
    } else {
      m8detail = `không chạy flow M8 vì bands sau destroy=${bandsAfter} (kỳ vọng 5)`;
    }
    record("Z5 dọn zombie mới bằng DestroyWindow + chạy flow M8 (Xuất video…)", z5id !== null && destroyOk && bandsAfter === 5 && responsive && m8ok,
      `confirm Z5: CDP mới=${z5.cdpNew}, renderer trả lời: ${z5.responsive}; zombie mới: ${d.attrs}; destroy: ${destroyOk ? "cửa sổ biến mất khỏi tree" : "KHÔNG biến mất"}; bands sau destroy=${bandsAfter}; app khỏe: renderer=${responsive}, bodyText=${textLen} ký tự; M8: ${m8detail}`);
  }

  // Z6 — cơ chế Toàn màn hình (M18): geometry + _NET_WM_STATE sau click.
  {
    const main0 = await session.mainWindow();
    const r1 = await clickMenuItem(session, 2, 6, "z6-fs.png");
    await sleep(1000);
    const main1 = await session.mainWindow();
    const state1 = main1 ? await wmStateNames(session, main1.id) : [];
    const isFs = main1 && main1.geo.width === SCREEN.w && main1.geo.height === SCREEN.h;
    let backOk = false; let backGeo = "?";
    if (r1.ok) {
      const r2 = await clickMenuItem(session, 2, 6, "z6-fs-off.png");
      await sleep(1000);
      const main2 = await session.mainWindow();
      backGeo = main2 ? `${main2.geo.width}x${main2.geo.height}` : "?";
      backOk = r2.ok && !!main2 && main2.geo.width === main0.geo.width && main2.geo.height === main0.geo.height;
    } else {
      // Click bật đã fail (thường do menubar) — thử Escape rồi đo lại geometry để biết cửa sổ có kẹt fullscreen không.
      await session.x11.pressEscape(); await sleep(500);
      const main2 = await session.mainWindow();
      backGeo = main2 ? `${main2.geo.width}x${main2.geo.height}` : "?";
      backOk = !!main2 && main2.geo.width === main0.geo.width && main2.geo.height === main0.geo.height;
    }
    record("Z6 Toàn màn hình (M18): geometry + _NET_WM_STATE sau click bật/tắt", r1.ok && isFs && backOk,
      `click bật: ${r1.ok ? "đúng mục" : "THẤT BẠI: " + (r1.reason ?? "?")}; trước ${main0.geo.width}x${main0.geo.height} → FS ${main1?.geo.width}x${main1?.geo.height} (màn hình ${SCREEN.w}x${SCREEN.h}); _NET_WM_STATE sau bật: [${state1.join(", ")}]; về: ${backGeo} (về đúng: ${backOk})`);
  }

  // Z7 — cơ chế Thu nhỏ (M21): map-state sau click + XMapWindow hiện lại.
  {
    const main = await session.mainWindow();
    const r = await clickMenuItem(session, 3, 0, "z7-min.png");
    await sleep(1000);
    const st = await session.x11.getWindowAttributes(main.id).catch(() => null);
    const unmapped = st ? st.mapState !== 2 : false;
    session.x11.mapWindow(main.id);
    await sleep(1200);
    const st2 = await session.x11.getWindowAttributes(main.id).catch(() => null);
    const viewable = st2 ? st2.mapState === 2 : false;
    const state2 = await wmStateNames(session, main.id);
    record("Z7 Thu nhỏ (M21): map-state sau click + _NET_WM_STATE", r.ok && unmapped && viewable,
      `click: ${r.ok ? "đúng mục" : "THẤT BẠI: " + (r.reason ?? "?")}; sau Thu nhỏ map-state=${st?.mapState} (2=Viewable); _NET_WM_STATE: [${state2.join(", ")}]; sau XMapWindow map-state=${st2?.mapState}`);
  }
  await dumpWindows(session, "zombieprobe cuối");
}

// ---------------- Phase ZOMBIEPROBE2 (ROUND55-L7, chỉ chạy với --only zombieprobe2) ----------------
// Tiếp nối zombieprobe (lượt 1): lượt 1 chứng minh destroy/unmap KHÔNG đủ —
// bands hồi 5 sau destroy nhưng menu vẫn chết (không popup nào mở được).
// Nhưng lượt 1 có 2 lỗ hổng phương pháp cần loại trừ trước khi kết luận:
//   (a) chưa đo baseline clickability của menu TRƯỚC khi có zombie
//       (chỉ đo bands=5 bằng mắt, chưa click thử lần nào);
//   (b) welcome modal xuất hiện MUỘN (sau sample load) nên lượt 1 chạy
//       cả quá trình với modal DOM còn mở (không đóng sau sample load).
// Lượt 2 sửa cả hai (đóng modal kiểu W0 sau sample load + A0 click menu
// baseline), rồi thử từng cách dọn zombie qua ĐƯỜNG SỰ KIỆN GTK (để
// Electron tự dọn qua code path của nó) thay vì hủy cửa sổ từ ngoài:
//   C: X11 click nút Ok trên zombie (GTK response → Electron cleanup);
//   D: focus zombie + Escape (GTK cancel → cleanup);
//   E: destroy + chờ dài + thử menu ở 1s/5s/10s (menu có tự hồi theo thời gian?);
//   F: nếu menu vẫn chết sau mọi cách — dump cửa sổ CON của main + ảnh
//       root sau click (popup có mở dạng child-window mà waitNewWindow miss?).
async function phaseZombieProbe2(session) {
  const ZMSG = (tag) => `Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục? [${tag}]`;
  const info = await session.launchAppImage({ label: "zombie2" });
  await sleep(3000);
  // Chờ sample load trước (modal xuất hiện MUỘN, sau sample load).
  let sampleLoaded = false;
  {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const t = await session.bodyText().catch(() => "");
      if (t.includes("mau-1")) { sampleLoaded = true; break; }
      await sleep(2000);
    }
  }
  // Đóng welcome modal kiểu W0: chờ tối đa 30s cho modal xuất hiện rồi bấm Để sau, verify đã đóng.
  let modalGone = false; let modalAppeared = false;
  {
    const modalOpen = async () => (await session.bodyText()).includes("Chào mừng tới VCut Studio");
    modalAppeared = await modalOpen();
    if (!modalAppeared) {
      const d = Date.now() + 30000;
      while (Date.now() < d && !(modalAppeared = await modalOpen())) await sleep(2000);
    }
    modalGone = !modalAppeared;
    if (modalAppeared) {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
      await sleep(1000);
      modalGone = !(await modalOpen());
    }
  }
  record("A-modal đóng welcome modal sau sample load (W0-style, verify)", modalGone,
    `sampleLoaded=${sampleLoaded}; modal xuất hiện: ${modalAppeared}; sau bấm Để sau: ${modalGone ? "đã đóng" : "VẪN MỞ"}`);
  // A0 — baseline: click menu Tệp TRƯỚC khi có zombie (popup mở được?).
  {
    const o = await openTopMenu(session, 0, "z2-a0-file.png");
    record("A0 baseline: popup Tệp mở được trước khi có zombie", o.ok && o.rows.length === 8,
      o.ok ? `rows=${o.rows.length}` : (o.reason ?? ""));
    await closeAnyMenu(session);
  }
  // Làm project dirty (đổi tên như P0).
  {
    const before = (await session.projectName()).inputs;
    const curName = before[0] ?? "";
    if (curName) {
      await session.cdp.evaluate(`(() => {
        const el = [...document.querySelectorAll("input")].find((i) => i.value === ${JSON.stringify(curName)});
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(el, "H9 Zombie2 Dirty");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      })()`).catch(() => false);
    }
    await sleep(1000);
  }
  async function openConfirm(tag) {
    const dlgBefore = session.cdp.dialogs.length;
    let result = "(chưa trả về)";
    session.cdp.evaluate(`window.confirm(${JSON.stringify(ZMSG(tag))})`)
      .then((v) => { result = v; return v; })
      .catch(() => null);
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      if (session.cdp.dialogs.length > dlgBefore && await rendererResponsive(session)) break;
      await sleep(400);
    }
    return { cdpNew: session.cdp.dialogs.length - dlgBefore, result, responsive: await rendererResponsive(session) };
  }
  async function zombieNow() {
    const f = await findDiscardDialogWindow(session).catch(() => ({ win: null }));
    return f.win;
  }
  async function bandsNow(shot) {
    const { bands } = await menuBarBands(session, shot).catch(() => ({ bands: [] }));
    return bands.length;
  }
  async function menuOpens(tag) {
    const o = await openTopMenu(session, 0, `${tag}.png`);
    if (o.ok) await closeAnyMenu(session);
    return o;
  }
  // B1 — confirm #1 (auto-accept) → zombie; đo bands + thử menu (guard phải fail).
  let z = null;
  {
    const c = await openConfirm("B1");
    await sleep(800);
    z = await zombieNow();
    const b = await bandsNow("z2-b1-menubar.png");
    const o = await menuOpens("z2-b1-menu");
    record("B1 zombie #1: CDP trả lời, cửa sổ còn đó, bands=1, guard từ chối click mù", c.responsive && !!z && b === 1 && !o.ok,
      `confirm trả về: ${JSON.stringify(c.result)} (CDP mới=${c.cdpNew}); zombie: ${z ? `"${z.title || "(không tên)"}" ${z.geo.width}x${z.geo.height}@${z.geo.x},${z.geo.y}` : "(không thấy)"}; bands=${b}; thử mở menu: ${o.ok ? "MỞ ĐƯỢC (bất ngờ — guard không chặn?)" : "fail như kỳ vọng: " + (o.reason ?? "?")}`);
  }
  // C — X11 click nút Ok trên zombie (đường GTK response).
  let menuOkAfterC = false;
  {
    let gone = false; let b = -1;
    if (z) {
      const btn = await clickDialogButton(session, z, 1, "z2-c-ok.png").catch(() => ({ ok: false }));
      await sleep(500);
      gone = await waitWindowGone(session, z.id, 5000);
      b = await bandsNow("z2-c-menubar.png");
      note(`C click Ok trên zombie: click ok=${btn.ok} (thấy ${btn.cols ?? "?"} nút), cửa sổ biến mất: ${gone}, bands=${b}`);
    }
    const o = gone || b === 5 ? await menuOpens("z2-c-menu") : { ok: false, reason: "zombie vẫn còn / bands chưa hồi — không thử menu" };
    menuOkAfterC = o.ok && o.rows.length === 8;
    record("C dọn zombie bằng X11 click nút Ok: cửa sổ biến mất + menu mở lại được", !!z && gone && b === 5 && menuOkAfterC,
      `zombie trước C: ${z ? "có" : "không có để click"}; cửa sổ biến mất sau click Ok: ${gone}; bands sau=${b}; popup Tệp mở lại: ${menuOkAfterC ? `được (rows=${o.rows.length})` : "KHÔNG — " + (o.reason ?? "?")}`);
    if (menuOkAfterC) z = null;
  }
  // D — confirm #2 + focus zombie + Escape (chỉ chạy khi C chưa hồi menu).
  let menuOkAfterD = false;
  if (!menuOkAfterC) {
    const c = await openConfirm("D");
    await sleep(800);
    z = await zombieNow();
    let gone = false; let b = -1;
    if (z) {
      await session.x11.activateWindow(z.id);
      await session.x11.pressEscape();
      await sleep(500);
      gone = await waitWindowGone(session, z.id, 5000);
      b = await bandsNow("z2-d-menubar.png");
      note(`D Escape trên zombie: cửa sổ biến mất: ${gone}, bands=${b}`);
    }
    const o = gone || b === 5 ? await menuOpens("z2-d-menu") : { ok: false, reason: "zombie vẫn còn / bands chưa hồi — không thử menu" };
    menuOkAfterD = o.ok && o.rows.length === 8;
    record("D dọn zombie bằng focus + Escape: cửa sổ biến mất + menu mở lại được", !!z && gone && b === 5 && menuOkAfterD,
      `confirm D trả về: ${JSON.stringify(c.result)}; zombie: ${z ? "có" : "không có"}; cửa sổ biến mất sau Escape: ${gone}; bands sau=${b}; popup Tệp mở lại: ${menuOkAfterD ? `được (rows=${o.rows.length})` : "KHÔNG — " + (o.reason ?? "?")}`);
    if (menuOkAfterD) z = null;
  } else {
    record("D dọn zombie bằng focus + Escape (bỏ qua — C đã hồi menu)", true, "C đã hồi menu nên không cần thử D");
  }
  // E — confirm #3 + destroy + thử menu ở 1s/5s/10s (chỉ chạy khi C và D đều chưa hồi menu).
  if (!menuOkAfterC && !menuOkAfterD) {
    const c = await openConfirm("E");
    await sleep(800);
    z = await zombieNow();
    let destroyOk = false;
    if (z) {
      session.x11.destroyWindow(z.id);
      await sleep(600);
      destroyOk = !(await session.listWindows()).some((w) => w.id === z.id);
    }
    const tries = [];
    for (const waitMs of [1000, 5000, 10000]) {
      if (waitMs > 1000) await sleep(waitMs - 1000);
      const b = await bandsNow(`z2-e-menubar-${waitMs}.png`);
      const o = await menuOpens(`z2-e-menu-${waitMs}`);
      tries.push(`${waitMs}ms: bands=${b}, menu=${o.ok ? "MỞ ĐƯỢC rows=" + o.rows.length : "không mở (" + (o.reason ?? "?") + ")"}`);
      if (o.ok) break;
    }
    const anyOk = tries.some((t) => t.includes("MỞ ĐƯỢC"));
    record("E dọn zombie bằng DestroyWindow + thử menu ở 1s/5s/10s", !!z && destroyOk && anyOk,
      `confirm E trả về: ${JSON.stringify(c.result)}; destroy: ${destroyOk ? "cửa sổ biến mất" : "KHÔNG biến mất"}; ${tries.join(" | ")}`);
  } else {
    record("E dọn zombie bằng DestroyWindow (bỏ qua — C hoặc D đã hồi menu)", true, "đã có cách dọn hồi được menu nên không cần thử destroy-chờ-dài");
  }
  // F — nếu menu vẫn chết sau mọi cách: popup có mở dạng child-window?
  {
    const o = await menuOpens("z2-f-menu");
    if (o.ok) {
      record("F menu đã mở lại được (không cần chẩn đoán child-window)", true, `popup Tệp mở được rows=${o.rows.length} — các bước trước đã hồi menu`);
    } else {
      const main = await session.mainWindow().catch(() => null);
      const kids = main ? await listChildWindows(session, main.id) : [];
      await session.shotRoot(path.join(SHOTS, "z2-f-root.png")).catch(() => {});
      record("F menu vẫn chết: popup có mở dạng cửa sổ CON của main?", kids.length > 0,
        `thử mở Tệp lần cuối: ${o.reason ?? "?"}; cửa sổ con của main: ${kids.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}@${w.geo.x},${w.geo.y}`).join(" | ") || "(không có)"}; đã chụp z2-f-root.png để soi bằng mắt`);
    }
  }
  await dumpWindows(session, "zombieprobe2 cuối");
}

// ---------------- Phase FSPROBE (ROUND55-L7, chỉ chạy với --only fsprobe) ----------------
// Đo cơ chế Toàn màn hình (M18) độc lập, sau khi zombie đã được dọn:
// K3 P8b đã quan sát "click Toàn màn hình làm menu biến mất (bands
// [591,685]) và mọi menu sau đó trượt theo" nhưng verdict P8b không có
// trong report K3 (chỉ chạy --only p4k3/p5/p6/p7). Probe này đo trực tiếp:
//   F1 bật FS bằng menu: geometry? _NET_WM_STATE có FULLSCREEN? bands?
//   F2 thoát bằng F11 (keysym 0xffc8): bands hồi 5 không? geometry?
//   F3 nếu F11 không hồi: Escape có hồi không?
//   F4 sau khi thoát: menu mở lại + action tới renderer được không?
async function phaseFsProbe(session) {
  const info = await session.launchAppImage({ label: "fsprobe" });
  await sleep(3000);
  let sampleLoaded = false;
  {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const t = await session.bodyText().catch(() => "");
      if (t.includes("mau-1")) { sampleLoaded = true; break; }
      await sleep(2000);
    }
  }
  // Đóng welcome modal kiểu W0 (chờ tối đa 30s cho modal xuất hiện).
  let modalGone = false;
  {
    const modalOpen = async () => (await session.bodyText()).includes("Chào mừng tới VCut Studio");
    let appeared = await modalOpen();
    if (!appeared) {
      const d = Date.now() + 30000;
      while (Date.now() < d && !(appeared = await modalOpen())) await sleep(2000);
    }
    modalGone = !appeared;
    if (appeared) {
      await session.cdp.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return true; } return false; })()`);
      await sleep(1000);
      modalGone = !(await modalOpen());
    }
  }
  record("F0 probe setup: app launch + sample load + welcome modal đóng", sampleLoaded && modalGone,
    `launch: ${info.url} textLen=${info.textLen}; sampleLoaded=${sampleLoaded}; modal đóng: ${modalGone}`);
  async function fsState(tag) {
    const main = await session.mainWindow();
    const state = main ? await wmStateNames(session, main.id) : [];
    const { bands } = await menuBarBands(session, `${tag}.png`).catch(() => ({ bands: [] }));
    return { geo: main ? `${main.geo.width}x${main.geo.height}@${main.geo.x},${main.geo.y}` : "?", state, bands: bands.length, centers: bands.map((b) => Math.round(b.center)).join(",") };
  }
  const base = await fsState("f0-base");
  record("F0b baseline trước fullscreen: geometry + _NET_WM_STATE + bands=5", base.bands === 5,
    `geometry=${base.geo}; _NET_WM_STATE=[${base.state.join(", ")}]; bands=${base.bands} (centers ${base.centers})`);
  // F1 — bật fullscreen bằng menu Xem > Toàn màn hình.
  const r1 = await clickMenuItem(session, 2, 6, "f1-fs-on.png");
  await sleep(1000);
  const on = await fsState("f1-fs-on");
  await session.shotRoot(path.join(SHOTS, "f1-root.png")).catch(() => {});
  const fsEngaged = on.state.includes("_NET_WM_STATE_FULLSCREEN") || on.bands !== 5;
  record("F1 bật Toàn màn hình bằng menu: trạng thái FS có bật không (menu ẩn? _NET_WM_STATE FULLSCREEN? geometry?)", r1.ok && fsEngaged,
    `click bật: ${r1.ok ? "đúng mục" : "THẤT BẠI: " + (r1.reason ?? "?")}; geometry ${base.geo} → ${on.geo} (màn hình ${SCREEN.w}x${SCREEN.h}); _NET_WM_STATE=[${on.state.join(", ")}]; bands=${on.bands} (centers ${on.centers}) — menu ẩn = FS đã bật ở tầng Electron dù geometry không đổi (không có WM resize)`);
  // F2 — thoát bằng F11.
  await session.x11.pressKeysym(0xffc8); await sleep(1200);
  const afterF11 = await fsState("f2-after-f11");
  const recoveredF11 = afterF11.bands === 5;
  record("F2 thoát fullscreen bằng F11: menu hiện lại (bands=5) + geometry về cũ", recoveredF11,
    `sau F11: geometry=${afterF11.geo}; _NET_WM_STATE=[${afterF11.state.join(", ")}]; bands=${afterF11.bands} (centers ${afterF11.centers})`);
  // F3 — nếu F11 không hồi: thử Escape.
  let recoveredEsc = false; let afterEsc = null;
  if (!recoveredF11) {
    await session.x11.pressEscape(); await sleep(1200);
    afterEsc = await fsState("f3-after-esc");
    recoveredEsc = afterEsc.bands === 5;
    record("F3 thoát fullscreen bằng Escape (chỉ khi F11 không hồi)", recoveredEsc,
      `sau Escape: geometry=${afterEsc.geo}; _NET_WM_STATE=[${afterEsc.state.join(", ")}]; bands=${afterEsc.bands}`);
  } else {
    record("F3 thoát fullscreen bằng Escape (bỏ qua — F11 đã hồi)", true, "F11 đã hồi menu nên không cần thử Escape");
  }
  // F4 — sau khi thoát: menu mở lại + action tới renderer được không?
  const recovered = recoveredF11 || recoveredEsc;
  if (recovered) {
    const o = await openTopMenu(session, 1, "f4-edit-after.png");
    let actionOk = false; let reason = "";
    if (o.ok) {
      const c = await clickPopupRow(session, o.popup, o.img, o.rows, 0);
      await sleep(800);
      const h = await session.h9();
      actionOk = c.ok && h.actions.includes("undo");
      reason = c.ok ? `action undo tới renderer: ${h.actions.includes("undo")}` : (c.reason ?? "?");
    } else reason = `popup không mở: ${o.reason ?? "?"}`;
    record("F4 sau thoát fullscreen: menu Chỉnh sửa mở + Hoàn tác tới renderer", o.ok && actionOk,
      o.ok ? reason : reason);
  } else {
    record("F4 sau thoát fullscreen: menu mở lại được không", false, "F11 và Escape đều không hồi menu — không thử mở menu (xem ảnh f2/f3-root để đối chiếu)");
  }
  await dumpWindows(session, "fsprobe cuối");
}

// ---------------- Phase .deb ----------------
async function phaseDeb() {
  const libs = ["libgtk-3-0", "libnotify4", "libxtst6", "libatspi2.0-0", "libsecret-1-0"];
  const policy = await run("apt-cache", ["policy", ...libs], { timeoutMs: 30000 });
  // Parse từng lib: không có stanza = apt không biết package này
  // (package lists trống); Candidate: (none) = biết nhưng không có bản cài.
  const perLib = libs.map((lib) => {
    const m = new RegExp(`${lib}:\\n\\s+Installed: ([^\\n]*)\\n\\s+Candidate: ([^\\n]*)`).exec(policy.stdout);
    if (!m) return { lib, unavailable: true, status: "apt không biết package (không có stanza — package lists trống)" };
    const cand = m[2].trim();
    return { lib, unavailable: cand === "(none)", status: `Installed: ${m[1].trim()}, Candidate: ${cand}` };
  });
  const unavailable = perLib.filter((x) => x.unavailable);
  record("P1 apt: cả 5 lib hệ thống đều không có candidate trên VM", unavailable.length === 5,
    perLib.map((x) => `${x.lib}: ${x.status}`).join(" | "));
  const debExists = await exists(DEB);
  const releaseList = await run("ls", [path.join(DESK, "release")], { timeoutMs: 15000 });
  if (!debExists) {
    // .deb đã biến mất khỏi release/ (H8 rebuild chỉ ra AppImage) —
    // không tự build lại .deb trong H9; ghi nhận trung thực là không
    // còn gì để thử cài. P2: kiểm tra không còn dấu vết cài đặt cũ.
    record("P1b Cài .deb: KHÔNG có .deb trong release/ để thử cài", false,
      `release/ hiện có: ${releaseList.stdout.replace(/\n/g, ", ")}; .deb biến mất sau lần rebuild của H8 (chỉ ra AppImage). Không tự build lại .deb — cần .deb mới để thử lại trên máy sạch.`);
    const dpkgList = await run("dpkg", ["-l", "vcut-studio"], { timeoutMs: 15000 });
    const clean = dpkgList.code !== 0 || /un |^rc/.test(dpkgList.stdout) || !/vcut-studio/.test(dpkgList.stdout);
    const optGone = !(await exists("/opt/vcut-studio"));
    record("P2 Dọn sau thử .deb: không có gì để dọn (chưa từng cài được)", clean && optGone,
      `dpkg -l vcut-studio: ${dpkgList.stdout.trim().split("\n").slice(-1)[0] ?? ""}; /opt/vcut-studio còn: ${!optGone}`);
    note(`P1 apt-cache policy đầy đủ: ${policy.stdout.replace(/\n/g, " | ")}`);
    return;
  }
  const before = await run("dpkg", ["-l", "vcut-studio"], { timeoutMs: 15000 });
  const inst = await run("dpkg", ["-i", DEB], { timeoutMs: 120000 });
  const after = await run("dpkg", ["-l", "vcut-studio"], { timeoutMs: 15000 });
  const missing = (inst.stdout + inst.stderr).match(/dependency problems|depends on ([^\s,;]+)/g) ?? [];
  const purge = await run("dpkg", ["--purge", "vcut-studio"], { timeoutMs: 60000 });
  const afterPurge = await run("dpkg", ["-l", "vcut-studio"], { timeoutMs: 15000 });
  const optGone = !(await exists("/opt/vcut-studio"));
  const clean = /un |^rc/.test(afterPurge.stdout) || afterPurge.code !== 0 || !/vcut-studio/.test(afterPurge.stdout);
  record("P1b Cài .deb trên VM: lỗi dependency như kỳ vọng (thiếu lib hệ thống)", /dependency problems/i.test(inst.stdout + inst.stderr),
    `dpkg -i: ${inst.code === 0 ? "OK (bất ngờ)" : "lỗi dependency như kỳ vọng"}; thiếu: ${[...new Set(missing)].join(" | ").slice(0, 300)}`);
  record("P2 Dọn sau thử .deb: purge sạch, không còn file cài", purge.code === 0 && clean && optGone,
    `purge exit=${purge.code}; dpkg -l sau purge: ${afterPurge.stdout.trim().split("\n").slice(-1)[0] ?? ""}; /opt/vcut-studio còn: ${!optGone}`);
  note(`P1 apt-cache policy đầy đủ: ${policy.stdout.replace(/\n/g, " | ")}`);
  note(`P1b dpkg -i stdout: ${inst.stdout.slice(0, 500)} || stderr: ${inst.stderr.slice(0, 500)}`);
  note(`P1b dpkg -l trước cài: ${before.stdout.trim().slice(0, 200)}; sau cài: ${after.stdout.trim().slice(0, 300)}`);
}

// ---------------- Phase CROSS-BUILD (chỉ kiểm tra config, không build) ----------------
async function phaseCross() {
  const pkg = JSON.parse(await fs.readFile(path.join(DESK, "package.json"), "utf8"));
  const build = pkg.build ?? {};
  const hasMac = !!build.mac; const hasWin = !!build.win;
  const linuxTargets = (build.linux?.target ?? []).map((t) => (typeof t === "string" ? t : t.target));
  const linuxArch = build.linux?.target?.flatMap((t) => (typeof t === "object" && t.arch ? t.arch : [])) ?? [];
  const wine = await run("which", ["wine", "wine64"], { timeoutMs: 15000 });
  const hasWine = wine.code === 0;
  record("X1 Config cross-build: chưa có mac/win/arm64 trong package.json", !hasMac && !hasWin && !linuxArch.includes("arm64"),
    `build.mac: ${hasMac ? "CÓ" : "không có"}; build.win: ${hasWin ? "CÓ" : "không có"}; linux targets: ${linuxTargets.join(",") || "?"}; arch cấu hình: ${linuxArch.join(",") || "mặc định x64"}`);
  record("X2 Windows NSIS từ Linux: cần Wine (electron-builder toolsets) — VM không có Wine", !hasWine,
    `which wine: ${hasWine ? wine.stdout.trim() : "không tìm thấy"}; theo docs electron-builder (toolsets): wine chỉ cần khi build Windows target trên máy không phải Windows, mặc định dùng wine hệ thống`);
  record("X3 macOS dmg: cần máy Mac (target dmg gọi sips, chỉ có trên macOS)", true,
    `chưa có config mac; theo ghi chép electron-builder: dmg target gọi sips của macOS nên build dmg trên máy Mac; build mac zip unsigned từ Linux là khả thi về mặt kỹ thuật nhưng CHƯA thử ở đây (cần tải Electron mac binary + ký/notarize vẫn bắt buộc máy Mac + Apple Developer account để phân phối)`);
  record("X4 Linux arm64: khả thi từ Linux x64 (electron-builder --linux --arm64 tải Electron arm64), chưa thử", true,
    `chưa có target arm64 trong config; không build thử vì không chạy/kiểm chứng được binary arm64 trên VM x64 này`);
  note(`X: electron-builder cache: ${(await run("ls", [path.join(os.homedir(), ".cache/electron-builder")], { timeoutMs: 15000 })).stdout.trim().split("\n").join(", ")}`);
}

// ---------------- main ----------------
async function main() {
  const argv = process.argv.slice(2);
  const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
  const skipDeb = argv.includes("--skip-deb");
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(SHOTS, { recursive: true });
  await fs.mkdir(TESTDIR, { recursive: true });
  // ROUND53-J3: tự tạo fixture .vcut + fail-fast trước mọi phase (đợt 52
  // §5.3: fixture /tmp bị reboot xóa → M5/D1/D2b chạy mù). Fixture sống ở
  // hidden_files/h9/fixtures (bền vững), không phải /tmp.
  let fixtureInfo = "";
  try {
    fixtureInfo = await ensureFixtures();
  } catch (e) {
    console.error(`FIXTURE FAIL-FAST: không tạo/verify được fixture: ${e.message}`);
    process.exit(2);
  }
  record("PRE Fixture .vcut tự tạo/verify (hidden_files/h9/fixtures)", true, fixtureInfo);
  // Dọn file output của lượt chạy trước (VCUT1/VCUT2 là file app tự ghi,
  // KHÔNG phải fixture) để exists() là tín hiệu thật ở M3/M4/D2a — nếu
  // không, lượt chạy thứ hai sẽ thấy VCUT1 đã tồn tại và M3/M4 fail oan.
  await fs.rm(VCUT1, { force: true }).catch(() => {});
  await fs.rm(VCUT2, { force: true }).catch(() => {});
  // Profile mới mỗi lượt chạy: user-data-dir cũ chứa autosave + window-state
  // của lượt trước (run 12: clip mẫu nhân đôi 3 → 6, cửa sổ hẹp còn 1315px).
  await fs.rm(USERDATA, { recursive: true, force: true });
  note("main: đã xóa user-data-dir cũ — chạy với profile mới");
  // ROUND53-J3: seed recentProjects=[FIXTURE1] vào settings.json mới
  // (settings.ts: lang "vi", lastProjectPath null) để M7 có entry thật
  // trong submenu "Mở gần đây" ngay cả khi M5 fail (đợt 52: recent rỗng
  // → submenu chỉ có 1 mục disabled "Trống"). App load settings 1 lần
  // lúc khởi động nên seed phải xong trước launchAppImage đầu tiên.
  // Thử lại tối đa 3 lần + đọc lại để verify: VM có quirk EPERM thoáng
  // qua khi ghi file (đợt 52 §4.8; đợt 53 lượt 2: writeFile tạo file
  // 0 byte rồi EPERM, ghi tay lại thì được). Seed fail thì app rơi về
  // default (settings.ts load() catch → recent rỗng) nên không chặn run.
  {
    const seedPath = path.join(USERDATA, "settings.json");
    const seedContent = JSON.stringify({ lang: "vi", lastProjectPath: null, recentProjects: [FIXTURE1] }, null, 2);
    let seeded = false;
    for (let attempt = 1; attempt <= 3 && !seeded; attempt++) {
      try {
        await fs.mkdir(USERDATA, { recursive: true });
        await fs.writeFile(seedPath, seedContent);
        const back = JSON.parse(await fs.readFile(seedPath, "utf8"));
        seeded = Array.isArray(back.recentProjects) && back.recentProjects[0] === FIXTURE1;
        if (!seeded) throw new Error("đọc lại không khớp recentProjects đã seed");
      } catch (e) {
        if (attempt < 3) await sleep(500);
        else note(`main: seed settings.json thất bại sau 3 lần (M7 sẽ chạy với recent rỗng): ${e.message}`);
      }
    }
    if (seeded) note(`main: đã seed settings.json recentProjects=[${FIXTURE1}] cho M7`);
  }

  // Preflight: file AppImage được test có đúng là bản release hiện tại
  // không (H8 rebuild liên tục trong đợt 51 — sha thay đổi; không hardcode
  // sha cũ nữa, so sánh trực tiếp với release/ tại thời điểm chạy).
  // Menu/dialog/file-io không đổi từ bản Phase 10 (mtime 08:56–09:35),
  // chỉ services + main wiring đổi theo H8 (bundledRuntime + bridgePidfile).
  // ROUND53-J3: khi test bằng --binary (unpacked), so sánh với AppImage
  // là VÔ NGHĨA (binary test không phải AppImage) — và AppImage trong
  // release/ có thể đang bị rebuild ghi đè giữa chừng (đợt 53: 2 lần đọc
  // sha liên tiếp ra 2 sha khác nhau). Khi đó PRE chỉ xác minh unpacked
  // snapshot bằng strings trên app.asar (bundle + rename dialog) và ghi
  // rõ snapshot; khi test AppImage thì giữ so sánh sha như cũ.
  if (USING_UNPACKED) {
    const asarPath = path.join(path.dirname(LAUNCH_BIN), "resources/app.asar");
    const asarStat = await fs.stat(asarPath).catch(() => null);
    // ROUND54-K4: binary test có thể là dev-electron (chạy apps/desktop/dist
    // từ source, không qua asar — để test code mới chưa đóng gói lại). Khi
    // đó không có app.asar để verify; ghi nhận diện bản build bằng sha
    // dist/main.js + dist/preload.js thay vì fail PRE một cách khó hiểu.
    if (!asarStat) {
      const devMain = path.join(DESK, "dist/main.js");
      const devPreload = path.join(DESK, "dist/preload.js");
      const devMainStat = await fs.stat(devMain).catch(() => null);
      const devPreloadStat = await fs.stat(devPreload).catch(() => null);
      if (devMainStat && devPreloadStat) {
        const mainSha = (await run("sha256sum", [devMain], { timeoutMs: 30000 })).stdout.split(/\s+/)[0] ?? "";
        const preloadSha = (await run("sha256sum", [devPreload], { timeoutMs: 30000 })).stdout.split(/\s+/)[0] ?? "";
        const mainJs = await fs.readFile(devMain, "utf8").catch(() => "");
        const preloadJs = await fs.readFile(devPreload, "utf8").catch(() => "");
        const hasFix = /did-finish-load/.test(mainJs) && /argv: /.test(mainJs) && /openFileQueue/.test(preloadJs);
        record("PRE Dev build từ source được test (electron + apps/desktop/dist, không asar)", hasFix,
          `binary: ${LAUNCH_BIN}; dist/main.js sha=${mainSha.slice(0, 16)}… (${devMainStat.size} byte, mtime=${devMainStat.mtime.toISOString()}); dist/preload.js sha=${preloadSha.slice(0, 16)}… (${devPreloadStat.size} byte); fix D1 trong build (main log argv + did-finish-load + preload openFileQueue): ${hasFix}; kết quả chỉ có giá trị cho đúng bản build này`);
        note(`PRE dùng dev-electron thay AppImage để test code mới (preload buffer + main log) mà chưa cần đóng gói lại AppImage`);
      } else {
        record("PRE Unpacked snapshot được test (asar verify bằng strings)", false,
          `unpacked binary: ${LAUNCH_BIN}; app.asar KHÔNG có và apps/desktop/dist cũng thiếu main.js/preload.js — không xác định được binary đang test`);
      }
    } else {
    const asarSha = await run("sha256sum", [asarPath], { timeoutMs: 30000 });
    const aU = asarSha.stdout.split(/\s+/)[0] ?? "";
    const stringsOut = await run("strings", [asarPath], { timeoutMs: 60000 });
    const bundles = [...new Set((stringsOut.stdout.match(/index-[A-Za-z0-9_-]*\.js/g) ?? []))];
    const hasRename = /rename-project-dialog/.test(stringsOut.stdout);
    const binStat = await fs.stat(LAUNCH_BIN).catch(() => null);
    const appImageState = (await exists(APPIMAGE)) ? "có trong release/ (không dùng để so — binary test là unpacked)" : "vắng mặt trong release/ (đang rebuild)";
    record("PRE Unpacked snapshot được test (asar verify bằng strings)", !!asarStat && bundles.length > 0,
      `unpacked binary: ${LAUNCH_BIN} (${binStat ? binStat.size + " byte" : "?"}); app.asar sha=${aU.slice(0, 16)}… (${asarStat ? asarStat.size + " byte" : "KHÔNG có"}); bundle trong asar: ${bundles.join(",") || "(không thấy)"}; rename-project-dialog trong asar: ${hasRename}; AppImage: ${appImageState}; kết quả chỉ có giá trị cho đúng snapshot này`);
    note(`PRE dùng unpacked binary thay AppImage vì AppImage runtime flaky dưới tải nặng (run 11/13/14: giải nén lại + network-service crash /proc/self/exe) — xem LIMITS H9 §6`);
    }
  } else {
  const sha = await run("sha256sum", [APPIMAGE], { timeoutMs: 30000 });
  const appImageSha = sha.stdout.split(/\s+/)[0];
  const shaRel = await run("sha256sum", [APPIMAGE_DEFAULT], { timeoutMs: 30000 });
  const releaseSha = shaRel.stdout.split(/\s+/)[0];
  const aiStat = await fs.stat(APPIMAGE);
  // ROUND55-L4: chấp nhận cả bản rebuild 02:59 UTC 07/11 (sha bff19724…,
  // chứa fix K1/K2/K4) ngoài release/ hiện tại — probe này test bản rebuild.
  const knownFresh55L4 = "bff19724e8dd988dd698f38bdfc5031dee95731b63a4b4e82cb05ea9fcd416f3";
  record("PRE AppImage được test đúng là bản release hiện tại hoặc bản rebuild ROUND55-L4 đã verify", appImageSha === releaseSha || appImageSha === knownFresh55L4,
    `test sha=${appImageSha.slice(0, 16)}… (${aiStat.size} byte, mtime=${aiStat.mtime.toISOString()}); release/ sha=${releaseSha.slice(0, 16)}…${appImageSha === releaseSha || appImageSha === knownFresh55L4 ? "" : " — KHÁC NHAU (H8 rebuild giữa chừng; test vẫn hợp lệ cho đúng sha đã ghi)"}`);
  }
  note(`PRE bản Phase 10 gốc sha 6e6fd2fb… (09:43); các bản H8 sau đó: 7a2b20bd… (11:58), 29beaa1d2… (12:23) — menu.ts/file-io.ts/native-files.ts/preload.ts không đổi (mtime 08:56–09:35 < 09:43), chỉ main.ts/serviceLifecycle.ts/services đổi`);

  const session = new AppSession();
  try {
    await session.startXvfb();
    if (!only || only === "menu") {
      const info = await session.launchAppImage({ label: "menu" });
      note(`App launch OK: ${info.url} textLen=${info.textLen}`);
      // Dialog cảnh báo thiếu ffmpeg (nếu có) thì đóng trước — các cửa
      // sổ phụ khác của Chromium ("Chromium clipboard", "vcut-studio")
      // KHÔNG phải dialog, không được đụng vào.
      await sleep(1500);
      const wins0 = await session.listWindows();
      note(`cửa sổ lúc khởi động: ${wins0.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}`).join(" | ")}`);
      const ff = wins0.find((w) => /ffmpeg/i.test(w.title));
      if (ff) {
        note(`dialog ffmpeg xuất hiện — đóng bằng Enter`);
        await session.x11.pressReturn(); await sleep(800);
      }
      try { await phaseMenu(session); } catch (e) { record("phaseMenu: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseMenu crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (!only || only === "dclick") {
      if (session.child && session.child.exitCode === null) await session.closeAppClean();
      try { await phaseDclick(session); } catch (e) { record("phaseDclick: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseDclick crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (only === "d4") {
      // ROUND53-J4: đo lại exitCode=127 đợt 51 khi app sống (D4a/D4b/D4c).
      try { await phaseD4(session); } catch (e) { record("phaseD4: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseD4 crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (only === "diag") {
      const info = await session.launchAppImage({ label: "diag" });
      note(`App launch OK (diag): ${info.url} textLen=${info.textLen}`);
      await sleep(1500);
      const wins0 = await session.listWindows();
      note(`cửa sổ lúc khởi động (diag): ${wins0.map((w) => `${w.title || "(không tên)"} ${w.geo.width}x${w.geo.height}`).join(" | ")}`);
      try { await phaseDiag(session); } catch (e) { record("phaseDiag: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseDiag crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (only === "dialogprobe") {
      // ROUND54-K4: probe bản chất dialog discard-confirm (phaseDialogProbe tự launch app).
      try { await phaseDialogProbe(session); } catch (e) { record("phaseDialogProbe: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseDialogProbe crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (only === "zombieprobe") {
      // ROUND55-L7: điều tra zombie window M8 + cơ chế M18/M21 (tự launch app).
      try { await phaseZombieProbe(session); } catch (e) { record("phaseZombieProbe: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseZombieProbe crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (only === "zombieprobe2") {
      // ROUND55-L7: lượt 2 — baseline menu + dọn zombie qua đường GTK (tự launch app).
      try { await phaseZombieProbe2(session); } catch (e) { record("phaseZombieProbe2: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseZombieProbe2 crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
    if (only === "fsprobe") {
      // ROUND55-L7: đo cơ chế Toàn màn hình M18 độc lập (tự launch app).
      try { await phaseFsProbe(session); } catch (e) { record("phaseFsProbe: crash giữa chừng (xem log)", false, String(e?.message ?? e)); note("phaseFsProbe crash: " + (e?.stack ?? String(e)).slice(0, 600)); }
    }
  } finally {
    if (session.child && session.child.exitCode === null) await session.closeAppClean().catch(() => {});
    await session.stopXvfb();
  }
  if (!skipDeb && (!only || only === "deb")) await phaseDeb();
  if (!only || only === "cross") await phaseCross();

  // Lưu bằng chứng settings.json + file .vcut test vào OUT (không stage vào repo).
  try {
    const sj = await fs.readFile(path.join(USERDATA, "settings.json"), "utf8").catch(() => null);
    if (sj) await fs.writeFile(path.join(OUT, "settings-after.json"), sj);
    for (const f of [VCUT1, VCUT2]) if (await exists(f)) await fs.copyFile(f, path.join(OUT, path.basename(f)));
  } catch {}
  // ROUND53-J3: copy log app (/tmp, mất sau reboot) về OUT làm bằng chứng
  // GPU FATAL / dialog (đợt 52 §9: log các lượt sau cần copy ngay).
  // Chỉ copy log của ĐÚNG display này (d<DISPLAY_NUM>) + second-instance
  // của lượt này — các luồng J1/J2/J4 chạy song song có log d<N> khác,
  // copy hết sẽ lẫn bằng chứng của nhau (đợt 53 lượt 2 đã lẫn log d141
  // của J2 vào OUT r53j3b).
  try {
    const logRe = new RegExp(`^h9-.*-d${DISPLAY_NUM}\\.log$`);
    for (const f of await fs.readdir("/tmp").catch(() => [])) {
      if (logRe.test(f) || f === "h9-second-instance.log") {
        await fs.copyFile(path.join("/tmp", f), path.join(OUT, f)).catch(() => {});
      }
    }
  } catch {}

  report.finishedAt = new Date().toISOString();
  report.passed = report.cases.filter((c) => c.ok).length;
  report.failed = report.cases.filter((c) => !c.ok).length;
  // ROUND54-K2: ghi report không được làm mất kết quả đã in ra stdout —
  // lượt đo lại 00:50 gặp EPERM thoáng qua ở writeFile này, cả report
  // mất (file 0 byte) dù stdout đã có đủ PASS/FAIL. Bọc try/catch.
  try {
    await fs.writeFile(path.join(OUT, "h9-report.json"), JSON.stringify(report, null, 2));
    console.log(`\nSUMMARY: ${report.passed} passed, ${report.failed} failed — report: ${path.join(OUT, "h9-report.json")}`);
  } catch (e) {
    console.log(`\nSUMMARY: ${report.passed} passed, ${report.failed} failed — KHÔNG GHI ĐƯỢC report: ${e.message} (kết quả đã in ở trên)`);
  }
  process.exit(report.failed ? 1 : 0);
}

main().catch((e) => {
  console.error("HARNESS ERROR:", e);
  process.exit(2);
});

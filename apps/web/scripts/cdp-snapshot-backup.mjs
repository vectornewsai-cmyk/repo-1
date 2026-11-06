#!/usr/bin/env node
/**
 * cdp-snapshot-backup.mjs — Backup bền snapshot treo CDP ra ngoài VM
 * (Phase 9 đợt 36, luồng S6; nợ §3.6 của docs/PHASE9_ROUND35_LIMITS.md).
 *
 * Bối cảnh: từ đợt 32 O2 đến đợt 35 R5, mọi snapshot treo CDP đều chỉ
 * nằm trên đĩa VM tại ~/workspace/vcut-cdp-hang-snapshots/<harness>/.
 * VM bị thay thế → bằng chứng treo mất, dù JSON kết quả probe (trong
 * repo) còn nhúng nội dung snapshot thì file snapshot gốc vẫn mất.
 * Script này là lớp backup bền cho chính các file đó:
 *
 *   - Nguồn mặc định: ~/workspace/vcut-cdp-hang-snapshots/ (đổi bằng
 *     CDP_SNAP_SRC khi test).
 *   - Đích mặc định: thư mục bền trong workspace của goal
 *     ~/workspace/goals/capcut-clone-video-editor/hidden_files/
 *     cdp-hang-snapshots-backup/<YYYYMMDD-HHMMSS>/ (đổi bằng
 *     CDP_SNAP_BACKUP_ROOT khi test). Đích nằm NGOÀI repo nên không
 *     bao giờ lọt vào batch push git; đích cũng không nằm trong /tmp
 *     nên không bị dọn tạm. "Ngoài VM" ở đây theo đúng định nghĩa
 *     của brief S6: vị trí bền trong workspace goal + manifest/index
 *     + script khôi phục/kiểm tra lại được — script KHÔNG claim đẩy
 *     lên dịch vụ ngoài nào khác, vì không có dịch vụ nào được cấp
 *     cho luồng này.
 *   - Mỗi lần backup ghi manifest.json trong chính thư mục backup đó:
 *     danh sách file (đường dẫn tương đối, sha256, size) + thời gian
 *     + thư mục nguồn, để --verify kiểm tra lại được bất cứ lúc nào.
 *     index.json ở gốc backup root liệt kê mọi lần backup.
 *
 * Cách dùng:
 *   node cdp-snapshot-backup.mjs
 *       # backup: copy toàn bộ *.json dưới nguồn sang thư mục mới
 *   node cdp-snapshot-backup.mjs --verify <thư-mục-backup>
 *       # kiểm tra lại: hash từng file theo manifest, báo
 *       # missing/mismatch/extra; exit 0 khi khớp, exit 1 khi lệch.
 *   node cdp-snapshot-backup.mjs --restore <thư-mục-backup> [--force]
 *       # khôi phục về thư mục nguồn (hoặc CDP_SNAP_RESTORE_TARGET):
 *       # file đã tồn tại và hash khớp thì bỏ qua; file đã tồn tại
 *       # nhưng hash khác mà không có --force thì DỪNG, không ghi đè.
 *
 * An toàn: script KHÔNG BAO GIỜ xóa file nguồn hay file backup; restore
 * không --force không ghi đè file khác hash. Mọi lần chạy đều in số
 * file + hash manifest để đối chiếu bằng mắt.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const HOME = os.homedir();
const DEFAULT_SRC = path.join(HOME, "workspace", "vcut-cdp-hang-snapshots");
const DEFAULT_BACKUP_ROOT = path.join(
  HOME,
  "workspace",
  "goals",
  "capcut-clone-video-editor",
  "hidden_files",
  "cdp-hang-snapshots-backup",
);
const SRC = path.resolve(process.env.CDP_SNAP_SRC || DEFAULT_SRC);
const BACKUP_ROOT = path.resolve(process.env.CDP_SNAP_BACKUP_ROOT || DEFAULT_BACKUP_ROOT);

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function collectJsonFiles(dir) {
  const out = [];
  const walk = (d, relBase) => {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, rel);
      else if (e.isFile() && e.name.endsWith(".json")) out.push({ rel, full });
    }
  };
  walk(dir, "");
  out.sort((a, b) => (a.rel < b.rel ? -1 : 1));
  return out;
}

function timestampCompact(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function doBackup() {
  const files = collectJsonFiles(SRC);
  const destDir = path.join(BACKUP_ROOT, timestampCompact());
  if (fs.existsSync(destDir)) {
    console.error(`Thư mục backup đã tồn tại (chạy lại trong cùng 1 giây?): ${destDir}`);
    process.exit(2);
  }
  fs.mkdirSync(destDir, { recursive: true });
  const manifestFiles = [];
  let totalBytes = 0;
  for (const f of files) {
    const dest = path.join(destDir, f.rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f.full, dest);
    const st = fs.statSync(dest);
    manifestFiles.push({ rel: f.rel, sha256: sha256File(dest), size: st.size });
    totalBytes += st.size;
  }
  const manifest = {
    createdAt: new Date().toISOString(),
    tool: "cdp-snapshot-backup.mjs (backup)",
    sourceDir: SRC,
    backupDir: destDir,
    fileCount: manifestFiles.length,
    totalBytes,
    files: manifestFiles,
  };
  fs.writeFileSync(path.join(destDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  const manifestSha = sha256File(path.join(destDir, "manifest.json"));
  // index.json ở gốc: liệt kê mọi lần backup (đọc cũ, thêm mới).
  let index = { backups: [] };
  const indexPath = path.join(BACKUP_ROOT, "index.json");
  try {
    const prev = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (Array.isArray(prev.backups)) index = prev;
  } catch { /* chưa có index: tạo mới */ }
  index.backups.push({
    dir: path.basename(destDir),
    createdAt: manifest.createdAt,
    fileCount: manifest.fileCount,
    totalBytes: manifest.totalBytes,
    manifestSha256: manifestSha,
  });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log(`[backup] nguồn: ${SRC}`);
  console.log(`[backup] đích: ${destDir}`);
  console.log(`[backup] files=${manifest.fileCount} totalBytes=${totalBytes} manifestSha256=${manifestSha}`);
  return destDir;
}

function loadManifest(backupDir) {
  const mPath = path.join(backupDir, "manifest.json");
  if (!fs.existsSync(mPath)) throw new Error(`thiếu manifest.json trong thư mục backup: ${backupDir}`);
  return JSON.parse(fs.readFileSync(mPath, "utf8"));
}

function doVerify(backupDir) {
  const manifest = loadManifest(backupDir);
  const problems = [];
  for (const f of manifest.files) {
    const p = path.join(backupDir, f.rel);
    if (!fs.existsSync(p)) problems.push(`missing: ${f.rel}`);
    else {
      const h = sha256File(p);
      if (h !== f.sha256) problems.push(`mismatch: ${f.rel} (manifest ${f.sha256} ≠ đĩa ${h})`);
    }
  }
  const actual = new Set(collectJsonFiles(backupDir).map((f) => f.rel));
  for (const rel of actual) {
    if (rel === "manifest.json") continue;
    if (!manifest.files.some((f) => f.rel === rel)) problems.push(`extra: ${rel} (có trên đĩa nhưng không có trong manifest)`);
  }
  // manifest.json tự nó không nằm trong danh sách files nên không tính extra.
  if (problems.length) {
    console.error(`[verify] FAIL ${backupDir}: ${problems.length} vấn đề:`);
    for (const p of problems) console.error(`[verify]   - ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`[verify] OK ${backupDir}: ${manifest.fileCount} file khớp manifest`);
  }
  return problems;
}

function doRestore(backupDir, force) {
  const manifest = loadManifest(backupDir);
  const target = path.resolve(process.env.CDP_SNAP_RESTORE_TARGET || SRC);
  let copied = 0;
  let skipped = 0;
  for (const f of manifest.files) {
    const src = path.join(backupDir, f.rel);
    if (!fs.existsSync(src)) throw new Error(`file backup thiếu trên đĩa: ${f.rel}`);
    if (sha256File(src) !== f.sha256) throw new Error(`file backup lệch manifest, dừng restore: ${f.rel}`);
    const dest = path.join(target, f.rel);
    if (fs.existsSync(dest)) {
      if (sha256File(dest) === f.sha256) {
        skipped++;
        continue;
      }
      if (!force) throw new Error(`đích đã có file khác hash, cần --force mới ghi đè: ${dest}`);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    if (sha256File(dest) !== f.sha256) throw new Error(`khôi phục xong nhưng hash lệch: ${f.rel}`);
    copied++;
  }
  console.log(`[restore] nguồn backup: ${backupDir}`);
  console.log(`[restore] đích: ${target} (copied=${copied} skipped-identical=${skipped})`);
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const modeArg = args.find((a) => a === "--verify" || a === "--restore");
  if (modeArg) {
    const dir = args[args.indexOf(modeArg) + 1];
    if (!dir) {
      console.error(`Thiếu thư mục backup sau ${modeArg}`);
      process.exit(2);
    }
    const abs = path.resolve(dir);
    if (modeArg === "--verify") doVerify(abs);
    else doRestore(abs, force);
    return;
  }
  if (args.length && args[0] !== "--help" && args[0] !== "-h") {
    console.error(`Đối số không nhận ra: ${args.join(" ")} (xem header file để biết cách dùng)`);
    process.exit(2);
  }
  doBackup();
}

main();

#!/usr/bin/env node
/**
 * cdp-dist-freeze.mjs — Đóng băng thư mục dist cho harness WS
 * (Phase 9 đợt 36, luồng S6; nợ §3.6 của docs/PHASE9_ROUND35_LIMITS.md).
 *
 * Bối cảnh: harness pipe (N2, đợt 35 R2) đóng băng dist bằng cách COPY
 * cả thư mục dist vào snapshot rồi serve bản sao đó, kèm manifest
 * sha256 toàn dist trước/sau — đổi giữa chừng → INVALID. Harness WS
 * (seek-o3/seek-p2/mobile/bench) trước đợt này chỉ ghi hash của MỘT
 * bundle lúc khởi động (cdp-bundle.mjs, đợt 35 R5): nếu dist bị build
 * đè giữa lúc đo thì snapshot giữ hash lúc đầu, không tái hiện được
 * bundle lúc treo và không phát hiện được sự đổi đó. Module này đưa
 * cơ chế đóng băng của pipe sang harness WS dưới dạng dùng chung.
 *
 * Hai mức đóng băng (caller chọn mức phù hợp với harness của mình):
 *
 *   1. MANIFEST TRƯỚC/SAU (mọi harness WS đều làm được, kể cả harness
 *      không tự serve dist như bench): tính distManifest(distDir)
 *      lúc khởi động, tính lại lúc kết thúc, verifyDistManifest()
 *      đối chiếu — lệch → { valid: false, problems } và caller PHẢI
 *      đánh dấu kết quả INVALID (bench: exit 3 như R2; seek-o3: ghi
 *      frozenDist.validity = "INVALID" + error, exit 2 theo quy ước
 *      sẵn có của probe đó). Không đặt distDir → không kiểm tra,
 *      caller ghi validity "UNVERIFIED" như R2, không claim "cùng dist".
 *
 *   2. COPY ĐÓNG BĂNG KIỂU PIPE (harness tự serve dist): freezeDistCopy()
 *      copy toàn bộ distDir sang destDir rồi kiểm tra manifest của bản
 *      sao bằng đúng manifest nguồn — bản sao mới là thứ được serve
 *      (seek-o3 vốn đã serve SNAP là một bản sao copy trước khi chạy;
 *      module này chỉ thêm lớp kiểm chứng manifest trước/sau cho bản
 *      sao đó, không đổi cách serve của seek-o3).
 *
 * Format manifest CỐ TÌNH khớp probe Q6 đợt 34 (R2 dùng lại ở đợt 35):
 * liệt kê đệ quy mọi file, sắp xếp theo đường dẫn tương đối, mỗi dòng
 * `${sha256}  ${rel}`, manifestSha256 = sha256 của các dòng nối bằng
 * "\n" (không có newline cuối). Nhờ đó hash manifest của cùng một dist
 * so sánh được xuyên harness/probe (ví dụ manifest R2 đợt 35
 * 1a413dee… cho dist bundle DgObvvhC). File đọc lỗi ghi "unreadable"
 * như Q6 thay vì throw — caller thấy sha đó là biết manifest không
 * đáng tin, không lặng lẽ bỏ file khỏi danh sách.
 *
 * Module này chỉ đọc + hash + copy, KHÔNG build, KHÔNG sửa dist nguồn,
 * KHÔNG serve. Copy đích đã tồn tại và không rỗng → throw (không tự
 * xóa thư mục của người khác).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/**
 * @returns {{dir: string, fileCount: number, totalBytes: number,
 *   manifestSha256: string, files: Array<{rel: string, sha256: string, size: number}>}}
 */
export function distManifest(dir) {
  const absDir = path.resolve(dir);
  const files = [];
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
      if (e.isDirectory()) {
        walk(full, rel);
      } else if (e.isFile() || e.isSymbolicLink()) {
        try {
          const st = fs.statSync(full);
          if (!st.isFile()) continue;
          files.push({ rel, sha256: sha256File(full), size: st.size });
        } catch {
          files.push({ rel, sha256: "unreadable", size: 0 });
        }
      }
    }
  };
  walk(absDir, "");
  files.sort((a, b) => (a.rel < b.rel ? -1 : 1));
  const manifestSha256 = crypto
    .createHash("sha256")
    .update(files.map((f) => `${f.sha256}  ${f.rel}`).join("\n"))
    .digest("hex");
  return {
    dir: absDir,
    fileCount: files.length,
    totalBytes: files.reduce((s, f) => s + f.size, 0),
    manifestSha256,
    files,
  };
}

/**
 * Đối chiếu manifest hiện tại của dir với manifest kỳ vọng (thường là
 * manifest lúc khởi động). Trả { valid, problems, manifest } — KHÔNG
 * throw khi lệch (lệch là kết quả đo, không phải lỗi code); chỉ throw
 * khi dir không đọc được thành manifest (lỗi hạ tầng).
 */
export function verifyDistManifest(dir, expectedManifest) {
  const manifest = distManifest(dir);
  const problems = [];
  if (!expectedManifest || typeof expectedManifest.manifestSha256 !== "string") {
    problems.push("không có manifest kỳ vọng để đối chiếu (manifest lúc khởi động thiếu)");
  } else {
    if (manifest.manifestSha256 !== expectedManifest.manifestSha256) {
      problems.push(
        `dist đổi giữa chừng: manifest trước ${expectedManifest.manifestSha256} ≠ sau ${manifest.manifestSha256}`,
      );
    }
    if (manifest.fileCount !== expectedManifest.fileCount) {
      problems.push(`số file đổi: trước ${expectedManifest.fileCount} ≠ sau ${manifest.fileCount}`);
    }
  }
  return { valid: problems.length === 0, problems, manifest };
}

/**
 * Copy kiểu pipe: copy toàn bộ srcDir sang destDir rồi kiểm tra manifest
 * bản sao bằng manifest nguồn. destDir đã tồn tại và không rỗng → throw.
 * @returns {{destDir: string, manifest: object, sourceManifest: object}}
 */
export function freezeDistCopy(srcDir, destDir) {
  const src = path.resolve(srcDir);
  const dest = path.resolve(destDir);
  if (!fs.existsSync(path.join(src, "index.html"))) {
    throw new Error(`dist nguồn thiếu index.html: ${src}`);
  }
  if (fs.existsSync(dest)) {
    const existing = fs.readdirSync(dest);
    if (existing.length > 0) throw new Error(`thư mục copy đích đã tồn tại và không rỗng: ${dest}`);
  } else {
    fs.mkdirSync(dest, { recursive: true });
  }
  const sourceManifest = distManifest(src);
  fs.cpSync(src, dest, { recursive: true });
  const copyManifest = distManifest(dest);
  if (copyManifest.manifestSha256 !== sourceManifest.manifestSha256) {
    throw new Error(
      `copy đóng băng không khớp nguồn: nguồn ${sourceManifest.manifestSha256} ≠ bản sao ${copyManifest.manifestSha256}`,
    );
  }
  return { destDir: dest, manifest: copyManifest, sourceManifest };
}

#!/usr/bin/env node
/**
 * cdp-bundle.mjs — Xác định bundle thật đang được một harness WS phục vụ,
 * để ghi vào snapshot treo CDP (Phase 9 đợt 35, luồng R5).
 *
 * Bối cảnh: từ đợt 32 đến đợt 34, mọi harness WS đều truyền bundle: null
 * vào captureCdpHangSnapshot() vì "không có snapshotDist", nên snapshot
 * chỉ ghi status "not-captured" (đợt 34 Q5 làm cho việc này tường minh,
 * nhưng vẫn chưa ghi bundle thật). Nợ đợt 34 §3 mục 5 yêu cầu snapshotDist
 * riêng từng harness WS.
 *
 * Hàm duy nhất: snapshotBundleFromDist(distDir)
 *   - Trả null khi distDir không phải một dist phục vụ được (thiếu
 *     index.html): caller giữ nguyên hành vi cũ (bundle null →
 *     "not-captured"), KHÔNG bịa bundle.
 *   - Ngược lại đọc distDir/index.html, lấy script entry đầu tiên
 *     (<script src="...js">) còn tồn tại trên đĩa, hash sha256 16 ký
 *     tự đầu của đúng file đó. Entry lấy từ index.html — không phải
 *     "file .js lớn nhất" đoán mò — nên tên + sha khớp với bundle mà
 *     trình duyệt thực sự nạp khi mở "/".
 *   - Fallback duy nhất: nếu index.html không tham chiếu file .js nào
 *     còn tồn tại (dist viết tay / index.html tối giản), lấy file .js
 *     lớn nhất dưới distDir/assets/ và ghi rõ source: "assets-largest"
 *     trong kết quả (caller có thể log, module snapshot không ghi
 *     trường này — xem cdp-snapshot.mjs). Nếu cả hai đều không có,
 *     trả null thay vì bịa.
 *   - Kết quả: { bundle, sha, dist, source } trong đó dist là đường
 *     dẫn distDir tuyệt đối như caller truyền vào (đã resolve), để
 *     snapshot ghi được "dist path + sha256" theo yêu cầu R5.
 *
 * KHÔNG copy dist, KHÔNG build, KHÔNG sửa dist: chỉ đọc + hash. Việc
 * tính bundle lúc harness khởi động (trước khi serve) phản ánh đúng
 * bundle đang phục vụ tại thời điểm đó; nếu dist bị build đè sau đó
 * thì snapshot vẫn giữ hash lúc khởi động — đó là lý do các harness
 * pipe snapshot cả thư mục dist, còn harness WS ở đây chỉ ghi hash
 * lúc khởi động (ghi rõ trong LIMITS của R5, không claim "đóng băng").
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sha16(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").slice(0, 16);
}

function collectJsFiles(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectJsFiles(p, out);
    else if (e.isFile() && p.endsWith(".js")) out.push(p);
  }
}

/**
 * @param {string|null|undefined} distDir thư mục dist đang được serve
 *   (ví dụ SNAP của seek-o3/seek-p2, apps/web/dist của vite preview).
 * @returns {{bundle: string, sha: string, dist: string, source: string}|null}
 */
export function snapshotBundleFromDist(distDir) {
  if (!distDir) return null;
  const dir = path.resolve(distDir);
  const indexPath = path.join(dir, "index.html");
  if (!fs.existsSync(indexPath) || !fs.statSync(indexPath).isFile()) return null;
  let html;
  try {
    html = fs.readFileSync(indexPath, "utf8");
  } catch {
    return null;
  }
  // Entry script đầu tiên trong index.html còn tồn tại trên đĩa.
  const scriptSrcs = [...html.matchAll(/<script[^>]*\ssrc=["']([^"']+\.js[^"']*)["']/gi)].map((m) => m[1]);
  for (const src of scriptSrcs) {
    const clean = src.split(/[?#]/)[0];
    const candidate = path.resolve(dir, clean.replace(/^\//, ""));
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { bundle: path.basename(candidate), sha: sha16(candidate), dist: dir, source: "index-entry" };
    }
  }
  // Fallback: file .js lớn nhất dưới assets/ (ghi rõ source để khỏi
  // hiểu nhầm là entry đã xác định qua index.html).
  const assetsDir = path.join(dir, "assets");
  const jsFiles = [];
  collectJsFiles(assetsDir, jsFiles);
  if (jsFiles.length) {
    let largest = jsFiles[0];
    for (const f of jsFiles) {
      if (fs.statSync(f).size > fs.statSync(largest).size) largest = f;
    }
    return { bundle: path.basename(largest), sha: sha16(largest), dist: dir, source: "assets-largest" };
  }
  return null;
}

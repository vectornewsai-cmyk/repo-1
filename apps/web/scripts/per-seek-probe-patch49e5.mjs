/**
 * Phase 9 đợt 49, luồng E5 — vá probe per-seek lúc chạy + hàm thuần
 * khớp fingerprint drop (D5 §6.5: endPool sau drop chưa có fingerprint
 * elementId trực tiếp).
 *
 * NGUYÊN TẮC (theo tiền lệ D5): KHÔNG sửa file probe gốc
 * `per-seek-probe-page.js` (file dùng chung nhiều luồng) — mọi bổ sung
 * ở đây là vá chuỗi lúc chạy (string replace có assert anchor), một
 * nguồn duy nhất cho cả script đo lẫn test Node.
 *
 * Vá gồm 2 lớp:
 *  (a) Lớp D5 giữ nguyên (stack gọi + src lúc seek + wall time) để
 *      evidence E5 so sánh được với D5/C6 từng entry.
 *  (b) Lớp E5 mới: `probe.elementIdOf(el)` — trả elementId hiện có của
 *      element, hoặc GÁN MỚI nếu chưa có (không tái dùng id cũ — cùng
 *      bất biến với elementIdFor). Harness dùng nó để đọc id của pool
 *      element kể cả khi element đó chưa từng seek (trường hợp element
 *      mới sau drop: được tạo ra nhưng chưa seek thì entry chưa có, chỉ
 *      snapshot pool + elementIdOf mới fingerprint được nó).
 *
 * `matchDropFingerprint` là hàm thuần khóa logic khớp: với cùng một
 * pool key, probeElementId đổi sau drop + entry sau drop mang đúng id
 * mới + khác id đã drop thì fingerprint khớp. Pool key giữ nguyên
 * KHÔNG chứng minh được gì (chính là gap D5 §4.4) — test khóa cả chiều
 * âm đó.
 */

/** Vá nguồn probe thô (D5 + E5). Ném lỗi nếu anchor không còn khớp — dừng thay vì vá mù. */
export function patchProbeSrc49E5(rawSrc) {
  let src = rawSrc;
  // (a) Lớp D5 — copy y hệt từ per-seek-probe-sync-cap-run48-d5.mjs.
  const anchorFn = "  function recordSeek(el, target) {";
  if (!src.includes(anchorFn)) throw new Error("không tìm thấy recordSeek trong per-seek-probe-page.js — file gốc đã đổi, dừng lại thay vì vá mù");
  src = src.replace(anchorFn,
    "  function captureStack47C6() { try { return new Error().stack.split(\"\\n\").slice(2, 8).join(\" | \"); } catch (e) { return \"\"; } }\n" + anchorFn);
  const anchorEl = "        elementId: elementIdFor(el),";
  if (!src.includes(anchorEl)) throw new Error("không tìm thấy elementId trong per-seek-probe-page.js");
  src = src.replace(anchorEl,
    "        elementId: elementIdFor(el),\n" +
    "        stack47C6: captureStack47C6(),\n" +
    "        srcAtSeek47C6: (function () { try { return el.currentSrc || el.src || null; } catch (e) { return null; } })(),\n" +
    "        wallMs47C6: Date.now(),");
  // (b) Lớp E5 — elementIdOf trước probe.read.
  const anchorRead = "  probe.read = function read() {";
  if (!src.includes(anchorRead)) throw new Error("không tìm thấy probe.read trong per-seek-probe-page.js");
  src = src.replace(anchorRead,
    "  // ROUND49-E5: fingerprint elementId cho pool element (D5 §6.5).\n" +
    "  // Trả id hiện có, hoặc gán mới nếu element chưa từng seek (id\n" +
    "  // không bao giờ tái dùng — cùng bất biến với elementIdFor). Harness\n" +
    "  // đọc qua đây để fingerprint pool element mới sau drop kể cả khi\n" +
    "  // nó chưa có entry nào; không dùng elementIdFor trực tiếp ngoài\n" +
    "  // probe để khỏi phụ thuộc tên hàm nội bộ.\n" +
    "  probe.elementIdOf = function elementIdOf(el) {\n" +
    "    try { return elementIdFor(el); } catch (e) { return null; }\n" +
    "  };\n\n" + anchorRead);
  return src;
}

/**
 * Khớp fingerprint drop — hàm thuần, test được bằng Node.
 *
 * Đầu vào:
 *  - droppedElementId: elementId của element đã drop (lấy từ entry đang
 *    pending / entry cuối cùng trên element đó trước lúc drop).
 *  - poolBefore / poolAfter: snapshot pool trước/sau drop, mỗi video là
 *    { poolKey, probeElementId } (poolKey = key của pool.videos — giữ
 *    nguyên khi element mới tạo lại dưới cùng key, xem D5 §4.4).
 *  - entryAfterDropElementId: elementId của entry seek đầu tiên sau drop.
 *
 * Kết quả: replacedKeys (key nào đổi id), newElementIds (id mới xuất
 * hiện), entryMatchesNewPool (entry sau drop mang đúng id mới trong
 * pool), entryDiffersFromDropped (entry sau drop khác id đã drop),
 * fingerprintOk (cả ba điều kiện trên cùng đúng).
 */
export function matchDropFingerprint({ droppedElementId, poolBefore, poolAfter, entryAfterDropElementId }) {
  const beforeByKey = new Map((poolBefore || []).map((v) => [v.poolKey, v.probeElementId]));
  const afterByKey = new Map((poolAfter || []).map((v) => [v.poolKey, v.probeElementId]));
  const replacedKeys = [];
  const newElementIds = [];
  for (const [key, afterId] of afterByKey) {
    const beforeId = beforeByKey.get(key);
    if (beforeId === undefined) {
      // Key mới hoàn toàn (pool thêm video) — id mới, không phải replace.
      if (afterId !== null && afterId !== undefined) newElementIds.push(afterId);
    } else if (beforeId !== afterId) {
      replacedKeys.push(key);
      if (afterId !== null && afterId !== undefined) newElementIds.push(afterId);
    }
  }
  const entryMatchesNewPool =
    entryAfterDropElementId !== null && entryAfterDropElementId !== undefined
    && newElementIds.includes(entryAfterDropElementId);
  const entryDiffersFromDropped =
    entryAfterDropElementId !== null && entryAfterDropElementId !== undefined
    && droppedElementId !== null && droppedElementId !== undefined
    && entryAfterDropElementId !== droppedElementId;
  return {
    replacedKeys,
    newElementIds,
    entryMatchesNewPool,
    entryDiffersFromDropped,
    fingerprintOk: replacedKeys.length > 0 && entryMatchesNewPool && entryDiffersFromDropped,
  };
}

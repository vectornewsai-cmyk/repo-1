/**
 * gopTail45A4.ts — Tail-scan tìm box moov cuối file (Phase 9 đợt 45,
 * luồng A4; đóng nợ đợt 44 §4.5: moov cuối file thật với mdat khổng
 * lồ vẫn fallback).
 *
 * BỐI CẢNH: `findTruncatedMoovHeader` (đợt 44 Z4) chỉ cứu được moov
 * mà header đã nằm trong tiền tố. Với file trailing thật (ftyp,
 * mdat khổng lồ, moov ở cuối), header moov nằm ngoài tiền tố nên
 * tiền tố chỉ thấy mdat cắt dở → gate `unknown` → fallback. Muốn
 * GOP chạy được trên file này phải nhìn vào ĐUÔI file, không phải
 * đoán moov từ tiền tố.
 *
 * THIẾT KẾ (không đoán — mọi ứng viên phải qua 3 cửa cùng lúc):
 *   1. Kết thúc đúng tại EOF: box ứng viên phải có
 *      `start + size == fileSize`. Cửa này một mình đã loại moov đầu
 *      file (faststart: sau moov còn mdat nên không kết thúc ở EOF)
 *      và hầu hết chuỗi "moov" giả nằm trong payload mdat (size đọc
 *      từ 4 byte trước chuỗi giả hiếm khi cho đúng EOF).
 *      Đợt 46 B4: mở rộng có kiểm chứng — moov kết thúc trước một
 *      hậu tố `free`/`skip`/`wide` parse sạch tới EOF cũng lọt cửa
 *      này (xem `trailingSuffixValid`); hậu tố khác vẫn loại.
 *      Đợt 47 C5: mở rộng tiếp sang `udta` (metadata người dùng,
 *      không mang sample — xem `trailingSuffixValid`); hậu tố khác
 *      (`mdat`/`moof`/chuỗi vỡ) vẫn loại.
 *   2. Nằm gọn trong cửa sổ đuôi đã fetch: `start >= tailStart` và
 *      `size <= maxMoovBytes` (mặc định 16 MiB, cùng trần moov của
 *      T3). Moov lớn hơn cửa sổ, moov `size == 0` (kéo tới hết file
 *      nhưng không giới hạn được range), header largesize bị cắt ở
 *      đầu cửa sổ đều → không tìm thấy, giữ fallback.
 *   3. Payload phải parse được thành cây box con: đi hết các box con
 *      trong moov, không thừa/thiếu byte, và phải có cả `mvhd` lẫn
 *      `trak`. Cửa này loại chuỗi giả được chế để cửa 1 lọt qua
 *      (payload rác không đi thành cây box, hoặc thiếu mvhd/trak).
 *      Lưu ý: kiểm tra này chỉ chứng minh "đây là một box moov hợp
 *      lệ", không chứng minh sample table bên trong đúng — bước
 *      demux của T3 (`parseMp4VideoTrack`) vẫn là cửa cuối: moov
 *      parse lỗi → fallback như mọi đường moov khác.
 *
 * NẾU NHIỀU ỨNG VIÊN CÙNG LỌT (trường hợp chế tác): chọn ứng viên
 * có `start` nhỏ nhất (ngoài cùng nhất). Lý do: box moov trailing
 * thật là box top-level cuối file; một ứng viên khác cùng kết thúc
 * ở EOF mà bắt đầu sau nó thì nằm trong payload của box ngoài —
 * không thể là box top-level. Ngược lại, chuỗi giả trong mdat mà
 * lọt cả 3 cửa thì về mặt byte đã không phân biệt được với moov
 * thật nếu không parse toàn bộ mdat — đó là giới hạn đã ghi (xem
 * LIMITS đợt 45 A4), và demux vẫn là cửa cuối trước khi GOP chạy.
 *
 * HÀM NÀY LÀ THUẦN (không fetch): caller (T3) tự fetch đuôi file
 * bằng Range đã kiểm chứng rồi mới gọi hàm này trên buffer đuôi.
 * `tail` PHẢI là đúng N byte cuối file (`tailStart + tail.length
 * == fileSize`); nếu không, hàm trả "không thấy" thay vì suy diễn.
 *
 * GIỚI HẠN CỐ TÌNH (xem LIMITS để khỏi tưởng đã xong):
 * - Moov sau đó còn box khác (vd free cuối file) → moov không kết
 *   thúc ở EOF → không thấy, giữ fallback.
 *   NGOẠI LỆ ĐỢT 46 B4 (xem `trailingSuffixValid`): moov mà sau nó
 *   CHỈ là chuỗi box `free`/`skip`/`wide` hợp lệ, đi đúng tới EOF,
 *   thì vẫn được chấp nhận — hậu tố đó là padding/đánh dấu, không
 *   mang sample, và chuỗi box phải parse sạch tới EOF mới lọt (cửa
 *   bổ sung, không nới cửa 1–3: moov vẫn phải parse thành cây box
 *   có mvhd+trak và vẫn dưới trần). Box hậu tố khác (vd `udta`,
 *   `mdat`, `moof`) → vẫn không thấy, giữ fallback.
 *   NGOẠI LỆ ĐỢT 47 C5: allowlist thêm `udta` — box metadata người
 *   dùng ở top-level (vd ©xyz, meta tùy writer), không mang sample
 *   và không nằm trong sample table mà demux dựng từ moov; T3 chỉ
 *   cắt đúng byte moov rồi demux nên byte hậu tố không bao giờ tới
 *   demux. `udta` được đối xử như `free`: chỉ cần header + size nằm
 *   gọn trong phần còn lại và chuỗi đi đúng tới EOF (payload bên
 *   trong không kiểm tra — như free). `mdat`/`moof` và mọi type khác
 *   vẫn loại.
 * - Moov nằm gọn trong tiền tố nhưng gate đã kết luận `trailing`
 *   (file trailing nhỏ) KHÔNG đi qua đường này: T3 chỉ gọi tail-scan
 *   từ nhánh `unknown` (xem gopRangeFetch39T3.ts bước 4, marker
 *   ROUND45-A4). File trailing nhỏ vẫn fallback `moov-trailing`
 *   như cũ — thay đổi gate đó là việc khác, không thuộc luồng này.
 * - Cửa sổ đuôi mặc định = trần moov (16 MiB): moov trailing lớn
 *   hơn trần vẫn fallback `moov-too-large` như đường moov đầu.
 */

/** Trần moov mặc định của T3; cửa sổ đuôi mặc định lấy đúng số này
 *  (cửa sổ không bao giờ cần lớn hơn moov lớn nhất mà ta chịu fetch). */
export const DEFAULT_TAIL_SCAN_BYTES = 16 * 1024 * 1024;

/** Một box moov trailing đã qua đủ 3 cửa kiểm tra. */
export interface TailMoovCandidate {
  /** Offset bắt đầu box moov trong file (tuyệt đối, không phải trong đuôi). */
  start: number;
  /** Kích thước box moov khai trong header (32-bit hoặc largesize). */
  size: number;
  /** Độ dài header (8, hoặc 16 khi largesize). */
  header: number;
}

export type TailScanResult =
  | {
      found: true;
      candidate: TailMoovCandidate;
      /** Offset bắt đầu cửa sổ đuôi trong file (= fileSize - tail.length). */
      tailStart: number;
    }
  | {
      found: false;
      /** Lý do không thấy (để caller ghi vào lý do fallback, không phải chuỗi UI). */
      reason: string;
    };

export interface TailScanOptions {
  /** Trần kích thước moov được chấp nhận (mặc định 16 MiB). */
  maxMoovBytes?: number;
}

/**
 * Đợt 46 B4 — hậu tố sau moov có parse thành chuỗi box "vô hại" tới
 * đúng EOF không. Chỉ chấp nhận `free`/`skip`/`wide` (padding/đánh
 * dấu, không mang sample): mỗi box phải có header đủ, size nằm gọn
 * trong phần còn lại, và chuỗi phải kết thúc ĐÚNG ở EOF (không
 * thừa/thiếu byte). Box `size == 0` ở top-level được hiểu theo spec
 * là kéo tới hết file nên chỉ hợp lệ khi nó là box cuối (nuốt đúng
 * phần còn lại). Mọi type khác → false ngay: `mdat`/`moof` sau moov
 * không còn là "trailing padding" nữa.
 *
 * Đợt 47 C5 — allowlist thêm `udta`: box metadata người dùng ở
 * top-level (ISO BMFF: user data — vd ©xyz, tên tác giả, meta tùy
 * writer), không mang sample và không nằm trong sample table mà
 * demux dựng từ moov. T3 chỉ cắt đúng byte moov rồi demux nên byte
 * hậu tố không bao giờ tới demux — vì vậy `udta` được đối xử đúng
 * như `free`: chỉ kiểm tra header + size nằm gọn và chuỗi đi đúng
 * tới EOF, không kiểm tra payload bên trong (payload udta có thể là
 * bất kỳ metadata nào, kể cả chuỗi không đi thành cây box con —
 * giống hệt payload của free). `udta` NẰM TRONG moov thì đã là một
 * phần của moov được parse ở cửa 3, không liên quan tới hàm này.
 * `mdat`/`moof`/mọi type khác sau moov vẫn false.
 */
function trailingSuffixValid(
  view: DataView,
  start: number,
  end: number,
): boolean {
  let off = start;
  let count = 0;
  while (off < end) {
    if (off + 8 > end) return false;
    let size = view.getUint32(off);
    const type = String.fromCharCode(
      view.getUint8(off + 4),
      view.getUint8(off + 5),
      view.getUint8(off + 6),
      view.getUint8(off + 7),
    );
    if (type !== "free" && type !== "skip" && type !== "wide" && type !== "udta") return false;
    let header = 8;
    if (size === 1) {
      if (off + 16 > end) return false;
      const big = view.getBigUint64(off + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) return false;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < header || off + size > end) return false;
    count++;
    off += size;
  }
  return off === end && count > 0;
}

function isMoovType(view: DataView, off: number): boolean {
  return (
    view.getUint8(off + 4) === 0x6d && // m
    view.getUint8(off + 5) === 0x6f && // o
    view.getUint8(off + 6) === 0x6f && // o
    view.getUint8(off + 7) === 0x76 // v
  );
}

/**
 * Kiểm tra payload moov có đi thành cây box con đúng luật không:
 * mọi box con đều có header đủ, size nằm gọn trong moov, đi hết
 * đúng tới cuối moov (không thừa/thiếu byte), và có cả `mvhd` lẫn
 * `trak`. Box con `size == 0` được hiểu theo spec là kéo tới hết
 * moov (chỉ hợp lệ khi nó nuốt đúng phần còn lại).
 */
function moovChildrenValid(
  view: DataView,
  moovOff: number,
  moovSize: number,
  header: number,
): boolean {
  const end = moovOff + moovSize;
  let off = moovOff + header;
  let seenMvhd = false;
  let seenTrak = false;
  let childCount = 0;
  while (off < end) {
    if (off + 8 > end) return false;
    let size = view.getUint32(off);
    const type = String.fromCharCode(
      view.getUint8(off + 4),
      view.getUint8(off + 5),
      view.getUint8(off + 6),
      view.getUint8(off + 7),
    );
    let childHeader = 8;
    if (size === 1) {
      if (off + 16 > end) return false;
      const big = view.getBigUint64(off + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) return false;
      size = Number(big);
      childHeader = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < childHeader || off + size > end) return false;
    if (type === "mvhd") seenMvhd = true;
    if (type === "trak") seenTrak = true;
    childCount++;
    off += size;
  }
  return off === end && childCount > 0 && seenMvhd && seenTrak;
}

/**
 * Tìm box moov trailing trong buffer đuôi file.
 *
 * @param tail Buffer chứa đúng N byte cuối file (không phải tiền tố,
 *   không phải đoạn giữa). Nếu `tail` dài hơn file hoặc không kết
 *   thúc ở EOF thì kết quả là "không thấy" (đầu vào không nhất quán,
 *   không suy diễn).
 * @param fileSize Tổng kích thước file (đã biết từ HEAD/probe).
 */
export function findTrailingMoov(
  tail: Uint8Array,
  fileSize: number,
  opts: TailScanOptions = {},
): TailScanResult {
  const maxMoovBytes = opts.maxMoovBytes ?? DEFAULT_TAIL_SCAN_BYTES;
  if (!(Number.isFinite(fileSize) && fileSize > 0)) {
    return { found: false, reason: "tail-scan-invalid-file-size" };
  }
  if (tail.length === 0) {
    return { found: false, reason: "tail-scan-empty-tail" };
  }
  const tailStart = fileSize - tail.length;
  if (tailStart < 0) {
    return { found: false, reason: "tail-scan-tail-larger-than-file" };
  }
  if (!(maxMoovBytes > 0)) {
    return { found: false, reason: "tail-scan-invalid-max-moov" };
  }
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const valid: TailMoovCandidate[] = [];
  let sawTooLarge = false;
  // Quét mọi vị trí có thể là header box: size ở [i, i+4), type "moov"
  // ở [i+4, i+8). Chỉ kiểm tra tiếp khi type khớp (byte 'm' đầu tiên
  // đã lọc gần hết payload mdat, nên quét 16 MiB vẫn rẻ).
  for (let i = 0; i + 8 <= tail.length; i++) {
    if (view.getUint8(i + 4) !== 0x6d) continue;
    if (!isMoovType(view, i)) continue;
    let size = view.getUint32(i);
    let header = 8;
    if (size === 1) {
      if (i + 16 > tail.length) continue;
      const big = view.getBigUint64(i + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) continue;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      continue; // moov size==0: không giới hạn được range fetch.
    }
    if (size < header) continue;
    const start = tailStart + i;
    // ROUND46-B4: cửa 1 mở rộng — moov kết thúc đúng ở EOF, HOẶC
    // moov kết thúc trước một hậu tố free/skip/wide parse sạch tới
    // EOF (hậu tố phải nằm gọn trong đuôi đã fetch thì mới kiểm
    // chứng được; moov bắt đầu trước tailStart thì không xét).
    // ROUND47-C5: allowlist hậu tố thêm `udta` (xem
    // `trailingSuffixValid`); hậu tố nằm ngoài đuôi (vd free trailer
    // > cửa sổ) → không thấy — QUYẾT GIỮ cửa sổ 16 MiB, xem LIMITS
    // C5 §4: hậu tố > 16 MiB là padding bệnh lý, fallback an toàn.
    const endsAtEof = start + size === fileSize;
    const endsBeforeValidSuffix =
      !endsAtEof &&
      start + size < fileSize &&
      i + size <= tail.length &&
      trailingSuffixValid(view, i + size, tail.length);
    if (!endsAtEof && !endsBeforeValidSuffix) continue;
    if (size > maxMoovBytes) {
      sawTooLarge = true;
      continue;
    }
    if (!moovChildrenValid(view, i, size, header)) continue; // cửa 3.
    valid.push({ start, size, header });
  }
  if (valid.length === 0) {
    if (sawTooLarge) {
      return { found: false, reason: "tail-scan-moov-too-large" };
    }
    return { found: false, reason: "tail-scan-no-candidate" };
  }
  // Nhiều ứng viên cùng lọt: chọn ngoài cùng nhất (start nhỏ nhất) —
  // đó mới có thể là box top-level cuối file (xem header module).
  valid.sort((a, b) => a.start - b.start);
  return { found: true, candidate: valid[0], tailStart };
}

/**
 * Tính range đuôi cần fetch cho tail-scan: [fileSize - tailBytes,
 * fileSize - 1], kẹp về 0 khi file nhỏ hơn cửa sổ. Trả null khi
 * fileSize không hợp lệ (caller giữ fallback, không fetch mù).
 */
export function tailRangeFor(
  fileSize: number,
  tailBytes: number,
): { start: number; end: number } | null {
  if (!(Number.isFinite(fileSize) && fileSize > 0)) return null;
  if (!(Number.isFinite(tailBytes) && tailBytes > 0)) return null;
  return { start: Math.max(0, fileSize - tailBytes), end: fileSize - 1 };
}

/**
 * reverseRangeGate38U2.ts — Cổng quyết định fetch theo Range cho nguồn
 * http/proxy, phục vụ fetch theo GOP (Phase 9 đợt 38, luồng U2).
 *
 * PHẠM VI — ĐỌC KỸ TRƯỚC KHI TRÍCH DẪN:
 * Module này CHỈ là cổng/kiểm tra (gate), KHÔNG phải fetch theo GOP
 * thật. Không có code nào trong repo hiện gọi cổng này để fetch từng
 * GOP: ReversePreviewController vẫn tải toàn file (hướng (b) đợt 35
 * R3) rồi decode 1 cửa sổ. Cổng này tồn tại để đợt sau, khi viết
 * demux mảnh, có một quyết định đã được khóa bằng test thay vì đoán
 * khả năng Range của server lúc chạy.
 *
 * HỢP ĐỒNG RANGE (3 điều kiện CÙNG đúng mới được THỬ Range):
 * 1. moov-trước (faststart): moov xuất hiện TRƯỚC mdat trong file.
 *    Lý do: demux cần moov để biết offset/size từng sample rồi mới
 *    tính được byte-range của 1 GOP (Mp4Sample.offset đã có sau khi
 *    parse moov). Moov-cuối (trailing) thì phải probe đuôi file với
 *    kích thước moov chưa biết (nhiều lượt Range thăm dò) — chưa
 *    cài đặt, nên cổng trả fallback, KHÔNG tự đoán moov ở cuối.
 *    Moov không thấy trong tiền tố đã đọc thì là "unknown", cũng
 *    fallback — không được suy ra faststart từ việc server là bridge
 *    hay từ `-movflags +faststart` lúc tạo proxy (đó là kỳ vọng về
 *    quy trình tạo file, không phải bằng chứng về file đang fetch).
 * 2. Server quảng cáo `Accept-Ranges: bytes`. Header vắng mặt hoặc
 *    khác "bytes" thì fallback. KHÔNG giả định Range chỉ vì URL là
 *    proxyUrl của bridge: hợp đồng của bridge phải đo bằng header
 *    thật (xem LIMITS U2 §3), không suy từ code Express.
 *    Đợt 49 E2 — NGOẠI LỆ DUY NHẤT, CÓ BẰNG CHỨNG (xem
 *    `rangeSupportEstablished` + LIMITS đợt 49 E2 §2): header VẮNG
 *    (null/undefined — vd blob: URL, Chrome không gửi header này)
 *    được bù bằng BẰNG CHỨNG response 206 đã kiểm chứng nghiêm ngặt
 *    (status 206 + Content-Range khớp đúng range đã xin, qua
 *    `checkRangeProbeResponse`): đó là đo thật, không phải giả định.
 *    Header KHẲNG ĐỊNH khác "bytes" (vd "none") thì KHÔNG được bù —
 *    tuyên bố rõ ràng của server thắng bằng chứng hành vi (test khóa
 *    T3 "Accept-Ranges none dù Range vẫn 206" giữ nguyên).
 * 3. Đã biết tổng kích thước file (size > 0, hữu hạn). Không có size
 *    thì không tính được range đuôi, không kiểm tra được
 *    Content-Range trả về có khớp tổng không — fallback.
 *
 * NGAY CẢ KHI 3 ĐIỀU KIỆN ĐỦ, lần Range đầu tiên vẫn phải kiểm chứng
 * bằng checkRangeProbeResponse(): server quảng cáo Accept-Ranges vẫn
 * có thể trả 200 toàn file cho request Range (Range thất bại âm thầm
 * — cảnh báo đợt 35 R3). Chỉ status 206 + Content-Range khớp đúng
 * range đã xin mới được tiếp tục dùng Range; mọi trường hợp còn lại
 * fallback về tải toàn file (đường cũ), không thử Range lại mù.
 *
 * QUY TẮC FIRST-WINS ĐƯỢC GIỮ NGUYÊN (không đổi lén):
 * Cổng S4/T5 trong reverseWebcodecs.ts vẫn giữ "biết trước thắng một
 * lần": size đã biết (từ HEAD, header GET, hay caller truyền trước)
 * thì size tới sau bị bỏ qua. Luồng U2 chỉ thêm NGUỒN size mới cho
 * proxy (proxySizeBytes từ bridge/manifest — xem proxy.ts), không
 * sửa thứ tự ưu tiên đó. Hệ quả còn lại, ghi rõ: nếu HEAD của proxy
 * đã trả size nhỏ sai trước khi proxySizeBytes tới thì cổng muộn
 * không cứu được — chỉ còn cổng header GET và cổng sau-tải đỡ (giống
 * hệt trường hợp file gốc ở LIMITS T5 §5.1).
 */

/**
 * Đợt 61 R6 — lookup i18n tùy chọn (mẫu Q4: file này được test bằng Node
 * nên KHÔNG import `../i18n` trực tiếp). Khi `lookup` vắng → fallback
 * đúng từng chữ chuỗi VI cũ nên test cũ + hành vi mặc định không đổi.
 * Key trong fragment R6 (`gop.gate.*`, `gop.probe.*`).
 */
export type I18nLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: I18nLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

/** Vị trí moov suy từ thứ tự box top-level đã đọc được. */
export type MoovPosition = "faststart" | "trailing" | "unknown";

export type RangeGopInput = {
  /** Vị trí moov đã xác định bằng detectMoovPosition (không đoán). */
  moovPosition: MoovPosition;
  /** Giá trị thô của header Accept-Ranges (null = server không gửi). */
  acceptRanges: string | null | undefined;
  /** Tổng kích thước file đã biết (null = chưa biết). */
  knownSizeBytes: number | null | undefined;
  /**
   * Đợt 49 E2 — Range đã được CHỨNG MINH bằng ít nhất một response
   * 206 đã kiểm chứng nghiêm ngặt (status 206 + Content-Range khớp
   * đúng range đã xin, qua `checkRangeProbeResponse`) trên cùng URL.
   * Chỉ dùng để bù cho header VẮNG (xem `rangeSupportEstablished`);
   * mặc định false = hành vi U2 cũ, không đổi lén.
   */
  rangeProvenByVerifiedProbe?: boolean;
};

export type RangeGopDecision = {
  /** "range-gop-attempt" = được THỬ Range, nhưng lần Range đầu vẫn
   *  phải qua checkRangeProbeResponse; "full-file" = dùng đường cũ. */
  mode: "range-gop-attempt" | "full-file";
  eligible: boolean;
  /** Lý do từng điều kiện (đủ để log/debug, không phải chuỗi UI). */
  reasons: string[];
};

/** Accept-Ranges có đúng "bytes" không (không phân biệt hoa/thường,
 *  bỏ khoảng trắng thừa; giá trị khác như "none" là không hỗ trợ). */
export function acceptsByteRanges(
  acceptRanges: string | null | undefined,
): boolean {
  return (
    typeof acceptRanges === "string" && acceptRanges.trim().toLowerCase() === "bytes"
  );
}

/**
 * Đợt 49 E2 — Range có được coi là đã xác lập trên URL này không.
 *
 * QUYẾT ĐỊNH (đối chiếu nguyên tắc U2 "không giả định", xem LIMITS
 * đợt 49 E2 §2): ba trường hợp, rạch ròi theo LOẠI bằng chứng —
 *   - Header là chuỗi "bytes" → đủ (đường cũ, không đổi).
 *   - Header là chuỗi khác "bytes" (vd "none") → KHÔNG đủ, dù đã có
 *     probe 206: server đã tuyên bố rõ ràng là không hỗ trợ Range,
 *     và một response 206 mâu thuẫn với tuyên bố đó không đủ sức
 *     bác tuyên bố — tin tuyên bố là phía an toàn. Test khóa T3
 *     "Accept-Ranges none dù Range vẫn 206" giữ nguyên ý nghĩa này.
 *   - Header VẮNG (null/undefined — vd blob: URL: Chrome không gửi
 *     header này cho blob: URL, và HEAD còn ném lỗi) + đã có ít nhất
 *     một response Range 206 KIỂM CHỨNG NGHIÊM NGẶT (status 206 +
 *     Content-Range khớp đúng range đã xin + khớp tổng đã biết, qua
 *     `checkRangeProbeResponse`) → đủ. Đây KHÔNG phải giả định: bằng
 *     chứng là chính response đó — server phớt lờ Range trả 200,
 *     server trả 206 lệch range/tổng đều bị `checkRangeProbeResponse`
 *     loại; không có response 206 nào như vậy thì cờ này là false
 *     và vẫn fallback như cũ. Không suy từ loại URL (không có trường
 *     hợp riêng blob: URL), không suy từ cấu hình server — chỉ tin
 *     response đã đo trên đúng URL đó.
 *
 * Caller (T3) chỉ được truyền `rangeProvenByVerifiedProbe: true`
 * sau khi probe VÀ tiền tố đều đã qua `checkRangeProbeResponse`
 * (xem gopRangeFetch39T3.ts bước 2–3); truyền true khi chưa có
 * response 206 nào là lỗi lập trình của caller, không phải của gate.
 */
export function rangeSupportEstablished(
  acceptRanges: string | null | undefined,
  rangeProvenByVerifiedProbe: boolean,
): boolean {
  if (typeof acceptRanges === "string") return acceptsByteRanges(acceptRanges);
  return rangeProvenByVerifiedProbe === true;
}

function validSize(size: number | null | undefined): boolean {
  return typeof size === "number" && Number.isFinite(size) && size > 0;
}

/**
 * Quyết định có được THỬ fetch theo GOP bằng Range không.
 * Thứ tự kiểm tra cố ý: moov trước, rồi Accept-Ranges, rồi size —
 * để reasons luôn chỉ ra đúng rào cản đầu tiên gặp phải.
 */
export function resolveRangeGopFetch(
  input: RangeGopInput,
  lookup?: I18nLookup,
): RangeGopDecision {
  const reasons: string[] = [];
  if (input.moovPosition === "trailing") {
    reasons.push(
      trKey(
        lookup,
        "gop.gate.moovTrailing",
        {},
        "moov-trailing: moov ở cuối file, cần probe đuôi chưa cài đặt",
      ),
    );
    return { mode: "full-file", eligible: false, reasons };
  }
  if (input.moovPosition !== "faststart") {
    reasons.push(
      trKey(
        lookup,
        "gop.gate.moovUnknown",
        {},
        "moov-unknown: chưa xác định được vị trí moov từ tiền tố đã đọc",
      ),
    );
    return { mode: "full-file", eligible: false, reasons };
  }
  // Đợt 49 E2 — dùng đúng luật rangeSupportEstablished: header "bytes"
  // thì đủ; header khẳng định khác thì chặn (dù đã có probe 206);
  // header vắng thì chỉ qua khi đã có bằng chứng 206 kiểm chứng.
  // Lý do fallback giữ nguyên chuỗi cũ cho 2 trường hợp cũ để test
  // khóa U2/T3 không đổi ý nghĩa; trường hợp mới chỉ xuất hiện ở
  // nhánh thành công (ghi rõ nguồn bằng chứng trong reason).
  if (typeof input.acceptRanges === "string" && !acceptsByteRanges(input.acceptRanges)) {
    reasons.push(
      trKey(
        lookup,
        "gop.gate.acceptRangesUnsupported",
        { acceptRanges: input.acceptRanges.trim() },
        `accept-ranges-unsupported: server báo ${input.acceptRanges.trim()}`,
      ),
    );
    return { mode: "full-file", eligible: false, reasons };
  }
  if (
    !rangeSupportEstablished(
      input.acceptRanges,
      input.rangeProvenByVerifiedProbe ?? false,
    )
  ) {
    reasons.push(
      trKey(
        lookup,
        "gop.gate.acceptRangesUnknown",
        {},
        "accept-ranges-unknown: server không gửi Accept-Ranges, không giả định",
      ),
    );
    return { mode: "full-file", eligible: false, reasons };
  }
  if (!validSize(input.knownSizeBytes)) {
    reasons.push(
      trKey(
        lookup,
        "gop.gate.sizeUnknown",
        {},
        "size-unknown: chưa biết tổng kích thước file",
      ),
    );
    return { mode: "full-file", eligible: false, reasons };
  }
  const rangeEvidence =
    typeof input.acceptRanges === "string"
      ? "Accept-Ranges bytes"
      : trKey(
          lookup,
          "gop.gate.rangeEvidenceProbe",
          {},
          "Range đã chứng minh bằng probe/prefix 206 (không có header Accept-Ranges)",
        );
  reasons.push(
    trKey(
      lookup,
      "gop.gate.rangeGopAttempt",
      { evidence: rangeEvidence },
      `range-gop-attempt: moov-trước + ${rangeEvidence} + đã biết size`,
    ),
  );
  return { mode: "range-gop-attempt", eligible: true, reasons };
}

/**
 * Quét các box top-level trong tiền tố file đã đọc để xác định vị trí
 * moov so với mdat. Chỉ đọc header box (size 32-bit, size==1 thì
 * largesize 64-bit, size==0 thì box kéo tới hết tiền tố); gặp box
 * cắt dở ở cuối tiền tố thì dừng và kết luận theo những gì đã thấy.
 * - moov trước mdat -> "faststart".
 * - mdat trước moov -> "trailing".
 * - không thấy moov (chỉ thấy mdat, hoặc tiền tố quá ngắn) -> "unknown"
 *   (moov có thể nằm ngoài tiền tố — không đoán).
 * - không thấy cả hai -> "unknown".
 */
export function detectMoovPosition(prefix: Uint8Array): MoovPosition {
  const view = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
  let off = 0;
  let seenMoov = false;
  let seenMdat = false;
  while (off + 8 <= prefix.length) {
    let size = view.getUint32(off);
    const type = String.fromCharCode(
      view.getUint8(off + 4),
      view.getUint8(off + 5),
      view.getUint8(off + 6),
      view.getUint8(off + 7),
    );
    let header = 8;
    if (size === 1) {
      if (off + 16 > prefix.length) break;
      const big = view.getBigUint64(off + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      size = prefix.length - off;
    }
    if (size < header || off + size > prefix.length) break;
    if (type === "moov") {
      if (seenMdat) return "trailing";
      seenMoov = true;
    } else if (type === "mdat") {
      if (seenMoov) return "faststart";
      seenMdat = true;
    }
    off += size;
  }
  if (seenMoov && !seenMdat) return "faststart";
  return "unknown";
}

export type ContentRange = {
  start: number;
  end: number;
  total: number;
};

/**
 * Parse header Content-Range dạng "bytes <start>-<end>/<total>".
 * Trả null cho mọi dạng khác (kể cả "bytes *\/<total>" — không biết
 * range nên không thể xác nhận khớp request).
 */
export function parseContentRange(
  header: string | null | undefined,
): ContentRange | null {
  if (typeof header !== "string") return null;
  const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(header.trim());
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2]);
  const total = Number(m[3]);
  if (!(start <= end) || !(end < total)) return null;
  return { start, end, total };
}

export type RangeProbeCheck = {
  outcome: "range-ok" | "fallback-full-file";
  reason: string;
};

/**
 * Kiểm chứng lần Range đầu tiên: chỉ 206 + Content-Range khớp ĐÚNG
 * range đã xin (start, end) và khớp tổng đã biết (nếu tổng đã biết)
 * mới được tiếp tục dùng Range. 200 (server phớt lờ Range), 206 lệch
 * range, 416, hay thiếu Content-Range đều fallback về tải toàn file.
 */
export function checkRangeProbeResponse(
  status: number,
  contentRangeHeader: string | null | undefined,
  requested: { start: number; end: number },
  knownTotalBytes?: number | null,
  lookup?: I18nLookup,
): RangeProbeCheck {
  if (status !== 206) {
    return {
      outcome: "fallback-full-file",
      reason: trKey(
        lookup,
        "gop.probe.statusNot206",
        { status: String(status) },
        `range-probe-status-${status}: server không trả 206 cho request Range`,
      ),
    };
  }
  const parsed = parseContentRange(contentRangeHeader);
  if (!parsed) {
    return {
      outcome: "fallback-full-file",
      reason: trKey(
        lookup,
        "gop.probe.noContentRange",
        {},
        "range-probe-no-content-range: 206 nhưng thiếu Content-Range hợp lệ",
      ),
    };
  }
  if (parsed.start !== requested.start || parsed.end !== requested.end) {
    return {
      outcome: "fallback-full-file",
      reason: trKey(
        lookup,
        "gop.probe.mismatch",
        {
          start: String(parsed.start),
          end: String(parsed.end),
          reqStart: String(requested.start),
          reqEnd: String(requested.end),
        },
        `range-probe-mismatch: server trả ${parsed.start}-${parsed.end}, đã xin ${requested.start}-${requested.end}`,
      ),
    };
  }
  if (
    typeof knownTotalBytes === "number" &&
    Number.isFinite(knownTotalBytes) &&
    knownTotalBytes > 0 &&
    parsed.total !== knownTotalBytes
  ) {
    return {
      outcome: "fallback-full-file",
      reason: trKey(
        lookup,
        "gop.probe.totalMismatch",
        { total: String(parsed.total), known: String(knownTotalBytes) },
        `range-probe-total-mismatch: Content-Range tổng ${parsed.total}, đã biết ${knownTotalBytes}`,
      ),
    };
  }
  return {
    outcome: "range-ok",
    reason: trKey(
      lookup,
      "gop.probe.ok",
      {},
      "range-probe-ok: 206 khớp range đã xin",
    ),
  };
}

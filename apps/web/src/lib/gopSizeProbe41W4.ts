/**
 * gopSizeProbe41W4.ts — Phát hiện kích thước file proxy khi caller
 * chưa biết size (Phase 9 đợt 41, luồng W4).
 *
 * VẤN ĐỀ (LIMITS đợt 40 V2 §5.2 + đợt 40 §5.4): đường GOP chỉ kích
 * hoạt khi đã biết size TRƯỚC cửa sổ đầu tiên. Proxy tạo bằng bridge
 * cũ không trả `proxySizeBytes` nên `knownSizeBytesForPreview` trả
 * undefined → wiring trả off → controller đi đường full-file cũ và
 * không bao giờ thử GOP lại, dù server thật ra vẫn báo size qua
 * HEAD/Range. Module này là cầu nối rẻ nhất cho trường hợp đó: hỏi
 * size trực tiếp từ URL đang phát, TRƯỚC khi quyết wiring, rồi để
 * controller dùng size đó như size đã biết từ đầu.
 *
 * THỨ TỰ PROBE (rẻ trước, không đọc body):
 *   1. HEAD: 2xx + `Content-Length` hợp lệ (> 0, hữu hạn) → size,
 *      nguồn `head`. HEAD lỗi / không 2xx / không có length → bước 2.
 *   2. GET Range `bytes=0-0`: chỉ 206 + `Content-Range` parse được
 *      (dùng `parseContentRange` của cổng gate, cùng luật) và
 *      `total > 0` mới nhận → size, nguồn `content-range`. 200
 *      (server phớt Range), 416, Content-Range lệch/không parse →
 *      không nhận. Body (1 byte) không đọc, chỉ hủy best-effort.
 *   3. Cả hai đều hỏng → `{ size: null, source: "unknown" }` kèm lý
 *      do ngắn; caller rơi về đường full-file cũ, KHÔNG throw.
 *
 * CAM KẾT (giống T3 / fetchSingleGopRange):
 * - Không bao giờ throw vì lỗi mạng/server/dạng response; chỉ throw
 *   khi `url` không phải string không rỗng (lỗi lập trình của caller).
 * - Không đọc body file lớn: HEAD không có body; Range 0-0 chỉ xin
 *   1 byte và hủy body ngay sau khi đọc header.
 * - Không tự quyết ngưỡng: chỉ trả size + nguồn; quyết on/off vẫn
 *   thuộc `resolveGopRangeWiring` (32 MiB < size <= 128 MiB, V2).
 *   Size phát hiện được mà vượt trần S4 thì controller khóa fallback
 *   như khi size được truyền trước — probe không bypass cổng nào.
 * - Chi phí: tối đa 2 request nhẹ (HEAD + Range 1 byte) cho mỗi
 *   controller chưa biết size, và chỉ khi caller đã bật GOP. Probe
 *   hỏng thì controller đi full-file cũ; lần cửa sổ sau (khi load cũ
 *   đã hỏng và track vẫn chưa có) sẽ probe lại — đó là nhánh thử lại
 *   có chủ ý theo gợi ý V2 §5.2, không phải spam: khi load cũ thành
 *   công thì track đã có và probe không chạy nữa.
 * - Đợt 42 X4: kết quả probe được T3 dùng lại qua `sharedSizeProbe`
 *   (size + `Accept-Ranges` cùng response) để khỏi HEAD lần nữa — xem
 *   `gopRangeFetch39T3.ts`. Probe này vẫn là module độc lập, không
 *   phụ thuộc T3; chỉ thêm field `acceptRanges` vào kết quả trả về.
 *
 * GIỚI HẠN KẾ THỪA (không giấu): server không hỗ trợ HEAD lẫn Range
 * thì size vẫn chưa biết và GOP vẫn off — đúng, an toàn; Safari /
 * máy thật / fragmented / moov > 16 MiB không thuộc module này (xem
 * LIMITS W4: fragmented đo thật qua bridge, moov > 16 MiB chỉ chứng
 * minh nhánh bằng ngưỡng override, Safari/máy thật chưa đo).
 */

import { parseContentRange } from "./reverseRangeGate38U2";
import type { GopRangeFetchFn, GopRangeResponse } from "./gopRangeFetch39T3";

/** Nguồn của size phát hiện được (để test/harness đọc, không phải UI). */
export type GopSizeProbeSource = "head" | "content-range" | "unknown";

export interface GopSizeProbeResult {
  /** Size byte đã phát hiện, null khi cả hai nhánh đều hỏng. */
  size: number | null;
  source: GopSizeProbeSource;
  /** Lý do ngắn khi source = "unknown" ("" khi đã có size). */
  reason: string;
  /**
   * Đợt 42 X4 — giá trị `Accept-Ranges` server báo trong cùng response
   * đã cho size (HEAD hoặc Range 0-0), null khi response đó không báo.
   * T3 dùng lại field này để khỏi HEAD lần nữa (xem `sharedSizeProbe`
   * của T3); null nghĩa là "chưa biết", T3 vẫn lấy từ header tiền tố
   * như cũ — không phải "server không hỗ trợ Range".
   */
  acceptRanges: string | null;
}

/** Hủy body best-effort (không để body 1 byte / HEAD kẹt lại). */
async function cancelBody(resp: GopRangeResponse): Promise<void> {
  try {
    await resp.body?.cancel();
  } catch {
    /* bỏ qua */
  }
}

function validSize(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/**
 * Phát hiện size của URL bằng HEAD rồi Range 0-0. Không throw vì lỗi
 * mạng/server; chỉ throw khi url sai kiểu (hợp đồng như T3).
 */
export async function discoverSizeBytes(
  url: string,
  fetchImpl: GopRangeFetchFn,
): Promise<GopSizeProbeResult> {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("discoverSizeBytes: url phải là string không rỗng");
  }
  // 1. HEAD: rẻ nhất, không body.
  try {
    const head = await fetchImpl(url, { method: "HEAD" });
    const headAcceptRanges = head.headers.get("accept-ranges");
    if (head.status >= 200 && head.status < 300) {
      const raw = head.headers.get("content-length");
      const n = raw === null ? NaN : Number(raw);
      if (validSize(n)) {
        await cancelBody(head);
        return { size: n, source: "head", reason: "", acceptRanges: headAcceptRanges };
      }
    }
    await cancelBody(head);
  } catch {
    /* HEAD lỗi → thử Range, không chặn */
  }
  // 2. GET Range 0-0: tổng nằm trong Content-Range.
  try {
    const resp = await fetchImpl(url, {
      headers: { Range: "bytes=0-0" },
    });
    if (resp.status !== 206) {
      await cancelBody(resp);
      return {
        size: null,
        source: "unknown",
        acceptRanges: null,
        reason: `size-probe-range-status-${resp.status}: server không trả 206 cho Range 0-0`,
      };
    }
    const parsed = parseContentRange(resp.headers.get("content-range"));
    const rangeAcceptRanges = resp.headers.get("accept-ranges");
    await cancelBody(resp);
    if (!parsed || !validSize(parsed.total)) {
      return {
        size: null,
        source: "unknown",
        acceptRanges: null,
        reason: "size-probe-no-content-range: 206 nhưng thiếu Content-Range tổng hợp lệ",
      };
    }
    return { size: parsed.total, source: "content-range", reason: "", acceptRanges: rangeAcceptRanges };
  } catch (e) {
    return {
      size: null,
      source: "unknown",
      acceptRanges: null,
      reason: `size-probe-exception: ${(e as Error).message}`,
    };
  }
}

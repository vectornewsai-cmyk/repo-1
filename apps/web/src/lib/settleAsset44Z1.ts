// settleAsset44Z1.ts — Phase 9 đợt 44, luồng Z1: ý tưởng MỚI cho nhánh
// thử lại riêng trên đường asset: (nợ mở của đợt 43 Y1 §5.2).
//
// Bối cảnh (đọc docs/PHASE9_ROUND43_Y1_SETTLE_LIMITS.md §3.2 trước khi
// đổi): trên đường asset:, settle-drop CÓ dọn (8/8 attempt qua nhánh
// dọn-ngay), nhưng nhánh thử lại KHÔNG bắt được lần nào. Y1 đã loại
// trừ một nguyên nhân giả: asset KHÔNG hề "chưa sẵn" — rehydrate thật
// ra blob: URL, setup window đã parse xong track trước race. Nguyên
// nhân còn lại, đo được từ số Y1: aim của Y1 chừa quá nhiều frame
// chưa decode lúc tắt (aim chặt: setupCache + prefetchFrames − 20,
// tức tới 20 frame còn lại; aim lỏng: ~50% còn lại) CỘNG với ngắt
// sớm do stall-25ms (decoder output theo burst nên cache đứng yên
// 25 ms không có nghĩa là sắp settle). Trong lúc W2 đường blob chạy
// (232–304 ms, decode CPU tranh với prefetch), số frame còn lại đó
// không kịp settle trước khi W2 kết thúc → settle luôn rơi sau W2
// → nhánh dọn-ngay, không bao giờ vào nhánh thử lại.
//
// Ý tưởng mới của Z1 (KHÔNG nới tiêu chí SUCCESS, KHÔNG đổi luật
// dọn của production — chỉ đổi cách ĐO):
//   1. Aim siêu chặt (ultra-tight): chỉ tắt khi cache đã tới
//      setupCache + prefetchFrames − 3 (tối đa 3 frame còn lại) và
//      KHÔNG ngắt sớm do stall — stall-break của Y1 bị bỏ vì nó là
//      chỗ rò frame còn lại lớn nhất. Biến duy nhất đổi so với Y1
//      là aim, nên kết quả (bắt được / vẫn PARTIAL) quy được về aim.
//   2. Probe asset: TRƯỚC race: chứng minh asset đã sẵn (manifest
//      size == blob size, rehydrate restored == 1, failed == 0,
//      setup window ok) rồi mới chạy race — để một lần thử lại bắt
//      được không thể bị bác là "asset chưa sẵn", và một lần PARTIAL
//      cũng loại trừ được nguyên nhân asset-chưa-sẵn.
//   3. Phân biệt nguyên nhân ở tầng phân loại (diagnostic, KHÔNG
//      phải nhánh production mới): settle trong lúc decode bay thì
//      production chain thử lại (nhánh W1); settle khi asset chưa
//      sẵn (probe fail) thì attempt là INVALID-asset-not-ready,
//      không được tính là PARTIAL hay SUCCESS; settle ngoài hai
//      trường hợp đó mà counter vẫn tăng khớp cache sụt thì mới là
//      PARTIAL-immediate-drop. Production code KHÔNG có nhánh
//      "retry do asset chưa sẵn" — prefetch chỉ bắt đầu sau khi
//      track đã load xong nên settle lúc asset-load bay là không
//      thể xảy ra trên cùng controller; hàm dưới ghi rõ điều này
//      để không ai đọc nhầm diagnostic thành luật production.
//
// Module này thuần (không import browser API), test bằng Node qua
// esbuild bundle --format=esm (xem settleAsset44Z1.test.ts). KHÔNG
// sửa production code nào: reverseWebcodecs.ts, preview.tsx,
// reverseDecodeAheadToggle.ts giữ nguyên.

/** Ngữ cảnh settle tại thời điểm prefetch settle (đọc từ mirror). */
export interface SettleDropContext {
  /** Controller đang bật decode-ahead? (tắt mới xét dọn.) */
  enabled: boolean;
  /** Controller đã dispose? */
  disposed: boolean;
  /** Đang có decode cửa sổ bay (decodePromise != null)? */
  decodeInFlight: boolean;
  /** Scheme của URL controller đang chạy ("asset" = src gốc asset:, */
  /** "blob" = blob: URL sau rehydrate, "http" = đường GOP/HTTP). */
  scheme: "asset" | "blob" | "http" | "other";
  /** Probe asset: trước race đã xác nhận asset sẵn sàng? */
  assetReady: boolean;
}

export type SettleDropBranch =
  | "retry-decode-flight"
  | "immediate"
  | "no-drop";

/**
 * Phân loại nhánh dọn tại thời điểm settle — cùng luật với
 * shouldDropSettledPrefetch (tắt + chưa dispose + không decode bay
 * thì dọn ngay; tắt + decode bay thì hoãn → thử lại), cộng thêm
 * diagnostic asset: assetReady=false thì attempt không hợp lệ để
 * kết luận về nhánh thử lại (xem ghi chú đầu file: đây KHÔNG phải
 * nhánh production, mà là cổng hợp lệ của phép đo).
 */
export function classifySettleDrop(ctx: SettleDropContext): {
  branch: SettleDropBranch;
  /** Lý do đọc được; chứa "asset-not-ready" khi probe fail. */
  reason: string;
  /** Attempt có hợp lệ để kết luận về nhánh thử lại không? */
  validForRetryConclusion: boolean;
} {
  if (ctx.enabled) {
    return {
      branch: "no-drop",
      reason: "enabled: bật lại trước settle nên giữ prefetch",
      validForRetryConclusion: false,
    };
  }
  if (ctx.disposed) {
    return {
      branch: "no-drop",
      reason: "disposed: đã dispose nên không dọn nữa",
      validForRetryConclusion: false,
    };
  }
  if (ctx.decodeInFlight) {
    return {
      branch: "retry-decode-flight",
      reason:
        "decode-flight: settle trong lúc decode cửa sổ bay nên " +
        "production chain thử lại vào decodePromise (nhánh W1)",
      validForRetryConclusion: true,
    };
  }
  if (!ctx.assetReady && (ctx.scheme === "asset" || ctx.scheme === "blob")) {
    return {
      branch: "immediate",
      reason:
        "asset-not-ready: probe asset: trước race fail nên attempt " +
        "không hợp lệ để kết luận về nhánh thử lại (production vẫn " +
        "dọn ngay, nhưng số đo này không được tính)",
      validForRetryConclusion: false,
    };
  }
  return {
    branch: "immediate",
    reason:
      "immediate: settle khi không còn decode bay nên production " +
      "dọn ngay (nhánh dọn-ngay của T4)",
    validForRetryConclusion: true,
  };
}

/**
 * Aim siêu chặt của Z1: số frame cache mục tiêu trước khi tắt.
 * Y1 aim chặt = setupCache + prefetchFrames − 20 (tới 20 frame còn
 * lại); Z1 = setupCache + prefetchFrames − maxRemaining (mặc định
 * 3). prefetchFrames <= 0 thì trả setupCache (không aim mù).
 */
export function ultraTightAimTarget(
  setupCache: number,
  prefetchFrames: number,
  maxRemaining = 3,
): number {
  if (prefetchFrames <= 0) return setupCache;
  return setupCache + Math.max(0, prefetchFrames - maxRemaining);
}

/** Số frame còn lại tối đa lúc tắt theo từng chiến lược aim. */
export function y1AimRemainingFrames(
  strategy: "tight" | "loose-half" | "ultra",
  prefetchFrames: number,
): number {
  if (strategy === "tight") return 20;
  if (strategy === "loose-half") return Math.ceil(prefetchFrames / 2);
  return 3;
}

/** Kết quả probe asset: trước race (đo trong harness headed). */
export interface AssetProbeInput {
  /** Size manifest trong AssetStore (byte). */
  manifestSize: number | null;
  /** Size blob thực tế sau rehydrate (byte). */
  blobSize: number | null;
  /** Số src restore thành công (kỳ vọng 1). */
  restoredCount: number;
  /** Số src restore thất bại (kỳ vọng 0). */
  failedCount: number;
  /** Cửa sổ setup trên controller blob: đã decode ok? */
  setupOk: boolean;
  /** gopMode quan sát được trên controller blob (chỉ ghi nhận). */
  gopMode: string | null;
  /** Lý do fallback quan sát được (chỉ ghi nhận). */
  fallbackReason: string | null;
}

/**
 * Probe asset: đã sẵn sàng để chạy race chưa? Sẵn sàng = blob đúng
 * size manifest + restore đúng 1 src, không failed + setup window
 * decode ok. gopMode/fallbackReason chỉ là quan sát (đường asset:
 * kỳ vọng full-file-fallback vì blob: không gửi Accept-Ranges —
 * Y1 §3.2 — nhưng fallback không phải điều kiện sẵn sàng: asset
 * sẵn sàng ngay cả khi gate quyết khác, miễn là setup decode ok).
 */
export function probeAssetReadiness(p: AssetProbeInput): {
  ready: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (p.manifestSize === null || p.blobSize === null) {
    reasons.push("size-unknown: chưa biết manifest size hoặc blob size");
  } else if (p.manifestSize !== p.blobSize) {
    reasons.push(
      `size-mismatch: manifest ${p.manifestSize} != blob ${p.blobSize}`,
    );
  }
  if (p.restoredCount !== 1) {
    reasons.push(`restored!=1: restoredCount=${p.restoredCount}`);
  }
  if (p.failedCount !== 0) {
    reasons.push(`failed!=0: failedCount=${p.failedCount}`);
  }
  if (!p.setupOk) reasons.push("setup-failed: cửa sổ setup không decode ok");
  return { ready: reasons.length === 0, reasons };
}

/** Một mẫu trace mirror (cùng trường Y1 dùng để phân loại). */
export interface SettleTraceSample {
  /** ms kể từ lúc tắt + khởi động W2. */
  t: number;
  /** Số cửa sổ prefetch đang bay (0 = đã settle). */
  inFlight: number;
  /** Counter settledPrefetchDropped. */
  settled: number;
  /** Decode cửa sổ đang bay? */
  winInFlight: boolean;
  /** Số frame trong cache. */
  cache: number;
  /** Số frame prefetch còn báo (0 = đã dọn xong). */
  prefetch: number;
  /** uiStatus mirror ("off" khi đã tắt xong). */
  ui: string;
}

/**
 * Phân loại attempt từ trace — khóa tiêu chí SUCCESS của Y1 ở tầng
 * thuần để không ai nới lỏng lén: SUCCESS chỉ khi mẫu settle có
 * winInFlight=true + counter chưa tăng + cache không sụt, VÀ mẫu
 * cuối có counter tăng >= 1 + cache sụt đúng bằng delta + ui off +
 * prefetch 0. Settle sau khi W2 kết thúc mà counter vẫn tăng khớp
 * cache sụt là PARTIAL-immediate-drop (dọn có thật, không phải
 * nhánh thử lại). Mọi trường hợp khác là INVALID.
 */
export function classifyTraceAttempt(
  trace: SettleTraceSample[],
): { cls: string; detail: string } {
  const settleIdx = trace.findIndex(
    (s, i) => i > 0 && s.inFlight === 0 && trace[i - 1].inFlight >= 1,
  );
  if (settleIdx < 0) {
    return {
      cls: "INVALID-no-settle",
      detail: `không tìm thấy chuyển inFlight 1→0 trong ${trace.length} mẫu`,
    };
  }
  const ss = trace[settleIdx];
  const prev = trace[settleIdx - 1];
  const finalS = trace[trace.length - 1];
  const deferredHere =
    ss.winInFlight === true &&
    ss.settled === prev.settled &&
    ss.cache >= prev.cache;
  const settledDelta = finalS.settled - ss.settled;
  const cacheDrop = ss.cache - finalS.cache;
  if (
    deferredHere &&
    finalS.winInFlight === false &&
    settledDelta >= 1 &&
    cacheDrop === settledDelta &&
    finalS.ui === "off" &&
    finalS.prefetch === 0
  ) {
    return {
      cls: "SUCCESS",
      detail:
        `settle +${ss.t} ms winInFlight=true settled ${prev.settled}→${ss.settled} ` +
        `cache ${prev.cache}→${ss.cache}; cuối +${finalS.t} ms settled=${finalS.settled} ` +
        `(delta=${settledDelta}) cache=${finalS.cache} (sụt=${cacheDrop}) ui=off prefetch=0`,
    };
  }
  const immDelta = finalS.settled - prev.settled;
  const immDrop = prev.cache - finalS.cache;
  if (
    !deferredHere &&
    immDelta >= 1 &&
    immDrop === immDelta &&
    finalS.ui === "off"
  ) {
    return {
      cls: "PARTIAL-immediate-drop",
      detail:
        `settle +${ss.t} ms sau W2 (winInFlight=${ss.winInFlight}); counter ` +
        `${prev.settled}→${finalS.settled} (delta=${immDelta}) cache sụt=${immDrop} ` +
        `ui=off — dọn có thật qua nhánh dọn-ngay, không phải thử lại`,
    };
  }
  return {
    cls: `INVALID-${deferredHere ? "final-mismatch" : "not-deferred"}`,
    detail:
      `settle +${ss.t} ms winInFlight=${ss.winInFlight} settled ${prev.settled}→` +
      `${ss.settled} cache ${prev.cache}→${ss.cache}; cuối settled=${finalS.settled} ` +
      `cache=${finalS.cache} ui=${finalS.ui} prefetch=${finalS.prefetch}`,
  };
}

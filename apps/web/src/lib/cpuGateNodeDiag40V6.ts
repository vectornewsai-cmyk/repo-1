// cpuGateNodeDiag40V6.ts — Chẩn đoán RIÊNG tầng Node của cổng CPU
// (Phase 9 đợt 40, luồng V6; chuẩn bị khóa, KHÔNG khóa).
//
// Bối cảnh (docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md §5):
// khung cpuGate39T6.ts có locked:false vì tầng Node trượt cả 2 lần
// hiệu chuẩn under-load (busy ~39,4% lặp lại, ngưỡng >50), trong khi
// tầng CDP phân biệt 3/3. Module này KHÔNG đổi ngưỡng đề xuất, KHÔNG
// đổi evaluateCpuGate, KHÔNG nối vào harness nào, và KHÔNG khóa cổng.
// Nó chỉ tách 2 tiêu chí Node (busy > ngưỡng, idle < ngưỡng) thành
// từng chẩn đoán độc lập, đo được và log được lý do trượt từng tiêu
// chí — để phiên quiet có điều phối sau này quyết định sửa hay loại
// từng tiêu chí dựa trên số của phiên đó, thay vì quyết bằng cảm tính.
//
// Phát hiện của luồng này (không phải bug — xem LIMITS V6 §2):
// chạy lại đúng sampler tầng Node của probe U4 (cdp-cpu-sample.mjs,
// sampleCpuTree) trên máy lúc này cho busy 96,3% / idle 4,5% — tức
// sampler đo đúng khi máy không bị tải nền đè. Số 39,4% của đợt 39
// vì vậy KHÔNG quy được về bug sampler; nó phù hợp với trần tải nền
// (4 vCPU, RAM ~88%, 13 Chrome khác lúc đó), nhưng "phù hợp với" vẫn
// chưa phải bằng chứng — chỉ phiên quiet mới kết luận được. Module
// này vì thế chỉ mô tả HÌNH DẠNG số (vòng nào trượt, chênh bao nhiêu,
// phẳng hay rải), không suy ra nguyên nhân.
//
// Cách dùng trong phiên quiet (quyết định riêng, không tự động):
//   const diag = diagnoseNodeLayer(rounds);
//   // diag.busy.detail / diag.idle.detail là chuỗi lý do để log.
//   // Muốn thử "nếu loại tiêu chí busy thì cổng ra sao": gọi
//   // evaluateGateWithNodeDecision(rounds, { busyEnabled: false }).
//   // Kết quả đó vẫn CHƯA phải quyết định khóa: nó chỉ cho biết cổng
//   // sẽ ra sao NẾU phiên quiet quyết loại tiêu chí đó, và trường
//   // nodeExcluded ghi rõ điều đó để không ai đọc nhầm thành khóa.

// Module này CỐ TÌNH không import cpuGate39T6.ts: file nguồn trong repo
// import không đuôi theo moduleResolution "bundler" (vite), còn test
// chạy bằng node --experimental-strip-types thì không phân giải được
// import không đuôi — import có đuôi .ts lại bị tsc TS5097. Vì vậy
// module này độc lập hoàn toàn (không import gì): interface vòng đo
// trùng cấu trúc với CpuCalibrationRound của T6, và các ngưỡng CDP
// dùng trong hàm kết hợp được ghi tường minh bên dưới + test khóa
// chúng bằng PROPOSED_CPU_GATE (test bị exclude khỏi tsc nên import
// có đuôi .ts được). Nếu T6 đổi ngưỡng đề xuất thì test này sẽ đỏ
// và báo drift — không lặng lẽ lệch.
/** Một vòng hiệu chuẩn (đơn vị: % 1 core — cùng cấu trúc T6). */
export interface CpuCalibrationRound {
  nodeBusy: number;
  nodeIdle: number;
  cdpH1: number;
  cdpH2: number;
}

/** Ngưỡng CDP + số vòng tối thiểu, mirror PROPOSED_CPU_GATE của T6. */
export const CDP_GATE_DEFAULTS = {
  minRounds: 3,
  cdpH2Min: 50,
  cdpH1Max: 20,
  cdpGapMin: 30,
} as const;

/** Cấu hình riêng cho tầng Node. Mặc định = ngưỡng đề xuất của T6. */
export interface NodeGateConfig {
  /** Tắt riêng tiêu chí busy (phiên quiet quyết loại thì đặt false). */
  busyEnabled: boolean;
  /** Tắt riêng tiêu chí idle. */
  idleEnabled: boolean;
  /** Ngưỡng busy: mọi vòng phải > giá trị này (mặc định 50). */
  busyMin: number;
  /** Ngưỡng idle: mọi vòng phải < giá trị này (mặc định 20). */
  idleMax: number;
  /** Số vòng tối thiểu để verdict có nghĩa (mặc định 3). */
  minRounds: number;
}

export const DEFAULT_NODE_GATE_CONFIG: NodeGateConfig = {
  busyEnabled: true,
  idleEnabled: true,
  // Cùng số với PROPOSED_CPU_GATE của T6 (nodeBusyMin 50, nodeIdleMax
  // 20, minRounds 3) — test khóa bằng hằng số gốc, xem đầu file.
  busyMin: 50,
  idleMax: 20,
  minRounds: 3,
};

/** Hình dạng phân tán của một tiêu chí (mô tả, không suy nguyên nhân). */
export type NodePattern =
  | "all-pass"
  | "all-fail-flat"
  | "all-fail-spread"
  | "mixed"
  | "disabled"
  | "no-data";

export interface NodeCriterionDiagnosis {
  /** Tên tiêu chí: "busy" | "idle". */
  name: "busy" | "idle";
  enabled: boolean;
  /** true chỉ khi tiêu chí bật và mọi vòng đều đạt ngưỡng. */
  passed: boolean;
  /** Hình dạng phân tán (xem NodePattern; flat = max-min ≤ 5 điểm %). */
  pattern: NodePattern;
  /** Chỉ số các vòng trượt (0-based, theo thứ tự rounds truyền vào). */
  failingRoundIndices: number[];
  /** Giá trị các vòng trượt, cùng thứ tự với failingRoundIndices. */
  failingValues: number[];
  min: number | null;
  max: number | null;
  median: number | null;
  /** busy: min − ngưỡng (âm khi trượt); idle: ngưỡng − max (âm khi trượt). */
  margin: number | null;
  /** Chuỗi lý do đầy đủ để log (luôn có nội dung, kể cả khi đạt). */
  detail: string;
}

export type NodeLayerVerdict =
  | "pass"
  | "fail-busy"
  | "fail-idle"
  | "fail-both"
  | "disabled"
  | "insufficient-rounds";

export interface NodeLayerDiagnosis {
  config: NodeGateConfig;
  roundCount: number;
  enoughRounds: boolean;
  busy: NodeCriterionDiagnosis;
  idle: NodeCriterionDiagnosis;
  verdict: NodeLayerVerdict;
  /** Lý do verdict (rỗng chỉ khi verdict = pass). */
  reasons: string[];
  /** Tiêu chí nào đang bị tắt (để phiên quiet thấy rõ cổng bỏ qua gì). */
  excluded: Array<"busy" | "idle">;
}

function medianOf(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function diagnoseCriterion(
  name: "busy" | "idle",
  values: number[],
  enabled: boolean,
  threshold: number,
): NodeCriterionDiagnosis {
  if (!enabled) {
    return {
      name,
      enabled: false,
      passed: false,
      pattern: "disabled",
      failingRoundIndices: [],
      failingValues: [],
      min: null,
      max: null,
      median: null,
      margin: null,
      detail: `${name}: ĐÃ TẮT (không xét tiêu chí này — xem excluded)`,
    };
  }
  if (!values.length) {
    return {
      name,
      enabled: true,
      passed: false,
      pattern: "no-data",
      failingRoundIndices: [],
      failingValues: [],
      min: null,
      max: null,
      median: null,
      margin: null,
      detail: `${name}: không có vòng nào để xét`,
    };
  }
  const above = name === "busy"; // busy: phải > ngưỡng; idle: phải < ngưỡng
  const failingRoundIndices: number[] = [];
  const failingValues: number[] = [];
  values.forEach((v, i) => {
    if (above ? !(v > threshold) : !(v < threshold)) {
      failingRoundIndices.push(i);
      failingValues.push(v);
    }
  });
  const min = Math.min(...values);
  const max = Math.max(...values);
  const margin = above ? min - threshold : threshold - max;
  const passed = failingRoundIndices.length === 0;
  const pattern: NodePattern = passed
    ? "all-pass"
    : failingRoundIndices.length === values.length
      ? max - min <= 5
        ? "all-fail-flat"
        : "all-fail-spread"
      : "mixed";
  const op = above ? ">" : "<";
  const detail =
    `${name}: ${passed ? "đạt" : "TRƯỢT"} (${values.length - failingRoundIndices.length}/${values.length} vòng ${op} ${fmt(threshold)}; ` +
    `giá trị ${values.map(fmt).join(", ")}; min ${fmt(min)}, max ${fmt(max)}, ` +
    `median ${fmt(medianOf(values) as number)}, margin ${margin >= 0 ? "+" : ""}${fmt(margin)}` +
    (passed
      ? ""
      : `; vòng trượt [${failingRoundIndices.join(", ")}] = ${failingValues.map(fmt).join(", ")}` +
        (pattern === "all-fail-flat"
          ? " (phẳng: mọi vòng trượt cùng mức, rải ≤ 5 điểm — hình dạng này phù hợp với trần tải nền nhưng CHƯA chứng minh nguyên nhân)"
          : pattern === "mixed"
            ? " (lẫn: có vòng đạt, có vòng trượt — không phải trần phẳng)"
            : ""));
  return {
    name,
    enabled: true,
    passed,
    pattern,
    failingRoundIndices,
    failingValues,
    min,
    max,
    median: medianOf(values),
    margin,
    detail,
  };
}

/**
 * Chẩn đoán tầng Node độc lập với tầng CDP. Thuần, không I/O.
 * Verdict "insufficient-rounds" lấn át kết quả từng tiêu chí khi chưa
 * đủ vòng — nhưng detail từng tiêu chí vẫn đầy đủ để đọc.
 */
export function diagnoseNodeLayer(
  rounds: readonly CpuCalibrationRound[],
  config: Partial<NodeGateConfig> = {},
): NodeLayerDiagnosis {
  const cfg: NodeGateConfig = { ...DEFAULT_NODE_GATE_CONFIG, ...config };
  const busy = diagnoseCriterion(
    "busy",
    rounds.map((r) => r.nodeBusy),
    cfg.busyEnabled,
    cfg.busyMin,
  );
  const idle = diagnoseCriterion(
    "idle",
    rounds.map((r) => r.nodeIdle),
    cfg.idleEnabled,
    cfg.idleMax,
  );
  const enoughRounds = rounds.length >= cfg.minRounds;
  const excluded: Array<"busy" | "idle"> = [];
  if (!cfg.busyEnabled) excluded.push("busy");
  if (!cfg.idleEnabled) excluded.push("idle");
  const reasons: string[] = [];
  if (!enoughRounds)
    reasons.push(`chỉ ${rounds.length} vòng, cần ≥ ${cfg.minRounds}`);
  if (cfg.busyEnabled && !busy.passed) reasons.push(busy.detail);
  if (cfg.idleEnabled && !idle.passed) reasons.push(idle.detail);
  // Tiêu chí bị tắt KHÔNG tính là trượt: chỉ xét các tiêu chí đang bật.
  const busyOk = !cfg.busyEnabled || busy.passed;
  const idleOk = !cfg.idleEnabled || idle.passed;
  let verdict: NodeLayerVerdict;
  if (!enoughRounds) verdict = "insufficient-rounds";
  else if (excluded.length === 2) verdict = "disabled";
  else if (busyOk && idleOk) verdict = "pass";
  else if (!busyOk && !idleOk) verdict = "fail-both";
  else if (!busyOk) verdict = "fail-busy";
  else verdict = "fail-idle";
  // Khi mọi tiêu chí đều tắt, verdict "disabled" không có lý do trượt.
  if (verdict === "disabled") reasons.length = 0;
  // Khi verdict = pass, reasons phải rỗng (chỉ còn lý do đủ vòng đã đạt).
  if (verdict === "pass") reasons.length = 0;
  return {
    config: cfg,
    roundCount: rounds.length,
    enoughRounds,
    busy,
    idle,
    verdict,
    reasons,
    excluded,
  };
}

export interface GateWithNodeDecision {
  /** Tầng CDP + đủ vòng, cùng tiêu chí evaluateCpuGate gốc (mirror). */
  cdpPass: boolean;
  /** Chẩn đoán tầng Node theo cấu hình truyền vào. */
  node: NodeLayerDiagnosis;
  /** true khi tầng Node bị tắt một phần/toàn phần trong cấu hình. */
  nodeExcluded: boolean;
  /**
   * Cổng sẽ đạt NẾU phiên quiet quyết theo đúng cấu hình Node này.
   * Đây KHÔNG phải quyết định khóa: trường nodeExcluded và note ghi
   * rõ phần nào đã bị bỏ qua, để không ai đọc nhầm thành locked.
   */
  gateableUnderNodeDecision: boolean;
  /** Ghi chú bắt buộc đọc kèm (luôn nêu rõ nodeExcluded). */
  note: string;
  reasons: string[];
}

/**
 * Kết hợp tầng CDP (cùng tiêu chí với evaluateCpuGate gốc: mọi vòng
 * H2 > 50, mọi vòng H1 < 20, gap > 30, đủ vòng — mirror, không thay
 * evaluateCpuGate) với chẩn đoán Node theo cấu hình. Dùng để TRẢ LỜI
 * "nếu loại tiêu chí X thì cổng ra sao" trong phiên quiet — không dùng
 * để khóa cổng từ dữ liệu under-load.
 */
export function evaluateGateWithNodeDecision(
  rounds: readonly CpuCalibrationRound[],
  nodeConfig: Partial<NodeGateConfig> = {},
): GateWithNodeDecision {
  const cdpPass =
    rounds.length >= CDP_GATE_DEFAULTS.minRounds &&
    rounds.length > 0 &&
    rounds.every((r) => r.cdpH2 > CDP_GATE_DEFAULTS.cdpH2Min) &&
    rounds.every((r) => r.cdpH1 < CDP_GATE_DEFAULTS.cdpH1Max) &&
    Math.min(...rounds.map((r) => r.cdpH2)) -
      Math.max(...rounds.map((r) => r.cdpH1)) >
      CDP_GATE_DEFAULTS.cdpGapMin;
  const node = diagnoseNodeLayer(rounds, nodeConfig);
  const nodeExcluded = node.excluded.length > 0;
  const nodeOk =
    node.verdict === "pass" ||
    (node.verdict === "disabled" && nodeExcluded);
  const gateableUnderNodeDecision =
    cdpPass && node.enoughRounds && nodeOk;
  const reasons: string[] = [];
  if (!cdpPass) reasons.push("tầng CDP chưa đạt hoặc chưa đủ vòng (theo evaluateCpuGate gốc)");
  if (!node.enoughRounds) reasons.push(`tầng Node: chỉ ${node.roundCount} vòng, cần ≥ ${node.config.minRounds}`);
  if (node.verdict !== "pass" && node.verdict !== "disabled")
    reasons.push(...node.reasons);
  const note = nodeExcluded
    ? `CHƯA KHÓA: kết quả này loại tiêu chí Node [${node.excluded.join(", ")}] khỏi cổng theo cấu hình thử — chỉ phiên quiet có điều phối mới được quyết loại thật và khóa.`
    : `CHƯA KHÓA: kết quả này xét đủ cả 2 tiêu chí Node — chỉ phiên quiet có điều phối mới được quyết khóa.`;
  return {
    cdpPass,
    node,
    nodeExcluded,
    gateableUnderNodeDecision,
    note,
    reasons,
  };
}

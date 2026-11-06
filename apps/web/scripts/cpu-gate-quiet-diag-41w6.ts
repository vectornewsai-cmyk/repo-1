// cpu-gate-quiet-diag-41w6.ts — Helper chẩn đoán cho runner quiet W6.
// Chạy bằng Node type-stripping (không qua tsc — xem cuối file):
//   node --experimental-strip-types apps/web/scripts/cpu-gate-quiet-diag-41w6.ts <rounds.json>
// Đọc các vòng probe Node (busy/idle từng vòng) rồi gọi diagnoseNodeLayer
// GỐC của V6 đợt 40 — không copy logic chẩn đoán, không tự đặt ngưỡng.
// Chỉ chẩn đoán tầng Node: cdpH1/cdpH2 để NaN vì diagnoseNodeLayer
// không đọc 2 trường đó; output ghi rõ cdpMeasured:false để không ai
// đem kết quả này đi đánh giá tầng CDP hay khóa cổng. Khóa thật vẫn
// cần phiên U4 đầy đủ (CDP + Node) lúc yên — xem LIMITS W6 §3.
// File này nằm ngoài "src" nên tsconfig (include: ["src"]) không
// type-check nó; import có đuôi .ts theo đúng tiền lệ test V6.
import fs from "node:fs";
import {
  diagnoseNodeLayer,
  type CpuCalibrationRound,
} from "../src/lib/cpuGateNodeDiag40V6.ts";

const roundsFile = process.argv[2];
if (!roundsFile) {
  console.error("usage: cpu-gate-quiet-diag-41w6.ts <rounds.json>");
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(roundsFile, "utf8")) as Array<{
  busyCpuPctOneCore: number;
  idleCpuPctOneCore: number;
}>;
const rounds: CpuCalibrationRound[] = raw.map((r) => ({
  nodeBusy: r.busyCpuPctOneCore,
  nodeIdle: r.idleCpuPctOneCore,
  // KHÔNG ĐO ở runner W6 — NaN cố tình, không phải số 0. diagnoseNodeLayer
  // không đọc 2 trường này; cấm đưa rounds này vào evaluateCpuGate hay
  // evaluateGateWithNodeDecision (2 hàm đó cần CDP thật).
  cdpH1: Number.NaN,
  cdpH2: Number.NaN,
}));
const node = diagnoseNodeLayer(rounds);
console.log(JSON.stringify({ node, cdpMeasured: false }, null, 2));

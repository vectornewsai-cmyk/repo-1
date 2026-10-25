#!/usr/bin/env node
/**
 * markers.test.cjs — Kiểm chứng markers.ts (video-spec) + JS mirror.
 *
 * Cách chạy: node apps/web/scripts/markers.test.cjs
 *  1. Biên dịch packages/video-spec/src/markers.ts bằng tsc ra /tmp (code thật).
 *  2. Import cả bản TS đã biên dịch lẫn mirror markers.js viết tay, chạy cùng
 *     bộ assert lên cả hai (bắt lệch mirror).
 *  3. Round-trip: markers → JSON project → parse → validateMarkers phải sạch
 *     (chứng minh marker survive save/load project JSON).
 *
 * Mã thoát: 0 = tất cả pass, 1 = có lỗi.
 */
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoWeb = path.resolve(__dirname, ".."); // apps/web
const repoRoot = path.resolve(repoWeb, "..", ".."); // repo root
const outDir = path.join(os.tmpdir(), "markers-test");
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`✅ PASS ${name}`);
  else {
    console.log(`❌ FAIL ${name}${detail ? " — " + detail : ""}`);
    failures++;
  }
}

function runSuite(tag, m) {
  console.log(`--- suite: ${tag} ---`);
  const { validateMarkers, addMarkerToList, removeMarkerFromList, updateMarkerInList, nearestMarkerBefore } = m;

  check(`${tag}: undefined hợp lệ`, validateMarkers(undefined).length === 0);
  check(`${tag}: mảng rỗng hợp lệ`, validateMarkers([]).length === 0);
  check(
    `${tag}: marker hợp lệ`,
    validateMarkers([{ id: "m1", time: 0, label: "Intro", color: "#f43f5e" }]).length === 0,
  );
  check(
    `${tag}: id trùng bị bắt`,
    validateMarkers([{ id: "m1", time: 1 }, { id: "m1", time: 2 }]).some((e) => e.includes("trùng")),
  );
  check(
    `${tag}: time âm bị bắt`,
    validateMarkers([{ id: "m1", time: -0.5 }]).length === 1,
  );
  check(
    `${tag}: time NaN bị bắt`,
    validateMarkers([{ id: "m1", time: Number.NaN }]).length === 1,
  );
  check(
    `${tag}: không phải mảng bị bắt`,
    validateMarkers({ id: "m1" }).length === 1,
  );
  check(
    `${tag}: label không phải chuỗi bị bắt`,
    validateMarkers([{ id: "m1", time: 0, label: 42 }]).length === 1,
  );

  // add: sắp xếp theo time, không mutate input.
  const base = [{ id: "m1", time: 5 }];
  const added = addMarkerToList(base, { id: "m2", time: 2, label: "Sớm hơn" });
  check(`${tag}: add thành công`, !("error" in added) && added.markers.length === 2);
  check(
    `${tag}: add sắp xếp theo time`,
    !("error" in added) && added.markers[0].id === "m2" && added.markers[1].id === "m1",
  );
  check(`${tag}: add không mutate input`, base.length === 1);
  const dup = addMarkerToList(base, { id: "m1", time: 9 });
  check(`${tag}: add id trùng trả error, giữ nguyên list`, "error" in dup && dup.markers === base);

  // remove / update (hàm thuần).
  const list = [
    { id: "m1", time: 1, label: "A" },
    { id: "m2", time: 3, label: "B" },
  ];
  check(`${tag}: remove đúng id`, removeMarkerFromList(list, "m1").length === 1);
  check(`${tag}: remove id lạ giữ nguyên tham chiếu`, removeMarkerFromList(list, "zz") === list);
  const upd = updateMarkerInList(list, "m2", { label: "B2", color: "#22c55e" });
  check(
    `${tag}: update đổi label + color`,
    upd.find((x) => x.id === "m2").label === "B2" && upd.find((x) => x.id === "m2").color === "#22c55e",
  );
  check(`${tag}: update không mutate input`, list.find((x) => x.id === "m2").label === "B");
  check(`${tag}: update id lạ giữ nguyên tham chiếu`, updateMarkerInList(list, "zz", { label: "x" }) === list);

  // nearestMarkerBefore (seek logic).
  check(`${tag}: nearest trước time`, nearestMarkerBefore(list, 2).id === "m1");
  check(`${tag}: nearest đúng bằng time`, nearestMarkerBefore(list, 3).id === "m2");
  check(`${tag}: nearest trước marker đầu → marker đầu`, nearestMarkerBefore(list, 0).id === "m1");
  check(`${tag}: nearest list rỗng → null`, nearestMarkerBefore([], 5) === null);

  // Round-trip qua project JSON (save/load).
  const spec = { version: "0.2.0", meta: { name: "t", width: 1280, height: 720, fps: 30 }, tracks: [], markers: list };
  const parsed = JSON.parse(JSON.stringify(spec));
  check(
    `${tag}: round-trip JSON giữ nguyên markers`,
    JSON.stringify(parsed.markers) === JSON.stringify(list) && validateMarkers(parsed.markers).length === 0,
  );
  const oldSpec = JSON.parse(JSON.stringify({ ...spec, markers: undefined }));
  check(`${tag}: project cũ không có markers vẫn validate sạch`, validateMarkers(oldSpec.markers).length === 0);
}

(async () => {
  console.log("🔧 Biên dịch markers.ts bằng tsc...");
  execFileSync("npx", ["tsc", path.join(repoRoot, "packages/video-spec/src/markers.ts"),
    "--outDir", outDir, "--module", "nodenext", "--target", "es2022",
    "--moduleResolution", "nodenext", "--strict", "--skipLibCheck",
    "--declaration", "false", "--sourceMap", "false",
  ], { cwd: repoWeb, stdio: "pipe" });
  const fromTs = await import(path.join(outDir, "markers.js"));
  console.log("   OK — đã import markers từ code TS thật.");
  runSuite("ts", fromTs);

  const mirror = await import(path.join(repoRoot, "packages/video-spec/src/markers.js"));
  console.log("   OK — đã import JS mirror.");
  runSuite("js-mirror", mirror);

  // Parity: cùng input → cùng output giữa TS và mirror.
  const input = [{ id: "a", time: 4 }, { id: "b", time: 1 }];
  const rTs = fromTs.addMarkerToList(input, { id: "c", time: 2 });
  const rJs = mirror.addMarkerToList(input, { id: "c", time: 2 });
  check("parity: TS và mirror cho cùng kết quả add", JSON.stringify(rTs) === JSON.stringify(rJs));
  check("parity: TS và mirror cho cùng validate",
    JSON.stringify(fromTs.validateMarkers(input)) === JSON.stringify(mirror.validateMarkers(input)));

  if (failures > 0) {
    console.log(`\n❌ ${failures} test FAIL`);
    process.exit(1);
  }
  console.log("\n✅ Tất cả test markers pass");
})().catch((e) => {
  console.error("❌ Lỗi chạy test:", e);
  process.exit(1);
});

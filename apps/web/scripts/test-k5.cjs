/**
 * K5: test node cho lib/drop.ts (validateDrop) và lib/toast.ts (store).
 * Chạy qua test-k5.sh — script này biên dịch 2 module TS sang CommonJS
 * vào thư mục tạm rồi require. Không đụng React/DOM.
 */
const path = require("path");

const buildDir = process.argv[2];
if (!buildDir) {
  console.error("usage: node test-k5.cjs <build-dir>");
  process.exit(2);
}
const { validateDrop, snapDropTime, dropClipDuration } = require(path.join(buildDir, "drop.js"));
const { pushToast, dismissToast, clearToasts, subscribeToasts } = require(path.join(buildDir, "toast.js"));

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}`);
  }
}

console.log("== validateDrop ==");
const videoTrack = { kind: "video", clips: [{ start: 0, duration: 5 }] };
const lockedTrack = { kind: "video", locked: true, clips: [] };
const audioTrack = { kind: "audio", clips: [] };

check("thả video vào khoảng trống → ok", validateDrop(videoTrack, { kind: "video", duration: 4 }, 6, 30).ok === true);
check("thả ảnh vào track video → ok", validateDrop(videoTrack, { kind: "image", duration: 0 }, 6, 30).ok === true);
check("track khóa → lỗi khóa", validateDrop(lockedTrack, { kind: "video", duration: 4 }, 0, 30).reason.includes("khóa"));
check("thả audio vào track video → lỗi loại", validateDrop(videoTrack, { kind: "audio", duration: 4 }, 6, 30).reason.includes("Không thả được"));
check("thả video vào track audio → lỗi loại", validateDrop(audioTrack, { kind: "video", duration: 4 }, 0, 30).ok === false);
check("thả chồng clip → lỗi chồng", validateDrop(videoTrack, { kind: "video", duration: 4 }, 4, 30).reason.includes("đã có clip"));
check("thả sát mép clip (không chồng) → ok", validateDrop(videoTrack, { kind: "video", duration: 4 }, 5, 30).ok === true);
check("snap về frame: 6.04s @30fps → 6.0333…", Math.abs(snapDropTime(6.04, 30) - 181 / 30) < 1e-9);
check("ảnh mặc định 3s", dropClipDuration({ kind: "image", duration: 0 }) === 3);
check("video ngắn hơn 0.5s → 0.5s", dropClipDuration({ kind: "video", duration: 0.1 }) === 0.5);

console.log("== toast store ==");
clearToasts();
let seen = null;
const unsub = subscribeToasts((list) => {
  seen = list;
});
check("subscribe nhận snapshot rỗng ban đầu", Array.isArray(seen) && seen.length === 0);
const id1 = pushToast("hello", "success");
check("push thêm 1 toast", seen.length === 1 && seen[0].message === "hello" && seen[0].kind === "success");
pushToast("lỗi rồi", "error");
check("push thêm toast thứ 2", seen.length === 2);
dismissToast(id1);
check("dismiss xóa đúng id", seen.length === 1 && seen[0].message === "lỗi rồi");
dismissToast(99999);
check("dismiss id lạ không đổi gì", seen.length === 1);
unsub();
pushToast("sau unsub");
check("unsub rồi không nhận nữa", seen.length === 1);
clearToasts();

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);

#!/usr/bin/env node
/**
 * xvfb-display.mjs — Phase 9 đợt 95, luồng W8 (harness).
 *
 * Lock display Xvfb bằng mkdir nguyên tử (nợ LIMITS gộp đợt 94 §4 mục 8,
 * V7 §6/§9 mục 1): picker cũ của probe89q5 chỉ KIỂM TRA socket rồi mới
 * chọn display — luồng song song khác chiếm display giữa lúc check và lúc
 * spawn → Xvfb fail cả lượt (Chromium GOP250 lần 1, display :194).
 *
 * Cơ chế: mỗi display có một thư mục lock /tmp/vcut-xvfb-lock/X<NNN>.lock
 * chứa file `pid` của tiến trình giữ. mkdir là nguyên tử trên POSIX nên
 * chỉ một tiến trình claim được một display; mọi thao tác check-socket /
 * dọn socket mồ côi / spawn Xvfb đều diễn ra TRONG LÚC giữ lock.
 * Lock được nhả ở cuối lượt (cleanup); lock mồ côi (pid đã chết + không
 * còn Xvfb trên display đó) được thu hồi an toàn khi luồng khác claim.
 *
 * Chỉ dùng cho dải probe Q5 :193–:197 (mặc định). Các script clicktest cũ
 * (46b1/47c1/…) dùng vòng spawn-thử + kiểm tra exitCode nên đã nguyên tử
 * theo cách riêng, không cần đổi. O8 dùng display cố định qua env
 * (:187/:188) nên không dùng module này.
 *
 * Chạy kiểm chứng: node apps/web/scripts/test-xvfb-display-lock.mjs
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";

export const XVFB_DISPLAYS = [":193", ":194", ":195", ":196", ":197"];
export const XVFB_LOCK_ROOT = "/tmp/vcut-xvfb-lock";

const sleepSync = (ms) => {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    execFileSync("sleep", [String(Math.max(1, Math.ceil(ms / 1000)))]);
  }
};

const lockDirOf = (display) => `${XVFB_LOCK_ROOT}/X${display.slice(1)}.lock`;
const sockOf = (display) => `/tmp/.X11-unix/X${display.slice(1)}`;

/** true nếu có Xvfb thật đang chạy trên display này (socket + process). */
export function xvfbAlive(display) {
  if (!fs.existsSync(sockOf(display))) return false;
  try {
    return (
      execFileSync(
        "sh",
        ["-c", `ps -eo args | grep -F "Xvfb ${display} " | grep -v grep | head -1`],
        { encoding: "utf8" },
      )
        .trim().length > 0
    );
  } catch {
    return false;
  }
}

function pidAlive(pid) {
  if (!pid || !Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Thử claim 1 display. Trả về { display, lockDir } nếu giữ được lock,
 * null nếu display đã có chủ (lock còn hiệu lực hoặc Xvfb thật đang chạy).
 * Ném lỗi khi gặp lỗi hệ thống khác (vd EPERM sóng — caller tự retry).
 */
export function tryClaimXvfbDisplay(display) {
  const lockDir = lockDirOf(display);
  try {
    fs.mkdirSync(lockDir);
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    // Lock đã có: chỉ thu hồi khi pid giữ đã chết VÀ không còn Xvfb.
    let stale = false;
    try {
      const pid = Number(fs.readFileSync(`${lockDir}/pid`, "utf8").trim());
      if (!pidAlive(pid) && !xvfbAlive(display)) stale = true;
    } catch {
      // Không đọc được pid (lock dở dang): stale nếu không còn Xvfb.
      if (!xvfbAlive(display)) stale = true;
    }
    if (!stale) return null;
    try {
      fs.rmSync(lockDir, { recursive: true, force: true });
    } catch {
      return null;
    }
    try {
      fs.mkdirSync(lockDir);
    } catch {
      return null; // luồng khác vừa thu hồi trước mình — thua cuộc sạch
    }
  }
  try {
    fs.writeFileSync(`${lockDir}/pid`, String(process.pid));
  } catch {
    /* pid chỉ để thu hồi lock mồ côi — ghi hỏng thì lần sau coi như stale */
  }
  // Đã giữ lock: socket mồ côi thì dọn; Xvfb thật còn chạy thì nhả lock.
  if (fs.existsSync(sockOf(display)) && !xvfbAlive(display)) {
    try {
      fs.unlinkSync(sockOf(display));
    } catch {
      /* best-effort */
    }
  }
  if (xvfbAlive(display)) {
    releaseXvfbDisplay({ display, lockDir });
    return null;
  }
  return { display, lockDir };
}

/**
 * Claim display trống đầu tiên trong danh sách (mặc định :193–:197).
 * Trả về { display, lockDir } hoặc null khi hết display (fail-fast, như
 * picker cũ — không chờ display được nhả). Chỉ retry khi gặp EPERM/EACCES
 * (sóng EPERM làm mkdir /tmp lỗi tạm thời): quét lại tối đa ~60s; hết
 * 60s mà vẫn toàn EPERM thì ném lỗi rõ ràng thay vì trả null gây nhầm
 * là "hết display".
 */
export function claimXvfbDisplay(displays = XVFB_DISPLAYS) {
  fs.mkdirSync(XVFB_LOCK_ROOT, { recursive: true });
  let lastErr = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    lastErr = null;
    let sawEperm = false;
    for (const d of displays) {
      try {
        const got = tryClaimXvfbDisplay(d);
        if (got) return got;
      } catch (e) {
        if (e.code === "EPERM" || e.code === "EACCES") {
          lastErr = e;
          sawEperm = true;
          continue;
        }
        throw e;
      }
    }
    // Không display nào claim được và không có lỗi EPERM → hết display
    // thật (đã có chủ), trả null ngay thay vì chờ 60s rồi "cướp" display
    // vừa được nhả (lỗi thiết kế bản đầu: claim lúc display đang bị giữ
    // phải trả null, không được đợi rồi chiếm sau khi holder nhả).
    if (!sawEperm) return null;
    if (attempt < 29) sleepSync(2000);
  }
  throw new Error(
    `không claim được display Xvfb (${displays.join(" ")}) sau 60s toàn lỗi EPERM: ${lastErr?.message ?? ""}`,
  );
}

/** Nhả lock (chỉ xóa khi pid trong lock vẫn là của mình). */
export function releaseXvfbDisplay(claim) {
  if (!claim || !claim.lockDir) return;
  try {
    const pid = Number(
      fs.readFileSync(`${claim.lockDir}/pid`, "utf8").trim(),
    );
    if (pid !== process.pid) return;
  } catch {
    /* không đọc được pid — vẫn xóa best-effort để khỏi kẹt lock */
  }
  try {
    fs.rmSync(claim.lockDir, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
}

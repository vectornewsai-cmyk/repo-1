#!/usr/bin/env python3
"""T9-187 prototype: RAM sampler with birefnet auto-trigger (DRY-RUN default).

Design per parent decision (p) aggregate 186 (F-186-T9-1):
  - threshold: >=2 CONSECUTIVE samples MemAvailable >= GUARD (6.291.456 kB)
  - separate lock (mkdir atomic) + fire flag per boot (max 1 fire per boot)
  - FORBIDDEN to fire during a T4 attempt window (marker-t4-* present without
    matching attempt-done-*, same boot8, mtime <= 600 s)
  - OFFLINE ONLY in this round: default mode is --dry-run (logs WOULD-FIRE,
    never executes bgremove). Live mode needs BOTH --live AND env
    T9_AUTOTRIGGER_LIVE=1, and is NOT enabled by T9-187 (deploy from round
    188 if offline test passes and parent reviews at section 12.3-187).
  - NEVER runs birefnet itself in this file's tests: the offline harness
    injects a synthetic meminfo provider and a stub fire action.

Usage (sampler loop, 60 s cadence, same log format as sampler.sh):
  python3 sampler-autotrigger.py --round-dir round187-t9 [--dry-run|--live]
Usage (offline test): python3 test-autotrigger-offline.py
"""
import argparse
import datetime
import glob
import os
import subprocess
import sys
import time

GUARD_KB = 6291456          # 6.144 MiB, same as T9 sampler guard
CONSEC_NEEDED = 2           # >=2 consecutive samples >= guard
ATTEMPT_FRESH_S = 600       # marker-t4-* mtime within 600 s = attempt live
LOCK_STALE_S = 3600         # trigger lock older than this = stale, break it
CADENCE_S = 60

HIDDEN = os.path.expanduser(
    "~/workspace/goals/capcut-clone-video-editor/hidden_files")


def now_utc():
    return datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%SZ")


def read_meminfo(path="/proc/meminfo"):
    """Return (avail_kB, balloon_kB or None). Raises on missing fields."""
    avail = balloon = None
    with open(path) as f:
        for line in f:
            if line.startswith("MemAvailable:"):
                avail = int(line.split()[1])
            elif line.startswith("Balloon:"):
                balloon = int(line.split()[1])
    if avail is None:
        raise ValueError("MemAvailable missing in %s" % path)
    return avail, balloon


def current_boot8():
    try:
        with open("/proc/sys/kernel/random/boot_id") as f:
            return f.read().strip()[:8]
    except OSError:
        return "?"


def attempt_in_progress(hidden=HIDDEN, boot8=None, now=None):
    """True iff a T4 attempt is live: marker-t4-<TAG> exists, its
    attempt-done-<TAG> does NOT exist yet, TAG boot8 == current boot8,
    and marker mtime is within ATTEMPT_FRESH_S.

    Stale markers (old boot, or reboot mid-attempt with no attempt-done)
    are ignored so a dead attempt can never ban the trigger forever.
    """
    boot8 = boot8 or current_boot8()
    now = now if now is not None else time.time()
    for marker in glob.glob(os.path.join(hidden, "round*-t4",
                                         "marker-t4-*")):
        tag = os.path.basename(marker)[len("marker-t4-"):]
        tag_boot8 = tag.rsplit("-", 1)[-1]
        if tag_boot8 != boot8:
            continue
        done = os.path.join(os.path.dirname(marker),
                            "attempt-done-" + tag)
        if os.path.exists(done):
            continue
        try:
            age = now - os.path.getmtime(marker)
        except OSError:
            continue
        if age <= ATTEMPT_FRESH_S:
            return True, tag, age
    return False, None, None


class Trigger:
    """Pure decision logic (testable without /proc or the filesystem)."""

    def __init__(self, round_dir, dry_run=True, hidden=HIDDEN,
                 mem_reader=None, boot8_fn=None, fire_fn=None,
                 now_fn=None):
        self.round_dir = round_dir
        self.dry_run = dry_run
        self.hidden = hidden
        self.mem_reader = mem_reader or (lambda: read_meminfo())
        self.boot8_fn = boot8_fn or current_boot8
        self.fire_fn = fire_fn or self._default_fire
        self.now_fn = now_fn or time.time
        self.consec = 0
        self.last_boot8 = None
        self.log_path = os.path.join(round_dir, "birefnet-trigger.log")

    def log(self, line):
        with open(self.log_path, "a") as f:
            f.write("%s %s\n" % (now_utc(), line))
        print(line, flush=True)

    def lock_path(self):
        return os.path.join(self.round_dir, "birefnet-trigger.lock")

    def fired_flag(self, boot8):
        return os.path.join(self.round_dir,
                            "birefnet-fired-%s.flag" % boot8)

    def try_lock(self):
        """Atomic mkdir lock. Returns (ok, reason)."""
        try:
            os.mkdir(self.lock_path())
            with open(os.path.join(self.lock_path(), "owner"), "w") as f:
                f.write("pid=%d ts=%s\n" % (os.getpid(), now_utc()))
            return True, "locked"
        except FileExistsError:
            try:
                age = self.now_fn() - os.path.getmtime(self.lock_path())
            except OSError:
                age = 0
            if age > LOCK_STALE_S:
                try:
                    os.rmdir(self.lock_path())
                except OSError:
                    pass
                return self.try_lock()
            return False, "lock-held-age-%ds" % int(max(0, age))

    def unlock(self):
        try:
            os.remove(os.path.join(self.lock_path(), "owner"))
            os.rmdir(self.lock_path())
        except OSError:
            pass

    def _default_fire(self, avail, boot8):
        """Live fire action (ONLY called when not dry_run)."""
        cmd = [
            os.path.expanduser(
                "~/workspace/repo-1/server/bgremove/.venv/bin/python"),
            os.path.expanduser(
                "~/workspace/repo-1/server/bgremove/bgremove.py"),
            "--input", "FIXTURE-TBD",
            "--output", os.path.join(self.round_dir, "birefnet-out.mov"),
            "--session", "birefnet-general",
        ]
        self.log("FIRE-EXEC cmd=%s" % " ".join(cmd))
        return subprocess.run(cmd, timeout=1800)

    def decide(self, avail, balloon, load1, boot8):
        """One sample. Returns decision string."""
        if boot8 != self.last_boot8:
            self.consec = 0
            self.last_boot8 = boot8
        if avail >= GUARD_KB:
            self.consec += 1
        else:
            self.consec = 0
        if self.consec < CONSEC_NEEDED:
            return "watch consec=%d" % self.consec
        if os.path.exists(self.fired_flag(boot8)):
            return "skip-fired-this-boot consec=%d" % self.consec
        in_att, tag, age = attempt_in_progress(
            self.hidden, boot8, self.now_fn())
        if in_att:
            return ("defer-attempt tag=%s age=%ds consec=%d"
                    % (tag, int(age), self.consec))
        ok, why = self.try_lock()
        if not ok:
            return "skip-%s consec=%d" % (why, self.consec)
        try:
            avail2 = self.mem_reader()[0]
            if avail2 < GUARD_KB:
                return ("abort-guard-dropped avail=%d consec=%d"
                        % (avail2, self.consec))
            if self.dry_run:
                self.log("WOULD-FIRE avail=%d balloon=%s load1=%s "
                         "boot=%s consec=%d (dry-run, no exec)"
                         % (avail, balloon, load1, boot8, self.consec))
                return "would-fire consec=%d" % self.consec
            self.log("FIRE avail=%d boot=%s consec=%d"
                     % (avail, boot8, self.consec))
            self.fire_fn(avail, boot8)
            with open(self.fired_flag(boot8), "w") as f:
                f.write("fired %s avail=%d\n" % (now_utc(), avail))
            return "fired consec=%d" % self.consec
        finally:
            self.unlock()

    def sample_once(self):
        avail, balloon = self.mem_reader()
        with open("/proc/loadavg") as f:
            load1 = f.read().split()[0]
        boot8 = self.boot8_fn()
        d = self.decide(avail, balloon, load1, boot8)
        line = ("%s boot=%s avail_kB=%d balloon_kB=%s load1=%s "
                "trigger=%s" % (now_utc(), boot8, avail, balloon, load1, d))
        with open(os.path.join(self.round_dir, "ram-sampler.log"),
                  "a") as f:
            f.write(line + "\n")
        return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--round-dir", required=True)
    ap.add_argument("--dry-run", action="store_true", default=True)
    ap.add_argument("--live", action="store_true")
    args = ap.parse_args()
    dry = not args.live
    if args.live and os.environ.get("T9_AUTOTRIGGER_LIVE") != "1":
        print("LIVE refused: T9_AUTOTRIGGER_LIVE=1 not set", file=sys.stderr)
        return 2
    os.makedirs(args.round_dir, exist_ok=True)
    t = Trigger(args.round_dir, dry_run=dry)
    print("sampler-autotrigger start dry_run=%s guard=%d consec=%d"
          % (dry, GUARD_KB, CONSEC_NEEDED), flush=True)
    while True:
        try:
            t.sample_once()
        except Exception as e:  # never die on a bad sample
            print("sample-error: %r" % e, flush=True)
        time.sleep(CADENCE_S)


if __name__ == "__main__":
    sys.exit(main())

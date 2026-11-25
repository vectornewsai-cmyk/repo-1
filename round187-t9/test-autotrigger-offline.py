#!/usr/bin/env python3
"""Offline test for sampler-autotrigger.py (T9-187, parent decision (p) 186).

NO real /proc reads, NO real birefnet execution, NO live trigger:
  - synthetic meminfo provider (list of avail values, one per sample)
  - fake T4 marker dirs in a temp hidden_files tree
  - stub fire_fn that records calls (must be 0 calls in dry-run mode)
  - 186 replay: real guard-window values 17:48:05-17:50:05Z
    (6.466.904 / 6.671.932 / 6.384.376 kB) with T4 attempt1 starting
    17:53:23Z (after the window) -> WOULD-FIRE at the 2nd sample.

Run: python3 test-autotrigger-offline.py ; exit 0 iff all cases pass.
"""
import os
import sys
import tempfile
import time

import importlib.util
_spec = importlib.util.spec_from_file_location(
    "sampler_autotrigger",
    os.path.join(os.path.dirname(os.path.abspath(__file__)),
                 "sampler-autotrigger.py"))
sat = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sat)

GUARD = sat.GUARD_KB
PASS = 0
FAIL = 0
FAILED = []


def check(name, cond, extra=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print("  PASS %s %s" % (name, extra))
    else:
        FAIL += 1
        FAILED.append(name)
        print("  FAIL %s %s" % (name, extra))


class Env:
    """One offline scenario: temp round dir + temp hidden tree."""

    def __init__(self, boot8="6f1d9f87"):
        self.tmp = tempfile.TemporaryDirectory()
        self.rdir = os.path.join(self.tmp.name, "round")
        os.makedirs(self.rdir)
        self.hidden = os.path.join(self.tmp.name, "hidden")
        os.makedirs(self.hidden)
        self.boot8 = boot8
        self.fires = []
        self.now = 1795552233.0  # 2026-11-24T20:30:33Z
        self.avail_seq = []
        self.idx = 0

    def mem_reader(self):
        v = self.avail_seq[min(self.idx, len(self.avail_seq) - 1)]
        self.idx += 1
        return (v, 1000)

    def trigger(self, dry_run=True):
        return sat.Trigger(
            self.rdir, dry_run=dry_run, hidden=self.hidden,
            mem_reader=self.mem_reader, boot8_fn=lambda: self.boot8,
            fire_fn=lambda a, b: self.fires.append((a, b)),
            now_fn=lambda: self.now)

    def run_seq(self, seq, dry_run=True):
        self.avail_seq = list(seq)
        self.idx = 0
        t = self.trigger(dry_run=dry_run)
        return [t.decide(v, 1000, "1.00", self.boot8) for v in seq]

    def mark_attempt(self, tag, age_s=60, done=False):
        d = os.path.join(self.hidden, "round187-t4")
        os.makedirs(d, exist_ok=True)
        m = os.path.join(d, "marker-t4-" + tag)
        open(m, "w").close()
        os.utime(m, (self.now - age_s, self.now - age_s))
        if done:
            open(os.path.join(d, "attempt-done-" + tag), "w").close()

    def close(self):
        self.tmp.cleanup()


def main():
    # 1. Single sample >= guard -> no fire.
    e = Env()
    d = e.run_seq([GUARD + 100])
    check("1-single-sample-no-fire", all("would-fire" not in x for x in d)
          and e.fires == [], str(d))
    e.close()

    # 2. Two consecutive >= guard, no attempt, no lock -> WOULD-FIRE (dry).
    e = Env()
    d = e.run_seq([GUARD + 100, GUARD + 200])
    check("2-two-consec-would-fire", "would-fire" in d[-1]
          and e.fires == [], str(d))
    e.close()

    # 3. Two consecutive >= guard DURING attempt -> DEFER, no fire.
    e = Env()
    e.mark_attempt("attempt1-6f1d9f87", age_s=60)
    d = e.run_seq([GUARD + 100, GUARD + 200])
    check("3-defer-during-attempt", "defer-attempt" in d[-1]
          and e.fires == [], str(d))
    e.close()

    # 4. Attempt ends (done appears), guard still >= next sample -> FIRE.
    e = Env()
    e.mark_attempt("attempt1-6f1d9f87", age_s=60)
    e.avail_seq = [GUARD + 300, GUARD + 300, GUARD + 300]
    t = e.trigger()
    d1 = t.decide(GUARD + 100, 1000, "1.00", e.boot8)
    d2 = t.decide(GUARD + 200, 1000, "1.00", e.boot8)
    e.mark_attempt("attempt1-6f1d9f87", age_s=60, done=True)
    d3 = t.decide(GUARD + 300, 1000, "1.00", e.boot8)
    check("4-fire-after-attempt-done", "defer-attempt" in d2
          and "would-fire" in d3 and e.fires == [],
          "%s / %s / %s" % (d1, d2, d3))
    e.close()

    # 5. Lock already held -> skip, no fire.
    e = Env()
    os.mkdir(os.path.join(e.rdir, "birefnet-trigger.lock"))
    d = e.run_seq([GUARD + 100, GUARD + 200])
    check("5-skip-lock-held", "skip-lock-held" in d[-1]
          and e.fires == [], str(d))
    e.close()

    # 6. Already fired this boot -> no re-fire.
    e = Env()
    open(os.path.join(e.rdir, "birefnet-fired-6f1d9f87.flag"), "w").close()
    d = e.run_seq([GUARD + 100, GUARD + 200, GUARD + 300])
    check("6-no-refire-same-boot",
          all("would-fire" not in x for x in d), str(d))
    e.close()

    # 7. Stale marker (old boot) -> NOT an attempt, fire allowed.
    e = Env()
    e.mark_attempt("attempt1-7ea9d047", age_s=60)
    d = e.run_seq([GUARD + 100, GUARD + 200])
    check("7-stale-boot-marker-ignored", "would-fire" in d[-1], str(d))
    e.close()

    # 7b. Stale marker (same boot, mtime > 600 s) -> NOT an attempt.
    e = Env()
    e.mark_attempt("attempt1-6f1d9f87", age_s=3600)
    d = e.run_seq([GUARD + 100, GUARD + 200])
    check("7b-old-marker-ignored", "would-fire" in d[-1], str(d))
    e.close()

    # 8. Dip below guard resets the counter.
    e = Env()
    d = e.run_seq([GUARD + 100, GUARD - 5000, GUARD + 100, GUARD + 200])
    check("8-dip-resets-counter", "would-fire" in d[-1]
          and "would-fire" not in d[2], str(d))
    e.close()

    # 9. Boot change resets the counter.
    e = Env()
    e.avail_seq = [GUARD + 100, GUARD + 100, GUARD + 100]
    t = e.trigger()
    e.avail_seq = [GUARD + 100]
    d1 = t.decide(GUARD + 100, 1000, "1.00", "6f1d9f87")
    d2 = t.decide(GUARD + 100, 1000, "1.00", "912f4a97")
    check("9-boot-change-resets", "would-fire" not in d1
          and "would-fire" not in d2, "%s / %s" % (d1, d2))
    e.close()

    # 10. 186 replay: real window values; attempt1 starts 17:53:23Z,
    #     AFTER the window -> WOULD-FIRE at 2nd sample (17:49:05Z).
    e = Env(boot8="cea79500")
    d = e.run_seq([6466904, 6671932, 6384376])
    check("10-replay-186-fires-at-2nd-sample",
          "would-fire" in d[1] and "would-fire" not in d[0], str(d))
    e.close()

    # 10b. Same replay but with a live attempt marker -> DEFER.
    e = Env(boot8="cea79500")
    e.mark_attempt("attempt1-cea79500", age_s=60)
    d = e.run_seq([6466904, 6671932, 6384376])
    check("10b-replay-186-defer-if-attempt",
          all("would-fire" not in x for x in d)
          and "defer-attempt" in d[1], str(d))
    e.close()

    # 11. Live mode (dry_run=False) calls fire_fn exactly once.
    e = Env()
    d = e.run_seq([GUARD + 100, GUARD + 200], dry_run=False)
    check("11-live-calls-fire-once", len(e.fires) == 1
          and "fired" in d[-1], "%s fires=%s" % (d, e.fires))
    e.close()

    print("OFFLINE: %d PASS, %d FAIL %s" % (PASS, FAIL, FAILED))
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

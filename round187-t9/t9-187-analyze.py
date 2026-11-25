#!/usr/bin/env python3
"""T9-187 analyzer: stats per boot + CEIL runs + RAM bands. Reads ram-sampler-FROZEN.log."""
import sys, re
from collections import defaultdict
from datetime import datetime

CEIL = 6443824
GUARD = 6291456
GATE_A = 1024 * 1024  # kB

path = sys.argv[1] if len(sys.argv) > 1 else "ram-sampler-FROZEN.log"
rows = []
pat = re.compile(r"^(\S+) boot=(\S+) avail_kB=(\d+) balloon_kB=(\d+) load1=([\d.]+) swapfree_kB=(\d+)")
for line in open(path):
    m = pat.match(line.strip())
    if not m:
        print("UNPARSED:", line.strip())
        continue
    ts, boot, av, bal, l1, sf = m.groups()
    rows.append(dict(ts=ts, boot=boot[:8], avail=int(av), bal=int(bal), load=float(l1), sf=int(sf)))

print(f"total samples: {len(rows)}")
print(f"first: {rows[0]['ts']}  last: {rows[-1]['ts']}")
fmt = "%Y-%m-%dT%H:%M:%SZ"
gaps = []
for a, b in zip(rows, rows[1:]):
    d = (datetime.strptime(b['ts'], fmt) - datetime.strptime(a['ts'], fmt)).total_seconds()
    gaps.append((d, a['ts'], b['ts'], a['boot'], b['boot']))
gaps.sort(reverse=True)
print("TOP GAPS (s):")
for d, ta, tb, ba, bb in gaps[:5]:
    print(f"  {d:.0f}s {ta} ({ba}) -> {tb} ({bb})")
by_boot = defaultdict(list)
for r in rows:
    by_boot[r['boot']].append(r)
for boot, rs in by_boot.items():
    avs = [r['avail'] for r in rs]
    n = len(rs)
    mean = sum(avs) / n
    gate = sum(1 for a in avs if a >= GATE_A)
    ceil = sum(1 for r in rs if r['bal'] == CEIL)
    guard = sum(1 for a in avs if a >= GUARD)
    lt512 = sum(1 for a in avs if a < 512000)
    lt300 = sum(1 for a in avs if a < 300000)
    print(f"boot {boot}: n={n} min={min(avs)} max={max(avs)} mean={mean:.1f} "
          f"gateA={gate}/{n} ceil={ceil} guard={guard} load1max={max(r['load'] for r in rs)} "
          f"<512k={lt512} <300k={lt300}")
    print(f"  bal min={min(r['bal'] for r in rs)} max={max(r['bal'] for r in rs)}")
    print(f"  sf first={rs[0]['sf']} last={rs[-1]['sf']}")
avs = [r['avail'] for r in rows]
print(f"ALL: n={len(rows)} min={min(avs)} max={max(avs)} mean={sum(avs)/len(avs):.1f} "
      f"gateA={sum(1 for a in avs if a >= GATE_A)}/{len(rows)} "
      f"ceil={sum(1 for r in rows if r['bal'] == CEIL)} "
      f"guard={sum(1 for a in avs if a >= GUARD)} "
      f"load1max={max(r['load'] for r in rows)} "
      f"<512k={sum(1 for a in avs if a < 512000)} <300k={sum(1 for a in avs if a < 300000)}")
print(f"  min row: {[r for r in rows if r['avail'] == min(avs)]}")
print(f"  max row: {[r for r in rows if r['avail'] == max(avs)]}")
print(f"  weighted mean check: {sum(len(v)*sum(r['avail'] for r in v)/len(v) for v in by_boot.values())/len(rows):.1f}")

print("CEIL RUNS (consecutive bal==CEIL):")
run = []
for r in rows:
    if r['bal'] == CEIL:
        run.append(r)
    else:
        if run:
            print(f"  {run[0]['boot']} {run[0]['ts']}..{run[-1]['ts']} n={len(run)} "
                  f"avail {min(x['avail'] for x in run)}..{max(x['avail'] for x in run)}")
            run = []
if run:
    print(f"  {run[0]['boot']} {run[0]['ts']}..{run[-1]['ts']} n={len(run)} "
          f"avail {min(x['avail'] for x in run)}..{max(x['avail'] for x in run)}  (STILL PINNING at log end)")

print("RAM<512k BANDS:")
run = []
for r in rows:
    if r['avail'] < 512000:
        run.append(r)
    else:
        if run:
            print(f"  {run[0]['boot']} {run[0]['ts']}..{run[-1]['ts']} n={len(run)}")
            run = []
if run:
    print(f"  {run[0]['boot']} {run[0]['ts']}..{run[-1]['ts']} n={len(run)}")

def window(label, t0, t1):
    print(f"{label} {t0}..{t1}:")
    sel = [r for r in rows if t0 <= r['ts'] <= t1]
    print(f"  n={len(sel)} gateA={sum(1 for r in sel if r['avail'] >= GATE_A)} "
          f"ceil={sum(1 for r in sel if r['bal'] == CEIL)} "
          f"load1 {min((r['load'] for r in sel), default=0)}..{max((r['load'] for r in sel), default=0)}")
    for r in sel:
        print(f"  {r['ts']} avail={r['avail']} bal={r['bal']} load1={r['load']}")

window("T0 O8 #109", "2026-11-24T20:58:09Z", "2026-11-24T21:01:19Z")
window("T4 attempt1 #56", "2026-11-24T21:05:39Z", "2026-11-24T21:09:04Z")
window("T8 harness #110", "2026-11-24T21:30:22Z", "2026-11-24T21:45:33Z")
window("T8 O8 #110", "2026-11-24T21:46:15Z", "2026-11-24T21:48:49Z")
window("PRE-attempt1 (truoc cua yen)", "2026-11-24T20:42:42Z", "2026-11-24T21:05:38Z")
window("E-234 span", "2026-11-24T22:01:45Z", "2026-11-24T22:06:45Z")
window("E-235 start", "2026-11-24T22:11:45Z", "2026-11-24T22:15:45Z")

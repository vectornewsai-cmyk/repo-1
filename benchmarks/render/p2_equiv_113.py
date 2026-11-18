#!/usr/bin/env python3
"""P2 (dot 113): B2 — pull TUONG DUONG o arm R8 (khong splice).

Doc JSON do p2_lag_113.py xuat; lay tap req_off spliced tu cac run
control (run co spliced > 0) trong cung JSON; doi chieu cac pull EXACT
co cung req_off trong cac run 0-splice (R8): bao push_lag / residence /
splice_delay / take_bytes_after tung pull + phan phoi residence toan run.

Usage: p2_equiv_113.py <p2_lag_*.json>
  In bang ra stdout.
"""
import sys
import json


def stats(vals):
    if not vals:
        return None
    s = sorted(vals)
    n = len(s)
    return {"n": n, "min": s[0], "max": s[-1],
            "median": s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2,
            "p90": s[min(n - 1, int(n * 0.9))]}


def main():
    d = json.load(open(sys.argv[1]))
    runs = d["runs"]
    ctl_offs = set()
    for r in runs:
        if r.get("spliced"):
            for e in r["spliced"]:
                ctl_offs.add(e["req_off"])
    print(f"control spliced req_offs (n={len(ctl_offs)}): {sorted(ctl_offs)}")
    for r in runs:
        if r.get("spliced"):
            continue
        eq = [e for e in r.get("clean", [])
              if e["req_off"] in ctl_offs and not e.get("dup_logic") and e.get("lag")]
        name = r["log"].split("/")[-1]
        print(f"== {name}: equivalent pulls {len(eq)}")
        for e in eq:
            L = e["lag"]
            print(f"   ms={e['ms']} req_off={e['req_off']} push_lag={L['push_lag']} "
                  f"residence={L['residence']} splice_delay={L['splice_delay']} "
                  f"take_bytes_after={L['take_bytes_after']} adap={L['adap']}")
        res = [e["lag"]["residence"] for e in r.get("clean", [])
               if not e.get("dup_logic") and e.get("lag")]
        print(f"   residence all-clean: {stats(res)}")
        pl = [e["lag"]["push_lag"] for e in r.get("clean", [])
              if not e.get("dup_logic") and e.get("lag")]
        print(f"   push_lag all-clean: {stats(pl)}")
    # Tom tat spliced control de doi chieu
    for r in runs:
        if not r.get("spliced"):
            continue
        name = r["log"].split("/")[-1]
        sp = [e["lag"] for e in r["spliced"] if not e.get("dup_logic") and e.get("lag")]
        print(f"== CONTROL {name}: spliced logic {len(sp)}")
        for k in ("push_lag", "residence", "splice_delay"):
            print(f"   {k}: {stats([x[k] for x in sp])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

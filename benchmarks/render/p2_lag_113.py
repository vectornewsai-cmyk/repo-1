#!/usr/bin/env python3
"""P2 (dot 113): do lag push/take TRUC TIEP tai thoi diem splice tu pull log.

Phuong phap (prereg-p2.md + Addendum A):
- Moi dong PULL phan loai EXACT / SPLICED+delta / OTHER bang 16 byte dau
  cua PULL hex so voi clip tai req_off / req_off+delta (delta 1M/2M/4M/8M),
  nhu n2_recount_112.py. Offset phuc vu O' = req_off (EXACT) hoac
  req_off+delta (SPLICED).
- Moi APUSH/ATAKE duoc gan offset bat dau bang cach khop chuoi byte hex16
  voi clip (bytes.find, toi da 10 ung vien; ghi so ung vien = muc mo ho).
  Range APUSH = [start, start+size); range ATAKE = [start, start+got).
- Overwrite-push: APUSH CHUA O' moi nhat, ms <= T_pull. Take phuc vu:
  ATAKE CHUA O' moi nhat tren CUNG adap, ms trong [t_push, T+10] (uu tien
  ms <= T; neu chi co take sau T thi ghi take_after_pull=true). Neo theo
  TAKE (su kien dua byte vao ring) roi tim push moi nhat truoc take do.
- push_lag = T_pull - t_push; residence = t_take - t_push;
  splice_delay = T_pull - t_take (ghi dung dau).
- Phu: ms tu APUSH/ATAKE gan nhat truoc T tren cung adap (freshness);
  avail tai take phuc vu / overwrite-push; so ACLEAR tren adap toi T;
  so ung vien hex16 cua push/take da chon; take_bytes_after = byte take
  tren cung adap trong (t_take, T] (tu-kiem attribution: neu > wrap ma
  pull van EXACT thi take da chon khong the phuc vu pull nay).
- Pull khong khop du push+take dem rieng theo ly do (no-push / no-take).
- Pull logic: cac dong PULL trung (ms, req_off, served_off) chi tinh 1
  lan trong thong ke lag (vd typefind+qtdemux0 ghi trung); van bao ca
  so dong va so pull logic.
- Chi so sanh ms trong cung pid (dong ho shim monotonic theo process).
  Pid chinh = pid co nhieu dong PULL nhat (WebProcess).

Usage: p2_lag_113.py <clip.mp4> <pull.log> [<pull.log> ...]
  In JSON tong hop ra stdout + tom tat doc duoc ra stderr.
"""
import sys
import json
import re
from bisect import bisect_left, bisect_right

DELTAS = [1048576, 2097152, 4194304, 8388608]
MAX_CAND = 10


def parse_kv(tokens):
    d = {}
    for t in tokens:
        if "=" in t:
            k, v = t.split("=", 1)
            d[k] = v
    return d


def build_index(events):
    """events: [(ms, start, end, hx, ncand, ...)] (da sort theo ms).
    Tra ve dict: by_start {start: [rec, ...] sort theo ms},
    starts (sorted), maxlen, ms_list, prefix_got (chi cho take)."""
    by_start = {}
    maxlen = 0
    for rec in events:
        by_start.setdefault(rec[1], []).append(rec)
        maxlen = max(maxlen, rec[2] - rec[1])
    starts = sorted(by_start)
    return {"by_start": by_start, "starts": starts, "maxlen": maxlen}


def latest_containing(idx, served, t_limit, t_after_allow=0):
    """Take/push chua `served` moi nhat co ms <= t_limit (+ t_after_allow
    neu khong co cai nao <= t_limit). Tra ve (rec, after_flag) hoac None.
    Tim theo start: chi xet start trong [served-maxlen+1, served]."""
    starts = idx["starts"]
    lo = bisect_left(starts, served - idx["maxlen"] + 1)
    hi = bisect_right(starts, served)
    best = None
    best_after = False
    for si in range(lo, hi):
        lst = idx["by_start"][starts[si]]
        # ms list cua start nay (da sort vi events sort theo ms)
        ms_list = [r[0] for r in lst]
        j = bisect_right(ms_list, t_limit) - 1
        # thu take/push moi nhat <= t_limit, roi lui dan neu range khong chua
        for k in range(j, max(j - 3, -1), -1):
            rec = lst[k]
            if rec[1] <= served < rec[2]:
                if best is None or rec[0] > best[0]:
                    best, best_after = rec, False
                break
        if t_after_allow:
            # take som nhat sau t_limit (chi khi chua co best <= t_limit)
            k = bisect_right(ms_list, t_limit)
            if k < len(lst):
                rec = lst[k]
                if rec[0] <= t_limit + t_after_allow and rec[1] <= served < rec[2]:
                    if best is None:
                        best, best_after = rec, True
    return (best, best_after) if best is not None else None


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print("usage: p2_lag_113.py <clip.mp4> <pull.log> [...]", file=sys.stderr)
        return 2
    clip_path = args[0]
    clip = open(clip_path, "rb").read()
    clip_len = len(clip)
    logs = args[1:]
    hex_cache = {}

    def hex_candidates(hx):
        if hx in hex_cache:
            return hex_cache[hx]
        res = []
        if hx and hx != "-" and len(hx) >= 8 and len(hx) % 2 == 0:
            try:
                b = bytes.fromhex(hx)
            except ValueError:
                b = b""
            if b:
                i = clip.find(b)
                while i >= 0 and len(res) < MAX_CAND:
                    res.append(i)
                    i = clip.find(b, i + 1)
        hex_cache[hx] = res
        return res

    def hex_at(off):
        if off < 0 or off + 16 > clip_len:
            return None
        return clip[off:off + 16].hex()

    overall = {"clip": clip_path, "clip_size": clip_len, "runs": []}

    for log_path in logs:
        pulls = []
        apush = {}
        atake = {}
        aclear = {}
        pull_by_pid = {}
        l2q2 = []
        for line in open(log_path, encoding="utf-8", errors="replace"):
            p = line.split()  # split(): token cuoi khong giu '\n' (loi P2-a)
            if not p:
                continue
            kind = p[0]
            if kind == "PULL":
                d = parse_kv(p[1:])
                try:
                    ms = int(p[1])
                    req_off = int(d["req_off"])
                    req_size = int(d["req_size"])
                    flow = int(d["flow"])
                    pid = int(d["pid"])
                except (KeyError, ValueError):
                    continue
                hx = d.get("hex", "-")
                pulls.append({"ms": ms, "pid": pid, "elem": d.get("elem", "?"),
                              "el": d.get("el", "?"), "req_off": req_off,
                              "req_size": req_size, "flow": flow, "hex": hx})
                pull_by_pid[pid] = pull_by_pid.get(pid, 0) + 1
            elif kind == "APUSH":
                d = parse_kv(p[1:])
                try:
                    ms = int(p[1]); pid = int(d["pid"])
                    key = (pid, d["adap"])
                    apush.setdefault(key, []).append(
                        (ms, d.get("hex16", "-"), int(d.get("avail", -1)),
                         int(d.get("size", -1))))
                except (KeyError, ValueError):
                    continue
            elif kind == "ATAKE":
                d = parse_kv(p[1:])
                try:
                    ms = int(p[1]); pid = int(d["pid"])
                    key = (pid, d["adap"])
                    atake.setdefault(key, []).append(
                        (ms, d.get("hex16", "-"), int(d.get("req", -1)),
                         int(d.get("got", -1)), int(d.get("avail", -1))))
                except (KeyError, ValueError):
                    continue
            elif kind == "ACLEAR":
                d = parse_kv(p[1:])
                try:
                    ms = int(p[1]); pid = int(d["pid"])
                    aclear.setdefault((pid, d["adap"]), []).append(ms)
                except (KeyError, ValueError):
                    continue
            elif kind in ("L2Q2", "J2Q2SET"):
                d = parse_kv(p[1:])
                try:
                    l2q2.append({"kind": kind, "ms": int(p[1]),
                                 "pid": int(d["pid"]), "raw": line.strip()})
                except (KeyError, ValueError):
                    continue
        if not pulls:
            overall["runs"].append({"log": log_path, "error": "no PULL lines"})
            continue
        main_pid = max(pull_by_pid, key=pull_by_pid.get)
        pulls = [x for x in pulls if x["pid"] == main_pid]
        pulls.sort(key=lambda r: r["ms"])
        apush_m = {k: sorted(v) for k, v in apush.items() if k[0] == main_pid}
        atake_m = {k: sorted(v) for k, v in atake.items() if k[0] == main_pid}
        aclear_m = {k: sorted(v) for k, v in aclear.items() if k[0] == main_pid}

        def map_push(lst):
            out = []
            for (ms, hx, av, sz) in lst:
                cands = hex_candidates(hx)
                for st in cands:
                    out.append((ms, st, st + sz, hx, len(cands), av, sz))
            return sorted(out)

        def map_take(lst):
            out = []
            for (ms, hx, rq, gt, av) in lst:
                cands = hex_candidates(hx)
                for st in cands:
                    out.append((ms, st, st + gt, hx, len(cands), rq, gt, av))
            return sorted(out)

        push_idx = {k: build_index(map_push(v)) for k, v in apush_m.items()}
        take_idx = {k: build_index(map_take(v)) for k, v in atake_m.items()}
        # Prefix-sum got theo ms cho take_bytes_after (moi adap)
        take_prefix = {}
        for k, lst in atake_m.items():
            ms_list = [r[0] for r in lst]
            pref = [0]
            for r in lst:
                pref.append(pref[-1] + r[3])
            take_prefix[k] = (ms_list, pref)

        res = {"log": log_path, "main_pid": main_pid,
               "n_pull": len(pulls), "n_apush": sum(len(v) for v in apush_m.values()),
               "n_atake": sum(len(v) for v in atake_m.values()),
               "n_aclear": sum(len(v) for v in aclear_m.values()),
               "l2q2": l2q2,
               "spliced": [], "clean": [], "other": [],
               "match_fail": {"spliced_no_push": 0, "spliced_no_take": 0,
                              "clean_no_push": 0, "clean_no_take": 0},
               "spliced_req_offs": []}
        seen_logic = set()
        for pu in pulls:
            hx = pu["hex"]
            if hx == "-" or len(hx) < 32:
                res["other"].append({"ms": pu["ms"], "req_off": pu["req_off"],
                                     "reason": "NODATA"})
                continue
            h16 = hx[:32]
            cls = None
            served = None
            if hex_at(pu["req_off"]) == h16:
                cls, served = "EXACT", pu["req_off"]
            else:
                for dl in DELTAS:
                    if hex_at(pu["req_off"] + dl) == h16:
                        cls, served = f"SPLICED+{dl}", pu["req_off"] + dl
                        break
            if cls is None:
                res["other"].append({"ms": pu["ms"], "req_off": pu["req_off"],
                                     "reason": "OTHER"})
                continue
            is_spliced = cls.startswith("SPLICED")
            logic_key = (pu["ms"], pu["req_off"], served)
            dup = logic_key in seen_logic
            seen_logic.add(logic_key)
            # --- tim (push, take): neo theo take moi nhat chua O' ---
            best = None  # (t_push, t_take, adap, push_rec, take_rec, take_after)
            for (pid, adap), tidx in take_idx.items():
                got = latest_containing(tidx, served, pu["ms"], t_after_allow=10)
                if got is None:
                    continue
                tk, tk_after = got
                pidx = push_idx.get((pid, adap))
                if pidx is None:
                    continue
                gotp = latest_containing(pidx, served, tk[0])
                if gotp is None:
                    continue
                tp, _ = gotp
                cand = (tp[0], tk[0], adap, tp, tk, tk_after)
                if best is None or tk[0] > best[1]:
                    best = cand
            entry = {"ms": pu["ms"], "elem": pu["elem"], "req_off": pu["req_off"],
                     "served_off": served, "class": cls,
                     "req_size": pu["req_size"], "dup_logic": dup}
            if best is None:
                any_take = any(
                    latest_containing(tidx, served, pu["ms"], t_after_allow=10) is not None
                    for tidx in take_idx.values())
                any_push = any(
                    latest_containing(pidx, served, pu["ms"]) is not None
                    for pidx in push_idx.values())
                entry["lag"] = None
                entry["fail"] = "no-take" if not any_take else "no-push"
                key = ("spliced" if is_spliced else "clean") \
                    + ("_no_take" if not any_take else "_no_push")
                res["match_fail"][key] += 1
            else:
                t_push, t_take, adap, tp, tk, tk_after = best
                ms_list, pref = take_prefix[(main_pid, adap)]
                if tk_after:
                    # take xay ra sau pull: chua co byte nao duoc take them
                    # giua t_take va T (t_take > T) — dat 0, khong am.
                    take_bytes_after = 0
                else:
                    i_take = bisect_right(ms_list, t_take)
                    i_pull = bisect_right(ms_list, pu["ms"])
                    take_bytes_after = pref[i_pull] - pref[i_take]
                last_push = None
                for rec in apush_m[(main_pid, adap)]:
                    if rec[0] > pu["ms"]:
                        break
                    last_push = rec[0]
                last_take = None
                for rec in atake_m[(main_pid, adap)]:
                    if rec[0] > pu["ms"]:
                        break
                    last_take = rec[0]
                n_clear = sum(1 for ms in aclear_m.get((main_pid, adap), [])
                              if ms <= pu["ms"])
                entry["lag"] = {
                    "adap": adap,
                    "t_push": t_push, "t_take": t_take,
                    "take_after_pull": tk_after,
                    "push_start": tp[1], "push_size": tp[6],
                    "take_start": tk[1], "take_got": tk[6],
                    "push_hex_candidates": tp[4],
                    "take_hex_candidates": tk[4],
                    "push_lag": pu["ms"] - t_push,
                    "residence": t_take - t_push,
                    "splice_delay": pu["ms"] - t_take,
                    "push_freshness": (pu["ms"] - last_push) if last_push is not None else None,
                    "take_freshness": (pu["ms"] - last_take) if last_take is not None else None,
                    "push_avail": tp[5], "take_avail_before": tk[7],
                    "take_req": tk[5],
                    "n_aclear_before": n_clear,
                    "take_bytes_after": take_bytes_after,
                }
            if is_spliced:
                res["spliced"].append(entry)
                res["spliced_req_offs"].append(pu["req_off"])
            else:
                res["clean"].append(entry)
        overall["runs"].append(res)

    def stats(vals):
        if not vals:
            return None
        s = sorted(vals)
        n = len(s)
        return {"n": n, "min": s[0], "max": s[-1],
                "median": s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2,
                "p90": s[min(n - 1, int(n * 0.9))]}
    for r in overall["runs"]:
        if "error" in r:
            continue
        wrap = 4194304
        for q in r.get("l2q2", []):
            m1 = re.search(r"readback=(\d+)", q["raw"])
            m2 = re.search(r"rb-readback=(\d+)", q["raw"])
            vals = [int(x.group(1)) for x in (m1, m2) if x]
            if vals:
                wrap = max(wrap, max(vals))
        r["wrap_bytes"] = wrap
        for grp in ("spliced", "clean"):
            logic = [e for e in r[grp] if not e.get("dup_logic")]
            lagged = [e["lag"] for e in logic if e.get("lag")]
            r[f"{grp}_logic_total"] = len(logic)
            r[f"{grp}_lag_stats"] = {
                k: stats([x[k] for x in lagged if x[k] is not None])
                for k in ("push_lag", "residence", "splice_delay",
                          "push_freshness", "take_freshness")}
            r[f"{grp}_matched"] = len(lagged)
            r[f"{grp}_total"] = len(r[grp])
            r[f"{grp}_take_after_pull"] = sum(
                1 for x in lagged if x.get("take_after_pull"))
            r[f"{grp}_ambiguous"] = sum(
                1 for x in lagged
                if x.get("push_hex_candidates", 1) > 1
                or x.get("take_hex_candidates", 1) > 1)
            if grp == "clean":
                viol = [e for e in logic
                        if e.get("lag") and e["lag"].get("take_bytes_after", 0) > wrap]
                r["clean_attribution_violations"] = len(viol)
                r["clean_attribution_violation_examples"] = [
                    {"ms": e["ms"], "req_off": e["req_off"],
                     "take_bytes_after": e["lag"]["take_bytes_after"],
                     "push_lag": e["lag"]["push_lag"],
                     "adap": e["lag"]["adap"]} for e in viol[:5]]
            buckets = {"<10ms": 0, "10-100ms": 0, "100-1000ms": 0, ">1000ms": 0}
            for x in lagged:
                v = x["push_lag"]
                if v < 10:
                    buckets["<10ms"] += 1
                elif v < 100:
                    buckets["10-100ms"] += 1
                elif v < 1000:
                    buckets["100-1000ms"] += 1
                else:
                    buckets[">1000ms"] += 1
            r[f"{grp}_push_lag_buckets"] = buckets
    print(json.dumps(overall, indent=1))
    for r in overall["runs"]:
        print(f"== {r['log']}", file=sys.stderr)
        if "error" in r:
            print(f"   ERROR {r['error']}", file=sys.stderr)
            continue
        print(f"   pid={r['main_pid']} pull={r['n_pull']} apush={r['n_apush']} "
              f"atake={r['n_atake']} aclear={r['n_aclear']} "
              f"spliced_lines={len(r['spliced'])} clean_lines={len(r['clean'])} "
              f"other={len(r['other'])}", file=sys.stderr)
        print(f"   match_fail={r['match_fail']} wrap={r.get('wrap_bytes')} "
              f"clean_attr_violations={r.get('clean_attribution_violations')}", file=sys.stderr)
        for grp in ("spliced", "clean"):
            st = r.get(f"{grp}_lag_stats", {})
            print(f"   {grp} logic {r.get(f'{grp}_logic_total')} "
                  f"matched {r.get(f'{grp}_matched')}/{r.get(f'{grp}_total')} lines, "
                  f"take_after_pull={r.get(f'{grp}_take_after_pull')}, "
                  f"ambiguous={r.get(f'{grp}_ambiguous')}, "
                  f"push_lag_buckets={r.get(f'{grp}_push_lag_buckets')}", file=sys.stderr)
            for k, v in st.items():
                print(f"     {k}: {v}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

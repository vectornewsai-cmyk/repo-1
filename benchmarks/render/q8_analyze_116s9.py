#!/usr/bin/env python3
"""q8_analyze_116s9.py — phan tich bufTrace + GST im lang cho R8 dot 115 (copy Q8 dot 114).
Doc: OUT JSON webkit-blob-flaky-116s9-seekpreload.json + pull log shim.
Khong sua production. Chi doc + in bang quyet dinh theo prereg-q8.md.
"""
import json, re, sys, os, statistics

# R8 dot 115: H/OUT qua env (S9_DIR / S9_OUT) — SUA SAU LUOT 1: ban dau H de
# nguyen round114-q8 (copy Q8). Luot 1 phan tich dung vi log R8 da ghi de
# len do (xem LIMITS R8 §0); tu luot 2 H = round116-s9 (hoac round116-s9/rerun).
H = os.environ.get("S9_DIR", "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round116-s9")
OUT = os.environ.get("S9_OUT", "/home/hatch/workspace/repo-1/benchmarks/results/webkit-blob-flaky-116s9-seekpreload.json")

def buf_end(tr):
    return tr["buf"][-1][1] if tr.get("buf") else 0.0

def analyze_buftrace(case):
    """Tra ve dict tom tat bufTrace theo tag."""
    bt = case.get("bufTrace") or []
    out = {"n": len(bt)}
    for tag in ("wait", "playpause"):
        rows = [r for r in bt if r.get("tag") == tag]
        if not rows:
            continue
        ends = [buf_end(r) for r in rows]
        ts = [r["t"] for r in rows]
        # 5 s cuoi cua tag
        last5 = [e for r, e in zip(rows, ends) if r["t"] >= ts[-1] - 5.0] or ends[-50:]
        C = statistics.median(last5)
        flat = max(last5) - min(last5)
        # time-to-ceiling: lan dau dat >= C-0.1 va khong vuot C+0.1 trong >=5 s sau do
        tc = None
        for i, e in enumerate(ends):
            if e >= C - 0.1:
                fut = ends[i:]
                # kiem tra 5 s tiep theo (50 sample @100ms)
                window = fut[:50]
                if window and max(window) <= C + 0.1:
                    tc = ts[i]
                    break
        rs4 = next((r["t"] for r in rows if r.get("rs") == 4), None)
        ns1 = next((r["t"] for r in rows if r.get("ns") == 1), None)
        frames_end = rows[-1].get("frames")
        out[tag] = {"n": len(rows), "C": round(C, 3), "flat5s": round(flat, 3),
                    "Tc": tc, "first_rs4_t": rs4, "first_ns1_t": ns1,
                    "end0": round(ends[0], 3), "endMax": round(max(ends), 3),
                    "frames_end": frames_end,
                    "paused_all": all(r.get("paused") for r in rows)}
    return out

def analyze_evs(case):
    evs = case.get("evs") or []
    sus = [e for e in evs if e["e"] == "suspend"]
    prog = [e for e in evs if e["e"] == "progress"]
    sus_t = sus[0]["t"] if sus else None
    prog_after = [e["t"] for e in prog if sus_t is not None and e["t"] > sus_t + 0.05]
    seek_evs = [e["t"] for e in evs if e["e"] == "seeking"]
    seeked_evs = [e["t"] for e in evs if e["e"] == "seeked"]
    seek_dur = (seeked_evs[0] - seek_evs[0]) if seek_evs and seeked_evs else None
    return {"suspend_t": sus_t, "n_progress": len(prog),
            "progress_after_suspend": prog_after,
            "seek_dur_s": round(seek_dur, 2) if seek_dur is not None else None,
            "n_suspend": len(sus)}

def analyze_pull(name, case=None):
    """Doc pull log shim: cua so im lang + byte push/take adapter blob.
    Im lang CAN THEO PHASE: cua so cho paused = tu sample bufTrace 'wait'/
    'playpause' dau tien toi sample cuoi (page t) -> shim ms qua neo
    wholeFileAPUSH <-> swapMs. Neu khong co bufTrace/neo thi dung cua so
    im lang dai nhat toan run (ghi ro la khong can phase)."""
    p = os.path.join(H, "pull", f"{name}.pull.log")
    if not os.path.exists(p):
        return {"pull_log": "MISSING"}
    evs = []
    for line in open(p, errors="replace"):
        m = re.match(r"(APUSH|ATAKE|PULL|ACLEAR)\s+(\d+)\s", line)
        if m:
            evs.append((m.group(1), int(m.group(2)), line))
    if not evs:
        return {"pull_log": "EMPTY"}
    evs.sort(key=lambda x: x[1])
    kinds = {"APUSH", "ATAKE", "PULL"}
    times = sorted({ms for k, ms, _ in evs if k in kinds and ms >= 300})
    longest = (0, None, None)
    for a, b in zip(times, times[1:]):
        if b - a > longest[0]:
            longest = (b - a, a, b)
    # neo phase: whole-file APUSH <-> swapMs (page t)
    win = None
    if case is not None:
        anchor = None
        for k, ms, line in evs:
            if k == "APUSH" and "size=8182985" in line:
                anchor = ms
                break
        swap_ms = case.get("swapMs")
        bt = case.get("bufTrace") or []
        tags = [r for r in bt if r.get("tag") in ("wait", "playpause")]
        if anchor is not None and swap_ms and tags:
            off = anchor - swap_ms
            w0 = int(tags[0]["t"] * 1000 + off)
            w1 = int(tags[-1]["t"] * 1000 + off)
            inside = [ms for ms in times if w0 <= ms <= w1]
            sils = (0, None, None)
            # R8 dot 115 SUA: tinh ca khoang trong dau cua so (w0 -> event dau)
            # va khoang trong cuoi cua so (event cuoi -> w1). Ban Q8 chi tinh
            # khoang giua 2 event lien tiep nen danh gia THAP im lang khi
            # pipeline dung som trong cua so (vd R8-L1 PAUSED r2: bao 96 ms
            # trong khi that ra im ~19,6 s tu event cuoi toi het cua so).
            bounds = [w0] + inside + [w1]
            for a, b in zip(bounds, bounds[1:]):
                if b - a > sils[0]:
                    sils = (b - a, a, b)
            win = {"tag": tags[0]["tag"], "page_t0": tags[0]["t"], "page_t1": tags[-1]["t"],
                   "shim_w0": w0, "shim_w1": w1, "silence_ms": sils[0],
                   "silence_from_ms": sils[1], "silence_to_ms": sils[2],
                   "n_events_in_win": len(inside)}
    # byte APUSH tren adapter blob (caller libwebkitgtk) truoc ms 2000
    blob_push = 0
    blob_push_n = 0
    for k, ms, line in evs:
        if k == "APUSH" and "libwebkitgtk" in line:
            sm = re.search(r"size=(\d+)", line)
            if sm:
                blob_push += int(sm.group(1))
                blob_push_n += 1
    # event cuoi truoc 20 s + dau sau 20 s (shim ms)
    before = [ms for k, ms, _ in evs if k in kinds and ms <= 20000]
    after = [ms for k, ms, _ in evs if k in kinds and ms > 20000]
    return {"pull_log": "OK", "n_events": len(evs),
            "silence_ms": longest[0], "silence_from_ms": longest[1], "silence_to_ms": longest[2],
            "phase_window": win,
            "blob_push_bytes": blob_push, "blob_push_n": blob_push_n,
            "last_before_20s_ms": max(before) if before else None,
            "first_after_20s_ms": min(after) if after else None}

def main():
    d = json.load(open(OUT))
    cases = d["cases"] if isinstance(d, dict) else d
    print(f"cases: {len(cases)}  env.previewMd5={d.get('env', {}).get('previewMd5')}  shimMd5={d.get('env', {}).get('shimMd5')}")
    for c in cases:
        name = c.get("name")
        print(f"\n=== {name} ===")
        print(f"  variant={c.get('variant')} mode={c.get('mode')} run={c.get('run')} "
              f"preloadWaitMs={c.get('preloadWaitMs')} preloadFull={c.get('preloadFull')} "
              f"seekMs={c.get('seekMs')} seekedOk={c.get('seekedOk')} "
              f"seekImmMs={c.get('seekImmMs')} seekImmOk={c.get('seekImmOk')} "
              f"pauseAtCt={c.get('pauseAtCt')} pauseAtMs={c.get('pauseAtMs')} playPauseFull={c.get('playPauseFull')} "
              f"totalFrames={c.get('totalFrames')} failKind={c.get('failKind')} runError={c.get('runError')}")
        bt = analyze_buftrace(c)
        print(f"  bufTrace: {json.dumps(bt)}")
        print(f"  evs: {json.dumps(analyze_evs(c))}")
        print(f"  pull: {json.dumps(analyze_pull(name, c))}")
        fs = c.get("firstSample")
        if fs:
            print(f"  firstSample: t={fs.get('t')} ct={fs.get('ct')} buf={fs.get('buf')}")

if __name__ == "__main__":
    main()

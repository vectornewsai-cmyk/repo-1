#!/usr/bin/env python3
"""q8_analyze_120t3.py — phan tich bufTrace + GST im lang cho T9 dot 117 (copy S9 dot 116).
Doc: OUT JSON webkit-blob-flaky-120t3-seekpreload*.json + pull log shim.
Khong sua production. Chi doc + in bang quyet dinh theo prereg-q8.md.
"""
import json, re, sys, os, statistics

# R8 dot 115: H/OUT qua env (S9_DIR / S9_OUT) — SUA SAU LUOT 1: ban dau H de
# nguyen round114-q8 (copy Q8). Luot 1 phan tich dung vi log R8 da ghi de
# len do (xem LIMITS R8 §0); tu luot 2 H = round119-t8 (hoac round119-t8/rerun).
H = os.environ.get("S9_DIR", "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t7")
OUT = os.environ.get("S9_OUT", "/home/hatch/workspace/repo-1/benchmarks/results/webkit-blob-flaky-121t7-f2startup.json")

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
    # T8 dot 119 — bar F2 tach hai pha (prereg-t8.md §1):
    # (a) T_startup = loadedmetadata dau - loadstart dau (khoi dong pipeline);
    # (b) T_seek = seeked dau - seeking dau (seek thuan sau metadata).
    ls = [e["t"] for e in evs if e["e"] == "loadstart"]
    lm = [e["t"] for e in evs if e["e"] == "loadedmetadata"]
    t_startup = round(lm[0] - ls[0], 2) if ls and lm else None
    # Metric phu do phan giai ms: T_seek_ms = seekImmMs - (t_loadedmeta - seekMs/1000)*1000.
    # Chi tinh khi loadedmetadata xay ra SAU tSeek0; neu am / truoc tSeek0 -> None
    # (seek chong len startup, khong tach duoc bang metric phu — xem prereg §1).
    t_seek_ms = None
    seek_ms = case.get("seekMs")
    seek_imm = case.get("seekImmMs")
    if seek_ms is not None and seek_imm is not None and lm:
        if lm[0] >= seek_ms / 1000.0:
            v = round(seek_imm - (lm[0] - seek_ms / 1000.0) * 1000)
            t_seek_ms = v if v >= 0 else None
    return {"suspend_t": sus_t, "n_progress": len(prog),
            "progress_after_suspend": prog_after,
            "seek_dur_s": round(seek_dur, 2) if seek_dur is not None else None,
            "n_suspend": len(sus),
            "t_loadstart": ls[0] if ls else None,
            "t_loadedmeta": lm[0] if lm else None,
            "t_seeking": seek_evs[0] if seek_evs else None,
            "t_seeked": seeked_evs[0] if seeked_evs else None,
            "T_startup_s": t_startup, "T_seek_s": round(seek_dur, 2) if seek_dur is not None else None,
            "T_seek_ms": t_seek_ms}

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

def first_ev(evs, name, el=None, src=None):
    for e in evs:
        if e.get("e") != name:
            continue
        if el is not None and e.get("el") != el:
            continue
        if src is not None and e.get("src") != src:
            continue
        return e
    return None

def analyze_phases(case):
    """Phan ra T_startup theo phase (T7 dot 121). Tra ve dict so + nhan xet H3/H4/H5."""
    evs = case.get("evs") or []
    marks = {m.get("name"): m.get("t") for m in (case.get("marks") or [])}
    ls = first_ev(evs, "loadstart")
    lm = first_ev(evs, "loadedmetadata")
    ld = first_ev(evs, "loadeddata")
    cp = first_ev(evs, "canplay")
    sk = first_ev(evs, "seeking")
    sd = first_ev(evs, "seeked")
    out = {}
    out["t_evalStart"] = marks.get("evalStart")
    out["t_videoForDone"] = marks.get("videoForDone")
    out["t_swapMs_s"] = (case.get("swapMs") or 0) / 1000.0 if case.get("swapMs") is not None else None
    out["t_loadstart"] = ls["t"] if ls else None
    out["t_loadstart_el"] = ls.get("el") if ls else None
    out["t_loadstart_src"] = ls.get("src") if ls else None
    out["t_loadedmeta"] = lm["t"] if lm else None
    out["t_loadedmeta_el"] = lm.get("el") if lm else None
    out["t_loadedmeta_src"] = lm.get("src") if lm else None
    out["T_startup_s"] = round(lm["t"] - ls["t"], 3) if ls and lm else None
    out["same_element"] = (ls.get("el") == lm.get("el")) if ls and lm else None
    # T_startup theo tung element (neu ca 2 element deu co cap loadstart/loadedmeta)
    els = sorted({e.get("el") for e in evs if e.get("el")})
    per_el = {}
    for el in els:
        a = first_ev(evs, "loadstart", el=el)
        b = first_ev(evs, "loadedmetadata", el=el)
        if a and b:
            per_el[el] = {"loadstart": a["t"], "loadedmeta": b["t"],
                          "T": round(b["t"] - a["t"], 3), "src_ls": a.get("src"), "src_lm": b.get("src")}
    out["per_element"] = per_el
    # Cac phase truoc/sau T_startup
    if marks.get("videoForDone") is not None and out["t_swapMs_s"] is not None:
        out["phase_videoFor_to_swap_s"] = round(out["t_swapMs_s"] - marks["videoForDone"], 3)
    if ls and marks.get("videoForDone") is not None:
        out["phase_videoFor_to_loadstart_s"] = round(ls["t"] - marks["videoForDone"], 3)
    if ls and out["t_swapMs_s"] is not None:
        out["phase_swap_to_loadstart_s"] = round(ls["t"] - out["t_swapMs_s"], 3)
    if lm and ld:
        out["phase_meta_to_data_s"] = round(ld["t"] - lm["t"], 3)
    if lm and cp:
        out["phase_meta_to_canplay_s"] = round(cp["t"] - lm["t"], 3)
    if lm and case.get("firstRvfcS") is not None:
        out["phase_meta_to_firstFrame_s"] = round(case["firstRvfcS"] - lm["t"], 3)
    out["firstRvfcS"] = case.get("firstRvfcS")
    out["T_seek_s"] = round(sd["t"] - sk["t"], 3) if sk and sd else None
    # Resource timing: fetch c8.mp4 (blob fetch, H3) + bundle
    rt = case.get("resTiming") or []
    fetch = [r for r in rt if r.get("name") == "c8.mp4"]
    out["fetch_c8"] = fetch[0] if fetch else None
    out["navTiming"] = case.get("navTiming")
    return out

def analyze_psi(case):
    """Tom tat sampler PSI trong run (H2). Tra ve mean/max PSI + threadsR + RAM."""
    ss = case.get("psiSamples") or []
    if not ss:
        return {"n": 0}
    psi = [s["psiSomeAvg10"] for s in ss if s.get("psiSomeAvg10") is not None]
    memPsi = [s["psiMemAvg10"] for s in ss if s.get("psiMemAvg10") is not None]
    ioPsi = [s["psiIoAvg10"] for s in ss if s.get("psiIoAvg10") is not None]
    tr = [s["threadsR"] for s in ss if s.get("threadsR") is not None]
    mem = [s["memAvailMB"] for s in ss if s.get("memAvailMB") is not None]
    # Toc do tich luy stall: (total_cuoi - total_dau) / (t_cuoi - t_dau) theo giay.
    # /proc/pressure total don vi MICRO-giay: rate% = delta_us / dt_s / 10000.
    rate = None
    if len(ss) >= 2 and ss[0].get("psiSomeTotal") is not None and ss[-1].get("psiSomeTotal") is not None:
        dt = (ss[-1]["tMs"] - ss[0]["tMs"]) / 1000.0
        if dt > 0:
            rate = round((ss[-1]["psiSomeTotal"] - ss[0]["psiSomeTotal"]) / dt / 10000.0, 2)  # %
    return {"n": len(ss), "psiSomeAvg10_mean": round(sum(psi) / len(psi), 2) if psi else None,
            "psiSomeAvg10_max": max(psi) if psi else None,
            "psiStallRate_pct": rate,
            "psiMemAvg10_mean": round(sum(memPsi) / len(memPsi), 2) if memPsi else None,
            "psiMemAvg10_max": max(memPsi) if memPsi else None,
            "psiIoAvg10_mean": round(sum(ioPsi) / len(ioPsi), 2) if ioPsi else None,
            "psiIoAvg10_max": max(ioPsi) if ioPsi else None,
            "threadsR_max": max(tr) if tr else None,
            "threadsR_mean": round(sum(tr) / len(tr), 1) if tr else None,
            "memAvailMB_min": min(mem) if mem else None,
            "bootAgeSAtStart": case.get("bootAgeSAtStart"),
            "gstRegChanged": case.get("gstRegChanged")}

def analyze_gstlog(name):
    """Doc GST log run: moc registry scan + qtdemux/typefind dau tien (H1, best-effort)."""
    p = os.path.join(H, "gst", f"{name}.log")
    if not os.path.exists(p):
        return {"gst_log": "MISSING"}
    try:
        size = os.path.getsize(p)
    except OSError:
        size = None
    marks = {}
    n_reg = 0
    first_ts = {}
    pat = re.compile(r"^(\d+):(\d\d):(\d\d)\.(\d{9})\s")
    with open(p, errors="replace") as f:
        for line in f:
            m = pat.match(line)
            if not m:
                continue
            ts = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1e9
            low = line.lower()
            if "registry" in low or "regcache" in low or "rescan" in low or "scanning" in low:
                n_reg += 1
                if "reg_first" not in first_ts:
                    first_ts["reg_first"] = round(ts, 3)
                first_ts["reg_last"] = round(ts, 3)
            for key, needle in (("qtdemux", "qtdemux"), ("typefind", "typefind"),
                                ("webkitwebsrc", "webkitwebsrc"), ("playbin", "playbin"),
                                ("decodebin", "decodebin"), ("queue2", "queue2")):
                if needle in low and key not in first_ts:
                    first_ts[key] = round(ts, 3)
            if "pad-added" in low and "pad_added_first" not in first_ts:
                first_ts["pad_added_first"] = round(ts, 3)
    return {"gst_log": "OK", "bytes": size, "n_registry_lines": n_reg,
            "first_ts_s": first_ts}

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
        print(f"  phases: {json.dumps(analyze_phases(c))}")
        print(f"  psi: {json.dumps(analyze_psi(c))}")
        print(f"  gst: {json.dumps(analyze_gstlog(name))}")
        fs = c.get("firstSample")
        if fs:
            print(f"  firstSample: t={fs.get('t')} ct={fs.get('ct')} buf={fs.get('buf')}")

if __name__ == "__main__":
    # T3 dot 130 — unified CLI: chap nhan `tag=path` hoac duong dan tran
    # (ghi de S9_OUT); khong doi so = dung env/mac dinh cu. Chi doi
    # interface, khong doi logic phan tich.
    if len(sys.argv) > 1:
        _a = sys.argv[1]
        _p = _a.split("=", 1)[1] if "=" in _a else _a
        if not _p:
            print("usage: f2_startup_analyze_*.py [tag=]path.json", file=sys.stderr)
            sys.exit(2)
        OUT = _p
    main()

#!/usr/bin/env python3
"""Phân tích gộp E1 deint-FPS — đợt 82 J3.

Đọc c77e1-headed-report.json của mọi lần chạy (I5 + J3), tính:
- mean từng lần, median gộp, mean gộp + CI 95% (t và bootstrap),
  tỉ lệ pass/fail theo lần và theo tỉ lệ đơn lẻ.
- Kiểm giả thuyết baseline rải 10x:
  H-A warmup/thứ tự lần chạy: baseline mean theo thứ tự lần (run 1
    sau reboot có cao hơn hẳn các lần sau?)
  H-B drift-correction / thứ tự slot: tỉ lệ theo chỉ số slot
    (ramp trong lần chạy có làm méo tỉ lệ?)
  H-C trần 30fps: tỉ lệ khi baseline chạm trần fixture (~30fps)
    có bị nén về 1 không?
  H-D lượng tử hoá: số lần vẽ/slot = drawFps*3s; SD tỉ lệ ở lần
    nhanh (nhiều lần vẽ) vs lần chậm (ít lần vẽ).
  H-E loadavg: tương quan loadavg 1-phút vs baseline và vs tỉ lệ.
Dùng: python3 analyze-82j3-deint-fps.py <dir-run-I5> <dir-run-J3> ...
Mỗi dir chứa các headed-run*/c77e1-headed-report.json.
"""
import json, math, os, re, statistics, sys, glob

def load_runs(dirs):
    runs = []
    for d in dirs:
        for jf in sorted(glob.glob(os.path.join(d, "headed-run*", "c77e1-headed-report.json"))):
            try:
                r = json.load(open(jf))
            except Exception as e:
                print(f"SKIP {jf}: {e}"); continue
            runs.append((jf, r))
    return runs

def g5_from_report(r):
    """Trả (baseline_mean, [5 tỉ lệ drift-corrected], pass, total, slot_draw)."""
    slots = r.get("fpsSlots", [])
    draw = [s["drawFps"] for s in slots]
    # tỉ lệ drift-corrected: deint slot / trung bình 2 baseline kề (như harness)
    ratios = []
    for i in (1, 3, 5, 7, 9):
        neigh = []
        if i - 1 >= 0: neigh.append(draw[i-1])
        if i + 1 < len(draw): neigh.append(draw[i+1])
        ratios.append(draw[i] / (sum(neigh)/len(neigh)))
    base = [draw[i] for i in (0, 2, 4, 6, 8, 10)]
    bmean = sum(base)/len(base)
    g5 = next((c for c in r.get("cases", []) if "G5" in c["name"]), None)
    return bmean, ratios, (g5 or {}).get("ok"), r.get("pass"), r.get("total"), draw

def ci_t(vals, conf=0.95):
    n = len(vals); m = statistics.mean(vals)
    if n < 2: return m, (m, m)
    s = statistics.stdev(vals)
    # t 97.5% xấp xỉ (n lớn: 1.96; n nhỏ dùng bảng rút gọn)
    ttab = {2:12.706,3:4.303,4:3.182,5:2.776,6:2.571,7:2.447,8:2.365,9:2.306,
            10:2.262,11:2.228,12:2.201,15:2.131,20:2.086,25:2.060,30:2.042,50:2.009}
    t = ttab.get(n, 1.96 if n >= 60 else 2.0)
    h = t*s/math.sqrt(n)
    return m, (m-h, m+h)

def median_ci_bootstrap(vals, reps=20000, seed=82):
    import random
    rnd = random.Random(seed)
    n = len(vals); meds = []
    for _ in range(reps):
        s = [vals[rnd.randrange(n)] for _ in range(n)]
        meds.append(statistics.median(s))
    meds.sort()
    lo = meds[int(0.025*reps)]; hi = meds[int(0.975*reps)-1]
    return statistics.median(vals), (lo, hi)

def pearson(xs, ys):
    n = len(xs); mx = sum(xs)/n; my = sum(ys)/n
    sx = math.sqrt(sum((x-mx)**2 for x in xs)); sy = math.sqrt(sum((y-my)**2 for y in ys))
    if sx == 0 or sy == 0: return float("nan")
    return sum((x-mx)*(y-my) for x, y in zip(xs, ys))/(sx*sy)

def main():
    dirs = sys.argv[1:]
    runs = load_runs(dirs)
    print(f"Số lần chạy E1 đọc được: {len(runs)}")
    all_ratios, per_run_means, baselines, order = [], [], [], []
    slot_ratios = {1: [], 3: [], 5: [], 7: [], 9: []}
    slot_draws = {i: [] for i in range(11)}
    load_first, load_last = [], []
    for k, (jf, r) in enumerate(runs):
        bmean, ratios, ok, p, t, draw = g5_from_report(r)
        all_ratios += ratios
        per_run_means.append(statistics.mean(ratios))
        baselines.append(bmean)
        order.append(k+1)
        for i, rt in zip((1,3,5,7,9), ratios): slot_ratios[i].append(rt)
        for i, d in enumerate(draw): slot_draws[i].append(d)
        # loadavg đầu/cuối phần FPS: lấy từ slot 0 loadBefore, slot 10 loadAfter
        try:
            load_first.append(float(r["fpsSlots"][0]["loadBefore"].split()[0]))
            load_last.append(float(r["fpsSlots"][-1]["loadAfter"].split()[0]))
        except Exception:
            pass
        print(f"  {os.path.basename(os.path.dirname(jf)):>12} baseline={bmean:6.2f} "
              f"ratios={'/'.join(f'{x:.2f}' for x in ratios)} mean={statistics.mean(ratios):.2f} "
              f"PASS={ok} ({p}/{t})")
    print()
    n = len(all_ratios)
    m, ci = ci_t(all_ratios)
    med, mci = median_ci_bootstrap(all_ratios)
    print(f"TỈ LỆ ĐƠN LẺ gộp: n={n} mean={m:.3f} CI95%=[{ci[0]:.3f}; {ci[1]:.3f}] "
          f"median={med:.3f} CI95% bootstrap=[{mci[0]:.3f}; {mci[1]:.3f}] "
          f"SD={statistics.stdev(all_ratios):.3f} min={min(all_ratios):.2f} max={max(all_ratios):.2f} "
          f"pass(>=0.75)={sum(1 for x in all_ratios if x>=0.75)}/{n}")
    m2, ci2 = ci_t(per_run_means)
    med2, mci2 = median_ci_bootstrap(per_run_means)
    print(f"MEAN TỪNG LẦN: n={len(per_run_means)} mean={m2:.3f} CI95%=[{ci2[0]:.3f}; {ci2[1]:.3f}] "
          f"median={med2:.3f} CI95% bootstrap=[{mci2[0]:.3f}; {mci2[1]:.3f}] "
          f"SD={statistics.stdev(per_run_means):.3f} pass={sum(1 for x in per_run_means if x>=0.75)}/{len(per_run_means)}")
    print(f"BASELINE tuyệt đối: min={min(baselines):.2f} max={max(baselines):.2f} "
          f"tỉ lệ max/min={max(baselines)/min(baselines):.1f}x median={statistics.median(baselines):.2f}")
    print()
    print("H-A warmup/thứ tự lần chạy (baseline theo thứ tự lần):")
    print("  " + "  ".join(f"#{k+1}:{b:.2f}" for k, b in enumerate(baselines)))
    print(f"  Pearson(thứ tự, baseline)={pearson(order, baselines):.2f}; "
          f"lần 1={baselines[0]:.2f} vs median các lần sau={statistics.median(baselines[1:]):.2f} "
          f"(tỉ lệ {baselines[0]/statistics.median(baselines[1:]):.1f}x)")
    print(f"  Pearson(thứ tự, mean từng lần)={pearson(order, per_run_means):.2f}")
    print("H-B thứ tự slot (tỉ lệ theo slot deint — ramp trong lần có méo?):")
    for i in (1,3,5,7,9):
        v = slot_ratios[i]
        print(f"  slot {i}: mean={statistics.mean(v):.3f} median={statistics.median(v):.3f} n={len(v)}")
    print(f"  Pearson(chỉ số slot, tỉ lệ)={pearson([i for i in (1,3,5,7,9) for _ in slot_ratios[i]], [x for i in (1,3,5,7,9) for x in slot_ratios[i]]):.2f}")
    print("H-C trần 30fps (tỉ lệ khi baseline slot kề cao):")
    hi, lo = [], []
    for jf, r in runs:
        _, ratios, _, _, _, draw = g5_from_report(r)
        for j, rt in zip((1,3,5,7,9), ratios):
            neigh = (draw[j-1]+draw[j+1])/2
            (hi if neigh >= 10 else lo).append(rt)
    if hi and lo:
        print(f"  baseline kề >=10fps: n={len(hi)} mean={statistics.mean(hi):.3f} (nén về 1?)")
        print(f"  baseline kề <10fps:  n={len(lo)} mean={statistics.mean(lo):.3f}")
    else:
        print(f"  không đủ dữ liệu 2 nhóm (hi={len(hi)}, lo={len(lo)})")
    print("H-D lượng tử hoá (số lần vẽ/slot = drawFps*3s):")
    for k, (jf, r) in enumerate(runs):
        _, _, _, _, _, draw = g5_from_report(r)
        counts = [round(d*3) for d in draw]
        print(f"  lần {k+1}: draws/slot={counts} (min {min(counts)}, max {max(counts)})")
    # SD tỉ lệ ở lần nhanh vs chậm
    fast = [statistics.pstdev(g5_from_report(r)[1]) for _, r in runs if g5_from_report(r)[0] >= 5]
    slow = [statistics.pstdev(g5_from_report(r)[1]) for _, r in runs if g5_from_report(r)[0] < 5]
    if fast and slow:
        print(f"  SD tỉ lệ trong lần: lần nhanh (baseline>=5) mean SD={statistics.mean(fast):.3f} (n={len(fast)}); "
              f"lần chậm mean SD={statistics.mean(slow):.3f} (n={len(slow)})")
    print("H-E loadavg:")
    if load_first:
        print(f"  load đầu FPS: {['%.1f' % x for x in load_first]}")
        print(f"  Pearson(load đầu, baseline)={pearson(load_first, baselines):.2f}; "
              f"Pearson(load đầu, mean từng lần)={pearson(load_first, per_run_means):.2f}")

if __name__ == "__main__":
    main()

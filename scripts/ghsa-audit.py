#!/usr/bin/env python3
"""Audit CVE npm qua GitHub Advisory Database REST API.

Port tu hidden_files/r77-e5-ghsa-audit.py (dot 77 E5) sang repo, thay duong
dan hardcode bang duong dan tuong doi (REPO = thu muc cha cua scripts/).
Khac biet so voi ban goc:
  - REPO/OUT/SUMMARY/LOG suy tu __file__, khong hardcode ~/workspace.
  - Them tuy chon --only "name@version,..." de kiem lai rieng cac package
    vua bump (mac dinh quet toan bo lockfile).
  - Summary chi dem cac key con co trong lockfile hien tai (ban goc dem
    ca key cu neu file results duoc tai dung sau khi doi version).

Ly do dung GHSA thay vi OSV/npm audit (ket luan dot 77 E5, xem
docs/PHASE9_ROUND77_E5_TTS39_NPM_LIMITS.md §5):
  - OSV querybatch/v1 POST timeout 0 byte o moi chunk size/timeout (7 lan).
  - `npm audit` 403 policy_denied (2 lan); qua registry khac thi ENOLOCK.
  - GitHub Advisory DB REST GET /advisories?ecosystem=npm&affects=<pkg>
    la duong duy nhat chay duoc: dot 77 quet du 447/447 package, tim
    5 advisory / 4 CVE (multer, body-parser, vite, minimatch x2).

Pham vi: TOAN BO package-lock.json (lockfileVersion 3), direct deps truoc,
roi den transitive. Chi dem advisory CHUA withdrawn, co GHSA/CVE id, va
version dang cai nam trong vulnerable_version_range.

Usage:
  python3 scripts/ghsa-audit.py [--only "multer@2.5.0,vite@6.4.5"]
  # chay nen: nohup python3 scripts/ghsa-audit.py > scripts/ghsa-audit/audit.log 2>&1 &
Ket qua: scripts/ghsa-audit/results.json (per-package),
         scripts/ghsa-audit/summary.json
Luau y: quota 60/h khong xac thuc, chia se theo egress IP — script tu doi
theo header X-RateLimit-Reset; chay lai chi khi package-lock.json doi.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO, "scripts", "ghsa-audit")
OUT = os.path.join(OUT_DIR, "results.json")
SUMMARY = os.path.join(OUT_DIR, "summary.json")
LOG = os.path.join(OUT_DIR, "audit.log")
TIMEOUT = 30

os.makedirs(OUT_DIR, exist_ok=True)


def log(m):
    print(m, flush=True)
    with open(LOG, "a") as f:
        f.write(m + "\n")


# ---------- semver range (dang GHSA/OSV) ----------
from packaging.version import Version, InvalidVersion


def _v(s):
    try:
        return Version(s.strip())
    except InvalidVersion:
        return None


def _cmp_ok(ver, op, bound):
    v, b = _v(ver), _v(bound)
    if v is None or b is None:
        return False
    if op in ("=", "==", ""):
        return v == b
    if op == ">":
        return v > b
    if op == ">=":
        return v >= b
    if op == "<":
        return v < b
    if op == "<=":
        return v <= b
    return False


def _expand_caret(tok):
    m = re.match(r"\^(\d+)\.(\d+)\.(\d+)", tok)
    if not m:
        return None
    a, b, c = map(int, m.groups())
    return [(">=", f"{a}.{b}.{c}"), ("<", f"{a + 1}.0.0")]


def _expand_tilde(tok):
    m = re.match(r"~(\d+)\.(\d+)\.(\d+)", tok)
    if not m:
        return None
    a, b, c = map(int, m.groups())
    return [(">=", f"{a}.{b}.{c}"), ("<", f"{a}.{b + 1}.0")]


def satisfies(ver, range_str):
    """range dang '>= 1.0.0, < 2.0.0' hoac '>= 1.0.0 < 2.0.0', '||' OR.
    Parse bang regex tim cap (toan tu, version) vi op va version cach nhau
    khoang trang (tach split() lam vo cap)."""
    if not range_str:
        return False
    for group in range_str.split("||"):
        group = group.replace(",", " ").strip()
        if not group:
            continue
        pairs = re.findall(r"(>=|<=|>|<|=|==|\^|~)?\s*(\d[\w\.\-\+]*)", group)
        if not pairs:
            continue
        ok = True
        for op, bound in pairs:
            op = op or "="
            if op == "^":
                conds = _expand_caret("^" + bound)
                if conds is None or not all(
                        _cmp_ok(ver, o, b) for o, b in conds):
                    ok = False
                    break
            elif op == "~":
                conds = _expand_tilde("~" + bound)
                if conds is None or not all(
                        _cmp_ok(ver, o, b) for o, b in conds):
                    ok = False
                    break
            elif not _cmp_ok(ver, op, bound):
                ok = False
                break
        if ok:
            return True
    return False


# ---------- package list ----------
def load_packages():
    lock = json.load(open(os.path.join(REPO, "package-lock.json")))
    pkgs = lock.get("packages", {})
    pairs = {}
    for path, info in pkgs.items():
        if not path or not info.get("version"):
            continue
        m = re.match(r"(?:.*/)?node_modules/(.+)$", path)
        if not m:
            continue
        name = m.group(1)
        pairs[(name, info["version"])] = True
    # direct deps first
    direct = set()
    for root, _, files in os.walk(REPO):
        if "node_modules" in root or ".git" in root:
            continue
        if "package.json" in files:
            try:
                pj = json.load(open(os.path.join(root, "package.json")))
            except Exception:
                continue
            for sec in ("dependencies", "devDependencies", "peerDependencies",
                        "optionalDependencies"):
                direct.update((pj.get(sec) or {}).keys())
    items = sorted(pairs.keys())
    items.sort(key=lambda nv: (0 if nv[0] in direct else 1, nv[0]))
    return items, direct


def _get_json(url):
    """GET 1 URL, retry toi da 3 lan khi gap 403/429 rate-limit.
    Neu header X-RateLimit-Reset co thi doi toi gio reset (+5s, toi da 3600s);
    neu khong thi doi 60s (co hoi doi egress IP khac con quota)."""
    for attempt in range(4):
        req = urllib.request.Request(url, headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "vcut-ghsa-audit"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                return json.load(r), dict(r.headers), None
        except urllib.error.HTTPError as e:
            body = e.read()[:300].decode("utf-8", "replace")
            if e.code in (403, 429) and attempt < 3:
                reset = (e.headers or {}).get("X-RateLimit-Reset")
                wait = 60
                if reset:
                    try:
                        wait = max(5, min(3600, int(reset) - int(time.time()) + 5))
                    except ValueError:
                        pass
                log(f"  rate-limit 403, attempt {attempt + 1}/4, doi {wait}s "
                    f"(reset={reset})")
                time.sleep(wait)
                continue
            return None, dict(e.headers or {}), f"HTTP {e.code}: {body}"
        except Exception as e:
            return None, {}, str(e)
    return None, {}, "rate-limit retries exhausted"


def fetch_advisories(name):
    url = ("https://api.github.com/advisories?ecosystem=npm&affects="
           + urllib.parse.quote(name, safe="") + "&per_page=100")
    all_items = []
    for _page in range(3):  # toi da 3 trang x 100
        data, headers, err = _get_json(url)
        if data is None:
            return None, err
        all_items += data
        link = headers.get("Link") or ""
        m = re.search(r'<([^>]+)>;\s*rel="next"', link)
        if not m:
            return all_items, None
        url = m.group(1)
    return all_items, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="",
                    help='chi kiem cac package nay, vd "multer@2.5.0,vite@6.4.5"')
    args = ap.parse_args()

    done = {}
    if os.path.exists(OUT):
        try:
            done = json.load(open(OUT))
        except Exception:
            done = {}
    items, direct = load_packages()
    if args.only:
        wanted = set()
        for spec in args.only.split(","):
            spec = spec.strip()
            if not spec:
                continue
            name, _, ver = spec.rpartition("@")
            if name and ver:
                wanted.add((name, ver))
        items = [nv for nv in items if nv in wanted]
        missing = wanted - set(items)
        if missing:
            log(f"WARNING: khong co trong lockfile: {sorted(missing)}")
        # --only: xoa ket qua cu cua cac package nay de quet lai sach
        for nv in items:
            done.pop(f"{nv[0]}@{nv[1]}", None)
    log(f"packages={len(items)} direct={len(direct)} already_done={len(done)}")
    stopped = None
    for idx, (name, version) in enumerate(items):
        key = f"{name}@{version}"
        if key in done:
            continue
        data, err = fetch_advisories(name)
        if data is None:
            log(f"[{idx + 1}/{len(items)}] {key}: FETCH FAIL {err} — STOP")
            stopped = f"{key}: {err}"
            break
        hits = []
        for adv in data:
            if (adv.get("summary") or "").startswith("Withdrawn"):
                continue
            if adv.get("withdrawn_at"):
                continue
            for vuln in adv.get("vulnerabilities") or []:
                if (vuln.get("package") or {}).get("ecosystem") != "npm":
                    continue
                rng = vuln.get("vulnerable_version_range") or ""
                if satisfies(version, rng):
                    hits.append({
                        "ghsa_id": adv.get("ghsa_id"),
                        "cve_id": adv.get("cve_id"),
                        "severity": adv.get("severity"),
                        "cvss_score": (adv.get("cvss") or {}).get("score"),
                        "summary": adv.get("summary"),
                        "vulnerable_version_range": rng,
                        "first_patched_version": vuln.get("first_patched_version"),
                    })
                    break
        done[key] = hits
        if hits:
            log(f"[{idx + 1}/{len(items)}] {key}: VULN {len(hits)} "
                + ", ".join(h.get("cve_id") or h["ghsa_id"] for h in hits))
        if (idx + 1) % 50 == 0:
            json.dump(done, open(OUT, "w"))
            log(f"progress {idx + 1}/{len(items)} done, vuln_pkgs_so_far="
                f"{sum(1 for v in done.values() if v)}")
        time.sleep(0.2)
    json.dump(done, open(OUT, "w"))
    # Chi dem cac key con co trong lockfile hien tai (loai key cu sau bump).
    current_keys = {f"{n}@{v}" for n, v in load_packages()[0]}
    current = {k: v for k, v in done.items() if k in current_keys}
    total_hits = [h for v in current.values() for h in v]
    by_sev = {}
    for h in total_hits:
        by_sev[h.get("severity") or "?"] = by_sev.get(h.get("severity") or "?", 0) + 1
    summary = {
        "packages_checked": len(current),
        "packages_total": len(current_keys),
        "packages_with_vulns": sum(1 for v in current.values() if v),
        "total_advisories_matched": len(total_hits),
        "by_severity": by_sev,
        "cve_ids": sorted({h["cve_id"] for h in total_hits if h.get("cve_id")}),
        "ghsa_only_ids": sorted({h["ghsa_id"] for h in total_hits if not h.get("cve_id")}),
        "stopped_early": stopped,
        "complete": stopped is None,
    }
    json.dump(summary, open(SUMMARY, "w"), indent=2)
    log(f"SUMMARY: {json.dumps(summary)}")


if __name__ == "__main__":
    main()

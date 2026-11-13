#!/usr/bin/env python3
"""Kiểm tra nhanh: gradio mới nhất trên PyPI đã gỡ kẹp pillow<13 chưa?

Đợt 69 W7 — nợ TTS 39 CVE (Pillow 12.3.0, fix 13.0.0). TTS kẹt vì vieneu
3.8.3 requires gradio>=5.49.1, mà mọi gradio tới 6.31.0 đều kẹp
pillow<13.0 nên pip resolve Pillow 13.0.0 + vieneu -> ResolutionImpossible.

Chỉ đọc metadata PyPI (stdlib urllib, không tải wheel, không chạm venv TTS).
Chạy:  python3 scripts/check-gradio-pillow-cap.py
Kết quả kỳ vọng khi nợ còn kẹt:  GRADIO STILL CAPS pillow<13 — debt stays open.
Khi nào script in "CAP LIFTED" thì mới tới bước dry-run resolve + pip-audit
(trong venv TẠM, xem docs/PHASE9_ROUND69_W7_TTS_GRADIO_LIMITS.md §5).

Tác giả: đợt 69 W7 (09/11/2026). License: MIT (repo).
"""

import json
import sys
import urllib.request

PYPI = "https://pypi.org/pypi/{name}{ver}/json"


def fetch(name, ver=""):
    url = PYPI.format(name=name, ver=("/" + ver) if ver else "")
    req = urllib.request.Request(url, headers={"User-Agent": "VCut-W7-check/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def pillow_req(info):
    reqs = info.get("requires_dist") or []
    return [r for r in reqs if r.lower().startswith("pillow")]


def main():
    g = fetch("gradio")
    latest = g["info"]["version"]
    gv = fetch("gradio", latest)
    cap = pillow_req(gv["info"])
    v = fetch("vieneu")
    v_latest = v["info"]["version"]
    p = fetch("pillow")
    p_latest = p["info"]["version"]

    print(f"gradio latest on PyPI : {latest} (published "
          f"{gv['urls'][0]['upload_time'] if gv.get('urls') else '?'})")
    print(f"gradio {latest} pillow requirement: {cap or '(none declared)'}")
    print(f"vieneu latest on PyPI : {v_latest}")
    print(f"pillow latest on PyPI : {p_latest}")

    capped = any("<13" in r.replace(" ", "") for r in cap)
    if capped:
        print("VERDICT: GRADIO STILL CAPS pillow<13 — TTS Pillow bump "
              "still impossible (ResolutionImpossible). Debt stays open.")
        return 1
    print("VERDICT: CAP LIFTED (or no pillow cap) — re-run pip dry-run "
          "resolve with Pillow==13.0.0 in a TEMP venv before any bump.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

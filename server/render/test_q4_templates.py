# test_p5_templates.py — Q4 (Phase 8): render 20 template vòng 2 ra MP4 thật.
# Chạy: python3 server/render/test_p5_templates.py  (media + output trong /tmp/q4_tpl)
# Kết quả kỳ vọng: PASS 20/20 (exit 0). Thời gian ~8 phút trên VM 2vCPU.
#!/usr/bin/env python3
"""Render all 20 P5 templates to real MP4 via the render worker.

Substitutes every {{placeholder}} with generated synthetic media:
  video -> testsrc2 mp4 (15s), image -> solid PNG, audio -> sine mp3 (15s),
  text  -> its default text. Literal sticker PNGs (sparkle/heart/badge) are
  generated as solid squares.
Checks: render exit 0, output exists, ffprobe duration ~= template durationSec
(within 1.0s), mid-frame is not a single solid color (compositing happened).
"""
import json, os, subprocess, sys, glob

REPO = os.path.expanduser("~/workspace/repo-1")
MEDIA = "/tmp/q4_tpl/media"
OUT = "/tmp/q4_tpl/out"
os.makedirs(MEDIA, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

NEW_IDS = ['podcast-studio', 'morning-news', 'concert-teaser', 'album-cover', 'cooking-show', 'travel-montage', 'gym-transformation', 'book-trailer', 'webinar-invite', 'charity-appeal', 'app-launch', 'fashion-lookbook', 'wedding-vows', 'graduation-celebration', 'podcast-highlight', 'desk-setup', 'outro-subscribe', 'intro-logo', 'family-slideshow', 'sale-countdown']

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, (r.stderr or "")[-400:]

def gen_media():
    # one video file per video placeholder id (15s, 640x360 testsrc2)
    vids, imgs, auds = set(), set(), set()
    for f in glob.glob(f"{REPO}/assets/templates/*.json"):
        d = json.load(open(f))
        if d["template"]["id"] not in NEW_IDS:
            continue
        for p in d["template"]["placeholders"]:
            if p["kind"] == "video":
                vids.add(p["id"])
            elif p["kind"] == "image":
                imgs.add(p["id"])
            elif p["kind"] == "audio":
                auds.add(p["id"])
    for vid in vids:
        path = f"{MEDIA}/{vid}.mp4"
        if not os.path.exists(path):
            rc, err = run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
                           "-i", "testsrc2=size=640x360:rate=30:duration=15",
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", path])
            assert rc == 0, err
    for img in imgs:
        path = f"{MEDIA}/{img}.png"
        if not os.path.exists(path):
            rc, err = run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
                           "-i", "color=c=0x336699:size=640x360",
                           "-frames:v", "1", path])
            assert rc == 0, err
    for aud in auds:
        path = f"{MEDIA}/{aud}.mp3"
        if not os.path.exists(path):
            rc, err = run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
                           "-i", "sine=frequency=440:duration=15",
                           "-c:a", "libmp3lame", path])
            assert rc == 0, err
    for name in ("sparkle", "heart", "badge", "star"):
        path = f"{MEDIA}/{name}.png"
        if not os.path.exists(path):
            rc, err = run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
                           "-i", "color=c=0xFFCC00:size=120x120",
                           "-frames:v", "1", path])
            assert rc == 0, err
    print(f"media ready: {len(vids)} video, {len(imgs)} image, {len(auds)} audio, 3 sticker")

def substitute(tpl):
    s = json.dumps(tpl["spec"], ensure_ascii=False)
    for p in tpl["template"]["placeholders"]:
        if p["kind"] == "video":
            s = s.replace("{{" + p["id"] + "}}", f"{p['id']}.mp4")
        elif p["kind"] == "image":
            s = s.replace("{{" + p["id"] + "}}", f"{p['id']}.png")
        elif p["kind"] == "audio":
            s = s.replace("{{" + p["id"] + "}}", f"{p['id']}.mp3")
        elif p["kind"] == "text":
            s = s.replace("{{" + p["id"] + "}}", p["default"])
    assert "{{" not in s, "unresolved marker left"
    return json.loads(s)

def probe_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())

def frame_is_solid(path, t):
    png = "/tmp/q4_tpl/frame.png"
    rc, _ = run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", path,
                 "-frames:v", "1", png])
    if rc != 0:
        return None
    from PIL import Image
    import numpy as np
    a = np.array(Image.open(png).convert("RGB"))
    return float(a.std()) < 1.0  # True = solid (bad)

def main():
    gen_media()
    results = {}
    for tid in NEW_IDS:
        tpl = json.load(open(f"{REPO}/assets/templates/{tid}.json"))
        spec = substitute(tpl)
        spec_path = f"/tmp/q4_tpl/{tid}.json"
        json.dump(spec, open(spec_path, "w"), ensure_ascii=False)
        out = f"{OUT}/{tid}.mp4"
        rc, err = run(["node", f"{REPO}/server/render/src/render.js",
                       "--spec", spec_path, "--out", out,
                       "--media-dir", MEDIA, "-y"])
        if rc != 0:
            print(f"FAIL {tid}: render exit {rc}: {err}")
            results[tid] = False
            continue
        try:
            dur = probe_duration(out)
        except Exception as e:
            print(f"FAIL {tid}: probe error {e}")
            results[tid] = False
            continue
        expect = tpl["template"]["durationSec"]
        solid = frame_is_solid(out, max(0.5, expect / 2))
        ok = abs(dur - expect) <= 1.0 and solid is False
        print(f"{'PASS' if ok else 'CHECK'} {tid}: dur={dur:.1f}s (expect {expect}s) solid_midframe={solid}")
        results[tid] = ok
    print()
    print(f"PASS: {sum(results.values())}/{len(results)}")
    bad = [k for k, v in results.items() if not v]
    if bad:
        print("FAILED:", ", ".join(bad))
    sys.exit(0 if all(results.values()) else 1)

if __name__ == "__main__":
    main()

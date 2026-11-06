#!/usr/bin/env python3
"""Do parity dissolve N1 -> N2 trong mien YUV, phuong phap KHOP MAU
(Phase 9 dot 25, luong I5; noi tiep ket luan dot 24 H4, khong lap lai
phuong phap mismatched cu; khong cho harness chung cua I1 — script nay
tu ghi phuong phap cua minh).

MODE MATChed (mac dinh, la so parity chinh):
  Theo truyen thong do R6/R20 + probe H4: ca hai phia deu di qua
  cung mot phep chuyen RGB -> YUV420p voi CUNG he so ma tran, chi
  dinh ro bang out_color_matrix (bt709 mac dinh, hoac bt601 cho
  control). Cu the:
    - Render: A/B -> scale=720:1280,fps=30,format=rgb24 -> xfade
      dissolve 2s -> scale(out_color_matrix=MATRIX:out_range=tv),
      format=yuv420p -> libx264 preset medium crf X -> decode ve
      yuv420p raw.
    - Model: A/B trich rgb24 (cung filter nhu H5) -> pick frand
      float32 (vf_xfade.c) voi p_hat do tu frame render RGB ->
      khung RGB model -> scale(CUNG filter chuyen nhu render) ->
      yuv420p.
  Vi ca hai phia dung cung filter chuyen, he so chuyen "khop" theo
  dinh nghia: khong con lech he thong do ma tran. So sanh MAD tren
  moi sample (mau so 1,5*W*H) + MAD-Y/U/V rieng + ti le sample
  |diff| <= 8. Verdict thang V6: KHOP neu MAD <= 2 va le8 >= 99%;
  XAP_XI neu MAD <= 20 va le8 >= 90%; con lai LECH.
  LUU Y (bai hoc xuong mau cua luong nay): KHONG gan co
  -color_primaries/-color_trc/-colorspace/-color_range o output
  encode — thu nghiem cho thay ffmpeg chen them phep chuyen mau
  khi nguon mang metadata unknown (mp4 doi 16.363.337 -> 16.101.561
  byte, frame 0 lech 85,9% pixel), tuc la co KHONG chi la tag.
  Encode o day khong gan co mau nao; decode ve yuv420p raw khong
  ap dung ma tran nen tag khong anh huong so do.

MODE NATIVE (chan doan, khong phai so parity chinh):
  xfade truc tiep tren input yuv420p (khong qua RGB), model la pick
  frand theo tung mat phang (Y full-res, U/V theo toa do chroma).
  Mode nay CHUNG MINH rang xfade-native khong tai tao duoc bang
  model pick don gian o chroma (xem LIMITS I5 §3): chi dung de
  canh bao, khong dung lay verdict parity.

Nguon N1/N2 mang metadata mau unknown (ffprobe: color_space/
primaries/transfer/range deu unknown — khac J/K/L/R1/R2 mang
bt709), nen "khop mau nguon" o day co nghia la ep cung mot ma
tran ro rang cho ca hai phia (bt709 — quy uoc HD), khong phai
doc metadata nguon. Control bt601 o crf0/crf14 chung minh verdict
khong phu thuoc lua chon ma tran khi da khop.

Cach dung:
  measure-r25-i5-yuv-parity.py A.mp4 B.mp4 OUT.json
    [--a-start 10 --b-start 10] [--crfs 0,10,12,14]
    [--preset medium] [--matrix bt709] [--mode matched|native]
Chi doc file dau vao; ghi OUT.json + mp4 tam trong thu muc tam
roi xoa. Can ffmpeg + numpy. Khong sua code san pham.
"""
import argparse
import json
import os
import subprocess
import tempfile

import numpy as np

W, H, FPS, DUR = 720, 1280, 30, 2
NFRAMES = FPS * DUR
CW, CH = W // 2, H // 2  # chroma 360x640
YSIZE = W * H
CSIZE = CW * CH
FRAME_BYTES_RGB = W * H * 3
FRAME_BYTES_YUV = YSIZE + 2 * CSIZE


def run(cmd):
    return subprocess.run(cmd, capture_output=True, check=True)


def frand_field(w, h):
    xs = np.arange(w, dtype=np.float32)
    ys = np.arange(h, dtype=np.float32)
    xx, yy = np.meshgrid(xs, ys)
    arg = (xx * np.float32(12.9898) + yy * np.float32(78.233)).astype(np.float32)
    s = np.sin(arg).astype(np.float32)
    r = (s * np.float32(43758.545)).astype(np.float32)
    return (r - np.floor(r)).astype(np.float32)


def extract_rgb(path, start):
    cmd = [
        "ffmpeg", "-v", "error", "-ss", str(start), "-i", path,
        "-t", str(DUR),
        "-vf", f"scale={W}:{H},fps={FPS},format=rgb24",
        "-f", "rawvideo", "-",
    ]
    out = run(cmd).stdout
    expect = NFRAMES * FRAME_BYTES_RGB
    if len(out) != expect:
        raise SystemExit(f"{path}: got {len(out)} bytes, expected {expect}")
    return np.frombuffer(out, dtype=np.uint8).reshape(
        NFRAMES, H, W, 3).astype(np.int16)


def render_rgb_xfade(a_path, b_path, a_start, b_start):
    vf = (
        f"[0:v]scale={W}:{H},fps={FPS},format=rgb24,trim=0:{DUR},"
        f"setpts=PTS-STARTPTS[va];"
        f"[1:v]scale={W}:{H},fps={FPS},format=rgb24,trim=0:{DUR},"
        f"setpts=PTS-STARTPTS[vb];"
        f"[va][vb]xfade=transition=dissolve:duration={DUR}:offset=0,"
        f"format=rgb24[v]"
    )
    out = run([
        "ffmpeg", "-v", "error",
        "-ss", str(a_start), "-i", a_path,
        "-ss", str(b_start), "-i", b_path,
        "-filter_complex", vf,
        "-map", "[v]", "-f", "rawvideo", "-",
    ]).stdout
    expect = NFRAMES * FRAME_BYTES_RGB
    if len(out) != expect:
        raise SystemExit(f"xfade rgb: got {len(out)} bytes, expected {expect}")
    return np.frombuffer(out, dtype=np.uint8).reshape(
        NFRAMES, H, W, 3).astype(np.int16)


def rgb_frames_to_yuv(frames_rgb_u8, matrix):
    """Chuyen 1 loat khung RGB (uint8) sang yuv420p raw bang cung
    filter chuyen ma render dung. frames_rgb_u8: (N,H,W,3) uint8."""
    n = frames_rgb_u8.shape[0]
    cmd = [
        "ffmpeg", "-v", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
        "-r", str(FPS), "-i", "-",
        "-vf", f"scale=out_color_matrix={matrix}:out_range=tv,"
               f"format=yuv420p",
        "-f", "rawvideo", "-",
    ]
    out = subprocess.run(
        cmd, input=frames_rgb_u8.tobytes(),
        capture_output=True, check=True).stdout
    expect = n * FRAME_BYTES_YUV
    if len(out) != expect:
        raise SystemExit(f"rgb->yuv: got {len(out)} bytes, expected {expect}")
    raw = np.frombuffer(out, dtype=np.uint8).reshape(n, FRAME_BYTES_YUV)
    planes = []
    for f in range(n):
        y = raw[f, :YSIZE].reshape(H, W).astype(np.int16)
        u = raw[f, YSIZE:YSIZE + CSIZE].reshape(CH, CW).astype(np.int16)
        v = raw[f, YSIZE + CSIZE:].reshape(CH, CW).astype(np.int16)
        planes.append((y, u, v))
    return planes


def render_matched_yuv(a_path, b_path, a_start, b_start, crf, preset,
                       matrix, tmpdir):
    """Render chain matched: xfade RGB -> chuyen YUV matrix -> encode
    (KHONG co mau) -> decode yuv420p. Tra ve planes + kich thuoc mp4."""
    mp4 = os.path.join(tmpdir, f"render-{matrix}-crf{crf}.mp4")
    vf = (
        f"[0:v]scale={W}:{H},fps={FPS},format=rgb24,trim=0:{DUR},"
        f"setpts=PTS-STARTPTS[va];"
        f"[1:v]scale={W}:{H},fps={FPS},format=rgb24,trim=0:{DUR},"
        f"setpts=PTS-STARTPTS[vb];"
        f"[va][vb]xfade=transition=dissolve:duration={DUR}:offset=0,"
        f"format=rgb24,"
        f"scale=out_color_matrix={matrix}:out_range=tv,"
        f"format=yuv420p[v]"
    )
    run([
        "ffmpeg", "-v", "error",
        "-ss", str(a_start), "-i", a_path,
        "-ss", str(b_start), "-i", b_path,
        "-filter_complex", vf,
        "-map", "[v]", "-c:v", "libx264", "-preset", preset,
        "-crf", str(crf), "-pix_fmt", "yuv420p",
        "-an", "-y", mp4,
    ])
    out = run([
        "ffmpeg", "-v", "error", "-i", mp4,
        "-vf", "format=yuv420p", "-f", "rawvideo", "-",
    ]).stdout
    expect = NFRAMES * FRAME_BYTES_YUV
    if len(out) != expect:
        raise SystemExit(f"render {matrix} crf{crf}: got {len(out)} bytes, "
                         f"expected {expect}")
    raw = np.frombuffer(out, dtype=np.uint8).reshape(NFRAMES, FRAME_BYTES_YUV)
    planes = []
    for f in range(NFRAMES):
        y = raw[f, :YSIZE].reshape(H, W).astype(np.int16)
        u = raw[f, YSIZE:YSIZE + CSIZE].reshape(CH, CW).astype(np.int16)
        v = raw[f, YSIZE + CSIZE:].reshape(CH, CW).astype(np.int16)
        planes.append((y, u, v))
    size = os.path.getsize(mp4)
    os.remove(mp4)
    return planes, size


def extract_yuv(path, start):
    cmd = [
        "ffmpeg", "-v", "error", "-ss", str(start), "-i", path,
        "-t", str(DUR),
        "-vf", f"scale={W}:{H},fps={FPS},format=yuv420p",
        "-f", "rawvideo", "-",
    ]
    out = run(cmd).stdout
    expect = NFRAMES * FRAME_BYTES_YUV
    if len(out) != expect:
        raise SystemExit(f"{path}: got {len(out)} bytes, expected {expect}")
    raw = np.frombuffer(out, dtype=np.uint8).reshape(NFRAMES, FRAME_BYTES_YUV)
    planes = []
    for f in range(NFRAMES):
        y = raw[f, :YSIZE].reshape(H, W).astype(np.int16)
        u = raw[f, YSIZE:YSIZE + CSIZE].reshape(CH, CW).astype(np.int16)
        v = raw[f, YSIZE + CSIZE:].reshape(CH, CW).astype(np.int16)
        planes.append((y, u, v))
    return planes


def render_native_yuv(a_path, b_path, a_start, b_start, crf, preset, tmpdir):
    mp4 = os.path.join(tmpdir, f"render-native-crf{crf}.mp4")
    vf = (
        f"[0:v]scale={W}:{H},fps={FPS},format=yuv420p,trim=0:{DUR},"
        f"setpts=PTS-STARTPTS[va];"
        f"[1:v]scale={W}:{H},fps={FPS},format=yuv420p,trim=0:{DUR},"
        f"setpts=PTS-STARTPTS[vb];"
        f"[va][vb]xfade=transition=dissolve:duration={DUR}:offset=0,"
        f"format=yuv420p[v]"
    )
    run([
        "ffmpeg", "-v", "error",
        "-ss", str(a_start), "-i", a_path,
        "-ss", str(b_start), "-i", b_path,
        "-filter_complex", vf,
        "-map", "[v]", "-c:v", "libx264", "-preset", preset,
        "-crf", str(crf), "-pix_fmt", "yuv420p",
        "-an", "-y", mp4,
    ])
    out = run([
        "ffmpeg", "-v", "error", "-i", mp4,
        "-vf", "format=yuv420p", "-f", "rawvideo", "-",
    ]).stdout
    expect = NFRAMES * FRAME_BYTES_YUV
    if len(out) != expect:
        raise SystemExit(f"render native crf{crf}: got {len(out)} bytes, "
                         f"expected {expect}")
    raw = np.frombuffer(out, dtype=np.uint8).reshape(NFRAMES, FRAME_BYTES_YUV)
    planes = []
    for f in range(NFRAMES):
        y = raw[f, :YSIZE].reshape(H, W).astype(np.int16)
        u = raw[f, YSIZE:YSIZE + CSIZE].reshape(CH, CW).astype(np.int16)
        v = raw[f, YSIZE + CSIZE:].reshape(CH, CW).astype(np.int16)
        planes.append((y, u, v))
    size = os.path.getsize(mp4)
    os.remove(mp4)
    return planes, size


def verdict(mad, le8):
    if mad <= 2 and le8 >= 99.0:
        return "KHOP"
    if mad <= 20 and le8 >= 90.0:
        return "XAP_XI"
    return "LECH"


def compare_planes(model, rend):
    """model, rend: list 60 frame, moi frame tuple 3 plane int16.
    Tra ve dict MAD tong, MAD tung plane, le8 sample, per-frame."""
    total_abs = 0.0
    total_samples = 0
    le8_samples = 0
    per_plane_abs = [0.0, 0.0, 0.0]
    per_plane_n = [0, 0, 0]
    per_frame = []
    for i in range(NFRAMES):
        frame_abs = 0.0
        frame_n = 0
        frame_le8 = 0
        plane_mads = []
        for p in range(3):
            diff = np.abs(model[i][p] - rend[i][p])
            plane_mads.append(round(float(diff.mean()), 4))
            per_plane_abs[p] += float(diff.sum())
            per_plane_n[p] += diff.size
            frame_abs += float(diff.sum())
            frame_n += diff.size
            frame_le8 += int((diff <= 8).sum())
        total_abs += frame_abs
        total_samples += frame_n
        le8_samples += frame_le8
        per_frame.append({
            "frame": i, "mad": round(frame_abs / frame_n, 4),
            "mad_y": plane_mads[0], "mad_u": plane_mads[1],
            "mad_v": plane_mads[2],
        })
    mad = total_abs / total_samples
    le8 = le8_samples / total_samples * 100.0
    return {
        "mad": round(mad, 4),
        "mad_y": round(per_plane_abs[0] / per_plane_n[0], 4),
        "mad_u": round(per_plane_abs[1] / per_plane_n[1], 4),
        "mad_v": round(per_plane_abs[2] / per_plane_n[2], 4),
        "le8_pct_samples": round(le8, 2),
        "verdict": verdict(mad, le8),
        "per_frame": per_frame,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("a")
    ap.add_argument("b")
    ap.add_argument("out")
    ap.add_argument("--a-start", type=float, default=10.0)
    ap.add_argument("--b-start", type=float, default=10.0)
    ap.add_argument("--crfs", default="0,10,12,14")
    ap.add_argument("--preset", default="medium")
    ap.add_argument("--matrix", default="bt709")
    ap.add_argument("--mode", default="matched",
                    choices=["matched", "native"])
    args = ap.parse_args()
    crfs = [int(c) for c in args.crfs.split(",") if c.strip() != ""]

    results = []
    if args.mode == "matched":
        a = extract_rgb(args.a, args.a_start)
        b = extract_rgb(args.b, args.b_start)
        r_rgb = render_rgb_xfade(args.a, args.b,
                                 args.a_start, args.b_start)
        fr = frand_field(W, H)
        model_rgb = np.empty_like(a)
        p_hats = []
        for i in range(NFRAMES):
            d_a = np.abs(r_rgb[i] - a[i]).sum(axis=2)
            d_b = np.abs(r_rgb[i] - b[i]).sum(axis=2)
            p_hat = float((d_b < d_a).mean())
            p_hats.append(round(p_hat, 4))
            model_rgb[i] = np.where((fr < p_hat)[..., None], b[i], a[i])
        model_yuv = rgb_frames_to_yuv(
            model_rgb.astype(np.uint8), args.matrix)
        with tempfile.TemporaryDirectory(prefix="r25-i5-yuv-") as tmpdir:
            for crf in crfs:
                rend, mp4_size = render_matched_yuv(
                    args.a, args.b, args.a_start, args.b_start,
                    crf, args.preset, args.matrix, tmpdir)
                res = compare_planes(model_yuv, rend)
                res.update({"crf": crf, "preset": args.preset,
                            "matrix": args.matrix,
                            "mp4_bytes_2s": mp4_size})
                results.append(res)
                print(f"matched {args.matrix} crf{crf}: MAD={res['mad']:.4f} "
                      f"(Y {res['mad_y']:.4f} U {res['mad_u']:.4f} "
                      f"V {res['mad_v']:.4f}) le8={res['le8_pct_samples']:.2f}% "
                      f"verdict={res['verdict']} mp4={mp4_size}B", flush=True)
        method = ("matched-matrix: RGB xfade chain vs RGB frand model, "
                  "both converted to yuv420p with identical "
                  f"scale(out_color_matrix={args.matrix}:out_range=tv); "
                  "p_hat measured from RGB render frame (H5 method); "
                  "encode carries NO color flags (see script header); "
                  "MAD denominator 1.5*W*H; le8 = sample-level |diff|<=8")
    else:
        a = extract_yuv(args.a, args.a_start)
        b = extract_yuv(args.b, args.b_start)
        fr_y = frand_field(W, H)
        fr_c = frand_field(CW, CH)
        fr = (fr_y, fr_c, fr_c)
        with tempfile.TemporaryDirectory(prefix="r25-i5-yuv-") as tmpdir:
            for crf in crfs:
                rend, mp4_size = render_native_yuv(
                    args.a, args.b, args.a_start, args.b_start,
                    crf, args.preset, tmpdir)
                # model pick per-plane, p_hat do tu render (tung plane)
                model = []
                for i in range(NFRAMES):
                    frame = []
                    for p in range(3):
                        d_a = np.abs(rend[i][p] - a[i][p])
                        d_b = np.abs(rend[i][p] - b[i][p])
                        p_hat = float((d_b < d_a).mean())
                        frame.append(np.where(fr[p] < p_hat,
                                              b[i][p], a[i][p]))
                    model.append(tuple(frame))
                res = compare_planes(model, rend)
                res.update({"crf": crf, "preset": args.preset,
                            "mp4_bytes_2s": mp4_size})
                results.append(res)
                print(f"native crf{crf}: MAD={res['mad']:.4f} "
                      f"(Y {res['mad_y']:.4f} U {res['mad_u']:.4f} "
                      f"V {res['mad_v']:.4f}) le8={res['le8_pct_samples']:.2f}% "
                      f"verdict={res['verdict']} mp4={mp4_size}B", flush=True)
        method = ("native-diagnostic ONLY: yuv420p xfade chain vs "
                  "per-plane frand pick model (Y full-res, U/V chroma "
                  "coords); p_hat per plane from render; NOT the parity "
                  "verdict (see LIMITS I5 §3)")

    doc = {
        "a": args.a, "b": args.b,
        "a_start": args.a_start, "b_start": args.b_start,
        "size": f"{W}x{H}", "fps": FPS, "frames": NFRAMES,
        "transition": "dissolve", "mode": args.mode,
        "method": method,
        "threshold_v6": "KHOP if MAD<=2 and le8>=99%; "
                        "XAP_XI if MAD<=20 and le8>=90%",
        "results": results,
    }
    with open(args.out, "w") as f:
        json.dump(doc, f, indent=2)
    print(f"-> {args.out}")


if __name__ == "__main__":
    main()

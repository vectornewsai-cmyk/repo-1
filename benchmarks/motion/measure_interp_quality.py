#!/usr/bin/env python3
"""measure_interp_quality.py — Đo chất lượng artifact nội suy P6 (đợt 11).

Phương pháp (ghi rõ, không giấu):
  - Chân lý (ground truth): testsrc2 + vuông đỏ chuyển động ở fps CAO,
    render trực tiếp bằng lavfi (không qua nội suy) — là "frame thật".
  - Nguồn thấp: chân lý hạ fps bằng filter fps= (giữ đúng lưới thời gian:
    frame nguồn thấp k ứng với frame chân lý k * (fps_cao/fps_thap)).
  - Tái tạo lên fps cao bằng 4 cách: dup (fps=, chỉ lặp frame — baseline),
    blend (minterpolate mi_mode=blend), mci (minterpolate mci/aobmc/bidir
    — đúng chain render thật motion.js), mci+tailfix (thêm tpad clone
    trước + trim đúng slot sau, như vá đuôi đợt 9 M1).
  - So sánh từng bản tái tạo với chân lý bằng filter psnr và ssim của
    FFmpeg (cùng res, cùng fps, cùng số frame): đọc giá trị average
    PSNR (dB, cao hơn = gần chân lý hơn) và SSIM All (0..1).
  - Hai cửa sổ: FULL (toàn clip) và TRIM (bỏ 0.5s cuối — vùng đuôi mà
    không phương pháp nào có thông tin chuyển động tương lai, nên điểm
    đuôi phản ánh thiếu thông tin chứ không phải chất lượng nội suy
    giữa chuỗi; xem LIMITS đợt 9 về đuôi đóng băng).
  - Chỉ số này đo trên footage TỔNG HỢP (testsrc2 + vật thể động), KHÔNG
    phải footage quay thật — repo không có footage quay thật sẵn. PSNR/
    SSIM là độ gần pixel với chân lý, không phải đánh giá cảm quan;
    minterpolate mci có thể cho PSNR cao nhưng vẫn có bóng ma cục bộ
    ở vật chuyển động nhanh mà chỉ số trung bình không bắt được.

Chạy: python3 benchmarks/motion/measure_interp_quality.py [--hd]
  --hd: thêm điểm 720p (chân lý 50fps -> thấp 25fps -> tái tạo 50fps).
  Mặc định chỉ chạy 360p (chân lý 60fps -> thấp 15fps -> tái tạo 60fps)
  cho nhanh. File trung gian trong /tmp, kết quả JSON ghi vào
  benchmarks/results/motion_p6_quality.json (ghi đè).
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORK = os.environ.get("P6Q_WORKDIR", "/tmp/vcut-bench/p6quality")
OUT_JSON = os.path.join(ROOT, "benchmarks", "results", "motion_p6_quality.json")
os.makedirs(WORK, exist_ok=True)
os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)


def run(cmd, label):
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       text=True)
    if r.returncode != 0:
        print(f"FAIL {label} (rc={r.returncode}):\n{r.stderr[-1500:]}",
              file=sys.stderr)
        sys.exit(2)
    return r


def gen_truth(path, w, h, fps, dur):
    if os.path.exists(path):
        return
    sq = 160 if w <= 640 else 240
    run(["ffmpeg", "-y", "-v", "error",
         "-f", "lavfi", "-i",
         f"testsrc2=size={w}x{h}:rate={fps}:duration={dur}",
         "-f", "lavfi", "-i",
         f"color=c=0xFF3030:s={sq}x{sq}:rate={fps}:duration={dur},"
         "format=yuva420p",
         "-filter_complex",
         "[0:v][1:v]overlay="
         f"x='40+{w // 3}*abs(sin(t))':y='30+{h // 4}*abs(cos(t))':"
         "shortest=1",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
         "-pix_fmt", "yuv420p", path], f"gen truth {path}")


def transcode(src, dst, vf):
    run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf", vf,
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
         "-pix_fmt", "yuv420p", dst], f"transcode {dst}")


def compare(ref, cand):
    """Trả (psnr_avg_db, ssim_all) đo bằng filter psnr/ssim của FFmpeg."""
    r = run(["ffmpeg", "-v", "info", "-i", ref, "-i", cand,
             "-filter_complex", "[0:v][1:v]psnr", "-f", "null", "-"],
            "psnr")
    m = re.search(r"average:([0-9.]+|inf)", r.stderr)
    psnr = None if m is None else (float("inf") if m.group(1) == "inf"
                                   else float(m.group(1)))
    r = run(["ffmpeg", "-v", "info", "-i", ref, "-i", cand,
             "-filter_complex", "[0:v][1:v]ssim", "-f", "null", "-"],
            "ssim")
    m = re.search(r"All:([0-9.]+)", r.stderr)
    ssim = None if m is None else float(m.group(1))
    return psnr, ssim


def measure_case(name, w, h, hi_fps, lo_fps, dur):
    """Một điểm đo: chân lý hi_fps -> thấp lo_fps -> tái tạo hi_fps."""
    truth = os.path.join(WORK, f"{name}_truth.mp4")
    gen_truth(truth, w, h, hi_fps, dur)
    low = os.path.join(WORK, f"{name}_low.mp4")
    transcode(truth, low, f"fps={lo_fps}")
    n_hi = int(round(dur * hi_fps))
    tail = int(round(0.5 * hi_fps))  # bỏ 0.5s cuối ở cửa sổ TRIM
    methods = {
        "dup": f"fps={hi_fps}",
        "blend": (f"minterpolate=fps={hi_fps}:mi_mode=blend,"
                  f"fps={hi_fps}"),
        "mci": (f"minterpolate=fps={hi_fps}:mi_mode=mci:mc_mode=aobmc:"
                f"me_mode=bidir:vsbmc=1,fps={hi_fps}"),
        "mci_tailfix": (f"tpad=stop_mode=clone:stop=4,"
                         f"minterpolate=fps={hi_fps}:mi_mode=mci:"
                         f"mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
                         f"fps={hi_fps},trim=end_frame={n_hi},"
                         "setpts=PTS-STARTPTS"),
    }
    results = {}
    for mname, vf in methods.items():
        cand = os.path.join(WORK, f"{name}_{mname}.mp4")
        t0 = time.time()
        transcode(low, cand, vf)
        wall = round(time.time() - t0, 3)
        # FULL: so toàn clip (cần cùng số frame — dup/blend/mci có fps
        # lấp đuôi nên đủ n_hi frame; kiểm tra bằng psnr chạy được là đủ).
        psnr_f, ssim_f = compare(truth, cand)
        # TRIM: cắt cả hai về n_hi - tail frame rồi so.
        trim_n = n_hi - tail
        ref_t = os.path.join(WORK, f"{name}_truth_trim.mp4")
        cand_t = os.path.join(WORK, f"{name}_{mname}_trim.mp4")
        transcode(truth, ref_t,
                  f"trim=end_frame={trim_n},setpts=PTS-STARTPTS")
        transcode(cand, cand_t,
                  f"trim=end_frame={trim_n},setpts=PTS-STARTPTS")
        psnr_t, ssim_t = compare(ref_t, cand_t)
        results[mname] = {"wall_s": wall, "psnr_full_db": psnr_f,
                          "ssim_full": ssim_f, "psnr_trim_db": psnr_t,
                          "ssim_trim": ssim_t}
        print(f"  {mname}: wall={wall}s PSNR full={psnr_f} trim={psnr_t} "
              f"SSIM full={ssim_f} trim={ssim_t}", flush=True)
    return {"res": f"{w}x{h}", "truth_fps": hi_fps, "low_fps": lo_fps,
            "duration_s": dur, "methods": results}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hd", action="store_true",
                    help="thêm điểm 720p 50fps (chậm hơn)")
    args = ap.parse_args()
    out = {"footage": "synthetic testsrc2 + moving red square (NOT real "
                        "camera footage)", "cases": {}}
    print("== 360p: truth 60fps -> low 15fps -> recon 60fps ==", flush=True)
    out["cases"]["360p_60fps"] = measure_case("c360", 640, 360, 60, 15, 2)
    if args.hd:
        print("== 720p: truth 50fps -> low 25fps -> recon 50fps ==",
              flush=True)
        out["cases"]["720p_50fps"] = measure_case("c720", 1280, 720,
                                                  50, 25, 2)
    with open(OUT_JSON, "w") as f:
        json.dump(out, f, indent=2)
    print(f"JSON: {OUT_JSON}")


if __name__ == "__main__":
    main()

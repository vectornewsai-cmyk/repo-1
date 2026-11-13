#!/usr/bin/env python3
"""
Test đợt 78 F9: MediaPipe SelfieSegmenter (Tasks API) SO VỚI u2net/u2netp.

Mục đích: thử ứng viên nhẹ số 2 từ đợt 76 D7 §3.3 (MediaPipe, Apache-2.0)
trên cùng clip chân dung E4 đã dùng (person.jpg) + chân dung sáng D mới,
đo tốc độ + IoU so với u2net. Nếu không chạy được/không đạt thì ghi rõ,
không ép. KHÔNG sửa production, KHÔNG tích hợp vào bgremove.py trong
luồng này.

License (kiểm chứng trước khi chạy):
  * mediapipe 0.10.21 — Apache-2.0 (PyPI classifier + LICENSE trong repo
    google-ai-edge/mediapipe).
  * Model selfie_segmenter.tflite (float16, 256x256, 249.537 byte,
    md5 3b2e3e1cfc7d31538caf00ff4e0fba8c) tải từ
    storage.googleapis.com/mediapipe-models/image_segmenter/
    selfie_segmenter/float16/1/selfie_segmenter.tflite — model card
    MediaPipe (ai.google.dev) ghi model này thuộc họ Apache-2.0
    (xem docs/PHASE9_ROUND78_F9_U2NETP_OPTIN_LIMITS.md §3).
  * Model CHỈ tách người (person-only) — không phải vật thể chung như
    u2net; chỉ đo trên ảnh chân dung (A: person.jpg, D: áo trắng).
    Model là file ngoài repo (scratch), không stage.

Chạy (venv SCRATCH — mediapipe KHÔNG có trong venv bgremove):
    ~/workspace/.tmp-r78f9/venv-mp/bin/python -u test_round78_f9_mediapipe.py \
        [--workdir DIR] [--frames N] [--d-mask PATH]

Việc làm:
  1. Nạp ImageSegmenter (IMAGE mode, output category + confidence mask).
  2. Chạy N lần segment() trên person.jpg 640x640 (clip tĩnh 3 s / 90
     frame tương đương E4) — đo latency mỗi lần (mean/median/min/max),
     fps, đỉnh RSS (resource.getrusage của chính process).
  3. Lấy confidence mask (float 0-1, 256x256) → so với mask u2net
     clip A @480 đợt 77 E4 (tái dùng file trên đĩa): upsample MP lên
     480x480 (LANCZOS), IoU@128, MAD (/255), fg% mỗi bên.
  4. Nếu có --d-mask (mask u2net clip D @480 từ test F9): so tương tự
     trên chân dung sáng D. Không có thì bỏ qua, ghi rõ.
  5. In bảng tổng hợp + ghi JSON vào <workdir>/results-f9-mediapipe.json.

Tiêu chí tham khảo (đặt trước khi đo, giống E4/F9):
  IoU@128 >= 0.85 và MAD <= 15/255 so với u2net mới coi là tương đương
  trên chân dung; tốc độ tính theo fps (kỳ vọng >> u2net 0,37 fps).
"""
import argparse
import hashlib
import json
import os
import resource
import subprocess
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.path.expanduser("~/workspace/scratch-bgremove")
E4_WORKDIR = os.path.expanduser("~/workspace/.tmp-r77e4")
MODEL_NAME = "selfie_segmenter.tflite"
MODEL_MD5 = "3b2e3e1cfc7d31538caf00ff4e0fba8c"


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"Lệnh thất bại: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def md5_of(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def read_first_gray_frame(path):
    """Đọc frame đầu của video mask (grayscale) qua ffmpeg rawvideo."""
    r = sh(["ffprobe", "-v", "error", "-show_entries", "stream=width,height",
            "-of", "csv=p=0", path])
    w, h = (int(x) for x in r.stdout.strip().split(",")[:2])
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path,
         "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"Không đọc được frame mask: {path}")
    return np.frombuffer(p.stdout, dtype=np.uint8).reshape(h, w)


def compare_masks(mp_mask_u8, u2net_frame, label):
    """mp_mask_u8: mask MediaPipe đã upsample về cùng shape, uint8 0-255."""
    assert mp_mask_u8.shape == u2net_frame.shape, \
        f"{label}: shape khác {mp_mask_u8.shape} vs {u2net_frame.shape}"
    ba = mp_mask_u8 > 128
    bb = u2net_frame > 128
    inter = np.logical_and(ba, bb).sum()
    union = np.logical_or(ba, bb).sum()
    iou = inter / union if union else 1.0
    mad = float(np.abs(mp_mask_u8.astype(int) - u2net_frame.astype(int)).mean()) / 255.0
    diff32 = float((np.abs(mp_mask_u8.astype(int) - u2net_frame.astype(int)) > 32).mean() * 100)
    fg_mp = float((mp_mask_u8 > 200).mean() * 100)
    fg_u2 = float((u2net_frame > 200).mean() * 100)
    out = {"label": label, "iou": round(float(iou), 4),
           "mad": round(mad, 4), "pct_diff_gt32": round(diff32, 2),
           "fg_pct_mediapipe": round(fg_mp, 1), "fg_pct_u2net": round(fg_u2, 1)}
    print(f"[compare] {label}: IoU={out['iou']} MAD={out['mad']} "
          f"|diff|>32={out['pct_diff_gt32']}% fg MP={out['fg_pct_mediapipe']}% "
          f"fg u2net={out['fg_pct_u2net']}%", flush=True)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=os.path.expanduser("~/workspace/.tmp-r78f9"))
    ap.add_argument("--frames", type=int, default=90)
    ap.add_argument("--d-mask", default=None,
                    help="Mask u2net clip D @480 (nếu có) để so thêm chân dung sáng")
    args = ap.parse_args()

    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import (
        ImageSegmenter, ImageSegmenterOptions)
    from mediapipe.tasks.python.vision.core.vision_task_running_mode import (
        VisionTaskRunningMode as RunningMode)

    model_path = os.path.join(args.workdir, MODEL_NAME)
    assert os.path.exists(model_path), f"Không thấy model: {model_path}"
    got_md5 = md5_of(model_path)
    print(f"[model] {MODEL_NAME} {os.path.getsize(model_path)} byte "
          f"md5={got_md5} (kỳ vọng {MODEL_MD5})", flush=True)
    assert got_md5 == MODEL_MD5, "Model đã đổi so với lúc tải — dừng để kiểm tra"
    print(f"[env] mediapipe {mp.__version__}", flush=True)

    t0 = time.monotonic()
    options = ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=RunningMode.IMAGE,
        output_category_mask=True,
        output_confidence_masks=True)
    segmenter = ImageSegmenter.create_from_options(options)
    print(f"[init] tạo ImageSegmenter: {time.monotonic() - t0:.2f}s", flush=True)

    person_jpg = os.path.join(SCRATCH, "person.jpg")
    img = np.asarray(Image.open(person_jpg).convert("RGB"))
    print(f"[input] person.jpg {img.shape}", flush=True)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)

    # Warmup (nạp model/lazy init) rồi mới đo.
    for _ in range(3):
        segmenter.segment(mp_image)
    times = []
    last_result = None
    t0 = time.monotonic()
    for i in range(args.frames):
        s = time.monotonic()
        last_result = segmenter.segment(mp_image)
        times.append(time.monotonic() - s)
    wall = time.monotonic() - t0
    times = np.array(times)
    maxrss_gib = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1048576.0
    speed = {"frames": args.frames, "wall_s": round(wall, 2),
             "fps": round(args.frames / wall, 2),
             "latency_mean_s": round(float(times.mean()), 4),
             "latency_median_s": round(float(np.median(times)), 4),
             "latency_min_s": round(float(times.min()), 4),
             "latency_max_s": round(float(times.max()), 4),
             "maxrss_gib": round(maxrss_gib, 3)}
    print(f"[speed] person.jpg {args.frames} lần: wall={wall:.2f}s "
          f"fps={speed['fps']} latency mean={speed['latency_mean_s']}s "
          f"median={speed['latency_median_s']}s max={speed['latency_max_s']}s "
          f"maxrss={speed['maxrss_gib']}GiB", flush=True)

    conf = last_result.confidence_masks[0]
    conf_np = np.asarray(conf.numpy_view())
    print(f"[mask] confidence mask shape={conf_np.shape} "
          f"dtype={conf_np.dtype} min={conf_np.min():.3f} max={conf_np.max():.3f} "
          f"mean={conf_np.mean():.3f}", flush=True)
    cat = last_result.category_mask
    print(f"[mask] category mask: {cat}", flush=True)
    mp_u8 = np.clip(np.rint(conf_np * 255.0), 0, 255).astype(np.uint8)
    Image.fromarray(mp_u8).save(os.path.join(args.workdir, "mediapipe-mask-A-256.png"))
    print(f"[mask] fg(>200)={float((mp_u8 > 200).mean() * 100):.1f}% "
          f"bg(<55)={float((mp_u8 < 55).mean() * 100):.1f}%", flush=True)

    results = {"model": {"file": MODEL_NAME,
                         "bytes": os.path.getsize(model_path),
                         "md5": got_md5,
                         "mediapipe_version": mp.__version__},
               "speed": speed, "comparisons": []}

    # So với u2net clip A @480 (tái dùng mask E4).
    u2net_a = os.path.join(E4_WORKDIR, "mask-A-person-u2net-480.mp4")
    assert os.path.exists(u2net_a), f"Không thấy mask u2net clip A E4: {u2net_a}"
    ref_a = read_first_gray_frame(u2net_a)
    h, w = ref_a.shape
    mp_up = np.asarray(
        Image.fromarray(mp_u8).resize((w, h), Image.Resampling.LANCZOS))
    results["comparisons"].append(
        compare_masks(mp_up, ref_a, "MediaPipe vs u2net, clip A person.jpg @480"))

    # Chân dung sáng D (nếu có mask u2net từ test F9).
    if args.d_mask:
        assert os.path.exists(args.d_mask), f"Không thấy mask D: {args.d_mask}"
        ref_d = read_first_gray_frame(args.d_mask)
        hd, wd = ref_d.shape
        mp_d = segmenter.segment(mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=np.asarray(Image.open(
                os.path.join(args.workdir, "imgs",
                             "D-portrait-white-shirt.jpg")).convert("RGB"))))
        conf_d = np.asarray(mp_d.confidence_masks[0].numpy_view())
        mp_d_u8 = np.clip(np.rint(conf_d * 255.0), 0, 255).astype(np.uint8)
        Image.fromarray(mp_d_u8).save(
            os.path.join(args.workdir, "mediapipe-mask-D-256.png"))
        mp_d_up = np.asarray(
            Image.fromarray(mp_d_u8).resize((wd, hd), Image.Resampling.LANCZOS))
        results["comparisons"].append(
            compare_masks(mp_d_up, ref_d,
                          "MediaPipe vs u2net, clip D portrait trắng @480"))
    else:
        print("[skip] không có --d-mask — bỏ qua so sánh chân dung sáng D",
              flush=True)

    with open(os.path.join(args.workdir, "results-f9-mediapipe.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("✅ TEST XONG — xem results-f9-mediapipe.json trong", args.workdir,
          flush=True)


if __name__ == "__main__":
    main()

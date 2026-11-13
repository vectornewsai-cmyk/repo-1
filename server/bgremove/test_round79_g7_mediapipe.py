#!/usr/bin/env python3
"""
Test đợt 79 G7: MediaPipe SelfieSegmenter SO VỚI u2net trên TOÀN BỘ
bộ clip chuẩn E4 (A chân dung, B cột đèn đêm, C bàn làm việc) + D
chân dung sáng — đo IoU/MAD từng clip, đủ số clip để kết luận.

Bối cảnh: F9 (đợt 78) mới đo MediaPipe trên 2 clip chân dung (A 0,819
KHÔNG đạt, D 0,9777 đạt) — chưa đủ để kết luận phạm vi. G7 đo thêm
B (vật thể chung, không phải người — MediaPipe person-only nên kỳ vọng
rớt, đây là bằng chứng giới hạn) và C (bàn làm việc, có tay người một
phần) + đo lại A @640 và D để có bộ 5 so sánh. KHÔNG sửa production,
KHÔNG tích hợp trong luồng này; chỉ đề xuất tích hợp khi có bằng chứng
đạt ngưỡng trên đủ clip.

License (đã kiểm chứng F9, không đổi): mediapipe 0.10.21 Apache-2.0;
model selfie_segmenter.tflite 249.537 byte, md5
3b2e3e1cfc7d31538caf00ff4e0fba8c, tải từ storage.googleapis.com —
model + venv đều ở scratch, KHÔNG stage. Model CHỈ tách người.

Chạy (venv SCRATCH — mediapipe KHÔNG có trong venv bgremove):
    ~/workspace/.tmp-r78f9/venv-mp/bin/python -u test_round79_g7_mediapipe.py \
        [--workdir DIR] [--frames N]

Việc làm:
  1. Nạp ImageSegmenter (IMAGE mode, Tasks API — legacy solutions đã chết
     từ mediapipe 0.10.21).
  2. Đo tốc độ: N lần segment() trên person.jpg — latency/fps/RSS.
  3. Với mỗi clip (A@480, A@640, B@480, C@480, D@480): segment ảnh gốc
     1 lần, upsample confidence mask LANCZOS về đúng shape mask u2net
     tham chiếu (tái dùng mask E4/F9 trên đĩa, cùng code/model), so
     IoU@128, MAD, |diff|>32, fg% từng bên.
  4. In bảng + ghi JSON vào <workdir>/results-g7-mediapipe.json.

Tiêu chí tham khảo (đặt trước, giống E4/F9): IoU@128 >= 0.85 và
MAD <= 15/255 (0,0588), fg lệch <= 8 điểm — trên TỪNG clip. MediaPipe
chỉ được xem xét tích hợp (dù chỉ là fast-preview chân dung) khi đạt
ngưỡng trên TẤT CẢ clip chân dung (A, D) VÀ không rớt thảm trên clip
vật thể chung theo cách làm hỏng user (B, C là bằng chứng giới hạn
person-only, không phải tiêu chí đạt/rớt bắt buộc — ghi rõ).
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
F9_WORKDIR = os.path.expanduser("~/workspace/.tmp-r78f9")
MODEL_NAME = "selfie_segmenter.tflite"
MODEL_MD5 = "3b2e3e1cfc7d31538caf00ff4e0fba8c"

# clip -> (ảnh gốc, mask u2net tham chiếu)
CLIPS = [
    ("A-person @480", os.path.join(SCRATCH, "person.jpg"),
     os.path.join(E4_WORKDIR, "mask-A-person-u2net-480.mp4")),
    ("A-person @640", os.path.join(SCRATCH, "person.jpg"),
     os.path.join(E4_WORKDIR, "mask-A-person-u2net-640.mp4")),
    ("B-p1 lamppost @480", os.path.join(SCRATCH, "p_1.jpg"),
     os.path.join(E4_WORKDIR, "mask-B-p1-u2net-480.mp4")),
    ("C-p3 desk @480", os.path.join(SCRATCH, "p_3.jpg"),
     os.path.join(E4_WORKDIR, "mask-C-p3-u2net-480.mp4")),
    ("D-portrait-white @480", os.path.join(F9_WORKDIR, "imgs",
                                           "D-portrait-white-shirt.jpg"),
     os.path.join(F9_WORKDIR, "mask-D-portrait-white-u2net-480.mp4")),
]


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
    verdict = "DAT" if out["iou"] >= 0.85 and out["mad"] <= 0.0588 else "KHONG DAT"
    print(f"[compare] {label}: IoU={out['iou']} MAD={out['mad']} "
          f"|diff|>32={out['pct_diff_gt32']}% fg MP={out['fg_pct_mediapipe']}% "
          f"fg u2net={out['fg_pct_u2net']}% -> {verdict}", flush=True)
    out["verdict"] = verdict
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=os.path.expanduser("~/workspace/.tmp-r79g7"))
    ap.add_argument("--frames", type=int, default=90)
    args = ap.parse_args()
    os.makedirs(args.workdir, exist_ok=True)

    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import (
        ImageSegmenter, ImageSegmenterOptions)
    from mediapipe.tasks.python.vision.core.vision_task_running_mode import (
        VisionTaskRunningMode as RunningMode)

    model_path = os.path.join(F9_WORKDIR, MODEL_NAME)
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

    # --- Đo tốc độ trên person.jpg (như F9) ---
    person_jpg = os.path.join(SCRATCH, "person.jpg")
    img = np.asarray(Image.open(person_jpg).convert("RGB"))
    print(f"[input] person.jpg {img.shape}", flush=True)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)
    for _ in range(3):
        segmenter.segment(mp_image)
    times = []
    t0 = time.monotonic()
    for _ in range(args.frames):
        s = time.monotonic()
        segmenter.segment(mp_image)
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

    # --- So sánh từng clip ---
    results = {"model": {"file": MODEL_NAME,
                         "bytes": os.path.getsize(model_path),
                         "md5": got_md5,
                         "mediapipe_version": mp.__version__},
               "speed": speed, "comparisons": []}
    for label, img_path, ref_mask in CLIPS:
        assert os.path.exists(img_path), f"Không thấy ảnh: {img_path}"
        assert os.path.exists(ref_mask), f"Không thấy mask u2net: {ref_mask}"
        arr = np.asarray(Image.open(img_path).convert("RGB"))
        res = segmenter.segment(
            mp.Image(image_format=mp.ImageFormat.SRGB, data=arr))
        conf = np.asarray(res.confidence_masks[0].numpy_view())
        mp_u8 = np.clip(np.rint(conf * 255.0), 0, 255).astype(np.uint8)
        ref = read_first_gray_frame(ref_mask)
        h, w = ref.shape
        mp_up = np.asarray(
            Image.fromarray(mp_u8).resize((w, h), Image.Resampling.LANCZOS))
        slug = label.split(" ")[0].split("-")[0]
        Image.fromarray(mp_u8).save(
            os.path.join(args.workdir, f"mediapipe-mask-{slug}-256.png"))
        results["comparisons"].append(compare_masks(mp_up, ref, label))

    with open(os.path.join(args.workdir, "results-g7-mediapipe.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("✅ TEST MEDIAPIPE XONG — xem results-g7-mediapipe.json trong",
          args.workdir, flush=True)


if __name__ == "__main__":
    main()

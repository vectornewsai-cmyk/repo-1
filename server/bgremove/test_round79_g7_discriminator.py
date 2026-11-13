#!/usr/bin/env python3
"""
Phân tích đợt 79 G7: có đặc trưng nào (đo được TRƯỚC khi chạy model)
phân biệt được clip u2netp ĐẠT (IoU >= 0.85) với clip RỚT không?

Bối cảnh: sau G7, u2netp đạt 4/9 clip (B 0,86; D 0,99; H 0,94; I 0,99)
và rớt 5/9 (A 0,63; C 0,69; E 0,02; F 0,58; G 0,67). F9 đã chốt KHÔNG
mở opt-in vì B và F nhìn giống nhau ("vật sáng trên nền đen") mà kết
quả trái ngược. G7 thử tìm đặc trưng đo được từ ẢNH GỐC (không cần
chạy cả 2 model — nếu phải chạy cả 2 để so thì đường "nhanh" mất ý
nghĩa) có tách được 2 nhóm không. Nếu không tách được → giữ quyết
định KHÔNG tích hợp; nếu tách được sạch → ghi rõ ngưỡng để đợt sau
kiểm chứng độc lập trên clip mới.

Đặc trưng thử (mỗi clip, trên ảnh gốc resize 480x480 giống video test):
  * fg% u2net (kích thước chủ thể)
  * độ sáng trung bình + tỉ lệ pixel tối (<55) BÊN TRONG mask u2net
    (chủ thể có bao nhiêu phần tối màu — giả thuyết: u2netp bỏ/lấy
    thừa vùng tối)
  * độ bão hòa trung bình bên trong mask u2net (HSV S)
  * độ sáng trung bình toàn ảnh + tỉ lệ pixel tối toàn ảnh
  * độ tương phản chủ thể–nền: mean luma trong mask trừ mean luma
    ngoài mask

Chạy (venv bgremove, chỉ đọc file trên đĩa — KHÔNG chạy model):
    ~/workspace/scratch-bgremove/venv/bin/python -u \
        test_round79_g7_discriminator.py [--workdir DIR]

Việc làm: với mỗi clip trong CLIPS (9 clip, mask u2net/u2netp @480 đã
có từ E4/F9/G7), đọc frame đầu của mask + ảnh gốc, tính các đặc trưng
trên, in bảng gộp theo nhóm ĐẠT/RỚT + ghi JSON. Đồng thời xuất ảnh đối
chiếu compare-{G,H,I}-480.png (gốc | u2net | u2netp | đỏ = bất đồng >32)
vào workdir để xem bằng mắt mode lỗi của từng clip mới.
"""
import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image

SCRATCH = os.path.expanduser("~/workspace/scratch-bgremove")
E4 = os.path.expanduser("~/workspace/.tmp-r77e4")
F9 = os.path.expanduser("~/workspace/.tmp-r78f9")
G7 = os.path.expanduser("~/workspace/.tmp-r79g7")

# clip -> (ảnh gốc, mask u2net @480, mask u2netp @480, IoU đã đo, verdict)
CLIPS = [
    ("A-person", os.path.join(SCRATCH, "person.jpg"),
     os.path.join(E4, "mask-A-person-u2net-480.mp4"),
     os.path.join(E4, "mask-A-person-u2netp-480.mp4"), 0.6263, "ROT"),
    ("B-p1", os.path.join(SCRATCH, "p_1.jpg"),
     os.path.join(E4, "mask-B-p1-u2net-480.mp4"),
     os.path.join(E4, "mask-B-p1-u2netp-480.mp4"), 0.8600, "DAT"),
    ("C-p3", os.path.join(SCRATCH, "p_3.jpg"),
     os.path.join(E4, "mask-C-p3-u2net-480.mp4"),
     os.path.join(E4, "mask-C-p3-u2netp-480.mp4"), 0.6898, "ROT"),
    ("D-portrait-white", os.path.join(F9, "imgs", "D-portrait-white-shirt.jpg"),
     os.path.join(F9, "mask-D-portrait-white-u2net-480.mp4"),
     os.path.join(F9, "mask-D-portrait-white-u2netp-480.mp4"), 0.9918, "DAT"),
    ("E-lighthouse-beam", os.path.join(F9, "imgs", "E-candle-dark.jpg"),
     os.path.join(F9, "mask-E-lighthouse-beam-u2net-480.mp4"),
     os.path.join(F9, "mask-E-lighthouse-beam-u2netp-480.mp4"), 0.0237, "ROT"),
    ("F-lighthouse-lamp", os.path.join(F9, "imgs", "F-lighthouse.jpg"),
     os.path.join(F9, "mask-F-lighthouse-lamp-u2net-480.mp4"),
     os.path.join(F9, "mask-F-lighthouse-lamp-u2netp-480.mp4"), 0.5845, "ROT"),
    ("G-portrait-outdoors", os.path.join(G7, "imgs", "G-portrait-outdoors.jpg"),
     os.path.join(G7, "mask-G-portrait-outdoors-u2net-480.mp4"),
     os.path.join(G7, "mask-G-portrait-outdoors-u2netp-480.mp4"), 0.6681, "ROT"),
    ("H-golden-retriever", os.path.join(G7, "imgs", "H-golden-retriever.jpg"),
     os.path.join(G7, "mask-H-golden-retriever-u2net-480.mp4"),
     os.path.join(G7, "mask-H-golden-retriever-u2netp-480.mp4"), 0.9414, "DAT"),
    ("I-red-rose-black", os.path.join(G7, "imgs", "I-red-rose-black.jpg"),
     os.path.join(G7, "mask-I-red-rose-black-u2net-480.mp4"),
     os.path.join(G7, "mask-I-red-rose-black-u2netp-480.mp4"), 0.9852, "DAT"),
]


def first_gray_frame(path):
    cap = cv2.VideoCapture(path)
    ok, f = cap.read()
    cap.release()
    assert ok, f"Không đọc được frame: {path}"
    return cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)


def compare_png(img_rgb, mask_a, mask_b, out_path):
    """gốc | u2net | u2netp | đỏ = bất đồng >32 (mẫu E4 compare-A-480.png)."""
    h, w = mask_a.shape
    orig = np.asarray(Image.open(img_rgb).convert("RGB").resize((w, h)))
    disagree = (np.abs(mask_a.astype(int) - mask_b.astype(int)) > 32)
    red = orig.copy()
    red[disagree] = [255, 0, 0]
    top = np.hstack([orig,
                     cv2.cvtColor(mask_a, cv2.COLOR_GRAY2RGB),
                     cv2.cvtColor(mask_b, cv2.COLOR_GRAY2RGB)])
    bottom = np.hstack([red, np.zeros_like(orig), np.zeros_like(orig)])
    cv2.imwrite(out_path, cv2.cvtColor(np.vstack([top, bottom]),
                                        cv2.COLOR_RGB2BGR))
    print(f"[png] {out_path}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", default=G7)
    args = ap.parse_args()
    rows = []
    for label, img_path, mask_u2, mask_p, iou, verdict in CLIPS:
        assert os.path.exists(img_path), img_path
        assert os.path.exists(mask_u2), mask_u2
        assert os.path.exists(mask_p), mask_p
        img = np.asarray(Image.open(img_path).convert("RGB").resize((480, 480)))
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
        ma = first_gray_frame(mask_u2)
        mb = first_gray_frame(mask_p)
        assert ma.shape == (480, 480) and mb.shape == (480, 480), \
            f"{label}: mask shape {ma.shape} != (480,480)"
        fg_u2 = ma > 128
        fg_p = mb > 128
        row = {
            "clip": label, "iou": iou, "verdict": verdict,
            "fg_pct_u2net": round(float(fg_u2.mean() * 100), 1),
            "fg_pct_u2netp": round(float(fg_p.mean() * 100), 1),
            # Đặc trưng đo được từ ảnh gốc + mask u2net (tham chiếu).
            "luma_in_u2net_fg_mean": round(float(gray[fg_u2].mean()), 1),
            "dark_frac_in_u2net_fg": round(float((gray[fg_u2] < 55).mean() * 100), 1),
            "sat_in_u2net_fg_mean": round(float(hsv[:, :, 1][fg_u2].mean()), 1),
            "luma_in_u2netp_fg_mean": round(float(gray[fg_p].mean()), 1),
            "dark_frac_in_u2netp_fg": round(float((gray[fg_p] < 55).mean() * 100), 1),
            "luma_all_mean": round(float(gray.mean()), 1),
            "dark_frac_all": round(float((gray < 55).mean() * 100), 1),
            "contrast_fg_minus_bg": round(
                float(gray[fg_u2].mean() - gray[~fg_u2].mean()), 1),
        }
        rows.append(row)
        print(f"[feat] {label:22s} IoU={iou:.4f} {verdict} | fg u2net "
              f"{row['fg_pct_u2net']}% u2netp {row['fg_pct_u2netp']}% | "
              f"luma_fg={row['luma_in_u2net_fg_mean']} dark_fg="
              f"{row['dark_frac_in_u2net_fg']}% sat_fg="
              f"{row['sat_in_u2net_fg_mean']} | contrast="
              f"{row['contrast_fg_minus_bg']} | luma_all="
              f"{row['luma_all_mean']} dark_all={row['dark_frac_all']}%",
              flush=True)
        if label.startswith(("G-", "H-", "I-")):
            compare_png(img_path, ma, mb,
                        os.path.join(args.workdir, f"compare-{label}-480.png"))

    print("\n[summary] nhóm ĐẠT vs RỚT (mean từng đặc trưng):", flush=True)
    for verdict in ("DAT", "ROT"):
        sub = [r for r in rows if r["verdict"] == verdict]
        keys = ["fg_pct_u2net", "luma_in_u2net_fg_mean", "dark_frac_in_u2net_fg",
                "sat_in_u2net_fg_mean", "contrast_fg_minus_bg",
                "luma_all_mean", "dark_frac_all"]
        print(f"  {verdict} (n={len(sub)}): " + " | ".join(
            f"{k}={np.mean([r[k] for r in sub]):.1f}" for k in keys), flush=True)

    with open(os.path.join(args.workdir, "results-g7-discriminator.json"), "w") as f:
        json.dump(rows, f, indent=2)
    print("✅ PHÂN TÍCH XONG — xem results-g7-discriminator.json trong",
          args.workdir, flush=True)


if __name__ == "__main__":
    main()

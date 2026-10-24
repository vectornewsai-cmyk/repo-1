#!/usr/bin/env python3
"""Tạo video rung TẦN SỐ CAO (random từng frame) — dạng rung tay thật.

Dùng: python3 test_p2_gen_shaky.py <out.mp4>
  Base 384x224: nền xám + chấm ngẫu nhiên (nhiều feature cho vidstab track)
  + vuông trắng làm marker đo centroid. Crop 320x180 tại (32+ox, 32+oy),
  ox/oy ngẫu nhiên ±12px — cửa sổ crop LUÔN nằm trong base (không tràn,
  không chỉ số âm; lỗi tràn ở bản đầu làm lệch byte stream rawvideo và mọi
  metric stabilize đo sau đó đều sai).

Lý do jitter random (không phải sin): vidstab chỉ loại chuyển động TẦN SỐ
CAO so với cửa sổ smoothing; jitter hình sin chu kỳ 7 frame là chuyển động
tần số thấp → vidstab coi là camera path có chủ ý, không khử.
"""
import subprocess
import sys

import numpy as np

BW, BH, CW, CH, N, FPS = 384, 224, 320, 180, 150, 30
rng = np.random.default_rng(7)  # seed cố định → test lặp lại được
# Rung tay THẬT = tremor TẦN SỐ CAO biên độ nhỏ (±4px, ~10Hz + ~7Hz), KHÔNG
# có drift chậm. Lý do, qua 3 lần thử sai:
# - Jitter trắng độc lập từng frame (±24px nhảy/frame): phi thực tế, vidstab
#   matcher không theo kịp → transform phân kỳ, marker văng khỏi frame.
# - Random walk mượt (drift chậm): vidstab coi là camera path có chủ ý
#   (đúng thiết kế: nó chỉ khử phần lệch khỏi path đã làm mượt) → không giảm.
# - Tremor cao tần biên độ nhỏ mới là thứ vidstab được thiết kế để khử:
#   bước từng frame nhỏ (matcher theo kịp), tần số cao hơn cửa sổ smoothing
#   (không bị coi là path), biên độ đủ lớn để đo được.
n = np.arange(N)
ox = np.round(4 * np.sin(2 * np.pi * 10 * n / FPS) + 3 * np.sin(2 * np.pi * 7 * n / FPS + 1)).astype(int)
oy = np.round(3 * np.sin(2 * np.pi * 9 * n / FPS + 2) + 2 * np.sin(2 * np.pi * 13 * n / FPS)).astype(int)

proc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
     "-s", f"{CW}x{CH}", "-r", str(FPS), "-i", "-",
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "12", sys.argv[1]],
    stdin=subprocess.PIPE)
base = np.full((BH, BW, 3), 64, dtype=np.uint8)
# Texture feature LỚN (ô cờ 20px + hình lớn) — chấm 3px bị x264 crf 23 làm
# nhòe nên vidstab track không ổn định; feature lớn mới sống qua encode.
for by in range(0, BH, 40):
    for bx in range(0, BW, 40):
        if ((bx + by) // 40) % 2 == 0:
            base[by:by + 20, bx:bx + 20] = 160
for (cx, cy, r, v) in [(60, 50, 18, 200), (320, 170, 24, 200), (300, 40, 14, 110),
                       (80, 180, 20, 110)]:
    yy, xx = np.ogrid[:BH, :BW]
    base[(yy - cy) ** 2 + (xx - cx) ** 2 <= r * r] = v
base[112:152, 182:222] = [255, 0, 0]  # vuông ĐỎ 40x40 làm marker (đo riêng
# kênh đỏ — texture xám không lọt vào mask đỏ, tránh centroid bị pha)
for i in range(N):
    x, y = 32 + int(ox[i]), 32 + int(oy[i])
    assert 0 <= x <= BW - CW and 0 <= y <= BH - CH, (x, y)
    frame = base[y:y + CH, x:x + CW]
    assert frame.shape == (CH, CW, 3), frame.shape
    proc.stdin.write(frame.tobytes())
proc.stdin.close()
proc.wait()
assert proc.returncode == 0
print(f"wrote {sys.argv[1]} ({N} frames, tremor cao tần ±7px)")

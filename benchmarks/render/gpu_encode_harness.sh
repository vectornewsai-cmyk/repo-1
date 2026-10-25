#!/usr/bin/env bash
# gpu_encode_harness.sh — Harness test GPU encode (Phase 9 R3).
#
# Phân biệt 3 tầng, đừng gộp:
#  1. Encoder có trong build FFmpeg không (ffmpeg -encoders)?
#  2. Có thiết bị phần cứng không (nvidia-smi, /dev/dri)?
#  3. Encode thật bằng encoder đó có chạy không?
# Chỉ khi cả 3 đều có mới được nói "GPU encode đã test trên phần cứng thật".
# Trên VM không GPU, kết quả đúng sẽ là: encoder có trong build nhưng
# encode thất bại vì thiếu thiết bị — và báo cáo phải ghi đúng như vậy.
#
# Chạy: bash benchmarks/render/gpu_encode_harness.sh
# Kết quả: benchmarks/results/gpu_encode.jsonl (1 JSON/encoder + 1 dòng env).
set -uo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$REPO_DIR/benchmarks/results/gpu_encode.jsonl"
TMP="$(mktemp -d)"
mkdir -p "$REPO_DIR/benchmarks/results"

{
  echo "== GPU encode harness =="
  echo "ffmpeg: $(ffmpeg -hide_banner -version 2>/dev/null | head -1)"
  echo "nvidia-smi: $(command -v nvidia-smi >/dev/null && nvidia-smi -L 2>&1 | head -1 || echo 'không có nvidia-smi')"
  echo "lspci VGA: $(lspci 2>/dev/null | grep -i 'vga\|3d' | head -2 || echo 'không có lspci hoặc không thấy VGA')"
  echo "/dev/dri: $(ls /dev/dri/ 2>/dev/null | tr '\n' ' ' || echo 'không có')"
  echo ""
}

python3 - "$OUT" "$TMP" <<'PYEOF'
import json, os, subprocess, sys

out_path, tmp = sys.argv[1], sys.argv[2]
lines = []

def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    return p.returncode, (p.stderr or "")[-500:]

# Dòng env: thiết bị nào có mặt?
env = {
    "kind": "env",
    "nvidia_smi": None,
    "dri": sorted(os.listdir("/dev/dri")) if os.path.isdir("/dev/dri") else [],
}
try:
    p = subprocess.run(["nvidia-smi", "-L"], capture_output=True, text=True, timeout=30)
    env["nvidia_smi"] = (p.stdout or p.stderr or "").strip()[:200] or None
except FileNotFoundError:
    env["nvidia_smi"] = None
lines.append(env)

# Thử encode thật từng encoder GPU.
for enc in ["h264_nvenc", "hevc_nvenc", "h264_qsv", "h264_vaapi"]:
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
           "-f", "lavfi", "-i", "testsrc2=duration=2:size=1280x720:rate=30",
           "-c:v", enc, "-pix_fmt", "yuv420p", "-f", "null", "-"]
    try:
        rc, err = run(cmd)
    except subprocess.TimeoutExpired:
        rc, err = "timeout", ""
    lines.append({"kind": "encoder", "encoder": enc, "exit_code": rc,
                  "usable": rc == 0, "stderr_tail": err.strip()[-300:]})
    print(f"{enc}: exit={rc} usable={rc == 0}")

with open(out_path, "a", encoding="utf-8") as f:
    for ln in lines:
        f.write(json.dumps(ln, ensure_ascii=False) + "\n")
print(f"\nKết quả append vào {out_path}")
PYEOF

rm -rf "$TMP"

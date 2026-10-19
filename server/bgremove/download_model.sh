#!/usr/bin/env bash
# Tải trước model birefnet-general cho rembg (chạy 1 lần trên máy user).
#
# GIẤY PHÉP — ĐÃ KIỂM CHỨNG, AN TOÀN:
#   * rembg 2.0.38: MIT (PyPI classifier "License :: OSI Approved :: MIT License")
#   * BiRefNet (gốc weights): MIT (GitHub API ZhengPeng7/BiRefNet -> "mit")
#   * File ONNX do chính project rembg (MIT) phân phối qua GitHub releases.
# Model được tải về máy cá nhân của bạn (~880MB), KHÔNG bundle vào repo.
#
# Cách dùng:  bash download_model.sh [--dir DIR]
set -euo pipefail

DIR="${HOME}/.u2net"
if [[ "${1:-}" == "--dir" && -n "${2:-}" ]]; then DIR="$2"; fi
mkdir -p "$DIR"

echo "================================================================"
echo " rembg (MIT) + birefnet-general (MIT) — an toàn thương mại"
echo " Model sẽ được tải về: $DIR (~880MB, tải 1 lần)"
echo " Nguồn: https://github.com/danielgatis/rembg/releases"
echo "================================================================"

U2NET_HOME="$DIR" python3 -c "
from rembg import new_session
s = new_session('birefnet-general')
print('Model sẵn sàng:', s.model_path if hasattr(s, 'model_path') else 'OK')
"
echo "Xong. Chạy thử:"
echo "  python3 bgremove.py --input video.mp4 --output out_alpha.mov --model-dir $DIR"

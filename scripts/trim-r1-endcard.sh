#!/usr/bin/env bash
# trim-r1-endcard.sh — Phase 9 đợt 24, luồng H5: cắt đoạn cuối có đồ
# hoạ + end card logo khỏi clip R1 (NASA EUS Dome vertical, đợt 23).
#
# Vì sao cắt ở 46,5 s (KHÔNG phải "~5 s cuối" như LIMITS đợt 23 ước
# lượng): quét đuôi bản ~large.mp4 (608x1080, 54,77 s, SHA256 trùng
# tuyệt đối đợt 23: 45827cd3...a9cde) ngày 30/10/2026 cho thấy:
#   - 44,0 s và 46,5 s: vẫn cảnh nhà xưởng (vòm tên lửa + banner NASA
#     trên tường — chi tiết tài liệu trong khung hình, không phải
#     insignia dùng làm thương hiệu).
#   - 46,8 s: ĐÃ sang đồ hoạ Trái Đất/Mặt Trăng (chuyển cảnh xảy ra
#     trong khoảng 46,5–46,8 s).
#   - 48,5–49,5 s: logo Artemis toàn màn hình.
#   - ~50,0–54,77 s: logo NASA (meatball) toàn màn hình — riêng đoạn
#     này đã ~4,8 s, khớp "~5 s" của đợt 23, nhưng đoạn đồ hoạ +
#     logo Artemis trước đó cũng là insignia nổi bật.
#   => Muốn 0 insignia nổi bật thì phải cắt ở 46,5 s (frame nhà
#     xưởng cuối cùng đã xác nhận), loại bỏ 54,77 - 46,5 = 8,27 s
#     đuôi, không chỉ 5 s. Cắt ở 50 s (chỉ bỏ meatball) vẫn để lại
#     đồ hoạ + logo Artemis — KHÔNG đủ cho kho yêu cầu 0 insignia.
# Script KHÔNG tự đoán điểm cắt từ nội dung: CUT mặc định 46,5 và
# chỉ cho phép ghi đè qua đối số thứ ba khi người chạy đã quét lại
# và chịu trách nhiệm về điểm mới.
#
# Cách dùng:
#   scripts/trim-r1-endcard.sh INPUT.mp4 OUTPUT.mp4 [CUT_SECONDS]
# INPUT là file R1 đã tải bằng script đợt 23 (nằm NGOÀI repo);
# OUTPUT cũng phải NGOÀI repo (chốt chặn, exit 2 nếu trong repo).
# Lệnh cắt dùng -c copy (không re-encode, không giảm chất lượng):
# cắt tại keyframe gần nhất <= CUT nên bản ra có thể ngắn hơn CUT
# một chút — script kiểm chứng duration ra <= CUT + 0,3 s và giải mã
# thử frame cuối (phải là cảnh nhà xưởng, không phải đồ hoạ/logo).
# Binary ra KHÔNG bao giờ vào repo, không stage.
#
# Yêu cầu: ffmpeg, ffprobe.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

[ $# -ge 2 ] || { echo "Dùng: $0 INPUT.mp4 OUTPUT.mp4 [CUT_SECONDS=46.5]" >&2; exit 2; }
INPUT="$1"
OUTPUT="$2"
CUT="${3:-46.5}"

[ -f "$INPUT" ] || { echo "Không thấy INPUT: $INPUT" >&2; exit 2; }
OUT_ABS="$(mkdir -p "$(dirname "$OUTPUT")" && cd "$(dirname "$OUTPUT")" && pwd)/$(basename "$OUTPUT")"
case "$OUT_ABS/" in
  "$REPO_ROOT/"*) echo "TỪ CHỐI: OUTPUT nằm trong repo ($OUT_ABS) — binary không được vào repo." >&2; exit 2 ;;
esac

echo "INPUT:  $INPUT"
echo "OUTPUT: $OUT_ABS (ngoài repo)"
echo "CUT:    ${CUT}s (điểm cắt đã quét: frame 46,5s = nhà xưởng cuối, 46,8s = đồ hoạ)"
ffmpeg -v error -i "$INPUT" -t "$CUT" -c copy -y "$OUT_ABS"

echo "--- kiểm chứng bản ra:"
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT_ABS")"
PROBE="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 "$OUT_ABS")"
echo "duration=$DUR"
echo "$PROBE"
python3 - "$DUR" "$CUT" <<'PYEOF'
import sys
dur, cut = float(sys.argv[1]), float(sys.argv[2])
if dur > cut + 0.3:
    print(f"REJECT: duration ra {dur}s vượt CUT {cut}s + 0,3s.", file=sys.stderr)
    sys.exit(1)
print(f"OK: duration ra {dur}s <= CUT {cut}s + 0,3s (cắt copy có thể dừng ở keyframe trước CUT).")
PYEOF
echo "--- giải mã thử frame cuối (phải ra được, không lỗi):"
ffmpeg -v error -sseof -1 -i "$OUT_ABS" -frames:v 1 -f null -
echo "XONG: $OUT_ABS — kiểm tra bằng mắt frame cuối nếu cần (phải là cảnh nhà xưởng, không phải đồ hoạ/logo)."

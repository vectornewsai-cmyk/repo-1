#!/usr/bin/env bash
# fetch-r25-i5-vertical-library.sh — Phase 9 đợt 25, luồng I5:
# Đóng gói fetch cho kho dọc phát hành (N1, N2) — chạy lại được mà
# không cần binary trong repo. KHÔNG có clip mới trong đợt này:
# hạng "cảnh quay camera thuần ngoài vũ trụ" (thiên nhiên / đô thị
# quay thật, dọc) VẪN CHƯA TÌM ĐƯỢC sau khi rà ~380 tiêu đề NASA +
# IA (xem docs/PHASE9_ROUND25_I5_VERTICAL_YUV_LIBRARY_LIMITS.md
# §5) — không hạ chuẩn để đủ số, không thêm mục giả vào script.
# Muốn thêm clip mới sau này thì thêm một khối download_one theo
# đúng mẫu N1/N2 (URL + SHA256 đầy đủ + cổng h264/dọc), kèm cập
# nhật LIMITS — không thêm URL chưa quét.
#
# Nguồn (đã xác minh lại trong đợt 25, SHA trùng tuyệt đối đợt 24):
#   N1: NASA SVS 5626, "GUARDIAN Warns Hawaii Early of Incoming
#       Kamchatka Tsunami (Vertical version)" — bản background comp
#       (chỉ lớp mô phỏng nền; KHÔNG lấy bản comp final / overlay4
#       vì mang lớp text cảnh báo). H.264 1080x1920 60fps, 43,67s.
#       Visualization khoa học (nhãn bản đồ xuyên suốt), KHÔNG phải
#       cảnh quay camera thuần — ghi rõ để người đóng gói không nhầm.
#   N2: NASA SVS 5677, "Arctic Sea Ice Minimum 2026" — bản vertical
#       1920p60. H.264 1080x1920 60fps, 53,83s. Visualization (text
#       ngày + đường trung bình 1981-2010 xuyên suốt), cũng KHÔNG
#       phải cảnh quay camera thuần.
# License: cả hai là sản phẩm của NASA Scientific Visualization
# Studio (svs.gsfc.nasa.gov, tên miền NASA) + bản mirror Wikimedia
# Commons ghi "Public domain", artist NASA SVS. Theo chính sách
# NASA, nội dung NASA "generally are not subject to copyright"
# (tác phẩm chính phủ Mỹ) — KHÔNG trích là "CC0". Ngoại lệ logo/
# insignia và nội dung bên thứ ba: quét mẫu đợt 24 không thấy.
# R1 (đợt 23, đã cắt end card ở 46,5s) KHÔNG nằm trong script này:
# fetch R1 ở scripts/fetch-r23-vertical-replacements.sh, cắt ở
# scripts/trim-r1-endcard.sh — không nhân đôi đường fetch chưa kiểm
# chứng lại trong luồng này.
#
# Cổng sau tải (bắt buộc, giống đợt 24 + thêm cổng SHA):
# ffprobe phải cho codec_name=h264 VÀ height > width; SHA256 phải
# trùng tuyệt đối với SHA ghi trong script; vi phạm thì XOÁ file,
# exit 1. CHỐT CHẶN OUTDIR trong repo: TỪ CHỐI, exit 2.
# Bài học đợt 25: SVS chập chờn — thỉnh thoảng trả "Empty reply"
# (curl 52), thỉnh thoảng stall ~10s đầu rồi mới chảy. Lần chạy đợt
# 25: N2 lỗi ở lần tải đầu, tải lại thành công ngay lần retry đầu,
# SHA trùng tuyệt đối; sau đó N1 cũng lỗi một lần rồi tải lại được
# (HEAD 200, content-length đúng 32.963.935). Vì vậy curl ở đây có
# --retry 5 --retry-all-errors, và ffprobe remote có vòng retry 3.
#
# Tải VỀ THƯ MỤC NGOÀI REPO (mặc định ~/workspace/tmp-round25-i5
# KHÔNG dùng — mặc định là /tmp/vcut-r25-i5-library; người gọi nên
# truyền OUTDIR trên đĩa bền nếu muốn giữ file, vì /tmp là tmpfs).
# Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
#
# Cách dùng:
#   scripts/fetch-r25-i5-vertical-library.sh [OUTDIR]
#   scripts/fetch-r25-i5-vertical-library.sh --check-only-svs
#
# Yêu cầu: curl, ffprobe, ffmpeg, sha256sum. Không cần API key.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UA="VCutStudio-r25-i5/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# N1/N2 — SHA256 đầy đủ, đối chiếu tuyệt đối đợt 24 (LIMITS H5 chỉ
# ghi tắt đầu/cuối; đợt 25 đã đo lại toàn bộ, xem LIMITS I5 §1).
CLIP_N1_URL='https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005626/guard_vert_background_comp_1920p60.mp4'
CLIP_N1_PAGE='https://svs.gsfc.nasa.gov/5626/'
CLIP_N1_SHA='2ede4e15356bff19274daa8728759c9d425ab1ba9f855eb34d3d90dcd3fff76a'
CLIP_N1_SIZE='32963935'
CLIP_N2_URL='https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005677/arctic_sea_ice_min_2026_vertical_1920p60.mp4'
CLIP_N2_PAGE='https://svs.gsfc.nasa.gov/5677/'
CLIP_N2_SHA='a7d8eb96a7130d3049d460c0fbecb336475e7b37816b655a9d0aa309f523a71b'
CLIP_N2_SIZE='37922134'

need() { command -v "$1" >/dev/null 2>&1 || { echo "THIẾU CÔNG CỤ: $1" >&2; exit 2; }; }
need curl; need ffprobe; need ffmpeg; need sha256sum

# Kiểm tra nhanh bản SVS qua ffprobe URL (không tải): phải h264 + dọc.
check_svs_remote() {
  local label="$1" url="$2"
  local probe codec w h attempt
  probe=""
  for attempt in 1 2 3; do
    if probe="$(ffprobe -v error -select_streams v:0 \
      -show_entries stream=codec_name,width,height \
      -show_entries format=duration \
      -of default=noprint_wrappers=1 "$url" 2>/dev/null)" && [ -n "$probe" ]; then
      break
    fi
    echo "Thử lại ffprobe remote $label (lần $attempt/3, SVS chập chờn)..." >&2
    sleep 5
  done
  [ -n "$probe" ] || { echo "REJECT SVS: không ffprobe được $label ($url) sau 3 lần thử." >&2; return 1; }
  codec="$(echo "$probe" | grep '^codec_name=' | cut -d= -f2)"
  w="$(echo "$probe" | grep '^width=' | cut -d= -f2)"
  h="$(echo "$probe" | grep '^height=' | cut -d= -f2)"
  if [ "$codec" != "h264" ] || [ "$h" -le "$w" ]; then
    echo "REJECT SVS: $label — codec=$codec khung=${w}x${h} (cần h264 + dọc)." >&2; return 1
  fi
  echo "OK svs $label codec=$codec khung=${w}x${h}"
  echo "$probe"
}

if [ "${1:-}" = "--check-only-svs" ]; then
  check_svs_remote "N1-guardian-bgvert" "$CLIP_N1_URL"
  check_svs_remote "N2-arctic-seaice-vert" "$CLIP_N2_URL"
  exit 0
fi

OUTDIR="${1:-/tmp/vcut-r25-i5-library}"
OUT_ABS="$(mkdir -p "$OUTDIR" && cd "$OUTDIR" && pwd)"
case "$OUT_ABS/" in
  "$REPO_ROOT/"*) echo "TỪ CHỐI: OUTDIR nằm trong repo ($OUT_ABS) — binary không được vào repo." >&2; exit 2 ;;
esac
echo "OUTDIR: $OUT_ABS (ngoài repo $REPO_ROOT)"

download_one() {
  local label="$1" info="$2" url="$3" dest="$4" expect_sha="$5" expect_size="$6"
  echo "== $label"
  echo "$info"
  echo "Đang tải -> $dest"
  curl -fL --retry 5 --retry-all-errors --retry-delay 10 --max-time 900 -A "$UA" -o "$dest" "$url"
  echo "--- ffprobe (cổng codec + hướng, sau tải):"
  local probe codec w h size sha
  probe="$(ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,width,height \
    -show_entries format=duration,size \
    -of default=noprint_wrappers=1 "$dest")"
  echo "$probe"
  codec="$(echo "$probe" | grep '^codec_name=' | cut -d= -f2)"
  w="$(echo "$probe" | grep '^width=' | cut -d= -f2)"
  h="$(echo "$probe" | grep '^height=' | cut -d= -f2)"
  if [ "$codec" != "h264" ]; then
    echo "REJECT SAU TẢI: $dest — codec=$codec (không phải h264), XOÁ file, exit 1." >&2
    rm -f "$dest"
    exit 1
  fi
  if [ "$h" -le "$w" ]; then
    echo "REJECT SAU TẢI: $dest — khung ${w}x${h} (không dọc: height <= width), XOÁ file, exit 1." >&2
    rm -f "$dest"
    exit 1
  fi
  size="$(stat -c%s "$dest")"
  sha="$(sha256sum "$dest" | cut -d' ' -f1)"
  if [ "$size" != "$expect_size" ]; then
    echo "CẢNH BÁO kích thước: $dest — size=$size, kỳ vọng $expect_size (SHA vẫn quyết định)." >&2
  fi
  if [ "$sha" != "$expect_sha" ]; then
    echo "REJECT SAU TẢI: $dest — SHA256=$sha, kỳ vọng $expect_sha, XOÁ file, exit 1." >&2
    rm -f "$dest"
    exit 1
  fi
  echo "--- giải mã thử frame đầu (chứng minh phát được):"
  ffmpeg -v error -i "$dest" -frames:v 1 -f null -
  echo "OK: $dest (h264, dọc ${w}x${h}, SHA trùng)"
  {
    echo "FILE: $(basename "$dest")"
    echo "LABEL: $label"
    echo "$info"
    echo "DOWNLOAD_URL: $url"
    echo "SIZE: $size"
    echo "SHA256: $sha"
    echo ""
  } >> "$OUT_ABS/LICENSES.txt"
}

: > "$OUT_ABS/LICENSES.txt"
download_one "N1-nasa-svs-guardian-tsunami-bgvert" "NASA SVS 5626 background comp (xem đầu file + LIMITS I5 §1)" "$CLIP_N1_URL" "$OUT_ABS/clip-n1-svs-guardian-bgvert.mp4" "$CLIP_N1_SHA" "$CLIP_N1_SIZE"
download_one "N2-nasa-svs-arctic-seaice-vert" "NASA SVS 5677 vertical (xem đầu file + LIMITS I5 §1)" "$CLIP_N2_URL" "$OUT_ABS/clip-n2-svs-arctic-seaice-vert.mp4" "$CLIP_N2_SHA" "$CLIP_N2_SIZE"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."
echo "CỬA SỔ ĐO PARITY (xem LIMITS I5): N1 dùng 10–12s, N2 dùng 10–12s, khung 720x1280, dissolve YUV KHỚP ở crf0/10/12/14 (phương pháp khớp màu bt709)."

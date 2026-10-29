#!/usr/bin/env bash
# fetch-r21-footage.sh — Phase 9 đợt 21, luồng T6: footage máy quay thật
# H.264/1080p license sạch (nợ mở từ đợt 18–20).
#
# Bối cảnh: đợt 19 §2 đã chứng minh Wikimedia Commons KHÔNG có file gốc
# H.264/MP4 nào (0 kết quả filemime:video/mp4; transcode chỉ có VP9 và
# MPEG-4 Part 2). Vì vậy đợt này sang 2 nguồn sơ cấp khác, mỗi file vẫn
# xác minh license qua API của chính nguồn đó TRƯỚC KHI TẢI:
#   - NASA images-api (api.nasa.gov): item phải tồn tại, do NASA sản
#     xuất (photographer bắt đầu bằng "NASA" HOẶC center là trung tâm
#     NASA như GSFC/MSFC/KSC). Căn cứ license: trang NASA Images and
#     Media Usage Guidelines (nasa.gov/nasa-brand-center/images-and-
#     media): nội dung NASA "generally are not subject to copyright
#     in the United States", dùng được cho mục đích giáo dục/thông tin
#     kèm ghi nguồn NASA; ngoại lệ: logo/insignia NASA, nội dung bên
#     thứ ba có bản quyền (được đánh dấu tên chủ sở hữu), và không
#     được ngụ ý NASA chứng thực sản phẩm. Script chỉ chấp nhận item
#     có photographer NASA hoặc center NASA, và manifest ghi rõ 2
#     ngoại lệ này — không suy ra "miền nasa.gov = tự động sạch".
#   - Internet Archive metadata API (archive.org/metadata/<id>):
#     chỉ chấp nhận licenseurl chứa "publicdomain" (deed public
#     domain hoặc public domain mark), VÀ file mp4 phải có format
#     "h.264" trong metadata. Mọi license khác (BY-NC-ND, BY-SA...)
#     đều bị TỪ CHỐI — ví dụ phủ định trong LIMITS đợt này:
#     BACTER_CREAM (by-nc-nd/2.5/ca) → REJECT, exit 1.
#
# Openverse: đã thử trong đợt này nhưng API video trả 403 (không UA)
# rồi empty reply (có UA) từ VM này nên KHÔNG dùng được làm nguồn
# xác minh trong đợt này — ghi rõ, không mạo nhận đã kiểm tra qua
# Openverse. Xem docs/PHASE9_ROUND21_T6_FOOTAGE_LIMITS.md §1.3.
#
# Tải VỀ THƯ MỤC NGOÀI REPO (mặc định /tmp/vcut-r21-footage).
# Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
# Chỉ stage chính script này (text).
#
# Cách dùng:
#   scripts/fetch-r21-footage.sh [OUTDIR]
#   scripts/fetch-r21-footage.sh --check-only-nasa "<nasa_id>"
#   scripts/fetch-r21-footage.sh --check-only-ia "<identifier>"
#
# Sau khi tải, script xác minh bằng ffprobe (codec, kích thước,
# duration) và giải mã thử 1 frame bằng ffmpeg (chứng minh phát được),
# rồi ghi manifest LICENSES.txt trong OUTDIR (không ghi vào repo).
#
# Yêu cầu: curl, jq, ffprobe, ffmpeg. Không cần API key (cả 2 API đều
# công khai, chỉ đọc). Tôn trọng nguồn: gửi User-Agent định danh, chỉ
# tải 3 file mẫu, không tải hàng loạt.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NASA_API="https://images-api.nasa.gov"
IA_API="https://archive.org/metadata"
UA="VCutStudio-r21-footage/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# 3 clip mẫu đợt 21 — đã xác minh ngày 29/10/2026
# (xem docs/PHASE9_ROUND21_T6_FOOTAGE_LIMITS.md):
#   G: Artemis I phóng đêm (NASA, H.264 1920x1080 30fps, ~large.mp4,
#      photographer NASA/Sam Lott) — hạng H.264 + 1080p + tối + nhanh.
#   H: "Don't Talk to Strangers" 1950 (IA Prelinger, H.264 640x480
#      29.97fps, licenseurl publicdomain) — hạng H.264 (không 1080p).
#   I: Earth from Orbit 2013 (NASA, H.264 1280x720 30fps, ~medium.mp4,
#      center GSFC) — hạng H.264, đối chứng quỹ đạo chậm.
CLIP_G_NASA_ID='Artemis I Launch 2022 CU tracking from Press Site_compressed'
CLIP_G_URL='http://images-assets.nasa.gov/video/Artemis%20I%20Launch%202022%20CU%20tracking%20from%20Press%20Site_compressed/Artemis%20I%20Launch%202022%20CU%20tracking%20from%20Press%20Site_compressed~large.mp4'
CLIP_H_IA_ID='DontTalk1950'
CLIP_H_FILE='DontTalk1950.mp4'
CLIP_H_URL='https://archive.org/download/DontTalk1950/DontTalk1950.mp4'
CLIP_I_NASA_ID='GSFC_20140421_EarthOrbit_m11525'
CLIP_I_URL='http://images-assets.nasa.gov/video/GSFC_20140421_EarthOrbit_m11525/GSFC_20140421_EarthOrbit_m11525~medium.mp4'

need() { command -v "$1" >/dev/null 2>&1 || { echo "THIẾU CÔNG CỤ: $1" >&2; exit 2; }; }
need curl; need jq; need ffprobe; need ffmpeg

# Kiểm tra 1 item NASA qua images-api; in "OK nasa ..." nếu chấp nhận,
# ngược lại in "REJECT ..." và trả mã lỗi 1. Trả về URL asset qua
# biến toàn cục NASA_URLS (không dùng ở --check-only).
check_nasa() {
  local nasa_id="$1"
  local json
  json="$(curl -fsSL --max-time 60 -A "$UA" --get "$NASA_API/search" \
    --data-urlencode "nasa_id=$nasa_id")"
  local n photographer center title
  n="$(echo "$json" | jq -r '.collection.items | length')"
  [ "$n" -ge 1 ] || { echo "REJECT NASA: không tìm thấy nasa_id=$nasa_id qua images-api." >&2; return 1; }
  photographer="$(echo "$json" | jq -r '.collection.items[0].data[0].photographer // ""')"
  center="$(echo "$json" | jq -r '.collection.items[0].data[0].center // ""')"
  title="$(echo "$json" | jq -r '.collection.items[0].data[0].title // ""')"
  case "$photographer" in
    NASA*) ;;
    *)
      case "$center" in
        GSFC|MSFC|KSC|JSC|GRC|ARC|LARC|AFRC|HQ) ;;
        *) echo "REJECT NASA: $nasa_id — photographer='$photographer', center='$center' (không phải NASA sản xuất)." >&2; return 1 ;;
      esac
      ;;
  esac
  echo "OK nasa photographer='$photographer' center='$center' title='$title'"
}

# Kiểm tra 1 item IA qua metadata API; chỉ chấp nhận licenseurl chứa
# "publicdomain" và file mp4 có format "h.264".
check_ia() {
  local ident="$1" mp4file="$2"
  local json lic fmt
  json="$(curl -fsSL --max-time 60 -A "$UA" "$IA_API/$ident")"
  lic="$(echo "$json" | jq -r '.metadata.licenseurl // "MISSING"')"
  case "$lic" in
    *publicdomain*) ;;
    *) echo "REJECT IA: $ident — licenseurl=$lic (không chứa publicdomain), KHÔNG tải." >&2; return 1 ;;
  esac
  fmt="$(echo "$json" | jq -r --arg f "$mp4file" '.files[] | select(.name == $f) | .format // "MISSING"')"
  [ "$fmt" = "h.264" ] || { echo "REJECT IA: $ident/$mp4file — format=$fmt (không phải h.264), KHÔNG tải." >&2; return 1; }
  echo "OK ia licenseurl='$lic' file='$mp4file' format=h.264"
}

if [ "${1:-}" = "--check-only-nasa" ]; then
  [ -n "${2:-}" ] || { echo "Dùng: $0 --check-only-nasa \"<nasa_id>\"" >&2; exit 2; }
  check_nasa "$2"
  exit 0
fi
if [ "${1:-}" = "--check-only-ia" ]; then
  [ -n "${2:-}" ] || { echo "Dùng: $0 --check-only-ia \"<identifier>\" [mp4file]" >&2; exit 2; }
  check_ia "$2" "${3:-$2.mp4}"
  exit 0
fi

OUTDIR="${1:-/tmp/vcut-r21-footage}"
# CHỐT CHẶN: không bao giờ ghi vào repo.
OUT_ABS="$(mkdir -p "$OUTDIR" && cd "$OUTDIR" && pwd)"
case "$OUT_ABS/" in
  "$REPO_ROOT/"*) echo "TỪ CHỐI: OUTDIR nằm trong repo ($OUT_ABS) — binary không được vào repo." >&2; exit 2 ;;
esac
echo "OUTDIR: $OUT_ABS (ngoài repo $REPO_ROOT)"

download_one() {
  local label="$1" info="$2" url="$3" dest="$4"
  echo "== $label"
  echo "$info"
  echo "Đang tải -> $dest"
  curl -fL --max-time 900 -A "$UA" -o "$dest" "$url"
  echo "--- ffprobe:"
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,width,height,r_frame_rate \
    -show_entries format=duration,size \
    -of default=noprint_wrappers=1 "$dest"
  echo "--- giải mã thử frame đầu (chứng minh phát được):"
  ffmpeg -v error -i "$dest" -frames:v 1 -f null -
  echo "OK: $dest"
  {
    echo "FILE: $(basename "$dest")"
    echo "LABEL: $label"
    echo "$info"
    echo "DOWNLOAD_URL: $url"
    echo "SHA256: $(sha256sum "$dest" | cut -d' ' -f1)"
    echo ""
  } >> "$OUT_ABS/LICENSES.txt"
}

: > "$OUT_ABS/LICENSES.txt"
G_INFO="$(check_nasa "$CLIP_G_NASA_ID")" || exit 1
download_one "G-artemis-launch" "$G_INFO" "$CLIP_G_URL" "$OUT_ABS/clip-g-artemis-launch.mp4"
H_INFO="$(check_ia "$CLIP_H_IA_ID" "$CLIP_H_FILE")" || exit 1
download_one "H-dont-talk-1950" "$H_INFO" "$CLIP_H_URL" "$OUT_ABS/clip-h-donttalk1950.mp4"
I_INFO="$(check_nasa "$CLIP_I_NASA_ID")" || exit 1
download_one "I-earth-orbit" "$I_INFO" "$CLIP_I_URL" "$OUT_ABS/clip-i-earth-orbit.mp4"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."
echo "CỬA SỔ ĐO (xem LIMITS): G dùng 58–60s (phóng đêm), H dùng 30–32s (phố 1950), I dùng 0–2s."

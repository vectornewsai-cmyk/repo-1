#!/usr/bin/env bash
# fetch-r22-footage.sh — Phase 9 đợt 22, luồng D: footage DỌC (9:16)
# H.264 license sạch (nợ mở từ đợt 21 T6 §6: "chưa có clip dọc H.264",
# dọc vẫn chỉ có E/F webm/ogv của R19).
#
# Bối cảnh: đợt 21 T6 đã có 3 clip ngang H.264 (NASA + IA). Đợt này
# tìm clip dọc H.264 qua cùng 2 API sơ cấp, mỗi file vẫn xác minh
# license qua API của chính nguồn đó TRƯỚC KHI TẢI:
#   - NASA images-api (api.nasa.gov): item phải tồn tại, do NASA sản
#     xuất (photographer bắt đầu bằng "NASA" HOẶC center là trung tâm
#     NASA như GSFC/MSFC/KSC/HQ). Căn cứ license: trang NASA Images
#     and Media Usage Guidelines — nội dung NASA "generally are not
#     subject to copyright in the United States", kèm 2 ngoại lệ
#     (logo/insignia NASA, nội dung bên thứ ba) như script R21.
#   - Internet Archive metadata API (archive.org/metadata/<id>):
#     chỉ chấp nhận licenseurl chứa "publicdomain" VÀ file mp4 tồn
#     tại trong metadata. Mọi license khác (BY-NC-SA, BY-NC-ND...)
#     đều bị TỪ CHỐI — ví dụ phủ định trong LIMITS đợt này:
#     VerticalGlitch (by-nc-sa/4.0) → REJECT, exit 1;
#     81314-vertical-assault-vwr (by-nc-nd/4.0) → REJECT, exit 1.
#
# KHÁC BIỆT CỐ TÌNH so với cổng R21 (ghi rõ, không giấu):
#   - R21 yêu cầu trường format của IA đúng "h.264". Cổng này KHÔNG
#     yêu cầu điều đó nữa, vì đã chứng minh trường đó không đáng tin
#     cho hạng này: 2 clip DoD đợt này có format IA là "MPEG4"
#     nhưng ffprobe sau khi tải cho codec_name=h264 thật (xem
#     LIMITS §1.2). Thay vào đó, codec được kiểm chứng bằng
#     ffprobe SAU KHI TẢI: codec phải là h264, nếu không thì XOÁ
#     file và exit 1 — kiểm chứng mạnh hơn nhãn metadata, không yếu
#     hơn. Nhãn "MPEG4" của IA được ghi lại trong LIMITS, không giấu.
#   - Cổng HƯỚNG (orientation) mới: sau khi tải, ffprobe phải cho
#     height > width (khung dọc thật), nếu không thì XOÁ file và
#     exit 1. Cổng này bắt đúng bẫy "vertical" của đợt này: video
#     timelapse Roman của NASA mô tả "vertical time-lapse" nhưng
#     bản ~small.mp4 đo được 640x360 NGANG (vertical ở đây là
#     "lắp ráp theo chiều dọc", không phải khung dọc) → loại.
#
# Tải VỀ THƯ MỤC NGOÀI REPO (mặc định /tmp/vcut-r22-footage).
# Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
# Chỉ stage chính script này + script đo + LIMITS (text).
#
# Cách dùng:
#   scripts/fetch-r22-footage.sh [OUTDIR]
#   scripts/fetch-r22-footage.sh --check-only-nasa "<nasa_id>"
#   scripts/fetch-r22-footage.sh --check-only-ia "<identifier>" [mp4file]
#
# Sau khi tải, script xác minh bằng ffprobe (codec H.264, khung dọc,
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
UA="VCutStudio-r22-footage/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# 3 clip dọc đợt 22 — đã xác minh ngày 29/10/2026
# (xem docs/PHASE9_ROUND22_D_VERTICAL_FOOTAGE_LIMITS.md):
#   J: DoD pistol qualification (IA, H.264 1080x1920 25fps, ~60s,
#      licenseurl publicdomain mark, creator U.S. Naval Hospital
#      Twentynine Palms) — quay thật ngoài trời, trường bắn sa mạc.
#   K: DoD Iwo Jima corpsmen (IA, H.264 1080x1920 23.976fps, ~65s,
#      licenseurl publicdomain mark, creator U.S. Defense Health
#      Agency) — tư liệu lưu trữ Iwo Jima, bản vertical edit (crop
#      dọc từ tư liệu ngang gốc — ghi rõ trong LIMITS).
#   L: NASA AVATAR Vertical Video (NASA HQ, H.264 608x1080 30fps,
#      ~76s, bản ~large.mp4) — video dọc khoa học Artemis II, trộn
#      footage + đồ hoạ giải thích (không phải footage thuần như J/K).
# Lưu ý nhãn IA: file mp4 của J/K có format IA là "MPEG4" (không phải
# "h.264") — codec h264 được xác minh bằng ffprobe sau tải (§1.2).
CLIP_J_IA_ID='26-0037-077-dod-111630342'
CLIP_J_FILE='26-0037-077 (DOD_111630342).mp4'
CLIP_J_URL='https://archive.org/download/26-0037-077-dod-111630342/26-0037-077%20%28DOD_111630342%29.mp4'
CLIP_K_IA_ID='26-0007-222-b-dod-111566101'
CLIP_K_FILE='26-0007-222B (DOD_111566101).mp4'
CLIP_K_URL='https://archive.org/download/26-0007-222-b-dod-111566101/26-0007-222B%20%28DOD_111566101%29.mp4'
CLIP_L_NASA_ID='Artemis II Science - AVATAR Vertical Video'
CLIP_L_URL='http://images-assets.nasa.gov/video/Artemis%20II%20Science%20-%20AVATAR%20Vertical%20Video/Artemis%20II%20Science%20-%20AVATAR%20Vertical%20Video~large.mp4'

need() { command -v "$1" >/dev/null 2>&1 || { echo "THIẾU CÔNG CỤ: $1" >&2; exit 2; }; }
need curl; need jq; need ffprobe; need ffmpeg

# Kiểm tra 1 item NASA qua images-api; in "OK nasa ..." nếu chấp nhận,
# ngược lại in "REJECT ..." và trả mã lỗi 1. (Kế thừa nguyên cổng R21.)
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
# "publicdomain" VÀ file mp4 tồn tại trong metadata. Codec H.264 KHÔNG
# kiểm tra ở đây (nhãn format IA không đáng tin cho hạng này — xem
# header) mà kiểm tra bằng ffprobe sau khi tải trong download_one.
check_ia() {
  local ident="$1" mp4file="$2"
  local json lic found
  json="$(curl -fsSL --max-time 60 -A "$UA" "$IA_API/$ident")"
  lic="$(echo "$json" | jq -r '.metadata.licenseurl // "MISSING"')"
  case "$lic" in
    *publicdomain*) ;;
    *) echo "REJECT IA: $ident — licenseurl=$lic (không chứa publicdomain), KHÔNG tải." >&2; return 1 ;;
  esac
  found="$(echo "$json" | jq -r --arg f "$mp4file" '.files[] | select(.name == $f) | .name // empty')"
  [ -n "$found" ] || { echo "REJECT IA: $ident — không có file mp4 '$mp4file' trong metadata, KHÔNG tải." >&2; return 1; }
  echo "OK ia licenseurl='$lic' file='$mp4file' (codec kiểm chứng bằng ffprobe sau tải)"
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

OUTDIR="${1:-/tmp/vcut-r22-footage}"
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
  echo "--- ffprobe (cổng codec + hướng, sau tải):"
  local probe codec w h
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
  echo "--- giải mã thử frame đầu (chứng minh phát được):"
  ffmpeg -v error -i "$dest" -frames:v 1 -f null -
  echo "OK: $dest (h264, dọc ${w}x${h})"
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
J_INFO="$(check_ia "$CLIP_J_IA_ID" "$CLIP_J_FILE")" || exit 1
download_one "J-dod-pistol" "$J_INFO" "$CLIP_J_URL" "$OUT_ABS/clip-j-dod-pistol.mp4"
K_INFO="$(check_ia "$CLIP_K_IA_ID" "$CLIP_K_FILE")" || exit 1
download_one "K-dod-iwo" "$K_INFO" "$CLIP_K_URL" "$OUT_ABS/clip-k-dod-iwo.mp4"
L_INFO="$(check_nasa "$CLIP_L_NASA_ID")" || exit 1
download_one "L-nasa-avatar-vertical" "$L_INFO" "$CLIP_L_URL" "$OUT_ABS/clip-l-nasa-avatar-vertical.mp4"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."
echo "CỬA SỔ ĐO (xem LIMITS): cặp 1 J dùng 28–30s (trường bắn), K dùng 28–30s (tư liệu Iwo Jima); cặp 2 J dùng 28–30s, L dùng 24–26s."

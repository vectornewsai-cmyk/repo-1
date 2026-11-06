#!/usr/bin/env bash
# fetch-r24-vertical-nonsSpace.sh — Phase 9 đợt 24, luồng H5:
# 2 clip dọc TRUNG TÍNH NGOÀI VŨ TRỤ cho kho phát hành (bổ sung cho
# R1/R2 đợt 23, vốn đều là vũ trụ + R2 gần như tĩnh).
#
# Nguồn (xem docs/PHASE9_ROUND24_H5_VERTICAL_LIBRARY_LIMITS.md — tên
# file LIMITS dùng ASCII VERTICAL theo quy ước repo):
#   N1: NASA SVS 5626, "GUARDIAN Warns Hawaii Early of Incoming
#       Kamchatka Tsunami (Vertical version)" — bản background comp
#       (chỉ lớp mô phỏng sóng thần trên bản đồ, KHÔNG lớp text
#       cảnh báo của bản comp final). H.264 1080x1920 60fps, 43,67s.
#       Quét mỗi 10s: 0 người, 0 vũ khí, 0 chiến tranh, 0 phỏng vấn,
#       0 logo/end card; nhãn bản đồ (Russia/Kamchatka/Alaska/Hawaii,
#       Guardian Station G027, Tidal gauges KOKB) xuyên suốt — là
#       visualization khoa học, KHÔNG phải cảnh quay camera thuần.
#   N2: NASA SVS 5677, "Arctic Sea Ice Minimum 2026" — bản vertical
#       1920p60. H.264 1080x1920 60fps, 53,83s. Quét mỗi 10s: 0 người,
#       0 vũ khí, 0 chiến tranh, 0 phỏng vấn, 0 logo/end card; text
#       "Arctic Sea Ice + ngày" và đường trung bình 1981-2010 xuyên
#       suốt — cũng là visualization, không phải cảnh quay thuần.
# License: cả hai đều là sản phẩm của NASA Scientific Visualization
# Studio (svs.gsfc.nasa.gov, tên miền NASA) và đều có bản mirror trên
# Wikimedia Commons ghi "Public domain", artist NASA SVS. Theo chính
# sách NASA, nội dung NASA "generally are not subject to copyright"
# (tác phẩm chính phủ Mỹ) — KHÔNG trích là "CC0" (xem LIMITS đợt 23
# §1.2). Hai ngoại lệ NASA vẫn áp dụng: logo/insignia và nội dung
# bên thứ ba lọt vào khung hình — quét mẫu không thấy trường hợp nào.
#
# CỔNG NASA ĐÃ SIẾT (thay đổi so với script đợt 23 — đọc kỹ):
# Script đợt 23 (fetch-r23-vertical-replacements.sh) chấp nhận item
# khi photographer bắt đầu bằng "NASA" HOẶC center là trung tâm NASA.
# Nhánh center đó là nhánh YẾU (đợt 23 §1.3 đã cảnh báo): item do bên
# thứ ba quay nhưng host tại trung tâm NASA vẫn lọt — chính clip L
# đợt 22 (photographer trống, center HQ) đã lọt qua nhánh đó rồi sau
# đó bị loại vì phỏng vấn cận mặt có tên + end card logo.
#   => Trong script này, hàm check_nasa_release() CHỈ chấp nhận nhánh
#      photographer (photographer bắt đầu bằng "NASA"); NHÁNH CENTER
#      ĐÃ BỊ XOÁ HOÀN TOÀN — không còn case center nào trong hàm.
#      Item chỉ có center (kể cả HQ/MSFC/KSC) mà photographer trống
#      hoặc không phải NASA => REJECT, exit 1.
#   => Script đợt 23 KHÔNG được dùng nữa cho quyết định phát hành;
#      nó chỉ còn giá trị đo nội bộ. Mọi clip phát hành mới phải qua
#      cổng siết này (với item images-api) hoặc xác minh SVS/Commons
#      như N1/N2 (SVS không nằm trong images-api nên cổng images-api
#      không áp dụng trực tiếp cho N1/N2 — xem LIMITS).
# Test phủ định đã chạy 30/10 (xem LIMITS §5): L
# ("Artemis II Science - AVATAR Vertical Video", photographer trống,
# center HQ) => REJECT đúng; R1, R2 (photographer NASA/...) => OK.
#
# Cổng sau tải (giống đợt 23): ffprobe phải cho codec_name=h264 VÀ
# height > width; vi phạm thì XOÁ file, exit 1.
# CHỐT CHẶN OUTDIR trong repo: TỪ CHỐI, exit 2.
#
# Tải VỀ THƯ MỤC NGOÀI REPO (mặc định /tmp/vcut-r24-nonsSpace).
# Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
#
# Cách dùng:
#   scripts/fetch-r24-vertical-nonsSpace.sh [OUTDIR]
#   scripts/fetch-r24-vertical-nonsSpace.sh --check-only-nasa "<nasa_id>"
#   scripts/fetch-r24-vertical-nonsSpace.sh --check-only-svs
#
# Yêu cầu: curl, jq, ffprobe, ffmpeg. Không cần API key.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NASA_API="https://images-api.nasa.gov"
UA="VCutStudio-r24-footage/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# 2 clip dọc ngoài vũ trụ đợt 24 — đã xác minh ngày 30/10/2026.
CLIP_N1_URL='https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005626/guard_vert_background_comp_1920p60.mp4'
CLIP_N1_PAGE='https://svs.gsfc.nasa.gov/5626/'
CLIP_N2_URL='https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005677/arctic_sea_ice_min_2026_vertical_1920p60.mp4'
CLIP_N2_PAGE='https://svs.gsfc.nasa.gov/5677/'

need() { command -v "$1" >/dev/null 2>&1 || { echo "THIẾU CÔNG CỤ: $1" >&2; exit 2; }; }
need curl; need jq; need ffprobe; need ffmpeg

# Cổng NASA SIẾT cho hạng phát hành: CHỈ nhánh photographer.
# Không còn nhánh center — xem ghi chú đầu file. Item center-only
# (photographer trống/không phải NASA) bị REJECT dù center có là HQ.
check_nasa_release() {
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
    *) echo "REJECT NASA (cổng siết, chỉ nhánh photographer): $nasa_id — photographer='$photographer', center='$center' (nhánh center đã bị loại, không còn chấp nhận)." >&2; return 1 ;;
  esac
  echo "OK nasa photographer='$photographer' center='$center' title='$title'"
}

# Kiểm tra nhanh bản SVS qua ffprobe URL (không tải): phải h264 + dọc.
check_svs_remote() {
  local label="$1" url="$2"
  local probe codec w h
  probe="$(ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,width,height \
    -show_entries format=duration \
    -of default=noprint_wrappers=1 "$url")" || { echo "REJECT SVS: không ffprobe được $label ($url)." >&2; return 1; }
  codec="$(echo "$probe" | grep '^codec_name=' | cut -d= -f2)"
  w="$(echo "$probe" | grep '^width=' | cut -d= -f2)"
  h="$(echo "$probe" | grep '^height=' | cut -d= -f2)"
  if [ "$codec" != "h264" ] || [ "$h" -le "$w" ]; then
    echo "REJECT SVS: $label — codec=$codec khung=${w}x${h} (cần h264 + dọc)." >&2; return 1
  fi
  echo "OK svs $label codec=$codec khung=${w}x${h}"
  echo "$probe"
}

if [ "${1:-}" = "--check-only-nasa" ]; then
  [ -n "${2:-}" ] || { echo "Dùng: $0 --check-only-nasa \"<nasa_id>\"" >&2; exit 2; }
  check_nasa_release "$2"
  exit 0
fi

if [ "${1:-}" = "--check-only-svs" ]; then
  check_svs_remote "N1-guardian-bgvert" "$CLIP_N1_URL"
  check_svs_remote "N2-arctic-seaice-vert" "$CLIP_N2_URL"
  exit 0
fi

OUTDIR="${1:-/tmp/vcut-r24-nonsSpace}"
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
download_one "N1-nasa-svs-guardian-tsunami-bgvert" "NASA SVS 5626 background comp (xem đầu file + LIMITS)" "$CLIP_N1_URL" "$OUT_ABS/clip-n1-svs-guardian-bgvert.mp4"
download_one "N2-nasa-svs-arctic-seaice-vert" "NASA SVS 5677 vertical (xem đầu file + LIMITS)" "$CLIP_N2_URL" "$OUT_ABS/clip-n2-svs-arctic-seaice-vert.mp4"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."
echo "CỬA SỔ ĐO PARITY (xem LIMITS): N1 dùng 10–12s, N2 dùng 10–12s, khung 720x1280, dissolve RGB24 KHỚP (MAD 0,1000)."

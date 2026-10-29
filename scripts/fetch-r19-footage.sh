#!/usr/bin/env bash
# fetch-r19-footage.sh — Phase 9 đợt 19, luồng mở rộng footage thật.
#
# Tiếp nối mẫu đợt 18 (scripts/fetch-cc0-footage.sh): tải clip quay thật
# từ Wikimedia Commons VỀ THƯ MỤC NGOÀI REPO (mặc định
# /tmp/vcut-r19-footage), KÈM KIỂM TRA LICENSE QUA API TRƯỚC KHI TẢI.
# Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
#
# Khác đợt 18: cổng chấp nhận mở rộng sang CC BY (nằm trong danh sách
# cho phép MIT/CC0/CC-BY/OFL của repo), vì đợt 19 cần clip 1080p / cảnh
# tối / chuyển động nhanh mà nhiều clip hay nhất trên Commons chỉ có
# CC BY. CC BY-SA vẫn bị TỪ CHỐI như đợt 18 (nằm ngoài danh sách
# cho phép của repo) — đã chứng minh bằng các trường hợp phủ định
# trong docs/PHASE9_ROUND19_G5_FOOTAGE_LIMITS.md.
#
# Điều kiện chấp nhận (ghi rõ, không suy đoán):
#   - License = "cc0" (kèm LicenseUrl chứa
#     creativecommons.org/publicdomain/zero), HOẶC
#   - License = "pd" (public domain, Copyrighted = False), HOẶC
#   - License bắt đầu bằng "cc-by-" nhưng KHÔNG chứa "sa" (vd
#     cc-by-3.0, cc-by-4.0), kèm LicenseUrl chứa
#     creativecommons.org/licenses/by/ — CC BY yêu cầu ghi công tác giả
#     khi phát hành lại (xem manifest LICENSES.txt).
#   - Mọi giá trị khác (CC BY-SA, CC BY-NC, "Copyrighted", thiếu
#     trường) đều bị TỪ CHỐI và script dừng với lỗi.
#
# Cách dùng:
#   scripts/fetch-r19-footage.sh [OUTDIR]
#   scripts/fetch-r19-footage.sh --check-only "File:...webm"
#
# Sau khi tải, script xác minh bằng ffprobe (codec, kích thước,
# duration) và giải mã thử 1 frame bằng ffmpeg (chứng minh phát được),
# rồi ghi manifest LICENSES.txt trong OUTDIR (không ghi vào repo).
#
# Yêu cầu: curl, jq, ffprobe, ffmpeg. Không cần API key (API Commons
# công khai, chỉ đọc). Tôn trọng Commons: gửi User-Agent định danh và
# chỉ tải 4 file mẫu, không tải hàng loạt.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API="https://commons.wikimedia.org/w/api.php"
UA="VCutStudio-r19-footage/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# 4 clip mẫu đợt 19 — đã xác minh bằng API Commons ngày 29/10/2026
# (xem docs/PHASE9_ROUND19_G5_FOOTAGE_LIMITS.md):
#   C: hill climb đua xe — 1080p, chuyển động nhanh, CC BY 3.0.
#   D: tuyết dưới đèn LED đường phố ban đêm — 1080p, cảnh tối, CC BY 4.0.
#   E: cổng Saturnina quay bằng drone, clip DỌC 1080x1920 — CC0 deed.
#   F: quảng trường St Peter, Vatican, clip DỌC 480x640 — public domain.
CLIP_C_TITLE='File:Slovenija - Hill climb car race - Gorjanci - 22.6.2014.webm'
CLIP_D_TITLE='File:Snow under LED street light in Tuntorp, Brastad.webm'
CLIP_E_TITLE='File:Puerta saturnina desde un dron (video vertical).webm'
CLIP_F_TITLE="File:View of Saint Peter's Square, Vatican.ogv"

need() { command -v "$1" >/dev/null 2>&1 || { echo "THIẾU CÔNG CỤ: $1" >&2; exit 2; }; }
need curl; need jq; need ffprobe; need ffmpeg

# Kiểm tra license của 1 file title qua API Commons; in "OK <license>"
# nếu chấp nhận, ngược lại in "REJECT ..." và trả mã lỗi 1.
check_license() {
  local title="$1"
  local json
  json="$(curl -fsSL --max-time 60 -A "$UA" --get "$API" \
    --data-urlencode "action=query" --data-urlencode "format=json" \
    --data-urlencode "prop=imageinfo" \
    --data-urlencode "iiprop=url|size|mime|extmetadata" \
    --data-urlencode "titles=$title" --data-urlencode "formatversion=2")"
  local lic lic_short lic_url copyrighted url mime artist
  lic="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.License.value // "MISSING"')"
  lic_short="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.LicenseShortName.value // "MISSING"')"
  lic_url="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.LicenseUrl.value // ""')"
  copyrighted="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.Copyrighted.value // "MISSING"')"
  url="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].url // ""')"
  mime="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].mime // ""')"
  artist="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.Artist.value // ""' | sed -e 's/<[^>]*>//g')"
  if [ "$lic" = "cc0" ]; then
    case "$lic_url" in
      *creativecommons.org/publicdomain/zero*) ;;
      *) echo "REJECT: $title — License=cc0 nhưng LicenseUrl không phải CC0 deed: $lic_url" >&2; return 1 ;;
    esac
  elif [ "$lic" = "pd" ] && [ "$copyrighted" = "False" ]; then
    : # public domain, chấp nhận
  elif [[ "$lic" == cc-by-* ]] && [[ "$lic" != *sa* ]]; then
    case "$lic_url" in
      *creativecommons.org/licenses/by/*) ;;
      *) echo "REJECT: $title — License=$lic nhưng LicenseUrl không phải deed CC BY: $lic_url" >&2; return 1 ;;
    esac
  else
    echo "REJECT: $title — License=$lic ($lic_short), Copyrighted=$copyrighted — không thuộc {cc0, pd, cc-by (không sa)}, KHÔNG tải." >&2
    return 1
  fi
  echo "OK license=$lic ($lic_short) mime=$mime artist=$artist"
  echo "URL=$url"
}

if [ "${1:-}" = "--check-only" ]; then
  [ -n "${2:-}" ] || { echo "Dùng: $0 --check-only \"File:...\"" >&2; exit 2; }
  check_license "$2"
  exit 0
fi

OUTDIR="${1:-/tmp/vcut-r19-footage}"
# CHỐT CHẶN: không bao giờ ghi vào repo.
OUT_ABS="$(mkdir -p "$OUTDIR" && cd "$OUTDIR" && pwd)"
case "$OUT_ABS/" in
  "$REPO_ROOT/"*) echo "TỪ CHỐI: OUTDIR nằm trong repo ($OUT_ABS) — binary không được vào repo." >&2; exit 2 ;;
esac
echo "OUTDIR: $OUT_ABS (ngoài repo $REPO_ROOT)"

download_one() {
  local title="$1" dest="$2"
  echo "== $title"
  local info url
  info="$(check_license "$title")" || exit 1
  echo "$info"
  url="$(echo "$info" | sed -n 's/^URL=//p')"
  [ -n "$url" ] || { echo "Không lấy được URL tải cho $title" >&2; exit 1; }
  echo "Đang tải -> $dest"
  curl -fL --max-time 600 -A "$UA" -o "$dest" "$url"
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
    echo "TITLE: $title"
    echo "SOURCE_PAGE: https://commons.wikimedia.org/wiki/$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$title")"
    echo "$info" | grep -v '^URL='
    echo "DOWNLOAD_URL: $url"
    echo "SHA256: $(sha256sum "$dest" | cut -d' ' -f1)"
    echo ""
  } >> "$OUT_ABS/LICENSES.txt"
}

: > "$OUT_ABS/LICENSES.txt"
download_one "$CLIP_C_TITLE" "$OUT_ABS/clip-c-hillclimb.webm"
download_one "$CLIP_D_TITLE" "$OUT_ABS/clip-d-snowled.webm"
download_one "$CLIP_E_TITLE" "$OUT_ABS/clip-e-puerta-vertical.webm"
download_one "$CLIP_F_TITLE" "$OUT_ABS/clip-f-vatican-vertical.ogv"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."
echo "LƯU Ý CC BY: clip C (CC BY 3.0, tác giả Jan Šefran) và clip D (CC BY 4.0, tác giả W.carter) yêu cầu ghi công khi phát hành lại."

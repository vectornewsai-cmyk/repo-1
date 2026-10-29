#!/usr/bin/env bash
# fetch-cc0-footage.sh — Phase 9 đợt 18, luồng footage thật license sạch.
#
# Tải 1–2 clip quay thật từ Wikimedia Commons VỀ THƯ MỤC NGOÀI REPO
# (mặc định /tmp/vcut-cc0-sample), KÈM KIỂM TRA LICENSE QUA API TRƯỚC
# KHI TẢI. Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
#
# Cách dùng:
#   scripts/fetch-cc0-footage.sh [OUTDIR]
#   scripts/fetch-cc0-footage.sh --check-only "File:...webm"   # chỉ kiểm tra license, không tải
#
# Điều kiện chấp nhận (ghi rõ, không suy đoán):
#   - API Commons trả License = "cc0" (kèm LicenseUrl chứa
#     creativecommons.org/publicdomain/zero), HOẶC License = "pd"
#     (public domain, Copyrighted = False).
#   - Mọi giá trị khác (CC BY, CC BY-SA, "Copyrighted", thiếu trường)
#     đều bị TỪ CHỐI và script dừng với lỗi — ví dụ đã gặp trong đợt 18:
#     "File:Video of trees.webm" nhìn qua tên tưởng CC0 nhưng API trả
#     LicenseShortName = "CC BY-SA 4.0" nên KHÔNG được dùng ở đây
#     (CC BY-SA cũng nằm ngoài danh sách cho phép MIT/CC0/CC-BY/OFL
#     của repo).
#
# Sau khi tải, script xác minh bằng ffprobe (codec, kích thước,
# duration) và giải mã thử 1 frame bằng ffmpeg (chứng minh phát được),
# rồi ghi manifest LICENSES.txt trong OUTDIR (không ghi vào repo).
#
# Yêu cầu: curl, jq, ffprobe, ffmpeg. Không cần API key (API Commons
# công khai, chỉ đọc). Tôn trọng Commons: gửi User-Agent định danh và
# chỉ tải 2 file mẫu nhỏ, không tải hàng loạt.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API="https://commons.wikimedia.org/w/api.php"
UA="VCutStudio-cc0-fetch/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# Cặp mẫu mặc định — đã xác minh bằng API Commons ngày 28/10/2026
# (xem docs/PHASE9_ROUND18_CC0_FOOTAGE_LIMITS.md):
#   A: "Common swifts..." — chim yến bay, quay thật, 1280x720, ~6,0 s,
#      ~0,8 MB, License=pd, Copyrighted=False, tác giả WrS.tm.pl.
#   B: "Przejazd wozów strażackich..." — xe cứu hỏa trên phố, quay thật,
#      1280x720, ~11,3 s, ~9,8 MB, License=pd, Copyrighted=False,
#      cùng tác giả. Cả hai đều là footage máy quay thật, không phải
#      test pattern tổng hợp.
SAMPLE_A_TITLE='File:Common swifts. Hubala residetials in Tomaszow Mazowiecki, Lodz Voivodeship, Poland, CC0.ogv'
SAMPLE_B_TITLE='File:Przejazd wozów strażackich przez ulicę Warszawską w Tomaszowie Mazowieckim, PL, EU, CC0.ogv'

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
  local lic lic_short lic_url copyrighted url mime
  lic="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.License.value // "MISSING"')"
  lic_short="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.LicenseShortName.value // "MISSING"')"
  lic_url="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.LicenseUrl.value // ""')"
  copyrighted="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].extmetadata.Copyrighted.value // "MISSING"')"
  url="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].url // ""')"
  mime="$(echo "$json" | jq -r '.query.pages[0].imageinfo[0].mime // ""')"
  if [ "$lic" = "cc0" ]; then
    case "$lic_url" in
      *creativecommons.org/publicdomain/zero*) ;;
      *) echo "REJECT: $title — License=cc0 nhưng LicenseUrl không phải CC0 deed: $lic_url" >&2; return 1 ;;
    esac
  elif [ "$lic" = "pd" ] && [ "$copyrighted" = "False" ]; then
    : # public domain, chấp nhận
  else
    echo "REJECT: $title — License=$lic ($lic_short), Copyrighted=$copyrighted — không thuộc {cc0, pd}, KHÔNG tải." >&2
    return 1
  fi
  echo "OK license=$lic ($lic_short) mime=$mime"
  echo "URL=$url"
}

if [ "${1:-}" = "--check-only" ]; then
  [ -n "${2:-}" ] || { echo "Dùng: $0 --check-only \"File:...\"" >&2; exit 2; }
  check_license "$2"
  exit 0
fi

OUTDIR="${1:-/tmp/vcut-cc0-sample}"
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
  curl -fL --max-time 300 -A "$UA" -o "$dest" "$url"
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
download_one "$SAMPLE_A_TITLE" "$OUT_ABS/clip-a-swifts.ogv"
download_one "$SAMPLE_B_TITLE" "$OUT_ABS/clip-b-firetrucks.ogv"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."

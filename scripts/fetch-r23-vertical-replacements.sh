#!/usr/bin/env bash
# fetch-r23-vertical-replacements.sh — Phase 9 đợt 23, luồng G6:
# clip dọc H.264 THAY THẾ cho J/K/L đợt 22 trong kho phát hành.
#
# Bối cảnh (xem docs/PHASE9_ROUND23_G6_FOOTAGE_RELEASE_REVIEW_LIMITS.md):
# đợt 22 kết luận J/K/L chỉ an toàn để đo trong /tmp, không đưa vào
# kho phát hành được: J có người nhận diện được + vũ khí (trường bắn),
# K là tư liệu chiến tranh nhạy cảm, L — sau khi rà soát toàn clip đợt
# này — hoá ra chủ yếu là phỏng vấn cận mặt có tên (Dr. Lisa Carnell)
# + end card logo NASA, không còn "sạch nhất" như LIMITS đợt 22 tưởng
# (đợt 22 chỉ nhìn 3 frame). Cả 3 đều CẦN thay thế cho mục đích phát
# hành (vẫn giữ được để đo nội bộ trong /tmp, không xoá).
#
# Hai clip thay thế đợt này đều qua API sơ cấp NASA images-api, đều
# qua NHÁNH MẠNH của cổng (photographer bắt đầu bằng "NASA", không
# phụ thuộc nhánh center yếu như clip L đợt 22):
#   R1: EUS STA FWD Dome Progress - Vertical (MSFC, NASA/Sam Lott and
#       Brandon Hancock, 2025-03-14) — "Originally edited for a social
#       media post as a vertical video": công nghiệp hàn/vận chuyển vòm
#       tên lửa, người chỉ xuất hiện xa/mũ bảo hộ quay lưng, không mặt
#       nhận diện được. Lưu ý trung thực: cuối clip (~5s cuối) có đồ
#       hoạ + end card logo NASA toàn màn hình — nếu kho phát hành
#       yêu cầu 0 insignia nổi bật thì cắt bỏ đoạn cuối này khi đóng
#       gói (script tải nguyên bản, không tự cắt — quyết định thuộc
#       về bước đóng gói, ghi rõ trong LIMITS).
#   R2: Full Moon Rising Over Full Artemis II Stack at Launch Pad 39B
#       vertical (MSFC, NASA/Sam Lott, 2026-02-05) — trăng tròn mọc sau
#       tháp Artemis II tại bệ 39B: KHÔNG CÓ NGƯỜI trong toàn bộ mẫu
#       quét 6s (0–86s), không vũ khí, không chiến tranh — sạch nhất
#       trong các clip dọc từng đo.
# Cả 2 bản ~large.mp4 đều đã đo bằng ffprobe qua URL trước khi viết
# script: H.264, 608×1080, 30fps (xem LIMITS). Bản ~small.mp4
# (270×480) đã tải + quét contact sheet đợt này; script này tải bản
# ~large để dùng làm asset (chất lượng cao hơn small).
#
# Cổng kiểm tra (kế thừa mẫu R22, rút gọn cho nguồn NASA):
#   - --check-only-nasa "<nasa_id>": item phải tồn tại qua images-api
#     VÀ photographer bắt đầu bằng "NASA" HOẶC center là trung tâm
#     NASA. Cổng phủ định đã kiểm chứng lại đợt này: IA
#     VerticalGlitch (BY-NC-SA) và 81314-vertical-assault-vwr
#     (BY-NC-ND) vẫn REJECT qua script R22 (không tải) — cổng
#     license không nể nang tên file chứa "vertical".
#   - Cổng sau tải (mới nào cũng có): ffprobe phải cho codec_name=h264
#     VÀ height > width (khung dọc thật); vi phạm thì XOÁ file và
#     exit 1. Bẫy "vertical" của R22 (timelapse Roman 640×360 ngang)
#     vẫn bị cổng này bắt nếu ai đó đưa nhầm vào fetch.
#   - CHỐT CHẶN OUTDIR trong repo: TỪ CHỐI, exit 2.
#
# Tải VỀ THƯ MỤC NGOÀI REPO (mặc định /tmp/vcut-r23-replacements).
# Binary tải về KHÔNG BAO GIỜ nằm trong repo và KHÔNG được stage.
# Chỉ stage chính script này + harness click-test + LIMITS (text).
#
# Cách dùng:
#   scripts/fetch-r23-vertical-replacements.sh [OUTDIR]
#   scripts/fetch-r23-vertical-replacements.sh --check-only-nasa "<nasa_id>"
#
# Yêu cầu: curl, jq, ffprobe, ffmpeg. Không cần API key (API công khai,
# chỉ đọc). Tôn trọng nguồn: gửi User-Agent định danh, chỉ tải 2 file
# mẫu, không tải hàng loạt.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NASA_API="https://images-api.nasa.gov"
UA="VCutStudio-r23-footage/1.0 (research sample; contact via repo vectornewsai-cmyk/repo-1)"

# 2 clip dọc thay thế đợt 23 — đã xác minh ngày 30/10/2026
# (xem docs/PHASE9_ROUND23_G6_FOOTAGE_RELEASE_REVIEW_LIMITS.md).
CLIP_R1_NASA_ID='SLS-5321_MSFC_EUS STA FWD Dome Progress Vertical VOTY 2025 Entry'
CLIP_R1_URL='http://images-assets.nasa.gov/video/SLS-5321_MSFC_EUS%20STA%20FWD%20Dome%20Progress%20Vertical%20VOTY%202025%20Entry/SLS-5321_MSFC_EUS%20STA%20FWD%20Dome%20Progress%20Vertical%20VOTY%202025%20Entry~large.mp4'
CLIP_R2_NASA_ID='Artemis II at the pad Full Snow Moon 02012026 vertical stablized'
CLIP_R2_URL='http://images-assets.nasa.gov/video/Artemis%20II%20at%20the%20pad%20Full%20Snow%20Moon%2002012026%20vertical%20stablized/Artemis%20II%20at%20the%20pad%20Full%20Snow%20Moon%2002012026%20vertical%20stablized~large.mp4'

need() { command -v "$1" >/dev/null 2>&1 || { echo "THIẾU CÔNG CỤ: $1" >&2; exit 2; }; }
need curl; need jq; need ffprobe; need ffmpeg

# Kiểm tra 1 item NASA qua images-api; in "OK nasa ..." nếu chấp nhận,
# ngược lại in "REJECT ..." và trả mã lỗi 1. (Kế thừa nguyên cổng R22:
# photographer bắt đầu bằng "NASA" HOẶC center là trung tâm NASA.)
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

if [ "${1:-}" = "--check-only-nasa" ]; then
  [ -n "${2:-}" ] || { echo "Dùng: $0 --check-only-nasa \"<nasa_id>\"" >&2; exit 2; }
  check_nasa "$2"
  exit 0
fi

OUTDIR="${1:-/tmp/vcut-r23-replacements}"
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
R1_INFO="$(check_nasa "$CLIP_R1_NASA_ID")" || exit 1
download_one "R1-nasa-eus-dome-vertical" "$R1_INFO" "$CLIP_R1_URL" "$OUT_ABS/clip-r1-nasa-eus-dome-vertical.mp4"
R2_INFO="$(check_nasa "$CLIP_R2_NASA_ID")" || exit 1
download_one "R2-nasa-moon-artemis-pad-vertical" "$R2_INFO" "$CLIP_R2_URL" "$OUT_ABS/clip-r2-nasa-moon-artemis-pad-vertical.mp4"
echo "XONG. Manifest: $OUT_ABS/LICENSES.txt"
echo "LƯU Ý: các file trên CHỈ nằm ở $OUT_ABS — không đưa vào repo, không stage."
echo "CỬA SỔ ĐO PARITY (xem LIMITS): R1 dùng 20–22s, R2 dùng 10–12s, khung 720x1280, dissolve RGB24 KHỚP (MAD 0,0050)."

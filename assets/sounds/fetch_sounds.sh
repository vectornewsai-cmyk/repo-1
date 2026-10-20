#!/usr/bin/env bash
# fetch_sounds.sh — Tải kho sound effects CC0 cho VCut Studio.
#
# Nguồn chính: romainsimon/uisfx (GitHub)
#   - 936 file OGG: 12 packs x 78 cues
#   - Audio: CC0 1.0 Universal (LICENSE-AUDIO trong repo gốc)
#   - Đã đọc trực tiếp: https://raw.githubusercontent.com/romainsimon/uisfx/main/LICENSE-AUDIO
#   - "dedicated to the public domain... including for commercial purposes,
#      without asking permission. Attribution is appreciated but not required."
#
# Không tải binary lên git — script này chạy 1 lần sau khi clone,
# file OGG nằm trong assets/audio/ (đã có trong .gitignore mẫu media).
#
# Cách dùng:
#   bash assets/sounds/fetch_sounds.sh            # tải toàn bộ (936 file, ~4MB)
#   bash assets/sounds/fetch_sounds.sh --pack ui  # chỉ tải 1 pack
#   bash assets/sounds/fetch_sounds.sh --dry-run  # liệt kê, không tải
set -euo pipefail
cd "$(dirname "$0")"

REPO="romainsimon/uisfx"
REF="main"
BASE="https://raw.githubusercontent.com/${REPO}/${REF}/packages/uisfx/sounds"
OUT="../audio"

PACKS=(minimal soft glass arcade mechanical organic dreamy scifi rubber cinematic studio zen)

# 78 cues — khớp 1:1 với taxonomy của uisfx (xem assets/sounds/index.json)
CUES=(achievement add-to-cart back badge blocked bonus cancel check checkout checkpoint
close collapse complete connect connecting copy coupon delete deselect disconnect
double-click drag-start drop error expand focus forward hover info invalid-drop
level-up loading lock long-press mention notification open paste pause play press
processing progress-step purchase queued reaction receive recording redo refund
release remove-from-cart reorder retry reward scanning seek select send skip-next
skip-previous sleep snap start stop streak streaming success swipe toggle-off
toggle-on typing uncheck undo unlock volume-change wake warning)

DRY_RUN=0
ONLY_PACK=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --pack) shift ;;
    --pack=*) ONLY_PACK="${arg#--pack=}" ;;
  esac
done
# hỗ trợ: --pack <tên>
if [[ "${1:-}" == "--pack" && -n "${2:-}" ]]; then ONLY_PACK="$2"; fi

if [[ -n "$ONLY_PACK" ]]; then
  ok=0; for p in "${PACKS[@]}"; do [[ "$p" == "$ONLY_PACK" ]] && ok=1; done
  if [[ "$ok" -eq 0 ]]; then echo "Pack không hợp lệ: $ONLY_PACK"; echo "Chọn: ${PACKS[*]}"; exit 2; fi
  PACKS=("$ONLY_PACK")
fi

mkdir -p "$OUT"
total=0; ok_count=0; skip_count=0; fail_count=0

for pack in "${PACKS[@]}"; do
  for cue in "${CUES[@]}"; do
    total=$((total+1))
    dest="$OUT/uisfx-${pack}-${cue}.ogg"
    url="$BASE/$pack/$cue.ogg"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "$dest  <-  $url"
      continue
    fi
    if [[ -f "$dest" && -s "$dest" ]]; then
      skip_count=$((skip_count+1)); continue
    fi
    if curl -sSL --fail --retry 2 --max-time 30 -o "$dest.tmp" "$url"; then
      # kiểm tra file OGG hợp lệ (magic bytes "OggS")
      if head -c 4 "$dest.tmp" | grep -q "OggS"; then
        mv "$dest.tmp" "$dest"
        ok_count=$((ok_count+1))
      else
        echo "WARN: $url không phải OGG hợp lệ, bỏ qua"
        rm -f "$dest.tmp"; fail_count=$((fail_count+1))
      fi
    else
      echo "WARN: tải thất bại $url"
      rm -f "$dest.tmp"; fail_count=$((fail_count+1))
    fi
  done
done

if [[ "$DRY_RUN" -eq 1 ]]; then echo "Tổng: $total file (dry-run, chưa tải)."; exit 0; fi

echo "==================================="
echo "Tải xong: $ok_count mới, $skip_count đã có, $fail_count lỗi / tổng $total"
echo "Thư mục: $OUT"

# SHA256 manifest (để kiểm tra toàn vẹn sau này)
if command -v sha256sum >/dev/null 2>&1; then
  ( cd "$OUT" && sha256sum uisfx-*.ogg 2>/dev/null | sort > ../sounds/SHA256SUMS.txt )
  echo "Đã ghi SHA256 manifest: assets/sounds/SHA256SUMS.txt"
fi

# kiểm tra nhanh bằng ffprobe nếu có
if command -v ffprobe >/dev/null 2>&1; then
  bad=0
  for f in "$OUT"/uisfx-*.ogg; do
    ffprobe -v error -show_entries stream=codec_name -of csv=p=0 "$f" >/dev/null 2>&1 || { echo "WARN ffprobe: $f"; bad=$((bad+1)); }
  done
  echo "ffprobe: $bad file lỗi (0 là đạt)"
fi

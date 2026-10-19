#!/bin/bash
# Tải các tài nguyên lớn (>128KB) không thể push trực tiếp lên GitHub qua API.
# Chạy 1 lần sau khi clone repo:  bash assets/fetch_large_assets.sh
#
# - 10 LUT .cube: tải tự động từ cartesiancs/cartcut (MIT) + kiểm tra SHA256.
# - 12 file OGG (CC0, Kenney): xem hướng dẫn thủ công ở cuối script
#   (kenney.nl dùng link download qua trang trung gian, không script được ổn định).
set -euo pipefail
cd "$(dirname "$0")"

BASE="https://raw.githubusercontent.com/cartesiancs/cartcut/main/assets/presets/luts"
declare -A LUTS=(
  [blockbuster]="8e48086b9851477273bc7d0594f1cb59b76a4db456bcc01d39e989f630ea8126"
  [faded-seventies]="4be395568a8a935d707a1a3afab9aa4c9fb46ec60ba817bcda7379f0acfef5ca"
  [golden-hour]="70e35bc7af6fb673cfdb16625846ac145743bfe05b829885d94c060f7714e64c"
  [honey]="f5e25f8dfc59fd6d6b2bf161178bdb82a96ad58973d5f3f347a5450bb21294d5"
  [mono-neutral]="b98b98341edf05537fef918786e99444dca52df460690c7fdccfd9f9530cb12a"
  [nordic-noir]="78f8256ae910d823469f1de591d1d47c1d63af9f922e6fc35f66332e010662a9"
  [ocean]="c70c6732bca4f1751129c96bb80299a23144b81cdb1287f54d88184c08890ff9"
  [super-eight]="b9d2d5ba9cba9e47b92310e8a3c790fca6c1b2f117fc88b33694a6a3a42f8ff3"
  [teal-orange]="3c173127159b2d00db368d369171f15fff0bdd1cb3ba0d961c2a7d7a0fd0ba73"
  [winter-blue]="867bdced41b9a7e367245bac87c5f23872c55f4948ac4b71474b0d43ab207aa0"
)

echo "== Tải 10 LUT (cartcut, MIT) =="
mkdir -p filters
for name in "${!LUTS[@]}"; do
  out="filters/cartcut-${name}.cube"
  if [ -f "$out" ]; then echo "  có sẵn: $out"; continue; fi
  curl -fsSL "$BASE/$name/lut.cube" -o "$out"
  echo "${LUTS[$name]}  $out" | sha256sum -c - \
    || { echo "LỖI checksum: $out"; exit 1; }
  echo "  ok: $out"
done

cat <<'EOF'

== 12 file âm thanh OGG (CC0, Kenney) — làm thủ công 2 phút ==
Do kenney.nl dùng trang download trung gian nên không tải tự động ổn định được.
1. Tải 3 pack (miễn phí, CC0) tại:
   - https://kenney.nl/assets/interface-sounds  -> click_001, pluck_001, select_001,
     confirmation_001, error_001, maximize_001.ogg
   - https://kenney.nl/assets/impact-sounds     -> impactPlate_heavy_000,
     impactMetal_heavy_001.ogg
   - https://kenney.nl/assets/sci-fi-sounds     -> forceField_000, thrusterFire_000,
     laserSmall_002, explosionCrunch_000.ogg
2. Giải nén, đổi tên theo quy tắc kenney-<pack>-<tên gốc>.ogg
   (ví dụ: interface-sounds/click_001.ogg -> kenney-interface-click_001.ogg)
3. Chép 12 file vào assets/audio/
Chi tiết nguồn + giấy phép từng file: xem assets/SOURCES.md
EOF
echo "Xong."

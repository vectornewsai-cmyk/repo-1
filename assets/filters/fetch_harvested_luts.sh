#!/bin/bash
# fetch_harvested_luts.sh — Tải 42 LUT harvest từ GitHub (MIT/CC-BY-4.0).
# Chạy 1 lần sau khi clone repo:  bash assets/filters/fetch_harvested_luts.sh
#
# Nguồn (license đã verify 2026-10-19):
#  - slaycamera/luts (CC-BY-4.0): 5 LUT điện ảnh gốc
#  - joinfiber/derby-film (MIT): 7 film look
#  - TrondW/glassmeter-film-looks (CC-BY-4.0): 30 film simulation
# Xem chi tiết attribution trong assets/SOURCES.md
set -euo pipefail
cd "$(dirname "$0")"

declare -A LUTS=(
  ["derby-acid.cube"]="4d6aa2ac5757a4e05e5cfbf8ae5d074f27ab1dfdf9a34be06745a0c0674e0f95|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/ACID.cube"
  ["derby-after.cube"]="246eef96aa6c25bce027e2e02be7e888fb77746b30fbd73819c643098c3694b5|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/AFTER.cube"
  ["derby-club.cube"]="38b95541027d76155e438372d36f7c3723c3549b7781fac5cf61a76b120a7e7a|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/CLUB.cube"
  ["derby-fever.cube"]="6971461a89387e642d52d1684cd20d3178560f298513c0453dfb0c3d3a653863|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/FEVER.cube"
  ["derby-flash.cube"]="aee5c4307e8af71aa6e34448d9f3c90783e1047d176289a7422095c697b29e2e|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/FLASH.cube"
  ["derby-hush.cube"]="0a91d8281e1925f49bfb8b5dfdc5012310f283e9d0877a2e6d8921cb78eb5ca1|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/HUSH.cube"
  ["derby-rush.cube"]="f5fd221ba184e82c15c7f688205547d3268d8b9201e10e1108d6222d298d17e9|https://raw.githubusercontent.com/joinfiber/derby-film/main/looks/RUSH.cube"
  ["glassmeter-cinestill-400d.cube"]="fdeffcc07998673b44c2c4f215a189796149c2816792a52488586dfe7d67dca3|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/cinestill-400d.cube"
  ["glassmeter-cinestill-50d.cube"]="e6ded0d627b9b448f110121eac4bcf58b8caf918f53f862fad01472112ee9cb3|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/cinestill-50d.cube"
  ["glassmeter-cinestill-800t.cube"]="e880cb3b59d5723d1332542440e13b3691d571069104b4b132e26c7227c3f704|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/cinestill-800t.cube"
  ["glassmeter-fuji-acros-100-ii.cube"]="6f7550ac18d601431ea4568aa1766dc53aaa906fa4f5b7fc63e4c1c64589139a|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-acros-100-ii.cube"
  ["glassmeter-fuji-industrial-100.cube"]="64f047a8db8701072a11b1726b7bfe54b0eb63d199dadd2fdc079e770d2eace4|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-industrial-100.cube"
  ["glassmeter-fuji-pro-400h.cube"]="b5dd772fff8d22f5e015daf9272f20fc3e67b455603f418f13095764e3d617be|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-pro-400h.cube"
  ["glassmeter-fuji-provia-100f.cube"]="7ae1cd62b5396c440d2524b1b1f533de2a5200186e79bfb7732777a479cf08a9|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-provia-100f.cube"
  ["glassmeter-fuji-superia-xtra-400.cube"]="36aff3ef9071def0ae3136473a4725ed500a05b18cfcd6125ffe905f2d4cff93|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-superia-xtra-400.cube"
  ["glassmeter-fuji-velvia-100.cube"]="41eec9c5ecfd7943a0140c86b4c9294ca44e840134d64a21d5a49428f4079913|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-velvia-100.cube"
  ["glassmeter-fuji-velvia-50.cube"]="3d7a2d7f586aac65811b5083666f491bf83265c35a8b2f297b1f522f50a6c82b|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/fuji-velvia-50.cube"
  ["glassmeter-ilford-delta-100-v2.cube"]="49308c3f594246062b26c56774e8ee4caad5c0dbe44024300fa410014c1a06be|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-delta-100-v2.cube"
  ["glassmeter-ilford-delta-3200-v2.cube"]="89c93a45f685654f6fefcaaedd14e610b3c56824f1892871c205934304a88722|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-delta-3200-v2.cube"
  ["glassmeter-ilford-delta-400.cube"]="d44e5bc73cd38e1e2d8167d1a6aecfc32050e4e72a6d739b64c3424b0e47a776|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-delta-400.cube"
  ["glassmeter-ilford-fp4-125-v2.cube"]="5e6060740c984ae7c81644c6824445542489811f145b3c8e9d6fc2d59be8a134|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-fp4-125-v2.cube"
  ["glassmeter-ilford-hp5-400-v2.cube"]="7cab9e01d5d650cb7ae8e4649116f1765a3341b9d4e271b58185b38b8e01774c|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-hp5-400-v2.cube"
  ["glassmeter-ilford-panf-50.cube"]="ee7106e939d3863414a904e87290034a9d53a7a46d69e362daf52643dc02ece6|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-panf-50.cube"
  ["glassmeter-ilford-xp2-super-400.cube"]="bd182b6dae1c7fcf6378d2ddf17796d228430436c739d22b8b2df4dbe85f175c|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/ilford-xp2-super-400.cube"
  ["glassmeter-kodak-colorplus-200.cube"]="4a2bda2f149f4105cbfd4f8ee72390cf4c5e5ef863121cfe567bde8d8f358869|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-colorplus-200.cube"
  ["glassmeter-kodak-double-x-v2.cube"]="04ca1b49b27254346b89128ebe42afba887b54d7eff055a78f5e7d880e33d550|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-double-x-v2.cube"
  ["glassmeter-kodak-ektachrome-e100.cube"]="17fe6bf23e434c0e596cdaf67e7049b268624137d180eb6dd74c27c94fb7ced5|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-ektachrome-e100.cube"
  ["glassmeter-kodak-ektar-100.cube"]="fdbb746bd5318f5d52c244bde418e673af373a228e3f1281df3de9b1703ea8e8|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-ektar-100.cube"
  ["glassmeter-kodak-gold-200.cube"]="493962ab7840f19b51f42a831493cdd088b3fb913ff6166d7726b21527c0e3f0|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-gold-200.cube"
  ["glassmeter-kodak-portra-160.cube"]="4aed280d6bdccc6bc4595773018e4668506d06e5f6b311c6c21b2d9a1a363e22|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-portra-160.cube"
  ["glassmeter-kodak-portra-400.cube"]="aaf732dd2e9f1e49c55ff10f653e59800c0e3399ac6f36775518ae1cfdd7cb0d|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-portra-400.cube"
  ["glassmeter-kodak-portra-800.cube"]="c6732394defa5b24d0c1fc9bea6b6dcf2a7726eba483ad0e6eb3560231fe4221|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-portra-800.cube"
  ["glassmeter-kodak-tmax-100-v2.cube"]="475d562bd5bdec4c0669d18b041750234665d13c3ea0654e71a04e99169b898a|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-tmax-100-v2.cube"
  ["glassmeter-kodak-tmax-400-v2.cube"]="24c6dd625b00af646e7ba518be4f0794e0c3cc75ca1f0299e475de214ea7d14f|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-tmax-400-v2.cube"
  ["glassmeter-kodak-tmax-p3200.cube"]="5be21f953d2fa33b159516f49bb37f3a8e3a332ce77e2dd5639d239696afb91a|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-tmax-p3200.cube"
  ["glassmeter-kodak-trix-400-v2.cube"]="fe328c548a492abfb0b06356fa9732030c065562cb4dc8f32eed38b67733fd90|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-trix-400-v2.cube"
  ["glassmeter-kodak-ultramax-400.cube"]="2c27cc9f5657170ca069262692459356cca575d3834873e0995c8ef9bfe7c2f4|https://raw.githubusercontent.com/TrondW/glassmeter-film-looks/main/luts/cube-srgb-33/kodak-ultramax-400.cube"
  ["slay-amber.cube"]="5912a5761bb9663901ae1a311add997055390e94972f77fe32407d88dca20b08|https://raw.githubusercontent.com/slaycamera/luts/main/luts/slay-01-amber.cube"
  ["slay-fade.cube"]="0fc029d88a11c13abad35729c4a665ccd4bccfe8fb841d89874ab6c74651dc96|https://raw.githubusercontent.com/slaycamera/luts/main/luts/slay-02-fade.cube"
  ["slay-film.cube"]="d846f24a0ce3affbeaa5f3969b0dde5b54018a9aedf7e46614bf963fffbf4738|https://raw.githubusercontent.com/slaycamera/luts/main/luts/slay-04-film.cube"
  ["slay-neon.cube"]="07ac89f666c74e638d79fb28f4de5a5e18ae47bfc9ba04bb5c50e005555e7141|https://raw.githubusercontent.com/slaycamera/luts/main/luts/slay-03-neon.cube"
  ["slay-portrait.cube"]="432898146d41e061db1d36d37f89130d1394fb9f4eb13e80630e18e10d2cc895|https://raw.githubusercontent.com/slaycamera/luts/main/luts/slay-05-portrait.cube"
)
echo "== Tải 42 LUT harvest (MIT/CC-BY-4.0) =="
for fname in "${!LUTS[@]}"; do
  if [ -f "$fname" ]; then echo "  có sẵn: $fname"; continue; fi
  entry="${LUTS[$fname]}"
  sha="${entry%%|*}"
  url="${entry#*|}"
  curl -fsSL "$url" -o "$fname"
  echo "$sha  $fname" | sha256sum -c - \
    || { echo "LỖI checksum: $fname"; exit 1; }
  echo "  ok: $fname"
done
echo "Xong! 42 LUT đã sẵn sàng trong assets/filters/"

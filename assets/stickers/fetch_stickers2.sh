#!/bin/bash
# Tải 41 sticker Fluent UI Emoji 3D (Microsoft, MIT) — K6 Phase 6.
# Chạy 1 lần sau khi clone:  bash assets/stickers/fetch_stickers2.sh
# Mỗi file được kiểm tra SHA256. Chi tiết license: assets/SOURCES.md
#
# Fluent UI Emoji: Copyright Microsoft Corporation — MIT License
#   https://github.com/microsoft/fluentui-emoji (LICENSE: MIT, đã đọc trực tiếp)
#   Chỉ dùng biến thể 3D PNG (assets/<Name>/3D/<name>_3d.png).
set -euo pipefail
cd "$(dirname "$0")"

PUB="../../apps/web/public/stickers"
mkdir -p "$PUB"

fetch() {
  local name="$1"; local url="$2"; local sha="$3"
  if [ -f "$name" ]; then echo "  có sẵn: $name";
  else
    echo "  tải: $name";
    curl -fsSL "$url" -o "$name";
  fi
  echo "$sha  $name" | sha256sum -c - > /dev/null \
    || { echo "LỖI checksum: $name"; exit 1; }
  cp -f "$name" "$PUB/$name"
}

fetch "fluent-red_heart.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Red%20heart/3D/red_heart_3d.png" "7218cb9f08ed1ef38fcd83fe699a1125d07f50725f4c87a68cb7c9f4efb3c32b"
fetch "fluent-fire.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png" "d56355132d73df1741edcf37cb4e21ad54f1c46eeb76fa17224607abf4128c3f"
fetch "fluent-party_popper.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png" "70a8e2f9daf1646be9e773751b7f3b6b281a2415cf29c3c3aeebd9c923cdc3e0"
fetch "fluent-rocket.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png" "4636925a1dfc76a45dc83c08b983699d39143a0978f794a4e2dfb6cbffdcd7ab"
fetch "fluent-star.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Star/3D/star_3d.png" "b935cdf502b69054bc2b08e7ba4e4eaba6499564a2041dd77d6291e21bf8cfe8"
fetch "fluent-sparkles.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png" "e4490c9ff74a3fd73a8f99c760d65b6ed51b8a3e4ad28da137fec050b77e1058"
fetch "fluent-crown.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png" "817095bb1423468afa155317ba04ca333957d51757a8d3326856ee8707c0edd6"
fetch "fluent-gem_stone.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png" "50dd4109b524203fc9e208e24498f6f468c54f104b4eb41e914dec203e841820"
fetch "fluent-trophy.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png" "7c4a9805f354eb2aec35063a95a4043306efc726324c0d128883f24497857bbc"
fetch "fluent-soccer_ball.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Soccer%20ball/3D/soccer_ball_3d.png" "bf8597110e987c13b8a3ac0c317d6903cef29499faa04de695b5fc37dbb5a053"
fetch "fluent-cat_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cat%20face/3D/cat_face_3d.png" "d930f2aee8ae47cb3ca26f2594ddd15df42345d952b5903b776adf4a728860b5"
fetch "fluent-dog_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Dog%20face/3D/dog_face_3d.png" "7db4c311218a47053e490ec53e7b3995bb83246b0d6992e135868a5220bb32e7"
fetch "fluent-pizza.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pizza/3D/pizza_3d.png" "beb2d1ac000003d96711ea8364815641442523285fa59007dd5b589059c74b9a"
fetch "fluent-beer_mug.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Beer%20mug/3D/beer_mug_3d.png" "f03abaa231dd78bcdd5e98804398a32b12dab60485ec54466bf4efc526efc770"
fetch "fluent-musical_notes.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Musical%20notes/3D/musical_notes_3d.png" "72bd5c2870b7bcad31bb591a789107c92825b7dd844006366e6fc4e1fa31ab36"
fetch "fluent-camera.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Camera/3D/camera_3d.png" "1b16f78a3feb212e66c0263b81d651347d702383e4a23f6e0211f83c79d3c7e3"
fetch "fluent-video_camera.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Video%20camera/3D/video_camera_3d.png" "8fe22c0b07fbb82039d698b0c13745611b9dcd369abb02f72da3d2290a472996"
fetch "fluent-laptop.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Laptop/3D/laptop_3d.png" "3b8a267f6c3d2721af925782bdbc11c4e1bc9ae806c5c875557b100393665aab"
fetch "fluent-mobile_phone.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Mobile%20phone/3D/mobile_phone_3d.png" "c72cf9f888cb74cb8852679184e0dac945ed0340839c98a86c653f51e1e3504d"
fetch "fluent-light_bulb.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Light%20bulb/3D/light_bulb_3d.png" "df7b09aa18301507e6fb8c279df66d9afa465b6fed3e63d2efa84dacebdbbf79"
fetch "fluent-money_bag.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Money%20bag/3D/money_bag_3d.png" "cec19b9cf0beac5bbd27a07dcbe1e68c54b04112b4641165705ccb920f230292"
fetch "fluent-balloon.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Balloon/3D/balloon_3d.png" "1f3ae11652b440750cfd3e724888b3827d8e9349367cea80e57e33fd45588215"
fetch "fluent-rainbow.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rainbow/3D/rainbow_3d.png" "81c60a96369047dd287b9fb54d02d29fe1e9b7fe3f00924330037e861b1fbd81"
fetch "fluent-sun.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sun/3D/sun_3d.png" "c9bb15d03d4b1e6151d97e12119ac93bbd2bcb5e713a49c1fcfc11ece54caec1"
fetch "fluent-snowflake.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Snowflake/3D/snowflake_3d.png" "82f12779eb8658ebd4bae02c8136c4588bea55cdf60536d4d88f5eb530e7cb90"
fetch "fluent-palm_tree.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Palm%20tree/3D/palm_tree_3d.png" "c29dcf2e535992b76f5e400d18c0b5dfd6ad9c69f9351a394ac9d8dcc622591a"
fetch "fluent-rose.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rose/3D/rose_3d.png" "24a9794f108eb27d8d51ac8fc1898f8cee20e19f1b4e8c063efec5215d28d947"
fetch "fluent-sunflower.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sunflower/3D/sunflower_3d.png" "14eb41f2cb9afa1387e9b925a9458d8fc768be3bd32210e3064fb7f320e123ca"
fetch "fluent-grinning_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Grinning%20face/3D/grinning_face_3d.png" "175d214df45fe18f6f106a9a094b695689d98abe6f343295fcbd690a7ee4f0ab"
fetch "fluent-face_with_tears_of_joy.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Face%20with%20tears%20of%20joy/3D/face_with_tears_of_joy_3d.png" "8af20fb0c64c44a8d8c8d047c1410c5e529a37c3158d496832b380198ed2e9c3"
fetch "fluent-winking_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Winking%20face/3D/winking_face_3d.png" "f14edbaa23f127ee6ee7c4a17b35969405a3c441b3f79c3356cc6406c1bf9ae4"
fetch "fluent-smiling_face_with_heart-eyes.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20face%20with%20heart-eyes/3D/smiling_face_with_heart-eyes_3d.png" "2b5ab00dd73673faa86463eac8787b7fc366935c4d82a54451df33443190b9cc"
fetch "fluent-thinking_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Thinking%20face/3D/thinking_face_3d.png" "cd29da5c3886e1e25726d3cf6ff79faa2f0d631b1c0873b115be287d358fc4be"
fetch "fluent-sleeping_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sleeping%20face/3D/sleeping_face_3d.png" "c7d1cd5d04ae7214b6ae92b9802b6c860729c755da0020ccec22c7c8171f18fa"
fetch "fluent-angry_face.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Angry%20face/3D/angry_face_3d.png" "7e1ae11f16a882e61391c42d860632525290d11d7e9bb5e8ecab02f63d305414"
fetch "fluent-eyes.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Eyes/3D/eyes_3d.png" "b3049f399cb0947b423610f5876077efa86bc640fba5cb9d138b149773d4c793"
fetch "fluent-brain.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Brain/3D/brain_3d.png" "37906c3f0b0495215df114d72565a389496dc4c5b2af02398abf9dc7dc5a2a43"
fetch "fluent-hot_beverage.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hot%20beverage/3D/hot_beverage_3d.png" "edeaa3fca5eace5f2546efcd3b3e42ef1fd389a0c51d374dbf7863731db8f314"
fetch "fluent-wrapped_gift.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png" "fc9c446401c9fb347f4e9f47e6023247208126047d9ec32059d5e14e127fb562"
fetch "fluent-crescent_moon.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crescent%20moon/3D/crescent_moon_3d.png" "0a5b5192390983789d430e37582dfda343be19bf8246feda73108484771ba09d"
fetch "fluent-full_moon.png" "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Full%20moon/3D/full_moon_3d.png" "00dd24efe4fc9b13a020f59309d962ecd3bede581abeca5111056a8fc84c779e"

#!/usr/bin/env bash
# fetch_fonts.sh — Tải 43 fonts hỗ trợ tiếng Việt (OFL) từ google/fonts GitHub repo.
# Chạy: bash assets/fonts/fetch_fonts.sh
# Fonts được tải vào assets/fonts/files/ (KHÔNG commit file binary lên git).
# License: SIL Open Font License 1.1 — dùng thương mại tự do.
set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")" && pwd)/files"
mkdir -p "$OUT_DIR"

fetch() {
  local url="$1" dest="$2"
  if [ -f "$OUT_DIR/$dest" ]; then
    echo "  skip (đã có): $dest"
    return
  fi
  echo "  tải: $dest"
  curl -sSL --retry 3 -o "$OUT_DIR/$dest" "$url"
}

# Be Vietnam Pro [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf" "be-vietnam-pro-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf" "be-vietnam-pro-bold.ttf"

# Inter [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf" "inter-regular.ttf"

# Roboto [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth,wght%5D.ttf" "roboto-regular.ttf"

# Open Sans [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/opensans/OpenSans%5Bwdth,wght%5D.ttf" "open-sans-regular.ttf"

# Montserrat [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf" "montserrat-regular.ttf"

# Nunito [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf" "nunito-regular.ttf"

# Quicksand [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/quicksand/Quicksand%5Bwght%5D.ttf" "quicksand-regular.ttf"

# Manrope [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf" "manrope-regular.ttf"

# Plus Jakarta Sans [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf" "plus-jakarta-sans-regular.ttf"

# Lexend [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/lexend/Lexend%5Bwght%5D.ttf" "lexend-regular.ttf"

# Space Grotesk [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf" "space-grotesk-regular.ttf"

# Kanit [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Regular.ttf" "kanit-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Bold.ttf" "kanit-bold.ttf"

# Prompt [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Regular.ttf" "prompt-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Bold.ttf" "prompt-bold.ttf"

# Barlow Condensed [Sans Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/barlowcondensed/BarlowCondensed-Regular.ttf" "barlow-condensed-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/barlowcondensed/BarlowCondensed-Bold.ttf" "barlow-condensed-bold.ttf"

# Playfair Display [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" "playfair-display-regular.ttf"

# Merriweather [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/merriweather/Merriweather%5Bopsz,wdth,wght%5D.ttf" "merriweather-regular.ttf"

# Lora [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/lora/Lora%5Bwght%5D.ttf" "lora-regular.ttf"

# Noto Serif [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/notoserif/NotoSerif%5Bwdth,wght%5D.ttf" "noto-serif-regular.ttf"

# EB Garamond [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf" "eb-garamond-regular.ttf"

# Crimson Pro [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/crimsonpro/CrimsonPro%5Bwght%5D.ttf" "crimson-pro-regular.ttf"

# Fraunces [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf" "fraunces-regular.ttf"

# Vollkorn [Serif]
fetch "https://github.com/google/fonts/raw/main/ofl/vollkorn/Vollkorn%5Bwght%5D.ttf" "vollkorn-regular.ttf"

# Anton [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf" "anton-regular.ttf"

# Oswald [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald%5Bwght%5D.ttf" "oswald-regular.ttf"

# Lobster [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf" "lobster-regular.ttf"

# Alfa Slab One [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/alfaslabone/AlfaSlabOne-Regular.ttf" "alfa-slab-one-regular.ttf"

# Bungee [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/bungee/Bungee-Regular.ttf" "bungee-regular.ttf"

# Chakra Petch [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/chakrapetch/ChakraPetch-Regular.ttf" "chakra-petch-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/chakrapetch/ChakraPetch-Bold.ttf" "chakra-petch-bold.ttf"

# Baloo 2 [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf" "baloo-2-regular.ttf"

# Black Ops One [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/blackopsone/BlackOpsOne-Regular.ttf" "black-ops-one-regular.ttf"

# Bungee Shade [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/bungeeshade/BungeeShade-Regular.ttf" "bungee-shade-regular.ttf"

# Big Shoulders [Display]
fetch "https://github.com/google/fonts/raw/main/ofl/bigshoulders/BigShoulders%5Bopsz,wght%5D.ttf" "big-shoulders-regular.ttf"

# Dancing Script [Handwriting]
fetch "https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf" "dancing-script-regular.ttf"

# Pacifico [Handwriting]
fetch "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf" "pacifico-regular.ttf"

# Patrick Hand [Handwriting]
fetch "https://github.com/google/fonts/raw/main/ofl/patrickhand/PatrickHand-Regular.ttf" "patrick-hand-regular.ttf"

# Great Vibes [Handwriting]
fetch "https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf" "great-vibes-regular.ttf"

# Amatic SC [Handwriting]
fetch "https://github.com/google/fonts/raw/main/ofl/amaticsc/AmaticSC-Regular.ttf" "amatic-sc-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/amaticsc/AmaticSC-Bold.ttf" "amatic-sc-bold.ttf"

# Itim [Handwriting]
fetch "https://github.com/google/fonts/raw/main/ofl/itim/Itim-Regular.ttf" "itim-regular.ttf"

# Roboto Mono [Monospace]
fetch "https://github.com/google/fonts/raw/main/ofl/robotomono/RobotoMono%5Bwght%5D.ttf" "roboto-mono-regular.ttf"

# JetBrains Mono [Monospace]
fetch "https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" "jetbrains-mono-regular.ttf"

# Space Mono [Monospace]
fetch "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Regular.ttf" "space-mono-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Bold.ttf" "space-mono-bold.ttf"

# IBM Plex Mono [Monospace]
fetch "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf" "ibm-plex-mono-regular.ttf"
fetch "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Bold.ttf" "ibm-plex-mono-bold.ttf"

# Victor Mono [Monospace]
fetch "https://github.com/google/fonts/raw/main/ofl/victormono/VictorMono%5Bwght%5D.ttf" "victor-mono-regular.ttf"

echo ""
echo "Hoàn tất! Kiểm tra font tiếng Việt:"
echo "  fc-list \"$OUT_DIR\" family | head"
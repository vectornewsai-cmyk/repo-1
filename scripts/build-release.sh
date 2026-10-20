#!/usr/bin/env bash
# build-release.sh — Đóng gói release VCut Studio (R1-100, R1-102).
#
# Cách dùng:
#   bash scripts/build-release.sh              # build + đóng gói tarball
#   bash scripts/build-release.sh --skip-build # chỉ đóng gói (đã build sẵn)
#
# Kết quả trong release/:
#   vcut-studio-<version>-linux-x64.tar.gz   — gói cài đặt đầy đủ
#   SHA256SUMS                               — SHA-256 của tarball (để verify sau khi tải)
#
# Bên trong tarball có thêm file SHA256SUMS.packages — SHA-256 của TỪNG file
# trong gói, để verify chi tiết bằng:  sha256sum -c SHA256SUMS.packages
#
# Version đọc từ package.json ở root — KHÔNG hardcode.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SKIP_BUILD=0
if [[ "${1:-}" == "--skip-build" ]]; then SKIP_BUILD=1; fi

# ---------------------------------------------------------------- version ---
if ! command -v node >/dev/null 2>&1; then
  echo "LỖI: cần Node.js (>=20) để build release." >&2; exit 1
fi
VERSION="$(node -p "require('./package.json').version")"
if [[ -z "$VERSION" ]]; then
  echo "LỖI: không đọc được version từ package.json." >&2; exit 1
fi

OS="linux"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
esac
PKG_NAME="vcut-studio-${VERSION}-${OS}-${ARCH}"
RELEASE_DIR="$ROOT/release"
STAGE="$RELEASE_DIR/${PKG_NAME}"

echo "== VCut Studio release ${VERSION} (${OS}-${ARCH}) =="
echo "   staging: $STAGE"

# ------------------------------------------------------------------ build ---
if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "== npm ci (root workspaces) =="
  npm ci

  echo "== build apps/web (tsc strict + vite) =="
  npm run build --workspace=apps/web

  echo "== build mcp-server (ngoài workspaces, npm ci riêng) =="
  (cd mcp-server && npm ci && npm run build)

  echo "== build cli (ngoài workspaces, npm ci riêng) =="
  (cd cli && npm ci && npm run build)
else
  echo "== --skip-build: bỏ qua bước build, dùng dist sẵn có =="
  [[ -d apps/web/dist ]] || { echo "LỖI: chưa có apps/web/dist" >&2; exit 1; }
  [[ -d mcp-server/dist ]] || { echo "LỖI: chưa có mcp-server/dist" >&2; exit 1; }
  [[ -d cli/dist ]] || { echo "LỖI: chưa có cli/dist" >&2; exit 1; }
fi

# ---------------------------------------------------------------- staging ---
echo "== staging =="
rm -rf "$STAGE"
mkdir -p "$STAGE"

# rsync nếu có (nhanh + exclude chính xác), fallback cp với find-prune.
copy_tree() {
  # $1 = src dir (tương đối), $2 = dst dir (tương đối trong STAGE)
  local src="$1" dst="$2"
  mkdir -p "$STAGE/$dst"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a \
      --exclude 'node_modules' \
      --exclude '__pycache__' \
      --exclude '.venv' --exclude '.venv*' \
      --exclude 'models' \
      --exclude 'renders' \
      --exclude '*.mp4' --exclude '*.mov' --exclude '*.webm' \
      --exclude '*.cube' --exclude '*.png' --exclude '*.ogg' \
      --exclude '*.ttf' --exclude '*.woff' --exclude '*.woff2' \
      "$ROOT/$src/" "$STAGE/$dst/"
  else
    (cd "$ROOT/$src" && find . \
      -type d \( -name node_modules -o -name __pycache__ -o -name '.venv*' \
                 -o -name models -o -name renders \) -prune -o \
      -type f ! -name '*.mp4' ! -name '*.mov' ! -name '*.webm' \
              ! -name '*.cube' ! -name '*.png' ! -name '*.ogg' \
              ! -name '*.ttf' ! -name '*.woff' ! -name '*.woff2' \
      -print | while IFS= read -r f; do
        mkdir -p "$STAGE/$dst/$(dirname "$f")"
        cp "$ROOT/$src/$f" "$STAGE/$dst/$f"
      done)
  fi
}

# Web UI: chỉ cần dist + package.json (giữ layout workspaces để npm ci chạy được)
mkdir -p "$STAGE/apps/web"
cp apps/web/package.json "$STAGE/apps/web/package.json"
cp -r apps/web/dist "$STAGE/apps/web/dist"

# video-spec: mcp-server/cli import từ source qua đường dẫn tương đối
copy_tree "packages/video-spec" "packages/video-spec"

# Server: bridge + render (node) và các module Python AI
# server/render chứa dist của các limits/test; vẫn copy theo rule chung.
copy_tree "server" "server"

# MCP server + CLI: bản đã build (dist) + package files để npm ci khi cài
mkdir -p "$STAGE/mcp-server"
cp -r mcp-server/dist "$STAGE/mcp-server/dist"
cp mcp-server/package.json mcp-server/package-lock.json "$STAGE/mcp-server/"
cp mcp-server/README.md "$STAGE/mcp-server/" 2>/dev/null || true
cp mcp-server/TOOLS.md "$STAGE/mcp-server/" 2>/dev/null || true

mkdir -p "$STAGE/cli"
cp -r cli/dist "$STAGE/cli/dist"
cp cli/package.json cli/package-lock.json "$STAGE/cli/"
cp cli/README.md "$STAGE/cli/" 2>/dev/null || true

# Assets: chỉ text/catalog/script — binary (LUT/PNG/OGG/font) tải lại
# bằng các script fetch_* trong assets/ khi cài đặt (kèm kiểm SHA-256).
copy_tree "assets" "assets"

# Root files cần cho npm ci + chạy
cp package.json package-lock.json "$STAGE/"
cp LICENSE README.md "$STAGE/" 2>/dev/null || true
cp INSTALL.md "$STAGE/" 2>/dev/null || true

# Scripts cài đặt/khởi chạy
mkdir -p "$STAGE/scripts"
cp scripts/install.sh scripts/start.sh "$STAGE/scripts/"
chmod +x "$STAGE/scripts/install.sh" "$STAGE/scripts/start.sh"

# ------------------------------------------------------------- checksums ---
echo "== SHA-256 từng file trong gói -> SHA256SUMS.packages =="
(cd "$STAGE" && find . -type f ! -name 'SHA256SUMS.packages' -print0 \
  | sort -z | xargs -0 sha256sum > SHA256SUMS.packages)

# ------------------------------------------------------------------- tar ---
TARBALL="$RELEASE_DIR/${PKG_NAME}.tar.gz"
echo "== tạo tarball: $TARBALL =="
tar -czf "$TARBALL" -C "$RELEASE_DIR" "$PKG_NAME"

echo "== SHA-256 của tarball -> release/SHA256SUMS =="
(cd "$RELEASE_DIR" && sha256sum "${PKG_NAME}.tar.gz" > SHA256SUMS)

echo
echo "XONG:"
echo "  $TARBALL"
echo "  $RELEASE_DIR/SHA256SUMS"
du -h "$TARBALL" | cut -f1 | xargs echo "  dung lượng tarball:"

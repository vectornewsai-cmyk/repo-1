# VCut Studio — Hướng dẫn cài đặt

VCut Studio là trình dựng video trên web (tầm nhìn đẳng cấp CapCut) với AI chạy
**100% local**: auto-caption, dịch phụ đề, text-to-speech, xoá nền video,
auto-reframe, cắt khoảng lặng, tách cảnh — không gửi dữ liệu lên cloud.
Kèm theo là lớp tích hợp cho AI agent: MCP server + REST API + CLI.

Tài liệu này hướng dẫn cài đặt từ **gói release** (`.tar.gz`) — cách khuyến nghị.
Cài từ source code: xem thêm mục [Cài từ source](#cài-từ-source-cho-developer).

---

## 1. Yêu cầu hệ thống

| Thành phần | Yêu cầu | Kiểm tra |
|---|---|---|
| Hệ điều hành | Linux x86_64 (Ubuntu 20.04+ / Debian 11+ / Fedora tương đương) | `uname -m` |
| Node.js | >= 20 | `node --version` |
| npm | đi kèm Node.js | `npm --version` |
| ffmpeg | bản đầy đủ, **có encoder libx264** | `ffmpeg -encoders \| grep libx264` |
| Python | >= 3.10 + pip | `python3 --version` |
| Công cụ | curl, sha256sum (coreutils) | `curl --version` |
| Ổ đĩa trống | ~1GB (không AI models) / ~5GB (có AI models) | `df -h .` |
| RAM | >= 8GB khuyến nghị (xoá nền BiRefNet cần nhiều RAM — xem giới hạn) | `free -h` |

Cài tiên quyết trên Ubuntu/Debian:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs ffmpeg python3 python3-pip python3-venv curl
```

---

## 2. Tải + kiểm chứng gói release

1. Tải 2 file từ trang release: `vcut-studio-<version>-linux-x64.tar.gz`
   và `SHA256SUMS`.
2. Kiểm tra toàn vẹn (bắt buộc — tránh cài nhầm file lỗi/tráo đổi):

```bash
sha256sum -c SHA256SUMS
# kỳ vọng: vcut-studio-<version>-linux-x64.tar.gz: OK
```

3. Giải nén:

```bash
tar -xzf vcut-studio-<version>-linux-x64.tar.gz
cd vcut-studio-<version>-linux-x64
```

4. (Tùy chọn) Kiểm tra SHA-256 của **từng file** trong gói:

```bash
sha256sum -c SHA256SUMS.packages
```

---

## 3. Cài đặt

```bash
bash scripts/install.sh
```

`install.sh` làm 5 bước:

1. **Kiểm tra tiên quyết** — node >= 20, ffmpeg + libx264, python >= 3.10, pip, curl.
2. **Node dependencies** — `npm ci` cho root workspaces (web, video-spec, bridge,
   render), rồi riêng cho `mcp-server/` và `cli/` (hai package này nằm ngoài
   workspaces, có `package-lock.json` riêng).
3. **Python venv** — tạo `.venv` riêng cho `server/caption`, `server/tts`,
   `server/bgremove`, `server/reframe` và cài `requirements.txt` của từng module.
   `server/silence` và `server/scene` chỉ dùng thư viện chuẩn + ffmpeg nên không cần cài.
4. **Assets lớn** (hỏi trước) — thư viện tài nguyên nhị phân (LUT `.cube`,
   173 sticker PNG, 936 sound OGG, font) **không nằm trong gói release**
   (riêng các sticker PNG nhỏ đã nhúng sẵn trong bản build của web UI thì có).
   `install.sh` chạy các script
   `assets/fetch_*.sh` để tải lại, mỗi file đều được kiểm chứng SHA-256.
   Nguồn và giấy phép của từng tài nguyên: `assets/SOURCES.md`.
   > Ngoại lệ: 12 file âm thanh OGG của Kenney (CC0) phải tải thủ công ~2 phút
   > vì kenney.nl dùng trang download trung gian — hướng dẫn chi tiết nằm ở
   > cuối output của `assets/fetch_large_assets.sh`.
5. **AI models** (hỏi trước, ~3.5GB):
   - faster-whisper `small` (~462MB) — auto-caption + dịch phụ đề
   - VieNeu-TTS v3 Turbo 0.5B (~2.3GB, **Apache-2.0**) — text-to-speech
   - BiRefNet qua rembg (~880MB, **MIT**) — xoá nền video

Chạy không tương tác (cho script/CI):

```bash
bash scripts/install.sh --models --assets      # tải tất cả
bash scripts/install.sh --no-models --no-assets # chỉ cài code, tải sau
```

Bỏ qua bước nào thì tính năng tương ứng sẽ tự tải ở **lần chạy đầu tiên**
(caption/TTS/xoá nền đều có đường tự tải model), hoặc chạy lại các lệnh được
`install.sh` in ra ở cuối mỗi bước.

---

## 4. Khởi chạy

```bash
bash scripts/start.sh
```

- Web UI: **http://localhost:5173**
- Bridge API: **http://127.0.0.1:8787** (kiểm tra: `curl http://127.0.0.1:8787/api/health`)

Dừng bằng `Ctrl+C` — `start.sh` tự tắt cả hai tiến trình con.

Muốn đổi cổng: `BRIDGE_PORT=9000 WEB_PORT=3000 bash scripts/start.sh`.

Chạy thủ công từng phần (khi cần debug):

```bash
node server/bridge/src/index.js --port 8787     # bridge
cd apps/web && npx vite preview --port 5173     # web UI (phục vụ thư mục dist/)
```

> Web UI giao tiếp với bridge qua URL mặc định `http://127.0.0.1:8787`.
> Khi build lại web từ source có thể đổi bằng biến `VITE_BRIDGE_URL`.

### Bản desktop (Electron, Linux)

Ngoài bản web, VCut Studio có **app desktop thật** (Electron): một cửa
sổ duy nhất với menu native tiếng Việt, mở/lưu file `.vcut` bằng dialog
hệ thống, tự quản lý bridge/render/AI services — không cần chạy
`scripts/start.sh` riêng. Chi tiết đầy đủ (chạy dev, build, đóng gói
AppImage/.deb, yêu cầu hệ thống, báo lỗi): xem
[`docs/DESKTOP.md`](docs/DESKTOP.md).

```bash
cd apps/desktop
npm run build:desktop   # build web + desktop, đóng gói AppImage + .deb
```

Lưu ý: chưa có cập nhật tự động (xem `docs/DESKTOP.md` §10 — release
gate: chưa release cho đến khi ngang/hơn CapCut thật). Cập nhật bằng
cách tải bản mới như mục 6.

---

## 5. Dùng với AI agent (MCP / CLI / REST)

### MCP server (cho Claude Code, Codex...)

Sau khi cài, MCP server nằm ở `mcp-server/dist/`. Ví dụ cấu hình cho Claude Code:

```json
{
  "mcpServers": {
    "vcut": {
      "command": "node",
      "args": ["/đường/dẫn/tới/vcut-studio/mcp-server/dist/mcp-server/src/index.js"]
    }
  }
}
```

Danh sách 29 tools: xem `mcp-server/TOOLS.md`.

### CLI

```bash
node cli/dist/cli/src/index.js --help
# hoặc alias cho tiện:
alias vcut='node /đường/dẫn/tới/vcut-studio/cli/dist/cli/src/index.js'
vcut create --name "Video đầu tiên" --width 1920 --height 1080
vcut render --project proj.json --preset 1080p --output out.mp4
```

### REST API

Bridge mở sẵn REST API — tài liệu OpenAPI ở `server/bridge/openapi.yaml`,
hoặc mở `http://127.0.0.1:8787/api/openapi.json` khi bridge đang chạy.
Hướng dẫn dùng bằng curl: `server/bridge/API.md`.

---

## 6. Cập nhật lên phiên bản mới

1. Tải tarball mới + `SHA256SUMS`, kiểm chứng như mục 2.
2. Giải nén vào thư mục **mới** (đừng ghi đè thư mục đang dùng).
3. Chạy lại `bash scripts/install.sh` trong thư mục mới.
4. Project của bạn (định dạng video-spec JSON / `.vcut.zip`) tương thích ngược:
   các project cũ tự động được migrate khi mở (xem `packages/video-spec`).

---

## 7. Gỡ cài đặt

VCut Studio không cài gì vào hệ thống ngoài thư mục của chính nó
(ngoại trừ cache model của rembg ở `~/.u2net` nếu bạn đã tải model xoá nền).

```bash
rm -rf vcut-studio-<version>-linux-x64
rm -rf ~/.u2net        # (tùy chọn) xoá model xoá nền đã tải
```

---

## 8. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `ffmpeg thiếu encoder libx264` | Bản ffmpeg rút gọn. Ubuntu: `sudo apt install ffmpeg` (bản đầy đủ có libx264). |
| `Node.js quá cũ` | Cần Node >= 20. Cài qua nodesource (mục 1) hoặc nvm. |
| `npm ci` báo lỗi lock file | Đừng sửa tay `package-lock.json`; tải lại gói release và giải nén sạch. |
| Tạo venv lỗi `ensurepip is not available` | Thiếu gói venv: `sudo apt install python3-venv python3-full`. |
| Xoá nền bị kill (OOM) trên máy 8GB | BiRefNet nặng. Dùng session `u2net` nhẹ hơn — xem `server/bgremove/BGREMOVE_LIMITS.md`. |
| Caption chạy chậm lần đầu | Lần đầu phải tải model faster-whisper (~462MB). Các lần sau dùng model local. |
| Web mở được nhưng export lỗi | Bridge chưa chạy hoặc sai cổng. Kiểm tra `curl http://127.0.0.1:8787/api/health`. |
| Sticker/LUT/font trống | Chưa tải assets lớn: chạy `bash scripts/install.sh --assets` (mục 3, bước 4). |

Giới hạn đã biết của bản release: xem `scripts/RELEASE_LIMITS.md`.

---

## Cài từ source (cho developer)

```bash
git clone https://github.com/vectornewsai-cmyk/repo-1.git
cd repo-1
bash scripts/build-release.sh   # build web + mcp-server + cli và đóng gói tarball
# hoặc chạy dev:
npm ci
npm run dev:web                 # web UI ở chế độ dev (hot reload)
```

Quy trình phát hành (maintainer): tăng `version` trong `package.json` ở root →
commit → `git tag v<version>` → push tag. GitHub Actions (`.github/workflows/release.yml`)
sẽ tự build, đóng gói và upload artifacts kèm `SHA256SUMS`.

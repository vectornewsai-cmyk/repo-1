# RELEASE_LIMITS.md — Giới hạn trung thực của pipeline release (R1-100, R1-102)

Tài liệu này ghi những gì release pipeline **làm được thật** và những gì
**chưa làm**, theo nguyên tắc "trung thực, không fake" của dự án.

## Đã kiểm chứng

- `scripts/build-release.sh` đọc version từ `package.json` root bằng
  `node -p "require('./package.json').version"` — không hardcode version ở đâu.
- Tên tarball: `vcut-studio-<version>-linux-<arch>.tar.gz`, với `<arch>` lấy từ
  `uname -m` (`x86_64` -> `x64`, `aarch64`/`arm64` -> `arm64`). Đã test trên
  linux-x64; tên gói trên arm64 chưa test thực tế.
- `SHA256SUMS.packages` (trong tarball) chứa SHA-256 của **từng file** trong
  gói; `release/SHA256SUMS` chứa SHA-256 của **tarball**. Cả hai đều được tạo
  bằng `sha256sum` thật, không phải placeholder.
- Workflow `.github/workflows/release.yml` trigger đúng khi push tag `v*` và
  có guard fail khi tag không khớp version trong `package.json`.
- `scripts/install.sh` kiểm tra tiên quyết thật: node >= 20, ffmpeg **có**
  encoder libx264 (không chỉ "ffmpeg có cài"), python >= 3.10, pip, curl,
  sha256sum. Thiếu cái nào fail ngay với hướng dẫn cụ thể.
- `scripts/start.sh` khởi chạy bridge + vite preview phục vụ `apps/web/dist`,
  Ctrl+C dọn dẹp tiến trình con.

## Giới hạn (chưa làm / làm chưa đủ)

1. **Chỉ build cho Linux.** Workflow chạy trên `ubuntu-latest`, gói tên
   `linux-x64`. Chưa có build macOS/Windows — người dùng các hệ khác phải cài
   từ source.
2. **Không bundle AI models (~3.5GB).** faster-whisper small (462MB),
   VieNeu-TTS (2.3GB), BiRefNet (880MB) do `install.sh --models` tải riêng
   hoặc tự tải ở lần chạy đầu. Release "sạch" nhưng user mới vẫn phải chờ
   tải 1 lần.
3. **Không bundle assets nhị phân.** LUT `.cube`, sticker PNG, sound OGG,
   font TTF tải lại bằng các script `assets/fetch_*.sh` (kèm kiểm SHA-256).
   Lý do: giữ tarball gọn + đúng convention "binary tải sau khi clone" của repo.
4. **Không tự tạo GitHub Release.** Workflow chỉ upload workflow artifacts
   (giữ 90 ngày). Muốn có trang release công khai cần maintainer bật thêm
   `softprops/action-gh-release` hoặc tương đương (cần quyền `contents:write`).
5. **Không ký số (GPG/cosign).** Hiện chỉ có SHA-256 — đủ chống lỗi đường
   truyền và tráo đổi file đơn giản, chưa đủ cho threat model "kẻ tấn công
   kiểm soát kênh phân phối". Nâng cấp: ký SHA256SUMS bằng GPG.
6. **Chưa test end-to-end trên runner GitHub.** `build-release.sh` đã chạy
   thử local; workflow release.yml **chưa từng chạy thật** vì chưa có tag nào
   được push. Lần tag đầu tiên cần theo dõi log workflow để xác nhận.
7. **Không kiểm tra license/security ở bước release** (thuộc R1-101 — task
   khác, chưa làm).
8. **Benchmark chưa có** (thuộc R1-103 — task khác, chưa làm).
9. `npm ci` trong `install.sh` yêu cầu mạng ổn định tới registry npm và
   PyPI/HuggingFace/GitHub raw (cho models/assets). Môi trường không có mạng
   ngoài thì cài đặt thất bại — chưa có chế độ offline.
10. `start.sh` dùng `vite preview` (devDependency) để phục vụ web tĩnh —
    đủ dùng nhưng không phải static server tối ưu cho production.

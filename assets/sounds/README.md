# Kho âm thanh VCut Studio

Thư viện sound effects miễn phí cho video editor, 100% CC0 (public domain),
dùng thương mại thoải mái, không cần ghi nguồn.

## Tổng quan

| Nguồn | Số file | License | Cách lấy |
|---|---|---|---|
| Kenney (interface/impact/sci-fi) | 12 | CC0 1.0 | thủ công — xem `assets/fetch_large_assets.sh` |
| uisfx (12 packs × 78 cues) | 936 | CC0 1.0 | `bash assets/sounds/fetch_sounds.sh` |
| **Tổng** | **948** | | |

## Tải kho uisfx

```bash
# Tải toàn bộ 936 file OGG (~4MB) vào assets/audio/
bash assets/sounds/fetch_sounds.sh

# Chỉ tải 1 pack (vd: cinematic)
bash assets/sounds/fetch_sounds.sh --pack=cinematic

# Xem danh sách, không tải
bash assets/sounds/fetch_sounds.sh --dry-run
```

File tải về đặt tên `uisfx-{pack}-{cue}.ogg` trong `assets/audio/`
(vd: `uisfx-cinematic-success.ogg`).

## Danh mục

`index.json` — catalog đầy đủ 948 sounds: file, category
(ui / feedback / notification / transition / impact / ambient),
pack, nguồn, license từng file.

## Giấy phép

- Kenney: CC0 1.0 Universal (License.txt trong pack gốc).
- uisfx: CC0 1.0 Universal (LICENSE-AUDIO trong repo gốc —
  "dedicated to the public domain... including for commercial purposes,
  without asking permission").

Attribution đầy đủ: `assets/SOURCES.md`.
Chính sách license kho: chỉ nhận CC0 / MIT / CC-BY / Apache-2.0.

# AI Background Removal — server/bgremove (R1-084)

Xoá nền video bằng AI, **100% local** (không cloud, không gửi video đi đâu).

## Stack

- **rembg 2.0.38** (MIT) + session **`birefnet-general`** (MIT) — đã kiểm chứng
  license trực tiếp, xem `BGREMOVE_LIMITS.md`.
- Fallback: `--session u2net` (MIT, 176MB) — nhanh, chạy được trên máy RAM nhỏ.

## Cài đặt

```bash
cd server/bgremove
pip install -r requirements.txt        # rembg[cpu] + opencv + numpy + Pillow
bash download_model.sh                # tải model 1 lần (~973MB cho birefnet-general)
# hoặc: bash download_model.sh --dir /đường/dẫn/khác
```

## Dùng

```bash
# Video có alpha (nối thẳng render worker):
python bgremove.py --input in.mp4 --output out_alpha.mov

# Matte grayscale (kiểm tra chất lượng):
python bgremove.py --input in.mp4 --output mask.mp4 --mode mask

# Xem trước ghép nền xanh lá:
python bgremove.py --input in.mp4 --output preview.mp4 --mode composite --bg 0,177,64

# Máy RAM ≤ 8GB: dùng u2net
python bgremove.py --input in.mp4 --output out.mov --session u2net
```

| Flag | Mặc định | Ý nghĩa |
|---|---|---|
| `--mode` | `alpha` | `alpha`: MOV PNG có alpha · `mask`: matte xám · `composite`: ghép nền màu |
| `--session` | `birefnet-general` | rembg session. **CẤM** `bria-rmbg`/`rmbg-2.0` (non-commercial) — script từ chối chạy |
| `--bg` | `0,177,64` | Màu nền cho mode composite (R,G,B) |
| `--max-side` | `960` | Thu nhỏ cạnh dài để chạy nhanh (`0` = giữ nguyên) |
| `--model-dir` | `~/.u2net` | Thư mục model (biến môi trường `U2NET_HOME`) |

Tiến trình in ra stderr (`[bgremove] 30/90 (33%)`).

## Tích hợp

- **Bridge:** `POST /api/bgremove` (multipart field `media`, optional `session`)
  → trả file `_no_bg.mov`. Xem `server/bridge/src/bgremove.js`.
- **Render:** video có alpha được tự động phát hiện qua `pix_fmt` (ffprobe) và
  composite đúng bằng alpha channel — không cần flag gì thêm.
- **UI:** nút **🤖 Xoá nền AI** trong Inspector (video clip) → `BgRemovePanel.tsx`.

## Test

```bash
python test_bgremove.py --session u2net   # cần model đã tải
```

Test: video mẫu 3s → assert mask có cả đen (>10%) và trắng (>10%), temporal
coherence tốt, output alpha có kênh alpha thật.

## Giới hạn

Xem `BGREMOVE_LIMITS.md` — đọc trước khi dùng production.

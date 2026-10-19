# server/scene — Scene detection (R1-085)

Tự động tách cảnh video bằng FFmpeg, 100% local, không cần model ML.

## Chạy trực tiếp

```bash
python3 scene.py --input video.mp4 --threshold 0.4 --out scenes.json
python3 scene.py --input video.mp4 --start 10 --end 60 --out scenes.json
```

Output `scenes.json`:

```json
{
  "cuts": [12.4, 25.1],
  "duration": 120.5,
  "threshold": 0.4,
  "cut_candidates": 3
}
```

- `cuts`: timestamps (giây, tuyệt đối theo file) của các điểm chuyển cảnh.
- `--threshold` 0.05..0.95 (mặc định 0.4): càng thấp càng nhạy.
- `--start/--end`: chỉ xét trong khoảng (giây tuyệt đối theo file).

## Test

```bash
python3 test_scene.py   # 15 assertions, cần ffmpeg/ffprobe
```

## Tích hợp

- Bridge: `server/bridge/src/scene.js` + `POST /api/scene`.
- UI: nút "Tách cảnh" trong Inspector (clip video) → `SceneModal`.

Xem `SCENE_LIMITS.md` để biết các giới hạn trung thực.

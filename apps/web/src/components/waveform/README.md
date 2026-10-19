# Audio Waveform cho timeline

Hiển thị sóng âm thanh trực quan trên mỗi audio clip (giống CapCut).
Peaks được tính từ **PCM thật** của file bằng Web Audio API — 100% client-side,
không cần server, không vẽ bừa.

## Cấu trúc

| File | Vai trò |
|---|---|
| `../../lib/waveform.ts` | `computePeaksForRange` (hàm thuần, test được bằng Node) + `decodeAudioPeaks` (browser, có cache LRU 8 file) |
| `WaveformCanvas.tsx` | Vẽ mảng peaks lên canvas (tự scale devicePixelRatio) |
| `ClipWaveform.tsx` | Wrapper: tra media từ store qua `clip.src`, decode đoạn `[in, out)` khớp trim |
| `waveform.css` | Style dark theme |

## Tích hợp vào Timeline (1 bước)

Trong `apps/web/src/Timeline.tsx`, component `ClipView`, thêm waveform cho audio clip.
Đặt **trước** `.clip-label` để chữ nổi lên trên sóng:

```tsx
import { ClipWaveform } from "./components/waveform";

// trong ClipView, ngay sau <div className="clip-handle left" ... />:
{clip.kind === "audio" && (
  <ClipWaveform clip={clip} pxPerSec={pxPerSec} />
)}
```

(`clip.kind === "audio"` giúp TypeScript tự narrow `clip` thành `AudioClip`.)
`ClipView` đã nhận `pxPerSec` nên không cần sửa props.

## Kiểm chứng

Chạy `node waveform.test.mjs` trong thư mục này. Test biên dịch
`lib/waveform.ts` bằng `tsc` rồi kiểm tra `computePeaksForRange` trên file WAV
tạo bằng ffmpeg:

- sine 440Hz → mọi peak ≈ 1.0 (đều)
- silence → mọi peak = 0
- fade in/out → peaks tăng dần (không đều)
- slice `[1s, 3s)` trên file 4s → đúng đoạn, không lệch
- stereo → lấy max 2 kênh

## Giới hạn (trung thực)

1. **Decode lần đầu có thể chậm** với file lớn (vài chục MB / vài phút nhạc) vì
   `decodeAudioData` giải nén toàn bộ file vào RAM. Đã có cache LRU 8 file và
   gom promise trùng URL nên không decode 2 lần.
2. **Waveform phản ánh đoạn nguồn `[in, out)`**, chưa co/giãn theo `speed`
   (clip audio speed ≠ 1 sẽ thấy sóng không khớp tốc độ phát).
3. **Cần file trong MediaBin**: spec mở từ JSON mà file chưa được import thì
   không có blob URL để decode → clip không hiện waveform (render null).
4. Một số codec hiếm có thể không được `decodeAudioData` hỗ trợ trên Safari —
   khi đó waveform đơn giản là không hiện, không báo lỗi ồn ào.
5. Chưa có vạch playhead progress trên sóng (prop `progress` của WaveformCanvas
   đã có sẵn, chờ nối với playhead của store).

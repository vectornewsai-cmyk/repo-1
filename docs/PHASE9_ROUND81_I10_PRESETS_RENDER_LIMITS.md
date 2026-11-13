# PHASE9_ROUND81_I10_PRESETS_RENDER_LIMITS.md — Kiểm chứng render thật theo preset mạng xã hội (nợ sau H10)

Đợt 81, luồng I10 — 10/11/2026. Đóng nợ kiểm chứng còn lại của đợt 80 H10 (S4):
preset xã hội 1 chạm đã xong code + test lib, nhưng chưa có kiểm chứng render
thật rằng file xuất ra đúng spec từng preset (khổ/fps/codec/trần bitrate/CRF/audio).
Luồng này render THẬT từng preset bằng chính `render.js` với clip nhiễu khó nén
và đo bằng `ffprobe`.

## 1. Kết quả tổng — cả 6 preset KHỚP spec (trong dung sai VBV, xem §3)

Clip mẫu: nhiễu trắng `nullsrc + noise(alls=40)` 1080×1920 30fps 3s + audio
pink-noise (khó nén cả video lẫn audio), render qua `render.js --encoder libx264`
với đúng `--crf/--x264-preset/--maxrate/--audio-bitrate` của từng preset.
Đo bằng `ffprobe` (stream `bit_rate` + packet `size/pts_time` → peak cửa sổ 1s).

| Preset | Khổ đo được | fps | Codec | Video avg | Trần | Vượt avg | Peak 1s | Vượt peak | Audio đo được | File | Render |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `tiktok` | 1080×1920 | 30/1 | h264 | **12,59 Mbps** | 10 | **+25,9%** | 18,62 Mbps | +86,2% | aac 48kHz stereo **160k**/160k | 4.784.984 B | 92,9s |
| `reels` | 1080×1920 | 30/1 | h264 | **10,03 Mbps** | 8 | **+25,4%** | 14,80 Mbps | +85,0% | aac 48kHz stereo **128k**/128k | 3.813.641 B | 56,2s |
| `shorts` | 1080×1920 | 30/1 | h264 | **9,99 Mbps** | 8 | **+24,8%** | 14,65 Mbps | +83,1% | aac 48kHz stereo **248k**/384k | 3.843.046 B | 70,7s |
| `youtube` | 1920×1080 | 30/1 | h264 | **10,25 Mbps** | 8 | **+28,1%** | 15,27 Mbps | +90,9% | aac 48kHz stereo **192k**/192k | 3.918.806 B | 69,4s |
| `ig-square` | 1080×1080 | 30/1 | h264 | **7,55 Mbps** | 6 | **+25,8%** | 10,36 Mbps | +72,6% | aac 48kHz stereo **128k**/128k | 2.883.005 B | 64,4s |
| `ig-portrait` | 1080×1350 | 30/1 | h264 | **7,55 Mbps** | 6 | **+25,9%** | 9,51 Mbps | +58,4% | aac 48kHz stereo **128k**/128k | 2.885.285 B | 62,3s |

- Khổ, fps (30/1), codec h264, audio AAC 48 kHz stereo, duration 3,0s: **đúng
  tuyệt đối ở cả 6 preset**.
- Video avg vượt trần danh nghĩa **+24,8–28,1%** ở mọi preset — HỆ THỐNG, không
  phải lỗi một preset (xem §3: hành vi VBV chuẩn trên clip ngắn, đã dự báo ở
  H10 §3.1). Tất cả nằm trong dung sai kiểm chứng trần×1,30 của H10.
- Peak 1s vượt trần **+58–91%**, vẫn dưới giới hạn lý thuyết VBV trần×2,0
  (bufsize = 2× trần).
- Audio: 5/6 preset ra **đúng y target** (128k→128,2k; 160k→160,2k;
  192k→191,6k). Ngoại lệ duy nhất là `shorts` 384k → chỉ 248k (xem §4 —
  KHÔNG phải lỗi preset).

## 2. Đối chứng (chứng minh các cờ đi xuyên tới encoder thật)

### 2.1 Trần kẹp thật — uncapped vs capped, cùng khổ/CRF/preset
Cùng clip nhiễu, cùng 1080×1920 CRF 20 `medium`, chỉ khác có/không `--maxrate`:

| Render | Video avg | Peak 1s | File |
|---|---|---|---|
| Không trần (CRF-only) | **237,80 Mbps** | 267,68 Mbps | 89.241.028 B (297,5s) |
| `tiktok` capped 10 Mbps | **12,59 Mbps** | 18,62 Mbps | 4.784.984 B |

→ Trần kẹp thật: bitrate giảm **~19×** (237,8 → 12,6 Mbps). Không phải nhãn.

### 2.2 CRF đi xuyên tới encoder
Cùng clip dễ nén (testsrc2 1280×720 3s + sine 440 Hz), uncapped, `medium`:

| CRF | Video avg | File |
|---|---|---|
| 20 | 3,62 Mbps | 1.420.902 B |
| 30 | 0,94 Mbps | 416.064 B (**25,9%** của CRF 20) |

→ `--crf` có tác dụng thật (tăng 10 CRF → bitrate còn ~1/4, đúng quy luật x264
~6 CRF = một nửa bitrate). Cộng với dry-run từng preset đều chứa đúng
`-crf <n> -maxrate <n>k -bufsize <2n>k -b:a <ak>k` + `scale=<WxH>` (§5).

### 2.3 Parser preset đọc từ code, không hardcode spec
Script kiểm chứng tự parse `apps/web/src/lib/exportPresets.ts` (đủ 10 preset)
và đối chiếu 6 preset xã hội với spec H10 — **khớp 6/6** (khổ/fps/CRF/
x264Preset/audio/trần). Nếu code preset lệch doc thì script fail ngay ở bước này.

## 3. Vì sao video avg vượt trần ~25% — đã đo được cơ chế, không phải đoán

H10 đã nêu giả thuyết "bufsize 2× cho phép vay trước ở clip ngắn". Luồng này
đo thêm 2 thí nghiệm để kiểm tra giả thuyết đó:

### 3.1 Clip dài 10s hội tụ về gần trần (Reels, render.js, bufsize 2×)
Cùng spec Reels, clip nhiễu 10s (source 335 MB, render 268,0s):

| Đoạn | Video avg |
|---|---|
| 3s (đợt chính) | 10,03 Mbps (**+25,4%**) |
| 10s (toàn file) | **8,59 Mbps (+7,4%)** |
| 3s đầu của file 10s | 10,85 Mbps |
| 3s cuối của file 10s | **6,64 Mbps (DƯỚI trần)** |

→ Giả thuyết H10 ĐÚNG cho bitrate trung bình: phần vượt trần tập trung ở đầu
clip (VBV buffer bắt đầu đầy), encoder sau đó nén dưới trần để bù. Clip thực
tế (phút, không phải 3s) sẽ có avg gần trần hơn nữa. Peak 1s thì KHÔNG hội tụ:
cửa sổ đỉnh 14,61 Mbps bắt đầu ở **t=0,43s** — chính là cú "vay trước" đầu clip.

### 3.2 bufsize 1× thay vì 2× thì vượt ít hơn hẳn (ffmpeg trực tiếp, Reels 3s)
Cùng clip nhiễu 3s, `-maxrate 8000k`, chỉ đổi bufsize:

| bufsize | Video avg | Vượt avg | Peak 1s | Vượt peak |
|---|---|---|---|---|
| 16000k (2×, production hiện tại) | 10,03 Mbps | +25,4% | 14,80 Mbps | +85,0% |
| 8000k (1×, thử nghiệm) | **8,73 Mbps** | **+9,1%** | 12,24 Mbps | +53,0% |

→ Thu hẹp bufsize giảm vượt trần rõ rệt (avg +25% → +9%, peak +85% → +53%).
Đây là bằng chứng cho đề xuất §6.1 (chưa đổi production trong luồng này —
xem §6).

## 4. Audio Shorts 384k chỉ ra 248k — KHÔNG phải lỗi preset, đã loại trừ nguồn

- Lần 1 (source audio AAC 192k): ra **248,0k**. Nghi ngờ: source 192k đã mất
  thông tin nên encode lại không lên được 384k.
- Lần 2 (source audio **PCM lossless 768 kbps**, cùng video nhiễu): ra
  **242,6k** — gần như không đổi; video 9,91 Mbps cũng khớp lần 1 (9,99 Mbps).
→ Loại trừ giả thuyết nguồn: **encoder AAC native của ffmpeg không tiêu hết
  384k cho pink-noise** — `-b:a` là target trung bình, không phải CBR cứng;
  encoder chỉ dùng lượng bit mô hình psychoacoustic cần (~243k cho nội dung này).
- 5 preset còn lại ra đúng y target (128/160/192k) vì ở các mức đó nội dung
  cần đủ bit — chứng tỏ cờ `-b:a` đi xuyên đúng, không bị kẹp/chặn ở đâu.
- Thực tế: khuyến nghị 384k của YouTube là **mức trần cho stereo**, không phải
  mức sàn — file ra 248k vẫn đúng chuẩn AAC-LC 48 kHz stereo, upload Shorts
  không bị lỗi vì thiếu bitrate. Không sửa preset (384k vẫn là target đúng).

## 5. Kiểm chứng đã chạy (số thật, VM này, 10/11/2026)

- `test_presets_render_81i10.cjs` (mới, `server/render/src/`): **87 pass, 0 fail**
  — gồm: parse đủ 10 preset (1), 6 preset khớp spec H10 (6), mỗi preset 5 assert
  dry-run (`-crf/-maxrate/-bufsize/-b:a/scale`) + 8 assert probe (khổ/fps/codec/
  avg≤trần×1,30/peak≤trần×2,0/audio aac 48kHz stereo/audio trong [0,5×, 1,25×]
  target/duration) = 78, uncapped > 3× capped (1), CRF 30 < 0,7× CRF 20 (1).
  Tổng thời gian chạy script ~14 phút (6 render preset + uncapped 297,5s + 2 CRF).
- `gpuencode.js --self-test`: pass. Bridge `test-maxrate-80h10.cjs`: **4/4 pass**.
  `test-export-presets.sh`: **82/82 pass** (chạy lại, không sửa gì).
- **KHÔNG sửa code** (không preset nào lệch thật cần sửa): `ExportPanel.tsx`,
  `render.js`, `gpuencode.js`, `exportPresets.ts` đều giữ nguyên — nên KHÔNG
  chạy lại tsc/vite build (không có gì để build lại; cây đã xanh ở đợt 80 và
  parent gộp đã verify tsc 0 sau đó).
- Kết quả thô: `results.json` trong workdir tạm của script (đã xóa MP4 lớn để
  dọn `/tmp`; số liệu đầy đủ trong bảng §1–§3 của file này).

## 6. Giới hạn đã biết + đề xuất (trung thực)

1. **Trần bitrate là VBV maxrate, không phải trung bình chính xác — và KHÔNG
   phải peak tuyệt đối.** Với clip ngắn (3s) avg vượt trần ~25%, peak 1s vượt
   ~+58–91%. Clip dài 10s thì avg chỉ còn +7,4% nhưng peak 1s vẫn +83% (cú
   burst đầu clip). Nền tảng nào kiểm tra bitrate trung bình file dài thì
   không sao; nền tảng nào đo peak từng giây thì file có thể vượt trần danh
   nghĩa dù encoder đã làm đúng VBV. Đừng claim "file ra đúng y trần".
2. **Đề xuất (chưa làm, cần đợt riêng quyết định):** thu `bufsize` từ 2× xuống
   1× trần trong `gpuencode.js` — thí nghiệm §3.2 cho thấy avg +25% → +9%,
   peak +85% → +53%, với cùng CRF/medium. Đánh đổi: VBV chặt hơn có thể giảm
   chất lượng ở cảnh phức tạp (encoder ít "vay trước" hơn); cần đo PSNR/VMAF
   trước khi đổi production. Phương án mạnh hơn: 2-pass VBR (`-b:v <trần>`)
   cho avg sát trần hơn nữa, nhưng tốn gấp đôi thời gian render — chỉ nên làm
   tùy chọn, không phải mặc định.
3. **Trần chỉ áp cho libx264 (CPU)** — GPU encoder bỏ qua `maxrate` (nợ cũ H10
   §4.1, không thay đổi). Trên máy có GPU, preset xã hội render GPU sẽ không
   bị kẹp trần.
4. **Audio `-b:a` là target, không phải CBR cứng** (§4): nội dung đơn giản có
   thể ra dưới target khá xa (Shorts 384k → 248k). Đây là hành vi encoder,
   không phải lỗi. Đừng kỳ vọng file audio đúng y target.
5. **Preset không tự crop/reframe** (nợ cũ H10 §4.3): video 16:9 xuất preset
   9:16 vẫn letterbox/pillarbox — kiểm chứng này dùng source cùng tỉ lệ khung
   xuất nên không đo lại vấn đề đó.
6. **Clip kiểm chứng là nhiễu tổng hợp, không phải video thật.** Nhiễu là
   trường hợp xấu nhất cho nén (bitrate trần mới kẹp); video thật (quay thường)
   thường dưới trần ngay cả không kẹp (H10 đo testsrc2 chỉ ~2,26 Mbps). Kết
   luận "trần kẹp" là đúng, nhưng mức vượt +25% là của nội dung cực khó nén —
   video thật sẽ vượt ít hơn.
7. **`/tmp` của VM chỉ 512 MB (tmpfs)** — lần đầu tạo source nhiễu 10s bị lỗi
   `No space left on device` (exit 228) vì `/tmp` đã đầy 100% do các file tạm
   của đợt này + các luồng khác. Đã dọn file tạm của mình (xóa MP4 lớn sau khi
   đo, chỉ giữ `results.json` + log) và chuyển source 10s sang
   `~/workspace/scratch-i10/` (đã xóa sau khi đo xong). Luồng sau render clip
   dài/nhiễu nên dùng `~/workspace/` làm scratch, không dùng `/tmp`.
8. **Không có click-test browser thật** cho preset (nợ chung hạ tầng, như H10).

## 7. File đổi (stage tại `phase9-round81-i10-presets-render.txt`)

- `server/render/src/test_presets_render_81i10.cjs` — script kiểm chứng render
  thật theo preset (mới): parse preset từ code, render 6 preset + 2 đối chứng
  (uncapped, CRF), đo ffprobe avg + peak 1s + audio, in bảng markdown.
- `docs/PHASE9_ROUND81_I10_PRESETS_RENDER_LIMITS.md` — file này.
- KHÔNG sửa: `ExportPanel.tsx`, `render.js`, `gpuencode.js`,
  `exportPresets.ts`, i18n (không preset nào lệch thật cần sửa).

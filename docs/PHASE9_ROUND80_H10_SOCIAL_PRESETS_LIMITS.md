# PHASE9_ROUND80_H10_SOCIAL_PRESETS_LIMITS.md — Preset xuất bản mạng xã hội 1 chạm (S4, gap §2.6)

Đợt 80, luồng H10 — 10/11/2026. Hoàn thiện hàng S4 trong `PHASE9_GAP_ANALYSIS.md` §2.6:
trước đây chỉ có preset MP4 chung chung (TikTok gộp chung Reels/Shorts, không có
trần bitrate theo nền tảng, safe-area chỉ có TikTok/YouTube/Instagram-feed).

## 1. Đã làm gì

### 1.1 Preset 1 chạm theo nền tảng (mới + sửa)
| Preset | Khổ | fps | Codec | CRF | Trần video | Audio |
|---|---|---|---|---|---|---|
| `tiktok` (sửa) | 1080×1920 9:16 | 30 | H.264 | 20 | 10 Mbps | 160k |
| `reels` (mới) | 1080×1920 9:16 | 30 | H.264 | 20 | 8 Mbps | 128k |
| `shorts` (mới) | 1080×1920 9:16 | 30 | H.264 | 20 | 8 Mbps | 384k |
| `youtube` (sửa) | 1920×1080 16:9 | 30 | H.264 | 18 | 8 Mbps | 192k |
| `ig-square` (sửa) | 1080×1080 1:1 | 30 | H.264 | 21 | 6 Mbps | 128k |
| `ig-portrait` (sửa) | 1080×1350 4:5 | 30 | H.264 | 21 | 6 Mbps | 128k |

- `tiktok` tách khỏi nhãn gộp cũ (label cũ là literal tiếng Việt trong code —
  nay qua key i18n `exportPreset.tiktokLabel` = "TikTok 9:16").
- Preset chung 720p/1080p/4k/custom KHÔNG có trần bitrate (CRF-only như trước).
- `ExportPreset` thêm field tùy chọn `videoBitrateKbps` (500..100000); `presetSummary`
  hiện "≤8 Mbps" khi có trần; `estimateVideoBitrateKbps` kẹp ước tính ở trần.
- Dropdown preset trong `ExportPanel` liệt kê tự động từ `EXPORT_PRESETS` (nay 10 preset).

### 1.2 Trần bitrate đi xuyên pipeline (thật, không phải nhãn)
`ExportPanel` gửi `videoBitrateKbps` → bridge `parsePreset` whitelist (số nguyên
500..100000, sai → 400 `PRESET_BITRATE_RANGE` tái dùng — catalog bridge khóa 102 mã,
không thêm mã mới) → `spawnJob` đẩy `--maxrate <n>` → `render.js` parse `--maxrate`
→ `gpuencode.buildVideoEncodeArgs` (libx264) thêm `-maxrate <n>k -bufsize <2n>k`
BÊN CẠNH `-crf`. Vắng field → CRF-only như trước (job cũ recover không có field
vẫn chạy).

### 1.3 Safe-area riêng cho Reels và Shorts
- Thêm platform `reels` (top 9% / ray phải 13% / caption dưới 25%) và `shorts`
  (top 8% / ray phải 12% / caption dưới 20%) — khác TikTok (11% / 13% / 27%).
  Title-safe tương ứng: Reels x5% y11% w79% h61%; Shorts x5% y10% w80% h67%.
- `safeAreaPlatformForPreset` map `reels`→reels, `shorts`→shorts; `SafeAreaOverlay`
  (đã có toggle + select từ đợt 73 A9) tự hiện 7 option (auto + 6 nền tảng) và
  đổi vùng theo preset xuất đang chọn — không sửa `preview.tsx`.
- `platformForAspect` với khung 9:16 trả nền tảng 9:16 ĐẦU TIÊN (tiktok) khi hòa
  tỉ lệ; user đổi tay qua select trong overlay.

### 1.4 i18n
Key mới (cả vi/en, parity đã check): `exportPreset.tiktokLabel/reelsLabel/reelsDesc/
shortsLabel/shortsDesc/sizeSummaryMax/errVideoBitrate`, `safeArea.platformReels/
platformShorts`; đổi giá trị `safeArea.platformTiktok` thành "TikTok 9:16" và
`exportPreset.tiktokDesc` thành khổ chuẩn TikTok (không còn gộp Reels/Shorts).

## 2. Số liệu nền tảng — nguồn nào, mức độ tin cậy nào

| Số liệu | Nguồn | Trạng thái |
|---|---|---|
| TikTok: MP4 (khuyến nghị), H.264 (khuyến nghị), 23–60 fps, 360–4096 px/cạnh, ≤4 GB | TikTok Content Posting API (Media Transfer Guide) | **Công bố chính thức** |
| TikTok trần 10 Mbps | KHÔNG có số chính thức cho đăng thường (chỉ sàn quảng cáo ≥516 kbps). 8–10 Mbps là thực hành chung (mediaspeclab 11/2026) | **Thực hành chung, không phải spec** |
| Reels: 1080×1920 9:16, MP4/MOV + H.264 + AAC, tối thiểu 30 fps (API 23–60), tối thiểu 720 px, tối đa 25 Mbps (API) | Instagram Help Center + Meta API (qua revid/mallary 11/2026) | **Công bố (qua tổng hợp)** |
| Reels trần 8 Mbps | Instagram chỉ công bố tối thiểu 3.500 kbps; 5–8 Mbps là thực hành chung | **Thực hành chung** |
| Shorts trần 8 Mbps @1080p 24–30 fps (12 Mbps @48–60), H.264 High Profile, AAC-LC 48 kHz, audio stereo 384 kbps, tối đa 1080p qua app, tối đa 3 phút | **YouTube "Recommended upload encoding settings" + trang Shorts** (qua capcutguide/autoaishorts 10–11/2026) | **Công bố chính thức** |
| Feed 1:1/4:5 trần 6 Mbps | Instagram KHÔNG công bố bitrate feed; 3–6 Mbps là thực hành chung (klap.app) | **Thực hành chung** |
| Reels safe-zone (caption ~25%, top ~9%) | Mô tả bố cục công khai (postlabs 09/2026: vùng an toàn chính ~khung 4:5 giữa 1080×1350) | **Xấp xỉ** |
| Shorts safe-zone (caption ~20%, top ~8%) | YouTube KHÔNG công bố safe-zone cho Shorts thường; margin tham chiếu Google Ads Help cho video dọc (capcutguide 10/2026) | **Xấp xỉ** |

- Audio Shorts 384 kbps theo đúng khuyến nghị stereo của YouTube. Preset `youtube`
  16:9 giữ 192k như cũ (không đổi hành vi đã kiểm chứng) — chênh này được ghi rõ
  chứ không giấu.
- Nền tảng đổi UI/spec thì số lệch theo; overlay ghi rõ "xấp xỉ", chỉ dùng để căn
  chữ, không dùng để cắt video.

## 3. Kiểm chứng thật (số đo 10/11/2026, VM này)

- `tsc` web: 0 lỗi. `vite build`: pass (1m14s).
- `r6-i18n-check`: PASS. `i18nAudit56M4`: 25/25 cả vi lẫn en.
- `test-export-presets.sh`: **82/82 pass** (trước đợt này harness GÃY — thiếu
  `resolveJsonModule` → tsc TS2732, count preset 7 sai từ khi thêm `ig-portrait`
  đợt 73; đợt này sửa cả hai).
- `safeArea73A9.test.ts`: 16/16. `safeAreaOverlay73A9.render.test.ts` (render
  thật bằng react-dom/server): 6/6 — caption Reels top=720px, Shorts top=768px,
  khác TikTok 700.8px trên cùng khung 540×960.
- `gpuencode.js --self-test`: pass (gồm case maxrate 8000 → `-maxrate 8000k
  -bufsize 16000k`, và vắng/sai kiểu/≤0 → không thêm cờ; NVENC bỏ qua maxrate).
- Bridge thật (`test-maxrate-80h10.cjs`): **4/4 pass** — preset có
  `videoBitrateKbps:8000` → worker argv có `--maxrate 8000`; vắng field →
  không có `--maxrate`; 99 và `"8000"` → 400 `PRESET_BITRATE_RANGE`.
- P7 (`test-p7-queue-persist.cjs`): 26/26 pass (không phải 8/8 như brief ghi —
  test này có 26 assertion; tất cả xanh).
- Export thật qua `render.js` + `ffprobe` (input testsrc2 1280×720 5s, mute):
  - `tiktok` 1080×1920 h264, video bitrate 2.263.232 bps, 5,0s, 1.422.807 B.
  - `reels` 1080×1920 h264, 2.263.230 bps, 5,0s, 1.422.806 B.
  - `ig-square` 1080×1080 h264, 1.965.457 bps, 5,0s, 1.236.642 B.
  - `ig-portrait` 1080×1350 h264, 1.970.481 bps, 5,0s, 1.239.790 B.
  - Tất cả đúng tỉ lệ + codec h264 + bitrate dưới trần.
  - ⚠️ Lưu ý trung thực: input testsrc2 upscale + viền đen nên bitrate thật chỉ
    ~2,26 Mbps — THẤP HƠN MỌI TRẦN nên trần không kẹp trong 4 render này
    (reels 1.422.806 B ≈ nocap 1.422.737 B). Trần kẹp thật được chứng minh
    riêng ở §3.1 (clip nhiễu khó nén + trần thấp).

### 3.1 Trần kẹp thật (bằng chứng VBV có tác dụng)
Input: clip nhiễu trắng 1080×1920 3s tự tạo (`nullsrc + noise`, 54.320.864 B
≈ 144 Mbps — nội dung cực khó nén, CRF 20 không trần sẽ cho bitrate rất cao).
Cùng spec 1080×1920 @30fps, CRF 20, `medium`:

| Render | Video bitrate (ffprobe) | File | Thời gian render |
|---|---|---|---|
| Không trần (CRF-only) | **169.672.429 bps (~170 Mbps)** | 63.632.052 B | 266,3s |
| `--maxrate 8000` (preset Reels/Shorts) | **10.039.176 bps (~10,0 Mbps)** | 3.769.582 B | 111s |

→ Trần kẹp thật: bitrate giảm **~17×** (169,7 → 10,0 Mbps), file nhỏ ~17×.
- ⚠️ Trung thực: trung bình clip 3s có trần là 10,04 Mbps, VƯỢT trần danh
  nghĩa 8 Mbps khoảng 25%. Đây là hành vi VBV chuẩn: bufsize 16.000k cho
  phép encoder "vay trước" ở đầu clip ngắn; trần kẹp tốc độ trên cửa sổ
  VBV chứ không phải trung bình toàn file với clip chỉ 3s. Clip thực tế
  dài hơn thì trung bình hội tụ về gần trần. Dung sai kiểm chứng 30% trong
  script verify phản ánh đúng điều này — không claim "ra đúng y 8 Mbps".

## 4. Giới hạn đã biết (trung thực)

1. **Trần bitrate chỉ áp cho libx264 (CPU).** Máy có GPU (NVENC/QSV/VAAPI) thì
   `buildVideoEncodeArgs` bỏ qua `maxrate` — file xuất không bị kẹp trần. Ghi rõ
   trong code + test; preset xã hội render CPU là chủ yếu nên chấp nhận được.
2. **Trần là VBV maxrate, không phải bitrate trung bình chính xác.** Với clip
   ngắn (5s) và bufsize 2× trần, bitrate đo được có thể vượt trần nhẹ (dung sai
   kiểm chứng 30% trong script verify). Đừng kỳ vọng file ra đúng y trần.
3. **Preset không tự crop/reframe nội dung.** Video 16:9 xuất preset 9:16 vẫn
   render khung 1080×1920 với nội dung theo layout timeline cũ (letterbox/
   pillarbox) — auto-reframe là việc của R1-07x, không thuộc đợt này.
4. **Safe-area là xấp xỉ** (xem bảng §2) — nền tảng đổi UI thì lệch; chỉ dùng
   để căn chữ.
5. **Không có click-test browser thật** cho dropdown preset mới + overlay
   (nợ chung hạ tầng dự án). Đã kiểm chứng bằng render thật của component
   (react-dom/server) + test lib, chưa bấm tay trên browser.
6. **Không có preset do user tự lưu** ("preset của tôi") — thêm/sửa preset vẫn
   phải sửa code (nợ cũ §4 của EXPORTPRESETS_LIMITS.md).
7. **Hồi quy phát hiện (KHÔNG do H10):** `test-bridge-error-protocol.cjs`
   138 pass / 2 fail — 2 fail đếm call site `taskErrorPayload` (nhận 9, muốn
   11) vì 2 call site TTS dùng `failCode ||` nên regex của test không đếm được;
   catalog 102 mã vẫn pass. H10 không chạm call site nào trong số đó.
   (Script này vẫn exit 0 dù có 2 fail — hành vi sẵn có của harness.)

## 5. File đổi (stage tại `phase9-round80-h10-social-presets.txt`)

- `apps/web/src/lib/exportPresets.ts` — preset reels/shorts, `videoBitrateKbps`, summary/estimate/validate.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — key mới + sửa tiktok.
- `apps/web/src/lib/safeArea.ts` — platform reels/shorts + map preset.
- `apps/web/src/components/SafeAreaOverlay.tsx` — chỉ cập nhật comment danh sách id.
- `apps/web/src/ExportPanel.tsx` — gửi `videoBitrateKbps` qua preset JSON.
- `apps/web/src/lib/EXPORTPRESETS_LIMITS.md` — §7 mới.
- `apps/web/scripts/test-export-presets.sh` — sửa harness gãy (resolveJsonModule + NODE_PATH).
- `apps/web/scripts/exportPresets.test.cjs` — count 10 preset + assertion H10.
- `apps/web/src/lib/safeArea73A9.test.ts`, `safeAreaOverlay73A9.render.test.ts`, `i18nAudit56M4.test.ts` — cập nhật theo.
- `server/bridge/src/index.js` — whitelist + spawn `--maxrate`.
- `server/render/src/render.js` — cờ `--maxrate` + log.
- `server/render/src/gpuencode.js` — VBV cap libx264 + self-test.
- `server/bridge/test/test-maxrate-80h10.cjs` — test bridge thật (mới).
- `docs/PHASE9_ROUND80_H10_SOCIAL_PRESETS_LIMITS.md` — file này.

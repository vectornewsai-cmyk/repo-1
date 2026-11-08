# Phase 9 đợt 60 — TỔNG HỢP GỘP (LIMITS)

Ngày: 2026-11-08. Parent gộp đợt 60 (10 luồng Q1–Q10) + wiring + kiểm chứng
lại trên cây đã gộp. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

Chủ đề: đóng nợ đợt 59 (§6 LIMITS tổng hợp đợt 59) — preview áp enhance,
dọn class CSS + key i18n mồ côi, CaptionModal, GOP trial-decode lớn, bin/IDB,
đo FPS enhance, refresh docs trạng thái.

## 0. Kết quả gộp dict — số thật

- Trước gộp: `vi.json` == `en.json` == **1969 key lá** (sau đợt 60 Q4:
  1957 − 14 key mồ côi xóa + 26 key fragment P7 gộp).
- Đã gộp fragment Q1 (3 key mới `enhance.previewApprox/previewToggle/
  previewOffNote`); script gộp `/tmp/merge60.py`: cấm ghi đè, cấm key mới
  trùng key cũ — đã verify sau ghi.
- Sau gộp: `vi.json` == `en.json` == **1972 key lá** (1969 + 3; vi/en cùng
  tập key, placeholder khớp toàn bộ).
- Cập nhật test khóa số key: 13 file assert đã sửa `1969` → `1972` (giữ
  dòng lịch sử đợt 60 Q4, thêm dòng parent gộp +3 key Q1); test Q1 khối
  pre-merge đổi thành post-merge (dict nay trả chuỗi theo locale).
  Không còn assert nào khóa 1969 trong `apps/web/src` (chỉ còn dòng lịch
  sử "1969 sau đợt 60 Q4").

## 1. Đối chiếu đĩa (10 batch luồng)

- Hợp 10 batch = **82 entry / 72 file duy nhất**, 0 file thiếu trên đĩa,
  0 binary/dist. File đếm trùng: `tsconfig.json` ×4, `preview.tsx` ×4,
  `store.ts` ×2, `projectRepo.ts` ×2, `gopTrialDecode55L8.ts` ×2,
  `gopRangeFetch39T3.ts` ×2.
- File chung nguyên vẹn (kiểm bằng grep marker): `preview.tsx` có đủ
  hunk Q1 (enhancePreview) + Q6 (tickSkippedClipIds) + Q4 (truyền i18nT);
  `store.ts` có đủ Q1 (enhancePreviewEnabled) + Q7 (binOrphan60Q7);
  `projectRepo.ts` có đủ Q4 (I18nLookup, 8 lần nhắc) + Q7 (clearTimeout
  timer debounce); `gopTrialDecode55L8.ts`/`gopRangeFetch39T3.ts` có đủ
  Q4 (lookup i18n) + Q5 (cap 64 MiB, không fetch remainder khi probe null).
- Parent sửa thêm: dict đã gộp (vi.json, en.json); 13 file test khóa số
  key + test Q1 (pre-merge → post-merge); LIMITS tổng hợp này — đều nằm
  trong batch closing.

## 2. Kiểm chứng lại trên cây đã gộp (số thật, parent chạy lại độc lập)

- `tsc` apps/web: **0 lỗi**; `tsc` apps/desktop: **0 lỗi**;
  `vite build` apps/web: **pass, 6,83 s** (cảnh báo chunk >500 kB có sẵn).
- Chạy lại bằng esbuild bundle + node (file có top-level await phải bundle
  `--format=esm`; bundle cjs gãy — quirk đã biết): **49/49 suite xanh**,
  gồm test mới 10 luồng và hồi quy:
  Q1 16/16 vi + 16/16 en, Q2 59/59, Q3 23/23, Q4 16/16, Q5 15/15,
  Q6 15/15, Q7 17/17 + store 6/6, Q10 15/15, P2 26/26, P7 7/7, P3 16/16,
  N4 14/14, nestedPreview 46, previewEngine 14, nestedRampPreview 34,
  P8 presets 21/21, P4 33/33, P5 7/7, P1 17/17, saveToast31 15/15,
  structuredNotes32 12/12, L2 20/20, M5 21/21, projectRepo 10/10,
  GOP L8 23/23 + M10 28/28 + N10 17/17 + O6 18/18 + P6 16/16 + T3 10/10,
  H4 8/8, I6 25/25, D4 3/3, B6 8/8, Z6 10/10, E2 3/3, L1 6/6,
  errorDetail 35/35, O5 12/12, M4 25/25, O1 9/9, O4 24/24, N1 11/11,
  rehydrate 27/27, webglLut 7/7.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS/render của
  các luồng (Q1 headed 7/7, Q2 headed 10/10, Q3 headed 6/6, Q5 headed
  decode 8K, Q6 headed, Q7 headed 5/5, Q8 harness 88 render, Q10 headed
  6/6) — đó là số đo của luồng, đã đối chiếu LIMITS + bằng chứng trên đĩa.
  Ngoại lệ: Q8 chạy lại toàn bộ ở bước gộp (xem §2.1).

### 2.1 Chạy lại harness Q8 ở bước gộp

Chạy lại toàn bộ `server/render/src/test_round60_q8_enhance_fps.js` trên
cây đã gộp: **151 pass, 0 fail, exit 0** (xem `/tmp/round60-merge/q8-rerun.log`).
FPS mean 2 lần chạy lại: baseline 720p 61,66 / 1080p 33,70; Nhẹ 12,36 /
6,23; Cân bằng 7,43 / 4,37; Mạnh 7,72 / 4,66; combo 7,56 / 4,47 — hướng
khớp lượt chạy của luồng Q8 (mọi preset đều chậm hơn baseline nhiều,
combo chậm nhất nhóm), nhưng số tuyệt đối cao hơn lượt Q8 (baseline
720p 61,66 so với ~40; Nhẹ 720p 12,36 so với 8,65) do tải VM lúc chạy
khác nhau — đúng cảnh báo của Q8: FPS tuyệt đối dao động mạnh theo tải,
chỉ tỉ lệ/hướng mới ổn định. Khác biệt output đo lại khớp: flat std
1080p 7,804 → 2,064 sau denoise 0.5 (khớp y hệt Q8); vidstabdetect vẫn
không xác định (720 combo byte 2 lần: 2519264 / 2519183).

### 2.2 M3 đỏ sẵn — xác minh lại, không do đợt này

`i18nAudit56M3.test.ts` chạy lại ở bước gộp: **7/13 pass** (đỏ sẵn trước
đợt 60, Q4 đã ghi nhận). 6 fail: `history.readFailed` đã có trong dict,
2 render title động (templatePicker.title, relink.titleCount) thiếu cả
chuỗi lẫn key fallback, EnhancePanel không gọi `t("enhance.renderOnly")`
— key này Q4 xóa có chủ đích vì 0 code đọc (xóa không đổi kết quả M3:
vẫn 7/13). Cần đợt riêng sửa M3, không sửa trong đợt này.

## 3. Tóm tắt từng luồng (số đã kiểm chứng lại)

| Luồng | Việc | Test chạy lại |
|---|---|---|
| Q1 | Enhance vào preview (xấp xỉ: denoise→blur ≤1.2px, stabilize→zoom crop, deinterlace không đổi pixel) + toggle, cảnh báo xấp xỉ | 16/16 vi+en |
| Q2 | Dọn 30 class CSS chưa định nghĩa (SpeedPanel 12, preview badge 9, Timeline 3, panel lẻ, TtsButton 2) + 4 ca scoped ngoài tổ tiên; bắt 1 bug cascade `.tts-box` | 59/59 + P4 33/33 |
| Q3 | 9 nút text CaptionModal bỏ `.tbtn` → nút text đúng mẫu; đính chính: modal vốn đã vừa viewport, cái bị cắt là chữ nút ở mép phải | 23/23 + P4 33/33 |
| Q4 | 28 key `projectRepo.*` nối thật; 13 key lẻ + `enhance.renderOnly` xóa; 26 key fragment P7 nối thật + gộp → dict 1969, 0 key mồ côi | 16/16 + P7 7/7 |
| Q5 | Trial-decode cap 32→64 MiB (128 chunk); T3 không fetch remainder khi probe null (tiết kiệm 81 request / ~42 MB trên file 42,5 MB); keyframe đục lỗ đo xong, không fix được bằng kiểm chain NAL | 15/15 + GOP xanh |
| Q6 | `skippedReasons` tầng lib cho spec phẳng (giữ early-return + khóa O3 §B'); decoder tụt thì helper frame loại clip không vẽ được | 15/15 + O3 13/13 + N4 14/14 |
| Q7 | Xóa media khỏi bin nay dọn luôn bytes IDB (chặn cả src `asset:`, giữ khi dedup); race debounce 5s khi replaceProject tái hiện + sửa thật; sweep định kỳ bác có lý do | 17/17 + store 6/6 |
| Q8 | Render MP4 thật 88 lần: FPS preset P8 ở 720p/1080p; phát hiện vidstabdetect không xác định + stabilize+speedKeyframes bị chặn hẳn (không phải "chỉ cảnh báo") | harness 151/151 (chạy lại §2.1) |
| Q9 | Docs-only: đếm lại kho (transition thật 81, i18n 1957 lúc đó, sound 1043 khai báo nhưng chỉ 107 file trên đĩa); FEATURE_STATUS lên mốc 08/11; gap analysis đính chính TTS 0,12–0,75× + §0.2 đợt 59 | docs-only |
| Q10 | Escape ở bước 2 TemplatePicker nay đóng hẳn (đổi quyết định P2, có lý do); Escape lúc PackModal busy bị chặn cả 3 đường (job không hủy an toàn được) | 15/15 + P2 26/26 |

## 4. Đính chính / lưu ý gộp

- Q3 đính chính mô tả bug (b): "modal cao hơn viewport 900px" chưa chính
  xác về hình học — modal đã bị chặn bởi `max-height: calc(100vh − 60px)`;
  cái bị cắt là chữ nút ở mép phải modal.
- Q8 đính chính 2 tiền đề cũ: (a) khẳng định "encode xác định" ở P9 §4.3
  chỉ đúng cho render không stabilize — vidstabdetect cho `.trf` khác
  nhau giữa các lần chạy; (b) stabilize + speedKeyframes không phải "chỉ
  cảnh báo" — render bị chặn hẳn (exit 1, không MP4).
- Q9 đính chính: transition thật 81 (không phải 67 — 14 custom V3 từ đợt
  10 chưa từng ghi vào gap); sound "1043" chỉ là khai báo, trên đĩa chỉ
  107 file `.ogg`, 936 file uisfx chưa có (chỉ fetch được qua script).
- Q4: M3 đỏ sẵn 7/13 không đổi sau đợt này (xem §2.2).
- Q1: key cũ `enhance.renderOnly` thành mồ côi đã được Q4 xóa trong cùng
  đợt (không còn mồ côi sau gộp).

## 5. Nợ mở (cho đợt 61)

1. **M3:** `i18nAudit56M3.test.ts` đỏ sẵn 7/13 (title động templatePicker/
   relink, `history.readFailed`, renderOnly) — cần đợt riêng sửa M3.
2. **Q8:** chưa tách chi phí pass vidstabdetect vs transform; chưa đo
   metric giảm jitter lặp lại; chưa đo ghosting denoise trên footage
   chuyển động nhanh; UX preset Cân bằng/Mạnh trên clip có speedKeyframes
   chỉ cảnh báo chữ nhưng render chặn hẳn — cần quyết định UX riêng.
3. **Q1:** chưa đo FPS preview trước/sau enhance; thang blur 1.2px chưa
   hiệu chuẩn bằng số đo nhiễu; chưa click-test enhance + mask/SR/motion
   blur cùng lúc; chưa kiểm chứng deinterlace trên footage interlaced thật.
4. **Q2:** 53 class scoped-only còn lại chưa kiểm chứng ngữ cảnh; 5 rule
   chỉ đo tổng hợp (media-proxy, reframe, sticker-warn, speed-warn/muted);
   chưa đo EN / 1280×720 / mobile.
5. **Q3:** chưa đo bước running headed riêng; chưa đo 1280×720 sau sửa;
   chưa đo viewport mobile.
6. **Q4:** server/desktop 253 literal chưa kiểm kê; lý do diagnostic ngoài
   fragment (`range-probe-*`, `gop-unexpected-exception`, …) chưa nối.
7. **Q5:** keyframe thật ≳16 MiB vẫn timeout → fail-open; sample >64 MiB
   vẫn bỏ qua; keyframe đục lỗ không bắt chắc được; decoder timeout vẫn
   chạy nền sau timeout (~28 s với sample 42 MB); tốc độ decode lần này
   chậm hơn P6 chưa rõ nguyên nhân; chưa đo Safari/Firefox.
8. **Q6:** badge merge chưa ẩn lý do lib theo từng clip khi decoder tụt
   (cần `skippedReasons` mang attribution theo clip — đổi contract O3/N4);
   clip thiếu media không vào `tickSkippedClipIds`; chưa đo stall decoder thật.
9. **Q7:** bytes mồ côi từ trước đợt này vẫn ở lại kho (chưa có UI dọn kho);
   xóa bytes ở project này có thể ảnh hưởng file .vcut khác dùng chung bytes
   (kho toàn cục, chưa có sổ tham chiếu liên project); `refCount` của
   AssetStore chưa được duy trì.
10. **Q9:** ma trận chưa có hàng nested/adjustment, motion track text/video,
    karaoke, ducking, downbeat; `assets/sounds/index.json` thiếu 30 mục
    vcut-synth; `sticker-manifest.json` thiếu 30 mục (214 vs 244).
11. **Q10:** chưa đo headed Escape khi dropdown native của select đang mở
    và khi `ttsBusy`; cân nhắc timeout cho `recordPackMedia` (job treo thì
    modal kẹt tới khi reload).
12. **Nợ cũ chưa đụng:** N6 hoán đổi delta stts vẫn lọt (quyết định giữ
    nguyên); N5 bản dịch EN template chưa qua người bản ngữ; Node
    type-stripping vẫn không chạy được suite webglLut (cần
    `allowImportingTsExtensions` hoặc vitest); `ci-security.yml` 403 chưa
    lên GitHub (repo vẫn không có CI chạy thật).

## 6. Stage (KHÔNG push)

Batch closing: `~/workspace/repo-1-push/paths-loop/phase9-round60-closing.txt`
(NUL-delimited, verify read-back): dict đã gộp (vi.json, en.json); 13 file
test parent đã sửa khi gộp (khóa số key 1969→1972); test Q1 parent đã sửa
(pre-merge → post-merge); LIMITS tổng hợp này.

Tổng chờ push: **831 entry / 94 file paths** (đếm trực tiếp NUL trong
paths-loop: Phase 10 63 + đợt 51–60 768; 732 sau đợt 59 + 99 đợt 60).
Các đợt 1–50 đã push xong (HEAD e2cb35e1). Tổng file duy nhất đợt 60: 72
(batch luồng) + file parent-only (dict 2 + test 14 + LIMITS này).

# Phase 9 — Đợt 57, luồng N6: đóng nợ M10 §4 bằng SPS VUI timing

Ngày: 07/11/2026 (lượt cron 15:35 +07). Đóng nợ ở
`docs/PHASE9_ROUND56_M10_GOP_TRIAL_FOLLOWUP_LIMITS.md` §1.5 / §8.1:
2 trường hợp moov-giả tinh vi vẫn lọt qua guard
`validateSampleTimestamps` — (1) đổi tỉ lệ đều toàn bộ stts + sửa khớp
mdhd/mvhd, (2) hoán đổi delta giữ nguyên tổng thời lượng.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **(1) Đổi tỉ lệ đều + sửa khớp mdhd/mvhd — ĐÃ BẮT ĐƯỢC KHI SPS CÓ
   VUI TIMING.** Parser mới `parseSpsVuiTiming` (mp4Demux.ts) đọc
   `num_units_in_tick / time_scale` từ SPS trong avcC → fps VUI, nguồn
   thời gian độc lập thứ ba; kiểm (d) mới trong
   `validateSampleTimestamps` so fps-stts với fps-VUI (dung sai 2%).
   File giả dựng từ builder (stts 1000 → 500, mdhd/mvhd sửa khớp
   30000, VUI 1.0): T3 full-file `/VUI/` cả 2 mode — ở M10 cùng file
   này vẫn gop-range (lọt). File stts-giả thật của M10
   (`fake-stts-56m10.mp4`, VUI 30 vs stts 60, lệch 100%) cũng bị bắt
   bởi kiểm (d) nếu qua được kiểm (a) (nó đã bị chặn ở (a) vì mdhd
   không sửa — xem §2).
2. **(1) vẫn lọt khi SPS không có VUI timing** (fail-open, ghi rõ):
   test khóa gop-range cho trường hợp này. Trong repo 17/17 file thật
   đều có VUI (xem §2), nhưng encoder ngoài đời không phải lúc nào
   cũng ghi VUI — tỉ lệ ngoài repo chưa đo được.
3. **(2) Hoán đổi delta — VẪN LỌT, đã đánh giá kỹ và quyết định KHÔNG
   thêm kiểm hình dạng delta** (xem §3): VUI chỉ cho fps trung bình,
   hoán đổi giữ nguyên tổng/median/mode/trung bình nên mọi ước lượng
   đều không đổi; kiểm "delta xen kẽ bất thường" không có cơ sở hiệu
   chuẩn (trong repo KHÔNG có file VFR thật nào — cả 17 file đều CFR,
   maxAdjRatio = 1,00) và mẫu pulldown hợp lệ `[500,750]×30` cũng xen
   kẽ 100% ở tỉ lệ 1,5× nên ngưỡng naive sẽ chặn oan. Hoán đổi khối
   chỉ có 1 bước nhảy delta — không phân biệt được với đổi nhịp hợp lệ.
4. **Test mới 32/32 (đỏ-trước 2 lớp, xem §4).** Hồi quy GOP đầy đủ
   28/28 suite xanh (M10 28/28, L8 23/23, I6 25/25, N6 32/32, …);
   demux Q2 8/8. tsc 0 lỗi; vite build pass 5,82 s.

## 1. Hiệu chuẩn VUI trên file thật (đo thật, Node)

Script `measureVui57N6.ts` (bundle esbuild + node, dùng
`parseMp4VideoTrack` production + parser VUI mới): 17 file thật trong
repo/scratch (8 render/demo + 3 fixture real37/trailing + 6 file
encode ffmpeg profile/bigkey ở `scratch-round56-m10/profiles/`) +
file stts-giả M10 làm đối chứng âm. Kết quả: **17/17 file thật có VUI
timing, vuiFps = sttsFps = 30,0000, lệch tương đối 0,000%** trên mọi
file; `fixed_frame_rate_flag = false` trên mọi file (kể cả CFR —
ffmpeg/libx264 ghi 0, nên KHÔNG dùng flag này làm tín hiệu CFR).

| Nhóm file | Số file | vuiFps | sttsFps (timescale/median) | Lệch | fixed |
|---|---|---|---|---|---|
| render/demo (`agent-demo`, `clip1/2`, `demo-wipes/slides/fx`, `keyframe-text/video`) | 8 | 30,0000 | 30,0000 | 0,000% | false |
| fixture (`real37`, `trailing-real37`, `trailing-real180`) | 3 | 30,0000 | 30,0000 | 0,000% | false |
| ffmpeg profile (`baseline-high`, `high444p`, `high10`, `high422p`, `bigkey-4k/1080p`) | 6 | 30,0000 | 30,0000 | 0,000% | false |
| Đối chứng âm `fake-stts-56m10.mp4` (stts 512 → 256) | 1 | 30,0000 | 60,0000 | **100,000%** | false |

Thống kê hình dạng delta trên 17 file thật (phục vụ §3):
`maxAdjRatio = 1,00` và `số cặp kề tỉ lệ ≥ 1,5× = 0` trên MỌI file —
tức **không có file VFR thật nào trong repo** để hiệu chuẩn ngưỡng
hình dạng delta. 3 file footage có audio của M10 (DoD/NASA) không tìm
lại được đường dẫn trong đợt này nên KHÔNG đo lại VUI cho chúng (M10
đã đo chúng là CFR, max/median = 1,00 — xem LIMITS M10 §1.2).

### Chọn dung sai 2% (`SPS_VUI_FPS_TOLERANCE = 0.02`)

- Lệch đo được lớn nhất trên file thật: **0,000%** → dung sai 2% có
  headroom vô hạn trên dữ liệu đo được, nhưng không đặt 0% vì: (a)
  file 29,97 fps (VUI 29,97 vs stts median có thể 30,00 do lượng tử
  timescale) lệch ~0,1%; (b) VFR thật có median lệch khỏi fps danh
  định (xem dưới).
- Bắt được mọi đổi tỉ lệ đều ≥ 2% (vd 1,05× → lệch 5,0% → FAIL, có
  test; 2× → 100% → FAIL). Đổi 1,01× (1% < 2%) cố tình cho qua: lệch
  tốc độ 1% không đổi hành vi phát/tìm kiếm đáng kể — giống triết lý
  dung sai 1 frame của M10.
- Ba ước lượng fps-stts (median, mode, trung bình) và chỉ chặn khi
  CẢ BA đều lệch quá 2%: kẻ giả đổi tỉ lệ đều thì cả ba cùng bị nhân
  tỉ lệ nên vẫn bị bắt; file VFR thật được cứu bởi ít nhất một ước
  lượng trong các trường hợp thường gặp:
  - VFR lưỡng phân `[30×500, 30×1500]`: median fps 0,667 (lệch 33%
    so với VUI 1,0) nhưng fps trung bình 1,0 → qua (VUI = fps trung
    bình); với VUI 2,0 thì mode fps 2,0 → qua (VUI = nhịp nhanh nhất).
  - VFR `[25×500, 20×1000, 15×2000]`, VUI 2,0: median lệch 50%
    nhưng mode khớp → qua.
  - Ranh giới đã biết: VFR cực đoan `[40×2000, 20×1000]`, VUI 1,0 —
    cả ba đều lệch (40–50%) → FAIL → fallback full-file (vẫn phát
    được, chỉ mở chậm hơn). Đây là test khóa hành vi, không phải bug
    giấu: file VFR mà cả ba ước lượng đều lệch khỏi fps danh định
    quá 2% là hiếm nhưng có thật, và hướng an toàn là fallback.

## 2. Thiết kế (mp4Demux.ts — không đụng file luồng khác)

- `parseSpsVuiTiming(avcC)` — hàm thuần, chạy được ở Node, KHÔNG ném
  lỗi: lấy SPS đầu tiên trong avcC, gỡ emulation-prevention byte
  (`0x000003` → `0x0000`), parse SPS theo ISO/IEC 14496-10 §7.3.2.1
  + Annex E bằng bit-reader (Exp-Golomb ue/se) tới
  `timing_info_present_flag` rồi đọc `num_units_in_tick` (u32),
  `time_scale` (u32), `fixed_frame_rate_flag`. Trả
  `{fps, fixedFrameRate, numUnitsInTick, timeScale}` với
  `fps = time_scale / (2 × num_units_in_tick)` (1 frame = 2 tick).
  Mọi trường hợp không đọc được đều trả null → fail-open: avcC ngắn,
  numSPS = 0, SPS không phải type 7, VUI vắng, timing vắng, hết bit
  giữa chừng, `pic_order_cnt_type` lạ, `time_scale`/`num_units` = 0,
  fps ngoài miền [0,05, 1000] (vd ~2,1 tỉ fps → null, không chặn oan).
  Profile cao (100/110/122/244/…) được xử lý đúng nhánh
  chroma_format/bit-depth/scaling-matrix (bỏ qua scaling list theo
  spec) — đã kiểm chứng trên SPS thật High 100, High 10 (110) và
  High 4:4:4 (244, chroma 3 + scaling list + `000003`).
- `Mp4VideoTrack` thêm 2 field optional `spsVuiFps` /
  `spsVuiFixedFrameRate` (null khi không có VUI), `parseMp4VideoTrack`
  gắn từ `parseSpsVuiTiming(description)` — không đổi logic demux cũ.
  Chi phí parse không đáng kể (SPS ~40 byte, chạy 1 lần khi mở file).
- `validateSampleTimestamps` thêm kiểm (d) SAU các kiểm (a)–(c) (nên
  lý do `/mdhd/`, `/mvhd/`, `/delta/` cũ giữ nguyên thứ tự ưu tiên):
  lấy `rel = min(lệch median, lệch mode, lệch trung bình)` so với
  `spsVuiFps`; `rel > 0.02` → FAIL với lý do chứa `VUI SPS`
  (vd `fps theo stts 2.000 (median) / 2.000 (mode) / 2.000 (trung bình)
  lệch VUI SPS 1.000 (100.0% > dung sai 2.0%)`). VUI null → bỏ qua
  phần này. Mode delta tính trên mảng đã sắp xếp (đếm run dài nhất),
  không thêm lần sort nào.
- T3 KHÔNG sửa gì: `gopRangeFetch39T3.ts` đã gọi
  `validateSampleTimestamps(track)` và fallback `full-file` với lý do
  `/timestamp/` (M10) — kiểm (d) chảy qua đúng đường đó, áp cả 2 mode,
  không cần fetch thêm byte, không cần VideoDecoder. File của luồng
  N10 (`gopRangeFetch39T3.ts`, `gopTrialDecode55L8.ts`) không đụng.

## 3. Đánh giá trường hợp (2): hoán đổi delta — VẪN LỌT, và vì sao không thêm kiểm hình dạng

### 3.1 VUI không bắt được — chứng minh bằng số

Hoán đổi delta giữ nguyên đa tập (multiset) delta nên giữ nguyên tổng
thời lượng, median, mode, trung bình, max, min — mọi thống kê tổng hợp
mà guard (a)–(d) dùng đều không đổi, và fps VUI (một số vô hướng cho
cả file) cũng không đổi. Test khóa cả hai dạng: hoán đổi khối
`[[30,1500],[30,500]]` và hoán đổi xen kẽ `[1500,500]×30` (VUI 1,0)
đều `validateSampleTimestamps → ok` và T3 vẫn gop-range — bản gốc và
bản hoán đổi cho cùng một kết quả, không có tín hiệu nào trong moov
phân biệt được chúng.

### 3.2 Đã thử đánh giá kiểm hình dạng delta — quyết định KHÔNG thêm

- **Hoán đổi khối** (dạng của test M10): chỉ 1 cặp kề đổi (tỉ lệ 3×
  tại ranh giới khối). Mọi file VFR thật đổi nhịp giữa đoạn (vd hết
  đoạn slow-mo) đều có đúng dạng này — không có thống kê hình dạng
  nào bắt được khối-hoán đổi mà không chặn oan đổi nhịp hợp lệ.
- **Hoán đổi xen kẽ**: 59/59 cặp kề tỉ lệ 3×, đổi hướng 100% — một
  ngưỡng kiểu "≥ 80% cặp kề tỉ lệ ≥ 2× và đổi hướng" sẽ bắt được dạng
  này. Nhưng: (a) **không có cơ sở hiệu chuẩn** — trong repo không có
  file VFR thật nào (17/17 CFR, §1), mọi ngưỡng đều phải bịa từ mẫu
  tổng hợp; (b) **mẫu hợp lệ cũng xen kẽ**: 3:2 pulldown
  (24 fps trong container 30 fps) cho delta xen kẽ `[500,750]` tỉ lệ
  1,5×, đổi hướng 100% — test trong file này chứng minh mẫu đó phải
  qua guard; ngưỡng 1,5× sẽ chặn oan pulldown, ngưỡng 2× chỉ thoát
  được nhờ một đường tỉ lệ tùy tiện (kẻ giả hoán đổi delta tỉ lệ
  1,6× sẽ thoát, còn VFR điện thoại xen kẽ nhịp 30↔15 fps tỉ lệ 2×
  sẽ bị chặn oan); (c) chỉ bắt được MỘT dạng con của nợ (2), không
  bắt được hoán đổi khối — lợi ích nhỏ, rủi ro chặn oan file thật
  (dù chỉ fallback full-file) là thật. Vì vậy KHÔNG thêm kiểm hình
  dạng trong đợt này; ghi rõ là nợ còn lại thay vì thêm một guard
  không hiệu chuẩn được.
- **Hướng bắt được (2) trong tương lai (không làm trong đợt này):**
  timing từng frame trong bitstream — SEI `pic_timing` (nếu encoder
  ghi) mang timestamp từng picture, độc lập với stts; đối chiếu SEI
  với stts sẽ bắt được hoán đổi. Cần: đọc NAL SEI từ byte sample
  (T3 stream-mode hiện chỉ có sample 0), parse SEI, và xử lý khi SEI
  vắng (fail-open). Ghi để đợt sau cân nhắc, không claim đã làm.

## 4. Test mới `gopTrialDecode57N6.test.ts` — 32/32

### 4.1 Unit `parseSpsVuiTiming` (13 test)

- SPS thật High (trailing-real37) → fps 30,0, fixed=false, units=1,
  scale=60; SPS thật High 4:4:4 (chroma 3 + scaling list + 000003)
  → 30,0; SPS thật High 10 → 30,0.
- SPS tổng hợp (bit-writer trong test, baseline 66): 29,97 fps
  (60000/1001) → ≈29,97; fps 1,0 fixed=true → 1,0.
- Fail-open → null: không VUI; VUI không timing; cắt mất 3 byte cuối;
  SPS kiểu M10 (không VUI); fps vô lý (~2,1 tỉ); time_scale=0;
  avcC rỗng / numSPS=0. `SPS_VUI_FPS_TOLERANCE = 0.02` (khóa hằng).

### 4.2 Unit `validateSampleTimestamps` + VUI (12 test)

- CFR khớp VUI → ok; đổi tỉ lệ đều 2× + mdhd/mvhd khớp → FAIL /VUI/
  (nợ (1) đã đóng); 1,05× → FAIL /VUI/; 1,01× → ok (trong dung sai).
- VUI null + đổi 2× → ok (lọt khi VUI vắng — fail-open, ghi rõ).
- VFR lưỡng phân VUI=1,0 (nhờ avg) và VUI=2,0 (nhờ mode) → ok;
  VFR lệch median nhưng mode khớp → ok; VFR cực đoan cả ba đều lệch
  → FAIL /VUI/ (ranh giới đã biết).
- NỢ (2) CÒN LẠI: hoán đổi khối + hoán đổi xen kẽ → ok (khóa giới hạn);
  mẫu pulldown `[500,750]×30` → ok (lý do không thêm kiểm hình dạng).

### 4.3 Wiring + T3 thật qua server Range (7 test)

- Parse moov có avcC VUI → `track.spsVuiFps === 1`; avcC không VUI
  → null.
- Control VUI → gop-range cả 2 mode; file giả (1) có VUI →
  full-file /VUI/ cả 2 mode (test khóa nợ M10); file giả (1) không
  VUI → gop-range (lọt, fail-open); hoán đổi khối (cả bản gốc lẫn bản
  hoán đổi) → gop-range (nợ (2) còn lại).
- File thật `server/render/demos/keyframe-video.mp4` (762.441 byte,
  180 sample, VUI 30 fps) qua server Range → gop-range cả 2 mode.

### 4.4 Đỏ-trước đã verify (2 lớp, mẫu M10)

1. **Tạm vô hiệu parser** (`parseSpsVuiTiming` trả null ngay đầu hàm,
   1 marker REDCHECK): **25/32** — đúng 7 test phụ thuộc parser fail
   (5 parse + 1 wiring + 1 T3), còn lại xanh (fail-open giữ nguyên).
2. **Tạm vô hiệu kiểm (d)** (`if (false && rel > …)` trong
   `validateSampleTimestamps`, 1 marker REDCHECK): **28/32** — đúng
   4 test phụ thuộc kiểm (d) fail (3 unit FAIL + 1 T3).
3. Khôi phục từ backup: diff khớp 100% với bản gốc trước khi vô hiệu,
   **0 marker REDCHECK còn lại**, chạy lại: **N6 32/32**.

## 5. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round57-n6/run-regression-n6.sh`,
  sao từ M10 + thêm dòng N6): U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10,
  E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11,
  D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15, structuredNotes32 12/12,
  errorDetail34Q4 35/35, L8 23/23, M10 28/28, **N6 32/32**.
  Log `regression-n6.log`. (28/28 suite xanh.)
- Demux Q2 (`mp4Demux34Q2.test.ts`): **8/8** (parse thêm VUI không đổi
  hành vi demux).
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `vite build` (outDir scratch `~/scratch-round57-n6/build`): **pass**
  trong 5,82 s; chỉ cảnh báo chunk > 500 kB có sẵn.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/mp4Demux.ts` — parser mới `parseSpsVuiTiming` +
  `SpsVuiTiming` + `SpsBitReader` + `SPS_VUI_FPS_TOLERANCE` (0.02);
  `Mp4VideoTrack` thêm `spsVuiFps` / `spsVuiFixedFrameRate`;
  `parseMp4VideoTrack` gắn VUI từ avcC; `validateSampleTimestamps`
  thêm kiểm (d) VUI (median/mode/trung bình, chỉ chặn khi cả ba lệch).
  Không đổi logic demux khác, không đổi kiểm (a)–(c).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền
  lệ J6/K8/L8/M10).

MỚI:

- `apps/web/src/lib/gopTrialDecode57N6.test.ts` — 32 test (§4).
- `docs/PHASE9_ROUND57_N6_SPS_VUI_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `gopRangeFetch39T3.ts` / `gopTrialDecode55L8.ts` (file của
luồng N10 — guard mới chảy qua T3 sẵn có, không cần sửa),
`gopTrialDecode56M10.test.ts` (test M10 giữ nguyên — 2 test "NỢ CÒN
LẠI" của M10 cho trường hợp (1) vẫn assert gop-range trên builder
không-VUI của M10, đúng với hành vi fail-open khi VUI vắng; trường
hợp (1) có VUI đã được test N6 bắt), mọi file production khác.
Scratch + log ở `~/scratch-round57-n6/` (calibration VUI, check guard,
red-before ×2, backup mp4Demux, regression, build).

## 7. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **(1) vẫn lọt khi SPS không có VUI timing** (fail-open): trong repo
   17/17 file thật có VUI, nhưng tỉ lệ file ngoài đời có VUI chưa đo
   được (encoder không ghi VUI là chuyện thường — vd một số điện thoại
   / muxer). Không có nguồn độc lập thứ tư trong moov để đối chiếu
   khi VUI vắng.
2. **(1) vẫn lọt khi kẻ giả viết lại cả SPS VUI cho khớp stts giả.**
   Viết lại SPS khó hơn sửa số stts nhiều (phải encode lại bitstream
   SPS, sửa avcC, và SPS trong avcC phải khớp SPS trong band của IDR
   trong mdat) — guard này nâng rào chắn, không triệt tiêu. Hướng
   tương lai: đối chiếu SPS trong avcC với SPS trong band lấy từ
   sample 0 (cần byte sample — T3 stream-mode đã có).
3. **(2) hoán đổi delta vẫn lọt hoàn toàn** (§3): VUI mù trước lớp
   này; kiểm hình dạng delta đã đánh giá và KHÔNG thêm vì thiếu cơ sở
   hiệu chuẩn + rủi ro chặn oan pulldown/VFR thật. Hướng tương lai:
   SEI `pic_timing` (§3.2).
4. **VFR cực đoan (cả 3 ước lượng đều lệch khỏi VUI > 2%) → fallback
   full-file oan** (§1): file vẫn phát được, chỉ mở chậm hơn; là
   ranh giới đã biết, có test khóa.
5. **`fixed_frame_rate_flag = false` trên mọi file thật kể cả CFR**
   (§1): không dùng flag này làm tín hiệu CFR/VFR — guard hiện tại
   không dùng nó để quyết định chặn (chỉ expose trên track).
6. **Parser chưa kiểm chứng trên mọi profile**: đã qua SPS thật
   profile 66 (tổng hợp), 100, 110, 244 và SPS không VUI kiểu M10;
   profile khác (122, 83, 86, …) đi cùng nhánh code với 100/110/244
   nhưng chưa có mẫu thật; SPS dị (poc_type=1 nhiều cycle, MVC/SVC
   extension) → parser trả null → fail-open (hướng an toàn).
7. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); sample > 2 MiB ở stream-mode vẫn bỏ qua (M10 §8.2);
   chưa đo Safari/Firefox thật; phát hiện phụ `maxPresEnd ≈ 2^32`
   (ctts v1 offset âm — demux Q2, không đụng).

## 8. Ghi chú đợt 63 R10 (08/11/2026) — N6 vẫn giữ nguyên, không đào lại

Luồng docs đợt 63 R10 rà lại nợ N6 theo lệnh "ghi rõ vào LIMITS của đợt
này + vào file LIMITS liên quan nếu có" (nợ này được nhắc lại ở
`docs/PHASE9_ROUND62_LIMITS.md` §4.11 mà không có gì mới):

- **Quyết định giữ nguyên, không đổi:** hoán đổi delta stts vẫn lọt —
  giữ nguyên multiset nên mọi ước lượng fps (median/mode/trung bình)
  và fps VUI đều không đổi; kiểm hình dạng delta đã đánh giá kỹ và
  KHÔNG thêm vì thiếu cơ sở hiệu chuẩn (repo không có file VFR thật
  nào) + rủi ro chặn oan pulldown 3:2 / VFR thật (xem §3.2).
- **Không có bằng chứng mới:** các LIMITS đợt 58–62 nhắc lại nợ này
  nguyên văn ("Nợ cũ chưa đụng") mà không ghi thêm file VFR thật nào
  để hiệu chuẩn ngưỡng; không có thay đổi nào ở
  `validateSampleTimestamps` / `parseSpsVuiTiming` làm quyết định cũ
  lỗi thời. (Luồng này không quét lại toàn bộ file video trong repo —
  chỉ đối chiếu các LIMITS đợt 58–62.) Test khóa vẫn là
  `gopTrialDecode57N6.test.ts` 32/32 (2 test "NỢ CÒN LẠI" khóa hoán
  đổi khối + xen kẽ → ok, và pulldown `[500,750]×30` → ok).
- **Hướng bắt được trong tương lai (vẫn chưa làm):** đối chiếu SEI
  `pic_timing` từng frame với stts (§3.2) — cần đọc NAL SEI từ byte
  sample + xử lý khi SEI vắng (fail-open). Đợt sau muốn làm thì bắt
  đầu từ đây, không đánh giá lại từ đầu.
- Chi tiết đầy đủ: `docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md` §3.

# Phase 9 đợt 24 — Đóng nợ đợt 23: split τ, xóa mapper, fadeblack, đối chứng frand, kho dọc, lá sâu — LIMITS TỔNG HỢP (parent)

Ngày: 2026-10-30 (lượt cron 08:03). Đợt lớn, 6 luồng song song, KHÔNG push,
KHÔNG tag/release, KHÔNG binary, KHÔNG dist. Batch stage (không push) ở
`~/workspace/repo-1-push/paths-loop/phase9-round24-closing-debts23.txt`.

## 0. Chốt chặn + bối cảnh

- `round-in-progress.md` KHÔNG tồn tại → lượt chạy bình thường.
- Trước đợt: 2 batch chờ push (đợt 22: 29 file, đợt 23: 26 file; các đợt
  5–21 đã push xong chiều 29/10).
- Chủ đề chọn từ nợ mở đợt 23 §4 (không trùng batch đã stage): mapper
  khớp chuỗi, hàm sâu ép check thành chuỗi, `nestedSplitOffset` tuyến
  tính-only, lá sâu >1 tầng chưa có nút panel, fadeblack dip qua đen,
  quy tắc crf YUV ngoại lệ K→L, kho dọc mới 2 clip, ô đo còn thiếu
  (native 608, sàn crf0 4K, tab ẩn lâu/discard, so pixel trực tiếp).

## 1. Việc đã làm theo luồng

### H1 — nestedSplitOffset nghịch đảo τ
- `nestUtils.ts`: đảo ánh xạ thuận F của compose (đợt 23 G3) bằng
  bisection 100 vòng; mọi tầng hằng giữ nguyên công thức tuyến tính
  cũ (hồi quy strict); fail-fast khi curve sai hình dạng, không rơi
  lặng lẽ về tuyến tính.
- Neo tính tay: ramp 1→3, mốc ngoài 11.4641s → lá 2.0s (đường cũ cho
  ~2.369s, lệch 0.369s); chuỗi 2–3 tầng ramp, hỗn hợp hằng + ramp, lá
  có curve riêng — tất cả khớp trong 1e-9s (chặt hơn yêu cầu 1e-4s).
- Test mới `nestedSplitTau24.test.ts` 8/8 (parent chạy lại, khớp);
  hồi quy nestedDeep 16, splitTrim20 18, gateSampling22 12,
  speedcurve 22, twoLevelCurve 12 — đều 0 fail.

### H2 — Xóa mapper khớp chuỗi + hàm sâu trả check object
- `nestedCurveCreate.ts`: `nestedCurveCreateTwoLevelCheck()` trả
  nguyên check; panel dịch theo code. `nestUtils.ts`:
  `updateNestedDeepInnerClip` trả kèm `twoLevelCheck`; `store.ts`
  bỏ toàn bộ khối tách tiền tố, dịch bằng `translateTwoLevelCheck`.
- `nestedRejection.ts`: ĐÃ XÓA `TWO_LEVEL_PATTERNS`,
  `translateTwoLevelReason`, `twoLevelReasonKey` khỏi code sống.
  Fallback mới (trung thực): check không code / code lạ →
  `translateTwoLevelCheck` trả nguyên reason gốc (locale en sẽ lộ
  chuỗi Việt — fail-visible, nhánh cổng mới PHẢI có code).
- Test (parent chạy lại, khớp): G1 29/29, G2 24/24, 22A 38/38,
  T3 31/31, T4 11/11, H2 mới 10/10; i18n parity 811/811.

### H3 — fadeblack dip qua đen trong preview + fade native/4K
- `transitionPreview.ts`: `fadeblack` tách riêng — A tắt theo
  smoothstep trên [−0,01, 0,196], B mở theo smoothstep trên
  [0,122, 1,076], ghim 2 biên về đúng render. Các type khác không
  đổi hành vi (transitionPreview test 28/28, parent chạy lại).
- Footage K→L 720p: RGB 1,0916/100% KHỚP (cũ 34,6082 LỆCH);
  native 1080p RGB 1,0913 KHỚP; 4K upscale RGB 0,7621 KHỚP.
  Fade tuyến tính KHỚP mọi kích thước, cả 2 đường.
- PHÁT HIỆN THEN CHỐT: đường YUV của FFmpeg blend về đen Y=0 thay
  vì Y=16 limited-range → offset ≈ −12 ở p = 0,5, khiến YUV-in vẫn
  LỆCH (14,18 ở 720p) dù trọng số đã đúng. Preview alpha-only
  KHÔNG trừ được hằng số này → badge fadeblack giữ `approx`
  (đúng, không nâng khống). Bản fit YUV trung gian (B(0,5) = 0,282)
  đã bị loại vì ngụy trang offset thành trọng số sai.

### H4 — Đối chứng giả thuyết frand-mosaic + ô còn thiếu
- KẾT LUẬN LỚN: giả thuyết frand-mosaic ở dạng gốc BỊ BÁC ở mức
  sàn. Cơ chế thật là lệch hệ số chuyển màu: chuỗi render bt709
  (theo metadata nguồn) vs phép chuyển preview bt601. Tứ giác
  khép kín trên cặp K→L: mặc định 1,6946/98,36% XẤP XỈ (= đúng số
  đợt 23); ép chuỗi bt601 → 0,0024/100% KHỚP; ép bt709 → 1,6946
  (= mặc định); preview bt709 vs chuỗi mặc định → 0,0023 KHỚP.
  Chạy lại 2 lần, diff log rỗng.
- Bằng chứng phụ: mosaic khối 64/16px sàn 0,0000 (nhưng bị confound
  chuyển màu, chỉ là phụ); cặp R1→R2 có HF blend 74,79 CAO HƠN
  K→L (52,77) mà sàn vẫn KHỚP 0,6615 — HF cao không dự báo sàn
  trượt.
- Quy tắc crf YUV SỬA LẦN 2: với chuyển màu KHỚP, crf ≤ 10 cho
  KHỚP dissolve trên 6/6 nội dung (K→L KHỚP từ crf12) — "ngoại lệ
  K→L" của đợt 23 là artifact đo, không phải tính chất nội dung.
  Cảnh báo phương pháp: toàn bộ số YUV đợt 20–23 đều đo bằng
  phương pháp mismatched, mang lệch hệ thống 0,66–1,71 MAD theo
  nội dung. Từ đợt sau, đo parity YUV phải khớp hệ số chuyển.
- Ô còn thiếu đã đo xong: native 608×1080 K→L và J→L (verdict giữ
  nguyên như 720p/1080p; probe tại 608 cho cùng cơ chế chuyển
  màu); sàn crf0 4K dọc (upscale) J→K cả 2 type đều KHỚP
  (dissolve 0,5949, circleopen 0,6741) — không còn ô 4K nào chưa
  đo ở mức sàn trừ footage 4K thật.
- Không sửa code sản phẩm (render bt709 là đúng; lệch nằm ở phép
  so sánh của harness đo).

### H5 — Kho dọc ngoài vũ trụ + siết cổng NASA + cắt end card R1
- 2 clip mới ĐẠT chuẩn phát hành (không hạ chuẩn, quét toàn clip
  mỗi ~10s): N1 NASA SVS GUARDIAN tsunami vertical và N2 NASA SVS
  Arctic Sea Ice Minimum 2026 vertical — cả 2 H.264 dọc thật
  1080×1920 60fps, 0 người/0 vũ khí/0 logo/end card trong mẫu.
  ĐÍNH CHÍNH BẮT BUỘC: cả 2 là visualization khoa học NASA SVS
  (nhãn bản đồ/text xuyên suốt), KHÔNG phải cảnh quay camera
  thuần — hạng cảnh quay thuần ngoài vũ trụ vẫn thiếu.
- Parity N1→N2 dissolve RGB24 KHỚP (MAD 0,1000, 99,92%); chưa đo
  miền YUV cho cặp này.
- Cổng NASA đã siết: `check_nasa_release()` chỉ chấp nhận nhánh
  photographer (nhánh center đã xóa hoàn toàn); test phủ định:
  clip L đợt 22 (photographer trống, center HQ) bị REJECT đúng
  exit 1; R1/R2 vẫn OK. Script đợt 23 giữ nguyên và từ nay
  KHÔNG dùng cho quyết định phát hành.
- Cắt end card R1 — đính chính điểm cắt đợt 23: phải cắt ở
  46,5s (loại 8,27s đuôi: đồ hoạ từ ~46,7s, logo Artemis
  48,5–49,5s, meatball 50–54,77s), không phải "~5s cuối".
  Script `trim-r1-endcard.sh` chạy thử trên /tmp: bản ra 46,57s,
  frame cuối là cảnh nhà xưởng. Binary không vào repo.
- Ứng viên đã loại (không hạ chuẩn): 3 clip IA/Commons cảnh quay
  thật nhưng khung ngang (Elkhorn, Crooked River, Mountain
  Moment); tìm kiếm NASA images-api/IA không còn ứng viên dọc
  thật nào khác qua được cổng.

### H6 — Nút panel cho lá sâu + tab ẩn lâu/discard + so pixel
- `NestedClipPanel.tsx`: component `DeepInnerLevel` duyệt đệ quy
  "Xem bên trong" xuống mọi tầng; lá ở chain ≥ 1 có cùng nút
  "Đặt curve 1× cho lá" qua store action sâu với chainIds đúng.
  Test store mới 12/12 (parent chạy lại, khớp); i18n +2 key,
  parity 811/811.
- TRUNG THỰC về 3 nhánh nợ: với preset 1×, 2 nhánh
  `leafSelfCurveInvalid` và `ancestorKeyframeProduct` VẪN không
  sinh ra được từ trạng thái panel sạch (chứng minh toán học
  trong LIMITS H6 §1.3) — test khóa 2 nhánh này ở tầng store
  với patch chế tay, và khóa `ancestorCurveInvalid` ở chain
  sâu. Không claim nút preset phủ cả 3 nhánh trong use thường.
- Tab ẩn 600s (10 phút, đo thật — KHÔNG mạo nhận "hàng giờ")
  lúc ngủ: ticks đóng băng, sleeping=true suốt, canvas không
  discard; hiện lại vẽ đúng 1 lần rồi ngủ lại.
- Tab ẩn lúc phát tới cuối: playhead đứng yên lúc ẩn, hiện lại
  phát tiếp từ điểm cũ (không nhảy vọt), tới cuối đúng 8,0 rồi
  ngủ lại.
- Discard thật CHƯA đo được: tab sống sót dưới ép tối đa 500 MB
  (MemAvailable thấp nhất 779 MB, không chạm floor 300 MB);
  không ép mạnh hơn vì VM đầu lượt chỉ còn ~1 GB trống, không
  swap, và các luồng khác đang chạy song song.
- So pixel trực tiếp — KẾT LUẬN dị thường đợt 23 G4: lệch sau
  redraw là KHÁC THẬT (67,43% pixel, chỉ trong vùng video)
  nhưng KHÔNG phải bug redraw: khung trước ẩn là khung vẽ đầu
  chưa giải mã xong (gần đen), khung sau là frame 0 đã giải mã
  thật, ổn định tuyệt đối sau đó; redraw của khung đã giải mã
  (bfcache) thì pixel-identical 0/691712.

## 2. Sửa của parent ở bước gộp

- Không sửa logic nào của các luồng. Hai kiểm tra tương thích
  đã qua: (1) hunk H1 + H2 cùng nằm trong `nestUtils.ts` (marker
  cả hai đều có, không mất thay đổi do song song); (2) panel H6
  vẫn dùng `res.reason` — TƯƠNG THÍCH vì store sau H2 vẫn trả
  `reason` + `reasonKey` (dòng 2308/2314–2315); H6 chạy trước
  khi H2 lên đĩa nên chưa chuyển sang check object — việc đó
  để đợt sau, không phải bug (xem nợ).
- ĐÍNH CHÍNH cleanup của H3: LIMITS H3 ghi workdir đo đã xóa,
  nhưng trên đĩa vẫn còn `scratch-h3/` (18 file .raw, 1,4 GB,
  timestamp đúng khung giờ H3 chạy — tức là file H3, không phải
  scratch cũ). Parent đã xóa toàn bộ `scratch-h3/` vì mọi số đo
  đã nằm trong các JSON đã stage; thư mục này KHÔNG có trong
  batch. Từ đợt sau, luồng đo phải xác nhận `ls` thư mục
  scratch trống trước khi báo "đã dọn".
- `apps/web/dist/` (vite build kiểm chứng) không stage.

## 3. Kiểm chứng gộp của parent (chạy lại độc lập)

- tsc apps/web 0 lỗi; vite build pass (4,46s, chỉ warning chunk
  cũ).
- Test chạy lại: nestedSplitTau24 8/8, transitionPreview 28/28,
  G1 29/29, G2 24/24, 22A 38/38, T3 31/31, H2 10/10, H6 12/12,
  T4 11/11, nestedDeep 16/16, splitTrim20 18/18, gateSampling22
  12/12, speedcurve 22/22, twoLevelCurve 12/12.
- Script: node --check 4 script đo/harness mới + bash -n 2 script
  fetch/trim + ast.parse script đo H5 đều pass.
- Parity i18n 811/811 sạch (vi-only [] en-only []).
- KHÔNG chạy lại ở bước gộp: đo headed H6 (1 run), parity đầy
  đủ H4/H5, đo fade H3 — đó là số đo của luồng, ghi rõ trong
  LIMITS riêng.

## 4. Những gì CHƯA xong — nợ mở cho đợt sau (không mạo nhận)

- Cập nhật harness đo sang chuyển màu khớp (bt709 khi nguồn
  bt709) + đo lại toàn bộ bảng crf cũ bằng phương pháp khớp
  (nợ phương pháp lớn nhất sau H4 — cần luồng riêng + hồi quy).
- `nestedSplitOffset` chưa nối vào store action: cần action/
  panel mới (offset → `leaf.start + leafLocalTime` → gọi
  `splitNestedDeepInnerClip`) — hiện helper thuần chưa có caller
  sống ngoài test.
- Panel lá sâu nên chuyển từ `res.reason` sang check object/
  reasonKey của H2 (H6 chạy trước H2); sửa vị trí của nested
  trung gian tầng sâu qua panel cần action store mới (deep
  action hiện từ chối clip đích là nested).
- `nestedCurveCreateTwoLevelReason` deprecated còn tồn tại vì
  test T4 (xóa nốt cần sửa T4 trước).
- Fadeblack: sàn offset mức đen YUV (~13–14 MAD footage) — cần
  mô hình có hệ số chặn hoặc sửa mức đen ở render; fadewhite/
  fadegrays vẫn alpha tuyến tính cũ (cần số hạng màu trung
  gian mà TransitionVisual chưa có trường mang).
- Kho dọc: vẫn thiếu cảnh quay camera thuần ngoài vũ trụ; chưa
  đo miền YUV cặp N1→N2; bản R1 đã cắt + N1/N2 chỉ nằm ở /tmp
  (chạy lại 2 script fetch + trim khi đóng gói, SHA đã ghi).
- Tab ẩn hàng giờ/qua đêm + discard thật (ngưỡng Chrome tự
  discard hoặc qua chrome://discards) — cần máy đo riêng không
  chạy song song; máy thật / Safari / touch-pen / dpr > 1 vẫn
  chưa đo; click-test browser thật cho nút panel lá sâu và
  nested ramp vẫn chưa xong.
- Ba tầng 1→2 đều nhau vẫn không hợp được (giới hạn định dạng
  từ R1); attachment thời gian dưới ramp vẫn fail-fast cả
  preview lẫn render; chưa có clip 4K dọc quay thật.

## 5. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round24-closing-debts23.txt`
  (39 file text, NUL-delimited, không binary, không dist, không
  scratch, đã verify read-back 39 entry + mọi file tồn tại)
- Tổng batch đang chờ user push sau đợt này: 3 file paths /
  94 file (55 đợt 22–23 + 39 đợt 24; các đợt 5–21 đã push xong
  chiều 29/10).

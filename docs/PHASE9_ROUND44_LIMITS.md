# Phase 9 đợt 44 — LIMITS tổng hợp (đóng nợ đợt 43, 6 luồng, KHÔNG push)

Lượt cron 20:03 04/11/2026. Chốt chặn: `round-in-progress.md` KHÔNG tồn
tại → chạy bình thường. Trước đợt: 23 file paths / 965 entry chờ push
(đợt 22–43; đợt 1–21 đã push xong chiều 29/10). Chủ đề lấy từ nợ mở
đợt 43 §4, trừ 2 nợ cần cửa sổ yên từ main chat (phiên solo A/B thật,
phiên quiet khóa cổng CPU) vẫn giữ làm nợ mở, không ép đóng.
KHÔNG push, KHÔNG tag/release, KHÔNG binary trong batch.

## 1. Nội dung 6 luồng

- **Z1 settle** (`PHASE9_ROUND44_Z1_SETTLE_LIMITS.md`): ý tưởng mới —
  aim siêu chặt (cache tới setupCache + prefetchFrames − 3, bỏ
  stall-break 25 ms của Y1) + probe `asset:` trước race + phân loại
  diagnostic (production KHÔNG có nhánh retry do asset chưa sẵn).
  Aim đạt 2/2 attempt (Y1: 0/8) nhưng SUCCESS vẫn chưa bắt được:
  W2 lần này trả `ok=true` và tự evict trước nên counter cuối giữ 0.
  Tab ẩn 60 s dọn đúng 2/2 PARTIAL (nhánh dọn-ngay). KHÔNG sửa
  production code. Test mới 19/19; hồi quy Y1 14/14, X1 7/7, W1 6/6.
  Vỏ UI `.vcut.json` vẫn CHƯA click-test thật.
- **Z2 pause** (`PHASE9_ROUND44_Z2_PAUSE_LIMITS.md`): cả 3 nợ đều tái
  hiện đỏ-trước/xanh-sau. (a) Sửa ngủ/branch guard khi scrub về
  đúng t đã vẽ sau cạn cap (`planDrawnPlayheadRecovery` + 1 hunk
  guard trong preview.tsx). (b) Quirk seek-landing-0: đáp 0 liên tiếp
  quá 2 lần thử lại thì kết luận failed để đi nhánh vẽ → cap → ngủ
  có kiểm soát; phân biệt seek về 0 có chủ ý. (c) Rò AudioEngine
  là rò thật: 5 node/clip active khi cạn cap (MediaElementSourceNode
  không được lưu nên không ngắt được); sửa bằng `releaseElement`
  gọi trong vòng drop của Y2. Test mới 21/21, Y2 cũ 9/9, hồi quy
  liên quan tổng 114/114.
- **Z3 relink** (`PHASE9_ROUND44_Z3_RELINK_LIMITS.md`, đã stage riêng
  7 file): relink file > 128 MiB không có trần kích thước, nhưng
  phát hiện 1 bug thật — `relinkAsset` trả 0 khi tên mới trùng tên
  cũ và `relinkMedia` coi 0 là thất bại nên kẹt panel; đã sửa ở
  `relinkMedia`. Click-test headed file thật 134,8 MiB: hashing
  5→100, panel đóng, IDB khớp sau reload. Quyết banner: giữ tối
  thiểu 500 ms cho mọi file tại `ingestWithProgress`. Toast TTS:
  nguyên nhân gốc là CORS bridge không expose `X-TTS-*` (bridge CÓ
  gửi header) — đã sửa expose ở bridge (cần restart sau pull);
  fallback client ước lượng có "≈" theo 18,4 ký tự/giây (hiệu chuẩn
  1 giọng, 3 mẫu). Test mới 9/9, hồi quy 104/104.
- **Z4 GOP** (`PHASE9_ROUND44_Z4_GOP_LIMITS.md`): thiết kế lại fetch
  moov riêng — `findTruncatedMoovHeader` phân biệt "không thấy moov"
  với "header moov đã thấy, chỉ thiếu thân"; moov là box media đầu
  tiên thì gate lại với faststart rồi fetch đúng range moov (trần
  16 MiB). Moov 16 MiB thật qua bridge thật nay `gop-range` (Y4:
  fallback): 64 request, vẽ ngược 91 frame missing 0. Heap JS delta:
  129 MiB → 1,072×; 141 MiB → 1,087×; 256 MiB → 1,213× — luật phẳng
  1,09× của Y4 đánh giá thấp ở file lớn. QUYẾT: giữ trần 128 MiB
  (chưa đủ 3 điều kiện mở lại: T3 streaming, VideoFrame native tách
  riêng, cửa sổ quiet). Test mới 19/19; Y4/T3/X4/W4/V2 đều xanh;
  headed heap 10/10 mỗi biên, bridge 19/19.
- **Z5 probe** (`PHASE9_ROUND44_Z5_PROBE_LIMITS.md`): trần 1000 trong
  trang app thật (dist đóng băng, probe v2 đường N2): seek mạng nhỏ
  giọt mô phỏng 64 KiB/s giữ đúng 1000 mẫu đầu, dropped 1208/1144,
  kept + dropped = rafTicks − 1; seek kẹt giữ 1000, dropped 1604,
  chốt `unresolved`. Lưu ý: element đo nằm ngoài preview MediaPool
  (preview chưa có đường nạp qua mạng) nên là mức app-page, chưa
  phải "preview đã chạm trần". Đính chính "GOP 300": file
  sparse-gop-noise thực chất GOP 30 (lỗi `-g 300` không tắt
  scenecut); file phẳng / noise-30s đúng là 300, không sửa. Race
  frozen-dist tái hiện (9/60, 7/60 ENOENT) rồi sửa bằng copy tạm +
  rename: 60/60. Test 61/61 (Y5 cũ 54/54 + freeze 4/4 + correction
  3/3). Đính chính đếm của parent: Z5 thực tế 15 file trên đĩa,
  không phải 14 như báo cáo luồng (1 file sửa trong danh sách bị
  đếm thiếu; đối chiếu `find -newer` đủ 15).
- **Z6 compat** (`PHASE9_ROUND44_Z6_COMPAT_LIMITS.md`): badge qua
  i18n (4 key mới, i18n phẳng 966/966); badge = đường đã chọn thành
  hợp đồng thuần `resolveReverseEngineBadge` (cố tình không nhận
  tham số frame vừa vẽ, kèm test khóa trường hợp lệch cũ); guard
  `importFiles` khi IDB vắng ở mức runtime (headed Chromium thật,
  gỡ indexedDB bằng delete thuần: resolve, 0 unhandled rejection);
  probe `isConfigSupported` trước `configure` đủ 4 nhánh. Test mới
  10/10, Y6 rerun 11/11, headed Chromium 5/5 + 3/3 mới.

## 2. Kiểm chứng gộp của parent (độc lập)

- Đối chiếu baseline đầu đợt (`find -newer` so với
  round44-baseline.txt): đúng 47 file đổi/mới, khớp chính xác hợp
  6 danh sách LIMITS (0 file lạ; `__pycache__` .pyc trong
  apps/web/scripts bị loại khỏi batch như đợt 42; không binary,
  không dist).
- File chung nguyên vẹn: preview.tsx đủ 3 marker ROUND44-Z2 +
  3 marker ROUND44-Z6; tsconfig.json đủ 7 dòng exclude test mới;
  bridge chỉ 1 hunk Z3 (expose `X-TTS-*`); không luồng nào sửa logic
  của luồng khác.
- Parent chạy lại: `tsc --noEmit` 0 lỗi; `vite build` pass (6,54 s,
  outDir /tmp). Test mới chạy lại bằng esbuild bundle
  `--format=esm`: Z1 19/19, Z2 21/21, Z3 9/9, Z4 19/19, Z6 10/10,
  mjs Z5 7/7 — fail 0. Hồi quy cũ chạy lại: Y2 9/9, Y4 10/10,
  X4 10/10. Ghi chú cách chạy: test Z6 mở `apps/web/src/i18n/vi.json`
  theo đường tương đối từ repo root — chạy từ `apps/web` cho 8/10
  giả (2 fail ENOENT do sai CWD, không phải code); chạy từ repo
  root cho 10/10 đúng.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của
  các luồng, phiên solo thật, đo IDB thật, click-test headed Z1/Z3
  từng panel (chỉ đối chiếu LIMITS + test Node).
- Sửa của parent ở bước gộp: không sửa logic luồng nào; chỉ viết
  tài liệu này, file paths gộp và mục log. Batch Z3 giữ nguyên;
  batch gộp chứa cả store.ts + tsconfig.json + LIMITS Z3 nên nội
  dung cuối khi push vẫn đúng dù thứ tự push đổi (trùng có chủ ý
  như đợt 43 với Y6).

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round44-closing-debts43.txt`
  (48 file text, NUL-delimited, không binary, không dist, không
  pycache, đã verify read-back 48 entry + mọi file tồn tại) —
  gộp Z1–Z6 + LIMITS này.
- Batch Z3 riêng đã có từ trước:
  `phase9-round44-z3-relink.txt` (7 file).
- Tổng batch đang chờ user push sau đợt này: 25 file paths /
  1020 entry (965 đợt 22–43 + 7 Z3 + 48 đợt gộp này; đợt 1–21 đã
  push xong chiều 29/10). Entry đếm theo batch, file trùng giữa
  2 batch tính 2 lần như tiền lệ đợt 43.

## 4. Nợ mở cho đợt 45

1. Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat (nợ gốc nhiều đợt; nay có thêm cơ
   sở kỳ vọng từ Z5: trần 1000 đã chạm ở mức app-page).
2. Settle-drop: nhánh thử lại `asset:` vẫn chưa bắt được SUCCESS —
   cần mirror thêm decodeFrom/decodeTo/key/decoded của W2 để phân
   biệt "W2 decode một phần qua GOP lành" với fast-path, rồi chọn
   cửa sổ W2 nằm trọn trong GOP hỏng; tab ẩn ≥ 5 phút; click-test
   thật vỏ UI `.vcut.json`.
3. Pause: bằng chứng browser headed cho cả 3 sửa Z2 (fixture
   broken-gap); kind `"error"` vẫn chưa có bằng chứng; quirk đáp
   sai ở frame khác 0 chưa xử lý.
4. Relink/TTS: Safari/Firefox/máy thật; ước lượng TTS mới hiệu chuẩn
   1 giọng — câu rất ngắn/giọng khác có thể lệch hơn; bridge expose
   `X-TTS-*` chỉ có tác dụng sau restart bridge.
5. GOP: moov cuối file thật (trailing, mdat khổng lồ) vẫn fallback
   — cần tail-scan riêng; quyết mở lại > 128 MiB cần T3 streaming
   + VideoFrame native tách riêng + lặp ở cửa sổ quiet; headed qua
   route bridge Express thật cho production vite :5173 (Z4 đo qua
   harness :8930 → :8953 cùng luật loopback).
6. Probe: trần 1000 trên element preview thật (cần đường asset HTTP
   trong app); sweep đính chính "GOP thưa" từng dòng (Z5 mới liệt
   kê hệ quả ở §2.5, chưa sửa từng dòng); chạy lại chuỗi chain đầy
   đủ sau sửa copy frozen-dist.
7. Compat: badge từng frame (cần trạng thái `failed` của
   controller); badge đổi lang lúc pause có thể chậm 1 tick; chi
   phí probe mỗi cửa sổ GOP chưa đo ms; Safari/Firefox/máy thật/
   màn hình vật lý vẫn CHƯA ĐO.
8. Chung: mọi số timing đợt 44 đều under-load (6 luồng song song),
   cấm dùng làm baseline quiet hay claim fps.

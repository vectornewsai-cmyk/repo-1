# Phase 9 đợt 33 — Xác minh + follow-up đợt 32 (không ghi đè O) — LIMITS tổng hợp

> Lượt cron 14:03 01/11/2026. KHÔNG push, KHÔNG tag/release, KHÔNG
> binary vào repo. Đợt này KHÔNG phải đợt 32 mới: đợt 32 đã chạy
> lúc 08:03 cùng ngày với 6 luồng O1–O6 (chưa được stage/log bởi
> parent của lượt đó — xem §4). Các luồng P1–P6 của lượt này ban
> đầu được brief như "đợt 32", nhưng ngay sau khi P4 phát hiện
> trùng, parent đã chuyển hướng toàn bộ sang: xác minh độc lập
> claim của O + chỉ làm phần genuinely mới (nợ O để lại). File
> LIMITS riêng của các luồng vẫn giữ tên `PHASE9_ROUND32_P*` theo
> lệnh chuyển hướng; batch stage mang tên đợt 33 cho khỏi nhầm.
> Kiểm chứng gộp của parent (chạy lại độc lập, không lấy số của
> luồng làm chứng duy nhất): `tsc --noEmit` 0 lỗi (apps/web),
> `vite build` pass (5,74s), transitionPreview 31/31, seek 15/15,
> saveToast31 15/15, archiveNested32P4 7/7 (qua esbuild bundle
> theo header test — chạy strip-types trực tiếp sẽ lỗi resolve
> `./projectRepo` không đuôi, lỗi có từ trước), textStyle32O6D7
> 6/6, structuredNotes32 12/12, projectRepo 10/10, i18n vi = en
> = 918 key lá, 0 key mồ côi, `node --check` mọi script mới pass.
> KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed / FPS
> của các luồng — đó là số đo của luồng.

## 1. Đã làm (mỗi luồng xem LIMITS riêng)

- **P1 xác minh O1 + cặp màu thứ ba** (`docs/PHASE9_ROUND32_P1_DIP_STRICT_LIMITS.md`):
  Không đổi nút nào, không sửa harness O1. Chạy lại từ đầu khớp
  O1: lưới 30fps 21 ô khớp từng ô với JSON sau-áp của O1 (ô 0,75
  FW/FG phẳng gốc 3,33 XẤP XỈ → 1,33 KHỚP khi đánh giá ở p thật);
  lưới exact-p 162 ô tổng MAD 88,8065 (O1: 88,8063, chênh do làm
  tròn); bar strict vs CUR trên lưới 99 ô: 0 ô tăng, 0 tier tụt
  — claim O1 ĐƯỢC XÁC NHẬN. Cặp màu thứ ba cyan→magenta→yellow
  15 ô: tổng CUR 19,67 → N6 14,00 → product 13,67, 0 tier tụt,
  ô FW/FG 0,75 = 1,33 KHỚP. Hai ứng cử đều BỊ BÁC có lý do: cubic
  đơn điệu cho cùng từng chữ số (mọi p đo đều trùng nút); descent
  nút B giảm ô tăng 7 → 1 nhưng làm 10 ô khác tệ đi và tổng MAD
  tăng 84,33 → 86,67. Quyết định: GIỮ O1, không đuổi nhiễu làm
  tròn 8-bit (+0,3333).
- **P2 seek sau O3** (`docs/PHASE9_ROUND32_P2_SEEK_FOLLOWUP_LIMITS.md`):
  Không sửa code sản phẩm. Xác minh O3: seek 15/15, tsc 0, retry
  300s cùng kết luận O3 (nhịp ~1,29s, 0 listener tồn đọng,
  CPU ~0,04%), scrub dưới tải hội tụ trong cửa sổ 25s
  ((2872, 3083]ms). Mới: phát xuôi + ngược DƯỚI TẢI XUYÊN SUỐT
  (nợ O3 §7.2) — cả 2 lượt chạy hết 0→8s và 8→0s dưới 4x `yes`,
  0 frame đen; lượt 2 clip thứ 2 đói decode dưới tải (không phải
  lỗi seek). GOP thật của clip mẫu: VP9 640×360 30fps, keyframe
  ~0s và ~3,4s → GOP thưa ~3,4s; GOP dày vẫn CHƯA đo. Bẫy hội tụ
  giả tái hiện (kéo CDP thất bại thầm lặng 2/3 lần) và đã chặn
  bằng xác minh playhead sau mỗi lần kéo.
- **P3 K6 + snapshot** (`docs/PHASE9_ROUND32_P3_K6_SNAPSHOT_LIMITS.md`):
  Không sửa baseline K6 hay wiring O2. Xác minh O2: K6 guard 8/8
  trên bundle mới (không phải bundle O2), J6 17/17 trên bundle còn
  mới hơn, 0 CDP-HANG, 0 exception. Mới: nối snapshot cho 2 harness
  xuất hiện sau O2 (`probe-round32-o5-webcodecs-pipe.mjs` pipe và
  `seek-o3-browser-probe.mjs` WebSocket), probe treo giả lập 3/3
  PASS, snapshot ghi vào thư mục bền của O2. Cố tình KHÔNG nối
  file của P2/P5 đang chạy cùng đợt để tránh ghi chéo.
- **P4 archive nested** (`docs/PHASE9_ROUND32_P4_STRUCTURED_NOTES_LIMITS.md`):
  Phần duy nhất làm trước chuyển hướng nhưng đã tự tránh trùng:
  O4 đã làm xong archiveMissing*/quét blob nested/motionMigrated en.
  P4 đóng đúng nợ §3.2 của O4: `collectMediaSrcs` trong archive.ts
  nay đệ quy vào nested (pre-order, seen-set theo nhánh, loại
  `blob:`, cycle không treo) → stats export và note thiếu media
  tính cả nested, cả export lẫn import. Test mới 7/7 qua bundle
  thật; hồi quy 178 + 7 = 185 xanh; i18n giữ 918 = 918, 0 key mới.
  errorDetail bridge vẫn chưa sang cấu trúc/i18n (đổi contract
  bridge + consumer, ngoài phạm vi — xem LIMITS P4).
- **P5 WebCodecs + quy kết hồi quy** (`docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md`):
  Demux MP4 thật trong browser + `ReverseFrameCache` + hook rAF
  (module, CHƯA nối vào preview — tránh xung đột với P2; preview
  vẫn dùng đường element-seek cũ, KHÔNG claim 30fps ngược).
  Decode 1 GOP phẳng 577–607 fps, present ngược từ cache 278–306
  fps; footage nhiễu thật (testsrc2 + noise, GOP 300) decode phần
  mềm chỉ 31,9 fps — biên ~6%, chưa đủ chắc cho 30fps ngược trên
  > [Đính chính Z5 04/11/2026 — KHÔNG xoá dòng gốc] "GOP 300" ở đây
  > là clip nhiễu của P5: đặt -g 300 + cửa sổ decode 300 frame từ
  > keyframe 0, KHÔNG phải GOP hiệu dụng đều 300 (clip có 5 keyframe
  > do scenecut — xem đính chính tại P5 §2.3 và Z5 LIMITS).
  footage nhiễu ở VM không GPU. Flush chunk đơn: 1 output, 2,5ms
  (giải thích lần kẹt 20s của O5: đếm output trước flush). Đợt 33
  (§7): sửa sạch tsc (bỏ tham số `view` thừa của `findBox`, 13 điểm
  gọi; 5 lỗi P4 thấy trước đó đã được P5 sửa từ đợt 32); diff 3
  bundle cho thấy đường phát ngược không đổi cấu trúc, còn
  `seekElement` đổi từ single-shot (N2) sang retry-loop trong
  1 lần gọi (O5/O3) — KHÔNG được revert để lấy fps. Đo lại quiet
  trên cùng bundle: thưa 6,85–7,21 (tv 7,09), dày 21,78–22,69
  (tv 22,39) → kết luận O5 được SỬA: dày KHÔNG hồi quy do code
  (nằm trong khoảng rảnh N2 18,42–24,05; mức thấp của O5/P5-đợt-32
  là do tải song song); thưa còn dư ~20% so với 1 điểm 8,97 của N2
  (n=1) — chưa phân biệt được settle-wait vs phương sai, cần A/B
  `seekElement` ở đợt sau.
- **P6 blur + xác minh D7** (`docs/PHASE9_ROUND32_P6_BLUR_D7_LIMITS.md`):
  Không sửa code sản phẩm. Xác minh fix D7 của O6 còn nguyên
  (`loadAutosave` ghi lại spec khi `textStyleFixes.length > 0`),
  test khóa O6 6/6, hồi quy liên quan xanh (saveToast31 15/15 khi
  chạy từ gốc repo — khác ghi chú 14/15 của O6 do assertion stale
  đã được cập nhật ở đâu đó, P6 không đụng test đó). Blur: lưới
  compositing 270 ô (plan sản phẩm + source-over 8-bit + dip sản
  phẩm, so với kỳ vọng trung bình trực tiếp) 270/270 KHỚP,
  maxDiff ≤ 1, MAD tệ nhất 0,3747 — đây là bằng chứng tầng
  compositing, KHÔNG phải MAD browser/app-vs-xfade; MAD headed
  cho các ô mới vẫn CHƯA ĐO (cần parent chạy trong main chat
  theo đặc tả O6 §3.5).

## 2. Sửa / đối chiếu của parent ở bước gộp (trung thực)

- Không sửa logic luồng nào. Chỉ viết LIMITS tổng hợp này, 2 file
  paths (§4) và log vòng lặp.
- Đối chiếu file chung: `tsconfig.json` chứa exclude
  `archiveNested32P4.test.ts` của P4 cùng các exclude cũ;
  `archive.ts` chỉ có hunk P4 (collectMediaSrcs đệ quy) chồng lên
  nền O4 — P4 đã kiểm chứng vòng tròn export/import thật 7/7;
  2 harness P3 chỉ thêm wiring snapshot, câu reject gốc giữ nguyên
  verbatim theo LIMITS P3; `mp4Demux.ts` chỉ có sửa signature
  `findBox` của P5-đợt-33, tsc toàn project về 0 ở bước gộp.
- Lỗi tsc thoáng qua mà P4/P1/P6 thấy ở `mp4Demux.ts` /
  `reverseWebcodecs.ts` trong lúc các luồng song song đang sửa đã
  hết ở bước gộp (tsc 0) — P5 sửa xong trước khi parent chạy tsc.
- P2 ghi chú dist đã bị luồng khác build lại giữa chừng; số
  browser của các luồng gắn với snapshot bundle của từng luồng,
  không phụ thuộc dist hiện tại — parent không trích số browser
  nào như số của dist hiện tại.

## 3. Cái gì còn lệch và nợ follow-up (trung thực)

1. **A/B `seekElement` (nợ mới P5 §7.7):** cùng máy quiet, đo 3+3
   lượt với 2 bundle chỉ khác dạng `seekElement` (single-shot N2
   vs retry-loop hiện tại) để đóng dư thưa ~20% (settle-wait hay
   phương sai điểm N2 n=1). Thuộc luồng sở hữu seek, không làm lén.
2. **Quy tắc đo fps ngược từ nay (P5 §7.5):** luôn ghi tải máy +
   tốc độ xuôi + gap rAF; cấm so sánh hồi quy giữa các phiên khác
   chế độ tải — số dưới tải song song không làm baseline.
3. **Nối `ReverseFrameCache` + hook rAF vào preview** (P5 §6):
   chỉ sau khi có số bộ nhớ VideoFrame thật, hỗ trợ ctts/elst cho
   footage thật, đo lại trên máy có GPU; hook rAF nối sau khi
   luồng seek chốt (P2 đã chốt không sửa preview — đợt sau nối).
4. **Thiết kế cửa sổ decode-ahead cho footage nhiễu** (P5 §6):
   prefetch 2 GOP hoặc cửa sổ lớn hơn — cần số bộ nhớ trước; decode
   phần mềm footage nhiễu hiện chỉ 31,9 fps, biên ~6%.
5. **MAD headed cho blur đa cấu hình** (P6/O6): lưới compositing
   270/270 KHỚP không thay thế MAD browser; cần chạy đặc tả O6 §3.5
   trong main chat (subagent không có live-browser delegation).
6. **errorDetail bridge** (P4): cần bridge phát thêm `summaryKey` +
   params rồi web dịch theo code — đổi contract bridge + consumer
   CLI/MCP + suite `server/bridge/test/test-error-detail.cjs`.
7. **Nối snapshot cho harness còn sót** (P3 §6): `seek-p2-*` và
   `probe-round32-p5-*` (đợt này cố tình chưa nối vì luồng đang
   chạy); `mobile-touch-check` vẫn chưa nối (cần quyết định
   timeout cho send()); snapshot WS có bundle null; snapshot bền
   chỉ nằm trên đĩa VM, không backup ra ngoài.
8. **Nợ đứng chưa đo:** GOP dày cho seek; Safari / máy thật /
   dpr > 1 / viewport khác cho dip/seek/reverse; tọa độ spinner
   tuyệt đối trên máy user; lần treo THẬT có snapshot (mới chỉ có
   treo giả lập); tab ẩn hàng giờ / discard thật; footage dip khác
   ngoài K→L→J; điều kiện (b)(c)(d) của M6 vẫn mở; bar strict tuyệt
   đối 0 tăng vẫn còn 7 ô single gốc + 1 ô cặp thứ ba tăng +0,3333
   (mức nhiễu làm tròn 8-bit, tất cả vẫn KHỚP) — muốn 0 tăng tuyệt
   đối phải đổi mô hình hoặc phá lưới khác (P1 đã chứng minh khóa).
9. **Đợt 32 (O) chưa được stage/log bởi parent lượt 08:03** — xem
   §4: parent đợt này chỉ khôi phục bằng file paths riêng, không
   tự ý gộp công O vào batch đợt 33.

## 4. Batch đã stage (KHÔNG push), chờ user push sau

- `~/workspace/repo-1-push/paths-loop/phase9-round33-verify-followup-o32.txt`
  — batch đợt 33 (chỉ file của P1–P6, NUL-delimited, không binary,
  không dist; đã verify read-back + mọi file tồn tại).
- `~/workspace/repo-1-push/paths-loop/phase9-round32-O-unstaged-recovery.txt`
  — batch KHÔI PHỤC đợt 32 (O1–O6) do parent lượt 08:03 chưa stage/log:
  chỉ gồm file O đổi mà batch đợt 33 chưa bao (đã trừ 4 file P đã
  bao: `archive.ts`, `tsconfig.json`,
  `probe-round32-o5-webcodecs-pipe.mjs`, `seek-o3-browser-probe.mjs`;
  đã verify mọi file tồn tại). **Thứ tự push đề nghị: đẩy file
  khôi phục O32 TRƯỚC, rồi mới đẩy batch đợt 33** (P xây trên nền O).
  Nếu parent lượt 08:03 sau này tự stage một batch O32 nữa thì user
  chỉ push một trong hai bản O32, tránh commit trùng nội dung.
- Tổng batch đang chờ user push sau đợt này: xem log vòng lặp
  (10 file paths đợt 22–31 = 429 file, cộng 2 file mới đợt này).

# Phase 9 đợt 41: đóng nợ đợt 40 — LIMITS tổng hợp

> Đợt 41 gồm 6 luồng W1–W6 chạy song song tối 03/11/2026 từ lượt cron
> (chốt chặn sạch: không có `round-in-progress.md`), đóng nợ §5 của
> `docs/PHASE9_ROUND40_LIMITS.md`. KHÔNG push, KHÔNG tag/release,
> KHÔNG binary, KHÔNG dist. Mọi số dưới đây đều là số đã chạy thật;
> chỗ nào chưa đo được thì ghi rõ, không mạo nhận.

## 1. Đợt 41 đã làm gì (tóm tắt theo luồng)

- **W1 — settle-drop nhánh hoãn-dọn** (`PHASE9_ROUND41_W1_SETTLE_DEFERRED_LIMITS.md`):
  bắt được nhánh hoãn-dọn ngay lượt 1 trên browser: prefetch settle
  lúc decode cửa sổ W2 đang bay thì frame KHÔNG bị dọn ngay
  (tại mẫu settle: `decodeWindowInFlight = true`, counter giữ 0,
  cache 232 → 241), chỉ mất sau khi W2 kết thúc (~986 ms sau:
  cache 335 → 158, `uiStatus = off`, `prefetchFrames = 0`).
  Đính chính: lần dọn cuối KHÔNG ghi vào counter settled vì W2 tự
  `evictExcept` trước khi `decodePromise` resolve — claim đúng là
  về thời điểm, không phải tác nhân dọn cuối. Phải thêm 2 mirror
  chỉ-đọc (`decodeWindowInFlight`, `cacheFrames`) vì mirror cũ
  không phân biệt được "settle mà chưa dọn". Fixture testsrc2
  640×360 có B-frame (`has_b_frames = 2`), Chrome headless-new
  qua CDP (không phải headed thật), under-load. Unit 6/6, hồi quy
  T4 11/11, V4 ruler 6/6, U1 12/12, tsc 0, build pass.
- **W2 — pause t=0 hoàn thiện** (`PHASE9_ROUND41_W2_PAUSE_T0_LIMITS.md`):
  bắt trực tiếp race DSF=2 (poll 100 ms: skip 5 → draw 1, mean
  127,5, backing 1424×468 đúng trần min(dpr,2)); cap 600 lần
  render pause bị skip liên tiếp cho media hỏng vĩnh viễn (blob
  ngẫu nhiên chạm đúng 600 sau ~10 s → `exhausted`, ticks đứng
  yên suốt 90 s quan sát, không frame giả); DPR phân số 1,25/1,5
  và 4K DSF=1/2 đều vẽ đúng (4K skip tối đa 27 rồi draw).
  Đánh đổi ghi rõ: media chỉ chậm hơn cap thì không tự hiện
  frame cho tới khi user tác động. Chromium headed Linux (Xvfb),
  Safari/máy thật chưa đo. Test mới 13/13, hồi quy 79/79, tsc 0.
- **W3 — relink 2 tab + % mọi caller** (`PHASE9_ROUND41_W3_RELINK_LIMITS.md`):
  đua alias 2 tab app thật end-to-end 6/6 (tab C giữ lock
  `vcut-alias:<id>`: held đúng 1 + pending đúng 2, manifest vẫn
  `aliases = []` lúc bị chặn; nhả lock → đủ 2 alias, không
  deadlock; đua tự nhiên đủ 4 alias); nối % importFiles cho hết
  7/7 call site ngoài MediaBin (ExportPanel, StickerPanel,
  ProjectMenu, TtsButton, BgRemovePanel, TemplatePackModal ×2),
  dùng chung key i18n V5, i18n phẳng vẫn 962/962; import file
  130,6 MiB thật: hashing ≈ 5,5 s, storing IDB ≈ 2,1 s — nhưng
  KHÔNG log tải trong lúc chạy nên cấm trích làm baseline quiet.
  Test mới 4/4, hồi quy 73/73, tsc 0, build pass.
- **W4 — GOP: hiệu chuẩn + probe size + heap** (`PHASE9_ROUND41_W4_GOP_LIMITS.md`):
  hiệu chuẩn bridge thật GIỮ NGUYÊN ngưỡng 32 MiB (kẹp 30,14 /
  33,54 MiB; lượt đầu thừa ~1,6% do prefix 512 KiB + probe,
  trong khi tải lại toàn file loopback chỉ ~0,3–0,4 s nên không
  có cơ sở hạ ngưỡng); nối thật `discoverSizeBytes` cho proxy
  chưa biết size (HEAD → Range 0-0 → unknown, hỏng thì fallback
  full-file, vượt 128 MiB vẫn khóa); kế toán lượt đầu 101,47%
  file, cửa sổ thứ hai hit 0 request/0 byte, miss xa đúng 1
  request 206 tiết kiệm 94,9%; heap transient 1,5–1,7× file nên
  trần 128 MiB VẪN KHÓA, không bật đường >128 MiB. Test mới
  15/15, hồi quy V2 16/16 + T3 10/10, tsc 0, build pass.
- **W5 — probe per-seek v2 headed** (`PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md`):
  phiên headed N2 thật đầu tiên với `N2_PERSEEK=1`:
  `perSeekProbe.status = present`, 32 entries, validate 32/32.
  Tách được 8 entry reverse hoàn tất: nút thắt ở phía seek
  (seekLatency 1506–5474 ms, drawLatency 0–72,7 ms,
  `decodedDeltaToFirstDraw = 0`, mẫu seeking rising) — v1 gắn
  cả 8 là `mixed`; và k=22 ngược lại (seek 19,7 ms, draw trễ
  6700,7 ms) là decode stall sau seeked, tức lỗi quy tắc v1.
  Đối chiếu unresolved bằng elementId + flushElementSrc thành
  công (11 thumbnail-strip tách khỏi 1 entry phát chính).
  Quyết: KHÔNG thêm nhãn cơ chế mới — `analyzeSeekingSamples`
  đã đủ làm lớp bằng chứng, mẫu `flat` chưa từng xuất hiện trên
  Chrome thật nên thêm nhãn là bịa taxonomy. N2 verdict PARTIAL
  (phát ngược suy giảm, fps ngược 0,23), under-load — không phải
  baseline sản phẩm. Không sửa code sản phẩm, không test mới.
- **W6 — cổng CPU: runner quiet, KHÔNG KHÓA** (`PHASE9_ROUND41_W6_CPU_GATE_LIMITS.md`):
  runner quiet mới chạy thật 2 lần, cả 2 đều TỪ CHỐI đo probe
  (exit 2, `REFUSED-BUSY`, `locked: false`): CPU đã yên dần
  (load1 1,52 → 0,66) nhưng RAM available chỉ 4–10%, trượt ngưỡng
  20% — phát hiện mới: máy bận theo RAM chứ không bận theo CPU.
  Không nới ngưỡng, không sửa ngưỡng, không đo probe under-load.
  Khung quyết định cho đợt sau đã trình bày (hỏi RAM trước hỏi
  busy; nếu busy trượt lúc yên thì giữ/hạ/loại theo điều kiện
  rõ ràng) nhưng KHÔNG tự quyết. Test runner 11/11, hồi quy
  diag 17/17 + cổng T6 8/8, tsc 0. Probe U4 nguyên vẹn.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập)

- Đối chiếu đĩa bằng mtime (lưu ý: shell chạy UTC nên mốc đúng
  là 13:00 UTC = 20:00 +07; file `round41-baseline.txt` trong
  hidden_files ghi rõ mốc này): đúng **27 file** đổi/mới, khớp
  chính xác hợp 6 danh sách LIMITS (0 file lạ, 0 file thiếu,
  không binary, không dist). File chung gộp nguyên vẹn:
  `reverseWebcodecs.ts` đủ cả hunk W1 (mirror chỉ-đọc) và hunk
  W4 (probe size); `preview.tsx` đủ 10 marker `ROUND41-W2`;
  `tsconfig.json` đủ 4 dòng exclude test mới (W1, W2, W3, W4;
  W5 không test mới, W6 test `.mjs` ngoài `include: ["src"]`
  nên không cần dòng exclude).
- `tsc --noEmit`: **0 lỗi** (log rỗng); `vite build`: **pass
  (5,73 s)**, cảnh báo chunk > 500 kB cũ.
- Chạy lại test mới qua esbuild bundle (cần bundle vì Node
  strip-types trực tiếp không resolve import không đuôi `.ts` —
  lỗi này là của cách chạy, không phải của code; tiền lệ các đợt
  trước cũng vậy): settleDeferred 6/6, pauseDraw 13/13,
  importProgress 4/4, gopSizeProbe 15/15, cpuGateQuietRunner
  11/11 — fail 0.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của
  các luồng, phiên solo thật, đo IDB thật, click-test W3 từng
  panel (chỉ đối chiếu LIMITS + script `node --check`).

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round41-closing-debts40.txt`
  (28 file text, NUL-delimited, không binary, không dist, đã
  verify read-back 28 entry + mọi file tồn tại): 27 file đợt 41 +
  file LIMITS tổng hợp này.
- Tổng batch đang chờ user push sau đợt này: 20 file paths
  (đợt 22–41; các đợt 1–21 đã push xong chiều 29/10).
  Tổng số entry cộng dồn: 876 (đợt 22–40) + 28 = 904 — con số này
  là tổng các entry paths (có file xuất hiện ở nhiều đợt), không
  phải số file duy nhất.

## 4. Loại khỏi batch — và lý do

- `apps/web/dist/`: build lại ở bước gộp, theo tiền lệ không vào
  batch.
- Scratch ngoài repo: `/tmp/round41-w1/` … `w6/`,
  `~/workspace/tmp-round41-w3-big/` (file 130,6 MiB đo import,
  parent có thể xoá sau khi push) — không vào batch.
- `package-lock.json`: không đổi trong đợt này nên không có gì
  để loại thêm.

## 5. Nợ mở cho đợt 42 (từ LIMITS W1–W6, không trùng batch đã stage)

1. **Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa
   sổ yên ~20–40 phút từ main chat** (W5/W6): tái tạo mẫu rising,
   tìm trường hợp flat, quyết cuối quy tắc nhãn §4.3 của W5;
   chạy wrapper W6 → U4 đầy đủ rồi mới quyết khóa/sửa/loại
   ngưỡng CPU theo khung W6; hỏi RAM trước hỏi busy (ngưỡng RAM
   20% có thể không đạt được trên VM 8 GB này).
2. **Settle-drop:** tác nhân dọn của lần thử lại (counter tăng)
   chưa có bằng chứng browser — cần W2 suy biến kết thúc không
   evict; headed thật, GOP thưa, file > 32 MiB qua GOP Range,
   đường `asset:`, tab ẩn, máy quiet chưa đo.
3. **Pause t=0:** seek-timeout/seek-lỗi với media hỏng vẫn chưa
   có cap (cap W2 chỉ chặn đường render-retry); Safari/máy thật
   chưa đo.
4. **Relink:** banner % của 7 panel mới chưa click-test riêng
   từng panel; số file > 128 MiB cần chạy lại trong cửa sổ yên
   có log tải mới thành baseline; Safari/Firefox/máy thật chưa
   kiểm chứng lock.
5. **GOP:** quyết mở lại > 128 MiB cần đo heap browser headed
   trên file 128 MiB+ thật; headed test proxy → probe → GOP →
   frame ngược trên canvas; chia sẻ kết quả probe vào T3 (hiện
   2 HEAD trùng); moov 16 MiB thật; footage B-frame/audio xen kẽ.
6. **Probe v2:** bằng chứng runtime solo → Q6 → N2 với cờ bật
   (W5 chạy N2 trực tiếp; xác nhận 3 tầng của V1 vẫn chỉ ở mức
   dry/audit code); trần 1000 mẫu chưa thử thách; Safari/máy
   thật/footage B-frame/đường WebCodecs chưa đo.
7. **Chung:** mọi số timing đợt 41 đều under-load (6 luồng song
   song) hoặc gắn dist cũ — cấm dùng làm baseline quiet hay claim
   fps; phiên N2 của W5 là PARTIAL nên không phải baseline sản
   phẩm.

# Phase 9 đợt 39: đóng nợ đợt 38 — LIMITS tổng hợp

> Đợt 39 gồm 6 luồng T1–T6 chạy song song sáng 03/11/2026 từ lượt cron
> (chốt chặn sạch: không có `round-in-progress.md`), đóng nợ §5 của
> `docs/PHASE9_ROUND38_LIMITS.md`. KHÔNG push, KHÔNG tag/release,
> KHÔNG binary, KHÔNG dist. Mọi số dưới đây đều là số đã chạy thật;
> chỗ nào chưa đo được thì ghi rõ, không mạo nhận.

## 1. Đợt 39 đã làm gì (tóm tắt theo luồng)

- **T1 — phiên đo solo A/B thật** (`PHASE9_ROUND39_T1_SOLO_AB_LIMITS.md`):
  phát hiện và sửa bug chặn toàn bộ chế độ `run` của runner đợt 38
  (`REPO` lùi 2 cấp thay vì 3 → đường dẫn probe thành
  `apps/apps/...`; dry-run/self-test không dùng `REPO` nên vẫn xanh).
  Sau sửa: test runner 11/11, cổng v3 13/13, dry-run lúc yên exit 0,
  lúc bận exit 2 fail-closed đúng thiết kế. **Phiên solo thật CHƯA
  CHẠY**: 32 phút quan sát máy không đạt điều kiện solo (chrome
  2–28 không về 0, load15 không dưới 2,11 do các luồng khác chạy),
  T1 quyết định không chạy chen. Kết luận: **CHƯA khóa A/B <10%,
  không đổi ngưỡng/cổng nào.** Runner đợt 38 thực ra chưa cài cờ
  near-threshold-load5 (≥ 1,90) — phiên sau tính từ
  `verifySolo.loadSignals.load5Max` đã có trong JSON lượt.
- **T2 — probe per-seek cho harness N2**
  (`PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md`): cài đúng thiết kế
  U6 §3.3 (chặn setter `currentTime`, 17 trường/spec + trường mở
  rộng ghi rõ ngoài spec), mặc định TẮT (`N2_PERSEEK=1` để bật).
  Test mới 10/10, gate v3 + solo runner 24/24. Phiên headed thật
  với probe bật (under-load, verdict N2 PARTIAL, không phải
  baseline): 24 entries validate sạch; 6 seek ngược hoàn tất có
  seekLatency trung vị 1604 ms nhưng drawLatency trung vị chỉ
  7 ms → nút thắt nằm trong quá trình hoàn tất seek, không ở
  presentation sau seeked; mẫu không khớp sạch dự đoán §3.3 nên
  gắn nhãn `mixed` đúng. Thiếu sót của §3.3 đã tự quyết và ghi rõ:
  định nghĩa "một seek", firstDraw chỉ là "đủ điều kiện vẽ" qua
  rAF (chưa phải bằng chứng canvas đã vẽ), segment chỉ đúng khi
  GOP đều.
- **T3 — demux mảnh + Range theo GOP thật**
  (`PHASE9_ROUND39_T3_GOP_RANGE_LIMITS.md`): module mới
  `gopRangeFetch39T3.ts` gọi đúng cổng gate U2 (không sửa cổng):
  probe Range → tiền tố 512 KiB → demux mảnh (chỉ box moov) →
  chia GOP tại keyframe → fetch từng GOP bằng Range → ghép init
  EncodedVideoChunk; mọi bước hỏng đều fallback `full-file`,
  không throw, không chunk nửa vời. Fixture ffmpeg testsrc2
  320×240 30 fps 2 s `-g 10`: 6 GOP, 60/60 chunk khớp từng byte,
  tổng Range GOP đúng tổng sample, overhead 0; fallback đã kiểm
  chứng (moov cuối, 200 phớt Range, Accept-Ranges none, GOP 416,
  lỗi mạng). Test mới 10/10, gate U2 cũ 20/20. **Cố tình CHƯA nối
  vào ReversePreviewController** (controller vẫn tải toàn file;
  module là đường fetch sẵn sàng, đợt sau quyết ngưỡng + cache
  GOP). Giới hạn: chỉ avc1 không fragmented, moov > 16 MiB →
  fallback, chưa đo file > 128 MiB thật / bridge thật / Safari.
- **T4 — click-test full-app proxy lớn + quyết định re-gate Q3**
  (`PHASE9_ROUND39_T4_PROXY_CLICK_Q3_LIMITS.md`): **GIỮ LUẬT
  T2 — cổng S3 chỉ xét lúc BẬT, KHÔNG re-gate liên tục** (decode
  cùng fixture dao động 10–383 fps theo tải nên re-gate sẽ quyết
  bằng nhiễu; hysteresis 3 cửa sổ ≈ 7,5 s phản ứng quá chậm;
  bằng chứng browser: controller đang chạy vẫn chạy khi số đo mới
  tụt còn 33,43 fps < ngưỡng 60). Tắt giữa chừng nay có nghĩa đầy
  đủ: không prefetch mới + aheadRange null ngay + prefetch đang
  bay bị dọn khỏi cache khi settle (luật dọn khóa bằng test thuần;
  trên browser lượt 3 prefetch đã settle trước lúc tắt nên
  settle-drop **không bắt được bằng chứng browser**, ghi rõ không
  mạo nhận). Badge nhiều controller: `badgeBlockedMulti` + title
  liệt kê từng clip. Click-test full-app lượt 3: **6/6**, proxy
  720p thật qua bridge **203.093.266 byte** (vượt ngưỡng S4
  134.217.728), cửa sổ scoped trong clip proxy đang chạy ngược:
  `controllerFetches` 6 → 6 (**delta 0**), `largeFileLocked =
  true` — tức 0 request từ controller cho proxy > 128 MiB (không
  claim 0 request mạng tổng). Test mới 11/11, U1 cũ 12/12, i18n
  959 key vi=en. Hạn chế: `seekRuler` (click ruler) không có tác
  dụng — cửa sổ scoped vẫn hợp lệ nhờ nút Phát ngược tự bắt đầu
  từ cuối timeline; số P2 lượt 2 là số của khoảng chết, cấm trích.
- **T5 — relink/alias bền vững**
  (`PHASE9_ROUND39_T5_RELINK_LIMITS.md`): đo ingest file MP4
  **261,0 MiB** thật (720p 16,07 s, SHA-256 khớp 3 đường đo): băm
  một lần WebCrypto 889 ms / 293,6 MB/s nhưng +543 MB RSS; băm
  tăng dần 8 MiB 9.333 ms / 28,0 MB/s, 0 tăng RSS;
  `ingestWithProgress` trọn vẹn 9.186 ms / 28,4 MB/s, 35 sự kiện.
  UI tiến trình: pha + byte + % thật (pha storing ghi rõ "đang
  ghi — không có %" vì IDB put nguyên tử, không bịa %); hybrid
  64 MiB (file nhỏ WebCrypto nhanh, file lớn băm lát). Hàng đợi
  tuần tự hóa theo assetId: 10 `addAlias` song song → đủ 8 alias
  duy nhất (giới hạn: khóa chỉ trong một tab, đua liên tab vẫn
  mở). `cleanupStaleAliases()` + nút "Dọn alias thừa" +
  `relinkMedia` ghi alias cho tên cũ để project cũ bền từ lần
  relink này. Test mới 11/11, U3 cũ 7/7, hồi quy assetStore 22/22,
  importAsset 8/8, rehydrate 19/19. Chưa click-test panel thật;
  chi phí ghi đĩa IDB Chromium thật chưa đo (script đo dùng fake
  IDB); importFiles thường vẫn chưa có %.
- **T6 — mobile/DPR/fallback + cổng CPU**
  (`PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md`): chẩn đoán frame đầu
  muộn trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB: mỗi seek bay 1,2–6,8 s trong khi
  playhead lùi ~0,87× realtime nên lag lúc seek xong 2,2–4,9 s
  vượt guard 2 s → 4 seek xong liên tiếp đều bị chặn. Sửa: bypass
  guard đúng tick vừa hoàn tất seek (`stepDrawAllowedWithCompletion`
  + cờ `seekCompletedThisTick` trong `preview.tsx`; guard 2 s vẫn
  nguyên cho mọi tick khác). Đo lại cùng file, cùng kịch bản:
  frame đầu **17.808 ms → 6.886 ms (sớm 2,6×)**, draw trong 20 s
  2 → 10, skip 280 → 102. Click-test dpr>1: backing 1424×468
  đúng trần `min(dpr,2)` ở cả DSF=2 và 3, đường `asset:`
  rehydrate đúng, bấm Phát vẽ đúng nội dung. **Lỗi tìm thấy,
  không sửa ở luồng này:** frame pause tại t=0 không vẽ (vòng lặp
  ngủ với `lastDrawn=0` — tick seek xong chạy khi element chưa có
  frame nên skip nhưng code vẫn gán `lastDrawn=t` vô điều kiện
  rồi ngủ vĩnh viễn); đối chứng DSF=1 tái hiện y hệt → lỗi có
  sẵn của vòng lặp preview, không đặc thù dpr. Serve-variance:
  **bác bỏ giả thuyết serve** — cùng script (đã đóng modal của
  U5), cùng dist đóng băng: static PASS 2/2 và vite preview PASS
  2/2, số đo giống hệt; khác biệt đợt 37/38 nằm ở phiên bản
  script. Cổng CPU: hiệu chuẩn lặp 2 lần × 3 vòng, tầng CDP phân
  biệt 3/3 cả 2 lần nhưng tầng Node trượt cả 2 lần → **không
  lockable, CHƯA KHÓA**; khung `cpuGate39T6.ts` (`locked: false`,
  chưa nối vào harness nào) + test 8/8. Mọi số timing T6 đều
  under-load (4 vCPU, RAM ~88%, 13 Chrome của luồng khác) — cấm
  dùng làm baseline quiet.

## 2. Kiểm chứng gộp của parent (chạy lại độc lập)

- Đối chiếu đĩa với baseline hash đầu đợt: đúng **40 file** đổi/mới,
  khớp chính xác hợp 6 danh sách LIMITS (không file lạ, không
  file thiếu). File chung gộp nguyên vẹn: `tsconfig.json` đủ 6
  dòng exclude test đợt 39; `preview.tsx` còn đủ marker T4 (toggle/
  badge, `knownSizeBytesForPreview`) và T6 (`seekCompletedThisTick`,
  `stepDrawAllowedWithCompletion`); i18n vi=en **959/959 key**,
  đủ 8 key `relink.*` và key `decodeahead.*` cả hai ngôn ngữ,
  vi-only = en-only = [].
- `tsc --noEmit`: **0 lỗi** (ghi chú: T4 từng thấy 7 lỗi ở
  `assetStore.ts` + `relink39T5.test.ts` lúc các luồng còn sửa song
  song — đó là trạng thái trung gian, file cuối đã hết lỗi).
- `vite build`: **pass (4,73 s)**; cảnh báo chunk > 500 kB cũ, không
  phải lỗi mới.
- Chạy lại test: T1 runner 11/11, T2 per-seek 10/10, T3 10/10,
  U2 20/20, U1 12/12, T4 11/11, T5 11/11, U3 7/7, T6
  reversePlayback 10/10, T6 cpuGate 8/8.
- KHÔNG chạy lại ở bước gộp: phiên solo thật (chưa có cửa sổ
  yên), mọi phép đo browser headed/FPS của các luồng (chỉ đối
  chiếu LIMITS + JSON đã lưu), đo ingest IDB Chromium thật.

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round39-closing-debts38.txt`
  (41 file text, NUL-delimited, không binary, không dist, đã
  verify read-back 41 entry + mọi file tồn tại): 40 file đợt 39 +
  file LIMITS tổng hợp này.
- Tổng batch đang chờ user push sau đợt này: 18 file paths
  (đợt 22–39; các đợt 1–21 đã push xong chiều 29/10).

## 4. Loại khỏi batch — và lý do

- `apps/web/dist/`: build lại ở bước gộp, theo tiền lệ không vào
  batch.
- Scratch ngoài repo: `~/workspace/tmp-round39-t1-scratch/`,
  `~/workspace/tmp-round39-t4/`, `~/workspace/tmp-round39-t6/`,
  `~/workspace/t5-measure/`, fixture MP4 trong `os.tmpdir()` lúc
  test chạy — không vào batch.
- `package-lock.json`: không đổi trong đợt này (không luồng nào kê
  khai, baseline hash khớp) nên không có gì để loại thêm; lưu ý
  đợt 38 về lock vẫn giữ nguyên khi user push.

## 5. Nợ mở cho đợt 40 (từ LIMITS T1–T6, không trùng batch đã stage)

1. **Phiên solo A/B thật vẫn chờ cửa sổ yên liên tục ~20–40 phút**
   (T1): chạy từ main chat khi máy yên, sau đó mới khóa <10% +
   chốt v3; nối `perSeek` từ forward-hold.json vào solo runner
   (hiện còn hardcode "absent…") và xác nhận `N2_PERSEEK=1` chảy
   qua solo→Q6→N2 bằng 1 lượt solo khô trước phiên thật.
2. **Nối GOP fetch vào ReversePreviewController** (T3): quyết
   ngưỡng + cache GOP, đo trên file > 128 MiB thật qua bridge
   thật; probe per-seek v2 cần elementId + lấy mẫu decodedFrames
   TRONG lúc seeking (T2).
3. **Lỗi vòng lặp preview: frame pause t=0 không vẽ** (T6 §3.3):
   giao luồng sở hữu vòng lặp, sửa + đối chứng DSF=1 và dpr>1.
4. **Settle-drop của prefetch khi tắt giữa chừng** (T4): cần bằng
   chứng browser (prefetch còn bay đúng lúc tắt), không chỉ test
   thuần; `seekRuler` click ruler không tác dụng — sửa hoặc ghi
   rõ là hành vi có chủ đích.
5. **Relink:** click-test panel tiến trình trên browser thật; đo
   chi phí ghi đĩa IDB Chromium thật; đua alias liên tab; đưa %
   vào importFiles thường (helper đã sẵn).
6. **Cổng CPU:** khóa chỉ sau một phiên quiet có điều phối; nếu
   tầng Node vẫn trượt trong phiên quiet thì sửa/loại tiêu chí
   Node trước khi khóa — cấm khóa từ dữ liệu under-load.
7. **Chung:** mọi số timing đợt 39 đều under-load (6 luồng song
   song) hoặc gắn dist cũ — cấm dùng làm baseline quiet hay claim
   fps; Safari / máy thật / GPU thật / footage B-frame vẫn chưa
   đo cho nhiều mảng trên.

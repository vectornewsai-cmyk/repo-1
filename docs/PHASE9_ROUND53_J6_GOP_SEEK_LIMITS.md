# Phase 9 — Đợt 53, luồng J6: GOP/seek — chặn moov giả trỏ vào trong file + thu hẹp cổng e2e + guard seekable pre-seek

Ngày: 07/11/2026 (lượt cron 03:35 +07). Nối nợ đợt 52 §4.5
(`docs/PHASE9_ROUND52_LIMITS.md` §4.5, `docs/PHASE9_ROUND52_I6_GOP_LONG_SESSION_LIMITS.md`
§3.3/§5/§8, `docs/PHASE9_ROUND52_I8_SEEK_PIXEL_LIMITS.md` §5.1/§6.3/§10).
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Moov giả trỏ VÀO TRONG file — ĐÃ CHẶN được ở tầng T3 (§1).**
   Hai lớp mới sau demux: (a) stco-khớp-mdat — mọi sample phải nằm gọn
   trong một box mdat đã biết từ tiền tố; (b) kiểm AVCC sample đầu —
   sample H.264 thật phải parse được thành dãy NAL length-prefixed.
   Moov giả trỏ lệch vào giữa dữ liệu (offset 1000 trong mdat) nay
   `full-file` ở cả stream-mode lẫn all-mode (trước đây `gop-range`).
   Đỏ-trước đã verify: 3/25 test fail đúng chỗ trước khi nối, 25/25
   xanh sau khi nối.
2. **Cổng `e2e-no-full-file-get` — ĐÃ THU HẸP cho blob chính (§2).**
   Cổng cũ đếm mọi blob nên FAIL oan vì 2 GET không Range trên blob phụ;
   cổng mới chỉ kiểm tra blob nhiều GET Range nhất (file 37 MiB).
   Chạy lại e2e 2 lần hoàn thành: **cổng PASS cả 2 lần** (lần 3: blob
   chính 53 Range + 0 không Range, toàn cục 1 không Range trên blob
   phụ — cổng cũ sẽ FAIL; lần 4: blob chính 85 Range + 0 không Range,
   toàn cục 0 không Range). E2 tổng: lần 3 **15/17**, lần 4 **16/17**;
   FAIL còn lại duy nhất là `e2e-wc-frames` (hits +0/+6, cần ≥10 —
   xem §2.2, không quy cho luồng này).
3. **Guard `seekable` pre-seek — ĐÃ IMPLEMENT (§3).** `seekElement`
   kiểm tra `seekable` trước khi gán `currentTime`: gặp `[[0,0]]` mà
   target > 0 thì không gán lần nào, trả `{ seeked: false,
   seekableBlocked: true }`. Test mới 13/13; hồi quy seek 38/38 vẫn xanh.
4. **Cutoff `buffered [[0,2.367]]` — VẪN CHƯA GIẢI THÍCH ĐƯỢC (§4).**
   Ghi rõ là chưa biết nguyên nhân, không bịa.
5. **Hồi quy GOP đầy đủ: chỉ còn fail i18n — KHÔNG phải do luồng này
   (§5).** Dict vi/en đang có 987 key (parity hoàn hảo, 0 key mồ côi)
   trong khi test cũ hardcode 982 — 5 key do luồng đợt 53 khác thêm lúc
   03:50 +07, đang sửa dở. Không đụng vào i18n hay test đó (ngoài phạm vi).

## 1. Moov giả trỏ vào trong file — 2 lớp chặn mới ở tầng T3

### 1.1 Lớp (a): stco khớp mdat

- Hàm mới `mdatRangesInPrefix(prefix, knownSize)` trong
  `gopRangeFetch39T3.ts`: quét box top-level trong tiền tố, ghi vùng
  `[start, start+size)` của mọi box `mdat` (kể cả mdat cắt dở tràn
  tiền tố — size khai trong header vẫn cho biết vùng; box khác cắt dở
  thì dừng). Hỗ trợ largesize (`size == 1` → u64) và `size == 0`
  (kéo tới cuối file). Trả `[]` khi không thấy mdat nào.
- Sau demux + kiểm tra vượt-ngoài-file của I6, T3 kiểm tra mọi sample
  nằm gọn trong một vùng mdat; sample nào ngoài thì fallback
  `demux-moov: sample ${si} trỏ ngoài mdat (offset ... — moov giả?)`.
  Không thấy mdat nào trong tiền tố (vd moov phình > tiền tố che mất
  header mdat) thì BỎ QUA kiểm tra (fail-open) thay vì fallback oan.
  File thật luôn có sample trong mdat nên không đổi hành vi file thật.
- Chặn được: moov giả trỏ vào ftyp (offset 0), vào trong moov thật,
  vào free/udta — mọi vùng không phải mdat, kể cả khi offset vẫn trong
  file (tầng I6 chỉ chặn trỏ ngoài file).

### 1.2 Lớp (b): kiểm AVCC sample đầu

- Hàm thuần mới `validateAvccSample(data, totalSize)` trong
  `mp4Demux.ts`: parse dãy NAL `[uint32-be length][NAL bytes]`. Sai khi:
  length 0, length vượt sample còn lại, forbidden_zero_bit = 1, type 0,
  byte thừa ở sample đầy đủ. NAL bị cắt bởi cap fetch (khai dài hơn
  phần đã fetch nhưng vẫn trong tổng sample) thì DỪNG và chấp nhận các
  NAL đã đọc — không kết luận sai từ thiếu dữ liệu; NAL đầu tiên đã dài
  hơn cửa sổ fetch (0 NAL trọn vẹn) thì fail-open. Giả định AVCC
  4-byte length — cùng giả định với toàn bộ đường demux/decode hiện có.
- Nối vào T3: stream-mode fetch riêng sample đầu (tối đa 256 KiB,
  1 request Range kind `"sample"` mới, hằng
  `MAX_FIRST_SAMPLE_PROBE_BYTES`) rồi kiểm; all-mode kiểm từ buffer
  GOP 0 vừa fetch (không thêm request), ngay sau GOP 0 để không fetch
  thừa. Sample đầu rỗng (size 0) hoặc fetch lỗi thì fallback rõ ràng.
  Lý do fallback: `demux-moov: sample 0 không phải AVCC hợp lệ
  (<lý do> — moov giả?)`.
- Đây KHÔNG phải decode thử frame đầu thật (VideoDecoder): moov giả
  trỏ ĐÚNG vào byte H.264 thật (vd trỏ vào đầu sample thật nhưng sai
  timestamp) vẫn qua được lớp này — decoder + controller fallback vẫn
  là cửa cuối (nợ §7.1). Lớp AVCC là kiểm tra cấu trúc rẻ tiền, chạy
  được cả trong test Node (VideoDecoder không có trong Node).

### 1.3 Đo + đỏ-trước/xanh-sau

Test `gopFakeMoov52I6.test.ts` (cập nhật trong luồng này): builder cũ
giữ nguyên, thêm helper AVCC (mẫu NAL 10 byte lặp lại, vừa khít
sample 1000 byte) và ghi AVCC thật vào mdat tại vị trí sample thật
trong 3 test control/VISIBLE/RESIDUAL — vì T3 nay kiểm AVCC nên mdat
toàn zeros sẽ bị chặn oan.

- **Đỏ-trước** (hàm thuần đã có, chưa nối vào T3): 22/25 pass; 3 fail
  đúng chỗ — RESIDUAL (moov giả offset 1000 → `gop-range` thay vì
  `full-file`), mdat-moov, mdat-ftyp (cả hai → `gop-range` thay vì
  `full-file`). 7 unit test mới cho `validateAvccSample` /
  `mdatRangesInPrefix` đã xanh từ lúc này (hàm thuần đúng, chỉ chưa nối).
- **Xanh-sau** (đã nối): **25/25 pass**. Trong đó:
  - RESIDUAL-FIXED: moov giả offset 1000 → `full-file` cả stream-mode
    lẫn all-mode, lý do chứa `AVCC`; kiểm trực tiếp byte tại offset
    1000 không parse được AVCC (length đọc được `0xACD90000` — rơi
    vào giữa NAL của sample thật, không phụ thuộc may rủi).
  - mdat-moov: sample trỏ vào trong moov thật → `full-file`, lý do
    `ngoài mdat` (file 600.651 byte, moov bắt đầu 600.032).
  - mdat-ftyp: sample trỏ offset 0 → `full-file`, lý do `ngoài mdat`.
  - Control (60 sample, AVCC thật) vẫn `gop-range`, 2 GOP; VISIBLE
    (moov thật trong cửa sổ xác nhận) vẫn chọn moov thật (60 sample);
    OOB + bomb stsz/stts/ctts giữ nguyên hành vi đợt 52.
- Hồi quy do lớp mới làm lộ ra (đã sửa, trong phạm vi): test F4
  `stream: chỉ GOP của cửa sổ được fetch` fail vì allowlist Range GET
  không tính request `"sample"` mới (GET `1527-7436` = sample 0) —
  đã thêm đúng range sample 0 vào allowlist
  (`MAX_FIRST_SAMPLE_PROBE_BYTES`, import từ T3), F4 về **6/6**.
  Không test nào khác đổi hành vi: mọi assertion `requests` khác đều
  lọc theo kind, và kind `"sample"` không trùng kind nào cũ.

## 2. Cổng e2e-no-full-file-get — thu hẹp cho blob chính

- Sửa `apps/web/scripts/gopHeaded49E2.mjs`: gom `netBlobReqs` theo URL
  (URL cắt 40 ký tự vẫn chứa đủ đầu UUID để phân biệt blob, cùng cách
  I6 đã dùng), in `BLOB-BYURL` + dòng `BLOB-CHÍNH`, xác định blob chính
  = blob có NHIỀU GET Range nhất, rồi chỉ kiểm tra blob đó:
  `mainBlobNoRange === 0 && mainBlobRange > 0`. Nhánh không có request
  blob: nào qua CDP (resource-timing, entry ≥90% file) giữ nguyên.
  Mode fallback vẫn auto-pass như cũ.
- Sửa thêm 3 điểm harness để CHẠY ĐƯỢC e2e (đều là lỗi đã đo, không
  phải sửa để pass oan — xem §2.1):
  1. `waitBridge` HEAD `trail-d4.mp4` → `trail-e2.mp4` (file lượt này
     tự stage; work-dir mới không có `trail-d4.mp4` nên HEAD 404 mãi).
  2. `gcNow` dùng `HeapProfiler.collectGarbage` qua CDP thay cho
     `window.gc()` trong page (I6 §6.1: gc trong page treo renderer).
  3. `evalJs` thêm timeout 60 s — renderer treo thì fail to thay vì
     treo cả lượt chạy vĩnh viễn.

### 2.1 Chạy lại e2e (mode gop) — 4 lần chạy, 2 lần hoàn thành

- **Lần 1 — fail ở setup, không vào được cổng:** `waitBridge` fail
  sau 30 s ("bridge không lên") dù bridge đã lên (trả `/api/health`
  200, uptime 234 s). Nguyên nhân đo được: work-dir mới chỉ có
  `trail-e2.mp4`, `waitBridge` HEAD `trail-d4.mp4` → 404 mãi. Đã sửa
  (mục 1 trên). Vite + bridge do lần 1 spawn vẫn sống sau khi script
  chết (throw nằm ngoài try/finally của script) — ghi nhận để đợt sau
  cân nhắc bọc setup trong try/finally.
- **Lần 2 — kẹt renderer, không hoàn thành:** chạy SHARED trên vite +
  bridge của lần 1; tới sau dòng `CDP Network blob` thì đứng yên 7+
  phút (log không có dòng `quan sát` nào). Probe CDP riêng: WS nối
  được, target page có, nhưng `Runtime.evaluate 1+1` timeout 20 s —
  renderer treo, đúng mẫu I6 §6.1 (treo ngay sau `gcNow` thứ hai gọi
  `window.gc()` trong page). Đã kill tay (node + chrome + Xvfb) và
  sửa `gcNow` + timeout `evalJs` (mục 2–3 trên). Load VM lúc đó 30.
- **Lần 3 — 15/17 pass** (84 s, exit 0, log `e2-run3.log`):
  playhead 72 → 0 s trong 30 s quan sát (lùi trọn 72 s, 2,4×);
  `gopActive=true`, `gopFallbackReasons=[]` — đường GOP với 2 lớp
  chặn mới KHÔNG fallback oan trên file thật. Blob chính
  `b733a696-6355`: **53 GET Range, 0 GET không Range**; toàn bộ 67
  request blob: 64 Range + **1 không Range** (nằm trên blob phụ
  `4afd6720-3450`, 1 Range + 1 không Range + 1 other — đúng mẫu I6:
  probe metadata của clip phụ). **Cổng cũ sẽ FAIL lần này (1 không
  Range toàn cục); cổng mới PASS** — đúng mục đích thu hẹp.
  Heap baseline 61,41 → peak 78,37 (delta +16,96) → settled 24,61 MiB.
  FAIL: `e2e-wc-frames` (hits +0, cần ≥10; misses +8, fetches +2),
  `e2e-canvas-frames` (4 frame khác nhau, cần ≥5) — xem §2.2.
- **Lần 4 — 16/17 pass** (86 s, exit 1, log `e2-run4.log`):
  playhead 72 → 42,4 s (lùi 29,6 s, ~1× — tốc độ thường, khác lần 3);
  `gopActive=true`, `gopFallbackReasons=[]`. Blob chính
  `c87d1fb2-7881`: **85 GET Range, 0 GET không Range**; toàn bộ 91
  request: 90 Range + **0 không Range** (lần này blob phụ cũng 0).
  **Cổng `e2e-no-full-file-get` PASS cả 2 lần chạy hoàn thành.**
  `e2e-canvas-frames` PASS (26 frame khác nhau, 0 mẫu đen; draw +24 /
  hold +140 / skip +7). Heap baseline 60,23 → peak 90,43 (delta
  +30,20) → settled 30,49 MiB. FAIL duy nhất: `e2e-wc-frames`
  (hits +6, cần ≥10; misses +170, fetches +0) — xem §2.2.

### 2.2 FAIL còn lại: e2e-wc-frames (hits +0/+6, cần ≥10)

- 2/2 lần chạy hoàn thành đều fail cổng này, trong khi mọi cổng chức
  năng đều pass (reverse-starts, gop-active, no-full-file-get,
  no-page-errors) và `e2e-canvas-frames` pass ở lần 4 (26 frame khác
  nhau — frame thật ĐANG được decode và vẽ). Misses +170 ở lần 4 cho
  thấy decode vẫn chạy; chỉ số `hits` (cache hit của WebCodecs) không
  lên tới 10 trong cửa sổ 30 s trên VM đang tải (loadavg 30 lúc lần 2,
  ~4–7 lúc lần 3–4, luồng bgremove của luồng khác chiếm 68% CPU lúc
  lần 4).
- KHÔNG quy cho thay đổi J6: luồng này không chạm decode/cache/đếm
  hits (chỉ kiểm tra ở tầng demux + 1 request probe lúc load);
  `gopActive=true` + 0 fallback ở cả 2 lần chứng minh đường GOP khỏe.
  Nợ mở: chạy lại e2e khi máy yên để xác định ngưỡng hits ≥10 hay
  bộ đếm hits mới là vấn đề (§7.9). Không hạ ngưỡng trong luồng này
  (đó là sửa test để pass oan nếu chưa có bằng chứng).

## 3. Guard seekable pre-seek — đã implement trong seek.ts

### 3.1 Thiết kế (đúng biên bằng chứng I8)

- Hàm mới `seekableBlocksSeek(el, target): string | null` + hằng
  `SEEK_BLOCKED_SEEKABLE_UNDETERMINED = "seekable-chua-xac-dinh"`:
  chỉ chặn khi TẤT CẢ range đều kết thúc ở ≤ 0 (end lớn nhất ≤ 0) VÀ
  target > 0. Seek về 0 thì `[[0,0]]` vẫn đúng nên không chặn.
  Fail-open (trả null) mọi trường hợp khác: `seekable` vắng (mock /
  trình duyệt cũ), rỗng (length 0 — chưa có metadata, đường timeout
  hiện có xử lý), đã xác định (end > 0 — seek vượt cuối range là hợp
  lệ, trình duyệt tự fetch), đọc range ném lỗi. Không bao giờ throw.
- `seekElement`: kiểm tra 1 lần ở đầu (sau `pause`, trước `attempt`),
  dùng target đã snap. Bị chặn thì `finish(false, false, true)` ngay —
  KHÔNG gán `currentTime` lần nào, KHÔNG gắn listener `seeked`,
  resolve `{ seeked: false, timedOut: false, seekableBlocked: true }`.
  Kiểm 1 lần là đủ vì trạng thái `[[0,0]]` dính suốt vòng đời tab
  (I8 §3.2: đợi 12 s không cứu được 6/10); retry ở tầng preview — nếu
  seekable đã xác định — sẽ qua guard ở lần gọi sau.
- `SeekResult` thêm field optional `seekableBlocked?: boolean` (chỉ có
  khi bị chặn; vắng = đường cũ). `SeekAllResult` thêm
  `seekableBlocked?: number` (đếm riêng; element bị chặn vẫn tính vào
  `failed` nên bất biến `done + timedOut + failed == số target` giữ
  nguyên). Không sửa `preview.tsx` hay `pauseSeekCap42X2.ts`:
  blocked rơi vào đường failed-only cũ (ok:true, timedOut:0) → nhánh vẽ
  + cap W2 đếm như mọi lần seek hỏng khác — không thêm cap hay nhánh mới.
- `Seekable` thêm field optional `seekable?: SeekableRanges`
  (shape TimeRanges tối thiểu). Mock cũ không có field này → guard bỏ
  qua → hành vi cũ nguyên vẹn.

### 3.2 Test mới + hồi quy

Test mới `apps/web/src/lib/seekSeekable53J6.test.ts` (chạy bằng
`node --experimental-strip-types`, như `seek.test.ts`): **13/13 pass**.

- Unit luật chặn (6): `[[0,0]]`+2.5 → chặn; `[[0,3]]`+2.5 → không;
  `[[0,0]]`+0 → không; seekable vắng/rỗng → không; nhiều range chỉ cần
  1 range end > 0 → không; `end()` ném → không.
- `seekElement` (5): `[[0,0]]`+2.5 → blocked, `sets == []` (không gán
  lần nào), 0 listener; `[[0,3]]`+2.5 → seek thường; `[[0,0]]`+0 → đi
  đường cũ (đã đúng frame); seekable vắng → đường cũ; seekable rỗng →
  đường cũ.
- `seekAll` (2): 1 blocked + 1 OK → `{done: 1, failed: 1,
  seekableBlocked: 1}`; không blocked → `seekableBlocked` vắng (không
  đổi shape cũ).
- Hồi quy seek (chạy lại độc lập, không bundle CJS vì top-level await):
  `seek.test.ts` **15/15**, `pauseSeekRecovery43Y2.test.ts` **9/9**,
  `pause45A2.test.ts` **14/14** — cộng **38/38, fail 0**.

## 4. Cutoff buffered [[0,2.367]] — VẪN CHƯA GIẢI THÍCH ĐƯỢC

Ghi rõ theo lệnh task, không bịa nguyên nhân: ở arm B/C/W của I8, mọi
lần landing-0 ở mode std đều có preBuffered `[[0,2.367]]` chính xác
(không phải 2.36 hay 2.37), trên cả file lành lẫn file hỏng; mọi lần
đáp đúng đều `[0,3]`. 2.367 ≈ frame 71/30fps. Chưa rõ 2.367 là biên gì
(không phải biên GOP: GOP 30 frame → biên 2.0/3.0; không phải do nội
dung file vì valid cũng vậy). Luồng này KHÔNG đo thêm (cần soi
network/fetch, ngoài nhiệm vụ) nên nợ vẫn mở. Guard seekable ở §3
không phụ thuộc vào con số này (guard chỉ đọc `seekable`, không đọc
`buffered`).

## 5. Kiểm chứng gộp của luồng

- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (sau khi thêm
  `src/lib/seekSeekable53J6.test.ts` vào exclude theo tiền lệ các test
  chạy bằng strip-types/bundle — file test import đuôi `.ts` nên tsc
  báo TS5097 nếu không exclude).
- `vite build` (outDir scratch): **pass** trong ~27 s; chỉ cảnh báo
  chunk > 500 kB có sẵn.
- Test mới luồng này: I6 cập nhật **25/25**, seekable mới **13/13**.
- Hồi quy GOP đầy đủ (script `run-regression.sh`, esbuild bundle +
  node, chạy 2 lần — lần 2 sau khi sửa F4, tally lần 2): U2 20/20, T3
  10/10, V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4
  19/19, Y4 10/10, E2blob 8/8, F4 6/6, H4 8/8, I6 25/25, reversePlayback
  10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11, errorDetail34Q4
  35/35.
- Hồi quy seek: 38/38 (xem §3.2).
- FAIL còn lại — i18n, KHÔNG do luồng này (bằng chứng): 6 test
  (E2i18n 2/3, D4 2/3, B6 7/8, Z6 9/10, saveToast31 FAILED,
  structuredNotes32 FAILED) cùng fail 1 assertion duy nhất: dict vi/en
  hiện có **987 key** trong khi test cũ hardcode **982**. Dict vi/en
  kiểm bằng python: **987 == 987, 0 key mồ côi cả hai chiều** (parity
  hoàn hảo) — chỉ số lượng kỳ vọng trong test là cũ. File dict
  `apps/web/src/i18n/{vi,en}.json` có mtime 2026-11-06 20:50 UTC =
  07/11 03:50 +07, tức TRONG lượt cron này — 5 key do một luồng đợt 53
  khác thêm, đang sửa dở. Luồng này không chạm i18n (xem §6) nên KHÔNG
  sửa test đó — việc của luồng sở hữu i18n / parent gộp.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production + harness + config):

- `apps/web/src/lib/mp4Demux.ts` — thêm `validateAvccSample` (hàm thuần,
  §1.2). Không đổi logic parse cũ.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — thêm `mdatRangesInPrefix`,
  `MAX_FIRST_SAMPLE_PROBE_BYTES`, kind request `"sample"`, kiểm
  stco-khớp-mdat + kiểm AVCC sample đầu ở cả 2 mode, cập nhật comment
  bước 5 (§1). Không đổi gate/probe/prefix/tail-scan.
- `apps/web/src/lib/seek.ts` — thêm `SeekableRanges`, field optional
  `seekable` trên `Seekable`, `seekableBlocksSeek` +
  `SEEK_BLOCKED_SEEKABLE_UNDETERMINED`, guard pre-seek trong
  `seekElement`, field `seekableBlocked` trên `SeekResult` /
  `SeekAllResult` (§3). Không đổi timeout/debounce/retry/Z2/B2,
  không sửa `preview.tsx` / `pauseSeekCap42X2.ts`.
- `apps/web/scripts/gopHeaded49E2.mjs` — thu hẹp cổng
  `e2e-no-full-file-get` cho blob chính + log `BLOB-BYURL` /
  `BLOB-CHÍNH` (§2); sửa `waitBridge` HEAD đúng file `trail-e2.mp4`,
  `gcNow` dùng `HeapProfiler.collectGarbage` qua CDP, `evalJs` timeout
  60 s (3 sửa harness để chạy được e2e, §2.1).
- `apps/web/src/lib/gopStreaming50F4.test.ts` — allowlist Range GET
  thêm range sample 0 (hậu quả trực tiếp của lớp AVCC mới, §1.3).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (§5).

ĐỔI (test cùng phạm vi):

- `apps/web/src/lib/gopFakeMoov52I6.test.ts` — helper AVCC + fill AVCC
  vào mdat ở control/VISIBLE/RESIDUAL, lật RESIDUAL-KNOWN thành
  RESIDUAL-FIXED (full-file, lý do AVCC), thêm 2 test mdat + 7 unit test
  (§1.3). Tổng 17 → 25 test.

MỚI:

- `apps/web/src/lib/seekSeekable53J6.test.ts` — 13 test guard seekable (§3.2).
- `docs/PHASE9_ROUND53_J6_GOP_SEEK_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file production khác, `preview.tsx`, i18n dict/test,
`reverseWebcodecs.ts`, `gopCache40V2.ts`, `gopTail45A4.ts`,
`pause45A2.ts`, `pauseSeekCap42X2.ts`. Scratch + log ở
`~/scratch-round53-j6/` (reg/, e2-run*.log, build/).

## 7. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Moov giả trỏ đúng vào byte H.264 thật** (§1.2): lớp AVCC không
   chặn được (vd moov giả trỏ vào đầu sample thật nhưng sai timestamp
   — sample vẫn parse AVCC đúng). Cửa cuối còn lại là decoder
   (VideoDecoder sẽ decode ra frame sai / lỗi) + controller fallback.
   Chặn triệt để cần decode thử frame đầu bằng VideoDecoder thật trong
   T3 (async, tốn 1 lần decode, chưa làm) hoặc đối chiếu hash sample.
2. **File nhiều mdat mà mdat thứ hai nằm ngoài tiền tố 512 KiB**: kiểm
   stco-khớp-mdat sẽ fallback oan về full-file (vẫn phát được, chỉ
   chậm hơn). Encoder thật (ffmpeg/libx264) chỉ viết 1 mdat nên chưa
   gặp; ghi để đợt sau cân nhắc đọc thêm header mdat thứ hai khi cần.
3. **"155 + http chunked" vẫn NOT_MEASURED** (nợ I8 §4): 70/70 navigate
   loopback bị chặn trên binary 155; cần daemon hoặc đổi policy hệ thống.
4. **Đường clamp trong source Chromium chưa đọc** (nợ I8 §3.4): nhân quả
   seekable mới ở mức hành vi (56/56); guard §3 bám đúng biên đó.
5. **Cutoff `buffered [[0,2.367]]` chưa giải thích** (§4).
6. **Guard seekable chưa có đo headed trên app thật**: test hiện tại là
   mock Node (seekable giả lập) + hồi quy 38/38. Chưa đo headed rằng
   guard kích đúng trên file nolength thật (seekable `[[0,0]]` trong
   app) và không chặn oan seek thường — cần 1 lượt probe headed nối
   tiếp (dùng lại harness I8, thêm assert `seekableBlocked`).
7. **i18n 987 vs 982** (§5): test cũ hardcode 982; luồng i18n đợt 53
   đang thêm key — parent gộp cần đối chiếu khi luồng đó xong.
8. **Số đo under-load**: mọi số trong file này đo trên VM 4 vCPU dưới
   tải các luồng đợt 53 khác chạy song song (loadavg ~5 lúc bắt đầu,
   vọt tới 30 giữa lượt); thời gian tuyệt đối chỉ dùng để so sánh
   tương đối trong cùng lượt.
9. **`e2e-wc-frames` fail 2/2 lần e2e** (hits +0/+6, cần ≥10) dù
   `e2e-canvas-frames` pass ở lần 4 (26 frame) và decode vẫn chạy
   (misses +170): cần chạy lại khi máy yên để xác định ngưỡng hay bộ
   đếm hits mới là vấn đề (§2.2). Không hạ ngưỡng trong luồng này.
10. **Harness E2 còn 2 điểm yếu đã thấy nhưng chưa sửa triệt để:**
    throw ở setup (vd `waitBridge`) nằm ngoài try/finally nên vite +
    bridge do script spawn bị mồ côi (gặp ở lần 1); `evalJs` nay có
    timeout nhưng `send()` thì chưa — renderer treo ở bước khác vẫn
    có thể kẹt ở `await this.ready` / `send` (chưa gặp ở lượt này).

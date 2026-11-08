# Phase 9 đợt 51, luồng H4 — Settled heap GOP + baseline dao động — LIMITS

Ngày: 06/11/2026 (giờ +07). Đóng nợ F4 §5.1–5.2 trong
docs/PHASE9_ROUND50_F4_GOP_STREAMING_LIMITS.md và nợ mở đợt 50 §4
mục 4 (settled heap GOP + baseline dao động + tail-scan 16,7 MiB
nằm trong đỉnh transient). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào
batch. Không tự stage paths-loop hay ghi build-loop-log (parent
gộp, như tiền lệ F4). Trần file 128 MiB, ngưỡng kích hoạt GOP
32 MiB, mặc định GOP TẮT, cổng gate U2 GIỮ NGUYÊN.

## 0. Kết luận ngắn (không vượt số đo)

1. **Trần cache LRU chốt 16 MiB (32 → 16 MiB).** 6 lượt headed app
   thật, cùng fixture 37 MiB: cache GOP thật chỉ giữ tối đa
   **8,24 MiB**, `evictedBytes = 0` ở MỌI trần (kể cả 8 MiB),
   settled heap **không đổi theo trần** (24,56–31,99 MiB, dao động
   theo throughput decode chứ không theo trần) và tốc độ lùi
   **không đổi theo trần**. 16 MiB giữ biên 2× trên mức tối đa quan
   sát được; mức tối đa quan sát được (8,24 MiB) đã vượt 8 MiB nên không chọn. Hạ trần
   KHÔNG làm settled giảm đo được — settled do frame cache quyết
   định, trần mới là giới hạn an toàn chứ không phải knob tiết
   kiệm (xem §2).
2. **Tail-scan đã stream xong:** đuôi không fetch một lần cả cửa sổ
   nữa mà lấy theo chunk từ EOF lùi về, gấp đôi mỗi lần
   (2 → 4 → 8 → 16 MiB), dừng khi tìm thấy moov + xác nhận bằng 1
   chunk nữa. Fixture 720p 20 s (10.840.711 byte, moov 7.447 byte
   ở đúng EOF): tail **10.840.711 → 4.194.304 byte (2 request
   × 2 MiB)**; fixture 37 MiB (moov 24.639 byte ở đúng EOF) cần
   đúng 4 MiB đuôi thay vì 16,7 MiB. Mọi chunk vẫn qua kiểm chứng
   206 nghiêm ngặt như cũ; `gopMeta` hai mode stream/all khớp nhau.
3. **Baseline dao động 21–59 MiB ĐÃ GIẢI THÍCH:** baseline sau `gc()`
   trước khi phát ngược ổn định **~21,4 MiB trong cả 6 lượt**
   (21,36–21,64). Số ~58 MiB của F4 là **transient sau import**:
   heap nhảy +37,5 MiB (đúng kích thước file) trong 0–2 s sau khi
   card media xuất hiện, rồi tự rơi về ~21 MiB trước khi phát
   ngược — đo lặp lại **6/6 lượt** (xem §3). Lần đo sau muốn số
   tuyệt đối so được thì đo baseline SAU khi import đã yên
   (hoặc trước import), không đo ngay sau import.
4. **Transient cửa sổ T3 nay nhỏ:** mẫu heap sớm (t < 8 s) chỉ
   +1 đến +5 MiB trên baseline ở t ≈ 3–4,5 s; đỉnh heap trong các
   lượt đều tới muộn (t = 16–59 s, +14,88 đến +26,09 MiB) do
   retention tích lũy (frame cache + GOP cache), không phải
   transient T3. Không còn đỉnh sớm +81,5 MiB như E2 hay +18,2 MiB
   như F4-after1.
5. **Hồi quy GOP đủ bộ xanh + tsc sạch ở file H4 + vite build
   pass** (xem §6). Một assertion đếm request tail cũ (C5) đã cập
   nhật theo bất biến streaming mới — thay đổi kỳ vọng, không phải
   hồi quy vỡ (xem §6.1). Các lỗi còn lại trong lần chạy hồi quy
   (i18n đếm key 973 vs 982, tsc ở file test TTS H1/H2) là việc của
   luồng khác, có trước H4, không chạm (xem §6.2).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopTailStream51H4.test.ts` — test khóa tail-scan
  streaming + cache trần thấp bằng code thật (ffmpeg + server HTTP
  Range thật). 8/8 pass (xem §3).
- `docs/PHASE9_ROUND51_H4_GOP_HEAP_LIMITS.md` — file này.

### 1.2 Sửa (marker ROUND51-H4 / "Đợt 51 H4")

- `apps/web/src/lib/gopRangeFetch39T3.ts` — tail-scan streaming:
  hàm mới `fetchTrailingMoovChunked` + hằng
  `DEFAULT_TAIL_INITIAL_CHUNK_BYTES` (2 MiB) + option
  `tailInitialChunkBytes` + nối vào nhánh tail-scan của T3 (thay
  1 lần `fetchRangeChecked` cả cửa sổ bằng chunked); cập nhật
  comment header bước 4. Không đổi gate, probe, tiền tố, demux,
  GOP fetch, streaming F4.
- `apps/web/src/lib/gopCache40V2.ts` — trần cache mặc định
  `GOP_CACHE_MAX_BYTES` 32 → **16 MiB** + cập nhật comment header
  cache + comment hằng. Ngưỡng kích hoạt đường GOP (32 MiB) và
  trần số GOP (32) KHÔNG đổi; không đổi logic LRU/fetch bù.
- `apps/web/src/lib/reverseWebcodecs.ts` — (a) mirror
  `window.__vcutReverseWc` thêm trường `gopCache` (thống kê cache
  GOP gộp mọi controller: segments/bytes/hits/misses/
  evictedBytes) để harness headed đọc được mà không cần DOM video
  — video element có thể đã bị gỡ khi dừng phát ngược nên DIAG qua
  `getReversePreviewController(src)` trả `[]` (gặp thật ở lượt
  cap32a); chỉ cộng dồn số đo, không đổi hành vi; (b) 1 dòng
  comment "cache 32 MiB" → "cache 16 MiB (đợt 51 H4)".
- `apps/web/src/lib/gopTail47C5.test.ts` — cập nhật 1 test: bất biến
  đếm request tail đổi 1 → 4 request (2+2+4+8 MiB = 16 MiB) theo
  streaming mới; kết luận full-file + lý do tail-scan + 0 GOP giữ
  nguyên (xem §6.1).
- `apps/web/tsconfig.json` — +1 dòng exclude test mới (mẫu F4).

### 1.3 Không đụng (ghi rõ)

`reverseRangeGate38U2.ts` (gate U2), `gopTail45A4/46B4/47C5.ts`
(`findTrailingMoov` không đổi — chunked chỉ thay cách fetch,
không thay cách tìm), `gopSizeProbe41W4.ts`,
`gopSharedProbe42X4.ts`, `mp4Demux.ts`, `reversePlayback.ts`,
`preview.tsx`, `store.ts`, `server/bridge/src/index.js`,
`apps/web/src/i18n/*.json` (lỗi đếm key 973 vs 982 là của luồng
khác — xem §6.2), mọi file luồng khác đợt 51 đang chạy song song.
Fixture headed tái dùng `~/scratch-round47-c5/trailing-real37.mp4`
(KHÔNG đưa vào batch); scratch đo của luồng này ở
`~/scratch-round51-h4/` (harness copy `gopHeaded51H4.mjs` + 6 log
headed + bản sao lưu file trước sửa — KHÔNG đưa vào batch).

## 2. Trần cache LRU: số đo headed + quyết định 16 MiB

### 2.1 Phương pháp

- Cùng harness E2 (bản copy `gopHeaded51H4.mjs` trong scratch —
  thêm đo idle §3, đọc `gopCache` qua mirror §1.2, in mẫu heap
  sớm t < 8 s; xem §4.3 về các chỗ vá harness), cùng fixture
  37 MiB (`trailing-real37.mp4`, 38.996.431 byte, 1280×720 30 fps
  72 s, 2160 frame, -g 30, moov 24.639 byte ở đúng EOF), vite
  :5173 + bridge :8787 thật, Chromium headed + Xvfb + render phần
  mềm, under-load (xem §4.2).
- Trần đổi bằng cách sửa hằng `GOP_CACHE_MAX_BYTES` trên đĩa trước
  mỗi lượt (32 → 16 → 8), vite dev phục vụ code mới khi reload —
  không thêm mặt điều khiển test-only vào production.
- Mỗi trần 2 lượt; lượt 32 MiB quan sát 30 s (như F4), lượt 16/8
  MiB quan sát **60 s** (`H4_OBS_MS=60000`) vì 30 s không đủ để
  cache đầy (lượt 32b 30 s chỉ fetch 3 GOP — xem §2.2).
- Chỉ số chính: `GOPCACHE bytes` (byte GOP thật đang giữ),
  `evictedBytes` (byte đã bị evict — > 0 mới là trần "cắn"),
  settled heap sau `gc()`, tốc độ lùi (playhead lùi / thời gian
  quan sát + `wc hits`). Chỉ số phụ: đỉnh heap + thời điểm đỉnh.

### 2.2 Bảng số đo (6 lượt, cùng fixture, cùng harness)

| Lượt | Trần | Quan sát | Baseline | Đỉnh (delta) | Đỉnh lúc | Settled | GOP cache bytes / GOP / miss / evicted | Playhead lùi | wc hits | Cổng E2 |
|---|---|---|---|---|---|---|---|---|---|---|
| cap32a | 32 MiB | 30 s | 21,44 | 47,53 (+26,09) | t=29,8 s | 26,33 | n/a (mirror chưa có) | 11,5 s | +9 | 16/17 |
| cap32b | 32 MiB | 30 s | 21,49 | 36,37 (+14,88) | t=16,4 s | 24,56 | 1,53 MiB / 3 / 3 / 0 | 7,3 s | +0 | 16/17 |
| cap16a | 16 MiB | 60 s | 21,64 | 44,85 (+23,22) | t=59,2 s | 31,99 | **8,24 MiB / 16 / 16 / 0** | 31,5 s | +32 | 17/17 |
| cap16b | 16 MiB | 60 s | 21,45 | 46,83 (+25,38) | t=31,9 s | 28,54 | 5,14 MiB / 10 / 10 / 0 | 21,5 s | +9 | 16/17 |
| cap8a | 8 MiB | 60 s | 21,36 | 38,07 (+16,71) | t=20,1 s | 28,47 | 3,60 MiB / 7 / 8 / 0 | 17,5 s | +4 | 16/17 |
| cap8b | 8 MiB | 60 s | 21,42 | 39,32 (+17,91) | t=39,3 s | 30,08 | 6,67 MiB / 13 / 13 / 0 | 23,0 s | +15 | 17/17 |

Đọc số trung thực (không tô hồng việc hạ trần):

- **Trần không cắn ở bất kỳ lượt nào:** `evictedBytes = 0` cả 6
  lượt, kể cả trần 8 MiB. Cache thật giữ tối đa **8,24 MiB**
  (cap16a — lượt decode tốt nhất, 16 GOP trong 60 s). Trần số
  GOP (32) cũng không cắn (tối đa 16 GOP). Vì vậy hạ trần từ 32
  xuống 16 hay 8 đều **không làm settled giảm đo được**: settled
  24,56–31,99 MiB dao động theo throughput decode (lượt decode
  nhiều → frame cache giữ nhiều → settled cao: cap16a hits +32 →
  settled 31,99; cap32b hits +0 → settled 24,56), không theo
  trần. Settled do **frame cache** quyết định, không phải cache
  GOP — muốn giảm settled thì phải đụng frame cache, ngoài phạm
  vi luồng này.
- **Tốc độ lùi không đổi theo trần:** 7,3–11,5 s/30 s ở trần 32;
  17,5–31,5 s/60 s ở trần 16/8 (quy về 30 s: 8,75–15,75 s — cùng
  dải, chênh lệch là nhiễu tải, xem §4.2). GOP bật thật cả 6 lượt
  (`gopActive=true`, `gopFallbackReasons=[]`), 0 GET toàn file
  (CDP Network: 77–78 request blob, toàn Range). `wc hits` thấp
  (+0 đến +9 ở 4/6 lượt) là đói decode dưới tải, không phải hồi
  quy trần — lượt 16a/8b decode tốt vẫn 17/17 cổng.
- **Đỉnh heap tới muộn, không phải transient T3:** mọi đỉnh ở
  t = 16–59 s (retention tích lũy), delta +14,88 đến +26,09 —
  cùng dải với F4-after (+18,20 đến +34,77, settled 28–30).
  Mẫu heap sớm t < 8 s (xem §4.1): +1 đến +5 MiB ở t ≈ 3–4,5 s
  — transient cửa sổ T3 nay nhỏ, khớp thiết kế tail streaming
  (tiền tố 0,5 + đuôi 4 + moov 0,02 + GOP cửa sổ ~1,5 ≈ 6 MiB
  tối đa, phần lớn được nhả nhanh).

### 2.3 Quyết định: trần 16 MiB (không phải 8 MiB)

- **Chọn 16 MiB** vì: (a) giảm một nửa retention xấu nhất so với
  32 MiB trong khi không tốn gì đo được (0 eviction, 0 chậm lùi);
  (b) biên ~2× trên mức cache tối đa quan sát được (8,24 MiB);
  (c) 0 eviction ở cả 2 lượt 60 s tại trần này.
- **Không chọn 8 MiB** dù 2 lượt 8 MiB cũng 0 eviction và không
  chậm lùi: mức tối đa quan sát được (8,24 MiB) đã vượt 8 MiB —
  một phiên lùi dài/nhanh hơn (vd 120 s quan sát, hoặc máy yên
  decode 1×) sẽ chạm trần 8 MiB và bắt đầu evict giữa cửa sổ
  (fetch bù 1 Range/GOP — rẻ nhưng chưa đo). 8 MiB tiết kiệm tối
  đa thêm ~0,6 MiB retention so với mức quan sát được, không
  đáng để lấy rủi ro đó.
- **Không giữ 32 MiB:** không có bằng chứng nào cho thấy 32 MiB
  được dùng tới (tối đa 8,24 MiB trong 60 s lùi), giữ 32 chỉ giữ
  retention xấu nhất cao gấp đôi mà không lợi gì.
- Trần số GOP giữ 32 (không cắn, không đổi). Ngưỡng kích hoạt
  đường GOP (file > 32 MiB) giữ nguyên — chỉ trần retention đổi.

## 3. Baseline dao động + tail streaming (test khóa bằng code thật)

### 3.1 Baseline: transient sau import, không phải nhiễu đo

Harness H4 đo thêm 2 pha yên (gc rồi lấy mẫu heap mỗi 1 s, không
phát, không import trong lúc lấy mẫu):

| Lượt | IDLE trước import (6 mẫu) | IDLE sau import (10 mẫu) | Baseline trước phát ngược (sau gc) |
|---|---|---|---|
| cap32a | 20,07 → 20,18 (drift +0,11) | 20,1, 20,1, **57,5**, 57,6 … 57,8 (drift +37,62) | 21,44 |
| cap32b | 20,14 → 20,36 (drift +0,21) | 20,2, 20,3, 20,3, **57,4** … 57,7 (drift +37,49) | 21,49 |
| cap16a | 20,10 → 20,90 (drift +0,80) | 20,3, 20,5, **57,8** … 58,4 (drift +38,12) | 21,64 |
| cap16b | 20,09 → 20,25 (drift +0,16) | 20,3, **57,4** … 57,8 (drift +37,56) | 21,45 |
| cap8a | 20,04 → 20,25 (drift +0,21) | 20,2, 20,2, **57,4** … 57,8 (drift +37,61) | 21,36 |
| cap8b | 20,19 → 20,32 (drift +0,14) | 20,2, **57,4** … 57,8 (drift +37,51) | 21,42 |

- **Trước import heap ổn định ~20,1–20,9 MiB** (drift ≤ 0,8 MiB
  trong 6 s yên). **Sau import heap nhảy +37,5 MiB** (đúng kích
  thước file 37,19 MiB) trong vòng 0–2 s sau khi card media xuất
  hiện — nhảy giữa 2 mẫu liên tiếp (vd cap32a: mẫu 2 = 20,1 →
  mẫu 3 = 57,5), rồi giữ ~57,7 MiB suốt pha yên 10 s. **Đến lúc
  đo baseline trước phát ngược (sau thêm 1 lần gc + thêm clip +
  seek End, ~40 s sau import), heap đã về ~21,4 MiB** — lặp lại
  **6/6 lượt**, baseline 21,36–21,64 MiB (chênh nhau chỉ 0,28).
- Giải thích dao động của F4 (21 → 59 MiB): F4 đo baseline ngay
  sau import ở một số lượt (bắt được transient +37 MiB → ~58)
  và đo muộn ở lượt khác (~21). **Không phải code chung bị luồng
  khác sửa** (giả thuyết F4 §4.2) — số này tái lập được ngay cả
  khi không có luồng nào sửa file chung giữa các lượt (cap32a/b
  chạy liên tiếp, cùng code).
- Cơ chế giữ +37 MiB sau import **chưa xác định dứt điểm**:
  ứng viên là ingest IndexedDB giữ `File`/`ArrayBuffer` tạm
  (fileToMediaItem → IDB put) hoặc video element preload blob —
  cả hai đều giữ đúng 1 bản file và đều nhả trước khi phát ngược.
  H4 không tách được hai ứng viên (cần đo IDB/element riêng) —
  ghi rõ là nợ mở (§5.1), nhưng **thời điểm** của transient thì
  đã khóa: xuất hiện 0–2 s sau card, biến mất trước baseline
  phát ngược. Quy tắc đo cho lần sau: đo baseline SAU khi import
  đã yên (hoặc trước import), không đo ngay sau import.

### 3.2 Tail-scan streaming (test mới `gopTailStream51H4`, 8/8)

| Test | Kết quả |
|---|---|
| stream: trailing 720p 20 s → gop-range, tail chỉ 2×2 MiB thay vì cả cửa sổ 10,8 MiB | PASS (tail requests `8743559-10840710:2097152, 6646407-8743558:2097152`; gopMeta 20 GOP, sampleCount 600) |
| stream: gopMeta mode stream khớp mode all trên cùng file trailing lớn | PASS (meta bằng nhau, all fetch đủ 20 GOP) |
| stream: chunk đầu 4 KiB → cửa sổ tăng dần rồi tìm thấy, tổng tail chỉ 16 KiB | PASS (tail bytes `[4096, 4096, 8192]`, nối thành đúng hậu tố 16 KiB cuối file) |
| stream: cửa sổ đuôi 512 byte < moov → full-file, đúng 1 request tail, lý do tail-scan-no-candidate | PASS |
| stream: tail chunk đầu 416 → full-file ngay, 1 request tail, lý do giữ dạng `tail-scan: tail-status-416` | PASS (không thử cửa sổ lớn hơn) |
| stream: faststart → 0 request tail | PASS |
| cache: trần 8 MiB evict cũ nhất, byte giữ không bao giờ vượt trần | PASS |
| cache: trần mặc định `GOP_CACHE_MAX_BYTES` = 16 MiB (khóa quyết định §2) | PASS |

Thiết kế chunked (xem comment `fetchTrailingMoovChunked`):
cửa sổ bắt đầu 2 MiB (kẹp về min(tailScanBytes, fileSize)), gấp
đôi mỗi lần không thấy moov, fetch thêm đúng phần mới rồi nối
vào đầu buffer cũ (tổng byte qua mạng = đúng cửa sổ cuối, không
fetch trùng); thấy moov mà chưa chạm trần thì xác nhận bằng 1 lần
gấp đôi nữa rồi quét lại — ứng viên giữ nguyên thì nhận, ứng viên
đổi (thấy moov ngoài cùng hơn) thì nhận mới và xác nhận thêm tối
đa 1 lần nữa; vòng lặp có chặn nên trường hợp xấu nhất fetch đúng
bằng cửa sổ cũ. Chunk lỗi mạng/server thì throw ngay như đường cũ.

## 4. Headed E2E app thật + đo heap (vite :5173 + bridge :8787/8789)

Harness tái dùng `gopHeaded49E2.mjs` (E2) qua bản copy H4
(`~/scratch-round51-h4/gopHeaded51H4.mjs` — KHÔNG đưa vào batch):
import file trailing 37 MiB thật → thêm clip → End về cuối → bấm
"Phát ngược" → quan sát 30 s (lượt 32) / 60 s (lượt 16/8), lấy mẫu
heap mỗi ~0,5–1,7 s. Cùng file/fixture F4/E2
(`~/scratch-round47-c5/trailing-real37.mp4`, 38.996.431 byte).
Giàn: Chromium headed + Xvfb + render phần mềm, under-load
(xem §4.2).

### 4.1 Mẫu heap sớm (transient cửa sổ T3 — bằng chứng tail streaming)

| Lượt | Baseline | Mẫu sớm t < 8 s (MiB) |
|---|---|---|
| cap32b | 21,49 | 3,9 s: 22,6 (+1,1); 7,4 s: 24,3 (+2,8) |
| cap16a | 21,64 | 1,2 s: 22,2 (+0,6); 2,1 s: 23,8 (+2,2); 3,1 s: 25,3 (+3,7); 4,5 s: 32,3 (+10,7); 5,9 s: 35,5 (+13,9) |
| cap16b | 21,45 | 0,8 s: 22,3 (+0,9); 2,6 s: 24,1 (+2,7); 4,5 s: 26,2 (+4,8); 6,9 s: 32,9 (+11,5); 7,8 s: 34,8 (+13,4) |
| cap8a | 21,36 | 1,7 s: 22,7 (+1,3); 3,1 s: 24,4 (+3,0); 6,4 s: 32,5 (+11,1) |
| cap8b | 21,42 | 3,3 s: 23,8 (+2,4); 4,6 s: 22,8 (+1,4); 6,4 s: 26,2 (+4,8) |

(cap32a chạy trước khi harness có in mẫu sớm — chỉ có đỉnh muộn
+26,09 ở t=29,8 s.) Đọc trung thực: ở t ≈ 3–4,5 s heap chỉ
+1 đến +5 MiB trên baseline — không còn đỉnh sớm +81,5 MiB (E2)
hay +18,2 MiB (F4-after1). Mức +10 đến +14 MiB ở t ≈ 5–8 s đi
kèm decode (frame cache + GOP cửa sổ tiếp theo), không tách được
phần T3 thuần khỏi frame cache bằng lấy mẫu 500 ms–1,7 s — H4
chỉ claim **transient T3 ≤ ~+6 MiB** (tiền tố 0,5 + đuôi 4 +
moov 0,02 + GOP cửa sổ ~1,5), không claim số nhỏ hơn.

### 4.2 Nhiễu đo (ghi rõ, không giấu)

- **Tất cả 6 lượt đều under-load nặng, decode đói:** hits chỉ
  +0 đến +32 (E2 yên: +477/+391), misses +81 đến +297, playhead
  chỉ lùi 0,24×–0,53× realtime (E2 yên: ~29,5 s/30 s). Nguyên
  nhân: VM reboot giữa đợt (12:06, xem §4.3) rồi các luồng đợt 51
  khác chạy headed Chrome/Electron song song (vite :5261, Electron
  bridge :8787/:8788/:8791, TTS driver đã chết sau reboot),
  load average 2,4–22,7 lúc bắt đầu các lượt, RAM free có lúc
  chỉ 108–205 MiB. Đây là nhiễu tải, không phải hồi quy trần —
  GOP vẫn bật và 0 GET toàn file ở cả 6 lượt.
- **Lấy mẫu heap thưa dưới tải:** mỗi mẫu CDP + RSS `ps` tốn
  ~1–1,7 s nên 30 s chỉ có 15–23 mẫu (thay vì ~60 mẫu như E2);
  đỉnh T3 là ước lượng dưới.
- **RSS cây Chrome dao động lớn** (đỉnh 841–1890 MiB, delta
  +106 đến +554 MiB vs baseline) — gồm cả renderer/GPU/buffer
  ngoài JS heap; chỉ delta JS heap mới dùng để kết luận, RSS chỉ
  ghi tham khảo như F4.
- **Cổng `e2e-wc-frames` fail 4/6 lượt** (hits +0/+4/+9 < 10)
  — cùng mẫu đói decode dưới tải như F4-before; 2 lượt decode
  tốt (16a, 8b) đạt 17/17. Không phải hồi quy H4 (code GOP
  không chạm decode; GOP bật + canvas 10–49 frame khác nhau ở
  mọi lượt).
- **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, máy
  yên (quiet), phiên lùi dài > 60 s** (trần 8 MiB chưa bao giờ
  cắn trong 60 s — phiên 120 s có thể khác). Toàn bộ headed là
  Chromium Linux + Xvfb + render phần mềm, under-load.

### 4.3 Sự cố giàn trong đợt (ghi rõ, không giấu)

- **VM reboot ~12:06 (+07)** giữa lượt cap32a đầu tiên: tiến
  trình harness + vite + Chrome biến mất không lỗi log (uptime
  sau reboot "up 1 min"). Lượt cap32a phải chạy lại từ đầu
  (detached `nohup` sau đó).
- **Cổng 8787 bị Electron của luồng H8/H9 chiếm** (bridge
  auto-start của app đóng gói, cả :8787/:8788/:8791): waiter đợi
  cổng tới 20 phút rồi vẫn bận; lượt cap8b cuối chạy bridge
  riêng :8789 (env `H4_BRIDGE_PORT` trong bản copy harness —
  bridge chỉ dùng cho cổng HEAD, không nằm trên đường phát
  ngược). Hai lần thử cap8b trước đó fail vì race cổng
  (EADDRINUSE) và probe timeout — không phải lỗi app.
- **Vite mồ côi :5173** sau lần cap8b fail (harness E2 spawn
  vite/bridge TRƯỚC khối try-finally nên throw ở `waitBridge`
  không kill vite): H4 tự kill PID 12048 của chính mình, không
  đụng tiến trình luồng khác. Đây là lỗi dọn dẹp của harness gốc
  (E2), không phải của app — ghi để luồng sau khỏi tưởng vite lạ.
- **Harness copy H4 khác bản E2 gốc ở:** SCRATCH/DEBUG_PORT
  (9382)/bridge-work riêng; `REPO` trỏ thẳng repo-1 (bản copy ở
  scratch nên không suy REPO từ vị trí file); SHARED chỉ khi CẢ
  HAI cổng có server (bản gốc SHARED khi BẤT KỲ cổng nào có
  server — dưới tải song song bản gốc fail đợi vite, gặp thật
  12:11); chờ Chrome 60 s thay vì 15 s; probe cổng 5 s thay vì
  1 s; `H4_OBS_MS`; `H4_BRIDGE_PORT`; đo idle §3; in mẫu heap
  sớm + `GOPCACHE` cuối. Không đổi cổng pass/fail hay flow đo
  chính của E2.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Settled heap vẫn do frame cache quyết định** (24,56–31,99
   MiB sau 30–60 s lùi): hạ trần GOP không giảm settled đo được.
   Muốn giảm settled thì phải đo/đụng frame cache (ngân sách
   192 MiB) — ngoài phạm vi luồng này.
2. **Cơ chế giữ +37 MiB sau import chưa xác định dứt điểm**
   (§3.1): ứng viên ingest IndexedDB vs video preload — cần đo
   tách (vd import rồi đo heap khi IDB put xong/xong chưa, hoặc
   đo với video element chưa load). Thời điểm transient thì đã
   khóa (0–2 s sau card, hết trước baseline phát ngược).
3. **Tail streaming còn rủi ro file chế tác:** moov giả lọt đủ
   3 cửa nằm trong moov thật mà moov thật bắt đầu TRƯỚC cửa sổ
   đã xác nhận thì bước xác nhận không nhìn thấy moov thật (xem
   comment `fetchTrailingMoovChunked`). File encode thật không
   gặp; demux ở bước 5 vẫn là cửa cuối nhưng moov giả parse được
   mvhd/trak thì demux vẫn có thể nhận. Muốn kín hẳn thì phải
   quét tới khi cửa sổ chạm trần trước khi nhận ứng viên — tốn
   lại đúng 16 MiB đuôi, mất lợi ích streaming.
4. **Trần 8 MiB chưa bao giờ cắn trong 60 s:** phiên lùi dài
   (> 60 s, hoặc máy yên decode 1×) có thể chạm trần 8 MiB —
   đó là lý do chốt 16 MiB chứ không phải 8 MiB (§2.3). Nếu sau
   này cache tự nhiên vượt 16 MiB (vd file GOP thưa lớn), evict
   sẽ bật — hành vi evict đã khóa bằng unit test, chưa đo headed.
5. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, máy
   yên, phiên lùi dài > 60 s** (xem §4.2).
6. **Harness phụ thuộc fixture ngoài repo** (như E2 §7.4):
   `~/scratch-round47-c5/trailing-real37.mp4` (38.996.431 byte);
   harness copy + log ở `~/scratch-round51-h4/` (KHÔNG vào batch).

## 6. Kiểm chứng + hồi quy

```
# Test mới H4 (lần chạy cuối, trần chốt 16 MiB)
./node_modules/.bin/esbuild apps/web/src/lib/gopTailStream51H4.test.ts \
  --bundle --platform=node --format=esm --outfile=<scratch>/h4.test.mjs \
  && node <scratch>/h4.test.mjs
# Hồi quy (esbuild bundle; cjs cho U2/T3/V2, esm cho còn lại — mẫu F4)
# Headed E2E app thật (bản copy H4 trong scratch, xem §4)
H4_TAG=<tag> H4_CACHE_MIB=<32|16|8> H4_OBS_MS=<30000|60000> \
  H4_BRIDGE_PORT=<8787|8789> node ~/scratch-round51-h4/gopHeaded51H4.mjs
```

### 6.1 Một test cũ cập nhật assertion đếm request (thay đổi kỳ vọng)

`gopTail47C5.test.ts` khóa "1 request tail" cho file trailing +
free trailer 17 MiB sau moov — con số đó chính là hành vi H4 thay
đổi (tail-scan nay tăng dần 2 → 4 → 8 → 16 MiB). Đây KHÔNG phải
hồi quy vỡ: kết luận chính (full-file + lý do tail-scan +
0 GOP) giữ nguyên và vẫn xanh; chỉ số đếm tail đổi thành bất biến
streaming mới (4 request, bytes `[2, 2, 4, 8] MiB`, tổng đúng
16 MiB = cửa sổ cũ). Các test A4/B4/C5 khác khóa "1 request tail"
đều giữ nguyên vì fixture của chúng nhỏ hơn chunk đầu 2 MiB
(cửa sổ = cả file → đúng 1 lần fetch).

### 6.2 Lỗi có trước H4, không phải hồi quy (không sửa — file của luồng khác)

- **i18n đếm key 973 vs 982** (E2i18n 2/3, D4 2/3, B6 7/8, Z6
  9/10, saveToast31 14/15, structuredNotes32 11/12): file
  `apps/web/src/i18n/vi.json` + `en.json` sửa lúc 08:56 UTC
  (trước khi H4 bắt đầu sửa file lúc 11:41 UTC — bằng chứng
  mtime + bản sao `.before`), thêm 9 key vào CẢ HAI bên; kiểm
  tra trực tiếp: vi = en = 982 key, **0 key mồ côi cả hai
  chiều** — parity thật vẫn đúng, chỉ các test khóa cứng tổng
  973 là lỗi thời. H4 không đụng i18n, không sửa các test này
  (thuộc luồng đã thêm key).
- **tsc toàn repo còn lỗi ở file test TTS của luồng H1/H2**
  (`ttsEstimate51H1.test.ts` 10 lỗi, `ttsEstimate51H2.test.ts`
  20 lỗi — module `ttsEstimate51H2` chưa tồn tại lúc đo, test
  đang viết dở); lúc đo đầu đợt còn 30 lỗi ở `previewEngine.ts`
  của một luồng khác (đã hết ở lần đo cuối — luồng đó tự sửa).
  **0 lỗi trong file H4** ở cả hai lần đo (xem bảng §6.3).

### 6.3 Bảng kết quả

| Nhóm | Kết quả thật (lần chạy cuối, trần chốt 16 MiB) |
|---|---|
| H4 mới `gopTailStream51H4` | **8/8** |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy U2 `reverseRangeGate38U2` | **20/20** |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy A4 `gopTail45A4` | **18/18** |
| Hồi quy B4 `gopTail46B4` | **13/13** |
| Hồi quy C5 `gopTail47C5` | **11/11** (đã cập nhật 1 assertion đếm, §6.1) |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** |
| Hồi quy E2 `gopBlobUrl49E2` | **8/8** |
| Hồi quy F4 `gopStreaming50F4` | **6/6** |
| Hồi quy `reversePlayback` | **10/10** |
| Hồi quy `reversePreviewGate` | **12/12** |
| Hồi quy A6 `reverseBadge45A6` | **12/12** |
| Hồi quy Y6 `reverseCompat43Y6` | **11/11** |
| Hồi quy `errorDetail34Q4` | **35/35** |
| Hồi quy i18n (E2i18n/D4/B6/Z6/saveToast31/structuredNotes32) | 2/3, 2/3, 7/8, 9/10, 14/15, 11/12 — lỗi đếm key 973 vs 982 có trước H4 (§6.2), không phải hồi quy |
| Headed E2E `gopHeaded51H4` mode=gop (6 lượt, §2.2) | 16/17, 16/17, **17/17**, 16/17, 16/17, **17/17** (cổng fail duy nhất là `e2e-wc-frames` do đói decode dưới tải, §4.2) |
| `tsc --noEmit -p apps/web/tsconfig.json` | Lỗi CHỈ ở file test TTS H1/H2 (10 + 20); **0 lỗi trong file H4** |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass**, ra `index.html` + assets (2 lần: trước và sau khi chốt trần) |

## 7. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopTailStream51H4.test.ts` (mới, 8 test)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: tail-scan streaming `fetchTrailingMoovChunked` + option `tailInitialChunkBytes`)
- `apps/web/src/lib/gopCache40V2.ts` (sửa: trần cache mặc định 32 → 16 MiB + comment)
- `apps/web/src/lib/reverseWebcodecs.ts` (sửa: mirror `__vcutReverseWc.gopCache` + 1 dòng comment trần)
- `apps/web/src/lib/gopTail47C5.test.ts` (sửa: 1 assertion đếm request tail, §6.1)
- `apps/web/tsconfig.json` (sửa: +1 dòng exclude test mới)
- `docs/PHASE9_ROUND51_H4_GOP_HEAP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round51-h4/` (harness copy +
6 log headed `headed-cap{32a,32b,16a,16b,8a,8b}.log` + bản sao lưu
file trước sửa + bundle test — KHÔNG đưa vào batch). Fixture tái
dùng: `~/scratch-round47-c5/trailing-real37.mp4` (KHÔNG đưa vào
batch).

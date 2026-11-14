# PHASE9_ROUND108_J2_2MIB_LIMITS.md — J2: thí nghiệm PHÂN BIỆT queue2 (2 MiB) — NHÂN QUẢ ĐÃ CHỨNG MINH

> Luồng J2, Phase 9 đợt 108 (VCut Studio). Chạy: 2026-11-13 20:40–21:00Z
> (14/11 03:40–04:00 +07). Boot `20:34:17Z` (reboot #34) suốt lượt,
> KHÔNG reboot trong lúc đo. Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> ĐO LƯỜNG thuần túy — KHÔNG sửa file production nào; `preview.tsx` md5
> `ced42efd785724c8c0d1b16fc32c7341` (đầu = cuối lượt, khớp đợt 107/108).
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B) + c8 cùng thư mục. **Cấm:** TTS 39, birefnet,
> `.github/workflows/*`. Prereg: `hidden_files/round108-j2/prereg-j2.md`
> (viết TRƯỚC khi chạy, ngân sách cứng 15 run — đã dùng đúng 15/15).

## Kết luận chính (TL;DR)

1. **NHÂN QUẢ queue2 → splice ĐÃ CHỨNG MINH (trong điều kiện blob-file).**
   Splice offset bám CHÍNH XÁC theo `ring-buffer-max-size` của queue2:
   mặc định 2 MiB → offset +2.097.152 (2/2 run, 8 spliced pulls mỗi run);
   đặt ring 1 MiB → offset +1.048.576 (2/2 run: run3 2 pull, run5 16 pull,
   toàn bộ delta đều đúng +1.048.576, không pull nào lệch); đặt ring
   4 MiB (> kích thước file 2.139.973 B) → 0 splice (vòng tròn không quay
   đủ một vòng nên không thể ghi đè — đúng dự đoán của giả thuyết vòng
   tròn). Đây là thí nghiệm phân biệt đã đăng ký ở LIMITS gộp 107 §4
   mục 4, nay có đáp án: **queue2 ring buffer GÂY splice.**
2. **Săn bogus trên Blob thường: 0/8** (H2Q mặc định, đúng ngân sách
   prereg — DỪNG săn). Blob-direct đợt này không tái hiện được tỉ lệ
   bogus 2/3 của G6; máy đợt này RAM khả dụng 1,2–1,6 GB lúc chạy, load
   1,8–4,5 — vẫn có bogus 0/8, nên "RAM thấp → bogus" không còn đứng
   một mình (xem §6).
3. **Phát hiện phụ — biến thể `File` tái hiện bogus 2/2**, trong khi
   `Blob` trần 0/8 cùng đợt/máy. Cả 2 run blob-file mặc định đều có
   error-event `"The operation is not supported"` (t≈0,62–0,73 s, src
   http) + restart pipeline; splice xuất hiện ở CẢ hai instance
   (qtdemux0 và qtdemux1). Chưa tách được "File gây bogus" khỏi
   "restart gây bogus" — confound ghi rõ ở §6, là nợ mở.
4. **Cơ chế giữ mức ring buffer đã giải quyết:** `ring-buffer-max-size`
   mặc định gốc là 0 (disabled, theo `gst-inspect-1.0 queue2`); giá trị
   2.097.152 trong DOT là do urisourcebin set SAU khi tạo element
   (từ `buffer-size=2097152` của nó). Hook chặn `gst_element_factory_make`
   lúc tạo KHÔNG giữ được mức này (DOT vẫn 2.097.152) — phải chặn thêm
   `g_object_set`/`g_object_set_property` mới giữ được (dòng `J2Q2SET`
   trong pull log + DOT kiểm chứng, xem §3).
5. **Mitigation `.mp4` trên đường blob — đã thử, KHÔNG hiệu quả:**
   (a) webkitwebsrc src pad KHÔNG mang caps (typefind vẫn phải sniff
   nội dung, probability=100); (b) biến thể `File("c2.mp4")` KHÔNG làm
   typefind tìm caps nhanh hơn (0,094 s vs 0,103 s, n=1 mỗi bên — trong
   nhiễu); (c) đọc code `media.ts:385,389` — sản phẩm tạo blob URL bằng
   `URL.createObjectURL(new Blob([buf], {type}))`, blob: URL mờ theo
   đặc tả (không mang tên/extension được), kể cả đường `fileToMediaItem`
   (`media.ts:228`, `URL.createObjectURL(file)`) cũng vậy. Phương án
   "gắn .mp4 cho blob URL" **bị loại bằng cả đo lẫn đọc code** — mitigation
   phải đi hướng khác (giữ ring buffer lớn hơn file, hoặc tránh đường
   splice — xem §5).
6. **H2C8 KHÔNG CHẠY** (hết ngân sách 15 run + chưa đủ điều kiện: cần
   bogus trên c8; bogus thu được chỉ trên c2 blob-file) — nợ mở.

## 1. Prereg và tuân thủ

- Prereg viết trước mọi probe (`hidden_files/round108-j2/prereg-j2.md`):
  săn tối đa 8 run mặc định; bogus = ≥1 PULL SPLICED+2MiB hoặc OTHER
  theo `analyze-h2.py` + đọc offset trực tiếp; khi có bogus thì đổi mức
  queue2 (1 MiB / 4 MiB) chạy lại cùng điều kiện; H2C8 chỉ khi có bogus
  trên c2; tổng ngân sách cứng 15 run.
- Thực hiện: săn 8/8 run mặc định (runs 1,2,4,5,6,7,8,9 — run 3 là điểm
  validation 1 MiB xen giữa); 2 run validation 1 MiB trên Blob-direct;
  2 run blob-file mặc định; 2 run blob-file 1 MiB; 1 run blob-file
  4 MiB. **Tổng 15/15 — đúng ngân sách, dừng đúng lúc.**
- `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` export trong
  MỌI lệnh probe (bài học I3); runner J2 còn tự set mặc định + ghi
  `J2-ENV`/`J2-WARN` ra stdout nếu shell quên (không kích hoạt lần nào
  đợt này — mọi run đều có `gstPluginPath` đúng trong JSON).
- Xvfb riêng display :195 (các display :193/:194 đã có luồng J khác dùng);
  runner J2 port 8936 (tránh đụng 8931 của I3). Không có reboot trong
  lượt (`uptime -s` vẫn 20:34:17Z ở mọi lượt kiểm tra). ENOSPC không xảy
  ra (không chạy vite song song ngoài runner).

## 2. Săn bogus trên Blob-direct (H2Q mặc định): 0/8 — DỪNG theo prereg

| Run | playOk | Frames | GST log (byte) | Dòng queue2 | Pull log (dòng) | Spliced |
|---|---|---|---|---|---|---|
| 1 | true | 165 | 1.978.799 | 7.539 | 2.361 | 0 |
| 2 | true | 175 | 1.983.944 | 7.538 | 2.363 | 0 |
| 4 | true | 153 | ~1,98 MB | — | 2.355 | 0 |
| 5 | true | 155 | ~1,98 MB | — | 2.358 | 0 |
| 6 | true | 139 | ~1,98 MB | — | 2.366 | 0 |
| 7 | true | 177 | ~1,98 MB | — | 2.582 | 0 |
| 8 | true | 167 | ~1,98 MB | — | 2.358 | 0 |
| 9 | true | 90 | ~1,9 MB | 7.226 | 2.565 | 0 |

- Kiểm chứng chéo bằng `j2_offsets.py` (đọc offset thực từng pull):
  run1: 396 EXACT / 0 OTHER; run9: 390 EXACT / 0 OTHER. `analyze-h2.py`:
  0 spliced cả 8 run.
- Run9 chỉ 90 frames (phát chậm dưới tải, load lúc chạy 2,16) nhưng
  playOk=true, finalCt=8 — là run hợp lệ theo prereg, không loại.
- RAM khả dụng lúc chạy 1.216–1.558 MB, load1 1,76–4,51 — KHÔNG phải máy
  yên như I3 (3,5 GB RAM) nhưng vẫn 0/8, khác hẳn G6 (2/3, RAM 1,1–2,1 GB).
  Tỉ lệ bogus trên Blob-direct dao động mạnh giữa các đợt (G6 2/3 → I3
  0/3 → J2 0/8); "RAM thấp" không còn là biến giải thích đủ một mình.
  Gộp Blob-direct từ G6 tới nay: 2/14 — tỉ lệ thật có thể chỉ ~14%
  (Wilson 95% ~4–40%), không phải ~67% như G6 gợi ý.
- DOT run1–2 xác nhận lại I3: queue2-0 `ring-buffer-max-size=2097152`,
  `current-level-bytes=1884314`, cạnh typefind → queue2 → parsebin.

## 3. Shim J2: biến thiên được cả hai hằng số 2 MiB của queue2

Shim mới `hidden_files/round108-j2/j2_queue2_probe.c` (= `h2_adapter_probe.c`
+ 2 hook; biên dịch ra `j2_queue2_probe.so`, KHÔNG stage binary):

1. **Hook `gst_element_factory_make`** — khi pipeline tạo element
   `"queue2"`, set `max-size-bytes` + `ring-buffer-max-size` theo env
   `J2_QUEUE2_MAX_SIZE_BYTES`, đọc lại (readback), ghi dòng `J2Q2` vào
   pull log. Đã bắt được queue2 trong pipeline WebKit thật (dòng
   `env-unset` ở mọi run mặc định).
2. **Hook `g_object_set` / `g_object_set_property`** — BẮT BUỘC vì phát
   hiện: `ring-buffer-max-size` mặc định gốc = 0 (disabled); giá trị
   2.097.152 trong DOT là do urisourcebin set LẠI sau khi tạo element
   (từ `buffer-size=2097152` của nó). Bằng chứng: run3 H2Q cũ (chỉ hook
   lúc tạo, set 1 MiB): DOT `max-size-bytes=1048576` (giữ) nhưng
   `ring-buffer-max-size` vẫn 2.097.152. Sau khi thêm hook chặn set:
   dòng `J2Q2SET … prop=ring-buffer-max-size orig=2097152 new=1048576
   OVERRIDE-env` xuất hiện 2 lần/run blob-file 1 MiB (2 instance queue2
   sau error-restart), 1 lần/run 4 MiB (1 instance, không restart) — và
   DOT giữ đúng mức mới (xem bảng §4).
   - An toàn: interceptor chỉ quét varargs khi object là queue2 đã track
     (so sánh con trỏ) + đúng 2 property đích; gặp property lạ thì
     forward nguyên call qua `g_object_set_valist`; mọi object khác
     forward ngay. Không ghi nhận pipeline nào hỏng do shim (mọi run
     đều play tới finalCt=8).

| Kiểm chứng giữ mức | 1 MiB | 4 MiB |
|---|---|---|
| `J2Q2` readback lúc tạo | 1048576 OK | 4194304 OK |
| `J2Q2SET` override sau tạo | 2 lần/run (runs 3, 5) | 1 lần (run 4) |
| DOT `ring-buffer-max-size` | 1048576 (4 file) | 4194304 (2 file) |
| DOT `max-size-bytes` | 1048576 | 4194304 |

## 4. Thí nghiệm nhân quả: offset splice bám theo ring buffer (BẢNG QUYẾT ĐỊNH)

Điều kiện: c2 blob-file (`new File([buf], "c2.mp4")` làm src đầu tiên),
cùng runner/shim/GST/DOT. Offset đọc trực tiếp bằng
`benchmarks/render/j2_offsets.py` (tra 16 byte đầu mỗi pull trong file
c2.mp4 — classifier `analyze-h2.py` chỉ biết SPLICED+2MiB cố định nên
báo "BOGUS RUN: NO" cho các run 1 MiB/4 MiB; đó là giới hạn của
classifier, KHÔNG phải "sạch" — xem chú thích dưới bảng).

| Mức ring | Run | playOk / frames | Spliced pulls | Offset thực (delta) |
|---|---|---|---|---|
| 2 MiB (mặc định) | blobF-1 | false* / 190 | 8 (SPLICED+2MiB) | +2.097.152 (req_off 0/3163/3179/41666) |
| 2 MiB (mặc định) | blobF-2 | false* / 160 | 8 (SPLICED+2MiB) | +2.097.152 (req_off 3179/41666, cả 2 instance) |
| 1 MiB | blobF-3 | false* / 180 | 2 OTHER | **+1.048.576** (req_off 0 → actual 1048576) |
| 1 MiB | blobF-5 | false* / 184 | 16 OTHER | **+1.048.576** (req_off 60156/74135/90845/107504/120386 → actual +1048576) |
| 4 MiB | blobF-4 | true / 164 | 0 | — (không splice) |

\* `playOk=false` ở các run blob-file mặc định/1 MiB là do error-event
`"The operation is not supported"` (t≈0,62–0,73 s, src http) rồi
recovered, phát tới finalCt=8 (xem §6).

- **Verdict:** offset splice = đúng giá trị `ring-buffer-max-size` đã
  đặt, ở cả 3 mức (2/2 run ở 2 MiB, 2/2 run ở 1 MiB với delta đúng
  +1.048.576 tới từng byte; 4 MiB: ring lớn hơn file nên không quay vòng
  được → 0 splice, đúng dự đoán của cơ chế vòng tròn). **Nhân quả
  queue2 ring buffer → splice đã chứng minh** trong điều kiện blob-file.
- Run5 là replication mạnh nhất: 16 pull splice ở NHIỀU offset khác nhau
  (60.156 → 120.386), tất cả đều delta đúng +1.048.576 — không thể là
  trùng hợp (xác suất 16 pull cùng lệch đúng 1 hằng số nếu không có
  nhân quả là không đáng kể).
- Chú thích classifier: `analyze-h2.py` phân loại SPLICED+2MiB bằng hằng
  số 2.097.152 cứng; khi offset dời sang +1.048.576 nó báo OTHER và
  "BOGUS RUN: NO (0 spliced pulls)" cho blobF-3/5 — SAI về bản chất.
  Mọi con số offset trong bảng này đều từ `j2_offsets.py` (đọc trực tiếp
  từ clip), không qua classifier cũ.
- Giới hạn của verdict (ghi rõ, không giấu): thí nghiệm biến thiên
  `max-size-bytes` VÀ `ring-buffer-max-size` CÙNG mức (cả hai đều đặt
  bằng giá trị test). Việc offset bám theo giá trị đó + cơ chế vòng tròn
  (chỉ ring buffer mới viết lại offset byte; giới hạn mức queue chỉ làm
  nghẽn/tắc, không đổi nội dung byte) là bằng chứng cho ring buffer —
  nhưng tách riêng từng property vẫn là việc chưa làm (nợ mở §7).
  Verdict chỉ đúng trong điều kiện blob-file; Blob-direct đợt này 0/8
  nên không có điểm bogus nào để đối chiếu offset trên đường đó (dù
  G6 2/3 bogus Blob-direct với offset +2.097.152 là phù hợp với cùng
  một cơ chế).

## 5. Mitigation `.mp4` trên đường blob — đã thử, đã loại

- **(a) Đọc GST log I3:** webkitwebsrc src pad KHÔNG mang caps (grep
  `webkitwebsrc.*caps` trong `Lc2-h2Q-blobE-run1.log` = 0 dòng) —
  typefind vẫn phải sniff nội dung (`found caps video/quicktime,
  probability=100` lúc 0,067 s I3 / 0,103 s J2 run1). Blob `type:
  "video/mp4"` KHÔNG tới được typefind dưới dạng caps.
- **(b) Đã thử `File("c2.mp4")`:** typefind tìm caps lúc 0,094 s
  (blob-file run2) vs 0,103 s (Blob thường, J2 run1) — chênh 9 ms,
  n=1 mỗi bên, trong nhiễu đo; KHÔNG có hiệu quả đo được. (Tác dụng
  phụ không mong muốn: File-variant lại là điều kiện duy nhất tái
  hiện bogus 2/2 — xem §6.)
- **(c) Đọc code sản phẩm:** `apps/web/src/media.ts:385,389` —
  `URL.createObjectURL(new Blob([buf], { type }))`; `media.ts:228`
  (`fileToMediaItem`) — `URL.createObjectURL(file)`. Cả hai đều trả về
  blob: URL mờ (`blob:<origin>/<uuid>`) theo đặc tả — **không thể mang
  tên hay extension**, kể cả khi nguồn là File có tên. Phương án "gắn
  .mp4 cho blob URL" **bị loại bằng cả đo lẫn đọc code**.
- **Hướng mitigation còn lại (chưa thử, chỉ nêu — không claim):**
  (i) giữ ring buffer lớn hơn file (playbin/urisourcebin `buffer-size`
  > kích thước clip — cần đổi qua WebKit/playbin, không phải code repo);
  (ii) tránh đường splice bằng cách không để typefind pull lại sau khi
  ring đã quay vòng (preload đầy đủ trước khi playbin seek — G6 §8.5c,
  chưa đo); (iii) phát bằng http có đuôi `.mp4` thay cho blob khi được
  (đường progressive đã sạch 0 splice trong mọi đợt — nhưng đổi kiến
  trúc phát, không phải mitigation nhỏ). Cả ba đều là nợ mở, chưa đo.

## 6. Phát hiện phụ + caveat bắt buộc

1. **Blob-file tái hiện bogus 2/2 vs Blob-direct 0/8** — chênh lệch lớn
   nhưng n nhỏ (2 vs 8). Cả 2 run blob-file mặc định đều có error-event
   + restart pipeline (3 adapter webkitwebsrc, qtdemux0/1/2), splice ở
   cả hai instance. Chưa tách được ba yếu tố: (i) File thay Blob,
   (ii) error-event, (iii) restart pipeline. Giả thuyết cần kiểm tiếp:
   chạy Blob-direct với error cưỡng bức (hoặc blob-file nhưng chặn
   error) để xem yếu tố nào là điều kiện cần. Đây là nợ mở lớn nhất
   của đợt (ngoài H2C8).
2. **Error-event `"The operation is not supported"`** (src http,
   t≈0,62–0,73 s) xuất hiện 4/4 run blob-file ở mặc định/1 MiB, nhưng
   KHÔNG xuất hiện ở run 4 MiB duy nhất (playOk=true, 1 instance).
   n=1 ở 4 MiB nên không kết luận "ring lớn hết error" — chỉ ghi nhận.
   Error xảy ra TRƯỚC khi phát (element lúc đó src http — pool tạo
   element với `item.url` rồi mới nâng cấp lên blob?), rồi recovered
   và phát tới finalCt=8. Không điều tra sâu hơn trong đợt này (hết
   ngân sách).
3. **H2Q 1 MiB trên Blob-direct (run3, 2 lần chạy):** 0 spliced cả 2
   (173/184 frames). Vì Blob-direct mặc định đã 0/8 nên điểm này không
   nói gì về nhân quả — chỉ là điểm kiểm tra shim (DOT giữ
   `max-size-bytes=1048576`).
4. **Tỉ lệ bogus Blob-direct gộp:** G6 2/3 + I3 0/3 + J2 0/8 = 2/14
   (~14%). Con số 2/3 của G6 có thể là may mắn lấy mẫu (n=3); đừng
   dùng 2/3 làm tỉ lệ kỳ vọng nữa.
5. **Classifier cũ lỗi thời:** `analyze-h2.py` hardcode +2.097.152 —
   mọi đợt sau dùng mức ring khác PHẢI dùng `j2_offsets.py` (đọc offset
   thực) kèm theo, nếu không sẽ báo "sạch" giả như blobF-3/5.
6. **Không sửa production, không push.** Runner J2 + script offset mới
   là code probe-only; bundle probe-only build từ source production
   không đổi (`preview.tsx` md5 giữ nguyên).

## 7. Nợ mở cho đợt sau

1. **Tách confound blob-file:** File vs error-event vs restart pipeline
   — yếu tố nào là điều kiện cần của bogus? (Chạy Blob-direct + cưỡng
   bức error, hoặc blob-file nhưng chặn error/restart.)
2. **Tách riêng `max-size-bytes` vs `ring-buffer-max-size`:** chạy mức
   chỉ đổi ring (giữ max-size-bytes mặc định) và ngược lại — shim J2
   đã hỗ trợ từng property riêng (sửa env thành 2 biến), chỉ cần run.
3. **H2C8:** chạy c8 blob-file (điều kiện đã cho bogus) tới khi có
   bogus, xem offset có cố định theo ring không (c8 8.182.985 B >
   4 MiB — điểm 4 MiB trên c8 sẽ cho offset +4.194.304 nếu cơ chế đúng,
   thay vì "không splice" như c2).
4. **Mitigation thật:** thử một trong ba hướng §5 (ring > file, preload
   đầy đủ trước seek, hoặc http-.mp4 thay blob) và đo lại tỉ lệ bogus.
5. **Error-event blob-file:** điều tra nguyên nhân `"The operation is
   not supported"` (src http lúc t≈0,7 s) — có thể là manh mối cho
   chính cơ chế splice (element khởi động bằng http rồi mới lên blob?).
6. Nợ đứng yên từ đợt 107 (xem LIMITS gộp đợt 107 §4): G1 chờ user quyết,
   mù #22 chờ user quyết, re-arm A/B tắt E4, zombie gate (b), blur
   B-band, cụm A, ghost C3b, harness E1, EPERM probe #27 + mù #26,
   birefnet 0 lần, TTS 39 CẤM kiểm lại, ci-security.yml 403, release gate.

## 8. Batch stage (KHÔNG push)

`phase9-round108-j2-2mib.txt` (4 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_108j2_2mib.mjs` (runner J2: copy
  runner I3, port 8936, guard GST_PLUGIN_PATH, biến thể `blob-file`,
  ghi `j2Queue2MaxSizeBytes` vào JSON; header ghi rõ cách chạy)
- `benchmarks/render/j2_offsets_108.py` (đọc offset thực từng pull —
  instrument chứng minh offset dời; classifier cũ hardcode +2MiB)
- `benchmarks/results/webkit-blob-flaky-108j2-2mib.json` (15 case:
  10 H2Q — 8 mặc định + 2 run3 1 MiB; 5 J2FILE — 2 mặc định + 2 1 MiB
  + 1 4 MiB; mọi case đều có `j2Queue2MaxSizeBytes` + `gstPluginPath`)
- `docs/PHASE9_ROUND108_J2_2MIB_LIMITS.md` (file này)

Không stage binary (`.so` ở lại `hidden_files/round108-j2/`, như tiền lệ
H2/I3). Không stage log nhị phân. Dữ liệu thô đầy đủ ở
`hidden_files/round108-j2/` (prereg, gst/pull/dot/analysis/log,
progress, shim `j2_queue2_probe.c` + `.so`). KHÔNG push.

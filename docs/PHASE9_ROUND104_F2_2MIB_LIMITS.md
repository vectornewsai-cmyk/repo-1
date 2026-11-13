# LIMITS — F2 đợt 104: 2 MiB — refill nào tạo đoạn sai (adapter probe)

> Luồng F2, Phase 9 đợt 104 (VCut Studio). Nợ LIMITS gộp đợt 103 §4 mục 2
> (bước còn lại sau E2: xác định dataReceived/refill nào tạo đoạn sai;
> TRACE ghi được thì ức chế bogus — catch-22).
> Đo: 13/11/2026 ~08:43–08:54Z (15:43–15:54 +07). Boot `8c1c5131`
> (reboot #28 lúc 06:56:44Z; KHÔNG reboot trong lúc đo — reboot tiếp
> theo dự kiến ~09:03Z, sau khi đo xong). Repo local `~/workspace/repo-1`,
> branch main. **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push
> sau từ main chat.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B, md5 `4dfaad520330453d516e14f551580cdd`). **Cấm:** TTS 39,
> birefnet (RAM khả dụng ~1,8–2,0 GB lúc đo).

## Kết luận chính (TL;DR)

1. **Refill tạo đoạn sai ĐÃ XÁC ĐỊNH (bằng nội dung byte + tái dựng FIFO):
   dataReceived của Range CUỐI CÙNG trước pull đầu tiên (R5/R6) — toàn bộ
   response đó được đẩy MỘT LẦN vào adapter webkitwebsrc, rồi create()
   rút ra thành từng chunk 4096 B và đẩy xuống typefind trong phase scan
   (push). Đoạn sai (file[2 MiB..]) nằm TRONG response đó và đi vào
   cache push-phase của typefind qua lần rút đó.** Cụ thể (run7):
   qtdemux0 — R5 `bytes=1064960-` (1.075.013 B @file[1064960..EOF],
   push ms=9978) rút hết 263 chunk lúc ms=9983–9988; pull splice đầu
   ms=10076 (logical 0 → file[2097152], tức chunk thứ 253 của R5).
   qtdemux1 — R6 `bytes=512000-` (1.627.973 B, push ms=10595) rút hết
   lúc ms=10597–10600; pull splice ms=10680 (logical 3179 →
   file[2100331], tức byte thứ 3179+387×4096 trong R6). Run1 y hệt:
   R6 `bytes=450560-` rút xong ms~4991, pull splice ms=5020.
2. **Adapter webkitwebsrc VÔ TỘI ở thời điểm pull (bằng chứng mới,
   đảo nhẹ kết luận E2):** luồng take của adapter liên tục nội bộ
   (0 discontinuity trên mọi adapter, run1+run7), và adapter RỖNG
   tại thời điểm pull bị splice (run7: R5 rút hết ms=9988, FIFO rỗng;
   pull ms=10076; **0 event đọc adapter nào trong ±3 ms** quanh pull —
   run1 ms=5020 y hệt). Đoạn sai KHÔNG được giao bởi adapter lúc pull;
   nó đã nằm trong **cache push-phase nội bộ của typefind** (không phải
   GstAdapter — xem mục 3) và pull đọc ra từ đó, với vị trí đọc ahead
   đúng 2 MiB so với vị trí logic. E2 đúng ở "splice ở phía trên
   typefind" theo nghĩa byte, nhưng refill gây ra nó là dataReceived
   cuối + cache của typefind, không phải một lần take sai của adapter.
3. **Adapter của typefind CHỈ giữ 4096 byte đầu, đúng** (3 instance,
   run7): mỗi typefind push đúng 1 buffer 4096 B file[0..4096] vào
   adapter của nó, map 1 lần để soi type, take 1 lần để chuyển tiếp —
   đó là cửa sổ soi type, không phải nơi chứa đoạn sai. Đoạn sai nằm
   trong cache push-phase KHÁC của typefind (danh sách buffer đã nhận
   trong phase scan — không qua GstAdapter nên shim adapter không thấy
   event nào lúc pull; đây là giới hạn đo còn lại, xem §6 mục 2).
4. **Vì sao đúng 2.097.152 VẪN MỞ — nhưng đã thu hẹp một nấc và có quan
   sát mới:** (a) 0 stop/restart thật trong cả 12 run F2 (gộp B1+C1+D1+E2:
   0 trong ~48 run) — LOW threshold vẫn bị bác bằng runtime; (b) 0 Range
   nào tới 2097152 trong 11/12 run — NHƯNG **run4 CÓ R5
   `requestedPosition=2097152`, `Range: bytes=2097152-` (lần đầu tiên
   quan sát được trong 48 run gộp)** — qtdemux seek thật tới đúng 2 MiB
   để đọc 42.821 byte cuối file (2139973−2097152=42821 — đúng con số
   "42821" trong tái dựng luồng byte của E2!); run4 vẫn bogus dạng
   atom-1 như các run khác, nên seek này KHÔNG phải điều kiện cần của
   bogus, nhưng nó cho thấy con số 2 MiB cũng xuất hiện như một seek
   target hợp lệ của qtdemux (đọc đuôi file/moov), không chỉ là trùng
   hợp LOW; (c) giả thuyết "scan tiêu thụ đúng 2 MiB" BỊ BÁC bằng số:
   tổng take trước pull là 4.249.573 / 2.963.429 / 3.517.320 /
   2.148.325 B (4 trường hợp) — không cái nào bằng 2 MiB; (d) phép phân
   rã "Range-start-chunks + consumed-chunks = 512" chỉ là cách viết lại
   của (readpos−logical)=2 MiB, KHÔNG phải giải thích — đã tự bác,
   không dùng làm kết luận.
5. **Shim mới KHÔNG ức chế bogus:** F2L 5/6 + F2L2 5/6 = **10/12 run
   bogus**, so với E2 nhẹ 10/10 — Fisher không có ý nghĩa (p≈0,48).
   Ghi batched (1 write()/128 KiB thay vì 1 write()/dòng) + thêm hook
   map/copy/get_buffer không làm giảm tỉ lệ bogus. Đây là lần đầu đo
   được bogus rate với shim adapter mà không cần TRACE.
6. **dataReceived KHÔNG chặn trực tiếp được bằng LD_PRELOAD** (đo mới):
   `nm -D libwebkitgtk-6.0.so.4.20.0` không có symbol nào cho
   WebKitWebSrc::dataReceived (chỉ có một Inspector::dataReceived
   không liên quan). Cách làm đúng là chặn API public mà nó dùng —
   `gst_adapter_push/take_buffer/map/...` (libwebkitgtk import đủ các
   symbol này — đã verify bằng objdump) — shim F2 chứng minh cơ chế này
   hoạt động và ghi được refill/take đầy đủ.

## 1. Phương pháp đo mới — shim LD_PRELOAD `f2_adapter_probe.c`

Kế thừa shim E2 (gst_pad_pull_range + gst_pad_push, cùng clock) và thêm:

- `gst_adapter_push()` — dataReceived đẩy chunk mạng vào m_adapter
  (REFILL). `gst_adapter_take_buffer()` / `gst_adapter_take()` —
  create() lấy byte ra phục vụ pull/push. `gst_adapter_clear()` /
  `gst_adapter_flush()` — Reset. **v2** thêm `gst_adapter_map()` /
  `unmap()` / `copy()` / `get_buffer()` — vì F2L run1 chứng minh
  typefind/qtdemux đọc pull-mode bằng map+flush (pull splice ms=5020
  nhưng 0 ATAKE ở ms 5020–5030).
- Mỗi event 1 dòng: ms (monotonic), pid, con trỏ adapter (phân biệt
  instance), module của caller (tra return address qua
  `/proc/self/maps` — "libwebkitgtk" = dataReceived/create;
  "libgstcoreelements" = typefind; "libgstvideoparsersbad" = h264parse;
  "libgstisomp4" = qtdemux), avail trước/sau, size, 16 byte đầu (hex —
  đủ tra file offset).
- Ghi vào buffer bộ nhớ 128 KiB, flush 1 write() khi đầy + lúc process
  exit — ~16 write()/run thay vì ~8.000 (E2: 1 write()/dòng). Cap
  30.000 event adapter / process (không chạm tới: tối đa ~2.100/run).
- **Sửa trong v2:** refresh bảng maps khi gặp caller "?" (plugin
  GStreamer load lazy sau init nên bảng lúc init thiếu chúng) —
  APUSH "?" giảm từ 135/146 (run1 v1) xuống 0–9/run (F2L2).

Kiểm chứng shim trước khi đo thật (không browser):
- Test C trực tiếp gọi adapter API: APUSH/ATAKE/ACLEAR + AMAP/AUNMAP/
  ACOPY/AGETB/AFLUSH đều bắn đúng, caller tag đúng tên exe.
- `gst-launch filesrc ! typefind`: PULL/PUSH đúng byte file (khớp E2).
- `nm -D`/`objdump -T`: libwebkitgtk import gst_adapter_push,
  take_buffer, clear, flush, available, new, copy — đúng API shim chặn.

Probe chạy: `benchmarks/render/webkit_blob_flaky_104f2_2mib.mjs`
(copy probe E2, port 8923, mode F2L). Phân tích:
`hidden_files/round104-f2/analyze-f2.py` (v2: tra offset bằng
bytes.find, tái dựng FIFO mọi adapter, đối chiếu pull splice với
event adapter ±3 ms) + `/tmp/f2-front.py` (FIFO front tại thời điểm
pull — script tạm, không stage).

## 2. Kết quả đo — 12 run, 2 ma trận (cùng GST nhẹ)

| Ma trận | Shim | Run | Bogus (≥1 first-atom) | playOk | Frames |
|---------|------|-----|----------------------|--------|--------|
| F2L (run1–6) | v1 (push/take/clear/flush + pull/push) | 6 | **5/6** (run2 sạch) | 2/6 | 3–49 |
| F2L2 (run7–12) | v2 (+map/unmap/copy/get_buffer, refresh maps) | 6 | **5/6** (run9 sạch) | 1/6 | 4–29 |

- Tổng: **10/12 run bogus, 12 bogus atom** (run4: 2 atom — cả 2
  instance đều atom-1; các run khác 1 atom). Dạng: atom-1 9/12 run
  (pull đầu off=0 đã splice); header-đúng + sample-data splice
  (kiểu E2W-run2) xuất hiện trong run1/run7 ở instance thứ hai
  (qtdemux1: header đúng, chết ở pull 3179/41666).
- Fisher F2 (10/12) vs E2 nhẹ (10/10): không có ý nghĩa (p≈0,48) —
  shim F2 không ức chế bogus. Gộp nhẹ từ D1: 36/40 run bogus.
- 0 stop thật, 0 restart thật trong 12 log GST F2 (`: stopping
  download` 0, `: restarting download` 0). `"download already active"`
  0 dòng trong 12 log nhẹ — giải thích: đó là message TRACE (line 391
  restartLoaderIfNeeded), chỉ xuất hiện ở ma trận TRACE (E2T/C1);
  không phải bất thường.
- 0 Range/seek tới 2097152 trong 11/12 run; **1 lần duy nhất ở run4**
  (R5, xem §5).

## 3. Tái dựng refill — run7 (rõ nhất, shim v2) và run1

### 3.1 Adapter webkitwebsrc0 `0x5b87c6f0ace0` (run7, feeds qtdemux0)

| ms | Event | Nội dung |
|----|-------|----------|
| 9087 | PUSH#0 | full file 2.139.973 B @file[0] (R1) |
| 9406 | PUSH#1 | 32 B @file[2139941] (R2) |
| 9512 | PUSH#2 | 128 B @file[2139845] (R3) |
| 9779 | PUSH#3 | full file 2.139.973 B @file[0] (R4) |
| 9978 | PUSH#4 | **1.075.013 B @file[1064960..EOF] (R5)** |
| 9983–9988 | 263 ATAKE | rút hết R5: 262×4096 + 1861 B, file[1064960]→file[2138112..EOF] |
| 10076 | PULL splice | typefind + qtdemux0, req_off=0 → **file[2097152]** |

- Take thứ 253 của lần rút R5 (ms=9988) có file_off=2097152 —
  đúng byte pull splice nhận ở ms=10076. Nhưng lần rút đã xong
  ms=9988, FIFO rỗng; pull ms=10076 không có take/map nào đi kèm.
  Kết luận: byte file[2097152] đi vào typefind qua lần rút R5
  (push-phase), nằm trong cache của typefind, rồi pull đọc ra từ
  cache ở vị trí đọc ahead 2 MiB.
- Tổng adapter: pushed=5.355.119, taken=4.249.573, 0 discontinuity
  (luồng take liên tục nội bộ — kiểm bằng FIFO sim trên 1.040 take).

### 3.2 Adapter webkitwebsrc1 `0x5b87c6be1d90` (run7, feeds qtdemux1)

- PUSH: R1 full file @10375; R2 32 B @10473; R3 128 B @10484;
  R5 1.069.987 B @file[1069986] @10506; **R6 1.627.973 B
  @file[512000..EOF] @10595** (caller "?" — xem §4; nội dung khớp
  Range `bytes=512000-`).
- Rút R6: 397×4096 + 1861 B lúc ms=10597–10600 (caller "?" — cùng
  cặp với push R6).
- Pull splice ms=10680 (logical 3179 → file[2100331]) và ms=10686
  (logical 41666 → file[2138818], tức nối trong buffer như E2W-run2).
  file[2100331] = byte thứ 3179+387×4096 trong R6 — tức vị trí đọc
  trong R6 ahead đúng 2 MiB so với logical (3179+2.097.152).
- Tổng adapter: pushed=4.838.093, taken=2.963.429, 0 discontinuity.

### 3.3 Run1 (shim v1) — cùng mẫu

- webkitwebsrc0 `0x5c6d2ec4d2d0`: R1 full @4699; R2 32 B @4826;
  R3 128 B @4892; R5 1.069.987 B @1069986 @4910; **R6 1.689.413 B
  @file[450560..EOF] @4990**; rút hết lúc ms=4990–4991 (file[450560]
  → file[2138112..EOF]); pull splice ms=5020 (logical 0 →
  file[2097152] = byte thứ 252×4096 trong R6).
- webkitwebsrc1 `0x5c6d2ec426d0`: R1 full @5198; R2/R3; R5 300.869 B
  @5449; pull splice ms=5532 (logical 3179 → file[2100331]) và
  ms=5539 (logical 41666 → nối trong buffer) — cùng mẫu E2W-run2.
- Tổng 2 adapter: 0 discontinuity; 6 pull splice/run1 (3 cặp).

### 3.4 Typefind adapter — chỉ 4096 byte đầu, đúng

Mỗi instance typefind (3 instance, run7): đúng 1 APUSH 4096 B
file[0..4096] (ms=9089 / 10381 / 14199), 1 AMAP 4096 B, 1 AUNMAP,
1 ATAKE 4096 B — cửa sổ soi type. Không chứa đoạn sai. Đoạn sai
nằm trong cache push-phase khác của typefind (không phải
GstAdapter), nên shim không thấy event nào lúc pull.

### 3.5 Adapter ngoài luồng splice (đã loại trừ)

- h264parse (`libgstvideoparsersbad.so`, 2 adapter): push từng
  sample (30 B SPS + 9 B PPS do qtdemux tổng hợp từ avcC — hex
  không có trong file — rồi sample 13.979 B @60156, 16.710 B @74135…
  đúng file offset); take 39 B = SPS+PPS. Đây là parser hạ nguồn,
  không liên quan splice.
- qtdemux adapter (`libgstisomp4.so`, `0x771150027cf0`): chỉ 3 ACLEAR
  avail=0 (ms=10003/10075/10089, run7) — luôn rỗng, không phải nguồn
  byte splice (ACLEAR ms=10075, 1 ms trước pull splice, là reset
  theo sau teardown chứ không phải cấp byte).

## 4. Caller "?" còn lại (giới hạn attribution)

- v1: 135/146 APUSH "?" (bảng maps lúc init thiếu plugin load lazy).
- v2 (refresh maps): APUSH "?" còn 0–9/run; nhưng trên adapter
  `be1d90` (run7) vẫn còn 398/726 ATAKE + 1/5 APUSH mang caller "?".
  Nội dung xác định được cặp "?" này là drain của R6
  (`bytes=512000-`, 1.627.973 B → 397×4096+1861 — khớp từng byte),
  tức cùng đường dataReceived→adapter→create() như các event
  libwebkitgtk — chỉ thiếu nhãn module.
- Giả thuyết hàng đầu: bảng maps bị cắt ở MAX_MAPS=1024 (WebProcess
  có >1024 mapping khi JIT + plugin load xong) hoặc caller nằm trong
  mapping ẩn danh (JIT) — chưa phân biệt được; bước tiếp theo: log
  luôn địa chỉ return thô + tăng cap / dump maps khi gặp "?" lần đầu.

## 5. Vì sao đúng 2.097.152 — đã đo thêm, vẫn mở (không bịa)

1. **Run4: R5 seek thật tới đúng 2097152** (lần đầu trong 48 run gộp):
   `webKitWebSrcMakeRequest: Posting task to request R5 …
   requestedPosition=2097152`, `Range request: bytes=2097152-`
   (GST 1,78 s). Response này là file[2097152..EOF] = đúng 42.821 B
   — khớp con số "42821" trong tái dựng E2 (luồng byte tiếp tục đúng
   từ logical 42821 sau đoạn sai). Run4 bogus cả 2 instance dạng
   atom-1 (pull ms=5452/5747 logical 0 → file[2097152]) — cùng dạng
   như các run không có seek này, nên seek KHÔNG phải điều kiện cần.
   Chưa xác định được qtdemux lấy số 2097152 từ đâu (4 byte tại đó là
   `204286c4` — không phải sample-length hợp lệ — nên không phải
   seek tới đầu sample; có thể là seek đọc đuôi/moov — cần parse
   moov/stco để kiểm chứng, chưa làm).
2. **LOW threshold vẫn bị bác:** 0 stop/restart trong 12 run F2
   (gộp ~48 run). Không có bằng chứng nào nối 2 MiB với LOW ngoài
   trùng số.
3. **"Scan tiêu thụ đúng 2 MiB" BỊ BÁC bằng số** (§3): tổng take
   trước pull đầu: 4.249.573 / 2.963.429 / 3.517.320 / 2.148.325 B —
   không cái nào bằng 2 MiB. Phép phân rã 512-chunk là tautology
   (chỉ viết lại readpos−logical=2 MiB) — đã tự bác, không dùng.
4. **Cơ chế còn lại (giả thuyết đứng):** cache push-phase của typefind
   là FIFO stream; vị trí đọc của nó tại pull đầu ahead đúng 2 MiB so
   với vị trí logic. Cái gì đặt vị trí đọc đúng 2 MiB — CHƯA đo được:
   cần đếm byte typefind đã forward downstream trong phase scan
   (gst_pad_push typefind→queue2 — PUSH cap 40/tên đã che mất cửa sổ
   này trong F2; lần sau chỉ log đếm/size, không log hex, hoặc nâng
   cap) và/hoặc soi cache nội bộ của typefind (không phải adapter).

## 6. Số đo & dữ liệu thô

- Shim đo mới: `benchmarks/render/f2_adapter_probe.c` (v1+v2; binary
  `hidden_files/round104-f2/f2_adapter_probe.so` — KHÔNG stage).
- Probe: `benchmarks/render/webkit_blob_flaky_104f2_2mib.mjs`
  (mode F2L, port 8923); kết quả
  `benchmarks/results/webkit-blob-flaky-104f2-2mib.json` (F2L, 6 case)
  + `benchmarks/results/webkit-blob-flaky-104f2b-2mib.json` (F2L2,
  6 case).
- Dump: `hidden_files/round104-f2/f-websrc/pull/*.pull.log` (12 file;
  F2L ~2.500 dòng/run, F2L2 ~2.900 dòng/run — gồm APUSH/ATAKE/AMAP/
  ACLEAR + PULL/PUSH); log GST
  `hidden_files/round104-f2/f-websrc/gst/*.log` (12 file, 110–209 KB).
- Phân tích: `hidden_files/round104-f2/analyze-f2.py` (v2) →
  `f2-run1-analysis-v2.txt`, `f2-run7-analysis-v2.txt`;
  `/tmp/f2-front.py` (FIFO front tại pull — script tạm, không stage).
- Launcher: `hidden_files/round104-f2/run-104f2.mjs` + `watchdog.py`
  + `start-f2l.sh` + `start-f2l2.sh` + `matrix104f2l{,2}.log`
  (working state, không stage).
- Tham chiếu: E2 `docs/PHASE9_ROUND103_E2_2MIB_LIMITS.md`; D1
  `docs/PHASE9_ROUND102_D1_2MIB_LIMITS.md`; LIMITS gộp đợt 103
  `docs/PHASE9_ROUND103_LIMITS.md` §4 mục 2.

## 7. Ghi chú trung thực / giới hạn của luồng này

- Không sửa production. Không push. Không release/tag. Không đụng file
  của luồng khác (chỉ dùng port 8923 + display Xvfb claim qua lock;
  F2L2 chạy sau khi F2L xong, không đè file — run7–12 tách riêng).
- "Refill tạo đoạn sai" (§3) là kết luận về response nào chứa byte sai
  và đường nào đưa nó vào cache typefind — KHÔNG phải chứng minh code
  nào trong typefind đặt vị trí đọc (cache đó không quan sát trực tiếp
  được bằng shim adapter; xem §5 mục 4).
- Typefind adapter 4096 B (§3.4) được suy ra từ 3 instance run7 (1
  push/map/take mỗi instance) — mẫu nhỏ nhưng nhất quán cả 3.
- Mọi run đều `playOk=false` trừ run2/run6 (F2L) và run9 (F2L2) —
  đó là tỉ lệ fail của probe flaky-blob dưới tải cao (loadavg tới
  ~19 lúc đo), không phải tỉ lệ fail của sản phẩm; các run
  error-event vẫn phát 3–49 frame qua fallback http.
- Không chạy ma trận TRACE (E2T đã có 0/4; chạy lại chỉ tốn lượt).
- Không fetch `qtdemux.c` (B1 đã thử 404/403 — không lặp lại).
- Không parse moov/stco để giải thích seek 2097152 của run4 (xem
  §5 mục 1 — việc của đợt sau).

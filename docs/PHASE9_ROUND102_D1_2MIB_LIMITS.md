# LIMITS — D1 đợt 102: 2 MiB — kết luận probe junction typefind↔webkitwebsrc

> Luồng D1, Phase 9 đợt 102 (VCut Studio). Nợ LIMITS gộp đợt 101 §4 mục 1+3
> (C1 chưa xong — chỉ có dữ liệu đo thô; điểm nối chính xác chưa kết luận).
> Đo: 13/11/2026 ~02:45–03:15Z (09:45–10:15 +07). Boot `249407b6` (khác boot
> C1 `3a12a7d3` và boot B1 `66fb273d` — đã reboot, uptime 39' lúc bắt đầu).
> Repo local `~/workspace/repo-1`, branch main. **KHÔNG push, KHÔNG release/tag.**
> Chỉ stage, user tự push sau từ main chat.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B). **Cấm:** TTS 39, birefnet (RAM khả dụng ~1,4–2,7 GB).

## Kết luận chính (TL;DR)

1. **Điểm nối chính xác ở mức buffer VẪN CHƯA chứng minh được** — nhưng đã thu
   hẹp thêm một nấc quyết định: splice nằm trong **luồng byte blob→qtdemux
   trước pull đầu tiên của qtdemux**, tái hiện qua cả **instance
   webkitwebsrc+typefind hoàn toàn mới** (run6 D1b: qtdemux0 bogus rồi
   qtdemux1 bogus trên webkitwebsrc1+typefindelement2 mới tinh), và
   **không tái hiện trên instance http thuần cùng file** (qtdemux2 đúng).
   Chuỗi event typefind:5 trong run bogus **giống hệt** run sạch — điểm nối
   không nhìn thấy được ở mức event, chỉ ở mức nội dung byte.
2. **Ức chế bởi logging TRACE được xác nhận định lượng:** C1
   (`typefind:5 + webkitwebsrc:7` TRACE) **0/4 bogus** vs logging nhẹ
   (B1+D1a+D1b, `webkitwebsrc:5`, không TRACE) **16/18 run bogus (88,9%)**,
   Fisher exact một phía **p = 0,0029**. Đây là bằng chứng định lượng cho
   hiệu ứng thiết bị đo mà C1 chỉ nêu định tính.
3. **Disassembly CHỐT cả hai ngưỡng trong binary thật**
   (`libwebkitgtk-6.0.so.4.20.0`): `HIGH_QUEUE_THRESHOLD = 0x1400000`
   (20.971.520, stopLoaderIfNeeded) và `LOW_QUEUE_THRESHOLD = 0x200000`
   (2.097.152, restartLoaderIfNeeded) — đóng mục mở B1 §7 ("strings không
   xác nhận được hằng compile-time").
4. **Đính chính summary-c1.txt:** `'stopping download': 6` thực ra là 6 dòng
   `"queue size under high watermark, not stopping download"` — **0 lần stop
   thật, 0 lần restart thật**. `restartLoaderIfNeeded` early-return
   `"download already active"` **1065–1089 lần/run**, không bao giờ tới
   check queue-size (`"queue size %zu (min …)"` = 0 dòng). Pause/resume
   dormant cả ở mức TRACE — mạnh hơn chứng minh DEBUG của B1.
5. **Số 2.097.152 trùng LOW threshold nhưng restart không bao giờ chạy**
   (0 restart trong 22 run: 4 TRACE + 18 nhẹ) nên **KHÔNG được kết luận LOW
   gây ra splice** — trùng số chưa giải thích được, vẫn mở.
6. **Không có seek nào tới đúng 2 MiB:** 20 base Range khác nhau trong 14 run
   D1 (gộp B1: 0 base = 2097152 trong 18 run nhẹ). Splice chỉ xuất hiện dưới
   dạng **độ lệch +2 MiB trong byte đã giao**, không bao giờ dưới dạng vị trí
   được yêu cầu.

---

## 1. Probe D1a — đối chứng (B1-identical, nhẹ): bogus 6/6

Probe `benchmarks/render/webkit_blob_flaky_102d1_websrc.mjs` (copy C1, thêm
env `D1_GST`/`D1_OUT` + mode D1; xem §6), port 8918, mode B1, 6 run c2 blobA
prod. GST_DEBUG = `qtdemux:5,webkitwebsrc:5,playbin:2,uridecodebin:2,decodebin:2`
(y hệt B1). Kết quả `benchmarks/results/webkit-blob-flaky-102d1a-control.json`,
log `hidden_files/round102-d1/d-websrc/gst/Lc2-b1-blobA-run{1..6}.log`.

| Run | playOk / failKind | Frames | Bogus first-atom | Ghi chú |
|-----|-------------------|--------|------------------|---------|
| D1a-run1 | false / error-event | 24 | 1× `0x204286c4` | qtdemux0, 14 ms sau activating pull |
| D1a-run2 | false / error-event | 30 | 1× | qtdemux0 |
| D1a-run3 | false / error-event | 3 | 1× | qtdemux0 |
| D1a-run4 | false / stall-timeout | 0 | 1× | qtdemux0, log chỉ 122 dòng, không hồi phục |
| D1a-run5 | false / error-event | 23 | 2× | qtdemux0 + qtdemux1 đều bogus |
| D1a-run6 | false / stall-timeout | 0 | 2× | qtdemux0 + qtdemux1 đều bogus |

- Chữ ký bogus (giống hệt B1): `gst_qtdemux_pull_atom: error: atom has bogus
  size 541230788`, atom type `&.c@`, first length `0x204286c4` =
  u32be của file tại offset 2.097.152 (`20 42 86 c4 26 83 63 40`).
- **playOk 0/6** — nhưng 2 ca stall-timeout (0 frame) nhiều khả năng do tải:
  loadavg lúc chạy **15,33–21,59** (các luồng đợt 102 chạy song song),
  memAvail 1413–2120 MB. B1 ở loadavg 1,59–3,37 vẫn 4/4 bogus nên tải cao
  KHÔNG phải điều kiện cần của bogus; tỉ lệ stall (2/6) thì có thể bị tải
  thổi phồng.
- 0 lần stop/restart thật (cả DEBUG quyết định đều 0). `"Skipping R"` bắn
  2 lần run1 + 1 lần run3 — guard requestNumber hoạt động ngoài đời.
- Range bases: 1069986, 2139845, 2139941, 323584, 4096, 561152, 1245184,
  389120, 1171456, 122880 — không có 2097152.

## 2. Probe D1b — typefind:5 + webkitwebsrc:5 (DEBUG-only): bogus 6/8

Cùng probe, mode D1 (case `Lc2-d1-blobA-run{j}`), GST_DEBUG =
`qtdemux:5,typefind:5,webkitwebsrc:5,playbin:2,uridecodebin:2,decodebin:2`
(B1 §8.1: bật typefind:5 nhưng KHÔNG TRACE để khỏi ức chế bogus).
Kết quả `benchmarks/results/webkit-blob-flaky-102d1b-typefind5.json`,
log `hidden_files/round102-d1/d-websrc/gst/Lc2-d1-blobA-run{1..8}.log`.

| Run | playOk / failKind | Frames | Bogus first-atom | Ghi chú |
|-----|-------------------|--------|------------------|---------|
| D1b-run1 | false / error-event | 9 | 1× | qtdemux0, 10 ms sau activating pull |
| D1b-run2 | false / stall-timeout | 0 | 2× | qtdemux0 + qtdemux1 |
| D1b-run3 | false / error-event | 17 | **0** | xem §2.1 — lỗi trex, không bogus |
| D1b-run4 | false / error-event | 25 | 1× | qtdemux0 |
| D1b-run5 | false / stall-timeout | 0 | **0 (không có qtdemux)** | xem §2.2 — stall trước khi tới demux |
| D1b-run6 | false / error-event | 15 | 2× | qtdemux0 + qtdemux1, instance mới — xem §2.3 |
| D1b-run7 | false / error-event | 4 | 1× | qtdemux0 |
| D1b-run8 | false / stall-timeout | 0 | 2× | qtdemux0 + qtdemux1 |

- Gộp nhẹ (B1 4/4 + D1a 6/6 + D1b 6/8): **16/18 run (88,9%)** có ≥1 bogus
  first-atom; tổng **17 bogus first-atom / 14 run D1** (D1a 8 + D1b 9).
- fail⇒bogus (chỉ tính run có dữ liệu qtdemux): error-event **8/9** (ngoại lệ
  duy nhất D1b-run3 trex); stall-timeout **4/4**. Con số gộp cập nhật:
  fail⇒bogus nay là 8/9 error-event, không còn 39/42 = 93% cũ (mẫu nhỏ hơn,
  định nghĩa hẹp hơn — chỉ tính first-atom bogus).
- 0 lần stop/restart thật trong cả 8 run. `"Skipping R"` bắn run2/run5/run6.
- Range bases: 2139845, 2139941, 933888, 2039808, 958464, 1011712, 1069986,
  167936, 1605632, 638976, 1814528, 1490944, 4096, 1032192 — không có 2097152
  (gần nhất 2039808 = 2 MiB − 57344, là seek sample-data thường).

### 2.1 D1b-run3 — đối chứng error-event KHÔNG bogus (trex)

qtdemux0 đọc đúng ftyp `0x20` → moov `0x0c3b` → rồi
`qtdemux_parse_trex: failed to find fragment defaults for stream 1`
@3,2217s, sau đó `Internal data stream error` @3,6243s. qtdemux1 lặp lại
đúng mẫu. Đây là failure mode đã biết từ W1 ("1 fail không có bogus") —
**error-event ≠ bogus**. Run3 chứng minh trong cùng một matrix, cùng một
logging, có run lỗi mà không splice — splice không phải là hệ quả tất yếu
của error-event.

### 2.2 D1b-run5 — stall trước khi tới demux (không dữ liệu, không tính)

Log chỉ 103 dòng, wall ~29,7 s; typefind stops ở 5,97s / 18,95s / 21,34s;
**0 lần `activating pull`, 0 qtdemux**. Pipeline kẹt ở phase typefind dưới
tải (loadavg run này 3,9 lúc bắt đầu, các luồng khác đẩy lên sau). Đây là
stall do tải, không phải bằng chứng về bogus — **không tính vào tỉ lệ**.

### 2.3 D1b-run6 — double-bogus qua instance src+typefind HOÀN TOÀN MỚI (quan trọng nhất)

- **Instance 1** (`webkitwebsrc0` + `typefindelement1` + `qtdemux0`): R1 full
  file → have_type 1,580s → stop_typefinding → pull mode → seek R2
  (2139941), R3 (2139845), R4 (1814528) → qtdemux0 activating pull 1,711s →
  first pull 1,797s: **bogus 541230788** → teardown 1,874s (typefind1 stop
  "we have no data", webkitwebsrc0 Reset ×2).
- **Instance 2** (`webkitwebsrc1` + `typefindelement2` + `qtdemux1` — MỚI
  TINH, R1 blob request mới, response 200 @1,893s): have_type 1,994s →
  stop 1,997s → pull mode 2,0025s → seek R2 (2139941), R3 (2139845), R4
  (seek về 0, response 200 @2,213s — **full file mới**) → qtdemux1
  activating pull 2,2989s → first pull 2,2992s (0,3 ms sau): **bogus
  541230788 LẠI** → teardown 2,307s.
- **Instance 3** (`http-src-1` + `typefindelement3` + `qtdemux2` — http thuần
  cùng file): qtdemux2 activating pull 2,8179s → ftyp `0x20`, moov `0x0c3b`,
  free, mdat `0x209ae2` — **đúng hoàn toàn**, parse tới sample 0/keyframe.

Kết luận từ run6: byte sai **không kẹt trong adapter của webkitwebsrc0**
(nó đã Reset ×2 rồi bị bỏ) **cũng không kẹt trong adapter của
typefindelement1** (element2 mới tinh vẫn bogus). Sau cả một lần re-request
full file mới (R4 response 200), pull đầu vẫn splice. Nguồn sai nằm ở
**luồng byte blob→qtdemux trước pull đầu** — tức blob loader (WebKit network
layer phục vụ blob: URL) hoặc trạng thái được tái tạo một cách xác định bởi
cùng chuỗi seek R1→R2→R3 — hai khả năng này **chưa phân biệt được** bằng log
mức :5 (xem §5).

### 2.4 Chuỗi event typefind:5 trong run bogus GIỐNG HỆT run sạch

So sánh D1b-run1 (bogus) với C1-run1 (sạch), cùng một khung:

```
start_typefinding → (segment/sticky events saved) → caps query → have_type
(probability=100) → stop_typefinding "pushing cached events and buffers"
→ loop "Pushing STREAM_START" → "find type in pull mode"
→ flush-start/flush-stop ×N (mỗi lần kèm UnLock/Reset/DoSeek/Range)
→ loop "Found caps" / "Emitting found caps"
→ qtdemux reset → "activating pull" → first pull (bogus | đúng)
```

Không có event nào thừa/thiếu, không có thứ tự nào đảo trong run bogus.
**typefind:5 không ghi nội dung/offset của buffer** nên không thể chỉ ra
buffer nào bị tráo — B1 §8.1 (dùng typefind:5 để phân biệt adapter-cache
vs proxy) **đã thử và không phân biệt được**. Điểm nối hẹp nhất còn lại là
nội dung byte — cần probe ghi nội dung buffer đầu tiên qtdemux nhận
(B1 §8.4, cần code đo mới, chưa làm).

## 3. Phân tích lại dữ liệu thô C1 — đính chính summary-c1.txt

Chạy lại `analyze-d1.py` trên 4 log C1 (`typefind:5 + webkitwebsrc:7` TRACE,
950–967 KB/run, 5422–5518 dòng/run, playOk 4/4, frames 127–155):

| Đếm lại (mỗi run) | run1 | run2 | run3 | run4 |
|-------------------|------|------|------|------|
| `0x204286c4` (bogus) | 0 | 0 | 0 | 0 |
| First atom lengths | 0x20, 0xc3b, 0x08, 0x209ae2 (đúng) | như run1 | như run1 | như run1 |
| Stop thật (`R%: stopping download`) | 0 | 0 | 0 | 0 |
| Restart thật (`: restarting download`) | 0 | 0 | 0 | 0 |
| `"download already active"` (restartLoader early-return) | 1071 | 1089 | 1065 | 1068 |
| `"queue size %zu (min …)"` (check LOW) | 0 | 0 | 0 | 0 |
| `"not stopping download"` | 6 | 6 | 5 | 6 |
| `"not restarting download"` | 0 | 0 | 0 | 0 |
| create L491 | 539 | 547 | 536 | 537 |
| dataReceived (R1..R6) | 2139973, 32, 128, 2111301, 1069987, 2070341 | 2139973, 32, 128, 2135877, 1069987, 2066245 | 2139973, 32, 128, 1069987, 2058053 | 2139973, 32, 128, 2127685, 1069987, 2008901 |
| `"Skipping R"` | 0 | 0 | 1 (R4, R5 đang chờ) | 0 |
| typefind key lines | 13 | 13 | 13 | 13 |

- **Đính chính:** summary-c1.txt ghi `'stopping download': 6` — đó là 6 dòng
  `"not stopping download"`; số lần stop thật là **0**. Tương tự
  `'high watermark': 6` là `"under high watermark"`. `'2097152': 8` là
  substring trong `"max 20971520"` và trong `"Buffer bounds set to
  2093056-2097152"` / `"2097152-2101248"` — **buffer bounds đi qua 2 MiB
  như một biên 4096 thường**, không có gì đặc biệt tại 2 MiB trong run sạch.
- `readPosition` trong create chỉ nhận giá trị ∈ {0} ∪ {Range bases} ∪
  {2139973} (vd run1: 0, 28672, 69632, 1069986, 2139845, 2139941, 2139973);
  `requestedPosition` = cùng tập trừ 2139973. Không bao giờ là 2097152.
- Buffer bounds: ~531–543 create/run, bước 4096 tuần tự từ 0 tới 2139973
  (khối cuối 2138112–2139973 = 1861 B), xen kẽ các slice Range
  (2139941–2139973, 2139845–2139973).
- Handoff sạch (run1, mốc giờ): typefind1 `have_type` 0,5331s →
  `stop_typefinding` 0,5332s → loop `find type in pull mode` 0,5339s →
  qtdemux0 `activating pull` 0,7391s → first atom đúng. Typefind có 3
  element/run (element0 = http pre-swap "no data", element1 = blob,
  element2 = http fallback @~10s).

## 4. Disassembly — CHỐT cả hai ngưỡng trong binary thật

File: `~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/lib/libwebkitgtk-6.0.so.4.20.0`
(bản C1 disasm tại `hidden_files/round101-c1/disasm-websrc.txt`, 249 dòng;
đối chiếu chuỗi `.rodata` bằng `objdump -s`).

| Hằng | Giá trị | Hàm (tên trong `.rodata`) | Dòng log trong binary |
|------|---------|---------------------------|----------------------|
| HIGH_QUEUE_THRESHOLD | `0x1400000` = 20.971.520 (20 MiB) | `stopLoaderIfNeeded` (`.rodata` 0x4c0dffb) | `push $0x1400000` + `cmp $0x1400000,%rax; jbe <under-high-watermark>`; format `"queue size %zu (max %d)."` (0x4c0e06f), log line 442 |
| LOW_QUEUE_THRESHOLD | `0x200000` = 2.097.152 (2 MiB) | `restartLoaderIfNeeded` (`.rodata` 0x4c0de82) | `push $0x200000` + `cmp $0x200000,%rax; jae <above-low-watermark>`; format `"queue size %zu (min %d)."` (0x4c0df60), log line 409 |

- Số dòng log trong binary khớp log runtime (442 = `stopLoaderIfNeeded`
  "queue size … (max 20971520)"; 391 = `"download already active"` —
  guard đứng TRƯỚC check ở line 409, nên 0 dòng `(min …)` trong 4 run C1
  là hệ quả trực tiếp của guard, không phải logging thiếu).
- Đây là lần đầu hai hằng được xác nhận bằng disassembly thay vì strings
  (đóng mục mở B1 §7 cuối). `.so` đã strip nên không có tên hàm trong
  symbol table — xác định hàm qua chuỗi tên hàm truyền vào `gst_debug_log`
  (arg `rcx`).

## 5. Kết luận: điểm nối là gì, bằng chứng nào, còn mở cái gì

**Điểm nối hẹp nhất hiện tại (sau D1): luồng byte giữa blob loader và pull
đầu của qtdemux — tức là phía DƯỚI typefind, trong chuỗi
blob-loader → webkitwebsrc adapter → typefind adapter/cache → qtdemux pull.
Không còn là "handoff typefind↔webkitwebsrc" ở mức event nữa: mức event đã
chứng minh là giống hệt nhau giữa bogus và sạch.**

Bằng chứng số:
- Bogus tái hiện 16/18 run nhẹ (88,9%), 17 first-atom bogus / 14 run D1;
  0/4 run TRACE nặng (Fisher p = 0,0029) → ức chế bởi logging là thật,
  không phải nhiễu mẫu.
- Splice luôn là **+2.097.152 đúng** (giá trị `0x204286c4` = file[2 MiB],
  verify byte trực tiếp từ B1 §2; K=0 trong mọi ca D1).
- Tái hiện qua instance src+typefind mới (run6 D1b) và sau re-request full
  file (R4 200) → không phải byte cũ kẹt trong một adapter cụ thể.
- Không tái hiện qua http thuần cùng file (qtdemux2 run6) → file đúng,
  đường http đúng; khác biệt nằm ở đường blob:.
- Không seek nào tới 2097152 (0/20 base D1; 0 trong 18 run nhẹ gộp).
- 0 stop/restart trong 22 run (4 TRACE + 18 nhẹ) → pause/resume bị bác
  lần thứ ba (code B1 + runtime DEBUG B1 + runtime TRACE C1/D1).
- `"Skipping R"` bắn ngoài đời (D1a 3×, D1b 3×, C1 1×) → guard
  requestNumber hoạt động; giả thuyết race dataReceived cũ (B1 §7.2) bị
  yếu đi nhưng chưa bị bác hoàn toàn (cửa sổ Reset→MakeRequest chưa đo
  trực tiếp).

**Còn mở (không bịa, không kết luận thay):**
1. Buffer nào, ở adapter nào, chứa file[2 MiB] lúc pull đầu — cần probe ghi
   nội dung byte của buffer đầu tiên qtdemux nhận (B1 §8.4). Đây là bước
   duy nhất còn lại để chốt điểm nối.
2. Vì sao đúng 2.097.152 — trùng LOW threshold nhưng restart không chạy;
   có thể là hằng 2 MiB khác trong đường blob loader (chunk/read size)
   hoặc cơ chế khác; chưa có bằng chứng nào phân biệt.
3. Blob loader vs webkitwebsrc adapter vs typefind adapter — ba giả thuyết
   con trong §2.3 chưa phân biệt được bằng log mức :5/:7.
4. D1b-run5 (stall không qtdemux) là nhiễu tải, không dùng cho tỉ lệ bogus.
5. Tải cao trong lúc đo (loadavg tới 26,16 do các luồng đợt 102 song song)
   có thể thổi phồng tỉ lệ stall-timeout (5/14 run D1) — nhưng không giải
   thích được bogus (B1 4/4 ở tải thấp).

## 6. Số đo & dữ liệu thô

- Probe D1 (mới): `benchmarks/render/webkit_blob_flaky_102d1_websrc.mjs`
  (copy C1 + env `D1_GST`/`D1_OUT` + mode D1 `Lc2-d1-blobA-run{j}`, port
  8918; `node --check` PASS). Launcher `run-102d1.mjs` + `watchdog.py`
  tại `hidden_files/round102-d1/` (working state, không stage).
- Kết quả JSON: `benchmarks/results/webkit-blob-flaky-102d1a-control.json`
  (D1a, 6 case), `benchmarks/results/webkit-blob-flaky-102d1b-typefind5.json`
  (D1b, 8 case).
- Log GST D1: `hidden_files/round102-d1/d-websrc/gst/Lc2-b1-blobA-run{1..6}.log`
  (D1a, 22–142 KB/run) + `Lc2-d1-blobA-run{1..8}.log` (D1b, 18–198 KB/run);
  matrix `matrix102d1a.log`, `matrix102d1b.log`; watchdog
  `watchdog-d1a.log`, `watchdog-d1b.log`.
- Script phân tích: `hidden_files/round102-d1/analyze-d1.py` (đếm lại +
  timeline; dùng cho cả log C1 và D1).
- Tham chiếu: probe C1 `benchmarks/render/webkit_blob_flaky_101c1_websrc.mjs`;
  log C1 `hidden_files/round101-c1/c-websrc/gst/`; disasm
  `hidden_files/round101-c1/disasm-websrc.txt`; B1 LIMITS
  `docs/PHASE9_ROUND100_B1_2MIB_JUNCTION_LIMITS.md`; LIMITS gộp đợt 101
  `docs/PHASE9_ROUND101_LIMITS.md` §1 C1 + §4 mục 1/3.

## 7. Ghi chú trung thực / giới hạn của luồng này

- Không sửa production. Không push. Không release/tag. Không đụng file của
  luồng khác.
- Mọi run D1 đều `playOk=false` (0/14) — nhưng đó là tỉ lệ fail của probe
  dưới tải cao + flaky blob, không phải tỉ lệ fail của sản phẩm; các run
  error-event vẫn phát 3–30 frame qua fallback http (trừ stall 0 frame).
- Fisher p = 0,0029 so sánh C1 (boot khác, tải thấp) với B1+D1 (2 boot,
  tải thấp→cao): yếu tố boot/tải không được khống chế hoàn toàn; nhưng B1
  (tải thấp, nhẹ) 4/4 vs C1 (tải thấp, nặng) 0/4 đã tách riêng yếu tố tải.
- Không chạy lại probe với `webkitwebsrc:7` để đối chứng ức chế (C1 đã có
  0/4; chạy lại chỉ tốn lượt mà không thêm thông tin).
- Không fetch `qtdemux.c` (B1 đã thử 404/403 — không lặp lại request thất bại).

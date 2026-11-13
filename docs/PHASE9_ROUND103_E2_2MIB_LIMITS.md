# LIMITS — E2 đợt 103: 2 MiB — probe nội dung byte của buffer đầu tiên qtdemux nhận

> Luồng E2, Phase 9 đợt 103 (VCut Studio). Nợ LIMITS gộp đợt 102 §4 mục 2
> (bước duy nhất còn lại của B1 §8.4: cần code đo mới để ghi nội dung byte
> của buffer đầu tiên qtdemux nhận).
> Đo: 13/11/2026 ~05:51–06:00Z (12:51–13:00 +07). Boot `9576eac3`
> (reboot #27 ~05:26:18Z, không reboot trong lúc đo). Repo local
> `~/workspace/repo-1`, branch main. **KHÔNG push, KHÔNG release/tag.**
> Chỉ stage, user tự push sau từ main chat.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B, md5 `4dfaad520330453d516e14f551580cdd`). **Cấm:** TTS 39,
> birefnet (RAM khả dụng ~1,2–1,5 GB lúc đo).

## Kết luận chính (TL;DR)

1. **ĐÃ CHỨNG MINH BẰNG NỘI DUNG BYTE: splice nằm trong adapter của
   `webkitwebsrc` trên đường PULL (phía TRÊN typefind), không phải trong
   typefind.** Mọi pull bị splice của qtdemux đều có một pull của typefind
   trả về byte Y HỆT tại cùng mili-giây (26/26 pull spliced trùng khớp) —
   typefind chỉ proxy trung thực cái nó nhận từ upstream. Điểm nối hẹp
   nhất nay là **adapter `webkitwebsrc` ở chế độ pull** (create() /
   take_buffer), không còn là "blob→qtdemux" chung chung nữa.
2. **Cấu trúc splice đã đo được chính xác tới từng byte (mới):** luồng
   byte qtdemux nhận là `[file 0..3179] ++ [file 2.097.152+3179 .. EOF]
   ++ [file 42.821..]` — MỘT đoạn sai duy nhất, dài đúng 39.642 byte,
   là ĐUÔI FILE từ 2 MiB+3179 tới EOF, chèn giữa byte đầu đúng và byte
   tiếp đúng. Điểm nối nằm TRONG buffer thứ hai của sample data, tại
   đúng biên EOF của file (offset 1155 trong buffer — xem §3).
3. **Splice là lệch +2 MiB thuần túy, không phải rác ngẫu nhiên:**
   2.640 mẫu byte đã phân loại (đầu + giữa + cuối buffer, 14 run):
   **0 mẫu OTHER** — mọi mẫu đều khớp đúng file tại offset yêu cầu,
   hoặc khớp đúng file tại offset+2 MiB. Không có byte nào lệch kiểu
   khác, không có splice một phần trong 64 byte đầu của bất kỳ buffer nào.
4. **Đường PUSH hoàn toàn sạch (mới):** 2.280 buffer webkitwebsrc→
   typefind→queue đã kiểm: 0 buffer có 16 byte đầu không thấy trong
   file; dãy offset tuần tự +4096, các cú nhảy đúng các Range đã yêu cầu
   (2139941, 2139845…). Byte ĐI VÀO webkitwebsrc luôn đúng — sai chỉ
   xuất hiện khi ĐỌC RA ở chế độ pull.
5. **Ức chế bởi logging TRACE được xác nhận lại trên cùng boot, cùng
   lượt, cùng probe+shim:** nhẹ (E2L+E2W) **10/10 run bogus** vs TRACE
   (E2T) **0/4 bogus**, Fisher một phía **p = 0,0010**. Gộp với D1/C1:
   nhẹ 26/28 vs TRACE 0/8, **p = 1,5e-06**. Bản thân shim byte-probe
   KHÔNG ức chế bogus (10/10 với shim, so với 16/18 của D1 không shim).
6. **Vì sao đúng 2.097.152 VẪN MỞ** (xem §6): 0 stop/restart thật trong
   cả 14 run E2 (4626 lần `"download already active"`); 0 seek/Range nào
   tới 2097152 (25 base Range khác nhau); đoạn sai bắt đầu đúng tại
   2 MiB+3179 nhưng chưa có bằng chứng nào nối con số này với LOW
   threshold ngoài sự trùng hợp. Cơ chế tạo ra đoạn sai trong adapter
   (dataReceived nào, refill nào) vẫn chưa quan sát trực tiếp được —
   cần TRACE dataReceived trong một run bogus, mà TRACE lại ức chế
   bogus (catch-22 đã biết từ D1).

---

## 1. Phương pháp đo mới — shim LD_PRELOAD `e2_pull_probe.c`

Chưa từng có code nào ghi nội dung buffer ở tầng này (B1 §8.4). Shim chặn
2 hàm public của `libgstreamer-1.0.so.0` bằng `LD_PRELOAD`, không sửa
production, không sửa GStreamer/WebKit, không cần header dev (mọi hàm
resolve qua `dlsym(RTLD_NEXT)`, mọi con trỏ Gst* là `void*`):

- `gst_pad_pull_range()`: qtdemux (pull mode) gọi trên sink pad của nó;
  typefind cũng gọi trên sink pad của nó để lấy byte từ webkitwebsrc.
  Ghi requested offset/size + 64 byte đầu của buffer trả về.
- `gst_pad_push()`: đường push (webkitwebsrc → typefind → qtdemux trong
  phase scan). Ghi 64 byte đầu + element đích (peer).
- v2 (cho ma trận E2W): thêm mẫu giữa (offset 4096 trong buffer) + mẫu
  cuối (64 byte cuối) cho buffer > 1024 byte — để xem vùng splice kéo
  dài bao xa trong buffer lớn.
- Ghi log tối thiểu: 1 `write()` / 1 dòng, cap 80 pull / 40 push mỗi tên
  element (mỗi process); chỉ log pull của pad có element cha là
  `qtdemux*`/`typefind*`, push của pad có element cha là
  `typefind*`/`webkitwebsrc*`.

Kiểm chứng shim trước khi đo thật (smoke test bằng gst-launch, không
browser):
- `filesrc ! typefind ! qtdemux`: 10 PULL của typefind, byte khớp file
  tại đúng offset yêu cầu (off=0 → `0000002066747970…`, off=32 →
  `00000c3b6d6f6f76…`, off=3163 → `0000000866726565…`).
- `playbin uri=file://…c2.mp4`: 160 PULL (80 qtdemux0 + 80 typefind);
  qtdemux0 pull đầu off=0 size=16 → `000000206674797069736f6d00000200`
  = file[0:16], đúng. Shim v2: buffer 38487 byte có đủ head/mid/tail.
- LD_PRELOAD tới được WebProcess của WebKit (biến môi trường đi qua
  Playwright launch env như GST_DEBUG_FILE đã đi qua ở các đợt trước) —
  dump file xuất hiện đầy đủ ở cả 14 run, không run nào mất dữ liệu.

Probe chạy: `benchmarks/render/webkit_blob_flaky_103e2_2mib.mjs` (copy
probe D1 + env `LD_PRELOAD`/`E2_DUMP_FILE` theo từng run, port 8921,
mode E2L/E2T/E2W). Phân tích: `hidden_files/round103-e2/analyze-e2.py`
(phân loại mỗi mẫu thành EXACT / SPLICED+2MiB / SPLICE@k / OTHER).

## 2. Kết quả đo — 14 run, 3 ma trận

| Ma trận | GST_DEBUG | Run | Bogus (≥1 first-atom) | playOk | Frames |
|---------|-----------|-----|----------------------|--------|--------|
| E2L (nhẹ) | qtdemux:5,typefind:5,webkitwebsrc:5 | 6 | **6/6** | 0/6 (3 error-event, 3 stall-timeout) | 0–127 |
| E2T (TRACE) | qtdemux:5,typefind:5,webkitwebsrc:7 | 4 | **0/4** | 4/4 | 26–61 |
| E2W (nhẹ + shim v2) | như E2L | 4 | **4/4** | 0/4 (3 error-event, 1 stall-timeout) | 0–91 |

- Tổng nhẹ: **10/10 run bogus, 16 bogus atom** (E2L 11 + E2W 5);
  TRACE: **0 bogus atom**. Fisher E2-only (cùng boot, cùng lượt, cùng
  probe+shim): **p = 1/C(14,10) = 0,0010**. Gộp D1+C1: nhẹ 26/28 vs
  TRACE 0/8, **p = 1,5e-06** (tính lại đúng: C(26,26)·C(10,2)/C(36,28)).
- Hai dạng bogus như các đợt trước: **atom-1** (pull đầu off=0 đã splice,
  qtdemux chết ngay) **8/10 run nhẹ**; **header-đúng** (header 0..3179
  đúng, chết ở pull sample data) **2/10** (E2L-run5, E2W-run3 — đúng mẫu
  B1-run3/K=3163).
- Phân loại head của pull (đầu 64 byte), gộp 14 run — **1.728 pull,
  0 OTHER**:

| Element | EXACT | SPLICED+2MiB | OTHER |
|---------|-------|--------------|-------|
| qtdemux0 (blob instance 1) | 340 | 13 | 0 |
| qtdemux1 (blob instance 2) | 53 | 13 | 0 |
| qtdemux2 (http fallback) | 487 | 0 | 0 |
| typefind (mọi instance) | 796 | 26 | 0 |

- Mẫu giữa/cuối (chỉ E2W, buffer > 1024 B): **912 mẫu, 900 EXACT,
  12 SPLICED+2MiB, 0 OTHER** (qtdemux2: 219+219 EXACT, 0 spliced).
- **26 pull spliced của typefind = đúng 26 pull spliced của
  qtdemux0+qtdemux1 (13+13)** — cùng mili-giây, byte giống hệt nhau.
  Đây là bằng chứng đếm được rằng typefind không tạo ra splice.
- qtdemux2 (http thuần cùng file): 487/487 pull EXACT, 0 spliced —
  file đúng, đường http đúng (khớp D1b-run6).
- E2T sạch tuyệt đối ở mức byte: 646 pull (qtdemux0 316 + qtdemux1 14 +
  typefind 316) EXACT, 0 spliced — baseline sạch cho đối chiếu.

## 3. Tái dựng luồng byte trong adapter (kết quả chính)

Ca rõ nhất: E2W-run2 qtdemux1 (lặp lại y hệt ở E2W-run3 qtdemux0,
E2L-run1/run5 qtdemux1 — cùng offset, cùng kích cỡ):

| Pull (qtdemux1) | Head (64B đầu) | Mid (@4096) | Tail (64B cuối) |
|-----------------|----------------|-------------|-----------------|
| off=0 size=16 | EXACT file[0:16] | — | — |
| off=0 size=32 | EXACT file[0:32] | — | — |
| off=32 size=16 | EXACT | — | — |
| off=32 size=3131 | EXACT | — | — |
| off=3163 size=16 | EXACT | — | — |
| off=3171 size=16 | EXACT | — | — |
| **off=3179 size=38487** | **SPLICED file[2100331:2100395]** | **SPLICED file[2104427:2104491]** | **SPLICED file[2138754:2138818]** |
| **off=41666 size=18490** | **SPLICED file[2138818:2138882]** | EXACT file[45762:45826] | EXACT file[60092:60156] |
| off=60156 size=13979 | EXACT (head/mid/tail) | | |
| off=74135… | EXACT (mọi pull sau) | | |

Đọc ra:
- Buffer off=3179 (38.487 B) splice TOÀN BỘ: head/mid/tail đều là
  file[2 MiB+3179 .. 2 MiB+41666) = file[2100331..2138818].
  2100331 + 38487 = 2138818 — khớp từng byte.
- Buffer off=41666 (18.490 B) splice MỘT PHẦN: head là file[2138818..],
  nhưng mid@4096 là file[45762..] (đúng) và tail là file[60092..]
  (đúng). Điểm nối nằm trong buffer này tại **buf offset 1155**:
  2139973 − 2138818 = 1155 — đúng bằng số byte còn lại của file từ
  2138818 tới EOF. Kiểm chứng: 41666 + 1155 = 42821;
  42821 + (4096 − 1155) = 45762 ✓; 42821 + (18426 − 1155) = 60092 ✓.
- Luồng byte adapter (FIFO) tái dựng được đầy đủ:
  `file[0..3179] ++ file[2100331..2139973] (39.642 B) ++ file[42821..]`
  — đoạn sai duy nhất dài 39.642 byte = 2139973 − 2100331, bắt đầu đúng
  tại 2 MiB+3179 và kết thúc đúng tại EOF; sau đó luồng tiếp tục đúng
  từ logical 42821 (= 3179 + 39642).
- Header (0..3179) đúng vì được phục vụ từ cache của typefind
  (stop_typefinding); hai pull sample data đầu (3179, 41666 — đúng
  2 sample đầu của mdat, 38487 + 18490 = 56977 B) đi qua adapter của
  webkitwebsrc và dính đoạn sai; từ pull 60156 trở đi đúng trở lại.
  Dạng atom-1 (8/10 run): cache của typefind đã bị flush bởi các seek
  sau stop_typefinding nên ngay cả pull header off=0 cũng đi qua
  adapter và dính file[2 MiB..2 MiB+16].

## 4. Đối chiếu timeline GST (E2W-run2, webkitwebsrc0 — instance của qtdemux0)

- 0,893s: R1 blob full file (bytes=0-, 200, 2.139.973 B).
- 0,994s: typefind have_type → stop R1 → Reset → DoSeek 2139941.
- 1,065s: R2 Range bytes=2139941- (206, 32 B); 1,116s: R3 Range
  bytes=2139845- (206, 128 B); 1,168s: create "Reached the end of the
  response, signalling EOS" (adapter rỗng).
- 1,169s: R5 Range bytes=1069986- (206, 1.069.987 B); 1,180s: R6 Range
  bytes=102400- (206, 2.037.573 B = file[102400..EOF]).
- 1,270s: create EOS lần nữa (webkitwebsrc0).
- 1,296s: qtdemux0 activating pull → 1,298s: bogus 541230788.
- webkitwebsrc1 (instance của qtdemux1): R1 full file 1,406s → R2/R3
  (2139941/2139845) → R4 (full file, start 1,602s).
- Đếm lại trên 14 log GST E2: **0 stop thật, 0 restart thật**,
  `"download already active"` 4.626 lần, `"not stopping download"` 24,
  `"queue size … (min …)"` 0. **0 Range/seek nào tới 2097152** (25 base
  Range khác nhau, gần nhất 1.998.848 và 2.101.248).

## 5. Cái gì đã bị loại trừ thêm (bằng byte, không phải bằng suy luận)

- **Typefind adapter/cache:** bị loại vai trò TẠO splice — pull của nó
  trả byte y hệt pull của qtdemux tại cùng ms (26/26). Nó chỉ proxy.
  (Lưu ý: header đúng là NHỜ cache typefind — cache vẫn là đường phục
  vụ header, nhưng nội dung cache là đúng.)
- **Đường PUSH / blob loader / Range:** 2.280 push đã kiểm đều đúng
  byte; Range đều được tôn trọng (206, đúng base, đúng Content-Range).
  Byte đi vào webkitwebsrc không sai — sai chỉ khi đọc ra ở pull mode.
- **Pause/resume (HIGH/LOW threshold):** 0 stop/restart trong 14 run E2
  (gộp D1: 0 trong 36 run) — lần thứ tư bị bác bằng runtime.
- **File/clip hỏng:** qtdemux2 http 487/487 EXACT; E2T 646/646 EXACT.

## 6. Còn mở (không bịa, không kết luận thay)

1. **Vì sao đúng 2.097.152:** đoạn sai bắt đầu đúng tại 2 MiB+3179
   (trùng LOW_QUEUE_THRESHOLD) nhưng restart không bao giờ chạy; chưa
   có bằng chứng nào nối con số này với LOW ngoài trùng hợp. Giả thuyết
   còn đứng: adapter chứa stream download mà scan đã tiêu thụ ~2 MiB
   đầu, logical position bị reset (seek về 0 / handoff sau
   stop_typefinding) mà adapter không được nạp lại từ 0 — nhưng chuỗi
   dataReceived cụ thể nào tạo ra đoạn sai thì CHƯA quan sát được.
2. **dataReceived / refill nào tạo đoạn sai:** log :5 không ghi
   dataReceived (0 dòng trong 14 log); TRACE ghi được thì lại ức chế
   bogus. Đây là catch-22 đã biết từ D1 — bước tiếp theo cần một cách
   ghi dataReceived mà không ức chế (vd: shim chặn `dataReceived` qua
   LD_PRELOAD như E2 đã chặn pull_range, hoặc GST_DEBUG chọn lọc hơn),
   nhưng đó là việc của đợt sau, không làm trong luồng này.
3. **Refill file[42821..] sau đoạn sai tới từ request nào:** R4 full
   file của webkitwebsrc1 (start 1,602s) là ứng viên, nhưng chưa đối
   chiếu được giờ (shim ms và GST time khác epoch; chỉ khớp được thứ tự
   tương đối).
4. **Khác biệt atom-1 (8/10) vs header-đúng (2/10):** cùng một adapter,
   instance đầu thường chết ngay pull 1, instance sau thường sống qua
   header — có thể do cache typefind của instance đầu đã bị flush bởi
   các seek sau stop_typefinding, nhưng chưa đếm được số seek/flush
   chính xác cho từng instance.
5. **Giới hạn của shim:** cap 80 pull / 40 push mỗi TÊN element (mỗi
   process) — các element typefind trùng tên (`typefind`, khác bin) bị
   gộp chung một cap; các pull sau cap 80 không được ghi (chỉ ảnh hưởng
   phần đuôi playback, không ảnh hưởng các pull đầu — là thứ cần đo).
   Shim chỉ ghi 64 byte/mẫu (đầu/giữa/cuối), không hash toàn bộ buffer.
6. Tải cao trong lúc đo (loadavg 9–11 do 8 luồng đợt 103 chạy song
   song) có thể thổi phồng tỉ lệ stall-timeout (E2L 3/6, E2W 1/4) —
   nhưng không giải thích được bogus (E2L 6/6, E2W 4/4 ở cùng tải đó;
   E2T 0/4 cũng ở tải đó).

## 7. Số đo & dữ liệu thô

- Shim đo mới: `benchmarks/render/e2_pull_probe.c` (v1: head 64 B;
  v2: + mid@4096 + tail 64 B); binary đã biên dịch
  `hidden_files/round103-e2/e2_pull_probe.so` (KHÔNG stage — binary).
- Probe: `benchmarks/render/webkit_blob_flaky_103e2_2mib.mjs` (mode
  E2L/E2T/E2W, port 8921); kết quả
  `benchmarks/results/webkit-blob-flaky-103e2-2mib.json` (14 case).
- Dump byte: `hidden_files/round103-e2/e-websrc/pull/*.pull.log`
  (14 file; 1.760 dòng PULL + 2.280 dòng PUSH); log GST
  `hidden_files/round103-e2/e-websrc/gst/*.log` (14 file, 5.701.335 B).
- Phân tích: `hidden_files/round103-e2/analyze-e2.py` →
  `e2-analysis.txt` (726 dòng) + `e2-bytes-<run>.txt` (14 file, toàn bộ
  pull của qtdemux0/1/2 + typefind kèm đối chiếu file/+2MiB).
- Launcher: `hidden_files/round103-e2/run-103e2.mjs` + `watchdog.py` +
  `start-e2{l,t,w}.sh` + `matrix103e2{l,t,w}.log` (working state,
  không stage).
- Tham chiếu: D1 `docs/PHASE9_ROUND102_D1_2MIB_LIMITS.md`; B1 §8.4
  `docs/PHASE9_ROUND100_B1_2MIB_JUNCTION_LIMITS.md`; LIMITS gộp đợt 102
  `docs/PHASE9_ROUND102_LIMITS.md` §4 mục 2.

## 8. Ghi chú trung thực / giới hạn của luồng này

- Không sửa production. Không push. Không release/tag. Không đụng file
  của luồng khác (E1–E8 chạy song song; chỉ dùng port 8921 + display
  Xvfb claim qua lock).
- Mọi run nhẹ đều `playOk=false` (0/10) — nhưng đó là tỉ lệ fail của
  probe flaky-blob dưới tải cao, không phải tỉ lệ fail của sản phẩm;
  các run error-event vẫn phát 31–127 frame qua fallback http.
- Kết luận "adapter 2 MiB ahead" (§3) là mô tả luồng byte đã đo, không
  phải chứng minh nhân quả về code nào tạo ra nó — xem §6 mục 1–2.
- Không chạy lại probe với `webkitwebsrc:7` để đối chứng ức chế (E2T
  đã có 0/4 trên cùng boot/lượt; chạy lại chỉ tốn lượt).
- Không fetch `qtdemux.c` (B1 đã thử 404/403 — không lặp lại).

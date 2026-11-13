# LIMITS — B1 đợt 100: 2 MiB — điểm nối chính xác

> Luồng B1, Phase 9 đợt 100 (VCut Studio). Nợ LIMITS gộp đợt 99 §4 mục 2.
> Đo: 12/11/2026 20:40–21:15Z (13/11 03:40–04:15 +07). Boot `66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd` (khác boot A1 `99338d31` — đã reboot, khớp reboot #23 dự kiến ~19:29Z 12/11).
> Repo local `~/workspace/repo-1`, branch main. **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright webkit-2388 (bundle build 2026-11-02), clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4` (2.139.973 B, sha256 `f13d9176…`), c8 (8.182.985 B, sha256 `f6ceff58…`).
> Layout box c2 (đã verify từ đĩa): `ftyp@0 (32) → moov@32 (3131) → free@3163 (8) → mdat@3171`; c8: `ftyp@0 (32) → moov@32 (9891) → free@9923 (8) → mdat@9931`.

## Kết luận chính (TL;DR)

1. **Điểm nối chính xác CHƯA chứng minh được** từ code + log hiện có. Nhưng đã thu hẹp rất mạnh và đính chính được hai giả thuyết cũ.
2. **Mô hình splice thống nhất (mới, có bằng chứng từ 8 log bogus):** luồng giao cho `qtdemux0` là file bytes với **đúng 2.097.152 byte bị cắt**; điểm cắt K ∈ {0, 32, 3163} — đều là **offset biên box trong head** (`ftyp@0`, `moov@32`, `free@3163`). Vị trí vật lý của stream nhảy +2 MiB **giữa hai pull liên tiếp trong ~40 byte đầu** của parse (hoặc trước pull đầu), rồi giữ nguyên lệch +2 MiB sau đó. Không có seek nào tới đúng 2097152.
3. **Giả thuyết pause/resume 2019 BỊ BÁC — hai lần:** (a) code hiện tại không còn `SMALL_MEDIA_RESOURCE_MAX_SIZE` (thay bằng `HIGH_QUEUE_THRESHOLD` 20 MiB / `LOW_QUEUE_THRESHOLD` 2 MiB — bất lực với c2 2,1 MB và c8 8,2 MB vì queue không bao giờ vượt 20 MiB); (b) **runtime: 0 dòng stop/restart trong cả 4 run bogus của probe B1** (xem §3).
4. **`webkitwebsrc.create()` bị loại trừ** vai trò người giao trực tiếp byte bogus tại thời điểm pull (4/4 log A1, đối chứng filesrc 10/10). **Range requests đều hợp lệ** (không có request nào với base = 2 MiB; loader blob trả 206 "Range request succeeded").
5. **Giá trị bogus mới:** `162705492` (0x09b2b054 = byte tại 2 MiB+3163 của c2 — offset box `free`), xuất hiện trong B1-run3 cùng với `2854668610` (= 2 MiB+32) ngay trong parse `moov`.
6. **Điểm nối hẹp nhất còn lại: handoff typefind ↔ webkitwebsrc** — hai adapter + proxy `pull_range`/`getrange` + cơ chế seek/flush. Cần thêm probe `typefind:5` / `webkitwebsrc:7` và source `qtdemux.c` để chốt (xem §7).

---

## 1. Probe B1 — bogus 4/4 dưới logging nhẹ

Probe `benchmarks/render/webkit_blob_flaky_100b1_websrc.mjs` (copy A1-99a1, đổi port 8904→**8916**, thư mục `round100-b1/b-websrc/`, mode `B1`: chỉ c2 blobA prod × 4 run). GST_DEBUG = `qtdemux:5,webkitwebsrc:5,playbin:2,uridecodebin:2,decodebin:2` — **cố tình KHÔNG bật `basesrc:5`** để không ức chế bogus; `webkitwebsrc:5` vẫn bắt được dòng DEBUG pause/resume ("restarting download" / "stopping download") mà không spam TRACE từng create.

Chạy 2026-11-12 ~21:06–21:08Z, launcher exit 0, display:193, watchdog 0 kill, loadavg 1,59–3,37, memAvail 2009–3539 MB.

| Run | Bogus | Giá trị | K (offset − 2 MiB) | Dạng | Frames | playOk / failKind |
|-----|-------|---------|--------------------|------|--------|-------------------|
| B1-run1 | 1 | 541230788 (0x204286c4) | 0 | atom-1 (pull đầu) | 44 | false / error-event |
| B1-run2 | 1 | 541230788 | 0 | atom-1 (pull đầu) | 61 | false / error-event |
| B1-run3 | 1 (+1 trong moov) | **162705492** (0x09b2b054) **MỚI**; trong moov: 2854668610 | 3163; 32 | tiến triển (xem §2) | 105 | false / error-event |
| B1-run4 | 1 | 541230788 | 0 | atom-1 (pull đầu) | 179 | false / error-event |

- Cả 4 run đều `playOk=false`, `failKind=error-event`, `playErr="The operation is not supported."` — nhưng đều có frames (44–179): sau khi `qtdemux0` lỗi, pipeline fallback sang http và chạy tiếp. Mẫu này giống A1-run2 (fail-có-bogus).
- GST log: 145.864 / 172.642 / 184.200 / 188.531 byte (tổng ~691 KB cho 4 run; A1 với `basesrc:5` ~27 MB cho 12 run). Logging nhẹ đã có tác dụng.
- **Tỉ lệ gộp sau B1:** A1 4/36 (dưới `basesrc:5`) + B1 **4/4** (dưới logging nhẹ) → **logging nặng ức chế bogus** (4/36 so với 4/4). Đây là bằng chứng định lượng thứ hai cho hiệu ứng ức chế (cùng với đính chính "ghi đĩa" của A1).
- Lưu ý dữ liệu: field `"round"` trong JSON kết quả còn ghi `"phase9-round99-a1-basesrc"` (copy artifact từ probe A1, không sửa dữ liệu đo; đường dẫn `gstDebugFile` + timestamp là đúng).

## 2. Mô hình splice: đúng 2.097.152 byte bị cắt, K là biên box

Gộp 8 log bogus (A1-run1/run5, Z1-run3/c8-run5, B1-run1..4), mọi giá trị bogus đều là u32 big-endian của file tại đúng `2 MiB + K`:

| Giá trị | Hex | Offset trong file | K | K là gì |
|---------|-----|-------------------|---|---------|
| 541230788 | 0x204286c4 | 2.097.152 (c2) | 0 | `ftyp@0` |
| 2854668610 | 0xaa26c942 | 2.097.184 (c2) | 32 | `moov@32` |
| **162705492** | 0x09b2b054 | 2.100.315 (c2) | **3163** | **`free@3163`** |
| 2991868683 | 0xb2544b0b | 2.097.152 (c8) | 0 | `ftyp@0` (c8) |

Đã verify trực tiếp bằng đọc file clip: c2 bytes tại 2 MiB+0..8 = `20 42 86 c4 26 83 63 40`; u32be tại 2 MiB+32 = 2854668610; u32be tại 2 MiB+3163 = 162705492 (atom type log `.G..` khớp).

**B1-run3 là ca rõ nhất về vị trí jump** (log `Lc2-b1-blobA-run3.log`):
- `ftyp` đọc **ĐÚNG** (length 0x20, brands isom/iso2/avc1/mp41) @0.811–0.812s.
- `moov` header đọc **ĐÚNG** (length 0x00000c3b = 3131) @0.8126s.
- `qtdemux_parse_moov` @0.8146s → parse_node ERROR: `Atom '.$..' has size of 2854668610 bytes, but we have only 3131 bytes available.` — child atom đầu tiên của moov (offset logic 40) mang size = file[2 MiB+32].
- Pull atom tiếp theo (offset logic 3163) bogus `162705492` = file[2 MiB+3163] @0.8149s.
- Tức: **physical position nhảy +2 MiB giữa pull moov-header (offset 32) và pull moov-body (offset 40)**, rồi giữ nguyên lệch +2 MiB sau đó. Trước jump, physical == logical; sau jump, physical == logical + 2 MiB.
- Các ca atom-1 (B1-run1/2/4, A1-run1/5): jump xảy ra **trước pull đầu**. Ca atom-2 (Z1-run3): jump giữa pull ftyp và pull moov-header. **Mô hình thống nhất: một lần nhảy +2 MiB duy nhất, tại một thời điểm thay đổi trong ~40 byte đầu của parse.**

**Không có seek nào tới đúng 2097152** trong cả 8 log. Segment starts quan sát được (distinct): 0, 4096, 40960, 90112, 225280, 262144, 385024, 385024→EOF, 802816, 1069986, 1167360, 1236992, **2101248 (= 2 MiB+4096 — peek của typefind helper, không phải seek target đặc biệt: nằm trên lưới 4096)**, 2139845, 2139941, 2139973 (EOF). 2 MiB chỉ được đọc tới như một read tuần tự trong segment, không phải seek target.

Thời gian: bogus extract chỉ ~1,6–1,8 ms sau `activating pull` (B1-run1: activation @2.3893s, bogus @2.3910s; A1-run5: 1,8 ms) — dữ liệu đã nằm sẵn trong bộ nhớ khi pull bắt đầu.

## 3. ĐÍNH CHÍNH A1 §3.1 + BÁC pause/resume 2019 (code + runtime)

### 3.1 Code hiện tại (WebKit main, fetch 2026-11-12 20:44 UTC)
`WebKitWebSourceGStreamer.cpp` (2366 dòng) — **`SMALL_MEDIA_RESOURCE_MAX_SIZE` KHÔNG còn tồn tại** (browser.find: 0 match). Thay bằng:
- `#define HIGH_QUEUE_THRESHOLD 20 * 1024 * 1024` (pause download) và `#define LOW_QUEUE_THRESHOLD 2 * 1024 * 1024` (resume download).
- `restartLoaderIfNeeded` (L714–776): resume chỉ khi `isDownloadSuspended && queue < LOW (2 MiB) && readPosition != 0 && != size`; `requestedPosition = readPosition` (L772); log DEBUG `"restarting download"` (L766).
- `stopLoaderIfNeeded` (L780–839, chạy trên main thread từ `dataReceived`): suspend chỉ khi seekable và `queue > HIGH (20 MiB)`; log DEBUG `"R%u: stopping download"` (L833).
- Vì c2 = 2.139.973 B và c8 = 8.182.985 B đều < 20 MiB, queue adapter không bao giờ vượt HIGH → `stopLoaderIfNeeded` **không bao giờ bắn** → pause/resume **bất lực** với cả hai clip trong code hiện tại.
- Binary strings trên `~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/lib/libwebkitgtk-6.0.so.4` xác nhận lineage code hiện tại: PRESENT — "queue size above low watermark, not restarting download", "restarting download", "download already active", "Reached the end of the response, signalling EOS", "doesHaveEOS: %s, isDownloadSuspended: %s", "Buffer bounds set to", "Range request: %s"; ABSENT — "Stopping resource loader" (chuỗi của code 2019). Caveat: strings chỉ chứng minh lineage, KHÔNG chứng minh giá trị số của threshold (hằng compile-time; cần disassembly mới xác nhận 20 MiB / 2 MiB).

### 3.2 Runtime: pause/resume 0 lần trong 4/4 run bogus (MỚI, probe B1)
| Đếm trong mỗi log B1 | run1 | run2 | run3 | run4 |
|---|---|---|---|---|
| `stopping download` | 0 | 0 | 0 | 0 |
| `restarting download` | 0 | 0 | 0 | 0 |
| `low watermark` / `high watermark` / `queue size` | 0 | 0 | 0 | 0 |

Cả hai dòng DEBUG quyết định (`restarting download` L766, `R%u: stopping download` L833) đều được bật ở `webkitwebsrc:5` — nếu cơ chế có bắn, log sẽ có. **Kết luận: pause/resume không hề chạy trong bất kỳ run bogus nào.** (Các dòng TRACE `queue size …` không được bật ở :5 — chỉ tính dòng DEBUG quyết định; đây là giới hạn đã biết, xem §8.)

Giả thuyết A1 "pause/resume quanh SMALL_MEDIA_RESOURCE_MAX_SIZE là nghi phạm" bị **BÁC** cả bằng code lẫn bằng runtime.

## 4. `webkitwebsrc.create()` — đã đọc toàn bộ, bị loại trừ vai trò giao trực tiếp

`webKitWebSrcCreate` (L842–1059), `GstPushSrc::create` — **KHÔNG nhận offset**; phục vụ FIFO từ `GstAdapter` nội bộ qua `gst_adapter_take_buffer(adapter, size)` (L1024, size = blocksize, mặc định 4096), rồi gán `GST_BUFFER_OFFSET = baseSrc->segment.position` (L1029) — **offset là metadata lấy từ segment, không phải vị trí thật của dữ liệu trong adapter**. `create()` gọi `restartLoaderIfNeeded` hai lần (L971 trước take, L1038 sau take).

- **4/4 log bogus A1: 0 create call** trong khoảng activation → bogus (kiểm chứng lại từ đợt 99, xem A1 LIMITS). Đối chứng gst-launch filesrc 10 runs: qtdemux0 pull đầu TIÊN luôn đi qua basesrc create offset 0, ftyp đúng 10/10, **0 bogus**.
- Kết luận: trong case browser, pull đầu của qtdemux0 KHÔNG chạm tới `webkitwebsrc.create()` — bytes đến từ buffer đã nằm sẵn phía dưới webkitwebsrc (handoff typefind→qtdemux) hoặc từ create lúc scan đã đẩy xuống trước đó. `create()` bị loại trừ vai trò "người giao trực tiếp byte bogus tại thời điểm pull", nhưng CHƯA loại trừ vai trò "nguồn tạo byte sai lúc scan" (log create chỉ ghi offset/length, không ghi nội dung byte).

**`webkitWebSrcReset` (L489–542): `gst_adapter_clear` (L495) là VÔ ĐIỀU KIỆN** (cả Hard lẫn Soft reset đều xóa adapter). Log B1 xác nhận Reset xảy ra trước mọi `DoSeek`. → Lý thuyết "adapter webkitwebsrc còn sót byte cũ sau seek" bị **yếu đi đáng kể**. Còn một cửa sổ race chưa loại trừ (xem §7 mục ii).

**`dataReceived` (L2141–2221):** `readPosition += length` (L2197 — frontier download, không phải vị trí tiêu thụ); `gst_adapter_push(adapter, buffer)` (L2214); `stopLoaderIfNeeded` (L2217). Guard `requestNumber` (L2159–2161): data của request cũ bị drop — nhưng `requestNumber` chỉ tăng trong `MakeRequest`/`restartLoaderIfNeeded`, nên data cũ lọt vào giữa Reset và MakeRequest vẫn pass guard (xem §7).

**`webKitWebSrcDoSeek` (L1376–1431):** chỉ đặt `requestedPosition = readPosition = segment->start` (L1425); KHÔNG tự clear adapter (clear nằm trong `Reset(Soft)` gọi từ `UnLockStop`).

## 5. Range requests — lần đầu nhìn thấy được (webkitwebsrc:5)

Mọi seek đều đúng trình tự (mẫu B1-run1, L26–34): `UnLock` → `"Resource request R1 will be stopped"` → `UnLockStop` → `Reset` → `DoSeek "Seek segment: (2139941-…) Position previous to seek: 2139973"` → `MakeRequest "Range request: bytes=2139941-"`. Loader blob trả **206 "Range request succeeded"**, `"Size: 2139973, isSeekable: true"` — **Range ĐƯỢC tôn trọng, không bị bỏ qua.**

Các base Range quan sát được (gộp 4 run B1): 0, 4096, 40960, 90112, 225280, 262144, 802816, 1069986, 1167360, 1236992, 2101248, 2139845, 2139941, 2139973. **Không có request nào với base = 2097152.**

Quan sát quan trọng (B1-run3): Range active cuối trước bogus là `bytes=262144-` (@0.7379s); bogus @0.8149s; **không có seek nào trong khoảng đó**. Trong cửa sổ bogus chỉ có đúng một dòng webkitwebsrc: `create()` `"Reached the end of the response, signalling EOS"` @0.8137s (adapter rỗng + `doesHaveEOS`) — tức bytes qtdemux0 đọc sau thời điểm đó **không đến từ một pull mới qua webkitwebsrc**; chúng đã nằm sẵn ở tầng dưới (typefind adapter / hàng đợi pull của qtdemux).

Pipeline browser chạy **PUSH mode, không phải PULL** — bình thường với network source: 0 lần "activating in mode 2" (pull) trong toàn bộ log A1-run1; webkitwebsrc chỉ "activating in mode 1" (push); lúc start size -1, `is seekable: 0`. gst-launch souphttpsrc cũng mode 1 (2 lần/run), mode 2 = 0. Scan được lái bằng ~170 seek FLUSH+ACCURATE/case + basesrc loop push từng buffer 4096 byte.

## 6. Typefind element (GStreamer 1.24.2) — điểm nối hẹp nhất còn lại

Đã đọc `gsttypefindelement.c` (2528 dòng):
- Pull-mode `getrange` (L1962–1981) là **proxy thuần** (`gst_pad_pull_range(typefind->sink, offset, length, buffer)`), **không có buffer store riêng**.
- Loop `MODE_TYPEFIND` dùng helper pull ranges; `MODE_NORMAL` pull 4k tuần tự từ `typefind->offset` rồi push xuống.
- **Chain-mode (push): mỗi buffer chain vào `GstAdapter` FIFO mà KHÔNG kiểm tra offset từng buffer** (chỉ `initial_offset` = offset buffer đầu tiên); `stop_typefinding` lấy TOÀN BỘ adapter làm MỘT buffer, gán `GST_BUFFER_OFFSET = initial_offset`, push xuống; FLUSH_STOP thì `gst_adapter_clear` (L1336).
- Đây là điểm nối mà buffer sai vị trí có thể bị nối sai một cách im lặng — nhưng **chưa chứng minh được ca nào**: chưa có log nào cho thấy buffer nào, offset nào đã đi qua typefind adapter trong run bogus.

decodebin nối demuxer vào `typefind:src` (log run1 @3.209s: `connect_pad: pad typefind:src, ... caps video/quicktime` cho qtdemux2). `multiqueue2` nằm sau demuxer, không liên quan input.

## 7. Nợ mở — còn thiếu bằng chứng gì

Điểm nối chính xác **CHƯA** chứng minh được. Ba giả thuyết còn lại, chưa phân biệt được:

1. **(Nghi phạm hẹp nhất) Typefind adapter chain-mode:** buffer push từ nhiều Range/seek trong phase scan được tích lũy rồi gộp thành một buffer với offset = `initial_offset` duy nhất; một buffer ở vị trí sai trong hàng đợi sẽ bị gán nhãn sai một cách im lặng. Cần probe `typefind:5` để xem pull bogus đi qua adapter cache của typefind hay proxy thẳng lên webkitwebsrc, và xem FLUSH_STOP có clear adapter đúng lúc không.
2. **Race dataReceived cũ trong webkitwebsrc:** một `dataReceived` của request cũ (main thread) lọt vào cửa sổ giữa `Reset` (adapter vừa xóa) và `MakeRequest` (requestNumber mới tăng) vẫn pass guard `requestNumber` và push byte cũ vào adapter. Cần probe `webkitwebsrc:7` (TRACE: queue size + `readPosition`/`requestedPosition` từng create + "downloaded N bytes" từng dataReceived) — nhẹ hơn `basesrc:5` nhiều, có thể không ức chế bogus.
3. **Blob loader cắt Range sai:** `PlatformMediaResource`/`BlobLoader` phía WebKit trả về slice sai cho một Range request. Cần đối chiếu Range request (đã có) với nội dung byte thực tế của response — hiện chưa có log nào ghi nội dung byte ở tầng này.

Các khoảng trống khác:
- Source `qtdemux.c` (`pull_atom`/`getrange` internals): fetch thất bại 2 lần 404 (monorepo `subprojects/gst-plugins-good/...` chỉ chứa file `.wrap`; split repo `GStreamer/gst-plugins-good/1.24.2` cũng 404) — **không fetch lại khi chưa sửa đúng input**. Chưa biết chính xác qtdemux gọi những `pull_range` nào (offset/size) trong 40 byte đầu.
- Fetch `gsttypefindelement.c` từ GitLab `gst-plugins-base` bị **403 — không lặp lại request này qua endpoint khác** (file đó vốn sai repo: typefind element nằm ở core `gstreamer`, đã lấy đúng từ GitHub raw monorepo).
- Probe souphttpsrc 6 runs thất bại (HTTP server local chết sớm, create trả error -5 sau ~0,5s) — không kết luận được gì về bogus với souphttpsrc; cần start server trong cùng lệnh với client hoặc dùng nohup + kiểm tra curl trước nếu chạy lại.
- Giá trị số của threshold HIGH 20 MiB / LOW 2 MiB là hằng compile-time — strings không xác nhận được; cần disassembly mới chốt.

## 8. Hướng tiếp theo (đề xuất, chưa làm)

1. Probe `typefind:5` (c2 blobA, ~4 run, nhẹ): xác định bogus pull đi qua adapter cache hay proxy; ghi lại FLUSH_STOP/clear của typefind adapter quanh thời điểm jump.
2. Probe `webkitwebsrc:7` (c2 blobA, ~4 run): queue size + readPosition/requestedPosition từng create; kiểm tra race §7 mục 2. Rủi ro: TRACE nặng hơn có thể ức chế bogus như `basesrc:5` — nếu 0/4 bogus thì đó tự nó cũng là dữ liệu (xác nhận ức chế theo mức log).
3. Lấy đúng source `qtdemux.c` 1.24.2 (tìm đúng repo/tag trước khi fetch): đọc `pull_atom` và các `pull_range` trong 40 byte đầu; đối chiếu offset/size từng pull với mô hình splice §2.
4. Nếu (1)–(3) vẫn không chốt: probe với `GST_DEBUG=typefind:5,webkitwebsrc:7` đồng thời + ghi nội dung byte của buffer đầu tiên qtdemux nhận (cần code đo, không sửa production).

## 9. Số đo & dữ liệu thô

- Probe B1: `benchmarks/render/webkit_blob_flaky_100b1_websrc.mjs`; kết quả `benchmarks/results/webkit-blob-flaky-100b1-websrc.json` (4 case `Lc2-b1-blobA-run1..4`).
- Log GST B1: `hidden_files/round100-b1/b-websrc/gst/Lc2-b1-blobA-run{1..4}.log` (145.864 / 172.642 / 184.200 / 188.531 byte); bundle `hidden_files/round100-b1/b-websrc/bundle/`; `matrix100b1.log`, `watchdog-b1.log`, `watchdog-b1.out`, `run-100b1.mjs`, `watchdog.py` cùng thư mục (goal workspace, không stage).
- Phân tích chi tiết: `hidden_files/round100-b1/summary-b1.txt`.
- Đối chứng gst-launch: `hidden_files/round100-b1/gst-launch/` (`run-gst.sh` filesrc 10 runs 0 bogus; `run-soup.sh` souphttpsrc 6 runs lỗi server; `gst-run{1..9}.log`, `soup-run{1..6}.log`).
- Tham chiếu: A1 LIMITS `docs/PHASE9_ROUND99_A1_BASESRC_LIMITS.md`; log A1 `hidden_files/round99-a1/`; log Z1 `hidden_files/round98-z1/a-basesrc/gst/`.
- Nguồn đã đọc: WebKit main `WebKitWebSourceGStreamer.cpp` (2366 dòng, fetch 2026-11-12 20:44 UTC; HIGH/LOW L99–110; Reset L489–542; restart/stop loader L714–839; create L842–1059; MakeRequest L1133–1314; DoSeek L1376–1431; dataReceived L2141–2221); GStreamer 1.24.2 `gsttypefindelement.c` (2528 dòng, fetch 20:49 UTC; getrange L1962–1981; chain L1670+; FLUSH_STOP clear L1336; stop_typefinding L1095–1218).

## 10. Ghi chú trung thực / giới hạn của lượt này

- Probe B1 không bật `basesrc:5` nên **không kiểm tra lại được** pattern "no create trong khoảng activation→bogus" trong log B1 (chỉ A1 có dữ liệu này).
- `webkitwebsrc:5` không bắt dòng TRACE queue-size — kết luận "pause/resume không bắn" dựa trên dòng DEBUG quyết định, là đủ (nếu có bắn, dòng DEBUG sẽ xuất hiện), nhưng không có số đo queue-size trực tiếp.
- Mọi claim về cơ chế splice (§2) là **mô hình suy ra từ giá trị byte + thời gian**, chưa phải chứng minh nhân quả: chưa quan sát trực tiếp buffer nào bị tráo ở đâu.
- Không sửa production. Không push. Không release/tag.

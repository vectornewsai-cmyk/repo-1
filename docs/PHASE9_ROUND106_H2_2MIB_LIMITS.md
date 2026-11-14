# PHASE9_ROUND106_H2_2MIB_LIMITS.md — H2: queue2 có trong pipeline WebKit không? (2 MiB)

> **Trạng thái: LATE MERGE — luồng H2 gốc chết trước khi viết LIMITS/batch.**
> Phân tích lại hoàn toàn từ dữ liệu thô trên đĩa, KHÔNG chạy probe live mới
> (theo brief late-merge). Ngày viết: 13/11/2026, boot hiện tại 14:50:59Z
> (reboot #33). Không sửa production code. Không push.
>
> **Kết luận headline: H2Q 3/3 run lỗi, KHÔNG đo được gì về queue2.
> H2EXT/H2C8 không chạy. Mitigation gắn đuôi `.mp4` CHƯA ĐO.**
> "0 chuỗi queue2 trong GST log" là hệ quả tầm thường của log rỗng (3 file
> 0 byte) — KHÔNG phải một kết quả âm về queue2.

## 1. Kết quả tóm tắt

| Hạng mục | Kết quả |
|---|---|
| H2Q (queue2 hiện diện, c2 blob-direct, 3 run) | **3/3 run LỖI** — `page.evaluate: Target page, context or browser has been closed` (14:48:06.506Z, 14:48:08.908Z, 14:48:11.148Z) |
| PULL / APUSH / ATAKE ghi được | **0 / 0 / 0** cả 3 run (so với run F2 thành công: 176 PULL / 146 APUSH / 1782 ATAKE) |
| GST log (queue2:5, queue:5, multiqueue:5, …) | **0 byte cả 3 file** — không một dòng log nào |
| Chuỗi `queue2` trong GST log | 0 — nhưng log rỗng nên con số này **vô nghĩa** (xem §4) |
| DOT dump (`dot/`) | **0 file** — pipeline chưa từng chạy tới mức dump |
| H2EXT (.mp4 vs noext) | **KHÔNG CHẠY** — không file log, không case JSON |
| H2C8 (c8 blob-direct, tìm offset splice) | **KHÔNG CHẠY** — không file log, không case JSON |
| Mitigation gắn đuôi `.mp4` cho blob URL | **CHƯA ĐO** — không có số nào |
| Bogus / splice +2 MiB đo được | **0** — không có pull nào để phân loại |

Đối chiếu headline H9 cứu được: **KHỚP** (3/3 run lỗi, 0 chuỗi `queue2`
trong GST log, H2EXT/H2C8 không chạy) — với một đính chính quan trọng:
H9 ghi "0 chuỗi queue2" nhưng không nhấn mạnh rằng GST log **rỗng hoàn
toàn**, nên "0" đó không phải bằng chứng âm về queue2 (xem §4).

## 2. Dữ liệu thô đã phân tích lại (đếm trực tiếp từ đĩa)

Thư mục gốc: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h2/`

| File | Kích thước / mtime (UTC) | Nội dung đếm lại |
|---|---|---|
| `h2-run.log` | 293 B, 14:47 | Ghi chú chạy: boot bắt đầu 14:31:52Z, MemAvailable lúc 14:47Z 2.820.740 kB, display riêng :196, port 8931, shim H2 v3, thứ tự H2Q → H2EXT → H2C8 |
| `h2q.log` | 1.159 B, 14:48 | 4 dòng `BUNDLE OK` + 1 dòng `ENV` + 1 dòng `CLIPS` + 3 dòng run lỗi + 1 dòng `DONE` |
| `pull/Lc2-h2Q-blobE-run{1,2,3}.pull.log` | 631 B mỗi file, 14:48 | **10 dòng `F2PROBE start` mỗi file, 0 dòng dữ liệu** (0 PULL/PUSH/APUSH/ATAKE/AMAP/ACLEAR/AFLUSH) |
| `gst/Lc2-h2Q-blobE-run{1,2,3}.log` | **0 B mỗi file**, 14:48 | Rỗng hoàn toàn |
| `bundle/media-pool-bundle*.js` | ~104 KB mỗi file, 14:47 | 4 bundle: base production 8 MiB + 3 probe-only (preload-none / reset-swap / fresh-element) |
| `dot/` | rỗng | Không có file DOT nào |
| `h2_adapter_probe.c` / `.so` | 24.244 B / 26.984 B, 14:45 | Probe shim H2 v3 (xem §5) |
| `analyze-h2.py` | 10.516 B, 14:45 | Bản sao `analyze-f2.py` v2 (docstring vẫn ghi "đợt 104, luồng F2") — **chưa từng được chạy** (không có file output phân tích nào trên đĩa) |
| `benchmarks/results/webkit-blob-flaky-106h2-2mib.json` | 1.380 B, 14:48 | Đúng 3 case, mỗi case chỉ có `runError` (xem §3); `env.uptimeS` 968,83, `loadavg` [1,52, 3,85, 2,41] |
| `benchmarks/render/webkit_blob_flaky_106h2_2mib.mjs` | — | Runner H2 (chứa cả 3 nhánh H2Q/H2EXT/H2C8); `node --check` PASS |

Chạy lại `analyze-h2.py` trên dữ liệu thô (offline, không probe mới):

```
== Lc2-h2Q-blobE-run1.pull.log: 10 dòng, clip 2139973 B ==
-- PULL: 0 --
   BOGUS RUN: NO (0 spliced pulls)
-- adapter webkitwebsrc (push từ libwebkitgtk): []
-- tất cả adapter: []
== ĐỐI CHIẾU PULL SPLICE ==
-- GST Lc2-h2Q-blobE-run1.log: bogus=0 already-active=0 stopping=0 restarting=0
```

"BOGUS RUN: NO" ở đây là **rỗng, không có ý nghĩa** — không có pull nào
để phân loại, không phải "run sạch". Tương tự, mọi counter GST = 0 vì
file log rỗng.

Grep `queue2` (không phân biệt hoa thường) trên toàn bộ thư mục
`round106-h2/`: chỉ trúng ở **code và ghi chú**, không trúng ở dữ liệu:

- `h2_adapter_probe.c`: 4 (2 dòng comment + 2 dòng code check parent)
- `h2_adapter_probe.so`: 1 (chuỗi `queue2` trong binary)
- `h2-run.log`: 2 (dòng kế hoạch "H2Q (queue2 hien dien)")
- `gst/*.log`, `pull/*.log`, `bundle/*.js`, `h2q.log`, `analyze-h2.py`: **0**

## 3. Vì sao 3/3 run lỗi — lỗi gì, ở bước nào

Trình tự trong runner (`webkit_blob_flaky_106h2_2mib.mjs`, nhánh H2Q):

1. **Build 4 bundle: OK.** Cả 4 dòng `BUNDLE OK` đều có trong `h2q.log`
   (base production 8 MiB + 3 probe-only). Bước này xong lúc ~14:47Z.
2. **ENV probe trên browser riêng: OK.** Browser không GST env vẫn chạy
   được: `userAgent` WebKit 27.2, `hardwareConcurrency` 4, `uptimeS`
   968,83, `loadavg` [1,52, 3,85, 2,41] đều ghi được vào JSON. Như vậy
   bản thân MiniBrowser/Playwright **không hỏng** — browser vẫn launch
   được ở đầu lượt.
3. **H2Q run1–3: chết ở `page.evaluate`.** Mỗi run launch một browser
   mới với `GST_DEBUG` + `LD_PRELOAD=h2_adapter_probe.so` + `F2_DUMP_FILE`
   riêng, rồi `page.evaluate` báo:
   `page.evaluate: Target page, context or browser has been closed`.
   Cả 3 run chết cùng một lỗi, cách nhau ~2,4 s/run (14:48:06 → 08 → 11).
   Không run nào tới được bước gắn listener media, chờ blob, hay `play()`.
   Không có sample, frame, `srcTrace`, hay `errEvents` nào.
4. **Bằng chứng then chốt — `WebKitWebProcess` vắng mặt.** Mỗi pull log
   H2 có đúng 10 dòng `F2PROBE start`: 7 dòng shell helper
   (dirname/bash/uname/readlink) + `WebKitNetworkProcess` + `MiniBrowser`.
   **Không có dòng `WebKitWebProcess` nào trong cả 3 run.**
   Đối chiếu run F2 thành công (`round104-f2/f-websrc/pull/Lc2-f2L-blobA-run1.pull.log`,
   401.161 B): 11 dòng `F2PROBE` gồm `WebKitWebProcess` (pid 23337) +
   `WebKitNetworkProcess` + `MiniBrowser`, tiếp theo 176 PULL, 200 PUSH,
   146 APUSH, 1782 ATAKE, 174 ACLEAR; GST log cùng run 204.435 B.
   Pipeline media chạy trong `WebKitWebProcess` — nó vắng mặt nghĩa là
   pipeline chưa từng tồn tại trong 3 run H2.
5. **Vì sao start-line còn mà event mất — hay: không có event nào để mất.**
   Probe ghi vào ring buffer 128 KiB trong bộ nhớ, chỉ flush khi đầy hoặc
   ở destructor (`f2_fini`). Mỗi pull log H2 chỉ 631 B — nhỏ hơn nhiều so
   với 128 KiB — nên 10 dòng start-line chỉ có thể xuất hiện trên đĩa
   nhờ **destructor đã chạy** ở `MiniBrowser`, `WebKitNetworkProcess` và
   các shell helper (chúng thoát bình thường). Với `WebKitWebProcess`
   có hai khả năng, **không phân biệt được từ dữ liệu trên đĩa**:
   (a) nó chưa từng spawn (browser chết trước khi tạo web process), hoặc
   (b) nó đã spawn rồi chết đột ngột (fatal signal / SIGKILL — destructor
   không chạy, output đệm mất theo). Cả hai đều cho kết quả quan sát
   giống hệt: 0 event GStreamer, 0 byte GST log, 0 file DOT.
6. **Nguyên nhân browser chết: KHÔNG XÁC ĐỊNH ĐƯỢC.** Không có crash
   log, core dump, hay log OOM nào trên đĩa liên quan tới 3 run này.
   RAM lúc bắt đầu còn 2.820.740 kB (đủ), load 1,52/3,85/2,41 — không
   có bằng chứng OOM. 8–10 luồng đợt 106 chạy song song có thể là yếu
   tố tải, nhưng đó chỉ là suy đoán, không có số đo gắn với 3 run này.
   **Không được ghi "do OOM" hay "do tải nặng" như kết luận.**
7. **Reboot #33 KHÔNG phải nguyên nhân H2 chết.** Run3 lỗi lúc
   14:48:11Z; reboot #33 lúc 14:50:59Z (boot hiện tại `uptime -s` =
   2026-11-13 14:50:59, khớp H9) — **sau H2 ~2'48"**. H2 chết trước
   reboot; reboot chỉ cắt việc viết LIMITS/batch của luồng H2 gốc
   (H9 cũng kết luận như vậy). Gap #32 (14:31:52Z) → #33 (14:50:59Z)
   = 19'07" — ngắn nhất từng ghi (H6/H9 đã xác minh).
8. **H2EXT/H2C8 không chạy — lý do không rõ từ đĩa.** Runner chứa cả
   hai nhánh, nhưng không có file log hay case JSON nào cho chúng. H2Q
   chỉ mất ~5 s cho 3 run lỗi (14:48:06–11), còn ~2'48" trước reboot
   mà H2EXT vẫn không khởi động — launcher có thể chỉ gọi riêng H2Q,
   hoặc dừng sau lỗi H2Q. Không có console output của launcher trên
   đĩa nên **không kết luận được** cơ chế dừng; chỉ ghi nhận là chưa chạy.

## 4. Kết luận trung thực về queue2

- **Không có bằng chứng nào, theo hướng nào, về queue2 trong pipeline.**
  Phép thử hiện diện trực tiếp (pull/push có `parent=queue2`) chưa từng
  chạy trên một pad thật nào — 0 PULL và 0 PUSH được ghi.
- "0 chuỗi queue2 trong GST log" (headline H9) **đúng về mặt đếm nhưng
  không có giá trị chứng cứ**: cả 3 GST log đều 0 byte, nên grep ra 0
  là tất yếu dù queue2 có hay không trong pipeline. Đừng trích con số
  này như một kết quả âm.
- Trạng thái 2 MiB sau H2 **không đổi so với G6 (đợt 105)**: hằng số duy
  nhất vẫn là `queue2.max-size-bytes = 2097152` (gst-inspect + giải mã
  binary, G6), nhưng **chưa có bằng chứng queue2 nằm trong chuỗi pull**
  webkitwebsrc → typefind → qtdemux. Queue2 vẫn chỉ là ứng viên, chưa
  phải nguyên nhân. H2 không làm hẹp hay mở rộng được gì thêm.
- Các số G6 vẫn đứng: blob-direct KHÔNG giảm bogus (2/3 vs 2/3, p=1,0);
  2097152 nằm giữa sample 187 của c2; typefind scan URI không extension
  40 lần đọc vs 1 lần với đuôi `.mp4` (offline).

## 5. Adapter probe đã làm được gì

- **Code probe đúng như thiết kế.** `diff` với `f2_adapter_probe.c`
  (đợt 104) chỉ ra đúng 2 đổi đã ghi trong header (26 dòng diff):
  (1) `gst_pad_pull_range` (dòng 551–552) và `gst_pad_push` (dòng 611)
  log thêm parent `webkitwebsrc` và `queue2`; (2) `PULL_CAP` 80→400,
  `PUSH_CAP` 40→400. Không có đổi nào khác.
- **Build OK.** `.c` 14:45:54 → `.so` 14:45:55 (1 s sau). Chuỗi `queue2`
  có trong binary `.so` (xác minh bằng `strings`).
- **Load thành công.** Constructor chạy trong `MiniBrowser`,
  `WebKitNetworkProcess` và shell helper ở cả 3 run (dòng `F2PROBE
  start` có trên đĩa) — `LD_PRELOAD` + `F2_DUMP_FILE` đã tới được
  browser. Việc probe "không ghi gì" không phải do probe hỏng hay
  chưa load, mà do pipeline chưa từng chạy (xem §3).
- **Chưa đo được gì.** 0 event adapter (APUSH/ATAKE/AMAP/ACLEAR/AFLUSH)
  nên không có refill nào để đối chiếu với pull splice; analyzer
  `analyze-h2.py` chạy lại cho kết quả rỗng (xem §2).

## 6. H2EXT / H2C8 / bundles — những gì chưa đo

- **H2EXT (mitigation `.mp4`): CHƯA ĐO.** Không có run EXT hay NOEXT
  nào. Đề xuất G6 "gán đuôi `.mp4` cho blob URL để scan typefind về
  1 lần đọc" vẫn chưa có số đo đối chứng. Đừng ghi mitigation này là
  "có hiệu quả" hay "vô hiệu" — chưa có dữ liệu.
- **H2C8 (c8 splice offset): CHƯA ĐO.** G6C8 0/2 sạch vẫn là số duy
  nhất; câu hỏi "offset cố định 2097152 hay đổi theo size" vẫn mở.
- **Bundles:** 4 bundle build OK (md5: base `ff78e3646083f3889bcd7b09de03906c`,
  preload-none `531d1a41fd7e98666aa4a55a52392df9`,
  reset-swap `27e066bfb6b9a4b1aac48786a717a53d`,
  fresh-element `5321ce8af993a546db3a05ace0f71ff8`).
  Chỉ base bundle (`media-pool-bundle.js`, variant blob-direct) được
  dùng trong 3 run lỗi; 3 bundle probe-only (preload-none đổi
  `el.preload` auto→none; reset-swap thêm removeAttribute+load trước
  khi gán blob; fresh-element drop element cũ, tạo element mới) **chưa
  từng chạy**. Diff từng variant với base đã kiểm lại đúng như mô tả
  trong runner (1 chỗ đổi mỗi variant, đúng needle trong `media.ts`).

## 7. Phương pháp và giới hạn (late merge)

- Chỉ phân tích lại dữ liệu thô đã có trên đĩa; **không chạy probe
  live mới**, không chạy lại browser, không sửa production code, không
  đụng file của luồng khác (preview.tsx, clicktest, probe106h3/h4 đều
  thuộc H5/H6/H3/H4 — không chạm).
- Kiểm chứng độc lập đã làm: đếm lại mọi file (kích thước, số dòng,
  số event theo loại); grep `queue2` toàn thư mục; chạy lại
  `analyze-h2.py` trên run1; đối chiếu pull log H2 với pull log F2
  thành công; `diff` probe `.c` với bản F2 gốc; `node --check` runner;
  đối chiếu JSON với `h2q.log` (3 case, khớp từng lỗi và timestamp).
- Giới hạn lớn nhất: **không có dữ liệu đo nào** — mọi kết luận về
  queue2, mitigation `.mp4`, và offset c8 đều là "chưa biết", không
  phải "đã bác" hay "đã xác nhận".
- `analyze-h2.py` là bản sao chưa đổi tên của `analyze-f2.py` v2, giữ
  nguyên trong `hidden_files/round106-h2/`; bản copy vào
  `benchmarks/render/analyze-h2.py` chỉ để stage cùng batch (nội dung
  giống hệt, không sửa).

## 8. Nợ mở cho đợt sau

1. **Chạy lại H2Q** (c2 blob-direct, GST queue2:5 + DOT + shim H2 v3)
   trên máy yên / ít luồng song song hơn — lần này browser chết trước
   khi pipeline chạy nên phép thử chưa từng diễn ra. Ghi thêm log
   launcher (stdout) để lần sau biết H2EXT/H2C8 có được gọi không.
2. **H2EXT (.mp4 vs noext)** — vẫn chưa đo; cần số bogus + số lần
   scan typefind trước caps cho cả hai biến thể.
3. **H2C8 (c8 offset)** — vẫn chưa đo; cần ≥1 run bogus trên c8 để
   xem offset có cố định 2097152 không.
4. **Chẩn đoán browser chết sớm**: nếu H2Q chạy lại vẫn chết ở
   `page.evaluate`, cần bắt log crash của WebKitWebProcess (kiểm tra
   coredump / journal của boot đó ngay sau khi chạy, trước reboot).
   Lưu ý phương pháp: probe ghi đệm 128 KiB, chỉ flush ở destructor —
   nếu WebProcess chết bằng fatal signal thì dữ liệu đệm mất; cân nhắc
   flush ngay với event quan trọng hoặc ghi start-line bằng write trực
   tiếp ở lần chạy chẩn đoán sau (đánh đổi: có thể ức chế bogus như
   TRACE đã từng làm — ghi rõ trade-off này trong LIMITS lần sau).
5. Queue2 vẫn là ứng viên chưa chứng minh (G6) — sau khi có pull log
   thật, kiểm tra (a) DOT có element queue2, (b) GST log có dòng
   queue2, (c) pull log có `PULL elem=queue2`.
6. Nợ đứng yên từ đợt 105 (xem LIMITS gộp đợt 105 §4): G1 chờ user
   quyết metric G5/M2, A/B RAM cao, zombie gate (b), blur A/B-band,
   EPERM probe #26 + mù #22 quyết mức, birefnet 0 lần, TTS 39 CẤM
   kiểm lại, ci-security.yml 403, release gate.

## 9. Batch stage (KHÔNG push)

`phase9-round106-h2-2mib.txt` (5 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/h2_adapter_probe.c` (copy từ `hidden_files/round106-h2/`, text)
- `benchmarks/render/webkit_blob_flaky_106h2_2mib.mjs` (runner H2, đã có trong repo từ lúc chạy 14:47Z)
- `benchmarks/render/analyze-h2.py` (copy từ `hidden_files/round106-h2/`, text, không sửa)
- `benchmarks/results/webkit-blob-flaky-106h2-2mib.json` (kết quả 3 run lỗi, đã có trong repo từ 14:48Z)
- `docs/PHASE9_ROUND106_H2_2MIB_LIMITS.md` (file này)

Không stage binary (`.so` ở lại `hidden_files/round106-h2/`). Không
stage log nhị phân (không có). HEAD vẫn a7308ee9 (sau PUSH #5).
KHÔNG push.

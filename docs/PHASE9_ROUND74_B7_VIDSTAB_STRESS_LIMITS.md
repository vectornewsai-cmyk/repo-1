# LIMITS — Phase 9 đợt 74 B7: Stress SEGFAULT vidstab dưới handler mới + khảo sát AVFILTERPAD_FLAG_NEEDS_WRITABLE

Luồng B7 — đóng nợ đợt 73 §4 mục 4 (SEGFAULT vidstab: chờ crash tiếp
theo dưới handler mới của A2 để trả lời plane/offset/dest-vs-length;
nợ dài hạn AVFILTERPAD_FLAG_NEEDS_WRITABLE).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round74-b7.md`.
Harness: `server/render/src/test_round74_b7_vidstab_stress.js`
(WORK `~/workspace/.scratch-r74b7/runs/`, `results.jsonl` +
`summary.json` + stderr từng lần chạy).
Môi trường: ffmpeg 8.1.2 (Ubuntu 7:8.1.2-2ubuntu2+hatch3, build với
`--enable-libvidstab --enable-libx264`), libvidstab 1.1.0,
libavfilter.so.11, VM 8 GB, không GPU, gcc 13.3. Ngày: 09/11/2026
(lượt cron 18:35 +07).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Crash dưới handler mới | **🎯 BẮT ĐƯỢC (n=3: A-r5, A-r9, D-r2).** Stack trùng 8/8 offset với Z6/A2 ở cả 3 mẫu; lần đầu có regs + si_code + offsets + maps |
| Plane / offset / length | **Plane Y (plane 0), offset fault−dest = +2.073.472 = n−128 Ở CẢ 3 MẪU, length RDX = 2.073.600 = 1920×1080 ĐÚNG Ở CẢ 3 MẪU.** Xem §2 |
| Dest-vs-length | **Length không sai. Chữ ký bất biến qua 3 mẫu ủng hộ mạnh giả thuyết (a): chunk đích đã bị munmap toàn bộ trước khi copy (use-after-free của `td->src`) — fault luôn ở store ĐẦU TIÊN của vòng lặp (n−128 ở vòng ngược), không phải giữa chừng.** Xem §2.3 |
| Stress | **45 lần NOCOPY, 3 crash (6,7%, Wilson 95% [2,3%, 17,9%])**: A 1080p t1 2/20, B 720p t1 0/10, C 360p t1 0/10, D 1080p t4 1/5. Gộp với A2 dưới preload: 4/105 = 3,8% [1,5%, 9,4%]. Xem §1 |
| AVFILTERPAD_FLAG_NEEDS_WRITABLE | **Khảo sát xong, KHÔNG build.** Flag có thật trong 8.1.2 (filters.h:59), là pattern chuẩn của ~20 filter in-place khác, nhưng cơ chế của nó (`ff_inlink_make_frame_writable` trả về ngay khi frame đã writable theo refcount) **không chạm được cửa sổ race đã gây ra 3 crash này** (cả ba đều đi đường direct vì `av_frame_is_writable` đã true) — nên flag chỉ là ứng viên, KHÔNG PHẢI fix gốc rễ đã chứng minh. Build tối thiểu khả thi (tarball upstream + 3 gói apt), nhưng chưa làm vì lý do trên + quyết định triển khai thuộc về đợt sau. Xem §3 |
| Sửa production | **KHÔNG.** `copy` trước vidstabtransform giữ nguyên |
| Handler mới của A2 | **Đã kiểm chứng trên crash thật lần đầu (n=3):** regs/maps/si_code/offsets in đầy đủ, đúng định dạng, giống hệt nhau về chữ ký ở cả 3 mẫu; không làm sai lệch hành vi chết SIGSEGV |

## 1. Stress hunt — thiết kế và kết quả

Thiết kế (khác Z6/A2: KHÔNG dừng ở crash đầu, để thu nhiều mẫu):

| Arm | Cấu hình | N | Crash | Sha không crash |
|---|---|---|---|---|
| A1080t1 | Clip gốc shakynoisy1080.mp4 5s 1920×1080 + .trf X8, NOCOPY, -threads 1 | 20 | **2 (r5, r9)** | d960996868d3 ×15, e033837a5319 ×1, 4e10499a0a75 ×1, 62a3fafe6de7 ×1 |
| B720t1 | Clip downscale 1280×720 từ clip gốc + .trf riêng (vidstabdetect), NOCOPY, -threads 1 | 10 | 0 | 10 sha KHÁC NHAU (mỗi lần một sha) |
| C360t1 | Clip downscale 640×360 từ clip gốc + .trf riêng, NOCOPY, -threads 1 | 10 | 0 | 10 sha, 9 khác nhau (1 trùng) |
| D1080t4 | Clip gốc + .trf X8, NOCOPY, -threads 4 (khám phá: frame threading) | 5 | **1 (r2)** | 4 sha khác nhau |
| **Tổng** | | **45** | **3 (6,7%)** | |

Smoke trước hunt: COPY ×1 dưới preload mới → sha framemd5
`d960996868d3…` khớp ground truth Y6/X8 (preload không đổi output).
Clip 720p sha `7932722f02fe…`, clip 360p sha `7d0ea8efd5c8…`
(downscale libx264 veryfast từ clip gốc).

### 1.1 Tỉ lệ và xác suất (trung thực — số dưới preload là arm riêng)

| Số liệu | Giá trị | Wilson 95% |
|---|---|---|
| Arm A (1080p, t1) | 2/20 = 10,0% | [2,8%, 30,1%] |
| Arm D (1080p, t4) | 1/5 = 20,0% | [3,6%, 62,4%] — quá rộng, không claim D dễ crash hơn A |
| B+C (720p+360p, t1) | 0/20 = 0% | [0%, 16,1%] — không claim "kích thước nhỏ thì không crash" |
| **B7 tổng** | **3/45 = 6,7%** | **[2,3%, 17,9%]** |
| Gộp preload A2+B7 (cùng cấu hình arm A, khác lượt) | 4/105 = 3,8% | [1,5%, 9,4%] |
| Native Y6 (để đối chiếu, KHÔNG gộp) | 3/30 = 10,0% | [3,5%, 25,6%] |

- **Crash hiếm tới mức nào:** dưới preload, khoảng **1 lần / 15–25 lần
  chạy** (điểm ước lượng gộp 3,8%); khoảng tin cậy rộng vì n nhỏ.
  Với p = 3,8%: P(bắt ≥1 crash trong 30 lần nữa) ≈ 69%; cần ~78 lần
  nữa để có 95% chắc chắn bắt được thêm ≥1 crash. Con số này chỉ để
  lập kế hoạch hunt sau — không phải tỉ lệ crash của production
  (production có `copy`, 0 crash trên 78+60 lần đo trước đây).
- **Threads=4 không tránh được crash:** mẫu D-r2 có chữ ký giống hệt
  2 mẫu arm A (§2) — frame threading vẫn đi đúng đường lỗi đó. n=5
  quá nhỏ để so sánh tỉ lệ D với A.
- **Kích thước nhỏ không crash nhưng spread 100%:** ở B và C, MỌI lần
  chạy đều cho sha khác nhau (B 10/10 khác nhau, C 9/10 khác nhau) —
  output pixel không xác định giữa các lần chạy cùng clip + cùng .trf
  (race M1 làm lệch pixel, không chỉ gây crash). Ở arm A chỉ 3/18 lần
  không crash bị lệch sha. Đây là bằng chứng phụ rằng race sống mạnh
  ở mọi kích thước, chỉ biểu hiện crash là hiếm và tập trung ở 1080p
  trong đợt này (0/20 ở kích thước nhỏ vẫn tương thích với p ≈ 4%:
  P(0/20 | p=4%) ≈ 44% — không có gì lạ).
- **N kế hoạch ban đầu bị cắt:** A 40→25→20, B/C 20→15→10, D 15→5
  (xem §1.2) — số cuối vẫn đủ để trả lời plane/offset (3 mẫu regs)
  và ước lượng tỉ lệ gộp, nhưng khoảng tin cậy từng arm vẫn rộng.

### 1.2 Ghi chú vận hành (trung thực — hunt bị kill/restart 3 lần)

- Lượt đầu chạy với ngưỡng chờ yên load1 ≤ 5 quá chậm (mỗi lần 1080p
  ~37 s chạy + tới 60 s chờ); đã kill sau A-r2, vá harness (ngưỡng
  chờ yên qua env `B7_LOAD_LIMIT`, mặc định 8; khôi phục từ
  `results.jsonl` — bỏ qua các lần đã chạy) và chạy lại, không mất số
  liệu (smoke + A-r1 + A-r2 giữ nguyên).
- Lần 2: giảm trần chờ từ 10×30 s xuống 3×30 s (env `B7_WAIT_MAX`,
  mặc định 3) vì load các luồng đợt 74 khác thường xuyên > 8 (có lúc
  14–19); kill sau A-r6.
- Lần 3: cắt N (A 40→25, B/C 20→15, D 15→10) vì tốc độ ~2–2,5
  phút/lần 1080p dưới load cao sẽ vượt timeout lượt; kill sau A-r9
  (đã có 2 crash).
- Lần 4: process hunt chết lặng giữa chừng khi đang chờ r17 (không
  còn process, không có summary.json, không có dòng lỗi — nguyên nhân
  chưa rõ, có thể runtime dọn session nền); khởi động lại từ file log
  (redirect `>` thay vì `tee`), khôi phục đúng từ results.jsonl
  (16 lần A đã có), chạy nốt tới hết. Cắt N lần nữa (A→20, B/C→10,
  D→5) để vừa timeout lượt.
- Tổng cộng hunt chạy 4 phiên, 45 lần NOCOPY hoàn tất + 1 smoke COPY,
  **không mất số liệu nào** nhờ khôi phục từ results.jsonl (đã kiểm
  chứng qua 3 lần restart).
- Lỗi log nhỏ đã sửa sau khi hunt xong (không ảnh hưởng số liệu):
  `waitForQuiet` in dòng cảnh báo "vẫn load1=…" ngay cả khi lần đọc
  cuối đã ≤ ngưỡng (vd load1=6,04 vẫn in cảnh báo) — đã sửa thành chỉ
  in cảnh báo khi load thật sự còn > ngưỡng.

## 2. Phân tích mẫu crash — trả lời plane/offset/dest-vs-length (n=3)

**Ba mẫu crash có regs** (A-r5, A-r9, D-r2) có chữ ký **giống hệt
nhau** ở mọi giá trị phân biệt được:

| Giá trị | A-r5 | A-r9 | D-r2 (threads=4) |
|---|---|---|---|
| Stack (8/8 offset) | trùng Z6/A2 | trùng Z6/A2 | trùng Z6/A2 |
| RIP (lệnh lỗi) | libc+0x1a1906 | libc+0x1a1906 | libc+0x1a1906 |
| RDX (length) | 0x1fa400 = 2.073.600 | 0x1fa400 = 2.073.600 | 0x1fa400 = 2.073.600 |
| fault−RDI | +2.073.472 = n−128 | +2.073.472 = n−128 | +2.073.472 = n−128 |
| si_code / maps | MAPERR / NOT in any mapping | MAPERR / NOT in any mapping | MAPERR / NOT in any mapping |
| RDI > RSI (vòng ngược) | có | có | có |

File gốc: `~/workspace/.scratch-r74b7/runs/A1080t1/r5.stderr`,
`.../A1080t1/r9.stderr`, `.../D1080t4/r2.stderr` (mỗi file 6 dòng
`[segv_backtrace]`). Chi tiết đầy đủ của mẫu r5 dưới đây; r9 và D-r2
chỉ khác địa chỉ tuyệt đối (ASLR) và fault−RSI.
Stack (trùng 8/8 offset với Z6/A2 — chỉ khác libc: `+0x1a1906` thay vì
`+0x1a1862`, xem §2.1):

```
[segv_backtrace] caught signal 11 (Segmentation fault), fault addr=0x780d082113c0
[segv_backtrace] maps: fault addr 0x780d082113c0 NOT in any mapping (unmapped)
segv_backtrace_preload.so(+0x1466)
libc.so.6(+0x45330)                          ← signal trampoline
libc.so.6(+0x1a1906)                         ← LỆNH LỖI (vòng lặp NGƯỢC của memcpy, xem §2.1)
libvidstab.so.1.1(vsFrameCopy+0x38)          ← fast path vsFrameCopyPlane (A2 §2.2)
libvidstab.so.1.1(vsTransformPrepare+0x116)  ← transform.c:150, nhánh in-place
libavfilter.so.11(+0x417eb6)                 ← vidstabtransform filter_frame
libavfilter.so.11(+0x1853b0)
libavfilter.so.11(av_buffersrc_add_frame_flags+0x168)
ffmpeg(+0x25c93)
ffmpeg(+0x39cfd)
libc.so.6(+0x9cb84)
libc.so.6(+0x129ecc)
[segv_backtrace] regs: RIP=0x780d15664906 RDI=0x780d08017040 RSI=0x780d004fc200 RDX=0x1fa400 RSP=0x780d09812c38 RBP=0x780d09812c60
[segv_backtrace] fault addr=0x780d082113c0 khac RDI/RSI (xem offset duoi), si_code=1 (MAPERR (dia chi khong mapped))
[segv_backtrace] offsets: fault-RDI=+2073472 (0x1fa380) fault-RSI=+131158464 (0x7d151c0)
```

### 2.1 Lệnh lỗi: libc+0x1a1906 — vòng lặp NGƯỢC của memcpy ERMS

Disassembly `/lib/x86_64-linux-gnu/libc.so.6` (đối chiếu trực tiếp,
không suy đoán):

```
1a18c3: lea -0x101(%rdi,%rdx,1),%rcx   ; rcx = dest + n - 0x101
1a18dd: and $0xffffffffffffffc0,%rcx    ; rcx &= ~63 (căn 64)
1a18e4: vmovdqu64 0xc0(%rsi),%zmm17     ; load 64B từ nguồn (đầu thấp)
...
1a1906: vmovdqa64 %zmm17,0xc0(%rcx)     ; ← LỆNH LỖI: store 64B vào đích
1a190d: vmovdqa64 %zmm18,0x80(%rcx)
1a1914: vmovdqa64 %zmm19,0x40(%rcx)
1a191b: vmovdqa64 %zmm20,(%rcx)
1a1921: add $-0x100,%rcx               ; rcx -= 256, lặp khi rcx > rdi
```

- Đây là vòng lặp **ngược** của `__memcpy_avx_unaligned_erms` (dùng khi
  dest > src, để xử lý overlap): copy từ cuối vùng về đầu. Hai crash
  Z6/A2 (`+0x1a1862`) nằm ở vòng lặp **xuôi** (dest < src); lần này
  dest > src nên đi vòng ngược. Cùng một hàm memcpy, cùng fast path
  `vsFrameCopy` — hướng vòng lặp chỉ phản ánh thứ tự địa chỉ src/dest
  của lần chạy đó (ASLR + layout heap), không phải đường code khác.
- Store đầu tiên của vòng lặp: `0xc0(%rcx)` với rcx ban đầu =
  (dest+n−0x101) & ~63 = dest+n−0x140 → store tại
  dest+n−0x140+0xc0 = **dest+n−0x80 = dest+n−128** — khớp chính xác
  fault−RDI = +2.073.472 = n−128. **Crash xảy ra ngay ở store đầu tiên
  của vòng lặp ngược** — chưa byte nào của plane này được ghi bởi lần
  memcpy này.
- Fault addr chia hết cho 64 (0x13c0 = 64×79) — đúng yêu cầu alignment
  của `vmovdqa64`; lỗi thật là trang unmapped (si_code=MAPERR), không
  phải misalignment.

### 2.2 Plane: Y (plane 0) — chắc chắn

- **RDX = 0x1fa400 = 2.073.600 = 1920×1080** — đúng bằng
  `linesize × h` của plane Y 1080p yuv420p. Plane U/V chỉ có
  960×540 = 518.400 byte (0x7E900), không khớp.
- `vsFrameCopy` copy các plane theo thứ tự 0,1,2; Y là plane đầu tiên
  nên crash ở plane đầu của lần copy này (không có plane nào được copy
  trước trong cùng lần gọi).
- Điều kiện: kết luận dựa trên stack `vsFrameCopy+0x38` = fast path
  tail-call (A2 §2.2) — một memcpy khối duy nhất `linesize×h` — và
  RDX khớp đúng kích thước Y. Đây là đáp án cho câu hỏi "plane nào"
  mà A2 để ngỏ.

### 2.3 Offset và dest-vs-length

- **Offset fault trong copy: +2.073.472 = n−128** (128 byte trước cuối
  vùng đích Y). Nhưng đây là store ĐẦU TIÊN của vòng lặp ngược (§2.1),
  nên "offset n−128" không có nghĩa là "copy đã ghi thành công 2.073.472
  byte rồi mới fault" — ngược lại: copy chưa ghi được byte nào, và
  trang chứa dest+n−128 đã unmapped ngay từ đầu lần copy này.
- **Length KHÔNG sai:** RDX = 2.073.600 đúng bằng kích thước plane Y;
  không có chuyện length bị corrupt thành số lớn hơn.
- **Dest:** RDI = 0x780d08017040 (căn 64); fault = RDI+n−128 nằm ngoài
  mọi mapping (`maps: NOT in any mapping`). Tức là mapping của buffer
  đích kết thúc ở đâu đó ≤ dest+n−128 — ít nhất trang cuối của vùng
  đích đã mất.
- **Kết luận dest-vs-length (n=3, tin cậy cao hơn A2):** length đúng;
  đích bị unmap. Chữ ký **bất biến qua 3 mẫu độc lập** (2 mức thread,
  3 base ASLR khác nhau, RDI/RSI khác nhau) **ủng hộ mạnh giả thuyết
  (a) chunk đích đã bị munmap toàn bộ trước khi copy (use-after-free
  của `td->src`)**: khi chunk đã mất toàn bộ, fault luôn hiện ra ở
  store ĐẦU TIÊN của vòng lặp — mà store đầu tiên của vòng ngược luôn
  ở dest+n−128, bất kể lần chạy nào. Giả thuyết (b) con trỏ đích bị
  corrupt ngẫu nhiên sẽ cho fault−RDI khác nhau giữa các lần chạy
  (và có thể fault giữa chừng ở vòng xuôi) — không thấy ở cả 3 mẫu.
  Lưu ý trung thực: tính bất biến này loại trừ corrupt *ngẫu nhiên*,
  nhưng không loại trừ được corrupt *xác định* (vd con trỏ luôn trỏ
  tới đúng chunk vừa bị free — thực chất cũng là (a) — hoặc một lỗi
  offset cố định trong `td->src` khiến đích luôn trỏ ra ngoài chunk
  thật; trường hợp sau sẽ crash ở MỌI frame chứ không phải 2/20, nên
  khả năng này thấp). Chưa có bằng chứng trực tiếp về *ai* đã free
  `td->src` (cần theo dõi vòng đời chunk — vd mprotect/watchpoint —
  vượt ngoài phạm vi luồng này).
- **Hệ quả cho giả thuyết gốc A2 §3.2:** cơ chế "race M1 làm corrupt
  dest/length" được thu hẹp: **length không bị corrupt** (RDX đúng ở
  cả 3 mẫu); phần bị corrupt/mất là **bản thân buffer đích**
  (đã munmap trước khi copy). Đây vẫn là triệu chứng thứ hai của cùng
  race M1 (ghi in-place làm bẩn bộ nhớ decoder/vidstab), nhưng vị trí
  hỏng đã xác định rõ hơn: không phải metadata độ dài, mà là vòng đời
  của chunk `td->src.data[0]`.

### 2.4 Giới hạn của các mẫu này

- 3 mẫu có regs đều là **vòng lặp ngược** (dest > src trong cả 3 lần
  chạy: RDI > RSI) — chưa có mẫu vòng xuôi nào có regs để đối chiếu
  (2 mẫu vòng xuôi của Z6/A2 không có regs; dự đoán theo giả thuyết
  (a): mẫu vòng xuôi có regs sẽ fault ở offset ≈ 0–256, tức store đầu
  tiên của vòng xuôi — kiểm chứng được ở hunt sau nếu bắt thêm mẫu).
- Không biết frame thứ mấy của clip thì crash (ffmpeg `-v error` không
  in tiến độ frame; stderr của lần crash chỉ có backtrace).
- Không có `/proc/self/maps` đầy đủ (handler chỉ in dòng chứa fault
  addr, theo thiết kế A2) — không biết mapping đích bắt đầu/kết thúc
  ở đâu, nên kết luận (a) là suy luận từ tính bất biến của chữ ký,
  không phải quan sát trực tiếp "chunk đã munmap".
- Chưa xác định được *ai* free `td->src` (xem §2.3).

## 3. Khảo sát AVFILTERPAD_FLAG_NEEDS_WRITABLE — KHÔNG build ffmpeg riêng

### 3.1 Flag có thật, là pattern chuẩn — nhưng không chứng minh được là fix gốc rễ

Đối chiếu source FFmpeg 8.1.2 (tarball `ffmpeg-8.1.2.tar.xz` tải từ
ffmpeg.org, đã giải nén tại `/tmp/ffmpeg-8.1.2` để khảo sát; không dùng
làm gì khác):

- Flag định nghĩa tại `libavfilter/filters.h:59`:
  `AVFILTERPAD_FLAG_NEEDS_WRITABLE (1 << 0)` — "The filter expects
  writable frames from its input link, duplicating data buffers if
  needed. input pads only."
- Cơ chế ép buộc tại `libavfilter/avfilter.c:1046` (`filter_frame_framed`):
  nếu pad đích có flag thì gọi `ff_inlink_make_frame_writable(link, &frame)`
  TRƯỚC khi gọi `filter_frame` của filter.
- ~20 filter in-place khác đã dùng flag này (drawbox, chromakey,
  subtitles, despill, colorcorrect, huesaturation, fillborders, …).
- **`vf_vidstabtransform.c` (8.1.2) KHÔNG đặt flag**: input pad chỉ có
  `.name/.type/.filter_frame/.config_props`. Upstream trunk (doxygen
  ffmpeg.org, crawl 08/11/2026) cũng không đặt flag — đây sẽ là patch
  local, không phải thứ kéo được từ upstream.
- Patch cần làm (nếu làm): thêm một dòng vào input pad —
  `.flags = AVFILTERPAD_FLAG_NEEDS_WRITABLE` — rồi build lại
  libavfilter. Không có AVOption/toggle runtime nào khác.

### 3.2 Vì sao flag KHÔNG ĐƯỢC CHỨNG MINH là fix cho race này

`ff_inlink_make_frame_writable` (`libavfilter/avfilter.c:1562`):

```c
if (av_frame_is_writable(frame))
    return 0;   /* không copy gì cả */
```

Tức là flag chỉ copy khi frame **chưa writable theo refcount**
(refcount > 1). Cả ba crash đã bắt đợt này đều đi đường
**direct** của `filter_frame` (`vf_vidstabtransform.c:240`:
`if (av_frame_is_writable(in))`) — tức là tại thời điểm filter nhận
frame, `av_frame_is_writable` đã trả về true. **Trong đúng cửa sổ đó,
flag không thay đổi gì cả**: `ff_inlink_make_frame_writable` cũng trả
về ngay, frame vẫn là buffer decoder đó, warp in-place vẫn ghi lên
nó. Flag chỉ sửa được trường hợp frame đang shared (refcount > 1) —
trường hợp mà filter hiện tại đã tự xử lý bằng nhánh non-direct
(`ff_get_video_buffer`).

Hệ quả: flag là ứng viên hợp lý theo pattern upstream, nhưng **không
có bằng chứng nào cho thấy nó khử được race M1** — race sống ở cửa sổ
"writable theo refcount nhưng decoder vẫn đang dùng buffer làm
reference" (hoặc heap corruption từ warp như giả thuyết A2 §3.2), nơi
flag không can thiệp. Chỉ một bản build có patch + stress hunt đo lại
tỉ lệ crash mới trả lời được — và đó là thí nghiệm chưa làm.

### 3.3 Tính khả thi của build ffmpeg riêng (đã khảo sát, chưa build)

- **Source:** tarball upstream 8.1.2 tải được (11,7 MB, đã về máy);
  `apt-get source` KHÔNG dùng được (không có dòng `deb-src` trong
  sources.list — lỗi `You must put some 'deb-src' URIs in your
  sources.list`).
- **Build deps tối thiểu** (dry-run `apt-get install --dry-run`,
  không cài thật): `libvidstab-dev` 1.1.0-2build1, `libx264-dev`
  2:0.164.3108, `nasm` 2.16.01 — đều có candidate trên Ubuntu noble,
  dry-run cài sạch. Hiện tại máy KHÔNG có gói -dev nào trong số này,
  không có nasm/yasm, không có header libavfilter.
- **Configure tối thiểu:** `./configure --enable-gpl --enable-libvidstab
  --enable-libx264` (+ `--enable-shared` hoặc static). Hệ ffmpeg hiện
  tại là bản Ubuntu đầy đủ (~50 lib ngoài: libvpx, libopus, libaom, …)
  — tái tạo y hệt là việc lớn (30–60+ phút + hàng chục gói -dev);
  bản tối thiểu chỉ phục vụ vidstab thì nhỏ hơn nhiều.
- **Tài nguyên:** đĩa còn 99 GB (source 12 MB, cây build ~1–2 GB —
  đủ); RAM 7 GB, 4 CPU (cell chia sẻ 1,5 CPU) — build tối thiểu ước
  tính 5–15 phút trên 4 core (ước tính từ kinh nghiệm, chưa đo).
- **Quyết định: KHÔNG BUILD trong đợt này.** Lý do: (1) §3.2 — flag
  chưa chứng minh được là fix cho race này, build xong vẫn phải stress
  hunt đo lại (thêm một vòng hunt nữa); (2) ffmpeg tự build trở thành
  dependency triển khai mới cho production render (đường dẫn binary,
  cập nhật bảo mật, đồng bộ với máy khác) — quyết định thuộc về đợt
  sau/user, không phải việc một luồng stress tự ý làm; (3) các luồng
  đợt 74 khác đang apt song song (đợt 72 đã gặp dpkg lock); (4) ưu
  tiên của luồng này là stress hunt, vẫn đang chạy.
- **Nợ còn lại:** nếu đợt sau quyết định thử flag: build tối thiểu theo
  §3.3, chạy lại đúng harness này (NOCOPY ×40 arm A) trên ffmpeg đã
  patch, so tỉ lệ crash với baseline đợt này; chỉ kết luận "flag khử
  race" khi 0 crash trên số lần đủ lớn (với p≈2% cần ≥150 lần 0 crash
  để upper bound ~2%).

## 4. Verdict production: KHÔNG sửa code, giữ `copy`

- Mẫu crash mới (§2) củng cố verdict Y6 §4 / Z6 §4 / A2 §6: crash nằm
  đúng trong nhánh in-place (dòng 150) mà `copy` né được; length copy
  đúng, đích là buffer riêng của vidstab bị unmap — đúng dạng
  use-after-free/heap corruption do race mà `copy` tránh bằng cách đưa
  cho transform một buffer ổn định.
- `enhance.js:183` (`copy` ngay trước vidstabtransform) giữ nguyên.
- Không claim "`copy` khử 100% crash": tỉ lệ thật sau sửa vẫn chỉ biết
  upper bound ~4,7–6% (Y6/Z6).

## 5. Giới hạn và nợ mở (trung thực)

1. **Tỉ lệ crash dưới preload vẫn chỉ biết khoảng:** gộp A2+B7 4/105 =
   3,8% [1,5%, 9,4%]; từng arm n nhỏ nên khoảng tin cậy rộng (§1.1).
   Muốn thu hẹp: thêm ~78 lần chạy nữa để có 95% chắc chắn bắt thêm
   ≥1 crash (nếu p thật 3,8%).
2. **Chưa xác định được *ai* free `td->src`** — cần theo dõi vòng đời
   chunk (mprotect/watchpoint/gdb) ở đợt sau; chữ ký bất biến (§2.3)
   chỉ nói chunk đã mất trước khi copy, không nói ai đã free nó.
3. **Chưa có mẫu crash vòng xuôi nào có regs** — dự đoán theo (a):
   fault ở offset ≈ 0–256; chờ hunt sau kiểm chứng (§2.4).
4. Flag NEEDS_WRITABLE: chưa chứng minh được là fix (§3.2); nợ dài
   hạn vẫn còn, kèm giao thức thử nghiệm ở §3.3.
5. Handler mới đã kiểm chứng trên crash thật (n=3) — nhưng cả 3 mẫu
   đều cùng một chữ ký (vòng ngược, Y, n−128); handler chưa từng bắt
   được mẫu vòng xuôi có regs.
6. `render.js:1805` spawnSync không timeout, preset 4:5 chưa render
   MP4 end-to-end, ci-security.yml/ci-build.yml vẫn 403 — nợ chung
   của đợt 73 §4, không thuộc luồng này.

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round74_b7_vidstab_stress.js` — harness stress
  mới (4 arm, không dừng ở crash đầu, khôi phục từ results.jsonl).
- `docs/PHASE9_ROUND74_B7_VIDSTAB_STRESS_LIMITS.md` — tài liệu này.

Không stage: scratch `~/workspace/.scratch-r74b7/` (runs/, clip 720p/
360p + .trf, results.jsonl, summary.json, stderr từng lần), log luồng
`hidden_files/round74-b7.md` (log nội bộ, không thuộc repo),
`/tmp/ffmpeg-8.1.2/` (source tải về để khảo sát flag). Không push —
chờ user nhắn "push đi" từ main chat.

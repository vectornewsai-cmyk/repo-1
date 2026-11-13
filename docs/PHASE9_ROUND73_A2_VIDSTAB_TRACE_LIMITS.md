# LIMITS — Phase 9 đợt 73 A2: Phân tích stack trace SEGFAULT vidstab

Luồng A2 — đóng nợ đợt 72 §4 mục 4 (phân tích stack trace SEGFAULT mà
đợt 72 Z6 đã bắt được lần đầu bằng LD_PRELOAD).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round73-a2.md`.
Môi trường: ffmpeg 8.1.2, libvidstab 1.1.0, libavfilter.so.11, VM 8 GB,
không GPU, gcc 13.3. Ngày: 09/11/2026 (lượt cron 15:35 +07).
Source đối chiếu: vid.stab tag v1.1.0 (`github.com/georgmartius/vid.stab`,
clone depth-1, commit 60d65da) và FFmpeg tag n8.1.2
(`libavfilter/vf_vidstabtransform.c`, 298 dòng).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Frame lỗi chính xác | **XÁC ĐỊNH ĐƯỢC.** Lệnh lỗi: `vmovdqa64 %zmm17,(%rdi)` trong memcpy AVX-512 (libc+0x1a1862) — STORE vào đích — qua tail-call từ `vsFrameCopyPlane` fast path (`frameinfo.c:137`) ← `vsFrameCopy` ← `vsTransformPrepare` **transform.c:150** (nhánh in-place) ← `filter_frame` của vidstabtransform (libavfilter+0x417eb6) ← graph dispatch ← `av_buffersrc_add_frame_flags` |
| Nguyên nhân khả dĩ nhất | Cùng race M1 (W4): ghi in-place làm bẩn reference frame của decoder + decode frame-threading; con trỏ đích hoặc độ dài copy bị corrupt (ghi tràn/heap corruption từ warp in-place) khiến store chạy quá cuối mapping của `td->src`. Là triệu chứng thứ hai của cùng một race, không phải bug độc lập. Mức tin cậy: trung bình (suy luận từ vị trí lỗi + tính chất race, chưa có bằng chứng trực tiếp) |
| Mẫu thứ 2 | **TÁI HIỆN ĐÚNG STACK (n=2).** Chạy lại hunt Z6: 1/30 crash tại N-r30, stack trùng 8/8 offset với Z6 (chỉ fault addr khác). Mini-hunt handler mới: 0/30, không bắt thêm mẫu |
| Sửa production | **KHÔNG.** `copy` trước vidstabtransform giữ nguyên (phân tích củng cố verdict giữ `copy`); không có thay đổi production nào từ phân tích này |
| Cải tiến harness | `segv_backtrace_preload.c` thêm dump regs + si_code + offsets + tra `/proc/self/maps`; test mới **18/18 PASS** (crasher tổng hợp store/load + COPY smoke sha ground truth) |
| Chưa xác định được | Plane nào (0/1/2), offset fault trong copy, dest pointer hay length bị sai — cần mẫu crash có regs (handler mới đã sẵn sàng) |

## 1. Trace gốc Z6 — xác minh lại trên đĩa (không bịa trace)

File gốc còn nguyên: `~/workspace/.scratch-r72z6/runs/NOCOPY/r3.stderr`
(sha256 `e99a1acafddae95224c9f80c45257875da3d6342e8d1f7a4d8e7d3a0a662a13f`,
14 dòng). Nội dung đầy đủ:

```
[segv_backtrace] caught signal 11 (Segmentation fault), fault addr=0x757d5fc85080
segv_backtrace_preload.so(+0x134a)
libc.so.6(+0x45330)                          ← signal trampoline
libc.so.6(+0x1a1862)                         ← LỆNH LỖI (xem §2)
libvidstab.so.1.1(vsFrameCopy+0x38)
libvidstab.so.1.1(vsTransformPrepare+0x116)
libavfilter.so.11(+0x417eb6)                 ← vidstabtransform filter_frame
libavfilter.so.11(+0x1853b0)                 ← graph dispatch
libavfilter.so.11(av_buffersrc_add_frame_flags+0x168)
ffmpeg(+0x25c93)
ffmpeg(+0x39cfd)
libc.so.6(+0x9cb84)
libc.so.6(+0x129ecc)
```

## 2. Phân tích từng frame (objdump + source 1.1.0 / 8.1.2)

### 2.1 Lệnh lỗi: libc+0x1a1862 — STORE vào đích của memcpy

Disassembly `/lib/x86_64-linux-gnu/libc.so.6` tại 0x1a1862:

```
1a1840: vmovdqu64 (%rsi),%zmm17        ; load 64B từ nguồn
1a1846: vmovdqu64 0x40(%rsi),%zmm18
1a184d: vmovdqu64 0x80(%rsi),%zmm19
1a1854: vmovdqu64 0xc0(%rsi),%zmm20
1a185b: sub $0xffffffffffffff00,%rsi    ; rsi += 0x100
1a1862: vmovdqa64 %zmm17,(%rdi)        ; ← LỆNH LỖI: store 64B vào đích
1a1868: vmovdqa64 %zmm18,0x40(%rdi)
```

- Đây là vòng lặp forward của `__memcpy_avx_unaligned_erms` (nhãn symbol
  `__nss_database_lookup` mà objdump in ra là sai — libc strip local
  symbol nên nó gán nhầm symbol dynamic gần nhất; pattern
  vmovdqu-load + vmovdqa-store theo khối 256 byte là memcpy, không phải
  hàm NSS).
- Lệnh lỗi là **STORE vào (%rdi) = đích của memcpy**, không phải load từ
  nguồn: 4 lệnh load ngay trước đó đã chạy xong cho chunk này. Hệ quả:
  trang đích tại fault addr bị unmapped (hoặc không ghi được), còn trang
  nguồn của chunk này vẫn đọc được.
- Fault addr `0x757d5fc85080` chia hết cho 64 (0x5080 = 64×322) — đúng
  yêu cầu alignment của `vmovdqa64`. Nếu lỗi là sai alignment thì addr
  sẽ không chia hết 64; addr này chia hết → lỗi thật là **trang
  unmapped**, không phải misalignment. (si_code của lần crash này không
  được ghi — handler Z6 không in si_code; handler mới đã thêm, xem §5.)

### 2.2 vsFrameCopy+0x38 — fast path của vsFrameCopyPlane (frameinfo.c:137)

`vsFrameCopy` (libvidstab 0x53e0) lặp từng plane gọi `vsFrameCopyPlane`
(0x52d0, `call` tại 0x5413); return address 0x5418 = vsFrameCopy+0x38.
Trong `vsFrameCopyPlane` có đúng 2 chỗ gọi memcpy:

- **Fast path** (dòng 136–137, khi `dest->linesize == src->linesize`):
  một memcpy khối duy nhất
  `memcpy(dest->data[plane], src->data[plane], src->linesize[plane]*h)`,
  biên dịch thành **tail-call** `jmp memcpy@plt` tại 0x53ad — sau khi đã
  dọn frame (khôi phục rsp, pop các thanh ghi 0x539c–0x53ac) nên trên
  stack không còn frame của `vsFrameCopyPlane`, return address còn lại
  là vsFrameCopy+0x38.
- Row-by-row path (dòng 138–145): `call memcpy@plt` tại 0x5362, return
  address sẽ là vsFrameCopyPlane+0x97 (0x5367).

Trace chỉ có vsFrameCopy+0x38, **không có frame vsFrameCopyPlane** —
khớp chính xác với fast path (đây là lời giải cho điểm Z6 để ngỏ ở §2.4:
frame libc `+0x1a1862` không phải "chưa đặt tên được" mà chính là
memcpy, và frame vsFrameCopyPlane không "mất" mà bị tail-call xóa).
Đường row-by-row bị loại trừ (nó sẽ để lại vsFrameCopyPlane+0x97) —
với lưu ý nhỏ: kết luận này dựa trên unwinder hoạt động đúng; khả năng
unwinder bỏ sót đúng 1 frame là thấp nhưng không phải 0.
Với clip 1920×1080 yuv420p, linesize Y = 1920 ở cả hai phía nên fast
path là đường được đi (dest linesize = w = 1920 do `vsFrameAllocate`
đặt; src linesize = 1920 của decoder).

### 2.3 vsTransformPrepare+0x116 — transform.c:150, nhánh in-place

`vsTransformPrepare` (0x64d0) có 2 call `vsFrameCopy`:

| Call site | Return address | Dòng source |
|---|---|---|
| 0x65e1, rdi=&td->src (offset 0x38), rsi=src, rdx=&td->fiSrc | **0x65e6 = +0x116 ← TRACE** | **150: `vsFrameCopy(&td->src, src, &td->fiSrc)`** |
| 0x662d, rdi=&td->destbuf (offset 0x68) | 0x6632 = +0x162 | 164: `vsFrameCopy(&td->destbuf, src, &td->fiSrc)` (chỉ frame đầu, crop=KeepBorder) |

Offset struct đã đối chiếu với `transform.h` 1.1.0
(`VSTransformData`: fiSrc@0x00, fiDest@0x1c, src@0x38, destbuf@0x68,
dest@0x98, srcMalloced@0xc8, conf@0xe0 với crop là field thứ 3):
call tại 0x65e1 nằm trong nhánh `if(src==dest || td->srcMalloced)`
(dòng 141) sau khi kiểm tra `vsFrameIsNull(&td->src)` — tức là dòng 150.
Call dòng 164 (return 0x6632) và `vsTransformFinish` dòng 184
(`vsFrameCopy(&td->dest, &td->destbuf, ...)`, nằm ở hàm khác) đều bị
loại trừ bởi return address.

### 2.4 libavfilter+0x417eb6 — filter_frame của vidstabtransform

Disassembly `libavfilter.so.11` quanh 0x417eb6:

```
417e1e: call vsDoTransform@plt
417e2a: call vsTransformFinish@plt
...
417eb1: call vsTransformPrepare@plt     ; ← call này, return 0x417eb6
417eca: call vsGetNextTransform@plt
417f06: call vsDoTransform@plt
417f12: call vsTransformFinish@plt
```

Return address 0x417eb6 nằm ngay sau `call vsTransformPrepare@plt` —
đây là `filter_frame` của vidstabtransform (hàm static nên stripped,
không có tên symbol; xác định bằng PLT call kề trước + chuỗi
Prepare→GetNextTransform→DoTransform→Finish đúng thứ tự source).
Đối chiếu `vf_vidstabtransform.c` (FFmpeg 8.1, dòng 228–274):

```c
if (av_frame_is_writable(in)) {
    direct = 1;
    out = in;
} else {
    out = ff_get_video_buffer(outlink, outlink->w, outlink->h);
    ...
}
...
if (direct) {
    vsTransformPrepare(td, &inframe, &inframe);   // src==dest → nhánh in-place → dòng 150
} else {
    vsTransformPrepare(td, &inframe, &outframe);  // src!=dest, srcMalloced==0 → td->src=*src (alias, KHÔNG copy)
}
```

Đường duy nhất tới dòng 150 là frame **writable** (direct/in-place).
Đây cũng là đường mà W4 đã chứng minh ghi đè lên reference frame của
decoder (ghi in-place vào buffer decoder).

### 2.5 Các frame còn lại

- libavfilter+0x1853b0: ngay sau `call *%r14` tại 0x1853ad (gọi
  filter_frame qua con trỏ hàm) — dispatch frame của graph.
- `av_buffersrc_add_frame_flags+0x168`: đẩy frame vào graph.
- `ffmpeg+0x25c93/+0x39cfd` + libc start: vòng lặp main của ffmpeg CLI,
  không liên quan tới nguyên nhân.

### 2.6 Bối cảnh bộ nhớ (để đọc §3)

- `vs_zalloc` (libvidstab.c:34, 1.1.0) = `memset(malloc(size),0,size)`
  — malloc thuần. Plane Y 1920×1080 = 2.073.600 byte vượt ngưỡng mmap
  mặc định của glibc (128 KiB) → chunk mmap; `free()` sẽ munmap ngay.
  `td->src` được cấp một lần (frame đầu) và dùng lại mọi frame sau.
- Clip thí nghiệm: h264 1920×1080 yuv420p 30fps, 5s
  (`shakynoisy1080.mp4`, sha `5cf533f5bcd9…`), `.trf` của X8.

## 3. Kết luận nguyên nhân

### 3.1 Điều CHẮC CHẮN (từ disassembly + source)

1. Lỗi là **STORE vào đích** của memcpy (không phải load từ nguồn):
   đích = `td->src.data[plane]` — buffer riêng của vidstab, cấp bởi
   `vsFrameAllocate` — trong lúc copy frame decoder tại
   `transform.c:150`, ở nhánh in-place (frame writable).
2. Lệnh lỗi nằm trong **vòng lặp forward** của memcpy (0x1a1840–0x1a1887),
   không phải ở tail-store cuối (0x1a1889+). Vòng lặp này ghi từ đầu
   vùng đích đi lên; tail (256 byte cuối) chỉ ghi ở cuối. Fault ở vòng
   lặp forward nghĩa là copy **đã ghi thành công phần đầu** của vùng
   đích rồi mới fault ở offset sau — mapping của đích còn hiệu lực ở
   đầu, mất hiệu lực ở offset fault.
3. Từ (2) loại trừ được: đích là NULL/con trỏ wild toàn phần (sẽ fault
   ngay store đầu, offset ~0), đích bị munmap toàn bộ trước khi copy,
   lỗi đọc từ nguồn (decoder buffer), lỗi ở bước warp/transform, lỗi ở
   decode. (Lưu ý: "offset sau" là suy luận từ vị trí lệnh lỗi trong
   vòng lặp forward; offset số học chính xác thì chưa biết vì trace
   không có thanh ghi — xem §3.3.)

### 3.2 Nguyên nhân khả dĩ nhất

**Cùng race M1 (W4), biểu hiện thứ hai — không phải bug độc lập.**
Cơ chế M1 đã chứng minh: vidstabtransform ghi in-place (warp) lên
buffer frame của decoder trong khi decoder frame-threading vẫn dùng
buffer đó làm reference cho các frame sau. Ở lần crash này, race đó
làm corrupt **con trỏ đích `td->src.data[plane]` hoặc độ dài copy**
(`src->linesize × h`) — vd ghi tràn từ warp in-place sang vùng heap
lân cận làm hỏng chunk malloc của `td->src` hoặc struct `td` — khiến
store của memcpy chạy quá cuối mapping của `td->src` và fault giữa
chừng (đúng dạng §3.1 mục 2).

Mức tin cậy: **trung bình**. Ủng hộ: (a) crash chỉ xảy ra ở nhánh
in-place/writable (đúng nhánh M1; `copy` né được — 0/78, xem §6);
(b) tính chất không xác định (3/30 native Y6, 1/30 + 0/30 dưới preload
đợt này); (c) fault là store vào buffer heap, dạng điển hình của
use-after-free/heap corruption do race. Chưa chứng minh trực tiếp:
không có thanh ghi/maps tại thời điểm crash thật nên chưa biết plane,
offset, và giá trị nào bị corrupt.

### 3.3 Các giả thuyết đã loại trừ hoặc yếu

- **Overrun do linesize sai (yếu):** fast path yêu cầu
  `dest->linesize == src->linesize`; dest được cấp đúng `w*h` và độ
  dài copy là `src->linesize*h` với cùng `fiSrc` — nếu metadata nhất
  quán thì không overrun được ở cả hai path (row-by-row cũng chỉ ghi
  đúng `w*h`). Muốn overrun thì metadata phải bị race làm sai — tức
  quay lại giả thuyết §3.2.
- **Đích bị free giữa chừng (loại trừ):** không có code path nào free
  `td->src` giữa stream — chỉ `vsTransformDataCleanup` khi uninit
  filter. (Nếu dest bị free + munmap toàn bộ thì fault phải ở store
  đầu, trái với §3.1 mục 2.)
- **Lỗi ở warp (loại trừ vị trí, còn lại khả năng ghi tràn):** warp
  (`vsDoTransform`) ghi vào `td->dest` (= frame decoder ở nhánh
  direct), không ghi vào `td->src`; nhưng ghi TRÀN từ warp vẫn là ứng
  viên gây heap corruption cho §3.2.
- **Lỗi đọc buffer decoder (loại trừ):** lệnh lỗi là store, không phải
  load; các load nguồn của cùng chunk đã chạy xong.

### 3.4 Chưa xác định được (cần mẫu crash có regs)

Plane nào (0/1/2), offset fault trong copy (`fault - dest_base`),
và giá trị nào bị sai (dest pointer hay length). Handler mới (§5) được
xây đúng để trả lời 3 câu này ở lần crash sau.

## 4. Mẫu thứ 2 — tái hiện đúng stack (n=2)

Chạy lại đúng harness Z6 (`test_round72_z6_trace_hunt.js`, handler CŨ)
với WORK mới `~/.scratch-r73a2/runs/`:

| Đợt chạy | Kết quả |
|---|---|
| Z6 (09/11, lượt 12:35) | 1 crash tại N-r3 (dừng sớm sau 3 lần), stack S |
| **A2 chạy lại #1** | **1/30 crash tại N-r30, stack TRÙNG 8/8 offset với Z6** (chỉ fault addr khác: `0x7e9efc302080`, cũng chia hết 64). File `runs/NOCOPY/r30.stderr` |
| A2 mini-hunt (handler mới, `runs-new/`) | 0/30, 30/30 sha ground truth — không bắt thêm mẫu |

Stack của N-r30 (đối chiếu từng offset với Z6 — trùng hết):

```
libc+0x1a1862, vsFrameCopy+0x38, vsTransformPrepare+0x116,
libavfilter+0x417eb6, libavfilter+0x1853b0,
av_buffersrc_add_frame_flags+0x168, ffmpeg+0x25c93, ffmpeg+0x39cfd
```

- Tỉ lệ (trung thực, không gộp bừa): dưới preload 2 lần chạy cho
  1/30 + 0/30 = **1/60 ≈ 1,7%** (chưa tính Z6 1/3 vì dừng sớm nên
  thiên vị — không gộp); native Y6 3/30 = 10%. Không claim tỉ lệ mới;
  con số này chỉ nói crash là hiếm và cùng một đường code.
- NOCOPY spread (M1 còn sống): chạy lại #1 có 2/30 sha lệch ground
  truth (`9354a21e3968`, `180dcf1cced7`); mini-hunt 30/30 trùng sha
  (biến thiên theo load, không phải bằng chứng M1 đã hết).

## 5. Cải tiến harness — dump regs + maps (đã làm + kiểm chứng)

### 5.1 Thay đổi: `server/render/src/segv_backtrace_preload.c`

Handler giờ in thêm (định dạng backtrace cũ giữ nguyên để harness cũ
vẫn trích được):

- `regs: RIP/RDI/RSI/RDX/RSP/RBP` tại thời điểm lỗi (ucontext, x86_64);
- `fault addr=... == RDI / == RSI / khác RDI/RSI, si_code=1 (MAPERR)`
  — si_code phân biệt "địa chỉ không mapped" với "không có quyền";
- `offsets: fault-RDI=+... fault-RSI=+...` — để đối chiếu khi fault
  không khớp chính xác thanh ghi (vd memcpy ERMS copy ngược: lỗi ở
  store cuối vùng đích, fault = dest+n-0x80, RDI vẫn ở đầu vùng);
- dòng `maps:` tra `/proc/self/maps` chứa fault addr, hoặc
  `NOT in any mapping`.

Hai lỗi tìm ra khi kiểm chứng (đã sửa, có test hồi quy):

1. **Buffer snprintf quá nhỏ:** khối regs 3 dòng dài ~330 ký tự nhưng
   dùng chung `buf[256]` → cắt cụt mất dòng offsets (đã thấy thật:
   in ra `[segv_b` rồi dính luôn dòng maps). Sửa: dùng `rbuf[512]`
   riêng cho khối regs.
2. **Tra maps SAU backtrace() bị sai:** `backtrace()` lần đầu load
   lười `libgcc_s.so.1`, mapping mới này có thể rơi đúng vào trang vừa
   fault (đã thấy thật: fault addr ở trang cuối vùng munmap bỗng "nằm
   trong mapping libgcc_s") khiến kết luận "còn mapped" bị sai. Sửa:
   tra maps ngay khi vào handler, TRƯỚC `backtrace()`.

### 5.2 Kiểm chứng: `server/render/src/test_round73_a2_trace_regs.js`

**18/18 PASS** (chạy thật, không bịa):

| Kiểm chứng | Kết quả |
|---|---|
| Biên dịch .so mới (gcc `-Wall -Wextra`) | exit 0, không warning |
| Crasher tổng hợp **store** 2 MiB (đúng cỡ plane Y 1080p): memcpy vào vùng đã munmap | chết đúng SIGSEGV; fault = dead+n-0x80, offsets fault-RDI=+2097024 (0x1fff80) — đúng store cuối của memcpy ERMS copy ngược (đã xác minh bằng disassembly libc: RIP offset 0x1a1906 = `vmovdqa64 %zmm17,0xc0(%rcx)`); si_code=MAPERR; maps NOT in any mapping |
| Crasher tổng hợp **load** 4 KiB: memcpy từ vùng đã munmap | chết đúng SIGSEGV; fault == RSI, offsets fault-RSI=+0; si_code=MAPERR; maps NOT in any mapping |
| COPY smoke ffmpeg thật dưới preload mới (clip + .trf Z6) | exit 0, sha framemd5 `d960996868d3…` khớp ground truth — preload mới không đổi output |

Ghi chú kỹ thuật cho lần săn sau: với memcpy ERMS, hướng copy (xuôi/
ngược) phụ thuộc thứ tự địa chỉ src/dest — crash thật (RIP offset
0x1a1862, vòng lặp xuôi) khác với crasher store tổng hợp (RIP offset
0x1a1906, vòng lặp ngược, dest > src). Handler chỉ kết luận
== RDI / == RSI khi khớp chính xác, còn lại in offset — đúng thiết kế.

## 6. Verdict production: KHÔNG sửa code, giữ `copy`

Phân tích này **củng cố** verdict Y6 §4 / Z6 §4, không đổi quyết định
nào:

- Crash nằm đúng trong nhánh in-place (dòng 150) mà `copy` né được:
  với `copy` trước vidstabtransform, frame vào filter là buffer riêng
  ổn định (không phải buffer decoder, không là reference frame) —
  warp không bao giờ chạm bộ nhớ decoder, và copy dòng 150 đọc từ
  nguồn ổn định.
- `enhance.js:183` (`copy` ngay trước vidstabtransform) **giữ nguyên**,
  không đụng; log `r.signal` của Z6 trong `render.js` giữ nguyên.
- Không claim "`copy` khử 100% crash": tỉ lệ thật sau sửa vẫn上限 ~4,7–6% (Y6) / ~1,7% dưới preload (đợt này §4) — không claim mới.
- Nợ dài hạn còn nguyên: `AVFILTERPAD_FLAG_NEEDS_WRITABLE` (build
  ffmpeg riêng, X8 §5 mục 2) — fix gốc rễ thay cho `copy`.

## 7. Giới hạn và nợ mở (trung thực)

1. **Chỉ n=2 trace, cả hai đều KHÔNG có regs** (handler cũ) — plane /
   offset / dest-vs-length chưa biết. Nợ: chờ lần crash tiếp theo dưới
   handler mới (đã có sẵn trong repo; harness Z6 biên dịch lại .c mỗi
   lần chạy nên lần săn sau tự dùng bản mới).
2. **2 frame libavfilter không có tên symbol** (stripped) — xác định
   bằng PLT call + disassembly, không bằng symbol; `addr2line` vẫn
   `??:?` (cần gói `-dbgsym`, nợ tùy chọn cũ, giá trị chủ yếu là xác
   nhận thêm).
3. **Tỉ lệ crash: không claim mới** (xem §4).
4. **Handler mới chưa từng bắt crash thật** — mới chỉ kiểm chứng bằng
   crasher tổng hợp + COPY smoke. Lần hunt tiếp theo sẽ kiểm chứng nó
   trên crash thật (nếu bắt được).
5. Nợ dài hạn: `AVFILTERPAD_FLAG_NEEDS_WRITABLE` (build ffmpeg riêng).

## 8. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/segv_backtrace_preload.c` — thêm regs/si_code/
  offsets/tra maps (tương thích ngược định dạng backtrace cũ).
- `server/render/src/test_round73_a2_trace_regs.js` — test mới 18/18.
- `docs/PHASE9_ROUND73_A2_VIDSTAB_TRACE_LIMITS.md` — tài liệu này.

Không stage: scratch `~/workspace/.scratch-r73a2/` (runs/, runs-new/,
regs/ + 2 file hunt log), log luồng
`hidden_files/round73-a2.md` (log nội bộ, không thuộc repo),
`/tmp/a2src/` (source vid.stab 1.1.0 + vf_vidstabtransform.c đã tải về
để đối chiếu). Không push — chờ user nhắn "push đi" từ main chat.

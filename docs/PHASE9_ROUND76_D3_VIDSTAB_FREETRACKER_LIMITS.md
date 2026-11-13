# Đợt 76 D3 — Free-tracker v2 lock-free: "Ai free chunk đích" — ĐÃ TRẢ LỜI

**Ngày:** 09–10/11/2026 (lượt cron 00:35 +07, đợt 76). **Trạng thái: nợ đợt 75 §4 mục 3 — ĐÓNG.**
**Phạm vi:** chỉ thêm harness chẩn đoán + tài liệu. Không sửa production (giữ filter `copy`
trước vidstabtransform), không build NEEDS_WRITABLE, không push, không binary, không workflow.

## 0. Kết luận ngắn (đọc 1 phút)

**Ai free chunk đích: ffmpeg CLI, trên luồng decode — `avcodec_free_context` → teardown pool
buffer của decoder (`av_buffer_pool_uninit`), xảy ra lúc drain/EOF trong khi filter graph vẫn
chưa xử lý xong frame 148.** Bằng chứng trực tiếp: 7/7 crash dưới tracker v2d (săn có tải)
đều có RDI khớp đúng 1 dòng FREE đã log, cùng một backtrace free duy nhất (xem §6). Đây là
lần đầu tiên câu hỏi "ai free" được trả lời bằng backtrace FREE khớp địa chỉ RDI — không còn
suy diễn.

Chuỗi nhân quả đầy đủ (bằng chứng ở §3–§6):

1. Ở chế độ NOCOPY, các frame đầu đều non-writable → vidstab đi nhánh non-direct:
   `td->src = *src` — **alias buffer decoder của frame trước**, không cấp phát riêng.
2. Lúc drain, frame 148 tới với refcount == 1 (decoder đã nhả ref DPB) → writable → filter
   đi đường in-place (`src == dest`) → nhánh in-place của `vsTransformPrepare` cần copy
   frame 148 vào `td->src` làm bản nháp — nhưng `td->src` đang là alias buffer frame 147
   (non-null nên không cấp phát mới) → `vsFrameCopy` ghi thẳng vào buffer frame 147.
3. Trước đó, luồng decode đã gọi `avcodec_free_context` (xử lý EOF/drain) → pool buffer của
   decoder bị teardown (`av_buffer_pool_uninit`) → **toàn bộ buffer decoder đang nằm trong
   pool (kể cả buffer frame 147, đã được filter nhả ref sau khi xử lý xong frame 147) bị
   free + munmap**.
4. Tùy đường đi sau đó: (a) copy prologue fault ngay trong `vsFrameCopy` (reverse memcpy),
   hoặc (b) copy prologue "lọt" (buffer vừa được reuse/remap?) rồi fault ở pha warp
   (`interpolateBiLin` đọc pixel từ buffer đã chết). Cả hai dạng đều bắt được, frame 148,
   plane Y, 100% lastFrame=147.

Tỷ lệ crash **không phải hằng số** — nó là race xuyên luồng (decode vs filter) nên phụ thuộc
tải/cửa sổ thời gian: cửa sổ yên (tải ~1–2): 0/64; cửa sổ có tải (3 hog CPU + các luồng đợt
76 khác): 7/16 = 43,8% (Wilson [23,1%, 66,8%]), cộng thêm 5/10 lần không crash nhưng sha lệch
— tổng 12/16 lần (75%) race bộc lộ. Xem §7.

## 1. Tracker v2 lock-free — khác v1 ra sao

| | v1 (C3) | v2 (luồng này) | v2b / v2c / v2d (luồng này) |
|---|---|---|---|
| Lock trên đường free | pthread_mutex (mọi free) | **không lock nào** (grep code + `nm -D`: 0 symbol `pthread_mutex_*`) | như v2 |
| Bảng thành viên | (không rõ — mutex-guarded) | open addressing + tombstone, 64 slot, `_Atomic(void*) addr`; probe dừng ở NULL đầu tiên; insert/remove bằng CAS | v2b: như v2, 10 cỡ; v2c: dải [400K, 4,2M], 1024 slot; v2d: như v2c + **silent-alloc** |
| Ghi log | (mutex) | ring buffer lock-free 4096 slot (writer chiếm slot bằng `atomic_fetch_add`, publish bằng release-store); đúng MỘT `write()` O_APPEND/event | như v2; v2d: ALLOC không ghi log |
| Backtrace | có (dưới mutex) | `backtrace_symbols()` dưới cờ thread-local `in_hook` | v2d: chỉ FREE mới backtrace |
| Hook malloc | dlsym | gọi thẳng `__libc_malloc/__libc_free/__libc_memalign` (bài học v1) | như v2 |
| Track cỡ nào | đúng 2.073.600 | đúng 2.073.600 | v2b: 10 cỡ đoán (vidstab Y/U/V + decoder Y/U/V đoán + nguyên frame); v2c: mọi cỡ 400K–4,2M; v2d: như v2c |

**Hai bài học đo được trong quá trình làm v2 (ghi trung thực, không giấu):**

- (a) Bản đầu thử "armed gate" (free() bỏ qua tra bảng khi chưa armed) — unit test bắt được:
  FREE của chunk đã cấp trước khi armed bị bỏ sót (unit chỉ log 2/4 event). **Gate đã gỡ;**
  free() luôn tra bảng.
- (b) Bản đầu quét toàn bộ 64 slot mỗi lần free — bench đo được ~7× native (618 ms vs 90 ms),
  gần bằng v1 (680 ms) — **đã thay bằng probe tombstone O(1)**.
- (c) Lỗi biên dịch ban đầu (`atomic_fetch_add_explicit` thiếu đối số) — lần chạy kiểm chứng
  đầu dùng source lỗi nên .so không tồn tại → bench "v2" giả (số native). Đã thêm kiểm tra
  marker start trong log để chắc preload thật sự được load, và chạy lại toàn bộ.

**Kiểm chứng v2** — `server/render/src/test_round76_d3_free_track_v2.js`: **34/34 PASS**
(biên dịch gcc -Wall -Wextra không warning; unit đơn luồng 4/4 event đúng địa chỉ; MT 4 thread:
đúng 200 ALLOC + 200 FREE, mọi FREE khớp ALLOC trước đó, không dòng rác, seq không trùng;
COPY smoke sha `d960996868d3` khớp ground truth, log có cả 2 site +0x17b/+0x144 + dòng ARMED,
FREE==ALLOC).

**Bench đường free nóng** (4 thread × 500k malloc/free(64), trung vị 5 lần; VM rất nhiễu —
native dao động 20–169 ms/lần): native ~90–101 ms; v1 ~407–680 ms (**4,3–5,1× native** —
chứng tỏ mutex v1 đắt); v2 bảng rỗng ~191 ms, v2 1 chunk live ~303 ms (**1,9–3,0× native**).
Kết luận trung thực: v2 nhanh hơn v1 rõ rệt (~1,7–2,7×) nhưng **không đạt ~1,25× như kỳ vọng
ban đầu**; overhead còn lại là chi phí CPU của probe (không phải serialize xuyên thread như
mutex v1).

## 2. Cơ chế crash ĐƯỢC SỬA LẠI (đính chính C3 §5.2)

Đọc source vid.stab 1.1.0 thật (tarball `codeload.github.com/georgmartius/vid.stab/.../v1.1.0`,
giải nén tại `~/workspace/.scratch-r76d3/vid.stab-1.1.0/`):

- `transform.c` `vsTransformPrepare`: nhánh in-place `if (src==dest || td->srcMalloced)` — chỉ
  cấp phát `td->src` khi `vsFrameIsNull(&td->src)`; nhánh non-direct thì `td->src = *src`
  (alias buffer decoder, không cấp phát). `vsFrameAllocate` cấp từng plane riêng qua `vs_zalloc`
  (Y 2.073.600, U/V 518.400). `vsFrameCopyPlane` fast path: một `memcpy` khi linesize bằng nhau.
- Hệ quả: ở chế độ NOCOPY, các frame đầu đều non-writable → `td->src` alias buffer decoder của
  frame trước đó; khi frame writable đầu tiên tới (lúc drain, frame 148), nhánh in-place chạy
  nhưng `td->src` đã non-null (alias frame 147) nên KHÔNG cấp phát → `vsFrameCopy` ghi thẳng
  vào buffer decoder của frame 147, vốn đã bị free lúc drain → SIGSEGV.
- **Đích crash KHÔNG PHẢI td->src (chunk vidstab) mà là buffer data[0] của frame decoder
  trước đó.** Độ dài copy RDX=0x1fa400 (2.073.600) là kích thước plane theo khung hình
  (1920×1080), không phải kích thước cấp phát thật của buffer decoder (2.092.879) — vì vậy
  fault−RDI dạng (a) vẫn = 2.073.472 = 2.073.600−128 (xem §4).

**Đính chính metric "armed" của C3:** "armed" (td->src được cấp, +0x17b) KHÔNG BAO GIỜ xảy ra
ở chế độ NOCOPY — chỉ xảy ra khi frame đầu tiên đã writable (chế độ COPY: frame 0 writable →
cấp td->src ngay). 0/24 "armed" dưới v1 vì vậy không phải bằng chứng tracker ức chế arming;
suy luận ức chế ở C3 §5.3 dựa trên metric sai này được **rút lại**. Metric đúng là tỉ lệ crash
(xem §7). Trong toàn bộ đợt này, armed = 0/80 lần NOCOPY dưới mọi tracker — đúng như cơ chế
mới dự đoán.

## 3. Cỡ buffer decoder thật (v2b → v2c)

- **v2b** (track 10 cỡ đoán): kiểm chứng `test_round76_d3_free_track_v2b.js` **20 PASS, 3 FAIL**
  — các fail đều do giả thuyết cỡ sai: COPY log theo size {518400:8, 522304:8, 2073600:4,
  2089024:4} — buffer Y decoder thật KHÔNG phải 2.088.960 mà là **2.089.024** (có +64 padding);
  U/V decoder là 522.304. NOCOPY ×1 dưới v2b crash SIGSEGV nhưng RDI vẫn không khớp FREE nào
  (chunk đích vẫn ngoài tập cỡ đoán).
- **v2c** (range tracker [400K, 4,2M], 1024 slot): decode thuần dưới v2c: 74 event — **cỡ thật
  của buffer decoder: Y = 2.092.879, U/V = 523.279** (qua `avcodec_default_get_buffer2` →
  `av_buffer_pool_get` → `av_buffer_allocz` → `av_malloc` → `posix_memalign`), cộng 523.408
  (qua `av_refstruct_pool_get`), 600.224 và 400.752 (buffer nội bộ decoder, qua
  libavcodec+0x421df5). Công thức số học chính xác của 2.092.879 chưa rõ (1920×1090+79;
  U/V 960×545+79 — cùng +79) — chỉ ghi số đo trực tiếp, không suy diễn công thức.
- Phân tích số lượng COPY: 2.089.024×4 + 522.304×8 = 4 buffer frame decoder/filter (pool của
  filter); 2.073.600×4 + 518.400×8 = td->src + destbuf + 2 buffer frame của filter `copy`.
- Trong lần chạy thường, buffer decoder Y (2.092.879) cấp 7 lần (pool lấp dần); **không buffer
  frame decoder nào bị free giữa stream** — FREE chỉ ở teardown probe + teardown cuối. Nghịch
  lý này được giải ở §6: lần free chí mạng không phải "giữa stream" mà là **teardown pool ở
  drain, trước khi filter xử lý xong frame cuối**.

## 4. Hai dạng crash (bằng chứng regs + stack + disassembly)

Cả hai dạng đều: lastFrame=147 (frame 148), plane Y, RDI = buffer decoder frame 147 (offset
+0x40 so với đầu mapping), RDI nằm trong lỗ unmapped.

**Dạng (a) — copy prologue, reverse memcpy** (v2 hunt: r2/r16/r17/r20; load hunt: r1/r6/r12;
tổng 7 lần có stack đầy đủ):
- Stack: `libc+0x1a1906` ← `vsFrameCopy+0x38` ← `vsTransformPrepare+0x116` ←
  libavfilter+0x417eb6 ← +0x1853b0 ← `av_buffersrc_add_frame_flags+0x168` ← ffmpeg+0x25c93.
- Regs (vd r1 load hunt): RDX=0x1fa400 (2.073.600), fault−RDI=+2.073.472 = 2.073.600−128,
  RSI (source, buffer frame 148) vẫn mapped. Lỗ 4.186.112 B = 2 chunk decoder Y kề nhau
  (pool_uninit free cả cache một lượt).
- Chữ ký: vòng memcpy ngược fault ở 128 byte cuối của vùng copy.

**Dạng (b) — pha warp, `interpolateBiLin`** (v2 hunt: r8; load hunt: r5/r7/r10/r14; tổng 5):
- Stack: `interpolateBiLin+0x99` ← `transformPlanar+0x27e` ← libavfilter+0x417f0b ←
  +0x1853b0 ← `av_buffersrc_add_frame_flags+0x168` ← ffmpeg+0x25c93.
- Disassembly `libvidstab.so.1.1` (`interpolateBiLin` tại 0x4840; lệnh tại +0x99 = 0x48d9:
  `movzbl (%rdi,%rsi,1),%esi` — LOAD): RDI đã bị ghi đè bằng `img` (arg thứ 4,
  `mov %rcx,%rdi` tại 0x486a), RSI là offset pixel đã tính.
- Regs khớp công thức warp: vd r5: RSI=0x2ec78=191.608 = 99×1920+1.528 (iy_f=99, ix_c=1528);
  RDX=0x634607 (y fp16 → 0x63=99 ✓). r7: RSI=0x28574=165.236=86×1920+116, RDX>>16=0x56=86 ✓.
  r10: RSI=0x2ca37=182.839=95×1920+439, RDX>>16=0x5f=95 ✓. r14: RSI=0x1cde2=118.242=
  61×1920+1.122, RDX>>16=0x3d=61 ✓. r8 (v2 hunt): RSI=128.838=67×1920+198 ✓.
- Lỗ 2.093.056 B = đúng 1 chunk decoder Y (2.092.879 làm tròn theo page).
- Chi tiết mở (không suy diễn): vì sao copy prologue không fault trước khi warp fault ở
  dạng (b)? Có thể liên quan plane U/V được free sau khi copy Y, hoặc free đồng thời — chưa
  giải thích trọn vẹn. Không ảnh hưởng kết luận "ai free" (cùng một lần free, cùng chunk).

**Ba lần sha-lệch không crash** (v2 hunt: r3 `5bada6ea2174`, r9 `3c4a3aca7619`,
`0a2c1d030764`): race làm lệch pixel không crash — buffer đã free nhưng được reuse/remap
trước khi đọc/ghi, hoặc chỉ bị ghi đè một phần. Dưới tải: 5/10 lần không crash cũng sha-lệch
(xem §7).

## 5. Các hunt đã chạy (NOCOPY, 1080p t1, showinfo, v2/v2c/v2d + segv handler)

| Hunt | Tracker | Điều kiện | Kết quả crash | Armed | Sha-lệch (không crash) |
|---|---|---|---|---|---|
| v2 (hunt chính) | v2 (2.073.600) | cửa sổ 01:11–01:45, tải 1–12 | **5/24 = 20,8%** [9,2%, 40,5%] | 0/24 | 3/19 |
| v2c | v2c (range) | cửa sổ ~01:55–02:10, tải ~1–2 | 0/24 = 0% [0%, 13,8%] | 0/24 | 0 |
| v2d (yên) | v2d (silent-alloc) | cửa sổ ~02:10–02:20, tải ~1–2 | 0/16 = 0% [0%, 19,4%] | 0/16 | 0 |
| v2-repeat | v2 | cửa sổ ~02:30, tải ~2,6, 12 lần lặp lại | 0/12 = 0% [0%, 24,3%] | — | 0 |
| **v2d-load** | v2d (silent-alloc) | **3 hog CPU song song**, tải ~3–5 | **7/16 = 43,8%** [23,1%, 66,8%] | 0/16 | **5/10** |
| Không tracker (C3) | — | | 5/45 = 11,1% [4,8%, 23,5%] | — | — |
| v1 (C3) | v1 (mutex) | | 0/24 = 0% [0%, 13,8%] | 0/24 | — |

Tổng đợt này: **12 crash / 92 lần NOCOPY dưới tracker** (v2 5 + v2b 1 + v2c 0 + v2d-yên 0 +
v2-repeat 0 + v2d-load 7; cộng 2 crash ngoài hunt ở §8). Mọi crash đều lastFrame=147.

## 6. "AI FREE" — ĐÃ TRẢ LỜI (săn v2d dưới tải)

7/7 crash dưới tải đều có **RDI khớp đúng 1 dòng FREE đã log**, cùng một backtrace free duy
nhất (vd r1, r5 — các lần khác giống hệt, chỉ khác địa chỉ):

```
free (hook v2d, +0xf4)
libavutil.so.60 av_buffer_pool_uninit+0x5f
libavcodec.so.62 +0x4181e4
libavutil.so.60 av_refstruct_unref+0x65
libavcodec.so.62 +0x9a363
libavcodec.so.62 avcodec_free_context+0x2d
ffmpeg +0x156e5
ffmpeg +0x39cfd
```

Chi tiết đối chiếu (r1): FREE seq=20, addr=0x7847c5d09040, **size=2092879** (đúng cỡ Y decoder),
tid=17948; RDI crash = 0x7847c5d09040 (khớp chính xác); fault−RDI=2.073.472. Log r1 có 31 dòng
FREE (so với 49 ở lần chạy OK — tiến trình chết giữa teardown nên thiếu ~18 dòng cuối).
FREE seq 18–22 liên tiếp: 523408, 2092879, **2092879 (đích)**, 2092879, 2092879 — pool_uninit
free cả cache một lượt (giải thích lỗ 4.186.112 B ở §4).

Phân tích luồng (tid): pid=17945 (main); FREE chí mạng tid=17948 (**luồng worker — luồng
decode/input của ffmpeg CLI**, không phải main); các FREE teardown probe seq 0–2 chạy trên
main (tid=17945). Crash stack đi qua `av_buffersrc_add_frame_flags` ← ffmpeg+0x25c93 — đường
nạp frame của main thread. Vậy đây là **race xuyên luồng**: luồng decode free decoder context
(lúc EOF/drain) trong khi main thread vẫn đang đẩy frame 148 qua filter graph.

Xác minh thêm bằng objdump (binary ffmpeg đã strip nên addr2line chỉ trả về "main"):
- ffmpeg+0x156e0: `call avcodec_free_context@plt` — lệnh gọi free nằm ngay trước return address
  0x156e5; ffmpeg+0x39cfd: `call *0x18(%rbp)` (indirect call trong main). Tên hàm nội bộ
  libavcodec tại +0x4181e4/+0x9a363 không resolve được do binary strip (addr2line trả về tên
  sai/không có) — chỉ ghi offset, không đoán tên.
- Lỗ unmapped: r1 4.186.112 B (2 chunk Y kề nhau), r5 2.093.056 B (1 chunk Y) — toàn bộ chunk
  đích nằm trong lỗ (whole-chunk-in-hole), RDI = đầu chunk + 0x40.

**Kết luận §6:** người free chunk đích là **teardown pool buffer của decoder trong
`avcodec_free_context`, do ffmpeg CLI gọi trên luồng decode khi input chạm EOF/drain, trước
khi filter graph xử lý xong frame cuối**. Không phải `vs_zalloc`/`av_zalloc` của vidstab, không
phải filter graph teardown, không phải free thủ công nào trong code VCut — đây là hành vi của
ffmpeg CLI + libavcodec khi kết hợp với aliasing của vidstab.

## 7. Hiệu ứng cửa sổ / tải — tỷ lệ crash không phải hằng số

Bằng chứng quyết định: **cùng tracker v2, cùng config, chỉ khác cửa sổ thời gian** —
01:11–01:45 (tải 1–12, các luồng đợt 76 khác đang chạy): 5/24; ~02:30 (tải ~2,6, lặp lại 12
lần): **0/12**. Và v2d: cửa sổ yên 0/16 → cửa sổ có tải (3 hog CPU) **7/16**.
P(0/52 | p=11%) ≈ 0,4% nếu gom cửa sổ yên (v2c 24 + v2d 16 + v2-repeat 12) — không tương
thích với hằng số p; P(≥7/16 | p=11%) ≈ 0,1%. Tỷ lệ crash biến thiên theo cửa sổ, và tải
CPU là biến giải thích tốt nhất hiện có (các luồng decode/filter chạy trên thread khác nhau;
tải làm lệch interleaving → frame 148 có/không writable tại drain).

Hệ quả cho các kết luận trước:
- v1 0/24 (C3) **không chứng minh** v1 ức chế crash: v1 chạy ở một cửa sổ khác; v2 cũng
  0/12 khi lặp lại ở cửa sổ yên. Suy luận "mutex v1 ức chế arming/crash" ở C3 §5.3 **không còn
  đứng được** — ít nhất không phân biệt được với hiệu ứng cửa sổ.
- Ngược lại, v2d-load 7/16 chứng tỏ tracker nhẹ (silent-alloc) **không ức chế** crash khi cửa
  sổ thuận lợi — thiết kế v2d đạt mục tiêu (bắt crash + ghi được FREE).
- Số gộp đợt này (12/92 ≈ 13%) gần với không tracker C3 (11,1%) — tracker nói chung không
  làm lệch tỷ lệ crash một cách hệ thống; biến thiên quan sát được là do cửa sổ/tải.
- **Bài học phương pháp cho các đợt sau:** khi so sánh tỷ lệ crash giữa các tracker/config,
  phải chạy xen kẽ (interleaved) trong cùng cửa sổ tải, hoặc chạy dưới tải nhân tạo cố định —
  so sánh tuần tự qua các cửa sổ khác nhau sẽ nhầm hiệu ứng cửa sổ thành hiệu ứng tracker.
  (Đây cũng là lý do v2d-load dùng 3 hog CPU: tạo cửa sổ crash-prone có kiểm soát.)

## 8. Thiếu sót & nợ mở (trung thực)

- Hai crash ngoài hunt chính **không lưu stderr** (ghi nhận là thiếu sót, không có regs/stack):
  NOCOPY ×1 trong kiểm chứng v2 (SIGSEGV, log chỉ 1 event destbuf ALLOC) và NOCOPY ×1 trong
  kiểm chứng v2b (SIGSEGV, RDI `0x74e75403c040`, `rdiFreed=0` — v2b không track cỡ 2.092.879).
  Ba lần chạy NOCOPY thủ công dưới v2+segv sau đó đều exit 0 — v2 không tự gây crash.
- Hunt v2b đã tạo harness (`test_round76_d3_free_hunt_v2b.js`) nhưng **chưa chạy** (v2c thay thế
  vì v2b sai cỡ) — file vẫn stage kèm ghi chú.
- Tên hàm nội bộ libavcodec (+0x4181e4, +0x9a363) và ffmpeg (+0x156e5, +0x25c93, +0x39cfd)
  không resolve được do binary strip — chỉ ghi offset + disassembly đã kiểm chứng, không đoán.
- Thứ tự copy-vs-warp ở dạng crash (b) vẫn là chi tiết mở (xem §4).
- Công thức số học chính xác của 2.092.879 chưa rõ (xem §3).
- **Nợ chung các đợt trước (không thuộc luồng này):** NEEDS_WRITABLE (chưa chứng minh là fix —
  task cấm build); TTS 39 (gradio/pillow); birefnet 0 fps (RAM); ci-security.yml/ci-build.yml
  vẫn 403 (repo không có CI chạy thật).
- Chưa làm: săn dài hơn dưới v2d có tải để tăng mẫu crash (đã đủ 7/7 khớp — không cần thêm
  cho câu hỏi "ai free"); gdb watchpoint / ASAN build libvidstab (không cần nữa cho câu này).

## 9. Verdict production — KHÔNG ĐỔI

Giữ `copy` trước vidstabtransform (`enhance.js:183`). Không sửa code production trong luồng
này. Cơ chế đã rõ đầy đủ để một đợt sau (nếu user duyệt) vá đúng chỗ: vidstab alias buffer
decoder rồi ghi vào nó sau khi decoder context bị free — fix thuộc về phía vidstab/ffmpeg
(tách bản sao riêng cho `td->src`, hoặc giữ decoder context sống đến khi filter drain xong),
không phải phía VCut — và `copy` hiện tại đã tránh hoàn toàn đường này.

## 10. File của luồng (đã stage, xem paths file)

- `server/render/src/free_track_v2_preload.c` (mới) — tracker v2 lock-free.
- `server/render/src/free_track_v2b_preload.c` (mới) — biến thể 10 cỡ đoán (sai cỡ, đã đính
  chính bằng v2c; giữ lại làm bằng chứng âm).
- `server/render/src/free_track_v2c_preload.c` (mới) — range tracker, dùng chẩn đoán cỡ thật.
- `server/render/src/free_track_v2d_preload.c` (mới) — silent-alloc, tracker đã bắt được crash
  kèm FREE (dùng cho săn dưới tải).
- `server/render/src/test_round76_d3_free_track_v2.js` (mới) — kiểm chứng v2, **34/34 PASS**.
- `server/render/src/test_round76_d3_free_track_v2b.js` (mới) — kiểm chứng v2b, **20 PASS /
  3 FAIL** (fail do giả thuyết cỡ sai, đã đính chính).
- `server/render/src/test_round76_d3_free_track_v2d.js` (mới) — kiểm chứng v2d, **16/16 PASS**.
- `server/render/src/test_round76_d3_free_hunt.js` (mới) — hunt v2, 24/24.
- `server/render/src/test_round76_d3_free_hunt_v2b.js` (mới) — harness hunt v2b, **chưa chạy**.
- `server/render/src/test_round76_d3_free_hunt_v2c.js` (mới) — hunt v2c, 24/24.
- `server/render/src/test_round76_d3_free_hunt_v2d.js` (mới) — hunt v2d (yên 16/16 + tải 16/16).
- `docs/PHASE9_ROUND76_D3_VIDSTAB_FREETRACKER_LIMITS.md` (file này).

Môi trường: ffmpeg 8.1.2 (Ubuntu, `--disable-stripping` nhưng binary strip), libvidstab 1.1.0,
libavfilter.so.11, gcc 13.3, glibc 2.39, VM 8 GB không GPU. Clip +.trf dùng chung:
`shakynoisy1080.mp4` + `detect-shaky1080-5s.trf` (1080p, 150 frame). Ground truth sha
`d960996868d3`. Scratch (không stage): `~/workspace/.scratch-r76d3/` (runs, runs-v2b,
runs-v2d-load, runs-v2-repeat, vid.stab-1.1.0/).

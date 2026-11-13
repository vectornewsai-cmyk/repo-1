# LIMITS — Phase 9 đợt 75 C3: Phân tích regs+maps SEGFAULT vidstab — frame lỗi chính xác

Luồng C3 — đóng nợ đợt 74 §4.3 (phân tích regs+maps từ handler mới để tìm
frame lỗi chính xác: frame nào, plane nào, dest/src nào bị munmap, thời
điểm trong pipeline).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round75-c3.md`.
Harness: `server/render/src/test_round75_c3_vidstab_regs_maps.js` (31/31 PASS),
`server/render/src/test_round75_c3_vidstab_hunt.js` (săn crash chính),
`server/render/src/test_round75_c3_free_track.js` (13/13 PASS) +
`server/render/src/test_round75_c3_free_hunt.js` (săn crash dưới free-tracker).
Handler mở rộng: `server/render/src/segv_backtrace_preload.c` (thêm dòng
maps-window) + mới `server/render/src/free_track_preload.c` (theo dõi
chunk 2.073.600 byte).
Môi trường: ffmpeg 8.1.2 (Ubuntu 7:8.1.2-2ubuntu2+hatch3), libvidstab 1.1.0,
libavfilter.so.11, VM 8 GB, không GPU, gcc 13.3, glibc 2.39.
Ngày: 09/11/2026 (lượt cron 21:35 +07).

## 0. Kết quả — tóm tắt

| Câu hỏi (đợt 74 §4.3) | Trả lời |
|---|---|
| Frame nào lỗi? | **Frame n=148 (frame thứ 149/150), plane Y (plane 0), `vsFrameCopy` fast path (`frameinfo.c:137`) ← `vsTransformPrepare` `transform.c:150` (nhánh in-place). 5/5 crash của hunt chính đều ở frame 148 (lastFrame=147).** Xem §1 |
| Dest hay src bị munmap? | **Đích `td->src.data[0]` (plane Y, 2.073.600 byte) bị munmap TOÀN BỘ trước khi copy — kiểm chứng "whole-chunk-in-hole" đúng ở cả 5 mẫu (prev_end ≤ dest và next_start ≥ dest+n). Nguồn RSI còn mapped ở cả 5 mẫu.** Xem §2 |
| Length có sai không? | **Không.** RDX = 2.073.600 đúng ở 3 mẫu vòng ngược; ở 2 mẫu vòng xuôi RDX = dest+n−0x100 (mốc cuối vòng lặp, không còn là length — đã kiểm chứng bằng disassembly + crasher tổng hợp). Xem §3 |
| Thời điểm trong pipeline? | **Cuối stream, lúc flush/drain của decoder (frame 148/150, chỉ còn 1–2 frame nữa). Không phải frame ngẫu nhiên: P(5/5 cùng frame 148 \| đều) ≈ 2×10⁻⁹.** Xem §1.3 |
| Ai free chunk đích? | **CHƯA XÁC ĐỊNH ĐƯỢC.** Free-tracker đã xây + kiểm chứng xong (13/13) nhưng 2 đợt săn dưới tracker (0/24 crash) không bắt được crash nào để đối chiếu RDI — trong cả 26 lần chạy có tracker, đường direct không bao giờ được đi (td->src không được cấp phát lần nào), nên race không armed (tracker có vẻ tự ức chế arming qua mutex trên đường free — bằng chứng vừa phải, xem §5). Xem §5 |
| Sửa production? | **KHÔNG.** Giữ `copy` trước vidstabtransform (enhance.js:183). Xem §6 |

## 1. Hunt chính: 45 lần NOCOPY + showinfo — 5 crash, TẤT CẢ ở frame 148

### 1.1 Thiết kế

- Arm duy nhất A: clip gốc shakynoisy1080.mp4 5s 1920×1080 + .trf X8,
  NOCOPY, `-threads 1`, ×45, dưới handler C3 (maps-window cho
  fault/RDI/RSI + tên mapping kề), vf thêm `,showinfo` sau
  vidstabtransform + `-v info` để ghi số frame cuối cùng hoàn thành
  transform trước crash (showinfo là passthrough, không đổi pixel).
- Smoke COPY ×1 trước hunt: sha `d960996868d3…` khớp ground truth.
- WORK `~/workspace/.scratch-r75c3/runs/` (results.jsonl + summary.json +
  stderr từng lần).

### 1.2 Kết quả

| Hạng mục | Kết quả |
|---|---|
| Crash | **5/45 = 11,1% (Wilson 95% [4,8%, 23,5%])**: r1, r11, r13, r15, r24 |
| Frame crash | **5/5 ở frame n=148 (lastFrame=147, encFrame=144–146)** — frame thứ 149/150, chỉ còn frame 149 chưa transform |
| Không crash | 40 lần: 39 sha ground truth `d960996868d3…`, 1 sha lệch `eb60f4ba0c19` (race làm lệch pixel nhưng không crash — 1/40 = 2,5% [0,4%, 12,9%]) |
| So với B7 | B7: 3/45 = 6,7% [2,3%, 17,9%] (không showinfo). Khoảng tin cậy chồng nhau — **không claim showinfo làm tăng tỉ lệ crash**. Gộp (khác điều kiện, chỉ để tham khảo): 8/90 = 8,9% [4,6%, 16,6%] |
| Stack | 5/5 trùng 8/8 offset với Z6/A2/B7 (libc memcpy ← vsFrameCopy+0x38 ← vsTransformPrepare+0x116 ← libavfilter+0x417eb6 ← …) |

### 1.3 Vì sao frame 148 không phải ngẫu nhiên

- Nếu frame crash phân bố đều trên 150 frame, P(5/5 cùng đúng frame 148)
  = (1/150)⁴ ≈ 2×10⁻⁹; P(5/5 cùng rơi vào 3 frame cuối) ≈ 3×10⁻⁹.
  Con số này loại trừ "crash ở frame ngẫu nhiên".
- Giải thích phù hợp nhất (suy luận, chưa chứng minh trực tiếp): frame 148
  là lúc decoder bắt đầu flush/drain (EOF đã tới, decoder xả các frame
  delayed cuối + giải phóng hàng loạt reference buffer trong DPB). Lần
  free/trim chí mạng xảy ra trong đợt giải phóng đó — sau 147 frame ghi
  in-place làm bẩn heap, lần free lúc flush mới là lần kích hoạt trim
  unmap chunk đích. Bằng chứng phụ: encFrame lúc crash chỉ 144–146
  (encoder tụt 2–3 frame sau filter — đúng pha drain); .trf không có gì
  đặc biệt ở frame 148 (local motion (6,−24), nhỏ hơn nhiều frame khác
  như frame 144 (−60,30) hay 147 (−18,48) — đã đối chiếu trực tiếp file
  .trf — nên không phải transform của frame 148 quá lớn gây tràn warp).
- Dự đoán kiểm chứng được (đợt sau): với clip dài hơn (vd 10s/300 frame),
  crash (nếu có) vẫn rơi vào 1–2 frame cuối, không rơi giữa stream; với
  clip không B-frame (không reorder delay), pha drain ngắn khác đi.

### 1.4 Hai họ crash: vòng ngược (n=3) và vòng xuôi (n=2, lần đầu có regs)

| | Vòng ngược (r1, r11, r13) | Vòng xuôi (r15, r24) |
|---|---|---|
| RIP (lệnh lỗi) | libc+0x1a1906 — store đầu tiên của vòng lặp NGƯỢC | libc+0x1a1862 — store đầu tiên của vòng lặp XUÔI |
| fault | dest+n−128 | dest+0x40 == RDI (store đầu, chưa ghi byte nào) |
| RDI | dest (đầu chunk) | dest+0x40 (rdi đã căn 64 sau prologue) |
| RDX tại lỗi | n = 2.073.600 (giữ nguyên length) | dest+n−0x100 (mốc cuối vòng lặp — KHÔNG còn là length) |
| RSI tại lỗi | src+n−0x240 (con trỏ vòng lặp) | src+0x140 (con trỏ vòng lặp) |

- Cả hai họ đều fault ở **store ĐẦU TIÊN của vòng lặp** (chưa byte nào của
  plane được ghi bởi lần memcpy này) — chữ ký bất biến qua 5 mẫu + 3 mẫu
  B7 (tổng 8 mẫu có regs/trace cùng đường code).
- dest page offset = 0x40 ở cả 5 mẫu (dest luôn 64-aligned, offset 0x40
  trong trang — khớp av_malloc qua posix_memalign, xem §4). RDI (con trỏ
  vòng lặp lúc lỗi) offset 0x40 ở 3 mẫu vòng ngược (RDI = dest) và 0x80
  ở 2 mẫu vòng xuôi (RDI = dest+0x40 sau prologue căn 64).
  RSI loop-cursor page offset 0x200 ở 3 mẫu vòng ngược (xem §4 về
  src_base = RSI−n+0x240, offset 0x40); ở 2 mẫu vòng xuôi RSI offset
  0xfc0 (src nằm sâu trong mapping lớn của decoder pool, xem §2).

## 2. Dest bị munmap TOÀN BỘ — kiểm chứng "whole-chunk-in-hole" (5/5)

Kiểm chứng quyết định (thay cho "kích thước lỗ" thô của B7 — lỗ gộp cả
không gian địa chỉ trống xung quanh nên kích thước lỗ thô không nói lên
được gì: r1 lỗ 33.538.048 = 16,15× chunk, r11 lỗ 9.392.128, r13 lỗ
2.093.056 = đúng 1 chunk, r15 lỗ 8.372.224, r24 lỗ 8.380.416):

> **Toàn bộ vùng đích [dest, dest+n) nằm trong lỗ hổng** ⟺
> prev_end ≤ dest VÀ next_start ≥ dest+n (đọc từ maps-window của handler
> C3, tra TRƯỚC backtrace()).

| Mẫu | prev_end ≤ dest? | next_start ≥ dest+n? | next_start−(dest+n) | RDI trong lỗ? |
|---|---|---|---|---|
| r1 | ✓ (dest−prev_end = 29.352.000) | ✓ (+2.112.448) | 2.112.448 | ✓ |
| r11 | ✓ (+7.299.136) | ✓ (+19.392) | 19.392 | ✓ |
| r13 | ✓ (+64 — lỗ bắt đầu đúng trang chứa dest) | ✓ (+19.392) | 19.392 | ✓ |
| r15 | ✓ (+2.093.120) | ✓ (+4.205.504) | 4.205.504 | ✓ |
| r24 | ✓ (+3.174.464) | ✓ (+3.132.352) | 3.132.352 | ✓ |

- **5/5: toàn bộ chunk đích đã unmapped trước khi copy** (không phải chỉ
  mất trang cuối — trường hợp chỉ mất trang cuối thì RDI còn IN mapping
  ở vòng ngược (rev-tail tổng hợp) hoặc lỗ đúng 4.096 byte, đã kiểm chứng
  phân biệt được ở test 31/31).
- r13 là mẫu sạch nhất: lỗ ĐÚNG 2.093.056 byte = 511 trang, bắt đầu đúng
  trang chứa dest (prev_end = dest−0x40), kết thúc đúng tại mapping của
  src (next_start = đầu mapping src) — chữ ký教科书 của **munmap một
  mmap chunk nguyên vẹn**.
- Nguồn RSI còn IN mapping ở cả 5 mẫu (r1: mapping 511 trang; r11: 511
  trang, kết thúc đúng tại prev_end; r13: 1.022 trang = 2 chunk 511 trang
  gộp, src ở chunk thứ hai; r15/r24: mapping lớn 19 MB / 15,9 MB — arena/
  pool của decoder). Load từ nguồn đã chạy xong trước store lỗi — nguồn
  không bị gì.
- Tên mapping kề (mới ở handler C3): prev/next đều là `anon`, KHÔNG phải
  `[heap]` — chunk đích không nằm trong main heap (khớp đo trực tiếp:
  `[heap]` của tiến trình ffmpeg lúc chạy chỉ 1,79 MB, nhỏ hơn một plane
  Y 2 MB — xem §4).

## 3. Sửa lại suy luận A2 §3.1(2) — bằng chứng trực tiếp

A2 §3.1(2) từng suy luận: "fault ở vòng lặp forward nghĩa là copy đã ghi
xong phần đầu rồi mới fault ở offset sau" — từ đó loại trừ "đích bị munmap
toàn bộ". Suy luận này **SAI**, đã chứng minh bằng 2 cách độc lập:

1. **Disassembly đầy đủ `__memcpy_avx_unaligned_erms`** (glibc 2.39):
   vòng xuôi (0x1a1840–0x1a1887) có store đầu tiên tại 0x1a1862 với
   rdi = (dest căn lên 64) = dest+0x40 (khi dest 64-aligned); vòng ngược
   (0x1a18e4–0x1a192b) có store đầu tiên tại 0x1a1906 ở dest+n−128.
   **Địa chỉ lệnh lỗi (RIP) không cho biết lần lặp thứ mấy** — dest
   munmap toàn bộ cũng fault đúng tại 0x1a1862 (lần lặp 0) / 0x1a1906.
   (Chi tiết: hướng vòng lặp do glibc chọn theo `(dest−src) & 0xf00` —
   khi dest/src cùng page-aligned thì đi vòng ngược; crasher tổng hợp đã
   phải lệch src +0x200 như buffer decoder thật mới ép được vòng xuôi.)
2. **Crasher tổng hợp fwd-full** (test 31/31): dest < src, munmap toàn bộ
   dest → fault = dest+0x40 == RDI, RIP 0x1a1862, lỗ ≥ 2.076.672.
   **r15/r24 (crash thật) khớp chính xác**: fault == RDI = dest+0x40,
   RIP 0x1a1862, RDX = dest+n−0x100 (đúng mốc cuối vòng xuôi theo
   disassembly).
3. Hệ quả: giả thuyết (a) của B7 (chunk đích munmap toàn bộ trước khi
   copy) giờ **nhất quán với CẢ 8 mẫu** (5 mẫu C3 + 3 mẫu B7, cả hai họ
   vòng lặp, cả 2 mẫu vòng xuôi không regs của Z6/A2 — fault addr của
   chúng cũng có mod 0x1000 = 0x080, khớp dest+0x40 với dest offset 0x40).

## 4. Chunk đích là av_malloc, không phải malloc thuần — giải thích offset 0x40

Phát hiện phụ quan trọng (từ backtrace của free-tracker, §5):

- `vsFrameAllocate` gọi `av_mallocz` → `av_malloc` →
  `posix_memalign(64, 2073600)` — vì `ff_vs_init()` (gọi ở init của
  vidstabtransform, `vf_vidstabtransform.c:112`) gán con trỏ hàm
  `vs_zalloc` của libvidstab thành `av_zalloc` của FFmpeg (libavfilter
  import symbol `vs_malloc`/`vs_zalloc` — đã kiểm chứng bằng `nm -D`).
  Source vid.stab gốc (`_zalloc` = malloc) không còn đúng với bản
  Ubuntu đã build — allocator thật là av_malloc.
- Hệ quả đo được, khớp hoàn toàn:
  - `posix_memalign(64, 2073600)` trả về **page offset 0x40 một cách
    tất định** (đo 4/4 tiến trình mới: (base page-aligned + header
    0x10) căn lên 64 = +0x40) — giải thích RDI offset 0x40 ở cả 8 mẫu
    (B7×3 + C3×5) và src_base offset 0x40 ở các mẫu vòng ngược
    (src_base = RSI−n+0x240).
  - `malloc(2073600)` thuần trả về offset **0x10** (đo trực tiếp) — nên
    chunk đích KHÔNG THỂ là malloc mmap chunk; nó là av_malloc chunk.
  - Mapping của chunk av_malloc cỡ này đo được 510 trang (2.088.960
    byte) ở chương trình thử isolated; trong ffmpeg thật là 511 trang
    (2.093.056 byte — hơn 1 trang do VMA gộp với mapping kề). r13: lỗ
    đúng 511 trang.
- Main heap của ffmpeg lúc chạy chỉ 1,79 MB (đo trực tiếp trên tiến
  trình đang chạy) — nhỏ hơn một plane Y — nên chunk đích không thể nằm
  trong main heap; nó là mmap chunk (av_malloc) hoặc chunk trong arena
  của thread khác. Tên mapping kề `anon` (không phải `[heap]`) ở cả 5
  mẫu ủng hộ mmap chunk.
- Mở rộng: vì `vs_zalloc` = `av_zalloc`, `free()` của chunk đích là
  `av_free` → `free()` thường → munmap ngay với chunk mmap 2 MB. Bất kỳ
  lần free nào của chunk này giữa stream cũng unmap nó ngay lập tức —
  khớp với việc crash xảy ra ngay ở frame kế tiếp sau lần free đó
  (frame 148).

## 5. Free-tracker: đã xây + kiểm chứng, nhưng chưa bắt được crash để đối chiếu

### 5.1 Công cụ mới — `server/render/src/free_track_preload.c`

- Interpose `malloc` / `posix_memalign` / `free`, chỉ log chunk đúng cỡ
  2.073.600 byte kèm backtrace (ALLOC-malloc / ALLOC-memalign / FREE).
  Tra bảng hash O(1) nên overhead nhỏ; chống đệ quy bằng cờ thread-local.
- **Bài học kỹ thuật (đã trả giá bằng 1 lần fail):** bản đầu dùng
  `dlsym(RTLD_NEXT)` để resolve hàm thật — crash ngay lúc khởi động
  (COPY smoke SIGSEGV, log trống) vì loader gọi `malloc` trong lúc
  relocation, TRƯỚC khi constructor chạy, khi con trỏ hàm thật còn NULL.
  Sửa: gọi thẳng `__libc_malloc` / `__libc_free` / `__libc_memalign`
  (exported trong libc.so.6, không bị interpose) — không dlsym nữa.
  Sau sửa: unit test + COPY smoke xanh.
- Kiểm chứng: `test_round75_c3_free_track.js` **13/13 PASS** — unit
  (ALLOC/FREE đúng địa chỉ cho cả malloc lẫn memalign; malloc(1000)
  không log), COPY smoke sha ground truth dưới cả 2 preload, NOCOPY ×1
  ghi log đúng (1 ALLOC destbuf + 1 FREE uninit).

### 5.2 Phát hiện: đường direct gần như không bao giờ được đi (khi có tracker)

- Phân biệt 2 site cấp phát trong `vsTransformPrepare` bằng return offset
  (đối chiếu disassembly libvidstab hệ thống): **+0x144 = destbuf
  (dòng 158)**, **+0x17b = td->src (dòng 143)**. COPY run có cả 2
  (frame từ `copy` luôn writable → direct path → cấp td->src).
- **14/14 lần chạy NOCOPY dưới tracker (12 hunt + 2 test): chỉ có đúng
  1 ALLOC là destbuf (+0x144), td->src (+0x17b) KHÔNG BAO GIỜ được cấp
  phát** — tức là không frame nào writable, đường direct không được đi,
  race không armed, 0 crash. Log mỗi lần chỉ 2 event: 1 ALLOC-memalign
  (destbuf, frame đầu) + 1 FREE (vsFrameFree ← avfilter_graph_free,
  tức uninit lúc teardown — hợp lệ, không phải free giữa stream).
- Giải thích phù hợp nhất: `av_frame_is_writable(in)` false với hầu hết
  frame vì decoder vẫn giữ reference trong DPB (frame còn là reference
  cho các frame sau có refcount ≥ 2). Chỉ khi decoder đã thả reference
  trước lúc filter nhận frame thì frame mới writable — điều này racy
  theo thời gian decode/filter. Một khi CÓ frame writable đầu tiên,
  `td->srcMalloced=1` và mọi frame sau đều đi copy dòng 150 (race armed).
- **Chưa kết luận được tracker có ức chế arming hay không:** 0/12 crash
  dưới tracker hoàn toàn tương thích với p=11,1% (P(0/12)=24%); 0/14
  armed cũng tương thích nếu tỉ lệ armed thật ≈ tỉ lệ crash (≈11% —
  gợi ý bởi việc sha lệch gần như không xuất hiện: chỉ 1/40 lần hunt
  chính lệch sha, nên armed mà không crash có vẻ hiếm). Không claim
  tracker làm thay đổi hành vi.
- **Câu hỏi "ai free" vẫn MỞ.** Tracker đã sẵn sàng + kiểm chứng xong;
  cần đợt săn dài hơn dưới tracker (≥24 lần) để bắt 1 crash và đối chiếu
  RDI với log FREE. Batch 2 (r13–r24) đang chạy — xem §5.3.

### 5.3 Free-hunt: 0/24 crash, 0/24 armed — tracker có vẻ tự ức chế arming

- Batch 1 (r1–r12) + batch 2 (r13–r24): **0/24 crash, 0/24 lần td->src
  được cấp phát** (chỉ destbuf +0x144 trong mọi lần; 2 lần test trước đó
  cũng vậy → 26/26 lần chạy có tracker đều không armed). Smoke COPY dưới
  cả 2 preload vẫn xanh (sha ground truth) và vẫn log đủ cả 2 ALLOC
  (+0x17b và +0x144) — chứng tỏ tracker không hề miss log khi td->src
  thực sự được cấp; 0/24 là thật, không phải lỗi ghi log.
- Đối chiếu tỉ lệ armed không tracker: hunt chính có ≥11% lần armed
  (5 crash chứng minh) + tỉ lệ sha lệch ở lần không crash 4/58 ≈ 6,9%
  (B7 arm A 3/18 + C3 1/40) → ước lượng armed thật khoảng 10–20%.
  P(0/24 armed | armed=11%) ≈ 6%; P(0/24 | armed=15%) ≈ 2%.
  **Bằng chứng vừa phải (không chứng minh chặt) rằng chính tracker ức
  chế arming** — ứng viên số 1: `free()` interpose khóa mutex cho MỌI
  lần free (hàng triệu lần/chạy) + tra bảng hash, serialize các thread
  và đổi interleaving decode/filter, khiến frame không còn writable lúc
  tới filter. (Không claim chắc chắn: khoảng tin cậy 0/24 [0%, 13,8%]
  vẫn chồng với ≥11%.)
- Hệ quả: **"ai free chunk đích" vẫn MỞ.** Tracker v1 không phù hợp để
  bắt crash ở dạng hiện tại. Đề xuất đợt sau: tracker v2 lock-free
  (tra bảng không khóa trên đường free, chỉ log bằng ghi append nguyên
  tử; hoặc chỉ track ALLOC mà không track FREE trên đường nóng, và chỉ
  bật log FREE khi đã thấy ALLOC của td->src) rồi săn lại ≥24 lần.
  Dù vậy tracker v1 đã trả được 2 việc lớn: (a) chứng minh chunk đích là
  av_malloc (posix_memalign, offset 0x40 — §4); (b) chứng minh trong lần
  chạy không armed, destbuf chỉ được cấp 1 lần + free 1 lần lúc uninit
  (không có free lạ giữa stream).

## 6. Verdict production: KHÔNG sửa code, giữ `copy`

- Crash nằm đúng trong nhánh in-place (dòng 150) mà `copy` né được; 5/5
  mẫu mới củng cố verdict Y6 §4 / Z6 §4 / A2 §6 / B7 §4.
- `enhance.js:183` (`copy` ngay trước vidstabtransform) giữ nguyên.
- Không claim "`copy` khử 100% crash": tỉ lệ thật sau sửa vẫn chỉ biết
  upper bound ~4,7–6% (Y6/Z6) — không claim mới.
- Hướng sửa gốc rễ (nếu đợt sau quyết định làm, KHÔNG phải việc luồng
  này): `copy` đã là bản sửa ở tầng filter graph; fix trong
  vidstabtransform (luôn đi đường non-direct, hoặc patch
  NEEDS_WRITABLE — B7 đã chứng minh flag không chạm được cửa sổ race
  này vì frame đã writable) đều cần build ffmpeg riêng + stress đo lại
  — chưa làm.

## 7. Giới hạn và nợ mở (trung thực)

1. **"Ai free chunk đích" vẫn chưa trả lời được** — 0/24 crash dưới
   free-tracker v1 (0/24 armed; tracker có vẻ tự ức chế arming qua mutex
   trên đường free — xem §5.3). Cần tracker v2 lock-free + săn lại ≥24
   lần, hoặc chấp nhận nợ này ở mức "cơ chế đã rõ, thủ phạm chưa điểm mặt".
   Hướng khác: gdb watchpoint trên chunk td->src (nặng, đổi timing mạnh)
   hoặc ASAN build của libvidstab (cần build riêng, chưa khảo sát).
2. **Chưa có mẫu crash vòng xuôi nào dưới free-tracker** (cả 2 mẫu vòng
   xuôi r15/r24 đều ở hunt chính, không có log FREE).
3. Tỉ lệ crash dưới preload + showinfo: 5/45 = 11,1% [4,8%, 23,5%];
   không gộp với B7 (khác điều kiện showinfo) hay với native Y6.
4. Frame 148: 5/5 mẫu — mạnh nhưng n=5; dự đoán "crash luôn ở cuối
   stream" (xem §1.3) chưa kiểm chứng trên clip dài hơn / không B-frame.
5. Cơ chế "free lúc flush + trim unmap chunk" (§1.3, §4) là suy luận từ
   vị trí frame + chữ ký munmap toàn bộ — chưa có bằng chứng trực tiếp
   (backtrace của lần free). Free-tracker sinh ra đúng để lấy bằng chứng
   này.
6. Nợ chung từ các đợt trước (không thuộc luồng này): NEEDS_WRITABLE
   (chưa chứng minh là fix), TTS 39 (gradio/pillow), birefnet 0 fps
   (RAM), ci-security.yml/ci-build.yml vẫn 403 (repo không có CI chạy
   thật).

## 8. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/segv_backtrace_preload.c` — thêm maps-window
  (fault/RDI/RSI: mapping chứa nó hoặc lỗ hổng + tên mapping kề),
  tra trước backtrace().
- `server/render/src/free_track_preload.c` — mới: theo dõi chunk
  2.073.600 byte (ALLOC/FREE + backtrace).
- `server/render/src/test_round75_c3_vidstab_regs_maps.js` — mới: kiểm
  chứng handler maps-window, **31/31 PASS** (4 crasher tổng hợp +
  smoke COPY).
- `server/render/src/test_round75_c3_vidstab_hunt.js` — mới: săn crash
  chính (arm A ×45 + showinfo).
- `server/render/src/test_round75_c3_free_track.js` — mới: kiểm chứng
  free-tracker, **13/13 PASS**.
- `server/render/src/test_round75_c3_free_hunt.js` — mới: săn crash dưới
  free-tracker (×12 + batch 2 ×12).
- `docs/PHASE9_ROUND75_C3_VIDSTAB_REGS_MAPS_LIMITS.md` — tài liệu này.

Không stage: scratch `~/workspace/.scratch-r75c3/` (runs/, clip + .trf,
results.jsonl/summary.json, results-free.jsonl/summary-free.json,
stderr từng lần, free-track-*.log, c3_crasher + .so),
`/tmp/c3src/` (vid.stab v1.1.0 clone để đối chiếu),
`/tmp/c3test/` (phân tích số học + chương trình thử malloc/memalign),
log luồng `hidden_files/round75-c3.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

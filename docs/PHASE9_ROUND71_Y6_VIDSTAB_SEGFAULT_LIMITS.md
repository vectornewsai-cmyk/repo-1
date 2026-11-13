# LIMITS — Phase 9 đợt 71 Y6: SEGFAULT vidstab — 60 lần chạy có `copy` vs 30 lần đối chứng + săn stack trace

Luồng Y6 — đóng nợ đợt 70 §4 mục 9 (SEGFAULT vidstab cần ~60 lần chạy + stack
trace mới claim được `copy` ngăn crash).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round71-y6.md`.
Harness: `server/render/src/test_round71_y6_vidstab_segfault.js`
(WORK `~/workspace/.scratch-r71y6/runs/`, `results.jsonl` + `summary.json`).
Môi trường: ffmpeg 8.1.2, libvidstab 1.1.0, 4 CPU, VM 8 GB, không GPU,
gdb 15.1 (cài qua apt trong luồng này).
Ngày: 09/11/2026 (lượt cron 09:35 +07; chạy 02:44–03:33).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| COPY (production: `-threads 1` + `copy` trước vidstabtransform) | **0/60 crash**, 60/60 cùng sha framemd5 `d960996868d3…` (xác định tuyệt đối). Wilson 95% cho tỉ lệ crash thật: **[0%, 6,0%]** |
| NOCOPY (đối chứng: `-threads 1`, không copy — đúng cấu hình pha E của X8) | **3/30 crash (10,0%)**, Wilson 95% **[3,5%, 25,6%]**. Cả 3 đều SIGSEGV, file framemd5 0 byte, stderr rỗng. 27 lần không crash: 23× sha `d9609968…` + 4 sha khác nhau (spread, không xác định) |
| Kiểm định Fisher (3/30 vs 0/60) | **p = 0,035 một phía** (hai phía cũng 0,035 — bảng đã cực đoan). Có ý nghĩa ở mức 5% nhưng SÁT ngưỡng — bằng chứng "khá", chưa phải "áp đảo" |
| P(0/60 \| tỉ lệ thật = p) | p=5% (ước lượng điểm pha E): **4,6%**; p=10% (ước lượng điểm đợt này): **0,18%**; p=12,5% (gộp đợt 70: 4/32): **0,03%** |
| Gộp với X8 | NOCOPY: 1/20 (pha E) + 3/30 = **4/50 = 8,0%**, Wilson [3,2%, 18,8%]. COPY: 0/18 (X8) + 0/60 = **0/78**, Wilson 95%上限 **4,7%**; P(0/78 \| p=5%) = **1,8%** |
| Stack trace | **KHÔNG LẤY ĐƯỢC.** Core dump bị chặn ở tầng container (xem §3); gdb hunt 30 lần NOCOPY dưới gdb: **0 crash** nên không có backtrace nào để bắt |
| Verdict về `copy` | **GIỮ `copy` TRONG PRODUCTION VĨNH VIỄN.** Bằng chứng thống kê ủng hộ `copy` làm giảm mạnh tỉ lệ crash (p=0,035) + khử hoàn toàn spread (60/60 cùng sha vs 4/27 lệch ở đối chứng), chi phí 1 memcpy/frame không đáng kể. NHƯNG **không claim "khử hẳn crash 100%"** — tỉ lệ thật sau sửa vẫn có thể tới ~6% (95% CI đợt này) / ~4,7% (gộp X8) |

## 1. Thiết kế thí nghiệm (để đợt sau tái hiện được đúng)

- Cùng clip + cùng `.trf` với pha E của X8: `shakynoisy1080.mp4` 5s
  (sha `5cf533f5bcd9…`), `.trf` detect của X8 (`bdacf6df684c…`, dùng lại
  nguyên file, không detect lại). Filter graph giống hệt X8:
  `trim=start=0:end=5,setpts=PTS-STARTPTS[,copy],vidstabtransform=input='…':smoothing=10:optalgo=gauss`,
  `-threads 1`, output framemd5. Biến duy nhất giữa 2 nhánh là `copy`.
- Xen kẽ theo batch **10 COPY + 5 NOCOPY** (6 batch) để triệt tiêu trôi tải
  nền: load 1-min dao động 0,8–14,6 trong lúc đo (các luồng đợt 71 khác
  chạy song song). Trước mỗi batch kiểm tra loadavg, chờ tối đa 10×30 s
  nếu load1 > 5,0 (batch 1 chờ 2 lần; các batch sau chạy ngay khi load
  đã hạ). Wall time mỗi lần 10,3–93,4 s (COPY) / 10,3–85,4 s (NOCOPY ok)
  — nhiễu mạnh theo tải nền, KHÔNG dùng wall time để kết luận gì.
- Ghi log append từng lần chạy (`results.jsonl`) nên mất điện giữa chừng
  cũng không mất số. Mỗi lần chạy ghi: status/signal/size/sha/secs/loadavg.

## 2. Số liệu đầy đủ

### 2.1 Tiến trình theo batch

| Batch | COPY crash | NOCOPY crash | Ghi chú |
|---|---|---|---|
| 1 | 0/10 | 1/5 (r3) | NOCOPY-r3 SIGSEGV, 33,8 s, load 4,40 |
| 2 | 0/20 | 1/10 | không crash thêm |
| 3 | 0/30 | 2/15 (r11) | NOCOPY-r11 SIGSEGV, 23,7 s, load 3,05 |
| 4 | 0/40 | 2/20 | không crash thêm |
| 5 | 0/50 | 2/25 | không crash thêm |
| 6 | **0/60** | **3/30 (r27)** | NOCOPY-r27 SIGSEGV, 23,3 s, load 9,90 |

### 2.2 Crash (cả 3 đều ở nhánh NOCOPY)

| Lần | Signal | Status | File | stderr | dmesg |
|---|---|---|---|---|---|
| NOCOPY-r3 | SIGSEGV | null | 0 byte | rỗng | không có dòng nào (dmesg bị chặn, xem §3) |
| NOCOPY-r11 | SIGSEGV | null | 0 byte | rỗng | — |
| NOCOPY-r27 | SIGSEGV | null | 0 byte | rỗng | — |

Không có lần nào crash ở nhánh COPY. Không có lần nào ffmpeg exit khác 0
mà không phải SIGSEGV; không có lần nào timeout/spawn lỗi.

### 2.3 Tính xác định (sha framemd5)

- COPY: **60/60 cùng sha `d960996868d3…`** — trùng sha của 19/19 lần E
  không crash của X8 và sha ground truth U1. `copy` cho output xác định
  tuyệt đối ở cấu hình production.
- NOCOPY không crash (27 lần): 23× `d9609968…` + 4 sha khác nhau
  (`78c1e0931cdd`, `b53a300859bd`, `c518b095f15b`, `969952ab3f82`) — tức
  **4/27 (15%) lệch pixel** ngay cả khi không crash, tái khẳng định
  spread M1 của X8/W4. Khi race xảy ra thì hoặc lệch pixel (thường) hoặc
  crash (hiếm) — cùng một gốc.

### 2.4 Đọc số thống kê (trung thực)

- Fisher p=0,035: ở mức ý nghĩa 5% thì bác bỏ "2 nhánh crash như nhau".
  Nhưng p sát 0,05 và n còn nhỏ: nếu thêm 1 crash nữa vào nhánh COPY
  (1/60 vs 3/30) thì p một phía lên ~0,14 — kết luận sẽ đảo. Đây là
  bằng chứng "đủ để giữ fix", chưa phải "chắc như đinh".
- Khoảng Wilson COPY [0%, 6,0%] và NOCOPY [3,5%, 25,6%] CHỒNG NHAU
  (3,5–6,0%): khoảng CI chồng nhau không mâu thuẫn với Fisher p<0,05
  (Fisher dùng đúng phân phối siêu bội, mạnh hơn so sánh CI), nhưng nó
  nhắc rằng tỉ lệ thật của 2 nhánh có thể gần nhau hơn điểm ước lượng
  (0% vs 10%) gợi ý.
- Muốn thu hẹp CI của COPY xuống上限 ~2% cần ~150 lần chạy 0 crash nữa
  (P(0/150|p=2%)=4,9%). Không đáng làm trong một lượt: chi phí ~1 giờ
  chạy chỉ để đổi上限 6%→2%, trong khi quyết định production (giữ `copy`)
  đã rõ. Ghi lại làm nợ tùy chọn, không chặn gì.

## 3. Stack trace — KHÔNG lấy được (ghi rõ vì sao)

Đã thử 3 đường, cả 3 đều bị chặn hoặc không bắt được crash:

1. **Core dump — bị chặn ở tầng container.** `ulimit -c` soft = hard = 0;
   `ulimit -Hc unlimited` trả "Operation not permitted" ngay cả khi chạy
   với uid 0 (container thiếu CAP_SYS_RESOURCE). Đã kiểm chứng bằng chương
   trình tự gây SIGSEGV: không sinh file `core`. `libSegFault.so` không có
   trên máy; `systemd-coredump` không có; `core_pattern` hệ thống là
   `core` (tương đối theo cwd) nhưng vô nghĩa khi RLIMIT_CORE = 0.
   → Không thể lấy core dump trên VM này chừng nào giới hạn container
   còn 0. Đây là giới hạn môi trường, không phải lỗi harness.
2. **dmesg — bị chặn.** `dmesg` trả "read kernel buffer failed:
   Operation not permitted". Không có dòng segfault nào từ kernel để đối
   chiếu địa chỉ lỗi.
3. **gdb hunt (pha G) — chạy được nhưng không bắt được crash.**
   Cài gdb 15.1 qua apt (OK). Chạy 30 lần NOCOPY dưới
   `gdb -batch -ex run -ex bt …` (có bật debuginfod): **0/30 crash**,
   mọi lần đều "No stack." + framemd5 đủ 12.217 byte. P(0/30 | p=10%) =
   4,2% nếu tỉ lệ thật là 10% — vừa đủ hiếm để nghi ngờ gdb làm thay đổi
   race (ptrace serializes thread, đổi thời gian tương đối giữa decode và
   transform), vừa không loại trừ được may mắn. Vì vậy **0/30 dưới gdb
   KHÔNG được gộp vào tỉ lệ native** (môi trường chạy khác nhau), và
   cũng không dùng để claim "crash đã hết".
   - Smoke test trước đó đã chứng minh cơ chế gdb hoạt động: 1 lần chạy
     NOCOPY dưới gdb cho framemd5 sha `d9609968…` đúng + "No stack."
     khi thoát bình thường; nếu có SIGSEGV thì `bt` sẽ in stack.
   - Hướng khác chưa thử: chạy gdb hunt dài hơn (vd 100 lần, ~20 phút)
     hoặc chạy dưới `catchsegv`/valgrind — valgrind quá chậm và cũng đổi
     thời gian race; không làm trong luồng này.

**Hệ quả:** cơ chế M1 (ghi in-place lên buffer decoder → race → crash)
vẫn ở mức "giả thuyết được số liệu ủng hộ mạnh" (X8 §3.2 + đợt này:
crash chỉ xảy ra khi không có `copy`, 3/30 vs 0/60, p=0,035), chưa có
stack trace chứng minh crash nằm trong `vidstabtransform`/`vsDoTransform`.
Nợ "lấy stack trace" vẫn mở nhưng hạ ưu tiên: fix đã vào production và
đang phát huy tác dụng; stack trace giờ chỉ còn giá trị xác nhận cơ chế,
không đổi quyết định nào.

## 4. Verdict: có nên giữ `copy` vĩnh viễn không?

**CÓ — giữ vĩnh viễn, trừ khi có bằng chứng mới rằng `copy` gây hại.**
Căn cứ:
- (a) Crash: 0/60 vs 3/30, Fisher p=0,035 — giảm có ý nghĩa thống kê.
- (b) Spread: 0 frame khác trong 60 lần (60/60 cùng sha) vs 4/27 lệch
  ở đối chứng — `copy` khử hoàn toàn tính không xác định, không chỉ crash.
- (c) Chi phí: 1 memcpy/frame (~6 MB/frame 1080p), X8 đã đo không tách
  được khỏi nhiễu tải nền; không có hồi quy nào đo được.
- (d) Không có ứng viên thay thế tốt hơn: `crop=iw:ih` không cứu được
  (X8 B2: 133–135/150); `split→nullsink` xâm lấn hơn nhiều (W4 X4);
  sửa `AVFILTERPAD_FLAG_NEEDS_WRITABLE` cần build ffmpeg riêng (nợ dài
  hạn, X8 §5 mục 2).
- Điều KHÔNG được claim: "`copy` khử hẳn 100% crash". Tỉ lệ thật sau sửa
  vẫn có thể tới ~6% (CI đợt này) / ~4,7% (gộp X8). Nếu production sau
  này gặp SIGSEGV ở stabilize dù đã có `copy`, đó không phải bằng chứng
  fix sai — mà là phần đuôi thống kê chưa đo tới. Khi đó mới cần quay lại
  đo thêm / lấy trace.

## 5. Giới hạn và nợ mở (trung thực)

1. Stack trace vẫn chưa có (xem §3) — cần môi trường cho phép core dump
   (VM khác / container nới RLIMIT_CORE) hoặc gdb hunt dài hơn nhiều.
   Hạ ưu tiên, không chặn gì.
2. Tỉ lệ crash thật sau sửa chỉ biết上限 ~6% (đợt này) / ~4,7% (gộp X8),
   chưa biết có đúng bằng 0 không. Muốn上限 ~2% cần thêm ~150 lần 0 crash.
   Tùy chọn, không khuyến nghị làm ngay.
3. Chỉ đo ở 1080p 5s h264, `-threads 1`, clip tổng hợp shakynoisy. Chưa đo
   lại crash ở 720p / VP9 / clip 60 s / 4K với n lớn — nhưng spread ở các
   cấu hình đó đã 0 với `copy` (X8), và cơ chế race là một, nên rủi ro
   còn lại được coi là cùng bậc.
4. gdb hunt 0/30 gợi ý gdb có thể ức chế race — mọi đo crash tương lai
   dưới gdb/valgrind/ASAN phải ghi rõ "số dưới công cụ debug, không gộp
   với số native".
5. Nợ cũ còn mở (không thuộc luồng này): log `r.signal` trong render.js
   khi ffmpeg bị kill (đợt 67 §7 mục 6) — lần này crash được phát hiện nhờ
   harness đọc `r.signal` trực tiếp; render.js vẫn chưa log signal.
   Sửa `AVFILTERPAD_FLAG_NEEDS_WRITABLE` (build ffmpeg riêng) vẫn là nợ
   dài hạn (X8 §5 mục 2).

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round71_y6_vidstab_segfault.js` — harness mới:
  60 COPY + 30 NOCOPY xen kẽ theo batch, chờ máy yên trước batch,
  ghi append từng lần chạy, pha G gdb hunt 30 lần.
- `docs/PHASE9_ROUND71_Y6_VIDSTAB_SEGFAULT_LIMITS.md` — tài liệu này.

Không stage: log luồng `hidden_files/round71-y6.md` (log nội bộ, không
thuộc repo), scratch `~/workspace/.scratch-r71y6/` (framemd5 + stderr +
gdb log thô), `/tmp/y6-smoke.framemd5`, `/tmp/y6-coretest/`.
Không push — chờ user nhắn "push đi" từ main chat.

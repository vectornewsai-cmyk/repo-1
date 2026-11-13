# LIMITS — Phase 9 đợt 72 Z6: SEGFAULT vidstab — log `r.signal` + STACK TRACE ĐÃ BẮT ĐƯỢC bằng LD_PRELOAD

Luồng Z6 — đóng nợ đợt 71 §5 mục 6 (SEGFAULT vidstab: stack trace vẫn
chưa có; nợ cũ log `r.signal` trong render.js khi ffmpeg bị kill).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z6.md`.
Harness: `server/render/src/test_round72_z6_trace_hunt.js`
(WORK `~/workspace/.scratch-r72z6/runs/`, `results.jsonl` + `summary.json`
+ `NOCOPY/r3.stderr` — file stderr gốc của lần crash).
Môi trường: ffmpeg 8.1.2, libvidstab 1.1.0, libavfilter.so.11, VM 8 GB,
không GPU, gcc 13.3. Ngày: 09/11/2026 (lượt cron 12:35 +07).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Log `r.signal` trong render.js | **XONG** — 2 chỗ (thông báo lỗi cuối + cảnh báo fallback GPU); test mới **17/17 PASS**; không đổi hành vi (vẫn exit 2), `copy` giữ nguyên |
| Stack trace vidstab | **🎯 BẮT ĐƯỢC — LẦN ĐẦU TIÊN.** Crash N-r3: SIGSEGV trong `libvidstab vsFrameCopy+0x38` ← `vsTransformPrepare+0x116` ← `libavfilter.so.11+0x417eb6` (vidstabtransform) — xác nhận trực tiếp cơ chế M1 (X8 §3.2 / W4) |
| Core dump | **Vẫn bị chặn** — kiểm chứng lại từ đầu (xem §3): RLIMIT_CORE soft=hard=0, root cũng không nâng được; chương trình tự segfault exit 139, KHÔNG sinh file core |
| gdb hunt | **KHÔNG chạy được đợt này** — gdb không còn trên máy (lần cài apt của Y6 không tồn tại qua phiên); cài lại bị chặn bởi dpkg lock do các luồng đợt 72 khác đang apt liên tục (xem §3). Không còn cần gấp: đường LD_PRELOAD đã bắt được trace |
| Tỉ lệ crash thật sau sửa | **KHÔNG ĐỔI, không claim mới** — vẫn上限 ~4,7% (gộp X8: COPY 0/78) / ~6% (đợt Y6: COPY 0/60). Số 1/3 của hunt là arm riêng dưới preload, KHÔNG gộp với số native |

## 1. Sửa code production: log `r.signal` (nhỏ, chỉ thêm log)

File: `server/render/src/render.js` (chỉ file này được sửa trong luồng này).

- **Thông báo lỗi cuối (khi ffmpeg fail):** trước đây chỉ in
  `ffmpeg thoát với mã null` khi ffmpeg bị kill bởi signal (spawnSync
  trả `status=null`). Giờ: nếu `r.signal` có thì in
  `ffmpeg bị kill bởi signal SIGSEGV (status=null) — render thất bại`
  (+ 1 dòng gợi ý tài liệu vidstab riêng cho SIGSEGV); nếu không có
  signal thì vẫn in `thoát với mã <status>` như cũ. Vẫn `process.exit(2)`,
  vẫn giữ file tạm (.trf/.ass/PNG) để debug.
- **Cảnh báo fallback GPU (encoder GPU fail lúc encode thật):** cùng
  cách tính `failDetail` — trước đây in `thoát mã null`, giờ in
  `bị kill bởi signal SIGSEGV (status=null)` khi bị kill.
- **KHÔNG đổi:** hành vi retry, mã thoát, thứ tự dọn file tạm,
  và đặc biệt **KHÔNG đụng `copy` trước vidstabtransform**
  (`server/render/src/enhance.js` dòng 183 còn nguyên; self-test
  enhance assert `,copy,vidstabtransform=` vẫn PASS).

Test mới: `server/render/src/test_round72_z6_signal_log.js` — chạy
render.js THẬT với fake ffmpeg (trả lời đúng các probe `-version` /
`-filters` / `nullsrc`, tự kill theo `FAKE_FF_MODE` khi tới lệnh encode):
5 case, **17/17 PASS**:

| Case | Kỳ vọng | Kết quả |
|---|---|---|
| Encode SIGSEGV (libx264) | exit 2, stderr có `signal SIGSEGV` + `(status=null)`, có dòng gợi ý vidstab, không còn `thoát với mã null` | ✅ |
| Encode SIGKILL (OOM-kill) | exit 2, `signal SIGKILL`, không có gợi ý vidstab | ✅ |
| Encode exit 1 (không signal) | exit 2, `thoát với mã 1`, không log signal | ✅ |
| `--encoder h264_nvenc` + SIGSEGV | cảnh báo fallback có signal + thông báo lỗi cuối (sau retry libx264) vẫn có signal | ✅ |
| Render thật bằng ffmpeg thật | exit 0, MP4 17.789 byte, stderr không có thông báo lỗi/signal | ✅ |

Case GPU chạy với `HOME` trỏ vào thư mục tạm để
`clearGpuProbeCache()` của nhánh fallback không xoá cache probe chung.
Kiểm chứng kèm theo: `npm run test:unit` **7/7** (lut/effects/sticker/
chroma/textfx/keyframes/mask), `enhance.js --self-test` **PASS**,
`node --check` render.js + 2 test mới OK.

## 2. Stack trace — BẮT ĐƯỢC (phương pháp mới: LD_PRELOAD)

### 2.1 Vì sao dùng LD_PRELOAD thay gdb/core

- Core dump bị chặn (xem §3), gdb hunt 30 lần của Y6 bắt được 0 crash
  (pha G) — và gdb dùng ptrace nên có thể tự ức chế race (Y6 §3.3).
- Đường mới: thư viện nhỏ `server/render/src/segv_backtrace_preload.c`
  (gcc `-shared -fPIC`, ~16 KB .so) cài handler SIGSEGV bằng
  `backtrace()`/`backtrace_symbols_fd()` rồi re-raise để process vẫn
  chết bởi đúng signal (caller thấy `status=null, signal=SIGSEGV`).
  Handler chỉ cài lúc load, không ptrace → gần như không đổi thời gian
  tương đối của race decode→transform.
- Smoke kiểm chứng trước hunt: (a) chương trình tự segfault + preload
  → in backtrace, vẫn chết SIGSEGV (exit 139); (b) `/bin/true` +
  preload → chạy bình thường; (c) **COPY ×1 dưới preload cho sha
  framemd5 `d960996868d3…` — khớp ground truth của Y6/X8** → preload
  không đổi output. Hunt chỉ chạy sau khi smoke này PASS.

### 2.2 Lần crash bắt được: N-r3

Hunt: đúng cấu hình pha E của X8 / nhánh NOCOPY của Y6 (cùng clip
`shakynoisy1080.mp4` 5s sha `5cf533f5bcd9…` + cùng `.trf` của X8,
`-threads 1`, output framemd5), NOCOPY ×30, dừng ngay khi bắt được
1 crash. Kết quả: **N-r1, N-r2 OK (sha `d960996868d3…`), N-r3 CRASH
ở 46,1 s, load 0,58** → dừng hunt (đủ 1 backtrace).

Backtrace đầy đủ (file gốc: `.scratch-r72z6/runs/NOCOPY/r3.stderr`):

```
[segv_backtrace] caught signal 11 (Segmentation fault), fault addr=0x757d5fc85080
segv_backtrace_preload.so(+0x134a)
libc.so.6(+0x45330)                          ← signal trampoline
libc.so.6(+0x1a1862)                         ← frame libc chưa đặt tên được (xem §2.4)
libvidstab.so.1.1(vsFrameCopy+0x38)
libvidstab.so.1.1(vsTransformPrepare+0x116)
libavfilter.so.11(+0x417eb6)                 ← vidstabtransform filter_frame (static, không tên)
libavfilter.so.11(+0x1853b0)                 ← filter graph (static, không tên)
libavfilter.so.11(av_buffersrc_add_frame_flags+0x168)
ffmpeg(+0x25c93)
ffmpeg(+0x39cfd)
libc.so.6(+0x9cb84)
libc.so.6(+0x129ecc)
```

### 2.3 Đọc trace — cơ chế M1 được xác nhận trực tiếp

- **Crash nằm trong đường transform của vidstab, không phải decode:**
  `av_buffersrc_add_frame_flags` (đẩy frame vào graph) →
  filter_frame của vidstabtransform → `vsTransformPrepare` →
  `vsFrameCopy` → fault. Đây là bằng chứng trực tiếp đầu tiên rằng
  crash xảy ra đúng ở bước transform (giả thuyết M1 của X8 §3.2 / W4
  trước đây chỉ có số liệu thống kê ủng hộ: crash chỉ xảy ra khi không
  có `copy`, 3/30 vs 0/60, Fisher p=0,035).
- **Fault addr `0x757d5fc85080` khác null** (địa chỉ heap) — KHÔNG phải
  null-deref; phù hợp với memcpy trong `vsFrameCopy` đọc/ghi qua
  con trỏ frame đã sai (buffer bị decoder dùng lại / ghi đè — đúng
  bản chất race in-place mà `copy` khắc phục bằng cách đưa cho
  transform một bản copy tươi, ổn định).
- **Hệ quả cho production: không đổi** — `copy` vẫn giữ vĩnh viễn
  (verdict Y6 §4 giữ nguyên). Trace này chỉ xác nhận cơ chế, không đổi
  quyết định nào.

### 2.4 Giới hạn của trace (trung thực — đừng đọc quá)

- **Chỉ 1 mẫu crash (n=1).** Không claim mọi lần crash đều cùng stack
  này — nhưng cơ chế là một, và 3 lần crash native của Y6 đều cùng
  dạng (SIGSEGV, file 0 byte, stderr rỗng) nên khả năng cao là cùng gốc.
- **ffmpeg và mọi .so đều stripped** (`nm`: "no symbols" cho cả
  `libavfilter.so.11` và `libvidstab.so.1.1`): 2 frame libavfilter
  (`+0x417eb6`, `+0x1853b0`) không có tên hàm — chỉ suy ra frame
  `+0x417eb6` là filter_frame của vidstabtransform từ vị trí trong
  chuỗi gọi (nằm giữa `vsTransformPrepare` và graph code), KHÔNG
  xác minh được bằng symbol. `addr2line` trả `??:?` cho mọi offset.
  Muốn tới dòng source cần gói `-dbgsym` (nợ tùy chọn, xem §5).
- Frame libc `+0x1a1862` ngay dưới `vsFrameCopy` chưa đặt tên được;
  khả năng là memcpy (vsFrameCopy copy plane bằng memcpy) nhưng
  **không xác minh được — không claim**. (Lưu ý: `addr2line` với chỉ
  dynamic symbols gán nhầm thành `__nss_database_lookup` — đó là
  artefact, không phải tên thật.)
- **Số 1/3 của hunt KHÔNG phải tỉ lệ crash mới.** Hunt là arm riêng
  dưới preload (chạy tới khi bắt được 1 crash thì dừng — thiết kế đã
  thiên vị dừng sớm), P(bắt ≥1 trong 3 lần | p thật 10%) = 27% — bắt
  được ở lần thứ 3 là may mắn thuận lợi, không phải đo tỉ lệ. Tỉ lệ
  crash thật sau sửa vẫn chỉ biết上限 ~4,7% (gộp X8) / ~6% (Y6) như cũ.
  2 lần không crash dưới preload đều cho sha `d960996868d3…` (khớp
  ground truth) — preload không gây spread.
- Lỗi harness đã tìm ra và sửa trong luồng này: regex trích backtrace
  trong `test_round72_z6_trace_hunt.js` tìm `"(0x"` trong khi
  `backtrace_symbols_fd` in dạng `"(+0x…"` / `"(func+0x…"` nên
  `summary.json`/`results.jsonl` ban đầu chỉ giữ được dòng header.
  Đã sửa regex thành `/\+0x[0-9a-f]+\)\[/` và vá lại `summary.json` +
  `results.jsonl` từ file stderr gốc (13 dòng đầy đủ) — dữ liệu không
  mất vì stderr từng lần chạy vẫn lưu riêng.

## 3. Core dump + gdb — kiểm chứng lại từ đầu (vẫn chặn)

**Core dump — bị chặn ở tầng container (giống Y6, kiểm chứng lại độc lập):**

- `ulimit -c` soft = hard = 0; `ulimit -Hc unlimited` trả
  "Operation not permitted" ngay cả khi chạy với uid 0 (container thiếu
  CAP_SYS_RESOURCE).
- Chương trình C tự gây SIGSEGV (null-deref, gcc `-O0 -g`): exit 139,
  **không sinh file `core` nào trong cwd**.
- `core_pattern` = `core` (tương đối theo cwd) nhưng vô nghĩa khi
  RLIMIT_CORE = 0; `core_uses_pid` = 0; `suid_dumpable` = 0;
  `systemd-coredump` không có; `libSegFault.so` không có.
- `dmesg` vẫn bị chặn như Y6 (không có dòng segfault kernel để đối chiếu).

**gdb — không chạy được đợt này:**

- `which gdb` → không có. Lần cài apt của Y6 (gdb 15.1) **không tồn
  tại qua phiên** (môi trường đã reset).
- Thử cài lại: `apt-get update` xong (gdb 15.1-1ubuntu1~24.04.1 có
  candidate), nhưng `apt-get install -y gdb` thất bại **4 lần + 1 vòng
  retry 15 lần** vì dpkg lock-frontend liên tục bị các process apt-get
  khác giữ luân phiên (pid 815 → 5894 → 6090 → 6287 → 6368…, gần như
  chắc chắn là các luồng đợt 72 khác đang cài package song song) — lần
  nào lock vừa rảnh cũng có process khác lấy trước.
- **Không còn cần gấp:** đường LD_PRELOAD đã bắt được trace và ít làm
  nhiễu race hơn gdb; gdb hunt giờ chỉ còn giá trị dự phòng. Nếu đợt
  sau cần gdb thì cài lúc máy yên (ngoài giờ cao điểm vòng lặp).

## 4. Verdict: `copy` trong production

**Giữ nguyên vĩnh viễn** (như Y6 §4). Trace đợt này củng cố thêm:
crash nằm đúng trong `vsTransformPrepare`/`vsFrameCopy` của vidstab —
bước mà `copy` bảo vệ bằng cách đưa cho transform một buffer ổn định.
Không claim "`copy` khử 100% crash": tỉ lệ thật sau sửa vẫn có thể tới
~4,7–6% (95% CI). Nếu production sau này gặp SIGSEGV ở stabilize dù
đã có `copy`, giờ đã có log `r.signal` (§1) để phân biệt SIGSEGV với
SIGKILL/SIGTERM ngay trong stderr của render — và có sẵn harness
preload (§2) để săn trace lại.

## 5. Giới hạn và nợ mở (trung thực)

1. **Tỉ lệ crash thật sau sửa vẫn chỉ biết上限 ~4,7–6%** (Y6) — không
   claim mới từ đợt này. Muốn上限 ~2% cần thêm ~150 lần 0 crash (tùy
   chọn, không khuyến nghị làm ngay).
2. **Chỉ 1 mẫu stack trace (n=1)** — 2 frame libavfilter chưa đặt tên
   được (stripped). Muốn tới dòng source: cài gói `-dbgsym` của
   ffmpeg/libvidstab rồi `addr2line` lại các offset
   (`libavfilter.so.11+0x417eb6/+0x1853b0`, `libc.so.6+0x1a1862`) —
   tùy chọn, giá trị chủ yếu là xác nhận thêm, không đổi quyết định.
3. **gdb hunt chưa chạy lại đợt này** (cài gdb bị chặn bởi dpkg lock,
   xem §3) — nợ hạ ưu tiên vì đã có trace bằng preload.
4. **Nợ dài hạn còn nguyên:** sửa `AVFILTERPAD_FLAG_NEEDS_WRITABLE`
   (build ffmpeg riêng, X8 §5 mục 2) — fix gốc rễ thay cho `copy`.
5. Nợ cũ "log `r.signal` trong render.js" (đợt 67 §7 mục 6 / Y6 §5
   mục 5) — **ĐÃ ĐÓNG trong đợt này (§1)**.

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/render.js` — log `r.signal` (2 chỗ, chỉ thêm log).
- `server/render/src/test_round72_z6_signal_log.js` — test mới 17/17.
- `server/render/src/segv_backtrace_preload.c` — thư viện LD_PRELOAD.
- `server/render/src/test_round72_z6_trace_hunt.js` — harness săn trace.
- `docs/PHASE9_ROUND72_Z6_VIDSTAB_SEGFAULT_LIMITS.md` — tài liệu này.

Không stage: log luồng `hidden_files/round72-z6.md` (log nội bộ, không
thuộc repo), scratch `~/workspace/.scratch-r72z6/` (framemd5 + stderr +
summary hunt), `/tmp/z6core/`, `/tmp/z6dbg/`, `/tmp/z6hunt.log`,
`/tmp/z6re.js`, `/tmp/z6fix.js`. Không push — chờ user nhắn "push đi"
từ main chat.

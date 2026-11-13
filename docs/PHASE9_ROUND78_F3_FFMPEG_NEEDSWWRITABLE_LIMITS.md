# LIMITS — Phase 9 đợt 78 F3: ffmpeg NEEDS_WRITABLE cho vidstabtransform (nợ đợt 77 §4.3)

Luồng F3 — đóng nợ §4.3 của đợt 77: build ffmpeg riêng với patch
NEEDS_WRITABLE + stress lại đúng setup F, so crash rate patch vs control
NOCOPY ở 720p/360p (n≥15/arm) + thêm arm 1080p có power cao.
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round78-f3.md`.
Harness: `server/render/src/test_round78_f3_needswritable_stress.js`.
Build script + patch: `server/render/src/build_ffmpeg_needswritable.sh` +
`server/render/src/vidstabtransform-needswritable.patch`.
Môi trường: ffmpeg stock 8.1.2 (Ubuntu 7:8.1.2-2ubuntu2+hatch3),
libvidstab 1.1.0, VM 4 vCPU EPYC 9D25, 8 GB, không GPU, cell chia sẻ
1,5 CPU. Ngày: 10/11/2026 (lượt cron 06:35 +07 → luồng chạy ~06:40–08:30).
Clip + .trf dùng chung với E3/B7: `shakynoisy1080.mp4` (150 frame, 5 s,
30 fps) + `detect-shaky1080-5s.trf`; `shaky720.mp4` + `shaky720.trf`;
`shaky360.mp4` + `shaky360.trf`. Ground truth sha framemd5:
1080p `d960996868d3…`, SPLIT 720p `397ba4e1a870…`, SPLIT 360p `414e114fe57c…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Build ffmpeg đã patch | **THÀNH CÔNG.** 1 dòng patch, configure minimal, build ~17 phút. Binary 8.1.2 chạy đúng, sha output khớp ground truth. |
| Patch có chạm được race không | **CÓ — bằng chứng sha mạnh.** Output của bản patch ổn định tuyệt đối và trùng đúng đường non-direct (SPLIT/COPY) ở cả 3 kích thước; stock NOCOPY lệch sha 15/15 ở 720p/360p. Fisher p ≈ 1×10⁻⁸. |
| Patch có giảm crash không | **KHÔNG CÓ BẰNG CHỨNG — thí nghiệm thiếu power ở cửa sổ này.** 0 crash trên cả 90 lần chạy, kể cả arm control. Control NOCOPY 1080p 0/15, KHÔNG tái hiện được tỉ lệ lịch sử 7/10 của F (Fisher p=0,00025). Không được dùng 0/15 để claim "patch khử crash". |
| Khuyến nghị triển khai ffmpeg tự build | **CHƯA ĐỦ BẰNG CHỨNG VỀ CRASH — quyết định thuộc về đợt sau/user.** Bằng chứng sha + cơ chế ủng hộ patch, nhưng endpoint crash chưa đo được. Hướng rẻ hơn (SPLIT, không cần build riêng) vẫn chưa được thử lại đúng setup có power — nên thử SPLIT trước khi chọn NEEDS_WRITABLE. |
| Sửa production | **KHÔNG.** `copy` trước vidstabtransform giữ nguyên (`enhance.js:183`). |
| Khớp RDI→FREE theo khoảng | **Đã verify đúng** trên dữ liệu thật F-r2 của E3 (bắt được +0x40 mà khớp chính xác bỏ sót). Không có crash nào trong đợt này để áp dụng. |

## 1. Build ffmpeg riêng với patch NEEDS_WRITABLE — THÀNH CÔNG

Patch (1 dòng, vào input pad của `vf_vidstabtransform.c`, dòng 278):

```diff
     {
         .name         = "default",
         .type         = AVMEDIA_TYPE_VIDEO,
+        .flags        = AVFILTERPAD_FLAG_NEEDS_WRITABLE,
         .filter_frame = filter_frame,
         .config_props = config_input,
     },
```

Hằng `AVFILTERPAD_FLAG_NEEDS_WRITABLE` định nghĩa tại
`libavfilter/filters.h:59` của FFmpeg n8.1.2; pattern khớp
`vf_colorkey.c` và ~20 filter in-place khác của upstream.

- Deps: `sudo apt-get install -y libvidstab-dev nasm` (OK; gcc/make/
  pkg-config đã có). libvidstab-dev 1.1.0, nasm 2.16.01.
- Source: tarball đợt 77 `~/workspace/.scratch-r77e3/ffmpeg-n8.1.2.tar.gz`
  (16.872.873 byte, khớp số E3 ghi), giải nén vào
  `~/workspace/.scratch-r78f3/FFmpeg-n8.1.2/` — ngoài cây production.
- Configure minimal (`--disable-everything` + chỉ bật thành phần cần
  cho stress: h264 decode, mov demux, framemd5/null mux, rawvideo
  encoder, các filter trim/setpts/vidstabtransform/vidstabdetect/
  showinfo/scale/format; `--enable-gpl --enable-libvidstab`, nasm asm
  bật). `make -j3`, install vào
  `~/workspace/.scratch-r78f3/ffmpeg-nw-install/`.
- Thời gian build: ~17 phút (23:44→00:01 UTC) dưới tải cao (loadavg
  7–27 do các luồng đợt 78 khác chạy vite/Chrome song song).
- Kết quả: `ffmpeg-nw-install/bin/ffmpeg` 5.282.072 byte, version 8.1.2,
  `ldd` link đúng libvidstab hệ thống 1.1.0 (cùng lib với stock).
  **Khác biệt duy nhất có chủ đích so với stock là flag
  NEEDS_WRITABLE.** Binary unstripped `FFmpeg-n8.1.2/ffmpeg_g`
  (20.106.264 byte) giữ lại để symbolize backtrace bằng addr2line
  nếu cần (không cần dùng trong đợt này vì 0 crash).
- Lưu ý trung thực: build này link static libav* (mặc định của
  configure), trong khi stock Ubuntu dùng `--enable-shared` — layout
  binary khác nhau (offset backtrace sẽ khác), nhưng code đường đi
  decode/filter/vidstab là cùng source n8.1.2 và cùng libvidstab hệ
  thống. Không claim hai binary "giống hệt nhau ngoài flag".

## 2. Smoke test (trước stress) — PASS, kèm 1 quan sát ngoài stress

Lệnh (không hog, không preload, `-v error`, chain F: trim 0:5 +
vidstabtransform smoothing=10 optalgo=gauss + showinfo, output framemd5):

- Patched 1080p NOCOPY: sha `d960996868d3…` = **khớp ground truth
  tuyệt đối**. Patch không làm lệch pixel.
- Stock 1080p NOCOPY (chạy ngay sau, cùng cửa sổ): **SEGFAULT**,
  output 0 byte (sha file rỗng `e3b0c44…`). Đây là quan sát NGOÀI
  stress (không tính vào số liệu §3): baseline ở cửa sổ hiện tại
  vẫn crash được cả khi không có tracker/hog — nhưng chỉ 1 mẫu,
  không kết luận gì từ nó. Ghi nhận để đợt sau khỏi ngạc nhiên khi
  control thỉnh thoảng crash ngoài hunt.

## 3. Stress — thiết kế và kết quả

Thiết kế (harness `test_round78_f3_needswritable_stress.js`, WORK
`~/workspace/.scratch-r78f3/runs/`, `results.jsonl` + `summary.json` +
stderr + free log từng lần; khôi phục từ results.jsonl nếu bị kill):

- ĐÚNG setup F của E3 §1.3: `LD_PRELOAD =
  free_track_v2d_preload.so:segv_backtrace_preload.so` (binary .so
  của D3, không biên dịch lại), `showinfo` cuối chuỗi filter,
  `-v info`, `-threads 1`, 3 hog CPU, không chờ máy yên.
- 6 arm × n=15, **xen kẽ nghiêm ngặt theo vòng** (mỗi vòng chạy 1 lần
  mỗi arm, chung cửa sổ tải): A720NW / B720NC / C360NW / D360NC /
  E1080NW / F1080NC. 720p/360p là arm bắt buộc theo task; 1080p là arm
  có power cao nhất (baseline lịch sử 44–70%).
- Khớp RDI→FREE theo **KHOẢNG** (`addr ≤ RDI < addr+size`), sửa lỗi
  khớp chính xác của script F (E3 §1.3). Đã verify logic này trên dữ
  liệu thật F-r2 của E3 trước khi stress: RDI `0x71a3e9105080`,
  FREE seq=20 addr `0x71a3e9105040` size 2092879 → khớp chính xác = 0,
  khớp theo khoảng = 1 (offset +0x40 = +64). ĐÚNG.
- Sự cố giữa chừng: lần chạy đầu bằng `nohup … &` từ exec đã CHẾT
  sau 3 lần chạy (cùng lúc ffmpeg D360NC-r1 đang chạy dở) — không có
  OOM trong dmesg, bộ nhớ còn ~5 GB trống; nguyên nhân nhiều khả năng
  là runtime dọn process group khi exec session kết thúc. 3 lần chạy
  đã ghi được bảo toàn trong results.jsonl. Chạy lại bằng exec trực
  tiếp (tracked session) — khôi phục từ results.jsonl, D360NC-r1
  chạy lại. Tổng stress ~70 phút (87 lần chạy lại + 3 lần đầu).
  Bài học: không dùng `nohup &` detached từ exec; chạy harness làm
  lệnh exec chính để runtime theo dõi.

### 3.1 Tỉ lệ crash — 0/90, KHÔNG phân biệt được (Fisher p=1,0)

| Arm | Cấu hình | N | Crash | Wilson 95% |
|---|---|---|---|---|
| A720NW | patched 720p NOCOPY | 15 | **0** | [0, 0,2039] |
| B720NC | stock 720p NOCOPY | 15 | **0** | [0, 0,2039] |
| C360NW | patched 360p NOCOPY | 15 | **0** | [0, 0,2039] |
| D360NC | stock 360p NOCOPY | 15 | **0** | [0, 0,2039] |
| E1080NW | patched 1080p NOCOPY | 15 | **0** | [0, 0,2039] |
| F1080NC | stock 1080p NOCOPY | 15 | **0** | [0, 0,2039] |
| **Tổng** | | **90** | **0** | NC gộp 0/45 → [0, 0,0787] |

- Fisher exact 2-sided cho crash, cả 3 cặp NW-vs-NC: **p=1,0**.
  Không có bằng chứng nào về việc patch giảm (hay tăng) crash.
- **Control không tái hiện được baseline lịch sử** — đây là phát
  hiện phương pháp quan trọng nhất của đợt này:
  F1080NC 0/15 vs E3-F 7/10 → Fisher **p=0,00025**;
  vs D3 v2d-load 7/16 → p=0,0068; gộp NC 0/45 vs E3-F 7/10 →
  p≈1×10⁻⁶. P(0/15 | p=0,70) = 1,4×10⁻⁸; P(0/15 | p=0,438) =
  1,8×10⁻⁴. Tức tỉ lệ crash thật ở cửa sổ này thấp hơn hẳn cửa sổ
  D3/E3 (upper bound Wilson 0/45 = 7,9%), dù load1 từng lần chạy
  dao động 0,30–24,81 (trung vị 6,74) và có nhiều lần chạy ở load
  >15 (vd F1080NC-r3 load 23,50 vẫn không crash; E1080NW-r2 load
  21,29 không crash).
- Tất cả 90 lần chạy đều lastFrame=149 (chạy hết 150 frame 0..149),
  không lần nào dừng giữa chừng. Thời gian chạy trung vị: 1080p
  ~93 s, 720p ~31 s, 360p ~9 s (dưới tải chung của các luồng đợt 78).

### 3.2 Tín hiệu sha — patch KHỬ HOÀN TOÀN biểu hiện race ở mức pixel (720p/360p)

| Arm | Sha (không crash) | Số sha khác nhau |
|---|---|---|
| A720NW | 15/15 `397ba4e1a870…` (= sha SPLIT 720p của E3) | **1** |
| B720NC | 15 sha khác nhau, mỗi sha 1 lần | **15** |
| C360NW | 15/15 `414e114fe57c…` (= sha SPLIT 360p của E3) | **1** |
| D360NC | 15 sha khác nhau, mỗi sha 1 lần | **15** |
| E1080NW | 15/15 `d960996868d3…` (= ground truth) | **1** |
| F1080NC | 14/15 `d960996868d3…`, 1× `66084d08eff4…` (r12, load 16,16) | **2** |

- Fisher exact 2-sided cho "sha lệch" (divergent): 720p NW 0/15
  vs NC 15/15 → **p ≈ 1×10⁻⁸**; 360p tương tự **p ≈ 1×10⁻⁸**;
  1080p NW 0/15 vs NC 1/15 → p=1,0 (ở 1080p race hiếm khi lệch
  pixel — khớp E3 arm A: 13/15 ground truth, 1/15 lệch).
- Đọc đúng mức: sha ổn định của bản patch **không phải** bằng chứng
  crash — nó là bằng chứng **cơ chế**: với flag, mọi frame đều được
  copy sang buffer mới trước transform nên output đi đúng đường
  non-direct (destbuf riêng), trùng pixel tuyệt đối với SPLIT
  (cũng ép non-direct) ở 720p/360p và với COPY/ground truth ở 1080p.
  Ngược lại, stock NOCOPY ở 720p/360p cho sha khác nhau MỖI lần —
  đúng như B7 đã đo (10/10 khác nhau): race làm lệch pixel ở mọi
  kích thước nhỏ, dù không tới mức crash. Patch khử được biểu hiện
  này 15/15 ở cả hai kích thước.
- Đây là kết quả mạnh nhất của đợt này, và nó khớp đúng dự đoán cơ
  chế của E3 §3.2: `td->src` được cấp ngay từ frame 0 (do frame 0
  đã writable) nên mọi copy in-place sau đó ghi vào buffer riêng
  của vidstab. Không claim đã "nhìn thấy" đường đi direct/non-direct
  (filter stock không log) — chỉ claim output trùng đúng đường
  non-direct, như E3 §3.1 đã cẩn thận ghi.

## 4. Vì sao setup F không tái hiện tỉ lệ crash lịch sử? (giả thuyết, chưa kiểm chứng)

Thí nghiệm này giữ nguyên protocol F (cùng .so tracker, cùng chain,
cùng 3 hog, xen kẽ), nhưng control 0/15 trong khi D3/E3 đo 7/16 và
7/10. Các giả thuyết (chưa tách factor, ghi để đợt sau kiểm tra):

1. **VM đổi phần cứng:** E8 đo VM nay là 4 vCPU EPYC 9D25, trong khi
   RESULTS.md ghi 2 vCPU 7D13. Nếu D3/E3 chạy trên VM 2 vCPU thì
   timing decode-vs-filter khác hẳn; chưa rõ thời điểm VM đổi.
2. **Cell CPU bị throttle:** cell của luồng này chia sẻ 1,5 CPU —
   3 hog `yes` chỉ chạy ~11% CPU mỗi tiến trình, tức contention thật
   do hog tạo ra nhỏ hơn nhiều so với con số loadavg gợi ý; load cao
   trong đợt này chủ yếu đến từ các luồng đợt 78 khác (vite/Chrome),
   không phải từ hog của chính hunt.
3. **Cửa sổ tải khác:** tỉ lệ crash nhạy với setup VÀ cửa sổ (E3
   §1.3 đã chứng minh setup nhạy hơn tải); cửa sổ lần này có thể
   chỉ đơn giản là yên hơn đối với race này, dù loadavg có lúc lên 24.
4. **Không phải do tracker:** cùng binary .so D3, cùng chain — loại
   trừ được sai khác công cụ.

Dù nguyên nhân là gì, hệ quả thực hành đã rõ: **muốn đo tỉ lệ crash
thì phải kiểm tra control crash được TRƯỚC khi chạy arm ứng viên**
(VD chạy 5 lần NOCOPY 1080p setup F trước; nếu 0/5 thì dừng, đổi
cửa sổ/setup, đừng đốt 90 lần chạy vào một cửa sổ không có power).
Đợt này đã không làm bước kiểm tra đó — ghi nhận làm bài học.

## 5. Khuyến nghị triển khai (bằng chứng, không phải quyết định)

Quyết định cuối thuộc về đợt sau/user. Luồng này chỉ đưa bằng chứng:

- **Ủng hộ patch:** cơ chế đúng như E3 §3.2 dự đoán; sha ổn định
  tuyệt đối ở cả 3 kích thước, trùng đúng đường non-direct; khử hoàn
  toàn biểu hiện race ở mức pixel tại 720p/360p (Fisher p≈1×10⁻⁸).
  Build khả thi (17 phút, 1 dòng patch, deps apt có sẵn).
- **Chưa đủ để quyết:** endpoint crash chưa đo được (0/90 cả hai
  phía). Không được lấy 0/15 làm bằng chứng "patch khử crash".
- **Chi phí triển khai nếu chọn NEEDS_WRITABLE:** binary tự build
  phải được pin version + cập nhật bảo mật theo upstream; đồng bộ
  sang máy khác (dev/CI/máy user); build hiện tại là static libav*
  (khác layout với stock shared); VCut hiện dùng ffmpeg hệ thống —
  đổi sang binary tự build là dependency triển khai mới (như B7
  §3.3 đã khảo sát).
- **Hướng rẻ hơn nên thử trước:** SPLIT (E3 §3.1) — chỉ đổi chuỗi
  filter, không cần build riêng — nhưng E3 đo SPLIT ở setup segv-only
  thiếu power (0/15, Fisher p=1,0). Bước tiếp theo đúng đắn là chạy
  lại SPLIT-vs-NOCOPY đúng setup F **trong một cửa sổ mà control
  crash được** (kiểm tra control trước, xem §4 cuối). Nếu SPLIT
  đứng vững ở đó thì không cần ffmpeg tự build; chỉ khi SPLIT thất
  bại mới cân nhắc NEEDS_WRITABLE.
- **Không thay `copy`:** production giữ nguyên `copy` trước
  vidstabtransform. Không có gì trong đợt này đổi verdict đó.

## 6. Giới hạn và nợ mở (trung thực)

1. Crash rate: 0/90 cả hai phía — thí nghiệm KHÔNG có power cho
   endpoint crash ở cửa sổ này. Mọi claim về crash đều phải chờ
   hunt có power (control crash được).
2. Đường đi direct/non-direct của transform không quan sát trực tiếp
   được từ filter stock — bằng chứng là sha output trùng đường
   non-direct, không phải log đường đi.
3. Build minimal chỉ bật thành phần cần cho stress (không có audio,
   không có encoder ngoài rawvideo, không có demuxer ngoài mov).
   Binary này CHỈ để đo, không phải binary production.
4. So sánh sha ở 1080p yếu (NC chỉ lệch 1/15) — đúng như E3 đã
   biết: ở 1080p race hiếm khi lệch pixel.
5. Không tách factor được vì sao cửa sổ này yên (VM 4 vCPU? cell
   throttle? cửa sổ tải?) — xem §4, cần đợt sau kiểm tra.
6. Không có mẫu crash nào nên logic khớp RDI→FREE theo khoảng chưa
   được áp dụng trên dữ liệu mới — chỉ mới verify trên dữ liệu cũ
   F-r2 của E3 (§3).
7. Smoke test stock SEGFAULT (1 mẫu, ngoài stress) không tính vào
   số liệu — ghi nhận, không kết luận.
8. Nợ chung các đợt trước (không thuộc luồng này): TTS 39
   (gradio/pillow); npm 5 CVE (E5, chuyển đợt 78); kernel upscale
   BC(0,25, 0,375) chưa nối vào chrome-resample.mjs; G1/G2 chưa phân
   biệt được; ci-security.yml/ci-build.yml vẫn 403; release gate giữ
   nguyên (KHÔNG release/tag).

## 7. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/vidstabtransform-needswritable.patch` — patch
  1 dòng cho `vf_vidstabtransform.c`.
- `server/render/src/build_ffmpeg_needswritable.sh` — script build
  ffmpeg 8.1.2 minimal đã patch (idempotent, ghi log configure/
  make/install vào scratch).
- `server/render/src/test_round78_f3_needswritable_stress.js` —
  harness stress 6 arm × n=15 đúng setup F, xen kẽ theo vòng, khớp
  RDI→FREE theo khoảng, Fisher exact 2-sided, khôi phục từ
  results.jsonl.
- `docs/PHASE9_ROUND78_F3_FFMPEG_NEEDSWWRITABLE_LIMITS.md` — tài liệu này.

Không stage: cây build + binary `~/workspace/.scratch-r78f3/`
(FFmpeg-n8.1.2/, ffmpeg-nw-install/, runs/, smoke/, *.log),
log luồng `hidden_files/round78-f3.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

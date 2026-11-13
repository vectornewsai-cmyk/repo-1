# LIMITS — Phase 9 đợt 83 K10: vidstab race — kiểm chứng 2 chế độ + thử sửa

Luồng K10 — dùng harness per-frame của J1 để kiểm chứng cơ chế race
2 chế độ vidstab (I1) và thử sửa bằng A/B có power. Log chi tiết:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round83-k10.md`.
Harness: `server/render/src/test_round83_k10_vidstab_race_fix.js` (kế thừa
J1 + arm probe + test poison 3-plane).
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3), ffmpeg
NW-build của F3 (NEEDS_WRITABLE), libvidstab 1.1.0, VM 4 vCPU EPYC 9D25,
~8 GB RAM, không GPU, cell chia sẻ 1,5 CPU.
Ngày: 10–11/11/2026 (lượt cron 00:35 +07; luồng chạy ~00:40–03:00 +07).
Clip + .trf dùng chung với E3/F3/G3/H1/I1/J1: `shakynoisy1080.mp4`
(150 frame, 5 s, 30 fps) + `detect-shaky1080-5s.trf`;
`shaky720.mp4` + `shaky720.trf`. Ground truth sha cả file: 1080p
`d960996868d3…`, 720p `397ba4e1a870…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Chế độ (a) buffer-reuse giữa stream | **TÁI HIỆN.** D720NC lệch **844/1500 frame (56,3%)**, mỗi run trung vị 87 (70–91) — khớp I1/J1 (882/1500). 64 frame hệ thống. |
| Chế độ (b) UAF lúc drain/EOF | **KHÔNG tái hiện trong stress K10 (0/30 run NC-family), nhưng KHÔNG bác bỏ được.** Smoke N720NULL r1 bắt thêm 1 ca poison-like n=148 (frac ~0,74). Gộp I1+J1+K10: 4/54 run có n=148 poison-like (Wilson 95% [2,9%, 17,6%]); K10 0/30 tương thích với tỉ lệ này (P(0/30 \| 7,4%) ≈ 0,10). |
| Probe (a): passthrough thuần (`null`, `format`) | **KHÔNG khử.** N720NULL 867/1500 vs D720NC 844/1500, permutation p=0,40; M720FMT 871/1500, p=0,34. Giả thuyết "đổi pha/nhịp pull là đủ" **BỊ BÁC**. |
| Probe: tpad đúng 1 frame (TPAD1) | **KHỬ HOÀN TOÀN.** T720PAD1 **0/1500** frame thật, 10/10 run đều 0, permutation vs D720NC p=1,08×10⁻⁵ (sàn); == G720CPPAD1 tuyệt đối (whole-sha `7924aa52b6af` 10/10 cả hai). 1 frame pad đã đủ — không cần 6 frame. |
| Probe: NEEDS_WRITABLE (F3) | **KHỬ HOÀN TOÀN ở mức per-frame.** W720NW **0/1500**, 10/10 run đều 0, permutation vs D720NC p=1,08×10⁻⁵; == F720CP (p=1,0). Xác nhận F3 (mức whole-sha 15/15) bằng endpoint có power. |
| Probe (c): OMP_NUM_THREADS=1 | **KHÔNG đổi gì.** D720NC-OMP 869/1500 (trung vị 87, 86–88) vs D720NC đa luồng 844/1500, permutation p=0,39. Song song OpenMP nội bộ libvidstab **KHÔNG phải** cơ chế. (Phụ: chạy nhanh ~2×, 10,5 s vs 23,4 s; spread per-run chặt hơn.) |
| 1080p | **Vẫn không power.** A1080NC 1/1500 (r10 n=7, chỉ V lệch, ΔmeanY 0); mọi cặp 1080p p=1,0. Test poison 3-plane mới: 0 ở mọi arm 1080p — tín hiệu J1 r8/r10 n=148 không tái hiện trong 10 run K10. |
| Crash | **0/130 stress + 0/20 OMP + 0/7 smoke = 0/157 run K10.** Gộp F3+G3+H1+I1+J1+K10: **0/507 lần chạy.** Mọi claim vẫn chỉ ở mức "khử biểu hiện pixel", không claim "khử crash". |
| Sửa production | **KHÔNG sửa.** Không có biện pháp nào đủ chín để ship (xem §4.3). Production `copy` giữ nguyên. |

## 1. Đọc source trước khi đo (J1 §4.3 mục 1)

### 1.1 vf_vidstabtransform.c (FFmpeg 8.1.2, cây F3)

`filter_frame` ĐỒNG BỘ, KHÔNG giữ gì qua các lần gọi: đọc
`in->data[plane]` vào `VSFrame inframe` cục bộ (con trỏ thô), gọi
`vsTransformPrepare(td, &inframe, &inframe)` (direct, khi
`av_frame_is_writable(in)`) hoặc vào `outframe` riêng (non-direct),
rồi `vsDoTransform`, `vsTransformFinish`, `av_frame_free(&in)` nếu
non-direct, forward `out`. Không `av_frame_ref/clone`, không cache.
Nghĩa là: bản thân filter không giữ frame qua lần gọi — chỗ giữ (nếu
có) phải nằm ở libvidstab bên trong hoặc ở tầng graph/decoder pool.

### 1.2 vf_tpad.c (cùng cây)

- Chế độ clone ở cuối: `s->cache_stop = av_frame_clone(frame)` — giữ
  REF (cùng AVBuffer, refcount+1) tới frame MỚI NHẤT, cập nhật mỗi
  frame. Chỉ giữ đúng 1 frame cuối.
- `activate()`-based (pull theo nhu cầu downstream), khác với
  null/format/transform dùng `filter_frame` (push).
- Đây là 3 điểm khác biệt cấu trúc của tpad so với passthrough thuần:
  (i) giữ ref 1 frame cuối, (ii) pull theo nhu cầu, (iii) thêm frame
  ở EOF. Probe T720PAD1 không tách được 3 điểm này — xem §5.2.

### 1.3 libvidstab (hệ thống)

- `nm -D /usr/lib/x86_64-linux-gnu/libvidstab.so.1.1`: libvidstab link
  `libgomp` và dùng `omp_get_max_threads` / `omp_get_num_threads` /
  `omp_set_num_threads` — **libvidstab dùng OpenMP (đa luồng BÊN
  TRONG transform)**. Đây là nguồn song song nội bộ chưa từng được xét
  ở các đợt trước → probe OMP_NUM_THREADS=1 ở §3.5 (kết quả: bác bỏ).
- Source `transform.c` KHÔNG có trên đĩa (`find / -name transform.c
  -path *vidstab*` = 0 kết quả; `apt-get source vidstab` fail vì
  không có deb-src). Chưa xác nhận được `vsTransformPrepare` có lưu
  con trỏ frame qua lần gọi hay không — nợ cho đợt sau.

## 2. Harness K10 + hồi cứu J1 (0 compute mới cho hồi cứu)

### 2.1 Harness mới

`server/render/src/test_round83_k10_vidstab_race_fix.js` — kế thừa J1
(setup F + taskset pin ffmpeg+hog cores 0-1 + LD_PRELOAD v2e +
segv_backtrace + chống sóng EPERM: writeRetry, ffmpeg retry I/O,
resume từ results.jsonl), thêm:

- Arm probe (13 arm × n=10 = 130 run): A1080NC, C1080CP, G1080CPPAD,
  P1080PAD, D720NC, F720CP, G720CPPAD, P720PAD (8 arm J1 giữ nguyên)
  + N720NULL (`null` trước transform), M720FMT (`format=yuv420p`
  trước transform), T720PAD1 (`tpad=stop_mode=clone:stop_duration=
  0.034` = đúng 1 frame pad — 0,033 cho 0 frame do làm tròn),
  G720CPPAD1 (GT family pad1), W720NW (chuỗi NC chạy bằng binary
  NW-build của F3).
- Filter `fifo` (J1 §4.3 đề xuất) **KHÔNG còn tồn tại ở ffmpeg 8.1.2**
  (đã bỏ từ ffmpeg 7.0) — thay bằng `format=yuv420p` làm passthrough
  thứ hai, độc lập với `null`.
- So W720NW trực tiếp với GT F720CP (F3 §3.2 đã chứng minh NW-NC ==
  CP output ở mức whole-sha 15/15, nên không cần arm CP-NW riêng;
  kiểm chứng sau đo: W720NW 0/1500 vs F720CP, systematicFrames 0 —
  không có lệch hệ thống, so sánh hợp lệ).
- Test poison 3-plane `poisonAnyTest` (J1 §5.6: test Y-only THIẾU cho
  1080p vì U/V 1080p 518.400 byte > TRACK_MIN nên CŨNG bị poison) +
  endpoint đăng ký TRƯỚC "frame n=148 có plane poison" (chế độ b).
  Định nghĩa poisonAny: frame ĐÃ lệch theo framemd5, có ≥1 plane p
  thỏa cả 4 điều kiện: f.mean[p] >= 150, f.stdev[p] < 25,
  g.mean[p] < 150, mean đã đi ít nhất nửa đường tới 165. Đây là test
  POISON NẶNG (frac ~0,9–1,0 — đúng 2 ca J1 r8/r10 n=148); poison một
  phần nhẹ do test Y-only bắt (Y). Unit test 8/8 PASS (Y-only,
  3-plane, chroma-only, clean, normal-diverged, bright-GT guard,
  partial-Y heavy-test-miss + Y-only-catch).
- Arm dùng ffmpeg riêng (`arm.ffmpeg`); ghi `ffmpeg` vào record.

### 2.2 Hồi cứu aliasing offset trên dữ liệu J1 (nợ I1 §5.7b)

Script /tmp/k10-alias-offset.js, /tmp/k10-alias-offset2.js (không stage,
chỉ phân tích dữ liệu đã có): trong 882 frame lệch của D720NC (J1),
chỉ **6/882** khớp checksum Y với BẤT KỲ frame output nào của arm COPY
trong toàn clip (±150), và cả 6 đều ở offset 0 (Y y hệt GT frame đó,
chỉ U/V lệch = lệch chroma-only). Đọc ĐÚNG mức: test này KHÔNG có
power để bác bỏ giả thuyết buffer-reuse — vì transform áp cho frame n
là transform #n (theo chỉ số frame), nên "transform #n áp lên input
m" cho output khác cả CP-output-m (transform #m) lẫn CP-output-n
(input n). Test đúng cần clip mà mỗi input frame có danh tính đọc
được (vd mỗi frame một mức xám riêng + transform identity) — đề xuất
cho đợt sau (xem §5.3), không làm trong K10.

## 3. Stress đầy đủ (13 arm × n=10 = 130 run, 0 crash)

Chạy 3 chặng do sóng EPERM + VM restart (xem §3.6): chặng 1 dừng sau
17 run (EPERM giết write r2.stderr sau 150 retry/5 phút); chặng 2
dừng sau 12 run nữa (VM restart, SIGTERM); chặng 3 resume chạy nốt
101 run, exit 0. Tổng wall ~1 h 50 phút. 0 run thiếu dòng stats
quarantine. 720p trung vị 20–25 s/lần, 1080p trung vị 70–79 s/lần
(chặng 3 máy yên dần, loadavg từ ~13 xuống ~1).

### 3.1 Bảng per-arm (endpoint chính: frame lệch THẬT / run)

| Arm | Frame lệch / tổng | Mỗi run: trung vị (min–max) | Vùng mid/drain/pad | Plane lệch Y/U/V | POISON-LIKE / POISON-ANY (thật) | POISON-ANY n148 |
|---|---|---|---|---|---|---|
| A1080NC | 1/1500 (0,0007) | 0 (0–1) | 1/0/0 | 2/2/3* | 0 / 0 | 0 run |
| C1080CP | 0/1500 | 0 (0–0) | 0/0/0 | 2/2/2* | 0 / 0 | 0 run |
| G1080CPPAD | 0/1560 | 0 (0–0) | 0/0/0 | 2/2/2* | 0 / 0 | 0 run |
| P1080PAD | 0/1560 | 0 (0–0) | 0/0/0 | 2/2/2* | 0 / 0 | 0 run |
| D720NC | **844/1500 (0,5627)** | **87 (70–91)** | **786/58/0** | 839/845/846 | **0 / 0** | **0 run** |
| F720CP | 0/1500 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 | 0 run |
| G720CPPAD | 0/1560 | 0 (0–0) | 0/0/0 | 3/3/3* | 0 / 0 | 0 run |
| P720PAD | **0/1560** | **0 (0–0)** | **0/0/0** | 4/4/4* | 0 / 0 | 0 run |
| N720NULL | **867/1500 (0,5780)** | **86,5 (83–89)** | **809/58/0** | 864/869/870 | **0 / 0** | **0 run** |
| M720FMT | **871/1500 (0,5807)** | **87 (85–91)** | **813/58/0** | 860/869/870 | **0 / 0** | **0 run** |
| T720PAD1 | **0/1560** | **0 (0–0)** | **0/0/0** | 0/0/0 | 0 / 0 | 0 run |
| G720CPPAD1 | 0/1560 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 | 0 run |
| W720NW | **0/1500** | **0 (0–0)** | **0/0/0** | 3/3/3* | 0 / 0 | 0 run |

(* plane lệch ở arm 0-frame-lệch theo framemd5 là NHIỄU PARSE showinfo
đã biết (I1 §5.5, J1 §3.1): checksum showinfo lệch 1–4 frame trong khi
md5 = 0 — không phải lệch thật. D720NC: ΔmeanY frame lệch trung vị 0,5
(min −2, max 11); N720NULL: trung vị 1 (min −2, max 11); M720FMT:
trung vị 1 (min −2, max 26). GT ổn định tuyệt đối ở cả 5 family.)

Per-run chi tiết: D720NC [74, 88, 91, 86, 88, 84, 86, 70, 89, 88]
(trung bình 84,4 — r1=74 và r8=70 thấp hơn dải J1 86–92, giống dải
rộng của H1 46–90: spread per-run nhạy với tải máy); N720NULL [87,
87, 86, 89, 86, 86, 88, 83, 86, 89]; M720FMT [88, 91, 87, 86, 86,
87, 86, 87, 88, 85]. Frame hệ thống (>=8/10 run cùng Y checksum):
D720NC 64, N720NULL 68, M720FMT 62 (J1: 48; I1: ~60) — thành phần tất
định vẫn rõ. Whole-sha: D720NC/N720NULL/M720FMT 10 sha khác nhau
(mỗi run 1 sha); T720PAD1 == G720CPPAD1 whole-sha `7924aa52b6af`
10/10 cả hai; W720NW == GT `397ba4e1a870…` 10/10; A1080NC 9/10 GT +
1 sha lạ r10 (`ebce5e52aa1f`, frame n=7 lệch V-only, ΔmeanY 0).

### 3.2 So sánh A/B (endpoint chính: permutation trên số frame lệch THẬT/run)

| Cặp | Frame thật | Fisher gộp | Permutation per-run |
|---|---|---|---|
| F720CP-vs-D720NC (endpoint chính) | 0 vs 844/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| P720PAD-vs-D720NC (replicate J1) | 0 vs 844/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| P720PAD-vs-F720CP | 0 vs 0/1500 | p=1,0 | p=1,0 — PAD == COPY tuyệt đối |
| N720NULL-vs-D720NC (probe a) | 867 vs 844/1500 | p=0,42 | **p=0,40 — KHÔNG khác** |
| M720FMT-vs-D720NC (probe a) | 871 vs 844/1500 | p=0,34 | **p=0,34 — KHÔNG khác** |
| T720PAD1-vs-D720NC (probe tpad1) | 0 vs 844/1500 | p≈0 | **p=1,08×10⁻⁵ (sàn)** |
| T720PAD1-vs-G720CPPAD1 | 0 vs 0/1500 | p=1,0 | p=1,0 — TPAD1 == CPPAD1 tuyệt đối |
| W720NW-vs-D720NC (probe NW) | 0 vs 844/1500 | p≈0 | **p=1,08×10⁻⁵ (sàn)** |
| W720NW-vs-F720CP | 0 vs 0/1500 | p=1,0 | p=1,0 — NW == COPY tuyệt đối |
| Mọi cặp 1080p | 0–1 vs 0–1 | p=1,0 | p=1,0 — không power |

### 3.3 Chế độ (b): poison — 0 trong stress K10, nhưng không bác bỏ được

- Stress K10: poisonLike (Y-only) 0/2582 frame lệch NC-family
  (D720NC 0/844, N720NULL 0/867, M720FMT 0/871); poisonAny (3-plane)
  0 ở mọi arm, kể cả 1080p; endpoint đăng ký trước "n=148 poison":
  0/10 run ở cả 4 arm NC (D720NC, N720NULL, M720FMT, A1080NC).
- Nhưng smoke K10 (N720NULL r1, trước stress) bắt thêm **1 ca
  poison-like n=148**: meanY 145, stdevY 38,2 (GT 34,6), U/V y hệt
  GT, poisonFrac ~0,74 — quan sát độc lập thứ 4 ở cùng frame n=148
  (sau I1 smoke ~51%, I1 stress r2 ~99%, J1 stress r5 ~87%). Ca này
  poisonAny = 0 (mean 145 < 150, stdev 38,2 > 25) — đúng như thiết
  kế: poison một phần chỉ test Y-only bắt được; test heavy 3-plane
  không thay thế được Y-only.
- Gộp I1+J1+K10 (đếm run NC-family): **4/54 run** có n=148
  poison-like (I1: smoke + stress r2; J1: stress r5; K10: smoke
  N720NULL r1), Wilson 95% **[2,9%, 17,6%]**; chỉ tính stress:
  2/50 = 4,0% [1,1%, 13,5%]. Per frame lệch (stress): 2/4346 =
  0,046% [0,01%, 0,17%]. K10 stress 0/30 tương thích với tỉ lệ gộp
  (P(0/30 | 7,4%) ≈ 0,10; P(0/30 | 4,0%) ≈ 0,29) — **0/30 không
  phải bằng chứng chống lại chế độ (b)**, chỉ là hiếm.
- 1080p: J1 r8/r10 n=148 (post-hoc, 2/20 run) không tái hiện trong
  10 run K10 (0/10, endpoint đăng ký trước). Gộp 1080p: 2/30 run.
  Test poisonAny mới hoạt động đúng (unit 8/8) nhưng chưa bắt được
  ca nào — cần thêm run mới có power cho endpoint 1080p.

### 3.4 Smoke K10_N=1 (WORK ~/workspace/.scratch-r83k10/smoke) — XONG, exit 0, 228 s

7 arm 720p, mỗi arm 1 run (validate chuỗi trước stress): D720NC
86/150; F720CP 0/150; N720NULL 91/150 (+ poison-like n=148, xem
§3.3); M720FMT 89/150; T720PAD1 0/151; G720CPPAD1 0/151; W720NW
0/150. Mẫu smoke khớp stress (chỉ khác D720NC r1 stress = 74, trong
dải H1). TPAD1 cho đúng 151 frame (10 dòng header framemd5 + 151).

### 3.5 Probe OMP_NUM_THREADS=1 (giả thuyết (c)) — XONG, exit 0, ~5 phút

WORK riêng `~/workspace/.scratch-r83k10/omp1`, 2 arm × n=10
(D720NC + F720CP, OMP_NUM_THREADS=1 qua env thừa kế xuống ffmpeg):

| Arm (OMP=1) | Frame lệch / tổng | Mỗi run: trung vị (min–max) | Frame hệ thống |
|---|---|---|---|
| D720NC | **869/1500 (0,5793)** | **87 (86–88)** | 72 |
| F720CP | 0/1500 | 0 (0–0) | 0 |

- D720NC-OMP vs D720NC-đa-luồng: trung bình 86,9 vs 84,4,
  permutation p=0,39 — **KHÔNG khác**. Giả thuyết (c) "song song
  OpenMP nội bộ libvidstab gây race" **BỊ BÁC** bằng test có power.
- Phụ: OMP=1 chạy nhanh ~2× (trung vị 10,55 s vs 23,4 s) và spread
  per-run chặt hơn hẳn (86–88 vs 70–91) — OpenMP gây overhead +
  nhiễu timing dưới tải, nhưng không gây race. Không crash (0/20).
- Bằng chứng OMP_NUM_THREADS=1 có hiệu lực: thời gian chạy đổi hẳn
  (~2× nhanh) — nếu libvidstab tự set số luồng nội bộ thì không có
  thay đổi này. (Không đo trực tiếp số luồng libvidstab tạo ra.)

### 3.6 Sóng EPERM + VM restart (hậu cần, không phải kết quả đo)

- Sóng EPERM tái phát lần nữa trong chặng 1 (~18:10–18:20 UTC
  10/11): ffmpeg D720NC-r2 chết vì lỗi I/O 3 lần, rồi ghi r2.stderr
  fail sau 150 retry (5 phút) → harness chết (uncaught throw ở
  writeRetry), dừng sau 17/130 run. Probe ghi lúc 18:20: 5/5 OK —
  sóng đã qua. Đây là lần EPERM thứ 3 trong 3 ngày (09/11, 10/11
  ~15:48, 10/11 ~18:10) — sóng lặp lại, không tuyên bố "đã hết".
- VM restart giữa chặng 2 và 3 (~18:25–18:30 UTC, uptime reset về
  1 phút): chặng 2 chết SIGTERM sau 12 run nữa (tổng 29 record).
  Không còn tiến trình `yes`/ffmpeg sót. Resume từ results.jsonl
  hoạt động cả 2 lần (không chạy lại run đã có; D720NC-r2 partial
  được ghi đè sạch — phân tích cuối không còn dấu vết file partial).

## 4. Cơ chế + đọc kết quả probe

### 4.1 Kết quả thực nghiệm (chắc chắn)

1. **(a) Đổi pha/nhịp pull của graph — BỊ BÁC.** Hai passthrough độc
   lập (`null`, `format=yuv420p`) đều không đổi gì: 867 và 871 vs 844
   frame lệch, permutation p=0,40 / 0,34. Thêm một node filter không
   khử được race. (J1 §4.2 giả thuyết (a) giờ đã có câu trả lời.)
2. **(c) Song song OpenMP nội bộ libvidstab — BỊ BÁC.** OMP=1 cho
   cùng tỉ lệ lệch (869 vs 844, p=0,39). Race không nằm trong
   transform đa luồng.
3. **Họ (b) giữ ref / đổi quyền sở hữu buffer — ĐƯỢC ỦNG HỘ.** Cả 4
   biện pháp thuộc họ này đều khử tuyệt đối: `copy` (0/1500, các đợt
   trước + K10), NEEDS_WRITABLE (0/1500), tpad 6 frame (0/1560, J1 +
   replicate K10), tpad 1 frame (0/1500). Hai passthrough không giữ
   ref/copy đều thất bại. Phân biệt sạch theo đúng ranh giới
   "giữ ref hoặc copy" vs "không giữ gì".
4. **1 frame pad đã đủ.** T720PAD1 khử cả 786 frame lệch mid-stream,
   không chỉ ở drain — nên "bảo vệ cửa sổ drain dài" KHÔNG phải lời
   giải thích cho TPAD1. Thành phần hoạt động phải là thứ tpad làm
   với MỌI frame (giữ ref frame cuối / pull theo nhu cầu), không phải
   số frame pad.
5. **Chế độ (b) UAF drain vẫn tồn tại nhưng hiếm** (xem §3.3): 4/54
   run có n=148 poison-like; K10 stress 0/30 tương thích. Crash vẫn
   0/507 gộp — không claim "khử crash" cho bất kỳ biện pháp nào.

### 4.2 Cơ chế — CHƯA RÕ PHẦN LÕI (không claim)

Sau khi bác (a) và (c), câu hỏi còn lại: trong 3 điểm khác biệt của
tpad (§1.2), điểm nào là thành phần hoạt động — (i) giữ ref
`cache_stop` tới frame cuối, (ii) pull theo nhu cầu (activate),
hay (iii) thêm 1 frame ở EOF? Dữ liệu K10 không tách được 3 điểm
này. Lưu ý: filter_frame của transform là đồng bộ và không giữ frame
(§1.1), decode/filter là đơn luồng (`-threads 1`, CLI đơn luồng),
nên "decoder ghi đè buffer trong lúc transform đọc" vẫn chưa có lời
giải thích cơ chế đầy đủ — khả năng còn lại là libvidstab giữ con
trỏ frame thô qua lần gọi (chưa đọc được source `transform.c`) hoặc
hành vi queue/pool của graph ở tầng chưa đo. Không đoán mò thêm.

### 4.3 Quyết định: KHÔNG sửa production từ đợt này

- Không đổi code production, không đổi chuỗi filter production, không
  đề xuất ship tpad/NEEDS_WRITABLE lúc này:
  - TPAD1 thêm 1 frame vào output (phải trim lại sau transform) và
    thành phần hoạt động chưa rõ — ship lúc này là cargo-cult (lập
    trường J1 §4.2 giữ nguyên).
  - NEEDS_WRITABLE cần ship ffmpeg tự build thay cho ffmpeg hệ thống
    (quyết định hạ tầng, thuộc về parent/user; F3 đã nêu).
  - Production `copy` đã đạt 0/1500 ở mọi endpoint đo được — không
    có lý do đo được nào để đổi.
- Giá trị của đợt này là PHÂN BIỆT CƠ CHẾ: (a) và (c) bị bác bằng
  test có power, họ (b) được ủng hộ, và TPAD1 rút gọn "bảo vệ drain"
  xuống còn 1 frame — thu hẹp không gian tìm kiếm cho đợt sau (§5.2).

## 5. Giới hạn và nợ mở (trung thực)

1. **Endpoint crash vẫn mở.** 0/130 stress K10 (0/20 OMP, 0/7
   smoke); gộp F3+G3+H1+I1+J1+K10: **0/507 lần chạy**. Mọi claim chỉ
   ở mức "khử biểu hiện pixel", không claim "khử crash" cho
   copy/NW/tpad.
2. **Endpoint per-frame chỉ mạnh ở 720p.** Ở 1080p NC chỉ lệch 1/1500
   (r10 n=7, V-only) — không có power; mọi cặp 1080p p=1,0. Test
   poisonAny 3-plane mới chưa bắt được ca nào ở 1080p (0/10 run
   n=148) — cần thêm run mới có power cho endpoint 1080p.
3. **Poison chỉ phủ được mặt phẳng đã track + test heavy có giới
   hạn.** poisonAny (3-plane, heavy) bỏ sót poison một phần (vd ca
   smoke N720NULL r1: meanY 145, stdevY 38,2 — chỉ Y-only bắt được).
   Tỉ lệ poison gộp vẫn dựa trên mẫu nhỏ (4/54 run) — CI rộng
   [2,9%, 17,6%].
4. **Thành phần hoạt động của tpad chưa tách được** (§4.2). Probe
   phân biệt cho đợt sau (rẻ, mỗi probe ~10 run 720p):
   - (1) `tpad=stop_mode=clone:stop_duration=0` — activate-pull
     nhưng 0 frame pad và KHÔNG giữ cache_stop (pad_stop=0 → không
     clone ref). Nếu khử được thì pull là thành phần hoạt động.
   - (2) `tpad=stop_mode=add:stop_duration=0.034` — 1 frame pad màu
     đặc, KHÔNG giữ ref. Nếu khử được thì frame EOF là thành phần
     hoạt động.
   - Nếu cả (1) và (2) đều không khử mà tpad-clone-1 khử được thì
     `cache_stop` ref là thành phần hoạt động.
5. **Aliasing offset chưa đo được** (xem §2.2): test checksum-khớp
   không có power vì transform theo chỉ số frame. Cần clip mà mỗi
   input frame có danh tính đọc được (vd mỗi frame một mức xám riêng
   + transform identity) để đọc trực tiếp frame nguồn bị đọc nhầm.
6. **Source libvidstab `transform.c` chưa đọc được** (không có trên
   đĩa, không deb-src): chưa xác nhận `vsTransformPrepare` có lưu
   con trỏ frame thô qua lần gọi hay không.
7. **Sóng EPERM lặp lại lần 3** (09/11, 10/11 ~15:48, 10/11 ~18:10):
   giết chặng 1 sau 17 run; VM restart giết chặng 2 (SIGTERM). Resume
   từ results.jsonl hoạt động cả 2 lần — mẫu chạy nhiều chặng đã
   được chứng minh là bền.
8. **Lỗi hiển thị nhỏ trong harness (không ảnh hưởng kết quả):**
   `summary.json` ghi `gtWholeSha 0/10` cho T720PAD1/G720CPPAD1 vì
   family `720pad1` không kết thúc bằng `pad` nên bị so whole-sha
   với GT 720 (150 frame) thay vì "không áp dụng" — artifact hiển
   thị; so sánh đúng là per-frame vs G720CPPAD1 (0/1500, p=1,0) và
   whole-sha `7924aa52b6af` 10/10 cả hai arm. Sửa ở đợt sau nếu chạm
   lại harness (1 dòng: `family.endsWith("pad")` → kiểm tra
   `family.includes("pad")`).
9. **Không chạy tsc/vite build trong luồng này:** không sửa file
   production, không đụng file TS/TSX — chỉ thêm 1 file harness JS +
   1 file LIMITS md. Parent kiểm chứng ở bước gộp như thường lệ.
10. Nợ chung các đợt trước (không thuộc luồng này): TTS 39 (CẤM kiểm
    lại); G1/G2; kernel Mitchell vs BC (J2 — cần A/B trước khi đổi);
    ci-security.yml / ci-build.yml 403; release gate giữ nguyên
    (KHÔNG release/tag).

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round83_k10_vidstab_race_fix.js` — harness
  K10 (mới; kế thừa J1 + 5 arm probe + test poison 3-plane +
  endpoint n=148 đăng ký trước; unit poisonAny 8/8 PASS).
- `docs/PHASE9_ROUND83_K10_VIDSTAB_RACE_FIX_LIMITS.md` — tài liệu này.

Không stage: cây đo `~/workspace/.scratch-r83k10/` (runs/, smoke/,
omp1/, *.framemd5, *.stderr, free-track logs, summary.json,
analysis-perframe.json, full-run*.log, omp1-run.log), log luồng
`hidden_files/round83-k10.md` (log nội bộ, không thuộc repo),
script hồi cứu /tmp/k10-alias-offset*.js.
Không push — chờ user nhắn "push đi" từ main chat.

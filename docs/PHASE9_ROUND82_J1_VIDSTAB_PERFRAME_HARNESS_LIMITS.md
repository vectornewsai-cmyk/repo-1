# LIMITS — Phase 9 đợt 82 J1: vidstab per-frame harness chính thức + power 1080p + probe TPAD drain

Luồng J1 — biến endpoint per-frame thành harness hồi quy chính thức (nợ đợt 81
§4.3 / I1 §5.7), kiểm tra power ở 1080p, và probe MỘT biện pháp giảm nhẹ ở tầng
đo (tpad trước vidstabtransform). Log chi tiết:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round82-j1.md`.
Harness: `server/render/src/test_round82_j1_vidstab_perframe_harness.js`.
Self-check: `server/render/src/test_round82_j1_perframe_harness_selfcheck.js`.
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3), libvidstab
1.1.0, VM 4 vCPU EPYC 9D25, ~7 GB RAM, không GPU, cell chia sẻ 1,5 CPU.
Ngày: 10/11/2026 (lượt cron 21:35 +07).
Clip + .trf dùng chung với E3/F3/G3/H1/I1: `shakynoisy1080.mp4` (150 frame,
5 s, 30 fps) + `detect-shaky1080-5s.trf`; `shaky720.mp4` + `shaky720.trf`.
Ground truth sha cả file: 1080p `d960996868d3…`, 720p `397ba4e1a870…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Harness chính thức | **XONG** — `test_round82_j1_vidstab_perframe_harness.js` (chạy + phân tích, mode run/analyze/both, khôi phục từ results.jsonl) + self-check 8/8 PASS. Dùng được cho các đợt sau (xem §1). |
| Power 1080p (endpoint per-frame) | **KHÔNG CÓ POWER.** A1080NC lệch **4/1500 frame (0,27%)**, mỗi run trung vị 0 (0–2), vs C1080CP 0/1500 — Fisher gộp p=0,125, permutation per-run p=0,21 (không có ý nghĩa). Giữ kết luận I1: cặp 1080p yếu cho mọi endpoint pixel. |
| Probe TPAD (giảm nhẹ drain) | **KHỬ HOÀN TOÀN — mạnh hơn giả thuyết.** P720PAD lệch **0/1560 frame** (thật 0/1500, pad 0/60), 10/10 run đều 0, vs D720NC **882/1500 (58,8%)**, mỗi run 86–92 — permutation per-run p=1,08×10⁻⁵ (sàn), Fisher gộp p≈0. P720PAD == COPY output tuyệt đối (P720PAD-vs-F720CP p=1,0). Không chỉ ở drain: tỉ lệ lệch giữa stream cũng về 0 (mid 816 → 0). Poison KHÔNG dời sang vùng pad (0 frame poison-like ở pad). Ở 1080p P1080PAD 0/1560 vs A1080NC 4/1500 — không phân biệt được (thiếu power, p=0,21). |
| Poison drain (chế độ b) | **Tái hiện lần 3 ở cùng frame n=148.** D720NC r5 n=148: Y-only, meanY 155, stdevY 29,3 (GT 34,6), poisonFrac ~0,87 — gộp với I1 (smoke + stress r2): **3/21 run NC 720p** có frame n=148 poison-like. **MỚI ở 1080p:** A1080NC r8 n=148 mean [161, 165, 165] stdev [18,2, 0,1, 0,1] (cả 3 plane ~poison — U/V 1080p 518.400 byte > TRACK_MIN nên cũng bị poison, khác 720p); r10 n=148 Y y hệt GT nhưng U/V mean 165 stdev 0,1 (chỉ chroma poison — "chroma đi trước luma"). Xem §3.3 — quan sát post-hoc, chưa phải endpoint đăng ký trước. |
| Crash | **0/80 lần chạy** (8 arm × 10). Gộp với F3/G3/H1/I1: crash vẫn không đo được; mọi claim chỉ ở mức "khử biểu hiện pixel", không claim "khử crash". |
| Aliasing hệ thống | D720NC có **48 frame hệ thống** (>=8/10 run cùng Y checksum; vd n=29–34, 37–39, 41–42, 44 ở mức 8/10) — ít hơn I1 (~60) nhưng vẫn rõ: race chủ yếu tất định. |
| Sóng EPERM tái phát | **MỚI, từ ~15:48 UTC 10/11.** Giết chặng 1 sau 53/80, chặng 2 sau 13 s, làm chết node chặng 3 sau 61 s, truncate file harness về 0 byte 1 lần. Harness đã cứng hóa (writeRetry + ffmpeg retry I/O + snapshot best-effort) và chạy xong nhờ vòng lặp shell resume (xem §3.4). |

## 1. Harness chính thức (deliverable 1)

### 1.1 Thiết kế

`test_round82_j1_vidstab_perframe_harness.js` gộp CHẠY + PHÂN TÍCH trong một
script (kế thừa setup F của E3/F3/G3/H1/I1 + poison-quarantine v2e của I1),
để các đợt sau chỉ cần:

```
node server/render/src/test_round82_j1_vidstab_perframe_harness.js run      # chỉ chạy
node server/render/src/test_round82_j1_vidstab_perframe_harness.js analyze  # chỉ phân tích WORK có sẵn
node server/render/src/test_round82_j1_vidstab_perframe_harness.js both     # chạy rồi phân tích (mặc định)
```

Env: `J1_WORK` (mặc định `~/workspace/.scratch-r82j1/runs`), `J1_N=10`,
`J1_CORES=0-1`, `J1_HOG=2`, `J1_ARMS=<danh sách>`, `J1_FFMPEG_STOCK=ffmpeg`.

Chạy: 8 arm × n=10, xen kẽ từng vòng, taskset pin ffmpeg+hog cores 0-1,
LD_PRELOAD v2e + segv_backtrace, `-threads 1`, showinfo cuối chuỗi filter,
`-v info`. Khôi phục từ `results.jsonl` (chạy lại không chạy lại lần đã có).
Mỗi lần chạy ghi `r<i>.framemd5` (md5 từng frame — nguồn chính),
`r<i>.stderr` (showinfo — nguồn phụ), `free-track-v2e-<ARM>-r<i>.log`.

Phân tích: GT md5 từ arm COPY cùng family (r1); GT showinfo bằng PHIẾU ĐA
SỐ trên N lần chạy arm GT (I1 dùng 20 lần CP+SP; 10 lần đủ vì GT đã chứng
minh ổn định tuyệt đối). Đếm frame lệch theo framemd5 (không bị status-line
xen như stderr); cross-check showinfo (plane nào lệch, ΔmeanY); phát hiện
poison-like (Y-only + meanY kéo về 165, >=120 — test đúng cho filter nội
suy, I1 §4.2); đếm frame hệ thống (>=8/10 run cùng Y checksum); thống kê
theo vùng mid (n<140) / drain (140<=n<150) / pad (n>=150). Endpoint chính
là PHÂN PHỐI SỐ FRAME LỆCH THẬT/RUN, so bằng permutation test chính xác
(C(20,10)); Fisher gộp trên frame chỉ là cận trên (frame trong run tương
quan).

Các arm (family = nhóm GT chung: size + có pad hay không):

| Arm | Chuỗi filter (sau trim,setpts) | Family / GT |
|---|---|---|
| A1080NC | vidstabtransform,showinfo | 1080 / C1080CP |
| C1080CP | copy,vidstabtransform,showinfo | 1080 / C1080CP |
| G1080CPPAD | copy,tpad,vidstabtransform,showinfo | 1080pad / G1080CPPAD |
| P1080PAD | tpad,vidstabtransform,showinfo | 1080pad / G1080CPPAD |
| D720NC | vidstabtransform,showinfo | 720 / F720CP |
| F720CP | copy,vidstabtransform,showinfo | 720 / F720CP |
| G720CPPAD | copy,tpad,vidstabtransform,showinfo | 720pad / G720CPPAD |
| P720PAD | tpad,vidstabtransform,showinfo | 720pad / G720CPPAD |

`tpad=stop_mode=clone:stop_duration=0.2` — thêm 6 frame clone sau frame cuối.

### 1.2 Tự kiểm tra — 8/8 PASS

`test_round82_j1_perframe_harness_selfcheck.js` (fixture tổng hợp, không
cần ffmpeg): parse framemd5/showinfo (kể cả status-line xen), poisonLike /
poisonStrict, permutation sàn 1,08e-5, Fisher tràn dưới double,
analyzeArm end-to-end trên WORK fixture (GT 5 frame, 2 run: 1 sạch, 1 lệch
2 frame trong đó 1 poison-like), ZONE. Chạy: `node ..._selfcheck.js`,
thoát 0 khi mọi assert PASS.
Lưu ý: check 7 FAIL lần đầu do fixture test hardcode checksum giống nhau
(không phải lỗi harness) — đã sửa fixture, chạy lại 8/8. Sau đó sóng EPERM
tái phát (~15:48 UTC) làm 3 check ghi fixture fail liên tục (chỉ lỗi I/O,
không lỗi assert) — đã thêm retry + settle 3 s vào fixture write, chạy lại
**8/8 PASS** trên file hiện tại (87 s, gồm thời gian settle).

## 2. Smoke (J1_N=1 — validate chuỗi TPAD trước stress)

WORK `~/workspace/.scratch-r82j1/smoke`, 8/8 run exit 0, 0 crash, tổng 554 s.
Loadavg lúc đó ~23 (các luồng đợt 82 khác chạy song song) — 1080p 76–124 s/lần
(chậm hơn I1 67–72 s), 720p 25–51 s/lần.

| Arm | Frame lệch | Ghi chú |
|---|---|---|
| A1080NC | 0/150 | như kỳ vọng (1080p không power) |
| C1080CP | 0/150 | GT family 1080 |
| G1080CPPAD | 0/156 | GT family 1080pad |
| P1080PAD | 0/156 | khớp tuyệt đối G1080CPPAD/r1 (GT family 1080pad) |
| D720NC | **86/150** (mid 80 / drain 6) | đúng mẫu I1 (87–90/run); ΔmeanY trung vị 1 (min −1, max 11) |
| F720CP | 0/150 | GT family 720 |
| G720CPPAD | 0/156 | GT family 720pad |
| **P720PAD** | **0/156** | khớp tuyệt đối G720CPPAD/r1; 150 frame đầu khớp cả F720CP (GT không-pad) |

Kiểm chứng thêm (không qua harness, bằng cmp/python trực tiếp):
- Không có filter auto-insert nào trong graph PAD (stderr chỉ có đúng filter
  đã chỉ định).
- G720CPPAD 150 frame đầu == F720CP tuyệt đối → tpad KHÔNG đổi output frame
  thật; 6 frame pad == frame 149 (clone).
- P720PAD == COPY output tuyệt đối ở cả 156 frame.

Đọc sơ bộ lúc smoke (n=1, CHƯA kết luận): tpad trước transform dường như khử cả
race giữa stream, không chỉ ở drain — mạnh hơn giả thuyết probe ban đầu.
**Stress n=10 đã xác nhận (§3): P720PAD 0/1560, 10/10 run đều 0** — không
phải nhiễu. Cơ chế vẫn chưa rõ (xem §4).

Quarantine stats smoke: 1080p 46 chunk / evict 14 / peak ~30,9 MB; 720p
11–13 chunk / evict 0 / peak ~10,4–12,4 MB — khớp I1.

## 3. Stress đầy đủ (8 arm × n=10)

WORK `~/workspace/.scratch-r82j1/runs/`, 80/80 lần chạy, 0 crash, 0 run
thiếu dòng stats quarantine. Chạy 3 chặng do sóng EPERM + restart VM
(xem §3.4): chặng 1 (53/80) → chặng 2 chết sau 13 s → chặng 3 chết sau
61 s → chặng 4 (resume lần 2) chạy xong 27 lần còn lại + phân tích,
exit 0 lúc 16:34 UTC. Máy yên dần về cuối (loadavg từ ~23 xuống ~1):
1080p trung vị 68–80 s/lần, 720p 19–24 s/lần (chặng 4 chỉ ~30–50 s
1080p / ~7–10 s 720p).

### 3.1 Bảng per-arm (endpoint chính: frame lệch THẬT / run)

| Arm | Frame lệch / tổng | Mỗi run: trung vị (min–max) | Vùng mid/drain/pad | Plane lệch Y/U/V | POISON-LIKE (thật / pad) |
|---|---|---|---|---|---|
| A1080NC | 4/1500 (0,0027) | 0 (0–2) | 2/2/0 | 4/5/5* | 0 / 0 |
| C1080CP | 0/1500 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 |
| G1080CPPAD | 0/1560 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 |
| P1080PAD | 0/1560 | 0 (0–0) | 0/0/0 | 3/3/3* | 0 / 0 |
| D720NC | **882/1500 (0,588)** | **88 (86–92)** | **816/66/0** | 875/879/880 | **1 (r5 n=148) / 0** |
| F720CP | 0/1500 | 0 (0–0) | 0/0/0 | 3/3/3* | 0 / 0 |
| G720CPPAD | 0/1560 | 0 (0–0) | 0/0/0 | 1/1/1* | 0 / 0 |
| P720PAD | **0/1560** | **0 (0–0)** | **0/0/0** | 2/2/2* | **0 / 0** |

(* plane lệch ở arm 0-frame-lệch theo framemd5 là NHIỄU PARSE showinfo
đã biết (I1 §5.5): checksum showinfo lệch 1–3 frame trong khi md5 = 0 —
không phải lệch thật. D720NC: ΔmeanY frame lệch trung vị 1 (min −2,
max 67); A1080NC: ΔmeanY trung vị 0 (min 0, max 73 — frame r8 n=148,
xem §3.3). GT ổn định tuyệt đối ở cả 4 family.)

D720NC per-run: [86, 87, 92, 91, 88, 89, 86, 89, 88, 86] — trùng KHỚP
con số I1 (882/1500, mỗi run 87–90): tái hiện tuyệt đối, không phải
nhiễu. A1080NC per-run: [0, 0, 0, 0, 0, 2, 0, 1, 0, 1] — 4 frame lệch:
r6 n=2, n=4 (ΔmeanY 0, buffer-reuse giữa stream); r8 n=148 (ΔmeanY
+73, xem §3.3); r10 n=148 (ΔmeanY 0).

### 3.2 So sánh (permutation trên số frame lệch THẬT/run là endpoint chính)

| Cặp | Frame thật | Fisher gộp | Permutation per-run |
|---|---|---|---|
| C1080CP-vs-A1080NC (power 1080p) | 0/1500 vs 4/1500 | p=0,125 | p=0,21 — KHÔNG có ý nghĩa |
| F720CP-vs-D720NC (endpoint chính) | 0/1500 vs 882/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| P1080PAD-vs-A1080NC (probe, 1080p) | 0/1500 vs 4/1500 | p=0,125 | p=0,21 — KHÔNG phân biệt được |
| P720PAD-vs-D720NC (probe, 720p) | 0/1500 vs 882/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| P1080PAD-vs-C1080CP | 0/1500 vs 0/1500 | p=1,0 | p=1,0 |
| P720PAD-vs-F720CP | 0/1500 vs 0/1500 | p=1,0 | p=1,0 — PAD == COPY tuyệt đối |

### 3.3 Poison — tái hiện lần 3 ở n=148 + tín hiệu MỚI ở 1080p

1. **720p, D720NC r5 n=148** (test poison-like đăng ký trước — Y-only +
   meanY>=120): meanY 155, stdevY 29,3 (GT 34,6), poisonFrac ~0,87.
   Gộp với I1: **3/21 run NC 720p** có frame n=148 poison-like (I1 smoke
   ~51% poison, I1 stress r2 ~99%, J1 stress r5 ~87%) — tỉ lệ poison-read
   ở drain ước lượng ~1/882 frame lệch (J1: 1/882, khớp I1) nhưng tái
   hiện ổn định ở cùng frame áp chót.
2. **1080p, A1080NC r8 n=148** (quan sát post-hoc — test poison-like
   Y-only KHÔNG bắt được vì U/V cũng lệch): mean [161, 165, 165],
   stdev [18,2, 0,1, 0,1], plane_checksum [D3766305, E669815F,
   E669815F] (U/V cùng checksum — cả hai plane gần như hằng 165).
   **A1080NC r10 n=148:** Y y hệt GT (checksum 84EFFAE2, mean 88),
   U/V mean 165 stdev 0,1 (chỉ chroma poison). Quét toàn bộ showinfo:
   chỉ 2 frame này trong cả 80 lần chạy 1080p có mean ~165; 0 frame ở
   mọi arm CP/PAD. Nguồn duy nhất của pixel ~165 là poison 0xA5; clip
   không có frame nào mean ~165. **Giải thích vì sao U/V poison được ở
   1080p mà không ở 720p:** U/V 1080p = 518.400 byte > TRACK_MIN
   400.000 (được track + poison), U/V 720p = 230.400 byte < TRACK_MIN
   (không poison được) — đúng thiết kế v2e (I1 §3.1). Test poison-like
   hiện tại (Y-only) là test đúng cho 720p nhưng THIẾU cho 1080p —
   nợ đợt sau: mở rộng test poison ra cả 3 plane ở 1080p và đăng ký
   trước endpoint "frame n=148 poison" (xem §5.6).
3. **Chưa giải thích được:** D720NC r4 n76/n77 — 2 frame lệch liên tiếp
   giữa stream, meanY 119/121 (GT 88), U/V CŨNG lệch (không phải
   Y-only nên test poison-like loại) — không khớp cả hai chế độ (một
   frame thật khác phải có meanY ~88; hỗn hợp poison-Y phải giữ U/V
   = GT). Có thể là showinfo gán nhầm frame kề (nhiễu parse đã biết)
   hoặc artifact ghi đè một phần — ghi nhận trung thực, không ép
   giải thích.
4. Frame hệ thống D720NC: **48 frame** (>=8/10 run cùng Y checksum;
   vd n=29–34, 37–39, 41–42, 44 ở mức 8/10) — ít hơn I1 (~60) nhưng
   vẫn rõ thành phần tất định.

### 3.4 Sóng EPERM tái phát + chạy 4 chặng (hậu cần, không phải kết quả đo)

- Sóng EPERM mới từ ~15:48 UTC 10/11 (sau khi đợt 81 xác nhận sóng cũ
  đã hết 2 lần): write file trả EPERM theo đợt (ghi 0 byte), cả /tmp
  (tmpfs) lẫn workspace (overlay). Đo duty cycle: có lúc 30/30 OK trong
  60 s, có lúc fail liên tục nhiều phút; xen kẽ chặt cho thấy sau 1
  write OK thì các write tiếp theo fail hàng loạt — giống giới hạn tốc
  độ tạo file/burst write hơn là lỗi ổ đĩa (df 88G trống).
- Chặng 1 chết sau 53/80 (node chết sau record D720NC-r7; shell báo
  `echo: write error: Operation not permitted`). Chặng 2 (resume) chết
  sau 13 s, 0 output. Chặng 3 chết sau 61 s (đúng 60 s retry ở hog
  snapshot). Giữa chừng 1 lần python `open(p,'w')` truncate file
  harness về 0 byte (open thành công → truncate, write sau đó EPERM) —
  đã viết lại đầy đủ (34736 byte, node --check OK).
- Cứng hóa harness sau chặng 3: record/stderr/summary/analysis retry
  150 lần (5 phút); hog snapshot best-effort; runOnce retry tối đa 3
  lần khi ffmpeg chết vì lỗi I/O (stderr "Permission denied"/"I/O
  error" hoặc framemd5 thiếu/rỗng), chờ 30 s giữa các lần; crash thật
  KHÔNG retry. Chặng 4 chạy trong vòng lặp shell (tối đa 6 attempt,
  nghỉ 45 s giữa các lần) và xong ngay attempt 1 lúc 16:34 UTC, exit 0
  — 0 lần ffmpeg retry I/O phải dùng đến trong chặng 4 (grep "lỗi I/O"
  = 0), F720CP-r7 chạy lại sạch (sha == GT, 9,4 s).
- Runtime restart 1 lần giữa chặng 3 và 4 (session loop mất kết quả
  xác nhận — đã kiểm tra lại bằng pgrep + results.jsonl trước khi
  resume: không còn tiến trình sót, 53 dòng nguyên vẹn).

## 4. Cơ chế + đọc kết quả probe TPAD

### 4.1 Kết quả thực nghiệm (chắc chắn)

- TPAD trước vidstabtransform khử **toàn bộ** frame lệch ở 720p: D720NC
  882/1500 (mid 816 / drain 66) → P720PAD 0/1560 (mid 0 / drain 0 /
  pad 0), 10/10 run đều 0, permutation p=1,08×10⁻⁵ (sàn). Không chỉ ở
  drain như giả thuyết probe ban đầu — cả race giữa stream cũng biến mất.
- P720PAD == COPY output tuyệt đối (P720PAD-vs-F720CP p=1,0; 150 frame
  đầu của P720PAD khớp cả F720CP — GT không-pad). Tpad KHÔNG đổi output
  frame thật; 6 frame pad == frame 149.
- Poison KHÔNG dời sang vùng pad (0 frame poison-like ở n>=150) — nếu
  tpad chỉ "đẩy" race sang frame pad thì phải thấy lệch/poison ở đó.
  Không có gì ở đó: race biến mất hẳn, không phải dời chỗ.
- Không có filter auto-insert nào trong graph PAD (kiểm chứng bằng grep
  stderr smoke) — hiệu ứng đến từ chính tpad, không phải filter copy ngầm.

### 4.2 Cơ chế — CHƯA RÕ (không claim)

Câu hỏi mở từ smoke vẫn đứng nguyên, giờ mạnh hơn: vì sao một filter
passthrough giữa stream (tpad chỉ clone frame ở EOF) lại khử được race
giữa stream? Các giả thuyết, CHƯA phân biệt được:

- (a) **Đổi pha aliasing / nhịp pull của graph:** race chủ yếu tất định
  (48 frame hệ thống ở J1, ~60 ở I1 — pool decoder xoay vòng cố định,
  transform đọc nhầm cùng buffer sai ở cùng frame). Thêm một node
  filter có thể đổi nhịp pull decoder ↔ transform vừa đủ để pha
  xoay vòng không còn trùng với cửa sổ smoothing — race "lệch pha" và
  biến mất. Giả thuyết này dự đoán: BẤT KỲ stage thêm nào trước
  transform (kể cả `fifo`/`null` passthrough) cũng khử được.
- (b) **Giữ ref / đổi quyền sở hữu buffer:** nếu vidstabtransform giữ
  VSFrame bằng con trỏ thô (không giữ AVFrame ref) thì decoder pool
  tái cấp buffer trong khi transform vẫn đọc — và bất kỳ stage nào giữ
  thêm ref hoặc copy buffer sẽ khử được. Tpad giữ ref frame cuối để
  clone ở EOF — nhưng chỉ 1 frame, khó giải thích khử 816 frame lệch
  giữa stream. Giả thuyết này cần đọc source vf_vidstabtransform.c
  (transform có giữ ref không?) và vf_tpad.c (tpad giữ gì?) để xác nhận.
- (c) Nhiễu n=1 ở smoke — **ĐÃ BÁC:** stress n=10 cho 0/1560.

**Không đề xuất sửa production từ kết quả này.** TPAD thêm 6 frame vào
output (phải trim lại sau transform) và cơ chế chưa rõ — ship nó lúc này
là cargo-cult. Giá trị của probe là: (1) race rất mong manh trước cấu
trúc graph — một manh mối mạnh để tìm cơ chế thật; (2) harness per-frame
(§1) là endpoint để kiểm chứng bất kỳ biện pháp nào sau này.

### 4.3 Việc cần làm đợt sau (để khép cơ chế)

1. Đọc source ffmpeg 8.1.2 `vf_vidstabtransform.c` + `vf_tpad.c`:
   transform có giữ AVFrame ref hay chỉ con trỏ VSFrame? tpad giữ gì?
2. Probe stage tối thiểu: `fifo` và `null` trước transform (không
   copy, không giữ ref dài) — nếu khử được thì ủng hộ (a); nếu không
   thì ủng hộ (b).
3. Probe tpad 1 frame (`stop_duration=0.033`): nếu 1 frame pad đã khử
   hết thì giả thuyết "bảo vệ cửa sổ drain" sai hoàn toàn, còn lại
   (a)/(b).
4. Mở rộng test poison ra cả 3 plane ở 1080p + đăng ký trước endpoint
   "frame n=148 poison" (xem §5.6) — tín hiệu r8/r10 n=148 cần kiểm
   chứng có chủ đích, không để post-hoc.

## 5. Giới hạn và nợ mở (trung thực)

1. **Endpoint crash vẫn mở** — 0/80 stress J1 (8 arm × 10); gộp 5 đợt
   F3/G3/H1/I1/J1: crash 0/350 lần chạy (NC 0/20 J1 + 0/270 trước đó +
   các arm khác). Harness này KHÔNG đo crash (dưới v2e crash bị chuyển
   thành poison-read — I1 §5.4). Mọi claim chỉ ở mức "khử biểu hiện
   pixel", không claim "khử crash".
2. **Endpoint per-frame chỉ mạnh ở 720p.** Ở 1080p NC chỉ lệch 4/1500
   (0,27%), p=0,21 — không có power; cặp P1080PAD-vs-A1080NC cũng
   p=0,21. Không kết luận gì về TPAD ở 1080p từ p này.
3. **Poison chỉ phủ được mặt phẳng đã track — và test Y-only THIẾU cho
   1080p.** U/V 720p (230.400 byte) < TRACK_MIN 400.000 nên không poison
   — test Y-only là đúng cho 720p. Nhưng U/V 1080p (518.400 byte) >
   TRACK_MIN nên CŨNG bị poison — test Y-only bỏ sót 2 frame n=148 ở
   1080p (r8 cả 3 plane, r10 chỉ chroma). Test strict (Y == solid-poison)
   vẫn cho 0 vì transform nội suy. Xem §3.3 + §4.3.4.
4. **Nhiễu parse showinfo** (status-line xen) — đã biết, framemd5 là nguồn
   chính; cross-check showinfo còn sót 1–3 frame "lệch checksum" giả ở
   CP/PAD arm trong khi md5 = 0 (vd F720CP r1/r3, P1080PAD r2/r4/r5/r7).
   Test poison-like yêu cầu frame ĐÃ lệch theo framemd5 trước nên không
   bị nhiễu này tạo false positive.
5. **Tải chung thay đổi lớn trong lượt:** chặng 1 chạy dưới loadavg ~23
   (1080p 76–124 s/lần), chặng 4 máy yên (loadavg ~1–3, 1080p ~30–50 s,
   720p ~7–10 s). Các arm xen kẽ chung cửa sổ tải nên so sánh giữa các
   arm vẫn hợp lệ; nhưng thời gian tuyệt đối không so được giữa chặng.
   D720NC per-run chặt (86–92) cả khi tải cao lẫn thấp — tỉ lệ lệch
   không nhạy với tải trong đợt này.
6. **Nợ mới từ J1 (cho đợt sau):**
   - (a) Cơ chế TPAD chưa rõ — 4 probe ở §4.3 (đọc source 2 filter,
     probe fifo/null, probe tpad 1 frame).
   - (b) Test poison 3-plane ở 1080p + endpoint "frame n=148 poison"
     đăng ký trước (tín hiệu r8/r10 cần kiểm chứng có chủ đích).
   - (c) D720NC r4 n76/n77 (meanY 119/121, U/V cũng lệch) chưa giải
     thích được — có thể là nhiễu parse showinfo; kiểm lại bằng cách
     trích xuất frame raw so với GT.
   - (d) Sóng EPERM tái phát (10/11 ~15:48 UTC — xem §3.4): chưa rõ
     nguyên nhân gốc; harness đã cứng hóa đủ để chạy xong, nhưng sóng
     có thể quay lại. Cấm dùng `open('w')` không retry khi sóng đang
     hoạt động (đã truncate 1 file).
   - (e) 4K + clip dài 30 s (nợ từ I1 §5.7): chưa đo — 720p đã tách
     tuyệt đối ở n=10 nên không cần cho endpoint per-frame; 4K có thể
     cho power ở kích thước lớn (Y 8,3 MB đã phủ bởi dải v2e 12 MB).
7. Nợ chung các đợt trước (không thuộc luồng này): TTS 39 (CẤM kiểm
   lại); G1/G2; ci-security.yml / ci-build.yml 403; release gate giữ
   nguyên (KHÔNG release/tag).

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round82_j1_vidstab_perframe_harness.js` — harness
  chạy + phân tích per-frame (mới; đã cứng hóa chống sóng EPERM:
  writeRetry 30/150 lần, ffmpeg retry I/O 3 lần, hog snapshot best-effort).
- `server/render/src/test_round82_j1_perframe_harness_selfcheck.js` — test tự
  kiểm tra 8/8 PASS (mới; fixture có retry + settle 3 s chống sóng EPERM).
- `docs/PHASE9_ROUND82_J1_VIDSTAB_PERFRAME_HARNESS_LIMITS.md` — tài liệu này.

Không stage: cây đo `~/workspace/.scratch-r82j1/` (smoke/, runs/,
*.framemd5, *.stderr, free-track logs, summary.json,
analysis-perframe.json, full-run*.log), log luồng
`hidden_files/round82-j1.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

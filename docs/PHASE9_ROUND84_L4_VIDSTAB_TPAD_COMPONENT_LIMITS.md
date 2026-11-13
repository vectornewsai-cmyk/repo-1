# LIMITS — Phase 9 đợt 84 L4: vidstab — tách thành phần hoạt động của tpad + probe aliasing offset

Luồng L4 — đóng nợ còn lại của K10 đợt 83 (vidstab race). Log chi tiết:
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l4.md`.
Harness: `server/render/src/test_round84_l4_vidstab_tpad_component.js`
(kế thừa K10) + `server/render/src/test_round84_l4_vidstab_gray_identity.js`
(gray-identity probe, mới).
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3),
libvidstab 1.1.0, VM 4 vCPU EPYC 9D25, ~8 GB RAM, không GPU, cell chia
sẻ 1,5 CPU. Ngày: 11/11/2026 (lượt cron 03:35 +07; luồng chạy
~03:44–05:30 +07). Clip + .trf dùng chung với E3/F3/G3/H1/I1/J1/K10:
`shakynoisy1080.mp4` (150 frame, 5 s, 30 fps) + `detect-shaky1080-5s.trf`;
`shaky720.mp4` + `shaky720.trf`. Ground truth sha cả file: 1080p
`d960996868d3…`, 720p `397ba4e1a870…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Probe 1: activate-pull, không cache_stop, 0 frame pad (C720PAD0) | **KHÔNG khử.** 869/1500 (57,9%) vs D720NC 874/1500, permutation p=0,81. Pull **KHÔNG phải** thành phần hoạt động. |
| Probe 2: 1 frame pad màu đặc, không giữ ref (A720PADADD) | **KHÔNG khử.** 853/1500 (56,9%) vs D720NC 874/1500, permutation p=0,71. Frame EOF **KHÔNG phải** thành phần hoạt động. |
| Kết luận cơ chế (loại trừ) | **Thành phần hoạt động của tpad là `cache_stop` ref** — TPAD1 (pull + cache_stop + 1 frame EOF) khử hoàn toàn (0/1500, replicate K10), trong khi pull một mình và frame EOF một mình đều không khử. Bằng chứng dương cho họ (b): `copy` cũng khử hoàn toàn (0/1500). |
| Replicate K10 | T720PAD1 0/1500, whole-sha `7924aa52b6af` 10/10 == G720CPPAD1; D720NC 874/1500 (K10: 844/1500); F720CP 0/1500. |
| Sửa lỗi hiển thị (K10 §5.8) | **ĐÃ SỬA + KIỂM CHỨNG.** `family.endsWith("pad")` → `family.includes("pad")`: summary.json ghi "(không áp dụng — arm có pad)" cho cả 4 arm pad, số đếm đúng cho D720NC 0/10, F720CP 10/10, C720PAD0 0/10. |
| Probe aliasing offset (gray identity) | **PHƯƠNG PHÁP BỊ BÁC.** Clip xám đặc + trf thật: NC == CP tuyệt đối (whole-sha giống hệt, 0/1500 frame lệch ở cả 720p lẫn 1080p, smoke n=1) — race KHÔNG tái hiện trên nội dung xám đặc nên không đo được offset. Phát hiện thêm: **artifact nội suy bilinear tất định của libvidstab** (§5) — không phải race, `copy` không ngăn được, NC-vs-CP mù với nó. |
| Parser showinfo (phát hiện phụ) | **Lỗi gán nhầm frame kề + ĐÃ SỬA.** Status-line xen giữa trường showinfo làm regex gán nhầm mean/checksum của frame n+1 cho frame n. Sau sửa: parse 150/150 frame (trước 147/150), nhiễu plane ở arm GT 3/3/3 → 0/0/0, endpoint md5 không đổi. |
| Crash | **0/70 stress + 0/15 smoke = 0/85 run L4.** Gộp F3+G3+H1+I1+J1+K10+L4: **0/592 lần chạy** (Wilson 95% cận trên 0,64%). Mọi claim vẫn chỉ ở mức "khử biểu hiện pixel", không claim "khử crash". |
| Poison chế độ (b) | 0 trong stress L4 (0/30 run NC-family). Gộp I1+J1+K10+L4: **4/84 run** có n=148 poison-like, Wilson 95% **[1,9%, 11,6%]**; chỉ tính stress: 2/80 = 2,5% [0,7%, 8,7%]. |
| Sửa production | **KHÔNG sửa.** Production `copy` giữ nguyên (xem §4.3). |

## 1. Đọc source trước khi đo (vf_tpad.c — xác nhận ngữ nghĩa probe)

Đọc `vf_tpad.c` (FFmpeg 8.1.2, cây F3) để khẳng định probe (1)/(2) tách
đúng thành phần — không dựa vào phỏng đoán:

- Dòng 158: `if (s->stop_mode == MODE_CLONE && s->pad_stop != 0)` mới
  clone `cache_stop`. `pad_stop` được tính từ `stop_duration` ở
  `config_input` (dòng 222–223). Với `stop_duration=0` → `pad_stop=0`
  → **không bao giờ clone cache_stop**.
- Dòng 107: khi EOF mà `!s->pad_stop && !s->pad_start` thì chỉ forward
  trạng thái EOF, không sinh frame nào. Nên probe 1
  (`stop_mode=clone:stop_duration=0`) = activate-pull thuần, 0 frame
  pad, KHÔNG giữ ref — đúng như K10 §5.4 đã dự đoán.
- Chế độ `MODE_ADD` không bao giờ chạm `cache_stop` (nhánh ở dòng
  172–179 chỉ vẽ hình chữ nhật màu đặc vào buffer mới). Nên probe 2
  (`stop_mode=add:stop_duration=0.034`) = 1 frame pad màu đặc, KHÔNG
  giữ ref — đúng như thiết kế.
- `uninit` (dòng 232) chỉ `av_frame_free(&s->cache_stop)` — ref được
  giữ tới cuối đời filter, cập nhật mỗi frame (chỉ giữ đúng 1 frame
  cuối, K10 §1.2).

## 2. Harness L4 + các sửa

### 2.1 Harness tpad-component (mới)

`server/render/src/test_round84_l4_vidstab_tpad_component.js` — kế thừa
K10 (setup F + taskset pin ffmpeg+hog cores 0-1 + LD_PRELOAD v2e +
segv_backtrace + `-threads 1` + showinfo + resume từ results.jsonl +
chống sóng EPERM: writeRetry 150, ffmpeg retry I/O 3 lần), thay 7 arm
× n=10 (chỉ 720p — 1080p shaky không có power, xem K10 §3.1):

| Arm | Chuỗi | Family / GT |
|---|---|---|
| D720NC | NOCOPY (control) | 720 / F720CP |
| F720CP | COPY (production ref) | 720 / F720CP |
| T720PAD1 | NOCOPY + TPAD1 (replicate K10) | 720pad1 / G720CPPAD1 |
| G720CPPAD1 | COPY + TPAD1 | 720pad1 / G720CPPAD1 |
| C720PAD0 | NOCOPY + `tpad=stop_mode=clone:stop_duration=0` (probe 1) | 720 / F720CP |
| A720PADADD | NOCOPY + `tpad=stop_mode=add:stop_duration=0.034` (probe 2) | 720padadd / G720CPPADADD |
| G720CPPADADD | COPY + TPADADD (GT family padadd) | 720padadd / G720CPPADADD |

### 2.2 Sửa lỗi hiển thị gtWholeSha (K10 §5.8) — XONG, đã kiểm chứng

Một dòng trong `summarizeRuns`:
`a.family.endsWith("pad")` → `a.family.includes("pad")`.
Kiểm chứng ở summary.json full run (§3.1): cả 4 arm pad
(T720PAD1, G720CPPAD1, A720PADADD, G720CPPADADD) đều ghi
"(không áp dụng — arm có pad)"; D720NC 0/10, F720CP 10/10,
C720PAD0 0/10 — số đếm đúng. Lỗi chỉ là artifact hiển thị, không
ảnh hưởng kết quả đo (so sánh đúng vẫn là per-frame vs GT cùng family).

### 2.3 Sửa parser showinfo — lỗi gán nhầm frame kề (phát hiện trong lúc làm §5)

**Triệu chứng:** ở gray-smoke2, CP 1080p frame 2 bị đọc meanY=3
(thay vì 2) → coverage tính sai 1,5; 3 frame (n=3, 97, 120) thiếu
khỏi parse; phân tích offsets cho kết quả giả (offset -1, "khác" 4
frame) trong khi framemd5 khẳng định NC == CP tuyệt đối.

**Nguyên nhân (đọc byte thô trong .stderr):** status-line của ffmpeg
(`frame= ... fps= ...`) xen VÀO GIỮA một trường showinfo, ví dụ
`stdev:[0.1` + status + `\r[Parsed_showinfo_4 @ 0x...] 0.1 0.1]`.
Regex cũ có khoảng rác `[\s\S]{0,600}?` giữa `type:` và `checksum:`
nên khi stdev của frame n bị vỡ, nó bỏ qua checksum/mean của frame n
và gán nhầm giá trị của frame n+1 cho frame n (frame n+1 sau đó mất
luôn entry của mình). Đây là biến thể nặng hơn nhiễu parse đã biết
(I1 §5.5, K10 §3.1: checksum lệch 1–4 frame) — không chỉ "lệch" mà
"gán nhầm hẳn sang frame kề".

**Sửa (cả 2 harness L4, 3 chỗ trong `parseShowinfo` + regex):**
1. Tước status-line trước khi parse: xóa cụm
   `frame= ... fps= ... \r[Parsed_showinfo...]` (cả tiền tố log lặp
   lại sau `\r` — chỉ xóa tiền tố này thì vẫn vỡ, đã thử và thất bại),
   rồi xóa `\r` còn lại.
2. Cho phép khoảng trắng thừa trong ngoặc `mean:`/`stdev:`/
   `plane_checksum:` (`\[\s*...\s*\]`) — sau khi tước, chỗ status-line
   chen vào để lại 2 khoảng trắng hoặc khoảng trắng đầu.
3. Regex các trường dùng `\s+` thay cho khoảng trắng đơn.

**Kiểm chứng sửa:** parse gray-smoke2 Y1080CP r1.stderr: 147 → **150/150
frame**, n=2 mean 2 (đúng), n=3/n=97/n=120 đủ cả; offsets về đúng
149/149 (n=0 bỏ qua), 0 offset, 0 khác (§5.3). Phân tích lại full run
L4 với parser mới: **endpoint md5, poison, mọi so sánh permutation
KHÔNG ĐỔI**; chỉ các trường phụ thuộc showinfo thay đổi theo hướng
sạch hơn: nhiễu plane ở arm GT 3/3/3 → **0/0/0** (T720PAD1 1/1/1 →
0/0/0; G720CPPAD1/G720CPPADADD 3/3/3 → 0/0/0 — nhiễu "1–4 frame" mà
I1/K10 ghi nhận thực ra là lỗi parse này, không phải nhiễu đo);
D720NC plane 856/875/875 → 855/874/874 (bớt 1 đếm giả do gán nhầm).
File phân tích gốc (parser cũ) giữ lại ở
`~/workspace/.scratch-r84l4/runs/analysis-perframe-v1parser.json`
để đối chiếu. Sửa này NÊN được mang sang harness J1/K10 ở đợt sau
(vì poison test cũng dùng showinfo mean) — ghi nợ ở §7.

## 3. Stress đầy đủ (7 arm × n=10 = 70 run, 0 crash, 0 sóng EPERM)

Một chặng duy nhất, exit 0, wall ~35 phút (720p trung vị 13,5–21 s/run
dưới tải các luồng đợt 84 khác; loadavg đầu ~6–8 rồi xuống ~2–3).
Không run nào thiếu dòng stats quarantine, không retry I/O nào kích
hoạt. Smoke trước đó (n=1, 7 arm, 228 s) đã đúng hướng: PAD0 86/150,
PADADD 73/150, TPAD1 0/151.

### 3.1 Bảng per-arm (endpoint chính: frame lệch THẬT / run)

| Arm | Frame lệch / tổng | Mỗi run: trung vị (min–max) | Vùng mid/drain/pad | Plane lệch Y/U/V | POISON-LIKE / POISON-ANY (thật) | POISON-ANY n148 |
|---|---|---|---|---|---|---|
| D720NC | **874/1500 (58,3%)** | **88 (63–108)** | **813/61/0** | 855/874/874 | **0 / 0** | **0 run** |
| F720CP | 0/1500 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 | 0 run |
| T720PAD1 | **0/1500** | **0 (0–0)** | **0/0/0** | 0/0/0 | 0 / 0 | 0 run |
| G720CPPAD1 | 0/1500 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 | 0 run |
| C720PAD0 | **869/1500 (57,9%)** | **86,5 (85–89)** | **809/60/0** | 854/868/869 | **0 / 0** | **0 run** |
| A720PADADD | **853/1500 (56,9%)** | **87,5 (66–89)** | **794/59/0** | 841/852/853 | **0 / 0** | **0 run** |
| G720CPPADADD | 0/1500 | 0 (0–0) | 0/0/0 | 0/0/0 | 0 / 0 | 0 run |

Per-run chi tiết: D720NC [89, 90, 86, 88, 86, 86, 108, 63, 88, 90]
(r7=108 cao hơn max K10 91, r8=63 thấp hơn min K10 70 — spread rộng
hơn do tải các luồng song song đợt 84; trung vị 88 vẫn khớp K10 87);
C720PAD0 [86, 89, 86, 86, 88, 85, 88, 87, 88, 86] (spread chặt
85–89); A720PADADD [89, 88, 87, 88, 86, 66, 86, 86, 88, 89].
Frame hệ thống (>=8/10 run cùng Y checksum): D720NC 64 (K10: 64),
C720PAD0 72, A720PADADD 70 — thành phần tất định vẫn rõ.
Whole-sha: D720NC/C720PAD0/A720PADADD 10 sha khác nhau (mỗi run 1
sha); T720PAD1 == G720CPPAD1 whole-sha `7924aa52b6af` 10/10 cả hai
(khớp K10 tuyệt đối); G720CPPADADD `cc64375aa464` 10/10; F720CP ==
GT `397ba4e1a870…` 10/10. ΔmeanY frame lệch: D720NC trung vị 1
(min −2, max 11); C720PAD0 trung vị 1 (min −2, max 11); A720PADADD
trung vị 1 (min −2, max 14). GT ổn định tuyệt đối ở cả 3 family.

### 3.2 So sánh A/B (endpoint chính: permutation trên số frame lệch THẬT/run)

| Cặp | Frame thật | Fisher gộp | Permutation per-run |
|---|---|---|---|
| F720CP-vs-D720NC (endpoint chính) | 0 vs 874/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| T720PAD1-vs-D720NC (replicate K10) | 0 vs 874/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| T720PAD1-vs-G720CPPAD1 | 0 vs 0/1500 | p=1,0 | p=1,0 — TPAD1 == CPPAD1 tuyệt đối |
| C720PAD0-vs-D720NC (probe 1) | 869 vs 874/1500 | p=0,88 | **p=0,81 — KHÔNG khác** |
| C720PAD0-vs-F720CP | 869 vs 0/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |
| A720PADADD-vs-D720NC (probe 2) | 853 vs 874/1500 | p=0,46 | **p=0,71 — KHÔNG khác** |
| A720PADADD-vs-G720CPPADADD | 853 vs 0/1500 | p≈0 | p=1,08×10⁻⁵ (sàn) |

### 3.3 Chế độ (b): poison — 0 trong stress L4

- Stress L4: poisonLike (Y-only) 0/2596 frame lệch NC-family
  (D720NC 0/874, C720PAD0 0/869, A720PADADD 0/853); poisonAny
  (3-plane) 0 ở mọi arm; endpoint đăng ký trước "n=148 poison":
  0/10 run ở cả 3 arm NC-family.
- Gộp I1+J1+K10+L4 (đếm run NC-family): **4/84 run** có n=148
  poison-like, Wilson 95% **[1,9%, 11,6%]**; chỉ tính stress:
  2/80 = 2,5% [0,7%, 8,7%]. L4 stress 0/30 tương thích với tỉ lệ
  gộp (P(0/30 | 4,8%) ≈ 0,23) — 0/30 không phải bằng chứng chống
  lại chế độ (b), chỉ là hiếm (như K10 đã kết luận ở 0/30 của nó).
- Crash: 0/70 stress + 0/7 smoke main + 0/8 smoke gray = **0/85 run
  L4**; gộp F3+G3+H1+I1+J1+K10+L4: **0/592 lần chạy** (Wilson 95%
  cận trên 0,64%). Mọi claim vẫn chỉ ở mức "khử biểu hiện pixel".

## 4. Cơ chế + quyết định

### 4.1 Kết quả thực nghiệm (chắc chắn)

1. **(ii) Pull theo nhu cầu (activate) — BỊ BÁC.** C720PAD0 (chỉ
   pull, không cache_stop, 0 frame pad) lệch 869/1500, không khác
   gì NC (p=0,81). Đổi cơ chế pull của graph không khử được race.
2. **(iii) Thêm frame ở EOF — BỊ BÁC.** A720PADADD (1 frame pad màu
   đặc, không giữ ref) lệch 853/1500, không khác gì NC (p=0,71).
   Frame pad ở EOF không khử được race — kể cả ở vùng drain (drain
   59/60 frame lệch, ngang NC 61).
3. **(i) Giữ ref `cache_stop` — LÀ THÀNH PHẦN HOẠT ĐỘNG (loại trừ).**
   TPAD1 = (ii) + (i) + (iii) khử hoàn toàn (0/1500); (ii) một mình
   và (iii) một mình đều không khử; phần còn lại duy nhất là (i).
   Bằng chứng dương độc lập cho họ "giữ ref/copy": `copy` (0/1500,
   mọi đợt) và NEEDS_WRITABLE (0/1500, K10) cũng khử hoàn toàn.
4. **Phân biệt sạch theo đúng ranh giới "giữ ref hoặc copy" vs
   "không giữ gì"** — giữ nguyên từ K10 §4.1, nay đã tách được tới
   từng thành phần của tpad: 5 biện pháp khử (copy, NW, tpad6,
   tpad1, và nay loại trừ ra cache_stop) vs 4 biện pháp không khử
   (null, format, pad0-pull, padadd-EOF).

### 4.2 Cơ chế — VẪN CHƯA RÕ PHẦN LÕI (không claim)

Loại trừ đã xong, nhưng "tại sao giữ ref tới frame cuối lại khử được
race GIỮA STREAM (786–813 frame lệch mid-stream, không chỉ ở drain)"
vẫn chưa có lời giải thích đầy đủ: `filter_frame` của transform là
đồng bộ và không giữ frame (K10 §1.1), decode/filter đơn luồng
(`-threads 1`), nên việc giữ ref không nên ảnh hưởng tới các frame
giữa stream — trừ khi libvidstab giữ con trỏ frame thô qua lần gọi
(chưa đọc được source `transform.c`) hoặc hành vi queue/pool của
graph ở tầng chưa đo. Không đoán mò thêm. Nợ này chuyển sang đợt sau
cùng với §5.4 (artifact bilinear — xem có liên quan không).

### 4.3 Quyết định: KHÔNG sửa production từ đợt này

- Không đổi code production, không đổi chuỗi filter production, không
  đề xuất ship tpad/NEEDS_WRITABLE lúc này:
  - Biết thành phần hoạt động là `cache_stop` KHÔNG làm tpad thành
    biện pháp ship được: TPAD1 vẫn thêm 1 frame vào output (phải trim
    lại sau transform), và cơ chế lõi (§4.2) vẫn chưa rõ — ship lúc
    này vẫn là cargo-cult (lập trường J1 §4.2 giữ nguyên).
  - NEEDS_WRITABLE cần ship ffmpeg tự build thay cho ffmpeg hệ thống
    (quyết định hạ tầng, thuộc về parent/user; F3 đã nêu).
  - Production `copy` đã đạt 0/1500 ở mọi endpoint đo được — không
    có lý do đo được nào để đổi.
- Giá trị của đợt này là PHÂN BIỆT CƠ CHẾ ĐẾN CÙNG: 2 trong 3 thành
  phần của tpad bị bác bằng test có power, thành phần thứ ba được
  xác định bằng loại trừ; cộng thêm §5 (artifact bilinear) và §2.3
  (sửa parser) — cả hai đều là phát hiện mới có giá trị cho các đợt
  sau.

## 5. Probe aliasing offset — phương pháp gray identity BỊ BÁC + artifact bilinear tất định

### 5.1 Thiết kế (K10 §5.5)

Clip mà mỗi input frame có danh tính đọc được: `gray720.mp4` /
`gray1080.mp4` — frame n là màu xám đặc Y=n (0..149), U=V=128
(validate bằng decode trực tiếp: meanY == n cho cả 150 frame, cả 2
size). Vì frame xám đặc bất biến dưới mọi phép biến đổi không gian,
output frame n có meanY=m nghĩa là transform đã đọc input frame m
(offset m−n). Phân tích offsets đọc meanY từng frame output, chuẩn
hoá coverage từ arm CP cùng size (coverage[n] = median meanY CP[n]/n
— hoá ra luôn = 1, không có hiệu ứng viền đen/zoom; frame n=0 suy
biến Y=0 nên bỏ khỏi đếm).

### 5.2 V1 chết ngay ở smoke: trf identity làm race biến mất

Thử đầu tiên dùng trf identity (150 frame, motion list rỗng →
transform 0): Y720NC 0/150, sha == Y720CP (`0f2624e5d33e`); Y1080NC
0/150, sha == Y1080CP (`980fc6f00b17`). Với transform identity, race
KHÔNG tái hiện cả ở 720p (nơi baseline là ~56%) — P(0/150 | 56%)
≈ 0. Nên phương pháp v1 không đo được offset: nó đo một cấu hình
mà race không xảy ra. V1 bị bỏ.

### 5.3 V2 cũng chết: trf thật + clip xám vẫn không tái hiện race

Đổi sang trf rung thật (`shaky720.trf` / `detect-shaky1080-5s.trf`,
cùng trf với clip shaky): Y720NC 0/150, sha == Y720CP
(`e3b593d6e580`); Y1080NC 0/150, sha == Y1080CP (`c6c359f8f209`).
Phân tích offsets sau khi sửa parser (§2.3): cả 4 arm đọc đúng
149/149 frame (n=0 bỏ qua), 0 offset, 0 khác. **Kết luận: race (theo
định nghĩa endpoint NC-vs-CP) không tái hiện trên nội dung xám đặc,
dù transform là thật.** Full n=10 KHÔNG chạy — tiền đề của phương
pháp đã bị bác ở n=1 với p-value thực tế bằng 0 ở 720p; chạy thêm
chỉ tốn ~20 phút để khẳng định lại điều đã rõ.

Đọc đúng mức: 0/1500 ở đây là bound cho "NC-vs-CP trên clip xám",
KHÔNG phải bound cho aliasing offset của race trên clip shaky —
offset vẫn chưa đo được (xem §5.5 cho hướng thay thế). Nội dung clip
(xám đặc / giải mã nhanh / không có chi tiết) là một biến độc lập:
race phụ thuộc nội dung clip (hoặc tốc độ decode), không chỉ
transform — manh mối mới cho cơ chế.

### 5.4 Artifact nội suy bilinear tất định của libvidstab (phát hiện chính của §5)

Trong lúc kiểm tra V2 bằng rawvideo (đọc trực tiếp từng pixel output,
không qua md5), phát hiện transform với trf thật làm lệch pixel một
cách TẤT ĐỊNH — hoàn toàn khác với race:

- **Frame 0:** output toàn bộ là giá trị của frame 1 (clip 1n:
  Y=1 hết; clip 2n — frame n có Y=2n — frame 0 output Y=1 hết =
  trung bình của frame 0 và frame 1).
- **Frame n≥1:** ~99,6% pixel giữ giá trị n, ~8100/2073600 pixel
  (0,39%) mang giá trị n+1, xếp thành các đường chéo (mỗi hàng ~7–8
  pixel, x giảm ~5/hàng, các đường cách nhau ~256 px). U/V cũng +1
  (129 thay vì 128) dọc cùng các đường chéo.
- **Clip 2n (phân biệt):** pixel lạ mang giá trị 2n+1 = TRUNG BÌNH
  50/50 của frame n (2n) và frame n+1 (2n+2) — chứng minh trực tiếp
  rằng các pixel này là pha trộn của 2 frame liên tiếp, không phải
  lỗi làm tròn.
- **Chỉ xảy ra với `interpol=2` (bilinear, mặc định):**
  `interpol=0` (no) và `interpol=1` (linear) cho output thuần khiết
  (frame n toàn n, kể cả frame 0); trf identity cũng thuần khiết.
  `smoothing=0` không khử được (frame 1 thuần, frame 3 tăng gấp đôi
  16200 pixel lạ) — artifact nằm trong đường bilinear của
  `vsDoTransform`, không phải đường smoothing.
- **TẤT ĐỊNH, bit-identical qua mọi biến thể:** `-threads 1` vs mặc
  định, input mp4 vs rawvideo, có `copy` hay không — md5 150/150
  frame giống hệt nhau giữa 4 chuỗi (direct NC, direct COPY+xf,
  harness Y1080NC r1, harness Y1080CP r1). `copy` KHÔNG ngăn được
  (md5 copy+xf == md5 nc, 150/150) — ngược hẳn với race trên clip
  shaky (copy khử hoàn toàn). Nên đây KHÔNG phải race buffer-reuse;
  nó là hành vi tất định của đường bilinear trong libvidstab.
- **Hệ quả cho phương pháp gray:** NC-vs-CP mù hoàn toàn với
  artifact này (cả hai arm chứa nó giống hệt nhau) — đó là lý do
  gray NC == CP tuyệt đối trong khi output vẫn lệch khỏi source.
  `framemd5` của transform output khác source md5 ở cả 150/150
  frame (trong khi chuỗi `copy` thuần giữ md5 150/150) — nhưng đó là
  do artifact pixel thật, không phải do stride (đã kiểm chứng bằng
  rawvideo: pixel output khác source thật).

**Chưa rõ (ghi nợ, không đoán):** cơ chế nội bộ nào trong đường
bilinear của libvidstab đọc được pixel frame n+1 (nghi vấn hàng đầu:
sampler đọc tràn sang buffer frame kề trong pool — nhưng cần source
`transform.c` để xác nhận, vẫn chưa có); tại sao U/V +1 trong khi
frame n+1 cũng có U/V=128 (pha trộn khung không giải thích được U+1
— mâu thuẫn chưa gỡ); tại sao frame 0 bị pha trộn toàn bộ. Cần source
libvidstab hoặc test thêm với clip có danh tính mạnh hơn (xem §5.5).

### 5.5 Hướng thay thế cho endpoint 1080p (đề xuất cho đợt sau, chưa làm)

Gray identity đã hết đường. Hướng còn lại: clip mà mỗi frame có danh
tính đọc được NHƯNG vẫn tái hiện race — tức nội dung phải giống clip
shaky (nhiễu/chi tiết, decode chậm) thay vì xám đặc. Đề xuất: clip
nhiễu giả-ngẫu nhiên với seed riêng từng frame (150 frame, mỗi frame
một pattern nhiễu khác nhau, cùng codec h264 + cùng trf rung thật);
frame output lệch sẽ tương quan mạnh nhất với một source frame m nào
đó (đọc qua tương quan chéo có tính tới transform #n, hoặc so với
output CP đã biết). Chưa validate — chỉ là đề xuất. Ngoài ra: endpoint
1080p trên clip shaky vẫn không có power (NC 1/1500 ở K10) — mọi cặp
1080p vẫn p=1,0; đó là giới hạn đứng, không có bound mới từ đợt này.

## 6. Giới hạn và nợ mở (trung thực)

1. **Endpoint crash vẫn mở.** 0/85 run L4; gộp F3+G3+H1+I1+J1+K10+L4:
   **0/592 lần chạy** (Wilson 95% cận trên 0,64%). Mọi claim chỉ ở mức
   "khử biểu hiện pixel", không claim "khử crash" cho copy/NW/tpad.
2. **Endpoint per-frame chỉ mạnh ở 720p.** Ở 1080p NC chỉ lệch 1/1500
   (K10) — không có power; mọi cặp 1080p p=1,0. Gray identity không
   cứu được endpoint này (§5).
3. **Poison chỉ phủ được mặt phẳng đã track + test heavy có giới
   hạn.** Tỉ lệ poison gộp vẫn dựa trên mẫu nhỏ (4/84 run) — CI rộng
   [1,9%, 11,6%]. Parser showinfo đã sửa (§2.3) nhưng test poison
   vẫn dùng mean nguyên của showinfo — blend phân số vẫn bị làm tròn.
4. **Cơ chế lõi vẫn chưa rõ** (§4.2): tại sao giữ ref frame cuối khử
   được race giữa stream. Chưa đọc được source libvidstab
   `transform.c` (không có trên đĩa, không deb-src) — nợ từ K10 §5.6,
   vẫn mở. Artifact bilinear §5.4 có thể liên quan hoặc không — chưa
   rõ, cần source để phân biệt.
5. **Aliasing offset chưa đo được** (xem §5.5): gray identity bị bác
   ở cả v1 lẫn v2; hướng nhiễu seed-riêng chưa làm.
6. **Parser showinfo đã sửa ở harness L4, chưa mang sang J1/K10:**
   các harness cũ vẫn mang lỗi gán nhầm frame kề (§2.3) — số liệu
   showinfo/poison của chúng có nhiễu nhỏ (endpoint md5 không bị ảnh
   hưởng). Đợt sau nên backport sửa này (3 chỗ: tước status-line +
   `\s+` trong regex + `\[\s*...\s*\]`).
7. **Sóng EPERM không xuất hiện trong lượt này** (0 lần trong
   full-run.log) — nhưng K10 đã ghi 3 sóng trong 3 ngày; không tuyên
   bố "đã hết". Resume từ results.jsonl không cần dùng tới lượt này.
8. **Không chạy tsc/vite build trong luồng này:** không sửa file
   production, không đụng file TS/TSX — chỉ thêm 2 file harness JS +
   1 file LIMITS md. Parent kiểm chứng ở bước gộp như thường lệ.
9. Nợ chung các đợt trước (không thuộc luồng này): TTS 39 (CẤM kiểm
   lại); G1/G2; kernel Mitchell đã vào production (K2, đợt 83);
   ci-security.yml / ci-build.yml 403; release gate giữ nguyên
   (KHÔNG release/tag).

## 7. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round84_l4_vidstab_tpad_component.js` —
  harness L4 (mới; kế thừa K10 + 2 arm probe PAD0/PADADD + GT family
  padadd + sửa lỗi hiển thị gtWholeSha + sửa parser showinfo).
- `server/render/src/test_round84_l4_vidstab_gray_identity.js` —
  harness gray-identity (mới; clip xám + trf thật + phân tích offsets
  chuẩn hoá coverage + cùng sửa parser showinfo).
- `docs/PHASE9_ROUND84_L4_VIDSTAB_TPAD_COMPONENT_LIMITS.md` — tài
  liệu này.

Không stage: cây đo `~/workspace/.scratch-r84l4/` (runs/, smoke/,
gray-smoke/, gray-smoke2/, *.framemd5, *.stderr, *.raw, gray*.mp4,
identity150.trf, full-run.log, analysis-perframe-v1parser.json), log
luồng `hidden_files/round84-l4.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

# LIMITS — Phase 9 đợt 80 H1: vidstab crash dưới taskset 2 core (nợ đợt 79 G3 §6 bước 1)

Luồng H1 — tái hiện crash vidstab MẠNH HƠN: pin ffmpeg + hog lên đúng 2 core
bằng `taskset -c 0-1` để mô phỏng lại VM 2 vCPU thời D3/E3 (nơi NOCOPY 1080p
crash 7/10 = 70% với setup F). Đóng nợ G3 §6 bước 1 (bước rẻ nhất trong danh
sách setup mạnh hơn).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round80-h1.md`.
Harness: `server/render/src/test_round80_h1_vidstab_taskset_stress.js`.
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3),
libvidstab 1.1.0, VM 4 vCPU EPYC 9D25, 8 GB, không GPU, cell chia sẻ
1,5 CPU. Ngày: 10/11/2026 (lượt cron 15:35 +07 → luồng chạy ~15:40–16:40).
Clip + .trf dùng chung với E3/F3/G3: `shakynoisy1080.mp4` (150 frame, 5 s,
30 fps) + `detect-shaky1080-5s.trf`; `shaky720.mp4` + `shaky720.trf`.
Ground truth sha: 1080p `d960996868d3…`, 720p `397ba4e1a870…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Taskset có khôi phục được crash không | **KHÔNG.** 0 crash trên cả 60 lần chạy stress (NC 0/20, SP 0/20, CP 0/20), Fisher p=1,0 mọi cặp. Gate 0/5. Cửa sổ thiếu power cho endpoint crash — **lần thứ 3 liên tiếp** sau F3 và G3. |
| Taskset có tạo contention thật không | **CÓ, nhưng có điều kiện.** Hog pin core 0-1 chạy 41,9%/39,8% CPU lúc máy yên (G3 hog không pin chỉ ~6%); khi loadavg chung lên 17,48 thì hog chỉ còn 11,8%/11,2% (cùng chia quota cell 1,5 CPU với các luồng đợt 80 khác). Contention từ hog là thật nhưng bị trần cgroup bóp. |
| COPY-vs-SPLIT head-to-head (mới, lần đầu đo trực tiếp) | **HÒA tuyệt đối ở mức sha.** Cả hai đều 10/10 = ground truth ở cả 1080p và 720p; Fisher sha-lệch p=1,0 cả hai kích thước. Production `copy` đã đạt đúng hiệu quả như SPLIT — không có lý do đổi `copy` → SPLIT. |
| Sha: SPLIT/COPY có khử race ở mức pixel không | **CÓ — lần thứ 3 liên tiếp.** 720p: SP 10/10 GT, CP 10/10 GT, NC 0/10 GT (10 sha khác nhau); Fisher sha-lệch p≈1,08×10⁻⁵ cho cả SP-vs-NC và CP-vs-NC. 1080p: NC 9/10 GT (1 lệch), SP/CP 10/10 — Fisher p=1,0 (không có power ở 1080p, như F3/G3). |
| Triển khai production? | **KHÔNG THAY ĐỔI.** Giữ nguyên `copy` (enhance.js:188). Không có bằng chứng số nào ủng hộ đổi. |
| Có cần ffmpeg tự build (NEEDS_WRITABLE) không | **KHÔNG — vẫn như G3.** `copy` (đã có trong production) và SPLIT đều đạt hiệu quả sha như bản patch mà không tốn build riêng. Crash vẫn chưa đo được ở bất kỳ đường nào. |
| Chi phí runtime | **~0.** Trung vị 1080p: NC 79,5 s, SP 85,6 s (+7,7%), CP 80,2 s (+0,9%); 720p: NC 21,6 s, SP 23,9 s (+10,6%), CP 21,0 s (−2,8%). Chênh lệch trong nhiễu tải chung — không kết luận SPLIT chậm hơn. |
| Power analysis (xem §3.3) | Control 1080p gộp F3+G3+H1: **0/40** vs E3-F 7/10 → Fisher p≈1,2×10⁻⁶; P(0/40 \| p=0,70) ≈ 1,2×10⁻²¹. Tỉ lệ crash thật ở cửa sổ hiện tại <8,8% (Wilson upper 0/40). Nếu tỉ lệ thật là 5% thì n=10/arm chỉ có 40% cơ hội thấy ≥1 crash; muốn 95% cần n≈59/arm — và phân biệt SP-vs-NC ở mức đó cần hàng trăm lần/arm. |

## 1. Điểm khác duy nhất so với G3: taskset

Setup F giữ nguyên (LD_PRELOAD free_track_v2d + segv_backtrace của D3,
showinfo cuối chuỗi, `-v info`, `-threads 1`, xen kẽ theo vòng, khớp
RDI→FREE theo khoảng, chỉ dùng ffmpeg stock 8.1.2). Thêm:

```
ffmpeg: taskset -c 0-1 ffmpeg -threads 1 ...
hog:    taskset -c 0-1 yes   (2 hog, 1/core — G3 dùng 3 hog KHÔNG pin)
```

Chuỗi filter (trim 0:5 + setpts + ... + showinfo ở mọi arm):

```
NOCOPY: trim,setpts,vidstabtransform=input='<trf>':smoothing=10:optalgo=gauss,showinfo
SPLIT:  trim,setpts,split[a][b];[a]vidstabtransform=...:...,showinfo;[b]nullsink
COPY:   trim,setpts,copy,vidstabtransform=...:...,showinfo   (đường production,
        enhance.js:188 — `copy` ngay trước vidstabtransform, đợt 70 X8)
```

Smoke trước gate: 720p NOCOPY dưới taskset + preload — exit 0, 150 frame,
3,08 s, sha `41542ae8af91` ≠ GT (đúng kỳ vọng NOCOPY 720p — race biểu hiện
ở sha). Đường gọi taskset + preload hoạt động.

## 2. Gate 5× NOCOPY 1080p dưới taskset — 0/5 crash, nhưng contention là thật

| Hạng mục | Số đo |
|---|---|
| Crash gate | **0/5** (Wilson 95% [0, 0,4345]) — taskset KHÔNG khôi phục được crash ở gate |
| Hog %CPU (sau khởi động) | **41,9% / 39,8%**, đúng core 0/1 (cột PSR) — G3 hog không pin chỉ ~6% mỗi tiến trình |
| Hog %CPU (cuối gate) | 14,7% / 21,1% (loadavg lúc đó 15,90 — tải các luồng đợt 80 khác đè lên) |
| Thời gian 1080p trung vị | 76,8 s (r1 30,4 s lúc máy yên; r2–r5 72–89 s) — tương đương G3 (~75–79 s) |
| Sha gate | 4/5 = GT, **1/5 lệch** (`3151be0d2da7`, r5) — race vẫn biểu hiện ở mức pixel |

Đọc: taskset tạo contention thật (hog chạy ~40% CPU thay vì ~6%), nhưng
contention đó KHÔNG đủ để đưa race lên crash. Cửa sổ vẫn thiếu power cho
endpoint crash — lần thứ 3 liên tiếp sau F3 và G3. Vẫn chạy stress đầy đủ
vì endpoint sha CÓ power (như G3) + task yêu cầu so sha COPY/SPLIT/NOCOPY.

## 3. Stress — thiết kế và kết quả

Thiết kế (harness `test_round80_h1_vidstab_taskset_stress.js`, WORK
`~/workspace/.scratch-r80h1/runs/`, `results.jsonl` + `summary.json` +
`hog-cpu-snapshots.txt`):

- ĐÚNG setup F + taskset: `taskset -c 0-1` cho cả ffmpeg lẫn 2 hog,
  LD_PRELOAD free_track_v2d + segv_backtrace (binary .so của D3),
  `showinfo` cuối chuỗi, `-v info`, `-threads 1`, không chờ máy yên.
- 6 arm × n=10, **xen kẽ nghiêm ngặt theo vòng** (mỗi vòng chạy 1 lần mỗi
  arm, chung cửa sổ tải). Tổng 60 lần chạy (~47 phút stress + ~6 phút gate
  + ~3 phút smoke). 5 lần A1080NC của gate được tính vào stress (cùng
  setup taskset — hợp lệ, như G3); 360p bỏ (endpoint sha đã bão hòa ở G3).
- Chỉ dùng ffmpeg stock 8.1.2 — KHÔNG dùng binary đã patch của F3.
- Khớp RDI→FREE theo KHOẢNG (F3 §3). Không có crash nào nên logic này
  không được áp dụng trên dữ liệu mới — giống F3 §6.6 / G3 §3.
- Khôi phục từ results.jsonl: stress chạy lại sau gate vẫn giữ đúng 60 lần
  duy nhất (không trùng, không thiếu).

### 3.1 Tỉ lệ crash — 0/60, KHÔNG phân biệt được (Fisher p=1,0)

| Arm | Cấu hình | N | Crash | Wilson 95% |
|---|---|---|---|---|
| A1080NC | stock 1080p NOCOPY | 10 | **0** | [0, 0,2775] |
| B1080SP | stock 1080p SPLIT | 10 | **0** | [0, 0,2775] |
| C1080CP | stock 1080p COPY | 10 | **0** | [0, 0,2775] |
| D720NC | stock 720p NOCOPY | 10 | **0** | [0, 0,2775] |
| E720SP | stock 720p SPLIT | 10 | **0** | [0, 0,2775] |
| F720CP | stock 720p COPY | 10 | **0** | [0, 0,2775] |
| **Tổng** | | **60** | **0** | NC 0/20, SP 0/20, CP 0/20 |

- Fisher exact 2-sided cho crash, cả 6 cặp: **p=1,0**.
- **Control không tái hiện baseline lịch sử — lần thứ ba liên tiếp:**
  H1 A1080NC 0/10 vs E3-F 7/10 → Fisher **p=0,0031** (chỉ riêng H1 đã
  bác bỏ tỉ lệ 70% ở mức p<0,01); gộp F3+G3+H1 (0/40) vs E3-F 7/10 →
  **p≈1,2×10⁻⁶**; vs D3 v2d-load 7/16 → **p≈4,9×10⁻⁵**.
  P(0/40 | p=0,70) ≈ 1,2×10⁻²¹. Tỉ lệ crash thật ở cửa sổ hiện tại thấp
  hơn hẳn cửa sổ D3/E3 (upper bound Wilson 0/40 ≈ 0,088; 0/60 toàn bộ
  các lần chạy H1 ≈ 0,060).
- Tất cả 60 lần chạy đều lastFrame=149 (chạy hết 150 frame 0..149).

### 3.2 Tín hiệu sha — SPLIT và COPY đều khử hoàn toàn biểu hiện race ở mức pixel

| Arm | Sha (không crash) | Số sha khác nhau | Sha == GT |
|---|---|---|---|
| A1080NC | 9× `d960996868d3`, 1× `3151be0d2da7` (gate r5) | **2** | 9/10 |
| B1080SP | 10× `d960996868d3` | **1** | **10/10** |
| C1080CP | 10× `d960996868d3` | **1** | **10/10** |
| D720NC | 10 sha khác nhau, mỗi sha 1 lần | **10** | 0/10 |
| E720SP | 10× `397ba4e1a870` | **1** | **10/10** |
| F720CP | 10× `397ba4e1a870` | **1** | **10/10** |

Fisher exact 2-sided cho "sha lệch khỏi GT":

| Cặp | Lệch | Fisher p |
|---|---|---|
| 1080p B-vs-A (SP-vs-NC) | 0/10 vs 1/10 | 1,0 |
| 1080p C-vs-A (CP-vs-NC) | 0/10 vs 1/10 | 1,0 |
| 1080p B-vs-C (SP-vs-CP) | 0/10 vs 0/10 | 1,0 |
| 720p E-vs-D (SP-vs-NC) | 0/10 vs 10/10 | **≈1,08×10⁻⁵** |
| 720p F-vs-D (CP-vs-NC) | 0/10 vs 10/10 | **≈1,08×10⁻⁵** |
| 720p E-vs-F (SP-vs-CP) | 0/10 vs 0/10 | 1,0 |

(Lưu ý: `summary.json` in Fisher 720p là `0` do làm tròn 4 chữ số —
giá trị chính xác tính lại bằng `math.comb` là 1,08×10⁻⁵, giống hệt G3.)

- **Mới trong H1: so sánh trực tiếp COPY-vs-SPLIT.** Ở cả hai kích thước,
  COPY và SPLIT đều cho sha ổn định tuyệt đối 10/10 = GT, không lệch nhau
  lần nào. Đây là lần đầu hai đường được đo head-to-head trong cùng setup
  (G3 chỉ so SPLIT-vs-NOCOPY; E3 đo COPY ở setup khác). Kết luận thực hành:
  production `copy` đã đạt đúng hiệu quả như SPLIT — đổi `copy` → SPLIT
  là đổi ngang, không có bằng chứng lợi ích.
- Ở 1080p, race hiếm khi lệch pixel (NC chỉ lệch 1/10 — khớp F3: 1/15,
  G3: 1/10) nên cặp 1080p không có power cho endpoint sha; không kết
  luận gì từ p=1,0 ở đó.
- Thời gian chạy trung vị: 1080p NC 79,5 s / SP 85,6 s / CP 80,2 s;
  720p NC 21,6 s / SP 23,9 s / CP 21,0 s. So với G3 (không taskset:
  1080p ~75–79 s, 720p ~21 s) — taskset + hog cùng core KHÔNG làm
  ffmpeg chậm đi rõ rệt (cell 1,5 CPU mới là trần, không phải số core).
- nFreeLarge (số FREE size ≥ 1 MB, mô tả): trung vị 10–11 ở 1080p,
  0 ở 720p, gần như giống nhau giữa các arm cùng kích thước — không
  tách được arm nào, đúng như cảnh báo trong harness: đây KHÔNG phải
  chỉ số near-miss.

### 3.3 Power analysis — cửa sổ thiếu power lần thứ 3, và tăng n cũng không cứu được

- Nếu tỉ lệ crash thật là 5%: P(thấy ≥1 crash trong n=10) = 0,40;
  trong 40 lần control gộp = 0,87. Nếu tỉ lệ thật là 2%: P(≥1 trong 10)
  chỉ 0,18. Muốn 95% cơ hội thấy ≥1 crash: cần n≈59/arm ở p=0,05,
  n≈149/arm ở p=0,02.
- Và "thấy ≥1 crash" mới chỉ là bước 1: để PHÂN BIỆT hai arm (ví dụ
  NC 5% vs SP 0%) với power 80% ở α=0,05 cần hàng trăm lần chạy mỗi arm
  — vượt xa cửa sổ cron 3 giờ (60 lần chạy đã tốn ~50 phút).
- Kết luận: **endpoint crash không đo được bằng cách tăng n trong cửa sổ
  này.** Hướng duy nhất còn lại là đổi endpoint (đo "suýt crash", §6
  bước 3) hoặc đổi máy (máy 2 vCPU thật, §6 bước 2).

## 4. Vì sao taskset vẫn không crash? (cập nhật giả thuyết F3 §4 / G3 §4)

G3 §6 bước 1 đã thử xong — và nó KHÔNG khôi phục được crash. Cập nhật
từng giả thuyết:

1. **VM đổi phần cứng (vẫn mạnh nhất, nhưng taskset không tách được
   factor):** pin 2 core trên VM 4 vCPU KHÔNG giống VM 2 vCPU thật —
   scheduler, cache/NUMA, và đặc biệt **quota cgroup cell 1,5 CPU**
   vẫn là trần chung: hog chỉ chạy 11–42% CPU tùy tải chung, và ffmpeg
   không chậm đi rõ rệt so với G3. Giả thuyết "2 vCPU" chưa bị bác bỏ,
   chỉ bị bác bỏ dạng "pin core là đủ để mô phỏng" của nó. Cần máy
   2 vCPU thật mới tách được factor này.
2. **Cell CPU bị throttle (đã đo, củng cố):** hog pin core chạy
   41,9%/39,8% lúc máy yên nhưng chỉ 11,8%/11,2% khi loadavg chung lên
   17,48 — quota cell chia sẻ với các luồng đợt 80 khác. **Contention
   do hunt tạo ra bị trần cgroup bóp, không điều khiển được.** Loadavg
   càng không phải chỉ số power của hunt.
3. **Cửa sổ tải khác (yếu đi):** load1 từng lần chạy dao động 0,37–19,87
   mà vẫn 0 crash; cửa sổ "yên" (r1 30,4 s) hay "ồn" (load 19,87) đều
   không crash — khác hẳn D3/E3. Tải không còn là giải thích đủ.
4. **Không phải do tracker:** cùng binary .so D3, cùng chain, cùng
   clip/.trf, cùng setup F — loại trừ được sai khác công cụ (như F3).
5. **Giả thuyết mới (chưa kiểm chứng):** có thể D3/E3 crash nhiều do
   một yếu tố đã đổi mà không ai ghi lại — ví dụ image VM / kernel /
   bản build ffmpeg khác, hoặc cửa sổ D3/E3 có một tiến trình nền khác
   gây đúng kiểu contention cần thiết (không phải CPU thuần). Không có
   dữ liệu để tách — ghi nhận để đợt sau khỏi đi lại đường mòn CPU.

## 5. Khuyến nghị triển khai (bằng chứng, không phải quyết định)

Quyết định cuối thuộc về đợt sau/user. Luồng này chỉ đưa bằng chứng:

- **Giữ nguyên production `copy` (enhance.js:188).** H1 đo trực tiếp lần
  đầu: COPY = SPLIT ở mức sha (cùng 10/10 = GT ở cả hai kích thước),
  cùng 0/20 crash, cùng chi phí ~0. Không có bằng chứng nào ủng hộ đổi
  `copy` → SPLIT hay đổi sang ffmpeg tự build.
- **ffmpeg tự build (NEEDS_WRITABLE) vẫn không cần thiết.** Ba đường
  (COPY, SPLIT, NEEDS_WRITABLE) đều đạt hiệu quả sha như nhau; đường
  rẻ nhất (`copy`, đã có trong production) đã đủ.
- **Endpoint crash vẫn mở — và không nên săn tiếp bằng taskset/hog/n.**
  Ba hunt liên tiếp (F3 0/90, G3 0/60, H1 0/60) với 0/40 control 1080p
  gộp đã đủ để kết luận cửa sổ hiện tại không đo được crash. Săn tiếp
  bằng cùng họ phương pháp là đốt lượt cron. Hướng tiếp theo (nếu user/
  đợt sau còn muốn đo crash): máy 2 vCPU thật, hoặc instrumentation đo
  "suýt crash" — xem §6.
- **Không claim bất kỳ đường nào "khử crash"** cho tới khi có hunt có
  power (control crash được) — quy tắc từ F3, giữ nguyên.

## 6. Đề xuất setup tái hiện mạnh hơn nữa (cho đợt sau, khi cần đo crash)

G3 §6 bước 1 (taskset) đã thử xong trong luồng này. Các bước còn lại, theo
thứ tự rẻ → đắt:

1. ~~Pin CPU bằng `taskset`~~ — ĐÃ THỬ (luồng này).
2. **Chạy trên máy 2 vCPU thật** (nếu có VM/máy khác): tách hẳn factor phần
   cứng khỏi factor cửa sổ — taskset trên VM 4 vCPU vẫn chia sẻ cùng
   scheduler/cgroup với các luồng khác, chưa chắc mô phỏng đúng VM 2 vCPU.
3. **Đo "suýt crash" thay vì crash:** instrument qua preload .so để đếm số
   lần transform chạm vào buffer đã free (hoặc refcount bất thường) ngay cả
   khi không segfault — cần code mới, là một luồng riêng, nhưng là cách duy
   nhất đo được race khi cửa sổ không crash. Dữ liệu H1 có sẵn để bắt đầu:
   free-track log ghi mọi FREE (addr/size/seq/tid) từng lần chạy; cần thêm
   phía filter (frame nào transform đang giữ lúc free xảy ra) mới khớp được.
4. **Tăng n không giải quyết được:** nếu tỉ lệ thật <5% thì cần n≈60/arm
   control mới có ~95% cơ hội thấy ≥1 crash — đắt và vẫn chưa chắc đủ power
   để phân biệt các arm.
5. **Không thử lại:** tăng hog (G3 đã chứng minh vô ích khi không pin; H1
   chứng minh pin hog lên ~40% CPU vẫn không crash — contention CPU không
   phải yếu tố quyết định).

## 7. Giới hạn và nợ mở (trung thực)

1. Crash rate: 0/60 stress (NC 0/20, SP 0/20, CP 0/20) + gate 0/5 (đã
   tính vào stress) — thí nghiệm KHÔNG có power cho endpoint crash, lần
   thứ 3 liên tiếp. Control 1080p gộp F3+G3+H1: 0/40 vs E3-F 7/10 →
   Fisher p≈1,2×10⁻⁶. Mọi claim về crash đều phải chờ hunt có power.
2. Endpoint sha chỉ mạnh ở 720p; ở 1080p race hiếm lệch pixel nên cặp 1080p
   yếu cho endpoint sha (như F3/G3).
3. Đường đi direct/non-direct không quan sát trực tiếp được — bằng chứng là
   sha output trùng đường non-direct, như F3 §6.2.
4. Không có mẫu crash nào nên logic khớp RDI→FREE theo khoảng chưa được áp
   dụng trên dữ liệu mới (chỉ verify trên dữ liệu cũ F-r2 ở F3).
5. nFreeLarge (số FREE size ≥ 1 MB) chỉ là số mô tả — KHÔNG phải chỉ số
   near-miss, không dùng để claim gì về race.
6. Nợ chung các đợt trước (không thuộc luồng này): TTS 39 (gradio/pillow,
   CẤM kiểm lại); kernel upscale BC(0,25, 0,375) đã nối vào production ở F6;
   G1/G2 chưa phân biệt được; ci-security.yml / ci-build.yml vẫn 403;
   release gate giữ nguyên (KHÔNG release/tag).

## 8. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round80_h1_vidstab_taskset_stress.js` — harness
  stress NOCOPY-vs-SPLIT-vs-COPY 6 arm × n=10 dưới taskset (cores 0-1),
  gate 5× trước stress, Fisher exact 2-sided, khôi phục từ results.jsonl,
  snapshot %CPU hog, nFreeLarge.
- `docs/PHASE9_ROUND80_H1_VIDSTAB_TASKSET_LIMITS.md` — tài liệu này.

Không stage: cây đo `~/workspace/.scratch-r80h1/` (runs/, smoke/,
*.framemd5, *.stderr, free-track logs, summary.json, hog-cpu-snapshots.txt),
log luồng `hidden_files/round80-h1.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

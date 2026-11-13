# LIMITS — Phase 9 đợt 79 G3: thử đường SPLIT cho vidstabtransform (nợ đợt 78 F3 §5)

Luồng G3 — đóng nợ §5 của đợt 78 F3: thử SPLIT (chỉ đổi chuỗi filter,
không cần build ffmpeg riêng) ĐÚNG setup F, so crash rate SPLIT vs
NOCOPY control + so sha output. Quyết định ffmpeg tự build hay không
phụ thuộc kết quả này.
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round79-g3.md`.
Harness: `server/render/src/test_round79_g3_split_stress.js`.
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3),
libvidstab 1.1.0, VM 4 vCPU EPYC 9D25, 8 GB, không GPU, cell chia sẻ
1,5 CPU. Ngày: 10/11/2026 (lượt cron 09:35 +07 → luồng chạy ~09:40–11:40).
Clip + .trf dùng chung với E3/F3: `shakynoisy1080.mp4` (150 frame, 5 s,
30 fps) + `detect-shaky1080-5s.trf`; `shaky720.mp4` + `shaky720.trf`;
`shaky360.mp4` + `shaky360.trf`. Ground truth sha SPLIT (E3/F3):
1080p `d960996868d3…`, 720p `397ba4e1a870…`, 360p `414e114fe57c…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| SPLIT có giảm crash không | **KHÔNG ĐO ĐƯỢC — thí nghiệm thiếu power cho endpoint crash.** 0 crash trên cả 60 lần chạy stress (SP 0/30, NC 0/30), Fisher p=1,0 cả 3 cặp. Control không tái hiện được tỉ lệ lịch sử 7/10 của F. Không được dùng 0/30 để claim "SPLIT khử crash". |
| SPLIT có khử race ở mức pixel không | **CÓ — mạnh như NEEDS_WRITABLE.** SPLIT cho sha ổn định tuyệt đối 30/30, trùng ground truth ở cả 3 kích thước; NOCOPY lệch sha 19/30 (720p 10/10, 360p 8/10, 1080p 1/10). Fisher sha-lệch: 720p p≈1,1×10⁻⁵; 360p p≈7,1×10⁻⁴; 1080p p=1,0 (race hiếm lệch pixel ở 1080p, đúng như F3). |
| Triển khai production? | **KHÔNG THAY ĐỔI production.** Giữ nguyên `copy` trước vidstabtransform (`enhance.js:183`). Lý do ở §5. |
| Có cần ffmpeg tự build (NEEDS_WRITABLE) không | **KHÔNG — với bằng chứng hiện có, đường build riêng là không cần thiết.** SPLIT đạt đúng hiệu quả sha như bản patch (ổn định tuyệt đối, trùng đường non-direct) mà không tốn build riêng. Nhưng crash vẫn chưa đo được ở cả hai đường, nên đây là kết luận "không cần build", không phải "SPLIT đã chứng minh khử crash". |
| Chi phí runtime của SPLIT | **~0.** Thời gian chạy trung vị SPLIT ≈ NOCOPY ở cả 3 kích thước (1080p 74,9 s vs 78,5 s; 720p 21,1 s vs 20,8 s; 360p 4,5 s vs 5,2 s). Nhánh `nullsink` không tốn gì đáng kể. |

## 1. Chuỗi filter SPLIT (định nghĩa, và 1 điểm khác E3)

SPLIT lấy từ E3 §3.1, thêm `showinfo` trên nhánh `[a]` để giữ
instrumentation `lastFrame` giống hệt arm control (E3 dùng setup
segv-only, không có showinfo):

```
NOCOPY (control, giống hệt F3):
  trim=start=0:end=5,setpts=PTS-STARTPTS,
  vidstabtransform=input='<trf>':smoothing=10:optalgo=gauss,showinfo

SPLIT (ứng viên):
  trim=start=0:end=5,setpts=PTS-STARTPTS,
  split[a][b];[a]vidstabtransform=input='<trf>':smoothing=10:optalgo=gauss,showinfo;[b]nullsink
```

Cơ chế (E3 §3.1): `split` clone frame cho từng output; output 0
(transform) chạy đồng bộ TRƯỚC khi frame gốc được nhả → transform
không bao giờ thấy buffer đã bị decoder free ở drain/EOF ("ai free").
Smoke trước stress: SPLIT 1080p ×1 cho sha `d960996868d3` = ground
truth tuyệt đối → chuỗi filter đúng, `showinfo` trên nhánh `[a]`
hoạt động (lastFrame=149).

## 2. Gate kiểm tra power TRƯỚC stress (bài học F3 §4 — đã làm đúng lần này)

F3 đã không kiểm tra control trước và đốt 90 lần chạy vào cửa sổ
không có power. G3 làm 2 gate, mỗi gate 5× NOCOPY 1080p:

| Gate | Hog | Kết quả | Ý nghĩa |
|---|---|---|---|
| Gate 1 (WORK chính) | 3 (đúng setup F) | **0/5 crash** | Cửa sổ thiếu power cho endpoint crash |
| Gate 2 (WORK riêng `runs-hog8`) | 8 (tăng tải) | **0/5 crash** | Tăng hog KHÔNG khôi phục được crash |

Cả hai gate đều 0/5 dù load1 từng lần chạy lên tới 29,87 và có lần
chạy sha NOCOPY lệch khỏi ground truth (gate-1 r5 `e0f122882b5b`,
gate-2 r2 `41293469a65d`) — tức race vẫn biểu hiện ở mức pixel,
nhưng không leo thang tới crash trong cửa sổ này. Quan sát phụ:
mỗi tiến trình hog `yes` chỉ chạy ~6% CPU (cell bị throttle 1,5 CPU
chia sẻ) — loadavg cao chủ yếu đến từ các luồng đợt 79 khác, không
phải từ hog của hunt; tăng số hog không tăng được contention thật.
Kết luận gate: endpoint crash thiếu power ở cả 2 mức hog; vẫn chạy
stress đầy đủ vì endpoint sha CÓ power (F3 đã chứng minh NOCOPY
720p/360p lệch sha 15/15 trong cùng setup) và task yêu cầu so sha.

## 3. Stress — thiết kế và kết quả

Thiết kế (harness `test_round79_g3_split_stress.js`, WORK
`~/workspace/.scratch-r79g3/runs/`, `results.jsonl` + `summary.json`):

- ĐÚNG setup F: `LD_PRELOAD =
  free_track_v2d_preload.so:segv_backtrace_preload.so` (binary .so
  của D3), `showinfo` cuối chuỗi, `-v info`, `-threads 1`, 3 hog CPU,
  không chờ máy yên.
- 6 arm × n=10 (chọn n=10 thay vì 15 của F3 để vừa cửa sổ cron 3 giờ:
  endpoint sha đã bão hòa ở n=10 — xem §3.2; endpoint crash thì n
  nào cũng thiếu power trong cửa sổ này), **xen kẽ nghiêm ngặt theo
  vòng** (mỗi vòng chạy 1 lần mỗi arm, chung cửa sổ tải). Tổng 60
  lần chạy (~55 phút stress + ~25 phút gate/smoke).
- Chỉ dùng ffmpeg stock 8.1.2 — KHÔNG dùng binary đã patch của F3,
  KHÔNG build gì thêm trong luồng này.
- Khớp RDI→FREE theo KHOẢNG (F3 §3). Không có crash nào nên logic
  này không được áp dụng trên dữ liệu mới — giống F3 §6.6.
- Khôi phục từ results.jsonl: 5 lần A1080NC của gate-1 + 1 lần
  B1080SP của smoke nằm trong cùng WORK nên được tính vào stress
  (cùng hog=3, cùng setup — hợp lệ); 5 lần gate-2 hog=8 ở WORK riêng,
  KHÔNG gộp vào summary stress mà chỉ dùng làm bằng chứng gate.

### 3.1 Tỉ lệ crash — 0/60, KHÔNG phân biệt được (Fisher p=1,0)

| Arm | Cấu hình | N | Crash | Wilson 95% |
|---|---|---|---|---|
| A1080NC | stock 1080p NOCOPY | 10 | **0** | [0, 0,2775] |
| B1080SP | stock 1080p SPLIT | 10 | **0** | [0, 0,2775] |
| C720NC | stock 720p NOCOPY | 10 | **0** | [0, 0,2775] |
| D720SP | stock 720p SPLIT | 10 | **0** | [0, 0,2775] |
| E360NC | stock 360p NOCOPY | 10 | **0** | [0, 0,2775] |
| F360SP | stock 360p SPLIT | 10 | **0** | [0, 0,2775] |
| **Tổng** | | **60** | **0** | SP 0/30, NC 0/30 |

- Fisher exact 2-sided cho crash, cả 3 cặp SP-vs-NC: **p=1,0**.
- **Control không tái hiện baseline lịch sử — lần thứ hai liên tiếp:**
  G3 A1080NC gộp (gate-1 + gate-2 + stress, 15 lần duy nhất) 0/15
  vs E3-F 7/10 → Fisher **p≈2,5×10⁻⁴**; gộp F3+G3 (0/30) vs E3-F
  7/10 → **p≈6,4×10⁻⁶**; vs D3 v2d-load 7/16 → p≈2,1×10⁻⁴.
  P(0/30 | p=0,70) ≈ 2×10⁻¹⁶. Tỉ lệ crash thật ở cửa sổ hiện tại
  thấp hơn hẳn cửa sổ D3/E3 (upper bound Wilson 0/30 ≈ 0,114).
- Tất cả 60 lần chạy đều lastFrame=149 (chạy hết 150 frame 0..149).
  Thời gian chạy trung vị: 1080p ~75–79 s, 720p ~21 s, 360p ~5 s.

### 3.2 Tín hiệu sha — SPLIT KHỬ HOÀN TOÀN biểu hiện race ở mức pixel

| Arm | Sha (không crash) | Số sha khác nhau | Sha == GT-SPLIT |
|---|---|---|---|
| A1080NC | 9× `d960996868d3`, 1× `e0f122882b5b` | **2** | 9/10 |
| B1080SP | 10× `d960996868d3` | **1** | **10/10** |
| C720NC | 10 sha khác nhau, mỗi sha 1 lần | **10** | 0/10 |
| D720SP | 10× `397ba4e1a870` | **1** | **10/10** |
| E360NC | 9 sha khác nhau (1 sha GT xuất hiện 2 lần) | **9** | 2/10 |
| F360SP | 10× `414e114fe57c` | **1** | **10/10** |

Fisher exact 2-sided cho "sha lệch khỏi GT-SPLIT":

| Cặp | SP lệch | NC lệch | Fisher p |
|---|---|---|---|
| 1080p B-vs-A | 0/10 | 1/10 | 1,0 |
| 720p D-vs-C | 0/10 | 10/10 | **≈1,1×10⁻⁵** |
| 360p F-vs-E | 0/10 | 8/10 | **≈7,1×10⁻⁴** |

(Lưu ý: `summary.json` của harness in Fisher 720p là `0` do làm tròn
4 chữ số thập phân — giá trị chính xác tính lại bằng `math.comb` là
1,08×10⁻⁵; 360p in `0.0007`, chính xác 7,14×10⁻⁴.)

- Đọc đúng mức, như F3 §3.2: sha ổn định của SPLIT **không phải**
  bằng chứng crash — nó là bằng chứng **cơ chế**: output SPLIT trùng
  pixel tuyệt đối với đường non-direct (ground truth) ở cả 3 kích
  thước, trong khi stock NOCOPY ở 720p/360p cho sha khác nhau GẦN
  NHƯ MỖI lần (C: 10/10; E: 8/10 lệch, 2/10 tình cờ trùng GT).
  SPLIT khử được biểu hiện race này 10/10 ở cả hai kích thước nhỏ —
  **đúng hệt kết quả của NEEDS_WRITABLE ở F3** (NW 0/15 lệch vs NC
  15/15 lệch, p≈1×10⁻⁸ ở cả 720p và 360p).
- Ở 1080p, race hiếm khi lệch pixel (NC chỉ lệch 1/10 — khớp F3:
  1/15) nên cặp 1080p không có power cho endpoint sha; không kết
  luận gì từ p=1,0 ở đó.

## 4. Vì sao cửa sổ này không crash? (cập nhật giả thuyết F3 §4)

F3 đã nêu 4 giả thuyết; G3 loại trừ thêm được 1 và củng cố 2:

1. **VM đổi phần cứng (củng cố):** D3/E3 chạy trên VM 2 vCPU 7D13
   (theo RESULTS.md); E8 đo VM nay là 4 vCPU EPYC 9D25. Với 4 vCPU,
   decoder thread và filter thread chạy trên core riêng, cửa sổ
   timing để decoder free buffer đúng lúc transform đang giữ nó hẹp
   đi nhiều. Đây vẫn là giả thuyết mạnh nhất — chưa tách factor
   trực tiếp (cần chạy cùng protocol trên máy 2 vCPU hoặc pin CPU,
   xem §6).
2. **Cell CPU bị throttle (đã đo, củng cố):** hog `yes` chỉ chạy
   ~6% CPU mỗi tiến trình; tăng hog 3→8 không đổi được gì (gate-2
   vẫn 0/5). Loadavg cao trong đợt này là tải của các luồng đợt 79
   khác, không phải contention do hunt tạo ra. **Loadavg không phải
   chỉ số power của hunt** — bài học cho đợt sau.
3. **Cửa sổ tải khác:** load1 từng lần chạy dao động 0,90–29,87 mà
   vẫn 0 crash; không còn là giải thích đủ — cửa sổ "yên" hay "ồn"
   đều không crash, khác hẳn D3/E3.
4. **Không phải do tracker:** cùng binary .so D3, cùng chain, cùng
   clip/.trf — loại trừ được sai khác công cụ (như F3 đã kết luận).

## 5. Khuyến nghị triển khai (bằng chứng, không phải quyết định)

Quyết định cuối thuộc về đợt sau/user. Luồng này chỉ đưa bằng chứng:

- **SPLIT = NEEDS_WRITABLE về mặt hiệu quả sha, với chi phí ~0:**
  cùng ổn định tuyệt đối, cùng trùng đường non-direct; không cần
  build riêng, không cần pin version, không cần đồng bộ binary sang
  máy khác, không chậm hơn đo được. **Đường ffmpeg tự build là
  không cần thiết** — nợ F3 coi như có đáp án rẻ hơn.
- **Nhưng KHÔNG thay đổi production lúc này:** production đã có
  `copy` trước vidstabtransform (`enhance.js:183`), và `copy` cũng
  ép đường non-direct (E3 arm C1080COPY cho sha = ground truth).
  SPLIT không hơn `copy` ở bất kỳ endpoint nào đo được — nó chỉ là
  một cách khác để đạt cùng hiệu quả. Đổi `copy` → SPLIT lúc này là
  đổi ngang, không có bằng chứng lợi ích, chỉ thêm rủi ro regression.
  **Giữ nguyên `copy`.**
- **Khi nào SPLIT mới có ích:** nếu sau này `copy` bị bỏ vì lý do
  hiệu năng, hoặc nếu một cửa sổ có power chứng minh `copy` không
  đủ mà SPLIT đủ — thì SPLIT là ứng viên đã được validate ở mức sha
  (không cần build riêng). Chưa có dữ liệu đó thì không đổi.
- **Endpoint crash vẫn mở:** cả SPLIT lẫn NEEDS_WRITABLE đều chưa
  chứng minh được giảm crash, vì crash không tái hiện được trong
  cửa sổ hiện tại. Không được claim bất kỳ đường nào "khử crash"
  cho tới khi có hunt có power (control crash được) — xem §6.

## 6. Đề xuất setup tái hiện mạnh hơn (cho đợt sau, khi cần đo crash)

Theo thứ tự rẻ → đắt, mỗi bước kiểm tra control trước (gate 5×
NOCOPY 1080p; chỉ chạy stress khi gate ≥1 crash):

1. **Pin CPU bằng `taskset` (rẻ nhất, chưa thử):** chạy ffmpeg +
   hog trên đúng 2 core (`taskset -c 0-1`) để mô phỏng lại VM 2 vCPU
   thời D3/E3 — giả thuyết §4.1 cho rằng đây là factor chính. Nếu
   gate crash được thì chạy lại SPLIT-vs-NOCOPY dưới taskset.
2. **Chạy trên máy 2 vCPU thật** (nếu có VM/máy khác): tách hẳn
   factor phần cứng khỏi factor cửa sổ.
3. **Tăng n không giải quyết được:** nếu tỉ lệ thật <5% thì cần
   n≈60/arm control mới có ~95% cơ hội thấy ≥1 crash — đắt và vẫn
   chưa chắc đủ power để phân biệt SP-vs-NC (cần cả hai phía đều
   có số liệu). Chỉ dùng khi đã hết cách khác.
4. **Đổi endpoint: đo "suýt crash" thay vì crash:** instrument
   qua preload .so để đếm số lần transform chạm vào buffer đã free
   (hoặc refcount bất thường) ngay cả khi không segfault — cần code
   mới, là một luồng riêng, nhưng là cách duy nhất đo được race khi
   cửa sổ không crash.
5. **Không thử:** tăng hog (đã chứng minh vô ích, §2); chờ "cửa sổ
   ồn hơn" (load 29 vẫn 0 crash — không phải yếu tố quyết định).

## 7. Giới hạn và nợ mở (trung thực)

1. Crash rate: 0/60 stress (SP 0/30, NC 0/30) + 0/15 control 1080p
   gộp — thí nghiệm KHÔNG có power cho endpoint crash. Mọi claim về
   crash đều phải chờ hunt có power.
2. Endpoint sha chỉ mạnh ở 720p/360p; ở 1080p race hiếm lệch pixel
   nên cặp 1080p không phân biệt được (p=1,0).
3. Fisher 720p trong `summary.json` in `0` do làm tròn 4 chữ số —
   giá trị chính xác 1,08×10⁻⁵ (tính lại bằng `math.comb`).
4. Đường đi direct/non-direct không quan sát trực tiếp được —
   bằng chứng là sha output trùng đường non-direct, như F3 §6.2.
5. SPLIT-vs-COPY head-to-head chưa đo: khuyến nghị giữ `copy`
   dựa trên dữ liệu E3 (COPY cho sha = GT), không phải trên so sánh
   trực tiếp trong đợt này.
6. Không có mẫu crash nào nên logic khớp RDI→FREE theo khoảng chưa
   được áp dụng trên dữ liệu mới (chỉ verify trên dữ liệu cũ F-r2
   ở F3).
7. n=10/arm (thay vì 15 của F3) để vừa cửa sổ cron 3 giờ — endpoint
   sha đã bão hòa ở n=10 (10/10 vs 0/10), nhưng nếu đợt sau cần
   power cho endpoint yếu hơn thì phải tăng n.
8. Nợ chung các đợt trước (không thuộc luồng này): TTS 39
   (gradio/pillow); kernel upscale BC(0,25, 0,375) đã nối vào
   production ở F6 nhưng chrome-resample.mjs còn nợ khác; G1/G2
   phân biệt được 1 case (F7) nhưng chưa đóng hẳn; ci-security.yml /
   ci-build.yml vẫn 403; release gate giữ nguyên (KHÔNG release/tag).

## 8. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/test_round79_g3_split_stress.js` — harness
  stress SPLIT-vs-NOCOPY 6 arm × n=10 đúng setup F, gate 5× trước
  stress, Fisher exact 2-sided, khôi phục từ results.jsonl.
- `docs/PHASE9_ROUND79_G3_SPLIT_LIMITS.md` — tài liệu này.

Không stage: cây đo `~/workspace/.scratch-r79g3/` (runs/,
runs-hog8/, *.framemd5, *.stderr, free-track logs, summary.json),
log luồng `hidden_files/round79-g3.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

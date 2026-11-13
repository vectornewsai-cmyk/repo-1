# LIMITS — Phase 9 đợt 81 I1: vidstab crash — setup mạnh hơn (per-frame + poison-quarantine)

Luồng I1 — đổi endpoint thay vì tăng tải/n để tái hiện crash vidstab
(nợ đợt 80 §4.1 / H1 §6). Taskset đã thử xong ở H1 và KHÔNG khôi phục
được crash (0/60 — lần thứ 3 liên tiếp thiếu power cho endpoint crash).
Log chi tiết: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i1.md`.
Harness: `server/render/src/test_round81_i1_vidstab_stronger_stress.js`.
Analyzer per-frame + poison: `server/render/src/test_round81_i1_analyze_h1_perframe.js`.
Preload v2e: `server/render/src/free_track_v2e_preload.c` (+ unit test
`free_track_v2e_unit.c`). Binary .so: `~/workspace/.scratch-r81i1/free_track_v2e_preload.so`.
Môi trường: ffmpeg stock Ubuntu 8.1.2 (7:8.1.2-2ubuntu2+hatch3),
libvidstab 1.1.0, VM 4 vCPU EPYC 9D25, 8 GB, không GPU, cell chia sẻ
1,5 CPU. Ngày: 10/11/2026 (lượt cron 18:35 +07 → luồng chạy ~18:40–21:00).
Clip + .trf dùng chung với E3/F3/G3/H1: `shakynoisy1080.mp4` (150 frame,
5 s, 30 fps) + `detect-shaky1080-5s.trf`; `shaky720.mp4` + `shaky720.trf`.
Ground truth sha: 1080p `d960996868d3…`, 720p `397ba4e1a870…`.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Crash có tái hiện được không | **KHÔNG — 0/60 lần chạy** (NC 0/20, SP 0/20, CP 0/20), lần thứ **4 liên tiếp** thiếu power cho endpoint crash (F3 0/90, G3 0/60, H1 0/60, I1 0/60 — gộp 4 đợt: **0/270 lần chạy**; P(0/270 \| p=0,70) ≈ 6,7×10⁻¹⁴²). Control 1080p gộp F3+G3+H1+I1: **0/50** vs E3-F 7/10 → Fisher p≈3,1×10⁻⁷; Wilson upper 0/50 = 0,0714. |
| Endpoint per-frame (mới) | **CÓ POWER Ở 720p, KHÔNG Ở 1080p.** Stress I1 (dưới v2e): 720p NC lệch **882/1500 frame (58,8%)**, mỗi run 87–90 (chặt hơn H1: 46–90); SP/CP 0/1500. Permutation per-run p=1,08×10⁻⁵ (sàn với n=10/arm); Fisher gộp tràn dưới double (p < 10⁻³⁰⁸, in ra 0). 1080p NC lệch 1/1500 frame — không phân biệt được. |
| Poison có xuất hiện trong frame lệch không | **CÓ — 2 lần quan sát độc lập, cùng frame n=148 (cửa sổ drain).** Stress r2 n=148: Y-only + meanY 164 (≈ poison 165) + stdevY 9,8 (GT 34,6), ~99% pixel poison. Smoke (không taskset): n=148 meanY 127, stdevY 45,7 — khớp mô hình hỗn hợp ~51% poison (mean dự tính 130, stdev dự tính ~45,5). U/V cả hai lần đều y hệt GT. Test strict (Y-exact / stdev<2) cho 0 vì transform nội suy, không copy verbatim — xem §4.2. Tỉ lệ stress: 1/882 frame lệch (Wilson 95% [0,02%, 0,64%]), 1/10 run NC; gộp smoke: 2/11 run NC có frame 148 poison-like. |
| Cơ chế race (kết luận mới, 2 chế độ) | **(a) Giữa stream (chủ đạo, 881/882 frame lệch): buffer-reuse khi còn live** — cả 3 plane cùng lệch, ΔmeanY trung vị ~0, frame lệch là frame hợp lệ khác. **(b) Drain/EOF (hiếm, 1/882): use-after-free thật** — frame r2 n=148 đọc mặt phẳng Y đã free (chứng minh bằng poison). Crash E3 là đuôi hiếm của chế độ (b) — cần đúng lúc page bị unmap/tái cấp. |
| Race có thành phần tất định | **CÓ — aliasing hệ thống.** ~60 frame 720p NC lệch với CÙNG checksum Y ở ≥8/10 run (nhiều frame 10/10: n=29, 32, 33, 35, 36, 38, 39, 40, 42–45, 47, 48, 103…); cùng chỉ số + cùng checksum ở cả H1 và I1 (vd n=70 `671780D0` 8/10 cả hai đợt). Pool decoder xoay vòng tất định → filter đọc nhầm cùng một buffer sai ở cùng frame — không phải timing ngẫu nhiên thuần. |
| COPY-vs-SPLIT (lặp lại dưới v2e) | **HÒA tuyệt đối** ở mức sha và per-frame (cả hai 0 frame lệch ở cả hai kích thước). Production `copy` giữ nguyên. |
| ffmpeg tự build (NEEDS_WRITABLE) | **VẪN KHÔNG CẦN** — `copy` đã đạt hiệu quả như SPLIT/NEEDS_WRITABLE ở mọi endpoint đo được. |
| v2e có làm hỏng run sạch không | **KHÔNG.** CP 720p smoke dưới v2e vẫn == GT; toàn bộ 20 lần CP/SP stress I1 đều 0 frame lệch; H1 (không poison) cho 0 frame poison-like với cùng test — test có độ đặc hiệu. Unit test v2e 4/4 PASS. |
| Chi phí runtime v2e | Nhỏ: quarantine trung vị 46 chunk / 30,9 MB ở 1080p (evict 14), 11–12 chunk / ~11 MB ở 720p (evict 0); thời gian chạy không chậm hơn H1 ngoài nhiễu tải chung (1080p trung vị 67–72 s; 720p 18–20 s). |

## 1. Vì sao đổi endpoint thay vì tăng tải/n (power analysis — tính TRƯỚC stress)

### 1.1 Endpoint crash: tăng n không cứu được (khẳng định lại H1 §3.3, số tính lại)

- Control 1080p gộp trước I1: 0/40 (F3+G3+H1) vs E3-F 7/10 → Fisher p≈1,2×10⁻⁶; P(0/40 | p=0,70) ≈ 1,2×10⁻²¹. Sau I1: 0/50 → Wilson upper 0,0714 (từ 0,0876 ở 0/40); P(0/50 | p=0,70) ≈ 7,2×10⁻²⁷.
- Nếu tỉ lệ crash thật là 5%: P(thấy ≥1 crash trong n=10) = 0,40; muốn 95% cần n≈59/arm. Nếu tỉ lệ thật là 2%: cần n≈149/arm.
- Để PHÂN BIỆT NC 5% vs SP 0% với power 80% ở α=0,05 (xấp xỉ chuẩn hai tỉ lệ): cần n≈152/arm; ở mức 2% vs 0%: n≈388/arm. Vượt xa cửa sổ cron 3 giờ (60 lần chạy đã tốn ~1 giờ).
- Kết luận: **endpoint crash không đo được bằng cách tăng n trong cửa sổ này.** H1 §6 bước 1 (taskset) đã thử xong; bước "tăng hog" đã bị bác bỏ hai lần (G3 không pin vô ích; H1 pin lên ~40% CPU vẫn 0 crash); máy 2 vCPU thật không có trong tay. Chỉ còn đổi endpoint (§1.2) hoặc đổi máy.

### 1.2 Endpoint per-frame: power đo được từ hồi cứu H1 (trước stress I1)

Hồi cứu 60 lần chạy H1 (phân tích framemd5 per-frame + showinfo, xem §2):
- 720p NC: 815/1500 frame lệch (54,3%), mỗi run trung vị 86, min–max 46–90. SP/CP: 0/1500. Permutation test chính xác trên số frame lệch/run: p=1,08×10⁻⁵ — đã ở sàn với n=10 vs 10 (2/C(20,10)). Ngay cả n=5/arm cũng tách hoàn toàn (min p=2/C(10,5)=7,9×10⁻³).
- 1080p NC: 1/1500 frame lệch (0,07%). Không có power ở bất kỳ n khả thi nào (muốn thấy vài frame lệch cần hàng chục nghìn frame; muốn tách per-run cần hàng trăm run).
- Endpoint poison: nếu tỉ lệ thật frame lệch nào đọc buffer đã free là q, thì 0 poison trong ~800 frame lệch cho cận trên 95% q < 3/800 ≈ 0,38% (rule of three); P(0 poison | 800 frame, q=1%) ≈ 3,2×10⁻⁴. Stress I1 (n=10/arm) đủ power để kết luận về poison. **Kết quả thật: 1/882 frame lệch poison-like trong stress** (Wilson 95% [0,02%, 0,64%]) — q thật ~0,1%, nằm trong vùng dự tính này; **cộng thêm 1 lần độc lập ở smoke** (n=148, ~51% poison) → gộp 2/11 run NC. Test strict ban đầu (Y-exact/stdev<2) quá chặt cho filter nội suy nên phải dùng test poison-like (§4.2).

## 2. Hồi cứu H1 per-frame (làm trước stress — dữ liệu đã có trên đĩa, 0 compute mới)

Analyzer `test_round81_i1_analyze_h1_perframe.js` (nguồn chính: framemd5
per-frame md5; nguồn phụ: showinfo checksum + mean/stdev; GT showinfo
lấy bằng phiếu đa số trên 20 lần CP+SP — xem §5.1 về artifact parse).

| Arm | Frame lệch / tổng | Tỉ lệ | Mỗi run: trung vị (min–max) | Vị trí đầu/giữa/cuối/10-cuối | Plane lệch Y/U/V | ΔmeanY frame lệch |
|---|---|---|---|---|---|---|
| A1080NC | 1/1500 | 0,0007 | 0 (0–1) | 1/0/0/0 | 0/1/1 | trung vị 0 |
| B1080SP | 0/1500 | 0 | 0 (0–0) | 0 | 0/0/0 | — |
| C1080CP | 0/1500 | 0 | 0 (0–0) | 0 | 0/0/0* | — |
| D720NC | 815/1500 | 0,5433 | 86 (46–90) | 234/221/360/60 | 789/815/815 | trung vị 0 (min −2, max 11) |
| E720SP | 0/1500 | 0 | 0 (0–0) | 0 | 0/0/0* | — |
| F720CP | 0/1500 | 0 | 0 (0–0) | 0 | 0/0/0* | — |

(* showinfo cross-check còn 1–2 frame "lệch checksum" giả ở CP/SP do nhiễu
parse status-line — framemd5 là nguồn chính xác, xem §5.1.)

So sánh (permutation chính xác trên số frame lệch/run là endpoint chính;
Fisher gộp trên frame chỉ là cận trên vì frame trong cùng run tương quan):
- E720SP-vs-D720NC và F720CP-vs-D720NC: Fisher gộp p≈2,7×10⁻³¹³; permutation per-run p=1,08×10⁻⁵ (sàn).
- Mọi cặp 1080p và E-vs-F: p=1,0.

Đọc cơ chế từ hồi cứu:
1. **Frame lệch KHÔNG tụ ở drain:** 234/221/360 ở ba phần ba clip; 10 frame cuối chỉ 60/815 (kỳ vọng đều: 815×10/150 ≈ 54) — gần như đều. Race biểu hiện xuyên suốt giữa stream, không phải chỉ lúc drain/EOF. Crash drain (E3) là đuôi hiếm của cùng một race, không phải chế độ chính.
2. **Frame lệch là frame hợp lệ khác:** ΔmeanY trung vị 0 (min −2, max 11), stdev Y giữ ~34,6 như GT. Nếu transform đọc rác/giải phóng thì mean/stdev phải lệch mạnh. Dữ liệu khớp giả thuyết "đọc nhầm buffer còn live" (buffer-reuse), không khớp "đọc buffer đã free".
3. **Cả 3 plane đều lệch** (Y 789/815, U/V 815/815) — lệch cả frame, không phải một plane copy đơn lẻ. 26 frame chỉ lệch U/V mà Y giữ nguyên: chroma đi trước luma một nhịp — gợi ý decoder ghi đè plane theo thứ tự.
4. GT ổn định tuyệt đối: mọi lần CP/SP đều cho cùng md5 từng frame (0 frame lệch) — GT per-frame đáng tin để làm chuẩn cho stress I1.

## 3. Thiết kế v2e + smoke (trước stress)

### 3.1 free_track_v2e_preload.c — poison-quarantine

Dựa trên v2d (đợt 76), giữ thiết kế nhẹ (ALLOC chỉ insert lặng; chỉ FREE
mới log kèm backtrace). Khác biệt:
- FREE của chunk đã track: ghi log như v2d, rồi `memset` toàn bộ chunk
  bằng poison **0xA5** và đưa vào **quarantine FIFO (cap 32)** thay vì
  trả ngay cho glibc. Khi đầy, evict chunk cũ nhất bằng `__libc_free`
  thật (ghi dòng `EVICT`). Destructor ghi dòng stats
  `quarantined=N evicted=M peakQuarantineBytes=B`.
- Dải track mở rộng [400.000, 12.000.000] (v2d: 4,2 MB) để phủ mặt
  phẳng Y 4K (8.294.400) nếu đợt sau làm 4K.
- Spinlock chỉ quanh thao tác quarantine (memset làm ngoài lock);
  đường free đã track là lạnh (~11 free/run ở 720p, ~46 ở 1080p — đếm
  từ log H1) nên không serialize đường nóng.
- An toàn: chunk trong quarantine không trả lại allocator nên không ai
  cấp phát lại được địa chỉ đó — mọi lần đọc poison đều là UAF thật
  (không false positive từ tái cấp phát hợp lệ). Double-free: lần 2
  `table_remove` trả 0 nên không poison 2 lần. Giới hạn đã biết (như
  v2d): `realloc` nội bộ của glibc không qua hook này.

### 3.2 Unit test — 4/4 PASS

`free_track_v2e_unit.c`, chạy với `LD_PRELOAD` (đọc UAF CÓ CHỦ Ý trong
test để kiểm tra poison; cảnh báo `-Wuse-after-free` đã tắt có chủ ý):
- Test 1: malloc 2 MB → free → đọc lại toàn 0xA5 — PASS.
- Test 2: 40 lần free → stats `quarantined=41 evicted=9
  peakQuarantineBytes=64000000` (41−32=9 evict; 32×2 MB=64 MB) — PASS,
  khớp dự tính từng số; 9 dòng EVICT đếm được trong log.
- Test 3: malloc nhỏ (100 byte, ngoài dải track) bình thường — PASS.
- Test 4: free(NULL) không crash — PASS.

### 3.3 Chuẩn "mặt phẳng toàn poison" (để test chữ ký Y-exact)

Tạo frame raw toàn byte 0xA5, chạy qua `showinfo`:
- 720p: Y plane_checksum `E7D0D7F0`, U/V `A2B435FC`, mean [165 165 165], stdev [0,0 0,0 0,0].
- 1080p: Y plane_checksum `E609E5EB`, U/V `0BF07977`, mean [165 165 165], stdev [0,0 0,0 0,0].
Một frame lệch có Y plane_checksum trùng các giá trị này = bằng chứng
trực tiếp transform copy nguyên mặt phẳng đã free (vsFrameCopyPlane).

### 3.4 Smoke dưới v2e (không taskset/hog — validate instrument)

- CP 720p: exit 0, whole-sha `397ba4e1a870` = GT — poison KHÔNG làm hỏng
  run sạch. Stats: quarantined=12, evicted=0, peak 11.367.160 byte.
- NC 720p: exit 0, sha `02550f1fe4da` ≠ GT; **91/150 frame lệch**. Với test
  strict ban đầu (Y-exact / stdev<2): 0 chữ ký poison. Với test
  poison-like đã tinh chỉnh (§4.2 — Y-only + meanY ≥ 120): **1 frame
  poison-like: n=148, meanY 127, stdevY 45,7 (GT 34,6), U/V y hệt GT**
  — khớp mô hình hỗn hợp ~51% pixel poison (mean dự tính
  0,51×165+0,49×88 ≈ 130; stdev dự tính ≈ 45,5; đo được 127 / 45,7).
  Đây là lần quan sát poison ĐẦU TIÊN, độc lập với stress r2 n=148
  (~99% poison) — cùng frame áp chót, cùng cửa sổ drain.
  ΔmeanY frame lệch: min −2, trung vị 1, max 39 (max này chính là
  n=148: 127−88=39). Frame lệch có cả ở 10 frame cuối (140, 141, 142,
  144, 145, 146, 148) — chỉ n=148 có poison. Backtrace FREE cho thấy
  `av_buffer_pool_uninit` + `avcodec_free_context`: các lần free là
  teardown pool lúc drain/EOF (11 lần, cỡ 944.719 byte = mặt phẳng Y
  720p + overhead).
- Kết luận smoke (cập nhật sau phân tích tinh chỉnh): instrument hoạt
  động đúng; race giữa stream không đọc buffer đã free, nhưng **ở drain
  (frame 148) transform ĐÃ đọc mặt phẳng Y đã free** — bắt được 1 lần
  ngay từ smoke (n=1), tái hiện ở stress r2 (n=148, ~99% poison).

## 4. Stress I1 (6 arm × n=10, taskset + v2e)

Setup F + taskset pin ffmpeg+hog cores 0-1 (như H1), LD_PRELOAD v2e +
segv_backtrace, xen kẽ theo vòng, chỉ ffmpeg stock. Gate 5× A1080NC
trước stress (tính vào stress như H1).

### 4.1 Gate — 0/5 crash

- 0/5 crash (Wilson 95% [0, 0,4345]); sha 5/5 = GT `d960996868d3`.
- Thời gian trung vị 110,9 s (chậm hơn H1 76,8 s — tải chung cao, xem
  §4.3); nFreeLarge trung vị 10; quarantine trung vị 46, evicted 14,
  peak 30.908.658 byte; 0 run thiếu dòng stats.
- Hog %CPU: 13,1%/6,4% sau khởi động, 12,7%/10,9% cuối gate — THẤP hơn
  hẳn H1 (41,9%/39,8%) vì quota cell 1,5 CPU chia với các luồng đợt 81
  khác đang chạy song song (loadavg lúc đó 4,31–12,61). Contention do
  hog tạo ra trong lượt này yếu hơn H1 — nhưng H1 đã chứng minh hog
  mạnh cũng không crash, nên đây không phải biến quyết định.

### 4.2 Stress — XONG 12:43 UTC (60/60 lần, 0 crash; resume sau restart VM)

Stress chạy 2 chặng do VM restart giữa chừng (~12:33 UTC): chặng 1 dừng ở
42/60 (A1080NC-r8 đang chạy dở — file .framemd5 partial, không có record
trong results.jsonl); chặng 2 resume từ results.jsonl, chạy nốt 18 lần,
exit 0. Không có tiến trình `yes`/ffmpeg sót sau restart (đã kiểm tra
`pgrep`). Tổng thời gian: gate ~8 phút + stress ~75 phút (chậm đầu lượt
do tải chung, nhanh dần sau restart khi máy yên).

| Arm | Crash | Sha == GT | Sha khác nhau | Thời gian trung vị | Quarantine trung vị (chunk / evict / peak byte) |
|---|---|---|---|---|---|
| A1080NC | 0/10 | 9/10 | 2 | 67,2 s | 46 / 14 / 30.908.658 |
| B1080SP | 0/10 | 10/10 | 1 | 70,0 s | 46 / 14 / 30.910.350 |
| C1080CP | 0/10 | 10/10 | 1 | 71,7 s | 49 / 17 / 32.450.526 |
| D720NC | 0/10 | 0/10 | 10 | 20,0 s | 11 / 0 / 10.445.560 |
| E720SP | 0/10 | 10/10 | 1 | 17,7 s | 11 / 0 / 10.445.560 |
| F720CP | 0/10 | 10/10 | 1 | 18,8 s | 12 / 0 / 11.367.160 |

Fisher crash: p=1,0 mọi cặp. Fisher sha-lệch: 720p SP-vs-NC và CP-vs-NC
in ra 0 (làm tròn 4 chữ số — giá trị chính xác 1,08×10⁻⁵ như H1, tính
lại bằng `math.comb`); 1080p p=1,0. 0 run thiếu dòng stats quarantine.

**Per-frame + poison (analyzer, GT = CP r1 + showinfo đa số 20 lần CP/SP):**

| Arm | Frame lệch / tổng | Mỗi run: trung vị (min–max) | Vị trí đầu/giữa/cuối/10-cuối | Plane lệch Y/U/V | POISON-LIKE |
|---|---|---|---|---|---|
| A1080NC | 1/1500 (0,0007) | 0 (0–1) | 0/0/1/1 | 0/1/1 | 0 |
| B1080SP | 0/1500 | 0 (0–0) | — | 0/0/0* | 0 |
| C1080CP | 0/1500 | 0 (0–0) | — | 0/0/0* | 0 |
| D720NC | 882/1500 (0,588) | 88 (87–90) | 254/264/364/60 | 869/883/883 | **1 (r2 n=148)** |
| E720SP | 0/1500 | 0 (0–0) | — | 0/0/0* | 0 |
| F720CP | 0/1500 | 0 (0–0) | — | 0/0/0* | 0 |

(* showinfo cross-check còn 1–5 frame "lệch checksum" giả ở CP/SP do
nhiễu parse status-line — framemd5 là nguồn chính xác, xem §5.5.)

Permutation per-run 720p: p=1,08×10⁻⁵ (sàn); Fisher gộp tràn dưới
double (p < 10⁻³⁰⁸, in ra 0). Mọi cặp 1080p và E-vs-F: p=1,0.

**Phát hiện chính 1 — 2 lần đọc buffer đã free ở frame n=148 (near-crash bắt được trực tiếp, tái hiện độc lập):**
Stress D720NC r2 n=148 (áp chót, pts 4,933 s, cửa sổ drain) + smoke NC
720p n=148 (không taskset/hog, chạy riêng trước stress):
- Stress r2: NC `mean:[164 127 132] stdev:[9.8 6.6 19.0]`,
  `plane_checksum:[1DA3989F E9D281F1 64F9E460]`; GT
  `mean:[88 127 132] stdev:[34.6 6.6 19.0]`,
  `plane_checksum:[A17F72E3 E9D281F1 64F9E460]`. Chỉ Y lệch; U/V
  **bit-identical** với GT. Y mean 88 → 164 (≈ poison 165), stdev
  34,6 → 9,8 (sụp 3,5×) — ~99% pixel Y là poison.
- Smoke: n=148 meanY 127, stdevY 45,7 (GT 34,6), U/V y hệt GT — khớp
  mô hình hỗn hợp ~51% pixel poison (mean dự tính ≈ 130, stdev dự tính
  ≈ 45,5; đo được 127 / 45,7).
- Vì sao đây là poison, không phải "frame sai khác": (a) clip không có
  frame nào meanY 164 hay 127 (mọi frame GT đều 87–88 — nội dung tĩnh +
  noise); (b) nội suy của vidstabtransform bảo toàn mean — không thể tạo
  127/164 từ input 88; (c) nguồn duy nhất của pixel ~165 trong pipeline
  là poison 0xA5 (U/V không poison được nên giữ nguyên — đúng như quan
  sát); (d) cả hai lần đều ở frame 148 — đúng nơi E3 thấy pool free
  (`av_buffer_pool_uninit` trong backtrace FREE của log r2); (e) tỉ lệ
  poison khác nhau (51% vs 99%) khớp cơ chế "free rơi giữa lúc transform
  đang đọc mặt phẳng" — phần đọc trước free là dữ liệu thật, phần sau
  là poison.
- Vì sao test strict ban đầu cho 0: Y-checksum ≠ solid-poison (`1DA3989F`
  ≠ `E7D0D7F0`) và stdev không đơn điệu (poison toàn phần → stdev sụp;
  poison một phần → hỗn hợp 2 cụm làm stdev TĂNG). Test đúng cho filter
  nội suy là "Y-only + meanY kéo mạnh về 165 (≥120)" — test này cho
  **0 frame ở H1 (không poison — độ đặc hiệu)** và đúng 1 frame ở stress
  I1 + 1 frame ở smoke.
- Tỉ lệ: stress 1/882 frame lệch (Wilson 95% [0,02%, 0,64%]); 1/1500
  frame NC 720p ([0,01%, 0,38%]); 1/10 run NC; gộp smoke: **2/11 run NC
  có frame 148 poison-like**. UAF-read ở drain là thật nhưng hiếm —
  khớp crash 0/60 (đọc poison thường không segfault vì bộ nhớ vẫn
  mapped; segfault cần đúng lúc page bị unmap/tái cấp).

**Phát hiện chính 2 — aliasing hệ thống (race chủ yếu tất định, không ngẫu nhiên):**
~60 frame 720p NC lệch với CÙNG checksum Y ở ≥8/10 run (nhiều frame
10/10: n=29, 32, 33, 35, 36, 38, 39, 40, 42–45, 47, 48, 103; vd n=70
`671780D0` 8/10, n=71 `55AFD31C` 8/10, n=73 `275F18D8` 8/10). Cùng chỉ
số + cùng checksum ở cả H1 (v2d) và I1 (v2e) — mẫu aliasing ổn định qua
instrument và cửa sổ. Pool decoder xoay vòng tất định → filter đọc nhầm
cùng một buffer sai ở cùng frame. Phần ngẫu nhiên chỉ là thiểu số frame
lệch (mỗi run 87–90 frame, trong đó ~60 frame hệ thống + ~30 frame đổi
theo timing). H1 có per-run 46–90 (rộng) vì máy tải cao làm lag
decode/filter dao động; I1 sau restart máy yên nên 87–90 (chặt).

**Phát hiện phụ — frame lệch 1080p duy nhất là lệch chroma:** A1080NC r7
n=149 (frame cuối): Y y hệt GT (checksum `0CAF3DA0`, mean/stdev bằng GT),
chỉ U/V lệch. Cùng mẫu "chroma đi trước luma một nhịp" như 26 frame
H1 chỉ lệch U/V. Không poison ở 1080p.

**Đọc cơ chế tổng hợp:** race có 2 chế độ. (a) Giữa stream: decoder ghi
đè buffer mà filter vẫn giữ (live-reuse) — biểu hiện ở ~59% frame 720p,
chủ yếu tất định, không crash được. (b) Drain: pool bị free trong khi
transform còn giữ frame cuối — biểu hiện ở 1/1500 frame (poison-read),
là tiền thân của crash E3. `copy`/SPLIT chặn cả hai chế độ ở mức pixel
(0 frame lệch) — nhưng vẫn chưa có bằng chứng nào về crash (0/270 lần
chạy gộp 4 đợt), nên không claim "khử crash", chỉ claim "khử biểu hiện
pixel" — như các đợt trước.

### 4.3 Tải chung trong lượt

- Loadavg lúc gate: 4,31–12,61; lúc stress lên tới ~25 (đỉnh, các luồng
  đợt 81 khác). 1080p chạy ~110–127 s/lần (H1: ~76–89 s) — chậm do tải
  chung, không do v2e (smoke không taskset/hog: 720p ~21 s như H1).

## 5. Giới hạn và nợ mở (trung thực)

1. **Endpoint crash vẫn mở — lần thứ 4 liên tiếp thiếu power.** 0/60
   stress I1 (NC 0/20, SP 0/20, CP 0/20); gộp 4 đợt F3+G3+H1+I1:
   **0/270 lần chạy**; control 1080p gộp 0/50 vs E3-F 7/10 → Fisher
   p≈3,1×10⁻⁷. Không claim đường nào "khử crash" — quy tắc từ F3, giữ
   nguyên. Không săn tiếp bằng taskset/hog/n (H1 §6 bước 1 + §3.3 đã
   đóng; I1 chỉ còn đổi endpoint). **Ngoại lệ đáng ghi:** I1 bắt được
   2 lần đọc buffer đã free (smoke + stress r2, cùng frame n=148,
   §4.2) — chứng minh chế độ drain-UAF vẫn tồn tại ở cửa sổ này, chỉ
   hiếm (1/1500 frame stress; 2/11 run NC) và thường không leo thang
   tới segfault.
2. **Endpoint per-frame chỉ mạnh ở 720p.** Ở 1080p race hiếm lệch pixel
   (NC 1/1500 frame hồi cứu, 1/1500 frame stress I1) nên cặp 1080p yếu
   cho mọi endpoint pixel — không kết luận gì từ p=1,0 ở đó.
3. **Poison chỉ phủ được mặt phẳng đã track — và test phải hợp với filter
   nội suy.** Ở 720p, U/V plane (230.400 byte mỗi plane) nằm DƯỚI
   TRACK_MIN 400.000 nên không poison — chữ ký poison chỉ đo được trên
   Y (may mắn là Y chính là plane crash E3). Test strict (Y plane_checksum
   == solid-poison, stdevY < 2) cho 0/882 vì transform nội suy, không copy
   verbatim; stdev cũng không đơn điệu (poison một phần làm stdev TĂNG
   do hỗn hợp 2 cụm). Test đúng là "Y-only + meanY kéo về 165 (≥120)"
   (cho 0 ở H1, 1 ở stress I1, 1 ở smoke). Mỗi frame poison-like được
   kết luận bằng 5 lập luận độc lập (§4.2), không chỉ bằng 1 ngưỡng.
4. **Quarantine làm chậm free thật (by design).** Chunk đã free vẫn
   mapped + poison trong tối đa 32 lượt free. Điều này đổi timing ở
   teardown: một UAF-read ở drain sẽ thấy poison thay vì segfault —
   ĐÚNG mục đích đo, nhưng có nghĩa endpoint crash KHÔNG còn đo được
   dưới v2e (crash bị chuyển thành poison-read). So sánh crash chỉ hợp
   lệ trong nội bộ các run v2e, và với H1 qua endpoint sha/per-frame
   (không đổi), không qua tỉ lệ crash.
5. **Nhiễu parse showinfo (đã biết, không ảnh hưởng kết luận):**
   status-line của ffmpeg (`frame= … fps= … \r`) xen vào giữa dòng
   showinfo, làm regex gán nhầm checksum frame kề cho 1–2 frame/file
   (vd GT H1 F720CP/r1: n=41 nhận checksum của n=42). Đã xử lý bằng
   (a) framemd5 làm nguồn chính cho đếm frame lệch (file riêng, không
   bị xen), (b) GT showinfo lấy bằng phiếu đa số trên 20 lần CP+SP.
   Cross-check showinfo còn sót 1–5 frame "lệch checksum" giả ở CP/SP
   trong khi framemd5 = 0 — đó là nhiễu parse, không phải lệch thật.
   Test poison-like yêu cầu frame ĐÃ lệch theo framemd5 trước nên không
   bị nhiễu này tạo false positive (H1 cho 0 là bằng chứng).
6. **Không có mẫu crash nào** nên logic khớp RDI→FREE theo khoảng chưa
   được áp dụng trên dữ liệu mới (chỉ verify trên dữ liệu cũ F-r2 ở F3)
   — như F3/G3/H1.
7. **Chưa làm trong luồng này (nợ mở cho đợt sau):**
   - Clip dài hơn (30 s, 900 frame) và 4K: hồi cứu + stress I1 cho thấy
     frame lệch rải đều cả clip nên clip dài sẽ tăng số trial/run
     (150 → 900) — nhưng 720p đã tách tuyệt đối ở n=10 nên không cần
     cho endpoint per-frame; 4K có thể cho power ở kích thước lớn (Y 8,3 MB đã phủ
     bởi dải v2e 12 MB) — chưa đo vì hết cửa sổ cron. Cần: gen clip
     4K + .trf bằng vidstabdetect, đo thời gian 1 lần chạy trước.
   - Máy 2 vCPU thật (H1 §6 bước 2): vẫn là cách duy nhất còn lại để
     tách factor phần cứng — không có máy trong tay.
   - **Nợ mới từ I1:** (a) tỉ lệ poison-read chỉ có 1 mẫu (1/882) —
     cần lặp lại stress 720p NC (n=10, rẻ: ~20 s/lần) ở đợt sau để xem
     r2 n=148 có tái hiện không và ước lượng lại q; (b) aliasing hệ
     thống (~60 frame, §4.2) — đo xem offset aliasing là bao nhiêu
     frame (so checksum frame lệch với checksum các frame GT lân cận
     để tìm frame nguồn bị đọc nhầm); (c) vì sao per-run I1 chặt
     (87–90) còn H1 rộng (46–90) — giả thuyết tải máy, cần 1 run đối
     chứng dưới tải cao.
   - TTS 39 (CẤM kiểm lại); G1/G2; ci-security.yml / ci-build.yml 403;
     release gate giữ nguyên (KHÔNG release/tag).
8. Nợ chung các đợt trước (không thuộc luồng này): xem LIMITS gộp đợt 80 §4.

## 6. File đổi/thêm (text only, đã stage — xem paths-loop)

- `server/render/src/free_track_v2e_preload.c` — preload poison-quarantine
  (mới, dựa trên v2d).
- `server/render/src/free_track_v2e_unit.c` — unit test 4/4 PASS.
- `server/render/src/test_round81_i1_vidstab_stronger_stress.js` — harness
  stress 6 arm × n=10 dưới taskset+v2e, gate 5×, ghi quarantine stats.
- `server/render/src/test_round81_i1_analyze_h1_perframe.js` — analyzer
  hồi cứu H1 + stress I1 (per-frame divergence, permutation test,
  poison-signature).
- `docs/PHASE9_ROUND81_I1_VIDSTAB_STRONGER_LIMITS.md` — tài liệu này.

Không stage: cây đo `~/workspace/.scratch-r81i1/` (runs/, smoke/,
*.framemd5, *.stderr, free-track logs, summary.json,
analysis-h1-perframe.json, stress.log, .so đã biên dịch),
log luồng `hidden_files/round81-i1.md` (log nội bộ, không thuộc repo).
Không push — chờ user nhắn "push đi" từ main chat.

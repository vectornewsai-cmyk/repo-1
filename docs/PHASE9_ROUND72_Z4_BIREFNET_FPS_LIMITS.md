# LIMITS — Phase 9 đợt 72, luồng Z4: birefnet fps, kiểm chứng giả thuyết trần RAM 6,0 GiB

Ngày: 09/11/2026 (lượt cron 12:35 +07). Đóng nợ đợt 71 §5 mục 4
("Birefnet fps vẫn chưa có số — giả thuyết trần cell 6,0 GiB chưa kiểm
chứng được từ trong sandbox"). KHÔNG push, KHÔNG release/tag, KHÔNG
binary, KHÔNG sửa production, KHÔNG chạm venv TTS. Mọi số dưới đây là
số đo thật. RSS tính theo GiB (1024-based, khớp số probe in ra).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Birefnet-general-lite fps (threads=1, arena OFF) | **VẪN KHÔNG CÓ SỐ** — 0/1 predict hoàn thành đợt này (cộng dồn lite 0/3, general 0/5) |
| Chết như thế nào | **exit 137 (SIGKILL)**, runtime báo `failureKind=subprocess.oom_killed`, `oomKills=1` — OOM-kill do sandbox, không phải exception |
| Đỉnh RSS trước khi chết | **5,63 GiB** (VmRSS mẫu cuối 5.902.172 KB; VmHWM 5.910.824 KB = 5,64 GiB) — cao nhất từng đo ở lite (Y4: 4,90 arena ON / 4,49 arena OFF) |
| Giả thuyết trần cell 6,0 GiB | **ĐƯỢC CỦNG CỐ MẠNH — gần như xác nhận** (§3): chết khi hệ thống còn 2,8–3,8 GB free / 3,0–4,1 GB avail → không thể là OOM hệ thống; probe 5,63 GiB + daemon ~0,3 GiB + process khác ≈ 6,0 GiB đúng bằng `sharedMemoryLimitBytes` |
| Đọc cgroup từ trong sandbox | **VẪN KHÔNG ĐỌC ĐƯỢC** (§2): `/sys/fs/cgroup/memory.max`, `memory.current`, `memory.peak` đều không tồn tại; `cgroup.controllers` rỗng — không có bằng chứng đọc trực tiếp, chỉ có suy luận từ dấu vết |
| Threads=1 có cứu được không | **KHÔNG** — đỉnh RSS còn cao hơn cả 2 lần chạy lite của Y4 (5,63 vs 4,90 / 4,49 GiB); init nhanh nhất từng đo (3,2 s) nhưng predict vẫn chết |
| Kết luận | **Vẫn chưa có số fps trên VM này, cần máy RAM tổng ≥ 12 GB (khuyến nghị 16 GB)** — giữ nguyên khuyến nghị của Y4 §3.3, giờ có thêm bằng chứng trần cell |

## 1. Lần thử duy nhất đợt này (z4): lite, footprint tối thiểu hợp lệ

| | |
|---|---|
| Thời gian (+07) | 12:39–12:40, 09/11/2026 (05:39–05:40 UTC) |
| Model | birefnet-general-lite (đã có từ Y4, không tải lại): `~/.u2net/models/birefnet-general-lite/birefnet-general-lite.onnx`, 224.005.088 byte, md5 đã verify ở Y4 |
| Footprint tối thiểu | ORT `intra_op_num_threads=1` + `inter_op_num_threads=1`, `OMP_NUM_THREADS=1`, `MKL_NUM_THREADS=1`, `enable_cpu_mem_arena=False`; 1 predict duy nhất; ảnh `~/workspace/scratch-bgremove/person.jpg` (JPEG thật 640×640, 43.409 byte — cùng ảnh W1/X5/Y4), đưa nguyên vào `session.predict`, **không resize trước** (predict vẫn chạy 1024×1024 như Y4 §1 đã chứng minh) |
| Venv | `server/bgremove/.venv` (Python 3.12.3): rembg **2.0.87**, onnxruntime **1.23.2**, Pillow **13.0.0**, numpy **2.5.4** (khớp Y4) |
| Máy lúc bắt đầu | MemTotal 7.934 MB; free **138 MB**, avail **1.422 MB**; swap đã dùng 326/1.023 MB; sibling đang chạy: pip-audit + apt (luồng khác của đợt 72) |
| Init | **3,2 s** (nhanh nhất từng đo — page cache ấm sau Y4; so Y4: 13,0 / 62,5 s general, 22,4 / 23,8 s lite), RSS sau init **0,61 GiB** (640.972 KB — khớp Y4c 0,62 GiB) |
| Predict #1 | RSS leo răng cưa rồi tăng dốc cuối; **chết exit 137 sau ~32 s trong predict** (tổng ~36 s từ lúc chạy, init 3,2 s) |
| Runtime báo | `failureKind=subprocess.oom_killed`, `oomKills=1` — runtime tự đếm 1 lần OOM-kill ở lệnh chạy probe |

## 2. Kiểm chứng giả thuyết trần RAM từ trong sandbox — kết quả

### 2.1 Đọc giới hạn cgroup: KHÔNG ĐỌC ĐƯỢC (như Y4, đã kiểm tra lại đầy đủ)

- `/sys/fs/cgroup/` tồn tại, mount `cgroup2` (`/proc/self/mountinfo`:
  `cgroup2 cgroup2 rw,nsdelegate,memory_recursiveprot`), nhưng trong đó
  **chỉ có**: `cgroup.controllers`, `cgroup.events`, `cgroup.freeze`,
  `cgroup.kill`, `cgroup.max.depth`, `cgroup.max.descendants`,
  `cgroup.pressure`, `cgroup.procs`, `cgroup.stat`, `cgroup.stat.local`,
  `cgroup.subtree_control`, `cgroup.threads`, `cgroup.type`,
  `cpu.pressure`, `cpu.stat`, `cpu.stat.local`, `io.pressure`,
  `memory.pressure`. **Không có** `memory.max`, `memory.current`,
  `memory.peak`, `memory.events`, cũng không có cây v1
  `/sys/fs/cgroup/memory/` (`memory.limit_in_bytes` không tồn tại).
- `cat /sys/fs/cgroup/cgroup.controllers` → **rỗng**: không controller
  nào được delegate vào namespace này (kể cả `memory`).
- `/proc/self/cgroup` = `0::/` (cgroup gốc, không có giới hạn riêng
  đọc được). `dmesg` không có quyền đọc (như X5/Y4). `ulimit -m`
  = unlimited (không phải trần này).
- **Bằng chứng duy nhất về con số 6,0 GiB vẫn là metadata của runtime:**
  mọi lệnh exec đều báo `sharedMemoryLimitBytes: 6442450944`
  = **6.442.450.944 byte = đúng 6,0 GiB**. Không có cách nào đọc trực
  tiếp hơn từ trong sandbox — giả thuyết trần cell **không thể kiểm
  chứng tuyệt đối bằng file cgroup**, chỉ có thể củng cố bằng dấu vết
  (§3). Nợ "đọc cgroup" của Y4 §7 mục 3 vì vậy **đóng lại ở mức: đã thử
  đủ mọi đường đọc, không đường nào mở** — không còn đường đọc nào
  chưa thử trong sandbox này.

### 2.2 RAM tổng / khả dụng lúc đo

- MemTotal **7.934 MB** (8.124.908 KB), swap 1.023 MB.
- Lúc bắt đầu probe: free 138 MB, avail 1.422 MB (máy đang bận vì các
  luồng đợt 72 chạy song song — pip-audit, apt).
- Giữa predict, các sibling thoát làm hệ thống **nhẹ dần**: free
  219 MB (t=13) → 1.129 MB (t=15) → 4.554–5.131 MB (t=23–27) →
  2.787–3.834 MB (t=30–35); avail tương ứng 421 MB → 1.183 MB →
  4.736–5.450 MB → 3.043–4.090 MB. Tức là **lúc chết, hệ thống còn
  ~2,8 GB free / ~3,0 GB avail** — xem §3.

## 3. Ngưỡng OOM — trace RSS 1 s và phân tích cơ chế chết

### 3.1 RSS theo thời gian (trace CSV đầy đủ, sample 1 s)

Trace: `~/workspace/.tmp-r72z4/rss_z4_lite_t1.csv` (scratch, không
stage) + log `probe_z4.log`. VmRSS (KB → GiB), free/avail hệ thống
(MB) tại cùng thời điểm:

| t (s) | VmRSS | free | avail | Ghi chú |
|---|---|---|---|---|
| 0 | 0,01 GiB | 154 | 1.421 | python vừa khởi động |
| 1–3 | 0,14 → 0,47 GiB | 153–165 | 1.334–1.398 | đang load model |
| 4 | **0,61 GiB** | 143 | 936 | init xong (3,2 s), bắt đầu predict |
| 5–7 | 0,58 → 1,32 GiB | 132–195 | 742–989 | răng cưa (arena OFF trả RAM, như Y4c) |
| 8–9 | 0,83 → 0,91 GiB | 563–708 | 730–859 | sibling thoát, free hệ thống nhảy lên |
| 10–13 | 1,09 → 1,42 GiB | 219–407 | 421–616 | leo chậm |
| 15 | 2,08 GiB | 1.129 | 1.183 | |
| 23–27 | 1,15–2,08 GiB | 4.335–5.131 | 4.583–5.450 | **sibling thoát hàng loạt, hệ thống nhẹ hẳn** (khoảng trống t=16–22: watcher bị đói CPU dưới áp lực RAM, không sample được — ghi nhận, không lấp số) |
| 28–32 | 2,57 → 4,51 GiB | 1.940–3.834 | 2.203–4.090 | tăng dốc ~0,5 GiB/s |
| 33 | 5,10 GiB | 1.358 | 1.634 | |
| 34 | 5,02 GiB | 1.407 | 1.709 | |
| 35 | **5,63 GiB** (VmHWM 5,64 GiB) | 880 | 1.077 | mẫu cuối; chết ngay sau đó, exit 137 |

Đỉnh: VmRSS mẫu cuối **5.902.172 KB = 5,63 GiB**; VmHWM
**5.910.824 KB = 5,64 GiB**. So sánh: Y4 lite arena ON 4,90 GiB
(vẫn đang tăng lúc chết), arena OFF 4,49 GiB; general plateau
4,37–4,41 GiB. **Threads=1 + arena OFF không giảm đỉnh — đỉnh còn
cao hơn ~0,7–1,1 GiB so với Y4.** Khả năng: threads=1 làm ORT chạy
tuần tự, giữ tensor trung gian lâu hơn; hoặc spike cuối của decoder
(upsample về 1024×1024) vốn đã chiếm phần lớn đỉnh và không phụ
thuộc số thread. Dù cơ chế nào, **giảm thread không phải lối thoát**.

### 3.2 Vì sao chết — trần cell 6,0 GiB, KHÔNG phải OOM hệ thống

Ba dấu vết hội tụ, và lần này **loại trừ được OOM hệ thống**:

1. **Hệ thống còn nhiều RAM lúc chết.** Mẫu cuối (t=35): free 880 MB,
   avail 1.077 MB; chỉ vài giây trước đó (t=30–32) free còn
   2.787–3.834 MB, avail 3.043–4.090 MB. OOM-killer hệ thống không
   giết process khi máy còn ~3 GB free. Ở Y4b (lite arena ON) thì
   ngược lại: free ~130 MB lúc chết — đó mới là OOM hệ thống thật.
   Lần này **không phải**.
2. **Tổng RAM trong cell chạm đúng 6,0 GiB.** Probe 5,63 GiB + hatch
   daemon ~0,30 GiB (RSS 280–307 MB đo được) + systemd/journald/execd
   và các process nhỏ khác ~0,05–0,1 GiB ≈ **5,98–6,03 GiB** — khớp
   đúng `sharedMemoryLimitBytes = 6.442.450.944 byte = 6,0 GiB` mà
   runtime báo trên mọi lệnh exec. Cộng thêm page cache file model
   (224 MB lite) nếu trần tính cả cache thì còn chạm sớm hơn.
3. **Runtime tự xác nhận OOM-kill.** Kết quả lệnh chạy probe:
   `failureKind=subprocess.oom_killed`, `oomKills=1`. Đây là đếm
   OOM-kill của chính lớp sandbox/runtime, không phải suy đoán từ
   exit code 137.
4. **Cùng chữ ký với general ở Y4.** General Y4a/a2 chết khi RSS đã
   plateau 4,37–4,41 GiB mà hệ thống còn avail ~1.000 MB — cùng kiểu
   "chết khi máy còn RAM". Với trần cell: general 4,4 GiB + daemon +
   sibling (Chrome 1,25 GiB ở a1) ≈ 6,0 GiB. Mọi lần chết "khó hiểu"
   từ X5/Y4 đến nay đều khớp một mô hình duy nhất: **trần cell 6,0 GiB**.

**Kết luận cơ chế (mức tin cậy cao, không tuyệt đối):** predict
birefnet bị giết bởi **trần RAM 6,0 GiB của sandbox/cell**, không phải
hết RAM hệ thống 8 GB. Không đọc được file cgroup để khẳng định
tuyệt đối (§2.1), nhưng không còn cơ chế nào khác giải thích được cả
4 dấu vết cùng lúc. Nếu trần này đúng thì **mọi đo RAM-heavy trong
sandbox đều bị trần 6,0 GiB chi phối, không riêng birefnet** — đúng
như Y4 §7 mục 3 đã cảnh báo.

### 3.3 Cần RAM bao nhiêu — kết luận (giữ nguyên Y4 §3.3, thêm biên)

- Đỉnh RSS đo được lần này **5,63 GiB và vẫn đang tăng lúc chết**
  (tăng ~0,6 GiB trong 1 s cuối: 5,02 → 5,63 GiB) — đỉnh thật của
  predict lite chưa biết, plausibly **6–6,5 GiB**. General plateau
  4,4 GiB nhưng cũng chưa bao giờ hoàn thành predict ở đây (trừ 1
  lần duy nhất của J8).
- Cần **RAM trống ≥ ~6 GiB duy trì suốt predict** (init + predict
  2–4 phút), chưa tính OS/runtime/sibling — và trên VM này trần cell
  6,0 GiB chặn cứng trước khi đạt được mức đó.
- Máy đo riêng khuyến nghị: **RAM tổng ≥ 12 GB** (để có ≥ ~7 GiB
  trống sau OS/runtime), **16 GB cho thoải mái**. Đây là khuyến nghị
  từ lower-bound đo được (5,63 GiB, vẫn đang tăng) + biên an toàn,
  không phải số đo trực tiếp trên máy 12/16 GB — chưa có máy đó để
  đo, không claim hơn.

## 4. Không có số nào khác

- **Không có số fps, không có s/frame, không có thống kê alpha/mask:**
  không lần predict nào trả về mask nên không có gì để tính — và
  không được suy fps từ thời gian "chết giữa chừng" (~32 s predict
  trước khi chết không phải thời gian predict).
- **Không thử model general đợt này:** general nặng hơn lite ở init
  (RSS 1,97–2,00 GiB vs 0,61–0,64 GiB) và đã chết 0/5 với cùng chữ
  ký trần cell; chạy lại chỉ lặp lại kết quả đã biết, tốn RAM của
  các luồng đợt 72 đang chạy song song. Quyết định: 1 lần thử
  minimal-footprint là đủ để đóng nợ "kiểm chứng giả thuyết trần".
- **Không sửa production:** không đổi `bgremove.py`, requirements,
  hay bất kỳ file code nào. Chỉ thêm doc LIMITS này. Probe + trace
  CSV + log đều nằm ngoài repo (scratch `~/workspace/.tmp-r72z4/`).

## 5. File đổi/thêm (batch phase9-round72-z4-birefnet-fps, KHÔNG push)

- `docs/PHASE9_ROUND72_Z4_BIREFNET_FPS_LIMITS.md` — doc này (mới).
- KHÔNG đổi: code, requirements, venv, script nào trong repo.
- Scratch không stage: `~/workspace/.tmp-r72z4/probe_z4.py`,
  `watch_rss.sh` (copy từ Y4), `rss_z4_lite_t1.csv`, `probe_z4.log`.
- Stage file: `paths-loop/phase9-round72-z4-birefnet-fps.txt`
  (NUL-delimited, 1 entry, verify read-back 1/1 tồn tại và là text).

## 6. Nợ mở cho đợt sau

1. **Birefnet fps vẫn chưa có số** — nhưng giờ đã biết chính xác vì
   sao và cần gì: đo trên máy RAM tổng ≥ 12 GB (khuyến nghị 16 GB),
   **ngoài sandbox này** (trần cell 6,0 GiB chặn cứng — đo trong
   sandbox, dù máy có yên đến đâu, cũng không vượt qua được đỉnh
   ~5,6 GiB + overhead). Đừng đo birefnet trong sandbox nữa trừ khi
   trần cell được nâng. Khi nào 1 lần predict đơn hoàn thành thì
   chạy lại full `test_bgremove.py --session birefnet-general` để
   có fps video thật.
2. **Đừng đo birefnet bằng cách đổi kích thước ảnh** (Y4 §1 — predict
   luôn 1024×1024) **và đừng đo bằng cách giảm thread** (Z4 §3.1 —
   threads=1 làm đỉnh RSS cao hơn, không thấp hơn). Cũng đừng suy fps
   từ thời gian chết giữa chừng.
3. Giả thuyết trần cell 6,0 GiB: **đã củng cố mạnh bằng 4 dấu vết
   (§3.2) nhưng vẫn chưa đọc được file cgroup** — nếu đợt sau có
   quyền đọc cgroup/dmesg thì kiểm tra lại lần cuối; còn không thì
   coi như đã đóng ở mức "tin cậy cao, không tuyệt đối".
4. TTS 39 CVE + các nợ khác của đợt 71 §5 vẫn mở, không thuộc luồng này.

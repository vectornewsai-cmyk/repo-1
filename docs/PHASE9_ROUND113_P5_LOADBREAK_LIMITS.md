# PHASE9_ROUND113_P5_LOADBREAK_LIMITS.md — Điểm gãy tải: sửa dụng cụ trích kết quả + lượt tải dài + chẩn đoán playhead kẹt, đợt 113, luồng P5

**Ngày:** 14/11/2026. **Luồng:** P5 (Phase 9 đợt 113). **Chủ đề:** Điểm gãy
tải — sửa dụng cụ trích kết quả + lượt tải dài + chẩn đoán playhead kẹt
(nợ ROUND112_LIMITS §10 mục 9).
**Bối cảnh:** docs/PHASE9_ROUND112_N5_LOADBREAK_LIMITS.md (toàn bộ —
điểm gãy VẪN MỞ: biên GIỮ 9,59 (s71); s72 ở 28,38 chỉ 30 tick → cần
~70 clip; dị thường s73 TRUNG-GIAN ở tải 0,91 chưa tách được hiệu ứng
build N1; trích kết quả timeout EVAL_TIMEOUT 60 s sau phát 340 s;
playhead kẹt ~3,5 phút ở biên clip 21,0 s),
hidden_files/round113-p5/prereg-p5.md (viết TRƯỚC mọi lượt probe) +
§7 addendum (2 sửa trước khi đo) + analyze113p5.py,
docs/PHASE9_ROUND112_LIMITS.md §5 + §10 mục 9,
docs/VCUT_VITE_LOCK_FREEZE_SPEC.md (protocol lock đóng băng).
**Build lúc viết prereg + suốt mọi lượt:** preview.tsx md5
`03bf029f09b8890b285eacc10a02172b` (khớp N1/N5 — không đổi trong cả
luồng; mtimeChanged=false mọi lượt). **Boot lúc viết prereg:** uptime -s
**2026-11-14 10:53:31Z**, boot_id
`6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0` — **boot #44 (SỐ THỨ TỰ TẠM
THỜI**, kế thừa từ mù #30 chưa đóng; gap #43 (08:53:37Z) → #44 ≈
1h59'54", trong dải chứng nhận [19'07", 3h14'08"], KHÔNG phá sàn).
Reboot này xảy ra sau khi N8 verify xong (~10:26Z) và trước khi P5 bắt
đầu (11:36Z); không luồng đợt 113 nào khác ghi nhận nó trước P5.
**Không reboot nào trong lúc P5 chạy.** F3 tap+relabel TẮT trong mọi
lượt. Chỉ chạy chromium (đường rVFC). Không probe WebKit → không chạy
vcut-webkit-postboot-check.sh (chỉ bắt buộc trước probe WebKit sau
reboot; ghi rõ caveat). Không sửa production. Không push GitHub,
không release/tag, không TTS 39, không birefnet. Repo local không có
`.git` (bản làm việc; HEAD kiểm qua public API bởi parent).

**Kết quả lớn nhất đợt này:**
- **(a1) Dụng cụ trích kết quả: ĐÃ SỬA XONG + CHỨNG MINH BẰNG ĐO.**
  Probe mới trích chunked 5 đợt + snapshot từng phần: 4/4 lượt chạy
  (dry/s75/s77/s78) trích đủ dữ liệu, **0 chunk lỗi** — kể cả s78,
  nơi lát px lớn nhất tốn **46,2 s** (eval cũ 60 s suýt soát đã thua;
  s77: 32,2 s). Lỗi EVAL_TIMEOUT của N5 sẽ không còn lấy mất dữ liệu
  lượt dài nữa (bar a1 ĐẠT).
- **(a2) Lượt tải dài 70 clip: KHÔNG CHẠY ĐƯỢC.** s76 DEFERRED 2 lần
  (acquire lock timeout 900 s, 12:21:46Z + 12:39:28Z) vì luồng p1 giữ
  vite lock liên tục ~35 phút (12:06:24Z→~12:41:26Z) qua chuỗi f1–f3
  trong lúc chờ tải nền — pattern đói lock mới (xem §0). Điểm gãy
  VẪN MỞ; biên GIỮ giữ nguyên **9,59** (s71 đợt 112).
- **(b) Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN — 0/2 lần thử chạy
  được** (s77, s78; s76 là lần thử #1 nhưng không chạy được nên
  KHÔNG tính vào tỉ lệ). Kiểm chứng độc lập từ mẫu thô stall-watch:
  cửa sổ 30 s nào playhead cũng tiến ≥10,7 s; cửa sổ 10 s nào cũng
  tiến ≥4,5 s. Không có bằng chứng mới cho H1–H4 (xem §4).
- **(c) Dị thường s73: KHÔNG PHẢI HIỆU ỨNG BUILD.** Control s75 trên
  build `03bf029f`: **1187 tick, 98,2% trong ±1, trung vị 0 → GIỮ**,
  gần như giống hệt s74 trên build cũ (841 tick, 97,6%). Build N1
  không làm offset tệ đi (bar c ĐẠT theo dự báo prereg).
- **Tick rate ở tải ~28 đã đo lại khớp N5:** s78 (sampled mean
  28,46) chỉ 0,26 tick/s, 29 tick — gần như đúng s72 (28,38; 0,24/s;
  30 tick). Kế hoạch 70 clip đã tính đúng cỡ (ước ~100 tick), chỉ
  là chưa chạy được.

---

## §0. Bối cảnh chạy (boot #44; driver chết vì bug `set -u` rồi resume; p1 giữ lock ~35 phút)

- **Boot #44 (tạm thời):** uptime -s 2026-11-14 10:53:31Z, boot_id
  `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0`. Gap #43→#44 ≈ 1h59'54",
  không phá sàn 19'07". Không reboot trong lúc P5 chạy; driver chạy
  bằng runner setsid cả hai lần.
- **Driver lần 1 chết 12:21:46Z (bug của P5, không phải hạ tầng):**
  sau khi s76 DEFERRED lần 1, driver gọi `boundary_stall_seen` và
  chết ngay với `driver113p5.sh: line 258: tag: unbound variable`
  (stderr chỉ còn trong runner113p5.out — file này sau đó bị runner
  resume ghi đè, xem dưới; dòng lỗi đã ghi lại trong LIMITS này).
  Nguyên nhân: `local tag="$1" f="$S5/$tag/stall-events.json"` trên
  cùng một lệnh — với `set -u`, bash mở rộng `$tag` trong phép gán
  `f=` TRƯỚC khi `tag` được gán → unbound variable → thoát ngay,
  trap EXIT chạy release (bị từ chối đúng vì owner là p1 — không
  phải lỗi). **Sửa:** tách thành 2 lệnh `local` riêng; unit-test
  hàm sửa (không file → rc=1; có episode atBoundary → rc=0) rồi
  mới chạy lại. Không sửa file driver đang chạy (chỉ sửa sau khi
  cây driver đã chết hẳn — kill -9 pid driver + acquire con;
  không giữ lock, không hog, không vite nên không có gì để dọn).
- **Resume (driver113p5b, 12:24:21Z):** bỏ qua dry + s75 (đã xong +
  hợp lệ ở lần 1), chạy thẳng s76. `boundary_stall_seen` sửa xong
  chạy đúng cả hai lần sau đó (log "s76 CHUA co stall..." 12:39:28Z
  + "s77 CHUA co stall..." sau s77 — xem §4).
- **Caveat ghi đè runner output:** runner113p5b.sh redirect stdout
  về cùng `runner113p5.out` (sed chỉ đổi tên script, không đổi tên
  file .out) nên output runner lần 1 đã mất; driver113p5.log còn đủ
  các dòng tee + dòng lỗi `line 258` đã trích ở trên. Lần sau đổi
  tên file .out theo driver.
- **Đói lock — p1 giữ lock liên tục ~35 phút:** p1 (thread khác đợt
  113, `run-p1-locked.sh` pid 24343) acquire lock 12:06:24Z và giữ
  XUYÊN SUỐT chuỗi f1→f2→f3 (mỗi lượt dial chờ tải nền tới 300 s +
  chạy probe) tới ~12:41:26Z mới nhả (s77 acquire được lúc đó sau
  chỉ ~118 s chờ). Trong lúc đó P5 mất 2 cửa acquire 900 s cho s76
  (12:06:41Z→12:21:46Z và 12:24:21Z→12:39:28Z) — cả hai đều là
  timeout THẬT theo spec §5 (log "HẾT 900s vẫn có lock khác",
  owner p1 còn sống, vite phục vụ). P5 KHÔNG đụng vào lock của p1,
  không xóa lock, không retry bằng stale_min nhỏ — đúng spec.
  **Pattern mới cần parent xem:** một luồng giữ lock cả chuỗi
  nhiều lượt trong lúc chờ tải nền (tải nền lại phụ thuộc các luồng
  khác — mà các luồng khác thì chờ lock) tạo ra đói lock lẫn nhau;
  cửa sổ acquire 900 s/lượt không đủ cho lượt dài khi có holder
  kiểu này. Đề xuất đợt sau: holder nhả lock giữa các lượt (như
  P5/N5 làm: nhả ngay sau mỗi lượt + sleep ≥15 s), hoặc acquire
  timeout dài hơn cho lượt dài — quyết thuộc parent, P5 không tự
  đổi protocol giữa đợt.
- **ENOSPC — 0 lần:** vite tạm `server.watch.ignored: ["**/**"]` +
  CFG_DIR riêng /tmp/round113-p5; mọi vite lên ngay attempt 1.
- **RAM thấp trong lúc phát nặng (available, `free -m` cột $7):**
  dry ≥1101 / s75 ≥1428 (không sampler — chỉ có số đầu/cuối lượt
  của driver) / s77 tối thiểu **349** / s78 tối thiểu **249** (theo
  sampler driver 5 s). Không lần nào OOM hay dừng sớm vì RAM.
- **Tải nền của luồng đợt 113 khác:** p1/p3/p7 chạy probe song song
  (vite xen kẽ, probe WebKit/Chromium) — tải sibling có trong
  sampled mean (đó là tải probe thực sự chịu; ghi rõ, không tách).

## §1. Bảng tổng hợp lượt (phân loại theo prereg §0, offset nhãn − kỳ vọng)

| lượt | config | dial mục tiêu | dial kết quả | sampled mean load1 (n) | threadsR mean | n tick | tick/s | caps | off trung vị (dải) | trong ±1 | phân loại |
|---|---|---|---|---|---|---|---|---|---|---|---|
| chr-code-blur-dry | stripes-code-blur | chạy khô, không hog | — | **28,23** (n=4) | 1,5 | **441** | 47,97 | 263 | **0** (−1..+1) | 100% | **GIỮ** (chỉ validate dụng cụ, không tính bar) |
| chr-code-blur-s75 | stripes-code-blur | control, không hog | — | **1,68** (n=15) | 9 | **1187** | 17,35 | 259 | **0** (−1..+5) | 98,2% | **GIỮ** |
| chr-code-blur-s76 | stripes-code-blur | [15, 30] | DEFERRED ×2 (lock) | — | — | — | — | — | — | — | **KHÔNG CHẠY** |
| chr-code-blur-s77 | stripes-code-blur | [15, 30] | ĐẠT 20,62 (28 hog) | **10,02** (n=29) | 37,5 | **20** | 0,17 | 42 | **+6** (0..+53) | 25,0% | TRUNG-GIAN (không hợp lệ: n<50) |
| chr-code-blur-s78 | stripes-code-blur | [15, 30] | ĐẠT 19,87 (32 hog) | **28,46** (n=29) | 38,7 | **29** | 0,26 | 46 | **+5** (0..+78) | 27,6% | TRUNG-GIAN (không hợp lệ: n<50) |

- **Dry (nclips=3, 9 s media):** 441 tick, GIỮ — validate probe
  mới (xem §2). Lưu ý: dry chạy dưới tải sibling cao (loadSamples
  mean 28,23, n=4) mà offset vẫn 100% trong ±1 — tải cao KHÔNG phá
  offset ngay trên lượt ngắn 9 s; suy thoái chỉ thấy trên lượt dài
  60 s (s77/s78). Đây là quan sát, không phải lượt đo tải (nclips=3,
  không tính bar).
- **s75 control (build 03bf029f):** 1187 tick, GIỮ — xem §5.
- **s76 (nclips=70):** DEFERRED 2 lần vì lock (xem §0) — không có
  dữ liệu. MISSING trong analyzer.
- **s77:** dial ĐẠT 20,62 rồi tải decay trong lúc phát còn sampled
  mean 10,02 (median 8,2, max 23,2). 20 tick — dưới ngưỡng 50 nên
  KHÔNG dùng một mình để đóng khoảng. Cửa sổ cần để đủ 50 tick:
  **286,8 s (~96 clip)** ở tick rate 0,17/s.
- **s78:** dial ĐẠT 19,87; sampled mean load1 **28,46** (median
  31,08, max 38,98) — tái lập gần đúng mức tải của s72 (28,38).
  29 tick — dưới ngưỡng 50. Cửa sổ cần: **193,8 s (~65 clip)** ở
  0,26/s.
- **Không lượt nào GÃY** (0% ≤ −2 ở cả 4 lượt chạy — mọi lượt đều có
  fracLeNeg2 = 0,0%). Dạng lệch vẫn DƯƠNG (trung vị +5/+6, xem §7).
- **Gộp mô tả (KHÔNG dùng để phân loại — không đăng ký gộp, hai
  lượt khác mức tải):** s77+s78 = 49 tick, trung vị +6, 26,5%
  trong ±1, 0% ≤ −2, dải 0..+78.

## §2. Bar (a1) — dụng cụ trích kết quả: ĐÃ SỬA XONG (ĐẠT)

- **Thiết kế (prereg §2):** trích cuối chia 5 chunk (A blend/pump/
  tick 180 s; B caps-metadata 180 s; C px theo lát 50 cap 120 s/lát;
  D state100/draws 180 s; E scalars 60 s), ghi part file ngay khi
  nhận; ráp lại cùng cấu trúc top-level với N5 + field `extraction`;
  chỉ chunk A lỗi mới exit=2. Thêm snapshot từng phần mỗi 60 s
  (`frame-parity-partial.json`) + stuck watcher 5 s.
- **Kết quả:** 4/4 lượt chạy trích đủ dữ liệu, **0 chunk lỗi**
  (extraction.errors = [] cả 4 lượt):

| lượt | A-blend | B-caps | D-state | E-scalars | C-px (lớn nhất) | partial |
|---|---|---|---|---|---|---|
| dry | 275 ms | 132 ms | 118 ms | 2 ms | 1.280 ms (6 lát) | — (phát ngắn) |
| s75 | OK | OK | OK | OK | OK (6 lát) | có |
| s77 | 819 ms | 2.839 ms | 9.514 ms | 2.290 ms | **32.224 ms** (1 lát, 42 cap) | có |
| s78 | 803 ms | 1.694 ms | 12.903 ms | 912 ms | **46.192 ms** (1 lát, 46 cap) | có |

- **Bằng chứng quyết định:** dưới tải nặng, chỉ riêng lát px đã
  tốn 32–46 s — eval cũ gộp toàn bộ payload trong 60 s (N5) đã thua
  ở s72 lần 1 (340 s tường) và suýt soát đã thua ở đây (46,2 s cho
  MỘT lát, chưa kể các phần khác). Chunked đã cứu cả s77 lẫn s78
  khỏi mất dữ liệu. Thời gian trích tăng theo mức đói của renderer
  (dry ~1,3 s/lát → s78 46,2 s/lát), đúng như giả thuyết lỗi gốc.
- **Snapshot từng phần cũng chạy:** `frame-parity-partial.json` có
  mặt ở s75/s77/s78 (ghi đè mỗi 60 s trong lúc phát) — bảo hiểm
  incremental đã hoạt động, dù lần này không cần dùng tới (trích
  cuối thành công cả 4 lượt).
- **Không đổi logic đo:** metric chính vẫn blendTick rVFC; sampler/
  caps/state100 giữ nguyên; diff probe113p5 vs probe112n5 (bản repo)
  chỉ gồm header + SCRATCH/CFG_DIR + watcher + trích chunked
  (199 dòng diff, đã soát: không dòng đo nào đổi ngoài khối trích
  cũ). Probe tái tạo byte-for-byte từ
  `hidden_files/round113-p5/patch-probe113p5.py` (đã kiểm diff sau
  khi sửa watcher — khớp 100%).
- **Quirk nhỏ (ghi rõ, không ảnh hưởng kết quả):** field
  `stallWatch.samples` trong results json là số mẫu trong cửa sổ
  30 s cuối đã prune (dry 1, s75/s77/s78 6/5/6), KHÔNG phải tổng số
  mẫu watcher — tổng số thật đọc từ `stall-watch.jsonl` (dry 1,
  s75 12, s77 22, s78 23). Analyzer không dùng field này.

## §3. Bar (a2) — điểm gãy ở tải ~28: KHÔNG ĐO ĐƯỢC (s76 không chạy)

- **Điểm gãy: VẪN MỞ.** Biên GIỮ giữ nguyên **9,59** (s71, đợt 112).
  Không có lượt GÃY nào; không có lượt tải nào đủ ≥50 tick để
  phân loại (s77 20 tick ở 10,02; s78 29 tick ở 28,46).
- **Kế hoạch 70 clip đã tính ĐÚNG CỠ (chứng minh bằng số đo mới):**
  s78 ở sampled mean 28,46 cho tick rate 0,26/s — khớp s72
  (28,38; 0,24/s). Với 210 s media (70 clip) ở tỉ lệ playhead/wall
  ~0,53 như s78, tường kỳ vọng ~396 s → ~103 tick, vượt xa ngưỡng
  50. Ngay cả theo ước thận trọng của analyzer (cửa sổ cần 193,8 s
  → ~65 clip), 70 clip vẫn đủ. Lượt dài chỉ thiếu vì lock, không
  phải vì toán tích tick sai.
- **Dial vẫn không điều khiển được load1** (như N5): s77/s78 đều
  dial ĐẠT (20,62 / 19,87) nhưng tải decay trong lúc phát (s77 còn
  sampled mean 10,02; load1 trong stall-watch s77 rơi 19,7 → 4,86).
  Chỉ sampled mean TRONG LÚC PHÁT đáng tin.

## §4. Bar (b) — playhead kẹt ở biên clip 21,0 s: KHÔNG TÁI HIỆN (0/2 lần thử chạy được)

- **Định nghĩa đăng ký trước:** stall = playhead tiến < 0,05 s
  trong bất kỳ cửa sổ tường 30 s nào khi playing=true; stall ở biên
  = playhead trong 0,1 s ngay trước một bội số của 3,0 s.
- **Kết quả:** s77: 0 episode stall (22 mẫu watcher); s78: 0 episode
  (23 mẫu). **Tỉ lệ tái hiện 0/2 lần thử chạy được** (s77, s78).
  s76 là lần thử #1 theo prereg nhưng KHÔNG CHẠY được (lock) nên
  không tính vào tỉ lệ — P5 KHÔNG tuyên bố "0/3" (chỉ 2 lần thử
  thực sự chạy).
- **Kiểm chứng độc lập từ mẫu thô (tính lại từ stall-watch.jsonl,
  không tin mù watcher):** cửa sổ 30 s nào playhead cũng tiến
  ≥10,67 s (s77) / ≥11,13 s (s78); cửa sổ 10 s nào cũng tiến ≥4,47 s
  / ≥5,77 s. Playhead không đứng yên ở bất kỳ thang nào — kể cả
  thang ngắn hơn ngưỡng đăng ký 30 s. Cả hai lượt đều vượt qua biên
  21,0 s mà không chậm lại (s77: 19,77 → 21,93 giữa hai mẫu liên
  tiếp; s78: 15,73 → 21,30 giữa hai nhịp chờ).
- **Trạng thái element trong lúc phát (snapshot watcher):**
  - `seeking=true` thoáng qua ở element đang phát: 9/22 mẫu (s77),
    14/23 mẫu (s78) — seeking theo từng lần chuyển clip, không kẹt
    (mẫu kế tiếp đã hết seeking và playhead đã tiến).
  - `decoderErrorRecoveredPlaying` = 0, `tickErrors` = 0,
    `seekFailureExhausted` = false, `pauseRetryExhausted` = false
    suốt cả hai lượt — đường phục hồi lỗi decoder (R6) KHÔNG kích
    hoạt lần nào.
  - **Dị vật:** s77 có 1 element chết từ đầu lượt (ct=0, paused,
    readyState=0, networkState=3, error `4:MEDIA_ELEMENT_ERROR:
    Format error`, bufEnd=null) hiện diện trong CẢ 22 mẫu — đây là
    element stale từ lúc seed/import (đã lỗi trước khi phát tiến),
    không phải element đang phát (element đang phát error=null,
    readyState=4, ct tiến theo playhead). Nó không chặn phát (ticks
    vẫn ghi, playhead vẫn tiến) và không đổi trong suốt lượt nên
    không phải cơ chế của vụ kẹt s72 lần 1. Ghi nhận để luồng sau
    khỏi nhầm là bằng chứng H2. s78 không có element lỗi nào.
- **Đánh giá H1–H4 (đăng ký trước):** stall không tái hiện nên
  KHÔNG có bằng chứng mới cho hay chống lại giả thuyết nào. H1
  (step-seek không xong) / H2 (lỗi decoder) / H3 (pause-retry/
  tail-gate) / H4 (pipeline Chromium đói) đều vẫn mở như trước —
  nhưng với 2 lần thử âm tính ở đúng điều kiện s72 lần 1 (nclips=20,
  dial [15,30], load đỉnh ~36–39, playhead ratio ~0,52), vụ kẹt
  3,5 phút của s72 lần 1 trông càng giống sự kiện hiếm/khó tái hiện
  hơn là hành vi hệ thống. Cần lượt dài s76 (210 s phát, nhiều biên
  clip hơn gấp 3,5×) mới có cơ hội tái hiện đáng kể — đó vẫn là nợ
  (xem §10).
- **Caveat watcher:** khoảng cách giữa các mẫu watcher tới 9,3 s
  (s77) / 6,9 s (s78) dưới tải (cadence danh nghĩa 5 s; eval
  watcher timeout 20 s, mẫu khuyết không phá vòng chờ). Một stall
  < ~10 s có thể lọt giữa hai mẫu — nhưng stall mục tiêu dài ~3,5
  phút nên không bị ảnh hưởng; và kiểm chứng 10 s ở trên dùng đúng
  các mẫu đã có nên kết luận "không stall ≥10 s" là vững.

## §5. Bar (c) — dị thường s73: KHÔNG PHẢI HIỆU ỨNG BUILD (ĐẠT)

- **s75 control trên build 03bf029f: GIỮ** — 1187 tick, trung vị 0,
  mean +0,03, **98,2% trong ±1**, 0% ≤ −2, tick rate 17,35/s,
  phRatio 0,877, wall 68,41 s. So với s74 control trên build cũ
  c4198206: 841 tick, 97,6%, trung vị 0 — gần như giống hệt.
  **Build N1 (fix E4 steady-close) không làm presented offset tệ
  đi.** Dự báo prereg thỏa: s73 TRUNG-GIAN không phải do đổi build.
- **Diễn giải s73 được củng cố (không kết luận vội thêm):** s75 có
  load5 mean **10,06** trong lúc phát (decay từ tải sibling cao)
  mà vẫn GIỮ với tick rate 17,35/s — load5 cao một mình không làm
  offset tệ. Điểm khác biệt giữa s75 (GIỮ) và s73 (TRUNG-GIAN) là
  pump có đói không: s75 skip-stale-frame 10,8%, tick rate 17,35/s;
  s73 skip-stale 40,3%, tick rate 1,6/s, threadsR 18,2. Chỉ số đói
  pump tức thời (tick rate / tỉ lệ skip-stale) phân biệt hai lượt
  tốt hơn load1/load5 EMA — đúng hướng N5 §4, nhưng vẫn là mô tả
  hậu kiểm, chưa đăng ký thành bar dự báo (xem §10 mục 6).
- **Caveat control:** s75 chờ yên 100 s (load1 16,31 → 4,79) rồi
  cổng yên nội bộ chờ thêm 60 s mới đạt load1 1,99 lúc phát;
  sampled mean load1 1,68 (n=15, median 1,7, max 2,08) — control
  sạch theo tiêu chí prereg (không hog), dù máy có tải sibling
  decay (load5 10,06). Không có lượt "lai" (md5 ổn định).

## §6. Metric thay thế + offset100 (mô tả, không phân loại)

- **offset100 (CHỈ MÔ TẢ, như prereg):** dry n=88, trung vị 0,
  77,3% trong ±1; s75 n=469, trung vị +1, 63,5%, 0% ≤ −5; s77 n=25,
  trung vị +3, 4,0%, 28,0% ≤ −5; s78 n=64, trung vị −23, 10,9%,
  75,0% ≤ −5. offset100 suy thoái mạnh theo mức đói tick (càng ít
  tick, pres trong snapshot càng stale so với ph) — đúng như đã
  đăng ký: nền nhiễu ±3 trên control yên, không dùng được để phân
  loại. Giá trị −23 của s78 phản ánh tick starvation (29 tick /
  112 s tường), không phải bằng chứng trễ âm của blendTick (trung
  vị blendTick s78 là +5, 0% ≤ −2).
- **threads-R:** s75 9 / s77 37,5 / s78 38,7 — bám theo số hog đang
  sống + sibling, không bám CPU thật (như M7/N5). Không đề xuất thay
  load1.
- **Tick rate:** 47,97/s (dry, 9 s) / 17,35/s (s75) / 0,17/s (s77)
  / 0,26/s (s78) — sụp theo tải + độ dài lượt; dùng để tính cửa sổ
  cần thiết (§1), không làm metric chính.
- **Playhead ratio:** 0,979 / 0,877 / 0,523 / 0,534 — media clock
  chậm lại dưới tải nặng, như N5.
- **Gate v2 (mô tả):** ĐẠT ở dry/s77/s78, KHÔNG ĐẠT ở s75 control
  (đúng vì control không tải). s77/s78 TRUNG-GIAN (không hợp lệ)
  mà vẫn đạt gate — đạt gate v2 không suy ra presented GIỮ (như
  M7/N5).

## §7. Cơ chế lệch dương — skip-stale-frame (bằng chứng pump, gộp với N5)

- Tỉ lệ pump `skip-stale-frame` và tỉ lệ off ≥ +2 theo lượt (P5):
  s75: 10,8% skip → off ≥ +2 chiếm ~1,8% (1187 tick, chỉ 21 tick
  ≥ +2, max +5); s77: 46,2% → off ≥ +2 chiếm ~75% (trung vị +6);
  s78: 41,0% → off ≥ +2 chiếm ~72% (trung vị +5). (s77/s78 còn có
  thêm decision `skip-stale` 8/7 lần — khác `skip-stale-frame`,
  không gộp vào tỉ lệ trên; N5 chỉ đếm `skip-stale-frame`.)
- Mẫu N5 lặp lại: pump bỏ qua frame stale rồi presented nhảy ahead
  (offset dương). Dạng gãy "trễ âm" của K4 r56 vẫn KHÔNG tái hiện
  ở bất kỳ mức tải nào tới 28,46 (0% ≤ −2 trên cả 4 lượt P5).
- tagAgree suy giảm theo tải: dry 599/748 (80%) → s75 1673/2554 (66%)
  → s77 368/718 (51%) → s78 172/642 (27%) — nguồn draw của sampler
  cũng đói theo main thread; chỉ dùng blendTick để phân loại, như M7/N5.

## §8. Bar (d) + (e) — quan hệ với gate v2 L5; mẫu lỗi CDP/project-load

- **Gate v2 (Bar d):** như §6 — đạt ở cả lượt TRUNG-GIAN, không suy
  ra GIỮ. Quan hệ là mô tả.
- **Mẫu lỗi CDP/project-load (Bar e): 0 lần** trong 4 lượt chạy
  (kể cả s78 ở sampled mean 28,46, max 38,98). Probe frame-parity
  sống sót ở tải mà harness E1 chết (L5) — không suy rộng sang E1.
  (CDP đã bỏ làm bar song song theo quyết parent 14/11; giữ in-page
  chính + CDP giám định từng gap.)

## §9. Kiểm chứng (cây cuối, md5 03bf029f)

- `tsc --noEmit` (apps/web): **0 lỗi** (12:56:33Z, trên build
  03bf029f).
- `vite build`: **pass (6,56 s)** (12:56:49Z, trên build 03bf029f).
- Không sửa production trong luồng này; preview.tsx md5 cuối
  `03bf029f09b8890b285eacc10a02172b` (khớp lúc viết prereg).
- Probe copy `probe113p5-frame-parity.mjs`: node --check PASS trước
  lượt đầu + sau mỗi lần sửa; tái tạo byte-for-byte từ
  `patch-probe113p5.py` (đã kiểm diff); diff với probe112n5 (bản
  repo) chỉ gồm các thay đổi đã đăng ký (§2).
- Analyzer `analyze113p5.py` (trong `hidden_files/round113-p5/`):
  tính lại toàn bộ từ results json thô; bảng §1 khớp output analyzer
  (đếm lại từ đĩa, không tin mù log driver). Header analyzer đã sửa
  "N5" → "P5" (chỉ đổi chữ, không đổi công thức).
- Driver 1 chết vì bug `set -u` (§0) — đã sửa + unit-test hàm sửa
  trước khi resume; resume driver chạy đủ tới "done" 12:54:58Z.
  Vite lock đã nhả sạch, không vite mồ côi (kiểm ps + curl cổng
  sau lượt cuối; lock status TRỐNG lúc 12:55Z).

## §10. Nợ còn lại

1. **Điểm gãy tải: VẪN MỞ (chưa đóng khoảng).** Biên GIỮ vẫn 9,59
   (s71 đợt 112). Không có điểm GÃY nào. s77/s78 TRUNG-GIAN nhưng
   không hợp lệ (20/29 tick < 50). **Đợt sau: chạy s76 (nclips=70,
   dial [15,30]) — kế hoạch đã chứng minh đúng cỡ (§3), chỉ cần
   cửa lock; hoặc tìm metric presented không phụ thuộc mật độ tick
   rVFC.**
2. **Playhead kẹt ở biên clip: KHÔNG TÁI HIỆN 0/2 (s77, s78).**
   Cần lượt dài s76 (nhiều biên clip hơn, thời gian phơi dài hơn)
   làm lần thử tiếp theo; nếu s76 cũng 0 stall thì cân nhắc hạ mức
   ưu tiên (sự kiện hiếm, đã 0/2 + 0/1 lần retry s72). H1–H4 vẫn
   mở, chưa có bằng chứng mới.
3. **Đói lock giữa các luồng đợt 113 (mới, §0):** holder giữ lock
   cả chuỗi nhiều lượt trong lúc chờ tải nền làm acquire 900 s của
   luồng khác timeout liên tiếp. Đề xuất parent xem: holder nhả
   lock giữa các lượt (mẫu N5/P5), hoặc acquire timeout dài hơn
   cho lượt dài, hoặc tách dial-chờ-tải ra khỏi vùng giữ lock.
   P5 không tự đổi protocol giữa đợt.
4. **Dị thường s73: ĐÃ GIẢI QUYẾT VỀ PHÍA BUILD (xem §5).** Còn
   lại: kiểm chứng ứng viên chỉ số đói pump tức thời (tick rate /
   tỉ lệ skip-stale-frame trong lúc phát) như bar dự báo — cần đăng
   ký bar riêng đợt sau, không suy ra từ dữ liệu hậu kiểm này.
5. **Dial tải bằng hog vẫn không điều khiển được load1** (xem §3):
   đừng tin "dial ĐẠT" — chỉ tin sampled mean TRONG LÚC PHÁT.
6. **Load1/load5 không dự báo được phân loại lượt** (xem §5): cần
   chỉ số đói pump tức thời hơn nếu muốn dự báo (ứng viên §10.4).
7. **Gate v2 không suy ra presented GIỮ** (đạt ở cả lượt TRUNG-GIAN).
8. **offset100 không dùng được để phân loại** (nền nhiễu ±3; suy
   thoái theo đói tick — xem §6).
9. **Element chết với format error trong s77 (mới, §4):** 1 element
   stale (ct=0, readyState=0, error 4) tồn tại suốt lượt nhưng không
   chặn phát — cần luồng khác kiểm xem pool có giữ element lỗi quá
   lâu không (vệ sinh pool, không phải lỗi đo). Không ưu tiên cao.
10. Các nợ ngoài phạm vi P5 (giữ nguyên từ LIMITS gộp đợt 112 §10):
    G1 deinterlace (chờ user quyết), mù #22/#28/#29/#30 (chờ user
    quyết), E4 cần đợt xác nhận tải cao, ring 8 MiB đo lag push/take
    trực tiếp, zombie tích mẫu chuyển clip tới n≥5, ngưỡng WebKit
    ≤60 ms cần 1 lượt yên thật, postboot-check cập nhật lên #44
    (header script vẫn ghi #42/#43 — N8 đã ghi nợ này từ đợt 112),
    ENOSPC (vite nối tiếp bắt buộc; watch.ignored giữ), birefnet
    (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
    ci-security.yml 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 113 P5)

- `apps/web/scripts/probe113p5-frame-parity.mjs` — probe copy
  probe112n5 (bản repo) + trích chunked 5 đợt + snapshot từng phần
  60 s + stuck watcher 5 s (node --check PASS; tái tạo byte-for-byte
  từ patch script; **48.908 byte > 37.768 — ghi chú rõ cho lúc push**).
- `docs/PHASE9_ROUND113_P5_LOADBREAK_LIMITS.md` — file này.
- Dữ liệu thô + driver + analyzer nằm ngoài repo, tại
  `hidden_files/round113-p5/` (không stage): prereg-p5.md (+ §7
  addendum), patch-probe113p5.py, make-driver113p5.py,
  driver113p5.sh + driver113p5.log + runner113p5.sh +
  runner113p5.out (driver lần 1 — chết 12:21:46Z vì bug `set -u`),
  driver113p5b.sh + driver113p5b.log + runner113p5b.sh (resume —
  chạy đủ tới done 12:54:58Z), analyze113p5.py + .txt/.json,
  vcut-vite-lock-frozen.sh (bản copy đóng băng của vcut-vite-lock.sh,
  md5 khớp repo `fd21193c…`), hog-count.txt, hog-load-*.txt
  (sampler driver 5 s; s76 không có file sampler vì chưa tới bước
  dial), 4 thư mục lượt probe dry/s75/s77/s78 (mỗi thư mục có
  frame-parity-results.json + part files + frame-parity-partial.json
  + stall-watch.jsonl + .log + vite-attempt1.log; s77/s78 không có
  stall-events.json vì 0 episode).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).

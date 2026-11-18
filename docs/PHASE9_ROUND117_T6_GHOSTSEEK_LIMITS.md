# PHASE9_ROUND117_T6_GHOSTSEEK_LIMITS — Ghost stale sau seek: 0 seek mới, H-D vẫn mở (nợ #6 đợt 116)

> Luồng T6, đợt 117, lượt cron 15:35 +07 15/11/2026 (làm việc 08:38–10:42Z 15/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào — chỉ
> CHẨN ĐOÁN. F6' ĐÃ ĐÓNG (L7) — T6 không đóng lại, không mở lại.

## 0. Kết quả chính (5 ý)

1. **0 seek mới trong đợt này — mục tiêu ≥80 seek KHÔNG ĐẠT (vẫn
   dừng ở 60).** Không có lượt probe nào hoàn thành: attempt1 bị
   kill giữa chừng (renderer bò, lớp B đã hỏng), attempt2 hoãn
   gate A (exit 5), attempt3 chết theo reboot #53 trong lúc gate A,
   attempt4 không bao giờ được launch (replay sau #53 ĐÌNH TRỆ,
   xem ý 2). Mọi số gộp giữ nguyên như S6 (xem §3).
2. **Replay sau reboot #53 ĐÌNH TRỆ, không phải chậm: 55 phút, 0
   hoạt động.** Postboot-check exit=1 ở 8 lần kiểm (09:49–10:41Z),
   danh sách thiếu Y HỆT nhau (5 lib + thư mục GST + 11 package);
   `/var/log/dpkg.log` đóng băng ở 09:48:03 (chỉ 2 dòng "startup
   packages configure"); không process apt/dpkg nào được quan sát
   (trừ 1 blip apt_procs=1 lúc T5 kiểm 10:12–10:13Z, không cài gì).
   Đối chứng: replay sau #49 tiến triển dần và xong trong ~25 phút.
   Đây là phát hiện hạ tầng mới, thuộc T8 — T6 KHÔNG chạy
   `--repair` (xem §2.5).
3. **H-D (seek) VẪN CHƯA PHÂN BIỆT ĐƯỢC — không có dữ liệu mới để
   đổi verdict.** Gộp toàn chuỗi giữ nguyên: **5/60 seek stale
   (8,3%; CI 95% 2,8%–18,4%)**; nhiễm tải 5/40 (12,5%; 4,2%–26,8%)
   vs yên 0/20 (0,0%; 0%–16,8%); Fisher một phía p=0,1205 (tính
   lại bằng script riêng, khớp số parent tính tay đợt 116). Nợ
   "lượt yên thứ hai" dời sang đợt sau, nguyên vẹn.
4. **Event P4 frame-26 + Q5 seq 282–285: KHÔNG có dữ liệu mới để
   khẳng định hay bác tái hiện.** Không lượt probe nào hoàn thành
   nên không có quan sát nào về P4-type trong đợt này. Tally giữ
   nguyên: P4 1 + Q5 0 + R6 2 rõ + 1 nhỏ + S6att1 0 (4 lượt).
5. **Hồi quy sạch + analyzer đã xác thực.** tsc exit 0, ghostBlend
   15/15 PASS, preview.tsx md5 `03bf029f` không đổi suốt lượt.
   Analyzer copy S6 tái hiện ĐÚNG 4/19 stale (M=70/61/76/68) trên
   JSON S6 — pipeline đo sẵn sàng, chỉ thiếu cửa sổ đo. Xem §6–§7.

## 1. Môi trường + cây đo + prereg

- **Cây đo `03bf029f…`** (= cây Q5/R6/S6). preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b` kiểm trước khi làm, trước/sau
  attempt1, sau hồi quy (10:11Z), và cuối lượt (10:42Z) —
  KHÔNG ĐỔI lần nào. T6 không sửa production.
- **Chốt chặn:** file `round-in-progress.md` KHÔNG TỒN TẠI lúc T6
  bắt đầu (đợt 116 đã đóng bởi parent 12:37 +07 15/11, chốt chặn
  đã xóa; lượt cron 15:35 +07 15/11 mở đợt 117 với 10 luồng
  T1–T10; T6 là luồng ghost-seek). Cờ cây `round117-tree` xuất
  hiện lúc 10:05Z (T2): `status: NO-CHANGE`, md5-final
  `03bf029f…` (T2 đổi cây sang `af4d5753…` rồi REVERT — fix H3e
  giữ dạng patch, không đổi cây đo). Driver attempt1–3 chạy
  TRƯỚC khi cờ xuất hiện nên kiểm md5 trực tiếp (ghi rõ trong
  poll log); attempt4 (không launch) sẽ kiểm cờ theo đúng luật
  dòng status chính xác — bài học lỗi grep mở của S6 đã áp dụng.
- **Boot trong lượt:** #52 (`22536366…`, 08:29:12Z) lúc bắt đầu;
  **reboot #53** lúc 09:47:08Z (boot_id `574e3d6b…`, gap #52→#53
  ≈ 1h18') giết attempt3 + restart runtime. Mù chứa #53 thuộc T7;
  T6 chỉ ghi nhận thời gian/boot_id tại đây, không đụng
  bookkeeping mù. T2 đã giữ lock mới trên boot #53 ngay sau
  reboot (pid 3185, port 5590) — lock SỐNG, không phải stale.
- **Prereg:** `hidden_files/round117-t6/prereg-t6.md` (viết TRƯỚC
  khi đo) + bổ sung §8 (09:49Z, TRƯỚC khi đo lượt 4 — reboot #53,
  chờ replay, không sửa gate/logic). Bar quyết định xem prereg §4
  (không đổi sau khi thấy số — và lần này không có số mới nào).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng nguyên vẹn.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb. Env launch GST như M5/L7/N4/P4/Q5/R6/S6.
- **Lock v2:** `apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600` explicit, v2-only (KHÔNG dùng v1).
  Attempt1: ticket `1-1794732126139136590-8464-t6`, chờ 0 s, giữ
  779 s, nhả sạch. Attempt2/3 không giữ lock lần nào (chết ở
  gate A). T10 giữ lock lúc T6 kết thúc (verify gộp) — không phải
  lock của T6.

## 2. Các lần chạy (attempt) — không attempt nào hoàn thành probe

### 2.1 Attempt1 (08:41–08:55Z, boot #52) — KILL GIỮA CHỪNG, không JSON

| | Giá trị |
|---|---|
| Bắt đầu / kết thúc (UTC) | 08:42:06Z / 08:55:03Z (kill) |
| T5-wait | T5 đã có JSON lượt yên boot #52 (poll 1) — chạy ngay sau |
| Cờ cây | Chưa có `round117-tree` — md5 trực tiếp = `03bf029f` ✓ |
| Gate 0 | try 1 PASS (postboot exit 0, apt_procs 0, boot #52 12 phút tuổi) |
| Gate A lúc bắt đầu | poll 2 MỞ: load1 1,85 / load5 1,71, không lock, không blocker, RAM 1907 MB |
| Vite | :5186 (đổi từ 5184 của S6 để tránh đụng cổng luồng T khác), config tạm `watch.ignored: ["**/**"]` (0 watch), up sau 3 s |
| Probe | 20 pass, `--disable-rvfc`, flip sau pass 5; log tới pass 9 rồi kẹt (xem §2.1.1) |
| Kết thúc | **KILL probe (SIGTERM 08:55:03Z)** — không có JSON (probe chỉ ghi file lúc kết thúc; đúng tiền lệ R5: không dùng dữ liệu dở dang) |
| Dọn dẹp | vite kill pid 8568, ps sạch, curl :5186 = 000, lock nhả sạch (giữ 779 s) |

#### 2.1.1 Vì sao kill — renderer bò, lớp B đã hỏng

- **Renderer gần như đứng yên:** WebKitWebProcess (pid 8673) tích
  lũy 41 s CPU sau 8:14 wall (~8% 1 core), rồi chỉ +2 s CPU / 60 s
  wall (08:50–08:51Z) và +4 s / 150 s wall (08:51–08:54Z) — chữ
  ký giống stall R5 attempt2 (WebKit +1 s CPU / 1,5 phút) nhưng
  chưa đóng băng hẳn: ước tính ~50 s/pass lúc đầu, xấu dần tới
  ~2 phút/pass; 20 pass cần >20 phút nữa. Log probe (buffer qua
  tee) dừng ở pass 9 — không thấy pass mới trong ~4 phút.
- **Lớp B đã hỏng giữa lượt (ghi rõ, không dùng để bác H-D dù có
  xong):** RAM khả dụng rơi 1907 → 940–970 MB lúc 08:43–08:44Z
  (dưới ngưỡng 1024); một MiniBrowser khác + WebKitWebProcess mới
  mở trong cửa sổ (T9 `webkit_blob_flaky_117t9_2mib.mjs` + 1
  MiniBrowser nữa, pid 47337/47558, ~08:51Z); load1 lên 4,22 lúc
  08:54Z (T3 `ram-max.py` + hog `node -e while(true)` bắt đầu).
  Load-mid (20 s/lần): load1 0,49–2,93, load5 1,32–2,00 — CPU chưa
  phải nguyên nhân chính; RAM + cạnh tranh 3 WebKit trên 1 cell
  (1,5 CPU chia sẻ) là nguyên nhân bò.
- **Quyết định kill (08:55:03Z):** dữ liệu (nếu xong) cũng chỉ là
  lượt NHIỄM (không phân biệt được H-D — thứ T6 cần nhất), trong
  khi giữ lock + WebKit thêm 20+ phút sẽ chặn cửa yên của chính
  T6 và các luồng khác. Kill đúng tiền lệ R5 (probe_exit không có,
  không JSON, không dùng dữ liệu dở). Ghi rõ trong chain-t6.log.

### 2.2 Attempt2 (08:55–09:26Z, boot #52) — HOÃN gate A, exit 5

- T5-wait poll 1 (T5 đã có JSON); cờ cây: chưa có — md5 trực tiếp
  `03bf029f`; gate0 try 1 PASS (postboot 0, apt 0).
- Gate A 30 poll KHÔNG MỞ: poll 1 load1 9,90 / load5 4,02 (lock t1,
  blockers 15, RAM 1111 MB) → poll 2 load1 25,12 / load5 9,33
  (lock t2, blockers 13) → poll 11 load1 24,79 / load5 15,41 (lock
  t4-hold, blockers 14, RAM 1090 MB) → poll 19 load1 26,57 /
  load5 16,57 (lock t3-round117, RAM 634 MB) → poll 20 load1 16,76
  / load5 15,70 (lock t2, blockers 8, RAM 637 MB) → poll 30 load1
  7,14 / load5 21,83 (lock t3-round117, blockers 5, RAM 486 MB).
  Hog `node -e while(true)` tăng 12 → 20 → 56 → 76 trong lúc chờ
  (T3 dial điểm gãy >21,07). Thấp nhất trong 30 poll: load1 0,50
  nhưng load5 không dưới 4,02 lần nào; RAM kẹt 486–1144 MB.
- Exit 5 đúng luật (prereg §3: không chạy ở tải thấp nhất). Không
  giữ lock, không chạy vite/probe, không dữ liệu.

### 2.3 Attempt3 (09:27–09:47Z, boot #52) — CHẾT THEO REBOOT #53

- T5-wait poll 1; cờ cây: chưa có — md5 trực tiếp `03bf029f`;
  gate0 try 1 PASS (ghi trong postboot-t6-attempt3-gate0.log).
- Gate A: poll 2 (09:28:41Z) load1 48,43 / load5 25,82 (lock
  t3-round117, blockers 4, RAM 1062 MB); poll 11 (09:37:45Z)
  load1 53,48 / load5 30,74 (lock t3, blockers 5, RAM 682 MB);
  poll 20 (09:46:48Z) load1 64,31 / load5 35,43 (lock t3,
  blockers 5, RAM 681 MB). T3 chạy s80 (64 hog, dial [30,45],
  "lan 1/3") — tải cao nhất lượt này.
- **Reboot #53 (09:47:08Z) giết run-t6.sh giữa gate A** (giữa poll
  20 và poll 21) + restart runtime. CHƯA giữ lock, CHƯA chạy
  vite/probe, CHƯA có dữ liệu. Không có chain-log exit (process
  chết theo reboot — ghi rõ tại đây thay vì giả vờ có exit code).
  T3 s80 cũng chết theo reboot (driver log dừng 09:47:43Z,
  playhead 110,7).

### 2.4 Attempt4 — KHÔNG BAO GIỜ ĐƯỢC LAUNCH (replay #53 đình trệ)

- Kế hoạch (prereg §8, viết TRƯỚC): chờ replay xong (postboot
  exit 0 + apt_procs=0) rồi mới launch — vì gate0 trong driver
  chỉ thử 3 lần × 60 s, không đủ ngay sau reboot.
- **Replay KHÔNG BAO GIỜ xong trong lượt này:** postboot-check
  exit=1 ở 8 lần kiểm tay (09:49Z, 09:58Z, 10:08Z, 10:11Z,
  10:21Z, 10:32Z, 10:41Z — cùng danh sách thiếu: 5 lib
  libevent/libEGL/libavif/libdw/libevdev + thư mục GST không tồn
  tại + 11 package). `/var/log/dpkg.log` đóng băng ở 09:48:03
  (chỉ 2 dòng "startup packages configure" ngay sau boot); không
  process apt/dpkg nào được quan sát ở các lần kiểm (trừ blip
  apt_procs=1 lúc T5 kiểm 10:12–10:13Z — không cài gì, dpkg.log
  chứng minh). Khóa dpkg/apt mtime 09:48, không process nào giữ.
- **Đối chứng độc lập:** T5 attempt3 (10:12:42Z) cũng gate0 FAIL
  (postboot exit=1, apt_procs=1) → hoãn — chặn này ảnh hưởng mọi
  luồng probe, không riêng T6.
- **T6 KHÔNG chạy `--repair`:** (a) prereg §8 đã đăng ký CHỜ
  replay, không tự sửa; (b) replay/postboot là mảng của T8 — tự
  cài package sẽ làm nhiễu phép đo replay/headroom của T8; (c)
  luật lượt: bị chặn thì báo rõ và dừng, không lách. Quyết định
  này ghi rõ để parent quyết (cho phép repair ở đợt sau, hay chờ
  replay tự chạy).
- Lúc T6 kết thúc (10:42Z): máy đã yên trở lại (load1 0,36–2,98,
  RAM 1528–2296 MB, 0 hog, lock trống rồi T10 giữ để verify) —
  chỉ còn thiếu replay. Cửa yên có, nhưng không có GST để decode
  fixture mp4 nên probe không thể chạy (gate0 là chặn cứng, đúng
  thiết kế).

## 3. Tổng gộp — KHÔNG ĐỔI (không có seek mới)

| | Q5 | R6 | S6att1 | T6 | Gộp |
|---|---|---|---|---|---|
| Seek (snapshot label-0 phân biệt) | 20 | 20 | 19 | **0** | **60** |
| Stale (M≠0) | 1 | 0 | 4 | **0** | **5** |
| Tỉ lệ | 5,0% | 0,0% | 21,1% | — | **8,3%** |
| Điều kiện | nhiễm | yên | nhiễm | — | nhiễm 5/40 (12,5%) vs yên 0/20 (0%) |

- Fisher một phía (nhiễm vs yên) **p=0,1205** — tính lại bằng
  script riêng `fisher-t6.py` (xác thực: cho đúng 0,1205 với số
  S6; 0/40 vs 5/40 → 0,0274; 0/60 vs 5/40 → 0,0087 — khớp số
  parent tính tay đợt 116). CI 95% Clopper-Pearson: gộp 5/60
  [2,8%–18,4%]; nhiễm 5/40 [4,2%–26,8%]; yên 0/20 [0%–16,8%].
- Theo quy tắc prereg §4: không nhánh nào kích hoạt (không có lượt
  yên mới, không có stale mới). Verdict đúng prereg: **H-D (seek)
  CHƯA phân biệt được; mục tiêu ≥80 seek vẫn mở (60/80); nợ lượt
  yên thứ hai dời nguyên vẹn sang đợt sau.**
- P(0/20 | tỉ lệ nền thật 5%) ≈ 36% (như R6) — nhắc lại để khỏi
  đọc 0/20 lượt yên cũ thành "đã hết stale".

## 4. Đánh giá lại 4 giả thuyết (không có dữ liệu mới — verdict giữ nguyên từ S6)

| Giả thuyết | Verdict sau lượt này | Căn cứ |
|---|---|---|
| **H-A** — Seek reset label nhưng pixels ghost sót từ pass trước | **Không đổi: được ủng hộ mạnh về bản chất; mô hình delta CHƯA CHỐT** | Không có quan sát mới (0 seek mới). M = frame decoder yield lúc capture (S6 §4.2) vẫn là diễn giải dẫn đầu, chưa chứng minh. |
| **H-B** — Liên quan fix E4 steady-close | **Không đổi: BỊ YẾU thêm (không còn ưu tiên)** | Không có occ mới. |
| **H-C** — Seek chưa vẽ lại ghost | **Không đổi: dạng seek BỊ YẾU** | Không có snapshot mới. |
| **H-D** — Sự kiện đơn lẻ do lượt nhiễm tải (cho SEEK) | **Không đổi: CHƯA phân biệt được; KHÔNG còn là "đơn lẻ"** | 5 quan sát trên 2 lượt nhiễm độc lập (Q5 ×1, S6att1 ×4); thiếu lượt yên thứ hai để phân biệt (cần 0/20 yên nữa → p≈0,03). |

**Ưu tiên sửa:** giữ CAO (như S6) — event seek stale đã tái hiện
5 lần, không còn là quan sát đơn lẻ; hướng sửa ứng viên không đổi
(gán nhãn snapshot theo frame thực sự được yield, hoặc loại/đánh
dấu snapshot khi frame yield lệch `currentTime` quá ngưỡng).

## 5. (B) Event kiểu P4 — KHÔNG CÓ DỮ LIỆU MỚI

- Không lượt probe nào hoàn thành → 0 occurrence lag ≥+5f được đo
  trong đợt này (cả dạng seek lẫn dạng P4).
- Tally P4-type giữ nguyên sau 4 lượt: P4 1 lần + Q5 0 + R6 2 rõ +
  1 nhỏ + S6att1 0. Không cộng, không trừ.
- Event P4 frame-26 + Q5 seq 282–285: T6 KHÔNG tái hiện được (không
  có lượt đo) và cũng KHÔNG bác được — ghi đúng "không có dữ liệu
  mới", không đọc thành bằng chứng theo hướng nào.

## 6. Xác thực pipeline (không có dữ liệu mới, vẫn kiểm chứng được)

- **Analyzer tái hiện đúng S6:** chạy `analyze-t6-ghostseek.py`
  (copy S6, md5 `5ecfe429…`) trên JSON S6 attempt1 → **19 snapshot
  label-0, 4 STALE (21,1%), M=70/61/76/68, pass 2/7/14/16, đúng
  từng tBlend/occ/skp** như LIMITS S6 §3 (log
  `ghostseek-s6-recheck.txt`; analyzer còn ghi side-effect
  `ghostseek-detail.txt` cùng nội dung). Pipeline đo sẵn sàng —
  chỉ thiếu cửa sổ đo.
- **Fisher/CI tự tính:** `fisher-t6.py` cho đúng p=0,1205 với số
  S6 (khớp parent tính tay) và CI khớp S6 (5/60: 2,8%–18,4%).
- **Fixture:** mp4 md5 `2e00e91c…` khớp M5; probe md5 `a690d828…`
  khớp S6; b.json md5 `078938cf…` khớp S6.

## 7. Kiểm chứng hồi quy (cây đo `03bf029f…`)

- `tsc` apps/web (`npx --no-install tsc --noEmit`): **exit 0**
  (log `tsc-t6.log`, chạy 10:10Z — SAU attempt1/2/3, TRƯỚC khi
  viết LIMITS; cây không đổi trong lúc đo).
- `ghostBlend.probe.test.ts`: **15/15 PASS** (log
  `ghostblend-t6.log`, chạy 10:11Z bằng
  `node --experimental-strip-types --test` từ
  `apps/web/src/lib/`; exit 0). Lưu ý: lần chạy đầu exit=1 vì T6
  gõ sai thư mục (chạy từ `apps/web/` nên không thấy file test) —
  KHÔNG phải hồi quy hỏng; chạy lại đúng thư mục thì 15/15 PASS.
  Ghi rõ để khỏi hiểu lầm.
- `vite build`: KHÔNG chạy lại — cây `03bf029f…` đã build PASS ở
  N1 đợt 112 + R10 gộp muộn đợt 115 + suite 27/27 đợt 116 S10;
  T6 không sửa production (md5 không đổi); ghi rõ.
- preview.tsx md5 `03bf029f…` không đổi trong suốt lượt đo +
  hồi quy. Không sửa file production nào.

## 8. Sự cố hạ tầng trong lúc đo (đã xử lý / đã báo, không mất dữ liệu đo nào vì chưa có lượt nào xong)

1. **Attempt1 renderer bò** (~2 s CPU/phút, ~2 phút/pass, 3 WebKit
   cùng cell) — kill đúng luật, không JSON, không dùng dữ liệu dở
   (§2.1.1). Bài học: lượt đo sau reboot + nhiều luồng cùng mở
   WebKit sẽ bò; gate A nên kiểm thêm "số WebKit đang chạy" (đề
   xuất cho đợt sau, không tự đổi luật).
2. **T3 hog điểm gãy** (12 → 76 hog, load1 tới 64,31) chặn gate A
   attempt2/3 suốt ~30 phút — T6 không chen, không can thiệp;
   hog là công việc hợp lệ của T3 theo prereg của họ.
3. **Reboot #53 (09:47:08Z)** giết attempt3 trong gate A + restart
   runtime; T3 s80 cũng chết theo (playhead dừng 110,7). Không
   mất dữ liệu đo (chưa có lượt nào xong).
4. **Replay sau #53 đình trệ 55 phút, 0 hoạt động** (§2.4) — phát
   hiện hạ tầng mới, khác hẳn #49 (~25 phút, tiến triển dần).
   T5 attempt3 xác nhận độc lập gate0 FAIL. T6 không chạy
   `--repair` (lý do §2.4). RAM ngoài cell kẹt 400–1017 MB trong
   phần lớn lượt (mẫu S6 attempt4/5 lặp lại), rồi hồi lên 1528–
   2296 MB cuối lượt khi hog dừng.
5. **T2 đổi cây rồi revert** (`03bf029f` → `af4d5753` → `03bf029f`,
   cờ NO-CHANGE 10:05Z): T6 đo/kiểm trên cây Q5/R6/S6, so được
   trực tiếp. Fix H3e giữ dạng patch (T2), không vào cây đo.
6. **Không có vite mồ côi của T6.** Attempt1: lock acquire 1 lần,
   nhả sạch; kill-vite pid node chết, ps sạch, curl :5186 = 000.
   Attempt2/3 không giữ lock lần nào. Cuối lượt lock do T10 giữ
   (verify gộp) — không phải của T6.

## 9. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND117_T6_GHOSTSEEK_LIMITS.md` — file này. **File
  duy nhất trong repo mà T6 thay đổi** (probe/analyzer/run-script/
  prereg/dữ liệu đều ở hidden_files; probe + analyzer là copy S6
  đã stage ở đợt 115/116 nên KHÔNG stage lại; mp4 fixture là
  binary local-only đã có từ M5, KHÔNG stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round117-t6-ghostseek.txt`
  (NUL-delimited, đã đọc lại xác nhận; 1 entry: LIMITS).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round117-t6/`
  (prereg-t6.md [kèm bổ sung §8], probe117t6-ghost-k7.webkit.mjs
  [copy S6, md5 `a690d828…`], analyze-t6-ghostseek.py [copy S6,
  md5 `5ecfe429…`], analyze-t6-lag5.py [copy S6], fisher-t6.py
  [mới, T6 viết — tính Fisher + CI, đã xác thực trên số S6],
  b.json [md5 `078938cf…`], vite.t6-temp.config.mjs,
  run-t6.sh [adapt từ run-s6.sh: cổng 5186, T5-wait, GATE_A_POLLS
  mặc định 30, blockers thêm probe117t], ghostseek-s6-recheck.txt
  + ghostseek-detail.txt [xác thực analyzer trên JSON S6],
  poll-t6.log, chain-t6.log, postboot-t6-attempt{1,2,3}-gate0.log,
  run-t6-attempt{1,2,3}.nohup.log, run-webkit-t6-attempt1.log
  [dở dang tới pass 9 — KHÔNG dùng làm dữ liệu],
  vite-5186-t6-attempt1.log, load-mid-t6-attempt1.log,
  ps-before/after-t6-attempt1.txt, tsc-t6.log, ghostblend-t6.log).
- Cờ xong: `hidden_files/round117-t6.done` (tạo SAU KHI LIMITS +
  batch xong).

## 10. Nợ mở + đề xuất cho đợt sau

1. **Tổng seek vẫn 60/80 (Q5 20 + R6 20 + S6att1 20), stale 5/60.**
   Cần thêm ≥20 seek trên LƯỢT YÊN SẠCH để phân biệt H-D (seek):
   nếu yên 0/20 nữa (gộp yên 0/40 vs nhiễm 5/40, Fisher p≈0,027)
   → H-D được ủng hộ có ý nghĩa; nếu yên mà stale ≥1 → H-D (seek)
   BỊ BÁC. Đây vẫn là nợ #1 — ưu tiên cao nhất của hướng này.
2. **Replay sau reboot đình trệ (mới):** #53 55 phút 0 hoạt động
   (dpkg.log đóng băng 09:48:03, không apt process) — parent/T8
   quyết: (a) cho phép luồng probe chạy postboot `--repair` khi
   replay đình trệ quá N phút (N do parent định, sửa prereg trước
   khi đo); (b) tìm nguyên nhân replay không chạy (cơ chế trigger
   là gì?); (c) chấp nhận chờ. T6 đã chọn (c) trong lượt này theo
   prereg của mình.
3. **Gate A nên kiểm thêm số WebKit đang chạy:** attempt1 bò vì 3
   WebKit cùng cell dù load1/load5/RAM lúc mở cửa đều đạt. Đề xuất
   (không tự đổi): blockers đếm cả MiniBrowser/WebKitWebProcess
   của luồng khác — hoặc ghi rõ "WebKit khác đang chạy" làm
   caveat lớp B.
4. **Đo yield-frame trực tiếp (nợ cũ S6 §10.2):** M là frame nào lúc
   capture (decoder yield vs currentTime)? Cần mốc đo trong
   `rvfcCaptureFrame` / `updateMotionBlurSnapshots` — vẫn mở.
5. **Event kiểu P4:** tally giữ nguyên (3 rõ + 1 nhỏ / 4 lượt).
   Theo dõi tiếp; nếu P4 tái hiện thêm thì cơ chế tổng quát đủ 4
   lần độc lập.
6. **H-B (E4):** tụt hẳn ưu tiên; chỉ quay lại nếu có bằng chứng mới
   gắn divergence với steady-close/skip. **G1 + mù chờ user quyết,
   ci-security.yml vẫn 403 chờ user, birefnet 0 lần, TTS 39 CẤM
   kiểm lại, release gate không đổi.**

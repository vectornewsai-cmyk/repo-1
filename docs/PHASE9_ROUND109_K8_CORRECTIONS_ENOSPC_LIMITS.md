# Đợt 109 K8 — Đính chính LIMITS gộp đợt 108 (J9) + điều tra ENOSPC inotify

Ngày: 14/11/2026 (lượt cron 06:35 +07; làm việc 23:40–23:55Z 13/11). Máy đo: VM này
(1,5 CPU / 8 GB RAM; boot #36 `ab33c58f…` từ 22:53:56Z, chưa có reboot #37 tới lúc
làm xong). **KHÔNG sửa production, KHÔNG push, KHÔNG release/tag.** Chỉ thêm 2 file
docs (addendum đợt 108 + LIMITS này). Mọi số do K8 đo/tính lại từ dữ liệu thô bằng
script viết mới (`hidden_files/round109-k8/`), không dùng lại analyzer của luồng đo.

## 1. Kết luận ngắn

### (a) Đính chính — 7 điểm, K8 xác nhận độc lập 7/7, verdict các luồng KHÔNG đổi

LIMITS gộp đợt 108 (`docs/PHASE9_ROUND108_LIMITS.md`) sai 3 điểm về J7 (số trước đợt /
stale do viết trước late merge của J7) và 1 điểm về J3 (§4 mục 5 ghi "14 gap CDP").
Chi tiết + bằng chứng từng dòng: `docs/PHASE9_ROUND108_LIMITS_ADDENDUM_J9.md`
(file đính chính riêng; LIMITS gộp gốc giữ nguyên, không sửa tại chỗ).

| # | Điểm sai trong LIMITS gộp | Số đúng (K8 xác nhận) |
|---|---|---|
| 1 | "run22–23 không chạy", "0 lần E1 hoàn thành mới" (§1 J7, §2) | run22 lần 2 **chạy xong 10/10, G4 PASS, report 23:01:06Z**; chỉ run22 lần 1 + run23 không chạy |
| 2 | "chặt-chỉ-report 2/34 = 5,9%" (§1 J7, §4.9) | 2/34 là lịch sử TRƯỚC đợt; sau đợt chặt-chỉ-report **2/35 = 5,7%** [1,6%, 18,6%]; tính cả run21 **2/36 = 5,6%** [1,5%, 18,1%] |
| 3 | "Keydown gộp 55/737/1474" (§1 J7, §4.9) | Sau đợt **56 lần / 748 slot / 1496 toggle, max 2197 ms** (run22: 11 slot / 22 toggle / max 291 ms) |
| 4 | "đã đủ 14 gap CDP" (§4.5) | CDP đúng **12 gap (R0 7, R1 5)** — trừ 2 gap sentinel e4skip=-1 (R0 cặp idx 24→25, R1 cặp idx 6→7) |
| 5 | "0 trusted" (J3 gốc; LIMITS gộp §2 đã sửa, §4 không nhắc) | trusted-ĐC **22/33 (R0 9/13, R1 12/19, R2 1/1)**; distinct_strict ≥ 2 = 0 vẫn đúng → caveat "dạng yếu" vẫn đứng |
| 6 | "worker thấy cùng freeze 4990 ms" (đọc như trong lúc phát) | 4990 ms THẬT nhưng **pre-play** (relPlay [-292, +4698]); freeze lớn nhất trong lúc phát R1 là **1774 ms** |
| 7 | (hệ quả của 1) bar E1 | Bar ≥7 lần tải nặng **vẫn CHƯA ĐẠT (6/7)** — run22 lần 2 tải thấp, không tính vào bar. Verdict không đổi |

Recount của J9 khớp 100% với tính lại của K8 trên cả 6 nhóm số đã kiểm (J7: run22,
keydown, flake; J3: CDP, trusted-ĐC, 4990 ms, top-diff 2408/3304/653/113 ms).

### (b) ENOSPC — KẾT LUẬN MỚI: không phải race khởi động, là trần hệ thống đã cạn do watch ngoài cell

- **Trần không tăng được từ trong VM:** `fs.inotify.max_user_watches = 63756`
  (đầu đợt 109; J9 đo 63756 sau reboot #36, trước đó 63747). Thử
  `sysctl -w fs.inotify.max_user_watches=131072` với quyền root: bị từ chối —
  `sysctl: setting key "fs.inotify.max_user_watches", ignoring: Read-only file system`,
  giá trị vẫn 63756. **/proc/sys chỉ đọc trong cell này — mọi cách "tăng trần" từ
  trong VM đều bị chặn ở cấp host; đây là blocker ngoài tầm luồng, không lách.**
- **Headroom thật chỉ ~2.538 watch (đo trực tiếp 2 lần: 2539 rồi 2537):** thêm watch
  từng cái bằng `inotify_add_watch` cho tới ENOSPC, trong khi cell chỉ thấy 14 watch
  đang dùng. Suy ra ~61.218 watch (≈ 63756 − 2538) đang bị giữ BỞI CÁC TIẾN TRÌNH
  NGOÀI CELL (host / cell khác cùng uid 0) mà `/proc` trong cell không thấy được.
  Đây là lần đầu headroom được đo trực tiếp — mọi lần trước chỉ đếm watch trong cell.
- **1 vite = 1.578 watch; 2 vite = 3.156 > headroom 2.538 → vite thứ hai CHẾT CHẮC
  (không phải race):** vite :5599 lên xong giữ 1.578 watch; vite :5600 lên xong
  ("ready in 278 ms") rồi crash `ENOSPC ... watch '.../src/store.nestedGuard.test.ts'`
  giữa lúc đăng ký watch. Không phải "ai khởi động trước thì thắng" theo nghĩa thời
  gian — mà là vite đầu chiếm 62% headroom, vite sau cần thêm 1.578 nhưng chỉ còn
  ~960 → chết giữa chừng, ở file nào thì tùy thứ tự đăng ký. Chạy cách nhau bao lâu
  cũng vậy, miễn vite đầu còn giữ watch.
- **Giải thích dứt điểm 2 bí ẩn cũ:** (i) J5 "đếm được chỉ ~1600 watch mà vẫn ENOSPC" —
  vì 1600 đó là 1 vite trong cell; ~61k watch còn lại nằm ngoài cell, không đếm được
  bằng `/proc`. (ii) J7 run18–20 chết cả 3 lần trong khi J3 sống — J3 lên trước, chiếm
  headroom; J7 lên sau thì hết. Không có yếu tố may rủi thời gian đáng kể.
- **Đề xuất cho đợt sau (xem §3):** xếp vite nối tiếp là BẮT BUỘC (không phải khuyến
  nghị mềm) cho tới khi headroom đổi; giảm watch/vite bằng `server.watch.ignored`
  là hướng duy nhất trong tầm tay; tăng trần cần can thiệp host (ngoài VM).

## 2. Phần (a) — tóm tắt kiểm chứng (chi tiết ở file addendum)

- **Run22 lần 2:** report `pass=10/10`, 11 slot, mtime 23:01:06.877Z; log G4 PASS
  22:59:40.063Z (R=0,51, tap=true), dòng cuối 23:01:06.878Z "10/10 pass". Run22 lần 1
  chết do reboot #36 trong lúc chờ tải (driver 22:53:04Z → reboot 22:53:56Z), E1 chưa
  chạy. Run23: không có thư mục `e1-run23/` — chưa chạy.
- **Flake:** lịch sử I6 2/34 (dòng 18 + 157 LIMITS I6); run22 0/1 có report; run21 G4
  PASS trong log 21:42:45Z, không có file report trong `e1-run21/`. Wilson tính lại:
  2/35 [1,6%, 18,6%], 2/36 [1,5%, 18,1%], 2/34 [1,6%, 19,1%] — khớp LIMITS J7 §4.1.
- **Keydown:** report run22: playWait max 291 ms, pauseWait max 63 ms, 11 slot → 22
  toggle. 55+1/737+11/1474+22 = 56/748/1496.
- **CDP J3:** sentinel e4skip=-1 ở R0 idx 0–24 (hợp lệ đầu = 1 tại idx 25) và R1 idx
  0–6 (hợp lệ đầu = 1 tại idx 7). Đếm lại rule bar CDP: thô 8/6/0/0 = 14; trừ 2 gap
  sentinel (R0 317 ms cặp 24→25; R1 385 ms cặp 6→7) = 7/5/0/0 = 12.
- **Trusted-ĐC:** đếm lại 292 dòng draws-gap trong 4 file analysis: bar 33, trusted-ĐC
  (n_inside ≥ 2) 22 = R0 9 + R1 12 + R2 1 + R3 0; trusted-old (bracket ≤300 ms) = 0;
  distinct_strict = 1 ở mọi gap bar.
- **4990 ms:** workerTicks R1 (`playT0rel=121799`): r-gap max 4990 ms, w-gap 12 ms,
  relPlay [-292, 4698] — bắt đầu trước lúc phát. In-play max 1774 ms. Top-diff:
  R0 2408, R1 3304, R2 653, R3 113 ms — bar ±50 ms không đạt lượt nào.
- Chạy lại: `python3 hidden_files/round109-k8/k8-recount-j7.py`,
  `python3 hidden_files/round109-k8/k8-recount-j3-full.py` (kèm output `.txt`).

## 3. Phần (b) — điều tra ENOSPC (đo mới trong đợt này, không sửa production)

### 3.1 Hiện trạng hệ thống (23:44–23:48Z 13/11, boot #36)

| Hạng mục | Giá trị | Nguồn |
|---|---|---|
| `max_user_watches` | **63756** | `cat /proc/sys/fs/inotify/max_user_watches` (đầu đợt 109; J9: 63756 sau reboot #36, 63747 trước đó) |
| `max_user_instances` | 128 | `/proc/sys/fs/inotify/max_user_instances` — không phải nút thắt (vite dùng 1–2 instance) |
| `max_queued_events` | 16384 | `/proc/sys/fs/inotify/max_queued_events` |
| Watch đang dùng TRONG cell | **14** (chỉ systemd pid 1, 5 inotify fd) | đếm dòng `inotify wd:` trong `/proc/*/fdinfo/*` |
| Watch vite giữ (1 vite apps/web) | **1578** | đo trực tiếp §3.3 |
| Headroom đo được | **~2538** (2539 rồi 2537, 2 lần cách nhau ~1 phút) | probe `inotify_add_watch` tới ENOSPC, §3.2 |
| Watch ngoài cell (suy ra) | **~61.218** (= 63756 − 2538) | trần trừ headroom trừ watch trong cell |

- **Trần thay đổi theo boot:** 63747 (trước reboot #36) → 63756 (sau) — chênh 9 watch.
  Nhiều khả năng trần được tính từ RAM host lúc boot (kernel default theo bộ nhớ),
  không phải số cấu hình cố định. Chưa chứng minh cơ chế — chỉ ghi hiện tượng.
- **Thử tăng trần:** `sysctl -w fs.inotify.max_user_watches=131072` chạy với uid root
  vẫn bị từ chối: `ignoring: Read-only file system`, giá trị đọc lại vẫn 63756
  (sysctl in ra giá trị yêu cầu nhưng không áp dụng — exit code 0 gây hiểu lầm, phải
  đọc lại mới biết). **Kết luận: không tăng được trần từ trong VM. Blocker cấp host.**

### 3.2 Đo headroom trực tiếp (thí nghiệm quyết định)

- Phương pháp (`k8-headroom.py`): `inotify_init1`, tạo file tạm trong
  `/tmp/k8-watch-probe/`, `inotify_add_watch` từng file cho tới khi trả về errno 28
  (ENOSPC); đếm số watch thêm được; đóng fd (giải phóng toàn bộ watch) + xóa file tạm.
- Kết quả lần 1 (23:47Z): **thêm được 2539 watch rồi ENOSPC tại i=2539**.
  Lần 2 (23:48Z): **2537 watch**. Ổn định trong ~2 watch — headroom không dao động
  mạnh theo phút.
- Lúc đo, cell chỉ có 14 watch đang dùng → headroom 2538 ≈ trần 63756 trừ ~61.218
  watch do tiến trình ngoài cell giữ (cùng uid 0, kernel tính theo uid toàn hệ thống,
  nhưng PID namespace của cell không thấy được các tiến trình đó). Đây là suy luận
  duy nhất khớp cả 3 số: trần 63756, cell thấy 14, thêm được 2538.
- Dọn dẹp: sau probe, đếm lại wd trong cell = 14, thư mục tạm đã xóa — không để lại
  watch/file rác.

### 3.3 Thí nghiệm 1 vite vs 2 vite chồng nhau (tái hiện ENOSPC có kiểm soát)

- Thiết lập (`k8-enospc-vite.sh`, log `k8-enospc-vite.log`): máy đang yên (không vite/
  node/chromium nào chạy, 14 watch); vite 1 trên :5599, vite 2 trên :5600 (cổng riêng,
  tránh :5590 của J3 và :5580 của J7); đo watch sau mỗi bước; kill cả hai sau thí nghiệm.
- Kết quả:
  - T0 (chưa vite): tổng 14 watch.
  - T1 (1 vite :5599, ready 394 ms): tổng **1592**, vite giữ **1578** (node pid 14600).
  - T2 (thêm vite :5600): vite 2 in "ready in 278 ms" rồi **crash ENOSPC**
    (`Error: ENOSPC: System limit for number of file watchers reached, watch
    '.../apps/web/src/store.nestedGuard.test.ts'`, `node:internal/fs/watchers:323`,
    errno -28) giữa lúc chokidar đăng ký watch. Tổng đo sau crash vẫn 1592 (vite 2
    đã chết, watch của nó được giải phóng).
  - T3 (sau kill): tổng về 14; 0 tiến trình vite còn lại trên :5599/:5600 — dọn sạch.
- Đối chiếu số học: headroom ~2538 − vite1 1578 = ~960 còn lại; vite 2 cần ~1578 →
  thiếu ~618 → chết giữa chừng. File chết (`store.nestedGuard.test.ts`) chỉ là điểm
  đăng ký chạm trần lúc đó, không phải file đặc biệt — cùng mẫu "mỗi lần một file khác"
  như J7 run18–20 (`nestUtils.ts`, `ttsEstimate48D1.test.ts`, `reversePlaybackRound39T6.test.ts`).
- **Kết luận về giả thuyết race:** BỊ BÁC ở dạng "2 vite khởi động cùng lúc thì đua nhau".
  Vite 2 được bật SAU vite 1 đã ổn định 7 giây mà vẫn chết — không cần "cùng lúc".
  Cơ chế đúng là **cạn headroom một cách tất định**: 1 vite đã chiếm 62% headroom còn
  lại; vite thứ hai không bao giờ đủ chỗ khi vite đầu còn sống. Thứ tự khởi động chỉ
  quyết định AI sống AI chết (vite trước sống), không quyết định CÓ chết hay không.
  Headroom có thể dao động theo giờ (do cell khác), nên đôi lúc 2 vite cùng sống được
  nếu headroom lúc đó > ~3156 — nhưng với headroom ~2538 như lúc đo thì 2 vite là
  không thể.

### 3.4 Giải thích 2 bí ẩn cũ

1. **J5 "đếm được chỉ ~1600 watch mà vẫn ENOSPC": ĐÃ GIẢI THÍCH.** 1600 ≈ đúng 1 vite
   (K8 đo 1578). Cách đếm của J5 (đếm trong cell) là đúng cho phạm vi cell — nhưng
   trần tính trên toàn bộ watch của uid 0 trên host, trong đó ~61k nằm ngoài cell.
   Đếm trong cell không bao giờ giải thích được ENOSPC; phải đo headroom trực tiếp
   như §3.2.
2. **J7 run18–20 chết cả 3 lần, J3 sống: ĐÃ GIẢI THÍCH.** J3 bật vite :5590 lúc
   21:17:12Z, chiếm headroom trước; J7 bật sau (21:18:15Z) thì headroom còn lại < 1578
   → ENOSPC cả 3 lần. Không phải J7 xui hay race theo mili-giây — là thứ tự chiếm
   headroom đã cạn.

### 3.5 Đề xuất cụ thể cho đợt sau (theo thứ tự hiệu quả)

1. **Xếp vite nối tiếp — BẮT BUỘC, không phải khuyến nghị mềm.** Trong một lượt cron,
   tại mỗi thời điểm chỉ 1 vite dev được sống. Luồng đo (E1, zombie, ghost, blur...)
   chờ cờ done của luồng vite còn lại trước khi bật vite của mình — như J7 đã làm ở
   resume (chờ cờ `round108-j3-done`), nhưng phải áp dụng cho MỌI luồng, và cờ done
   phải được tạo ngay khi LIMITS+batch xong (J3 quên tạo cờ là lỗi phối hợp đã ghi).
   Cổng kiểm tra watcher tiền-chạy (J7 retry/resume driver) giữ lại, nhưng đổi ngưỡng:
   kiểm tra **headroom còn lại** (chạy probe §3.2, rẻ ~2 s) thay vì chỉ đếm watch trong
   cell — đếm trong cell không có ý nghĩa khi ~61k watch nằm ngoài cell.
2. **Giảm watch/vite (hướng duy nhất trong tầm tay nếu vẫn cần 2 vite):** thử
   `server.watch.ignored` trong `vite.config.ts` để loại các cây test/docs khỏi watcher
   (apps/web có hàng trăm file `*.test.ts` — riêng số này đã là phần lớn trong 1578
   watch). Chưa thử trong K8 (ngoài phạm vi: K8 không sửa production/config). Cần một
   luồng riêng đo: watch còn bao nhiêu sau khi ignore, vite dev còn hot-reload đủ
   không, và có phá harness nào không. Mục tiêu: 1 vite < ~1200 watch thì 2 vite mới
   vừa headroom ~2538 — vẫn mong manh vì headroom dao động theo cell khác.
3. **Tăng trần max_user_watches: CẦN CAN THIỆP HOST, ngoài VM.** `sysctl -w` bị chặn
   (read-only /proc/sys) ngay cả với root. Không có đường lách từ trong cell (không thử
   cách khác — theo luật cứng, bị chặn thì dừng và báo). Lựa chọn: (a) user/host admin
   tăng `fs.inotify.max_user_watches` ở cấp host (vd 524288 như chuẩn dev desktop) —
   cần user quyết; (b) tách uid cho cell này khỏi uid 0 dùng chung (nếu host dùng chung
   uid 0 cho nhiều cell) — cũng cần host admin. Tới khi đó, (1) là cách sống chung duy
   nhất.
4. **Không dùng nữa:** đếm watch trong cell (`/proc/*/fdinfo`) để kết luận về ENOSPC —
   đã chứng minh là gây hiểu lầm (14 thấy được vs 61k ẩn). Thay bằng probe headroom
   §3.2 trước mỗi lượt vite nặng.

## 4. Giới hạn của chính K8 (đọc trước khi trích số)

1. Headroom ~2538 đo lúc 23:47–23:48Z (boot #36, máy yên). Headroom dao động theo
   watch của cell khác/host — số này là ảnh chụp thời điểm, không phải hằng số.
   Suy ra "~61.218 watch ngoài cell" giả định trần 63756 được thực thi đúng như
   `/proc/sys` báo — chưa có cách độc lập nào trong cell để kiểm chứng trần thực thi.
2. Vite 1578 watch là cho `apps/web` (vite dev mặc định). Vite ở thư mục khác / với
   config khác có thể giữ số watch khác — chưa đo.
3. Thí nghiệm 2 vite dùng cổng :5599/:5600, cách nhau 7 giây — không phải khởi động
   cùng mili-giây. Kết luận "không phải race" dựa trên việc vite sau chết dù vite
   trước đã ổn định — logic này đứng độc lập với độ đồng thời.
4. Cơ chế trần 63747→63756 đổi theo boot (nghi do RAM host lúc boot) chưa chứng minh —
   chỉ ghi hiện tượng.
5. K8 không kiểm lại nội dung LIMITS gộp ngoài 7 điểm trên (J1/J2/J4/J5/J6/J8 đã có J9
   xác nhận 100% — K8 không đếm lại; tin J9 ở các điểm đó).
6. ENOSPC lần này tái hiện có kiểm soát trên cổng riêng, lúc máy yên, không phá luồng
   đo khác (không vite nào khác đang chạy lúc thí nghiệm; K6 chỉ chạy `find` quét file).
   Dọn sạch: 0 vite sót, watch về 14, file tạm đã xóa.

## 5. Nợ mở sang đợt 109 (từ K8)

- **ENOSPC: nguyên nhân ĐÃ RÕ (trần cạn do watch ngoài cell + 1 vite 1578 watch),
  cách sửa trong tầm tay là xếp vite nối tiếp + giảm watch/vite; tăng trần cần host.**
  Đợt sau áp dụng §3.5 mục 1 ngay; mục 2 giao một luồng riêng đo `server.watch.ignored`.
- **LIMITS gộp đợt 108:** 7 điểm sai đã đính chính ở file addendum riêng — parent gộp
  đợt 109 trích số J7/J3 thì dùng số trong addendum, không dùng số cũ trong LIMITS gộp.
- **Bar E1 ≥7 lần tải nặng vẫn 6/7** (run22 lần 2 tải thấp không tính); đợt sau chạy tiếp
  E1 và CHỈ tính lần đạt dial trong cửa sổ G3→G4.
- Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 108 §4: G1 + mù #22 chờ user quyết;
  re-arm A/B 4+4; queue2 điều kiện cần của bogus; B-band c2 thiếu 7 B-cap; E6 cần 2 sự
  kiện; EPERM probe #28 + mù #27; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403.

## 6. File đã đổi/thêm (stage, không push) + cách chạy lại

- `docs/PHASE9_ROUND108_LIMITS_ADDENDUM_J9.md` (mới — đính chính đợt 108).
- `docs/PHASE9_ROUND109_K8_CORRECTIONS_ENOSPC_LIMITS.md` (file này — mới).
- Dữ liệu kiểm chứng: `hidden_files/round109-k8/` (`k8-recount-j7.py/.txt`,
  `k8-recount-j3.py`, `k8-recount-j3-full.py/.txt`, `k8-recount-j3-cdp.txt`,
  `k8-recount-j3-trusted.txt`, `k8-recount-j3-freeze4990.txt`, `k8-recount-j3-topdiff.txt`,
  `k8-headroom.py`, `k8-headroom.log`, `k8-headroom-2.log`, `k8-enospc-vite.sh`,
  `k8-enospc-vite.log`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round109-k8-corrections.txt`
  (NUL-delimited, 2 entry: addendum + LIMITS này).

```bash
# Chạy lại recount J7/J3 từ đĩa:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-recount-j7.py
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-recount-j3-full.py
# Đo lại headroom inotify (rẻ, ~2 s; tự dọn sạch):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

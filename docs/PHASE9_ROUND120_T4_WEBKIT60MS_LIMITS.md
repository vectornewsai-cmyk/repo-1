# PHASE9_ROUND120_T4_WEBKIT60MS_LIMITS — F6' WebKit ≤60 ms: 1 lượt DỞ DANG trên boot #61 (0 lượt yên hợp lệ — B5 vi phạm + probe kẹt sau pass 17)

> Luồng T4, đợt 120, lượt cron 12:35 +07 16/11/2026 (bắt đầu ~05:36Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> Nợ đợt 119 (LIMITS T4 đợt 119 §8.1): 0 lượt yên đợt 119 (2 reboot +
> replay không cài GST) — nợ lượt yên theo dõi CHUYỂN TIẾP sang đợt 120.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không
> đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO (0/1 lượt yên). Ngưỡng
> ≤60 ms GIỮ NGUYÊN theo trạng thái đợt 118 (attempt8 median 40,0 ms,
> lớp B 5/5). Nợ lượt yên theo dõi CHUYỂN TIẾP sang đợt 121.**
> 1. **Boot #60 (0260101b, 04:45:49Z): gate 0 KHÔNG BAO GIỜ ĐẠT (30
>     poll, postboot FAIL 30/30).** Replay chế độ lỗi MỚI "chạm mà
>     không cài": dpkg.log chỉ 2 dòng `startup packages configure`
>     lúc 05:35:40Z (boot +49'51"), im 119+ phút, 0 apt/dpkg chạy,
>     0/11 package, thư mục GST không tồn tại. T7 watcher 60/60 poll
>     cũng FAIL, T7 DONE 06:46Z.
> 2. **Reboot 06:50:58Z sang boot #61 (80a940d7): replay CHẠY và NHANH
>     — bracket (0'40", 5'41"], 1509 dòng, đúng bằng #52/#54/#57.
>     Gate 0 ĐẠT ở poll #2 (06:57:14Z, postboot PASS đầy đủ).**
> 3. **Attempt1 trên boot #61: gate A MỞ NGAY poll 1** (load1 0,41 /
>     load5 0,85 / RAM 1142 MB / lock trống / blockers 0 / cây
>     5be5a250). Probe chạy 17/20 pass rồi KẸT sau pass 17 (>5 phút
>     không tiến, vượt timeout 120 s/pass mà không thoát). T4 kill
>     probe (SIGTERM ~07:05:44Z) → probe thoát 2 (target-closed).
> 4. **Lớp B VI PHẠM (B5): RAM avail rơi đều 1012→440 MB trong lượt
>     (23/23 mẫu <1024 MB; 3 mẫu <500 MB, min 440 MB).** B1/B3/B4
>     ĐẠT; B2 có dấu hiệu (probe T3 bắt đầu giữa cửa sổ — xem §5).
>     Lượt này KHÔNG phải lượt yên hợp lệ.
> 5. **Số đo DỞ DANG (16 pass, tickCost n=512): median 40,0 ms,
>     p90 69,0 ms, max 104, min 24; hậu flip+2000ms median 41,0 ms
>     (n=337); wallbands phẳng 39–41 ms. KHÔNG dùng để chốt/mở lại
>     ngưỡng** (lượt không hoàn chỉnh + lớp B vi phạm — đúng prereg
>     §1). (b)/F6'/lag5: KHÔNG CÓ DỮ LIỆU (blendTick rỗng trong file
>     partial — xem §4).
> 6. **Phát hiện kỹ thuật (mới): probe kẹt ở `writePartial` — hàm này
>     `await pwEval` lấy tickCost từ trang mà KHÔNG CÓ timeout; khi
>     trang không trả lời evaluate thì lượt kẹt vĩnh viễn ngoài phạm
>     vi timeout 120 s/pass.** Đây là lỗ hổng thiết kế của probe (xem
>     §3.3 + §9.2); file partial cuối (17 pass) có tickCost n=0 vì
>     nhánh lỗi ghi với tc=[].

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round120-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (05:49Z), đăng ký: lớp B gồm B5, gate 0 + lớp A,
  timeout 120 s/pass + JSON tăng dần, quy tắc quyết định ngưỡng,
  kế hoạch theo dõi stale-ghost 2 event riêng biệt + event frame 23
  đợt 118, lấy mẫu load1/RAM giữa lượt. **Phụ lục 1 (06:48Z):** T7
  DONE 06:46Z sau khi watcher kết thúc — thích ứng VANG-T7-DONE
  (tiền lệ đợt 118/119) nhưng KHÔNG BAO GIỜ CÓ HIỆU LỰC vì
  check-only riêng vẫn FAIL. **Phụ lục 2 (06:54Z, TRƯỚC khi đo trên
  boot mới):** reboot sang boot #61 → khởi động lại gate0-wait với
  hạn 10 poll (~20 phút, tới ~07:15Z) vì ngân sách đợt (hạn mềm
  07:30Z, hạn cứng 08:00Z); T7 đã DONE nên gate 0 boot #61 áp dụng
  VANG-T7-DONE ngay từ đầu. T4 tuân thủ prereg + 2 phụ lục.
- **Boot trong đợt: HAI boot — #60 rồi #61.**
  - Boot #60 (`uptime -s` 2026-11-16 04:45:49Z, boot_id
    `0260101b-acd3-43f4-91d2-670c1960fb7d`, số tạm "#60" theo T7 —
    chờ T6 đếm lại mù #37): T4 bắt đầu trên boot này (~05:36Z,
    boot ~50' tuổi). Gap sau #59 (01:47:49Z) = 2h58'00" (theo T7).
  - Boot #61 (`uptime -s` 2026-11-16 06:50:58Z, boot_id
    `80a940d7-a69b-4b65-8cea-0e173716d8fa`): reboot giữa đợt, xảy ra
    SAU khi gate0-wait boot #60 đã kết thúc (poll #30 lúc 06:49:16Z,
    exit 6 ~06:49:30Z) — không mất poll nào, không mất dữ liệu đo.
    Gap #60→#61 = 2h05'09". Nhịp reboot ~2h/lần (trước đó #59→#60
    2h58').
- **Replay từng boot:**
  - Boot #60: CHẾ ĐỘ LỖI MỚI "chạm mà không cài" (theo T7,
    POSTBOOT_FAIL 05:46Z): dpkg.log CHỈ 2 dòng `startup packages
    configure` lúc 05:35:40Z (boot +49'51"); 0 dòng về 9 gói GST;
    0 process apt/dpkg; /var/log/apt KHÔNG tồn tại;
    /var/lib/apt/lists TRỐNG; 0/11 package; thư mục GST KHÔNG TỒN
    TẠI (debroot 269 file vẫn còn). dpkg.log vẫn 2 dòng lúc T7
    watcher kết thúc 06:45:09Z (boot ~119' tuổi) — replay không quay
    lại trong 119+ phút quan sát. Khác #58 (replay kết thúc sau 350
    dòng mà thiếu GST) và khác #53 (không tới hẳn). Xem LIMITS T7
    đợt 120 (`docs/PHASE9_ROUND120_T7_INFRA_LIMITS.md`).
  - Boot #61: CHẠY và NHANH — hoạt động apt đầu tiên 06:51:38
    (boot +40s, ngang #48 +40s); cài xong toàn bộ 06:56:19
    (gstreamer1.0-tools, package cuối) → bracket **(0'40", 5'41"]**,
    1509 dòng dpkg.log (đúng bằng #52/#54/#57, cùng package cuối).
    apt-get đang chạy lúc 06:53:28Z (đang cài fonts-urw-base35),
    im hẳn lúc gate0-wait-b61 poll #2 (06:57:14Z, aptx=0, dpkgx=0).
- **Cây đo `5be5a250…`** (= cây H3f, đã apply + A/B đợt 119, parent
  chấp nhận). KHÔNG ĐỔI suốt đợt (ghi lúc bắt đầu 05:41Z = kiểm
  cuối 07:06Z = mọi poll gate0-wait 30+10 poll). `media.ts` md5
  `2c384ed1` không đổi. T4 không sửa production (md5 trước = sau
  mọi attempt). Lock v2 md5 `cd0c05c1` — khác `5cac10af` đợt 119 vì
  parent quyết §12 mục 8 (đóng đợt 119) sửa text thông báo
  `cmd_release`; acquire/timeout/stale-check/queue/cooldown không
  đụng — bản này là bản ĐÚNG cho đợt 120.
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t4-tickcost.py`
  + `analyze-t4-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 / wallbands S5 §1.4 và trên JSON T4
  attempt8 đợt 118 tái tạo đúng median 40,0 / p90 64,7 / wallbands
  đợt 118 §2 (diff với dry-run đợt 119 chỉ khác chuỗi đường dẫn
  tương đối/tuyệt đối, số giống hệt). Analyzer copy từ đợt 119
  hoạt động đúng (md5 khớp bản đợt 119).
- **Inotify headroom:** T7 đo cho #60: **545** (rơi tiếp từ 670 #57
  — reboot không hồi, tiếp tục giảm). Vite chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) — bắt buộc.
- **Vite lock v2-ONLY** (`apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`), cổng T4 **5187** (như đợt 118/119).
  Lúc T4 bắt đầu (boot #60): lock TRỐNG. Lúc attempt1 (boot #61):
  lock TRỐNG; T3 đợt 120 đang giữ lock khác (port 5191, xem §5).
- **T7 DONE 06:46Z** (cờ `round120-t7.done`, file rỗng): T7 chỉ làm
  boot #60 (watcher 60 poll) rồi thoát. T7 SẼ KHÔNG viết
  POSTBOOT_PASS cho boot #61 (xem phụ lục 2).
- **7/10 luồng đã DONE lúc T4 dừng** (T1, T2, T5, T6, T7, T8, T9 —
  theo cờ lúc 07:10Z); chỉ còn T3, T4, T10.

## 1. Gate 0 boot #60 — KHÔNG ĐẠT (30 poll, postboot FAIL 30/30)

- Gate0-wait boot #60 chạy 05:51:06Z–06:49:16Z (poll #1–30, +0–58m).
  Mọi poll: t7flag=chua-co (poll #1–28) rồi VANG-T7-DONE (poll
  #29–30, sau khi T7 DONE 06:46Z), **postboot_exit=1 (30/30)**,
  apt_procs(grep)=0–2, dpkg_lines=2 (30/30), load1 0,11–4,45,
  RAM 477–1571 MB, preview_md5=5be5a250 (30/30).
- Postboot FAIL không đổi suốt 58 phút (log
  `postboot-t4-b60-gate0wait-<n>.log`): thiếu 5 lib
  (libevent/libEGL/libavif/libdw/libevdev) + thư mục GST KHÔNG TỒN
  TẠI + 11 gói apt chưa cài; wrapper K1 PASS. T7 watcher (60 poll,
  tới 06:45:09Z) cũng kết luận y hệt: dpkg_lines=2,
  postboot_exit=1, file `t7-replay-done.md` (boot ~119' tuổi).
- **Kết luận: gate 0 boot #60 không thể ĐẠT trong đợt này** (cùng
  logic đợt 119 boot B — replay đã "chạm mà không cài" rồi im hẳn).
  Gate0-wait exit 6 lúc ~06:49:30Z theo prereg (đủ 60 phút).
- Lưu ý đếm apt (gate0-wait boot #60 apt_procs=0–2 trong khi 0 apt
  thật): **dương tính giả do cmdline của exec monitor các luồng
  khác chứa chuỗi "dpkg"** (vd đường dẫn `.../dpkg.log` trong lệnh
  `tail`/`wc` của monitor nền) — kiểm trực tiếp nhiều lần:
  `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0, `fuser` lock-frontend
  = không ai giữ. **Monitor nền ĐẦU TIÊN của chính T4 cũng là một
  polluter** (cmdline inline chứa "dpkg.log") — T4 đã kill nó
  06:03Z và thay bằng monitor dạng script-file (`mon-check.sh`,
  cmdline chỉ là đường dẫn script, không chứa chuỗi apt/dpkg).
  Bài học này đã dẫn tới bản vá §7.2 (kiểm apt bằng `pgrep -x`
  thay vì grep-ps). Không ảnh hưởng kết luận gate 0 boot #60 vì
  postboot_exit=1 đã chặn.

## 2. Boot #61 — gate 0 ĐẠT ở poll #2 (06:57:14Z)

- Gate0-wait-b61 chạy 06:55:13Z–06:57:14Z (poll #1–2, hạn 10 poll).
  - Poll #1 (06:55:13Z, boot +4'15"): t7flag=VANG-T7-DONE,
    **postboot_exit=0 (PASS — replay vừa cài xong GST)**,
    apt_grep=2, **aptx=1** (1 apt-get còn chạy — trailing run),
    dpkgx=0, dpkg_lines=1238, load1=1,39, RAM 1565 MB,
    preview_md5=5be5a250. (0c) chưa đạt vì aptx=1 → chờ poll #2.
  - Poll #2 (06:57:14Z, boot +6'16"): t7flag=VANG-T7-DONE,
    **postboot_exit=0, apt_grep=0, aptx=0, dpkgx=0,
    dpkg_lines=1509** (replay xong), load1=0,72, RAM 1371 MB,
    preview_md5=5be5a250 → **GATE 0 ĐẠT**.
- Postboot PASS đầy đủ (log `postboot-t4-b61-gate0wait-2.log`):
  wrapper PASS; libs PASS 5/5; GST thư mục thật, 269 file plugin
  (= debroot); isomp4 + libav PASS; apt PASS 11/11 package; kết
  luận "DU DIEU KIEN chay WebKit (boot 2026-11-16 06:50:58)".
  (Lưu ý: header của script postboot vẫn ghi "reboot #60?" — text
  cũ từ lần sửa của T7; giá trị `boot=` live là 06:50:58, đúng
  boot #61. Bằng chứng dùng là boot= + boot_id, không phải text
  header.)
- Replay bracket #61: **(0'40", 5'41"]** (dpkg đầu 06:51:38, cuối
  06:56:19, 1509 dòng) — nhanh thứ 2 trong các boot đã kẹp
  (#48 2'44", #61 5'41", #52 8'44", #57 7'34" — thứ tự không quan
  trọng; điểm chính là replay lần này CHẠY và XONG, khác hẳn #60).

## 3. Attempt1 trên boot #61 — chạy 17/20 pass rồi KẸT, T4 kill probe

### 3.1 Gate 0 kiểm lại + gate A (06:58:15Z)

- run-t4.sh gate 0 try 1: postboot_exit=0, apt_grep=0, aptx=0,
  dpkgx=0 → PASS ngay (không cần try 2).
- Gate A poll 1 (06:58:15Z): load1=0,41, load5=0,85, lock TRỐNG,
  blockers=0, RAMavail=1142 MB, tree=YES:md5=5be5a250 → **CỬA YÊN
  MỞ NGAY poll 1**. ps-before ghi 06:58:15Z.
- Probe start 06:58:1xZ, vite :5187 lên trong 450 ms, lock v2 giữ
  bởi t4 (port 5187). Flip rVFC tắt sau pass 5 (wallMs=26812).

### 3.2 Diễn biến probe (20 pass, fixture nonperiodic, --disable-rvfc)

- Pass 1–17 chạy BÌNH THƯỜNG, mỗi pass ~3,0–3,5 s wall-clock,
  32–46 khung rAF/pass, 100% đo được, không pageErrs. Partial JSON
  ghi sau mỗi pass (16-pass file: 2.077.712 byte, tickCost n=512).
- **KẸT sau pass 17:** log cuối "play pass 17: 34 khung rAF, 34 đo
  được" (~06:59:44Z); sau đó KHÔNG CÓ output nào nữa trong >5 phút
  (kiểm 07:01:12Z, 07:01:27Z, 07:03:14Z, 07:03:40Z — log dừng ở
  pass 17, file JSON vẫn 16 pass). MiniBrowser vẫn sống (pid 8202,
  8,5% CPU lúc 07:03:40Z), probe node vẫn sống (pid 8104, 0,9%
  CPU), vite vẫn sống, load máy ~0,1–0,2 (rất yên), RAM 636–725 MB
  lúc đó. **Timeout 120 s/pass KHÔNG kích hoạt** (đáng lẽ nổ
  ~07:01:47Z nếu pass 18 đang chạy trong cuộc đua evaluate).
- **T4 kill probe (SIGTERM pid 8104) ~07:05:44Z** (sau khi backup
  file JSON 16-pass — xem §3.3). Ngay sau đó probe thoát 2:
  log "play pass 18 lỗi: Error: page.evaluate: Target page,
  context or browser has been closed" → "partial JSON đã ghi:
  17/20 pass (target-closed)" → "partial JSON đã giữ 17/20 pass —
  thoát 2" (07:05:45Z). run-t4.sh ghi `run-attempt exit=2`
  07:05:57Z; vite đã kill (curl :5187 = 000); class B đánh giá
  07:05:57Z (xem §5).

### 3.3 Cơ chế kẹt — ĐÃ XÁC ĐỊNH TỪ CODE PROBE (không phải đoán)

- `writePartial` (probe dòng ~425) **TRƯỚC KHI ghi file thì
  `await pwEval(...)` lấy tickCost từ trang (`window.__vcutTickCost`)
  mà KHÔNG CÓ timeout riêng** (chỉ có `.catch(() => [])` — chỉ bắt
  lỗi reject, không bắt promise không bao giờ settle). Nếu trang
  không trả lời evaluate thì `writePartial` kẹt vĩnh viễn ở đó.
- Timeout 120 s/pass chỉ bao phủ `Promise.race` quanh evaluate của
  pass đang chạy — **không bao phủ `writePartial` giữa các pass**.
  Lần kẹt này xảy ra ĐÚNG ở đó: sau khi pass 17 thu xong khung,
  trước khi ghi partial (file vẫn 16 pass lúc 07:03:40Z; log
  "partial JSON đã ghi: 17/20 (sau pass)" chỉ xuất hiện sau khi
  SIGTERM làm pwEval reject → tc=[] → ghi file tiếp).
- Bằng chứng: file JSON cuối (17 pass) có **tickCost n=0** — nhánh
  lỗi ghi với `tc=[]` (pwEval reject sau khi target đóng); file
  backup 16-pass (tickCost n=512) là lần ghi "sau pass" thành công
  cuối cùng (sau pass 16, khi trang còn trả lời evaluate).
  `blendTick`/`pump` rỗng trong MỌI file partial (y2Logs chỉ dump
  ở cuối lượt hoàn chỉnh) — nên (b)/F6'/lag5 không có dữ liệu
  (xem §4).
- Nguyên nhân gốc khiến trang không trả lời evaluate: CHƯA XÁC
  ĐỊNH từ ngoài. Giả thuyết mạnh nhất: renderer đói tài nguyên dưới
  áp lực RAM (RAM avail rơi đều 1012→440 MB trong lượt, xem §5;
  MiniBrowser vẫn chạy 8,5% CPU nhưng main thread không trả lời
  CDP evaluate). Đĩa đầy đã LOẠI TRỪ (`df`: / 7% dùng, /home 54%,
  70G trống). Cần luồng probe chẩn đoán riêng (xem §9.2).
- **Bài học vận hành:** kill probe bằng SIGTERM là đúng (probe đã
  kẹt >5 phút, vượt xa timeout thiết kế); SIGTERM không làm mất dữ
  liệu (file 16-pass đã backup trước khi kill; nhánh lỗi của probe
  tự ghi thêm file 17-pass). Lần sau: nếu probe không tiến >3 phút
  sau pass cuối có log thì kill (không chờ tới 5 phút).

## 4. Số đo chính — DỞ DANG (16/20 pass, KHÔNG dùng chốt/mở lại ngưỡng)

- Phân tích trên file backup 16-pass
  (`preview-b-f3-flip-webkit-t4-attempt1.json.bak16pass` — bản sao
  của lần ghi "sau pass" thành công cuối cùng, 06:59:40Z,
  tickCost n=512, parse OK). File JSON chính (17 pass,
  target-closed) có tickCost n=0 nên KHÔNG phân tích được tickCost
  — xem §3.3.
- **tickCost total: n=512, median=40,0 ms, p90=69,0 ms, max=104,
  min=24 | hậu flip+2000ms: n=337, median=41,0 ms.**
  (Trùng median 40,0 ms với attempt8 đợt 118 — nhưng lượt này DỞ
  DANG + lớp B vi phạm nên KHÔNG được hiểu là xác nhận ngưỡng.)
- **Wallbands (đăng ký trước):** 0–20k n=97 median 39,0 / 20–32k
  n=109 median 39,0 / 32–45k n=120 median 41,0 / 45–62k n=164
  median 41,0 / 62–70k n=22 median 39,0 / 70–80k n=0. Profile
  PHẲNG, không tăng hậu flip (median hậu flip 41,0 ≈ toàn lượt
  40,0).
- **(b) unique-match + F6' + lag5: KHÔNG CÓ DỮ LIỆU.**
  `analyze-t4-labellag.py` / `analyze-t4-skiplatest.py` /
  `analyze-t4-lag5.py` đều trả nTick=0 (blendTick rỗng trong file
  partial — y2Logs chỉ dump cuối lượt hoàn chỉnh). Skiplatest kết
  luận "CHƯA ĐỦ MẪU — F6' vẫn mở" (đây là verdict của analyzer trên
  input rỗng; F6' bản thân vẫn ĐÃ ĐÓNG từ L7, không đóng/mở lại
  từ lượt này). Lag5: 0 occurrence (vô nghĩa vì không có dữ liệu
  blendTick). Stale-ghost: không có dữ liệu mới (0 event).
- **Verdict ngưỡng (theo prereg §1, lượt KHÔNG đạt lớp B + không
  hoàn chỉnh): GIỮ ngưỡng ≤60 ms theo trạng thái đợt 118.**
  Không siết, không mở lại — không có lượt yên hợp lệ mới.

## 5. Kiểm chứng lớp B — VI PHẠM (B5; B2 có dấu hiệu)

- Sampler 20 s: n=23 mẫu (06:58:17Z–07:05:37Z). load1 0,12–2,36;
  **RAM avail 1012→440 MB, min 440 MB, max 1012 MB; 3 mẫu <500 MB
  (469 / 444 / 440 MB, lúc 07:04:57Z–07:05:37Z); 23/23 mẫu
  <1024 MB.** RAM rơi ĐỀU suốt lượt (~75 MB/phút) — bleed bộ nhớ
  trong lúc đo (trang/probe tích lũy state), không phải sụt đột
  ngột. Vượt B5 ngay cả khi probe không kẹt (RAM đã <500 MB trước
  khi T4 kill probe).
- **B1 (load5 cuối ≤2,5): ĐẠT** (load5 lúc kết thúc 0,67).
- **B2 (load1 giữa lượt ≤4 + không process phân tích nặng luồng
  khác): CÓ DẤU HIỆU.** load1 max 2,36 ≤ 4 (ĐẠT theo tiêu chí
  load). Nhưng **probe của T3 (`webkit_blob_flaky_120t3.mjs`,
  Q8PAUSED, port 5191) xuất hiện trong ps-after mà KHÔNG có trong
  ps-before** — tức bắt đầu GIỮA cửa sổ đo (pid 7947; T3 giữ lock
  v2 riêng). Không có bằng chứng nó gây tải nặng (load1 rơi đều
  sau 06:59:17Z; probe T3 ở chế độ Q8PAUSED), nhưng tiêu chí hẹp
  "không thấy process phân tích của luồng khác trong cửa sổ" thì
  KHÔNG đạt tuyệt đối. T10 cũng xuất hiện trong ps-after (chỉ
  `acquire` lock, chưa chạy probe). Ghi nhận để parent đánh giá;
  verdict lượt đã VI PHẠM qua B5 nên B2 không làm đổi kết luận.
- **B3 (không reboot trong lúc đo): ĐẠT** (boot 06:50:58 trước =
  sau).
- **B4 (không replay apt/dpkg trong cửa sổ): ĐẠT** (apt/dpkg lúc
  đánh giá = 0; postboot vẫn PASS sau lượt).
- **B5 (RAM giữa lượt không <500 MB): VI PHẠM** (RAM min 440 MB,
  3 mẫu <500 MB). **→ Lượt KHÔNG đạt điều kiện yên.**
- Postboot sau lượt: vẫn PASS đầy đủ (DU DIEU KIEN, boot
  06:50:58). Cây md5 không đổi (5be5a250 / 2c384ed1).

## 6. Kiểm chứng hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `5be5a250…` không đổi: ghi lúc bắt đầu
  (05:41Z) = mọi poll gate0-wait (30+10 poll) = kiểm cuối
  (07:06Z). `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 07:11Z, ~25 s).
  `vite build`: KHÔNG chạy lại — T1 đã verify sau apply H3f đợt
  119 (tsc exit 0 + vite build PASS 7,03 s, 23:57Z 15/11); cây md5
  không đổi nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — lượt không hoàn chỉnh,
  không sửa code; test 15/15 PASS gần nhất là đợt 118 trên cây cũ
  (03bf029f), không hiểu là đã chạy trên cây H3f. Ghi rõ để khỏi
  hiểu lầm.
- Dry-run analyzer PASS (§0): S5 attempt3 → 49,5/75,0; T4 attempt8
  đợt 118 → 40,0/64,7 (khớp 100%).

## 7. Sự cố hạ tầng + vận hành trong lúc đo

1. **Reboot #61 06:50:58Z (boot_id `80a940d7…`, gap #60→#61 =
   2h05'09"):** xảy ra sau khi gate0-wait boot #60 đã kết thúc
   (poll #30 06:49:16Z) — không mất dữ liệu. Khởi động lại
   gate0-wait trên boot mới theo tiền lệ đợt 119 (phụ lục 2).
2. **Replay boot #60 "chạm mà không cài" (nợ hạ tầng MỚI, xem §9.1):**
   dpkg.log 2 dòng rồi im 119+ phút. T7 watcher 60/60 poll FAIL.
   Đây là chế độ lỗi thứ 3 của replay (sau #53 không tới hẳn và
   #58 kết thúc sớm thiếu GST).
3. **Dương tính giả đếm apt (xem §1 cuối):** bộ đếm grep-ps của
   gate0-wait đếm 1–2 trong khi `pgrep -x apt-get/dpkg` = 0 thật —
   do cmdline của exec monitor các luồng khác chứa chuỗi "dpkg"
   (kể cả monitor đầu tiên của chính T4 — đã kill 06:03Z, thay
   bằng `mon-check.sh` dạng script-file).
4. **Runtime restart (không phải reboot VM):** 1 lần làm gián đoạn
   phiên T4 (~06:52Z, ngay sau reboot #61) — phiên tự phục hồi
   bằng cách kiểm tra lại trạng thái từ đĩa (log + cờ + boot_id);
   không mất dữ liệu. (Lần này khác đợt 119: phiên bị gián đoạn
   ĐÚNG lúc reboot, không phải giữa lúc chờ poll.)
5. **Exec nền của T4 bị kill lạ:** monitor cuối (`sleep 360`,
   proc_32076dfe394d) nhận SIGTERM và chết không có output lúc
   ~06:52Z — không mất dữ liệu (T4 đã kiểm trực tiếp ngay sau
   đó). Ghi nhận, không giải thích được.
6. **Header script postboot lỗi thời:** text header vẫn ghi
   "reboot #60?" (từ lần sửa của T7) trong khi boot hiện tại là
   #61 — giá trị `boot=` live thì đúng. Không ảnh hưởng kết luận
   (bằng chứng dùng boot= + boot_id), nhưng T7 nên cập nhật header
   khi sửa script lần sau.

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND120_T4_WEBKIT60MS_LIMITS.md` — file này. **File
  duy nhất trong repo mà T4 thay đổi** (probe copy + analyzer + dữ
  liệu + run script đều ở hidden_files; fixture mp4 là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round120-t4-webkit60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round120-t4/`
  (prereg-t4.md [viết trước khi đo + phụ lục 1 (T7 DONE) + phụ lục
  2 (reboot #61, khởi động lại gate0-wait)],
  probe120t4-ghost-k7.webkit.mjs [copy đợt 119, md5 `6603d8fa…`,
  node --check OK], analyze-t4-{tickcost,labellag,skiplatest,
  wallbands,lag5}.py [copy đợt 119, md5 khớp bản đợt 119],
  analyze-t4-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  b.json [copy đợt 119, md5 `078938cf…`],
  vite.t4-temp.config.mjs [copy đợt 119, HMR tắt, watch.ignored
  0 watch],
  run-t4.sh [adapt đợt 120: cây H3f chốt (không chờ cờ T1),
  gate 0 kiểm apt bằng pgrep -x (vá §7.2), log gate 0 hậu tố b61],
  t4-attempt-inner.sh, check-classb-t4.sh [lớp B gồm B5],
  gate0-wait-t4.sh [boot #60: 30 poll, log postboot hậu tố b60],
  gate0-wait-t4-b61.sh [boot #61: 10 poll, log hậu tố b61, kiểm
  apt bằng pgrep -x],
  gate0-wait-t4.log [boot #60: 30 poll FAIL] +
  gate0-wait-t4-b61.log [boot #61: 2 poll, GATE 0 ĐẠT #2],
  poll-t4.log [mẫu 5 phút + gate0/gateA; poller chết theo reboot
  #61, khởi động lại 06:55Z],
  poll-t4.nohup.log, poll-t4-b61.nohup.log,
  gate0-wait-t4.nohup.log, gate0-wait-t4-b61.nohup.log,
  mon-check.sh + mon-check.log + mon-check.nohup.log [monitor dạng
  script-file thay monitor inline (vá dương tính giả apt)],
  chain-t4.log [attempt1: gate 0 + gate A + run-attempt exit=2 +
  class B],
  postboot-t4-b60-gate0wait-{1..30}.log [boot #60: FAIL 30/30] +
  postboot-t4-b61-gate0wait-{1,2}.log [boot #61: #1 FAIL (5 gói
  thiếu, apt còn chạy), #2 PASS đầy đủ],
  postboot-t4-b61-attempt1-gate0.log [gate 0 kiểm lại trong
  run-t4.sh: PASS],
  run-t4-attempt1.nohup.log, run-webkit-t4-attempt1.log
  [pass 1–17 + lỗi pass 18 target-closed],
  vite-5187-t4-attempt1.log, load-mid-t4-attempt1.log [n=23],
  ps-before-t4-attempt1.txt / ps-after-t4-attempt1.txt,
  marker-t4-attempt1,
  preview-b-f3-flip-webkit-t4-attempt1.json [17 pass, partial,
  target-closed, tickCost n=0 — file chính probe ghi],
  preview-b-f3-flip-webkit-t4-attempt1.json.bak16pass [16 pass,
  tickCost n=512 — backup lần ghi "sau pass" thành công cuối,
  dùng để phân tích],
  analyze-t4-a1-{tickcost,wallbands,labellag,skiplatest,lag5}.txt
  [phân tích trên file 16-pass: tickcost/wallbands có số; 3 file
  còn lại n=0 do blendTick rỗng],
  tree-md5.txt [`5be5a250`],
  classb-t4-attempt1.txt [B1 ĐẠT / B2 có dấu hiệu / B3 ĐẠT /
  B4 ĐẠT / B5 VI PHẠM]).
- Cờ xong: `hidden_files/round120-t4.done` (kèm verdict 1 dòng).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — 0 lượt yên hợp lệ đợt 120
   (boot #60: 0 lượt vì gate 0 không đạt; boot #61: 1 lượt DỞ
   DANG 16/20 pass + lớp B vi phạm). Nợ lượt yên theo dõi ĐỢT 120
   CHƯA ĐÓNG — chuyển tiếp sang đợt 121.** Chạy lượt yên theo dõi
   thường kỳ theo cùng prereg (gate 0 + lớp A + lớp B gồm B5) trên
   cây hiện tại (H3f, md5 5be5a250).
2. **Probe kẹt ở `writePartial` (nợ kỹ thuật MỚI, quan trọng nhất
   đợt này):** `writePartial` đợi `pwEval` lấy tickCost mà không
   có timeout; trang không trả lời evaluate → lượt kẹt vĩnh viễn
   ngoài phạm vi timeout 120 s/pass. Đề xuất sửa probe (luồng
   probe owner đợt sau): (a) thêm timeout riêng cho pwEval trong
   writePartial (vd 15–30 s, fallback tc=[] rồi ghi file tiếp);
   (b) cân nhắc lấy tickCost từ biến trang đã cache thay vì
   evaluate mỗi pass; (c) thêm watchdog tổng cho toàn bộ lượt
   (vd không tiến >3 phút thì tự thoát 3 với partial hiện có).
   Ngoài ra nhánh lỗi của `writePartial` ghi file với tc=[] —
   lần sau nên giữ lại tc đã fetch được gần nhất thay vì ghi đè
   thành rỗng (nếu không, file partial cuối luôn mất tickCost).
3. **Replay boot #60 "chạm mà không cài" (nợ hạ tầng MỚI):**
   dpkg.log 2 dòng rồi im 119+ phút, 0/11 package — cần T7/parent
   chẩn đoán (replay wrapper chết sau `dpkg --configure -a`? receipt
   withheld? ledger thiếu?). Nếu replay các boot sau cũng vậy, mọi
   luồng đo WebKit đều chặn ở gate 0. May mắn: boot #61 replay
   chạy nhanh và đủ (bracket (0'40", 5'41"]) — chế độ lỗi này
   không phải lúc nào cũng xảy ra.
4. **RAM bleed trong lúc đo (nợ quan sát mới):** RAM avail rơi đều
   1012→440 MB trong ~7,5 phút đo (23/23 mẫu <1024 MB) — trang/
   probe tích lũy bộ nhớ. Nếu bleed này là hệ thống (không phải
   do lượt đo), gate A (RAM ≥1024 MB lúc bắt đầu) và B5 sẽ khó đạt
   ở các lượt sau. Đề xuất: luồng riêng đo RAM baseline của trang
   preview khi chạy idle (không probe) để tách bleed của trang
   khỏi bleed của probe.
5. **T3 probe chạy giữa cửa sổ đo (nợ phối hợp):** T3 bắt đầu
   `webkit_blob_flaky_120t3.mjs` giữa lượt yên của T4 (không có
   trong ps-before, có trong ps-after). Lần sau các luồng đo nên
   kiểm tra lock + process của nhau trước khi bắt đầu cửa sổ đo
   (gate A hiện chỉ kiểm lock, không kiểm probe đang chạy của
   luồng khác qua port khác).
6. **Bộ đếm apt bằng grep-ps đã được vá trong script của T4
   (pgrep -x):** các script đo khác (T5/T8/...) nếu còn dùng grep
   đếm apt thì nên đổi theo — dương tính giả này là hệ thống
   trong môi trường nhiều agent (cmdline monitor nào cũng có thể
   chứa chuỗi "dpkg").
7. **Stale-ghost event frame 23:** không có dữ liệu mới đợt 120
   (0 lượt yên hợp lệ; file partial không có blendTick để trích
   lag ≥+5f). Theo dõi tiếp ở các lượt yên sau; chẩn đoán cơ chế
   là T5 đợt 119 (ĐÃ ĐÓNG).
8. **Nợ khác đứng yên theo LIMITS gộp đợt 119 §10 + quyết parent
   §12:** E4 lô đo lớn (T2 đợt 120 DONE — xem LIMITS T2); H3f đã
   apply + A/B (T1 đợt 119 DONE: tick chậm 41→19, longtask tổng
   -52,3%); điểm gãy GIỮ 19,63 (T3 đợt 119 DONE); ghost seek H-D
   ĐÃ ĐÓNG đợt 118; mù #37 chờ T6 (đợt 120 DONE — xem LIMITS T6);
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403
   chờ user; release gate không đổi. Reboot mới nhất: boot #61
   06:50:58Z (gap #60→#61 = 2h05'09"). 7/10 luồng đợt 120 đã DONE
   lúc T4 dừng (T1, T2, T5, T6, T7, T8, T9); T3 + T10 còn chạy.

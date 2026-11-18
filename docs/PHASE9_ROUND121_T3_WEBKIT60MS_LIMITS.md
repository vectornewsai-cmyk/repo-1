# PHASE9_ROUND121_T3_WEBKIT60MS_LIMITS — Sửa probe writePartial (timeout 30 s) + 1 lượt yên HỢP LỆ: median 52,0 ms, ngưỡng GIỮ

> Luồng T3, đợt 121, lượt cron 15:35 +07 16/11/2026 (bắt đầu ~08:39Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> Nợ đợt 120 (LIMITS T4 đợt 120 §9.2): 0 lượt yên hợp lệ đợt 120 —
> 1 lượt dở dang trên boot #61 (17/20 pass rồi KẸT sau pass 17 >5 phút
> ở `writePartial` đợi `pwEval` lấy tickCost KHÔNG timeout; file
> partial cuối tickCost n=0 vì nhánh lỗi ghi tc=[]). **Nợ lượt yên
> theo dõi ĐỢT 120 ĐÃ ĐÓNG trong đợt này (xem §4).**
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không
> đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — FIX ĐÃ KIỂM CHỨNG SỐNG + 1 LƯỢT YÊN HỢP LỆ.**
> 1. **Fix probe (nợ §9.2 đợt 120):** `pwEvalTimeout` (race 30 s) cho
>   `writePartial` + fetch y2 cuối; nhánh lỗi GIỮ tc lần fetch thành
>   công gần nhất + ghi `tickCostStatus`/`tickCostNote` vào partial
>   JSON, KHÔNG ghi tc=[] im lặng nữa. Kiểm chứng sống 2 chiều:
>   ép timeout 1 ms → nhánh TIMEOUT kích hoạt, probe vẫn hoàn thành
>   exit 0; timeout mặc định 30 s → 20/20 pass, mọi lần ghi partial
>   đều `tickCost ok` (n=529).
> 2. **Lượt yên attempt1 trên boot #63 (PASS NHỜ REPAIR của T5):
>   20/20 pass, lớp B 5/5 (B1/B2/B3/B4/B5 đều ĐẠT). tickCost total
>   n=530, median 52,0 ms, p90 80,0 ms, max 111, min 26; hậu
>   flip+2000ms median 52,0 ms. (b) nomatch 0, lag max +4f, 0 lag
>   ≥+5f. F6' 100%/100% (bar (1)/(2)) — vẫn ĐÓNG từ L7. Stale-ghost:
>   0 event (không tái hiện P4/Q5/frame-23).**
> 3. **Verdict ngưỡng (theo prereg §1, lượt ĐẠT lớp B): GIỮ ngưỡng
>   WebKit ≤60 ms** — lượt yên theo dõi lần 3 sau khi chốt (lần 1 S5
>   49,5; lần 2 T4 đợt 118 attempt8 40,0; lần 3 T3 đợt 121 attempt1
>   52,0). Median cao hơn 40,0 (đợt 118) nhưng vẫn trong ngưỡng với
>   biên 8 ms; KHÔNG siết (cần thêm lượt yên độc lập).
> 4. **Hạ tầng:** HAI boot trong đợt (#62 rồi #63, gap 27'18").
>   Boot #62: replay chạy tốt (dpkg 2→1509 dòng) nhưng reboot cắt
>   trước khi apt im — gate 0 không đạt. Boot #63: replay CHẾT dạng
>   (B) "chạm mà không cài" (dpkg 2 dòng rồi im 15+ phút); T5 chạy
>   `--repair` MỘT LẦN có giám sát (luật replay-chết đã duyệt) →
>   PASS đủ 11 gói, gate 0 ĐẠT NHỜ REPAIR (thích ứng (0a') prereg
>   phụ lục 2). RAM host bị ghim thấp (~440 MB, chỉ 17 process /
>   311 MB RSS trong cell) — phải miễn ngưỡng RAM cho pass thử
>   chức năng (phụ lục 3), lượt yên vẫn giữ gate A đầy đủ.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round121-t3/prereg-t3.md` — viết TRƯỚC
  mọi phép đo (08:44Z), đăng ký: fix probe (timeout 30 s + giữ tc cũ
  + ghi trạng thái), test fix (dry-run + 2 pass thử), gate 0 + lớp A
  + lớp B gồm B5, timeout 120 s/pass, quy tắc quyết định ngưỡng,
  kế hoạch theo dõi stale-ghost. **Phụ lục 1 (08:56Z):** reboot sang
  boot #63 → khởi động lại gate0-wait (tiền lệ đợt 120). **Phụ lục 2
  (09:32Z):** gate 0 boot #63 ĐẠT NHỜ REPAIR của T5 — thích ứng (0a'):
  T5 POSTBOOT_PASS (chủ repair, boot_id khớp, nhãn "PASS NHỜ REPAIR")
  thay cho cờ T7 (T7 không viết file PASS dù gate-waiter của chính
  T7 tuyên GATE 0 DAT). **Phụ lục 3 (09:49Z):** miễn ngưỡng RAM
  ≥1024 MB của gate A CHỈ cho pass thử chức năng (trial0/trial1),
  vì RAM host bị ghim ~440 MB không liên quan tới fix; lượt yên
  attempt1 vẫn yêu cầu gate A đầy đủ. T3 tuân thủ prereg + 3 phụ lục
  (cả 3 phụ lục đều viết TRƯỚC khi chạy phép đo mà chúng điều chỉnh).
- **Boot trong đợt: HAI boot — #62 rồi #63.**
  - Boot #62 (`uptime -s` 2026-11-16 08:25:47Z, boot_id
    `9788ce28-c334-40f4-bc21-e93d298b0f9b`, số tạm "#62" theo
    round-in-progress.md — chờ T6 đếm lại): T3 bắt đầu trên boot này
    (~08:39Z, boot ~14' tuổi). Gap sau #61 (06:50:58Z) = 1h34'49".
  - Boot #63 (`uptime -s` 2026-11-16 08:53:05Z, boot_id
    `725453a2-c8cb-44ba-a6f3-7222d0b2d00b`): reboot giữa đợt, xảy ra
    GIỮA lúc gate0-wait boot #62 đang chạy (poll #5 lúc 08:52:39Z).
    Gap #62→#63 = 27'18" (ngắn nhất trong các gap gần đây; trước đó
    #60→#61 2h05'09", #61→#62 1h34'49").
- **Replay từng boot:**
  - Boot #62: CHẠY TỐT — dpkg.log 2 dòng lúc poll #1–#2, 349 dòng
    lúc +4m, 1474 lúc +6m, 1509 lúc +8m (ngang #61); postboot PASS ở
    poll #4–#5 (08:50:39Z, 08:52:39Z) nhưng apt vẫn chạy (apt-get
    pid 18393 lúc poll #4) nên (0c) không đạt; reboot 08:53:05Z cắt
    trước khi apt im hẳn. Gate 0 boot #62 KHÔNG BAO GIỜ ĐẠT.
  - Boot #63: CHẾT dạng (B) "chạm mà không cài" (lần 2 sau #60) —
    dpkg.log CHỈ 2 dòng `startup packages configure` lúc 08:53:53Z
    (boot +48s), rồi im; 0 apt/dpkg từ poll #2 trở đi; /var/log/apt
    KHÔNG tồn tại; /var/lib/apt/lists trống (chỉ auxfiles/lock/
    partial); postboot FAIL 16/16 poll đầu. T5 chạy `--repair` MỘT
    LẦN có giám sát 09:14:14Z→09:26:57Z (SCRIPT_EXIT=0, xem §1):
    apt-get update (~12 phút, pid 15056, 0,0% CPU lúc 09:23Z —
    tải list chậm) rồi install đủ 11 gói (pid 19075); dpkg.log
    2→759 dòng; postboot PASS từ poll #17 (09:27:38Z).
- **Cây đo `5be5a250…`** (= cây H3f, đã apply + A/B đợt 119, parent
  chấp nhận). KHÔNG ĐỔI suốt đợt (ghi lúc bắt đầu 08:39Z = kiểm cuối
  10:04Z = mọi poll gate0-wait). `media.ts` md5 `2c384ed1` không đổi.
  T3 không sửa production (md5 trước = sau mọi attempt). Lock v2 md5
  `cd0c05c1` — bản ĐÚNG (như đợt 120).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t3-tickcost.py`
  + `analyze-t3-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 / wallbands S5 §1.4 và trên JSON T4
  attempt8 đợt 118 tái tạo đúng median 40,0 / p90 64,7 / wallbands
  đợt 118 §2 (khớp 100% với dry-run đợt 120). Analyzer copy từ đợt
  120 hoạt động đúng (md5 khớp bản đợt 120).
- **RAM host bị ghim thấp (xem §7.1):** chỉ 17 process trong cell,
  tổng RSS ~311 MB (hatch daemon 260 MB lớn nhất); MemTotal 8,1 GB
  nhưng MemFree ~155 MB, Cached ~544 MB — ~6,5 GB không thuộc về
  process nào trong PID namespace này (áp lực host/tenant khác).
  RAM avail dao động 423–2819 MB trong đợt, rơi đều về ~440 MB lúc
  máy yên hoàn toàn (09:42–09:52Z). Inotify headroom: T5 đo 5436
  lúc 09:26:50Z (HỒI từ 545 của #60 — reboot #63 hồi headroom).
  Vite vẫn chỉ chạy với `server.watch.ignored: ["**/**"]` (0 watch)
  theo protocol.
- **Vite lock v2-ONLY** (`apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`), cổng T3 **5187** (như T4 đợt 118/119/
  120). Lúc T3 bắt đầu: lock TRỐNG. Trong đợt: T7-round121 giữ lock
  2 lần (port 8953, pid 22378 rồi 24060) — T3 chờ đúng luật FIFO,
  không xóa lock của luồng khác.
- **Các luồng đợt 121 khác (theo thư mục hidden_files):** T1, T2
  (đã DONE lúc 09:55Z), T4, T5 (repair + watcher), T6 (đã DONE),
  T7 (hạ tầng + gate-waiter riêng), T8, T9, T10. T3 phối hợp lượt
  yên qua lock v2 FIFO.

## 1. Fix probe — pwEvalTimeout 30 s cho writePartial (+ fetch y2 cuối)

- **File sửa:** `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`
  (bản copy trong repo của probe đợt 120, gốc md5 `6603d8fa…`,
  57.283 byte — OVERSIZE, cần ENABLE_PRIVSEP=0 khi push).
  Bản làm việc tại `hidden_files/round121-t3/` có cùng md5
  `dccb8f4c…`. Chỉ sửa probe script, không sửa production.
- **Thay đổi (diff vs bản đợt 120 — 3 điểm, xem diff đầy đủ trong
  LIMITS này §8):**
  1. **Option mới `--tickcost-timeout-ms`** (mặc định 30000 ms):
     `TICKCOST_TIMEOUT_MS = Math.max(1, Number(opt(...)) || 30000)`.
     Sàn 1 ms (không phải 1000 ms) để test ép nhánh timeout được;
     mặc định vẫn 30000 ms, đường thường không đổi. (Bài học trong
     lúc test: sàn 1000 ms ban đầu đã chặn test ép 1 ms — trial0d
     chạy với timeout hiệu dụng 1000 ms thay vì 1 ms; đã sửa sàn
     xuống 1 ms TRƯỚC khi chạy trial0e, xem §2.)
  2. **Helper `pwEvalTimeout(expr, ms, label)`** = Promise.race giữa
     pwEval và timer; timeout KHÔNG hủy được evaluate gốc của
     Playwright (promise gốc vẫn treo nền) nhưng cho phép probe tiếp
     tục ghi file + chạy tiếp — caveat ghi rõ trong code.
  3. **`writePartial` dùng `pwEvalTimeout`** thay cho `await pwEval`
     trần; giữ `lastTcOk` (tc lần fetch thành công gần nhất) +
     `lastTcStatus` (`ok`/`timeout`/`error`/`none`); khi timeout/lỗi:
     log rõ `writePartial tickCost TIMEOUT/ERROR sau 30000ms — giữ
     tc cũ n=…`, ghi vào partial JSON `y2.tickCostStatus` +
     `y2.tickCostNote`, KHÔNG ghi đè tc thành []. Log mỗi lần ghi
     partial nay kèm trạng thái: `partial JSON đã ghi: N/20 pass
     (sau pass, tickCost ok n=…)`.
  4. **Cùng helper cho lần fetch y2Logs cuối lượt** (cùng lỗi: không
     timeout thì probe treo sau pass cuối) — fallback rỗng như cũ,
     log rõ khi timeout (`y2Logs cuối TIMEOUT sau …ms — dùng y2 rỗng
     (như fallback cũ)`).
  - KHÔNG đổi: logic đo, định dạng JSON (chỉ THÊM 2 trường
    `tickCostStatus`/`tickCostNote` trong `y2` — analyzer đọc
    `y2.tickCost` như cũ), timeout pass 120 s, số pass, flip sau
    pass 5, tap/relabel ON.
  - KHÔNG sửa trong đợt này (nợ còn lại, xem §9.2): các `pwEval`
    khác không timeout (flip sau pass 5, `y2SeqStart`, setup) —
    cùng lỗi tiềm ẩn nhưng chưa từng kẹt; để luồng probe sau quyết
    có bọc hết hay không (rủi ro hồi quy nếu bọc bừa).

## 2. Test fix — dry-run + 2 pass thử (TRƯỚC lượt thật)

- **(i) `node --check` probe đã sửa: OK** (2 lần: sau sửa chính +
  sau khi hạ sàn timeout xuống 1 ms).
- **(ii) Dry-run analyzer: PASS** — S5 attempt3 → median 49,5 /
  p90 75,0 (n=570); T4 attempt8 đợt 118 → median 40,0 / p90 64,7
  (n=644). Khớp 100% số kỳ vọng (xem §0).
- **(iii) trial0d — 1 pass, timeout hiệu dụng 1000 ms (SÀN CŨ
  CHẶN test 1 ms):** probe HOÀN THÀNH exit 0 (run-attempt exit=0
  09:55:32Z). Pass 1: 28 khung rAF, 28 đo được, 3628 ms. Log:
  `partial JSON đã ghi: 1/1 pass (sau pass, tickCost ok n=25)` —
  đường thường với helper mới hoạt động. Final JSON tickCost n=25.
  Lớp B trial: B5 VI PHẠM (RAM min 396 MB) — đã dự kiến (RAM miễn
  theo phụ lục 3); không dùng kết luận ngưỡng. Lưu ý trung thực:
  log probe trial0d đã BỊ GHI ĐÈ khi trial0e chạy lại cùng TAG
  (tee truncate) — bằng chứng còn lại: final JSON (đã copy sang
  `preview-b-f3-flip-webkit-t3-trial0d-final.json`), classb
  (đã copy `classb-t3-trial0d.txt`), chain log (append) + ghi nhận
  trong phiên làm việc. Từ trial0e trở đi, file log/JSON/classb
  được copy sang tên riêng ngay sau mỗi lần chạy.
- **(iv) trial0e — 1 pass, timeout 1 ms (ÉP NHÁNH TIMEOUT, sau khi
  hạ sàn):** probe HOÀN THÀNH exit 0 (run-attempt exit=0 09:59:12Z).
  Pass 1: 36 khung rAF, 36 đo được, 3563 ms. Log chứng minh nhánh
  timeout hoạt động đúng như thiết kế:
  - `writePartial tickCost TIMEOUT sau 1ms (sau pass) — giữ tc cũ
    n=0 (lần fetch timeout này không ghi đè)`
  - `partial JSON đã ghi: 1/1 pass (sau pass, tickCost timeout n=0)`
  - `y2Logs cuối TIMEOUT sau 1ms — dùng y2 rỗng (như fallback cũ)`
  Final JSON: tickCost n=0, blendTick n=0 (cả 2 fetch đều timeout
  như ép buộc), passes 1×36 khung — probe KHÔNG kẹt, thoát 0.
  **Đây là bằng chứng trực tiếp: với timeout 30 s, trường hợp trang
  không trả lời evaluate như đợt 120 sẽ chỉ làm mất tối đa 30 s rồi
  probe ghi partial tiếp thay vì kẹt vĩnh viễn.**
- **(v) Đường thường với timeout mặc định 30 s:** chứng minh bởi
  attempt1 (§4) — 20/20 pass, mọi lần ghi partial đều `tickCost ok`
  (n tăng đều 25→529), không một lần timeout nào. Trial1 riêng
  (1 pass, timeout mặc định) KHÔNG chạy — attempt1 đã bao phủ đường
  thường mạnh hơn (20 pass thay vì 1), ghi rõ để khỏi hiểu lầm.

## 3. Gate 0 — boot #62 KHÔNG ĐẠT; boot #63 ĐẠT NHỜ REPAIR (T5)

- **Boot #62 — gate0-wait 5 poll (08:44:33Z–08:52:39Z), KHÔNG ĐẠT:**
  poll #1–#2 postboot FAIL (replay mới chạm, dpkg 2 dòng); poll #3
  dpkg 349 dòng, load1 12,71 (replay đang cài); poll #4–#5 postboot
  PASS (exit=0) nhưng apt vẫn chạy (apt_procs 3–4, apt-get pid
  18393) → (0c) không đạt. Reboot 08:53:05Z cắt trước khi apt im.
  Log: `gate0-wait-t3.log` + `postboot-t3-b62-gate0wait-<n>.log`.
  (Hậu tố b62 trong tên file log của run-t3.sh là di sản copy từ đợt
  120 — nội dung log ghi đúng boot 08:25:47Z, không nhầm boot.)
- **Boot #63 — gate0-wait-b63 18 poll (08:55:27Z–09:29:39Z), ĐẠT ở
  poll #17–#18 NHỜ REPAIR:**
  poll #1–#16 postboot FAIL (replay chết dạng B, dpkg 2 dòng,
  aptx=0, dpkgx=0, RAM 833–2819 MB, load1 0,33–7,59); poll #17
  (09:27:38Z) postboot PASS, dpkg 759 dòng, aptx=0; poll #18
  (09:29:39Z) postboot PASS, dpkg 759, aptx=0. T7FLAG=chua-co
  suốt 18 poll (T7 không viết POSTBOOT_PASS cho #63).
  Log: `gate0-wait-t3-b63.log` + `postboot-t3-b63-gate0wait-<n>.log`.
- **Thích ứng (0a') — xem prereg phụ lục 2:** gate 0 ĐẠT dựa trên
  T5 POSTBOOT_PASS (mtime 09:28:14Z, boot_id `725453a2…` khớp #63,
  nhãn "PASS NHỜ REPAIR, KHÔNG PHẢI REPLAY" + caveat symlink) +
  check-only riêng của T3 PASS (exit=0, 09:32Z, log
  `postboot-t3-b63-final-check.log`) + apt quiet (pgrep -x = 0) +
  cây md5. T7 độc lập tuyên GATE 0 DAT ở poll #17 của chính T7
  (09:27:51Z, postboot_exit=0, dpkg 759, aptx=0). Mọi lượt đo trên
  boot này đều ghi rõ "PASS NHỜ REPAIR (T5)" — không gọi là replay
  tự chạy.
- **Caveat symlink của T5 (đọc kèm PASS):** thư mục plugin hệ thống
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` là symlink → debroot
  (ephemeral, mất sau reboot); file plugin của apt đã ghi QUA symlink
  vào debroot (269 file, ghi đè cùng tên); decode mp4/H.264 qua
  plugin đủ (isomp4 + libav có mặt qua symlink) — cùng cơ chế O8
  21/21 PASS ở #45. Probe chạy với GST_PLUGIN_PATH trỏ đúng thư mục
  symlink này; video decode được trong cả 3 lần chạy (trial0d/e +
  attempt1: 28–36 khung/pass, 0 pageErrs). Nếu debroot bị xóa/dời
  thì decode sẽ gãy dù dpkg vẫn báo đã cài.

## 4. Attempt1 trên boot #63 — 1 LƯỢT YÊN HỢP LỆ (20/20 pass, lớp B 5/5)

### 4.1 Gate 0 kiểm lại + gate A (09:59:41Z)

- run-t3.sh gate 0 try 1: postboot_exit=0, apt_grep=0, aptx=0,
  dpkgx=0 → PASS ngay (không cần try 2).
- Gate A poll 1 (09:59:41Z): load1=0,74, load5=0,77, lock TRỐNG,
  blockers=0, RAMavail=1145 MB, tree=YES:md5=5be5a250 → **CỬA YÊN
  MỞ NGAY poll 1**. ps-before ghi 09:59:41Z.
- Probe start 09:59:4xZ, vite :5187 lên nhanh, lock v2 giữ bởi t3
  (port 5187). Flip rVFC tắt sau pass 5 (wallMs=27189).

### 4.2 Diễn biến probe (20 pass, fixture nonperiodic, --disable-rvfc)

- Pass 1–20 chạy BÌNH THƯỜNG, mỗi pass ~3,4–3,6 s wall-clock,
  27–38 khung rAF/pass (median 32), 100% đo được, không pageErrs.
  Mọi lần ghi partial đều `tickCost ok` (n tăng đều 25→529) —
  KHÔNG một lần timeout nào: trang trả lời evaluate suốt lượt
  (khác hẳn đợt 120 kẹt sau pass 17). run-attempt exit=0.
- Không reboot, không replay, không probe luồng khác trong cửa sổ
  (ps-before TRỐNG hoàn toàn về vite/probe/WebKit; ps-after chỉ có
  vite :5187 + lock run-attempt của chính T3 — xem §5).
- Postboot sau lượt: vẫn PASS đầy đủ (DU DIEU KIEN, boot
  08:53:05, log `postboot-t3-b63-after-attempt1.log`). Cây md5 không
  đổi (5be5a250 / 2c384ed1).

### 4.3 Số đo chính — LƯỢT YÊN HỢP LỆ (20/20 pass, lớp B 5/5)

- **tickCost total: n=530, median=52,0 ms, p90=80,0 ms, max=111,
  min=26 | hậu flip+2000ms: n=390, median=52,0 ms.**
  (So sánh: S5 49,5 / T4 đợt 118 attempt8 40,0 / N1 50,0 / N4 58,0.
  Median 52,0 cao hơn 40,0 của đợt 118 nhưng vẫn trong ngưỡng ≤60
  với biên 8 ms; không phải xác nhận ngưỡng thắt chặt, cũng không
  phải dấu hiệu mở lại.)
- **Wallbands (đăng ký trước):** 0–20k n=67 median 58,0 / 20–32k
  n=95 median 50,0 / 32–45k n=101 median 54,0 / 45–62k n=136 median
  50,5 / 62–70k n=67 median 56,0 / 70–80k n=64 median 41,5.
  Profile gần phẳng, không tăng hậu flip (median hậu flip 52,0 =
  toàn lượt 52,0). Dải 0–20k cao nhất (58,0 — warm-up) và 62–70k
  (56,0) cao hơn các dải giữa ~50 — chênh ~6–8 ms, ghi nhận như
  biến thiên bình thường, không phải xu hướng tăng.
- **(b) unique-match + F6' + lag5: CÓ ĐẦY ĐỦ DỮ LIỆU (khác đợt 120).**
  - labellag lát (b): skp=1: nTick=64, nomatch 0/128 (0,0%), lag
    median 0f, p90 1f, max 3f, ≥+5f: 0. skp=0: nTick=252, nomatch
    0/504 (0,0%), lag median 1f, p90 3f, max 4f, ≥+5f: 0.
    (c2) "dang ngo thật": 3 occurrence ở skp=0, đều lag +1f
    (seq 129/253/326, presented 16, label 15) — lệch nhãn +1 frame
    nhỏ, KHÔNG phải stale-ghost (cần ≥+5f + pixels đứng yên).
  - skiplatest bar (1)/(2): skp=1 n=64 (≥30): (1) nhãn 100,0%
    (bar ≥90%), (2) pixel-verified 100,0% (bar ≥90%) →
    **"F6' ĐÓNG — skipLatest pixel-verified trên WebKit"**
    (xác nhận lại; F6' vẫn ĐÃ ĐÓNG từ L7, không đóng/mở lại).
    skp=0 đối chứng cũng 100%/100%.
  - lag5: **(b) lag ≥+5f: 0 occurrence, 0 event** — không tái hiện
    event P4 (frame 26), Q5 (frame 68), hay T4 đợt 118 (frame 23).
- **Verdict ngưỡng (theo prereg §1, lượt ĐẠT lớp B): GIỮ ngưỡng
  ≤60 ms.** Lượt yên theo dõi lần 3 sau khi chốt (S5 → T4 đợt 118
  attempt8 → T3 đợt 121 attempt1). Không siết (1 lượt tốt chưa đủ;
  median 52,0 cũng không gợi ý siết). **Nợ lượt yên theo dõi ĐỢT 120
  ĐÃ ĐÓNG.**

## 5. Kiểm chứng lớp B — ĐẠT 5/5

- Sampler 20 s: n=10 mẫu (09:59:43Z–10:02:44Z). load1 0,39–1,35;
  **RAM avail 747–1207 MB, min 747 MB, max 1207 MB; 0 mẫu <500 MB;
  4/10 mẫu <1024 MB (cảnh báo, không vi phạm).** RAM dao động mạnh
  trong lượt (747→1207 MB) — áp lực host, không phải bleed của
  probe (không rơi đều như đợt 120: 1012→440 MB).
- **B1 (load5 cuối ≤2,5): ĐẠT** (load5 lúc kết thúc 0,84).
- **B2 (load1 giữa lượt ≤4 + không process phân tích nặng luồng
  khác): ĐẠT.** load1 max 1,35 ≤ 4. ps-before: KHÔNG CÓ process
  vite/probe/MiniBrowser/WebKit nào (trống hoàn toàn); ps-after:
  chỉ có lock run-attempt của chính T3 + vite :5187 của chính T3
  (3 dòng npm/sh/node vite cùng 1 vite). Không thấy probe/vite của
  luồng đợt 121 khác trong cửa sổ.
- **B3 (không reboot trong lúc đo): ĐẠT** (boot 08:53:05 trước =
  sau).
- **B4 (không replay apt/dpkg trong cửa sổ): ĐẠT** (apt/dpkg lúc
  đánh giá = 0; postboot vẫn PASS sau lượt).
- **B5 (RAM giữa lượt không <500 MB): ĐẠT** (RAM min 747 MB, 0 mẫu
  <500 MB). **→ Lượt ĐẠT điều kiện yên.**
- Lưu ý: RAM lúc bắt đầu lượt 1145 MB (gate A) rồi rơi xuống 747 MB
  giữa lượt (mẫu 10:01:03Z) rồi hồi lên 1207 MB — dao động host,
  không phải bleed đơn điệu. B5 vẫn ĐẠT vì min > 500 MB.

## 6. Kiểm chứng hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `5be5a250…` không đổi: ghi lúc bắt đầu
  (08:39Z) = mọi poll gate0-wait (5 poll #62 + 18 poll #63) = kiểm
  cuối (10:04Z). `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 10:04Z, ~28 s).
  `vite build`: KHÔNG chạy lại — cây H3f đã được T1 verify sau apply
  đợt 119 (tsc exit 0 + vite build PASS 7,03 s, 23:57Z 15/11); cây
  md5 không đổi nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code production;
  test 15/15 PASS gần nhất là đợt 118 trên cây cũ (03bf029f), không
  hiểu là đã chạy trên cây H3f. Ghi rõ để khỏi hiểu lầm.
- Dry-run analyzer PASS (§0): S5 → 49,5/75,0; T4 attempt8 đợt 118 →
  40,0/64,7 (khớp 100%).

## 7. Sự cố hạ tầng + vận hành trong lúc đo

1. **Reboot #63 08:53:05Z (boot_id `725453a2…`, gap #62→#63 =
   27'18"):** xảy ra GIỮA lúc gate0-wait boot #62 đang chạy (poll
   #5 08:52:39Z) — giết toàn bộ tiến trình nền của T3 (gate0-wait +
   poller 5 phút + mon-check). T3 khởi động lại cả 3 trên boot mới
   theo tiền lệ đợt 120 phụ lục 2 (log hậu tố b63 tách riêng).
   Bài học: kiểm "ALIVE" bằng pgrep PHẢI dùng mẫu bracket `[.]`
   (lần kiểm 08:54Z cho "ALIVE" giả do pgrep tự khớp cmdline của
   chính lệnh kiểm).
2. **Replay boot #63 "chạm mà không cài" (lần 2 sau #60):** dpkg.log
   2 dòng 08:53:53Z rồi im 15+ phút, 0 apt/dpkg, /var/log/apt không
   tồn tại, lists trống. T5 chạy `--repair` MỘT LẦN có giám sát
   (luật replay-chết đã duyệt, parent quyết đợt 120 §12 mục 3) →
   PASS. Đây là lần ĐẦU TIÊN `--repair` chạy sống có giám sát
   (trước đây code chưa từng chạy sống). T3 chỉ check-only, không
   tự repair (đúng task).
3. **apt-get update của repair chạy 9+ phút ở 0,0% CPU** (pid 15056,
   09:14–09:23Z) trước khi chuyển sang install (pid 19075 mới) —
   tải list chậm (partial/ chứa ~460 MB file list cũ, dir mtime
   09:23Z). Ghi nhận cho T5: update chậm nhưng cuối cùng vẫn OK
   (install xong 09:26:57Z, đủ 11 gói).
4. **RAM host bị ghim thấp (~440 MB, xem §0 + §5):** gate A KHÔNG
   MỞ trong 2 cửa sổ 10 phút liên tiếp (trial0 09:31–09:41Z + retry
   09:42–09:52Z) dù máy yên hoàn toàn (load1 0,3–0,8, load5 <2,
   lock trống, blockers 0). Chỉ 17 process / 311 MB RSS trong cell
   nhưng MemFree ~155 MB — áp lực từ ngoài cell. Đã xử lý bằng phụ
   lục 3 (miễn RAM chỉ cho pass thử chức năng); lượt yên attempt1
   vẫn giữ gate A đầy đủ và mở ngay poll 1 khi RAM hồi lên 1145 MB.
5. **Lỗi đếm blocker tự khớp trong trial-run.sh:** `grep -E` thiếu
   `grep -v "grep -E"` nên chuỗi "WebProcess" trong cmdline của
   chính grep làm blockers luôn =1, gate trial không mở 3 poll.
   Đã sửa (thêm `grep -v "grep -E"` như run-t3.sh), chạy lại
   trial0d thành công. Bài học: mọi bộ đếm ps bằng grep đều phải
   loại chính tiến trình grep (cùng họ với bài học dương tính giả
   apt đợt 120 §7.2).
6. **Runtime restart / exec gián đoạn:** 2 lần exec nền của T3 bị
   gián đoạn do service restart (~08:52Z và ~09:05Z) — các tiến
   trình detached (gate0-wait, poller, mon-check) sống qua, T3 kiểm
   tra lại trạng thái từ đĩa; không mất dữ liệu. (Lần 2: 2 lệnh
   sleep trùng lặp do T3 gửi nhầm — lỗi vận hành của T3, không ảnh
   hưởng kết quả.)
7. **T7 không viết POSTBOOT_PASS cho #63** dù gate-waiter của chính
   T7 tuyên GATE 0 DAT ở poll #17 (09:27:51Z) — nhãn "boot #62"
   trong log T7 là text cũ (dữ liệu là của #63). T3 đã xử lý bằng
   thích ứng (0a') với POSTBOOT_PASS của T5 (prereg phụ lục 2).
   Đề xuất: T7 nên viết file PASS ngay khi gate-waiter của mình
   tuyên ĐẠT (hoặc ghi rõ khi nào không viết).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND121_T3_WEBKIT60MS_LIMITS.md` — file này.
- `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` — probe ĐÃ SỬA
  (copy từ hidden_files, md5 `dccb8f4c…`, 57.283 byte — OVERSIZE
  >37.768, lúc push cần ENABLE_PRIVSEP=0). Vị trí theo tiền lệ
  `benchmarks/render/` (vd `webkit_blob_flaky_120t3.mjs` của T3 đợt
  120, `f2_startup_probe_121t7.mjs` của T7 đợt 121).
- **KHÔNG đổi file production nào** (preview.tsx / media.ts md5
  trước = sau).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round121-t3-webkit60ms.txt`
  (NUL-delimited, 2 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t3/`
  (prereg-t3.md [viết trước khi đo + phụ lục 1 (reboot #63) + phụ lục
  2 (gate 0 nhờ repair, thích ứng (0a')) + phụ lục 3 (miễn RAM cho
  pass thử)],
  probe121t3-ghost-k7.webkit.mjs [ĐÃ SỬA, md5 `dccb8f4c…`,
  node --check OK],
  analyze-t3-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 120, md5 khớp bản đợt 120],
  analyze-t3-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  b.json [copy đợt 120, md5 `078938cf…`],
  vite.t3-temp.config.mjs [copy đợt 120, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t3.sh [adapt đợt 121: PASSES + TICKCOST_TIMEOUT_MS chuyển
  qua được; gate 0 kiểm apt bằng pgrep -x],
  t3-attempt-inner.sh [adapt: $2=PASSES, $3=TICKCOST_TIMEOUT_MS],
  trial-run.sh [mới: chạy pass thử theo phụ lục 3 — gate A rút gọn,
  miễn RAM, giữ load/lock/blocker/cây],
  check-classb-t3.sh [lớp B gồm B5],
  gate0-wait-t3.sh [boot #62: 5 poll] +
  gate0-wait-t3-b63.sh [boot #63: 18 poll, log hậu tố b63],
  gate0-wait-t3.log [boot #62: 5 poll] +
  gate0-wait-t3-b63.log [boot #63: 18 poll, GATE 0 ĐẠT poll #17–#18],
  poll-t3.log [mẫu 5 phút + gate0/gateA/trial],
  poll-t3.nohup.log, gate0-wait-t3.nohup.log,
  gate0-wait-t3-b63.nohup.log, mon-check.sh + mon-check.log +
  mon-check.nohup.log,
  chain-t3.log [trial0 (exit 5, gate A) + trial0 retry (exit 5) +
  trial0d (exit 0) + trial0e (exit 0) + attempt1 (exit 0)],
  postboot-t3-b62-gate0wait-{1..5}.log [boot #62: FAIL #1–#3, PASS
  #4–#5 (apt vẫn chạy)] +
  postboot-t3-b63-gate0wait-{1..18}.log [boot #63: FAIL #1–#16,
  PASS #17–#18] + postboot-t3-b63-final-check.log [check-only
  riêng PASS, 09:32Z] + postboot-t3-b63-after-attempt1.log
  [vẫn PASS sau lượt] +
  postboot-t3-b62-trial0-gate0.log [gate 0 kiểm lại trial0],
  run-t3-trial0.nohup.log, run-t3-trial0b.nohup.log,
  run-t3-trial0c.nohup.log, run-t3-trial0d.nohup.log,
  run-t3-trial0e.nohup.log, run-t3-attempt1.nohup.log,
  run-webkit-t3-trial0.log [trial0e: TIMEOUT 1ms + partial timeout;
  log probe trial0d đã BỊ GHI ĐÈ khi trial0e chạy lại cùng TAG (xem
  §2) — bằng chứng trial0d còn lại: final JSON + classb đã copy +
  chain log (append)] + run-webkit-t3-trial0e.log [trial0e: TIMEOUT
  1ms + partial timeout] + run-webkit-t3-attempt1.log [20/20 pass,
  tickCost ok mọi pass],
  vite-5187-t3-trial0.log + vite-5187-t3-attempt1.log,
  load-mid-t3-trial0.log + load-mid-t3-attempt1.log [n=10],
  ps-before-t3-trial0.txt / ps-after-t3-trial0.txt /
  ps-before-t3-attempt1.txt / ps-after-t3-attempt1.txt,
  marker-t3-trial0, marker-t3-attempt1,
  preview-b-f3-flip-webkit-t3-trial0.json [trial0e cuối: tickCost
  n=0 (ép timeout 1ms)] +
  preview-b-f3-flip-webkit-t3-trial0d-final.json [trial0d: tickCost
  n=25, status ok] +
  preview-b-f3-flip-webkit-t3-trial0e-final.json [trial0e: tickCost
  n=0] +
  preview-b-f3-flip-webkit-t3-attempt1.json [20/20 pass, tickCost
  n=530 — DỮ LIỆU CHÍNH],
  analyze-t3-a1-{tickcost,wallbands,labellag,skiplatest,lag5}.txt
  [phân tích attempt1: median 52,0; (b) nomatch 0; F6' 100%/100%;
  lag5 0 event],
  tree-md5.txt [`5be5a250`] + tree-md5-check.txt,
  classb-t3-trial0.txt [trial0e] + classb-t3-trial0d.txt [trial0d:
  B5 VI PHẠM, RAM min 396MB] + classb-t3-trial0e.txt [trial0e] +
  classb-t3-attempt1.txt [B1/B2/B3/B4/B5 ĐẠT]).
- Cờ xong: `hidden_files/round121-t3.done` (kèm verdict 1 dòng).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — 1 lượt yên hợp lệ đợt 121
   (attempt1, median 52,0 ms, lớp B 5/5). Nợ lượt yên theo dõi ĐỢT
   120 ĐÃ ĐÓNG.** Lượt yên theo dõi thường kỳ tiếp tục ở các đợt
   sau theo cùng prereg (gate 0 + lớp A + lớp B gồm B5) trên cây
   hiện tại (H3f, md5 5be5a250). Median 52,0 cao hơn 40,0 (đợt 118)
   — theo dõi xem đây là biến thiên lượt hay xu hướng (các lượt yên
   đã có: 40,5 / 50,0 / 58,0 / 49,5 / 40,0 / 52,0).
2. **Fix probe ĐÃ XONG + KIỂM CHỨNG SỐNG (nợ §9.2 đợt 120 ĐÃ
   ĐÓNG):** writePartial có timeout 30 s + giữ tc cũ + ghi trạng
   thái; fetch y2 cuối cũng có timeout. Nợ còn lại: các `pwEval`
   khác (flip, y2SeqStart, setup) vẫn không timeout — cân nhắc bọc
   helper cho toàn bộ pwEval ngoài vòng pass (hoặc watchdog tổng
   cho toàn bộ lượt, vd không tiến >3 phút thì tự thoát 3 với
   partial hiện có — đề xuất (c) của LIMITS T4 đợt 120 §9.2).
3. **Replay-chết dạng (B) tái hiện trên boot #63 (lần 2 sau #60):**
   T5 đã chạy `--repair` thành công lần đầu tiên có giám sát (luật
   đã duyệt) — quy trình repair hoạt động (update chậm ~12 phút
   nhưng install OK đủ 11 gói). Đề xuất: T5/T7 ghi lại thời gian
   update chậm này vào runbook repair (apt-get update 0,0% CPU 9+
   phút — bình thường hay bất thường?); T7 viết file POSTBOOT_PASS
   ngay khi gate-waiter của mình tuyên ĐẠT (đợt này T7 tuyên ĐẠT
   nhưng không viết file, T3 phải dùng cờ của T5).
4. **RAM host bị ghim thấp (~440 MB) + dao động mạnh (747–1207 MB
   trong lượt yên):** áp lực từ ngoài cell (17 process / 311 MB RSS
   nhưng MemFree ~155 MB). Gate A (RAM ≥1024 MB lúc bắt đầu) và B5
   sẽ khó đạt ở các lượt sau nếu host không hồi RAM. Đề xuất: luồng
   riêng đo RAM baseline của trang preview khi chạy idle (nợ quan
   sát từ đợt 120 §9.4, vẫn mở) để tách bleed của trang khỏi áp lực
   host; và ghi nhận RAM host là yếu tố ngoài tầm kiểm soát của
   luồng đo (không hạ ngưỡng RAM để "cho qua").
5. **(c2) "dang ngo thật" +1f (3 occurrence, seq 129/253/326,
   presented 16, label 15):** lệch nhãn +1 frame nhỏ, không phải
   stale-ghost (lag <5f). Ghi nhận để theo dõi ở lượt sau; nếu tái
   hiện đều ở cùng presented/label thì chuyển T5 chẩn đoán.
6. **Stale-ghost:** 0 event đợt 121 (không tái hiện P4/Q5/frame-23).
   Theo dõi tiếp ở các lượt yên sau.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 120 §10 + quyết parent
   §12:** E4 lô đo (T2 đợt 121 — xem LIMITS T2); trục tải PSI
   (T3 đợt 121 — định nghĩa mới, leg B cũ DỪNG); G1 khung (a) M2
   HOÃN chờ user; luật replay-chết ĐÃ CÓ HIỆU LỰC đợt 121 (T5 chạy
   repair thành công lần đầu); gap #57→#58 thành khoảng [4807,
   5139]s (parent CHẤP NHẬN); mù #38 G mở (T5 đợt 120); birefnet 0
   lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user;
   release gate không đổi. Reboot mới nhất: boot #63 08:53:05Z
   (gap #62→#63 = 27'18"). 3/10 luồng đợt 121 đã DONE lúc T3 dừng
   (T2, T6 + T3 này); các luồng còn lại xem build-loop-log.

# PHASE9_ROUND125_T9_WEBKIT60MS_LIMITS — WebKit lượt yên theo dõi lần 5: ĐÓNG — 1 LƯỢT YÊN HỢP LỆ, median 47,5 ms — ngưỡng GIỮ

> Luồng T9, đợt 125, lượt cron 03:35 +07 17/11/2026 (bắt đầu ~20:41Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — NỢ LƯỢT YÊN THEO DÕI LẦN 5 ĐÃ ĐÓNG.**
> 1. **Attempt1: LƯỢT YÊN HỢP LỆ (20/20 pass, lớp B 5/5 ĐẠT).**
>    tickCost total median **47,5 ms** (p90 70,0; n=614) — lần yên
>    hợp lệ thứ 4 sau khi chốt (S5 49,5 / T4-118 40,0 / T3-121 52,0
>    / **T9-125 47,5**).
> 2. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi)** theo quy tắc quyết
>    định prereg §1 (median 47,5 ≤ 60). Không siết tiếp chỉ từ 1
>    lượt — siết cần thêm lượt yên độc lập.
> 3. **Reboot cắt giữa chừng (20:54:19Z, boot #69 → #70)** trước khi
>    đo — 0 pass mất, gate0-wait + poller chết theo boot cũ, T9
>    khởi động lại trên boot #70 theo phụ lục prereg (viết trước
>    khi đo trên boot mới). Gate 0 đạt ngay poll #1 trên boot #70.
> 4. **Đo RAM baseline idle (ngoại lệ MỘT LẦN, quyết parent §12.6):
>    XONG.** Trang preview idle tốn ~800 MB (WebKit ~689–728 MB +
>    vite ~99 MB, bình ổn sớm); 3 mẫu cuối nhiễu (chưa rõ nguyên
>    nhân, ghi rõ — không dùng để kết luận); MemAvailable dao động
>    ±300 MB ngay cả khi idle (áp lực host). Nợ đợt 120 §9.4 ĐÓNG.
> 5. **Nợ sửa sampler (LIMITS T9-124): ĐÃ SỬA + VERIFY.** Sampler
>    dừng trong ~1 s sau khi node thoát (sampler-stop 21:11:49,
>    alive=NO, 10 mẫu, không mẫu hậu đo).
> 6. Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…`
>    khớp). tsc apps/web exit 0. T9 không sửa production.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round125-t9/prereg-t9.md` — viết TRƯỚC
  mọi phép đo (20:43Z), đăng ký: chờ cờ postboot T5 đợt 125 (thư
  mục `round125-t5`, KHÔNG chờ cờ đợt cũ), gate 0 + lớp A + lớp B
  gồm B5, ngưỡng ≤60 ms, quy tắc quyết định, đo RAM idle sau
  attempt (ngoại lệ một lần), sửa sampler trước khi đo, touch cờ
  `round125-t9-done` ngay khi attempt xong để T4 bắt đầu leg tải.
  **Phụ lục 1** (viết 21:04Z, TRƯỚC khi đo trên boot mới): reboot
  20:54:19Z, khởi động lại gate0-wait + poller trên boot #70, hậu
  tố file `b670c07f6` → `b310f07e4`, mọi quy tắc khác không đổi.
  Gate-0 waiter đếm apt bằng `pgrep -x` (luật đứng). Không có phụ
  lục bổ sung khác.
- **Boot trong đợt: HAI boot — #69 rồi #70 (reboot cắt giữa chừng).**
  Boot #69 (`uptime -s` 2026-11-16 20:35:11Z, boot_id
  `670c07f6-2299-43f6-951c-0cf1116afd6d`): T9 bắt đầu trên boot này
  (~20:41Z, boot ~6' tuổi), gate0-wait poll #1–#5 (20:45:53–
  20:53:55Z, postboot exit 1, dpkg 2 dòng — replay chưa xong), chưa
  chạy attempt nào. **Reboot 20:54:19Z** → boot **#70** (`uptime -s`
  2026-11-16 20:54:19Z, boot_id `310f07e4-f789-427a-bee8-a9aefd5a1f02`,
  số #70 theo tên file `t5-postboot-b70-*` của T5).
  Gap #68→#69 = 3h01'20"; #69→#70 = 19'08".
- **Replay boot #70: CHẠY TỐT, NHANH** (theo cờ T5 + kiểm riêng):
  dpkg 2→1509 dòng; T5 POSTBOOT_PASS cho boot #70
  (`boot_id=310f07e4… btime=20:54:19Z pass_at=20:59:21Z poll=3`,
  mtime 20:59:22Z) — PASS GST (isomp4 + libav) + PASS apt 11 gói.
  Luật repair dạng (C) KHÔNG cần kích hoạt.
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 20:41Z = mọi poll gate0/gate A = kiểm
  cuối 21:18Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t9-tickcost.py`
  + `analyze-t9-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 và trên JSON T4 attempt8 đợt 118 tái tạo
  đúng median 40,0 / p90 64,7 (khớp 100% với dry-run đợt 120/121/
  122/123/124). Analyzer copy từ đợt 124 hoạt động đúng. (Lưu ý kỹ
  thuật giữ nguyên: tickcost/wallbands cần đối số dạng `tag=path`,
  còn labellag/skiplatest/lag5 lấy path trần — lần gọi đầu 3
  analyzer sau quên nên lỗi FileNotFoundError, đã gọi lại đúng và
  PASS; không ảnh hưởng số đo.)
- **RAM host dao động mạnh (xem §7.1):** 724–2021 MB trong đợt;
  lúc mở đợt 1201 MB, lúc gate A mở 1640 MB, giữa lượt đo rơi
  xuống 724 MB rồi hồi. Vite vẫn chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) theo protocol.
- **Vite lock v2-ONLY**, cổng T9 **5187**. Lock do T9 giữ CHỈ trong
  lúc chạy probe attempt1 (21:08–21:11Z) + đo RAM idle (21:14–
  21:15Z); các thời điểm khác lock thuộc T2 (port 5590) hoặc trống.
- **Các luồng đợt 125 khác:** T4 đợt này ĐÃ CHỜ cờ T9 đúng hẹn
  (`wait-t9-flag.sh`, chưa có hog nào trước 21:14:15Z) — cửa yên
  sạch, khác hẳn đợt 124. T2 chạy E4 lượt 8 song song nhưng chỉ
  chờ cờ T1/T5 trong cửa sổ tick của T9 (xem §4.4 — không nhiễm).
  T1, T3, T6 đã DONE lúc T9 dừng; T4 bắt đầu leg tải sau cờ T9.

## 1. Gate 0 — boot #69 KHÔNG ĐẠT (replay chưa xong); boot #70 ĐẠT NGAY POLL #1 (21:04:57Z)

- **Boot #69 (20:45:53–20:53:55Z, poll #1–#5):** t5flag=chưa-có
  (T5 chưa viết cờ — replay mới bắt đầu, dpkg 2 dòng) +
  postboot-check riêng exit 1 + apt_procs=0 (pgrep -x) + load1
  0,70–3,21 + RAMavail 1357–2021 MB + preview_md5=03bf029f.
  **GATE 0 CHƯA ĐẠT** (thiếu 0a + 0b). Reboot 20:54:19Z cắt
  gate0-wait sau poll #5 (chưa hết 10 poll) — không phải do lỗi
  waiter.
- **Boot #70 (21:04:56Z, poll #1 — duy nhất, exit 0):**
  t5flag=PASS (T5 POSTBOOT_PASS cho #70, boot_id `310f07e4…`
  KHỚP, mtime 20:59:22Z ≥ boot 20:54:19Z — luật STALE thỏa) +
  t7flag=chưa-có + postboot-check check-only riêng PASS (exit 0)
  + apt_procs=0 (`pgrep -x apt-get`=0, `pgrep -x dpkg`=0)
  + dpkg_lines=1509 + load1=1,32 + RAMavail=1493 MB + preview_md5=
  03bf029f. **GATE 0 ĐẠT từ poll #1.** Không cần poll thêm.
- run-t9.sh gate 0 try 1 PASS ngay ở attempt1 (postboot 0,
  aptx 0, dpkgx 0; apt_grep=1 là dương tính giả grep-ps cũ trong
  log — quyết định dùng aptx/dpkgx pgrep -x = 0, xem LIMITS đợt
  123 §1.3).

## 2. Gate A — attempt1 MỞ poll 4 (21:08:29Z)

- Gate A poll 1–4: poll 1 load1=1,35 load5=2,26 blockers=3
  RAM=1281 MB (chặn: load5 + blockers); poll 2 load1=1,55
  load5=2,18 blockers=3 RAM=1344 MB (chặn: load5 + blockers);
  poll 3 load1=0,79 load5=1,84 blockers=3 RAM=1136 MB (chặn:
  blockers); **poll 4 (21:08:29Z) load1=0,94 load5=1,70 lock
  TRỐNG blockers=0 RAM=1640 MB tree=YES → CỬA YÊN MỞ**.
  Probe-start 21:08:29Z, boot #70 20:54:19, RAM 1640 MB,
  preview.tsx 03bf029f.
- Blockers poll 1–3 là tiến trình của luồng khác đang dọn sau
  reboot (T8 rerun-post-reboot + T2 chờ cờ) — tự hết trước poll 4,
  T9 không đụng gì.

## 3. Attempt1 (21:08:29–21:11:52Z) — LƯỢT YÊN HỢP LỆ, median 47,5 ms

- **Probe chạy 21:08–21:11Z, 20/20 pass, exit 0.** Vite :5187 lên
  sau 2 s; WebKit 27.2 launch OK; app boot OK; rVFC TẮT; TAP +
  RELABEL BẬT; sanity canvas OK; FLIP sau pass 5
  (wallMs=25557); partial JSON ghi tăng dần đủ 20/20 (tickCost ok
  n=614); Y2 pump log: pumpEvents=0, blendTicks=499,
  tickCost=614; pageErrs=[].
- **Số đo attempt1 (lượt YÊN HỢP LỆ):** tickCost total n=614
  **median=47,5 ms p90=70,0 max=111 min=28**; hậu flip+2000ms
  n=450 median=46,0; tBlend gap n=498 median=87,0 p90=117,0
  max=1614 (S5: median 93,0); BlendTick/pass=24,9 (S5: 23,3);
  rAF/pass median=36 min=32 max=43 (S5: median 34). Renderer
  khỏe suốt lượt — khác hẳn attempt2 đợt 124 (BlendTick/pass
  11,1, tBlend gap median 222).
- Phân rã wallMs (đăng ký trước): 0–20k n=93 median=51,0;
  20–32k n=116 median=47,0; 32–45k n=115 median=52,0; 45–62k
  n=163 median=43,0; 62–70k n=79 median=48,0; 70–80k n=48
  median=51,0 — **đều 43–52 ms ở MỌI dải, không có dải suy giảm**.
- **Lớp B (check-classb-t9.sh, đánh giá 21:11:52Z): 5/5 ĐẠT.**
  B1 ĐẠT (load5 lúc kết thúc 1,32 ≤ 2,5); B2 ĐẠT (load1 max 1,94
  trong sampler ≤ 4; không có process phân tích nặng của luồng
  khác trong cửa sổ tick — xem §4.4); B3 ĐẠT (không reboot;
  boot trước/sau đều 20:54:19Z); B4 ĐẠT (không replay apt/dpkg;
  postboot sau lượt exit 0); B5 ĐẠT (RAM min 724 MB, 0 mẫu
  <500 MB; 4/10 mẫu RAM <1024 MB — cảnh báo, không vi phạm).
- Sampler (đã sửa đợt này): n=10 mẫu, mẫu cuối 21:11:32Z;
  sampler-stop 21:11:49Z, alive=NO — **không mẫu hậu đo** (fix
  §4.1 đợt 124 đã verify trên production).
- **DỪNG sau attempt1 theo tiền lệ các lượt yên hợp lệ trước
  (S5/T4-118/T3-121 đều dừng ở lượt yên đầu tiên đạt):** 1 lượt
  yên hợp lệ đã đủ áp quy tắc quyết định prereg §1; không chạy
  attempt 2/3 (ngân sách cho phép tối đa 3 nhưng không bắt buộc).

## 4. Phân tích lượt yên attempt1

### 4.1 Verdict ngưỡng — GIỮ ≤60 ms (lượt yên theo dõi lần 5 ĐÓNG)

- **1 lượt yên hợp lệ đợt 125 (attempt1, median 47,5 ms).**
  Theo prereg §1 (median ≤ 60 ms → GIỮ): **ngưỡng WebKit ≤60 ms
  GIỮ NGUYÊN.** Không siết tiếp chỉ từ 1 lượt.
- Bốn lượt yên hợp lệ sau khi chốt: S5 49,5 ms (đợt 116, cây
  03bf029f) / T4-118 40,0 ms (đợt 118, cây 03bf029f) / T3-121
  52,0 ms (đợt 121, cây 5be5a250) / **T9-125 47,5 ms (đợt 125,
  cây 03bf029f)**. Trung bình 4 lượt = 47,3 ms; biên an toàn so
  với ngưỡng 60 ms là ~12–20 ms mỗi lượt.
- **Nợ lượt yên theo dõi lần 5: ĐÓNG — không chuyển tiếp sang
  đợt 126.** Lượt yên theo dõi tiếp theo (lần 6) sẽ do parent
  xếp khi cần, không còn là nợ quá hạn.

### 4.2 (b) unique-match + F6' trên lượt yên (kiểm lại, không đóng/mở lại)

- **(b) labellag:** skp=1: nTick=66, lag median=0f p90=1f max=3f,
  ≥5f: 0; (c2) = 0. skp=0: nTick=298, lag median=1f p90=2f max=3f,
  ≥5f: 0; (c) = 5 occurrence, (c2) = 5 (xem §4.3).
- **F6' (skiplatest):** skp=1 hậu flip+2000ms nTick=66 (cần ≥30);
  (1) nhãn 100,0% (bar ≥90%); (2) pixel-verified 100,0% (bar
  ≥90%) → các bar đạt TRÊN DỮ LIỆU LƯỢT NÀY. **F6' vẫn ĐÃ ĐÓNG từ
  L7 — T9 không đóng lại, không mở lại; đây chỉ là kiểm lại,
  không thay đổi trạng thái.**

### 4.3 (c2) "dang ngo that" +1f TÁI HIỆN DẠNG (ghi nhận, chuyển T5 chẩn đoán)

- (c2) skp=0: **5 occurrence, tất cả lag +1f:** (seq 203,
  presented 13, label 12), (252, 15, 14), (306, 15, 14),
  (430, 14, 13), (479, 16, 15). Dạng lệch nhãn +1f (presented =
  label+1) TÁI HIỆN như đợt 121 (3 occurrence, seq 129/253/326,
  presented 16, label 15) — nhưng KHÔNG khớp đúng cặp
  presented/label cũ (đợt này presented 13/14/15/16, label
  12/13/14/15). Ghi nhận chuyển T5 chẩn đoán theo prereg §3;
  T9 không kết luận hồi quy từ 5 sự kiện.
- skp=1: (c2) = 0 occurrence.

### 4.4 Stale-ghost — 0 occurrence; B2 kiểm chứng T2 không nhiễm

- **Stale-ghost (lag5):** (b) lag≥+5f: **0 occurrence** — các event
  cũ P4 seq 220–223 (frame 26), Q5 seq 282–285 (frame 68), T4 đợt
  118 frame 23 đều KHÔNG tái hiện. (c2) đợt 121: xem §4.3 (chỉ
  +1f, không ≥+5f). Gap presented-expected hậu flip: 364/364
  |gap|≤3 (median 0).
- **B2 — T2 trong cửa sổ tick (21:08:29–21:11:49Z):** ps-before
  chỉ có driver shell `run-t2.sh` (pid 3903, đang chờ cờ T1 —
  không vite/probe); T2 chờ cờ T1 tới 21:11:02Z rồi chờ cờ T5,
  postboot PASS 21:11:02Z, rồi mới đo lượt 8 att2 (giữ lock 34 s,
  nhả 21:12:27Z — tức acquire ~21:11:53Z, SAU khi probe T9 thoát
  21:11:49Z). Dòng `acquire t2-round125` trong ps-after là script
  lock đang chờ/bắt đầu, không phải probe/vite đang chạy. Load1
  max trong cửa sổ chỉ 1,94 — khớp máy yên. **B2 ĐẠT chắc chắn.**

## 5. Đo RAM baseline idle (ngoại lệ MỘT LẦN — XONG, xem `ram-idle-t9.md`)

- Chạy 21:14:15–21:15:30Z (SAU attempt, sau khi touch cờ T4 —
  T4 bắt đầu hog ~21:15:2x, sau mẫu cuối 21:15:17 nên cửa sổ idle
  KHÔNG nhiễm tải T4). Vite :5187 riêng, WebKit mở trang preview,
  app boot OK, idle 60 s, pageErrs=[], node exit 0.
- **Bình ổn sớm: WebKit RSS ~689–728 MB (3 mẫu liên tiếp),
  vite ~99 MB → trang preview idle tốn khoảng ~800 MB.**
  Baseline-pre (chưa vite/WebKit): RAMavail 1631 MB.
  idle-after: RAMavail 1549 MB.
- **Hạn chế (ghi rõ, không giấu):** 3 mẫu cuối nhiễu (WebKit RSS
  3,5 MB → 221 MB → 0 KB trong khi node vẫn sống, IDLE-DONE bình
  thường) — chưa rõ nguyên nhân (có thể WebProcess churn lặng
  trong lúc idle, hoặc sampler khớp tên tiến trình không ổn
  định); KHÔNG dùng 3 mẫu cuối để kết luận. MemAvailable dao động
  ±300 MB trong 60 s idle (1054→1377→1134→1341 MB) — áp lực host
  chi phối.
- **Ý nghĩa chẩn đoán:** bleed của trang (~800 MB) + dao động host
  giải thích vì sao gate A (RAM ≥1024 MB) đóng/mở thất thường: khi
  host chỉ còn ~1100 MB thì trang idle đã chiếm ~800 MB, không còn
  đệm cho WebKit đo. **Nợ đợt 120 §9.4: ĐÓNG.**
- Không chạy lại (ngoại lệ một lần). Số thô: `ram-idle-t9.log`.

## 6. Cây đo — baseline, không đổi

- preview.tsx md5 `03bf029f` không đổi: lúc bắt đầu (20:41Z) =
  mọi poll gate0/gate A = kiểm cuối (21:18Z). `media.ts` md5
  `2c384ed1` không đổi.
- T9 không sửa production: không có thay đổi nào do T9; cây giữ
  baseline theo quyết parent đợt 122 (H3f đã gỡ, không apply lại).
- **Nợ sampler ĐÃ SỬA trong bản copy đợt 125 của
  `t9-attempt-inner.sh`** (marker STOP + sleep 1 s × 20 + kill +
  kill -9 dự phòng; định dạng dòng log không đổi). Đã kiểm độc lập
  trên /tmp trước khi đo (dừng ~1 s, không mẫu hậu đo) + verify
  trên production (sampler-stop 21:11:49, alive=NO, 10 mẫu).
  **Nợ này ĐÓNG.** Probe KHÔNG đổi nên KHÔNG stage lại probe.

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 RAM host dao động (không ghim phẳng)

- RAMavail trong đợt: 724–2021 MB. Lúc mở đợt 1201 MB → 1375 MB
  → 1134 MB (boot #69) → gate A mở 1640 MB → giữa lượt đo rơi
  1560→892→803→724 MB (21:08:32–21:09:32Z) rồi hồi 1085→1154→
  1036 MB → sau lượt 1259–1549 MB. Không ghim phẳng như đợt 123
  (~474–576 MB); dao động mạnh như đợt 124 (882–3431 MB) — áp lực
  host-level (ngoài cell), khớp kết luận điều tra RAM đợt 124
  (tiến trình ghim không nhìn được từ trong VM).
- RAM giữa lượt rơi xuống 724 MB nhưng vẫn ≥500 MB nên B5 ĐẠT;
  4/10 mẫu <1024 MB chỉ là cảnh báo. Ngưỡng RAM giữ nguyên
  (không hạ để "cho qua").

### 7.2 Hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (20:41Z) = mọi poll gate0-wait/gate A = kiểm cuối (21:18Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 21:18Z, ~49 s).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo nào cần hồi quy thêm.
- Postboot-check sau lượt: exit 0 (21:18Z) — replay vẫn PASS sau
  khi đo xong (B4 hậu kiểm).

### 7.3 Sự cố hạ tầng + vận hành trong lúc đo

1. **Reboot 20:54:19Z cắt giữa chừng** (boot #69 → #70, gap
   19'08"): gate0-wait + poller T9 chết theo boot cũ; T9 khởi
   động lại trên boot #70 theo phụ lục prereg viết trước khi đo
   trên boot mới. 0 pass mất (chưa đo gì trên #69). T5 đã xử lý
   boot mới xong trước khi T9 poll lại (POSTBOOT_PASS 20:59:21Z).
2. **Phối hợp lịch T4 ĐÚNG HẸN đợt này:** T4 chờ cờ T9
   (`wait-t9-flag.sh`), không chạy hog trước 21:14:15Z; T9 touch
   cờ `round125-t9-done` ngay 21:14:15Z khi attempt xong; T4 bắt
   đầu hog ~21:15:2x. Cửa yên sạch — khác hẳn đợt 124 (Lc8-f2s
   nhiễm attempt2). Bài học giữ nguyên: xếp T4-load và T9-yên
   lệch nhau vẫn là cách duy nhất có lượt yên sạch.
3. **Analyzer cần đúng dạng đối số:** tickcost/wallbands lấy
   `tag=path`, labellag/skiplatest/lag5 lấy path trần — lần gọi
   đầu 3 analyzer sau quên nên lỗi FileNotFoundError; đã gọi lại
   đúng và PASS. Không ảnh hưởng số đo (phân tích chạy sau khi đo).
4. **pkill poller tự giết shell gọi:** `pkill -f "poll-t9.sh"`
   khớp cả dòng lệnh của chính shell gọi nên SIGTERM luôn phiên
   exec đó; poller vẫn chết (đã kiểm lại bằng `pgrep -af
   "poll-t9.s[h]"` = 0 process). Ghi lại để đợt sau dùng pattern
   tránh tự khớp.
5. **Gate0-wait script chỉ chạy 10 poll × 2 phút = 20 phút**
   (trong khi prereg đăng ký tối đa 60 phút): đợt này không ảnh
   hưởng (gate 0 đạt poll #1 trên boot #70), nhưng nếu T5 chậm
   hơn 20 phút thì waiter sẽ thoát sớm — đợt sau nên sửa script
   cho đủ 30 poll × 2 phút theo prereg, hoặc ghi rõ 20 phút là
   giới hạn script. T9 ghi nợ, KHÔNG sửa âm thầm giữa đợt.
6. **Nhãn file log hậu tố b310f07e4 đã dùng đúng boot mới** (sửa
   lỗi đặt tên đợt 123 §8.6 đã giữ qua đợt 124).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND125_T9_WEBKIT60MS_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại. Script `t9-attempt-inner.sh` đã sửa sampler (bản copy
  trong `hidden_files/round125-t9/`, ngoài repo — không stage).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round125-t9-webkit.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round125-t9/`
  (prereg-t9.md [viết trước khi đo + phụ lục 1 reboot viết trước
  khi đo trên boot #70],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t9-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 124],
  analyze-t9-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  analyze-t9-attempt1-{tickcost,wallbands,labellag,skiplatest,lag5}.txt
  [lượt yên hợp lệ: median 47,5/p90 70,0; (b) 0 lag≥+5f; (c2) 5
  occurrence +1f; F6' bar đạt trên dữ liệu này; lag5 0 occurrence],
  b.json [copy đợt 124, md5 `078938cf…`],
  vite.t9-temp.config.mjs [copy đợt 124, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t9.sh [adapt đợt 125: round125-t9, hậu tố log b310f07e4] +
  t9-attempt-inner.sh [adapt round125-* + **SỬA SAMPLER: marker
  STOP + sleep 1s×20 + kill/kill-9 — đã verify**] +
  check-classb-t9.sh [lớp B gồm B5 — ĐÃ CHẠY, attempt1: 5/5 ĐẠT] +
  gate0-wait-t9-b670c07f6.sh [boot #69, poll #1–#5, chết theo
  reboot] + gate0-wait-t9-b310f07e4.sh [boot #70 — 1 poll, GATE 0
  ĐẠT] + gate0-wait-t9-b670c07f6.log + gate0-wait-t9-b310f07e4.log
  + gate0-wait-t9-b310f07e4.nohup.log,
  ram-idle-t9.sh + ram-idle-t9.mjs [MỚI: đo RAM baseline idle] +
  ram-idle-t9.log [số thô] + ram-idle-t9.md [kết luận: ~800 MB,
  3 mẫu cuối nhiễu] + ram-idle-t9-node.log +
  vite-5187-t9-ramidle.log,
  poll-t9.sh + poll-t9.log [mẫu 5 phút + gate0/gateA: boot #69
  poll #1–#5, boot #70 gate A poll 1–4] + poll-t9.nohup.log,
  postboot-t9-b670c07f6-gate0wait-{1..5}.log [boot #69: exit 1] +
  postboot-t9-b310f07e4-gate0wait-1.log [boot #70: PASS] +
  postboot-t9-b310f07e4-attempt1-gate0.log [gate 0 run-t9.sh: PASS]
  + postboot-t9-b310f07e4-after.log [sau lượt: exit 0],
  run-t9-attempt1.nohup.log [attempt1: CỬA MỞ poll 4, probe 20/20,
  exit 0],
  run-webkit-t9-attempt1.log [probe 20/20, exit 0] +
  preview-b-f3-flip-webkit-t9-attempt1.json [3.049.351 B, lượt yên
  hợp lệ] + ps-before/after-t9-attempt1.txt +
  load-mid-t9-attempt1.log [10 mẫu, không mẫu hậu đo] +
  classb-t9-attempt1.txt [5/5 ĐẠT] +
  vite-5187-t9-attempt1.log + marker-t9-attempt1,
  chain-t9.log [gate0/gateA/probe/classB attempt1],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round125-t9.done` (kèm verdict 1 dòng).
  Cờ mở leg tải T4: `hidden_files/round125-t9-done` đã touch
  21:14:15Z ngay khi attempt xong (trước LIMITS/batch).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — lượt yên theo dõi lần 5 ĐÃ ĐÓNG
   (attempt1 median 47,5 ms, lớp B 5/5).** 4 lượt yên hợp lệ:
   S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5. Không chuyển
   tiếp nợ lượt yên sang đợt 126; lượt yên lần 6 do parent xếp khi
   cần. Không siết ngưỡng chỉ từ 1 lượt.
2. **(c2) lệch nhãn +1f tái hiện dạng** (5 occurrence skp=0, lag
   đều +1f, seq 203/252/306/430/479) — ghi nhận chuyển T5 chẩn
   đoán; không kết luận hồi quy. Stale-ghost: 0 occurrence mới.
3. **Sửa gate0-wait cho đủ 60 phút prereg** (hiện chỉ 10 poll ×
   2 phút = 20 phút): đợt sau sửa script lên 30 poll hoặc ghi rõ
   giới hạn 20 phút trong prereg — tránh waiter thoát sớm khi T5
   chậm.
4. **RAM host dao động 724–2021 MB (không ghim phẳng):** áp lực
   ngoài cell. Giữ nguyên ngưỡng RAM (không hạ để "cho qua").
   Bleed trang idle ~800 MB đã đo (xem §5) — gate A RAM ≥1024 MB
   sẽ tiếp tục đóng/mở thất thường khi host xuống ~1100 MB.
5. **Nợ khác đứng yên theo LIMITS gộp đợt 124 §9 + quyết parent
   §12:** E4 lượt 7 trên baseline (T1/T2 đợt 125 — T2 lượt 8 att2
   chạy 21:11:53–21:12:27Z, sau cửa sổ T9); leg trung gian dò ranh
   giới chuyển + viết DEF v0.2 (T4 đợt 125, sau cờ T9); G1 khung
   (a) M2 HOÃN chờ user; R9 (a) VẪN CHỜ user; birefnet 0 lần
   (RAM khả dụng vẫn dưới guard 6 GB); TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi.
   Reboot mới nhất: boot #70 20:54:19Z (gap #69→#70 = 19'08").
   T1, T3, T6 đã DONE lúc T9 dừng; T4 đang chạy leg tải sau cờ T9.

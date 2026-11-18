# PHASE9_ROUND124_T9_WEBKIT60MS_LIMITS — WebKit lượt yên theo dõi lần 5: 0 LƯỢT YÊN HỢP LỆ (attempt2 chạy 20/20 nhưng lớp B VI PHẠM — lượt nhiễm tải; attempt1/3 gate A không mở) — ngưỡng GIỮ

> Luồng T9, đợt 124, lượt cron 00:35 +07 17/11/2026 (bắt đầu ~17:41Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — 0 LƯỢT YÊN HỢP LỆ ĐỢT NÀY.**
> 1. **Attempt2 CHẠY ĐƯỢC 20/20 pass** (gate A mở poll 3, 17:59:59Z)
>    nhưng **lớp B VI PHẠM (B1 + B2)** — lượt NHIỄM TẢI, KHÔNG dùng
>    cho verdict ngưỡng. tickCost median **107,0 ms** (p90 191,8;
>    n=297) — báo cáo đầy đủ như số đo của lượt nhiễm tải, không
>    phải lượt yên.
> 2. **Attempt1 + attempt3: gate A KHÔNG MỞ** (10/10 poll mỗi attempt)
>    — lần này RAM KHÔNG phải thủ phạm chính (RAM 912–3431 MB, đa
>    số poll ≥1024 MB); thủ phạm là **load + lock vite của T4** (T4
>    chạy thí nghiệm tải Lc8-f2s: 3 hog busy-loop + probe F2 WebKit
>    riêng, xem §2).
> 3. **Ngưỡng WebKit ≤60 ms: GIỮ (không đổi).** Không có lượt yên
>    hợp lệ mới nên không áp dụng quy tắc quyết định prereg §1 — 3
>    lượt yên hợp lệ trước đó vẫn đứng (S5 49,5 / T4-118 40,0 /
>    T3-121 52,0). **Nợ lượt yên theo dõi lần 5 CHUYỂN TIẾP sang
>    đợt 125.**
> 4. **Phần 1 — điều tra RAM ghim (30 phút đầu lượt, quyết parent
>    đợt 123 §12.3): XONG.** Kết luận: tiến trình ghim KHÔNG nhìn
>    được từ trong VM → DỪNG điều tra theo điều kiện dừng đã đăng ký.
>    RAM đợt này KHÔNG ghim phẳng như đợt 123 mà dao động mạnh
>    882–3431 MB; áp lực là host-level (ngoài cell). Chi tiết §7.1
>    + `ram-probe-t9.md`.
> 5. Probe ĐÃ SỬA đợt 121 dùng nguyên, KHÔNG sửa (md5 `dccb8f4c…`
>    khớp). Dry-run analyzer PASS (S5 49,5/75,0; A8 40,0/64,7).
>    tsc apps/web exit 0 trên cây cuối. T9 không sửa production.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round124-t9/prereg-t9.md` — viết TRƯỚC
  mọi phép đo (17:43Z), đăng ký: Phần 1 điều tra RAM ghim (giới hạn
  30 phút đầu lượt, điều kiện dừng "không điều tra được từ trong VM"),
  Phần 2 chạy attempt lượt yên #5; dùng probe đã sửa đợt 121 nguyên
  vẹn, chờ cờ postboot T5 đợt 124 (thư mục `round124-t5`, KHÔNG chờ
  cờ đợt cũ), gate 0 + lớp A + lớp B gồm B5, ngưỡng ≤60 ms, quy tắc
  quyết định, theo dõi stale-ghost. **Gate-0 waiter đếm apt bằng
  `pgrep -x`** (luật đứng — sửa theo LIMITS đợt 123 §10.2; script
  `gate0-wait-t9-b68.sh` mới dùng pgrep -x, không còn grep-ps).
  Không có phụ lục bổ sung (không reboot giữa đợt, không thích ứng
  nào phát sinh sau khi đo bắt đầu).
- **Boot trong đợt: MỘT boot — #68, không reboot.**
  Boot #68 (`uptime -s` 2026-11-16 17:33:51Z, boot_id
  `69359761-1650-4956-b3cb-481410689a9b`, số tạm "#68" — chờ T6
  đếm lại): T9 bắt đầu trên boot này (~17:41Z, boot ~7' tuổi).
  Gap sau #67 (14:52:19Z) = 2h41'32".
- **Replay boot #68: CHẠY TỐT, NHANH** (theo cờ T5 + kiểm riêng):
  configure 17:35:42Z (boot +1'51"); installs xong 17:38:42Z
  (boot +4'51"); dpkg.log 2→1509 dòng, gói cuối gstreamer1.0-tools
  17:38:42Z; T5 POSTBOOT_PASS 17:44:21Z (boot +10'30", kiểm
  17:42:03Z + xác nhận lại 17:43:48Z, đủ 11/11 gói, GST thật 269
  file, isomp4 + libav đủ). Luật repair dạng (C) KHÔNG cần kích
  hoạt — replay xong tự nhiên. Ghi nhận của T7 đợt này:
  `/var/log/apt/` TỒN TẠI lần đầu (tạo 17:38:42Z).
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 17:42Z = mọi poll gate0/gate A = kiểm
  cuối 18:21Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
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
  122/123). Analyzer copy từ đợt 123 hoạt động đúng. (Lưu ý kỹ thuật:
  cả 2 analyzer cần đối số dạng `tag=path`, không phải path trần —
  lần gọi đầu quên tag nên lỗi, đã gọi lại đúng và PASS.)
- **RAM host dao động mạnh (xem §7.1):** 882–3431 MB trong đợt;
  lúc mở đợt task giao báo 1627 MB, số đo trực tiếp đầu tiên của T9
  là 1375 MB (17:41:13Z) rồi rơi xuống 1134 MB (17:42:58Z) trước khi
  bật lên 3275 MB (17:47:19Z). Vite vẫn chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) theo protocol.
- **Vite lock v2-ONLY**, cổng T9 **5187**. Lock do T9 giữ CHỈ trong
  lúc chạy probe attempt2 (18:00–18:02Z); các thời điểm khác lock
  thuộc T4 (port 8965) hoặc trống.
- **Các luồng đợt 124 khác (theo cờ .done lúc T9 dừng ~18:23Z):**
  T1, T2, T3, T5, T6, T7, T8 đã DONE; **T4 + T10 vẫn chạy** — T4
  đang chạy thí nghiệm tải Lc8-f2s (xem §2), là nguồn nhiễm tải
  chính của attempt2/3.

## 1. Gate 0 — ĐẠT NGAY POLL #1 (17:44:41Z)

- **gate0-wait b68 (17:44:40Z, poll #1 — duy nhất, exit 0):**
  t5flag=PASS (T5 POSTBOOT_PASS cho #68, boot_id
  `69359761…` KHỚP, mtime 17:44:21Z ≥ boot 17:33:51Z — luật STALE
  thỏa) + t7flag=chưa-có + postboot-check check-only riêng PASS
  (exit 0) + apt_procs=0 (`pgrep -x apt-get`=0, `pgrep -x dpkg`=0)
  + dpkg_lines=1509 + load1=1,89 + RAMavail=1244 MB + preview_md5=
  03bf029f. **GATE 0 ĐẠT từ poll #1.** Không cần poll thêm.
- run-t9.sh gate 0 try 1 PASS ngay ở cả 3 attempt (postboot 0,
  aptx 0, dpkgx 0; apt_grep=0 cả 3 — lần này không còn dương tính
  giả grep vì gate0-wait mới đã dùng pgrep -x).
- Khác đợt 123: không reboot cắt gate0-wait, không kẹt (0c), không
  cần thích ứng phụ lục. T5 đợt 124 đã viết cờ xong trước khi T9
  bắt đầu poll (round124-t5/ tồn tại từ 17:43Z).

## 2. Bối cảnh nhiễm tải: thí nghiệm tải của T4 (Lc8-f2s)

- T4 đợt 124 chạy thí nghiệm tải **Lc8-f2s** song song với T9:
  3 "hog" `node -e while (true) { Math.sqrt(Math.random()); }`
  (pid 18756/18757/18758, con của `run-124t4-all.sh` pid 18291,
  bắt đầu 17:58:43Z, vẫn sống lúc 18:09:39Z — mỗi cái ~31–36% CPU,
  ~50–57 MB RSS) + probe F2 WebKit riêng
  (`f2_startup_probe_124t4.mjs F2STARTUP 1`, vite :8965, Xvfb :197,
  MiniBrowser + WebKitWebProcess riêng) + giữ vite lock v2 (port
  8965) theo từng run.
- Bằng chứng từ log driver của T4 (`t4-driver.out`): run5 VALID
  (5/5, hogs_alive=3, CPU pressure avg60 ~72–77%); run6 (MEDIUM)
  bắt đầu 18:09:42Z, hogs=3 alive. CPU pressure avg60 ~77% là mức
  T4 tự đo — máy bị T4 chiếm ~3/4 CPU trong các đợt burst.
- ps-before attempt2 (17:59:59Z) đã có sẵn hạ tầng T4: watch-gate,
  run script, Xvfb :197. Probe F2 của T4 (vite :8965 + WebKit)
  xuất hiện trong ps-after attempt2 (18:04:12Z).
- T9 KHÔNG đụng tiến trình của T4 (không kill, không yêu cầu dừng)
  — chỉ ghi nhận làm bằng chứng nhiễm tải cho lớp B. Đây là hoạt
  động hợp lệ của luồng khác trong cùng đợt; xung đột lịch là hệ
  quả của việc nhiều luồng đo nặng chạy song song, không phải lỗi
  của bên nào.

## 3. Gate A — attempt1 KHÔNG MỞ (load); attempt2 MỞ poll 3; attempt3 KHÔNG MỞ (load + lock T4)

### 3.1 Attempt1 (17:47:39–17:56:40Z, 10 poll, exit 5)

- Gate 0 try 1 PASS ngay. Gate A poll 1–10: load1 1,86–3,80;
  load5 2,64–3,89 (KHÔNG một poll nào load5 <2); lock TRỐNG ở
  poll 1, T1 giữ lock ở poll 2 (thread=t1-round124, port 5590),
  trống trở lại poll 3+; blockers 2 ở poll 2–6 (vite/probe của
  luồng khác), 0 từ poll 7; tree YES mọi poll; **RAM 2343–3431 MB
  — MỌI poll đều ≥1024 MB**. Kết thúc: "HET 10 PHUT GATE A KHONG
  MO", exit 5, KHÔNG chạy probe.
- **Điểm mới so với đợt 123: RAM KHÔNG chặn attempt1 — chỉ load
  chặn.** Load5 không xuống dưới 2 trong cả 10 phút (T1 chạy probe
  E4 gop250 lúc đó + các luồng khác).

### 3.2 Attempt2 (17:57:58–18:04:27Z) — GATE A MỞ, PROBE CHẠY 20/20, LỚP B VI PHẠM

- Gate 0 try 1 PASS ngay. Gate A: poll 1 load1=2,46 load5=2,59
  RAM=2095 MB (chặn: load); poll 2 load1=1,40 load5=2,28 RAM=1908
  MB (chặn: load5); **poll 3 (17:59:59Z) load1=0,73 load5=1,92
  lock TRỐNG blockers=0 RAM=1709 MB tree=YES → CỬA YÊN MỞ**.
  Probe-start 17:59:59Z, boot 17:33:51, RAM 1708 MB, preview.tsx
  03bf029f.
- **Probe chạy 18:00–18:02Z, 20/20 pass, exit 0.** Vite :5187 lên
  sau 6 s; WebKit 27.2 launch OK; app boot OK; rVFC TẮT; TAP +
  RELABEL BẬT; sanity canvas OK (count=30650); FLIP sau pass 5
  (wallMs=47499); partial JSON ghi tăng dần đủ 20/20 (tickCost ok
  n=17→296); Y2 pump log: pumpEvents=0, blendTicks=222,
  tickCost=297; pageErrs=[].
- **Số đo attempt2 (lượt NHIỄM TẢI — xem §4):** tickCost total
  n=297 **median=107,0 ms p90=191,8 max=305 min=34**; hậu
  flip+2000ms n=214 median=107,0; tBlend gap n=221 median=222,0
  p90=708,0 max=3124 (S5: median 93,0); BlendTick/pass=11,1
  (S5: 23,3); rAF/pass median=19 min=17 max=29 (S5: median 34).
  Phân rã wallMs (đăng ký trước): 20–32k n=32 median=105,0;
  32–45k n=37 median=109,0; 45–62k n=52 median=111,5; 62–70k
  n=27 median=101,0; 70–80k n=32 median=104,5 — **đều ~101–112 ms
  ở MỌI dải, kể cả các dải đầu khi sampler còn ghi load1 <1**
  (xem §4.3).
- **Lớp B (check-classb-t9.sh, đánh giá 18:04:27Z): B1 VI PHẠM
  (load5 lúc kết thúc 4,62 > 2,5); B2 VI PHẠM (load1 max 7,82
  trong sampler > 4); B3 ĐẠT (không reboot); B4 ĐẠT (không replay
  apt/dpkg); B5 ĐẠT (RAM min 1246 MB, 0 mẫu <500 MB; 0/13 mẫu
  RAM <1024 MB). → LƯỢT KHÔNG ĐẠT ĐIỀU KIỆN YÊN.**

### 3.3 Attempt3 (18:10:36–18:19:41Z, 10 poll, exit 5 — attempt CUỐI)

- Gate 0 try 1 PASS ngay. Gate A poll 1–10: load1 0,43–10,18;
  load5 2,21–4,89 (KHÔNG một poll nào <2); T4 giữ vite lock ở
  poll 6–8 (port 8965, ticket mới mỗi run); blockers 5/3/3 ở
  poll 6–8, 1 ở poll 9–10; tree YES mọi poll; **RAM 912–2030 MB**
  (poll 6: 912 MB <1024; các poll khác ≥1024). Poll 8 gần mở nhất
  (load1 0,43, load5 2,21, RAM 1195 — vẫn chặn bởi load5 + lock
  T4 + blockers 3); poll 9–10 load bùng lại (load1 4,63 → 10,18,
  load5 2,96 → 4,85 — burst tải mới của T4). Kết thúc exit 5,
  KHÔNG chạy probe. **T9 DỪNG sau attempt3 theo prereg.**

## 4. Attempt2 — phân tích lượt nhiễm tải (KHÔNG dùng cho verdict ngưỡng)

### 4.1 Lớp B vi phạm — kiểm chứng chắc chắn, không phải do lỗi đo

- Sampler load-mid (20 s, 13 mẫu, 18:00:06–18:04:07Z):
  18:00:06 load=0,99 RAM=1658; :26 0,93/1568; :46 0,67/1466;
  18:01:06 0,48/1377; :27 0,34/1293; **:47 3,82/1246;**
  18:02:07 **5,96**/1249; :27 6,64/1543; :47 6,74/1592;
  18:03:07 7,75/1535; :27 **7,82**/1431; :47 7,12/1436;
  18:04:07 6,84/1334. Load1 vượt 4 từ mẫu 18:02:07 trở đi;
  load5 lúc đánh giá 4,62.
- **Kiểm tra "cửa sổ tick" hẹp (ghi rõ để khỏi hiểu lầm):** tick
  cuối cùng có wallMs max=120185 (≈18:02:07Z, xem §4.2) — mẫu
  sampler 18:02:07 (load1 5,96, load5 2,85) vẫn NẰM TRONG cửa sổ
  tick. Vậy **B2 VI PHẠM ngay cả khi thu hẹp về đúng cửa sổ tick**
  (load1 max trong cửa sổ = 5,96 > 4) và **B1 VI PHẠM ở mọi mốc
  sau 18:02** (load5 2,85 lúc 18:02:07; 4,62 lúc đánh giá). Verdict
  lớp B không phụ thuộc vào cách đọc biên cửa sổ.
- Ghi chú kỹ thuật (không đổi verdict): sampler sống tới 18:04:07,
  ~110 s sau khi node probe thoát (18:02:17) — lệnh `kill $LOADPID`
  trong t9-attempt-inner.sh không dừng vòng lặp sampler ngay (có lẽ
  do subshell đang `sleep 20`). Các mẫu sau 18:02:17 là hậu đo;
  nhưng như trên, vi phạm đã đủ ngay trong cửa sổ tick. Đợt sau
  nên sửa inner script để kill sampler đúng lúc node thoát (kill
  cả process group hoặc ghi marker dừng) — T9 ghi nợ, KHÔNG sửa
  âm thầm giữa đợt.

### 4.2 Vì sao tickCost đều ~107 ms ở mọi dải (kể cả lúc load thấp)

- Renderer đói từ pass 1: BlendTick/pass chỉ 11,1 (S5: 23,3);
  tBlend gap median 222 ms (S5: 93 ms) — khung rAF thưa suốt lượt,
  không chỉ đoạn cuối bị spike load.
- Giải thích ứng viên (ghi nhận, chưa kết luận): (a) hạ tầng T4 đã
  chạy TRƯỚC khi probe T9 bắt đầu (ps-before 17:59:59Z: watch-gate
  + run script + Xvfb :197 của T4 đã có; probe F2 của T4 với vite
  :8965 + WebKit riêng khởi động trong cửa sổ đo); (b) RAM host
  rơi 1709→1246 MB trong lúc đo, swap đã dùng ~360 MB — WebKit có
  thể chậm do áp lực bộ nhớ dù load CPU sampler còn thấp; (c) hai
  WebKit + hai vite trên cell 1,5 CPU tranh nhau decode GStreamer
  phần mềm. Không có bằng chứng nào đủ để chọn một nguyên nhân duy
  nhất — ghi lại cho T4/T5 chẩn đoán nếu cần, không suy diễn thêm.
- **Dù nguyên nhân là gì: median 107,0 >> 60 nên lượt này KHÔNG
  THỂ dùng để giữ hay mở ngưỡng — và vì lớp B vi phạm nên theo
  prereg nó cũng KHÔNG ĐƯỢC dùng. Hai lớp bảo vệ trùng nhau ở đây.**

### 4.3 (b) unique-match + F6' + stale-ghost trên lượt nhiễm tải (chỉ ghi nhận)

- **(b) labellag:** skp=1: nTick=47, lag median=0f p90=0f max=0f,
  ≥5f: 0; (c2) = 0. skp=0: nTick=119, lag median=0f p90=1f max=2f,
  ≥5f: 0; (c2) = 0. Không có occurrence lag ≥+5f ở cả 2 skp.
- **F6' (skiplatest):** skp=1 hậu flip+2000ms nTick=47 (cần ≥30);
  (1) nhãn 100,0% (bar ≥90%); (2) pixel-verified 100,0% (bar
  ≥90%) → các bar đạt TRÊN DỮ LIỆU LƯỢT NÀY. **F6' vẫn ĐÃ ĐÓNG từ
  L7 — T9 không đóng lại, không mở lại; đây chỉ là kiểm lại,
  không thay đổi trạng thái.**
- **Stale-ghost (lag5):** (b) lag≥+5f: **0 occurrence** — các event
  cũ P4 seq 220–223 (frame 26), Q5 seq 282–285 (frame 68), T4 đợt
  118 frame 23 đều KHÔNG tái hiện. (c2) đợt 121: 0 occurrence.
  Gap presented-expected hậu flip: 166/166 |gap|≤3 (median 0).
- Lưu ý: các phân tích (b)/F6'/lag5 trên lượt nhiễm tải chỉ có giá
  trị ghi nhận (renderer đói làm số tick ít: blendTick 222 so với
  S5 465) — không dùng để kết luận về ghost/stale.

## 5. Không có lượt yên — verdict ngưỡng giữ nguyên

- **0 lượt yên hợp lệ đợt 124 (T9).** Attempt2 là lượt nhiễm tải
  duy nhất chạy được; attempt1/3 không chạy probe.
- **Verdict ngưỡng (theo prereg §1 — lượt KHÔNG đạt lớp B nên không
  áp dụng nhánh quyết định): GIỮ ngưỡng WebKit ≤60 ms.**
  3 lượt yên hợp lệ trước đó vẫn đứng: S5 49,5 ms (đợt 116, cây
  03bf029f) / T4-118 40,0 ms (đợt 118, cây 03bf029f) / T3-121
  52,0 ms (đợt 121, cây 5be5a250).
  **Nợ lượt yên theo dõi lần 5 CHUYỂN TIẾP sang đợt 125** — đo trên
  cây baseline 03bf029f hiện tại theo cùng prereg (gate 0 + lớp A +
  lớp B gồm B5).
- T9 KHÔNG bịa lượt yên, KHÔNG hạ ngưỡng RAM, KHÔNG hạ ngưỡng
  tickCost, KHÔNG đo "cho có".

## 6. Cây đo — baseline, không đổi

- preview.tsx md5 `03bf029f` không đổi: lúc bắt đầu (17:42Z) =
  mọi poll gate0-wait/gate A = kiểm cuối (18:21Z). `media.ts` md5
  `2c384ed1` không đổi.
- T9 không sửa production: không có thay đổi nào do T9; cây giữ
  baseline theo quyết parent đợt 122 (H3f đã gỡ, không apply lại).

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 Điều tra RAM ghim — Phần 1 (đã xong, xem `ram-probe-t9.md`)

- **Kết luận: tiến trình ghim KHÔNG nhìn được từ trong VM → DỪNG
  điều tra** theo điều kiện dừng đã đăng ký trong prereg (không đốt
  cả lượt). Chi tiết đầy đủ trong
  `hidden_files/round124-t9/ram-probe-t9.md`; tóm tắt:
- RAM đợt này **dao động mạnh, không ghim phẳng**: MemAvailable
  1753 (17:45) → 3419 (17:52) → 2264 (17:57) → 1600 (18:02) → 882
  MB (18:07); đọc ngoài snapshot: 1134–3431 MB. Khác hẳn đợt 123
  (ghim phẳng ~474–576 MB suốt 30+ phút).
- **~4+ GB đã dùng không quy được cho tiến trình nào nhìn thấy:**
  tổng RSS nhìn thấy chỉ ~1,9 GB (31 tiến trình) trong khi đã dùng
  ~6,2/8 GB. Tiến trình lớn nhất trong cell đều là việc của các
  luồng đợt 124 (T1 WebKit 481 MB, T4 F2 probe, T9 probe/vite)
  — không có "kẻ ghim" nào trong cell.
- `/proc/pressure/memory` (host): some avg10 tới 2,09%, total
  `some` tăng 3,8M → 11,4M µs từ snap1 tới snap5 — áp lực RAM
  host tích lũy suốt cửa sổ. **Cgroup của cell:
  `memory.pressure` = 0,00 ở mọi snapshot** — áp lực nằm ngoài cell.
- Không đọc được: `/sys/fs/cgroup/memory.*` (không có memory
  controller ở tầng này), `/proc/slabinfo` (trống), `dmesg`
  (Operation not permitted). Shmem 43–73 MB, /dev/shm gần trống,
  slab ~624–693 MB (SReclaimable ~427–500 MB) — không giải thích
  được mức ghim.
- Hệ quả: gate A (RAM ≥1024 MB) đợt này lúc mở lúc đóng theo dao
  động host. Nợ quan sát đợt 120 §9.4 (đo RAM baseline của trang
  preview khi chạy idle để tách bleed khỏi áp lực host) VẪN MỞ và
  càng cần thiết.

### 7.2 Hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (17:42Z) = mọi poll gate0-wait/gate A = kiểm cuối (18:21Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy đợt này 18:22Z, ~22 s).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo hợp lệ.
- Postboot-check sau lượt: exit 0 (18:21Z) — replay vẫn PASS sau
  khi đo xong (B4 hậu kiểm).

### 7.3 Sự cố hạ tầng + vận hành trong lúc đo

1. **Không reboot trong đợt.** Boot #68 duy nhất từ 17:33:51Z tới
   lúc T9 dừng (~18:23Z). Không mất dữ liệu, không khởi động lại
   gate0-wait.
2. **Xung đột lịch đo với T4 (Lc8-f2s):** T4 chạy thí nghiệm tải
   (3 hog + probe F2 WebKit riêng) đúng cửa sổ đo của T9 —
   attempt2 nhiễm tải (B1+B2 vi phạm), attempt1/3 gate A không mở
   vì load. Đây là hoạt động hợp lệ của luồng khác; T9 chỉ ghi
   nhận. Bài học cho parent: các lượt yên WebKit nhạy với thí
   nghiệm tải song song — nếu muốn lượt yên sạch, nên xếp T4-load
   và T9-yên lệch nhau (T9 không tự đặt lịch cho luồng khác).
3. **Sampler sống quá probe ~110 s (lỗi nhỏ, đã ghi §4.1):**
   `kill $LOADPID` không dừng vòng lặp sampler ngay; các mẫu sau
   18:02:17 là hậu đo. Verdict lớp B không đổi (vi phạm đã đủ
   trong cửa sổ tick). Nợ sửa inner script ở đợt sau.
4. **Analyzer cần đối số `tag=path`:** lần gọi dry-run đầu quên tag
   nên lỗi ValueError; đã gọi lại đúng và PASS. Không ảnh hưởng số
   đo (dry-run chạy trước khi đo).
5. **Nhãn file log hậu tố b66 đã sửa:** run-t9.sh đợt này ghi
   `postboot-t9-b68-attempt<N>-gate0.log` đúng boot thật (sửa lỗi
   đặt tên đợt 123 §8.6).
6. **Gate0-wait mới dùng pgrep -x:** (0c) không còn dương tính giả
   grep-ps (apt_grep=0 ở cả 3 attempt; gate 0 đạt poll #1).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND124_T9_WEBKIT60MS_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round124-t9-webkit.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round124-t9/`
  (prereg-t9.md [viết trước khi đo, gồm kế hoạch Phần 1 RAM + Phần 2
  attempt, gate 0 pgrep -x],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t9-{tickcost,labellag,skiplatest,wallbands,lag5}.py
  [copy đợt 123],
  analyze-t9-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7],
  analyze-t9-attempt2-{tickcost,wallbands,labellag,skiplatest,lag5}.txt
  [lượt nhiễm tải: median 107,0/p90 191,8; (b) 0 lag≥+5f; F6' bar đạt
  trên dữ liệu này; lag5 0 occurrence],
  b.json [copy đợt 123, md5 `078938cf…`],
  vite.t9-temp.config.mjs [copy đợt 123, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t9.sh [adapt đợt 124: round124-t9, hậu tố log b68] +
  t9-attempt-inner.sh [adapt round124-*] +
  check-classb-t9.sh [lớp B gồm B5 — ĐÃ CHẠY, attempt2: B1+B2 VI
  PHẠM, B3/B4/B5 ĐẠT] +
  gate0-wait-t9-b68.sh [MỚI: (0c) bằng pgrep -x — 1 poll, GATE 0
  ĐẠT] + gate0-wait-t9-b68.log + gate0-wait-t9-b68.nohup.log,
  ram-probe-t9.sh + ram-probe-t9.log [5 snapshot] +
  ram-probe-t9.md [kết luận: không điều tra được từ trong VM] +
  ram-snap-loop.nohup.log,
  poll-t9.sh + poll-t9.log [mẫu 5 phút + gate0/gateA: attempt1 10
  poll, attempt2 3 poll, attempt3 10 poll] + poll-t9.nohup.log,
  postboot-t9-b68-gate0wait-1.log [boot #68: PASS] +
  postboot-t9-b68-attempt{1,2,3}-gate0.log [gate 0 run-t9.sh: PASS
  cả 3] + postboot-t9-b68-after.log [sau lượt: exit 0],
  run-t9-attempt{1,2,3}.nohup.log [attempt1 exit 5; attempt2 CỬA MỞ
  poll 3, probe 20/20; attempt3 exit 5],
  run-webkit-t9-attempt2.log [probe 20/20, exit 0] +
  preview-b-f3-flip-webkit-t9-attempt2.json [1.654.277 B, lượt
  nhiễm tải] + ps-before/after-t9-attempt2.txt +
  load-mid-t9-attempt2.log [13 mẫu] + classb-t9-attempt2.txt +
  vite-5187-t9-attempt2.log + marker-t9-attempt2,
  chain-t9.log [attempt1/2/3],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round124-t9.done` (kèm verdict 1 dòng).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — 0 lượt yên hợp lệ đợt 124
   (attempt2 nhiễm tải B1+B2; attempt1/3 gate A không mở vì load +
   lock T4). Nợ lượt yên theo dõi lần 5 CHUYỂN TIẾP sang đợt 125,**
   đo trên cây baseline 03bf029f hiện tại theo cùng prereg (gate 0 +
   lớp A + lớp B gồm B5). Các lượt yên đã có: S5 49,5 / T4-118 40,0 /
   T3-121 52,0.
2. **Xếp lịch tránh xung đột tải:** lượt yên WebKit cần cửa yên
   thật — T4 Lc8-f2s (hog + probe F2) chạy song song đã nhiễm
   attempt2 và chặn attempt1/3. Đề xuất parent cân nhắc xếp
   T4-load và T9-yên lệch nhau trong đợt sau (T9 không tự đặt lịch
   cho luồng khác). Nếu không xếp được, lượt yên sẽ tiếp tục khó
   đạt lớp B dù RAM đã hồi (đợt này RAM đa số poll ≥1024 MB — vấn
   đề đã chuyển từ RAM sang LOAD).
3. **Sửa sampler trong t9-attempt-inner.sh:** kill sampler đúng lúc
   node probe thoát (kill process group / marker dừng) để cửa sổ
   sampler khớp cửa sổ tick — tránh mẫu hậu đo làm nhiễu B2 ở các
   đợt sau (đợt này verdict không đổi).
4. **RAM host dao động 882–3431 MB (không ghim phẳng như đợt 123):**
   áp lực ngoài cell. Giữ nguyên ngưỡng RAM (không hạ để "cho qua");
   nợ đo RAM baseline của trang preview khi chạy idle (đợt 120 §9.4,
   vẫn mở) để tách bleed của trang khỏi áp lực host.
5. **(c2) "dang ngo thật" + stale-ghost:** 0 occurrence mới đợt này
   (lượt nhiễm tải, dữ liệu ít) — theo dõi tiếp ở lượt yên sau.
6. **Nợ khác đứng yên theo LIMITS gộp đợt 123 §10–§11 + quyết
   parent §12:** E4 lượt 5/6 trên cây BASELINE (T1/T2 đợt 124 —
   đều VOID, lô 5/10); leg B chạy lại trên baseline theo PSI v0.1;
   G1 khung (a) M2 HOÃN chờ user; R9 (a) VẪN CHỜ user; birefnet 0
   lần (T7-124: RAM max 4.576 MB, 76% guard — vẫn dưới guard 6 GB);
   TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user; release
   gate không đổi. Reboot mới nhất: boot #68 17:33:51Z (gap #67→#68
   = 2h41'32"). 8/10 luồng đợt 124 đã DONE lúc T9 dừng (T1, T2,
   T3, T5, T6, T7, T8); T4 + T10 vẫn chạy.

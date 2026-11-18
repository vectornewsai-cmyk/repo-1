# PHASE9_ROUND115_R5_F6P60MS_LIMITS — F6' WebKit ≤60 ms: lượt yên XÁC NHẬN LẦN 4 (KHÔNG chạy được lượt yên hoàn chỉnh — ngưỡng giữ nguyên)

> Luồng R5, đợt 115, lượt cron 00:35 +07 15/11/2026 (bắt đầu ~17:35Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ LIMITS gộp đợt 114 §10 mục 5 + LIMITS Q5 đợt 114 §8.1 (từ P4 đợt 113):
> 1 lượt yên xác nhận để chốt ngưỡng WebKit ≤60 ms — lần thứ 4 liên tiếp
> chưa chốt được (N4 tải trôi, P4 P3 chen, Q5 replay apt, R5 xem dưới).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không đụng
> TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính (đọc kỹ trước khi dùng số — LẦN NÀY KHÔNG CÓ SỐ ĐO MỚI):**
> 1. **KHÔNG có lượt yên hoàn chỉnh nào trong đợt 115.** 4 lần thử
>    (attempt1–4): attempt1/3/4 gate lớp A không mở trong 10 phút poll
>    nên KHÔNG chạy probe (đúng prereg — không đo "cho có"); attempt2
>    gate MỞ (19:11:32Z, load 0,66/1,41, RAM 1515 MB) và chạy được 9/20
>    pass trong ~42 s (nhanh như Q5), rồi **kẹt ở pass 10 suốt 17 phút
>    không tiến** (log mtime 19:12:14) và chết lúc 19:30:04Z với
>    `page.evaluate: Target page, context or browser has been closed`
>    (probe exit 2) — WebKit target chết dưới áp lực RAM (avail
>    350–600 MB suốt cửa sổ, swap 434 MB đã dùng). **Không có file JSON
>    output** (probe chỉ ghi sau đủ 20 pass) → **không có tickCost
>    median/p90 nào để báo cáo, không áp dụng được quy tắc quyết định
>    ngưỡng.** 9 pass đã xong chỉ còn lại dòng dbg trong log, không chứa
>    mẫu tickCost → không tính được median từ dữ liệu dở dang.
> 2. **Ngưỡng WebKit ≤60 ms giữ nguyên trạng thái Q5: GIỮ nhưng MỎNG,
>    nợ lượt yên xác nhận chuyển tiếp sang đợt sau (lần thứ 4).**
>    Không có bằng chứng mới nào chống lại ngưỡng 60 (attempt2 chết vì
>    hạ tầng, không phải vì tick chậm — 9 pass đầu chạy nhanh bình
>    thường), và cũng không có bằng chứng mới nào ủng hộ nó.
> 3. **(b) unique-match + bar F6' (1)/(2): KHÔNG đo được đợt này**
>    (không có JSON). F6' vẫn ĐÃ ĐÓNG từ L7 — R5 không đóng lại, không
>    mở lại, không kiểm lại được.
> 4. **Stale-ghost: KHÔNG quan sát được đợt này** (không có dữ liệu
>    (b)). Event P4 frame-26 và event Q5 seq 282–285 (seek-68) đều
>    không được tái hiện hay bác bỏ thêm — vẫn chờ lượt yên sạch để
>    theo dõi.
> 5. **RAM là nút thắt ràng buộc nhất đợt này** (không phải load):
>    21 lần lấy mẫu 5 phút: median chỉ **724 MB**, min 350 MB, max
>    3899 MB; chỉ 8/21 lần ≥1024 MB. Load thì thường xuyên yên
>    (nhiều cửa sổ load1 <1, load5 <2) nhưng RAM dưới ngưỡng làm gate
>    không mở, và cú sụt RAM 1429→788 MB trong 21 s ngay sau khi
>    attempt2 bắt đầu (19:11:33→19:11:54Z) — từ một consumer ngoài cell,
>    vô hình với `ps` — nhiều khả năng là nguyên nhân trực tiếp làm
>    renderer thrash rồi chết ở pass 10.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round115-r5/prereg-r5.md` — viết TRƯỚC mọi
  phép đo (17:45Z), đăng ký: gate replay postboot MỚI (gate 0) trước
  lớp A theo nợ Q5 §8.4, định nghĩa lượt yên kế thừa Q5 (quyết parent
  đợt 114), phân rã tickCost theo dải wallMs đăng ký trước, quy tắc
  quyết định ngưỡng, kế hoạch theo dõi stale-ghost 2 event riêng biệt
  (P4 frame-26 và Q5 seek-68), tách tên file log theo lần đo (nợ Q9
  (h)), lấy mẫu load1 GIỮA lượt (khắc phục thiếu sót Q5). R5 tuân thủ
  đúng prereg — xem §1.
- **Boot trong đợt: 3 boot.** Bắt đầu đợt trên boot #46 (15:44:49Z);
  **reboot #47 lúc 17:45:50Z** (gap #46→#47 = 2h01'01", không phá sàn
  19'07") — giết poller v1 của R5 (chỉ kịp 1 mẫu); **reboot #48 lúc
  19:43:46Z** (gap #47→#48 = 1h57'56", không phá sàn) — giết attempt4
  đang poll gate + poller v2. Số thứ tự #47/#48 theo `uptime -s` +
  boot_id (`#47 = 5578af38-911d-4f3b-93b0-383a1664f225`,
  `#48 = 0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0`); R5 không đụng
  bookkeeping mù (mù #33 ĐÃ ĐÓNG HOÀN TOÀN lúc probe #34 17:45:02Z
  của R7 — 48 s trước reboot #47; reboot #47 mở mù MỚI #34, chứa #47
  và #48).
- **Postboot:** boot #46: Q7 try2 PASS 15:51:57Z đợt 114; R5 kiểm lại
  check-only lúc 17:44:23Z → exit 0, PASS toàn bộ (log
  `postboot-r5-b46.log`). Boot #47: R5 kiểm lại check-only lúc
  18:19:51Z → exit 0, PASS toàn bộ (wrapper K1, libs đủ 5, GST thư mục
  thật 269 file đủ isomp4+libav, apt đủ 11 package — log
  `postboot-r5-b47-try1.log`). Replay apt sau boot #47 được thấy đang
  chạy lúc 18:02–18:04Z (cài libgssdp-1.6-0, libgtk-4-1) và đã xong
  trước 18:19:51Z. Boot #48: replay apt ĐANG chạy lúc R5 kết thúc
  (19:45Z, PID 2304 apt-get + dpkg-preconfigure) — **postboot #48
  CHƯA được kiểm** (chuyển tiếp cho luồng hạ tầng đợt sau).
- **Cây đo `03bf029f…`** (= cây P4 đợt 113 = cây Q5 đợt 114, fix E4
  steady-close). preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b` kiểm nhiều lần trong đợt — KHÔNG
  ĐỔI từ đầu tới cuối (trừ một cây tạm của R2, xem dưới). R5 không sửa
  production.
- **Cây tạm của R2:** R2 đổi preview.tsx sang `a419ae05…` lúc
  18:05:59Z (cây fix, xem `round115-r2/suites-fix.log:1`), rồi HOÀN
  TÁC về `03bf029f…` và viết cờ `hidden_files/round115-r2-tree`
  (`md5=03bf029f…`, `NO-CHANGE`) lúc ~18:28Z. R5 CHỜ cờ này rồi mới
  chạy attempt1 (18:50Z) — đúng lệnh task. Cây attempt2 đo =
  `03bf029f…`, cùng cây P4/Q5.
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng từ round111-m5. Binary
  local-only, KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb :193 (attempt2). Env launch GST như M5/L7/N4/P4/Q5.
- **Inotify headroom:** R9 đợt 115 đo chỉ còn **1094 watch** (trần
  63747) — thấp hơn đợt 114 (1207–1307). Vite attempt2 chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch), như Q5/P4. Bắt buộc.
- **RAM khả dụng lúc bắt đầu đợt: ~512 MB** (00:36 +07 15/11, theo
  task giao) → 482 MB (17:43Z) → 450 MB (17:45Z) → 387 MB — dưới
  ngưỡng ~1 GB trong suốt 2 giờ đầu đợt. Dao động mạnh cả đợt (xem
  §1.5). Không có process mồ côi nào để giải phóng an toàn (ps chỉ
  thấy hatch daemon + shell R5 + các luồng round115 khác); phần RAM
  còn lại nằm ngoài tầm nhìn process của cell (host/shared), KHÔNG
  kill được, KHÔNG chạy lệnh hệ thống nguy hiểm.

## 1. Bốn lần thử — chỉ attempt2 chạy được probe, và chết ở pass 10

### 1.1 Attempt1 (18:50:47–19:00:48Z, boot #47): gate A không mở

Gate 0 ĐẠT (postboot exit 0, 0 apt, 18:50:47Z). Gate A poll 10 lần:

| poll | load1/load5 | RAM | vite.lock | blockers | Ghi chú |
|---|---|---|---|---|---|
| 1 | 2,04 / 8,24 | 1187 MB | không | 0 | load1 vừa vượt 2 |
| 2 | 0,75 / 6,74 | 1051 MB | không | 1 | load5 cao |
| 3 | 2,63 / 6,04 | 1288 MB | **R1** | 1 | R1 giữ lock |
| 4 | 7,61 / 6,46 | 1203 MB | không | 1 | R1 chạy nặng |
| 5 | 19,75 / 10,17 | 711 MB | **R1** | 8 | load1 vọt 19,75 |
| 6 | 23,39 / 13,37 | 1226 MB | không | 1 | load1 vọt 23,39 |
| 7 | 8,86 / 11,01 | 1085 MB | không | 1 | |
| 8 | 3,40 / 9,06 | 917 MB | không | 1 | |
| 9 | 1,25 / 7,41 | 822 MB | không | 1 | |
| 10 | 0,68 / 6,12 | 709 MB | không | 1 | load5 vẫn 6,12 |

Hết 10 phút gate không mở → exit 5, KHÔNG chạy probe (đúng prereg).
Nguyên nhân chính: load5 không xuống dưới 2 (dư chấn pha nặng của
R1, load1 tới 23,39) + RAM rơi dưới 1024 MB ở cuối. Poll 1 suýt mở
(chỉ load1 2,04 vượt). Blocker "1" kéo dài ở poll 2,4,6–10 là DƯƠNG
TÍNH GIẢ (xem §6.2): shell giám sát của R6 chứa chuỗi
`preview-b-f3-flip-webkit-r5-*.json` trong args, khớp pattern
`[w]ebkit` của grep đếm blocker — R5 đã sửa grep ở attempt2 (loại
trừ shell chứa `sleep`/`poll-r*`).

### 1.2 Attempt2 (19:03:32–19:30:06Z, boot #47): gate MỞ, probe chết ở pass 10

#### Gate 0 + lớp A: ĐẠT ở poll 9

Gate 0 ĐẠT (postboot exit 0, 0 apt, 19:03:32Z). Gate A:

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1–3 | 0,50 / 3,11 → 0,11 / 2,11 | 438–444 MB | không / 0 | RAM <1024 |
| 4–5 | 0,67 / 1,92 → 0,67 / 1,69 | 479–862 MB | không / 0 | RAM <1024 |
| 6–8 | 1,17–1,97 / 1,65–1,82 | 671–1347 MB | không / 5 | blocker 5 = luồng khác thoáng qua |
| **9** | **0,66 / 1,41** | **1515 MB** | **không / 0** | **CỬA YÊN MỞ 19:11:32Z** |

`== R5 attempt2 start 2026-11-14T19:11:32Z boot 2026-11-14 17:45:50
load 0.66 1.41 4.03 RAM 1515MB avail preview.tsx 03bf029f gate_ok=1
r2tree=md5=03bf029f… NO-CHANGE`. Vite lock acquire 1 lần thành công
ngay (thread=r5, port 5184); vite lên sau 2 s (pid 133989).

#### Cửa sổ đo 19:11:32–19:30:06Z — pass 1–9 nhanh, pass 10 kẹt rồi chết

- **Pass 1–9 xong trong ~42 s** (log mtime 19:12:14, dòng pass 9 cuối):
  pass 1: 36 khung rAF; pass 2: 47; pass 3: 37; pass 4: 32; pass 5: 35
  (FLIP rVFC tắt sau pass 5, wallMs=25778 — khớp Q5: flip 26985 ms);
  pass 6: 34; pass 7: 35; pass 8: 35; pass 9: 33. Tốc độ này BÌNH
  THƯỜNG như Q5 (20 pass/87 s) — không có dấu hiệu tick chậm ở 9 pass
  đầu (chỉ có dbg ring/lastFrame trong log, KHÔNG có mẫu tickCost nên
  không tính median được — ghi rõ, không suy diễn).
- **RAM sụt ngay sau khi probe bắt đầu:** load-mid sampler (mỗi 20 s,
  56 mẫu — khắc phục thiếu sót Q5, xem §1.4): 19:11:33Z RAM 1429 MB
  → 19:11:54Z RAM **788 MB** (mất 641 MB trong 21 s) → dao động
  350–712 MB suốt cửa sổ. `ps` top-RSS cùng lúc chỉ thấy process của
  chính R5 (WebKitWebProcess 230 MB, MiniBrowser 142 MB, vite 79 MB,
  probe node 69 MB, Xvfb 24 MB) + hatch daemon 246 MB — **không có
  browser/vite/hog nào của luồng khác**. Cú sụt RAM đến từ consumer
  ngoài cell, vô hình với `ps` (cùng mẫu với ENOSPC/inotify: ~61k
  watch bị giữ ngoài cell — hạ tầng host/shared).
- **Pass 10 kẹt 17 phút không tiến:** từ 19:12:14 (mtime log) tới
  19:30:04 không có thêm dòng log nào; node probe CPU time chỉ 1 s
  trong 17 phút (đang chờ); WebKitWebProcess chỉ +1 s CPU/1,5 phút
  (5,7% CPU — chủ yếu chờ, nghi thrash swap); swap đã dùng 434 MB.
  Cơ chế trong probe: mỗi pass lặp tối đa 1500 khung rAF, thoát khi
  playhead > 2,2 s — rAF không chạy (renderer thrash dưới áp lực RAM)
  thì vòng lặp không tiến; probe driver KHÔNG có timeout wall-clock
  cho mỗi pass (chỉ có timeout 60 s cho `page.goto`).
- **Chết lúc 19:30:04Z, probe exit 2:**
  `play pass 10 lỗi: Error: page.evaluate: Target page, context or
  browser has been closed`. WebKit target chết dưới áp lực RAM (avail
  426–447 MB lúc đó). R5 CŨNG gửi SIGTERM tới node probe cùng giây
  19:30:04 (sau khi quan sát 17 phút không tiến) — nhưng SIGTERM
  KHÔNG phải nguyên nhân exit 2: node bị SIGTERM sẽ chết với exit 143
  và không in được dòng lỗi; dòng lỗi chứng tỏ node còn sống để in khi
  target đóng. Ghi rõ để tránh hiểu lầm là R5 tự giết lượt đo của
  mình — lượt đo đã chết vì hạ tầng trước khi lệnh kill có hiệu lực.
- **Không có file JSON output** (probe chỉ ghi sau đủ 20 pass) →
  **không có dữ liệu tickCost/(b)/F6' nào từ attempt2.** Dọn dẹp sạch:
  vite kill theo pid node thật (TERM pid 134005, ps sạch, curl :5184
  = 000), lock nhả sạch 19:30:06Z.
- **Lớp B (mới) — không áp dụng được:** vì lượt không chạy xong, R5
  KHÔNG tuyên bố đạt/không đạt lớp B cho attempt2. Bằng chứng thu
  được trong cửa sổ (ghi lại, không dùng để chốt): load1 giữa lượt
  (56 mẫu, mỗi 20 s) max **1,77** — không vượt 4; load5 cuối 0,49;
  ps-before (19:11:32) 0 blocker; ps-after (19:30:06) chỉ có vite
  của chính R5; 0 apt/dpkg trong cửa sổ; không reboot trong cửa sổ;
  file round115 khác sửa trong cửa sổ: `round115-r6/` (ghi nhẹ) và
  cờ `round115-r8-done` (R8 xong giữa lượt — ghi file nhẹ, KHÔNG vi
  phạm lớp B theo quyết parent). Điểm duy nhất làm cửa sổ này không
  yên là **RAM sụt ngoài cell** (§1.2) — prereg không liệt kê sụt RAM
  vô hình là mục lớp B, nhưng nó là nguyên nhân trực tiếp làm chết
  lượt đo; đợt sau nên bổ sung điều kiện RAM giữa lượt vào lớp B
  (xem §8.3).

#### Phân rã tickCost / (b) / F6' — KHÔNG CÓ DỮ LIỆU

Không có JSON → không chạy được analyzer (tickcost/wallbands/
labellag/skiplatest/lag5). Phân rã wallMs đăng ký trước trong prereg
không thực hiện được. Analyzer đã được dry-run kiểm chứng trước trên
JSON Q5 (tái tạo đúng median 70,0 / p90 96,0 / wallbands §1.4 của Q5
— log `analyze-r5-dryrun-*.txt`) nên toolchain đã sẵn sàng, chỉ thiếu
dữ liệu đầu vào.

### 1.3 Attempt3 (19:30:40–19:40:42Z, boot #47): gate A không mở

Gate 0 ĐẠT (postboot exit 0, 0 apt). Gate A poll 10 lần:

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1–5 | 0,19–0,46 / 0,35–0,45 | 872→470 MB | không / 0 | Load HOÀN HẢO nhưng RAM <1024 |
| 6 | 0,57 / 0,40 | 673 MB | **R3** | R3 lấy lock |
| 7 | 2,92 / 1,00 | 1466 MB | không / 0 | RAM đủ nhưng load1 vượt |
| 8 | 16,91 / 5,15 | 913 MB | không / 0 | R3 pha nặng |
| 9–10 | 28,09 / 10,51 → 17,10 / 10,83 | 464–454 MB | **R3** | load1 vọt 28 |

Hết 10 phút gate không mở → exit 5, KHÔNG chạy probe. Nguyên nhân:
RAM là blocker duy nhất ở poll 1–5 (load yên tuyệt đối mà RAM chỉ
470–872 MB), rồi R3 bắt đầu pha nặng (load1 16–28, giữ vite lock)
từ poll 6.

### 1.4 Attempt4 (19:42:09–19:44:10Z, boot #47→#48): gate không mở, reboot giết giữa chừng

Gate 0 ĐẠT (postboot exit 0, 0 apt, 19:42:09Z, boot #47). Gate A:
poll 1 (19:42:10): load1 3,00/load5 7,49, RAM 881 MB, R3 giữ lock;
poll 2 (19:43:10): 1,23/6,15, RAM 627 MB, R3 giữ lock; poll 3
(19:44:10): 18,38/9,53, RAM 612 MB, R3 giữ lock. Gate không mở.
**Reboot #48 lúc 19:43:46Z** giết attempt4 (script + poller v2 đều
chết; `ps` sau reboot không còn process R5 nào; vite.lock còn lại là
của R3, boot #47, pid 105555 đã chết — R5 KHÔNG đụng lock của luồng
khác, chuyển cho R3/luồng hạ tầng xử lý stale).
Dị thường thời gian (ghi rõ, không ảnh hưởng kết luận): dòng gateA
poll 3 ghi 19:44:10Z với load/R3-lock giống hệt trạng thái trước
reboot, trong khi `uptime -s` cho boot #48 là 19:43:46Z — chưa giải
thích được chắc chắn (có thể đồng hồ nhảy sau reboot, hoặc script còn
sống qua lúc restart của exec service); không dùng dòng này để kết
luận gì thêm vì gate không mở và không có probe nào chạy ở attempt4.

### 1.5 RAM/load toàn đợt — RAM là nút thắt

- 21 lần lấy mẫu 5 phút (poller): RAM avail min **350 MB**, median
  **724 MB**, max 3899 MB; chỉ **8/21 lần ≥1024 MB**. Các đỉnh RAM
  (3899 MB lúc 18:18, 1793 MB lúc 18:04) đều là thoáng qua ngay sau
  reboot, trước khi các browser khác lên — sụt lại 350–700 MB trong
  vòng ~15 phút sau đó.
- Load: nhiều cửa sổ yên thật (attempt3 poll 1–5: load1 0,19–0,46,
  load5 0,35–0,45; attempt2 poll 9: 0,66/1,41) nhưng RAM không đủ;
  các pha nặng của R1 (attempt1: load1 tới 23,39) và R3 (attempt3/4:
  load1 tới 28,09) xen kẽ giết cửa sổ yên ngay khi RAM vừa đủ.
- Kết luận: với 8–10 luồng song song + 2 reboot trong một lượt cron,
  máy không có đủ cửa sổ mà RAM ≥1 GB VÀ load yên VÀ không luồng nào
  giữ vite/browser cùng lúc. Nợ lượt yên xác nhận cần một lượt được
  xếp lịch khi các luồng khác đã xong (như Q5 §8.1 đã đề xuất), hoặc
  chạy lượt yên ở lượt cron mà các luồng đo nặng không chạy cùng.

## 2. Label-at-capture — KHÔNG làm lại (đã đo xong ở N4)

Theo task giao + N4 §2.2 + prereg-r5: label-at-capture theo
currentTime ĐÃ ĐO XONG, KHÔNG đáng làm. R5 không chạy lại mô phỏng,
không đổi production.

## 3. (b) unique-match + F6' — KHÔNG đo được (không có dữ liệu)

Không có JSON attempt2 (chết trước khi ghi) → không chạy
`analyze-r5-labellag.py` / `analyze-r5-skiplatest.py` được.
**F6' vẫn ĐÃ ĐÓNG từ L7 — R5 không đóng lại, không mở lại, không kiểm
lại được đợt này.** Ghi rõ để khỏi hiểu là đã kiểm lại.
Nhãn ghost vẫn nhiễu (cấu trúc) theo Q5 — không có số mới đợt này.

## 4. Stale-ghost — KHÔNG quan sát được (không có dữ liệu (b))

Event P4 frame-26 (lag +6..+12f, nhãn chạy 14→20) và event Q5
seq 282–285 (lag +68f, label 0 / pixels 68, ghost stale sau seek)
đều không được tái hiện hay bác bỏ thêm đợt này. Theo dõi tiếp ở
lượt yên sạch sau. Không gộp 2 event làm một (chữ ký khác nhau, xem
LIMITS Q5 §3.1.1).

## 5. Kiểm chứng hồi quy — KHÔNG chạy lại (cây không đổi, đã PASS ở Q5)

- `tsc` apps/web + `ghostBlend.probe.test.ts` 15/15 + `vite build`:
  KHÔNG chạy lại đợt này — cây đo `03bf029f…` KHÔNG ĐỔI so với Q5
  (md5 kiểm nhiều lần, trước/sau attempt2: 03bf029f→03bf029f), và Q5
  đã chạy PASS trên đúng cây này (tsc exit 0, ghostBlend 15/15, N1
  vite build PASS đợt 112). R5 không sửa production nên không có gì
  để hồi quy thêm; ghi rõ để khỏi hiểu là đã chạy đợt này.
- preview.tsx md5 `03bf029f…` không đổi trong suốt 4 lần thử.
- Không sửa file production nào.

## 6. Sự cố hạ tầng trong lúc đo

1. **Reboot #47 (17:45:50Z, gap 2h01'01"):** giết poller v1 của R5
   (chỉ kịp 1 mẫu 17:45:47Z). Poller v2 (setsid, session riêng) chạy
   lại 18:03:35Z và sống tới reboot #48.
2. **Reboot #48 (19:43:46Z, gap 1h57'56"):** giết attempt4 đang poll
   gate + poller v2 + mọi process R5. Replay apt sau boot #48 đang
   chạy lúc R5 kết thúc (19:45Z) — postboot #48 chưa kiểm, chuyển
   tiếp cho luồng hạ tầng.
3. **Replay apt sau boot #47** chạy lúc 18:02–18:04Z (cài
   libgssdp-1.6-0, libgtk-4-1) — gate 0 MỚI đã phát hiện đúng (attempt
   nào cũng kiểm postboot + apt trước lớp A); postboot #47 PASS
   18:19:51Z sau khi replay xong. Bài học Q5 (đo ngay sau boot trong
   lúc replay chạy) đã được khắc phục bằng gate 0 — lần này không có
   lượt đo nào bị replay nhiễm.
4. **Dương tính giả ở đếm blocker (attempt1):** shell giám sát của R6
   chứa chuỗi `preview-b-f3-flip-webkit-r5-*.json` trong args nên khớp
   pattern `[w]ebkit`. R5 đã sửa `run-r5.sh` (loại trừ shell chứa
   `sleep`/`poll-r*`) trước attempt2; đếm blocker attempt2–4 đã sạch
   (ps-before attempt2: 0 blocker thật).
5. **Vite lock:** R5 acquire 1 lần thành công ngay (attempt2, port
   5184), nhả sạch sau khi probe chết (kill-vite TERM pid node, ps
   sạch, curl :5184 = 000). Không có vite mồ côi của R5. Vite.lock
   còn lại trên đĩa sau reboot #48 là của R3 (boot #47) — stale, R5
   không đụng.
6. **RAM dao động mạnh cả đợt** (350 → 3899 → 350 MB). Đỉnh RAM chỉ
   xuất hiện thoáng qua sau reboot. Không có process mồ côi nào để
   giải phóng an toàn; phần RAM còn lại nằm ngoài tầm nhìn process
   của cell.

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND115_R5_F6P60MS_LIMITS.md` — file này. **File duy
  nhất trong repo mà R5 thay đổi** (probe copy + analyzer + dữ liệu
  đo đều ở hidden_files; mp4 fixture ở `apps/web/public/` là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round115-r5-f6p60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round115-r5/`
  (prereg-r5.md [viết trước khi đo], probe115r5-ghost-k7.webkit.mjs
  [copy Q5, md5 `a690d828…`], analyze-r5-{tickcost,labellag,
  skiplatest,wallbands,lag5}.py [copy Q5, md5 khớp bản Q5],
  analyze-r5-dryrun-{tickcost,wallbands}.txt [dry-run trên JSON Q5,
  tái tạo đúng median 70,0 / wallbands Q5 §1.4],
  b.json [copy Q5, md5 `078938cf…`],
  vite.r5-temp.config.mjs [copy Q5, HMR tắt, watch.ignored 0 watch],
  vcut-vite-lock-r5.sh [bản copy đóng băng, md5 `fd21193c…`],
  run-r5.sh [adapt từ run-q5.sh: gate 0 replay + RAM ≥1024 + cờ R2,
  exit 5/6 thay vì chạy "cho có", sampler load-mid 20 s, log tách theo
  lần đo, đã sửa grep đếm blocker sau attempt1],
  poll-r5.sh + poll-r5.log [21 mẫu 5 phút + 32 dòng gateA + ghi chú
  reboot], chain-r5.log, postboot-r5-b46.log [PASS 17:44:23Z],
  postboot-r5-b47-try1.log [PASS 18:19:51Z],
  postboot-r5-attempt{1,2,3,4}-gate0.log [check-only trước mỗi lần
  thử, đều PASS trên boot #47],
  ps-before/after-r5-attempt2.txt, load-mid-r5-attempt2.log [56 mẫu
  20 s, load1 max 1,77],
  run-webkit-r5-attempt2.log [pass 1–9 + lỗi pass 10, mtime 19:12:14],
  vite-5184-r5-attempt2.log, marker-r5-attempt2,
  run-r5-attempt{1,2,3,4}.nohup.log).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ M5/L7/N4/P4/Q5).
- Cờ xong: `hidden_files/round115-r5-done` (kèm verdict 1 dòng).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ theo N4 nhưng MỎNG — VẪN CẦN 1 lượt
   yên xác nhận ở vòng sau (lần thứ 4 liên tiếp chưa chốt được: N4
   tải trôi, P4 P3 chen, Q5 replay apt, R5 RAM + reboot).** Không có
   số đo mới đợt này (attempt2 chết vì hạ tầng, không phải vì tick
   chậm). Lượt xác nhận tiếp theo cần: (a) chạy SAU KHI postboot PASS
   cho boot hiện tại (replay xong — gate 0 của R5 đã làm đúng, giữ
   lại); (b) chạy khi các luồng khác đã xong/đang pha nhẹ — đợt 115
   cho thấy R1/R3 thay nhau giữ vite lock + đẩy load1 lên 23–28 ngay
   trong cửa sổ R5 chờ; (c) bắt đầu với RAM avail ≥ ~1 GB (giữ điều
   kiện này — đợt này RAM median chỉ 724 MB); (d) cùng cây 03bf029f
   (hoặc ghi rõ nếu cây đổi — cờ R2-tree đã chứng minh cơ chế chờ cờ
   hoạt động: R2 hoàn tác cây fix về baseline trước khi R5 đo);
   (e) lấy mẫu load1 GIỮA lượt (R5 đã làm: 56 mẫu/20 s ở attempt2 —
   giữ lại, và đây là lần đầu có số giữa lượt đầy đủ).
2. **Bổ sung vào prereg đợt sau (nợ mới từ attempt2):**
   (i) điều kiện RAM GIỮA lượt — attempt2 mở gate với RAM 1515 MB
   nhưng sụt xuống 350–600 MB trong cửa sổ và chết ở pass 10; prereg
   hiện tại chỉ kiểm RAM lúc bắt đầu. Đề xuất: ghi RAM vào load-mid
   sampler (đã có) và coi "RAM avail rơi < ~500 MB giữa lượt" là một
   mục lớp B (tải/hạ tầng chen vào), để lượt như attempt2 được phân
   loại rõ ràng thay vì "chết không rõ nguyên nhân".
   (ii) timeout wall-clock cho mỗi pass trong probe (hiện tại pass lặp
   tối đa 1500 khung rAF, không giới hạn thời gian — pass 10 kẹt 17
   phút mới chết; một timeout ~120 s/pass sẽ fail nhanh, sạch hơn,
   và giữ lại được dữ liệu các pass đã xong nếu probe ghi JSON từng
   pass thay vì chỉ ghi cuối lượt — đề xuất ghi JSON tăng dần, để
   lần sau không mất cả 9 pass vì 1 pass kẹt).
   (iii) kiểm tra stale vite.lock sau reboot trước khi đo (lock của
   luồng đã chết còn lại trên đĩa — R5 gặp lock R3 stale sau reboot
   #48; acquire cần phân biệt lock sống/chết qua boot_id + pid).
3. **Sự kiện ghost stale sau seek seq 282–285 (Q5 §3.1.1):** chưa được
   theo dõi thêm (không có dữ liệu (b) đợt này). Cần lượt yên sạch để
   xem có tái hiện không; nếu tái hiện thì ưu tiên luồng riêng chẩn
   đoán cơ chế (có liên quan fix E4 steady-close không — CHƯA kết
   luận, cần đối chứng A/B); nếu không tái hiện thì coi là sự kiện
   đơn lẻ trong lượt nhiễm tải Q5. Event P4 frame-26 cũng vậy.
4. **Postboot boot #48 CHƯA kiểm** (replay apt đang chạy lúc R5 kết
   thúc 19:46Z) — luồng hạ tầng đợt sau kiểm lại bằng script postboot
   của Q7 (check-only trước, chỉ --repair khi cần) rồi mới đo.
   Vite.lock stale của R3 (boot #47, pid 105555) còn trên đĩa sau
   reboot #48 — R3/luồng hạ tầng xử lý, R5 không đụng.
5. **(A) label-at-capture theo currentTime: ĐÃ ĐO XONG, KHÔNG đáng
   làm** (N4 §2.2). Nợ theo nghĩa rộng (nhãn theo frame đã giải mã
   thật) vẫn mở.
6. **Nhãn ghost vẫn nhiễu (cấu trúc)** theo Q5 — không có số mới.
   Muốn nhãn tốt hơn phải đổi cơ chế anchor/label — không phải chờ
   máy yên.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 114 §10:** G1 + mù #22 +
   mù #28 + mù #29 + mù #30 + mù #31 + mù #32 chờ user quyết; mù #33
   ĐÃ ĐÓNG HOÀN TOÀN (R7 probe #34, 17:45:02Z 14/11); mù #34 mới mở
   (chứa #47–#48) chờ user quyết; E4 cần đợt xác nhận tải cao trên cây
   03bf029f; ring 8 MiB cần đo lag push/take trực tiếp; điểm gãy tải
   cần tích đủ tick; postboot-check script vẫn ghi tham chiếu #42
   trong header (cần cập nhật lên boot hiện tại — luồng hạ tầng);
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ
   user; release gate không đổi. Reboot mới nhất: boot #48 19:43:46Z
   (gap #47→#48 = 1h57'56"), apt replay đang chạy lúc R5 kết thúc.

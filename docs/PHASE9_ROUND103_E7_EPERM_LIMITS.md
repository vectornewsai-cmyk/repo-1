# PHASE9 ROUND103 E7 — EPERM: probe #22 + khoảng mù #21 (nợ LIMITS gộp đợt 102 §4 mục 7)

> Luồng E7, đợt 103 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07,
> 13/11/2026; làm việc ~05:40–05:50Z 13/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + đóng khoảng mù #21 kể từ probe #21
> (02:39:32Z 13/11) + quét writeFileSync theo chuẩn mới (đối chiếu
> snapshot D5 đợt 102) + ghi RAM hiện tại (birefnet: KHÔNG chạy — vẫn
> dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền. KHÔNG tự đóng reboot #16 hay EPERM** — chỉ báo cáo
> "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 05:40:20Z
  báo **DEAD/STALE** (heartbeat age 10.848 s, last #21 02:39:32Z,
  boot 249407b6, exit 1); `once` ngay sau đó là **probe #22,
  boot 9576eac3 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 6 s, n=22), exit 0.
- **Reboot #27: 05:26:18Z (chính xác từng giây)** — 249407b6 →
  9576eac3, đo trực tiếp (`uptime -s` + `boot_id`, xác nhận lại
  05:48:18Z không đổi). Khoảng cách #26 → #27 = **3h14'08" — DÀI
  NHẤT từng ghi** (vượt 3h04'35" của #22 → #23). Chu kỳ nay là
  **27 lần / ~57h08' ≈ 2h07'/lần** (trước #27: 26 lần / ~53h54' ≈
  2h04'). Reboot tiếp theo dự kiến **~07:33Z** (dải khoảng cách quan
  sát 1h11'36"–3h14'08" cho phép 06:38Z–08:40Z).
- **Khoảng mù #21: 02:39:32Z → 05:40:24Z (3h00'52") — CHƯA ĐÓNG
  HOÀN TOÀN.** Reboot #27 đã chốt giờ từng giây, nhưng đuôi mù
  không-bản-ghi dài **1h45'25"** (kỷ lục — đuôi mù #20 chỉ 52'05")
  để lại một **lỗ ~17'23" (03:57:19Z–04:14:42Z) mà một reboot trung
  gian CÓ THỂ ẩn** (cả hai khoảng cách đều nằm trong dải quan sát).
  Tối đa 1 reboot trung gian có thể ẩn (2 reboot cần tổng ≥2h23'12"
  > 1h28'59" của đoạn trước #27). Đây là khoảng mù đầu tiên kể từ
  #8 không đóng được hoàn toàn bằng lập luận sàn khoảng cách.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật", 0
  "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong *.log
  đợt 102 + 103 tới lúc này; 19 dòng "sóng EPERM đã tắt" trong mù
  #21 (D6 ×17 + D7 O8 ×2) đều là **dương tính giả đã biết**. Sóng
  gần nhất vẫn là **~11:55–12:11Z** (R7) — ~41h29' trước probe #22.
  EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 443 dòng / 138 file** (phạm vi
  2676 file); R7b đối chiếu 468 dòng / 155 file; copies 25 dòng /
  17 file; đối chiếu chéo 443+25=468=R7b, **chênh 0 — lần thứ chín
  liên tiếp**. +12 dòng / +6 file so với D5, giải thích đúng hết
  bằng diff (xem §2.6). 0 file biến mất, 0 async `.writeFile(`
  trong phạm vi quét, 0 hit release*/build/.
- RAM 5 mẫu 1050 / 2535 / 2447 / 1314 / 1083 MB (max ~2,48 GB = 41%
  ngưỡng guard) — birefnet KHÔNG chạy. Reboot #16 VẪN MỞ (kẹp ~4',
  chờ parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 05:40:06Z | boot_id `9576eac3-08b2-40da-a2c8-d9faed40a5c5`; `who -b` Nov 13 05:26; `uptime -s` **2026-11-13 05:26:18Z** (uptime ~13'); journal chỉ 1 boot (9576eac3, first entry 05:26:29Z); `last -x reboot` 05:26 still running; wtmp bắt đầu 05:26:28Z |
| `bash scripts/probe-eperm-v2.sh status` | 05:40:20Z | **DEAD/STALE**, exit 1 — heartbeat n=21, ts 02:39:32Z, boot 249407b6, age **10.848 s**; last sample probe #21; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 05:40:24Z | **probe #22, boot=9576eac3, ok=2 fail=0**, exit 0; dòng `boot changed 249407b6 -> 9576eac3` (uptime since 2026-11-13 05:26:18) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 05:40:30–31Z | **ALIVE**, age 6 s, n=22, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 58 dòng, trước lượt 55 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=22, ts
05:40:24Z, pid=6868, boot 9576eac3-08b2-40da-a2c8-d9faed40a5c5).

Xác nhận lại cuối lượt (05:48:18Z): boot_id vẫn 9576eac3,
`uptime -s` vẫn 2026-11-13 05:26:18 (up 22'), log vẫn 58 dòng —
**không reboot nào trong lúc E7 làm việc.**

Lưu ý phương pháp (nhắc lại D5 §1): dòng `boot changed` của probe
nhảy thẳng 249407b6 → 9576eac3. Lần này bước nhảy KHÔNG che boot
trung gian nào đã biết — nhưng xem §2.3: một boot trung gian trong
lỗ 17'23" vẫn chưa loại trừ được, nên bước nhảy đơn này phải đọc
cùng với cảnh báo đó, đừng tin nó là 1 reboot duy nhất.

## 2. Điều tra khoảng mù kể từ probe #21

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 05:40–05:48Z)

- Boot hiện tại: `uptime -s` = **2026-11-13 05:26:18Z**, boot_id
  `9576eac3-08b2-40da-a2c8-d9faed40a5c5` — khác boot của probe #21
  (249407b6).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 9576eac3,
  first entry 05:26:29Z, last 05:45:21Z lúc kiểm tra). `last -x
  reboot`: chỉ 1 dòng (05:26, still running). wtmp bắt đầu
  05:26:28Z.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu. journal/wtmp chỉ
  giữ boot hiện tại, như mọi lần trước.

### 2.2 Reboot #27 trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 27 | **05:26:18Z (chính xác từng giây)** | 249407b6 → 9576eac3 | `uptime -s` + `boot_id` đo trực tiếp lượt này (05:40:06Z và xác nhận lại 05:48:18Z); `journalctl --list-boots` (first entry 05:26:29Z); `last -x reboot` (05:26, still running); wtmp bắt đầu 05:26:28Z. Không ai ghi nhận lúc xảy ra (không observer nào còn sống sau 03:57:19Z — xem §2.3). |

Khoảng cách #26 → #27 là **3h14'08" — dài nhất từng ghi**, vượt
kỷ lục cũ 3h04'35" (#22 → #23). Chu kỳ nay là **27 lần trong
~57h08'08"** (từ ~20:18:10Z 10/11 tới 05:26:18Z 13/11) — trung bình
**~2h07'/lần** theo cách đếm của W7/X7 (tổng thời gian / số
reboot). Reboot tiếp theo dự kiến **~07:33Z** (05:26:18Z +
~2h07') — dải khoảng cách quan sát (1h11'36"–3h14'08") cho phép
lệch tới ~06:38Z–08:40Z, như đã thấy ở #24 (B6 dự báo ~22:36Z,
thực tế 21:41:50Z, lệch ~54'). Mọi probe nền đều chết theo reboot;
v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục bằng 1
mẫu mới.

Khoảng mù #21 là **khoảng mù thứ 14 liên tiếp (#8–#21) chứa
reboot**.

### 2.3 Hoạt động trong khoảng mù — vì sao KHÔNG đóng được hoàn toàn, và lỗ 17'23" là gì

Hoạt động ghi đĩa liên tục 02:39:32Z → 03:57:18.994Z:

- **02:39–03:57Z (boot 249407b6):** D1–D9 đợt 102 làm việc suốt
  (LIMITS D1 03:10Z, D8 03:24Z, D2 03:26Z, D7 03:27Z, D4 03:30Z,
  D3 03:32Z, D6 03:32Z, D9 VERIFY LIMITS 03:50:41Z, LIMITS gộp đợt
  102 03:51:25Z, GAP_ANALYSIS §31 03:51:38Z, build-loop-log
  03:52:09Z); D9 verify chạy vite build (dist output tới
  03:54:34.947Z) + suite U4 (file work round93-u4 tới
  03:57:18.994Z). D9 poll 02:40–03:40Z, 0/8 → 8/8, boot 249407b6
  suốt — **không reboot nào trong đoạn này**.
- **Bản ghi cuối cùng trên cả hai cây: 03:57:18.994Z**
  (`hidden_files/round93-u4/work/measurements.json`, output suite
  U4 của D9 verify; repo-1 muộn nhất 03:54:34.947Z, dist build).
  Kẹp bằng cả hai cây theo A8 §4 mục 10 — lấy mốc muộn nhất.
- **Sau 03:57:18.994Z thì không có bản ghi nào cho tới probe #22:**
  khoảng trống không-bản-ghi **1h45'25" (03:57:18.994Z →
  05:40:24Z)** — dài nhất từng ghi (đuôi mù #20: 52'05"). 0 file
  nào trên cả hai cây + /tmp trong khoảng trống này (find
  `-newermt` toàn cửa sổ + kiểm riêng lỗ, xem dưới). Đợt 102 đã
  đóng từ ~03:57Z và đợt 103 chỉ spawn lúc 05:35:51Z
  (12:35:51 +07) — chưa kịp ghi file nào trước probe #22 ngoài
  chính log/heartbeat probe.

Đuôi mù chia làm hai đoạn bởi #27:

- Đoạn TRƯỚC #27: 03:57:18.994Z → 05:26:18Z (**1h28'59"**).
- Đoạn SAU #27: 05:26:18Z → 05:40:24Z (**14'06"**).

**Đoạn sau #27 — LOẠI TRỪ TRỰC TIẾP (chắc chắn):** nằm gọn trong
một boot đã xác định — `uptime -s` vẫn 05:26:18Z + boot_id không
đổi lúc probe #22 (05:40:06Z) và xác nhận lại cuối lượt
(05:48:18Z); cộng thêm hoạt động spawn đợt 103 từ 05:35:51Z trên
boot mới (E1/E5/E8/E9 đã có file trên đĩa lúc 05:40–05:45Z).
Không có reboot nào trong đoạn này (phương pháp C6 §4 mục 2).

**Đoạn trước #27 — LẬP LUẬN SÀN KHOẢNG CÁCH ĐỂ LẠI LỖ (mới, lượt
này):** mọi reboot trung gian tại thời điểm T trong đoạn này đều
đòi một khoảng cách T → #27 ≤ 1h28'59". Sàn khoảng cách chính xác
từng ghi là 1h11'36" (#23 → #24). Do đó:

- T ∈ (04:14:42Z, 05:26:18Z): khoảng cách tới #27 < 1h11'36" —
  **loại trừ** (thấp hơn sàn).
- T ∈ (03:57:18.994Z, 04:14:42Z]: khoảng cách tới #27 ∈
  [1h11'36", 1h28'59") và khoảng cách #26 → T ∈ (1h45'09",
  2h02'32"] — **cả hai đều nằm gọn trong dải quan sát
  (1h11'36"–3h14'08")** — **KHÔNG loại trừ được**.

**Lỗ chưa loại trừ được rộng ~17'23" (03:57:19Z–04:14:42Z).** Một
reboot trung gian duy nhất có thể ẩn trong lỗ này mà không phá vỡ
bất kỳ khoảng cách nào từng quan sát. Hai reboot trung gian thì
**loại trừ được**: chúng cần tổng hai khoảng cách ≥ 2 × 1h11'36"
= 2h23'12" > 1h28'59" của toàn đoạn trước #27.

**Kết luận trung thực: khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN.** Reboot
#27 đã chốt giờ từng giây; tối đa 1 reboot trung gian có thể ẩn,
giới hạn trong lỗ 17'23". Đây là khoảng mù đầu tiên kể từ #8
không đóng được hoàn toàn — mù #20 đóng được vì đuôi của nó chỉ
52'05" với hai đoạn 24'43"/27'22" đều thấp hơn ~3 lần sàn. Nguyên
nhân lần này: đuôi không-bản-ghi quá dài (1h45'25") vì đợt 102
đóng sớm (~03:57Z) mà đợt 103 spawn muộn (05:35:51Z).

Cảnh báo phương pháp: sàn 1h11'36" là sàn *chính xác*; kẹp
#16 → #17 (~31'–35', không chính xác) nếu là thật thì sàn còn
thấp hơn và lỗ còn rộng hơn. Lập luận này chỉ loại trừ reboot,
không loại trừ sóng EPERM — sóng không đổi boot_id/uptime.

### 2.4 Bảng khoảng cách liên tiếp đã xác nhận (cập nhật từ D5 §2.4)

| Cặp | Khoảng cách |
|---|---|
| #14 ~03:25Z → #15 05:17:47Z | ~1h53' |
| #15 05:17:47Z → #16 ~07:26–07:30Z | ~2h08'–2h12' |
| #16 ~07:26–07:30Z → #17 08:01:15Z | ~31'–35' (kẹp, không phải giờ chính xác) |
| #17 08:01:15Z → #18 09:24:17Z | 1h23'02" |
| #18 09:24:17Z → #19 11:30:25Z | 2h06'08" |
| #19 11:30:25Z → #20 13:24:41Z | 1h54'16" |
| #20 13:24:41Z → #21 15:24:27Z | 1h59'46" |
| #21 15:24:27Z → #22 17:25:39Z | 2h01'12" |
| #22 17:25:39Z → #23 20:30:14Z | 3h04'35" |
| #23 20:30:14Z → #24 21:41:50Z | **1h11'36" (ngắn nhất có giờ chính xác)** |
| #24 21:41:50Z → #25 23:51:21Z | 2h09'31" |
| #25 23:51:21Z → #26 02:12:10Z | 2h20'49" |
| #26 02:12:10Z → #27 05:26:18Z | **3h14'08" (dài nhất)** |

Sàn khoảng cách chính xác vẫn là 1h11'36" (không đổi); trần nay
là 3h14'08" (mới). Hệ quả cho §2.3: mọi reboot trung gian trong
đoạn trước #27 đều sẽ đòi một khoảng cách ≤1h28'59" — chỉ thấp
hơn sàn 17'23" ở đầu mút, nên lỗ 17'23" còn lại.

### 2.5 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 102 + đợt 103 tới lúc này

Khoảng mù 02:39:32Z → 05:40:24Z (3h00'52") được phủ bởi các luồng
sibling đợt 102 (D1–D9, làm việc tới ~03:57:19Z) + khoảng trống
1h45'25" + spawn đợt 103 (~05:35:51Z, E1/E5/E8/E9 đã có file
trước probe #22 — nhưng file của họ đều sau 05:35:51Z, không phủ
được đuôi mù). Đã đọc lại log thật (grep `sóng EPERM vẫn bật` /
`CẢNH BÁO: chờ sóng` / `Operation not permitted` / `sóng EPERM đã
tắt` trên toàn bộ cây `hidden_files/round102-*` +
`round103-*` + `build-loop-log.md` + `docs/PHASE9_ROUND102_*.md`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| D1–D9 (`docs/PHASE9_ROUND102_*.md` + log) | 02:39–~03:57Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật (8 hit grep thô đều là chữ trong LIMITS của D5/D9 trích lại số đếm "0 ... thật") |
| D6 (12 lượt probe WebKit i1–i12 + retry) | 03:00–03:09Z | 17 dòng "sóng EPERM đã tắt" (run-d6.log ×12, run-d6-retry.log ×3, run-d6-retry2.log ×2) — **dương tính giả đã biết** |
| D7 O8 (Chromium + WebKit) | ~03:2x–03:3xZ | 2 dòng "sóng EPERM đã tắt" (o8.log) — **dương tính giả đã biết**; O8 21/21 cả 2 engine ngay lần đầu |
| E5 đợt 103 (trial-n1.log) | 05:43:04Z (SAU probe #22) | 1 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết**, ngoài mù #21, ghi để đủ số |
| 03:57:19Z → 05:40:24Z | — | **Không có bản ghi nào** (đuôi mù 1h45'25" — xem §2.3) |

Tổng trong *.log thật: **19 dòng "đã tắt" trong mù #21** (D6 ×17
+ D7 ×2) + 1 dòng sau probe #22 (E5). Grep rộng cả .md cho 50
hit — 30 hit còn lại đều nằm trong file .md LIMITS / build-loop-log
trích lại số đếm, không phải sự kiện. **0 dòng "vẫn bật", 0 "CẢNH
BÁO", 0 "Operation not permitted" thật trong mọi nguồn.**

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 19 dòng "sóng EPERM đã tắt, khởi động vite"
trong khoảng mù đều là dòng in khi lần ghi thử ĐẦU TIÊN thành
công ngay (code launcher `waveOff=true` ở lần write đầu) — in mặc
định cả khi không có sóng. Bằng chứng phân biệt: **0 dòng "sóng
EPERM vẫn bật sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM
10 phút"** trong toàn bộ cây round102 + round103 tới lúc này;
**0 lần "Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **1h45'25" cuối mù (03:57:19Z → 05:40:24Z) là mù
  hoàn toàn**, đủ dài để chứa nhiều sóng ~16 phút mà không để lại
  dấu vết nào trong hồ sơ — và lần này, khác mù #20, đuôi mù
  cũng **chưa loại trừ được reboot trung gian trong lỗ 17'23"**
  (§2.3). Mù #21 "mù" hơn mù #20 ở cả hai khía cạnh.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~41h29'24" trước
  probe #22 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được
  tuyên bố là đã hết.
- Khoảng trống không-bản-ghi 1h45'25" dài gấp ~2 lần đuôi mù #19
  (~48') và mù #20 (~52') — vì đợt 102 đóng sớm (~03:57Z) và đợt
  103 spawn muộn (05:35:51Z).

### 2.6 Quét writeFileSync (snapshot 05:44:05–05:44:28Z)

Chạy lại đúng script chuẩn mới của D5 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round103-e7`:

- Chuẩn mới: **443 dòng / 138 file** (phạm vi 2676 file).
  D5: 431 dòng / 132 file (phạm vi 2658 file).
- R7b (đối chiếu): **468 dòng / 155 file**. D5: 456 / 149.
- Copies: **25 dòng / 17 file** — y hệt D5.
- Đối chiếu chéo 443+25=468=R7b, **chênh 0 — lần thứ chín liên
  tiếp**.
- **+12 dòng / +6 file so với D5, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ, không file nào
  giảm):
  - +1 `apps/web/scripts/probe102d6.mjs` (D6 đợt 102 — hạ cánh
    02:52:06Z, sau snapshot D5 02:46:25Z)
  - +1 `apps/web/scripts/probe103e5.mjs` (E5 đợt 103)
  - +5 `apps/web/scripts/probe103e6-frame-parity.mjs` (E6 đợt 103)
  - +3 `docs/PHASE9_ROUND102_D5_EPERM_LIMITS.md` (file LIMITS của
    chính D5 — 02:52:34Z, sau snapshot D5)
  - +1 `docs/PHASE9_ROUND102_D9_VERIFY_LIMITS.md` (D9, 03:50:41Z)
  - +1 `docs/PHASE9_ROUND102_LIMITS.md` (closing, 03:51:25Z)
  - Tổng: 1+1+5+3+1+1 = **12** ✓, 6 file ✓ (diff R7b giống hệt)
- **0 file biến mất** (scope +18 file: 6 script/benchmark mới +
  2 file D3 `rvfcClipWindow.ts` + test + 10 docs LIMITS đợt 102
  D1–D9 + gộp = 18 ✓).
- Async `.writeFile(` trong phạm vi quét: **0** (các dòng helper
  epermRetry đều là `writeFileSync`, đã nằm trong số đếm chuẩn
  mới — vd `server/eperm-retry.cjs:66`).
- Hit list **0 đường dẫn release*/build/**.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable trong lượt: **1050 / 2535 / 2447 / 1314 / 1083
MB** (05:41:32Z, 05:44:05Z, 05:45:32Z, 05:46:37Z, 05:48:18Z). Max
~2,48 GB = **41% ngưỡng guard 6144 MB** — cao hơn max 1,80 GB
(29%) của D5, do tải 8–10 luồng đợt 103 chạy song song (loadavg
13,81 lúc 05:48:18Z), nhưng vẫn dưới một nửa ngưỡng guard.
Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử
lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử
lại). Birefnet-general vẫn 0 lần chạy thành công trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Đuôi mù dài thì sàn khoảng cách có thể không đóng được mù**
   (mới, lượt này): mù #20 đóng được vì đuôi chỉ 52'05" (hai đoạn
   24'43"/27'22" << sàn 1h11'36"); mù #21 đuôi 1h45'25" (đoạn trước
   #27 dài 1h28'59") để lại lỗ 17'23". Khi đuôi dài hơn ~2× sàn
   thì lập luận sàn mất tác dụng một phần — phải báo lỗ rõ ràng
   thay vì ép đóng. Công thức lỗ: (bản-ghi-cuối, giờ-reboot −
   sàn] — ở đây (03:57:19Z, 04:14:42Z].
2. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây** (A8 §4 mục
   10): lượt này file cuối trước khoảng trống khác nhau giữa hai
   cây (hidden_files: measurements.json 03:57:18.994Z; repo-1:
   dist output 03:54:34.947Z) — lấy mốc muộn nhất (03:57:18.994Z).
   Lưu ý: file muộn nhất của hidden_files nằm trong thư mục cũ
   round93-u4/work (output suite U4 của D9 verify) — đừng chỉ nhìn
   thư mục đợt hiện tại khi tìm mốc.
3. **Đuôi mù nằm gọn trong một boot đã xác định thì loại trừ được
   reboot bằng uptime** (C6 §4 mục 2): áp dụng cho đoạn SAU #27
   (05:26:18Z → 05:40:24Z) — `uptime -s` vẫn 05:26:18Z + boot_id
   không đổi lúc probe #22 và xác nhận lại cuối lượt. Không áp
   dụng cho đoạn TRƯỚC #27 — đoạn đó dùng lập luận sàn (§2.3).
4. **Dòng `boot changed` của probe có thể bỏ qua boot trung gian**
   (A8 §4 mục 6, nhắc lại): lượt này bước nhảy đơn 249407b6 →
   9576eac3 — lần này chưa biết có boot trung gian hay không (lỗ
   17'23"), đừng tin bước nhảy là 1 reboot duy nhất.
5. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8):** lượt này áp dụng lại: 19 dòng "đã tắt" trong mù
   #21 (D6 ×17, D7 ×2) + 1 dòng sau probe #22 (E5) đều là dương
   tính giả; 0 dòng "vẫn bật", 0 "Operation not permitted" thật.
   Đếm "đã tắt" trong *.log thật, không đếm hit grep rộng cả .md
   (50 hit — 30 hit là LIMITS trích lại số đếm).
6. **Kiểm tra số liệu lịch sử trước khi trích lại** (B6 §4 mục 11):
   lượt này tính lại chu kỳ (27 lần / ~57h08' ≈ 2h07') và khoảng
   cách #26 → #27 (3h14'08", dài nhất mới) từ giờ boot gốc trong
   log probe + `uptime -s`, thay vì copy số của D5.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN** — lần đầu tiên kể từ #8
   một khoảng mù không đóng được bằng lập luận sàn: lỗ ~17'23"
   (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung gian.
   Lượt sau (probe #23) đối chiếu từ mốc probe #22 (05:40:24Z);
   lỗ này không còn dữ liệu nào để thu hẹp thêm (journal/wtmp
   volatile, không có /var/log/syslog hay kern.log) — parent/user
   quyết xem có chấp nhận "tối đa 1 reboot ẩn trong lỗ 17'23"" làm
   mức đóng của mù #21 hay để mở như reboot #16.
2. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #22 OK 2/2) — và 1h45'25" cuối khoảng mù #21 hoàn
   toàn không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~41h29'
   trước probe #22.
3. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). E7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #21 dài 3h00'52" với đuôi không-bản-ghi 1h45'25" —
   dài nhất từng ghi — và reboot #27 không ai quan sát lúc xảy ra.
4. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; 3 dòng lạ 11:59–12:00Z vẫn còn trong log, không
   thêm dòng lạ mới trong lượt này — log tăng đúng 3 dòng checklist).
5. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
6. **VM reboot ~2h07'/lần** (27 lần/~57h08'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến **~07:33Z**; lúc 05:48:18Z máy vẫn
   trên boot 9576eac3. Dải khoảng cách quan sát nay là
   **1h11'36"–3h14'08"** (trần mới).
7. **Birefnet: KHÔNG chạy trong lượt này** — RAM 5 mẫu MemAvailable
   **1050 / 2535 / 2447 / 1314 / 1083 MB** (max ~2,48 GB = 41%
   ngưỡng guard 6144 MB). Max cao hơn D5 (1,80 GB) do tải song
   song, vẫn dưới một nửa ngưỡng guard nên chưa đủ mức thử lại theo
   quy tắc parent đợt 92 §3 mục 7. Ghi rõ để parent quyết: nếu RAM
   khả dụng chạm ≥ 6 GB thì mới thử lại. Birefnet-general vẫn 0 lần
   chạy thành công trong gói.
8. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
9. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
10. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    E7 không thử lại nguồn nào, theo đúng lệnh.
11. **Khoảng mù #22 bắt đầu từ 05:40:24Z** (probe #22) — lượt sau
    (probe #23) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~07:33Z.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND103_E7_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round103-e7-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round103-e7.md`
(log luồng); scratch trong `hidden_files/round103-e7/` (scan-wfs.sh,
scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
wfs-r7b.txt, files-copies.txt, wfs-copies.txt, probe-notes.txt);
log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

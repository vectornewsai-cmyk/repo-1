# PHASE9 ROUND135 T2 — EPERM: probe #54 ok=2 fail=0 + mù #54 ĐÓNG HOÀN TOÀN (7/7 đoạn, 0 ẩn) + 6 gap MỚI CHỨNG NHẬN DẠNG KHOẢNG + CERT n=53 / FULL n=68 + 3 reboot NGOÀI dải liên tiếp (#86?/#87?/#88?)

> Luồng T2, đợt 135 vòng lặp Phase 9 VCut Studio (lượt cron 09:35 +07
> 18/11/2026; làm việc 02:40Z → ~03:00Z 18/11/2026).
> Nhiệm vụ: probe #54 theo lịch thường lệ + mù #54 (từ probe #53) +
> chuỗi reboot (6 reboot mới #85?→#90? + khung chết các boot mới) + quét
> sóng EPERM + WFS lần 41. Quyết parent đợt 134 §12.3: (a) GIỮ fix T3
> preview.tsx 530e10a7 cho đợt 135; (b) PHÊ DUYỆT đổi thứ tự ghi log
> RELEASED/cooldown (T6 đợt 135 thực hiện); (c) khung chết #82? bản hẹp
> (21:29:47Z, 21:41:40Z] làm chuẩn; (d) R9 (a) SỐ ĐẾM VẪN LÀ 16 — KHÔNG
> tăng, KHÔNG viết 17. Prereg viết TRƯỚC khi đo:
> hidden_files/round135-t2/prereg-t2.md. **Prereg KHÔNG có dự báo verdict
> SAI** (xem §4: mọi dự báo verdict hoặc đúng, hoặc ghi rõ "chưa quyết" /
> "chưa rõ" và quyết sau khi quét; 2 ghi chú: đuôi F không vượt sàn như
> lo ngại, và số dải cơ học prereg lệch 1 s do cắt float — F-135-T2-1).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43 / mù #42 đoạn B** (quyết parent đợt 124 §12.3
> + §12.4, đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). **Mù #50
> ĐÃ ĐÓNG HOÀN TOÀN đợt 131 — KHÔNG kiểm lại. Mù #49 B: KHÔNG kiểm
> lại thường lệ** theo quyết parent đợt 132 §12.3(d). **Mù #51 B:
> KHÔNG kiểm lại đợt này** (đã kiểm 3 lần, verdict ổn định, không có
> bằng chứng mới — xem §2.6). **Mù #53 B: KHÔNG kiểm lại đợt này**
> (verdict đợt 134 còn mới, không có bằng chứng mới).
> **KHÔNG có reboot giữa phiên T2 lượt này** — boot 78b55838 từ lúc mở
> (02:40Z) tới lúc đóng (~03:00Z). Mù #55 MỚI MỞ từ probe #54 — việc
> của T2 đợt 136.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (02:45:23Z):** `status`
  báo **DEAD/STALE** (heartbeat age 10.709 s, last #53 23:46:54Z, boot
  d2e66749, exit 1); `once` ngay sau đó là **probe #54, boot
  78b55838, ok=2 fail=0**, exit 0, 02:45:23Z; `status` chạy lại
  **ALIVE** (age 0 s, n=54), exit 0. Log v2 tăng đúng **3 dòng**
  (151 → 154) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=54, ts 02:45:23Z, boot 78b55838.
- **Boot #90? (tạm) lúc 02:27:27Z, boot
  `78b55838-d09e-4cfc-b491-a15935b7a447`** — xác minh bằng `uptime -s`
  + btime 1794968847 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại: HTTP `Date` cả 3 server đều khớp **0 tới +1 s** (server hơn
  local 0–1 s) → **F90? ≈ −1 s (±~1 s)** — đo trực tiếp đầu tiên
  trên boot mới. T6-135 sẽ chốt chuỗi tương đối, số tuyệt đối VẪN TẠM
  (giữ "?").
- **Khoảng mù #54 (23:46:54Z 17/11 → 02:45:23Z 18/11, 2h58'29" =
  10.709 s) — ĐÓNG HOÀN TOÀN, 7/7 đoạn, tối đa 0 ẩn.** Lần đầu một mù
  đóng hoàn toàn kể từ mù #52 (chuỗi: #50 đóng, #51 hở, #52 đóng,
  #53 hở, #54 đóng). Merged 4 phạm vi: 350 mốc giây; lỗ lớn nhất
  toàn mù 718 s (đuôi F) < sàn 1.147 s. Hai cây riêng cũng đóng cả
  7 đoạn (lỗ lớn nhất 717 s, đuôi F).
- **6 gap MỚI CHỨNG NHẬN DẠNG KHOẢNG** — lần đầu một đợt chứng nhận
  nhiều hơn 1 gap: #84?→#85? = [1.569 s, 1.589 s] (mid 1.579 s);
  #85?→#86? = [1.168 s, 1.188 s] (mid 1.178 s); #86?→#87? = [45 s,
  65 s] (mid 55 s); #87?→#88? = [216 s, 236 s] (mid 226 s);
  #88?→#89? = [4.412 s, 4.432 s] (mid 4.422 s); #89?→#90? =
  [3.359 s, 3.379 s] (mid 3.369 s). **CERT n=47 → n=53 / FULL n=62
  → n=68.** Caveat: 4 gap giữa có F CHƯA ĐO ở CẢ HAI ĐẦU — lớp bằng
  chứng mới, yếu hơn mọi gap khoảng trước (xem §2.5 — ghi rõ để parent
  có thể hạ cấp nếu muốn chuẩn chặt hơn; 2 gap tí hon 55 s / 226 s
  cùng cỡ với dị thường đồng hồ đã quan sát).
- **Gap #83?→#84? = 6.318 s GIỮ SPAN** (đoạn B mù #53 vẫn mở, tối đa
  3 ẩn; dữ liệu mù #54 không chạm khoảng đó — không chứng nhận được
  đợt này, như prereg đã dự báo).
- **Khung chết 6 boot mới (chặt):** #84? (23:52:41Z, 23:53:17Z]
  (36 s); #85? (00:12:49Z, 00:12:55Z] (6 s); #86? (00:13:12Z,
  00:13:50Z] (38 s); #87? (00:17:35Z, 00:17:36Z] (1 s); #88?
  (01:28:02Z, 01:31:18Z] (196 s); #89? (02:15:29Z, 02:27:27Z]
  (718 s). Khung #87? chỉ 1 s — chặt nhất từ trước tới nay.
- **Dải cơ học: #86?/#87?/#88? NGOÀI DẢI liên tiếp (sớm 812 s /
  1.935 s / 1.764 s)** — sau khi #85? đã đứt chuỗi 14 lần INSIDE
  (sớm 412 s, đợt 134). Cụm reboot nhanh 4 lần trong ~24 phút
  (#85?→#86?→#87?→#88?) là thật, quan sát live bởi T5/T4, không phải
  sai số đo. #89? và #90? TRỞ LẠI TRONG DẢI. Dải mới cho #91?
  (p10–p90 FULL68): [02:54:47Z, 04:53:38Z 18/11].
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 152 file
  *.log có mtime trong mù #54 (0 file repo-1, 152 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8, xem §2.7). Quét mở rộng: **8 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** — **~158,6h** trước probe #54. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 41: 896 dòng / 249 file** (phạm vi 3.114
  file); R7b đối chiếu 921 dòng / 266 file; copies 25 dòng / 17
  file — y hệt lần 40 về copies. Đối chiếu chéo 896+25=921=R7b,
  **chênh 0 — lần thứ bốn mươi mốt liên tiếp**. +5 dòng / +1 file so
  với lần 40, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray.
- RAM: max biết được trong mù #54 **2.350 MB** (T5 wait-replay-b85
  poll 2, 23:49:21Z, đoạn A) = **38,3% ngưỡng guard**; đoạn F:
  **0 mẫu** (không ai ghi mẫu RAM trong đoạn này). **Birefnet
  KHÔNG chạy, vẫn 0 lần chạy thành công trong gói** — 2.350 MB vẫn
  dưới guard 6 GB. MemAvailable trực tiếp lượt này: 1.324.744 kB
  lúc 02:45:04Z (đoạn G, trước probe); 2.326.744 kB lúc 02:57:18Z.
- **preview.tsx KHÔNG ĐỔI trong đợt 135:** md5 530e10a7 (fix T3,
  GIỮ theo quyết parent đợt 134 §12.3(a)), mtime 23:47:42Z 17/11;
  media.ts KHÔNG ĐỔI 2c384ed1; vite.config.ts KHÔNG ĐỔI ee80d093.
  T2 không sửa production file nào.
- **Replay boot #90? (bracket của T2, đọc 02:45Z — ĐỦ 3 chi tiết
  trong CÙNG một lần đọc, bài học T2-134 §4 mục 4): 1.545 dòng /
  221 installs**, gói đầu libaspell15 02:36:13Z, gói cuối
  gstreamer1.0-tools 02:37:47Z (boot +10m20s), gstreamer1.0-gl
  02:36:23Z, configure đầu 02:35:40Z — cùng hình dạng baseline
  #82?/#83?/#84?.
- **Đợt 135 lúc T2 đóng (~03:00Z 18/11):** các luồng khác đang chạy
  (round135-t1/t4/t5/t7/t9 có file mới trong đoạn G); boot hiện tại
  #90? (kiểm 02:57:37Z). Hạn cứng T10 đóng sổ: 05:00Z 18/11 (theo
  round-in-progress.md). T2 KHÔNG mở Xvfb (không cần) nên không có
  gì để kill.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 02:45:04Z | boot_id `78b55838-d09e-4cfc-b491-a15935b7a447`; `who -b` Nov 18 02:27; `uptime -s` **2026-11-18 02:27:27**; btime **1794968847 = 2026-11-18T02:27:27Z**; journal chỉ 1 boot (78b55838, first entry 02:27:38Z, last 02:44:05Z lúc kiểm tra). MemAvailable 1.324.744 kB lúc 02:45:04Z. |
| Đo F90? (HTTP Date, 3 server) | 02:45:04–02:45:07Z | example.com Date 02:45:06Z vs local_after 02:45:05Z (+1 s); google.com Date 02:45:06Z vs local_after 02:45:06Z (0 s); cloudflare.com Date 02:45:07Z vs local 02:45:06Z (+1 s) → **F90? ≈ −1 s (±~1 s)**. Đo trực tiếp đầu tiên trên boot mới. |
| Đọc dpkg.log bracket #90? | 02:45:0xZ | **1.545 dòng / 221 installs**; gói đầu libaspell15 02:36:13Z; gói cuối gstreamer1.0-tools 02:37:47Z (boot +10m20s); gstreamer1.0-gl 02:36:23Z; configure đầu 02:35:40Z; 462 dòng configure. Đủ 3 chi tiết trong CÙNG một lần đọc. |
| `bash scripts/probe-eperm-v2.sh status` | 02:45:23Z | **DEAD/STALE**, heartbeat n=53, ts 23:46:54Z, boot d2e66749, age **10.709 s** (đúng 2h58'29"); last sample probe #53; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 02:45:23Z | **probe #54, boot=78b55838, ok=2 fail=0**, exit 0; dòng `boot changed d2e66749 -> 78b55838` (uptime since 2026-11-18 02:27:27) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | ~02:45:23Z | **ALIVE**, age 0 s, n=54, exit 0 |
| Xác minh boot lại (sau probe) | 02:45:42Z | Cùng boot 78b55838, `uptime -s` 02:27:27Z, btime 1794968847. MemAvailable 1.176.348 kB. |
| Xác minh boot lần 3 (lúc đóng) | 02:57:37Z | Cùng boot 78b55838 — **KHÔNG reboot giữa phiên T2**. MemAvailable 2.326.744 kB. |

Kiểm lại từ đĩa: log probe v2 **154 dòng** — 151 sau T2-134 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #53 +
dòng `boot changed` + dòng probe #54). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #53 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=54, ts 2026-11-18T02:45:23Z, boot
78b55838-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #90?: 8 session T2 trong vùng G (xem §2.3)
+ 48 mốc merged gộp trong vùng G (mốc đầu 02:35:37Z —
system_prompt.md của parent; mốc cuối 02:45:18Z — headroom-open.txt
+ ram-open.txt của T5 đợt 135) + 3 exec-log nhắc 78b55838. **Số thứ tự TẠM THỜI**
(như #69/#70/#71/#72/#73/#74/#75/#76/#77/#78?/#79?/#80?/#81?/#82?/
#83?/#84?/#85?/#86?/#87?/#88?/#89?; T6-135 sẽ chốt chuỗi tương đối,
số tuyệt đối vẫn tạm).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #54 (23:46:54Z 17/11 → 02:45:23Z 18/11, 2h58'29" = 10.709 s)

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #54: `uptime -s` = **2026-11-18 02:27:27Z**,
  boot_id `78b55838-d09e-4cfc-b491-a15935b7a447` — khác boot của
  probe #53 (d2e66749).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (02:45:04Z): chỉ **1 boot**
  (78b55838, first entry 02:27:38Z, last 02:44:05Z). Journal/wtmp
  của các boot trước đã mất theo reboot #90? — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #90? — bracket ghi trong lượt, ĐỦ 3 chi tiết
  trong CÙNG một lần đọc (bài học T2-134 §4 mục 4).** Lúc 02:45Z
  file có **1.545 dòng, 221 dòng "status installed"** — khớp hình
  dạng #82?/#83?/#84?; gói đầu libaspell15 02:36:13Z; gói cuối
  gstreamer1.0-tools 02:37:47Z (boot +10m20s); gstreamer1.0-gl
  02:36:23Z; configure đầu 02:35:40Z; 462 dòng configure.
  **Hồ sơ đầy đủ thuộc về T5-135 (chủ quản postboot)** — T5 xác
  nhận chính thức cho boot #90?; bracket #90? của T2 chỉ là xác
  nhận hình dạng.
- **dpkg.log của các boot #85?–#89? đã MẤT** (file lúc T2 kiểm chỉ
  còn bracket #90?): /var/log reset mỗi boot. Bản ghi T5-134
  (replay #85?–#88? + repair #85?/#88?) là bằng chứng duy nhất còn
  lại cho các bracket đó — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123).

**KHÔNG có reboot giữa phiên T2 lượt này:** boot 78b55838 xác minh
lúc 02:45:04Z (mở lượt), 02:45:42Z (sau probe #54) và 02:57:37Z
(lúc đóng) — cùng boot_id + btime 02:27:27Z. (Tiền lệ: T2-134 gặp
reboot giữa phiên; lượt này không gặp.)

### 2.2 Reboot đã chốt trong mù — #85? + #86? + #87? + #88? + #89? + #90? (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 85? | **23:53:17Z** (chính xác từng giây) | d2e66749 → 81335571 | Chốt từ đợt 134 (T2-134 §1): `uptime -s` + btime 1794959597 + `who -b` 23:53 + journal 1 boot. **Số thứ tự TẠM THỜI.** |
| 86? | **00:12:55Z** (chính xác từng giây) | 81335571 → 52ca5d6d | Chốt từ đợt 134 (T5-134: đọc boot_id + btime lúc 00:13:44Z; LIMITS gộp 134 §10.2). **Số thứ tự TẠM THỜI.** |
| 87? | **00:13:50Z** (chính xác từng giây) | 52ca5d6d → 1d2e984d | Chốt từ đợt 134 (T5-134 t5-boot3-state.md). **Số thứ tự TẠM THỜI.** |
| 88? | **00:17:36Z** (chính xác từng giây) | 1d2e984d → cc1f9de0 | Chốt từ đợt 134 (T5-134/T4-134: btime + poller #4). **Số thứ tự TẠM THỜI.** |
| 89? | **01:31:18Z** (chính xác từng giây) | cc1f9de0 → 8ae55060 | Chốt từ đợt 134 (T8-134/T10-134: btime + who -b + journal). Lưu ý dị thường đồng hồ: log cũ cuối 01:31:40Z SAU btime mới 01:31:18Z (xem dưới). **Số thứ tự TẠM THỜI.** |
| 90? | **02:27:27Z** (chính xác từng giây) | 8ae55060 → 78b55838 | Chốt từ lượt này: `uptime -s` đọc tươi (02:45:04Z + kiểm lại 02:45:42Z + 02:57:37Z) + btime 1794968847 + `who -b` 02:27 + boot_id 78b55838 + journal first entry 02:27:38Z + probe #54 02:45:23Z boot 78b55838 ok=2 fail=0 + 8 session trong vùng G. **Số thứ tự TẠM THỜI.** |

**Clock:** F90? ≈ **−1 s (±~1 s)** — đo chặt lượt này:
`date -u` trước mỗi lần fetch, rồi HTTP `Date` cả 3 server đều
khớp **0 tới +1 s** (example.com +1 s, google.com 0 s,
cloudflare.com +1 s — server hơn local 0–1 s cả ba). **F90? là
lần đo trực tiếp đầu tiên trên boot #90?** — không dùng cận hai
lần đo. F84? ≈ −1 s (±~1 s, đã kiểm đợt 134). **F85?/F86?/F87?/
F88?/F89? CHƯA TỪNG đo trực tiếp** — không có phiên T2 nào trên
các boot đó trước khi chúng chết (T5/T4/T8 có phiên trên các boot
đó nhưng không đo F). Hai đầu chuỗi (F84?, F90?) đều ≈ −1 s —
đồng hồ local ổn định ở mức chậm ~1 s ở cả hai đầu; xem §2.5 về
cách caveat này được xử lý (lập luận "kẹp hai đầu" + cận session
chặt).

**CẬN NHẢY CLOCK TẠI CÁC REBOOT (0 nhân chứng nhảy ở cả 6):**
- **0 nhân chứng nhảy tại #85?/#86?/#87?/#88?/#89?/#90?:**
  **0 session** sinh trước btime có mtime sau btime (quét 243
  exec-log).
- Cận session (quan sát cuối trước btime → btime): |X85?| < 114 s
  (session muộn nhất 23:51:23Z); **|X86?| < 6 s** (session
  00:12:49Z — chặt nhất trong các cận session từng đo);
  |X87?| < 61 s (cùng session 00:12:49Z); |X88?| < 28 s
  (session 00:17:08Z); |X89?| < 208 s (session 01:27:50Z);
  |X90?| < 1.881 s (session 01:56:06Z — LỎNG, máy yên sau
  01:56Z; F90? đo trực tiếp (±~1 s) là bằng chứng chính).
- Session sớm nhất sau mỗi btime: #85? 23:55:32Z; #86? 00:15:58Z;
  #87? 00:15:58Z (cùng session — sinh sau cả hai btime vì hai
  reboot cách nhau 55 s); #88? 00:19:53Z; #89? 01:37:56Z;
  #90? 02:36:32Z (phiên main agent 4fe65f92, spawn lượt cron
  đợt 135).
- **Dị thường đồng hồ tại ranh giới (đã ghi đợt 134, tái diễn
  trong dữ liệu đợt này):** file `wait-t4-t5.log.part3-dead-
  reboot3` có mtime 00:17:44Z — **+8 s SAU btime #88?**
  00:17:36Z; file `ram-134t8.log` mtime 01:31:21Z — **+3 s SAU
  btime #89?** 01:31:18Z. Cả hai đều là hoạt động trên boot mới
  ngay sau btime (hoặc đồng hồ boot cũ chạy nhanh vài giây —
  cùng lớp với heartbeat 23:53:50Z vs btime 23:53:17Z và log cũ
  01:31:40Z vs btime 01:31:18Z đã ghi đợt 134). Ghi rõ, không
  giấu: các mốc +s này KHÔNG đổi verdict nào (đoạn D và E đều
  đóng với lỗ lớn nhất 107 s / 341 s, không phụ thuộc lệch vài
  giây) — xem §2.4 phát hiện 2. Ngược lại, **không có file lệch
  ranh giới kiểu mù #50 ở #85?/#86?/#87?/#90?** (0 file trong
  (btime +0 s, +10 s] và 0 file trong [btime −10 s, btime] ở
  #85?/#87?/#90?; #86? có 1 file ở −6 s — xem §2.4).

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #84?→#85? = **1.579 s (26'19")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [1.569 s, 1.589 s]** (mới, xem §2.5).
- Gap #85?→#86? = **1.178 s (19'38")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [1.168 s, 1.188 s]** (mới, xem §2.5).
- Gap #86?→#87? = **55 s (0'55")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [45 s, 65 s]** (mới, xem §2.5 — gap tí hon, caveat riêng).
- Gap #87?→#88? = **226 s (3'46")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [216 s, 236 s]** (mới, xem §2.5 — gap tí hon, caveat riêng).
- Gap #88?→#89? = **4.422 s (1h13'42")** — **CHỨNG NHẬN DẠNG
  KHOẢNG [4.412 s, 4.432 s]** (mới, xem §2.5).
- Gap #89?→#90? = **3.369 s (56'09")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [3.359 s, 3.379 s]** (mới, xem §2.5).
- Gap #83?→#84? = **6.318 s (1h45'18")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #53 mở, tối đa 3 ẩn; KHÔNG kiểm lại đợt này).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #86? từ #85? dự kiến [00:26:27Z, 02:20:16Z 18/11] (p10–p90
  FULL62: p10 1.991 s, p90 8.819 s; cộng từ btime #85?
  23:53:17Z); thực tế **#86? 00:12:55Z NẰM NGOÀI dải — sớm hơn
  cận dưới 812 s** (prereg ghi 813 s — lệch 1 s do p10 float
  bị cắt khi đổi sang datetime, cùng mẫu T2-133 §4 mục 1 /
  T2-134 §2.2; xem F-135-T2-1 — không đổi verdict).
  #87? từ #86? dự kiến [00:46:05Z, 02:39:54Z]; thực tế
  00:13:50Z — **NGOÀI dải, sớm 1.935 s** (prereg 1.936 s, lệch
  1 s cùng nguyên nhân). #88? từ #87? dự kiến [00:47:00Z,
  02:40:49Z]; thực tế 00:17:36Z — **NGOÀI dải, sớm 1.764 s**
  (prereg 1.765 s, lệch 1 s cùng nguyên nhân). #89? từ #88?
  dự kiến [00:50:46Z, 02:44:35Z]; thực tế 01:31:18Z — **TRONG
  dải**. #90? từ #89? dự kiến [02:04:28Z, 03:58:17Z]; thực tế
  02:27:27Z — **TRONG dải**. (#85? từ #84? đã biết đợt 134:
  NGOÀI dải, sớm 412 s.)
- **Chuỗi INSIDE đứt ở #85?, rồi 3 lần NGOÀI liên tiếp (#86?/
  #87?/#88?) rồi TRỞ LẠI TRONG (#89?/#90?).** Cụm reboot nhanh
  4 lần trong ~24 phút là thật (T5 đọc boot #86? còn sống
  00:13:44Z; T4 waiter3/poller#3 khung (00:12:49Z, 00:15:37Z]
  kẹp chuyển #86?→#87?; replay #87? chạy mạnh dpkg 729 dòng
  lúc chết) — không phải sai số đo.

**Khung chết các boot mới (từ merged — xem §2.4):**
- **Khung chết #84?: (23:52:41Z, 23:53:17Z] (36 s)** — mốc
  muộn nhất trên đĩa trước btime #85? là 23:52:41Z (xem
  blind54-merged.log); T2-134 đã xác minh boot #84? lần cuối
  23:47:11Z, sau đó các luồng đợt 134 (T3/T4/T5) còn hoạt động
  tới 23:52:41Z. Tuổi thọ boot #84? theo khung này:
  25'43"–26'19".
- **Khung chết #85?: (00:12:49Z, 00:12:55Z] (6 s)** — mốc
  muộn nhất là session exec-log proc_c37a07a734a8.log 00:12:49Z
  (cũng là mốc merged cuối đoạn B). Tuổi thọ #85?:
  19'32"–19'38".
- **Khung chết #86?: (00:13:12Z, 00:13:50Z] (38 s)** — mốc
  muộn nhất là 3 file T5 (t5-postboot-b86-poll14.log,
  t5-wait-replay-b86.log + .nohup.log) 00:13:12Z — poll 14 của
  watcher b86 trên boot #86?, viết 38 s trước khi boot chết.
  Tuổi thọ #86?: 17 s–55 s.
- **Khung chết #87?: (00:17:35Z, 00:17:36Z] (1 s)** — mốc muộn
  nhất là t5-boot3-state.md + postboot-check.md5.before3
  00:17:35Z. Tuổi thọ #87?: 3'45"–3'46". **Khung chặt nhất từ
  trước tới nay** (kỷ lục cũ: khung #85? 6 s lượt này; trước
  đó khung hẹp nhất là vài chục giây).
- **Khung chết #88?: (01:28:02Z, 01:31:18Z] (196 s)** — mốc
  muộn nhất 01:28:02Z (xem blind54-merged.log). Tuổi thọ #88?:
  1h10'26"–1h13'42".
- **Khung chết #89?: (02:15:29Z, 02:27:27Z] (718 s)** — mốc
  muộn nhất là LIMITS gộp 134 (02:15:29Z — parent viết quyết
  §12.3). Sau 02:15:29Z máy yên 11'58" tới reboot #90?; cron
  đợt 135 mở 02:35:51Z (đã sang boot mới). Tuổi thọ #89?:
  44'11"–56'09".
- **Khung chết #83? không đổi:** (22:16:31Z, 23:26:58Z]
  (4.227 s) — chuẩn đợt 134. Khung chết #82? bản hẹp
  (21:29:47Z, 21:41:40Z] (713 s) làm chuẩn (§12.3(c) đợt 134).

**Chuỗi gộp (định nghĩa duy nhất từ đợt 134):** reboot #84?→#85?
là **sự kiện thứ 9**; #85?→#86? thứ 10; #86?→#87? thứ 11;
#87?→#88? thứ 12; #88?→#89? thứ 13; #89?→#90? thứ 14 (sau khi
đợt 134 đóng). Các đợt 129–134 đều có ≥1 reboot (6 đợt liên
tiếp); đợt 135 đã có 1 reboot sau khi đợt 134 đóng (sự kiện
thứ 14) — và 5 reboot nữa nằm trong mù #54. **Số thứ tự TẠM
THỜI** (như #69–#90?; chuỗi tương đối do T6-135 chốt, số tuyệt
đối vẫn tạm; giá trị gap không phụ thuộc số thứ tự).

### 2.3 Hoạt động trong khoảng mù — ĐÓNG HOÀN TOÀN, 7/7 đoạn (merged 4 phạm vi)

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **15 file** +
hidden_files **415 file**; **430 file, 418 mốc float phân biệt /
288 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3/T2-130 §2.3/T2-131 §2.3/T2-132 §2.3/T2-133 §2.3/
T2-134 §2.3 — "mốc" là mtime float phân biệt, không phải giây tròn).
Ngoài hai cây: **103 file** (agents — exec-log/tool-output chiếm đa
số + system/memory/proactivity/feed + repo-1-push/paths-loop; chi
tiết xem blind54-outside.txt); **/tmp: 0 file** trong mù #54 (xem
blind54-tmp.txt — tmpfs bị xóa bởi reboot #90?; xem caveat §2.4).
Gộp cả 4 phạm vi: **350 mốc giây phân biệt**. Chia mù làm bảy
đoạn bởi 6 reboot:

- **Đoạn A: 23:46:54Z → 23:53:17Z (6'23" = 383 s, boot #84?
  d2e66749) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **61 mốc** (hai cây), lỗ lớn nhất hai cây **36 s**
    (23:52:41Z → 23:53:17Z — chính là đuôi A); lỗ lớn thứ hai
    chỉ 34 s. Mốc đầu 23:46:54Z (head 0 s — chính probe #53);
    mốc cuối hai cây **23:52:41Z** (đuôi hai cây **36 s** <
    sàn 1.147 s). **6 session** chạm đoạn A.
  - **Merged 4 phạm vi: 46 mốc, lỗ lớn nhất 36 s** (cùng đuôi
    23:52:41Z → 23:53:17Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc cuối gộp **23:52:41Z** (đuôi gộp **36 s** < sàn); mốc
    đầu gộp 23:47:01Z (head 7 s).
  - Đoạn A ngắn hơn sàn (383 s < 1.147 s) nên lỗ lớn nhất
    không thể vượt sàn theo cấu tạo — nhưng merged vẫn kiểm
    chứng trực tiếp (36 s), không chỉ suy luận từ độ dài.
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn.**
- **Đoạn B: 23:53:17Z → 00:12:55Z (19'38" = 1.178 s, boot #85?
  81335571) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **69 mốc** (hai cây), lỗ lớn nhất hai cây **82 s**
    (23:53:53Z → 23:55:14Z); lỗ lớn thứ hai chỉ 61 s. Mốc đầu
    23:53:40Z (head 23 s — T5 watcher b86 spawn sau reboot);
    mốc cuối hai cây **00:12:11Z** (đuôi hai cây **44 s** <
    sàn). **11 session** chạm đoạn B (kể cả B-tail).
  - **Merged 4 phạm vi: 62 mốc, lỗ lớn nhất 81 s** (cùng lỗ
    23:53:53Z → 23:55:14Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 23:53:40Z (head 23 s), mốc cuối gộp 00:12:49Z
    (đuôi 6 s — session exec-log proc_c37a07a734a8.log).
  - 0 session bắc qua cắt B-hi (23:53:48Z); 11 session chạm
    B-tail (23:53:48Z, 00:12:55Z] — hoạt động dày tới sát btime
    #86? (T5 repair --repair 00:06:20Z bị reboot giết giữa
    apt-get update; watcher b86 poll tới 00:13:11Z).
  - **Kết luận đoạn B: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất gộp
    81 s < sàn; prereg ghi "chưa rõ" — nay quyết được).
- **Đoạn C: 00:12:55Z → 00:13:50Z (0'55" = 55 s, boot #86?
  52ca5d6d) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **2 mốc** (hai cây, cùng giây 00:13:12Z), lỗ lớn nhất hai
    cây **38 s** (00:13:12Z → 00:13:50Z — chính là đuôi C);
    lỗ lớn thứ hai 17 s (head). Mốc đầu = mốc cuối hai cây
    **00:13:12Z**. **0 session** chạm đoạn C (boot sống <1 phút,
    không kịp spawn session mới — nhưng T5 watcher b86 poll 14
    viết log lúc 00:13:12Z, 38 s trước khi boot chết).
  - **Merged 4 phạm vi: 1 mốc, lỗ lớn nhất 38 s**, floor=0 →
    **ĐÓNG, tối đa 0 ẩn**. Mốc duy nhất gộp 00:13:12Z là 3 file
    T5 (t5-postboot-b86-poll14.log, t5-wait-replay-b86.log +
    .nohup.log).
  - Đoạn C ngắn hơn sàn rất nhiều (55 s < 1.147 s) — lỗ lớn
    nhất không thể vượt sàn theo cấu tạo; merged kiểm chứng
    trực tiếp (38 s).
  - **Kết luận đoạn C: ĐÓNG — tối đa 0 ẩn.**
- **Đoạn D: 00:13:50Z → 00:17:36Z (3'46" = 226 s, boot #87?
  1d2e984d) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **3 mốc** (hai cây), lỗ lớn nhất hai cây **118 s**
    (00:15:37Z → 00:17:35Z); lỗ lớn thứ hai 107 s (head).
    Mốc đầu 00:15:37Z (head 107 s — T4 poller #3 mở 00:15:37Z
    trên boot này); mốc cuối hai cây **00:17:35Z** (đuôi hai
    cây **1 s** < sàn). **3 session** chạm đoạn D.
  - **Merged 4 phạm vi: 6 mốc, lỗ lớn nhất 107 s** (head
    00:13:50Z → 00:15:37Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 00:15:37Z (head 107 s), mốc cuối gộp 00:17:35Z
    (đuôi 1 s — t5-boot3-state.md + postboot-check.md5.before3).
  - **Kết luận đoạn D: ĐÓNG — tối đa 0 ẩn.**
- **Đoạn E: 00:17:36Z → 01:31:18Z (1h13'42" = 4.422 s, boot #88?
  cc1f9de0) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **108 mốc** (hai cây), lỗ lớn nhất hai cây **420 s**
    (01:21:02Z → 01:28:02Z); lỗ lớn thứ hai chỉ 231 s. Mốc đầu
    00:17:44Z (head 8 s); mốc cuối hai cây **01:28:02Z** (đuôi
    hai cây **196 s** < sàn). **23 session** chạm đoạn E.
  - **Merged 4 phạm vi: 120 mốc, lỗ lớn nhất 341 s**
    (01:21:02Z → 01:26:43Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 00:17:44Z (head 8 s), mốc cuối gộp 01:28:02Z
    (đuôi 196 s).
  - Cửa sổ sàn [E-lo=00:36:43Z, E-hi=01:12:11Z] có mốc dày đặc
    ở cả 4 phạm vi (T5 watcher b87 poll tới 01:13:56Z, T8
    84l10 chạy 01:15:24–01:16:31Z, T4 poller). 4 session bắc
    qua cắt E-lo, 2 session bắc qua cắt E-hi; 5 session chạm
    E-tail (01:12:11Z, 01:31:18Z].
  - **Kết luận đoạn E: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất gộp
    341 s < sàn; prereg ghi "chưa rõ" — nay quyết được).
- **Đoạn F: 01:31:18Z → 02:27:27Z (56'09" = 3.369 s, boot #89?
  8ae55060) — ĐÓNG (merged 4 phạm vi; hai cây riêng cho cùng kết
  quả):**
  - **114 mốc** (hai cây), lỗ lớn nhất hai cây **717 s**
    (02:15:29Z → 02:27:27Z — chính là đuôi F); lỗ lớn thứ hai
    629 s (02:05:00Z → 02:15:29Z). Mốc đầu 01:31:21Z (head 3 s
    — ram-134t8.log của T8); mốc cuối hai cây **02:15:29Z**
    (đuôi hai cây **717 s** < sàn). **4 session** chạm đoạn F.
  - **Merged 4 phạm vi: 66 mốc, lỗ lớn nhất 718 s** (cùng đuôi
    02:15:29Z → 02:27:27Z), floor=0 → **ĐÓNG, tối đa 0 ẩn**.
    Mốc đầu gộp 01:31:21Z (head 3 s), mốc cuối gộp 02:15:29Z
    (đuôi 718 s — LIMITS gộp 134, parent viết quyết §12.3).
    (717 s hai cây vs 718 s merged: mốc cuối là float
    1794968129.90Z — lỗ float 717,10 s, làm tròn giây cho
    718 s; xem §2.4 ghi chú 1 s.)
  - Cửa sổ sàn [F-lo=01:50:25Z, F-hi=02:08:20Z] có mốc ở cả 4
    phạm vi (T8 retry 86n2 chạy tới 01:50:58Z, T10 suite
    01:44–01:48Z, O8 01:57–01:59Z, round134-t10.done 02:05:00Z).
    1 session bắc qua cắt F-lo, **0 session bắc qua cắt F-hi
    và 0 session chạm F-tail** — nhưng đuôi F vẫn đóng vì mốc
    đĩa (LIMITS gộp 134 02:15:29Z + 1 file repo-1 trong đuôi)
    giữ đuôi ở 718 s < sàn; prereg lo "đuôi F có thể > sàn" —
    thực tế đuôi 718 s, KHÔNG vượt sàn.
  - **Kết luận đoạn F: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất gộp
    718 s < sàn).
- **Đoạn G: 02:27:27Z → 02:45:23Z (17'56" = 1.076 s, boot #90?
  78b55838) — ĐÓNG bằng đo uptime trực tiếp + luật lỗ:**
  - **`uptime -s` lúc 02:45:04Z = 02:27:27Z** chứng minh máy up
    liên tục từ #90? tới lúc đo; probe #54 02:45:23Z đọc boot_id
    78b55838 tươi — cùng boot_id với boot bắt đầu 02:27:27Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B, T2-130 §2.3 đoạn C, T2-131
    §2.3 đoạn C, T2-132 §2.3 đoạn C, T2-133 §2.3 đoạn B,
    T2-134 §2.3 đoạn C.)
  - **61 mốc** (hai cây), lỗ lớn nhất **591 s** (02:27:27Z →
    02:37:18Z — head, do cron đợt 135 chỉ mở 02:35:51Z);
    mốc cuối **02:45:18Z** (đuôi **5 s** < sàn). **8 session**
    chạm đoạn G (đều là phiên đợt 135 / main agent).
  - **Merged 4 phạm vi: 48 mốc, lỗ lớn nhất 490 s** (02:27:27Z →
    02:35:37Z — head), floor=0 → **ĐÓNG cả theo luật lỗ**
    (không chỉ uptime). Mốc đầu gộp 02:35:37Z (head 490 s —
    system_prompt.md của parent), mốc cuối gộp 02:45:18Z
    (đuôi 5 s).
  - Đoạn G ngắn hơn sàn (1.076 s < 1.147 s) nên lỗ lớn nhất
    không thể vượt sàn theo cấu tạo; uptime là closer, luật lỗ
    chỉ là kiểm chứng thêm.
  - **Kết luận đoạn G: ĐÓNG.**

**Kết luận trung thực: khoảng mù #54 ĐÓNG HOÀN TOÀN.**
Cả 7 đoạn đều đóng (merged), tối đa 0 ẩn. 6 reboot đã chốt giờ
(#85? 23:53:17Z + #86? 00:12:55Z + #87? 00:13:50Z + #88?
00:17:36Z + #89? 01:31:18Z + #90? 02:27:27Z — chính xác từng giây
trên đĩa) + **tối đa 0 ẩn**. Chuỗi mù đóng hoàn toàn: #50 đóng,
#51 hở, #52 đóng, #53 hở, **#54 đóng**.

Ngoài hai cây: **103 file** có mtime trong mù #54 (agents —
exec-log/tool-output chiếm đa số + system/memory/proactivity/feed;
chi tiết xem blind54-outside.txt); **/tmp: 0 file** trong mù #54
(xem blind54-tmp.txt + caveat §2.4). Boot_id nhắc trong
exec-log sinh/viết trong mù: d2e66749 20 file, 81335571 4 file,
52ca5d6d 1 file, 1d2e984d 3 file, cc1f9de0 12 file, 8ae55060 2 file,
78b55838 3 file (phiên T2 này nằm trong số đó).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp nối tiếp T2-134 §2.4)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind54-merged.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 46 mốc, lỗ lớn nhất **36 s** (23:52:41Z →
  23:53:17Z), floor=0 → **ĐÓNG**.
- Đoạn B gộp: 62 mốc, lỗ lớn nhất **81 s** (23:53:53Z →
  23:55:14Z), floor=0 → **ĐÓNG**.
- Đoạn C gộp: 1 mốc, lỗ lớn nhất **38 s** (00:13:12Z →
  00:13:50Z), floor=0 → **ĐÓNG**.
- Đoạn D gộp: 6 mốc, lỗ lớn nhất **107 s** (00:13:50Z →
  00:15:37Z), floor=0 → **ĐÓNG**.
- Đoạn E gộp: 120 mốc, lỗ lớn nhất **341 s** (01:21:02Z →
  01:26:43Z), floor=0 → **ĐÓNG**.
- Đoạn F gộp: 66 mốc, lỗ lớn nhất **718 s** (02:15:29Z →
  02:27:27Z), floor=0 → **ĐÓNG**.
- Đoạn G gộp: 48 mốc, lỗ lớn nhất **490 s** (02:27:27Z →
  02:35:37Z), floor=0 → **ĐÓNG**.
- Tổng gộp 350 mốc giây. Không có file nào trong
  `~/workspace/goals` ngoài hidden_files có mtime trong mù (kiểm
  bằng find riêng — vùng duy nhất hai lần quét chính không phủ,
  đã kiểm bổ sung, 0 file).

**Ghi chú 1 s (mới):** đuôi F hai cây 717 s vs merged 718 s —
cùng một mốc cuối (LIMITS gộp 134, mtime float 1794968129.90Z):
lỗ float = 717,10 s (investigate in "717s"), lỗ giây-tròn =
718 s (merged). Cả hai đúng trong 1 s; số quyết định là merged
718 s (bảo thủ hơn — lớn hơn). Không đổi verdict nào (cả hai
đều < sàn 1.147 s).

**Phát hiện 1 — /tmp 0 file trong toàn bộ mù #54: tmpfs bị xóa
bởi reboot, không phải bằng chứng máy yên (tái diễn mù #53):**
/tmp trên VM này là tmpfs — reboot #90? (02:27:27Z) xóa mọi file
/tmp viết trước đó (và 5 reboot trước trong mù cũng vậy). Vì vậy
merged cho mọi đoạn **không có đóng góp /tmp** — khác mù #52
(669 file /tmp). **Verdict không đổi:** mọi đoạn đóng với lỗ
< sàn ngay cả khi không có /tmp; đoạn F đóng nhờ mốc đĩa
(LIMITS gộp 134 02:15:29Z), không nhờ /tmp. Ghi rõ caveat để
luồng sau khỏi hiểu "0 file /tmp" là máy chết.

**Phát hiện 2 — Ranh giới #88?/#89? có file +s, các ranh giới
khác sạch (mới):** file `wait-t4-t5.log.part3-dead-reboot3`
mtime 00:17:44Z (**+8 s sau btime #88?**) và file `ram-134t8.log`
mtime 01:31:21Z (**+3 s sau btime #89?**); #86? có 1 file ở
**−6 s** (exec-log proc_c37a07a734a8.log 00:12:49Z); #85?/#87?/
#90? sạch hoàn toàn (0 file trong (btime +0 s, +10 s] và 0 file
trong [btime −10 s, btime]). Khác mù #50 (4 file T4-attempt3 ở
+1 s sau btime #78?, lệch đồng hồ cũ ~1 s): lần này các file +s
là hoạt động trên boot MỚI ngay sau btime (T4 waiter / T8 RAM
log viết tiếp sau reboot — hoặc đồng hồ boot cũ chạy nhanh vài
giây, cùng lớp dị thường đã ghi đợt 134 §10.2). Không đổi
verdict nào (đoạn D đóng với lỗ 107 s, đoạn E đóng với lỗ
341 s — không phụ thuộc lệch vài giây ở ranh giới).

### 2.5 Phân phối gap — CERT n=47 → n=53 / FULL n=62 → n=68 (6 gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Sáu gap mới (xem blind54-gaps.py + blind54-gaps.txt):**
- **Gap #84?→#85? = [1.569 s, 1.589 s] (mid 1.579 s) CHỨNG NHẬN
  DẠNG KHOẢNG (mới)** — đoạn C mù #53 đóng bằng uptime (T2-134
  §2.3) + đoạn A mù #54 đóng (merged, §2.3). Biên ±10 s của T5
  dùng nguyên văn; mid không dịch chuyển (thực hành của T5).
  Caveat: **F85? CHƯA TỪNG đo trực tiếp** (F84? đã đo ≈ −1 s)
  — cùng lớp các gap khoảng trước #72→#73 / #75→#76 /
  #77→#78? / #79?→#80? / #82?→#83? (một đầu chưa đo). Cận nhảy
  clock tại #85? |X85?| < 114 s từ session (máy yên sau
  23:51:23Z — LỎNG, như |X83?| < 822 s đợt 134); F84? và F90?
  đều đo trực tiếp ≈ −1 s (xem lập luận "kẹp hai đầu" dưới).
- **Gap #85?→#86? = [1.168 s, 1.188 s] (mid 1.178 s) CHỨNG NHẬN
  DẠNG KHOẢNG (mới)** — đoạn B mù #54 đóng (merged, §2.3).
  Caveat MỚI: **F85? và F86? đều CHƯA TỪNG đo trực tiếp** —
  lớp bằng chứng mới, yếu hơn mọi gap khoảng trước (các gap
  trước luôn có ít nhất một đầu F đo trực tiếp). Bù lại: cận
  session **|X86?| < 6 s** (chặt nhất từng đo — session viết
  00:12:49Z, 6 s trước btime) và T5 đọc boot #86? còn sống
  00:13:44Z. Ghi rõ để parent có thể hạ cấp nếu muốn chuẩn
  chặt hơn — các gap khác không bị ảnh hưởng.
- **Gap #86?→#87? = [45 s, 65 s] (mid 55 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn C mù #54 đóng (merged, §2.3).
  Caveat MỚI (như trên: F86?/F87? đều chưa đo) + **caveat gap
  tí hon:** 55 s cùng cỡ với dị thường đồng hồ đã quan sát
  (17–33 s tại ranh giới reboot, đợt 134) và lệch 11 s
  /proc/1-vs-btime (T8-134) nằm NGAY TRÊN biên ±10 s — khoảng
  [45 s, 65 s] đọc theo biên của T5; nếu một lần đo F tương lai
  cho thấy sai số btime >10 s ở #86?/#87?, hạ cấp gap này
  xuống SPAN TRƯỚC TIÊN. Bằng chứng độc lập: T5 đọc boot
  52ca5d6d còn sống 00:13:44Z (49 s tuổi); T4 waiter3 khung
  (00:12:49Z, 00:13:45Z] kẹp chuyển #86?→#87?; cận session
  |X86?| < 6 s, |X87?| < 61 s.
- **Gap #87?→#88? = [216 s, 236 s] (mid 226 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn D mù #54 đóng (merged, §2.3).
  Caveat MỚI (F87?/F88? đều chưa đo) + caveat gap tí hon
  (226 s so với dị thường 17–33 s; hạ cấp xuống SPAN THỨ HAI
  nếu sai số btime >10 s xuất hiện). Bằng chứng độc lập: T5
  đọc btime 1d2e984d 00:13:50Z khi boot còn sống; replay dpkg
  729 dòng đang chạy lúc chết; T4 poller #3 mở 00:15:37Z trên
  boot này; cận session |X87?| < 61 s, |X88?| < 28 s.
- **Gap #88?→#89? = [4.412 s, 4.432 s] (mid 4.422 s) CHỨNG NHẬN
  DẠNG KHOẢNG (mới)** — đoạn E mù #54 đóng (merged, §2.3).
  Caveat MỚI (F88?/F89? đều chưa đo). Cận session
  |X89?| < 208 s. Bằng chứng độc lập: hoạt động dày trên
  cc1f9de0 00:17–01:31Z (watcher b87, repair, 84l10 exit 0,
  85m4 chạy tới 01:31:40Z).
- **Gap #89?→#90? = [3.359 s, 3.379 s] (mid 3.369 s) CHỨNG NHẬN
  DẠNG KHOẢNG (mới)** — đoạn F mù #54 đóng (merged, §2.3) +
  đoạn G đóng bằng uptime. Caveat: **F89? CHƯA TỪNG đo trực
  tiếp** (F90? đã đo ≈ −1 s) — cùng lớp gap #82?→#83?. Cận
  session |X90?| < 1.881 s LỎNG (máy yên sau 01:56Z); F90?
  đo trực tiếp là bằng chứng chính. Khung chết #89?
  (02:15:29Z, 02:27:27Z] = 718 s.

**Lập luận "kẹp hai đầu" cho 4 gap giữa (ghi rõ để parent xét):**
F84? ≈ −1 s và F90? ≈ −1 s đều đo trực tiếp, kẹp toàn bộ chuỗi
6 reboot — đồng hồ ≈ −1 s ở cả hai đầu chuỗi. Một sai số >10 s
tại một reboot giữa sẽ đòi một bước nhảy ở đó VÀ một bước nhảy
ngược trước/tại #90? để quay về −1 s. Lập luận này đã dùng cho
mọi gap khoảng trước có một đầu F chưa đo; điểm mới lượt này là
4 gap giữa có F chưa đo ở CẢ HAI ĐẦU — nên parent có thể áp
chuẩn chặt hơn và hạ 4 gap giữa xuống SPAN mà không ảnh hưởng
2 gap đầu/cuối (mỗi gap có một đầu F đo trực tiếp). **T2 chứng
nhận cả 6 theo quy tắc đã áp dụng từ trước tới nay** (đoạn đóng
+ btime đọc chính xác + biên ±10 s của T5 + kẹp hai đầu), và ghi
rõ lớp bằng chứng yếu hơn để parent quyết.

**Gap #83?→#84? = 6.318 s (1h45'18") VẪN CHỈ LÀ SPAN** — đoạn B
mù #53 mở (tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem §2.6).
**CERT/FULL không tính gap này.**

**Gap #81?→#82? = [7.797 s, 7.817 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 133 (đoạn A mù #52 đóng). Không đổi lượt này.

**Gap #80?→#81? = 8.558 s (2h22'38") VẪN CHỈ LÀ SPAN** — đoạn B
mù #51 mở (tối đa 3 ẩn; KHÔNG kiểm lại đợt này — xem §2.6).
**CERT/FULL không tính gap này.**

**Gap #79?→#80? = [2.079 s, 2.099 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 132 (đoạn A mù #51 đóng). Không đổi lượt này.

**Gap #78?→#79? = [5.030 s, 5.050 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 131 (đoạn B mù #50 đóng). Không đổi lượt này.

**Gap #77→#78? = [7.560 s, 7.580 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 131 (đoạn A mù #50 đóng). Không đổi lượt này.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-131 §2.3; KHÔNG kiểm lại lượt này theo quyết parent
đợt 132 §12.3(d) — xem §2.6). **CERT/FULL không tính gap này.**

**Gap #75→#76 = [6.511 s, 6.531 s] VẪN LÀ KHOẢNG** — đã chứng
nhận đợt 130 (đoạn A mù #49 đóng). Không đổi lượt này.

**Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù
#48 mở (T2-129 §2.3). Không đưa vào FULL/CERT.

**Gap #73→#74 = 6.639 s (1h50'39") VẪN LÀ KHOẢNG [6.629 s,
6.649 s]** — đã chứng nhận đợt 128 (đoạn B mù #47 đóng). Không
đổi lượt này.

**Gap #72→#73 = 3.248 s (54'08") VẪN LÀ KHOẢNG [3.238 s,
3.258 s]** — đã chứng nhận đợt 128 (đoạn A mù #47 đóng). Không
đổi lượt này.

**Gap #71→#72 = 9.876 s (2h44'36") VẪN CHỈ LÀ SPAN** — đoạn A mù
#46 mở (T4-127 §2.3). Không đưa vào FULL/CERT.

**Gap #70→#71 = 9.082 s (2h31'22") VẪN CHỈ LÀ SPAN** — đoạn G1 mù
#45 mở (T7-126 §2.3). Không đưa vào FULL/CERT.

**Gap #68→#69 = 10.880 s (3h01'20") VẪN CHỈ LÀ SPAN** — đoạn D mù
#44 mở (T7-126 §2.4). Không đưa vào FULL/CERT.

**Cross-check tái hiện T2(134) 100%:** chạy blind53-gaps.py
verbatim cho lại đúng CERT n=47 / FULL n=62 của T2 đợt 134 (xem
blind54-gaps.txt: CERT47 mean 1h41'21" median 1h54'16" p10
0h33'36" p90 2h22'10" sd 0h42'20" min 0h19'07" max 3h14'08";
FULL62 mean 1h47'26" median 1h54'38" p10 0h33'11" p90 2h26'59"
sd 0h55'15" min 0h19'07" max 5h43'18"; in 90–150' = 34, <60' = 12,
>180' = 6, >240' = 2 — khớp T2-134 §2.5 từng số). 6 gap mới vào
nên cả CERT lẫn FULL đều +6.

- **CERT n=53 (mới):** mean 1h33'17" median 1h48'41" p10 0h26'37"
  p90 2h19'19" sd 0h46'46" min 0h00'55" max 3h14'08".
- **FULL n=68 (mới):** mean 1h40'36" median 1h49'58" p10 0h27'21"
  p90 2h26'12" sd 0h57'43" min 0h00'55" max 5h43'18"; in 90–150'
  = 34, <60' = 17, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của 6 gap mới: CERT53 mean chỉ dao động ±1 s
  (1h33'16"–1h33'18"), FULL68 mean không đổi ±1 s (1h40'35"–
  1h40'37") — biên ±10 s không làm lệch phân phối.
- **Dải chứng nhận [0h00'55", 3h14'08"] — min RỚT từ 19'07" xuống
  55 s** (gap #86?→#87? tí hon vào CERT; gap #83?→#84? 6.318 s
  vẫn nằm trong dải nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 90 / 174,15 h = **1 reboot
  mỗi 116,1 phút** (từ #1 2026-11-10T20:18:10Z tới #90?
  2026-11-18T02:27:27Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 94 / 174,15 h = **1 mỗi 111,2 phút**; +3 nữa
  (mù #53 đoạn B tối đa 3) → 97 / 174,15 h = **1 mỗi 107,7
  phút**. Chưa tính ẩn danh nghĩa tối đa của mù #35 (+24), mù
  #37 (+29), mù #38 đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn
  B (+1), mù #43 đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn
  G1 (+4), mù #46 đoạn A (+4), mù #48 đoạn A (+2), mù #49 đoạn
  B (+1), mù #51 đoạn B (+3). Mù #50: **+0** (đóng hoàn toàn).
  Mù #52: **+0** (đóng hoàn toàn). Mù #53: **+3** (đoạn B mở).
  **Mù #54: +0 (đóng hoàn toàn — mới).**
- **#89? vào dải cơ học** (p10–p90 FULL62). **#90? vào dải cơ
  học.** **#85? NGOÀI dải** (đợt 134, sớm 412 s — đứt chuỗi 14
  lần INSIDE). **#86?/#87?/#88? NGOÀI dải** (sớm 812 s / 1.935 s
  / 1.764 s — 3 lần ngoài liên tiếp, lần đầu có 3 lần ngoài dải
  liên tiếp trong chuỗi).

### 2.6 Mù #51 B + mù #49 B + mù #53 B: KHÔNG kiểm lại đợt này (ghi rõ lý do)

- **Mù #51 B: KHÔNG kiểm lại đợt này.** Đã kiểm lại 3 lần (đợt
  131, 132, 133) với cùng verdict (lỗ lớn nhất 4.393 s, tối đa
  3 ẩn); hồ sơ đã ổn định. T2 đợt này không thấy bằng chứng mới
  nào về mù #51 B (không file/session nào chạm cửa sổ #51 trong
  lúc làm việc; không chạy recheck mù #51 B). Gap #80?→#81? =
  8.558 s giữ SPAN. (Tiền lệ: không giao luồng sau kiểm lại B mù
  #51 — quyết đợt 126 §12(h) + quyết đợt 130 §12.3(e).)
- **Mù #49 B: KHÔNG kiểm lại đợt này.** Quyết parent đợt 132
  §12.3(d) đã phê duyệt bỏ mục kiểm lại thường lệ khỏi brief T2;
  chỉ kiểm lại khi có bằng chứng mới cụ thể. T2 đợt này không thấy
  bằng chứng mới nào về mù #49 B. Gap #76→#77 = 6.859 s giữ SPAN.
  Ghi rõ đã bỏ mục này theo quyết parent.
- **Mù #53 B: KHÔNG kiểm lại đợt này.** Verdict đợt 134 còn mới
  (mở, tối đa 3 ẩn, lỗ lớn nhất 4.227 s); không có bằng chứng mới
  nào về mù #53 B trong lúc làm việc. Gap #83?→#84? = 6.318 s
  giữ SPAN.

### 2.7 Quét writeFileSync lần thứ 41 — chênh 0 (lần thứ 41 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round135-t2, đã đổi OUT sang
  round135-t2) **02:56:01Z → 02:56:18Z 18/11 (17 s, có SCAN-END)**.
  **Scan chạy trên boot #90?** — kết quả vẫn hợp lệ vì scan chỉ đếm
  code hiện tại trên đĩa, không phụ thuộc boot hay giờ mù.
- NEWSTD: **896 dòng / 249 file** (phạm vi 3.114 file); R7b đối
  chiếu: **921 dòng / 266 file** (phạm vi 12.507 file); copies:
  **25 dòng / 17 file** — y hệt lần 40 về copies. Đối chiếu chéo:
  896+25=921=R7b, **chênh 0**.
- **+5 dòng / +1 file so với lần 40** (891/248 → 896/249), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + diff
  từng dòng — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | docs/PHASE9_ROUND134_T2_EPERM_LIMITS.md | +5 (0 → 5) | 00:07:43Z 18/11 | Tài liệu T2 đợt 134 (nhắc `writeFileSync` 5 lần); viết SAU scan lần 40 (23:57:01Z 17/11) nên lần này mới vào |
- Phạm vi: 3.114 = 3.102 + 12 net (**12 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 12 file mới gồm 9 LIMITS đợt 134
  + 3 LIMITS đợt 135 đã viết trước scan (T1 + T6 + T9); 0 file mất).
  Copies y hệt lần 40 (diff 0 dòng).
- **Kết luận: 41 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #54.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Lưu ý phương pháp: pattern phải là `\.writeFile\(` (có dấu chấm).
  Pattern không dấu chấm còn bắt thêm các mock `async writeFile(`
  trong file test `apps/web/scripts/test_round83_k8_eperm_retry.mjs`
  (định nghĩa fake fs, mtime 10/11, không phải đường ghi thật) —
  không tính vào 2 helper; T7-126 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #54.

## 3. RAM trong mù #54 — max 2.350 MB (38,3% guard), birefnet KHÔNG chạy

- **3 mẫu MemAvailable trực tiếp của lượt:**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 02:45:04Z | **1.324.744 kB** (1.294 MB) | Trước probe #54 (boot #90?, đoạn G) |
  | 02:45:42Z | **1.176.348 kB** (1.149 MB) | Sau probe #54 (boot #90?, đoạn G) |
  | 02:57:18Z | **2.326.744 kB** (2.272 MB) | Lúc đóng phiên T2 (boot #90?) — NGOÀI mù #54 |
- **Max RAM biết được TRONG mù #54 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 233 mẫu RAM; **max 2.350 MB**
  (T5 wait-replay-b85 poll 2, 23:49:21Z, đoạn A — đã xác minh trực
  tiếp dòng log; cùng giá trị xuất hiện 2 lần — .log + .nohup.log)
  = **38,3% ngưỡng guard** — cao hơn max 1.903 MB mù #53, thấp
  hơn max kỷ lục 4.576 MB mù #42; đoạn A max **2.350 MB**; đoạn B
  max **1.724 MB** (23:58:29Z, T4 poll #4); đoạn C max **548 MB**
  (00:13:11Z, T5 wait-replay-b86 poll 14 — đã xác minh trực tiếp
  dòng log); đoạn D max **1.876 MB** (00:15:37Z, T4 poll #1 trên
  1d2e984d); đoạn E max **1.557 MB** (00:19:28Z, T4 poll #1 trên
  cc1f9de0); đoạn F **0 mẫu** (không ai ghi mẫu RAM trong đoạn
  này — T8/T10 chạy harness/suite nhưng không ghi mẫu RAM vào
  log sibling mà ram-max quét được; mẫu trực tiếp duy nhất của T2
  trong mù là 1.324.744 kB lúc 02:45:04Z, đoạn G — xem bảng trên);
  đoạn G max **1.643 MB** (02:43:32Z, T4 đợt 135 poll #2).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2.350 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 134) + kiểm prereg

1. **Prereg KHÔNG có dự báo verdict SAI — ghi rõ (mới, §0):**
   prereg §2 dự báo A/C/D/G đóng (đúng cả 4), B/E/F "chưa rõ —
   quyết sau khi quét" (nay cả 3 đều ĐÓNG — prereg không cam kết
   sai hướng nào), gap #83?→#84? giữ SPAN (đúng), gap #84?→#85?
   chứng nhận được (đúng), gap #89?→#90? chứng nhận được (đúng),
   4 gap giữa "CHƯA QUYẾT — quyết sau khi quét" (nay cả 4 đều
   chứng nhận dạng khoảng, với caveat lớp bằng chứng mới — xem
   §2.5). Bài học đợt 134 (§4 mục 1–2: prereg dự báo mò verdict B
   và gap #83?→#84?) đã được áp dụng: prereg đợt này chỉ cam kết
   verdict sau khi đã có dữ kiện, còn lại ghi "chưa rõ/chưa quyết".
2. **Lo ngại đuôi F vượt sàn — KHÔNG xảy ra (mới, §0):** prereg
   §2 ghi "đuôi F có thể > sàn, mở tối đa 1" (dựa trên T10 đóng
   02:02Z rồi máy yên tới reboot 02:27:27Z). Thực tế: parent viết
   quyết §12.3 vào LIMITS gộp 134 lúc 02:15:29Z — mốc đĩa này giữ
   đuôi F ở 718 s < sàn 1.147 s; đoạn F ĐÓNG. Bài học: hoạt động
   của parent/main chat sau khi T10 đóng vẫn là mốc đĩa thật —
   prereg không được quên cửa sổ 02:02Z–02:27:27Z còn có parent.
3. **Prereg dự báo RAM đúng (mới, §0):** prereg §2 dự báo max
   ~1.000–2.500 MB (không dự báo hẹp). Thực tế: **2.350 MB**
   (23:49:21Z, đoạn A) — nằm trong dải dự báo. (Khác T2-134 §4
   mục 3, nơi dự báo RAM hẹp sai.)
4. **Bracket dpkg boot #90? ĐẦY ĐỦ — bài học T2-134 §4 mục 4 đã
   áp dụng (mới, §1):** lúc 02:45Z T2 ghi ĐỦ 3 chi tiết trong
   CÙNG một lần đọc (1.545 dòng / 221 installs + giờ configure
   đầu 02:35:40Z + gstreamer1.0-gl 02:36:23Z + gói cuối
   gstreamer1.0-tools 02:37:47Z). Không để lại lần sau — vì
   /var/log reset mỗi boot.
5. **F-135-T2-1 — số dải cơ học prereg lệch 1 s (mới):** prereg §1
   ghi #86? sớm 813 s / #87? sớm 1.936 s / #88? sớm 1.765 s;
   code trong blind54-gaps.py cho 812 s / 1.935 s / 1.764 s.
   Nguyên nhân: p10 float (1.991,... s) bị cắt khi đổi sang
   datetime — cùng mẫu T2-133 §4 mục 1 / T2-134 §2.2. Chỉ lệch
   1 s; không đổi verdict ngoài/trong nào (các khoảng lệch đều
   ≥ 812 s). Bài học (lặp lại): prereg ghi dải cơ học thì ghi
   kèm "±1 s do cắt float" — hoặc tính bằng code rồi mới ghi.
6. **F-135-T2-2 — blind54-merged.py lỗi IndexError lần chạy đầu
   (mới):** đoạn C chỉ có 1 mốc gộp → 2 lỗ; dòng in "3rd largest"
   truy cập gaps_sorted[2] → IndexError, script dừng giữa chừng
   (exit 1, chỉ in tới đoạn C). **KHÔNG dùng số nào từ lần chạy
   lỗi** — đã sửa bằng guard len() (in 2nd/3rd largest chỉ khi
   đủ phần tử), chạy lại sạch exit 0. Bài học: script merged các
   đợt trước luôn có ≥3 lỗ mỗi đoạn nên lỗi này chưa từng lộ —
   đoạn tí hon (55 s, 1 mốc) là trường hợp biên mới; luồng sau
   giữ guard này khi adapt script.
7. **F-135-T2-3 — nhãn "blind#53" sót trong lần chạy đầu của
   blind54-investigate.py và blind54-sessions.py (mới):** hai
   print-string còn ghi "blind#53" (sót khi adapt bằng sed) —
   hằng số cửa sổ B0/B1 đã đúng nên SỐ LIỆU không sai; đã sửa
   nhãn và chạy lại cả hai script, số liệu hai lần chạy khớp
   hoàn toàn (A 36 s, B 82/81 s, C 38 s, D 118/107 s, E 420/341 s,
   F 717/718 s, G 591/490 s hai cây/merged). Bài học: sau khi
   adapt script bằng sed, grep nhãn cũ trước khi chạy — như
   T2-133 §4 mục 5.
8. **Docstring eperm-sweep54.py / ram-max54.py ĐÃ KIỂM cửa sổ
   (mới):** eperm-sweep54.py ghi đúng cửa sổ "(23:46:54Z 17/11
   -> 02:45:23Z 18/11)"; ram-max54.py đổi regex ngày sang
   `(2026-11-1[78])` để bắt cả hai ngày (đợt trước chỉ có một
   ngày) + SEGS 7 đoạn viết mới — đã kiểm bằng grep trước khi
   chạy (bài học T2-133 §4 mục 6: kiểm SEGS sau khi adapt).
9. **preview.tsx KHÔNG ĐỔI trong đợt 135 — theo quyết parent,
   không phải sai số (mới, §0 + §3 cuối):** md5 530e10a7,
   mtime 23:47:42Z 17/11 — fix instrumentation của T3-134 theo
   quyết parent đợt 133 §12.1(a), GIỮ cho đợt 135 theo quyết
   parent đợt 134 §12.3(a) (revert sau khi có một lượt đo hợp
   lệ với logger đã nới). media.ts KHÔNG ĐỔI 2c384ed1;
   vite.config.ts KHÔNG ĐỔI ee80d093. T2 không sửa production
   file nào.
10. **R9 (a): SỐ ĐẾM VẪN LÀ 16 — KHÔNG tăng (nhắc lại, §0):**
    quyết parent đợt 134 §12.3(d) đã đính chính T5-134 viết
    "nhắc lần 17" là sai; số đếm giữ 16. File LIMITS này KHÔNG
    viết số 17 ở bất cứ đâu cho R9 (a).

## 5. Hồ sơ + stage

- **LIMITS này:** `docs/PHASE9_ROUND135_T2_EPERM_LIMITS.md`
  (oversize >37.768 B — chỉ stage paths, không push, như các
  LIMITS oversize đợt 134).
- **Thư mục làm việc:** `hidden_files/round135-t2/` — prereg-t2.md,
  boot-verify.txt, status1/once/status2 + .exit, blind54-investigate.py
  + .log, blind54-sessions.py + .log, blind54-merged.py + .log,
  blind54-gaps.py + .txt, blind54-repo-1.txt, blind54-hidden_files.txt,
  blind54-outside.txt, blind54-tmp.txt, sessions-all.txt,
  eperm-sweep54.py + eperm-sweep-run.log, ram-max54.py + ram-max.txt,
  scan-wfs.sh + scan-meta.txt + scan-wfs-run.log + files-*.bin +
  wfs-*.txt.
- **Stage (KHÔNG push):** `phase9-round135-t2-eperm.txt`
  (NUL-delimited, 1 entry: LIMITS này; verify read-back trước khi
  đóng cờ).
- **Cờ:** `hidden_files/round135-t2.done`.
- **Mù #55 MỚI MỞ** từ probe #54 (02:45:23Z 18/11) — việc của T2
  đợt 136.

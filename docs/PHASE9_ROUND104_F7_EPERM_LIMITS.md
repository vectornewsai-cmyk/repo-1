# PHASE9 ROUND104 F7 — EPERM: probe #23 + khoảng mù #22 ĐÃ ĐÓNG (nợ LIMITS gộp đợt 103 §4 mục 7)

> Luồng F7, đợt 104 vòng lặp Phase 9 VCut Studio (lượt cron 15:35 +07,
> 13/11/2026; làm việc ~08:38–08:59Z 13/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + đóng khoảng mù #22 kể từ probe #22
> (05:40:24Z 13/11) + quét writeFileSync theo chuẩn mới (đối chiếu
> snapshot E7 đợt 103) + ghi RAM hiện tại (birefnet: KHÔNG chạy — vẫn
> dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền. KHÔNG tự đóng reboot #16, mù #21, hay EPERM** — chỉ báo
> cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 08:39:00Z
  báo **DEAD/STALE** (heartbeat age 10.716 s, last #22 05:40:24Z,
  boot 9576eac3, exit 1); `once` ngay sau đó là **probe #23,
  boot 8c1c5131 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 8 s, n=23), exit 0.
- **Reboot #28: 06:56:44Z (chính xác từng giây)** — 9576eac3 →
  8c1c5131, đo trực tiếp (`uptime -s` + `boot_id`, xác nhận lại
  08:39:10Z không đổi). Khoảng cách #27 → #28 = **1h30'26"**.
  Chu kỳ nay là **29 lần / ~60h38' ≈ 2h05'/lần** (trước #28:
  27 lần / ~57h08' ≈ 2h07'). Reboot tiếp theo dự kiến **~11:02Z**
  (dải khoảng cách quan sát 1h11'36"–3h14'08" cho phép
  10:08Z–12:11Z).
- **Khoảng mù #22: 05:40:24Z → 08:39:02Z (2h58'38") — ĐÃ ĐÓNG
  HOÀN TOÀN.** Reboot trung gian trong đoạn trước #28 bị loại trừ
  bằng lập luận sàn (đoạn dài 1h16'20" < 2 × sàn 1h11'36"); đoạn
  sau #28 nằm gọn trong một boot đã xác định (loại trừ trực tiếp
  bằng uptime + hoạt động closing đợt 103 trên boot mới). Đây là
  mù đóng hoàn toàn đầu tiên kể từ mù #20 (mù #21 vẫn mở: lỗ
  17'23" — xem §5 mục 1).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "Operation not permitted" thật trong *.log có mtime trong mù
  #22; 61 dòng "sóng EPERM đã tắt" (17 file log E5) đều là
  **dương tính giả đã biết**. Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~44h28' trước probe #23. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 455 dòng / 142 file** (phạm vi
  2690 file); R7b đối chiếu 486 dòng / 160 file; copies 25 dòng /
  17 file; **chênh 0 sau khi tính race giữa lúc scan** (file F4
  hạ cánh đúng lúc scan, +6 dòng — xem §2.6) — **lần thứ mười
  liên tiếp**. +12 dòng / +4 file so với E7, giải thích đúng hết
  bằng diff. 0 file biến mất.
- **Đính chính E7 §2.6:** async `.writeFile(` trong phạm vi quét
  là **2 vị trí, không phải 0** — cả hai đều nằm trong hàm
  `writeFileEpermRetryAsync` (biến thể async của helper EPERM-retry
  đã biết từ đợt 85 M5), không phải write async stray. Chi tiết §2.7.
- RAM 5 mẫu 395 / 430 / 2100 / 1590 / 1660 MB (max ~2,05 GB = 34%
  ngưỡng guard) — birefnet KHÔNG chạy. Reboot #16 VẪN MỞ (kẹp ~4',
  chờ parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
- **Reboot #29: 08:56:39Z (8c1c5131 → cff65e89) xảy ra SAU
  checklist**, trong lúc F7 chạy find/grep chậm (kèm runtime
  restart cắt ngang một lệnh find nền) — probe #23 vẫn hợp lệ cho
  boot 8c1c5131, KHÔNG chạy lại checklist (xem §4).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 08:38:59Z | boot_id `8c1c5131-7366-4f08-8c7f-b70325c398d3`; `who -b` Nov 13 06:56; `uptime -s` **2026-11-13 06:56:44Z** (uptime ~1h42'); journal chỉ 1 boot (8c1c5131, first entry 06:56:58Z, last 08:38:43Z); `last -x reboot` 06:56 still running; wtmp bắt đầu 06:56:57Z |
| `bash scripts/probe-eperm-v2.sh status` | 08:39:00Z | **DEAD/STALE**, exit 1 — heartbeat n=22, ts 05:40:24Z, boot 9576eac3, age **10.716 s**; last sample probe #22; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 08:39:02Z | **probe #23, boot=8c1c5131, ok=2 fail=0**, exit 0; dòng `boot changed 9576eac3 -> 8c1c5131` (uptime since 2026-11-13 06:56:44) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 08:39:10Z | **ALIVE**, age 8 s, n=23, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 61 dòng, trước lượt 58 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=23, ts
08:39:02Z, pid=20531, boot 8c1c5131-7366-4f08-8c7f-b70325c398d3).

Xác nhận lại cuối checklist (08:39:10Z): boot_id vẫn 8c1c5131,
`uptime -s` vẫn 2026-11-13 06:56:44 — **không reboot nào trong lúc
F7 chạy checklist.** (Reboot #29 xảy ra sau đó, 08:56:39Z — xem §4.)

## 2. Điều tra khoảng mù kể từ probe #22

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 08:38–08:39Z)

- Boot hiện tại lúc probe: `uptime -s` = **2026-11-13 06:56:44Z**,
  boot_id `8c1c5131-7366-4f08-8c7f-b70325c398d3` — khác boot của
  probe #22 (9576eac3).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 8c1c5131,
  first entry 06:56:58Z, last 08:38:43Z lúc kiểm tra). `last -x
  reboot`: chỉ 1 dòng (06:56, still running). wtmp bắt đầu
  06:56:57Z.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu. journal/wtmp chỉ
  giữ boot hiện tại, như mọi lần trước.

### 2.2 Reboot #28 trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 28 | **06:56:44Z (chính xác từng giây)** | 9576eac3 → 8c1c5131 | `uptime -s` + `boot_id` đo trực tiếp lượt này (08:38:59Z và xác nhận lại 08:39:10Z); `journalctl --list-boots` (first entry 06:56:58Z); `last -x reboot` (06:56, still running); wtmp bắt đầu 06:56:57Z. Hoạt động closing đợt 103 tiếp tục trên boot mới từ 06:57:06Z (xem §2.3). |

Khoảng cách #27 → #28 là **1h30'26"** — trong dải quan sát, không
phá sàn (1h11'36") hay trần (3h14'08"). Chu kỳ nay là **29 lần
trong ~60h38'29"** (từ ~20:18:10Z 10/11 tới 08:56:39Z 13/11,
tính cả #29 — xem §4) — trung bình **~2h05'/lần** theo cách đếm
của W7/X7 (tổng thời gian / số reboot). Reboot tiếp theo dự kiến
**~11:02Z** (08:56:39Z + ~2h05') — dải khoảng cách quan sát
(1h11'36"–3h14'08") cho phép lệch tới ~10:08Z–12:11Z. Mọi probe nền
đều chết theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt
sau hồi phục bằng 1 mẫu mới.

Khoảng mù #22 là **khoảng mù thứ 15 liên tiếp (#8–#22) chứa
reboot** — và là mù đầu tiên kể từ #20 đóng được hoàn toàn.

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG ĐƯỢC hoàn toàn

Hoạt động ghi đĩa liên tục 05:40:24Z → 06:56:06Z, rồi tiếp tục
trên boot mới từ 06:57:06Z:

- **05:40–06:56Z (boot 9576eac3):** E1–E9 đợt 103 làm việc suốt
  (LIMITS E1 06:22:01Z, E6 06:26:35Z, E4 06:41:22Z, E3 06:42:41Z;
  code E4 `driftConfirmSkip103E4.ts` 06:28:14Z, `preview.tsx`
  06:38:03Z); E5 chạy probe WebKit tới sát giờ reboot
  (confirm-s1.log 06:53:17Z, confirm-s2.log 06:53:25Z,
  probe-error.txt 06:56:06Z). Find toàn cửa sổ trước #28:
  repo-1 **25 file**, hidden_files **6033 file**, /tmp **0 file**.
- **Bản ghi cuối cùng trước #28 trên cả hai cây: 06:56:06Z**
  (`hidden_files/round103-e5/probe-webkit-load0-gop250-s2/probe-error.txt`,
  output probe WebKit của E5; repo-1 muộn nhất 06:43:18Z, thư mục
  `apps/web`). Kẹp bằng cả hai cây theo A8 §4 mục 10 — lấy mốc
  muộn nhất. Khoảng trống không-bản-ghi trước #28 chỉ còn
  **38 giây** (06:56:06Z → 06:56:44Z).
- **Sau #28 thì hoạt động tiếp tục ngay:** E5 probe-log.txt
  06:57:06Z (22 giây sau reboot), rồi closing đợt 103:
  E5_REARM_LIMITS.md 07:02:44Z, E9_VERIFY_LIMITS.md 07:27:17Z,
  ROUND103_LIMITS.md 07:29:40Z, GAP_ANALYSIS.md 07:30:17Z. Đếm
  cửa sổ sau #28 tới spawn đợt 104 (06:56:44Z–08:35:51Z, đo
  ~08:47–08:52Z): repo-1 **265 file**, hidden_files **368 file**,
  /tmp **764 file**.

Đuôi mù chia làm hai đoạn bởi #28:

- Đoạn TRƯỚC #28: 05:40:24Z → 06:56:44Z (**1h16'20" = 4580 s**).
- Đoạn SAU #28: 06:56:44Z → 08:39:02Z (**1h42'18"**).

**Đoạn trước #28 — LOẠI TRỪ BẰNG SÀN (chắc chắn, không cần dữ
kiện hoạt động):** mọi reboot trung gian tại thời điểm T trong
đoạn này đều đòi cả hai khoảng cách #27 → T và T → #28 đều ≥ sàn
chính xác 1h11'36" (4296 s), tức T ∈ [#27 + sàn, #28 − sàn] =
[06:37:54Z, 05:45:08Z] — **tập rỗng**. Đoạn dài 4580 s < 2 × sàn
(8592 s) nên không tồn tại T nào thỏa cả hai phía. Đây là điểm
khác mù #21: đoạn trước #27 của mù #21 dài 1h28'59" (5339 s) —
vẫn < 2 × sàn — nhưng lỗ của nó nằm ở chỗ bản-ghi-cuối cách #27
tới 1h28'59" mà không có mốc hoạt động nào kẹp giữa; ở mù #22,
bản-ghi-cuối 06:56:06Z chỉ cách #28 có 38 giây, và toàn bộ đoạn
đã bị sàn khóa hai đầu. Nói cách khác: với đoạn 1h16'20", bất kỳ
reboot trung gian nào cũng phá vỡ sàn ở một trong hai phía
(T < 06:37:54Z thì #27 → T < sàn; T > 05:45:08Z thì T → #28 <
sàn; hai miền này phủ toàn bộ đoạn).

**Đoạn sau #28 — LOẠI TRỪ TRỰC TIẾP (chắc chắn):** nằm gọn trong
một boot đã xác định — `uptime -s` vẫn 06:56:44Z + boot_id không
đổi lúc probe #23 (08:38:59Z) và xác nhận lại cuối checklist
(08:39:10Z); cộng thêm hoạt động closing đợt 103 trên boot mới từ
06:57:06Z (E5 probe-log) tới 07:30:17Z (GAP_ANALYSIS) và spawn
đợt 104 từ 08:35:51Z. Không có reboot nào trong đoạn này (phương
pháp C6 §4 mục 2).

**Ghi chú về số đếm 265 file repo-1 trong cửa sổ sau #28:** kiểm
lại ~08:55Z chỉ còn 4 file nguồn trong cửa sổ (3 docs LIMITS +
GAP_ANALYSIS, liệt kê trên) — 261 file còn lại là output
`apps/web/dist` đã bị vite build của đợt 104 ghi đè sau spawn
(xác nhận trực tiếp: **261 file dist có mtime sau 08:35:51Z**;
261 + 4 = 265 khớp đúng). Số đếm này là ảnh chụp tại thời điểm đo,
không phải con số bền — nhưng 4 file nguồn bền đã đủ làm mốc
hoạt động, và việc loại trừ reboot ở đoạn sau #28 dựa vào uptime
chứ không dựa vào số đếm này.

**Kết luận trung thực: khoảng mù #22 ĐÃ ĐÓNG HOÀN TOÀN.** Reboot
duy nhất trong mù là #28. Không còn lỗ nào chưa loại trừ được.

### 2.4 Bảng khoảng cách liên tiếp đã xác nhận (cập nhật từ E7 §2.4)

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
| #27 05:26:18Z → #28 06:56:44Z | 1h30'26" |
| #28 06:56:44Z → #29 08:56:39Z | 1h59'55" |

Sàn khoảng cách chính xác vẫn là 1h11'36" (không đổi); trần vẫn
3h14'08" (không đổi). Hệ quả cho §2.3: đoạn trước #28 dài
1h16'20" < 2 × sàn nên sàn khóa được cả hai đầu — công thức tổng
quát: mù đóng được bằng sàn khi (giờ-reboot − giờ-bắt-đầu-mù) <
2 × sàn, tức khi mù bắt đầu chưa đầy 2h23'12" trước reboot; mù
#22 bắt đầu 1h16'20" trước #28 nên đóng được, mù #21 bắt đầu
3h00'52" trước #27 nên để lại lỗ.

### 2.5 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 103 + đợt 104 tới lúc này

Khoảng mù 05:40:24Z → 08:39:02Z (2h58'38") được phủ bởi các luồng
sibling đợt 103 (E1–E9, làm việc tới ~07:30Z) + closing đợt 103
(tới 07:30:17Z) + spawn đợt 104 (~08:35:51Z, F1/F4/F7/F8/F9 đã có
file trước probe #23 — nhưng file của họ đều sau 08:35:51Z, chỉ
phủ 3 phút cuối mù). Đã đọc lại log thật (grep `sóng EPERM vẫn
bật` / `CẢNH BÁO: chờ sóng` / `Operation not permitted` / `sóng
EPERM đã tắt` trên các file *.log có mtime trong mù #22 + toàn bộ
cây `hidden_files/round103-*` + `round104-*` + `build-loop-log.md`
+ `docs/PHASE9_ROUND103_*.md`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| E5 đợt 103 (probe WebKit, nhiều lượt chạy) | 05:4x–06:56Z | 61 dòng "sóng EPERM đã tắt" / 17 file *.log có mtime trong mù — **dương tính giả đã biết** |
| E1–E4, E6–E9 (`docs/PHASE9_ROUND103_*.md` + log) | 05:40–~07:30Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật |
| E8/E9 O8 (Chromium + WebKit) | ~06:xx–07:xxZ | 0 dòng "vẫn bật"; 2 file o8-clicktest-report.json chứa chuỗi "đã tắt" — **dương tính giả đã biết**, ngoài phạm vi *.log |
| Grep rộng round103-* + round104-* (mọi file) | toàn đợt | "vẫn bật" 0 dòng thô; "Operation not permitted" 2 hit thô, cả 2 trong `round103-e7/probe-notes.txt` trích lại số đếm "0 ... thật" của E7 — **0 sự kiện thật**; "đã tắt" 109 dòng tổng cộng (E5 ~100 + E7 notes + E8/E9 o8 log/report) |
| 07:30:17Z → 08:35:51Z | — | **Không có bản ghi nào** (khoảng trống không-bản-ghi 1h05'34" giữa closing đợt 103 và spawn đợt 104) |

Tổng trong *.log có mtime trong mù #22: **61 dòng "đã tắt"**
(E5 ×61) + **0 dòng "vẫn bật", 0 "CẢNH BÁO", 0 "Operation not
permitted" thật**.

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 61 dòng "sóng EPERM đã tắt, khởi động vite"
trong khoảng mù đều là dòng in khi lần ghi thử ĐẦU TIÊN thành
công ngay (code launcher `waveOff=true` ở lần write đầu) — in mặc
định cả khi không có sóng. Bằng chứng phân biệt: **0 dòng "sóng
EPERM vẫn bật sau …s chờ"** và **0 dòng "CẢNH BÁO: chờ sóng EPERM
10 phút"** trong toàn bộ cây round103 + round104 tới lúc này;
**0 lần "Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **1h05'34" giữa closing đợt 103 (07:30:17Z) và spawn
  đợt 104 (08:35:51Z) là mù hoàn toàn về sóng** (đủ dài để chứa
  nhiều sóng ~16 phút mà không để lại dấu vết nào) — tuy nhiên,
  khác mù #21, khoảng trống này **không chứa reboot nào** (đoạn
  sau #28 đã loại trừ trực tiếp bằng uptime, §2.3). Mù #22 "mù"
  về sóng nhưng "sáng" về reboot.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~44h28'02" trước
  probe #23 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được
  tuyên bố là đã hết.
- Khoảng trống không-bản-ghi 1h05'34" ngắn hơn đuôi mù #21
  (1h45'25") — vì closing đợt 103 làm việc tới 07:30:17Z thay vì
  đóng sớm như đợt 102.

### 2.6 Quét writeFileSync (snapshot 08:41:16–08:43:12Z)

Chạy lại đúng script chuẩn mới của E7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round104-f7`:

- Chuẩn mới: **455 dòng / 142 file** (phạm vi 2690 file).
  E7: 443 dòng / 138 file (phạm vi 2676 file).
- R7b (đối chiếu): **486 dòng / 160 file**. E7: 468 / 155.
- Copies: **25 dòng / 17 file** — y hệt E7.
- Đối chiếu chéo thô 455+25=480 ≠ 486 — **chênh +6, GIẢI THÍCH
  ĐƯỢC ĐÚNG HẾT (không phải lỗi phương pháp):** file
  `./apps/web/scripts/probe104f4-frame-parity.mjs` (6 hit)
  có mtime **08:41:42.465Z — hạ cánh ĐÚNG GIỮA LÚC SCAN** (sau
  find NEWSTD, trước find R7B); vắng trong `files-newstd.bin`,
  có trong `files-r7b.bin`. Cộng 6 dòng này: 455+25+6=486=R7b,
  **chênh 0 sau khi tính race — lần thứ mười liên tiếp**.
- **+12 dòng / +4 file so với E7, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ, không file nào
  giảm):
  - +4 `docs/PHASE9_ROUND103_E7_EPERM_LIMITS.md` (file LIMITS của
    chính E7 — 05:5xZ, sau snapshot E7 05:44:28Z)
  - +1 `docs/PHASE9_ROUND103_E9_VERIFY_LIMITS.md` (E9, 07:27:17Z)
  - +1 `docs/PHASE9_ROUND103_LIMITS.md` (closing, 07:29:40Z)
  - +6 `apps/web/scripts/probe103e4-frame-parity.mjs` (E4 đợt 103)
  - Tổng: 4+1+1+6 = **12** ✓, 4 file ✓ (R7B thêm +6
    probe104f4 = +18 ✓, 5 file ✓)
- **0 file biến mất** (scope +14 file: 4 file trên + 10 file khác
  đợt 103/104 — khớp số đếm phạm vi 2676 → 2690).
- Hit list **0 đường dẫn release*/build/** trong chuẩn mới.

### 2.7 Đính chính: async `.writeFile(` — E7 báo 0, số đúng là 2 (đều là helper đã biết)

Kiểm tra `\.writeFile\(` trong phạm vi quét (apps, scripts,
server, trừ vendored đã prune) tìm thấy **2 vị trí**:

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5, ghi trong docstring:
"cùng hợp đồng (chỉ retry lỗi EPERM, verify đủ byte sau ghi, 5 lần
× 20 s mặc định), nhưng ngủ bằng setTimeout thay vì Atomics.wait
nên KHÔNG block event loop — dùng cho MCP server / CLI / desktop
file-io"). Cả hai file **không đổi từ 10/11** (mtime 23:53:36Z và
23:56:36Z) — đã tồn tại trước snapshot E7. E7 §2.6 báo "0 async"
là **sai số đếm** (có thể do mẫu grep hẹp hơn), không phải do code
mới xuất hiện. Kết luận đính chính: **2 async call site, cả 2 đều
thuộc helper retry đã biết với cùng hợp đồng EPERM-only + verify
byte — không phải write async stray, không cần hành động.** Các
lượt sau đếm lại bằng mẫu `\.writeFile\(` trên đúng phạm vi này
để không lặp sai số.

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable trong lượt: **395 / 430 / 2100 / 1590 / 1660
MB** (08:38:59Z, 08:39:10Z, 08:40:49Z, 08:44:01Z, 08:44:11Z). Max
~2,05 GB = **34% ngưỡng guard 6144 MB** — thấp hơn max 2,48 GB
(41%) của E7, dù đợt 104 cũng chạy 8–10 luồng song song (loadavg
chỉ 0,57 lúc 08:38:59Z — đợt 104 mới spawn, tải chưa lên).
Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử
lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử
lại). Birefnet-general vẫn 0 lần chạy thành công trong gói.
Quan sát thêm ngoài bộ 5 mẫu (trên boot mới sau #29):
1875440 kB ≈ 1,83 GB lúc 08:57:38Z — vẫn dưới một nửa guard.

## 4. Reboot #29 cuối lượt + runtime restart (ghi rõ, không chạy lại checklist)

- **Reboot #29: 08:56:39Z (chính xác từng giây)** — 8c1c5131 →
  cff65e89, đo trực tiếp lúc 08:57:38Z (`uptime -s` 2026-11-13
  08:56:39, boot_id `cff65e89-0058-4c4e-8ba3-691a3e05b031`,
  `who -b` Nov 13 08:56). Khoảng cách #28 → #29 = **1h59'55"**.
- #29 xảy ra **~17 phút SAU khi checklist probe #23 hoàn thành**
  (08:39:10Z), trong lúc F7 đang chạy các lệnh find/grep chậm để
  kẹp khoảng mù. Điều kiện chạy lại trong lệnh ("reboot xảy ra
  đúng lúc probe") KHÔNG thỏa — checklist không bị cắt ngang nên
  **F7 KHÔNG chạy lại checklist** (giữ đúng "ĐÚNG 1 lần"). Probe
  #23 vẫn hợp lệ cho boot 8c1c5131.
- Cùng thời điểm, runtime restart cắt ngang lệnh find nền
  `proc_f16286147078` (breakdown khoảng trống sau #28 theo thư
  mục): kết quả đã lưu một phần trong exec-log (đủ cho §2.3 —
  mốc sớm nhất hidden_files sau #28 là 06:57:06Z); **breakdown
  /tmp cho cửa sổ sau #28 còn thiếu** (chỉ có số đếm 764 file đo
  ~08:47–08:52Z). Không mất dữ liệu probe/scan — log probe, scan
  WFS và probe-notes đã ghi xong trước restart.
- **Mù #23 mở từ 08:39:02Z** (probe #23) và đã chứa reboot #29 —
  lượt sau (probe #24) đóng từ mốc này. Reboot tiếp theo dự kiến
  **~11:02Z** (08:56:39Z + ~2h05').

## 5. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Công thức đóng mù bằng sàn** (mới, lượt này — tổng quát hóa
   E7 §4 mục 1): mù đóng được bằng lập luận sàn khi đoạn trước
   reboot dài < 2 × sàn (1h11'36" → 2h23'12"). Mù #22: đoạn trước
   #28 dài 1h16'20" nên đóng được; mù #21: đoạn trước #27 dài
   1h28'59" nhưng bản-ghi-cuối cách #27 xa (đuôi 1h45'25") nên
   để lại lỗ 17'23". Khi viết LIMITS, ghi rõ cả hai số (độ dài
   đoạn trước reboot + vị trí bản-ghi-cuối), đừng chỉ ghi "đuôi
   dài bao nhiêu".
2. **Số đếm find trong cửa sổ là ảnh chụp tại thời điểm đo, không
   phải con số bền** (mới, lượt này): đếm 265 file repo-1 trong
   cửa sổ sau #28 lúc ~08:47Z, kiểm lại ~08:55Z chỉ còn 4 file
   nguồn — 261 file dist đã bị vite build của đợt đang chạy ghi
   đè. May mắn số học khớp đúng (261+4=265) nên giải thích được;
   nếu không khớp thì phải báo là "số đếm đã trôi", không được
   trích số cũ như số bền. Mốc hoạt động bền là file nguồn
   (.md/.ts/.mjs), không phải output build.
3. **Đếm async `.writeFile(` bằng mẫu `\.writeFile\(` trên đúng
   phạm vi quét** (đính chính E7 §2.6): lượt này tìm thấy 2 vị trí
   trong helper retry async đã biết. Đừng báo 0 khi chưa grep lại
   — và khi thấy hit thì đọc ngữ cảnh: hit trong helper retry
   (có verify byte + retry EPERM-only) không phải write stray.
4. **Race giữa lúc scan** (mới, lượt này): các luồng sibling hạ
   cánh file đúng lúc scan WFS chạy → file có thể vắng trong
   NEWSTD nhưng có trong R7B. Cách xử lý: kiểm tra mtime file
   lệch so với SCAN-START/SCAN-END + kiểm tra file có trong
   `files-newstd.bin` không; nếu mtime nằm trong cửa sổ scan thì
   cộng vào đối chiếu thay vì báo chênh. Lần này +6 dòng khớp
   đúng 1 file F4.
5. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây** (A8 §4 mục
   10, nhắc lại): lượt này file cuối trước #28 khác nhau giữa hai
   cây (hidden_files: probe-error.txt 06:56:06Z; repo-1: thư mục
   apps/web 06:43:18Z) — lấy mốc muộn nhất (06:56:06Z, chỉ 38 s
   trước #28).
6. **Đuôi mù nằm gọn trong một boot đã xác định thì loại trừ được
   reboot bằng uptime** (C6 §4 mục 2, nhắc lại): áp dụng cho đoạn
   SAU #28 (06:56:44Z → 08:39:02Z) — `uptime -s` vẫn 06:56:44Z +
   boot_id không đổi lúc probe #23 và xác nhận lại cuối checklist.
7. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 61 dòng "đã tắt" trong mù #22
   (E5 ×61) đều là dương tính giả; 0 dòng "vẫn bật", 0 "Operation
   not permitted" thật. Đếm "đã tắt" trong *.log có mtime trong mù,
   không đếm hit grep rộng cả .md/.txt (109 dòng — phần lớn là
   LIMITS trích lại số đếm).

## 6. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm (journal/wtmp
   volatile, không có /var/log/syslog hay kern.log) — parent/user
   quyết xem có chấp nhận "tối đa 1 reboot ẩn trong lỗ 17'23"" làm
   mức đóng của mù #21 hay để mở như reboot #16. F7 không tự quyết.
2. **Khoảng mù #22 ĐÃ ĐÓNG HOÀN TOÀN (mới, lượt này)** — reboot
   duy nhất là #28 (06:56:44Z). Không còn nợ nào từ mù #22.
3. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #23 OK 2/2) — và 1h05'34" giữa closing đợt 103 và
   spawn đợt 104 hoàn toàn không có bản ghi về sóng. Sóng gần nhất:
   ~11:55–12:11Z, ~44h28' trước probe #23.
4. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3):
   lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). F7 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #22 dài 2h58'38" với đuôi không-bản-ghi 1h05'34" về
   sóng — và reboot #29 (08:56:39Z) không ai quan sát lúc xảy ra
   (chỉ ghi nhận sau đó 59 giây).
5. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; 3 dòng lạ 11:59–12:00Z vẫn còn trong log, không
   thêm dòng lạ mới trong lượt này — log tăng đúng 3 dòng checklist).
6. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
7. **VM reboot ~2h05'/lần** (29 lần/~60h38'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến **~11:02Z**; lúc 08:57:38Z máy đã
   trên boot cff65e89 (#29). Dải khoảng cách quan sát nay là
   **1h11'36"–3h14'08"** (không đổi).
8. **Birefnet: KHÔNG chạy trong lượt này** — RAM 5 mẫu MemAvailable
   **395 / 430 / 2100 / 1590 / 1660 MB** (max ~2,05 GB = 34%
   ngưỡng guard 6144 MB). Max thấp hơn E7 (2,48 GB) do đợt 104 mới
   spawn, tải chưa lên. Ghi rõ để parent quyết: nếu RAM khả dụng
   chạm ≥ 6 GB thì mới thử lại. Birefnet-general vẫn 0 lần
   chạy thành công trong gói.
9. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
10. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
11. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    F7 không thử lại nguồn nào, theo đúng lệnh.
12. **Khoảng mù #23 bắt đầu từ 08:39:02Z** (probe #23) — đã chứa
    reboot #29 (08:56:39Z); lượt sau (probe #24) đối chiếu từ mốc
    này. **Breakdown /tmp cho cửa sổ sau #28 còn thiếu** (runtime
    restart cắt ngang lệnh find — xem §4); lượt sau không cần làm
    lại trừ khi parent yêu cầu, vì việc loại trừ reboot không phụ
    thuộc vào nó.

## 7. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND104_F7_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round104-f7-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f7.md`
(log luồng); scratch trong `hidden_files/round104-f7/` (scan-wfs.sh,
scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
wfs-r7b.txt, files-copies.txt, wfs-copies.txt, probe-notes.txt);
log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

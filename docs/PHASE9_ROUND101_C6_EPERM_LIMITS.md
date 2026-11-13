# PHASE9 ROUND101 C6 — EPERM: probe #20 + đóng khoảng mù #19 + thử chốt giờ reboot #16 bằng nguồn mới (nợ LIMITS gộp đợt 100 §4 mục 8)

> Luồng C6, đợt 101 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07,
> 13/11/2026; làm việc ~23:39–23:47Z 12/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + đóng khoảng mù #19 kể từ probe #19
> (20:40:35Z) + thử chốt giờ từng giây reboot #16 bằng nguồn dữ liệu
> mới nếu có + ghi RAM hiện tại (birefnet: KHÔNG chạy — vẫn dưới
> ngưỡng guard, xem §5).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền.**

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 23:39:51Z
  báo **DEAD/STALE** (heartbeat age 10.756 s, last #19 20:40:35Z,
  boot 66fb273d, exit 1); `once` ngay sau đó là **probe #20,
  boot aa3f2b67 (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 1 s, n=20), exit 0.
- **Khoảng mù #19: 20:40:35Z → 23:39:56Z (~179')** — chứa **1 REBOOT
  ĐÃ XÁC NHẬN: #24 21:41:50Z chính xác từng giây (boot 66fb273d →
  aa3f2b67, probe #20 xác minh id)**. Khoảng cách #23 → #24 là
  **1h11'36" — ngắn nhất từng ghi giữa hai reboot liên tiếp có giờ
  chính xác** (vượt #17 → #18 1h23'02"). Chu kỳ nay là **24 lần /
  ~49h24' ≈ 2h03'/lần**. Reboot tiếp theo dự kiến **~23:45Z** (rất
  gần — xem §5 mục 5).
- **Hoạt động liên tục 20:40Z → 22:51:47Z** (B1–B7 hạ cánh, B9 poll
  10 phút/lần, B9 verify + O8 sau reboot) — không reboot nào khác
  trước 22:51:47Z. **Khoảng trống không-bản-ghi cuối mù chỉ còn
  ~48'09"** (22:51:47Z → 23:39:56Z) — ngắn nhất trong các đuôi mù
  gần đây (~88' mù #18, ~117' mù #17). **Không có reboot trong đuôi
  này** — chứng minh được bằng `uptime -s` vẫn 21:41:50Z + boot_id
  không đổi lúc probe #20. Sóng EPERM trong đuôi không loại trừ
  được (không có bản ghi), nhưng cũng không có bằng chứng nào cho
  nó.
- **Không tìm thấy bằng chứng sóng EPERM thật trong các bản ghi còn
  lại của khoảng mù** — 0 dòng "sóng EPERM vẫn bật", 0 dòng
  "CẢNH BÁO: chờ sóng EPERM 10 phút", 0 lần "Operation not
  permitted" thật. 9 dòng "sóng EPERM đã tắt" trong mù (B3 ×6 +
  B9 O8 ×3) đều là **dương tính giả đã biết**. Sóng gần nhất vẫn là
  **~11:55–12:11Z** (R7) — ~35h29' trước probe #20. EPERM vẫn
  KHÔNG được tuyên bố là đã hết.
- **Reboot #16: VẪN KHÔNG chốt được giờ từng giây** — đã thử mọi
  nguồn mới còn có thể thử (`/var/log` không có syslog; dpkg.log /
  alternatives.log / apt history+term.log: 0 dòng trong cửa sổ;
  lastlog/btmp/journal/dmesg: chỉ boot hiện tại hoặc không
  timestamp; shell history không có timestamp; build-loop-log chỉ
  có tham chiếu phút "07:29Z", không giây). Kẹp giữ nguyên
  **07:26:03Z → ~07:30:00Z (~4')** — không còn nguồn nào để thử
  thêm (xem §2.5).
- **RAM: 5 mẫu MemAvailable 447 / 1729 / 1770 / 1773 / 1360 MB**
  (max ~1,77 GB = 29% ngưỡng guard 6144 MB) — birefnet KHÔNG chạy,
  đúng quy tắc chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC
  (xem §5 mục 6).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 23:39:43–23:39:51Z | boot_id `aa3f2b67-7aa9-497a-bc8c-6c2973417b10`; `who -b` Nov 12 21:42; `uptime -s` **2026-11-12 21:41:50Z** (uptime ~1h57'); journal chỉ 1 boot (aa3f2b67, first entry 21:42:01Z); `last -x reboot` 21:42 still running; wtmp bắt đầu 21:42:00Z |
| `bash scripts/probe-eperm-v2.sh status` | 23:39:51Z | **DEAD/STALE**, exit 1 — heartbeat n=19, ts 20:40:35Z, boot 66fb273d, age **10.756 s**; last sample probe #19; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 23:39:56Z | **probe #20, boot=aa3f2b67, ok=2 fail=0**, exit 0; dòng `boot changed 66fb273d -> aa3f2b67` (uptime since 2026-11-12 21:41:50) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 23:39:56Z | **ALIVE**, age 1 s, n=20, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 52 dòng, trước lượt 49 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=20, ts
23:39:56Z, pid=21349, boot aa3f2b67-7aa9-497a-bc8c-6c2973417b10).

## 2. Điều tra khoảng mù kể từ probe #19

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 23:39–23:40Z)

- Boot hiện tại: `uptime -s` = **2026-11-12 21:41:50Z**, boot_id
  `aa3f2b67-7aa9-497a-bc8c-6c2973417b10` — khác boot của probe #19
  (66fb273d).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, aa3f2b67,
  first entry 21:42:01Z, last 23:39:07Z). `last -x reboot`: chỉ 1
  dòng (21:42, still running). wtmp bắt đầu 21:42:00Z.
  → journal/wtmp chỉ giữ boot hiện tại, như mọi lần trước.
- Dòng `boot changed` do `once` 23:39:56Z ghi vào log chỉ ghi
  **66fb273d → aa3f2b67** — bước nhảy đơn; xem §2.2–2.3 về khả năng
  nuốt boot trung gian.

### 2.2 Một reboot trong khoảng mù (đã xác nhận)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 24 | **21:41:50Z (chính xác từng giây)** | 66fb273d → aa3f2b67 | `uptime -s` + `boot_id` đo trực tiếp lượt này; `journalctl --list-boots` (first entry 21:42:01Z); `last -x reboot` (21:42, still running); wtmp bắt đầu 21:42:00Z; B9 poll log ghi reboot #24 lúc ~21:41:50Z + poller cũ chết, khởi động lại 21:42:42Z — khớp độc lập. Không ai ghi nhận lúc xảy ra ngoài B9 (poll 21:39Z → poller chết → restart 21:42:42Z). |

Chu kỳ reboot nay là **24 lần trong ~49h24'** (từ ~20:18Z 10/11 tới
21:41:50Z 12/11) — trung bình ~2h03'/lần theo cách đếm của W7/X7
(tổng thời gian / số reboot; B6: 23 lần / ~48h12' ≈ 2h06').
Khoảng cách #23 → #24 là **1h11'36"** — **ngắn nhất từng ghi giữa
hai reboot liên tiếp có giờ chính xác** (vượt #17 → #18
1h23'02"; khoảng ~31–35' #16 → #17 là kẹp, không phải giờ chính
xác). Dự báo B6 ~22:36Z trượt ~54' (B9 đã ghi đính chính này).
Reboot tiếp theo dự kiến **~23:45Z** (21:41:50Z + ~2h03') — xem
§5 mục 5. Mọi probe nền đều chết theo reboot; v2 chỉ đảm bảo cái
chết được ghi nhận + lượt sau hồi phục bằng 1 mẫu mới.

Khoảng mù #19 là **khoảng mù thứ 12 liên tiếp (#8–#19) chứa
reboot**. Dòng `boot changed` lần này là bước nhảy đơn — nhưng theo
bài học A8 §4 mục 6, bước nhảy đơn KHÔNG tự chứng minh chỉ có 1
reboot (mù #17 cũng bước nhảy đơn mà chứa 2 reboot); xem §2.3 về
đối chiếu hoạt động liên tục + đuôi mù không-bản-ghi.

### 2.3 Hoạt động trong khoảng mù — vì sao không có reboot nào khác trước 22:51:47Z, và đuôi mù ~48' không chứa reboot

Hoạt động ghi đĩa liên tục 20:40Z → 22:51:47Z:

- **20:40–21:21Z (boot 66fb273d):** các luồng đợt 100 hạ cánh —
  repo-1: probe B4 20:42:26Z, probe97y5 20:43:02Z, verdict
  20:44:06Z, playheadHold90R2 20:45:56Z, preview.tsx 20:46:39Z,
  probe100b3 20:50:41Z, B6 LIMITS 20:53:43Z, analyze100b3
  20:55:42Z, probe100b5 20:58:11Z, B3 LIMITS 21:04:16Z, B1 probe
  21:06:47Z, clicktest 21:06:48Z, B2 LIMITS 21:06:59Z, B5 LIMITS
  21:08:50Z, B4 LIMITS 21:09:46Z, B1 LIMITS 21:16:44Z, B7 LIMITS
  21:21:20Z; hidden_files: B7 e1-run9 tới 21:15:41Z, B1 summary
  21:15:47Z, B7 recompute-pool100b7.py 21:17:51Z.
- **20:49–21:39Z:** B9 poll đĩa 10 phút/lần (20:49Z 0/8, 20:59Z
  1/8, 21:09Z 4/8, 21:19Z 6/8, 21:29Z 7/8, 21:39Z 7/8) — boot
  66fb273d suốt, RAM 1680/1125/3338/1443/525/530 MB. Một reboot
  trong cửa sổ này sẽ giết poller + các luồng đang chạy — không
  tiến trình nào báo chết giữa chừng ngoài #24 lúc 21:41:50Z.
- **21:42:42Z:** B9 khởi động lại poller (poller cũ chết cùng
  reboot #24, ps=0 — không trùng).
- **21:52–22:51Z (boot aa3f2b67):** B9 poll 21:52Z 7/8, **22:02Z
  8/8 ALL LANDED** (B8 về đủ); verify 22:05–22:09Z; O8 22:10–
  22:46Z (cả 2 engine 21/21 sau khi sửa fixture/deps); poll-final
  22:47:40Z; B9 VERIFY LIMITS 22:51:17Z (repo-1); build-loop-log
  22:51:47Z (hidden_files, parent closing đợt 100).
- **Đính chính LIMITS gộp đợt 100 §4 mục 1:** B9 **ĐÃ XONG trong
  đợt 100** (về đủ muộn hơn parent gộp — parent gộp 21:58Z khi B9
  mới 7/8; B9 ALL LANDED 22:02Z, LIMITS 22:51:17Z, batch
  `phase9-round100-b9-verify.txt` đã stage). Nợ "B9 kiểm chứng"
  cho đợt 101 vì vậy **đã đóng trước khi đợt 101 bắt đầu** — tổng
  chờ push sau đợt 100 là **342 batch / 2391 entry / 1443 file duy
  nhất** (không phải 341/2390/1442 như LIMITS gộp viết trước
  addendum B9).

**Sau 22:51:47Z thì không có bản ghi nào cho tới probe #20:**
khoảng trống không-bản-ghi **~48'09" (22:51:47Z → 23:39:56Z)** —
file cuối trước khoảng trống là `build-loop-log.md` 22:51:47Z
(hidden_files) và `PHASE9_ROUND100_B9_VERIFY_LIMITS.md` 22:51:17Z
(repo-1; kẹp bằng cả hai cây theo A8 §4 mục 10 — lấy mốc muộn
nhất 22:51:47Z). Trong cửa sổ này **không có file round101 nào**
(dir `round101-c1/c7/c9` tạo 23:41–23:43Z, SAU probe #20) và
không có file nào khác trên cả hai cây (`find -newermt`
22:51:47Z–23:39:56Z chỉ trả về đúng file build-loop-log làm mốc).
Khoảng trống ~48' là **ngắn nhất trong các đuôi mù gần đây**
(~88' mù #18, ~117' mù #17, ~92' mù #16) — nhờ B9 làm việc tới
tận 22:51Z.

**Không có reboot trong đuôi ~48':** chứng minh được — `uptime -s`
lúc probe #20 vẫn là 21:41:50Z và boot_id vẫn aa3f2b67. Một reboot
bất kỳ trong 22:51:47Z → 23:39:56Z đều sẽ đổi cả hai giá trị này.
Đây là lần đầu tiên một đuôi mù được **chứng minh không chứa
reboot bằng uptime** thay vì chỉ "không có bằng chứng" — vì đuôi
mù nằm gọn trong một boot đã xác định. Hệ quả: **chỉ đúng 1 reboot
(#24) trong toàn bộ khoảng mù #19 — đã xác nhận, không còn chỗ cho
reboot trung gian.** (Lưu ý: lập luận này chỉ loại trừ reboot,
không loại trừ sóng EPERM — sóng không đổi boot_id/uptime.)

### 2.4 Đính chính: khoảng cách ngắn nhất giữa hai reboot liên tiếp có giờ chính xác

Bảng khoảng cách liên tiếp đã xác nhận (giờ chính xác trừ #14/#16
kẹp), cập nhật từ B6 §2.4:

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
| #22 17:25:39Z → #23 20:30:14Z | 3h04'35" (dài nhất) |
| #23 20:30:14Z → #24 21:41:50Z | **1h11'36" (ngắn nhất có giờ chính xác)** |

Hệ quả: sàn khoảng cách chính xác nay là 1h11'36" (giảm từ
1h23'02"). Một reboot trung gian trong đuôi mù ~48' vẫn sẽ đòi hai
khoảng cách cộng lại ~48' (trung bình ~24'/khoảng) — thấp hơn nhiều
so với mọi khoảng cách chính xác từng ghi — nhưng lập luận này giờ
chỉ là phụ: đuôi mù #19 đã được **chứng minh không chứa reboot
bằng uptime** (§2.3), không cần dựa vào sàn khoảng cách nữa.

### 2.5 Reboot #16 — thử chốt giờ từng giây bằng nguồn mới: KHÔNG chốt được, không còn nguồn nào

Đã kiểm tra mọi nguồn mới có thể nghĩ ra thêm so với B6 §2.5
(B6 đã kiểm: `find -newermt` cả hai cây trong kẹp, `/tmp`, verify
log, verify-u4.log):

| Nguồn mới thử lượt này | Kết quả |
|---|---|
| `/var/log/syslog`, `auth.log`, `kern.log`, `messages` | **Không tồn tại** — `/var/log` chỉ có README, alternatives.log, apt, btmp, dpkg.log, fontconfig.log, journal, lastlog, private, wtmp. Không có rsyslog persistent nào. |
| `dpkg.log` | 0 dòng trong 07:26–07:30Z |
| `alternatives.log` | 0 dòng trong 07:26–07:30Z |
| `/var/log/apt/history.log` + `term.log` | Có dòng ngày 2026-11-12 nhưng **0 dòng trong 07:26–07:30Z** |
| `lastlog` | Toàn "Never logged in" — không timestamp nào |
| `btmp` | Begins 21:42:01Z — chỉ boot hiện tại, volatile như wtmp |
| `/var/log/journal/` | Chỉ 1 machine dir, 1 `system.journal` (boot hiện tại); `journalctl --list-boots` = 1 boot |
| `dmesg` | Trống (chỉ boot hiện tại dù đọc được) |
| Shell history (`~/.bash_history`) | `HISTTIMEFORMAT` **không set** ở `~/.bashrc` lẫn `/etc/bash.bashrc` → history không có timestamp, không dùng được |
| `build-loop-log.md` grep `07:2[6-9]` / `07:30` | Chỉ thấy các dòng đã biết; dòng 3440 "Đối chiếu batch lúc 07:29Z" là **tham chiếu phút, không giây** — nhất quán với kẹp ~4' nhưng **không thu hẹp được kẹp** (không chứng minh thêm giây nào, và không rõ đó là lúc chạy check hay lúc ghi entry) |

**Kết luận: giờ từng giây của reboot #16 KHÔNG chốt được — đã thử
hết mọi nguồn còn tồn tại.** Kẹp giữ nguyên **07:26:03Z →
~07:30:00Z (~4')** (cận trên suy luận từ thời lượng re-run U4,
B6 §2.5). Đề xuất của B6 vẫn đứng: **đóng nợ này ở mức kẹp ~4
phút** thay vì để mở vô hạn chờ dữ liệu không còn tồn tại. Số thứ
tự #16, boot adcef40a, và ước lượng W9 đều đã khớp nhau; chỉ thiếu
giây chính xác — thiếu sót này không ảnh hưởng chu kỳ reboot hay
bất kỳ kết luận nào khác. Chờ parent/user quyết.

### 2.6 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 100 + đợt 101 tới lúc này

Khoảng mù 20:40:35Z → 23:39:56Z (~179') được phủ bởi các luồng
sibling đợt 100 (B1–B9, làm việc tới ~22:51:47Z) + khoảng trống
~48' + spawn đợt 101 (~23:35:51Z, chưa có file nào trước probe
#20). Đã đọc lại log thật (grep `sóng EPERM vẫn bật` /
`CẢNH BÁO: chờ sóng` / `Operation not permitted` trên toàn bộ cây
`hidden_files/round100-*` + `docs/PHASE9_ROUND100_*.md`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| B1–B8 (`docs/PHASE9_ROUND100_B*.md` + log) | 20:40–~21:54Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật |
| B3 (probe webkit load) | 20:51–20:59Z | 6 dòng "sóng EPERM đã tắt" (20:51:13Z, 20:54:15Z, 20:55:07Z, 20:56:37Z, 20:57:58Z, 20:59:00Z) — **dương tính giả đã biết** |
| B9 poll + verify + O8 | 20:49–22:51Z | 3 dòng "sóng EPERM đã tắt" (O8 log 22:10:57Z, 22:28:01Z, 22:45:23Z) — **dương tính giả đã biết**; O8 21/21 cả 2 engine sau khi sửa fixture/deps |
| B6 (file LIMITS của chính B6) | 20:38–20:53Z | 2 hit grep chỉ là B6 trích lại số đếm "0 vẫn bật / 0 CẢNH BÁO / 0 Operation not permitted thật" — không phải sự kiện |
| 22:51:47Z → 23:39:56Z | — | **Không có bản ghi nào** (đuôi mù ~48' — xem §2.3) |
| Đợt 101 (C1/C7/C9) | ~23:35Z– | Chưa có file nào trước probe #20 (dir tạo 23:41–23:43Z) — 0 nhắc EPERM |

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 9 dòng "sóng EPERM đã tắt, khởi động vite"
trong khoảng mù (B3 ×6 + B9 O8 ×3) đều là dòng in khi lần ghi
thử ĐẦU TIÊN thành công ngay (code launcher `waveOff=true` ở
lần write đầu) — in mặc định cả khi không có sóng. Bằng chứng
phân biệt: **0 dòng "sóng EPERM vẫn bật sau …s chờ"** và **0
dòng "CẢNH BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ cây
round100 tới lúc này; **0 lần "Operation not permitted" thật**
(mọi hit grep đều là chữ trong LIMITS của B6 hoặc tên test
`hasEperm`).

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **~48' cuối (22:51:47Z → 23:39:56Z) là mù hoàn toàn**,
  đủ dài để chứa nhiều sóng ~16 phút mà không để lại dấu vết nào
  trong hồ sơ — nhưng **đã chứng minh không chứa reboot** (§2.3),
  nên đuôi mù này "sạch" hơn mọi đuôi mù trước ở đúng một khía
  cạnh: reboot đã loại trừ được, chỉ còn sóng là chưa loại trừ.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~35h29' trước probe
  #20 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được tuyên
  bố là đã hết.
- Khoảng trống không-bản-ghi ~48' là ngắn nhất trong các đuôi mù
  gần đây — nhờ B9 làm việc tới tận 22:51Z (verify + O8 sau
  reboot).

### 2.7 Bảng 19 lần chết / khoảng mù (cập nhật từ bảng 18 lần của B6 §2.7)

| # | Probe | Mẫu cuối | Khoảng chết/mù | Nguyên nhân (mức chắc chắn) |
|---|---|---|---|---|
| 1–18 | (xem B6 §2.7 — không đổi) | — | — | — |
| 19 | — (đợt 100 B6 → đợt 101 C6) | #19 20:40:35Z | mù 20:40:35–23:39:56Z (~179') | **Không có observer + 1 REBOOT ĐÃ XÁC NHẬN** — **#24 21:41:50Z chính xác từng giây** (→ aa3f2b67; B9 ghi nhận qua poller chết + restart 21:42:42Z, **probe #20 xác minh id boot + giờ từng giây**). Hoạt động liên tục 20:40Z → 22:51:47Z (đợt 100 + verify + O8 + closing) — không reboot nào khác trước 22:51:47Z. **Đuôi mù ~48' (22:51:47Z → 23:39:56Z) đã CHỨNG MINH không chứa reboot** (uptime -s vẫn 21:41:50Z + boot_id không đổi) — lần đầu tiên một đuôi mù loại trừ được reboot bằng uptime. **Không tìm thấy bằng chứng sóng** trong các bản ghi còn lại (B1–B9 tới ~22:51:47Z; 9 dòng "sóng EPERM đã tắt" là dương tính giả đã biết — **0 "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật**); nhưng **~48' cuối hoàn toàn không có bản ghi** — không loại trừ sóng trong cửa sổ đó. |

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable trong lượt: **447 / 1729 / 1770 / 1773 / 1360 MB**
(23:39:43Z, ~23:41Z ×3, 23:44:47Z). Max ~1,77 GB = **29% ngưỡng
guard 6144 MB** — thấp hơn hẳn max 5,04 GB (82%) của B6 lúc cuối
lượt (khi tải luồng song song giảm). Mẫu thấp 447 MB gần kỷ lục
thấp 507 MB của X7 / 525–530 MB của B9 lúc poll — RAM dao động
mạnh theo tải các luồng song song đợt 101 đang spawn. Birefnet
KHÔNG chạy, đúng quy tắc parent đợt 92 §3 mục 7 (chỉ thử lại khi
RAM đổi theo hướng có lợi ĐỦ MỨC; chạm ≥ 6 GB mới thử lại).
Birefnet-general vẫn 0 lần chạy thành công trong gói.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây** (A8 §4 mục
   10): lượt này file cuối trước khoảng trống khác nhau giữa hai
   cây (hidden_files: build-loop-log.md 22:51:47Z; repo-1: B9
   VERIFY LIMITS 22:51:17Z) — lấy mốc muộn nhất (22:51:47Z).
2. **Đuôi mù nằm gọn trong một boot đã xác định thì loại trừ được
   reboot bằng uptime** (mới, lượt này): nếu `uptime -s` + boot_id
   lúc probe sau vẫn trỏ về reboot đã biết trước đuôi mù, thì
   không có reboot nào trong đuôi — không cần dựa vào sàn khoảng
   cách giữa các reboot. Chỉ áp dụng khi đuôi mù bắt đầu SAU một
   reboot đã xác định giờ chính xác; không áp dụng cho đuôi mù
   chứa reboot chưa biết giờ.
3. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8):** dòng đó in khi lần ghi thử ĐẦU TIÊN thành công
   ngay — tức in mặc định cả khi không có sóng. Chỉ dòng "sóng
   EPERM vẫn bật sau …s chờ" hoặc "Operation not permitted" mới
   tính là bằng chứng sóng. Lượt này áp dụng lại: 9 dòng "đã
   tắt" trong khoảng mù (B3 ×6, B9 O8 ×3) đều là dương tính giả;
   0 dòng "vẫn bật", 0 "Operation not permitted" thật.
4. **Dòng `boot changed` của probe gộp mọi reboot trung gian**
   (A8 §4 mục 6): khi thấy `boot changed` phải đối chiếu log
   sibling / build-loop-log xem có boot trung gian không, đừng tin
   bước nhảy là 1 reboot duy nhất. Lượt này bước nhảy đơn
   66fb273d → aa3f2b67 được xác minh là đúng 1 reboot bằng hoạt
   động liên tục trước reboot + uptime loại trừ reboot trong đuôi
   mù (§2.3).
5. **Thử chốt giờ reboot bằng nguồn mới thì liệt kê cả nguồn đã thử
   mà không có gì** (mới, lượt này — xem §2.5): ghi rõ từng nguồn
   (dpkg.log, alternatives.log, apt history/term.log, lastlog,
   btmp, journal, dmesg, shell history, build-loop-log) và kết quả
   0 — để lượt sau không thử lại cùng nguồn. Nguồn không tồn tại
   (syslog/auth.log/kern.log/messages) cũng phải ghi rõ là không
   tồn tại, không phải "không tìm thấy dòng".
6. **Kiểm tra số liệu lịch sử trước khi trích lại** (B6 §4 mục 11):
   lượt này tính lại chu kỳ (24 lần / ~49h24' ≈ 2h03') và khoảng
   cách #23 → #24 (1h11'36") từ giờ boot gốc trong log probe, thay
   vì copy số của B6.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #20 OK 2/2) — và ~48' cuối khoảng mù #19 hoàn toàn
   không có bản ghi. Sóng gần nhất: ~11:55–12:11Z, ~35h29' trước
   probe #20.
2. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2): lệnh cron chỉ là `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). C6 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #19 dài ~179' chứa **reboot #24 mà chỉ B9 ghi nhận
   gián tiếp qua poller chết** (không ai quan sát lúc xảy ra);
   khoảng mù #8 đã chứng minh có thể chứa cả một sóng đầy đủ;
   khoảng trống không-bản-ghi cuối mù nay là ~48' (đủ chứa nhiều
   sóng ~16').
3. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3,
   S7 §5 mục 3, T8 §5 mục 3, U8 §5 mục 3, V6 §5 mục 3, W7 §5 mục 3,
   X7 §5 mục 3, Y8 §5 mục 3, Z7 §5 mục 3, A8 §5 mục 3, B6 §5 mục
   3; 3 dòng lạ 11:59–12:00Z vẫn còn trong log, không thêm dòng lạ
   mới trong lượt này).
4. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
5. **VM reboot ~2h03'/lần** (24 lần/~49h24'): mọi probe nền đều chết
   theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi
   phục. Reboot tiếp theo dự kiến **~23:45Z** — tức gần như ngay
   sau probe #20 (23:39:56Z); lúc 23:44:47Z máy vẫn trên boot
   aa3f2b67. Dải khoảng cách quan sát nay là **1h11'36"–3h04'35"**,
   nên dự báo theo trung bình có thể lệch ~1h như đã thấy ở #24
   (B6 dự báo ~22:36Z, thực tế 21:41:50Z, lệch ~54').
6. **Birefnet: KHÔNG chạy trong lượt này** — RAM 5 mẫu MemAvailable
   **447 / 1729 / 1770 / 1773 / 1360 MB** (max ~1,77 GB = 29%
   ngưỡng guard 6144 MB). Max vẫn dưới một phần ba ngưỡng guard nên
   chưa đủ mức thử lại theo quy tắc parent đợt 92 §3 mục 7. Ghi rõ
   để parent quyết: nếu RAM khả dụng chạm ≥ 6 GB thì mới thử lại.
   Birefnet-general vẫn 0 lần chạy thành công trong gói.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
9. **Reboot #16 — đề xuất ĐÓNG ở mức kẹp ~4 phút** (07:26:03Z →
   ~07:30:00Z; cận trên suy luận từ thời lượng re-run U4, B6 §2.5):
   giờ từng giây KHÔNG chốt được — lượt này đã thử hết mọi nguồn
   mới còn có thể thử (§2.5) và không nguồn nào cho thêm giây nào.
   Chờ parent/user quyết có chấp nhận mức kẹp này hay giữ nợ mở.
   Thiếu giây chính xác không ảnh hưởng chu kỳ reboot hay bất kỳ
   kết luận nào khác.
10. **Khoảng mù #20 bắt đầu từ 23:39:56Z** (probe #20) — lượt sau
    (probe #21) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~23:45Z.
11. **Đính chính LIMITS gộp đợt 100 §4 mục 1:** B9 ĐÃ XONG trong đợt
    100 (ALL LANDED 22:02Z, LIMITS 22:51:17Z) — nợ "B9 kiểm chứng"
    đã đóng trước đợt 101; tổng chờ push sau đợt 100 là 342 batch /
    2391 entry / 1443 file duy nhất. LIMITS gộp đợt 101 cần ghi
    addendum này, đừng mang nợ B9 sang đợt 102.

## 6. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND101_C6_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round101-c6-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round101-c6.md`
(log luồng); scratch trong `hidden_files/round101-c6/` (`probe-notes.txt`);
log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

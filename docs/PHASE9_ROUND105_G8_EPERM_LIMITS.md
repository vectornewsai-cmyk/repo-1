# PHASE9 ROUND105 G8 — EPERM: probe #24 + khoảng mù #23 ĐÃ ĐÓNG (nợ LIMITS gộp đợt 104 §4, 11 mục)

> Luồng G8, đợt 105 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 13/11/2026; làm việc ~11:38–11:44Z 13/11/2026). Nhiệm vụ: checklist
> probe v2 ĐÚNG 1 lần (P8 §2.3) + đóng khoảng mù #23 kể từ probe #23
> (08:39:02Z 13/11) + quét writeFileSync theo chuẩn mới (đối chiếu
> snapshot F7 đợt 104) + ghi RAM hiện tại (birefnet: KHÔNG chạy — vẫn
> dưới ngưỡng guard, xem §3).
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **KHÔNG tự tạo cron riêng 10 phút, KHÔNG start
> loop nền. KHÔNG tự đóng reboot #16, mù #21, hay EPERM** — chỉ báo
> cáo "không thấy" vs "không có".

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần:** `status` lúc 11:38:19Z
  báo **DEAD/STALE** (heartbeat age 10.757 s, last #23 08:39:02Z,
  boot 8c1c5131, exit 1); `once` ngay sau đó là **probe #24,
  boot 3e4f237a (ĐỔI), ok=2 fail=0**, exit 0; `status` chạy lại
  **ALIVE** (age 5 s, n=24), exit 0.
- **ĐÍNH CHÍNH LỚN — tiền đề lượt này SAI: 11:26:40Z là reboot #31,
  KHÔNG phải #30.** Reboot **#30 đã xảy ra lúc 10:54:53Z
  (cff65e89 → 287705ad)**, do F9 ghi nhận TRỰC TIẾP trong lượt
  (poller restart 10:55:48Z với `uptime_since=2026-11-13 10:54:53`,
  suites log boot 287705ad 10:59:20–11:03:20Z, O8 + verify chạy
  trên boot đó tới 11:13:36Z — xem §2.2). Reboot **#31: 11:26:40Z
  (chính xác từng giây)**, 287705ad → 3e4f237a, đo trực tiếp lượt
  này (`uptime -s` + `boot_id`, xác nhận lại 11:42:22Z và 11:43:33Z
  không đổi). Khoảng cách #30 → #31 = **31'47" — NGẮN NHẤT từng
  ghi, phá sàn cũ 1h11'36"** (xem §2.4 + §5 mục 1).
- **Khoảng mù #23: 08:39:02Z → 11:38:22Z (2h59'20") — ĐÃ ĐÓNG
  HOÀN TOÀN.** Đúng 3 reboot trong mù: #29 (08:56:39Z), #30
  (10:54:53Z), #31 (11:26:40Z) — cả ba chốt giờ từng giây. Đoạn
  #29→#30 loại trừ trực tiếp bằng poller F9 (poll mỗi 10 phút,
  không sót lần nào, boot cff65e89 suốt) + watcher hiram F5 (50
  lần check mỗi ~45 s, boot cff65e89 đầu–cuối); hai đoạn còn lại
  loại trừ bằng sàn (17'37" và 31'47" đều < 2 × sàn mới). Đây là
  mù đóng hoàn toàn thứ hai liên tiếp (sau #22).
- **Hệ quả cho mù #22 (đã đóng ở F7): sàn mới 31'47" làm sụp cột
  sàn của F7** — đoạn trước #28 dài 1h16'20" nay > 2 × sàn mới
  (1h03'34"), mở cửa sổ hình thức [06:12:11Z, 06:24:57Z]. Kiểm
  lại cửa sổ này: hoạt động dày đặc (hàng chục file, 5 luồng
  E1/E3/E4/E5/E6, khoảng cách giữa các bản ghi ≤ ~30 s, chuỗi
  probe E5 không đứt quãng, không run nào bị giết) — mù #22
  **vẫn đóng trên bằng chứng hoạt động, nhưng mức tin cậy hạ từ
  "sàn + hoạt động, kín" xuống "chỉ hoạt động, cửa sổ lý thuyết
  ≤30 s"**. G8 KHÔNG tự quyết mở lại hay giữ nguyên — parent/user
  quyết (xem §2.8).
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật trong
  339 file *.log có mtime trong mù #23; 9 dòng "sóng EPERM đã tắt"
  (F5 ×6 + F9 O8 ×2 + recounts trích lại ×1) đều là **dương tính
  giả đã biết**. Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) —
  ~47h27' trước probe #24. EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync chuẩn mới: 472 dòng / 148 file** (phạm vi
  2704 file); R7b đối chiếu 497 dòng / 165 file; copies 25 dòng /
  17 file; đối chiếu chéo 472+25=497=R7b, **chênh 0 — lần thứ mười
  một liên tiếp**. +17 dòng / +6 file so với F7, giải thích đúng
  hết bằng diff (trong đó +6 là file race của F7 nay đã vào cả
  hai bảng). 0 file biến mất. Async `.writeFile(`: vẫn đúng **2
  vị trí, cả hai trong helper retry đã biết** — 0 stray.
- RAM 5 mẫu 499 / 473 / 497 / 1868 / 1811 MB (max ~1,82 GB = 30%
  ngưỡng guard) — birefnet KHÔNG chạy. Max RAM trong mù #23 là
  2356708 kB (~2,30 GB = 37% guard, watcher hiram 09:17:55Z) —
  vẫn dưới một nửa guard. Reboot #16 VẪN MỞ (kẹp ~4', chờ
  parent/user quyết); cron riêng 10 phút vẫn chờ user quyết.
- **Dự báo reboot tiếp theo của F9 SAI LỚN:** F9 dự ~12:59Z (dải
  12:06–14:09Z); thực tế #31 lúc 11:26:40Z — sớm hơn 1h32' so
  với điểm dự báo, ngoài cả dải dưới. Dự báo mới: **~13:29Z**
  (dải sàn–trần mới 11:58:27Z–14:40:48Z — rất rộng, xem §2.4).

## 1. Checklist P8 §2.3 cho lượt này (số thật)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:38:14Z | boot_id `3e4f237a-adf1-47c6-af18-9debf7436cd0`; `who -b` Nov 13 11:26; `uptime -s` **2026-11-13 11:26:40Z** (uptime ~11'); journal chỉ 1 boot (3e4f237a, first entry 11:26:51Z, last 11:37:22Z lúc kiểm tra); `last -x reboot` 11:26 still running; wtmp bắt đầu 11:26:51Z |
| `bash scripts/probe-eperm-v2.sh status` | 11:38:19Z | **DEAD/STALE**, exit 1 — heartbeat n=23, ts 08:39:02Z, boot 8c1c5131, age **10.757 s**; last sample probe #23; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; script ghi thêm 1 dòng `probe DEAD detected by status` vào log |
| `bash scripts/probe-eperm-v2.sh once` | 11:38:22Z | **probe #24, boot=3e4f237a, ok=2 fail=0**, exit 0; dòng `boot changed 8c1c5131 -> 3e4f237a` (uptime since 2026-11-13 11:26:40) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:38:27Z | **ALIVE**, age 5 s, n=24, exit 0 |

Log probe v2 (append-only, sống qua các lượt):
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
(nay 64 dòng, trước lượt 61 dòng — thêm đúng 3 dòng của checklist
này) + heartbeat `../eperm-probe-v2.heartbeat` (nay n=24, ts
11:38:22Z, pid=7435, boot 3e4f237a-adf1-47c6-af18-9debf7436cd0).

Xác nhận lại cuối lượt (11:42:22Z và 11:43:33Z): boot_id vẫn
3e4f237a, `uptime -s` vẫn 2026-11-13 11:26:40 — **không reboot nào
trong lúc G8 làm việc.**

Lưu ý phương pháp (nhắc lại E7 §4 mục 4): dòng `boot changed`
của probe nhảy thẳng 8c1c5131 → 3e4f237a, **bỏ qua HAI boot trung
gian** (cff65e89 của #29 và 287705ad của #30) — vì không có probe
nào chạy trên hai boot đó. Bước nhảy đơn này KHÔNG được đọc là 1
reboot duy nhất; xem §2.2 để thấy cả hai boot trung gian đều có
bằng chứng độc lập.

## 2. Điều tra khoảng mù kể từ probe #23

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp lúc 11:38–11:43Z)

- Boot hiện tại lúc probe: `uptime -s` = **2026-11-13 11:26:40Z**,
  boot_id `3e4f237a-adf1-47c6-af18-9debf7436cd0` — khác boot của
  probe #23 (8c1c5131).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`** — loop v2 chưa
  từng được start lại kể từ đợt 88.
- `journalctl --list-boots`: chỉ **1 boot** (hiện tại, 3e4f237a,
  first entry 11:26:51Z, last 11:37:22Z lúc kiểm tra). `last -x
  reboot`: chỉ 1 dòng (11:26, still running). wtmp bắt đầu
  11:26:51Z.
- **Không có /var/log/syslog hay kern.log** trên VM này — không còn
  nguồn log hệ thống bền nào khác để đối chiếu. journal/wtmp chỉ
  giữ boot hiện tại, như mọi lần trước.

### 2.2 Ba reboot trong khoảng mù (đã xác nhận — đính chính tiền đề lượt này)

| # | Thời điểm (UTC) | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 29 | **08:56:39Z (chính xác từng giây)** | 8c1c5131 → cff65e89 | F7 đo trực tiếp lúc 08:57:38Z (`uptime -s` + `boot_id`); F9 xác minh độc lập (poller restart 08:57:45Z `uptime_since=2026-11-13 08:56:39`); kẹp hoạt động: bản ghi cuối trước reboot 08:56:38Z (`round104-f4-run-pb.sh`), bản ghi đầu sau reboot 08:56:51Z (F4 `vite-attempt1.log`) — cửa sổ 13 giây. Thư mục F1 `e1-run5-killed-reboot29` xác nhận một run chết đúng lúc này. |
| 30 | **10:54:53Z (chính xác từng giây)** | cff65e89 → 287705ad | **F9 ghi nhận TRỰC TIẾP trong lượt** (không phải suy diễn sau): poller restart 10:55:48Z `uptime_since=2026-11-13 10:54:53`; suites log `D9 verify start 2026-11-13T10:59:20Z boot 287705ad-e05b-4c14-a9f3-899340bd3933` và `ALL DONE 11:03:20Z boot 287705ad-…` (cùng boot); O8 + recounts + LIMITS F9 chạy trên boot này tới 11:13:36Z; F9 verify LIMITS §2 + round104-f9.md cùng ghi 10:54:53Z. Kẹp hoạt động: poll 11 lúc 10:47:46Z (boot cff65e89) → poller restart 10:55:48Z (boot 287705ad). **Đây là reboot mà tiền đề lượt này tưởng là "11:26Z" — sai.** |
| 31 | **11:26:40Z (chính xác từng giây)** | 287705ad → 3e4f237a | `uptime -s` + `boot_id` đo trực tiếp lượt này (11:38:14Z, xác nhận lại 11:42:22Z và 11:43:33Z không đổi); `journalctl --list-boots` (first entry 11:26:51Z); `last -x reboot` (11:26, still running); wtmp bắt đầu 11:26:51Z; dòng `boot changed … (uptime since 2026-11-13 11:26:40)` trong log probe. Kẹp hoạt động: bản ghi cuối trước reboot 11:13:36Z (`round104-f9.md`, boot 287705ad) → spawn đợt 105 11:35:51Z + file đầu đợt 105 11:38:18Z (boot 3e4f237a). |

Khoảng cách #29 → #30 = **1h58'14"**; #30 → #31 = **31'47" —
NGẮN NHẤT từng ghi** (phá sàn cũ 1h11'36" của #23 → #24). Chu kỳ
nay là **31 lần trong ~63h08'30"** (từ ~20:18:10Z 10/11 tới
11:26:40Z 13/11) — trung bình **~2h02'09"/lần** theo cách đếm của
W7/X7 (tổng thời gian / số reboot), nhanh hơn ~2h05' của F7.
Reboot tiếp theo dự kiến **~13:28:49Z** (11:26:40Z + ~2h02') —
dải sàn–trần mới (31'47"–3h14'08") cho phép lệch tới
**11:58:27Z–14:40:48Z**, rất rộng. Mọi probe nền đều chết theo
reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt sau hồi phục
bằng 1 mẫu mới.

Khoảng mù #23 là **khoảng mù thứ 16 liên tiếp (#8–#23) chứa
reboot** — và là mù thứ hai liên tiếp đóng được hoàn toàn (sau #22,
với lưu ý §2.8).

### 2.3 Hoạt động trong khoảng mù — vì sao ĐÓNG ĐƯỢC hoàn toàn

Hoạt động ghi đĩa liên tục 08:39:02Z → 09:21:54Z, rồi watcher +
poller chạy nền tới 10:47:46Z, rồi F9 verify tới 11:13:36Z:

- **08:39–08:56Z (boot 8c1c5131):** F1–F9 đợt 104 làm việc suốt
  (F4 script 08:41:42Z, F2 benchmark 08:43:29Z, F5 script
  08:43:43Z, `preview.tsx` 08:44:33Z, F6 script 08:51:32Z,
  F3 temp config 08:52:22Z); hidden_files 100+ file (F1/F2/F3/
  F4/F5/F6/F7/F8 chạy song song, log Chrome/WebKit liên tục).
- **08:56:51Z–09:21:54Z (boot cff65e89):** hoạt động tiếp tục
  ngay sau #29 (F4 vite 08:56:51Z, F1 run killed-reboot29
  08:57:03Z, F5 probe-error 08:57:50–08:58:24Z, F7 LIMITS
  08:59:55Z, F2 LIMITS 09:01:26Z, F6 LIMITS 09:09:39Z, F5 LIMITS
  09:14:37Z, LIMITS gộp 09:20:43Z, GAP_ANALYSIS 09:20:51Z, F1
  LIMITS 09:21:42Z, build-loop-log 09:21:03Z, round104-f1.md
  09:21:54Z).
- **09:14:54Z–09:52:26Z:** watcher hiram của F5 chạy nền — 50 lần
  check mỗi ~45 s (09:14:54Z → 09:51:41Z), boot=cff65e89 ở cả
  dòng bắt đầu và dòng kết thúc ("NO HIRAM WINDOW in ~37 min
  09:52:26Z boot=cff65e89-…"). Watcher là MỘT tiến trình duy
  nhất: reboot sẽ giết nó, không còn check nào sau đó.
- **08:57:45Z–10:47:46Z:** poller F9 chạy nền — poll mỗi 10 phút
  (09:07:45, 09:17:45, 09:27:45, 09:37:45, 09:47:45, 09:57:45,
  10:07:45, 10:17:46, 10:27:46, 10:37:46, 10:47:46Z), TẤT CẢ đều
  boot=cff65e89, không sót lần nào. Poller là MỘT tiến trình duy
  nhất (`sleep 600` trong vòng lặp — đọc `poll.sh`); reboot sẽ
  giết nó, và F9 phải restart bằng tay (đã xảy ra đúng 2 lần:
  sau #29 lúc 08:57:45Z, sau #30 lúc 10:55:48Z).
- **10:55:48Z–11:13:36Z (boot 287705ad):** poller restart
  10:55:48Z, suites log 10:59:20–11:03:20Z (boot 287705ad đầu–
  cuối), O8 Chromium/WebKit 11:06:08–11:07:51Z, recounts
  11:10:15Z, F9 VERIFY LIMITS 11:13:27Z, round104-f9.md 11:13:36Z.
- **11:35:51Z–11:38:18Z (boot 3e4f237a):** spawn đợt 105
  11:35:51Z; file đầu đợt 105 11:38:18Z (`g1-evidence-v14-104f1.json`,
  G5 log) — sau probe #24 4 giây trước khi mù đóng.
- /tmp: **0 file** có mtime trong mù #23 (cả hai cây repo-1 +
  hidden_files đều có file; /tmp trống — nhất quán với việc
  reboot #30/#31 xóa /tmp, như F7 đã thấy /tmp 764 file trước
  #29; không dùng /tmp làm mốc).

Đếm cửa sổ (đo ~11:40–11:43Z): repo-1 **40 file** (không tính
dist), **297 file** (tính dist); hidden_files **4290 file**
(trong đó chrome-userdata chiếm phần lớn; không tính chrome
**359 file**). Số đếm là ảnh chụp tại thời điểm đo (F7 §5 mục 2)
— mốc hoạt động bền là file nguồn (.md/.ts/.mjs/.log), không
phải output build.

Mù chia làm ba đoạn bởi #29 và #30, cộng đuôi sau #31:

- Đoạn TRƯỚC #29: 08:39:02Z → 08:56:39Z (**17'37"**).
- Đoạn GIỮA #29 → #30: 08:56:39Z → 10:54:53Z (**1h58'14"**).
- Đoạn GIỮA #30 → #31: 10:54:53Z → 11:26:40Z (**31'47"**).
- Đuôi SAU #31: 11:26:40Z → 11:38:22Z (**11'42"**).

**Đoạn trước #29 — LOẠI TRỪ BẰNG SÀN (chắc chắn):** dài 17'37"
< sàn mới 31'47" — bất kỳ reboot trung gian nào cũng đòi cả hai
khoảng cách ≥ sàn, tổng ≥ 2 × sàn > độ dài đoạn. Không tồn tại T.
(Cũng có hoạt động liên tục + poll F9 08:39:17Z và 08:49:18Z cùng
boot 8c1c5131 làm bằng chứng phụ.)

**Đoạn giữa #29 → #30 — LOẠI TRỪ TRỰC TIẾP (chắc chắn, không
dựa vào sàn):** đoạn này dài 1h58'14" > 2 × sàn mới (1h03'34")
nên sàn KHÔNG loại trừ được — nhưng hai tiến trình chạy nền
dài hạn loại trừ được:
- Poller F9 sống suốt 08:57:45Z → 10:47:46Z (12 lần poll liên
  tiếp, cách nhau đúng 10 phút, cùng boot cff65e89). Reboot bất
  kỳ trong khoảng này sẽ giết poller — bằng chứng: chính #29 và
  #30 đều giết poller và F9 phải restart bằng tay. Không có lần
  restart nào giữa 08:57:45Z và 10:55:48Z.
- Watcher hiram F5 sống suốt 09:14:54Z → 09:52:26Z (50 check,
  cách nhau ~45 s, boot cff65e89 đầu–cuối). Reboot trong khoảng
  này sẽ giết watcher — không có check nào sót.
- Hai khoảng trống còn lại trong đoạn đều loại trừ được bằng sàn
  mới: 08:56:39Z–08:57:45Z (66 s; T trong đó đòi #29→T ≥ 31'47"
  — không thể) và 10:47:46Z–10:54:53Z (7'07"; T trong đó đòi
  T→#30 ≥ 31'47" — không thể, tối đa 7'07").

**Đoạn giữa #30 → #31 — LOẠI TRỪ BẰNG SÀN (chắc chắn):** dài
31'47" = đúng sàn mới < 2 × sàn — không tồn tại T. (Cũng có F9
verify hoạt động liên tục trên boot 287705ad 10:55:48Z →
11:13:36Z làm bằng chứng phụ; khoảng trống không-bản-ghi
11:13:36Z → 11:26:40Z dài 13'04" < sàn nên cũng không chứa
được reboot — T trong đó đòi T→#31 ≥ 31'47", tức T ≤ 10:54:53Z,
không thể.)

**Đuôi sau #31 — LOẠI TRỪ TRỰC TIẾP (chắc chắn):** nằm gọn trong
một boot đã xác định — `uptime -s` vẫn 11:26:40Z + boot_id không
đổi lúc probe #24 (11:38:14Z) và xác nhận lại cuối lượt
(11:42:22Z, 11:43:33Z); cộng thêm spawn đợt 105 từ 11:35:51Z
trên boot mới (phương pháp C6 §4 mục 2).

**Kết luận trung thực: khoảng mù #23 ĐÃ ĐÓNG HOÀN TOÀN.** Đúng 3
reboot trong mù (#29, #30, #31), cả ba chốt giờ từng giây. Không
còn lỗ nào chưa loại trừ được.

### 2.4 Bảng khoảng cách liên tiếp đã xác nhận (cập nhật từ F7 §2.4)

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
| #23 20:30:14Z → #24 21:41:50Z | 1h11'36" (sàn cũ) |
| #24 21:41:50Z → #25 23:51:21Z | 2h09'31" |
| #25 23:51:21Z → #26 02:12:10Z | 2h20'49" |
| #26 02:12:10Z → #27 05:26:18Z | **3h14'08" (dài nhất)** |
| #27 05:26:18Z → #28 06:56:44Z | 1h30'26" |
| #28 06:56:44Z → #29 08:56:39Z | 1h59'55" |
| #29 08:56:39Z → #30 10:54:53Z | 1h58'14" |
| #30 10:54:53Z → #31 11:26:40Z | **31'47" (ngắn nhất có giờ chính xác — SÀN MỚI)** |

**Sàn khoảng cách chính xác nay là 31'47" (mới, thay 1h11'36");**
trần vẫn 3h14'08" (không đổi). Hệ quả cho các lượt sau (xem §5
mục 1): lập luận sàn chỉ còn đóng được đoạn < 2 × 31'47" =
**1h03'34"** (trước đây 2h23'12"). Dự báo bằng trung bình cũng
kém tin cậy hơn: F9 dự #31 ~12:59Z (dải 12:06–14:09Z theo sàn–
trần cũ), thực tế 11:26:40Z — sớm hơn 1h32' so với điểm dự báo,
ngoài cả dải dưới.

Lưu ý: kẹp #16 → #17 (~31'–35', không chính xác) nay nằm SÁT
sàn mới 31'47" — nếu kẹp đó là thật thì sàn thực tế có thể còn
thấp hơn đôi chút; nhưng kẹp #16 không có giờ chính xác nên
không dùng làm sàn.

### 2.5 Sóng EPERM trong khoảng mù — tìm trong log sibling đợt 104 + đợt 105 tới lúc này

Khoảng mù 08:39:02Z → 11:38:22Z (2h59'20") được phủ bởi các luồng
sibling đợt 104 (F1–F9, làm việc tới 11:13:36Z) + spawn đợt 105
(11:35:51Z, file đầu 11:38:18Z — trong mù, 4 giây trước khi mù
đóng). Đã đọc lại log thật (grep `sóng EPERM vẫn bật` /
`CẢNH BÁO: chờ sóng` / `Operation not permitted` / `sóng EPERM đã
tắt` trên 339 file *.log có mtime trong mù #23 + grep rộng toàn
bộ cây `hidden_files/round104-*` + `round105-*`):

| Luồng / nguồn | Cửa sổ phủ | Kết quả |
|---|---|---|
| F5 đợt 104 (run-f5.log, probe WebKit load4 r2) | 09:01–09:07Z | 6 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| F9 O8 (round104-f9-o8.log) | 11:06–11:07Z | 2 dòng "sóng EPERM đã tắt" — **dương tính giả đã biết** |
| F9 recounts.log | ~11:10Z | 1 dòng trích lại số đếm "61 dòng" của F7 — **không phải sự kiện** |
| E1–E4, E6–E9 (`docs/PHASE9_ROUND104_*.md` + log) | 08:39–~11:13Z | 0 dòng "vẫn bật", 0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" thật |
| Grep rộng round104-* + round105-* (mọi file) | toàn đợt | "vẫn bật" 1 hit thô, trong `round104-f7/probe-notes.txt` trích lại số đếm "0" của F7 — **0 sự kiện thật**; "Operation not permitted" 2 hit thô, cả 2 trong `round104-f7/probe-notes.txt` + `round104-f7.md` trích lại số đếm "0" của F7 — **0 sự kiện thật** |
| 11:13:36Z → 11:35:51Z | — | **Không có bản ghi nào** (khoảng trống không-bản-ghi 22'15" giữa đóng băng đợt 104 và spawn đợt 105) |

Tổng trong *.log có mtime trong mù #23: **9 dòng "đã tắt"**
(F5 ×6 + F9 O8 ×2 + recounts trích lại ×1) + **0 dòng "vẫn bật",
0 "CẢNH BÁO", 0 "Operation not permitted" thật**.

**Đính chính dương tính giả (nhắc lại bài học Y8 §4 mục 8, áp
dụng cho lượt này):** 8 dòng launcher "sóng EPERM đã tắt, khởi
động vite" trong khoảng mù đều là dòng in khi lần ghi thử ĐẦU
TIÊN thành công ngay (code launcher `waveOff=true` ở lần write
đầu) — in mặc định cả khi không có sóng. Bằng chứng phân biệt:
**0 dòng "sóng EPERM vẫn bật sau …s chờ"** và **0 dòng "CẢNH
BÁO: chờ sóng EPERM 10 phút"** trong toàn bộ cây round104 +
round105 tới lúc này; **0 lần "Operation not permitted" thật**.

Nhận xét trung thực:

- **Không có bằng chứng sóng EPERM trong các bản ghi còn tồn tại**
  của khoảng mù — nhưng đây là kết luận "không thấy", không phải
  "không có". **22'15" giữa đóng băng đợt 104 (11:13:36Z) và
  spawn đợt 105 (11:35:51Z) là mù hoàn toàn về sóng** (đủ dài để
  chứa một sóng ~16 phút mà không để lại dấu vết nào) — tuy
  nhiên, khác mù #21, khoảng trống này **không chứa reboot nào
  ngoài #31 đã chốt giờ** (đoạn #30→#31 đã loại trừ bằng sàn,
  §2.3). Mù #23 "mù" về sóng trong 22'15" nhưng "sáng" về reboot.
- Sóng gần nhất vẫn là **~11:55–12:11Z** (R7) — ~47h27'22" trước
  probe #24 (tính từ cuối sóng 12:11Z 11/11). EPERM vẫn KHÔNG được
  tuyên bố là đã hết.
- Khoảng trống không-bản-ghi 22'15" ngắn hơn nhiều so với đuôi mù
  #22 (1h05'34") và mù #21 (1h45'25") — vì F9 verify làm việc
  tới 11:13:36Z thay vì đóng sớm.

### 2.6 Quét writeFileSync (snapshot 11:41:44–11:42:05Z)

Chạy lại đúng script chuẩn mới của F7 (`scan-wfs.sh`, kế thừa U8
đợt 93 / V6 đợt 94, đã sửa lỗi R7) — chỉ đổi thư mục OUT sang
`round105-g8`:

- Chuẩn mới: **472 dòng / 148 file** (phạm vi 2704 file).
  F7: 455 dòng / 142 file (phạm vi 2690 file).
- R7b (đối chiếu): **497 dòng / 165 file**. F7: 486 / 160.
- Copies: **25 dòng / 17 file** — y hệt F7 và E7.
- Đối chiếu chéo 472+25=497=R7b, **chênh 0 — lần thứ mười một
  liên tiếp**. Không có race giữa lúc scan (0 file hạ cánh trong
  cửa sổ scan 11:41:44–11:42:05Z).
- **+17 dòng / +6 file so với F7, giải thích đúng hết bằng diff
  hit list** (không có dòng nào tăng trong file cũ, không file nào
  giảm):
  - +3 `docs/PHASE9_ROUND104_F7_EPERM_LIMITS.md` (file LIMITS của
    chính F7 — 08:59:55Z, sau snapshot F7 08:41:16Z)
  - +1 `docs/PHASE9_ROUND104_LIMITS.md` (closing, 09:20:43Z)
  - +1 `docs/PHASE9_ROUND104_F9_VERIFY_LIMITS.md` (F9, 11:13:27Z)
  - +6 `apps/web/scripts/probe104f4-frame-parity.mjs` (F4 đợt 104
    — chính là file race của F7: có trong R7B của F7 nhưng vắng
    trong NEWSTD của F7; nay vào cả hai bảng)
  - +1 `apps/web/scripts/probe104f5.mjs` (F5 đợt 104)
  - +5 `apps/web/scripts/probe104f6-frame-parity.mjs` (F6 đợt 104)
  - Tổng: 3+1+1+6+1+5 = **17** ✓, 6 file ✓ (diff R7b: +11 dòng /
    +5 file — đúng vì probe104f4 đã có trong R7B của F7)
- **0 file biến mất** (scope +14 file: 6 file hit trên + 8 file
  không hit — `vite.config.f3-temp.ts`, `webkit_blob_flaky_104f2_2mib.mjs`,
  4 LIMITS đợt 104 (F1/F2/F5/F6), 2 docs đợt 105 (G4 REARM, G5
  G1-DECISION) = 14 ✓; comm hai chiều khớp đúng).
- Hit list **0 đường dẫn release*/build/** trong chuẩn mới
  (các file `apps/desktop/build/bundled-server/...` chỉ có trong
  bảng R7B, không hit — xem §2.7).

### 2.7 Async `.writeFile(` — vẫn đúng 2 vị trí, cả hai trong helper đã biết

Kiểm tra `\.writeFile\(` trong phạm vi quét (files-newstd.bin,
2704 file) — các hit trong file `.md` đều là trích dẫn trong
LIMITS cũ (F7 §2.7 đã liệt kê); **chỉ đúng 2 hit trong code**:

- `apps/web/scripts/eperm-retry.mjs:71` — `await f.writeFile(file, data);`
- `apps/desktop/src/services/epermRetry.js:116` — `await f.writeFile(file, data);`

Cả hai đều nằm trong hàm **`writeFileEpermRetryAsync`** — biến
thể async của helper EPERM-retry (đợt 85 M5). Cả hai file **không
đổi từ 10/11** (mtime 23:53:36Z và 23:56:36Z). Kết luận giữ nguyên
như F7: **2 async call site, cả 2 đều thuộc helper retry đã biết
với cùng hợp đồng EPERM-only + verify byte — không phải write
async stray, không cần hành động.**

Ngoài phạm vi quét (đã prune, ghi để đủ số): bản dist của
`epermRetry.js` + 2 file gradio trong `server/tts/.venv2`
(vendored) chứa cùng mẫu — không tính.

### 2.8 Hệ quả cho mù #22 (F7 đã đóng): sàn mới làm sụp một cột, hoạt động vẫn giữ

F7 đóng mù #22 bằng HAI cột: (a) lập luận sàn — đoạn trước #28
dài 1h16'20" (4580 s) < 2 × sàn cũ (2h23'12"); (b) hoạt động dày
đặc + bản-ghi-cuối chỉ 38 s trước #28. Sàn mới 31'47" phá cột (a):
1h16'20" > 2 × 31'47" = 1h03'34" (3814 s). Cửa sổ hình thức mới
mở là T ∈ [#27 + sàn mới, #28 − sàn mới] = **[06:12:11Z,
06:24:57Z]** (12'46").

Kiểm lại cửa sổ này từ dữ liệu thô trên đĩa (find mtime hai cây,
06:10:00–06:27:00Z): hoạt động **rất dày** — hàng chục file từ
5 luồng E1/E3/E4/E5/E6, khoảng cách giữa hai bản ghi liên tiếp
≤ ~30 s trong toàn cửa sổ (vd E5: probe-log/results các lượt j9,
j10, j12, n6, p1–p8, k1, k9, k7, k11 nối nhau mỗi ~25–30 s;
E1 LIMITS 06:22:01Z, E6 LIMITS 06:26:35Z, repo-1: E2 LIMITS
06:18:00Z, E1 LIMITS 06:22:01Z). Chuỗi probe E5 chạy liên tục
từ 06:10Z tới 06:56:06Z không đứt quãng, không run nào bị giết
giữa chừng (khác hẳn #29, nơi F1 có run `e1-run5-killed-reboot29`).

Đánh giá trung thực:

- Một reboot muốn ẩn trong cửa sổ này phải lọt trọn vào một
  khoảng trống ≤ ~30 s giữa hai bản ghi, đồng thời cả 5 luồng
  driver đang chạy phải hồi phục trong vài giây mà không để lại
  run nào bị giết, không làm lệch nhịp ~25–30 s của chuỗi probe
  E5. Quan sát sau #29 cho thấy bản ghi đầu sau reboot có thể
  nhanh tới ~12 s (F4 vite-attempt1.log 08:56:51Z) — nên về
  nguyên tắc không thể loại trừ tuyệt đối bằng mật độ mtime.
- Nhưng xác suất thực tế là rất thấp: 5 driver độc lập cùng hồi
  phục trong vài giây, 0 run bị giết, nhịp chuỗi không lệch —
  trong khi mọi reboot từng quan sát đều để lại dấu vết rõ
  (run bị giết, poller/watcher chết, khoảng trống phút).
- **Kết luận: mù #22 VẪN ĐÓNG trên bằng chứng hoạt động, nhưng
  mức tin cậy hạ từ "sàn + hoạt động, kín" xuống "chỉ hoạt động,
  cửa sổ lý thuyết ≤30 s còn lại".** G8 KHÔNG tự quyết mở lại
  hay giữ nguyên — parent/user quyết xem có chấp nhận mức này
  hay ghi mù #22 thành "đóng có điều kiện". Dù quyết thế nào,
  đây KHÔNG phải lỗi của F7: sàn 1h11'36" là sàn đúng tại thời
  điểm F7 đo; sàn chỉ đổi vì #31 phá kỷ lục sau đó.

### 2.9 Bác đính chính của G3 về giờ reboot #29 (mới, lượt này)

G3 (đợt 105, LIMITS §1) ghi: "reboot #29 KHÔNG phải 08:56:39Z
như brief — log cuối của F8 08:57:05.772Z, F1 resume 08:58:12Z,
nên reboot xảy ra trong khoảng 08:57:06–08:58:12Z". **Đính chính
này SAI — 08:56:39Z vẫn đúng.** Ba bằng chứng độc lập, trong đó
hai bằng chứng đo trực tiếp thời gian boot của kernel (không suy
diễn từ timestamp log):

1. **F7 đo trực tiếp lúc 08:57:38Z** — `uptime -s` = 08:56:39Z,
   boot_id đã là cff65e89. Thời điểm đo 08:57:38Z NẰM TRONG
   khoảng G3 nêu (08:57:06–08:58:12Z): nếu reboot xảy ra từ
   08:57:06Z trở đi thì `uptime -s` lúc 08:57:38Z phải đọc
   ≥ 08:57:06Z, không thể đọc 08:56:39Z. Mâu thuẫn tuyệt đối.
2. **F9 xác minh độc lập** — poller restart 08:57:45Z ghi
   `uptime_since=2026-11-13 08:56:39` (cũng nằm trong khoảng G3
   nêu, cùng mâu thuẫn).
3. **Kẹp hoạt động 13 giây** (lượt này, §2.2): bản ghi cuối trước
   reboot 08:56:38Z, bản ghi đầu sau reboot 08:56:51Z — cả hai
   đều TRƯỚC khoảng G3 nêu. Các file F4 (vite-attempt1.log
   08:56:51Z), F1 (`e1-run5-run.log.killed-reboot29` 08:57:03Z),
   F3 (08:57:05Z) đều là bản ghi trên boot MỚI cff65e89, viết
   trong khoảng G3 tưởng là "trước reboot".

Lỗi phương pháp của G3: lấy "log cuối của F8" (08:57:05Z — thực
ra là bản ghi TRÊN boot mới, không phải trước reboot) và "F1
resume" (08:58:12Z — thời điểm một tiến trình tự resume, không
phải thời điểm boot) làm hai đầu kẹp reboot. Kẹp đúng phải dùng
`uptime -s`/`boot_id` đo trực tiếp hoặc mốc hoạt động trên cả hai
boot (F7 §5 mục 5 / A8 §4 mục 10). **Giờ #29 giữ nguyên
08:56:39Z; các đếm khoảng cách dùng nó vẫn đúng.** Ghi để parent
bảo G3 sửa lại LIMITS của họ — G8 không sửa file của luồng khác.

## 3. RAM (birefnet: KHÔNG chạy)

5 mẫu MemAvailable trong lượt: **499 / 473 / 497 / 1868 / 1811 MB**
(11:38:14Z, 11:38:22Z, 11:38:27Z, 11:42:05Z, 11:42:22Z). Max
~1,82 GB = **30% ngưỡng guard 6144 MB**. 3 mẫu đầu thấp (~0,5 GB)
vì đợt 105 vừa spawn (11:35:51Z), tải chưa lên; 2 mẫu sau lên
~1,8 GB khi các luồng G1–G5 bắt đầu chạy (loadavg 0,20 lúc
11:38:14Z). Birefnet KHÔNG chạy, đúng quy tắc parent đợt 92 §3
mục 7 (chỉ thử lại khi RAM đổi theo hướng có lợi ĐỦ MỨC; chạm
≥ 6 GB mới thử lại). Birefnet-general vẫn 0 lần chạy thành công
trong gói.

Bối cảnh thêm trong mù #23 (không phải mẫu của lượt này, ghi để
đủ số): watcher hiram F5 đo max **2356708 kB (~2,30 GB = 37%
guard)** lúc 09:17:55Z (check 5, 50 lần check 09:14:54–09:51:41Z,
dải 482–2357 MB); poller F9 đo max **2314 MB** lúc 09:17:45Z.
Max RAM trong toàn mù #23 vẫn dưới 40% guard — không có thời
điểm nào đủ gần ngưỡng để thử lại birefnet. Quan sát thêm ngoài
bộ 5 mẫu: 2655448 kB ≈ 2,59 GB lúc 11:43:33Z (đợt 105 đang lên
tải) — vẫn dưới một nửa guard.

## 4. Ghi chú phương pháp (để các lượt sau không lặp lại sai số cũ)

1. **Sàn khoảng cách có thể THAY ĐỔI — đừng đóng mù vĩnh viễn chỉ
   bằng sàn** (mới, lượt này — bài học từ #31): sàn là giá trị
   quan sát nhỏ nhất *tính tới lúc đo*; một reboot ngắn kỷ lục
   mới (31'47") có thể phá sàn cũ bất cứ lúc nào và làm sụp mọi
   cột sàn của các mù đã đóng. Từ nay: (a) ghi rõ sàn tại thời
   điểm đóng mù; (b) ưu tiên loại trừ trực tiếp bằng tiến trình
   chạy nền dài hạn (poller/watcher) hoặc uptime — bền hơn sàn;
   (c) khi sàn đổi, kiểm tra lại các mù đã đóng bằng sàn cũ có
   đoạn > 2 × sàn mới không (lượt này đã làm cho #22 — xem §2.8).
2. **Tiền đề lượt có thể sai — đối chiếu với log sibling trước khi
   tin** (mới, lượt này): tiền đề ghi "#30 lúc 11:26Z" — sai; F9
   đã ghi #30 lúc 10:54:53Z trong poll.log + suites log + LIMITS.
   G8 phát hiện vì đọc lại poll.log thật thay vì tin tiền đề.
   Các lượt sau: khi tiền đề nêu giờ reboot, đối chiếu ngay với
   poll.log / suites log / LIMITS của luồng verify đợt trước.
3. **Dự báo reboot bằng trung bình kém tin cậy khi có gap ngắn kỷ
   lục** (mới, lượt này): F9 dự #31 ~12:59Z, thực tế 11:26:40Z
   (lệch −1h32', ngoài dải). Dải sàn–trần mới rất rộng
   (11:58:27Z–14:40:48Z cho #32) nên dự báo điểm gần như vô
   nghĩa — ghi cả dải, đừng chỉ ghi điểm.
4. **Poller/watcher chạy nền là bằng chứng loại trừ reboot mạnh
   nhất** (mới, lượt này — tổng quát hóa F7 §5): một tiến trình
   duy nhất sống qua cả đoạn, ghi dấu định kỳ (poller 10 phút,
   watcher 45 s), thì reboot trong đoạn sẽ giết nó và để lại
   khoảng trống không-thể-lấp. Mạnh hơn mật độ mtime của nhiều
   file rời rạc (một reboot có thể lọt vào khoảng trống ~30 s
   giữa hai file — xem §2.8). Các lượt sau nên duy trì ít nhất
   một tiến trình heartbeat dài hạn trong mù (chính là lý do
   cron 10 phút vẫn được đề xuất).
5. **Số đếm find trong cửa sổ là ảnh chụp tại thời điểm đo, không
   phải con số bền** (F7 §5 mục 2, nhắc lại): lượt này đếm
   repo-1 40 file (không dist) / 297 file (có dist),
   hidden_files 4290 file — mốc hoạt động bền là file nguồn
   (.md/.ts/.mjs/.log), không phải output build.
6. **Đếm async `.writeFile(` bằng mẫu `\.writeFile\(` trên đúng
   phạm vi quét, lọc `.md` ra** (F7 §5 mục 3, nhắc lại): lượt này
   vẫn đúng 2 vị trí trong helper retry async đã biết, 0 stray.
7. **Kẹp khoảng trống không-bản-ghi bằng cả hai cây** (A8 §4 mục
   10, nhắc lại): lượt này bản ghi cuối trước #29 khác nhau giữa
   hai cây (hidden_files: 08:56:38Z; repo-1: 08:52:47Z) — lấy mốc
   muộn nhất (08:56:38Z, chỉ 1 s trước #29).
8. **Đừng đếm dòng "sóng EPERM đã tắt" làm bằng chứng sóng (Y8
   §4 mục 8, nhắc lại):** lượt này 9 dòng "đã tắt" trong mù #23
   (F5 ×6 + F9 O8 ×2 + recounts trích lại ×1) đều là dương tính
   giả; 0 dòng "vẫn bật", 0 "Operation not permitted" thật. Đếm
   "đã tắt" trong *.log có mtime trong mù, không đếm hit grep
   rộng cả .md/.txt.

## 5. Ghi chú về log poller F9 (dị thường nhỏ, không ảnh hưởng kết luận)

Trong `poll.log`, dòng `10:55:32Z F9 FREEZE — poller stopped by F9
decision` đứng SAU dòng `F9 poll start 2026-11-13 10:55:48Z` mặc
dù timestamp của nó sớm hơn 16 giây. Giải thích: F9 verify LIMITS
ghi "F9 ĐÓNG BĂNG lúc 10:55:32Z (quyết định...)" — dòng FREEZE
mang timestamp của thời điểm ra quyết định, nhưng được append
vào log sau khi poller đã restart (10:55:48Z). Đây là dị thường
thứ tự ghi log, không phải bằng chứng reboot hay sai giờ: cả hai
mốc đều sau reboot #30 (10:54:53Z) và đều trên boot 287705ad.
Ghi để các lượt sau khỏi ngờ vực khi đọc lại poll.log.

## 6. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #21 CHƯA ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (E7 §5 mục 1):
   lỗ ~17'23" (03:57:19Z–04:14:42Z) có thể chứa đúng 1 reboot trung
   gian. Không còn dữ liệu nào để thu hẹp thêm (journal/wtmp
   volatile, không có /var/log/syslog hay kern.log) — parent/user
   quyết xem có chấp nhận "tối đa 1 reboot ẩn trong lỗ 17'23"" làm
   mức đóng của mù #21 hay để mở như reboot #16. G8 không tự quyết.
2. **Khoảng mù #22 ĐÃ ĐÓNG — NHƯNG MỨC TIN CẬY HẠ (mới, lượt này,
   xem §2.8):** sàn mới 31'47" phá cột sàn của F7; cửa sổ hình
   thức [06:12:11Z, 06:24:57Z] còn lại chỉ được giữ bằng mật độ
   hoạt động (bản ghi cách nhau ≤ ~30 s, chuỗi probe E5 không
   đứt). Parent/user quyết: giữ "đóng", ghi thành "đóng có điều
   kiện", hay mở lại. G8 không tự quyết.
3. **Khoảng mù #23 ĐÃ ĐÓNG HOÀN TOÀN (mới, lượt này)** — đúng 3
   reboot (#29 08:56:39Z, #30 10:54:53Z, #31 11:26:40Z), cả ba
   chốt giờ từng giây. Không còn nợ nào từ mù #23.
4. **EPERM KHÔNG được tuyên bố là đã hết.** Lượt này chỉ có 1 mẫu
   mới (probe #24 OK 2/2) — và 22'15" giữa đóng băng đợt 104 và
   spawn đợt 105 hoàn toàn không có bản ghi về sóng. Sóng gần nhất:
   ~11:55–12:11Z, ~47h27' trước probe #24.
5. **Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết** (P8 §5
   mục 3, LIMITS gộp đợt 88 §3 mục 4, Q8 §5 mục 2, R7 §5 mục 2,
   LIMITS gộp đợt 90 §3 mục 5 + §4 mục 8, LIMITS gộp đợt 91 §3 mục
   8 + §4 mục 8, S7 §5 mục 2, T8 §5 mục 2, U8 §5 mục 2, V6 §5 mục
   2, W7 §5 mục 2, X7 §5 mục 2, Y8 §5 mục 2, Z7 §5 mục 2, A8 §5
   mục 2, B6 §5 mục 2, C6 §5 mục 2, D5 §5 mục 2, E7 §5 mục 3,
   F7 §6 mục 4): lệnh cron chỉ là
   `bash ~/workspace/repo-1/scripts/probe-eperm-v2.sh once`
   (vài giây, không giữ tiến trình nền). G8 KHÔNG tự tạo, KHÔNG
   start loop nền. Bằng chứng mới làm đề xuất này mạnh hơn nữa:
   khoảng mù #23 dài 2h59'20" chứa TỚI 3 reboot — và reboot #30
   (10:54:53Z) chỉ được ghi nhận vì F9 đang chạy poller bằng tay;
   không có observer thường trực nào thì cả #30 lẫn #31 đều chỉ
   được biết sau khi đã xảy ra.
6. **Không append test vào log probe chung.** (nhắc lại R7 §5 mục 3
   và các lượt sau; log tăng đúng 3 dòng checklist, 61 → 64 —
   không thêm dòng lạ mới trong lượt này).
7. **Nguyên nhân chết probe v1 (5 lần đầu) vẫn chưa chứng minh tuyệt
   đối** (giả thuyết GC mạnh nhất, reboot trung gian không loại trừ
   được — journal/wtmp volatile, chỉ giữ 1 boot). Probe v2 bền với
   cả hai giả thuyết, nhưng không tự chứng minh được giả thuyết nào.
8. **VM reboot ~2h02'/lần** (31 lần/~63h08'30"): mọi probe nền đều
   chết theo reboot; v2 chỉ đảm bảo cái chết được ghi nhận + lượt
   sau hồi phục. Reboot tiếp theo dự kiến **~13:28:49Z** (dải
   11:58:27Z–14:40:48Z — rất rộng sau khi sàn đổi); lúc 11:43:33Z
   máy vẫn trên boot 3e4f237a (#31). Dải khoảng cách quan sát nay là
   **31'47"–3h14'08"** (sàn mới).
9. **Birefnet: KHÔNG chạy trong lượt này** — RAM 5 mẫu MemAvailable
   **499 / 473 / 497 / 1868 / 1811 MB** (max ~1,82 GB = 30%
   ngưỡng guard 6144 MB). Max RAM trong mù #23 là 2356708 kB
   (~2,30 GB = 37% guard, watcher hiram 09:17:55Z) — vẫn dưới một
   nửa guard. Ghi rõ để parent quyết: nếu RAM khả dụng chạm ≥ 6 GB
   thì mới thử lại. Birefnet-general vẫn 0 lần chạy thành công
   trong gói.
10. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
11. Không thêm i18n key (không đụng UI/chuỗi hiển thị).
12. **Reboot #16 — VẪN MỞ, chờ parent/user quyết** (không tự đóng):
    kẹp giữ nguyên **07:26:03Z → ~07:30:00Z (~4')**; C6 đã thử hết
    mọi nguồn mới còn có thể thử (§2.5 của C6) và không nguồn nào
    cho thêm giây nào. Đề xuất của C6 vẫn đứng: đóng nợ này ở mức
    kẹp ~4 phút thay vì để mở vô hạn chờ dữ liệu không còn tồn tại.
    G8 không thử lại nguồn nào, theo đúng lệnh.
13. **Khoảng mù #24 bắt đầu từ 11:38:22Z** (probe #24) — lượt sau
    (probe #25) đối chiếu từ mốc này. Reboot tiếp theo dự kiến
    ~13:28:49Z (dải 11:58:27Z–14:40:48Z).
14. **Đính chính tiền đề lượt này (ghi để parent sửa hồ sơ):**
    tiền đề ghi "reboot #30 (11:26Z, boot hiện tại)" — **sai số
    thứ tự**: 11:26:40Z là **#31** (287705ad → 3e4f237a); **#30 là
    10:54:53Z** (cff65e89 → 287705ad), đã được F9 ghi nhận trực
    tiếp trong lượt. Mọi đếm reboot từ đây trở đi phải dùng #31
    làm mốc mới nhất (tổng 31 lần, chu kỳ ~2h02'/lần).

## 7. File của đợt (stage, KHÔNG push)

Mới:
- `docs/PHASE9_ROUND105_G8_EPERM_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round105-g8-eperm.txt`
(NUL-delimited, 1 entry; verify bằng cách đọc lại với splitter
NUL: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round105-g8.md`
(log luồng); scratch trong `hidden_files/round105-g8/` (scan-wfs.sh,
scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
wfs-r7b.txt, files-copies.txt, wfs-copies.txt, probe-notes.txt);
log probe v2 append-only
`~/workspace/goals/capcut-clone-video-editor/hidden_files/eperm-probe-v2.log`
+ heartbeat `../eperm-probe-v2.heartbeat` (sống qua các lượt, KHÔNG stage).

Tổng chờ push sau khi stage G8 (đợt 67–105, đếm lại từ đĩa):
**381 file batch / 2479 entry / 1512 file duy nhất** (trước G8:
380 file / 2478 entry / 1511 file — G3/G4/G5 đã stage trước;
đợt 67–104 giữ nguyên 377 / 2473 / 1506 như F9). HEAD vẫn 5f548ef8.

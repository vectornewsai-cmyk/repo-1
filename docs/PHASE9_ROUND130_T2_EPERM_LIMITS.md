# PHASE9 ROUND130 T2 — EPERM: probe #49 ok=2 fail=0 + mù #49 (A ĐÓNG, B MỞ, C ĐÓNG) + gap #75→#76 CHỨNG NHẬN DẠNG KHOẢNG + CERT n=42 / FULL n=57

> Luồng T2, đợt 130 vòng lặp Phase 9 VCut Studio (lượt cron 18:35 +07,
> 17/11/2026; làm việc 11:37Z → 11:46Z 17/11/2026).
> Nhiệm vụ: probe #49 theo lịch thường lệ + mù #49 MỚI MỞ từ probe #48 —
> điều tra đoạn từ #75 (hai reboot trong mù: #76 btime 09:02:12Z đã biết
> từ T8-129, #77 btime 10:56:31Z mới phát hiện lúc mở đợt 130).
> Prereg viết TRƯỚC khi đo:
> hidden_files/round130-t2/prereg-t2.md. **Dự báo ĐOẠN A/B/C ĐÚNG HẾT**
> (A đóng, B mở, C đóng bằng uptime); **ĐIỀU KIỆN CHỨNG NHẬN GAP TRONG
> PREREG ĐƯỢC GHI ĐÈ BỞI TIỀN LỆ (xem §4 mục 1):** prereg §2 tự đặt
> điều kiện chặt "chỉ chứng nhận #75→#76 nếu F76 đo được" — thực tế
> F76 KHÔNG đo được, nhưng tiền lệ đã được parent chấp nhận ở đợt 128
> (gap #72→#73 chứng nhận dạng khoảng trong khi F73 cũng chưa từng đo)
> cho phép chứng nhận với biên ±10 s của T5 + caveat ghi rõ. Gap
> #75→#76 ĐƯỢC CHỨNG NHẬN dạng khoảng theo tiền lệ đó; việc ghi đè
> điều kiện prereg được ghi công khai ở đây, không sửa prereg sau khi
> thấy số.
> KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow,
> KHÔNG đụng TTS 39. **TUYỆT ĐỐI KHÔNG kiểm lại mù #47 (ĐÃ ĐÓNG HOÀN
> TOÀN đợt 128) / mù #46 đoạn A / mù #45 đoạn G1 / mù #44 đoạn D /
> mù #40 đoạn B / mù #43 / mù #42 đoạn B** (quyết parent đợt 124 §12.3
> + §12.4, đợt 125 §12(h), đợt 126 §12(h), đợt 127 §12(c)). G1 + mù
> #22/#28/#29/#30/#31/#35/#37/#38 đoạn G chờ user quyết.

## 0. Kết quả headline

- **Checklist P8 §2.3 đã chạy ĐÚNG 1 lần (11:38:21Z):** `status` báo
  **DEAD/STALE** (heartbeat age 10.706 s, last #48 08:39:55Z, boot
  475406f6, exit 1); `once` ngay sau đó là **probe #49, boot
  86538084, ok=2 fail=0**, exit 0, 11:38:21Z; `status` chạy lại
  **ALIVE** (age 1 s, n=49), exit 0. Log v2 tăng đúng **3 dòng**
  (136 → 139) — **như mọi lượt trước**; prereg §1 đã dự báo đúng +3
  trước khi đo. Heartbeat nay n=49, ts 11:38:21Z, boot 86538084.
- **Boot #77 (tạm) lúc 10:56:31Z, boot
  `86538084-410e-41d4-a4bf-e68574dc2d91`** — xác minh bằng `uptime -s`
  + btime 1794912991 + `who -b` + journal 1 boot (xem §1). Clock VM
  hiện tại CHÍNH XÁC so với UTC thật (HTTP `Date` cả 3 server khớp
  +1,0 s: example.com, google.com, cloudflare.com) → **F77 ≈ 0
  (±~2 s)**.
- **#76 tới TRONG dải cơ học từ #75** [07:45:55Z, 09:57:45Z] (p10–p90
  FULL56); #76 thật 09:02:12Z — **lần thứ sáu liên tiếp trong dải**.
  **#77 tới TRONG dải cơ học từ #76** [09:34:36Z, 11:46:26Z]; #77 thật
  10:56:31Z — **lần thứ bảy liên tiếp trong dải**.
- **Khoảng mù #49 (MỚI): 08:39:55Z → 11:38:21Z 17/11 (2h58'26") —
  KHÔNG ĐÓNG HOÀN TOÀN (A đóng, B mở, C đóng).** Đoạn A **ĐÓNG**
  (135 mốc, lỗ lớn nhất 128 s, đuôi 31 s, 2 session bắc qua A-lo,
  đuôi A dày đặc ở cả 4 phạm vi); đoạn B **MỞ** (lỗ lớn nhất gộp 4
  phạm vi 2.252 s — giữa file đóng đợt 129 lúc 10:04:23Z và snapshot
  proactivity 10:41:55Z — vẫn > sàn 1.147 s; đuôi gộp chỉ 876 s);
  đoạn C **ĐÓNG** (uptime trực tiếp lúc probe #49 + dấu boot tươi).
  **2 reboot đã chốt trong mù (#76 09:02:12Z + #77 10:56:31Z — chính
  xác từng giây trên đĩa) + tối đa 1 ẩn** (gộp 4 phạm vi; 2 nếu chỉ
  tính hai cây — xem §2.3).
- **Gap #75→#76 = [6.511 s, 6.531 s] (mid 6.521 s) CHỨNG NHẬN DẠNG
  KHOẢNG (mới)** — đoạn A mù #49 đóng; biên ±10 s của T5, F76 chưa
  đo trực tiếp + caveat lệch đồng hồ cũ ~33 s tại #76 (xem §2.2 +
  §2.5 + §4 mục 1). **CERT n=41 → n=42 / FULL n=56 → n=57.**
- **Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
  #49 mở (xem §2.3 + §2.5). **CERT/FULL không tính gap này.**
- **Replay #77 MỚI BẮT ĐẦU, CHƯA CÓ HÌNH DẠNG (mới, xem §2.1):**
  dpkg.log **2 dòng, 11:35:39–11:35:40Z** ("startup packages
  configure"), chưa đóng băng lúc kiểm 11:46:02Z (im ~382 s),
  chưa có /var/log/apt — T5 là chủ quản replay, T2 chỉ ghi bracket.
- **Không tìm thấy bằng chứng sóng EPERM thật** — 0 dòng "vẫn bật",
  0 "CẢNH BÁO 10 phút", 0 "Operation not permitted" trong 109 file
  *.log có mtime trong mù #49 (0 file repo-1, 109 file hidden_files);
  2 dòng "sóng EPERM đã tắt" đều là **dương tính giả launcher đã
  biết** (T10-O8 đợt 129). Quét mở rộng: **11 match thô / 8 dòng
  duy nhất — phân loại hết** (6 dòng test-pass hasEperm + 2 dòng
  launcher trên; 3 match thô thừa là trùng lặp — mỗi dòng test-pass
  xuất hiện 2 lần trong log suite). Sóng gần nhất vẫn là
  **~11:55–12:11Z 11/11** (R7) — **~143h43'** trước probe #49. EPERM
  vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 36: 871 dòng / 244 file** (phạm vi 3.064
  file); R7b đối chiếu 896 dòng / 261 file; copies 25 dòng / 17
  file — y hệt lần 35 về copies. Đối chiếu chéo 871+25=896=R7b,
  **chênh 0 — lần thứ ba mươi sáu liên tiếp**. +8 dòng / +2 file so
  với lần 35, giải thích đúng hết bằng diff (xem §2.7). Async
  `.writeFile(`: vẫn đúng **2 vị trí helper đã biết** — 0 stray;
  mtime không đổi từ 10/11.
- RAM: max biết được trong mù #49 **2.749 MB** (T4 poll, 08:58:19Z,
  đoạn A) = **45% ngưỡng guard**; đoạn B max **1.469 MB**; đoạn C
  max **966 MB** (T4 gate0, 11:38:19Z). **Birefnet KHÔNG chạy, vẫn
  0 lần chạy thành công trong gói** — 2.749 MB vẫn dưới guard 6 GB;
  quyết parent §12.7 vẫn đứng (chỉ thử lại khi quan sát được
  available ≥ 6 GB).
- **preview.tsx ĐÃ ĐỔI trong đợt 130 (không phải do T2):** md5
  03bf029f → 805409f0, mtime 11:40:32Z — công việc của luồng khác
  đợt 130 (T5 instrumentation (c2), parent đã phê duyệt đợt 129
  §12.3(a)); media.ts KHÔNG ĐỔI 2c384ed1. T2 không sửa production
  file nào.
- **Đợt 130 lúc T2 đóng (~11:46Z):** T1/T3/T6/T7/T9 đã có cờ .done
  trên đĩa; T4/T5/T8 đang chạy; boot vẫn #77 (kiểm 11:46:02Z).
  Hạn cứng đóng đợt 14:35Z 17/11 (theo brief T2). T2 KHÔNG mở Xvfb
  (không cần) nên không có gì để kill — luật đứng đợt 127 §12.1.3
  không phát sinh việc.

## 1. Checklist P8 §2.3 cho lượt này (số thật — từ log + probe-notes)

| Lệnh | Thời điểm (UTC) | Kết quả |
|---|---|---|
| Xác minh boot độc lập (trước `once`) | 11:37:47Z | boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`; `who -b` Nov 17 10:56; `uptime -s` **2026-11-17 10:56:31**; btime **1794912991 = 2026-11-17T10:56:31Z**; journal chỉ 1 boot (86538084, first entry 10:56:42Z, last 11:36:51Z lúc kiểm tra). (Không chạy `last -x reboot` / `ps` systemd lượt này — journal 1 boot + uptime + btime + who -b là đủ 4 nguồn độc lập; wtmp của boot #76 đã mất theo reboot #77, như mọi lần trước.) |
| `bash scripts/probe-eperm-v2.sh status` | 11:38:21Z | **DEAD/STALE**, heartbeat n=48, ts 08:39:55Z, boot 475406f6, age **10.706 s** (đúng 2h58'26"); last sample probe #48; last start duy nhất 08:49:50Z 11/11; `=== probe end`: none; exit **1** (lấy từ `$?` trực tiếp) |
| `bash scripts/probe-eperm-v2.sh once` | 11:38:21Z | **probe #49, boot=86538084, ok=2 fail=0**, exit 0; dòng `boot changed 475406f6 -> 86538084` (uptime since 2026-11-17 10:56:31) |
| `bash scripts/probe-eperm-v2.sh status` (chạy lại) | 11:38:21Z | **ALIVE**, age 1 s, n=49, exit 0 |

Kiểm lại từ đĩa: log probe v2 **139 dòng** — 136 sau T2-129 +
đúng 3 dòng checklist này (dòng DEAD mới cho heartbeat #48 +
dòng `boot changed` + dòng probe #49). **Như mọi lượt trước
(+3):** lượt này chưa có dòng DEAD nào cho heartbeat #48 nên
`status` ghi thêm đúng 1 dòng DEAD. Prereg §1 đã dự báo đúng +3
trước khi đo. Heartbeat **n=49, ts 2026-11-17T11:38:21Z, boot
86538084-…**; log vẫn chỉ có **ĐÚNG 1 dòng `probe start`**
(08:49:50Z 11/11) và **0 dòng `=== probe end`** — loop v2 chưa
từng được start lại kể từ đợt 88. (Các dòng chứa chuỗi "probe end"
đều là dòng `probe DEAD detected ... no probe end since last start`
— kiểm bằng pattern chính xác `=== probe end` mới cho 0.)

**Phương pháp exit code:** cả 3 lệnh checklist đều ghi output ra
file riêng (status1.txt, once.txt, status2.txt) rồi đọc `$?` trực
tiếp, KHÔNG qua `| tee` — số exit trên là exit thật của script.

Nguồn độc lập cho boot #77: 1 session T2 trong vùng C (birth
11:38:21Z — chính phiên probe này) + 35 mốc mtime trong vùng C
(mốc đầu 11:36:13Z — luồng đợt 130 mở; mốc cuối 11:38:19Z — file
của luồng đợt 130) + 20 mốc gộp 4 phạm vi. **Số thứ tự TẠM THỜI**
(như #69/#70/#71/#72/#73/#74/#75/#76).

Lưu ý: file `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
— không phải checklist P8 §2.3, như các đợt trước đã đính chính.

## 2. Điều tra khoảng mù #49 (08:39:55Z → 11:38:21Z 17/11, 2h58'26")

### 2.1 Dữ kiện (đọc lại log thật + uptime/journal/wtmp)

- Boot lúc probe #49: `uptime -s` = **2026-11-17 10:56:31Z**,
  boot_id `86538084-410e-41d4-a4bf-e68574dc2d91` — khác boot của
  probe #48 (475406f6).
- Log v2 vẫn chỉ có **ĐÚNG 1 dòng `probe start`** (08:49:50Z
  11/11, pid=13674) và **0 dòng `=== probe end`**.
- `journalctl --list-boots` (11:37:47Z): chỉ **1 boot**
  (86538084, first entry 10:56:42Z, last 11:36:51Z). Journal/wtmp
  của boot 88f62ae6 đã mất theo reboot #77 — như mọi lần trước,
  chỉ giữ boot hiện tại.
- **dpkg.log boot #77 — bracket replay ghi ngay trong lượt (bài học
  T7-125 §4 mục 4: kiểm boot trước MỖI lần đọc /var/log).** Lúc
  11:38:38Z file có **2 dòng**, 11:35:39–11:35:40Z ("startup packages
  configure") — **MỚI BẮT ĐẦU, CHƯA CÓ HÌNH DẠNG**. Kiểm lại
  11:46:02Z vẫn 2 dòng, cùng bracket — **chưa đóng băng, im ~382 s**;
  chưa có /var/log/apt. Replay #77 khởi động +39'08" sau boot (máy
  yên 10:56–11:35Z sau khi đợt 129 đóng, lượt cron 18:35 +07 mở đợt
  130 lúc 11:35Z — replay khởi động đúng lúc lượt mở, như #75 khởi
  động muộn +1h22'12" đợt 129). Chỉ ghi bracket, T5 là chủ quản
  replay. T5 poll 1 lúc 11:38:18Z cũng ghi dpkg=2 installs=0
  frozen=no silent_s=159 — khớp.
- **dpkg.log của boot #76 đã MẤT** (file hiện tại chỉ còn bracket
  #77): /var/log reset mỗi boot. Bản ghi T5-129/T8-129 (replay #76
  dạng (B), 109 installs, `--repair` 1 lần thành công, cờ
  POSTBOOT_PASS mới 09:32:15Z) là bằng chứng duy nhất còn lại cho
  bracket #76 — cùng mẫu như journal/wtmp.
- **Không có /var/log/syslog hay kern.log** trên VM này (kiểm lại
  đợt 123). `btmp` cũng chỉ bắt đầu 10:56:42Z (boot hiện tại).

### 2.2 Reboot đã chốt trong mù — #76 (mới, đã biết từ T8-129) + #77 (mới) — và cận nhảy clock

| # | Thời điểm | Boot | Nguồn xác nhận / ghi nhận |
|---|---|---|---|
| 76 | **09:02:12Z** (chính xác từng giây) | 475406f6 → 88f62ae6 | Chốt từ T8-129/T5-129 (kernel btime 1794906132; journal first entry 09:02:29Z; `stat /proc/1` 09:02:28Z, +16 s); T2 lượt này xác nhận gián tiếp: probe #49 boot 86538084 khác 475406f6, và mọi quan sát đoạn B đều mang dấu boot #76 (5 exec-log nhắc 88f62ae6). **Số thứ tự TẠM THỜI.** |
| 77 | **10:56:31Z** (chính xác từng giây) | 88f62ae6 → 86538084 | Chốt từ lượt này: `uptime -s` đọc tươi (11:37:47Z + kiểm lại 11:46:02Z) + btime 1794912991 + `who -b` 10:56 + boot_id 86538084 + journal first entry 10:56:42Z + probe #49 11:38:21Z boot 86538084 ok=2 fail=0 + 1 session trong vùng C. **Số thứ tự TẠM THỜI.** |

**Clock:** F77 ≈ 0 (±~2 s) — đo chặt lượt này: `date -u`
11:38:38Z trước, rồi HTTP `Date` cả 3 server đều khớp **+1,0 s**
(example.com, google.com, cloudflare.com — server hơn local đúng
1,0 s cả ba; local epoch đọc ngay sau mỗi lần fetch nên độ lệch
thật ~+0–1 s). **F77 là lần đo trực tiếp đầu tiên trên boot #77**
— không dùng cận hai lần đo. F75 ≈ 0 (±~2 s, đã kiểm 08:39Z đợt
129, 2/3 nguồn). **F76 CHƯA ĐO** (T5-129 không đo HTTP Date trên
boot #76 — đã kiểm bằng grep trong T5-129 doc; xem §2.5 + §4
mục 1).

**CẬN NHẢY CLOCK TẠI #76 VÀ #77 — 0 nhân chứng nhảy ở cả hai:**
- **0 nhân chứng nhảy tại #76:** **0 session** sinh trước
  09:02:12Z có mtime sau 09:02:12Z (quét 274 exec-log). Quan sát
  cũ-clock muộn nhất trước #76: session mtime 09:01:51Z — cách
  btime 21 s nên chỉ cho cận lỏng |X76| < 21 s; cận chặt tới từ
  đo F75/F77 trực tiếp.
- **0 nhân chứng nhảy tại #77:** **0 session** sinh trước
  10:56:31Z có mtime sau 10:56:31Z. Quan sát cũ-clock muộn nhất
  trước #77: session mtime 09:58:53Z — cách btime tới 3.458 s nên
  chỉ cho cận lỏng |X77| < 3.458 s (máy yên, cận lỏng là đúng bản
  chất); F77 đo trực tiếp (±~2 s) là bằng chứng chính.
- **Lệch đồng hồ cũ ~33 s tại #76 (suy luận, KHÔNG phải đo trực
  tiếp — T8-129 §2):** dòng log harness cuối 09:02:45.924Z trên
  đồng hồ cũ (#75) trong khi btime #76 là 09:02:12Z — đồng hồ cũ
  chạy nhanh hơn đồng hồ mới ~33 s tại thời điểm reboot. Hệ quả:
  mtime ghi muộn trong đoạn A (đồng hồ cũ) có thể đọc sớm hơn RTC
  tới ~33 s; file ghi trước reboot có thể mang mtime SAU btime #76
  (tới ~09:02:45Z) và bị gán nhầm sang đoạn B khi đọc thô theo
  đồng hồ (xem §2.4). Lệch này KHÔNG làm đổi gap danh nghĩa tính
  từ btime (btime lấy từ RTC lúc boot, không chịu drift của đồng
  hồ khách trong lúc chạy) và KHÔNG đổi verdict đoạn A (đuôi 31 s
  cộng thêm 33 s vẫn << sàn 1.147 s). Ghi rõ để luồng sau khỏi
  tưởng phải áp cận hai lần đo hay sửa gap.

**Các khoảng (hiệu số đồng hồ VM, chưa hiệu chỉnh bước nhảy nếu có):**
- Gap #75→#76 = **6.521 s (1h48'41")** — **CHỨNG NHẬN DẠNG KHOẢNG
  [6.511 s, 6.531 s]** (đoạn A mù #49 đóng, xem §2.3 + §2.5).
- Gap #76→#77 = **6.859 s (1h54'19")** — **VẪN CHỈ LÀ SPAN**
  (đoạn B mù #49 mở, xem §2.3 + §2.5).
- **Dải cơ học (áp sàn/dải chứng nhận, không phải dự báo):**
  #76 từ #75 dự kiến [07:45:55Z, 09:57:45Z] (p10–p90 FULL56); thực
  tế **#76 09:02:12Z NẰM TRONG dải** (lần thứ sáu liên tiếp trong
  dải). #77 từ #76 dự kiến [09:34:36Z, 11:46:26Z]; thực tế **#77
  10:56:31Z NẰM TRONG dải** (lần thứ bảy liên tiếp trong dải).
- Dải cơ học cho #78 từ #77 (p10–p90 FULL57): [11:29:01Z,
  13:37:19Z]; hiệu dụng sau probe #49: [11:38:21Z, 13:37:19Z].
  Cận dưới p10 11:29:01Z đã qua lúc T2 viết LIMITS (~11:46Z) mà
  vẫn boot #77 — dải là cơ học, không phải dự báo nên không có
  gì sai; #78 vẫn có thể tới bất kỳ lúc nào trong dải.
- **#70 tới sớm hơn cả cận dưới p10 (đợt 125):** dải từ #69 là
  [21:11:16Z, 23:29:41Z]; #70 thật 20:54:19Z — ghi nhận đợt 125,
  không đổi lượt này.

**Reboot #76 + #77 — CHỈ GHI NHẬN giờ + bracket replay:**
- #76 xảy ra GIỮA LUỘT đợt 129 (lần đầu tiên reboot rơi giữa lượt
  — T8-129; T4 xong trước reboot 31 giây nên lượt yên #7 giữ
  nguyên; T8 chạy lại harness 3/3 trên #76 sau cờ POSTBOOT_PASS
  mới 09:32:15Z).
- #77 xảy ra SAU khi đợt 129 đóng (T10 đóng 10:02:05Z trên boot
  #76; đợt 130 mở trên boot #77 — lượt cron 18:35 +07 dispatch
  11:35:51Z, replay #77 đang bắt đầu lúc đó). Đây là reboot thứ 5
  liên tiếp rơi vào khoảng giữa đợt đóng và lượt mở (#71→#72 lúc
  mở đợt 127, #72→#73 giữa đợt 127, #73→#74 giữa đợt 127 đóng và
  lượt 128 mở, #74→#75 giữa đợt 128 đóng và lượt 129 mở, #76→#77
  giữa đợt 129 đóng và lượt 130 mở) — mẫu lặp lại đã ghi ở LIMITS
  gộp đợt 127 §12.1 mục 4 + đợt 128 §12.1 mục 4 + đợt 129.
- **Số thứ tự TẠM THỜI** (như #69/#70/#71/#72/#73/#74/#75/#76).
- Tuổi thọ boot #75: 07:13:31Z → 09:02:12Z = **1h48'41"** (chết
  trong khung (09:01:51Z, 09:02:12Z] theo quan sát cuối — session
  mtime 09:01:51Z; xem §2.3). Tuổi thọ boot #76: 09:02:12Z →
  10:56:31Z = **1h54'19"** (chết trong khung (10:41:55Z, 10:56:31Z]
  theo quan sát cuối — snapshot proactivity 10:41:55Z; xem §2.3).
  Tuổi thọ boot gần đây cập nhật: #74? 2h18'27", #75? 1h48'41",
  #76? 1h54'19" (chưa kẹp hẹp hơn — journal/wtmp chỉ giữ boot
  hiện tại).

### 2.3 Hoạt động trong khoảng mù — vì sao A đóng, B mở, C đóng

Hoạt động ghi đĩa trong hai cây giám sát: repo-1 **12 file** +
hidden_files **361 file**; **373 file, 367 mốc float phân biệt /
226 mốc giây phân biệt** (theo cách đếm L9 §6.1/M4 §4 mục 14/N6
§4 mục 20/P6 §4 mục 20/Q6 §4 mục 20/R7 §4 mục 20/S7 §2.3/T7 §2.3/
T6 đợt 118 §2.3/T6 đợt 119 §2.3/T5 §2.3/T4 §2.3/T7-122 §2.3/T7-123
§2.3/T7-124 §2.3/T7-125 §2.3/T7-126 §2.3/T4-127 §2.3/T2-128 §2.3/
T2-129 §2.3 — "mốc" là mtime float phân biệt, không phải giây tròn;
lần này giây (226) < float (367) vì nhiều file chia sẻ cùng giây
nhưng khác phần lẻ giây — ghi cả hai số, không ép bằng nhau).
Ngoài hai cây: **40 file** (agents — exec-log/tool-output chiếm đa
số + stage files + proactivity + system; chi tiết xem
blind49-outside.txt); **/tmp: 1 file** trong mù #49 (xem
blind49-tmp.txt — 11:35:57Z, đoạn C, file tool-output của lượt
130). Gộp cả 4 phạm vi: **245 mốc giây phân biệt**. Chia mù làm ba
đoạn bởi #76 (09:02:12Z) và #77 (10:56:31Z):

- **Đoạn A: 08:39:55Z → 09:02:12Z (22'17" = 1.337 s, boot #75
  475406f6) — ĐÓNG (mọi lỗ << sàn):**
  - **135 mốc** (hai cây), lỗ lớn nhất **128 s** (08:59:07Z →
    09:01:16Z), các lỗ còn lại đều < 128 s — thân đoạn A dày đặc.
    Mốc đầu 08:39:55Z (head 0 s — chính probe #48); mốc cuối
    **09:01:41Z** (đuôi **31 s** < sàn 1.147 s).
    **10 session** chạm đoạn A (9 chạm đuôi A).
  - Cửa sổ sàn RỖNG: A-lo=08:59:02Z > A-hi=08:43:05Z vì đoạn A
    (1.337 s) ngắn hơn 2×sàn (2.294 s) — việc đóng dựa vào luật
    mọi-lỗ-<-sàn, đúng tiền lệ đoạn A mù #47 (1.396 s, T2-128).
  - **2 session bắc qua cắt A-lo (08:59:02Z)** (birth 08:55:21Z
    mtime 08:59:20Z; birth 08:44:09Z mtime 08:59:07Z).
    **0 session bắc qua cắt A-hi (08:43:05Z)** — và cũng không
    cần: điều kiện đóng là mọi lỗ < sàn, cùng luật đã dùng cho
    đoạn A mù #47.
  - Đuôi A (08:43:05Z, 09:02:12Z] DÀY ĐẶC ở cả 4 phạm vi: repo-1
    **5**, hidden_files **79**, ngoài cây **14**, /tmp **0**
    (xem blind49-sessions.log). 9 session chạm đuôi A.
  - Quan sát cuối đoạn A: cờ round129-t4.done (09:01:41Z) — file
    đóng lượt yên #7; trước đó stage file T4-quiet7 09:01:41Z,
    session exec-log 09:01:51Z (mtime, xem §2.2 — session cho
    quan sát muộn nhất 09:01:51Z, sau mốc hai-cây cuối 10 s).
    Sau 09:01:51Z máy yên tới reboot #76 (đuôi 21 s theo session,
    31 s theo hai cây — cả hai << sàn).
  - **Kết luận đoạn A: ĐÓNG — tối đa 0 ẩn** (lỗ lớn nhất 128 s <
    sàn; gộp 4 phạm vi lỗ lớn nhất chỉ 116 s, xem §2.4).
- **Đoạn B: 09:02:12Z → 10:56:31Z (1h54'19" = 6.859 s, boot #76
  88f62ae6) — MỞ (lỗ lớn nhất 2.252 s > sàn):**
  - **197 mốc** (hai cây), lỗ lớn nhất hai cây **3.127 s**
    (10:04:23Z → 10:56:31Z — chính là đuôi B); lỗ lớn thứ hai
    trong hai cây nhỏ hơn nhiều (xem merged §2.4).
    Mốc đầu 09:02:34Z (head 22 s — file T3 dryrun, mơ hồ
    trước/sau reboot, xem §2.4); mốc cuối **10:04:23Z** (đuôi
    hai cây **3.127 s** > sàn 1.147 s). **6 session** chạm đoạn B,
    **0 session** chạm đuôi B.
  - Cửa sổ sàn [B-lo=09:21:19Z, B-hi=10:37:24Z] có mốc dày đặc
    (đợt 129 chạy tới 10:02:05Z — T8 harness 09:35–09:45Z, T10
    đóng 09:48–10:02Z, LIMITS gộp 129 10:04:23Z).
  - **2 session bắc qua cắt B-lo (09:21:19Z)** (birth 09:08:59Z
    mtime 09:36:58Z; birth 09:10:30Z mtime 09:32:46Z).
    **0 session bắc qua cắt B-hi (10:37:24Z)** — và cũng không
    cần: điều kiện mở là đuôi/lỗ (2.252 s > sàn 1.147 s).
  - Đuôi B (10:37:24Z, 10:56:31Z] KHÔNG TRỐNG ở ngoài cây:
    **6 file proactivity 10:41:55Z** (xem §2.4) — nhưng lỗ TRƯỚC
    đó (10:04:23Z → 10:41:55Z = **2.252 s**) vẫn > sàn. Repo-1
    **0**, hidden_files **0**, /tmp **0** trong đuôi B; ngoài cây
    **6** (đều 10:41:55Z). 0 session chạm đuôi B.
  - Quan sát cuối đoạn B: snapshot proactivity 10:41:55Z (ngoài
    cây); quan sát cuối trong hai cây: LIMITS gộp đợt 129
    (10:04:23Z) — file đóng đợt; trước đó stage file closing
    10:02:02Z, session exec-log 09:58:53Z. Sau 10:41:55Z máy yên
    tới reboot #77 (đuôi gộp 876 s < sàn — nhưng lỗ 2.252 s
    trước đó đã mở đoạn).
  - **Kết luận đoạn B: MỞ — tối đa 1 ẩn** (gộp 4 phạm vi:
    floor(2.252/1.147) = 1; chỉ tính hai cây thì tối đa 2 —
    floor(3.127/1.147) = 2 — ghi cả hai, lấy số gộp làm headline
    vì nó dùng mọi quan sát đã xác minh, xem §2.4).
- **Đoạn C: 10:56:31Z → 11:38:21Z (41'50" = 2.510 s, boot #77
  86538084) — ĐÓNG bằng đo uptime trực tiếp + probe #49 + dấu
  boot tươi:**
  - **`uptime -s` lúc 11:37:47Z = 10:56:31Z** chứng minh máy up
    liên tục từ #77 tới lúc đo; probe #49 11:38:21Z đọc boot_id
    86538084 tươi — cùng boot_id với boot bắt đầu 10:56:31Z.
    (Nguyên tắc như P6 §2.3 đoạn C mù #31, Q6 §4 mục 21, T6-119
    §2.3 đoạn D, T5-120 §2.3 đoạn H, T4-121 §2.3 đoạn K, T7-122
    §2.3 đoạn C, T7-123 §2.3 đoạn C, T7-124 §2.3 đoạn C, T7-125
    §2.3 đoạn E, T7-126 §2.3 đoạn G2, T4-127 §2.3 đoạn B, T2-128
    §2.3 đoạn C, T2-129 §2.3 đoạn B.) Đoạn C dài 2.510 s > sàn
    nên không áp cắt độ dài; uptime trực tiếp là closer cho toàn
    đoạn.
  - **Chuỗi dấu boot tươi củng cố:** 1 session chạm vùng C
    (birth 11:38:21Z — phiên T2 này) + 35 mốc mtime (mốc đầu
    11:36:13Z — luồng đợt 130 mở; mốc cuối 11:38:19Z — file của
    luồng đợt 130). Lỗ mtime (10:56:31Z → 11:36:13Z] 2.383 s là
    máy yên sau boot (lượt cron 18:35 +07 mở đợt 130 lúc 11:35Z,
    luồng bắt đầu ghi ~11:36Z), không observer — nhưng uptime
    đóng đoạn này. 0 session bắc qua cắt C-lo (11:15:38Z) /
    C-hi (11:19:14Z) — không cần vì uptime là closer.
  - **Kết luận đoạn C: ĐÓNG.**

**Kết luận trung thực: khoảng mù #49 KHÔNG ĐÓNG HOÀN TOÀN.**
Đoạn A đóng, đoạn B mở (lỗ 2.252 s, tối đa 1 ẩn), đoạn C đóng.
2 reboot đã chốt giờ (#76 09:02:12Z + #77 10:56:31Z — chính xác
từng giây trên đĩa) + **tối đa 1 ẩn**. Mù #49: **MỞ (đoạn B)**.
Đây là mù mở thứ hai liên tiếp (sau mù #48 đoạn A mở đợt 129);
mù #47 vẫn là mù đóng hoàn toàn gần nhất.

Ngoài hai cây: **40 file** có mtime trong mù #49 (agents —
exec-log/tool-output chiếm đa số + 10 stage file đợt 129 +
6 file proactivity + 4 file system/memory; chi tiết xem
blind49-outside.txt); **/tmp: 1 file** trong mù #49 (xem
blind49-tmp.txt — 11:35:57Z, đoạn C). Boot_id nhắc trong
exec-log sinh/viết trong mù: 475406f6 2 file, 88f62ae6 5 file,
86538084 1 file (phiên T2 này).

### 2.4 Gộp 4 phạm vi + 2 phát hiện mới (phương pháp mới lượt này)

**Tính gộp (merged, độ chính xác giây, code tính — xem
blind49-investigate.log + phép tính gộp trong phiên):** hợp nhất
mốc giây của cả 4 phạm vi (repo-1 + hidden_files + ngoài cây +
/tmp), thêm hai đầu đoạn làm quan sát, tính lỗ lớn nhất mỗi đoạn:
- Đoạn A gộp: 94 mốc, lỗ lớn nhất **116 s** (08:59:20Z →
  09:01:16Z), floor=0 → **ĐÓNG** (khớp verdict hai cây: lỗ lớn
  nhất 128 s float — chênh do làm tròn giây, không đổi verdict).
- Đoạn B gộp: 130 mốc, lỗ lớn nhất **2.252 s** (10:04:23Z →
  10:41:55Z), floor=1; lỗ lớn thứ hai 876 s (đuôi, 10:41:55Z →
  10:56:31Z); lỗ lớn thứ ba chỉ 151 s → **MỞ, tối đa 1 ẩn**.
- Đoạn C gộp: 20 mốc, lỗ lớn nhất 2.347 s (đầu đoạn, máy yên sau
  boot) — **ĐÓNG bằng uptime** (không áp luật lỗ cho đoạn C).
- Không có file nào trong `~/workspace/goals` ngoài hidden_files
  có mtime trong mù (kiểm bằng find riêng — vùng duy nhất hai
  lần quét chính không phủ, đã kiểm bổ sung, 0 file).

**Phát hiện 1 — snapshot proactivity 10:41:55Z thu hẹp đuôi B
(mới):** 6 file dưới
`~/workspace/proactivity/hidden_files/1794912115112-…/` (goals.md,
tracking.md, conversation.md, scheduled-crons.md, sent.md,
geofences.md) cùng mtime 10:41:55.509–.625Z; tên thư mục chứa
epoch mili-giây 1794912115112 = 10:41:55Z — **khớp chéo với mtime**,
chứng minh đây là quan sát thật (runtime ghi snapshot lúc
10:41:55Z trên boot #76, 39 phút sau khi đợt 129 đóng), không
phải artifact đồng hồ. Nhờ đó đuôi B thu từ 3.127 s (hai cây) về
876 s, và tối đa ẩn thu từ 2 về 1. **Bài học phương pháp (mới):**
quan sát ngoài cây ĐƯỢC TÍNH cho phép tính lỗ/đuôi khi đã xác
minh là thật (tên thư mục/epoch khớp mtime, hoặc nội dung khớp
ngữ cảnh) — trước đây chỉ dùng ngoài cây để kiểm đuôi có trống
hay không; lần này lần đầu một quan sát ngoài cây làm đổi số
tối đa ẩn (2 → 1). Verdict B MỞ không đổi theo cả hai cách tính.

**Phát hiện 2 — file T3 09:02:34–35Z mơ hồ trước/sau reboot
(mới):** 4 file `round129-t3/dryrun/analyze-t4-*.py` +
`analyze-dryrun-labellag.txt` mang mtime 09:02:34–35Z — nằm
TRONG cửa sổ lệch ~33 s sau btime #76 (09:02:12Z), nên có thể là
(a) ghi trước reboot trên đồng hồ cũ (RTC ~09:02:01Z) hoặc (b)
ghi sau reboot trên boot #76. Không phân biệt được chỉ từ mtime.
**Không đổi verdict nào:** loại chúng khỏi đoạn B thì đầu B vẫn
dày từ 09:04:25Z (T3 dryrun-inner.sh + T5 postboot-b76 polls +
T8 rebuild-fixtures-b76.log — 43 mốc hai cây trong 09:02:35–
09:32:46Z, đều sau cửa sổ lệch nên chắc chắn thuộc #76); lỗ lớn
nhất đoạn B vẫn 2.252 s; đoạn A vẫn đóng (đuôi ≤ 64 s kể cả cộng
lệch 33 s). Ghi rõ để luồng sau khỏi tưởng mốc 09:02:34Z là bằng
chứng chắc chắn cho đầu đoạn B.

### 2.5 Phân phối gap — CERT n=41 → n=42 / FULL n=56 → n=57 (gap mới CHỨNG NHẬN DẠNG KHOẢNG)

**Gap #75→#76 = [6.511 s, 6.531 s] (mid 6.521 s) CHỨNG NHẬN DẠNG
KHOẢNG (mới)** — đoạn A mù #49 đóng (§2.3). Biên ±10 s của T5
dùng nguyên văn; mid không dịch chuyển (thực hành của T5). Caveat:
F76 chưa đo trực tiếp (xem §2.2); lệch đồng hồ cũ ~33 s tại #76
chỉ ảnh hưởng vị trí mtime gần ranh giới A/B, không ảnh hưởng gap
danh nghĩa tính từ btime (RTC). Tiền lệ: gap #72→#73 chứng nhận
dạng khoảng đợt 128 trong khi F73 cũng chưa từng đo (xem §4
mục 1). Không áp hint hướng nào.

**Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN** — đoạn B mù
#49 mở (T2-130 §2.3). Không đưa vào FULL/CERT.

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

**Cross-check tái hiện T2(129) 100%:** chạy blind48-gaps-prev.py
verbatim cho lại đúng CERT n=41 / FULL n=56 của T2 đợt 129 (xem
blind49-gaps.txt: CERT41 mean 1h41'16" median 1h54'16" p10
0h31'47" p90 2h24'11" sd 0h43'27" min 0h19'07" max 3h14'08";
FULL56 mean 1h48'02" median 1h54'38" p10 0h32'24" p90 2h44'14"
sd 0h57'04" min 0h19'07" max 5h43'18"; in 90–150' = 30, <60' = 11,
>180' = 6, >240' = 2 — khớp T2-129 §2.5 từng số). Gap #76→#77
không vào (đoạn B mở) nên chỉ gap #75→#76 mới vào.

- **CERT n=42 (mới):** mean 1h41'27" median 1h52'28" p10 0h33'27"
  p90 2h23'51" sd 0h42'56" min 0h19'07" max 3h14'08".
- **FULL n=57 (mới):** mean 1h48'02" median 1h54'16" p10 0h32'31"
  p90 2h40'49" sd 0h56'33" min 0h19'07" max 5h43'18"; in 90–150'
  = 31, <60' = 11, >180' = 6, >240' = 2.
- Độ nhạy biên LO/HI của gap mới: CERT42 mean chỉ dao động ±1 s
  (1h41'26"–1h41'27"), FULL57 mean không đổi (1h48'02") — biên
  ±10 s không làm lệch phân phối.
- **Dải chứng nhận [19'07", 3h14'08"] không đổi** (gap mới 6.521 s
  = 1h48'41" nằm trong dải; gap #76→#77 6.859 s cũng nằm trong
  dải nhưng chưa chứng nhận nên không vào).
- **Tốc độ reboot (đồng hồ ghi nhận):** 77 / 158,64 h = **1 reboot
  mỗi 123,6 phút** (từ #1 2026-11-10T20:18:10Z tới #77
  2026-11-17T10:56:31Z); +4 reboot ẩn có thể (mù #29 +1, mù #30
  +2, mù #31 +1) → 81 / 158,64 h = **1 mỗi 117,5 phút**. Chưa tính
  ẩn danh nghĩa tối đa của mù #35 (+24), mù #37 (+29), mù #38
  đoạn G (+6), mù #39 đoạn J (+2), mù #40 đoạn B (+1), mù #43
  đoạn B (+3), mù #44 đoạn D (+5), mù #45 đoạn G1 (+4), mù #46
  đoạn A (+4), mù #48 đoạn A (+2) và mù #49 đoạn B (+1, mới).
- **#76 vào dải cơ học (xem §2.2):** lần thứ sáu liên tiếp trong
  dải. **#77 vào dải cơ học:** lần thứ bảy liên tiếp trong dải.

### 2.6 Trạng thái các mù cũ — #48 A MỞ / #47 ĐÓNG / còn lại KHÔNG KIỂM LẠI (quyết parent)

| Mù | Trạng thái | Ghi chú |
|---|---|---|
| #49 (mới) | **MỞ (đoạn B)** | **Mới, lượt này** — đoạn A đóng, đoạn B mở (lỗ 2.252 s, tối đa 1 ẩn), đoạn C đóng; 2 reboot đã chốt giờ (#76 09:02:12Z + #77 10:56:31Z); gap #75→#76 chứng nhận dạng khoảng, gap #76→#77 vẫn SPAN |
| #48 | **MỞ (đoạn A)** | T2-129 §2.3; **parent CHƯA quyết có chấp nhận để mở hay không** — theo tiền lệ quyết đợt 126 §12(h) (mù #46 A để mở), **không giao luồng sau kiểm lại A** mù #48 trừ khi parent ra quyết khác. Đuôi 2.941 s, tối đa 2 ẩn; gap #74→#75 vẫn SPAN |
| #47 | **ĐÓNG HOÀN TOÀN** | T2-128 §2.3; gap #72→#73 + #73→#74 chứng nhận dạng khoảng; CERT n=41 / FULL n=56 (nay n=42/n=57 nhờ gap mới) — **KHÔNG kiểm lại lượt này** |
| #46 | **MỞ (đoạn A)** | **Parent CHẤP NHẬN ĐỂ MỞ (tiền lệ quyết đợt 126 §12(h), đính chính đợt 127 §12(c))** — T2 KHÔNG kiểm lại lượt này. Đuôi 4.793 s, tối đa 4 ẩn; gap #71→#72 vẫn SPAN |
| #45 | **MỞ (đoạn G1)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 125 §12(h))** — T2 KHÔNG kiểm lại lượt này. Đuôi 4.710 s, tối đa 4 ẩn; gap #70→#71 vẫn SPAN |
| #44 | **MỞ (đoạn D, đã kiểm sâu 1 lần đợt 126 vẫn mở)** | **ĐỂ MỞ theo quyết parent §12(h)** — lần kiểm sâu cuối cùng đã xong đợt 126 (§2.4 T7-126); gap #68→#69 vẫn SPAN |
| #43 | **MỞ (đoạn B mù #42)** | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.4) — T2 KHÔNG kiểm lại lượt này.** Đuôi 4.503 s, tối đa 3 ẩn; gap #67→#68 vẫn SPAN |
| #42 | **KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'50", tối đa 3 ẩn)** | Đoạn A đóng → gap #66→#67 chứng nhận dạng khoảng; đoạn B mở = mù #43 |
| #41 | ĐÓNG HOÀN TOÀN | T7-123 §2.3; gap #64→#65 chứng nhận dạng khoảng, #65→#66 chứng nhận dạng điểm |
| #40 | KHÔNG ĐÓNG HOÀN TOÀN (A+C đóng, B mở, 2h58'04", tối đa 1 ẩn) | **Parent CHẤP NHẬN ĐỂ MỞ (quyết đợt 124 §12.3) — T2 KHÔNG kiểm lại lượt này.** 3 lần kiểm tra sâu đều 0; gap #63→#64 vẫn SPAN |
| #39 | KHÔNG ĐÓNG HOÀN TOÀN (I+K đóng, J mở, 2h56'14", tối đa 2 ẩn) | **Parent đã chấp nhận ĐỂ MỞ** (quyết đợt 123 §12.2) — KHÔNG kiểm lại |
| #38 | KHÔNG ĐÓNG HOÀN TOÀN (E+F+H đóng, G mở, 5h59'14", tối đa 6 ẩn) | Thử cuối đã thất bại đợt 121 — KHÔNG thử lại lượt này (theo brief T2); cần parent quyết có chấp nhận để mở như mù #35/#37 hay không |
| #37 | KHÔNG ĐÓNG HOÀN TOÀN (A+D đóng, B+C mở, 12h05'27", tối đa 29 ẩn) | T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119; KHÔNG thử đóng lại |
| #35 | KHÔNG ĐÓNG HOÀN TOÀN (A+E đóng, B/C/D mở, 6h49'50", tối đa 24 ẩn) | T7 đợt 117; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 117; số thứ tự #48–#77 vẫn TẠM THỜI vì mù này |
| #34 | ĐÓNG HOÀN TOÀN | S7 §2.3; parent đã chấp nhận — QUYẾT PARENT 7 đợt 117 |
| #33 | ĐÓNG HOÀN TOÀN | R7 §2.3 |
| #32 | ĐÓNG HOÀN TOÀN | Q6 §2.3 |
| #31 | KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG THỬ LẠI LƯỢT NÀY | 1 cửa sổ mở 8'55"; 2 reboot đã chốt + tối đa 1 ẩn |
| #30 | KHÔNG ĐÓNG HOÀN TOÀN | 3 cửa sổ mở, tổng 30'50"; 2 reboot đã chốt + tối đa 2 ẩn |
| #29 | KHÔNG ĐÓNG HOÀN TOÀN | Khe 79 s không loại trừ được; 2 reboot đã chốt + tối đa 1 ẩn |
| #28 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 23'39", khe 4'32" không loại trừ được; 2 reboot đã chốt + tối đa 1 ẩn |
| #26 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 1h13'58" có thể chứa thêm reboot |
| #24 | KHÔNG ĐÓNG HOÀN TOÀN | Lỗ 2h03'11" có thể chứa thêm reboot |
| #22 | ĐÃ ĐÓNG — MỨC TIN CẬY HẠ | Cửa sổ lý thuyết ≤78 s với sàn 19'07"; chờ parent/user quyết |
| #21 | CHƯA ĐÓNG HOÀN TOÀN | Lỗ ~17'23" có thể chứa đúng 1 reboot trung gian |

**Còn thiếu gì để chứng nhận gap #76→#77:** đúng **1 quan sát trong
cửa sổ (10:22:48Z, 10:23:30Z)** — tức sau 10:22:48Z (10:41:55Z −
1.147 s) và trước 10:23:30Z (10:04:23Z + 1.147 s) — để chẻ lỗ
2.252 s thành hai lỗ < sàn (đuôi sau 10:41:55Z chỉ 876 s nên
không cần thêm quan sát nào nữa). Đoạn B mù #49 đã MỞ — theo tiền
lệ quyết đợt 126 §12(h) (mù #46 A để mở, không kiểm lại),
**không giao luồng sau kiểm lại B** mù #49 trừ khi parent ra quyết
khác (lỗ đã có quan sát ngoài cây cứu một phần nhưng chưa đủ đóng
— chờ bằng chứng ngoài VM).

**Reboot #16 VẪN MỞ** (kẹp ~4', chờ parent/user quyết); cron
riêng 10 phút vẫn chờ user quyết.

### 2.7 Quét writeFileSync lần thứ 36 — chênh 0 (lần thứ 36 liên tiếp)

- Chạy script `scan-wfs.sh` (bản T2 trong round130-t2, đổi OUT sang
  round130-t2) **11:45:04Z → 11:45:19Z 17/11 (15 s, có SCAN-END)**.
  Scan chạy trên boot #77, SAU khi mù #49 đã đóng bằng probe #49
  (11:38:21Z) — kết quả vẫn hợp lệ vì scan chỉ đếm code hiện tại,
  không phụ thuộc giờ mù.
- NEWSTD: **871 dòng / 244 file** (phạm vi 3.064 file); R7b đối
  chiếu: **896 dòng / 261 file** (phạm vi 12.457 file); copies:
  **25 dòng / 17 file** — y hệt lần 35. Đối chiếu chéo:
  871+25=896=R7b, **chênh 0**.
- **+8 dòng / +2 file so với lần 35** (863/242 → 871/244), giải
  thích đúng hết bằng diff (kiểm bằng diff danh sách file + mtime
  — 0 file mất hit):
  | File | +dòng | mtime | Ghi chú |
  |---|---|---|---|
  | PHASE9_GAP_ANALYSIS.md | +1 (26 → 27) | 10:04:23Z 17/11 | §58 thêm ở closing đợt 129 (nhắc `writeFileSync` thêm 1 lần) |
  | docs/PHASE9_ROUND129_LIMITS.md | +1 (0 → 1) | 10:04:23Z 17/11 | Tài liệu gộp đợt 129 (nhắc `writeFileSync` 1 lần); viết SAU scan lần 35 (08:44:07Z 17/11) nên lần này mới vào |
  | docs/PHASE9_ROUND129_T2_EPERM_LIMITS.md | +6 (0 → 6) | 08:51:21Z 17/11 | Tài liệu T2 đợt 129 (nhắc `writeFileSync` 6 lần); viết SAU scan lần 35 nên lần này mới vào |
- Phạm vi: 3.064 = 3.047 + 17 net (**17 file mới, 0 file mất**:
  kiểm bằng diff danh sách file — 17 file mới gồm 5 script
  analyze-t4-*.py (T3 dryrun, benchmarks/render) + 8 LIMITS đợt
  129 + 4 LIMITS đợt 130 (T1/T6/T7/T9); 0 file mất). Copies
  y hệt lần 35 (diff 0 dòng).
- **Kết luận: 36 lần quét liên tiếp chênh 0.** Không có bằng chứng
  writeFileSync bị thay thế/làm sai lệch trong mù #49.

### 2.8 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 không đổi; dist nằm
    ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Lưu ý phương pháp: pattern phải là `\.writeFile\(` (có dấu chấm).
  Pattern không dấu chấm còn bắt thêm các mock `async writeFile(`
  trong file test `apps/web/scripts/test_round83_k8_eperm_retry.mjs`
  (định nghĩa fake fs, mtime 10/11, không phải đường ghi thật) —
  không tính vào 2 helper; T7-126 §2.8 cũng dùng pattern có dấu
  chấm nên số 2 là nhất quán giữa các lượt.
- **0 stray.** Không có bằng chứng async writeFile bị dùng để
  né EPERM trong mù #49.

## 3. RAM trong mù #49 — max 2.749 MB (45% guard), birefnet KHÔNG chạy

- **4 mẫu MemAvailable của lượt (đo trực tiếp, SAU mù #49 — không
  tính vào max trong mù):**
  | Thời điểm | MemAvailable | Ghi chú |
  |---|---|---|
  | 11:37:47Z | **799.208 kB** | Trước probe #49 (boot #77) |
  | 11:38:22Z | **1.018.776 kB** | Lúc probe #49 (boot #77) |
  | 11:46:02Z | **2.855.164 kB** | Trước khi viết LIMITS (boot #77) |
  | 11:46:08Z | **2.743.132 kB** | Trước khi viết LIMITS (boot #77) |
- **Max RAM biết được TRONG mù #49 (từ log sibling, đếm bằng
  code — xem ram-max.txt):** 95 mẫu RAM; **max 2.749 MB**
  (T4 poll, 08:58:19Z, đoạn A, dòng `RAMavail=2749MB` trong
  round129-t4/poll-t4.log) = **45% ngưỡng guard** — cao hơn max
  2.687 MB mù #48 một ít nhưng vẫn thấp hơn max kỷ lục 4.576 MB
  mù #42; đoạn A max **2.749 MB**; đoạn B max **1.469 MB** (T5
  poll, 09:07:04Z); đoạn C max **966 MB** (T4 gate0, 11:38:19Z,
  đã xác minh trực tiếp trong round130-t4/poll-t4.log).
- **Birefnet KHÔNG chạy — vẫn 0 lần chạy thành công trong gói.**
  Max RAM 2.749 MB < ngưỡng guard 6 GB; u2net là fallback chính
  thức. Quyết parent §12.7 vẫn đứng: chỉ thử lại khi một probe
  quan sát được available ≥ 6 GB. MemTotal VM 8.124.900 kB
  (7,93 GB) — guard 6 GB về nguyên tắc ĐẠT ĐƯỢC khi máy nhàn.

## 4. Ghi chú phương pháp (mới so với T2 đợt 129)

1. **ĐIỀU KIỆN CHỨNG NHẬN GAP TRONG PREREG ĐƯỢC GHI ĐÈ BỞI TIỀN LỆ
   — ghi công khai, verdict NGƯỢC ĐIỀU KIỆN PREREG (mới, §0 +
   §2.5):** prereg §2 tự đặt điều kiện chặt "chỉ chứng nhận gap
   #75→#76 dạng khoảng nếu F76 ≈ 0 đã đo hoặc đo được; nếu F76
   chưa đo thì KHÔNG tự chứng nhận, giữ SPAN". Thực tế F76 KHÔNG
   đo được (T5-129 không đo HTTP Date trên boot #76). Nhưng khi
   đọc lại tiền lệ trong lúc điều tra, gap #72→#73 đã được chứng
   nhận dạng khoảng ở đợt 128 (blind48-gaps-prev.py) trong khi F73
   cũng chưa từng đo trực tiếp — parent đã chấp nhận (quyết đợt
   128 §12.3, T2-129 §2.5 giữ nguyên). Phương pháp đã được parent
   chấp nhận (biên ±10 s của T5 dùng nguyên văn + caveat ghi rõ)
   được ưu tiên hơn điều kiện chặt do chính T2 tự đặt trong
   prereg. Gap #75→#76 ĐƯỢC CHỨNG NHẬN dạng khoảng [6.511 s,
   6.531 s]. Không sửa prereg sau khi thấy số; mọi số gap trong
   LIMITS này đều lấy từ code, không lấy từ prereg. Bài học: khi
   prereg đặt điều kiện chặt hơn tiền lệ đã chấp nhận, phải đối
   chiếu tiền lệ TRƯỚC khi viết prereg — hoặc ghi rõ trong prereg
   rằng điều kiện đó là tự đặt và có thể bị tiền lệ ghi đè.
2. **Prereg dự báo ĐÚNG HẾT các verdict còn lại (mới, §0):** probe
   #49 boot 86538084 ok=2 fail=0 ĐÚNG; log +3 ĐÚNG; #77 trong dải
   cơ học ĐÚNG (lần thứ bảy liên tiếp); đoạn A ĐÓNG ĐÚNG; đoạn B
   MỞ ĐÚNG (đuôi sau quan sát cuối ~54' như dự báo — thực tế lỗ
   lớn nhất 2.252 s sau khi tính cả snapshot ngoài cây); đoạn C
   ĐÓNG bằng uptime ĐÚNG; EPERM 0 sóng ĐÚNG; WFS chênh 0 ĐÚNG
   (871 dòng — trong khoảng dự báo ~863–875); RAM max < 4.576 MB
   ĐÚNG (2.749 MB) — không sửa sau khi thấy số.
3. **Bẫy sed-adapt tái diễn — bắt được bằng grep trước khi chạy
   (mới, nối tiếp T2-129 §4 mục 16):** copy eperm-sweep48.py /
   ram-max48.py bằng sed chuỗi lồng nhau đã làm hỏng ranh giới
   (B0=B1=11:38:21Z ở cả hai script; SEGS của ram-max49.py thành
   đoạn sai) — phát hiện bằng grep mọi timestamp hardcode sau khi
   sed (bài học T2-129 §4 mục 16 đã ghi nhưng vẫn mắc lại ở bước
   sed đầu) và sửa đúng ranh giới bằng edit tay TRƯỚC khi chạy.
   Không dùng số nào từ bản sed hỏng. Bài học nhắc lại: KHÔNG dùng
   sed chuỗi thay timestamp lồng nhau — viết mới hoặc thay từng
   mốc riêng rồi grep lại toàn bộ timestamp.
4. **Tính gộp 4 phạm vi cho lỗ/đuôi (mới, §2.4):** lần đầu tính
   lỗ lớn nhất mỗi đoạn trên mốc gộp cả 4 phạm vi (repo-1 +
   hidden_files + ngoài cây + /tmp), song song với phép tính hai
   cây chuẩn. Hai cách tính cho cùng verdict ở cả ba đoạn; số
   tối đa ẩn của đoạn B khác nhau (gộp: 1, hai cây: 2) — lấy số
   gộp làm headline, ghi số hai cây làm cận bảo thủ. Kiểm bổ sung
   vùng `~/workspace/goals` ngoài hidden_files (vùng duy nhất hai
   lần quét chính không phủ): 0 file trong mù.
5. **F77 đo bằng 3/3 nguồn (khác đợt 129):** cloudflare.com lần
   này KHÔNG 403 — cả ba server đều khớp +1,0 s. Ghi rõ con số
   thay vì viết "3 server khớp 0–1 s" như các lượt trước.
6. **Kiểm lại boot TRƯỚC (11:37:47Z) và SAU khi viết LIMITS
   (11:46:02Z):** cả hai lần đều boot 86538084 (#77), uptime-s
   10:56:31Z — KHÔNG có reboot giữa phiên T2 lượt này. Probe #49
   và mù #49 KHÔNG bị ảnh hưởng bởi reboot sau đó (chưa xảy ra
   tới lúc đóng).
7. **Không kiểm lại TTS 39** (cấm). **Không thử birefnet**
   (cấm — RAM < guard, xem §3). **Không đụng cloud/collab/AI
   model đóng/nhạc bản quyền.**
8. **Không quét toàn workspace lượt này:** chỉ dùng góc hẹp/mục
   tiêu nhỏ (repo-1 + hidden_files + ~/workspace trừ repo-1/goals
   + /tmp + exec-logs + kiểm bổ sung goals-ngoài-hidden_files).
9. **Stage batch:** chỉ 1 file text (LIMITS doc này),
   NUL-delimited, ĐƯỜNG DẪN TƯƠNG ĐỐI, verify read-back (xem
   checkpoint + stage file).
10. **Ghi rõ:** số thứ tự reboot #48–#77 vẫn TẠM THỜI; giá trị
    gap không phụ thuộc số thứ tự.
11. **Không viết lại lịch sử:** các gap đã chứng nhận trước đây
    giữ nguyên; chỉ ghi caveat F76 CHƯA ĐO + lệch đồng hồ cũ ~33 s
    tại #76 vào hồ sơ (xem §2.2 + §2.5).
12. **Cross-check tái hiện T2(129) 100%** (CERT n=41 / FULL n=56)
    trước khi kết luận số mới — chạy blind48-gaps-prev.py verbatim
    qua exec trong blind49-gaps.py (xem blind49-gaps.txt).
13. **md5 preview.tsx ĐỔI trong đợt 130 (ghi nhận, không phải do
    T2):** preview.tsx 03bf029f → 805409f0, mtime 11:40:32Z —
    công việc của luồng khác đợt 130 (T5 instrumentation (c2),
    parent đã phê duyệt đợt 129 §12.3(a)); media.ts KHÔNG ĐỔI
    2c384ed1. T2 không sửa production file nào.
14. **Các luồng đợt 130 khác đang chạy lúc T2 đóng** — T2 chỉ ghi
    nhận trạng thái (T1/T3/T6/T7/T9 đã có cờ .done), không phụ
    thuộc kết quả các luồng đó.
15. **T2 KHÔNG mở Xvfb** (luồng probe không cần browser) nên
    không có Xvfb nào để kill — luật đứng đợt 127 §12.1.3 (mỗi
    driver tự kill Xvfb của mình) không phát sinh việc lượt này.
16. **Replay #77 chưa có hình dạng (mới, §2.1):** chỉ 2 dòng
    "startup packages configure", im ~382 s lúc kiểm cuối — T5
    (chủ quản replay) theo dõi tiếp; T2 không kết luận replay
    kẹt hay chậm, chỉ ghi bracket.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Khoảng mù #49: MỞ (đoạn B) — mới, xem §2.3.** Đoạn A đóng,
   đoạn B mở (lỗ 2.252 s, tối đa 1 ẩn), đoạn C đóng. 2 reboot đã
   chốt giờ (#76 09:02:12Z + #77 10:56:31Z) + tối đa 1 ẩn. Gap
   #75→#76 chứng nhận dạng khoảng [6.511 s, 6.531 s]; gap #76→#77
   giữ SPAN. **CERT n=42 / FULL n=57 (mới).**
2. **Gap #76→#77 = 6.859 s (1h54'19") VẪN CHỈ LÀ SPAN (mới — xem
   §2.5).** Cần đúng 1 quan sát trong cửa sổ (10:22:48Z,
   10:23:30Z) để đóng đoạn B. Theo tiền lệ quyết đợt 126 §12(h)
   (mù #46 A để mở), **không giao luồng sau kiểm lại B** mù #49
   trừ khi parent ra quyết khác — chờ bằng chứng ngoài VM.
3. **Gap #75→#76 = [6.511 s, 6.531 s] CHỨNG NHẬN DẠNG KHOẢNG (mới
   — xem §2.5).** Caveat: F76 chưa đo trực tiếp; lệch đồng hồ cũ
   ~33 s tại #76 (suy luận từ log harness, không phải đo trực
   tiếp) chỉ ảnh hưởng vị trí mtime gần ranh giới, không ảnh
   hưởng gap danh nghĩa (RTC). Tiền lệ #72→#73 (F73 cũng chưa đo)
   đã được parent chấp nhận đợt 128.
4. **Replay #77 mới bắt đầu, chưa có hình dạng (mới — xem §2.1).**
   2 dòng 11:35:39–11:35:40Z, chưa đóng băng lúc 11:46:02Z, chưa
   có /var/log/apt. T5 (chủ quản replay) theo dõi tiếp.
5. **Mù #48 (đoạn A): MỞ — parent CHƯA quyết có chấp nhận để mở
   hay không.** T2 không kiểm lại lượt này. Gap #74→#75 giữ SPAN.
6. **Mù #47: ĐÓNG HOÀN TOÀN (đợt 128) — KHÔNG đổi lượt này.**
   T2 không kiểm lại.
7. **Mù #46 (đoạn A): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (tiền lệ
   quyết đợt 126 §12(h), đính chính đợt 127 §12(c)). T2 không
   kiểm lại lượt này. Gap #71→#72 giữ SPAN.
8. **Mù #45 (đoạn G1): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h)). T2 không kiểm lại lượt này. Gap #70→#71 giữ SPAN.
9. **Mù #44 đoạn D: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
   125 §12(h), kiểm sâu 1 lần đã xong đợt 126). T2 không kiểm lại
   lượt này. Gap #68→#69 giữ SPAN.
10. **Mù #43 (gap #67→#68): MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ**
    (quyết đợt 124 §12.4). T2 không kiểm lại lượt này. Gap #67→#68
    giữ SPAN.
11. **Mù #40 đoạn B: MỞ — parent ĐÃ CHẤP NHẬN ĐỂ MỞ** (quyết đợt
    124 §12.3). T2 không kiểm lại lượt này. Gap #63→#64 giữ SPAN.
12. **Gap #66→#67 = KHOẢNG [27'06", 28'28"] ĐÃ CHỨNG NHẬN DẠNG
    KHOẢNG (đợt 124) — parent ĐÃ CHẤP NHẬN cả ba điểm (§12.5).**
    Không đổi lượt này.
13. **Reboot #76 (09:02:12Z, boot 88f62ae6) + #77 (10:56:31Z, boot
    86538084) — CHỈ GHI NHẬN giờ + bracket replay (mới, xem §2.2
    cuối + §2.1).** Gap #75→#76 thuộc mù #49 đoạn A, ĐÓNG;
    gap #76→#77 thuộc mù #49 đoạn B, MỞ. **Không tự đánh số thứ
    tự chắc chắn** — số #76/#77 là tạm thời như #75. **Lưu ý
    replay:** bracket #77 (2 dòng, 11:35:39–11:35:40Z) đã ghi
    trong LIMITS này (sẽ mất theo reboot sau, như bracket
    #71/#72/#73/#74/#75/#76).
14. **RAM max 2.749 MB = 45% guard (mới — xem §3).** Cao hơn max
    2.687 MB mù #48 một ít nhưng vẫn thấp hơn max kỷ lục 4.576 MB
    mù #42. **Birefnet KHÔNG chạy** (vẫn dưới guard 6 GB; quyết
    parent §12.7 vẫn đứng). u2net vẫn là fallback chính thức.
15. **R9 (a) (cron chạy watcher v2 đầu mỗi lượt với
    --wait-new-boot) VẪN CHỜ user quyết** (đã hỏi lúc đóng đợt
    117, chưa trả lời — nhắc lần 16 ở đợt này). Watcher này sẽ
    lấp đúng loại lỗ như lỗ đoạn B của mù #49 (2.252 s — lần này
    snapshot proactivity 10:41:55Z đã cứu một phần nhưng chưa đủ
    đóng).
16. **Khoảng mù #37 KHÔNG ĐÓNG HOÀN TOÀN — KHÔNG ĐỔI** (T6-119;
    parent đã chấp nhận để mở). Khoảng mù #35 cũng vậy (T7 đợt
    117). Gap #49→#50, #50→#51, #51→#52 vẫn là cận trên.
17. **EPERM không tuyên bố đã hết** (sóng gần nhất ~143h43'
    trước probe #49). **Không kiểm lại TTS 39** (cấm).
    ci-security.yml vẫn 403 chờ user. **G1 + mù #22/#28/#29/#30/
    #31/#35 chờ user quyết** (không tự quyết).
18. **Mù #50 MỚI MỞ (từ probe #49 11:38:21Z) — việc của lượt sau:**
    probe #50 + điều tra đoạn từ #77 (dải cơ học cho #78:
    [11:29:01Z, 13:37:19Z], hiệu dụng sau probe #49: [11:38:21Z,
    13:37:19Z]). T2 KHÔNG tự chạy probe #50 lượt này (nhịp probe
    là 1/lượt).

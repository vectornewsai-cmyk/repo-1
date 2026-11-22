# LIMITS — Phase 9 đợt 150, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ tư liên tiếp; balloon GHIM TRẦN TRỞ LẠI trên boot mới e9295700, 28/97 mẫu, ĐỨT lúc 00:58:37Z — quan sát được điểm kết thúc; testsrc2 QUY ĐƯỢC CHỦ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 323/323 (23:43:42Z) → đóng 308/308 (01:19:57Z), cùng boot e9295700** — giảm −15 so với 331 đóng đợt 149; **dưới ngưỡng < ~1.800 lần thứ mười liên tiếp**; tỉ lệ/vite ~0,20 cả mở lẫn đóng — **sâu nhất từ trước tới nay** (149: 0,21). Quyết parent (r) "vẫn chỉ theo dõi" đứng — T9 chỉ theo dõi, không báo riêng. Xem §1.
- **Balloon GHIM TRẦN TRỞ LẠI trên boot mới — 28/97 mẫu, 4 chuỗi (1 + 1 + 13 + 13):** chạm trần lần đầu 00:23:36Z (sau khi xả sâu tới min 4.330.444 kB lúc 00:09:35Z); episode chính 00:30:36–00:57:37Z (26/28 mẫu ghim trong 27 phút, ngắt 2 mẫu 00:43–00:44Z); **ghim ĐỨT 00:58:37Z** (xả về 6.050.608 kB rồi 5.148.400 kB) — **lần này T9 quan sát được điểm kết thúc** (khác đợt 149: chuỗi 2 vẫn ghim lúc sampler dừng). T9 không phán nối hay đứt — giao T10 phán cách đếm theo quyết (e) (149 là đợt mới; 150 cách 149 một reboot #40 + xả sâu + ~51 phút không ghim). Xem §2.2, F-150-T9-7.
- **RAM:** sampler **97 mẫu, 23:43:32–01:19:38Z, MỘT boot duy nhất (e9295700), không gap, không reboot giữa phiên** (khác đợt 149: reboot #39 giữa phiên + khởi động lại sampler bằng tay). Min **426.472 kB (416,5 MiB) lúc 00:24:36Z** (trong lúc ghim); max **2.164.956 kB (2.114,2 MiB = 34,41% guard) lúc 00:09:35Z**; mean 921.632 kB. Gate A ≥1024 MiB: **36/97 mẫu**. **0/97 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ tư liên tiếp.** Xem §2, §3.
- **B2: 28 spike load1 ≥3,0 — TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN** (phương pháp snapshot tức thời giữ nguyên); đỉnh **13,47 lúc 23:50:58Z** (cao hơn đỉnh 11,10 đợt 149); sampler load1 max **13,64 lúc 23:50:33Z**. **ffmpeg testsrc2 là driver của 21/28 spike, delta tới 137 tick/s** — nhưng lần này **QUY ĐƯỢC CHỦ (đóng họ F-147/148/149-T9-3)**: 39/41 PID testsrc2 gắn tên script (T5 §7); phía spike T9: mọi testsrc2 trong spike đều khớp 41 PID của T5, **0 spike ngoài danh sách** — không phải sót, không process ngoài, không sửa test, không điều tra thêm (theo quyết (p)). Xem §2.5, §2.6.
- **Lượt yên #22 (T4): VẪN MỞ — 0 ATTEMPT đợt này** (khác đợt 149: 3/3 attempt hết ngân sách). Poller T4 chạy 23:47:02Z–01:00:32Z, 97 poll thật, **gate0 = khong-dat trong 97/97 poll** (cờ postboot T5-150 không có lúc đó; cờ round149-t5 cũ, mtime-cu, không khớp boot mới; apt replay không khởi động trên boot e9295700); gate A (RAM ≥1024 MiB) mở 23:43–00:16Z theo sampler T9 nhưng gate0 chặn nên không attempt nào chạy. T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại. Xem §2.3, §2.4.
- **WFS #56 (T2): chênh 0 — lần thứ 56 liên tiếp** (NEWSTD 976 dòng / 280 file; R7b 1.001 / 297; copies 25 / 17; delta +4 dòng / +2 file giải thích đầy đủ bằng diff). WFS là mục của T2 (T2 §2.8) — T9 chỉ trích lại, không tự đếm.
- **Mù #71? (T2): ĐÓNG HOÀN TOÀN — chuỗi đóng hoàn toàn 6 → 7 (chờ parent xác nhận); gap #39 chứng nhận dạng khoảng [4.996, 5.000] s, giữa 4.998 s → CERT 71 / FULL 86.** Số danh nghĩa 4.998 s NẰM TRONG khoảng thật — lần đầu tiên số danh nghĩa không sai. T9 chỉ ghi lại để đối chiếu mốc reboot #40 của mình; không phán.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round150-t9/k8-headroom.py` (copy y nguyên từ đợt 149 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 150

| Thời điểm (UTC) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 23:43:42Z 19/11 | **323** | e9295700 (btime 23:32:09Z) | lần đo 1, boot ~11'33" tuổi; RAM trước đo 1.057.836 kB, balloon 5.822.484 kB (không ghim) |
| 23:43:42Z 19/11 | **323** | e9295700 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.057.760 kB, balloon 5.822.484 kB |
| 01:19:57Z 20/11 | **308** | e9295700 | lần đo 3 (đóng phiên, cùng boot); RAM trước đo 542.980 kB, balloon 5.753.340 kB (đang leo lại, chưa ghim) |
| 01:19:58Z 20/11 | **308** | e9295700 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 537.592 kB, balloon 5.753.340 kB |

- Probe dừng ở `i=323` cả hai lần mở đợt, `i=308` cả hai lần đóng phiên, errno=28 — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau lần 2 và 4).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 323 = **63.424 watch** lúc mở; 63.747 − 308 = **63.439 watch** lúc đóng (**+15 trong phiên**, cùng boot — không reboot giữa phiên).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 323 / 1.578 ≈ **0,20** mở đợt; 308 / 1.578 ≈ **0,20** đóng phiên (chính xác 0,195) — **sâu nhất từ trước tới nay** (đợt 149: 0,21 lúc đóng).
- Đối chiếu độc lập (T5-150 `headroom-open.txt`, cùng boot e9295700): **headroom 318 lúc mở đợt** — T9 đo 323, chênh 5 watch — sai số pha lấy mẫu (hai probe chạy cách nhau vài phút, watch ngoài cell biến động), khớp.
- Lưu ý: RAM trước đo lần 3 (542.980 kB) thấp hơn nhiều so với lần 1 (1.057.836 kB) trong khi headroom chỉ giảm 323 → 308. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot #40 trước phiên cũng không khôi phục headroom (331 đóng đợt 149 → 323 mở đợt này).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–149 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

| Đợt | Headroom | Ghi chú |
|---|---|---|
| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt |
| 128 | 3.212 | đo 05:40:28Z, boot #74 (lần 2: 3.211) |
| 129 | 3.086 → 3.079 | đo 08:39:03Z → 08:40:47Z, boot #75 |
| 130 | 2.974 → 2.963 | đo 11:37:45Z → 11:39:54Z, boot mới btime 10:56:31Z |
| 131 | 2.846 → 2.846 | đo 14:42:07Z → 14:44:42Z, boot mới btime 14:26:41Z |
| 132 | 2.745 → 2.738 | đo 17:40:47Z → 17:42:07Z, boot mới btime 17:24:08Z |
| 133 | 2.632 → 2.632 | đo 20:40:32Z → 20:42:53Z, boot 07da9c50 btime 19:34:15Z |
| 134 | 2.515 → 2.505 | đo 23:45:29Z → 23:48:01Z, boot d2e66749 btime 23:26:58Z |
| 135 | 2.403 → 2.395 | đo 02:40:57Z → 02:43:11Z, boot 78b55838 btime 02:27:27Z |
| 136 | 2.286 → 2.281 | đo 05:41:01Z → 05:43:14Z, boot 1ca1feaa btime 05:29:18Z |
| 137 | 2.179 → 2.175 | đo 08:41:12Z → 08:43:35Z, boot 2104246b btime 08:07:11Z |
| 138 | 2.064 → 2.064 | đo 11:39:22Z → 11:39:31Z, boot 17db9652 btime 09:36:01Z |
| 139 | 1.954 → 1.954 | đo 14:41:18Z → 14:41:29Z, boot 541524e2 btime 13:53:41Z (đính chính T1-139 F-139-T1-1) |
| 140 | 1.840 → 1.840 | đo 17:38:54Z → 17:38:59Z, boot af558fb5 btime 15:54:37Z (cùng boot với vòng 2 đợt 139) |
| 141 | 1.739 → 1.739 | đo 20:40:21Z → 20:40:29Z, boot 2c0efe57 btime 19:54:12Z |
| 142 | 1.617 → 1.617 | đo ~23:40Z → 23:41:20Z, boot bde599df btime 22:48:05Z |
| 143 | 1.498 → 1.498 | đo 02:40:53Z → 02:41:01Z, boot 70a5b0fc btime 01:55:25Z |
| 144 | 1.296 → 1.295 | đo 05:39:17Z → 05:39:26Z, boot 691a7403 btime 03:55:45Z |
| 145 | 1.074 → 1.074 | đo 08:42:53Z → 08:42:57Z, boot e146ca67 btime 07:56:16Z |
| 146 | 880 → 880 | đo 11:37:51Z → 11:37:52Z, boot 98a7c93f btime 09:54:03Z |
| 147 | 668 → 668 | đo 14:42:51Z, boot 6fb582df btime 12:13:26Z |
| 148 | 554 → 446 | mở 17:40:27Z boot d8a11644 btime 17:27:53Z → đóng 19:36:35Z boot MỚI 1d610e56 btime 19:34:32Z (reboot giữa phiên) |
| 149 | 438 → 339 → 331 | mở 20:41:27Z boot 70025d3e btime 20:00:33Z → sau reboot #39 21:26:10Z boot MỚI 802f358f btime 21:23:51Z → đóng 22:42:09Z cùng boot 802f358f |
| **150** | **323 → 308** | **mở 23:43:42Z → đóng 01:19:57Z, CÙNG boot e9295700 btime 23:32:09Z (reboot #40 TRƯỚC phiên, không reboot giữa phiên)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — và reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 308 = **−4.130 (−93,1%)**. Bước giảm đợt này: −8 so với đóng đợt 149 (331 → 323) ở đầu phiên (qua reboot #40); thêm −15 trong phiên trên cùng boot.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 308, thấp hơn ngưỡng 1.492, lần thứ mười liên tiếp.** Quyết parent đợt 149 (r): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite ~0,20 lúc đóng (chính xác 0,195) — sâu nhất từ trước tới nay.** Headroom chỉ còn ~20% nhu cầu một vite đầy đủ (~1.578 watch).
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 23:41:17Z, lúc đo probe 23:43:42Z và lúc đóng 01:19:57Z — cùng giá trị; T5-150 cũng ghi trần 63.747). Trần 63.747 vẫn đầy ở mức ~63,4k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 97 mẫu, 23:43:32Z–01:19:38Z, MỘT boot

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên → trũng sâu lúc ghim trần → hồi lại cuối phiên

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **97 mẫu, 23:43:32Z 19/11–01:19:38Z 20/11, MỘT boot e9295700 — không gap** (span 5.766 s / 96 khoảng ≈ 60,06 s — không mất mẫu nào; khác đợt 149: gap 87 s do reboot #39). Tổng quan: **min 426.472 kB (416,5 MiB) lúc 00:24:36Z (trong lúc ghim); max 2.164.956 kB (2.114,2 MiB) lúc 00:09:35Z — 34,41% guard; mean 921.632 kB (900,0 MiB).**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 23:43:32Z | 1.129.012 kB (1.102,6 MiB) | mẫu đầu (balloon 5.773.736 kB — đang xả; load1 2,22) |
| 23:43:32–00:16:36Z | 1.002.000–2.164.956 kB | **gate A MỞ liên tục (31/31 mẫu ≥1024 MiB)** — cửa sổ RAM cao duy nhất trong phiên; đỉnh phiên 00:09:35Z (balloon min 4.330.444 kB); load1 ≥3,0 ở 14/31 mẫu (cụm spike testsrc2 + bench, xem §2.5) |
| 00:17:36–00:22:36Z | 1.018.024 → 519.456 kB | RAM rơi dần khi balloon leo lại 5,83M → 6,37M kB; gate A ĐÓNG từ 00:17:36Z |
| 00:23:36–00:57:37Z | 426.472–555.840 kB | **trũng sâu + balloon ghim trần** (xem §2.2); load1 ≤1,61 suốt giai đoạn (yên về tải dù RAM thấp) |
| 00:58:37–01:03:37Z | 649.016–898.212 kB | ghim ĐỨT, balloon xả về ~5,15M kB; RAM hồi |
| 01:04:37–01:19:38Z | 650.568–1.079.392 kB | RAM hồi tiếp (balloon leo lại 5,15M → 5,72M kB); load1 vọt lại 3,15–5,79 (cụm spike T8 O8/harness, xem §2.5); gate A mở lại 01:04:37–01:07:37Z (4 mẫu) + 01:15:38Z (1 mẫu) |

- **Gate A ≥1024 MiB: 36/97 mẫu** (31 mẫu 23:43–00:16Z + 4 mẫu 01:04–01:07Z + 1 mẫu 01:15:38Z); **0 mẫu ≥ guard**; load1 max (sampler) **13,64 lúc 23:50:33Z**; **18/97 mẫu load1 ≥3,0**.
- Swap: SwapFree 763.024 kB (mẫu đầu) → 616.128 kB (mẫu cuối); dao động 602.804–763.024 kB.
- Đối chiếu T5-150 (sampler riêng): RAM đỉnh **37,23% guard**, 0 mẫu ≥ guard — **khớp với T9 (34,41%)** trong sai số pha lấy mẫu (T5 bắt được đỉnh giữa hai mẫu T9, cao hơn ~2,8 điểm phần trăm — cùng họ chênh lệch như đợt 149: T5 37,2% vs T9 35,29%).
- Đối chiếu T4-150 (97 poll thật, cadence 45 s): RAMavail các poll cuối phiên 412–473 MB (00:50–00:58Z) khớp sampler T9 cùng cửa sổ (416–521 MiB); poll #96 842 MB lúc 00:59:01Z khớp mẫu T9 799.128 kB lúc 00:59:37Z (chênh ~43 MB — pha lấy mẫu). T4 ghi gate A là nguyên nhân chặn thứ hai (sau gate0) — sampler T9 corroborate: gate A ĐÓNG suốt 00:17:36–01:03:37Z (cửa sổ poller T4 chờ).

### 2.2 Balloon virtio — xả sâu đầu phiên, GHIM TRẦN 28/97 mẫu, ĐỨT lúc 00:58:37Z (quan sát được điểm kết thúc)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Mở phiên: KHÔNG ghim.** Balloon 5.773.736 kB lúc mẫu đầu (23:43:32Z), xả sâu tới min **4.330.444 kB lúc 00:09:35Z** (cùng lúc RAM đỉnh phiên), rồi leo răng cưa trở lại.
- **Ghim trần 28/97 mẫu (28,9%), trong 4 chuỗi (đếm theo mẫu liên tiếp):**
  - **Chuỗi 1: 00:23:36Z, 1 mẫu** (chạm trần lần đầu; mẫu sau 00:24:36Z xả nhẹ về 6.406.524 kB — dưới trần 37.300 kB).
  - **Chuỗi 2: 00:25:36Z, 1 mẫu** (chạm lại; mẫu sau 00:26:36Z xả sâu về 6.050.608 kB).
  - **Chuỗi 3: 00:30:36–00:42:36Z, 13 mẫu, 12 phút** (span 720 s).
  - **Khoảng xả giữa chuỗi 3 và 4: 00:43:36–00:44:36Z (2 mẫu)** — balloon 6.318.924 kB (98,1% trần) → 6.412.572 kB (99,5% trần), rồi chạm trần lại.
  - **Chuỗi 4: 00:45:37–00:57:37Z, 13 mẫu, 12 phút** (span 720 s).
  - **Ghim ĐỨT 00:58:37Z** — balloon xả về 6.050.608 kB, rồi 6.128.644 → 6.136.736 → 6.238.868 kB (00:59–01:01Z), rồi xả tiếp về **5.148.400 kB lúc 01:04:37Z**; sau đó leo lại 5.261.716 → 5.719.496 kB tới lúc đóng (01:19:38Z) — **chưa chạm trần lại lúc sampler dừng**.
- **Tổng ghim trần đợt này: 28/97 mẫu (28,9%).** So với đợt 149: 49/125 mẫu trong 2 chuỗi (22 + 27 phút), chuỗi 2 vẫn ghim lúc đóng; đợt 148: 38/115 mẫu trong 1 chuỗi 37 phút. **Khác đợt 149: đợt này T9 quan sát được điểm kết thúc ghim (00:58:37Z) — chuỗi ghim không còn mở lúc đóng.**
- **T9 KHÔNG phán chuỗi nối hay đứt — giao T10 phán theo quyết (e):** dữ kiện đầy đủ để T10 phán: (a) đợt 149 là đợt ghim trần MỚI (= 1 đợt, chuỗi mới từ 21:51Z) theo quyết parent (e); (b) giữa chuỗi cuối đợt 149 (vẫn ghim lúc sampler T9-149 dừng 22:46:07Z) và chuỗi đầu đợt 150 (chạm trần lần đầu 00:23:36Z) có **reboot #40 (btime 23:32:09Z) + balloon xả sâu tới 4.330.444 kB + ~51 phút không ghim** (22:46Z → 00:23Z, trừ khoảng sampler T9-149 đã dừng — T10 lưu ý khoảng mù dữ kiện 22:46–23:43Z không có sampler T9 nào chạy); (c) trong đợt 150, 4 chuỗi (1 + 1 + 13 + 13) cách nhau các khoảng xả ngắn (1–2 mẫu) và một khoảng xả dài sau chuỗi 4 — việc gọi là 1 episode hay 4 chuỗi là phán của T10, không phải của T9. Bài học đợt 149 vẫn đứng: đừng phán "đứt" bằng dữ kiện cắt sớm — T9 chỉ phán trên dữ kiện đầy đủ tới lúc đóng cờ (sampler dừng 01:19:38Z, sau khi ghim đã đứt 21 phút).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~426–556.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 01:19:38Z: tổng RAM 8.124.900 kB − balloon 5.719.496 kB = 2.405.404 kB còn lại; MemAvailable chỉ 650.568 kB.

### 2.3 Lượt yên WebKit #22 (T4, đợt 150) — #22 VẪN MỞ, 0 ATTEMPT (T4 đã xuất bản LIMITS)

- **T4-150 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND150_T4_WEBKIT_QUIET22_LIMITS.md`) — T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #22 VẪN MỞ — 0 ATTEMPT (cửa không mở lần nào trong 97 poll thật; poller hết hạn chờ 01:00Z, thoát exit 5 lúc 01:00:32Z).** Không có số đo tickCost nào đợt này; không có attempt nào để cộng dồn hay đánh giá lớp B. Hai việc bắt buộc của đợt (retry poll-lại-gate theo quyết parent 149 (h) + sửa tên gọi run-attempt) đều xong ở mức script nhưng CHƯA được kiểm chứng live vì không attempt nào chạy.
- **Nguyên nhân chặn chính — gate0 (postboot):** apt replay hệ thống KHÔNG khởi động trên boot e9295700 (dpkg.log đóng băng 2 dòng từ 23:35:42Z; 0 install; cache 0 .deb — lần thứ 2 liên tiếp không sống qua reboot); libs/GST thiếu suốt phiên nên postboot check-only FAIL mọi lần; T5-150 chạy --repair lúc ~00:50Z nhưng đến lúc poller cắt (01:00Z) update vẫn đang chạy, chưa có POSTBOOT_PASS. **Cờ mới của T5 có lúc 01:05:33Z (poll=1) — SAU khi poller T4 đã cắt (01:00Z)** nên không cứu được đợt này; T4-151 đo lại với cờ mới.
- **Nguyên nhân chặn thứ hai — RAM (gate A):** sampler T9 corroborate (xem §2.1): gate A mở 23:43–00:16Z (31 mẫu liên tục) rồi ĐÓNG suốt 00:17:36–01:03:37Z — đúng cửa sổ poller chờ; kể cả gate0 có mở muộn thì gate A cũng chặn trong phần lớn cửa sổ chờ.
- **Số cộng dồn lượt yên hợp lệ: #22 không đóng — T4-151 đo lại #22.** T9 không tự cộng dồn (giao T10 xác nhận số cuối).

### 2.4 Dữ kiện sampler T9 trong cửa sổ chờ của T4 (độc lập, cadence 60 s)

Poller T4 chạy 23:47:02Z–01:00:32Z (97 poll thật, cadence 45 s). Không có attempt nào nên không có cửa sổ attempt để đối chiếu — thay vào đó T9 ghi bảng RAM/load1 trong cửa sổ chờ để parent/T10 thấy vì sao gate không mở:

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 23:47:32–00:16:36Z | e9295700 | 0,25–13,64 (14 mẫu ≥3,0) | 1.002.000–2.164.956 kB — **gate A MỞ** | RAM đủ nhưng gate0 khong-dat 97/97 (T4) — tải nặng do cụm spike testsrc2 + bench (§2.5); nếu attempt chạy trong cửa sổ này thì B2 đã vi phạm (load1 tới 13,64) |
| 00:17:36–00:57:37Z | e9295700 | 0,12–1,61 (0 mẫu ≥3,0) | 426.472–1.018.024 kB — **gate A ĐÓNG** (trừ mẫu 00:17:36Z 1.018.024 kB = 994,2 MiB, vẫn < 1024) | Yên về tải nhưng RAM trũng sâu (balloon ghim trần) — cả hai gate đều đóng |
| 00:58:37–01:00:32Z | e9295700 | 0,17–0,92 | 649.016–799.128 kB — **gate A ĐÓNG** | Ghim vừa đứt, RAM đang hồi nhưng chưa tới 1024 MiB; poller cắt 01:00:32Z |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. Ghi nhận: cửa sổ RAM đủ (23:47–00:16Z) trùng đúng cửa sổ tải nặng nhất phiên — nếu gate0 mở lúc đó, attempt gần như chắc chắn nhiễm tải (quyết (h) đợt 149: retry poll lại gate — nhưng gate RAM và gate tải không phải một gate; T10/parent xem có cần tách cổng tải khỏi cổng RAM không — T9 chỉ nêu dữ kiện, không đề xuất).

### 2.5 B2 — 28 spike, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN (toàn bộ trên boot e9295700)

Watcher giữ nguyên phương pháp đợt 148/149 (snapshot tức thời `top -b -n1` + delta `/proc/<pid>/stat` 1 s + nr_running + D-state). **28 spike, tất cả trong 23:48:32Z–01:19:33Z trên boot e9295700; 0 spike trong 00:10–01:03Z (~53 phút yên, gồm toàn bộ lúc balloon ghim trần).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — T1 verify + U4 + probe geq 4K (7 spike) | 23:48:32–23:52:11Z | 5,67 / 9,27 / 12,15 / 13,31 / **13,47** / 8,66 / 4,60 | 7 | ffmpeg testsrc2 4K geq pid 14585 (PPID 14125 — xem §2.6) 54–68% tức thời, delta 44–101 tick/s; ffmpeg vidstabdetect pid 13860 (U4/T1, red30.mp4) 63,0%; python3 mask_anim.py (U4/T1) 25–26%; nr_running tới 22/524 | **Suite verify T1-150 (U4) + probe geq 4K 150-frame** — đỉnh phiên 13,47 = cao nhất đợt; sampler load1 max 13,64 lúc 23:50:33Z khớp watcher 13,47 lúc 23:50:58Z (pha lấy mẫu) |
| 2 — npm test lần 1 (5 spike) | 23:57:48–00:00:09Z | 3,13 / 4,49 / 3,94 / 5,31 / 4,49 | 5 | ffmpeg testsrc2 noise (demo_effects.js, PPID 35650) 134%; ffmpeg color xfade (demo_transitions.js, PPID 37064) 136%; ffmpeg testsrc2 geq (test_pixelate_render.js, PPID 38052) 116–133%, delta 111–137 tick/s | **npm test (T1-150 `npm-test-full`)** — test render/effect chạy đúng chức năng |
| 3 — bench geq + npm test lần 2 (9 spike) | 00:04:45–00:09:26Z | 4,68 / 7,04 / 7,33 / 8,04 / 8,74 / 8,95 / 8,11 / 5,95 / 3,84 | 9 | ffmpeg testsrc2 geq (bench_pixelate_geq.sh, PPID 43416) 83–123%, delta 115–129 tick/s; ffmpeg testsrc2 noise/lut (demo_effects.js lần 2 PPID 46777; demo_lut.js PPID 46565) 92,8%; ffmpeg chroma-demo 124%; python3 hole-recheck.py 16–20% | **Bench geq T0-150 (00:02:30–00:07:32Z, log /tmp/bench150.log) + npm test lần 2** — geq 4K ~0,40–0,43 fps theo log bench |
| 4 — O8 Chromium + dpkg T5 (3 spike) | 01:04:03–01:05:13Z | 3,27 / 5,79 / 4,32 | 3 | WebKitWebProcess 56,7% (T8 click-test); dpkg 59,3% (T5 --repair unpack); Chromium renderer 34–40% (T8 O8, clicktest-87o8-mask-track-headed.mjs, vite :5554) | **T8 O8 + T5 --repair** — sau khi cờ postboot mới có (01:05:33Z) |
| 5 — WebKit click-test (1 spike) | 01:08:47Z | 3,13 | 1 | WebKitWebProcess 84,8% + MiniBrowser 29,5% (T8 clicktest-84l10-webkit-loop-w1.mjs, vite l10) | **T8 harness WebKit** |
| 6 — WebKit click-test (3 spike) | 01:18:23–01:19:33Z | 3,64 / 4,14 / 3,34 | 3 | WebKitWebProcess 6,3–6,6% tức thời + MiniBrowser (T8 clicktest-85m4-webkit-w7-hb128.mjs, vite m4); nr_running 1–4/520 — spike đuôi loadavg là chính | **T8 harness WebKit (đuôi)** |

- **Sau 00:09:26Z tới 01:04:03Z: 0 spike (~55 phút yên)** — gồm toàn bộ lúc balloon ghim trần (00:23–00:57Z); stack đo (grep/ps mỗi phút) không sinh tải đo được; ghim trần không đi kèm tải.
- **Phân biệt rõ (không nhầm với caveat F-144-T9-7):** trong 6/28 snapshot, dòng top đầu là chính `ps` của watcher (`ps -eo ... --sort=-%cpu` 100%) — artifact đã biết (watcher tự lọt top trong lúc chụp); attribution vẫn đủ nhờ dòng thứ 2 trong cùng snapshot + `top -b -n1` + delta tick (vd spike 23:50:58Z: dòng 2 là ffmpeg 14585 57,8%; spike 01:08:47Z: dòng 2 là WebKitWebProcess 84,8%). Khác đợt 148 (ps 100% trong 1 snapshot), đợt này 6 lần — T9 ghi rõ để T10 không đọc nhầm dòng top.
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. **Kết luận phương pháp (F-147-T9-6 vẫn đóng):** snapshot tức thời + delta tick + nr_running đã quy được 28/28 spike đợt này.
- **Delta tick lớn nhất đợt: 137 tick/s** (pid 39860, ffmpeg testsrc2 geq 1920x1080, test_pixelate_render.js, spike 00:00:09Z); bench geq 4K 115–129 tick/s; probe 14585 44–101 tick/s. (Đợt 149: max 141 tick/s.)

### 2.6 Truy chủ ffmpeg testsrc2 — QUY ĐƯỢC CHỦ (quyết parent (p) đợt 149 — ĐÓNG họ F-147/148/149-T9-3)

- **Chia việc theo quyết (p):** T5-150 kiểm cây process/PID cha/dòng lệnh (`testsrc2-watch.sh`, poll 10 s, chụp ngay khi xuất hiện); T9-150 kiểm từ phía sampler/spike (spike nào do testsrc2 gây ra, delta tick/s, thời điểm xuất hiện). T9 không điều tra lại từ đầu — đối chiếu chéo dưới đây.
- **Kết quả T5-150 (§7 LIMITS T5): 101 HIT, 41 PID ffmpeg testsrc2 riêng biệt, 10 PPID — 39/41 PID gắn tên script:**
  - PPID 35441 → **demo_lut.js** (1 PID, testsrc2 + lut3d cartcut-ocean.cube → /tmp/itest/lut/);
  - PPID 35650 → **demo_effects.js** (2 PID, noise + pixelate geq → /tmp/itest/effects/);
  - PPID 38052 → **test_pixelate_render.js** (9 PID, geq mod(X,13)/mod(X,2) → /tmp/itest/pix-test/);
  - PPID 43416 → **bench_pixelate_geq.sh** (14 PID, geq mọi K, `-frames:v 10/60`, `-f null -` — khớp từng ký tự dòng 31–32 file .sh);
  - PPID 47967 → **demo_sticker.js** (1 PID, testsrc2 + 3 sticker PNG → /tmp/itest/sticker/);
  - PPID 14125 → **chưa gắn tên file duy nhất — cùng họ pixelate** (1 PID: 14585, testsrc2 4K `:duration=5` + geq, cwd repo-1, thoát bình thường);
  - PPID 65260 → **encode HEVC tổng hợp ngoài repo** (1 PID: 65262, testsrc2 1920x1080 duration=2 + sine 440 Hz → libx265/aac → /tmp/round76-d8/hevc-a.mp4; grep toàn repo KHÔNG có script nào chứa `round76-d8`/`hevc-a`).
  - 3 capture giả đầu phiên (shell 4315, watcher 4318, subshell 4333 — watcher T5 match nhầm chính chuỗi "testsrc2" trong cmdline của mình) đã loại trước khi đếm; log giả lưu riêng `testsrc2-watch.log.bak-falsepositive` (F-150-T5-1).
- **Đối chiếu từ phía T9 (sampler/spike):**
  - **21/28 spike do testsrc2 gây ra** (cụm 1: 5/7 spike — 14585; cụm 2: 5/5; cụm 3: 9/9 — bench + demo lần 2; cụm 4–6: 0 — T8/dpkg, không testsrc2). Mọi PID testsrc2 xuất hiện trong spike T9 đều nằm trong 41 PID của T5 (14585, 35943, 38636, 39413, 39860, 44611, 44999, 45451, 45674, 45862, 47058, 49622, …) — **0 spike ngoài danh sách 41 PID**.
  - PID 65262 (HEVC ngoài repo) **không gây spike nào ≥3,0** trong phiên T9 (không xuất hiện trong b2-spikes.log) — T5 ghi nó chạy 00:08 elapse, ngoài cửa sổ spike; T9 không có dữ kiện tải về nó, không phán thêm.
  - PID 14585 (không gắn tên file duy nhất): phía T9 chỉ có thêm — cmdline giống họ bench geq (`testsrc2=size=3840x2160:rate=30:duration=5` + geq mod(X,13), `-f null -`); bench script chính thức (`bench_pixelate_geq.sh`, đợt 150, T0) dùng `-frames:v` chứ KHÔNG dùng `:duration=5` — nên 14585 không phải từ file .sh đó; nó khớp mẫu "chạy lẻ 150 frame 4K geq" mà header bench script nhắc tới ("150 frame từng chạy >7 phút chưa xong"). Cha trực tiếp 14125 đã chết trước khi cả T5 lẫn T9 chụp được cây đầy đủ — **T9 ghi "không quy được chủ chắc chắn" cho riêng PID 14585** (như quyết (p) dặn: kiểm không xác định được thì ghi là không quy được và thôi — không mở điều tra đầy đủ). Khả năng cao nhất (không chứng minh được): tác giả bench (T0-150) chạy lẻ trước khi viết script — T9 không gán.
- **Kết luận chung cho quyết (p) (đồng thuận T5 §7 + T9): testsrc2 KHÔNG phải sót từ test render (không có process nào kẹt lại cần dọn — mọi job đều thoát bình thường trong vài giây tới ~7 phút), KHÔNG phải process ngoài lạ — toàn bộ là test render/effect đang chạy đúng chức năng trong đợt 150. KHÔNG sửa test, KHÔNG mở điều tra đầy đủ.** Họ F-147/148/149-T9-3 ĐÓNG ở đợt này.
- Ghi chú thêm: testsrc2 xuất hiện 4 đợt liên tiếp (147, 148, 149, 150) vì **cùng một họ test render (pixelate geq + demo effects) chạy lại mỗi đợt** — không phải một process dai dẳng sống qua các đợt (mỗi PID đều ngắn hạn; boot đổi mỗi đợt).

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN; CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ tư liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149/150 giữ nguyên): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.164.956 kB = 2.114,2 MiB = 34,41% guard lúc 00:09:35Z** — xa guard 4.126.500 kB. Đối chiếu T5-150 (sampler riêng): max 37,23% guard, 0 mẫu ≥ guard — **khớp với T9** (chênh ~2,8 điểm phần trăm — pha lấy mẫu).
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ tư liên tiếp (147, 148, 149, 150).** Cơ chế tự động armed cả phiên (sampler `round150-t9/sampler.sh`, pid 4118, chạy 23:43:32–01:19:38Z, 97 mẫu đều đặn — xem §5) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→150 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, 2.220, **2.165**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 23:43:32–01:19:38Z (97 mẫu đều đặn, không gap, một boot); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 149 nằm trong dir round149-t9 nên không chặn đợt này (dir mới round150-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-150-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này — import KHÔNG làm lại theo brief, đã xác minh đợt 147):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-150-birefnet/out-birefnet-150.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148/149):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-150-T9-5); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-150-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l); T10 phán ô nhiễm nếu xảy ra). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) KHÔNG tái diễn đợt này: không reboot giữa phiên, sampler sống trọn phiên (F-150-T9-6) — dữ kiện này ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này".**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot e9295700: 0 dòng "No space left" / ENOSPC** (kiểm tra 01:20Z, `journalctl -b -0 --grep` — "No entries"). Journal chỉ liệt kê **1 boot** (`journalctl --list-boots`: chỉ e9295700, first entry 23:32:25Z) — journald không giữ lại journal của boot 802f358f (volatile), nên **không kiểm được ENOSPC trên boot cũ sau reboot** — ghi rõ giới hạn này (T5/T6 có nguồn khác thì đối chiếu).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=323, i=323, i=308, i=308) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 308 chỉ còn ~0,20 vite — **sâu nhất từ trước tới nay dưới 1 vite đầy đủ**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #40 (trước phiên) — KHÔNG reboot giữa phiên

- **Boot lúc mở đợt 150 = e9295700-bda0-4a9b-8aab-4dd57661212e** (btime **23:32:09Z** — `uptime -s` 23:32:09 + `/proc/stat` btime 1795131129 KHỚP nhau; T5-150 cũng ghi btime này; /proc/1 offset ~10 s theo mẫu các đợt trước). Reboot #40 xảy ra TRƯỚC khi đợt 150 mở (23:35:51Z), trong lúc T10-149 đóng sổ (T1-150 kiểm lại claim đóng sổ 149 — T9 không phán).
- **KHÔNG có reboot giữa phiên T9:** sampler 97/97 mẫu cùng boot e9295700 (23:43:32Z–01:19:38Z); boot_id lúc đóng vẫn e9295700; tuổi boot lúc T9 đóng ~1h47m. **Sampler + B2 watcher sống trọn phiên, KHÔNG cần khởi động lại** (khác đợt 149: chết theo reboot #39, T9 khởi động lại bằng tay, gap 87 s). Quyết (q) "không cần cơ chế tự hồi phục lúc này" được dữ kiện này ủng hộ (xem F-150-T9-6).
- **Tuổi thọ boot 802f358f:** btime 21:23:51Z → btime boot mới 23:32:09Z = **7.698 s = 2h08m18s** (stat→stat). T7/T2 đối chiếu mốc neo khi gộp. (T2-150: gap #39 chứng nhận dạng khoảng [4.996, 5.000] s — xem §0.)
- **Không có nghịch lý đồng hồ trong dữ kiện T9:** btime boot mới 23:32:09Z muộn hơn mẫu cuối sampler T9-149 (22:46:07Z) và muộn hơn mọi timestamp T9-150 — thứ tự thời gian nhất quán. T9 không phán tranh chấp clock T1–T2 (đã chốt giữ khoảng rộng theo quyết (b) đợt 149).
- Các cờ .done lúc T9 đóng (01:20Z): t0, t1, t2, t4 (4/9 — T5/T6/T7/T8 còn chạy; chỉ còn T9 chưa đóng lúc 01:20Z).

### 5.2 T5-150 — replay + cờ postboot (T9 chỉ ghi lại để đối chiếu, T5 là chủ quản)

- Replay apt trên boot e9295700 **KHÔNG tới trong 60'** (watcher timeout 00:44:15Z) → **--repair 1 lần 00:50:59–01:04:59Z** (GST symlink + apt-get update) → re-check PASS → **cờ mới POSTBOOT_PASS 01:05:33Z poll=1**. Cache apt **0 .deb lúc mở — lần thứ 2 liên tiếp không sống qua reboot** (quyết (l) đợt 149: chỉ ghi nhận). T9 không kết luận về replay (T5 là chủ quản). Hệ quả trực tiếp cho T4: cờ mới có SAU khi poller T4 cắt (01:00Z) nên #22 vẫn 0 attempt đợt này (xem §2.3).

## 6. Sai số của chính T9 (ghi rõ)

- **F-150-T9-1 — Headroom 323 → 308: dưới ngưỡng lần thứ mười liên tiếp, tỉ lệ/vite ~0,20 lúc đóng (sâu nhất từ trước tới nay).** Không phải sai số đo (2 lần đo mở đợt chênh 0, 2 lần đo đóng phiên chênh 0; T5 đối chiếu độc lập 318 trên cùng boot — chênh 5 watch, sai số pha lấy mẫu). Ghi rõ: quyết "chỉ theo dõi" (r) đợt 149 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động. Trần 63.747 không đổi trong phiên.
- **F-150-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ tư liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-150-T9-3 — ffmpeg testsrc2 QUY ĐƯỢC CHỦ (ĐÓNG họ F-147/148/149-T9-3):** 39/41 PID gắn tên script (T5 §7: demo_lut.js, demo_effects.js, test_pixelate_render.js, bench_pixelate_geq.sh, demo_sticker.js); phía spike T9: 21/28 spike do testsrc2, tất cả khớp 41 PID của T5, **0 spike ngoài danh sách**. Hai PID còn lại ghi rõ: 14585 (cùng họ pixelate, không gắn tên file duy nhất — cha 14125 chết trước khi chụp cây; T9 ghi "không quy được chủ chắc chắn" cho riêng PID này, không gán); 65262 (HEVC tổng hợp ngoài repo, không gây spike nào ≥3,0 — T9 không có dữ kiện tải về nó). Kết luận chung (đồng thuận T5): không phải sót, không process ngoài, không sửa test, không điều tra thêm.
- **F-150-T9-4 — T9 KHÔNG phán verdict #22, không phán B4 đúng/sai — chỉ đối chiếu dữ kiện:** T4 đã xuất bản LIMITS nên T9 trích verdict T4 (#22 VẪN MỞ; 0 attempt; gate0 khong-dat 97/97; poller hết hạn 01:00Z exit 5) + bảng sampler độc lập §2.4. T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối). Ghi nhận: cửa sổ RAM đủ (23:47–00:16Z) trùng đúng cửa sổ tải nặng nhất phiên — nếu gate0 mở lúc đó, attempt gần như chắc chắn nhiễm tải (load1 tới 13,64); T9 chỉ nêu dữ kiện, không đề xuất tách cổng.
- **F-150-T9-5 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148/F-149-T9-5):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành.
- **F-150-T9-6 — KHÔNG reboot giữa phiên; sampler/watcher sống trọn phiên (MỚI — khác đợt 149):** sampler pid 4118 + watcher pid 4119 chạy 23:43:32Z–01:19:38Z, 97 mẫu đều đặn, không gap, không cần khởi động lại bằng tay. Đây là dữ kiện ủng hộ quyết (q) "không cần cơ chế tự hồi phục lúc này" — nhưng T9 lưu ý: quyết (q) dựa trên "mất dữ liệu nhỏ" khi reboot giết sampler; đợt này không có reboot nên không kiểm chứng được mức mất dữ liệu khi reboot xảy ra giữa phiên (đợt 149: gap 87 s).
- **F-150-T9-7 — Chuỗi ghim trần: T9 CHỈ ĐƯA DỮ KIỆN ĐẦY ĐỦ, KHÔNG PHÁN (bài học đợt 149):** 28/97 mẫu ghim, 4 chuỗi (1 + 1 + 13 + 13); episode chính 00:30:36–00:57:37Z (26/28 mẫu ghim trong 27 phút, ngắt 2 mẫu 00:43–00:44Z); **ghim ĐỨT 00:58:37Z — quan sát được điểm kết thúc** (sampler dừng 01:19:38Z, 21 phút sau khi ghim đứt). T9 không phán đợt 150 là đợt ghim mới hay nối đợt 149 — giao T10 phán (dữ kiện: cách nhau reboot #40 + xả sâu 4,33M + ~51 phút không ghim; khoảng mù dữ kiện 22:46–23:43Z không có sampler T9 nào chạy — T10 lưu ý khi phán).
- **F-150-T9-8 — Watcher tự lọt top snapshot ở 6/28 spike (MỚI — tăng so với đợt 148: 1 lần):** dòng top đầu là chính `ps` của watcher (100%) ở các spike 23:50:58Z, 23:52:11Z, 00:08:15Z, 01:08:47Z, 01:18:23Z, 01:18:58Z. Attribution vẫn đủ nhờ dòng thứ 2 + `top -b -n1` + delta tick trong cùng snapshot (đã ghi rõ từng spike ở §2.5). T9 không sửa watcher giữa phiên (đổi công cụ đo giữa phiên sẽ làm vỡ chuỗi so sánh) — giao đợt sau xem có cần loại `ps` của chính watcher khỏi top snapshot không.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 149, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 151 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ tư liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 151 (lockfile + log theo phiên mới — lockfile đợt 150 nằm trong dir round150-t9 nên không chặn đợt 151; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức. Lần FIRE thật đầu tiên vẫn chưa kiểm chứng end-to-end (F-150-T9-2).
2. **⚠️ Headroom 323 → 308 — VẪN DƯỚI < ~1.800, lần thứ mười liên tiếp dưới ngưỡng** (quyết parent đợt 149 (r): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,20 lúc đóng — sâu nhất từ trước tới nay.** Bước giảm −8 so với đóng đợt 149 (qua reboot #40); thêm −15 trong phiên trên cùng boot. Trần 63.747 không đổi.
3. **Balloon: GHIM TRẦN TRỞ LẠI trên boot mới — 28/97 mẫu, episode chính 00:30:36–00:57:37Z (26/28 mẫu ghim trong 27 phút), ĐỨT 00:58:37Z (quan sát được điểm kết thúc — khác đợt 149)** sau đợt 149 ghi 49/125 trong 2 chuỗi (22 + 27 phút), chuỗi 2 vẫn ghim lúc đóng. **Giao T10 phán cách đếm** (đợt mới hay nối 149 — cách nhau reboot #40 + xả sâu 4,33M + ~51 phút không ghim; khoảng mù dữ kiện 22:46–23:43Z). Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146.
4. **ffmpeg testsrc2 — QUY ĐƯỢC CHỦ, ĐÓNG họ F-147/148/149-T9-3** (39/41 PID gắn tên script; 2 PID còn lại ghi rõ ở §2.6; 0 spike ngoài 41 PID; không sửa test, không điều tra thêm). Không còn nợ truy chủ.
5. **Lượt yên #22 VẪN MỞ, 0 attempt đợt này** (gate0 khong-dat 97/97 — cờ postboot T5 mới có 01:05:33Z, sau khi poller T4 cắt 01:00Z): T4-151 đo lại #22 với cờ mới; T5-151 theo dõi replay có khởi động đúng giờ trên boot tiếp theo không.
6. **Mù #71? ĐÓNG HOÀN TOÀN (T2-150) → CERT 71 / FULL 86, chuỗi đóng hoàn toàn 6 → 7 — chờ parent xác nhận; mù #72? (khung #115?) MỞ — giao T2-151.**
7. Các nợ đứng khác giữ nguyên từ đợt 149 §11 (G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại; mẫu (m) đã ĐÓNG theo quyết (d) đợt 149; mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143).

## Phụ lục A — Bảng sampler đầy đủ (97 mẫu: boot e9295700; 23:43:32Z 19/11–01:19:38Z 20/11; không gap)

(File gốc: `hidden_files/round150-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

Thống kê: samples: 97; mem min: 426472 kB (416.5 MiB) lúc 00:24:36Z; mem max: 2164956 kB (2114.2 MiB = 34.41% guard) lúc 00:09:35Z; mem mean: 921632 kB (900.0 MiB); count >=1024 MiB (gate A): 36/97; count >= guard 6144 MiB: 0/97; balloon frozen 6443824: 28/97 (chuỗi 1: 00:23:36Z n=1; chuỗi 2: 00:25:36Z n=1; chuỗi 3: 00:30:36–00:42:36Z n=13; chuỗi 4: 00:45:37–00:57:37Z n=13; ghim đứt 00:58:37Z); balloon min: 4330444 kB lúc 00:09:35Z; balloon max: 6443824 kB; load1 max (sampler): 13.64 lúc 23:50:33Z; load1 >=3.0 samples: 18/97; reboot gap: không có (một boot).

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-19T23:43:32Z | e9295700 | 1,129,012 | 1102.6 | 17.95% | 5,773,736 | 763,024 | 2.22 |
| 2 | 2026-11-19T23:44:32Z | e9295700 | 995,640 | 972.3 | 15.83% | 5,906,184 | 755,836 | 1.23 |
| 3 | 2026-11-19T23:45:32Z | e9295700 | 1,048,072 | 1023.5 | 16.66% | 5,795,060 | 748,192 | 0.61 |
| 4 | 2026-11-19T23:46:32Z | e9295700 | 954,548 | 932.2 | 15.17% | 5,925,080 | 751,240 | 0.30 |
| 5 | 2026-11-19T23:47:32Z | e9295700 | 1,343,896 | 1312.4 | 21.36% | 5,571,328 | 669,828 | 0.52 |
| 6 | 2026-11-19T23:48:32Z | e9295700 | 1,317,148 | 1286.3 | 20.94% | 5,290,692 | 689,204 | 5.67 |
| 7 | 2026-11-19T23:49:32Z | e9295700 | 1,244,012 | 1214.9 | 19.77% | 5,397,796 | 697,136 | 11.30 |
| 8 | 2026-11-19T23:50:33Z | e9295700 | 1,077,312 | 1052.1 | 17.12% | 5,541,572 | 698,116 | 13.64 |
| 9 | 2026-11-19T23:51:33Z | e9295700 | 1,245,124 | 1215.9 | 19.79% | 5,362,528 | 693,332 | 8.66 |
| 10 | 2026-11-19T23:52:33Z | e9295700 | 1,129,764 | 1103.3 | 17.96% | 5,510,572 | 693,992 | 3.37 |
| 11 | 2026-11-19T23:53:33Z | e9295700 | 1,169,376 | 1142.0 | 18.59% | 5,436,908 | 683,220 | 2.26 |
| 12 | 2026-11-19T23:54:33Z | e9295700 | 1,249,728 | 1220.4 | 19.86% | 5,333,228 | 690,888 | 1.79 |
| 13 | 2026-11-19T23:55:34Z | e9295700 | 1,245,456 | 1216.3 | 19.80% | 5,490,956 | 684,060 | 0.94 |
| 14 | 2026-11-19T23:56:34Z | e9295700 | 1,939,896 | 1894.4 | 30.83% | 4,725,840 | 679,540 | 2.05 |
| 15 | 2026-11-19T23:57:34Z | e9295700 | 1,806,680 | 1764.3 | 28.72% | 4,941,440 | 681,664 | 2.68 |
| 16 | 2026-11-19T23:58:34Z | e9295700 | 1,700,944 | 1661.1 | 27.04% | 5,009,608 | 676,356 | 4.32 |
| 17 | 2026-11-19T23:59:34Z | e9295700 | 1,633,120 | 1594.8 | 25.96% | 5,137,768 | 673,860 | 5.31 |
| 18 | 2026-11-20T00:00:34Z | e9295700 | 1,328,052 | 1296.9 | 21.11% | 5,298,844 | 691,316 | 3.03 |
| 19 | 2026-11-20T00:01:34Z | e9295700 | 1,213,264 | 1184.8 | 19.28% | 5,465,356 | 704,052 | 2.04 |
| 20 | 2026-11-20T00:02:34Z | e9295700 | 1,395,040 | 1362.3 | 22.17% | 5,428,724 | 700,188 | 2.54 |
| 21 | 2026-11-20T00:03:35Z | e9295700 | 1,246,076 | 1216.9 | 19.81% | 5,541,980 | 695,816 | 1.29 |
| 22 | 2026-11-20T00:04:35Z | e9295700 | 1,322,384 | 1291.4 | 21.02% | 5,501,108 | 674,396 | 4.06 |
| 23 | 2026-11-20T00:05:35Z | e9295700 | 1,231,100 | 1202.2 | 19.57% | 5,608,916 | 665,724 | 7.33 |
| 24 | 2026-11-20T00:06:35Z | e9295700 | 1,127,424 | 1101.0 | 17.92% | 5,508,216 | 675,540 | 8.04 |
| 25 | 2026-11-20T00:07:35Z | e9295700 | 1,207,248 | 1179.0 | 19.19% | 5,439,128 | 673,968 | 10.12 |
| 26 | 2026-11-20T00:08:35Z | e9295700 | 1,854,084 | 1810.6 | 29.47% | 4,849,304 | 669,088 | 7.63 |
| 27 | 2026-11-20T00:09:35Z | e9295700 | 2,164,956 | 2114.2 | 34.41% | 4,330,444 | 666,148 | 3.33 |
| 28 | 2026-11-20T00:10:35Z | e9295700 | 1,873,616 | 1829.7 | 29.78% | 4,575,952 | 671,528 | 2.26 |
| 29 | 2026-11-20T00:11:36Z | e9295700 | 2,011,920 | 1964.8 | 31.98% | 4,805,512 | 670,508 | 0.98 |
| 30 | 2026-11-20T00:12:36Z | e9295700 | 1,786,812 | 1744.9 | 28.40% | 5,028,824 | 671,160 | 0.47 |
| 31 | 2026-11-20T00:13:36Z | e9295700 | 1,587,812 | 1550.6 | 25.24% | 5,224,220 | 667,428 | 0.68 |
| 32 | 2026-11-20T00:14:36Z | e9295700 | 1,425,892 | 1392.5 | 22.66% | 5,408,084 | 667,976 | 0.25 |
| 33 | 2026-11-20T00:15:36Z | e9295700 | 1,267,284 | 1237.6 | 20.14% | 5,573,952 | 668,696 | 0.24 |
| 34 | 2026-11-20T00:16:36Z | e9295700 | 1,088,832 | 1063.3 | 17.31% | 5,723,692 | 670,272 | 0.12 |
| 35 | 2026-11-20T00:17:36Z | e9295700 | 1,018,024 | 994.2 | 16.18% | 5,829,056 | 668,444 | 0.58 |
| 36 | 2026-11-20T00:18:36Z | e9295700 | 877,304 | 856.7 | 13.94% | 5,960,480 | 669,048 | 0.21 |
| 37 | 2026-11-20T00:19:36Z | e9295700 | 781,324 | 763.0 | 12.42% | 6,078,316 | 663,516 | 0.35 |
| 38 | 2026-11-20T00:20:36Z | e9295700 | 693,924 | 677.7 | 11.03% | 6,181,036 | 662,984 | 0.20 |
| 39 | 2026-11-20T00:21:36Z | e9295700 | 595,132 | 581.2 | 9.46% | 6,280,108 | 651,652 | 0.49 |
| 40 | 2026-11-20T00:22:36Z | e9295700 | 519,456 | 507.3 | 8.26% | 6,371,640 | 644,696 | 0.51 |
| 41 | 2026-11-20T00:23:36Z | e9295700 | 442,160 | 431.8 | 7.03% | 6,443,824 | 623,060 | 0.56 |
| 42 | 2026-11-20T00:24:36Z | e9295700 | 426,472 | 416.5 | 6.78% | 6,406,524 | 615,732 | 0.49 |
| 43 | 2026-11-20T00:25:36Z | e9295700 | 458,312 | 447.6 | 7.28% | 6,443,824 | 617,376 | 0.57 |
| 44 | 2026-11-20T00:26:36Z | e9295700 | 855,868 | 835.8 | 13.60% | 6,050,608 | 609,692 | 1.60 |
| 45 | 2026-11-20T00:27:36Z | e9295700 | 754,488 | 736.8 | 11.99% | 6,164,680 | 613,896 | 0.80 |
| 46 | 2026-11-20T00:28:36Z | e9295700 | 645,536 | 630.4 | 10.26% | 6,269,912 | 613,804 | 0.68 |
| 47 | 2026-11-20T00:29:36Z | e9295700 | 534,304 | 521.8 | 8.49% | 6,364,928 | 610,724 | 0.42 |
| 48 | 2026-11-20T00:30:36Z | e9295700 | 505,472 | 493.6 | 8.03% | 6,443,824 | 612,496 | 0.19 |
| 49 | 2026-11-20T00:31:36Z | e9295700 | 481,776 | 470.5 | 7.66% | 6,443,824 | 613,452 | 0.35 |
| 50 | 2026-11-20T00:32:36Z | e9295700 | 443,412 | 433.0 | 7.05% | 6,443,824 | 619,600 | 0.62 |
| 51 | 2026-11-20T00:33:36Z | e9295700 | 463,316 | 452.5 | 7.36% | 6,443,824 | 620,072 | 0.52 |
| 52 | 2026-11-20T00:34:36Z | e9295700 | 463,664 | 452.8 | 7.37% | 6,443,824 | 623,476 | 0.43 |
| 53 | 2026-11-20T00:35:36Z | e9295700 | 502,872 | 491.1 | 7.99% | 6,443,824 | 662,404 | 0.47 |
| 54 | 2026-11-20T00:36:36Z | e9295700 | 533,132 | 520.6 | 8.47% | 6,443,824 | 740,144 | 0.61 |
| 55 | 2026-11-20T00:37:36Z | e9295700 | 507,984 | 496.1 | 8.07% | 6,443,824 | 742,432 | 0.39 |
| 56 | 2026-11-20T00:38:36Z | e9295700 | 500,344 | 488.6 | 7.95% | 6,443,824 | 742,780 | 0.62 |
| 57 | 2026-11-20T00:39:36Z | e9295700 | 474,544 | 463.4 | 7.54% | 6,443,824 | 743,740 | 0.54 |
| 58 | 2026-11-20T00:40:36Z | e9295700 | 466,180 | 455.3 | 7.41% | 6,443,824 | 747,580 | 0.26 |
| 59 | 2026-11-20T00:41:36Z | e9295700 | 478,756 | 467.5 | 7.61% | 6,443,824 | 748,108 | 0.66 |
| 60 | 2026-11-20T00:42:36Z | e9295700 | 555,840 | 542.8 | 8.83% | 6,443,824 | 731,968 | 1.61 |
| 61 | 2026-11-20T00:43:36Z | e9295700 | 679,676 | 663.7 | 10.80% | 6,318,924 | 718,168 | 1.33 |
| 62 | 2026-11-20T00:44:36Z | e9295700 | 557,140 | 544.1 | 8.86% | 6,412,572 | 697,556 | 0.78 |
| 63 | 2026-11-20T00:45:37Z | e9295700 | 505,116 | 493.3 | 8.03% | 6,443,824 | 697,096 | 0.66 |
| 64 | 2026-11-20T00:46:37Z | e9295700 | 518,028 | 505.9 | 8.23% | 6,443,824 | 694,728 | 1.01 |
| 65 | 2026-11-20T00:47:37Z | e9295700 | 522,636 | 510.4 | 8.31% | 6,443,824 | 680,476 | 1.09 |
| 66 | 2026-11-20T00:48:37Z | e9295700 | 488,324 | 476.9 | 7.76% | 6,443,824 | 682,568 | 0.71 |
| 67 | 2026-11-20T00:49:37Z | e9295700 | 478,560 | 467.3 | 7.61% | 6,443,824 | 678,948 | 0.32 |
| 68 | 2026-11-20T00:50:37Z | e9295700 | 447,148 | 436.7 | 7.11% | 6,443,824 | 714,572 | 0.65 |
| 69 | 2026-11-20T00:51:37Z | e9295700 | 427,272 | 417.3 | 6.79% | 6,443,824 | 708,524 | 0.68 |
| 70 | 2026-11-20T00:52:37Z | e9295700 | 446,664 | 436.2 | 7.10% | 6,443,824 | 695,932 | 0.45 |
| 71 | 2026-11-20T00:53:37Z | e9295700 | 437,748 | 427.5 | 6.96% | 6,443,824 | 687,224 | 0.33 |
| 72 | 2026-11-20T00:54:37Z | e9295700 | 443,220 | 432.8 | 7.04% | 6,443,824 | 677,704 | 0.16 |
| 73 | 2026-11-20T00:55:37Z | e9295700 | 444,020 | 433.6 | 7.06% | 6,443,824 | 678,672 | 0.19 |
| 74 | 2026-11-20T00:56:37Z | e9295700 | 442,104 | 431.7 | 7.03% | 6,443,824 | 677,004 | 0.33 |
| 75 | 2026-11-20T00:57:37Z | e9295700 | 442,764 | 432.4 | 7.04% | 6,443,824 | 675,496 | 0.24 |
| 76 | 2026-11-20T00:58:37Z | e9295700 | 773,068 | 754.9 | 12.29% | 6,050,608 | 652,808 | 0.92 |
| 77 | 2026-11-20T00:59:37Z | e9295700 | 799,128 | 780.4 | 12.70% | 6,128,644 | 654,384 | 0.61 |
| 78 | 2026-11-20T01:00:37Z | e9295700 | 777,076 | 758.9 | 12.35% | 6,136,736 | 657,848 | 0.38 |
| 79 | 2026-11-20T01:01:37Z | e9295700 | 649,016 | 633.8 | 10.32% | 6,238,868 | 657,404 | 0.17 |
| 80 | 2026-11-20T01:02:37Z | e9295700 | 898,212 | 877.2 | 14.28% | 5,255,828 | 603,692 | 1.53 |
| 81 | 2026-11-20T01:03:37Z | e9295700 | 893,072 | 872.1 | 14.19% | 5,262,804 | 609,344 | 1.92 |
| 82 | 2026-11-20T01:04:37Z | e9295700 | 1,079,392 | 1054.1 | 17.16% | 5,148,400 | 612,452 | 5.79 |
| 83 | 2026-11-20T01:05:37Z | e9295700 | 1,653,508 | 1614.8 | 26.28% | 5,261,716 | 616,124 | 2.84 |
| 84 | 2026-11-20T01:06:37Z | e9295700 | 1,411,288 | 1378.2 | 22.43% | 5,447,340 | 618,612 | 1.77 |
| 85 | 2026-11-20T01:07:37Z | e9295700 | 1,214,560 | 1186.1 | 19.30% | 5,612,952 | 619,896 | 1.05 |
| 86 | 2026-11-20T01:08:37Z | e9295700 | 810,640 | 791.6 | 12.88% | 5,425,832 | 613,948 | 3.08 |
| 87 | 2026-11-20T01:09:38Z | e9295700 | 860,312 | 840.1 | 13.67% | 5,359,220 | 612,552 | 1.77 |
| 88 | 2026-11-20T01:10:38Z | e9295700 | 839,424 | 819.8 | 13.34% | 5,376,852 | 615,140 | 0.77 |
| 89 | 2026-11-20T01:11:38Z | e9295700 | 801,008 | 782.2 | 12.73% | 5,497,676 | 613,204 | 0.32 |
| 90 | 2026-11-20T01:12:38Z | e9295700 | 686,760 | 670.7 | 10.92% | 5,610,240 | 613,552 | 0.45 |
| 91 | 2026-11-20T01:13:38Z | e9295700 | 670,828 | 655.1 | 10.66% | 5,719,624 | 612,560 | 0.26 |
| 92 | 2026-11-20T01:14:38Z | e9295700 | 606,576 | 592.4 | 9.64% | 5,819,244 | 606,316 | 0.57 |
| 93 | 2026-11-20T01:15:38Z | e9295700 | 1,098,260 | 1072.5 | 17.46% | 5,272,212 | 602,804 | 0.82 |
| 94 | 2026-11-20T01:16:38Z | e9295700 | 1,014,036 | 990.3 | 16.12% | 5,366,048 | 606,968 | 0.74 |
| 95 | 2026-11-20T01:17:38Z | e9295700 | 834,032 | 814.5 | 13.26% | 5,495,096 | 614,396 | 1.45 |
| 96 | 2026-11-20T01:18:38Z | e9295700 | 756,028 | 738.3 | 12.02% | 5,611,044 | 614,372 | 4.46 |
| 97 | 2026-11-20T01:19:38Z | e9295700 | 650,568 | 635.3 | 10.34% | 5,719,496 | 616,128 | 3.15 |


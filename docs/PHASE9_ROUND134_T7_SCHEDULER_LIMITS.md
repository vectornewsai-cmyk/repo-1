# PHASE9 ROUND134 T7 — 2 slot thiếu MỚI trong khung chết reboot (HB 22:50:50Z + DR 23:00Z) + HB muộn +887 s lần thứ 5 đúng mẫu :35:37 + started_at vcut đợt 133 BỊ VIẾT LẠI (+3.985 s, lần thứ 4 liên tiếp)

- **Luồng:** T7 đợt 134 (lượt cron 06:35 +07 18/11/2026 = 23:35:51Z 17/11). Boot lúc làm việc: btime **23:26:58Z** (theo `uptime -s` + `who -b` lúc 23:45–23:53Z); boot_id **d2e66749** theo brief mở đợt + cờ `round134-t9.done` (luồng này KHÔNG tự xác minh boot_id — T5/T6 là chủ quản phân loại boot). Reboot xảy ra TRƯỚC khi lượt 134 bắt đầu (23:26:58Z < 23:35:51Z), trong khoảng trống giữa đợt 133 và đợt 134.
- **Nhiệm vụ:** CHỈ đếm slot MỚI từ sau mốc 20:46Z 17/11 (lúc T7 đợt 133 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (chỉ đọc `scheduler.job_runs` + file LIMITS/NOTES đợt 127/129/130/131/132/133 + cờ `.done` đợt 134). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler / reboot, ngoài repo).

## 1. Verdict

**CỬA BẨN — 2 slot thiếu MỚI (đợt 133 sạch lại sau đợt 132 gãy 3 thiếu; đợt này gãy lại): heartbeat 1 thiếu mới + deterministic-doctor 1 thiếu mới, cả hai đều nằm trong khung chết reboot.**

| Job | Slot trong cửa | Có | Thiếu mới | Muộn lớn |
|---|---|---|---|---|
| heartbeat | 7 | 6 | 1 (22:50:50Z) | 1 (+887 s, slot 23:20:50Z) |
| deterministic-doctor | 3 | 2 | 1 (23:00Z) | 0 |
| vcut-build-loop | 0 slot 3h nào tới hạn trong cửa bị thiếu (đợt 133 đã `succeeded`, đợt 134 đang `running`) | — | 0 | — |

**Dị thường muộn: CÓ 1 dị thường mới — HB 23:20:50Z jitter +887 s** (started 23:35:37Z), **đúng mẫu "+887 s, start :35:37Z, 14 s trước vcut dispatch" lần thứ 5** (đợt 127, 129, 130, 132, 134 — xem §2.3). Kỷ lục muộn HB +1.252 s KHÔNG tái hiện (đợt 129, tái hiện đợt 130).

**Dị thường started_at: TÁI DIỄN LẦN THỨ 4 LIÊN TIẾP — và lần này có bằng chứng VIẾT LẠI trực tiếp.** Lượt vcut đợt 133 (run `6f3eba37`) mà T7 đợt 133 đã thấy `running` lúc ~20:45Z với `started_at` 20:35:51Z (jitter 0 s) thì nay ghi `started_at_utc` **21:42:16Z** — chênh **+3.985 s** so với giờ hẹn 20:35:51Z, và **36 s sau btime boot mới 21:41:40Z**. Cùng một run_id, hai giá trị `started_at` khác nhau ở hai thời điểm kiểm → trường này đã bị ghi đè sau reboot (xem §2.4).

- Cập nhật lũy kế (cùng phương pháp đợt 125–133): heartbeat **43/191 slot thiếu** (số thiếu +1, mẫu số +7); deterministic-doctor **48/166 slot thiếu** (số thiếu +1, mẫu số +3).

## 2. Bằng chứng

### 2.1 Slot có / thiếu trong cửa 20:46Z → 23:53:42Z 17/11

Cửa kiểm ~3h08'. Ba lần kiểm (lần 1 ~23:47Z, lần 2 ~23:52Z, lần 3 ~23:53:42Z) **khớp hoàn toàn nhau** — đủ quy tắc "kiểm 3 lần trước khi kết luận THIẾU". Lúc lần 3, slot HB thiếu đã quá giờ hẹn 63'52", slot DR thiếu đã quá 53'42" — vượt xa kỷ lục muộn HB +1.252 s (~21') và DR chưa từng muộn (mọi lượt DR đều jitter 0 s trong toàn bộ hồ sơ).

**Heartbeat (lưới :20:50/:50:50Z): 6/7 có, 1 thiếu MỚI, 1 muộn lớn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:50:50 (20:50:50Z) | 3230b2fe | 20:45:34 | −316 s | CÓ |
| 04:20:50 (21:20:50Z) | 06a70286 | 21:15:34 | −316 s | CÓ |
| 04:50:50 (21:50:50Z) | f74049b8 | 21:45:34 | −316 s | CÓ |
| 05:20:50 (22:20:50Z) | 49a118e1 | 22:15:34 | −316 s | CÓ |
| **05:50:50 (22:50:50Z)** | — | — | — | **THIẾU MỚI** |
| 06:20:50 (23:20:50Z) | c414625b | 23:35:37 | **+887 s** | CÓ (muộn lớn) |
| 06:50:50 (23:50:50Z) | ebaefbd0 | 23:45:34 | −316 s | CÓ |

- Các lượt có đều `succeeded`, attempt=1, error_text=null. 5 lượt jitter −316 s (mẫu chuẩn); 1 lượt +887 s (xem §2.3).
- **Quy ước biên (ghi rõ để T7-135 kiểm toán):** slot 23:50:50Z được đếm trong cửa này vì giờ hẹn của nó (23:50:50Z) ≤ thời điểm kiểm lần 3 (23:53:42Z) — đúng quy tắc T7-133 đã dùng (chỉ đếm slot có `scheduled_for` ≤ lúc kiểm cuối; T7-133 loại 20:50:50Z vì lúc đó chưa tới giờ hẹn). Run của nó đã tồn tại từ 23:45:34Z (trước cả lần 1), nhưng chỉ tới lần 3 nó mới đủ điều kiện đếm theo giờ hẹn. Cửa sổ T7-135 vì vậy bắt đầu sau 23:53:42Z, slot HB tiếp theo là 00:20:50Z 18/11.

**Deterministic-doctor (lưới :00:00Z): 2/3 có, 1 thiếu MỚI.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 04:00 (21:00Z) | 17bf4062 | 21:00:00 | 0 s | CÓ |
| 05:00 (22:00Z) | b5df6786 | 22:00:00 | 0 s | CÓ |
| **06:00 (23:00Z)** | — | — | — | **THIẾU MỚI** |

- Cả 2 lượt có đều `succeeded`, attempt=1, error_text=null, jitter 0 s.

### 2.2 Đối chiếu lịch sử: các slot thiếu cũ vẫn thiếu — không đổi

Trong danh sách limit=15 ở cả ba lần kiểm:

- HB 16:20:50Z và 16:50:50Z (thiếu mới đợt 132) **vẫn vắng**; DR 17:00Z (thiếu mới đợt 132) **vẫn vắng**; DR 11:00Z (thiếu đợt 130) **vẫn vắng**; DR 07:00Z/08:00Z (thiếu đợt 129) **vẫn vắng**; DR 05:00Z (thiếu đợt 128) **vẫn vắng**.
- Ngoài cửa sổ limit=15 lần này nên KHÔNG tái xác minh được: HB trước 15:20:50Z 17/11 (gồm 13:50:50Z thiếu đợt 129); DR trước 03:00Z 17/11 (gồm DR 15:00/18:00+07 16/11 thiếu đợt 125/126). Ghi rõ là ngoài cửa sổ, không kết luận đổi/không đổi.
- Các kết luận đợt 125–133 không đổi.

### 2.3 Dị thường muộn HB +887 s — lần thứ 5 đúng mẫu ":35:37Z, 14 s trước vcut dispatch"

- HB slot 23:20:50Z (run `c414625b`): scheduled 1794957650, started 1794958537 = **23:35:37Z**, jitter **+887 s**. `finished_at` = 23:35:37Z (cùng giây), `succeeded`, attempt=1.
- Mẫu này nay có **5 lần xuất hiện, đều start :35:37–:35:39Z, 12–14 s trước một lượt vcut dispatch :35:51Z**:
  - Đợt 127: HB 09:20:50+07, +887 s, start 02:35:37Z, 14 s trước vcut 02:35:51Z.
  - Đợt 129: HB 15:20:50+07, +889 s, start 08:35:39Z, 12 s trước vcut đợt 129 (08:35:51Z).
  - Đợt 130: HB 18:20:50+07, +888 s, start 11:35:38Z, 13 s trước vcut đợt 130 (11:35:51Z).
  - Đợt 132: HB 00:20:50+07, +887 s, start 17:35:37Z, 14 s trước vcut đợt 132 (17:35:51Z).
  - **Đợt 134: HB 06:20:50+07, +887 s, start 23:35:37Z, 14 s trước vcut đợt 134 (23:35:51Z).**
- Họ +887/+888/+889 s (tức ~900 s − 11–13 s) là một họ riêng, khác họ +1.251/+1.252 s (đợt 127 start 01:41:41Z; đợt 129/130 start 07:41:42Z/10:41:42Z — đều :41:42Z, không gần lượt vcut nào). Kỷ lục muộn HB vẫn là **+1.252 s** (đợt 129, tái hiện đợt 130) — +887 s đợt này không vượt.
- Chỉ ghi nhận mẫu; cơ chế là việc của T5/T6 (xem §2.5 về tương quan với khung chết reboot).

### 2.4 Dị thường started_at lượt vcut — lần thứ 4 liên tiếp, nay có bằng chứng VIẾT LẠI

| Lượt vcut | run_id | scheduled (Z) | started_at ghi lúc kiểm trước | started_at ghi nay | Jitter nay | btime boot sau đó | started − btime |
|---|---|---|---|---|---|---|---|
| Đợt 130 | 9462a1f3 | 11:35:51 | — | 13:03:22 | +5.251 s | (xem T7-130) | — |
| Đợt 131 | 8b82d3c1 | 14:35:51 | — | 15:02:16 | +1.585 s | (T7-133 ghi: 46 s sau btime) | 46 s |
| Đợt 132 | c6948429 | 17:35:51 | — | 19:34:46 | +7.135 s | 19:34:15Z | 31 s |
| **Đợt 133** | **6f3eba37** | **20:35:51** | **20:35:51Z (T7-133 thấy running ~20:45Z, jitter 0 s)** | **21:42:16** | **+3.985 s** | **21:41:40Z** | **36 s** |
| Đợt 134 | 19a360f1 | 23:35:51 | — | 23:35:51 (đang `running` lúc kiểm lần 3, 23:53Z) | 0 s | 23:26:58Z (TRƯỚC lượt) | — |

- Chuỗi jitter: đợt 130 **+5.251 s** → đợt 131 **+1.585 s** → đợt 132 **+7.135 s (lớn nhất)** → đợt 133 **+3.985 s**. Lần thứ 4 liên tiếp mẫu lạ xuất hiện (đợt 133 là lần thứ 4, không phải lần thứ 3 như T7-133 đã viết khi đó — T7-133 đếm tới đợt 132).
- **Bằng chứng viết lại (mới):** cùng run_id `6f3eba37`, T7-133 ghi `started_at` 20:35:51Z (thấy trực tiếp lúc ~20:45Z); nay DB ghi 21:42:16Z. Trường `started_at_utc` đã thay đổi giữa hai lần kiểm; sự kiện duy nhất xen giữa là reboot btime 21:41:40Z. `started_at` mới = btime + 36 s — cùng họ 31 s (đợt 132) / 46 s (đợt 131) sau btime. Giả thuyết đứng (chưa chứng minh): scheduler ghi lại `started_at` khi hồi phục sau reboot; bằng chứng ủng hộ: 3/3 lần gần nhất started mới đều rơi vào 31–46 s sau btime; bằng chứng phản bác / chưa có: chưa quan sát được lần ghi nào trực tiếp, và đợt 134 (reboot TRƯỚC lượt) hiện vẫn jitter 0 s — nếu reboot xảy ra GIỮA lượt 134 thì mới biết started_at có bị viết lại nữa không (T10-134 kiểm lại lúc đóng).
- Hệ quả số liệu: thời lượng đợt 133 theo mốc ghi nay là 21:42:16Z → 22:15:08Z = **1.972 s**; thời lượng tường thật là 20:35:51Z → 22:15:08Z = **5.957 s**. Khoảng cách thật đợt 132 finished (20:31:03Z) → đợt 133 started thật (20:35:51Z) vẫn là **288 s** (4'48") như T7-133 đã ghi — chỉ mốc `started_at` ghi trong DB đổi, mốc thật không đổi.
- Lượt đợt 133 `finished_at_utc` 22:15:08Z (`succeeded`) — sau khi T10-133 đóng sổ 22:12Z 3'08"; ghi nhận, không suy diễn (phần kết thúc lượt của parent có thể kéo dài sau khi T10 đóng).
- Khoảng cách đợt 133 finished (22:15:08Z) → đợt 134 started (23:35:51Z): **4.843 s** (1h20'43").

### 2.5 Tương quan slot thiếu / muộn với reboot và khung chết (chỉ ghi mốc)

- Reboot **3e7a7b51 → d2e66749, btime 23:26:58Z**: xảy ra SAU khi đợt 133 finished (22:15:08Z) và TRƯỚC khi đợt 134 started (23:35:51Z) — tức trong khoảng trống giữa hai đợt, KHÔNG phải giữa lượt 134 đang chạy. Theo định nghĩa gộp của T10-133 §10.2 ("mọi reboot quanh đợt"), đây là ứng viên sự kiện thứ 8 liên tiếp; việc chốt số là của T10-134 (theo F-133-6, dùng MỘT định nghĩa duy nhất — định nghĩa gộp §10.2 — và ghi rõ định nghĩa khi dùng nhãn "lần thứ N").
- **Khung im lặng phía scheduler: (22:15:34Z, 23:35:37Z] (~1h20'03").** Hoạt động scheduler cuối trước khung: HB slot 22:20:50Z start 22:15:34Z (bình thường, −316 s); DR 22:00Z chạy 22:00:00Z. Hoạt động đầu sau khung: HB muộn start 23:35:37Z; vcut đợt 134 start 23:35:51Z. Btime 23:26:58Z nằm trong khung.
- Cả 3 dị thường đợt này đều rơi vào khung im lặng: giờ start bình thường của HB thiếu 22:50:50Z là 22:45:34Z; giờ hẹn DR thiếu 23:00Z là 23:00:00Z; giờ start bình thường của HB muộn 23:20:50Z là 23:15:34Z — cả ba đều nằm trong (22:15:34Z, 23:26:58Z]. Đây là tương quan, chưa phải chứng minh nhân quả: ranh giới chính xác của khung chết là việc của T2 (mù #53) và T5/T6.
- **Bất đối xứng ghi nhận, chưa giải thích:** HB 23:20:50Z (start bình thường 23:15:34Z, trong khung) ĐÃ chạy muộn lúc 23:35:37Z sau khi hồi phục, nhưng HB 22:50:50Z (start bình thường 22:45:34Z, cũng trong khung) và DR 23:00Z thì KHÔNG chạy bù — vẫn vắng sau 3 lần kiểm. Không suy diễn cơ chế (nợ cơ chế drop đóng theo hướng đợt 125).
- **Không có reboot mới giữa lượt 134** trong lúc T7 làm việc (boot d2e66749, btime 23:26:58Z giữ nguyên 23:45–23:53Z).

### 2.6 vcut-build-loop: 0 slot thiếu trong cửa

| Slot (+07) | run_id | Trạng thái |
|---|---|---|
| 03:35:51 (đợt 133) | 6f3eba37 | `succeeded`, finished 22:15:08Z (started_at đã bị viết lại — xem §2.4) |
| 06:35:51 (đợt 134) | 19a360f1 | `running` lúc kiểm lần 3 (~23:53Z), jitter 0 s |

- Không có slot 3h nào trong cửa bị thiếu. Kiểm lại limit=5 lần 2 + lần 3 khớp lần 1.

### 2.7 Ghi nhận thời gian về boot (không suy đoán nguyên nhân)

- Boot lúc làm việc btime **23:26:58Z** (`uptime -s` + `who -b` lúc 23:45Z và 23:53Z, trùng nhau); boot_id **d2e66749** theo brief mở đợt + cờ `round134-t9.done` (không tự xác minh boot_id).
- Cờ `round-in-progress.md` TỒN TẠI trên đĩa lúc kiểm (mở đợt 134 23:35Z, hạn cứng 02:00Z 18/11) — KHÔNG xóa (chỉ T10 xóa).
- T9 đã đo trên boot này: replay xong 23:37:47Z (dpkg.log 1.545 dòng); balloon xả mạnh; RAM hồi lớn giữa lượt — xem cờ `round134-t9.done` (chỉ tham chiếu, không kiểm lại).

### 2.8 Cờ .done các luồng khác (chỉ quan sát, không can thiệp)

Lúc kiểm lần 3 (~23:53Z): **2/9 cờ `.done` đã có** — `round134-t3-fix.done` (23:48Z, sửa instrumentation log draw xong, preview.tsx md5 805409f0 → 530e10a7…) và `round134-t9.done` (23:51Z, headroom 2.505). Các thư mục làm việc t1/t2/t3/t4/t5/t6/t8/t9 đã có trên đĩa nhưng chưa có cờ `.done` chính (T3 đang chờ cờ T4 để chạy bước 2) — bình thường giữa lượt, không có luồng nào quá hạn hay mất tích để báo. T10 sẽ chốt đủ 9/9 lúc đóng.

## 3. Ghi chú phương pháp

1. Nguồn duy nhất: `scheduler.job_runs` (HB limit=15 ×3 lần; DR limit=15 ×3 lần; vcut limit=5 ×3 lần). Lưới kỳ vọng như đợt 125–133.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>`.
4. Cửa kiểm đợt này ~3h08' (20:46Z → 23:53:42Z 17/11), đủ 7 slot HB + 3 slot DR. Cả 2 slot thiếu đều được kiểm 3 lần (lần 1 ~23:47Z, lần 2 ~23:52Z, lần 3 ~23:53:42Z) trước khi kết luận THIẾU.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm lần cuối (xem §2.1 về slot 23:50:50Z) — T7-135 bắt đầu cửa sau 23:53:42Z.

## 4. Cập nhật lũy kế (nối tiếp đợt 133, cùng phương pháp)

- Heartbeat: 42/184 → **43/191 slot thiếu** (cửa sổ 14/11 07:50:50 → 18/11 06:50:50 +07). Kiểm toán cửa sổ: 184 + 7 slot mới = 191 ✓. Số thiếu +1.
- Deterministic-doctor: 47/163 → **48/166 slot thiếu** (cửa sổ 11/11 09:00 → 18/11 06:00 +07). Kiểm toán: 163 + 3 slot mới = 166 ✓. Số thiếu +1.
- Tỉ lệ thiếu lũy kế: HB 43/191 = 22,5% (giảm từ 22,8% — mẫu số tăng nhanh hơn số thiếu); DR 48/166 = 28,9% (tăng từ 28,8%).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler: nợ vẫn đóng theo hướng đợt 125** (đã xác minh + đã phân loại là scheduler-side drop; chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM). Đợt này CÓ dữ liệu mới (2 thiếu + 1 muộn, đều trong khung chết reboot — xem §2.5) nhưng không giao điều tra tiếp từ trong VM bằng cùng phương pháp; tương quan khung chết/reboot là việc của T2/T5/T6.
2. **Mẫu lạ started_at lượt vcut — LẶP LẠI lần thứ 4 liên tiếp (+3.985 s, đợt 133), nay có bằng chứng VIẾT LẠI trực tiếp** (cùng run_id, hai giá trị `started_at` khác nhau trước/sau reboot). Chỉ ghi nhận; T5/T6 đối chiếu — có thể là hành vi ghi log của scheduler sau reboot, không phải lỗi đếm slot. Chuỗi: đợt 130 +5.251 s → đợt 131 +1.585 s → đợt 132 +7.135 s → đợt 133 +3.985 s. Lớn nhất vẫn là +7.135 s (đợt 132). Đợt 134 hiện jitter 0 s — T10-134 kiểm lại lúc đóng xem reboot giữa lượt có viết lại nữa không.
3. **Dị thường muộn HB +887 s: TÁI HIỆN lần thứ 5 đúng mẫu :35:37Z trước vcut dispatch** (đợt 127/129/130/132/134). Kỷ lục muộn HB vẫn là +1.252 s (đợt 129, tái hiện đợt 130) — không đổi.
4. **Reboot quanh ranh giới đợt: 3e7a7b51 → d2e66749 (btime 23:26:58Z), trong khoảng trống giữa đợt 133 và 134** — ứng viên sự kiện thứ 8 liên tiếp theo định nghĩa gộp T10-133 §10.2; T10-134 chốt số. T5 phân loại, T6 chốt số boot #84? (mù #37).
5. **Mù #49 B / #50 / #51 / #52: KHÔNG ĐỔI** (không kiểm lại — việc của T2; mù #53 mới mở đợt 133, probe thường lệ đợt 134). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Sai số của chính T7 (F-134-T7-1)

- **F-134-T7-1 — Quyết định biên cửa sổ về slot HB 23:50:50Z (ghi rõ, không giấu):** ở lần 1 (~23:47Z) slot này chưa tới giờ hẹn nên ban đầu luồng này định loại như T7-133 đã loại slot 20:50:50Z; nhưng tới lần 3 (23:53:42Z) giờ hẹn của nó đã qua, nên theo đúng quy tắc "đếm slot có `scheduled_for` ≤ lúc kiểm cuối" nó được đếm vào cửa này (slot thứ 7, CÓ, −316 s). Hệ quả kiểm toán: mẫu số HB đợt này là +7 (không phải +6) → 43/191. Nếu T10 muốn giữ quy ước "cửa đóng ở lần kiểm đầu" thì số sẽ là 43/190 và slot 23:50:50Z chuyển sang T7-135 — hai cách đều nhất quán nội bộ, chỉ khác điểm cắt; luồng này chọn cách theo giờ hẹn ≤ lần kiểm cuối vì đó là cách T7-133 đã mô tả ("tới lúc kiểm"). Verdict (2 thiếu mới) không đổi theo cả hai cách.
- Ngoài F-134-T7-1, không có sai số nào khác: 3 lần kiểm khớp hoàn toàn; mọi jitter tính lại bằng `date -u` từ epoch thô; chuỗi +887 s và started_at đối chiếu trực tiếp với LIMITS đợt 127/129/130/131/132/133.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round134-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng slot: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round134-t7/NOTES.md` (không nằm trong repo nên không stage).

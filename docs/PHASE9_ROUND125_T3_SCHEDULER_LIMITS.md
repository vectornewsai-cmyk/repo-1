# PHASE9 ROUND125 T3 — Lượt chạy scheduler bị thiếu: điều tra heartbeat + deterministic-doctor

- **Luồng:** T3 đợt 125 (lượt cron 03:35 +07 17/11/2026). Boot lúc làm việc: `670c07f6-2299-43f6-951c-0cf1116afd6d`, uptime-s 2026-11-16 20:35:11Z (boot mới #69?, T5 xác nhận số hiệu).
- **Nhiệm vụ:** xác minh 2 lượt thiếu nêu ở LIMITS gộp đợt 124 §10 (heartbeat 17:50:50+07 + deterministic-doctor 18:00+07 16/11, nợ mở từ T3-123 §5 mục 2); quét mẫu thiếu có hệ thống; phân loại nguyên nhân; đối chiếu reboot/boot mới.
- **Phạm vi tuân thủ:** KHÔNG quét toàn workspace (cờ `round125-e4a7-done` và `round125-e4b8-done` đều chưa tồn tại lúc làm việc — chỉ đọc `cron.runs` + file mục tiêu nhỏ). Không push, không release/tag, không code giả, không đụng TTS 39 / birefnet, không kiểm lại mù #40 B hay #43 (đã chấp nhận để mở), không binary vào batch.
- **Không sửa production code. Không có test mới** (không có hành vi sai nào trên cây để tái hiện — vấn đề nằm phía scheduler, ngoài repo).

## 1. Verdict

**2 lượt thiếu CÓ THẬT — không phải do cách đọc log.** Cả hai đều không có bản ghi nào trong `cron.runs`, trong khi các lượt kề trước/sau đều có:

| Lượt thiếu | Giờ (+07 / Z) | Lượt kề có mặt (run_id) |
|---|---|---|
| heartbeat 17:50:50+07 16/11 | 10:50:50Z | 17:20:50 run `376d51ca`; 18:20:50 run `f6353856` |
| deterministic-doctor 18:00+07 16/11 | 11:00:00Z | 17:00 run `28cb30f1`; 19:00 run `8732a74d` |

**Mẫu thiếu lặp lại có hệ thống, không phải 2 điểm lẻ:**

- Heartbeat: thiếu **36/136 slot** trong cửa sổ 100 lượt gần nhất (14/11 07:50:50 → 17/11 03:20:50 +07) — khối 9 slot (15/11 07:20–11:50+07), khối 14 slot (15/11 21:50+07 → 16/11 05:50+07), khối 5 slot (16/11 09:50–11:50+07) + các singleton/cặp.
- Deterministic-doctor: thiếu **38/138 slot** (11/11 09:00 → 17/11 02:00 +07) — khối 9 giờ (15/11 07:00–15:00+07), khối 10 giờ (15/11 21:00+07 → 16/11 06:00+07), khối 3 giờ (16/11 10:00–12:00+07) + rải rác 11–14/11. **+1 lượt thiếu mới phát hiện lúc kiểm lại 20:51Z: doctor 03:00+07 17/11 (20:00Z)** — tổng 39.
- Hai job thiếu **cùng nhau**: 28/38 giờ doctor-thiếu có ≥1 lượt heartbeat thiếu cùng giờ; 29/36 slot heartbeat-thiếu rơi vào giờ doctor-thiếu.

**Nguyên nhân khả dĩ nhất: drop phía scheduler (không dispatch / không ghi bản ghi).** Không phải VM down, không phải VM bận, không phải lỗi ghi trên VM (bằng chứng §3). Cơ chế drop cụ thể chưa xác định được từ trong VM — xem nợ mở §5.

## 2. Bằng chứng

### 2.1 Đối chứng: scheduler vẫn dispatch bình thường trong các cửa sổ thiếu

- **feed-pulse-08/-12/-15: 0 thiếu** — 7/7 ngày đều có lượt chạy (vd feed-pulse-12 lúc 12:41:54+07 các ngày 10–16/11). Cùng scheduler, cùng cửa sổ thiếu của HB/DR.
- **vcut-build-loop: 0 slot thiếu** trong 40 lượt gần nhất (12–17/11) — mọi slot 3 giờ đều có bản ghi (kể cả các lượt skip ngắn 37–164 s trong các khối thiếu).
- Tất cả 100+100 lượt HB/DR có bản ghi đều `succeeded`, attempt=1, error_text=null → thiếu = không có bản ghi, không phải chạy lỗi.

### 2.2 VM down KHÔNG giải thích được lượt thiếu (bằng chứng quyết định)

Cả hai job đều **có bản ghi chạy trong các khoảng VM đã chết chắc chắn**:

- Heartbeat 00:20:50+07 17/11 (17:20:50Z, run `469e4cf7`) — trong gap #67→#68 (14:52:19Z→17:33:51Z), VM chưa boot lại.
- Heartbeat 01:20:50/01:50:50+07 17/11 (18:20:50/18:50:50Z) — trong gap #68→#69, sau lần xác nhận #68 sống cuối 18:00:02Z.
- Doctor 02:00+07 17/11 (19:00Z, run `67b985af`) — trong gap #68→#69.

→ Hai job chạy phía scheduler, không cần VM để ghi bản ghi. Trong cùng một gap VM-down, có slot chạy, có slot thiếu → **trạng thái VM không quyết định lượt thiếu**. Các lượt thiếu trùng gap reboot chỉ là tương quan thời gian, không phải nguyên nhân. (T3-123 đã chứng minh các lượt này không để lại dấu vết VM; kết luận này củng cố và mở rộng: VM-down không còn dùng được làm "đã giải thích" cho bất kỳ lượt thiếu nào.)

### 2.3 VM bận / build-loop chiếm slot: BÁC

Kiểm chồng lấp bằng `started_at_utc`/`finished_at_utc` của 40 lượt vcut-build-loop gần nhất:

- **0/38** giờ doctor-thiếu và **0/36** slot heartbeat-thiếu trùng với một lượt build-loop đang ACTIVE.
- Ngược lại, **37/100** giờ doctor-chạy có build-loop đang active.

Nếu thiếu là do VM bận thì tỉ lệ trùng phải cao hơn mức nền, không phải bằng 0 — giả thuyết bị bác (tương quan ngược).

### 2.4 Đối chiếu boot 15–16/11 (nơi có lịch boot đầy đủ)

Nhiều lượt thiếu nằm **giữa boot đang sống**, có xác nhận độc lập:

- Doctor 10:00–15:00+07 15/11 (03:00–08:00Z): boot #50/#51 sống; build-loop đọc được file trên VM lúc 05:35Z; heartbeat 12:20:50+07 có mặt lúc 05:20:50Z — cùng cửa sổ đó doctor thiếu 6 giờ liên tiếp.
- Heartbeat 09:50–11:50+07 16/11 (02:50–04:50Z): boot #59 sống tới 04:45:49Z, #60 từ 04:45:49Z — cả 5 slot đều trong boot sống.
- Heartbeat 14:20:50/14:50:50+07 15/11, 14:50:50+07 16/11: singleton trong boot #51 / #61 sống.
- 2 lượt mục tiêu trong boot #63 sống (08:53:05Z→11:05:18Z): heartbeat 17:50:50+07 cách lúc #63 chết **14'28"**, doctor 18:00+07 cách **5'18"** — gợi ý "VM sắp chết" nhưng KHÔNG chứng minh được, vì cùng mẫu singleton thiếu xảy ra giữa boot khỏe, xa mọi reboot (vd HB 14:50:50+07 14/11 trong boot #48; HB 14:50:50+07 16/11 trong boot #61).

Bảng đối chiếu đầy đủ từng lượt (kèm caveat #56 chỉ ước lượng btime ~20:17Z 15/11, #54/#57 chưa có btime chính xác): xem `hidden_files/round125-t3/NOTES.md` §3. Các lượt thiếu 11–14/11 (13 giờ doctor + 1 slot HB 14/11) chưa phân loại vì lịch boot 11–14/11 chưa tái hiện trong luồng này — không suy diễn.

### 2.5 Tương quan với boot mới hiện tại (#69?)

- Boot mới `670c07f6`, btime **20:35:11Z**; #68 chết trong khoảng (18:00:02Z, 20:35:11Z] (lần xác nhận sống cuối của #68 là watcher poll 18:00:02Z đợt 124). Gap danh nghĩa #68→#69 = 3h01'20".
- Lượt thiếu quanh boot mới: HB 02:20:50/02:50:50+07 17/11 (19:20:50/19:50:50Z) + **doctor 03:00+07 17/11 (20:00Z, 35' trước boot mới)** — doctor 03:00 vẫn thiếu khi kiểm lại 20:51Z, tức 51' sau giờ hẹn. HB 03:20:50+07 (start 20:35:38Z, 27 s sau boot mới) và 03:50:50+07 (start 20:45:34Z) đều có mặt.
- Lượt cron vcut-build-loop hiện tại (03:35:51+07) chạy trên boot mới từ 20:35:51Z.

### 2.6 Dị thường dispatch của heartbeat (ghi nhận, chưa giải thích)

- Jitter `started − scheduled`: 83/100 lượt **−316 s** (sớm ~5'16"); 16/100 lượt **+887–889 s** (muộn ~14'48") — tất cả lượt muộn đều là slot :20:50, phần lớn start thực ~:35:38, ~13 s trước khi vcut-build-loop dispatch lúc :35:51. Ngoại lệ: 13:20:50+07 15/11 muộn +1249 s (không có vcut lúc 13:35). Doctor jitter 0–2 s (90/100 đúng 0 s).
- Jitter không tạo ra "thiếu" (slot thiếu là không có bản ghi nào mang nhãn giờ đó) — chỉ ghi lại như dị thường dispatch có thể cùng gốc với lượt thiếu.

## 3. Phân loại nguyên nhân (tóm tắt)

| Giả thuyết | Phán quyết |
|---|---|
| Scheduler drop (không dispatch / mất bản ghi phía scheduler) | **Khả dĩ nhất** — thiếu theo khối, 2 job cùng lúc, đối chứng feed-pulse/vcut bình thường, 0 lượt failed. Không phân biệt được "không dispatch" vs "dispatch rồi mất bản ghi" từ trong VM. |
| Bản ghi lịch sử bị drop | Yếu, không loại trừ hẳn — nếu drop ngẫu nhiên thì feed-pulse cũng phải mất lượt (0/21) và thiếu sẽ rải đều, không thành khối trùng nhau ở 2 job. |
| VM down / reboot | **Không giải thích được** — cả 2 job đều chạy được trong gap VM-down đã chốt; trong cùng một gap có slot chạy, có slot thiếu. |
| VM bận / build-loop chiếm slot | **Bác** — 0/38 + 0/36 lượt thiếu trùng build-loop đang active (nền 37/100). |
| Lỗi ghi file / log mất trên VM | **Bác** — các lượt này không ghi file lên VM (bản ghi nằm phía scheduler). |

## 4. Ghi chú phương pháp

1. Nguồn duy nhất: `cron.runs` (HB/DR limit=100, vcut limit=40, feed-pulse limit=10, kiểm lại limit=5 lúc 20:51Z). Lưới kỳ vọng: HB 30' tại :20:50/:50:50; DR hàng giờ tại :00:00. 100 lượt HB trải 136 slot → 36 thiếu là thiếu thật trong cửa sổ trả về, không phải artifact của limit.
2. Caveat: `history_may_be_truncated=true` trên HB/DR — "thiếu" = thiếu trong lịch sử API trả về. Không loại trừ tuyệt đối khả năng store tự drop bản ghi, nhưng mẫu khối + đối chứng feed-pulse khiến khả năng này rất thấp.
3. Không chạy quét toàn workspace (cờ e4a7/e4b8 chưa có lúc làm việc); không kiểm lại mù #40 B / #43; không đụng TTS 39 / birefnet.
4. Tỉ lệ thiếu theo giờ doctor (+07): 12:00 → 5/6; 15:00 → 5/6; 18:00 → 3/6; 03:00 → 3/5; 16:00/19:00/20:00 → 0/6. Mẫu theo giờ có thật nhưng n nhỏ (5–6 ngày), chưa có cơ chế giải thích — chỉ ghi nhận.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Cơ chế drop phía scheduler chưa rõ — nợ mở chính của luồng này.** Cần log/lý do skip từ phía runtime (ngoài VM). **Không giao điều tra tiếp từ trong VM bằng cùng phương pháp** (đã quét hết kênh khả thi: cron.runs + đối chiếu boot + đối chứng feed-pulse/vcut + chồng lấp build-loop). Nợ mở T3-123 §5 mục 2 + LIMITS gộp đợt 124 §10 về "2 lượt thiếu" nay **ĐÓNG theo hướng: đã xác minh + đã phân loại (scheduler-side drop); chỉ còn cơ chế chi tiết là chưa rõ, cần bằng chứng ngoài VM**.
2. **Lịch boot 11–14/11 chưa tái hiện** — 13 giờ doctor-thiếu + 1 slot HB-thiếu 14/11 còn chưa phân loại theo boot (không ảnh hưởng kết luận chính).
3. **Jitter +888 s của heartbeat slot :20:50 + mẫu thiếu giờ 12:00/15:00 của doctor** — dị thường chưa giải thích, ghi nhận cho luồng hạ tầng nếu parent muốn đào (cần dữ liệu ngoài VM).
4. **Mù #40 B / #43: KHÔNG ĐỔI** (đã chấp nhận để mở — không kiểm lại). **G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết** (không tự quyết). **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user).

## 6. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round125-t3-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi.
- Ghi chú điều tra đầy đủ + bảng thiếu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round125-t3/NOTES.md` (không nằm trong repo nên không stage).

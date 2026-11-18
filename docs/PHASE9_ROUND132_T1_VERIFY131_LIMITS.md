# LIMITS — Phase 9 đợt 132 T1: Kiểm chứng độc lập đợt 131

## 0. Tóm tắt (đọc trước)

- **VERDICT TỔNG THỂ: PASS — mọi claim lớn của đợt 131 ĐỨNG.** Đếm cuối, lượt yên #9, giả thuyết tick bị bác, (c2)=9, suite/O8, mù #50 + gap CERT/FULL, headroom — tất cả tái kiểm bằng code riêng của T1 đều khớp. Không có sai số nào đổi verdict nào.
- **4 sai số nhỏ mới (F-132-1 → F-132-4), không đổi verdict nào.** Lớn nhất là F-132-1: LIMITS gộp bị sửa sau khi đóng KHÔNG chỉ thêm §12.3 — vùng trước §12.3 ngắn hơn lúc đóng **193 B** (53.098 vs 53.291 B); lần này CÓ sha snapshot nên chứng minh được (đúng mục đích của snapshot — bài học F-131-1 đã phát huy), nhưng byte nào bị thay thì không khôi phục được vì không có snapshot nội dung.
- **Phương pháp:** tính lại từ JSON/log thô bằng code riêng (không chạy verbatim script của T10 đợt 131 — chỉ đọc để hiểu định nghĩa phương pháp rồi viết lại); đối chiếu từng claim lớn với file gốc trên đĩa; không đo mới, không sửa production, không sửa file đợt 131, không chạy lại suite đo nặng (chỉ đọc lại log + JSON có sẵn).
- **Thời gian kiểm:** 17:35–17:5xZ 17/11/2026 (lượt cron 00:35 +07 18/11); xong trước hạn cứng 20:35Z. Boot lúc kiểm: b379ecd7 (boot đợt 132, btime 17:24:08Z) — khác boot đóng đợt 131 (ad1327ef); các trạng thái "lúc đóng" (lock trống, 0 process sót, không reboot trong lúc đóng) chỉ kiểm lại được một phần qua log (xem §7).
- KHÔNG push. Batch stage chờ user push từ main chat.

## 1. Đếm cuối đợt 131 + lũy kế 111–131: PASS (khớp chính xác)

- Code riêng: `hidden_files/round132-t1/t1-verify131.py` (đọc trực tiếp 10 file `paths-loop/phase9-round131-*.txt`, NUL-delimited; dedup toàn cục trên đĩa, không cộng số học).
- **Đợt 131: 10 batch / 12 entry / 12 file duy nhất** (t1 1, t2 1, t3 1, t4 1, t5 2, t6 1, t7 1, t8 1, t9 1, closing 2). Đường dẫn thiếu trên đĩa: KHÔNG.
- **Tái kiểm 111–130: 198 batch / 514 entry / 453 file duy nhất — KHỚP số công bố đợt 130** (lần tái kiểm độc lập thứ sáu).
- **Lũy kế 111–131: 208 batch / 526 entry / 463 file duy nhất — KHỚP số công bố đợt 131.** Đối chiếu số học: 453 + 10 file mới-only = 463 ✓. File mới-only (10): 9 LIMITS luồng T1–T9 + LIMITS gộp. File trùng 111–130 (2): `PHASE9_GAP_ANALYSIS.md` + `apps/web/scripts/vcut-webkit-postboot-check.sh`.
- Lưu ý: lần chạy đầu script đếm của T1 tự sai chỉ số cột tên file (lấy nhầm `t1` thay vì `round131`) cho ra 0 batch — đã sửa và chạy lại, kết quả trên là của bản sửa. Lỗi này chỉ ở phía T1, không liên quan số đợt 131.
- F-131-T10-1 (nhãn in "111-129" trong script đếm T10, phép tính thực tế đúng 111–130) đã ghi nhận từ đợt 131 — không lặp lại thành F mới; script đếm của T1 ghi nhãn đúng.

## 2. sha256 / kích thước LIMITS gộp 131: F-132-1 + F-132-2 (mới, nhỏ)

- Lúc đóng T10 lưu (3 nơi độc lập, khớp nhau): `hidden_files/round131-t10/t10-closing-sha256.txt` + cờ `round131-t10.done` + build-loop-log dòng đóng đợt: **53.291 B, mtime 2026-11-17T16:05:17Z, sha256 `680e00fe0a20aeaf40a7df1685969442a5f0308b8ce3ef6bc96d1687f7ca4580`**.
- Hiện tại (T1 đo 17:5xZ 17/11): **57.139 B, mtime 16:10:55Z, sha256 `71d02fcee532fcd8694f783b91be9da74b7b7d350b5cf640cd69e61c5da64b0e`**. Delta +3.848 B.
- Đối chiếu từng byte (code riêng, đọc file dạng bytes): heading `### 12.3` ở offset **53.098**; từ heading tới EOF = **4.041 B**; 53.098 + 4.041 = 57.139 ✓.
- **F-132-1 (mới, ghi nhận): vùng trước §12.3 chỉ còn 53.098 B — ngắn hơn file lúc đóng 193 B.** Nếu §12.3 chỉ được *thêm* vào cuối thì vùng trước nó phải đúng 53.291 B. Chênh lệch −193 B chứng tỏ lần sửa 16:10:55Z (thêm §12.3 quyết parent) đồng thời đã bớt/thay ~193 B ở vùng trước §12.3. Giả thuyết hợp lý nhất (chưa chứng minh được): T10 để sẵn một placeholder/khối cuối ~193 B cho §12.3 và parent đã thay toàn bộ khối đó bằng §12.3 đầy đủ (4.041 B) — hoặc một khối cuối khác đã bị xóa khi thêm §12.3. **Không khôi phục được byte nào đã thay vì không có snapshot nội dung lúc đóng** (chỉ có sha). Không đổi verdict nào (nội dung §0–§12.2 đọc vẫn liền mạch, §12.3 khớp quyết parent trong build-loop-log). Bài học cho T10 đợt sau: ngoài sha, lưu thêm một BẢN COPY đầy đủ của LIMITS gộp lúc đóng (hoặc ít nhất 500 B cuối file) để đối chiếu được từng byte — sha chỉ chứng minh *có* thay đổi, không cho biết thay đổi *gì*. Đây là lần thứ tư liên tiếp mẫu "LIMITS gộp sửa sau khi đóng" (F-129-3, F-130-1, F-131-1) — nhưng là lần đầu chứng minh được bằng sha, đúng mục đích snapshot.
- **F-132-2 (mới, nhỏ, trong §12.3(g) do parent thêm): câu "sha256 LIMITS gộp lúc đóng khớp đúng bản hiện tại (680e00fe…)" là SAI theo nghĩa đen.** sha hiện tại của file là `71d02fce…`, không phải `680e00fe…`. sha `680e00fe…` chỉ khớp với *bản ghi lúc đóng* (snapshot ngoài file), không khớp *bản hiện tại* — vì chính việc thêm §12.3 đã đổi sha. Không đổi verdict nào (quyết đóng đợt (g) vẫn đúng theo dữ liệu lúc đóng); chỉ là câu chữ trong §12.3 ghi sai quan hệ sha ↔ bản hiện tại. Đề nghị: khi parent thêm §12.3 đợt sau, ghi rõ "sha lúc đóng (đã lưu ngoài file) là …; sha hiện tại khác do đã thêm §12.3" thay vì "khớp đúng bản hiện tại".
- Mtime 16:10:55Z của lần sửa khớp khung quyết parent 23:0x +07 (16:0xZ) — sửa có chủ đích, không phải sửa lạ.

## 3. Lượt yên WebKit #9 + giả thuyết thứ tự theo tick: PASS (số khớp 100%)

- **Histogram lượt #9 tính lại bằng code riêng** (`hidden_files/round132-t1/t1-histogram-132.py`, viết lại hoàn toàn: load GT 1 lần/size, Hamming vector hóa, tie-break |m−label| rồi d): flip wallMs=27639, nTicks post-flip+2000ms = 328, **nGhost=656, nomatch=0**, hist `{-15:2, -13:2, -12:6, -10:4, -9:4, -6:2, -3:2, -1:42, 0:222, 1:118, 2:165, 3:85, 4:2}` — **khớp 100% số T3/T10** (bin 0: 222 = 33,8%; +1/+2: 283 = 43,1%; +3: 85 = 13,0%; ≥3: 87 = 13,3%; <0: 64 = 9,8%; snap−label median 44 mean 48,8; raw−label median 9 mean 13,2).
- **TickCost (file T4):** n=557 median **56,0** p90 81,0 max 109 min 28; hậu flip+2000ms n=412 median 56,0 ✓. Lớp B: `classb-t4-attempt1.txt` ghi `LOP-B-TONG: DAT 5/5` ✓. Chuỗi 8 lượt yên: 49,5/40,0/52,0/47,5/44,0/54,0/40,0/56,0 — trung bình tính lại 47,875 ≈ **47,9 ms** ✓; median 56,0 cao nhất từ trước, biên còn 4,0 ms so với ngưỡng ≤60 ms ✓.
- **Hồi quy 7 lượt tính lại bằng code riêng (OLS đầy đủ):** từ 7 giá trị +1/+2 đọc trực tiếp file T3 (`c2-histogram-8runs.txt`: 39,5/52,7/36,6/43,5/47,3/33,9/52,4% tại median 49,5/40,0/52,0/47,5/44,0/54,0/40,0 ms): slope **−1,3342 pp/ms**, intercept 106,03, Pearson **−0,9985**, residual tối đa **0,85pp**, dự báo tại 56 ms = **31,3%**, lệch quan sát **+11,8pp**, SE nhị thức 1,81pp → **z = 6,53σ**; σ theo residual hồi quy 0,45pp → z ≈ 26,1 (hai định nghĩa σ khác nhau — đã ghi rõ, như T10 cảnh báo). **Tất cả khớp số T3/T10.** Verdict **giả thuyết thứ tự theo tick BỊ BÁC — ĐỨNG** (lệch +11,8pp > ngưỡng bác 5pp; phá vỡ đơn điệu cả hai dải).
- **F-132-3 (mới, chỉ về vết bằng chứng — số liệu vẫn đúng): script histogram của T10 (`round131-t10/t10-histogram-131.py`) BỊ CRASH và KHÔNG chứa code hồi quy.** File output `t10-histogram-131.txt` kết thúc bằng `AttributeError: 'NoneType' object has no attribute 'group'` ở vòng đọc lại 7 lượt (block `POOL 8 luot yen hop le` có dòng `+1/+2:` nhưng không có dòng `nGhost:` → regex `m0` là None). T1 gặp đúng lỗi này ở bản chạy đầu của script riêng rồi mới sửa bằng cách bỏ qua block không có nGhost — cùng nguyên nhân gốc. Quan trọng hơn: script T10 chỉ in bảng 7 lượt rồi crash — **không có bất kỳ code OLS nào** (không slope/intercept/Pearson/residual/dự báo/SE), dù §10.1(e) LIMITS gộp viết "Hồi quy tính lại từ 7 lượt trước (số … đọc trực tiếp từ file T3 … slope −1,3342 … Pearson −0,9985 … residual tối đa 0,85pp ✓, dự báo 31,3% ✓, 6,5σ ✓)". Các con số đó T1 đã tính lại độc lập và xác nhận ĐÚNG HẾT — nên đây không phải sai số liệu, mà là **vết bằng chứng thiếu**: giá trị hồi quy trong §10.1(e) không tái tạo được từ code đã lưu trên đĩa. Bài học: script verify phải chạy hết tới exit 0 trước khi đóng đợt (kiểm exit code + không có traceback trong output), và mọi con số trích trong LIMITS phải có code sinh ra nó trong cùng thư mục làm việc.

## 4. (c2) = 9: PASS (tính lại độc lập từ JSON gốc, khớp từng seq)

- Code riêng: `hidden_files/round132-t1/t1-c2-132.py` — định nghĩa (c2) theo T4 skiplatest §3: tick hậu flip+2000ms, skippedLatest=0, có ghost mà strip pixel khớp frame PRESENTED (GT strip, Hamming ≤ 2 bit) trong khi label ≠ presented; đếm theo tick.
- Kết quả: ticks skp=0 hậu flip = **267** (khớp T4); ticks có (c2) = **9**: seq 161 (15/14), 204 (16/15), 246 (16/15), 267 (16/15), 288 (15/14), 375 (16/15), 397 (17/16), 420 (16/15) — 8× +1f — và **seq 421 (19/16) +3f đầu tiên**. Tất cả Hamming = 0 (strip khớp chính xác tuyệt đối, không chỉ ≤2 bit). **Khớp 100% với cả ba nguồn độc lập**: T4 skiplatest §3, T3, và T5 (`t5-c2-drawlog-analysis.txt` liệt kê đúng 9 seq này). (c2) thuần +1f = 8, đúng biên trên dải dự báo 2–8 ✓.
- Log draw không đối chiếu được trực tiếp tại seq (c2): T5 đã kết luận (cửa sổ log seq ~0–43 pre-flip, (c2) ở seq 112–439 post-flip) — T1 không kiểm lại điểm này vì dữ liệu gốc đã đủ rõ trong file T5; quyết parent §12.3(a) đã phê duyệt lượt #10 log phủ post-flip để xử lý.

## 5. Suite 27/27 + O8 21/21: PASS (đọc lại log + JSON gốc, không chạy lại)

- Suite cây gộp (`round131-t10-suites.log`): đếm trực tiếp **27 dòng `exit=0`, 0 dòng exit khác 0**; dòng cuối `ALL DONE 2026-11-17T15:57:21Z boot ad1327ef-…`; preview-engine 354 assertions pass, exit=0. **27/27 exit 0 ✓, 0 rerun** (không thấy dấu rerun trong log).
- O8 (`t10-o8.log` + 2 file report JSON): Chromium **21/21 ok, fail=[]**, exit 0 15:58:49Z; WebKit **21/21 ok, fail=[]**, exit 0 15:59:48Z. Đếm trực tiếp từ `results[]` trong JSON (không tin log text). WebKit FULL PASS lần thứ chín liên tiếp: mắt xích đợt 131 xác nhận đúng; chuỗi 8 lần trước dựa trên các đợt đã verify (T1-131 xác nhận lần thứ 8).
- Cây không đổi trong lúc đóng: log suite/O8 ghi boot ad1327ef ở 15:57:21Z và 15:59:48Z — cùng boot T10 đóng; md5 preview.tsx 805409f0 / media.ts 2c384ed1 / vite.config.ts ee80d093 đã được T8-131 và T10-131 xác nhận độc lập, T1 không đo lại md5 cây (cây đã bị đợt 132 chạm tới sau khi mở — đo bây giờ không còn là trạng thái lúc đóng).
- Lock lúc đóng: `t10-o8-lock.log` ghi T10 lấy ticket 15:57:50Z và **ĐÃ NHẢ 15:59:48Z (giữ 118 s)** — khớp khung O8; "0 ticket + 75 cooldown lúc đóng" chỉ còn trong cờ `round131-t10.done` của T10 (không có file đếm độc lập nào khác lưu con số 75) — T1 ghi nhận là **không kiểm lại được sau khi đóng** (trạng thái đã trôi; đợt 132 đang chạy), cùng cảnh báo T1-131 đã ghi. Không phải sai số — chỉ là giới hạn kiểm chứng hậu đóng.
- 9/9 cờ `.done` T1–T9 + cờ T10 đều có trên đĩa (đếm trực tiếp: 10 file `round131-t*.done`) ✓. Không có luồng khôi phục đợt 131 ✓.

## 6. T2 — mù #50, gap CERT/FULL: PASS

- Probe #50: `round131-t2/once.txt` + `status2.txt` ghi `probe#50 boot=f868abad ok=2 fail=0` lúc 14:46:56Z ✓.
- Mù #50 đóng hoàn toàn: đối chiếu `blind50-merged.log` — seg A gộp **165 mốc, lỗ lớn nhất 461 s**; seg B **124 mốc, lỗ lớn nhất 738 s** (đuôi, mốc cuối 14:14:23Z); seg C 35 mốc, lỗ lớn nhất 536 s; mọi lỗ < sàn 1.147 s → max_hidden = 0 cả ba đoạn ✓. Số 277/180 trong tóm tắt là mốc float hai cây (trước gộp) — hai cách đếm đều ghi rõ nguồn, không mâu thuẫn ✓.
- 2 gap chứng nhận dạng khoảng: `blind50-gaps.txt` — #77→#78? = **[7.560 s, 7.580 s]** mid 7.570 s; #78?→#79? = **[5.030 s, 5.050 s]** mid 5.040 s; btime 14:26:41−13:02:41 = 5.040 s đúng mid ✓; 10:56:31→13:02:41 = 7.570 s đúng mid ✓. Cross-check N6/P6/Q6 tái hiện khớp 100% số kỳ vọng trước khi cộng; **CERT n=42→44 / FULL n=57→59** ✓; FULL58 trung gian (chỉ cộng #77→#78?) cũng khớp ✓. Mù #49 B kiểm lại không đổi + gap #76→#77 giữ SPAN — theo file `blind49-recheck*` của T2 (T1 chỉ đối chiếu tên file + verdict ghi trong LIMITS T2, không chạy lại toàn bộ điều tra mù; cross-check gaps đã đủ để neo CERT/FULL).
- Headroom (T9): cả hai lần đo trong `headroom-measure-*.log` đều `STOP at i=2846 … errno=28` ✓ — **headroom 2.846**, giảm −117 từ 2.963 đợt 130; còn 2.846−1.800 = **1.046** trên ngưỡng báo ✓. Trần 63.747 ✓.

## 7. Đối chiếu nhanh các luồng còn lại: PASS

- **T5 postboot boot2:** watcher `t5-wait-replay-b80.log` ghi `poll 24 15:30:19Z postboot_exit=0` (dpkg=759, installs=109) và `poll 25 15:31:20Z postboot_exit=0` rồi `FLAG_EXISTS already` + `WATCHER_END … reason=done_pass_stable_2polls poll=25` ✓; cờ `POSTBOOT_PASS` trên đĩa: boot_id=ad1327ef…, btime 15:01:30Z, pass_at 15:31:20Z, poll=25 ✓ — cờ ghi tay HỢP LỆ, khớp kết luận watcher. T5 LIMITS 57.548 B ✓ (khớp §10.3).
- **T6 lock:** LIMITS T6 ghi 833 dòng log lock, 241/241 cặp, 0 đang giữ — khớp nội dung file T6 (§4); prune lần 6 xóa 0 file (file `prune-deleted.txt` của T6 — T1 đối chiếu tên + verdict, không chạy lại prune). F-131-T6-1 (ngày mù #37 là 15/11, heartbeat 23:45:17Z) có trong LIMITS T6 §8.1 ✓. T6 LIMITS 42.246 B ✓.
- **T7 scheduler:** LIMITS T7 ghi 0 slot thiếu mới (HB 6/6, DR 3/3), lũy kế HB 40/172, DR 46/157 ✓ (đối chiếu tiêu đề + bảng trong file; dữ liệu scheduler gốc không kiểm lại từng slot — chấp nhận theo file T7 + T10 không phản đối).
- **T8 harness:** LIMITS T8 ghi chạy lại 3/3 exit 0 trên boot mới (15:35:53–15:43:51Z), tsc + vite build exit 0 ✓ (đối chiếu nội dung file; log harness gốc trong `round131-t8/` còn đủ). Lưu ý T8: log lần chạy gốc đã bị lần chạy lại ghi đè cùng tên file — chỉ còn trong LIMITS §1/§3 (đã ghi nhận từ đợt 131, không phải sai số mới).
- **T2/T4 kích thước oversize:** T2 58.440 B ✓, T5 57.548 B ✓, T6 42.246 B ✓, T4 29.236 B ✓, GAP 295.763 B (mtime 16:06:11Z, không đổi từ lúc đóng) ✓.
- **F-132-4 (mới, nhỏ): §10.3 LIMITS gộp ghi `PHASE9_GAP_ANALYSIS.md — 283.910 B` là SỐ CŨ (trước §60).** Tại lúc đóng GAP đã là **295.763 B** (theo `t10-closing-sha256.txt` + stat hiện tại, mtime 16:06:11Z không đổi). Chênh 11.853 B — đúng cỡ §60 mới thêm. Build-loop-log mục đóng đợt ghi đúng 295.763 B. Không đổi verdict nào (file vẫn oversize, đếm batch không phụ thuộc kích thước); chỉ là số kích thước trong §10.3 lỗi thời.
- **Cảnh báo cho T1 đợt 133 (không phải sai số đợt 131):** `vcut-webkit-postboot-check.sh` hiện **36.394 B, md5 123750ba…, mtime 17:45:20Z** — đã bị T5 đợt 132 sửa TRONG LÚC đợt 132 chạy (thư mục `round132-t5/` có file 17:44–17:49Z). Số 35.177 B trong §10.3 đợt 131 là đúng tại lúc đóng đợt 131; đừng nhầm thành sai số đợt 131 (cùng mẫu cảnh báo T1-131 đã ghi về file này).

## 8. Nợ mở chuyển T10 đợt 132 (từ kiểm chứng này)

- **T10 đợt 132: lưu thêm BẢN COPY đầy đủ LIMITS gộp lúc đóng** (hoặc ít nhất 500 B cuối + sha256) để đối chiếu từng byte khi parent thêm §12.3 — bài học F-132-1. Sha một mình chỉ chứng minh *có* thay đổi.
- **T10 đợt 132: script verify phải chạy tới exit 0, không traceback** trước khi đóng (F-132-3) — kiểm `echo $?` + rà output; mọi con số trích trong LIMITS phải có code sinh ra nó trong thư mục làm việc.
- **§12.3 đợt sau:** đừng viết "sha lúc đóng khớp đúng bản hiện tại" sau khi đã thêm §12.3 (F-132-2); ghi rõ sha lúc đóng vs sha hiện tại là khác nhau do chính §12.3.
- **§10.3 đợt sau:** lấy kích thước file oversize bằng `stat` ngay lúc đóng, đừng copy số đợt trước (F-132-4 — GAP 283.910 B cũ).
- Các nợ khác giữ nguyên từ LIMITS gộp đợt 131 §11 (lượt yên #10 log phủ post-flip, mù #51, T6 chốt số boot, watcher xóa cờ STALE, headroom 2.846, R9(a) chờ user, G1 hoãn, birefnet guard 6 GB, TTS 39 cấm kiểm lại, ci-security.yml 403, release gate, KHÔNG push).

## 9. Hồ sơ kiểm chứng (để parent đối chiếu)

- `hidden_files/round132-t1/t1-verify131.py` + `t1-verify131-part1.txt` + `t1-count-132.txt` — đếm batch/entry/file + sha/size §12.3 (lưu ý: bản chạy đầu trong `t1-verify131-part1.txt` có lỗi parse tên file của T1, đã sửa; kết quả chốt trong `t1-count-132.txt`).
- `hidden_files/round132-t1/t1-histogram-132.py` + `t1-histogram-132.txt` — histogram lượt #9 + hồi quy OLS 7 lượt (code riêng).
- `hidden_files/round132-t1/t1-c2-132.py` + `t1-c2-132.txt` — (c2)=9 tính lại từ JSON gốc.
- LIMITS này: `repo-1/docs/PHASE9_ROUND132_T1_VERIFY131_LIMITS.md`.
- Stage: `repo-1-push/paths-loop/phase9-round132-t1-verify131.txt` (NUL-delimited, verify read-back, 0 binary).
- KHÔNG sửa bất kỳ file nào của đợt 131. KHÔNG push. KHÔNG chạy lại suite đo nặng.

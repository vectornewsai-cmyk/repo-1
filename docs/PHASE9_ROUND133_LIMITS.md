# PHASE9 ROUND133 LIMITS — Lượt yên WebKit #10 ĐO XONG HỢP LỆ (median 39,5 ms, ngưỡng GIỮ) + mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ + mù #52 ĐÓNG HOÀN TOÀN + widen trigger §8.2(B) v6 XONG + reboot giữa lượt lần thứ 7 liên tiếp (sau khi 8/9 luồng đã xong)

> **Verdict đóng: CHẤP NHẬN.** Đợt 133 hoàn thành toàn bộ chủ đề đã giao theo LIMITS gộp đợt 132 §11 + quyết parent §12.3: lượt yên WebKit #10 đo xong hợp lệ lần đầu sau 2 đợt (cơ chế chờ RAM mới hoạt động ngay poll #3); T3 bước 2 + T5 pha 2 chốt mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ trên phép thử ngoài mẫu đầu tiên; widen trigger §8.2(B) xong (nhánh A2 kiểm chứng khô 8/8, chưa kích hoạt live); probe #52 + mù #52 đóng hoàn toàn + gap #81?→#82? chứng nhận dạng khoảng; T1 verify đợt 132 PASS. 9/9 cờ `.done` đủ trên đĩa. Suite cây gộp 27/27 + O8 Chromium 21/21 + WebKit 21/21 (FULL PASS lần thứ mười một liên tiếp). **Reboot giữa lượt lần thứ 7 liên tiếp** (07da9c50 → 3e7a7b51, btime 21:41:40Z) xảy ra SAU khi 8/9 luồng đã xong — không luồng nào mất việc; T10 đóng sổ trên boot mới.
> **Nợ lớn nhất chuyển đợt 134: sửa instrumentation log draw (`preview.tsx` loop-gate dòng 705) — cần quyết parent + T3 — nếu không, mọi lượt yên sau vẫn 0/N coverage cho (c2) hậu-flip và P7/desync vẫn không kiểm được lần thứ tư liên tiếp.**

- Đợt: 133, lượt cron 03:35 +07 18/11/2026 (mở 20:35:51Z 17/11; hạn cứng 23:35Z 17/11). T10 đóng sổ 21:52–22:12Z 17/11/2026.
- Repo local `~/workspace/repo-1` (không có `.git` local — KHÔNG push). Cây không đổi suốt đợt: `preview.tsx 805409f0`, `media.ts 2c384ed1`, `vite.config.ts ee80d093` (T1/T2/T3/T4/T5/T6/T8 kiểm độc lập, khớp nhau).
- KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG cloud/collab/AI model đóng/nhạc bản quyền, KHÔNG đụng TTS 39, KHÔNG thử birefnet, KHÔNG đụng `.github/workflows/*`.

## 1. Kiểm đầu (T10, 21:52Z): 9/9 cờ `.done` đủ trên đĩa

| Luồng | Cờ `.done` | Nội dung một dòng |
|---|---|---|
| T1 verify đợt 132 | 20:55Z | PASS — CHẤP NHẬN CÓ ĐIỀU KIỆN đợt 132 đứng vững; 5 sai số nhỏ F-133-1→5 |
| T2 probe #52 / mù #52 | 21:12Z | Mù #52 ĐÓNG HOÀN TOÀN; gap #81?→#82? = [7.797, 7.817] s CHỨNG NHẬN; CERT n=46 / FULL n=61 |
| T3 bước 2 (c2) | 21:13Z | Mô hình ĐƯỢC CỦNG CỐ (P1 5/5, P3 5/5, P2 đúng; P7 không kiểm được 0/5) |
| T4 lượt yên #10 | 21:10Z | Đo xong, 1 attempt, median 39,5 ms, ngưỡng GIỮ, log draw 0/5 |
| T5 infra + pha 2 | 21:17Z | Widen v6 (A2) XONG + postboot PASS (cờ gate-visible 20:50:22Z) + pha 2 XONG |
| T6 lock + boot | 21:51Z | Lock KHỎE, 250/250 cặp, prune 0, boot #83? mới (reboot lần 7), mù #52 đóng |
| T7 scheduler | 20:45Z | Cửa SẠCH: 0 slot thiếu mới (HB 42/184, DR 47/163); started_at +7.135 s lần thứ 3 |
| T8 vite harness | 21:28Z | 3/3 exit 0, gate mở 21:10:33Z, harness 21:15:30–21:23:09Z |
| T9 headroom/RAM | 20:43Z | Headroom 2.632; RAM 433–512 MB; balloon đứng yên 6.443.824 kB; birefnet KHÔNG thử |

- Boot lúc T10 mở: **mới 3e7a7b51-7a44-4dc0-9c2f-25b82cd342bf, btime 2026-11-17 21:41:40Z** (khác boot lúc mở đợt 133 — đã reboot giữa lượt, xem §10.2). Boot lúc T10 đóng: cùng 3e7a7b51 — **không reboot trong lúc đóng**.
- Replay boot mới: T10 quan sát trực tiếp — `dpkg.log` 1.167 dòng / 169 installs lúc 21:55:09Z (đang chạy, `apt-get install libvidstab-dev`), đạt **1.545 dòng / 221 installs lúc 21:56:14Z** (gói cuối `gstreamer1.0-tools`) — cùng hình dạng baseline boot #82? (1.545/221). T5 đợt 134 xác nhận chính thức (cờ POSTBOOT_PASS boot mới + verdict replay thuộc T5-134; T10 KHÔNG tự viết cờ postboot cho boot mới).

## 2. Lượt yên WebKit #10 — ĐO XONG, HỢP LỆ (T4)

- **Attempt1 duy nhất: 20/20 pass, exit 0** (20:50:48–20:54:07Z, vite :5187, WebKit 27.2, flip afterPass=5 wallMs=26187). JSON `round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json` — **3.274.496 B, sha256 e3ca1ac5dd79be72014a88268fe5abec1703f585b25a64473ad434c245423133** (T3 + T5 đối chiếu độc lập, khớp 100%).
- **tickCost total median 39,5 ms — THẤP NHẤT trong 9 lượt yên hợp lệ; ngưỡng ≤60 ms GIỮ, biên 20,5 ms (rộng nhất từ trước).** 9 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / **39,5** ms, trung bình 46,9 ms. Lớp B 5/5 ĐẠT (load5 cuối 0,85; load1 max 1,48; không reboot trong cửa sổ đo; apt/dpkg 0; RAM min 636 MB theo sampler T4 — xem F-133-8).
- **Cơ chế chờ RAM mới (quyết parent đợt 132 §12.3(a)) HOẠT ĐỘNG:** poll dày 45 s; gate 0 đạt khi cờ T5 xuất hiện 20:50:22Z; cửa mở poll #3 20:50:45Z (RAM 1168 MB), chớp ngay trong cùng giây. Cửa sổ lần này KHÔNG phải cửa sổ vàng sau boot (boot đã 76 phút tuổi) mà là **đợt hồi RAM giữa lượt** (479 → 1549 MB trong 9 phút; nguyên nhân chưa xác định — tương quan T7/T9 done 20:45Z, chưa chứng minh nhân quả). Nếu không có đợt hồi này, lượt #10 lại 0 attempt như đợt 132.
- **(c2) = 5** (seq 166/218/293/323/394, đều lag +1f = 33 ms); F6' tái xác nhận ĐÓNG (62/62, 100%/100%); lag5 0; histogram n=752 ghost: bin 0 34,4%, +1/+2 52,3% (cao nhất từ trước), +3 3,1% (thấp nhất từ trước), snap median 35 ms.
- **Log draw 0/5 — re-arm THẤT BẠI, nguyên nhân xác định ở code app-side:** `preview.tsx` `c2DrawLogPush` dòng 705 loop-gate chỉ ghi loop 1–2; dòng 700 re-enable xóa mảng. 7 lần re-arm vet +0; n đóng băng 137 từ pass 2; log dừng 10.119 ms TRƯỚC flip. **KHÔNG attempt2** (quyết T4 có căn cứ: không lịch re-arm probe-side nào sửa được lỗi app-side; attempt2 chỉ lặp lại 0/N coverage + lặp lại phép đo ngưỡng đã rõ). Sửa instrumentation là việc parent + T3 đợt 134 (xem §11.1).
- 3 lỗi runner/poller nhỏ đã sửa trong script để dùng lại (mẫu grep COV sai; timestamp stale dòng kết; gọi analyzer sai tham số) — không ảnh hưởng dữ liệu, verdict không đổi.

## 3. T3 bước 2 + T5 pha 2 — mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ; P7 KHÔNG KIỂM ĐƯỢC lần thứ ba liên tiếp

- Prereg T3 đợt 132 (đăng ký 17:45Z — xem F-133-4) đứng nguyên, không sửa sau khi có dữ liệu. Phép thử ngoài mẫu ĐẦU TIÊN cho mô hình, trên attempt1 hợp lệ duy nhất của T4.
- **P1 ĐÚNG 5/5** (c2) trong ±1 tick run-end (baseline 9,6%, p = 8,0×10⁻⁶); **P3 ĐÚNG 5/5** đóng băng labelMs tại tick (baseline 20,3%, p = 3,4×10⁻⁴; 0 tick bắt kịp); **P2 ĐÚNG** (0 lag âm); **P4 ĐÚNG** (thuần +1f = 5, tổng = 5, skp=1 = 0, lag ≥+5f = 0). Cộng dồn 2 lượt gần nhất: P1 14/14, P3 13/14.
- **P5 2/4** (snap 35 ms ✓, raw 8 ms ✓; label-floor +1 76,5% vượt dải ≤76% một chút; run ≥3 tick 12, thiếu 1 so với 13–22) — ghi rõ, không bác mô hình theo prereg. **P6 trong khoảng cả ba** (bin 0 34,4% / +1/+2 52,3% / +3 3,1%). Giả thuyết thứ tự theo tick vẫn chết (đã bác đợt 131): tick nhanh hơn (39,5 ms) nhưng +1/+2 cao hơn — không còn quan hệ đơn điệu nào để cứu.
- **P7 KHÔNG KIỂM ĐƯỢC lần thứ ba liên tiếp (0/5):** log draw kết thúc 10.119 ms trước flip, 0/376 tick post trong ±500 ms; nguyên nhân app-side (loop-gate dòng 705). **Desync seek-latency VẪN là giả thuyết mở** — mô hình freeze/skew được củng cố không đồng nghĩa desync bị bác. DEF v0.5 vẫn chưa viết.
- Đối chiếu chéo ba bên: T3 tính lại từ JSON gốc bằng script riêng (validate trên lượt #9 khớp 100%) — mọi số khớp T4; T5 pha 2 chạy lại labellag byte-identical + histogram bằng code T3 khớp đúng số T4; script pha 2 chính thức byte-identical với bản sơ bộ. Không có số nào lệch giữa T3/T4/T5.

## 4. T5 hạ tầng — widen trigger §8.2(B) v6 (A2) XONG + postboot PASS + pha 2 khớp T3

- **Widen trigger §8.2(B) XONG (quyết parent đợt 132 §12.3(b)):** watcher b84 v6 thêm dạng **(A2)** — replay xong (installs>0, 0 proc) + postboot FAIL + log poll ghi thiếu ≥1 gói đích (`FAIL apt: chưa cài:` / `FAIL libs: thiếu:` / `FAIL GST: thiếu`). "Đầy đủ" = ĐỦ BỘ GÓI ĐÍCH. Kiểm chứng khô /tmp **8/8 ca đúng** (hình dạng b379ecd7 GST=268 thiếu gstreamer1.0-gl → A2/yes; (A) cũ → A/yes; (B) → B/yes; FAIL chỉ do wrapper → -/no; PASS → -/no; thiếu lib → A2/yes; thiếu plugin GST → A2/yes; replay còn chạy → -/no); đối chiếu v5 trên ca b379ecd7-shape → -/no (đúng khoảng trống proxy). `bash -n` OK; md5 watcher 6a04a364… → 1946b2d0…; diff sau chuẩn hoá chỉ còn widen + header + btime. **Nhánh A2 chưa kích hoạt live** (chỉ kiểm chứng khô) — boot sau gặp lại hình dạng "replay đầy đủ nhưng thiếu 1 gói GST" sẽ là lần chứng minh live đầu tiên (T5 đợt 134 ghi rõ TRIGGER có YES không + kiểm chứng độc lập 5/5 trước repair).
- **Postboot boot 07da9c50 PASS:** poll0 20:48Z exit 0; watcher b84 2 poll (20:49:22–20:50:22Z) postboot 0/0, TRIGGER=NO; **cờ gate-visible `round133-t5/POSTBOOT_PASS` viết 20:50:22Z** (boot +1h16m07s); final confirm 21:04Z exit 0. KHÔNG --repair. dpkg 1545/221 (baseline của chính boot này), gstreamer1.0-gl đã cài bởi replay, GST 269, lists 37. **Baseline replay trôi theo từng boot** (1509/217 → 1551/222 → 1545/221) — tiêu chí PASS là postboot exit 0 + GST đủ + apt đủ 11 package, không phải số dòng/installs.
- `vcut-webkit-postboot-check.sh` sửa 1 lần (tham chiếu boot trong header + dòng `say`; md5 0d412c35… → 55f6b3df…; không đổi logic). Headroom T5 đo: 2625 (mở) → 2623 (cuối); RAM 475–1574 MB trong lượt. R9 (a) nhắc lần 16.
- Lưu ý thời gian: claim "đợt 133 là đợt ĐẦU TIÊN sau 6 reboot liên tiếp mà KHÔNG có reboot giữa lượt" của T5 (§9) đúng ở thời điểm T5 đóng (21:17Z) nhưng đã bị vượt qua bởi reboot 21:41:40Z (xem §10.2) — không phải sai số của T5, chỉ là mốc thời gian.

## 5. T2 — probe #52 + mù #52 ĐÓNG HOÀN TOÀN + gap #81?→#82? CHỨNG NHẬN DẠNG KHOẢNG

- **Probe #52: 20:42:56Z, boot 07da9c50 (#82?), ok=2 fail=0, exit 0.** Log v2 145→148 (+3). F82? ≈ −1 s (đo trực tiếp, 3 server +1..+2 s). Không reboot giữa phiên T2.
- **Mù #52 (17:46:50Z → 20:42:56Z, 10.566 s): ĐÓNG HOÀN TOÀN — A đóng, B đóng, 0 ẩn.** Đoạn A đóng bằng merged 4 phạm vi (162 mốc, lỗ lớn nhất 419 s, đuôi 15 s) — hai cây riêng cho lỗ đuôi 2.934 s là artifact mtime ghi-đè-cuối (file hoạt động ở cả hai đoạn chỉ để lại mốc ở đoạn sau), 11 session ngoài cây chạm đuôi A lấp đầy; **lần đầu merged đảo verdict hai cây** (tưởng MỞ → ĐÓNG). Đoạn B đóng bằng uptime trực tiếp + luật lỗ (113 mốc gộp, lỗ lớn nhất 469 s, đuôi 3 s). Mù đóng hoàn toàn đầu tiên kể từ #50.
- **Gap mới CHỨNG NHẬN DẠNG KHOẢNG: #81?→#82? = [7.797 s, 7.817 s]** (mid 7.807 s; F81? và F82? đều đo trực tiếp; cận nhảy clock |X82?| < 15 s từ session — lỏng hơn biên ±10 s nhưng F82? đo trực tiếp là bằng chứng chính). **CERT n=45 → n=46 / FULL n=60 → n=61.** #82? trong dải cơ học lần thứ 12 liên tiếp. Gap #80?→#81? = 8.558 s giữ SPAN.
- **Mù #51 B kiểm lại lần thứ 3: KHÔNG ĐỔI** (lỗ lớn nhất 4.393 s, tối đa 3 ẩn). **Mù #49 B: KHÔNG kiểm lại đợt này** theo quyết parent 132 §12.3(d) (không bằng chứng mới). **Mù #53 mới mở** từ probe #52 (việc T2 đợt 134).
- **EPERM: 0 sóng thật** (124 *.log; 2 dòng "đã tắt" là dương tính giả launcher T10-O8 đã biết). Sóng gần nhất vẫn ~11:55–12:11Z 11/11 (~152h48' trước probe #52). **WFS lần 39: chênh 0** (887/247, R7b 912/264, copies 25/17). Async `.writeFile(` vẫn 2 helper, 0 stray.
- RAM max trong mù 3.111 MB (50,7% guard); birefnet KHÔNG chạy. dpkg #82?: 1.545 dòng/221 installs, gstreamer1.0-gl đã cài bởi replay.
- Khung chết #81?: ghi cả hai — (19:33:56Z, 19:34:15Z] (19 s, 4 nguồn) và (19:34:00Z, 19:34:15Z] (15 s, session T2); khung hẹp nhất làm chuẩn (xem F-133-7 về câu chữ trong §0 của T2).
- Sai số của chính T2 (ghi trong LIMITS §4): prereg ghi gap #81?→#82? 6.445 s (đó là độ dài đoạn A, gap btime đúng 7.807 s); dải cơ học cho #82? cộng nhầm giờ; dự báo RAM sai (max thật 3.111 MB). Verdict không đổi.

## 6. T6 — lock KHỎE + prune lần 8 xóa 0 + chốt số boot #57→#83 (tương đối), số tuyệt đối VẪN TẠM

- **Lock KHỎE:** trống lúc mở và lúc đóng (0 ticket, 0 stale). Log chính thức **864 dòng / 250 cặp ACQUIRED→RELEASED / 0 đang giữ / 0 mất dấu / 0 TIMEOUT mới / 0 STALE-LOCK mới** (lúc T6 đóng 21:43Z; T10 recount lại lúc đóng — xem §10.3). 5 chu kỳ mới đều sạch: t10-round132 (O8, hold 105 s) + **t4 lượt yên #10 attempt1 (20:50:45–20:54:11Z, hold 206 s — gate A mở poll #3 khi RAM đạt 1.168 MB, cơ chế chờ RAM đã hoạt động)** + t8-round133 ×3 (hold 65/129/230 s). "KHÔNG NHẢ" trên lock thật: 0. Suite **9/9 ×2** (lần xanh thứ 9 liên tiếp). Repro message chạy đúng trên /tmp, **không lặp lại F-132-T6-1** (log thật giữ nguyên 856 dòng lúc repro, queue giữ nguyên 76 file — T10 đối chiếu: 856 = 853 thô lúc snapshot + 3 dòng t10-round132, khớp — xem §10.3). **F-133-T6: không có sai số mới.**
- **Prune lần 8: xóa 0 file** (lần thứ 8 liên tiếp; 0 ứng viên >7 ngày). Queue lúc đóng 77 file / 1078 B (mở 76/1064; +1 cooldown-t8-round133). File cũ nhất đủ 7 ngày ~21/11 18:38Z (find ~22/11).
- **Chuỗi boot tương đối CHỐT #57→#83; số tuyệt đối VẪN TẠM (giữ "?"):** 27 boot quan sát được từ #57 (23:33:34Z 15/11) tới #83 (21:41:40Z 17/11); các bước chuyển #74→…→#83 đều có ≥2 nguồn độc lập. Không chốt được số tuyệt đối vì (a) mù #37 tối đa 29 ẩn (+ mù #38 G mở tối đa 6, mù #29/#30/#31 +4); (b) mù #49 đoạn B mở, tối đa 1 ẩn; (c) mù #51 đoạn B mở, tối đa 3 ẩn (recheck3 không đổi); (d) mù #52 đóng hoàn toàn nhưng nằm sau tất cả các mù đang mở nên không làm neo được.
- Gap #81?→#82? **CERTIFIED interval [2h09'57", 2h10'17"]** (T2-133) = [7.797, 7.817] s, khớp T2. Gap #82?→#83? danh nghĩa 2h07'25" (7.645 s) **SPAN**; #83? trong dải cơ học từ #82? lần thứ 13 liên tiếp INSIDE.
- **Mù #37 KHÔNG ĐỔI** (15/11 11:39:50Z → 23:45:17Z; A+D đóng, B+C mở, tối đa 29 ẩn; parent đã chấp nhận để mở). Mù #51 B vẫn mở tối đa 3 ẩn; mù #49 B không kiểm lại theo quyết parent.
- Xvfb/zombie: 0 Xvfb, 0 socket sót, 0 zombie, 0 cổng lạ lúc mở và lúc đóng (T6); /tmp/.X11-unix/ trống cả hai lần.

## 7. T7 — cửa SẠCH, 0 slot thiếu mới; dị thường started_at +7.135 s lần thứ 3

- **Cửa SẠCH: 0 slot thiếu mới.** HB 6/6 có (00:50:50 → 03:20:50+07), tất cả succeeded, jitter −316 s (mẫu chuẩn); DR 3/3 có (01:00, 02:00, 03:00+07), jitter 0 s. Kiểm lại limit=15 lần 2 khớp lần 1.
- **Lũy kế:** HB **42/184** (22,8%); DR **47/163** (28,8%). Slot thiếu cũ vẫn thiếu, không đổi.
- **vcut-build-loop:** đợt 132 succeeded (run c6948429, finished 20:31:03Z); đợt 133 running (run 6f3eba37, started đúng giờ 20:35:51Z, jitter 0 s). 0 slot vcut thiếu.
- **Dị thường mới:** mẫu lạ started_at lượt vcut ghi sau thời điểm đã thấy running — lặp lại lần thứ 3 liên tiếp, jitter lớn nhất từ trước (**+7.135 s**; chuỗi: đợt 130 +5.251 s → đợt 131 +1.585 s → đợt 132 +7.135 s). Lượt đợt 132 ghi started_at 19:34:46Z dù T7 đợt 132 đã thấy cùng run_id running lúc 17:40Z; started_at ghi 31 s sau btime boot mới 19:34:15Z. Chỉ ghi nhận mốc, T5/T6 đối chiếu (T6 §8.6 không kết luận nguyên nhân — có thể là hành vi ghi log của scheduler sau reboot, không phải lỗi đếm slot).
- **Không reboot mới giữa lượt** trong cửa kiểm của T7 (boot 07da9c50, btime 19:34:15Z — trùng boot lúc mở đợt 133). Reboot 21:41:40Z xảy ra sau khi T7 đóng (20:45Z).

## 8. T8 — vite harness 3/3 exit 0 (không còn BLOCKED); P3 không kẹt lần thứ 5 liên tiếp

- **Gate mở 21:10:33Z** (waiter poll 28, sau 27 poll NOT-YET): cờ round133-t4.done (lượt yên #10: 1 attempt, 20/20 pass, median 39,5 ms, ngưỡng GIỮ, (c2)=5, log draw 0/5) + POSTBOOT_PASS boot 07da9c50 pass 20:50:22Z (boot_id/btime khớp). Cơ chế chờ RAM chớp cửa sổ vàng: gate A T4 mở 20:50:45Z (RAM 1168 MB), ~20 s sau cờ T5.
- **Harness chạy 21:15:30–21:23:09Z trên boot 07da9c50 (Xvfb :199, lock t8-round133):** 84l10 exit 0 (W1×3, W2, E4 PASS); 85m4 hb128 exit 0 (P3 không kẹt lần thứ năm liên tiếp, P5 seek kẹt dài nhất 0 mẫu, HB128 19 dòng sampleFor); 86n2 exit 0 (P1–P5 PASS, P5 seek kẹt 0 mẫu). Fixture rebuild 6/6 md5 khớp đợt 125–132.
- Cây không đổi (md5 kiểm 3 lần: preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093). Dọn sạch: 0 process Xvfb/vite/MiniBrowser sót, socket X199 + lock đã unlink, không vite.lock. RAM tụt 938 → 545 MB trong lúc chạy nhưng cả 3 vẫn exit 0.
- **Bài học bắt buộc đã thực hiện:** deadline waiter gõ tay trực tiếp (date -d '2026-11-17 23:00:00 UTC' = 1794956400, kiểm chứng trước khi chạy, bash -n OK) — lỗi sed đợt 132 không tái diễn; waiter kết thúc GATE-FOUND exit 0.
- Lưu ý thời gian: claim "chuỗi reboot giữa lượt dừng ở 6" của T8 (§0) đúng ở thời điểm T8 đóng (21:27Z) nhưng đã bị vượt qua bởi reboot 21:41:40Z — xem §10.2. Socket X193 sót từ suite đóng đợt 132 (0 process) T8 để nguyên không đụng; sau reboot tmpfs đã xóa; suite của T10 tạo lại X193/X194/X195 rồi T10 dọn tay lúc đóng (xem §10.3).

## 9. T9 — headroom 2.632, tiếp tục giảm; RAM kẹt thấp nhất T9 từng đo; birefnet KHÔNG thử

- **Headroom inotify: 2.632** (2 lần đo 20:40:32Z + 20:42:53Z cùng số tuyệt đối, chênh 0 trong-boot — lần đầu trong chuỗi gần đây). Giảm −106 so với 2.738 đợt 132 (−3,9%); bốn đợt gần nhất giảm đều ~106–117/đợt. Chuỗi dài hạn 4.438 → 2.632 (−40,7%). **Còn 832 trên ngưỡng báo < ~1.800** — ước tính số học ~7–8 đợt nữa nếu đà giữ nguyên (chỉ là phép chia). Watch ngoài cell 61.115; gấp ~1,67 lần nhu cầu vite thường — vite nối tiếp vẫn chạy được, chỉ theo dõi.
- Số T5 đo thêm (2625 lúc 20:48Z → 2623 lúc 21:04Z) thấp hơn số T9 7–9 — đo ở thời điểm khác nhau (sau khi các luồng khác mở watch), không phải mâu thuẫn; số chính thức của đợt là 2.632 của T9 (chủ quản headroom).
- **RAM khả dụng: 433–512 MB** (7 mẫu, 20:40:31–20:43:09Z) — thấp nhất T9 từng đo trực tiếp (min 433 MB < min đợt 131 là 502 MB); hơi tăng về cuối cửa sổ. Brief ghi ~547 MB lúc mở — ghi nhận cả hai số.
- **Balloon virtio: đứng yên tuyệt đối 6.443.824 kB** trong toàn bộ cửa sổ đo — đúng bằng giá trị đứng yên đợt 131, phình lại +422.084 kB so với lúc đóng đợt 132 (6.021.740 kB); chiếm ~79,3% tổng RAM.
- **Birefnet KHÔNG THỬ** (max 512 MB = 8,3% guard 6 GB); u2net vẫn fallback chính thức. ENOSPC 0 ngoài probe K8. Replay boot mới đã xong (dpkg.log đứng 1.545 dòng — khớp hình dạng T5 pha 1).

## 10. T10 đóng sổ — kiểm chứng độc lập + đối chiếu chéo + sai số mới

### 10.1 Suite cây gộp 27/27 + O8 Chromium 21/21 + WebKit 21/21 (trên boot mới 3e7a7b51)

- **Suite cây gộp 27/27 exit 0, 0 rerun** (21:57:12–22:02:06Z, RAMavail 606 MB lúc bắt đầu, boot 3e7a7b51; 354 assertions pass). Script `round133-t10/round133-t10-verify.sh` (adapt từ đợt 132, chỉ đổi số đợt; `bash -n` OK). Log: `round133-t10/round133-t10-suites.log` (27 dòng `exit=0`, 0 lần nhắc "rerun").
- **O8 Chromium 21/21 exit 0** (22:03:36Z) **+ WebKit 21/21 exit 0** (22:04:37Z), 0 rerun, giữ lock 120 s (22:02:37–22:04:37Z, hold 120 s, wait 0 s). Log: `round133-t10/t10-o8.log` (42 dòng PASS, 2 dòng chứa "fail" đều là `0 fail`). Driver `round133-t10/t10-o8-driver133.sh` (adapt từ đợt 132; lock script `vcut-vite-lock-v2.t10.sh` md5 khớp bản đợt 132). **WebKit FULL PASS lần thứ mười một liên tiếp (đợt 123–133)** — kiểm qua 11 file `round12{3..9,3{0,1,2,3}}-t10/t10-o8.log`, cả 11 đều `WebKit: 21/21 pass`.
- Cây không đổi trong lúc đóng (preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093 — kiểm lúc mở suite + lúc mở O8 + lúc đóng). Không reboot trong lúc đóng (boot 3e7a7b51 sống suốt 21:52–22:12Z).
- Postboot trên boot mới: replay đang chạy lúc T10 mở (dpkg.log 1.167 dòng / 169 installs, `apt-get install libvidstab-dev` lúc 21:55:09Z) và **xong 21:56:14Z (1.545 dòng / 221 installs, gói cuối gstreamer1.0-tools)** — cùng hình dạng baseline boot #82?. T10 chạy suite sau khi replay xong (suite bắt đầu 21:57:12Z); O8 chạy 22:02:37Z, sau replay ~6 phút. Không có vấn đề nào do postboot chưa xong — ghi rõ để khỏi hiểu lầm: suite/O8 đợt này chạy trên boot mới ĐÃ replay xong, không phải boot cũ.
- Lock TRỐNG lúc đóng (0 ticket + 78 cooldown, 1092 B); 0 process sót; /tmp/.X11-unix/ trống lúc đóng (3 socket X193/X194/X195 do chính suite tạo ra, 0 process, đã dọn tay 22:05Z).

### 10.2 Reboot GIỮA LUỘT lần thứ 7 liên tiếp (07da9c50 → 3e7a7b51, btime 21:41:40Z)

- Reboot giết sleep chờ của T6 (SIGTERM) nhưng không giết holder lock nào (lock trống từ 21:23:09Z) và **không luồng nào mất việc** (cả 8 cờ `.done` đã có trước reboot, muộn nhất T8 21:27Z — tức 14' trước reboot). T10 spawn 21:52Z, đóng sổ trên boot mới.
- **Khung chết #82? (07da9c50): HAI bản ghi — ghi cả hai, khung hẹp nhất làm chuẩn** (tiền lệ quyết parent đợt 132 §12.3(c)):
  - (a) **(21:28:35Z, 21:41:40Z] (13m05s) — bản ghi CHÍNH:** quan sát cuối là mtime file `build-loop-log.md` 21:28:35Z (mục T8-133 của parent). **Caveat (T10 ghi rõ):** mốc 21:28:35Z là do T6 ghi lại lúc kiểm 21:43Z; mtime hiện tại của file đã là 21:52:26Z do parent ghi thêm mục T6 lúc 21:52Z — nên mốc này nay chỉ còn trong hồ sơ T6, không đo lại được từ mtime sống. T10 quét lại độc lập cửa sổ (21:23:09Z, 21:41:40Z] trên hidden_files + docs + repo-1 + /tmp + agents: mốc muộn nhất còn đo được trực tiếp (trừ thư mục exec-logs ở (b)) là `round133-t8.done` 21:27:58Z — không có file nào khác trong khoảng sau 21:27:58Z, phù hợp khung chính.
  - (b) **(21:29:47Z, 21:41:40Z] (11m53s) — bản ghi HẸP HƠN, KHÔNG quy trách nhiệm được:** thư mục `workspace/agents/9e39f4db-…/exec-logs` có mtime 21:29:47Z nhưng **trống rỗng** (total 0 — T10 kiểm lại 21:55Z) — một file tạm đã được tạo rồi xóa trong đó, không còn dấu vết để xác định là của luồng nào. Ghi lại để T2-134 tự quyết có nhận hay không.
  - Tuổi thọ #82? theo khung chính: 1h54'20"–2h07'25"; theo khung hẹp: 1h55'32"–2h07'25".
- Gap #82?→#83? danh nghĩa (btime→btime) = 2h07'25" (7.645 s) — **SPAN** (chưa chứng nhận; T2-134 kiểm mù #53). #83? trong dải cơ học từ #82? lần thứ 13 liên tiếp INSIDE (T6).
- Chuỗi "reboot giữa lượt" theo định nghĩa gộp của T10 (mọi reboot quanh đợt, cả giữa lượt lẫn ranh giới): đợt 129 giữa lượt (#75→#76), đợt 130 ranh giới (#76?→#77?) + giữa lượt (#77→#78?), đợt 131 giữa lượt (#79?→#80?), đợt 132 ranh giới (#80?→#81?) + giữa lượt (#81?→#82?), đợt 133 giữa lượt (#82?→#83?) — **7 sự kiện liên tiếp, không đợt nào từ 129 tới nay thiếu reboot.** Đây là định nghĩa T10 dùng; T2-133 §0 gọi reboot #81?→#82? cũng là "lần thứ 7" theo một chuỗi đếm khác không nêu rõ — xem F-133-6.

### 10.3 Đối chiếu chéo (T10 kiểm trực tiếp trên đĩa)

- **Lock recount độc lập lúc đóng (22:05Z):** file thật 873 dòng; chính thức (loại 6 dòng repro lỗi F-132-T6-1) **867 dòng: TICKET 265 / ACQUIRED 256 / RELEASED 251 / COOLDOWN 80 / TIMEOUT 8 / STALE-LOCK 6 / STALE-TICKET 1** — tổng 867 khớp; **251/251 cặp, 0 đang giữ, 0 mất dấu**; chênh ACQUIRED − RELEASED = 5, đúng bằng 5 ca double-acquire đã biết (không ca mới). So với T6 đóng (864 dòng / 250 cặp, 21:43Z): +3 dòng đúng bằng chu kỳ O8 của T10 (TICKET+ACQUIRED+RELEASED, hold 120 s); queue 77 → 78 file / 1078 → 1092 B (+1 cooldown-t10-round133). **T6 đếm đúng.**
- **Recount 856 dòng lúc repro của T6 (§6): khớp.** 847 (snapshot chính thức T6-132) + 6 dòng repro lỗi (đã có trong file thô từ 17:43:46Z) = 853 thô; + 3 dòng chu kỳ t10-round132 (T/A/R, 20:20:50–20:22:35Z, không có dòng COOLDOWN log cho chu kỳ này — cooldown chỉ là file, như chu kỳ T10 đợt này) = **856 thô lúc repro 20:44Z**. T6 ghi đúng.
- **T1 F-133-1→5: T10 xác nhận tất cả đều đúng và không đổi verdict** (đã ghi trong LIMITS T1 §4; không nhắc lại từng cái ở đây ngoài việc dùng số đã sửa: RAM gate A đợt 132 là 427–552 MB, lỗ đuôi B mù #51 là 4.393 s theo phép trừ, T8 đợt 132 là 7 timeout + 1 lần bị reboot giết, prereg T3 đăng ký 17:45Z).
- **T2 vs T6 về gap #81?→#82?: khớp.** T2 [7.797, 7.817] s = T6 [2h09'57", 2h10'17"]; btime 19:34:15Z − 17:24:08Z = 7.807 s (mid) — T10 tính lại đúng.
- **T3/T4/T5 về lượt #10: khớp 100%.** JSON sha e3ca1ac5… + 3.274.496 B cả ba bên cùng ghi; (c2)=5 cùng 5 seq; histogram + P1/P3/P2/P4/P5/P6 giống hệt giữa T3 (script riêng) và T5 (pha 2, code T3 cho histogram) với T4.
- **T5 vs T9 headroom: khác thời điểm, không mâu thuẫn.** T9 2.632 (20:40:32Z + 20:42:53Z); T5 2625 (20:48Z) → 2623 (21:04Z) — thấp hơn 7–9 do watch tăng thêm giữa hai lần đo; số chính thức của đợt là 2.632 của T9.
- **T4/T5/T8 về cờ gate:** cờ T5 20:50:22Z → gate A T4 mở poll #3 20:50:45Z (RAM 1168 MB) → T8 gate mở 21:10:33Z (cờ T4 + POSTBOOT_PASS) — ba mốc khớp nhau từng giây giữa ba LIMITS + log lock (ACQUIRED t4 20:50:45Z, t8 21:15:33Z).
- **T7 vs T6 về started_at +7.135 s:** T7 ghi nhận mốc (lần thứ 3 liên tiếp); T6 không kết luận nguyên nhân — không mâu thuẫn, vẫn mở (xem §11.8).

### 10.4 Sai số mới tìm được (F-133-6 → F-133-8) — tất cả KHÔNG đổi verdict

- **F-133-6 — T2-133 §0 gọi reboot #81?→#82? là "reboot giữa lượt lần thứ 7 liên tiếp", trong khi cùng reboot đó T10-132 gọi là "lần thứ sáu liên tiếp" (không đổi verdict).** Chuỗi gộp của T10/T1 (§10.2 trên) đếm reboot này là sự kiện thứ 6; sự kiện thứ 7 là #82?→#83? (21:41:40Z, đợt 133). T2-133 §2.2 chỉ liệt kê 3 sự kiện trong chuỗi của mình (#79?→#80?, #80?→#81?, #81?→#82?) mà không nêu 4 sự kiện trước đó — chuỗi đếm của T2 không tái tạo được từ hồ sơ. Đây là trường hợp mới của F-133-5 (nhãn "lần thứ N" dùng hai định nghĩa khác nhau). **Đề nghị giữ nguyên:** từ đợt 134, mọi luồng dùng MỘT định nghĩa duy nhất — chuỗi gộp mọi reboot quanh đợt như §10.2 — và ghi rõ định nghĩa khi dùng nhãn "lần thứ N". Khung chết/btime của cả hai reboot đều đúng; chỉ nhãn đếm gây nhầm.
- **F-133-7 — T2-133 §0 viết khung chết #81? "khung 19 s vẫn là chuẩn đã thỏa thuận", mâu thuẫn với chính §2.2 + §4 của T2 và quyết parent đợt 132 §12.3(c) (không đổi verdict).** §2.2 của T2 viết "ghi cả hai, khung hẹp nhất làm chuẩn" và §4 mục 4 viết "khung hẹp nhất làm chuẩn (tiền lệ … quyết parent đợt 130 §12.3(f) / 131 §12.3(c) / 132 §12.3(c))" — đúng quyết parent. Chỉ câu trong §0 ("khung 19 s vẫn là chuẩn") đi ngược lại. **Chuẩn đúng theo quyết parent: khung hẹp nhất (15 s) làm chuẩn** cho #81?; khung 19 s vẫn được ghi lại đầy đủ. T10 ghi rõ để brief sau khỏi lặp câu chữ sai ở §0.
- **F-133-8 — RAM min giữa lượt yên #10: T4 ghi 636 MB, T5 ghi 622 MB lúc 20:52:07Z trong cùng cửa sổ (không đổi verdict).** T4 §2.1 (sampler giữa lượt 20:51:08–20:52:08Z): min 636 MB. T5 §4.2 (bảng RAM): 622 MB lúc 20:52:07Z, trong lúc attempt1 đang chạy. Hai sampler khác nhau, cùng thời điểm, chênh 14 MB — dao động lấy mẫu bình thường của MemAvailable (đo theo giây). Cả hai đều >500 MB nên **B5 ĐẠT không đổi**. Đề nghị các luồng ghi rõ "min theo sampler của mình" khi báo RAM min, tránh hai số min khác nhau cho cùng một cửa sổ.

### 10.5 Đếm cuối (dedup toàn cục trực tiếp trên đĩa, script round133-t10/count-final-133.py)

- **Đợt 133 (gồm closing) = 10 batch / 12 entry / 12 file duy nhất.** Trước closing: 9 batch / 10 entry / 10 file (T1 1, T2 1, T3 1, T4 1, T5 2, T6 1, T7 1, T8 1, T9 1 — T5 2 entry: LIMITS + postboot-check.sh; mọi đường dẫn đều tồn tại trên đĩa; cả 9 file paths đều NUL-delimited thuần, 0 newline). Closing thêm 2 entry (LIMITS gộp + GAP); file mới-only của closing: 1 (LIMITS gộp); GAP trùng với 111–132.
- **Lũy kế 111–133 = 228 batch / 551 entry / 483 file duy nhất.** File mới-only đợt 133: 10 (9 LIMITS luồng + LIMITS gộp); trùng với 111–132: 2 (GAP_ANALYSIS.md + postboot-check.sh). Đối chiếu: 473 + 10 = 483 ✓.
- **Tái kiểm 111–132 = 218 batch / 539 entry / 473 file duy nhất — KHỚP số công bố đợt 132** (lần tái kiểm độc lập thứ tám liên tiếp khớp số công bố). File oversize đợt này: T2 LIMITS 53.711 B (vượt ngưỡng push-files 37.768 B — chỉ stage paths, không push; T2 đã stage đúng luật).
- Oversize chưa lên: 1 file 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` (từ trước, vẫn chờ).

## 11. Nợ mở chuyển đợt 134

1. **Sửa instrumentation log draw (`preview.tsx`, cần quyết parent + T3):** nới loop-gate dòng 705 (hoặc thêm cờ runtime chọn số loop tối đa) + xem lại reset mảng khi re-enable (dòng 700); ghi rõ md5 trước/sau + revert sau khi đo. **Không có sửa này thì mọi lượt yên sau vẫn 0/N coverage cho (c2) hậu-flip** và P7/desync vẫn không kiểm được lần thứ tư liên tiếp. T4/T5/T3 đợt 133 KHÔNG tự sửa production (đúng luật — thay đổi production giữa lượt đo cần quyết parent).
2. **Nhánh A2 của watcher v6 chưa kích hoạt live** (chỉ kiểm chứng khô 8/8 ca). Boot sau gặp lại hình dạng "replay đầy đủ nhưng thiếu 1 gói GST" sẽ là lần chứng minh live đầu tiên — T5 đợt 134 ghi rõ TRIGGER có YES không + kiểm chứng độc lập 5/5 trước khi --repair (luật once-only giữ nguyên).
3. **Mù #53 + probe #53 (T2 đợt 134):** mù #53 mở từ probe #52 (20:42:56Z); điều tra đoạn từ #82?; dải cơ học cho #83? (p10–p90 FULL61): [20:07:15Z, 22:01:22Z] — #83? thật 21:41:40Z đã nằm trong dải (lần thứ 13 liên tiếp INSIDE). Gap #82?→#83? = 7.645 s danh nghĩa, **SPAN** — chờ T2-134 kiểm mù #53 để chứng nhận hoặc giữ SPAN.
4. **Khung chết #82? hai bản ghi:** ghi cả hai, khung hẹp nhất (21:29:47Z, 21:41:40Z] làm chuẩn; bản hẹp không quy trách nhiệm được (thư mục exec-logs trống) — T2-134 tự quyết có nhận hay không. Mốc chính 21:28:35Z nay chỉ còn trong hồ sơ T6 (xem §10.2 caveat).
5. **T3 bước 2 đợt 134:** dùng dữ liệu lượt #10 + prereg đứng nguyên; P5 lệch biên (label-floor +1 76,5% vs 76%; run 12 vs 13) ghi nhận để xem xét cùng dữ liệu mới; DEF v0.5 vẫn chưa viết.
6. **G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). Không thay đổi.
7. **R9 (a): VẪN CHỜ user (nhắc lần 16 — KHÔNG tăng số đếm).** Không thay đổi, không hỏi lại user.
8. **Dị thường started_at lượt vcut +7.135 s (lần thứ 3 liên tiếp, lớn nhất):** chỉ ghi nhận mốc; T5/T6 đợt 134 đối chiếu giờ bắt đầu/kết thúc lượt với reboot (có thể là hành vi ghi log của scheduler sau reboot, không phải lỗi đếm slot).
9. **Headroom còn 832 trên ngưỡng báo < ~1.800** (T9: 2.632; giảm ~106–117/đợt bốn đợt gần nhất — chỉ là phép chia, KHÔNG phải dự báo). Trần inotify 63.747 cần can thiệp host — ngoài tầm luồng này. Vite nối tiếp bắt buộc vẫn đứng.
10. **Balloon virtio:** đứng yên 6.443.824 kB đợt này (~79,3% tổng RAM); RAM kẹt thấp nhất T9 từng đo (433 MB). Nếu balloon giữ mức này, harness/suite đợt sau có thể phải chờ RAM như Gate A đợt 130 — T5/T8 là chủ quản xác nhận. **Cơ chế chờ RAM (quyết parent đợt 132 §12.3(a)) đã chứng minh hoạt động cả với đợt hồi RAM giữa lượt, không chỉ cửa sổ vàng sau boot** — brief đợt sau nên ghi rõ cả hai nguồn cửa sổ.
11. **Mù #51 B vẫn mở tối đa 3 ẩn** (recheck3 không đổi); gap #80?→#81? = 8.558 s giữ SPAN. **Mù #49 B không kiểm lại thường lệ nữa** theo quyết parent (chỉ kiểm lại khi có bằng chứng mới); gap #76→#77 giữ SPAN. Mù #37 không đổi (tối đa 29 ẩn; parent đã chấp nhận để mở).
12. **F-132-3 vẫn mở:** script histogram của T10 đợt 131 crash + thiếu code hồi quy — T10 đợt này đã lưu script đếm (count-final-133.py) chạy được + đủ code tính mọi số nó công bố (đếm cuối §10.5 tái tạo được từ script đã lưu); phần hồi quy (c2) thuộc T3/T5, không thuộc T10.
13. **F-133-2 (ghi rõ quy ước biên lỗ đuôi), F-133-3 (T8 đối chiếu bảng poll T4 trước khi viết số timeout), F-133-5/F-133-6 (chốt một định nghĩa chuỗi reboot — T10 đã chốt định nghĩa gộp ở §10.2, các luồng từ đợt 134 dùng theo), F-133-7 (câu chữ khung chuẩn trong §0), F-133-8 (ghi rõ "min theo sampler của mình").**
14. **ci-security.yml vẫn 403 chờ user** (repo không có CI chạy thật; user đã cấp quyền 2 lần vẫn 403 — bước tiếp theo: kiểm tra Workflows có phải Read and write không, nếu đúng thì gỡ/cài lại App hoặc user tự thêm file qua web GitHub).
15. **TTS 39 cấm kiểm lại. Birefnet chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức. Release gate không đổi (không release/tag cho đến khi ngang hoặc hơn CapCut thật). KHÔNG push khi user chưa nhắn "push đi".**

## 12. Chờ quyết parent (đã quyết ở §12.1 dưới)

- (a) **Sửa instrumentation log draw `preview.tsx:705` (nới loop-gate) + dòng 700 (reset mảng khi re-enable):** T3 sửa trong đợt 134 (ghi rõ md5 trước/sau + revert sau khi đo) rồi đo lại lượt yên #11 với logger đã nới — hay giữ nguyên instrumentation và chấp nhận P7 không kiểm được? T4/T5/T3 đã đề xuất hướng sửa; cần parent quyết trước khi T3 đợt 134 đụng production.
- (b) Các nợ §11 khác không cần quyết mới (đã có quyết đứng hoặc là việc thường lệ đợt sau).

### 12.1 QUYẾT PARENT (main chat, 05:1x +07 18/11/2026 — đóng đợt 133)

- **(a) Sửa instrumentation log draw `preview.tsx:705` + dòng 700: PHÊ DUYỆT.** T3 đợt 134 sửa (nới loop-gate dòng 705 — hoặc thêm cờ runtime chọn số loop tối đa — + xem lại reset mảng khi re-enable dòng 700), ghi rõ md5 trước/sau, rồi đo lại lượt yên #11 với logger đã nới. Điều kiện: (1) chỉ là sửa chẩn đoán đã duyệt đợt 129 §12.3(a) — log chẩn đoán, mặc định tắt, KHÔNG đổi hành vi render; (2) revert sau khi đo xong (hoặc giữ sau cờ debug — parent quyết lúc đó, như quyết đợt 129); (3) không cần lượt đo E4 hay TTS nào. Lý do: lỗi đã xác định chính xác (loop-gate chỉ ghi loop 1–2; re-enable xóa mảng); không sửa thì mọi lượt yên sau vẫn 0/N coverage cho (c2) hậu-flip và P7/desync không kiểm được lần thứ tư liên tiếp — trong khi mô hình ghost-freeze/skew vừa được củng cố (P1 5/5, P3 5/5) và chỉ thiếu mắt xích log draw để phân biệt cơ chế. Giữ nguyên instrumentation đồng nghĩa bỏ cuộc điều tra (c2) khi sửa nhỏ và đã hiểu rõ — không phải lựa chọn đúng.
- **(b) Các nợ §11 khác: KHÔNG CẦN QUYẾT MỚI.** Đã có quyết đứng (R9 (a) nhắc lần 16, G1 hoãn, birefnet guard 6 GB, TTS 39 cấm, ci-security 403, release gate) hoặc là việc thường lệ đợt sau (nhánh A2 watcher v6 chờ kích hoạt live, probe #53 + mù #53, khung chết #82? ghi cả hai theo tiền lệ, headroom/balloon theo dõi).
- **(c) Đóng đợt 133 (9/9, T10 đóng trong phiên): CHẤP NHẬN.** Suite 27/27 exit 0; O8 Chromium 21/21 + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ mười một liên tiếp); cây không đổi trong lúc đóng (preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093); không reboot trong lúc đóng (reboot #82?→#83? xảy ra giữa lượt, sau khi 8/9 luồng đã xong, trước khi T10 đóng); lượt yên #10 ĐÃ ĐO XONG HỢP LỆ (median 39,5 ms — thấp nhất 9 lượt); mù #52 ĐÓNG HOÀN TOÀN + mù #53 mới mở; mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ (P1 5/5, P3 5/5, T3 + T5 khớp 100%); chốt chặn đã xóa khi đóng; cờ t10.done có. Đếm cuối dedup toàn cục 228/551/483 đã tái kiểm đúng (111–132 = 218/539/473 khớp số công bố đợt 132; file trùng đợt 133: GAP_ANALYSIS.md + vcut-webkit-postboot-check.sh). Ghi nhận: cơ chế chờ RAM mới (quyết đợt 132 §12.3(a)) đã chứng minh hoạt động — chớp cửa sổ poll #3 RAM 1.168 MB, và là đợt hồi RAM giữa lượt (không phải cửa sổ vàng sau boot) — brief đợt sau ghi rõ cả hai nguồn cửa sổ.

## 13. Stage + cờ + chốt chặn

- **Stage (KHÔNG push):** `~/workspace/repo-1-push/paths-loop/phase9-round133-closing.txt` — 2 entry NUL-delimited (`docs/PHASE9_ROUND133_LIMITS.md`, `PHASE9_GAP_ANALYSIS.md`), verify read-back.
- **GAP + §62:** `~/workspace/repo-1/PHASE9_GAP_ANALYSIS.md` (xem §62 — cập nhật sau đợt 133).
- **LIMITS gộp lúc đóng:** file này, sha256 + bản copy đầy đủ lưu tại `hidden_files/round133-t10/` (bài học F-132-1: không chỉ lưu sha).
- **Chốt chặn `round-in-progress.md` ĐÃ XÓA khi đóng. Cờ `round133-t10.done` ĐÃ TẠO.**
- **Batch stage / Tổng batch đang chờ user push:** đợt 133 = 10 batch (9 luồng + closing); lũy kế 111–133 = 228 batch / 551 entry / 483 file duy nhất + 1 file oversize 6,4 MB chưa lên. KHÔNG push khi user chưa nhắn "push đi".

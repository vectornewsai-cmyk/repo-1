# VCut Studio — Phase 9, đợt 139, T1: kiểm chứng độc lập đợt 138

- **Nhiệm vụ:** VERIFY độc lập đợt 138 đã đóng (T10 đóng 14:01Z 18/11/2026, verdict CHẤP NHẬN, 9/9 cờ).
- **Người kiểm:** T1 đợt 139. Thời gian kiểm: ~14:39–14:51Z 18/11/2026.
- **Kết luận: PASS — không có sai số nào đổi verdict.** Đợt 138 đứng nguyên như đã đóng; quyết parent §12.3 (a)–(k) đã ghi đủ trong aggregate. **Có 1 sai số hồ sơ ĐÁNG CHÚ Ý (F-139-T1-1):** reboot sau lần kiểm cuối của T10 có btime thật **13:53:41Z**, không phải 14:03:07Z như log/memory/marker đợt 139 đang ghi — và reboot này xảy ra TRƯỚC cờ đóng (14:01:14Z), không phải sau. Sai số này không đổi verdict đợt 138 (mọi bằng chứng đo đều chạy trước reboot) nhưng **T2-139 PHẢI dùng btime 13:53:41Z** cho gap #95?→#96? và khung chết #95?, nếu không gap danh nghĩa sẽ dài hơn 566 s.
- **Cây lúc kiểm:** preview.tsx md5 **530e10a7** (fix GIỮ VĨNH VIỄN — KHÔNG revert, KHÔNG sửa trong phiên này), media.ts 2c384ed1, vite.config.ts ee80d093 — khớp hoàn toàn cây lúc đóng đợt 138.
- **Boot lúc kiểm:** 541524e2, btime **13:53:41Z** (epoch 1795010021, /proc/stat) — boot này mở sau reboot 13:53:41Z; đợt 139 mở trên boot này. Con số "14:03:07Z" trong log/memory/marker là giờ parent quan sát, không phải btime (xem F-139-T1-1).

## §1. Đếm lại độc lập (dedup TOÀN CỤC — đếm lại từ đầu, không cộng dồn số cũ)

Script: `/tmp/t1-139-count.py` (đọc toàn bộ file `phase9-round*.txt` trong `~/workspace/repo-1-push/paths-loop/`, tách entry theo byte NUL, dedup trên tập hợp đường dẫn toàn cục; lọc theo số đợt bằng regex `phase9-round(\d+)-`).

| Phạm vi | Batch (file paths) | Entry | File duy nhất | So với số công bố |
|---|---|---|---|---|
| Đợt 138 | 10 | 13 | 13 | **khớp** (10/13/13) |
| Lũy kế 111–138 | 278 | 618 | 534 | **khớp** (278/618/534) |
| Tái kiểm 111–137 | 268 | 605 | 523 | **khớp** số công bố đợt 137 (lần thứ 18 liên tiếp khớp — T1-138 là lần 16, T10-138 là lần 17, T1-139 là lần 18) |
| Tái kiểm 111–136 | 258 | 590 | 513 | **khớp** số công bố đợt 136 |
| Tái kiểm 111–135 | 248 | 578 | 503 | **khớp** số công bố đợt 135 |

Chi tiết đợt 138 theo từng file paths (entry / duy nhất-trong-file): closing 2/2; t1-verify137 1/1; t2-eperm 1/1; t3-def 2/2; t4-quiet15 1/1; t5-infra 2/2; t6-lockhealth 1/1; t7-scheduler 1/1; t8-viteharness 1/1; t9-headroom 1/1. Tổng 13 entry, 13 file duy nhất (11 entry luồng + 2 entry closing; 11 file mới-only + 2 file trùng với 111–137: GAP_ANALYSIS.md + postboot-check.sh — đúng như aggregate §10 giải thích sau đính chính F-138-T10-3).

Kiểm bổ sung: **cả 534 file duy nhất 111–138 đều tồn tại trên đĩa (0 thiếu)**; **mọi file paths 111–138 đều thuần NUL-delimited (0 ký tự newline, kết thúc bằng NUL)**; file `t10-count-final-138.txt` của T10 ghi pre-count 9 batch / 11 entry / 11 file (10 mới-only + 1 trùng postboot-check.sh) — nhất quán với câu chuyện đính chính F-138-T10-3 (closing thêm 1 batch / 2 entry / 2 file → 10/13/13).

## §2. Cờ .done đợt 138 — 10/10 (9 luồng + T10 đóng sổ)

`round138-t1.done` (11:40:16Z, 306 B) · `round138-t2.done` (11:55:20Z, 0 B) · `round138-t3.done` (11:44:39Z, 599 B) · `round138-t4.done` (13:36:14Z, 0 B) · `round138-t5.done` (12:36:06Z, 1.989 B) · `round138-t6.done` (11:46:09Z, 1.130 B) · `round138-t7.done` (13:08:52Z, 0 B) · `round138-t8.done` (13:33:46Z, 665 B) · `round138-t9.done` (13:35:13Z, 21 B) · `round138-t10.done` (14:01:14Z, 859 B — nội dung ghi verdict CHẤP NHẬN, suite 27/27, O8 21/21 ×2, đếm 10/13/13, lũy kế 278/618/534, boot đóng 914964c3, lock trống 0+87, preview 530e10a7). T9 xong cuối trong 9 luồng (13:35:13Z); T10 đóng 14:01:14Z, TRỄ ~1 phút so với hạn cứng ước lượng ~14:00Z (đúng F-138-T10-4). Brief ghi "9/9 cờ" = 9 luồng công việc; cờ thứ 10 là cờ đóng sổ của T10 — đủ 10/10 trên đĩa.

## §3. Aggregate đợt 138 — đọc toàn bộ, nhất quán nội bộ

- File `docs/PHASE9_ROUND138_LIMITS.md`: **93.097 B** (mtime 14:10Z — sau cờ T10 14:01:14Z, do parent chèn §12.3). Về con số 86.000 B trong brief/log staging, xem F-139-T1-2: 86.000 B là kích thước lúc stage (13:59Z) → 87.252 B lúc parent verify (sửa cuối của T10, +1.252 B) → +5.845 B (§12.3) = 93.097 B hiện tại; cộng đúng từng bước, không phải sai số.
- **§12.3 quyết parent đủ 11 điểm (a)–(k), khớp từng điểm với bản tóm tắt quyết trong build-loop log (dòng 7275):** (a) CHẤP NHẬN đóng đợt 138 9/9 (trễ 1 phút không phải vấn đề verdict); (b) GIỮ NGUYÊN kế hoạch đo lại lượt yên ở #16, không đổi cách đo, không hạ gate A; (c) GIỮ NGUYÊN ngưỡng gate A ≥1024 MB, chờ balloon tự xả; nếu đợt 139 vẫn ~500 MB mới xem can thiệp host; (d) GIỮ NGUYÊN quy trình birefnet + guard 6.144 MiB, không thử ở ~99%; u2net vẫn là fallback; (e) boot 914964c3 = #95? TẠM (chờ merged mù #58 của T2-139); khung chết #94? ứng viên chuẩn (11:52:12Z, 11:52:20Z] (~8 s), biên ngoài 44 s; khung chết #93? GIỮ chuẩn (09:35:47Z, 09:36:01Z] (14 s); sự kiện #19 xác nhận; (f) dải dự báo chuẩn cho #96?: dải T2 [10:03:39Z, 12:01:56Z] (FULL70); (g) ĐỔI watchdog diag path sang đợt hiện tại ở đợt 139 (ưu tiên đường dẫn ổn định không gắn theo đợt); (h) CHẤP NHẬN mất file thô scan #43; T2-139 đối chiếu WFS #45 bằng số tổng kết; (i) đợt 138 KHÔNG ĐẾM vào số đợt 0-kẹt (chuỗi dừng ở 9); (j) headroom 2.064 VẪN CHỈ THEO DÕI, chưa đưa lên user; (k) XÁC NHẬN gap #93?→#94? [5.320, 5.340] s → CERT 55 / FULL 70. §12.2 ghi "(đã quyết ở §12.3 dưới)" đúng mẫu.
- **Footer "Batch stage / Tổng batch: 10 batch / 13 entry / 13 file (lũy kế 111–138: 278/618/534)" còn nguyên.**
- Các claim lớn trong aggregate đều có đối chiếu chéo §10.1 ghi rõ, không tự chốt vượt thẩm quyền: số boot (T2/T6/T7/T5/T4/T8), dải dự báo T2 vs T6 chênh 9 s / 8 s (ghi rõ, không giấu), đỉnh RAM 4 sampler đồng thuận (T9 6.232.924 kB > T2 6.204.548 kB > T5 6.112.624 kB, T4 poll #12 ~6.207.488 kB), WFS #44 hai lần quét độc lập khớp sau giải thích delta, headroom T5 vs T9 chênh 1 do khác thời điểm đo, kích thước LIMITS T4/T9 trong log bị lỗi thời (đã giải thích ở §10.1(i)).
- **Ngoại lệ duy nhất về tính nhất quán nội bộ: §10.2 "0 reboot trong phiên đóng sổ" đã lỗi thời — xem F-139-T1-1.** Mọi claim đo lường khác đều có bằng chứng trên đĩa.

## §4. Đối chiếu 9 file LIMITS luồng + DEF với aggregate

| Luồng | File (byte) | Khớp aggregate |
|---|---|---|
| T1 verify 137 | 12.657 | Đếm 137 = 10/15/15; lũy kế 268/605/523; tái kiểm 111–136 = 258/590/513; 4 sai số F-138-T1-1..4 — khớp §1 |
| T2 EPERM | 58.411 | Probe #57 ok=2 fail=0; mù #57 ĐÓNG HOÀN TOÀN; gap [5.320 s, 5.340 s] → CERT 55 / FULL 70; dải #95? [10:03:39Z, 12:01:56Z]; 8 sai số F-138-T2-1..8 — khớp §2 (grep: CERT 55, FULL 70, "5.320 s" có mặt) |
| T3 DEF | 15.227 | DEF v0.5 38.237 B; P5 34–52 ms kiểm khớp 100% số T4; P3' stall-based 5/5 seq; 5 sai số F-138-T3-1..5 — khớp §3 (grep DEF: "34–52" 10 hit, "P3'" 22 hit) |
| T4 yên #15 | 20.147 | 0 attempt; gate A không mở lần nào đồng thời với gate 0; balloon 6.443.824 kB; 120 poll boot mới + 13 poll boot cũ; 6 sai số F-138-T4-1..6 — khớp §4 |
| T5 infra | 52.733 | Replay #94? 1.545/221/462; luật (C) kích hoạt lần đầu 12:14:14Z, --repair PASS; WFS #44 chênh 0; 5 sai số F-138-T5-1..5 — khớp §5 |
| T6 lock | 50.693 | Lock khỏe 952 dòng/275 cặp; prune lần 13 xóa 0; chuỗi #57→#94?; dải #95? FULL69 [10:03:30Z, 12:02:04Z]; 0 sai số mới — khớp §6 |
| T7 scheduler | 22.097 | Cửa lành 0 slot thiếu mới; HB 6/6, DR 3/3; started_at lượt 138 bị viết lại (btime + 50 s, kỷ lục mới); 2 sai số F-138-T7-1..2 — khớp §7 (grep: 11:53:10Z có mặt) |
| T8 harness | 28.318 | Gate không mở; waiter deadline 13:30Z exit 3, không gia hạn; 0 lần chạy; H1 BÁC BỎ / H2 KHÔNG ỦNG HỘ / H3 VẪN MỞ; 9 sai số F-138-T8-1..9 — khớp §8 |
| T9 headroom | 39.972 | Headroom 2.064 (chênh 0 hai lần đo chính); đỉnh RAM 6.232.924 kB = 99,07% guard lúc 11:51:51Z; 0 mẫu ≥ 6.144 MiB; 7 sai số F-138-T9-1..7 — khớp §9 (grep: 6.232.924 kB ×12, 99,07% ×8) |

Kiểm độc lập thêm: suite log của T10 có **27 dòng `exit=0`** + "ALL DONE 13:44:59Z boot 914964c3" + "preview-engine: 354 assertions pass"; O8 log có **42 dòng PASS**, exit 0, lock t10-round138 giữ 115 s đã nhả 13:47:01Z (khớp `t10-o8-lock.log`). **Lock lúc đóng ĐÃ KIỂM LẠI ĐỘC LẬP từ log hiện tại:** file `vite-lock-v2.log` nay 964 dòng = 961 dòng lúc đóng + đúng 3 dòng của T4 đợt 139 (14:48:38–44Z); đếm thô lúc đóng: TICKET 293 / ACQUIRED 284 / RELEASED 278 / COOLDOWN 91 → trừ 6 dòng repro = chính thức 291/282/276/91, khớp hoàn toàn §10.2 của T10. Thư mục cooldown vẫn 87 file.

## §5. GAP §67 + build-loop log

- **GAP §67 đã viết** trong `~/workspace/repo-1/PHASE9_GAP_ANALYSIS.md` (dòng 1790, section đầy đủ 11 bullet, dòng 1790–1800: T1–T10, lượt yên #15, 1 reboot giữa lượt, CERT 55/FULL 70, DEF v0.5, luật (C), started_at +50 s, đỉnh RAM 99,07%, O8 WebKit lần 16). File GAP hiện 403.632 B (tăng từ 383.504 B lúc đóng đợt 137 — đúng một section §67).
- **Build-loop log mục đợt 138 khớp aggregate:** mở/đóng (suite 27/27, O8 21/21 ×2, đếm 10/13/13, lũy kế 278/618/534 — lần tái kiểm thứ 17), quyết parent (a)–(k) (log dòng 7275) khớp từng điểm với aggregate §12.3, "KHÔNG PUSH — batch chờ user (đợt 136 = 12 + đợt 137 = 15 + đợt 138 = 13 = 40 file)" khớp số đếm từng đợt. Log cũng ghi "chốt chặn đã xóa khi đóng" + parent verify file không còn; marker hiện tại là của **đợt 139** (tạo 14:37Z, "Đợt 139 đang chạy").
- **Log lặp lại con số 14:03:07Z** (dòng 7259/7268/7274: "boot mới 541524e2 lúc 14:03:07Z (parent verify 14:04:50Z)") — cùng nguồn sai như F-139-T1-1; cần đính chính trong log đợt 139, không sửa ngược log đợt 138 đã đóng.

## §6. Sai số (F-139-T1-n) — không sai số nào đổi verdict

- **F-139-T1-1 — Reboot sau lần kiểm cuối của T10 có btime thật 13:53:41Z, KHÔNG phải 14:03:07Z; aggregate §10.2 "0 reboot trong phiên đóng sổ" đã lỗi thời (sai số hồ sơ, KHÔNG đổi verdict).** Bằng chứng btime 13:53:41Z (epoch 1795010021) từ 4 nguồn độc lập, khớp nhau: (1) /proc/stat btime; (2) journal first entry 13:53:53Z (boot+12 s, đúng mẫu +12–16 s của mọi boot trước); (3) `who -b` 13:53 + `uptime -s` 13:53:41Z + uptime 49 phút lúc 14:43:23Z; (4) thời gian sinh `/` 13:53:51Z (boot+10 s). Reboot nằm giữa lần ghi cuối của T10 (`t10-o8.log` 13:47:01Z) và cờ `round138-t10.done` (14:01:14Z) — phiên đóng sổ của T10 ĐÃ bị reboot cắt (thư mục `round138-t10/` không có file nào sau 13:47:01Z). Câu "0 reboot trong phiên đóng sổ" được viết lúc soạn nháp ~13:50Z (đúng lúc đó, xem F-138-T10-4) rồi bị reboot 13:53:41Z làm sai, không được sửa lại. Con số "14:03:07Z" lệch +566 s so với btime thật — nhiều khả năng là giờ parent quan sát/check boot mới (log ghi "parent verify 14:04:50Z"), không phải btime; nó đã lan sang memory, log (3 dòng) và marker đợt 139 "(btime 14:03:07Z)". Hệ quả: (i) câu "1 reboot SAU khi đóng cờ" sai thứ tự — reboot TRƯỚC cờ 14:01:14Z; (ii) **T2-139 PHẢI dùng btime 13:53:41Z (epoch 1795010021)** cho gap #95?→#96? và khung chết #95? — dùng 14:03:07Z sẽ làm gap danh nghĩa dài hơn 566 s và khung chết sai; (iii) mốc cuối còn sống của boot 914964c3 là `t10-o8.log` 13:47:01Z (bằng chứng file cứng) / bản nháp aggregate ~13:50Z → khung chết #95? ứng viên ~(13:47:01Z hoặc ~13:50Z, 13:53:41Z] (~4–7 phút), chờ T2-139 chốt từ merged mù #58. Không đổi verdict: mọi bằng chứng đo (suite/O8/đếm/cây/lock) đều chạy 13:40–13:47Z trên boot 914964c3, trước reboot; cờ + aggregate đầy đủ; parent đã quyết trên đúng các số đó.
- **F-139-T1-2 — Số 86.000 B trong brief/log staging là kích thước lúc stage, không phải kích thước cuối (ghi chú, không phải lỗi).** Aggregate lúc stage closing (13:59Z) = 86.000 B → lúc parent verify = 87.252 B (sửa cuối của T10: F-138-T10-4 + giờ header, +1.252 B) → sau khi chèn §12.3 (5.845 B) = 93.097 B hiện tại. 86.000 + 1.252 + 5.845 = 93.097 khớp chính xác (87.149 B trước dòng §12.3 + 103 B footer = 87.252 B lúc verify). Ghi rõ để T1 đợt sau khỏi tưởng aggregate thiếu/sai.
- **F-139-T1-3 — Lỗi script đếm của chính T1 (không ảnh hưởng số đếm).** Bản đầu `/tmp/t1-139-count.py` crash ở phần in danh sách do biến `u` bị ghi đè thành int sau vòng stats cuối; các số đếm đã in TRƯỚC khi crash là đúng, và đã chạy lại script riêng cho kiểm tồn tại (534/534 tồn tại, 0 file paths không thuần NUL). Ghi rõ để đợt sau khỏi copy.
- **F-139-T1-4 — Không tái chạy suite 27/27 / O8 21/21 trong phiên verify này** (quy trình T1 là kiểm chứng tài liệu + đếm + cây + log trên đĩa, không chạy lại toàn bộ suite; kết quả suite/O8 lấy theo log `round138-t10-suites.log` + `t10-o8.log` của T10, còn trên đĩa trong `hidden_files/round138-t10/`). Ghi rõ giới hạn này thay vì tuyên bố đã chạy lại.
- **F-139-T1-5 — Không verify được HEAD df3dffae bằng git cục bộ (giới hạn của chính T1, lặp lại F-138-T1-2).** `~/workspace/repo-1` không có thư mục `.git`; HEAD df3dffae lấy theo build-loop log + hồ sơ PUSH #7, không kiểm độc lập được từ máy này. Cây làm việc (preview.tsx/media.ts/vite.config.ts) đã kiểm bằng md5 và khớp.
- **F-139-T1-6 — Hai file bằng chứng T10 trích dẫn trong aggregate §10.2 KHÔNG có trên đĩa (thiếu hồ sơ, không đổi verdict).** `t10-closing-checks.txt` (kiểm 0 process sót + /tmp/.X11-unix/ trống lúc đóng) và `t10-started-at-138.txt` (truy vấn scheduler.job_runs 13:47Z) đều không tồn tại trong `round138-t10/` lẫn toàn bộ `hidden_files/` + `repo-1` + `/tmp` (chỉ có bản của các đợt 135/136/137 cho file thứ nhất). Khả năng cao: T10 ghi kết luận kiểm vào bản nháp aggregate ~13:50Z nhưng chưa kịp lưu file output thì phiên bị reboot 13:53:41Z cắt (xem F-139-T1-1). Các claim liên quan vẫn đứng bằng bằng chứng khác: started_at 11:53:10Z = btime + 50 s được T7 quan sát độc lập trong phiên (grep T7 LIMITS: 11:53:10Z ×2); suite/O8 log cho thấy kết thúc sạch + lock đã nhả. Trạng thái process/socket lúc đóng không kiểm lại được nay (đợt 139 đang chạy) — ghi rõ giới hạn thay vì khẳng định.
- **Không có sai số nào khác.** Đếm, cờ, cây, GAP §67, quyết parent (a)–(k), footer, kích thước LIMITS các luồng, log suite/O8, log lock — tất cả khớp.

## §7. Nợ mở chuyển đợt 139 (theo aggregate §11 + quyết parent §12.3)

- T4 lượt yên #16: đo lại (P3' stall-based prereg DEF v0.5 vẫn chưa được kiểm lần nào; cộng dồn P1–P7 giữ nguyên tới khi có lượt hợp lệ).
- T8: **ĐỔI watchdog diag path sang đợt hiện tại** (quyết (g) — ưu tiên đường dẫn ổn định không gắn theo đợt, kèm kiểm chứng md5).
- T2 probe #58 + mù #58: chứng nhận gap #94?→#95? = 8.179 s từ merged mù #58; **btime boot 541524e2 là 13:53:41Z (epoch 1795010021), KHÔNG phải 14:03:07Z** (xem F-139-T1-1); khung chết #95? ứng viên ~(13:47:01Z, 13:53:41Z]; WFS #45 đối chiếu bằng số tổng kết (quyết (h)).
- Gate A + balloon: giữ ngưỡng ≥1024 MB; nếu đợt 139 vẫn ~500 MB thì parent/T10 mới xem can thiệp host (quyết (c)).
- Birefnet: giữ quy trình + guard 6.144 MiB; chỉ thử khi quan sát được available ≥ 6.144 MiB (quyết (d)); u2net là fallback chính thức.
- G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user. R9 (a) vẫn chờ user — số đếm VẪN LÀ 16. ci-security.yml vẫn 403 — chờ user. TTS 39 cấm kiểm lại. Headroom 2.064 — chỉ theo dõi. File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận.
- Đính chính btime 541524e2 trong marker đợt 139 (14:03:07Z → 13:53:41Z) trước khi T2-139 làm toán gap.

## Footer
Batch stage / Tổng batch: 1 batch / 1 entry / 1 file (đợt 139 — T1 verify 138; lũy kế 111–139 chưa tính — T10 đợt 139 chốt sau)

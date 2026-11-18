# PHASE9 ROUND121 — LIMITS gộp (đợt 121, lượt cron 15:35 +07 16/11/2026)

> Đợt 121 đóng bởi T10 trong phiên (phase 1 xong 10:16:04Z → đóng ~10:28Z, trước hạn cứng 10:45Z).
> 9/9 luồng về. KHÔNG push, KHÔNG release/tag, KHÔNG code giả.

## 0. Kiểm chứng gộp — T10 verify độc lập

- **Suite cây gộp: 27/27 exit 0** (tsc-web 0, tsc-desktop 0, vite build 0 + 24 test; log `round121-t10/round121-t10-suites.log`, chạy 10:09:32Z, boot #63, RAMavail 1171 MB).
- **O8: Chromium 21/21 pass, 0 fail, 0 note, exit 0 (10:15:08Z); WebKit 21/21 pass, 0 fail, 0 note, exit 0 (10:16:03Z, boot #63)** (log `round121-t10/t10-o8.log`). WebKit xanh nhờ postboot PASS sau `--repair` của T5 (không phải replay).
- **Recount — ĐÍNH CHÍNH:** phase-1 driver gọi nhầm `recount-push120.py` (tên file cũ còn sót sau khi adapt script — file không tồn tại nên recount phase-1 ra log rỗng; skeleton ghi "recount chưa chạy" là đúng lúc đó). **T10 đã chạy lại tay `recount-push121.py` 10:22Z:** đợt 121 = **9 batch / 157 entry / 157 file duy nhất** (chưa tính closing); lũy kế đợt 111–121 = **106 batch / 340 entry / 310 file duy nhất** + 1 oversize 6,4 MB (`benchmarks/results/webkit-blob-flaky-96x3.json`, chưa lên từ trước). Sau closing batch (+2 entry: LIMITS gộp + GAP_ANALYSIS §50): đợt 121 = **10 batch / 159 entry / 159 file duy nhất**; lũy kế = **107 batch / 342 entry / 311 file duy nhất** + 1 oversize 6,4 MB.
- **Cờ done 9/9** (giờ Z 16/11): T1 10:01, T2 08:53, T3 10:09, T4 09:05, T5 10:01, T6 08:45, T7 09:44, T8 09:09, T9 09:32. Poller kích hoạt phase 1 lúc 10:09:31Z theo 9/9 (không cần chờ tới 10:15Z).
- **Cây không đổi:** preview.tsx `5be5a250a552357c50cc189de9a9c08a` / media.ts `2c384ed13703809d5e999311147745e7` trước/sau phase 1 (md5 BEFORE = AFTER); lock v2 `cd0c05c1` không đổi từ đợt 120. HEAD a8f26d48 (không đổi).
- **Verify headline từng luồng (T10 đọc LIMITS + dữ liệu thô):** T1 DEFER đúng prereg (sai đường cờ, xem §1 — đính chính nguyên nhân); T2 pilot PSI khớp số trong DEF (§2); T3 fix probe + lượt yên khớp log probe (§3); T4 probe #40 + mù #39 khớp log v2/heartbeat (§4); T5 repair lần đầu khớp cờ REPAIR_TRIGGERED + POSTBOOT_PASS 09:28Z (§5); T6 lock khỏe khớp quét zombie (§6); T7 8/8 run nhanh khớp analyzer (§7); T8 verdict TRUNG TÍNH khớp số gộp trong file .done (§8); T9 mirror 140 file — T10 kiểm mẫu 3 file trong batch đều có `watch: { ignored: ["**/**"] }` + mtime trong đợt (§9). Không phát hiện headline nào sai số liệu; chỉ có 2 đính chính: (a) nguyên nhân DEFER của T1 là sai đường cờ, không phải postboot chưa PASS; (b) recount phase-1 lỗi tên file, đã chạy lại tay.

## 1. T1 — E4 lượt 4 (B, gop30, e4b4): DEFER-POSTBOOT, 0 lượt đo được

- **Kết quả: lượt 4 KHÔNG ĐẾM ĐƯỢC — DEFER-POSTBOOT.** Driver chờ cờ T7 đợt 121 đủ 60 phút (08:55:13–09:55:15Z) mà không có cờ nào (`t7-replay-done.md` / `POSTBOOT_PASS` đều không xuất hiện, kiểm lần cuối 09:58:40Z vẫn không có). Không chạy probe, không lấy lock, không có số đo nào — và không bịa số liệu. **Lô E4BATCH vẫn 1/10 (1 VOID, 0 CAUGHT). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**
- **ĐÍNH CHÍNH T10 (nguyên nhân DEFER):** postboot thực tế **ĐÃ PASS từ 09:27:19Z** — T5 ghi `round121-t5/POSTBOOT_PASS` lúc 09:28Z ("PASS nhờ repair", xác nhận độc lập 5 lần) và driver T1 tự kiểm cuối lúc 09:55:15Z cũng PASS đầy đủ (wrapper/libs/GST/apt). T1 chờ sai đường cờ: prereg của T1 đăng ký cờ `t7-replay-done.md` / `POSTBOOT_PASS` trong `round121-t7/` — mang tên luồng hạ tầng của **đợt 120** (T7); đợt 121 luồng hạ tầng là **T5**, cờ nằm ở `round121-t5/`. T1 không nới tiêu chí giữa lượt (đúng kỷ luật prereg) nên DEFER vẫn đúng theo prereg, nhưng nguyên nhân là **sai đường cờ do đổi số luồng giữa các đợt**, không phải hạ tầng chưa sẵn sàng. Bài học: prereg E4 các đợt sau phải ghi rõ tên thư mục cờ của luồng hạ tầng **đợt hiện tại**.
- **Lệch đăng ký (ghi rõ, không giấu):** theo prereg §2, DEFER không đếm nên lượt 3 phải CHẠY LẠI trước khi chuyển lượt 4. Nhiệm vụ đợt 121 của parent + chủ đề đợt 121 đều chỉ định chạy lượt 4 (B, gop30, phase `e4b4`). T1 chạy theo chỉ định parent; hệ quả: nhánh A đang thiếu 1 lượt theo lịch (lượt 3 chưa chạy lại) và giờ lượt 4 cũng DEFER nên cả hai lượt đều treo. **Cần quyết parent:** (i) lượt 3 (A) chạy bù ở đợt sau (lô giữ đủ 5A+5B) hay bỏ lượt 3; (ii) thứ tự chạy lại — lượt 3 trước hay lượt 4 (DEFER gần nhất) trước.
- LIMITS: `docs/PHASE9_ROUND121_T1_E4BATCH_LIMITS.md` (17.981 B). Batch stage: `phase9-round121-t1-e4batch.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t1/`. Cờ `round121-t1.done` đã tạo (10:01Z).

## 2. T2 — Định nghĩa trục tải PSI cho bar F2 leg B (v0.1) + pilot: PSI phân biệt được mức tải, bão hòa trên ~6 hog

- **Kết quả: ĐÃ VIẾT XONG định nghĩa v0.1 + pilot kiểm chứng xong** (quyết parent đợt 120 §12.1: leg B theo định nghĩa cũ DỪNG; chạy tiếp chỉ sau khi định nghĩa tải bằng PSI được viết ra). Không sửa production. Không chạy s79, không chạy leg B thật (chỉ pilot + định nghĩa).
- **Pilot (boot #62, 08:42–08:49Z, 4 mức hog 0/2/6/12, mỗi mức 90 s, mẫu 2 s): PSI cpu.some avg60 PHÂN BIỆT ĐƯỢC các mức tải — trái với load1.** avg60 đuôi pha (30 s cuối, đã hội tụ): 0 hog ~11% · 2 hog **72,2%** · 6 hog **91,1%** · 12 hog **94,9%**. Cùng lúc load1 nói ngược: 2 hog → load1 0,40; 6 hog → load1 0,07 ("nhàn" trong lúc PSI 72–91% = nghẽn nặng) — thêm một bằng chứng trực tiếp load1 vô hiệu.
- **PSI BÃO HÒA trên ~6 hog:** 6 vs 12 hog chỉ chênh ~4 điểm avg60 (91,1% vs 94,9%). Band Nặng do đó là một band duy nhất, không chia nhỏ theo số hog.
- **Band v0.1 (TẠM THỜI, chờ hiệu chỉnh sau khi đo leg B): Yên <30% · Vừa 30–80% · Nặng >80%** (PSI cpu.some avg60 chính + threadsR phụ + tickRate chỉ báo). Quy tắc VOID đã định nghĩa (avg60 bracket lệch band >10 điểm; trung bình avg60 trong run ngoài band; hog chết giữa run; thiếu >10% mẫu PSI). Mọi kết luận dùng ngưỡng v0.1 đều kèm caveat tạm thời; DEF lên v0.2 sau khi có dữ liệu leg B (T_startup theo band, tickRate theo band).
- LIMITS: `docs/PHASE9_ROUND121_T2_PSIAXIS_LIMITS.md` (11.937 B) + DEF `docs/PHASE9_ROUND121_T2_PSIAXIS_DEF.md`. Batch stage: `phase9-round121-t2-psiaxis.txt` (4 entry: LIMITS + DEF + `docs/PHASE9_ROUND122_T3_LEGB_PREREG_TEMPLATE.md` + `benchmarks/render/psi-axis-pilot-121t2.sh`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t2/`. Cờ `round121-t2.done` đã tạo (08:53:59Z — ngay trước reboot #63).

## 3. T3 — WebKit ≤60 ms: SỬA probe writePartial (timeout 30 s) + 1 lượt yên HỢP LỆ: median 52,0 ms, ngưỡng GIỮ

- **Fix probe (nợ §9.2 đợt 120 — ĐÃ ĐÓNG):** `pwEvalTimeout` (race 30 s) cho `writePartial` + fetch y2 cuối; nhánh lỗi GIỮ tickCost lần fetch thành công gần nhất + ghi `tickCostStatus`/`tickCostNote` vào partial JSON, KHÔNG ghi `tc=[]` im lặng nữa. Kiểm chứng sống 2 chiều: ép timeout 1 ms → nhánh TIMEOUT kích hoạt, probe vẫn hoàn thành exit 0; timeout mặc định 30 s → 20/20 pass, mọi lần ghi partial đều `tickCost ok` (n=529).
- **Lượt yên attempt1 trên boot #63 (PASS NHỜ REPAIR của T5): 20/20 pass, lớp B 5/5 (B1/B2/B3/B4/B5 đều ĐẠT).** tickCost total n=530, median **52,0 ms**, p90 80,0 ms, max 111, min 26; hậu flip+2000 ms median 52,0 ms. (b) nomatch 0, lag max +4f, 0 lag ≥+5f. F6' 100%/100% (bar (1)/(2)) — vẫn ĐÓNG từ L7. Stale-ghost: 0 event (không tái hiện P4/Q5/frame-23).
- **Verdict ngưỡng (theo prereg §1, lượt ĐẠT lớp B): GIỮ ngưỡng WebKit ≤60 ms** — lượt yên theo dõi lần 3 sau khi chốt (lần 1 S5 49,5; lần 2 T4 đợt 118 attempt8 40,0; lần 3 T3 đợt 121 attempt1 52,0). Median cao hơn 40,0 (đợt 118) nhưng vẫn trong ngưỡng với biên 8 ms.
- LIMITS: `docs/PHASE9_ROUND121_T3_WEBKIT60MS_LIMITS.md` (33.100 B). Batch stage: `phase9-round121-t3-webkit60ms.txt` (2 entry: LIMITS + `benchmarks/render/probe121t3-ghost-k7.webkit.mjs`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t3/`. Cờ `round121-t3.done` đã tạo (10:09Z).

## 4. T4 — EPERM probe #40 + mù #39 (I ĐÓNG, J MỞ, K ĐÓNG) + mù #38 G VẪN MỞ (thử cuối) + BƯỚC NHẢY CLOCK tại #63

- **Probe #40: ok=2 fail=0**, 08:40:45Z, boot #62 (`9788ce28`), exit 0. Checklist P8 §2.3 chạy ĐÚNG 1 lần (08:40Z): status DEAD/STALE → once probe #40 → status ALIVE (n=40). Log v2 tăng đúng 3 dòng (109 → 112), như R7/S7/T7/T6/T5 (+3); prereg §1 đã dự báo đúng +3 trước khi đo. Heartbeat nay n=40, ts 08:40:45Z, boot 9788ce28.
- **Mù #39: đoạn I ĐÓNG, đoạn J MỞ, đoạn K ĐÓNG.** Khoảng mù #39: 05:44:31Z → 08:40:45Z (2h56'14") — **KHÔNG ĐÓNG** (đuôi đoạn J < sàn: 123 s + đuôi 102 s). Tối đa 2 ẩn danh nghĩa (đuôi đoạn J).
- **Gap #60→#61 = 2h05'09" (7.509 s) ĐƯỢC CHỨNG NHẬN** (điểm, caveat F61 chưa kiểm + cận nhảy X ≤ 36 s). **Gap #61→#62 = 1h34'49" (5.689 s) CHỈ LÀ SPAN** (đoạn J mở) — KHÔNG vào FULL/CERT. **CERT n=33 → n=34; FULL n=48 → n=49.**
- **Mù #38 đoạn G: THỬ ĐÓNG LẦN CUỐI — VẪN MỞ. Kết luận cuối: G không đóng được — không thử lại nữa.** Tối đa 6 ẩn danh nghĩa (đoạn G). Mù #37: parent đã chấp nhận KHÔNG ĐÓNG — không thử lại.
- **PHÁT HIỆN MỚI: BƯỚC NHẢY CLOCK tại reboot #63** — lần thứ ba chứng minh được nhảy clock tại một reboot trên VM này (lần 1: #54, lần 2: #58). Gap #62→#63 = 27'18" (btime 08:25:47Z → 08:53:05Z), khoảng không chắc [1638, 1833] s theo T4 — **CHƯA chứng nhận, thuộc mù #40**. Reboot #63 không ảnh hưởng mù #39 (kết thúc ở probe #40 08:40:45Z) và không làm mất log EPERM.
- EPERM 0 sóng thật. Birefnet KHÔNG chạy (vẫn 0 lần chạy thành công trong gói; RAM < 6 GB guard). WFS lần thứ 27.
- LIMITS: `docs/PHASE9_ROUND121_T4_EPERM_LIMITS.md` (44.263 B — OVERSIZE > 37.768, lúc push cần ENABLE_PRIVSEP=0). Batch stage: `phase9-round121-t4-eperm.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t4/` (prereg viết trước khi đo). Cờ `round121-t4.done` đã tạo (09:05Z).

## 5. T5 — Hạ tầng boot #62/#63: replay #62 chạy xong rồi reboot; replay #63 chết dạng (B) → luật replay-chết kích hoạt LẦN ĐẦU, --repair chạy sống LẦN ĐẦU: PASS, headroom hồi 0 → 5436

- **Boot #62? (số tạm):** boot 08:25:47Z, boot_id `9788ce28`, sau #61 06:50:58Z (gap 1h34'49" SPAN). `journalctl --list-boots` chỉ còn 1 boot; `last -x` chỉ còn 1 dòng reboot 08:25Z — log các boot trước đã mất cùng rootfs rebuild (cùng cơ chế mất log như mọi boot trước).
- **Postboot #62?: FAIL lúc boot ~15'** (check-only exit 1, try1 + try1b + sau sửa script, cùng kết quả). Thiếu 5 lib + GST isomp4/libav + 11 gói apt. Cờ `POSTBOOT_FAIL` đã ghi theo §8.5 (ghi rõ replay ĐANG CHẠY để luồng khác không đọc nhầm FAIL thành replay chết). **Replay ĐANG CHẠY — KHÔNG PHẢI CHẾT** (dpkg configure lúc kiểm) → luật §8.2 KHÔNG kích hoạt — đúng thiết kế của luật.
- **Replay #62? chạy xong 08:52:06Z (1509 dòng) rồi reboot 08:53:05Z** trước khi watcher kịp kiểm postboot PASS (poll 10) — PASS không quan sát được. Watcher (nohup setsid PID 9480) chết theo reboot; T5 khởi động lại trên boot mới.
- **Boot #63? (số tạm):** boot 08:53:05Z, boot_id `725453a2`. Replay chết dạng (B) "chạm mà không cài" (wrapper chết live 09:07:48Z, 09:08:48Z). **Luật §8.2 kích hoạt LẦN ĐẦU — đủ 5/5 điều kiện (verify sạch 09:12:22Z); cờ REPAIR_TRIGGERED ghi TRƯỚC; `--repair` chạy 1 lần có giám sát 09:14:14Z → 09:26:57Z, exit 0, PASS.** Check-only exit 0 lúc 09:27:19Z. Cờ `POSTBOOT_PASS` đã ghi ("PASS nhờ repair, không phải replay") + caveat symlink debroot (số file debroot vẫn 269). **PASS xác nhận độc lập 5 lần** (T5 09:27:19Z + watcher poll 40/50/60 + cuối). Postboot script đã vá K1 (giữ LD_LIBRARY_PATH).
- **Headroom inotify hiệu dụng: 0 (#62?) → 5435–5436 (#63?)** — hồi sau repair; vite thường chạy được trở lại. (Xu hướng rơi dài hạn qua các boot vẫn còn; xem §9.)
- LIMITS: `docs/PHASE9_ROUND121_T5_INFRA_LIMITS.md` (49.190 B — OVERSIZE > 37.768, lúc push cần ENABLE_PRIVSEP=0). Batch stage: `phase9-round121-t5-infra.txt` (2 entry: LIMITS + `apps/web/scripts/vcut-webkit-postboot-check.sh`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t5/` (POSTBOOT_FAIL_b62, POSTBOOT_PASS 09:28Z, REPAIR_TRIGGERED, watcher log). Cờ `round121-t5.done` đã tạo (10:01Z).

## 6. T6 — Sức khỏe lock v2 sau boot #62 + housekeeping: KHỎE

- **Kết luận sức khỏe: lock KHỎE.** Trống sau boot, 0 zombie, 0 tiến trình vite/node/webkit sót, 0 cổng lắng nghe (lúc 08:39Z và 08:43:35Z, cả khi probe Chromium của T8 đang chạy live). `queue` in rỗng, 0 ticket chờ + 38 cooldown. Fix text đợt 120 không đổi hành vi (guard còn, return 1 giữ nguyên); script v2 `cd0c05c1` khớp baseline, v1 frozen `fd21193c`, poll-quiet `1710e480`, suite `1c0d7eaa` — không script nào đổi từ đợt 120 tới nay.
- **Housekeeping (CHỈ ĐO, KHÔNG prune):** cooldown tích lũy 38 file / 532 byte. Không xóa file cooldown, không sửa script lock, không đụng production.
- LIMITS: `docs/PHASE9_ROUND121_T6_LOCKHEALTH_LIMITS.md` (17.194 B). Batch stage: `phase9-round121-t6-lockhealth.txt` (1 entry), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t6/`. Cờ `round121-t6.done` đã tạo (08:45:54Z).

## 7. T7 — Bar F2 pha (a): chế độ chậm KHÔNG TÁI HIỆN trên boot #63 (8/8 run nhanh); nguyên nhân GỐC vẫn CHƯA PHÂN ĐỊNH ĐƯỢC

- **Đo trên boot #63?** (`725453a2`, btime 08:53:05Z) — không phải boot #62 lúc mở đợt (reboot 08:53:05Z giữa chừng); mọi phép đo chạy sau khi T5 chạy `--repair` và postboot PASS. Cây H3f không đổi trước/sau mọi run (preview.tsx 5be5a250, media.ts 2c384ed1). Không patch production; mọi run đều probe-only. Prereg viết TRƯỚC mọi phép đo (08:45Z); 2 điều chỉnh ghi rõ: (i) đo trên #63 thay vì #62; (ii) analyzer sửa lỗi chia psiStallRate (÷10 → ÷10000).
- **Chế độ chậm 1,42–2,39 s (verdict đợt 120): KHÔNG TÁI HIỆN trên boot #63 — 0/8 run.** T_startup (định nghĩa cũ, trộn 2 element) = 0,911/0,421/0,479/0,636/0,564/0,458/0,489/0,751 s (median 0,527; p90 0,799 tuyến tính / 0,911 nearest-rank) — tất cả < 1,2 s. T_startup thuần-blob (el2 loadstart→loadedmetadata) = 0,773/0,421/0,479/0,636/0,564/0,458/0,489/0,751 s (median 0,527; p90 0,758 / 0,773).
- **Pha (b) T_seek: Vẫn ĐẠT — 0,000–0,001 s ở 8/8 run** (gộp 16/16 đợt 120 + 8/8 đợt này = **24/24 run SEEKFAST có T_seek ≤ 1 ms**).
- **Chẩn đoán từng giả thuyết:** H1 (GST registry rescan lạnh) **KHÔNG ĐƯỢC ỦNG HỘ** — không có rescan/rebuild nào trong 8/8 run (registry mtime không đổi 06:58:21Z; cache đọc trong ~4 ms); run 1 — lần dùng media ĐẦU TIÊN trên boot #63 — chỉ 0,911 s, không vào dải chậm. Caveat: boot này cài GST bằng `--repair` với symlink debroot (file plugin có thể giữ mtime cũ → cache vẫn hợp lệ). H2 (cạnh tranh CPU/PSI) **KHÔNG TƯƠNG QUAN** — mọi hệ số Pearson với T_startup thuần đều |r| ≤ 0,23 (startup-window PSI cpu.some r = −0,226; stall rate r = −0,038; PSI cả run r = −0,103/0,049; threadsR r = −0,04) dù PSI cpu.some duy trì CAO suốt cửa sổ đo (stall rate 16–33%) — "tải cao → chậm" bị yếu đi, không loại trừ hẳn (PSI hệ thống quá thô). H3 (blob fetch / page cache lạnh) **BỊ LOẠI** — fetch c8.mp4 chỉ 70–289 ms, r = −0,057; độ trễ nằm ở xử lý SAU fetch (videoFor→swap 483–755 ms). H4 (decode frame đầu) **BỊ LOẠI khỏi nguyên nhân T_startup** — loadedmetadata→loadeddata/canplay = 0,000–0,001 s ở mọi run; rVFC KHÔNG ĐO ĐƯỢC (null 8/8 — WebKitGTK ở đây không bắn callback), ghi là chưa đo, không phải 0. H5 (nhầm element http/blob) **XÁC NHẬN là nhiễu đo có thật, nhưng KHÔNG giải thích được chế độ chậm** — chỉ run 1 có loadstart đầu thuộc el1 (http): T_startup trộn 0,911 vs thuần-blob 0,773 (chênh 0,138 s); run 2–8 loadstart đầu đã là el2 (blob) nên hai định nghĩa trùng nhau. Nhiễu tối đa ~0,14 s — nhỏ hơn nhiều so với dải chậm 1,42–2,39 s. H6 (giai đoạn thời gian / tuổi boot) **KHÔNG TƯƠNG QUAN** (r = 0,01 / 0,011).
- **Độ trải còn lại trong dải nhanh (0,42–0,91 s, gấp 2,2×): CHƯA PHÂN ĐỊNH ĐƯỢC.** Không biến nào đo được giải thích nó (mọi |r| < 0,3 trừ wMem 0,56 không có ý nghĩa ở n=8). Dấu vết duy nhất: timestamp dòng registry CUỐI (reg_last) tương quan mạnh với T_startup (r = 0,889) — nhưng đó là đồng-đo của cùng một sự chậm hệ thống, không phải biến độc lập / nguyên nhân.
- **Không có fix production / A/B** — không tìm ra nguyên nhân → không có fix để đối chứng. Verdict KHÔNG ĐẠT của đợt 120 vẫn đứng (dựa trên 6 run hợp lệ khác boot); chế độ chậm không tái hiện trên #63 không bác verdict đó.
- LIMITS: `docs/PHASE9_ROUND121_T7_F2STARTUP_LIMITS.md` (27.033 B). Batch stage: `phase9-round121-t7-f2startup.txt` (3 entry: probe + analyzer + LIMITS), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t7/` (prereg + driver + gate-waiter). Cờ `round121-t7.done` đã tạo (09:44Z).

## 8. T8 — Mở rộng chân B A/B H3f lên n≥30: gộp n=255 tick chậm, verdict đợt 119 KHÔNG tái hiện — TRUNG TÍNH

- **Verdict đợt này: TRUNG TÍNH — lợi ích chưa chứng minh được, không phải HẠI. "H3f GIÚP" KHÔNG còn đứng trên số gộp.**
- **Chân B gộp chính (B119 + B1 + B2, theo prereg §3): tick chậm 122/1377 = 8,9%** so với chân A đợt 119 **41/391 = 10,5%** → chỉ **−15,5%, KHÔNG đạt bar −25%** (95% CI tỉ số 0,59–1,20, chứa 1,0 = không có hiệu ứng). Longtask trung bình/run −20,6% (vừa đủ bar −20%, biên mỏng). Cần CẢ HAI bar mới giữ "GIÚP" → **không giữ được**.
- **Kiểm nhạy (chỉ run B đợt 121, B1+B2, so với A):** tick chậm +9,4%, longtask −4,8% — cùng chiều phủ định.
- **Thêm B3+B4 (bằng chứng phụ theo addendum §7–§8):** chân B gộp 5 run **386/2049 = 18,8%** vs A 10,5% → **+79,7%** (RR 1,80, CI 1,30–2,48). Nhưng số này trộn 3 boot + tải anh em leo cao trên boot #63 — CI giả định tỉ lệ đồng nhất, mà tỉ lệ thực chạy 4,0%→39,5%, nên CI này KHÔNG được đọc là "H3f gây hại". Không có bằng chứng hại nào quy được cho patch.
- **Phát hiện chính của đợt này không phải về H3f, mà về phép đo:** cùng cây H3f 5be5a250, cùng protocol, cùng hog N=4, tick chậm mỗi run là **19, 74, 29, 133, 131** (B119 19/479 = 4,0%; B1 74/410 = 18,0%, boot #62, lạnh; B2 29/488 = 5,9%, boot #62, ấm; B3 133/337 = 39,5%, boot #63 sau reboot 08:53:05Z; B4 131/335 = 39,1%, boot #63, ấm) — trung bình 77,2, trung vị 74, SD 48,4, gấp ~7 lần. Nhiễu giữa các lượt NUỐT CHỬNG hiệu ứng. Kết luận "−53,7%" đợt 119 chỉ là một lần rút thăm từ phân phối rất rộng này. Chỉ run ấm (B119+B2) hậu-hoc: −52,7%.
- **Hệ quả:** patch H3f VẪN GIỮ trên cây (5be5a250) — verdict là về bằng chứng, không phải lệnh gỡ. Cần quyết parent: giữ patch / gỡ patch / đo thêm với thiết kế chống nhiễu (n≥30 mỗi chân, cùng boot, kiểm soát tải anh em). Prereg + 2 addendum viết trước khi đo (addendum §8 do reboot làm sai tiền đề §7).
- LIMITS: `docs/PHASE9_ROUND121_T8_H3FEXT_LIMITS.md` (16.807 B). Batch stage: `phase9-round121-t8-h3fext.txt` (2 entry: LIMITS + `apps/web/scripts/probe121t8-h3fext-ab.mjs`), đã verify read-back, 0 binary. Dữ liệu thô: `hidden_files/round121-t8/`. Cờ `round121-t8.done` đã tạo (09:09Z).

## 9. T9 — Vite harness: mở rộng workaround ENOSPC (mirror L8) + kiểm kê — 140/140 mirror, 0 ENOSPC

- **Kiểm kê xong toàn repo: 199 harness dùng vite dev.** Trong đó 174 dùng config riêng (`-c`): 30 đã mirror từ trước, **140 do T9 mirror mới**, 4 chỉ tiêu thụ config của harness khác. 25 harness dùng config production mặc định (không `-c`) — **KHÔNG mirror được bằng mẫu T8**, để lại làm nợ (§10). 35 file còn lại không chạy vite dev (chỉ `vite build` / `vite preview` / static server / launcher / lock script).
- **Mirror T9: 140/140 file, mỗi file đúng 1 dòng đổi** (`server: { hmr: false }` → `server: { hmr: false, watch: { ignored: ["**/**"] } }`), cùng mẫu T8 đợt 120. `node --check` 140/140 PASS. Trích template → import config thật: 140/140 cho `server.watch.ignored === ["**/**"]` và `hmr === false`.
- **Đối chứng môi trường (trước/sau mirror):** vite config thường CHẾT `ENOSPC` (errno -28, exit 1) ngay lúc boot; cùng config có mirror thì `VITE v6.4.5 ready in 1688 ms`, trả HTTP, 0 ENOSPC. Trần inotify vẫn đầy (headroom ~434–545, xem T8 đợt 120; T5 đợt này đo 0 → 5436 sau repair) — mirror là cách duy nhất chạy được vite dev lúc này.
- **Smoke sweep 140 file: 132 PASS** (vite lên, 0 ENOSPC). 7 file EXIT:2 do **thiếu fixture từ trước** (chưa tới được vite — không liên quan mirror). 1 file TIMEOUT ở mốc 60 s nhưng log ghi rõ vite đã lên + lượt 1 chạy đầy đủ exit 0. **Vite lên thực tế: 133/140; 0 lỗi ENOSPC trong toàn bộ sweep.**
- **Đường đo không đổi (4 lần chạy đầy đủ, 1/form):** A 58o1 **3/3 pass** (= đợt 58); B 85m1 **D1 MAD 0,3835 khớp tuyệt đối** lịch sử M1/N10/F1; D 77e1-deint-fast **cả 8 mode MAD + gradient khớp tuyệt đối** bảng đợt 77; C 86n3 Chromium **VERDICT PASS** (gate bắn, canvas sáng 118,5 ≈ lịch sử 118–119). Tỉ lệ fps của 85m1 khác cửa sổ lịch sử vì chế độ máy khác (tải), không phải do mirror.
- **Production không động:** preview.tsx md5 `5be5a250…`, media.ts md5 `2c384ed1…` — khớp đúng số T8 ghi. E1/N10 md5 khớp đúng note T8.
- LIMITS: `docs/PHASE9_ROUND121_T9_VITEHARNESS_LIMITS.md` (39.437 B — OVERSIZE > 37.768, lúc push cần ENABLE_PRIVSEP=0). Batch stage: `phase9-round121-t9-viteharness.txt` (**141 entry**: LIMITS + 140 script harness đã mirror), đã verify read-back, 0 binary. T10 đã kiểm mẫu 3 file trong batch (đều có `watch: { ignored: ["**/**"] }`, mtime trong đợt) — batch 141 entry là thật, không phải liệt kê kiểm kê. Dữ liệu thô: `hidden_files/round121-t9/`. Cờ `round121-t9.done` đã tạo (09:32Z).

## 10. Nợ mở — chuyển đợt 122

1. **E4 lô lượt 3–4 đều treo (lô vẫn 1/10):** lượt 3 (A, gop250) DEFER đợt 120, lượt 4 (B, gop30) DEFER đợt 121 (sai đường cờ, xem §1). Chờ quyết parent: chạy bù lượt 3 hay bỏ; thứ tự chạy lại. Prereg E4 đợt sau phải ghi tên thư mục cờ của luồng hạ tầng **đợt hiện tại**.
2. **Bar F2 leg B theo định nghĩa PSI mới:** DEF v0.1 đã viết (T2 §2) + prereg template cho round 122 T3 đã stage trong batch T2. Leg B chạy tiếp theo band Yên/Vừa/Nặng; ngưỡng v0.1 tạm thời, lên v0.2 sau dữ liệu leg B. Verdict KHÔNG ĐẠT đợt 120 vẫn đứng; chế độ chậm không tái hiện trên boot #63 (T7 §7) nhưng không bác verdict.
3. **H3f verdict TRUNG TÍNH (§8):** "GIÚP" không còn đứng trên số gộp; nhiễu giữa các lượt nuốt chửng hiệu ứng (SD 48,4 tick chậm/run). Chờ quyết parent: giữ patch trên cây / gỡ patch / đo thêm với thiết kế chống nhiễu (n≥30 mỗi chân, cùng boot, kiểm soát tải anh em).
4. **WebKit lượt yên theo dõi:** đã có lượt yên hợp lệ lần 3 (52,0 ms, §3); ngưỡng ≤60 ms GIỮ. Probe writePartial đã sửa + kiểm chứng sống — nợ đợt 120 §9.2 ĐÃ ĐÓNG.
5. **Hạ tầng + luật replay-chết:** `--repair` chạy sống lần đầu PASS (§5) — luật §8.2 đã được kiểm chứng trong thực tế. Headroom hồi 0 → 5436 sau repair; vẫn theo dõi xu hướng rơi dài hạn. Số hiệu boot #62/#63 vẫn "tạm" (journal/wtmp chỉ giữ boot hiện tại; T5/T6 không tự xác minh độc lập).
6. **EPERM (§4):** mù #38 G ĐÃ ĐÓNG NHƯ KHÔNG ĐÓNG ĐƯỢC (thử cuối thất bại, không thử lại); mù #39 J mở; gap #62→#63 SPAN chưa chứng nhận (thuộc mù #40); CERT n=34, FULL n=49. Probe #41 đợt 122.
7. **G1:** vẫn mở, chờ user quyết — đặc biệt khung (a) M2 (20 lần yên đầu cố định, tối đa 15/20, không bao giờ đạt được) có còn là luật chơi không (parent đã HOÃN khung (a) đợt 120 §12.2, chờ user).
8. **Vite harness (§9):** 25 harness dùng config production mặc định CHƯA mirror được (không `-c`) — nợ kỹ thuật; mirror L8 đã phủ 140/174 config riêng.
9. **Nợ đứng chưa có quyết user:** G1 deinterlace; mù #22/#28–#31/#35; birefnet (chỉ thử lại khi RAM đổi, u2net là fallback chính thức); ci-security.yml 403 (chờ user); TTS 39 cấm kiểm lại; R9 (a) VẪN CHỜ user (nhắc lần 7).
10. **Lỗi vận hành cần sửa trước đợt 122:** phase-1 driver gọi nhầm `recount-push120.py` (tên file cũ còn sót) — T10 đã chạy lại tay; script adapt đợt sau phải thay cả tên file thường (không chỉ `round120` → `round121`). Waiter chạy lại poller sau 9/9 là thừa (poller thoát bình thường khi ALL 9 DONE) — waiter đợt sau chỉ chạy lại poller khi chưa đủ 9/9.

## 11. Ghi chú vận hành

- **Bài học T10 đợt 119/120 đã áp dụng:** phase 2 chạy NGAY trong cùng phiên driver (phase 1 xong 10:16:04Z → đóng ~10:28Z, trước hạn cứng 10:45Z và trước timeout cron 11:35Z); LIMITS gộp KHUNG viết ngay sau suite+O8+recount (do phase-1 driver viết tự động); recount chờ 9/9 (kích hoạt 10:09:31Z theo 9/9, không chờ tới 10:15Z).
- **Reboot #63 (08:53:05Z, gap #62→#63 27'18" SPAN, chưa chứng nhận):** giết poller + phiên chờ T10 (SIGTERM ~08:53Z, sau wait #3 08:51:48Z). T10 chạy lại 08:54:31Z (ghi RESTART), poller chạy lại (poll #1 08:54:31Z 2/9: T2, T6); phase 1 chưa chạy nên không cần tái dùng kết quả cũ. T2 về trước reboot (cờ 08:53:59Z) nhưng handoff chưa kịp về — T10 gộp từ đĩa. T5 bị cắt ngang giữa chừng (watcher replay #62 chết theo reboot) và tự khởi động lại trên boot #63 — công việc hạ tầng boot #62 stale, T5 xử lý trong LIMITS của mình.
- **Đợt mở trên boot #62, đóng trên boot #63:** boot #62 (`9788ce28`, btime 08:25:47Z, gap #61→#62 1h34'49" SPAN, GST 0 plugin lúc mở, postboot FAIL); boot #63 (`725453a2`, btime 08:53:05Z, replay chết dạng (B), `--repair` lần đầu PASS, GST 269 file debroot, postboot PASS "nhờ repair"). Mọi phép đo ghi rõ boot của mình; T7/T3 đo trên #63, T2/T4/T6 đo trên #62, T8 trộn cả hai boot (ghi rõ từng run).
- **Poller T10:** `round121-t10/poll121-t10.sh` (detached; chạy lại 1 lần sau reboot #63, ghi RESTART). Poll cuối trước reboot #3 08:51:20Z 1/9 (T6); poll #1 sau chạy lại 08:54:31Z 2/9; poll #15 10:04:31Z 8/9; poll #16 10:09:31Z 9/9 → kích hoạt phase 1. Waiter chạy lại poller 10:10Z + 10:15Z là thừa (poller đã thoát bình thường sau ALL 9 DONE) — xem §10 mục 10.
- **Chốt chặn `round-in-progress.md` ĐÃ TẠO lúc mở đợt 121 (lượt cron 15:35 +07 16/11); T10 xóa khi đóng đợt** (sau closing batch + LIMITS gộp này).
- **Đính chính vận hành:** skeleton LIMITS gộp ghi "recount chưa chạy" vì phase-1 driver lỗi tên file recount (xem §0) — T10 đã chạy lại tay và cập nhật số cuối trong file này; file skeleton đã được thay bằng bản hoàn chỉnh này.

## 12. Quyết parent (main chat, 17:3x +07 16/11/2026 — đóng đợt 121)

1. **E4 (§1): CHẠY BÙ lượt 3 TRƯỚC, rồi lượt 4.** Lô giữ đủ 5A+5B
   — không bỏ lượt 3 (bỏ sẽ lệch thiết kế đăng ký trước). Thứ tự:
   lượt 3 (A, gop250) chạy lại trước (nó là lượt thiếu sớm hơn;
   nhánh A chưa đủ), rồi lượt 4 (B, gop30). Lô hiện 1/10; sau
   hai lượt bù sẽ là 3/10. **Luật đứng mới (từ bài học sai đường
   cờ):** prereg E4 các đợt sau phải ghi rõ tên thư mục cờ của
   luồng hạ tầng **đợt hiện tại** (số luồng đổi theo từng đợt) —
   không dùng tên thư mục của đợt trước.
2. **H3f (§8): GIỮ patch + ĐO THÊM MỘT A/B CÓ KIỂM SOÁT, rồi
   quyết giữ/gỡ trên số mới.** Bằng chứng hiện tại không phân biệt
   được "không có hiệu ứng" với "hiệu ứng bị nhiễu nuốt" (CI tỉ số
   0,59–1,20 chứa 1,0; nhiễu giữa các lượt gấp ~7 lần; số gộp
   B3+B4 bị nhiễm boot/tải anh em nên không đọc là hại). Không có
   bằng chứng hại nào quy được cho patch (pageErrs 0/0, skipped
   cải thiện ở đợt 119) nên gỡ ngay là churn vô ích; nhưng verdict
   "GIÚP" KHÔNG còn đứng nên cũng không được giữ patch với lý do
   "đã chứng minh giúp". Đợt 122: một A/B duy nhất, thiết kế chống
   nhiễu (n≥30 mỗi chân, cùng boot, kiểm soát tải anh em, prereg
   đăng ký trước). **Nếu A/B đó cũng TRUNG TÍNH → GỠ patch.** Nếu
   GIÚP trở lại với biên rõ → giữ patch và ghi lại bằng chứng.
3. **Bar F2 leg B (§2, §7): PHÊ DUYỆT chạy tiếp theo DEF PSI v0.1
   từ đợt 122 (prereg template đã stage).** Không hiệu chỉnh ngưỡng
   v0.1 trước khi chạy: pilot đã chứng minh PSI phân biệt được mức
   tải (0 hog ~11% · 2 hog 72,2% · 6 hog 91,1% · 12 hog 94,9%) và
   bão hòa trên ~6 hog; các band Yên <30% · Vừa 30–80% · Nặng >80%
   được ghi rõ là TẠM THỜI, và chính dữ liệu leg B (T_startup theo
   band, tickRate theo band) là dữ liệu hiệu chỉnh để lên DEF v0.2.
   Lưu ý từ §7: chế độ chậm không tái hiện trên boot #63 (0/8 run
   nhanh) nhưng verdict KHÔNG ĐẠT đợt 120 vẫn đứng — leg B theo
   band PSI sẽ cho biết chế độ chậm có phải hiệu ứng theo band tải
   không.
4. **R9 (a): VẪN CHỜ user** (nhắc lần 7) — lựa chọn bổ sung cho
   §8.4(ii) (bắt FAIL live sớm, kẹp bracket), không thay thế (ii),
   cũng không bị (ii) thay thế. Không hỏi lại dồn dập. Lưu ý: luật
   replay-chết + vá "phát hiện muộn" đã bao phần lớn giá trị của
   R9 (a) (xử lý boot lỗi), chỉ còn thiếu phần bắt FAIL live sớm.
5. **G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi
   13:44 16/11, chưa trả lời). Không thay đổi so với quyết đợt 120
   §12.2.
6. **Đóng đợt 9/9 sau reboot #63 + gộp T2 từ đĩa: CHẤP NHẬN.** T2
   về trước reboot nhưng handoff chưa kịp về; T10 kiểm đĩa và gộp
   từ LIMITS + batch đã có trên đĩa trước khi đóng. Đợt đóng đúng
   10/10 batch. (Lưu ý: cờ round121-t10.done không thấy trên đĩa
   — T10 đóng đợt bằng aggregate + gap + closing batch + xóa chốt
   chặn nhưng thiếu cờ done; ghi làm nợ bookkeeping, không ảnh
   hưởng nội dung đóng đợt.)

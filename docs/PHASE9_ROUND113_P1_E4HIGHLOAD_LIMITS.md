# PHASE9_ROUND113_P1_E4HIGHLOAD_LIMITS.md

## Kết luận trước

**E4 vẫn ĐÓNG CÓ ĐIỀU KIỆN — giữ nguyên từ N1 (đợt 112). Xác nhận tải cao KHÔNG đạt được: không có lượt nào đạt tải cao trong cả 8 lượt chạy, nên câu hỏi tải cao vẫn chưa có câu trả lời.**

- Mục tiêu của P1 là xác nhận fix steady-close của N1 dưới **tải cao (load1 8–30, như M1)**. Cả 8 lượt đều ở **tải thấp** (load1 trong lúc phát 0,75–4,40; tối đa 4,40). 0/8 lượt trong dải [8, 30]. Theo prereg §7, các lượt ngoài dải bị **loại khỏi Fisher chính** — Fisher chính tải cao **không có dữ liệu**.
- Bằng chứng tải thấp được củng cố mạnh: **0 CAP trên 8 lượt / 484 play-tick** (luật N1, M1 và cũ đều 0), Fisher vs K1-on **p=0,00247** (8 lượt) và **p=0,0308** (2+2 chuẩn, 268 play-tick). Gộp N1+P1 (cùng cây, cùng luật CAP, cùng code analyzer): 0/664 play-tick, **p=0,000696**. **Tất cả đều trên tải thấp — không được đọc thành đóng đầy đủ tải cao.**
- Cơ chế: **2 steady-close đã xác minh** (1190 ms; và 1 ở sát trần CAP — tuổi thật <5000 ms, quan sát 5274 ms do lệch pha tick, xem §5), **2 ended-close đã xác minh** (4736 ms, 1326 ms), **2 đuôi suýt CAP** (4892, 5002 ms) được **rearm cứu**. Stall-watch cửa sổ rộng: **0 STALL** (1 lần seek 1399 ms sau steady-close; 1 steady-close không có drift re-seek nào sau đó).
- Quirk frame cuối: ended **có bắn trong lúc phát** ở 4/8 lượt (quirk (i) không tồn tại ở đó); **1 lượt quan sát được quirk (ii)** — element ngồi ở ct=5,9 trong 4915 ms lúc đang phát — nhưng cơ chế là **decoder kẹt 0,1 s trước cuối clip** (ct chưa tới duration nên ended=false là đúng), không phải lỗi báo ended (xem §6).

## 1. Prereg và phương pháp

- Prereg: `hidden_files/round113-p1/prereg-p1.md` (viết trước mọi phép đo). Luật CAP, tick, luật đếm **y hệt N1/M1** để so sánh được. Mẫu số chính = **play-ticks** (velocity tick tới và gồm tick đầu tiên ph≥5,999); 10 s quan sát sau cuối tự nhiên không tính vào mẫu số (prereg §10.4). Fisher chính = play-ticks.
- Cây đo: **không đổi production trong lúc đo**. `preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b` (cây đã fix N1), `playheadHold90R2.ts` `1b68849a3f69dc13622e2a62e0ef37d1`, test `2f5c147cf4f557edc933720432b97cd2` — kiểm tra trước/sau mỗi lượt, **không đổi** (mtime preview.tsx 2026-11-14T09:08:07Z xuyên suốt).
- Probe: `apps/web/scripts/probe113p1.mjs` (47.541 B) — bản sao của `probe112n1.mjs`, thay khối chờ: **không pause ở localPh≥5,0**; phát tới cuối tự nhiên rồi quan sát thêm 10 s; early-stop playhead đóng băng trong lúc seek ≥2,5 s giữ nguyên.
- A/B 2+2: gop 250/30/250/30 (p1f1–p1f4), loadN=4, mỗi slot 2 attempt (retry khi ngoài dải). Vite tạm `watch.ignored: ["**/**"]` (0 inotify watch; headroom boot ~1511 < ~1586 vite thường), lock script bản đóng băng theo `VCUT_VITE_LOCK_FREEZE_SPEC.md`, không sửa lock script khi có acquire đang chạy.
- Boot #44 (tạm): `uptime -s` 2026-11-14 10:53:31Z, boot_id `6ad1ef9e-3e7f-4c9f-852b-7c64c156c3c0`; gap #43→#44 = 1h59'54", trong dải [19'07", 3h14'08"], không phá sàn. Postboot-check boot #44 PASS (11:47:41Z).
- Stall-watch cửa sổ RỘNG (đăng ký trước trong prereg): sau mỗi steady-close, lấy drift re-seek đầu tiên ở **bất kỳ khoảng cách tick nào** tới cuối lượt; seeking >2000 ms sau re-seek → KHÔNG ĐÓNG.

## 2. Sự cố hog và đổi dụng cụ (prereg §10, trước mọi dữ liệu hợp lệ)

- Dụng cụ đầu: 40 driver `yes` hog + 4 của probe. 2 attempt p1f1 (load1 lúc bắt đầu 13,35 / 16,20) đều **KHÔNG HỢP LỆ**: pause-seek 22,0/29,1 s và 15,9/16,8 s; phát rồi dừng sớm sau ~6,5 s (playhead đóng băng trong lúc seek); 6 sample, 0 đuôi. Nguyên nhân (bằng chứng): 40 hog chiếm ~160% CPU, vượt quota 1,5 CPU của cell → browser chỉ được ~1/45 fair-share và đói; rAF cách nhau 1200–8106 ms (N1: ~400–600 ms); ct kẹt 0,5000 trong 15 s. Load1 cao là ảo (từ tải nền của các luồng khác, không phải hog — bài học N5: hog không điều khiển được load1 khi bị throttle).
- Đã dừng thủ công ~12:00Z (kill p1f2 attempt 1 giữa chừng + SIGTERM driver; trap dọn hết hog; lock nhả 12:00:47Z; xác minh sạch: 0 `yes`, curl 5580=000, lock TRỐNG; P5 nhận lock ngay sau).
- Dụng cụ mới (prereg §10.3): **0 driver hog**; tải = probe loadN=4 + tải nền thật của các luồng đợt 113 khác. Dial thành **cổng chờ tải nền** (lấy mẫu load1 mỗi 5 s; 2 mẫu liên tiếp trong [8, 30] thì chạy; không thì vẫn chạy sau tối đa 300 s ở mức đo được, ghi rõ). Sampler đổi thành append (bản cũ truncate mỗi attempt — đã làm mất dữ liệu sampler attempt 1; chỉ còn mean n=1 trong log). Ngân sách retry đặt lại cho dụng cụ mới.
- **Kết quả: tải nền không bao giờ lên tới [8, 30] trong lúc phát.** Các luồng khác (P3/P4/P6/P7) đã xong trước 12:06Z; chỉ còn P2/P5/P8. Load1 trong lúc phát của 8 lượt: 0,75–4,40. Trớ trêu: load1 vọt lên **28,78 ngay sau khi A/B kết thúc** (12:41Z) — tải cao tới muộn.

## 3. Bảng lượt chạy (8 lượt, tất cả tải thấp, tất cả PASS/PASS)

| Lượt | gop | Attempt | load1 lúc phát (mean, n) | Samples | Velocity tick / play-tick | Đuôi | CAP | Ended-close | Steady-close |
|---|---|---|---|---|---|---|---|---|---|
| p1f1 | 250 | 1 | 3,53 (n=6) | 145 | 191 / 69 | 2 | 0 | 0 | 0 |
| p1f1 | 250 | 2 | 1,74 (n=3) | 54 | 70 / 70 | 1 | 0 | 1 (4736 ms) | 0 |
| p1f2 | 30 | 1 | 2,57 (n=5) | 114 | 153 / 51 | 2 | 0 | 0 | 0 |
| p1f2 | 30 | 2 | 3,59 (n=7) | 144 | 179 / 80 | 4 | 0 | 1 (1326 ms) | 0 |
| p1f3 | 250 | 1 | 1,89 (n=5) | 111 | 167 / 46 | 1 | 0 | 0 | 0 |
| p1f3 | 250 | 2 | 3,48 (n=5) | 113 | 162 / 47 | 2 | 0 | 0 | 0 |
| p1f4 | 30 | 1 | 0,75 (n=4) | 106 | 145 / 50 | 4 | 0 | 0 | 1 (1190 ms) |
| p1f4 | 30 | 2 | 4,40 (n=7) | 140 | 197 / 71 | 1 | 0 | 0 | 1 (sát trần, §5) |
| **Tổng 8 lượt** | | | **0,75–4,40** | **977** | **1264 / 484** | **17** | **0** | **2** | **2** |

- 2+2 chuẩn (attempt cuối mỗi slot): 268 play-tick, 0 CAP, 2 ended-close, 1 steady-close.
- Tất cả lượt đều PASS/PASS (playhead giữ trong seek + playhead lúc canvas đổi khung), md5 không đổi, tới cuối tự nhiên (trừ p1f1 attempt 2 dừng sớm ở ph 5,3 do seek restart-ended chậm — vẫn 70 play-tick, 1 ended-close 4736 ms).
- Lưu ý: play-mean của các file `*-outofband` do analyzer in ra là **sai** (nó dùng cửa sổ probe-log.txt hiện tại = attempt 2); giá trị đúng trong bảng trên lấy từ `run-p1.log`.
- 2 attempt đầu bằng hog cũ (p1f1, load1 13,35/16,20) **không hợp lệ, không tính** — xem §2.

## 4. CAP và Fisher

- CAP (luật N1 = M1 = cũ): **0 trên mọi lượt, mọi luật.** Không đuôi nào tuổi ≥4800 ms mà thiếu cả rearm lẫn ended-close lẫn steady-close.
- Fisher 2 phía (play-ticks, chính):
  - P1 2+2 (0/268) vs K1-on (6/284): **p=0,0308** — đạt <0,05 về mặt số, **nhưng trên tải thấp, không phải A/B tải cao** như prereg yêu cầu.
  - P1 8 lượt (0/484) vs K1-on (6/284): **p=0,00247**.
  - P1 2+2 vs L1-fix (1/179): p=0,4004; vs M1-fix (1/157): p=0,3694 (không có ý nghĩa — L1/M1-fix vốn chỉ có 1 CAP).
  - Độ nhạy all-ticks P1 2+2 (0/608): p=0,0010.
- Gộp N1+P1 (cùng cây 03bf029f, cùng luật CAP, cùng code analyzer; **cả hai đều tải thấp**):
  - Gộp 2+2 (0/448) vs K1-on: **p=0,0033**.
  - Gộp 8 lượt (0/664) vs K1-on: **p=0,000696**.
  - **Không dùng đường gộp để đóng đầy đủ**: đường gộp trong prereg §7 được thiết kế cho P1 tải cao + N1 tải thấp (caveat "tải hỗn hợp"). Ở đây P1 cũng tải thấp nên gộp chỉ củng cố bằng chứng **tải thấp**, không trả lời câu hỏi tải cao.
- Đối chiếu quy tắc quyết định prereg §7: (a) 0 CAP trong 2+2 ✓ (về số); (b) không đuôi ≥4800 ms thiếu cứu ✓; (c) ≥1 ended/steady-close ✓; (d) ≥1 steady-close đã xác minh ✓ (p1f4 att2); (e) 0 STALL ✓; (f) Fisher p<0,05 ✓ về số — **nhưng (f) yêu cầu "trên A/B tải cao", và không có lượt tải cao nào**. Vì vậy **không đóng đầy đủ**. E4 giữ **ĐÓNG CÓ ĐIỀU KIỆN**.

## 5. Cơ chế: steady-close, ended-close, và 2 đuôi suýt CAP

- **Steady-close đã xác minh (2):**
  - p1f4 attempt 1: đuôi ended=8414, đóng ở tuổi **1190 ms** (steadyAdvances cuối 3, drift cuối 1,27 s > 0,35 — C3 đang chặn, fix đổi kết cục).
  - p1f4 attempt 2: đuôi ended=3801, tuổi ở tick cuối còn mở **4793 ms** (chỉ 7 ms dưới ngưỡng CAP 4800), đóng bằng steady-close. Tuổi đóng quan sát được là 5274 ms — **đây là lệch pha quan sát, không phải tuổi đóng thật**: tick 29→30 cách nhau 481 ms; bước đóng (steady) chạy sau tick 29 và trước khi trần 5000 ms bị vượt (thứ tự bước: trần 5000 ms kiểm tra TRƯỚC nhánh tăng — nếu bước chạy ở tuổi ≥5000 thì đã đóng bằng trần, không phải steady). Tuổi đóng thật ∈ (4793, 5000] ms. Đây là bằng chứng mạnh nhất cho fix: nó cứu một đuôi **ngay sát ngưỡng CAP**.
- **Ended-close đã xác minh (2):** p1f1 attempt 2 (4736 ms — chỉ 64 ms dưới ngưỡng CAP); p1f2 attempt 2 (1326 ms).
- **2 đuôi suýt CAP, rearm cứu:** p1f3 attempt 1 (tuổi 5002 ms ở tick cuối, watch mới rearms 0→1 ở tick sau) và p1f3 attempt 2 (4892 ms, rearms 0→1). Cả hai đều **không phải CAP** theo luật N1 (rearm tăng ở tick sau span). Tuổi 5002 ms vượt trần 5000 ms đúng 2 ms là **lệch pha sampler/bước** (bước ở tick đó chạy khi tuổi thật <5000 ms; đuôi đóng ở tick sau khi watch mới xuất hiện), không phải vi phạm trần thật.
- **Quan sát về decoder bursty:** steady-close chỉ bắn khi decoder tăng đều 4 tick liên tiếp. Trong 6/8 lượt, decoder tăng theo chùm (nhảy +0,48…+0,73 s mỗi tick → burst-block → steady đặt lại 0; steadyAdvances tối đa 2 trong các đuôi p1f3). Các đuôi đó đi tới sát trần rồi được rearm/watch mới cứu. **Fix giúp decoder đều; decoder chùm vẫn phải dựa vào rearm** — rearm cứu là may rủi theo thời điểm, không phải cơ chế chủ động của fix. Nợ mở cho đợt sau: xem có nên nới steady (đếm cả tăng chùm lành) hay hạ trần.

## 6. Stall-watch cửa sổ rộng và quirk frame cuối

- **Stall-watch: 0 STALL.** 2 steady-close: p1f4 att1 — drift re-seek đầu tiên sau đóng ở tick 30, seeking **1399 ms** (<2000 ms, không stall); p1f4 att2 — **không có drift re-seek nào** sau steady-close tới cuối lượt (restart-ended bắn trước ở tick 40, không phải drift re-seek). Không có seeking >2000 ms nào sau steady-close.
- **Quirk frame cuối (theo luật prereg §5.2):**
  - (i) ended bắn trong lúc phát — **4 lượt** (p1f1 att1 tick 44, p1f1 att2 tick 37, p1f2 att2 tick 56, p1f4 att2 tick 38; ct=6, dur=6, ph 5,1–5,5): quirk không tồn tại ở các đường này. M1 vẫn bắn ended trong lúc phát như thường lệ.
  - (ii) element ngồi frame cuối trong lúc phát — **1 lượt: p1f2 attempt 1** (gop30): ct=5,9000 kẹt **14 tick liên tiếp, t=10497..15412 (4915 ms)**, ended=false, playing=true (sampler xác nhận playing=True, seeking=False, paused=False; ph tăng 5,3→5,6667). Đuôi ended=9011 đóng ở tuổi 2008 ms bằng hasWatch (watch mới, rearms 1→2 ở tick 37). Sau đó ct vẫn 5,9 trong khi ph lên 6,0; playing=false lúc ~16015 ms (app dừng ở cuối timeline) với ct vẫn 5,9; chỉ ở tick 56 (t=17327, sau khi playing=false) ct mới lên 6,0 và ended=true.
    - **Hiệu chỉnh cơ chế (quan trọng):** ct=5,9 là **3 khung trước cuối clip** (30 fps: 5,9 → 5,9333 → 5,9667 → 6,0), không phải frame cuối 5,9667. ended=false là **đúng** (ct chưa tới duration=6). Hiện tượng thật là **decoder kẹt 0,1 s trước cuối clip** (không giao khung cuối trong ~5,4 s lúc đang phát), playhead được resume-stall watch giữ ở 5,6667, rồi watch nhả và ph lên 6,0. Đây không phải lỗi báo ended. Ghi nhận là nợ mở (decoder stall gần cuối clip, gop30), không thay đổi verdict E4.
  - (iii) không đủ cửa sổ — **3 lượt** (p1f3 att1, p1f3 att2, p1f4 att1): playing=false (timeline kết thúc) trước khi đủ 2 tick loại (ii).

## 7. Kiểm chứng

- `tsc --noEmit` (apps/web): **exit 0** (trước A/B 11:44Z và sau A/B 12:48Z).
- `playheadHold90R2.test.ts`: **93 passed** (84 cũ + 9 N1), trước và sau A/B. (Vitest báo "No test suite found" ở cuối — file này chạy bằng assertion + console, không dùng describe/it; đây là quirk sẵn có của file, không phải lỗi test.)
- md5 cây đo trước/sau mỗi lượt đều không đổi (xem §1). Không thay đổi production nào trong P1 — chỉ đo.
- Analyzer: `analyze-p1-cap-pattern.py`, `analyze-p1-mechanism.py`, `analyze-p1-endframe.py` (code Fisher y hệt N1) + wrapper `analyze-p1-file.py` cho từng file `*-outofband`. Fisher gộp tính lại độc lập bằng `math.comb` (khớp analyzer: 2+2 p=0,0308).

## 8. Hạn chế và nợ mở

- **Tải cao chưa được kiểm chứng.** 0/8 lượt trong [8, 30]; load1 cao nhất trong lúc phát là 4,40. Cần một đợt khác với nguồn tải thật (tải nền của các luồng nặng đang chạy, hoặc một dụng cụ tải không làm đói browser — hog `yes` đã chứng minh là không dùng được).
- Steady-close chỉ cứu decoder đều; decoder chùm (6/8 lượt) vẫn đi tới sát trần và dựa vào rearm.
- Quirk (ii): decoder kẹt ở ct=5,9 gần cuối clip (gop30, 1 lượt) — cần theo dõi có lặp lại không.
- Đuôi 5002 ms (p1f3 att1) cho thấy tuổi đuôi có thể chạm trần theo đồng hồ sampler — lệch pha 2 ms, không đáng kể, nhưng đáng ghi.
- Chưa lên: đợt 111+112 (19 batch / 42 entry / 37 file duy nhất) + 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`; ci-security.yml vẫn 403 chờ user; G1 + mù #22/#28/#29/#30 chờ user quyết; E4 cần đợt xác nhận tải cao (nợ này).

## 9. File trong batch

- `docs/PHASE9_ROUND113_P1_E4HIGHLOAD_LIMITS.md` (file này).
- `apps/web/scripts/probe113p1.mjs` — **47.541 B > 37.768 B, cần `ENABLE_PRIVSEP=0` khi push**.
- Dữ liệu thô + script + prereg + analyzer: `hidden_files/round113-p1/` (không push; prereg 372 dòng, log chạy, 4 thư mục probe, các analyzer).

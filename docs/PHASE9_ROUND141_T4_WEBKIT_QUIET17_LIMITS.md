# PHASE9_ROUND141_T4_WEBKIT_QUIET17_LIMITS.md

**Đợt:** 141. **Luồng:** T4 — lượt yên WebKit #17 (đo lại, giám sát thụ
động (c2) theo DEF v0.5). **Ngày:** 18/11/2026. **Boot:** 2c0efe57
(btime 19:54:12Z) — **không reboot trong lượt** (boot lúc mở =
boot lúc đóng). **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7`
(kiểm lúc mở poller 20:40Z, sau attempt1, lúc đóng 20:49Z — không
đổi). **Trạng thái:** LƯỢT YÊN #17 **HỢP LỆ — ĐO ĐƯỢC Ở ATTEMPT1**
(20/20 pass, probe_exit=0).

## 0. Verdict tổng (đọc trước)

- **Lượt yên WebKit #17 HỢP LỆ (attempt1, 20/20 pass): tickCost median
  47,0 ms hậu flip+2000 ms (n=431; tổng n=594 median 48,0 ms) ≤60 ms;
  lớp B 5/5 ĐẠT; (c2) = 6 occurrence, toàn bộ lag +1f.**
- **P1 ĐÚNG:** 6/6 (c2) gần run-end, baseline 57/347 = 16,4%,
  **p = 0,000020** (signed đối chiếu: baseline 53/347, p = 0,000013
  — cùng verdict).
- **P2 ĐÚNG:** 6/6 lag +1f, 0 lag âm.
- **P3-A1 ĐÚNG:** 5/6 đóng băng-tại-tick, baseline 78/346 = 22,5%,
  **p = 0,0028** (seq 208 là tick bắt kịp sau stall 3 — xem §6).
- **P3' ĐÚNG:** 6/6 seq riêng biệt có stall_truoc ≥ 2 (stall 6, 3, 7,
  3, 3, 2), baseline 22,5%, p ≈ 0,0028. **Lần đầu P3-A1 và P3' lệch
  nhau trên một seq (208)** — cả hai verdict vẫn ĐÚNG (xem §6).
- **P4 ĐÚNG:** thuần +1f 6 (2–8), tổng (c2) skp=0 6 (2–12), skp=1 = 0,
  lag ≥+5f = 0.
- **P5 ĐÚNG 4/4:** snap-label median 41 ms (34–52), raw-label median 8
  ms (8–10), label-floor +1 71,5% (63–76%), run ≥3 tick 19 (13–22).
- **P6 trong khoảng cả 3 bin:** bin0 36,6% (33–39), +1/+2 44,5%
  (33–53), +3 7,8% (3–19); đuôi âm 10,4%.
- **P7 ĐÚNG (làm yếu desync):** 6/6 seq (c2) được log phủ; drawSrc
  delta floor(ct×30)−frameIdx chỉ −1/0 (65/65), 0 entry trễ ≥+1f;
  rawUnit−drawSrc gần nhất chênh 0 (65/65 cặp); đối chứng toàn cửa sổ
  post: 0/430 entry trễ ≥+1f.
- **F6' ĐÓNG lần thứ 5 liên tiếp:** 64 tick skippedLatest=1, 100%
  không vi phạm (nhãn + pixel-verified).
- **Cộng dồn MỚI (14 lượt yên hợp lệ):** P1 **38/38**, P2 **29/29**
  occurrence lag ≥+1f (0 âm), P3-A1 **33/38**, P3' **10/10 (2 lượt)**,
  P7 **24/24**. Chuỗi median tickCost 14 lượt: 49,5 / 40,0 / 52,0 /
  47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / **47,0 ms** (trung bình 47,7 ms).
- **KHÔNG có điều kiện nào trong ba điều kiện mở lại điều tra (§13
  DEF v0.5) xảy ra** (P1 ĐÚNG; 0 lag âm; +2f = 0 trong lượt). Điều tra
  (c2) **vẫn ĐÓNG** — verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng.
- **Ngưỡng tickCost ≤60 ms: KHÔNG BÀN LẠI** — median #17 = 47,0 ms,
  dưới ngưỡng; không có lượt nào vượt 60 ms.
- **Balloon ĐÃ XẢ BỀN trong lượt này (trả lời câu parent đợt 140
  §10(b)):** từ 6.443.824 kB đóng băng lúc mở đợt xuống 5.198.556 kB
  ngay trước poll #1 (−1,25 GB trong <2 phút), rồi xuống 4.356.908 kB
  lúc đóng (−2,09 GB tổng); RAMavail 458 → 2.367 MB. **KHÔNG cần can
  thiệp host ở đợt này.** Đây là lần xả bền đầu tiên sau 3 đợt xả
  không bền liên tiếp (#15 kẹt, #16 xả–phồng, #17-đợt-140 kẹt).
- **Retry theo quyết parent đợt 139 (h): 0 lượt đã dùng.**
  Attempt1 chạy sạch ngay lần đầu; attempt1 partial của đợt 140 KHÔNG
  đếm vào ngân sách đợt này (theo brief đợt 141 — ngân sách tính lại
  từ đầu mỗi đợt).
- **DEF v0.5, fix 530e10a7, ngưỡng tickCost ≤60 ms, gate A: KHÔNG
  ĐỔI.** Không có code nào được viết/sửa trong repo ở lượt này (chỉ
  poll + probe + log); preview.tsx không chạm tới. Không push,
  không release/tag.

## 1. Bối cảnh

- Lượt yên #17 lần đầu (đợt 140) KHÔNG ĐO ĐƯỢC: attempt1 partial
  10/20 (pass 11 kẹt 120 s, rồi reboot #22 giết giữa lúc ghi
  partial), rồi gate A không mở trên boot mới (balloon đóng băng
  6.443.824 kB, 0/96 poll ≥1024 MB sau gate 0 xanh). Cộng dồn lúc đó
  vẫn 13 lượt hợp lệ: P1 32/32, P2 23/23, P3-A1 28/32, P3' 4/4,
  P7 18/18.
- Quyết parent đợt 140 áp dụng cho đợt này: (b) đo lại #17 ở đợt 141
  như thường lệ; (h) GIỮ NGUYÊN gate A ≥1024 MB, không hạ ngưỡng,
  không đổi cách đo; (i) ngân sách retry tối đa 2 lần khi LỖI SETUP
  (áp trong một lượt poller); attempt1 partial đợt 140 KHÔNG đếm vào
  ngân sách đợt này; median 69,0/73,0 ms của partial chỉ là quan sát,
  không dùng cho quyết định ngưỡng nào.
- Đợt 141 mở 20:35:51Z (cron 03:35 +07 19/11) trên boot 2c0efe57
  (btime 19:54:12Z). Chốt chặn `round-in-progress.md` TỒN TẠI nhưng
  đó là marker của chính đợt 141 này ("Đợt 141 đang chạy", mở
  20:35:51Z) — không phải đợt main-chat đang chạy; T4 tiến hành theo
  đúng brief parent giao (cùng tiền lệ đợt 139/140).
- Script `analyze-t4-p1p3p7.py` được kiểm lại TRƯỚC khi chạy: tái tạo
  #16 khớp 100% file T4-139 (`analyze-t4-attempt3-p1p3p7.txt`, diff
  sạch) — sau một lần gọi sai thiếu argv[2] (F-141-T4-2, không ảnh
  hưởng dữ liệu).
- Poller `poll-wait-t4-141.sh` sao từ 140b, đổi deadline 22:30Z +
  cờ T5 round141-t5 (dự phòng round140-t5 cùng boot) + **vòng retry
  bắt đầu lại từ attempt1** (F-141-T4-4: bản 140b bắt đầu từ
  attempt2 vì attempt1 đã dùng ở đợt 140 — đợt này tính lại từ đầu
  theo brief). `bash -n` OK cả 4 script.
- Snapshot-trước-đếm-sau (F-137-T4-1): giữ ở mọi poll — mỗi poll chỉ
  chạy `ps` một lần vào `ps-snap-tmp.txt`, đếm blockers từ file đã
  chụp; file tạm chỉ giữ lại khi blockers>0 (đợt này blockers=0 cả
  2 poll nên không có file blockers nào).

## 2. Poller — 2 poll, cửa mở ở poll #2 (20:42:02Z–20:42:47Z)

Poller pid 13130, script `poll-wait-t4-141.sh`, deadline 22:30Z.
Cửa mở ngay ở poll #2 — lượt chờ ngắn nhất kể từ #16 (9 poll).

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 20:42:02Z | 1.501 MB | 2,17 / 1,01 | XANH | load1 ≥2 chặn cửa |
| #2 | 20:42:47Z | 1.485 MB | 1,64 / 1,03 | XANH | **CỬA YÊN MỞ** — chạy attempt1 |

- RAMavail 2 poll: ≥1024 MB **2/2**. Gate 0 xanh từ poll #1: cờ T5
  `round141-t5/POSTBOOT_PASS` (`boot_id=2c0efe57-... btime=
  2026-11-18T19:54:12Z pass_at=2026-11-18T20:41:02Z poll=0`);
  postboot_exit=0; apt=0; dpkg_lines 1.545; cây YES md5=530e10a7;
  lock=khong; blockers=0 (cả 2 poll).
- Không reboot trong lượt (boot 2c0efe57 từ lúc mở tới lúc đóng).
  Poller thoát exit 0 sau attempt1 (20:46:41Z); 0 tiến trình T4 còn
  sống sau đó (kiểm bằng `ps`, xem F-141-T4-1), lock vite đã nhả.

## 3. Balloon đã xả bền — trả lời câu parent đợt 140 §10(b)

| Thời điểm | Balloon | RAMavail | Ghi chú |
|---|---|---|---|
| 20:40:01Z (T4 bắt đầu) | 6.443.824 kB | 458 MB | Y hệt giá trị đóng băng #15/#17-đợt-140 |
| 20:41:43Z | 5.198.556 kB | 1.625 MB | **−1.245.268 kB (~−1,19 GiB) trong <2 phút** |
| 20:42:52Z | 5.375.956 kB | 1.237 MB | Phồng lại nhẹ (+177 MB) giữa lúc poll |
| 20:48:31Z (đóng) | 4.356.908 kB | 2.367 MB | **Xả tiếp −1,02 GB; tổng −2.086.916 kB (~−1,99 GiB)** |

- **Kết luận cho parent: balloon ĐÃ tự xả bền trong đợt 141; cửa
  yên mở sau ~2 phút chờ (2 poll); KHÔNG cần can thiệp host ở đợt
  này.** Khác với mẫu xả–phồng của #16/#17-đợt-140 (xả rồi phồng
  lại ~1 GB trong vòng 8 phút), lần này balloon tiếp tục xả sau
  attempt (5,38 → 4,36 GB) và RAMavail còn tăng sau lượt đo.
- Ngưỡng gate A ≥1024 MB GIỮ NGUYÊN (quyết parent) — và đã đủ:
  RAM poll 2/2 ≥1024, RAM giữa attempt1 (sampler) min 727 MB.

## 4. Attempt1 — 20/20 pass, LƯỢT HỢP LỆ, exit 0

- 20:42:47Z–20:46:41Z. Vite lên 389 ms (port 5187, lock v2 giữ);
  20/20 pass (pass cuối 20:46:xxZ, wall 2.889–3.492 ms/pass);
  probe_exit=0; JSON 3.294.916 B
  (`preview-b-f3-flip-webkit-t4-attempt1.json`, passes=20, engine
  webkit 27.2, pageErrs=[]); flip afterPass=5 wallMs=26916.
- Lớp B 5/5 ĐẠT (sampler n=100, load1_max 2,88, RAM min 727 MB,
  max 1.436 MB, 0 mẫu <500 MB, 40/100 mẫu <1024 MB — ghi nhận, không
  vi phạm; load5 cuối 1,09; không reboot; không apt/dpkg).
- Coverage-check ngay: **6/6 (c2) được log phủ** (seq 173/208/358/
  382/431/455, delta −35/+35/+21/+31/−23/+17 ms); blendTick hậu-flip
  trong ±500 ms của log: 347/347 (100,0%). Không có marker
  COVERAGE-0.
- Không cần retry: attempt1 chạy sạch ngay lần đầu (ngân sách retry
  0/2 đã dùng).

## 5. Load/RAM theo TỪNG PASS — attempt1 (quyết parent đợt 137 §12.3(c))

| Pass | tick n | median | p90 | wall | load1 (mean) | RAM mean |
|---|---|---|---|---|---|---|
| 1 | 33 | 45,0 | 65,4 | 3.192 ms | 2,49 | 1.008 MB |
| 2 | 29 | 38,0 | 72,4 | 3.363 ms | 2,44 | 957 MB |
| 3 | 26 | 65,0 | 88,0 | 3.411 ms | 2,43 | 952 MB |
| 4 | 28 | 57,5 | 73,3 | 3.087 ms | 2,40 | 934 MB |
| 5 | 33 | 54,0 | 69,4 | 3.492 ms | 2,21 | 908 MB |
| 6 | 30 | 56,0 | 84,3 | 3.472 ms | 2,12 | 936 MB |
| 7 | 27 | 50,0 | 75,0 | 3.129 ms | 2,03 | 942 MB |
| 8 | 35 | 48,0 | 74,6 | 3.228 ms | 2,35 | 918 MB |
| 9 | 25 | 52,0 | 75,6 | 3.277 ms | 2,62 | 901 MB |
| 10 | 24 | 63,5 | 93,4 | 3.290 ms | 2,86 | 883 MB |
| 11 | 27 | 55,0 | 83,0 | 2.944 ms | 2,81 | 846 MB |
| 12 | 26 | 55,0 | 82,5 | 2.990 ms | 2,70 | 835 MB |
| 13 | 28 | 41,0 | 76,6 | 3.063 ms | 2,52 | 841 MB |
| 14 | 37 | 41,0 | 63,4 | 3.281 ms | 2,39 | 846 MB |
| 15 | 28 | 41,5 | 74,3 | 2.919 ms | 2,26 | 818 MB |
| 16 | 34 | 55,0 | 75,4 | 3.337 ms | 2,17 | 757 MB |
| 17 | 30 | 39,5 | 69,8 | 3.083 ms | 2,00 | 755 MB |
| 18 | 31 | 41,0 | 62,0 | 2.889 ms | 1,91 | 744 MB |
| 19 | 31 | 40,0 | 67,0 | 3.034 ms | 1,83 | 740 MB |
| 20 | 31 | 39,0 | 64,0 | 3.168 ms | 2,01 | 754 MB |

- Tương quan Pearson (20 pass): median~load1_mean **r = +0,49**;
  median~RAM_mean **r = +0,41** — đều DƯƠNG và vừa. **Đổi dấu so
  với #16** (r = −0,38 / −0,37): lượt này pass đầu chậm hơn (median
  65,0/63,5 ở pass 3/10) khi load1 ~2,4–2,9, pass cuối nhanh hơn
  (39–41) khi load1 ~1,8–2,0; RAM cũng rơi dần 1.008 → 740 MB cùng
  chiều median giảm. Nhưng load1 là trung bình 1 phút nên biến thiên
  chậm, và chỉ 1 lượt — **không kết luận nhân quả**; giả thuyết
  "tải song song gây median cao" vẫn mở, cần thêm lượt (đặc biệt một
  lượt chậm nữa) mới kết luận.
- Wallbands (attempt1): 0–20k median 49,0; 20–32k 57,0; 32–45k 48,5;
  45–62k 46,0; 62–70k 50,5; 70–80k 39,0 ms — không có band nào vượt
  60 ms.

## 6. P1–P7 + P3' theo DEF v0.5 — attempt1 (lượt hợp lệ #17)

Tick post: n=347 (viaRvfc=0, tBlend ≥ flip+2000ms). (c2) = 6
occurrence, toàn bộ skp=0, lag +1f:

| seq | presented | label | lag | stall_truoc | P3-A1 | P3' |
|---|---|---|---|---|---|---|
| 173 | 14 | 13 | +1f | 6 | ĐẠT | ĐẠT |
| 208 | 56 | 55 | +1f | 3 | KHÔNG (bắt kịp) | ĐẠT |
| 358 | 15 | 14 | +1f | 7 | ĐẠT | ĐẠT |
| 382 | 14 | 13 | +1f | 3 | ĐẠT | ĐẠT |
| 431 | 14 | 13 | +1f | 3 | ĐẠT | ĐẠT |
| 455 | 21 | 20 | +1f | 2 | ĐẠT | ĐẠT |

| Tiêu chí | Kết quả #17 | Verdict |
|---|---|---|
| Lượt hợp lệ (20/20 + lớp B 5/5 + median ≤60 ms) | 20/20, B 5/5, median 47,0 ms | **HỢP LỆ** |
| P1 (c2) gắn run-end (run ≥3) | 6/6 gần run-end; baseline 57/347 = 16,4%; p = 0,000020 (signed: 53/347, p = 0,000013) | **ĐÚNG** |
| P2 (lag ≥ +1f, 0 lag âm) | 6/6 lag +1f, 0 âm | **ĐÚNG** |
| P3-A1 (đóng băng-tại-tick) | 5/6; baseline 78/346 = 22,5%; p = 0,0028 | **ĐÚNG** |
| P3' stall-based (prereg) | 6/6 seq stall ≥2 (6,3,7,3,3,2); baseline 22,5%; p ≈ 0,0028 | **ĐÚNG** |
| P4 (số lượng) | thuần +1f 6 (2–8); tổng 6 (2–12); skp=1 0; lag ≥+5f 0 | **ĐÚNG** |
| P5 (số phụ) | snap 41 ms (34–52); raw 8 ms (8–10); label-floor +1 71,5% (63–76%); run ≥3: 19 (13–22) | **ĐÚNG 4/4** |
| P6 (histogram) | bin0 36,6% (33–39); +1/+2 44,5% (33–53); +3 7,8% (3–19) | Trong khoảng cả 3 bin |
| P7 (log draw phủ) | 6/6 phủ; drawSrc delta −1/0 (65/65), 0 trễ ≥+1f; rawUnit chênh 0 (65/65) | **ĐÚNG** |
| F6' (skippedLatest) | 64 tick skp=1, 100% không vi phạm | **ĐÓNG lần 5 liên tiếp** |

- Chi tiết P1: 19 run ≥3 tick trong 347 tick post; cả 6 seq (c2)
  đều ở run-end hoặc sát run-end (173 cách run-end 172 đúng 1 tick;
  208, 358, 431, 455 đúng bằng run-end; 382 cách run-end 381 đúng
  1 tick — cùng quy ước "gần" như #16 seq 184).
- Chi tiết P3-A1/P3' lệch nhau ở seq 208: labelMs 39307, prev
  39040 — nhãn ĐÃ TIẾN ở đúng tick (c2) (tick bắt kịp sau chuỗi
  đóng băng 3 tick), nên A1 (đóng băng TẠI tick) không đạt; nhưng
  stall_truoc=3 nên P3' (đóng băng DẪN VÀO tick) đạt. Đây là lần
  đầu hai phép thử lệch nhau trên một seq — cả hai verdict vẫn
  ĐÚNG (P3-A1 5/6 ≥2/3, p<0,01; P3' 6/6). Không đổi định nghĩa nào;
  ghi nhận làm mẫu cho các lượt sau (nếu A1 rớt dưới 2/3 trong khi
  P3' vẫn đạt thì cần xem lại, không phải lúc này).
- Chi tiết P7: log c2DrawLog n=1149 (loop 1–21 đủ, 20 wrap, span
  9.823→79.545 ms); tại 6 seq (c2): 18–26 entry trong ±500 ms
  (drawSrc 9–13, rawUnit 9–13 mỗi seq). Đối chứng toàn cửa sổ
  post: drawSrc delta chỉ −1 (274) / 0 (156), 0/430 trễ ≥+1f.
- Chi tiết P5/P6 (histogram, nGhost=694, nomatch=0, srcKind
  canvas 694): hist chi tiết {-17: 1, -13: 2, -11: 5, -8: 2, -1: 62,
  0: 254, +1: 163, +2: 146, +3: 54, +4: 5}; đuôi âm 10,4% (72/694) —
  cao hơn #16 (7,0%) nhưng thấp hơn #14 (13,7%); đuôi +3 7,8% —
  cao hơn #16 (6,3%), thấp hơn #14 (16,2%). Cả hai đuôi cùng tăng
  khi median tickCost tăng (41,0 → 47,0 ms), cùng chiều với quan sát
  ở DEF §9 (đuôi tăng cùng chiều tickCost).
- **Ba điều kiện mở lại điều tra (DEF §13):** (1) P1 gãy — KHÔNG
  (P1 ĐÚNG); (2) lag âm — KHÔNG (0); (3) +2f ≥3 — KHÔNG (+2f = 0).
  **Không điều kiện nào xảy ra; điều tra (c2) vẫn ĐÓNG.**
- Cộng dồn sau lượt này: P1 38/38, P2 29/29 occurrence, P3-A1
  33/38 (86,8%), P3' 10/10 (2 lượt), P7 24/24 (từng seq), F6' đóng
  5 lần liên tiếp. Tỉ lệ (c2)/tick post #17: 6/347 = 1,73% (trong
  dải các lượt trước: #13 0,33%, #14 2,03%, #16 1,08%).

## 7. Sai số F-141-T4-1..4

- **F-141-T4-1 — Kiểm tra tiến trình sót bằng pgrep tự khớp.**
  Sau attempt1, `pgrep -f 'poll-wait-t4-141'` và `pgrep -f
  'probe121t3|vite.*5187'` đều báo ALIVE — nhưng đó là dòng lệnh
  exec của chính phép kiểm chứa chuỗi mẫu. Kiểm lại bằng `ps -eo
  pid,etime,args` + grep lọc: **0 tiến trình T4 còn sống, lock vite
  đã nhả**. Chỉ là nhiễu phép kiểm, không ảnh hưởng dữ liệu.
- **F-141-T4-2 — Gọi analyzer P1/P3/P7 thiếu tham số lần đầu.**
  Lần gọi kiểm chứng tái tạo #16 thiếu argv[2] (danh sách seq) →
  IndexError, không ra file. Gọi lại với `"184,284,363,446"`:
  diff khớp 100% với `analyze-t4-attempt3-p1p3p7.txt` của T4-139.
  Không ảnh hưởng dữ liệu.
- **F-141-T4-3 — Histogram RUNS trỏ tới file không tồn tại.**
  `t4-histogram-with17.py` sao từ đợt 140 trỏ RUNS tới
  `round140-t4/...-attempt3.json` (không tồn tại — đợt 140 chỉ có
  attempt1 partial). Đã vá trước khi chạy sang
  `round141-t4/preview-b-f3-flip-webkit-t4-attempt1.json` + nhãn
  `T4-141 (a1) LUOT YEN #17`, chạy exit 0. Không ảnh hưởng dữ liệu.
- **F-141-T4-4 — Poller kế thừa vòng retry bắt đầu từ attempt2.**
  Bản `poll-wait-t4-140b.sh` bắt đầu vòng retry ở ATT=2 (đúng cho
  đợt 140 vì attempt1 đã dùng). Khi sao sang đợt 141 đã sửa thành
  ATT=1 TRƯỚC khi chạy (ngân sách tính lại từ đầu theo brief đợt
  141); `bash -n` OK và attempt1 chạy sạch ngay nên vòng retry
  không kích hoạt. Không ảnh hưởng dữ liệu.

## 8. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND141_T4_WEBKIT_QUIET17_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script/phân tích mới (trong hidden_files, không stage — file làm
  việc nội bộ):** `poll-wait-t4-141.sh` (deadline 22:30Z, cờ T5
  round141-t5, vòng retry từ attempt1); `run-attempt-141.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`,
  `vite.t4-temp.config.mjs`, `probe121t3-ghost-k7.webkit.mjs`,
  `b.json`, `analyze-t4-p1p3p7.py` (đã kiểm chứng tái tạo #16 100%),
  `t4-histogram-with17.py` (+ output `t4-histogram-with17.txt`,
  đã vá RUNS sang attempt1 đợt 141 — F-141-T4-3).
- **Log/evidence (hidden_files/round141-t4/, không stage):**
  `poll-t4.log` (2 poll), `chain-t4.log`, `poll-t4.nohup.log`,
  `postboot-t4-141-gate0wait-1.log`,
  `preview-b-f3-flip-webkit-t4-attempt1.json` (ĐẦY ĐỦ 20/20 —
  3.294.916 B), `run-webkit-t4-attempt1.log`,
  `vite-5187-t4-attempt1.log`, `load-mid-t4-attempt1.log`,
  `ps-before/after-t4-attempt1.txt`, `classb-t4-attempt1.txt`,
  `analyze-t4-attempt1-*.txt` (c2drawlog, labellag, skiplatest,
  lag5, tickcost, wallbands, perpass, stall, c2coverage, p1p3p7)
  + `coverage-check-attempt1.txt` (6/6),
  `marker-t4-attempt1`, `tree-md5.txt`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này.
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round141-t4-quiet17.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round141-t4.done` (tạo sau khi viết LIMITS
  này).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 141).

## 9. Chờ quyết / nợ đợt 142

1. **P3-A1 vs P3' lệch nhau lần đầu (seq 208)** — cả hai verdict vẫn
   ĐÚNG; không cần quyết gì, chỉ ghi nhận làm mẫu. Nếu lượt sau A1
   rớt dưới 2/3 trong khi P3' vẫn đạt thì T10/parent xem lại.
2. **Giả thuyết tải–median vẫn mở** (§5): tương quan đổi dấu so với
   #16 (r = +0,49/+0,41 so với −0,38/−0,37). Cần thêm lượt (đặc biệt
   một lượt chậm nữa) mới kết luận; T4 đợt sau tiếp tục ghi load1/RAM
   theo từng pass.
3. **Balloon đã xả bền** (§3) — câu parent đợt 140 §10(b) được trả
   lời: không cần can thiệp host ở đợt này. Tiếp tục theo dõi ở đợt
   sau (nếu lại đóng băng 6.443.824 kB thì mẫu xả–phồng quay lại).
4. **Không có gì khác chờ parent ở lượt này** — lượt #17 hợp lệ ở
   attempt1, mọi phép thử P1–P7 + P3' đều ĐÚNG, điều tra (c2) vẫn
   đóng, ngân sách retry còn nguyên 2/2.

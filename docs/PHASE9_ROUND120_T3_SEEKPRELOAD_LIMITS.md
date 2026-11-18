# PHASE9 ROUND120 T3 — Bar F2 leg B: ĐỦ 6 valid → VERDICT + follow-up MSB4RB8 27,02 s (leg A chạy bù sau driver)

- **Đợt:** 120, luồng T3. **Lượt cron:** 12:35 +07 16/11/2026.
- **Boot đo:** `80a940d7…` (uptime -s 06:50:58Z, journal đầu 06:51:09Z) —
  boot MỚI sau reboot 06:50:58Z, KHÔNG phải boot #60 lúc mở đợt
  (`0260101b`, 04:45:49Z). Mọi phép đo chạy trên boot mới; boot #60
  KHÔNG đo được run nào (xem §4).
- **Cây:** `preview.tsx` md5 `5be5a250a552357c50cc189de9a9c08a` (H3f,
  parent chấp nhận), `media.ts` md5 `2c384ed13703809d5e999311147745e7`
  — **không đổi trước/sau mọi leg** (verify trước smoke, trước/sau
  leg B, trước/sau leg A). Không có patch production nào từ T3; mọi
  leg đều probe-only.
- **Prereg:** `hidden_files/round120-t3/prereg-t3.md` — viết TRƯỚC mọi
  phép đo (05:44Z). Không có đính chính sau khi đo bắt đầu; chỉ có
  2 điều chỉnh vận hành ghi rõ trong LIMITS này (§5): (i) gate-waiter
  poll 5 phút/lần thay vì 10 phút sau reboot (cửa sổ còn lại ngắn);
  (ii) leg A chạy BÙ sau driver leg B (xem §2.2) — cả hai đều KHÔNG
  đổi định nghĩa đo, ngưỡng, hay tiêu chí hợp lệ.

## 0. Verdict — bar F2 KHÔNG ĐẠT (chế độ chậm); pha seek thuần ĐẠT; overshoot không tái hiện

| Hạng mục | Kết quả |
|---|---|
| Bar F2 mới (định nghĩa tách hai pha, parent CHẤP NHẬN định nghĩa, CHƯA ÁP NGƯỠNG) | **KHÔNG ĐẠT — chế độ chậm.** Bộ 6 run hợp lệ (3 đợt 119 + 3 đợt 120): T_startup chia 2 chế độ — nhanh 0,45/0,45/0,49 s (3 run) và chậm 1,42/1,98/2,39 s (3 run). Theo luật đã đăng ký (đợt 119 §1): chế độ chậm báo RIÊNG, không gộp, không chấm; và "nếu (a) không đạt vì chế độ chậm thì verdict ghi KHÔNG ĐẠT — chế độ chậm". Pha (a) do đó KHÔNG ĐẠT; pha (b) ĐẠT (xem dưới). |
| Pha (a) khởi động pipeline | **KHÔNG ĐẠT.** Nhóm nhanh (n=3): median 0,45 s, p90 0,49 s — qua ngưỡng đề xuất (median ≤1,0 s, p90 ≤1,2 s) nhưng n=3 < 6 run yêu cầu cho bar phân phối nên KHÔNG đủ mẫu để chấm ĐẠT riêng. Nhóm chậm (n=3): 1,42/1,98/2,39 s — đều >1,2 s. Gộp cả 6 không tách chế độ: median 0,955 s (≤1,0 ✓) nhưng p90 2,19 s (nội suy tuyến tính; 2,39 s theo nearest-rank) > 1,2 s ✗ — cũng KHÔNG ĐẠT. Cả hai cách đọc đều cho cùng kết luận pha (a). |
| Pha (b) seek thuần | **ĐẠT.** T_seek = 0,00 s ở cả 6/6 run hợp lệ (mọi run ≤100 ms, median 0,00 s). Ở độ phân giải evs 10 ms, kết luận đúng mức: seek thuần <10 ms. Gộp với đợt 118 (8 run) + đợt 119 (5 case): nay **16/16 run SEEKFAST có T_seek = 0,00 s**. |
| Leg A — follow-up overshoot MSB4RB8 27,02 s | **KHÔNG TÁI HIỆN: 0/3 run** (C = 17,421 cả 3; smoke cũng 17,421). Tần suất gộp (run đăng ký) cập nhật **1/29** (đợt 118: 1/23 + đợt 119: 0/3 + đợt 120: 0/3; smoke không tính). Cơ chế overshoot vẫn chưa rõ. |
| Boot #60 (0260101b) | **0 run.** Replay "chạm mà không cài" (dpkg 2 dòng, 0/9 gói GST trong ~119 phút) — xem §4. Không đo chui trên môi trường hỏng, không tự repair/apt. |
| Môi trường đo (boot mới) | Replay CHẠY NHANH: postboot PASS lúc boot ~7' tuổi (06:57:45Z), GST 269 file, dpkg 1509 dòng — cùng mức với các boot tốt #52/#54/#57. |

## 1. Định nghĩa bar F2 + ngưỡng (giữ nguyên đợt 119 §1 — parent đã chấp nhận định nghĩa)

- **(a) T_startup** = t(loadedmetadata ĐẦU TIÊN) − t(loadstart ĐẦU TIÊN)
  trong evs. Bar phân phối: trên ≥6 run cổng yên, median ≤1,0 s VÀ
  p90 ≤1,2 s → pha (a) ĐẠT. Chế độ chậm (T_startup >1,2 s) báo RIÊNG,
  không gộp vào median/p90, không chấm.
- **(b) T_seek** = t(seeked ĐẦU TIÊN) − t(seeking ĐẦU TIÊN) trong evs.
  Bar: trên ≥6 run, MỌI run ≤100 ms VÀ median ≤50 ms → pha (b) ĐẠT.
  Caveat phân giải evs 10 ms: 0,00 s nghĩa là "<10 ms ở độ phân giải
  đo", KHÔNG tuyên bố 0 ms.
- **Bar F2 ĐẠT tổng thể** khi cả (a) và (b) đều ĐẠT trên cùng bộ run.
  Nếu (a) không đạt vì chế độ chậm → verdict "KHÔNG ĐẠT — chế độ
  chậm", không gộp chế độ.
- **Bộ 6 run cho verdict (đăng ký trước, prereg §1):** 3 valid đợt 119
  (r1/r4/r5, boot 27c8b1d9, cây H3f 5be5a250) + 3 valid MỚI đợt 120
  (boot 80a940d7, cùng cây, cùng cấu hình MSB4RB8, cùng định nghĩa +
  ngưỡng). **CAVEAT GHI RÕ:** hai nửa bộ 6 khác boot. Verdict ghi trên
  bộ gộp 6 theo đúng lệnh đợt 120, đồng thời báo RIÊNG bộ 3 mới đợt
  120 (n=3) để parent tự xét. KHÔNG gộp thêm run đợt 118 (khác cây).
- **Hiệu chỉnh pre-seek load (§1 đợt 119):** T_startup bao gồm ~0–200 ms
  load trước seek (loadstart phát trước tSeek0). Kiểm chứng trên 3 run
  mới: seekImmMs − (T_startup+T_seek) = −30 / −200 / −164 ms, khớp
  đúng độ lệch loadstart–tSeek0 (36 / 205 / 159 ms; r3 chênh ~5 ms do
  làm tròn). Định nghĩa KHÔNG đổi giữa chừng.

## 2. Leg B — Đo F2 (Q8SEEKFAST) — ĐỦ 3/3 valid mới (0 VOID)

**Cấu hình:** MSB4RB8 (`J2_QUEUE2_MAX_SIZE_BYTES=4194304` +
`L2_QUEUE2_RING_BUFFER_MAX_SIZE=8388608`, L2 max-size UNSET).
**3 attempt, 3 valid** (dừng sớm khi đủ 3; ngân sách tối đa 6 attempt
không dùng hết). Bracket load1 <3 trước + sau giữ cả 3 run.

| run | hợp lệ? | load1 trước/sau | seekImmMs | T_startup (s) | T_seek (s) | T_seek_ms | t_loadstart → t_loadedmeta (s) | frames |
|---|---|---|---|---|---|---|---|---|
| r1 | ✓ | 1,48 / 1,83 | 420 | 0,45 | 0,00 | 6 | 0,14 → 0,59 | 384 |
| r2 | ✓ | 1,40 / 0,85 | 290 | 0,49 | 0,00 | 5 | 0,10 → 0,59 | 384 |
| r3 | ✓ | 0,59 / 0,56 | 286 | 0,45 | 0,00 | null | 0,07 → 0,52 | 384 |

- **Tính hợp lệ:** shim readback OK 4194304/8388608 cả 3 run (pull
  log); seekedOk True, finalCt 32, finalSrc blob, errEvents 0 cả 3.
  Không có run VOID nào đợt này (khác đợt 119: 2 VOID do sóng tải).
- **Pha (b) — ĐẠT:** T_seek = 0,00 s ×3 mới (t_seeking = t_seeked =
  t_loadedmeta cả 3 run); T_seek_ms 6/5/null ms. Gộp bộ 6:
  T_seek 0,00 s ×6, median 0,00 s, max 0,00 s → qua bar (b).
- **Pha (a) — KHÔNG ĐẠT (chế độ chậm):** 3 run mới đều chế độ NHANH
  (0,45/0,49/0,45 s). Gộp bộ 6: nhanh 0,45/0,45/0,49 s (n=3, median
  0,45, p90 0,49 — qua ngưỡng nhưng n<6 nên không đủ mẫu chấm ĐẠT)
  + chậm 1,42/1,98/2,39 s (n=3, từ đợt 119). Gộp không tách: median
  0,955 s, p90 2,19 s (tuyến tính) / 2,39 s (nearest-rank) — p90
  vượt 1,2 s. Verdict theo luật đã đăng ký: **KHÔNG ĐẠT — chế độ
  chậm**.
- **Quan sát chế độ theo boot/thời gian:** cả 3 run chậm đều từ boot
  27c8b1d9 (đợt 119, 00:09–00:36Z); cả 3 run nhanh mới + smoke đều
  từ boot 80a940d7 (07:07–07:14Z). Nhất quán giả thuyết đợt 118 (2
  chế độ theo giai đoạn thời gian, không theo cấu hình). Lưu ý đối
  trọng: đợt 119 có 1 run nhanh VOID (r3, 0,54 s) trên boot cũ — chế
  độ nhanh đã từng xuất hiện trên boot cũ, nên không kết luận "chế
  độ do boot quyết định"; chỉ ghi phân bố quan sát được.

### 2.1 Ghi nhận phụ — seek-after-preload (không phải metric bar (b))

Smoke + leg A (Q8PAUSED, seek tới 16 s sau 20 s paused): 0,40 / 0,43 /
0,37 / 0,37 s — nhất quán dải 0,37–0,49 s đợt 119 (leg A 0,49/1,83/2,59
s có 2 run chậm hơn nhiều; đợt này cả 4 run đều nhanh, T_startup
0,32–0,68 s). Tách khỏi seek-immediate 0,00 s khi bàn "seek nhanh"
(tiền lệ đợt 119 §2.1).

## 3. Leg A — Follow-up ngoại lệ MSB4RB8 27,02 s (Q8PAUSED) — 0/3 tái hiện

**Cấu hình:** MSB4RB8 — đúng leg (a) đợt 118 / leg A đợt 119.
**3 run đăng ký** (r1–r3) + 1 smoke trước driver (OUT riêng, KHÔNG
tính vào leg). Cổng vào leg: load1 < 60.

| run | load1 | C (s) | flat5s | T_c (s) | T_startup (s) | T_seek sau-preload (s) | frames | finalSrc | shim | firstPull | wrap | bogus |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| smoke | 0,66 | 17,421 | 0,0 | 0,81 | 0,68 | 0,40 | 384 | blob | OK 4194304/8388608 | `00000020…` | 0/1080 | 0 |
| r1 | 0,69 | 17,421 | 0,0 | 0,70 | 0,50 | 0,43 | 384 | blob | OK | `00000020…` | 0/1080 | 0 |
| r2 | 0,72 | 17,421 | 0,0 | 0,62 | 0,32 | 0,37 | 384 | blob | OK | `00000020…` | 0/1080 | 0 |
| r3 | 0,51 | 17,421 | 0,0 | 0,76 | 0,60 | 0,37 | 384 | blob | OK | `00000020…` | 0/1080 | 0 |

- **Verdict: overshoot KHÔNG TÁI HIỆN.** 0/3 run đăng ký vượt 25 s
  (ngưỡng prereg: C ≥ 25 s). C = 17,421 s ở cả 3 run + smoke —
  giống hệt CTL đợt 118, leg A đợt 119 và smoke đợt 119. Tần suất
  gộp (run đăng ký, smoke không tính): đợt 118 1/23 + đợt 119 0/3 +
  đợt 120 0/3 → **1/29 run Q8PAUSED msb4** (3 boot, 2 cây: baseline
  03bf029f + H3f 5be5a250). Kể cả smoke: 1/31. Cơ chế overshoot vẫn
  CHƯA RÕ; không ưu tiên (hiếm 1/29, không ảnh hưởng verdict H6).
- **H6 giữ ở mức "giá trị điển hình":** trần 17,421 s @ max-size
  4 MiB, flat 0,0, suspend → 0 progress sau suspend — ở cả 3 run
  (và smoke). Số trần luôn ghi kèm cấu hình queue2.
- **Classifier leg A:** SURVIVED 3/3, FAILED/STARVE 0, errEvents 0,
  firstPull `0000002066747970` cả 3, 0 wrap / 0 bogus.

### 2.2 Vì sao leg A chạy bù sau driver (ghi rõ, không giấu)

Cổng môi trường chỉ mở lúc 06:57:45Z (postboot PASS, boot mới ~7'
tuổi) — sau mốc 06:30Z mà gate-waiter dùng để chuyển sang "chỉ leg B"
(theo thiết kế ghi trong gate-waiter: PASS muộn → ưu tiên leg B, vì
verdict F2 là hạng mục chính và hạn cứng 08:00Z không cho cả hai leg
nối tiếp). Driver chạy smoke + leg B (xong 07:13:51Z, còn ~46' tới
hạn cứng) → T3 chạy leg A BÙ ngay sau đó bằng script riêng
(`run-t3-legA-after.sh`, Xvfb :198, cùng runner/analyzer/classifier,
cùng cổng load1<60, cùng tiêu chí hợp lệ) 07:17:23–07:21:06Z. Leg A
bù vẫn là 3 run đăng ký đầu tiên của arm trên boot mới — không chọn
lọc post-hoc, không đổi thiết kế; chỉ đổi thứ tự chạy (leg B trước,
leg A sau) vì cổng môi trường mở muộn. Nếu parent coi thứ tự là vi
phạm prereg thì leg A này chỉ tính là dữ liệu tham khảo (0/3 vẫn
đứng như quan sát, không dùng để cập nhật tần suất gộp).

## 4. Boot #60 + reboot 06:50:58Z (vì sao 0 run trên boot #60, vì sao đo được trên boot mới)

- **Boot #60 (0260101b, 04:45:49Z):** postboot check-only FAIL từ
  try1 04:45:49Z (T7) tới poll #7 06:46:56Z (T3): wrapper K1 PASS;
  libs thiếu 5/5; GST 0 file, thư mục plugin KHÔNG tồn tại;
  dpkg.log chỉ 2 dòng "startup packages configure" 05:35:40Z
  (boot +49'51"); 0 tiến trình apt/dpkg trong suốt ~119 phút quan
  sát (T7 watcher 1 phút/lần, 60 poll tới 06:45:09Z + T3 gate-waiter
  10 phút/lần). T7 kết luận chế độ lỗi mới: **replay chạm mà không
  cài** (khác #58: replay kết thúc sau 350 dòng mà thiếu GST; khác
  #53: không tới hẳn). T3 KHÔNG tự chạy --repair / apt install
  (ngoài phạm vi luồng đo; tiền lệ T8 đợt 119; T7 chờ parent quyết
  luật xử lý — xem POSTBOOT_FAIL của T7).
- **Reboot 06:50:58Z:** `uptime -s` đổi 04:45:49Z → 06:50:58Z; journal
  chỉ còn 1 boot, id `80a940d7…`, first entry 06:51:09Z. Runtime
  restart cùng lúc giết gate-waiter T3 (poll #7 cuối 06:46:56Z FAIL)
  + watcher T7 (đã kết 06:45:09Z). Gate-waiter KHỞI ĐỘNG LẠI sau
  reboot (poll 5 phút/lần thay vì 10 phút vì cửa sổ còn lại ngắn —
  ghi rõ ở đây, không đổi định nghĩa đo). Không có reboot nào khác
  trong lúc T3 đo (uptime -s không đổi từ 06:57Z tới lúc xong).
- **Boot mới (80a940d7, 06:50:58Z):** replay CHẠY NHANH — dpkg.log
  53 dòng lúc 06:52:14Z → 397 dòng 06:53:00Z → 1509 dòng lúc PASS
  (đúng bằng #52/#54/#57, cùng package cuối gstreamer1.0-tools);
  GST 0 → 32 file (06:52:44Z) → 269 file (06:57:45Z); libs PASS
  từ 06:53:00Z; postboot PASS 06:57:45Z (boot ~6'57" tuổi) → khoảng
  replay (2'02", 6'57"] (FAIL live 06:53:00Z, PASS live 06:57:45Z;
  bracket hậu kiểm từ dpkg.log chưa kẹp chặt hơn — T7 đợt 120 có
  thể kẹp lại bằng dpkg.log boot này nếu cần). Headroom inotify boot
  mới: T7 đo 545 (rơi tiếp từ 670 #57) — ghi lại, không phải việc T3.

## 5. Phương pháp, caveat và nhật ký vận hành

- **Prereg trước đo:** `prereg-t3.md` 05:44Z (trước mọi đo kể cả
  smoke). Không có đính chính nào sau khi đo bắt đầu. Hai điều chỉnh
  vận hành (ghi ở đầu LIMITS + §2.2 + §4): poll gate-waiter 5'/lần
  sau reboot; leg A chạy bù sau driver. Cả hai đều trước phép đo
  liên quan và không đổi định nghĩa/ngưỡng/tiêu chí hợp lệ.
- **Runner T3-120:** copy runner 119, chỉ đổi chuỗi round, PORT
  8948→8950, S9_DIR mặc định → round120-t3 (`node --check` OK).
  **Analyzer:** copy + đổi H/OUT mặc định (không đổi logic) —
  validate TRƯỚC khi đo trên dữ liệu đợt 119: T_startup
  2,39/2,90/0,54/1,98/1,42 s, T_seek 0,00 s ×5, T_seek_ms
  null/0/0/4/7 — KHỚP T8 đợt 119. **Classifier:** copy đợt 119,
  đổi H/OUT mặc định. **Lock v2:** copy
  `apps/web/scripts/vcut-vite-lock-v2.sh` md5 `cd0c05c1…` vào thư
  mục làm việc; mỗi run đo qua `run-attempt t3-round120 5191 900 30
  normal` (nhả giữa các attempt; dial-wait ngoài lock). Cổng 5191
  tránh 5187 (T4) / 5188 (T5) / 5189 (T8-119) / 5590 (T1). Runner
  không chạy vite — lock chỉ để xếp hàng cửa sổ đo.
- **Gate-waiter:** chạy DETACHED 05:46:54Z, poll #1–#7 FAIL trên boot
  #60 (05:46–06:46Z, 10'/lần), chết theo reboot 06:50:58Z, khởi động
  lại 06:52:44Z, poll #1 (06:52, FAIL, GST 32 file) → poll #2
  (06:57:45Z, **PASS**) → gọi driver leg-B-only (SKIP_LEG_A=1).
- **Driver:** `run-t3-all.sh` chạy DETACHED 06:57:45Z → DONE
  07:13:51Z (smoke exit 0 07:06:47Z — chậm do xếp hàng lock sau
  ticket t10-round120; leg B r1–r3 exit 0, valid 3/3). **Leg A bù:**
  `run-t3-legA-after.sh` 07:17:23–07:21:06Z (r1–r3 exit 0).
  Xvfb :197 (driver) + :198 (leg A bù), socket OK cả hai.
- **Load waves:** không có sóng tải nào vỡ bracket đợt này (load1
  cao nhất sau run là 1,83; load1 lúc đo 0,56–1,83). Khác hẳn đợt 119
  (r2/r3 VOID do load sau 28,00/34,31).
- **Suite liên quan:** không chạy (không có thay đổi production nào
  từ T3; cây byte-identical với baseline đợt 120, preview.tsx H3f
  đã được T1 đợt 119 verify tsc 0 + vite build PASS).
- **Thời gian:** slot cron 05:35–08:35Z; prereg 05:44Z; chờ cổng
  05:46–06:57Z (gồm reboot 06:50:58Z); driver 06:57–07:13Z; leg A bù
  07:17–07:21Z; LIMITS viết xong ~07:3xZ. Còn dư thời gian slot
  nhưng mọi hạng mục đã xong.
- **Không đụng:** TTS 39, birefnet, `.github/workflows/*`,
  production code, binary vào batch, apt/dpkg/--repair.

## 6. Nợ mở cho đợt sau

1. **Bar F2 (nợ #1 — ĐÃ CÓ VERDICT đợt này):** **KHÔNG ĐẠT — chế độ
   chậm** (pha (b) ĐẠT, pha (a) không đạt). Đợt sau nếu muốn lật
   verdict cần EITHER (i) ≥6 run mới toàn chế độ nhanh trên cùng
   một boot + cùng cây (để bar phân phối đủ n=6), HOẶC (ii) parent
   quyết lại ngưỡng/định nghĩa pha (a) (vd: chấm theo nhóm nhanh
   riêng, hoặc ngưỡng p90 nới). T3 không tự đổi luật. Lưu ý: 3 run
   nhanh mới + smoke đều trên boot 80a940d7 — nếu boot này còn sống
   ở đợt sau, chạy tiếp leg B trên cùng boot là đường ngắn nhất tới
   n=6 nhanh (cần thêm 3 valid nhanh nữa, tối đa 6 attempt).
2. **Overshoot 27,02 s:** tần suất gộp nay **1/29** (run đăng ký) —
   cơ chế vẫn chưa rõ; không ưu tiên (hiếm, không ảnh hưởng H6).
3. **Seek-after-preload chậm (0,37–0,43 s đợt này) vs seek-immediate
   0,00 s:** ghi nhận để đợt sau tách khi bàn "seek nhanh" — có thể
   liên quan wake-up sau suspend (target 16 s gần trần 17,421).
4. **Hạ tầng:** boot #60 chết mà không bao giờ đủ GST (chế độ lỗi
   mới "replay chạm mà không cài") — luật xử lý GST thiếu sau
   reboot vẫn chờ parent quyết (T7 đợt 120 đề xuất trong LIMITS
   của T7). Boot mới 80a940d7 replay nhanh (PASS ~7') — bracket
   replay (2'02", 6'57"] ghi ở §4.
5. **Nợ đứng yên:** G1 deinterlace + mù #22/#28–#31/#35 chờ user
   quyết; `ci-security.yml` vẫn 403 chờ user; TTS 39 cấm kiểm lại;
   birefnet chỉ thử lại khi RAM đổi (u2net là fallback chính thức).
   Xem LIMITS gộp đợt 119 §12.

## 7. File và dữ liệu

- Runner T3-120: `benchmarks/render/webkit_blob_flaky_120t3.mjs`
  (copy runner 119 + PORT 8950; ~80 KB — **>37.768 B, cần
  `ENABLE_PRIVSEP=0` khi push**).
- Analyzer T3-120: `benchmarks/render/q8_analyze_120t3.py`
  (+ T_startup/T_seek/T_seek_ms).
- LIMITS này: `docs/PHASE9_ROUND120_T3_SEEKPRELOAD_LIMITS.md`.
- OUT JSON (KHÔNG stage, theo lệ `benchmarks/results/`):
  `webkit-blob-flaky-120t3-seekpreload-msb4rb8.json` (3 case leg A),
  `...-msb4rb8-seekfast.json` (3 case leg B),
  `...-smoke.json` (1 case).
- Dữ liệu thô + prereg + driver + gate-waiter + leg A bù + log
  (KHÔNG stage): `hidden_files/round120-t3/` (`prereg-t3.md`,
  `run-t3-all.sh`, `run-t3-gatewait.sh`, `run-t3-legA-after.sh`,
  `t3_classify.py`, `vcut-vite-lock-v2.sh`, `t3-progress.md`,
  `t3-gatewait.log`, `t3-driver.out`, `t3-legA-after.out`,
  `t3-postboot-b60-try1.log`, `t3-postboot-b61-try1.log`,
  `t3-analysis-dryrun-119seekfast.txt`, `t3-analysis-smoke.txt`,
  `t3-analysis-msb4rb8.txt`, `t3-analysis-msb4rb8-seekfast.txt`,
  `t3-classify-msb4rb8.txt`, `t3-legA-r*.log`, `t3-legB-r*.log`,
  `t3-smoke.log`, `smoke/`, `msb4rb8/`, `msb4rb8f/`).
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round120-t3-seekpreload.txt`
  (NUL-delimited; 3 entry: runner T3-120, analyzer T3-120, LIMITS này).

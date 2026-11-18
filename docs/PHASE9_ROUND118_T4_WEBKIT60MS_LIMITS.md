# PHASE9_ROUND118_T4_WEBKIT60MS_LIMITS — F6' WebKit ≤60 ms: lượt yên THEO DÕI — CHẠY ĐƯỢC (attempt8: median 40,0 ms, lớp B 5/5 ĐẠT)

> Luồng T4, đợt 118, lượt cron 18:35 +07 15/11/2026 (bắt đầu ~11:35Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> Nợ #5 đợt 117 (LIMITS gộp §10 mục 5): chỉ THEO DÕI ngưỡng WebKit
> ≤60 ms đã chốt ở đợt 116 (S5 lượt yên xác nhận lần 5: attempt3
> 20/20 pass, tickCost median 49,5 ms, p90 75,0 ms, n=570, lớp B mới
> gồm B5 RAM-mid 5/5, F6' 100%/100% n=71) — chạy MỘT lượt yên xác
> nhận theo đúng phương pháp S5 trên cây 03bf029f không đổi.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không
> đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — CHẠY ĐƯỢC 1 LƯỢT YÊN ĐẠT LỚP B (attempt8,
> boot #55): tickCost total median 40,0 ms, p90 64,7 ms, n=644,
> 20/20 pass, probe_exit=0, lớp B 5/5 ĐẠT → NGƯỠNG ≤60 ms GIỮ
> NGUYÊN (xác nhận tiếp tục GIỮ). Đây là lượt yên theo dõi đầu tiên
> chạy được sau khi chốt (T5 đợt 117: 0 lượt) — median 40,0 là tốt
> nhất trong các lượt yên từ trước tới nay (L7 40,5 / N1 50,0 /
> N4 58,0 / S5 49,5).**
> 1. **Attempt7 (boot #54) CHẾT GIỮA CHỪNG do reboot #55** (12:51:56Z,
>     cắt ở pass 12/20): partial JSON median DỞ DANG 44,0 ms (n=344,
>     KHÔNG dùng để chốt/mở lại ngưỡng); lớp B VI PHẠM (B2 load1 max
>     5,41 >4; B3 reboot giữa lượt; B5 RAM min 286 MB <500).
> 2. **Attempt8 (boot #55) THÀNH CÔNG TRỌN VẸN:** 20/20 pass,
>     probe_exit=0, tickCost median 40,0 / p90 64,7 / max 113 / min
>     28, n=644; hậu flip median 40,0; wallbands phẳng 39,0–42,5 qua
>     mọi dải (không warm-up, không suy giảm hậu flip); lớp B 5/5
>     ĐẠT (load1 max 3,41; load5 cuối 1,31; RAM min 1157 MB, 0 mẫu
>     <1024 MB; không reboot; không apt trong cửa sổ).
> 3. **(b) unique-match:** skp=1 nomatch 0/130, lag max +2f; skp=0
>     nomatch 0/642, lag (b) median 1f, p90 2f, max +9f, ≥5f: 10,
>     ≥10f: 0. **F6' (bar (1)/(2)):** 100,0% / 100,0% (nTick=65
>     skp=1, ≥30) — F6' VẪN ĐÓNG (xác nhận lại).
> 4. **Stale-ghost — CÓ PHÁT HIỆN MỚI (không phải P4, không phải
>     Q5):** 10 occurrence lag ≥+5f (đều skp=0) gom thành 3 event:
>     frame 19 (2 occ, 74 ms), frame 22 (2 occ, 77 ms), **frame 23
>     (6 occ, 229 ms, lag max +9f, pixels đứng yên ở frame 23 trong
>     khi presented chạy 16→23, label chạy 14→18)**. Event frame 23
>     đạt tiêu chí "≥3 ghost liên tiếp cùng 1 frame" của prereg —
>     phân loại **event MỚI** (khác frame P4-26, ngắn hơn P4 420 ms;
>     không sau seek như Q5-68, lag nhỏ hơn nhiều). KHÔNG kết luận
>     hồi quy từ 1 event — đề xuất luồng riêng chẩn đoán ở đợt 119.
> 5. **Reboot #55 giữa đợt (12:51:56Z, boot_id 52d799d4, gap
>     #54→#55 = 2h03'30"):** cắt attempt7; replay #55 CHẠY và kẹp
>     được bracket (0'42", 2'46"] (nhanh nhất từ trước tới nay, ngang
>     #48); postboot #55 PASS ngay lần kiểm đầu (T4 check-only, T7 đã
>     DONE trước #55 nên không có cờ T7 cho boot mới — xem §0).
> 6. **Hồi quy nhẹ trên cây 03bf029f: tsc exit 0 (sạch),
>     ghostBlend 15/15 PASS.** Cây không đổi suốt đợt (md5 trước =
>     sau mọi attempt). T1 đổi spec lock v2 trong đợt (lock script
>     md5 8b02ddc8 → 5cac10af, T4 chỉ ghi nhận, không sửa).

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round118-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (11:40–11:41Z), đăng ký: lớp B gồm B5, gate 0 + lớp A,
  timeout 120 s/pass + JSON tăng dần, quy tắc quyết định ngưỡng
  (median ≤60 → GIỮ; >60 → MỞ LẠI nợ), kế hoạch theo dõi
  stale-ghost 2 event riêng biệt, lấy mẫu load1/RAM giữa lượt.
  T4 tuân thủ đúng prereg, với 2 điểm thích ứng đã ghi rõ (không đổi
  quy tắc quyết định): (i) gate 0 cho boot #55 dùng check-only
  RIÊNG của T4 (T7 đã DONE trước #55 — xem dưới); (ii) chạy lại
  sau reboot giữa chừng theo đúng prereg ("reboot giữa chừng thì
  chạy lại").
- **Boot trong đợt: HAI boot — #54 rồi #55.**
  - Boot #54 (`uptime -s` 2026-11-15 10:48:26Z, boot_id
    `48a82db1-a8e4-41fe-9c9d-08719ce19250`): T4 bắt đầu trên boot
    này (~11:35Z, boot ~47' tuổi). Replay #54 CHẠY nhưng tới muộn:
    hoạt động dpkg đầu tiên 11:35:40Z (boot +47'14" — muộn nhất từ
    trước tới nay), cài xong 11:40:56Z (boot +52'30"), 1509 dòng
    dpkg.log. Postboot #54 PASS (T7 watcher + check-only riêng của
    T4 đều exit 0). Gate 0 ĐẠT ở poll #2 (11:43:26Z, chỉ sau ~2 phút
    poll cờ T7 — trong ngân sách 45 phút).
  - Boot #55 (`uptime -s` 2026-11-15 12:51:56Z, boot_id
    `52d799d4-66bd-488c-a913-8aa6d64fd245`): reboot giữa đợt, đúng
    lúc attempt7 đang chạy (cắt ở pass 12/20). Gap #54→#55 =
    2h03'30" (trong dải chứng nhận [19'07", 3h14'08"]). Mù #36 mở từ
    probe #36 08:42:46Z 15/11 chứa #53 — #54/#55 nhiều khả năng cũng
    nằm trong mù #36 (T6 đang làm probe #37 + mù #36 đợt 118; T4
    không đụng bookkeeping mù, chỉ ghi boot id để đối chiếu).
  - Replay #55: CHẠY và kẹp được bracket (0'42", 2'46"]: hoạt động
    dpkg đầu tiên 12:52:38Z (boot +42"), entry cuối 12:54:42Z
    (gstreamer1.0-tools) — NHANH NHẤT từ trước tới nay (ngang #48
    (0'40", 2'44"]; #52 (6'28", 8'44"]; #54 tới muộn +47'14"). T4
    kiểm postboot #55 lần đầu ~13:00Z (boot +~8'): PASS ngay
    (wrapper + 5 lib + GST isomp4/libav + đủ 11 package). T7 (luồng
    hạ tầng đợt 118) đã DONE trước #55 (cờ round118-t7.done có từ
    ~11:41Z) nên KHÔNG có cờ T7 cho boot #55 — T4 KHÔNG chờ cờ
    không tồn tại mà dùng check-only RIÊNG làm bằng chứng gate 0
    cho #55 (cùng script, cùng tiêu chí như prereg gate 0 (0b)/(0c);
    T7 đã PASS #54 nên phối hợp T7 chỉ áp dụng cho #54). Ghi rõ để
    khỏi hiểu là T4 bỏ qua phối hợp: cờ T7 cho #54 đã được poll và
    dùng đúng (gate 0 #54 ĐẠT nhờ cả 2 nguồn).
  - **Lưu ý timestamp:** file attempt7 ghi lần cuối 12:52:21–12:52:25Z
    trong khi btime #55 là 12:51:56Z — chênh ~30 s. Khả năng cao là
    clock-skew quanh biên reboot (đồng hồ cell trước reboot chạy
    nhanh ~30 s, hoặc btime ghi lúc kernel mới bắt đầu trong khi
    tiến trình cũ còn ghi thêm vài giây). T4 ghi nhận, không giải
    quyết được từ trong cell (dmesg không đọc được: Operation not
    permitted); phân loại attempt7 (B3 VI PHẠM + chết giữa chừng)
    không phụ thuộc vào việc giải quyết chênh này.
- **Cây đo `03bf029f…`** (= cây S5 đo đợt 116). KHÔNG ĐỔI suốt đợt
  (kiểm trước/sau mọi attempt + kiểm cuối 13:12Z). Không có cờ
  `round118-tree` nào xuất hiện trong đợt (T2 chỉ chẩn đoán H3f +
  build patch để sẵn, KHÔNG sửa production; T1 chỉ đổi file lock
  script). T4 không sửa production (md5 trước = sau mọi attempt).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t4-tickcost.py`
  + `analyze-t4-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 / wallbands S5 §1.4 — khớp 100% với dry-run
  của T5 đợt 117 (diff sạch). Analyzer copy từ S5 hoạt động đúng.
- **Inotify headroom:** T7 đo cho #54: 804 watch (giảm từ 925 cuối
  boot #52 — reboot không hồi, tiếp tục giảm). Vite chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) — bắt buộc.
- **Vite lock v2-ONLY** (`apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`), cổng T4 **5187** (mới đợt 118; T5 dùng
  5188). Lock script md5 lúc T4 bắt đầu: `8b02ddc8…`; T1 đợt 118 đổi
  spec lock v2 (quyết parent đợt 117 §13 mục 4 — đã chấp nhận) nên
  md5 đổi sang `5cac10af…` từ trước attempt1 (11:43:53Z) và GIỮ
  NGUYÊN `5cac10af…` qua mọi attempt 1–8 (T4 ghi lại trước mỗi
  attempt; T4 không sửa script). Lock TRỐNG lúc bắt đầu (0 ticket +
  22 cooldown); sau reboot #55 lock trống (stale lock boot #54 đã
  sạch — v2 stale recovery qua boot_id hoạt động).

## 1. Tám lần thử — 6 lần gate A không mở, 1 lần chết theo reboot, 1 lần THÀNH CÔNG

### 1.1 Attempt1–6 (11:43–12:50Z, boot #54): gate A không mở (exit 5)

| attempt | khung giờ | gate A 10 poll: load1 / load5 | lock/blockers | RAM | kết quả |
|---|---|---|---|---|---|
| 1 | 11:43:54–11:54 | 0,70–36,01 / 8,89–19,57 | T3 giữ suốt / 4–12 | 808–1601 MB | exit 5 |
| 2 | 11:56:10–12:06 | 1,05–28,58 / 8,45–17,95 | T3→T2 / 4–12 | 528–3614 MB | exit 5 |
| 3 | 12:07:22–12:18 | 2,30–60,10 / 13,65–32,73 | T2→T3 / 1–8 | 381–1557 MB | exit 5 |
| 4 | 12:18:16–12:28 | 0,69–61,52 / 14,53–36,73 | T3 giữ suốt / 2–8 | 499–1137 MB | exit 5 |
| 5 | 12:29:07–12:39 | 0,50–11,77 / 5,16–27,03 | T3→khong / 1–8 | 1249–4571 MB | exit 5 |
| 6 | 12:39:27–12:49 | 0,70–1,70 / 1,52–4,47 | khong→T5 (poll 9) / 0–9 | 888–2024 MB | exit 5 |

Nguyên nhân chung: T3 chạy dial s79r2 (250 clip, 56 hog, `--skip-quiet`)
+ T2 chạy chẩn đoán H3f (Chromium + hog) + T9 chạy lô E4 — tải cao kéo
dài (load1 đỉnh 61,52 ở attempt4; load5 tới 36,73), RAM sụt tới 381 MB
(attempt3, gate A poll), lock luân phiên T3/T2 giữ. Điểm sáng cuối
attempt5–6: load1 đã về 0,50–1,70, load5 giảm từ 27,03 xuống 1,52, RAM
hồi tới 4571 MB, lock trống — cửa yên suýt mở ở attempt6 poll 9–10
(load5 đã <2: 1,74 rồi ~1,52), chỉ còn lock T5 giữ (T5 mở gate trước)
+ blocker T8 (WebKit legC1) chặn.
- **Attempt6 poll 9 (12:47:28Z): load1=0,70, load5=1,74, lock=co:
  thread=t5** — T5 (ghost, cổng 5188) đã mở gate trước T4 đúng 2 giây
  (poll 17 của T5 lúc 12:47:26Z, cùng số load1/load5). T5 chạy probe
  20 pass, probe_exit=0, JSON 3.246.166 byte, nhả lock 12:48:50Z (giữ
  84 s). T4 KHÔNG tranh lock với T5 — FIFO qua lock v2 hoạt động đúng:
  T5 đo trước, T4 đo sau (attempt7/8). T5 trước đó đã chờ T4 15 phút
  (ghi trong poll-t5.log: "HET 15 PHUT CHO T4 (T4_DONE=0) — T5 tu
  chay theo gate cua minh") rồi mới tự chạy theo gate của mình.

### 1.2 Attempt7 (12:50:18–12:52:25Z, boot #54): gate MỞ, CHẾT THEO REBOOT #55

- Gate A mở poll 2 (12:51:18Z): load1=1,23, load5=1,42, lock trống,
  blockers=0, RAM 1220 MB, tree YES. Probe-start 12:51:18Z, boot #54.
- Probe chạy tốt passes 1–10 (wall-clock ~3,0–3,4 s/pass, 34–41 khung
  rAF/pass). **Pass 11: 15,801 ms** (gấp ~5× bình thường, chỉ 22 khung,
  lastFrame 43 thay vì ~65) — dấu hiệu nhiễu đúng lúc reboot #55 bắt
  đầu (btime 12:51:56Z). Pass 12 về bình thường (3,825 ms, 37 khung).
- **Chết sau pass 12/20:** không có pass 13, không inner-end, không
  ps-after, không classb — toàn bộ cây tiến trình run-attempt biến
  mất (vite + browser + sampler + run-t4.sh đều không còn). Poller
  5 phút của T4 chết theo (entry cuối 12:51:24Z; T10 poller cũng chết:
  poll cuối #15 12:49:51Z). Nguyên nhân: **reboot #55** (B3 VI PHẠM).
- Sampler (4 mẫu): 12:51:20 RAM 1157 MB / 12:51:40 615 MB / 12:52:00
  622 MB / **12:52:20 load1 5,41, RAM 286 MB** — mẫu cuối cho thấy máy
  chịu áp lực nặng đúng biên reboot (load spike + RAM sụt; dmesg không
  đọc được nên không xác nhận được OOM-kill; replay #55 chỉ bắt đầu
  12:52:38Z nên KHÔNG phải nguyên nhân spike này).
- Class B attempt7 (đánh giá hậu kiểm bằng check-classb-t4.sh,
  boot_start 10:48:26): **B1 DAT** (load5 lúc đánh giá 0,97 — hậu
  kiểm sau reboot, chỉ ghi nhận); **B2 VI PHẠM** (load1 max 5,41 >4);
  **B3 VI PHẠM** (boot 10:48:26 → 12:51:56); B4 DAT (apt=0 lúc đánh
  giá); **B5 VI PHẠM** (RAM min 286 MB, 1/4 mẫu <500 MB; 3/4 mẫu
  <1024 MB). → **Lớp B KHÔNG ĐẠT + dở dang 12/20 → KHÔNG dùng để
  chốt/mở lại ngưỡng** (đúng prereg).
- Partial JSON (12/20, n=344): tickCost median **44,0** / p90 76,0 /
  max 206 / min 28 (DỞ DANG — max 206 là pass 11 nhiễu reboot);
  wallbands: 0–20k 48,5 / 20–32k 41,0 / 32–45k 43,5 / 45–62k 52,0
  (n=29). lag5 trên partial: 0 occurrence ≥+5f (chỉ tham khảo — file
  partial thiếu trường analysis hoàn chỉnh nên (b)/F6' không tính
  được đầy đủ: skiplatest báo "CHUA DU MAU", nTick=0 hậu flip).

### 1.3 Attempt8 (13:02:46–13:07:08Z, boot #55): THÀNH CÔNG TRỌN VẸN

- Gate 0 cho #55: postboot check-only RIÊNG exit 0 + apt_procs=0
  (try 1 trong run-t4.sh, 13:02:46Z). Gate A mở poll 2 (13:03:46Z
  probe-start): load1=0,38, load5=0,92, lock trống, blockers=0 (poll 1
  còn 1 blocker thoáng qua, không ghi danh tính — đã sạch ở
  poll 2), RAM 2319 MB, tree YES.
- Probe chạy 20/20 pass, probe_exit=0, JSON đầy đủ (passes=20,
  engine webkit 27.2, pageErrs=[]), inner-end 13:07:04Z,
  run-attempt exit=0 13:07:08Z. **Browser.close() treo ~2 phút**
  (JSON đã ghi xong 13:05:08Z, inner-end 13:07:04Z) — MiniBrowser
  chậm thoát sau 20 pass; số đo không ảnh hưởng (JSON đã đủ trước
  khi treo), chỉ làm lock nhả muộn ~2 phút. Ghi nhận để luồng sau
  biết (T5 đóng nhanh 84 s cả lượt — khác biệt này có thể do trạng
  thái renderer sau lượt đo dài).
- Sampler (n=10, mỗi 20 s): load1 1,04–3,41; RAM 1157–2249 MB.
- **Class B attempt8 — 5/5 ĐẠT** (`classb-t4-attempt8.txt`):
  B1 DAT (load5 cuối 1,31 ≤2,5); B2 DAT (load1 max 3,41 ≤4; ps
  before/after không thấy process phân tích nặng của luồng khác
  TRONG cửa sổ đo — T10 bắt đầu `acquire t10-round118` lúc
  ~13:07:04Z, SAU tick cuối 13:05:08Z, chỉ lọt vào ps-after, không
  nhiễm lượt đo); B3 DAT (boot #55 trước = sau); B4 DAT (apt/dpkg 0);
  B5 DAT (RAM min 1157 MB, 0/10 mẫu <500 MB, 0/10 mẫu <1024 MB).
- Poller 5 phút đã khởi động lại sau reboot (entry 13:02:33Z; khoảng
  trống 12:51:24Z → 13:02:33Z là do reboot giết poller cũ).

## 2. Số đo chính attempt8 — NGƯỠNG GIỮ (median 40,0 ≤ 60)

`analyze-t4-attempt8-tickcost.txt` + `analyze-t4-attempt8-wallbands.txt`
(JSON đầy đủ, 20/20 pass):

| chỉ số | attempt8 (T4, đợt 118) | S5 (đợt 116) | N1 | N4 |
|---|---|---|---|---|
| tickCost total median | **40,0 ms** | 49,5 | 50,0 | 58,0 |
| tickCost p90 / max / min | 64,7 / 113 / 28 | 75,0 / 109 / 29 | — | — |
| n tick | 644 | 570 | — | — |
| hậu flip+2000ms median / p90 | 40,0 / 64,0 | 49,5 / 75,9 | — | — |
| tBlend gap median / p90 / max | 79,0 / 101,1 / 1785 | 93,0 / 117,2 / 2139 | — | — |
| BlendTick/pass / rAF/pass median | 26,1 / 40 (34–46) | 23,3 / 34 (29–40) | — | — |
| pageErrs / webkit | [] / 27.2 | [] / 27.2 | — | — |

Phân rã wallMs (đăng ký trước, cùng biên với P4/Q5/R5/S5):
0–20k n=93 median 42,0 / 20–32k n=107 median 41,0 / 32–45k n=136
median 40,0 / 45–62k n=172 median 40,0 / 62–70k n=84 median 39,0 /
70–80k n=52 median 42,5. **Phẳng qua mọi dải** (39,0–42,5): không
warm-up, không suy giảm hậu flip, không tăng dần theo thời gian.
- **Verdict ngưỡng (theo prereg §1, lượt ĐẠT lớp B): median 40,0 ≤ 60
  → GIỮ ngưỡng ≤60 ms.** Không siết tiếp (dù median 40,0 < 45 —
  prereg cấm siết chỉ từ 1 lượt; siết cần thêm lượt yên độc lập).
  Biên an toàn so với ngưỡng: 20 ms (lớn nhất từ trước tới nay trong
  các lượt yên: S5 biên 10,5 ms; N1 10,0 ms; N4 2,0 ms).
- Ghi thêm: n=644 > n=570 của S5 (rAF/pass median 40 vs 34 — máy yên
  hơn nên mỗi pass đo được nhiều khung hơn; không đổi định nghĩa
  median, vẫn là median toàn lượt như mọi lượt trước).

## 3. (b) unique-match + F6' trên lượt yên attempt8

`analyze-t4-attempt8-labellag.txt` (lát (b), tick hậu flip+2000ms,
viaRvfc=0):
- skp=1: nTick=65, nOccurrence=130, nomatch **0/130 (0,0%)**; lag (b)
  median 0f, p90 1f, max +2f, ≥5f: 0, ≥10f: 0. (c) n=0.
- skp=0: nTick=321, nOccurrence=642, nomatch **0/642 (0,0%)**; lag (b)
  median 1f, p90 2f, max +9f, ≥5f: 10, ≥10f: 0; (c) dang ngo n=12
  (median 1f, max +5f), (c2) dang ngo thật n=12 (liệt kê đủ trong
  file analyzer).
- Phân phối lag (b) skp=0: {'1-2': 387, '0': 180, '3-4': 31, '<0': 34,
  '5-9': 10}. Không lag ≥+10f. Kỳ vọng prereg (nomatch 0, trễ dương
  thông thường max ≤+4f) — ĐẠT cho đa số, ngoại trừ 10 occurrence
  +5f..+9f được phân tích riêng ở §4 (stale-ghost).

`analyze-t4-attempt8-skiplatest.txt` (bar F6' (1)/(2), nhãn HIỆN TẠI):
- skp=1 (CHÍNH): nTick=65 (≥30). (1) nhãn: tick KHÔNG chứa
  ghost==presented: **65/65 (100,0%)** (bar ≥90%). (2)
  pixel-verified: tick KHÔNG vi phạm thật: **65/65 (100,0%)** (bar
  ≥90%). (3) alias: 0. **KẾT LUẬN: F6' ĐÓNG** — skipLatest
  pixel-verified trên WebKit (xác nhận lại, vẫn đóng từ L7).
- skp=0 (đối chứng): (1) 321/321 (100,0%); (2) 321/321 (100,0%);
  (3) KHAC n=12 (các seq 155/174/230/254/284/310/391/419/448/479 —
  trùng vùng event lag5 §4).

## 4. Theo dõi stale-ghost — PHÁT HIỆN EVENT MỚI frame 23

`analyze-t4-attempt8-lag5.txt` — (b) lag ≥+5f: **10 occurrence**
(đều skp=0), gom thành 3 event (cùng M, tBlend cách <1000 ms):

| event | occ | M (pixel-thật) | tBlend span | presented | label | lag max |
|---|---|---|---|---|---|---|
| 1 | 2 | [19] | 66770–66844 (74 ms) | 16→18 | 14→14 | +5f |
| 2 | 2 | [22] | 66844–66921 (77 ms) | 18→20 | 16→16 | +6f |
| 3 | 6 | [23] | 70040–70269 (229 ms) | 16→23 | 14→18 | +9f |

- **Event 3 (frame 23): pixels đứng yên ở frame 23 trong 229 ms
  (6 ghost liên tiếp cùng 1 frame, M=[23] đơn trị) trong khi
  presented chạy 16→23 và label chạy 14→18.** Đây là event ĐẦU
  TIÊN trong một lượt yên ĐẠT lớp B mà pixels đứng yên ≥3 ghost
  liên tiếp (S5: 0 lag ≥+5f; N1: 0). Cấu trúc GIỐNG P4 (frame 26,
  pixels đứng yên ~420 ms, nhãn chạy 14→20) nhưng **khác frame
  (23 vs 26), ngắn hơn (229 ms vs 420 ms), lag nhỏ hơn (max +9f vs
  +12f)** → phân loại **event MỚI**, không phải tái hiện P4-frame-26.
- **Không phải Q5-seek-68:** không có seek trong protocol lượt yên
  (chỉ play liên tục); lag max +9f << +68f; label 14–18 (không phải
  0); event 3 ở cuối lượt (tBlend ~70 s, pass ~19–20), không sau
  seek.
- Events 1–2 (2 occ mỗi event, 74/77 ms): dưới ngưỡng ≥3 ghost để
  thành event đứng yên — ghi nhận là "tái hiện một phần" (lag ≥+5f
  rải rác), không gộp vào event cũ.
- **Kết luận theo prereg §3:** TÁI HIỆN (1 event mới đạt tiêu chí
  ≥3 ghost) — ghi chi tiết đầy đủ như trên; **KHÔNG tự kết luận hồi
  quy từ 1 event** (n=1 event, 229 ms, trong lượt yên mà median
  tickCost tốt nhất từ trước tới nay 40,0 ms và F6' 100%). **Đề xuất:
  luồng riêng chẩn đoán cơ chế ghost frame-23 ở đợt 119** (đối chiếu
  với P4-frame-26: cùng cơ chế giữ frame hay khác? vì sao frame 23?
  có liên quan tới biên pass cuối không?). Nợ này chuyển sang LIMITS
  gộp đợt 118.
- **Đối chiếu độc lập cùng đợt (T5):** T5 đợt 118 thấy **2 event
  P4-type nữa, cả 2 trên lượt yên** — attempt2 M=35, lag max +11f
  (pass 12, seq 308–311, 225 ms, presented 26→34); attempt3 M=28,
  lag max +9f (pass 18, seq 418–420, 197 ms, presented 22→27). Cộng
  event frame 23 của T4, đợt 118 có **3 event P4-type trên lượt yên,
  frame đóng băng 35 → 28 → 23 (đều khác nhau)** — củng cố 2 kết
  luận của T5: (i) frame đóng băng BIẾN THIÊN (không phải một frame
  cố định — giả thuyết "cùng pha" càng yếu); (ii) P4-type xảy ra cả
  khi yên (dissociation với seek-stale, 0/60 yên). Tally P4-type sau
  đợt 118: 6 rõ + 1 nhỏ (theo đếm của T5) + 1 rõ mới của T4 (frame
  23) — T10 gộp sẽ chốt tally cuối.
- Bối cảnh thêm: event 3 xảy ra ở tBlend ~70,0–70,3 s (dải wallMs
  70–80k, pass cuối) — không trùng flip (26,25 s), không trùng reboot,
  không trùng spike tải (load1 max cả lượt 3,41; RAM min 1157 MB).

## 5. Kiểm chứng hồi quy — cây không đổi, PASS

- `tsc` apps/web (`npx tsc --noEmit`): **exit 0** (log `tsc-t4.log`
  trống — sạch; chạy 13:11Z trên cây 03bf029f, sau attempt8).
- `ghostBlend.probe.test.ts`: **15/15 PASS** ("15 kiểm chứng xanh"),
  chạy bằng `node --experimental-strip-types` từ gốc repo đúng đường
  dẫn `apps/web/src/lib/ghostBlend.probe.test.ts` (log
  `ghostblend-t4.log`, chạy 13:12Z).
- `vite build`: KHÔNG chạy lại — N1 đã chạy PASS trên cùng cây
  `03bf029f…` đợt 112 (ghi rõ, không hiểu là đã chạy đợt này); T4
  không sửa production (md5 không đổi).
- preview.tsx md5 `03bf029f…` không đổi trong suốt 8 attempt +
  kiểm cuối 13:12Z.
- Không sửa file production nào. (T10 đang giữ lock chạy verify gộp
  lúc T4 làm hồi quy — tsc/ghostBlend không cần lock/vite nên không
  nhiễm verify của T10.)

## 6. Sự cố hạ tầng trong lúc đo

1. **Reboot #55 giữa đợt (12:51:56Z, boot_id `52d799d4…`):** cắt
   attempt7 ở pass 12/20 (xem §1.2). Poller 5 phút của T4 chết theo
   → khởi động lại 13:02:33Z (entry đầu sau reboot; khoảng trống
   12:51:24Z → 13:02:33Z trong poll-t4.log). T10 poller cũng chết
   (poll cuối #15 12:49:51Z) — T10 tự khởi động lại (ngoài phạm vi
   T4). Mù #36 (mở từ probe #36 08:42:46Z) nhiều khả năng chứa thêm
   #54/#55 — chờ T6/user quyết (T4 không đụng bookkeeping mù).
2. **Replay #54 tới muộn (+47'14"):** khác hẳn #52 (+6'28") và #48
   (+40s). T4 chỉ poll được gate 0 sau khi replay tới (11:43:26Z).
   Ngược lại replay #55 tới NHANH (bracket (0'42", 2'46"]) — nhịp
   replay thất thường giữa các boot (47 phút vs 42 giây) là nợ hạ
   tầng đứng (T7 đã DONE; parent quyết repair policy đợt 117 §13
   mục 9 — T4 không chạy --repair, chỉ check-only).
3. **Tải cao + RAM sụt đầu/giữa đợt:** load1 đỉnh 61,52 (attempt4,
   T3 dial s79r2 56 hog); RAM đáy 381 MB (attempt3, gate A poll) và
   286 MB (attempt7, sampler giữa lượt, biên reboot). Về cuối đợt máy
   yên (load1 0,38–1,70, RAM 1157–4571 MB) — cửa yên mở 12:47Z (T5)
   rồi 12:51Z (T4
   attempt7, chết theo reboot) rồi 13:03Z (T4 attempt8, thành công).
4. **Lock v2 đổi spec giữa đợt (T1):** lock script md5 8b02ddc8 →
   5cac10af trước attempt1; T4 ghi lại trước mỗi attempt (luôn
   5cac10af sau đó). T3 từng báo "KHÔNG NHẢ — owner hiện tại là '?',
   không phải 't3-round118'" khi nhả lock sau s79r2 (12:31:19Z) —
   lock cuối cùng vẫn trống đúng (T4 kiểm 12:32:02Z: TRỐNG) nên
   không kẹt; ghi nhận để T1 xem lại thông báo owner '?' (có thể là
   stale-aging đã nhả trước — không ảnh hưởng lượt đo).
5. **Browser.close() treo ~2 phút sau attempt8** (JSON đã ghi xong
   13:05:08Z, inner-end 13:07:04Z): lock nhả muộn ~2 phút, không ảnh
   hưởng số đo. T5 đóng nhanh (giữ lock 84 s cả lượt) — khác biệt
   đáng ghi nhận, chưa rõ nguyên nhân (có thể renderer chậm thoát
   sau lượt đo dài).
6. **Trùng cửa yên T4/T5:** cả 2 cùng chờ 1 cửa yên; T5 mở trước 2
   giây ở attempt6/T5-poll-17 (12:47:26Z vs T4-poll-9 12:47:28Z).
   FIFO qua lock v2 phân xử đúng (T5 đo trước 84 s, T4 đo sau).
   T5 đã chờ T4 15 phút trước khi tự chạy — phối hợp tốt.
7. **Dương tính giả đếm apt:** run-t4.sh gate0 try 1 attempt1 ghi
   apt_procs=1 (shell wrapper replay pid 865 còn sót, cmdline chứa
   "os-intent") trong khi gate0-wait đếm 0 (grep hẹp hơn) — try 2
   sau 60 s đã về 0 (wrapper đã thoát). Cùng mẫu T5 đợt 117 §4.7 đã
   ghi; không ảnh hưởng kết quả (gate 0 vẫn ĐẠT qua try 2 + poll
   gate0-wait).

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND118_T4_WEBKIT60MS_LIMITS.md` — file này. **File
  duy nhất trong repo mà T4 thay đổi** (probe copy + analyzer + dữ
  liệu + run script đều ở hidden_files; fixture mp4 là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round118-t4-webkit60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round118-t4/`
  (prereg-t4.md [viết trước khi đo],
  probe118t4-ghost-k7.webkit.mjs [copy S5, md5 `6603d8fa…`,
  node --check OK], analyze-t4-{tickcost,labellag,skiplatest,
  wallbands,lag5}.py [copy S5 đổi tên, md5 khớp bản S5],
  analyze-t4-dryrun-{tickcost,wallbands}.txt [dry-run trên JSON S5
  attempt3, tái tạo đúng median 49,5 / p90 75,0 / wallbands S5 §1.4,
  diff sạch với dry-run T5 đợt 117],
  b.json [copy S5, md5 `078938cf…`],
  vite.t4-temp.config.mjs [copy S5, HMR tắt, watch.ignored 0 watch],
  run-t4.sh [adapt từ run-t5.sh: thread t4, port 5187, gate A kiểm
  md5 cây trực tiếp == 03bf029f + cờ round118-tree không EDITING],
  t4-attempt-inner.sh, check-classb-t4.sh [lớp B gồm B5],
  gate0-wait-t4.sh + gate0-wait-t4.log [poll cờ T7 + check-only
  riêng, 45 phút; GATE 0 ĐẠT poll #2 cho #54],
  gate0-poll-t4.sh [bản adapt T5, không dùng — gate0-wait thay thế],
  poll-t4.sh + poll-t4.log [mẫu 5 phút + gate0/gateA; poller chết
  theo reboot #55, khởi động lại 13:02:33Z],
  poll-t4.nohup.log, poll-t4-restart1.nohup.log,
  chain-t4.log, postboot-t4-gate0wait-{1,2}.log [cả 2 PASS],
  postboot-t4-attempt{1..8}-gate0.log [attempt1 try1 apt=1 giả
  (xem §6.7), còn lại PASS],
  postboot-t4-boot55-try1.log [PASS cho boot #55],
  run-t4-attempt{1..8}.nohup.log,
  preview-b-f3-flip-webkit-t4-attempt7.json [PARTIAL 12/20 pass,
  n=344, median DỞ DANG 44,0 — KHÔNG dùng chốt ngưỡng],
  preview-b-f3-flip-webkit-t4-attempt8.json [ĐẦY ĐỦ 20/20 pass,
  n=644, median 40,0 — lượt yên dùng chốt ngưỡng],
  load-mid-t4-attempt{7,8}.log [sampler 20 s],
  ps-before-t4-attempt{7,8}.txt + ps-after-t4-attempt8.txt
  [ps-after attempt7 KHÔNG CÓ — chết theo reboot],
  classb-t4-attempt{7,8}.txt [a7: B2+B3+B5 VI PHẠM; a8: 5/5 ĐẠT],
  analyze-t4-attempt{7-partial,8}-{tickcost,wallbands,labellag,
  skiplatest,lag5}.txt [a7: chỉ tickcost/wallbands có nghĩa;
  (b)/F6' trên partial không đủ mẫu; a8: đầy đủ],
  marker-t4-attempt{7,8}, vite-5187-t4-attempt{7,8}.log,
  run-webkit-t4-attempt{7,8}.log,
  tsc-t4.log [exit 0], ghostblend-t4.log [15/15 PASS]).
  JSON lượt đo: attempt8 đầy đủ (20/20) + attempt7 partial (12/20).
- Cờ xong: `hidden_files/round118-t4.done` (kèm verdict 1 dòng).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — lượt yên theo dõi attempt8 ĐẠT
   (median 40,0, lớp B 5/5). Nợ lượt yên theo dõi ĐỢT 118 ĐÃ ĐÓNG.**
   Không mở lại, không siết (dù median 40,0 < 45 — cần thêm lượt yên
   độc lập mới siết). Đợt sau chạy lượt yên theo dõi thường kỳ theo
   cùng prereg (gate 0 + lớp A + lớp B gồm B5) trên cây hiện tại.
2. **Stale-ghost event MỚI frame 23 (6 occ, 229 ms, lag max +9f) —
   NỢ CHẨN ĐOÁN MỚI:** đề xuất luồng riêng đợt 119 chẩn đoán cơ chế
   (đối chiếu P4-frame-26: cùng cơ chế giữ frame? vì sao frame 23?
   có liên quan biên pass cuối / tBlend ~70 s?). KHÔNG kết luận hồi
   quy từ 1 event; theo dõi tiếp ở các lượt yên sau (nếu event 23
   tái hiện thì nâng mức). **Bổ sung:** T5 cùng đợt thấy 2 event
   P4-type độc lập (M=35 lag +11f; M=28 lag +9f) — đợt 118 tổng cộng
   3 event P4-type trên lượt yên (frame 35 → 28 → 23).
3. **Reboot #55 + mù #36:** boot #55 (12:51:56Z, 52d799d4) chờ T6
   ghi vào bookkeeping mù #36 (T4 chỉ ghi boot id/time để đối chiếu).
   Replay #55 nhanh (0'42", 2'46"] vs #54 muộn 47' — nhịp replay thất
   thường, nợ hạ tầng đứng (T7 đã DONE trước #55; repair policy
   parent-đã-duyệt không phải chạy vì replay #55 tới nhanh).
4. **Browser.close() treo ~2 phút sau lượt đo dài (attempt8):** ghi
   nhận để luồng sau biết; nếu tái hiện thì xem xét timeout cho
   browser.close() trong probe (không tự sửa probe trong đợt này).
5. **Lock v2 thông báo owner '?' khi T3 nhả lock (12:31:19Z):** T1
   xem lại (có thể stale-aging đã nhả trước) — không ảnh hưởng lượt
   đo, chỉ là thông báo gây nhầm.
6. **Nợ khác đứng yên theo LIMITS gộp đợt 117 §10 + quyết parent
   §13:** E4 lô đo lớn (T9 đợt 118, hướng (a)); H3f sau chẩn đoán
   storeHeldFrame (T2 đợt 118: H3f ĐANG LÀM, S_first=0,3747); điểm
   gãy GIỮ 19,63 (T3 đợt 118 lặp s79); lock v2 đổi spec (T1 đợt 118
   đã làm, md5 5cac10af); ghost seek (T5 đợt 118: attempt2 thành
   công 20/20, probe_exit=0 — số chi tiết xem LIMITS T5); mù #35
   không đóng hoàn toàn + mù #36 mới; B-Q8-1 không đạt (chấp nhận
   race + fallback); birefnet 0 lần; TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi. Reboot
   mới nhất: boot #55 12:51:56Z (gap #54→#55 = 2h03'30").

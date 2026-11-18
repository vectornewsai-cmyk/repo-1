# PHASE9_ROUND116_S5_F6P60MS_LIMITS — F6' WebKit ≤60 ms: lượt yên XÁC NHẬN LẦN 5 — CHỐT ĐƯỢC NGƯỠNG

> Luồng S5, đợt 116, lượt cron 03:35 +07 15/11/2026 (bắt đầu ~20:35Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — push qua API
> như các đợt trước).
> Nợ LIMITS R5 đợt 115 §8.2 (i)(ii)(iii) + LIMITS gộp đợt 114 §10 mục 5:
> 1 lượt yên xác nhận để chốt ngưỡng WebKit ≤60 ms — lần thứ 5, sau 4 lần
> liên tiếp chưa chốt được (N4 tải trôi, P4 P3 chen, Q5 replay apt, R5 RAM
> sụt + target chết ở pass 10).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không đụng
> TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — NGƯỠNG ≤60 ms ĐÃ CÓ LƯỢT YÊN XÁC NHẬN:**
> 1. **Lượt yên hoàn chỉnh, ĐẠT LỚP B (MỚI, gồm B5 RAM-mid) 5/5 mục.**
>    Attempt3 chạy đủ 20/20 pass, probe exit 0, 21:32:42–21:36:02Z, trên
>    cây `03bf029f…` (S2 NO-CHANGE — fix đã hoàn tác, xem §0).
>    **tickCost total median = 49,5 ms, p90 = 75,0 ms, n = 570**
>    (min 29, max 109); median hậu flip+2000ms cũng 49,5 ms.
>    Theo quy tắc quyết định đã đăng ký trước trong prereg-s5
>    (median ≤60 ms trên lượt đạt lớp B): **GIỮ ngưỡng WebKit ≤60 ms,
>    nay ĐÃ CÓ lượt yên xác nhận — nợ 5 lượt đã đóng.**
> 2. **(b) unique-match: nomatch 0, lag ≥+5f: 0** (cả 2 skp). Chỉ có 2
>    occurrence (c2) lệch thật lag +1f (seq 214, 328) — không phải
>    stale-ghost.
> 3. **Bar F6' (1)/(2): 100,0% / 100,0% (n=71 ≥30) — F6' ĐÓNG**
>    (kiểm lại trên lượt yên này; F6' đã đóng từ L7, S5 không đóng lại
>    mà xác nhận lại).
> 4. **Stale-ghost: KHÔNG tái hiện event nào.** 0 occurrence lag ≥+5f
>    → event P4 frame-26 và event Q5 seq 282–285 đều không xuất hiện
>    trong lượt yên sạch này — cả 2 trông như sự kiện đơn lẻ dưới tải/
>    nhiễm, không phải cấu trúc của cây này (xem §4).
> 5. **Cơ chế mới theo nợ R5 đã chứng minh hoạt động:** ghi JSON tăng
>    dần sau mỗi pass (20/20 lần ghi partial thành công — nếu lượt
>    chết giữa chừng thì dữ liệu các pass đã xong vẫn còn); timeout
>    wall-clock 120 s/pass không phải kích hoạt (mọi pass chỉ ~3,0–
>    3,7 s); điều kiện RAM giữa lượt B5 áp dụng được và ĐẠT
>    (RAM min 658 MB, 0 mẫu <500 MB).

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round116-s5/prereg-s5.md` — viết TRƯỚC mọi
  phép đo (21:03–21:09Z), đăng ký: lớp B mới gồm B5 (RAM giữa lượt
  <500 MB → vi phạm), timeout 120 s/pass + JSON tăng dần, quy tắc
  quyết định ngưỡng, kế hoạch theo dõi stale-ghost 2 event riêng biệt,
  lấy mẫu load1/RAM giữa lượt. S5 tuân thủ đúng prereg — xem §1.
- **Boot trong đợt: boot #48 duy nhất** (`uptime -s` 2026-11-14
  19:43:46Z, boot_id `0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0`) — KHÔNG
  có reboot nào trong lúc S5 làm việc (tới 21:40:51Z vẫn #48; reboot
  tiếp theo dự kiến ~21:43Z theo nhịp ~2h, S5 xong trước đó). Mù #34
  vẫn mở (chứa #47–#48) — S5 không đụng bookkeeping mù.
- **Postboot #48: PASS trước và sau lượt đo.** Check-only lúc 21:09Z
  (try1, exit 0: wrapper K1, libs đủ 5, GST thư mục thật 269 file đủ
  isomp4+libav, apt đủ 11 package — log `postboot-s5-b48-try1.log`),
  gate 0 PASS trước mỗi attempt (postboot exit 0, 0 apt), và kiểm lại
  sau lượt đo lúc 21:40Z → exit 0 (log `postboot-s5-after-attempt3.log`).
  Lưu ý: header script postboot vẫn ghi tham chiếu #47 (số thứ tự
  trong script lạc hậu — nợ cũ đã biết, luồng hạ tầng xử lý).
- **Cây đo `03bf029f…`** (= cây P4/Q5/R5 đo). S2 đợt 116 (H2, zombie
  capture throttle 250ms/clip) EDIT cây từ 21:08:48Z, viết cờ
  `hidden_files/round116-tree` status EDITING ("do NOT run tsc/build/
  probe until FINAL/NO-CHANGE") — S5 CHỜ đúng lệnh task, KHÔNG đo
  trong lúc cây đang đổi (attempt1/2 gate không mở một phần vì cờ
  này). S2 xong 21:31:05Z, verdict BO, **fix đã HOÀN TÁC, md5-final
  `03bf029f…`, status NO-CHANGE** (patch giữ tại
  `hidden_files/round116-s2/s2-throttle-250ms.patch`). Cây attempt3 đo
  = `03bf029f…`, kiểm trước/sau lượt: 03bf029f→03bf029f, KHÔNG ĐỔI.
  S5 không sửa production.
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tái dùng từ round111-m5. Binary
  local-only, KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0, headed qua
  Xvfb (probe tự chọn display trống). Env launch GST như M5/L7/N4/P4/
  Q5/R5.
- **Inotify headroom:** S8 đợt 116 đo — probe headroom dừng ở 969
  watch thêm trước ENOSPC (log `s8-headroom-b48-now.log`), tức
  headroom còn rất thấp. Vite attempt3 chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch), như Q5/P4/R5. Bắt buộc.
- **Vite lock v2-ONLY đợt này** (`apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`, qua `run-attempt s5 5184 1500 30 normal`).
  Lúc S5 bắt đầu: lock TRỐNG, hàng đợi 0 ticket + 1 cooldown cũ của
  R4. Attempt3 acquire 1 lần thành công, nhả sạch sau probe (lock
  TRỐNG lúc kiểm 21:40Z, curl :5184 = 000, không vite/WebKit mồ côi
  của S5). Cooldown: 13 file lúc cuối (các luồng khác nhau nhả lock —
  bình thường, không chặn ai).
- **RAM lúc bắt đầu đợt: ~646 MB (21:03Z)** — dưới ngưỡng ~1 GB.
  RAM dao động mạnh cả đợt (342 → 2440 MB); đỉnh RAM xuất hiện khi
  các browser khác tạm thoát, rồi sụt lại. Xem §1.5.

## 1. Ba lần thử — attempt3 chạy được lượt yên hoàn chỉnh

### 1.1 Attempt1 (21:09:32–21:19:53Z): gate A không mở

Gate 0 ĐẠT (postboot exit 0, 0 apt). Gate A poll 10 lần — KHÔNG mở:

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1 | 1,37 / 1,13 | 658 MB | không / 0 | RAM <1024, cây EDITING |
| 2 | 1,00 / 1,09 | 582 MB | **S4** (port 5560) / 2 | S4 giữ lock |
| 3 | 0,98 / 1,07 | 517 MB | không / 0 | RAM <1024, cây EDITING |
| 4 | 3,46 / 1,70 | 573 MB | không / 0 | load1 vượt, cây EDITING |
| 5 | 4,80 / 2,46 | 960 MB | không / 0 | tải lên, cây EDITING |
| 6–9 | (xem poll-s5.log) | 500–1100 MB | — | load/RAM dao động |
| 10 | 8,10 / 4,86 | 436 MB | **S2** (port 5590) / 1 | S2 giữ lock, tải vọt |

Hết 10 phút gate không mở → exit 5, KHÔNG chạy probe (đúng prereg).
Nguyên nhân: cây EDITING suốt (S2 đang sửa) + RAM <1024 MB phần lớn
thời gian + S4/S2 thay nhau giữ vite lock + load vọt cuối (8,10).

### 1.2 Attempt2 (21:19:53–21:29:53Z): gate A không mở

Gate 0 ĐẠT. Gate A:

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1–3 | 5,81→~1,8 / 4,93→3,37 | 511→1571 MB | S2 (port 5590) lúc đầu | tải cao + cây EDITING |
| 4 | 1,83 / 3,37 | 2440 MB | không / 0 | RAM đủ, load5 >2, cây EDITING |
| 5 | 1,39 / 2,93 | 2184 MB | không / 0 | load5 >2, cây EDITING |
| 6 | 1,14 / 2,58 | 1725 MB | không / 0 | load5 >2, cây EDITING |
| 7–9 | ~1–3 / ~2,5–3,3 | 1400–2100 MB | — | load5 chưa xuống <2 |
| 10 | 3,58 / 3,30 | 1899 MB | **S2** (port 5590) / 3 | S2 giữ lock lại, tải lên |

Hết 10 phút gate không mở → exit 5, KHÔNG chạy probe. Nguyên nhân:
cây EDITING suốt + load5 không xuống dưới 2 (dư chấn pha nặng của
các luồng khác) + S2 giữ lock ở đầu/cuối. RAM đã hồi tốt (tới 2440 MB)
nhưng 2 điều kiện kia chưa đủ.

### 1.3 Attempt3 (21:30:41–21:36:06Z): gate MỞ, lượt yên hoàn chỉnh 20/20 pass

Gate 0 ĐẠT (postboot exit 0, 0 apt, 21:30:42Z). Gate A:

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1 | 1,66 / 2,81 | 2105 MB | không / 0 | load5 >2, cây EDITING |
| 2 | 0,70 / 2,33 | 1919 MB | không / 0 | **S2 DONE 21:31:05Z, cờ NO-CHANGE, md5-final 03bf029f** |
| **3** | **0,40 / 1,94** | **1653 MB** | **không / 0** | **CỬA YÊN MỞ 21:32:42Z** |

`== S5 attempt3 probe-start 2026-11-14T21:32:42Z boot 2026-11-14
19:43:46 load 0.40 1.94 2.47 RAM 1652MB avail preview.tsx 03bf029f
gate_ok=1 tree=S2 H2 DONE — verdict BO … status: NO-CHANGE`.
Vite lock v2 acquire 1 lần thành công ngay (thread=s5, port 5184);
vite lên sau ~2 s.

#### Cửa sổ đo 21:32:42–21:36:02Z — 20/20 pass, mỗi pass ~3,0–3,7 s

- **Pass 1–20 đều xong, probe exit 0:** pass 1: 35 khung rAF
  (3,1 s); pass 2: 35 (3,2 s); pass 3: 33; pass 4: 37; pass 5: 30
  (FLIP rVFC tắt sau pass 5, wallMs=26337 — khớp Q5: flip 26985 ms);
  pass 6: 32; pass 7: 40; pass 8: 39; pass 9: 37; pass 10: 37;
  pass 11: 32; pass 12: 34; pass 13: 37; pass 14: 34; pass 15: 29;
  pass 16: 34; pass 17: 37; pass 18: 35; pass 19: 31; pass 20: 32.
  Tổng 20 pass trong ~3'20" (cả khởi động vite + phân tích cuối).
  Tốc độ này BÌNH THƯỜNG như Q5 (20 pass/87 s phần pass) — không có
  dấu hiệu tick chậm hay kẹt.
- **JSON tăng dần hoạt động (nợ R5 (ii) đã chứng minh):** probe ghi
  partial JSON sau MỖI pass (20/20 lần, log `partial JSON đã ghi:
  N/20 pass (sau pass)`); file cuối là JSON đầy đủ (không còn cờ
  partial), 2.902.998 byte, 20 pass, 570 mẫu tickCost. Timeout
  120 s/pass KHÔNG phải kích hoạt (pass chậm nhất 3,7 s).
- **Load/RAM giữa lượt (sampler 20 s, 10 mẫu):** load1 0,53 → 3,80
  (đỉnh 21:34:04Z) → 1,13; RAM 1422 → 658 MB (đáy cùng lúc 21:34:04Z)
  → 1000–1203 MB. Cú vọt load1 3,80 + sụt RAM 658 MB lúc 21:34:04Z
  trùng với các luồng khác hoạt động (ps-before/after thấy shell
  S10 poller, S9 matrix driver, S3 driver, S6 đang poll gate — chỉ
  là shell/poller nhẹ, KHÔNG có process phân tích nặng nào của luồng
  khác: không python analyzer / tsc / vite / node probe của luồng
  khác trong cửa sổ). Load1 max 3,80 vẫn ≤4 (bar B2) — ĐẠT nhưng
  SÁT bar; ghi rõ, không giấu.
- **Phối hợp với S6:** S6 cũng cần cửa sổ yên và đã chờ S5 ("HET 15
  PHUT CHO S5" trong poll-s6.log — S6 nhường lượt cho S5 trước).
  Trong lúc S5 đo, S6 chỉ poll gate (run-s6.sh attempt1 còn chạy,
  thấy trong ps-before) — không chen lock (lock v2 FIFO: S5 tới
  trước, S6 xếp sau). S5 nhả lock sạch 21:36:02Z để S6 có lượt sau.
- **Dọn dẹp sạch:** vite kill theo pid node thật (kill-vite v2),
  ps sạch, curl :5184 = 000, lock nhả sạch 21:36:06Z. Không có vite
  mồ côi của S5.

#### Lớp B (MỚI, gồm B5) — ĐẠT 5/5 (file `classb-s5-attempt3.txt`)

- **B1 ĐẠT:** load5 lúc kết thúc 1,97 (≤2,5).
- **B2 ĐẠT:** load1 giữa lượt max 3,80 (≤4); ps trước/sau không thấy
  process phân tích nặng của luồng round116 khác trong cửa sổ (chỉ
  shell/poller nhẹ — xem §1.3; S6 poll gate, S9/S3 chạy driver nhẹ).
- **B3 ĐẠT:** không reboot trong lúc đo (boot #48 trước = sau).
- **B4 ĐẠT:** 0 apt/dpkg trong cửa sổ; postboot-check vẫn PASS sau
  lượt (21:40Z, exit 0).
- **B5 ĐẠT (MỚI):** RAM giữa lượt min 658 MB, **0 mẫu <500 MB**
  (10 mẫu: 658–1422 MB). Ghi nhận thêm: 5/10 mẫu RAM <1024 MB
  (cảnh báo, không vi phạm theo prereg).
- **Kết luận lớp B: LƯỢT ĐẠT ĐIỀU KIỆN YÊN** → áp dụng được quy tắc
  quyết định ngưỡng trong prereg-s5.

### 1.4 TickCost — median 49,5 ms (≤60 ms) trên lượt yên đạt lớp B

Analyzer `analyze-s5-tickcost.py` trên JSON attempt3 (log
`analyze-s5-tickcost.txt`):

| Chỉ số | S5 lần 5 (yên, đạt B) | So sánh |
|---|---|---|
| tickCost total n | 570 | Q5: 479 / N1: ~? |
| **median toàn lượt** | **49,5 ms** | L7 40,5 / N1 50,0 / N4 58,0 / P4 61,0 (không đạt B cũ) / Q5 70,0 (không đạt B mới) |
| p90 | 75,0 ms | Q5: 96,0 |
| max / min | 109 / 29 | Q5: 207 / 29 |
| median hậu flip+2000ms (n=412) | 49,5 ms | Q5: 74,0 |
| tBlend gap median / p90 | 93,0 / 117,2 ms (n=465) | N1 92 / N4 96 / P4 101 / Q5 109 |
| BlendTick/pass | 23,3 | Q5: 20,1 |
| rAF/pass median (min–max) | 34 (29–40) | N1 34 / N4 34 / P4 32 / Q5 30 |

Phân rã theo dải wallMs (đăng ký trước, log `analyze-s5-wallbands.txt`):

| Dải wallMs | n | median | p90 | max |
|---|---|---|---|---|
| 0–20k | 82 | 52,0 | 70,9 | 92 |
| 20–32k | 107 | 47,0 | 73,8 | 97 |
| 32–45k | 101 | 46,0 | 77,0 | 109 |
| 45–62k | 145 | 49,0 | 75,6 | 99 |
| 62–70k | 72 | 48,0 | 78,0 | 101 |
| 70–80k | 63 | 52,0 | 65,0 | 74 |

**Đọc:** đường tick PHẲNG cả lượt (46–52 ms mọi dải) — không còn
warm-up chậm như Q5 (52,0 đầu lượt rồi 65–79 giữa lượt), không còn
tăng dần hậu flip (Q5: dải 45–70k median 79,0/79,5). Median toàn lượt
49,5 ≈ N1 50,0 (lượt yên chuẩn) và chỉ hơn L7 40,5 (fixture tuần hoàn
dễ hơn) 9 ms. Biên an toàn tới bar 60 ms là 10,5 ms; p90 75,0 ≤90 ms
(tách khỏi các lượt tải cũ: median tải K7 66,0 / N2 86,0 / N3 167,0).
**Verdict theo prereg-s5: GIỮ ngưỡng WebKit ≤60 ms — ĐÃ CÓ lượt yên
xác nhận (lần 5).** Không siết tiếp xuống ~55 ms chỉ từ 1 lượt (cần
thêm lượt yên độc lập nếu muốn siết — prereg đã đăng ký trước).

### 1.5 RAM/load toàn đợt — RAM vẫn là nút thắt, nhưng lần này đủ cửa sổ

- Poll 5 phút (7 mẫu) + gateA (23 poll): RAM avail 342 → 2440 MB.
  Đáy 342–436 MB lúc 21:18–21:19Z (attempt1 cuối, tải vọt 8,10);
  đỉnh 2105–2440 MB lúc 21:22–21:30Z (sau khi S2 nhả lock lần đầu,
  các browser khác tạm thoát) — chính đỉnh này mở được cửa yên
  attempt3 (gate mở với RAM 1653 MB).
- Load: nhiều cửa sổ yên thật (attempt3 poll 2–3: load1 0,70/0,40,
  load5 2,33/1,94) nhưng load5 thường xuyên >2 do dư chấn các pha
  nặng của S2/S4 (load1 tới 8,10) xen kẽ.
- Kết luận: với 10 luồng song song, cửa yên chỉ mở khi (a) S2 xong
  việc sửa cây, (b) RAM hồi >1 GB, (c) load5 xuống <2 — cả 3 đồng
  thời xảy ra đúng lúc 21:32:42Z. S6 nhường lượt là yếu tố giúp cửa
  sổ không bị chen (xem §1.3).

## 2. Label-at-capture — KHÔNG làm lại (đã đo xong ở N4)

Theo task giao + N4 §2.2 + prereg-s5: label-at-capture theo
currentTime ĐÃ ĐO XONG, KHÔNG đáng làm. S5 không chạy lại mô phỏng,
không đổi production.

## 3. (b) unique-match + F6' — kiểm lại trên lượt yên, ĐẠT

Analyzer `analyze-s5-labellag.py` (lát (b): tick hậu flip+2000ms,
viaRvfc=0; log `analyze-s5-labellag.txt`):

- skp=1: nTick=71, nOccurrence=142, **nomatch 0/142 (0,0%)**,
  lag median 0f, p90 2f, **max +3f, ≥+5f: 0**, âm (lag<0): 3.
- skp=0: nTick=266, nOccurrence=532, **nomatch 0/532 (0,0%)**,
  lag median 1f, p90 3f, **max +4f, ≥+5f: 0**, âm: 72.
- (c) dạng ngờ: skp=1: n=0; skp=0: n=2 — cả 2 đều là (c2) dạng ngờ
  THẬT nhưng lag chỉ +1f: (seq 214, presented 15, label 14) và
  (seq 328, presented 15, label 14). Không phải stale-ghost (lag
  +1f, không đứng yên).
- Kỳ vọng prereg (nomatch 0, max ≤+4f, không lag ≥+5f): **ĐẠT**.

Analyzer `analyze-s5-skiplatest.py` (bar (1)/(2); log
`analyze-s5-skiplatest.txt`):

- n tick skp=1 hậu flip+2000ms: **71 (≥30)**.
- (1) nhãn: tick KHÔNG chứa ghost==presented: **71/71 (100,0%)**,
  vi phạm nhãn 0 tick (bar ≥90%).
- (2) pixel-verified: tick KHÔNG vi phạm thật: **71/71 (100,0%)**
  (bar ≥90%).
- **KẾT LUẬN: F6' ĐÓNG — skipLatest pixel-verified trên WebKit**
  (kiểm lại trên lượt yên này; F6' đã đóng từ L7, S5 xác nhận lại,
  không đóng lại).
- Chẩn đoán label-clean (không phải bar quyết định, ghi để khỏi hiểu
  là đã sạch): skp=1 distinct clean 11/35 (31,4%), per-occurrence
  114/142 (80,3%); skp=0 distinct clean 27/139 (19,4%). Nhãn ghost
  vẫn nhiễu (cấu trúc) như Q5 đã kết luận — muốn nhãn tốt hơn phải
  đổi cơ chế anchor/label, không phải chờ máy yên.

## 4. Stale-ghost — KHÔNG tái hiện event nào trong lượt yên sạch

Analyzer `analyze-s5-lag5.py` (log `analyze-s5-lag5.txt`):
**(b) lag ≥+5f: 0 occurrence, 0 event** (cùng M, tBlend cách <1000ms).

- Event P4 seq 220–223 (frame 26, lag +6..+12f, nhãn chạy 14→20):
  **KHÔNG tái hiện.**
- Event Q5 seq 282–285 (frame 68, lag +68f, label 0, pixels đứng
  yên 327 ms, ghost stale SAU SEEK): **KHÔNG tái hiện.**
- 2 occurrence (c2) duy nhất (seq 214, 328, lag +1f) không thành
  event đứng yên (pixels không đứng yên ≥3 ghost liên tiếp cùng
  1 frame).
- **Đọc:** cả 2 event cũ đều không xuất hiện khi máy yên, tải sạch,
  RAM đủ, cây không đổi. Bằng chứng mạnh rằng chúng là sự kiện đơn
  lẻ dưới tải/nhiễm (P4: P3 chen giữa lượt; Q5: replay apt trong cửa
  sổ đo), không phải hành vi cấu trúc của cây `03bf029f…` khi yên.
  Theo dõi tiếp ở lượt sau nếu có, nhưng không còn là nợ chặn: lượt
  yên xác nhận đã xong, và 2 event không tái hiện trong chính lượt đó.

## 5. Kiểm chứng hồi quy — cây không đổi, PASS

- `tsc` apps/web (`npx tsc --noEmit`): **exit 0** (log `tsc-s5.log`
  trống — sạch).
- `ghostBlend.probe.test.ts`: **15/15 PASS**, chạy bằng
  `node --experimental-strip-types` từ gốc repo như header file hướng
  dẫn (log `ghostblend-s5.log`).
- `vite build`: KHÔNG chạy lại — N1 đã chạy PASS trên cùng cây
  `03bf029f…` đợt 112 (ghi rõ, không hiểu là đã chạy đợt này); S5
  không sửa production (md5 không đổi).
- preview.tsx md5 `03bf029f…` không đổi trong suốt 3 lần thử
  (kiểm trước/sau attempt3: 03bf029f→03bf029f).
- Không sửa file production nào.

## 6. Sự cố hạ tầng trong lúc đo

1. **S2 sửa cây suốt attempt1–2 (21:08:48–21:31:05Z):** S5 chờ cờ
   NO-CHANGE đúng lệnh task — gate không mở trong lúc EDITING dù
   RAM/load có lúc đã đủ (attempt2 poll 4–6: RAM 1725–2440 MB,
   load1 1,14–1,83, chỉ load5 >2 + cây EDITING chặn). Cơ chế cờ cây
   hoạt động đúng; S2 hoàn tác fix về baseline nên cây đo vẫn là
   `03bf029f…` (không phải cây fix `9b724e69…`).
2. **RAM dao động mạnh cả đợt** (342 → 2440 → 658 MB giữa lượt đo).
   Đáy RAM 342 MB lúc 21:19Z trùng tải vọt 8,10 (pha nặng S2/S4).
   Trong lượt đo, RAM sụt 1422→658 MB lúc 21:34:04Z cùng load1 vọt
   3,80 — nhưng không rơi <500 MB nên B5 vẫn ĐẠT; đây chính là
   trường hợp B5 được thiết kế để phân loại (R5 attempt2 sụt xuống
   350–600 MB và chết; S5 sụt tới 658 MB và sống, chạy xong 20 pass).
3. **Load vọt giữa lượt đo (load1 3,80 lúc 21:34:04Z):** sát bar B2
   (≤4). Nguyên nhân: các luồng khác hoạt động (shell S9/S3/S10,
   S6 poll gate) — không có process phân tích nặng nào, nhưng cửa sổ
   không hoàn toàn trống. Ghi rõ để lần sau biết median 49,5 đo được
   trong cửa sổ "yên có nhiễu nhẹ", không phải yên tuyệt đối.
4. **Load vọt 34,38 lúc 21:40:51Z** (sau khi S5 đo xong, lúc viết
   LIMITS) — một luồng khác bắt đầu pha nặng; không ảnh hưởng lượt đo
   của S5 (đã xong 21:36:02Z).
5. **Reboot #49 chưa xảy ra tới lúc S5 kết thúc** (21:40:51Z vẫn boot
   #48; dự kiến ~21:43Z theo nhịp ~2h). S5 xong trước reboot.
6. **Vite lock v2:** S5 acquire 1 lần thành công ngay (attempt3),
   nhả sạch; không có vite mồ côi của S5. Các luồng khác dùng v2
   bình thường (S2/S4 giữ/nhả qua ticket FIFO; S6 xếp hàng sau S5).
   Stale lock: KHÔNG gặp (nợ R5 (iii) — không có lock stale nào cần
   ghi; lock S2/S4 trong lúc S5 chờ đều là lock SỐNG của luồng đang
   chạy, không phải stale sau reboot).
7. **Dương tính giả đếm blocker:** không gặp đợt này (grep đã loại
   trừ shell poll/sleep + run-s5 như R5 đã vá).

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND116_S5_F6P60MS_LIMITS.md` — file này. **File duy
  nhất trong repo mà S5 thay đổi** (probe copy + analyzer + dữ liệu
  đo đều ở hidden_files; mp4 fixture ở `apps/web/public/` là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round116-s5-f6p60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu đo: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round116-s5/`
  (prereg-s5.md [viết trước khi đo], probe116s5-ghost-k7.webkit.mjs
  [copy R5 đã vá: PASS_TIMEOUT_MS=120000 + writePartial sau mỗi
  pass, md5 `6603d8fa…`, node --check OK],
  analyze-s5-{tickcost,labellag,skiplatest,wallbands,lag5}.py [copy R5,
  md5 khớp bản R5], analyze-s5-dryrun-{tickcost,wallbands}.txt
  [dry-run trên JSON Q5, tái tạo đúng median 70,0 / p90 96,0 /
  wallbands Q5 §1.4], analyze-s5-{tickcost,wallbands,labellag,
  skiplatest,lag5}.txt [kết quả trên JSON attempt3],
  b.json [copy R5, md5 `078938cf…`],
  vite.s5-temp.config.mjs [copy R5, HMR tắt, watch.ignored 0 watch],
  run-s5.sh [adapt từ run-r5.sh: lock v2 run-attempt + gate A kiểm
  cờ tree NO-CHANGE/FINAL (không chỉ tồn tại file) + check-classb],
  s5-attempt-inner.sh [chạy trong run-attempt: vite + sampler + probe],
  check-classb-s5.sh [đánh giá lớp B gồm B5 mới],
  poll-s5.sh + poll-s5.log [7 mẫu 5 phút + 23 poll gateA],
  chain-s5.log, postboot-s5-b48-try1.log [PASS 21:09Z],
  postboot-s5-attempt{1,2,3}-gate0.log [check-only trước mỗi lần thử,
  đều PASS trên boot #48], postboot-s5-after-attempt3.log [PASS 21:40Z],
  ps-before/after-s5-attempt3.txt, load-mid-s5-attempt3.log [10 mẫu
  20 s, load1 max 3,80, RAM min 658 MB],
  run-webkit-s5-attempt3.log [20/20 pass + 20 lần ghi partial JSON +
  Y2 pump log], vite-5184-s5-attempt3.log, marker-s5-attempt3,
  classb-s5-attempt3.txt [lớp B ĐẠT 5/5],
  run-s5-attempt{1,2,3}.nohup.log, tsc-s5.log [exit 0],
  ghostblend-s5.log [15/15 PASS],
  preview-b-f3-flip-webkit-s5-attempt3.json [JSON đầy đủ 20 pass,
  2.902.998 byte]).
  JSON + probe/analyzer làm việc KHÔNG stage vào batch push (như tiền
  lệ M5/L7/N4/P4/Q5/R5).
- Cờ xong: `hidden_files/round116-s5-done` (kèm verdict 1 dòng).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: ĐÃ CHỐT (GIỮ) — nợ lượt yên xác nhận
   ĐÃ ĐÓNG sau 5 lần thử (N4, P4, Q5, R5, S5).** Không cần thêm lượt
   yên xác nhận cho ngưỡng này trừ khi cây đổi (preview.tsx md5 đổi)
   hoặc cơ chế tick/blend đổi — khi đó đo lại 1 lượt yên theo cùng
   prereg (gate 0 + lớp A + lớp B gồm B5). Không tự siết xuống ~55 ms
   chỉ từ 1 lượt.
2. **Stale-ghost P4 frame-26 + Q5 seq 282–285: KHÔNG tái hiện trong
   lượt yên sạch — coi là sự kiện đơn lẻ dưới tải/nhiễm, không còn
   là nợ chặn.** Theo dõi thụ động ở lượt đo sau (nếu có lag ≥+5f
   thì trích riêng như prereg), không cần luồng riêng chẩn đoán nữa
   trừ khi tái hiện trong lượt yên.
3. **Quy tắc lớp B mới (B5 RAM-mid <500 MB) + JSON tăng dần +
   timeout 120 s/pass: ĐÃ CHỨNG MINH hoạt động — giữ lại cho mọi
   lượt đo WebKit sau.** B5 phân biệt được "sụt RAM nhưng sống"
   (S5: min 658 MB, chạy xong) với "sụt RAM rồi chết" (R5: 350–600 MB,
   chết pass 10). Partial JSON 20/20 lần ghi thành công.
4. **S6 vẫn cần cửa sổ yên** (S6 đã nhường lượt cho S5 — "HET 15
   PHUT CHO S5"; S6 đo ghost-seek trên cùng cây 03bf029f, cần lượt
   riêng của nó). S5 nhả lock sạch 21:36:02Z; S6 có thể đo sau.
5. **Postboot-check script vẫn ghi tham chiếu #47 trong header**
   (cần cập nhật lên boot hiện tại — luồng hạ tầng; R5 đã ghi nợ này
   từ đợt 115).
6. **Nợ khác đứng yên theo LIMITS gộp đợt 114 §10 + LIMITS R5 §8:**
   G1 + mù #22 + mù #28 + mù #29 + mù #30 + mù #31 + mù #32 chờ user
   quyết; mù #33 ĐÃ ĐÓNG HOÀN TOÀN; mù #34 mới mở (chứa #47–#48) chờ
   user quyết; E4 cần đợt xác nhận tải cao trên cây 03bf029f; ring
   8 MiB cần đo lag push/take trực tiếp; điểm gãy tải cần tích đủ
   tick; birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403
   chờ user; release gate không đổi. Reboot mới nhất: boot #48
   19:43:46Z (gap #47→#48 = 1h57'56"); reboot #49 dự kiến ~21:43Z
   (sau khi S5 kết thúc).

# PHASE9_ROUND139_T4_WEBKIT_QUIET16_LIMITS.md

**Đợt:** 139. **Luồng:** T4 — lượt yên WebKit #16 (giám sát thụ động (c2)
theo DEF v0.5). **Ngày:** 18/11/2026. **Boot:** 541524e2,
btime **13:53:41Z** (đo được — xem F-139-T4-1: brief/marker ghi
14:03:07Z là sai; 14:03:07Z là lúc boot mới được quan sát lần đầu ở
cuối đợt 138, không phải btime). **Cây:** `apps/web/src/preview.tsx`
md5 `530e10a7` (kiểm lúc mở poller 14:42:36Z, sau mỗi attempt, và lúc
đóng 15:21:33Z — không đổi). **Trạng thái:** LƯỢT YÊN #16 HỢP LỆ —
đo được ở attempt3 (20/20 pass, probe_exit=0).

## 0. Verdict tổng (đọc trước)

- **Lượt yên WebKit #16 HỢP LỆ (attempt3, 20/20 pass): tickCost median
  41,0 ms (n=630; hậu flip+2000ms n=457 median 41,0 ms) ≤60 ms;
  lớp B 5/5 ĐẠT; (c2) = 4 occurrence, toàn bộ lag +1f.**
- **P1 ĐÚNG:** 4/4 (c2) gần run-end (run ≥3 tick), baseline 42/372 =
  11,3%, **p = 0,00016** (signed đối chiếu: baseline 41/372, p =
  0,00015 — cùng verdict).
- **P2 ĐÚNG:** 4/4 lag +1f, 0 lag âm.
- **P3-A1 ĐÚNG:** 4/4 đóng băng-tại-tick, baseline 84/371 = 22,6%,
  **p = 0,0026** (lần đầu P3-A1 ĐÚNG kể từ #12; #14 SAI 3/6).
- **P3' ĐÚNG — LẦN ĐẦU ĐƯỢC KIỂM THẬT:** 4/4 seq riêng biệt có
  stall_truoc ≥ 2 (stall 3, 7, 3, 7), baseline 84/371 = 22,6%,
  p ≈ 0,0026. P3' từ prereg thành phép thử có dữ liệu.
- **P4 ĐÚNG:** thuần +1f 4 (2–8), tổng (c2) skp=0 4 (2–12), skp=1 = 0,
  lag ≥+5f = 0.
- **P5 ĐÚNG 4/4:** snap-label median 37 ms (34–52), raw-label median 9
  ms (8–10), label-floor +1 73,1% (63–76%), run ≥3 tick 14 (13–22).
- **P6 trong khoảng cả 3 bin:** bin0 34,5% (33–39), +1/+2 52,2%
  (33–53), +3 6,3% (3–19); đuôi âm 7,0%.
- **P7 ĐÚNG (làm yếu desync):** 4/4 seq (c2) được log phủ; drawSrc
  delta floor(ct×30)−frameIdx chỉ −1/0 (24/24), 0 entry trễ ≥+1f;
  rawUnit−drawSrc gần nhất chênh 0 (48/48 cặp); đối chứng toàn cửa sổ
  post: 0/456 entry trễ ≥+1f.
- **F6' ĐÓNG lần thứ 4 liên tiếp:** 70 tick skippedLatest=1, 100%
  không vi phạm (nhãn + pixel-verified).
- **Cộng dồn MỚI (13 lượt yên hợp lệ):** P1 **32/32**, P2 **23/23**
  occurrence lag ≥+1f (0 âm; +2f vẫn chỉ 1/23 từ #14), P3-A1
  **28/32**, P3' **4/4 (1 lượt)**, P7 **18/18** (quy ước từng seq).
  Chuỗi median tickCost 13 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 /
  54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / **41,0 ms**
  (trung bình 47,7 ms).
- **KHÔNG có điều kiện nào trong ba điều kiện mở lại điều tra (§13
  DEF v0.5) xảy ra** (P1 ĐÚNG; 0 lag âm; +2f = 0 trong lượt). Điều tra
  (c2) **vẫn ĐÓNG** — verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng.
- **Ngưỡng tickCost ≤60 ms: KHÔNG BÀN LẠI** — median #16 = 41,0 ms
  phá chuỗi "ba lượt liên tiếp ≥55 ms" (58,0 → 59,0 → 41,0); không
  có lượt nào vượt 60 ms.
- **Balloon ĐÃ XẢ (câu parent đợt 138(c) được trả lời):** từ
  6.443.824 kB đóng băng lúc mở đợt xuống 5.271.032 kB ngay trước
  poll #1 (−1,17 GB trong <3 phút), rồi xuống 4.560.612 kB lúc
  15:01Z; cửa yên mở chỉ sau 9 poll (~6 phút). **KHÔNG cần can thiệp
  host ở đợt này** — nhưng balloon lại phồng lên sau đó (5.612.000 kB
  lúc 15:09Z, 5.802.084 kB lúc 15:21Z): xả không bền, vẫn cần theo
  dõi (xem §4).
- **Đường tới lượt hợp lệ gập ghềnh:** attempt1 lỗi setup của chính
  tôi (thiếu file probe — F-139-T4-2, 0 pass); attempt1 chạy lại
  18/20 rồi timeout ở pass 19; attempt2 trang wedged sau pass 3
  (3/20); attempt3 20/20. Cả hai partial KHÔNG tính verdict (DEF
  §1) — số của chúng chỉ ghi làm quan sát (xem §6).
- **DEF v0.5, fix 530e10a7, ngưỡng/prereg: KHÔNG ĐỔI.** Không có code
  nào được viết/sửa trong repo ở lượt này (chỉ poll + probe + log);
  preview.tsx không chạm tới. Không push, không release/tag.

## 1. Bối cảnh

- Lượt yên #15 (đợt 138) KHÔNG ĐO ĐƯỢC (0 attempt — balloon đóng băng
  6.443.824 kB, RAMavail phẳng ~500 MB suốt 88 poll sau gate 0 xanh).
  Quyết parent đợt 138: (b) GIỮ NGUYÊN kế hoạch đo lại ở #16;
  (c) GIỮ NGUYÊN ngưỡng gate A ≥1024 MB, chờ balloon tự xả — nếu đợt
  139 vẫn ~500 MB mới xem can thiệp host.
- Đợt 139 mở 14:35:51Z (cron 21:35 +07) trên boot 541524e2. RAMavail
  lúc mở ~547 MB (theo marker đợt). Lúc T4 bắt đầu (14:39:54Z):
  RAMavail 474 MB, balloon 6.443.824 kB — y hệt giá trị đóng băng
  của #15.
- Chốt chặn `round-in-progress.md` TỒN TẠI nhưng đó là marker của
  chính đợt 139 này (mở bởi cron 21:35 +07, "Đợt 139 đang chạy") —
  không phải đợt main-chat đang chạy; T4 tiến hành theo đúng brief
  parent giao. Marker này cũng là nguồn của số btime sai 14:03:07Z
  (xem F-139-T4-1).
- Sửa F-138-T4-2 trước khi chạy: loại trừ
  `vcut-webkit-postboot-check.sh` khỏi mẫu grep blockers trong poller
  (cả 2 pipeline đếm + lưu list) — đã xác minh hiệu quả ở §3.2
  (0 dòng postboot-check trong blockers-list-7).
- Snapshot-trước-đếm-sau (F-137-T4-1): giữ ở mọi poll — mỗi poll chỉ
  chạy `ps` một lần vào `ps-snap-tmp.txt`, đếm blockers từ file đã
  chụp; file tạm chỉ giữ lại khi blockers>0.

## 2. Poller — 9 poll, cửa mở ở poll #9 (14:42:36Z–14:48:38Z)

Poller pid 12666, script `poll-wait-t4-139.sh` (sao từ 138, đổi
deadline 16:30Z + cờ T5 round139-t5 (dự phòng round138-t5 cùng boot)
+ fix F-138-T4-2). Hết việc ở poll #9: cửa yên mở, chạy attempt1
ngay (poller thoát exit 0 sau attempt — xem F-139-T4-6 về việc
attempt2/3 phải chạy tay).

| Poll | Thời gian | RAMavail | load1/load5 | Gate 0 | Ghi chú |
|---|---|---|---|---|---|
| #1 | 14:42:36Z | 1.502 MB | 1,64 / 0,82 | ĐỎ (t5 stale, postboot 0) | Balloon đã xả (xem §4) |
| #2 | 14:43:21Z | 1.327 MB | 1,74 / 0,97 | ĐỎ | |
| #3 | 14:44:07Z | 1.248 MB | 2,47 / 1,29 | ĐỎ | load1 ≥2 |
| #4 | 14:44:52Z | 1.769 MB | 2,38 / 1,44 | ĐỎ | load1 ≥2 |
| #5 | 14:45:37Z | 1.642 MB | 1,86 / 1,43 | ĐỎ | |
| #6 | 14:46:22Z | 1.674 MB | 2,56 / 1,66 | ĐỎ | load1 ≥2 |
| #7 | 14:47:07Z | 2.081 MB | 2,69 / 1,81 | ĐỎ | blockers=3 (T6, xem §3.2); load1 ≥2 |
| #8 | 14:47:53Z | 2.049 MB | 2,46 / 1,90 | ĐỎ | load1 ≥2; T5 viết cờ 14:47:53Z |
| #9 | 14:48:38Z | 1.859 MB | 1,26 / 1,66 | **PASS** | **CỬA YÊN MỞ** — chạy attempt1 |

- RAMavail 9 poll: min 1.248 MB, max 2.081 MB, mean 1.683 MB;
  **≥1024 MB: 9/9**. load1 ≥2 ở 5/9 poll (#3, #4, #6, #7, #8) —
  cửa bị chặn bởi LOAD trong 5 poll, không phải RAM (ngược với #15).
- Gate 0: postboot_exit=0 từ poll #1 (replay apt đã xong trước khi
  T5 mở — cờ T5 ghi "check-only-truc-tiep-replay-da-xong-truoc-khi-
  T5-mo-khong-watcher-khong-luat-C"); apt=0 ở 9/9 poll; dpkg_lines
  1.545 ở 9/9 poll; cây YES md5=530e10a7 9/9; lock=khong 9/9.
  Chỉ thiếu cờ T5 tới poll #9: `round139-t5/POSTBOOT_PASS`
  (`boot_id=541524e2-... btime=2026-11-18T13:53:41Z pass_at=
  2026-11-18T14:47:53Z poll=0`).
- Không reboot trong lượt. Không có poll nào sau #9 (poller thoát
  sau attempt1 theo thiết kế).

### 3.2 Blockers poll #7 — T6 thật, không phải đếm nhầm

- Poll #7 blockers=3 (snapshot đã lưu `blockers-ps-7.txt` +
  `blockers-list-7.txt`): 3 tiến trình của **T6 đang test vite-lock
  v2** (`test-vite-lock-v2.sh` + `vcut-vite-lock-v2.sh acquire tC
  5996`) — đúng là tiến trình vite/lock thật lúc đó, poller đếm
  đúng; cửa đã đóng sẵn do load1 2,69 nên không mất cơ hội đo.
- **Fix F-138-T4-2 đã xác minh:** 0 dòng `postboot-check` trong
  blockers-list-7 — tiến trình `--repair` của T5 (nếu có) sẽ không
  còn bị đếm nhầm nữa.

## 3. Ba attempt: 0 → 18/20 → 3/20 → 20/20

### 3.1 Attempt1 — lỗi setup của T4 (F-139-T4-2), 0 pass, exit 1

- 14:48:38Z–14:48:45Z (~7 s). Vite lên sau 3 s (pid 19933, port
  5187, ready 401 ms); lock v2 giữ 6 s rồi nhả.
- Probe chết ngay: `Error: Cannot find module '.../round139-t4/
  probe121t3-ghost-k7.webkit.mjs'` (MODULE_NOT_FOUND).
- Nguyên nhân: lúc chuẩn bị thư mục round139-t4 tôi chỉ copy
  analyzer + inner + config mà **quên copy chính file probe và
  `b.json`** (cả hai nằm trong round138-t4). Không có dữ liệu nào
  được đo (0 pass, không JSON).
- Khắc phục: copy probe (md5 `70c7bb9a...` khớp bản 138) + `b.json`
  (md5 `078938cf...` khớp), `node --check` probe OK, đối chiếu đủ
  file inner script cần (probe, b.json, vite config, inner) rồi
  chạy lại attempt1. Bằng chứng lần lỗi đã giữ nguyên trong
  `failed-attempt1-evidence/` (run-webkit log MODULE_NOT_FOUND +
  classb + load-mid + vite log); artifact lỗi đã dọn trước khi
  chạy lại để sampler/load-mid không lẫn mẫu cũ.

### 3.2 Attempt1 (chạy lại) — 18/20 pass, timeout ở pass 19, exit 3

- 14:54:12Z–14:59:22Z. Vite lên 3 s; 18 pass chạy mượt (~3,0–3,4 s/
  pass, 29–40 khung rAF/pass); pass 19 treo ở `writePartial
  c2DrawLog` (pwEvalTimeout 30 s, 14:59:18Z) → probe thoát 3, giữ
  partial JSON 18/20 (3.044.301 B).
- Lớp B 5/5 ĐẠT (sampler n=142, load1_max 1,37, RAM min 803 MB,
  0 mẫu <500 MB; 122/142 mẫu <1024 MB — ghi nhận, không vi phạm).
- Số partial (CHỈ quan sát, KHÔNG tính verdict — DEF §1): tickCost
  median 45,0 ms (n=565; hậu flip n=402 median 43,5); (c2) 2
  occurrence (seq 299, 431 — cùng presented 16/label 15/lag +1f);
  P1 2/2 YẾU (baseline 39/330 = 11,8%, p = 0,014); P3-A1 2/2 YẾU
  (baseline 75/329 = 22,8%, p = 0,052); P3' 2/2 (stall 6, 6);
  coverage 2/2; F6' ĐÓNG trên partial (63 tick skp=1, 100%).
  Lưu ý: lag5 analyzer ghi thêm 2 occurrence lag +6f (seq 272/273,
  cùng M=22, 1 event 123 ms) theo cách đếm nearest-match của nó —
  **không phải (c2)** (labellag (c) chỉ có 2 occurrence 299/431),
  không tính vào P2/P4.

### 3.3 Attempt2 — trang wedged sau pass 3, 3/20 pass, exit 3

- 15:01:58Z–15:07:27Z. Pass 1–3 bình thường (2,9–3,3 s/pass);
  sau pass 3, `writePartial-tickCost` bắt đầu timeout, partial
  3/20 ghi lúc 15:03:51Z; play pass 4 treo >110 s (timeout 120 s),
  rồi `writePartial-c2DrawLog` timeout 30 s → probe thoát 3, giữ
  partial JSON 3/20 (421.627 B).
- **Không phải tải host/RAM:** load 0,16–0,67 suốt attempt; sampler
  n=161, RAM min 869 MB, 0 mẫu <500 MB; lớp B 5/5 ĐẠT. Trang
  WebKit tự nó ì (page.evaluate không phản hồi) — cùng họ lỗi với
  attempt1-chạy-lại (writePartial timeout) nhưng xảy ra sớm hơn
  nhiều. Không có flip (flip sau pass 5) nên không có tick post
  nào, không có (c2) nào để đếm.
- Mỗi attempt là page + vite mới hoàn toàn nên wedged không mang
  sang attempt sau (vite đã kill sạch, lock đã nhả, 0 process sót
  sau mỗi attempt).

### 3.4 Attempt3 — 20/20 pass, LƯỢT HỢP LỆ, exit 0

- 15:09:xxZ–15:13:14Z. 20/20 pass (pass cuối 15:11:11Z, wall
  2.630 ms); probe_exit=0; JSON 3.419.247 B
  (`preview-b-f3-flip-webkit-t4-attempt3.json`, passes=20, engine
  webkit 27.2, pageErrs=[]); flip afterPass=5 wallMs=27080.
- Lớp B 5/5 ĐẠT (sampler n=100, load1_max 1,69, RAM min 762 MB,
  max 1.292 MB, 0 mẫu <500 MB, 41/100 mẫu <1024 MB; load5 cuối
  0,65; không reboot; không apt/dpkg).
- Coverage-check ngay: **4/4 (c2) được log phủ** (seq 184/284/363/
  446, delta −23/+30/+34/−24 ms); blendTick hậu-flip trong
  ±500 ms của log: 372/372 (100,0%). Không có marker COVERAGE-0.

## 4. Balloon đã xả — trả lời câu parent đợt 138(c)

| Thời điểm | Balloon | RAMavail | Ghi chú |
|---|---|---|---|
| 14:39:54Z (T4 bắt đầu) | 6.443.824 kB | 474 MB | Y hệt giá trị đóng băng #15 |
| 14:42:36Z (poll #1) | 5.271.032 kB | 1.502 MB | **−1.172.792 kB (~−1,12 GiB) trong <3 phút** |
| 14:52:53Z | 5.462.112 kB | 1.226 MB | Phồng lại nhẹ (+191 MB) |
| 14:53:35Z | 5.572.744 kB | 1.220 MB | |
| 15:01:34Z | 4.560.612 kB | 2.208 MB | **Xả lần 2: −1.012.132 kB so với 14:53** |
| 15:09:25Z | 5.612.000 kB | 1.168 MB | Phồng lại (+1,05 GB) |
| 15:21:33Z (đóng) | 5.802.084 kB | 996 MB | Vẫn dưới mức đóng băng 6,44 GB |

- **Kết luận cho parent: balloon ĐÃ tự xả hai lần (~1,1 GB mỗi
  lần) trong đợt 139; cửa yên mở sau ~6 phút chờ; KHÔNG cần can
  thiệp host ở đợt này.** Nhưng xả KHÔNG bền: balloon phồng lại
  ~1 GB trong vòng 8 phút (15:01→15:09Z). RAMavail dao động
  474 → 2.208 MB trong đợt. Nếu đợt sau lại kẹt ~500 MB thì đây
  là mẫu "xả–phồng" lặp lại, không phải đóng băng vĩnh viễn.
- Ngưỡng gate A ≥1024 MB GIỮ NGUYÊN (quyết parent) — và đã đủ:
  RAM poll 9/9 ≥1024, RAM giữa attempt3 (sampler) min 762 MB.

## 5. Load/RAM theo TỪNG PASS — attempt3 (quyết parent đợt 137 §12.3(c))

| Pass | tick n | median | p90 | wall | load1 (mean) | RAM mean |
|---|---|---|---|---|---|---|
| 1 | 29 | 43,0 | 65,0 | 3.335 ms | 0,38 | 804 MB |
| 2 | 32 | 47,5 | 68,3 | 3.111 ms | 0,74 | 815 MB |
| 3 | 32 | 51,5 | 68,8 | 3.370 ms | 0,96 | 804 MB |
| 4 | 35 | 42,0 | 68,8 | 3.490 ms | 1,69 | 974 MB |
| 5 | 27 | 47,0 | 76,6 | 3.172 ms | 1,60 | 978 MB |
| 6 | 29 | 41,0 | 71,2 | 2.972 ms | 1,55 | 976 MB |
| 7 | 35 | 39,0 | 57,2 | 3.382 ms | 1,43 | 952 MB |
| 8 | 31 | 44,0 | 64,0 | 2.964 ms | 1,40 | 932 MB |
| 9 | 29 | 37,0 | 59,0 | 3.103 ms | 1,39 | 944 MB |
| 10 | 30 | 41,5 | 64,6 | 2.980 ms | 1,44 | 942 MB |
| 11 | 31 | 41,0 | 69,0 | 3.095 ms | 1,47 | 884 MB |
| 12 | 35 | 38,0 | 58,0 | 3.127 ms | 1,49 | 858 MB |
| 13 | 30 | 38,5 | 61,0 | 3.167 ms | 1,45 | 872 MB |
| 14 | 36 | 41,5 | 63,5 | 3.250 ms | 1,42 | 835 MB |
| 15 | 32 | 39,0 | 56,0 | 2.974 ms | 1,41 | 830 MB |
| 16 | 34 | 45,0 | 65,1 | 3.148 ms | 1,38 | 836 MB |
| 17 | 31 | 46,0 | 72,0 | 3.261 ms | 1,31 | 826 MB |
| 18 | 35 | 43,0 | 64,6 | 3.159 ms | 1,31 | 816 MB |
| 19 | 29 | 49,0 | 69,4 | 3.001 ms | 1,33 | 798 MB |
| 20 | 27 | 42,0 | 59,0 | 2.630 ms | 1,62 | 795 MB |

- Tương quan Pearson (20 pass): median~load1_mean **r = −0,38**;
  median~RAM_mean **r = −0,37** — đều ÂM và yếu. Không có bằng
  chứng "tải cao → median cao" trong lượt này; nếu có chiều thì
  ngược lại.
- **So với lượt chậm #13/#14 (median 58,0/59,0 ms):** lượt #16
  nhanh hơn hẳn (41,0 ms) trong khi tải giữa lượt KHÔNG nhẹ hơn
  theo chiều giải thích được — RAM giữa pass #16 chỉ 795–978 MB
  (thấp hơn #14: 1.056–1.531 MB), load1 giữa pass 0,38–1,69 (chồng
  lấn dải #14: 0,61–2,55). Dao động median 58→59→41 xảy ra mà
  không có dao động tải tương ứng → **giả thuyết "tải song song
  gây median cao" ở #13/#14 bị yếu đi** (chưa bác bỏ — chỉ 1 lượt
  nhanh; cần thêm lượt để kết luận).
- Wallbands (attempt3): 0–20k median 47,0; 20–32k 43,0; 32–45k
  40,0; 45–62k 39,5; 62–70k 42,0; 70–80k 43,0 ms — không có band
  nào vượt 50 ms.

## 6. P1–P7 + P3' theo DEF v0.5 — attempt3 (lượt hợp lệ #16)

Tick post: n=372 (viaRvfc=0, tBlend ≥ flip+2000ms). (c2) = 4
occurrence, toàn bộ skp=0, lag +1f:

| seq | presented | label | lag | stall_truoc | Dạng P3' |
|---|---|---|---|---|---|
| 184 | 13 | 12 | +1f | 3 | (a) đóng băng-tại-tick |
| 284 | 15 | 14 | +1f | 7 | (a) đóng băng-tại-tick |
| 363 | 13 | 12 | +1f | 3 | (a) đóng băng-tại-tick |
| 446 | 16 | 15 | +1f | 7 | (a) đóng băng-tại-tick |

| Tiêu chí | Kết quả #16 | Verdict |
|---|---|---|
| Lượt hợp lệ (20/20 + lớp B 5/5 + median ≤60 ms) | 20/20, B 5/5, median 41,0 ms | **HỢP LỆ** |
| P1 (c2) gắn run-end (run ≥3) | 4/4 gần run-end; baseline 42/372 = 11,3%; p = 0,00016 (signed: 41/372, p = 0,00015) | **ĐÚNG** |
| P2 (lag ≥ +1f, 0 lag âm) | 4/4 lag +1f, 0 âm | **ĐÚNG** |
| P3-A1 (đóng băng-tại-tick) | 4/4; baseline 84/371 = 22,6%; p = 0,0026 | **ĐÚNG** |
| P3' stall-based (prereg) | 4/4 seq stall ≥2 (3,7,3,7); baseline 22,6%; p ≈ 0,0026 | **ĐÚNG (lần đầu kiểm thật)** |
| P4 (số lượng) | thuần +1f 4 (2–8); tổng 4 (2–12); skp=1 0; lag ≥+5f 0 | **ĐÚNG** |
| P5 (số phụ) | snap 37 ms (34–52); raw 9 ms (8–10); label-floor +1 73,1% (63–76%); run ≥3: 14 (13–22) | **ĐÚNG 4/4** |
| P6 (histogram) | bin0 34,5% (33–39); +1/+2 52,2% (33–53); +3 6,3% (3–19) | Trong khoảng cả 3 bin |
| P7 (log draw phủ) | 4/4 phủ; drawSrc delta −1/0 (24/24), 0 trễ ≥+1f; rawUnit chênh 0 (48/48) | **ĐÚNG** |
| F6' (skippedLatest) | 70 tick skp=1, 100% không vi phạm | **ĐÓNG lần 4 liên tiếp** |

- Chi tiết P1: cả 4 seq (c2) đều ở run-end hoặc sát run-end
  (184 cách run-end 183 đúng 1 tick; 284, 363, 446 đúng bằng
  run-end). Baseline thấp (11,3%) vì chỉ 14 run ≥3 tick trong
  372 tick post — phép thử có lực mạnh ở lượt này (p nhỏ dù
  n=4).
- Chi tiết P3': cả 4 seq đều dạng (a) — chuỗi đóng băng nhãn kéo
  dài qua tick (c2) (labelMs 34171/47633/58278/68991); không có
  dạng (b) bắt kịp nào ở lượt này. Độ nhạy ngưỡng (chỉ báo cáo):
  stall ≥3 → 4/4 (baseline ≈ 12–13%); stall ≥4 → 2/4
  (seq 284, 446 stall 7) — vẫn trên 2/3 nhưng p sẽ lớn hơn;
  không đổi verdict (ngưỡng chuẩn là ≥2).
- Chi tiết P7: log c2DrawLog n=1221 (loop 1–20 đủ, 19 wrap, span
  10.166→78.598 ms); tại 4 seq (c2): 20/28/20/28 entry trong
  ±500 ms (drawSrc 10/14/10/14, rawUnit 10/14/10/14). Đối chứng
  toàn cửa sổ post: drawSrc delta chỉ −1 (303) / 0 (153),
  0/456 trễ ≥+1f.
- Chi tiết P5/P6 (histogram, nGhost=744, nomatch=0, srcKind
  canvas 744): hist chi tiết {-14: 2, -10: 2, -8: 2, -1: 46,
  0: 257, +1: 190, +2: 198, +3: 47}; đuôi âm 7,0% (52/744) —
  thấp hơn #14 (13,7%); đuôi +3 6,3% — thấp hơn #14 (16,2%).
  Cả hai đuôi cùng giảm khi median tickCost giảm (59,0 → 41,0 ms),
  cùng chiều với quan sát ở DEF §9 (đuôi tăng cùng chiều tickCost).
- **Ba điều kiện mở lại điều tra (DEF §13):** (1) P1 gãy — KHÔNG
  (P1 ĐÚNG); (2) lag âm — KHÔNG (0); (3) +2f ≥3 — KHÔNG (+2f = 0).
  **Không điều kiện nào xảy ra; điều tra (c2) vẫn ĐÓNG.**
- Cộng dồn sau lượt này: P1 32/32, P2 23/23 occurrence, P3-A1
  28/32 (87,5%), P3' 4/4 (1 lượt), P7 18/18 (từng seq), F6' đóng
  4 lần liên tiếp. Tỉ lệ (c2)/tick post #16: 4/372 = 1,08% (trong
  dải các lượt trước: #13 0,33%, #14 2,03%).

## 7. Sai số F-139-T4-1..8

- **F-139-T4-1 — btime trong brief/marker sai 9,5 phút.** Brief và
  `round-in-progress.md` ghi boot 541524e2 btime 14:03:07Z; đo
  được từ `/proc/stat` + `uptime -s` + poller: **btime =
  13:53:41Z** (uptime 46 phút lúc 14:40Z khớp). 14:03:07Z thực ra
  là lúc boot mới được quan sát lần đầu ở cuối đợt 138 (sau reboot
  14:01Z), không phải btime. Mọi mốc trong LIMITS này dùng btime
  đo được 13:53:41Z. Ảnh hưởng: không — chỉ là số ghi chép; T5
  đã ghi đúng btime 13:53:41Z trong cờ POSTBOOT_PASS của nó.
- **F-139-T4-2 — Setup thiếu file: probe + b.json không copy sang
  round139-t4.** Attempt1 chết sau 6 s vì MODULE_NOT_FOUND (xem
  §3.1). Đã khắc: copy + verify md5 + `node --check`, chạy lại
  attempt1. Bài học: checklist file trước khi mở poller (probe,
  b.json, vite config, inner, analyzers) — lần sau copy cả thư
  mục rồi mới sửa tên, thay vì copy từng file.
- **F-139-T4-3 — Attempt1 (chạy lại) timeout ở pass 19.**
  `writePartial c2DrawLog` timeout 30 s sau 18 pass mượt → partial
  18/20, exit 3. Không rõ nguyên nhân gốc (page.evaluate treo sau
  ~7 phút chạy); không phải tải host (load 0,55–1,37, RAM min
  803 MB). Ghi nhận làm mẫu lỗi lặp lại (xem F-139-T4-4).
- **F-139-T4-4 — Attempt2 trang wedged sau pass 3.** Play pass 4
  treo >110 s + writePartial timeout → partial 3/20, exit 3; tải
  host/RAM sạch (load 0,16–0,67, RAM min 869 MB). Hai attempt lỗi
  liên tiếp cùng họ "page.evaluate treo" nhưng ở thời điểm khác
  nhau (sau pass 18 vs sau pass 3) — giống treo ngẫu nhiên của
  trang WebKit hơn là lỗi hệ thống. Attempt3 chạy sạch 20/20 trên
  page/vite mới hoàn toàn. Nợ theo dõi: nếu đợt sau lại gặp
  writePartial/play timeout nhiều lần thì cần xem lại probe (vd
  tăng timeout writePartial, hoặc phát hiện treo sớm hơn).
- **F-139-T4-5 — Script P1 của tôi ban đầu đếm SAI run (đã sửa
  trước khi viết LIMITS).** Bản đầu đếm MỌI run (kể cả run 1–2
  tick) làm baseline → baseline #16 92,7%, p = 0,74, verdict SAI
  giả. Phát hiện nhờ kiểm chứng lại #14 bằng cùng script: cho
  279/296 thay vì 66/296 đã công bố. Đọc lại `t3-step2-
  verify137.py` dòng 243–252: T3 chỉ đưa run **dài ≥3 tick** vào
  danh sách run-end cho P1 (docstring dòng 30–31 ghi rõ "curPix
  run dong cung >=3 tick"). Đã sửa script (chỉ run ≥3 cho P1;
  signed-dist cũng sửa y hệt T3). **Bản sửa tái tạo #14 chính xác
  100%:** P1 unsigned baseline 66/296 = 22,3%, 6/6, p ≈ 0,00012
  (đã công bố p ≈ 0,0001); signed 65/296 (đã công bố 65/296);
  P3-A1 3/6, baseline 65/295, p = 0,125 (đã công bố p = 0,125).
  Mọi số P1/P3-A1 trong LIMITS này là số sau sửa, đã kiểm chứng.
  (P3-A1 và P7 không bị ảnh hưởng — logic của chúng đã khớp T3
  ngay từ đầu; P3-A1 #14 tái tạo đúng 3/6.)
- **F-139-T4-6 — Poller chỉ chạy 1 attempt rồi thoát.** Sau
  attempt1 (dù exit 1 hay 3), poller thoát exit 0 theo thiết kế
  cũ; attempt2/3 tôi phải chạy tay (đã kiểm gate trước mỗi lần:
  RAM 2.208 MB/load 0,41 trước attempt2; RAM 1.168 MB/load 0,32/
  không lock trước attempt3). Ghi nhận cho T10: nếu attempt lỗi
  do harness (không phải verdict), poller không tự thử lại —
  đợt này may là cửa vẫn mở và tôi còn trong phiên. Đề xuất xem
  xét (không tự đổi): poller thử lại tối đa 2 lần khi attempt
  exit 3/timeout mà cửa vẫn mở.
- **F-139-T4-7 — Blockers poll #7 là thật (T6), không phải đếm
  nhầm.** Xem §3.2. Fix F-138-T4-2 đã xác minh hiệu quả (0 dòng
  postboot-check trong blockers-list-7).
- **F-139-T4-8 — chain-t4.log có dòng lặp đôi.** `run-attempt`
  dùng `tee` + pipeline khiến nhiều dòng in 2 lần (hành vi có sẵn
  từ các đợt trước, không phải lỗi mới). Đọc log cần dedup; số
  liệu trong LIMITS này đã đối chiếu từ file analyzer riêng
  (không đếm từ chain log).

## 8. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND139_T4_WEBKIT_QUIET16_LIMITS.md`
  (file duy nhất T4 tạo mới trong repo).
- **Script/phân tích mới (trong hidden_files, không stage — file làm
  việc nội bộ):** `analyze-t4-p1p3p7.py` (P1/P3-A1/P7 theo DEF v0.5,
  đã kiểm chứng tái tạo #14 chính xác 100% — dùng lại được cho các
  đợt sau thay vì chờ T3 chạy step2); `poll-wait-t4-139.sh` (kèm
  fix F-138-T4-2); `run-attempt-139.sh`, `t4-attempt-inner.sh`,
  `check-classb-t4.sh`, `vite.t4-temp.config.mjs`,
  `probe121t3-ghost-k7.webkit.mjs`, `b.json`,
  `t4-histogram-with16.py` (+ output `t4-histogram-with16.txt`).
- **Log/evidence (hidden_files/round139-t4/, không stage):**
  `poll-t4.log` (9 poll), `chain-t4.log`,
  `poll-t4.nohup.log`, `run-attempt-139*.nohup.log`,
  `postboot-t4-139-gate0wait-{1,5,9}.log`,
  `blockers-ps-7.txt` + `blockers-list-7.txt`,
  `failed-attempt1-evidence/` (log MODULE_NOT_FOUND),
  `preview-b-f3-flip-webkit-t4-attempt{1,2,3}.json`
  (attempt1 partial 18/20 — 3.044.301 B; attempt2 partial 3/20 —
  421.627 B; attempt3 ĐẦY ĐỦ 20/20 — 3.419.247 B),
  `run-webkit-t4-attempt{1,2,3}.log`,
  `vite-5187-t4-attempt{1,2,3}.log`,
  `load-mid-t4-attempt{1,2,3}.log`,
  `ps-before/after-t4-attempt{1,2,3}.txt`,
  `classb-t4-attempt{1,2,3}.txt`,
  `analyze-t4-attempt{1,2,3}-*.txt` (c2drawlog, labellag,
  skiplatest, lag5, tickcost, wallbands, perpass, stall,
  c2coverage) + `analyze-t4-attempt{1,3}-p1p3p7.txt`,
  `coverage-check-attempt{1,2,3}.txt`
  (attempt2 trống — 0 (c2) vì chưa tới flip),
  `marker-t4-attempt{1,2,3}`, `tree-md5.txt`.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này.
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round139-t4-quiet16.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round139-t4.done` (tạo sau khi viết LIMITS
  này).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 139).

## 9. Chờ quyết / nợ đợt 140

1. **P3' đã có dữ liệu thật đầu tiên (4/4 ĐÚNG)** — prereg đứng vững
   qua lượt kiểm đầu tiên; tiếp tục đếm tự động mỗi lượt yên, không
   cần quyết gì thêm.
2. **Giả thuyết tải–median bị yếu đi** (§5): median 41,0 ms ở tải
   không nhẹ hơn #13/#14. Điều tra tải song song vẫn mở — cần thêm
   lượt (đặc biệt một lượt chậm nữa) mới kết luận; T4 đợt sau tiếp
   tục ghi load1/RAM theo từng pass.
3. **Timeout writePartial/play lặp lại** (attempt1-chạy-lại pass 19,
   attempt2 pass 3–4): nếu đợt sau lại gặp nhiều lần, T10/parent
   xem có cần tăng timeout writePartial hay phát hiện treo sớm hơn
   không (F-139-T4-4). Không tự đổi probe trong đợt này.
4. **Poller thử lại khi attempt lỗi harness** (F-139-T4-6): đề xuất
   T10 xem xét cho poller retry tối đa 2 lần khi exit 3/timeout mà
   cửa vẫn mở — chờ quyết, không tự đổi.
5. **Balloon xả–phồng lặp lại** (§4): đợt này không cần can thiệp
   host; nếu đợt 140 lại kẹt ~500 MB thì parent xem lại quyết
   138(c).
6. **Không có gì khác chờ parent ở lượt này** — lượt #16 hợp lệ,
   mọi phép thử P1–P7 + P3' đều ĐÚNG, điều tra (c2) vẫn đóng.

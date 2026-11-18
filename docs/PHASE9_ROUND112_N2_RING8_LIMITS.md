# PHASE9_ROUND112_N2_RING8_LIMITS.md — N2: Ring 8 MiB — tích đủ bằng chứng Fisher + preload/el1-el2

> Luồng N2, Phase 9 đợt 112 (VCut Studio). Chạy: 2026-11-14 08:45Z –
> 09:24Z (14/11 15:45–16:24 +07). Boot #42 (08:05:10Z) rồi #43
> (08:53:37Z, gap #42→#43 = 48'27" — trong khoảng đã chứng nhận
> [19'07", 3h14'08"], KHÔNG phá sàn). Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> ĐO LƯỜNG thuần túy — KHÔNG sửa file production nào.
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c8 `~/workspace/round96-x1/clips-faststart/c8.mp4`
> (8.182.985 B, 32 s). Postboot-check PASS 08:41Z (boot #42) và 09:06Z
> (boot #43, sau khi chờ apt replay ~13 phút). **Cấm:** TTS 39, birefnet,
> `.github/workflows/*`. Prereg:
> `hidden_files/round112-n2/prereg-n2.md` (viết TRƯỚC khi chạy, ngân sách
> 12 run kế hoạch + tối đa 2 dự phòng — đã dùng 12/12 + 1 run6 chạy lại
> thay run bị reboot giết + 1 lần LOOP lỗi runner 0 case).

## Kết luận chính (TL;DR)

1. **Ring 8 MiB trên c8: 0 splice trong 8/8 run — Fisher ĐẠT, bar prereg
   THỎA.** Gộp: M2R8 0/2 + N2R8 0/6 = **0/8** vs control gộp ring-4MiB
   c8 wall-30s **7/10** (L2-A 2/2 + M2 CTL 1/2 + P0 2/2 + P 1/2 +
   N2CTL 1/2): **Fisher hai phía p=0,0040** (một phía 0,0038). Kiểm
   chéo: vs control cũ 6/8 p=0,0070; vs control hẹp chỉ-play-ngay 4/6
   p=0,015; riêng N2R8 0/6 vs 7/10 p=0,0114 — mọi cách gộp đều <0,05.
   Đây là lần đầu "ring 8 MiB tắt splice trên c8" đạt ngưỡng thống kê
   đặt trước (M2: p=0,1333, n=2).
2. **Tách flood khỏi ring: ĐẠT.** 2 run LOOP ring-8MiB (2 vòng c8, ép
   restart): flood **6,00 / 6,47** — trong dải bogus của M2 (5,49–6,64)
   — + 2 queue2/run (có restart thật) mà vẫn **0 splice**. "Run ít
   flood thì sạch" không còn giải thích được 0/8: run R8 flood cao
   vẫn sạch, trong khi mọi run bogus ring-4MiB đều flood ≥5,49.
3. **Preload-trên-el1 + seek-trên-el2 (fresh-element): KHÔNG ngăn được
   splice (2/2 bogus).** N2EL r1: 16 spliced +4.194.304 (14 pull trên
   qtdemux1 = pipeline của el2, ~1,1 s sau khi queue2 #2 tạo — chính
   scan của el2 splice, dù el2 đạt preloadFull=TRUE sau đó); r2:
   4 spliced trên qtdemux0 (scan của el1, 78 ms sau queue2 #1 —
   splice trước khi swap, pipeline el2 sạch). G6 §8.5c thất bại thêm
   một dạng tổ hợp nữa: splice xảy ra lúc scan của pipeline bất kỳ,
   không chữa được bằng chờ/seek/đổi element sau đó.
4. **Gán el1/el2 tuyệt đối (nợ L2 §7.1): ĐẠT.** elLog mới trong runner
   ghi được cả 2 run N2EL: el1 (src http, t=0,9 s / 0,01 s) → el2
   (src blob, t=11,72 s / 0,36 s), elAtSeek=elAtPlay=el2. Các arm
   không-fresh chỉ có el1 duy nhất (đúng kỳ vọng — không có swap).
5. **Đề xuất production: KHÔNG đổi** (giữ đề xuất M2/L2: không đưa
   chặn set-lại ring thành sửa production; giữ fallback http). Dữ liệu
   mới làm mạnh bằng chứng "ring > file tắt splice" nhưng không mở
   đường production nào mới: shim vẫn LD_PRELOAD không ship được,
   repo vẫn không có API đổi ring của queue2 do WebKit tạo nội bộ,
   và "ring > file" vẫn không có mức cố định phủ được video user.

## 1. Prereg và tuân thủ

- Prereg viết trước mọi probe (`hidden_files/round112-n2/prereg-n2.md`):
  4 arm N2CTL2 / N2R8-6 / N2R8LOOP2 / N2EL2; bar từng arm đăng ký trước
  (Fisher R8, tách flood LOOP, el1/el2 + preload-fresh).
- Thực hiện: 12/12 run kế hoạch hợp lệ (frames > 0 VÀ GST > 0 VÀ pull
  ≥ 100), 0 run vô hiệu theo định nghĩa. Ngoài ra: 1 run N2R8-run6 bị
  reboot #43 giết giữa chừng (917 PULL, 0 spliced, chỉ quan sát 23,4 s
  — KHÔNG tính vào bar; file gốc giữ tên `*-killed-reboot43`, chạy lại
  run6 mới đầy đủ); 1 lần chạy N2R8LOOP lỗi runner (EXIT=1, 0 case —
  xem §6, đã vá và chạy lại đủ 2 run).
- Runner N2 = copy runner M2, đổi: port 8942, Xvfb :198, OUT
  webkit-blob-flaky-112n2-2mib.json, thư mục round112-n2; thêm elLog
  trong page-eval (tag el1/el2 + elAtSeek/elAtPlay); 4 mode mới
  N2CTL/N2R8/N2R8LOOP/N2EL; vá doLoop (xem §6). Runner KHÔNG dùng vite
  (http server + esbuild riêng) nên không đua watcher ENOSPC, không
  cần vite.lock. Xvfb :198 đã kill sau khi xong; không có vite mồ côi
  (không vite nào được khởi động bởi luồng này).
- `media.ts` md5 `2c384ed13703809d5e999311147745e7` — KHÔNG đổi trong suốt
  lượt. Bundle probe chỉ import `apps/web/src/media` nên đường media
  dưới probe giống hệt M2.
- **Cây đổi giữa chừng (N1):** `preview.tsx` md5 đổi c4198206 →
  03bf029f lúc 09:08:07Z do luồng N1 đợt 112 sửa production (đúng
  quyền — chỉ N1 được sửa preview.tsx đợt này). preview.tsx KHÔNG nằm
  trong bundle probe → không ảnh hưởng kết quả đo; các run trước
  09:08Z ghi previewMd5=c4198206, các run sau ghi 03bf029f trong JSON
  env (ghi rõ để khỏi nhầm).

## 2. Bảng quyết định (mọi con số splice từ `n2_recount_112.py`, đọc trực tiếp từ clip)

| Arm | Run | Bogus (spliced pulls, delta) | EXACT / PULL | APUSH floods | queue2 | Frames / finalCt | Verdict |
|---|---|---|---|---|---|---|---|
| N2CTL (J2=4 MiB) | r1 | YES (14, +4.194.304) | 1458 / 1476 | 5,83 | 2 | 685 / 29,09 | Bogus, đủ chữ ký |
| N2CTL | r2 | NO (0) | 1446 / 1448 | 3,26 | 1 | 697 / 29,21 | Sạch |
| N2R8 (ring 8 MiB) | r1 | NO (0) | 1458 / 1460 | 3,36 | 1 | 702 / 29,45 | Sạch |
| N2R8 | r2 | NO (0) | 1462 / 1464 | 3,40 | 1 | 659 / 29,52 | Sạch |
| N2R8 | r3 | NO (0) | 1432 / 1434 | 3,17 | 1 | 546 / 28,88 | Sạch |
| N2R8 | r4 | NO (0) | 1450 / 1452 | 4,40 | 1 | 580 / 29,25 | Sạch, flood cao nhất nhóm R8 |
| N2R8 | r5 | NO (0) | 1448 / 1450 | 3,39 | 1 | 573 / 29,25 | Sạch |
| N2R8 | r6 | NO (0) | 566 / 568 | 2,76 | 1 | 9 / 8,54 | Sạch, mỏng (xem §5.2) |
| N2R8LOOP (ring 8 MiB, loop 2 vòng) | r1 | NO (0) | 1964 / 1969 | 6,00 | 2 | 11 / 5,58 | Sạch, flood cao + restart |
| N2R8LOOP | r2 | NO (0) | 2518 / 2522 | 6,47 | 2 | 19 / 11,92 | Sạch, flood cao + restart |
| N2EL (fresh + preload + seek) | r1 | YES (16, +4.194.304) | 1092 / 1112 | 7,47 | 2 | 5 / 28,67 | Bogus (xem §4) |
| N2EL | r2 | YES (4, +4.194.304) | 1116 / 1120 | 5,54 | 2 | 213 / 32 | Bogus (xem §4) |
| (ngoài bar) N2R8 r6 bị giết | — | 0 splice / 917 pull | 915 / 917 | 3,01 | 1 | — (không có JSON case) | Chỉ quan sát 23,4 s, không tính |

- Gộp ring 8 MiB c8 wall-30s: M2R8 0/2 + N2R8 0/6 = **0/8**.
- Gộp ring 4 MiB c8 wall-30s (cùng protocol): L2-A 2/2 + M2 CTL 1/2 +
  P0 2/2 + P 1/2 + N2CTL 1/2 = **7/10 bogus**.
- Mọi spliced pull trong đợt này đều delta đúng +4.194.304, 0 OTHER,
  0 pull delta khác — quy luật offset=ring giữ tuyệt đối (kể cả
  16 pull của N2EL r1, gồm 2 pull req_off=0).

## 3. Fisher — "ring 8 MiB tắt splice trên c8" ĐẠT ngưỡng prereg

| So sánh (hai phía) | Bảng | p |
|---|---|---|
| **R8 0/8 vs control gộp 7/10 (bar chính)** | [[0,8],[7,3]] | **0,0040** |
| R8 0/8 vs control cũ 6/8 (không tính N2CTL) | [[0,8],[6,2]] | 0,0070 |
| R8 0/8 vs control hẹp chỉ-play-ngay 4/6 | [[0,8],[4,2]] | 0,015 |
| Riêng N2R8 0/6 vs control gộp 7/10 | [[0,6],[7,3]] | 0,0114 |

- Bar prereg (§2): Fisher hai phía p<0,05 VÀ 0 spliced toàn bộ run R8
  gộp — **cả hai điều kiện đều thỏa**. Ngay cả khi chỉ dùng 6 run mới
  của N2 (bỏ 2 run M2), p=0,0114 vẫn <0,05.
- Diễn giải đúng mức: đây là bằng chứng thống kê rằng tỉ lệ bogus
  khác nhau giữa ring-4MiB (7/10) và ring-8MiB (0/8) trên c8 với
  protocol wall-30s — KHÔNG phải chứng minh "ring 8 MiB tắt splice
  với mọi file/mọi điều kiện". Mức 8 MiB chỉ phủ file ≤8 MiB; video
  user lớn hơn vẫn ngoài phạm vi (xem §5.4).
- Tính ổn định: nếu 1 trong 8 run R8 đã bogus thì p vẫn 0,0406
  (tính trước ở prereg) — kết quả 0/8 có biên, không mong manh ở
  đúng ngưỡng.

## 4. Nhiệm vụ 3 — Preload/el1-el2: gán ĐẠT, mitigation KHÔNG ngăn được splice

### 4.1 elLog — gán el1/el2 tuyệt đối (nợ L2 §7.1): ĐẠT

- Cả 2 run N2EL: el1 (src `http`, page t=0,9 s / 0,01 s) → el2 (src
  `blob`, page t=11,72 s / 0,36 s), elAtSeek=el2, elAtPlay=el2,
  elCount=2. Các arm không-fresh (N2CTL/N2R8/N2R8LOOP): el1 duy nhất,
  elAtPlay=el1 — đúng kỳ vọng (không có dropElement/videoFor thêm).
- elLog ghi trong JSON từng case (`elLog[]`, `elAtSeek`, `elAtPlay`,
  `elCount`); runner mới đã stage (xem §7).

### 4.2 N2EL r1 — chính scan của el2 splice (phản-ví-dụ mạnh)

- 16 spliced +4.194.304: 2 pull req_off=0 trên typefind+qtdemux0
  (shim ms 39319, pipeline el1) + 14 pull đủ chữ ký 7 req_off trên
  typefind+qtdemux1 (shim ms 41699–41806, pipeline el2).
- L2Q2 #2 (queue2 của el2) tạo ở shim ms 40635 → burst splice chỉ
  ~1,1 s sau đó, tức lúc scan khởi động pipeline el2 — TRƯỚC khi
  preloadFull đạt được (seek bắt đầu page t=31,09 s; seeked tới sau
  ở page t=49,08 s dù seekedOk=FALSE do chờ 10 s timeout) và TRƯỚC
  seek. `preloadFull=TRUE` (chờ 19.304 ms, readyState 4 + buffered
  phủ ≥31,5 s trên el2) — lần đầu tiên trạng thái "full buffer thật"
  đạt được mà KHÔNG cần play-through — nhưng splice đã xảy ra ở scan
  trước đó nên chờ đủ buffer không cứu được.
- Phụ: 1 error-event ở page t=24,18 s (src http — pipeline el1
  emptied sau khi bị drop); finalCt 28,67 với chỉ 5 frames (decode
  chậm do tải; load1 lúc bắt đầu 0,93 nhưng sóng tải luồng khác xen
  vào). Flood 7,47 — cao nhất đợt này.

### 4.3 N2EL r2 — splice của el1 trước khi swap (pipeline el2 sạch)

- 4 spliced +4.194.304 (req_off 114176/126851 ×2) trên typefind+
  qtdemux0 ở shim ms 10221 — chỉ 78 ms sau khi queue2 #1 tạo (10143),
  tức scan của el1; queue2 #2 (pipeline el2) tạo sau đó (10560) và
  sạch. Seek OK (seeking 20,56 s → seeked 22,56 s, 2,0 s);
  preloadFull=FALSE (chạm trần 20.006 ms — như M2 P/P0, element kẹt
  buffer). Load lúc bắt đầu run bùng tới 51,37 (sóng tải luồng khác),
  mem 962 MB — ghi nhận, không loại trừ tải góp phần.
- Hệ quả: ngay cả khi pipeline el2 sạch, run vẫn bogus theo định nghĩa
  cấp run (≥1 spliced pull trong pull log) vì el1 đã splice trước khi
  swap. Tổ hợp "preload el1 + seek el2" không thể ngăn splice: (a)
  el1 scan trước đã splice (r2); (b) el2 scan sau cũng có thể splice
  (r1). Fisher N2EL 2/2 vs N2CTL 1/2: p=1,0 — không có dấu hiệu giảm.

### 4.4 Tổng kết §8.5c sau N2 (cập nhật bảng M2 §4.4)

| Đọc §8.5c | Kết quả |
|---|---|
| (a) Fetch đủ trước khi element tạo (blob-file) | 2/2 bogus (L2-A) — bác |
| (b) Chờ element full buffer rồi play (P0) | Không đạt được (suspend ~17,5 s); 2/2 bogus — bác |
| (b') Chờ rồi seek (P) | 1/2 bogus = CTL — bác |
| (c) Play-through rồi seek (M2PT) | 2/2 bogus — bác |
| **(d) Preload el1 + seek trên fresh el2 (N2EL)** | **2/2 bogus — bác (mới)** |

## 5. Caveat bắt buộc + vận hành

1. **Phạm vi kết luận Fisher:** chỉ cho c8 (8,2 MB) + protocol
   wall-30s + ring-8MiB vs ring-4MiB. Không suy ra file lớn hơn,
   clip khác, hay browser khác. Control gộp trộn 3 boot (#39/#40/#42
   cho nhóm cũ + #42 cho N2CTL) — N2CTL làm mới trên boot #42 cho
   1/2, khớp M2CTL 1/2, nên trộn boot không làm lệch hướng kết luận;
   nhưng đây vẫn là gộp post-hoc một phần (P0/P là arm preload, giữ
   theo cách gộp của M2 để đối chiếu; control hẹp 4/6 cũng cho
   p=0,015 nên kết luận không phụ thuộc cách gộp).
2. **Run mỏng:** N2R8 r6 chỉ 9 frames, finalCt 8,54 (metadata chậm tới
   page t≈13,6 s do tải lúc bắt đầu load1 3,78→5,28); N2EL r1 chỉ
   5 frames. Cả hai đều HỢP LỆ theo thực hành K2/L2-A/M2 (bằng chứng
   splice là byte đọc trực tiếp; PULL 568 / 1112 ≥ 100, GST 307 KB /
   570 KB > 0). Nếu loại r6 khỏi Fisher thì R8 0/7 vs 7/10 vẫn
   p≈0,007 — kết luận không dựa vào run mỏng.
3. **Loop runs chậm:** N2R8LOOP chỉ xong 1/2 vòng (decode ~0,1–0,3×
   realtime dưới tải + RAM thấp; stalls nhiều; frames 11/19). Loop
   pass=FALSE cả 2 run — nhưng bar LOOP chỉ cần flood + splice, và
   pull log phủ hết wall (last pull ms 128890/125682). Flood cao
   (6,00/6,47) đến từ re-pull do restart + stall, không phải từ
   vòng loop hoàn chỉnh — tách flood vẫn đứng vì flood đo bằng APUSH
   tổng, không phụ thuộc số vòng xong.
4. **Tải máy + reboot:** reboot #43 lúc 08:53:37Z (btime/uptime -s;
   gap #42→#43 = 48'27", không phá sàn) giết run N2R8-r6 giữa chừng
   + Xvfb + node server; run6 đã chạy lại đầy đủ trên boot #43 sau
   postboot PASS 09:06Z (chờ apt replay ~13 phút: lúc 08:5xZ thiếu
   4 plugin good/bad/ugly/x, 107/269 file; 09:06Z đủ 269/269 +
   10 package). Lưu ý thời gian: case N2R8-r5 ghi 08:53:43Z — muộn
   hơn btime #43 6,9 s (khả năng clock/container-restart artifact);
   dữ liệu r5 đầy đủ (last pull 30884 ms, phủ hết wall) còn r6 thì
   cắt ở 23,4 s, nên không verdict nào phụ thuộc vào chênh này.
   Sóng tải luồng khác: N2EL r2 bắt đầu lúc load1 51,37; N2R8 r6
   lúc 3,78→5,28. Các run bogus/sạch phân bố đều qua các mức tải nên
   tải không giải thích được phân tách R8 vs control — nhưng là yếu
   tố nhiễu ghi nhận.
5. **RAM thấp:** khả dụng 772–2241 MB lúc chạy (thấp nhất N2EL r1:
   772 MB). Play-through/decode chậm ở vài run là hệ quả trực tiếp.
6. **Đồng hồ khác nhau:** page-clock vs shim-clock (ms) vs GST-clock
   có gốc khác nhau, KHÔNG so trực tiếp được. Gán pha pull trong §4
   dùng thứ tự tương đối trên cùng đồng hồ shim (L2Q2/L2PLAYBIN ms so
   với ms splice) + mốc elLog trên page-clock chỉ để biết thứ tự
   el1→el2; số "≈page t" trong §4.2 là ước lượng qua mốc PLAYBIN đầu,
   ghi rõ là ước lượng.
7. **PULL_CAP 2000:** không run nào chạm cap trên một instance (PULL
   tối đa 2522/run nhưng chia nhiều instance; mỗi instance < 2000)
   nên "0 splice" không bị cắt cửa sổ. Nhóm R8 last pull ms
   30334–41191 phủ hết wall; nhóm LOOP 125682–128890 phủ hết wall loop.
8. **N1 đổi cây giữa chừng:** preview.tsx 09:08:07Z (c4198206 →
   03bf029f). Không ảnh hưởng probe (bundle chỉ import media.ts),
   nhưng đừng so nhầm md5 khi đối chiếu JSON env giữa các lượt.

## 6. Lỗi runner phát hiện trong lượt (đã sửa, chỉ probe script)

- `doLoop` gốc không xử lý variant `"blob-file"`: tính bundle thành
  `media-pool-bundle-blob-file.js` (không tồn tại) và đặt
  `directBlob=false`. Lần chạy N2R8LOOP đầu tiên EXIT=1 sau 67 s
  (ENOENT ReadStream), 0 case ghi vào JSON — không mất dữ liệu đo
  nào (chưa có run nào chạy). Đã vá doLoop giống doLoad (blob-file
  dùng bundle prod + fetch-first), `node --check` OK, chạy lại đủ
  2 run LOOP. Bài học: mode loop chưa từng chạy với variant blob-file
  trước đợt này (các mode LOOP cũ dùng prod/blob-direct).
- Lần chạy `pkill -f 'Xvfb :198'` sau khi xong đã tự giết chính shell
  exec của nó (pattern trùng command line) — Xvfb vẫn chết đúng như
  ý (kiểm lại: /tmp/.X11-unix chỉ còn X193 của luồng khác), không
  ảnh hưởng gì khác.

## 7. Nợ mở cho đợt sau

1. **Ring 8 MiB — production vẫn bế tắc (giữ đề xuất M2):** Fisher đã
   đạt nhưng 3 rào cản kiến trúc không đổi (shim không ship được;
   repo không có API đổi ring queue2 của WebKit; không có mức cố định
   phủ video user). Hướng duy nhất còn mở là can thiệp WebKit (cần
   quyết riêng, ngoài phạm vi đo).
2. **Cơ chế flood→wrap:** đo trực tiếp lag push/take tại thời điểm
   splice (nợ M2 §9.2) — LOOP đã cho flood cao + restart mà không
   splice, nhưng vẫn chưa đo lag tức thời.
3. **Seek chậm / seek lỗi:** N2EL r1 seek 17,6 s (timeout 10 s rồi mới
   seeked); M2 P seek 4–6 s; M2PT r2 seek lỗi. Seek latency/error là
   vấn đề UX độc lập với splice, cần điều tra riêng.
4. **Nợ đứng yên từ đợt 111 (xem LIMITS gộp đợt 111 §10):** E4 chờ
   quyết — cơ chế mới m1f4; quyết bar CDP; điểm gãy tải cần tích đủ
   tick dưới tải; ngưỡng WebKit ≤60 ms cần 1 lượt yên thật; mù
   #28/#29 + G1 chờ user quyết; postboot-check cập nhật tham chiếu
   lên #43 (header vẫn ghi #42); không sửa lock script khi có
   acquire đang chạy; birefnet 0 lần thành công; TTS 39 CẤM kiểm
   lại; ci-security.yml 403; release gate.

## 8. Batch stage (KHÔNG push)

`phase9-round112-n2-ring8.txt` (4 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_112n2_2mib.mjs` (runner N2: copy
  runner M2, port 8942, Xvfb :198, OUT 112n2; thêm elLog + 4 mode
  N2CTL/N2R8/N2R8LOOP/N2EL + vá doLoop blob-file; 72.785 B — >37.768,
  cần `ENABLE_PRIVSEP=0` khi push)
- `benchmarks/render/n2_recount_112.py` (recount độc lập: copy
  m2_recount_111.py, chỉ đổi đường dẫn; đọc trực tiếp byte clip, kiểm
  delta +1.048.576/+2.097.152/+4.194.304/+8.388.608, đếm APUSH/flood,
  last-pull ms)
- `benchmarks/results/webkit-blob-flaky-112n2-2mib.json` (12 case:
  N2CTL2 N2R8-6 N2R8LOOP2 N2EL2; 53.852 B — >37.768, cần
  `ENABLE_PRIVSEP=0` khi push)
- `docs/PHASE9_ROUND112_N2_RING8_LIMITS.md` (file này)

Không stage binary (`.so` dùng lại của L2 ở `hidden_files/round110-l2/`,
md5 b208e8de). Dữ liệu thô đầy đủ ở `hidden_files/round112-n2/`
(prereg, progress, recount, 5 log chạy, pull/gst/bundle từng run,
xvfb198.log + xvfb198-boot43.log, run6-killed-reboot43). KHÔNG push.

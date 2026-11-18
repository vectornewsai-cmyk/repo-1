# PHASE9_ROUND132_T4_WEBKIT_QUIET10_LIMITS — Lượt yên WebKit #10 KHÔNG CHẠY ĐƯỢC: gate A kẹt RAM balloon 75 poll + reboot giữa lượt

> Luồng T4, đợt 132, lượt cron 00:35 +07 18/11/2026 (bắt đầu ~17:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **KẾT LUẬN ĐỨNG: KHÔNG CÓ LƯỢT YÊN #10 — 0 attempt chạy, 0 phép đo
> tickCost, không verdict ngưỡng, không dữ liệu log draw mới.**
> Nguyên nhân duy nhất: cửa yên (gate A) không mở — RAM khả dụng kẹt
> ~500 MB trong **75 poll gate A trên 2 boot** (max 552 MB, cần
> ≥1024 MB), cộng 1 reboot giữa lượt giết lần chạy thứ 6.
> Probe re-arm log draw PHỦ POST-FLIP đã xong + dry-run PASS — sẵn sàng
> cho đợt 133 (xem §1). Đây là đóng góp chính của luồng này.

## Kết quả chính

1. **Gate 0 boot b379ecd7: ĐẠT ở poll #23 (18:35:08Z, +44 phút)** —
   T5 repair 1 lần cài `gstreamer1.0-gl` (gói duy nhất thiếu), postboot
   PASS, cờ T5 viết 18:35:45Z (poll 49, boot_id khớp). Xem §2.
2. **Gate A boot b379ecd7: KHÔNG MỞ sau 55 poll / 6 lần chạy run-t4.sh
   (18:38–19:33Z)** — load <0,5, lock trống, blockers 0, cây md5 khớp;
   chỉ RAM kẹt 427–552 MB (cần ≥1024 MB). 5 lần thoát exit 5; lần 6
   bị reboot giết ở poll 5. Xem §3.
3. **REBOOT giữa lượt 19:34:15Z — boot b379ecd7 chết trong khung
   (19:33:56Z, 19:34:15Z] (rộng 19 giây)**; boot mới 07da9c50 btime
   19:34:15Z. Lần reboot thứ 6 liên tiếp quanh ranh giới đợt (số thứ
   tự chờ T6 chốt). Không attempt nào đang chạy lúc reboot (đang poll
   gate A) nên không mất dữ liệu đo — nhưng cũng không có verdict nào
   để giữ. Xem §4.
4. **Gate 0 boot mới 07da9c50: ĐẠT ở poll #6 (19:48:04Z, +10 phút)** —
   T5 tự restart watcher b83, cờ viết 19:46:27Z (poll 2, boot_id khớp);
   postboot PASS ngay poll 1 (replay nhanh, dpkg 1545 dòng).
5. **Gate A boot mới: KHÔNG MỞ sau 20 poll / 2 lần chạy (19:49–20:08Z)**
   — RAM 468–544 MB. Tổng cộng **75 poll gate A, RAM max 552 MB**,
   không một poll nào ≥1024 MB. Dừng theo prereg (ngân sách gate A
   60 phút từ poll đầu 18:38Z đã hết; hạn cứng đợt 20:35Z cận kề).
6. **Ngưỡng WebKit ≤60 ms: KHÔNG ĐỔI, KHÔNG VERDICT MỚI** — 8 lượt yên
   xác nhận cũ vẫn đứng (49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 /
   40,0 / 56,0 ms, trung bình 47,9 ms). Lượt #10 CHƯA chạy, không phải
   "không đạt" — không được đọc kết quả này thành median vượt ngưỡng.
7. **Log draw post-flip: KHÔNG CÓ DỮ LIỆU MỚI** — 0/0 (c2) trong cửa sổ
   log (vì không chạy attempt nào). Thiết kế re-arm + script coverage
   đã dry-run PASS trên dữ liệu lượt #9 (tái tạo đúng 0/9 covered).
   T5 pha 2 đối chiếu log draw với seq (c2) KHÔNG CÓ dữ liệu mới để
   làm đợt này — nợ chuyển sang đợt 133.
8. **RAM balloon là blocker duy nhất, quan sát mới:** boot mới cho thấy
   RAM khả dụng 1911 MB lúc 19:35:04Z → 1340 MB lúc 19:38:03Z →
   ~530 MB lúc 19:46Z — balloon phình lại trong ~12 phút sau boot,
   rồi kẹt phẳng ~500 MB. Không process nào trong VM ăn RAM (process
   lớn nhất là hatch daemon 275 MB RSS; load ~0,1–0,3). Đây là hành vi
   host, ngoài tầm T4; T9 theo dõi balloon đứng yên ~6,29 GB (đợt 131).

## 0. Môi trường + prereg + cây

- **Prereg:** `hidden_files/round132-t4/prereg-t4.md` — viết TRƯỚC mọi
  phép đo (17:4xZ), đăng ký: gate 0 + lớp A + lớp B, ngưỡng ≤60 ms,
  protocol S5 tối đa 3 attempt, BẬT log draw + RE-ARM phủ post-flip,
  kiểm cửa sổ log ngay sau attempt đầu, touch cờ `round132-t4-done`
  ngay khi attempt xong + phân tích xong, Xvfb unlink socket sau kill,
  KHÔNG đo lại RAM idle, KHÔNG đo TTS 39, KHÔNG thử birefnet, gate A
  không mở sau 60 phút thì dừng đợt.
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu nhưng là
  marker MỞ ĐỢT 132 do parent tạo (17:35Z), KHÔNG phải đợt main-chat
  — T4 tiến hành bình thường (tiền lệ đợt 130/131).
- **Boot lúc mở đợt 132: b379ecd7-311c-4053-a43f-507d21432ecc, btime
  2026-11-17 17:24:08Z** (boot #80? ad1327ef btime 15:01:30Z CHẾT trong
  (16:07Z, 17:24:08Z] theo marker mở đợt — T4 chỉ ghi nhận, không quan
  sát trực tiếp khung này). Tuổi thọ b379ecd7: ~2h09m48s–2h10m07s
  (chết trong khung (19:33:56Z, 19:34:15Z], xem §4).
- **Cây — KHÔNG ĐỔI trong cả đợt:** preview.tsx md5 `805409f0`,
  media.ts `2c384ed1`, vite.config.ts (apps/web) `ee80d093` — khớp lúc
  gate 0 (cả 2 boot), gate A (mọi poll), và kiểm cuối 20:11Z. Không sửa
  file production nào trong luồng này.
- **Probe re-arm MỚI (không phải probe cũ):** copy từ
  `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` qua bản đợt 131
  md5 `4950f8773ce93743ca9ce22c2b55c27e`; bản adapt đợt 132 md5
  **`70c7bb9a43a74acd91efbe8f2e35e4e6`** (`node --check` OK). Đổi đúng
  3 điểm (xem §1). KHÔNG dùng probe cũ md5 `dccb8f4c…`.
- **WebKit:** chưa chạy probe lần nào đợt này nên không có số phiên bản
  đo mới; lần đo gần nhất vẫn là 27.2 (webkit-2388) đợt 131.
- **Dry-run analyzer TRƯỚC khi đo: PASS 100%.**
  `analyze-t4-{tickcost,labellag,skiplatest,lag5}.py` trên JSON attempt1
  đợt 131 tái tạo đúng median 56,0 / p90 81,0 + (c2)=9 skp=0 (seq 161/
  204/246/267/288/375/397/420/421) + skiplatest F6' 100%/100% + lag5 0.
  Analyzer coverage MỚI `analyze-t4-c2coverage.py` chạy đúng trên JSON
  đợt 131: log max − flip = −10416 ms, 1 epoch, **0/9 (c2) covered**,
  0,0% blendTick hậu-flip trong ±500 ms của log — đúng như kỳ vọng
  (log #9 chỉ phủ pre-flip), chứng tỏ script phát hiện được khoảng
  trống phủ khi có.
- **Lock v2 md5 `cd0c05c1` — bản ĐÚNG** (không dùng tới đợt này vì
  không lần nào vào được probe). Fixture `stripes-nonperiodic.mp4`
  md5 `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  **Vite lock v2-ONLY**, cổng T4 **5187** (không giữ lock lần nào đợt
  này; kiểm cuối: thư mục lock KHÔNG TỒN TẠI).
- **Các luồng đợt 132 khác:** lúc T4 bắt đầu (17:40Z) đã có
  round132-t1/t2/t3/t5/t6/t7/t8/t9 (T1/T2/T6/T7/T9 .done trước 18:10Z;
  T5 .done 18:42:56Z sau khi viết cờ boot cũ). T8 waiter restart trên
  boot mới 19:36:35Z (deadline 20:10Z), chờ cờ T4 + postboot.

## 1. Thiết kế RE-ARM log draw phủ post-flip (xong, chưa được đo thật)

- **Nguyên nhân log #9 dừng ở seq ~42 (tìm hiểu trước khi đo,
  preview.tsx:685–712):** `c2DrawLogPush` chỉ ghi khi `loopNo` 1–2 sau
  wrap đầu tiên kể từ lúc bật cờ; mỗi pass seek về 0 nên `frameIdx`
  giảm = 1 "wrap" → loopNo tăng 1/pass: pass 1 loopNo 0 (không ghi),
  pass 2 loopNo 1 (ghi), pass 3 loopNo 2 (ghi), pass 4 loopNo 3 (dừng
  vĩnh viễn). Flip sau pass 5 → toàn bộ log là tiền-flip (wallMs max
  17223 < flip 27639). Đây là THIẾU SÓT THIẾT KẾ đối với mục đích đối
  chiếu, không phải thiếu dữ liệu đo.
- **Cách sửa — KHÔNG đổi file production:** RE-ARM cờ runtime giữa
  lượt trong probe (tắt rồi bật lại sau các pass 4,7,9,11,13,15,17):
  mỗi lần bật lại reset loopNo=0 + xóa mảng, 2 pass kế tiếp (loopNo
  1–2) lại được ghi. Thứ tự trong vòng pass: writePartial fetch trước
  → tắt cờ (dừng ghi ngay, mảng đóng băng) → fetch vét lần cuối để
  tích lũy epoch vừa xong → bật lại cờ (lần push kế tiếp reset).
  Probe TÍCH LŨY các epoch (dedupe theo khóa
  wallMs|point|frameIdx|loopNo|ct|clipId) vào partial + final JSON thay
  vì giữ-bản-tốt-nhất; final JSON dùng mảng tích lũy (ghi đè
  `y2Logs.c2DrawLog` trước khi tính `c2fin`).
- **Phủ thiết kế:** epoch đầu (bật lúc boot) phủ pass 2–3 (tiền-flip);
  re-arm sau pass 4 phủ pass 6–7 (2 pass hậu-flip đầu tiên); sau pass 7
  phủ 9–10; sau 9 phủ 11–12; sau 11 phủ 13–14; sau 13 phủ 15–16; sau 15
  phủ 17–18; sau 17 phủ 19–20. Tổng **14/15 pass hậu-flip** (chỉ pass 8
  là pass reset không ghi; pass 5 tiền-flip không cần). Kỳ vọng n
  ~800 entry (tiền-flip ~100 + hậu-flip ~700), dưới trần 10.000.
- **Rủi ro đã biết, ghi trước khi đo:** thời điểm reset có thể lệch 1
  pass nếu có push xen giữa lúc playback tạm dừng (push nền giữa 2 lần
  pwEval) — phủ thực tế có thể là 13/15 pass thay vì 14/15; vẫn đủ để
  đối chiếu (c2) (9 event/lượt rải khắp cửa sổ). Kiểm cửa sổ log ngay
  sau attempt đầu bằng `analyze-t4-c2coverage.py` vẫn là bước bắt buộc
  ở đợt 133 (theo prereg §3): nếu log vẫn chỉ phủ pre-flip thì điều
  chỉnh lịch re-arm và chạy attempt tiếp theo trong cùng lượt yên.
- **KHÔNG sửa preview.tsx:** nếu re-arm thất bại ở đợt 133 thì mới
  xem xét sửa instrumentation (nới loopNo / thêm cờ runtime chọn số
  loop tối đa), ghi rõ md5 trước/sau và revert sau khi đo.

## 2. Gate 0 boot b379ecd7 — ĐẠT ở poll #23 (18:35:08Z, +44 phút)

- **Poll #1 (17:51:03Z):** t5flag=chưa-có, t7flag=VANG-T7-DONE
  (`round132-t7.done` mtime ≥ boot), postboot_exit=1 (replay đang
  chạy), aptx=1 (apt-get update pid 814), dpkg_lines=53, load1 2,44,
  RAM 3017 MB, preview_md5=`805409f0`.
- **Replay tiến triển:** dpkg 53 → 444 (17:55Z) → 577 (18:01Z) → 1087
  (18:03Z) → 1219 (18:07Z) → 1403 (18:13Z) → 1490 (18:17Z) → 1529
  (18:19Z) → 1551 (18:21Z, đóng băng). Install xong ~18:19:43Z (gói
  cuối gstreamer1.0-tools); 222 installs — hơn baseline 217.
- **Postboot FAIL dai dẳng sau khi apt về 0 (poll #16–21, 18:21–
  18:31Z):** lý do duy nhất `apt: chưa cài: gstreamer1.0-gl`; còn lại
  PASS hết (wrapper, libs, GST 268 file, isomp4 + libav đủ). Đây là
  hình dạng MỚI: replay chạy đầy đủ (thậm chí hơn baseline) nhưng
  thiếu 1 gói plugin GST — không khớp proxy dạng (A) của watcher T5
  (GST<100) lẫn dạng (B) (replay đã cài). Xem quyết định repair của T5
  (`round132-t5/t5-repair-decision.md`, 18:32:54Z): kiểm chứng độc lập
  5/5, đánh giá điều kiện (4) ĐẠT THEO THỰC CHẤT quyết parent §8.2
  ("tới nhưng thiếu GST" — không gắn ngưỡng file), ghi rõ khoảng trống
  proxy để parent quyết có widen C4 hay không. T5 KHÔNG tự sửa logic
  trigger giữa lượt.
- **Repair:** T5 chạy `--repair` 1 lần có giám sát ~18:33Z (KHÔNG
  --launch-test, như repair boot2 đợt 131): apt chạy lại poll #22
  (18:33:08Z), dpkg 1551 → 1560, postboot PASS ở poll #23 (18:35:08Z).
- **Poll #23 (18:35:08Z): GATE 0 ĐẠT** — T5=chưa-có lúc poll (cờ T5
  viết 18:35:45Z, sau poll 37 giây) + T7=VANG-T7-DONE + check-only
  riêng PASS (exit 0) + apt_procs=0 + dpkg_lines=1560 + load1=0,35 +
  RAMavail=501 MB + preview_md5=`805409f0`. Cờ T5 sau đó đã xác nhận:
  `POSTBOOT_PASS boot_id=b379ecd7-311c-4053-a43f-507d21432ecc
  btime=2026-11-17T17:24:08Z pass_at=2026-11-17T18:35:45Z poll=49`
  (watcher b81, `done_pass_stable_2polls`) — KHỚP boot đang chạy lúc đó.
  Tổng chờ gate 0: 17:51:03Z → 18:35:08Z = **44 phút**.
- run-t4.sh gate 0 try 1 PASS ở mọi lần gọi sau đó (postboot 0, apt 0).

## 3. Gate A boot b379ecd7 — KHÔNG MỞ sau 55 poll (18:38–19:33Z)

- **6 lần chạy run-t4.sh attempt1, đều exit 5** (trừ lần 6 bị reboot
  giết, xem §4). Mỗi lần: gate 0 try 1 PASS ngay, rồi gate A 10 poll
  × 60 s. Tổng 55 poll gate A trên boot này.
- **RAM kẹt phẳng:** 427–552 MB trong toàn bộ 55 poll (max 552 MB ở
  lần 1 poll 5, 18:42Z; min 427 MB ở lần 6 poll 1, 19:29:56Z — poll
  này thuộc boot cũ, trước reboot). Không một poll nào ≥1024 MB.
- **Bảng 8 lần chạy gate A (đo lại từ `poll-t4.log`, 20:17Z):**

  | Lần | Boot | Khung giờ (Z) | Poll | RAM min–max (MB) | RAM<1024 | Tiêu chí khác fail |
  |---|---|---|---|---|---|---|
  | 1 | b379ecd7 | 18:38:05–18:47:06 | 10 | 498–552 | 10/10 | 0 |
  | 2 | b379ecd7 | 18:48:15–18:57:16 | 10 | 486–526 | 10/10 | 0 |
  | 3 | b379ecd7 | 18:58:55–19:07:56 | 10 | 458–524 | 10/10 | 0 |
  | 4 | b379ecd7 | 19:09:04–19:18:05 | 10 | 465–542 | 10/10 | 0 |
  | 5 | b379ecd7 | 19:19:28–19:28:28 | 10 | 429–504 | 10/10 | 0 |
  | 6 | b379ecd7 | 19:29:56–19:33:56 | 5 (reboot giết) | 427–519 | 5/5 | 0 |
  | 7 | 07da9c50 | 19:49:11–19:58:12 | 10 | 473–544 | 10/10 | 0 |
  | 8 | 07da9c50 | 19:59:19–20:08:20 | 10 | 468–529 | 10/10 | 0 |
  | **Tổng** | 2 boot | 18:38–20:08 | **75** | **427–552** | **75/75** | **0** |

- **Tiêu chí gate A nào không đạt — XÁC ĐỊNH ĐƯỢC từ log poll (không
  phải "không xác định được"):** trong cả 75/75 poll, **chỉ duy nhất
  tiêu chí RAM (RAMavail ≥1024 MB) không đạt**; 5 tiêu chí còn lại đều
  đạt mọi poll — load1 max 0,49 (<2), load5 max 0,31 (<2), lock=v2
  trống 75/75, blockers=0 75/75, cây=YES md5=`805409f0` 75/75. Không
  có poll nào mà tiêu chí khác ngoài RAM fail. Kết luận này đọc trực
  tiếp từ các dòng `gateA poll` trong `poll-t4.log` (mỗi dòng ghi đủ
  load1/load5/lock/blockers/RAM/tree), không suy diễn.
- **RAM không hồi dù load ~0,1 và không có process nặng:** process
  lớn nhất trong VM lúc kiểm (18:58Z) là hatch daemon 275 MB RSS;
  `free` báo used 7479/7934 MB nhưng avail chỉ ~455 MB — balloon
  virtio giữ RAM ở host (T9 đợt 131: balloon ~6,29 GB đứng yên).
  KHÔNG hạ ngưỡng, KHÔNG chạy probe khi cửa chưa mở (luật đứng).
- **So sánh lịch sử:** đợt 130 chờ gate A 34 phút rồi mở; đợt 131 mở
  ngay poll 1 (RAM 1178 MB); đợt này 55 phút chờ vẫn không mở — tệ
  nhất từ trước. Balloon đợt này kẹt cứng hơn hẳn (không có đợt hồi
  nào như 482→1772 MB ở đợt 131).

## 4. Reboot giữa lượt 19:34:15Z — boot b379ecd7 chết, boot mới 07da9c50

- **Diễn biến:** lần chạy run-t4.sh thứ 6 đang ở gate A poll 5
  (19:33:56Z, RAM 494 MB) thì VM reboot. T4 phát hiện lúc 19:35:04Z
  (`uptime -s` 19:34:15Z, boot_id mới
  `07da9c50-5836-4481-a4a4-7e22c6260325`).
- **Khung chết của b379ecd7: (19:33:56Z, 19:34:15Z] — rộng 19 giây,**
  một nguồn duy nhất (gate A poll 5 cuối cùng 19:33:56Z + btime boot
  mới 19:34:15Z); không có bản ghi thứ hai mâu thuẫn. Đây là khung
  chết hẹp nhất từ trước tới nay (hẹp hơn khung 25 s của #77? đợt 130
  và khung 84 s của f868abad đợt 131).
- **Tuổi thọ b379ecd7: 2h09m48s–2h10m07s** (btime 17:24:08Z → chết
  trong khung trên). Đây là reboot GIỮA LUỘT lần thứ 5 liên tiếp
  (#75? đợt 129, #77? đợt 130, #78? giữa đóng/mở đợt 131, f868abad
  giữa lượt đợt 131, b379ecd7 giữa lượt đợt 132) — cộng 1 reboot giữa
  đóng đợt 131 / mở đợt 132 (#80?→b379ecd7) thành 6 reboot liên tiếp
  quanh ranh giới đợt. Số thứ tự boot TẠM, chờ T6 chốt mù #37.
- **Thiệt hại:** lần chạy thứ 6 bị giết bằng SIGTERM giữa lúc poll
  gate A (chưa vào probe, chưa giữ lock — kiểm cuối: thư mục
  `vite.lock` KHÔNG TỒN TẠI, không lock sót). Poll loop + gate0
  waiter của T4 chết theo reboot. **Không mất dữ liệu đo nào** (chưa
  có attempt nào chạy). Cờ POSTBOOT_PASS của b379ecd7 (18:35:45Z)
  thành STALE — KHÔNG dùng cho boot mới.
- **Hậu quả với lượt yên:** không có verdict nào để giữ (tiền lệ đợt
  129/130/131 chỉ áp dụng khi attempt + phân tích xong trước reboot).
  T4 quyết định thử lại trên boot mới trong thời gian còn lại của đợt
  (xem §5), thay vì đóng blocked ngay — vì hạn cứng đợt còn ~60 phút
  và RAM boot mới lúc đầu còn cao (1911 MB).

## 5. Boot mới 07da9c50 — gate 0 ĐẠT, gate A vẫn KHÔNG MỞ

- **Boot mới: btime 2026-11-17 19:34:15Z, boot_id
  `07da9c50-5836-4481-a4a4-7e22c6260325`.** Replay RẤT NHANH: dpkg.log
  639 dòng lúc 19:35:56Z → 1536 dòng lúc 19:36:47Z → 1545 dòng
  (đóng băng từ đó); apt-get cài ghostscript lúc kiểm đầu. Postboot
  check-only của T4 PASS ngay poll gate 0 đầu tiên (19:38:03Z).
- **T5 tự restart:** watcher b82 viết cờ 19:43:36Z (poll 2, boot +9m21s)
  NHƯNG ở `round132-t5b/POSTBOOT_PASS` — gate0-wait của T4 chỉ đọc
  `round132-t5/POSTBOOT_PASS` nên cờ này KHÔNG tới được gate (mất ~3
  phút); T5 chạy thêm watcher b83 trong `round132-t5/`: nhánh archive
  v5 KÍCH HOẠT LIVE LẦN ĐẦU (STALE_FLAG_ARCHIVED 19:45:27Z, cờ cũ
  b379ecd7 → POSTBOOT_PASS.stale-b379ecd7), cờ gate-visible viết
  19:46:27Z (poll 2, boot_id KHỚP boot mới, không cần repair — replay
  boot mới đã tự cài gstreamer1.0-gl lúc 19:35:28Z). **Bài học:** brief
  hạ tầng sau reboot cần ghi rõ thư mục cờ gate-visible; gate0-wait
  của T4 nên đọc cả đường cờ dự phòng của T5b ở đợt sau. (T5 .done
  18:42:56Z và T7 .done 17:48:29Z là của boot cũ; việc T5 restart
  watcher sau reboot là hành động mới, ghi nhận nguyên trạng — T5 là
  chủ POSTBOOT, T4 chỉ dùng cờ.) T8 waiter cũng restart 19:36:35Z
  trên boot mới (deadline 20:10Z), chờ cờ T4 + postboot.
- **Gate 0 boot mới: ĐẠT ở poll #6 (19:48:04Z, +10 phút)** — T5=PASS
  + check-only riêng PASS + apt=0 + dpkg 1545 + load1=0,00 +
  RAMavail=536 MB + md5=`805409f0`.
- **Gate A boot mới: KHÔNG MỞ sau 20 poll / 2 lần chạy run-t4.sh
  (19:49–20:08Z)** — RAM 468–544 MB. Mọi điều kiện khác đều tốt mọi
  poll (load1 0,04–0,44, load5 0,17–0,30, lock=không, blockers=0,
  cây=YES). Cả 2 lần thoát exit 5.
- **RAM boot mới tụt nhanh sau boot:** 1911 MB lúc 19:35:04Z → 1340 MB
  lúc 19:38:03Z → ~530 MB lúc 19:46Z → phẳng ~500 MB tới cuối. Balloon
  phình lại trong ~12 phút sau boot. Đây là quan sát mới so với đợt
  131 (RAM hồi mạnh sau replay): lần này balloon KHÔNG nhả RAM sau
  khi replay xong, trên cả 2 boot.
- **Tổng gate A đợt 132: 75 poll (55 boot cũ + 20 boot mới), 8 lần
  chạy run-t4.sh, RAM min 427 / max 552 MB, 0 poll ≥1024 MB.**
  Ngân sách gate A 60 phút (từ poll đầu 18:38:05Z) hết lúc ~19:38Z;
  T4 đã kéo dài thêm 2 lần chạy trên boot mới (tới 20:08Z) vì boot mới
  + cờ T5 mới là tình huống mới, rồi DỪNG theo prereg khi hạn cứng đợt
  (20:35Z) cận kề và không còn đủ thời gian cho probe + phân tích +
  LIMITS nếu cửa mở muộn hơn.

## 6. Vì sao không chạy probe khi RAM ~500 MB (không hạ ngưỡng)

- Ngưỡng gate A RAM ≥1024 MB là luật đứng (prereg §2, tiền lệ đợt 127/
  130): chạy probe khi RAM ~500 MB sẽ cho lượt yên không hợp lệ về
  RAM (lớp B5: RAM giữa lượt <500 MB là vi phạm; RAM đầu lượt ~500 MB
  thì probe WebKit + vite rất dễ đẩy RAM xuống dưới 500 MB giữa lượt,
  như R5 attempt2 đợt 118). Chạy vẫn đo được số, nhưng số đó không
  phải lượt yên hợp lệ — đo để rồi loại còn tệ hơn không đo (tốn
  tài nguyên + gây nhiễu cho các luồng khác).
- Không có cách hợp lệ nào để "mở" RAM từ trong VM: balloon do host
  giữ; không process nào trong VM để kill (lớn nhất 275 MB). Việc duy
  nhất đúng là chờ — và đã chờ 75 poll / ~90 phút tổng (gate 0 + gate
  A) trên 2 boot.

## 7. Kiểm chứng hồi quy + hạ tầng

### 7.1 Cây không đổi trong lúc chờ

- `preview.tsx` md5 `805409f0` không đổi: ghi lúc gate 0 boot cũ
  (17:51Z) = gate A mọi poll = gate 0 boot mới = kiểm cuối (20:11Z).
  `media.ts` md5 `2c384ed1` không đổi. `vite.config.ts` (apps/web)
  md5 `ee80d093` không đổi.
- **`tsc` / `vite build`: KHÔNG chạy** — không sửa cây (chỉ bật cờ
  runtime trong probe, chưa hề chạy probe), verify tsc+build exit 0
  của T5 đợt 130 trên cùng md5 cây vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code production.
- Postboot-check sau lượt: KHÔNG chạy lại — gate 0 try 1 của lần chạy
  cuối đã PASS (exit 0) và không có thay đổi hạ tầng nào sau đó.

### 7.2 Sự cố hạ tầng + vận hành trong lúc chờ

1. **Xvfb:** không chạy probe nên không khởi Xvfb, không socket sót.
2. **RAM host balloon KẸT CỨNG đợt này** (§5–§6): avail ~500 MB phẳng
   75 poll gate A + suốt gate 0 (trừ 2 lần đo cao thoáng qua đầu boot
   mới: 1911 MB 19:35:04Z, 1340 MB 19:38:03Z). Balloon virtio ~6,29 GB
   (T9 đợt 131) — T9 theo dõi tiếp ở đợt 133. Ngưỡng báo user
   (< ~1.800 headroom inotify) không liên quan; RAM không có ngưỡng
   báo user riêng — chỉ luật gate A.
3. **Không kẹt rAF pass-timeout đợt này** — không chạy probe nên không
   có gì để kẹt; HB129 không bắn.
4. **Lịch lệch T4-yên TRƯỚC, T8-harness SAU — T8 KHÔNG CÓ DỮ LIỆU
   ĐỂ CHẠY:** T8 waiter restart trên boot mới (19:36:35Z, deadline
   20:10Z) chờ cờ T4 + postboot. T4 đóng blocked lúc ~20:15Z, SAU
   deadline waiter của T8 — T8 đã hết cửa chờ khi cờ T4 tới. T8 có
   chạy harness O8 hay không là quyết định của T8/parent theo brief
   của T8; T4 ghi rõ ở đây: **KHÔNG CÓ lượt yên #10, KHÔNG CÓ JSON
   attempt nào** — mọi leg phụ thuộc dữ liệu lượt yên đều không có
   đầu vào đợt này. Cờ `round132-t4-done` có nội dung blocked rõ ràng
   (xem §8) để T8/parent không đọc nhầm thành "xong lượt yên".
5. **Postboot FAIL 1 gói trên boot cũ (gstreamer1.0-gl)** — xem §2 +
   quyết định repair của T5. Trên boot mới replay đầy đủ, không thiếu
   gói nào (postboot PASS ngay poll 1, dpkg 1545 dòng).

## 8. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND132_T4_WEBKIT_QUIET10_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe adapt re-arm (md5
  `70c7bb9a…`) + analyzer coverage MỚI + histogram with10 là bản copy
  trong `hidden_files/round132-t4/`, ngoài repo — không stage (theo
  mẫu đợt 131: probe/analyzer của T4 không đưa vào paths).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round132-t4-quiet10.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round132-t4/`
  (prereg-t4.md [viết trước khi đo; §1 đăng ký thiết kế re-arm],
  probe121t3-ghost-k7.webkit.mjs [md5 `70c7bb9a…`, probe MỚI +
  adapt re-arm + tích lũy epoch],
  analyze-t4-{tickcost,wallbands,labellag,skiplatest,lag5}.py
  [bản copy đợt 130],
  analyze-t4-c2drawlog.py [bản copy đợt 131],
  analyze-t4-c2coverage.py [MỚI — kiểm phủ log draw / (c2)],
  t4-histogram-with9.py + t4-histogram-with9.txt [bản copy đợt 131,
  chỉ dùng dry-run] + t4-histogram-with10.py [chuẩn bị cho attempt1,
  CHƯA CHẠY — không có JSON đợt 132],
  b.json, vite.t4-temp.config.mjs,
  vcut-vite-lock-v2.frozen.sh [md5 `cd0c05c1`],
  run-t4.sh + gate0-wait-t4-{b379ecd7,07da9c50}.sh + poll-t4.sh +
  check-classb-t4.sh,
  gate0-wait-t4-{b379ecd7,07da9c50}.log + .nohup.log,
  poll-t4.log [gate0 23+6 poll + gateA 75 poll + poll nền],
  postboot-t4-{b379ecd7,07da9c50}-attempt1-gate0.log [try 1 PASS],
  postboot-t4-{b379ecd7,07da9c50}-gate0wait-<n>.log,
  tree-md5.txt [`805409f0` — cây lúc chờ]).
  **KHÔNG CÓ file JSON attempt nào** (không probe nào chạy),
  **KHÔNG CÓ analyze-t4-attempt1-*.txt, classb-*.txt, run-webkit log,
  vite log** — vì không có attempt.
- Cờ xong: `hidden_files/round132-t4.done` (verdict BLOCKED 1 dòng,
  ~20:15Z). Cờ mở leg T8: `hidden_files/round132-t4-done` đã touch
  cùng lúc, nội dung ghi rõ BLOCKED + không có attempt + T8 kiểm nội
  dung .done trước khi chạy bất cứ leg nào phụ thuộc lượt yên (cờ này
  tới sau deadline waiter 20:10Z của T8 — T8 có thể đã dừng chờ).

## 9. Nợ mở + đề xuất cho đợt sau

1. **Lượt yên #10 CHƯA CHẠY — NỢ LỚN NHẤT đợt 132, chuyển sang đợt
   133 với ƯU TIÊN CAO NHẤT.** Ngưỡng WebKit ≤60 ms GIỮ (8 lượt yên
   xác nhận cũ, trung bình 47,9 ms; median cao nhất 56,0 ms đợt 131,
   biên còn 4,0 ms). Probe re-arm + coverage script ĐÃ SẴN SÀNG trong
   `hidden_files/round132-t4/` (probe md5 `70c7bb9a…`): đợt 133 dùng
   lại nguyên bản này, KHÔNG cần adapt lại — chỉ kiểm `node --check`
   + dry-run lại trước khi đo. Nhớ kiểm cửa sổ log ngay sau attempt
   đầu (prereg §3 đợt này vẫn đứng).
2. **T5 pha 2 đối chiếu log draw với seq (c2): KHÔNG CÓ dữ liệu mới**
   đợt này — làm lại ở đợt 133 khi lượt #10 có dữ liệu. Giả thuyết
   thứ tự theo tick vẫn ở trạng thái BỊ PHÁ VỠ ở lượt #9 (7/8); DEF
   v0.5 vẫn KHÔNG viết. Cơ chế ghost-freeze + skew snap/label vẫn là
   giả thuyết mạnh nhất (9/9 (c2) ở biên run, p ~ 3×10⁻⁷) nhưng chưa
   chứng minh nhân quả.
3. **RAM balloon kẹt ~500 MB là blocker hệ thống, không phải lỗi đo —
   đề xuất cho đợt 133 (trả lời đúng 3 câu parent hỏi):**
   - **(a) Hạ ngưỡng gate A RAM (1024 → ~512 MB)? KHÔNG ĐỀ XUẤT.**
     Ngưỡng 1024 MB là luật đứng (prereg §2, tiền lệ đợt 127/130):
     probe WebKit + vite cần RAM đệm — chạy ở ~500 MB đầu lượt rất dễ
     đẩy RAM xuống dưới 500 MB giữa lượt, vi phạm lớp B5 và cho ra
     "lượt yên" không hợp lệ (tiền lệ R5 attempt2 đợt 118: RAM tụt
     1515→788 MB trong 21 s rồi chết ở pass 10). Hạ ngưỡng chỉ đổi
     định nghĩa "yên" để lấy số, không làm số đó đáng tin hơn. Chỉ
     parent + user mới đổi được luật này; T4 không tự đổi.
   - **(b) Chờ RAM hồi trong cùng đợt? ĐÃ CHỜ ĐỦ — không hiệu quả
     thêm.** Đợt này đã chờ 75 poll / ~90 phút / 2 boot, RAM phẳng
     427–552 MB không một dấu hiệu hồi (không có trend tăng dần qua
     các poll; lần 5 còn tụt xuống min 429 MB). Chờ tiếp chỉ có nghĩa
     khi thấy RAM đang tăng dần về phía ngưỡng — đợt này không thấy.
     Ở đợt 133, đặt trần chờ gate A 60 phút như prereg rồi dừng (đúng
     như đợt này đã làm), không kéo dài vô hạn.
   - **(c) Đo lúc khác? KHẢ THI NHẤT — và có cửa sổ vàng cụ thể.**
     Đợt 131 mở gate ngay lúc 14:52Z (RAM 1178 MB) trong khi đợt này
     kẹt cả buổi tối 18:38–20:08Z — giờ đo có thể là yếu tố (host tải
     theo giờ). Quan trọng hơn, boot mới 07da9c50 cho thấy **cửa sổ
     vàng ~10 phút sau boot**: RAM 1911 MB lúc 19:35:04Z → 1340 MB lúc
     19:38:03Z → ~530 MB lúc 19:46Z. Đợt này cửa sổ đó trôi qua vì cờ
     POSTBOOT_PASS chỉ có lúc 19:46:27Z (T5 cần ~12 phút replay +
     viết cờ). Đề xuất đợt 133: (i) T5 viết cờ NGAY khi postboot PASS
     lần đầu (không chờ 2 poll ổn định nếu replay đã xong — quyết
     parent, vì cờ chậm 10 phút có thể giết cả cửa sổ vàng); (ii) T4
     vào probe NGAY khi gate 0 đạt, không chờ thêm; (iii) nếu lượt
     cron rơi vào khung giờ host bận (tối giờ VN) mà RAM kẹt, cân nhắc
     dời lượt yên sang lượt cron sáng sớm. Ba ý này cần parent quyết —
     T4 chỉ nêu, không tự đổi luật.
4. **Reboot giữa lượt lần thứ 5 liên tiếp** (thứ 6 tính cả reboot giữa
   đóng/mở đợt): b379ecd7 chết trong khung (19:33:56Z, 19:34:15Z] rộng
   19 giây (hẹp nhất từ trước). Số boot #79?/#80?/mới TẠM, chờ T6 chốt
   mù #37 (đợt 133). R9 (a) VẪN CHỜ user (nhắc lần 16 ở đợt 131; đợt
   này T4 không nhắc thêm — việc của T5).
5. **Postboot thiếu 1 gói GST trên boot cũ:** T5 đã repair xong; proxy
   C4 dạng (A) (GST<100) KHÔNG bao được hình dạng "GST gần đủ nhưng
   thiếu 1 gói plugin" — parent quyết có widen proxy hay không (xem
   `round132-t5/t5-repair-decision.md` §(4)). Trên boot mới replay đầy
   đủ, không thiếu gói.
6. **Nợ khác đứng yên theo LIMITS gộp đợt 131 §11 + quyết parent
   §12.3:** mù #49 B mở + mù #50 mới mở (T2 đợt 131 — probe thường
   lệ); mù #51 mới mở (T2 đợt 131) + probe #51 chờ đợt 132 (T2 đợt
   132 — T4 không theo dõi tiến độ này); R9 (a) VẪN CHỜ user; G1 khung
   (a) M2 VẪN HOÃN — chờ quyết G1 của user; birefnet 0 lần (RAM khả
   dụng vẫn dưới guard 6 GB); TTS 39 CẤM kiểm lại;
   ci-security.yml vẫn 403 chờ user; release gate không đổi.
   T8 đang chờ cờ T4 (waiter deadline 20:10Z — đã qua lúc T4 đóng) —
   T8 tự quyết leg của mình theo brief; không có JSON attempt nào để
   T8 dùng.

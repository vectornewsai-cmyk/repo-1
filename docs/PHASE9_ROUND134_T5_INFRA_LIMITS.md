# PHASE9_ROUND134_T5_INFRA_LIMITS — A2 KÍCH HOẠT LIVE LẦN ĐẦU (boot cc1f9de0: replay xong 252 installs nhưng thiếu đúng 1 gói gstreamer1.0-plugins-bad → TRIGGER=YES poll 49+50 → kiểm chứng 5/5 → --repair 1 lần OK → POSTBOOT_PASS 01:13:56Z) + lượt yên #11 KHÔNG ĐO ĐƯỢC (0 attempt, P1–P7 đều KHÔNG KIỂM ĐƯỢC)

> Luồng T5, đợt 134, lượt cron 06:35 +07 18/11/2026 (mở 23:35Z 17/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). T5 đợt 134 làm 3 phần theo brief: (1) nhánh A2 watcher v6 kích
> hoạt live; (2) postboot + cờ gate-visible; (3) pha 2 phân tích (c2)
> lượt yên #11. **Đợt này có 5 BOOT** (d2e66749 → 81335571 → 52ca5d6d →
> 1d2e984d → cc1f9de0) — 4 reboot GIỮA LUỘT liên tiếp sau boot mở đợt,
> gồm 2 reboot trong ~1 phút. **A2 ĐÃ KÍCH HOẠT LIVE LẦN ĐẦU TIÊN trên
> boot cc1f9de0 (§6) — widen v6 đợt 133 được chứng minh bằng dữ liệu
> thật, không còn chỉ là kiểm chứng khô.** Lượt yên #11 KHÔNG ĐO ĐƯỢC
> (T4 0 attempt hợp lệ) nên pha 2 KHÔNG CÓ DỮ LIỆU (§9) — chỉ kiểm tra
> độc lập JSON partial (khớp 100% số của T3).
> Nợ: R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (preview.tsx giữ
> 530e10a7 — fix của T3, T5 không đụng). CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **NHÁNH A2 KÍCH HOẠT LIVE LẦN ĐẦU — CHỨNG MINH XONG (boot cc1f9de0).**
   Watcher b87 v6: replay xong (1730 dòng / 252 installs, 0 proc, dpkg
   im từ 00:59:22Z) nhưng postboot FAIL chỉ vì thiếu đúng **1 gói đích
   `gstreamer1.0-plugins-bad`** (10/11 package đủ; wrapper/libs/GST đều
   PASS) → **C4=A2(yes) từ poll 39 (00:59:53Z)**; silent vượt 600 s →
   **TRIGGER=YES poll 49 (01:09:55Z, silent 633 s) + poll 50 (01:10:55Z,
   silent 693 s)** — 2 poll liên tiếp. T5 kiểm chứng độc lập **5/5 ĐẠT**
   01:11:26Z (FAIL tươi đúng 1 dòng; 0 proc; silent 724 s; dạng A2 +
   candidate 1.24.2-1ubuntu4 resolvable, lists 37 đủ; 0 probe) →
   **--repair 1 lần (once-only trên boot này) 01:11:39Z: apt-get update
   OK + cài plugins-bad, RE-CHECK 4/4 PASS, KẾT LUẬN ĐỦ ĐIỀU KIỆN, exit
   0** (<90 s). Watcher poll 52–53 postboot exit 0 → **cờ
   `POSTBOOT_PASS` gate-visible viết 01:13:56Z (poll 53)** cho boot
   cc1f9de0. GST 120 → **269 file** (plugins-bad thêm đúng 149 file —
   trùng baseline 269 của các boot trước). **A2 không còn là "chờ kích
   hoạt live" — đã kích hoạt và đã sửa thành công.**
2. **Boot mở đợt d2e66749: postboot PASS ngay, cờ viết 23:49:21Z, T4 mở
   gate ngay poll #1** (23:50:17Z, RAM 2037 MB) — nhưng attempt1 bị
   reboot giết giữa pass 3/20 (reboot #8 liên tiếp). Watcher b85 v6
   2 poll, TRIGGER=NO cả 2 (đúng — PASS, không có gì để repair).
3. **Boot 81335571: replay KHÔNG CHẠY (dạng (B), KHÔNG phải A2).**
   dpkg 2 dòng / 0 install, 0 proc suốt 10+ phút, postboot FAIL →
   TRIGGER=YES dạng (B) poll 6 (00:05:07Z, silent 657 s) → kiểm chứng
   độc lập 5/5 ĐẠT 00:05:46Z → --repair bắt đầu 00:06:20Z (symlink GST
   xong, apt-get update đang chạy, partial 113) thì **reboot #9 giết
   giữa chừng (~00:12:55Z)** — repair BỊ GIÁN ĐOẠN BỞI REBOOT, không
   phải thất bại. Luật once-only: chưa có lần repair HOÀN TẤT nào trên
   boot 81335571; lần repair này không tính vào boot sau.
4. **Boot 52ca5d6d: sống <1 phút (reboot #10)** — chỉ kịp ghi nhận
   btime 00:12:55Z; không watcher nào chạy trên boot này.
5. **Boot 1d2e984d: replay ĐANG CHẠY MẠNH khi chết (reboot #11,
   ~00:17:36Z, sống ~3m46s)** — dpkg 729 dòng lúc chết (theo poll #4
   T4), gstreamer1.0-gl đã cài, GST 32 file đang tăng. Không kịp PASS.
6. **Boot cc1f9de0 (hiện tại): replay CHẬM (mirror chậm) nhưng CHẠY
   XONG** — apt-get update 12 phút (~00:18→~00:30:30Z), installs
   00:30:30Z→00:59:22Z (252 installs, 1730 dòng — NHIỀU HƠN baseline
   221/1545: seed list boot này lớn hơn), kẹt 14 phút ở khâu download
   `gstreamer1.0-plugins-bad` (apt-get 7121, 00:31:27Z→~00:45Z, 0,1%
   CPU, cache 77M→84M — đang download chậm, KHÔNG kẹt cứng) rồi bỏ qua
   gói này không báo lỗi (history.log chỉ ghi deps của nó; bản thân
   gói không bao giờ được cài). Đây chính là hình dạng A2 mà widen v6
   sinh ra để bắt.
7. **Lượt yên #11 KHÔNG ĐO ĐƯỢC — 0 attempt hợp lệ (T4.done 01:08Z).**
   Attempt1 duy nhất (boot d2e66749) chết ở pass 3/20; sau đó 4 reboot
   (23:50Z–01:00Z); cờ POSTBOOT_PASS mới KHÔNG BAO GIỜ xuất hiện trong
   hạn T4 (01:00Z); postboot check-only exit=1 suốt; RAM kẹt 451–710
   MB lúc T4 chờ. **Pha 2: P1–P7 ĐỀU KHÔNG KIỂM ĐƯỢC** (0 tick
   post-flip, 0 (c2)). Kiểm tra độc lập JSON partial của T4 (257.631 B,
   sha256 b402b3f3…) bằng script riêng: **khớp 100% mọi số của T3**
   (log draw n=53 toàn loop 1, 0 wrap; tickCost median 58,0 ms pre-flip
   — KHÔNG dùng làm verdict). **Prereg + cộng dồn GIỮ NGUYÊN**
   (P1 14/14, P3 13/14 từ #9+#10). Ngưỡng ≤60 ms GIỮ.
8. **Fix instrumentation T3 (preview.tsx 530e10a7) CÒN NGUYÊN sau 4
   reboot, KHÔNG REVERT đợt này** (quyết T3 §5 + đề xuất T4: điều kiện
   revert "sau khi đo" chưa xảy ra vì chưa đo được lượt nào; GIỮ hay
   REVERT chờ quyết parent — T10 ghi §12). T5 không sửa file này.
9. **Đồng hồ cell cũ chạy nhanh hơn giờ host vài chục giây** — bằng
   chứng: poll #4 T4 (giờ cell 1d2e984d 00:17:53Z) vẫn thấy boot cũ
   sau btime boot mới 00:17:36Z (giờ host); watcher b86 poll 14 ghi
   apt-get pid 6258 etime 06:50 sau thời điểm reboot theo giờ host.
   Timestamp 2 phía lệch nhau ở ranh giới reboot — khi đối chiếu log
   qua reboot phải dùng boot_id + thứ tự sự kiện, không chỉ giờ tuyệt
   đối. Xem §2.4.
10. **Headroom inotify: 2506/2515 (mở) → 2499 (cuối)** — giảm ~120 so
    với 2623 cuối đợt 133; vẫn trên ngưỡng báo user (< ~1.800) ~700,
    chỉ theo dõi. RAM toàn phiên T5: **438–2350 MB**.
11. **R9 (a) vẫn chờ user — nhắc lần 17** (mỗi đợt nhắc 1 lần; đợt 133
    là lần 16).
12. **Stale vite.lock: KHÔNG KIỂM đợt này** (T5 không đụng
    lock/queue; T6 kiểm lockhealth — ghi rõ để khỏi đọc thành "đã
    kiểm là sạch"). Queue cooldown cũng không kiểm đợt này.

## 2. Timeline 5 boot trong đợt 134

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | d2e66749 | 17/11 23:26:58 | ~26 phút | Replay xong 1545/221, postboot PASS, cờ 23:49:21Z; T4 attempt1 chết pass 3/20 → reboot #8 |
| 2 | 81335571 | 17/11 23:53:17 | ~19–20 phút | Replay KHÔNG chạy (2 dòng/0 install); TRIGGER (B) → repair bị reboot #9 giết giữa update |
| 3 | 52ca5d6d | 18/11 00:12:55 | <1 phút | Chết ~00:13:50Z (reboot #10); không kịp làm gì |
| 4 | 1d2e984d | 18/11 00:13:50 | ~3m46s | Replay đang chạy mạnh (dpkg 729 lúc chết); reboot #11 |
| 5 | cc1f9de0 | 18/11 00:17:36 | còn sống (01:15Z: ~58 phút) | Replay xong 1730/252 nhưng thiếu plugins-bad → **A2 live** → repair OK → cờ 01:13:56Z |

- Tổng cộng **4 reboot GIỮA LUỘT trong đợt 134** (sau boot mở đợt), nối
  dài chuỗi reboot liên tiếp: đợt 129 (#75?), 130 (#77?), 131
  (f868abad), 132 (ad1327ef, b379ecd7), 133 (07da9c50 sống — chuỗi
  đứt 1 đợt), 134 (4 reboot). Boot 07da9c50 đợt 133 là boot duy nhất
  sống qua cả lượt trong 6 đợt gần nhất; đợt 134 quay lại mẫu reboot
  liên tiếp, lần này dồn dập nhất (2 reboot trong ~1 phút, 4 reboot
  trong ~70 phút).
- Chốt chặn `round-in-progress.md` TỒN TẠI suốt phiên T5 — là của
  CHÍNH đợt 134 (mở 23:35Z, hạn cứng T10 02:00Z), KHÔNG phải đợt
  main-chat. T5 KHÔNG xóa (việc của T10).

### 2.1 Boot d2e66749 — mở đợt (23:35–23:53Z)

- Boot lúc T5 mở (23:45:14Z): btime 23:26:58Z, tuổi ~18 phút.
  dpkg.log **1545 dòng / 221 installs** (TRÙNG SỐ với boot 07da9c50 —
  replay định lượng), dòng cuối 23:37:47Z (gói cuối
  gstreamer1.0-tools); configure đầu 23:35:39Z (boot +8m41s), cài xong
  23:37:47Z (boot +10m49s). **gstreamer1.0-gl `ii` 1.24.2-1ubuntu0.7**
  (cài bởi replay 23:36:19Z). GST 269 file (thư mục thật), lists 39,
  partial 0. 0 apt/dpkg/wrapper/MiniBrowser lúc mở.
- Lưu ý: lần `pgrep -f os-intent` đầu tiên của T5 in ra PID 7497 —
  đó là **tự khớp shell của chính lệnh exec** (mẫu không có ngoặc
  `[-]`), KHÔNG phải process wrapper thật. Kiểm lại bằng
  `pgrep -f 'os[-]intent'` → 0. Ghi rõ để khỏi đọc nhầm thành "có
  wrapper đang chạy".
- Postboot poll0 23:47Z: **PASS exit 0** (wrapper/libs/GST/apt đủ).
  Watcher b85 v6 2 poll (23:48:20Z, 23:49:21Z), postboot exit 0 cả 2,
  TRIGGER=NO cả 2 (đúng), **cờ `POSTBOOT_PASS` viết 23:49:21Z**
  (boot +22m23s, poll 2). Final confirm 23:50:43Z exit 0. Tổng trên
  boot này: postboot PASS 4/4 (poll0 + watcher 2 poll + final), 0 FAIL.
  **KHÔNG --repair.**
- T4 gate0-wait poll #1 23:50:17Z đọc `t5flag=PASS` + RAM 2037 MB →
  **"CỬA YÊN MỞ" ngay poll #1**, attempt1 chạy ngay. T4 attempt1:
  pass 1–2 xong (~3,3 s/pass), **pass 3 kẹt** (elapsed >100 s,
  heartbeat stuck), rồi **reboot giết cả attempt + poller T4 (PID
  14270) + lệnh sleep của T5** (runtime restart). T4 ghi lại: partial
  JSON 257.631 B, passesDone=2, flip chưa tới.
- T3 fix instrumentation đã xong TRƯỚC khi attempt1 chạy:
  preview.tsx 805409f0 → **530e10a7** (cờ round134-t3-fix.done),
  tsc 0, vite build PASS. T5 mở lúc 23:45Z vẫn thấy 805409f0; lúc
  23:50:43Z đã là 530e10a7 (T3 sửa trong khoảng đó).

### 2.2 Boot 81335571 — replay không chạy, repair bị reboot giết (23:53–~00:12Z)

- Boot mới btime 23:53:17Z. Lúc T5 mở lại (23:57:40Z, boot +4m23s):
  dpkg.log **2 dòng / 0 installs** (chỉ "startup packages configure"
  23:54:09–23:54:10Z, boot +52s); GST 0 file (thư mục chưa tồn tại);
  lists 5 (auxfiles + 2 file cli.github.com cũ từ 12/11 + lock +
  partial); partial 0; gstreamer1.0-gl CHƯA CÀI; 0 proc
  apt/apt-get/dpkg/wrapper/MiniBrowser; không có /var/log/apt/history
  mới. RAM 1680 MB. preview.tsx 530e10a7 (fix còn nguyên sau reboot).
- Postboot poll0 23:58Z: **FAIL exit 1** — thiếu cả 11 package, cả 5
  lib, GST không tồn tại (4 dòng FAIL). Đây là hình dạng "replay chưa
  chạy", KHÔNG phải A2 (installs=0).
- Watcher b86 v6 (00:00:05Z–): **nhánh archive cờ stale kích hoạt
  live lần thứ 2** (sau b83 đợt 132): `STALE_FLAG_ARCHIVED 00:00:05Z
  old_boot_id=d2e66749… → POSTBOOT_PASS.stale-d2e66749` — cờ cũ của
  boot d2e66749 được archive ngay lúc khởi động, gate không bao giờ
  đọc nhầm cờ cũ. Poll 1–2 TRIGGER=NO (silent 355 s / 415 s < 600 s);
  **poll 6 (00:05:07Z): TRIGGER=YES dạng (B)** — dpkg=2, installs=0,
  silent 657 s ≥ 600 s, postboot FAIL tươi, 0 proc, no probe
  (C1–C5 đủ; C4=B). EVAL_C: d_formC=no suốt (lists=5 > 3 do 2 file
  cli.github.com cũ — luật (C) không bao giờ đủ dạng trên boot này;
  ghi rõ để khỏi thắc mắc sao (C) không kích hoạt).
- Kiểm chứng độc lập 5/5 pre-repair 00:05:46Z — **ĐẠT CẢ 5**:
  (1) postboot FAIL tươi exit 1 (4 dòng FAIL); (2) 0 proc
  apt/apt-get/dpkg/wrapper; (3) dpkg im 696 s ≥ 600 s; (4) dạng (B):
  dpkg 2 dòng ≤ 5, installs 0, lists 5, partial 0, GST 0;
  (5) no probe (MiniBrowser 0, không process webkit/vite/playwright).
  Luật once-only: chưa repair lần nào trên boot này.
- **--repair 00:06:20Z (1 lần, có giám sát):** symlink GST → debroot
  (269 file) XONG; apt-get update BẮT ĐẦU (lists trống) — watcher
  poll 8–11 thấy apt-get đang chạy → TRIGGER=NO (c2a=no, đúng — không
  trigger lại trong lúc repair chạy); partial 0→113 (đang download).
  **Reboot #9 (~00:12:55Z) giết repair giữa apt-get update** (apt-get
  pid 6258, etime 06:50 lúc poll 14, vẫn đang update; install CHƯA
  BẮT ĐẦU). **Repair BỊ GIÁN ĐOẠN BỞI REBOOT — không phải thất bại
  trên fond của nó.** Không chạy lại repair trên boot này (boot đã
  chết). Ghi rõ để T10/parent khỏi đọc "repair fail" thành "repair
  hỏng".

### 2.3 Boot 52ca5d6d — sống <1 phút (00:12:55–~00:13:50Z)

- T5 đọc được boot_id 52ca5d6d, btime 00:12:55Z lúc 00:13:44Z (uptime
  ~49 s, PID namespace mới: PID ~783–804). dpkg.log lúc đó đã có 2
  dòng configure mới (00:13:37Z) + apt-get update của hệ thống (pid
  804) đang chạy — replay có dấu hiệu bắt đầu. Không kịp làm gì thêm:
  boot chết ~00:13:50Z (reboot #10). T4 ghi nhận: boot này "chỉ sống
  <1 phút — CHẾT trong khung (00:13:45Z, 00:13:50Z]".
- Không watcher nào chạy trên boot này; không cờ nào được viết.

### 2.4 Boot 1d2e984d — replay chạy mạnh, chết khi chưa kịp PASS (00:13:50–~00:17:36Z)

- Boot btime 00:13:50Z. Lúc T5 mở lại (00:17:15Z, boot +3m25s):
  dpkg **566 dòng / 83 installs** (tăng ~300 dòng/46 s),
  GST 32 file đang tăng, **gstreamer1.0-gl ĐÃ CÀI**, lists 37,
  partial 0; apt-get os-intent (pid 4056) + wrapper (774, 4056) đang
  chạy; RAM 1586 MB; preview.tsx 530e10a7.
- T4 poll #1–#4 trên boot này (00:15:37Z–00:17:53Z giờ cell): RAM
  1876→1706 MB, load1 4,51→2,89, dpkg_lines 133→433→550→729 — replay
  đang cài tích cực. **Reboot #11 (~00:17:36Z, sống ~3m46s)** giết
  boot khi dpkg đã 729 dòng. T4 phải khởi động lại poller lần 4.
- **Về lệch giờ:** poll #4 của T4 ghi 00:17:53Z (giờ cell cũ) vẫn
  thấy boot 1d2e984d, trong khi btime boot mới là 00:17:36Z (giờ
  host). Giải thích nhất quán: **đồng hồ cell cũ chạy nhanh hơn giờ
  host vài chục giây** — lúc cell cũ ghi 00:17:53Z thì giờ host mới
  ~00:17:1x–00:17:3xZ. Tương tự, watcher b86 poll 14 ghi apt-get pid
  6258 etime 06:50 ở "00:13:11Z" — theo giờ host lúc đó cell đã chết
  (btime boot mới 00:12:55Z); theo giờ cell cũ thì poll 14 chạy
  ~00:12:3xZ, ngay trước khi chết. **Kết luận: timestamp tuyệt đối
  qua ranh giới reboot không so được trực tiếp; đối chiếu bằng
  boot_id + thứ tự sự kiện + etime tương đối.** T5 không sửa log cũ
  (ghi đúng những gì đã ghi), chỉ ghi chú cách đọc.
- Postboot script được sửa lần 3 cho boot này (header + say, md5
  1c95c6dd…) nhưng poll0 trên boot này KHÔNG BAO GIỜ chạy xong có ý
  nghĩa: lần chạy poll0 lúc 00:17:36Z đã rơi vào boot mới cc1f9de0
  (dpkg 2 dòng) — xem §2.5. Ghi rõ để khỏi nhầm "poll0 của boot
  1d2e984d FAIL" thành dữ liệu của boot đó.

### 2.5 Boot cc1f9de0 — replay chậm nhưng xong; A2 live (§6)

- Boot btime 00:17:36Z. Lúc T5 mở lại (00:19:49Z, boot +2m13s):
  dpkg 2 dòng / 0 install, GST 0, lists 3, partial 8 (đang tăng);
  **apt-get update (pid 795) + wrapper os-intent (pid 774) ĐANG
  CHẠY** — replay đã bắt đầu (khác 81335571: 0 proc 10 phút). RAM
  1483 MB. preview.tsx 530e10a7.
- Diễn biến replay (watcher b87 + kiểm tay): update 00:18Z→~00:30:30Z
  (~12 phút, mirror chậm — khớp tiền lệ Q7/b379ecd7); installs
  00:30:30Z→00:59:22Z; **kẹt 14 phút ở download
  `gstreamer1.0-plugins-bad`** (apt-get 7121, 00:31:27Z→~00:45Z,
  0,1% CPU, cache .deb 77M→84M — đang download chậm, KHÔNG kẹt
  cứng; xem §6.3); installs tiếp tục tới **1730 dòng / 252 installs
  (NHIỀU HƠN baseline 221/1545)**; wrapper + apt-get cuối cùng biến
  mất ~00:59:30Z. GST dừng ở **120 file** (không tăng từ 00:46Z) —
  đúng bằng 269 − 149 (số file của plugins-bad).
- Postboot poll0 00:20Z: FAIL exit 1 (thiếu 11 package — replay mới ở
  pha update). T4 khởi động lại poller lần 4 (00:19:28Z, hạn 01:00Z),
  chờ cờ T5 mới — cờ không bao giờ tới trong hạn (postboot exit=1
  suốt tới 01:00Z).

## 3. Postboot script — sửa 4 lần (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5 theo chuỗi sửa:

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 0 | — (cuối đợt 133) | 07da9c50 | — → `55f6b3df…` | baseline |
| 1 | 23:46–23:47Z | d2e66749 | `55f6b3df…` → `512aed0e…` | header + say: boot mới, replay 1545/221, GST 269, gl đã cài |
| 2 | 23:58–23:59Z | 81335571 | `512aed0e…` → `a075aafc…` | header + say: replay mới bắt đầu, 2 dòng/0 install |
| 3 | 00:17Z | 1d2e984d | `a075aafc…` → `1c95c6dd…` | header + say: 2 reboot/1 phút, replay đang chạy mạnh |
| 4 | 00:19–00:20Z | cc1f9de0 | `1c95c6dd…` → `b568049b…` | header + say: reboot #11, replay đã bắt đầu (update + wrapper) |

- `bash -n` OK sau mỗi lần sửa. **KHÔNG đổi logic** (không đổi thứ
  tự apt/GST, không đổi NEED/threshold — phương án A R9 §6.3 vẫn giữ
  nguyên, chưa có phê duyệt đổi).
- Lưu ý lần 1: T5 ghi sai mốc configure trong header lúc đầu
  ("23:27:29Z, boot +31s" — bịa từ mẫu boot cũ) rồi **tự sửa ngay
  trong cùng phiên** sau khi đọc dpkg.log thật: configure 23:35:39Z
  (boot +8m41s), cài xong 23:37:47Z. File cuối cùng ghi đúng số
  thật; ghi rõ sai số này để T10 khỏi trích nhầm bản nháp.
- Lưu ý lần 3: header cho boot 1d2e984d được viết xong thì boot đã
  chết; poll0 "của lần 3" thực tế chạy trên boot cc1f9de0 (xem §2.4).

## 4. Watcher — b85/b86/b87 v6 (cùng logic C4/EVAL, chỉ đổi boot/header)

| Watcher | Boot | md5 | Chạy | Kết cục |
|---|---|---|---|---|
| b85 | d2e66749 | `a6b1e6d3…` | 23:48:20–23:49:21Z, 2 poll | PASS ổn định → cờ 23:49:21Z, exit 0 |
| b86 | 81335571 | `44eeef7e…` | 00:00:05Z–~00:13Z, 14 poll | TRIGGER (B) poll 6 → repair bị reboot giết; watcher chết theo reboot |
| b87 | cc1f9de0 | `db0d069b…` | 00:21:43Z–01:13:56Z, 53 poll | **TRIGGER A2 poll 49+50** → repair OK → cờ 01:13:56Z, exit 0 |

- Chuỗi md5 v6: b84 (đợt 133) `1946b2d0…` → b85 `a6b1e6d3…` → b86
  `44eeef7e…` → b87 `db0d069b…`. Diff sau chuẩn hoá (đổi tên
  round/boot/btime/mốc dpkg): **chỉ còn header + nhãn FLAG_WRITTEN
  (v5→v6, sửa theo ghi chú đợt 133 §5.3) — KHÔNG đổi logic C4/EVAL/
  luật (C)/ngưỡng poll nào.** `bash -n` OK trước khi chạy mỗi bản.
- Lỗi hiển thị đã biết, KHÔNG sửa (đã ghi từ đợt 127 §7.3 mục 5):
  `last_install` vẫn đọc "installed" thay vì tên gói (awk lấy nhầm
  cột). Không ảnh hưởng EVAL.
- b86: nhánh archive cờ stale kích hoạt live lần 2
  (`STALE_FLAG_ARCHIVED 00:00:05Z`, xem §2.2). b87: `NO_FLAG_AT_START`
  (cờ đã bị archive, thư mục chỉ còn file `.stale-d2e66749`).

## 5. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

### 5.1 Watcher b85 (boot d2e66749) — TRIGGER=NO cả 2 poll (đúng)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|
| 1 | 23:48:20Z | 633 s | no (exit 0) | yes | - (no) | **NO** |
| 2 | 23:49:21Z | 694 s | no (exit 0) | yes | - (no) | **NO** |

- Poll 1: `frozen=no` (poll đầu chưa có PREV_LINES — hành vi đã biết).
  Poll 2: frozen=yes + PASS streak 2 → FLAG_WRITTEN 23:49:21Z.
- Luật (C): KHÔNG KÍCH HOẠT (a=no cả 2 poll; 0 proc đang chạy).

### 5.2 Watcher b86 (boot 81335571) — TRIGGER=YES dạng (B) poll 6

| Poll | Thời gian | silent | (1) | (2a) | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|
| 1 | 00:00:05Z | 355 s | yes | yes | B(yes) | **NO** (c2b/c3 chưa đủ) |
| 2 | 00:01:05Z | 415 s | yes | yes | B(yes) | **NO** |
| 4 | 00:03:06Z | 536 s | yes | yes | B(yes) | **NO** |
| 5 | 00:04:07Z | 597 s | yes | yes | B(yes) | **NO** (thiếu 3 s!) |
| **6** | **00:05:07Z** | **657 s** | yes | yes | **B(yes)** | **YES** |
| 8 | 00:07:08Z | 778 s | yes | **no** (apt-get của repair đang chạy) | B(yes) | **NO** (đúng — không trigger lại trong lúc repair) |
| 11 | 00:10:09Z | 960 s | yes | no | B(yes) | **NO** |
| 14 | 00:13:11Z | 1141 s | yes | no (apt-get pid 6258, etime 06:50) | B(yes) | **NO** |

- **TRIGGER=YES duy nhất ở poll 6 (dạng (B))** — replay không chạy,
  dpkg 2 dòng / 0 install, silent vượt 600 s. Kiểm chứng độc lập 5/5
  + repair theo sau (xem §2.2). Sau khi repair bắt đầu, c2a=no nên
  TRIGGER quay về NO — đúng thiết kế (không trigger chồng lên repair
  của chính mình).
- Luật (C): KHÔNG KÍCH HOẠT suốt (d=no vì lists=5 > 3; b=no vì chưa
  đủ 2 lần kiểm cách nhau ≥15 phút + dpkg im ≥15 phút trước khi
  reboot giết).

### 5.3 Watcher b87 (boot cc1f9de0) — TRIGGER=YES dạng (A2) poll 49+50

| Poll | Thời gian | dpkg / installs | silent | (1) | (2a) | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|---|
| 1 | 00:21:43Z | 2 / 0 | 212 s | yes | no (apt-get 795) | B(yes) | **NO** |
| 5 | 00:25:44Z | 2 / 0 | 453 s | yes | no | B(yes) | **NO** |
| 9 | 00:29:45Z | 2 / 0 | 694 s | yes | no | B(yes) | **NO** (apt-get update vẫn chạy — đúng) |
| 13 | 00:33:46Z | 729 / 107 | 141 s | yes | no | - (no) | **NO** |
| 16 | 00:36:46Z | 729 / 107 | 321 s | yes | no (apt-get 7121) | - (no) | **NO** |
| 20 | 00:40:47Z | 729 / 107 | 562 s | yes | no | - (no) | **NO** |
| 25 | 00:45:49Z | 1059 / 155 | 47 s | yes | no | - (no) | **NO** |
| 28 | 00:48:49Z | 1311 / 193 | 10 s | yes | no | - (no) | **NO** |
| 31 | 00:51:50Z | 1459 / 215 | 92 s | yes | no | - (no) | **NO** |
| 35 | 00:55:51Z | 1656 / 241 | 5 s | yes | no | - (no) | **NO** |
| 38 | 00:58:52Z | 1721 / 251 | 27 s | yes | no | - (no) | **NO** |
| 39 | 00:59:53Z | 1730 / 252 | 31 s | yes | **yes** | **A2(yes)** | **NO** (silent <600 s) |
| 43 | 01:03:53Z | 1730 / 252 | 272 s | yes | yes | **A2(yes)** | **NO** |
| 47 | 01:07:55Z | 1730 / 252 | 513 s | yes | yes | **A2(yes)** | **NO** |
| **49** | **01:09:55Z** | 1730 / 252 | **633 s** | yes | yes | **A2(yes)** | **YES** |
| **50** | **01:10:55Z** | 1730 / 252 | **693 s** | yes | yes | **A2(yes)** | **YES** |
| 52 | 01:12:56Z | 1739 / 253 | 42 s | no (exit 0) | yes | - (no) | **NO** (sau repair — đúng) |
| 53 | 01:13:56Z | 1739 / 253 | 102 s | no (exit 0) | yes | - (no) | **NO** → FLAG_WRITTEN |

- **C4=A2(yes) xuất hiện lần đầu ở poll 39 và đứng yên qua 12 poll
  liên tiếp (39–50)** — định dạng A2 ổn định, không phải nhiễu 1
  poll. TRIGGER chỉ bật khi silent vượt 600 s (poll 49) — đúng luật
  (ngưỡng chờ 10 phút chống trigger vội).
- Luật (C): KHÔNG KÍCH HOẠT (d=no suốt — dpkg 729+ dòng; b=no —
  chưa đủ 2 lần kiểm cách nhau ≥15 phút; và (C) vốn chỉ áp cho dạng
  "replay không chạy", không áp cho stall giữa replay).
- Poll 52–53: postboot exit 0 sau repair; poll 53 frozen=yes + PASS
  streak 2 → FLAG_WRITTEN 01:13:56Z, watcher tự kết thúc
  `done_pass_stable_2polls`, exit 0.

## 6. NHÁNH A2 KÍCH HOẠT LIVE — bằng chứng đầy đủ

### 6.1 Hình dạng bắt được (boot cc1f9de0)

- Replay chạy xong: 1730 dòng / 252 installs (NHIỀU HƠN baseline
  221/1545 — seed list boot này lớn hơn), dòng cuối 00:59:22Z (gói
  cuối gstreamer1.0-tools, y hệt các boot trước), 0 proc từ
  ~00:59:30Z, lists 37 đủ, partial 0.
- Thiếu đúng **1 gói đích: `gstreamer1.0-plugins-bad`** — 10/11
  package NEED đủ; wrapper PASS; libs đủ 5; GST đủ isomp4 + libav
  (120 file thật). Postboot FAIL chỉ còn đúng 1 dòng:
  `FAIL apt: chưa cài: gstreamer1.0-plugins-bad`.
- Đây chính là hình dạng mà quyết parent đợt 132 §12.3(b) mô tả
  ("replay đã xong mà thiếu ít nhất 1 gói trong bộ đích") — khác
  b379ecd7 ở gói thiếu (plugins-bad thay vì gstreamer1.0-gl) và ở
  GST (120 thay vì 268), nhưng cùng bản chất: **"đầy đủ" = ĐỦ BỘ GÓI
  ĐÍCH, không chỉ "replay chạy đầy đủ"**.
- Vì sao replay bỏ qua gói này: apt-get 7121 (00:31:27Z→~00:45Z,
  lệnh `install gstreamer1.0-plugins-bad`) download ~14 phút (cache
  .deb 77M→84M trong lúc đó) rồi biến mất **không có entry
  history.log nào cho chính gói này** — chỉ có transaction 00:31:05Z
  cài các dep của nó (libgstreamer-plugins-bad1.0-0, libgupnp…).
  Wrapper coi như xong và chuyển sang gói tiếp theo (11749, 13353,
  14419, 17026, 17995…). Không có thông báo lỗi nào được ghi lại ở
  phía T5 (output apt-get của wrapper đi vào log của reconcile
  service, T5 không đọc được). Ghi đúng mức: **nguyên nhân gốc của
  việc thiếu gói chưa xác định được từ phía T5** (download timeout?
  lỗi hash? wrapper bỏ qua exit code?) — chỉ biết chắc hậu quả: gói
  không được cài dù candidate có sẵn (1.24.2-1ubuntu4) và deps đã đủ.
  T10/T6 có thể đào sâu history của wrapper nếu cần; không ảnh hưởng
  verdict A2 (A2 chỉ cần hình dạng, không cần nguyên nhân gốc).

### 6.2 Kiểm chứng độc lập 5/5 pre-repair (01:11:26Z) — ĐẠT CẢ 5

| # | Điều kiện (§8.2(B)) | Kiểm chứng độc lập | Kết quả |
|---|---|---|---|
| 1 | (1) postboot FAIL tươi | Chạy lại check-only 01:11:26Z: exit 1, đúng 1 dòng FAIL (`FAIL apt: chưa cài: gstreamer1.0-plugins-bad`); wrapper/libs/GST đều PASS | **ĐẠT** |
| 2 | (2a) 0 proc apt/dpkg/wrapper | pgrep -x apt/apt-get/dpkg + pgrep -f 'os[-]intent': tất cả 0 (exit 1) | **ĐẠT** |
| 3 | (2b/3) dpkg im ≥600 s | Dòng cuối dpkg.log 00:59:22Z; silent = **724 s** | **ĐẠT** |
| 4 | (4) dạng A2 | installs=252 > 0; 0 proc; postboot FAIL; log poll ghi thiếu gói đích; candidate 1.24.2-1ubuntu4 resolvable qua `apt-cache policy` (lists 37 — mệnh đề "lists đủ" trong quyết parent được thực thi ở bước này, không giao cho watcher, đúng như thiết kế v6 §5.1 đợt 133); dpkg-query: `unknown ok not-installed` | **ĐẠT** |
| 5 | (5) không probe | MiniBrowser 0; không process webkit/vite/playwright nào | **ĐẠT** |

- Luật once-only: **chưa --repair lần nào trên boot cc1f9de0**.
  Lần repair trên boot 81335571 (khác boot, bị reboot gián đoạn)
  không tính vào boot này. T5 chỉ repair 1 lần duy nhất trên boot
  này (xem §6.3).
- Đối chiếu kiểm chứng khô đợt 133 §5.2: ca 1 (b379ecd7-shape,
  thiếu gstreamer1.0-gl) → A2/yes; ca 7 (thiếu plugin GST) →
  A2/yes. Ca live này là biến thể mới (thiếu plugins-bad — gói
  apt, không phải plugin GST lẻ) nhưng cùng thỏa định nghĩa A2
  (dòng `FAIL apt: chưa cài:`). Widen v6 bắt được cả 3 biến thể.

### 6.3 --repair 1 lần (01:11:39Z) — THÀNH CÔNG, có giám sát

- Log: `t5-repair-A2.log` (repair pid 20893).
- Diễn biến: wrapper PASS (không đụng); libs PASS; GST: thư mục
  thật 120 file, isomp4 + libav đủ → **KHÔNG symlink, KHÔNG
  `rm -rf`** (nhánh symlink chỉ chạy khi thiếu plugin — ghi rõ vì
  thư mục thật 120 file là tài sản của replay, không được cướp);
  apt: `apt-get update` OK (nhanh — lists đã có 37 file, khác lần
  update 12 phút của replay) → `REPAIRED apt: đã cài:
  gstreamer1.0-plugins-bad`; RE-CHECK 4/4 PASS (wrapper/libs/GST/
  apt); **KẾT LUẬN: ĐỦ ĐIỀU KIỆN chạy WebKit, exit 0**. Tổng thời
  gian <90 s (01:11:39Z→~01:12:14Z, dòng dpkg cuối 01:12:14Z).
- Sau repair: dpkg 1739 dòng / 253 installs; **GST 120 → 269 file**
  (plugins-bad thêm đúng 149 file — trùng baseline 269); dpkg-query
  plugins-bad: `install ok installed`; `apt-cache policy` candidate
  đã thành installed.
- Watcher b87 poll 52 (01:12:56Z): postboot exit 0 (PASS streak 1,
  frozen=no); poll 53 (01:13:56Z): exit 0 + frozen=yes → streak 2 →
  **FLAG_WRITTEN 01:13:56Z, watcher exit 0**. Cờ:
  `POSTBOOT_PASS boot_id=cc1f9de0-… btime=2026-11-18T00:17:36Z
  pass_at=2026-11-18T01:13:56Z poll=53`.
- **A2 đã chứng minh live đầy đủ:** bắt được hình dạng → trigger
  đúng luật → kiểm chứng 5/5 → repair 1 lần → PASS + cờ. Từ đợt
  sau, "nhánh A2 chưa kích hoạt live" không còn đúng nữa; thay bằng
  "A2 đã kích hoạt live đợt 134 (plugins-bad)".

### 6.4 Những gì A2 KHÔNG làm (ghi rõ giới hạn)

- A2 KHÔNG bắt FAIL chỉ do wrapper (vd `FAIL wrapper: bản gốc`) —
  giới hạn có chủ ý từ v6 (§5.1 đợt 133). Đợt này không gặp FAIL
  wrapper nên giới hạn không bị thử thách.
- A2 KHÔNG can thiệp khi replay còn chạy (c2a=no → TRIGGER=NO) —
  đợt này: update 12 phút + download plugins-bad 14 phút đều được
  chờ đủ, không trigger vội. Ngưỡng silent 600 s + điều kiện 0 proc
  là 2 lớp bảo vệ chống trigger nhầm.
- A2 KHÔNG giải thích được TẠI SAO replay bỏ qua plugins-bad (xem
  §6.1) — chỉ sửa hậu quả (cài gói thiếu). Nếu hình dạng này lặp lại
  ở boot sau (replay bỏ qua 1 gói khác nhau mỗi lần), T10 nên xem
  xét điều tra wrapper/reconcile — ngoài tầm T5 đợt này.

## 7. Cờ gate-visible — tới muộn, nhưng tới (boot cc1f9de0)

- Cờ d2e66749 (23:49:21Z) TỚI ĐƯỢC GATE: T4 mở cửa ngay poll #1
  (23:50:17Z, RAM 2037 MB) — attempt1 chạy ngay. Đáng tiếc attempt1
  bị reboot giết ở pass 3/20.
- Cờ cc1f9de0 (01:13:56Z) TỚI MUỘN: T4 đã đóng (hạn 01:00Z, poller
  dừng exit 5, .done 01:08Z) trước khi cờ xuất hiện 14 phút. Cờ vẫn
  có giá trị: boot cc1f9de0 hiện ĐÃ ĐỦ ĐIỀU KIỆN chạy WebKit (postboot
  PASS, GST 269, 11/11 package) — đợt 135 có thể đo ngay trên boot
  này nếu nó còn sống (không cần chờ replay/repair lại), với lưu ý
  RAM lúc đóng chỉ 624–759 MB (dưới gate A — cần đợt hồi RAM như
  đợt 133).
- Cờ stale d2e66749 đã archive (`POSTBOOT_PASS.stale-d2e66749`, b86
  00:00:05Z); thư mục round134-t5/ hiện chỉ có 1 cờ PASS duy nhất
  (cc1f9de0) — không mâu thuẫn cờ.

## 8. PHA 2 — Lượt yên #11: KHÔNG CÓ DỮ LIỆU (P1–P7 đều KHÔNG KIỂM ĐƯỢC)

### 8.0 Dữ liệu đầu vào (không đủ trigger pha 2 đầy đủ)

- T4.done 01:08Z: "0 attempt hợp lệ (attempt1 bị reboot giết giữa
  pass 3/20); median: không có số; (c2): không có; log draw: không
  đo được". **Không có JSON attempt đầy đủ nào** — chỉ có JSON
  partial attempt1 (257.631 B, sha256
  `b402b3f3f83137a785303784eeb3a02c6653b1413b34552dce230533d3766bc6`,
  khớp tiền tố T4 công bố) + `b.json`.
- Script pha 2 gốc `t5-c2-drawlog-analysis.py` (copy từ đợt 133,
  py_compile OK) **KHÔNG chạy được** trên partial: cần flip.wallMs
  (None) + labellag T4 đầy đủ (không có). Không sửa script sau khi
  thấy dữ liệu (giữ nguyên bản cho đợt sau dùng lại trên JSON đầy
  đủ) — cùng quyết định như T3 với script bước 2 của họ (§3.1 LIMITS
  T3).
- Thay thế: script riêng `t5-partial-drawlog-check.py` (mới, chỉ đọc
  JSON gốc, tự tính lại mọi số) — output
  `t5-partial-drawlog-check.txt` (exit 0).

### 8.1 Kết quả — kiểm tra độc lập JSON partial (khớp 100% với T3)

| Hạng mục | T5 tính lại (độc lập) | T3 công bố (LIMITS T3 §3.2) | Đối chiếu |
|---|---|---|---|
| flip | afterPass=5, wallMs=None (chưa tới) | như vậy | **KHỚP** |
| passes | 2 (trường top-level `passesDone`=2) | 2 | **KHỚP** |
| blendTick | n=23, seq 0→22 | n=23 | **KHỚP** |
| tickCost | n=27, median **58,0 ms** (chỉ pre-flip) | n=27, median 58 ms | **KHỚP** |
| c2DrawLog | n=53: drawSrc 27 / rawUnit 26; loopNo {1: 53}; wrap 0; frameIdx 0–65 (distinct 17); ct 0–2,167 s; wallMs 9696→12741 (span 3045 ms) | y hệt | **KHỚP** |
| drawSrc lag | floor(ct*30)−frameIdx: {−1: 19, 0: 8} | (T3 không báo riêng) | — |
| rawUnit lag | floor(ct*30)−frameIdx: {−1: 19, 0: 7} | (T3 không báo riêng) | — |
| srcKind / readyState / seeking | 'canvas 1280x720' 53/53; readyState 4: 53/53; seeking False: 53/53 | y hệt | **KHỚP** |
| tick post-flip | **0** (flip.wallMs=None) | 0 | **KHỚP** |

- Bổ sung của T5 so với T3: rawUnit lag {−1: 19, 0: 7} (cùng mẫu
  với drawSrc: không entry nào ≥+1 — không có draw trễ sau ct trong
  cửa sổ pre-flip ngắn này; nhưng cửa sổ chỉ 3 s đầu, loop 1 duy
  nhất, KHÔNG dùng làm bằng chứng P7).
- Ghi chú nhỏ về T3 §7.5: T3 ghi "đọc `results.b.passesDone` được
  `None`" — trường `passesDone` nằm ở **cấp top-level** của JSON
  (giá trị 2), không nằm trong `results.b`. T3 xác nhận 2 pass bằng
  `len(passes)=2` (đúng); T5 ghi rõ vị trí trường để khỏi nhầm.
- **Đọc đúng về fix logger:** log partial n=53 toàn loop 1, 0 wrap
  — fix (ghi mọi loop ≥1) **CHƯA ĐƯỢC CHỨNG MINH ở runtime** (chưa
  có cơ hội ghi loop ≥3: video mới chạy ~1 pass thì probe chết).
  Đây không phải bằng chứng chống lại fix, cũng không phải bằng
  chứng ủng hộ — chỉ là "chưa kiểm được". T3 + T4 đề xuất GIỮ fix
  cho đợt 135 (xem §10).

### 8.2 Verdict từng dự báo P1–P7: TẤT CẢ KHÔNG KIỂM ĐƯỢC

- **P1: KHÔNG KIỂM ĐƯỢC** — 0 tick post-flip → 0 run, 0 (c2).
- **P2: KHÔNG KIỂM ĐƯỢC** — 0 (c2); không có lag nào để đếm.
- **P3 (A1): KHÔNG KIỂM ĐƯỢC** — 0 (c2); không có cặp tick kề.
- **P4: KHÔNG KIỂM ĐƯỢC** — (c2) skp=0 = 0 và skp=1 = 0; số 0 ở đây
  là "không có dữ liệu", KHÔNG phải "đạt 0".
- **P5: KHÔNG KIỂM ĐƯỢC** — không có ghostPix post-flip
  (snap/raw/label-floor/run: n/a).
- **P6: KHÔNG KIỂM ĐƯỢC** — không có ghost occ post-flip
  (histogram: n/a).
- **P7: KHÔNG KIỂM ĐƯỢC** — log n=53 toàn loop 1, 0 wrap; không có
  (c2) để đối chiếu; logger mới chưa được kiểm chứng runtime.
- **Verdict tổng: KHÔNG CÓ VERDICT MỚI.** Prereg ghost-freeze/skew
  ĐỨNG NGUYÊN theo kết quả đợt 133. **Cộng dồn GIỮ NGUYÊN: P1 14/14,
  P3 13/14** (từ #9+#10) — không cộng thêm lượt #11 vì không có dữ
  liệu. **Ngưỡng ≤60 ms GIỮ NGUYÊN** (không có số mới; 9 lượt trước:
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms,
  trung bình 46,9 ms). T5 không dùng kết quả đợt này để đổi ngưỡng/
  bar/DEF.
- Đối chiếu với T3 bước 2: T3 đóng trước (LIMITS T3 §4 ghi "T5 pha 2
  CHƯA CÓ lúc T3 đóng" — đúng lúc đó, vì T5 còn đang chờ A2 trigger
  tới 01:10Z). Nay T5 pha 2 đã xong: **khớp 100% với T3 trên mọi số
  partial** (§8.1) + **khớp verdict "không có dữ liệu mới"** + bổ
  sung rawUnit lag + vị trí trường passesDone. Không có số nào lệch
  giữa hai lần tính độc lập (T3 vs T5, hai script khác nhau).

## 9. Headroom inotify + RAM

### 9.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 133 mở / cuối (T5) | 2625 / 2623 | boot 07da9c50 |
| **Đợt 134 mở (T5, boot d2e66749)** | **2506** (lần đo 1: 2515, lần 2: 2506 — dao động ±10 giữa 2 lần đo liên tiếp) | **headroom-open.txt** |
| **Đợt 134 cuối (T5, boot cc1f9de0)** | **2499** | **headroom-end.txt** |

- Giảm ~120–125 so với cuối đợt 133 (2623 → 2499 qua 2 reboot +
  ~100 phút). Chuỗi dài hạn: …2846 → 2844 → 2851 → 2849 → 2735 →
  2735 → 2737 → 2737 → 2625 → 2623 → **2506 → 2499**. Vẫn gấp
  ~1,6 lần số watch vite thường cần (~1586). **Vite thường chạy
  được. Chưa tới ngưỡng báo user (< ~1.800) — chỉ theo dõi** (còn
  ~700). Trần 63747 cần can thiệp host — ngoài tầm luồng này.

### 9.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

- Toàn phiên T5 (23:45Z–01:15Z): **438–2350 MB**.
- Các mốc đáng nhớ: mở đợt 694 MB (23:45Z) → 1774 MB (23:46Z) →
  904 MB (watcher b85 poll 1) → 2350 MB (poll 2, cao nhất phiên) →
  1680 MB (boot 81335571 mở) → 1299/1228 MB (b86 poll 1–2) →
  737 MB (b86 poll 6, lúc TRIGGER (B)) → 1586–1876 MB (boot
  1d2e984d) → 1483–1557 MB (boot cc1f9de0 mở) → **438 MB (00:37Z,
  thấp nhất phiên, giữa lúc installs)** → 536–761 MB (lúc replay
  chạy) → **1076 MB (00:56:27Z) / 1048 MB (T4 poll #50)** — vượt
  gate A ≥1024 MB nhưng postboot vẫn FAIL nên không mở cửa →
  624–759 MB lúc T5 đóng.
- RAM ≥1024 MB xuất hiện nhiều lần nhưng **không đồng thời với
  postboot PASS** trong hạn T4 — cửa sổ đo #11 không bao giờ mở
  (khác đợt 133: cờ + RAM cùng đạt ở poll #3). Birefnet không thử
  (mọi số đều < 6 GB guard).

## 10. Fix instrumentation T3 — trạng thái cuối (T5 chỉ ghi nhận, không sửa)

- preview.tsx md5 cuối: **530e10a7** (fix còn nguyên sau 4 reboot;
  T5 kiểm lúc mở 23:45Z là 805409f0, lúc 23:50:43Z đã là 530e10a7,
  lúc đóng 01:15:45Z vẫn 530e10a7). media.ts `2c384ed1`,
  vite.config.ts `ee80d093` — KHÔNG ĐỔI.
- T3 (LIMITS T3 §5) + T4 đề xuất **GIỮ fix cho đợt 135** (điều kiện
  revert "sau khi đo" chưa xảy ra; revert lúc này phí lần sửa đã
  duyệt; bản gốc 805409f0 vẫn còn nguyên tại
  `round134-t3/preview.tsx.orig-805409f0` nên revert sau vẫn làm
  được trong 1 bước). **Quyết cuối thuộc về parent** — T10 ghi vào
  §12 LIMITS gộp. T5 đồng ý với đề xuất GIỮ (không có dữ liệu mới
  nào chống lại fix; log partial n=53 không bác bỏ fix).
- preview.tsx KHÔNG nằm trong stage file của T5 (việc của T3; T3
  cũng không stage nó — net-change là sửa đã duyệt nhưng chưa
  revert; T10 đối chiếu md5 lúc đóng).

## 11. R9 (a) vẫn mở (ghi nhận, nhắc lần 17)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Đợt 134 là bằng chứng mạnh nhất cho R9 (a): **4 reboot giữa lượt
  trong ~70 phút, 2 reboot trong ~1 phút, 1 boot sống <1 phút** —
  T4 phải khởi động lại poller **4 lần**, T5 phải làm lại pha 1
  **4 lần** (b85→b86→b87 + 1 boot không kịp làm gì), 1 lần repair bị
  giết giữa chừng. Vá §8.4(ii) + cờ gắn boot_id + watcher v5/v6 xóa
  cờ stale + T4 tự restart poller đã giảm thiệt hại (T4 tự phục hồi
  4 lần không cần can thiệp ngoài), nhưng không thay thế R9 (a):
  nếu có watcher bắt boot mới ngay từ đầu lượt thì T5/T4 đã không
  mất ~10–20 phút mỗi lần reboot để phát hiện + làm lại.
- Nhắc lần 17.

## 12. Nợ mở sang đợt sau

1. **Lượt yên #11 đo lại đợt 135 với logger đã nới (530e10a7)** —
   nếu parent GIỮ fix (câu hỏi §12 gộp #1): đo lại #11 trên boot
   cc1f9de0 nếu còn sống (postboot đã PASS, cờ 01:13:56Z còn hiệu
   lực cho boot này — nhưng RAM lúc đóng chỉ 624–759 MB, cần đợt
   hồi RAM; và boot có thể đã chết trước đợt 135) hoặc boot mới.
   Đây là phép đo kiểm chứng loop ≥3 lần đầu tiên.
2. **GIỮ hay REVERT fix 530e10a7** — chờ quyết parent (T10 ghi §12
   gộp). T3 + T4 + T5 đều đề xuất GIỮ.
3. **A2 đã chứng minh live** — cập nhật trạng thái widen: từ đợt
   135, ghi "A2 đã kích hoạt live đợt 134 (plugins-bad)" thay vì
   "chờ kích hoạt live". Watcher v6 giữ nguyên (không cần sửa thêm
   cho A2). Nếu replay boot sau lại bỏ qua 1 gói khác, A2 bắt tiếp
   theo cùng luật.
4. **Điều tra vì sao replay bỏ qua gstreamer1.0-plugins-bad** (xem
   §6.1) — ngoài tầm T5 đợt này; gợi ý T6/T10 xem log của wrapper/
   reconcile (apt-get 7121 thoát không để lại entry history cho
   chính gói đó). Nếu lặp lại ở boot sau thì đây là mẫu hệ thống,
   không phải nhiễu 1 lần.
5. **Boot cc1f9de0 hiện PASS + có cờ** (01:13:56Z, poll 53) — nếu
   boot còn sống tới đợt 135 thì T4 đợt 135 gate 0 có thể dùng cờ
   này (kiểm boot_id/btime khớp trước khi dùng, theo bài học đợt
   132 §5.1). Nếu boot đã chết thì cờ thành stale và watcher đợt
   sau archive như thường lệ.
6. **Đồng hồ cell chạy nhanh hơn giờ host** (§2.4) — khi đối chiếu
   log qua reboot, dùng boot_id + thứ tự sự kiện, không chỉ giờ
   tuyệt đối. T10 lưu ý khi đóng sổ các mốc reboot đợt này.
7. **Replay boot cc1f9de0 cài 252 installs (nhiều hơn baseline
   221)** — seed list boot này lớn hơn (thêm gdb, pocketsphinx…).
   Baseline replay KHÔNG còn giá trị tuyệt đối (1509/217 → 1551/222
   → 1545/221 → 1730/252). Tiêu chí PASS vẫn là postboot exit 0 +
   GST đủ + apt đủ 11 package, không phải số dòng/installs.
8. **GST 120 file trước repair** — plugins-bad chiếm 149/269 file
   GST. Nếu boot sau thiếu plugins-bad nữa thì GST sẽ lại ~120 —
   đừng đọc nhầm "GST 120" thành "(A) cũ" (GST<100 mới là (A); 120
   không <100 nên (A) không bắt — đúng là việc của A2).
9. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 133 §11 + quyết
   parent §12.3: mù #52 đóng, mù #53 mới (việc T2 — probe #53);
   G1 chờ user quyết; birefnet (chỉ thử lại khi quan sát được
   available ≥ 6 GB, u2net là fallback chính thức); ci-security.yml
   vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi +
   KHÔNG push khi user chưa nhắn "push đi".

## 13. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (md5 805409f0 lúc mở → 530e10a7
  do T3 sửa → 530e10a7 lúc đóng; T5 không đụng file này).
  `media.ts`: KHÔNG đổi (`2c384ed1`); `apps/web/vite.config.ts`:
  KHÔNG đổi (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 4 lần
  (header + dòng `say`; md5 `55f6b3df…` → `512aed0e…` →
  `a075aafc…` → `1c95c6dd…` → `b568049b…`; không đổi logic).
- Watcher v6 trong hidden_files (KHÔNG stage): b85 (`a6b1e6d3…`,
  2 poll, cờ d2e66749), b86 (`44eeef7e…`, 14 poll, TRIGGER (B) +
  repair bị reboot giết), b87 (`db0d069b…`, 53 poll, **TRIGGER A2
  poll 49+50** + repair OK + cờ cc1f9de0); `bash -n` OK cả 3.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock/queue của luồng khác.
- `tsc` / `vite build`: KHÔNG chạy (không sửa production; tsc 0 +
  vite build PASS là của T3 lúc sửa preview.tsx).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM 438–2350 MB
  < 6 GB).
- Postboot: d2e66749 PASS 4/4 (poll0 + watcher 2 poll + final);
  81335571 FAIL (poll0 + watcher 14 poll + verify pre-repair);
  cc1f9de0 FAIL tới poll 51 rồi **PASS từ poll 52** (sau repair) +
  cờ poll 53. **--repair: 2 lần chạy, 1 lần hoàn tất** (81335571 bị
  reboot giết giữa update; cc1f9de0 hoàn tất <90 s) — mỗi boot tối
  đa 1 lần, đúng luật once-only theo từng boot.
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=YES:
  (B) poll 6 b86 + (A2) poll 49+50 b87** — cả 2 đều qua kiểm chứng
  độc lập 5/5 trước repair. **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG
  KÍCH HOẠT lần nào** (d=no hoặc chưa đủ 2 lần kiểm cách nhau ≥15
  phút trong mọi trường hợp).
- **Widen trigger A2: KÍCH HOẠT LIVE LẦN ĐẦU (§6)** — bắt hình dạng
  "replay xong nhưng thiếu plugins-bad", repair 1 lần OK, cờ PASS.
- Headroom: 2506/2515 (mở) → 2499 (cuối).
- RAM thấp nhất phiên: 438 MB (00:37Z, giữa installs); cao nhất
  2350 MB (watcher b85 poll 2).
- Stale vite.lock: không có (không kiểm lock dir đợt này — ghi rõ:
  T5 không đụng lock/queue; T6 kiểm lockhealth).
- **Pha 2 (c2): KHÔNG CÓ DỮ LIỆU — P1–P7 đều KHÔNG KIỂM ĐƯỢC
  (0 tick post-flip, 0 (c2)).** Kiểm tra độc lập JSON partial khớp
  100% số của T3 (log draw n=53 toàn loop 1, 0 wrap; tickCost median
  58,0 ms pre-flip). Cộng dồn P1 14/14, P3 13/14 GIỮ NGUYÊN. Ngưỡng
  ≤60 ms GIỮ.
- **Reboot GIỮA LUỘT: 4 lần** (d2e66749→81335571, 81335571→52ca5d6d,
  52ca5d6d→1d2e984d, 1d2e984d→cc1f9de0) + 1 reboot trước khi T5 mở
  (07da9c50→d2e66749). T5 làm lại pha 1 bốn lần; không luồng nào
  của T5 mất việc vĩnh viễn (mọi log/watcher đều ghi lại được).

## 14. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 4 lần:
  header + dòng `say` cho 4 boot; md5 cuối `b568049b…`; không đổi
  logic).
- `docs/PHASE9_ROUND134_T5_INFRA_LIMITS.md` (file này — mới; pha 1
  A2 live + pha 2 không dữ liệu).
- Harness trong hidden_files (KHÔNG stage): `round134-t5/`
  (t5-start.txt, t5-newboot-state.md, t5-boot3-state.md,
  t5-boot4-state.md, headroom-open/end.txt (2506/2499),
  ram-open/end.txt, postboot-check.md5.before/after (+.before2/
  after2, .before3/after3, .before4/after4), watcher.md5.before/
  after (+.after-newboot, .after-boot4), t5-postboot-poll0.log,
  t5-postboot-final.log, t5-postboot-newboot-poll0.log,
  t5-postboot-boot3-poll0.log, t5-postboot-boot4-poll0.log,
  t5-verify-pre-repair.log, t5-verify-pre-repair-A2.log,
  t5-repair-newboot.log (bị reboot giết giữa update),
  t5-repair-A2.log (repair OK), `POSTBOOT_PASS` (cờ gate-visible —
  boot cc1f9de0, PASS 01:13:56Z poll 53),
  `POSTBOOT_PASS.stale-d2e66749` (cờ cũ đã archive),
  `t5-wait-replay-b85.sh` + `.log` + `.nohup.log`,
  `t5-wait-replay-b86.sh` + `.log` + `.nohup.log`,
  `t5-wait-replay-b87.sh` + `.log` + `.nohup.log`,
  `t5-postboot-b85-poll*.log` (2 file),
  `t5-postboot-b86-poll*.log` (14 file),
  `t5-postboot-b87-poll*.log` (53 file),
  `t5-c2-drawlog-analysis.py` (copy từ đợt 133, py_compile OK —
  KHÔNG chạy được trên partial, giữ cho đợt sau),
  `t5-partial-drawlog-check.py` + `t5-partial-drawlog-check.txt`
  (kiểm tra độc lập JSON partial, khớp 100% số T3)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round134-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round134-t5.done` (ghi rõ: A2 KÍCH HOẠT
  LIVE (plugins-bad, repair OK, cờ cc1f9de0 01:13:56Z) + lượt yên #11
  KHÔNG ĐO ĐƯỢC (0 attempt, P1–P7 không kiểm được)).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Pha 2 (c2) — chạy lại phân tích log draw khi có JSON attempt ĐẦY ĐỦ + labellag T4:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round134-t5/t5-c2-drawlog-analysis.py <json-t4-day-du> <labellag-t4.txt> <out.txt>
# Pha 2 (han che) — kiểm tra JSON partial (flip chua toi):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round134-t5/t5-partial-drawlog-check.py <json-partial> <out.txt>
# Histogram #11 bằng code T3 (khi có JSON đầy đủ; không sửa script T3):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round134-t3/t3-step2-verify.py <json-t4-day-du> <out.txt>
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```

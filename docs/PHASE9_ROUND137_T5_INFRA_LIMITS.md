# PHASE9_ROUND137_T5_INFRA_LIMITS — 2 BOOT trong 1 lượt: boot 2104246b CHẾT GIỮA LUỘT (replay dở 110/221 installs, cờ không kịp viết) + boot 17db9652 replay NHANH từ cache (1545/221, cờ 09:43:47Z) + started_at VIẾT LẠI 1 lần (+46 s, giả thuyết đứng lần 8) + Lượt yên #14 ĐO ĐƯỢC, GIÀU EVENT: (c2)=6, P1/P2/P4/P7 DUNG, P3 SAI theo script T3 (p=0,125), P5 3/4 trong khoảng, tickCost median 59,0 ms (biên 1 ms, cao nhất 12 lượt)

> Luồng T5, đợt 137, lượt cron 15:35 +07 18/11/2026 (mở 08:35Z 18/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). T5 đợt 137 làm 3 phần theo brief: (1) postboot cho boot mới
> 2104246b + watcher b90 — boot này CHẾT GIỮA LUỘT lúc replay mới 110/
> 221 installs (cờ POSTBOOT_PASS KHÔNG BAO GIỜ được viết); (2) postboot
> lại từ đầu cho boot mới thứ 2 17db9652 + watcher b91 — replay NHANH
> nhờ cache apt SỐNG QUA REBOOT (1545/221, cờ 09:43:47Z poll 6); kiểm
> started_at lượt 137 (VIẾT LẠI 1 lần sau reboot giữa lượt, +46 s —
> giả thuyết tinh chỉnh đứng vững lần thứ 8); (3) pha 2 phân tích (c2)
> lượt yên #14 — LƯỢT QUYẾT ĐỊNH theo quyết parent đợt 136 §12.3(a):
> **ĐO ĐƯỢC, (c2)=6 (5 seq phân biệt), P1 DUNG (p≈0,0001), P2 + P4 +
> P7 DUNG, P3 SAI theo script T3 (3/6 đóng băng, p=0,125), P5 3/4
> trong khoảng (chỉ snap−label vượt 2 ms), P6 3/3 bin trong khoảng,
> tickCost median 59,0 ms (tổng) / 58,0 ms (post) — DƯỚI ngưỡng ≤60 ms
> nhưng biên chỉ còn 1 ms, CAO NHẤT trong 12 lượt yên hợp lệ; logger
> nới kiểm chứng runtime lần thứ 3 liên tiếp.** Ngưỡng ≤60 ms GIỮ
> (quyết parent đợt 136 §12.3(c) — nếu #14 median vẫn ≥55 ms thì bàn
> lại: median 59,0 ms nên việc bàn lại thuộc T10/parent, T5 không đổi
> ngưỡng). Nợ: R9 (a) vẫn chờ user — số đếm VẪN LÀ 16; G1 khung (a) M2
> vẫn hoãn. KHÔNG push. KHÔNG release/tag. KHÔNG sửa production
> (preview.tsx giữ 530e10a7 — fix của T3, T5 không đụng). CẤM kiểm
> lại TTS 39; birefnet không thử (không thuộc brief T5; việc của T9 —
> lưu ý: RAM khả dụng T5 quan sát được lần đầu VƯỢT guard 6.144 MiB,
> xem §9.2).

## 1. Kết luận ngắn

1. **BOOT 2104246b CHẾT GIỮA LUỘT — CỜ KHÔNG KỊP VIẾT.** Boot mới mở
   đợt (btime 08:07:11Z uptime -s / 08:07:26Z stat /proc/1, chênh
   15 s) sống ~1h28m, chết trong khung **(09:35:47Z, 09:36:01Z]**
   (~14 s — T4 poll #69 09:35:47Z còn sống, btime boot mới 09:36:01Z).
   Replay khởi động MUỘN (configure 08:31:35Z, boot +24m24s) và CHẬM
   vì cache apt TRỐNG (0 .deb lúc mở — phải DOWNLOAD): tới lúc chết
   mới 110/221 installs (753 dòng dpkg.log, GST 107 file); giao
   dịch plugins-bad một mình mất ~23m21s (09:10:34–09:33:55Z) chỉ để
   download. Watcher b90 (51 poll, 08:45:40–09:36:02Z) TRIGGER=NO cả
   51 poll (đúng — replay đang sống), chết theo reboot ở poll 51.
   Postboot poll0 FAIL exit 1 lúc 08:45:15Z (đúng — replay đang chạy).
   **--repair: 0 lần. A2/(B)/(C): 0 lần kích hoạt (đúng).**
2. **BOOT 17db9652 — REPLAY NHANH NHỜ CACHE SỐNG QUA REBOOT.**
   Boot mới thứ 2 (btime 09:36:01Z / 09:36:16Z, chênh 15 s): replay
   khởi động NHANH (configure 09:36:50Z, boot +49s), apt-get update
   pid 806 + wrapper pid 783 đang chạy lúc +1m30s; **cache apt 133
   .deb / 79M SỐNG QUA REBOOT** (khác boot 1: 0 .deb lúc mở) nên cài
   gần như toàn bộ từ cache: dpkg 2 → 1545 dòng / 221 installs
   (TRÙNG baseline), gói cuối gstreamer1.0-tools 09:42:06Z (boot
   +6m05s); GST 269 file; lists 71; partial 0; term.log 0 dòng
   `Get:` (cài từ cache). Postboot poll0-boot2 FAIL exit 1 lúc
   09:38:36Z (chỉ thiếu 5 gói GST); watcher b91 poll 2 đã PASS exit
   0 (09:39:45Z, boot +3m44s); **cờ `POSTBOOT_PASS` viết 09:43:47Z
   (poll 6, boot +7m46s)**, watcher exit 0. T4 đọc cờ ở poll #10
   (09:44:26Z, 39 s sau khi ghi) và mở cửa yên, attempt1 chạy xong
   exit 0 09:48:32Z. **--repair: 0 lần.**
3. **STARTED_AT LƯỢT 137: BỊ VIẾT LẠI ĐÚNG 1 LẦN — GIẢ THUYẾT ĐỨNG
   VỮNG LẦN THỨ 8 (§6).** Run đợt 137 `832a52f5`: sched =
   started_at = 1794990951 (08:35:51Z) lúc mở (jitter 0 s); sau
   reboot giữa lượt 09:36:01Z, started_at thành 1794994607
   (09:36:47Z) = btime (/proc/stat) + **46 s** (hoặc +31 s theo
   stat /proc/1 09:36:16Z) — trong dải 31–46 s của mọi lần viết lại
   trước. Chuỗi offset sau btime: 46 / 31 / 36 / 40 / 36 / **46** s.
   Run đợt 136 `7283f96f`: started_at VẪN 1794980151, status nay
   `succeeded` — không viết lại lần 2.
4. **LƯỢT YÊN #14 ĐO ĐƯỢC, GIÀU EVENT — KHÔNG CÒN THƯA (§8).**
   Attempt1 T4: 20/20 pass, run-attempt exit 0 09:48:32Z, JSON
   2.780.813 B, sha256 `d0585125…`, flip afterPass=5 wallMs=29353,
   engine webkit 27.2, pageErrs=[]. **tickCost median 59,0 ms**
   (n=518; post n=378 median 58,0) — DƯỚI ngưỡng ≤60 ms nhưng **biên
   chỉ còn 1 ms, CAO NHẤT trong 12 lượt yên hợp lệ** (trước đó cao
   nhất 58,0 ms). (c2)=6 (skp=0; 5 seq phân biệt — seq 145 xuất hiện
   2 lần với label 15/16), skp=1 = 0; lag toàn +1f (×5) và +2f (×1),
   0 lag âm, 0 lag ≥+5f. Coverage 6/6; blendTick hậu-flip 296/296
   trong ±500 ms của log. **P1: DUNG (6/6 trong ±1 tick run-end,
   p≈0,0001 — mạnh nhất từ trước tới nay)**; **P2: DUNG**; **P3:
   SAI theo script T3 (3/6 đóng băng-tai-tick, p=0,125; 3 tick còn
   lại là "bắt kịp" +837/+950 ms — ghi riêng theo thiết kế A1)**;
   **P4: DUNG (cả 4 tiêu chí con trong khoảng)**; **P5: 3/4 trong
   khoảng** (chỉ snap−label 50 ms vượt 34–48 đúng 2 ms — lần thứ 2
   liên tiếp ngoài khoảng, sau 52 ms ở #13); **P6: 3/3 bin trong
   khoảng** (không verdict theo thiết kế); **P7: DUNG (làm yếu
   desync)** — coverage 6/6, 0 entry ≥+1 (caveat: log thưa, drawSrc
   gap median 108 ms). **Cộng dồn: P1 28/28, P3 24/28, P7 9/9.**
   Logger nới kiểm chứng runtime **lần thứ 3 liên tiếp** (c2DrawLog
   n=996, loop 1–21, 20 wrap, 1 epoch).
5. **Headroom inotify: 2178 (mở boot 1) → 2168 (mở boot 2) → 2168
   (cuối)** — giảm ~108 so với cuối đợt 136 (2276); vẫn trên ngưỡng
   báo user (< ~1.800) ~368, chỉ theo dõi. RAM phiên T5:
   **518–6.781 MB** (tự đo theo MemAvailable); Balloon **0–
   6.443.824 kB** — lần đầu trong phiên T5, balloon về 0 kB lúc
   09:00:26Z và RAM khả dụng **6.781.936 kB (≈6.623 MiB) VƯỢT guard
   birefnet 6.144 MiB** (xem §9.2 — T5 chỉ ghi nhận, không thử
   birefnet; quyết thuộc T9/parent).
6. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (mỗi đợt nhắc 1 lần;
   không tăng, không viết 17).
7. **dmesg KHÔNG ĐỌC ĐƯỢC đợt này** (trả về rỗng — xem §9.4): bước
   kiểm "lưu dmesg/journalctl" đã phê duyệt cho T8 (quyết parent
   đợt 136 §12.3(i)) có thể bị ảnh hưởng — ghi để T8/T10 biết.
8. **Stale vite.lock: KHÔNG KIỂM đợt này** (T5 không đụng
   lock/queue; T6 kiểm lockhealth — ghi rõ để khỏi đọc thành "đã
   kiểm là sạch").

## 2. Timeline — 2 boot trong 1 lượt (đợt 137)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 2104246b | 08:07:11 (uptime -s) / 08:07:26 (stat /proc/1) | ~1h28m | Replay muộn + chậm (cache trống, phải download); chết giữa lượt lúc 110/221 installs; cờ KHÔNG kịp viết; watcher b90 chết ở poll 51 |
| 2 | 17db9652 | 09:36:01 (uptime -s) / 09:36:16 (stat /proc/1) | còn sống (09:53Z: ~17 phút) | Replay nhanh từ cache (1545/221, boot +6m05s); postboot PASS; cờ 09:43:47Z poll 6; T4 attempt1 20/20 pass |

- Chốt chặn `round-in-progress.md` TỒN TẠI suốt phiên T5 — là marker
  MỞ ĐỢT 137 do parent tạo (08:35Z), KHÔNG phải đợt main-chat
  (tiền lệ đợt 130–136). T5 tiến hành bình thường.
- Chênh btime 15 s ở CẢ 2 boot (ghi rõ, không phải mâu thuẫn):
  boot 1: uptime -s 08:07:11Z vs stat /proc/1 08:07:26Z; boot 2:
  uptime -s 09:36:01Z vs stat /proc/1 09:36:16Z; `who -b` khớp
  uptime -s ở cả 2 boot; journal first entry chậm hơn btime ~16 s
  ở boot 1 (08:07:27Z theo T2 — cùng mẫu #92?). Cờ POSTBOOT_PASS
  của T5 ghi btime theo `stat /proc/1` (quy ước từ đợt 134);
  poller T4 ghi btime theo uptime -s. Cùng boot_id thì chênh này
  không ảnh hưởng khung chết. T2-137 đã xác minh btime boot 1 =
  1794989231 qua 3 nguồn + journal (F93? ≈ −1 s).
- **Khung chết boot 1 (09:35:47Z, 09:36:01Z] (~14 s):** mốc cuối
  còn sống là T4 poll #69 09:35:47Z (dpkg 753, RAM 492 MB) + lần
  kiểm của T5 09:35:14Z (dpkg 753/110); mốc đầu chết là btime boot
  2 09:36:01Z. Caveat: watcher b90 poll 51 ghi timestamp 09:36:02Z
  nhưng vẫn đọc được dpkg.log CŨ (753 dòng) — đồng hồ cell cũ chạy
  nhanh hơn giờ thực (hiện tượng đã ghi đợt 134), nên timestamp
  poll 51 KHÔNG dùng làm mốc chết; khung 14 s lấy từ poll T4 +
  btime mới. T2/T6 kiểm lại khung này (việc của họ).
- Số thứ tự boot: boot 1 = **#93? TẠM** (T2-137: dải dự báo cho
  #93? [05:56:47Z, 07:55:21Z] SAI — btime 08:07:11Z NGOÀI dải, muộn
  710 s; đoạn A mù #56 MỞ nên boot mới có thể là #94?–#96?; chờ
  T6/T10 đối chiếu). Boot 2 chưa có số tạm từ T2 (T2 đóng ~09:07Z,
  TRƯỚC reboot 09:36Z) — việc T6.

### 2.1 Boot 2104246b — replay muộn + chậm vì cache trống, chết lúc 110 installs

- Lúc T5 mở (08:41:00Z): btime 08:07:11Z, tuổi ~34 phút. dpkg.log
  **2 dòng / 0 installs** (configure 08:31:35/36Z = boot +24m24s —
  khởi động MUỘN, muộn thứ 3 sau #54? +47m14s và #72? +25m22s).
  GST 0 file (thư mục chưa tồn tại); lists 3; partial 0.
  **apt-get update pid 856 + wrapper os-intent pid 831 ĐANG CHẠY**
  — replay ĐÃ BẮT ĐẦU (khác dạng (B): có proc apt). **Cache apt
  TRỐNG: 0 .deb / 0 byte** (khác đợt 136: 178 .deb / 156M bền vững)
  — replay lần này PHẢI DOWNLOAD toàn bộ.
- **Tiến trình installs (kẹp từ dpkg.log + quan sát live):**
  installs bắt đầu ~08:41Z (aspell, pid 3058) → 20 installs
  08:46:41Z → 48 installs 08:51:38Z (libevent-2.1-7t64 — gói NEED
  đầu tiên) → 56 installs 08:53:30Z → **im 09:01:42Z–09:10:32Z**
  (dpkg đóng băng 566 dòng / 83 installs — đang download nhóm
  gstreamer) → gstreamer1.0-libav xong 09:10:32Z → **giao dịch
  gstreamer1.0-plugins-bad 09:10:34–09:33:55Z (~23m21s, 1 apt-get
  pid 18644, etime tới 20:55, CPU ~0,1–0,5%)** → 110 installs /
  753 dòng 09:33:55Z, GST 107 file → **CHẾT ~09:35:5xZ**.
  Bracket replay: (configure +24m24s, chết lúc 110 installs] —
  replay KHÔNG xong; khoảng PASS không tồn tại trên boot này.
- **Download có tiến triển thật (kiểm chứng ctime, xem F-137-T5-1):**
  cache 0 → 16 .deb (08:46Z) → 37 (08:51Z) → 51 (08:58Z) → 69
  (09:06Z) → 85 (09:15Z) → 102 (09:19Z) → 110 (09:23Z) → 118
  (09:29Z) → 123 (09:31Z) → 131 (09:33Z); 11 file có ctime sau
  09:19Z. apt-get pid 18644 sống suốt, http method pid 18654 sống
  — download chậm (mirror chậm + nhóm GST lớn), KHÔNG phải kẹt
  (khác dạng (C) #64?: partial 0 file nhưng cache tăng đều; luật
  (C) form (d) không đạt — dpkg 656 dòng, không phải ≤2 dòng).
- **term.log 0 dòng `Get:`** — nhưng đây KHÔNG phải bằng chứng
  "không download": apt ghi `Get:` vào term.log theo cách khác với
  kỳ vọng của T5 các đợt trước (đợt 136 cũng 0 dòng `Get:` dù cài
  từ cache; đợt này download thật nhưng term.log vẫn 0 `Get:` —
  xem F-137-T5-1: T5 đã dùng ctime để kiểm chứng thay cho `Get:`).
  term.log của boot 1 MẤT theo reboot (không đối chiếu được sau).
- RAM lúc mở ~753 MB (MemAvailable) + Balloon 6.140.668 kB —
  balloon PHÌNH TRỞ LẠI sau đợt 136 xả −4,70 GB; gate A ≥1024 MB
  của T4 bị chặn suốt boot 1 (RAM T4 đo 492–517 MB lúc cuối).
- preview.tsx md5 lúc mở = **530e10a7** (fix T3 còn nguyên).

### 2.2 Boot 17db9652 — replay nhanh từ cache sống qua reboot

- Boot lúc T5 kiểm lại (09:37:31Z): btime 09:36:01Z, tuổi ~1m30s.
  dpkg.log **2 dòng / 0 installs** (configure 09:36:50Z = boot
  +49s — khởi động NHANH, ngang lớp #63? +48s). **apt-get update
  pid 806 + wrapper os-intent pid 783 ĐANG CHẠY** — replay ĐÃ BẮT
  ĐẦU (khác dạng (B): có proc apt).
- **Cache apt SỐNG QUA REBOOT: 133 .deb / 79M lúc mở** (khác boot
  1: 0 .deb) — cache này là cache boot 1 download được (131 .deb
  lúc chết + 2). Nhờ đó replay cài gần như toàn bộ từ cache:
  installs bắt đầu ~09:37:5xZ → 69 installs 09:38:44Z (watcher
  poll 1) → 169 installs 09:39:45Z (GST 269 file — ĐẦY ĐỦ) →
  218 installs 09:42:00Z → **1545 dòng / 221 installs, gói cuối
  gstreamer1.0-tools 09:42:06Z (boot +6m05s)**; lists 71; partial
  0; cache cuối 178 .deb (= đúng số đợt 136). term.log 0 dòng
  `Get:` (cài từ cache — nhất quán đợt 136).
- Postboot poll0-boot2 09:38:36Z: **FAIL exit 1** (chỉ thiếu 5 gói
  GST: good/bad/ugly/libav/x; 5 lib đã PASS; GST 32 file lúc đó).
  Watcher b91 poll 2 (09:39:45Z): **postboot exit 0** (boot
  +3m44s — 11 gói đích đủ); poll 6 (09:43:47Z): PASS ổn định +
  dpkg đóng băng + 0 proc → **cờ `POSTBOOT_PASS` viết 09:43:47Z
  (boot +7m46s)**. Bracket "đủ điều kiện WebKit": (configure
  +49s, PASS +3m44s]; bracket replay đầy đủ: (configure +49s,
  xong +6m05s].
- T4 đọc cờ ở poll #10 (09:44:26Z, 39 s sau khi ghi) + gate A đủ
  (RAM 1134 MB) → **cửa mở, attempt1 chạy ngay** (exit 0
  09:48:32Z, 20/20 pass — xem §8). Không có lần mở nào bị bỏ lỡ.
- RAM lúc mở boot 2 ~1.904 MB; Balloon 4.885.304 kB.
- preview.tsx md5 lúc mở boot 2 = lúc đóng = **530e10a7**.

## 3. Postboot script — sửa 2 lần (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5 `31eec0b6…`
(cuối đợt 136) → **`4f69c943…`** (đợt 137, boot 1) → **`02ea211f…`**
(đợt 137, boot 2):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 08:41–08:45Z | 2104246b | `31eec0b6…` → `4f69c943…` | header (đoạn Dot 137 boot 1) + say: boot mới, replay muộn + cache trống — **chỉ mô tả trạng thái lúc mở, KHÔNG khẳng định kết quả poll0** (bài học F-136-T5-1 đã áp dụng) |
| 2 | 09:37–09:38Z | 17db9652 | `4f69c943…` → `02ea211f…` | header (đoạn Dot 137 boot 2) + say: boot 1 chết giữa lượt, replay boot 2 nhanh từ cache sống |

- `bash -n` OK sau mỗi lần sửa. **KHÔNG đổi logic** (không đổi thứ
  tự apt/GST, không đổi NEED/threshold).
- Lưu ý: dòng `say` đầu in `[postboot 2026-11-18 08:07:11]` (lần 1)
  / `[postboot 2026-11-18 09:36:01]` (lần 2) — đó là `$BOOT`
  (`uptime -s`), KHÔNG phải giờ chạy script. Hành vi có sẵn của
  script, không phải lỗi mới; ghi rõ để khỏi đọc nhầm timestamp
  log (đã ghi từ đợt 135 §3).

## 4. Watcher — b90 (boot 1, chết theo reboot) + b91 (boot 2, v6 — cùng logic C4/EVAL, chỉ đổi boot/header)

| Watcher | Boot | md5 | Chạy | Kết cục |
|---|---|---|---|---|
| b90 | 2104246b | `5daa7441…` | 08:45:40–09:36:02Z, 51 poll | TRIGGER=NO cả 51 poll (đúng); CHẾT theo reboot ở poll 51, cờ không kịp viết |
| b91 | 17db9652 | `d0c21ee3…` | 09:38:44–09:43:47Z, 6 poll | PASS ổn định → cờ 09:43:47Z poll 6, exit 0 |

- Copy b91 từ b90 (v6); diff sau chuẩn hoá (đổi tên round/boot/
  btime/mốc dpkg): **chỉ còn header + btime + LAST_LINE_TS — KHÔNG
  đổi logic C4/EVAL/luật (C)/ngưỡng poll nào.** `bash -n` OK trước
  khi chạy. (F-137-T5-3 ghi lại lỗi suýt mắc: header b91 lúc đầu
  còn sót tham chiếu boot 1 — đã sửa tay trước khi launch.)
- b90: `NO_FLAG_AT_START 08:45:40Z` (thư mục round137-t5/ mới,
  không có cờ stale — cờ 05:48:02Z của 1ca1feaa nằm ở round136-t5/,
  không đụng). Poll 51 cuối (09:36:02Z đồng hồ cũ): dpkg 753 /
  110 installs, GST 107, RAM 478 MB, postboot exit 1, TRIGGER=NO.
- b91: `NO_FLAG_AT_START 09:38:44Z` (cờ cho boot 1 chưa từng tồn
  tại nên không có gì để archive — đúng). Poll 1 (09:38:44Z):
  dpkg 471 / 69 installs, GST 32, postboot exit 1, TRIGGER=NO.
  Poll 2 (09:39:45Z): dpkg 1167 / 169 installs, GST 269,
  postboot exit 0. Poll 6 (09:43:47Z): frozen=yes + PASS streak 2
  → FLAG_WRITTEN 09:43:47Z.
- Lỗi hiển thị đã biết, KHÔNG sửa (đã ghi từ đợt 127 §7.3 mục 5):
  `last_install` vẫn đọc "installed" thay vì tên gói (awk lấy nhầm
  cột). Không ảnh hưởng EVAL.

## 5. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

### 5.1 Watcher b90 (boot 2104246b) — TRIGGER=NO cả 51 poll (đúng)

| Poll | Thời gian | dpkg / installs | silent | (1) FAIL tươi | (2a) 0 proc | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|---|
| 1 | 08:45:40Z | 73 / 11 | 86 s | yes | no | - (no) | **NO** |
| 2 | 08:46:41Z | 133 / 20 | 42 s | yes | no | - (no) | **NO** |
| 6 | 08:50:42Z | 133 / 20 | 283 s | yes | no | - (no) | **NO** |
| 7 | 08:51:43Z | 332 / 48 | 5 s | yes | no | - (no) | **NO** |
| 24 | 09:08:51Z | 566 / 83 | 429 s | yes | no | - (no) | **NO** |
| 34 | 09:18:55Z | 656 / 96 | 503 s | yes | no | - (no) | **NO** |
| 44 | 09:28:59Z | 656 / 96 | ~1100 s | yes | no | - (no) | **NO** |
| 46 | 09:31:00Z | 656 / 96 | 1228 s | yes | no | - (no) | **NO** |
| 51 | 09:36:02Z | 753 / 110 | 127 s | yes | no | - (no) | **NO** |

- Luật (C) ở các poll cuối: b=maybe (silent ≥900 s + partial đóng
  băng + apt sống) NHƯNG d=no (dpkg 656 dòng, không phải dạng (C)
  ≤2 dòng) → KHÔNG kích hoạt. Đúng: apt-get pid 18644 vẫn sống và
  download có tiến triển (cache tăng đều theo ctime — xem §2.1).
- **A2 KHÔNG kích hoạt — ĐÚNG:** replay chưa xong (installs>0
  nhưng proc vẫn chạy) nên dạng A2 không xét tới; postboot FAIL là
  do replay chưa xong, không phải thiếu gói sau khi xong.
- **--repair: 0 lần** (không cần — replay đang sống và tiến triển).

### 5.2 Watcher b91 (boot 17db9652) — TRIGGER=NO cả 6 poll (đúng)

| Poll | Thời gian | dpkg / installs | silent | postboot | TRIGGER |
|---|---|---|---|---|---|
| 1 | 09:38:44Z | 471 / 69 | 0 s | exit 1 | **NO** |
| 2 | 09:39:45Z | 1167 / 169 | 0 s | exit 0 | **NO** |
| 6 | 09:43:47Z | 1545 / 221 | — | exit 0 | **NO → FLAG_WRITTEN** |

- Luật (C): KHÔNG KÍCH HOẠT lần nào (a=no từ poll 2 trở đi).
- **A2 KHÔNG kích hoạt — ĐÚNG:** replay cài đủ 11/11 package
  (plugins-bad có sẵn 1.24.2-1ubuntu4 — kiểm chứng: poll0-boot2
  chỉ thiếu 5 gói GST lúc 09:38:36Z, poll 2 đã đủ hết), postboot
  exit 0 nên C1=no, C4=no.
- Tổng 2 watcher đợt này: **TRIGGER=YES: 0. Luật (C): 0 lần kích
  hoạt. --repair: 0 lần.**

## 6. Kiểm started_at — giả thuyết tinh chỉnh ĐỨNG VỮNG LẦN THỨ 8

Truy vấn `scheduler.job_runs` (qua `muse.db`, job
`vcut-build-loop`):

| Run | sched_utc | started_at_utc | Jitter | Status |
|---|---|---|---|---|
| Đợt 137 `832a52f5-4029-4a5a-b5d4-dc989dc440e8` (lúc mở, ~08:41Z) | 1794990951 (08:35:51Z) | 1794990951 (08:35:51Z) | **0 s** | running |
| Đợt 137 `832a52f5-...` (sau reboot giữa lượt, ~09:44Z) | 1794990951 (08:35:51Z) | **1794994607 (09:36:47Z)** | **+3656 s so với sched** | running |
| Đợt 136 `7283f96f-f23f-44c5-ab5a-02c22af0f3ed` | 1794980151 (05:35:51Z) | 1794980151 (05:35:51Z) | **0 s** | **succeeded** |

- **Lượt 137: BỊ VIẾT LẠI ĐÚNG 1 LẦN.** Reboot giữa lượt
  (btime boot 2 09:36:01Z theo /proc/stat) xảy ra SAU sched
  08:35:51Z; started_at mới 09:36:47Z = btime + **46 s** (hoặc
  +31 s theo stat /proc/1 09:36:16Z — cả 2 cách đọc đều trong dải
  31–46 s). Đây là **lần đầu giả thuyết được kiểm chứng TRONG
  CÙNG lượt mà reboot xảy ra** (các lần trước đều kiểm hồi tố ở
  lượt sau) — giả thuyết "viết lại một lần duy nhất tại reboot đầu
  tiên GIỮA lượt" đứng vững ở cả hai chiều, lần thứ 8.
- Chuỗi offset sau btime: 46 s (131) / 31 s (132) / 36 s (133) /
  40 s (134) / 36 s (135) / **46 s (137)** — đều trong dải 31–46 s;
  lượt 136 không thêm offset nào vì không có reboot giữa lượt.
- **Lượt 136: KHÔNG viết lại lần 2.** started_at vẫn 1794980151
  (05:35:51Z) như T5-136 đã ghi; status nay `succeeded`,
  finished 1794986857 (07:27:37Z — khớp T10 đóng ~07:26Z).
- T10 kiểm lại lúc đóng đợt 137 xem có reboot nào sau 09:44Z
  không; nếu có reboot thứ 2 giữa lượt, giả thuyết dự báo started_at
  KHÔNG viết lại lần 2 (chỉ 1 lần duy nhất).

## 7. Cờ gate-visible — tới kịp, T4 mở cửa 1 lần

- Cờ 17db9652 (09:43:47Z, poll 6) TỚI ĐƯỢC GATE: T4 poll #10
  09:44:26Z đọc `t5flag=PASS` (39 s sau khi ghi) + gate A đủ (RAM
  1134 MB, load5 1,36) → **cửa mở, attempt1 chạy ngay** (20/20
  pass, run-attempt exit 0 09:48:32Z). Không có lần mở nào bị bỏ
  lỡ. (Khác đợt 136: lần này cờ tới sau khi T4 đã restart poller
  sau reboot — poller T4 chết theo reboot ở poll #69 09:35:47Z,
  restart 09:37Z, poll lại từ đầu trên boot mới.)
- **Blockers=1 ở poll #68 T4 (09:35:02Z, boot 1) — ps snapshot ĐÃ
  LƯU (blockers-ps-68.txt + blockers-list-68.txt):** quyết parent
  đợt 136 §12.3(h) ("BẮT BUỘC log ps snapshot khi blockers>0")
  ĐÃ ĐƯỢC T4 THỰC THI đợt này. Danh tính blocker là việc của T4
  (xem LIMITS T4); T5 chỉ ghi nhận cơ chế đã hoạt động. Poll #69
  sau đó blockers=0.
- Cờ stale 05:48:02Z (1ca1feaa) vẫn ở `round136-t5/` — không đụng,
  không mâu thuẫn cờ (T4 đọc đúng `round137-t5/POSTBOOT_PASS`).
  Cờ cho boot 1 (2104246b) không bao giờ tồn tại — b91 ghi
  `NO_FLAG_AT_START` đúng.
- **Kiểm đúng đường dẫn cờ:** T5 xác nhận cờ ghi vào
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/
  round137-t5/POSTBOOT_PASS` (boot_id 17db9652, btime
  2026-11-18T09:36:16Z, pass_at 09:43:47Z poll 6) — không nhầm
  với thư mục `round137-t4/` hay cờ đợt khác.

## 8. PHA 2 — Lượt yên #14: ĐO ĐƯỢC, GIÀU EVENT — LƯỢT QUYẾT ĐỊNH

### 8.0 Dữ liệu đầu vào (đủ trigger pha 2 đầy đủ)

- Attempt1 T4: 20/20 pass, run-attempt exit 0 09:48:32Z, JSON
  `preview-b-f3-flip-webkit-t4-attempt1.json` **2.780.813 B,
  sha256 `d0585125e40051d123510d120e051e3c31366be6b1951729f496bbbce39e1c1a`**
  (T5 tự tính — khớp sha T3 rerun công bố), flip afterPass=5
  wallMs=29353, engine webkit 27.2, pageErrs=[].
- Labellag T4: `analyze-t4-attempt1-labellag.txt` ((c2) skp=0 n=6;
  (c2) skp=1 n=0).
- Script pha 2 `t5-c2-drawlog-analysis.py` (copy từ đợt 136, KHÔNG
  sửa — field label→frame đã sửa từ đợt 136) chạy được ngay trên
  JSON đầy đủ — output `t5-c2-drawlog-analysis.txt` (exit 0).
  Rerun code T3 `t3-step2-verify137.py` (đọc code, chạy lại —
  KHÔNG copy kết quả T3) — output `t5-histogram-rerun.txt`
  (exit 0).
- **Lưu ý về T4.done/T3.done:** cả hai CHƯA xuất hiện lúc T5 đóng
  (~09:55Z) — T4 đang viết LIMITS, T3 đang chờ T4.done (hạn cắt
  10:30Z). Pha 2 của T5 đối chiếu với **file analyze của T4 đã đọc
  được** (§8.5) và với **rerun code T3** (§8.6) — không phụ thuộc
  vào file .done của T3/T4 (JSON + labellag đã final từ 09:48:32Z).
  T10 kiểm lại verdict T3/T4 khi chúng xuất hiện; số liệu pha 2
  không đổi theo .done. **Rerun code T3 KHÔNG được tính là kiểm
  chứng độc lập thứ ba** (theo brief): kiểm chứng độc lập gồm 2 lần
  tính — script riêng của T5 + phân tích của T4; rerun code T3 chỉ
  là đối chiếu chéo.

### 8.1 Kết quả — tính độc lập bằng script riêng (khớp 100% với T4 + rerun T3)

| Hạng mục | T5 tính lại (độc lập) | T4 công bố (analyze T4) | Đối chiếu |
|---|---|---|---|
| JSON sha256 | `d0585125…` (2.780.813 B) | (T3 rerun: như vậy) | **KHỚP** |
| flip | afterPass=5, wallMs=29353 | như vậy | **KHỚP** |
| blendTick / tickCost | n=406 / n=518, median **59,0 ms** | n=406 / n=518, median 59,0 | **KHỚP** |
| tickCost post (flip+2000) | n=378, median 58,0 | n=378, median 58,0 | **KHỚP** |
| tickCost p90 / max / min | 81,0 / 114 / 30 | 81,0 / 114 / 30 | **KHỚP** |
| wallbands median | 58,0 / 63,0 / 57,0 / 59,0 / 62,5 / 56,0 | y hệt | **KHỚP** (p90 lệch do cách nội suy percentile khác nhau — xem §8.5) |
| c2DrawLog | n=996, loopNo 1–21, 20 wrap, 1 epoch, wallMs 11652→83996 (span 72.344 ms) | y hệt | **KHỚP** |
| (c2) skp=0 | n=6: seq 145 (×2, lag +2f/+1f), 265, 327, 368, 389 (toàn +1f) | y hệt | **KHỚP** |
| (c2) skp=1 | n=0 | n=0 | **KHỚP** |
| coverage (c2) | 6/6 (delta −25/−23/−23/−26/+46 ms) | 6/6 | **KHỚP** |
| blendTick hậu-flip trong ±500 ms log | 296/296 (100%) | 296/296 (100%) | **KHỚP** |
| lag ≥+5f | 0 event | 0 event | **KHỚP** |
| histogram (m*−label) | {−14: 5, −13: 2, −11: 6, −10: 8, −9: 2, −4: 2, −3: 2, −1: 54, 0: 207, +1: 83, +2: 118, +3: 96, +4: 7} (rerun T3) | (T3 rerun: y hệt) | **KHỚP** |
| skew | snap−label median 50,0 ms; raw−label median 10,0 ms (occ0) / 9 ms (all occ) | 50 ms / 10 ms (occ0) | **KHỚP** |
| label-floor | {0: 190, 1: 402} → +1 = 67,9% | (T3 rerun: y hệt) | **KHỚP** |
| curPix run ≥3 tick | 22 run, 83/296 tick trong run | 22 run | **KHỚP** |
| F6' | (xem LIMITS T4 — T5 không tính lại F6'; skiplatest T4: 51 tick skp=1, 0 vi phạm thật) | — | — |

- Bổ sung của T5 so với T4: B2 cặp drawSrc→rawUnit `{0: 478}`
  (rawUnit luôn cùng frame với drawSrc gần nhất); B3 chi tiết từng
  loop (drawSrc n=22–31/loop, loop 18: 1 — 1 entry biên tại wrap,
  khớp byLoop của T4 khi cộng cả rawUnit); B5 drawSrc gap median
  **108,0 ms** (min 46, max 1046; >33 ms: 517/517; >66 ms: 500/517
  — log thưa tương đương đợt 136: 109 ms, xem caveat P7 §8.4); B-P7
  chi tiết từng seq (entry gần n=16–20/seq, drawSrc lag [−1, 0],
  rawUnit lag y hệt).

### 8.2 Verdict từng dự báo P1–P7 (lượt #14 — lượt quyết định)

- **P1: DUNG (mạnh)** — (c2) 6/6 trong ±1 tick của run-end
  (seq 145 dist 0, 265 dist +1, 327 dist 0, 368 dist 0, 389 dist
  +1); đối chứng: 65/296 tick post (22,0%) gần run-end; p nhị thức
  ≈ 0,00011 (T5, baseline signed-dist 65/296) / 0,00012 (T3,
  baseline riêng 66/296 — lệch 1 tick do định nghĩa baseline khác
  nhau, xem §8.5). Tính theo seq PHÂN BIỆT: 5/5 (145, 265, 327,
  368, 389), p ≈ 0,0005 — vẫn mạnh. Run-end là (c2): 3/22 run-end
  ([145, 327, 368]). Độ dài run kết thúc tại (c2): [3, 4, 5]; run
  TB 3,8, max 6. **Đây là bằng chứng P1 mạnh nhất từ trước tới
  nay** (các lượt trước tối đa n=7 với p≈0,03 biên).
- **P2: DUNG** — 6/6 (c2) lag ≥ +1f (5× +1f, 1× +2f), 0 lag âm.
- **P3 (A1): SAI theo script T3 (p=0,125)** — đóng băng-tai-tick
  3/6 [327, 368, 389]; 3 tick còn lại là "bắt kịp" [(145, +837 ms),
  (145, +837 ms), (265, +950 ms)] — ghi riêng theo thiết kế A1,
  KHÔNG tính vào P3; 0 tick "không đóng băng" thường. Đối chứng:
  65/295 tick post (22,0%) đóng băng; p nhị thức ≈ 0,125 (cả T5
  và T3 đều tính ra 0,125). Tính theo seq PHÂN BIỆT: 3/5 đóng băng
  (327, 368, 389; 145 + 265 bắt kịp), p ≈ 0,075 — vẫn trên 0,05.
  **Ghi chú quan sát (không thay verdict script):** 3 tick "bắt
  kịp" có labelMs nhảy +837/+950 ms — tức label đã TỤT LẠI ~0,9 s
  rồi nhảy vọt tại đúng tick (c2); mẫu này nhất quán với "đóng
  băng rồi bắt kịp" hơn là với "không đóng băng". T3/T10 xem có
  tính 3 tick này vào diễn giải P3 không (không phải việc của T5
  — T5 chỉ báo số + verdict script).
- **P4: DUNG (cả 4 tiêu chí con trong khoảng)** — (c2) thuần +1f
  = 5 (dự báo 2–8); tổng skp=0 = 6 (2–12); skp=1 = 0 (đúng 0);
  lag ≥+5f = 0 (đúng 0). Khác hẳn #13 (thuần +1f = 1 < 2).
- **P5: 3/4 TIÊU CHÍ TRONG KHOẢNG** — snap−label median **50,0
  ms** (34–48 — vượt 2 ms, lần thứ 2 liên tiếp ngoài khoảng sau
  52 ms ở #13); raw−label median **10,0 ms** occ0 / 9 ms all-occ
  (8–10 — trong); label-floor +1 **67,9%** (63–76 — trong); run
  ≥3 tick = **22** (13–22 — trong, ở biên trên). Cả 3 lệch ở #13
  đã về trong khoảng; chỉ snap còn vượt, cùng chiều với tickCost
  tăng (median 59 vs 40 ms đợt 135) — nhất quán với "chữ ký lượt
  chậm". T3/T10 xem có cần hiệu chỉnh khoảng P5 không (không phải
  việc của T5).
- **P6: KHÔNG VERDICT (theo thiết kế) — NHƯNG 3/3 BIN TRONG
  KHOẢNG** — bin 0 = 35,0% (33–39 ✓); +1/+2 = 34,0% (33–53 ✓);
  +3 = 16,2% (3–19 ✓). Khác #13 (2/3 bin ngoài). Histogram
  n_ghost=592, nomatch=0.
- **P7: DUNG (làm yếu desync)** — coverage 6/6; tại 92 entry log
  trong ±500 ms của tick (c2): floor(ct*30)−frameIdx = {−1: 42,
  0: 50} — **0 entry ≥+1** (drawSrc không trễ sau ct); chỉ
  drawSrc {−1: 21, 0: 25}; cặp rawUnit−drawSrc {0: 46}.
  **Caveat (ghi rõ, như đợt 136):** log draw thưa (drawSrc gap
  median 108 ms ≈ 3,3 frame) nên không phân giải được lệch 1
  frame (33 ms) — P7 làm yếu giả thuyết desync, không loại trừ
  hoàn toàn lệch dưới 1 frame. Đây là giới hạn của phương pháp,
  không phải lỗi đo.
- **Verdict tổng lượt #14: ĐO ĐƯỢC, HỢP LỆ (median 59,0 ≤ 60
  ms), GIÀU EVENT — P1/P2/P4/P7 DUNG, P3 SAI theo script T3,
  P5 3/4 trong khoảng, P6 3/3 trong khoảng (không verdict).**
  Lượt này ĐỦ ĐIỀU KIỆN làm lượt quyết định theo quyết parent
  §12.3(a) ((c2)=6 ≥ 3, đúng hướng): P1 lần đầu đạt p < 0,001;
  P4 về trong khoảng sau 1 lượt ngoài; chỉ P3 không đạt ngưỡng
  p < 0,05 theo định nghĩa A1 nghiêm ngặt. **Cộng dồn: P1 28/28**
  (22/22 + 6/6), **P3 24/28** (21/22 + 3/6), **P7 9/9** (8/8 +
  1). Tỉ lệ (c2) lượt #14: 6/296 = 2,03% (so với 0,33% ở #13 —
  bật trở lại). **Ngưỡng ≤60 ms GIỮ** (median 59,0 ms; chuỗi 12
  lượt hợp lệ: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 /
  56,0 / 39,5 / 40,0 / 58,0 / **59,0**, trung bình 48,3 ms).
  **Quyết verdict cuối thuộc parent/T10** (T5 chỉ báo số).

### 8.3 Ghi chú skew toàn-tick (bổ sung, không thay số P5)

- Script pha 2 tính skew trên cửa sổ post occ0 (n=296): snap−label
  50 ms, raw−label 10 ms. Rerun T3 tính trên TOÀN BỘ occ (n=592):
  snap−label median **50 ms**, raw−label **9 ms** — cả hai đều
  ngoài/trong khoảng P5 giống nhau (snap ngoài 34–48, raw trong
  8–10) nên verdict P5 không đổi theo cách tính nào. Label-floor
  toàn-tick = occ0 (cùng {0: 190, 1: 402} — label-floor chỉ tính
  occ0 theo thiết kế script).

### 8.4 Logger đã nới — KIỂM CHỨNG RUNTIME LẦN 3 LIÊN TIẾP

- c2DrawLog n=996 phủ **loopNo 1–21** (loop 3–11 và 13–21 mỗi loop
  42–60 entry; loop 1: 44, loop 12: 42, loop 18: 1 — 2 entry
  biên/cắt, xem caveat T4 §6), **20 wrap**, 1 epoch duy nhất,
  wallMs 11652→83996 (span 72.344 ms ≈ 24 vòng video 3 s). Khác
  hẳn logger cũ (chỉ loop 1–2).
- **Fix loop-gate nới + re-enable không xóa mảng (530e10a7) TIẾP TỤC
  HOẠT ĐỘNG ĐÚNG Ở RUNTIME — lần kiểm chứng thứ 3 liên tiếp**
  (loop≥3 n=902 theo rerun T3). Quyết GIỮ fix của parent (đợt 135
  §12.3(a), giữ qua đợt 137 §12.3(a)) được củng cố thêm.
- Lưu ý đọc đúng: log chứng minh logger GHI ĐƯỢC loop ≥3 + wrap,
  và P7 dùng được log để kiểm desync — nhưng log thưa (gap median
  108 ms vs 82 ms đợt 135) nên P7 chỉ làm yếu desync, không chứng
  minh "không desync tuyệt đối" (xem caveat §8.2 P7).

### 8.5 Đối chiếu với T4 — khớp 100%, 2 khác biệt nhỏ về định nghĩa

- **Baseline P1 65 vs 66:** script T5 + dòng "đối chiếu T5
  signed-dist" của rerun T3 đều cho 65/296 tick post trong ±1 tick
  của run-end; dòng P1 riêng của T3 cho 66/296. Lệch 1 tick do định
  nghĩa baseline khác nhau (signed-dist vs định nghĩa riêng của T3),
  không phải lệch dữ liệu — p ≈ 0,00011 cả hai cách, verdict P1
  DUNG không đổi. Ghi rõ để khỏi đọc thành "T4 với T5 lệch 1 tick".
  (Cùng lớp lệch như #13: 67 vs 69.)
- **p90 wallbands:** T5 tính bằng nearest-rank (0–20k: 83; 20–32k:
  87; 62–70k: 82) trong khi T4 dùng nội suy percentile (83,0 /
  88,2 / 83,0). **Median — số quyết định verdict — khớp chính xác
  cả 6 dải + tổng + post.** p90 không ảnh hưởng verdict nào; ghi
  rõ để khỏi đọc thành lệch số.
- Mọi số còn lại khớp chính xác giữa T5 và T4 (xem bảng §8.1).

### 8.6 Đối chiếu với rerun code T3 (chạy lại, không copy — KHÔNG tính là kiểm chứng độc lập thứ ba)

- Chạy `t3-step2-verify137.py` (code T3 đợt 137) trên cùng JSON:
  **khớp 100% mọi số với T5** — sha256, flip, blendTick 406/post
  296, tickCost median 59,0 (post 378), histogram y hệt, skew
  50/10 ms (occ0) / 50/9 ms (all occ), label-floor {0: 190,
  1: 402}, (c2) 6 + skp=1 0, P1 k=6/6 p≈0,00012 DUNG, P3 3/6
  p=0,125 SAI, P4/P5/P6/P7 y hệt.
- Verdict T3 bước 2 chưa công bố lúc T5 đóng (T3 đang chờ T4.done
  — `round137-t3.done` chưa xuất hiện ~09:55Z); nhưng vì mọi số đầu
  vào khớp 100% giữa 2 lần tính độc lập (T5 + T4) và rerun code T3,
  verdict T3 kỳ vọng khớp T5 trên mọi dự báo — nếu T3 công bố khác
  thì đó là khác biệt diễn giải (đặc biệt ở P3: "SAI" vs diễn giải
  3 tick bắt kịp, và P5: "3/4 trong khoảng" vs "không dung"), không
  phải khác biệt số. T10 đối chiếu khi T3 công bố.
- Đối chiếu T4: mọi số khớp (§8.1) + khớp verdict "lượt #14 đo
  được, median 59,0, ngưỡng giữ, biên 1 ms, logger kiểm chứng lần
  3". Không có số nào lệch giữa 3 lần tính (T5, T4, code T3).

## 9. Headroom inotify + RAM + disk + dmesg

### 9.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 134 cuối (T5) | 2499 | boot cc1f9de0 |
| Đợt 135 mở / cuối (T5) | 2393 / 2389 | boot 78b55838 |
| Đợt 136 mở / cuối (T5) | 2281 / 2276 | boot 1ca1feaa |
| **Đợt 137 mở boot 1 (T5)** | **2178** | **headroom-open.txt (boot 2104246b)** |
| **Đợt 137 mở boot 2 (T5)** | **2168** | **headroom-boot2-open.txt (boot 17db9652)** |
| **Đợt 137 cuối (T5)** | **2168** | **headroom-end.txt** |

- Giảm ~108 so với cuối đợt 136 (2276 → 2168); trong lượt gần như
  không đổi (2178 → 2168, −10 qua 1 reboot). Chuỗi dài hạn: …2625
  → 2623 → 2506 → 2499 → 2393 → 2389 → 2281 → 2276 → **2178 →
  2168 → 2168**. Vẫn gấp ~1,4 lần số watch vite thường cần (~1586).
  **Vite thường chạy được. Chưa tới ngưỡng báo user (< ~1.800) —
  chỉ theo dõi** (còn ~368). Trần 63747 cần can thiệp host — ngoài
  tầm luồng này.
- Inotify fd cell-visible: **5** (đo lúc mở boot 1) — watch giữ
  ngoài cell như các đợt trước (~61k watch ngoài cell theo T9).

### 9.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

- Phiên T5 (08:41Z–09:55Z, 2 boot): **518–6.781 MB** (tự đo theo
  MemAvailable). Các mốc T5: mở boot 1 753 MB (08:41Z) → 1.932 MB
  (08:46Z) → 1.112 MB (08:51Z) → 4.433 MB (08:58Z) → **6.781 MB
  (09:00:26Z, Balloon 0)** → 5.928 MB (09:02Z) → 3.524 MB
  (09:08Z) → 1.340 MB (09:19Z) → 1.068 MB (09:21Z) → **518 MB
  (09:31Z, thấp nhất phiên)** → 1.904 MB (mở boot 2, 09:37Z) →
  1.828 MB (09:38Z) → 1.237 MB (09:42Z) → 1.188 MB (đóng
  09:44Z). Poll log T4 cùng cửa sổ: 492–1.952 MB (min 492 MB
  poll #69 boot 1 — dưới gate A ≥1024 MB, cửa yên không mở được
  trên boot 1; min trên boot 2 là 1134 MB lúc mở cửa).
- **Balloon: 0–6.443.824 kB.** Mở boot 1 6.140.668 kB → 4.907.852
  (08:46Z) → **0 kB (09:00:26Z — lần đầu T5 quan sát balloon về
  0)** → 900.108 (09:02Z) → 6.443.824 (09:31Z, cao nhất phiên)
  → 4.885.304 (mở boot 2) → 5.744.344 (đóng). Balloon xả/nạp
  nhiều lần trong phiên, biên độ ~6,4 GB — việc T9 theo dõi chi
  tiết (T9-137 đã có LIMITS).
- **Về guard birefnet 6.144 MiB:** số cao nhất T5 quan sát được là
  **6.781.936 kB ≈ 6.623 MiB (09:00:26Z) — VƯỢT guard 6.144 MiB
  lần đầu tiên** (đợt 136 cao nhất chỉ 6.081 MB ≈ 5,83 GiB, dưới
  guard). T5 KHÔNG thử birefnet (không thuộc brief T5; việc của
  T9; quyết parent đợt 136 §12.3(f) GIỮ NGUYÊN guard 6.144 MiB).
  Ghi rõ để T9/parent biết cửa sổ vượt guard ĐÃ XUẤT HIỆN trong
  phiên này (lúc 09:00:26Z, boot 1) — nhưng T5 không kết luận
  birefnet chạy được hay không (cần T9 đo lại trong điều kiện
  kiểm soát).
- Swap: dùng ~276–313 MB / 1023 MB suốt phiên (SwapFree 710–
  931 MB) — không cạn swap. Zswap 74 MB, Zswapped 212 MB (lúc mở
  boot 1).

### 9.3 Disk

- Overlay `/`: 7,5G tổng, 168M đã dùng, **7,4G trống (3%)** lúc
  kiểm 08:47Z — đủ. `/tmp` tmpfs 512M, trống. `du` repo-1 = 15G
  (nằm trên mount khác với `/` — không phải vấn đề dung lượng).
  Không có ENOSPC nào ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không phải
  lỗi disk).

### 9.4 dmesg — KHÔNG ĐỌC ĐƯỢC đợt này

- `dmesg` trả về rỗng (exit 0, 0 dòng) lúc 08:41Z — không có nội
  dung kernel log nào đọc được từ cell (hạn chế quyền / kernel
  log trống sau reboot). `journalctl` chưa thử (việc T2/T6 — T2
  đã đọc được journal 1 boot cho boot 1, nên journal còn; chỉ
  dmesg là rỗng).
- **Hàm ý:** bước kiểm "lưu dmesg/journalctl sau mỗi lần kẹt" đã
  phê duyệt cho T8 (quyết parent đợt 136 §12.3(i)) — phần dmesg có
  thể không lấy được từ cell; T8 nên dùng journalctl (T2 đã chứng
  minh đọc được) thay vì dmesg, hoặc ghi rõ dmesg rỗng. T5 chỉ
  ghi nhận, không tự sửa chẩn đoán của T8.

## 10. Fix instrumentation T3 — trạng thái cuối (T5 chỉ ghi nhận, không sửa)

- preview.tsx md5 cuối: **530e10a7** (fix còn nguyên; T5 kiểm lúc
  mở boot 1 08:41Z, lúc mở boot 2 09:38Z, và T4 xác nhận
  tree=YES:md5=530e10a7 trong mọi poll). media.ts `2c384ed1`,
  vite.config.ts `ee80d093` — KHÔNG ĐỔI (theo LIMITS T4 §0 đợt
  136; T5 không đụng các file này).
- T4 (LIMITS T4 đợt 136 §10 mục 2) + T5 (§8.4) đều đề xuất **GIỮ
  fix cho đợt 137 trở đi** (logger đã kiểm chứng runtime lần 3
  liên tiếp: loop 1–21, 20 wrap, coverage 6/6; quyết GIỮ đã có từ
  parent đợt 135 §12.3(a) + đợt 136 §12.3(a)). Bản gốc 805409f0
  vẫn còn nguyên tại `round134-t3/preview.tsx.orig-805409f0` nên
  revert sau vẫn làm được trong 1 bước nếu parent đổi ý.
- preview.tsx KHÔNG nằm trong stage file của T5 (việc của T3).

## 11. R9 (a) vẫn mở (ghi nhận, nhắc lần 16)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Đợt 137 là bằng chứng MỚI NHẤT cho R9 (a): **reboot giữa lượt
  09:36:01Z giết watcher b90 + poller T4 + session exec của T5**
  (T5 phải làm lại postboot từ đầu cho boot 2, T4 phải restart
  poller, T3 phải restart wait) — nếu có watcher `--wait-new-boot`
  thì việc bắt boot mới đã tự động hơn. Nhưng R9 (a) không ảnh
  hưởng tới kết cục đợt này (cờ cho boot 2 vẫn viết kịp, attempt1
  vẫn chạy xong). Không có cơ sở rút lại đề xuất.
- **Nhắc lần 16.** (Số đếm VẪN LÀ 16, không tăng — đã tuân thủ
  brief đợt 137.)

## 12. Nợ mở sang đợt sau

1. **Ngưỡng tickCost ≤60 ms: biên chỉ còn 1 ms (median 59,0, cao
   nhất 12 lượt; 2 lượt gần nhất 58,0 → 59,0 đều ≥55 ms).** Quyết
   parent đợt 136 §12.3(c): nếu đợt 137 median vẫn ≥55 ms thì bàn
   lại ngưỡng/bar — điều kiện ĐÃ ĐẠT (59,0 ms). T5 không đổi ngưỡng;
   T10/parent bàn lại ở đợt đóng (xem §8.2).
2. **P3 SAI theo script T3 (p=0,125) + P5 snap−label ngoài khoảng
   lần thứ 2 liên tiếp (50 ms vs 34–48).** Verdict cuối điều tra
   (c2) thuộc parent/T10 trên bằng chứng cộng dồn (P1 28/28, P3
   24/28, P7 9/9): P1/P2/P4/P7 DUNG, chỉ P3 không đạt p < 0,05
   theo A1 nghiêm ngặt. T3/T10 xem có hiệu chỉnh khoảng prereg
   (P5) hay diễn giải lại 3 tick "bắt kịp" của P3 không. Không phải
   việc của T5.
3. **Lượt yên #15** — đo tiếp với logger đã nới trên boot 17db9652
   nếu còn sống (postboot đã PASS, cờ 09:43:47Z còn hiệu lực cho
   boot này — kiểm boot_id/btime khớp trước khi dùng) hoặc boot mới.
   Cộng dồn hiện tại: **P1 28/28, P3 24/28, P7 9/9**; ngưỡng ≤60 ms
   GIỮ (chờ bàn lại theo mục 1).
4. **F-137-T5-1 (xem §14):** không dùng mtime .deb để đo tuổi
   download (apt giữ Last-Modified); dùng ctime.
5. **started_at lượt 137:** T10 kiểm lại lúc đóng xem có reboot
   nào sau 09:44Z không; nếu có reboot thứ 2 giữa lượt, giả thuyết
   dự báo KHÔNG viết lại lần 2 (xem §6).
6. **dmesg rỗng (§9.4):** T8 kiểm lại cách lấy dmesg/journalctl
   cho bước kiểm đã phê duyệt (quyết parent đợt 136 §12.3(i)).
7. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 136 §12: mù #56
   mới (việc T2 — T2-137: HỞ đoạn A, tối đa 1 ẩn quy ước / 3 cộng
   dồn; mù #57 mở từ probe #56); G1 chờ user quyết; birefnet
   (chỉ thử lại khi quan sát được available ≥ 6 GiB, u2net là
   fallback chính thức — lưu ý cửa sổ vượt guard 09:00:26Z đợt
   này, xem §9.2); ci-security.yml vẫn 403 chờ user; TTS 39 cấm
   kiểm lại; release gate không đổi + KHÔNG push khi user chưa nhắn
   "push đi".

## 13. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`); `apps/web/vite.config.ts`:
  KHÔNG đổi (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 2 lần
  (header + dòng `say` cho boot 2104246b rồi 17db9652; md5
  `31eec0b6…` → `4f69c943…` → `02ea211f…`; không đổi logic).
- Watcher v6 trong hidden_files (KHÔNG stage): b90 (`5daa7441…`,
  51 poll, CHẾT theo reboot — cờ không kịp viết); b91 (`d0c21ee3…`,
  6 poll, cờ 17db9652 09:43:47Z); `bash -n` OK cả hai.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock/queue của luồng khác.
- `tsc` / `vite build`: KHÔNG chạy (không sửa production; tsc 0 +
  vite build PASS là của T3 lúc sửa preview.tsx).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM vượt guard lúc 09:00:26Z chỉ ghi nhận — xem §9.2).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 để không đếm trùng
  sóng — T2-137: probe #56 ok=2 fail=0, 08:45:46Z, boot 2104246b;
  xem LIMITS T2).
- Postboot: boot 1 FAIL (poll0 + watcher 51 poll, chưa PASS đã
  chết); boot 2 PASS (poll0-boot2 FAIL 1 lần rồi PASS từ watcher
  poll 2; cờ poll 6). **--repair: 0 lần** (không cần — cả 2 boot
  replay đều sống). **TRIGGER: 0 lần** (A2/(B)/(C) đều NO — đúng).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=YES: 0.**
  **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT lần nào** (b=maybe
  ở poll 44/46 boot 1 nhưng d=no).
- **Widen trigger A2: KHÔNG KÍCH HOẠT đợt này (đúng — không có hình
  dạng thiếu gói).** Trạng thái: "A2 đã kích hoạt live đợt 134
  (plugins-bad)" giữ nguyên.
- Headroom: 2178 (mở boot 1) → 2168 (mở boot 2) → 2168 (cuối).
- RAM phiên T5: 518–6.781 MB (tự đo); Balloon 0–6.443.824 kB.
- Stale vite.lock: không có (không kiểm lock dir đợt này — ghi rõ:
  T5 không đụng lock/queue; T6 kiểm lockhealth).
- **Pha 2 (c2): CÓ DỮ LIỆU ĐẦY ĐỦ — lượt #14 ĐO ĐƯỢC, HỢP LỆ,
  GIÀU EVENT: (c2)=6, P1/P2/P4/P7 DUNG, P3 SAI theo script T3
  (p=0,125), P5 3/4 trong khoảng, P6 3/3 trong khoảng (không
  verdict).** Lượt #14 hợp lệ (median tickCost 59,0 ms ≤ 60 ms).
  Cộng dồn P1 28/28, P3 24/28, P7 9/9. Ngưỡng ≤60 ms GIỮ.
- **Reboot GIỮA LUỘT: 1 lần** (boot 2104246b → 17db9652, khung
  (09:35:47Z, 09:36:01Z]).
- **started_at lượt 137: BỊ VIẾT LẠI ĐÚNG 1 LẦN (+46 s)** — giả
  thuyết tinh chỉnh đứng vững lần thứ 8 (xem §6).

## 14. Sai số của T5 đợt này (F-137-T5-N)

- **F-137-T5-1 — Dùng mtime .deb để đo tuổi download, suýt kết
  luận sai replay kẹt:** lúc 09:24Z, T5 thấy cache tăng 102→110
  .deb nhưng `find -newermt 09:19` trả 0 file, suýt kết luận
  download đã dừng. Thực tế apt GIỮ NGUYÊN `Last-Modified` của
  server làm **mtime** file .deb (vd gl .deb mtime 2026-11-16
  15:57:55 = ngày publish gói), còn **ctime** mới là giờ download
  (2026-11-18 08:49:03Z). Kiểm lại bằng ctime: 11 file có ctime
  sau 09:19Z — download VẪN TIẾN TRIỂN, không kẹt. T5 không hành
  động nào dựa trên đọc sai (chỉ kiểm chứng thêm, không trigger
  luật nào). Bài học: với cache apt, đo tuổi download bằng ctime,
  không dùng mtime; `Get:` trong term.log cũng không dùng được
  (0 dòng cả khi download thật).
- **F-137-T5-2 — Snippet wallbands lần đầu crash do sai đường dẫn
  JSON:** snippet tay dùng `d["results"]["b"]["tickCost"]` và
  `y2["flip"]` trong khi cấu trúc thật là `d["results"]["b"]["y2"]
  ["tickCost"]` và flip nằm ở `d["results"]["b"]["flip"]` — crash
  `KeyError` 2 lần. Chạy lại với đường dẫn đúng: wallbands median
  58/63/57/59/62,5/56 khớp T4 chính xác. Chỉ là snippet tay của
  T5, không ảnh hưởng phân tích (cùng lớp lỗi với F-136-T5-2).
- **F-137-T5-3 — Header watcher b91 lúc đầu còn sót tham chiếu
  boot 1:** bản copy từ b90 qua `sed` chỉ đổi được btime dạng
  `2026-11-18T...Z` trong code, không đổi được dòng header dạng
  "08:07:11Z uptime -s / 08:07:26Z stat /proc/1" và đoạn mô tả
  boot 1. T5 phát hiện khi đọc lại file TRƯỚC khi launch và sửa
  tay toàn bộ header (md5 cuối `d0c21ee3…`). Không có lần chạy nào
  dùng bản header sai. Bài học: sau `sed` hàng loạt, luôn đọc lại
  header trước khi launch (bài học F-136-T5-1 về "viết trước khi
  chạy" vẫn đúng ở dạng khác).
- **F-137-T5-4 — pgrep tự khớp vẫn xuất hiện nhưng đã đọc đúng:**
  lệnh kiểm watcher sau reboot dùng `pgrep -f t5-wait-replay-b90`
  trả về PID của chính shell exec của T5 (command line chứa chuỗi
  't5-wait-replay-b90' trong đường dẫn tail) — T5 nhận ra ngay là
  self-match (bài học F-135-T5-1) và xác minh watcher chết bằng
  `ps -p 9711` trực tiếp. Không có đọc nhầm nào xảy ra; ghi để
  khẳng định bài học đã được áp dụng (lần thứ 3 liên tiếp).
- **F-137-T5-5 (ghi chú, không phải lỗi T5) — Exec sleep của T5 bị
  giết bởi reboot giữa lượt:** lệnh `sleep 115` bắt đầu ~09:35:14Z
  bị gián đoạn ("service restarted") khi cell reboot 09:36:01Z —
  đó chính là reboot, không phải lỗi tool. T5 kiểm lại trạng thái
  ngay sau đó và làm lại postboot cho boot mới. Không mất dữ liệu
  (log watcher b90 còn nguyên tới poll 51).
- **F-137-T5-6 (ghi chú, không phải lỗi T5) — T3.done/T4.done chưa
  xuất hiện lúc T5 đóng (~09:55Z):** T4 đã chạy xong attempt1
  (exit 0 09:48:32Z) nhưng đang viết LIMITS; T3 đang chờ T4.done
  (hạn cắt 10:30Z). Pha 2 của T5 đối chiếu với file analyze của T4
  (đã đọc) + rerun code T3 (§8.6) — số liệu không phụ thuộc .done.
  T10 kiểm lại verdict T3/T4 khi chúng xuất hiện; nếu T3/T4 công
  bố khác thì đó là khác biệt diễn giải, không phải khác biệt số.

## 15. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  header + dòng `say` cho boot 2104246b rồi 17db9652; md5 cuối
  `02ea211f…`; không đổi logic).
- `docs/PHASE9_ROUND137_T5_INFRA_LIMITS.md` (file này — mới; pha 1
  postboot 2 boot + kiểm started_at + pha 2 lượt #14).
- Harness trong hidden_files (KHÔNG stage): `round137-t5/`
  (t5-start.txt, headroom-open.txt (2178),
  headroom-boot2-open.txt (2168), headroom-end.txt (2168),
  ram-open.txt, ram-boot2-open.txt, ram-end.txt,
  postboot-check.md5.before/after/after2, watcher.md5.before/after,
  watcher-b91.md5.after, t5-postboot-poll0.log (boot 1, FAIL),
  t5-postboot-poll0-boot2.log (boot 2, FAIL 5 gói),
  t5-postboot-b90-poll*.log (51 poll), t5-postboot-b91-poll*.log
  (6 poll), `POSTBOOT_PASS` (cờ gate-visible — boot 17db9652, PASS
  09:43:47Z poll 6), `t5-wait-replay-b90.sh` + `.log` +
  `.nohup.log` (chết theo reboot ở poll 51),
  `t5-wait-replay-b91.sh` + `.log` + `.nohup.log`,
  `t5-c2-drawlog-analysis.py` (copy từ đợt 136, không sửa) +
  `t5-c2-drawlog-analysis.txt` (pha 2 lượt #14, khớp 100% T4 +
  rerun T3), `t5-histogram-rerun.txt` (rerun code T3, khớp 100%
  T5), `t5-c2-input.sha256` (d0585125…),
  `t5-partial-drawlog-check.py` (copy từ đợt 136, không cần dùng
  đợt này — JSON đầy đủ)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round137-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round137-t5.done` (ghi rõ: postboot boot
  2104246b CHẾT GIỮA LUỘT (replay dở 110/221, cờ không kịp viết);
  boot 17db9652 replay nhanh từ cache (1545/221), cờ 09:43:47Z
  poll 6; started_at lượt 137 viết lại 1 lần (+46 s, giả thuyết
  đứng lần 8); pha 2 lượt #14 ĐO ĐƯỢC, GIÀU EVENT — (c2)=6, P1/P2/
  P4/P7 DUNG, P3 SAI theo script T3 (p=0,125), P5 3/4 trong khoảng,
  tickCost median 59,0 ms (biên 1 ms), cộng dồn P1 28/28, P3 24/28,
  P7 9/9; logger nới kiểm chứng lần 3, GIỮ fix).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Pha 2 (c2) — chạy lại phân tích log draw khi có JSON attempt ĐẦY ĐỦ + labellag T4:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round137-t5/t5-c2-drawlog-analysis.py <json-t4-day-du> <labellag-t4.txt> <out.txt>
# Pha 2 (han che) — kiểm tra JSON partial (flip chua toi):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round137-t5/t5-partial-drawlog-check.py <json-partial> <out.txt>
# Histogram #14 bằng code T3 (khi có JSON đầy đủ; không sửa script T3):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round137-t5/t3-step2-verify137.py <json-t4-day-du> <out.txt>
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```

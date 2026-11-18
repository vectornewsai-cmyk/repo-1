# PHASE9_ROUND130_T5_INFRA_LIMITS — Boot #76? CHẾT trong khung (10:02:05Z, 10:56:31Z]; boot #77? replay dạng (B) thuần lần 2 liên tiếp, §8.2(B) TRIGGER=YES, --repair 1 lần THÀNH CÔNG; (c2) instrumentation log draw ĐÃ LÀM (đúng 2 điểm, mặc định tắt)

> Luồng T5, đợt 130, lượt cron 18:35 +07 17/11/2026 (bắt đầu ~11:37Z trên
> boot #77?, kết thúc ~12:02Z, KHÔNG reboot giữa lượt).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: quyết parent đợt 129 §12.3(a) — T5 đợt 130 làm (c2) instrumentation
> log draw (2 điểm log §8.6 LIMITS T5 đợt 129, mặc định tắt, 1–2 vòng loop
> quanh wrap, chẩn đoán-only); LIMITS gộp đợt 129 §11 mục 3;
> R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production ngoài instrumentation
> đã phê duyệt. KHÔNG tự chạy `--repair` khi chưa đủ điều kiện.
> CẤM kiểm lại TTS 39; birefnet không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #76? CHẾT trong khung (10:02:05Z, 10:56:31Z].** btime
   09:02:12Z, boot_id `88f62ae6-a216-42a9-8a81-b36fd83ca019`. Lần cuối
   còn sống: T10 đóng đợt 129 lúc 10:02:05Z. Tuổi thọ 59m53s–1h54m19s.
   Đây là reboot thứ 5 liên tiếp rơi vào khoảng giữa đợt đóng và lượt mở
   (#71→#72, #72→#73, #73→#74, #74→#75, #76→#77).
2. **Boot #77? (MỚI) replay dạng (B) thuần — lần thứ 2 liên tiếp
   (§8.2(B) kích hoạt lần thứ 2).** btime 10:56:31Z, boot_id
   `86538084-410e-41d4-a4bf-e68574dc2d91`, sau #76? 1h54m19s.
   Configure 11:35:39Z (boot +39m08s — chỉ 12 giây TRƯỚC dispatch cron
   11:35:51Z, trùng mẫu #74/#75) rồi im hẳn: dpkg 2 dòng, 0 install,
   lists 5 file / 0 noble, GST sys 0 file, postboot FAIL mọi poll.
   §8.2(B) TRIGGER=YES lúc 11:46:21Z (watcher poll 9, dpkg im 641s, đủ
   5/5; poll 10 xác nhận im 701s); kiểm chứng độc lập 5/5 lúc 11:47:33Z;
   T5 chạy `--repair` 1 lần có giám sát từ 11:47:54Z — **THÀNH CÔNG**:
   update ~11,5 phút (partial/ 0 → 127, lists 5 → 75), install xong
   11:59:49Z (dpkg 2 → 759 dòng, 109 installs — y hệt #76?: 759/109),
   RE-CHECK libs/GST/apt PASS đủ, KET LUAN DU DIEU KIEN.
   **Cờ `POSTBOOT_PASS` cho #77? đã viết 12:01:24Z (poll 24, boot
   +1h04m53s, đúng boot_id)** — T4 đợt 130 gate bằng cờ này.
3. **Baseline 1.509 dòng / 217 installs KHÔNG về ở boot này** — repair
   chỉ cài 11 gói WebKit/GST + deps (109 installs), KHÔNG phải toàn bộ
   replay 217 gói; host replay nếu chạy sau sẽ bổ sung phần còn lại theo
   thiết kế idempotent (như #76?). Dạng (B) thuần nay đã lặp 2 boot
   liên tiếp (#76?, #77?) — sau 3 boot PASS liền (#73, #74, #75).
4. **Luật §8.2 dạng (B) ngưỡng 10' + luật (C): đánh giá ở MỖI poll.**
   Trên #77?: TRIGGER=YES ở poll 9–10 (trước repair), TRIGGER=NO ở
   22 poll còn lại (poll 1–8 chưa đủ im; poll 11–22 repair đang chạy —
   c2a=no; poll 23–24 postboot PASS). Luật (C): KHÔNG kích hoạt (dạng
   lỗi là (B), apt chết hẳn, không sống-kẹt).
5. **(c2) instrumentation log draw ĐÃ LÀM xong trong lượt này**
   (quyết parent đợt 129 §12.3(a)): đúng 2 điểm log §8.6 — (1) mỗi lần
   `rawUnitSource` vẽ (`preview.tsx:685` + log sau đó), (2) mỗi lần
   chuỗi tạo drawSrc xong (`preview.tsx:4117–4211` + log sau đó).
   MẶC ĐỊNH TẮT sau cờ `window.__vcutC2DrawLog`, chỉ ghi trong 2 vòng
   loop sau wrap đầu tiên, trần 10.000 entry, chẩn đoán-only, KHÔNG
   đổi hành vi render. tsc exit 0, vite build exit 0. preview.tsx md5
   mới `805409f0…` (đổi từ `03bf029f`, mtime 11:40:32Z — ghi rõ để T4/T10
   không kết luận sai "cây đổi"); media.ts không đổi `2c384ed1`.
6. **(c2) event lag: CHƯA CÓ dữ liệu mới.** T4 đợt 130 chưa có attempt
   JSON lúc T5 viết LIMITS này (12:02Z — T4 vừa được mở gate bởi cờ
   12:01:24Z). Giữ nguyên kết luận đợt 129: modal +1/+2 KHÔNG giữ dạng
   ngay cả trên lượt yên hợp lệ; giả thuyết seek-latency desync CHƯA
   chứng minh. Lượt yên #8 (với instrumentation mới) sẽ cho dữ liệu
   đối chiếu ở đợt sau.
7. **Headroom inotify: 2971 (mở) → 2957 (cuối)** — giảm 14 trong lượt,
   giảm 108 so với 3079 cuối đợt 129; vẫn ~1,9 lần số watch vite thường
   cần (~1586); CHƯA tới ngưỡng báo user (< ~1.800), chỉ theo dõi.
8. **RAM khả dụng 473–3302 MB trong lượt** (thấp nhất 473 MB lúc cuối
   12:02Z — thấp nhất từng ghi, dưới 576 MB đợt 129; cao nhất 3302 MB
   lúc watcher poll 7). Dù lấy số nào cũng < 6 GB guard — birefnet
   không thử.
9. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI.
   Queue cooldown 71 file / 994 B (khớp đúng số T10 đếm lúc đóng đợt
   129) — không đổi trong lượt. T5 KHÔNG đụng lock/queue.
10. **R9 (a) vẫn chờ user — nhắc lần 16.**
11. **Sửa `postboot-check.sh` 1 lần trong lượt** (md5 `c541c97d…` →
    `f5c6a411…`): tham chiếu boot #76? → #77?; `bash -n` OK; chạy lại
    sau sửa vẫn FAIL exit 1 (logic không đổi).

## 2. Boot #76? — chết trong khung (10:02:05Z, 10:56:31Z]

- Boot #76?: btime 09:02:12Z, boot_id
  `88f62ae6-a216-42a9-8a81-b36fd83ca019`. Lần cuối còn sống được ghi
  nhận: T10 đóng đợt 129 lúc 10:02:05Z (suite 27/27 + O8 21/21 +
  21/21 đều trên boot này; không reboot trong lúc đóng 09:48–10:02Z).
- Boot mới btime 10:56:31Z → #76? chết trong khung (10:02:05Z,
  10:56:31Z] (rộng 54m26s). Tuổi thọ 59m53s–1h54m19s. Không kẹp
  hẹp hơn được: journal/wtmp chỉ giữ boot hiện tại (first entry boot
  mới 10:56:46Z, +15s — T5 không đọc journal lúc mở; ghi nhận từ
  /proc/1 10:56:42Z, chênh +11s so với btime); không có quan sát nào
  trong khung.
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s,
  #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
  1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77? chưa biết
  (sống ≥1h05m tới cuối lượt T5).
- Đây là lần thứ 5 liên tiếp reboot rơi vào khoảng giữa đợt đóng và
  lượt mở — các luồng đã quen với luật STALE (chờ cờ POSTBOOT_PASS
  của boot mới, không dùng cờ boot cũ). R9 (a) vẫn là vá gốc cho vấn
  đề này (nhắc lần 16).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5 mở, nhưng
  là của CHÍNH đợt 130 này (tạo 11:35Z bởi parent vòng lặp, "Đợt
  130 đang chạy, 9 luồng T1–T9 + T10 đóng sổ") — KHÔNG phải đợt
  main-chat. Luật chốt chặn (chỉ chặn khi đợt main-chat đang chạy)
  không áp dụng; lượt cron làm việc bình thường.

## 3. Boot #77? — replay dạng (B) thuần, §8.2(B) TRIGGER=YES, --repair 1 lần THÀNH CÔNG

### 3.1 Boot #77? — btime 10:56:31Z, gap 1h54m19s

- Boot #77?: 2026-11-17 10:56:31Z (btime kernel 1794912991;
  `uptime -s` đồng ý; /proc/1 10:56:42Z, chênh +11s;
  boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`, sau #76?
  1h54m19s). Số thứ tự TẠM, chờ T6 đếm lại mù #37.
- `journalctl --list-boots` / `last -x`: T5 không đọc lại trong lượt
  này (mẫu các đợt trước: chỉ còn 1 boot hiện tại) — không suy diễn
  thêm.

### 3.2 Replay #77? — dạng (B) thuần: configure +39m08s rồi im hẳn

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 10:56:31 | 0 | btime |
| Configure (2 dòng dpkg.log) | 11:35:39 | +39m08s | dpkg.log |
| Lượt cron dispatch | 11:35:51 | +39m20s | task (chỉ 12s sau configure) |
| T5 mở lượt | 11:37:32 | +41m01s | exec |
| Watcher poll 1 | 11:38:18 | +41m47s | watcher log |
| §8.2(B) TRIGGER=YES (poll 9) | 11:46:21 | +49m50s | watcher log (silent 641s) |
| Kiểm chứng độc lập 5/5 | 11:47:33 | +51m02s | t5-pre-repair.log |
| --repair bắt đầu | 11:47:54 | +51m23s | repair log (nohup pid 12452) |
| apt-get update xong (lists 75) | ~11:59:2x | ~+1h02m | repair log + lists 75 lúc 11:59:24Z |
| Install xong (dpkg 759) | 11:59:49 | +1h03m18s | dpkg.log |
| RE-CHECK PASS / KET LUAN DU DIEU KIEN | ~11:59:5x | ~+1h03m | repair log |
| Cờ POSTBOOT_PASS viết (poll 24) | 12:01:24 | +1h04m53s | watcher log |
| Final confirm PASS | ~12:02:0x | +1h05m | t5-postboot-b77-final.log |

- Configure bắt đầu 11:35:39Z, chỉ 12 giây TRƯỚC khi lượt cron
  18:35 +07 dispatch (11:35:51Z) — TRÙNG MẪU #74 (8 giây trước
  dispatch) và #75 (8 giây trước dispatch). Lần thứ 3 liên tiếp
  configure rơi vào đúng cửa sổ dispatch — vẫn chỉ ghi nhận, không
  suy diễn nhân quả (không có bằng chứng liên hệ).
- Khác #76? (configure boot +53s): #77? configure muộn hơn nhiều
  (+39m08s) nhưng cùng kết cục dạng (B) — configure muộn không dự
  báo dạng lỗi; dạng (B) nay đã lặp 2 boot liên tiếp.
- Lists: `/var/lib/apt/lists/` 5 file, 0 file `noble` lúc mở (chỉ
  auxfiles/cli.github/lock/partial) — update chưa từng chạy trong
  boot này; `partial/` TRỐNG (0 file) lúc mở. Sau repair: 75 file /
  68 noble, partial/ về 0.
- 11 gói từng thiếu ĐỀU ĐƯỢC CÀI sau repair (`dpkg-query` qua
  postboot RE-CHECK: đủ 11/11 — libevent-2.1-7t64, plugins-base/
  good/bad/ugly/gl, libav, x, libavif16, libgstreamer1.0-0,
  libevdev2).
- `term.log` / `history.log`: T5 không đọc trong lượt này (replay
  không chạy nên không có installs để đối chiếu).
- 0 apt/dpkg/wrapper đang chạy từ poll 1 tới lúc repair (11:47:54Z);
  lock dpkg rảnh (fuser exit 1 lúc kiểm chứng độc lập).

### 3.3 Bảng so sánh replay — dạng (B) lặp lại

| Boot | dpkg.log (dòng) | Installs | Khởi động | Kết cục |
|---|---|---|---|---|
| #71? | 1509 | 217 | +9m59s | PASS |
| **#72?** | **350** | **48** | **+25m22s** | **CHẾT dạng (A)** |
| #73? | 1509 | 217 | +38s | PASS +5m51s |
| #74? | 1509 | 217 | +40m39s | PASS +47m52s |
| #75? | 1509 | 217 | +1h22m12s | PASS +1h29m34s |
| #76? (replay) | 2 | 0 | +53s | **dạng (B), repair PASS +30m03s** |
| **#77? (replay)** | **2** | **0** | **+39m08s** | **dạng (B), repair PASS +1h04m53s** |

- Dạng (B) thuần ("chạm mà không cài": 2 dòng configure + 0 install)
  nay đã lặp 2 boot liên tiếp — không còn là sự cố một lần như #72?
  (nợ (i) đợt 127 đã đóng cho dạng 350 dòng). Baseline 1.509 dòng /
  217 installs chỉ giữ cho các boot replay chạy xong (#71, #73–#75);
  các boot dạng (B) cần --repair và chỉ đạt 759 dòng / 109 installs
  (11 gói WebKit/GST + deps, không phải toàn bộ replay).
- Khác biệt #77? so với #76?: configure muộn hơn (+39m08s so với
  +53s) nên TRIGGER tới muộn hơn (boot +49m50s so với +10m54s) và
  cờ PASS tới muộn hơn (boot +1h04m53s so với +30m03s) — toàn bộ
  độ trễ nằm ở thời điểm configure, không phải ở tốc độ repair
  (update ~11,5 phút, nhanh hơn #76? ~14 phút).

### 3.4 Postboot #77? — FAIL 22 poll, PASS sau repair, cờ viết poll 24

- Watcher poll 1–10 (11:38:18–11:47:21Z): postboot exit 1 cả 10 poll;
  dpkg 2 dòng, 0 install, lists 5, GST 0, 0 proc. TRIGGER=YES từ
  poll 9 (11:46:21Z, silent 641s) + poll 10 xác nhận (silent 701s).
- Kiểm chứng độc lập 5/5 lúc 11:47:33Z (xem §7.2): postboot exit 1
  tươi; apt/apt-get/dpkg 0; wrapper 2 PID là FALSE POSITIVE (shell
  của chính lệnh kiểm, đã chết ngay sau đó — ps lại không còn; như
  đợt 127/129); fuser lock trống exit 1; dpkg im 713s; lists 5;
  GST 0; RAM 2342 MB.
- `--repair` chạy 11:47:54Z (boot +51m23s, dpkg im ~734s), 1 lần,
  có giám sát (nohup pid 12452, log `t5-repair-b77.log`): symlink GST
  → debroot (269 file) ngay đầu; `apt-get update` (timeout 1500s)
  chạy ~11:47:55–~11:59:2x (~11,5 phút — nhanh hơn #76? ~14 phút):
  partial/ 0 → 68 (11:48:14Z) → 72 → 85 → 109 → 123 (11:56:14Z) →
  127 (11:58:12Z) → 0, lists 5 → 75; `apt-get install` (timeout
  1800s) chạy ~11:59:2x–11:59:49Z, cài đủ 11/11 gói; dpkg 2 → 759
  dòng, 109 installs (y hệt #76?: 759/109 — chỉ 11 gói WebKit/GST +
  deps, KHÔNG phải toàn bộ replay 217 gói; host replay nếu chạy sau
  sẽ bổ sung phần còn lại theo thiết kế idempotent).
- RE-CHECK sau repair: wrapper PASS, libs PASS đủ 5, GST PASS đủ
  isomp4 + libav, apt PASS đủ 11 — KET LUAN DU DIEU KIEN.
  Watcher poll 23 (12:00:24Z) postboot 0 lần đầu sau repair (dpkg
  759, 0 proc, lists 75, GST 269); poll 24 (12:01:24Z) frozen=yes +
  postboot 0 → **FLAG_WRITTEN 12:01:24Z (boot +1h04m53s)**; watcher
  tự kết thúc `done_pass_stable_2polls`.
  Final confirm ~12:02:0xZ exit 0. Tổng trên #77?: postboot PASS 3/3
  sau repair (poll 23, poll 24, final) + FAIL 22 poll watcher +
  FAIL ở lần kiểm mở lượt + kiểm chứng độc lập + sau sửa script
  (đều exit 1, logic không đổi).
- Cờ POSTBOOT_PASS hiện tại là của #77? (boot_id 86538084…).
  GST vẫn là symlink → debroot (269 file) — file plugin apt cài đã
  ghi xuyên symlink vào debroot (caveat đã biết của thứ tự repair).
- Mốc 11:35Z trong task không bị trễ (cờ viết 12:01:24Z, trước hạn
  đóng đợt 14:35Z hơn 2,5 giờ); toàn bộ xong trong lượt.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 05:42Z (boot #74?, ~47' tuổi) | 3203 | mở lượt đợt 128 (đã lưu) |
| T5, 05:43Z (boot #74?, ~48' tuổi) | 3205 | cuối lượt đợt 128 |
| T5, 08:38Z (boot #75?, ~1h25' tuổi) | 3089 | mở lượt đợt 129 |
| T5, ~08:47Z (boot #75?, ~1h33' tuổi) | 3078 | cuối lượt trên #75? |
| T5, ~09:33Z (boot #76?, ~31' tuổi) | 3079 | cuối lượt trên #76? |
| **T5, 11:38Z (boot #77?, ~41' tuổi)** | **2971** | **mở lượt đợt 130 (headroom-open.txt)** |
| **T5, ~12:02Z (boot #77?, ~1h06' tuổi)** | **2957** | **cuối lượt đợt 130 (headroom-end.txt)** |

- Headroom giảm 14 trong lượt (2971 → 2957) và giảm 108 so với cuối
  đợt 129 (3079 → 2971 qua reboot). Chuỗi dài hạn: 4438 → 4318 →
  3645 → 3451 → 3434 → 3334 → 3317 → 3315 → 3203/3205 → 3089 →
  3078 → 3079 → **2971 → 2957**. Vẫn gấp ~1,9 lần số watch vite
  thường cần (~1586). **Vite thường chạy được trên boot này. Chưa
  tới ngưỡng báo user (< ~1.800) — chỉ theo dõi** (quyết parent
  §12(h) đợt 127).
- Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 11:37:32Z | 623 MB | lúc mở lượt (thấp nhất tới lúc đó) |
| 11:38:18Z (watcher poll 1) | 856 MB | |
| 11:39:19Z (poll 2) | 895 MB | |
| 11:40:19Z (poll 3) | 2484 MB | |
| 11:41:05Z (tsc xong) | 1758 MB | |
| 11:44:21Z (poll 7) | 3302 MB | cao nhất lượt |
| 11:45:21Z (poll 8) | 3074 MB | |
| 11:46:21Z (poll 9, TRIGGER) | 2702 MB | |
| 11:47:21Z (poll 10) | 2489 MB | |
| 11:47:33Z (kiểm chứng độc lập) | 2342 MB | |
| 11:59:24Z (poll 22, install) | 601 MB | |
| 12:00:24Z (poll 23, postboot 0 đầu) | 487 MB | |
| 12:01:24Z (poll 24, ghi cờ) | 533 MB | |
| ~12:02Z | **473 MB** | **cuối lượt (ram-end.txt) — thấp nhất lượt** |

- RAM dao động rất mạnh theo luồng khác (623 → 3302 → 473 MB trong
  ~25 phút): hồi dần khi các luồng đợt 130 khởi động xong, rồi RƠI
  MẠNH cuối lượt khi T4/T8 bắt đầu chạy sau cờ + tsc/vite build của
  T5. Mức thấp nhất 473 MB là **thấp nhất từng ghi** (dưới 576 MB
  đợt 129 và 547 MB đợt 127) nhưng vẫn > 0 — T9 theo dõi RAM ghim
  (nhiệm vụ T9).
- Swap đã dùng 255–426 MB trong lượt.
- Dù lấy số nào cũng < 6 GB guard — birefnet không thử.

## 5. Watcher — b77 v4 (24 poll, ghi cờ, tự kết thúc)

- Chạy 11:38:18–12:01:24Z (24 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script copy từ bản b76 đợt 129
  (v4) — chỉ đổi btime/mốc/log + ghi chú replay #77 dạng (B);
  `bash -n` OK trước khi chạy.
- Poll 1 (11:38:18Z): dpkg=2 frozen=no, silent 159s, apt-get=0,
  postboot 1, lists=5, GST=0, RAM 856 MB. EVAL §8.2B TRIGGER=NO
  (c2b no, c3 no).
- Poll 9 (11:46:21Z): dpkg=2 frozen=yes, silent 641s, apt=0,
  postboot 1, lists=5, GST=0, RAM 2702 MB → **TRIGGER=YES**
  (đủ 5/5).
- Poll 10 (11:47:21Z): silent 701s → TRIGGER=YES (xác nhận).
- Poll 11–22 (11:48:21–11:59:24Z): trong lúc --repair chạy,
  postboot FAIL nhưng TRIGGER=NO (apt-get đang chạy — c2a=no;
  partial tăng trong lúc update, không đóng băng).
- Poll 22 (11:59:24Z): lists 75 lần đầu, apt-get pid 15333
  (00:41, 2,6% CPU — đang install), dpkg vẫn 2 dòng (install chưa
  ghi xong), postboot 1.
- Poll 23 (12:00:24Z): dpkg=759 installs=109, silent 35s, apt=0,
  postboot 0 lần đầu sau repair, lists=75, GST=269, RAM 487 MB.
- Poll 24 (12:01:24Z): dpkg=759 frozen=yes, silent 95s, apt=0,
  postboot 0 → **FLAG_WRITTEN 12:01:24Z**.
- Cờ `POSTBOOT_PASS` (round130-t5/): `boot_id=86538084-410e-41d4-
  a4bf-e68574dc2d91 btime=2026-11-17T10:56:31Z pass_at=
  2026-11-17T12:01:24Z poll=24` — đúng boot mới. T4 đợt 130 gate
  bằng cờ này (gate0-wait đang chạy lúc cờ viết).
- KHÔNG reboot trong lúc watcher chạy (11:38–12:01Z); boot_id không
  đổi suốt lượt.
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm cuối lượt ~12:02Z — sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **71 file / 994 B**
  (khớp đúng số T10 đếm lúc đóng đợt 128 và lúc đóng đợt 129) —
  không đổi trong lượt. Đều là cooldown cũ, không chặn luồng khác,
  không tính là ticket. Luật prune cooldown ĐÃ PHÊ DUYỆT (quyết
  parent §12(c) đợt 125) — việc prune là của T6, T5 chỉ ghi số.
- T5 KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb/MiniBrowser: 0 đang chạy lúc mở lượt và lúc kiểm chứng độc
  lập (reboot đã xóa sót đợt 129).

## 7. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

> Quyết parent đợt 125 §12(b): §8.2 dạng (B) VỐN ĐÃ bao chế độ "chạm
> mà không cài"; ngưỡng chờ dạng (B) dpkg im ≥10 phút (thay vì 15);
> luồng hạ tầng đánh giá §8.2 ở MỖI poll khi dpkg đóng băng; hiệu lực
> từ đợt 126.
>
> 5 điều kiện §8.2 (quyết parent đợt 120 §12 mục 3): (1) postboot
> FAIL tươi (<10' trước quyết); (2) replay ĐÃ CHẾT — (a) 0 process
> apt-get/dpkg/wrapper, (b) dpkg.log không tăng ≥10', (c) lock dpkg
> rảnh; (3) ngưỡng chờ: boot ≥60' HOẶC dpkg im ≥15' — **với dạng
> (B): dpkg im ≥10'**; (4) dạng lỗi (A) "tới nhưng thiếu GST" HOẶC
> (B) "chạm mà không cài"; (5) không có luồng đo WebKit nào đang chạy
> probe trên boot đó.
>
> Luật (C) (quyết parent đợt 122 §12.4): đủ 5 điều kiện (postboot
> FAIL tươi; apt còn sống nhưng 0% CPU qua ≥2 lần kiểm cách nhau ≥15'
> + dpkg.log im ≥15'; boot ≥60' hoặc dpkg im ≥15'; dạng (C); không
> probe đang chạy) mới kill tiến trình kẹt (ghi cờ + PID trước) rồi
> chạy --repair một lần có giám sát.

### 7.1 Đối chiếu §8.2 — boot #77? (watcher b77 v4, poll 1–24; rút gọn)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 11:38:18Z | 159s | yes (exit 1) | yes | no | B (yes) | yes | **NO** |
| 8 | 11:45:21Z | 581s | yes | yes | no | B (yes) | yes | **NO** |
| 9 | 11:46:21Z | 641s | yes | yes | yes | B (yes) | yes | **YES** |
| 10 | 11:47:21Z | 701s | yes | yes | yes | B (yes) | yes | **YES** |
| 16 | 11:53:22Z | 1062s | yes | no (repair apt) | yes | B (yes) | yes | **NO** |
| 22 | 11:59:24Z | 1424s | yes | no (repair install) | yes | B (yes) | yes | **NO** |
| 23 | 12:00:24Z | 35s | no (exit 0) | yes | no | no | yes | **NO** |
| 24 | 12:01:24Z | 95s | no (exit 0) | yes | no | no | yes | **NO** |

- TRIGGER=YES ở poll 9–10 (11:46:21–11:47:21Z) — đủ 5/5 điều kiện
  dạng (B). T5 kiểm chứng độc lập 5/5 lúc 11:47:33Z rồi chạy
  `--repair` 1 lần (xem §3.4 + quyết định
  `t5-repair-decision-b77.md`).
- **§8.2(B) kích hoạt lần thứ 2** (lần 1: #76? đợt 129, poll 9,
  silent đúng 600s; lần này: #77?, poll 9, silent 641s — cùng
  poll 9, cùng dạng (B) thuần). Luật 10 phút đã kiểm chứng thực
  tế lần thứ 2 liên tiếp.
- Luật (C) trên #77?: không áp dụng — dạng lỗi là (B) (0 install),
  không phải (C) (apt sống-kẹt); apt không sống-kẹt mà chết hẳn sau
  configure (0 proc từ poll 1 tới lúc repair). EVAL_C ở mọi poll:
  b_stuck_maybe=no (partial tăng trong lúc repair, không đóng băng).

### 7.2 Kiểm chứng độc lập pre-repair (11:47:33Z, 5/5)

- (1) postboot FAIL tươi: exit 1 (wrapper PASS K1; libs thiếu 5;
  GST không tồn tại, sys 0 / debroot 269, thiếu isomp4 + libav;
  apt thiếu đủ 11 gói).
- (2a) 0 proc: apt=0, apt-get=0, dpkg=0; wrapper 2 PID là FALSE
  POSITIVE (shell của chính lệnh kiểm — ps lại không còn process
  nào; như đợt 127/129).
- (2b)/(2c): dpkg.log 2 dòng, im 713s; fuser lock-frontend trống
  (exit 1).
- (3) dpkg im 713s ≥ 600s (ngưỡng dạng (B)).
- (4) dạng (B): 2 dòng + 0 install + postboot FAIL.
- (5) MiniBrowser 0 (T4 đang gate chờ cờ, chưa probe nào chạy).

## 8. (c2) instrumentation log draw — ĐÃ LÀM (quyết parent đợt 129 §12.3(a))

### 8.1 Đúng 2 điểm log, mặc định tắt, chẩn đoán-only

**Điểm 1 — `rawUnitSource` vẽ (`preview.tsx:685`):** helper
`c2DrawLogPush` (dòng ~685–712) + log ngay sau
`rctx.drawImage(drawSrc, …)` trong `rawUnitSource`. `rawUnitSource`
nhận thêm tham số tùy chọn thứ 9 `debug?: { el, frameIdx, clipId }`
(call site duy nhất ở ~4498 truyền `srcEl` (khi là video element)
+ `frameIdx` + `clip.id`). Ghi: `video.currentTime` lúc vẽ +
`seeking` + `readyState` + `frameIdx` của tick.

**Điểm 2 — chuỗi tạo drawSrc xong (`preview.tsx:4117–4211`):** log
ngay sau khối plainNativeSource (sau khi drawSrc cuối cùng đã chốt,
trước khối rVFC), ghi nhánh nào đã tạo drawSrc + `currentTime` /
`seeking` / `readyState` của video lúc đó + `frameIdx`. Nhánh được
ghi qua biến `drawSrcStage` (mặc định `"video-raw"`; gán tại 7 điểm
trong chuỗi): `chroma` / `lut` / `effects` / `enhance` /
`deint-intermediate` / `letterbox-norm` / `plain-native`. `srcKind`
ghi `canvas WxH` / `video` / `other` để phân biệt canvas nào trong
chuỗi.

**Cờ + cửa sổ (theo đúng giới hạn phê duyệt):**
- Cờ: `window.__vcutC2DrawLog = true` (cùng mẫu hook đo
  `__vcutHoldStats` / `__vcutTickCost`). MẶC ĐỊNH TẮT (undefined →
  không ghi gì). Bật cờ lại thì reset cửa sổ + xóa entries cũ.
- Cửa sổ: chỉ ghi trong **2 vòng loop sau wrap đầu tiên** — wrap =
  `frameIdx` nhảy lùi (video loop lại / seek lùi về đầu). Vòng loop
  đầu tiên chưa có wrap thì KHÔNG ghi. Sau 2 vòng loop thì tự dừng.
  (Seek lùi cũng tính là wrap — đúng bản chất chẩn đoán vì giả thuyết
  đang xét là seek-latency.)
- Trần an toàn: 10.000 entry (probe (c2) dùng clip ngắn nên không
  chạm trần; 1 tick ghi tối đa 2 entry — 1 drawSrc + 1 rawUnit khi
  có mask+blur).
- Harness đọc: `window.__vcutC2DrawLogEntries` (mảng entry
  `{point, clipId, frameIdx, ct, seeking, readyState, stage, srcKind,
  wallMs, loopNo}`).
- **KHÔNG đổi hành vi render:** chỉ đọc `currentTime`/`seeking`/
  `readyState` + đẩy 1 object vào mảng; không vẽ thêm, không seek,
  không đổi thứ tự vẽ, không đổi giá trị trả về của hàm nào. 7 dòng
  `drawSrcStage = …` chỉ gán biến cục bộ mới. Khi cờ tắt, chi phí
  thêm là 1 lần đọc `window.__vcutC2DrawLog` mỗi tick + mỗi lần vẽ
  rawUnit (không đáng kể; không có vòng lặp hay I/O).

### 8.2 Kiểm chứng instrumentation

- `tsc` apps/web: **exit 0** (~24s, log `tsc.log`).
- `vite build`: **exit 0** (8,09s, log `vite-build.log`; chỉ cảnh báo
  chunk >500 kB đã có từ trước).
- `preview.tsx` md5: `03bf029f…` → **`805409f0…`** (sửa xong 11:40:32Z
  theo mtime; md5 ghi nhận 11:41:28Z)
  — ghi rõ để T4/T10 không kết luận sai "cây đổi" khi đối chiếu với
  md5 lúc đóng đợt 129). `media.ts` không đổi `2c384ed1`.
- T5 KHÔNG chạy lượt yên / probe nào với instrumentation trong lượt
  này (đó là việc của T4 với cờ bật — lượt yên #8).
- Ghi chú: instrumentation giữ lại sau cờ debug theo quyết parent
  ("xong thì gỡ hoặc giữ sau cờ debug") — T5 giữ sau cờ, không gỡ
  trong lượt này để T4 dùng ngay ở lượt yên #8.

### 8.3 (c2) event lag — CHƯA CÓ dữ liệu mới, giữ nguyên kết luận đợt 129

- T4 đợt 130 chưa có attempt JSON lúc T5 viết LIMITS này (12:02Z):
  T4 vừa được mở gate bởi cờ POSTBOOT_PASS 12:01:24Z, chưa chạy
  xong lượt yên #8. **Không có quan sát mới nào về event lag trong
  lượt này.**
- Giữ nguyên kết luận đợt 129 (§8.1–§8.5 LIMITS T5 đợt 129): modal
  +1/+2 KHÔNG giữ dạng ngay cả trên lượt yên hợp lệ (đợt 127: 47,3%
  vs đợt 129 a1: 33,9%); snap−label KHÔNG dự báo lag theo từng entry;
  rawCt == labelCt ở mọi ghost event 276–279 (nhãn và lần vẽ đồng ý
  về video time); **giả thuyết seek-latency desync CHƯA chứng minh**.
- Dữ liệu đối chiếu tiếp theo: lượt yên #8 đợt 130 (probe mới T3 +
  instrumentation này, cờ `__vcutC2DrawLog` bật) — phân tích ở đợt sau.

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (1 lần, không đổi logic)

- Lần 1 (#77?, ~11:38Z): md5 `c541c97d…` → `f5c6a411…` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  header bổ sung đoạn #76? (chết trong khung (10:02:05Z, 10:56:31Z],
  tuổi thọ 59m53s–1h54m19s; reboot giữa đợt đóng và lượt mở lần thứ 5
  liên tiếp) + đoạn #77? (replay dạng (B), configure 11:35:39Z rồi
  im, 0 install); dòng `say` cập nhật tương ứng. Dòng `say` mới
  không chứa ký tự `"` (dùng `m`/`s` thay dấu phút/giây) — không lặp
  sự cố đợt 120. `bash -n` OK.
- Kiểm chứng: sau khi sửa, postboot vẫn FAIL exit 1 (lần kiểm
  sau sửa ~11:38:4xZ) — logic không đổi đã được xác nhận bằng chạy
  thật; sau repair, cùng script này PASS exit 0 (poll 23–24 + final).
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên.

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #76?→#77? giữa đợt đóng và lượt mở này là ví dụ mới nhất
  (lần thứ 5 liên tiếp) cho thấy R9 (a) vẫn có giá trị: T5 phải tự
  phát hiện boot mới + cập nhật script + ghi cờ mới cho #77? trong
  ~24 phút sau khi lượt mở (lượt mở 11:37Z, cờ PASS 12:01:24Z —
  chậm hơn đợt 129 vì replay dạng (B) cần repair ~12 phút, không
  phải vì T5 chậm). Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt hại,
  nhưng không thay thế R9 (a).
- Nhắc lần 16.

## 11. Nợ mở sang đợt sau

1. **Boot #77? đang sống + PASS (sau --repair) — các luồng đo đợt
   130 dùng cờ này** (`round130-t5/POSTBOOT_PASS`, boot_id
   86538084…, PASS 12:01:24Z, xác nhận lại final ~12:02Z). Cờ #76?
   (88f62ae6…, PASS 09:32:15Z) đã STALE. Nếu #77? cũng chết sớm như
   #72? (54m08s) hoặc #69? (~19–20') thì T5 đợt sau phải làm lại từ đầu.
   Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20,
   #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m, #72? 54m08s, #73?
   1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–
   1h48m41s (chết GIỮA LUỘT), #76? 59m53s–1h54m19s, #77? chưa biết
   (sống ≥1h05m tới cuối lượt T5).
2. **Số thứ tự boot #76?/#77? CHƯA CHẮC** — chờ T6 đếm lại mù #37
   (T6 đợt 130 đang chạy). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **(c2) chẩn đoán — instrumentation ĐÃ CÓ trong cây (preview.tsx
   805409f0…):** lượt yên #8 đợt 130 (T4, probe mới + cờ
   `__vcutC2DrawLog` bật) sẽ cho dữ liệu đối chiếu đầu tiên; phân
   tích ở đợt sau. Giả thuyết seek-latency desync vẫn CHƯA chứng
   minh (giữ nguyên verdict đợt 129).
4. **Event seq 276–279 giữ làm case theo dõi** — không tái hiện ở
   3 run mới đợt 128/129 (max +4f, 0 occurrence ≥+5f); phần "frame
   tương lai" đã khoanh hẹp (§8.4 đợt 129) nhưng chưa đóng.
5. **Headroom tiếp tục giảm dài hạn:** …3334 → 3317 → 3315 →
   3203/3205 → 3089 → 3078 → 3079 → **2971 → 2957** (đo lại trên
   #77? — giảm 108 qua reboot + 14 trong lượt). Trần 63747 cần
   can thiệp host — ngoài tầm luồng này. Ngưỡng báo user < ~1.800
   chưa tới (còn ~1.157).
6. **RAM thấp nhất lượt 473 MB — thấp nhất từng ghi** (dưới 576 MB
   đợt 129, 547 MB đợt 127) — dao động mạnh theo luồng khác, rơi
   mạnh cuối lượt khi T4/T8 bắt đầu chạy sau cờ; T9 theo dõi RAM
   ghim (nhiệm vụ T9).
7. **Khung giờ #76? chết (10:02:05Z, 10:56:31Z] chưa kẹp hẹp hơn** —
   journal/wtmp chỉ giữ boot hiện tại; không có cách kẹp từ trong VM.
   (Khung #75? chết đã kẹp đợt 129 §2b; khung #74? chết đã kẹp đợt
   129 §2; khung #73? chết đã kẹp đợt 128; khung #72? chết đã kẹp
   đợt 127; khung #71? chết vẫn mở.)
   **Mẫu mới: reboot GIỮA LUỘT lần đầu tiên** đã ghi đợt 129 (§2b) —
   đợt 130 KHÔNG reboot giữa lượt (boot_id không đổi suốt lượt).
8. **Lists #77 sau repair: 75 file / 68 noble** (đầy đủ 2 mirror
   theo số lượng; T5 không đối chiếu tên mirror từng file trong
   lượt này) so với #75 (39 file / 34 noble / 1 mirror) — chức năng
   đủ (apt 11/11, 109 installs). Nếu mirror thứ 2 lại vắng ở boot
   sau thì mới là mẫu.
9. **R9 (a) vẫn chờ user (nhắc lần 16).**
10. **Cooldown file tích lũy (71 file / 994 B, không đổi)** — luật
    prune ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125); việc prune là
    của T6.
11. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 129 §11 + quyết
    parent §12.3: lượt yên WebKit #8 đang chạy (T4, sau cờ); mù #49
    probe thường lệ (T2); G1 chờ user quyết; birefnet (chỉ thử lại
    khi quan sát được available ≥ 6 GB, u2net là fallback chính thức);
    ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
    gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: instrumentation (c2) 2 điểm log + 7 dòng stage
  (md5 `03bf029f` → `805409f0`, mtime 11:40:32Z); `media.ts`: KHÔNG đổi
  (`2c384ed1`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần
  (tham chiếu #76? → #77? trong header + dòng `say`; md5
  `c541c97d…` → `f5c6a411…`; không đổi logic).
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #77?) OK; watcher b77 OK.
- `tsc` apps/web: **exit 0** (~24s). `vite build`: **exit 0**
  (8,09s). (Chạy sau instrumentation, trước repair.)
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  473–3302 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #77?: FAIL 22/24 poll watcher + FAIL ở lần kiểm mở lượt +
  kiểm chứng độc lập + sau sửa script; PASS 3/3 sau repair (poll 23,
  poll 24, final confirm). Watcher b77 v4: 24 poll, tự kết thúc
  `done_pass_stable_2polls`, exit 0. **Reboot GIỮA LUỘT: KHÔNG.**
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL.**
  TRIGGER=YES ở poll 9–10 (11:46:21–11:47:21Z, dpkg im 641s/701s,
  đủ 5/5) → **--repair 1 lần có giám sát 11:47:54Z, THÀNH CÔNG**
  (update ~11,5 phút, install đủ 11/11 gói, postboot PASS).
  **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT** (dạng lỗi là (B),
  apt chết hẳn sau configure, 0 proc).
- Headroom: 2971 (mở) → 2957 (cuối).
- RAM thấp nhất lượt: 473 MB (cuối lượt); cao nhất 3302 MB (poll 7).
- Stale vite.lock: không có (lock dir không tồn tại; queue cooldown
  71 file / 994 B, không đổi).
- Event lag (c2): CHƯA CÓ dữ liệu mới (T4 chưa có attempt JSON lúc
  viết LIMITS); giữ nguyên kết luận đợt 129; instrumentation đã có
  trong cây cho lượt yên #8.

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/src/preview.tsx` (sửa: instrumentation (c2) 2 điểm log).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  tham chiếu #76? → #77? trong header + dòng `say`; md5
  `c541c97d…` → `f5c6a411…`; không đổi logic).
- `docs/PHASE9_ROUND130_T5_INFRA_LIMITS.md` (file này — mới).
- Harness trong hidden_files (KHÔNG stage): `round130-t5/` (log
  watcher b77 v4 (24 poll), log postboot mở lượt/pre-repair/
  after-edit/final (#77?), log repair b77 + quyết định repair, log
  headroom mở/cuối (2971/2957), log RAM mở/cuối (623/473 MB), md5
  trước/sau của postboot-check, md5 preview.tsx sau instrumentation
  (805409f0…), log tsc + vite build, `POSTBOOT_PASS` (cờ hiện tại —
  cho boot #77?, PASS 12:01:24Z), `t5-initial-state.md`,
  `t5-wait-replay-b77.sh`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round130-t5-infra.txt` (NUL-delimited; 3 file repo trên)
  — ĐÃ TẠO + verify read-back: 3 entry, 0 binary.
- Cờ done: `hidden_files/round130-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```

# PHASE9_ROUND129_T5_INFRA_LIMITS — Boot #74? CHẾT trong khung (06:20:05Z, 07:13:31Z]; boot #75? replay KHỞI ĐỘNG MUỘN NHẤT (+1h22m12s) nhưng XONG HẲN 1.509 dòng, PASS +1h29m34s; (c2) +1f tái hiện 2 lần nữa ở lượt yên #7 lần 3 — modal +1/+2 KHÔNG giữ nguyên dạng, cơ chế lấy mẫu chỉ giải thích được độ lớn chứ không phải hình dạng phân phối

> Luồng T5, đợt 129, lượt cron 15:35 +07 17/11/2026 (bắt đầu ~08:38Z trên
> boot #75?, REBOOT GIỮA LUỘT 09:02:12Z sang boot #76?, kết thúc
> ~09:34Z trên boot #76?).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: quyết parent đợt 128 §12.3(h) — T5 đợt 129 chẩn đoán (c2) +1f
> (ghi log draw rawUnit + currentTime để đóng giả thuyết seek-latency
> desync, theo đề xuất T5 đợt 127); LIMITS gộp đợt 128 §11 mục 3;
> R9 (a) vẫn chờ user; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự chạy
> `--repair` khi chưa đủ điều kiện. CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **Boot #74? CHẾT trong khung (06:20:05Z, 07:13:31Z].** btime
   04:55:04Z, boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`. Lần cuối
   còn sống: T10 đóng đợt 128 lúc 06:20:05Z. Tuổi thọ 1h25m01s–
   2h18m27s. Đây là reboot thứ 4 liên tiếp rơi vào khoảng giữa đợt
   đóng và lượt mở (#71→#72 lúc mở đợt 127, #72→#73 giữa đợt 127,
   #73→#74 giữa đợt 127 đóng và lượt 128 mở, #74→#75 giữa đợt 128
   đóng và lượt 129 mở) — mẫu lặp lại đã ghi ở LIMITS gộp đợt 127
   §12.1 mục 4 và đợt 128 §12.1 mục 4.
2. **Boot #75? (MỚI) replay KHỞI ĐỘNG MUỘN NHẤT nhưng XONG HẲN,
   PASS +1h29m34s.** btime 07:13:31Z, boot_id
   `475406f6-8cd8-4a97-a5b3-e798f24d1a26`, sau #74? 2h18m27s.
   Configure 08:35:43Z (boot **+1h22m12s — muộn nhất từng ghi**,
   vượt #54? +47m14s; chỉ 8 giây TRƯỚC lượt cron dispatch
   08:35:51Z, trùng mẫu #74), unpack 08:36:07Z, installs
   08:36:07–08:41:46Z (boot +1h28m15s, dpkg **1509 dòng, 217
   installs**, gói cuối gstreamer1.0-tools). Lists 39 file / 34
   noble, CHỈ 1 mirror azure (khác #74: 71 file / 68 noble / 2
   mirror) — partial/ trống, apt 11/11 PASS, GST 269 — chức năng
   đủ, chỉ ghi nhận khác biệt mirror. Postboot PASS 5/5, 0 FAIL;
   **cờ `POSTBOOT_PASS` cho #75? đã viết 08:43:05Z (đúng boot_id)**
   — T4 đợt 129 gate 0 ĐẠT poll #1 nhờ cờ này (08:43:19Z); cờ đợt
   128 (#74?) STALE. **NHƯNG #75? CHẾT GIỮA LUỘT (xem mục 2b dưới)
   — cờ này nay cũng STALE; xem §3b cho boot #76?.**
2b. **Boot #75? CHẾT GIỮA LUỘT — reboot giữa lượt ĐẦU TIÊN T5 ghi
    nhận.** Chết trong khung (08:59:16Z, 09:02:12Z] (lần cuối còn
    sống: exec T5 lúc 08:59:16Z; poll-t4 cuối 08:58:19Z); tuổi thọ
    1h45m45s–1h48m41s. Phiên T5 bị gián đoạn bởi runtime restart
    đúng lúc VM reboot. Đính chính: T4 đã xong TRƯỚC reboot
    (.done 09:01:41Z, trước reboot 31 giây — lượt yên #7 đã đóng
    với attempt1 duy nhất, median 54,0 ms, lớp B 5/5); reboot rơi
    vào lúc T8 đang chờ cờ + các luồng khác đang phân tích, KHÔNG
    giết attempt nào của T4. Boot #76? mới
    (btime 09:02:12Z, boot_id `88f62ae6-a216-42a9-8a81-b36fd83ca019`)
    replay dạng (B) "chạm mà không cài": configure 09:03:05Z
    (boot +53s, 2 dòng dpkg.log) rồi im hẳn, 0 install, lists 5
    file, GST 0 file, postboot FAIL mọi poll. §8.2(B) TRIGGER=YES
    lúc 09:13:06Z (dpkg im đúng 600s, đủ 5/5 điều kiện, kiểm chứng
    độc lập 09:14:42Z); T5 chạy `--repair` 1 lần có giám sát từ
    09:15:07Z — xem §3b.
3. **Baseline 1.509 dòng / 217 installs giữ 3 boot liên tiếp**
   (#73, #74, #75) — xác nhận thêm nợ (i) đợt 127 đã đóng
   (quyết parent đợt 128 §12.3(g)): #72 (350 dòng) là ngoại lệ
   một lần. Khác biệt duy nhất của #75 là khởi động muộn — khởi
   động muộn không dự báo chết dạng (A) (đã chứng minh ở #74).
4. **Luật §8.2 dạng (B) ngưỡng 10' + luật (C): đánh giá ở MỖI poll,
   KHÔNG kích hoạt.** Trên #75? (replay xong + postboot PASS):
   TRIGGER=NO ở cả 3 poll (postboot PASS nên (1)/(4) chặn).
5. **(c2) +1f: tái hiện thêm 2 lần ở lượt yên #7 lần 3 đợt 129**
   (T4 attempt1 — lượt yên HỢP LỆ, median 54,0 ms, lớp B 5/5: seq
   136, 16/15; seq 181, 36/35 — đều +1f đúng chữ ký cũ) + 3 lần
   đợt 128. **Modal +1/+2 KHÔNG giữ nguyên dạng ngay cả trên lượt
   yên hợp lệ:** đợt 127 (hợp lệ, median 44,0): +1/+2 = 47,3%
   (mode); đợt 129 a1 (hợp lệ, median 54,0): +1/+2 = 33,9%, 0 =
   37,7% (mode); pool đợt 128 (nhiễm tải, n=1144): 0 là mode
   (42,3%), +1/+2 chỉ 23,8%. **Kiểm tra mới (quan trọng):**
   snap−label KHÔNG dự báo được lag theo từng entry (median
   50–70 ms ở MỌI bin lag −14..+4) — cơ chế "sai số lấy mẫu"
   của đợt 127 chỉ giải thích được ĐỘ LỚN (~1–2 frame), không
   giải thích được HÌNH DẠNG phân phối. Phần "frame tương lai"
   (event 276–279) nay khoanh hẹp được thêm: rawCt == labelCt
   chính xác ở mọi ghost trong event + srcKind="canvas" 100% +
   snapCt null 100% → nhãn và lần vẽ ĐỒNG Ý về video time, lệch
   nằm ở canvas drawSrc (lần vẽ cuối của nó không có timestamp).
   Event +10f KHÔNG tái hiện (max +4f ở cả 3 run mới).
6. **Headroom inotify: 3089 (mở #75?) → 3078 (cuối #75?) → 3079
   (cuối #76?)** — gần như không đổi qua reboot (mức nền ~3080);
   vẫn ~1,9 lần số watch vite thường cần (~1586); CHƯA tới ngưỡng
   báo user (< ~1.800), chỉ theo dõi.
7. **RAM khả dụng 962–2486 MB trong lượt** (thấp nhất 962 MB lúc
   mở 08:38Z; 1346 MB lúc 08:41Z; 1561 MB lúc ghi cờ; 2486 MB
   cuối lượt). Dù lấy số nào cũng < 6 GB guard — birefnet không thử.
8. **Stale vite.lock: KHÔNG có lock sót.** Lock dir KHÔNG TỒN TẠI
   lúc mở lẫn lúc cuối. Queue cooldown 69 file / 966 B (khớp số
   T10 đếm lúc đóng đợt 128) — không đổi trong lượt. T5 KHÔNG
   đụng lock/queue.
9. **R9 (a) vẫn chờ user — nhắc lần 15.**
10. **Sửa `postboot-check.sh` 2 lần trong lượt** (md5
    `b3e35169…` → `920d0963…` → `c541c97d…`): tham chiếu boot #74? →
    #75? → #76? (reboot giữa lượt buộc sửa lần 2); `bash -n` OK;
    chạy lại sau mỗi lần sửa PASS ngay lần đầu.

## 2. Boot #74? — chết trong khung (06:20:05Z, 07:13:31Z]

- Boot #74?: btime 04:55:04Z, boot_id
  `c279cf46-a38b-4d93-b6e9-fa251b078108`. Lần cuối còn sống được ghi
  nhận: T10 đóng đợt 128 lúc 06:20:05Z (suite 27/27 + O8 21/21 +
  21/21 đều trên boot này).
- Boot mới btime 07:13:31Z → #74? chết trong khung (06:20:05Z,
  07:13:31Z] (rộng 53m26s). Tuổi thọ 1h25m01s–2h18m27s. Không kẹp
  hẹp hơn được: journal/wtmp chỉ giữ boot hiện tại (first entry
  boot mới 07:13:46Z, +15s); không có quan sát nào trong khung.
- So tuổi thọ các boot gần đây: #66? 27p36, #67? 2h41m32, #68?
  3h01m20, #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m (chết trong
  khung (00:44:50Z, 02:10:17Z]), #72? 54m08s, #73? 1h24m28s–
  1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–1h48m41s (chết
  giữa lượt 129, xem §3.5), #76? chưa biết (sống ≥31m tới cuối lượt T5).
- Đây là lần thứ 4 liên tiếp reboot rơi vào khoảng giữa đợt đóng và
  lượt mở — các luồng đã quen với luật STALE (chờ cờ
  POSTBOOT_PASS của boot mới, không dùng cờ boot cũ). R9 (a) vẫn là
  vá gốc cho vấn đề này (nhắc lần 15).
- **Chốt chặn:** `round-in-progress.md` TỒN TẠI lúc T5 mở, nhưng
  là của CHÍNH đợt 129 này (tạo 08:36Z bởi parent vòng lặp, "Đợt
  129 đang chạy, 9 luồng T1–T9 + T10 đóng sổ") — KHÔNG phải đợt
  main-chat. Luật chốt chặn (chỉ chặn khi đợt main-chat đang chạy)
  không áp dụng; lượt cron làm việc bình thường. Ghi rõ để tránh
  đọc nhầm ở đợt sau: file này là marker của vòng lặp, không phải
  của main chat.

## 3. Boot #75? — replay khởi động muộn nhất, xong hẳn, PASS +1h29m34s

### 3.1 Boot #75? — btime 07:13:31Z, gap 2h18m27s

- Boot #75?: 2026-11-17 07:13:31Z (btime kernel 1794899611;
  `uptime -s` đồng ý; journal first entry 07:13:46Z, chênh +15 s;
  boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`, sau #74?
  2h18m27s). Số thứ tự TẠM, chờ T6 đếm lại mù #37.
- `journalctl --list-boots` CHỈ CÒN 1 boot (hiện tại);
  `last -x` chỉ còn 1 dòng reboot 07:13Z.

### 3.2 Replay #75? — khởi động muộn nhất (+1h22m12s) nhưng xong hẳn, 1509 dòng

| Mốc | Thời gian (Z) | Boot + | Bằng chứng |
|---|---|---|---|
| Boot | 07:13:31 | 0 | btime |
| Configure (2 dòng dpkg.log) | 08:35:43 | +1h22m12s | dpkg.log |
| Unpack (apt-get bắt đầu installs) | 08:36:07 | +1h22m36s | dpkg.log + apt history |
| Installs (217) | 08:36:07–08:41:46 | +1h22m36s–+1h28m15s | dpkg 2 → 1509 dòng |
| Gói cuối gstreamer1.0-tools | 08:41:46 | +1h28m15s | dpkg.log + apt history + term.log |
| Postboot poll1 PASS (replay đang chạy) | 08:41:04 | +1h27m33s | watcher poll 1, exit 0 |
| Cờ POSTBOOT_PASS viết | 08:43:05 | +1h29m34s | watcher poll 3 |
| Final confirm PASS | 08:45:01 | +1h31m30s | exit 0 |
| Post-edit PASS | ~08:46:4x | +1h33m | exit 0 |

- Khởi động MUỘN NHẤT từng ghi: +1h22m12s (vượt #54? +47m14s,
  #74? +40m39s, #72? +25m22s). Nhưng khác #72?: update chạy được
  và installs chạy XONG HẲN (217 installs trong ~5m39s sau
  configure — chậm hơn #74? ~3m08s nhưng xong hẳn, không kẹt).
- Ghi nhận (không suy diễn nhân quả): configure bắt đầu 08:35:43Z,
  chỉ 8 giây TRƯỚC khi lượt cron 15:35 +07 dispatch (08:35:51Z)
  — TRÙNG MẪU #74 (configure 8 giây trước dispatch). Trùng thời
  gian 2 boot liên tiếp, không có bằng chứng liên hệ — chỉ ghi nhận.
- Lists: `/var/lib/apt/lists/` 39 file, 34 file `noble`
  (main/universe/multiverse/restricted + updates/security/
  backports, CHỈ mirror azure.archive.ubuntu.com); `partial/`
  TRỐNG (0 file) — update đã hoàn thành và dọn sạch. Khác #74?
  (71 file, 68 noble, 2 mirror azure + mirror.cogentco.com):
  **#75 chỉ fetch 1 mirror**. Không phải lỗi: apt 11/11 PASS,
  installs đủ 217, GST 269 — chức năng đủ. Ghi nhận khác biệt để
  đợt sau đối chiếu (nếu mirror thứ 2 lại vắng thì mới là mẫu).
- 2 gói từng thiếu ở #65? (libav, plugins-bad) ĐỀU ĐƯỢC CÀI
  (`dpkg-query` ii cả 2; gstreamer1.0-libav ii, plugins-ugly ii,
  libavif16 ii, libevdev2 ii) — mẫu thiếu 2 gói không lặp lại lần
  thứ 6 liên tiếp (#68?, #70?, #71?, #73?, #74?, #75? đều đủ;
  #72? là ngoại lệ do lists noble thiếu).
- `term.log` 0 dòng lỗi; log kết thúc 08:41:46Z.
  `history.log` cho thấy cùng mẫu replay os-intent của host
  (apt-get với DPkg::Post-Invoke ghi dpkg-state).
- 0 apt/dpkg/wrapper đang chạy từ poll 2 (08:42:05Z) trở đi; lock
  dpkg rảnh; dpkg.log đóng băng ở 1509 dòng từ 08:41:46Z.

### 3.3 Bảng so sánh số dòng replay — baseline giữ 3 boot liên tiếp

| Boot | dpkg.log (dòng) | Installs | Khởi động | Kết cục |
|---|---|---|---|---|
| #71? | 1509 | 217 | +9m59s | PASS |
| **#72?** | **350** | **48** | **+25m22s** | **CHẾT dạng (A), lists noble không về** |
| #73? | 1509 | 217 | +38s | PASS +5m51s |
| #74? | 1509 | 217 | +40m39s | PASS +47m52s |
| **#75?** | **1509** | **217** | **+1h22m12s** | **PASS +1h29m34s** |

- Baseline 1.509 dòng / 217 installs / gói cuối gstreamer1.0-tools
  đã trở lại 3 boot liên tiếp sau #72?. **#72 là ngoại lệ một lần**
  — nợ (i) đợt 127 đã đóng chính thức (quyết parent đợt 128
  §12.3(g)); không theo dõi thêm trừ khi dạng 350 dòng tái hiện.
- Khác biệt còn lại của #75? so với baseline chỉ là thời điểm khởi
  động muộn (+1h22m12s — muộn nhất từng ghi) + chỉ 1 mirror lists.
  Khởi động muộn không dự báo chết dạng (A): #72? khởi động muộn
  hơn #71? và chết, nhưng #74? (+40m) và #75? (+1h22m) khởi động
  muộn hơn nữa mà vẫn xong hẳn. Không dùng "khởi động muộn" làm
  tín hiệu cảnh báo đơn lẻ. Mirror đơn cũng không dự báo thiếu gói
  (đủ 217 installs).

### 3.4 Postboot #75? — PASS 5/5, 0 FAIL

- Watcher poll 1 08:41:04Z (boot +1h27m33s), exit 0 — LƯU Ý:
  postboot đã PASS trong khi replay VẪN ĐANG CHẠY (apt-get còn
  sống, dpkg 1409 dòng, installs 202). Nghĩa là các mục kiểm của
  postboot (wrapper/libs/GST/apt) đã đủ TRƯỚC khi installs xong
  hẳn — postboot PASS không đồng nghĩa replay xong; watcher vẫn
  đòi dpkg đóng băng + 0 proc trước khi ghi cờ (đúng thiết kế v4).
- Watcher poll 2–3 (08:42:05–08:43:05Z): postboot exit 0 cả 2
  poll; dpkg 1509 đóng băng (poll 3 frozen=yes); 0 apt/dpkg/
  wrapper; lists 39; GST 269; **cờ `POSTBOOT_PASS` viết 08:43:05Z
  (poll 3, đúng boot_id)**; watcher tự kết thúc
  `done_pass_stable_2polls`.
- Final 08:45:01Z, exit 0: PASS lại toàn bộ. Post-edit ~08:46:4xZ,
  exit 0 (sau khi sửa tham chiếu boot trong script — xem §9).
  Tổng: PASS 5/5 lần kiểm trên #75?, 0 lần FAIL.
- T4 đợt 129 gate 0 ĐẠT poll #1 (08:43:19Z) nhờ cờ này
  (t5flag=PASS, postboot 0, apt 0, dpkg 1509, md5 cây 03bf029f).
- **REBOOT GIỮA LUỘT 09:02:12Z** (xem mục 2b + §3b) — boot #75? chết
  sau khi T5 viết cờ PASS; T5 làm lại từ đầu trên boot #76?.

### 3.5 Boot #76? — replay dạng (B), §8.2(B) TRIGGER=YES, --repair 1 lần có giám sát

- Boot #76?: 2026-11-17 09:02:12Z (btime kernel 1794906132;
  `uptime -s` đồng ý; journal first entry 09:02:29Z, chênh +17 s;
  boot_id `88f62ae6-a216-42a9-8a81-b36fd83ca019`). Số thứ tự TẠM,
  chờ T6 đếm lại mù #37. `journalctl --list-boots` CHỈ CÒN 1 boot
  (hiện tại).
- Replay #76?: configure 09:03:05Z (boot +53s, 2 dòng dpkg.log —
  preflight `dpkg --configure -a`) rồi IM HẲN: tới poll 15
  (09:19:09Z) vẫn 2 dòng, 0 install, 0 apt/dpkg/wrapper, lists 5
  file, GST sys 0 file, postboot FAIL mọi poll. Dạng (B) "chạm mà
  không cài" thuần (khác #72? dạng (A) 48 installs rồi chết; khác
  #45? 0 dòng dpkg).
- §8.2(B) TRIGGER=YES lúc 09:13:06Z (watcher b76 poll 9, dpkg im
  đúng 600s; poll 10 xác nhận im 661s): (1) FAIL tươi yes, (2a)
  0 proc yes, (2b)/(3) im ≥10' yes, (4) dạng (B) yes, (5) 0 probe
  yes (MiniBrowser 0 — T4 đã xong trước reboot, không probe nào đang
  chạy). Kiểm chứng
  độc lập 5/5 lúc 09:14:42Z (postboot exit 1; apt/apt-get/dpkg 0;
  wrapper 2 là FALSE POSITIVE — chỉ là shell của chính lệnh kiểm
  chứa chuỗi mẫu, như đợt 127; fuser lock trống, exit 1; dpkg im
  696s; lists 5; GST 0; RAM 576 MB).
- `--repair` chạy 09:15:07Z (boot +12m55s, dpkg im 721s), 1 lần,
  có giám sát (nohup, log `t5-repair-b76.log`): symlink GST →
  debroot (269 file) ngay đầu; `apt-get update` (timeout 1500s)
  đang chạy — partial/ tăng chậm (0 → 88 lúc 09:19Z → 96 →
  100 lúc 09:21Z), lists vẫn 5 file (mirror chậm, giống đợt 115
  update mất ~12 phút).
- **Kết quả repair (đã xong):** `apt-get update` xong
  ~09:29Z (mất ~14 phút từ ~09:15:20Z; partial/ 0 → 123 file, lists
  5 → 75 file, partial/ về 0); `apt-get install` (timeout 1800s)
  chạy 09:29:xx–09:30:23Z, cài đủ 11/11 gói (REPAIRED apt liệt kê
  đủ: libevent-2.1-7t64, plugins-base/good/bad/ugly/gl, libav, x,
  libavif16, libgstreamer1.0-0, libevdev2); dpkg 2 → 759 dòng, 109
  installs (chỉ 11 gói WebKit/GST + deps — KHÔNG phải toàn bộ replay
  217 gói; host replay nếu chạy sau sẽ bổ sung phần còn lại theo
  thiết kế idempotent). RE-CHECK sau repair: libs PASS đủ 5, GST
  PASS đủ isomp4 + libav, apt PASS đủ 11 — KET LUAN DU DIEU KIEN.
  Watcher b76 poll 27 (09:31:15Z) postboot 0 lần đầu sau repair
  (dpkg 759, 0 proc, lists 75, GST 269); poll 28 (09:32:15Z)
  frozen=yes + postboot 0 → **FLAG_WRITTEN 09:32:15Z (boot
  +30m03s)**; watcher tự kết thúc `done_pass_stable_2polls`.
  Final confirm 09:33:2xZ exit 0; post-edit (sau khi sửa script
  sang #76) ~09:33:4xZ exit 0. Tổng trên #76?: postboot PASS 4/4
  sau repair (poll27, poll28, final, post-edit) + 10 lần FAIL
  trước repair (poll 1–10 watcher + pre-repair tay 09:14:42Z).
  Cờ POSTBOOT_PASS hiện tại là của #76? (boot_id 88f62ae6…).
  GST vẫn là symlink → debroot (269 file) — file plugin apt cài đã
  ghi xuyên symlink vào debroot (caveat đã biết của thứ tự repair).
  Mốc 09:30Z trong task bị trễ ~2 phút (cờ viết 09:32:15Z) do
  mirror chậm (update ~14 phút); toàn bộ xong trước 10:30Z.

## 4. Headroom inotify + RAM

### 4.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| T5, 05:42Z (boot #74?, ~47' tuổi) | 3203 | mở lượt đợt 128 (đã lưu) |
| T5, 05:43Z (boot #74?, ~48' tuổi) | 3205 | cuối lượt đợt 128 |
| **T5, 08:38Z (boot #75?, ~1h25' tuổi)** | **3089** | **mở lượt đợt 129 (đã lưu headroom-open.txt)** |
| **T5, ~08:47Z (boot #75?, ~1h33' tuổi)** | **3078** | **cuối lượt trên #75? (headroom-end.txt)** |
| **T5, ~09:33Z (boot #76?, ~31' tuổi)** | **3079** | **cuối lượt trên #76? sau reboot giữa lượt (headroom-b76-end.txt)** |

- Headroom giảm 11 trong lượt trên #75? (3089 → 3078) và ĐO LẠI
  3079 trên #76? sau reboot — gần như không đổi qua reboot
  (3078 → 3079), cho thấy mức ~3080 là mức nền của cell lúc này
  chứ không phải suy giảm theo từng boot. Chuỗi dài hạn: 4438 →
  4318 → 3645 → 3451 → 3434 → 3334 → 3317 → 3315 → 3203/3205 →
  **3089 → 3078 → 3079**. Vẫn gấp ~1,9 lần số watch vite thường
  cần (~1586). **Vite thường chạy được trên boot này. Chưa tới
  ngưỡng báo user (< ~1.800) — chỉ theo dõi** (quyết parent §12(h)
  đợt 127).
- Trần 63747 vẫn đầy ở mức ~60k watch ngoài cell (theo ghi nhận đợt
  120/121) — cần can thiệp host để dọn/tăng trần, ngoài tầm luồng này.

### 4.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

| Thời điểm | RAM khả dụng | Bối cảnh |
|---|---|---|
| 08:38Z | 962 MB | lúc mở lượt (#75?, thấp nhất lượt) |
| 08:41:04Z (watcher b75 poll 1) | 1343 MB | replay #75? đang chạy |
| 08:43:05Z (watcher b75 poll 3, ghi cờ) | 1561 MB | replay #75? xong |
| ~08:46Z | 2486 MB | cuối lượt trên #75? (ram-end.txt) |
| 09:04:09Z (boot #76? mở) | 1607 MB | lúc mở trên boot mới |
| 09:11:05Z (watcher b76 poll 7) | 961 MB | trước trigger §8.2(B) |
| 09:13:06Z (watcher b76 poll 9, TRIGGER=YES) | 731 MB | lúc trigger |
| 09:14:42Z (kiểm chứng độc lập pre-repair) | 576 MB | thấp nhất lượt |
| 09:31:15Z (watcher b76 poll 27, postboot 0 đầu sau repair) | 576 MB | sau repair |
| ~09:33Z | 576 MB | cuối lượt trên #76? (ram-b76-end.txt) |

- RAM hồi dần trên #75? (962 → 2486 MB) rồi RƠI MẠNH trên #76?
  (1607 → 576 MB trong ~29 phút) khi các luồng đợt 129 khởi động
  lại sau reboot (T4 gate lại, T8 chờ postboot, T2/T6/T9 chạy lại).
  Mức thấp nhất 576 MB vẫn trên kỷ lục thấp đợt 127 (547 MB) nhưng
  là biên mỏng — T9 theo dõi RAM ghim. Dù lấy số nào cũng < 6 GB
  guard — birefnet không thử.
- Swap đã dùng 295–323 MB trong lượt.

## 5. Watcher — b75 v4 (3 poll, ghi cờ, tự kết thúc)

- Chạy 08:41:04–08:43:05Z (3 poll), tự kết thúc
  `done_pass_stable_2polls`, exit 0. Script copy từ bản b74 đợt 128
  (v4) — chỉ đổi btime/mốc/log + ghi chú replay #75 khởi động muộn;
  `bash -n` OK trước khi chạy.
- Poll 1 (08:41:04Z): dpkg=1409 frozen=no, silent 3s, apt-get=1
  (68,8% CPU — đang chạy thật, không kẹt), postboot 0, lists=39,
  GST=269, RAM 1343 MB. EVAL §8.2B TRIGGER=NO (c1 no, c2a no).
- Poll 2 (08:42:05Z): dpkg=1509 frozen=no (poll đầu ở giá trị này),
  silent 19s, apt-get=0, postboot 0, lists=39, partial_frozen=yes,
  GST=269, RAM 1494 MB. TRIGGER=NO.
- Poll 3 (08:43:05Z): dpkg=1509 frozen=yes, silent 79s, apt=0,
  lists=39, partial=0, GST=269, postboot 0 → **FLAG_WRITTEN
  08:43:05Z**.
- Cờ `POSTBOOT_PASS` (round129-t5/): `boot_id=475406f6-8cd8-4a97-
  a5b3-e798f24d1a26 btime=2026-11-17T07:13:31Z pass_at=
  2026-11-17T08:43:05Z poll=3` — đúng boot mới. T4 đợt 129 gate 0
  bằng cờ này (08:43:19Z). Cờ đợt 128 (#74?, c279cf46…) STALE.
- KHÔNG reboot trong lúc watcher b75 chạy (08:41–08:43Z); reboot
  xảy ra SAU ĐÓ, lúc 09:02:12Z (xem §3.5).
- Lỗi hiển thị đã biết, KHÔNG ảnh hưởng EVAL: `last_install` vẫn
  đọc "installed" thay vì tên gói (awk `{print $4}` lấy nhầm cột —
  tên gói ở $5; đã ghi ở LIMITS đợt 127 §7.3 mục 5). Không khởi
  động lại watcher chỉ vì lỗi hiển thị.
- **Watcher b76 v4 (28 poll, 09:05:03–09:32:15Z):** poll 1–10
  postboot FAIL (dpkg 2 dòng, 0 install, lists 5, GST 0),
  TRIGGER=YES từ poll 9 (09:13:06Z, silent 600s); poll 11–25
  (trong lúc --repair chạy) postboot FAIL nhưng TRIGGER=NO (apt
  đang chạy — c2a=no); poll 26 (09:30:14Z) dpkg bắt đầu tăng
  (installs của repair); poll 27 (09:31:15Z) postboot 0 lần đầu
  sau repair (dpkg 759, installs 109, lists 75, GST 269);
  poll 28 (09:32:15Z) frozen=yes + postboot 0 → **FLAG_WRITTEN
  09:32:15Z**, tự kết thúc `done_pass_stable_2polls`, exit 0.
  §8.2(B) đánh giá ở MỖI poll trong suốt 28 poll (xem §7.1 mở
  rộng + §3.5).

## 6. Stale vite.lock — KHÔNG có lock sót (kiểm thực tế trên đĩa)

- Thư mục lock v2 `hidden_files/vite.lock` **KHÔNG TỒN TẠI** lúc
  kiểm mở lượt 08:38Z (#75?), lúc kiểm cuối trên #75? ~08:47Z, lẫn
  lúc kiểm cuối trên #76? ~09:33Z — sạch hoàn toàn.
- Thư mục queue `hidden_files/vite.lock.queue`: **69 file / 966 B**
  trên #75? (khớp số T10 đếm lúc đóng đợt 128; T6 đếm 67 file/
  938 B lúc 05:41Z đợt 128) — không đổi trong lượt trên #75?;
  **70 file trên #76? lúc ~09:33Z** (+1 file, có thể là cooldown
  mới của 1 luồng chạy lại sau reboot — T6 đếm chính thức). Đều là
  cooldown cũ, không chặn luồng khác, không tính là ticket. Luật
  prune cooldown ĐÃ PHÊ DUYỆT (quyết parent §12(c) đợt 125) — việc
  prune là của T6, T5 chỉ ghi số.
- T5 KHÔNG đụng lock/queue (không kill vite, không xóa lock tay).
- Xvfb/MiniBrowser: 0 đang chạy lúc mở lượt (reboot đã xóa sót
  đợt 128: socket X193/X194/X195 T10 đã dọn lúc đóng).

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

### 7.1 Đối chiếu §8.2 — boot #75? (watcher b75 v4, poll 1–3)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 08:41:04Z | 3s | no (exit 0) | no (apt-get 68,8%) | no | no | yes | **NO** |
| 2 | 08:42:05Z | 19s | no (exit 0) | yes | no | no | yes | **NO** |
| 3 | 08:43:05Z | 79s | no (exit 0) | yes | no | no | yes | **NO** |

- Postboot PASS cả 3 poll → không có cơ sở repair nào. Poll 1
  replay còn đang chạy (apt-get 68,8% CPU — sống khỏe, không kẹt);
  poll 2–3 replay đã xong. (1)/(4) chặn trigger ở mọi poll.
- Luật (C) trên #75?: không áp dụng (replay xong + postboot PASS;
  (a) FAIL = no; apt đã chết sau khi hoàn thành, không phải
  sống-kẹt).

### 7.2 Đối chiếu §8.2 — boot #76? (watcher b76 v4, poll 1–28; rút gọn)

| Poll | Thời gian | silent | (1) FAIL tươi | (2a) 0 proc | (2b)/(3) | (4) dạng | (5) 0 probe | TRIGGER |
|---|---|---|---|---|---|---|---|---|
| 1 | 09:05:03Z | 117s | yes (exit 1) | yes | no | B (yes) | yes | **NO** |
| 9 | 09:13:06Z | 600s | yes | yes | yes | B (yes) | yes | **YES** |
| 10 | 09:14:06Z | 661s | yes | yes | yes | B (yes) | yes | **YES** |
| 15 | 09:19:09Z | 963s | yes | no (repair apt đang chạy) | yes | B (yes) | yes | **NO** |
| 26 | 09:30:14Z | 0s | yes | no (repair install) | no | no | yes | **NO** |
| 27 | 09:31:15Z | 52s | no (exit 0) | yes | no | no | yes | **NO** |
| 28 | 09:32:15Z | 112s | no (exit 0) | yes | no | no | yes | **NO** |

- TRIGGER=YES ở poll 9–11 (09:13:06–09:15:07Z; đúng 3 poll — poll 11
  trùng giây repair bắt đầu 09:15:07Z, trước khi apt-get của repair
  xuất hiện; từ poll 12 c2a=no vì repair đang chạy) — đủ 5/5 điều
  kiện dạng (B). T5 kiểm chứng độc lập 5/5 lúc 09:14:42Z rồi chạy
  `--repair` 1 lần (xem §3.5 + quyết định
  `t5-repair-decision-b76.md`).
- Luật (C) trên #76?: không áp dụng — dạng lỗi là (B) (0 install),
  không phải (C) (apt sống-kẹt); apt không sống-kẹt mà chết hẳn sau
  configure (0 proc từ poll 1 tới lúc repair). EVAL_C ở mọi poll:
  b_stuck_maybe=no (partial tăng trong lúc repair, không đóng băng).

## 8. Chẩn đoán event lag (c2) — modal +1/+2 KHÔNG giữ nguyên dạng; cơ chế lấy mẫu chỉ giải thích độ lớn, không giải thích hình dạng

> Phương pháp: chạy lại cùng phương pháp T5 đợt 127 §8.3 trên dữ
> liệu lượt yên #7 đợt 128 (T4 attempt1+attempt2, JSON gốc
> `round128-t4/preview-b-f3-flip-webkit-t4-attempt{1,2}.json`) và
> lượt yên #7 lần 3 đợt 129 (T4 attempt1,
> `round129-t4/preview-b-f3-flip-webkit-t4-attempt1.json` — T4 chỉ chạy
> 1 attempt theo prereg (verdict đã chốt, không có attempt2/3; xem §8.5): pixFrame = frame GT khớp GẦN
> NHẤT nhãn (thresh ≤2 bit, strip 48px kênh G, GT
> `round111-m5/frames-nonperiodic`); histogram CHI TIẾT từng frame
> trên toàn bộ ghost hậu flip+2000ms (pool cả skp=0 và skp=1);
> kèm snapMs−labelMs, rawMs−labelMs, label−floor(labelCt×30).
> Script: `hidden_files/round129-t5/c2-histogram-r128.py`
> (đợt 128) + `/tmp/c2-corr.py` (tương quan lag ↔ snap delay) +
> `/tmp/c2-r129a1.py` (đợt 129 attempt1) — script đợt 128 lưu
> trong round129-t5, output `c2-histogram-r128.txt`.

### 8.1 Histogram (pixFrame−label) — đối chiếu 3 lượt

| Run | n ghost | 0 | +1 | +2 | +1/+2 | +3 | +4 | ≥+3 | <0 | snap−label median |
|---|---|---|---|---|---|---|---|---|---|---|
| **Đợt 127 T9 a2 (lượt yên HỢP LỆ, median 44,0 ms)** | 740 | 265 (35,8%) | 175 | 175 | **350 (47,3%)** | 42 (5,7%) | 0 | 48 (6,5%) | 77 (10,4%) | 38 ms |
| Đợt 128 T4 a1 (nhiễm tải, median 75,0 ms, B2 vi phạm) | 540 | 269 (49,8%) | 45 | 42 | 87 (16,1%) | 80 (14,8%) | 15 | 95 (17,6%) | 89 (16,5%) | 69 ms |
| Đợt 128 T4 a2 (nhiễm tải, median 63,0 ms, B2 vi phạm 1 mẫu) | 604 | 215 (35,6%) | 65 | 120 | 185 (30,6%) | 113 (18,7%) | 10 | 123 (20,4%) | 81 (13,4%) | 55 ms |
| **Đợt 128 pool a1+a2** | **1144** | **484 (42,3%)** | **110** | **162** | **272 (23,8%)** | **193 (16,9%)** | **25** | **218 (19,1%)** | **170 (14,9%)** | **61 ms** |
| **Đợt 129 T4 a1 (lượt yên #7 lần 3)** | **628** | **237 (37,7%)** | **86** | **127** | **213 (33,9%)** | **115 (18,3%)** | **7** | **122 (19,4%)** | **56 (8,9%)** | **45 ms** |

Chi tiết pool đợt 128: {−14: 3, −13: 4, −12: 12, −11: 15, −10: 17,
−9: 10, −5: 4, −4: 2, −3: 2, −2: 6, −1: 95, 0: 484, +1: 110, +2: 162,
+3: 193, +4: 25}. Chi tiết đợt 129 a1: {−13: 2, −12: 3, −10: 1,
−2: 2, −1: 48, 0: 237, +1: 86, +2: 127, +3: 115, +4: 7}.
0 nomatch ở cả 3 run mới (khớp GT chắc chắn, như đợt 127).

- **Modal +1/+2 KHÔNG giữ nguyên dạng.** Đợt 127: +1/+2 là mode
  rõ (47,3%, gấp 1,3 lần bin 0). Pool đợt 128: 0 thành mode
  (42,3%), +1/+2 rơi còn 23,8%. Đợt 129 a1: 0 vẫn là mode
  (37,7%), +1/+2 hồi lên 33,9% nhưng vẫn dưới 47,3%. Hai attempt
  đợt 128 khác nhau MẠNH (a1: +1/+2 chỉ 16,1%, 0 tới 49,8%; a2:
  +1/+2 30,6%) — phân phối NHẠY với tải lượt chạy.
- **Điểm ổn định mới: bin +3 phình to ở cả 3 run mới**
  (14,8% / 18,7% / 18,3% so với 5,7% đợt 127) — ≥+3 chiếm
  ~19% pool đợt 128 và đợt 129 a1, gấp ~3 lần đợt 127. Đây là
  thay đổi có hệ thống, không phải nhiễu 1 run.
- **Caveat cập nhật (quan trọng):** T4 attempt1 đợt 129 LÀ lượt yên
  HỢP LỆ (20/20 pass, median 54,0 ms, lớp B 5/5 ĐẠT — T4 đóng
  09:01:41Z, trước reboot 31 giây; xem LIMITS T4). Vậy so sánh modal
  nay là HỢP LỆ-vs-HỢP LỆ: đợt 127 (median 44,0): +1/+2 = 47,3%
  (mode); đợt 129 a1 (median 54,0): +1/+2 = 33,9%, 0 = 37,7%
  (mode). **Modal +1/+2 KHÔNG tái hiện ở cùng mức ngay cả trên
  lượt yên hợp lệ** — không còn đổ cho nhiễu tải được nữa. Hai lượt
  hợp lệ vẫn khác nhau: median tick 44,0 → 54,0 ms, snap−label
  median 38 → 45 ms, bin +3: 5,7% → 18,3%. Modal "đúng" có thể
  phụ thuộc vào tốc độ tick/mức tải nền của từng lượt hơn là một
  hằng số cấu trúc — cần thêm lượt hợp lệ nữa mới kết luận được
  modal ổn định ở đâu (dự kiến 0/+1/+2 chia nhau ~35/15/20, +3
  ~18%).

### 8.2 Kiểm tra mới: snap−label KHÔNG dự báo lag theo từng entry

Tương quan lag ↔ snapMs−labelMs trên pool đợt 128 (n=1144,
median theo từng bin lag):

| lag | n | snap−label median | lag | n | snap−label median |
|---|---|---|---|---|---|
| −14 | 3 | 38 ms | 0 | 484 | 69 ms |
| −13 | 4 | 70 ms | +1 | 110 | 53 ms |
| −12 | 12 | 61 ms | +2 | 162 | 50 ms |
| −11 | 15 | 64 ms | +3 | 193 | 58 ms |
| −10 | 17 | 67 ms | +4 | 25 | 39 ms |
| −9 | 10 | 39 ms | −1 | 95 | 70 ms |
| −5..−2 | 14 | 74–92 ms | | | |

- Median snap−label nằm phẳng 50–70 ms ở MỌI bin lag từ −14 tới
  +4 — KHÔNG có quan hệ đơn điệu (lag +3/+4 có snap delay NGẮN
  hơn lag 0: 58/39 ms so với 69 ms). Nếu cơ chế lấy mẫu là nguyên
  nhân chính theo từng entry, lag lớn hơn phải đi với snap delay
  dài hơn — dữ liệu BÁC điều đó.
- **Kết luận hiệu chỉnh so với đợt 127:** cơ chế "nhãn gán lúc
  đọc currentTime, pixels lấy mẫu muộn hơn median 38 ms ≈ 1,1
  frame" chỉ giải thích được ĐỘ LỚN của lệch (~1–2 frame) ở mức
  tổng hợp, KHÔNG giải thích được entry nào rơi vào bin nào.
  Lag theo từng entry bị chi phối bởi động lực strip đông cứng
  (curPix run ≥3 tick: 35 run ở đợt 128 a1, 22 run ở a2 — strip
  cập nhật thưa hơn tick blend, xem §8.4 đợt 127) + alias sọc
  chu kỳ 4 frame, chứ không phải độ trễ lấy mẫu của chính entry đó.
  rawMs−labelMs median vẫn 10 ms ở cả 3 run mới (như đợt 127) —
  phần lớn lệch KHÔNG tích lũy ở bước vẽ rawUnit.
- label−floor(labelCt×30): đợt 128 pool {0: 448, +1: 696} (61%
  nhãn +1 so với timestamp của nó); đợt 129 a1 {0: 195, +1: 433}
  (69%) — nhãn tự thân lượng tử hóa +0/+1 như đợt 127 ({0: 236,
  +1: 504}, 68%). Không đổi.

### 8.3 (c2) +1f — vẫn đúng chữ ký cũ, hiếm, không đổi dấu

- Đợt 128: 3 occurrence (c2) thuần +1f — attempt1 seq 364
  (presented 35, label 34); attempt2 seq 102 (16/15) và seq 295
  (31/30). Đợt 129 attempt1: 2 occurrence — seq 136 (16/15) và
  seq 181 (36/35). **Tổng 5 occurrence mới, TẤT CẢ đều +1f,
  không có (c2) nào khác +1f.** Tỷ lệ: 3/1144 ghost đợt 128
  (0,26%) và 2/628 đợt 129 a1 (0,32%) — hiếm hơn đợt 127
  (8/740, 1,1%) nhưng cùng dấu/mức.
- **Event lag ≥+5f: 0 occurrence ở cả 3 run mới** (max +4f) —
  event seq 276–279 đợt 126 (+10f) KHÔNG tái hiện.
- (c2) vẫn là lát cắt quan sát hiếm của lệch hệ thống (+1f), không
  phải cụm frame đặc biệt — các cặp presented/label trải rộng
  (15/16, 30/31, 34/35, 35/36), không tập trung.

### 8.4 Event 276–279 khoanh hẹp thêm: nhãn và lần vẽ ĐỒNG Ý về video time

Đọc lại dữ kiện thô event đợt 126 (T9 attempt2) với 2 trường
chưa dùng ở đợt 127 là rawCt/rawMs của ghost:

| seq | ghost label | labelCt | rawCt | labelMs → rawMs | snapCt |
|---|---|---|---|---|---|
| 276 | 17 | 0,583985127 | 0,583985127 | 46405 → 46412 | null |
| 277 | 19 | 0,666475292 | 0,666475292 | 46489 → 46505 | null |
| 278 | 22 | 0,756596613 | 0,756596613 | 46562 → 46593 | null |
| 279 | 25 | 0,847649183 | 0,847649183 | 46654 → 46667 | null |

- **rawCt == labelCt CHÍNH XÁC (từng bit double) ở mọi ghost
  trong event.** rawCt là lần đọc `srcEl.currentTime` ĐỘC LẬP
  sau khi `rawUnitSource` vẽ xong (`preview.tsx:4383–4387`).
  Nhãn và lần vẽ đồng ý về video time — lệch KHÔNG nằm ở khâu
  "nhãn đọc currentTime, pixels vẽ muộn hơn".
- **srcKind="canvas" ở 100% ghost** (đợt 127: 740/740; đợt 128:
  540/540 + 604/604; đợt 129 a1: 628/628) — pixels KHÔNG BAO GIỜ
  đọc trực tiếp từ video element sống trong các run này; luôn qua
  canvas trung gian drawSrc. **snapCt null ở 100% ghost** —
  snapshot là bản copy của canvas đã vẽ trước, không có timestamp
  riêng của lần lấy mẫu thật.
- **Phần chưa giải thích nay khoanh hẹp chính xác:** canvas drawSrc
  (đầu vào của `rawUnitSource`, `preview.tsx:662–687`, drawImage
  ở `:685`) đã chứa pixels frame 27 trong khi `currentTime` lúc
  vẽ là 0,584–0,848 (frame 17–25). Câu hỏi còn lại duy nhất là:
  drawSrc nhận frame 27 từ video VÀO LÚC NÀO, với currentTime
  nào, và có seek đang chờ không — dữ liệu trên đĩa hiện tại
  KHÔNG ghi lần vẽ nào vào drawSrc/rawUnit, nên không trả lời được.
- **Giả thuyết seek-latency desync VẪN LÀ giả thuyết, chưa chứng
  minh được.** Nhưng nay đã biết chính xác cần ghi gì để đóng nó
  (xem §8.6) — và biết nó KHÔNG phải là lệch nhãn-vs-vẽ
  (rawCt == labelCt đã loại khả năng đó).
- Không kết luận hồi quy từ 1 event; event giữ làm case theo dõi.

### 8.5 Dữ liệu mới đợt 129 — attempt1 LÀ lượt yên hợp lệ, verdict modal cập nhật

- Attempt1 đợt 129 (lượt yên #7 lần 3): **lượt yên HỢP LỆ #7 —
  20/20 pass, median 54,0 ms, lớp B 5/5 ĐẠT** (T4 đóng 09:01:41Z;
  ngưỡng ≤60 ms GIỮ — nợ lượt yên lần 7 ĐÃ ĐÓNG sau 2 đợt không
  đóng được). n=628 ghost, histogram §8.1 dòng cuối; (c2) 2
  occurrence +1f (§8.3); snap−label median 45 ms; max lag +4f;
  0 occurrence ≥+5f.
- T4 chỉ chạy 1 attempt theo prereg (verdict đã chốt với attempt1
  — "tối đa 3 attempt" là trần, không phải định mức). KHÔNG có
  attempt2/3 — đính chính: T4 .done 09:01:41Z, TRƯỚC reboot
  09:02:12Z 31 giây; reboot KHÔNG giết attempt nào của T4 (nó rơi
  vào lúc T8 đang chờ cờ + các luồng khác đang phân tích).
- **Verdict modal (cập nhật):** so sánh hợp lệ-vs-hợp lệ (đợt 127
  median 44,0 vs đợt 129 a1 median 54,0): modal +1/+2 KHÔNG tái
  hiện ở cùng mức (47,3% → 33,9%; 0 thành mode 37,7%). Đây không
  còn là nhiễu tải — phân phối nhạy với tốc độ tick/tải nền của
  từng lượt. Cần thêm 1–2 lượt hợp lệ nữa để xác định modal ổn
  định (dự kiến 0/+1/+2 ~35/15/20, +3 ~18%).

### 8.6 Dữ liệu cần thêm để đóng giả thuyết seek-latency (đề xuất cụ thể, chờ parent quyết)

T5 KHÔNG tự sửa production giữa đợt (preview.tsx md5 03bf029f
không đổi trong lượt này). Đề xuất instrumentation, vị trí chính
xác — cần parent duyệt trước khi làm:

1. Log mỗi lần `rawUnitSource` vẽ (`preview.tsx:685`,
   `rctx.drawImage(drawSrc, …)`): ghi `video.currentTime` lúc vẽ
   + `video.seeking` + `video.readyState` + frameIdx của tick
   (1–2 vòng loop quanh wrap là đủ — không log vĩnh viễn).
2. Log mỗi lần drawSrc-the-canvas nhận frame mới từ video (chuỗi
   tạo drawSrc `preview.tsx:4117–4211`: LUT/effects/enhance —
   canvas nào trong chuỗi đã vẽ frame nào, lúc currentTime nào).
   Đây là mắt xích còn thiếu: drawSrc là canvas đã vẽ trước
   (srcKind="canvas" 100%), lần vẽ cuối của nó không có timestamp.
3. Không cần lượt đo E4 hay TTS nào cho việc này; chỉ cần 1 lượt
   yên có instrumentation trên + histogram đối chiếu lại.

## 9. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` (2 lần, không đổi logic)

- Lần 1 (#75?, ~08:46Z): md5 `b3e35169…` → `920d0963…` (ghi trong
  `postboot-check.md5.before` / `postboot-check.md5.after`).
- Lần 2 (#76?, ~09:33Z): md5 `920d0963…` → `c541c97d…` (ghi trong
  `postboot-check.md5.b76-before` / `postboot-check.md5.b76-after`).
- Chỉ đổi tham chiếu boot (theo mẫu các đợt trước, không đổi logic):
  lần 1: header bổ sung đoạn #74? (chết trong khung (06:20:05Z,
  07:13:31Z]) + đoạn #75? (replay khởi động muộn nhất +1h22m12s,
  xong hẳn 1509 dòng, lists 1 mirror); lần 2: header bổ sung đoạn
  #75? (chết giữa lượt (08:59:16Z, 09:02:12Z]) + đoạn #76? (replay
  dạng (B), --repair 1 lần: update ~14 phút, install xong +28m11s,
  759 dòng); dòng `say` cập nhật tương ứng mỗi lần. **Không lặp sự
  cố đợt 120:** dòng `say` mới không chứa ký tự `"` (dùng `m`/`s`
  thay dấu phút/giây). `bash -n` OK cả 2 lần.
- Kiểm chứng: sau mỗi lần sửa, postboot PASS exit 0 ngay lần đầu
  (lần 1 ~08:46:4xZ; lần 2 ~09:33:4xZ) — logic không đổi đã được
  xác nhận bằng chạy thật.
- KHÔNG đổi thứ tự mục apt trước mục GST trong `--repair` (phương án A,
  R9 §6.3): việc này cần parent duyệt và T5 không nhận được phê duyệt
  đó trong task — giữ nguyên.

## 10. R9 (a) vẫn mở (ghi nhận, không nhắc thêm)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Reboot #74?→#75? giữa đợt đóng và lượt mở này là ví dụ mới nhất
  (lần thứ 4 liên tiếp) cho thấy R9 (a) vẫn có giá trị: T5 phải tự
  phát hiện boot mới + cập nhật script + ghi cờ mới cho #75? trong
  ~5 phút sau khi lượt mở (lượt mở 08:38Z, cờ PASS 08:43:05Z —
  nhanh vì replay xong 08:41:46Z, ~3 phút sau khi T5 mở lượt). Vá §8.4(ii) + cờ gắn boot_id đã giảm thiệt hại,
  nhưng không thay thế R9 (a). Reboot #75?→#76? GIỮA LUỘT lần này
  còn là ví dụ mạnh hơn: không có watcher cron đầu lượt nào bắt
  được nó — T5 phải tự phát hiện sau khi phiên bị gián đoạn, rồi
  làm lại toàn bộ (watcher mới + repair + cờ mới) trong cùng lượt.
- Nhắc lần 15.

## 11. Nợ mở sang đợt sau

1. **Boot #76? đang sống + PASS (sau --repair) — các luồng đo đợt
   129 dùng cờ này** (`round129-t5/POSTBOOT_PASS`, boot_id
   88f62ae6…, PASS 09:32:15Z, xác nhận lại 09:33:2xZ + post-edit
   ~09:33:4xZ). Cờ #75? (475406f6…, PASS 08:43:05Z) đã lưu thành
   `POSTBOOT_PASS.b75-stale`. Nếu #76? cũng chết sớm như #72?
   (54m08s) hoặc #69? (~19–20') thì T5 đợt sau phải làm lại từ đầu.
   Tuổi thọ boot gần đây: #66? 27p36, #67? 2h41m32, #68? 3h01m20,
   #69? ~19–20', #70? ≥53m41s, #71? ≥2h44m (chết trong khung
   (00:44:50Z, 02:10:17Z]), #72? 54m08s, #73? 1h24m28s–1h50m39s,
   #74? 1h25m01s–2h18m27s, #75? 1h45m45s–1h48m41s (chết GIỮA LUỘT),
   #76? chưa biết (sống ≥31m tới cuối lượt T5).
2. **Số thứ tự boot #74?/#75?/#76? CHƯA CHẮC** — chờ T6 đếm lại mù
   #37 (T6 đợt 129 đang chạy). Nếu T6 đếm khác, LIMITS này + script
   postboot-check cần sửa lại số — boot_id + btime không đổi.
3. **(c2) chẩn đoán — verdict modal đã cập nhật bằng lượt yên HỢP LỆ
   đợt 129 a1 (§8.5):** modal +1/+2 không tái hiện ở cùng mức ngay
   cả trên lượt hợp lệ (47,3% → 33,9%); cần thêm 1–2 lượt hợp lệ
   nữa để xác định modal ổn định. T4 chỉ chạy 1 attempt theo prereg
   (verdict đã chốt, không có attempt2/3); instrumentation log draw
   (§8.6) chờ parent quyết — T5 không tự sửa production.
4. **Event seq 276–279 giữ làm case theo dõi** — không tái hiện ở
   3 run mới (max +4f, 0 occurrence ≥+5f); phần "frame tương lai"
   đã khoanh hẹp (§8.4) nhưng chưa đóng.
5. **Headroom tiếp tục giảm dài hạn:** …3334 → 3317 → 3315 →
   3203/3205 → 3089 → 3078 → 3079 (đo lại trên #76? sau reboot —
   gần như không đổi qua reboot, mức nền ~3080). Trần 63747 cần
   can thiệp host — ngoài tầm luồng này. Ngưỡng báo user < ~1.800
   chưa tới.
6. **RAM thấp nhất lượt 576 MB** (trên #76? lúc trigger repair và
   lúc cuối lượt; trên #75? thấp nhất 962 MB lúc mở) — dao động
   mạnh theo luồng khác, rơi mạnh sau reboot khi các luồng chạy lại;
   T9 theo dõi RAM ghim (nhiệm vụ T9).
7. **Khung giờ #75? chết (08:59:16Z, 09:02:12Z] chưa kẹp hẹp hơn** —
   journal/wtmp chỉ giữ boot hiện tại; không có cách kẹp từ trong VM.
   (Khung #74? chết đã kẹp đợt 129 §2; khung #73? chết đã kẹp đợt
   128; khung #72? chết đã kẹp đợt 127; khung #71? chết vẫn mở.)
   **Mẫu mới: reboot GIỮA LUỘT lần đầu tiên** (trước đây chỉ rơi vào
   khoảng giữa đợt đóng và lượt mở) — T4 đã xong trước reboot 31 giây
   (không mất attempt nào), nhưng T8 đang chờ cờ + các luồng khác đang
   phân tích phải gate/chạy lại bằng cờ mới của #76?.
8. **Lists #75 chỉ 1 mirror azure (39 file / 34 noble)** so với #74
   (71 file / 68 noble / 2 mirror) — chức năng đủ (apt 11/11,
   217 installs), chỉ theo dõi: nếu mirror thứ 2 lại vắng ở boot
   sau thì mới là mẫu.
9. **R9 (a) vẫn chờ user (nhắc lần 15).**
10. **Cooldown file tích lũy (69 file / 966 B trên #75? → 70 file
    trên #76?)** — luật prune ĐÃ PHÊ DUYỆT (quyết parent §12(c)
    đợt 125); việc prune là của T6.
11. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 128 §11 + quyết
    parent §12.3: lượt yên WebKit #7 chạy lại lần 3 (T4, đang chạy);
    mù #48 probe thường lệ (T2); G1 chờ user quyết; birefnet (chỉ
    thử lại khi quan sát được available ≥ 6 GB, u2net là fallback
    chính thức); ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm
    lại; release gate không đổi + KHÔNG push khi user chưa nhắn
    "push đi".

## 12. Kiểm chứng hồi quy + file đổi

- `preview.tsx` / `media.ts`: KHÔNG đổi trong lượt này (md5
  03bf029f / 2c384ed1, khớp lúc T10 đóng đợt 128). T5 không sửa
  production; chỉ sửa 1 script harness (2 lần, theo boot) + thêm LIMITS.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock của luồng khác.
- `bash -n`: postboot-check (sau sửa #75? và sau sửa #76?) OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM khả dụng
  576–2486 MB < 6 GB).
- O8: KHÔNG thuộc T5 (luồng khác làm).
- Postboot #75?: PASS 5/5 (watcher poll1–3 08:41:04–08:43:05Z +
  final 08:45:01Z + post-edit ~08:46:4xZ) — 0 lần FAIL.
- Watcher b75 v4: 3 poll, tự kết thúc `done_pass_stable_2polls`,
  exit 0.
- Postboot #76?: FAIL 10 lần trước repair (watcher poll 1–10 +
  pre-repair tay 09:14:42Z), PASS 4/4 sau repair (watcher poll
  27–28 + final + post-edit). Watcher b76 v4: 28 poll, tự kết thúc
  `done_pass_stable_2polls`, exit 0. **Reboot GIỮA LUỘT: CÓ
  (09:02:12Z, #75? → #76?) — lần đầu tiên.**
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL.**
  Trên #75?: TRIGGER=NO cả 3 poll (postboot PASS nên (1)/(4)
  chặn). Trên #76?: TRIGGER=YES lúc poll 9 (09:13:06Z, dpkg im
  600s, đủ 5/5) → **--repair 1 lần có giám sát 09:15:07Z, THÀNH
  CÔNG** (update ~14 phút, install đủ 11/11 gói, postboot PASS).
  **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT** (cả 2 boot:
  #75? replay xong + postboot PASS; #76? dạng lỗi là (B) chứ không
  phải (C) — apt không sống-kẹt mà chết hẳn sau configure, 0 proc).
- Headroom: 3089 (mở #75?) → 3078 (cuối #75?) → 3079 (cuối #76?).
- Stale vite.lock: không có (lock dir không tồn tại lúc mở lẫn lúc
  cuối cả 2 boot; queue cooldown 69 file / 966 B trên #75? → 70
  file trên #76?).
- Event lag (c2): (c2) +1f tái hiện 5 lần mới (3 đợt 128 + 2 đợt 129
  a1), tất cả +1f; modal +1/+2 KHÔNG giữ nguyên dạng ngay cả trên
  lượt yên hợp lệ (đợt 127: 47,3% vs đợt 129 a1: 33,9% — xem §8.5);
  event 276–279 không tái hiện (max +4f); xem §8.

## 13. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND129_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 2 lần:
  tham chiếu #74? → #75? → #76? trong header + dòng `say`; md5
  `b3e35169…` → `920d0963…` → `c541c97d…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round129-t5/` (log
  watcher b75 v4 (3 poll) + b76 v4 (28 poll), log postboot
  poll1–3/final/post-edit (#75?) + poll1–28/final/post-edit/pre-repair
  (#76?), log repair b76 + quyết định repair, log headroom mở/cuối
  (#75?: 3089/3078; #76?: 3079), log RAM mở/cuối, md5 trước/sau của
  postboot-check (cả 2 lần sửa), `POSTBOOT_PASS` (cờ hiện tại — cho
  boot #76?, PASS 09:32:15Z) + `POSTBOOT_PASS.b75-stale` (cờ cũ #75?,
  PASS 08:43:05Z), `t5-initial-state.md`, `t5-reboot-midround-note.md`,
  `t5-wait-replay-b75.sh`, `t5-wait-replay-b76.sh`,
  `c2-histogram-r128.py` + `c2-histogram-r128.txt`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round129-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — ĐÃ TẠO + verify read-back: 2 entry, 0 binary.
- Cờ done: `hidden_files/round129-t5.done` (tạo sau khi LIMITS +
  batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

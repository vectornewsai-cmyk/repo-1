# PHASE9_ROUND119_T4_WEBKIT60MS_LIMITS — F6' WebKit ≤60 ms: KHÔNG CHẠY ĐƯỢC LƯỢT YÊN (0 lượt — 2 reboot + replay không cài GST)

> Luồng T4, đợt 119, lượt cron 06:35 +07 16/11/2026 (bắt đầu ~23:40Z 15/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> Nợ đợt 118 (LIMITS gộp §10 mục 3 + §4): chỉ THEO DÕI ngưỡng WebKit
> ≤60 ms đã chốt (đợt 118 attempt8: median 40,0 ms, p90 64,7 ms, n=644,
> lớp B 5/5, F6' 100%/100% n=65) — chạy MỘT lượt yên xác nhận theo
> đúng phương pháp S5, lần này TRÊN CÂY H3f (T1 apply patch H3f).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không
> đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — KHÔNG CHẠY ĐƯỢC LƯỢT YÊN NÀO (0/1 lượt, 0 probe,
> 0 JSON đo). Ngưỡng ≤60 ms GIỮ NGUYÊN theo trạng thái đợt 118
> (không có số mới để chốt hay mở lại — đúng prereg §1: lượt không
> đạt lớp B / không chạy được thì verdict giữ nguyên). Nợ lượt yên
> theo dõi CHUYỂN TIẾP sang đợt 120.**
> 1. **Boot A (27c8b1d9, btime 23:33:34Z): gate 0 ĐẠT poll #7
>     (23:58:02Z) nhưng 5 attempt (1–4 trọn 10 poll, 5 dở 4 poll)
>     đều KHÔNG MỞ gate A** — T3 dial s79 + T8 giữ lock luân phiên,
>     load5 không xuống dưới 2,09 trong 44 poll (load1 tới 60,32,
>     load5 tới 35,22). Attempt5 chết theo reboot boot B ở gateA
>     poll 4 (00:53:31Z, chưa chạy probe — không mất dữ liệu đo).
> 2. **Boot B (622b3a92, btime 00:53:41Z): gate 0 KHÔNG BAO GIỜ ĐẠT
>     (25 poll, +0–48m, postboot FAIL 25/25).** Replay kết thúc
>     (wrapper chết, dpkg im từ 01:23:43Z) mà KHÔNG cài 9 gói GST —
>     0 dòng dpkg.log về 9 gói; postboot FAIL y hệt sau 40 phút.
>     Gate0-wait bị reboot boot C giết ở poll #25, chưa tới hạn
>     60 phút — nhưng bằng chứng đã đủ kết luận gate 0 boot B
>     không thể ĐẠT.
> 3. **Boot C (fc62a4b7, btime 01:47:49Z): gate 0 KHÔNG ĐẠT (15 poll,
>     +0–28m, postboot FAIL 15/15).** Replay vẫn ở giai đoạn đầu
>     (698 dòng dpkg.log lúc 02:19Z, vẫn cài libc-bin; thư mục GST
>     chưa tồn tại; 5 lib thiếu). Dừng lúc 02:20Z theo prereg (hết
>     ngân sách đợt ~02:35Z; 1 attempt cần ≥15 phút sau gate 0).
> 4. **T7 đã DONE từ 23:49:45Z 15/11 — chỉ làm boot A rồi thoát,
>     SẼ KHÔNG viết POSTBOOT_PASS cho boot B/C.** Thích ứng theo
>     tiền lệ đợt 118 (check-only riêng làm bằng chứng gate 0,
>     ghi trong prereg phụ lục 01:51Z TRƯỚC khi đo trên boot C):
>     **thích ứng này KHÔNG BAO GIỜ CÓ HIỆU LỰC trong thực tế** —
>     ngay cả gate 0 nới lỏng (check-only) cũng không ĐẠT vì
>     postboot tự thân FAIL trên cả 2 boot. Không có probe nào
>     chạy trên boot chưa sẵn sàng.
> 5. **Cây H3f không đổi suốt đợt: preview.tsx md5 `5be5a250…`
>     (ghi lúc T1 apply 23:58Z, kiểm lại cuối 02:20Z).** T1 đã
>     verify sau apply: tsc exit 0 + vite build PASS 7,03 s
>     (23:57Z, theo cờ round119-t1-applied). T4 không sửa production.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round119-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (23:44Z), đăng ký: lớp B gồm B5, gate 0 + lớp A,
  timeout 120 s/pass + JSON tăng dần, quy tắc quyết định ngưỡng,
  kế hoạch theo dõi stale-ghost 2 event riêng biệt + event frame 23
  đợt 118, lấy mẫu load1/RAM giữa lượt. **Phụ lục prereg (01:51Z,
  trước khi đo trên boot C):** thích ứng T7-DONE → check-only (xem
  mục 4 trên). T4 tuân thủ prereg; không có lượt đo nào nên không
  có điểm thích ứng nào khác.
- **Boot trong đợt: BA boot — A rồi B rồi C.**
  - Boot A (`uptime -s` 2026-11-15 23:33:34Z, boot_id
    `27c8b1d9-33dd-4c63-9989-f9254a66dbc2`, số tạm "#57?" theo T7 —
    chờ T6 đếm lại mù #37): T4 bắt đầu trên boot này (~23:40Z,
    boot ~7' tuổi). Journal chỉ còn 1 boot; log #55 + boot 6805e92d
    (~20:17Z) đã mất cùng rootfs rebuild. T7 ghi không có dấu hiệu
    giây nháy ở boot này. Gap #55 (12:51:56Z 15/11) → A =
    10h41'38" (chứa boot 6805e92d ~20:17Z chưa đếm — T6).
  - Boot B (`uptime -s` 2026-11-16 00:53:41Z, boot_id
    `622b3a92-62f0-4514-af82-b78c6fde51d6`): reboot giữa đợt, giết
    attempt5 ở gateA poll 4 (00:53:31Z → btime 00:53:41Z, chênh
    10 s — attempt5 chết TRƯỚC btime ghi nhận 10 s; không giải
    quyết được từ trong cell, ghi nhận như đợt 118). Gap A→B =
    1h20'07". Poller + gate0-wait (boot A) chết theo → khởi động
    lại 00:58:14Z.
  - Boot C (`uptime -s` 2026-11-16 01:47:49Z, boot_id
    `fc62a4b7-623c-40a4-81fd-bc87cc14913a`): reboot giữa đợt lần 2,
    giết gate0-wait boot B ở poll #25 (01:46:46Z, +48m — chưa tới
    hạn 60 phút). Gap B→C = 54'08". Poller + gate0-wait (boot B)
    chết theo → khởi động lại 01:51:11Z. Nhịp reboot ~1h/lần tiếp
    tục (A→B 1h20', B→C 54').
  - Số thứ tự boot (#57?/#58?/#59?) đều TẠM — T6 đợt 119 đếm lại
    mù #37; T4 không đụng bookkeeping mù, chỉ ghi boot id + btime.
- **Replay từng boot:**
  - Boot A: ĐANG CHẠY lúc T4 bắt đầu; bracket (2'05", 7'34"]
    (dpkg đầu 23:35:39, cuối 23:41:08, 1509 dòng — theo cờ
    POSTBOOT_PASS của T7). Postboot PASS live 23:43:45Z + sau
    replay im 23:44:17Z (theo T7).
  - Boot B: (0'53", 30'02"] (dpkg đầu 00:54:34, cuối 01:23:43,
    350 dòng — đếm lúc 01:40Z; dpkg.log sau đó bị boot C ghi đè,
    số 350 dòng là số đã ghi nhận, không đo lại được). **Replay
    KẾT THÚC mà KHÔNG cài 9 gói GST** (0 dòng về
    gstreamer1.0-plugins-base/good/bad/ugly/gl, gstreamer1.0-libav,
    gstreamer1.0-x, libavif16, libevdev2; chỉ 14 dòng
    gstreamer1.0 — toàn gstreamer1.0-tools). Wrapper replay (pid
    787) chết; 0 process apt/dpkg lúc 01:39Z; dpkg im 16+ phút.
    Postboot FAIL y hệt từ poll #1 tới #25 (thiếu 3 lib
    libEGL/libavif/libevdev + GST isomp4/libav + 9 gói apt).
  - Boot C: bắt đầu 01:48:37Z (boot +48"); lúc dừng 02:19Z đã
    698 dòng dpkg.log nhưng vẫn ở giai đoạn đầu (libc-bin cài
    đi cài lại 01:59:37 / 02:09:37 / 02:14:48 — cùng mẫu chậm
    như boot B). Postboot poll #5: thiếu 5 lib (thêm libevent,
    libdw so với boot B) + thư mục GST KHÔNG TỒN TẠI + 9+ gói
    apt chưa cài. Replay wrapper (pid 779) còn sống lúc 02:00Z;
    apt-get đang chạy lúc 02:00:48Z.
- **Cây đo `5be5a250…`** (= cây H3f sau khi T1 apply patch 108
  dòng, 5 hunks, `patch -p1` rc=0, baseline 03bf029f). KHÔNG ĐỔI
  suốt đợt (ghi lúc cờ T1 xuất hiện 23:58Z + kiểm cuối 02:20Z).
  T1 verify sau apply: tsc exit 0 (23:57:29Z) + vite build PASS
  7,03 s (23:57:43Z) — T4 trích từ cờ round119-t1-applied, KHÔNG
  chạy lại tsc/build (cây md5 không đổi nên verify của T1 vẫn
  áp dụng; xem §5). T4 không sửa production (md5 trước = sau
  mọi attempt).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage. (Không dùng tới vì không chạy probe nào.)
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t4-tickcost.py`
  + `analyze-t4-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 / wallbands S5 §1.4 (diff với dry-run đợt
  118 chỉ khác chuỗi đường dẫn tương đối/tuyệt đối, số giống hệt)
  và trên JSON T4 attempt8 đợt 118 tái tạo đúng median 40,0 /
  p90 64,7 / wallbands đợt 118 §2. Analyzer copy từ đợt 118 hoạt
  động đúng (md5 khớp bản đợt 118).
- **Inotify headroom:** T7 đo cho boot A: 670 watch (rơi tiếp từ
  804 #54 — reboot không hồi, tiếp tục giảm; theo cờ POSTBOOT_PASS
  của T7). Vite chỉ chạy với `server.watch.ignored: ["**/**"]`
  (0 watch) — bắt buộc (không chạy vite nào đợt này).
- **Vite lock v2-ONLY** (`apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`), cổng T4 **5187** (như đợt 118; T5 đợt
  119 dùng 5188). Lock script md5 lúc T4 bắt đầu: `5cac10af…`
  (spec v2 đã chốt đợt 118; T9 đợt 119 theo dõi). Lúc T4 bắt đầu:
  lock TRỐNG. **Lock stale-boot sau reboot B:** owner T3 cũ (pid
  54295 chết, boot 27c8b1d9, port 5590) còn sót lại — run-t4.sh
  đợt 119 đã vá để chấp nhận lock stale-boot đủ 4 điều kiện như
  `lock_is_stale` (tiền lệ T5 đợt 118); nhánh này CHƯA BAO GIỜ
  KÍCH HOẠT trong thực tế (gate A trên boot B/C không mở vì
  postboot FAIL trước khi tới gate A; trên boot A lock là live).
  Ghi nhận là code-path chưa kiểm chứng, để đợt sau.
- **T7 DONE từ 23:49:45Z 15/11** (cờ `round119-t7.done`, file
  rỗng): T7 chỉ làm boot A rồi thoát. Không có file mới nào trong
  `hidden_files/round119-t7/` sau 23:46Z. T7 SẼ KHÔNG viết
  POSTBOOT_PASS cho boot B/C (xem §0 mục 4 + §6.5).
- **7/10 luồng đã DONE trước reboot C** (T1 00:13Z, T2 00:14Z,
  T3 01:39Z, T5 00:06Z, T6 00:17Z, T7 23:49Z, T9 23:49Z); chỉ còn
  T4, T8, T10 lúc T4 dừng 02:20Z. T3 (nguồn tải chính) xong 01:39Z
  — máy yên hẳn từ ~02:00Z (load1 0,13–1,49 trên boot C), nhưng
  postboot chưa PASS nên cửa yên đó không dùng được.

## 1. Năm lần thử trên boot A — gate A không mở lần nào

### 1.1 Attempt1–4 (00:06–00:49Z, boot A): gate A không mở (exit 5)

| attempt | khung giờ | gate A 10 poll: load1 / load5 | lock/blockers | RAM lúc bắt đầu |
|---|---|---|---|---|
| 1 | 00:06:55–00:16:01 | 0,63–59,34 / 2,09–29,50 | T8→T3 / 0–7 | 1326 MB |
| 2 | 00:18:03–00:27:10 | 0,53–56,68 / 11,54–32,75 | T3 giữ suốt / — | 521 MB |
| 3 | 00:28:33–00:37:39 | 0,54–53,36 / 11,61–30,98 | T3→T8→khong / 0–1 | 1566 MB |
| 4 | 00:39:01–00:48:08 | 1,25–60,32 / 13,56–35,22 | T3 giữ suốt / — | 771 MB |

Gộp 40 poll attempt1–4 + 5 poll attempt5 = **45 poll gateA, load1
0,47–60,32, load5 2,09–35,22** (tính từ log; 44/45 poll có đủ số
load1/load5 — 1 poll bị tách dòng do lock owner xuống dòng).
**load5 KHÔNG XUỐNG DƯỚI 2,09 trong cả 44 poll** — đây là nút chặn
chính (chỉ cần load5 <2 là đủ điều kiện tải). Điểm gần mở nhất:
attempt1 poll 3 (00:08:58Z): load1=0,63, load5=2,37, lock TRỐNG,
blockers=0, RAM 1792 MB, tree YES — chỉ còn load5 cao hơn ngưỡng
0,37. Attempt3 poll 4–7: lock trống 4 poll liên tiếp (00:31:36–
00:34:37Z, load1 1,01–14,89, RAM 1916–2995 MB) nhưng load5 vẫn
11,61–25,66. RAM lúc bắt đầu attempt: 483–1566 MB (attempt5 bắt
đầu 483 MB — thấp nhất; attempt2 521 MB; attempt4 771 MB).
Nguyên nhân chung: T3 dial s79r3/r4 (56 hog — tải cao kéo dài,
load1 đỉnh 60,32 ở attempt4 poll 9; T3 giữ lock port 5590 gần như
liên tục từ ~00:11Z) + T8 chạy MSB4RB8 (Q8PAUSED, timeout 600 s,
giữ lock port 5189 đầu đợt). T3 DONE 01:39:58Z — sau khi T4 đã
hết attempt trên boot A.

### 1.2 Attempt5 (00:50:26–00:53:31Z, boot A): CHẾT THEO REBOOT B

- Gate A poll 1–4 (00:50:29–00:53:31Z): load1 0,47–37,60, load5
  14,04–21,78, lock T3 giữ suốt, RAM lúc bắt đầu 483 MB.
- **Chết sau poll 4:** không có poll 5, không exit-5, không
  classb — toàn bộ cây tiến trình run-attempt biến mất cùng
  poller + gate0-wait (boot A). Nguyên nhân: **reboot B**
  (btime 00:53:41Z). Attempt5 chưa chạy probe (gate A chưa mở)
  nên không mất dữ liệu đo — chỉ mất 4 poll gate A.
- Chênh thời gian: poll 4 ghi 00:53:31Z, btime boot B 00:53:41Z
  (chênh 10 s — cùng mẫu clock-skew quanh biên reboot như đợt
  118 attempt7, ghi nhận, không giải quyết được từ trong cell).

## 2. Gate 0 boot B — KHÔNG ĐẠT (25 poll, postboot FAIL 25/25)

- Gate0-wait boot B chạy 00:58:14Z–01:46:46Z (poll #1–25, +0–48m).
  Mọi poll: t7flag=co-file-cu-boot-truoc (cờ T7 cũ, mtime
  23:46:58Z < boot B 00:53:41Z — script mới đã chặn đúng cờ cũ),
  t1flag=co, **postboot_exit=1 (25/25)**, apt_procs 0–6, load1
  0,03–60,38, RAM 341–4025 MB.
- Postboot FAIL không đổi suốt 48 phút (log
  `postboot-t4-gate0wait-11.log` + các poll sau): thiếu libEGL /
  libavif / libevdev + GST isomp4/libav + 9 gói apt chưa cài.
- Replay boot B: wrapper (pid 787) chết trước 01:39Z; 0 process
  apt/dpkg lúc 01:39Z; dpkg.log im từ 01:23:43Z (16+ phút); 350
  dòng, 0 dòng về 9 gói GST. **Kết luận: replay đã kết thúc mà
  không cài GST → postboot không thể PASS trên boot B dù chờ đủ
  60 phút.** Gate0-wait bị reboot C giết ở poll #25 (+48m) —
  chưa tới hạn, nhưng bằng chứng đã đủ.
- Lưu ý đếm apt_procs: gate0-wait đếm 1 ở nhiều poll trong khi
  không có apt/dpkg thật đang chạy (kiểm trực tiếp 01:39Z: 0
  process) — dương tính giả do một process dài hạn có chuỗi
  "apt-get"/"dpkg" trong cmdline (wrapper replay / script khác);
  không ảnh hưởng kết luận vì postboot_exit=1 đã chặn gate 0.
  (Cùng mẫu dương tính giả T5 đợt 117 §4.7 / T4 đợt 118 §6.7.)

## 3. Gate 0 boot C — KHÔNG ĐẠT (15 poll, postboot FAIL 15/15)

- Gate0-wait boot C chạy 01:51:11Z–02:19:16Z (poll #1–15, +0–28m).
  Mọi poll: t7flag=VANG-T7-DONE (thích ứng §0 mục 4), t1flag=co,
  **postboot_exit=1 (15/15)**, apt_procs 2–3, load1 0,13–1,49
  (máy YÊN — tải thấp nhất đợt), RAM 533–1377 MB.
- Postboot FAIL không đổi (log `postboot-t4-gate0wait-5.log`):
  thiếu 5 lib (libevent/libEGL/libavif/libdw/libevdev) + thư mục
  GST KHÔNG TỒN TẠI + 9+ gói apt chưa cài. Replay vẫn ở giai đoạn
  đầu: dpkg.log 73 dòng (02:00Z) → 698 dòng (02:19Z), vẫn cài
  libc-bin (01:59:37 / 02:09:37 / 02:14:48 — cùng mẫu chậm như
  boot B). Wrapper replay (pid 779) còn sống lúc 02:00Z; apt-get
  đang chạy lúc 02:00:48Z.
- **Dừng lúc 02:20Z theo prereg:** hết ngân sách đợt (~02:35Z);
  1 attempt cần ≥15 phút sau gate 0 (gate A 10 phút + probe
  ~5 phút + phân tích). Postboot FAIL 15/15 trong 28 phút, replay
  chưa tới GST — không có cơ sở để chờ thêm trong ngân sách.
  Gate0-wait + poller đã dừng tay (kill 02:20Z) để không chạy quá
  ngân sách.

## 4. Số đo chính — KHÔNG CÓ (0 lượt yên)

- Không có JSON đo, không có tickCost median/p90, không có (b)
  unique-match, không có bar F6' mới. **Verdict ngưỡng (theo
  prereg §1, không có lượt ĐẠT lớp B): GIỮ ngưỡng ≤60 ms theo
  trạng thái đợt 118 (attempt8 median 40,0 ms, lớp B 5/5).**
  Không siết, không mở lại — không có số mới.
- Stale-ghost: không có dữ liệu mới (0 lượt). Event frame 23 đợt
  118 vẫn do T5 đợt 119 chẩn đoán (T5 DONE 00:06:55Z: "hố P4,
  KHÔNG hồi quy; không chạy lượt yên mới" — theo cờ
  round119-t5.done; chi tiết xem LIMITS T5). T4 không theo dõi
  thêm được gì.
- So sánh lịch sử: đợt 117 T5 cũng 0 lượt yên (replay #53 đình
  trệ 65+ phút, gate 0 không đạt) — đợt 119 là lần thứ 2 trong 3
  đợt gần nhất T4 không chạy được lượt yên vì hạ tầng/replay,
  nhưng là lần đầu tiên trong 2 đợt liên tiếp có reboot giết
  attempt giữa chừng (đợt 118: 1 reboot; đợt 119: 2 reboot).

## 5. Kiểm chứng hồi quy — cây không đổi, verify của T1 vẫn áp dụng

- `preview.tsx` md5 `5be5a250…` không đổi: ghi lúc cờ T1 xuất hiện
  (23:58Z) = kiểm cuối (02:20Z) = mọi poll gate0-wait (47 poll).
  `media.ts` md5 `2c384ed1` không đổi.
- `tsc` / `vite build`: KHÔNG chạy lại — T1 đã verify sau apply
  H3f: **tsc exit 0 (23:57:29Z) + vite build PASS 7,03 s
  (23:57:43Z)** (theo cờ round119-t1-applied); cây md5 không đổi
  nên verify này vẫn áp dụng. T4 không sửa production nên không
  có gì để hồi quy thêm (không có lượt đo nào để hồi quy trên đó).
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không có lượt đo, không
  sửa code; test 15/15 PASS gần nhất là đợt 118 trên cây cũ
  (03bf029f), không hiểu là đã chạy trên cây H3f. Ghi rõ để khỏi
  hiểu lầm.
- Dry-run analyzer PASS (§0): S5 attempt3 → 49,5/75,0; T4 attempt8
  đợt 118 → 40,0/64,7 (khớp 100%).

## 6. Sự cố hạ tầng trong lúc đo

1. **Reboot B 00:53:41Z (boot_id `622b3a92…`, gap A→B = 1h20'07"):** 
   giết attempt5 (gateA poll 4) + poller + gate0-wait boot A.
   Khởi động lại 00:58:14Z.
2. **Reboot C 01:47:49Z (boot_id `fc62a4b7…`, gap B→C = 54'08"):** 
   giết gate0-wait boot B ở poll #25 (+48m) + poller. Khởi động
   lại 01:51:11Z. Nhịp reboot ~1h/lần tiếp tục.
3. **Runtime restart (không phải reboot VM):** 2 lần làm gián đoạn
   phiên T4 (lần 1 ~00:54Z sau reboot B — làm mất kết quả chờ
   attempt5; lần 2 ~01:41Z trong lúc chờ gate0-wait boot B).
   Phiên T4 tự phục hồi bằng cách kiểm tra lại trạng thái từ đĩa
   (log + cờ + boot_id) thay vì đoán — không mất dữ liệu nào
   ngoài 1 lần chờ sleep bị cắt (đã kiểm lại bằng lệnh trực tiếp).
4. **Replay boot B kết thúc mà không cài GST (xem §2):** nợ hạ
   tầng đứng — replay có thể kết thúc sớm (receipt withheld?)
   mà không cài đủ gói; postboot không PASS thì mọi luồng đo
   WebKit trên boot đó đều chặn. Cần T7/parent xem lại: vì sao
   replay B dừng sau 350 dòng mà không tới 9 gói GST (không có
   trong ledger? hay fail rồi bỏ qua?).
5. **T7 DONE sau boot A (xem §0):** T7 chỉ làm boot A rồi thoát
   (23:49:45Z) — các boot sau không có cờ POSTBOOT_PASS. Tiền lệ
   đợt 118 (check-only) đã được ghi vào prereg phụ lục, nhưng
   đợt này thích ứng đó không bao giờ có hiệu lực (postboot tự
   thân FAIL). **Đề xuất cho đợt sau: hoặc T7 ở lại hết đợt (watcher
   chạy qua reboot), hoặc formalize check-only làm gate 0 chính
   thức khi T7 vắng — quyết parent.**
6. **Lock stale-boot sau reboot B:** owner T3 cũ (pid 54295 chết,
   boot 27c8b1d9) còn sót; run-t4.sh đã vá chấp nhận stale-boot
   (tiền lệ T5 đợt 118) nhưng nhánh này chưa kích hoạt thực tế.
7. **Dương tính giả đếm apt (gate0-wait apt_procs=1 trong khi 0
   apt thật):** xem §2 cuối — cùng mẫu đợt 117/118; không ảnh
   hưởng kết luận (postboot=1 đã chặn).
8. **RAM sụt không rõ nguyên nhân trên boot B/C:** RAM avail rơi
   1895→662 MB trong ~10 phút (01:30–01:40Z, load ~0) và
   1303→533 MB trên boot C (01:51–02:05Z) trong khi không có
   process nào RSS lớn (top RSS lúc 01:40Z: hatch daemon 274 MB;
   còn lại <12 MB). Có thể là page cache/buffer tính vào available
   — ghi nhận, không kết luận (không ảnh hưởng lượt đo vì không có
   lượt nào chạy; nhưng nếu RAM avail <500 MB kéo dài thì gate A
   cũng không mở được — B5 đã chặn trước).

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND119_T4_WEBKIT60MS_LIMITS.md` — file này. **File
  duy nhất trong repo mà T4 thay đổi** (probe copy + analyzer + dữ
  liệu + run script đều ở hidden_files; fixture mp4 là binary
  local-only đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round119-t4-webkit60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round119-t4/`
  (prereg-t4.md [viết trước khi đo + phụ lục thích ứng 01:51Z],
  probe119t4-ghost-k7.webkit.mjs [copy S5, md5 `6603d8fa…`,
  node --check OK], analyze-t4-{tickcost,labellag,skiplatest,
  wallbands,lag5}.py [copy đợt 118, md5 khớp bản đợt 118],
  analyze-t4-dryrun-{s5,a8}-{tickcost,wallbands}.txt [dry-run PASS:
  S5 49,5/75,0 + A8 40,0/64,7, diff với dry-run đợt 118 chỉ khác
  chuỗi đường dẫn],
  b.json [copy S5, md5 `078938cf…`],
  vite.t4-temp.config.mjs [copy S5, HMR tắt, watch.ignored 0 watch],
  run-t4.sh [adapt đợt 119: tree-md5.txt (cây H3f) + chấp nhận lock
  stale-boot (tiền lệ T5 đợt 118)],
  t4-attempt-inner.sh, check-classb-t4.sh [lớp B gồm B5],
  gate0-wait-t4.sh [adapt đợt 119: chờ cả cờ T1 + cờ T7 cho boot
  hiện tại (mtime>=boot); sau 2 reboot: T7FLAG=VANG-T7-DONE khi T7
  đã DONE — xem phụ lục prereg],
  gate0-wait-t4.log [47 poll: boot A 7 (GATE 0 ĐẠT #7) + boot B 25
  (không ĐẠT) + boot C 15 (không ĐẠT)],
  poll-t4.log [mẫu 5 phút + gate0/gateA; poller chết 2 lần theo
  reboot, khởi động lại 00:58:14Z + 01:51:11Z],
  poll-t4.nohup.log, poll-t4-restart1.nohup.log,
  poll-t4-restart2.nohup.log,
  gate0-wait-t4.nohup.log, gate0-wait-t4-restart1.nohup.log,
  gate0-wait-t4-restart2.nohup.log,
  chain-t4.log [attempt1–5 + 2 dòng reboot],
  postboot-t4-gate0wait-{1..25}.log [boot B: FAIL 25/25] +
  postboot-t4-gate0wait-{1..15}.log [boot C: FAIL 15/15 — GHI ĐÈ
  tên file của boot B do gate0-wait khởi động lại (cùng thư mục,
  cùng chỉ số poll); log boot B đã mất tên riêng nhưng nội dung
  FAIL đã trích trong LIMITS này §2 + poll log],
  postboot-t4-attempt{1..5}-gate0.log [attempt1–5 gate 0 trong
  run-t4.sh: PASS (boot A đã sẵn sàng)],
  run-t4-attempt{1..5}.nohup.log,
  tree-md5.txt [`5be5a250`], t1-flag-content.txt [nội dung cờ T1],
  marker-t4-attempt* — KHÔNG CÓ (gate A không mở lần nào nên
  marker chưa bao giờ được chạm — đúng vì probe chưa bắt đầu),
  vite-5187-t4-attempt*.log / run-webkit-t4-attempt*.log /
  load-mid-t4-attempt*.log / ps-before/after / classb — KHÔNG CÓ
  (không attempt nào chạy probe).
  **Lưu ý ghi đè tên file:** gate0-wait khởi động lại 2 lần dùng
  lại chỉ số poll 1..N nên `postboot-t4-gate0wait-{1..15}.log`
  hiện là của boot C (boot B đã bị ghi đè); `gate0-wait-t4.log`
  thì GHI NỐI (append) nên còn đủ 47 poll cả 3 boot. Lần sau nên
  tách hậu tố theo boot để khỏi ghi đè.
- Cờ xong: `hidden_files/round119-t4.done` (kèm verdict 1 dòng).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ — 0 lượt yên đợt 119 (không có số
   mới). Nợ lượt yên theo dõi ĐỢT 119 CHƯA ĐÓNG — chuyển tiếp sang
   đợt 120.** Chạy lượt yên theo dõi thường kỳ theo cùng prereg
   (gate 0 + lớp A + lớp B gồm B5) trên cây hiện tại (H3f, md5
   5be5a250 — hoặc cây mới nếu T1 đổi tiếp).
2. **Replay không cài GST trên boot B (nợ hạ tầng mới):** replay
   kết thúc sau 350 dòng mà 9 gói GST không có trong dpkg.log —
   cần T7/parent chẩn đoán (ledger thiếu 9 gói? replay fail rồi
   bỏ qua? receipt withheld?). Nếu replay các boot sau cũng vậy,
   mọi luồng đo WebKit đều chặn ở gate 0.
3. **T7 DONE sau boot A (nợ vận hành mới):** các boot sau không
   có cờ POSTBOOT_PASS. Đề xuất: T7 ở lại hết đợt (watcher chạy
   qua reboot) HOẶC formalize check-only làm gate 0 chính thức
   khi T7 vắng — quyết parent (xem §6.5).
4. **Stale-ghost event frame 23:** không có dữ liệu mới đợt 119
   (0 lượt). Theo dõi tiếp ở các lượt yên sau; chẩn đoán cơ chế
   là T5 đợt 119 (DONE 00:06Z).
5. **Lock stale-boot chưa kiểm chứng thực tế:** nhánh chấp nhận
   lock stale-boot trong run-t4.sh (vá đợt 119) chưa kích hoạt
   lần nào — đợt sau có reboot thì kiểm chứng (hoặc bỏ nếu T5
   đã kiểm chứng đủ đợt 118).
6. **Tên file postboot gate0-wait bị ghi đè khi khởi động lại:**
   tách hậu tố theo boot (vd `postboot-t4-<boot>-gate0wait-<n>.log`)
   để khỏi mất log boot cũ.
7. **Nợ khác đứng yên theo LIMITS gộp đợt 118 §10 + quyết parent
   §12:** E4 lô đo lớn (T2 đợt 119 DONE 00:14Z — xem LIMITS T2);
   H3f đã apply + A/B (T1 DONE 00:13Z: tick chậm 41→19, longtask
   tổng -52,3%); điểm gãy GIỮ 19,63 (T3 DONE 01:39Z: s79r3 GIỮ
   80,1% @24,80, s79r4 TRUNG GIAN 56,9% @27,35); ghost seek H-D
   ĐÃ ĐÓNG đợt 118; mù #37 chờ T6 (DONE 00:17Z — xem LIMITS T6);
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403
   chờ user; release gate không đổi. Reboot mới nhất: boot C
   01:47:49Z (gap B→C = 54'08").

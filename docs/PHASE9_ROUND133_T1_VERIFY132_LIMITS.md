# PHASE9_ROUND133_T1_VERIFY132_LIMITS — T1 kiểm chứng độc lập đợt 132

> Luồng T1, đợt 133, lượt cron 03:35 +07 18/11/2026 (mở lượt 20:35Z 17/11/2026).
> **VERDICT: PASS — xác nhận CHẤP NHẬN CÓ ĐIỀU KIỆN của T10 (đợt 132) đứng vững.**
> Mọi claim lớn của đợt 132 đều tái kiểm đúng bằng code/bằng chứng độc lập trên đĩa.
> Tìm được **5 sai số mới (F-133-1 → F-133-5), tất cả đều KHÔNG đổi verdict nào.**
> KHÔNG push. KHÔNG release/tag. Không code giả — mọi claim dưới đây đều có bằng chứng trên đĩa.

## 0. Phương pháp + phạm vi

- **Đếm:** code riêng viết mới tại `hidden_files/round133-t1/t1-count-132.py` (không chạy
  verbatim script của T10/T1-132). Quét trực tiếp mọi file `phase9-round<N>-*.txt` trong
  `~/workspace/repo-1-push/paths-loop/`, tách entry theo byte NUL, tính lũy kế bằng **hợp tập hợp
  trực tiếp** (không cộng số học lũy kế), đối chiếu chéo `u(111–132) == u(111–131) | u(132)`.
- **LIMITS gộp 132:** đối chiếu sha256 + byte-size lúc đóng với bản hiện tại; diff bản copy lúc đóng
  với bản hiện tại.
- **Claim từng luồng:** đọc trực tiếp log/script/dữ liệu gốc của luồng đó trong
  `hidden_files/round132-*/` + file LIMITS của luồng + `PHASE9_GAP_ANALYSIS.md` §61; không tin
  lời T10 mà không có vết trên đĩa. Chỗ nào chỉ kiểm lại được qua log (trạng thái đã trôi) thì
  ghi rõ, không tuyên bố kiểm lại được.
- **Thời gian kiểm:** 20:40–21:10Z 17/11/2026, boot hiện tại `07da9c50` (btime 19:34:15Z — cùng
  boot lúc đóng đợt 132, chưa reboot sau khi đóng).

## 1. Đếm cuối đợt 132 + lũy kế — KHỚP HOÀN TOÀN

| Phạm vi | T10 công bố | T1-133 tái kiểm trực tiếp | Khớp |
|---|---|---|---|
| Đợt 132 (gồm closing) | 10 batch / 13 entry / 12 file duy nhất | **10 / 13 / 12** | ✅ |
| Lũy kế 111–131 (tái kiểm) | 208 / 526 / 463 (số công bố đợt 131) | **208 / 526 / 463** | ✅ |
| Lũy kế 111–132 (gồm closing) | 218 / 539 / 473 | **218 / 539 / 473** | ✅ |
| File mới-only đợt 132 | 10 | **10** | ✅ |
| File đợt 132 trùng 111–131 | 2 | **2** | ✅ |

Chi tiết đợt 132 (đếm trực tiếp từ đĩa, log đầy đủ tại `round133-t1/t1-count-132.out`):

| File paths | Entry |
|---|---|
| phase9-round132-closing.txt | 2 |
| phase9-round132-t1-verify131.txt | 1 |
| phase9-round132-t2-eperm.txt | 1 |
| phase9-round132-t4-quiet10.txt | 1 |
| phase9-round132-t5-infra.txt | 2 |
| phase9-round132-t5b-infra.txt | 2 |
| phase9-round132-t6-lockhealth.txt | 1 |
| phase9-round132-t7-scheduler.txt | 1 |
| phase9-round132-t8-viteharness.txt | 1 |
| phase9-round132-t9-headroom.txt | 1 |
| **Tổng** | **10 batch / 13 entry / 12 duy nhất** |

- 13 entry vs 12 duy nhất: `apps/web/scripts/vcut-webkit-postboot-check.sh` xuất hiện 2 lần
  (cả file T5 và file T5b) — trùng lặp duy nhất trong đợt, đã giải thích đúng.
- 10 file mới-only: 9 LIMITS luồng (T1/T2/T4/T5/T5b/T6/T7/T8/T9) + LIMITS gộp 132.
  2 file trùng 111–131: `PHASE9_GAP_ANALYSIS.md` + `apps/web/scripts/vcut-webkit-postboot-check.sh`.
- Đối chiếu: 463 + 10 = 473 ✅; `u(111–132) == u(111–131) | u(132)` ✅.
- **Mọi đường dẫn đợt 132 đều tồn tại trên đĩa** (0 thiếu).
- **Định dạng:** cả 10 file đều NUL-delimited thuần (0 ký tự newline, kết thúc bằng NUL).
- Đây là lần tái kiểm độc lập thứ bảy liên tiếp khớp số công bố (111–131 = 208/526/463).

## 2. LIMITS gộp đợt 132 — sha/size lúc đóng vs hiện tại

| | Lúc đóng (T10, 20:27:30Z) | Hiện tại (T1-133 đo 20:40Z) |
|---|---|---|
| Byte-size | 46.287 B | **51.513 B (+5.226 B)** |
| sha256 | `3bde88b2…659e2d3` | `726cb033…97950e` |

- **Bản copy lúc đóng khớp đúng:** `round132-t10/PHASE9_ROUND132_LIMITS.closing-copy.md` =
  46.287 B, sha256 `3bde88b2…659e2d3` ✅ — bài học F-132-1 đã phát huy: nội dung trước §12.3
  khôi phục được đầy đủ từ bản copy.
- **Diff copy-lúc-đóng → bản hiện tại: chỉ có 2 loại thay đổi, đều đã giải thích:**
  1. Dòng tiêu đề §12.2 sửa từ `### 12.2 Chờ quyết parent` thành
     `### 12.2 Chờ quyết parent (đã quyết ở §12.3 dưới)` (1 dòng).
  2. Thêm mới §12.3 QUYẾT PARENT (a)–(g) + footer "Batch stage / Tổng batch đang chờ user push"
     (pure append sau dòng 201). Không có dòng cũ nào khác bị sửa hay xóa.
- **Không có thay đổi nào không giải thích được** sau khi đóng. File dài thêm là do quyết parent
  ghi vào, đúng như dự kiến trong brief (bài học F-132-1/F-132-2).
- **F-132-2 đã được đính chính đúng:** §12.3(g) viết sha LIMITS gộp đợt 131 hiện tại là
  `71d02fce…` — T1-133 đo trực tiếp: `docs/PHASE9_ROUND131_LIMITS.md` hiện là
  `71d02fcee532fcd8694f783b91be9da74b7b7d350b5cf640cd69e61c5da64b0e`, 57.139 B ✅.
  Claim "680e00fe… chỉ khớp bản lúc đóng đợt 131" đứng vững (không đo lại được bản lúc đóng
  đợt 131 vì đợt đó không lưu copy đầy đủ — đúng như F-132-1 đã ghi).
- **GAP không đổi sau khi đóng:** `PHASE9_GAP_ANALYSIS.md` hiện 306.422 B, mtime 20:28:30Z —
  đúng y số T10 ghi lúc đóng ✅.

## 3. Bảng đối chiếu từng claim lớn

### 3.1 Lượt yên WebKit #10 — 0 attempt, gate A kẹt RAM (T4)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| 75 poll gate A | `round132-t4/poll-t4.log`: đúng **75 dòng `gateA poll`** (đếm trực tiếp) | ✅ |
| RAM gate A 427–552 MB, 0 poll ≥1024 MB | min **427** / max **552** MB trên đúng 75 dòng đó; 0 poll ≥1024 | ✅ (xem F-133-1 về số 420) |
| 8 lần chạy run-t4.sh, 55 poll boot cũ + 20 poll boot mới | Bảng §3 T4 LIMITS khớp log: lần 1–5 ×10 poll, lần 6 ×5 poll, lần 7–8 ×10 poll = 75 | ✅ (xem F-133-3 về chữ "đều hết 10 phút") |
| Chỉ tiêu chí RAM fail; load1 max 0,49 / load5 max 0,31; lock trống 75/75; blockers 0 75/75; cây md5 805409f0 75/75 | Đếm trực tiếp trên 75 dòng `gateA poll`: load1 max **0,49**, load5 max **0,31**, 0 dòng lock≠khong, 0 dòng blockers≠0, 0 dòng md5 khác | ✅ |
| Gate 0 đạt cả 2 boot: b379ecd7 poll #23 (18:35:08Z), 07da9c50 poll #6 (19:48:04Z) | `gate0-wait-t4-b379ecd7.log`: 23 poll, #23 `postboot_exit=0` 18:35:08Z; `gate0-wait-t4-07da9c50.log`: 6 poll, #6 `t5flag=PASS` 19:48:04Z | ✅ (lưu ý: ở #23 b379ecd7, `t5flag` vẫn `chua-co` — gate 0 đạt theo `postboot_exit=0`, cờ file tới sau; không mâu thuẫn, xem §6) |
| 0 attempt / 0 JSON / 0 log draw | `round132-t4/` còn nguyên **61 file** (đếm trực tiếp); chỉ có script + log + fixture `b.json` (video-spec test, không phải artifact attempt); không có file attempt JSON/draw nào | ✅ |
| T4 LIMITS 30.492 B | File tồn tại, nội dung khớp các số trên | ✅ |

### 3.2 Suite 27/27 + O8 21/21 (T10)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Suite cây gộp 27/27 exit 0, 0 rerun | `round132-t10-suites.log`: đúng **27 dòng `exit=0`**, **0 lần nhắc "rerun"**; bắt đầu 20:16:54Z, `ALL DONE 20:20:39Z`, boot 07da9c50, RAMavail 535 MB lúc bắt đầu; `preview-engine: 354 assertions pass` | ✅ |
| O8 Chromium 21/21 exit 0 | `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note`, `O8-Chromium exit=0 20:21:43Z` | ✅ |
| O8 WebKit 21/21 exit 0 | `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail, 0 note`, exit 0 20:22:35Z; tổng **42 dòng PASS** (21+21), 2 dòng chứa "fail" đều là `0 fail` | ✅ |
| WebKit FULL PASS lần thứ mười liên tiếp (đợt 123–132) | Đọc 10 file `round12{3..9,3{0,1,2}}-t10/t10-o8.log`: **cả 10 đều `WebKit: 21/21 pass`** | ✅ |
| Cây không đổi trong lúc đóng | md5 hiện tại trên đĩa vẫn `preview.tsx 805409f0…`, `media.ts 2c384ed1…`, `vite.config.ts ee80d093…` — khớp số T10 ghi; mtime preview.tsx 11:40Z 17/11 (trước lúc đóng) | ✅ |
| Không reboot trong lúc đóng | Suite log + O8 log đều boot 07da9c50; btime hiện tại vẫn 19:34:15Z, boot_id `07da9c50…` | ✅ |
| Lock trống lúc đóng (0 ticket + 76 cooldown); 0 process sót; /tmp/.X11-unix/ trống lúc đóng | **Chỉ kiểm lại được một phần qua log** — trạng thái đã trôi (xem §6). T6 ghi 0 ticket + 75 cooldown lúc 17:45Z; T10 ghi 76 lúc ~20:22Z — chênh 1 cooldown trong ~2,5h, hợp lý (luồng T8/T10 tự dùng lock), không phải mâu thuẫn. | ⚠️ log-only |

### 3.3 Reboot giữa lượt lần thứ 6 + khung chết 19 s (T5/T5b)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Boot b379ecd7 chết trong khung (19:33:56Z, 19:34:15Z] — rộng 19 s, hẹp nhất từng kẹp | T4: gateA poll cuối boot cũ 19:33:56Z (lần 6 poll 5); `/proc/stat` btime hiện tại = 1794944055 = **19:34:15Z**; boot_id hiện tại `07da9c50…` | ✅ |
| Reboot giữa lượt lần thứ 6 liên tiếp | Chuỗi 6 sự kiện reboot liên tiếp quanh các đợt 129–132 đều có trong LIMITS gộp các đợt: 129 giữa lượt #75→#76 (09:02:12Z); 130 ranh giới #76?→#77? (10:56:31Z); 130 giữa lượt #77→#78? (13:02:41Z); 131 giữa lượt f868abad→ad1327ef (15:01:30Z); 132 ranh giới ad1327ef→b379ecd7 (17:24:08Z); 132 giữa lượt b379ecd7→07da9c50 (19:34:15Z). Không có đợt nào từ 129 tới nay không có reboot. | ✅ (xem F-133-5 về cách đếm/nhãn) |
| Replay boot cũ 1.551 dòng / 222 installs; boot mới 1.545 dòng / 221 installs | T4 gate0-wait log độc lập ghi `dpkg_lines=1551` (b379ecd7 #21) và `dpkg_lines=1545` (07da9c50 #5/#6) — khớp T5/T5b | ✅ |
| Nhánh archive v5 kích hoạt LIVE lần đầu, cờ gate-visible 19:46:27Z; T4 gate 0 đạt nhờ cờ này | T5b LIMITS §5.1 + gate0-wait 07da9c50 #6 `t5flag=PASS` 19:48:04Z — khớp thời gian | ✅ |
| Pha 2 (c2) không có dữ liệu — 0 attempt, 0 JSON, 0 (c2), 0 log draw | Cùng bằng chứng §3.1 (0 attempt) | ✅ |

### 3.4 Probe #51 / mù #51 / gap mới / mù #49 B (T2)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Probe #51 ok=2 fail=0 (17:46:50Z, boot b379ecd7 #81?) | GAP §61 + T2 LIMITS §1; file `round132-t2/` đầy đủ (probe log, session log) | ✅ |
| Mù #51 KHÔNG đóng hoàn toàn: A đóng (85 mốc, lỗ lớn nhất 96 s), B mở tối đa 3 ẩn (194 mốc, lỗ lớn nhất 4.392 s = đuôi 16:10:55Z→17:24:08Z), C đóng | `round132-t2/blind51-investigate.log`: A `marks=85 largest_mtime_gap=96s`; B `marks=194 largest_mtime_gap=4392s (16:10:55 → 17:24:08)`; C `marks=62 largest_mtime_gap=819s` — khớp T2 LIMITS | ✅ (xem F-133-2 về 4392 vs 4393) |
| Gap mới #79?→#80? = [2.079 s, 2.099 s] CHỨNG NHẬN DẠNG KHOẢNG, CERT n=45 / FULL n=60 | `blind51-gaps.txt`: `gap #79?->#80? = INTERVAL [0h34'39", 0h34'59"] mid 0h34'49" CERTIFIED` (= [2079, 2099] s, mid 2089 s); `CERT45` + `FULL60` đầy đủ, kèm sensitivity LO/HI; cross-check tái hiện đúng CERT44/FULL59 của T2-131 trước khi cộng | ✅ |
| #80? trong dải cơ học lần thứ 10; #81? lần thứ 11 | `blind51-gaps.txt`: `#80? … INSIDE (10th consecutive)`; `#81? … INSIDE (11th consecutive)` | ✅ |
| Mù #49 B kiểm lại lần thứ hai giống hệt — verdict không đổi | `blind49-recheck2.log`: A `largest_gap=116s`; B `largest_gap=2252s … floor(2252/1147)=1`; C `largest_gap=2363s` — khớp đúng số T2-130 đã ghi (A 116 s đóng, B 2.252 s mở tối đa 1 ẩn, C 2.363 s đóng bằng uptime) | ✅ |
| EPERM 0 sóng thật; WFS lần 38 chênh 0 (883/246; R7b 908/263; copies 25/17) | `eperm-sweep-run.log`: 2 dòng "đã tắt" là dương tính giả đã biết (launcher T10-O8); `scan-wfs-run.log`: `R7B … 908 … 263`, `COPIES … 25 … 17` (đối chiếu T2 LIMITS: 883/246 là WFS chuẩn, 908/263 là R7b, 25/17 là copies) | ✅ |
| RAM max trong mù 3.145 MB (52% guard, đoạn B); birefnet KHÔNG chạy | `ram-max.txt`: seg B max **3145 MB** 15:07:10Z; seg A max 2431 MB; seg C không có mẫu | ✅ |
| Mù #52 MỚI MỞ | GAP §61 + T2 LIMITS ghi rõ; là việc T2 đợt 133 | ✅ |

### 3.5 Headroom 2.738 (T9)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Headroom 2.738 (đo 2 lần: 2.745 lúc 17:40:47Z, 2.738 lúc 17:42:07Z) | T9 LIMITS §1 + bảng đo; số học tự kiểm: 63.747 − 2.738 = **61.009** watch ngoài cell ✅; 2.846 − 2.738 = **108** (−3,8%) ✅; chuỗi dài hạn 4.438 → 2.738 = −1.700 (−38,3%) ✅ | ✅ |
| Trần inotify 63.747 không đổi; script `round109-k8/k8-headroom.py` dùng lại | Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` (T9 ghi 63.747); script tồn tại tại `hidden_files/round109-k8/k8-headroom.py` | ✅ |
| Birefnet không thử (chỉ thử khi available ≥6 GB); u2net là fallback chính thức | T9 LIMITS ghi rõ; không có bằng chứng birefnet chạy trong đợt 132 | ✅ |

Lưu ý: T9 không đo lại trong đợt này bằng phép đo mới của T1-133 (số đo headroom là trạng thái
tại thời điểm đo; đo lại bây giờ — khi các luồng đợt 133 đang chạy — sẽ cho số khác, không phải
là kiểm chứng của số 17:40Z). Kiểm chứng ở đây là: script tồn tại, số học đúng, chuỗi dài hạn
nối tiếp đúng với các đợt trước.

### 3.6 T6 / T7 / T8 (thường lệ)

| Claim | Bằng chứng | Kết quả |
|---|---|---|
| T6: lock trống lúc mở + lúc đóng đợt 132; prune cooldown lần 7 xóa 0 file; chuỗi boot tương đối chốt (#57→#81) | T6 LIMITS §2/§8: `status` 17:40Z và 17:45Z đều `TRỐNG, 0 ticket + 75 cooldown` | ✅ (log-only; trạng thái lock đã trôi) |
| T7: cửa KHÔNG sạch — HB thiếu mới 2, DR thiếu mới 1; HB 00:20:50+07 muộn +887 s; HB 42/178, DR 47/160 | T7 LIMITS §1: bảng slot + dòng `+887 s` + lũy kế 42/178 (+2, mẫu +6) và 47/160 (+1, mẫu +3) — số học lũy kế khớp | ✅ |
| T8: BLOCKED 0/3 (không chạy harness nào); waiter #1 mất deadline, bị reboot giết SIGTERM; waiter #2 dừng đúng 20:10:35Z | T8 LIMITS §4/§5; cờ `round132-t4.done` xuất hiện 20:20Z — sau deadline waiter 20:10Z — nên BLOCKED của T8 đúng ở thời điểm của nó (T10 đã đối chiếu, không mâu thuẫn) | ✅ (xem F-133-3 về chữ "đều hết 10 phút") |
| T3: chỉ prereg bước 1 (P1–P5/P7), bước 2 chuyển đợt 133; không có cờ `.done` là đúng theo quyết parent 20:14Z | `round132-t3/prereg-t3.md` tồn tại, đăng ký **17:45Z** (xem F-133-4); không có `round132-t3.done` — đúng quyết parent | ✅ |

## 4. Sai số mới tìm được (F-133-N) — tất cả KHÔNG đổi verdict

### F-133-1 — Brief nói RAM gate A "420–552 MB", đo trực tiếp là 427–552 MB (không đổi verdict)
- T4 LIMITS viết đúng **427–552 MB**; T1-133 đếm trực tiếp trên 75 dòng `gateA poll` trong
  `poll-t4.log`: min 427 MB (lần 6 poll 1, 19:29:56Z), max 552 MB (lần 1 poll 5, 18:42Z).
- Số 420 không có trong `poll-t4.log`; nguồn gần nhất là T8 LIMITS viết "~420–540 MB"
  (ước lượng làm tròn). Chênh 7 MB trên dải ~500 MB, không ảnh hưởng kết luận "gate A kẹt RAM"
  (ngưỡng 1024 MB vẫn xa). **Sửa:** dùng 427–552 MB khi trích dải gate A; 420 chỉ là làm tròn
  của T8, không phải số đo.

### F-133-2 — Lỗ lớn nhất đuôi B mù #51: 4.392 s vs 4.393 s (không đổi verdict)
- `blind51-investigate.log` + T2 LIMITS + GAP §61 viết **4.392 s** (4392 s).
- `blind51-gaps.txt` viết `merged largest gap 4393s tail`; LIMITS gộp viết khung chết
  `(16:10:55Z, 17:24:08Z] (4.393 s)`.
- Số đúng theo phép trừ: 17:24:08 − 16:10:55 = **4.393 s**. Số 4.392 thiếu 1 s — nhiều khả năng
  do quy ước biên (đầu mút loại trừ) khi tính mtime-gap giữa hai mốc, không phải lỗi đo.
- **Không đổi verdict:** floor(4392/1147) = floor(4393/1147) = **3 ẩn tối đa**; khung chết
  4.393 s và verdict "B mở" giữ nguyên. Đề nghị T2 các đợt sau ghi rõ quy ước biên khi báo
  lỗ đuôi (tránh hai số khác nhau cho cùng một đuôi trong hai file).

### F-133-3 — T8 viết "8 lần thử đều hết 10 phút" — lần 6 chỉ chạy 5 poll rồi bị reboot giết (không đổi verdict)
- T8 LIMITS (dòng 9, 26, 50, 85): "8 lần thử mở gate A … đều hết 10 phút", "8/8 lần thử
  timeout", "Mỗi lần: 10 poll gate A". LIMITS gộp §12.3(g)/tóm tắt parent lặp lại
  "8 lần timeout 10 phút".
- Sự thật theo bảng T4 LIMITS §3 (đã đối chiếu đúng `poll-t4.log`, 75 dòng): lần 6 chỉ có
  **5 poll (19:29:56–19:33:56Z) rồi bị reboot giết**; chỉ **7 lần** chạy đủ 10 poll.
  Đúng phải viết: "7 lần timeout đủ 10 phút + 1 lần bị reboot giết ở poll 5".
- **Không đổi verdict:** tổng vẫn 75 poll, vẫn 0 attempt, lượt yên #10 vẫn không đo được.
  Nhưng chữ "8/8 timeout" là sai sự kiện và đã lan sang LIMITS gộp — T8 các đợt sau cần
  đối chiếu bảng poll của T4 trước khi viết số lần timeout (tiền lệ: T8 đợt 130 từng báo sai
  "session T4 đã chết").

### F-133-4 — Brief nói prereg T3 "đăng ký 17:46Z", file ghi 17:45Z (không đổi verdict)
- `round132-t3/prereg-t3.md` dòng 4: "**Đăng ký lúc 17:45Z 17/11/2026 — TRƯỚC khi T4 đo.**"
  (mtime file 17:49:57Z là lần ghi cuối). Không có chỗ nào trong hồ sơ đợt 132 ghi 17:46Z.
- Đây là lệch 1 phút trong tóm tắt brief, **không phải lỗi của đợt 132** — hồ sơ đợt 132
  tự nhất quán ở 17:45Z, và prereg vẫn đứng trước khi T4 đo (T4 bắt đầu gate 0 lúc 17:51Z).
  Ghi lại để brief sau khỏi lặp số sai.

### F-133-5 — Nhãn "reboot lần thứ N liên tiếp" dùng cho hai chuỗi đếm khác nhau (không đổi verdict)
- Sự kiện thì đủ và đúng (xem §3.3): 6 reboot liên tiếp quanh các đợt 129–132, không đợt nào
  từ 129 tới nay thiếu reboot — nên "lần thứ sáu liên tiếp" cho reboot b379ecd7→07da9c50 đứng
  vững nếu đếm **chuỗi gộp mọi reboot** (129-giữa-lượt, 130-ranh-giới, 130-giữa-lượt,
  131-giữa-lượt, 132-ranh-giới, 132-giữa-lượt).
- Nhưng cùng nhãn "lần thứ 5 liên tiếp" xuất hiện cho hai sự kiện khác nhau: LIMITS gộp đợt 130
  gọi reboot ranh giới #76?→#77? là "lần thứ 5" (chuỗi chỉ-tính-ranh-giới), trong khi T5-132 gọi
  reboot ranh giới ad1327ef→b379ecd7 cũng là "lần thứ 5" (chuỗi gộp — đúng vị trí thứ 5 trong
  chuỗi gộp, nhưng sai nếu hiểu theo chuỗi ranh-giới, vì chuỗi đó tới đây đã là lần thứ 7).
  Tương tự, đợt 131 gọi cùng một reboot vừa là "lần thứ 3" (dòng 45/54, chuỗi sau-khi-đo) vừa
  là "lần thứ 4" (dòng 7/58, chuỗi gộp).
- **Không đổi verdict:** mọi khung chết/btime đều đúng; chỉ nhãn đếm gây nhầm. Đề nghị: chốt
  MỘT định nghĩa chuỗi duy nhất (khuyến nghị chuỗi gộp mọi reboot quanh đợt) và ghi rõ định
  nghĩa khi dùng nhãn "lần thứ N" — tránh hai số khác nhau cho cùng một sự kiện ở các đợt sau.

## 5. Những gì T1-132 đã tìm (F-132-1→4) — trạng thái sau kiểm lại

| Sai số cũ | Trạng thái |
|---|---|
| F-132-1: LIMITS gộp đợt 131 vùng trước §12.3 ngắn hơn lúc đóng 193 B, chỉ có sha snapshot | Đã rút bài học đúng: T10 đợt 132 lưu **cả sha + bản copy đầy đủ** — T1-133 xác nhận copy khớp sha lúc đóng (§2). Đóng. |
| F-132-2: §12.3(g) đợt 131 viết "sha lúc đóng khớp đúng bản hiện tại" là sai chữ | Đã đính chính đúng trong §12.3(g) đợt 132; T1-133 đo trực tiếp sha hiện tại đợt 131 = `71d02fce…` ✅. Đóng. |
| F-132-3: script histogram của T10 đợt 131 crash + thiếu code hồi quy | **Vẫn mở, không thuộc phạm vi đợt 132** — T1-133 không kiểm lại (script đó thuộc đợt 131). Ghi nhận để T10 đợt 133 lưu ý khi viết script hồi quy mới: script phải chạy được + chứa đủ code tính mọi số nó công bố. |
| F-132-4: §10.3 đợt 131 ghi GAP 283.910 B là số cũ | Đóng theo nghĩa đã ghi nhận; GAP lúc đóng đợt 132 là 306.422 B và hiện vẫn đúng 306.422 B (§2). Bài học chung: ghi size GAP kèm thời điểm đo. |

## 6. Giới hạn của lần kiểm chứng này (trung thực)

- **Trạng thái đã trôi, chỉ kiểm lại được qua log:** lock lúc đóng (0 ticket + 76 cooldown),
  0 process sót, `/tmp/.X11-unix/` trống lúc đóng, RAM lúc T10 bắt đầu suite (535 MB — có trong
  log header, khớp), số watch ngoài cell lúc T9 đo. T1-133 không tuyên bố kiểm lại được những
  trạng thái này bằng quan sát trực tiếp hiện tại (đợt 133 đang chạy, trạng thái đã khác).
- **Không chạy lại suite/O8:** suite 27/27 và O8 21/21 được kiểm bằng cách đếm lại dòng kết quả
  trong log gốc của T10 (27 dòng `exit=0`, 42 dòng PASS, 0 `fail` ngoài `0 fail`) + đối chiếu
  md5 cây — không chạy lại vì chạy lại sẽ cho số đo mới của cây hiện tại, không phải bằng chứng
  cho số đo lúc đóng. Log gốc đầy đủ, timestamp + boot_id khớp nhau (suite 20:16:54–20:20:39Z,
  O8 20:20:50–20:22:35Z, cùng boot 07da9c50).
- **Không đo lại headroom:** lý do như §3.5 (số đo là trạng thái tại thời điểm đo; đo lại bây giờ
  sẽ khác vì đợt 133 đang chạy). Kiểm bằng số học + chuỗi nối tiếp + script tồn tại.
- **Gate 0 b379ecd7 poll #23:** `t5flag` lúc đó vẫn `chua-co`, gate đạt theo `postboot_exit=0`
  (script postboot check exit 0 sau khi T5 repair xong gstreamer1.0-gl). Đây là cách T4 định
  nghĩa gate 0 (exit code, không phải cờ file) — nhất quán với log, không phải sai số; ghi rõ
  để tránh hiểu lầm "cờ chưa có mà gate đã đạt".
- **Không kiểm chứng lại toàn bộ nội dung 10 file LIMITS luồng** (mỗi file 15–56 KB) theo từng
  dòng; chỉ kiểm mọi claim lớn + mọi con số được trích trong brief/T10/LIMITS gộp. Các claim
  nhỏ không trích ở đây vẫn nằm trong LIMITS của từng luồng, chịu trách nhiệm của luồng đó.

## 7. Kết luận

- **Verdict: PASS.** Đếm cuối đợt 132 (10/13/12; lũy kế 218/539/473) tái kiểm đúng bằng code
  riêng, tính trực tiếp từ đĩa. Sha/size LIMITS gộp lúc đóng khớp bản copy đã lưu; phần dài thêm
  sau đóng chỉ là §12.3 + footer quyết parent. Lượt yên #10 0 attempt (75 poll gate A, RAM
  427–552 MB) đúng; suite 27/27 + O8 21/21 ×2 đúng; WebKit FULL PASS lần thứ 10 liên tiếp
  (123–132) đúng; reboot giữa lượt lần thứ 6 + khung chết 19 s đúng; mù #51/gap [2.079, 2.099] s
  CERT n=45/FULL n=60/mù #49 B kiểm lại lần 2 giống hệt đúng; headroom 2.738 đúng.
- **5 sai số mới (F-133-1→5) đều không đổi verdict:** lệch 7 MB ở cận dưới RAM trong brief;
  lệch 1 s ở lỗ đuôi B mù #51; T8 viết sai "8/8 timeout" (thực ra 7 + 1 lần bị reboot giết);
  brief lệch 1 phút giờ đăng ký prereg T3; nhãn đếm chuỗi reboot dùng hai định nghĩa khác nhau.
- **CHẤP NHẬN CÓ ĐIỀU KIỆN của T10 đứng vững.** Điều kiện chuyển đợt 133 (lượt yên #10 với cơ
  chế chờ RAM mới + T3 bước 2 + T5 pha 2 + widen trigger §8.2(B) + probe #52/mù #52) giữ nguyên.
- **Nợ mở chuyển đợt 133 (từ LIMITS gộp đợt 132 §11, T1-133 xác nhận vẫn mở):** F-132-3
  (script hồi quy phải chạy được); F-133-2 (ghi rõ quy ước biên lỗ đuôi); F-133-3 (T8 đối
  chiếu bảng poll T4 trước khi viết số timeout); F-133-5 (chốt một định nghĩa chuỗi reboot);
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ thử khi available ≥6 GB.

## 8. Stage (KHÔNG push)

- File LIMITS này: `docs/PHASE9_ROUND133_T1_VERIFY132_LIMITS.md`.
- Stage file: `repo-1-push/paths-loop/phase9-round133-t1-verify132.txt` (1 entry, NUL-delimited,
  verify read-back, 0 binary).
- Hồ sơ làm việc: `hidden_files/round133-t1/` (`t1-count-132.py` + `t1-count-132.out`).
- Cờ: `hidden_files/round133-t1.done` (dòng đầu: verdict một dòng).
- Chốt chặn `round-in-progress.md` KHÔNG xóa (việc của T10).

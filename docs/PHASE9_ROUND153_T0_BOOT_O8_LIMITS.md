# Đợt 153 T0 — Boot survey: REBOOT #45 (boot mới 401fca75, btime 07:32:38Z) + boot cũ c741f5e6 CÒN SỐNG tới ≥08:18:19Z (overlap ≥45m41s) + kiểm chứng cơ chế O8 JSON stamped còn đúng (WebKit FAIL 3/4, chữ ký kẹt mới F-153-T0-1)

Ngày: 20/11/2026 (T0 mở ~08:36Z, đóng ~09:05Z; boot `401fca75`). Máy đo: VM này
(CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright — lần này chỉ chạy WebKit).
Phạm vi: (1) boot survey + đối chiếu reboot #43/#44; (2) kiểm chứng cơ chế O8 JSON
theo lượt (F-151-T10-2, sửa ở đợt 152) còn đúng ở gốc bằng MỘT lần chạy O8 WebKit
trong scratch riêng. KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet,
KHÔNG sửa preview.tsx, KHÔNG sửa driver T8, KHÔNG sửa 2 script O8 (chỉ đọc + chạy).
Nợ: quyết parent (a)–(l) đợt 152; T2-152 giao mù #76? (#44) cho T2-153.

## 0. Kết luận ngắn

- **Reboot #45: CÓ.** Boot mới **401fca75-bece-45b6-88fa-b12f602d6390**,
  btime **1795159958 = 07:32:38Z** (đối chiếu: #43 btime 05:20:57Z, #44 btime
  07:04:11Z — T2-152/T7-152). Boot lúc mở khác #44 → có reboot sau #44.
- **⚠️ PHÁT HIỆN MỚI — boot cũ c741f5e6 KHÔNG chết lúc 07:32:38Z:** nó còn sống
  và làm việc tới ít nhất **08:18:19Z** (mtime aggregate 152) — **overlap hai
  boot ≥ 45m41s**. Đây là **cell mới boot song song (migration), không phải
  reboot tại chỗ giết boot cũ**. Cửa sổ chết của cell cũ: **(08:18:19Z,
  08:35:51Z]** (mốc cuối: lượt cron 153 dispatch trên cell mới). Xem §1.
- **Đồng hồ: KHÔNG có nghịch lý tại #45.** F-measure +2/+3 s trên cả 3 server
  (example/google/cloudflare, 2 lần 08:40Z + 08:51Z); now−uptime = btime
  (+0,88 s, trong sai số đọc); đồng hồ cell cũ cũng khớp giờ scheduler ở
  07:57:26Z (T7-152). **btime 07:32:38Z là giờ thực.** Khác #42 (≥+18 s) và
  #44 (≥+10 s).
- **Cơ chế O8 JSON: CÒN ĐÚNG.** Một lần chạy WebKit trong scratch riêng
  (cổng :191/5564/8861): JSON stamped
  `o8w-clicktest-report-2026-11-20T08-47-58-401fca75-attempt1-pid25315.json`
  TỒN TẠI, `run={stamp 2026-11-20T08-47-58, bootId 401fca75, pid 25315}`;
  bản latest tên cố định md5 BẰNG stamped (`33bd318d…`); **7 JSON cũ
  (T0-152 ×3 + T8-152 ×4) md5 KHÔNG ĐỔI**; JSON khớp log (9 logLines +
  harnessError, đối chiếu từng dòng bằng script — xem Phụ lục B).
- **O8 WebKit verdict: FAIL — 3 pass / 1 fail.** S0, S1, S2-import PASS;
  **S2 thêm clip W lên timeline FAIL sau ~447 s kẹt**; harnessError
  `page.setInputFiles: Target page, context or browser has been closed`;
  EXIT=124 (timeout 480 giết node sau khi catch đã ghi JSON). **Chữ ký mới
  F-153-T0-1** (xem §3). Đây KHÔNG phải lượt O8 chính thức của đợt 153
  (T8-153 phán chuỗi) — chỉ là chạy kiểm chứng cơ chế của T0.
- **Không sửa code repo nào** (chỉ thêm LIMITS này). Không chạy Chromium
  fallback (lý do §6.2). Không chạy tsc / vite build / npm test (không chạm
  code TS/app).

## 1. Boot survey — reboot #45 + overlap hai boot

### 1.1 Các mốc reboot (đối chiếu T2-152/T7-152)

| # | Boot cũ → mới | Btime (giờ thực) | Ghi chú |
|---|---|---|---|
| #42 | 2e430750 → fad2aab9 | 03:25:16Z | T2-152; gap ứng viên [7.163, 7.167] s |
| #43 | fad2aab9 → 18e179e0 | 05:20:57Z | TRƯỚC phiên 152; gap ứng viên [6.939, 6.943] s |
| #44 | 18e179e0 → c741f5e6 | 07:04:11Z | GIỮA phiên 152; viết lại run 152 (điểm (m) thứ 5) |
| **#45** | **c741f5e6 → 401fca75** | **07:32:38Z** | **Boot mới song song; boot cũ còn sống tới ≥08:18:19Z (xem §1.2)** |

Boot lúc mở phiên T0-153 (08:36Z): `401fca75-bece-45b6-88fa-b12f602d6390`,
uptime 1:03 → boot ~07:33Z (khớp brief parent). Xác nhận độc lập lúc 08:37Z:
`/proc/stat` btime 1795159958 = 07:32:38Z; `uptime -s` 07:32:38Z;
`/proc/1` mtime 07:32:49.57Z, starttime 1.069 ticks = 10,69 s → PID 1 start
wall ≈ 07:32:48Z (lệch 0,83 s — cùng họ 0,51 s đợt 151 / 0,91 s đợt 150 /
0,83 s đợt 152); journal chỉ 1 boot, entry đầu 07:32:49Z = btime +11 s;
wtmp bắt đầu 07:32:49Z = btime +11 s. Tất cả khớp nhau trong ~1 s.

### 1.2 PHÁT HIỆN: boot cũ c741f5e6 còn sống sau btime boot mới — overlap ≥45m41s

Ban đầu tưởng #45 là reboot thường (boot cũ chết lúc 07:32:38Z). Dữ kiện gốc
bác bỏ điều đó — **5 bằng chứng độc lập, đều từ file/log gốc**:

1. **Sampler log T9-152** (`hidden_files/round152-t9/ram-sampler.log`, 124 dòng):
   **10 mẫu đóng dấu ≥07:32:38Z vẫn `boot=c741f5e6`** (07:33:33Z → 07:42:34Z),
   cadence đúng 60 s, KHÔNG có gap tại 07:32:38Z (gap duy nhất quanh đó là
   71 s tại #44). Sampler đọc boot_id FRESH mỗi mẫu
   (`boot=$(cat /proc/sys/kernel/random/boot_id …)` trong `sampler.sh`,
   `sleep 60` đơn điệu) — mẫu sau btime boot mới KHÔNG THỂ là của boot cũ
   nếu boot cũ đã chết. Đếm bằng script (Phụ lục A.3): 86 mẫu 18e179e0 +
   38 mẫu c741f5e6.
2. **T7-152 đọc boot_id 7 lần** (LIMITS T7-152 §2.3/§2.5 + F-152-T7-0):
   `18e179e0 → c741f5e6 đúng 1 lần, tại #44`; lần đọc cuối **~07:57:26Z vẫn
   c741f5e6**, kèm **run-age cross-check với DB scheduler: 8.495 s**
   (07:57:26Z − started_at 05:35:51Z = 8.495 s đúng từng giây) — đồng hồ
   cell cũ khớp giờ host lúc 07:57:26Z, tức cell cũ còn sống lúc đó.
   Kiểm lần 5 (07:31:54Z, age 6.963 s) cũng khớp từng giây.
3. **T10-152 đóng sổ trên c741f5e6** (aggregate §10.5): cờ t10 08:14:28Z,
   aggregate mtime **08:18:19Z** — đều sau btime boot mới 45–46 phút.
4. **Journal cell mới: 165 dòng trong cửa sổ 07:35–08:35Z**, trong đó
   `home-assistant-ensure.service` chạy mỗi ~70 s (07:35:45Z, 07:36:55Z,
   07:38:05Z, …) — cell mới đã chạy systemd ngay từ 07:32:49Z, song song
   với cell cũ đang chạy sampler/T7/T10.
5. **Quét toàn `~/workspace` tìm file đổi trong (08:18:19Z, 08:35:51Z]: chỉ
   2 file** — aggregate lúc 08:18:19Z (mốc biên) và
   `system/system_prompt.md` lúc 08:35:37Z (file hệ thống của runtime khi
   mở phiên mới, không phải luồng đợt 152). **Không có ghi chép nào của
   cell cũ sau 08:18:19Z.**

**Kết luận:** #45 là **cell mới boot song song** (migration — cell mới đã boot
lúc 07:32:38Z trong khi cell cũ tiếp tục chạy), KHÔNG phải reboot tại chỗ.
Cell cũ chết trong cửa sổ **(08:18:19Z, 08:35:51Z]** (sau ghi cuối của T10,
trước lượt cron 153 dispatch trên cell mới). Dấu mốc phiên mới bắt đầu trên
cell mới: `system_prompt.md` 08:35:37Z + dpkg 2 dòng startup 08:35:40Z,
11 s trước dispatch 08:35:51Z. Overlap tối thiểu: 08:18:19Z − 07:32:38Z =
**45m41s**. Hệ quả: **không có process nào của đợt 152 bị giết lúc
07:32:38Z** (T7/T9/T10 làm việc bình thường trên cell cũ sau mốc đó) — khác
hẳn #39/#41/#42/#44 (giết sleep, viết lại run). T10-152 ghi "không reboot
nào sau #44" là ĐÚNG trên cell cũ lúc đóng (cell mới đã boot song song
nhưng vô hình với `/proc` của cell cũ).

### 1.3 Đồng hồ tại #45 — không có nghịch lý

- F-measure (chuẩn T2: Date header 3 server): **08:40:00Z local vs
  08:40:02–03Z server; 08:51:12Z local vs 08:51:14Z server** → đồng hồ cell
  mới chính xác trong +2/+3 s (cùng họ F≈0/+1 s các boot trước, sai số gồm
  độ trễ mạng). Xem Phụ lục A.2.
- `now − uptime = btime` (+0,88 s ở cả 2 lần đọc 08:50Z/08:51Z — trong sai số
  đọc, không có bước nhảy giờ kể từ boot). Journal cell mới: 0 dòng
  timesyncd/chỉnh giờ.
- Đồng hồ cell cũ cũng chính xác lúc cuối đời (T7 cross-check §1.2 mục 2).
- **Không có nghịch lý clock tại #45** (khác #42 ≥+18 s, #44 ≥+10 s).
  btime 07:32:38Z là giờ thực; tuổi thọ danh nghĩa của c741f5e6 tính từ
  btime #44 (07:04:11Z) tới btime #45 (07:32:38Z) = **1.707 s** là **tuổi
  của cell cũ tới lúc cell mới boot, KHÔNG phải tới lúc cell cũ chết**
  (chết trong (08:18:19Z, 08:35:51Z] → tuổi thật ≈ 4.450–5.460 s; khoảng
  rộng vì giờ chết chưa pin — giao T2-153, xem §7.1).

### 1.4 Dấu hiệu khác trên boot mới (ghi nhận, không phải việc T0)

- **ENOSPC / inotify vẫn tiếp diễn trên boot mới:** journal boot mới có
  **14 dòng `No space left on device`** lúc 08:51Z
  (`home-assistant-ensure.service: Failed to add control inotify watch
  descriptor …`, cadence ~70 s, vd 08:36:25Z / 08:37:35Z / 08:38:45Z) —
  cùng chữ ký T9-152 ghi ở boot cũ (35 dòng). Bảng watch vẫn đầy sau
  reboot/migration (giữ ngoài cell, như T9 đã kết luận). **T0 chỉ đếm dòng
  journal, KHÔNG đo headroom — giao T9-153.**
- dpkg.log cell mới: chỉ 2 dòng startup 08:35:40Z + `gstreamer1.0-tools`
  configure/install 08:50:42Z (trong lúc O8 của T0 kẹt — xem §3; không
  phải do T0 chạy apt; không quy nguyên nhân, xem F-153-T0-3).
- `ps` lúc mở: 0 process sót của đợt 152 (không vite/playwright/sampler/
  watcher); chỉ systemd/hatch + các luồng 153 đang chạy.

## 2. O8 JSON — kiểm chứng cơ chế stamped còn đúng ở gốc

### 2.1 Script gốc không đổi

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | `4994b4fc…` | `4994b4fc…` | Không — khớp đúng số T0-152 đóng |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | `c8acd72e…` | `c8acd72e…` | Không — khớp đúng số T0-152 đóng |

Không sửa file code nào trong repo. (Bằng chứng phụ: T8-152 đã chạy cơ chế
này ở lượt chính thức — 2 JSON WebKit stamped riêng pid39105/pid39569 +
1 JSON Chromium pid39921 vẫn còn trên đĩa, md5 không đổi qua lần chạy
này — xem Phụ lục B.)

### 2.2 Cách chạy (1 lần WebKit, scratch riêng)

- Scratch riêng `hidden_files/round153-t0/o8-webkit/`; fixture copy từ
  `round87-o8/headed/` (o8-white/ball-720p-6s.mp4 + o8-track-35-65.json).
- Env: `O8W_SCRATCH=<scratch> O8W_DEV_PORT=5564 O8W_DISPLAY=:191
  O8W_ATTEMPT=1`, `timeout 480 node apps/web/scripts/…-webkit.mjs`.
  Cổng/display RIÊNG để không tranh với T8-153 (mặc định :188/5560).
- Vite lock TRỐNG lúc mở (log cuối t8-round152 RELEASED 06:33:45Z); không
  có vite/X nào đang nghe lúc mở. Log đầy đủ: `round153-t0/o8-153t0.log`.

### 2.3 Kết quả chạy + bảng kiểm chứng (script Phụ lục B)

| Mốc (Z) | Sự kiện |
|---|---|
| 08:47:56 | Bắt đầu; vite dev :5564, DISPLAY :191, bridge :8861 |
| 08:48:01 | Bridge OK; sóng EPERM đã tắt |
| 08:48:03 | Vite dev đã lên |
| 08:48:08 | WebKit 27.2 launched |
| 08:48:23 | **PASS S0** mẫu tự load (3 clip, media mau-1/mau-2, 1280x720) |
| 08:48:28 | **PASS S1** tắt auto-proxy (checked=true → false, mouse click lần 2) |
| 08:48:29 | **PASS S2** import clip W (thẻ media xuất hiện) |
| 08:48:30 → 08:55:57 | **KẸT ~447 s ở S2 thêm clip W lên timeline** (xem §3) |
| 08:55:57 | **FAIL S2** thêm clip W lên timeline — "không thêm được" |
| 08:55:57 | HARNESS LỖI `page.setInputFiles: Target page, context or browser has been closed` (dòng 767, S7) |
| 08:55:58 | EXIT=124 (timeout 480 giết node — catch đã ghi JSON xong, finally kẹt) |

**Bảng kiểm chứng cơ chế (đọc lại bằng script, Phụ lục B):**

| Điểm kiểm (brief) | Kết quả |
|---|---|
| (a) JSON stamped riêng được tạo | **CÓ** — `o8w-clicktest-report-2026-11-20T08-47-58-401fca75-attempt1-pid25315.json` (1.933 B); `run={stamp 2026-11-20T08-47-58, bootId 401fca75, pid 25315, file <đúng đường dẫn>}`; pid 25315 khớp đúng process node đã chạy |
| (b) Không ghi đè file cũ | **ĐÚNG** — bản latest tên cố định md5 BẰNG stamped (`33bd318d…`, đúng thiết kế "latest = lần mới nhất"); **7/7 JSON cũ (T0-152 ×3 + T8-152 ×4) md5 không đổi** trước/sau |
| (c) Nội dung JSON khớp log chạy | **KHỚP** — results n=4 (ok=3, fail=1); cả 9 logLines đều có trong log console (đối chiếu từng dòng bằng script); harnessError có trong log |

## 3. F-153-T0-1 — O8 WebKit FAIL, chữ ký kẹt mới (S2-timeline-add 447 s)

- **Diễn biến:** sau S2-import PASS 08:48:29.946Z, bước `addClipToTimeline`
  (dòng 562 → hàm dòng 512) không trả về trong **447,33 s**; FAIL ghi lúc
  08:55:57.277Z ("không thêm được"). Script tiếp tục (fail không ném lỗi);
  các khối S3–S6 có guard `if (clipW …)` nên bị bỏ qua (clipW null); S7 gọi
  ngay `page.setInputFiles(".mediabin input[type='file']", CLIP_B)`
  (dòng 767) → ném `Target page, context or browser has been closed` →
  catch ghi JSON → finally kẹt (nhiều khả năng `browser.close()` trên
  browser đã chết) → timeout 480 giết node → EXIT=124.
- **Bằng chứng thời gian:** WebKitWebProcess còn sống lúc 08:52:45Z
  (pid 25631, 3,0% CPU — giữa cửa sổ kẹt) → page/context đóng trong
  **(08:52:45Z, 08:55:57Z]** (hoặc CDP session chết khi process còn sống —
  không phân biệt được từ log).
- **Vì sao 447 s không giải thích được bằng code:** `addClipToTimeline`
  tối đa 3 attempt, mỗi `evalJs`/`mouse.click` chịu default timeout 30 s
  của Playwright (script KHÔNG set `setDefaultTimeout` — đã grep), cộng
  sleep ~2 s → tối đa ~90–150 s theo code. 447 s vượt xa cấu trúc retry/
  timeout của hàm. **Log không đủ phân biệt** (renderer wedged họ H3?
  CDP stall? cộng dồn timeout theo cách chưa lần ra?) — **KHÔNG kết luận
  cơ chế, không bịa** (cùng posture F-152-T0-2).
- **Khác các chữ ký cũ:** đợt 142 (Target crashed ở S1); T0-152 attempt1
  (Target crashed ở S1, S0 PASS); T0-152 attempt2 (timeout chờ mẫu tự
  load, 0 kết quả). Lần này **S0/S1/S2-import đều PASS**, kẹt ở bước thêm
  clip lên timeline — là chữ ký mới, không phải tái hiện 2 lỗi trên.
- **Không retry:** brief chỉ 1 lần O8; T8-153 đã bắt đầu lượt chính thức
  (MiniBrowser mới pid 35311+ lúc ~08:56:19Z, ngay sau lần chạy này kết
  thúc) — chạy thêm sẽ tranh 1,5 CPU chia sẻ với lượt chính thức.
  Lần fail này KHÔNG tính vào chuỗi WebKit FULL PASS (chỉ T8-153 phán
  chuỗi bằng lượt chính thức).

## 4. Sai số mới (F-153-T0-N)

- **F-153-T0-1 — O8 WebKit kẹt 447 s ở S2-timeline-add + page closed** (xem §3).
- **F-153-T0-2 — KHÔNG PHẢI LỖI: EXIT=124 không làm mất JSON.** Catch đã
  ghi xong stamped JSON + latest (đầy đủ 4 results + harnessError) TRƯỚC
  khi timeout giết node; finally kẹt mới là phần bị giết. JSON trên đĩa
  đầy đủ, md5 đã đối chiếu (§2.3).
- **F-153-T0-3 — dpkg cài `gstreamer1.0-tools` lúc 08:50:42Z, giữa cửa sổ
  kẹt.** Ghi nhận thời gian trùng nhau, KHÔNG quy nguyên nhân (có thể
  T8-153 chuẩn bị môi trường cho lượt chính thức; không có bằng chứng nối
  việc cài đặt với cái kẹt; T0 không chạy apt).

## 5. Giới hạn — đọc trước khi trích số

1. **WebKit main-path `writeReport()` VẪN chưa thực thi live** (kế thừa
   T0-152 §6.1 — lần này cũng rẽ catch-path). Main-path Chromium đã thực
   thi (T0-152, 21/21); catch-path WebKit đã thực thi 3 lần (T0-152 ×2 +
   lần này) — cùng một hàm, cùng 2 lệnh ghi; rủi ro còn lại ở điểm gọi
   main-path WebKit là tối thiểu nhưng ghi rõ để T10 không trích
   "WebKit main-path đã chạy".
2. **Chỉ 1 lần O8 WebKit; không chạy Chromium fallback.** Cơ chế đã chứng
   minh xong qua catch-path (cùng tiền lệ T0-152); T8-153 đang chạy lượt
   chính thức (cả WebKit + Chromium) — tránh tranh CPU. Nếu parent muốn
   điểm Chromium 21/21 trên boot mới thì đó là phần của T8-153.
3. **Không chạy tsc / vite build / npm test đầy đủ** — không chạm code
   TS/app; `node --check` không cần (không sửa script). Việc duy nhất
   trong repo là thêm LIMITS này.
4. **Giờ chết của cell cũ chỉ biết trong khoảng (08:18:19Z, 08:35:51Z]**
   (rộng 17m32s) — không pin hẹp hơn được từ cell mới (log cell cũ mất
   theo cell; chỉ còn file shared). T2-153 có thể thu hẹp bằng dữ kiện
   khác nếu có (vd scheduler DB — giao T2/T7, §7).
5. **Cell cũ có còn sống lặng lẽ sau 08:35:51Z không: KHÔNG quan sát được
   từ cell mới** — ghi nhận, không khẳng định đã chết hẳn. Không thấy dấu
   hiệu hai cell xung đột khi cùng ghi workspace (không có ghi chép xen kẽ
   trong sampler log / aggregate / build-loop log).
6. **ENOSPC (§1.4) chỉ là đếm dòng journal, không phải đo headroom** —
   T9-153 đo và phán.

## 6. Nợ / giao cho đợt 153 + parent

1. **T2-153: mù #76? (#44) + xem xét #45.** Cell cũ chết trong
   (08:18:19Z, 08:35:51Z]; overlap ≥45m41s; #45 khác mẫu reboot #38–#44
   (boot cũ không bị giết tại btime mới). Có đếm #45 là một reboot theo
   mẫu cũ không, và gap #44/#45 tính thế nào (tuổi cell cũ tới lúc cell
   mới boot 1.707 s vs tới lúc chết thật ~4.450–5.460 s), cần quyết parent
   — T0 chỉ ghi dữ kiện, không tự đổi cách đếm. F trên cell mới hiện tại
   +2/+3 s (Phụ lục A.2).
2. **T7-153: kết cục run 152.** Run vẫn `running` lúc T7-152 đóng (08:02Z,
   cell cũ); hạn ngân sách 08:35:51Z; `started_at` có bị viết lại ở cái
   chết cell cũ không (cửa sổ (08:18:19Z, 08:35:51Z])? `claimed_at` giữ
   gốc? Run 152 dispatch 05:35:51Z, requeue #44 btime +40,640 s.
3. **T8-153: lượt O8 + harness chính thức.** Lưu ý F-153-T0-1 (kẹt 447 s
   ở S2-timeline-add, page closed — chữ ký mới, khác đợt 142 và T0-152);
   chuỗi WebKit FULL PASS 10 chờ lượt chính thức phán, KHÔNG tính lần
   fail kiểm chứng này của T0.
4. **T9-153: ENOSPC vẫn tiếp diễn trên boot mới** (14 dòng "No space left"
   lúc 08:51Z, cadence ~70 s) — headroom có thể vẫn 0; đối chiếu với
   quyết (g) "chỉ theo dõi".
5. **Nợ mở đứng (không đụng đợt này):** G1 chờ user quyết; ci-security.yml
   403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (lần thứ 6 liên tiếp
   ở đợt 152); file oversize 6,4 MB chưa quyết số phận.

## Phụ lục A — Số liệu boot survey (trích bằng script, không gõ tay)

Script: `/tmp/t0-153-appendix.py` (đọc /proc, journal, wtmp, sampler log
gốc, curl F-measure trực tiếp). Output đầy đủ dưới đây (chạy 08:51:12Z):

```
### A.1 Boot hien tai (doc truc tiep tu /proc + journal + wtmp)
boot_id: 401fca75-bece-45b6-88fa-b12f602d6390
btime: 1795159958 = 2026-11-20T07:32:38Z
uptime: 4713.76 s (doc luc 08:51:12Z)
now-uptime = 2026-11-20T07:32:38Z (sai lech vs btime: +0.88 s)
uptime -s: 2026-11-20 07:32:38Z (UTC)
/proc/1 mtime: 2026-11-20 07:32:49.568511230 +0000
/proc/1 starttime: 1069 ticks = 10.69 s sau kernel boot -> PID1 start wall = 2026-11-20T07:32:48Z
journal --list-boots: 0 401fca75bece45b688fab12f602d6390 Fri 2026-11-20 07:32:49 UTC Fri 2026-11-20 08:51:05 UTC
wtmp begins: wtmp begins Fri Nov 20 07:32:49 2026
journal first entry: 2026-11-20T07:32:49+00:00 htch-runtime systemd-journald[17]: Journal started
journal entries total: 275
journal entries 07:35-08:35Z: 165
home-assistant-ensure entries (new boot): 219
No-space-left lines (new boot): 14
dpkg.log tail: 2026-11-20 08:50:42 status half-configured gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2
2026-11-20 08:50:42 status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2

### A.2 F-measure (curl Date header vs dong ho local)
https://example.com: Date: Fri, 20 Nov 2026 08:51:14 GMT (local Fri, 20 Nov 2026 08:51:12 GMT)
https://www.google.com: Date: Fri, 20 Nov 2026 08:51:14 GMT (local Fri, 20 Nov 2026 08:51:12 GMT)
https://www.cloudflare.com: Date: Fri, 20 Nov 2026 08:51:14 GMT (local Fri, 20 Nov 2026 08:51:12 GMT)

### A.3 Sampler log round152-t9 (ram-sampler.log) — gap + boot
total lines: 124
boot column counts: {'boot=18e179e0': 86, 'boot=c741f5e6': 38}
gap line 5->6: 61s | 2026-11-20T05:43:17Z boot=18e179e0 mem=34433 -> 2026-11-20T05:44:18Z boot=18e179e0 mem=32709
gap line 12->13: 61s | 2026-11-20T05:50:18Z boot=18e179e0 mem=27349 -> 2026-11-20T05:51:19Z boot=18e179e0 mem=26345
gap line 38->39: 61s | 2026-11-20T06:16:19Z boot=18e179e0 mem=12930 -> 2026-11-20T06:17:20Z boot=18e179e0 mem=20482
gap line 64->65: 61s | 2026-11-20T06:42:20Z boot=18e179e0 mem=49365 -> 2026-11-20T06:43:21Z boot=18e179e0 mem=47796
gap line 86->87: 71s | 2026-11-20T07:04:21Z boot=18e179e0 mem=54054 -> 2026-11-20T07:05:32Z boot=c741f5e6 mem=17393
gap line 97->98: 61s | 2026-11-20T07:15:32Z boot=c741f5e6 mem=70893 -> 2026-11-20T07:16:33Z boot=c741f5e6 mem=10548
gap line 123->124: 61s | 2026-11-20T07:41:33Z boot=c741f5e6 mem=58773 -> 2026-11-20T07:42:34Z boot=c741f5e6 mem=11161
last 3 samples:
  2026-11-20T07:40:33Z boot=c741f5e6 mem=567168 bal=6443824 swapfree=676692 load1=1.01
  2026-11-20T07:41:33Z boot=c741f5e6 mem=587736 bal=6443824 swapfree=669408 load1=0.60
  2026-11-20T07:42:34Z boot=c741f5e6 mem=1116160 bal=5854000 swapfree=656128 load1=1.15
samples with stamp >= 07:32:38Z (btime boot moi) ma boot=c741f5e6:
  count: 10 (tu 2026-11-20T07:33:33Z boot=c741f5e6 mem=72660)

### A.4 Co che doc boot_id cua sampler (sampler.sh)
boot doc moi mau: boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null | cut -c1-8)
sleep cadence: True

### A.5 File round152 viet sau btime 07:32:38Z (mtime, host frame)
round152-t7.done: 2026-11-20 08:02:00.033364281 +0000
round152-t9.done: 2026-11-20 07:54:47.304373563 +0000
round152-t10.done: 2026-11-20 08:14:28.041348237 +0000
aggregate 152: 2026-11-20 08:18:19.471343273 +0000
```

## Phụ lục B — Kiểm chứng O8 (đọc lại bằng script, không gõ tay)

Script: `/tmp/t0-153-verify-o8.py` (đọc JSON stamped + log console + md5
trước/sau trong `/tmp/t0-153-json-md5-before.txt`). Output đầy đủ dưới đây:

```
run block: {'stamp': '2026-11-20T08-47-58', 'bootId': '401fca75', 'pid': 25315, 'file': '/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round153-t0/o8-webkit/o8w-clicktest-report-2026-11-20T08-47-58-401fca75-attempt1-pid25315.json'}
results n=4 ok=3 fail=1
  PASS: S0 setup: mẫu tự load (WebKit) — 3 clip, media [mau-1.png(image,file=true), mau-2.png(image,file=true)], project=1280x720
  PASS: S1 tắt auto-proxy trước khi import (setup, WebKit) — checked=true → false, Playwright mouse click lần 2
  PASS: S2 import clip W: thẻ media xuất hiện (WebKit) — file=o8-white-720p-6s.mp4
  FAIL: S2 thêm clip W lên timeline (WebKit) — không thêm được
harnessError: page.setInputFiles: Target page, context or browser has been closed
logLines n=9
md5 stamped: 33bd318da4ac5ba5cf1b10a8b063276c
md5 latest : 33bd318da4ac5ba5cf1b10a8b063276c
latest == stamped: True

--- doi chieu JSON vs log console ---
CO TRONG LOG | [2026-11-20T08:47:58.849Z] vite dev :5564, DISPLAY=:191, bridge :8861
CO TRONG LOG | [2026-11-20T08:48:01.138Z] bridge OK: http://127.0.0.1:8861
CO TRONG LOG | [2026-11-20T08:48:01.139Z] sóng EPERM đã tắt, khởi động vite
CO TRONG LOG | [2026-11-20T08:48:03.351Z] vite dev đã lên
CO TRONG LOG | [2026-11-20T08:48:08.140Z] webkit launched, version: 27.2
CO TRONG LOG | [2026-11-20T08:48:23.758Z] PASS: S0 setup: mẫu tự load (WebKit) — 3 clip, media [mau-1.png(image,file=true), mau-2.png(image,file=true)], project=1280x720
CO TRONG LOG | [2026-11-20T08:48:28.269Z] PASS: S1 tắt auto-proxy trước khi import (setup, WebKit) — checked=true → false, Playwright mouse click lần 2
CO TRONG LOG | [2026-11-20T08:48:29.946Z] PASS: S2 import clip W: thẻ media xuất hiện (WebKit) — file=o8-white-720p-6s.mp4
CO TRONG LOG | [2026-11-20T08:55:57.277Z] FAIL: S2 thêm clip W lên timeline (WebKit) — không thêm được
harnessError co trong log: True

--- JSON cu (truoc/sau) ---
KHONG DOI  19e62de855efad233b89ade43ac323b9 /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t0/o8-webkit/o8w-clicktest-report-2026-11-20T05-42-38-18e179e0-attempt1-pid10897.json
KHONG DOI  95988b8e011327503a02558584ae09c9 /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t0/o8-webkit/o8w-clicktest-report-2026-11-20T05-43-04-18e179e0-attempt2-pid12951.json
KHONG DOI  95988b8e011327503a02558584ae09c9 /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t0/o8-webkit/o8w-clicktest-report.json
KHONG DOI  25318b62f88e2454b6f42d9a56374b35 /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t8/o8-webkit/o8w-clicktest-report-2026-11-20T06-14-28-18e179e0-pid39105.json
KHONG DOI  86fbf7042a6b648cc381d0d1f00a06fa /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t8/o8-webkit/o8w-clicktest-report-2026-11-20T06-15-29-18e179e0-pid39569.json
KHONG DOI  25318b62f88e2454b6f42d9a56374b35 /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t8/o8-webkit/o8w-clicktest-report-attempt1.json
KHONG DOI  86fbf7042a6b648cc381d0d1f00a06fa /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round152-t8/o8-webkit/o8w-clicktest-report-attempt2.json
tat ca JSON cu khong doi: True

--- thoi gian cac moc (tu logLines) ---
moc dau: 08:47:58 | moc cuoi: 08:55:57
S2-import PASS 08:48:29.946Z -> S2-timeline FAIL 08:55:57.277Z = 448 s
```

# PHASE9_ROUND112_N7_INFRA_LIMITS — Hạ tầng: postboot boot #42 + O8 tự copy fixture + spec đóng băng lock

> Luồng N7, đợt 112, lượt cron 15:35 +07 14/11/2026 (bắt đầu ~08:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 111 §10 mục 11 + 13 (postboot lên boot hiện tại;
> O8 không tự copy fixture; spec đóng băng lock).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (preview.tsx
> md5 c4198206 không đổi trong luồng này). KHÔNG sửa
> `vcut-vite-lock.sh` đợt này (chỉ verify — xem §4).
> CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **Postboot sau reboot #42 — PASS TOÀN BỘ ngay lần đầu (08:41Z,
   ~36 phút sau boot 08:05:10Z, boot_id cc39f151…).** Wrapper K1 còn,
   đủ 5 lib, plugin GST hệ thống 269 file (= debroot), đủ 10/10 package
   apt, `dpkg --audit` sạch, không còn tiến trình apt replay. WebKit
   launch OK cả 3 chế độ (headed O8-env 2405 ms, headed clean 882 ms,
   headless clean 1925 ms), WebKit 27.2, eval 2. **Đủ điều kiện chạy
   probe WebKit trên boot #42** — kết quả đã báo sớm tại
   `hidden_files/round112-n7/postboot-status.md`.
2. **O8 Chromium nay TỰ COPY fixture** (`clicktest-87o8-mask-track-headed.mjs`):
   khi thiếu trong SCRATCH thì copy 3 file từ nguồn chuẩn
   `hidden_files/round87-o8/headed/`; idempotent, KHÔNG ghi đè file đã
   có. Kiểm chứng bằng chạy khô trên scratch mới: 3 file copy đúng,
   md5 khớp 3/3 với nguồn; chạy lại thì bỏ qua cả 3, mtime không đổi.
   **Chưa chạy lại O8 full 21/21 trong luồng này** (xem §3.3 — việc đó
   thuộc luồng verify cuối đợt, cần vite lock + chạy dài).
3. **Spec đóng băng lock đã viết** (`docs/VCUT_VITE_LOCK_FREEZE_SPEC.md`):
   acquire bằng bản copy đóng băng + poll 5 s + chờ ≥15 s sau khi nhả
   nếu định giữ lại ngay + KHÔNG sửa lock script khi có acquire đang
   chạy + bảng diễn giải exit != 0 của acquire (không phải mọi exit
   != 0 đều là timeout).
4. **Stale-recovery của lock script hiện tại — PASS cả 3 ca kiểm lại**
   (owner chết + tuổi già; dir trống kiểu L4; đối chứng âm lock tươi
   không bị xóa nhầm). Lock script KHÔNG sửa đợt này.
5. **Vite mồ côi hiện tại: 0.** `ps` không còn tiến trình vite node
   nào; 10 cổng đã biết đều curl 000 (kiểm 08:47Z).
6. **Headroom inotify boot #42: 1534** (probe K8, 08:47Z; baseline
   cell 16 wd; trần 63747) — THẤP HƠN boot #40 (1657/1640) và **thấp
   hơn ~1586 watch của 1 vite thường** (M6 đo boot #40). Xem cảnh báo
   §5: trên boot #42 chỉ nên dùng vite tạm `watch.ignored`, không chạy
   vite thường cho tới khi headroom đo lại cao hơn.

## 2. Postboot sau reboot #42

### 2.1 Reboot #42

| Boot | `uptime -s` / btime | boot_id |
|---|---|---|
| #41 | 2026-11-14 06:53:26Z | (không ghi trong đợt 111) |
| #42 | 2026-11-14 08:05:10Z (btime 1794643510) | cc39f151-05bc-42bf-b5fa-ee9ac5ff28ba |

Xác minh bằng 3 nguồn độc lập khớp nhau: `uptime -s`, `/proc/stat`
btime, boot_id. `journalctl --list-boots` chỉ còn boot hiện tại
(journal không giữ qua reboot) nên số #42 là nối tiếp #41 theo quy ước
các đợt trước (số thứ tự vẫn tạm thời như mọi đợt). Gap #41→#42 =
1h11'44" — KHÔNG phá sàn 19'07" (đợt 106) / 26'03" (đợt 110).

### 2.2 postboot-check lần 1 (08:41:22Z, ~36' sau boot) — PASS toàn bộ

Log: `hidden_files/round112-n7/n7-postboot-check1.log` (exit 0).

| Mục | Kết quả |
|---|---|
| Wrapper MiniBrowser | PASS — đã vá K1 (giữ LD_LIBRARY_PATH) |
| Lib hệ thống (5 lib) | PASS — đủ libevent/libEGL/libavif/libdw/libevdev |
| Plugin GST | PASS — thư mục thật (apt), 269 file hệ thống = 269 debroot, đủ isomp4 + libav, không file `.dpkg-new` |
| apt (10 package) | PASS — đủ 10/10 |
| Kết luận | ĐỦ ĐIỀU KIỆN chạy WebKit |

Không còn tiến trình apt/dpkg/replay nào lúc kiểm (`ps` trống);
`dpkg --audit` sạch. **Caveat:** lần kiểm đầu tiên đã đủ nên khoảng
replay chính xác KHÔNG kẹp được — chỉ biết replay xong trước 36' sau
boot (boot #39 ~17', boot #40 đủ lúc 22'). Nợ M8 §9.4 vẫn mở: đợt sau
sau reboot nên chạy postboot-check sớm (5–10 phút sau boot) để kẹp
khoảng chính xác hơn.

### 2.3 Launch WebKit thật trên boot #42

Script `round110-l8/l8-webkit-launch.mjs` (Playwright-core 1.65.0,
Xvfb :195; bản headless là sed `headless: false` → `true` lưu tại
`round112-n7/n7-webkit-launch-headless.mjs`):

| Chế độ | Kết quả | Thời gian |
|---|---|---|
| headed, env O8 (chỉ GST_PLUGIN_SYSTEM_PATH) | OK, version 27.2, eval 2 | 2405 ms (08:41:44Z) |
| headed, clean (không GST/LD var) | OK, version 27.2, eval 2 | 882 ms (08:41:46Z) |
| headless, clean | OK, version 27.2, eval 2 | 1925 ms (08:41:48Z) |

File kết quả: `n7-launch-o8env-b42.json`, `n7-launch-clean-b42.json`,
`n7-launch-headless-b42.json`. UA cả 3: Safari/605.1.15 Version/27.2.
Decode video mp4 thật KHÔNG kiểm lại trong luồng này (O8 full giao cho
luồng verify cuối đợt — xem §3.3; L8 đã chứng minh decode trên boot #39,
M9 chạy O8 21/21 trên boot #40/#41).

### 2.4 Đổi trong postboot-check (repo, nhỏ)

`apps/web/scripts/vcut-webkit-postboot-check.sh`:
- Dòng tham chiếu boot `#40 = 05:16:36Z` → `#42 = 08:05:10Z, sau #41 = 06:53:26Z`.
- Header: thêm số đo replay boot #42 (đủ lúc kiểm tra 36' sau boot,
  lần kiểm đầu đã đủ — khoảng chính xác chưa kẹp được).
- `bash -n` OK. Không đổi logic kiểm tra/sửa chữa.

## 3. O8 tự copy fixture

### 3.1 Lỗi gốc (M9 đợt 111)

`clicktest-87o8-mask-track-headed.mjs` (Chromium) đọc 3 fixture TRONG
SCRATCH (`o8-white-720p-6s.mp4`, `o8-ball-720p-6s.mp4`,
`o8-track-35-65.json`). Khi M9 chạy với `O8_SCRATCH` mới
(`round111-m9/o8-chromium`), fixture thiếu → script throw → exit 2,
phải copy tay từ `hidden_files/round87-o8/headed/`. (Bản WebKit
`clicktest-87o8-mask-track-webkit.mjs` đọc fixture thẳng từ
`headed/` nên không bị lỗi này — không cần sửa.)

### 3.2 Sửa (đợt 112 N7)

Trong `main()` của bản headed, ngay sau `mkdirSync(SCRATCH)` và TRƯỚC
khối check fixture cũ: với mỗi tên trong 3 fixture, nếu file đích đã có
trong SCRATCH thì log "đã có, bỏ qua (không ghi đè)" và KHÔNG copy;
nếu chưa có thì `copyFileSync` từ nguồn chuẩn
`hidden_files/round87-o8/headed/` và log kích thước; khi SCRATCH chính
là thư mục nguồn thì không copy gì; nguồn thiếu thì khối check cũ vẫn
throw lỗi rõ như trước (nay ghi thêm "nguồn chuẩn … cũng thiếu").

Hành vi đã ghi rõ trong comment code: **idempotent, không ghi đè
fixture đã có** — người chạy muốn đổi fixture thì xóa file đích trong
SCRATCH rồi chạy lại.

### 3.3 Kiểm chứng (chạy khô + kiểm file, KHÔNG chạy full O8)

- **Lần 1 — scratch mới** (`round112-n7/o8-chromium-fresh`, 08:44:56Z):
  script tự copy cả 3 file (log `đã tự copy … 10827 / 14756 / 464
  byte`), rồi dừng ở bước kiểm DISPLAY (`display :195 đã có X server
  khác` — cố ý dùng DISPLAY :195 đang sống để dừng sau bước fixture,
  trước khi chạm bridge/vite/chrome). **md5 3/3 khớp nguồn chuẩn:**
  white `07bc0cb9…`, ball `6df873f7…`, track `cdf9a252…`.
  Log: `n7-o8-fresh-scratch.log`.
- **Lần 2 — chạy lại cùng scratch** (08:45:09Z): cả 3 file đều log
  "đã có trong SCRATCH, bỏ qua (không ghi đè)", mtime giữ nguyên
  08:44:56. Log: `n7-o8-rerun.log`.
- **Chưa chạy O8 full 21/21 trong luồng này:** chạy full cần vite
  (lock chung, các luồng đợt 112 khác đang xếp hàng) + browser headed
  + ~21 scenario, vượt phạm vi "chạy khô + kiểm file fixture đã copy
  đúng" mà task cho phép. Luồng verify cuối đợt (M9 đợt 112) chạy O8
  full trên cây đã merge sẽ là bằng chứng cuối — nếu lúc đó vẫn exit 2
  vì fixture thì fix này đã sai (không kỳ vọng, vì bước copy chạy
  trước mọi bước khác trong `main()`).

## 4. Spec đóng băng lock + kiểm lại stale-recovery

### 4.1 Spec mới: `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md`

Nội dung chính (chi tiết xem file):
1. **Acquire bằng bản copy đóng băng:** `cp` lock script về scratch
   của mình rồi acquire bằng bản copy (M5 đợt 111 đã làm theo mẫu này)
   — tránh bash đọc phải file đang bị sửa giữa chừng + bảo đảm cùng
   một bản trong cả đợt. `owner_pid` phải là pid driver dài.
2. **Poll 5 s** (`VITE_LOCK_POLL_S=5`) — mặc định 10 s đã làm M8 bỏ lỡ
   2 cửa nhả-giữ lại ~8 s của M7 (đợt 111).
3. **Chờ ≥15 s sau khi nhả nếu định giữ lại ngay** — 15 s ≥ 2 chu kỳ
   thăm 5 s + biên, chống đói lock cho luồng đang chờ.
4. **KHÔNG sửa lock script khi có acquire đang chạy** — kiểm `status` +
   `ps` tìm acquire đang chạy (kể cả bản copy trong scratch luồng
   khác); tốt nhất không sửa trong đợt đang chạy, mọi thay đổi đi qua
   luồng hạ tầng riêng đầu đợt.
5. **Bảng diễn giải exit của acquire:** 0 = đã giữ; 1 = timeout (hết
   `timeout_s` mà lock khác còn tươi) HOẶC stale-recovery từ chối
   (lock còn tươi theo kiểm tra trực tiếp — KHÔNG phải timeout, không
   ép xóa); 2 = lỗi dùng; `status` luôn exit 0; `kill-vite` exit 1 =
   vite vẫn sống sau KILL (khác timeout); `release` exit 1 = owner
   không phải mình (lock KHÔNG bị nhả).

### 4.2 Kiểm lại stale-recovery trên bản lock hiện tại (KHÔNG sửa script)

Script test: `hidden_files/round112-n7/n7-lock-stale-test.sh`
(trên `VITE_LOCK_DIR=/tmp/n7-test-lock`, KHÔNG đụng lock chung).
Log: `hidden_files/round112-n7/n7-lock-stale-test.log`.
Lúc kiểm: lock chung TRỐNG, không vite nào chạy (08:4xZ).

| Ca | Kỳ vọng | Kết quả |
|---|---|---|
| 1. Owner fake-old pid=999999 (chết), port 5599, tuổi ~4200 s, không vite, curl 000; acquire stale_min=1 | Xóa lock cũ, giữ lại, owner mới đủ 5 trường | **PASS** (exit 0; owner mới thread=n7-test pid=999998, đủ started/boot) |
| 1b. release sai thread (wrong-thread) | Từ chối, exit 1, lock còn nguyên | **PASS** |
| 1c. release đúng thread (n7-test) | Nhả, exit 0, dir biến mất | **PASS** |
| 2. Dir trống kiểu L4, tuổi ~4200 s, không vite, không cổng phục vụ; acquire | Coi là stale, giữ lại | **PASS** (exit 0) |
| 3. (đối chứng âm) Owner pid còn sống (sleep 100), acquire timeout=12 | BỎ (exit 1), KHÔNG xóa lock tươi | **PASS** |

Kết luận: stale-recovery trên bản lock hiện tại hoạt động đúng cả 2
dạng đã biết + không xóa nhầm lock tươi. **Lock script KHÔNG sửa đợt
này** (theo lệnh task: tốt nhất không sửa — chỉ verify).

## 5. Vite mồ côi + headroom boot #42 (08:47Z)

- **Quét mồ côi: 0 vite.** `ps` không còn tiến trình node vite nào;
  curl 10 cổng đã biết (5173/5560/5590/5599/5580/5581/5184/8861 +
  5554/5564) đều 000. Lock chung TRỐNG lúc kiểm.
- **Headroom inotify: 1534** (probe K8 `k8-headroom.py`: thêm được
  1534 watch trước ENOSPC; trần 63747; baseline cell-visible 16 wd
  lúc yên — pid 1 giữ 14, một tiến trình khác giữ 2). Thấp hơn boot
  #40 (1657 lúc yên / 1640 trước vite test M8) — ngoài cell vẫn ~62k
  watch, dao động theo boot/tải.
- **CẢNH BÁO — vite thường có nguy cơ ENOSPC trên boot #42:**
  headroom 1534 < ~1586 watch của 1 vite thường (M6 đo boot #40,
  cây 9b27abe5; cây hiện tại thêm vài file nên có thể cao hơn chút).
  M8 đã bỏ qua vite ORIG ở headroom 1640 (< ngưỡng an toàn 1700);
  ở 1534 thì càng không nên thử. **Khuyến nghị đợt 112: chỉ dùng vite
  tạm `watch.ignored: ["**/**"]` (0 watch); không chạy vite thường
  cho tới khi headroom đo lại cao hơn ngưỡng.** N7 không đo lại vite
  thường để tránh ENOSPC giữa đợt (không phải lười đo — rủi ro thật).
- RAM khả dụng lúc kiểm: 1106 MB (total 7934 MB) — birefnet vẫn dưới
  ngưỡng 6 GB, không thử (đứng theo LIMITS gộp).

## 6. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi N7. md5 lúc kiểm: `c4198206…` (bản
  M1-fix đợt 111, không đổi trong luồng này).
- `bash -n` cả 2 script đã sửa: OK (postboot-check + clicktest headed).
- `node --check` clicktest headed: chạy khô thành công tới bước fixture
  (xem §3.3) — cú pháp + logic copy đã chạy thật.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không sửa
  production; chỉ sửa 2 script harness + thêm 2 doc).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM chưa đổi).

## 7. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND112_N7_INFRA_LIMITS.md` (file này — mới).
- `docs/VCUT_VITE_LOCK_FREEZE_SPEC.md` (mới — spec đóng băng lock).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa nhỏ: tham chiếu boot #41→#42 + ghi chú thời gian replay, §2.4).
- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` (sửa: tự copy fixture vào SCRATCH, §3.2).
- Harness trong hidden_files (KHÔNG stage — tiền lệ K7/K8/L8/M8):
  `round112-n7/` (postboot-status, log postboot, launch JSON ×3,
  script headless, script + log test stale-recovery, log O8 chạy khô ×2,
  scratch `o8-chromium-fresh/` với 3 fixture đã copy).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round112-n7-infra.txt`
  (NUL-delimited; chỉ 4 file repo trên).
- Cờ done: `hidden_files/round112-n7-done` (tạo sau khi LIMITS + batch xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Vite lock dùng chung (acquire/release/status/kill-vite) — xem spec đóng băng:
bash ~/workspace/repo-1/apps/web/scripts/vcut-vite-lock.sh status
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

## 8. Nợ mở sang đợt sau

1. **O8 full 21/21 chưa chạy lại sau fix tự copy fixture** — giao luồng
   verify cuối đợt 112 (M9) chạy trên cây đã merge; nếu vẫn exit 2 vì
   fixture thì fix §3.2 đã sai.
2. **Replay apt sau reboot chưa kẹp được khoảng chính xác** (boot #42 đủ
   lúc 36' sau boot, lần kiểm đầu đã đủ) — đợt sau sau reboot chạy
   postboot-check sớm (5–10 phút sau boot) rồi chạy lại tới khi PASS
   (nợ M8 §9.4, vẫn mở).
3. **Headroom boot #42 chỉ 1534 < ~1586 của vite thường** — vite thường
   có nguy cơ ENOSPC; chỉ dùng vite tạm `watch.ignored` trong đợt 112;
   đo lại headroom sau reboot tiếp theo trước khi chạy vite thường.
4. **Hàng đợi vite không có cơ chế ưu tiên lượt ngắn** (nợ M8 §3.4) —
   vẫn mở, cần parent quyết có thêm hàng đợi ưu tiên hay không.
5. **Owner pid ngắn của luồng cũ** (nợ M8 §9.3) — từ đợt 112 mọi luồng
   dùng `vcut-vite-lock.sh` (bản copy đóng băng) để owner pid luôn là
   pid driver dài; rủi ro còn lại: định dạng owner mới hoàn toàn mà
   helper chưa biết → pid đọc rỗng (= coi như chết) và lock có thể bị
   xóa nhầm khi đủ 30 phút + không vite + curl 000.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 111 §10: G1 + mù #22
   + mù #28 + mù #29 chờ user quyết; E4 cơ chế mới m1f4; quyết bar CDP;
   ring 8 MiB cần thêm lượt; điểm gãy tải cần tích đủ tick; ngưỡng
   WebKit ≤60 ms cần 1 lượt yên thật; postboot-check cập nhật lên #42
   (XONG đợt này); không sửa lock script khi có acquire đang chạy;
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ
   user; release gate không đổi; KHÔNG push khi user chưa nhắn "push đi".

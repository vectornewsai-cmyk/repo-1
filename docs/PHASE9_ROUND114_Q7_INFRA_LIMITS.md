# PHASE9_ROUND114_Q7_INFRA_LIMITS — Hạ tầng: postboot #45 PASS sau repair apt + headroom + O8

> Luồng Q7, đợt 114, lượt cron 21:35 +07 14/11/2026 (bắt đầu ~14:43Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 113 §10 mục 8 (postboot #45 + apt replay) + mục 9
> (headroom) + mục 12(d) (lỗi driver `set -u` + `LD_LIBRARY_PATH`).
> Prereg: `hidden_files/round114-q7/prereg-q7.md` (viết TRƯỚC mọi sửa).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (preview.tsx
> md5 `03bf029f…` không đổi trong luồng này). KHÔNG sửa
> `vcut-vite-lock.sh` (md5 `fd21193c…` không đổi — chỉ dùng bản copy đóng
> băng để acquire, theo spec). CẤM kiểm lại TTS 39; birefnet không thử.

## 1. Kết luận ngắn

1. **(b) Postboot boot #45 — PASS TOÀN BỘ sau `--repair` (15:05Z,
   107' sau boot).** Quyết định apt: **CHO `--repair` chạy
   `apt-get update` rồi mới install** — có bằng chứng khô (network tới
   archive OK, sources hợp lệ, `--print-uris` liệt kê 112 URI, không
   lock) + chứng minh sống: update chạy OK (~12 phút lần đầu), install
   đủ 11 package. Xem §3.
2. **Hai lỗi script tìm ra + sửa trong lần repair này:** (i) `--repair`
   cũ install thẳng khi lists trống nên luôn FAIL "Unable to locate
   package"; (ii) script kết luận CHUA DU ngay cả khi install thành
   công (FAIL ghi trước khi repair, không kiểm lại) — thêm khối
   RE-CHECK §4b; (iii) `libevdev2` thiếu khỏi danh sách NEED dù mục
   libs đòi `libevdev.so.2` — thêm thành package thứ 11.
3. **(a) Tham chiếu postboot-check đã cập nhật #44 → #45** (boot
   13:17:42Z, boot_id `cd4cac0b-…`), `bash -n` OK. Xem §2.
4. **Kiểm tra lỗi `set -u` + `LD_LIBRARY_PATH` (nợ 12(d) đợt 113):**
   postboot-check KHÔNG mắc lỗi này — mọi `${…}` đều nằm trong chuỗi
   đơn (literal) trừ `${DISPLAY:-}` đã có guard. Không cần sửa. Xem §2.
5. **(c) Khoảng replay #46: ĐÃ KẸP ĐƯỢC — (1'23", 7'08"] sau boot.**
   Reboot #46 (15:44:49Z) xảy ra giữa lượt, giết Q5 đang kẹt + vòng chờ
   của Q7; Q7 đo sớm ngay: try1 (boot 1'23" tuổi) FAIL, try2 (boot 7'08")
   PASS toàn bộ nhờ replay hệ thống chạy thật. Nợ M8 §9.4 ĐÃ ĐÓNG cho
   boot này (lần đầu kẹp được khoảng). Khoảng replay #45 vẫn mở (không
   kẹp được — replay #45 không chạy). Xem §5.
6. **Headroom inotify: #45 cuối lượt 1298 → #46 mới boot 1300 → #46
   cuối lượt 1207.** Reboot KHÔNG hồi headroom (vẫn ~1300 lúc mới
   boot); chạy vite/O8 làm rơi thêm ~93 watch trong ~15 phút. Vite
   thường (~1586 watch) KHÔNG chạy được; vite tạm `watch.ignored`
   vẫn bắt buộc. Xem §4.
7. **O8 trên boot #46 — PASS cả 2 engine 21/21.** Chromium 21/21
   (15:57:09Z, S7 Δx=0,112/0,113), WebKit 21/21 (15:58:01Z,
   S7 Δx=0,194/0,197), ENOSPC 0, lock nhả sạch. O8 trên boot #45
   KHÔNG chạy được (reboot #46 giết lượt trước khi Q5 xong). Xem §6.
8. **Reboot #46 + Q5 kẹt (quan sát, không thuộc phạm vi sửa của Q7).**
   Gap #45→#46 = 2h27'07", không phá sàn 19'07". Probe WebKit của Q5
   (lượt 2) kẹt ở pass 11/20 ~30 phút (0,1% CPU, không ghi log từ
   15:12:58Z) rồi bị reboot giết; Q5 chạy lại sau reboot và đo xong
   (probe_exit=0 15:49:12Z). Q7 chờ cờ Q5 39 phút thì reboot cắt
   ngang vòng chờ — không còn cờ để chờ sau reboot vì pha browser
   của Q5 đã xong. Xem §6.4.

## 2. Cập nhật postboot-check #44 → #45 + kiểm tra lỗi `set -u`

### 2.1 Đổi trong postboot-check (repo)

`apps/web/scripts/vcut-webkit-postboot-check.sh`:
- Dòng `say` tham chiếu boot: `#44 = 10:53:31Z, sau #43 = 08:53:37Z`
  → `#45 = 13:17:42Z, boot_id cd4cac0b-17a6-408d-8c4e-be163f96dc61,
  sau #44 = 10:53:31Z`.
- Header: thêm số đo replay boot #45 (replay KHÔNG chạy; `--repair`
  14:06Z của P8 vá được symlink GST nhưng apt install FAIL do lists
  trống; O8 WebKit PASS nhờ debroot) + quyết định apt của Q7.
- Comment `--repair`: ghi rõ nay chạy `apt-get update` trước khi install.
- `bash -n` OK sau mọi sửa.

### 2.2 Kiểm tra lỗi `set -u` + `LD_LIBRARY_PATH` chưa set (nợ 12(d))

Lỗi này là của driver O8 của P8 (`p8-o8-driver.sh` dòng 39, đã sửa trong
hidden_files đợt 113), không phải của postboot-check. Kiểm trực tiếp
trên file đã sửa: mọi lần xuất hiện `${…}` không-guard đều nằm trong
chuỗi đơn nên là literal, không phải expansion của shell:
- Dòng 44/46/50/51: `'LD_LIBRARY_PATH="…${LD_LIBRARY_PATH}"'` trong
  `grep`/`sed` — chuỗi đơn, shell không expand.
- Dòng 87: `dpkg-query -W -f '${Status}'` — chuỗi đơn.
- `${DISPLAY:-}` đã có guard `:-` từ trước.
Kết luận: **postboot-check không mắc lỗi này, không cần sửa.** Driver O8
của Q7 copy từ bản P8 đã sửa (`${LD_LIBRARY_PATH:-}`), xem §6.

## 3. Quyết định apt trong `--repair` — bằng chứng + chứng minh sống

### 3.1 Trạng thái lúc Q7 bắt đầu (14:43–14:48Z, boot #45 ~86–91' tuổi)

- `ps`: 0 tiến trình apt/dpkg — replay vẫn KHÔNG chạy sau 86 phút.
- `/var/lib/apt/lists/`: chỉ 5 mục (`auxfiles`, `lock`, `partial` +
  2 file `cli.github.com…`) — **không có lists Ubuntu nào**.
- Sources hợp lệ: `/etc/apt/sources.list.d/ubuntu.sources`
  (`azure.archive.ubuntu.com` + `mirror.cogentco.com`, noble +
  noble-updates/backports/security, main/restricted/universe/multiverse).
- `dpkg-query`: `libevent-2.1-7t64` + `gstreamer1.0-plugins-base` đều
  "no packages found".
- Symlink GST → debroot của P8 (14:06Z) vẫn còn (269 file).
- Log apt của P8 (`/tmp/l8-postboot-apt.log`): "Unable to locate package"
  cho cả 10 package — đúng như LIMITS gộp §10 mục 8.

### 3.2 Thử nghiệm khô (trước khi quyết)

| Thử nghiệm | Kết quả |
|---|---|
| `curl -sI https://archive.ubuntu.com/ubuntu/dists/noble/InRelease` | HTTP 200 OK (14:46Z) — network tới archive được |
| `apt-get update -s` | exit 100: "Command line option 's' … is not understood" — apt này không hỗ trợ `-s` cho update |
| `apt-get update --dry-run` | exit 100: tương tự — không hỗ trợ `--dry-run` cho update |
| `apt-get update --print-uris` | exit 0 — liệt kê **112 URI** (noble + updates/backports/security × main/restricted/universe/multiverse) đều trỏ `mirror.cogentco.com` |
| `fuser /var/lib/dpkg/lock-frontend` | FREE — không lock nào giữ |
| Quyền | đang chạy root — đủ quyền apt |

Kết luận khô: **update chạy được** (network OK, sources hợp lệ, URI
liệt kê đủ, không lock, đủ quyền). Hai cờ khô "chuẩn" (`-s`,
`--dry-run`) không được apt hỗ trợ cho `update` nên không dùng được —
bằng chứng thay thế là `--print-uris` + curl 200 + lock free.
Log: `hidden_files/round114-q7/apt-update-printuris.log`,
`apt-update-simulate.log`, `apt-lists-before.txt`.

### 3.3 QUYẾT ĐỊNH: `--repair` chạy `apt-get update` rồi mới install

Không chọn "chờ replay hệ thống" vì: replay đã không chạy trong 43
phút quan sát của P8 + thêm ~45 phút tới lúc Q7 bắt đầu (tổng ~88 phút
sau boot, 0 tiến trình apt/dpkg) — không có dấu hiệu nào cho thấy nó
sẽ tới; trong khi đó Q5 đợt 114 đã FAIL 1 lần vì thiếu lib hệ thống
và đang chờ Q7 sửa. Update + install là đúng chức năng repair của
script (script vốn đã tự cài apt khi không lock), chỉ thiếu bước update
trước.

Cài đặt trong script (mục apt của `--repair`): khi không lock, chạy
`DEBIAN_FRONTEND=noninteractive apt-get update` (log vào
`/tmp/l8-postboot-apt.log`); chỉ khi update OK mới chạy install; nếu
update FAIL thì báo `REPAIR-FAIL apt update` và KHÔNG install mù.

### 3.4 Chứng minh sống — repair lần 1 (14:49–15:01Z)

`q7-postboot-b45-repair.log`, repair-exit=1 (xem §3.5 về vì sao exit 1):
- `apt-get update` chạy OK (mất ~12 phút — mirror chậm; 112 URI,
  nhiều `Ign`).
- Install đủ 10 package: log apt ghi 105 dòng "Setting up" (gồm deps:
  libgstreamer-*, libavformat60, libavfilter9, gstreamer1.0-plugins-*,
  …). `dpkg-query` sau đó: 3/3 mẫu `install ok installed`.
- Nhưng kết luận vẫn "CHUA DU", exit 1 — vì mục libs đã ghi FAIL
  trước khi install (thiếu cả 5 lib lúc đó), và script không kiểm lại.
  Đây là lỗi logic thứ hai (xem §3.5).

### 3.5 Hai lỗi script tìm ra trong lúc repair + cách sửa

**Lỗi 1 — FAIL sau repair không được kiểm lại.** Các mục 1–4 chạy
TRƯỚC `--repair`, nên FAIL ghi lúc đó tồn tại tới cuối dù install đã
sửa xong. Sửa: thêm khối **§4b RE-CHECK** — khi `--repair`, kiểm lại
toàn bộ 4 cửa (wrapper / libs / GST / apt) và tính lại FAIL trước khi
kết luận. Chứng minh: repair lần 2 (xem §3.6) exit 0.

**Lỗi 2 — `libevdev2` thiếu khỏi NEED.** Sau repair lần 1, kiểm độc lập
cho thấy 4/5 lib đã về (`libevent-2.1.so.7`, `libEGL.so.1`,
`libavif.so.16`, `libdw.so.1` đều có trong `ldconfig -p`) nhưng
`libevdev.so.2` vẫn vắng: `dpkg-query libevdev2` = "no packages found",
`apt-cache policy` cho candidate `1.13.1+dfsg-1build1`. NEED cũ (10
package) không chứa `libevdev2` — trên các boot replay chạy thì nó về
theo ~170 package replay, còn boot #45 replay không chạy nên repair
phải tự cài. Sửa: thêm `libevdev2` vào NEED (11 package) + đổi thông
báo PASS "đủ 10 package" → "đủ 11 package".

### 3.6 Chứng minh sống — repair lần 2 + kiểm lại (15:03–15:05Z)

`q7-postboot-b45-repair2.log`, **repair2-exit=0**:
- Lần kiểm đầu (trước install): chỉ còn thiếu đúng `libevdev.so.2` /
  `libevdev2` — khớp chẩn đoán §3.5.
- `apt-get update` OK (lần 2 chỉ ~99 s — lists đã cache), install
  `libevdev2` OK.
- RE-CHECK: wrapper PASS, libs PASS đủ 5, GST PASS đủ isomp4 + libav,
  apt PASS đủ 11 package.
- **KẾT LUẬN: DU DIEU KIEN chay WebKit (boot 2026-11-14 13:17:42)**.
- Xác nhận độc lập sau repair2: `ldconfig -p | grep -c libevdev.so.2`
  = 1; `dpkg-query libevdev2` = `install ok installed`.

### 3.7 Postboot #45: PASS — nhưng là PASS nhờ repair, không nhờ replay

- Kiểm khô lần 1 của Q7 (14:48Z, `q7-postboot-b45-check1.log`, exit 1):
  wrapper PASS, libs FAIL 5/5, GST PASS (symlink debroot 269 file),
  apt FAIL 10/10.
- Kiểm khô lần 2 (sau repair lần 1, `q7-postboot-b45-check2.log`,
  exit 1): chỉ còn FAIL `libevdev.so.2` / `libevdev2`.
- Sau repair lần 2: **PASS toàn bộ, exit 0** (15:05Z, 107' sau boot).
- Lưu ý: GST hệ thống vẫn là symlink → debroot (P8 tạo 14:06Z), không
  phải thư mục thật — apt đã cài plugin vào đúng đường dẫn đó (qua
  symlink, file ghi vào debroot; số file vẫn 269, isomp4 + libav đủ).
  Lần reboot sau symlink này mất (ephemeral) và `--repair` sẽ tạo lại
  hoặc apt sẽ cài thư mục thật — hành vi này giữ nguyên từ K1, không
  đổi đợt này.

## 4. Headroom inotify boot #45 — tiếp tục rơi

Probe K8 (`round109-k8/k8-headroom.py`, trần 63747):

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 113 (P8) | 1401 | đầu lượt verify |
| Đợt 113 (P8, cuối verify) | 1307 | cuối ngày |
| Q7 đầu lượt (14:48Z) | **1302** | sau khi các luồng đợt 114 đã chạy vite |
| Q7 cuối lượt (15:05Z, boot #45) | **1298** | sau repair apt |
| Q7 boot #46 mới (15:46Z) | **1300** | boot 2' tuổi — reboot KHÔNG hồi headroom |
| Q7 boot #46 cuối lượt (15:58Z) | **1207** | sau O8 + vite các luồng khác |

- Xu hướng #42→#46: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 → 1298
  → **1300 (boot mới) → 1207**. Reboot không hồi headroom: boot #46
  mới tinh đã chỉ còn 1300 (trần 63747, ~61k watch bị giữ ngoài cell
  vẫn còn đó). Chạy vite/O8 làm rơi thêm ~93 watch trong ~12 phút
  (1300 → 1207).
- Vite thường (~1586 watch) KHÔNG chạy được trên boot này — cách biệt
  ~380 watch. Vite tạm `watch.ignored` (0 watch) vẫn bắt buộc cho mọi
  lần chạy vite/O8 trong đợt 114.
- RAM khả dụng lúc đo: 849 MB (14:48Z) / 917 MB (15:05Z, boot #45);
  1910 MB (15:45Z, boot #46 mới) / 1438 MB (15:54Z) — vẫn < 6 GB,
  birefnet không thử (đứng theo LIMITS gộp).
- Log: `q7-headroom-b45-1.log`, `q7-headroom-b45-2.log`,
  `q7-headroom-b46-1.log`, `q7-headroom-b46-2.log`.

## 5. Cơ chế early-run cho reboot sau (nợ M8 §9.4 — vẫn mở)

### 5.1 Vì sao khoảng replay #45 không kẹp được

- Boot #45 đã 86' tuổi khi Q7 bắt đầu — quá muộn để đo sớm.
- P8 đã kiểm sớm nhất có thể trong đợt 113: lần đầu 13:20Z (3' sau
  boot) rồi mỗi 5 phút tới 14:00Z (8 lần, đều FAIL) — nhưng sau đó
  không còn lần kiểm nào cho tới khi Q7 repair 14:49Z.
- Kết quả: chỉ biết replay **KHÔNG xong trong 103 phút đầu sau boot**
  (13:17:42Z → 15:01Z, mốc cuối là lần kiểm FAIL của Q7 trước repair).
  Không biết replay có bao giờ chạy sau đó không — vì Q7 đã cài tay
  toàn bộ libs, lần kiểm sau repair không còn phân biệt được "replay
  tới" với "repair đã cài".

### 5.2 Cơ chế đã chuẩn bị — VÀ ĐÃ DÙNG ĐƯỢC NGAY TRONG LƯỢT NÀY (boot #46)

Script watcher: `hidden_files/round114-q7/q7-postboot-early-watch.sh`
(`bash -n` OK) + bản chuyên cho boot #46 `q7-early-watch-b46.sh`
(try1 tay + vòng lặp 5 phút/lần). Hành vi:
- Chế độ `--wait-new-boot`: poll `boot_id` mỗi 60 s (tối đa 12 h) để
  phát hiện reboot mới, rồi đo ngay.
- Vòng kiểm: chạy postboot-check (không `--repair`) lần đầu ngay khi
  boot < 10' tuổi, lặp mỗi 5 phút, tối đa 90 phút (19 lần).
- Ghi file trạng thái: boot theo dõi + từng mốc FAIL/PASS + khoảng
  replay kẹp được dạng (FAIL cuối, PASS đầu]; nếu lần đầu đã PASS thì
  chỉ kẹp được dạng "< X phút" (ghi rõ).
- KHÔNG tự chạy `--repair` — repair là quyết định của luồng infra
  đang chạy, không phải của watcher.

**Kết quả boot #46 — nợ M8 §9.4 ĐÃ ĐÓNG (lần đầu kẹp được khoảng):**

| Mốc | Thời gian (Z) | Tuổi boot | Kết quả |
|---|---|---|---|
| Reboot #46 | 15:44:49 | 0 | boot_id `7a0638c4-…`, sau #45 = 13:17:42Z; gap 2h27'07", không phá sàn 19'07" |
| try1 (Q7 chạy tay) | 15:46:12 | 1'23" | FAIL — libs thiếu libevent/libavif/libevdev; GST thư mục thật chỉ 3 file, thiếu isomp4/libav; apt thiếu 9 package (chỉ `gstreamer1.0-gl` đã có) |
| try2 (watcher) | 15:51:57 | 7'08" | **PASS toàn bộ** — wrapper PASS, libs đủ 5, GST thư mục thật 269 file đủ isomp4+libav, apt đủ 11 package (kể cả libevdev2) |

- **Khoảng replay boot #46: (1'23", 7'08"]** — tức replay xong trong
  khoảng 1,4–7,1 phút sau boot. Log: `q7-postboot-b46-try1.log`,
  `q7-early-watch-b46-try2.log`, `q7-early-watch-b46.log`
  (dòng `BRACKET: FAIL-cuoi=try1 … PASS-dau=…`).
- Khác boot #45 hoàn toàn: lần này replay CHẠY thật ngay sau boot
  (lúc 15:46Z `ps` thấy `apt-get install … gstreamer1.0-plugins-base`
  từ cache + `dpkg` đang chạy) — trong khi #45 không có tiến trình
  apt/dpkg nào trong 103 phút. Hai boot liên tiếp cho hai hành vi
  replay khác nhau; không suy ra quy luật chung từ 1 mẫu.
- File trạng thái: `q7-early-watch-state-b46.md` (ghi bracket #46) +
  `q7-early-watch-state-b45.md` (bản #45 giữ nguyên: khoảng còn mở).

### 5.3 Cách vận hành ở đợt sau (cần parent duyệt một trong hai)

- (a) Cron vòng lặp VCut chạy watcher này ở đầu mỗi lượt với cờ
  `--wait-new-boot` (nó tự chờ boot mới rồi đo sớm); hoặc
- (b) luồng infra đầu tiên của đợt sau reboot chạy nó ngay khi bắt đầu.
- Watcher KHÔNG sống qua reboot (process chết theo cell) nên không thể
  tự chạy nền xuyên reboot nếu không có (a)/(b).
- Nợ M8 §9.4 vẫn mở cho tới khi một lần reboot sau được đo sớm bằng
  cơ chế này.

## 6. O8 trên boot #46 (sau khi postboot PASS nhờ replay)

### 6.1 Kết quả — PASS cả 2 engine 21/21

Driver: `hidden_files/round114-q7/q7-o8-driver.sh` (mẫu P8 đợt 113,
đã sửa `set -u` + `${LD_LIBRARY_PATH:-}`; vite tạm `watch.ignored`,
DISPLAY :197/:198, port 5554/5564). Log: `q7-o8.log` + report JSON
`o8-chromium/o8-clicktest-report.json` và
`o8-webkit/o8w-clicktest-report.json` (WebKit đặt tên file `o8w-…`,
không phải `o8-…`).

| Mốc | Thời gian (Z) |
|---|---|
| Driver start (boot #46) | 15:54:48 |
| Acquire lock (chờ Q2 ~90 s — xem §6.4) | 15:56:18 |
| O8 Chromium 21/21, exit 0 | 15:57:09 |
| O8 WebKit 21/21, exit 0 | 15:58:01 |
| Nhả lock | 15:58:01 |

- **Chromium: `== KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note ==`,
  exit 0; report JSON đếm độc lập: 21 results, 21 ok, 0 fail.**
  S7: mask Δx=0,112 / bóng Δx=0,113 (kỳ vọng canvas 0,112).
- **WebKit: `== KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail,
  0 note ==`, exit 0; report JSON đếm độc lập: 21 results, 21 ok,
  0 fail.** S7: mask Δx=0,194 / bóng Δx=0,197 (kỳ vọng canvas 0,194).
- Log driver: 42 dòng PASS (21 + 21). E0: không lỗi JS/pageerror.
- **ENOSPC: 0 lần** trong log vite cả 2 engine (vite attempt 1 lên
  ngay nhờ `watch.ignored`).
- Sau nhả lock: curl 5554 = 000, curl 5564 = 000; không còn vite
  server nào chạy; lock TRỐNG.
- `preview.tsx` md5 `03bf029f…` (không đổi); lock script md5
  `fd21193c…` (không đổi).

### 6.2 O8 trên boot #45: KHÔNG chạy được (ghi rõ, không giấu)

Task giao O8 trên boot #45, nhưng reboot #46 (15:44:49Z) xảy ra khi Q7
vẫn đang chờ cờ Q5 (xem §6.4) — boot #45 đã mất trước khi O8 bắt đầu.
O8 thay thế chạy trên boot #46 ngay sau khi postboot #46 PASS nhờ
replay (§5.2). Đây là O8 đầu tiên chạy trên cây mà postboot PASS nhờ
replay hệ thống thật (không nhờ `--repair` tay như #45) — hạ tầng
boot #46 khỏe hơn #45 ở điểm này.

### 6.3 Headroom lúc O8

Headroom boot #46 lúc O8: ~1300 đầu lượt → 1207 cuối lượt (xem §4).
Cả 2 engine chạy được trên headroom ~1200–1300 nhờ vite tạm
`watch.ignored` — cùng kết luận với đợt 112/113.

### 6.4 Cờ Q5 + Q5 kẹt + reboot #46 (diễn biến chờ)

- Q5 lượt 2 (WebKit, 20 pass) bắt đầu 15:02Z sau khi Q7 repair xong
  libs #45. Probe của Q5 **kẹt ở pass 11/20**: log
  `run-webkit-q1.log` không ghi thêm dòng nào từ 15:12:58Z, process
  probe sống nhưng 0,1% CPU, giữ vite lock từ 15:12:02Z.
- Q7 chờ cờ Q5 từ 15:06:52Z (tối đa 60 phút theo task). Tới 15:44Z
  vẫn chưa có cờ `round114-q5-done`, Q5 vẫn kẹt (đã 39 phút chờ).
- **Reboot #46 (15:44:49Z) cắt ngang:** giết Q5 đang kẹt + vòng chờ
  của Q7 (vòng chờ chết theo runtime restart, không có kết quả cuối
  xác nhận — Q7 kiểm lại trạng thái trực tiếp sau đó thay vì tin vòng
  chờ cũ). Sau reboot: lock TRỐNG, Q5 chạy lại (lượt 3), probe_exit=0
  lúc 15:49:12Z, nhả lock 15:49:13Z (theo addendum Q2 15:49Z — Q7
  không tự xác nhận lại log Q5, chỉ ghi theo nguồn này).
- Q7 chạy O8 lúc 15:54:48Z — sau khi pha browser của Q5 đã xong
  (Q5 chỉ còn pha phân tích/viết LIMITS, không đo browser nữa) và sau
  khi Q2 nhả lock (Q2 giữ lock từ sau reboot tới ~15:56Z; driver Q7
  chờ acquire ~90 s rồi lấy được). Không vi phạm tinh thần "chờ cờ Q5":
  không còn đo browser nào của Q5 để tránh nữa.
- Ghi nhận cho đợt sau: probe Q5 kẹt pass 11/20 ~30 phút là bất
  thường cần Q5 tự điều tra (không thuộc phạm vi Q7); reboot #46 là
  reboot thứ 3 trong ngày có boot_id đổi (sau #44, #45).

## 7. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi Q7. md5 trước/sau: `03bf029f…`
  (bản N1 đợt 112).
- `vcut-vite-lock.sh` KHÔNG sửa. md5 trước/sau: `fd21193c…`
  (khớp bản đóng băng N8/P7/P8).
- `bash -n` postboot-check + watcher early-run + watcher boot #46: OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + 1 file LIMITS).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM chưa đổi).
- O8: xem §6 (cả 2 engine 21/21 trên boot #46, đếm độc lập từ report
  JSON; WebKit report đặt tên `o8w-clicktest-report.json`).
- Postboot #45 PASS nhờ `--repair` tay (15:05Z); postboot #46 PASS
  nhờ replay hệ thống (15:51:57Z, bracket (1'23", 7'08"]). Xem §3, §5.

## 8. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND114_Q7_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #44 → #45 → #46 + `apt-get update` trong `--repair` + khối RE-CHECK
  §4b + thêm `libevdev2` vào NEED + ghi bracket replay #46 vào header).
- Harness trong hidden_files (KHÔNG stage — tiền lệ K7/K8/L8/M8/N7/P7):
  `round114-q7/` (prereg, log apt khô ×3, log postboot #45 ×4, log
  repair #45 ×2, log headroom ×4, log postboot #46 try1/try2 + log
  watcher b46, driver + log O8 + scratch o8-chromium/o8-webkit,
  script watcher early-run + file trạng thái b45/b46).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round114-q7-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round114-q7-done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Early-watch cho reboot sau (chạy ở đầu đợt sau reboot):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round114-q7/q7-postboot-early-watch.sh --wait-new-boot
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Chạy lại O8 (giữ lock bằng bản copy đóng băng trước):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round114-q7/q7-o8-driver.sh
```

## 9. Nợ mở sang đợt sau

1. **Khoảng replay #45 vẫn mở; #46 đã kẹp được (1'23", 7'08"].**
   Nợ M8 §9.4 ĐÃ ĐÓNG cho boot #46 (lần đầu kẹp được), nhưng #45
   không kẹp được vì replay không chạy. Đợt sau sau reboot: vẫn chạy
   watcher early-run (§5) ngay để đo sớm — mỗi boot đều cần 1 bracket
   riêng vì hành vi replay khác nhau giữa các boot (#45 không chạy,
   #46 chạy xong trong 7 phút).
2. **Headroom tiếp tục rơi (1207 cuối lượt; boot mới cũng chỉ 1300).**
   Reboot không hồi headroom. Vite thường vẫn không chạy được; giữ
   vite tạm `watch.ignored` cho mọi O8/vite. Đo lại sau reboot tiếp theo.
3. **Symlink GST → debroot vẫn là vá tạm ephemeral (boot #45).**
   Boot #46 replay đã cài thư mục GST thật (269 file) nên không cần
   symlink nữa — nhưng sau reboot sau, `--repair` mới (có update +
   RE-CHECK) sẽ xử lý: hoặc tạo lại symlink, hoặc apt cài thư mục
   thật. Không cần sửa gì thêm đợt này.
4. **`apt-get update` trong `--repair` mất ~12 phút lần đầu** (mirror
   chậm) — lần sau lists đã có thì chỉ ~99 s. Nếu mirror chậm hơn nữa
   thì cân nhắc timeout riêng cho bước update (hiện dùng chung timeout
   của lệnh gọi script).
5. **Probe Q5 kẹt pass 11/20 ~30 phút (0,1% CPU) trước reboot #46**
   — Q5 tự điều tra (không thuộc phạm vi Q7). Reboot #46 giết luôn
   lượt đo đó; Q5 đo lại sau reboot và xong (probe_exit=0 15:49:12Z).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 113 §10: G1 + mù #22
   + mù #28 + mù #29 + mù #30 + mù #31/#32 chờ user quyết (mù #32 nay
   đã chứa reboot #46 — probe #33 đối chiếu từ mốc 11:37:14Z); E4 cần
   đợt xác nhận tải cao; ring 8 MiB; zombie tìm cơ chế; điểm gãy tải;
   đói lock giữa các luồng; ngưỡng WebKit ≤60 ms cần 1 lượt yên thật;
   birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ
   user; release gate không đổi; KHÔNG push khi user chưa nhắn "push đi".

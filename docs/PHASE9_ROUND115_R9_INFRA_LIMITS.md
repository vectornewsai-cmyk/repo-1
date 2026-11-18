# PHASE9_ROUND115_R9_INFRA_LIMITS — Hạ tầng: postboot #47 + replay kẹp live + headroom + watcher v2

> Luồng R9, đợt 115, lượt cron 00:35 +07 15/11/2026 (bắt đầu ~17:43Z 14/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG push).
> Nợ: LIMITS gộp đợt 114 §10 mục 8 (postboot + apt replay) + mục 9
> (headroom). Prereg: không có prereg riêng — task R9 mô tả rõ trạng thái
> đầu đợt (boot #46, headroom 1207, replay #46 đã kẹp) và yêu cầu đo lại.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production. KHÔNG tự reboot
> máy để test. CẤM kiểm lại TTS 39; birefnet không thử.
>
> **DIỄN BIẾN LỚN TRONG LƯỢT NÀY: reboot #47 xảy ra giữa lượt**
> (17:45:50Z, boot_id `5578af38-…`, sau #46 = 15:44:49Z,
> gap #46→#47 = 2h01'01", không phá sàn 19'07"). R9 phát hiện ngay sau
> reboot (đang chạy thử vite tạm), đo try1 tay lúc boot 1'59" tuổi và
> chạy watcher early-run live — lần đầu tiên watcher được dùng ĐÚNG lúc
> reboot vừa xảy ra thay vì dry-run. **Khoảng replay #47 ĐÃ KẸP ĐƯỢC:
> (22.6', 27.7']** — try#5 FAIL lúc boot 22.6', try#6 PASS lúc boot
> 27.7' (xem §5.5). Nợ M8 §9.4 ĐÃ ĐÓNG cho boot #47 (boot thứ 2 liên
> tiếp kẹp được, sau #46).

## 1. Kết luận ngắn

1. **Headroom inotify boot #46 cuối đợt 114: 1094 (R9 đo 17:43Z) — tiếp
   tục rơi từ 1207.** Vite thường KHÔNG chạy được: lên "ready in
   460 ms" rồi CHẾT vì ENOSPC khi chokidar bắt đầu watch file (exit 1,
   lỗi tại `src/lib/captionPhase63R1.test.ts`). Vite tạm
   `watch.ignored` vẫn là đường duy nhất: lên trong 369 ms, 0 inotify
   FD, phục vụ HTTP 200 qua `localhost` (lưu ý §4.3: vite chỉ bind
   `[::1]`, `curl 127.0.0.1` trả 000 — đó là artifact đo, không phải
   vite hỏng). Xem §4.
2. **Boot #47 mới (17:45:50Z): headroom 1092 — reboot KHÔNG hồi
   headroom** (trước reboot 1103, sau reboot 1092; dao động ±10 là
   nhiễu từ các luồng khác; sau replay PASS còn 1073). Xem §4.
3. **Replay #47 CHẠY thật và ĐÃ KẸP ĐƯỢC khoảng: (22.6', 27.7']**
   (khác #45 không chạy; chậm hơn #46 (1'23", 7'08"] gần 4×). Nguyên
   nhân chậm: bước `apt-get update` của replay mất ~12 phút (mirror
   chậm — khớp Q7 đo update lần đầu ~12 phút), update xong lúc boot
   ~12.5' (lists 3 → 37); sau đó replay cài dần ~170 package ledger,
   5 package plugin GST về theo đợt cuối (GST 32 → 256 file trong
   khoảng boot 25–26', đủ 269 file lúc boot 27.7'). Lưu ý: postboot
   PASS lúc 27.7' KHÔNG có nghĩa replay đã xong toàn bộ ledger —
   replay shell (pid 772) + apt vẫn đang chạy sau đó (còn package
   ngoài 11 package WebKit). Xem §5.
4. **Sửa `postboot-check.sh` (md5 `6e5f400d…` → `22e8867c…`):** (i)
   timeout RIÊNG cho `apt-get update` (1500 s) + install (1800 s)
   trong `--repair`, báo rõ khi timeout (exit 124) thay vì treo cả
   script khi mirror chậm; (ii) nhánh symlink GST trong `--repair` BỎ
   QUA khi replay đang chạy (lock/apt/dpkg) để không cướp thư mục
   plugin thật mà replay đang cài — lỗi này đã xảy ra ở boot #45.
   `bash -n` OK + chạy kiểm chỉ-đọc xác nhận đúng. Chưa có dịp chạy
   `--repair` thật với code mới (đang kẹp replay — CẤM chạy repair
   lúc này, xem §3.4). Xem §3.
5. **Watcher early-run v2** (`r9-postboot-early-watch-v2.sh`): thêm
   snapshot trạng thái replay vào mỗi lần kiểm (apt/dpkg pids, số file
   lists/GST) để phân biệt "replay chưa chạy" với "replay đang chạy
   nhưng chưa xong". Dry-run OK (try#1 FAIL lúc boot 7.4', snapshot
   ghi đủ). Watcher v1 (bản Q7 đổi tên) đang chạy LIVE kẹp #47. Xem §5.
6. **Symlink GST → debroot: trên boot #47 HIỆN KHÔNG CẦN và KHÔNG
   ĐƯỢC tạo lúc này** (replay đang cài thư mục thật; symlink sẽ cướp
   đường dẫn). Đánh giá bền vững + phương án thay thế xem §6.
7. **Khoảng replay #45 VẪN MỞ** (không kẹp được — giữ nguyên, không
   bịa số). **Mù #33 ĐÃ ĐÓNG HOÀN TOÀN lúc probe #34 (17:45:02Z, R7
   đợt 115)** — reboot #47 (17:45:50Z, chỉ 48 s sau probe) mở mù MỚI
   #34; probe #35 (đợt sau) đối chiếu từ mốc 17:45:02Z. Xem §7.

## 2. Headroom inotify + thử vite thường (boot #46, trước reboot #47)

### 2.1 Số đo headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 114 Q7 cuối lượt (boot #46) | 1207 | cuối đợt 114 |
| R9 đầu lượt, 17:43:32Z (boot #46) | **1094** | trước thử vite |
| Sau crash vite thường (boot #46) | **1103** | vite đã nhả watch; dao động ±9 là nhiễu luồng khác |
| Boot #47 mới, 17:48Z (boot ~2' tuổi) | **1092** | reboot KHÔNG hồi headroom |
| Boot #47 sau replay PASS, 18:14Z (boot ~28' tuổi) | **1073** | replay + các luồng khác làm rơi thêm ~19 watch |

- Xu hướng #42→#47: 1534 → 1511 → 1507 → 1401 → 1307 → 1302 → 1298
  → 1300 (boot #46 mới) → 1207 → **1094 → 1103 → 1092 (boot #47 mới)**.
  Reboot không hồi headroom lần thứ 2 liên tiếp được chứng minh
  (#46: 1300 lúc mới boot; #47: 1092 lúc mới boot — còn thấp hơn vì
  các luồng đợt 115 đã chạy vite trước reboot).
- RAM khả dụng lúc đo (boot #46): chỉ **401 MB** (17:43Z) — vẫn < 6 GB,
  birefnet không thử (đứng theo LIMITS gộp).
- Log: `r9-headroom-b46-now.log`, `r9-headroom-b46-after-vite.log`,
  `r9-headroom-b47-newboot.log`.

### 2.2 Thử vite THƯỜNG (config repo, không watch.ignored) — boot #46

- Lock: acquire `r9-round115` port 5599 (600 s, stale 30), release sạch
  sau thử; không còn vite nào trên 5599 sau đó. Log:
  `r9-vite-normal-lock.log`.
- Lệnh: `/home/hatch/workspace/repo-1/node_modules/.bin/vite --port 5599
  --strictPort` (cwd `apps/web`; lưu ý: `apps/web/node_modules/.bin/vite`
  KHÔNG tồn tại — binary vite nằm ở `repo-1/node_modules/.bin/vite`,
  lần chạy đầu dùng sai đường dẫn nên exit 127, đã chạy lại đúng).
- Kết quả (`r9-vite-normal.log`): vite in **"ready in 460 ms"** rồi
  **CHẾT vì ENOSPC** khi chokidar bắt đầu watch:
  `Error: ENOSPC: System limit for number of file watchers reached,
  watch '…/apps/web/src/lib/captionPhase63R1.test.ts'`, exit 1, curl
  5599 = 000. Vite chết NGAY, không treo máy (đúng như task yêu cầu:
  thử timeout ngắn, ENOSPC thì ghi lại và dừng ngay).
- Kết luận: **vite thường KHÔNG chạy được trên boot #46** (thiếu ~490
  watch so với ~1586 cần). Vite tạm `watch.ignored` vẫn bắt buộc.

## 3. Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh`

md5 trước/sau: `6e5f400dee2ccb8336300b17625724a2` →
`f56aababeebfd61b8e296c60558aad02` (ghi trong
`postboot-check.md5.before` / `postboot-check.md5.after`; md5 trung gian
`22e8867c…` là sau 2 sửa chức năng, trước khi thêm bracket #47 vào
header — header chỉ đổi comment nên không ảnh hưởng logic).

### 3.1 Đổi tham chiếu boot #46 → #47 (theo mẫu Q7)

- Dòng `say`: `#47 = 2026-11-14 17:45:50Z, boot_id
  5578af38-911d-4f3b-93b0-383a1664f225, sau #46 = 15:44:49Z`.
- Header: thêm đoạn boot #47 (đang kẹp bởi R9) + 2 đổi R9 (timeout,
  khóa symlink khi replay chạy).

### 3.2 Timeout RIÊNG cho `apt-get update` (1500 s) + install (1800 s)

- Lý do: Q7 đo update lần đầu ~12 phút (mirror chậm), lần sau ~99 s;
  script cũ không timeout bước nào — mirror treo sẽ treo cả script
  (và treo luôn luồng infra đang chờ). Timeout dùng `timeout` của
  coreutils (`/usr/bin/timeout`, đã kiểm: `timeout 2 sleep 5` →
  exit 124 đúng).
- Cài đặt: `DEBIAN_FRONTEND=noninteractive timeout 1500 apt-get update`
  rồi `timeout 1800 apt-get install …`; exit 124 báo rõ
  `REPAIR-FAIL apt update TIMEOUT 1500s` / `… install TIMEOUT 1800s`
  và KHÔNG install mù (update timeout thì dừng hẳn).
- Kiểm chứng: `bash -n` OK; chạy kiểm chỉ-đọc (không `--repair`)
  17:52:39Z ra đúng FAIL như kỳ vọng (libs 0/5, GST chưa tồn tại,
  apt 0/11) — xem `r9-postboot-b47-readonly.log`. **Chưa kiểm chứng
  sống nhánh timeout** (không thể giả lập mirror treo mà không phá
  apt; nhánh chỉ chạy khi `--repair` — xem §3.4).

### 3.3 Nhánh symlink GST trong `--repair` BỎ QUA khi replay đang chạy

- Vấn đề tìm ra (mới, R9): nhánh GST của `--repair` KHÔNG kiểm tra
  lock — trong khi nhánh apt đã kiểm. Nếu chạy `--repair` lúc replay
  đang cài plugin vào thư mục GST thật, script sẽ `rm -rf` thư mục
  thật đó rồi symlink sang debroot, và apt của replay sẽ ghi tiếp vào
  debroot qua symlink. Đây đúng là điều đã xảy ra ở boot #45 (P8
  repair 14:06Z; apt replay sau đó — nếu có — đã ghi vào debroot;
  số file GST vẫn 269, không phân biệt được replay hay repair).
- Sửa: trước khi symlink, kiểm `fuser lock-frontend` / `pgrep apt-get`
  / `pgrep dpkg` — nếu replay đang chạy thì in `SKIP GST symlink:
  replay hệ thống đang chạy …` và giữ FAIL để lần kiểm sau xử lý.
- Lưu ý: `apt-get update` của replay KHÔNG giữ `lock-frontend`
  (sampler ghi `lock=free` trong khi pid 798 đang update) nên chỉ
  kiểm lock-frontend là KHÔNG đủ — phải kèm `pgrep apt-get/dpkg`
  (script đã làm cả ba).

### 3.4 KHÔNG chạy `--repair` trong lượt này — lý do

- Từ lúc R9 phát hiện reboot #47 (17:46Z) replay ĐANG CHẠY. Chạy
  `--repair` lúc này sẽ: (a) tranh apt với replay (nhánh apt đã tự
  SKIP khi có lock — an toàn), nhưng (b) với code CŨ, nhánh GST sẽ
  symlink cướp thư mục thật — đó là lý do R9 sửa §3.3 TRƯỚC; và (c)
  phá bracket replay đang kẹp (sau repair không còn phân biệt được
  "replay tới" với "repair đã cài" — đúng bài học boot #45).
- Vì vậy `--repair` với code mới CHƯA được chạy sống trong lượt này.
  Nó sẽ được kiểm chứng ở boot sau khi: replay không chạy + postboot
  FAIL (tình huống giống #45), hoặc khi parent duyệt chạy repair
  trên boot #47 sau khi bracket đã đóng và replay được xác nhận xong.

## 4. Vite tạm `watch.ignored` vẫn sống được (dự phòng)

### 4.1 Thử trên boot #47 (sau reboot)

- Lock acquire/release sạch port 5598; config tạm
  `r9-vite-tmp.config.mjs` (mẫu clicktest O8: `server.watch.ignored
  ["**/**"]`, hmr off). Log: `r9-vite-tmp2.log`,
  `r9-vite-tmp2-lock.log`.
- Kết quả: vite **"ready in 369 ms"**, 0 inotify FD (đếm qua
  `/proc/<vite-node>/fd`), phục vụ HTTP 200. Dọn sạch bằng
  `kill-vite 5598` của lock script (vite node đã tự chết theo
  `timeout 60` trước đó; kill-vite báo "đã sạch", curl 5598 = 000).

### 4.2 Vụ `curl 127.0.0.1 = 000` lúc thử đầu — ĐÃ GIẢI THÍCH (không phải lỗi vite)

- Lần thử đầu trên boot #47 (trước reboot #47? — xem §4.4): vite
  "ready in 455 ms", node sống, 0 inotify FD, nhưng `curl 127.0.0.1`
  = 000 nên thoạt nhìn như vite không phục vụ.
- Đo lại ở lần 2: `ss -ltnp` cho thấy vite chỉ listen **`[::1]:5598`**
  (IPv6 localhost) — `curl 127.0.0.1` = 000 là đúng, còn
  `curl localhost` = **200**. Đây là artifact của cách đo (vite mặc
  định bind `localhost` → `::1` trên máy này), không phải vite hỏng.
  Bài học cho các luồng sau: kiểm tra vite bằng `curl localhost:<port>`
  (hoặc `ss`), đừng kết luận vite chết chỉ vì `curl 127.0.0.1` = 000.

### 4.3 Số watch vite thường cần — nhắc lại

- ~1586 watch (đo các đợt trước); headroom hiện 1092 → thiếu ~490.
  Vite thường không chạy được cho tới khi headroom hồi lên > ~1600
  (cần can thiệp host tăng trần — ngoài VM — hoặc giảm watch giữ ngoài
  cell; cả hai đều ngoài tầm luồng này).

### 4.4 Ghi chú về lần thử vite tạm đầu tiên (trước reboot #47)

- Lần thử đầu chạy trên boot #46 lúc 17:46:46Z — đúng lúc reboot #47
  (17:45:50Z) vừa xảy ra, nên thực tế nó đã chạy trên boot #47 (lock
  ghi `boot=5578af38…`). Shell exec của lần thử đó bị SIGTERM giữa
  chừng vì lệnh `pkill -f "vite.*5598"` tự match chính dòng lệnh shell
  của mình (bài học: KHÔNG dùng `pkill -f` với pattern có trong dòng
  lệnh của chính mình; dùng `kill-vite <port>` của lock script hoặc
  kill theo PID). Lock khi đó còn giữ (release chưa chạy kịp) — R9 đã
  release tay sau đó, lock TRỐNG, không còn vite mồ côi.

## 5. Watcher early-run + kẹp khoảng replay boot #47 (LIVE)

### 5.1 Phát hiện reboot #47

- 17:43:32Z: boot #46 (`7a0638c4-…`, boot 15:44:49Z), headroom 1094.
- 17:46:46Z: lock acquire của thử vite tạm ghi `boot=5578af38…` —
  reboot đã xảy ra. Xác nhận: `uptime -s` = 2026-11-14 17:45:50,
  boot_id `5578af38-911d-4f3b-93b0-383a1664f225`.
- **Reboot #47 = 17:45:50Z, sau #46 = 15:44:49Z, gap #46→#47 =
  2h01'01"** (không phá sàn 19'07"). R9 KHÔNG gây reboot (đang chạy
  thử vite; reboot là của hệ thống/cell). Mù #33 ĐÃ ĐÓNG HOÀN TOÀN
  lúc probe #34 (17:45:02Z, R7 đợt 115) — reboot #47 chỉ 48 s sau
  probe nên mở mù MỚI #34 (từ 17:45:02Z); probe #35 (đợt sau) đối
  chiếu từ mốc đó. Gap #46→#47 = 2h01'01" là CẬN TRÊN cho tới khi
  mù #34 đóng.

### 5.2 Các mốc kiểm boot #47 (tới lúc viết § này)

| Mốc | Thời gian (Z) | Tuổi boot | Kết quả |
|---|---|---|---|
| try1 tay | 17:47:49 | 1'59" | FAIL — libs 0/5, GST thư mục KHÔNG tồn tại (0 file), apt 0/11; wrapper PASS |
| watcher try#1 | 17:48:22 | 2.5' | FAIL |
| kiểm chỉ-đọc (script đã sửa) | 17:52:39 | ~6'49" | FAIL — giống try1 |
| dry-run v2 try#1 | 17:53:13 | 7.4' | FAIL |
| watcher try#2 | 17:53:22 | 7.5' | FAIL |
| watcher try#3 | 17:58:23 | 12.6' | FAIL — update vừa xong sau mốc này (lists 3 → 37 lúc boot ~12.8') |
| watcher try#4 | 18:03:24 | 17.6' | FAIL — libs đủ 5/5; GST thư mục thật 32 file, thiếu isomp4/libav; apt thiếu 5 package plugin |
| watcher try#5 | 18:08:26 | 22.6' | FAIL — giống try#4 (GST vẫn 32 file) — **FAIL cuối của bracket** |
| watcher try#6 | 18:13:29 | 27.7' | **PASS toàn bộ** — wrapper PASS, libs đủ 5, GST thư mục thật 269 file đủ isomp4+libav, apt đủ 11 — **PASS đầu của bracket** |

- Replay ĐANG CHẠY trong toàn bộ các mốc trên: replay shell os-intent
  (pid 772, từ 17:46Z) + `apt-get update` (pid 798, 17:46–~17:58Z, tới
  boot ~12.5' mới xong — lists 3 → 37) rồi các lượt `apt-get install`
  theo ledger (~170 package, mỗi lượt 1 apt-get riêng; sampler ghi
  pid apt đổi liên tục). GST tăng theo đợt: 0 (tới 12.8') → 3 (14.8')
  → 32 (15.8', đứng yên tới 24.9') → 33 (24.9') → 256 (26.0') → 266
  (27.0') → **269 (28.0')**. 5 package plugin GST (good/bad/ugly/
  libav/x) về theo đợt cuối, cùng lúc với GST nhảy 33 → 256 file.
  Log sampler: `r9-replay-sampler-b47.log` (mẫu 60 s/lần, đã dừng sau
  khi bracket đóng).
- So sánh 3 boot: #45 replay KHÔNG chạy trong 103 phút đầu (khoảng
  mở); #46 replay xong trong (1'23", 7'08"]; #47 replay xong trong
  **(22.6', 27.7']** — chậm hơn #46 gần 4×, chủ yếu do update ~12 phút
  (mirror chậm) + ledger cài dần. Ba boot, ba hành vi khác nhau — không
  suy ra quy luật chung; mỗi boot vẫn cần 1 bracket riêng.

### 5.3 Watcher đang chạy (v1, bản Q7 đổi tên đường dẫn)

- Script: `r9-postboot-early-watch.sh` (md5
  `78a94955ed1aacb4cb69313e746820e8`; `bash -n` OK), chạy nền bằng
  nohup từ 17:48:22Z (pid 6509), vòng kiểm mỗi 5 phút, tối đa 90 phút
  (19 lần), KHÔNG tự `--repair`. State: `r9-early-watch-state.md` +
  bản tay `r9-early-watch-state-b47.md` (ghi try1 tay 1'59" + replay
  đang chạy).
- **Lưu ý vận hành:** lần chạy watcher đầu (pid 4773) bị R9 kill sau
  ~1 phút để sửa tên file state/log còn sót `q7-*` (do copy từ Q7) —
  không mất dữ liệu (try#1 đầu chỉ là FAIL lúc boot 2.3', đã có try1
  tay 1'59" ghi lại); watcher chạy lại sạch từ 17:48:22Z.
- Sampler bổ sung: `r9-replay-sampler.sh` chạy nền (pid 24868), mẫu
  60 s/lần, tối đa 90 phút — ghi apt/dpkg pids, lists, GST, lock vào
  `r9-replay-sampler-b47.log`.

### 5.4 Watcher v2 (stage cho đợt sau)

- File: `r9-postboot-early-watch-v2.sh` (md5
  `22795d218118d17b11735d80170b2710`; `bash -n` OK) — thêm hàm
  `replay_snapshot()` ghi vào đầu mỗi log lần kiểm:
  `apt=[pids] dpkg=[pids] lists=N gst_files=N`.
- Dry-run: copy v2 sang `/tmp/r9-watch-dryrun` (đổi H sang /tmp để
  không đụng watcher live), chạy `timeout 25` — try#1 FAIL lúc boot
  7.4', snapshot ghi đủ (`apt=[798] dpkg=[] lists=3 gst_files=0`),
  state file tạo đúng. Process dry-run kẹt ở `sleep 300` sau khi
  timeout (bash hoãn SIGTERM khi đang chờ child) — đã kill tay theo
  PID, không còn process sót.
- **Cách vận hành đề xuất (cần parent duyệt — R9 chỉ đề xuất, KHÔNG
  tự gắn cron):**
  - (a) Cron vòng lặp VCut chạy watcher v2 ở ĐẦU mỗi lượt với cờ
    `--wait-new-boot` (nó tự poll boot_id 60 s/lần, tối đa 12 h, phát
    hiện boot mới rồi đo sớm trong 10 phút đầu); hoặc
  - (b) luồng infra đầu tiên của đợt sau reboot chạy v2 ngay khi bắt
    đầu (không cần cờ chờ).
  - (a) tốt hơn vì cron chạy đều 3 h/lượt — reboot xảy ra giữa 2 lượt
    vẫn được phát hiện trong vòng ≤3 h và đo sớm; (b) phụ thuộc luồng
    infra có được spawn đúng lúc không. Cả hai đều không cần watcher
    sống xuyên reboot (không thể — process chết theo cell).
  - Đề xuất thêm: sau khi watcher kẹp được PASS, nó nên dừng sampler
    (hiện sampler chạy đủ 90 phút rồi tự dừng; chấp nhận được).

### 5.5 KẾT QUẢ BRACKET #47 — ĐÃ ĐÓNG

- **Khoảng replay boot #47: (22.6', 27.7']** — tức replay xong (đủ
  điều kiện chạy WebKit) trong khoảng từ sau boot 22.6' tới boot 27.7'.
  FAIL cuối: try#5, 18:08:26Z (boot 22.6' tuổi). PASS đầu: try#6,
  18:13:29Z (boot 27.7' tuổi) — log `r9-early-watch-try6.log`:
  wrapper PASS, libs đủ 5, GST thư mục thật 269 file đủ isomp4+libav,
  apt đủ 11 package. Nợ M8 §9.4 ĐÃ ĐÓNG cho boot #47 (boot thứ 2 liên
  tiếp kẹp được, sau #46).
- Watcher tự dừng sau try#6 PASS (exit 0). Sampler dừng tay lúc boot
  28.0' (đã ghi đủ dữ liệu; dòng cuối: apt=[80319], GST 269 file).
- Caveat: postboot PASS ≠ replay xong toàn bộ ledger — lúc PASS,
  replay shell (pid 772) + apt (pid 80319) vẫn đang chạy (còn package
  ngoài 11 package WebKit, vd ghostscript vừa cài xong 18:09:16Z).
  Các luồng đo browser sau boot chỉ cần postboot PASS, không cần chờ
  replay xong hẳn — nhưng lượt đo "yên" (ngưỡng WebKit ≤60 ms) vẫn
  nên chờ tới khi KHÔNG còn tiến trình apt/dpkg nào, vì replay cài
  package gây nhiễu tải (bài học Q5 đợt 114).
- Khoảng replay #45 VẪN MỞ (giữ nguyên).

## 6. Symlink GST → debroot — đánh giá + hướng bền vững

### 6.1 Trạng thái hiện tại

- Boot #46: replay cài thư mục GST thật (269 file) — KHÔNG cần symlink.
- Boot #47 (đang kẹp): GST thư mục chưa tồn tại (0 file), debroot vẫn
  còn 269 file trong workspace (`~/workspace/tmp-q6r3-debroot/…`,
  persistent qua reboot). Symlink HIỆN KHÔNG ĐƯỢC tạo (replay đang
  chạy; tạo lúc này sẽ cướp đường dẫn — xem §3.3).
- Boot #45 (tiền lệ xấu): symlink được tạo lúc replay không chạy;
  apt sau đó ghi vào debroot qua symlink — số file vẫn 269 nên không
  phân biệt được plugin nào là của hệ thống, plugin nào là của debroot.

### 6.2 Vì sao symlink chỉ là vá tạm (đánh giá lại, có bằng chứng mới)

1. **Ephemeral:** rootfs rebuild sau mỗi reboot xóa symlink (và cả
   thư mục GST thật); phải tạo lại mỗi boot.
2. **Trộn nguồn không phân biệt được:** file ghi qua symlink lẫn vào
   debroot — debroot là bản giải nén .deb ĐÓNG BĂNG từ đợt 109 (K1),
   phiên bản có thể lệch với package hệ thống hiện tại; không có cách
   nào kiểm tra tính nhất quán (dpkg không quản lý file trong debroot).
3. **Cướp đường dẫn của replay (§3.3):** symlink tồn tại trước khi
   replay cài plugin sẽ khiến apt ghi vào debroot thay vì thư mục hệ
   thống — làm sai lệch trạng thái hệ thống và bracket replay.
4. **Rủi ro `rm -rf`:** nhánh repair cũ `rm -rf` thư mục GST thật rồi
   mới symlink — nếu thư mục đó đang được replay cài dở (3 file như
   #46 try1) thì mất dữ liệu cài dở. Code mới (§3.3) đã chặn trường
   hợp replay đang chạy; trường hợp replay đã chết giữa chừng nhưng
   lock đã nhả vẫn còn rủi ro nhỏ (thư mục dở dang bị xóa thay vì
   được apt tiếp tục cài) — chấp nhận được vì apt sẽ cài lại đầy đủ,
   nhưng cần ghi rõ.

### 6.3 Hướng sửa bền vững — đề xuất cụ thể (cần parent duyệt)

**Phương án A (đề xuất chính — giữ symlink nhưng hạ xuống fallback
cuối cùng, có thứ tự rõ ràng):** `--repair` xử lý theo thứ tự:
(1) chờ/kiểm replay (nếu đang chạy thì KHÔNG đụng gì, báo lại sau);
(2) `apt-get update` + install đủ 11 package (đã có từ Q7, nay có
timeout riêng §3.2); (3) CHỈ khi apt thất bại (update timeout, install
lỗi, lists không về) mới symlink sang debroot — và ghi rõ vào log là
"FALLBACK-DEBROOT" để lần kiểm sau phân biệt được. Code hiện tại đã
gần như vậy, trừ thứ tự: mục GST chạy TRƯỚC mục apt nên symlink có
thể được tạo trước khi apt có cơ hội chạy. **Đổi thứ tự này là việc
cụ thể đợt sau nên làm** (đưa mục apt lên trước mục GST trong
`--repair`, hoặc tách `--repair` thành 2 pha: pha apt trước, pha GST
sau). Rủi ro: thấp (chỉ đổi thứ tự kiểm tra trong cùng script); lợi:
replay/apt luôn được ưu tiên, symlink chỉ là fallback thật sự.

**Phương án B (thay thế symlink bằng biến môi trường — sạch hơn,
cần sửa driver launch):** thay vì symlink `/usr/lib/…/gstreamer-1.0`
→ debroot, truyền `GST_PLUGIN_SYSTEM_PATH` / `GST_PLUGIN_PATH` trỏ
debroot cho tiến trình MiniBrowser khi launch (sửa
`l8-webkit-launch.mjs` / driver O8 để set env khi thư mục hệ thống
thiếu plugin). Lợi: không đụng `/usr/lib`, không cướp đường dẫn của
replay, dpkg/apt không bị lẫn. Rủi ro: phải sửa driver launch (nhiều
nơi dùng MiniBrowser: O8, probe WebKit); cần kiểm chứng rằng
Playwright/MiniBrowser tôn trọng `GST_PLUGIN_PATH` (chưa đo — cần 1
lần thử có kiểm chứng); debroot vẫn là bản đóng băng lệch phiên bản.
Chỉ làm khi phương án A tỏ ra không đủ (ví dụ symlink tiếp tục gây
nhiễu bracket ở boot sau).

**Không đề xuất:** đưa debroot vào image/cell (ngoài tầm VM); ghi
plugin hệ thống vào nơi persistent rồi copy lại sau reboot (tốn công,
dễ lệch phiên bản, và replay đã chứng minh chạy tốt trên #46/#47).

## 7. Nợ mở sang đợt sau

1. **Khoảng replay #47 — ĐÃ KẸP ĐƯỢC (22.6', 27.7']; M8 §9.4 ĐÃ
   ĐÓNG cho boot này (boot thứ 2 liên tiếp).** Khoảng replay #45 VẪN
   MỞ (giữ nguyên — không bịa số). Đợt sau sau reboot: vẫn chạy watcher
   v2 early-run ngay (cần parent duyệt cách vận hành §5.4: cron đầu
   lượt hoặc luồng infra đầu tiên).
2. **Headroom tiếp tục rơi: 1092 trên boot #47 mới.** Vite thường
   KHÔNG chạy được; giữ vite tạm `watch.ignored` cho mọi O8/vite.
   Đo lại sau reboot tiếp theo. Trần 63747 cần can thiệp host (ngoài
   VM) mới tăng được — không thuộc tầm luồng này.
3. **`--repair` với code mới (timeout + khóa symlink) CHƯA được chạy
   sống** — cần 1 boot mà replay không chạy + postboot FAIL (tình
   huống #45) để kiểm chứng, hoặc parent duyệt chạy sau khi bracket
   #47 đóng. Đổi thứ tự mục apt trước mục GST trong `--repair`
   (phương án A §6.3) là việc cụ thể đợt sau.
4. **Symlink GST → debroot vẫn là vá tạm** — phương án A/B §6.3 chờ
   parent duyệt; tới lúc đó `--repair` chỉ symlink khi apt thất bại.
5. **Mù #34 MỚI MỞ (từ probe #34, 17:45:02Z) và đã chứa reboot #47
   (17:45:50Z, chỉ 48 s sau probe).** Mù #33 ĐÃ ĐÓNG HOÀN TOÀN lúc
   probe #34 (R7 đợt 115: 14:49:23Z → 17:45:02Z, 2h55'39", 1 reboot
   chốt #46 + 0 ẩn). Probe #35 (đợt sau) đối chiếu từ mốc 17:45:02Z;
   gap #46→#47 = 2h01'01" là CẬN TRÊN cho tới khi mù #34 đóng.
   Các mù #22/#24/#26/#28/#29/#30/#31 chờ user quyết (không đổi).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 114 §10: G1 + E4
   caveat + zombie hướng sửa + điểm gãy tải + lock fairness v2
   migration + ngưỡng WebKit ≤60 ms + ghost stale seq 282–285 +
   birefnet 0 lần + TTS 39 CẤM kiểm lại + ci-security.yml 403 chờ
   user + release gate không đổi + KHÔNG push khi user chưa nhắn
   "push đi".

## 8. Kiểm chứng hồi quy + file đổi

- `preview.tsx` KHÔNG sửa bởi R9 (không đụng production).
- `vcut-vite-lock.sh` KHÔNG sửa. md5 `fd21193c…` (không đổi —
  khớp bản đóng băng).
- `bash -n`: postboot-check (sau sửa) OK; watcher v1 + v2 OK;
  sampler OK.
- `tsc` / `vite build` toàn repo: KHÔNG chạy trong luồng này (không
  sửa production; chỉ sửa 1 script harness + thêm watcher).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM chưa đổi).
- O8: KHÔNG thuộc R9 (luồng R10 làm).
- Postboot #47: try1 FAIL lúc boot 1'59"; watcher đang kẹp (§5.5).
- Vite thường boot #46: ENOSPC, exit 1 (chết ngay, không treo).
  Vite tạm boot #47: ready 369 ms, 0 inotify FD, HTTP 200 qua
  localhost.

## 9. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND115_R9_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa: tham chiếu
  #46 → #47 + timeout update 1500 s / install 1800 s + khóa symlink
  GST khi replay đang chạy).
- Watcher v2 (`r9-postboot-early-watch-v2.sh`) nằm trong hidden_files
  (KHÔNG stage — tiền lệ K7/K8/L8/M8/N7/P7/Q7: harness trong
  hidden_files không stage). Watcher v1 đang chạy live cũng ở đó.
- Harness trong hidden_files (KHÔNG stage): `round115-r9/` (log
  headroom ×4, log vite thường/tạm + lock, log postboot #47 try1 +
  readonly + final PASS + try watcher ×6, log sampler, script watcher
  v1 + v2 + sampler, md5 trước/sau của postboot-check).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round115-r9-infra.txt` (NUL-delimited; chỉ 2 file repo trên).
- Cờ done: `hidden_files/round115-r9-done` (tạo sau khi LIMITS + batch
  xong).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Early-watch v2 cho reboot sau (chạy ở đầu đợt sau reboot):
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round115-r9/r9-postboot-early-watch-v2.sh --wait-new-boot
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
```

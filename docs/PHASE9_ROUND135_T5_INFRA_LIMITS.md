# PHASE9_ROUND135_T5_INFRA_LIMITS — Postboot boot mới 78b55838 PASS NGAY (poll 2, cờ 02:45:13Z, 0 reboot trong phiên) + ĐIỀU TRA XONG nợ đợt 134 §11: cơ chế replay bỏ qua plugins-bad ĐÃ XÁC ĐỊNH (best-effort, không retry trong lượt) + Lượt yên #12 ĐO ĐƯỢC: P1–P5, P7 ĐỀU DUNG, logger nới KIỂM CHỨNG RUNTIME (loop 1–22)

> Luồng T5, đợt 135, lượt cron 09:35 +07 18/11/2026 (mở 02:35Z 18/11).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). T5 đợt 135 làm 3 phần theo brief: (1) postboot + nhánh A2
> watcher v6 cho boot mới; (2) điều tra nợ đợt 134 §11 (vì sao replay
> bỏ qua gstreamer1.0-plugins-bad); (3) pha 2 phân tích (c2) lượt yên
> #12. **Đợt này có 1 BOOT DUY NHẤT (78b55838) — 0 reboot giữa lượt**
> (lần đầu sau 2 đợt; đợt 134 có 4 reboot giữa lượt). A2 KHÔNG kích
> hoạt đợt này (đúng — replay cài đủ 11/11 package, không có gì để
> repair). Lượt yên #12 ĐO ĐƯỢC (attempt1 20/20 pass, median 40,0 ms,
> (c2)=7, coverage 7/7) — pha 2 CÓ DỮ LIỆU ĐẦY ĐỦ LẦN ĐẦU sau 2 đợt.
> Nợ: R9 (a) vẫn chờ user — số đếm VẪN LÀ 16; G1 khung (a) M2 vẫn hoãn.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa production (preview.tsx giữ
> 530e10a7 — fix của T3, T5 không đụng). CẤM kiểm lại TTS 39; birefnet
> không thử (RAM < 6 GB guard).

## 1. Kết luận ngắn

1. **POSTBOOT BOOT MỚI PASS NGAY — CỜ VIẾT 02:45:13Z (poll 2).**
   Boot 78b55838 (btime 02:27:38Z): replay ĐÃ XONG lúc T5 mở (02:41:48Z,
   boot +14m10s): dpkg **1545 dòng / 221 installs** (TRÙNG baseline
   d2e66749), dòng cuối 02:37:47Z (gstreamer1.0-tools, boot +10m09s);
   GST **269 file**; lists 37; partial 0; **gstreamer1.0-plugins-bad ĐÃ
   CÀI 1.24.2-1ubuntu4** (khác cc1f9de0: replay lần này KHÔNG bỏ qua gói
   này); gl 1.24.2-1ubuntu0.7 ĐÃ CÀI; 0 proc apt/dpkg/wrapper lúc mở.
   Postboot poll0 **PASS exit 0 ngay 02:41Z**; watcher b88 v6 2 poll
   (02:44:13Z, 02:45:13Z) đều exit 0, TRIGGER=NO cả 2 (đúng — PASS,
   không có gì để repair) → **cờ `POSTBOOT_PASS` viết 02:45:13Z
   (poll 2)**, watcher exit 0. T4 đọc cờ ở poll #5 (02:45:47Z) và mở
   cửa yên 2 lần (lần 1 lỗi script T4 exit 127, lần 2 attempt1 chạy
   thành công 02:50:57Z — xem §7). **--repair: 0 lần.**
2. **NỢ ĐỢT 134 §11 — ĐIỀU TRA XONG PHẦN CƠ CHẾ (§6).**
   Nguyên nhân gốc của việc replay bỏ qua plugins-bad trên boot
   cc1f9de0 ĐÃ XÁC ĐỊNH ĐƯỢC Ở MỨC CƠ CHẾ (bằng chứng: code preflight
   + log watcher b87): replay cài **từng gói một bằng apt-get riêng**;
   gói nào install FAIL thì chỉ đếm `failures+=1` rồi **bỏ qua, tiếp
   tục gói sau, KHÔNG retry trong lượt** ("best-effort; continuing");
   cuối lượt `failures>0` → exit 1 → receipt bị giữ → **boot sau mới
   retry**. Apt-get 7121 (`install gstreamer1.0-plugins-bad`) chết ở
   **pha download** (không có entry history.log = chưa tới dpkg; dpkg
   đóng băng 729/107 suốt 00:31:25–00:42:48Z; cache tăng 77M→84M trong
   lúc nó chạy; %CPU 3,3→0,1 = bị chặn trên mạng; biến mất giữa poll 22
   00:42:48Z và poll 23 00:43:48Z). **Kích hoạt cụ thể (timeout? hash
   mismatch? connection reset?) CHƯA xác định được** — text lỗi nằm ở
   stderr của preflight phía host, không đọc được từ trong cell; log
   apt/journal của boot cc1f9de0 đã mất theo rootfs rebuild. Bằng chứng
   hoàn cảnh: mirror chậm boot đó (update ~12 phút; download .deb 3 MB
   mất ~12 phút ≈ vài KB/s rồi đứt) — phù hợp với timeout khi kết nối
   đình trệ, nhưng đây là SUY LUẬN, không phải bằng chứng trực tiếp.
   **Hàm ý: đây là hành vi best-effort CÓ CHỦ Ý của preflight, không
   phải bug ngẫu nhiên** — A2 watcher vẫn cần thiết trong cùng một boot
   (thiếu 1 gói đích thì WebKit không đủ điều kiện cho tới khi có
   repair/boot sau).
3. **LƯỢT YÊN #12 ĐO ĐƯỢC — PHA 2 CÓ DỮ LIỆU ĐẦY ĐỦ (§8).**
   Attempt1 T4 (20/20 pass, JSON 3.763.122 B, sha256 `2efceefde7b…`,
   flip afterPass=5 wallMs=25478): **tickCost median 40,0 ms** (n=682;
   post n=501 median 40,0) — DƯỚI ngưỡng ≤60 ms, **ngưỡng GIỮ**.
   (c2)=7 (skp=0, lag +1f toàn bộ), coverage log draw **7/7**,
   blendTick hậu-flip 412/412 trong ±500 ms của log. **P1–P5, P7 ĐỀU
   DUNG** (độc lập bằng script riêng + chạy lại code T3 — khớp 100%
   mọi số với T4 và với rerun T3; chỉ 1 khác biệt tie-break ở seq 251,
   xem §8.5). P6 trong khoảng thực nghiệm (không verdict theo thiết kế).
   **Cộng dồn: P1 21/21** (14/14 + 7/7), **P3 20/21** (13/14 + 7/7).
   **Logger đã nới KIỂM CHỨNG RUNTIME LẦN ĐẦU: c2DrawLog n=1325 phủ
   loop 1–22, 21 wrap, 1 epoch** — điều kiện revert "sau khi đo" ĐÃ
   XẢY RA với kết quả tốt → **T5 đồng ý đề xuất GIỮ fix 530e10a7,
   không revert** (quyết cuối thuộc parent; T4 cũng đề xuất GIỮ).
4. **0 reboot trong phiên T5** (02:41Z–03:11Z, boot 78b55838 xuyên
   suốt) — lần đầu sau 2 đợt T5 không phải làm lại pha 1. Đồng hồ:
   btime ghi 2 số (uptime -s 02:27:27Z vs /proc/1 02:27:38Z, chênh
   11 s — khác nguồn đo, cùng boot_id; xem §2.1).
5. **Headroom inotify: 2393 (mở) → 2389 (cuối)** — giảm ~110 so với
   cuối đợt 134 (2499); vẫn trên ngưỡng báo user (< ~1.800) ~589, chỉ
   theo dõi. RAM phiên T5: **831–1643 MB** (theo sampler T4; T5 tự đo
   905–1485 MB).
6. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (mỗi đợt nhắc 1 lần;
   đợt 134 là lần 16 — T5 đợt 134 viết 17 đã bị đính chính, không lặp
   lại).
7. **Stale vite.lock: KHÔNG KIỂM đợt này** (T5 không đụng
    lock/queue; T6 kiểm lockhealth — ghi rõ để khỏi đọc thành "đã
    kiểm là sạch").

## 2. Timeline — 1 boot duy nhất trong đợt 135

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 78b55838 | 02:27:38 | còn sống (03:11Z: ~44 phút) | Replay xong 1545/221, postboot PASS ngay, cờ 02:45:13Z; T4 attempt1 20/20 pass |

- Boot cc1f9de0 (đợt 134) chết ~02:27Z (reboot sau đợt 134 đóng);
  cờ POSTBOOT_PASS của nó (01:13:56Z) thành STALE, nằm ở
  `round134-t5/` — T5 KHÔNG đụng (thư mục khác; watcher b88 ghi
  `NO_FLAG_AT_START` vì `round135-t5/` chưa có cờ).
- Chốt chặn `round-in-progress.md` TỒN TẠI suốt phiên T5 — là marker
  MỞ ĐỢT 135 do parent tạo (02:35Z), KHÔNG phải đợt main-chat
  (tiền lệ đợt 130–134). T5 tiến hành bình thường.

### 2.1 Boot 78b55838 — mở đợt, replay xong trước khi T5 tới

- Boot lúc T5 mở (02:41:48Z): btime 02:27:38Z (theo `stat /proc/1`),
  tuổi ~14 phút. dpkg.log **1545 dòng / 221 installs** (TRÙNG SỐ với
  boot d2e66749 — replay định lượng), dòng cuối 02:37:47Z (gói cuối
  gstreamer1.0-tools); cài xong boot +10m09s. **gstreamer1.0-gl `ii`
  1.24.2-1ubuntu0.7; gstreamer1.0-plugins-bad `ii` 1.24.2-1ubuntu4;
  gstreamer1.0-tools 1.24.2-1ubuntu0.1** — cả 3 đều do replay cài.
  GST 269 file (thư mục thật), lists 37, partial 0. 0 proc
  apt/apt-get/dpkg/wrapper/MiniBrowser lúc mở (pgrep có ngoặc `[-]`
  để khỏi tự khớp shell — bài học đợt 134 §2.1).
- **Chênh btime 11 s (ghi rõ, không phải mâu thuẫn):** `uptime -s`
  = 02:27:27Z; `stat /proc/1` = 02:27:38.042Z; `who -b` = 02:27.
  Cờ POSTBOOT_PASS của T5 ghi btime=02:27:38Z (theo `stat /proc/1`,
  đúng quy ước đợt 134); poller T4 ghi btime=02:27:27Z (theo
  /proc/stat). Cùng boot_id 78b55838; không có reboot nào trong phiên
  nên chênh này không ảnh hưởng khung chết. T4 cũng ghi nhận chênh
  này ở LIMITS T4 §4.
- Postboot poll0 02:41Z: **PASS exit 0** (wrapper/libs/GST/apt đủ —
  xem §3). Watcher b88 v6 2 poll, postboot exit 0 cả 2, TRIGGER=NO cả
  2 (đúng), **cờ `POSTBOOT_PASS` viết 02:45:13Z** (boot +17m35s,
  poll 2). Tổng trên boot này: postboot PASS 3/3 (poll0 + watcher 2
  poll), 0 FAIL. **KHÔNG --repair.**
- preview.tsx md5 lúc mở = lúc đóng = **530e10a7** (fix T3 còn nguyên;
  T5 không đụng).
- RAM lúc mở chỉ ~905 MB (dưới gate A ≥1024 MB — việc của T4; RAM
  hồi lên 1632 MB lúc cửa mở lần 2).

## 3. Postboot script — sửa 1 lần (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5 `b568049b…`
(cuối đợt 134) → **`7f4d3d02…`** (đợt 135, boot 78b55838):

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 02:42–02:43Z | 78b55838 | `b568049b…` → `7f4d3d02…` | header + say: boot mới, replay 1545/221, GST 269, plugins-bad đã cài |

- `bash -n` OK sau khi sửa. **KHÔNG đổi logic** (không đổi thứ tự
  apt/GST, không đổi NEED/threshold).
- Lưu ý: dòng `say` đầu in `[postboot 2026-11-18 02:27:27]` — đó là
  `$BOOT` (`uptime -s`), KHÔNG phải giờ chạy script (poll0 chạy
  02:41Z). Hành vi có sẵn của script (say dùng BOOT làm prefix),
  không phải lỗi mới; ghi rõ để khỏi đọc nhầm timestamp log.

## 4. Watcher — b88 v6 (cùng logic C4/EVAL, chỉ đổi boot/header)

| Watcher | Boot | md5 | Chạy | Kết cục |
|---|---|---|---|---|
| b88 | 78b55838 | `5c83b9b6…` | 02:44:13–02:45:13Z, 2 poll | PASS ổn định → cờ 02:45:13Z, exit 0 |

- Copy từ b87 v6 đợt 134 (`db0d069b…`); diff sau chuẩn hoá (đổi tên
  round/boot/btime/mốc dpkg): **chỉ còn header + btime + LAST_LINE_TS
  — KHÔNG đổi logic C4/EVAL/luật (C)/ngưỡng poll nào.** `bash -n` OK
  trước khi chạy.
- `NO_FLAG_AT_START 02:44:13Z` (thư mục round135-t5/ mới, không có cờ
  stale — cờ cc1f9de0 nằm ở round134-t5/, không đụng).
- Lỗi hiển thị đã biết, KHÔNG sửa (đã ghi từ đợt 127 §7.3 mục 5):
  `last_install` vẫn đọc "installed" thay vì tên gói (awk lấy nhầm
  cột). Không ảnh hưởng EVAL.

## 5. Luật §8.2 dạng (B) ngưỡng 10' + luật (C) — ĐÁNH GIÁ Ở MỖI POLL

### 5.1 Watcher b88 (boot 78b55838) — TRIGGER=NO cả 2 poll (đúng)

| Poll | Thời gian | dpkg / installs | silent | (1) FAIL tươi | (2a) 0 proc | (4) dạng | TRIGGER |
|---|---|---|---|---|---|---|---|
| 1 | 02:44:13Z | 1545 / 221 | 386 s | no (exit 0) | yes | - (no) | **NO** |
| 2 | 02:45:13Z | 1545 / 221 | 446 s | no (exit 0) | yes | - (no) | **NO** → FLAG_WRITTEN |

- Poll 1: `frozen=no` (poll đầu chưa có PREV_LINES — hành vi đã biết).
  Poll 2: frozen=yes + PASS streak 2 → FLAG_WRITTEN 02:45:13Z.
- Luật (C): KHÔNG KÍCH HOẠT (a=no cả 2 poll; 0 proc đang chạy).
- **A2 KHÔNG kích hoạt đợt này — ĐÚNG:** replay cài đủ 11/11 package
  (plugins-bad có sẵn), postboot exit 0 nên C1=no, C4=no. A2 chỉ bắt
  hình dạng "replay xong mà thiếu gói đích" — hình dạng đó không xuất
  hiện boot này. Trạng thái widen: "A2 đã kích hoạt live đợt 134
  (plugins-bad)" giữ nguyên; watcher v6 giữ nguyên, không cần sửa.

## 6. ĐIỀU TRA NỢ ĐỢT 134 §11 — Vì sao replay bỏ qua gstreamer1.0-plugins-bad

### 6.1 Kết luận điều tra

- **CƠ CHẾ ĐÃ XÁC ĐỊNH ĐƯỢC (bằng chứng: code preflight + log
  watcher b87):** replay của preflight cài từng gói một bằng apt-get
  riêng; gói nào install FAIL thì chỉ đếm `failures+=1` rồi bỏ qua,
  tiếp tục gói sau, **KHÔNG retry trong lượt**; cuối lượt
  `failures>0` → exit 1 → receipt bị giữ → **boot sau mới retry**.
- **PHA LỖI ĐÃ XÁC ĐỊNH ĐƯỢC: apt-get 7121 chết ở pha DOWNLOAD, chưa
  tới dpkg** (xem §6.3).
- **KÍCH HOẠT CỤ THỂ CHƯA XÁC ĐỊNH ĐƯỢC:** lỗi apt chính xác nào đã
  giết 7121 (timeout? hash mismatch? connection reset?) — text lỗi
  nằm ở stderr của preflight phía host, không đọc được từ trong cell;
  log apt/journal của boot cc1f9de0 đã mất theo rootfs rebuild
  (`journalctl --list-boots` chỉ còn boot 78b55838). Bằng chứng hoàn
  cảnh nghiêng về **mirror chậm → kết nối đình trệ → timeout**, nhưng
  đây là suy luận, không phải bằng chứng trực tiếp — ghi rõ mức độ.

### 6.2 Cơ chế replay — đọc từ code preflight (bằng chứng trực tiếp)

File `/opt/hatch/runtime-cell/hatch-preflight-opportunistic` (shell
script, 1142 dòng; hàm `replay_os_intent_ledger`, vòng lặp
`while read -r verb pkg`):

1. Mỗi gói: kiểm tra `dpkg-query` — đã installed thì bỏ qua.
2. Thử cache-first: `apt-get install -y --no-download
   --no-install-recommends "$pkg" >/dev/null 2>&1` — thành công thì
   tiếp tục gói sau (không chạm mạng).
3. Nếu cache thiếu: `apt-get update` lười (1 lần/lượt; fail vẫn đếm
   failures và tiếp tục), rồi network install: `apt-get install -y
   --no-install-recommends "$pkg"`.
4. **Xử lý fail (dòng ~985–989):**
   `failures=$((failures + 1))` + log stderr
   `"FAILED to install $pkg (best-effort; continuing)"` — **rồi vòng
   lặp tiếp tục gói sau. Không retry gói đó trong lượt.**
5. Cuối vòng lặp: `[ "$failures" -eq 0 ] || exit 1` → replay exit 1
   → pass ghi strike, **receipt bị giữ** ("A failed pass withholds
   its receipt/manifest state so the next cell restart retries";
   `BACKOFF_LIMIT=5` — sau 5 pass fail liên tiếp với input giống hệt
   thì bỏ qua các stage apt cho tới khi ledger/manifest đổi).
- Stderr của preflight đi ra **host journal, không có trong cell**
  (`journalctl` trong cell không có dòng preflight nào) — đó là lý do
  T5 đợt 134 không thấy text lỗi nào ở phía mình.
- Ledger helper `/opt/hatch/runtime-cell/os-intent-ledger.py` chỉ tính
  install/remove từ ledger — không phải driver apt (driver là
  preflight binary/script trên).

### 6.3 Apt-get 7121 trên boot cc1f9de0 — kẹp chính xác cửa sổ chết

Từ log watcher b87 (đợt 134), đọc lại độc lập đợt này:

| Poll b87 | Thời gian (Z) | apt-get pid | etime / %CPU | dpkg / installs | GST |
|---|---|---|---|---|---|
| 10 | 00:30:45 | 5302 | 00:00 / 90,9 | 53 / 8 | 0 |
| 11 | 00:31:45 | **7121** | 00:19 / 3,3 | 729 / 107 | 33 |
| 12–22 | 00:32:45–00:42:48 | **7121** | 01:19→11:22 / 0,8→0,1 | 729 / 107 (đóng băng) | 33 |
| 23 | 00:43:48 | 10685 (mới) | 00:25 / 2,2 | 869 / 127 | 120 |

- 7121 sống **~00:31:26Z → ~00:43:0xZ (~11,5–12 phút)**, etime tăng
  đều, %CPU suy giảm đơn điệu 3,3 → 0,1 — **bị chặn trên mạng
  (download chậm), không quay CPU, không kẹt cứng**.
- Suốt 7121 sống: dpkg đóng băng 729 dòng / 107 installs (dòng cuối
  00:31:25Z); GST đóng băng 33 file; cache .deb tăng 77M→84M trong
  lúc đó (T5 đợt 134 đo) — **nó ĐANG download, chưa tới dpkg**.
- 7121 biến mất giữa poll 22 (00:42:48Z) và poll 23 (00:43:48Z);
  apt-get mới 10685 bắt đầu ngay (~00:43:23Z) và cài tiếp (dpkg
  729→869, GST 33→120) — **wrapper coi như xong và chuyển sang gói
  tiếp theo**, đúng luật best-effort §6.2.
- **Không có entry history.log nào cho chính gói plugins-bad**
  (chỉ có transaction 00:31:05Z cài các dep của nó:
  libgstreamer-plugins-bad1.0-0, libgupnp…) — apt chỉ ghi history khi
  transaction tới được pha dpkg. **Đây là bằng chứng quyết định:
  7121 chết ở pha fetch, không phải pha install.**
- Sau 7121: replay cài tiếp tới 1730 dòng / 252 installs, kết thúc
  00:59:22Z, thiếu đúng plugins-bad; pass fail (failures=1) →
  receipt bị giữ → boot sau (78b55838) replay lại toàn bộ và cài
  được gói này (xem §6.4) — **cơ chế retry-next-boot đã hoạt động
  đúng thiết kế**.

### 6.4 Bằng chứng phụ từ boot 78b55838 — replay lần này không download gì

- `/var/log/apt/term.log` boot mới: **0 dòng `Get:`** — replay không
  download gói nào; cài plugins-bad từ cache bền vững
  (`.../52-gstreamer1.0-plugins-bad_1.24.2-1ubuntu4_amd64.deb`,
  3.081.180 byte). Log kết thúc 02:37:47Z.
- Cache `/var/cache/apt/archives/`: **156M, 178 .deb** (bền vững qua
  reboot — bind-mount từ host, xem `pre-start.sh` §300–326);
  `partial/` trống, mtime **00:59Z (thời cc1f9de0)** — boot mới không
  chạm partial/ → mọi .deb đã có sẵn từ boot trước.
- `history.log` boot mới: **50 transaction** `apt-get install` (mỗi
  gói/nhóm một invocation, cách nhau ~2 s — khớp vòng lặp
  per-package §6.2); plugins-bad cài trong transaction 02:37:00–
  02:37:03Z cùng ~50 gói khác (plugins-good, các lib…); deps của nó
  (libgstreamer-plugins-bad1.0-0…) cài 02:36:36Z.
- `ledger.jsonl` (`/var/lib/hatch/os-intent/`, mtime 01:34Z, ts trong
  file 01:12:15Z) **sống qua reboot** — đây là compaction SAU repair
  của T5 đợt 134 (repair cài plugins-bad xong 01:12:14Z → hook ghi
  ledger 01:12:15Z); danh sách "added" có plugins-bad VÌ T5 đã cài
  nó, không phải bằng chứng về lần skip. Ghi rõ để khỏi đọc nhầm.
- `dpkg-state.txt` (mtime 02:37Z) của boot mới ghi plugins-bad
  `install ok installed` — trạng thái cuối đúng.

### 6.5 Những gì vẫn mở + hàm ý

- **Vẫn mở:** lỗi apt chính xác của 7121 (text lỗi ở host journal,
  ngoài tầm cell). Muốn đóng hẳn cần đọc log preflight phía host —
  ngoài tầm luồng T5 (không có quyền host).
- **Không còn là "chưa xác định được" ở mức cơ chế:** đã biết CHẮC
  (a) vòng lặp per-package, (b) fail thì bỏ qua không retry trong
  lượt, (c) 7121 chết ở pha download, (d) retry xảy ra ở boot sau
  qua receipt-withheld. Nợ đợt 134 §11 nay **ĐÓNG PHẦN CƠ CHẾ**; chỉ
  còn mở phần "lỗi apt chính xác" (mức chi tiết, không ảnh hưởng
  verdict A2 hay vận hành watcher).
- **Hàm ý vận hành:** đây là hành vi best-effort CÓ CHỦ Ý (một gói
  fail không chặn cả replay; phục hồi ở boot sau) — không phải bug
  cần vá gấp. A2 watcher v6 vẫn cần: trong cùng một boot, thiếu 1 gói
  đích thì WebKit không đủ điều kiện cho tới khi có --repair hoặc
  boot sau. Nếu hình dạng này lặp lại ở boot sau (mỗi lần thiếu 1 gói
  khác nhau), T10 có thể xem xét báo host về chất lượng mirror — ngoài
  tầm T5.

## 7. Cờ gate-visible — tới kịp, T4 mở cửa 2 lần

- Cờ 78b55838 (02:45:13Z, poll 2) TỚI ĐƯỢC GATE: T4 poll #5 02:45:47Z
  đọc `t5flag=PASS`; poll #6 02:46:33Z (RAM 1031 MB) mở cửa lần 1 —
  nhưng poller T4 gọi nhầm `run-attempt-134.sh` → **exit 127, 0
  attempt chạy** (F-135-T4-1, T4 tự sửa trong 1 phút, khởi động lại
  poller); cửa mở lại poll #5 poller 2 (02:50:57Z, RAM 1632 MB) →
  **attempt1 chạy thành công** (20/20 pass, exit 0 02:54:45Z).
- Ghi chú về blockers=3 ở poll #5 poller 1 (02:45:47Z): T4 đoán "nhiều
  khả năng là watcher T5" — **KHÔNG ĐÚNG với b88: b88 đã exit
  02:45:13Z** (34 s trước poll đó), nên blocker không phải b88.
  Danh tính thật vẫn chưa xác định (T4 cũng ghi chưa xác định); T5
  không suy đoán thêm. Đề xuất đợt sau: log `ps` snapshot khi
  blockers>0 (đã có trong nợ T4 §10 mục 3).
- Cờ stale cc1f9de0 vẫn ở `round134-t5/` — không đụng, không mâu thuẫn
  cờ (T4 đọc đúng `round135-t5/POSTBOOT_PASS`).

## 8. PHA 2 — Lượt yên #12: CÓ DỮ LIỆU ĐẦY ĐỦ, P1–P5 + P7 ĐỀU DUNG

### 8.0 Dữ liệu đầu vào (đủ trigger pha 2 đầy đủ)

- Attempt1 T4: 20/20 pass, run-attempt exit 0 02:54:45Z, JSON
  `preview-b-f3-flip-webkit-t4-attempt1.json` **3.763.122 B, sha256
  `2efceefde7b26765a3c0a1466d715096ac453389c6d9170972fee708451b31df`**
  (T5 tự tính — khớp sha T4 công bố), flip afterPass=5 wallMs=25478,
  engine webkit 27.2, pageErrs=[].
- Labellag T4: `analyze-t4-attempt1-labellag.txt` (skp=0 (c2) n=7;
  skp=1 (c2) n=0).
- Script pha 2 `t5-c2-drawlog-analysis.py` (copy từ đợt 134, py_compile
  OK) chạy được ngay trên JSON đầy đủ — output
  `t5-c2-drawlog-analysis.txt` (exit 0). Rerun code T3
  `t3-step2-verify135.py` (đọc code, chạy lại độc lập — KHÔNG copy kết
  quả T3) — output `t5-histogram-rerun.txt` (exit 0).
- **Lưu ý về T4.done/T3:** lúc T5 đóng (03:11Z), `round135-t4.done`
  CHƯA xuất hiện (T4 đã viết LIMITS nhưng chưa ghi cờ done; không còn
  tiến trình T4 nào chạy) và T3 bước 2 chưa công bố verdict. Pha 2 của
  T5 đối chiếu với **LIMITS T4 đã đọc được** (§8.5) và với **rerun code
  T3** (§8.6) — không phụ thuộc vào file .done (JSON + labellag đã
  final từ 02:54:45Z). T10 kiểm lại .done khi nó xuất hiện; số liệu
  pha 2 không đổi theo .done.

### 8.1 Kết quả — tính độc lập bằng script riêng (khớp 100% với T4)

| Hạng mục | T5 tính lại (độc lập) | T4 công bố (LIMITS T4) | Đối chiếu |
|---|---|---|---|
| JSON sha256 | `2efceefde7b…` (3.763.122 B) | như vậy | **KHỚP** |
| flip | afterPass=5, wallMs=25478 | như vậy | **KHỚP** |
| blendTick / tickCost | n=557 / n=682, median **40,0 ms** | n=557 / n=682, median 40,0 | **KHỚP** |
| tickCost post (flip+2000) | n=501, median 40,0 | n=501, median 40,0 | **KHỚP** |
| c2DrawLog | n=1325, loopNo 1–22, 21 wrap, 1 epoch, wallMs 9256→77903 (span 68.647 ms) | y hệt | **KHỚP** |
| (c2) skp=0 | n=7, lag +1f toàn bộ: seq [166, 251, 305, 363, 448, 480, 534] | y hệt | **KHỚP** |
| (c2) skp=1 | n=0 | n=0 | **KHỚP** |
| coverage (c2) | 7/7 (delta −25…+31 ms) | 7/7 (delta −27…+31 ms) | **KHỚP, trừ tie-break seq 251 (§8.5)** |
| blendTick hậu-flip trong ±500 ms log | 412/412 (100%) | 412/412 (100%) | **KHỚP** |
| lag ≥+5f | 0 event | 0 event | **KHỚP** |
| histogram (m*−label) | {−11: 2, −9: 2, −1: 48, 0: 319, +1: 216, +2: 210, +3: 27} | y hệt (script T4) | **KHỚP** |
| skew | snap−label median 35,0 ms; raw−label median 8,0 ms | 35 ms / 8 ms | **KHỚP** |
| curPix run ≥3 tick | 15 run, 77/412 tick trong run | 15 run | **KHỚP** |

- Bổ sung của T5 so với T4: B2 cặp drawSrc→rawUnit `{0: 643}` (rawUnit
  luôn cùng frame với drawSrc gần nhất); B3 chi tiết từng loop
  (drawSrc n=32–37/loop, frameIdx 0→65..72, nhảy >1 frame 16–22/loop
  — mẫu nhảy frame đều, không có lui frame); B5 drawSrc gap median
  82,0 ms (min 39, max 678; >33 ms: 681/681; >66 ms: 567/681 — log
  thưa, xem caveat P7 §8.4); B-P7 chi tiết từng seq (entry gần n=20–30
  mỗi seq, lag chỉ −1/0).

### 8.2 Verdict từng dự báo P1–P7 (lượt #12)

- **P1: DUNG** — (c2) 7/7 trong ±1 tick của run-end (5 đúng cuối run,
  2 sau run-end 1 tick: seq 448, 480 dist +1); đối chứng: 45/412 tick
  post (10,9%) gần run-end; p nhị thức ≈ 1,9e-07 (rerun T3). Run-end
  là (c2): 5/15 run-end. Độ dài run kết thúc tại (c2): [4, 4, 4, 8, 8];
  run TB 5,1, max 8.
- **P2: DUNG** — 7/7 (c2) lag ≥ +1f (toàn +1f), 0 lag âm.
- **P3 (A1): DUNG** — đóng băng-tại-tick 7/7 [166, 251, 305, 363, 448,
  480, 534]; tick bắt kịp 0; đối chứng: 88/411 tick post (21,4%)
  đóng băng; p ≈ 2,1e-05.
- **P4: DUNG** — (c2) thuần +1f = 7 (dự báo 2–8); tổng skp=0 = 7
  (2–12); skp=1 = 0; lag ≥+5f = 0.
- **P5: DUNG** — snap−label median 35,0 ms (34–48); raw−label median
  8,0 ms (8–10); label-floor +1 **74,9%** (63–76 — xem ghi chú schema
  §8.3); run ≥3 tick = 15 (13–22). 4/4 tiêu chí con đều trong khoảng.
- **P6: KHÔNG VERDICT (theo thiết kế)** — khoảng thực nghiệm, tất cả
  trong khoảng: bin 0 = 38,7% (33–39); +1/+2 = 51,7% (33–53);
  +3 = 3,3% (3–19). Histogram n_ghost=824, nomatch=0.
- **P7: DUNG (làm yếu desync)** — coverage 7/7; tại 173 entry log
  trong ±500 ms của tick (c2): floor(ct*30)−frameIdx = {−1: 91, 0: 82}
  — **0 entry ≥+1** (drawSrc không trễ sau ct); chỉ drawSrc {−1: 46,
  0: 41}; cặp rawUnit−drawSrc {0: 86}. **Caveat (ghi rõ):** log draw
  thưa (drawSrc gap median 82 ms ≈ 2,5 frame) nên không phân giải
  được lệch 1 frame (33 ms) — P7 làm yếu giả thuyết desync, không
  loại trừ hoàn toàn lệch dưới 1 frame. Đây là giới hạn của phương
  pháp, không phải lỗi đo.
- **Verdict tổng lượt #12: ĐO ĐƯỢC, MỌI DỰ BÁO CÓ VERDICT ĐỀU DUNG
  (P1–P5, P7).** Prereg ghost-freeze/skew được củng cố thêm 7 event.
  **Ngưỡng ≤60 ms GIỮ NGUYÊN** (median 40,0 ms; chuỗi 10 lượt hợp lệ:
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 /
  **40,0**, trung bình 46,6 ms). **Cộng dồn: P1 21/21** (14/14 + 7/7),
  **P3 20/21** (13/14 + 7/7).

### 8.3 Ghi chú schema label-floor (F-135-T5-3)

- Script pha 2 của T5 tính `label-floor` bằng `g["label"]` — nhưng
  JSON đợt này không còn field `label` trong ghostPix (đổi thành
  `frame`: sample occ0 `{frame: 14, labelMs: 26794, labelCt:
  0.4895…, …}`) nên script in `label-floor: {}` (trống). **Đây là lỗi
  schema của script, không phải dữ liệu thiếu.**
- T5 tính lại bằng field đúng (`frame − floor(labelCt*30)`):
  **{0: 207, 1: 617} trên 824 occ → +1 = 74,9%** (occ0: {0: 111,
  1: 301} → 73,1%) — **khớp chính xác rerun T3** ({0: 207, 1: 617}).
  Script pha 2 cần sửa field `label` → `frame` cho đợt sau (T5
  không sửa giữa chừng — ghi nợ ở §12 mục 6).

### 8.4 Logger đã nới — KIỂM CHỨNG RUNTIME LẦN ĐẦU (hệ quả pha 2)

- c2DrawLog n=1325 phủ **loopNo 1–22** (loop 3–19 mỗi loop 62–72
  entry; loop 20: 1, loop 22: 1 — 2 entry biên tại wrap), **21 wrap**,
  1 epoch duy nhất, wallMs 9256→77903 (span 68.647 ms ≈ 22 vòng video
  3 s). Khác hẳn đợt 134 partial (chỉ toàn loop 1, 0 wrap) và logger
  cũ đợt 133 (byLoop chỉ {1:66, 2:71}).
- **Fix loop-gate nới + re-enable không xóa mảng (530e10a7) ĐÃ HOẠT
  ĐỘNG ĐÚNG Ở RUNTIME.** Điều kiện revert "sau khi đo" (quyết parent
  đợt 134 §12.3(a)) ĐÃ XẢY RA với kết quả tốt → **T5 đồng ý đề xuất
  GIỮ fix 530e10a7, không revert** (T4 cũng đề xuất GIỮ; quyết cuối
  thuộc parent).
- Lưu ý đọc đúng: log chứng minh logger GHI ĐƯỢC loop ≥3 + wrap, và
  P7 dùng được log để kiểm desync — nhưng log thưa (gap median 82 ms)
  nên P7 chỉ làm yếu desync, không chứng minh "không desync tuyệt
  đối" (xem caveat §8.2 P7).

### 8.5 Đối chiếu delta seq 251 — tie-break, không phải lệch số

- T4 (`analyze-t4-c2coverage.txt`): seq 251 tBlend=40899, log gần
  nhất 40872 (delta **−27 ms**).
- T5 (script riêng) + rerun T3: log gần nhất 40926 (delta **+27 ms**).
- Kiểm tra trực tiếp JSON: 2 entry log kẹp tBlend — 40872 (trước 27 ms)
  và 40926 (sau 27 ms) — **HÒA CHÍNH XÁC 27 ms cả 2 phía**. T4 chọn
  entry trước, T5/T3 chọn entry sau (bisect). **Cả 2 đều COVERED**
  (±500 ms); verdict P7 không đổi. Ghi rõ để khỏi đọc thành "T4 với
  T5 lệch 54 ms".

### 8.6 Đối chiếu với rerun code T3 (chạy lại độc lập, không copy)

- Chạy `t3-step2-verify135.py` (code T3 đợt 135) trên cùng JSON +
  cùng GT frames: **khớp 100% mọi số với T5** — sha256, flip, blendTick
  557/post 412, tickCost median 40,0 (post 501), histogram y hệt,
  skew 35/8 ms, label-floor {0: 207, 1: 617}, (c2) 7/7 + skp=1 0,
  P1 k=7/7 p=1,85e-07, P3 7/7 p=2,06e-05, P4/P5/P6/P7 y hệt.
- Verdict T3 bước 2 chưa công bố lúc T5 đóng (T3 đang chờ T4.done);
  nhưng vì mọi số đầu vào khớp 100% giữa 2 script độc lập (T5 + code
  T3), verdict T3 kỳ vọng khớp T5 trên mọi dự báo — nếu T3 công bố
  khác thì đó là khác biệt diễn giải, không phải khác biệt số.
- Đối chiếu T4: mọi số khớp (§8.1) + khớp verdict "lượt #12 đo được,
  median 40,0, ngưỡng giữ, logger kiểm chứng runtime". Không có số
  nào lệch giữa 3 lần tính độc lập (T4, T5, code T3).

## 9. Headroom inotify + RAM

### 9.1 Headroom (probe K8, trần 63747)

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 133 cuối (T5) | 2623 | boot 07da9c50 |
| Đợt 134 mở / cuối (T5) | 2506 / 2499 | boot d2e66749 / cc1f9de0 |
| **Đợt 135 mở (T5, boot 78b55838)** | **2393** | **headroom-open.txt** |
| **Đợt 135 cuối (T5, boot 78b55838)** | **2389** | **headroom-end.txt** |

- Giảm ~110 so với cuối đợt 134 (2499 → 2389). Chuỗi dài hạn:
  …2625 → 2623 → 2506 → 2499 → **2393 → 2389**. Vẫn gấp ~1,5 lần số
  watch vite thường cần (~1586). **Vite thường chạy được. Chưa tới
  ngưỡng báo user (< ~1.800) — chỉ theo dõi** (còn ~589). Trần 63747
  cần can thiệp host — ngoài tầm luồng này.

### 9.2 RAM khả dụng (tổng 7934 MB, swap 1023 MB)

- Phiên T5 (02:41Z–03:11Z): **905–1485 MB** (tự đo); poll log T4 cùng
  cửa sổ: 831–1643 MB (min 1208 MB giữa lượt theo class-B).
- Các mốc T5: mở đợt 905 MB (02:41:48Z) → 1415 MB (watcher poll 1,
  02:44:13Z) → 1450 MB (02:44:37Z) → 1244 MB (02:45:18Z) → 1073 MB
  (đóng 03:11:53Z). RAM ≥1024 MB xuất hiện nhiều lần và lần này
  **đồng thời với postboot PASS** → cửa yên mở được (khác đợt 134).
  Birefnet không thử (mọi số đều < 6 GB guard).

## 10. Fix instrumentation T3 — trạng thái cuối (T5 chỉ ghi nhận, không sửa)

- preview.tsx md5 cuối: **530e10a7** (fix còn nguyên; T5 kiểm lúc mở
  02:41:48Z và lúc đóng 03:11:53Z đều 530e10a7). media.ts `2c384ed1`,
  vite.config.ts `ee80d093` — KHÔNG ĐỔI (theo LIMITS T4 §0; T5 không
  đụng các file này).
- T4 (LIMITS T4 §10 mục 1) + T5 (§8.4) đều đề xuất **GIỮ fix cho đợt
  136 trở đi** (điều kiện revert "sau khi đo" đã xảy ra với kết quả
  tốt; bản gốc 805409f0 vẫn còn nguyên tại
  `round134-t3/preview.tsx.orig-805409f0` nên revert sau vẫn làm được
  trong 1 bước nếu parent đổi ý). **Quyết cuối thuộc về parent** —
  T10 ghi vào §12 LIMITS gộp.
- preview.tsx KHÔNG nằm trong stage file của T5 (việc của T3).

## 11. R9 (a) vẫn mở (ghi nhận, nhắc lần 16)

- Cron chạy watcher v2 ở đầu mỗi lượt với `--wait-new-boot` để bắt
  reboot giữa lượt — parent KHÔNG PHÊ DUYỆT ở đợt 117 §13 Quyết 9
  (thay đổi thân cron, cần user đồng ý; đã đưa ra hỏi user lúc đóng
  đợt 117, chưa trả lời). T5 KHÔNG tự đổi thân cron.
- Đợt 135 là bằng chứng ngược: **0 reboot giữa lượt** — watcher b88
  chỉ cần 2 poll là xong; R9 (a) không ảnh hưởng đợt này. Nhưng 4
  reboot đợt 134 vẫn là bằng chứng R9 (a) có giá trị khi reboot dồn
  dập; không có cơ sở rút lại đề xuất.
- **Nhắc lần 16.** (Đợt 134 là lần 16; T5 đợt 134 viết 17 đã bị đính
  chính — số đếm VẪN LÀ 16, không tăng.)

## 12. Nợ mở sang đợt sau

1. **GIỮ fix 530e10a7** — chờ quyết parent (T10 ghi §12 gộp). T4 +
   T5 đều đề xuất GIỮ (logger đã kiểm chứng runtime: loop 1–22,
   21 wrap, coverage 7/7).
2. **Lượt yên #13** — đo tiếp với logger đã nới trên boot 78b55838
   nếu còn sống (postboot đã PASS, cờ 02:45:13Z còn hiệu lực cho boot
   này — kiểm boot_id/btime khớp trước khi dùng) hoặc boot mới.
   Cộng dồn hiện tại: **P1 21/21, P3 20/21**; ngưỡng ≤60 ms GIỮ.
3. **Nợ đợt 134 §11: ĐÓNG PHẦN CƠ CHẾ** (§6) — chỉ còn mở phần "lỗi
   apt chính xác của 7121" (cần log preflight phía host; ngoài tầm
   cell). Nếu replay boot sau lại bỏ qua 1 gói khác, A2 bắt tiếp theo
   cùng luật; T10 có thể xem xét báo host về chất lượng mirror.
4. **Sửa schema label-floor trong script pha 2 của T5** (F-135-T5-3):
   field ghostPix `label` → `frame` (JSON đợt 135 dùng `frame`).
5. **F-135-T4-1 (poller gọi nhầm run-attempt-134.sh):** đợt sau adapt
   script phải grep toàn bộ chuỗi số đợt cũ + `ls` file được gọi tới
   trước khi mở poller (T4 đã ghi nợ; T5 chỉ nhắc lại).
6. **Blockers=3 ở poll #5 poller 1 T4 chưa xác định danh tính** —
   đã loại trừ watcher b88 (exit 02:45:13Z, trước poll 02:45:47Z);
   đợt sau log `ps` snapshot khi blockers>0.
7. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 134 §12: mù #54 mới
   (việc T2); G1 chờ user quyết; birefnet (chỉ thử lại khi quan sát
   được available ≥ 6 GB, u2net là fallback chính thức);
   ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate
   không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 13. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`); `apps/web/vite.config.ts`:
  KHÔNG đổi (`ee80d093`).
- `apps/web/scripts/vcut-webkit-postboot-check.sh`: sửa 1 lần
  (header + dòng `say`; md5 `b568049b…` → `7f4d3d02…`; không đổi logic).
- Watcher v6 trong hidden_files (KHÔNG stage): b88 (`5c83b9b6…`,
  2 poll, cờ 78b55838 02:45:13Z); `bash -n` OK.
- `vcut-vite-lock.sh` / `vcut-vite-lock-v2.sh` KHÔNG sửa. T5 chỉ đọc
  kiểm đĩa, không đụng lock/queue của luồng khác.
- `tsc` / `vite build`: KHÔNG chạy (không sửa production; tsc 0 +
  vite build PASS là của T3 lúc sửa preview.tsx).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (RAM 905–1485 MB
  < 6 GB).
- Postboot: boot 78b55838 PASS 3/3 (poll0 + watcher 2 poll).
  **--repair: 0 lần** (không cần — replay đủ). **TRIGGER: 0 lần**
  (A2/(B)/(C) đều NO — đúng vì PASS).
- **§8.2 dạng (B) ngưỡng 10': ĐÁNH GIÁ MỖI POLL. TRIGGER=YES: 0.**
  **Luật (C): ĐÁNH GIÁ MỖI POLL, KHÔNG KÍCH HOẠT lần nào.**
- **Widen trigger A2: KHÔNG KÍCH HOẠT đợt này (đúng — không có hình
  dạng thiếu gói).** Trạng thái: "A2 đã kích hoạt live đợt 134
  (plugins-bad)" giữ nguyên.
- Headroom: 2393 (mở) → 2389 (cuối).
- RAM phiên T5: 905–1485 MB (tự đo); min 831 MB theo sampler T4.
- Stale vite.lock: không có (không kiểm lock dir đợt này — ghi rõ:
  T5 không đụng lock/queue; T6 kiểm lockhealth).
- **Pha 2 (c2): CÓ DỮ LIỆU ĐẦY ĐỦ — P1–P5, P7 ĐỀU DUNG; P6 trong
  khoảng thực nghiệm (không verdict).** Lượt #12 hợp lệ (median
  tickCost 40,0 ms ≤ 60 ms). Cộng dồn P1 21/21, P3 20/21. Ngưỡng
  ≤60 ms GIỮ.
- **Reboot GIỮA LUỘT: 0 lần** (boot 78b55838 xuyên suốt phiên T5).
- **Nợ đợt 134 §11: ĐÓNG PHẦN CƠ CHẾ** (xem §6).

## 14. Sai số của T5 đợt này (F-135-T5-N)

- **F-135-T5-1 — Đọc nhầm pgrep tự khớp thành "probe còn chạy":**
  3 lần kiểm 02:56–03:00Z, `pgrep -f 'probe121t3'` trả về PID của
  chính shell exec của T5 (mẫu xuất hiện trong command line của shell
  đó) — T5 đọc thành "probe đang chạy" trong khi probe đã xong từ
  02:54:45Z (run-attempt exit 0). Cùng bẫy đã ghi ở đợt 134 §2.1
  (os-intent) mà T5 vẫn mắc lại ở mẫu khác. Hậu quả: chỉ chờ thêm
  ~5 phút vô ích, không ảnh hưởng số liệu (không hành động nào dựa
  trên đọc nhầm này). Bài học: luôn dùng mẫu có ngoặc `[-]` khi
  pgrep -f (`probe121t3[^]]` hoặc tương đương).
- **F-135-T5-2 — Lệnh khởi động watcher bị ngắt giữa chừng:**
  exec chạy watcher + headroom + RAM bị runtime ngắt do output-drain
  timeout sau khi watcher đã chạy — 2 lệnh `tee` cuối (headroom-open,
  ram-open) không kịp chạy, file không được tạo trong lệnh đó. T5
  chạy lại riêng ngay sau (headroom 2393, RAM 1244 MB lúc 02:45:18Z)
  — không mất dữ liệu. Ghi rõ để khỏi thắc mắc sao 2 file có mtime
  muộn hơn watcher.
- **F-135-T5-3 — Script pha 2 sai field label-floor:** xem §8.3
  (`g["label"]` không còn tồn tại; field đúng là `g["frame"]`).
  T5 tính lại riêng, khớp rerun T3 chính xác. Script cần sửa cho đợt
  sau; không sửa giữa chừng đợt này.
- **F-135-T5-4 — Snippet kiểm tra inline crash TypeError:** lệnh
  python kiểm tra nhanh JSON dùng `len(d.get('passes'))` trong khi
  `passes` là int (20), không phải list — crash ở dòng cuối snippet,
  các số trước đó vẫn đúng (đã kiểm lại bằng script chính). Chỉ là
  snippet tay của T5, không ảnh hưởng phân tích.
- **F-135-T5-5 (ghi chú, không phải lỗi T5) — T4.done chưa xuất hiện
  lúc T5 đóng (03:11Z):** T4 đã viết LIMITS (~03:05Z) nhưng chưa ghi
  cờ `round135-t4.done`; không còn tiến trình T4 nào chạy. Pha 2 của
  T5 đối chiếu với LIMITS T4 (đã đọc) chứ không chờ .done — số liệu
  không phụ thuộc .done. T10 kiểm lại .done khi nó xuất hiện.

## 15. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  header + dòng `say` cho boot 78b55838; md5 cuối `7f4d3d02…`;
  không đổi logic).
- `docs/PHASE9_ROUND135_T5_INFRA_LIMITS.md` (file này — mới; pha 1
  postboot boot mới + điều tra nợ §11 + pha 2 lượt #12).
- Harness trong hidden_files (KHÔNG stage): `round135-t5/`
  (t5-start.txt, headroom-open/end.txt (2393/2389),
  ram-open/end.txt, postboot-check.md5.before/after, watcher.md5.before,
  t5-postboot-poll0.log, t5-postboot-b88-poll1.log,
  `POSTBOOT_PASS` (cờ gate-visible — boot 78b55838, PASS 02:45:13Z
  poll 2), `t5-wait-replay-b88.sh` + `.log` + `.nohup.log`,
  `t5-c2-drawlog-analysis.py` + `t5-c2-drawlog-analysis.txt`
  (pha 2 lượt #12, khớp 100% T4),
  `t5-partial-drawlog-check.py` (copy từ đợt 134, không cần dùng đợt
  này — JSON đầy đủ), `t5-c2-input.sha256` (2efceefde7b…),
  `t5-histogram-rerun.txt` (rerun code T3, khớp 100% T5)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round135-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round135-t5.done` (ghi rõ: postboot boot
  78b55838 PASS cờ 02:45:13Z poll 2, A2 không kích hoạt (đúng);
  nợ §11 đóng phần cơ chế; pha 2 lượt #12 P1–P5 + P7 DUNG, cộng dồn
  P1 21/21, P3 20/21; logger nới kiểm chứng runtime, đề xuất GIỮ fix).

```bash
# Kiểm tra WebKit sau reboot (không sửa gì):
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh
# Có sửa + launch test:
bash ~/workspace/repo-1/apps/web/scripts/vcut-webkit-postboot-check.sh --repair --launch-test
# Đo headroom inotify:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k8/k8-headroom.py
# Pha 2 (c2) — chạy lại phân tích log draw khi có JSON attempt ĐẦY ĐỦ + labellag T4:
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round135-t5/t5-c2-drawlog-analysis.py <json-t4-day-du> <labellag-t4.txt> <out.txt>
# Pha 2 (han che) — kiểm tra JSON partial (flip chua toi):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round135-t5/t5-partial-drawlog-check.py <json-partial> <out.txt>
# Histogram #12 bằng code T3 (khi có JSON đầy đủ; không sửa script T3):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round135-t3/t3-step2-verify135.py <json-t4-day-du> <out.txt>
# Bật (c2) log draw (harness, trong browser console):
window.__vcutC2DrawLog = true
# Đọc entries (sau 2 vòng loop quanh wrap):
window.__vcutC2DrawLogEntries
```

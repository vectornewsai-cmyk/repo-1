# PHASE9_ROUND147_T5_INFRA_LIMITS — BOOT 6fb582df (#110? chặt) REPLAY CHẠY TỐT (1545/221, +2m56s — VẪN KỶ LỤC) → postboot PASS poll=2 + poll2, CỜ MỚI 14:41:57Z → T4-147 ĐO LẠI LƯỢT YÊN #21 BẰNG CỜ NÀY → KHÔNG REBOOT MỚI TRONG PHIÊN → SAMPLER n=40 ĐẦY ĐỦ, 0 MẪU ≥ GUARD → HEADROOM MỞ 669 / CUỐI 661 (DƯỚI NGƯỠNG LẦN 7 LIÊN TIẾP, CHỈ THEO DÕI)

> Luồng T5, đợt 147, lượt cron 21:35 +07 19/11/2026 (mở 14:35:51Z;
> T5 mở thực tế 14:39:46Z, t5-start 14:41:20Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **BOOT 6fb582df** (btime 12:13:26Z — **KHỚP brief + khớp
> T2-147/T6-147**; #110? theo đếm chặt, quyết parent (g) đợt 146).
> Boot này đã được T5-146 kiểm đầy đủ sau reboot #34; đợt này T5
> kiểm LẠI trên cùng boot (replay + postboot + sampler mới).
> Boot replay **CHẠY TỐT, XONG HẲN**: 1545 dòng / 221 installs /
> 462 configure, gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**,
> md5 `d2b2e788…` **KHỚP Y HỆT file đóng băng đợt 146** (không đổi
> một byte). **KHÔNG cần --repair.** Postboot PASS poll0 +
> poll1 + poll2; cờ `POSTBOOT_PASS` mới ghi 14:41:57Z poll=2 —
> **T4-147 đo lại lượt yên #21 bằng cờ này** (quyết parent (h)
> đợt 146). **KHÔNG CÓ REBOOT MỚI trong phiên T5** (boot vẫn
> 6fb582df lúc đóng 15:22:12Z, tuổi boot 3h08m46s = 11.326 s) —
> không mở mù #67. **Tuổi thọ boot 98a7c93f = 8.363 s XÁC NHẬN
> ĐỘC LẬP LẦN 2** (trừ datetime + trừ epoch, cả hai ra 8.363 s;
> T2-147 đã chứng nhận gap [8.353, 8.373] s → CERT 66 / FULL 81).
> **Sampler n=40 ĐẦY ĐỦ: 0 mẫu ≥ guard** (max 2.724.360 kB =
> 43,3% guard), balloon 0 mẫu ghim trần — cửa sổ guard đợt 146
> KHÔNG tái mở trong phiên này; tự động hóa birefnet của T9
> (quyết (l) phương án (a)) chưa có cửa sổ thật để kích hoạt đợt
> này. **HEADROOM MỞ 669 → CUỐI 661 (DƯỚI NGƯỠNG LẦN 7 LIÊN
> TIẾP, CHỈ THEO DÕI; cap probe 30.000 áp dụng lần đầu theo quyết
> (m) đợt 146).** **WFS scan: KHÔNG chạy đợt này** (không thuộc
> brief T5-147; T2-147 đã chạy WFS #53 chênh 0). **KHÔNG push.
> KHÔNG release/tag. KHÔNG sửa production** (preview.tsx giữ
> 530e10a7; postboot script KHÔNG sửa đợt này — xem §3.8).
> **KHÔNG tự chạy birefnet** (thuộc T9). KHÔNG đụng file workflow
> (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 6fb582df (#110? chặt, btime 12:13:26Z): REPLAY CHẠY TỐT,
   ĐÃ XONG TỪ ĐỢT 146.** dpkg.log **1545 dòng / 221 installs /
   462 configure**, md5 `d2b2e788…` (khớp file đóng băng đợt 146,
   không đổi tới lúc đóng 15:22:12Z), mtime 12:16:22Z (boot
   +2m56s — **vẫn là replay NHANH NHẤT từ trước tới nay**),
   gói cuối gstreamer1.0-tools **1.24.2-1ubuntu0.2**; bracket
   replay (configure 12:14:03Z boot +37s → xong 12:16:22Z boot
   +2m56s). Cache apt **178 .deb / 156M** (sống qua reboot #34,
   y hệt đợt 146). Lists **71** (2 mirror — như đợt 145/146
   boot 2). GST hệ thống là **thư mục thật 269/269**;
   /var/log/apt có (50 Start-Date, 12:14:46–12:16:22Z).
   Postboot **PASS poll0 (14:41:52Z) + poll1 (14:42:04Z) +
   poll2 (15:22:12Z)**.
2. **CỜ POSTBOOT_PASS mới ghi 14:41:57Z poll=2**
   (`boot_id=6fb582df-455d-47cd-99dc-8bef48018536 btime=
   2026-11-19T12:13:26Z pass_at=2026-11-19T14:41:57Z poll=2
   repair=none/replay-full dpkg=1545/221`) — cờ này là cờ
   **đợt 147** (cờ đợt 146 cho cùng boot vẫn còn trong
   round146-t5/POSTBOOT_PASS, pass_at 12:17:25Z; T5-147 ghi cờ
   mới để T4-147 đọc đúng lượt này). T4-147 đo lại lượt yên #21
   bằng cờ này (quyết parent (h) đợt 146); T5 không kiểm poller
   T4 đợt này.
3. **TUỔI THỌ BOOT 98a7c93f = 8.363 s — XÁC NHẬN ĐỘC LẬP LẦN 2
   (xem §2.1).** Hai cách tính độc lập đều ra 8.363 s: (i) trừ
   datetime 09:54:03Z → 12:13:26Z = 2h19m23s; (ii) trừ epoch
   btime 1795090406 − 1795082043 = 8.363. Khớp T5-146/T9-146/
   T10-146 + T2-147 (gap chứng nhận [8.353, 8.373] s → CERT 66 /
   FULL 81). Số 7.963 s của T7-146 là sai (quyết parent (q)
   đợt 146; giao T7-147 đối chiếu lại mốc neo — việc của T7).
4. **KHÔNG CÓ REBOOT MỚI trong phiên T5.** Boot vẫn 6fb582df
   từ lúc mở (14:39:46Z) tới lúc đóng (15:22:12Z); uptime -s
   vẫn 12:13:26Z; không mở mù #67 (T2-147 cũng ghi không có
   reboot mới). Boot 6fb582df sống **3h08m46s = 11.326 s** lúc
   T5 đóng — đã vượt tuổi thọ boot 98a7c93f (8.363 s).
5. **SAMPLER RAM — 1 SERIES n=40 ĐẦY ĐỦ (xem §5).** Avail
   312.140–2.724.360 kB (mean 910.780), gate A **14/40**,
   max **2.660,5 MiB = 43,3% guard**, **0 mẫu ≥ guard**;
   balloon 4.068.524–6.100.180 kB (mean 5.449.821), **0 mẫu
   ghim trần 6.443.824 kB**. Hình dạng: avail vọt đỉnh sớm
   (14:46:20Z) rồi rơi gần như đơn điệu về ~312k; balloon
   phình đơn điệu 4,07M → 6,10M nhưng **chưa chạm trần**
   (thiếu 343.644 kB). Cửa sổ guard đợt 146 (11:51–11:53Z)
   KHÔNG tái mở; T5 KHÔNG tự chạy birefnet; tự động hóa (a)
   của T9 chưa có cửa sổ thật để kích hoạt đợt này.
6. **HEADROOM inotify MỞ 669 → CUỐI 661 (boot 6fb582df, trần
   63747)** — xem §6.1. Cả hai đều **DƯỚI ngưỡng báo user
   (< ~1.800), lần thứ 7 liên tiếp**; tỉ lệ/vite ~0,42.
   Trần **63747 — KHÔNG đổi** so với boot 2 đợt 146 (flip-flop
   63747 → 63756 → 63747 dừng ở 63747 hai lần đo liên tiếp trên
   cùng boot). Theo quyết parent (k) đợt 144 + (m) đợt 146:
   **chỉ theo dõi, không báo riêng**. Cap probe **30.000**
   áp dụng lần đầu đợt này (quyết (m) đợt 146) — headroom
   ~670 nên cap không ảnh hưởng kết quả. Caveat: fd
   cell-visible biến động 358 → 332 → 600 trong phiên (xem
   F-147-T5-2).
7. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
    **2c384ed1**, vite.config.ts **ee80d093** (mở = lúc đóng);
    postboot script **6e20b0ed…** (KHÔNG sửa đợt này — xem
    §3.8).
8. **EPERM (T2-147, T5 chỉ đối chiếu): probe #66 ok=2 fail=0,
    boot=6fb582df, 14:41:45Z**; log probe 187 → **190 dòng (+3
    đúng prereg: DEAD + boot-changed + #66)**. **Mù #66 ĐÓNG
    HOÀN TOÀN (T2-147)** — chuỗi đóng hoàn toàn lên 2; T5
    không phán mù. **WFS scan: T5 KHÔNG chạy đợt này**
    (không thuộc brief; T2-147 đã chạy WFS #53 chênh 0 —
    lần 53 liên tiếp).
9. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
    — đúng như quyết parent §12.3(h) đợt 137.
10. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
    G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 1 boot trong phiên (không reboot mới)

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 6fb582df (#110? chặt — đếm chặt, quyết parent (g) đợt 146) | 12:13:26 (uptime -s; /proc/stat btime 1795090406; /proc/1 12:13:42 +16s đợt 146) | còn sống (lúc T5 đóng 3h08m46s = 11.326 s) | Replay CHẠY TỐT, xong boot +2m56s (1545/221, gói cuối tools 0.2) — VẪN KỶ LỤC NHANH NHẤT; postboot PASS poll0+poll1+poll2; cờ mới 14:41:57Z poll=2; T4-147 đo lại lượt yên #21 bằng cờ này; KHÔNG cần repair; sampler n=40 đầy đủ; balloon chưa chạm trần; KHÔNG reboot mới trong phiên |

- **Btime KHỚP brief** (12:13:26Z, 3 nguồn đợt 146 + khớp
  T2-147/T6-147: btime_epoch 1795090406; T2-147 boot-verify
  riêng). **KHÔNG có reboot mới**: boot_id kiểm 4 lần trong
  phiên (mở 14:39:58Z, 14:42:04Z, 14:42:40Z, đóng 15:22:12Z)
  đều là 6fb582df-455d-47cd-99dc-8bef48018536.
- Đánh số theo **đếm chặt**: 6fb582df = #110?. Chuỗi INSIDE:
  T5 không tự đếm (việc T2/T6); T2-147 xác nhận chính thức
  chuỗi INSIDE lên **6** (6fb582df INSIDE dải FULL80 #110?).

### 2.1 Tuổi thọ boot 98a7c93f = 8.363 s — xác nhận độc lập lần 2

| Cách tính | Phép tính | Kết quả |
|---|---|---|
| (i) Trừ datetime (btime) | 2026-11-19T12:13:26Z − 2026-11-19T09:54:03Z | **8.363 s = 2h19m23s** |
| (ii) Trừ epoch btime | 1795090406 − 1795082043 | **8.363 s** |
| Đối chiếu | T5-146 / T9-146 / T10-146 | 8.363 s — KHỚP |
| Đối chiếu | T2-147 (gap chứng nhận, không điều kiện) | [8.353, 8.373] s → CERT 66 / FULL 81 — KHỚP |
| Số bị bác | T7-146 | 7.963 s — SAI (quyết parent (q) đợt 146) |

- Hai cách tính của T5-147 độc lập nhau (datetime wall-clock
  vs epoch /proc/stat) nhưng cùng ra 8.363 s — không còn nghi
  ngờ số học. T5-147 KHÔNG đối chiếu mốc neo của T7 (việc
  T7-147 theo quyết (q)).

## 3. dpkg replay — CHẠY TỐT, KHÔNG cần repair; thực hành B4 (a)+(b)

### 3.1 Replay boot 6fb582df — kiểm LẠI trên cùng boot (đã xong từ đợt 146)

| Hạng mục | Lúc mở (14:39–14:42Z) | Lúc đóng (15:22Z) |
|---|---|---|
| dpkg.log dòng | 1545 | 1545 (không đổi) |
| `status installed` | 221 | 221 |
| dòng chứa `configure` | 462 | 462 |
| dpkg.log md5 | `d2b2e788…` | `d2b2e788…` (không đổi) |
| dpkg.log mtime | 12:16:22Z (boot +2m56s) | 12:16:22Z (không đổi) |
| startup configure đầu | 12:14:03Z (boot +37s) | — |
| cài thật | 12:14:46–12:16:22Z (install đầu libaspell15 12:14:46Z) | — |
| gói cuối | gstreamer1.0-tools 1.24.2-1ubuntu0.2 (12:16:22Z) | — |
| cache apt | 178 .deb / 156M | 178 .deb / 156M |
| lists / partial | 71 / 0 | 71 / 0 |
| GST hệ thống / debroot | thư mục THẬT 269 file / 269 | 269 / 269 |
| /var/log/apt | có (history.log 50 Start-Date, 12:14:46–12:16:22Z) | 50 Start-Date |
| proc apt/dpkg/wrapper | 0 | 0 |
| postboot check | PASS poll0 (14:41:52Z) + poll1 (14:42:04Z) | + poll2 (15:22:12Z) |

- Bracket replay: **(boot +37s, boot +2m56s]** — **VẪN LÀ
  NHANH NHẤT từ trước tới nay** (kỷ lục cũ #96? +3m52s; boot
  này nhanh hơn 56 s). Đây là lần kiểm thứ hai trên cùng boot
  (T5-146 đã kiểm lúc 12:14–12:17Z) — mọi số liệu **trùng
  khớp tuyệt đối**, dpkg.log không đổi một byte sau ~3 giờ.
- **KHÔNG cần watcher** (replay đã xong từ đợt 146),
  **KHÔNG kích hoạt luật (C)**, **KHÔNG chạy --repair**.
- Số liệu **TRÙNG bracket replay đầy đủ chuẩn** (1545/221/462).
  Đây là replay đầy đủ thứ 6 liên tiếp (691a7403, cc222c8a,
  e146ca67, 98a7c93f, 6fb582df — 6fb582df đếm 1 lần dù kiểm 2
  đợt) sau 3 lần chết dạng (B) trong 4 đợt gần nhất.

### 3.2 Cờ POSTBOOT_PASS (đợt 147 — cờ mới cho cùng boot)

| Boot | Cờ ghi (Z) | poll | Nội dung |
|---|---|---|---|
| 6fb582df | 14:41:57 | 2 | `boot_id=6fb582df-455d-47cd-99dc-8bef48018536 btime=2026-11-19T12:13:26Z pass_at=2026-11-19T14:41:57Z poll=2 repair=none/replay-full dpkg=1545/221` |

- Cờ ghi sau 2 poll PASS (poll0 14:41:52Z + poll1 14:42:04Z),
  theo đúng mẫu các đợt. Poll2 chạy lúc đóng (15:22:12Z,
  exit 0) — cờ đứng vững qua cả 3 poll. Cờ đợt 146 cho cùng
  boot (pass_at 12:17:25Z) vẫn còn nguyên trong round146-t5/;
  T5-147 KHÔNG ghi đè file đó — cờ mới nằm trong round147-t5/.
- **Caveat (F-147-T5-1):** pass_at 14:41:57Z là thời điểm
  *bắt đầu* poll1 (lệnh poll1 khởi động sau sleep 5 s từ
  14:41:52Z, kết thúc 14:42:04Z) — không phải thời điểm poll1
  xong. Mẫu các đợt trước cũng ghi pass_at ≈ thời điểm poll1;
  T5 ghi rõ để T4/T10 không đọc sai.
- T4-147 đo lại lượt yên #21 bằng cờ này (quyết parent (h)
  đợt 146) — T5 không kiểm poller T4 đợt này; T10 đối chiếu
  khi gộp.

### 3.3 So sánh replay các đợt gần nhất (bracket đầy đủ)

| Boot | Đợt | Bracket (configure → xong) | Gói cuối |
|---|---|---|---|
| 17db9652 (#94?) | 137 boot 2 / 138 | +49s → +6m05s | tools 1ubuntu0.1 |
| 541524e2 (#96?) | 139 | +31s → +3m52s | tools 1ubuntu0.1 |
| 2c0efe57 | 141 | +31s → +3m57s | tools 1ubuntu0.1 |
| 691a7403 (#106?) | 144 boot 1 | +34s → +4m53s | tools **1ubuntu0.2** |
| cc222c8a (#107?) | 144 boot 2 | +48s → +4m15s | tools **1ubuntu0.2** |
| e146ca67 (#108?) | 145 | +43s → +3m53s | tools **1ubuntu0.2** |
| 98a7c93f (#109?) | 146 | +44s → +4m14s | tools **1ubuntu0.2** |
| 6fb582df (#110?) | 146 boot 2 / **147 kiểm lại** | +37s → **+2m56s** | tools **1ubuntu0.2** |

- Boot 6fb582df **giữ kỷ lục replay nhanh nhất** (+2m56s),
  kiểm lại đợt 147 khớp tuyệt đối với đợt 146.
- Gstreamer tools **1.24.2-1ubuntu0.2** lần thứ 6 liên tiếp
  theo boot (691a7403 → 6fb582df); thread "3 phiên bản" vẫn
  đóng (xem §3.6 đợt 146 — T5-147 không kiểm lại madison đợt
  này vì không có dữ kiện mới; dpkg.log không đổi nên không
  có gì để kiểm lại).

### 3.4 Cache + lists

- **Cache 178 .deb / 156M (y hệt đợt 146).** Sống qua reboot
  #34, không đổi sau ~3 giờ. F-141-T5-4 giữ nguyên: sống/không
  sống là KHÔNG NHẤT QUÁN giữa các đợt (đợt 142/143: 0 .deb;
  đợt 139/145/146/147: 178).
- **Lists 71 / partial 0** (2 mirror — như đợt 145 và boot 2
  đợt 146). Không đổi trong phiên.

### 3.5 Gstreamer — KHÔNG kiểm lại (dpkg.log không đổi)

- dpkg.log boot 6fb582df md5 `d2b2e788…` khớp tuyệt đối file
  đóng băng đợt 146 — mọi dòng gstreamer/fontconfig đã được
  đối chiếu ở §3.9 đợt 146 (tools 0.2; gl/base/x 1.24.2-
  1ubuntu0.7; bad 1.24.2-1ubuntu4; good 1.24.2-1ubuntu1.8;
  libav/ugly 1.24.1-1build1; fontconfig 1.1ubuntu2
  triggers-pending 12:15:18Z, 1m04s trước dòng gói cuối).
  T5-147 không chạy lại madison (không có dữ kiện mới để đối
  chiếu; thread "3 phiên bản" vẫn đóng).

### 3.6 Thực hành đối chiếu B4 theo (a)+(b) — quyết parent (h) đợt 145

> Đợt 147 KHÔNG có cửa sổ B4 nào được giao cho T5 đối chiếu
> (T4-147 đang đo lại lượt yên #21; cửa sổ attempt của T4-147
> thuộc T4/T10 đối chiếu lúc đóng). Thực hành đợt này:

| Bằng chứng | Nội dung | Sức nặng |
|---|---|---|
| (a) dpkg.log boot 6fb582df — file đóng băng đợt 146 RE-VERIFY | `dpkg-frozen-6fb582df.txt` (frozen 12:17:46Z đợt 146): md5 `d2b2e788…` **khớp y hệt dpkg.log live lúc mở (14:39Z) và lúc đóng (15:22Z)** — file đóng băng vẫn là bằng chứng thay thế đáng tin cho mọi đối chiếu kiểu B4 trên boot này | **SẴN SÀNG** — không cần đóng băng lại (đóng băng mới sẽ trùng nội dung) |
| (b) ps exact-comm lúc mở (14:42Z) | `pgrep -x apt-get` = 0, `pgrep -x dpkg` = 0, exact-comm apt-get/dpkg/unattended-upgrade = 0 trong `ps -eo comm` | **DEMO ĐÚNG PHƯƠNG PHÁP** — cùng phương pháp T4-144 §6.1; không dùng grep chuỗi con (bài học F-146-T5-1) |
| (c) history.log live | 50 Start-Date, TẤT CẢ trong 12:14:46–12:16:22Z (replay boot 6fb582df); **0 entry boot cũ** | **TÁI XÁC NHẬN F-145-T5-1** lần thứ 3 (reset mỗi reboot) |

### 3.7 Postboot script — KHÔNG sửa đợt này

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
**`6e20b0ed…`** (mở = lúc đóng; bằng cuối đợt 146).

- Dòng `say` trong script vẫn ghi DOT 146 / boot 6fb582df /
  reboot #34 / replay +2m56s / B4 (a)+(b) / headroom mở
  879/880 — **mọi dữ kiện trong dòng đó vẫn đúng cho boot
  hiện tại** (cùng boot, cùng replay, cùng B4). T5-147 quyết
  định KHÔNG sửa dòng `say` chỉ để đổi số đợt (146 → 147):
  sửa file repo mà không đổi dữ kiện thật là nhiễu stage
  không cần thiết; poll0/poll1/poll2 đều chạy đúng với script
  hiện tại. `bash -n` không cần chạy lại (không sửa gì).
- Hệ quả stage: đợt này T5 chỉ stage **1 file** (LIMITS này)
  — postboot script KHÔNG đổi nên không có trong paths file.

## 4. Kiểm cây — md5 4 file lúc mở / lúc đóng

| File | Lúc mở 14:39Z | Lúc đóng 15:22Z | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 6e20b0ed… | 6e20b0ed… | KHÔNG ĐỔI ✓ (không sửa đợt này) |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH
  VIỄN làm instrumentation theo quyết parent đợt 137 §12.3(a).
  T5 KHÔNG đụng file này.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 1 SERIES n=40 ĐẦY ĐỦ (14:41:20–15:20:21Z + DONE 15:21:21Z)

> Sampler: 60 s/mẫu, MemAvailable + Balloon + load1, nohup,
> đường dẫn tuyệt đối (script copy từ round146-t5/ram-sampler-
> boot2.sh, đổi OUT sang round147-t5 TRƯỚC khi chạy — kiểm
> bằng grep, không lặp lại F-138-T5-1: grep `round146|boot2`
> = 0 sau sed). **1 series, không reboot giữa phiên** (khác
> đợt 146 có 2 series do reboot #34).

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 14:41:20 | 1.535.008 | 5.264.176 | 1,39 |
| 2 | 14:42:20 | 1.378.660 | 5.438.220 | 1,10 |
| 3 | 14:43:20 | 1.631.944 | 5.164.816 | 1,56 |
| 4 | 14:44:20 | 1.569.356 | 5.140.608 | 0,88 |
| 5 | 14:45:20 | 2.276.212 | 4.443.300 | 4,34 |
| 6 | 14:46:20 | 2.724.360 | 4.068.524 | 3,56 |
| 7 | 14:47:20 | 2.469.996 | 4.358.956 | 1,74 |
| 8 | 14:48:20 | 1.703.452 | 4.315.004 | 2,98 |
| 9 | 14:49:20 | 1.459.980 | 4.504.284 | 3,42 |
| 10 | 14:50:20 | 1.764.384 | 4.426.188 | 2,35 |
| 11 | 14:51:20 | 1.525.132 | 4.626.664 | 1,42 |
| 12 | 14:52:20 | 1.409.628 | 4.809.020 | 1,01 |
| 13 | 14:53:20 | 1.227.892 | 4.978.676 | 0,62 |
| 14 | 14:54:20 | 1.057.844 | 5.130.848 | 0,23 |
| 15 | 14:55:20 | 884.572 | 5.260.972 | 0,37 |
| 16 | 14:56:20 | 855.332 | 5.383.304 | 0,65 |
| 17 | 14:57:20 | 741.860 | 5.497.636 | 0,48 |
| 18 | 14:58:20 | 629.216 | 5.604.620 | 0,21 |
| 19 | 14:59:20 | 566.164 | 5.700.208 | 0,18 |
| 20 | 15:00:20 | 460.244 | 5.789.528 | 0,06 |
| 21 | 15:01:20 | 392.776 | 5.868.056 | 0,13 |
| 22 | 15:02:20 | 551.772 | 5.720.660 | 0,67 |
| 23 | 15:03:21 | 461.916 | 5.808.856 | 1,05 |
| 24 | 15:04:21 | 408.264 | 5.886.760 | 1,18 |
| 25 | 15:05:21 | 354.932 | 5.960.116 | 1,18 |
| 26 | 15:06:21 | 411.496 | 5.940.780 | 1,45 |
| 27 | 15:07:21 | 353.232 | 6.012.136 | 1,51 |
| 28 | 15:08:21 | 528.516 | 5.794.200 | 1,57 |
| 29 | 15:09:21 | 453.164 | 5.877.980 | 1,55 |
| 30 | 15:10:21 | 373.516 | 5.953.080 | 1,52 |
| 31 | 15:11:21 | 525.156 | 5.826.624 | 1,45 |
| 32 | 15:12:21 | 453.236 | 5.880.972 | 1,71 |
| 33 | 15:13:21 | 380.472 | 5.956.208 | 1,85 |
| 34 | 15:14:21 | 594.060 | 5.716.752 | 2,31 |
| 35 | 15:15:21 | 531.140 | 5.809.224 | 1,12 |
| 36 | 15:16:21 | 456.172 | 5.895.368 | 0,70 |
| 37 | 15:17:21 | 380.020 | 5.973.592 | 0,33 |
| 38 | 15:18:21 | 319.464 | 6.035.044 | 0,47 |
| 39 | 15:19:21 | 312.140 | 6.100.180 | 0,43 |
| 40 | 15:20:21 | 318.520 | 6.070.712 | 0,54 |

- Thống kê (tính bằng code trên 40 mẫu): min avail **312.140
  kB lúc 15:19:21Z**; max **2.724.360 kB lúc 14:46:20Z =
  2.660,5 MiB = 43,3% guard**; trung bình 910.780 kB; Balloon
  min **4.068.524 kB lúc 14:46:20Z**, max **6.100.180 kB lúc
  15:19:21Z**, trung bình 5.449.821 kB; **0 mẫu ghim trần
  6.443.824 kB**; Gate A (≥1.048.576 kB): **14/40 mẫu**
  (26/40 mẫu dưới gate — tất cả 26 mẫu dưới gate đều từ
  14:55:20Z trở đi). Load1 0,06–4,34 (cao 14:45–14:49Z: các
  luồng đợt 147 vừa khởi động).
- **Hình dạng: xả nhỏ đầu phiên rồi phình đơn điệu tới gần
  trần nhưng chưa chạm.** Balloon xả 5,26M → 4,07M lúc
  14:46:20Z (avail vọt đỉnh series 2,72M), rồi phình gần như
  đơn điệu 14:47–15:19Z (4,36M → 6,10M), avail rơi về ~312k;
  3 lần xả nhỏ xen kẽ (15:02:20Z, 15:08:21Z, 15:11:21Z,
  15:14:21Z — avail nhích lên ~530–594k, balloon lùi
  ~150–220k) nhưng không lần nào xả sâu. Lúc đóng (15:22:12Z,
  ngoài series): avail **~318k**, balloon **~6,07M**.
- **CỬA SỔ GUARD: KHÔNG MỞ trong phiên này.** Max 43,3%
  guard — xa guard 6.144 MiB (thiếu 3.567.096 kB). Khác hẳn
  đợt 146 (2 mẫu ≥ guard, đỉnh 105,2%): cửa sổ guard là
  **hiếm, không lặp lại ngay đợt sau**. Tự động hóa birefnet
  của T9 (quyết (l) phương án (a)) **chưa có cửa sổ thật để
  kích hoạt đợt này** — vẫn 0 lần thử birefnet trong chuỗi
  (T9 xác nhận).
- **Balloon: 0/40 mẫu ghim trần — đợt thứ 4 liên tiếp sampler
  T5 ghi 0 mẫu ghim** (đợt 144: 0/53; đợt 145: 0/40; đợt 146
  series 1: 0/37; đợt 147: 0/40). NHƯNG balloon vẫn phình tới
  6,10M (94,7% trần) cuối phiên — đóng băng chưa hết, chỉ là
  chưa ghim trong cửa sổ 40 phút này. Series 2 đợt 146 (cùng
  boot 6fb582df, 12:14–12:53Z) ghim trần 9/40 mẫu — cùng một
  boot, hai cửa sổ khác nhau cho hai cực khác nhau; T5 không
  kết luận "đóng băng đã hết" từ 1 series.
- **Caveat (F-147-T5-3):** timestamp mẫu drift :20 → :21 từ
  mẫu 23 (15:03:21Z) — sleep 60 + thời gian chạy lệnh tích
  lũy ~1 s sau ~22 phút. Cadence vẫn ~60 s/mẫu; không ảnh
  hưởng số liệu.

### 5.1 Birefnet / u2net — kiểm tra tình trạng theo quy trình đứng

- **Birefnet: KHÔNG thử bởi T5** (brief loại trừ; việc của T9
  theo quyết §12.3(f) đợt 137 + quyết (l) đợt 146 phương án
  (a)). **Cửa sổ guard KHÔNG mở đợt này** (max 43,3% guard)
  nên tự động hóa (a) của T9 chưa có dịp kích hoạt — T9 xác
  nhận 0 lần thử birefnet đợt này. T5 không chạy thử thêm.
- **u2net (fallback chính thức) — KHÔNG kiểm lại đợt này:**
  T5-146 đã kiểm sự hiện diện đầy đủ (rembg 2.0.87,
  `~/.u2net` có u2net.onnx + birefnet-general.onnx, models/
  218M); T5-147 không đụng đĩa thêm vì không có dữ kiện mới
  (không cài/xóa gì liên quan). T5 không chạy thử u2net (không
  thuộc brief).
- Guard **6.144 MiB GIỮ NGUYÊN** (quyết §12.3(d) đợt 138 +
  quyết (n) đợt 144 + quyết (l) đợt 146).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, cap 30.000 — áp dụng lần đầu) — VẪN DƯỚI NGƯỠNG BÁO, LẦN 7 LIÊN TIẾP

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 141 mở (T5) / cuối (T5) | 1737 / 1720 | boot 2c0efe57 |
| Đợt 142 mở (T5) / cuối (T5) | 1614 / 1593 | boot bde599df / 9afdaa89 |
| Đợt 143 mở (T5) / cuối (T5) | 1498 / 1494 | boot 70a5b0fc |
| Đợt 144 mở (T5) / cuối (T5) | 1289 / 1193 | boot 691a7403 / cc222c8a |
| Đợt 145 mở (T5) / cuối (T5) | 1074 / 1070 | boot e146ca67 |
| Đợt 146 mở boot 1 (T5) / mở boot 2 / cuối boot 2 | 879/880 / 784 / 772 | boot 98a7c93f / 6fb582df |
| **Đợt 147 mở (T5, 14:43Z)** | **669** | **boot 6fb582df, headroom-open.txt** |
| **Đợt 147 cuối (T5, 15:22Z)** | **661** | **boot 6fb582df, headroom-end.txt** |

- Giảm −103 so với cuối đợt 146 (772 → 669, cùng boot
  6fb582df) và −8 nữa trong phiên (669 → 661); **Vẫn DƯỚI
  ngưỡng báo user (< ~1.800)** — theo quyết parent (k) đợt
  144 + (m) đợt 146 (chỉ theo dõi, không hành động mới, không
  nhắc lại riêng), đợt này **chỉ theo dõi, không báo riêng,
  không tự đổi gì**. Tỉ lệ/vite: ~0,42 (669/1578) — lần thứ 5
  liên tiếp dưới 1,0.
- **Cap probe 30.000 áp dụng lần đầu** (quyết (m) đợt 146):
  script k8 copy từ đợt 146, `CAP = 63747` → `CAP = 30000`,
  verify bằng grep trước khi chạy. Headroom ~670 nên cap
  không ảnh hưởng kết quả (dừng ở 669/661 do ENOSPC, xa cap).
  Trần boot này: **63747 — KHÔNG đổi** so với đợt 146 boot 2
  (flip-flop 63747 → 63756 → 63747 dừng ở 63747 hai lần đo
  liên tiếp trên cùng boot). Số watch đang giữ ngoài cell suy
  ra: 63.747 − 669 = **63.078 watch** (mở); 63.747 − 661 =
  **63.086 watch** (cuối).
- **Cửa sổ thoáng ngay sau boot (>20.000): KHÔNG đo đợt này**
  (boot đã 2h26' tuổi lúc T5 mở; cửa sổ chỉ tồn tại ~1–2 phút
  đầu sau boot — xem §6.1 đợt 146).
- Caveat (F-147-T5-2): fd cell-visible (`ls /proc/*/fd | wc
  -l`, cùng cách đếm các đợt) **358 (lúc mở) → 332 (sau probe
  lần 1) → 600 (lúc đóng)** — biến động mạnh theo luồng đang
  chạy (T4/T8/T10 chạy harness + O8 lúc đóng), không phải
  thành phần ổn định của headroom; headroom tự nó gần như
  không đổi trong phiên (669 → 661) nên đà giảm −103 so với
  cuối đợt 146 là đà dài hạn thật, không phải nhiễu lúc đo.
  T9-147 đo độc lập để đối chiếu.

### 6.2 Disk

- Overlay `/`: **7,5G tổng, 6,7G trống** (đo 14:39Z — giảm
  0,1G so với 6,8G đợt 146, do file LIMITS + log các luồng
  đợt 147); `/tmp` tmpfs 512M, 497M trống. Không có ENOSPC
  nào trong phiên ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại
  (symlink → `../vite/bin/vite.js`, mtime 09/11 không đổi) — T5
  KHÔNG chạy lại `vite --version` đợt này (đợt 142 đã kiểm:
  vite/6.4.5 linux-x64 node-v24.22.1, chạy được). T5 KHÔNG chạy
  dev server / build (không sửa production; việc của T8 — vite
  qua lock). T4-147 chạy vite cho lượt yên #21 đo lại trên
  boot này (việc của T4).

## 7. EPERM scan + dmesg — đối chiếu (T2-147 đã đóng)

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #66 (T2-147): ok=2 fail=0, boot=6fb582df, 14:41:45Z**
  (`eperm-probe-v2.log`: 187 → **190 dòng (+3 đúng prereg)**:
  1 dòng DEAD-detected + 1 dòng boot-changed + 1 dòng probe
  #66). Probe #66 chạy ngay khi T2-147 mở (14:41:45Z — cùng
  phút T5 chạy poll0 14:41:52Z) — cùng boot 6fb582df mà T5
  đang kiểm.
- **Mù #66 ĐÓNG HOÀN TOÀN (T2-147)** — chuỗi đóng hoàn toàn
  lên 2 (A merged max 120 s, B merged max 937 s, cả hai < sàn
  1.147 s, max 0 ẩn; KHÔNG cần uptime — lần đầu cả hai đoạn
  cùng đóng theo luật gap). **Gap 8.363 s chứng nhận [8.353,
  8.373] s → CERT 66 / FULL 81** (không điều kiện). **Khung
  chết #109? ứng viên (12:13:15Z, 12:13:26Z] 11 s** — hẹp,
  khớp cửa sổ T4; **nghịch lý đồng hồ ≥23 s ĐÃ GIẢI THÍCH tới
  từng file** (dấu vết boot cũ sau btime không dịch chuyển
  khung theo quy ước đứng). T5 không phán mù; T2-147 là nguồn
  chính thức.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140/T5-141/T5-142/T5-143/T5-144/T5-145/
  T5-146).
- Lưu ý log probe: dòng `boot changed` ghi **98a7c93f →
  6fb582df**, khớp reboot #34 — probe chết theo reboot #34
  (last #65 11:39:18Z, DEAD-detected 14:41:45Z age 10.947 s)
  và chỉ tỉnh lại sau reboot #34; đây là giới hạn của probe
  log, không phải dữ kiện về boot (T2-147 có boot-verify.txt
  riêng xác nhận 6fb582df, btime 1795090406).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 viết; lần kiểm cuối 15:22Z — log dừng ở probe #66).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline
  (không đổi từ đợt 137–146 — T5 không đọc lại đợt này vì
  không có dữ kiện mới; ghi theo tiền lệ).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** EPERM vẫn
  KHÔNG được tuyên bố là đã hết (quy ước đứng).
- **WFS scan: T5 KHÔNG chạy đợt này** (không thuộc brief
  T5-147). T2-147 đã chạy **WFS #53 chênh 0** (lần 53 liên
  tiếp; NEWSTD 968/275, R7b 993/292; +1/+1 giải thích bằng
  LIMITS T2-146). Async `.writeFile(` đúng 2 helper, 0 stray
  (T2-147).

### 7.3 dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–146). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 8. Nợ mở sang đợt sau

1. **Lượt yên #21: ĐANG ĐO LẠI Ở ĐỢT 147 (việc T4-147).**
   Ngân sách retry = 3 attempt/đợt; cờ POSTBOOT_PASS của T5 đã
   ghi 14:41:57Z poll=2 cho boot 6fb582df (T4 đo lại trên boot
   này theo quyết (h) đợt 146). Thêm cổng tickCost ≤60 ms vào
   poller (giao T4-147, quyết (j) đợt 146).
2. **Cửa sổ guard KHÔNG mở đợt này (max 43,3% guard).**
   Tự động hóa birefnet của T9 (quyết (l) phương án (a)) chưa
   có cửa sổ thật để kích hoạt — vẫn 0 lần thử birefnet trong
   chuỗi. Guard 6.144 MiB GIỮ NGUYÊN; u2net là fallback chính
   thức.
3. **Balloon 0/40 mẫu ghim trần (đợt thứ 4 liên tiếp sampler T5
   ghi 0 mẫu ghim) — NHƯNG phình tới 6,10M (94,7% trần) cuối
   phiên.** Đóng băng chưa hết; series dài của T9 là chuẩn dài
   hạn (xem §5).
4. **Headroom VẪN DƯỚI NGƯỠNG BÁO (669 mở → 661 cuối):** chỉ
   theo dõi, không báo riêng (quyết parent (k) đợt 144 +
   (m) đợt 146). Đà giảm so với cuối đợt 146 là −103 (cùng
   boot 6fb582df) / −111 (so với mở boot 2 đợt 146: 772 → 661)
   — đà dài hạn thật (headroom trong phiên gần như không đổi:
   669 → 661); T9 đối chiếu độc lập. Cap probe 30.000 đã áp
   dụng từ đợt này.
5. **Tuổi thọ boot 98a7c93f = 8.363 s ĐÃ CHỨNG NHẬN** (T2-147:
   gap [8.353, 8.373] s → CERT 66 / FULL 81, không điều kiện;
   T5-147 xác nhận độc lập lần 2 bằng 2 cách tính). Giao
   T7-147 đối chiếu lại mốc neo (quyết (q) đợt 146) — việc
   của T7.
6. **Mù #66 ĐÓNG HOÀN TOÀN (T2-147)** — chuỗi đóng hoàn toàn
   lên 2; khung chết #109? ứng viên (12:13:15Z, 12:13:26Z]
   11 s; nghịch lý đồng hồ ≥23 s đã giải thích tới từng file.
   **KHÔNG có reboot mới trong phiên T5** → không mở mù #67.
7. **Replay CHẠY TỐT 5 boot liên tiếp** (691a7403, cc222c8a,
   e146ca67, 98a7c93f, 6fb582df — đều 1545/221) — sau 3 lần
   chết dạng (B) trong 4 đợt gần nhất. Dạng (B) không biến mất
   (vẫn có thể quay lại đợt sau); §8.2(B) form B + luật (C)
   giữ nguyên, không đổi luật nào đợt này. **KHÔNG cần
   --repair lần nào đợt này** (lần thứ 4 liên tiếp kể từ đợt
   144).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 146 §11: G1
   chờ user quyết; ci-security.yml vẫn 403 chờ user; file
   oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json`
   vẫn chưa quyết số phận; TTS 39 cấm kiểm lại; release gate
   không đổi + KHÔNG push khi user chưa nhắn "push đi"; R9 (a)
   vẫn chờ user (số đếm VẪN LÀ 16).

## 9. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7
  lúc đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: **KHÔNG sửa đợt này** (`6e20b0ed…`, mở =
  lúc đóng — xem §3.7).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử bởi T5 (không
  thuộc brief; RAM series này đỉnh 43,3% guard — xa guard,
  xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-147 probe
  #66 ok=2 fail=0). WFS scan: T5 KHÔNG chạy đợt này (không
  thuộc brief; T2-147 đã chạy WFS #53 chênh 0).
- Postboot boot 6fb582df: PASS poll0 (14:41:52Z) + poll1
  (14:42:04Z) + poll2 (15:22:12Z); cờ mới ghi 14:41:57Z poll=2.
  **KHÔNG chạy --repair lần nào.**
  **Watcher 60-phút: KHÔNG lập** (replay đã xong từ đợt 146).
  Luật (C): KHÔNG kích hoạt (không có replay kẹt + postboot
  FAIL kéo dài).
- B4 thực hành: **(a) file đóng băng đợt 146 re-verify khớp
  live + (b) exact-comm = 0** (xem §3.6) — không có cửa sổ
  giao đối chiếu đợt này.
- Headroom: 669 (mở) → **661 (cuối)** — VẪN DƯỚI ngưỡng báo
  ~1.800, lần thứ 7 liên tiếp, chỉ theo dõi. Cap probe 30.000
  áp dụng lần đầu.
- RAM phiên T5 (1 series, xem §5): n=40 đầy đủ: avail
  312.140–2.724.360 kB (mean 910.780), balloon 4.068.524–
  6.100.180 kB (mean 5.449.821), gate A 14/40, max **43,3%
  guard**, **0 mẫu ghim trần**, **0 mẫu ≥ guard**.
- **0 reboot trong phiên T5** — boot 6fb582df sống từ 12:13:26Z
  tới lúc đóng 15:22:12Z (3h08m46s = 11.326 s).
- **started_at lượt 147:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10).

## 10. Sai số F-147-T5-n (mọi sai số của luồng T5 đợt này)

- **F-147-T5-1 — pass_at của cờ là thời điểm bắt đầu poll1,
  không phải lúc poll1 xong.** Cờ `POSTBOOT_PASS` ghi
  pass_at=14:41:57Z; poll1 khởi động 14:41:57Z (sau sleep 5 s
  từ poll0 14:41:52Z) và kết thúc 14:42:04Z. Mẫu các đợt trước
  cũng ghi pass_at ≈ thời điểm poll1; T5 ghi rõ để T4/T10
  không đọc sai thành thời điểm poll1 hoàn tất. Không ảnh
  hưởng tính đúng đắn của cờ (cả 2 poll đều exit 0).
- **F-147-T5-2 — fd cell-visible biến động mạnh (caveat, không
  phải lỗi đo).** `ls /proc/*/fd | wc -l`: 358 (lúc mở) → 332
  (sau probe lần 1) → 600 (lúc đóng). Mức đóng cao do T4/T8/
  T10 chạy harness + O8 lúc đóng; dao động ±268 trong phiên
  là hệ quả của số luồng đang chạy, không phản ánh headroom
  (669 → 661 gần như không đổi). Cùng họ F-146-T5-4. T5 ghi
  lại để T9/T10 không đọc số fd như chỉ báo headroom.
- **F-147-T5-3 — timestamp sampler drift :20 → :21 từ mẫu 23.**
  Các mẫu 1–22 ghi giờ :20, mẫu 23–40 ghi :21 (15:03:21Z trở
  đi) — sleep 60 + thời gian chạy lệnh tích lũy ~1 s sau ~22
  phút. Cadence vẫn ~60 s/mẫu; không ảnh hưởng số liệu. Cùng
  họ với drift :28 → :29 trong series đợt 146.
- **F-147-T5-4 — Output drain F-146-T5-3 KHÔNG tái diễn.**
  Vòng chờ sampler đợt này trả output khớp hoàn toàn với
  `cat` trực tiếp (40 mẫu + SAMPLER_DONE 15:21:21Z, cùng nội
  dung, cùng thứ tự); thống kê §5 tính bằng code trên file
  log đọc trực tiếp, không lấy từ output drain. Dị thường
  đợt 146 vẫn chưa giải thích được nhưng không tái hiện đợt
  này.
- **F-147-T5-5 — `eperm-now.txt` KHÔNG đọc lại đợt này.**
  T5 ghi "vẫn chỉ chứa `x` + newline (không đổi từ đợt
  137–146)" theo tiền lệ mà không đọc lại file trong phiên
  này (không có dữ kiện mới nào gợi ý file đổi). Nếu T10
  cần số chính xác, đọc lại trực tiếp — T5 không khẳng định
  từ lần đọc đợt này.

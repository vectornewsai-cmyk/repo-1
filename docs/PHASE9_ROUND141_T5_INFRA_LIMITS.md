# PHASE9_ROUND141_T5_INFRA_LIMITS — 1 BOOT: 2c0efe57 (#99?) replay XONG (1545/221/462, boot +3m57s, KHÔNG GAP, cache SỐNG) + postboot PASS poll0 + cờ 20:41:02Z + T4 mở cửa yên #17 poll #2, attempt1 20/20 + headroom CHẠM DƯỚI ngưỡng báo (1737 → 1720) + balloon XẢ LỚN, không ghim trần

> Luồng T5, đợt 141, lượt cron 03:35 +07 19/11/2026 (mở 20:35:51Z 18/11;
> T5 mở thực tế 20:40:47Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local — KHÔNG
> push). **1 BOOT duy nhất trong phiên T5, KHÔNG reboot giữa lượt.**
> Boot **2c0efe57** (**#99? — T2-141 đã xác nhận theo quy ước + merged
> mù #60 đóng**; btime 19:54:12Z): replay **XONG HẲN trước khi T5 mở**
> (1545 dòng / 221 installs / 462 configure, xong 19:58:09Z = boot
> +3m57s — nhanh thứ 2 trong các replay đầy đủ, KHÔNG có GAP);
> postboot PASS exit 0 ngay poll0 (20:40:47Z) + poll0b sau sửa header
> (20:44–20:45Z); cờ POSTBOOT_PASS ghi 20:41:02Z poll=0, T4 đã đọc ở
> poll #1 (20:42:02Z) và **MỞ CỬA YÊN #17 ở poll #2 (20:42:47Z, RAM
> 1485 MB)**; attempt1 **20/20 XONG, exit 0, 20:46:41Z** (kết quả
> attempt thuộc T4 — T5 chỉ ghi nhận thời gian + bối cảnh RAM).
> **Headroom inotify CHẠM DƯỚI ngưỡng báo user lần đầu: mở 1737, cuối
> 1720** (đợt 140 đóng 1838; đà ~−100/đợt giữ nguyên — xem F-141-T5-1,
> T10 BÁO PARENT RÕ). **Balloon XẢ LỚN, KHÔNG ghim trần** (max
> 6.216.744 kB < trần kẹt 6.443.824 kB; xả ~1,58M kB lúc 20:47:12Z
> trùng lúc attempt1 của T4 vừa xong — tương quan, không kết luận
> nhân quả); RAM max 2.968.192 kB = 47,2% guard — **không có cửa sổ
> guard nào, không ai thử birefnet**. **KHÔNG push. KHÔNG release/tag.
> KHÔNG sửa production** (preview.tsx giữ 530e10a7). **KHÔNG tự chạy
> birefnet** (thuộc T9 — T5 CHỈ quan sát + báo cáo). KHÔNG đụng file
> workflow (ci-security.yml vẫn 403 chờ user). TTS 39 CẤM kiểm lại.

## 1. Kết luận ngắn

1. **BOOT 2c0efe57 (#99?) REPLAY XONG HẲN TRƯỚC KHI T5 MỞ** (btime
   19:54:12Z — **KHỚP brief**, không lặp lại F-139-T5-1).
   dpkg.log **1545 dòng / 221 installs / 462 configure** (configure-
   action 178 / install-action 169 / gstreamer 98 — y hệt baseline);
   md5 `9fa2410f…`; mtime 19:58:09Z; 0 proc apt/dpkg; cache apt
   **178 .deb / 156M — SỐNG QUA REBOOT** (khác đợt 140 boot 2: 0
   .deb — xem F-141-T5-4: cache sống/không sống là không nhất quán
   giữa các reboot, không rút được quy luật); lists 39 (đầy đủ, lưu
   listing); GST hệ thống là thư mục THẬT (apt) 269/269; term.log
   0 dòng `Get:` (cài từ cache); history.log 50 Start-Date;
   **postboot PASS exit 0** ngay poll0 (20:40:47Z) + poll0b sau sửa
   header (20:44–20:45Z). Bracket: **(startup configure 19:54:43Z =
   boot +31s, cài thật 19:55:18–19:58:09Z (2m51s), xong 19:58:09Z =
   boot +3m57s, 1545/221/462)** — KHÔNG có GAP (chỉ 35 s giữa
   startup configure và install thật, khác hẳn GAP 805s đợt 140
   boot 1); wall-clock nhanh thứ 2 trong các replay đầy đủ
   (#96? +3m52s, #94? +6m05s, 140 boot 1 +16m39s do GAP).
2. **KHÔNG CÓ REBOOT GIỮA LƯỢT.** Boot 2c0efe57 sống suốt phiên T5
   (mở 20:40:47Z → đóng 21:22:30Z, ~1h28' tuổi lúc đóng); journal
   chỉ có 1 boot duy nhất (first entry 19:54:23Z); boot_id không
   đổi trong mọi lần kiểm. Boot trước 90392aa5 (#98? — T2-141:
   INSIDE dải FULL72; khung chết #98? ứng viên merged
   (19:46:47Z, 19:54:12Z]) chết TRƯỚC khi T5-141 mở (reboot #23
   trong lúc T10-140 đóng sổ — theo brief + T2-141).
3. **CỜ POSTBOOT_PASS ghi 20:41:02Z poll=0** (`boot_id=
   2c0efe57-5559-4e92-9f8b-aecf1f9866a3 btime=2026-11-18T19:54:12Z
   pass_at=2026-11-18T20:41:02Z poll=0`) — T4 đã đọc ở **poll #1
   (20:42:02Z**, ~60 s sau khi ghi; t5flag=PASS(t5src=141-t5/
   POSTBOOT_PASS), postboot_exit=0, dpkg_lines=1545) và **MỞ CỬA
   YÊN #17 ở poll #2 (20:42:47Z, RAM 1485 MB)**; attempt1
   **20/20 XONG, run-attempt exit=0, 20:46:41Z** (T4 thoát
   poller — kết quả attempt thuộc T4, T5 chỉ ghi nhận).
   KHÔNG cần watcher (replay đã xong trước khi T5 mở);
   **luật (C) KHÔNG kích hoạt** (không có replay kẹt, postboot
   PASS ngay lần kiểm đầu).
4. **RAM SAMPLER — 1 SERIES ĐẦY ĐỦ (n=40, 20:41:12–21:20:13Z +
   DONE 21:21:13Z):** avail **342.452–2.968.192 kB** (mean
   996.055); balloon **3.955.436–6.216.744 kB** (mean ~5.574.000);
   **0 mẫu ≥ 6.144 MiB; gate A 14/40; max chỉ 47,2% guard**
   (2.968.192 kB lúc 20:47:12Z). **Balloon KHÔNG ghim trần kẹt
   6.443.824 kB lần nào** (max 6.216.744 kB, chỉ 1 mẫu ở max đó)
   — khác hẳn đợt 140 boot 2 (ghim trần 15 mẫu). **XẢ LỚN
   ~1,58M kB lúc 20:47:12Z** (balloon 5.539.100 → 3.955.436 kB,
   avail 1.360.044 → 2.968.192 kB) trùng lúc attempt1 của T4
   vừa xong (exit 20:46:41Z) — tương quan, không kết luận nhân
   quả. Lúc đóng (21:22:30Z): avail **741.040 kB**, balloon
   **5.527.072 kB** (đã xả khỏi mức ~5,99M lúc 21:22:16Z).
   **Không có cửa sổ guard nào — không ai thử birefnet.**
5. **HEADROOM inotify CHẠM DƯỚI NGƯỠNG BÁO (F-141-T5-1): mở 1737
   → cuối 1720** — lần đầu tiên dưới ~1.800 (đợt 140 đóng 1838;
   giảm −101 so với cuối đợt 140 rồi −17 trong phiên; chuỗi dài
   hạn ~100–110/đợt giữ nguyên). **T10 BÁO PARENT RÕ ĐIỂM NÀY**
   (quyết §12.3(j) đợt 137 chỉ nói "theo dõi" dưới ngưỡng —
   nay đã chạm, cần parent quyết trước khi user hỏi).
   Inotify fd cell-visible 399 (mở) → 407 (cuối).
6. **CÂY KHÔNG ĐỔI:** preview.tsx **530e10a7**, media.ts
   **2c384ed1**, vite.config.ts **ee80d093** (mở = cuối);
   postboot script sửa 1 lần (`5bd00bf7…` → **`1ebcb776…`**,
   chỉ header + dòng `say`, KHÔNG đổi logic — xem §3.4).
7. **EPERM (T2-141, T5 chỉ đối chiếu): probe #60 ok=2 fail=0,
   boot=2c0efe57, 20:45:15Z**; **mù #60 ĐÃ ĐÓNG HOÀN TOÀN**
   (T2-141: 3 đoạn, 2 reboot); **gap #97?→#98? = [7.089, 7.109] s
   CHỨNG NHẬN + gap #98?→#99? = [7.266, 7.286] s CHỨNG NHẬN →
   CERT 60 / FULL 75**; #98? INSIDE dải FULL72, #99? INSIDE dải
   tạm FULL73 (chuỗi INSIDE 6 lần liên tiếp); dải #100? FULL75
   [20:22:26Z, 22:19:21Z] (T2-141). **WFS scan #47: chênh 0**
   — NEWSTD 944/261, R7b 969/281, copies 25/17; T2 quét độc lập
   ra số đếm Y HỆT (944/264 scope 3.170 — xem §7.3/§7.4).
   **Async `.writeFile(`: đúng 2 helper đã biết, 0 stray.**
8. **dmesg KHÔNG ĐỌC ĐƯỢC** (bị chặn EPERM); journalctl -k rỗng
   — đúng như quyết parent §12.3(h).
9. **R9 (a) vẫn chờ user — số đếm VẪN LÀ 16** (không tăng).
   G1 khung (a) M2 vẫn hoãn — chờ quyết G1 của user.

## 2. Timeline — 1 boot, không reboot giữa lượt

| # | boot_id (8 ký tự) | btime (Z) | Sống | Kết cục |
|---|---|---|---|---|
| 1 | 2c0efe57 (#99? — T2-141 đã xác nhận theo quy ước + merged mù #60 đóng; gap #98?→#99? = [7.266, 7.286] s CHỨNG NHẬN → CERT 60 / FULL 75) | 19:54:12 (uptime -s; /proc/1 19:54:22; journal first entry 19:54:23) | còn sống (lúc T5 đóng ~1h28' tuổi) | Replay XONG HẲN trước khi T5 mở (19:58:09Z, boot +3m57s); postboot PASS poll0 20:40:47Z; cờ ghi 20:41:02Z; T4 mở cửa yên #17 poll #2 20:42:47Z; attempt1 20/20 XONG 20:46:41Z |

- **Btime KHỚP brief** (19:54:12Z, 5 nguồn: /proc/stat btime
  1795031652, uptime -s, stat /proc/1 19:54:22Z (+10 s, mẫu như
  mọi boot), who -b 19:54, journal first entry 19:54:23Z, T2-141
  boot-verify + probe #60 "uptime since 19:54:12") — không lặp
  lại F-139-T5-1. **KHÔNG có lệch đồng hồ** (không reboot giữa
  lượt nên không có cửa chết/mốc mâu thuẫn nào — khác đợt 140
  F-140-T5-2).
- Boot trước 90392aa5 (#98?, **T2-141: INSIDE dải FULL72; khung
  chết #98? ứng viên merged (19:46:47Z, 19:54:12Z]**) chết
  TRƯỚC khi T5-141 mở (reboot #23 trong lúc T10-140 đóng sổ).
  **Mù #60 ĐÃ ĐÓNG HOÀN TOÀN (T2-141: 3 đoạn, 2 reboot)**;
  **gap #97?→#98? = [7.089, 7.109] s + gap #98?→#99? =
  [7.266, 7.286] s ĐỀU ĐÃ CHỨNG NHẬN → CERT 60 / FULL 75**;
  #99? INSIDE dải tạm FULL73 (chuỗi INSIDE 6 lần liên tiếp:
  #94?–#99?). T5 KHÔNG kiểm lại khung chết #94? (đã xác nhận ở
  đợt 138 §12.3(e)(ii)).
- Chốt chặn `round-in-progress.md` là marker **MỞ ĐỢT 141** do
  parent tạo (20:35:51Z, ghi "Đợt 141 ĐANG CHẠY… 10 luồng
  T1–T10…") — KHÔNG phải đợt main-chat (tiền lệ đợt 130–140).
  T5 tiến hành bình thường.
- journalctl --list-boots chỉ có **1 boot duy nhất**
  (2c0efe57, first entry 19:54:23Z) — không có boot thứ 2 nào
  trong journal.

## 3. dpkg replay — XONG HẲN, bracket đầy đủ, KHÔNG GAP, cache SỐNG

### 3.1 Replay boot 2c0efe57 — xong trước khi T5 mở, boot +3m57s

| Hạng mục | Lúc mở (20:40–20:41Z) | Lúc đóng (21:22Z) |
|---|---|---|
| dpkg.log dòng | 1545 | 1545 |
| `status installed` | 221 | 221 |
| dòng chứa `configure` | 462 | 462 |
| action `configure` (cột 3) | 178 | 178 |
| action `install` (cột 3) | 169 | 169 |
| dòng `gstreamer` | 98 | 98 |
| dpkg.log md5 | `9fa2410f…` | `9fa2410f…` |
| dpkg.log mtime | 19:58:09.85Z | 19:58:09.85Z |
| startup configure đầu | 19:54:43Z | như vậy (boot +31s) |
| cài thật | 19:55:18–19:58:09Z | 2m51s, gói cuối gstreamer1.0-tools |
| cache apt | 178 .deb / 156M | 178 / 156M |
| lists / partial | 39 / 0 | 39 / 0 (listing đầy đủ lưu apt-lists.txt) |
| GST hệ thống / debroot | 269 / 269 (thư mục THẬT) | 269 / 269 |
| term.log dòng `Get:` | 0 (980 dòng) | 0 |
| proc apt/dpkg | 0 | 0 |
| postboot check | PASS exit 0 (poll0 20:40:47Z + poll0b 20:44–20:45Z sau sửa header) | — |

- **KHÔNG GAP:** dpkg.log: 2 dòng startup `packages configure`
  lúc 19:54:43Z rồi `startup archives unpack` lúc 19:55:18Z
  (chỉ 35 s sau) — khác hẳn GAP 805s đợt 140 boot 1. apt
  history.log: Start-Date ĐẦU TIÊN 19:55:18Z (50 Start-Date,
  cuối 19:58:09Z); term.log mọi `Log started` đều
  19:55:18–19:58:09Z. Cài thật 2m51s — ngang #96? (3m21s cài
  thật) và 140 boot 1 (2m32s) — nên wall-clock +3m57s là
  **nhanh thứ 2 trong các replay đầy đủ** (#96? +3m52s,
  #94? +6m05s, 140 boot 1 +16m39s do GAP).
- **Cache SỐNG qua reboot (F-141-T5-4):** boot này cache
  178 .deb / 156M — y hệt boot 1 đợt 140 (af558fb5) và ngược
  với boot 2 đợt 140 (90392aa5: 0 .deb). T5 không rút quy luật
  (xem §11).
- **Lists 39** (y hệt đợt 140 boot 1: 4 suite noble/updates/
  security/backports + cli.github.com); apt history KHÔNG ghi
  `apt-get update` nào trên boot này — 2 file cli.github.com
  có thể đã nằm trong seed/rootfs; T5 ghi nhận mà không kết
  luận (như đợt 140).
- Cờ `POSTBOOT_PASS` ghi **20:41:02Z poll=0**
  (`boot_id=2c0efe57-… btime=2026-11-18T19:54:12Z pass_at=
  2026-11-18T20:41:02Z poll=0`) — T4 đã đọc ở **poll #1
  (20:42:02Z**, ~60 s sau khi ghi; t5flag=PASS(t5src=141-t5/
  POSTBOOT_PASS), postboot_exit=0, dpkg_lines=1545) và mở cửa
  yên #17 ở **poll #2 (20:42:47Z, RAM 1485 MB)**.
- **KHÔNG cần watcher, KHÔNG --repair, luật (C) KHÔNG kích
  hoạt** — replay đã xong + postboot PASS ngay lần kiểm đầu.

### 3.2 T4 trên boot này (T5 chỉ ghi nhận, kết quả thuộc T4)

- Poller `poll-wait-t4-141.sh` bắt đầu 20:42:02Z (deadline
  22:30:00Z, poll 45 s, gateA ≥1024 MB, KHÔNG hạ).
- **CỬA YÊN #17 MỞ poll #2 20:42:47Z** — gate0 PASS + gateA đủ
  (RAM=1485MB) — CHẠY attempt1 NGAY. Attempt1 **20/20 XONG,
  run-attempt exit=0, 20:46:41Z** — lần đầu tiên lượt yên #17
  có attempt ĐẦY ĐỦ 20/20 (đợt 140 attempt1 chỉ PARTIAL 10/20
  rồi bị reboot #22 giết). T4 thoát poller sau attempt1.
  Verdict tickCost/median thuộc T4 (xem file analyze-t4-
  attempt1-*.txt trong round141-t4/).

### 3.3 Postboot script — sửa 1 lần (header + say, KHÔNG đổi logic)

`apps/web/scripts/vcut-webkit-postboot-check.sh`, md5
`5bd00bf7…` (cuối đợt 140) → **`1ebcb776…`**:

| Lần | Thời gian (Z) | Boot | md5 trước → sau | Nội dung |
|---|---|---|---|---|
| 1 | 20:44–20:45Z | 2c0efe57 | `5bd00bf7…` → `1ebcb776…` | header (đoạn Dot 141: btime KHỚP brief, replay +3m57s KHÔNG GAP, cache sống, cờ 20:41:02Z, T4 mở cửa yên #17 poll #2, headroom 1737 ĐÃ DƯỚI ngưỡng báo) + say mô tả trạng thái đã đo (postboot PASS poll0 + cờ đã ghi trước khi viết say) |

- `bash -n` OK sau khi sửa. **KHÔNG đổi logic** (không đổi
  thứ tự apt/GST, không đổi NEED/threshold). Check-only chạy
  lại sau sửa (poll0b) **exit 0** — cùng kết quả như trước
  sửa, chứng minh sửa header/say không ảnh hưởng logic.

## 4. Kiểm cây — md5 3 file lúc mở / cuối + postboot script

| File | Lúc mở 20:40Z | Lúc đóng 21:22Z | Kết luận |
|---|---|---|---|
| apps/web/src/preview.tsx | 530e10a7 | 530e10a7 | KHÔNG ĐỔI ✓ |
| apps/web/src/media.ts | 2c384ed1 | 2c384ed1 | KHÔNG ĐỔI ✓ |
| apps/web/vite.config.ts | ee80d093 | ee80d093 | KHÔNG ĐỔI ✓ |
| apps/web/scripts/vcut-webkit-postboot-check.sh | 5bd00bf7… | 1ebcb776… (sau sửa lần 1) | chỉ header + say, KHÔNG đổi logic ✓ |

- preview.tsx **530e10a7** = fix logger nới của T3, GIỮ VĨNH VIỄN
  làm instrumentation theo quyết parent đợt 137 §12.3(a). T5
  KHÔNG đụng file này. T4-141 cũng độc lập ghi tree=YES:md5=
  530e10a7 ở poll #1/#2.
- `git rev-parse HEAD` không chạy được (cây làm việc KHÔNG có
  `.git` local — tiền lệ đã ghi từ đợt 137; HEAD df3dffae là số
  theo brief, T5 không tự xác minh qua git).

## 5. Sampler RAM — 1 series đầy đủ (n=40, balloon XẢ LỚN, không ghim trần)

### 5.1 Bảng mẫu (20:41:12–21:20:13Z + DONE 21:21:13Z)

| # | Thời gian (Z) | MemAvailable (kB) | Balloon (kB) | load1 |
|---|---|---|---|---|
| 1 | 20:41:12 | 1.672.472 | 5.067.568 | 1,43 |
| 2 | 20:42:12 | 1.642.936 | 5.248.612 | 2,07 |
| 3 | 20:43:12 | 987.780 | 5.179.348 | 2,44 |
| 4 | 20:44:12 | 779.340 | 5.259.704 | 1,76 |
| 5 | 20:45:12 | 1.296.692 | 5.387.924 | 1,13 |
| 6 | 20:46:12 | 1.360.044 | 5.539.100 | 0,66 |
| 7 | 20:47:12 | **2.968.192** | **3.955.436** | 1,59 |
| 8 | 20:48:12 | 2.631.640 | 4.262.092 | 0,68 |
| 9 | 20:49:12 | 2.221.824 | 4.532.756 | 1,32 |
| 10 | 20:50:12 | 2.024.640 | 4.774.864 | 1,51 |
| 11 | 20:51:12 | 1.795.536 | 4.992.188 | 0,55 |
| 12 | 20:52:12 | 1.608.416 | 5.197.304 | 0,39 |
| 13 | 20:53:12 | 1.076.756 | 5.170.404 | 0,74 |
| 14 | 20:54:12 | 1.050.352 | 5.198.788 | 1,80 |
| 15 | 20:55:12 | 968.296 | 5.333.680 | 1,79 |
| 16 | 20:56:12 | 819.624 | 5.482.680 | 1,50 |
| 17 | 20:57:12 | 722.772 | 5.593.608 | 1,54 |
| 18 | 20:58:12 | 703.500 | 5.703.856 | 0,63 |
| 19 | 20:59:12 | 573.012 | 5.803.436 | 0,43 |
| 20 | 21:00:12 | 506.108 | 5.889.932 | 0,73 |
| 21 | 21:01:12 | 456.500 | 5.973.604 | 0,37 |
| 22 | 21:02:12 | 401.532 | 6.050.768 | 0,13 |
| 23 | 21:03:12 | **342.452** | 6.122.440 | 0,21 |
| 24 | 21:04:12 | 564.980 | 5.906.964 | 0,08 |
| 25 | 21:05:12 | 523.088 | 5.992.532 | 0,58 |
| 26 | 21:06:12 | 653.140 | 5.829.720 | 0,87 |
| 27 | 21:07:12 | 521.652 | 5.921.096 | 0,92 |
| 28 | 21:08:12 | 460.780 | 5.995.040 | 0,59 |
| 29 | 21:09:12 | 365.952 | 6.070.448 | 0,22 |
| 30 | 21:10:12 | 344.176 | 6.140.300 | 0,17 |
| 31 | 21:11:12 | 531.000 | **6.216.744** | 0,31 |
| 32 | 21:12:12 | 1.310.132 | 5.723.896 | 1,89 |
| 33 | 21:13:12 | 589.636 | 5.545.176 | 1,82 |
| 34 | 21:14:12 | 525.128 | 5.642.460 | 2,35 |
| 35 | 21:15:12 | 882.072 | 5.303.388 | 2,34 |
| 36 | 21:16:12 | 576.424 | 5.426.664 | 1,78 |
| 37 | 21:17:13 | 682.292 | 5.547.388 | 0,76 |
| 38 | 21:18:13 | 576.720 | 5.670.484 | 0,32 |
| 39 | 21:19:13 | 1.130.124 | 5.808.780 | 0,18 |
| 40 | 21:20:13 | 994.484 | 5.945.684 | 0,27 |
| — | (DONE 21:21:13Z) | — | — | — |

- Thống kê (tính bằng code trên 40 mẫu): min **342.452 kB lúc
  21:03:12Z**; max **2.968.192 kB lúc 20:47:12Z = 2.899,6 MiB
  = 47,2% guard**; trung bình 996.055 kB; Balloon min
  **3.955.436 kB lúc 20:47:12Z**, max **6.216.744 kB lúc
  21:11:12Z** (chỉ 1 mẫu ở max), trung bình ~5.574.000 kB.
  **0 mẫu ≥ 6.144 MiB.** Gate A (≥1.048.576 kB): **14/40 mẫu**
  (mẫu 1, 2, 5–14, 32, 39 — tập trung đầu series + 2 lần xả
  sau). Load1 0,08–2,44.
- **Hình dạng: XẢ LỚN đầu series rồi phình lại, wobble, KHÔNG
  ghim trần.** Balloon từ 5,54M (20:46:12Z) **xả ~1,58M kB**
  xuống 3,96M lúc 20:47:12Z (avail +1,61M kB lên đỉnh series
  2,97M) — **xả lớn nhất trong 1 phút của các đợt gần đây**
  (đợt 140 xả lớn nhất chỉ ~260k kB; đợt 139 wobble ~1M kB).
  Xả này trùng lúc attempt1 của T4 vừa xong (exit 20:46:41Z,
  WebKit thoát giải phóng RAM) — **tương quan, không kết luận
  nhân quả** (T5 không đo được tiến trình nào giữ/xả balloon).
  Sau đó balloon phình lại đơn điệu ~+150–200k kB/phút lên
  6,12M (21:03:12Z), wobble nhẹ (xả ~215k lúc 21:04:12Z,
  ~493k lúc 21:12:12Z, ~339k lúc 21:15:12Z) rồi phình lại;
  **KHÔNG BAO GIỜ chạm trần kẹt 6.443.824 kB** (max 6.216.744,
  còn cách trần ~227k kB). Lúc đóng (21:22:30Z, ngoài series):
  avail **741.040 kB**, balloon **5.527.072 kB** (đã xả khỏi
  ~5,99M lúc 21:22:16Z).
- **Đối chiếu T9 (chủ quản birefnet):** T9 sampler dài chạy
  song song — nếu cửa sổ guard mở sau khi T5 đóng (21:22Z),
  T9 là luồng bắt được theo quyết §12.3(d) đợt 138. Trong
  phiên T5, đỉnh cao nhất chỉ 47,2% guard — **không có cửa sổ
  nào, không ai thử birefnet**. u2net vẫn là fallback chính
  thức.
- **T5 KHÔNG thử birefnet** (brief loại trừ; việc của T9 theo
  quyết §12.3(f) đợt 137). Birefnet vẫn 0 lần chạy thành công
  trong gói (tính tới lúc T5 đóng).

## 6. Headroom inotify + disk + vite

### 6.1 Headroom (probe K8, trần 63747) — ĐÃ DƯỚI NGƯỠNG BÁO

| Thời điểm | Headroom | Bối cảnh |
|---|---|---|
| Đợt 136 cuối (T5) | 2276 | boot 1ca1feaa |
| Đợt 137 mở boot 1 / mở boot 2 / cuối (T5) | 2178 / 2168 / 2168 | boot 2104246b / 17db9652 |
| Đợt 138 mở / mở boot 2 / cuối (T5) | 2065 / 2058 / 2056 | boot #94? / 914964c3 |
| Đợt 139 mở (T5) / cuối (T5) | 1950 / 1948 | boot 541524e2 |
| Đợt 140 mở (T5) / cuối (T5) | 1840 / 1838 | boot af558fb5 / 90392aa5 |
| **Đợt 141 mở (T5, 20:41:59Z)** | **1737** | **boot 2c0efe57, headroom-open.txt** |
| **Đợt 141 cuối (T5, 21:22:16Z)** | **1720** | **boot 2c0efe57, headroom-end.txt** |

- Giảm −101 so với cuối đợt 140 (1838 → 1737) rồi −17 trong
  phiên (1737 → 1720); chuỗi dài hạn tiếp tục giảm đều
  (~100–110/đợt, 11 đợt gần nhất). **Lần đầu tiên DƯỚI ngưỡng
  báo user (< ~1.800)** — đúng như dự báo đợt 140 §6.1/§9.4
  ("đợt 141 gần như chắc chắn chạm ngưỡng"). **T10 BÁO PARENT
  RÕ** để parent quyết có đưa lên user hay không (quyết
  §12.3(j) đợt 137 chỉ nói "theo dõi" dưới ngưỡng — nay đã
  chạm, không còn là "chỉ theo dõi" ở đợt sau).
- Inotify fd cell-visible (`ls /proc/*/fd | wc -l`, cùng cách đếm
  các đợt): **399 (lúc mở)** → **407 (lúc đóng)** — watch giữ
  ngoài cell như các đợt trước (~61k watch ngoài cell theo T9).

### 6.2 Disk

- Overlay `/`: 7,5G tổng, 499M đã dùng, **6,8G trống (7%)** lúc
  mở (20:43Z) → lúc đóng tương tự (không đo lại — không có
  ghi file lớn nào trong phiên T5 ngoài log/harness).
  `/tmp` tmpfs 512M, 512M trống lúc mở.
- Không có ENOSPC nào ngoài ENOSPC inotify có chủ đích của probe
  K8 (errno 28 khi hết watch — đó là cách đo headroom, không
  phải lỗi disk).

### 6.3 Vite chạy được không

- `node_modules/.bin/vite` (repo root, monorepo) tồn tại;
  `vite --version` = **vite/6.4.5 linux-x64 node-v24.22.1**
  (chạy được, kiểm 20:43Z). T5 KHÔNG chạy dev server / build
  (không sửa production; việc của T8). Xem F-141-T5-2 về đường
  dẫn kiểm lần đầu.

## 7. EPERM scan + WFS #47 + async .writeFile stray check

### 7.1 Live probe — thuộc T2, T5 chỉ đối chiếu (không chạy probe riêng)

- **Probe #60 (T2-141): ok=2 fail=0, boot=2c0efe57, 20:45:15Z**
  (`eperm-probe-v2.log`: dòng `boot changed af558fb5 ->
  2c0efe57` + dòng probe #60; T2 đã đóng cờ round141-t2.done
  21:06Z). Trước probe, status DEAD (heartbeat #59 age 11.074 s
  — đúng, heartbeat từ probe #59 trên boot cũ af558fb5; death
  được ghi vào log kèm dòng `boot changed`, không phải im lặng).
  Probe #60 là probe đầu tiên trên boot 2c0efe57.
- **Mù #60 ĐÃ ĐÓNG HOÀN TOÀN (T2-141: 3 đoạn, 2 reboot)** —
  việc T2/T10 phân xử tiếp; T5 chỉ ghi nhận, không tự chạy
  probe chéo để không đếm trùng sóng.
- T5 KHÔNG chạy probe riêng (phối hợp T2 — tiền lệ T5-137/
  T5-138/T5-139/T5-140).

### 7.2 Sóng EPERM — phân loại (T5 tự kiểm probe log)

- Log `hidden_files/eperm-probe-v2.log`: grep
  `vẫn bật|đã tắt|sóng EPERM|hasEperm` = **0 dòng** (tính tới
  lúc T5 đóng; lần kiểm cuối 21:22Z — log dừng ở probe #60).
- Các dòng DEAD gần nhất đều là heartbeat-age + kèm dòng
  `boot changed` (reboot, không phải EPERM): #59→#60
  (af558fb5→2c0efe57, age 11.074 s).
- `eperm-now.txt` ở repo root vẫn chỉ chứa `x` + newline (không
  đổi từ đợt 137–140).
- **Kết luận T5: 0 sóng EPERM thật trong probe log.** Sweep của
  T2-141 (xem LIMITS T2-141) đồng thuận; EPERM vẫn KHÔNG được
  tuyên bố là đã hết (quy ước đứng).

### 7.3 WFS scan #47 (T5 chạy, 20:42:11–20:42:33Z, 22 s, có SCAN-END)

- Chạy script `scan-wfs.sh` v6 đợt 94 (bản T2 trong round139-t2,
  copy sang round141-t5, **đổi OUT round140-t5 → round141-t5
  TRƯỚC khi chạy và verify bằng grep** — bài học F-138-T5-1 đã
  áp dụng đúng: grep OUT= chỉ ra đúng 1 dòng round141-t5, không
  còn tham chiếu round cũ nào trong script; grep `round140` sau
  sed = 0). Kết quả:
  - NEWSTD: **944 dòng / 264 file** (phạm vi 3.170 file);
  - R7b đối chiếu: **969 dòng / 281 file** (phạm vi 12.563 file);
  - copies: **25 dòng / 17 file** — y hệt lần 43, 44, 45, 46.
  - Đối chiếu chéo: 944+25=969=R7b, **chênh 0**.
- **+9 dòng / +3 file so với lần 46 (T5)** (935/261 → 944/264),
  giải thích TRỌN VẸN bằng diff file-thô trực tiếp (file thô #46
  còn nguyên trong round140-t5/):
  | Phạm vi | #46 (T5, 17:40:27Z) | #47 (T5, 20:42:11Z) | Delta |
  |---|---|---|---|
  | NEWSTD scope | 3.163 | 3.170 | +7 file, 0 file mất |
  | NEWSTD | 935/261 | 944/264 | +9/+3 |
  | R7b | 960/278 | 969/281 | +9/+3 |
  | copies | 25/17 | 25/17 | 0 |
  - 7 file mới trong scope = đúng 7 file `docs/` đợt 140
    (aggregate + T2/T4/T5/T6/T7/T8 LIMITS); 0 file mất. Trong
    7 file mới, chỉ 3 file có hit: T2-140 +7, T5-140 +1,
    aggregate-140 +1 (= +9); 4 file còn lại 0 hit. Diff
    wfs-newstd.txt #46→#47 chỉ ra đúng 3 dòng thêm, không file
    nào đổi số hit, không file nào mất hit.
- **Kết luận: 47 lần quét liên tiếp chênh 0** (theo nghĩa T2 dùng:
  NEWSTD+R7b+copies đối chiếu khớp, delta giải thích hết bằng
  file mới). Không có bằng chứng writeFileSync bị thay thế/làm
  sai lệch trong mù #60.

### 7.4 Đối chiếu chéo T2 vs T5 (scan #47 — 2 lần quét độc lập)

- T2-141 chạy scan #47 của mình (xem LIMITS T2-141 + nhật ký
  ngày 19/11): NEWSTD **944 dòng / 264 file** (phạm vi 3.170),
  R7b **969/281**, copies 25/17; 944+25=969 ✓.
- T5-141 scan #47 **20:42:11–20:42:33Z**: NEWSTD 944/264
  (3.170), R7b 969/281 (12.563), copies 25/17; 944+25=969 ✓.
- Delta T2−T5: **số đếm Y HỆT, scope Y HỆT** (cả NEWSTD lẫn
  R7b — lần này khớp cả scope, khác đợt 140 còn lệch +1 file
  do T6-140 tạo giữa 2 lần quét). **Hai lần quét độc lập khớp
  nhau hoàn toàn — chênh 0 được củng cố lần thứ hai trong đợt
  này.**

### 7.5 Async `.writeFile(` — vẫn đúng 2 vị trí đã biết, 0 stray

- 2 dòng chứa `.writeFile(` trong code (apps + packages, không
  tính .md, không tính dist): vẫn đúng 2 helper đã biết — 0 stray:
  - `apps/web/scripts/eperm-retry.mjs:71` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/src/services/epermRetry.js:116` (trong hàm
    `writeFileEpermRetryAsync`), mtime 10/11 không đổi
  - `apps/desktop/dist/services/epermRetry.js:116` — bản build
    (dist) của cùng helper trên, mtime 11/11 12:13:59Z không đổi;
    dist nằm ngoài phạm vi quét WFS nên không làm lệch số đếm.
- Phương pháp: pattern `\.writeFile\(` (có dấu chấm) — như T2-137
  §2.8. **0 stray.** Không có bằng chứng async writeFile bị dùng
  để né EPERM trong mù #60.

## 8. dmesg / journalctl — KHÔNG ĐỌC ĐƯỢC (đã chấp nhận theo §12.3(h))

- `dmesg`: 1 dòng duy nhất — `dmesg: read kernel buffer failed:
  Operation not permitted` (bị chặn EPERM trong cell, như đợt
  136–140). `journalctl -k --no-pager`: `-- No entries --`
  (rỗng, như các đợt trước).
- Quyết parent đợt 137 §12.3(h): **CHẤP NHẬN bước 4 như hiện tại
  (ps/meminfo/vite-HTTP/journalctl), KHÔNG can thiệp host để lấy
  dmesg.** T5 chỉ ghi nhận, không tự sửa chẩn đoán của T8.

## 9. Nợ mở sang đợt sau

1. **Birefnet: vẫn 0 lần chạy thành công; không có cửa sổ guard
   nào trong phiên T5** (max 2.968.192 kB = 47,2% guard lúc
   20:47:12Z — cao nhất trong các series T5 gần đây nhưng vẫn
   xa guard; balloon KHÔNG ghim trần, max 6.216.744 kB). T9
   sampler dài là luồng bắt cửa sổ nếu có sau khi T5 đóng; guard
   6.144 MiB GIỮ NGUYÊN (quyết §12.3(d) đợt 138). u2net là
   fallback chính thức.
2. **Ngưỡng tickCost ≤60 ms: GIỮ** (quyết §12.3(c)). Lượt yên
   #17 (T4) MỞ poll #2 (RAM 1485 MB) và attempt1 **20/20 XONG**
   (exit 0, 20:46:41Z) — lần đầu attempt ĐẦY ĐỦ của lượt yên
   #17; verdict thuộc T4. P1 28/28, P3 24/28, P7 14/14 (cộng dồn
   giữ nguyên); DEF v0.5 (P5 34–52 ms + P3' stall-based) đã chấp
   nhận, T3 viết ở đợt 138 — P3' vẫn chưa được kiểm lần nào.
3. **Headroom ĐÃ DƯỚI NGƯỠNG BÁO (1720, F-141-T5-1):** T10 BÁO
   PARENT RÕ — đợt 142 sẽ còn thấp hơn nếu đà ~100/đợt giữ
   nguyên (chỉ là phép chia đà, không phải dự báo). Quyết parent
   đợt 137 §12.3(j) chỉ nói "theo dõi" dưới ngưỡng — nay đã
   chạm nên cần parent quyết trước.
4. **Cache apt sống/không sống qua reboot là KHÔNG NHẤT QUÁN
   (F-141-T5-4):** đợt 140 boot 2: 0 .deb; đợt 141 boot: 178 .deb.
   T5 đợt sau vẫn kiểm cache ngay lúc mở boot mới, trước khi kết
   luận replay "sẽ nhanh vì cache" (bài học F-140-T5-3 giữ
   nguyên ở dạng yếu hơn: không giả định cache sống).
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 140 §11: **mù
   #60 ĐÃ ĐÓNG HOÀN TOÀN (T2-141, chuỗi đóng hoàn toàn thứ tư
   liên tiếp #57/#58/#59/#60); gap #97?→#98? = [7.089, 7.109] s
   + gap #98?→#99? = [7.266, 7.286] s ĐỀU ĐÃ CHỨNG NHẬN → CERT 60
   / FULL 75**; **khung chết #97? ứng viên merged 46 s + khung
   chết #98? ứng viên merged (19:46:47Z, 19:54:12Z]** (T2-141 —
   chờ parent quyết khung chết #96?/#97?); G1 chờ user quyết;
   ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release
   gate không đổi + KHÔNG push khi user chưa nhắn "push đi";
   R9 (a) vẫn chờ user (số đếm VẪN LÀ 16).

## 10. Kiểm chứng hồi quy + file đổi

- `preview.tsx`: KHÔNG ĐỔI bởi T5 (530e10a7 lúc mở → 530e10a7 lúc
  đóng). `media.ts`: KHÔNG đổi (`2c384ed1`);
  `apps/web/vite.config.ts`: KHÔNG đổi (`ee80d093`).
  Postboot script: sửa 1 lần (`5bd00bf7…` → `1ebcb776…`,
  header + say, KHÔNG đổi logic — xem §3.3).
- `tsc` / `vite build`: KHÔNG chạy (không sửa production).
- TTS 39: không kiểm (CẤM). Birefnet: không thử (không thuộc brief
  T5; RAM xa guard — xem §5).
- EPERM: T5 KHÔNG chạy probe riêng (phối hợp T2 — T2-141 probe #60
  ok=2 fail=0). WFS scan #47 do T5 chạy (xem §7.3; OUT đã sửa
  đúng TRƯỚC khi chạy — không lặp lại F-138-T5-1); T2 quét độc
  lập khớp hoàn toàn cả số đếm lẫn scope (xem §7.4).
- Postboot: PASS exit 0 ngay poll0 (20:40:47Z) + poll0b
  (20:44–20:45Z); cờ ghi 20:41:02Z poll=0, T4 đã đọc poll #1 và
  mở cửa yên #17 poll #2. **Watcher: KHÔNG lập (replay đã xong
  trước khi T5 mở). Luật (C): KHÔNG kích hoạt.**
- Headroom: 1737 (mở) → 1720 (cuối) — ĐÃ DƯỚI ngưỡng báo ~1.800.
- RAM phiên T5 (n=40, đầy đủ): 342.452–2.968.192 kB (Balloon
  3.955.436–6.216.744 kB, xả lớn ~1,58M kB lúc 20:47:12Z, KHÔNG
  ghim trần). RAM lúc đóng 741.040 kB (21:22:30Z, balloon
  5.527.072 kB).
- **Reboot GIỮA LƯỢT: 0 lần** (boot 2c0efe57 sống suốt phiên).
- **started_at lượt 141:** T5 KHÔNG kiểm đợt này (muse.db —
  việc của T7/T10). Lưu ý: KHÔNG có reboot giữa lượt trong phiên
  T5 nên giả thuyết viết lại (đã kiểm chứng 8 lần ở các đợt
  trước) DỰ BÁO started_at KHÔNG bị viết lại trong phiên T5 —
  T10 kiểm lại lúc đóng (T5 ghi rõ đây là dự báo từ giả thuyết,
  không phải kết quả kiểm).

## 11. Sai số của T5 đợt này (F-141-T5-N)

- **F-141-T5-1 — Headroom CHẠM DƯỚI ngưỡng báo user lần đầu
  (MỚI, không phải lỗi đo):** mở 1737 (20:41:59Z) → cuối 1720
  (21:22:16Z), giảm −101 so với cuối đợt 140 (1838) rồi −17
  trong phiên; đà dài hạn ~100–110/đợt giữ nguyên (11 đợt gần
  nhất). Đúng như dự báo đợt 140 §6.1/§9.4. **Hậu quả:** chưa
  ảnh hưởng kỹ thuật nào (probe K8 vẫn đo được; vite/WebKit
  chạy được) — chỉ ảnh hưởng ngưỡng báo: quyết §12.3(j) đợt 137
  ("chỉ theo dõi dưới ngưỡng") nay đã chạm, cần parent quyết
  trước khi user hỏi. **T10 BÁO PARENT RÕ ĐIỂM NÀY.**
- **F-141-T5-2 — (ghi chú) Đường dẫn kiểm vite lần đầu sai:**
  lần kiểm đầu dùng `apps/web/node_modules/.bin/vite` → "No such
  file or directory"; binary thực tế nằm ở repo root
  `node_modules/.bin/vite` (monorepo) — kiểm lại ra vite/6.4.5
  linux-x64 node-v24.22.1. **Hậu quả:** không ảnh hưởng số liệu
  nào (vite vẫn chạy được, chỉ sai đường dẫn lần đầu). Bài học:
  kiểm vite ở repo root trước.
- **F-141-T5-3 — (ghi chú) ram-end.txt bản đầu ghi nhầm dòng
  SAMPLER_DONE thay vì mẫu cuối:** T5 đã viết lại file với mẫu
  cuối (21:20:13Z, avail 994.484 kB) + meminfo lúc đóng
  (21:22:30Z). **Hậu quả:** không mất dữ liệu (ram-sampler.log
  còn nguyên 40 mẫu + dòng DONE); chỉ là file tóm tắt.
- **F-141-T5-4 — (ghi chú) Cache apt sống/không sống qua reboot
  là KHÔNG NHẤT QUÁN (MỚI):** đợt 140 boot 2 (90392aa5): cache
  **0 .deb / 0 byte** (F-140-T5-3 phá giả định "cache sống");
  đợt 141 boot (2c0efe57): cache **178 .deb / 156M** (sống).
  Hai quan sát đối lập nhau — không rút được quy luật nào
  (không phải "cache luôn sống" cũng không phải "cache luôn
  chết"). **Hậu quả:** không ảnh hưởng số liệu kỹ thuật nào
  (replay boot này xong nhanh nhờ cache sống) — chỉ ảnh hưởng
  dự báo: T5 đợt sau vẫn kiểm cache ngay lúc mở boot mới,
  không giả định trước.

## 12. File đã đổi/thêm (stage, KHÔNG push) + cách chạy lại

- `docs/PHASE9_ROUND141_T5_INFRA_LIMITS.md` (file này — mới).
- `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa 1 lần:
  header + dòng `say`; md5 cuối `1ebcb776…`; không đổi logic).
- Harness trong hidden_files (KHÔNG stage): `round141-t5/`
  (t5-start.txt, ram-open.txt, ram-sampler.log (40 mẫu đầy đủ)
  + ram-sampler.sh, ram-sampler.nohup.log, ram-end.txt,
  headroom-open.txt (1737), headroom-end.txt (1720),
  k8-headroom-highcap.py (bản copy từ round140-t9),
  apt-lists.txt (39 dòng), scan-wfs-t5.sh (bản copy — OUT đã sửa
  ĐÚNG round141-t5 TRƯỚC khi chạy, xem §7.3),
  scan-meta.txt, files-newstd.bin, wfs-newstd.txt, files-r7b.bin,
  wfs-r7b.txt, files-copies.txt, wfs-copies.txt — 7 file kết quả
  scan #47, scan-wfs-run.log, t5-postboot-poll0.log (PASS exit 0),
  t5-postboot-poll0b.log (PASS exit 0 sau sửa header),
  `POSTBOOT_PASS` (cờ gate-visible — boot 2c0efe57, ghi 20:41:02Z
  poll=0; T4 đã đọc poll #1, mở cửa yên #17 poll #2)).
- Batch stage: `~/workspace/repo-1-push/paths-loop/
  phase9-round141-t5-infra.txt` (NUL-delimited; 2 file repo trên)
  — tạo + verify read-back sau khi viết xong LIMITS này.
- Cờ done: `hidden_files/round141-t5.done` (ghi rõ: boot 2c0efe57
  (#99?) replay XONG (1545/221/462, boot +3m57s, KHÔNG GAP, cache
  sống 178 .deb) trước khi T5 mở, postboot PASS poll0, cờ
  20:41:02Z, T4 mở cửa yên #17 poll #2 + attempt1 20/20 XONG
  20:46:41Z; headroom 1737 → 1720 ĐÃ DƯỚI ngưỡng báo ~1.800
  (T10 báo parent); balloon xả lớn ~1,58M kB, KHÔNG ghim trần,
  max RAM 47,2% guard — không cửa sổ birefnet; WFS #47 chênh 0;
  KHÔNG reboot giữa lượt).

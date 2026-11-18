# PHASE9_ROUND117_T5_F6P60MS_LIMITS — F6' WebKit ≤60 ms: lượt yên THEO DÕI — KHÔNG CHẠY ĐƯỢC (replay #53 không tới)

> Luồng T5, đợt 117, lượt cron 15:35 +07 15/11/2026 (bắt đầu ~08:35Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> Nợ #5 đợt 116 (LIMITS gộp §10 mục 5): chỉ THEO DÕI ngưỡng WebKit
> ≤60 ms đã chốt ở đợt 116 (S5 lượt yên xác nhận lần 5: attempt3
> 20/20 pass, tickCost median 49,5 ms, p90 75,0 ms, n=570, lớp B mới
> gồm B5 RAM-mid 5/5, F6' 100%/100% n=71) — chạy MỘT lượt yên xác
> nhận theo đúng phương pháp S5 trên cây 03bf029f không đổi.
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào. Không
> đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
>
> **Kết quả chính — KHÔNG CHẠY ĐƯỢC LƯỢT YÊN NÀO TRONG ĐỢT NÀY.
> KHÔNG có số tickCost mới, KHÔNG verdict GIỮ/MỞ LẠI nào được rút ra
> từ lượt đo — vì không có lượt đo nào diễn ra.**
> 1. **Gate 0 (postboot boot #53) KHÔNG ĐẠT trong cả 3 lần thử + 6
>    lần poll 30 phút:** postboot-check exit 1 mọi lần (thiếu 5 lib
>    hệ thống + thư mục GST + 11 package apt WebKit/GST). Replay hệ
>    thống sau boot #53 KHÔNG HỀ CHẠY — 0 hoạt động apt/dpkg nào
>    trong dpkg.log / apt history / journal suốt 65 phút sau boot
>    (T6 độc lập xác nhận cùng kết luận: "replay #53 đình trệ 55
>    phút 0 hoạt động"). T5 KHÔNG tự chạy `--repair` theo đúng
>    prereg-t5 (tránh đụng luồng hạ tầng; chỉ check-only).
> 2. **Attempt1 + attempt2: gate A không mở trong 10 phút mỗi lần**
>    (T6 giữ lock + hog, rồi T3/T4 hog tải cao load1 tới 55,97,
>    RAM sụt tới 500 MB). Attempt3: gate 0 không đạt (postboot #53
>    FAIL + 1 apt-proc lúc kiểm).
> 3. **Cây 03bf029f VẪN NGUYÊN VẸN, KHÔNG ĐỔI SUỐT ĐỢT** (kiểm trước/
>    sau mọi lần thử: 03bf029f→03bf029f). T2 có sửa tạm preview.tsx
>    sang af4d5753 (H3e) rồi HOÀN TÁC về 03bf029f, cờ round117-tree
>    chốt NO-CHANGE, md5-final 03bf029f — T5 chờ đúng lệnh, KHÔNG đo
>    trong lúc cây đang đổi.
> 4. **Hồi quy nhẹ trên cây 03bf029f: tsc exit 0 (sạch),
>    ghostBlend 15/15 PASS** — cây đo vẫn tốt, chỉ hạ tầng WebKit
>    sau reboot #53 chưa sẵn sàng.
> 5. **Verdict ngưỡng: GIỮ nguyên trạng thái S5 ("GIỮ — đã có lượt
>    yên xác nhận")** — không có bằng chứng mới nào để mở lại hay
>    siết thêm. **Nợ lượt yên theo dõi CHUYỂN TIẾP sang đợt sau.**

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round117-t5/prereg-t5.md` — viết TRƯỚC
  mọi phép đo (08:39–08:41Z), đăng ký: lớp B gồm B5, gate 0 + lớp A,
  timeout 120 s/pass + JSON tăng dần, quy tắc quyết định ngưỡng
  (median ≤60 → GIỮ; >60 → MỞ LẠI nợ), kế hoạch theo dõi
  stale-ghost 2 event riêng biệt, lấy mẫu load1/RAM giữa lượt.
  T5 tuân thủ đúng prereg — xem §1 (không có lượt đo nào nên không
  có nhánh quyết định nào được kích hoạt).
- **Boot trong đợt: HAI boot — #52 rồi #53.**
  - Boot #52 (`uptime -s` 2026-11-15 08:29:12Z, boot_id
    `22536366-8716-46f0-a999-cd4199080854`): T5 bắt đầu trên boot
    này (~9' tuổi lúc 08:38Z). Postboot #52 đã PASS nhờ T8 đợt 117
    (replay #52 kẹp được (6'28", 8'44"], 11/11 package đủ).
  - Boot #53 (`uptime -s` 2026-11-15 09:47:08Z, boot_id
    `574e3d6b-4a99-4b6b-b6e4-307148232a98`): reboot giữa đợt, đúng
    lúc T5 đang chờ cửa yên (giữa attempt2 và attempt3). Cell của T5
    restart cùng lúc (một lệnh sleep 600 của T5 bị gián đoạn bởi
    runtime restart — xem §5). Mù #35 mở từ 21:04:50Z 14/11 chứa
    #49/#50/#51 — #52/#53 nhiều khả năng cũng nằm trong mù #35
    (T5 không đụng bookkeeping mù, chỉ ghi boot id để đối chiếu).
    Nhịp reboot ~1h18' (#52→#53) — ngắn hơn nhịp ~2h trước đó.
  - Postboot #53: CHƯA BAO GIỜ PASS trong đợt này (xem §2).
- **Cây đo `03bf029f…`** (= cây S5 đo đợt 116). T2 đợt 117 sửa tạm
  preview.tsx sang `af4d5753…` (H3e, một lần đọc video mỗi tick),
  cờ `hidden_files/round117-tree` status EDITING 09:46:18Z — T5
  CHỜ đúng lệnh task, KHÔNG đo trong lúc cây đang đổi. T2 sau đó
  REVERT tạm để chạy B1 baseline (md5 về 03bf029f 10:00:07Z), rồi
  BỎ H3e hẳn (verdict 10:0xZ), cờ chốt **NO-CHANGE, md5-final
  03bf029f** 10:12:30Z (fix chỉ giữ dạng patch h3e-fix.patch +
  apply-h3e.py). Cây attempt3 đo (nếu chạy được) vẫn là `03bf029f…`.
  T5 không sửa production (md5 trước = sau mọi lần thử).
- **Fixture `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.** GT frames
  `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0 — NHƯNG
  không chạy được trên boot #53 vì thiếu lib hệ thống (xem §2).
- **Dry-run analyzer TRƯỚC khi đo: PASS.** `analyze-t5-tickcost.py`
  + `analyze-t5-wallbands.py` trên JSON S5 attempt3 tái tạo đúng
  median 49,5 / p90 75,0 / wallbands S5 §1.4 (log
  `analyze-t5-dryrun-{tickcost,wallbands}.txt`) — analyzer copy từ
  S5 hoạt động đúng, sẵn sàng cho lượt đo thật (không có lượt nào
  để chạy).
- **Inotify headroom:** T8 đợt 117 đo cuối boot #52: 948→925
  (reboot không hồi). Vite chỉ chạy với
  `server.watch.ignored: ["**/**"]` (0 watch) — T5 không chạy vite
  lần nào đợt này (không lần thử nào qua gate).
- **Vite lock v2-ONLY** (`apps/web/scripts/vcut-vite-lock-v2.sh`,
  `VITE_LOCK_AGING_S=600`). T5 không acquire lock lần nào (không
  lần thử nào tới bước chạy probe). Lock stale sau reboot #53: T3
  giữ lock cũ (boot #52) lúc 09:44:50Z; sau reboot, T2 acquire mới
  09:48:50Z với boot #53 — stale recovery hoạt động (T5 chỉ quan
  sát, không tự xóa lock ai).
- **RAM lúc bắt đầu đợt: ~1318–1858 MB** (08:38–08:41Z) — trên
  ngưỡng ~1 GB. RAM dao động mạnh cả đợt (181 → 2673 MB); đáy
  181 MB lúc 10:00:07Z (T2 chạy B1 baseline + hogs), 336–528 MB
  trong các pha hog của T3. Xem §1.5.

## 1. Ba lần thử — KHÔNG lần nào chạy được probe

### 1.1 Attempt1 (08:41:20–08:51:21Z, boot #52): gate A không mở

Gate 0 ĐẠT (postboot #52 PASS — T8 đã PASS cho boot #52 trước đó;
log `postboot-t5-attempt1-gate0.log`). Gate A poll 10 lần — KHÔNG mở:

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1–3 | ~1,6–2,7 / ~1,8 | 1836→950 MB | T6 (port 5186) / 10 | T6 giữ lock suốt |
| 4 | 1,60 / 1,76 | 950 MB | T6 / 10 | RAM <1024, T6 giữ lock |
| 5–9 | (xem poll-t5.log) | 950–1193 MB | T6 / 10–12 | T6 giữ lock, RAM quanh ngưỡng |
| 10 | 0,88 / 1,19 | 1083 MB | T6 / 12 | load/RAM đã đủ, chỉ lock + blockers chặn |

Hết 10 phút gate không mở → exit 5, KHÔNG chạy probe (đúng prereg).
Nguyên nhân: T6 giữ vite lock liên tục (thread=t6, pid 7969, port
5186 — TRÙNG cổng vite T5 chọn; T6 giữ 779 s, nhả 08:55:05Z theo
chain-t6.log) + 10–12 blocker process (vite/probe của T6 và luồng
khác) + RAM có lúc <1024 MB. Ghi nhận: T6 cũng dùng cổng 5186 —
nếu T5 đo sau này, gate A (blockers=0) vẫn bảo vệ khỏi việc probe
nhầm vite của T6; nhưng nên đổi cổng T5 sang 5187 ở đợt sau để
tránh trùng hoàn toàn.

### 1.2 Attempt2 (09:06:26–09:16:26Z, boot #52): gate A không mở

Gate 0 ĐẠT. Gate A poll 10 lần — KHÔNG mở. Bối cảnh: các luồng
khác vào pha hog tải cao (T3 dial chr-code-blur, T4 hold lock):

| poll | load1/load5 | RAM | lock/blockers | Ghi chú |
|---|---|---|---|---|
| 1 | 15,96 / 14,31 | 923 MB | T2 / ? | tải cao ngay từ đầu |
| giữa | 3,42–4,18 / 11,30–11,85 | 563–745 MB | T2/T3 / 2–12 | RAM sụt <1024, load5 >11 |
| 10 | ~3–4 / ~11 | ~700 MB | T3 / 12 | hết 10 phút |

Hết 10 phút gate không mở → exit 5, KHÔNG chạy probe.
Nguyên nhân: tải cao kéo dài (load1 đỉnh 55,97 lúc 09:21:16Z trong
poll 5 phút; load5 11–18) + RAM sụt tới 500–563 MB (sát ngưỡng B5
500 MB — nếu có đo thì B5 đã nguy hiểm) + lock luân phiên T2/T3/T4
giữ. T3 lúc này chạy dial chr-code-blur-s80 với 64 hog
(`node -e while(true){Math.sqrt...}`, driver117t3.sh).

### 1.3 Reboot #53 (09:47:08Z) — giữa attempt2 và attempt3

- Cell T5 restart (runtime restart): lệnh `sleep 600` của T5 bị
  gián đoạn, không có kết quả cuối xác nhận (log
  `exec-logs/proc_0dd375190587.log` trống). T5 kiểm lại trạng thái
  bằng lệnh mới, không chạy lại phép đo nào từ lệnh dở dang.
- Poller 5 phút của T5 chết theo restart → T5 khởi động lại poller
  09:49:54Z (pid 3852), ghi chú vào chain-t5.log.
- T2 lúc này đang EDITING cây (md5 af4d5753, H3e) — T5 chờ cờ cây,
  không đo trên cây đổi (xem §0).
- T3 driver chết theo reboot (pid 21924 không còn); T3 khởi động
  lại sau reboot và chạy probe Chromium chr-code-blur-s80b (250
  clip, `--skip-quiet`) — renderer Chromium 962 MB RSS, là nguyên
  nhân chính RAM sụt 336–528 MB trong khung 10:12–10:25Z.

### 1.4 Attempt3 (10:12:42–10:14:46Z, boot #53): gate 0 KHÔNG ĐẠT

Cây đã về NO-CHANGE 03bf029f (T2 bỏ H3e 10:12:30Z, 12 giây trước
khi attempt3 bắt đầu). Nhưng gate 0 FAIL cả 2 try:

| try | postboot_exit | apt_procs | Ghi chú |
|---|---|---|---|
| 1 | 1 | 1 | postboot #53 FAIL (thiếu lib/GST/apt) |
| 2 | 1 (10:13:46Z) | 1 | như trên |

→ exit 6, KHÔNG mở gate lớp A, KHÔNG chạy probe (đúng prereg).
Chi tiết postboot #53 FAIL (log
`postboot-t5-attempt3-gate0.log`, giống hệt mọi lần kiểm sau đó):
- FAIL libs: thiếu `libevent-2.1.so.7 libEGL.so.1 libavif.so.16
  libdw.so.1 libevdev.so.2` (kiểm trực tiếp bằng `ls`: 4 file đều
  không tồn tại).
- FAIL GST: `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` không tồn tại
  (file plugin hệ thống=0, debroot=269 — debroot còn đủ 269 file
  nhưng lib hệ thống thiếu nên MiniBrowser không khởi động được).
- FAIL apt: chưa cài 11 package: libevent-2.1-7t64
  gstreamer1.0-plugins-base/-good/-bad/-ugly/-gl/-libav/-x
  libavif16 libgstreamer1.0-0 libevdev2.
- PASS duy nhất: wrapper MiniBrowser đã vá K1.
- Kết luận script: "CHUA DU — chạy lại với --repair, hoặc chờ apt
  replay xong rồi chạy lại".

### 1.5 Gate 0 poll 30 phút (10:25:44–10:50:47Z): KHÔNG ĐẠT lần nào

Theo prereg-t5, sau attempt3 T5 poll lại gate 0 tối đa 30 phút
(check-only, KHÔNG --repair) — script `gate0-poll-t5.sh`, 6 lần
mỗi 5 phút (log `gate0-poll-t5.log`):

| poll | postboot_exit | apt_procs | load1 | RAM | Ghi chú |
|---|---|---|---|---|---|
| #1 10:25:46Z | 1 | 0 | 28,40 | 528 MB | T3 probe Chromium đang chạy |
| #2 10:30:46Z | 1 | 0 | 0,83 | 2673 MB | máy đã yên, chỉ thiếu lib |
| #3 10:35:46Z | 1 | 0 | 0,28 | 1484 MB | T3 probe xong, máy yên |
| #4 10:40:47Z | 1 | 0 | 0,26 | 995 MB | máy yên |
| #5 10:45:47Z | 1 | 0 | 1,70 | 1617 MB | máy yên |
| #6 10:50:47Z | 1 | 0 | 0,36 | 1312 MB | máy yên |

→ "GATE 0 KHONG DAT sau 30 phut poll — hoan luot theo prereg-t5"
(exit 6). **Kiểm cuối 10:52:12Z (boot+65') vẫn exit 1, FAIL y
hệt** (log `postboot-t5-final-53.log`).
- Điểm quan trọng: từ poll #2 trở đi máy ĐÃ YÊN (load1 0,26–1,70,
  RAM 995–2673 MB) — điều kiện lớp A coi như đã đủ, chỉ gate 0
  chặn. Nếu replay tới thì attempt4 đã chạy được ngay trong cửa sổ
  yên 10:30–10:52Z. Replay không tới nên không có lượt đo nào.
- Bằng chứng replay #53 KHÔNG chạy (không phải chạy chậm):
  `dpkg.log` chỉ có 2 dòng "startup packages configure" 09:48:02–
  03Z và KHÔNG CÓ entry nào sau đó (kiểm lại 10:52Z vẫn vậy);
  `/var/log/apt/history.log` TRỐNG; journal 09:53–09:57Z không có
  apt/dpkg/os-intent nào; `ps` không thấy apt-get/dpkg nào trong
  mọi lần kiểm (apt_procs=0 ở cả 6 poll); không có os-intent /
  unattended process nào đang chạy. Đối chiếu: replay #52 kẹp được
  (6'28", 8'44"] sau boot, cửa sổ chỉ rộng 2'16" — #53 đã quá
  +65' mà 0 hoạt động.
- **Xác nhận độc lập từ T6:** `round117-t6.done` ghi "replay #53
  đình trệ 55 phút 0 hoạt động" — T6 cũng chết attempt3 theo reboot
  #53 vì cùng gate 0 này (T6 cũng kiểm postboot #53 bằng file
  riêng `/tmp/t6-postboot-53g.log`, FAIL y hệt). Hai luồng độc lập
  cùng kết luận: replay #53 không chạy.
- T5 KHÔNG chạy `--repair`: prereg-t5 cấm rõ ("KHÔNG tự chạy
  --repair ... chỉ chạy lại check-only"). T8 (luồng hạ tầng đợt
  117) đã DONE từ 09:02Z — trước boot #53 — nên không còn luồng
  hạ tầng nào theo dõi replay #53 trong đợt này. Quyết định repair
  (nếu có) thuộc về parent/main chat, không phải T5.

### 1.6 RAM/load toàn đợt — RAM vẫn là nút thắt

- Poll 5 phút (17 mẫu 08:41–10:51Z) + gateA/gate0 (43 poll): RAM
  avail 181 → 2673 MB. Đáy 181 MB lúc 10:00:07Z (T2 chạy B1
  baseline + hogs); 336–528 MB trong pha probe Chromium của T3
  (renderer 962 MB RSS); 2673 MB lúc 10:30:46Z (sau khi T3 xong,
  các browser khác thoát).
- Load: nhiều cửa sổ yên thật về cuối đợt (load1 0,23–0,36 lúc
  10:35–10:50Z) nhưng load5 thường xuyên >2 do dư chấn các pha
  nặng (đỉnh load1 55,97 lúc 09:21:16Z; load5 18–34 trong pha hog
  T3/T4). Cửa yên mở muộn (sau 10:30Z) nhưng gate 0 đã chặn.
- Kết luận: với 9 luồng song song + reboot giữa đợt, cửa yên chỉ
  mở khi (a) cây chốt NO-CHANGE, (b) các luồng nặng xong việc,
  (c) RAM hồi >1 GB, (d) replay postboot đã xong — (a)(b)(c) đều
  đạt về cuối đợt, chỉ (d) không bao giờ đạt trên boot #53.

## 2. (b) unique-match + F6' + stale-ghost — KHÔNG ĐO ĐƯỢC

Không có JSON lượt đo nào nên KHÔNG chạy `analyze-t5-labellag.py`,
`analyze-t5-skiplatest.py`, `analyze-t5-lag5.py` trên dữ liệu mới
(chạy analyzer trên dữ liệu cũ S5 sẽ là báo cáo lại số cũ — T5
không làm). Trạng thái giữ nguyên từ S5 đợt 116:
- (b) unique-match: nomatch 0, lag ≥+5f: 0 (S5).
- Bar F6' (1)/(2): 100,0% / 100,0% (n=71) — F6' ĐÃ ĐÓNG từ L7.
- Stale-ghost P4 frame-26 + Q5 seq 282–285: không tái hiện trong
  lượt yên S5; không có lượt yên mới để theo dõi thêm.

## 3. Kiểm chứng hồi quy — cây không đổi, PASS

- `tsc` apps/web (`npx tsc --noEmit`): **exit 0** (log `tsc-t5.log`
  trống — sạch; chạy 10:36:35Z trên cây 03bf029f).
- `ghostBlend.probe.test.ts`: **15/15 PASS** ("15 kiểm chứng
  xanh"), chạy bằng `node --experimental-strip-types` từ gốc repo
  đúng đường dẫn `apps/web/src/lib/ghostBlend.probe.test.ts` (log
  `ghostblend-t5.log`). Lần chạy đầu sai đường dẫn (MODULE_NOT_FOUND)
  đã chạy lại đúng và PASS — ghi rõ để khỏi nhầm.
- `vite build`: KHÔNG chạy lại — N1 đã chạy PASS trên cùng cây
  `03bf029f…` đợt 112 (ghi rõ, không hiểu là đã chạy đợt này); T5
  không sửa production (md5 không đổi).
- preview.tsx md5 `03bf029f…` không đổi trong suốt 3 lần thử +
  kiểm cuối 10:52:12Z.
- Không sửa file production nào.

## 4. Sự cố hạ tầng trong lúc đo

1. **Reboot #53 giữa đợt (09:47:08Z, boot_id `574e3d6b…`):** cell
   T5 restart; lệnh sleep 600 bị gián đoạn không kết quả cuối (đã
   kiểm lại bằng lệnh mới, không chạy lại phép đo từ lệnh dở dang);
   poller 5 phút chết theo → khởi động lại 09:49:54Z. T3 driver
   chết theo reboot (pid 21924); T3 khởi động lại sau reboot. Mù
   #35 (mở từ 21:04:50Z 14/11) nhiều khả năng chứa thêm #52/#53 —
   chờ user quyết (T5 không đụng bookkeeping mù).
2. **T2 sửa cây giữa đợt (H3e):** preview.tsx sang af4d5753, cờ
   EDITING 09:46:18Z → revert tạm (B1 baseline) → BỎ H3e hẳn, cờ
   NO-CHANGE md5-final 03bf029f 10:12:30Z. T5 chờ đúng lệnh, không
   đo trên cây đổi. H3e chỉ còn dạng patch (T2 giữ).
3. **Replay #53 không chạy (0 hoạt động apt trong 65 phút):** đây
   là lần đầu tiên trong chuỗi boot #46/#47/#48/#52 (đều kẹp được
   replay) mà replay không tới — khác biệt cần luồng hạ tầng xem
   xét: replay kích hoạt bằng cơ chế nào, vì sao #53 không kích
   hoạt (T8 đợt 117 ghi #52 khởi động muộn +6'28"; #53 thì không
   khởi động luôn). T5 + T6 cùng xác nhận độc lập.
4. **Tải cao + RAM sụt đầu/giữa đợt:** load1 đỉnh 55,97; RAM đáy
   181 MB (T2 B1 hogs), 336–528 MB (T3 Chromium renderer 962 MB
   RSS). Về cuối đợt máy yên (load1 0,23–0,36, RAM 1312–2673 MB)
   nhưng gate 0 chặn.
5. **Trùng cổng vite 5186 với T6:** T6 giữ lock port 5186 suốt
   attempt1 của T5 (779 s). Gate A (blockers=0) đã bảo vệ T5 khỏi
   probe nhầm vite T6 — nhưng đợt sau T5 nên đổi sang cổng 5187.
6. **Vite lock v2:** T5 không acquire lần nào. Stale lock T3 (boot
   #52) sau reboot được thay bằng lock mới của T2 (boot #53,
   09:48:50Z) — stale recovery hoạt động, T5 chỉ quan sát.
7. **Dương tính giả đếm blocker/apt:** gate0 attempt3 ghi
   apt_procs=1 trong khi 6 poll sau đều 0 — khả năng cao là đếm
   nhầm process kiểm tra của luồng khác (T6 đang chạy postboot
   check tương tự) chứ không phải apt thật; dpkg.log/apt history
   trống củng cố rằng không có apt nào chạy. Ghi rõ để khỏi hiểu
   là replay đã chạy lúc đó.

## 5. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND117_T5_F6P60MS_LIMITS.md` — file này. **File duy
  nhất trong repo mà T5 thay đổi** (probe copy + analyzer + dữ liệu
  + run script đều ở hidden_files; fixture mp4 là binary local-only
  đã có từ M5, KHÔNG stage, md5 không đổi).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round117-t5-f6p60ms.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round117-t5/`
  (prereg-t5.md [viết trước khi đo],
  probe117t5-ghost-k7.webkit.mjs [copy S5, md5 `6603d8fa…`,
  node --check OK], analyze-t5-{tickcost,labellag,skiplatest,
  wallbands,lag5}.py [copy S5, md5 khớp bản S5],
  analyze-t5-dryrun-{tickcost,wallbands}.txt [dry-run trên JSON S5
  attempt3, tái tạo đúng median 49,5 / p90 75,0 / wallbands S5 §1.4],
  b.json [copy S5, md5 `078938cf…`],
  vite.t5-temp.config.mjs [copy S5, HMR tắt, watch.ignored 0 watch],
  run-t5.sh [adapt từ run-s5.sh: thread t5, port 5186, gate A kiểm
  md5 cây trực tiếp == 03bf029f + cờ round117-tree không EDITING],
  t5-attempt-inner.sh, check-classb-t5.sh [lớp B gồm B5],
  poll-t5.sh + poll-t5.log [17 mẫu 5 phút + gate0/gateA],
  poll-t5.nohup.log, poll-t5-restart1.nohup.log,
  gate0-poll-t5.sh + gate0-poll-t5.log [6 poll 30 phút, đều exit 1]
  + gate0-poll-t5.nohup.log,
  chain-t5.log, postboot-t5-attempt{1,2,3}-gate0.log [attempt1/2
  PASS trên boot #52; attempt3 FAIL trên boot #53],
  postboot-t5-gate0poll-{1..6}.log [đều exit 1],
  postboot-t5-final-53.log [exit 1, 10:52:12Z, boot+65'],
  run-t5-attempt{1,2,3}.nohup.log,
  tsc-t5.log [exit 0], ghostblend-t5.log [15/15 PASS]).
  JSON lượt đo: KHÔNG CÓ (không lần thử nào chạy probe — đúng
  prereg, không bịa số).
- Cờ xong: `hidden_files/round117-t5.done` (kèm verdict 1 dòng).

## 6. Nợ mở + đề xuất cho đợt sau

1. **Ngưỡng WebKit ≤60 ms: GIỮ nguyên trạng thái S5 ("GIỮ — đã có
   lượt yên xác nhận") — nợ lượt yên THEO DÕI CHUYỂN TIẾP sang đợt
   sau.** Không có lượt yên mới, không mở lại, không siết. Đợt sau
   chạy lại 1 lượt yên theo cùng prereg (gate 0 + lớp A + lớp B
   gồm B5) trên cây hiện tại (nếu cây vẫn 03bf029f) hoặc cây mới
   (nếu cây đổi — khi đó đo lại baseline trên cây mới, không dùng
   số S5 để chốt cho cây mới).
2. **Replay #53 không chạy — NỢ HẠ TẦNG MỚI, cần parent quyết:**
   (a) vì sao replay không kích hoạt trên boot #53 trong khi 4 boot
   liên tiếp trước đều kẹp được; (b) có nên cho luồng hạ tầng chạy
   `postboot-check.sh --repair` cho boot #53 (hoặc boot hiện tại
   lúc đó) khi replay đã quá hạn mà không chạy — hay vẫn giữ luật
   "chờ replay, không repair mù" của R9; (c) T6 cũng bị chặn bởi
   cùng gate 0 này (attempt3 chết theo reboot #53) nên nợ này chặn
   cả 2 luồng cần WebKit yên (T5 theo dõi ngưỡng + T6 ghost-seek).
   **Đề xuất:** ở lượt cron sau, nếu boot mới (sau reboot tiếp
   theo, dự kiến ~11:47Z theo nhịp ~2h) mà replay vẫn không tới
   trong ~15 phút thì luồng hạ tầng chạy --repair có kiểm soát
   (ghi rõ trước/sau, không repair trong lúc apt đang chạy) — quyết
   định thuộc về parent, T5 không tự làm.
3. **Stale-ghost P4 frame-26 + Q5 seq 282–285:** không có lượt yên
   mới nên không theo dõi thêm được — giữ nguyên trạng thái S5
   (đơn lẻ, không tái hiện trong lượt yên).
4. **Đổi cổng vite T5 sang 5187 ở đợt sau** (tránh trùng 5186 với
   T6 — lần này gate A đã bảo vệ, nhưng trùng cổng là rủi ro
   không cần thiết).
5. **Nợ khác đứng yên theo LIMITS gộp đợt 116 §10 + LIMITS các
   luồng đợt 117:** G1 + mù #22 + mù #28 + mù #29 + mù #30 + mù
  #31 + mù #32 chờ user quyết; mù #34 ĐÃ ĐÓNG HOÀN TOÀN (đợt 116
  S7); mù #35 mới mở (chứa #49–#53) chờ user quyết; E4 vẫn ĐÓNG
  CÓ ĐIỀU KIỆN (r1f4 stall trên tập hợp lệ — xem LIMITS gộp đợt
  116); T3 đợt 117: biên GIỮ lui 21,07 → 19,63 (s79 trung gian
  79,7%, thiếu GIỮ ~5 tick), bar (c) TUYÊN BỐ KHÔNG ÁP DỤNG cho
  nice-hog (vùng xám lần 6); birefnet 0 lần; TTS 39 CẤM kiểm lại;
  ci-security.yml vẫn 403 chờ user; release gate không đổi. Reboot
  mới nhất: boot #53 09:47:08Z (gap #52→#53 = 1h17'56"); reboot
  #54 dự kiến ~11:47Z (theo nhịp ~2h, chỉ là ước tính).

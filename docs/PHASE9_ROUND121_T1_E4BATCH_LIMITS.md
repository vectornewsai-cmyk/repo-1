# Phase 9 — Đợt 121, luồng T1: E4BATCH lượt 4 (B, gop30) — DEFER-POSTBOOT (cờ T7 không tới; postboot thực tế đã PASS)

> **Kết quả gọn: lượt 4 KHÔNG ĐẾM ĐƯỢC — DEFER-POSTBOOT. Driver chờ
> cờ T7 đợt 121 đủ 60 phút (08:55:13–09:55:15Z) mà không có cờ nào
> (`t7-replay-done.md` / `POSTBOOT_PASS` đều không xuất hiện, kiểm
> lần cuối 09:58:40Z vẫn không có) — DÙ postboot check-only đã PASS
> từ 09:27:51Z (gate poll #17 của T7, exit=0) và driver tự kiểm cuối
> lúc 09:55:15Z cũng PASS đầy đủ (wrapper/libs/GST/apt). Không chạy
> probe, không lấy lock, không có số đo nào — và không bịa số liệu.
> Lô E4BATCH vẫn 1/10 (1 VOID, 0 CAUGHT). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**

## 0. Bối cảnh, lệch đăng ký, và quyết parent còn chờ

- E4 = stall r1f3 att2 + r1f4 (drift re-seek chậm/kẹt sau steady-close).
  Quyết parent đợt 117 §13 mục (1): hướng (a) — giữ ĐÓNG CÓ ĐIỀU KIỆN
  tới lô đo lớn đăng ký trước; CẤM hướng (c).
- Lô E4BATCH (10 lượt đếm được, 5 A gop250 + 5 B gop30, xen kẽ, bắt
  đầu A): lượt 1 ĐỂ TRỐNG (att1 KILLED-HARNESS + att2 DEFER-LOCK,
  đợt 118 T9); lượt 2 (B, gop30) = VOID trên cây H3f (đợt 119 T2);
  lượt 3 (A, gop250) = DEFER-POSTBOOT (đợt 120 T1, boot #60 replay
  "chạm mà không cài"). Lô 1/10 trước lượt này.
- **Lệch đăng ký (ghi rõ, không giấu):** theo prereg §2, DEFER không
  đếm nên lượt 3 phải CHẠY LẠI trước khi chuyển lượt 4. Nhiệm vụ đợt
  121 T1 của parent + chủ đề đợt 121 trong `round-in-progress.md`
  (mở 08:35Z, ghi rõ "E4 lượt 4") đều chỉ định lượt này chạy lượt 4
  (B, gop30, phase `e4b4`). T1 chạy theo chỉ định parent; hệ quả:
  nhánh A đang thiếu 1 lượt theo lịch (lượt 3 chưa chạy lại) và giờ
  lượt 4 cũng DEFER nên cả hai lượt đều treo. **Cần quyết parent:**
  (i) lượt 3 (A) chạy bù ở đợt sau (lô giữ đủ 5A+5B) hay bỏ lượt 3;
  (ii) thứ tự chạy lại — lượt 3 trước hay lượt 4 (DEFER gần nhất)
  trước. T1 KHÔNG tự quyết; mọi verdict H1/H3 sau này chỉ dùng các
  lượt cùng cây H3f.
- Prereg lượt 4: `hidden_files/round121-t1/prereg-e4batch-luot4.md`
  (viết TRƯỚC khi đo, 08:42Z). Cây đo: H3f md5
  `5be5a250a552357c50cc189de9a9c08a` (T1 đợt 119 apply xong 23:57Z
  15/11, tsc 0 + vite build PASS 7,03 s). T1 đợt 121 KHÔNG apply
  lại, không sửa production — chỉ đo trên cây H3f đã có.

## 1. Điều kiện môi trường lúc khởi động — boot #62 (08:43Z)

- Boot #62 (tạm — số thứ tự chờ T6 đếm lại mù #37): bắt đầu
  2026-11-16 08:25:47Z, boot_id `9788ce28-c334-40f4-bc21-e93d298b0f9b`,
  sau boot #61 (06:50:58Z) gap 1h34'49".
- Cây đo: preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a` (khớp
  kỳ vọng H3f), media.ts `2c384ed13703809d5e999311147745e7` — cả hai
  không đổi trước/sau lượt. Cờ cây `round116-tree` status NO-CHANGE.
- RAM khả dụng lúc driver khởi động 1269 MB (lúc 08:40Z đo 521 MB —
  dao động mạnh theo luồng khác); load 0,91.
- Postboot check-only lúc khởi động (driver chạy, 08:43:35Z): FAIL —
  thiếu 5 lib; thư mục GST hệ thống KHÔNG TỒN TẠI (0 plugin, debroot
  269); apt thiếu 11 pkg. Replay boot #62 ĐANG CHẠY lúc đó (apt-get
  update pid 815 + apt methods từ 08:35Z; dpkg.log 2 dòng "startup
  packages configure" @08:35:39Z = boot +9'52").
- Lock script live md5 `cd0c05c1f9304d58f7aaf041c25bb8b9` (khớp đợt
  120, T6 text fix). Probe `apps/web/scripts/probe116s1.mjs` không
  sửa (`node --check` OK 08:40Z); clip `o8-ball-720p-6s-gop30.mp4`
  có mặt trong `hidden_files/round92-t3/clips/`.

## 2. Reboot #63 giữa lúc chờ — driver bị giết, khởi động lại

- **Reboot #63 (tạm):** btime 2026-11-16 08:53:05Z, boot_id
  `725453a2-c8cb-44ba-a6f3-7222d0b2d00b`; gap #62→#63 = 27'18"
  (1638 s) — ngắn hơn nhiều so với nhịp reboot ~128 phút/lượt đo
  đợt 120 (T5/T6 ghi gap; không phải việc của T1).
- Driver lần 1 (pid 7854, khởi động 08:43:37Z) bị giết lúc ~08:53Z
  trong lúc chờ cờ T7 (chờ được 10 phút, checkpoint 5' duy nhất
  08:48:37Z: GST sys 32 file, dpkg đang cài `libc-bin` — replay #62
  đang tiến triển tốt lúc chết). Poll chờ của chính T1 (sleep 540 s)
  cũng bị SIGTERM cùng lúc. Phiên subagent T1 sống qua reboot.
- T1 khởi động lại driver 08:55:06Z trên boot #63 (tiền lệ T10 đợt
  120 chạy lại poller sau reboot #61, ghi RESTART): ghi marker
  RESTART vào `run-t1.log`; kiểm lại md5 (5be5a250/2c384ed1 không
  đổi), lock trống (T8-round121 giữ cổng 5590 08:49:56–08:52:18Z rồi
  nhả trước reboot; driver chưa từng giữ lock nên không có hold
  thừa); **đồng hồ chờ 60 phút chạy lại từ đầu (08:55:13Z)** —
  DEFER lúc 09:55:15Z. Tổng tường từ lúc driver lần 1 khởi động tới
  DEFER: 71'38" (gồm ~10 phút chờ trên boot #62 + reboot + 60 phút
  chờ trên boot #63).
- T7 đợt 121 cũng khởi động lại gate-waiter cho boot #63 (ghi trong
  `t7-progress.md` 08:55:42Z: "Gate poll #2 ĐẠT 08:53:32Z là cho boot
  #62 (đã chết) — KHÔNG DÙNG ĐƯỢC"; tiền lệ T3-120 đo trên boot hiện
  tại sau khi boot cũ chết). Lưu ý: gate poll #2 của T7 ĐẠT lúc
  08:53:32Z — tức postboot trên boot #62 đã PASS ngay trước khi
  boot chết — nhưng cờ đó thuộc boot đã chết nên không dùng được
  cho lượt này.

## 3. Replay boot #63: chết dạng (B) rồi --repair lần đầu chạy sống

- Boot #63: dpkg.log chỉ 2 dòng "startup packages configure"
  @08:53:53Z (boot +48s) suốt tới ~09:15Z; GST sys 0 file; 0
  apt/dpkg đang chạy (T7 gate poll #3–#10, 08:59–09:13Z, đều
  postboot exit=1, dpkg_lines=2). T7 xác nhận trong `t7-progress.md`:
  khớp dạng (B) "chạm mà không cài" của luật replay-chết §8.2 (đã
  duyệt, hiệu lực đợt 121); quyết --repair là của T5 (hạ tầng),
  KHÔNG phải T7.
- **T5 đợt 121 kích hoạt luật lần đầu tiên (09:12:23Z):** ghi
  `REPAIR_TRIGGERED` TRƯỚC khi chạy (đúng thứ tự luật §8.2); kiểm
  chứng đủ 5/5 điều kiện — postboot FAIL tươi exit=1 lúc 09:12:22Z;
  replay ĐÃ CHẾT (0 process apt/dpkg/wrapper; dpkg.log không tăng
  >17 phút; lock dpkg rảnh); ngưỡng nhánh (ii) ĐẠT (dpkg im 18'30"
  ≥ 15', boot ~19' tuổi — nhánh (i) ≥60' KHÔNG đạt); dạng lỗi (B);
  0 process MiniBrowser/WebKit đang chạy. T5 cũng quan sát được
  wrapper replay CHẾT LIVE trong cửa sổ (09:07:48Z, 09:08:48Z] —
  không bao giờ chạy apt-get update hay cài gì (khác #60 chỉ hậu
  kiểm). Xem `round121-t5/REPAIR_TRIGGERED` + `t5-verify-dead.log`.
- **Repair chạy 09:14:14–09:26:57Z** (`postboot-check.sh --repair`,
  MỘT LẦN, có giám sát; log `t5-repair-b63.log`, kết luận "KET LUAN:
  DU DIEU KIEN chay WebKit"). Trong lúc repair: GST sys 0 → 269
  file (checkpoint 20' của driver, 09:15:14Z); dpkg.log bắt đầu có
  dòng cài (`libc-bin` 09:26:56Z, 759 dòng lúc T7 poll #17).
- **Caveat thứ tự script (T5 đã báo, ghi lại đây):** script hiện tại
  làm symlink GST → debroot TRƯỚC (mục 3) rồi mới apt install (mục
  4) — ngược với chữ luật §8.2 ("symlink chỉ khi apt thất bại").
  Parent duyệt §8.2 mà KHÔNG duyệt phương án A kèm. Hệ quả:
  `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` hiện là symlink →
  `/home/hatch/workspace/tmp-q6r3-debroot/usr/lib/x86_64-linux-gnu/
  gstreamer-1.0` (vá tạm K1, ephemeral); apt install sau đó có thể
  ghi file plugin qua symlink vào debroot thay vì thư mục hệ thống
  thật. Postboot PASS sau repair phải đọc kèm caveat này (gói apt
  vẫn được dpkg ghi nhận đã cài; decode mp4/H.264 qua plugin vẫn đủ
  vì file có mặt qua symlink). Đây là caveat của T5, T1 chỉ ghi
  nhận — không tự kiểm lại decode.

## 4. Chờ cờ T7 — 60 phút, cờ không tới (dù postboot đã PASS)

Driver `hidden_files/round121-t1/run-t1.sh` (bản điều chỉnh từ
`run-t1.sh` đợt 120: đổi đường dẫn round121 + lượt 4/B/gop30; luật
chờ mới — POSTBOOT_FAIL / done-file exit≠0 KHÔNG thoát sớm vì có
thể repair sau FAIL) chạy DETACHED, poll cờ T7 mỗi 60 s, checkpoint
mỗi 5 phút:

| Thời điểm (Z) | Chờ được | round121-t7 lúc đó | GST sys | dpkg.log cuối | apt/dpkg chạy* |
|---|---|---|---|---|---|
| 09:00:14 | 5' | gatewait #1–#3 | 0 file | 08:53:53 startup | 0 |
| 09:05:14 | 10' | + gatewait #4–#5 | 0 | 08:53:53 startup | 0 |
| 09:10:14 | 15' | + gatewait #6–#8 | 0 | 08:53:53 startup | 0 |
| 09:15:14 | 20' | + gatewait #9–#10 | 269 file | 08:53:53 startup | 9 |
| 09:20:14 | 25' | + gatewait #11–#13 | 269 | 08:53:53 startup | 9 |
| 09:25:14 | 30' | + gatewait #14–#15 | 269 | 08:53:53 startup | 9 |
| 09:30:14 | 35' | + gatewait #16–#17, t7-run-1..3 | 269 | 09:26:56 libc-bin | 0 |
| 09:35:14 | 40' | + t7-run-4..7, t7-analysis | 269 | 09:26:56 libc-bin | 1 |
| 09:40:14 | 45' | + t7-run-8 | 269 | 09:26:56 libc-bin | 1 |
| 09:45:14 | 50' | như trên | 269 | 09:26:56 libc-bin | 0 |
| 09:50:14 | 55' | như trên | 269 | 09:26:56 libc-bin | 1 |
| 09:55:14 | 60' | như trên | 269 | 09:26:56 libc-bin | 1 |

\* Đếm thô bằng `ps aux | grep -E 'apt|dpkg' | grep -v grep` — gồm cả
lệnh `grep`/pipeline đếm; chỉ dùng làm tín hiệu thô, không phải số đo.

- **T7 gate poll #17 (09:27:51Z): postboot_exit=0, dpkg_lines=759,
  RAM 1744 MB — "GATE 0 DAT ... — chay driver"** (ghi trong
  `gate0-wait-t7.log`). T7 sau đó chạy driver riêng của nó
  (`t7-run-1..8.log`, `t7-driver.out`, `t7-analysis.txt` — có số
  PSI/GST) nhưng **KHÔNG viết `t7-replay-done.md` hay `POSTBOOT_PASS`
  trong suốt cửa sổ chờ của driver T1 (tới 09:58:40Z khi kiểm lần
  cuối, thư mục round121-t7 vẫn không có file cờ nào)**. T7 cũng
  không viết `POSTBOOT_FAIL` (đúng — postboot đã PASS, không có gì
  để FAIL).
- Hết 60 phút → driver thoát DEFER-POSTBOOT (exit=3) lúc 09:55:15Z,
  đúng prereg §1/§6. Không retry mù, không đo mò, không tự ý lấy
  gate log của T7 làm cờ (prereg đăng ký cờ là `t7-replay-done.md`
  exit=0 hoặc `POSTBOOT_PASS`; T1 không nới tiêu chí giữa lượt).
- **Phân biệt rõ nguyên nhân DEFER:** đây là DEFER do **cờ phối hợp
  không xuất hiện**, KHÔNG phải do WebKit chưa sẵn sàng — postboot
  đã PASS liên tục từ 09:27:51Z (27'24" trước khi driver hết hạn).
  Nếu T7 viết cờ ngay khi gate PASS (trước khi chạy driver riêng),
  lượt 4 đã đo được trong cửa sổ này.

## 5. Postboot check-only lúc cuối — PASS ĐẦY ĐỦ (09:55:15Z, driver chạy)

Driver chạy lại check-only trước khi thoát (đọc, không repair):

- PASS wrapper (K1 giữ LD_LIBRARY_PATH).
- PASS libs: đủ libevent/libEGL/libavif/libdw/libevdev (hệ thống).
- PASS GST: đủ isomp4 (mp4 demux) + libav (avdec_h264); thư mục hệ
  thống là symlink → debroot (xem caveat §3); plugin hệ thống=269,
  debroot=269.
- PASS apt: đủ 11 package WebKit/GST (kể cả libevdev2, Q7 đợt 114).
- Kết luận script: "KET LUAN: DU DIEU KIEN chay WebKit (boot
  2026-11-16 08:53:05)".

T5 độc lập: repair log kết luận DU DIEU KIEN 09:26:57Z. T7 độc lập:
gate poll #17 exit=0 09:27:51Z. Ba nguồn đồng ý: WebKit đã đủ điều
kiện từ ~09:27Z; chỉ thiếu cờ phối hợp.

## 6. Kiểm chứng — không có lượt đo nào, không thay đổi nào

- **Không probe:** không có thư mục
  `hidden_files/round116-s1/probe-webkit-load0-gop30-e4b4/`;
  probe `apps/web/scripts/probe116s1.mjs` không chạy lần nào
  (`node --check` OK lúc 08:40Z trước khi chờ — chỉ kiểm cú pháp).
- **Không lock:** 0 dòng `t1-round121` trong
  `hidden_files/vite-lock-v2.log` — driver dừng trước bước acquire
  nên không giữ/nhả lock, không gây DEFER cho luồng khác. Lock script
  live md5 `cd0c05c1f9304d58f7aaf041c25bb8b9` lúc khởi động (bản copy
  trong scratch cùng md5, chạy bản copy theo prereg §6).
- **Không sửa production:** preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a`
  trước = sau; media.ts `2c384ed13703809d5e999311147745e7` trước = sau.
- **Không reboot sau khởi động lại:** boot_id
  `725453a2-c8cb-44ba-a6f3-7222d0b2d00b`, bắt đầu 08:53:05Z, trước =
  sau (chỉ có 1 reboot #62→#63 trong lượt, xem §2).
- **Không số đo:** 0 velocity tick, 0 drift recount, 0 steady-close —
  analyzer `hidden_files/round121-t1/analyze-t1.py` (bản sao y hệt
  `round120-t1/analyze-t1.py`, diff chỉ 2 dòng header, logic không
  đổi) KHÔNG chạy vì không có `probe-results.json` để phân tích. Mọi
  con số trong LIMITS này đều là số môi trường (postboot/dpkg/lock/
  md5), không có số đo probe nào.
- `tsc` / `vite build` toàn repo: KHÔNG chạy lại trong luồng này
  (không sửa production; cây H3f đã được T1 đợt 119 verify tsc 0 +
  vite build PASS 7,03 s trên đúng md5 này).
- **Lỗi chữ trong log (ghi rõ, không giấu):** dòng DEFER của driver
  ghi "(replay/postboot boot #62 chưa xong)" — nhãn boot cũ còn sót
  từ script đợt 120; boot thực tế của lần chờ này là #63. Chỉ sai
  nhãn, không sai hành vi (đồng hồ 60' + điều kiện DEFER đều đúng).
  Sửa nhãn ở lần chạy sau.

## 7. Verdict — T1 không tự quyết E4; lô đứng yên

- **Lượt 4: DEFER-POSTBOOT (không đếm)** theo prereg §2 — probe chưa
  chạy vì cờ T7 không tới trong 60 phút (dù postboot đã PASS từ
  09:27:51Z). Sổ cái `e4batch-ledger.md` đã cập nhật: lượt 4 att1
  ghi DEFER-POSTBOOT, lô vẫn **1/10 lượt đếm được (1 VOID,
  0 CAUGHT)**.
- **H1: CHƯA PHÂN ĐỊNH. H3: CHƯA PHÂN ĐỊNH. E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**
- **Lượt tiếp theo: lượt 4 CHẠY LẠI** ở đợt sau (B, gop30, phase
  `e4b4`, cây H3f) — DEFER không đếm nên không chuyển sang lượt 5.
  Lượt 3 (A) vẫn treo từ đợt 120 — cần quyết parent về thứ tự chạy
  lại (lượt 3 trước hay lượt 4 trước); cho tới khi parent quyết,
  mặc định theo prereg là chạy lại lượt 4 (lượt DEFER gần nhất).
- Nợ quan sát att1 từ đợt 118/119 vẫn mở: pause-seek gop250 có xác
  nhận được canvas không — chưa kiểm được vì lượt 3 chưa chạy.
  Không có dữ liệu mới về câu hỏi này trong lượt này.

## 8. Nợ mở + đề xuất phối hợp (cho parent / T7 đợt sau)

1. **Cờ T7 là điểm nghẽn mới:** lần đầu tiên DEFER xảy ra dù postboot
   đã PASS (lượt 3 đợt 120 DEFER vì postboot FAIL thật; lượt này
   DEFER vì cờ không tới). Đề xuất: T7 viết cờ `POSTBOOT_PASS` (hoặc
   `t7-replay-done.md` với exit=0) NGAY khi gate poll PASS, TRƯỚC
   khi chạy driver riêng của T7 — việc viết cờ chỉ tốn 1 lệnh, không
   cần chờ driver T7 xong. Hoặc parent quyết: driver đo được chấp
   nhận gate log `gate0-wait-t7.log` (dòng "GATE 0 DAT" + exit=0)
   làm tín hiệu thay cờ — nhưng đó là ĐỔI prereg, cần quyết rõ
   trước khi áp dụng, không tự nới giữa lượt.
2. **Đồng hồ chờ sau reboot:** driver khởi động lại thì đồng hồ 60'
   chạy lại từ đầu (lượt này: tổng tường 71'38" từ lúc driver lần 1
   khởi động). Cần quyết parent: giữ nguyên (mỗi lần khởi động lại
   được đủ 60') hay cộng dồn (tổng chờ tối đa 60' kể cả trước reboot).
   T1 giữ nguyên luật hiện tại (chạy lại từ đầu) vì boot mới cần đủ
   thời gian replay/repair.
3. **Nhãn boot cũ trong script driver:** dòng DEFER còn ghi "boot
   #62" (sót từ đợt 120) — sửa nhãn động ở lần chạy sau, không ảnh
   hưởng hành vi.
4. **Caveat repair (của T5, ghi lại):** symlink GST → debroot chạy
   TRƯỚC apt install trong script hiện tại, ngược chữ luật §8.2;
   postboot PASS sau repair đọc kèm caveat này. Quyết phương án A
   (sửa thứ tự script) hay giữ nguyên vẫn chờ parent (đã báo ở T7
   đợt 120 §9).
5. **Lượt 3 treo + thứ tự chạy lại:** xem §0/§7 — cần quyết parent.

## 9. File trong batch

- `docs/PHASE9_ROUND121_T1_E4BATCH_LIMITS.md` (file này — mới).
- Dữ liệu + prereg + driver + analyzer (KHÔNG stage, chỉ tham chiếu):
  `hidden_files/round121-t1/` (prereg-e4batch-luot4.md, run-t1.sh,
  run-t1.log, run-t1-driver.out, analyze-t1.py,
  vcut-vite-lock-v2-copy.sh); sổ cái đã cập nhật
  `hidden_files/round118-t9/e4batch-ledger.md` (file này cũng không
  stage — sổ cái sống trong hidden_files, ngoài repo).
- Tham chiếu môi trường: `hidden_files/round121-t7/` (gate0-wait-t7.log
  poll #1–#17, t7-progress.md, t7-run-1..8.log, t7-analysis.txt —
  KHÔNG có `t7-replay-done.md` / `POSTBOOT_PASS` tới 09:58:40Z);
  `hidden_files/round121-t5/` (REPAIR_TRIGGERED, t5-verify-dead.log,
  t5-repair-b63.log — lần đầu luật replay-chết kích hoạt + lần đầu
  --repair chạy sống).

# Phase 9 — Đợt 120, luồng T1: E4BATCH lượt 3 (A, gop250) — DEFER-POSTBOOT, 0 lượt đo được

> **Kết quả gọn: lượt 3 KHÔNG ĐẾM ĐƯỢC — DEFER-POSTBOOT. Driver chờ
> cờ T7 đợt 120 đủ 60 phút (05:43:56–06:43:58Z) mà replay boot #60
> không bao giờ cài GST: postboot check-only FAIL ở đầu và cuối,
> dpkg.log chỉ 2 dòng suốt 60 phút, 0 apt/dpkg đang chạy. Không chạy
> probe, không lấy lock, không có số đo nào — và không bịa số liệu.
> Lô E4BATCH vẫn 1/10 (1 VOID, 0 CAUGHT). E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**

## 0. Bối cảnh và quyết parent

- E4 = stall r1f3 att2 + r1f4 (drift re-seek chậm/kẹt sau steady-close).
  Quyết parent đợt 117 §13 mục (1): hướng (a) — giữ ĐÓNG CÓ ĐIỀU KIỆN
  tới lô đo lớn đăng ký trước; CẤM hướng (c).
- Lô E4BATCH (10 lượt đếm được, 5 A gop250 + 5 B gop30, xen kẽ, bắt
  đầu A): lượt 1 ĐỂ TRỐNG (att1 KILLED-HARNESS + att2 DEFER-LOCK,
  đợt 118 T9); lượt 2 (B, gop30) = VOID trên cây H3f (đợt 119 T2).
  Lô 1/10 trước lượt này.
- Lượt 3 theo prereg §1: A, gop250, phase `e4a3`, trên cây H3f md5
  `5be5a250a552357c50cc189de9a9c08a` (T1 đợt 119 apply xong 23:57Z
  15/11, tsc 0 + vite build PASS 7,03 s). T1 đợt 120 KHÔNG apply
  lại, không sửa production — chỉ đo trên cây H3f đã có.
- Prereg: `hidden_files/round118-t9/prereg-e4batch.md` §6 (chờ cờ T7
  tối đa 60 phút, quá hạn → DEFER-POSTBOOT, không đo mò trên WebKit
  chưa sẵn sàng — bài học O8 WebKit exit=2 đợt 117 do replay #53
  đình trệ) + addendum đợt 119 trong sổ cái `e4batch-ledger.md`.

## 1. Điều kiện môi trường lúc khởi động (05:41–05:44Z)

- Boot #60 (tạm — số thứ tự chờ T6 đếm lại mù #37): bắt đầu
  2026-11-16 04:45:49Z, boot_id `0260101b-acd3-43f4-91d2-670c1960fb7d`,
  sau boot #59 (01:47:49Z) gap 2h58'00". Không reboot nào trong cửa
  sổ làm việc (boot_id trước = sau, xem §5).
- Cây đo: preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a` (khớp
  kỳ vọng H3f), media.ts `2c384ed13703809d5e999311147745e7` — cả hai
  không đổi trước/sau lượt. Cờ cây `round116-tree` status NO-CHANGE.
- RAM khả dụng lúc driver khởi động 1314 MB; load 5,16 (lúc đó có
  luồng khác đang quét `hidden_files` — grep 28,8% CPU; tải này
  không ảnh hưởng kết luận vì không có probe nào chạy).
- Headroom inotify boot #60: 545 (T7 đo độc lập; rơi tiếp từ 670 ở
  #57 — xem LIMITS T7 đợt 120).

## 2. Postboot check-only lúc đầu — FAIL (05:42Z, trước khi chờ)

Chạy `apps/web/scripts/vcut-webkit-postboot-check.sh` (đọc, không
`--repair`, không sửa gì), kết quả:

- PASS wrapper: đã vá K1 (giữ LD_LIBRARY_PATH).
- FAIL libs: thiếu 5 lib — `libevent-2.1.so.7 libEGL.so.1 libavif.so.16
  libdw.so.1 libevdev.so.2`.
- FAIL GST: thư mục `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` KHÔNG
  TỒN TẠI; file plugin hệ thống = 0, debroot = 269 file; thiếu
  isomp4=1, libav=1 — decode mp4/H.264 qua plugin hệ thống chưa đủ.
- FAIL apt: chưa cài 11 package — `libevent-2.1-7t64
  gstreamer1.0-plugins-base gstreamer1.0-plugins-good
  gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-gl
  gstreamer1.0-libav gstreamer1.0-x libavif16 libgstreamer1.0-0
  libevdev2`.
- Kết luận script: "CHUA DU — chạy lại với --repair, hoặc chờ apt
  replay xong rồi chạy lại".
- dpkg.log lúc đó chỉ 2 dòng `startup packages configure` @05:35:40Z
  (boot +49'51"); 0 tiến trình apt/dpkg đang chạy; `/var/log/apt/`
  KHÔNG tồn tại; `/var/lib/apt/lists` TRỐNG (T7 xác nhận độc lập
  trong `round120-t7/POSTBOOT_FAIL` 05:46Z).

## 3. Chờ cờ T7 — 60 phút, replay không quay lại

Driver `hidden_files/round120-t1/run-t1.sh` (bản điều chỉnh từ
`run-t2.sh` đợt 119: bỏ bước chờ cờ T1 — cây H3f đã có sẵn, không
apply lại; giữ nguyên luật chờ cờ T7 + lock v2 + probe) chạy DETACHED
từ 05:43:56Z, poll cờ T7 mỗi 60 s, checkpoint mỗi 5 phút:

| Thời điểm (Z) | Chờ được | round120-t7 lúc đó | GST sys | dpkg.log cuối | apt/dpkg chạy |
|---|---|---|---|---|---|
| 05:48:57 | 5' | POSTBOOT_FAIL + watcher đã chạy | 0 file | 05:35:40 startup | 0 |
| 05:53:57 | 10' | + t7-postboot-b60-poll10.log | 0 | 05:35:40 startup | 0 |
| 05:58:58 | 15' | như trên | 0 | 05:35:40 startup | 0 |
| 06:03:58 | 20' | + poll20 | 0 | 05:35:40 startup | 1* |
| 06:08:58 | 25' | như trên | 0 | 05:35:40 startup | 1* |
| 06:13:58 | 30' | + poll30 | 0 | 05:35:40 startup | 1* |
| 06:18:58 | 35' | như trên | 0 | 05:35:40 startup | 1* |
| 06:23:58 | 40' | + poll40 | 0 | 05:35:40 startup | 1* |
| 06:28:58 | 45' | như trên | 0 | 05:35:40 startup | 0 |
| 06:33:58 | 50' | + poll50 | 0 | 05:35:40 startup | 0 |
| 06:38:58 | 55' | như trên | 0 | 05:35:40 startup | 0 |
| 06:43:58 | 60' | + poll60 (T7 poll 60, 06:44:09Z, exit=1) | 0 | 05:35:40 startup | 0 |

\* "apt/dpkg đang chạy: 1" ở các checkpoint 20'–40' là đếm thô bằng
`ps aux | grep -E 'apt|dpkg' | grep -v grep` — watcher của T7 ghi
đồng thời `apt_running=no` ở mọi poll (poll 22, 23, 31, 32, 41, 42):
tiến trình đếm được là chính lệnh `grep`/pipeline đếm, không phải
apt/dpkg thật. dpkg.log không thêm dòng nào trong suốt 60 phút —
bằng chứng quyết định là log đứng yên, không phải số đếm `ps`.

- T7 đợt 120 (POSTBOOT_FAIL 05:46Z): gọi đây là "chế độ lỗi mới:
  replay CHẠM MÀ KHÔNG CÀI" — khác #58 (replay kết thúc sau 350
  dòng mà thiếu GST) và khác #53 (không tới hẳn). T7 chạy watcher
  60 phút từ 05:45Z (poll 1–60, dpkg_lines=2 suốt) và KHÔNG chạy
  `--repair`, KHÔNG tự cài package — chờ parent quyết luật xử lý
  (xem LIMITS đợt 120). T7 không viết `t7-replay-done.md` hay
  `POSTBOOT_PASS` trong cửa sổ chờ của driver (tới 06:44:56Z khi
  kiểm lần cuối, thư mục round120-t7 vẫn chỉ có POSTBOOT_FAIL +
  các log poll).
- Hết 60 phút → driver thoát DEFER-POSTBOOT (exit=3) lúc 06:43:58Z,
  đúng prereg §6. Không retry mù, không đo mò.

## 4. Postboot check-only lúc cuối — vẫn FAIL (06:43:58Z, driver chạy)

Driver chạy lại check-only trước khi thoát (đọc, không repair):

- PASS wrapper (K1 giữ nguyên).
- FAIL libs: thiếu đúng 5 lib như lúc đầu.
- FAIL GST: thư mục hệ thống vẫn không tồn tại; plugin hệ thống=0,
  debroot=269; thiếu isomp4=1, libav=1.
- FAIL apt: thiếu đúng 11 package như lúc đầu.
- Kết luận script: "CHUA DU" (y hệt lúc đầu).

T7 poll 60 (06:44:09Z) độc lập: postboot check-only exit=1 — khớp.

## 5. Kiểm chứng — không có lượt đo nào, không thay đổi nào

- **Không probe:** không có thư mục
  `hidden_files/round116-s1/probe-webkit-load0-gop250-e4a3/`;
  probe `apps/web/scripts/probe116s1.mjs` không chạy lần nào
  (`node --check` OK lúc 05:41Z trước khi chờ — chỉ kiểm cú pháp).
- **Không lock:** 0 dòng `t1-round120` trong
  `hidden_files/vite-lock-v2.log` — driver dừng trước bước acquire
  nên không giữ/nhả lock, không gây DEFER cho luồng khác. Lock script
  live md5 `cd0c05c1f9304d58f7aaf041c25bb8b9` lúc khởi động (bản copy
  trong scratch cùng md5, chạy bản copy theo prereg §6).
- **Không sửa production:** preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a`
  trước = sau; media.ts `2c384ed13703809d5e999311147745e7` trước = sau.
- **Không reboot:** boot_id `0260101b-acd3-43f4-91d2-670c1960fb7d`,
  bắt đầu 04:45:49Z, trước = sau.
- **Không số đo:** 0 velocity tick, 0 drift recount, 0 steady-close —
  analyzer `hidden_files/round120-t1/analyze-t1.py` (bản sao y hệt
  `round119-t2/analyze-t2.py`, diff chỉ header, logic không đổi)
  KHÔNG chạy vì không có `probe-results.json` để phân tích. Mọi con
  số trong LIMITS này đều là số môi trường (postboot/dpkg/lock/md5),
  không có số đo probe nào.
- `tsc` / `vite build` toàn repo: KHÔNG chạy lại trong luồng này
  (không sửa production; cây H3f đã được T1 đợt 119 verify tsc 0 +
  vite build PASS 7,03 s trên đúng md5 này).

## 6. Verdict — T1 không tự quyết E4; lô đứng yên

- **Lượt 3: DEFER-POSTBOOT (không đếm)** theo prereg §2 — probe chưa
  chạy vì WebKit chưa đủ điều kiện. Sổ cái `e4batch-ledger.md` đã
  cập nhật: lượt 3 att1 ghi DEFER-POSTBOOT, lô vẫn **1/10 lượt đếm
  được (1 VOID, 0 CAUGHT)**.
- **H1: CHƯA PHÂN ĐỊNH. H3: CHƯA PHÂN ĐỊNH. E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**
- **Lượt tiếp theo: lượt 3 CHẠY LẠI** ở đợt sau (A, gop250, phase
  `e4a3`, cây H3f) — DEFER không đếm nên không chuyển sang lượt 4.
  Lượt chạy lại cần boot có GST đầy đủ (replay xong hoặc luật xử lý
  mới của parent cho chế độ "replay chạm mà không cài" — T7 đang chờ
  quyết này; xem LIMITS đợt 120 §10).
- Nợ quan sát att1 từ đợt 118/119 vẫn mở: pause-seek gop250 có xác
  nhận được canvas không — chưa kiểm được vì lượt 3 chưa chạy.
  Không có dữ liệu mới về câu hỏi này trong lượt này.

## 7. File trong batch

- `docs/PHASE9_ROUND120_T1_E4BATCH_LIMITS.md` (file này — mới).
- Dữ liệu + driver + analyzer (KHÔNG stage, chỉ tham chiếu):
  `hidden_files/round120-t1/` (run-t1.sh, run-t1.log,
  run-t1-driver.out, analyze-t1.py, vcut-vite-lock-v2-copy.sh);
  sổ cái đã cập nhật `hidden_files/round118-t9/e4batch-ledger.md`
  (file này cũng không stage — sổ cái sống trong hidden_files).
- Tham chiếu môi trường: `hidden_files/round120-t7/` (POSTBOOT_FAIL,
  t7-wait-replay.log poll 1–60, t7-postboot-b60-poll{10,20,30,40,50,60}.log,
  t7-postboot-b60-try1.log).

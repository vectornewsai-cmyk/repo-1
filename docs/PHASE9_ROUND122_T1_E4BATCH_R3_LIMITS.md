# LIMITS — Đợt 122 T1: E4BATCH lượt 3 chạy bù (A, gop250, phase e4a3) — DEFER-POSTBOOT

> Đợt 122, luồng T1, 16/11/2026. Chạy bù lượt 3 theo quyết parent đợt 121
> §12.1 (lượt 3 trước, rồi lượt 4 do T2 đợt 122 chạy sau khi T1 xong).
> Prereg: `hidden_files/round122-t1/prereg-e4batch-luot3.md` (viết TRƯỚC
> khi đo). Sổ cái (bản copy làm việc, bản gốc round118-t9 giữ nguyên):
> `hidden_files/round122-t1/e4batch-ledger.md`. Driver:
> `hidden_files/round122-t1/run-t1.sh`, log `run-t1.log`.

## 1. Kết quả — một dòng

**Lượt 3 att2: DEFER-POSTBOOT (không đếm vào lô).** Driver chờ cờ postboot
của T5 đợt 122 đủ 60 phút (11:39:23–12:39:27Z) mà không có cờ PASS nào.
Không chạy probe, không lấy lock, không sửa production. **Lô E4BATCH vẫn
1/10** (0 CAUGHT, 1 VOID — lượt 2, B gop30, cây H3f). Lượt 3 chạy lại ở
đợt sau.

## 2. Số đo thật (đều kiểm được từ log)

- Boot: btime 11:05:18Z, boot_id `3fe7e89e-ec8d-49d7-a7f0-2616bed14828`
  (số tạm #64, chờ T6 đợt 122 đếm lại mù #37; T5 gọi b64). Boot không
  đổi trong lượt (trước = sau = 3fe7e89e).
- Postboot check-only: FAIL ở đầu lượt (11:38Z, T5 try1) và FAIL ở cuối
  lượt (12:39:27Z, driver chạy, đọc không repair) — y hệt nhau:
  - Wrapper: PASS (đã vá K1, giữ LD_LIBRARY_PATH).
  - Libs thiếu (5): libevent-2.1.so.7, libEGL.so.1, libavif.so.16,
    libdw.so.1, libevdev.so.2.
  - GST: thư mục `/usr/lib/x86_64-linux-gnu/gstreamer-1.0` KHÔNG TỒN
    TẠI; file plugin hệ thống = 0; debroot = 269; thiếu isomp4=1,
    libav=1 — decode mp4/H.264 qua plugin hệ thống chưa đủ.
  - Apt thiếu (11 pkg): libevent-2.1-7t64, gstreamer1.0-plugins-base,
    gstreamer1.0-plugins-good, gstreamer1.0-plugins-bad,
    gstreamer1.0-plugins-ugly, gstreamer1.0-gl, gstreamer1.0-libav,
    gstreamer1.0-x, libavif16, libgstreamer1.0-0, libevdev2.
  - Kết luận postboot: CHƯA ĐỦ.
- Replay boot #64 kẹt ở `apt-get update`: pid 855 chạy từ 11:35Z, lúc
  12:43Z đã chạy 1 giờ 08 phút vẫn chưa xong; `/var/log/dpkg.log`
  đóng băng ở đúng 2 dòng `startup packages configure` @11:35:39Z
  (boot +30'21") trong suốt 60 phút quan sát — không có lần cài nào
  chạy. Khác boot #60 (0 apt/dpkg chạy — "chạm mà không cài") nhưng
  cùng kết quả: không cài được gì. T5 poll mỗi phút tới 12:38:33Z
  (WATCHER_DONE), ghi POSTBOOT_FAIL, **không kích hoạt luật
  replay-chết** (không có file REPAIR_TRIGGERED trong round122-t5),
  không ghi POSTBOOT_PASS. (Lý do theo log T5 đợt 122: luật §8.2 đánh
  giá lần 2 KHÔNG kích hoạt vì điều kiện 2 không đạt — apt+wrapper
  vẫn sống; đây là chế độ lỗi MỚI (C) "sống nhưng kẹt ở update", cần
  quyết parent đợt 123.) T5 không repair — việc của T5, T1 chỉ ghi
  nhận đúng những gì quan sát được.
- Cờ cây `round116-tree`: status NO-CHANGE (ghi cuối S2/S9; md5
  03bf029f trong cờ là md5 cây GỐC trước H3f — cờ này không cập nhật
  sau khi H3f apply đợt 119; chuẩn đo là md5 live, như các lượt 2/4).
- Lock: 0 dòng `t1-round122` trong vite-lock-v2.log — không lấy lock.
  Lock script live md5 `cd0c05c1f9304d58f7aaf041c25bb8b9` (khớp đợt
  120/121). Lock đang trống từ 10:16:03Z (T10 đợt 121 RELEASED).
- Probe: không chạy (không có thư mục
  `round116-s1/probe-webkit-load0-gop250-e4a3`). Không có số đo
  velocity tick / drift / tailSteadyClosed nào cho lượt này — và T1
  không bịa ra số nào.
- RAM khả dụng: 1026 MB lúc driver khởi động (11:39Z); 747 MB lúc
  11:37Z; load 1,04. Không thử birefnet (RAM < 6 GB guard). Không
  kiểm lại TTS 39.
- Driver: khởi động 11:39:23Z, DEFER 12:39:27Z, exit 3 (theo đúng
  prereg: hết 60 phút không có cờ PASS). Poll mỗi 60 s, checkpoint
  mỗi 5 phút trong run-t1.log. Không reboot giết driver giữa chừng
  (khác đợt 121).

## 3. Đường cờ — ĐÚNG (bài học đợt 121 đã áp dụng)

- Prereg ghi rõ thư mục cờ của luồng hạ tầng **ĐỢT HIỆN TẠI** là
  `hidden_files/round122-t5/` (T5 đợt 122) — không chờ ở thư mục đợt
  cũ nào (round121-t7 / round120-t7). Driver chờ đúng
  `round122-t5/t5-replay-done.md` hoặc `round122-t5/POSTBOOT_PASS`,
  kèm fallback quét mọi file trong round122-t5 có dòng
  "Postboot check-only: exit=0". Không có cờ nào xuất hiện trong
  60 phút — DEFER này là DEFER vì postboot thật sự chưa PASS, không
  phải vì chờ sai đường cờ (khác đợt 121, khi postboot đã PASS từ
  09:27:51Z mà cờ không tới).

## 4. CÂY ĐỔI GIỮA LƯỢT — H3f ĐÃ BỊ GỠ (quan trọng nhất của lượt này)

- md5 `preview.tsx` lúc driver khởi động (11:39:23Z): H3f
  `5be5a250a552357c50cc189de9a9c08a` (khớp prereg). `media.ts`:
  `2c384ed13703809d5e999311147745e7` (không đổi).
- md5 `preview.tsx` lúc kiểm cuối (~12:41Z): baseline
  `03bf029f09b8890b285eacc10a02172b` (mtime 12:02:56Z).
- Người đổi là **T3 đợt 122**, không phải T1 (T1 không sửa production):
  T3 chạy A/B H3f có kiểm soát (chân A = baseline, chân B = H3f),
  kết quả **TRUNG TÍNH**, và đã **GỠ patch H3f lúc 12:02:56Z** theo
  đúng quyết parent đợt 121 ("giữ patch + đo thêm một A/B có kiểm
  soát; nếu cũng TRUNG TÍNH → GỠ patch"). Bằng chứng:
  `round122-t3.done` ("H3f A/B: TRUNG TÍNH, patch ĐÃ GỠ (preview.tsx
  03bf029f), build baseline PASS", 12:04:52Z) và `driver-t3.log`
  (swap H3f→baseline từng leg A1/A2, restore về H3f sau mỗi leg,
  leg B2 cuối xong 12:01:38Z trên H3f, gỡ patch sau đó).
- Việc đổi cây **không làm sai lệch DEFER này** (không có phép đo nào
  chạy trong lượt), nhưng thay đổi nền tảng của cả lô:
  - Cây hiện tại là baseline `03bf029f…` (ổn định sau khi T3 gỡ patch).
  - Theo prereg-e4batch §5: các lượt sau đo trên cây MỚI và **KHÔNG
    gộp số khác cây cho verdict H1/H3** — lượt 2 (VOID, trên H3f)
    đứng riêng; các lượt baseline sau này tự thành nhóm so sánh riêng.
  - Lượt đếm trên H3f: 1 (lượt 2 VOID). Lượt đếm trên baseline: 0.
- **Ảnh hưởng trực tiếp tới T2 / lượt 4:** prereg của T2 đợt 122
  (lượt 4 att2, B gop30) kỳ vọng cây H3f `5be5a250…`. Driver T2 đã
  khởi động 11:40:44Z (md5 lúc đó khớp H3f) và đang chờ cờ
  `round122-t1.done` (tối đa 2 giờ, hạn ~13:45Z). Khi cờ này xuất
  hiện, T2 sẽ kiểm md5 sau khi giữ lock và **tự STOP vì md5 live
  (baseline) khác kỳ vọng (H3f)** nếu không ai quyết trước. **Cần
  quyết parent trước khi T2 đo lượt 4:** đo lượt 4 trên baseline
  (cây mới ổn định) hay apply lại H3f (thì số lượt 4 thuộc cây H3f,
  không gộp với số baseline). T1 KHÔNG tự apply lại H3f.

## 5. Luật đếm / verdict — không đổi

- DEFER-POSTBOOT không đếm (prereg §2). Lượt 3 att3 chạy lại ở đợt
  sau, trên cây baseline `03bf029f…`, phase `e4a3`, gop 250.
- Không có dữ liệu mới cho H1/H3. T1 không tự quyết E4.
- Không retry lượt DEFER vì lý do đo (chỉ retry tối đa 1 lần cho lỗi
  harness — lượt này không phải lỗi harness).

## 6. Những gì KHÔNG làm / không kiểm chứng được

- Không đo được lượt 3 (WebKit chưa đủ điều kiện: GST 0 plugin, thiếu
  5 lib, thiếu 11 pkg apt). Không có probe-results.json, không drift
  recount (không có gì để recount).
- Không xác minh độc lập số thứ tự boot #64 (tạm — chờ T6 đợt 122 đếm
  lại mù #37). Boot_id thì chắc chắn: 3fe7e89e.
- Không biết vì sao T5 không kích hoạt luật replay-chết dù dpkg đóng
  băng 60 phút (apt-get update vẫn chạy — có thể luật yêu cầu "0 apt
  chạy" mới đủ điều kiện; T5 là luồng quyết việc này, xem log T5).
- Không sửa production, không push, không release/tag, không kiểm lại
  TTS 39, không thử birefnet.

## 7. Nợ mở cho đợt sau

- Lượt 3 (A) + lượt 4 (B) vẫn treo — cả hai đều DEFER-POSTBOOT 2 lần
  liên tiếp (đợt 120+122 cho lượt 3; đợt 121+chờ cho lượt 4). Nguyên
  nhân gốc là replay boot kẹt (boot #60 "chạm mà không cài", boot #64
  kẹt ở apt-get update 1h08'+) — hạ tầng (T5) cần xử lý trước khi E4
  đo tiếp được.
- Quyết parent cần: lượt 4 đo trên baseline hay apply lại H3f (xem §4).
- ci-security.yml vẫn 403, chờ user (nợ cũ, không thuộc lượt này).

# Thiết kế auto-trigger birefnet cho sampler (T9-187 — theo quyết (p) aggregate 186)

## 1. Vấn đề (F-186-T9-1)

- Đợt 186: 3 mẫu liên tiếp ≥ guard 6.291.456 kB trên #107 (17:48:05–17:50:05Z,
  max 6.671.932 kB = 106,0% guard, balloon xả về 0). Parent quyết (p) aggregate 186:
  **(i) TÍNH LÀ "guard mở lần đầu"** (chuỗi 0 mẫu ≥ guard ĐỨT sau 39 đợt);
  nhưng KHÔNG có lần chạy birefnet nào (sampler không có code trigger; T9 phát hiện
  lúc phân tích 19:37Z, cửa sổ đã đóng) nên **chuỗi 0 lần chạy vẫn 40 đợt**.
- **(ii) ĐỒNG Ý thêm auto-trigger vào sampler về nguyên tắc — giao T9-187 thiết kế
  (lock riêng + CẤM chạy trong cửa attempt T4 + ngưỡng ≥2 mẫu liên tiếp ≥ guard)
  + kiểm OFFLINE; triển khai live từ đợt 188 nếu kiểm offline đạt
  (parent xem lại ở §12.3-187).**

## 2. Thiết kế (prototype `sampler-autotrigger.py` — CHƯA triển khai live)

| Quy tắc | Giá trị | Căn cứ |
|---|---|---|
| Guard | MemAvailable ≥ 6.291.456 kB (6.144 MiB) | Guard đứng từ đợt 147 |
| Ngưỡng kích hoạt | ≥2 mẫu LIÊN TIẾP ≥ guard (cadence 60 s → crossing bền ≥60 s) | Cửa sổ 186 có 3 mẫu liên tiếp; 1 mẫu đơn có thể là nhiễu/replay thoáng |
| Lock riêng | `birefnet-trigger.lock/` (mkdir nguyên tử, chứa `owner` pid+ts) | Chống 2 lần chạy chồng; lock >3.600 s coi là stale → phá + ghi log |
| Tối đa 1 lần chạy / boot | Cờ `birefnet-fired-<boot8>.flag` | Tránh chạy lặp trong cùng một cửa sổ guard dài |
| CẤM chạy trong cửa attempt T4 | Xem §3 | Quyết (p) 186 |
| Kiểm lại trước khi chạy | Đọc lại /proc/meminfo ngay trước exec; hủy nếu avail < guard | Tránh chạy khi RAM đã tụt (cửa sổ đóng giữa chừng) |
| Đổi boot → reset bộ đếm | consec = 0 khi boot8 đổi | Tránh cộng dồn qua reboot |
| Chế độ mặc định | `--dry-run` (chỉ ghi `WOULD-FIRE`, KHÔNG exec) | An toàn mặc định |
| Bật live | Cần CẢ `--live` VÀ env `T9_AUTOTRIGGER_LIVE=1` | Hai lớp cổng; T9-187 KHÔNG bật live |

## 3. Phát hiện cửa attempt T4 (tín hiệu trên đĩa, không cần phối hợp thêm)

Attempt đang chạy ⟺ tồn tại file `marker-t4-<TAG>` trong `hidden_files/round*-t4/`
mà file `attempt-done-<TAG>` tương ứng CHƯA tồn tại, VÀ:
- hậu tố boot8 của TAG == boot8 hiện tại, VÀ
- mtime của marker ≤ 600 s trước (ngưỡng `VITE_LOCK_AGING_S=600` — tiền lệ T4).

Cơ chế này dùng đúng file T4 đã ghi từ đợt 145: `run-attempt-187.sh` chạm
`marker-t4-<TAG>` lúc bắt đầu attempt và ghi `attempt-done-<TAG>` qua trap EXIT
lúc kết thúc (chỉ SIGKILL/reboot mới ngăn được — lúc đó marker cũ boot/mốc
thời gian sẽ loại theo 2 điều kiện trên, nên attempt chết KHÔNG BAO GIỜ cấm
trigger vĩnh viễn). File `stop-sampler-t4-<TAG>` KHÔNG dùng (đó là sampler nội
bộ của T4, không phải tín hiệu cho T9).

Khi đang attempt: trigger **DEFER** (không chạy, không reset bộ đếm) — mẫu sau
vẫn ≥ guard và attempt đã xong thì chạy. Đánh đổi có chủ ý: an toàn hơn là
không bỏ lỡ — một lần chạy birefnet tranh RAM/CPU với attempt đang chạy có thể
làm hỏng lượt yên; cửa sổ guard thoáng qua mà lỡ thì chỉ mất một cơ hội đo.

## 4. Lệnh chạy khi kích hoạt (live — CHƯA chạy đợt này)

```
server/bgremove/.venv/bin/python server/bgremove/bgremove.py \
  --input <FIXTURE> --output <round-dir>/birefnet-out.mov \
  --session birefnet-general
```

- **FIXTURE CHƯA CHỌN (mục mở, parent/T9-188 quyết trước khi live):** cần một clip
  ngắn đã có trên đĩa, ghi rõ đường dẫn + kích thước + thời lượng trước khi deploy.
  Ứng viên: clip fixture T8 (`stripes-nonperiodic.mp4`, dùng cho probe T4) hoặc
  clip ngắn khác trong repo. KHÔNG tự chọn fixture rồi chạy live khi chưa ghi rõ.
- `bgremove.py` đã có RAM guard nội bộ (đợt 88 P7): session birefnet + RAM dưới
  ngưỡng → fallback u2net. Auto-trigger là lớp ngoài (chỉ chạy khi guard mở);
  guard nội bộ là lớp trong.
- Timeout exec 1.800 s; log đầy đủ vào `birefnet-trigger.log`; sau khi chạy xong
  ghi cờ `birefnet-fired-<boot8>.flag` (kể cả khi bgremove fallback u2net —
  cờ ghi "đã kích hoạt", không ghi "birefnet đã chạy" nếu fallback).
- Sẵn sàng đã kiểm tra đợt này (lúc đóng phiên — xem LIMITS §3):
  `server/bgremove/.venv/bin/python`, `bgremove.py`, `~/.u2net/birefnet-general.onnx`.

## 5. Kiểm OFFLINE — KẾT QUẢ: 13/13 PASS

File: `test-autotrigger-offline.py` (chạy: `python3 test-autotrigger-offline.py`).
KHÔNG đọc /proc thật, KHÔNG chạy birefnet thật: meminfo giả lập + thư mục marker
T4 giả + stub fire_fn (dry-run: 0 lần gọi fire; live-test: đúng 1 lần gọi).

| # | Ca | Kỳ vọng | Kết quả |
|---|---|---|---|
| 1 | 1 mẫu ≥ guard | Không chạy | PASS |
| 2 | 2 mẫu liên tiếp ≥ guard | WOULD-FIRE | PASS |
| 3 | 2 mẫu liên tiếp TRONG attempt | DEFER, không chạy | PASS |
| 4 | Attempt xong, guard vẫn ≥ | WOULD-FIRE ở mẫu sau | PASS |
| 5 | Lock đã có người giữ | Skip, không chạy | PASS |
| 6 | Đã chạy 1 lần trên boot này | Không chạy lại | PASS |
| 7/7b | Marker cũ boot / mtime >600 s | Không coi là attempt → chạy | PASS |
| 8 | Mẫu tụt dưới guard giữa chừng | Bộ đếm reset | PASS |
| 9 | Đổi boot giữa chừng | Bộ đếm reset | PASS |
| 10 | Replay cửa sổ 186 thật (6.466.904/6.671.932/6.384.376) | WOULD-FIRE ở mẫu thứ 2 (17:49:05Z — TRƯỚC attempt1 17:53:23Z) | PASS |
| 10b | Replay 186 nhưng đang attempt | DEFER cả 3 mẫu | PASS |
| 11 | Chế độ live (stub) | fire_fn gọi đúng 1 lần | PASS |

Lưu ý: ở dry-run, WOULD-FIRE ghi log ở MỌI mẫu còn đủ điều kiện (ca 10 ghi 2 lần)
— có chủ ý, để thấy trigger vẫn armed; ở live, cờ fired chặn lần 2 (ca 6/11).
Log chạy: `test-autotrigger-offline-output.txt` — `OFFLINE: 13 PASS, 0 FAIL`.

## 6. Kế hoạch triển khai (đề xuất parent xem ở §12.3-187)

1. **Đợt 188:** T9-188 chọn fixture (ghi rõ đường dẫn/kích thước), chạy prototype
   ở dry-run song song sampler thường 1 đợt để đối chiếu quyết định WOULD-FIRE
   với log sampler thật; nếu khớp → xin parent bật live.
2. **Live (khi parent đồng ý):** sampler mới thay `sampler.sh` (giữ nguyên log
   `ram-sampler.log` + cadence 60 s); `--live` + `T9_AUTOTRIGGER_LIVE=1`.
3. Lần FIRE thật đầu tiên: T9 ghi đầy đủ (thời gian, avail, boot, attempt lúc đó,
   exit code, output) — đó mới là verify end-to-end điểm yếu (b) đợt 147.

## 7. Câu hỏi mở cho parent (không tự quyết)

- (a) Fixture cho lần chạy đầu: chấp nhận clip nào (đề xuất T9-188 chọn rồi báo)?
- (b) Có giới hạn load1 khi chạy không (cửa sổ 186 có load1 tới 5,16 — hiện thiết
  kế KHÔNG giới hạn load, chỉ cấm trong cửa attempt)?
- (c) Nếu guard mở ĐÚNG lúc attempt đang chạy rồi đóng trước khi attempt xong
  (DEFER rồi lỡ): có cho phép "hẹn chạy sau attempt" khi RAM vẫn ≥ guard không,
  hay chỉ chạy khi guard còn mở (thiết kế hiện tại: chỉ khi còn mở)?

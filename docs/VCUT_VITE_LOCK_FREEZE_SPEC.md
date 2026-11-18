# VCUT_VITE_LOCK_FREEZE_SPEC — Spec đóng băng protocol vite lock (v2)

> Đợt 118 T1 — SPEC v2 (quyết parent 15/11/2026, xem
> `docs/PHASE9_ROUND117_LIMITS.md` §13 quyết 4, dựa trên T4 đợt 117:
> 44 ticket / 38 lần giữ / 31 lượt thật, 5 waiter chờ >600 s vẫn giữ
> được lock, vá C 300 s → 301 s tường (giãn 1,003×), aging 600 lật
> hạng đúng mốc created+600 s).
> Nguồn chuẩn duy nhất: `apps/web/scripts/vcut-vite-lock-v2.sh`
> (spec đầy đủ trong header script đó; doc này là BẢN ĐÓNG BĂNG QUY
> TRÌNH DÙNG — không thay thế header script, chỉ ghi cách dùng an toàn
> trong đợt).
> Bản v1 (`apps/web/scripts/vcut-vite-lock.sh`, md5 `fd21193c`) ĐÓNG
> BĂNG làm sao lưu từ đợt 111, KHÔNG dùng nữa, KHÔNG sửa, KHÔNG xóa.
> KHÔNG push/tag. Không sửa production. Không reboot máy.

## 0. Vì sao đóng băng

Trần inotify 63747, headroom thật chỉ ~1657 watch (boot #40; boot #42 xem
§5 LIMITS N7) do ~62k watch bị giữ ngoài cell; 1 vite thường giữ ~1585
watch nên vite thứ hai chết chắc → **vite nối tiếp bắt buộc, tối đa 1 vite
tại một thời điểm**. Protocol lock đã chuẩn hóa ở đợt 111 M8 (mkdir nguyên
tử + owner 5 trường + stale-recovery 3 điều kiện + kill theo pid node
thật). V2 (đợt 114 Q4, vá đợt 115 R4, mặc định aging 600 từ đợt 116 S4)
GIỮ NGUYÊN mọi semantics an toàn của v1 và THÊM: hàng đợi ticket FIFO,
ưu tiên lượt dài (`--prio long`, class 0) + chống đói bằng aging
(normal chờ quá 600 s được nâng lên class 0), `run-attempt` nhả sau mỗi
attempt, cooldown 15 s sau nhả bắt buộc qua file, log đầy đủ mọi sự kiện
vào `hidden_files/vite-lock-v2.log`. Từ đợt 118, mọi luồng dùng v2 theo
doc này; chế độ hỗn hợp v1/v2 bị cấm (đợt 116–117 đã v2-only trên thực tế).

## 1. Acquire bằng BẢN COPY ĐÓNG BĂNG (bắt buộc)

```bash
LOCK_SRC=~/workspace/repo-1/apps/web/scripts/vcut-vite-lock-v2.sh
LOCK_FROZEN=~/workspace/goals/capcut-clone-video-editor/hidden_files/<round>-<thread>/vcut-vite-lock-v2.frozen.sh
cp "$LOCK_SRC" "$LOCK_FROZEN"
bash "$LOCK_FROZEN" acquire <thread> <port> [timeout_s] [stale_min] [owner_pid] [prio]
```

- **Vì sao copy:** script helper là bash, bash đọc file script dần trong
  lúc chạy — sửa file gốc giữa chừng có thể làm acquire đang chạy đọc
  phải nội dung nửa cũ nửa mới. Copy đóng băng còn bảo đảm mọi luồng
  trong một đợt dùng đúng cùng một bản (M5 đợt 111 đã làm theo mẫu này).
- **owner_pid phải là pid driver dài** (tiến trình shell/script giữ lock
  suốt lượt đo), KHÔNG dùng pid của lệnh acquire ngắn. Truyền `$$` của
  driver, hoặc pid của shell đang giữ lock.
- **timeout_s mặc định 1800.** Luồng đo ngắn nên đặt timeout vừa đủ
  (vd 600–900 s) để không treo cả lượt khi hàng đợi kẹt; hết timeout
  thì BỎ lượt vite đó, ghi log, không tự xóa lock.
- **stale_min mặc định 30.** Chỉ giảm khi biết chắc holder đã chết
  (vd test trên lock dir riêng).
- **prio:** `normal` (mặc định, class 1) | `long` (class 0 — lượt đo dài,
  vd giữ 600 s+ hoặc lượt yên). Ưu tiên chỉ sắp xếp giữa các waiter
  ĐANG CHỜ, không cướp holder đang giữ.
- **Cách dùng khuyến nghị — `run-attempt`:** chạy đúng 1 attempt rồi tự
  nhả trong trap (kể cả khi attempt fail / bị kill). Muốn attempt tiếp
  theo phải lấy ticket mới (xếp cuối hàng đợi nếu có waiter khác).
  Dial-wait (chờ tải nền) PHẢI ở ngoài wrapper — giữ lock trong lúc
  dial là lỗi thiết kế, v2 không cho phép về mặt cấu trúc nữa.
  ```bash
  bash "$LOCK_FROZEN" run-attempt <thread> <port> [timeout_s] [stale_min] [prio] -- <cmd...>
  ```

## 2. Poll 2 giây (mặc định v2)

```bash
export VITE_LOCK_POLL_S=2   # mặc định v2; không cần đặt lại
```

Mặc định script v2 là 2 s (v1 là 10 s — M7 đợt 111 nhả rồi giữ lại chỉ
sau ~8 s nên thăm 10 s đã bỏ lỡ 2 cửa). Poll 2 s bắt được cửa nhả-giữ
lại ngắn mà không gây tải đáng kể (mỗi lần thăm chỉ là đọc ticket +
`kill -0` + `curl` cổng owner).

## 3. Cooldown 15 giây sau khi nhả (bắt buộc, script tự bắt)

Luồng vừa nhả lock mà định giữ lại ngay (vd chạy nhiều lượt đo nối tiếp)
**bị script bắt chờ đủ 15 s** (`VITE_LOCK_REACQUIRE_DELAY_S`, mặc định
15 s, theo spec v1 §6) — cooldown ghi vào file trong QUEUEDIR, chỉ delay
cùng-thread reacquire, không chặn luồng khác. File cooldown tích lũy
theo thread; chỉ dọn file cooldown cũ đã hết hạn (>1 ngày) khi luồng hạ
tầng quyết dọn, không bao giờ dọn lock đang sống hay ticket đang chờ.

## 3.1 Thứ tự ghi khi nhả — log RELEASED TRƯỚC, file cooldown SAU (đợt 135 T6, quyết parent đợt 134 §12.3(b))

`cmd_release` (từ đợt 135): tính `hold_s` → `rm owner` + `rmdir LOCKDIR`
→ **`log_event RELEASED` ngay** → ghi file `cooldown-<thread>` → in
`ĐÃ NHẢ`. Thứ tự cũ (đợt 114–134: ghi cooldown TRƯỚC, log RELEASED
sau) để lại cửa sổ nhiều bước giữa hai lần ghi; reboot cắt đúng cửa
sổ đó làm mất dòng RELEASED — ca đầu tiên đợt 134 (t4, ACQUIRED
23:50:17Z, dòng 869 trong log lịch sử; dir đã sạch, `cooldown-t4`
mtime 23:53:53Z chứng minh trap đã chạy tới bước ghi cooldown nhưng
không tới bước ghi log — xem F-134-T6-2,
`docs/PHASE9_ROUND134_T6_LOCKHEALTH_LIMITS.md` §3.1).

Với thứ tự mới, một lần cắt ngang giữa hai bước chỉ mất **file
cooldown** — file này chỉ là mục prune, mất không hại (thread tự ghi
lại ở lần nhả kế; acquire của thread khác không bị chặn; acquire lại
cùng thread chỉ mất 15 s chờ cooldown trong trường hợp xấu nhất) —
và **không để lại ACQUIRED không cặp** trong log. Không đổi gì khác:
guard release, rc, cooldown 15 s, trap, acquire, stale-recovery giữ
nguyên. Cửa sổ còn lại (`rmdir` → `log_event`, một lần append duy
nhất) không xóa được nếu không có journal — ghi nhận trung thực, xem
`docs/PHASE9_ROUND135_T6_LOCKHEALTH_LIMITS.md` §3.2. Phương án fsync
đã cân nhắc và KHÔNG chọn: fsync chỉ bảo đảm độ bền của lần ghi đã
xong, không thu hẹp cửa sổ thứ tự giữa hai lần ghi — đổi thứ tự mới
là thứ sửa đúng lỗi (xem LIMITS đợt 135 §3.1).

Ca ACQUIRED không cặp cũ (t4 đợt 134, dòng 869) **giữ nguyên trong
log lịch sử, không xóa, không sửa** — các đợt sau đếm nó là "đang giữ
giải thích được (F-134-T6-2, holder chết theo reboot)" như T6 đợt 134
§4; chỉ các chu kỳ mới từ đợt 135 mới được hưởng thứ tự mới.

## 4. KHÔNG sửa lock script khi có acquire đang chạy (CẤM)

- **Kiểm tra trước khi sửa:** `bash vcut-vite-lock-v2.sh status` +
  `queue` + `ps` tìm tiến trình nào đang chạy `vcut-vite-lock-v2.sh
  acquire` (kể cả bản copy đóng băng trong scratch của luồng khác).
  Chỉ sửa khi lock TRỐNG **và** không còn acquire nào đang chạy.
- **Tốt nhất: không sửa trong đợt đang chạy.** Mọi thay đổi protocol
  phải đi qua một luồng hạ tầng riêng (như M8/N7/T1 đợt 118) vào đầu
  đợt, khi chưa có luồng nào acquire; sửa xong kiểm lại test suite
  (`test-vite-lock-v2.sh`, 9/9) + smoke acquire/release trên lock thật
  rồi mới cho các luồng khác dùng.
- **Cấm tuyệt đối:** sửa file gốc trong lúc chính mình hoặc luồng khác
  đang acquire bằng bản đó; sửa để "vá nhanh" khi acquire của mình đang
  timeout (timeout là trạng thái, không phải bug của script — xem §5).

## 5. Diễn giải exit code của acquire (không phải mọi exit != 0 đều là timeout)

| Exit | Ý nghĩa | Hành động |
|---|---|---|
| 0 | ĐÃ GIỮ lock (owner mới đủ 5 trường) | Chạy vite; nhớ release đúng thread khi xong |
| 1 | **Acquire timeout** — hết `timeout_s` mà vẫn có lock khác còn tươi (log in `HẾT … vẫn có lock khác (owner: …)`, log `TIMEOUT waited=<wall>s`) | BỎ lượt vite đó, ghi log owner đang giữ + thời gian đã chờ; KHÔNG xóa lock, KHÔNG retry ngay bằng stale_min nhỏ (chỉ retry sau khi holder nhả hoặc đủ 30 phút + đủ 3 điều kiện stale) |
| 1 | **Stale-recovery từ chối** — cùng exit 1 nhưng log in `chưa stale: …` (tuổi < stale_min, hoặc pid owner còn sống, hoặc còn vite/cổng phục vụ) | Đây KHÔNG phải timeout: lock còn tươi theo kiểm tra trực tiếp. Chờ holder nhả; không ép xóa |
| 2 | **Lỗi dùng** (thiếu tham số) | Sửa lệnh gọi của mình, không phải lỗi lock |
| 3 | **`run-attempt` không lấy được lock** (timeout) — mã riêng của wrapper, khác acquire | BỎ attempt đó; hành động như timeout acquire ở trên |
| khác | Lỗi shell/bất thường (vd `set -u`, đường dẫn sai) | Đọc log, kiểm tra tay; không retry mù |

Lưu ý thêm:
- `status` luôn exit 0 (chỉ in thông tin) — không dùng exit của `status`
  để suy ra lock tươi hay stale.
- `kill-vite` exit 1 nghĩa là **vite vẫn sống sau KILL** hoặc **cổng vẫn
  phục vụ mà không tìm được pid node** — khác hẳn timeout của acquire;
  khi đó kiểm tra tay, không `pkill` theo pattern trần.
- `release` exit 1 nghĩa là **owner hiện tại không phải mình** — lock
  KHÔNG bị nhả; kiểm tra lại thread name trước khi kết luận đã nhả.
- **Timeout đo bằng wall-clock** (vá đợt 115 R4): `waited` tính từ thời
  gian tường, không cộng dồn poll-sleep. Kiểm chứng: waiter 300 s dưới
  tải hog nổ sau 301 s tường (giãn 1,003×; trước vá 1,34× — T4 đợt 117
  §2). Với timeout ngắn, overshoot tuyệt đối ≤ ~1 chu kỳ poll (vd
  timeout 5 s nổ sau 7 s tường, poll 2 s — T1 đợt 118 §2); đó là lượng
  tử hóa poll, không phải trôi — đừng nhầm với lỗi cũ.

## 6. Stale-recovery — kiểm lại (v2)

Script test: `apps/web/scripts/test-vite-lock-v2.sh` (9 test, trong đó
có stale-recovery trên lock dir riêng `VITE_LOCK_DIR=/tmp/...`, KHÔNG
đụng lock chung). Kiểm sống trên lock thật: S4 đợt 116 tái tạo đúng bản
ghi lock stale R3 (owner pid 105555 chết + không vite trên cổng 5590 +
curl 000 + boot đổi, tuổi 4200 s) — **v2 PASS: ghi `STALE-LOCK`, xóa
lock và ACQUIRED trong 211 ms** (đường tắt boot-change, không chờ đủ
30 phút tuổi stale_min). Bản v1 đã kiểm đợt 112 N7: **PASS cả 3 ca**
(xem `hidden_files/round112-n7/n7-lock-stale-test.log`).

| Điều kiện stale (v2 giữ nguyên v1, cộng đường tắt boot) | Ghi chú |
|---|---|
| (a) pid trong owner đã chết (`kill -0` thất bại), VÀ (b) không còn vite node trên cổng owner, VÀ (c) curl cổng owner trả về 000 | Đủ 3 điều kiện kiểm tra trực tiếp, không đoán theo tuổi một mình |
| Đường tắt: boot_id đổi (reboot chắc chắn giết holder cũ) | Không chờ đủ tuổi stale_min |
| Dir trống kiểu L4, tuổi > 5 phút, không vite, mọi cổng đã biết 000 | Coi là stale, giữ lại |

## 7. Checklist nhanh cho luồng cần vite

1. `cp` lock script **v2** về scratch của mình (bản đóng băng) — §1.
2. `bash <frozen> acquire <thread> <port> <timeout> 30 <pid-driver-dài> [prio]` — hoặc `run-attempt … -- <cmd>` cho 1 attempt.
3. Chạy vite tạm với `server.watch.ignored: ["**/**"]` (0 watch).
4. Kill vite theo pid node thật (`kill-vite <port>`), kiểm `ps` + `curl` cổng 000.
5. `release <thread>` đúng thread; nếu định giữ lại ngay thì script tự bắt cooldown 15 s — §3.
6. Không bao giờ sửa file lock gốc trong đợt — §4. Không gọi v1.

## 8. Mặc định v2 (đợt 118, không đổi hành vi so với đợt 116–117)

| Biến | Mặc định | Đổi lần cuối |
|---|---|---|
| `VITE_LOCK_AGING_S` | 600 s | Đợt 116 S4 (1800 → 600) |
| Timeout acquire | 1800 s | — |
| `VITE_LOCK_REACQUIRE_DELAY_S` (cooldown) | 15 s | — |
| `VITE_LOCK_POLL_S` | 2 s | — |
| `VITE_LOCK_DIR` | `~/workspace/goals/capcut-clone-video-editor/hidden_files/vite.lock` | — |
| `VITE_LOCK_QUEUE_DIR` | `${VITE_LOCK_DIR}.queue` | — |
| `VITE_LOCK_LOG` | `.../hidden_files/vite-lock-v2.log` | — |

Caveat mang theo từ T4 đợt 117 §2/§6 (không chặn đổi spec): tải hog
`nice -n 19 node` dao động theo chu kỳ ~5 phút trên cell này (pha BẬT
load 25–27 chỉ ~200 s rồi tắt về ~2–6%) — dial ĐẠT theo luật S3 (2 mẫu
liên tiếp + hog ≥90 s) không đảm bảo tải giữ suốt phép đo dài; mọi kết
luận tải phải kèm trace sampler 5 s.

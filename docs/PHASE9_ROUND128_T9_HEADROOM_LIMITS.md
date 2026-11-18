# LIMITS — Phase 9 đợt 128, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 3.212** (đo 05:40:28Z 17/11, boot #74) — **TIẾP TỤC GIẢM**: 3.315 (cuối đợt 127) → **3.212 (−103, −3,1%)**. Đo lặp lại ngay sau đó: 3.211 — hai lần đo khớp nhau ±1, số đo tin cậy.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng 1.412; vẫn gấp ~2,0 lần số watch vite thường cần (~1.586). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 127 §12(h)).
- **RAM khả dụng đợt này: tối đa quan sát được 1.557 MB** (lúc mở đợt, theo brief) — các lần đo trực tiếp của T9 trong 05:40:01–05:40:46Z: **1.392 → 1.346 → 1.325 → 1.286 MB** (đang rơi dần khi các luồng đợt 128 khởi động). Tất cả đều **< 6 GB guard**.
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** 1.557 MB chỉ bằng ~25% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8** (probe tự dừng ở errno 28 khi hết headroom — đó là cách đo, không phải lỗi). Journal boot #74: 0 dòng "No space left"/ENOSPC.
- **Boot mới #74 giữa hai đợt:** btime 04:55:04Z 17/11, boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`; #73 sống 1h50m39s (03:04:25Z → 04:55:04Z, gap 6.639 s). Replay trên #74: **đủ 1.509 dòng dpkg.log** (05:35:43–05:38:51Z, gói cuối gstreamer1.0-tools) — trở lại hình dạng ~1.509 dòng như #73, KHÔNG phải dạng 350 dòng của #72. Đây là quan sát thô cho T5 đợt 128 (§12(i) đợt 127); T5 là chủ quản replay, T9 không kết luận.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 128

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 05:40:28Z | **3.212** | lần đo 1, boot #74 (~45' tuổi) |
| 05:40:46Z | **3.211** | lần đo 2 (lặp lại ngay, khớp ±1) |

- Probe dừng ở `i=3212` / `i=3211`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 3.212 = **60.535 watch**.
- Tỉ lệ so với nhu cầu vite thường (~1.586 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 3.212 / 1.586 ≈ **2,03 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 127 §5 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

| Đợt | Headroom | Ghi chú |
|---|---|---|
| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 (#71?) |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu (#72?) |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt (#73?) |
| **128** | **3.212** | **đo 05:40:28Z, boot #74 (lần 2: 3.211)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 3.212 = **−1.226 (−27,6%)**. Bước giảm đợt này: −103 so với cuối đợt 127 (−3,1%).
- Trong một boot, headroom gần như đứng yên (đợt 127: −10 trên #72?, −2 trên #73?); bước giảm xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673). Đợt này cũng vậy: toàn bộ −103 xảy ra giữa cuối đợt 127 (boot #73) và đầu đợt 128 (boot #74).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **1.412**. Với tốc độ giảm gần đây (~100/đợt, mỗi đợt ~3 giờ) thì còn ~14 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — đây chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 2–17 trong boot). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~60,5k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 128 (trực tiếp)

| Thời điểm (UTC 17/11) | RAM khả dụng | Nguồn |
|---|---|---|
| ~05:35:51Z (mở đợt) | **1.557 MB** | brief giao đợt (không phải số T9 đo trực tiếp) |
| 05:40:01Z | 1.392 MB (MemAvailable 1.433.436 kB) | `free -m` / `/proc/meminfo`, T9 đo |
| 05:40:28Z | 1.346 MB (MemAvailable 1.378.468 kB) | cùng lúc đo headroom lần 1 |
| 05:40:28Z | 1.325 MB (MemAvailable 1.357.236 kB) | ngay sau probe headroom lần 1 |
| 05:40:46Z | 1.286 MB (MemAvailable 1.316.988 kB) | cùng lúc đo headroom lần 2 |

- **Xu hướng trong cửa sổ đo (45 giây): rơi ~106 MB** (1.392 → 1.286 MB) — khớp mẫu đã biết: RAM dao động mạnh theo các luồng khác đang khởi động trong đợt (T9 không đo baseline idle; nợ baseline idle đã đóng đợt 125).
- Không có mức thấp kỷ lục mới đợt này: thấp nhất quan sát 1.286 MB, còn xa kỷ lục thấp 483 MB (T10 đợt 127 lúc chạy suite) và 547 MB (T5 đợt 127 lúc mở).

### 2.2 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt)

| Đợt | Lúc mở | Dao động trong lượt | Cuối lượt |
|---|---|---|---|
| 124 | — | — | 1.664 MB |
| 125 | 1.140 MB | 987–2.378 MB | 1.788 MB |
| 126 | 1.247 MB | 834–2.551 MB | 1.666 MB |
| 127 | 547 MB (kỷ lục thấp T5) | 547–2.551 MB (#72?); 1.098–1.551 MB (#73?) | ~1.102 MB |
| **128** | **1.557 MB** (brief) | **1.286–1.557 MB** (cửa sổ đo của T9, 45 giây) | — (chưa đo cuối lượt; không thuộc T9) |

- Mẫu chung giữ nguyên qua 5 đợt: **dao động mạnh theo luồng khác, biên độ ~1.000–2.000 MB trong vài phút**; mọi số đo đều xoay quanh ~1–2,5 GB, chưa bao giờ chạm guard 6 GB.
- Swap đã dùng 242 MB / 1.023 MB lúc 05:40:01Z — máy có dùng swap nhưng không phải mức báo động mới (đợt 127 lúc 85m4 kẹt: swap ~428 MB).

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **1.557 MB = 25,3% guard** — thiếu 4.587 MB.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~4×, hạ guard không có cơ sở đo).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 05:40Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 3.212 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=3212/3211) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`).
- Journal boot #74 từ 04:55:00Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng, exit 0).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot #74 — quan sát thô cho T5 (không thuộc verdict T9)

- **Boot mới #74 giữa hai đợt** (sau khi T10 đóng đợt 127 lúc ~04:28:53Z, trước khi đợt 128 mở 05:35:51Z): btime **04:55:04Z** 17/11 (`uptime -s` + `btime 1794891304` trong `/proc/stat` + `who -b` + journal chỉ còn 1 boot), boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`.
- **#73 sống 1h50m39s** (03:04:25Z → 04:55:04Z; gap #73→#74 = **6.639 s**). Chuỗi tuổi thọ boot gần đây: #72? 54m08s, #73? 1h50m39s.
- **Replay trên #74: đủ 1.509 dòng dpkg.log** (`grep -c . /var/log/dpkg.log` = 1.509; dòng đầu 05:35:43Z, dòng cuối gstreamer1.0-tools installed 05:38:51Z) — **trở lại hình dạng ~1.509 dòng như #73, KHÔNG phải dạng 350 dòng của #72**. Replay bắt đầu muộn (+40m39s sau boot) nhưng đủ dòng và xong trước khi đợt 128 mở. Đây là dữ liệu thô cho nợ T5 đợt 128 (§12(i) đợt 127: nếu #73/#74 trở lại ~1.509 dòng thì #72 là ngoại lệ một lần). **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào đang chạy lúc T9 kiểm (05:40Z).

## 6. Nợ mở chuyển đợt 129 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 1.412 trên ngưỡng báo < ~1.800; tốc độ giảm gần đây ~100/đợt nhưng không đều, không dự báo ngày chạm ngưỡng.
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Boot #74 + replay 1.509 dòng** — giao T5 đợt 128 xác nhận/xử lý theo §12(i) đợt 127 (đã có 1 mẫu trở lại ~1.509 dòng).
4. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 127 §11: DEF v0.4 (T3), mù #47 (T4), 85m4 chạy lại (T8), lượt yên WebKit #7 chạy lại (T9 — xếp lịch lệch T9-yên TRƯỚC, T8-harness SAU), R9 (a) chờ user, G1 chờ user quyết, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 7. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND128_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round128-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round128-t9/headroom-measure-1.log` (đo lần 1 + RAM) và `headroom-measure-2.log` (đo lần 2 + RAM + boot/replay) — không nằm trong repo nên không stage.
- Cờ `round128-t9.done` đã tạo khi xong. Hạn ~07:30Z 17/11 — xong lúc ~05:4xZ, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.

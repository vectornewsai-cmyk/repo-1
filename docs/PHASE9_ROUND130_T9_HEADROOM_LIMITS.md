# LIMITS — Phase 9 đợt 130, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.963** (đo lần 2, 11:39:54Z 17/11, boot mới btime 10:56:31Z) — **TIẾP TỤC GIẢM**: 3.079 (đợt 129) → **2.963 (−116, −3,8%)**. Đo lần 1 ngay trước đó: 2.974 — hai lần đo khớp nhau −11, số đo tin cậy.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng 1.163; vẫn gấp ~1,88 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 127 §12(h), giữ nguyên đợt 128, đợt 129).
- **RAM khả dụng đợt này: 688–1.246 MB** (đo trực tiếp của T9 trong 11:37:39–11:39:55Z; brief lúc mở ~1.025 MB). Tất cả đều **< 6 GB guard** (6.144 MB).
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 1.246 MB chỉ bằng ~20,3% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8** (probe tự dừng ở errno 28 khi hết headroom — đó là cách đo, không phải lỗi). Journal boot mới: 0 dòng "No space left"/ENOSPC.
- **Boot mới giữa hai đợt:** btime 10:56:31Z 17/11, boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`; #76 (đợt 129, btime 09:02:12Z) sống ~1h54m19s (09:02:12Z → 10:56:31Z). Replay trên boot mới **MỚI BẮT ĐẦU lúc T9 kiểm** (dpkg.log chỉ 2 dòng `startup packages configure` lúc 11:35:39–11:35:40Z, chưa có dòng install nào tới 11:39:54Z) — đây là quan sát thô cho T5 đợt 130, T9 không kết luận.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 130

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 11:37:45Z | **2.974** | lần đo 1, boot mới (~41' tuổi) |
| 11:39:54Z | **2.963** | lần đo 2 (cuối lượt T9, khớp −11) |

- Probe dừng ở `i=2974` / `i=2963`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.963 = **60.784 watch**.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.963 / 1.578 ≈ **1,88 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

| Đợt | Headroom | Ghi chú |
|---|---|---|
| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt |
| 128 | 3.212 | đo 05:40:28Z, boot #74 (lần 2: 3.211) |
| 129 | 3.086 → 3.079 | đo 08:39:03Z → 08:40:47Z, boot #75 |
| **130** | **2.974 → 2.963** | **đo 11:37:45Z → 11:39:54Z, boot mới btime 10:56:31Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.963 = **−1.475 (−33,2%)**. Bước giảm đợt này: −116 so với đợt 129 (−3,8%).
- Trong một boot, headroom gần như đứng yên (đợt này: −11 trong ~129 giây; đợt 129: −7; đợt 128: −1; đợt 127: −10 / −2); bước giảm xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673). Đợt này cũng vậy: toàn bộ −116 xảy ra giữa cuối đợt 129 (boot #76) và đầu đợt 130 (boot mới).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **1.163**. Với tốc độ giảm gần đây (~110–130/đợt, mỗi đợt ~3 giờ) thì còn ~9–10 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — đây chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 2–17 trong boot). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~60,8k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 130 (trực tiếp)

| Thời điểm (UTC 17/11) | RAM khả dụng | Nguồn |
|---|---|---|
| ~11:35:51Z (mở đợt) | **~1.025 MB** | brief giao đợt (không phải số T9 đo trực tiếp) |
| 11:37:39Z | 688 MB (MemAvailable 704.860 kB) | `free -m` / `/proc/meminfo`, T9 đo |
| 11:37:45Z | 807 MB (MemAvailable 827.536 kB) | ngay trước probe headroom lần 1 |
| 11:37:46Z | 804 MB (MemAvailable 823.444 kB) | ngay sau probe headroom lần 1 |
| 11:37:50Z | 761 MB (MemAvailable 779.440 kB) | kiểm journal/dpkg |
| 11:39:54Z | 1.246 MB (MemAvailable 1.276.168 kB) | ngay trước probe headroom lần 2 |
| 11:39:55Z | 1.238 MB (MemAvailable 1.268.032 kB) | ngay sau probe headroom lần 2 |

- **Dao động trong cửa sổ đo (~2 phút): 688 → 1.246 MB (biên độ ~558 MB)** — RAM rơi từ ~1.025 MB (lúc mở) xuống 688 MB rồi hồi lên 1.246 MB trong vòng ~2 phút, trùng lúc các luồng đợt 130 khởi động. **Chỉ ghi nhận tương quan, không kết luận nhân quả** (cùng lưu ý như đợt 128/129).
- Không có mức thấp kỷ lục mới đợt này: thấp nhất quan sát 688 MB, còn xa kỷ lục thấp 483 MB (T10 đợt 127 lúc chạy suite) và 547 MB (T5 đợt 127 lúc mở).
- Swap đã dùng 256 MB / 1.023 MB lúc 11:37:39Z — máy có dùng swap nhưng không phải mức báo động mới (đợt 127 lúc 85m4 kẹt: swap ~428 MB).

### 2.2 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt | Cuối lượt |
|---|---|---|---|
| 124 | — | — | 1.664 MB |
| 125 | 1.140 MB | 987–2.378 MB | 1.788 MB |
| 126 | 1.247 MB | 834–2.551 MB | 1.666 MB |
| 127 | 547 MB (kỷ lục thấp T5) | 547–2.551 MB; 1.098–1.551 MB | ~1.102 MB |
| 128 | 1.557 MB (brief) | 1.286–1.557 MB (cửa sổ đo của T9, 45 giây) | — (không thuộc T9) |
| 129 | ~1.152 MB (brief) | 908–1.339 MB (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| **130** | **~1.025 MB** (brief) | **688–1.246 MB** (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 7 đợt: **dao động mạnh theo luồng khác, biên độ ~400–2.000 MB trong vài phút**; mọi số đo đều xoay quanh ~1–2,5 GB, chưa bao giờ chạm guard 6 GB.

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **1.246 MB = 20,3% guard** — thiếu 4.898 MB. (Số brief lúc mở ~1.025 MB còn thấp hơn.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~4–5×, hạ guard không có cơ sở đo).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 11:37–11:39Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.963 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2974/2963) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal boot mới từ 10:56:31Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot mới — quan sát thô cho T5 (không thuộc verdict T9)

- **Boot mới giữa hai đợt** (sau khi đợt 129 đóng 10:02:05Z, trước khi đợt 130 mở 11:35:51Z): btime **10:56:31Z** 17/11 (`uptime -s` + `btime 1794912991` trong `/proc/stat` + boot_id `86538084-410e-41d4-a4bf-e68574dc2d91`).
- **Boot #76 (đợt 129) sống ~1h54m19s** (09:02:12Z → 10:56:31Z). Reboot giữa đợt đóng và lượt mở lần thứ 5 liên tiếp.
- **Replay trên boot mới: MỚI BẮT ĐẦU lúc T9 kiểm.** dpkg.log chỉ 2 dòng lúc 11:39:54Z, cả hai đều `startup packages configure` (11:35:39Z và 11:35:40Z) — replay bắt đầu +39m08s sau boot và **chưa có dòng install nào** khi T9 đo. **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường"; T5 đợt 130 kiểm lại sau khi replay xong để đối chiếu hình dạng 1.509 dòng.**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Nợ mở chuyển đợt 131 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 1.163 trên ngưỡng báo < ~1.800; tốc độ giảm gần đây ~110–130/đợt nhưng không đều, không dự báo ngày chạm ngưỡng.
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Boot mới + replay mới bắt đầu lúc 11:35:39Z** — giao T5 đợt 130 xác nhận hình dạng replay sau khi xong (đối chiếu 1.509 dòng của #73/#74/#75/#76).
4. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 129 §11: lượt yên WebKit #8 (T4, đợt 130, probe mới), (c2) instrumentation (T5, đợt 130, đã phê duyệt có giới hạn), mù #49 probe thường lệ, G1 chờ user quyết, R9 (a) chờ user, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 7. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND130_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round130-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round130-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot) và `headroom-measure-2.log` (đo lần 2 + RAM + replay thô) — không nằm trong repo nên không stage.
- Cờ `round130-t9.done` đã tạo khi xong. Hạn ~14:35Z 17/11 — xong lúc ~11:4xZ, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.

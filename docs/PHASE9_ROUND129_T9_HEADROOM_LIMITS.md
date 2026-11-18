# LIMITS — Phase 9 đợt 129, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 3.079** (đo lần 2, 08:40:47Z 17/11, boot #75) — **TIẾP TỤC GIẢM**: 3.212 (đợt 128) → **3.079 (−133, −4,1%)**. Đo lần 1 ngay trước đó: 3.086 — hai lần đo khớp nhau ±7, số đo tin cậy.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng 1.279; vẫn gấp ~1,95 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 127 §12(h), giữ nguyên đợt 128).
- **RAM khả dụng đợt này: 908–1.339 MB** (đo trực tiếp của T9 trong 08:38:58–08:40:47Z; brief lúc mở ~1.152 MB). Tất cả đều **< 6 GB guard** (6.144 MB).
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 1.339 MB chỉ bằng ~22% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8** (probe tự dừng ở errno 28 khi hết headroom — đó là cách đo, không phải lỗi). Journal boot #75: 0 dòng "No space left"/ENOSPC.
- **Boot mới #75 giữa hai đợt:** btime 07:13:31Z 17/11, boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`; #74 sống ~2h18m27s (04:55:04Z → 07:13:31Z). Replay trên #75 **ĐANG CHẠY lúc T9 kiểm** (dpkg.log 1.368 dòng lúc 08:40:47Z, bắt đầu 08:35:43Z, gói mới nhất nasm đang cài) — chưa xong nên chưa đối chiếu hình dạng 1.509 dòng; đây là quan sát thô cho T5 đợt 129, T9 không kết luận.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo), xong sớm để máy yên cho T4 lượt yên #7 lần 3.

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 129

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 08:39:03Z | **3.086** | lần đo 1, boot #75 (~1h25' tuổi) |
| 08:40:47Z | **3.079** | lần đo 2 (cuối lượt T9, khớp −7) |

- Probe dừng ở `i=3086` / `i=3079`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 3.079 = **60.668 watch**.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 3.079 / 1.578 ≈ **1,95 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

| Đợt | Headroom | Ghi chú |
|---|---|---|
| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt |
| 128 | 3.212 | đo 05:40:28Z, boot #74 (lần 2: 3.211) |
| **129** | **3.086 → 3.079** | **đo 08:39:03Z → 08:40:47Z, boot #75** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 3.079 = **−1.359 (−30,6%)**. Bước giảm đợt này: −133 so với đợt 128 (−4,1%).
- Trong một boot, headroom gần như đứng yên (đợt này: −7 trong ~104 giây; đợt 128: −1; đợt 127: −10 / −2); bước giảm xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673). Đợt này cũng vậy: toàn bộ −133 xảy ra giữa cuối đợt 128 (boot #74) và đầu đợt 129 (boot #75).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **1.279**. Với tốc độ giảm gần đây (~130/đợt, mỗi đợt ~3 giờ) thì còn ~10 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — đây chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 2–17 trong boot). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~60,7k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 129 (trực tiếp)

| Thời điểm (UTC 17/11) | RAM khả dụng | Nguồn |
|---|---|---|
| ~08:35:51Z (mở đợt) | **~1.152 MB** | brief giao đợt (không phải số T9 đo trực tiếp) |
| 08:38:58Z | 908 MB (MemAvailable 930.148 kB) | `free -m` / `/proc/meminfo`, T9 đo |
| 08:39:03Z | 976 MB (MemAvailable 999.596 kB) | ngay sau probe headroom lần 1 |
| 08:40:47Z | 1.275 MB (MemAvailable 1.309.276 kB) | trước probe headroom lần 2 |
| 08:40:47Z | 1.339 MB (MemAvailable 1.371.692 kB) | ngay sau probe headroom lần 2 |

- **Dao động trong cửa sổ đo (~2 phút): 908 → 1.339 MB (biên độ ~431 MB)** — RAM rơi đột ngột từ ~1.152 MB (lúc mở) xuống 908 MB rồi hồi lên 1.339 MB trong vòng ~2 phút, trùng lúc các luồng đợt 129 khởi động. **Chỉ ghi nhận tương quan, không kết luận nhân quả** (cùng lưu ý như đợt 128: RAM rơi 1.942→900 MB trùng attempt3 pass-timeout của T4 — chỉ tương quan).
- Không có mức thấp kỷ lục mới đợt này: thấp nhất quan sát 908 MB, còn xa kỷ lục thấp 483 MB (T10 đợt 127 lúc chạy suite) và 547 MB (T5 đợt 127 lúc mở).
- Swap đã dùng 258 MB / 1.023 MB lúc 08:38:58Z — máy có dùng swap nhưng không phải mức báo động mới (đợt 127 lúc 85m4 kẹt: swap ~428 MB).

### 2.2 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt | Cuối lượt |
|---|---|---|---|
| 124 | — | — | 1.664 MB |
| 125 | 1.140 MB | 987–2.378 MB | 1.788 MB |
| 126 | 1.247 MB | 834–2.551 MB | 1.666 MB |
| 127 | 547 MB (kỷ lục thấp T5) | 547–2.551 MB; 1.098–1.551 MB | ~1.102 MB |
| 128 | 1.557 MB (brief) | 1.286–1.557 MB (cửa sổ đo của T9, 45 giây) | — (không thuộc T9) |
| **129** | **~1.152 MB** (brief) | **908–1.339 MB** (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 6 đợt: **dao động mạnh theo luồng khác, biên độ ~400–2.000 MB trong vài phút**; mọi số đo đều xoay quanh ~1–2,5 GB, chưa bao giờ chạm guard 6 GB.

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **1.339 MB = 21,8% guard** — thiếu 4.805 MB. (Số brief lúc mở ~1.152 MB còn thấp hơn.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~4–5×, hạ guard không có cơ sở đo).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 08:38–08:40Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 3.079 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=3086/3079) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn).
- Journal boot #75 từ 07:13:31Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot #75 — quan sát thô cho T5 (không thuộc verdict T9)

- **Boot mới #75 giữa hai đợt** (sau khi đợt 128 đóng ~06:13Z, trước khi đợt 129 mở 08:35:51Z): btime **07:13:31Z** 17/11 (`uptime -s` + `btime 1794899611` trong `/proc/stat` + `who -b` + boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`).
- **#74 sống ~2h18m27s** (04:55:04Z → 07:13:31Z; gap #74→#75 chưa tính được chính xác vì thời điểm #74 dừng không nằm trong log T9 — T5 là chủ quản nếu cần).
- **Replay trên #75: ĐANG CHẠY lúc T9 kiểm.** dpkg.log 1.368 dòng lúc 08:40:47Z; dòng đầu `2026-11-17 08:35:43 startup packages configure`, dòng cuối lúc kiểm `status installed nasm:amd64 2.16.01-1build1`. Replay bắt đầu muộn (+82m12s sau boot) và **chưa xong** khi T9 đo — khác #74 (xong 1.509 dòng trước khi đợt 128 mở). **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường"; T5 đợt 129 kiểm lại sau khi replay xong để đối chiếu hình dạng 1.509 dòng.**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Nợ mở chuyển đợt 130 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 1.279 trên ngưỡng báo < ~1.800; tốc độ giảm gần đây ~130/đợt nhưng không đều, không dự báo ngày chạm ngưỡng.
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Boot #75 + replay đang chạy lúc 08:40:47Z** — giao T5 đợt 129 xác nhận hình dạng replay sau khi xong (đối chiếu 1.509 dòng của #73/#74).
4. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 128 §11: lượt yên WebKit #7 chạy lại lần 3 (T4, đợt 129), (c2) +1f tái hiện 3 lần → T5 đợt 129 chẩn đoán, G1 chờ user quyết, R9 (a) chờ user, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 7. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND129_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round129-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round129-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot) và `headroom-measure-2.log` (đo lần 2 + RAM + replay thô) — không nằm trong repo nên không stage.
- Cờ `round129-t9.done` đã tạo khi xong. Hạn ~10:30Z 17/11 — xong lúc ~08:4xZ, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.

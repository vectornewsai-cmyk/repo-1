# Phase 9 đợt 70 — luồng X2: thử nghiệm gate mở rộng — giả thiết A1 KHÔNG xác nhận, GIỮ gate 6 s

**Ngày:** 09/11/2026 (23:38–00:11). **Trạng thái:** ĐO XONG — VERDICT: **KHÔNG XÁC NHẬN A1,
KHÔNG NỐI PRODUCTION.** Harness gốc `measure-65r8-presented-fps.mjs` KHÔNG đổi; gate 6 s
hiện tại KHÔNG đổi. Không push (chỉ stage).

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| Giả thiết A1 (tốc độ vẽ cửa sổ 2, phát liên tục giây 6–16 không seek ≈ tốc độ vẽ slot 10 s cùng phiên) | **SAI.** 2/2 phiên có số gate2 đều FAIL ở cửa sổ 2 nhưng slot vẽ khỏe. Khớp A1 ở cấp phiên: **0/2**. |
| Gate mở rộng có bắt được false-negative của gate 6 s không? | Không chứng minh được — gate2 **không PASS phiên nào** nên FN = 0 chỉ là hệ quả tầm thường của "luôn FAIL". |
| Gate mở rộng có gây false-positive không? | **CÓ, nặng: 4/5 slot (80%, Wilson 95% [38%, 96%])** — gate2 FAIL nhưng slot draw ≥ 2 fps. Ở phiên sạch (load lặng): FP 3/3 slot. |
| Có nối production (thay gate 6 s) không? | **KHÔNG.** Prototype ở lại dạng harness/script thử nghiệm. |
| Gate 6 s hiện tại có còn dùng được không? | CÓ — nó chặn đúng 4 phiên máy không đủ sức vẽ trong đợt này (xem §6), và FN 3/9 slot gộp của nó là con số đã biết từ W8, không tệ đi. |

## 2. Kết quả đo thật — 6 phiên thử (2 phiên có số gate2, 4 phiên chết ở gate 1)

Clip `long1080.mp4` 20 s, canvas preview backing 871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB.
Launcher variant X2 (dựa trên V4, import qua data: URL): gate 1 giữ nguyên, thêm cửa sổ 2
(phát tiếp 10 s, không seek, đo riêng delta2, FAIL không dừng đo) + time-course 16 s mẫu 1 s
sau slot. Ngưỡng: gate 1 delta ≥ 20/6 s (3,33 fps); gate 2 delta2 ≥ 20/10 s (2,0 fps);
FN = slot draw < 2 fps (định nghĩa W8).

| Phiên | Thời gian / trạng thái VM | Gate 1 (delta) | Gate 2 (delta2 / rate2) | Slot draw (fps) | Slot presented mean | Ghi chú |
|---|---|---|---|---|---|---|
| **S1** partial | 23:48–23:51, lạnh sau reboot ~23:40, load 9,5–12,8 | 22 PASS | **2 / 0,20 fps FAIL** (ct 6,567→16,833) | **5,06 / 0,57** (rep 3 mất) | 17,7 / 8,68 | Harness chết ở rep 3: `CDP.send timeout 60s` (renderer đói CPU dưới load ~13–30). Không có JSON, không có time-course — số lấy từ console log + `presented-fps.log`. |
| S2 | 23:57, load vọt 0,65→3,83 | 2 FAIL (ct 1,167) | — (không tới) | — | — | Gate 1 chặn đúng phiên máy yếu. |
| S3 | 00:02, load ~5 | 2 FAIL (ct 0,967) | — | — | — | Như S2. |
| **S4** hoàn chỉnh | 00:04–00:06, **load lặng 0,5–0,9** | 43 PASS | **10 / 1,00 fps FAIL** (ct 6,567→17,133; presented trong cửa sổ 2: **21 fps**, q 71→281) | **8,39 / 8,78 / 8,34** (mean 8,50) | **29,76** | Exit 0, 2/2 pass. Time-course: 0–6s 9,67 fps, 6–16s 9,6 fps, sau/trước **0,99x** (không sụp). Đối chứng tab trắng: presented 30,8. |
| S5 | 00:07, load vọt 3,67→5,79 | 2 FAIL (ct 6,467, q.total 48) | — | — | — | Element phát tốt nhưng canvas draw chỉ +2. |
| S6 | 00:10–00:11, load 1-min 1,30 (5-min avg 3,43) | 2 FAIL (ct 0,833) | — | — | — | Burner mới của luồng khác vừa khởi động lúc 00:10. |

**Đọc đúng bảng:** phiên quyết định là **S4** (load lặng, hoàn chỉnh, exit 0): gate2 FAIL
trong khi slot khỏe nhất từng đo (draw 8,50 / presented 29,76, vượt cả V4-P2 ấm:
6,11 / 23,68). S1 (partial, load cao) cho cùng hướng: gate2 FAIL (0,20 fps) nhưng slot
rep 1 ngay sau đó vẽ 5,06 fps dưới load còn cao hơn lúc đo gate2.

### Gộp (JSON hoàn chỉnh: V4-P1, V4-P2, X2-S4 — 9 slot, 3 phiên)

- FN gate 6 s cũ: **3/9 (33%, Wilson 95% [12%, 65%])** — gồm 3 slot của V4-P1 lạnh.
- FN gate mở rộng: **0/9 (Wilson [0, 0,30])**, FP mới: **3/9** — toàn bộ FP nằm ở S4.
- Tính cả S1 partial (2 slot, nguồn console log): FP gate mở rộng **4/5 slot (80%,
  Wilson 95% [38%, 96%])**; khớp A1 ở cấp phiên **0/2**.

## 3. Vì sao A1 sai — bằng chứng cơ chế (không phải chỉ tương quan)

Ba số đo **trong cùng phiên S4** mâu thuẫn trực tiếp với nhau nếu A1 đúng:

1. **Cửa sổ 2 (resume từ pause, không seek):** draw 1,00 fps.
2. **Time-course (seek-0 + waitIdle, phát liên tục 16 s, mẫu 1 s):** 0–6 s 9,67 fps,
   6–16 s 9,6 fps, tỉ lệ sau/trước 0,99x — **không sụp** sau 6 s. Buckets 2 s:
   11,5 / 9,5 / 8 / 8,5 / 8 / 9 / 11,5 / 11 fps — ổn định suốt 16 s.
3. **Slot (seek-0 + waitIdle, phát 10 s):** draw 8,34–8,78 fps.

Cùng khoảng thời gian phát 6–16 s, cùng phiên, cùng clip — nhưng đo bằng thủ tục
resume-từ-pause thì 1,0 fps, đo bằng thủ tục seek-0 thì 9,6 fps. **Sụp draw là đặc thù
của thủ tục resume, không phải của thời gian phát.** A1 (đồng nhất 2 thủ tục) vì vậy sai
ngay từ tiền đề.

Bằng chứng bổ sung — **draw và presented tách rời trong cửa sổ 2:** ở S4, element vẫn
trình chiếu tốt trong cửa sổ 2 (presented 71→281, tức 21 fps; ct +10,6 s; mediaRate ~1x)
trong khi canvas chỉ vẽ thêm 10 khung/10 s. Draw (số lần canvas vẽ khung mới,
`__vcutHoldStats.draw`) đóng băng, presented (khung element trình chiếu thật) thì không.
Gate 2 đo draw, nên nó đo "canvas có vẽ tiếp không sau khi resume", không đo "video có
phát tiếp được không" — và canvas sau resume thì không vẽ tiếp (xem §4: cơ chế chưa rõ).

## 4. Cơ chế chưa rõ — câu hỏi mở cho đợt sau (KHÔNG suy đoán thành kết luận)

Vì sao resume-từ-pause (không seek, không waitIdle) làm canvas draw đứng yên trong khi
presented vẫn 21 fps? Các giả thuyết (chưa kiểm chứng, cần đo riêng):

- (a) Preview idle/hold: sau khi pause ở gate 1, vòng preview có thể quay lại trạng thái
  ngủ (`__vcutPreviewIdle.sleeping`) hoặc `decideVideoFrame`/`holdFrame` giữ khung cũ
  vì thiếu tín hiệu "seek mới" để đánh thức — trong khi slot luôn seek-0 + waitIdle nên
  đi qua đúng đường đánh thức.
- (b) Element `readyState` = 1 ở cuối gate 1 (chỉ HAVE_METADATA) — element có thể ở trạng
  thái cần đệm lại sau pause, và logic hold/skip giữ khung trong lúc đó dù `currentTime`
  vẫn tiến (đo ở S4: rs cuối cửa sổ 2 vẫn = 1).
- (c) rAF bị bóp sau resume: cần đối chiếu `ticks` trong cửa sổ 2 (chưa ghi — launcher X2
  chỉ ghi draw/ct/q, không ghi ticks/rs theo thời gian trong cửa sổ 2).

**Hướng thiết kế lại (đề xuất, chưa làm):** nếu vẫn muốn bắt FN của gate 6 s, đừng đo
"phát tiếp không seek". Ứng viên cần thử nghiệm riêng: (i) đo lại gate 1 sau 1 slot
(seek-0 lần 2, cách lần 1 ~10–20 s); (ii) đo gate 1 hai lần seek-0 liên tiếp rồi so sánh;
(iii) trước hết điều tra (a)–(c) bằng probe ghi `idle.sleeping`/`ticks`/`rs` trong lúc
resume — 1 phiên là đủ để phân biệt.

## 5. Thiết kế thử nghiệm X2 (để đợt sau tái hiện hoặc bác bỏ)

- Launcher `apps/web/scripts/measure-70x2-gate-window-launcher.mjs`: 19 thay thế trên
  harness gốc (15 kế thừa V4 + 4 của X2: khai báo `gateExt`/`timeCourse`, khối cửa sổ 2,
  khối time-course, thêm trường vào report JSON), import qua data: URL, harness gốc
  KHÔNG sửa. Gate 1 + logic slot + đối chứng tab trắng giữ nguyên 100%.
- Cửa sổ 2 đo RIÊNG delta2 (ngủ yên 10 s, không lấy mẫu giữa chừng — cùng phương pháp
  gate 1, tránh overhead CDP). `drawAt6b` đọc lại sau gate 1 khớp đúng `drawAfter`
  (S1: 24=24; S4: 45=45) — không trôi khi dừng. Clip-guard (ct cuối gate 1 ≤ 10 s) PASS
  cả 2 phiên (ct 6,567).
- Cửa sổ 2 ghi thêm presented: `qAt6`/`qAt16` + `presentedRate2Fps` (thêm sau phiên 1,
  khi nhận ra cần phân biệt draw-sụp vs presented-sụp). Time-course ghi thêm `qTotal`
  theo mẫu 1 s.
- Phân tích `apps/web/scripts/analyze-70x2-gate-window.mjs`: đọc JSON V4 + JSON X2,
  in bảng gate-vs-slot, FN/FP, Wilson CI, time-course; verdict A1 theo luật: ≥1 phiên X2
  hoàn chỉnh mà gate2 FAIL nhưng slot khỏe → KHÔNG XÁC NHẬN.
- Môi trường: config vite `.cjs` pre-create tại `/tmp/round70-x2/vite.x2-presented.config.cjs`
  (file-tool, né EPERM theo V4 §5); cổng 5560/9660; mỗi phiên một `R8_SCRATCH` riêng.

## 6. Quan sát phụ — gate 1 vẫn làm đúng việc (không phải kết quả chính)

- 4 phiên S2/S3/S5/S6 chết ở gate 1 với **delta đúng bằng 2** (draw 2→4) — trạng thái
  "máy không đủ sức vẽ" điển hình. 2 phiên trong đó element cũng lag (ct ~0,8–1,2 sau 6 s);
  S5 element phát tốt (ct 6,467, q 48) nhưng canvas draw vẫn +2 — dưới load, draw có thể
  đóng băng ngay cả khi element trình chiếu bình thường.
- Gate 1 qua/chết theo trạng thái VM (sóng load của các luồng đợt 70 khác: node busy-loop,
  ffmpeg encode 8K, tsc, birefnet probe — load 1-min dao động 0,5 → 29,8 trong đêm):
  S4 qua với delta 43 lúc load 0,7; S2/S3/S5/S6 chết với delta 2 lúc load vọt.
  Nhất quán với V4 §2.2 — không phải lỗi thủ tục đo.
- Phiên 1 chết ở rep 3 (`CDP.send timeout 60s: Runtime.evaluate`, load ~13–30): renderer
  bị đói CPU, không trả lời evaluate trong 60 s. Log Chrome chỉ có lỗi dbus lành tính.
  Harness chết trước khi ghi JSON — số S1 chỉ còn trong console log + `presented-fps.log`
  (đã lưu tại `/tmp/round70-x2/session1-console.log` và `hidden_files/round70-x2/session1/`).

## 7. Giới hạn (trung thực)

- **n nhỏ:** chỉ **2 phiên có số gate2** (1 hoàn chỉnh + 1 partial 2 slot) và **1 phiên
  hoàn chỉnh duy nhất** (S4). Tỉ lệ FP 80% có CI 95% rộng [38%, 96%]; khoảng này vẫn
  đủ để kết luận "gate mở rộng FP nặng" (cận dưới 38% đã cao), nhưng chưa đủ để ước
  lượng chính xác tỉ lệ FP. Verdict "không nối production" không cần thêm mẫu — thêm
  phiên chỉ thu hẹp CI, không đảo được verdict (đã có 2 lần falsify độc lập).
- **S1 là partial:** không có JSON/time-course (harness chết ở rep 3); slot rep 3 mất nên
  mean phiên S1 không đầy đủ — S1 chỉ dùng làm bằng chứng phụ cùng hướng, KHÔNG đưa
  vào bảng gộp JSON chính (bảng gộp 9 slot là V4 + S4).
- **Time-course có overhead lấy mẫu 1 s** (như probe A/B đợt 68): tốc độ tuyệt đối của
  nó (9,6 fps) thấp hơn slot không lấy mẫu? — không: slot S4 (không lấy mẫu giữa chừng)
  là 8,5 fps, time-course 9,6 fps — cùng bậc, không có dấu hiệu overhead bóp méo lớn.
  Chỉ dùng tỉ lệ sau/trước (0,99x) làm kết luận chính, là đại lượng tương đối.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb, clip long1080
  20 s, canvas 871×275) và trong đêm có sóng load mạnh từ các luồng song song. Số trên
  máy thật/khác clip sẽ khác — nhưng verdict A1 là về THIẾT KẾ gate (thủ tục resume
  làm méo draw), không phải về con số tuyệt đối, nên ít nhạy với máy đo hơn.
- **Cơ chế resume-làm-đóng-băng-draw chưa được xác minh** (§4) — chỉ có bằng chứng
  hiện tượng (draw 1,0 fps vs presented 21 fps trong cùng cửa sổ 2). Không suy đoán
  cơ chế thành kết luận trong doc này.
- **Không sửa gì trong production:** harness gốc không đổi; gate 6 s không đổi; không
  push (chỉ stage); không release/tag.
- **Không chạy tsc** (không sửa code sản phẩm/harness — chỉ thêm 2 script `.mjs`
  standalone; `node --check` OK cả hai). Test suite liên quan: chính harness X2 —
  1 phiên hoàn chỉnh exit 0, 2/2 pass (H9 0 lỗi trang + P mọi slot hợp lệ).

## 8. File và log

- Launcher thử nghiệm (mới, đã stage): `apps/web/scripts/measure-70x2-gate-window-launcher.mjs`
  — `node --check` OK; chạy 6 phiên (19 thay thế OK mỗi lần).
- Script phân tích (mới, đã stage): `apps/web/scripts/analyze-70x2-gate-window.mjs` —
  `node --check` OK; chạy được trên JSON V4 + X2, verdict A1: KHÔNG XÁC NHẬN.
- Doc này: `docs/PHASE9_ROUND70_X2_GATE_WINDOW_LIMITS.md`.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x2.md`.
- Log đo: `hidden_files/round70-x2/session1/` (partial: log + chrome/vite log, không JSON),
  `session2/`, `session3/`, `session5/`, `session6/` (gate 1 chết: log),
  `session4/` (hoàn chỉnh: `presented-fps.json`, `presented-fps.log`,
  `r8-presented-chrome.log`, `r8-presented-vite.log`, `r8-presented-done.png`).
  Console log các phiên: `/tmp/round70-x2/session{1..6}-console.log` (tmpfs, mất khi reboot).
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh `r8-presented-done.png`
  (binary), log luồng + log đo (goal workspace, không phải repo).

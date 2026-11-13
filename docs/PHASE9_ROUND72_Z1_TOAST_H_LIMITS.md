# Phase 9 đợt 72 — Z1: chạy lại click-test toast keyframe H (nợ đợt 71 §5 mục 1)

Ngày: 2026-11-09, lượt cron 12:35 +07 (chạy 12:45–12:49 +07 = 05:45–05:49 UTC).
Máy: VM Linux 2 vCPU / 8 GB, không GPU. Bundle kiểm chứng:
`apps/web/dist/assets/index-DnpjYUK_.js` (1.508.059 byte — trùng bundle
click-test Y5 / build Y10, phục vụ qua snapshot `dist-snap-72z1`).
Trạng thái: **H ĐÃ ĐÓNG — PASS: cả 3 điều kiện đồng thời đạt lần đầu**
(baseline pre-launch 1,10 ≤ 3,0 + toast thấy ở +93,1 s trong cửa sổ
75–240 s + poll không mù, 372 samples, blindGapMs = 0).

## 0. Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Mục đích | Đóng nợ H đợt 71 §5 mục 1: chạy lại H headed với baseline theo định nghĩa mới (đo trước launch/import) ≤ 3,0 + toast thấy trong 75–240 s + không mù poll |
| Harness | `~/scratch-round68-v5/clicktest-72z1-h.mjs` — bản sao 71y1 + 2 đổi (xem §4); `node --check` OK |
| **H — clip 70 s, tải nặng, poll 240 s, headed** | ✅ **PASS: baseline pre-launch 1,10 ≤ 3,0; toast THẤY ở +93,118 s (khớp chính xác `===`); poll không mù** |
| Toast H | ✅ **THẤY ở +93,118 s**, text dài 126 ký tự khớp chính xác chuỗi kỳ vọng — lần thấy thứ 4 độc lập (probe 69W2 +128,4 s; V5 +169,8 s; Y1 +137,1 s; Z1 +93,1 s) |
| Poll mù | ✅ **KHÔNG mù: 372 samples, mẫu cuối +240,128 s, blindGapMs = 0 ms, evalNulls = 0** — khoảng trống lớn nhất giữa 2 mẫu chỉ 11,785 s (tốt hơn hẳn Y1: 23,587 s) |
| Đường abort mù poll > 60 s | ⚠️ **VẪN CHƯA TỪNG KÍCH HOẠT** — lần này không có mù (0 null) nên cả nhánh null cũ lẫn kiểm tra đầu vòng mới đều không có cơ hội kích hoạt; xem §4 |
| Code sản phẩm đổi | ❌ KHÔNG — chỉ sửa harness, không đụng code production (đúng nhiệm vụ) |
| Tiền kiểm môi trường | ✅ Xvfb :217 lên; Chrome 158 headed; snapshot dist OK; bundle chứa đủ dấu (`Phát ngược`, `gop.trial.timeoutNote`, `Keyframe đầu`, `9e4`); công thức timeout không đổi (1,2 ms/KiB → 64 MiB = 78536 ms, trần 90 s) |

## 1. Chạy Z1 (05:45:21–05:49:50 UTC, display :217, port 4217, headed)

Harness: `~/scratch-round68-v5/clicktest-72z1-h.mjs` (snapshot/profile riêng
`dist-snap-72z1` / `chrome-profile-72z1` để không đụng luồng đợt 72 khác).
Log: `clicktest-72z1-h.log`. JSON: `clicktest-72z1-h.json` (132.255 B,
372 samples).

| Chỉ số | Giá trị |
|---|---|
| Import clip `bigkey-64mib-70s.mp4` | OK 7,5 s (nhanh hơn Y1: 11,9 s — máy yên hơn) |
| **Baseline loadavg 1-phút PRE-LAUNCH (định nghĩa mới, đo lúc harness vừa khởi động)** | **1,10 ≤ 3,0 — tiền đề máy yên ĐẠT** (raw `1.10 1.36 0.82`) |
| Baseline post-import (định nghĩa CŨ, chỉ đối chiếu) | 1,14 — cũng ≤ 3,0 (xem §3: lần này máy yên thật ngay cả sau import) |
| Loadavg trước khi bấm ngược | 1,05; tối đa trong poll **19,23** (tải nặng có chủ đích: 4 hog + 2 encode 8K + luồng anh em); cuối poll 12,94 (trước khi `stopLoad`) |
| Bấm Phát ngược | 05:45:50 UTC; poll wall-clock **240.128 ms** (240 s, đi hết cửa sổ — không abort) |
| **Toast timeout** | **THẤY ở +93,118 s** (trong cửa sổ 75–240 s), text khớp chính xác chuỗi kỳ vọng |
| Toast trial (tính năng Y5) | Tick `Đang kiểm tra keyframe đầu (64.0 MiB)… N giây` từ +19,9 s (`5 giây`) tới +92,6 s (`78 giây`), 70 tick thấy được — trial bắt đầu ≈ +14,6–14,9 s sau khi bấm ngược (khớp: 93,118 − 78,536 = 14,582 s) |
| Toast khác thấy | "Bridge không chạy (http://127.0.0.1:8787)…" ở +0,5 s — không liên quan (bridge không chạy trong môi trường click-test), tự đóng sau ~5 s |
| Playhead (timeText) | 01:09.6 → 00:00.0 trong poll (phát ngược chạy hết clip 70 s), engine `webcodecs`, `reverseBadge` true; `decodeAhead: off` |
| Poll | eval 372 lần, evalSlow (> 5 s) 2, evalMax **11.280 ms** (< trần CDP 15 s), evalNulls **0**; samples thành công **372**, mẫu đầu +0,508 s, mẫu cuối **+240,128 s**; khoảng trống lớn nhất giữa 2 mẫu **11,785 s** (tại +128,2 s), chỉ 3 khoảng > 3 s |
| Hậu poll | `stopClick` trả ngay; cleanup dọn sạch hog/encode/Chrome/Xvfb (đã kiểm tra: không còn tiến trình Z1 nào sót — không Xvfb :217, không Chrome profile-72z1, không hog/encode) |

## 2. Vì sao lần này PASS trong khi Y1 INCONCLUSIVE

Luật đứng từ V5/X3 (không đổi, chỉ đổi định nghĩa baseline theo đúng
đề xuất Y1 §3(a)): H chỉ PASS khi **đồng thời** (i) baseline ≤ 3,0,
(ii) không mù poll, (iii) toast thấy trong 75–240 s. Z1 đạt cả 3.

Khác biệt chính so với Y1 không nằm ở code sản phẩm (không đổi) mà ở
máy đo lúc chạy:

- **Baseline pre-launch 1,10** (đo trước khi harness làm gì nặng) —
  định nghĩa mới tách khỏi công việc khởi động/import của chính harness.
- **Máy yên thật lần này:** loadavg 1-phút trước khi chạy dao động
  0,88–1,62 trong 3 phút quan sát trước launch (6 mẫu 30 s); VM vừa
  reboot 05:21 UTC (~24 phút trước lượt chạy); các luồng đợt 72 khác
  lúc đó nhẹ (Z4 probe birefnet / Z8 pip-audit chạy xen kẽ, không bật
  Chrome headed cùng lúc như Y7 ở đợt 71). Bằng chứng: baseline
  post-import theo định nghĩa CŨ cũng chỉ 1,14 — **lần này H sẽ PASS
  ngay cả dưới định nghĩa cũ**. Định nghĩa mới vẫn cần giữ cho các lần
  sau (nó loại trừ đúng nguồn nhiễu Y1 đã chỉ ra), nhưng không phải
  yếu tố quyết định của lần PASS này — ghi rõ để không ai tưởng đổi
  định nghĩa là đã "mua" được PASS.
- Poll khỏe hơn Y1: 0 null (Y1: 1 null), khoảng trống tối đa 11,8 s
  (Y1: 23,6 s) — cùng một tải nặng có chủ đích, nhưng máy nền yên hơn.

## 3. Bằng chứng toast H (4 lần thấy độc lập, cùng nội dung)

| Lần | Thời điểm thấy | Điều kiện | Ghi chú |
|---|---|---|---|
| Probe 69W2 | +128,4 s | headed, tải nặng | lần đầu thấy toast H |
| V5 (đợt 68) | +169,8 s | headed, tải nặng | đúng từng ký tự |
| Y1 (đợt 71) | +137,1 s | headed, tải nặng, bundle mới | đúng từng ký tự; INCONCLUSIVE do baseline 10,41 |
| **Z1 (đợt 72)** | **+93,1 s** | headed, tải nặng, bundle `index-DnpjYUK_.js` | **PASS — text khớp `===` (126/126 ký tự); mẫu dày quanh đó (khoảng trống tối đa 11,8 s) nên timestamp chính xác < 1 s** |

Cả 4 lần đều trong cửa sổ 75–240 s, qua 3 bundle khác nhau. Cơ chế toast
(trial timeout 78536 ms → fail-open → subscription hiện toast) hoạt động
nhất quán. **Nợ H (đợt 70 §4 mục 1 → đợt 71 §5 mục 1) nay ĐÃ ĐÓNG.**

## 4. Harness Z1 — thay đổi so với 71y1 (đã kiểm chứng bằng chạy thật này)

`~/scratch-round68-v5/clicktest-72z1-h.mjs` (ngoài repo, theo mẫu scratch —
không đưa vào batch):

- **(a) Baseline định nghĩa mới:** đo loadavg 1-phút ngay lúc `main()`
  vừa khởi động, **trước** snapshot copy / Chrome launch / import.
  Số này (`loadavgBaselinePreLaunch1min`) là tiền đề duy nhất xét PASS
  (≤ 3,0). Số post-import cũ vẫn đo, ghi riêng
  (`loadavgBaselinePostImport1min`) chỉ để đối chiếu, không xét PASS.
  JSON ghi thêm `baselineDefinition` + `baselinePreLaunchRaw`.
- **(b) Abort INCONCLUSIVE-poll-blind — thêm kiểm tra đầu vòng lặp:**
  giữ ngưỡng 60 s + nhánh null cũ, THÊM kiểm tra mù ở đầu mỗi vòng lặp
  poll (sau `sleep(500)`, trước `evaluate`): mù = wall-clock từ mẫu
  thành công cuối tới giờ, vượt 60 s thì dừng poll ngay, trả cờ
  `pollBlindAborted=true`. Đường cũ chỉ xét trong nhánh null nên không
  kích hoạt được nếu event loop bị đói CPU (sleep 500 ms giãn hàng chục
  giây — đã gặp ở Y1) hoặc evaluate treo chưa trả null.
- **(c)** Snapshot/profile/display/port riêng đợt 72 Z1
  (`dist-snap-72z1`, `chrome-profile-72z1`, `:217`/`4217`); JSON ra
  `clicktest-72z1-h.json`.
- Không đổi logic verdict PASS ngoài định nghĩa baseline, không đổi trần
  eval 15 s, không đổi tải nặng 4 hog + 2 encode 8K, không đổi cửa sổ
  kỳ vọng 75–240 s. Không sửa code production.

**Đính chính vị trí harness (cho parent):** nhiệm vụ ghi "tìm trong
`apps/web/scripts/`" nhưng harness Y1 thực tế nằm ở
`~/scratch-round68-v5/clicktest-71y1-h.mjs` (không có bản sao nào trong
`apps/web/scripts/` — đã grep kiểm tra). Z1 sửa đúng file Y1 đã dùng,
theo mẫu scratch của các đợt 68–71; không copy harness vào repo.

**Về đường abort — nói rõ giới hạn:** kiểm tra đầu vòng mới đã chạy
372 lần trong lượt này mà **không kích hoạt lần nào** (cũng không
false-trigger), nhưng vì poll lần này hoàn toàn không mù (0 null,
blindGapMs = 0) nên **đường abort vẫn chưa từng kích hoạt trong thực
tế** — cả nhánh null cũ lẫn kiểm tra đầu vòng mới đều chưa được kiểm
chứng bằng một sự kiện mù thật. Đây là giới hạn còn lại duy nhất của
harness (xem §6); không claim đã test đường abort.

## 5. Ghi chú phương pháp khác

- `firstTimeTextChangeMs` = 1.098 ms: nhắc lại đính chính đợt 69 §3 —
  timeText đổi sớm là do playhead chạy độc lập, KHÔNG phải tín hiệu
  trial xong; số này không dùng để suy ra thời gian trial. Thời gian
  trial thật suy từ tick toast Y5: bắt đầu ≈ +14,6–14,9 s.
- 2 tick trial bị trượt khỏi mẫu (`20 giây`, `33 giây` không thấy) do
  khoảng trống poll 5–8 s quanh đó — toast tick 1 s/giây vẫn có thể
  trượt mẫu khi poll giãn; không ảnh hưởng verdict H (toast timeout
  hiện 4,5 s và đã bắt được).
- `dist/` không build lại trong lượt này; snapshot `dist-snap-72z1`
  phục vụ chạy Z1 (nằm ở scratch, không đưa vào batch).
- EPERM ghi file qua exec không tái diễn trong lượt này (ghi qua
  exec/`cp`/`node` đều OK).

## 6. Nợ / giới hạn còn lại

- **Nợ H ĐÃ ĐÓNG** — không còn trong danh sách nợ cho đợt 73. Lần PASS
  này dùng bundle `index-DnpjYUK_.js`; nếu bundle đổi lớn (render/trial
  đổi logic) thì chạy lại H một lần để xác nhận lại, nhưng không còn là
  nợ mở.
- **Đường abort `INCONCLUSIVE-poll-blind` (> 60 s) vẫn chưa từng kích
  hoạt** — cần một lần mù poll thật (hoặc test harness có chủ đích: ép
  renderer treo > 60 s) mới kiểm chứng được cả hai nhánh abort. Ghi rõ
  để không ai tưởng đã test đường đó.
- Toast trial Y5 chỉ bao decode, không bao fetch remainder (nợ đợt 71
  §5 mục 5) — không thuộc phạm vi Z1, vẫn mở cho luồng khác.

## 7. File stage (KHÔNG push)

- `docs/PHASE9_ROUND72_Z1_TOAST_H_LIMITS.md` (file này — deliverable duy
  nhất của luồng trong repo; không có code sản phẩm đổi).
- Log lượt chạy: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round72-z1.md`.
- Harness/log/JSON click-test ở `~/scratch-round68-v5/`
  (`clicktest-72z1-h.mjs`, `clicktest-72z1-h.log`, `clicktest-72z1-h.json`)
  — ngoài repo, theo mẫu scratch, không đưa vào batch.

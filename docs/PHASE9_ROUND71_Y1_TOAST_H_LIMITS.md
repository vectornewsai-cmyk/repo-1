# Phase 9 đợt 71 — Y1: chạy lại click-test toast keyframe H (nợ đợt 70 §4 mục 1)

Ngày: 2026-11-09, lượt cron 09:35 +07 (chạy 09:43–09:48 +07 = 02:43–02:48 UTC).
Máy: VM Linux 2 vCPU / 8 GB, không GPU. Bundle kiểm chứng:
`apps/web/dist/assets/index-Bp5nIAEV.js` (1.506.031 byte, build 01:55 UTC
09/11 — bundle MỚI so với đợt 70 `index-iuFeO_yY.js`; phục vụ qua snapshot
`dist-snap-71y1`).
Trạng thái: **H VẪN MỞ — chạy Y1 INCONCLUSIVE-noisy-baseline (baseline 10,41
> 3,0), NHƯNG toast H THẤY ở +137,1 s đúng từng ký tự, trong cửa sổ 75–240 s,
và poll KHÔNG mù (mẫu cuối +240,3 s). Không phải bằng chứng bug sản phẩm.**

## 0. Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Mục đích | Đóng nợ H đợt 70 §4 mục 1: chạy lại H headed, baseline ≤ ~3,0, không mù poll, toast thấy trong 75–240 s |
| Harness | `~/scratch-round68-v5/clicktest-71y1-h.mjs` — bản sao 70x3 + abort `INCONCLUSIVE-poll-blind` khi mù > 60 s (mới, xem §4); `node --check` OK |
| **H — clip 70 s, tải nặng, poll 240 s, headed** | ⚠️ **INCONCLUSIVE-noisy-baseline: baseline 10,41 > 3,0 → KHÔNG PASS theo luật đứng, dù toast THẤY ở +137,1 s trong cửa sổ** |
| Toast H | ✅ **THẤY ở +137.092 s, text khớp chính xác (`===`) chuỗi kỳ vọng** — lần thấy thứ 3 độc lập (probe 69W2 +128,4 s; V5 +169,8 s; Y1 +137,1 s) |
| Poll mù | ✅ **KHÔNG mù: 337 samples, mẫu cuối +240.311 s, blindGapMs = 1 ms** — lần đầu poll H đi hết 240 s mà vẫn nhìn thấy; abort mù > 60 s KHÔNG phải kích hoạt (pollBlindAborted=false) |
| Code sản phẩm đổi | ❌ KHÔNG — không phát hiện bug thật nên không sửa |
| Tiền kiểm môi trường | ✅ Xvfb :216 lên; Chrome 1254 headed; snapshot dist OK; bundle mới vẫn chứa đủ dấu (`Phát ngược`, `gop.trial.timeoutNote`, `Keyframe đầu`, `9e4`); công thức timeout không đổi (1,2 ms/KiB → 64 MiB = 78536 ms, trần 90 s) |

## 1. Chạy Y1 (02:43:23–02:48:47 UTC, display :216, port 4216, headed)

Harness: `~/scratch-round68-v5/clicktest-71y1-h.mjs` (snapshot/profile riêng
`dist-snap-71y1` / `chrome-profile-71y1` để không đụng luồng đợt 71 khác).
Log: `clicktest-71y1-h.log`. JSON: `clicktest-71y1-h.json` (100.486 B,
337 samples).

| Chỉ số | Giá trị |
|---|---|
| Import clip `bigkey-64mib-70s.mp4` | OK 11,9 s |
| Loadavg trước khi launch (đo tay, 02:42) | 1-phút **1,94** (5-phút 2,01) — 2 lần đo liên tiếp 2,76 → 3,41 → 1,94; `ps` không có tiến trình test/build nặng nào của luồng khác lúc đó |
| **Baseline loadavg 1-phút do harness đo (sau import, trước khi bật tải riêng)** | **10,41 > 3,0 — tiền đề máy yên SAI** (xem §3: cửa sổ 1 phút này chứa chính công việc khởi động của harness + luồng Y7) |
| Loadavg trước khi bấm ngược | 11,22; tối đa trong poll **15,01**; cuối poll 3,64 |
| Bấm Phát ngược | 02:44:46 UTC; poll wall-clock **240.312 ms** (240 s, đi hết cửa sổ — không abort) |
| **Toast timeout** | **THẤY ở +137,092 s** (trong cửa sổ 75–240 s), text khớp chính xác chuỗi kỳ vọng |
| Toast khác thấy | "Bridge không chạy (http://127.0.0.1:8787)…" ở +46,0 s — không liên quan (bridge không chạy trong môi trường click-test), tự đóng sau ~5 s |
| Playhead (timeText) | 01:09.3 → 00:00.0 lúc +82,8 s (phát ngược chạy hết clip 70 s), engine `webcodecs`, `reverseBadge` true; mẫu cuối `sleeping` true (loop ngủ sau khi clip hết — toast vẫn hiện được nhờ subscription, đúng thiết kế) |
| Poll | eval 338 lần, evalSlow (>5 s) 2, evalMax **21.765 ms**, evalNulls **1** (ở +182,2 s, hồi phục ngay sau đó); samples thành công **337**, mẫu đầu +1,0 s, mẫu cuối **+240,3 s** |
| Hậu poll | `stopClick` trả ngay (không treo 120 s như X3); cleanup dọn sạch hog/encode/Chrome/Xvfb (đã kiểm tra: không còn tiến trình Y1 nào sót) |

## 2. Vì sao verdict là INCONCLUSIVE dù toast đã thấy

Luật đứng từ V5/X3 (không đổi trong lượt này): H chỉ PASS khi **đồng thời**
(i) baseline ≤ 3,0, (ii) không mù poll, (iii) toast thấy trong 75–240 s.
Y1 đạt (ii) và (iii) nhưng trượt (i) — baseline do harness đo là 10,41.
Theo luật, verdict ghi `INCONCLUSIVE-noisy-baseline`, **không** ghi PASS.
Toast thấy ở +137,1 s được ghi nhận là điểm dữ liệu thứ 3 ("toast H CÓ
xuất hiện", đúng từng ký tự, timestamp chính xác < 1 s nhờ mẫu dày
~0,5–0,6 s quanh +137 s), không phải pass chính thức.

## 3. Chẩn đoán: baseline 10,41 đến từ đâu — và bài học phương pháp

Cửa sổ 1 phút của số baseline (đo lúc 02:44:18, phủ 02:43:18–02:44:18)
chứa đồng thời:

- **Chính công việc khởi động của harness:** Chrome headed launch, 2 lần
  navigate + seed, import clip 70 s với decode thumbnail keyframe 64 MiB
  (11,9 s nặng). Renderer của Y1 chiếm tới ~30% CPU lúc đo (`ps` 02:47:
  renderer Y1 29,9%).
- **Luồng đợt 71 khác khởi động cùng lúc:** Y7 bật headed Chrome riêng
  (`chrome-userdata-y7`, renderer 11,8%, bắt đầu 02:44 — đúng trong cửa
  sổ baseline); Y6 chạy test vidstab SEGFAULT (`test_round71_y6_…js`).
  Lúc Y1 kiểm tra `ps` trước khi launch (02:42) chưa có các tiến trình này
  — chúng vào việc trong lúc Y1 import, giống hệt kịch bản X3 (baseline
  nhảy 2,18 → 5,11 trong lúc import).

**Kết luận phương pháp (quan trọng cho đợt sau):** định nghĩa baseline hiện
tại — đo 1-phút loadavg **sau import, ngay trước khi bật tải riêng** — gần
như không thể ≤ 3,0 khi chạy trong một lượt vòng lặp song song: cửa sổ 1
phút luôn nuốt trọn công việc khởi động/import của chính harness cộng với
bất kỳ luồng anh em nào khởi động cùng lúc. Y1 đã đo tay 1,94 ngay trước
launch (máy yên thật lúc đó) nhưng số đó không phải số harness dùng để
xét PASS. Để đóng được H, đợt sau cần **một** trong hai:

- (a) Đổi định nghĩa baseline: đo **trước khi launch Chrome/import**
  (máy yên thật), tách khỏi công việc của chính harness — cần sửa harness
  + ghi rõ thay đổi phương pháp, không áp dụng hồi tố cho Y1/X3; hoặc
- (b) Chạy H **một mình ngoài giờ cao điểm của vòng lặp** (không có luồng
  song song nào khác), như X3 §4(c) đã đề xuất — khi đó cả baseline sau
  import cũng có cơ hội ≤ 3,0.

Không chọn (a) trong lượt này để tránh "đổi luật giữa chừng cho ra PASS" —
verdict Y1 giữ nguyên INCONCLUSIVE theo luật cũ.

## 4. Harness Y1 — thay đổi so với 70x3 (đã kiểm chứng bằng chạy thật này)

`~/scratch-round68-v5/clicktest-71y1-h.mjs` (ngoài repo, theo mẫu scratch —
không đưa vào batch):

- **Mới — abort INCONCLUSIVE-poll-blind:** `pollToasts` tính mù poll =
  thời gian từ mẫu thành công cuối tới giờ; vượt **60 s** thì dừng poll
  ngay, trả cờ `pollBlindAborted=true`, verdict H thành
  `INCONCLUSIVE-poll-blind` (kể cả khi baseline yên). Tránh lặp lại X3:
  chạy hết 240 s trong mù ~155 s cuối mà "KHÔNG THẤY" không có giá trị
  bằng chứng.
- **Lần chạy này: abort KHÔNG kích hoạt** (`pollBlindAborted=false`) —
  chỉ 1 null ở +182,2 s (eval 21.765 ms), mù cực đại ~45 s < 60 s, mẫu
  hồi phục ngay và đi tới +240,3 s. Logic abort đã có mặt trong code
  chạy thật nhưng chưa từng kích hoạt — lần sau mù thật mới kiểm chứng
  được đường abort; ghi rõ để không ai tưởng đã test đường đó.
- Snapshot/profile/display/port riêng đợt 71 Y1 (`dist-snap-71y1`,
  `chrome-profile-71y1`, `:216`/`4216`); JSON ra `clicktest-71y1-h.json`;
  log kết quả ghi thêm `verdictKind`/`pollBlindAborted`/`blindGapMs`.
- Không đổi logic verdict PASS, không đổi trần eval 15 s, không đổi tải
  nặng 4 hog + 2 encode 8K, không đổi cửa sổ kỳ vọng 75–240 s.

**Phát hiện phụ về độ trễ poll:** khoảng trống lớn nhất giữa 2 mẫu liên
tiếp là 23.587 ms (chính lần null +182,2 s); 6/336 khoảng trống > 3 s.
`evalSlow` chỉ 2 nhưng nhiều khoảng trống ~5–8 s — độ trễ nằm ở timer
`sleep(500)` của Node bị đói CPU trên VM 2 vCPU (event loop không được
cấp CPU đúng hẹn), không phải renderer chậm. Dưới tải nặng, poll danh
nghĩa 500 ms thực tế giãn tới vài giây — toast 4,5 s vẫn bắt được trong
lần này nhờ mẫu dày quanh thời điểm toast, nhưng đây là rủi ro trượt
toast có thật nếu toast rơi đúng khe trống. Ghi lại cho đợt sau, không
sửa trong lượt này.

**Lưu ý nhỏ:** lần null duy nhất đo `eval 21765 ms` — vượt trần CDP
15 s. Trần 15 s là timeout của `send()`, nhưng phép đo `evMs` bao cả
thời gian chờ pipe/backlog nên có thể vượt 15 s. Không ảnh hưởng verdict.

## 5. Bằng chứng toast H (3 lần thấy độc lập, cùng nội dung)

| Lần | Thời điểm thấy | Điều kiện | Ghi chú |
|---|---|---|---|
| Probe 69W2 | +128,4 s | headed, tải nặng | lần đầu thấy toast H |
| V5 (đợt 68) | +169,8 s | headed, tải nặng | đúng từng ký tự |
| **Y1 (đợt 71)** | **+137,1 s** | headed, tải nặng, bundle mới `index-Bp5nIAEV.js` | text khớp `===` chuỗi kỳ vọng; mẫu dày ~0,5 s quanh đó nên timestamp chính xác < 1 s |

Cả 3 lần đều trong cửa sổ 75–240 s. Cơ chế toast (trial timeout 78536 ms
→ fail-open → subscription hiện toast ngay cả khi loop đã ngủ) hoạt động
nhất quán qua 3 lần chạy và 2 bundle khác nhau. Chưa lần nào cả 3 điều
kiện PASS đồng thời đạt được — vướng duy nhất ở tiền đề baseline, không
phải ở cơ chế toast.

## 6. Nợ / giới hạn còn lại

- **Nợ H (đợt 70 §4 mục 1) VẪN MỞ, nay chỉ còn là nợ tiền đề đo:** cần
  một lần chạy H headed với baseline ≤ 3,0 theo định nghĩa được chốt
  (đổi định nghĩa như §3(a) hoặc chạy solo như §3(b)) + không mù poll +
  toast thấy trong 75–240 s. Hai điều sau Y1 đã đạt; chỉ còn (i).
- Đường abort `INCONCLUSIVE-poll-blind` (> 60 s) đã có trong harness
  nhưng **chưa từng kích hoạt** — lần sau mù thật mới kiểm chứng được.
- `firstTimeTextChangeMs` = 1.902 ms: nhắc lại đính chính đợt 69 §3 —
  timeText đổi sớm là do playhead chạy độc lập, KHÔNG phải tín hiệu
  trial xong; số này không dùng để suy ra thời gian trial.
- Trần worker 90 s / timeout 78536 ms / biên tải thấp 28,2 s (U5) không
  đổi; không có gì mới về keyframe trong đợt này.
- `dist/` không build lại trong lượt này; snapshot `dist-snap-71y1` phục
  vụ chạy Y1 (nằm ở scratch, không đưa vào batch).
- EPERM ghi file qua exec không tái diễn trong lượt này (ghi qua
  exec/`cp`/`node` đều OK).

## 7. File stage (KHÔNG push)

- `docs/PHASE9_ROUND71_Y1_TOAST_H_LIMITS.md` (file này — deliverable duy
  nhất của luồng trong repo; không có code sản phẩm đổi).
- Log lượt chạy: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round71-y1.md`.
- Harness/log/JSON click-test ở `~/scratch-round68-v5/`
  (`clicktest-71y1-h.mjs`, `clicktest-71y1-h.log`, `clicktest-71y1-h.json`)
  — ngoài repo, theo mẫu scratch, không đưa vào batch.

# Phase 9 đợt 69 — W2: chạy lại click-test toast timeout keyframe (đóng nợ U5 đợt 67 §6, V5 đợt 68 INCONCLUSIVE)

Ngày: 2026-11-08 20:47–21:45 UTC (2026-11-09 03:47–04:45 +07). Máy: VM Linux 2 vCPU / 8 GB, không GPU.
Bundle kiểm chứng: `apps/web/dist/assets/index-iuFeO_yY.js` (1.506.042 B, build 20:56 UTC bởi luồng khác, ổn định suốt cả 3 lần chạy — `checkBundleUnchanged` không trip lần nào). Headed Chrome 1254 dưới Xvfb :214, harness V5 không đổi.
Trạng thái: **N (clip ngắn) + C (đối chứng) ĐÓNG NỢ — H (clip 70 s nặng) VẪN MỞ, nhưng đã xác định rõ nguyên nhân: tiền đề harness sai, KHÔNG phải bug sản phẩm.**

## 0. Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Mục 1 — xác minh sửa toast-hiện-ngay (U5) còn nguyên | ✅ ĐÃ XÁC MINH LẠI: `reverseWebcodecs.ts:1891` subscribe, `:1518` notify, `preview.tsx:2693` subscribe; template `{timeout}` = 78536 ms, không hardcode |
| tsc apps/web | ✅ 0 lỗi |
| Suite keyframe (62R4/63R4/64R10/65S6/66T6/67U5 + capThumb) | ✅ 19/19, 13/13, 11/11, 15/15, 9/9, 11/11, 2/2 |
| vite build | (không build lại — dùng dist sẵn của luồng khác, đã kiểm tra marker bundle) |
| **N — clip 0,1 s, tải nặng, KHÔNG bấm toggle** | ✅ **PASS ×2: toast tự hiện +96,7 s (chạy 1) và +95,3 s (chạy 2), đúng từng ký tự; appearances = 1, bấm toggle sau đó KHÔNG toast trùng** |
| **C — clip 70 s, tải thấp** | ✅ **PASS (chạy 1, máy yên: max loadavg 3,29 ≤ 4,0): KHÔNG toast trong 120 s**; chạy 2 INCONCLUSIVE do tải (max 4,79) nhưng hành vi đúng (không toast) |
| **H — clip 70 s, tải nặng** | ⚠️ **FAIL (chạy 1, baseline yên 3,00): KHÔNG toast trong 180 s**; INCONCLUSIVE (chạy 2, baseline 4,61) + không toast trong 180 s; **probe 240 s: toast THẤY ở +128,4 s** — xem §3 |
| Nợ U5 §6 | N + C: **ĐÓNG**. H: **VẪN MỞ ở dạng nợ harness** (xem §3–§4) |
| Code sản phẩm đổi | ❌ KHÔNG — không phát hiện bug thật nên không sửa |

## 1. Kiểm chứng độc lập (đầu lượt, trước click-test)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- Suite keyframe (mẫu U5, `~/scratch-round68-v5/reg/`): 62R4 **19/19**, 63R4 **13/13**, 64R10 **11/11**, 65S6 **15/15**, 66T6 **9/9**, 67U5 **11/11**, captureThumb66T6 **2/2** (PASS 2 FAIL 0).
- Kiểm tra môi trường trước khi chạy harness nặng (§5 V5): Xvfb :217 lên được (test xong đã kill); `chrome-headless-shell --dump-dom` và `chromium-1254 --headless=new --dump-dom` đều exit 0; loadavg lúc bắt đầu 0,50. EPERM không tái diễn trong lượt này (ghi qua exec/`cp`/node đều OK; file repo ghi bằng file-tools).

## 2. Hai lần chạy harness đầy đủ H/C/N

Harness: `~/scratch-round68-v5/clicktest-68v5-toast-timeout.mjs` (V5, không sửa). Log: `clicktest-69w2.log` (chạy 1), `clicktest-69w2-run2.log` (chạy 2). JSON kết quả ghi đè cùng file `clicktest-68v5-toast.json` (hiện giữ chạy 2).

### Chạy 1 — 20:58–21:09 UTC, verdict PARTIAL (H=false C=true N=true)

| Case | Verdict | Toast timeout | loadavg (ghi vào verdict theo nợ U5 §6) | Poll |
|---|---|---|---|---|
| H | **FAIL** | KHÔNG THẤY trong 180 s | baseline 1-phút **3,00** (đúng cổng ≤ 3,0 — tiền đề yên ĐẠT), max trong poll 14,44, cuối 7,78 | eval 286 lần, evalSlow 1, evalMax 11.535 ms; lastSample: `00:00.0 / 01:10.1`, engine webcodecs, decodeAhead off, sleeping true |
| C | **PASS** | không thấy (đúng kỳ vọng) | lúc bắt đầu 3,11; max trong poll **3,29 ≤ 4,0**; cuối 0,75 | eval 198, evalSlow 0, evalMax 3.426 ms |
| N | **PASS** | **THẤY +96,7 s**, đúng từng ký tự | baseline **0,50**; max 17,39; cuối 17,39 | appearances trước toggle 1, sau toggle 0, tổng **1**; toggle clicked |

### Chạy 2 (chạy lại lần 1/2 cho phép) — 21:15–21:25 UTC, verdict PARTIAL (H=false C=false N=true)

| Case | Verdict | Toast timeout | loadavg | Poll |
|---|---|---|---|---|
| H | **INCONCLUSIVE-noisy-baseline** | KHÔNG THẤY trong 180 s | baseline **4,61 > 3,0**; max 14,11; cuối 7,10 | eval 315, evalSlow **0**, evalMax **1.253 ms** — poll khỏe, toast thực sự vắng trong cửa sổ, không phải poll trượt |
| C | **INCONCLUSIVE-noisy-during-poll** | không thấy (đúng kỳ vọng) | max **4,79 > 4,0**; cuối 0,70 | eval 206, evalSlow 0, evalMax 2.177 ms |
| N | **PASS** | **THẤY +95,3 s** | baseline **1,04**; max 14,38; cuối 14,38 | appearances tổng **1**; toggle clicked |

Cả hai lần chạy: toast không liên quan "Bridge không chạy (http://127.0.0.1:8787)…" xuất hiện sớm (+5,2 s / +8,3 s / +11,3 s…) — bridge không chạy trong môi trường click-test, không liên quan tới trial decode.

## 3. H không toast trong 180 s — chẩn đoán bằng probe H-only (poll 240 s)

Vì H vắng toast 2 lần liên tiếp trong khi N toast đều, cần phân biệt: (A) trial decode kịp xong trong 78,5 s (hành vi đúng, không toast) hay (B) trial không chạy / note bị mất (bug thật). Probe: bản sao harness chỉ chạy H, poll 240 s, ghi thêm mọi lần `timeText` đổi + lưu toàn bộ samples.

- **Probe lần 1 chết do VM reboot ~21:30 UTC** (uptime reset 2:17 → 5 phút; process + Xvfb + Chrome chết lặng lúc ~21:30:40, log dừng sau dòng loadavg 21:30:38). Môi trường kiểm tra lại sau reboot: Chrome `--dump-dom` exit 0, Xvfb OK, dist + fixture nguyên vẹn. Các luồng đợt 69 khác cũng chết theo reboot (W4 ffmpeg đã tự chạy lại từ 21:33 — việc của luồng đó).
- **Probe lần 2 — 21:40–21:45 UTC: toast timeout THẤY ở +128,4 s, đúng từng ký tự.** Baseline 2,36; max loadavg 12,09; eval 331, evalSlow 1, evalMax 11.101 ms. Phát ngược chạy hết clip (00:00.0 ở +85,7 s), loop ngủ từ +100,5 s. JSON: `~/scratch-round68-v5/clicktest-69w2-h-probe.json`; log `clicktest-69w2-h-probe2.log`.

### Kết luận chẩn đoán: tiền đề harness sai, không phải bug sản phẩm

- Toast H xuất hiện đúng khi trial thực sự timeout (probe +128,4 s; V5 chạy 1 +169,8 s) và vắng đúng khi trial kịp xong (C tải thấp). N toast đều +95–97 s. Subscription U5 hoạt động (N chứng minh 2 lần headed).
- **Thời điểm toast H dao động mạnh (+128,4 s / +169,8 s / >180 s)** vì đồng hồ timeout 78,5 s chỉ bắt đầu SAU khi fetch xong sample 64 MiB — mà bước fetch này gồm **128 request range tuần tự, mỗi chunk 512 KiB** (`TRIAL_DECODE_SAMPLE_CHUNK_BYTES`, `MAX_TRIAL_DECODE_SAMPLE_BYTES` 64 MiB, `lib/gopRangeFetch39T3.ts:372,384,834`). Dưới bão hoà 2 vCPU (4 hog + 2 encode + Chrome + phát ngược), mỗi request chậm ~0,5–1 s+ nên riêng fetch đã tốn 50–130 s+; toast = fetch + 78,5 s nên rơi vào khoảng ~+95 s đến >+200 s. Cửa sổ harness 75–165 s + poll 180 s quá chật cho H.
- Chạy 1–2 không thấy toast trong 180 s nhiều khả năng là toast rơi sau +180 s (trial start trễ do fetch), không phải trial kịp xong — nhưng dữ liệu toast đơn thuần không phân biệt được hai trường hợp này; probe 240 s chứng minh toast H CÓ xuất hiện với cùng công thức tải.
- **Đính chính giả định probe:** `timeText` đổi lần đầu ở +3,4 s KHÔNG phải tín hiệu T3 xong — timeText theo playhead, chạy độc lập với việc decode cửa sổ. Số này không dùng để suy ra thời gian trial.

## 4. Nợ / giới hạn còn lại

- **Nợ U5 §6 — N + C ĐÃ ĐÓNG** (số mới headed, 2 lần độc lập cho N). **H VẪN MỞ ở dạng nợ harness, không phải nợ sản phẩm.** Đề xuất cho đợt sau: (a) nới poll H lên 300 s và cửa sổ kỳ vọng thành 75–240 s; (b) hoặc tăng tải H (thêm hog) để trial timeout chắc chắn hơn; (c) lưu `samples` vào JSON harness (hiện chỉ `lastSample` cho H — probe lần này chứng minh samples mới chẩn đoán được). Không đổi code sản phẩm vì H.
- Trần worker 90 s / toast 78536 ms / biên tải thấp 28,2 s (U5) không đổi; không có gì mới về keyframe trong đợt này.
- Harness V5 không sửa; probe H-only là bản sao scratch (`~/scratch-round68-v5/clicktest-69w2-h-probe.mjs`, log `clicktest-69w2-h-probe.log` lần 1 chết reboot + `clicktest-69w2-h-probe2.log` lần 2), không đưa vào repo/batch.
- `dist/` không build lại trong lượt này; snapshot `dist-snap-68v5` phục vụ cả 3 lần chạy.
- Lưu ý vận hành: VM reboot ~21:30 UTC giữa lượt (không báo trước); sau reboot phải kiểm tra lại Chrome/Xvfb/dist trước khi chạy tiếp. Sóng tải các luồng đợt 69 khác làm baseline H nhảy 0,58 → 4,61 trong vài phút — H cần cửa sổ yên thật sự, nên đợi 1-phút loadavg ≤ ~2 trước khi bấm (đừng chỉ tin một lần đo).

## 5. File stage (KHÔNG push)

- `docs/PHASE9_ROUND69_W2_KEYFRAME_TOAST_LIMITS.md` (file này — deliverable duy nhất của luồng trong repo; không có code sản phẩm đổi).
- Log lượt chạy: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round69-w2-keyframe-toast.md`.
- Harness/probe/log click-test ở `~/scratch-round68-v5/` (ngoài repo, theo mẫu scratch — không đưa vào batch).

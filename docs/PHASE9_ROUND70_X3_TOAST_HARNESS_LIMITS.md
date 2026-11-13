# Phase 9 đợt 70 — X3: chạy lại click-test toast keyframe H với cửa sổ 240 s (nợ đợt 69 §4 mục 3)

Ngày: 2026-11-09 06:35–07:00 +07 (2026-11-08 23:35–24:00 UTC). Máy: VM Linux 2 vCPU / 8 GB, không GPU.
Bundle kiểm chứng: `apps/web/dist/assets/index-iuFeO_yY.js` (1.506.042 ký tự, build 20:56 UTC 08/11 — cùng bundle đợt 69 W2, không đổi; phục vụ qua snapshot `dist-snap-70x3`).
Trạng thái: **H VẪN MỞ — chạy X3 INCONCLUSIVE (tiền đề máy yên sai + poll MÙ 155 s cuối), KHÔNG đóng được nợ. Không phải bằng chứng bug sản phẩm.**

## 0. Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Mục đích | Đóng nợ H đợt 69 §4 mục 3: kéo cửa sổ quan sát H lên 240 s, cửa sổ kỳ vọng 75–240 s, chạy lại click-test headed |
| tsc apps/web | ✅ 0 lỗi |
| Suite keyframe (62R4/63R4/64R10/65S6/66T6/67U5 + capThumb) | ✅ 19/19, 13/13, 11/11, 15/15, 9/9, 11/11, 2/2 (chạy lại từ `~/scratch-round68-v5/reg/`) |
| Tiền kiểm môi trường (theo khuyến nghị V5) | ✅ Xvfb :215 lên được; `chrome-1254 --headless=new --no-sandbox --disable-dev-shm-usage --dump-dom` exit 0 (dbus noise, không ảnh hưởng). Lưu ý: `chromium-1254` không có trong PATH — phải gọi đường dẫn đầy đủ `~/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`; `--dump-dom` không kèm `--no-sandbox` exit 1 trên VM này |
| **H — clip 70 s, tải nặng, poll 240 s, headed** | ⚠️ **INCONCLUSIVE-noisy-baseline: KHÔNG THẤY toast timeout trong 240 s — nhưng harness MÙ từ +84,5 s nên "không thấy" KHÔNG có giá trị bằng chứng (xem §3)** |
| Code sản phẩm đổi | ❌ KHÔNG — không phát hiện bug thật nên không sửa |
| Harness đổi | ✅ Chỉ thêm khả năng nhìn thấy poll-mù: đếm + log từng evaluate null, ghi `evalNulls/lastSampleAtMs/blindGapMs` vào JSON (xem §4). Chưa chạy lại sau sửa — ghi rõ là chưa kiểm chứng bằng run |

## 1. Chạy X3 (23:42:13–23:48:58 UTC, display :215, port 4215, headed)

Harness: `~/scratch-round68-v5/clicktest-70x3-h.mjs` (bản sao probe 69W2, đổi duy nhất: cửa sổ kỳ vọng 75–240 s thay vì 75–165 s; snapshot/profile riêng `dist-snap-70x3` / `chrome-profile-70x3` để không đụng các luồng đợt 70 khác). Log: `clicktest-70x3-h.log`. JSON: `clicktest-70x3-h.json` (28.304 B, gồm đủ 65 samples).

| Chỉ số | Giá trị |
|---|---|
| Import clip `bigkey-64mib-70s.mp4` | OK 10,5 s |
| Baseline loadavg 1-phút trước khi bật tải riêng | **5,11 > 3,0 — tiền đề máy yên SAI** (lúc launch 23:42:13 loadavg 2,18; các luồng đợt 70 khác vào việc trong lúc import, nhảy lên 5,11 lúc 23:42:35) |
| Loadavg trước khi bấm ngược | 7,73; tối đa trong poll **22,35**; cuối poll 3,59 |
| Bấm Phát ngược | 23:42:58 UTC; poll wall-clock **240.175 ms** (240 s) |
| Toast timeout | **KHÔNG THẤY** (xem §3 — không kết luận được) |
| Toast duy nhất thấy | "Bridge không chạy (http://127.0.0.1:8787)…" ở +23,7 s — không liên quan (bridge không chạy trong môi trường click-test), tự đóng sau ~5 s |
| Playhead (timeText) | 01:09.6 → 00:02.2 lúc +84,5 s, engine `webcodecs`, `reverseBadge` true, `sleeping` false ở mẫu cuối, `decodeAheadStatus` = `off` suốt (bình thường với H — giống đợt 69 W2) |
| Poll | eval 75 lần, evalSlow (>5 s) 12, evalMax **15.077 ms** (chạm trần 15 s); samples thành công **65**, mẫu đầu +1,0 s, mẫu cuối **+84,5 s** |
| Hậu poll | `stopClick` evaluate treo tới ~120 s (timeout mặc định) mới trả — renderer vẫn đơ sau khi poll kết thúc; JSON ghi xong 23:48:58; cleanup dọn sạch hog/encode/Chrome/Xvfb (đã kiểm tra: không còn tiến trình X3 nào sót) |

## 2. Vì sao không chạy lại lần 2

Sau khi chạy X3 kết thúc, loadavg đo được **25,80 / 15,52** (23:52 UTC), rồi **17,94 / 14,89** sau 45 s — máy đang bão hoà bởi các luồng đợt 70 khác (trong `ps` thấy X8 vidstab test, P7 i18n test, chrome-resample test chạy song song). Chạy lại lúc này chắc chắn lại vi phạm tiền đề baseline ≤ 3,0 và lại mù poll — chỉ tốn lượt. Không chạy lại; ghi rõ ở đây thay vì bịa số.

## 3. Chẩn đoán: "KHÔNG THẤY trong 240 s" không phải bằng chứng vắng toast

Phân tích `clicktest-70x3-h.json` (65 samples):

- **Poll mù từ +84,5 s đến hết 240 s (~155 s):** sau mẫu cuối (+84,5 s, `00:02.2 / 01:10.1`), **10 lần evaluate liên tiếp đều timeout ở trần 15 s và trả null** — vòng poll không ghi thêm được mẫu nào, cũng không quan sát được toast nào. Hai lần toast H từng thấy trước đây (+128,4 s probe 69W2; +169,8 s V5) đều rơi **trong khoảng mù này**. Vì vậy "KHÔNG THẤY" ở chạy này không phân biệt được (a) toast xuất hiện sau +84,5 s nhưng harness không thấy, với (b) trial kịp xong nên không có toast.
- Ngay cả trong 84,5 s quan sát được, renderer đã chậm nặng: 3 khoảng trống >5 s giữa các mẫu liên tiếp (1,8→6,9 s; 43,4→49,0 s; 73,2→84,5 s), evalSlow 12/75. Toast tự đóng sau 4,5 s — với khoảng trống mẫu 5–11 s, một toast xuất hiện rồi đóng trong khe hở cũng có thể bị trượt (poll 500 ms chỉ là danh nghĩa khi evaluate chậm).
- Baseline 5,11 + max loadavg 22,35 trong poll: tiền đề harness sai theo đúng luật đã đặt từ V5 → verdict `INCONCLUSIVE-noisy-baseline`, không ghi thành pass hay fail. Số cũ giữ nguyên: probe 69W2 +128,4 s, V5 +169,8 s (đều là điểm dữ liệu "toast H CÓ xuất hiện", không phải pass chính thức).
- `firstTimeTextChangeMs` = 1.809 ms: nhắc lại đính chính đợt 69 §3 — timeText đổi sớm là do playhead chạy độc lập, KHÔNG phải tín hiệu trial xong; số này không dùng để suy ra thời gian trial.
- Không có dấu hiệu bug sản phẩm mới: import OK, phát ngược chạy liền mạch 70 s (playhead đi đều tới 00:02.2), engine webcodecs, không crash, không toast lạ ngoài Bridge toast đã biết. Không sửa code sản phẩm.

## 4. Harness X3 — thay đổi so với probe 69W2

`~/scratch-round68-v5/clicktest-70x3-h.mjs` (ngoài repo, theo mẫu scratch — không đưa vào batch):

- Cửa sổ kỳ vọng H: **75–240 s** (trước: 75–165 s); poll H 240 s (giữ từ probe).
- **Mới — nhìn thấy poll-mù:** `pollToasts` đếm `evalNulls`, log rõ từng lần evaluate trả null (`evaluate mẫu null #N ở +Xs (eval …ms — poll mù, không quan sát được toast)`), và ghi thêm vào JSON: `evalNulls`, `lastSampleAtMs`, `blindGapMs` (wall − mẫu cuối). Mục đích: lần sau không ai đọc nhầm "KHÔNG THẤY" thành bằng chứng vắng toast khi harness thực ra đã mù.
- Không đổi logic verdict, không đổi trần eval 15 s, không đổi cách tính baseline. **Thay đổi này chưa được kiểm chứng bằng một lần chạy thật** (chỉ `node --check` syntax OK) — đợt sau chạy lại H thì nó mới phát huy; ghi rõ để không ai tưởng đã test.
- Đề xuất cho đợt sau (bổ sung §4 đợt 69): (a) chỉ chạy H khi 1-phút loadavg ≤ ~2 **và** không có luồng đợt nào khác đang chạy test/build nặng — kiểm tra `ps` trước khi bấm, không chỉ tin một lần đo loadavg; (b) harness nên abort thành `INCONCLUSIVE-poll-blind` khi `blindGapMs` vượt ~60 s thay vì chạy hết 240 s trong mù; (c) cân nhắc hạ tải H (ít hog/encode hơn) hoặc tách H ra chạy một mình ngoài giờ cao điểm của vòng lặp — trên VM 2 vCPU này, 4 hog + 2 encode 8K + các luồng song song khác là quá sức để renderer đáp evaluate trong 15 s.

## 5. Nợ / giới hạn còn lại

- **Nợ H (đợt 69 §4 mục 3) VẪN MỞ, ở dạng nợ harness + nợ môi trường:** cần một lần chạy H headed với (i) baseline ≤ 3,0, (ii) không mù poll (mẫu cuối gần hết poll), (iii) toast thấy trong 75–240 s — cả ba chưa đạt được lần nào cùng lúc. N + C đã đóng từ đợt 69, không chạy lại trong luồng này.
- Trần worker 90 s / toast 78536 ms / biên tải thấp 28,2 s (U5) không đổi; không có gì mới về keyframe trong đợt này.
- `dist/` không build lại trong lượt này; snapshot `dist-snap-70x3` phục vụ chạy X3 (nằm ở scratch, không đưa vào batch).
- Lưu ý vận hành: `pkill -f "Xvfb :214"` tự kill shell của chính mình (pattern nằm trong cmdline) — lần này đã tránh bằng cách dùng PID cụ thể/không pkill; ghi lại cho đợt sau. EPERM ghi file qua exec không tái diễn trong lượt này (ghi qua exec/`cp` đều OK; file repo ghi bằng file-tools).
- VM reboot ~23:28 UTC (trước lượt này, uptime reset) — không ảnh hưởng chạy X3; sau reboot đã kiểm tra lại Chrome/Xvfb/dist trước khi chạy theo khuyến nghị đợt 69.

## 6. File stage (KHÔNG push)

- `docs/PHASE9_ROUND70_X3_TOAST_HARNESS_LIMITS.md` (file này — deliverable duy nhất của luồng trong repo; không có code sản phẩm đổi).
- Log lượt chạy: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round70-x3.md`.
- Harness/log/JSON click-test ở `~/scratch-round68-v5/` (`clicktest-70x3-h.mjs`, `clicktest-70x3-h.log`, `clicktest-70x3-h.json`) — ngoài repo, theo mẫu scratch, không đưa vào batch.
